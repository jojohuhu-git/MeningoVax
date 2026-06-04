import React, { useState } from 'react';
import { ageGroup as deriveGroup, dobToAgeMonths } from '../logic/format.js';

const AGE_GROUP_CHIPS = [
  { label: 'Infant (<2y)',      minM: 0,   maxM: 23,  defaultM: 6 },
  { label: 'Child (2–10y)',     minM: 24,  maxM: 119, defaultM: 72 },
  { label: 'Adolescent (11–18y)', minM: 132, maxM: 215, defaultM: 168 },
  { label: 'Adult (19+)',       minM: 228, maxM: null, defaultM: 276 },
];

export default function StepAge({ ageMonths, ageGroup, error, onChange }) {
  // Mode: 'chip' | 'precise' | 'dob'
  const [mode, setMode] = useState('chip');
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const [dob, setDob] = useState('');

  function selectChip(chip) {
    const am = chip.defaultM;
    onChange({ ageMonths: am, ageGroup: deriveGroup(am) });
  }

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
      <div className="step-sub">Select an age group or enter a precise age</div>

      {/* Quick chips */}
      <div className="age-chips">
        {AGE_GROUP_CHIPS.map(chip => (
          <button
            key={chip.label}
            className={`age-chip${ageGroup === chip.label ? ' selected' : ''}`}
            onClick={() => { setMode('chip'); selectChip(chip); setYears(''); setMonths(''); setDob(''); }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="dob-divider">— or enter precise age —</div>

      {/* Precise entry tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          className={`history-toggle-btn${mode === 'precise' ? ' selected' : ''}`}
          style={{ flex: 'none', minHeight: 36, padding: '0 14px', fontSize: '0.85rem' }}
          onClick={() => { setMode('precise'); setDob(''); onChange({ ageMonths: null, ageGroup: null }); }}
        >
          Years / Months
        </button>
        <button
          className={`history-toggle-btn${mode === 'dob' ? ' selected' : ''}`}
          style={{ flex: 'none', minHeight: 36, padding: '0 14px', fontSize: '0.85rem' }}
          onClick={() => { setMode('dob'); setYears(''); setMonths(''); onChange({ ageMonths: null, ageGroup: null }); }}
        >
          Date of Birth
        </button>
      </div>

      {mode === 'precise' && (
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
      )}

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

      {derivedGroup && (
        <div style={{ marginTop: 12 }}>
          <span className="age-badge">
            {ageMonths != null ? `${Math.round(ageMonths * 10) / 10} months` : ''}{' '}
            · {derivedGroup}
          </span>
        </div>
      )}

      {error && <div className="age-error">{error}</div>}
    </div>
  );
}
