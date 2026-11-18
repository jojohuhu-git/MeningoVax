// Port Phase 5, 16-year booster for travel / lab worker / outbreak (owner, 2026-11-18).
//
// Found by the Phase 5 run-forward check (B17) and a risk-vs-healthy sweep: 830
// saved patients were told a LATER MenACWY date because a risk box was ticked.
// Maya, 15, MenQuadfi at 14 y 10 m: no box -> "Booster due at 16y" (Jan 10,
// 2027); travel or outbreak -> Nov 1, 2030. The outbreak card then changed its
// mind on her 16th birthday ("routine booster at ≥16y still owed"), and a
// traveler's 16-year dose read "too soon, does not count".
//
// Sources read live 2026-11-18: ACIP 2020 (RR-9) Table 2, "Booster: 1 dose at
// age 16 yrs if first dose administered before 16th birthday" (no risk
// exception); CDC child/adolescent notes (July 1, 2025): a "healthy child who
// received a single dose for travel" follows the adolescent schedule.
//
// Owner: travel, lab worker, outbreak -> the routine 16-year dose (and it
// counts), then boosters every 5 years from it while at risk (every 5 years
// because it is given at 7 or older; 3 years then 5 only when the primary
// series was completed before 7). Asplenia, complement, HIV -> unchanged
// (ACIP: "a child with HIV infection who received MenACWY at age 9 years should
// receive the next dose at age 14 years").
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const DOB = '2011-01-10'; // 16 on Jan 10, 2027
const acwy = (...dates) => dates.map((date) => ({ date, brand: 'MenQuadfi (MenACWY)' }));
const run = (riskIds, doses, today = '2026-11-18') =>
  recommend({ today, dob: DOB, riskIds, menacwyDoses: doses, menbDoses: [] });
const card = (riskIds, doses, today) => run(riskIds, doses, today).menacwy[0];

describe('Maya, 15, one MenACWY at 14 y 10 m: the 16-year booster comes first', () => {
  for (const risk of ['travel', 'microbiologist', 'outbreak_acwy']) {
    it(`${risk}: next dose Jan 10, 2027 (her 16th birthday), not 2030`, () => {
      const c = card([risk], acwy('2025-11-01'));
      expect(c.dueToday).toBe(false);
      expect(c.doseLabel).toBe('Booster due at 16y');
      expect(c.earliestNextDate).toBe('2027-01-10');
    });

    it(`${risk}: on her 16th birthday the same dose is due (the card does not change its mind)`, () => {
      const c = card([risk], acwy('2025-11-01'), '2027-01-10');
      expect(c.dueToday).toBe(true);
      expect(c.doseLabel).toBe('1 dose (routine booster at ≥16y still owed)');
    });

    it(`${risk}: a 16-year dose given counts, and the next booster is 5 years after it`, () => {
      const r = run([risk], acwy('2025-11-01', '2027-01-15'), '2027-03-01');
      expect(r.history.MenACWY.perDose.map((d) => d.status)).toEqual(['valid', 'valid']);
      expect(r.menacwy[0].dueToday).toBe(false);
      expect(r.menacwy[0].earliestNextDate).toBe('2032-01-15');
    });
  }

  it('control, no box: unchanged', () => {
    const c = card([], acwy('2025-11-01'));
    expect(c.doseLabel).toBe('Booster due at 16y');
    expect(c.earliestNextDate).toBe('2027-01-10');
  });

  it('control, complement with a 2-dose primary at 14: unchanged (booster 5 years after dose 2)', () => {
    const c = card(['complement'], acwy('2025-09-01', '2025-11-01'));
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2030-11-01');
  });
});

describe('the 16-year booster waits 8 weeks after the last dose, as on the routine card', () => {
  it('travel, dose 2 weeks before the 16th birthday: due 8 weeks after it, not on the birthday', () => {
    const c = card(['travel'], acwy('2026-12-27'), '2027-01-05');
    expect(c.doseLabel).toBe('Booster due at 16y');
    expect(c.earliestNextDate).toBe('2027-02-21');
  });
});

describe('what does not change', () => {
  it('travel, a dose before age 10 only: the travel booster schedule, unchanged', () => {
    // Dose at 8 (2019-02-01); 5-year travel booster Feb 1, 2024 -> long past, due now.
    const c = card(['travel'], acwy('2019-02-01'), '2023-06-01');
    expect(c.doseLabel).not.toBe('Booster due at 16y');
  });

  it('travel booster due now under 16 (dose at 10, now 15): the travel booster is given now', () => {
    const c = card(['travel'], acwy('2021-02-01'), '2026-03-01');
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toMatch(/^Booster \(dose 2/);
  });
});

describe('travel and lab: only while a healthy peer is still owed it (through 21)', () => {
  it('travel, 24, dose at 11: the travel booster, not "routine booster still owed" (a healthy 24-year-old is owed nothing)', () => {
    const r = recommend({ today: '2026-11-18', dob: '2002-06-01', riskIds: ['travel'], menacwyDoses: acwy('2013-08-01'), menbDoses: [] });
    expect(r.menacwy[0].dueToday).toBe(true);
    expect(r.menacwy[0].doseLabel).toMatch(/^Booster \(dose 2/);
  });
});
