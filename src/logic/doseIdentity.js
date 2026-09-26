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
 * A row the clinician added but never filled in.
 *
 * K1 (2026-09-24): clicking "+ Add dose" and typing nothing used to put a
 * dose of unknown date into the record — it moved a healthy 16-year-old's
 * MenACWY card from catch-up to booster-due before a single character had
 * been typed.
 *
 * An empty row used to mean two different things, and the app could not tell
 * them apart: "I haven't typed yet" and "this patient definitely had a dose,
 * but I have no card, so I don't know when or which". The second is a real
 * clinical entry this app supports (see the undated-dose rules G6 and G8), so
 * the row now carries `detailsUnknown` when the clinician ticks "A dose was
 * given, but the date and brand are unknown". A row with that tick is a dose;
 * a row without it, and with nothing typed in, is not.
 *
 * A row with only ONE of the two fields is deliberately NOT blank either: a
 * brand with no date is a real injection whose date the clinician does not
 * have, and a date with no brand is a real injection of an unrecorded brand.
 * The engine already grades both correctly.
 */
export function isBlankDoseRow(d) {
  if (!d) return true;
  // "Carries nothing at all", rather than a list of the fields we happen to
  // know about today. A dose row can hold more than a date and a brand — the
  // engine also reads `ageMonths` (age at the dose, for a record with no
  // dates) — and the cost of the two mistakes is not symmetrical: keeping an
  // empty row is the bug being fixed here, but discarding a row that holds
  // real information would delete a dose the clinician recorded. So anything
  // present and meaningful keeps the row, including a field added later.
  // `id` is not information: every row gets one the moment it is created.
  return Object.entries(d).every(([key, value]) =>
    key === 'id' || value === '' || value === null || value === undefined || value === false);
}

/**
 * The same list with every untouched row removed — not just a trailing one.
 * Used when the clinician leaves a list of dose rows behind (a history step,
 * or the Results "Recorded doses" panel), never while they are still in it.
 */
export function dropBlankDoseRows(doses) {
  return (doses ?? []).filter((d) => !isBlankDoseRow(d));
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
