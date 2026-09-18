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
import { calendarMonthsBetween } from './dateUtils.js';

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

/**
 * How old the patient was at a past dose, in months.
 *
 * Calendar P2-2 (2026-09-17). This used to be worked out by subtraction, in
 * three separate hand-written copies (recommend.js, seriesTotals.js and
 * validate.js's ageAtDoseFromDate):
 *
 *   ageAtDose = ageMonths - calendarMonthsBetween(doseDate, today)
 *
 * Both terms there are exact, but they are measured between DIFFERENT pairs of
 * month-anniversaries — the patient's own, and the dose date's. Subtracting one
 * from the other mixes two rulers, and the answer came out up to 2.946 days
 * wrong (more than a day wrong in 2.9% of 50,845 sampled combinations).
 *
 * Where the answer is only compared against a minimum age that is entitled to
 * CDC's 4-day grace, three days does not change a verdict. The infant band
 * tests get no grace — they are plain comparisons that decide HOW MANY DOSES a
 * child needs — so the error landed on the dose count in both directions: a
 * baby dosed exactly on their seven-month anniversary was read as 6.97 months
 * and asked for four doses instead of two, and a baby whose dose 2 fell a day
 * short of seven months was read as exactly 7.0000 and had their series closed
 * a dose early.
 *
 * With the date of birth kept (calendar P1-3), the exact answer is one call:
 * measure from the birthday to the dose, on the patient's own anniversaries —
 * the same ruler everything else uses. A patient entered as years/months has no
 * birthday to measure from, so they keep the subtraction: it is the best the
 * app can honestly do for them, and it is unchanged.
 *
 * A dose dated before birth comes back NEGATIVE rather than null, on both
 * paths, because that is how callers detect it.
 *
 * @param {{date?: ?string, ageMonths?: ?number}} dose
 * @param {{dob?: ?string, ageMonths?: ?number}} patient
 * @param {string} [today]   reference date, used only on the fallback path
 * @returns {number|null}    age in months at the dose, or null if unknowable
 */
export function ageAtDoseMonths(dose, patient, today) {
  // An age recorded directly on the dose outranks any arithmetic: it is what
  // the clinician typed, not something derived from a date.
  if (typeof dose?.ageMonths === 'number') return dose.ageMonths;
  if (!dose?.date) return null;
  if (patient?.dob) return round6(calendarMonthsBetween(patient.dob, dose.date));
  const am = patient?.ageMonths;
  if (am == null) return null;
  return round6(am - calendarMonthsBetween(dose.date, today));
}

// Subtracting two large nearly-equal floats (both ~months since a distant
// birthday) leaves binary floating-point noise — 119.99999999999999 instead of
// 120 — which would still trip a "< 120 months" threshold by less than a
// microsecond's worth of age. Six decimal places is far finer than a day and
// far coarser than the noise.
function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}
