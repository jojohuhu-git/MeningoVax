// Small date helpers. All dates are ISO "YYYY-MM-DD" strings.
// All arithmetic is done in UTC to avoid timezone-dependent off-by-one errors.
// todayISO() derives local date from local clock (not UTC) so it displays
// correctly regardless of timezone. addDays() and daysBetween() work in UTC
// so that "2026-01-15 + 0 days === 2026-01-15" holds in every timezone.

export function todayISO(today) {
  if (today) return today;
  // Use local clock components so the displayed date matches the wall-clock date
  // in every timezone, not UTC (which can be a day ahead or behind local midnight).
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso, n) {
  // Parse as UTC midnight, add n days, format as UTC date. This avoids the
  // DST / timezone-shift issue where 'T00:00:00' (local midnight) shifts by
  // an hour in UTC when the timezone offset is non-zero, causing toISOString()
  // to return the previous or next day.
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T00:00:00Z').getTime();
  const b = new Date(bISO + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

// True if `sinceISO` + intervalDays is on or before `refISO` (i.e. interval elapsed).
export function intervalElapsed(sinceISO, intervalDays, refISO) {
  if (!sinceISO) return true;
  return daysBetween(sinceISO, refISO) >= intervalDays;
}

// Exact calendar months from startISO to endISO, using year/month/day components
// (not an averaged days-per-month constant). A fixed 30.4375-day divisor drifts
// away from whole months depending on how many leap days the span happens to
// contain — e.g. a calendar-exact 10-year gap (2016-01-01 to 2026-01-01) has
// only 3 leap days where the 365.25-day/year average assumes ~2.5, so dividing
// by days/30.4375 lands at ~119.98 months instead of 120.00. That's enough to
// wrongly trip a "< 120 months" age threshold on a dose given exactly on a
// patient's birthday. This function counts whole calendar months directly, so
// same-day-of-month spans (e.g. birthday to birthday) land on an exact integer.
//
// The fractional part is measured between the patient's own month-anniversaries,
// NOT as a share of whichever month the end date happens to fall in. Calendar
// P1-1 (2026-09-17): the old version took the fraction as
// (endDay - startDay) / daysInEndMonth, which breaks whenever the birth
// day-of-month is bigger than the whole end month. A baby born 31 January was
// -0.0714 months old on 1 February, StepAge dropped the negative age, and the
// app answered a correct date of birth with "Please enter a valid age before
// continuing." The same flaw made age non-monotonic (12.0000 months on
// 2027-01-31, 11.9286 the next day — back under the 12-month MenACWY infant
// gate) and put a leap-day child on the infant schedule on the very date
// addCalendarMonths() calls their second birthday.
//
// Anchoring on addCalendarMonths() means the two helpers now hold ONE opinion
// about a child's birthday: whatever date addCalendarMonths(dob, n) returns,
// this function reads back as exactly n. Spans where the end precedes the start
// still come back negative, so a future-dated dose stays detectable.
export function calendarMonthsBetween(startISO, endISO) {
  const [sy, sm] = startISO.split('-').map(Number);
  const [ey, em] = endISO.split('-').map(Number);
  // Whole months = the last anniversary on or before endISO. The first guess can
  // only ever be one too many: anniversary n falls in the end date's own month,
  // so anniversary n-1 falls in the month before it and is certainly earlier.
  let whole = (ey - sy) * 12 + (em - sm);
  let anniversary = addCalendarMonths(startISO, whole);
  if (endISO < anniversary) {
    whole -= 1;
    anniversary = addCalendarMonths(startISO, whole);
  }
  const nextAnniversary = addCalendarMonths(startISO, whole + 1);
  const span = daysBetween(anniversary, nextAnniversary);
  return whole + daysBetween(anniversary, endISO) / span;
}

// ── Calendar-exact intervals (P0-4/P0-5, 2026-09-15) ──────────────────────
//
// DAYS.months(6) is 183 and DAYS.years(3) is 1096, but a real six-month span is
// 181-184 days and a real three-year span is 1095 or 1096. Used as a MINIMUM,
// an averaged constant rejects perfectly correct doses depending on which month
// the patient happened to start in: Bexsero on 2025-01-15 and 2025-07-15 is 181
// days, so "at least 6 months apart" failed and a third injection was demanded.
// A MenACWY booster on its exact three-year anniversary is 1095 days whenever no
// 29 February falls inside the window, so it was voided as "too soon" and the
// card re-offered it the same day.
//
// calendarMonthsBetween() above already documents this drift for AGE thresholds.
// These two do the same job for intervals: they compare real calendar dates, so
// "six months later" means the 15th six months on, whatever that month's length.
//
// Week-based minimums (4, 8, 12 weeks) are exact counts of days and must keep
// using DAYS.weeks -- there is nothing approximate about them.

/** How many days are in the month that `iso` falls in. */
export function daysInMonthOf(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// The same day-of-month `months` later, clamped to the last day when the target
// month is shorter (31 Jan + 1 month = 28 Feb, or 29 Feb in a leap year).
//
// `months` is a WHOLE number of months. P0-1a (2026-09-17): it used to take
// whatever it was given, and a fractional count flowed straight into the string
// this builds -- `String(tm + 1).padStart(2, '0')` on a month index of 1.5
// produced "2027-2.5-17", which fmtDate() then rendered as "undefined 17, 2027"
// on a live card. Rounding here is a safety net that keeps the output a real
// date; a caller passing a fraction is still a bug in that caller, and the one
// that did (earliestGatedDate) now does its own whole-month arithmetic.
export function addCalendarMonths(iso, months) {
  const [y, m, d] = iso.split('-').map(Number);
  const targetIdx = (m - 1) + Math.round(months);   // 0-based month index from year 0
  const ty = y + Math.floor(targetIdx / 12);
  const tm = ((targetIdx % 12) + 12) % 12;          // 0-based month in ty
  const daysInTargetMonth = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const td = Math.min(d, daysInTargetMonth);
  return `${String(ty).padStart(4, '0')}-${String(tm + 1).padStart(2, '0')}-${String(td).padStart(2, '0')}`;
}

export function addCalendarYears(iso, years) {
  return addCalendarMonths(iso, years * 12);
}

// True if `months` whole calendar months have passed from sinceISO by refISO.
// The anniversary itself counts as elapsed: "at least 6 months apart" is
// satisfied ON the six-month date, not the day after. ISO date strings compare
// correctly with >=, so no parsing is needed here.
export function calendarIntervalElapsed(sinceISO, months, refISO) {
  if (!sinceISO) return true;
  return refISO >= addCalendarMonths(sinceISO, months);
}

export const DAYS = {
  weeks: (w) => w * 7,
  months: (m) => Math.round(m * 30.4375),
  years: (y) => Math.round(y * 365.25),
};
