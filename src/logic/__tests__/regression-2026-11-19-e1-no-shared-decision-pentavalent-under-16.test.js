// E1 (rulebook mockup review, 2026-11-19): the 11–15-year MenACWY card's
// "Why this" said "If MenB is also being started under shared clinical
// decision-making, a pentavalent product may be used when both are given on the
// same day." Shared clinical decision-making for MenB is 16–23 years (ACIP 2020
// Table 2, refs `menbHealthyPreferredAge1618`), so it never applied to this card.
// The new sentence gives those ages and the pentavalent rule (ACIP 2025 Penmenvy
// MMWR, refs `pentavalentWhenBothIndicated`: "when both MenACWY and MenB are
// indicated at the same visit").
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ today: '2026-11-19', riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const NEW = 'Without a MenB risk factor, MenB is offered from 16 through 23 years by shared clinical decision-making [c]. A pentavalent dose may be used only when MenACWY and MenB are due at the same visit [c].';

describe('E1: the 11–15-year MenACWY "Why this"', () => {
  it('healthy, born 2012-06-01 (14 y): no "being started under shared clinical decision-making"', () => {
    const o = run({ dob: '2012-06-01' });
    expect(o.menacwy[0].doseLabel).toBe('Dose 1 (catch-up, 13–15y)');
    expect(o.menacwy[0].note.detail).toContain(NEW);
    // extinct: the old sentence left the card with E1, 2026-11-19.
    expect(o.menacwy[0].note.detail).not.toMatch(/being started under shared/);
    expect(o.pentavalent.eligible).toBe(false);
  });

  it('healthy, born 2015-06-01 (11 y): the same sentence, with its two sources', () => {
    const c = run({ dob: '2015-06-01' }).menacwy[0];
    expect(c.doseLabel).toBe('Dose 1 (routine, 11–12y)');
    expect(c.note.detail).toContain(NEW);
    expect(c.noteCites.map((x) => x.key)).toEqual(['menbHealthyPreferredAge1618', 'pentavalentWhenBothIndicated']);
  });

  it('control: serogroup B outbreak, born 2013-06-01 (13 y): the pentavalent card still offers one dose', () => {
    expect(run({ dob: '2013-06-01', riskIds: ['outbreak_b'] }).pentavalent.eligible).toBe(true);
  });
});
