// C13 (port Phase 8, 2026-11-23) — a quote is written about the card's own age
// band. Ported from PneumoVax's FINDING N (`regression-finding-n-2026-10-23-
// child-notes-age-band-row`): the population guard (C5) checks the patient
// GROUP a sentence is about, and is blind to AGE inside one group.
//
// SOURCE, read live 2026-11-23 (ACIP 2020, rr6909a1.htm, every table's rows):
//   Tables 4 (complement) and 5 (asplenia): a "2–9 yrs" row holding
//     "Aged <7 yrs: Single dose at 3 yrs…" / "Aged ≥7 yrs: Single dose at 5 yrs…",
//     and a separate "≥10 yrs" row: "Single dose at 5 yrs after primary
//     vaccination and every 5 yrs thereafter".
//   Tables 6 (HIV) and 9 (travel): one "≥2 yrs" row holding both "Aged" lines,
//     so "Aged ≥7 yrs" is their own row at every age.
//
// MEASURED BEFORE THE FIX (22,536 saved patients):
//   6,550 MenACWY cards for patients aged 7 or older read "Boosters: 3 years
//     after the series if it ends before 7 years [c], otherwise 5 [c]…",
//     quoting the "Aged <7 yrs" sentence to a patient whose series cannot end
//     before 7.
//   ~4,400 showings of the 2–9 row's "Aged ≥7 yrs" sentence to complement or
//     asplenia patients whose series ended at 10 or older.
//
// OWNER, 2026-11-23: part 1 "Drop the under-7 clause" (from age 7 the line is
// "Boosters: 5 years after the series [c], then every 5 years while at risk");
// part 2 "Say '10 years or older'" (the series-complete note, complement or
// asplenia, series ended at 10+). Every other change is citation only (Q12).
// No dose, date or status moves.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

const TWO_TO_NINE_ROW = ['boosterAtOrAfterAge7', 'boosterAtOrAfterAge7Asplenia', 'boosterBeforeAge7', 'boosterBeforeAge7Asplenia'];
const keysOf = (list) => (list ?? []).map((c) => c.key);

const cases = buildSavedAnswerCases();
const cards = [];
for (const c of cases) {
  const out = recommend(c.input);
  if (out.excluded) continue;
  for (const card of out.menacwy ?? []) cards.push({ c, card });
}

describe('C13: a MenACWY booster quote fits the patient\'s age band', () => {
  it('sweeps a real number of cards', () => {
    expect(cards.length).toBeGreaterThan(20000);
  });

  it('from age 7 no booster line mentions a series ending before 7', () => {
    const older = cards.filter(({ c }) => c.input.ageMonths >= 84);
    const bad = older.filter(({ card }) => /ends before 7/.test(card.boosterSummary ?? ''));
    expect(bad.map(({ c }) => c.key).slice(0, 5)).toEqual([]);
    // ...and the new line is really there, so the sweep is not vacuous.
    const said = older.filter(({ card }) => /^Boosters: 5 years after the series \[c\], then every 5 years while at risk/.test(card.boosterSummary ?? ''));
    expect(said.length).toBeGreaterThan(5000);
  });

  it('under 7, the line keeps both halves and both quotes (control)', () => {
    const young = cards.filter(({ c, card }) => c.input.ageMonths >= 24 && c.input.ageMonths < 84 && /ends before 7/.test(card.boosterSummary ?? ''));
    expect(young.length).toBeGreaterThan(100);
    for (const { card } of young) expect(card.boosterCites.length).toBeGreaterThanOrEqual(2);
  });

  it('complement or asplenia, 10 or older, no MenACWY yet: the booster line quotes the ≥10 row only', () => {
    const hit = cards.filter(({ c, card }) => c.input.ageMonths >= 120 && (c.input.menacwyDoses ?? []).length === 0
      && ['complement', 'asplenia'].some((id) => c.input.riskIds.includes(id))
      && /high-risk primary series/.test(card.doseLabel ?? ''));
    expect(hit.length).toBeGreaterThan(400);
    for (const { c, card } of hit) {
      expect(keysOf(card.boosterCites), c.key).toContain('boosterFrom10');
      for (const k of TWO_TO_NINE_ROW) expect(keysOf(card.boosterCites), c.key).not.toContain(k);
    }
  });

  it('the ≥10 row is never quoted to a child whose series cannot reach 10', () => {
    const bad = cards.filter(({ c, card }) => c.input.ageMonths < 118
      && [...keysOf(card.boosterCites), ...keysOf(card.noteCites)].includes('boosterFrom10'));
    expect(bad.map(({ c }) => c.key)).toEqual([]);
  });

  it('the series-complete note names the age of the row it quotes', () => {
    let ten = 0;
    for (const { c, card } of cards) {
      const d = card.note?.detail ?? '';
      const k = keysOf(card.noteCites);
      if (/ended at 10 years or older/.test(d)) { ten++; expect(k, c.key).toEqual(['boosterFrom10']); }
      if (/ended at 7 years or older/.test(d)) expect(k, c.key).not.toContain('boosterFrom10');
    }
    expect(ten).toBeGreaterThan(100);
  });
});
