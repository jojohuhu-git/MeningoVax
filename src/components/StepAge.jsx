import React, { useState } from 'react';
import { ageGroup as deriveGroup, dobToAgeMonths, fmtAgeMonths } from '../logic/format.js';
// Impossible-entries P0-1: what counts as an age a human being can be. Both
// entry boxes ask the same module, so the two doors cannot drift apart.
import { ageEntryProblem } from '../logic/ageEntry.js';

// A2: date of birth is the primary, recommended entry — it lets the engine
// compute a dose's age precisely (e.g. "was this MenACWY dose given on/after
// the 16th birthday?"). A coarse age-band guess can silently contradict a
// dose date entered later, so there is no separate age-band question anymore;
// the band shown below is always derived from the entered age.
export default function StepAge({ ageMonths, error, onChange }) {
  // Mode: 'precise' | 'dob'
  const [mode, setMode] = useState('dob');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const [dob, setDob] = useState('');
  // P0-1: what is wrong with what has been typed, shown as it is typed. Kept
  // apart from the `error` prop, which App sets when Next is pressed with
  // nothing entered at all — a different situation needing a different sentence.
  const [entryError, setEntryError] = useState(null);

  // P0-1: an impossible age is refused as it is typed, not waved through to a
  // card that looks ordinary. When there is a problem the age is cleared as well
  // as reported, so Next stays shut and no recommendation can be built from it.
  function applyPrecise(y, m) {
    const problem = ageEntryProblem({ mode: 'precise', years: y, months: m });
    setEntryError(problem);
    const yn = parseFloat(y);
    const mn = parseFloat(m);
    if (problem || (isNaN(yn) && isNaN(mn))) {
      onChange({ ageMonths: null, ageGroup: null, dob: null });
      return;
    }
    const am = (isNaN(yn) ? 0 : yn) * 12 + (isNaN(mn) ? 0 : mn);
    // No date of birth in this mode: the app genuinely does not know it, and
    // must not print dates as though it did (calendar P1-3).
    onChange({ ageMonths: am, ageGroup: deriveGroup(am), dob: null });
  }

  function handleYearsChange(v) {
    setYears(v);
    applyPrecise(v, months);
  }

  function handleMonthsChange(v) {
    setMonths(v);
    applyPrecise(years, v);
  }

  function handleDobChange(v) {
    setDob(v);
    const problem = ageEntryProblem({ mode: 'dob', dob: v });
    setEntryError(problem);
    if (v && !problem) {
      const am = dobToAgeMonths(v);
      if (am != null && am >= 0) {
        // Calendar P1-3: the date of birth is KEPT, not converted and discarded.
        // It is what lets the 16th-birthday date be the real one, lets the
        // patient go on ageing while the tab stays open, and lets the app know
        // what "before birth" means for a recorded dose.
        onChange({ ageMonths: am, ageGroup: deriveGroup(am), dob: v });
        return;
      }
    }
    onChange({ ageMonths: null, ageGroup: null, dob: null });
  }

  const derivedGroup = ageMonths != null ? deriveGroup(ageMonths) : null;

  return (
    <div className="step-card">
      <div className="step-title">Patient Age</div>
      <div className="step-sub">Date of birth is recommended: it lets dose dates be checked precisely (e.g. against the 16th birthday)</div>

      {/* Entry mode tabs — DOB first/default; Years/Months is the fallback for when DOB is genuinely unknown */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          className={`history-toggle-btn${mode === 'dob' ? ' selected' : ''}`}
          style={{ flex: 'none', minHeight: 36, padding: '0 14px', fontSize: '0.85rem' }}
          onClick={() => { setMode('dob'); setYears(''); setMonths(''); setEntryError(null); onChange({ ageMonths: null, ageGroup: null, dob: null }); }}
        >
          Date of Birth
        </button>
        <button
          className={`history-toggle-btn${mode === 'precise' ? ' selected' : ''}`}
          style={{ flex: 'none', minHeight: 36, padding: '0 14px', fontSize: '0.85rem' }}
          onClick={() => { setMode('precise'); setDob(''); setEntryError(null); onChange({ ageMonths: null, ageGroup: null, dob: null }); }}
        >
          Years / Months (if DOB unknown)
        </button>
      </div>

      {mode === 'dob' && (
        <div className="age-field">
          <label htmlFor="dob-input">Date of Birth</label>
          <input
            id="dob-input"
            type="date"
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => handleDobChange(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
      )}

      {mode === 'precise' && (
        <>
        <div className="age-precise-hint">
          Approximate age only. Without a date of birth, the app can't verify whether a
          recorded dose was given on/after a specific birthday (e.g. the 16-year MenACWY
          booster). Enter the date of birth above when it's available.
        </div>
        <div className="age-row">
          <div className="age-field">
            <label htmlFor="age-years">Years</label>
            <input
              id="age-years"
              type="number"
              min="0"
              max="120"
              placeholder="0"
              value={years}
              onChange={e => handleYearsChange(e.target.value)}
            />
          </div>
          <div className="age-field">
            <label htmlFor="age-months">Months (optional)</label>
            <input
              id="age-months"
              type="number"
              min="0"
              max="11"
              placeholder="0"
              value={months}
              onChange={e => handleMonthsChange(e.target.value)}
            />
          </div>
        </div>
        </>
      )}

      {derivedGroup && (
        <div style={{ marginTop: 12 }}>
          <span className="age-badge">
            {ageMonths != null ? fmtAgeMonths(ageMonths) : ''}{' '}
            · {derivedGroup}
          </span>
        </div>
      )}

      {/* The specific message wins: "check the year" is more use than "enter a
          valid age", and showing both at once would be noise. */}
      {(entryError || error) && <div className="age-error">{entryError || error}</div>}
    </div>
  );
}
