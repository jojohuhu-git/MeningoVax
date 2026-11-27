// OUTBREAK-T8-QUOTE (2026-11-27) — the serogroup A/C/W/Y outbreak booster card
// quotes ACIP Table 8's own booster sentence, not the bare table.
//
// FOUND during C12 (2026-11-26): 740 numbered source marks in the saved-answers
// grid had no quoted sentence. Measured 2026-11-27: all 740 are the lead of the
// A/C/W/Y outbreak booster card ("A booster now: 5 years or more since the last
// MenACWY dose [c]." / "Booster <date> if outbreak risk continues [c]."), cited
// to `acip2020Table8`, a link to the table's title with no quote. (Earlier
// handoffs called them "serogroup B outbreak" numbers; they are not.)
//
// SOURCE, read live 2026-11-27 (ACIP 2020, rr6909a1.htm, Table 8 "persons who
// are at risk during an outbreak attributable to a vaccine serogroup", MenACWY
// column, 2–9 yrs and ≥10 yrs rows):
//   "Aged <7 yrs: Single dose if ≥3 yrs since vaccination"
//   "Aged ≥7 yrs: Single dose if ≥5 yrs since vaccination"
// Both already in refs.js since C5 (2026-11-22) as boosterBeforeAge7Outbreak
// and boosterAtOrAfterAge7Outbreak, and the dose checker already cites them for
// a booster given too soon (doseRules.js acwyBoosterGapCite). The card now
// picks the same one: the 3-year sentence when it states 3 years, else the
// 5-year one.
//
// Citation only (owner Q12, 2026-11-21: decide alone when the dose is
// unchanged). No dose, date, status or sentence moves.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS } from '../../data/refs.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

const outbreakCards = [];
for (const c of buildSavedAnswerCases()) {
  if (!c.input.riskIds.includes('outbreak_acwy')) continue;
  const out = recommend(c.input);
  if (out.excluded) continue;
  for (const card of out.menacwy ?? []) {
    if (/for this outbreak|if outbreak risk continues/.test(card.doseLabel ?? '')) outbreakCards.push({ c, card });
  }
}

const keys = (list) => (list ?? []).map((x) => x.key);
const years = (card) => Math.round(card.minIntervalDays / 365.25);

describe('OUTBREAK-T8-QUOTE: the A/C/W/Y outbreak booster card quotes Table 8', () => {
  it('sweeps a real number of outbreak booster cards', () => {
    expect(outbreakCards.length).toBeGreaterThan(500);
  });

  it('every number on the card opens a quoted sentence', () => {
    const bare = outbreakCards.filter(({ card }) => keys(card.noteCites).some((k) => !CITATIONS[k]?.quote));
    expect(bare.map(({ c }) => c.key).slice(0, 5)).toEqual([]);
  });

  it('the quote states the years the card states', () => {
    let three = 0;
    let five = 0;
    for (const { c, card } of outbreakCards) {
      const y = years(card);
      expect([3, 5], c.key).toContain(y);
      // Table 8's own sentence unless another ticked box shares the Table 4/6/9
      // wording (acwyBoosterRowKey, C5).
      const shared = ['complement', 'hiv', 'travel'].some((id) => c.input.riskIds.includes(id));
      const want = shared
        ? (y === 3 ? 'boosterBeforeAge7' : 'boosterAtOrAfterAge7')
        : (y === 3 ? 'boosterBeforeAge7Outbreak' : 'boosterAtOrAfterAge7Outbreak');
      expect(keys(card.noteCites), c.key).toEqual([want]);
      expect(CITATIONS[want].quote, c.key).toContain(`${y} yrs`);
      if (y === 3) three++; else five++;
    }
    // Both sentences are reached, so neither half of the check is vacuous.
    expect(three).toBeGreaterThan(0);
    expect(five).toBeGreaterThan(0);
  });

  it('the two Table 8 sentences are the words read live 2026-11-27', () => {
    expect(CITATIONS.boosterBeforeAge7Outbreak.quote).toBe('Aged <7 yrs: Single dose if ≥3 yrs since vaccination');
    expect(CITATIONS.boosterAtOrAfterAge7Outbreak.quote).toBe('Aged ≥7 yrs: Single dose if ≥5 yrs since vaccination');
  });
});
