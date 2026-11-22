// D10 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// a serogroup B outbreak, with no other MenB risk, gets ONE MenB booster at
// least 1 year after the primary series — not the repeating "every 2–3 years"
// boosters of asplenia, complement deficiency and microbiologists.
//
// Source, read live 2026-11-17: ACIP 2020 MMWR rr6909a1, Table 8 (outbreak),
// MenB booster cell: "Single dose if ≥1 yr after MenB primary series
// completion (≥6 mos interval might also be considered by public health
// professionals)". Tables 4, 5 and 7 (complement, asplenia, microbiologists):
// "Single dose at 1 yr after completion of primary vaccination and every 2–3
// yrs thereafter." mm7349a3 (2024): booster recommendations "are unchanged".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const yes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const run = (riskIds, b) => recommend({
  dob: '2005-01-01', today: '2026-11-17', riskIds, menacwyDoses: [], menbDoses: b,
  riskAtDoseAnswers: { MenB: yes(b.length) },
}).menb[0];
const PRIMARY = [B('2024-01-01'), B('2024-03-01'), B('2024-07-01')];

describe('D10: serogroup B outbreak — one booster', () => {
  it('booster already given: no further booster (was dose 5 on Aug 1, 2027)', () => {
    const c = run(['outbreak_b'], [...PRIMARY, B('2025-08-01')]);
    expect(c.status).toBe('complete');
    expect(c.doseLabel).toBe('Complete (outbreak booster given)');
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBeNull();
    expect(c.note.lead).toMatch(/one MenB booster/);
    expect(c.brands).toEqual([]);
  });

  it('booster not yet given: still due today, and the line says one booster', () => {
    const c = run(['outbreak_b'], PRIMARY);
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toBe('First booster (dose 4), 1 year after the series for this outbreak');
    expect(c.boosterSummary).toBe('Booster: 1 dose for this outbreak, no repeat boosters');
    // Its source is Table 8's one-booster sentence, not "every 2–3 years".
    // C4 mm7349a3 (2026-11-22): the same-family line after it cites the 2024
    // report's "Booster doses need to be from the same manufacturer".
    // C4 CDC recommendations page (2026-11-22): the CDC page's sentence follows Table 8's.
    expect(c.noteCites.map((x) => x.key)).toEqual(['acip2020Table8MenbOutbreakBooster', 'cdcRecsMenbOutbreakBoosterYear', 'menbBoosterSameManufacturer']);
  });

  it('during the series: the booster line says one booster', () => {
    const c = run(['outbreak_b'], [B('2026-10-01')]);
    expect(c.doseLabel).toMatch(/^Dose 2 of 3/);
    // C4 (2026-11-21): the line now cites ACIP 2020 Table 8 ([c]); words unchanged.
    // C4 CDC recommendations page (2026-11-22): a second mark, the CDC page's
    // "if a year or more has passed" sentence; words unchanged.
    expect(c.boosterSummary).toBe('Booster: 1 dose, 1 year after the primary series, if outbreak risk continues [c][c]');
  });

  it('control: asplenia, same doses — dose 5 still due Aug 1, 2027', () => {
    const c = run(['asplenia'], [...PRIMARY, B('2025-08-01')]);
    expect(c.doseLabel).toBe('Booster (dose 5), 2–3 years after the last');
    expect(c.earliestNextDate).toBe('2027-08-01');
  });

  it('control: asplenia AND outbreak — asplenia\'s repeating boosters win', () => {
    const c = run(['asplenia', 'outbreak_b'], [...PRIMARY, B('2025-08-01')]);
    expect(c.earliestNextDate).toBe('2027-08-01');
    expect(c.boosterSummary).toMatch(/every 2–3 years/);
    expect(c.noteCites.map((x) => x.key)).toEqual(['menbHighRiskBoosterCadenceBox', 'menbBoosterSameManufacturer']);
  });
});
