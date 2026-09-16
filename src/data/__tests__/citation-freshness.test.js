// L2-2 (2026-09-16): the citation freshness tripwire.
//
// refs.js records a `lastVerified` date for every source, and until now NOTHING
// read it. A source could silently go a year stale and the suite stayed green —
// which is exactly how docs/agent/clinical-rules.md ended up a guideline behind
// on the healthy MenB interval after ACIP changed it in October 2024.
//
// No test can tell you CDC has changed its mind. What this one does is refuse to
// let a citation sit unread for more than a year, so the re-read gets scheduled
// by the suite instead of by memory.
//
// NOTE ON THE CLOCK: test-setup.js pins the whole suite to a fixed date (L2-1),
// which would freeze this tripwire forever — it would be measuring staleness
// against a date that never moves. This is the one test in the repo that must
// read the REAL calendar, via vi.getRealSystemTime().
import { describe, it, expect, vi } from 'vitest';
import { CITATIONS } from '../refs.js';

const MAX_AGE_MONTHS = 12;

function realToday() {
  const d = new Date(vi.getRealSystemTime());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthsSince(iso, todayISO) {
  const [y1, m1, d1] = iso.split('-').map(Number);
  const [y2, m2, d2] = todayISO.split('-').map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  return months;
}

describe('L2-2: every citation has been verified recently', () => {
  it('the pinned test clock does not silently freeze this tripwire', () => {
    // If this ever fails, someone has faked the real-time getter too, and the
    // staleness check below has quietly stopped measuring anything.
    expect(realToday() >= '2026-09-16').toBe(true);
  });

  it('every citation records the date it was last confirmed live', () => {
    const missing = Object.entries(CITATIONS)
      .filter(([, c]) => !/^\d{4}-\d{2}-\d{2}$/.test(c.lastVerified || ''))
      .map(([key]) => key);
    expect(
      missing,
      `These citations have no usable lastVerified date: ${missing.join(', ')}. `
      + 'Every entry in refs.js needs the date its page and quote were last read live, as YYYY-MM-DD.'
    ).toEqual([]);
  });

  it('every citation records a real calendar date', () => {
    const impossible = Object.entries(CITATIONS)
      .filter(([, c]) => {
        const iso = c.lastVerified || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false; // covered by the test above
        const [y, m, d] = iso.split('-').map(Number);
        const parsed = new Date(Date.UTC(y, m - 1, d));
        return parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d;
      })
      .map(([key, c]) => `${key} (${c.lastVerified})`);
    expect(
      impossible,
      `These lastVerified dates are not real dates — check for a typo: ${impossible.join(', ')}.`
    ).toEqual([]);
  });

  it('no citation has gone more than 12 months without being re-read', () => {
    const today = realToday();
    const stale = Object.entries(CITATIONS)
      .map(([key, c]) => ({ key, date: c.lastVerified, age: monthsSince(c.lastVerified, today) }))
      .filter((c) => c.age > MAX_AGE_MONTHS)
      .sort((a, b) => b.age - a.age);

    const report = stale
      .map((c) => `  ${c.key} — last read ${c.date}, ${c.age} months ago (${CITATIONS[c.key].short})`)
      .join('\n');

    expect(
      stale,
      'These sources have not been confirmed live in over a year, so the rules built on them '
      + 'may no longer match what the source says:\n' + report
      + '\n\nOpen each page, check the quoted sentence is still there and still says that, then '
      + 'update its lastVerified date in src/data/refs.js. If the source has changed, that is a '
      + 'clinical change — follow the verify-clinical-source procedure, do not just move the date.'
    ).toEqual([]);
  });
});
