import React, { useState } from 'react';
import { ageGroup as deriveGroup, dobToAgeMonths, fmtAgeMonths } from '../logic/format.js';

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

  function handleYearsChange(v) {
    setYears(v);
    const y = parseFloat(v);
    const m = parseFloat(months) || 0;
    if (!isNaN(y) && y >= 0) {
      const am = y * 12 + m;
      onChange({ ageMonths: am, ageGroup: deriveGroup(am) });
    } else {
      onChange({ ageMonths: null, ageGroup: null });
    }
  }

  function handleMonthsChange(v) {
    setMonths(v);
    const y = parseFloat(years) || 0;
    const m = parseFloat(v);
    if (!isNaN(m) && m >= 0) {
      const am = y * 12 + m;
      onChange({ ageMonths: am, ageGroup: deriveGroup(am) });
    }
  }

  function handleDobChange(v) {
    setDob(v);
    if (v) {
      const am = dobToAgeMonths(v);
      if (am != null && am >= 0) {
        onChange({ ageMonths: am, ageGroup: deriveGroup(am) });
      } else {
        onChange({ ageMonths: null, ageGroup: null });
      }
    } else {
      onChange({ ageMonths: null, ageGroup: null });
    }
  }

  const derivedGroup = ageMonths != null ? deriveGroup(ageMonths) : null;

  return (
    <div className="step-card">
      <div className="step-title">Patient Age</div>
      <div className="step-sub">Date of birth is recommended — it lets dose dates be checked precisely (e.g. against the 16th birthday)</div>

      {/* Entry mode tabs — DOB first/default; Years/Months is the fallback for when DOB is genuinely unknown */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          className={`history-toggle-btn${mode === 'dob' ? ' selected' : ''}`}
          style={{ flex: 'none', minHeight: 36, padding: '0 14px', fontSize: '0.85rem' }}
          onClick={() => { setMode('dob'); setYears(''); setMonths(''); onChange({ ageMonths: null, ageGroup: null }); }}
        >
          Date of Birth
        </button>
        <button
          className={`history-toggle-btn${mode === 'precise' ? ' selected' : ''}`}
          style={{ flex: 'none', minHeight: 36, padding: '0 14px', fontSize: '0.85rem' }}
          onClick={() => { setMode('precise'); setDob(''); onChange({ ageMonths: null, ageGroup: null }); }}
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
          Approximate age only — without a date of birth, the app can't verify whether a
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

      {error && <div className="age-error">{error}</div>}
    </div>
  );
}
