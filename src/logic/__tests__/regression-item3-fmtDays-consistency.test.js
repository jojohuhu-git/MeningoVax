// ─────────────────────────────────────────────────────────────────────────
// regression-item3-fmtDays-consistency.test.js
//
// Item 3 (2026-07-23 handoff): interval explanations must not state the same
// interval in two units (a clean "~5 years" plus a raw "1826 days" next to
// it). Every reason/detail string in validate.js routes raw day counts
// through fmtDays() instead of interpolating `${days} days` directly.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { validateHistory } from '../validate.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-06-03';
function daysAgo(d) { return addDays(TODAY, -d); }
function weeksAgo(w) { return addDays(TODAY, -(w * 7)); }

function validate(vaccine, doses, ageMonths, riskIds = []) {
  return validateHistory(vaccine, doses, ageMonths, riskIds, TODAY);
}

// The bug this guards against: the SAME interval stated twice in two units,
// e.g. "≥6 months (~183 days)" or a detail line reading "28 days" next to a
// reason that already says "4 weeks". A bare "10 days" (fmtDays' own <14-day
// branch) is fine — that's a single representation, not a duplicate.
const RAW_DAYS_DUPLICATE = /\(~?\d+\s*days?\)/i; // parenthetical raw-day duplicate
const RAW_DAYS_LITERAL_28_OR_MORE = /\b(2[89]|[3-9]\d|\d{3,})\s*days?\b/i; // ≥28 raw days = a threshold constant leaking through unformatted

describe('Item 3 — raw day counts routed through fmtDays()', () => {
  it('MenACWY high-risk D2 too soon: no duplicate raw-day parenthetical, detail uses fmtDays', () => {
    const d1 = weeksAgo(20);
    const d2 = weeksAgo(17); // 3 weeks after D1 → invalid, needs ≥8 weeks
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
    ], 360, ['asplenia']);

    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons.join(' ')).not.toMatch(RAW_DAYS_DUPLICATE);
    expect(results[1].detail).not.toMatch(RAW_DAYS_LITERAL_28_OR_MORE);
    expect(results[1].detail).toMatch(/~3 weeks/);
    expect(results[1].detail).toMatch(/~8 weeks/);
  });

  it('MenACWY baseline ≥4wk (healthy teen, 10 days apart): no "(28 days)" duplicate, detail uses fmtDays for the 28-day minimum', () => {
    const d1 = daysAgo(30);
    const d2 = daysAgo(20); // 10 days after D1
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
    ], 192, []);

    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons.join(' ')).not.toMatch(RAW_DAYS_DUPLICATE);
    expect(results[1].detail).not.toMatch(RAW_DAYS_LITERAL_28_OR_MORE);
    expect(results[1].detail).toMatch(/~4 weeks/);
  });

  it('MenB high-risk D2 too soon (10 days after D1): no "(28 days)" duplicate, detail uses fmtDays', () => {
    const d1 = daysAgo(30);
    const d2 = daysAgo(20);
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB-4C)' },
      { date: d2, brand: 'Bexsero (MenB-4C)' },
    ], 360, ['asplenia']);

    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons.join(' ')).not.toMatch(RAW_DAYS_DUPLICATE);
    expect(results[1].detail).not.toMatch(RAW_DAYS_LITERAL_28_OR_MORE);
    expect(results[1].detail).toMatch(/~4 weeks/);
  });
});
