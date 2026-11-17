// D5 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// the repeat of a too-young FIRST MenACWY dose waits 8 weeks after it — MenACWY's
// own minimum interval. E1 (2026-11-15) had said 4 weeks, which is MenB's number
// (and PCV's), carried over when E1 was asked for both families at once. MenB
// keeps its 4 weeks (covered in regression-2026-11-15-ruling-d-…test.js).
//
// Sources, read live 2026-11-17:
//   CDC Timing and Spacing: "The repeat dose should be spaced after the invalid
//     dose by the recommended minimum interval"
//   ACIP 2020 rr6909a1 (MenACWY): "provided that an 8-week minimum interval
//     between doses is maintained"
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const M = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], ...input });
const base = { dob: '2026-06-01', riskIds: ['asplenia'] };
// A risk-based infant dose asks "was the patient high-risk then?"; answered yes.
const yesAt1 = { MenACWY: { 1: 'yes' } };

describe('D5: a too-young first MenACWY dose is repeated 8 weeks after it', () => {
  it('the card: Menveo at 5½ weeks old (Jul 10) → dose 1 again from Sep 4, not Aug 7', () => {
    const c = run({ ...base, today: '2026-08-20', menacwyDoses: [M('2026-07-10')] }).menacwy[0];
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-09-04');
  });

  it('the record: a Menveo 4½ weeks after the too-young one does not count', () => {
    const r = run({ ...base, today: '2026-09-20', menacwyDoses: [M('2026-07-10'), M('2026-08-10')], riskAtDoseAnswers: yesAt1 });
    expect(r.history.MenACWY.perDose.map((p) => p.status)).toEqual(['invalid', 'invalid']);
  });

  it('the record: one 8 weeks after it counts', () => {
    const r = run({ ...base, today: '2026-09-20', menacwyDoses: [M('2026-07-10'), M('2026-09-04')], riskAtDoseAnswers: yesAt1 });
    expect(r.history.MenACWY.perDose.map((p) => p.status)).toEqual(['invalid', 'valid']);
  });

  it('control: a first Menveo at 2 months counts, and dose 2 is 8 weeks later', () => {
    const r = run({ ...base, today: '2026-08-20', menacwyDoses: [M('2026-08-01')] });
    expect(r.history.MenACWY.perDose[0].status).not.toBe('invalid');
  });
});
