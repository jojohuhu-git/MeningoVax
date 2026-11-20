// E2 (rulebook mockup review, 2026-11-19): a healthy child under 10 sees, in
// the MenB "Why this", who gets MenB at 10–15 years. The list left out a
// serogroup B outbreak, yet the app gives a 12-year-old in a B outbreak
// "Dose 1 of 3 (high-risk series)". ACIP 2020 (refs `acip2020MenbRiskGroups`)
// names five groups for persons aged ≥10 years, the fifth "persons identified to
// be at increased risk because of a meningococcal disease outbreak caused by
// serogroup B". The sentence now names all five and cites that sentence.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ today: '2026-11-19', riskIds: [], menacwyDoses: [], menbDoses: [], ...input });

describe('E2: the MenB 10–15 list names a serogroup B outbreak', () => {
  it('healthy, born 2017-06-01 (9 y): the list ends with a serogroup B outbreak, sourced', () => {
    const c = run({ dob: '2017-06-01' }).menb[0];
    expect(c.doseLabel).toBe('Not indicated');
    expect(c.note.detail).toContain('Between 10 and 15 years it is indicated only for asplenia, complement deficiency, complement-inhibitor therapy, microbiologist exposure, or a serogroup B outbreak [c].');
    expect(c.noteCites.map((x) => x.key)).toEqual(['menbLicensedAge1025', 'acip2020MenbRiskGroups']);
  });

  it('control: the same list holds for a 12-year-old in a serogroup B outbreak, who gets the high-risk series', () => {
    expect(run({ dob: '2014-06-01', riskIds: ['outbreak_b'] }).menb[0].doseLabel).toBe('Dose 1 of 3 (high-risk series)');
  });
});
