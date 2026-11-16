// ── The rule table held against CDC's CDSI rules (port Phase 2.3, M-CDSI-1, 2026-11-15) ──
//
// CDSI is CDC's machine-readable version of ACIP's schedule. Its two
// meningococcal rule files (scripts/cdsi/cdc-files/AntigenSupportingData-*.xml)
// are read directly, every rule in them becomes a named "fact"
// (scripts/cdsi/cdsiRules.mjs), and every row of the app's rule table
// (src/logic/doseRules.js) is held against the facts it corresponds to
// (scripts/cdsi/cdsiRuleMap.mjs). Printed version:
// `npx vite-node scripts/cdsi/runRuleComparison.mjs`.
//
// This test does NOT require the app to agree with CDSI: CDSI runs behind
// ACIP's wording, and where they differ the wording wins (owner rules
// 2026-08-10, 2026-10-17). It requires every difference to be NAMED, with a
// status and a reason, and it fails when anything changes unexplained:
//   1. a row of the rule table with no entry in the map (or a stale entry);
//   2. a comparison whose differences are no longer what the map declares
//      (a constant changed, a row's grace or floor changed, or CDSI changed);
//   3. a difference with no status, or a status without its evidence;
//   4. a CDSI rule nothing accounts for (a new rule in a new release);
//   5. CDSI's rules differing from the saved copy (meningo-cdsi-rules.json):
//      read the release notes, then re-save with
//      `npx vite-node scripts/cdsi/runRuleComparison.mjs --save-facts`.
import { describe, it, expect } from 'vitest';
import { DOSE_RULES } from '../doseRules.js';
import { CITATIONS } from '../../data/refs.js';
import { readCdsiFacts, readSavedFacts, CDSI_VERSION } from '../../../scripts/cdsi/cdsiRules.mjs';
import {
  ROW_MAP, CDSI_ONLY, NOT_COMPARED, allComparisons, compareItem, claimsOf,
} from '../../../scripts/cdsi/cdsiRuleMap.mjs';

const facts = readCdsiFacts();
const comparisons = allComparisons();
const STATUSES = ['wording', 'owner', 'open'];
const label = (c) => `${c.source} · ${c.what}`;

describe("CDC's CDSI rule files are read", () => {
  it(`both meningococcal files of CDSI ${CDSI_VERSION} are read, every rule as a fact`, () => {
    const acwy = [...facts.keys()].filter((k) => k.startsWith('ACWY · '));
    const b = [...facts.keys()].filter((k) => k.startsWith('B · '));
    expect(acwy.length).toBeGreaterThan(100);
    expect(b.length).toBeGreaterThan(100);
  });

  it('CDSI\'s rules have not changed since they were saved', () => {
    const saved = readSavedFacts();
    expect(saved, 'run once with --save-facts').not.toBeNull();
    const changed = [...new Set([...Object.keys(saved), ...facts.keys()])]
      .filter((k) => saved[k] !== facts.get(k)?.value)
      .map((k) => `${k}\n  saved: ${saved[k] ?? '(new)'}\n  now:   ${facts.get(k)?.value ?? '(gone)'}`);
    expect(changed).toEqual([]);
  });
});

describe('every row of the rule table is held against CDSI', () => {
  it('the map has exactly the rows of doseRules.js', () => {
    expect(Object.keys(ROW_MAP).sort()).toEqual(DOSE_RULES.map((r) => r.id).sort());
  });

  it('each row either names its CDSI rules or says why CDSI has none', () => {
    const bad = Object.entries(ROW_MAP).filter(([, m]) => !!m.none === !!m.compare?.length || (m.none && m.none.length < 40));
    expect(bad.map(([id]) => id)).toEqual([]);
  });

  it('every comparison finds its CDSI rule', () => {
    expect(comparisons.filter((c) => compareItem(c, facts).missing).map(label)).toEqual([]);
  });

  it('every comparison differs in exactly the ways the map declares', () => {
    const wrong = comparisons.map((c) => {
      const got = [...compareItem(c, facts).differs].sort();
      const declared = [...(c.differs ?? [])].sort();
      return got.join() === declared.join() ? null : `${label(c)}: declared [${declared}] but found [${got}]`;
    }).filter(Boolean);
    expect(wrong).toEqual([]);
  });
});

describe('every difference is named, with its evidence', () => {
  const differences = [
    ...comparisons.filter((c) => c.differs?.length),
    ...CDSI_ONLY.filter((o) => !o.pick).map((o) => ({ ...o, source: `CDSI only: ${o.id}` })),
  ];

  it('each has a status, and only differences have one', () => {
    expect(differences.filter((c) => !STATUSES.includes(c.status)).map(label)).toEqual([]);
    expect(comparisons.filter((c) => !c.differs?.length && (c.status || c.why)).map(label)).toEqual([]);
  });

  it('each says why, in a sentence', () => {
    expect(differences.filter((c) => !c.why || c.why.length < 60).map(label)).toEqual([]);
  });

  it('"follows the wording" cites a sentence the row itself cites', () => {
    const bad = differences.filter((c) => c.status === 'wording').filter((c) => {
      const row = DOSE_RULES.find((r) => r.id === c.source);
      return !c.refs?.length || c.refs.some((k) => !CITATIONS[k] || !row?.sourcesSay.refs.includes(k));
    });
    expect(bad.map(label)).toEqual([]);
  });

  it('"owner-decided" names the date and where it is recorded', () => {
    expect(differences.filter((c) => c.status === 'owner' && !/^\d{4}-\d{2}-\d{2}, .{10,}/.test(c.decided ?? '')).map(label)).toEqual([]);
  });

  it('"open" names its STOP C question', () => {
    expect(differences.filter((c) => c.status === 'open' && !/^Q\d/.test(c.stopC ?? '')).map(label)).toEqual([]);
  });

  // Frozen so a new open question cannot join the STOP C packet quietly: the
  // PR that adds one changes this list and says why.
  it('the open questions for STOP C are these', () => {
    const open = [...new Set(differences.filter((c) => c.status === 'open').map((c) => c.source))].sort();
    expect(open).toEqual([
      'ACWY-ANY-TWO-DOSES-GAP',
      'ACWY-TRAVEL-BOOSTER-GAP',
      'CDSI only: MENB-4C-OLD-2-DOSE-COURSE',
      'CDSI only: PENTAVALENT-UPPER-AGE',
      'CDSI only: ROUTINE-UPPER-AGES',
      'MENB-HEALTHY-EARLY-DOSE-2',
      'MENB-HIGHRISK-DOSE-3-FROM-DOSE-1',
      'MENB-HIGHRISK-EARLY-DOSE-3',
    ]);
  });
});

describe('every CDSI rule is accounted for', () => {
  const { claimed, patternHits } = claimsOf(facts);

  it('no CDSI rule is left unexplained (compared, covered by a row, or not compared with a reason)', () => {
    expect([...facts.keys()].filter((k) => !claimed.has(k)).map((k) => `${k} => ${facts.get(k).value}`)).toEqual([]);
  });

  it('no "not compared" pattern is stale (each still matches a CDSI rule)', () => {
    expect([...patternHits].filter(([, n]) => n === 0).map(([re]) => String(re))).toEqual([]);
  });

  it('every "not compared" pattern gives a reason', () => {
    expect(NOT_COMPARED.filter((n) => !n.why || n.why.length < 40).map((n) => String(n.match))).toEqual([]);
  });

  // ACWY-BELOW-MIN-AGE and MENB-BELOW-MIN-AGE compare ONE line per product and
  // cover the rest. That is honest only if the product reads the same in every
  // series and dose it appears in (for MenB, in every dose 1).
  it('each product\'s allowed ages read the same wherever CDSI lists them', () => {
    const groups = new Map();
    for (const x of facts.values()) {
      if (x.kind !== 'allowable' || /Hib-MenCY/.test(x.key)) continue;
      if (x.file === 'B' && x.dose !== 'Dose 1') continue;
      const g = `${x.file} CVX ${x.cvx}`;
      if (!groups.has(g)) groups.set(g, new Set());
      groups.get(g).add(x.value);
    }
    expect([...groups].filter(([, v]) => v.size > 1).map(([g, v]) => `${g}: ${[...v].join(' | ')}`)).toEqual([]);
  });
});
