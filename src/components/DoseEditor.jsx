import React, { useRef, useEffect } from 'react';
import { menbFamily } from '../data/brands.js';

// Shared row/note renderer for recorded-dose editing, used by both the
// wizard (StepHistory) and the Results "Recorded doses" inline panel.
// Item 5 (2026-07-23): these had drifted -- only StepHistory showed the
// MenB family-lock guidance. Moving that detection here means both
// surfaces get it automatically and can't drift again.
export default function DoseEditor({
  vaccine,
  doses,
  onChange,
  brandOptions,
  addDoseLabel = '+ Add dose',
  addAccessKey,
  removeLabel,
  emptyMessage,
  rowClassName,
  onFocusCapture,
}) {
  const listRef = useRef(null);
  const prevLengthRef = useRef(doses.length);

  // Item 1: focus the new row's date input, but only when a row was just
  // ADDED (length grew) -- not on mount and not on remove.
  useEffect(() => {
    if (doses.length > prevLengthRef.current) {
      const inputs = listRef.current?.querySelectorAll('input[type="date"]');
      const last = inputs?.[inputs.length - 1];
      last?.focus();
    }
    prevLengthRef.current = doses.length;
  }, [doses.length]);

  function addDose() {
    onChange([...doses, { date: '', brand: '' }]);
  }
  function removeDose(idx) {
    onChange(doses.filter((_, i) => i !== idx));
  }
  function updateDose(idx, field, value) {
    onChange(doses.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  }

  const firstBrand = vaccine === 'MenB' ? (doses[0]?.brand || '') : '';
  const lockedFamily = vaccine === 'MenB' ? menbFamily(firstBrand) : null;
  const familyLabel = lockedFamily === '4C'
    ? 'Family locked: MenB-4C (continue with Bexsero or Penmenvy)'
    : lockedFamily === 'FHbp'
    ? 'Family locked: MenB-FHbp (continue with Trumenba or Penbraya)'
    : null;

  return (
    <div onFocusCapture={onFocusCapture}>
      {doses.length === 0 && emptyMessage && (
        <div className="dose-history-empty">{emptyMessage}</div>
      )}

      <div className="dose-list" ref={listRef}>
        {doses.map((dose, idx) => (
          <div key={idx} className={`dose-row${rowClassName ? ` ${rowClassName}` : ''}`}>
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
              aria-label={removeLabel ? removeLabel(idx) : `Remove dose ${idx + 1}`}
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

      <div className="add-dose-row">
        <button
          className="add-dose-btn"
          onClick={addDose}
          accessKey={addAccessKey}
          title={addAccessKey ? 'Add dose (Ctrl/Cmd+A)' : undefined}
        >
          {addDoseLabel}
        </button>
        <span className="shortcut-hint">Ctrl/Cmd+A</span>
      </div>
    </div>
  );
}
