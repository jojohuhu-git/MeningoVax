// Port Phase 3, family 3 — MenB dose 3 (STOP C answers C5, C6, C7; owner
// 2026-11-15). Patients are the STOP C packet's own.
//
// Sources, read live 2026-11-16:
//   ACIP, MMWR mm7349a3 (Oct 2024):
//     "When administering the 2-dose series ... the 2 doses should be separated
//      by 6 months. If the second dose is administered <6 months after the
//      first dose, a third dose should be administered ≥4 months after the
//      second dose."
//     "If the third dose is administered <4 months after the second dose, the
//      dose should be repeated ≥4 months after the last dose, unless the third
//      dose was administered ≥6 months after the first dose."
//   CDC General Best Practices, Timing and Spacing:
//     "Doses of any vaccine administered ≥5 days earlier than the minimum
//      interval or age should not be counted as valid doses"  (the 4-day grace)
//
// C5 — a high-risk dose 3 given ≥4 months after dose 2 COUNTS, whatever the
//      gap from dose 1 (no sentence voids it; CDC's software's floor from dose
//      1 is 0 days). The FORECAST keeps both lines (≥6 months from dose 1 and
//      ≥4 from dose 2): this is only about a dose already given.
// C6 — follow the MMWR "unless": no 4th dose when dose 3 is ≥6 months after
//      dose 1, even if it was <4 months after dose 2.
// C7 — the 4-day grace applies at the healthy 6-month line (dose 2 → is a
//      rescue dose 3 owed?) and at the high-risk 4-month line (dose 3 → is a
//      4th dose owed?): one dose fewer.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], ...input });
const verdicts = (r) => r.history.MenB.perDose.map((p) => (p.effectiveDoseNum ? `dose ${p.effectiveDoseNum}` : p.status));
const card = (r) => r.menb[0];
const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const T = (date) => ({ date, brand: 'Trumenba (MenB)' });
const HR = { dob: '2006-01-01', today: '2026-11-16', riskIds: ['asplenia'] };

describe('C5: high-risk dose 3 ≥4 months after dose 2 counts, even under 6 months from dose 1', () => {
  it('packet patient: Bexsero 1/10, 2/10, 6/15 — dose 3 counts; the next dose is the booster 1 year after it', () => {
    const r = run({ ...HR, menbDoses: [B('2026-01-10'), B('2026-02-10'), B('2026-06-15')] });
    expect(verdicts(r)).toEqual(['dose 1', 'dose 2', 'dose 3']);
    expect(card(r).doseLabel).toMatch(/booster/i);
    expect(card(r).earliestNextDate).toBe('2027-06-15');
  });

  it('control: dose 3 on 7/10 (6 months) — booster 2027-07-10', () => {
    const r = run({ ...HR, menbDoses: [B('2026-01-10'), B('2026-02-10'), B('2026-07-10')] });
    expect(verdicts(r)).toEqual(['dose 1', 'dose 2', 'dose 3']);
    expect(card(r).earliestNextDate).toBe('2027-07-10');
  });

  it('the forecast still keeps both lines: after 1/10 and 2/10, dose 3 is from 7/10 (6 months from dose 1)', () => {
    const r = run({ ...HR, today: '2026-03-01', menbDoses: [B('2026-01-10'), B('2026-02-10')] });
    expect(card(r).doseLabel).toMatch(/Dose 3 of 3/);
    expect(card(r).earliestNextDate).toBe('2026-07-10');
  });
});

describe('C6: the MMWR "unless" — no 4th dose when dose 3 is ≥6 months after dose 1', () => {
  it('packet patient: Bexsero 2025-10-01, 2026-03-01, 2026-04-15 — complete, booster 1 year after dose 3', () => {
    const r = run({ ...HR, menbDoses: [B('2025-10-01'), B('2026-03-01'), B('2026-04-15')] });
    expect(verdicts(r)).toEqual(['dose 1', 'dose 2', 'dose 3']);
    expect(card(r).doseLabel).not.toMatch(/Dose 4/);
    expect(card(r).doseLabel).toMatch(/booster/i);
    expect(card(r).earliestNextDate).toBe('2027-04-15');
    expect(r.history.MenB.perDose[2].reasons.join(' ')).not.toMatch(/4th dose/);
  });

  it('control: dose 3 under 4 months after dose 2 AND under 6 months from dose 1 still owes a 4th dose', () => {
    const r = run({ ...HR, menbDoses: [B('2026-01-10'), B('2026-02-10'), B('2026-04-15')] });
    expect(card(r).doseLabel).toMatch(/Dose 4 of 4/);
  });
});

describe('C7: the 4-day grace at the two "is one more dose owed?" lines', () => {
  const HEALTHY = { dob: '2008-01-01', today: '2026-11-16', riskIds: [] };

  it('healthy packet patient: Trumenba 2026-01-01 and 2026-06-29 (2 days short of 6 months) — complete, no rescue dose', () => {
    const r = run({ ...HEALTHY, menbDoses: [T('2026-01-01'), T('2026-06-29')] });
    expect(verdicts(r)).toEqual(['dose 1', 'dose 2']);
    expect(card(r).status).toBe('complete');
    expect(r.history.MenB.perDose[1].reasons.join(' ')).not.toMatch(/rescue/i);
  });

  it('healthy: 5 days short (outside the grace) still owes the rescue dose 3', () => {
    const r = run({ ...HEALTHY, menbDoses: [T('2026-01-01'), T('2026-06-26')] });
    expect(card(r).doseLabel).toMatch(/Dose 3 of 3 \(rescue/);
  });

  it('high-risk: dose 3 three days short of 4 months after dose 2 — no 4th dose', () => {
    const r = run({ ...HR, menbDoses: [B('2026-01-10'), B('2026-02-10'), B('2026-06-07')] });
    expect(verdicts(r)).toEqual(['dose 1', 'dose 2', 'dose 3']);
    expect(card(r).doseLabel).not.toMatch(/Dose 4/);
    expect(card(r).earliestNextDate).toBe('2027-06-07');
  });

  it('high-risk: five days short still owes the 4th dose', () => {
    const r = run({ ...HR, menbDoses: [B('2026-01-10'), B('2026-02-10'), B('2026-06-05')] });
    expect(card(r).doseLabel).toMatch(/Dose 4 of 4/);
  });

  it('the packet\'s "inconsistent" patient now reads complete: Bexsero 2025-06-01, 2025-07-05, 2025-11-02', () => {
    // Dose 3: 5 months from dose 1 (C5: still counts) and 3 days short of 4
    // months after dose 2 (C7: inside the grace) — no 4th dose.
    const r = run({ ...HR, menbDoses: [B('2025-06-01'), B('2025-07-05'), B('2025-11-02')] });
    expect(verdicts(r)).toEqual(['dose 1', 'dose 2', 'dose 3']);
    expect(card(r).doseLabel).not.toMatch(/Dose 4/);
  });

  it('the forecast does not use the grace: after a healthy dose 1 on 2026-06-01, dose 2 is from 2026-12-01', () => {
    const r = run({ ...HEALTHY, today: '2026-07-01', menbDoses: [T('2026-06-01')] });
    expect(card(r).earliestNextDate).toBe('2026-12-01');
  });
});
