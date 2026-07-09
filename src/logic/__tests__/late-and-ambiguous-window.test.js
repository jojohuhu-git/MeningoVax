// late-and-ambiguous-window.test.js
//
// Stress tests for (a) MenACWY high-risk doses given late, (b) the ambiguous
// "first dose at ≥24 months (medical)" window, (c) the ACIP 3y/5y booster nuance,
// and (d) out-of-order dose entry (Stream 1). Anchored to the real patient case
// (DOB 2007-10-04, age 18y9m, sickle cell / asplenia).
//
// Rule references: immunize.org p2018 (medical risk MenACWY), ACIP 2020 MMWR RR-9.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { DAYS } from '../dateUtils.js';

const TODAY = '2026-07-09';
function run(input) { return recommend({ today: TODAY, ...input }); }
const menacwy = (r) => r.menacwy.find((x) => x.vaccine === 'MenACWY') || r.menacwy[0];

// Patient MenACWY history: 2y0m, 4y7m, 10y2m.
const PATIENT_MENACWY = [
  { date: '2009-11-02', brand: '' }, // age 2y0m — first dose at exactly 24 months
  { date: '2012-05-24', brand: '' }, // age 4y7m — 2.5y after dose 1 (late D2)
  { date: '2017-12-07', brand: '' }, // age 10y2m — booster
];

describe('Ambiguous window — MenACWY high-risk first dose at ≥24 months (p2018 medical)', () => {
  it('30 months, asplenia, no doses → Dose 1 of 2 high-risk primary (not routine adolescent)', () => {
    const r = run({ ageMonths: 30, riskIds: ['asplenia'], menacwyDoses: [] });
    expect(menacwy(r).status).toBe('risk-based');
    expect(menacwy(r).doseLabel).toMatch(/1 of 2/i);
  });

  it('30 months, asplenia, 1 dose → Dose 2 of 2 ≥8 weeks after dose 1', () => {
    const r = run({ ageMonths: 30, riskIds: ['asplenia'],
      menacwyDoses: [{ date: '2026-05-01' }] });
    expect(menacwy(r).doseLabel).toMatch(/2 of 2/i);
    expect(menacwy(r).minIntervalDays).toBe(DAYS.weeks(8));
  });
});

describe('ACIP 3y/5y booster nuance (high-risk MenACWY)', () => {
  it('primary completed BEFORE age 7 → first booster at 3 years', () => {
    // Two doses at ~5y and ~5y2m (both <7y). Patient now 10y.
    const r = run({ ageMonths: 120, riskIds: ['asplenia'], menacwyDoses: [
      { date: '2021-07-09' }, // age 5y
      { date: '2021-11-09' }, // age ~5y4m
    ] });
    expect(menacwy(r).doseLabel).toMatch(/booster/i);
    expect(menacwy(r).minIntervalDays).toBe(DAYS.years(3));
  });

  it('primary completed AT/AFTER age 7 → first booster at 5 years', () => {
    // Two doses at ~8y and ~8y3m. Patient now 13y.
    const r = run({ ageMonths: 156, riskIds: ['asplenia'], menacwyDoses: [
      { date: '2021-07-09' }, // age 8y
      { date: '2021-10-09' }, // age ~8y3m
    ] });
    expect(menacwy(r).doseLabel).toMatch(/booster/i);
    expect(menacwy(r).minIntervalDays).toBe(DAYS.years(5));
  });
});

describe('Late doses (valid — minimum interval only)', () => {
  it('high-risk dose 2 given 2.5 years after dose 1 still counts (not restarted)', () => {
    const { perDose, effective } = analyzeHistory(
      'MenACWY',
      [PATIENT_MENACWY[0], PATIENT_MENACWY[1]],
      225, ['asplenia'], TODAY,
    );
    expect(effective).toHaveLength(2);
    expect(perDose.every((d) => d.status !== 'invalid')).toBe(true);
  });

  it('patient case (3 doses, last 2017) → booster overdue and due now, not a restart', () => {
    const r = run({ ageMonths: 225, riskIds: ['asplenia'], menacwyDoses: PATIENT_MENACWY });
    expect(menacwy(r).status).toBe('risk-based');
    expect(menacwy(r).doseLabel).toMatch(/booster/i);
    expect(menacwy(r).dueToday).toBe(true);
  });
});

describe('Stream 1 — out-of-order MenACWY entry is re-sorted chronologically', () => {
  it('shuffled dose order yields the same effective series and recommendation', () => {
    const inOrder = run({ ageMonths: 225, riskIds: ['asplenia'], menacwyDoses: PATIENT_MENACWY });
    const shuffled = run({ ageMonths: 225, riskIds: ['asplenia'],
      menacwyDoses: [PATIENT_MENACWY[2], PATIENT_MENACWY[0], PATIENT_MENACWY[1]] });
    expect(menacwy(shuffled).doseLabel).toBe(menacwy(inOrder).doseLabel);
    expect(menacwy(shuffled).minIntervalDays).toBe(menacwy(inOrder).minIntervalDays);
  });

  it('effective list is chronological regardless of input order', () => {
    const { effective } = analyzeHistory('MenACWY',
      [PATIENT_MENACWY[2], PATIENT_MENACWY[0], PATIENT_MENACWY[1]], 225, ['asplenia'], TODAY);
    const dates = effective.map((d) => d.date);
    expect(dates).toEqual([...dates].sort());
  });
});
