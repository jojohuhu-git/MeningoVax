// C4, the last two documents: immunize.org's "Ask the Experts" topic pages for
// MenACWY (https://www.immunize.org/ask-experts/topic/menacwy/) and MenB
// (https://www.immunize.org/ask-experts/topic/menb/).
//
// Measured over the saved-answers grid (scripts/uncitedByDocument.mjs,
// 2026-11-22): the MenACWY page's button sat uncited on 888 cards (a healthy
// adult 22 or older, "Not routinely indicated"), the MenB page's on 492 (a
// healthy MenB series whose dose 2 came under 6 months after dose 1). Both
// pages, read live 2026-11-22, say what those cards say, but each card already
// cites ACIP's own sentence for it, and ACIP outranks immunize.org.
//
// Owner, 2026-11-22: "Remove the buttons." Words and doses unchanged; each card
// keeps the ACIP button its sentence cites
// (docs/archive/decisions-2026-11-22-c4-immunize-org.md).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-22';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const TOPIC_PAGE = /^https:\/\/www\.immunize\.org\/ask-experts\/topic\/(menacwy|menb)\/?$/;
const onCard = (card) => (card.citations ?? []).some((b) => TOPIC_PAGE.test(String(b.url).split('#')[0]));
const shorts = (card) => (card.citations ?? []).map((b) => b.short);
const keys = (list) => (list ?? []).map((c) => c.key);

describe('C4: no card carries an immunize.org topic-page button (owner 2026-11-22)', () => {
  it('healthy 30-year-old, no doses: MenACWY "Not routinely indicated" lists ACIP 2020 only', () => {
    const c = run({ dob: '1996-06-01' }).menacwy[0];
    expect(c.status).toBe('not-indicated');
    expect(c.note.lead).toBe('MenACWY is not routinely recommended for a healthy adult of 22 or older [c].');
    // C13 (2026-11-23): ACIP Table 2's ≥24 row, not the 19–21 catch-up sentence.
    expect(keys(c.noteCites)).toEqual(['acip2020Table2NotRoutine24Plus']);
    expect(onCard(c)).toBe(false);
    expect(shorts(c)).toEqual(['ACIP 2020 MMWR']);
  });

  it('healthy 17-year-old, Bexsero 1 May and 1 Jul 2026: dose 3 card lists ACIP Oct 2024 only', () => {
    const c = run({
      dob: '2009-05-15',
      menbDoses: [{ brand: 'Bexsero (MenB)', date: '2026-05-01' }, { brand: 'Bexsero (MenB)', date: '2026-07-01' }],
    }).menb[0];
    expect(c.doseLabel).toBe('Dose 3 of 3 (dose 2 given early)');
    expect(c.note.detail).toBe('Dose 2 was given <6 months after dose 1. It counts. Dose 3 is due ≥4 months after dose 2 [c].');
    expect(keys(c.noteCites)).toEqual(['menbRescueDoseRule']);
    expect(onCard(c)).toBe(false);
    expect(shorts(c)).toEqual(['ACIP Oct 2024 MMWR']);
  });

  it('control: a 20-year-old\'s catch-up card is unchanged (ACIP 2020 only)', () => {
    const c = run({ dob: '2006-06-01' }).menacwy[0];
    expect(c.status).toBe('catchup');
    expect(shorts(c)).toEqual(['ACIP 2020 MMWR']);
  });

  it('the age-10 card quotes CDC\'s own sentence (C6, owner 2026-11-23 "Cite CDC only")', () => {
    // Until C6 this quoted immunize.org's answer; ACIP 2020 states the same rule.
    const r = run({
      dob: '2016-01-01',
      menacwyDoses: [{ brand: 'Menveo (MenACWY)', date: '2026-06-01' }],
    });
    const cites = [...r.menacwy.flatMap((c) => c.noteCites ?? []), ...(r.history?.MenACWY?.perDose ?? []).flatMap((v) => v?.reasonCites ?? [])];
    expect(keys(cites)).toContain('acip2020Age10NoAdditionalDose');
    // extinct: the immunize.org age-10 entry was removed by C6, 2026-11-23
    expect(keys(cites)).not.toContain('acwyAge10CountsAsDose1');
  });
});

describe('C6: no immunize.org MenACWY entry is left', () => {
  it('CITATIONS holds nothing from the immunize.org MenACWY page', async () => {
    const { CITATIONS } = await import('../../data/refs.js');
    const left = Object.keys(CITATIONS).filter((k) => String(CITATIONS[k].url).startsWith('https://www.immunize.org/ask-experts/topic/menacwy/'));
    expect(left).toEqual([]);
  });
});
