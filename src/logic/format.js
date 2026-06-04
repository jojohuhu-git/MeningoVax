// format.js — UI display helpers (not clinical logic)

/**
 * Format ageMonths to a human-readable string.
 * e.g. 0 → "Birth", 3 → "3 months", 13 → "1 year 1 month", 24 → "2 years"
 */
export function fmtAgeMonths(am) {
  if (am == null) return '';
  if (am < 1) return 'Birth';
  if (am < 12) return `${Math.round(am)} month${Math.round(am) === 1 ? '' : 's'}`;
  const years = Math.floor(am / 12);
  const months = Math.round(am % 12);
  if (months === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
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
  if (am < 120) return 'Child (2–10y)';
  if (am < 228) return 'Adolescent (11–18y)';
  return 'Adult (19+)';
}

/**
 * Compute ageMonths from a date-of-birth ISO string and a reference date.
 * ref defaults to today.
 */
export function dobToAgeMonths(dobISO, refISO) {
  if (!dobISO) return null;
  const ref = refISO ? new Date(refISO + 'T00:00:00') : new Date();
  const dob = new Date(dobISO + 'T00:00:00');
  const diffMs = ref - dob;
  if (diffMs < 0) return null;
  return diffMs / (1000 * 60 * 60 * 24 * 30.4375);
}
