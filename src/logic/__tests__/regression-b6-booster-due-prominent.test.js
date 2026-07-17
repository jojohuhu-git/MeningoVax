// B6: "primary series complete, booster still due" must not read as a quiet,
// fully-done state — it needs an approximate booster-due date computed from
// the current age (the patient's 16th birthday).

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addDays, DAYS } from '../dateUtils.js';

const acwy = (r) => r.menacwy[0];

describe('B6: routine MenACWY dose-1-complete, booster-due-at-16y carries an approximate date', () => {
  it('12y1m with dose 1 recorded computes an approximate booster due date ~4 years out', () => {
    const today = '2026-07-13';
    const r = recommend({
      today,
      ageMonths: 145, // 12y1m
      riskIds: [],
      menacwyDoses: [{ date: '2025-06-01' }], // dose 1 recorded recently
    });
    const rec = acwy(r);
    expect(rec.status).toBe('complete');
    expect(rec.boosterDueDate).not.toBeNull();

    // 16y - 12y1m = ~46.9 months away
    const expected = addDays(today, DAYS.months(192 - 145));
    expect(rec.boosterDueDate).toBe(expected);
    expect(rec.note).toMatch(/approximate/i);
  });

  it('does not set boosterDueDate for other complete states (e.g. dose given at >=16y already)', () => {
    const r = recommend({
      today: '2026-07-13',
      ageMonths: 204, // 17y
      riskIds: [],
      menacwyDoses: [{ date: '2025-06-01', ageMonths: 195 }], // given at ~16y3m
    });
    const rec = acwy(r);
    expect(rec.status).toBe('complete');
    expect(rec.boosterDueDate).toBeNull();
  });
});
