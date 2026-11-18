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

/**
 * Rows that are not a clinical finding at all, but an entry that cannot be
 * right — or, for `undated`, an entry that cannot be counted (STOP C C1,
 * 2026-11-15: only written, dated records count).
 */
export const RECORD_PROBLEM_LABELS = {
  undated: 'No date recorded — not counted',
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
    status, effectiveDoseNum, notAdolescentCount, setAsideBeforeAgeY,
    extraDose, recordProblem,
  } = result;

  if (status === 'pending') return NEEDS_INPUT_LABEL;

  // G3/G7 (2026-09-16): FIRST, and ahead of every clinical state. A row with a
  // future or duplicated date is a typo. Labelling it "Not counted — repeat"
  // sends the reader hunting for a clinical mistake.
  if (recordProblem) return RECORD_PROBLEM_LABELS[recordProblem];

  // OWNER, STOP E1 Q6 (2026-11-17), replacing "Off-window - repeat" (2026-07-23):
  // the label names the age line the dose fell short of. It does not say
  // "repeat" or "do not repeat": the card says what is owed. (PneumoVax's
  // "Not counted — PCV7" is the same idea.) The engine stamps the line.
  if (notAdolescentCount) return `Not counted — given before age ${setAsideBeforeAgeY}`;

  // OWNER, STOP E1 Q8 (2026-11-17): PneumoVax's wording, replacing
  // "Extra dose — more than this series needs".
  if (extraDose) return 'Not counted — Extra. Do not repeat.';

  if (status === 'valid') {
    // OWNER, STOP E1 Q9 (2026-11-17): no series is running, so the dose number
    // alone, as PneumoVax shows it. Was "Given — not part of a series this
    // patient needs", which read as if the dose had been a mistake.
    // A counted dose always carries its number (sweep-dose-counter checks);
    // without one, say so visibly rather than print "Dose undefined".
    if (effectiveDoseNum == null) return 'Unknown';
    if (seriesTotal == null) return `Dose ${effectiveDoseNum}`;
    if (effectiveDoseNum <= seriesTotal) return `Dose ${effectiveDoseNum} of ${seriesTotal}`;
    // F2/F5 (2026-09-14): a valid dose past the total on a schedule that HAS a
    // booster phase. analyzeHistory deliberately does not cap effectiveDoseNum
    // here, so the number is larger than the total -- printing it is precisely
    // the "chip shows N > M" bug. The chip says "Booster" and no number.
    // OWNER, STOP E1 Q7 (2026-11-17): keep "Booster", MeningoVax's own label
    // (PneumoVax has no boosters).
    return 'Booster';
  }

  // OWNER, STOP E1 Q5 (2026-11-17): a dose that did not count, too soon or too
  // young, is repeated: "Not counted — repeat". Not PneumoVax's "do not repeat"
  // for a too-soon dose: "For Menveo saying do not repeat and then giving the
  // next due date is confusing." CDC: such doses "should be repeated as age
  // appropriate".
  // OWNER, STOP E1 Q10 (2026-11-17): when no card asks for that vaccine, the
  // engine marks the dose `notRepeated`: nothing is owed, so "do not repeat"
  // (PneumoVax's word for a dose the patient never needed).
  if (status === 'invalid') return result.notRepeated ? 'Not counted — do not repeat' : 'Not counted — repeat';
  return 'Unknown';
}

/** The chip's CSS class, which follows the same verdict. */
export function doseChipClass({ status, notAdolescentCount, extraDose }) {
  if (notAdolescentCount || extraDose) return 'dose-val-chip dose-val-offwindow';
  if (status === 'valid') return 'dose-val-chip dose-val-valid';
  if (status === 'invalid') return 'dose-val-chip dose-val-invalid';
  return 'dose-val-chip dose-val-unknown';
}
