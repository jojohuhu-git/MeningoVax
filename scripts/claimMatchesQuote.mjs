// scripts/claimMatchesQuote.mjs — port Phase 8, C11 (2026-11-26).
//
// Does each raised number sit on a claim its quoted sentence states? Runs every
// patient in the saved-answers grid (src/test-grid.js) through the engine and,
// for every "[c]" on a card (its note, its booster line, the verdict on each
// recorded dose), takes the words the number sits on (from the start of the
// sentence, or the previous number, up to the number) and the quote it opens.
// Two checks, the two PneumoVax made (its P2-7 and C10-1):
//
//   complete  the words say "complete" / "no further doses" / "not needed",
//             and the quote says nothing of the kind;
//   total     the words state a dose count ("2 doses", "a 3-dose series"),
//             and the quote does not state that number.
//
// A third, looser check prints for reading, not as a finding:
//   age       the words name an age or a gap ("16 years", "8 weeks") the
//             quote does not contain.
//
//     node scripts/claimMatchesQuote.mjs            # counts + each distinct pair
//     node scripts/claimMatchesQuote.mjs --all      # also the pairs that pass
//
// It changes nothing.
import { buildSavedAnswerCases } from '../src/test-grid.js';
import { recommend } from '../src/logic/recommend.js';

const SHOW_ALL = process.argv.includes('--all');
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, single: 1 };

// The words each "[c]" sits on, paired with the cite it opens.
function claims(text, cites) {
  if (!text || !cites?.length) return [];
  const parts = String(text).split('[c]');
  const out = [];
  let carry = '';
  let run = [];
  for (let i = 0; i < parts.length - 1; i++) {
    const before = parts[i];
    // "[c][c]": the second number sits on the same words as the first, and the
    // two are judged together (each may state a different half of the claim).
    if (before.trim() !== '') run = [];
    const own = before.trim() === '' ? carry : before.split(/(?<=[.;:])\s+/).pop();
    carry = own;
    if (!cites[i]) continue;
    const row = { words: own.trim(), cite: cites[i], together: run };
    run.push(cites[i]);
    out.push(row);
  }
  // Every number in a run sees the whole run's quotes.
  for (const r of out) r.quote = r.together.map((c) => c.quote ?? '').join(' / ');
  return out;
}

const said = (s) => String(s ?? '').replace(/\s+/g, ' ');
const numbersIn = (s) => {
  const n = new Set();
  for (const m of said(s).matchAll(/\b(\d+)\b/g)) n.add(Number(m[1]));
  for (const m of said(s).toLowerCase().matchAll(/\b(one|two|three|four|five|single)\b/g)) n.add(WORDS[m[1]]);
  return n;
};
const doseCounts = (words) => {
  const n = new Set();
  const w = said(words).toLowerCase();
  for (const m of w.matchAll(/\b(\d+|one|two|three|four|five|single)[- ](?:dose|doses)\b/g)) n.add(WORDS[m[1]] ?? Number(m[1]));
  for (const m of w.matchAll(/\b(\d+|one|two|three|four|five)[- ]dose series\b/g)) n.add(WORDS[m[1]] ?? Number(m[1]));
  return n;
};
const COMPLETE = /\b(complete|completed|no further|no more|not needed|nothing (?:more|left)|up to date|no (?:additional|other) dose)/i;
const SAYS_COMPLETE = /\b(complete|completed|no further|not needed|no additional|not recommended|additional doses? (?:are|is) not|not routinely recommended|do(?:es)? not need|is not necessary|are not necessary|need not)/i;
// An age or gap the words claim, as numbers + unit ("1–2 months" -> 1,2 mo).
// The patient's own measured ages and gaps are facts, not claims: skipped
// ("about 3 weeks", "(3 months 19 days, ...", "dose 2 today").
const UNIT = (u) => ({ y: 'y', m: 'm', w: 'w', d: 'd' })[u[0].toLowerCase()];
const ageGaps = (words) => {
  const w = said(words)
    .replace(/\babout [\d\s\w]*?(?=[,)])/gi, '')
    .replace(/\(\d+ (?:years?|months?|weeks?|days?)(?: \d+ (?:months?|weeks?|days?))*,/gi, '(');
  return [...w.matchAll(/\b(\d+)(?:\s*(?:–|-|to|through)\s*(\d+))?[\s-]*(years?|yrs?|months?|mos?|weeks?|wks?|days?|-year|-day)\b/gi)]
    .map((m) => ({ text: m[0], nums: [m[1], m[2]].filter(Boolean).map(Number), unit: UNIT(m[3].replace('-', '')) }));
};
const quoteHasAge = (quote, a) => {
  const q = said(quote);
  const inQuote = [...q.matchAll(/\b(\d+)(?:\s*(?:–|-|to|through)\s*(\d+))?[\s-]*(years?|yrs?|months?|mos?|weeks?|wks?|days?)\b/gi)]
    .filter((m) => UNIT(m[3]) === a.unit).flatMap((m) => [m[1], m[2]].filter(Boolean).map(Number));
  // "1st birthday" = 12 months; "16th birthday" = 16 years.
  for (const m of q.matchAll(/\b(\d+)(?:st|nd|rd|th) birthday/g)) { inQuote.push(Number(m[1])); if (m[1] === '1') inQuote.push(12); }
  return a.nums.every((n) => inQuote.includes(n));
};

const pairs = new Map(); // key + words -> row
let numbers = 0;
for (const c of buildSavedAnswerCases()) {
  const r = recommend(c.input);
  if (r.excluded) continue;
  for (const [family, list] of [['MenACWY', r.menacwy ?? []], ['MenB', r.menb ?? []]]) {
    const perDose = r.history?.[family]?.perDose ?? [];
    for (const card of list) {
      const lead = card.note?.lead ?? '';
      const leadCount = (lead.match(/\[c\]/g) || []).length;
      const found = [
        ...claims(lead, (card.noteCites ?? []).slice(0, leadCount)),
        ...claims(card.note?.detail ?? (typeof card.note === 'string' ? card.note : ''), (card.noteCites ?? []).slice(leadCount)),
        ...claims(card.boosterSummary, card.boosterCites),
        ...perDose.flatMap((v) => {
          let used = 0;
          return (v?.reasons ?? []).flatMap((reason) => {
            const k = String(reason).split('[c]').length - 1;
            const mine = (v.reasonCites ?? []).slice(used, used + k);
            used += k;
            return claims(reason, mine);
          });
        }),
      ];
      for (const { words, cite, quote: runQuote } of found) {
        numbers++;
        const norm = words.replace(/[A-Z][a-z]{2} \d{1,2}, \d{4}/g, '<date>');
        const id = `${cite.key} || ${norm}`;
        let row = pairs.get(id);
        if (!row) {
          const quote = runQuote ?? cite.quote ?? '';
          const qn = numbersIn(quote);
          const totals = [...doseCounts(words)];
          row = {
            key: cite.key, words: norm, quote, n: 0, first: c.key, family, status: card.status,
            complete: COMPLETE.test(words) && !SAYS_COMPLETE.test(quote),
            total: totals.length > 0 && totals.some((t) => !qn.has(t)) ? totals.join(',') : null,
            age: ageGaps(words).filter((a) => !quoteHasAge(quote, a)).map((a) => a.text),
            noQuote: !quote,
          };
          pairs.set(id, row);
        }
        row.n++;
      }
    }
  }
}

const rows = [...pairs.values()];
const sum = (f) => rows.filter(f).reduce((n, r) => n + r.n, 0);
console.log({
  numbers,
  distinctPairs: rows.length,
  completeFlagged: { pairs: rows.filter((r) => r.complete).length, numbers: sum((r) => r.complete) },
  totalFlagged: { pairs: rows.filter((r) => r.total).length, numbers: sum((r) => r.total) },
  ageNotInQuote: { pairs: rows.filter((r) => r.age.length).length, numbers: sum((r) => r.age.length) },
  noQuote: { pairs: rows.filter((r) => r.noQuote).length, numbers: sum((r) => r.noQuote) },
});
const show = (title, f) => {
  const list = rows.filter(f).sort((a, b) => b.n - a.n);
  console.log(`\n=== ${title}: ${list.length} pairs ===`);
  for (const r of list) {
    console.log(`\n[${r.n}] ${r.family} ${r.status} | ${r.key}${r.total ? ` | total ${r.total}` : ''}${r.age.length ? ` | ages ${r.age.join('; ')}` : ''}`);
    console.log(`  WORDS: ${r.words}`);
    console.log(`  QUOTE: ${r.quote.slice(0, 400)}`);
    console.log(`  e.g. ${r.first}`);
  }
};
show('complete', (r) => r.complete);
show('total', (r) => r.total);
show('age (for reading)', (r) => r.age.length);
if (SHOW_ALL) show('all', () => true);
