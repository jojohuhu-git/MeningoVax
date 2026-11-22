// C4, document 1, part 2: ACIP 2020 (rr6909a1) on the MenACWY exposure cards
// (port Phase 8; owner Q12, 2026-11-21: decide alone when the dose is
// unchanged).
//
// Measured over the saved-answers grid with scripts/uncitedByDocument.mjs:
// after part 1, ACIP 2020 still sat uncited on 3,576 cards, every one a
// MenACWY exposure card (microbiologist Table 7, military/college Table 10,
// travel Table 9, A/C/W/Y outbreak Table 8). No sentence on those cards cited
// the report, so its button was unnumbered.
//
// Read live 2026-11-21 in the browser pane; every quote below is an exact
// substring of the rendered page (refs.js keys in brackets):
//   Booster line, lab exposure  Table 7 "Single dose at 5 yrs after primary
//     vaccination and every 5 yrs thereafter"  [acip2020Table7MicrobiologistBooster]
//   Booster line, travel        Table 9, same words, row "≥2 yrs"
//                                                     [acip2020Table9TravelBooster]
//   Dose 1, each group          the summary's list: "microbiologists routinely
//     exposed to isolates of Neisseria meningitidis"; "persons identified to be
//     at increased risk because of a meningococcal disease outbreak caused by
//     serogroups A, C, W, or Y"; "persons who travel to or live in areas in
//     which meningococcal disease is hyperendemic or epidemic"; "...; and
//     military recruits"                          [acip2020Indication*]
//   College, no dose            Table 10 footnote: "College freshmen living in
//     residence halls should receive at least 1 dose of MenACWY within 5 years
//     before college entry."               [acip2020College1DoseBeforeEntry]
//   College, dose before 16     Table 10 footnote: "If only 1 dose of vaccine
//     was administered before the 16th birthday, a booster dose should be
//     administered before enrollment."  [acip2020CollegeBoosterBeforeEnrollment]
//   Routine 16y still owed      Table 2: "Booster: 1 dose at age 16 yrs if
//     first dose administered before 16th birthday"   [acip2020Table2Booster16]
//
// Held back for the owner (Q12 case a): a microbiologist under 10. Table 7
// has only a "≥10 yrs" row, so those cards cite nothing new until the owner
// says what they should cite. The control below holds that.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-21';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const doc = (u) => String(u).split('#')[0];
const ACIP2020 = 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm';
const keys = (list) => (list ?? []).map((c) => c.key);

// The same test scripts/uncitedByDocument.mjs runs: is ACIP 2020 on the card
// with no sentence citing it?
function acip2020Uncited(r, card) {
  const perDose = r.history?.MenACWY?.perDose ?? [];
  const marks = [...(card.boosterCites ?? []), ...perDose.flatMap((v) => v?.reasonCites ?? []), ...(card.noteCites ?? [])];
  const cited = new Set(marks.map((m) => doc(m.page ?? m.key)));
  return (card.citations ?? []).some((b) => doc(b.url) === ACIP2020) && !cited.has(ACIP2020);
}
const marksIn = (s) => (String(s ?? '').match(/\[c\]/g) ?? []).length;
// The "Why this" fold (noteFold.js) may move the lead into the detail, so
// count the marks across the whole note.
const noteText = (card) => (typeof card.note === 'object'
  ? `${card.note?.lead ?? ''} ${card.note?.detail ?? ''}` : card.note) ?? '';

describe('C4 ACIP 2020 part 2: each MenACWY exposure card cites the report where it speaks', () => {
  it('microbiologist, 30 y, no doses: dose 1 cites the summary; the booster line cites Table 7', () => {
    const r = run({ dob: '1996-06-01', riskIds: ['microbiologist'] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('Dose 1 (boosters while at risk)');
    expect(keys(c.boosterCites)).toEqual(['acip2020Table7MicrobiologistBooster']);
    expect(marksIn(c.boosterSummary)).toBe(1);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('microbiologist, 30 y, dose 6 years ago: the first booster card is cited', () => {
    const r = run({ dob: '1996-06-01', riskIds: ['microbiologist'], menacwyDoses: [{ date: '2020-11-01', brand: 'MenQuadfi' }] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('First booster (dose 2), 5 years after dose 1');
    expect(keys(c.boosterCites)).toEqual(['acip2020Table7MicrobiologistBooster']);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('travel, 12 y, no doses: cited by the travel sentence and Table 9', () => {
    const r = run({ dob: '2014-06-01', riskIds: ['travel'] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('Dose 1 (boosters while at risk)');
    expect(keys(c.noteCites)).toContain('acip2020IndicationTravel');
    expect(keys(c.boosterCites)).toEqual(['acip2020Table9TravelBooster']);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('travel and lab exposure, 30 y: one booster line, cited once (Table 9 covers both rows)', () => {
    const r = run({ dob: '1996-06-01', riskIds: ['travel', 'microbiologist'] });
    const c = r.menacwy[0];
    expect(marksIn(c.boosterSummary)).toBe(1);
    expect(keys(c.boosterCites)).toEqual(['acip2020Table9TravelBooster']);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('A/C/W/Y outbreak, 5 y, no doses: cites the outbreak sentence', () => {
    const r = run({ dob: '2021-06-01', riskIds: ['outbreak_acwy'] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('1 dose');
    expect(keys(c.noteCites)).toEqual(['acip2020IndicationOutbreakACWY']);
    expect(marksIn(noteText(c))).toBe(1);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('military recruit, 18 y, no doses: cites the military sentence', () => {
    const r = run({ dob: '2008-06-01', riskIds: ['military'] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('1 dose');
    expect(keys(c.noteCites)).toEqual(['acip2020IndicationMilitary']);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('military recruit, 17 y, one dose at 12: "routine booster still owed" cites Table 2', () => {
    const r = run({ dob: '2009-06-01', riskIds: ['military'], menacwyDoses: [{ date: '2021-07-01', brand: 'Menveo' }] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('Booster (16y)');
    expect(keys(c.noteCites)).toContain('acip2020Table2Booster16');
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('college resident, 18 y, no doses: cites the Table 10 footnote', () => {
    const r = run({ dob: '2008-06-01', riskIds: ['college_dorm'] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('1 dose');
    expect(keys(c.noteCites)).toEqual(['acip2020College1DoseBeforeEntry']);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('college resident, 17 y, one dated dose at 12: cites the Table 10 footnote', () => {
    const r = run({ dob: '2009-06-01', riskIds: ['college_dorm'], menacwyDoses: [{ date: '2021-07-01', brand: 'Menveo' }] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('1 dose (booster at ≥16y)');
    expect(keys(c.noteCites)).toEqual(['acip2020CollegeBoosterBeforeEnrollment']);
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('travel, 17 y, one dose at 12: the "Booster (16y)" card is cited', () => {
    const r = run({ dob: '2009-06-01', riskIds: ['travel'], menacwyDoses: [{ date: '2021-07-01', brand: 'Menveo' }] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('Booster (16y)');
    expect(acip2020Uncited(r, c)).toBe(false);
  });

  it('control, held for the owner: a microbiologist under 10 gets no Table 7 mark', () => {
    const r = run({ dob: '2021-06-01', riskIds: ['microbiologist'] });
    const c = r.menacwy[0];
    expect(c.doseLabel).toBe('Dose 1 (boosters while at risk)');
    expect(keys(c.boosterCites)).toEqual([]);
    expect(marksIn(c.boosterSummary)).toBe(0);
  });
});
