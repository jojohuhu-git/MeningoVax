// C4, document 4: CDC's "Meningococcal Vaccine Recommendations" page for
// health care providers (port Phase 8; owner Q12, 2026-11-21: decide alone
// when the dose is unchanged).
//
// Measured over the saved-answers grid (scripts/uncitedByDocument.mjs,
// 2026-11-22): the page's button sat uncited on 3,194 cards, all of them a
// serogroup B outbreak patient's (`outbreak_b` was the only risk factor that
// still listed the page).
//
// The page, read live 2026-11-22 (dated Mar. 30, 2026), speaks to a serogroup
// B outbreak in one place, under MenB, "Boosting during an outbreak" (its
// footnote B: "Specifically outbreaks involving serogroup B meningococcal
// disease"): "CDC recommends a booster dose for these individuals if a year or
// more has passed since the most recent MenB vaccine". Its MenACWY outbreak
// sentence is footnoted "Specifically outbreaks involving serogroup A, C, W,
// or Y meningococcal disease".
//
// - 2,208 MenB cards whose outbreak booster line already cites ACIP 2020
//   Table 8 ("Single dose if ≥1 yr after MenB primary series completion") now
//   cite the page's sentence beside it. Words unchanged.
// - 690 MenACWY cards (college residents in a serogroup B outbreak): the page
//   says nothing about MenACWY for a serogroup B outbreak, so its button is
//   off them.
// - 296 MenB "not yet due" cards under 10 years: nothing on that card is an
//   outbreak booster, and an asplenia patient's same card has no CDC button,
//   so the button is off them.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-22';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const PAGE = 'https://www.cdc.gov/meningococcal/hcp/vaccine-recommendations/index.html';
const CDC_KEY = 'cdcRecsMenbOutbreakBoosterYear';
const keys = (list) => (list ?? []).map((c) => c.key);
const marksIn = (...s) => s.map((x) => (String(x ?? '').match(/\[c\]/g) ?? []).length).reduce((a, b) => a + b, 0);
const pageCited = (card) => [...(card.boosterCites ?? []), ...(card.noteCites ?? [])].some((m) => String(m.page ?? m.key).split('#')[0] === PAGE);
const onCard = (card) => (card.citations ?? []).some((b) => String(b.url).split('#')[0] === PAGE);

describe('C4: the CDC recommendations page backs a serogroup B outbreak\'s one MenB booster', () => {
  it('outbreak, 19 y, no MenB doses: the booster line cites Table 8, then the page', () => {
    const c = run({ dob: '2007-06-01', riskIds: ['outbreak_b'] }).menb[0];
    expect(c.doseLabel).toBe('Dose 1 of 3 (high-risk series)');
    expect(c.boosterSummary).toBe('Booster: 1 dose, 1 year after the primary series, if outbreak risk continues [c][c]');
    expect(keys(c.boosterCites)).toEqual(['acip2020Table8MenbOutbreakBooster', CDC_KEY]);
    expect(marksIn(c.boosterSummary)).toBe(c.boosterCites.length);
    expect(onCard(c)).toBe(true);
    expect(pageCited(c)).toBe(true);
  });

  // The sentence repeats the card's heading, so the fold (Q10, noteFold.js)
  // moves it behind "Why this"; its marks move with it.
  it('outbreak, 3 Bexsero doses over a year ago: the booster card\'s sentence cites Table 8, then the page', () => {
    const c = run({ dob: '2004-06-01', riskIds: ['outbreak_b'], menbDoses: [
      { date: '2024-11-01', brand: 'Bexsero' }, { date: '2024-12-15', brand: 'Bexsero' }, { date: '2025-05-15', brand: 'Bexsero' }] }).menb[0];
    expect(c.doseLabel).toMatch(/^First booster/);
    expect(`${c.note.lead} ${c.note.detail}`).toContain('A MenB booster, 1 year after the primary series was completed [c][c].');
    expect(keys(c.noteCites)).toEqual(['acip2020Table8MenbOutbreakBooster', CDC_KEY, 'menbBoosterSameManufacturer']);
    expect(marksIn(c.note.lead, c.note.detail)).toBe(c.noteCites.length);
    expect(pageCited(c)).toBe(true);
  });

  it('outbreak, its one booster given: "it has been given" cites Table 8, then the page', () => {
    const c = run({ dob: '2004-06-01', riskIds: ['outbreak_b'], menbDoses: [
      { date: '2023-01-10', brand: 'Bexsero' }, { date: '2023-02-20', brand: 'Bexsero' }, { date: '2023-07-20', brand: 'Bexsero' }, { date: '2024-09-01', brand: 'Bexsero' }] }).menb[0];
    expect(c.doseLabel).toBe('Complete (outbreak booster given)');
    expect(c.note.lead).toBe('A serogroup B outbreak calls for one MenB booster, at least 1 year after the primary series, and it has been given [c][c].');
    expect(keys(c.noteCites)).toEqual(['acip2020Table8MenbOutbreakBooster', CDC_KEY]);
    expect(pageCited(c)).toBe(true);
  });
});

describe('C4: the CDC recommendations page is off cards it says nothing for', () => {
  it('college resident in a serogroup B outbreak: no MenACWY card lists the page', () => {
    for (const menacwyDoses of [[], [{ date: '2025-11-22', brand: 'MenQuadfi' }]]) {
      const r = run({ dob: '2007-06-01', riskIds: ['college_dorm', 'outbreak_b'], menacwyDoses });
      expect(r.menacwy.length).toBeGreaterThan(0);
      for (const c of r.menacwy) expect(onCard(c)).toBe(false);
      expect(r.menb.some(onCard)).toBe(true);
    }
  });

  it('outbreak, 2 y: the "not yet due" MenB card does not list the page', () => {
    const c = run({ dob: '2024-06-01', riskIds: ['outbreak_b'] }).menb[0];
    expect(c.doseLabel).toBe('Not yet due (from 10 years)');
    expect(onCard(c)).toBe(false);
  });

  it('control: asplenia, 19 y: the "every 2–3 years" booster line does not cite the page', () => {
    const c = run({ dob: '2007-06-01', riskIds: ['asplenia'] }).menb[0];
    expect(c.boosterSummary).toBe('Boosters: 1 year after the series, then every 2–3 years while at risk [c]');
    expect(pageCited(c)).toBe(false);
  });
});
