// Regression tests for fix-2026-07-13 audit queue items A1 and A3.
//
// A1: ≥22y patient with a valid ≥16y dose was wrongly told "Not routinely indicated" —
//     the ≥22y branch in menacwyRoutine() never checked hasDoseAt16.
// A3: a MenACWY dose given before the 10th birthday must not count toward the
//     routine adolescent series (ACIP/immunize.org) — the engine must re-anchor
//     the effective adolescent dose count on the first dose given at ≥10y.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';

const acwy = (r) => r.menacwy[0];

describe('A1: ≥22y with a valid ≥16y dose → complete, not "not routinely indicated"', () => {
  it('DOB 2003-03-28, doses 2017-10-26 (14y7m) and 2019-07-08 (16y3m), today 2026-07-13', () => {
    const r = recommend({
      today: '2026-07-13',
      ageMonths: 280, // ~23y4m
      riskIds: [],
      menacwyDoses: [
        { date: '2017-10-26', ageMonths: 175 }, // ~14y7m
        { date: '2019-07-08', ageMonths: 195 }, // ~16y3m
      ],
    });
    expect(acwy(r).status).toBe('complete');
    expect(acwy(r).note).not.toMatch(/not routinely indicated/i);
  });

  it('≥22y with NO dose at ≥16y still falls to not-indicated (guard against over-fix)', () => {
    const r = recommend({
      today: '2026-07-13',
      ageMonths: 280,
      riskIds: [],
      menacwyDoses: [
        { date: '2017-10-26', ageMonths: 175 }, // 14y7m only, never boosted at ≥16y
      ],
    });
    expect(acwy(r).status).toBe('not-indicated');
  });
});

describe('A3: a MenACWY dose given before age 10 does not count toward the adolescent series', () => {
  it('DOB 2003-12-13, doses 2005-03-14 (~1y3m) and 2018-04-10 (~14y4m), today 2026-07-13 → not routinely indicated at ≥22y (effective D1 at 14y4m, no ≥16y dose)', () => {
    const r = recommend({
      today: '2026-07-13',
      ageMonths: 271, // ~22y7m
      riskIds: [],
      menacwyDoses: [
        { date: '2005-03-14', ageMonths: 15 },  // given before age 10 — must not count
        { date: '2018-04-10', ageMonths: 172 }, // ~14y4m — effective dose 1
      ],
    });
    // The pre-age-10 dose must not count: only one effective dose, given at 14y4m,
    // no dose at ≥16y, patient is now ≥22y with no risk factor → not routinely indicated.
    expect(acwy(r).status).toBe('not-indicated');

    // The compliance/audit display (analyzeHistory — the single source of truth
    // for both the engine and the RECORDED dose panel) must explain honestly why
    // the pre-age-10 dose doesn't count, and must NOT call it "invalid — below
    // minimum age" (it was a validly-administered dose).
    const perDose = analyzeHistory('MenACWY', [
      { date: '2005-03-14' },
      { date: '2018-04-10' },
    ], 271, [], '2026-07-13').perDose;
    expect(perDose[0].status).toBe('valid');
    expect(perDose[0].notAdolescentCount).toBe(true);
    expect(perDose[0].effectiveDoseNum).toBeNull();
    expect(perDose[0].reasons.join(' ')).toMatch(/before age 10.*does not count/i);
    expect(perDose[0].reasons.join(' ')).not.toMatch(/invalid.*below minimum age/i);
    // The 2018 dose becomes effective dose 1.
    expect(perDose[1].effectiveDoseNum).toBe(1);
  });

  it('discriminator: a single pre-age-10 dose must NOT be treated as effective dose 1 at 11y (should still show Dose 1 due, not a 16y-booster-due state)', () => {
    const r = recommend({
      today: '2026-07-13',
      ageMonths: 132, // 11y0m
      riskIds: [],
      menacwyDoses: [
        { date: '2016-07-13', ageMonths: 15 }, // given at ~15 months — pre-age-10, must not count
      ],
    });
    expect(acwy(r).status).toBe('due');
    expect(acwy(r).doseNum).toBe(1);
    expect(acwy(r).doseLabel).toMatch(/Dose 1/);
  });
});
