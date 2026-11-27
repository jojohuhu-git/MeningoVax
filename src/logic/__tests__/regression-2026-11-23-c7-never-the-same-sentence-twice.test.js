// C7 (port Phase 8, 2026-11-23) — never the same sentence twice.
//
// Ported from PneumoVax (FINDING N, 2026-10-23, and its C9-2 note: one entry
// per sentence; keys stay split only where the document words them
// differently). Two halves:
//
// 1. THE SOURCE LIST (refs.js). Two entries may quote the same words only when
//    the document prints those words in different places written about
//    different patients, so each entry's label and `population` (C5) stay
//    true. Read live 2026-11-23 (rr6909a1.htm): "Single dose at 5 yrs after
//    primary vaccination and every 5 yrs thereafter" is printed in Tables 4/5
//    (complement, asplenia; ≥10 yrs), Table 7 (microbiologists) and Table 9
//    (travelers). Three tables, three patient groups, three entries — the one
//    allowed group below. Any other pair is a duplicate: the Table 2 sentence
//    "Although routine vaccination is only recommended for adolescents aged
//    11–18 yrs, …" was stored twice (acip2020Table2RoutineOnly11to18, added by
//    C13 on 2026-11-23, and acip2020Table2CatchupOnly1921) — same table, same
//    row, same patients. Now one entry.
//
// 2. THE CARD. No card shows the same words under two entries, and no sentence
//    on a card carries two markers for the same quote. Measured 2026-11-23 over
//    every saved patient: 0 of 45,072 cards, before and after the merge.
//
// 0 answers moved; 0 sentences moved (the merged entry quotes the same words).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS } from '../../data/refs.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

// Entries allowed to share words, because each names a different table/group.
const SAME_WORDS_DIFFERENT_TABLES = [
  // boosterFrom10Asplenia: Table 5's copy of Table 4's ≥10 row, split 2026-11-26 (C9 part 2).
  ['acip2020Table7MicrobiologistBooster', 'acip2020Table9TravelBooster', 'boosterFrom10', 'boosterFrom10Asplenia'],
];

const quoteOf = (m) => m.quote ?? CITATIONS[m.key]?.quote;
const markers = (s) => String(s ?? '').split('[c]').length - 1;

describe('C7: never the same sentence twice', () => {
  it('refs.js stores each quoted sentence once, except the same words in different tables', () => {
    const byWords = new Map();
    for (const [key, e] of Object.entries(CITATIONS)) {
      if (!e.quote) continue;
      const w = e.quote.trim();
      byWords.set(w, [...(byWords.get(w) ?? []), key]);
    }
    const shared = [...byWords.values()].filter((ks) => ks.length > 1).map((ks) => [...ks].sort());
    expect(shared).toEqual(SAME_WORDS_DIFFERENT_TABLES);
  });

  it('the allowed group really is four different tables about four groups', () => {
    const [micro, travel, from10, from10Asplenia] = SAME_WORDS_DIFFERENT_TABLES[0].map((k) => CITATIONS[k]);
    expect(micro.label).toMatch(/Table 7 \(microbiologists/);
    expect(travel.label).toMatch(/Table 9 \(travelers/);
    expect(from10.label).toMatch(/Table 4 \(complement;/);
    expect(from10Asplenia.label).toMatch(/Table 5 \(asplenia;/);
  });

  it('the Table 2 sentence is one entry (the C13 adult card uses it)', () => {
    expect(CITATIONS.acip2020Table2RoutineOnly11to18).toBeUndefined();
    expect(CITATIONS.acip2020Table2CatchupOnly1921.quote).toMatch(/^Although routine vaccination is only recommended for adolescents aged 11–18 yrs/);
  });

  it('no card shows the same words under two entries, nor twice in one sentence', () => {
    let cards = 0;
    const twoEntries = [];
    const twiceInASentence = [];
    const checkSentences = (text, cites, key) => {
      let i = 0;
      for (const s of String(text ?? '').split(/(?<=[.!?])\s+/)) {
        const k = markers(s);
        const qs = cites.slice(i, i + k).map(quoteOf).filter(Boolean);
        i += k;
        if (new Set(qs).size < qs.length) twiceInASentence.push(`${key} | ${s}`);
      }
    };
    for (const c of buildSavedAnswerCases()) {
      const r = recommend(c.input);
      if (r.excluded) continue;
      for (const [family, list] of [['MenACWY', r.menacwy ?? []], ['MenB', r.menb ?? []]]) {
        const perDose = r.history?.[family]?.perDose ?? [];
        for (const v of perDose) {
          let i = 0;
          for (const s of v?.reasons ?? []) {
            const k = markers(s);
            checkSentences(s, (v.reasonCites ?? []).slice(i, i + k), c.key);
            i += k;
          }
        }
        for (const card of list) {
          cards++;
          const all = [...(card.boosterCites ?? []), ...perDose.flatMap((v) => v?.reasonCites ?? []), ...(card.noteCites ?? [])];
          const keysByWords = new Map();
          for (const m of all) {
            const w = quoteOf(m);
            if (!w) continue;
            keysByWords.set(w, new Set([...(keysByWords.get(w) ?? []), m.key]));
          }
          if ([...keysByWords.values()].some((ks) => ks.size > 1)) twoEntries.push(`${c.key} | ${family}`);
          const lead = card.note?.lead ?? '';
          const nc = card.noteCites ?? [];
          checkSentences(lead, nc.slice(0, markers(lead)), c.key);
          checkSentences(card.note?.detail ?? '', nc.slice(markers(lead)), c.key);
          checkSentences(card.boosterSummary ?? '', card.boosterCites ?? [], c.key);
        }
      }
    }
    expect(cards).toBeGreaterThan(40000);
    expect(twoEntries.slice(0, 5)).toEqual([]);
    expect(twiceInASentence.slice(0, 5)).toEqual([]);
  }, 300_000);
});
