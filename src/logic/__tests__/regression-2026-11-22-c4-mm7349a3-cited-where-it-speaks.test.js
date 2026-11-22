// C4, document 2: ACIP's October 2024 Bexsero report (MMWR 73(49);1124,
// mm7349a3), port Phase 8; owner Q12, 2026-11-21 ("same as PneumoVax": decide
// alone when the dose is unchanged). Owner picked this document next,
// 2026-11-22.
//
// Measured over the saved-answers grid with scripts/uncitedByDocument.mjs:
// the report's button sat on 7,459 cards with no sentence citing it, so the
// button was unnumbered. Each group below either gets the report's own
// sentence on the line it backs, or loses the button because the report says
// nothing the card says.
//
// Read live 2026-11-22 in the browser pane; every quote is an exact substring
// of the rendered page (refs.js keys in brackets):
//   Healthy, not routine     "Vaccination against serogroup B meningococcal
//     disease is recommended by the Advisory Committee on Immunization
//     Practices (ACIP) for adolescents and young adults aged 16–23 years, based
//     on shared clinical decision-making"           [menbScdm1623General]
//   High-risk dose 2         "ACIP recommends that MenB-4C be administered as a
//     3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at
//     increased risk ..."  (already quoted; dose 1 and dose 3 cite it)
//                                                  [menbHighRisk3DoseSchedule]
//   High-risk booster        "Booster doses need to be from the same
//     manufacturer used for doses in the primary series"
//                                                [menbBoosterSameManufacturer]
//   Healthy 2 doses, done    "When administering the 2-dose series (e.g., for
//     healthy adolescents) of MenB-4C (Bexsero) or MenB-FHbp (Trumenba), the 2
//     doses should be separated by 6 months"  [menbHealthy2DoseSeparated6Months]
//     and "Persons who have completed a MenB vaccine primary series and who
//     remain or become at increased risk for invasive meningococcal disease are
//     recommended to receive booster vaccination"
//                                          [menbBoosterIfRemainOrBecomeAtRisk]
//   High-risk under 10       "Two serogroup B meningococcal vaccines (...) and
//     one serogroup ABCWY pentavalent meningococcal (MenABCWY) vaccine (...) are
//     currently licensed for use in persons aged 10–25 years in the United
//     States"                                   [menbLicensedAge1025Acip2024]
//
// Button removed (the report says nothing these cards say):
//   MenACWY cards of a serogroup B outbreak patient: the report is about MenB
//     only. `outbreak_b` keeps it on MenB cards (`menbRefs`).
//   MenB "Complete (outbreak booster given)": its two sentences are ACIP 2020
//     Table 8 and its booster tables; the 2024 report leaves boosters
//     "unchanged".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-22';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const doc = (u) => String(u).split('#')[0];
const MM = 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm';
const keys = (list) => (list ?? []).map((c) => c.key);
const onCard = (card) => (card.citations ?? []).some((b) => doc(b.url) === MM);

// The same test scripts/uncitedByDocument.mjs runs.
function mmUncited(r, card, family) {
  const perDose = r.history?.[family]?.perDose ?? [];
  const marks = [...(card.boosterCites ?? []), ...perDose.flatMap((v) => v?.reasonCites ?? []), ...(card.noteCites ?? [])];
  const cited = new Set(marks.map((m) => doc(m.page ?? m.key)));
  return onCard(card) && !cited.has(MM);
}
const marksIn = (s) => (String(s ?? '').match(/\[c\]/g) ?? []).length;
const noteText = (card) => `${card.note?.lead ?? ''} ${card.note?.detail ?? ''}`;
// Every [c] in the note has its own entry, and no entry is left over.
const marksMatch = (card) => expect(marksIn(noteText(card))).toBe((card.noteCites ?? []).length);

describe('C4 mm7349a3: the 2024 report is cited on the card line it backs', () => {
  it('healthy 12 y: "from 16 through 23 years, by shared clinical decision-making" cites the report', () => {
    const r = run({ dob: '2014-06-01' });
    const c = r.menb[0];
    expect(c.doseLabel).toBe('Not routinely indicated');
    expect(keys(c.noteCites)).toEqual(['menbScdm1623General', 'menbHealthyPreferredAge1618']);
    marksMatch(c);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  it('healthy 30 y: the shared-decision window line cites the report', () => {
    const r = run({ dob: '1996-06-01' });
    const c = r.menb[0];
    expect(c.doseLabel).toBe('Not routinely indicated');
    expect(keys(c.noteCites)).toEqual(['menbHealthyPreferredAge1618', 'menbScdm1623General']);
    marksMatch(c);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  // Phase 8 item 7 (2026-11-22): each family cites the report's own sentence
  // for it, MenB-4C's in the Recommendations, MenB-FHbp's in the Introduction.
  it.each([['Bexsero', 'menbHighRisk3DoseSchedule'], ['Trumenba', 'menbFhbpSchedules']])('complement, 19 y, one %s dose a year ago: the dose 2 line cites the 3-dose schedule', (brand, key) => {
    const r = run({ dob: '2007-06-01', riskIds: ['complement'], menbDoses: [{ date: '2025-11-22', brand }] });
    const c = r.menb[0];
    expect(c.doseNum).toBe(2);
    expect(keys(c.noteCites)).toEqual([key]);
    marksMatch(c);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  it('complement, 19 y, dose 2 not yet due: the mark sits before the earliest-date clause', () => {
    const r = run({ dob: '2007-06-01', riskIds: ['complement'], menbDoses: [{ date: '2026-11-08', brand: 'Bexsero' }] });
    const c = r.menb[0];
    expect(c.doseNum).toBe(2);
    expect(c.dueToday).toBe(false);
    expect(noteText(c)).toMatch(/about 6 months after dose 1 \[c\]\./);
    marksMatch(c);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  it('one Bexsero then one Trumenba dose: the dose 2 line and the switch line each keep their own source', () => {
    const r = run({ dob: '2007-06-01', riskIds: ['complement'], menbDoses: [{ date: '2025-11-22', brand: 'Bexsero' }, { date: '2025-12-27', brand: 'Trumenba' }] });
    const c = r.menb[0];
    expect(noteText(c)).toMatch(/Or complete the series with Trumenba/);
    expect([...keys(c.noteCites)].sort()).toEqual(['acip2020MenbMixedProductsSelectOne', 'menbHighRisk3DoseSchedule']);
    // Order follows the text: the mark after "no longer counts" is the
    // mixed-products sentence, the one after "6 months after dose 1" the schedule.
    const text = noteText(c);
    const order = [...text.matchAll(/no longer counts \[c\]|after dose 1 \[c\]/g)].map((m) => (m[0].startsWith('no') ? 'acip2020MenbMixedProductsSelectOne' : 'menbHighRisk3DoseSchedule'));
    expect(keys(c.noteCites)).toEqual(order);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  it('complement, 3 Bexsero doses, last over a year ago: the booster card\'s same-family line cites the report', () => {
    const r = run({ dob: '2004-06-01', riskIds: ['complement'], menbDoses: [
      { date: '2024-11-01', brand: 'Bexsero' }, { date: '2024-12-15', brand: 'Bexsero' }, { date: '2025-05-15', brand: 'Bexsero' }] });
    const c = r.menb[0];
    expect(c.doseLabel).toMatch(/^First booster/);
    expect(keys(c.noteCites)).toEqual(['menbHighRiskBoosterCadenceBox', 'menbBoosterSameManufacturer']);
    marksMatch(c);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  it('healthy 19 y, two Trumenba doses 6 months apart: the "complete" card cites the report', () => {
    const r = run({ dob: '2007-06-01', menbDoses: [{ date: '2025-01-10', brand: 'Trumenba' }, { date: '2025-07-10', brand: 'Trumenba' }] });
    const c = r.menb[0];
    expect(c.doseLabel).toBe('Complete (2-dose series)');
    expect(keys(c.noteCites)).toEqual(['menbHealthy2DoseSeparated6Months', 'menbBoosterIfRemainOrBecomeAtRisk']);
    marksMatch(c);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  it('serogroup B outbreak, 5 y: "licensed from age 10 years" cites the report', () => {
    const r = run({ dob: '2021-06-01', riskIds: ['outbreak_b'] });
    const c = r.menb[0];
    expect(c.doseLabel).toBe('Not yet due (from 10 years)');
    expect(keys(c.noteCites)).toEqual(['menbLicensedAge1025Acip2024', 'acip2020MenbRiskGroups']);
    marksMatch(c);
    expect(mmUncited(r, c, 'MenB')).toBe(false);
  });

  it('serogroup B outbreak, its one booster given: the 2024 report is not a source on that card', () => {
    const r = run({ dob: '2004-06-01', riskIds: ['outbreak_b'], menbDoses: [
      { date: '2023-01-10', brand: 'Bexsero' }, { date: '2023-02-20', brand: 'Bexsero' }, { date: '2023-07-20', brand: 'Bexsero' }, { date: '2024-09-01', brand: 'Bexsero' }] });
    const c = r.menb[0];
    expect(c.doseLabel).toBe('Complete (outbreak booster given)');
    expect(onCard(c)).toBe(false);
    // C4 CDC recommendations page (2026-11-22): the CDC page's sentence follows Table 8's.
    expect(keys(c.noteCites)).toEqual(['acip2020Table8MenbOutbreakBooster', 'cdcRecsMenbOutbreakBoosterYear']);
  });

  it('college resident in a serogroup B outbreak: the MenB-only report is not on the MenACWY card, still on the MenB card', () => {
    const r = run({ dob: '2007-06-01', riskIds: ['college_dorm', 'outbreak_b'], menacwyDoses: [{ date: '2025-11-22', brand: 'MenQuadfi' }] });
    expect(r.menacwy.some(onCard)).toBe(false);
    expect(r.menb.some(onCard)).toBe(true);
    for (const c of r.menb) expect(mmUncited(r, c, 'MenB')).toBe(false);
  });
});
