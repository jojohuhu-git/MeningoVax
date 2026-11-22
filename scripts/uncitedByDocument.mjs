// scripts/uncitedByDocument.mjs — port Phase 8, C4 (2026-11-21).
//
// Which grey source buttons does no sentence on the card cite? Runs every
// patient in the saved-answers grid (src/test-grid.js) through the engine,
// the same way scripts/citationMapping.mjs does, and counts, per DOCUMENT
// (a link with its "#..." dropped), the cards that carry its button uncited.
// Pass a document's URL to break it down by button, vaccine and card status,
// with the first patient of each kind:
//
//     node scripts/uncitedByDocument.mjs
//     node scripts/uncitedByDocument.mjs https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm
//
// C4 goes one document at a time; this picks the next one and measures it
// before and after. It changes nothing.
import { buildSavedAnswerCases } from '../src/test-grid.js';
import { recommend } from '../src/logic/recommend.js';
import { CITATIONS } from '../src/data/refs.js';

const documentOf = (url) => String(url).split('#')[0];
const keyOf = (b) => Object.entries(CITATIONS).find(([, v]) => v.url === b.url && v.label === b.label)?.[0] ?? '?';
const target = process.argv[2] ? documentOf(process.argv[2]) : null;
const perDocument = new Map();
const perButton = new Map();
let cards = 0;
let cardsWithUncited = 0;

for (const c of buildSavedAnswerCases()) {
  const r = recommend(c.input);
  if (r.excluded) continue;
  for (const [family, list] of [['MenACWY', r.menacwy ?? []], ['MenB', r.menb ?? []]]) {
    const perDose = r.history?.[family]?.perDose ?? [];
    for (const card of list) {
      cards++;
      const marks = [...(card.boosterCites ?? []), ...perDose.flatMap((v) => v?.reasonCites ?? []), ...(card.noteCites ?? [])];
      const cited = new Set(marks.map((m) => documentOf(m.page ?? m.key)));
      const uncited = (card.citations ?? []).filter((b) => !cited.has(documentOf(b.url)));
      if (uncited.length) cardsWithUncited++;
      for (const d of new Set(uncited.map((b) => documentOf(b.url)))) perDocument.set(d, (perDocument.get(d) ?? 0) + 1);
      for (const b of uncited) {
        if (documentOf(b.url) !== target) continue;
        const k = `${keyOf(b)} | ${family} | ${card.status}`;
        const row = perButton.get(k) ?? { n: 0, first: c.key };
        row.n++;
        perButton.set(k, row);
      }
    }
  }
}

console.log({ cards, cardsWithUncited });
for (const [d, n] of [...perDocument].sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(6), d);
if (target) {
  console.log(`\n${target}, by button | vaccine | card status:`);
  for (const [k, { n, first }] of [...perButton].sort((a, b) => b[1].n - a[1].n)) console.log(String(n).padStart(6), k, ' e.g.', first);
}
