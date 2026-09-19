// 2026-09-19 (plan item B): a sweep test must get its risk profiles and
// brands from `src/test-grid.js`, never by hand-typing its own list.
//
// This is the exact failure `test-grid.js` exists to prevent:
// `sweep-dose-counter.test.js` used to carry its own `RISK_COMBOS` list of 7
// risk ids, and a 13th risk factor added to `riskFactors.js` would never have
// widened it — nothing would have noticed. In the same family as
// `regression-p2-1-intervals-in-one-place.test.js` and
// `regression-p2-3-ages-in-one-place.test.js`: a source scan, because the
// failure mode is a second copy somewhere else that happens to agree today.
//
// Scope: every `*sweep*.test.js` file. If a future sweep is added and does
// not import from `test-grid.js`, and its source contains an array literal
// hand-typing two or more known risk ids or brand labels, this fails and
// names the file.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { ALL_BRANDS } from '../../data/brands.js';

const TESTS_DIR = new URL('.', import.meta.url);
const SELF = 'regression-2026-09-19-sweeps-use-the-shared-grid.test.js';

function sweepFiles() {
  return readdirSync(TESTS_DIR)
    .filter((name) => /^sweep/i.test(name) && name.endsWith('.test.js') && name !== SELF);
}

// Strip comments before scanning — a comment is allowed to name a risk id or
// brand in prose (this very file does); only real code counts.
function code(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

const KNOWN_RISK_IDS = RISK_FACTORS.map((r) => r.id);
const KNOWN_BRAND_LABELS = ALL_BRANDS.map((b) => b.label);

// A quoted-string array literal: ['a', 'b', ...] or ["a", "b", ...].
const ARRAY_LITERAL = /\[\s*(?:['"][^'"]*['"]\s*,?\s*)+\]/g;

function handTypedListOf(known, src) {
  const hits = [];
  for (const literal of src.match(ARRAY_LITERAL) ?? []) {
    const strings = literal.match(/'[^']*'|"[^"]*"/g)?.map((s) => s.slice(1, -1)) ?? [];
    const knownHits = strings.filter((s) => known.includes(s));
    if (knownHits.length >= 2) hits.push(literal.replace(/\s+/g, ' '));
  }
  return hits;
}

describe('2026-09-19 · a sweep gets its grid from test-grid.js, not a local list', () => {
  const files = sweepFiles();

  it('found at least one sweep file to check (a canary for this test itself)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file} imports the shared grid`, () => {
      const src = readFileSync(new URL(file, TESTS_DIR), 'utf8');
      expect(
        /from\s+['"][^'"]*test-grid\.js['"]/.test(src),
        `${file} is a sweep but does not import from test-grid.js. If it needs a `
        + 'risk profile list or a brand, import SINGLE_RISK_PROFILES / '
        + 'MENACWY_SWEEP_BRAND / MENB_SWEEP_BRAND from there rather than typing one.',
      ).toBe(true);
    });

    it(`${file} does not hand-type its own risk-id or brand-label list`, () => {
      const src = code(readFileSync(new URL(file, TESTS_DIR), 'utf8'));
      const riskHits = handTypedListOf(KNOWN_RISK_IDS, src);
      const brandHits = handTypedListOf(KNOWN_BRAND_LABELS, src);
      expect(
        [...riskHits, ...brandHits],
        `${file} hand-types a list that looks like risk ids or brand labels: `
        + `${[...riskHits, ...brandHits].join(' | ')}. Import SINGLE_RISK_PROFILES `
        + '/ MENACWY_SWEEP_BRAND / MENB_SWEEP_BRAND from test-grid.js instead — a '
        + 'second copy is how sweep-dose-counter.test.js drifted from riskFactors.js.',
      ).toEqual([]);
    });
  }
});
