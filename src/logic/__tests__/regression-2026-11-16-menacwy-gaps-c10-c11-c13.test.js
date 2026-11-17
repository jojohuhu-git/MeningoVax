// Port Phase 3, family 4 — MenACWY gaps (STOP C answers C10, C11, C13; owner
// 2026-11-15). Patients are the STOP C packet's own where it gave one.
//
// Sources, read live 2026-11-16:
//   ACIP 2020 MMWR rr6909a1 (MenACWY): "... provided that an 8-week minimum
//     interval between doses is maintained"; the 16-year booster "as long as a
//     minimum interval of 8 weeks between doses is maintained".
//   ACIP 2020 Table 9 (travel) and Table 7 (microbiologists) give the same
//     3-/5-year booster schedule as Tables 4–6 (medical high risk); Table 8
//     (outbreak) a booster after the same intervals.
//   CDC child/adolescent notes: Menveo from 2 months (MenQuadfi from 6 weeks is
//     the owner's 2026-09-23 decision, MenQuadfi only).
//
// C10 — travel and microbiologist boosters are checked like medical
//       high-risk ones (3 or 5 years, less the 4-day grace). The A/C/W/Y
//       outbreak half lands with STOP B answer B-2 (the outbreak card).
// C11 — 8 weeks between any two MenACWY doses (replaces 4 weeks), less the
//       4-day grace. E1 (owner, 2026-11-15) is kept as the more specific rule:
//       the repeat of a too-young FIRST dose waits 4 weeks after it.
// C13 — an unknown-brand MenACWY counts only from 2 months, not MenQuadfi's 6
//       weeks.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], ...input });
const verdicts = (r) => r.history.MenACWY.perDose.map((p) => (p.effectiveDoseNum ? `dose ${p.effectiveDoseNum}` : (p.extraDose ? 'extra' : p.status)));
const reasons = (r, i) => r.history.MenACWY.perDose[i].reasons.join(' ');
const MV = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const MQ = (date) => ({ date, brand: 'MenQuadfi (MenACWY)' });

describe('C10: a travel booster is checked like a high-risk one', () => {
  const T = { dob: '1990-06-01', today: '2026-11-16', riskIds: ['travel'] };

  it('packet patient: Menveo 2022-01-01, then 2022-02-12 (6 weeks) — the second is not the 5-year booster', () => {
    const r = run({ ...T, menacwyDoses: [MV('2022-01-01'), MV('2022-02-12')] });
    expect(verdicts(r)).toEqual(['dose 1', 'invalid']);
    expect(reasons(r, 1)).toMatch(/5 years/);
  });

  it('a booster 4 years on does not count either; one at 5 years less 3 days does', () => {
    expect(verdicts(run({ ...T, menacwyDoses: [MV('2018-01-01'), MV('2022-01-01')] }))).toEqual(['dose 1', 'invalid']);
    expect(verdicts(run({ ...T, menacwyDoses: [MV('2018-01-01'), MV('2022-12-29')] }))).toEqual(['dose 1', 'dose 2']);
  });

  // A/C/W/Y outbreak joined with STOP B B-2 (the outbreak card's booster date).
  it('microbiologist and A/C/W/Y outbreak: the same', () => {
    for (const risk of ['microbiologist', 'outbreak_acwy']) {
      const r = run({ ...T, riskIds: [risk], menacwyDoses: [MV('2018-01-01'), MV('2022-01-01')] });
      expect(verdicts(r), risk).toEqual(['dose 1', 'invalid']);
    }
  });

  it('control: military and college residence are not changed (no booster gap is checked)', () => {
    for (const risk of ['military', 'college_dorm']) {
      const r = run({ ...T, riskIds: [risk], menacwyDoses: [MV('2018-01-01'), MV('2022-01-01')] });
      expect(r.history.MenACWY.perDose[1].status, risk).not.toBe('invalid');
    }
  });
});

describe('C11: 8 weeks between any two MenACWY doses', () => {
  const H = { dob: '2008-01-01', today: '2026-11-16', riskIds: [] };

  it('healthy 18-year-old: MenQuadfi 2026-06-01, then 2026-07-10 (5½ weeks) — the second does not count', () => {
    const r = run({ ...H, menacwyDoses: [MQ('2026-06-01'), MQ('2026-07-10')] });
    expect(verdicts(r)).toEqual(['dose 1', 'invalid']);
    expect(reasons(r, 1)).toMatch(/8 weeks/);
  });

  it('8 weeks less 3 days is inside the grace (an extra dose, not invalid)', () => {
    const r = run({ ...H, menacwyDoses: [MQ('2026-06-01'), MQ('2026-07-24')] });
    expect(verdicts(r)).toEqual(['dose 1', 'extra']);
  });

  it('8 weeks less 5 days is not', () => {
    const r = run({ ...H, menacwyDoses: [MQ('2026-06-01'), MQ('2026-07-22')] });
    expect(verdicts(r)).toEqual(['dose 1', 'invalid']);
  });

  it('E1 kept: the repeat of a too-young first dose waits 4 weeks, not 8', () => {
    // Born 2026-03-01, asplenia. Menveo at 6 weeks 3 days (below Menveo's 2
    // months: does not count), then Menveo 5 weeks later — counts as dose 1.
    const r = run({
      dob: '2026-03-01', today: '2026-06-01', riskIds: ['asplenia'],
      menacwyDoses: [MV('2026-04-15'), MV('2026-05-20')],
      riskAtDoseAnswers: { MenACWY: { 0: 'yes', 1: 'yes' } },
    });
    expect(verdicts(r)).toEqual(['invalid', 'dose 1']);
  });
});

describe('C13: an unknown-brand MenACWY counts only from 2 months', () => {
  const base = { dob: '2026-03-01', today: '2026-06-01', riskIds: ['asplenia'], riskAtDoseAnswers: { MenACWY: { 0: 'yes' } } };

  it('packet patient: brand unknown, 2026-04-15 (6 weeks 3 days) — does not count', () => {
    const r = run({ ...base, menacwyDoses: [{ date: '2026-04-15', brand: '' }] });
    expect(verdicts(r)).toEqual(['invalid']);
    expect(reasons(r, 0)).toMatch(/2 months/);
    expect(reasons(r, 0)).not.toMatch(/\b2 days\b/);
  });

  it('control: the same dose recorded as MenQuadfi counts (6 weeks, owner 2026-09-23)', () => {
    const r = run({ ...base, menacwyDoses: [MQ('2026-04-15')] });
    expect(verdicts(r)).toEqual(['dose 1']);
  });

  it('an unknown brand at 2 months less 3 days counts (grace)', () => {
    const r = run({ ...base, menacwyDoses: [{ date: '2026-04-28', brand: '' }] });
    expect(verdicts(r)).toEqual(['dose 1']);
  });
});

describe('fix-queue: a product\'s minimum age is printed in its own unit, not as days', () => {
  it('Penbraya below 10 years says "10 years", not "120 days"', () => {
    const r = run({ dob: '2018-01-01', today: '2026-11-16', riskIds: [], menbDoses: [{ date: '2026-06-01', brand: 'Penbraya (MenABCWY)' }] });
    const text = r.history.MenB.perDose[0].reasons.join(' ');
    expect(text).toMatch(/10 years/);
    // extinct: "120 days" was the bug's wording, gone from src/ with the fmtMinAge fix, 2026-11-16.
    expect(text).not.toMatch(/120 days/);
  });

  it('Menveo below 2 months says "2 months", not "2 days"', () => {
    const r = run({ dob: '2026-03-01', today: '2026-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2026-04-15')], riskAtDoseAnswers: { MenACWY: { 0: 'yes' } } });
    expect(reasons(r, 0)).toMatch(/2 months/);
    expect(reasons(r, 0)).not.toMatch(/\b2 days\b/);
  });
});
