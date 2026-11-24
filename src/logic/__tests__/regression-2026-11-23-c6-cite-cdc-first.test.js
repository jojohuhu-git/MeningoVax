// C6 (port Phase 8, 2026-11-23) — cite CDC first; immunize.org only where CDC
// does not state the claim. Ported from PneumoVax (2026-10-23).
//
// MEASURED 2026-11-23 over every saved patient (45,072 cards): one immunize.org
// source was left, the Ask the Experts answer "ACIP considers a dose of MenACWY
// given to a 10-year-old child to be valid for the first dose in the adolescent
// series", on 658 cards (a healthy child whose MenACWY dose was given at 10).
// Read live the same day, CDC's own ACIP 2020 report states it: "Children who
// received MenACWY at age 10 years do not need an additional dose at age 11–12
// years" (CDC's schedule notes and catch-up table are silent). Owner,
// 2026-11-23: "Cite CDC only". The card's answer and words are unchanged; its
// immunize.org button is gone. Now 0 cards cite immunize.org.
//
// Control: a dose given before age 10 never had the age-10 sentence and still does not.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

const urlsOf = (r) => ['MenACWY', 'MenB'].flatMap((fam) => {
  const list = fam === 'MenACWY' ? r.menacwy ?? [] : r.menb ?? [];
  const perDose = r.history?.[fam]?.perDose ?? [];
  return list.flatMap((card) => [...(card.boosterCites ?? []), ...perDose.flatMap((v) => v?.reasonCites ?? []), ...(card.noteCites ?? []), ...(card.citations ?? [])]
    .map((m) => String(m.page ?? m.url ?? '')));
});

describe('C6: cite CDC first', () => {
  it('a healthy 11-year-old with MenACWY at age 10: the age-10 sentence quotes ACIP 2020', () => {
    const c = buildSavedAnswerCases().find((x) => x.key === 'a132|r:|A:MenQuadfi@365|B:');
    const card = recommend(c.input).menacwy[0];
    expect(card.note.lead + card.note.detail).toMatch(/given at age 10/);
    expect(card.noteCites.map((m) => m.key)).toEqual(['acip2020Age10NoAdditionalDose']);
    expect(card.noteCites[0].quote).toBe('Children who received MenACWY at age 10 years do not need an additional dose at age 11–12 years');
  });

  it('no saved card cites immunize.org (658 before C6)', () => {
    let cards = 0;
    const found = [];
    for (const c of buildSavedAnswerCases()) {
      const r = recommend(c.input);
      if (r.excluded) continue;
      cards += (r.menacwy ?? []).length + (r.menb ?? []).length;
      if (urlsOf(r).some((u) => u.includes('immunize.org'))) found.push(c.key);
    }
    expect(cards).toBeGreaterThan(40000);
    expect(found.slice(0, 5)).toEqual([]);
  }, 300_000);

  it('control: a dose before age 10 (here age 6) never gets the age-10 sentence', () => {
    const c = buildSavedAnswerCases().find((x) => x.key === 'a132|r:|A:Menveo@1825|B:');
    expect(c, 'Menveo at age 6, healthy 11-year-old').toBeTruthy();
    const keys = recommend(c.input).menacwy.flatMap((card) => card.noteCites ?? []).map((m) => m.key);
    expect(keys).not.toContain('acip2020Age10NoAdditionalDose');
  });
});
