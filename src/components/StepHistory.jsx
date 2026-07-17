import React, { useState, useEffect } from 'react';
import { menbFamily } from '../data/brands.js';

export default function StepHistory({ vaccine, doses, onChange, brandOptions }) {
  const [hasHistory, setHasHistory] = useState(doses.length > 0 ? true : null);

  function addDose() {
    onChange([...doses, { date: '', brand: '' }]);
  }

  // B7: Ctrl+A (Cmd+A on Mac) adds a dose row, overriding the browser's
  // default "select all" while this step is recording history.
  useEffect(() => {
    if (hasHistory !== true) return;
    function handleKeydown(e) {
      const isAddDoseShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a';
      if (isAddDoseShortcut) {
        e.preventDefault();
        onChange([...doses, { date: '', brand: '' }]);
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [hasHistory, doses, onChange]);

  function removeDose(idx) {
    onChange(doses.filter((_, i) => i !== idx));
  }

  function updateDose(idx, field, value) {
    const updated = doses.map((d, i) => i === idx ? { ...d, [field]: value } : d);
    onChange(updated);
  }

  function handleYes() {
    setHasHistory(true);
  }

  function handleNo() {
    setHasHistory(false);
    onChange([]);
  }

  // MenB family lock detection
  const firstBrand = vaccine === 'MenB' ? (doses[0]?.brand || '') : '';
  const lockedFamily = vaccine === 'MenB' ? menbFamily(firstBrand) : null;

  const familyLabel = lockedFamily === '4C'
    ? 'Family locked: MenB-4C (continue with Bexsero or Penmenvy)'
    : lockedFamily === 'FHbp'
    ? 'Family locked: MenB-FHbp (continue with Trumenba or Penbraya)'
    : null;

  return (
    <div className="step-card">
      <div className="step-title">
        {vaccine === 'MenACWY' ? 'MenACWY History' : 'MenB History'}
      </div>
      <div className="step-sub">
        Has the patient received any {vaccine} vaccine?
      </div>

      <div className="history-toggle">
        <button
          className={`history-toggle-btn${hasHistory === false ? ' selected' : ''}`}
          onClick={handleNo}
        >
          No previous doses
        </button>
        <button
          className={`history-toggle-btn${hasHistory === true ? ' selected' : ''}`}
          onClick={handleYes}
        >
          Yes, record doses
        </button>
      </div>

      {hasHistory === true && (
        <>
          <div className="dose-list">
            {doses.map((dose, idx) => (
              <div key={idx} className="dose-row">
                <div className="dose-field">
                  <label>Date (optional)</label>
                  <input
                    type="date"
                    value={dose.date || ''}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => updateDose(idx, 'date', e.target.value)}
                  />
                </div>
                <div className="dose-field">
                  <label>Brand (optional)</label>
                  <select
                    value={dose.brand || ''}
                    onChange={e => updateDose(idx, 'brand', e.target.value)}
                  >
                    <option value="">Unknown brand</option>
                    {brandOptions
                      .filter(b => b.key !== undefined)
                      .filter(b => b.key !== '')
                      .map(b => (
                        <option key={b.key} value={b.key}>{b.label}</option>
                      ))
                    }
                  </select>
                </div>
                <button
                  className="dose-remove"
                  onClick={() => removeDose(idx)}
                  aria-label={`Remove dose ${idx + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {vaccine === 'MenB' && doses.length > 0 && familyLabel && (
            <div className="family-note">{familyLabel}</div>
          )}

          {vaccine === 'MenB' && doses.length > 0 && !lockedFamily && doses[0]?.brand === '' && (
            <div className="family-note" style={{ borderLeftColor: 'var(--gy4)', background: 'var(--gy6)', color: 'var(--gy3)' }}>
              Brand unknown: both MenB families remain open. Once a brand is selected for dose 1, the engine will lock the series to that antigen family.
            </div>
          )}

          <button className="add-dose-btn" onClick={addDose} accessKey="a" title="Add dose (Ctrl/Cmd+A)">
            {/* E7: one child span, not three sibling nodes — the button is
                display:flex with a gap, which was inserting extra space
                between every child, including the anonymous text nodes
                around <u>, visually splitting "Add" into "A" + gap + "dd". */}
            <span>+ <u>A</u>dd dose</span>
          </button>
        </>
      )}

      {hasHistory === null && (
        <div style={{ color: 'var(--gy4)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: 4 }}>
          Select yes or no above
        </div>
      )}
    </div>
  );
}
