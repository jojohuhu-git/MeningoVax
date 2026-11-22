// C4, document 5: CDC's Adult Immunization Schedule notes (port Phase 8;
// owner Q12, 2026-11-21: decide alone when the dose is unchanged).
//
// Measured over the saved-answers grid (scripts/uncitedByDocument.mjs,
// 2026-11-22): the notes' button sat uncited on 1,252 cards, all of them a
// pregnant patient's MenB card (1,104 "Defer during pregnancy", ages 10–50;
// 148 "Not indicated", under 10). The grid has no pregnant patient with a
// second risk, so it also missed a pregnant patient with asplenia: her
// high-risk MenB cards carried the button and cited nothing from it.
//
// The notes, read live 2026-11-22 (updated July 2, 2025), under "Special
// situations for MenB": "Pregnancy: Delay MenB until after pregnancy due to
// lack of safety data in pregnant women. May administer if at increased risk
// and vaccination benefits outweigh potential risks." The schedule is
// "Recommendations for Ages 19 Years or Older". CDC's child/adolescent notes
// (read live the same day) say nothing about MenB in pregnancy; ACIP 2020's
// sentence ("vaccination with MenB should be deferred unless the woman is at
// increased risk ...") covers every age and stays on every card.
//
// - 19 and older, deferred: "MenB is generally deferred during pregnancy"
//   cites ACIP 2020, then the notes' first sentence.
// - 19 and older, high-risk: the pregnancy line ("Discuss the benefit and
//   potential risk before giving it") cites ACIP 2020, then the notes' second
//   sentence. It cited nothing before.
// - Under 19: the adult notes' button is off; the pregnancy line cites
//   ACIP 2020 alone.
// - Under 10, "Not indicated": nothing on the card is about pregnancy, so the
//   button is off.
// - No card carries the notes' button from the checkbox any more: a cited
//   sentence brings its own, so a pregnant adult whose high-risk series is
//   complete (nothing on the card about pregnancy) has none.
// Words unchanged; no dose, date or verdict moves.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS } from '../../data/refs.js';

const TODAY = '2026-11-22';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const DOC = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html';
const docOf = (u) => String(u).split('#')[0];
const keys = (list) => (list ?? []).map((c) => c.key);
const marks = (...s) => s.map((x) => (String(x ?? '').match(/\[c\]/g) ?? []).length).reduce((a, b) => a + b, 0);
const onCard = (card) => (card.citations ?? []).some((b) => docOf(b.url) === DOC);
const cited = (card) => (card.noteCites ?? []).some((m) => docOf(CITATIONS[m.key]?.url ?? m.page) === DOC);
const CAVEAT = 'Pregnancy: safety data for MenB in pregnancy are limited. Offered because of increased risk. Discuss the benefit and potential risk before giving it';

describe('C4: CDC Adult Notes back a pregnant adult\'s MenB card', () => {
  it('the two quoted sentences are the notes\' own, on the meningococcal note', () => {
    expect(CITATIONS.cdcAdultMenbPregnancyDelay.quote).toBe('Delay MenB until after pregnancy due to lack of safety data in pregnant women.');
    expect(CITATIONS.cdcAdultMenbPregnancyMayGive.quote).toBe('May administer if at increased risk and vaccination benefits outweigh potential risks.');
    for (const k of ['cdcAdultMenbPregnancyDelay', 'cdcAdultMenbPregnancyMayGive']) expect(docOf(CITATIONS[k].url)).toBe(DOC);
  });

  it('pregnant, 24 y: "deferred during pregnancy" cites ACIP 2020, then the notes', () => {
    const c = run({ dob: '2002-06-01', riskIds: ['pregnancy'] }).menb[0];
    expect(c.status).toBe('deferred');
    expect(c.note.lead).toBe('MenB is generally deferred during pregnancy [c][c].');
    expect(keys(c.noteCites)).toEqual(['menbPregnancyDeferral', 'cdcAdultMenbPregnancyDelay']);
    expect(marks(c.note.lead, c.note.detail)).toBe(c.noteCites.length);
    expect(onCard(c)).toBe(false); // the cited sentence brings its own button
    expect(cited(c)).toBe(true);
  });

  it('pregnant with asplenia, 24 y: every MenB card\'s pregnancy line cites ACIP 2020, then the notes', () => {
    const histories = [
      [],
      [{ date: '2026-10-01', brand: 'Bexsero' }],
      [{ date: '2026-05-01', brand: 'Bexsero' }, { date: '2026-06-15', brand: 'Bexsero' }],
      [{ date: '2025-01-10', brand: 'Bexsero' }, { date: '2025-02-20', brand: 'Bexsero' }, { date: '2025-07-20', brand: 'Bexsero' }],
    ];
    for (const menbDoses of histories) {
      for (const c of run({ dob: '2002-06-01', riskIds: ['pregnancy', 'asplenia'], menbDoses }).menb) {
        const text = `${c.note.lead} ${c.note.detail ?? ''}`;
        expect(text).toContain(`${CAVEAT} [c][c].`);
        expect(keys(c.noteCites).slice(-2)).toEqual(['menbPregnancyDeferral', 'cdcAdultMenbPregnancyMayGive']);
        expect(marks(c.note.lead, c.note.detail)).toBe(c.noteCites.length);
        expect(cited(c)).toBe(true);
      }
    }
  });
});

describe('C4: the adult notes are off cards for patients under 19', () => {
  it('pregnant, 16 y: deferred card cites ACIP 2020 alone, no adult-notes button', () => {
    const c = run({ dob: '2010-06-01', riskIds: ['pregnancy'] }).menb[0];
    expect(c.status).toBe('deferred');
    expect(c.note.lead).toBe('MenB is generally deferred during pregnancy [c].');
    expect(keys(c.noteCites)).toEqual(['menbPregnancyDeferral']);
    expect(onCard(c) || cited(c)).toBe(false);
  });

  it('pregnant with a complement deficiency, 16 y: the pregnancy line cites ACIP 2020 alone', () => {
    for (const c of run({ dob: '2010-06-01', riskIds: ['pregnancy', 'complement'] }).menb) {
      expect(`${c.note.lead} ${c.note.detail ?? ''}`).toContain(`${CAVEAT} [c].`);
      expect(keys(c.noteCites).at(-1)).toBe('menbPregnancyDeferral');
      expect(marks(c.note.lead, c.note.detail)).toBe(c.noteCites.length);
      expect(onCard(c) || cited(c)).toBe(false);
    }
  });

  it('pregnancy checked at 5 y: the "Not indicated" MenB card has no adult-notes button', () => {
    const c = run({ dob: '2021-06-01', riskIds: ['pregnancy'] }).menb[0];
    expect(c.status).toBe('not-indicated');
    expect(onCard(c) || cited(c)).toBe(false);
  });

  it('pregnant, 24 y, serogroup B outbreak, its one booster given: no pregnancy line, no adult-notes button', () => {
    const c = run({ dob: '2002-06-01', riskIds: ['pregnancy', 'outbreak_b'], menbDoses: [
      { date: '2023-01-10', brand: 'Bexsero' }, { date: '2023-02-20', brand: 'Bexsero' }, { date: '2023-07-20', brand: 'Bexsero' }, { date: '2024-09-01', brand: 'Bexsero' }] }).menb[0];
    expect(c.doseLabel).toBe('Complete (outbreak booster given)');
    expect(`${c.note.lead} ${c.note.detail ?? ''}`).not.toContain('Pregnancy:');
    expect(onCard(c) || cited(c)).toBe(false);
  });
});
