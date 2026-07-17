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
 * e.g. 0 → "Birth", 1.5 → "6 weeks", 4 → "4 months", 72 → "6 years",
 *      78 → "6 years 6 months"
 */
export function fmtAgeMonths(am) {
  if (am == null) return '';
  if (am < 0.25) return 'Birth';               // < ~1 week → Birth
  // Very young infants (≤ ~8 weeks / 2 months): express in weeks
  if (am <= 2) {
    const wks = Math.round(am * 4.348);        // 1 month ≈ 4.348 weeks
    if (wks < 1) return 'Birth';
    return `${wks} week${wks === 1 ? '' : 's'}`;
  }
  if (am < 24) {
    const mo = Math.round(am);
    return `${mo} month${mo === 1 ? '' : 's'}`;
  }
  let years = Math.floor(am / 12);
  let months = Math.round(am % 12);
  // Rounding months independently of years can carry over (e.g. 59.88 -> 4y
  // + round(11.88)=12mo) — normalize so it never displays "X years 12 months".
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
