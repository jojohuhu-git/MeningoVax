// E4b (plan-2026-09-19-test-depth-and-drift.md): a test that says "the app
// must never say X again" has a quiet failure mode -- it goes VACUOUS the
// moment nobody produces X any more for an unrelated reason (a reword, a
// refactor). It keeps passing and proves nothing, forever, and nothing
// notices.
//
// This file is the guard. It reads every negated toContain / toMatch
// assertion in the suite that carries an inline literal argument, and
// requires the literal to still appear somewhere in the app's own source
// (src/, minus the tests and the test-only helpers) -- UNLESS the assertion
// carries an `// extinct:` comment, on the same line or the line right
// above, saying the string was deliberately removed and when. That turns
// silent rot into a one-line choice the author has to make consciously.
//
// Two kinds of literal are read:
//   - a negated toContain call with a quoted string -- checked as an exact
//     substring.
//   - a negated toMatch call with a regex literal -- checked ONLY when the
//     pattern has no live regex metacharacter (no dot, star, plus, question
//     mark, parens, brackets or pipe, unescaped, and no digit/word/space/
//     boundary class), i.e. it is really a phrase wearing a regex costume
//     (often just for the case-insensitive flag). A pattern with real regex
//     machinery is out of scope on purpose: most of those check text the app
//     assembles from a variable at render time, and testing the raw pattern
//     against static source text would be comparing the wrong thing.
// A backtick template holding an interpolated expression is not a literal at
// all and is skipped the same way.
//
// Scanned 2026-09-19: 155 assertions carry a checkable literal (40 more are
// real regex patterns, out of scope by design above). 22 referenced a string
// that appears nowhere in src/ -- each one a genuinely retired sentence from
// a past fix (B5, M10, M18, P0-1, U2, U3, U4, cal-P2-2, imp-P1-2, P1-3, and
// the 2026-09-13 HCT wording) -- and are now annotated as this test's first
// examples. Zero unannotated violations at that count; new drift should
// raise that number, not lower it silently.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

const TEST_DIRS = ['src/logic/__tests__', 'src/components/__tests__', 'src/data/__tests__'];
const testFiles = TEST_DIRS.flatMap((dir) =>
  readdirSync(`${repoRoot}${dir}`)
    .filter((f) => /\.test\.jsx?$/.test(f))
    .map((f) => `${dir}/${f}`));

// Everything the running app can actually say or render: every .js/.jsx file
// under src/, minus __tests__ folders, minus test-only helpers (test-*.js at
// the src root), minus .test.js(x) files themselves. A string that appears
// nowhere in here can never come out of the app, so a test asserting it's
// absent is either dead weight or a deliberately kept regression guard --
// which is exactly what `// extinct:` is for.
function sourceFilesIn(dir) {
  return readdirSync(`${repoRoot}${dir}`, { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFilesIn(rel);
    if (!/\.jsx?$/.test(entry.name)) return [];
    if (/\.test\.jsx?$/.test(entry.name)) return [];
    if (entry.name.startsWith('test-')) return [];
    return [rel];
  });
}

const sourceFiles = sourceFilesIn('src');
const sourceText = sourceFiles.map((f) => readFileSync(`${repoRoot}${f}`, 'utf8')).join('\n');

// Matches `.not.toContain(ARG)` / `.not.toMatch(ARG)` where ARG is written
// inline as a string, backtick, or regex literal -- not a variable or a call
// result, which this guard has no business judging.
const NEGATIVE_ASSERTION_RE =
  /\.not\.to(Contain|Match)\(\s*(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\/(?:\\.|[^/\\\n])*\/[a-z]*)\s*\)/g;

function unescapeString(raw) {
  return raw.slice(1, -1).replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : c));
}

// A regex pattern counts as "really a plain phrase" only if nothing in it
// still needs a regex engine to interpret.
function isPlainPattern(body) {
  if (/(?<!\\)[.^$*+?()[\]{}|]/.test(body)) return false;
  if (/\\[dwsbDWSB]/.test(body)) return false;
  return true;
}
const unescapeRegexLiteral = (body) => body.replace(/\\([.^$*+?()[\]{}|/\\])/g, '$1');

function findNegativeLiterals(content) {
  const found = [];
  let m;
  while ((m = NEGATIVE_ASSERTION_RE.exec(content))) {
    const [full, matcher, rawArg] = m;
    if (rawArg.startsWith('`') && rawArg.includes('${')) continue; // a template expression, not a literal

    let literal;
    let caseInsensitive = false;
    if (rawArg.startsWith('/')) {
      const lastSlash = rawArg.lastIndexOf('/');
      const body = rawArg.slice(1, lastSlash);
      if (!isPlainPattern(body)) continue; // a real regex pattern -- out of scope, see header comment
      literal = unescapeRegexLiteral(body);
      caseInsensitive = rawArg.slice(lastSlash + 1).includes('i');
    } else {
      literal = unescapeString(rawArg);
    }

    const upto = content.slice(0, m.index);
    const lineNo = upto.split('\n').length - 1; // 0-indexed
    const lines = content.split('\n');
    const restOfLine = lines[lineNo].slice(lines[lineNo].indexOf(full) + full.length);
    const prevLine = lineNo > 0 ? lines[lineNo - 1] : '';
    const annotated = /\/\/\s*extinct:/.test(restOfLine) || /\/\/\s*extinct:/.test(prevLine);

    found.push({ line: lineNo + 1, matcher: `.not.to${matcher}`, literal, caseInsensitive, annotated });
  }
  return found;
}

describe('E4b · a "never say X again" assertion cannot go vacuous in silence', () => {
  const all = testFiles.flatMap((tf) =>
    findNegativeLiterals(readFileSync(`${repoRoot}${tf}`, 'utf8')).map((f) => ({ ...f, file: tf })));

  it('actually found assertions to check (the scan itself is not broken)', () => {
    // A meta-guard: if a future refactor changes the assert style enough that
    // the regex above stops matching anything, this test would otherwise
    // pass by finding zero of everything -- silently defeating its own point.
    expect(all.length).toBeGreaterThan(100);
  });

  it('every un-annotated negative-assertion literal still exists in src/', () => {
    const violations = all
      .filter((f) => !f.annotated)
      .filter((f) => {
        const hay = f.caseInsensitive ? sourceText.toLowerCase() : sourceText;
        const needle = f.caseInsensitive ? f.literal.toLowerCase() : f.literal;
        return !hay.includes(needle);
      });

    const message = violations
      .map((v) => `${v.file}:${v.line} ${v.matcher}(${JSON.stringify(v.literal)})`)
      .join('\n');

    expect(
      violations,
      `${violations.length} negative assertion(s) check for text that appears nowhere in src/ `
      + `and are not annotated as deliberately extinct -- add "// extinct: <why>, <when>" on the `
      + `same or the line above if this is a fact you know was removed on purpose, or investigate `
      + `why the app no longer contains what the assertion means to guard against:\n${message}`,
    ).toEqual([]);
  });
});
