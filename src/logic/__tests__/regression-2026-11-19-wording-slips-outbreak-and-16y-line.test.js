// Wording slips (v6 handoff, mockup v9 "Found on the cards while checking"),
// 2026-11-19. Synthetic patients only.
//
// 1. The A/C/W/Y outbreak booster note said "once 5 years have passed since
//    the last dose (3 years if the series finished before age 7, otherwise 5)":
//    5 years twice, and the 3-year case named on a later booster, which always
//    waits 5 (C10; ACIP 2020 Table 8: "Aged ≥7 yrs: single dose if ≥5 yrs since
//    vaccination").
// 2. The routine teen booster line read "Boosters: 1 more - at age 16": a
//    spaced hyphen and "1 more". It now reads "Booster: at age 16 years."
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-19';
const Q = (date) => ({ date, brand: 'MenQuadfi (MenACWY)' });
const acwy = (input) => recommend({ today: TODAY, menbDoses: [], ...input }).menacwy[0];

describe('A/C/W/Y outbreak booster note says each number once', () => {
  it('first booster, single dose at 20 years: 3-or-5 sentence, 5 years once', () => {
    const c = acwy({ dob: '2003-06-01', riskIds: ['outbreak_acwy'], menacwyDoses: [Q('2023-07-01')] });
    expect(c.note.detail).toContain(
      'ACIP gives a booster 3 years after the last dose if the series finished before age 7 years, otherwise 5 years.',
    );
    // extinct: the old parenthetical that said 5 years twice.
    expect(c.note.detail).not.toMatch(/otherwise 5\)/);
    expect(c.note.detail.match(/5 years/g)).toHaveLength(1);
  });

  it('later booster: 5 years, and no 3-year case it can never use', () => {
    const c = acwy({ dob: '1998-06-01', riskIds: ['outbreak_acwy'], menacwyDoses: [Q('2018-07-01'), Q('2023-07-05')] });
    expect(c.doseLabel).toBe('Booster (dose 3) if outbreak risk continues');
    expect(c.note.detail).toContain('ACIP gives each later booster 5 years after the last dose.');
    expect(c.note.detail).not.toMatch(/3 years/);
  });
});

describe('routine teen booster line', () => {
  it('11–12-year-old, no doses: "Booster: at age 16 years"', () => {
    const c = acwy({ dob: '2015-03-01', riskIds: [], menacwyDoses: [] });
    expect(c.boosterSummary).toBe('Booster: at age 16 years [c]');
  });
  it('14-year-old, no doses: "Booster: at age 16–18 years"', () => {
    const c = acwy({ dob: '2012-06-01', riskIds: [], menacwyDoses: [] });
    expect(c.boosterSummary).toBe('Booster: at age 16–18 years [c]');
  });
});
