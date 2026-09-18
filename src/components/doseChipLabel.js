// What the chip on a recorded dose says — written down once.
//
// This is display wording, not clinical logic: every input here has already
// been decided by validate.js (`analyzeHistory`) and recommend.js. Nothing in
// this file may compute a rule. It chooses words for a verdict already made.
//
// It exists because the wording had TWO copies. RecCard.jsx rendered the chip,
// and sweep-dose-counter.test.js kept its own version under a comment promising
// it "mirrors RecCard.jsx's DoseValidation chip logic exactly". Over that
// sweep's own grid the two disagreed on 20,167 of 95,928 rows -- the component
// said "Booster", the test said "Booster (dose 3)" -- and the test whose job is
// to prove the chip never implies N > M was the one printing N.
//
// The order of the branches below is load-bearing and is documented at each one.
// Callers ask for the whole label; they do not re-derive any part of it.
//
// F5 (2026-09-14 dose-counter handoff): there used to be a catch-all 'Counts'
// label for states nobody had enumerated -- this app's own dead wording, already
// removed everywhere else by C2 (2026-07-24). Every state below is named by the
// engine and has an explicit label, and there is no catch-all. If a new engine
// state appears, it falls to 'Unknown' at the bottom, which is visible rather
// than plausible.

/** Rows that are not a clinical finding at all, but an entry that cannot be right. */
export const RECORD_PROBLEM_LABELS = {
  future: 'Date is in the future — not counted',
  duplicate: 'Entered twice — this row not counted',
  // Impossible-entries P1-1: same shape as the future-dated chip, because it is
  // the same mistake pointing the other way.
  'before-birth': 'Dated before birth — not counted',
};

/** The chip on a dose still waiting on the risk-at-dose question. */
export const NEEDS_INPUT_LABEL = 'Needs input';

/**
 * The chip text for one recorded dose.
 *
 * @param {object|null} result     one entry of `analyzeHistory().perDose`
 * @param {number|null} seriesTotal the total this patient's series runs to, or
 *                                  null when this vaccine is not indicated
 * @returns {string|null} the label, or null when there is nothing to show
 */
export function doseChipLabel(result, seriesTotal) {
  if (!result) return null;
  const {
    status, effectiveDoseNum, notAdolescentCount,
    extraDose, extraDoseUnverified, recordProblem,
  } = result;

  if (status === 'pending') return NEEDS_INPUT_LABEL;

  // G3/G7 (2026-09-16): FIRST, and ahead of every clinical state. A row with a
  // future or duplicated date is a typo. Labelling it "Invalid" or
  // "Off-window - repeat" sends the reader hunting for a clinical mistake.
  if (recordProblem) return RECORD_PROBLEM_LABELS[recordProblem];

  // Owner-agreed wording, 2026-07-23 handoff. Not to be reworded by a copy pass.
  if (notAdolescentCount) return 'Off-window - repeat';

  // G6 (2026-09-16): before the assertive version below. With no date the app
  // cannot tell an extra dose from a series dose whose date is missing, so it
  // asks instead of announcing.
  if (extraDoseUnverified) return 'Extra dose? — no date recorded';

  // U4 (2026-09-17): says what is true of the patient. The earlier wording,
  // "beyond the indicated series total", read out `seriesTotal` -- the code's
  // own variable name -- in the interface.
  if (extraDose) return 'Extra dose — more than this series needs';

  if (status === 'valid') {
    // U4 (2026-09-17): was "Recorded -- not part of an indicated series", which
    // described the RECORD rather than the patient.
    if (seriesTotal == null) return 'Given — not part of a series this patient needs';
    if (effectiveDoseNum <= seriesTotal) return `Dose ${effectiveDoseNum} of ${seriesTotal}`;
    // F2/F5 (2026-09-14): a valid dose past the total on a schedule that HAS a
    // booster phase. analyzeHistory deliberately does not cap effectiveDoseNum
    // here, so the number is larger than the total -- printing it is precisely
    // the "chip shows N > M" bug. The chip says "Booster" and no number.
    return 'Booster';
  }

  return status === 'invalid' ? 'Invalid' : 'Unknown';
}

/** The chip's CSS class, which follows the same verdict. */
export function doseChipClass({ status, notAdolescentCount, extraDose }) {
  if (notAdolescentCount || extraDose) return 'dose-val-chip dose-val-offwindow';
  if (status === 'valid') return 'dose-val-chip dose-val-valid';
  if (status === 'invalid') return 'dose-val-chip dose-val-invalid';
  return 'dose-val-chip dose-val-unknown';
}
