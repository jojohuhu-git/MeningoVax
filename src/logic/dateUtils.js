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
export function calendarMonthsBetween(startISO, endISO) {
  const [sy, sm, sd] = startISO.split('-').map(Number);
  const [ey, em, ed] = endISO.split('-').map(Number);
  const daysInEndMonth = new Date(Date.UTC(ey, em, 0)).getUTCDate();
  return (ey - sy) * 12 + (em - sm) + (ed - sd) / daysInEndMonth;
}

export const DAYS = {
  weeks: (w) => w * 7,
  months: (m) => Math.round(m * 30.4375),
  years: (y) => Math.round(y * 365.25),
};
