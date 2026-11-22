// C4, document 1: ACIP 2020 (rr6909a1). A card credits this report only where
// one of its sentences cites it (port Phase 8; owner Q12, 2026-11-21).
//
// Read live 2026-11-21 in a browser, tables included
// (https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm). Measured over the
// saved-answers grid (18,780 patients, 35,056 cards) with a one-off script:
// 21,180 cards carried a button no sentence cited; ACIP 2020 was the largest
// document, on 10,777 of them.
//
// ── WHAT COMES OFF (MenB cards only), AND WHY ─────────────────────────────
// Each of these buttons reached a MenB card only because collectRefs() hands
// a risk factor's documents to EVERY card. ACIP's own table for that risk
// factor says it has no MenB recommendation:
//   travel        Table 9:  "No recommendations for use of MenB vaccines in
//                            this population unless otherwise indicated"
//   college_dorm  Table 10: same sentence
//   military      Table 10: same sentence
//   hiv           Table 6:  "No recommendations for use of MenB vaccines in
//                            these populations unless otherwise indicated"
//   outbreak_acwy Table 8 is for "an outbreak attributable to a vaccine
//                 serogroup"; its MenB column applies to a serogroup B
//                 outbreak (risk factor outbreak_b, which keeps its own
//                 documents), not to an A, C, W or Y outbreak.
// Under Q12 these are the agent's calls: the dose on every card is the same
// before and after (the saved-answers sweep holds every status, dose, date and
// brand).
//
// ── WHAT GETS CITED ───────────────────────────────────────────────────────
// The high-risk MenB booster line ("1 year after the series, then every 2–3
// years while at risk") cited nothing. ACIP 2020 says it: "receive a MenB
// booster dose 1 year after primary series completion, then every 2–3 years
// thereafter" (refs `acip2020MenbBoosterCadence`). The line now carries [c]
// for that sentence, so the ACIP 2020 button on those cards is numbered.
//
// The control: a MenACWY card for the same patients keeps its table, and a
// microbiologist's MenB card keeps Table 7 (Table 7 HAS a MenB column).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';

const run = (input) => recommend({ today: '2026-11-21', riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const doc = (u) => String(u).split('#')[0];
const ACIP2020 = 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm';
const labels = (card) => (card.citations ?? []).map((b) => b.label);

describe('C4 ACIP 2020: a MenB card does not carry a risk factor that has no MenB recommendation', () => {
  it.each([
    ['travel', 'Table 9'],
    ['college_dorm', 'Table 10'],
    ['military', 'Table 10'],
    ['outbreak_acwy', 'Table 8'],
  ])('asplenia + %s, 12 y: the MenB card has no %s button; the MenACWY card keeps it', (risk, table) => {
    const r = run({ dob: '2014-06-01', riskIds: ['asplenia', risk] });
    expect(r.menb[0].doseLabel).toBe('Dose 1 of 3 (high-risk series)');
    expect(labels(r.menb[0]).some((l) => l.includes(table))).toBe(false);
    expect(labels(r.menacwy[0]).some((l) => l.includes(table))).toBe(true);
  });

  it('HIV only, 19 y: the MenB card (shared decision) carries no ACIP 2020 button', () => {
    const r = run({ dob: '2007-06-01', riskIds: ['hiv'] });
    expect(r.menb[0].status).toBe('shared-decision');
    expect(r.menb[0].citations.some((b) => doc(b.url) === ACIP2020)).toBe(false);
  });

  it('control: a microbiologist keeps Table 7 on the MenB card (Table 7 has a MenB column)', () => {
    const c = run({ dob: '2014-06-01', riskIds: ['microbiologist'] }).menb[0];
    expect(c.doseLabel).toBe('Dose 1 of 3 (high-risk series)');
    expect(labels(c).some((l) => l.includes('Table 7'))).toBe(true);
  });

  it('every risk factor with no MenB indication says which documents its MenB card takes', () => {
    // A new risk factor must decide; leaving it unset would hand its
    // documents to every MenB card again. Pregnancy is the one exception
    // left to its own document's reading (CDC Adult Notes, C4 document to come).
    const undecided = RISK_FACTORS
      .filter((r) => !r.menbClass && !r.exclude && r.id !== 'pregnancy' && !('menbRefs' in r))
      .map((r) => r.id);
    expect(undecided).toEqual([]);
  });
});

describe('C4 ACIP 2020: the high-risk MenB booster line cites ACIP 2020', () => {
  it.each([
    ['complement', '2014-06-01', [], 'Dose 1 of 3 (high-risk series)'],
    ['asplenia', '2008-06-01', [{ date: '2026-01-01', brand: 'Bexsero' }], 'Dose 2 of 3 (high-risk'],
    ['microbiologist', '2014-06-01', [], 'Dose 1 of 3 (high-risk series)'],
  ])('%s, born %s: booster line ends in [c] and cites acip2020MenbBoosterCadence', (risk, dob, menbDoses, label) => {
    const c = run({ dob, riskIds: [risk], menbDoses }).menb[0];
    expect(c.doseLabel.startsWith(label)).toBe(true);
    // C4 complement page (owner, 2026-11-22, "Cite on booster lines"): a
    // complement patient's line adds CDC's complement-inhibitor sentence after
    // ACIP 2020's.
    const comp = risk === 'complement';
    expect(c.boosterSummary).toBe(`Boosters: 1 year after the series, then every 2–3 years while at risk [c]${comp ? '[c]' : ''}`);
    expect(c.boosterCites.map((x) => x.key)).toEqual(['acip2020MenbBoosterCadence', ...(comp ? ['cdcComplementMenbBoosterEvery2to3'] : [])]);
  });

  it('complement, 12 y: every ACIP 2020 button on the MenB card is now cited by a sentence', () => {
    const c = run({ dob: '2014-06-01', riskIds: ['complement'] }).menb[0];
    const cited = new Set([...(c.boosterCites ?? []), ...(c.noteCites ?? [])].map((m) => doc(m.page ?? m.key)));
    expect(c.citations.filter((b) => doc(b.url) === ACIP2020).every((b) => cited.has(doc(b.url)))).toBe(true);
  });

  it('a serogroup B outbreak alone: the one-booster line cites Table 8, not the 2–3-year sentence', () => {
    // Table 8, read live 2026-11-21: "Single dose if ≥1 yr after MenB primary
    // series completion". Every-2–3-years would contradict the line.
    const c = run({ dob: '2014-06-01', riskIds: ['outbreak_b'] }).menb[0];
    // C4 CDC recommendations page (2026-11-22): a second mark, the CDC page's
    // "if a year or more has passed" sentence; words unchanged.
    expect(c.boosterSummary).toBe('Booster: 1 dose, 1 year after the primary series, if outbreak risk continues [c][c]');
    expect(c.boosterCites.map((x) => x.key)).toEqual(['acip2020Table8MenbOutbreakBooster', 'cdcRecsMenbOutbreakBoosterYear']);
  });
});

describe('C4 ACIP 2020: a high-risk child under 10 is told, with ACIP\'s sentence, that MenB starts at 10', () => {
  it.each(['complement', 'microbiologist'])('%s, 2 y: "track them … once they reach age 10" cites acip2020MenbRiskGroups', (risk) => {
    // ACIP 2020, read live 2026-11-21: "ACIP recommends routine use of MenB
    // vaccine series among persons aged ≥10 years who are at increased risk…"
    const c = run({ dob: '2024-06-01', riskIds: [risk] }).menb[0];
    expect(c.doseLabel).toBe('Not yet due (from 10 years)');
    // C4 complement page (owner, 2026-11-22): a complement patient's "3-dose"
    // also cites CDC's "MenB vaccines need 3 doses".
    const comp = risk === 'complement';
    expect(c.note.detail).toBe(`This patient has a high-risk indication, so track them for the 3-dose high-risk MenB series${comp ? ' [c]' : ''} once they reach age 10 [c].`);
    // C4 mm7349a3 (2026-11-22): the lead's "licensed from age 10 years" now
    // cites the 2024 report first; the detail's last mark still cites ACIP 2020.
    expect(c.noteCites.map((x) => x.key)).toEqual(['menbLicensedAge1025Acip2024', ...(comp ? ['cdcComplementMenb3Doses'] : []), 'acip2020MenbRiskGroups']);
  });
});
