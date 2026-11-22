// scripts/citationMapping.mjs — port Phase 8, measurement (2026-11-21).
//
// Do a card's raised numbers and its grey source buttons agree? Runs every
// patient in the saved-answers grid (src/test-grid.js) through the engine and,
// for each card, compares the DOCUMENTS its sentences cite (booster line, the
// verdicts on its recorded doses, its note) with the documents its buttons
// link to. A link's "#..." part is dropped first: one document can be linked
// at several sentences, and it is still one document.
//
// PneumoVax measures the same thing with its own scripts/citationMapping.mjs
// (C2/C3, 2026-10-17). Run from the repo root:
//
//     node scripts/citationMapping.mjs
//
// It prints counts and the first patient of each kind. It changes nothing.
import { buildSavedAnswerCases } from '../src/test-grid.js';
import { recommend } from '../src/logic/recommend.js';

const documentOf = (url) => String(url).split('#')[0];
const cases = buildSavedAnswerCases();
const counts = { patients: cases.length, cards: 0, numberWithNoButton: 0, buttonWithNoNumber: 0, sameSentenceTwice: 0 };
const examples = { numberWithNoButton: new Map(), buttonWithNoNumber: new Map(), sameSentenceTwice: new Map() };
const note = (kind, label, key) => { if (!examples[kind].has(label)) examples[kind].set(label, key); };

for (const c of cases) {
  const r = recommend(c.input);
  if (r.excluded) continue;
  for (const [family, cards] of [['MenACWY', r.menacwy ?? []], ['MenB', r.menb ?? []]]) {
    const perDose = r.history?.[family]?.perDose ?? [];
    for (const card of cards) {
      counts.cards++;
      const marks = [
        ...(card.boosterCites ?? []),
        ...perDose.flatMap((v) => v?.reasonCites ?? []),
        ...(card.noteCites ?? []),
      ];
      const cited = new Set(marks.map((m) => documentOf(m.page ?? m.key)));
      const buttons = new Set((card.citations ?? []).map((b) => documentOf(b.url)));
      const missingButton = [...cited].find((d) => !buttons.has(d));
      if (missingButton) { counts.numberWithNoButton++; note('numberWithNoButton', `${family} ${card.status} ${missingButton}`, c.key); }
      const unnumbered = [...buttons].find((d) => !cited.has(d));
      if (unnumbered) { counts.buttonWithNoNumber++; note('buttonWithNoNumber', `${family} ${card.status} ${unnumbered}`, c.key); }
      const seen = new Set();
      const twice = marks.find((m) => (seen.has(m.key) ? true : (seen.add(m.key), false)));
      if (twice) { counts.sameSentenceTwice++; note('sameSentenceTwice', `${family} ${twice.key}`, c.key); }
    }
  }
}

console.log(counts);
for (const [kind, map] of Object.entries(examples)) {
  console.log(`\n${kind} — ${map.size} kinds, first patient of each:`);
  for (const [label, key] of map) console.log(`  ${label}  |  ${key}`);
}
