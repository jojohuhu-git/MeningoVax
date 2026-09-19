// Item 0 (docs/agent/testing.md rewrite,
// .claude/prompts/plan-2026-09-19-test-depth-and-drift.md): the numbers in
// that document's "Measured counts" table are checked here instead of taken
// on faith. testing.md is the map the next session reads before doing
// anything else — a table of counts nobody re-checks is exactly how it went
// wrong the first time (it claimed 10 test files and "no UI rendering tests
// yet" while the repo actually had 119 files, 42 of them rendering React).
//
// What this does NOT check: the two "not guarded" rows (total individual
// tests, total suites). Re-deriving those exactly would mean re-running the
// whole suite from inside a test — expensive, and the document already says
// so and gives the command to re-derive them by hand.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const docPath = `${repoRoot}docs/agent/testing.md`;
const doc = readFileSync(docPath, 'utf8');

const LOGIC_DIR = 'src/logic/__tests__';
const COMPONENTS_DIR = 'src/components/__tests__';
const DATA_DIR = 'src/data/__tests__';

const testFilesIn = (relDir) =>
  readdirSync(`${repoRoot}${relDir}`).filter((f) => /\.test\.jsx?$/.test(f));

const logicFiles = testFilesIn(LOGIC_DIR);
const componentFiles = testFilesIn(COMPONENTS_DIR);
const dataFiles = testFilesIn(DATA_DIR);
const totalFiles = logicFiles.length + componentFiles.length + dataFiles.length;

const happyDomFiles = componentFiles.filter((f) =>
  /@vitest-environment\s+happy-dom/.test(
    readFileSync(`${repoRoot}${COMPONENTS_DIR}/${f}`, 'utf8'),
  ),
);

// Pulls the Count column out of a specific "Measured counts" table row,
// identified by a substring unique to that row's label. Not a general
// markdown table parser — just enough to read the one table this file owns.
const quotedCount = (labelSubstring) => {
  const re = new RegExp(`${labelSubstring}[^|]*\\|\\s*([\\d,]+)`);
  const m = doc.match(re);
  if (!m) {
    throw new Error(
      `docs/agent/testing.md: no "Measured counts" row found matching `
      + `"${labelSubstring}" — the table's wording changed; update the `
      + 'label this test looks for.',
    );
  }
  return Number(m[1].replace(/,/g, ''));
};

const mismatch = (what, quoted, real) =>
  `docs/agent/testing.md's "Measured counts" table says ${what} = ${quoted}, `
  + `but the repo actually has ${real}. Update the table — and the date and `
  + 'commit it cites just above the table — in the same PR. This document is '
  + 'read before anyone touches the suite, so a stale count here sends the '
  + 'next session down the wrong path.';

describe('docs/agent/testing.md "Measured counts" table matches the repo', () => {
  it('total test file count', () => {
    const quoted = quotedCount('Test files, total');
    expect(totalFiles, mismatch('total test files', quoted, totalFiles)).toBe(quoted);
  });

  it('src/logic/__tests__ file count', () => {
    const quoted = quotedCount('in `src/logic/__tests__/`');
    expect(logicFiles.length, mismatch('src/logic/__tests__ files', quoted, logicFiles.length))
      .toBe(quoted);
  });

  it('src/components/__tests__ file count', () => {
    const quoted = quotedCount('in `src/components/__tests__/`');
    expect(
      componentFiles.length,
      mismatch('src/components/__tests__ files', quoted, componentFiles.length),
    ).toBe(quoted);
  });

  it('src/data/__tests__ file count', () => {
    const quoted = quotedCount('in `src/data/__tests__/`');
    expect(dataFiles.length, mismatch('src/data/__tests__ files', quoted, dataFiles.length))
      .toBe(quoted);
  });

  it('happy-dom UI test file count', () => {
    const quoted = quotedCount('opted into `happy-dom`');
    expect(
      happyDomFiles.length,
      mismatch('happy-dom UI test files', quoted, happyDomFiles.length),
    ).toBe(quoted);
  });
});
