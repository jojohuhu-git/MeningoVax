// ─────────────────────────────────────────────────────────────────────────
// runTestCases.mjs — run CDC's CDSI meningococcal test patients through
// MeningoVax and say, patient by patient, where the two agree.
//
// Port Phase 1.5 (2026-11-15). The idea and the output shape come from
// PneumoVax's scripts/cdsi/runTestCases.mjs; the code is MeningoVax's own,
// because the two engines answer in different shapes.
//
// A MEASUREMENT, NOT A TEST. CDSI is CDC's machine-readable version of ACIP's
// rules and runs behind them; where CDSI and CDC/ACIP wording differ, the
// wording wins (owner rules 2026-08-10 and 2026-10-17). So a disagreement here
// is a question to look at, never a bug by itself. Findings are LISTED, not
// fixed (port plan, Phase 1).
//
// Input: cdc-files/meningo-test-cases.json, made from CDC's two workbooks by
// extractTestCases.py. Each CDC patient is about ONE vaccine (MenACWY or MenB)
// and lists only that vaccine's doses, so each is run with only those doses
// and compared on that vaccine's cards only. "Today" is CDC's own
// Assessment_Date, because CDC writes its test dates relative to that day.
//
// Run:  npx vite-node scripts/cdsi/runTestCases.mjs            (summary + every disagreement)
//       npx vite-node scripts/cdsi/runTestCases.mjs --all      (every patient)
//       npx vite-node scripts/cdsi/runTestCases.mjs --json out.json
//
// The comparing itself lives in cdsiCore.mjs (split 2026-11-15) so the test
// suite runs the same code: src/logic/__tests__/cdsi-test-patients-gate.test.js.
// ─────────────────────────────────────────────────────────────────────────
import { writeFileSync } from 'node:fs';
import { ANSWERS, KNOWN, ORDER, differs, evaluate, familyOf, tagOf } from './cdsiCore.mjs';

const ev = evaluate();
const { results, nowAnswers, fresh, healed } = ev;
let { saved, moved } = ev;
const args = process.argv.slice(2);
const showAll = args.includes('--all');
const jsonAt = args.indexOf('--json');
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(results, null, 1) + '\n');

// ── Saved answers ──
// The KNOWN table is by patient, so on its own it cannot see a known patient
// whose answer MOVES (found 2026-11-15: shortening the 16-year booster gap
// moved 2013-0510's date and the run stayed quiet). So every patient's app
// answer is saved, and a run lists any that moved. `--save-answers` rewrites
// the file; do that only after reading what moved and why.
if (args.includes('--save-answers')) {
  writeFileSync(ANSWERS, JSON.stringify(nowAnswers, null, 1) + '\n');
  saved = nowAnswers;
  moved = [];
}

const print = (x) => {
  console.log(`\n${x.id} [${x.source} ${x.group}] ${x.name}`);
  console.log(`  born ${x.dob}, assessed ${x.today} (${x.ageToday}); risks: ${x.risks.join('; ') || 'none'} → ${x.riskIds.join(', ') || 'none'}${x.askedAtRisk ? `  (answered "yes, at risk then" ×${x.askedAtRisk})` : ''}`);
  if (x.unmapped.length) console.log(`  ⚠ no mapping: ${x.unmapped.join('; ')}`);
  if (x.notComparable.length) console.log(`  ⚠ not comparable: ${x.notComparable.join('; ')}`);
  for (const d of x.doses) console.log(`  ${d.agree === false ? '✗ ' : '  '}dose ${d.n} CVX ${d.cvx} ${d.product} ${d.date} (${d.age}): CDSI ${d.cdsi} | app ${d.app}${d.agree === false && d.appReason ? ' — ' + d.appReason.slice(0, 200) : ''}`);
  console.log(`  CDSI: ${x.cdsi.raw}${x.cdsi.state === 'not complete' ? ` — dose ${x.cdsi.forecastNum}, earliest ${x.cdsi.earliest}, recommended ${x.cdsi.recommended}, past due ${x.cdsi.pastDue || '—'}` : ''} [${x.cdsi.forecastType}]`);
  console.log(`  app : ${x.app.state}${x.app.date ? ' — next ' + x.app.date : ''}`);
  for (const card of x.app.cards) console.log(`        ${card}`);
  console.log(`  → doses ${x.dosesAgree ? 'AGREE' : 'DIFFERENT'}; next step ${x.forecast}`);
  const fam = familyOf(x.id);
  if (differs(x)) console.log(`  → ${fam.length ? 'known: ' + fam.join(' + ') : '⚠ NEW — not in the known list'}`);
};
for (const x of results) if (showAll || differs(x)) print(x);

const count = (f) => results.filter(f).length;
const allDoses = results.flatMap((x) => x.doses);
console.log('\n══ SUMMARY ══');
for (const g of ['MenACWY', 'MenB']) {
  const rs = results.filter((x) => x.group === g);
  console.log(`${g}: patients ${rs.length}, both agree ${rs.filter((x) => !differs(x)).length}`);
}
console.log(`patients ${results.length}: both agree ${count((x) => !differs(x))}`);
console.log(`doses ${allDoses.length}: agree ${allDoses.filter((d) => d.agree === true).length}, differ ${allDoses.filter((d) => d.agree === false).length}, not recorded in the app ${allDoses.filter((d) => d.agree === null).length}`);
const tally = {};
for (const x of results) tally[x.forecast] = (tally[x.forecast] ?? 0) + 1;
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`next step — ${k}: ${n}`);
console.log('\nby family (a patient can sit in two):');
for (const [f, ids] of Object.entries(KNOWN)) {
  const hit = results.filter((x) => ids.includes(x.id) && differs(x)).length;
  console.log(`  ${hit}/${ids.length}  ${f}`);
}
// Each differing patient by its most pressing family: OPEN beats the rest.
const worst = {};
for (const x of results.filter(differs)) {
  const tags = familyOf(x.id).map(tagOf);
  const t = ORDER.find((o) => tags.includes(o)) ?? 'NEW';
  worst[t] = (worst[t] ?? 0) + 1;
}
console.log(`differing patients by most pressing family: ${ORDER.concat('NEW').filter((t) => worst[t]).map((t) => `${t} ${worst[t]}`).join(', ')}`);
console.log(`NEW disagreements (not in the known list): ${fresh.length}${fresh.length ? ' — ' + fresh.map((x) => x.id).join(', ') : ''}`);
console.log(`listed as known but now agreeing (remove from the list): ${healed.length}${healed.length ? ' — ' + [...new Set(healed)].join(', ') : ''}`);
const um = results.filter((x) => x.unmapped.length || x.notComparable.length);
console.log(`patients with a CDC code or product the app has no input for: ${um.length}${um.length ? ' (' + um.map((x) => x.id).join(', ') + ')' : ''}`);
console.log(`patients where the app asked "at high risk when given?" (answered yes): ${count((x) => x.askedAtRisk > 0)}`);
if (!saved) console.log('answers moved since saved: NO SAVED FILE — run once with --save-answers');
else {
  console.log(`answers moved since saved: ${moved.length}${moved.length ? ' — ' + moved.map((x) => x.id).join(', ') : ''}`);
  for (const x of moved) console.log(`  ${x.id}\n    was: ${saved[x.id] ?? '(not saved)'}\n    now: ${nowAnswers[x.id]}`);
}
