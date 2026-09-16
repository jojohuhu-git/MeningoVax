// ─────────────────────────────────────────────────────────────────────────
// DOSE IDENTITY (G2, 2026-09-16)
//
// The provider can be asked, about one specific recorded dose, "was this
// patient at high risk for meningococcal disease when this dose was given?"
// The answer is a clinical judgment about THAT injection on THAT date, and
// the app quotes it back ("confirmed the patient was already high-risk
// on…"). So it has to be stored against the dose itself.
//
// It used to be stored against the dose's POSITION in the chronologically
// sorted list, which is not a property of the dose at all — it changes
// whenever any other dose is added, deleted, or re-dated. Delete the dose
// that was answered and the "yes" slid onto whichever dose landed in that
// slot, which the app then reported as a confirmation nobody had given.
//
// Fix: every dose row created by the app carries an `id`, and the answers
// are keyed by it. Add, delete and re-date now move rows around freely
// without moving anybody's answer.
//
// The ids are per-session counters, not UUIDs, because nothing in this app
// outlives the browser tab — MeningoVax has no URL state and no storage, so
// there is no saved record for an id to have to stay stable across.
// ─────────────────────────────────────────────────────────────────────────

let counter = 0;

/**
 * A new, empty recorded-dose row with its own identity.
 * Every place the app creates a dose row must go through this — a row
 * without an id falls back to positional keying (see doseAnswerKey), which
 * is the bug this module exists to remove.
 */
export function newDoseRow(fields = {}) {
  counter += 1;
  return { id: `d${counter}`, date: '', brand: '', ...fields };
}

/**
 * The key a dose's risk-at-dose answer is stored under.
 *
 * `index` is the fallback for dose objects that were built by hand rather
 * than by `newDoseRow` — the logic fixtures throughout the test suite pass
 * plain `{date, brand}` objects and index-keyed answers, and they describe
 * real clinical cases that are worth keeping exactly as written. Ids are
 * prefixed with a letter so they can never collide with an index.
 */
export function doseAnswerKey(dose, index) {
  return dose?.id ?? index;
}
