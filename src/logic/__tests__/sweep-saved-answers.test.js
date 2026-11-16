// ─────────────────────────────────────────────────────────────────────────
// sweep-saved-answers.test.js — port Phase 1.1 (2026-11-15).
//
// THE GUARD THAT MAKES A MOVED ANSWER VISIBLE.
//
// `__saved__/saved-answers.tsv` holds one line per synthetic patient: their
// age, risk boxes and doses, and the answer the app gives them. This test
// re-runs the engine over the same patients and requires the same answers,
// line for line. `__saved__/saved-answers-record-problems.tsv` does the same
// for records a clinician could not really enter. How the patients are
// chosen, and why there are no sentences in an answer: `src/test-grid.js`,
// "THE SAVED ANSWERS".
//
// ── What a failure means, and what to do ─────────────────────────────────
//
// NOT automatically a bug. It means patients' answers changed, and somebody
// has to say why. If the change was meant:
//
//     npm run sweep:update
//
// rewrites both files and prints how many answers moved. Put that number in
// the pull request, with why those patients should now get a different
// answer. If you cannot say why, it is a bug. The friction is the point:
// PneumoVax twice shipped a change that moved thousands of answers while
// every check it had stayed green (P0-2; ANCHOR-1, 19,546 answers).
//
// ── What it does not check ───────────────────────────────────────────────
//
// It notices change; it cannot tell a fix from a regression, and an answer
// that has always been wrong is saved as wrong.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import {
  savedAnswerLines,
  recordProblemLines,
  SAVED_ANSWERS_RELATIVE_PATH,
  RECORD_PROBLEM_RELATIVE_PATH,
  SAVED_ANSWER_AGES_MONTHS,
  SAVED_ANSWER_RISK_PROFILES,
  SAVED_ANSWER_MENACWY_HISTORIES,
  SAVED_ANSWER_MENB_HISTORIES,
  SAVED_ANSWER_MENB_BASIC,
  SAVED_ANSWER_FUTURE_MENACWY,
  SAVED_ANSWER_FUTURE_MENB,
  SAVED_ANSWER_DUPLICATE_MENACWY,
  SAVED_ANSWER_DUPLICATE_MENB,
  SAVED_ANSWER_CROSS_DUPLICATES,
  SAVED_ANSWER_BRAND_CODES,
} from '../../test-grid.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { ALL_BRANDS } from '../../data/brands.js';

const read = (relativePath) => {
  const url = new URL(`../../../${relativePath}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, 'utf8').split('\n').filter(Boolean) : null;
};
const asMap = (lines) => new Map(lines.map((l) => {
  const i = l.indexOf('\t');
  return [l.slice(0, i), l.slice(i + 1)];
}));

const FILES = [
  { label: 'real patients', path: SAVED_ANSWERS_RELATIVE_PATH, build: savedAnswerLines },
  { label: 'impossible entries', path: RECORD_PROBLEM_RELATIVE_PATH, build: recordProblemLines },
];

for (const { label, path, build } of FILES) {
  describe(`saved answers (${label})`, () => {
    const saved = read(path);

    it('the saved file exists', () => {
      expect(
        saved,
        `${path} is missing. Create it with:\n\n    npm run sweep:update\n`,
      ).not.toBeNull();
      expect(saved.length).toBeGreaterThan(0);
    });

    it('the engine still gives every patient the answer it gave before', () => {
      const before = asMap(saved ?? []);
      const after = asMap(build());
      const moved = [];
      const added = [];
      const removed = [];
      for (const [k, v] of after) {
        if (!before.has(k)) added.push(k);
        else if (before.get(k) !== v) moved.push(k);
      }
      for (const k of before.keys()) if (!after.has(k)) removed.push(k);

      if (moved.length || added.length || removed.length) {
        const sample = moved.slice(0, 8).map((k) => (
          `  ${k}\n    was: ${before.get(k)}\n    now: ${after.get(k)}`
        )).join('\n');
        throw new Error(
          `The app's answers changed for ${moved.length} of ${before.size} ${label}`
          + `${added.length ? `; ${added.length} patients were added` : ''}`
          + `${removed.length ? `; ${removed.length} disappeared` : ''}.\n\n`
          + (sample ? `${sample}\n${moved.length > 8 ? `  ... and ${moved.length - 8} more.\n` : ''}\n` : '')
          + 'Not automatically a bug, but somebody has to say why. If the change was meant,\n'
          + 'run `npm run sweep:update` and put the moved count, and the reason, in the PR.',
        );
      }
    });
  });
}

// ── The grid still reaches what it is meant to reach ─────────────────────
// Each of these failing means the files have quietly stopped watching
// something, which no amount of "nothing moved" would ever reveal.
describe('saved answers: the grid covers the app', () => {
  const real = read(SAVED_ANSWERS_RELATIVE_PATH) ?? [];
  const impossible = read(RECORD_PROBLEM_RELATIVE_PATH) ?? [];
  const answers = real.map((l) => l.slice(l.indexOf('\t') + 1));

  it('every risk factor in the app is on the grid, and every pair names a real one', () => {
    const appIds = RISK_FACTORS.map((r) => r.id);
    const gridIds = new Set(SAVED_ANSWER_RISK_PROFILES.flat());
    expect(appIds.filter((id) => !gridIds.has(id))).toEqual([]);
    expect([...gridIds].filter((id) => !appIds.includes(id))).toEqual([]);
  });

  it('every brand in the app is recorded somewhere, and has its own short code', () => {
    const recorded = new Set(
      [...SAVED_ANSWER_MENACWY_HISTORIES, ...SAVED_ANSWER_MENB_HISTORIES].flat().map(([b]) => b),
    );
    const keys = ALL_BRANDS.map((b) => b.key);
    expect(keys.filter((k) => !recorded.has(k)), 'brands no saved patient has received').toEqual([]);
    expect(recorded.has(''), 'the "Unknown brand" option').toBe(true);
    expect(keys.filter((k) => !SAVED_ANSWER_BRAND_CODES[k]), 'brands with no short code').toEqual([]);
    const codes = keys.map((k) => SAVED_ANSWER_BRAND_CODES[k]);
    expect(new Set(codes).size, 'two brands share a code').toBe(codes.length);
  });

  it('the two basic MenB histories are among the MenB histories', () => {
    for (const h of SAVED_ANSWER_MENB_BASIC) {
      expect(SAVED_ANSWER_MENB_HISTORIES.some((m) => JSON.stringify(m) === JSON.stringify(h))).toBe(true);
    }
  });

  it('the ages sit on the meningococcal age lines', () => {
    for (const m of [2, 7, 12, 24, 120, 132, 192, 228, 264, 288]) {
      expect(SAVED_ANSWER_AGES_MONTHS, `${m} months`).toContain(m);
    }
    // Both sides of the 10th and 16th birthdays.
    expect(SAVED_ANSWER_AGES_MONTHS).toContain(119);
    expect(SAVED_ANSWER_AGES_MONTHS).toContain(191);
  });

  it('many saved doses do not count, so a change to what a gap is measured from is seen', () => {
    // PneumoVax's ANCHOR-1 came out "nothing moved" because no saved patient had
    // a dose that did not count. Ruling D (R-2, still open) is the same question.
    const notCounted = answers.filter((a) => /d[AB]=\S*invalid:-:1:/.test(a));
    expect(notCounted.length).toBeGreaterThan(1000);
    // ...and a dose that did not count followed by one that did, in MenACWY.
    expect(answers.some((a) => /dA=\S*invalid:-:1:[^,\s]*,valid:/.test(a))).toBe(true);
  });

  it('the pentavalent card is offered to some saved patients and not others', () => {
    expect(answers.some((a) => a.includes(' P=1/'))).toBe(true);
    expect(answers.some((a) => a.includes(' P=0/'))).toBe(true);
  });

  it('a real patient never carries a record problem; the impossible file has all three', () => {
    const kindsIn = (lines) => new Set(lines.flatMap((l) => (
      [...l.matchAll(/:(future|before-birth|duplicate):n\d+/g)].map((m) => m[1])
    )));
    expect([...kindsIn(real)]).toEqual([]);
    expect([...kindsIn(impossible)].sort()).toEqual(['before-birth', 'duplicate', 'future']);
  });

  it('the impossible shapes each contain an impossible dose', () => {
    // A future or duplicate shape that has quietly become an ordinary history
    // would move a real patient into the wrong file.
    for (const shapes of [SAVED_ANSWER_FUTURE_MENACWY, SAVED_ANSWER_FUTURE_MENB]) {
      for (const h of shapes.filter((s) => s.length)) expect(h.some(([, d]) => d < 0)).toBe(true);
    }
    for (const shapes of [SAVED_ANSWER_DUPLICATE_MENACWY, SAVED_ANSWER_DUPLICATE_MENB]) {
      for (const h of shapes.filter((s) => s.length)) {
        expect(new Set(h.map(([, d]) => d)).size).toBeLessThan(h.length);
      }
    }
    for (const [acwy, menb] of SAVED_ANSWER_CROSS_DUPLICATES) {
      expect(['Penbraya', 'Penmenvy']).toContain(acwy[0][0]);
      expect(menb.map(([, d]) => d)).toContain(acwy[0][1]);
    }
  });
});
