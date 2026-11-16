// Prints the rule table held against CDC's CDSI rules (port Phase 2.3).
//
//   npx vite-node scripts/cdsi/runRuleComparison.mjs                 # the comparison
//   npx vite-node scripts/cdsi/runRuleComparison.mjs --save-facts    # after reading a new release
//
// Read the last lines: "declared wrongly", "unaccounted for" and "CDSI rules
// changed since saved" must all be 0. The test cdsi-rule-comparison.test.js
// checks the same things.
import { writeFileSync } from 'node:fs';
import { readCdsiFacts, readSavedFacts, SAVED_FACTS_FILE, CDSI_VERSION } from './cdsiRules.mjs';
import { ROW_MAP, CDSI_ONLY, allComparisons, compareItem, claimsOf } from './cdsiRuleMap.mjs';

const facts = readCdsiFacts();

if (process.argv.includes('--save-facts')) {
  const out = { cdsiVersion: CDSI_VERSION, savedOn: new Date().toLocaleDateString('en-CA'), facts: Object.fromEntries([...facts].map(([k, v]) => [k, v.value])) };
  writeFileSync(SAVED_FACTS_FILE, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`Saved ${facts.size} CDSI facts to ${SAVED_FACTS_FILE}`);
  process.exit(0);
}

const tally = { agree: 0, wording: 0, owner: 0, open: 0 };
let wrong = 0;
console.log(`CDSI ${CDSI_VERSION}: ${facts.size} rules read from the two meningococcal files.\n`);
for (const c of allComparisons()) {
  const r = compareItem(c, facts);
  if (r.missing) { wrong++; console.log(`  ✗ ${c.source} · ${c.what}: CDSI fact not found: ${r.missing}`); continue; }
  const declared = [...(c.differs ?? [])].sort().join(',');
  const got = [...r.differs].sort().join(',');
  const ok = declared === got;
  if (!ok) wrong++;
  const status = r.differs.length ? (c.status ?? '?') : 'agree';
  if (tally[status] !== undefined) tally[status]++;
  const mark = ok ? (r.differs.length ? `DIFFERS (${got}) — ${status}${c.stopC ? ` ${c.stopC}` : ''}` : 'agree') : `✗ DECLARED [${declared}] but FOUND [${got}]`;
  console.log(`${c.source} · ${c.what}\n    app:  ${r.appText}\n    CDSI: ${r.cdsiText}\n    → ${mark}${r.detail?.length ? `\n      ${r.detail.join('\n      ')}` : ''}`);
}
console.log('\nRows with no CDSI counterpart:');
for (const [id, m] of Object.entries(ROW_MAP)) if (m.none) console.log(`  ${id}: ${m.none}`);
console.log('\nCDSI rules the app has no row for:');
for (const o of CDSI_ONLY) { console.log(`  ${o.id} — ${o.status} ${o.stopC}: ${o.what}`); if (!o.pick) tally[o.status]++; }

const { claimed } = claimsOf(facts);
const unaccounted = [...facts.keys()].filter((k) => !claimed.has(k));
const saved = readSavedFacts();
const changed = saved ? [...new Set([...Object.keys(saved), ...facts.keys()])].filter((k) => saved[k] !== facts.get(k)?.value) : null;

console.log(`\nComparisons: ${tally.agree} agree; differences: ${tally.wording} follow CDC/ACIP wording, ${tally.owner} owner-decided, ${tally.open} open for STOP C.`);
for (const k of unaccounted) console.log(`  unaccounted: ${k} => ${facts.get(k).value}`);
for (const k of changed ?? []) console.log(`  changed: ${k}\n    saved: ${saved[k] ?? '(new)'}\n    now:   ${facts.get(k)?.value ?? '(gone)'}`);
console.log(`declared wrongly: ${wrong}`);
console.log(`unaccounted for: ${unaccounted.length}`);
console.log(`CDSI rules changed since saved: ${changed === null ? 'NOT SAVED YET (run --save-facts)' : changed.length}`);
