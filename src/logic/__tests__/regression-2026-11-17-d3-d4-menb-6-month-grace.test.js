// D3 and D4 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// CDC's 4-day grace applies at the two high-risk MenB 6-month lines, as C7 already
// gave it at the 4-month and healthy 6-month lines — one dose fewer.
//
// Sources, read live 2026-11-17:
//   ACIP mm7349a3: "a third dose is not needed if the second dose was administered
//     ≥6 months after the first dose. If the third dose is administered <4 months
//     after the second dose, the dose should be repeated ≥4 months after the last
//     dose, unless the third dose was administered ≥6 months after the first dose."
//   CDC Timing and Spacing: "vaccine doses administered ≤4 days before the minimum
//     interval or age are considered valid"
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { menbHighRiskDose3Early, menbSeriesInfo } from '../seriesTotals.js';

const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const run = (menbDoses) => recommend({
  dob: '2006-01-01', today: '2026-11-17', riskIds: ['asplenia'], menacwyDoses: [], menbDoses,
});

describe('D3: dose 3 within 4 days of 6 months after dose 1 needs no 4th dose', () => {
  it('dose 3 two days short of 6 months (and under 4 months after dose 2): series complete', () => {
    const doses = [B('2025-10-01'), B('2026-01-15'), B('2026-03-29')];
    expect(menbHighRiskDose3Early('2025-10-01', '2026-01-15', '2026-03-29')).toBe(false);
    const r = run(doses);
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'valid']);
    const c = r.menb[0];
    expect(c.doseLabel).toMatch(/^(First booster|Booster)/);
    expect(c.earliestNextDate).toBe('2027-03-29');
  });

  // M1 (owner, 2026-11-20): outside the grace the dose is not counted (was: a 4th dose owed).
  it('control: 5 days short of 6 months is outside the grace — dose 3 is not counted', () => {
    expect(menbHighRiskDose3Early('2025-10-01', '2026-01-15', '2026-03-27')).toBe(true);
    const r = run([B('2025-10-01'), B('2026-01-15'), B('2026-03-27')]);
    expect(r.history.MenB.perDose[2].status).toBe('invalid');
    expect(r.menb[0].doseLabel).toMatch(/^Dose 3 of 3/);
  });
});

describe('D4: dose 2 within 4 days of 6 months after dose 1 needs no dose 3', () => {
  it('dose 2 two days short of 6 months: series complete, booster 1 year later', () => {
    expect(menbSeriesInfo({ highRisk: true, doses: [B('2025-10-01'), B('2026-03-29')] }).total).toBe(2);
    const c = run([B('2025-10-01'), B('2026-03-29')]).menb[0];
    expect(c.doseLabel).toMatch(/^(First booster|Booster)/);
    expect(c.earliestNextDate).toBe('2027-03-29');
  });

  it('control: 5 days short of 6 months — dose 3 is still owed', () => {
    expect(menbSeriesInfo({ highRisk: true, doses: [B('2025-10-01'), B('2026-03-27')] }).total).toBe(3);
    const c = run([B('2025-10-01'), B('2026-03-27')]).menb[0];
    expect(c.doseLabel).toMatch(/^Dose 3 of 3/);
  });
});
