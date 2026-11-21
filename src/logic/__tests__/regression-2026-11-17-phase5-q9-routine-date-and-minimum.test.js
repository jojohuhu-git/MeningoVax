// Port Phase 5, STOP F1 — Q9a and Q9b (owner, 2026-11-17).
// The card advises the ROUTINE date and states the MINIMUM beside it, as
// PneumoVax does (its C10-2, patient F). The floor for a dose already given
// does not move (PneumoVax Ruling C): a dose given on the minimum still counts.
//
// Measured on `main` (36b24e0) before asking: the routine date and the minimum
// differ only at these two places. MenB dose 3, the MenACWY 16-year dose and
// the boosters already advise the routine date.
//
// Sources, read live 2026-11-17 (decisions-2026-11-17-open-questions.md, "STOP F1"):
//   CDC, Timing and Spacing of Immunobiologics: "Administration at recommended
//     ages and in accordance with recommended intervals between doses of
//     multidose antigens provides optimal protection."
//   ACIP mm7349a3: MenB-4C "as a 3-dose series at 0, 1–2, and 6 months" for
//     persons at increased risk.
//   CDC schedule Notes, Menveo dose 1 at 2 months: "4-dose series (additional
//     3 doses at age 4, 6, and 12 months)".
//   Minimums: MenB 4 weeks (owner STOP C C8); MenACWY infant 8 weeks (CDC
//     catch-up table, "8 weeks").
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], riskIds: [], ...input });
const lead = (c) => (typeof c.note === 'string' ? c.note : c.note?.lead ?? '');
const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const T = (date) => ({ date, brand: 'Trumenba (MenB)' });
const M = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const HR = { dob: '2006-01-01', riskIds: ['asplenia'] };

describe('Q9a — MenB high-risk dose 2: due 1 month after dose 1; the 4-week minimum stated beside it', () => {
  it('owner\'s patient: Bexsero 11/3/26, seen 11/17 — due Dec 3, can be given from Dec 1', () => {
    const c = run({ ...HR, today: '2026-11-17', menbDoses: [B('2026-11-03')] }).menb[0];
    expect(c.doseLabel).toMatch(/^Dose 2 of 3/);
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-12-03');
    expect(lead(c)).toContain('Earliest valid date: Dec 1, 2026 (minimum interval 4 weeks).');
  });

  it('between the minimum and the routine date: not due, but can be given today', () => {
    const c = run({ ...HR, today: '2026-12-01', menbDoses: [B('2026-11-03')] }).menb[0];
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-12-03');
    expect(lead(c)).toContain('It can be given today if needed, as the minimum interval of 4 weeks has passed.');
  });

  it('on the routine date: due today, and no minimum sentence', () => {
    const c = run({ ...HR, today: '2026-12-03', menbDoses: [B('2026-11-03')] }).menb[0];
    expect(c.dueToday).toBe(true);
    expect(c.earliestNextDate).toBeNull();
    expect(lead(c)).not.toMatch(/if needed/);
  });

  it('Trumenba the same way', () => {
    const c = run({ ...HR, today: '2026-11-17', menbDoses: [T('2026-11-03')] }).menb[0];
    expect(c.earliestNextDate).toBe('2026-12-03');
  });

  it('control, behind schedule (dose 1 on 8/1): due today, unchanged', () => {
    const c = run({ ...HR, today: '2026-11-17', menbDoses: [B('2026-08-01')] }).menb[0];
    expect(c.dueToday).toBe(true);
    expect(lead(c)).not.toMatch(/if needed/);
  });

  it('the floor does not move: a dose 2 given on the 4-week minimum still counts', () => {
    const r = run({ ...HR, today: '2026-12-15', menbDoses: [B('2026-11-03'), B('2026-12-01')] });
    expect(r.history.MenB.perDose.map((d) => d.effectiveDoseNum)).toEqual([1, 2]);
  });
});

describe('Q9b — infant MenACWY doses 2 and 3: due at 4 and 6 months; the 8-week minimum stated beside it', () => {
  const INF = { dob: '2026-01-01', riskIds: ['asplenia'] };
  const yes = (n) => ({ MenACWY: Object.fromEntries([...Array(n).keys()].map((i) => [i, 'yes'])) });

  it('owner\'s patient: Menveo 3/1/26 (2 months), seen 4/1 — dose 2 due May 1 (4 months), can be given from Apr 26', () => {
    const c = run({ ...INF, today: '2026-04-01', menacwyDoses: [M('2026-03-01')], riskAtDoseAnswers: yes(1) }).menacwy[0];
    expect(c.doseLabel).toMatch(/^Dose 2/);
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-05-01');
    expect(lead(c)).toContain('Earliest valid date: Apr 26, 2026 (minimum interval 8 weeks).');
  });

  it('dose 3: Menveo 3/1 and 5/1, seen 6/1 — due Jul 1 (6 months), can be given from Jun 26', () => {
    const c = run({ ...INF, today: '2026-06-01', menacwyDoses: [M('2026-03-01'), M('2026-05-01')], riskAtDoseAnswers: yes(2) }).menacwy[0];
    expect(c.doseLabel).toMatch(/^Dose 3/);
    expect(c.earliestNextDate).toBe('2026-07-01');
    expect(lead(c)).toContain('Earliest valid date: Jun 26, 2026 (minimum interval 8 weeks).');
  });

  it('between the minimum and the routine age: not due, but can be given today', () => {
    const c = run({ ...INF, today: '2026-04-28', menacwyDoses: [M('2026-03-01')], riskAtDoseAnswers: yes(1) }).menacwy[0];
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-05-01');
    expect(lead(c)).toContain('It can be given today if needed, as the minimum interval of 8 weeks has passed.');
  });

  it('control, started late (dose 1 at 3 months, 4/1): the 8-week minimum is the date, unchanged', () => {
    const c = run({ ...INF, today: '2026-04-15', menacwyDoses: [M('2026-04-01')], riskAtDoseAnswers: yes(1) }).menacwy[0];
    expect(c.earliestNextDate).toBe('2026-05-27');
    expect(lead(c)).not.toMatch(/if needed/);
  });

  it('dose 1 near the end of the 2-month band (3/28): 8 weeks is past 4 months, so the minimum is the date', () => {
    const c = run({ ...INF, today: '2026-04-15', menacwyDoses: [M('2026-03-28')], riskAtDoseAnswers: yes(1) }).menacwy[0];
    expect(c.earliestNextDate).toBe('2026-05-23');
    expect(lead(c)).not.toMatch(/if needed/);
  });

  it('dose 4 (12 months) is unchanged', () => {
    const c = run({ ...INF, today: '2026-09-01', menacwyDoses: [M('2026-03-01'), M('2026-05-01'), M('2026-07-01')], riskAtDoseAnswers: yes(3) }).menacwy[0];
    expect(c.earliestNextDate).toBe('2027-01-01');
    expect(lead(c)).not.toMatch(/if needed/);
  });

  it('the floor does not move: dose 2 given on the 8-week minimum still counts', () => {
    const r = run({ ...INF, today: '2026-05-10', menacwyDoses: [M('2026-03-01'), M('2026-04-26')], riskAtDoseAnswers: yes(2) });
    expect(r.history.MenACWY.perDose.map((d) => d.effectiveDoseNum)).toEqual([1, 2]);
  });
});
