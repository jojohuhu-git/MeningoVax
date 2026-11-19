// Port Phase 7.1 (2026-11-19, plan E7): the rulebook is held to the code, cell by cell.
//
// The owner's rulebook is docs/agent/meningococcal-rules-summary.md (owner
// decision 2026-11-19). Its "rule table" section lists every rule in
// src/logic/doseRules.js — the one table validate.js walks to judge a recorded
// dose — and the quoted sentences each rule rests on. It is written by
// `npm run rulebook` from src/data/rulebook.js.
//
// This test re-builds each row from the code and compares it with the document,
// one rule and one column at a time, so a failure names the rule and the cell.
// rule-docs-match-code.test.js checks the rulebook's prose; this checks its table.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { DOSE_RULES } from '../doseRules.js';
import {
  COLUMNS, TABLE_START, TABLE_END, ruleCells, rulebookSection, appDecisionRules,
  cardRuleBlocks, withCardRuleSources, OWNER_ANSWERS,
} from '../../data/rulebook.js';
import { CITATIONS } from '../../data/refs.js';

const PATH = 'docs/agent/meningococcal-rules-summary.md';
const doc = readFileSync(new URL(`../../../${PATH}`, import.meta.url), 'utf8');

const why = (what) =>
  `${PATH} no longer matches the code: ${what}\n\n`
  + 'The table in that file is written from the code. Run `npm run rulebook`, read the diff '
  + '(every changed line is a rule that changed), and commit both together.';

// Read a markdown cell back to plain text: unescape pipes, drop code ticks.
const unCell = (s) => s.replace(/\\\|/g, '|').replace(/`/g, '').trim();

function parseTable(text) {
  const a = text.indexOf(TABLE_START);
  const b = text.indexOf(TABLE_END);
  if (a === -1 || b === -1 || b < a) return null;
  const rows = [];
  for (const line of text.slice(a, b).split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|') || /^\|-/.test(t)) continue;
    // Split on pipes that are not escaped.
    const cells = t.slice(1, -1).split(/(?<!\\)\|/).map(unCell);
    if (cells.length !== COLUMNS.length) continue;
    const row = Object.fromEntries(COLUMNS.map(([k], i) => [k, cells[i]]));
    if (row.id === 'Rule') continue; // the header
    rows.push(row);
  }
  return rows;
}

const docRows = parseTable(doc);

describe('Phase 7.1: the rulebook has its rule table', () => {
  it('the rulebook carries the generated section between its markers', () => {
    expect(docRows, why('it has no RULE-TABLE:START / RULE-TABLE:END section.')).not.toBeNull();
    expect(docRows.length, why('its rule table is empty.')).toBeGreaterThan(0);
  });

  it('lists exactly the rules the code has, in the order the code checks them', () => {
    const inCode = DOSE_RULES.map((r) => r.id);
    const inDoc = (docRows ?? []).map((r) => r.id);
    const missing = inCode.filter((id) => !inDoc.includes(id));
    const stale = inDoc.filter((id) => !inCode.includes(id));
    expect(missing, why(`these rules are in the code but not in the table: ${missing.join(', ')}.`)).toEqual([]);
    expect(stale, why(`the table lists rules the code no longer has: ${stale.join(', ')}.`)).toEqual([]);
    expect(inDoc, why('the rules are listed in a different order from the one the app checks them in. '
      + 'The order matters: the first rule that catches a dose decides it.')).toEqual(inCode);
  });
});

describe('Phase 7.1: every rule reads in the rulebook exactly as the code has it, cell by cell', () => {
  for (const rule of DOSE_RULES) {
    it(`${rule.id}`, () => {
      const want = ruleCells(rule);
      const got = (docRows ?? []).find((r) => r.id === rule.id);
      expect(got, why(`${rule.id} has no row in the table.`)).toBeDefined();
      for (const [k, heading] of COLUMNS) {
        expect(got[k], why(`${rule.id}, column "${heading}", reads "${got[k]}"; the code says "${want[k]}".`))
          .toBe(want[k]);
      }
    });
  }
});

describe('Phase 7.1: the numbered app decisions and the quoted sentences match the code', () => {
  it('the whole generated section is exactly what the code writes', () => {
    const a = doc.indexOf(TABLE_START);
    const b = doc.indexOf(TABLE_END) + TABLE_END.length;
    const inDoc = a === -1 ? [] : doc.slice(a, b).split('\n');
    const fresh = rulebookSection().split('\n');
    const first = fresh.findIndex((line, i) => line !== inDoc[i]);
    expect(first, why(first === -1 ? '' : `line ${first + 1} of the section reads\n  "${inDoc[first]}"\nbut the code writes\n  "${fresh[first]}"`))
      .toBe(-1);
    expect(inDoc.length, why('the section has extra lines the code does not write.')).toBe(fresh.length);
  });

  it('every rule that rests on an owner or app decision is numbered as one', () => {
    for (const [i, rule] of appDecisionRules().entries()) {
      expect(doc, why(`${rule.id} is not listed as App decision ${i + 1}.`))
        .toContain(`**App decision ${i + 1}** (\`${rule.id}\`)`);
    }
  });

  it('every rule that a source states has at least one quoted sentence', () => {
    const bare = DOSE_RULES
      .filter((r) => r.sourcesSay?.verdict === 'stated' && !(r.sourcesSay.refs ?? []).length)
      .map((r) => r.id);
    expect(bare, 'these rules say "a source states it" but quote no sentence').toEqual([]);
  });
});

// Port Phase 7.1, the rest (owner 2026-11-19, "Link to source list"): every
// card rule in §§1–3 names its sources, and the sentences under it are the ones
// in src/data/refs.js, word for word. A rule with no sentence yet says so.
describe('Phase 7.1: every card rule in sections 1–3 names its sources', () => {
  const blocks = cardRuleBlocks(doc);

  it('every rule has a SOURCES tag under it', () => {
    const missing = blocks.filter((b) => b.tokens === null).map((b) => b.text.slice(0, 90));
    expect(missing, `${PATH}: these rules in sections 1–3 have no <!-- SOURCES: … --> tag under them. `
      + 'Name the refs.js entry (or owner:<id>, todo, explains, record-keeping), then run `npm run rulebook`.\n'
      + missing.join('\n')).toEqual([]);
  });

  it('every tag names a quoted, dated sentence or a recorded owner answer', () => {
    const known = (t) => ['todo', 'explains', 'record-keeping'].includes(t)
      || (t.startsWith('owner:') && OWNER_ANSWERS[t.slice(6)])
      || (CITATIONS[t]?.quote && CITATIONS[t]?.lastVerified);
    const bad = blocks.flatMap((b) => (b.tokens ?? []).filter((t) => !known(t)).map((t) => `${t} (under "${b.text.slice(0, 60)}")`));
    expect(bad, `${PATH}: unknown, unquoted or undated source: ${bad.join('; ')}`).toEqual([]);
  });

  it('every owner answer points at a file that exists', () => {
    const gone = Object.entries(OWNER_ANSWERS)
      .filter(([, o]) => !existsSync(new URL(`../../../docs/agent/${o.where}`, import.meta.url)))
      .map(([id, o]) => `${id} → ${o.where}`);
    expect(gone).toEqual([]);
  });

  it('the lines under every tag are exactly what the code writes (quote, link, read date)', () => {
    const fresh = withCardRuleSources(doc).split('\n');
    const mine = doc.split('\n');
    const first = fresh.findIndex((l, i) => l !== mine[i]);
    expect(first, why(`line ${first + 1} under a SOURCES tag reads\n  ${mine[first]}\nbut refs.js gives\n  ${fresh[first]}`)).toBe(-1);
    expect(mine.length).toBe(fresh.length);
  });

  // The rules still waiting for a sentence. This number may only go down: a new
  // rule must arrive with its source, not as one more "todo".
  it('no more than 2 rules are still waiting for a sentence', () => {
    const todo = blocks.filter((b) => b.tokens?.includes('todo'));
    expect(todo.length).toBeLessThanOrEqual(2);
  });
});
