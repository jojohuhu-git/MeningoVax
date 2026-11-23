// Item 6 (owner, 2026-11-22): a high-risk MenB series that finished in an
// unusual way says why on its first-booster card, with ACIP's sentence.
// Decisions: docs/archive/decisions-2026-11-22-item6-counted-menb-doses.md.
//
// Before: the card said only "A MenB booster, 1 year after the primary series
// was completed", citing booster sentences. Nothing said why dose 3 was not
// needed (dose 2 ≥6 months after dose 1) or why
// an early dose 3 counted (ACIP's "unless", or owner C5), so the Rulebook's
// three rows for these cases showed only booster sources.
//
// The sentences checked here are the owner's words (decision record, answers
// 1–4); the quotes are refs.js entries, read live 2026-11-22.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { menbSeriesInfo, menbHighRiskSeriesShortcut } from '../seriesTotals.js';
import { creditPentavalents } from '../pentavalentCredit.js';
import { hasMenbRisk } from '../../data/riskFactors.js';
import { CITATIONS as REFS } from '../../data/refs.js';
import { MENB_HIGHRISK, MENB_DOSE3_EARLY, rowSources } from '../../data/rulebookPage.js';
import { buildSavedAnswerCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';

const BX = 'Bexsero (MenB)';
const MV = 'Menveo (MenACWY)';
const TODAY = '2026-11-19';
const patient = (...dates) => ({
  dob: '2006-06-01', today: TODAY, riskIds: ['asplenia'],
  menacwyDoses: ['2020-01-01', '2020-03-01', '2025-03-01'].map((date) => ({ date, brand: MV })),
  menbDoses: dates.map((date) => ({ date, brand: BX })),
});
const card = (input) => recommend(input).menb[0];
const noteText = (c) => [c.note?.lead, c.note?.detail].filter(Boolean).join(' ');
const firstSentence = (c) => noteText(c).split(/(?<=\.)\s+(?=[A-Z])/)[0];

const NO_D3 = 'menbHighRiskD2SixMonthsNoD3Acip2024';
const UNLESS = 'menbHighRiskEarlyD3Unless';

const CASES = [
  { name: 'A: dose 2 six months after dose 1', doses: ['2026-01-01', '2026-07-05'], key: NO_D3,
    line: 'Dose 3 is not needed: dose 2 was given at least 6 months after dose 1 [c].' },
  { name: 'A, grace: dose 2 two days short of 6 months', doses: ['2026-01-03', '2026-07-01'], key: NO_D3,
    line: 'Dose 3 is not needed: dose 2 was given 6 months after dose 1, within the 4-day grace period [c].' },
  { name: "B: dose 3 two months after dose 2, six after dose 1 (ACIP's \"unless\")", doses: ['2026-01-01', '2026-05-01', '2026-07-05'], key: UNLESS,
    line: 'Dose 3 counts: it was given at least 6 months after dose 1 [c].' },
  { name: 'B, grace', doses: ['2026-01-03', '2026-04-01', '2026-07-01'], key: UNLESS,
    line: 'Dose 3 counts: it was given 6 months after dose 1, within the 4-day grace period [c].' },
  { name: 'C: dose 3 four months after dose 2, five after dose 1 (owner C5)', doses: ['2026-01-01', '2026-01-29', '2026-05-30'], key: UNLESS,
    line: 'Dose 3 counts: it was given at least 4 months after dose 2 [c].' },
  { name: 'C, grace', doses: ['2026-01-01', '2026-01-29', '2026-05-27'], key: UNLESS,
    line: 'Dose 3 counts: it was given 4 months after dose 2, within the 4-day grace period [c].' },
];

describe('Item 6: a short or early high-risk MenB series says why it counts', () => {
  it('the new sentence is on file, read live 2026-11-22', () => {
    expect(REFS[NO_D3].quote).toBe('a third dose is not needed if the second dose was administered ≥6 months after the first dose');
    expect(REFS[NO_D3].url).toBe('https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm');
    expect(REFS[NO_D3].lastVerified).toBe('2026-11-22');
  });

  for (const c of CASES) {
    it(`${c.name}: "Why this" opens with the line and cites ACIP's sentence`, () => {
      const r = card(patient(...c.doses));
      expect(r.doseLabel).toMatch(/^First booster/);
      expect(firstSentence(r)).toBe(c.line);
      expect(r.noteCites[0].key).toBe(c.key);
      expect(r.noteCites[0].quote).toBe(REFS[c.key].quote);
      // The booster sentence and its sources follow, unchanged.
      expect(noteText(r)).toContain('A MenB booster, 1 year after the primary series was completed [c].');
      expect(r.noteCites.map((x) => x.key).slice(1)).toEqual(['menbHighRiskBoosterCadenceBox', 'menbBoosterSameManufacturer']);
    });
  }

  it('control: the plain 0 / 1 / 6-month series gets no new line', () => {
    const r = card(patient('2026-01-01', '2026-02-01', '2026-07-01'));
    expect(r.doseLabel).toMatch(/^First booster/);
    expect(firstSentence(r)).toBe('A MenB booster, 1 year after the primary series was completed [c].');
    expect(r.noteCites.map((x) => x.key)).toEqual(['menbHighRiskBoosterCadenceBox', 'menbBoosterSameManufacturer']);
  });

  it('a later booster card (series long finished) gets no new line', () => {
    const r = card(patient('2023-01-01', '2023-07-05', '2024-07-10'));
    expect(r.doseLabel).toMatch(/^Booster \(dose 4\)/);
    expect(noteText(r)).not.toMatch(/^Dose 3/);
  });

  it("the Rulebook's three rows now show the sentence each rests on", () => {
    expect(rowSources(MENB_HIGHRISK.note).map((s) => s.key)).toContain(NO_D3);
    expect(rowSources(MENB_DOSE3_EARLY.rows[1]).map((s) => s.key)).toContain(UNLESS);
    expect(rowSources(MENB_DOSE3_EARLY.rows[2]).map((s) => s.key)).toContain(UNLESS);
  });

  it('every test patient: the line appears exactly on the first-booster cards of these series', () => {
    const cases = [...buildSavedAnswerCases(), ...buildRecordProblemCases(), ...buildTypicalCases()];
    let withLine = 0;
    const wrong = [];
    for (const k of cases) {
      const out = recommend(k.input);
      if (out.excluded) continue;
      for (const r of out.menb ?? []) {
        const lead = noteText(r);
        const has = /^Dose 3 (is not needed|counts):/.test(lead);
        if (has) withLine += 1;
        // Recompute from the dose verdicts, not from the card. A combined
        // shot on the MenACWY list is a MenB dose too, as the engine credits it.
        const { menb: menbRecord } = creditPentavalents(k.input.menacwyDoses, k.input.menbDoses);
        // perDose follows the record in date order (a stable sort).
        const kept = [...menbRecord].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
          .filter((d, i) => d.date && out.history?.MenB?.perDose?.[i]?.status === 'valid');
        const hr = hasMenbRisk(k.input.riskIds ?? []);
        const total = menbSeriesInfo({ highRisk: true, doses: kept }).total;
        const expected = hr && /^First booster/.test(r.doseLabel ?? '') && kept.length === total
          && menbHighRiskSeriesShortcut(kept) != null;
        if (has !== expected) wrong.push(`${k.key}: ${r.doseLabel} | ${lead.slice(0, 80)}`);
      }
    }
    expect(wrong).toEqual([]);
    // Measured 2026-11-22 over 42,301 test patients: 1,792 cards (1,764 "Dose 3
    // is not needed", 252 of them within the grace; 28 "Dose 3 counts" from dose
    // 1 within the grace, all through a combined shot; 0 from dose 2).
    expect(withLine).toBeGreaterThanOrEqual(1792);
  });
});
