import React, { useRef, useEffect } from 'react';
import { menbFamily } from '../data/brands.js';
import { isPentavalentBrand } from '../logic/pentavalentCredit.js';
import { sortDosesChronologically } from '../logic/validate.js';
import { todayISO } from '../logic/dateUtils.js';
import { newDoseRow } from '../logic/doseIdentity.js';

// Shared row/note renderer for recorded-dose editing, used by both the
// wizard (StepHistory) and the Results "Recorded doses" inline panel.
// Item 5 (2026-07-23): these had drifted -- only StepHistory showed the
// MenB family-lock guidance. Moving that detection here means both
// surfaces get it automatically and can't drift again.
// G1 (2026-09-16): a pentavalent (Penbraya/Penmenvy) is one injection covering
// both vaccines, and it is only ever typed into ONE of the two history lists.
// This note tells the other list that the dose is already counted there —
// otherwise a clinician looking at an empty MenB list records the same shot a
// second time. It lives outside DoseEditor because it must show even when the
// list is collapsed or answered "No previous doses", which is exactly the case
// where the double entry happens.
export function PentavalentCreditNote({ vaccine, creditedDoses = [] }) {
  const credited = creditedDoses.filter((d) => isPentavalentBrand(d?.brand));
  if (credited.length === 0) return null;
  const other = vaccine === 'MenB' ? 'MenACWY' : 'MenB';
  const one = credited.length === 1;
  return (
    <div className="family-note" data-testid="pentavalent-credited-here">
      {one
        ? `A pentavalent dose recorded on the ${other} step counts as a ${vaccine} dose too, and is already included here.`
        : `${credited.length} pentavalent doses recorded on the ${other} step count as ${vaccine} doses too, and are already included here.`}
      {' '}Add a row below only for a different injection.
    </div>
  );
}

export default function DoseEditor({
  vaccine,
  doses,
  onChange,
  brandOptions,
  // G1 (2026-09-16): pentavalent doses recorded on the OTHER vaccine's step,
  // which already count here. They are not rows — they can't be edited from this
  // list — but the clinician has to be told they're counted, or they will record
  // the same injection twice.
  creditedDoses = [],
  addDoseLabel = '+ Add dose',
  removeLabel,
  emptyMessage,
  rowClassName,
  // calendar P2-1: "now" is App.jsx's job. A caller that already knows the
  // render's today (StepHistory, Results) passes it down; the fallback below
  // exists only for a component test that mounts DoseEditor on its own.
  today: todayProp,
}) {
  const listRef = useRef(null);
  const prevLengthRef = useRef(doses.length);
  const today = todayProp || todayISO();

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
    // G2: newDoseRow, not a bare object — the row needs its own id so a
    // risk-at-dose answer can be pinned to it rather than to its position.
    onChange([...doses, newDoseRow()]);
  }
  function removeDose(idx) {
    onChange(doses.filter((_, i) => i !== idx));
  }
  function updateDose(idx, field, value) {
    onChange(doses.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  }

  // The MenB antigen family is set by the FIRST dose in the series, which may be
  // a pentavalent recorded on the MenACWY step (G1) — so the lock is read from
  // this list and the credited doses together, ordered by the validator's own
  // sort rather than a second copy of it.
  const menbSeriesSoFar = vaccine === 'MenB'
    ? sortDosesChronologically([...doses, ...creditedDoses].filter(Boolean))
    : [];
  const firstBrand = menbSeriesSoFar[0]?.brand || '';
  const lockedFamily = vaccine === 'MenB' ? menbFamily(firstBrand) : null;
  const otherVaccine = vaccine === 'MenB' ? 'MenACWY' : 'MenB';
  const pentavalentHere = doses.some((d) => isPentavalentBrand(d?.brand));
  const creditedHere = creditedDoses.filter((d) => isPentavalentBrand(d?.brand));
  const familyLabel = lockedFamily === '4C'
    ? 'Family locked: MenB-4C (continue with Bexsero or Penmenvy)'
    : lockedFamily === 'FHbp'
    ? 'Family locked: MenB-FHbp (continue with Trumenba or Penbraya)'
    : null;

  return (
    <div>
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
                // G3: todayISO(), not new Date().toISOString() — the latter is
                // UTC and is a day ahead of the clinician any evening in a
                // UTC-behind timezone, so the picker would refuse today's date.
                max={today}
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
              type="button"
              className="dose-remove"
              onClick={() => removeDose(idx)}
              aria-label={removeLabel ? removeLabel(idx) : `Remove dose ${idx + 1}`}
            >
              ×
            </button>
            {/* K1 (2026-09-24): an empty row means two things — "I haven't
                typed yet" and "a dose was given, but I have no card". The app
                cannot tell them apart, and it used to guess the second, so a
                row nobody had touched was graded as a dose of unknown date.
                The clinician now says which it is. The tick appears only while
                the row is otherwise empty, because that is the only case where
                the two readings differ. */}
            {!dose.date && !dose.brand && (
              <label className="dose-row-unknown">
                <input
                  type="checkbox"
                  className="risk-checkbox"
                  checked={!!dose.detailsUnknown}
                  onChange={e => updateDose(idx, 'detailsUnknown', e.target.checked)}
                />
                <span>
                  A dose was given, but the date and brand are unknown.
                  <span className="dose-row-unknown-hint">
                    Tick this to keep the dose on the record. An empty row is
                    removed when you continue.
                  </span>
                </span>
              </label>
            )}

            {/* G3: the `max` above stops the date PICKER offering a future day,
                but a typed or pasted date walks straight past it. Say so where
                the date was entered, not only on the results card. */}
            {dose.date && dose.date > today && (
              <div className="dose-row-problem" data-testid="dose-date-in-future">
                This date is in the future, so this dose is not counted. Check the
                date — if the patient has not had this dose yet, leave it out.
              </div>
            )}
          </div>
        ))}
      </div>

      {pentavalentHere && (
        <div className="family-note" data-testid="pentavalent-covers-both">
          Penbraya and Penmenvy are a single shot that covers both MenACWY and MenB.
          This one entry counts as a {otherVaccine} dose as well — do not record it
          again on the {otherVaccine} step.
        </div>
      )}

      {vaccine === 'MenB' && (doses.length > 0 || creditedHere.length > 0) && familyLabel && (
        <div className="family-note">{familyLabel}</div>
      )}

      {vaccine === 'MenB' && doses.length > 0 && !lockedFamily && doses[0]?.brand === '' && (
        <div className="family-note" style={{ borderLeftColor: 'var(--gy4)', background: 'var(--gy6)', color: 'var(--gy3)' }}>
          Brand unknown: both MenB families remain open. Once a brand is selected for dose 1, the engine will lock the series to that antigen family.
        </div>
      )}

      <div className="add-dose-row">
        <button
          type="button"
          className="add-dose-btn"
          onClick={addDose}
          title="Add dose"
        >
          {addDoseLabel}
        </button>
      </div>
    </div>
  );
}
