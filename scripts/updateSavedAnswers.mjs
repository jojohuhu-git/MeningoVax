#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// updateSavedAnswers.mjs — rewrite the saved-answer files.
//
//   npm run sweep:update
//
// Run this ONLY when you meant to change the app's answers, and read what it
// prints: how many synthetic patients got a different answer, with examples.
// That number belongs in the pull request, with why. If it surprises you, do
// not commit the new files — find out why first.
//
// Two files (see `src/test-grid.js`, "THE SAVED ANSWERS"): real patients, and
// records a clinician could not really enter. Both are rewritten together, and
// `src/logic/__tests__/sweep-saved-answers.test.js` holds the app to both.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  savedAnswerLines,
  recordProblemLines,
  SAVED_ANSWERS_RELATIVE_PATH,
  RECORD_PROBLEM_RELATIVE_PATH,
} from '../src/test-grid.js';
import { TEST_TODAY } from '../src/test-today.js';

const asMap = (lines) => new Map(lines.map((l) => {
  const i = l.indexOf('\t');
  return [l.slice(0, i), l.slice(i + 1)];
}));

/** Rewrite one file and report what moved. Returns true when anything changed. */
function rewrite(label, relativePath, build) {
  const target = resolve(import.meta.dirname, '..', relativePath);
  const before = existsSync(target) ? readFileSync(target, 'utf8').split('\n').filter(Boolean) : [];

  process.stdout.write(`\n${label}\n  running the app over the grid (dated ${TEST_TODAY})... `);
  const after = build();
  console.log(`${after.length} patients.`);

  const b = asMap(before);
  const a = asMap(after);
  const moved = [];
  const added = [];
  const removed = [];
  for (const [k, v] of a) {
    if (!b.has(k)) added.push(k);
    else if (b.get(k) !== v) moved.push(k);
  }
  for (const k of b.keys()) if (!a.has(k)) removed.push(k);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${after.join('\n')}\n`);

  if (!before.length) {
    console.log(`  created ${relativePath} with ${after.length} patients.`);
    return true;
  }
  console.log(`  answers moved    : ${moved.length} of ${b.size}`);
  console.log(`  patients added   : ${added.length}`);
  console.log(`  patients removed : ${removed.length}`);
  if (moved.length) {
    console.log('\n  Examples of what changed:\n');
    for (const k of moved.slice(0, 10)) {
      console.log(`    ${k}\n      was: ${b.get(k)}\n      now: ${a.get(k)}`);
    }
    if (moved.length > 10) console.log(`    ... and ${moved.length - 10} more.`);
  }
  return Boolean(moved.length || added.length || removed.length);
}

const changed = [
  rewrite('Real patients', SAVED_ANSWERS_RELATIVE_PATH, savedAnswerLines),
  rewrite('Impossible entries', RECORD_PROBLEM_RELATIVE_PATH, recordProblemLines),
].some(Boolean);

console.log(changed
  ? '\nPut the moved counts in the pull request, and say why those patients should get a\ndifferent answer now. If you cannot say why, this is a bug.'
  : '\nNothing changed: both files were already current.');
