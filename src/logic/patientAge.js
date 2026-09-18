// How old the patient is — worked out in one place, from the best thing the
// clinician gave us.
//
// Calendar P1-3 / P2-1 (2026-09-17). The Age step promised, in its own subtitle,
// that "date of birth is recommended: it lets dose dates be checked precisely
// (e.g. against the 16th birthday)" — and then threw the date of birth away,
// keeping only a number of months. Two things followed from that:
//
//   - The 16th-birthday date on the card had to be reconstructed by multiplying
//     months by an averaged 30.4375 days. Measured over 8,400 (date of birth x
//     today) pairs it was exact 37% of the time, one day out 51%, two days out
//     11%, three days out in the rest.
//
//   - The age was computed ONCE, at the moment of typing, against the clock at
//     that instant — while dose validity, "due today" and the future-dated-dose
//     check all read the clock live. A tab left open across midnight held a
//     patient who did not age while the calendar did.
//
// Keeping the date of birth and deriving the age from it at render fixes both,
// and is what lets the app know what "before birth" means for a recorded dose
// (impossible-entries P1-1).
//
// A patient entered as years/months is unchanged, deliberately: the app does not
// know their birthday, so it must not start printing exact dates for them.
import { dobToAgeMonths } from './format.js';

/**
 * The patient's age in months, now.
 *
 * @param {object} patient        anything carrying `dob` and/or `ageMonths`
 * @param {string} [today]        reference date; defaults to the clock
 * @returns {number|null}         age in months, or null if nothing was entered
 */
export function patientAgeMonths(patient, today) {
  if (!patient) return null;
  // The date of birth wins whenever there is one: a stored ageMonths is a
  // snapshot of it, and a snapshot must never outrank the thing it came from.
  if (patient.dob) {
    const am = dobToAgeMonths(patient.dob, today);
    if (am != null) return am;
  }
  return patient.ageMonths ?? null;
}
