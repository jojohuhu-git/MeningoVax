// Port Phase 3 — the owner's five STOP B answers (2026-11-15), plus the
// PneumoVax owner rule on "Complete" (2026-11-01, "Complete should only be
// used if no additional doses/boosters are needed"), which STOP B noted
// already decides the healthy 10–15-year-old card.
//
// Sources, read live 2026-11-16 (ACIP 2020 MMWR rr6909a1):
//   Table 8 (outbreak): "Boosters (if previously vaccinated and identified as
//     being at increased risk): • Aged <7 yrs: Single dose if ≥3 yrs since
//     vaccination • Aged ≥7 yrs: single dose if ≥5 yrs since vaccination"
//   Table 10: "Military recruits: Every 5 yrs on basis of assignment" and
//     "Vaccination recommendations for military personnel are made by the U.S.
//     Department of Defense on the basis of high-risk travel requirements."
//   Routine: "Adolescents aged 11–12 years should receive … a booster dose at
//     age 16 years"
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], ...input });
const acwy = (r) => r.menacwy[0];

describe('B-5: the pentavalent option waits for the dose questions, as the MenB card does', () => {
  // 15-year-old with asplenia; a Bexsero at 12 asks "high-risk then?".
  const base = {
    dob: '2011-01-01', today: '2026-11-16', riskIds: ['asplenia'],
    menbDoses: [{ date: '2023-06-01', brand: 'Bexsero (MenB)' }],
  };

  it('unanswered: no pentavalent option', () => {
    const r = run(base);
    expect(r.history.MenB.perDose[0].status).toBe('pending');
    expect(r.pentavalent.eligible).toBe(false);
  });

  it('answered: the option comes back', () => {
    const r = run({ ...base, riskAtDoseAnswers: { MenB: { 0: 'yes' } } });
    expect(r.pentavalent.eligible).toBe(true);
  });
});

describe('B-4: under 16, the college-residence or military box adds nothing', () => {
  // The STOP B patient: 11 years, college residence ticked, MenQuadfi
  // 2026-09-01; seen 2026-11-16. Before: the card asked for a dose the chip
  // then refused, for ever.
  const base = { dob: '2015-03-01', today: '2026-11-16', menacwyDoses: [{ date: '2026-09-01', brand: 'MenQuadfi (MenACWY)' }] };

  it('the card is the routine card, plus one sentence', () => {
    const routine = acwy(run({ ...base, riskIds: [] }));
    for (const [risk, word] of [['college_dorm', 'college-residence'], ['military', 'military']]) {
      const c = acwy(run({ ...base, riskIds: [risk] }));
      expect(c.status, risk).toBe(routine.status);
      expect(c.doseLabel, risk).toBe(routine.doseLabel);
      expect(c.dueToday, risk).toBe(routine.dueToday);
      expect(JSON.stringify(c.note), risk).toContain(`The ${word} dose is given at 16 or older.`);
    }
  });

  it('control: at 16 or older the box still has its own card', () => {
    const c = acwy(run({ dob: '2009-03-01', today: '2026-11-16', riskIds: ['college_dorm'], menacwyDoses: [] }));
    expect(c.status).toBe('exposure');
  });
});

describe('B-3: a military recruit gets the 5-year booster date, with the assignment caveat — never "Complete"', () => {
  it('20-year-old, Penmenvy 2025-07-06: booster 2030-07-06 if required by assignment', () => {
    const c = acwy(run({ dob: '2005-01-01', today: '2026-11-16', riskIds: ['military'], menacwyDoses: [{ date: '2025-07-06', brand: 'Penmenvy (MenABCWY)' }] }));
    expect(c.status).not.toBe('complete');
    expect(c.earliestNextDate).toBe('2030-07-06');
    expect(c.doseLabel).toMatch(/if required by assignment/);
  });
});

describe('B-2: an outbreak box that stays ticked keeps asking for the booster — never "Complete", never "top-up"', () => {
  // The STOP B patient: born 2007-09-15, MenQuadfi at 11 and 16.
  const base = { dob: '2007-09-15', riskIds: ['outbreak_acwy'], menacwyDoses: [{ date: '2018-09-15', brand: 'MenQuadfi (MenACWY)' }, { date: '2023-09-15', brand: 'MenQuadfi (MenACWY)' }] };

  it('seen 2026-09-15: booster 2028-09-15 if outbreak risk continues', () => {
    const c = acwy(run({ ...base, today: '2026-09-15' }));
    expect(c.status).not.toBe('complete');
    expect(c.earliestNextDate).toBe('2028-09-15');
    expect(c.doseLabel).toMatch(/Booster \(dose 3\) if outbreak risk continues/);
    expect(JSON.stringify(c)).not.toMatch(/top-?up/i);
  });

  it('seen 2028-09-15: the booster is due, and given that day it counts', () => {
    const c = acwy(run({ ...base, today: '2028-09-15' }));
    expect(c.dueToday).toBe(true);
    const r = run({ ...base, today: '2028-09-20', menacwyDoses: [...base.menacwyDoses, { date: '2028-09-15', brand: 'MenQuadfi (MenACWY)' }] });
    expect(r.history.MenACWY.perDose[2].status).toBe('valid');
  });

  it('an infant outbreak series has its booster too (3 years), as CDC\'s software books it', () => {
    const c = acwy(run({
      dob: '2024-01-01', today: '2026-11-16', riskIds: ['outbreak_acwy'],
      menacwyDoses: ['2024-03-01', '2024-05-01', '2024-07-01', '2025-01-15'].map((date) => ({ date, brand: 'Menveo 2-vial (MenACWY)' })),
      riskAtDoseAnswers: { MenACWY: { 0: 'yes', 1: 'yes', 2: 'yes', 3: 'yes' } },
    }));
    expect(c.status).not.toBe('complete');
    expect(c.earliestNextDate).toBe('2028-01-15');
  });
});

describe('Owner rule 2026-11-01 (PneumoVax): "Complete" only when nothing more is owed', () => {
  it('a healthy 13-year-old with the 11-year dose is not "complete": the booster date is the next-dose date', () => {
    const c = acwy(run({ dob: '2013-06-01', today: '2026-11-16', riskIds: [], menacwyDoses: [{ date: '2024-06-15', brand: 'MenQuadfi (MenACWY)' }] }));
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe(c.boosterDueDate);
    expect(c.doseLabel).toBe('Booster due at 16y');
  });
});
