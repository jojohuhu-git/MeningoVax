// Small date helpers. All dates are ISO "YYYY-MM-DD" strings.

export function todayISO(today) {
  if (today) return today;
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T00:00:00').getTime();
  const b = new Date(bISO + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}

// True if `sinceISO` + intervalDays is on or before `refISO` (i.e. interval elapsed).
export function intervalElapsed(sinceISO, intervalDays, refISO) {
  if (!sinceISO) return true;
  return daysBetween(sinceISO, refISO) >= intervalDays;
}

export const DAYS = {
  weeks: (w) => w * 7,
  months: (m) => Math.round(m * 30.4375),
  years: (y) => Math.round(y * 365.25),
};
