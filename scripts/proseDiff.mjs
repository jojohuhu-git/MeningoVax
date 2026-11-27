#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// proseDiff.mjs — every sentence a clinician can read, for every saved
// patient, dumped to a file; and a diff of two such dumps. Port Phase 1.2
// (2026-11-15), brought over from PneumoVax's tool of the same name.
//
//   npm run prose -- dump <outfile>
//   npm run prose -- diff <before-file> <after-file>
//
// ── Why ──────────────────────────────────────────────────────────────────
//
// The saved answers (`sweep-saved-answers.test.js`) hold no wording, on
// purpose, so a copy edit never turns them red. The price: a wording change
// can break hundreds of cards while every test stays green. PneumoVax shipped
// exactly that once (843 cards read broken wording with the full suite
// green). This tool is how a wording change gets counted: dump before, make
// the change, dump after, diff, and put the number in the pull request.
//
// ── What "every sentence" means here ─────────────────────────────────────
//
// The real results screen (`Results.jsx`), rendered for each patient on the
// saved-answer grid, real patients and impossible entries both. Not the
// engine's output: in MeningoVax some lines are put together in the card
// itself ("Next dose not yet due - eligible …", "Up to date"), and reading the
// engine alone would miss them.
//
// With every disclosure OPEN (`openAllDisclosures.js`): each "Why this" and
// each collapsed quiet card. A page rendered without a browser cannot be
// clicked, and the text behind a click is still text a clinician reads. A
// collapsed card's one-line summary is the same line the open card shows, so
// opening loses nothing.
//
// Plus the hover text on each source number and chip (the `title`), written
// as {hover: …}, because that is where a clinician learns which document a
// number came from. Since C12 (2026-11-26) a source number keeps its words in
// `data-title` and shows them in a pop-up; the same words are read from there.
//
// It is a TOOL, not a gate. Nothing fails when wording changes. The smoke test
// (`prose-diff-tool.test.js`) only checks the tool still reads what it should.
//
// ── Running ──────────────────────────────────────────────────────────────
//
// Through `vite-node` (the npm script does this), because the screen is JSX.
// About 10 seconds for ~23,000 patients. Dumps are large (tens of MB): write
// them to a scratch folder, never into the repo.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';
import Results from '../src/components/Results.jsx';
import { OpenAllDisclosures } from '../src/components/openAllDisclosures.js';
import { buildSavedAnswerCases, buildRecordProblemCases } from '../src/test-grid.js';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'", nbsp: ' ' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  const k = e.toLowerCase();
  if (ENTITIES[k] != null) return ENTITIES[k];
  if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16));
  if (k.startsWith('#')) return String.fromCodePoint(parseInt(k.slice(1), 10));
  return m;
});

/** Rendered HTML → the words on it, hover text kept, one line, tab-free. */
export function textOf(html) {
  return decode(
    html
      .replace(/<[^>]*\b(?:data-)?title="([^"]*)"[^>]*>/g, (_, t) => ` {hover: ${t}} `)
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
}

/**
 * The results screen for one patient, as the app would draw it — exactly the
 * props `App.jsx` passes — with every disclosure open unless `openAll` is false.
 */
export function renderScreen(input, { openAll = true } = {}) {
  const state = {
    ageMonths: input.ageMonths,
    dob: input.dob,
    riskIds: input.riskIds,
    menacwyDoses: input.menacwyDoses,
    menbDoses: input.menbDoses,
    riskAtDoseAnswers: input.riskAtDoseAnswers,
  };
  const noop = () => {};
  const screen = React.createElement(Results, {
    state, today: input.today, onReset: noop, onChange: noop, onBack: noop,
  });
  return renderToStaticMarkup(
    React.createElement(OpenAllDisclosures.Provider, { value: openAll }, screen),
  );
}

/** Every sentence a clinician can read for one patient. */
export function proseOf(input) {
  return textOf(renderScreen(input));
}

function allLines() {
  // Prefixed so a key shared by the two grids (none today; nothing forbids
  // it) could never overwrite one patient's text with the other's.
  return [
    ...buildSavedAnswerCases().map((c) => `real:${c.key}\t${proseOf(c.input)}`),
    ...buildRecordProblemCases().map((c) => `impossible:${c.key}\t${proseOf(c.input)}`),
  ].sort();
}

const asMap = (lines) => new Map(lines.map((l) => {
  const i = l.indexOf('\t');
  return [l.slice(0, i), l.slice(i + 1)];
}));

function dump(outPath) {
  process.stdout.write('Rendering the results screen for every saved patient (all disclosures open)... ');
  const lines = allLines();
  writeFileSync(outPath, `${lines.join('\n')}\n`);
  console.log(`${lines.length} patients written to ${outPath}.`);
}

/** The first place two texts differ, with a little context either side. */
function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 60);
  return { was: a.slice(from, i + 140), now: b.slice(from, i + 140) };
}

function diff(beforePath, afterPath) {
  const read = (p) => asMap(readFileSync(p, 'utf8').split('\n').filter(Boolean));
  const before = read(beforePath);
  const after = read(afterPath);
  const changed = [];
  const added = [];
  for (const [k, v] of after) {
    if (!before.has(k)) added.push(k);
    else if (before.get(k) !== v) changed.push(k);
  }
  const removed = [...before.keys()].filter((k) => !after.has(k));
  const real = changed.filter((k) => k.startsWith('real:')).length;

  console.log(`${changed.length} of ${before.size} patients read different wording `
    + `(${real} real patients, ${changed.length - real} impossible entries); `
    + `${added.length} added, ${removed.length} removed.`);
  for (const k of changed.slice(0, 8)) {
    const d = firstDifference(before.get(k), after.get(k));
    console.log(`\n  ${k}\n    was: …${d.was}…\n    now: …${d.now}…`);
  }
  if (changed.length > 8) console.log(`\n  ... and ${changed.length - 8} more.`);
}

// Importing this file (the smoke test does) must never run the command line.
if (!process.env.VITEST) {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const [cmd, a, b] = args.slice(args.findIndex((x) => x === 'dump' || x === 'diff'));
  if (cmd === 'dump' && a) dump(a);
  else if (cmd === 'diff' && a && b) diff(a, b);
  else {
    console.error('Usage:\n  npm run prose -- dump <outfile>\n  npm run prose -- diff <before-file> <after-file>');
    process.exit(1);
  }
}
