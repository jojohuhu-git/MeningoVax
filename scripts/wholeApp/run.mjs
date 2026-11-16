#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// run.mjs — run the whole-app checks (port Phase 1.4, 2026-11-15).
//
//   npm run whole-app                                 every check, every patient
//   npm run whole-app -- --checks 1,4                 two checks
//   npm run whole-app -- --only typical               the typical patients only
//   npm run whole-app -- --out result.json            keep every group, with examples
//
// Prints, per check, how many distinct patients it flags (saved-answer grid
// and typical patients apart), then every kind of flag with its count. Splits
// the work across the machine's cores. Exits 1 if anything is flagged:
// findings are LISTED, not fixed, in this phase, so a red exit is expected
// until they are worked through. The suite runs only the parts already at
// zero (whole-app-gate.test.js).
// ─────────────────────────────────────────────────────────────────────────
import { fork } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { allPatients, walk } from './replay.mjs';
import {
  CHECK_NAMES, INFORMATIONAL, ageLineCheck, doseLineCases, doseLineCheck, firstScreenBrands, newTally, replayChecks, stableOverTime,
} from './checks.mjs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};
const wanted = new Set((arg('checks', '1,2,3,4,5,6,7')).split(',').map(Number));
const only = arg('only', null);
const out = arg('out', null);
const jobs = Number(arg('jobs', Math.max(1, cpus().length - 1)));

function runShard(k, n) {
  const tally = newTally();
  const visitor = replayChecks(tally, wanted);
  const replay = [1, 2, 3, 4, 5, 7].some((c) => wanted.has(c));
  let states = 0;
  let done = 0;
  allPatients({ only }).forEach((p, i) => {
    if (i % n !== k) return;
    tally.setPatient(p);
    done += 1;
    if (replay) states += walk(p, visitor).states;
    if (wanted.has(1)) firstScreenBrands(tally, p);
    if (wanted.has(6)) ageLineCheck(tally, p);
    if (wanted.has(7)) stableOverTime(tally, p);
  });
  if (wanted.has(6) && only !== 'grid') {
    doseLineCases().forEach((c, i) => {
      if (i % n !== k) return;
      tally.setPatient({ key: `dose-line|${c.brand}@${c.L}m|${c.prior.name}|r:${c.riskIds.join('+')}`, group: 'typical', input: { riskIds: c.riskIds, ageMonths: c.L, dob: '2000-03-10', today: '' } });
      doseLineCheck(tally, c);
    });
  }
  return { done, states, rows: tally.rows(), distinct: tally.distinct() };
}

function merge(results) {
  const groups = new Map();
  for (const { rows } of results) {
    for (const r of rows) {
      const k = `${r.check}\t${r.kind}\t${r.group}`;
      const g = groups.get(k);
      if (!g) { groups.set(k, { ...r, families: { ...r.families }, examples: [...r.examples] }); continue; }
      g.flags += r.flags;
      g.grid += r.grid;
      g.typical += r.typical;
      for (const [f, c] of Object.entries(r.families)) g.families[f] = (g.families[f] ?? 0) + c;
      if (g.examples.length < 3) g.examples.push(...r.examples.slice(0, 3 - g.examples.length));
    }
  }
  return [...groups.values()];
}



function mergeDistinct(results) {
  const m = new Map();
  for (const { distinct } of results) {
    for (const d of distinct) {
      const g = m.get(d.key) ?? { grid: 0, typical: 0 };
      g.grid += d.grid; g.typical += d.typical;
      m.set(d.key, g);
    }
  }
  return m;
}

function report(rows, totals, distinct) {
  console.log(`\n${totals.done} patients, ${totals.states} screens followed.\n`);
  console.log('Every count is distinct patients (saved-answer grid / typical). "(info)" rows are a list, not a fault.\n');
  const checks = [...[...wanted].sort(), 'harness'];
  for (const c of checks) {
    const mine = rows.filter((r) => r.check === c);
    if (!mine.length) { if (c !== 'harness') console.log(`${c} ${CHECK_NAMES[c]}: nothing flagged`); continue; }
    const faults = distinct.get(`${c}\t!`) ?? { grid: 0, typical: 0 };
    console.log(`${c} ${CHECK_NAMES[c] ?? ''}: faults in grid ${faults.grid}, typical ${faults.typical}`);
    const kinds = new Map();
    for (const r of mine) kinds.set(r.kind, (kinds.get(r.kind) ?? 0) + 1);
    const n = (kind) => distinct.get(`${c}\t${kind}`);
    for (const [kind, groups] of [...kinds].sort((a, b) => (n(b[0]).grid + n(b[0]).typical) - (n(a[0]).grid + n(a[0]).typical))) {
      console.log(`   ${INFORMATIONAL.has(kind) ? '(info) ' : ''}${kind}: grid ${n(kind).grid}, typical ${n(kind).typical} (${groups} groups)`);
    }
  }
  return rows.some((r) => !INFORMATIONAL.has(r.kind));
}

if (process.argv[2] === '--shard') {
  const [k, n] = process.argv[3].split('/').map(Number);
  process.send(runShard(k, n), () => process.exit(0));
} else {
  const self = fileURLToPath(import.meta.url);
  const passThrough = process.argv.slice(2);
  const results = await Promise.all(Array.from({ length: jobs }, (_, k) => new Promise((resolve, reject) => {
    const child = fork(self, ['--shard', `${k}/${jobs}`, ...passThrough], { serialization: 'advanced' });
    child.on('message', resolve);
    child.on('error', reject);
    child.on('exit', (code) => { if (code) reject(new Error(`shard ${k} exited ${code}`)); });
  })));
  const rows = merge(results);
  const totals = results.reduce((a, r) => ({ done: a.done + r.done, states: a.states + r.states }), { done: 0, states: 0 });
  const distinct = mergeDistinct(results);
  const failed = report(rows, totals, distinct);
  if (out) writeFileSync(out, JSON.stringify({ totals, distinct: Object.fromEntries(distinct), rows }, null, 1));
  process.exit(failed ? 1 : 0);
}
