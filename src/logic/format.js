// format.js — UI display helpers (not clinical logic)

import { todayISO, calendarMonthsBetween } from './dateUtils.js';

/**
 * Format ageMonths using clinical immunization units.
 *
 * Immunization resources express age as:
 *   - "Birth" at 0
 *   - weeks for very young infants (≤2 months / ≤~8 weeks)
 *   - months for 2 months through 23 months
 *   - years (+ months when not a whole year) for ≥24 months
 *
 * Never outputs "72 months" — that becomes "6 years".
 * Mirrors the fmtAgeClinical thresholds in vaxapp's ageFormat.js.
 *
 * Ages round DOWN, to the age the patient has COMPLETED -- nobody is 16 until
 * their 16th birthday (U4, owner decision 2026-09-17). This used to round to
 * the NEAREST unit, so a dose given in the last fortnight before a birthday
 * displayed as if it had been given on it (191.7 months -> "16 years"), which
 * put the record panel's verdicts at war with themselves: "Given at ~16 years,
 * before the age-16 booster window." Seven sentences print this age immediately
 * before an exact threshold claim, and the dose row prints it with no "~" at
 * all, so the fix belongs here rather than in any of them.
 *
 * Display only. No interval, age floor or series total is computed from these
 * strings -- the engine and the validator work in months (see ageMeetsMinimum).
 *
 * e.g. 0 → "Birth", 1.5 → "6 weeks", 4 → "4 months", 72 → "6 years",
 *      78 → "6 years 6 months", 191.7 → "15 years 11 months"
 */
// An age is the difference of two dates, so one that IS exactly five years can
// arrive as 59.9999999. Flooring that naively would print "4 years 11 months"
// on a child's fifth birthday, so every floor below absorbs that much noise --
// the same 1e-6 tolerance ageAtDose() already uses for the same reason.
const FLOOR_EPS = 1e-6;
const floorAge = (n) => Math.floor(n + FLOOR_EPS);

export function fmtAgeMonths(am) {
  if (am == null) return '';
  // Impossible-entries P1-3 (2026-09-17): a negative age used to fall into the
  // "Birth" branch below, so -52 months and 0 months printed the same word. A
  // value that cannot exist looked exactly like a newborn -- which is how a dose
  // dated before the patient was born came to read "Given at ~birth", and why
  // the month-end negative age fixed in #38 stayed invisible for so long.
  // A negative age is a bug or a typo, never a patient, so it must not be
  // mistakable for one.
  if (am < 0) return 'Before birth';
  if (am < 0.25) return 'Birth';               // < ~1 week → Birth
  // Very young infants (≤ ~8 weeks / 2 months): express in weeks
  if (am <= 2) {
    const wks = floorAge(am * 4.348);          // 1 month ≈ 4.348 weeks
    if (wks < 1) return 'Birth';
    return `${wks} week${wks === 1 ? '' : 's'}`;
  }
  if (am < 24) {
    const mo = floorAge(am);
    return `${mo} month${mo === 1 ? '' : 's'}`;
  }
  let years = floorAge(am / 12);
  let months = floorAge(am % 12);
  // Kept as a belt-and-braces guard. Flooring cannot reach 12 the way rounding
  // could (59.88 -> 4y + round(11.88) = 12mo), but FLOOR_EPS means a months
  // value of 11.9999999 still can, and "X years 12 months" must never print.
  if (months === 12) { years += 1; months = 0; }
  if (months === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
}

/**
 * Strip a trailing antigen parenthetical from a brand label for display.
 * The rec-card section header already names the antigen, so "Menveo (MenACWY)"
 * → "Menveo". Only removes the exact antigen tags; other parentheticals
 * (e.g. "Menactra (MenACWY) — discontinued") keep their non-antigen text.
 */
export function stripAntigen(label) {
  if (!label) return '';
  return label.replace(/\s*\((?:MenACWY|MenB|MenABCWY)\)/g, '').trim();
}

/**
 * Format ISO date string (YYYY-MM-DD) to readable form.
 * e.g. "2026-07-03" → "Jul 3, 2026"
 */
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

/**
 * Derive age group label from ageMonths.
 */
export function ageGroup(am) {
  if (am == null) return null;
  // P1-3: no band fits an age that cannot exist. Returning null hands the
  // decision back to the caller rather than handing it a plausible-looking
  // "Infant (<2y)"; every caller already renders a null group as nothing.
  if (am < 0) return null;
  if (am < 24) return 'Infant (<2y)';
  if (am < 132) return 'Child (2–10y)';   // 132m = 11y; a 10-year-old (120–131m) is Child
  if (am < 228) return 'Adolescent (11–18y)';  // 228m = 19y; 18-year-old (216–227m) is Adolescent
  return 'Adult (19+)';
}

/**
 * Compute ageMonths from a date-of-birth ISO string and a reference date.
 * ref defaults to today.
 */
export function dobToAgeMonths(dobISO, refISO) {
  if (!dobISO) return null;
  const ref = refISO || todayISO();
  if (dobISO > ref) return null;
  return calendarMonthsBetween(dobISO, ref);
}
