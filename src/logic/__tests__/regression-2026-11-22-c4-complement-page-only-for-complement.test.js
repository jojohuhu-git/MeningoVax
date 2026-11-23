// C4, document 3: CDC's "Managing Meningococcal Disease Risk in Patients
// Receiving Complement Inhibitor Therapy" page (port Phase 8; owner Q12,
// 2026-11-21: decide alone when the dose is unchanged).
//
// Measured over the saved-answers grid (scripts/uncitedByDocument.mjs,
// 2026-11-22): the page's button sat uncited on 6,224 cards. 3,720 of them
// belonged to patients with NO complement risk: every high-risk MenB dose 1
// card listed the page by hand (asplenia, microbiologist, serogroup B
// outbreak). The page, read live 2026-11-22, is about complement-inhibitor
// therapy only ("CDC recommends both MenACWY and MenB vaccines for people
// receiving a complement inhibitor"), so it says nothing those cards say.
//
// A complement patient keeps the button (the risk factor's own refs; owner
// 2026-07-23: "cdcComplementInhibitor stays"). Owner, 2026-11-22, "Cite on
// booster lines": each "... while at risk" booster line gets the page's own
// sentence after it, and the under-10 MenB card's "3-dose" gets "MenB vaccines
// need 3 doses". Words unchanged.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-22';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const PAGE = 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html';
const keys = (list) => (list ?? []).map((c) => c.key);
const marksIn = (s) => (String(s ?? '').match(/\[c\]/g) ?? []).length;
const pageCited = (card) => [...(card.boosterCites ?? []), ...(card.noteCites ?? [])].some((m) => String(m.page ?? m.key).split('#')[0] === PAGE);
const onCard = (card) => (card.citations ?? []).some((b) => String(b.url).split('#')[0] === PAGE);

describe('C4: the complement-inhibitor page is a source only for a complement patient', () => {
  it.each([['asplenia'], ['microbiologist'], ['outbreak_b']])('%s, 19 y, no MenB doses: MenB dose 1 does not list the page', (risk) => {
    const r = run({ dob: '2007-06-01', riskIds: [risk] });
    const c = r.menb[0];
    expect(c.doseLabel).toBe('Dose 1 of 3 (high-risk series)');
    expect(onCard(c)).toBe(false);
    for (const card of [...r.menacwy, ...r.menb]) expect(onCard(card)).toBe(false);
  });

  it('control: complement, 19 y, no MenB doses: MenB dose 1 still lists the page', () => {
    const c = run({ dob: '2007-06-01', riskIds: ['complement'] }).menb[0];
    expect(c.doseLabel).toBe('Dose 1 of 3 (high-risk series)');
    expect(onCard(c)).toBe(true);
  });

  it('control: asplenia AND complement: the page is listed (the complement risk brings it)', () => {
    const c = run({ dob: '2007-06-01', riskIds: ['asplenia', 'complement'] }).menb[0];
    expect(onCard(c)).toBe(true);
  });
});

describe('C4: on a complement patient\'s cards, the page backs the booster cadence (owner 2026-11-22)', () => {
  it('complement, 19 y, no doses: MenACWY and MenB booster lines cite the page last', () => {
    const r = run({ dob: '2007-06-01', riskIds: ['complement'] });
    const a = r.menacwy[0];
    // C13 (owner 2026-11-23, "Drop the under-7 clause"): a 19-year-old's series cannot end before 7.
    expect(a.boosterSummary).toBe('Boosters: 5 years after the series [c], then every 5 years while at risk [c]');
    expect(keys(a.boosterCites)).toEqual(['boosterFrom10', 'cdcComplementMenacwyBoosterEvery5']);
    expect(keys(a.boosterCites).at(-1)).toBe('cdcComplementMenacwyBoosterEvery5');
    expect(marksIn(a.boosterSummary)).toBe(a.boosterCites.length);
    const b = r.menb[0];
    expect(b.boosterSummary).toBe('Boosters: 1 year after the series, then every 2–3 years while at risk [c][c]');
    expect(keys(b.boosterCites)).toEqual(['acip2020MenbBoosterCadence', 'cdcComplementMenbBoosterEvery2to3']);
    for (const c of [a, b]) expect(pageCited(c)).toBe(true);
  });

  it('complement, 3 Bexsero doses over a year ago: the MenB booster card is cited', () => {
    const c = run({ dob: '2004-06-01', riskIds: ['complement'], menbDoses: [
      { date: '2024-11-01', brand: 'Bexsero' }, { date: '2024-12-15', brand: 'Bexsero' }, { date: '2025-05-15', brand: 'Bexsero' }] }).menb[0];
    expect(c.doseLabel).toMatch(/^First booster/);
    expect(keys(c.boosterCites).at(-1)).toBe('cdcComplementMenbBoosterEvery2to3');
    expect(marksIn(c.boosterSummary)).toBe(c.boosterCites.length);
  });

  it('complement, 2 y: MenB "3-dose" cites "MenB vaccines need 3 doses"; MenACWY child line cited', () => {
    const r = run({ dob: '2024-06-01', riskIds: ['complement'] });
    const b = r.menb[0];
    expect(b.note.detail).toBe('This patient has a high-risk indication, so track them for the 3-dose high-risk MenB series [c] once they reach age 10 [c].');
    expect(keys(b.noteCites)).toEqual(['menbLicensedAge1025Acip2024', 'cdcComplementMenb3Doses', 'acip2020MenbRiskGroups']);
    expect(pageCited(b)).toBe(true);
    const a = r.menacwy[0];
    expect(keys(a.boosterCites).at(-1)).toBe('cdcComplementMenacwyBoosterEvery5');
    expect(marksIn(a.boosterSummary)).toBe(a.boosterCites.length);
  });

  it('control: asplenia, 19 y and 2 y: no booster line or note cites the page', () => {
    for (const dob of ['2007-06-01', '2024-06-01']) {
      const r = run({ dob, riskIds: ['asplenia'] });
      for (const c of [...r.menacwy, ...r.menb]) expect(pageCited(c)).toBe(false);
    }
    expect(run({ dob: '2007-06-01', riskIds: ['asplenia'] }).menb[0].boosterSummary)
      .toBe('Boosters: 1 year after the series, then every 2–3 years while at risk [c]');
  });
});
