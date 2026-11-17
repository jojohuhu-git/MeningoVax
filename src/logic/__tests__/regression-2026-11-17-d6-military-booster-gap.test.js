// D6 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// a military recruit's MenACWY booster is checked like a travel booster (C10):
// sooner than 5 years (less the 4-day grace) after the dose before it, it does
// not count, and the next booster is timed from it (C9). The routine 16-year
// booster keeps its own 8-week rule, and under 16 the military box adds nothing
// (B-4).
//
// Source, read live 2026-11-17: ACIP 2020 rr6909a1 Table 10, military recruits:
//   "Every 5 yrs on basis of assignment"
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const M = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const run = (input) => recommend({ menbDoses: [], riskIds: ['military'], today: '2026-11-17', ...input });
const verdicts = (r) => r.history.MenACWY.perDose.map((p) => p.status);

describe('D6: a military booster given too soon does not count', () => {
  it('22 y: Menveo, then Menveo 10 weeks later — the second does not count; booster still Mar 15, 2029', () => {
    const r = run({ dob: '2004-01-01', menacwyDoses: [M('2024-01-01'), M('2024-03-15')] });
    expect(verdicts(r)).toEqual(['valid', 'invalid']);
    const c = r.menacwy[0];
    expect(c.earliestNextDate).toBe('2029-03-15');
    expect(c.doseLabel).toBe('Booster (dose 2) if required by assignment');
  });

  it('control: a booster 5 years after counts', () => {
    const r = run({ dob: '2000-01-01', menacwyDoses: [M('2019-01-01'), M('2024-01-01')] });
    expect(verdicts(r)).toEqual(['valid', 'valid']);
  });

  it('control: the routine 16-year booster (4 years after the 12-year dose) still counts', () => {
    const r = run({ dob: '2006-01-01', menacwyDoses: [M('2018-02-01'), M('2022-02-01')] });
    expect(verdicts(r)).toEqual(['valid', 'valid']);
  });

  it('control: travel already works this way (C10)', () => {
    const r = run({ riskIds: ['travel'], dob: '2004-01-01', menacwyDoses: [M('2024-01-01'), M('2024-03-15')] });
    expect(verdicts(r)).toEqual(['valid', 'invalid']);
  });
});
