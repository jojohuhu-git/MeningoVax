// The rulebook's rule table, written from the code (port Phase 7.1, 2026-11-19).
//
// The owner's rulebook is `docs/agent/meningococcal-rules-summary.md` (owner
// decision 2026-11-19: the summary grows into the rulebook; no new top-level
// file). Its section "The rule table" is GENERATED here from `DOSE_RULES`, the
// one table `validate.js` walks to judge every recorded dose, and from the
// quoted sentences in `CITATIONS`. Nothing in that section is typed by hand:
//
//   npm run rulebook   rewrites the section from this file.
//
// `rulebook-table-matches-code.test.js` re-generates every row and compares it
// with the document cell by cell, so a rule cannot change in the code while
// the rulebook goes on describing the old one (plan E7; PneumoVax's
// `rule-docs-match-code.test.js` does the same for its rulebook).
//
// Words only. Nothing here decides a dose: every cell is read off a field the
// row already carries (`what`, `schedule`, `measuredFrom`, `enforcement`,
// `grace`, `label`, `authorityToday`, `sourcesSay`).
import { DOSE_RULES } from '../logic/doseRules.js';
import { CITATIONS } from './refs.js';

// The markers the generated section sits between. The test and the script
// both find the section by these, never by line numbers.
export const TABLE_START = '<!-- RULE-TABLE:START — written by `npm run rulebook` from src/data/rulebook.js; do not edit by hand -->';
export const TABLE_END = '<!-- RULE-TABLE:END -->';

// What happens to a dose the rule catches (doseRules.js `enforcement`), in the
// words a clinician would use. The chip itself is the next column.
export const ENFORCEMENT_WORDS = {
  floor: 'Not counted',
  'set-aside': 'Not counted toward this series',
  'counts-with-note': 'Counts, with a note',
  counts: 'Counts',
  'needs-input': 'Waits for "high-risk on that date?"',
  'record-problem': 'Not counted (a record problem)',
  extra: 'Not counted (extra)',
  none: 'Never flagged',
};

// How the app's rule compares with the sources (doseRules.js `sourcesSay.verdict`).
export const VERDICT_WORDS = {
  stated: 'A source states it',
  'schedule-only': 'Sources give a schedule, not a minimum',
  differs: 'Sources differ',
  'owner-decided': 'Owner decision',
  'no-source': 'No source',
  'record-keeping': 'Record-keeping',
};

// The 4-day grace (doseRules.js `grace`).
export const GRACE_WORDS = {
  true: 'Yes',
  false: 'No, on purpose',
  null: '—',
};

/** The rule's columns, in the order the table prints them. */
export const COLUMNS = [
  ['vaccine', 'Vaccine'],
  ['who', 'Who it applies to'],
  ['what', 'What it catches'],
  ['from', 'Counted from'],
  ['result', 'Result'],
  ['label', 'Label beside the dose'],
  ['grace', '4-day grace'],
  ['sources', 'What the sources say'],
  ['authority', 'Who decided'],
  ['id', 'Rule'],
];

const word = (map, key, field, id) => {
  if (!(String(key) in map)) {
    throw new Error(`rulebook.js has no words for ${field} "${key}" (rule ${id}). Add them to the map.`);
  }
  return map[String(key)];
};

/** One rule as the rulebook's cells. Every cell comes from a field of the row. */
export function ruleCells(rule) {
  return {
    vaccine: rule.vaccine === 'any' ? 'Both' : rule.vaccine,
    who: rule.schedule === 'any' ? 'Everyone' : rule.schedule,
    what: rule.what,
    from: rule.measuredFrom,
    result: word(ENFORCEMENT_WORDS, rule.enforcement, 'enforcement', rule.id),
    label: rule.label,
    grace: word(GRACE_WORDS, rule.grace ?? null, 'grace', rule.id),
    sources: word(VERDICT_WORDS, rule.sourcesSay?.verdict, 'sourcesSay.verdict', rule.id),
    authority: rule.authorityToday,
    id: rule.id,
  };
}

// The rules that rest on a decision of this app or its owner rather than a
// source's own words, numbered in table order. "App decision N" is the name
// the rulebook gives each one (not "D1"…, which are the owner's 2026-11-17
// answers).
export const APP_DECISION_VERDICTS = ['owner-decided', 'record-keeping', 'no-source'];
export const appDecisionRules = () =>
  DOSE_RULES.filter((r) => APP_DECISION_VERDICTS.includes(r.sourcesSay?.verdict));

// A markdown cell: no pipe can split it, no line break can end the row.
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

/** The generated section, markers included. */
export function rulebookSection() {
  const out = [TABLE_START, ''];

  out.push(
    `Every rule that can stop a recorded dose counting, or count it with a note: ${DOSE_RULES.length} rules,`,
    'in the order the app checks them (the first rule that catches a dose decides it).',
    'Written from the code; a test holds every cell to it.',
    '',
    `| ${COLUMNS.map(([, h]) => h).join(' | ')} |`,
    `|${COLUMNS.map(() => '---').join('|')}|`,
  );
  for (const rule of DOSE_RULES) {
    const c = ruleCells(rule);
    out.push(`| ${COLUMNS.map(([k]) => cell(k === 'id' ? `\`${c[k]}\`` : c[k])).join(' | ')} |`);
  }

  out.push('', '### The app\'s own decisions, numbered', '');
  out.push(
    'The rules above that rest on a decision of this app or its owner rather than on a source\'s',
    'own words. The note says what the sources say and where the app parts from them.',
    '',
  );
  appDecisionRules().forEach((rule, i) => {
    out.push(`${i + 1}. **App decision ${i + 1}** (\`${rule.id}\`): ${rule.what}. ${rule.sourcesSay.note}`);
  });

  out.push('', '### The sentences each rule rests on', '');
  out.push(
    'Each quoted sentence was read live on the page linked, on the date given. A rule with no',
    'sentence is about the record, not the vaccine.',
    '',
  );
  for (const rule of DOSE_RULES) {
    const refs = rule.sourcesSay?.refs ?? [];
    out.push(`- \`${rule.id}\`${refs.length ? ':' : ': no sentence (about the record, not the vaccine).'}`);
    for (const key of refs) {
      const c = CITATIONS[key];
      if (!c) throw new Error(`rule ${rule.id} cites "${key}", which is not in CITATIONS.`);
      const quote = c.quote ? `"${c.quote}"` : '(the whole page)';
      out.push(`  - ${quote} — [${c.label}](${c.url}), read ${c.lastVerified ?? 'date not recorded'}.`);
    }
  }

  out.push('', TABLE_END);
  return out.join('\n');
}

/** Replace the generated sections inside a document's text: the rule table
 *  (§5) and the sources under every card rule (§§1–3). */
export function withRulebookSection(doc) {
  const a = doc.indexOf(TABLE_START);
  const b = doc.indexOf(TABLE_END);
  if (a === -1 || b === -1 || b < a) {
    throw new Error('The rulebook has no generated section: add the RULE-TABLE:START and END markers.');
  }
  return withCardRuleSources(doc.slice(0, a) + rulebookSection() + doc.slice(b + TABLE_END.length));
}

// ─────────────────────────────────────────────────────────────────────────
// The card rules' sources (port Phase 7.1, rest; owner 2026-11-19: "Link to
// source list").
//
// Sections 1–3 of the rulebook describe how the cards decide (schedules,
// booster timing, the combined shot). Those rules live as branching code in
// recommend.js, so there is no row table to write them from; they stay in
// plain English. What is generated is the evidence under each one: every rule
// (each bullet, and each paragraph that states a rule) is followed by a tag
//
//   <!-- SOURCES: acwyRoutine1112and16, owner:C5 -->
//   …written by `npm run rulebook`…
//   <!-- /SOURCES -->
//
// and the lines between are copied from CITATIONS: the quoted sentence, the
// link and the date it was read. So a quote cannot drift from the one the
// cards show. A token is one of:
//   a CITATIONS key — it must carry a quote and a read date;
//   owner:<id>      — an owner answer, named in OWNER_ANSWERS below;
//   todo            — no sentence linked yet; printed as such, never hidden;
//   record-keeping  — about how the app records a dose, not the vaccine;
//   explains        — the paragraph defines or explains, states no rule.
// `rulebook-table-matches-code.test.js` fails if a rule in §§1–3 has no tag,
// a token is unknown, or the lines under a tag differ from what this writes.
// ─────────────────────────────────────────────────────────────────────────
export const SOURCES_END = '<!-- /SOURCES -->';
const SOURCES_START_RE = /^(\s*)<!-- SOURCES: (.*?) -->\s*$/;
export const CARD_RULES_FROM = '## 1. MenACWY';
export const CARD_RULES_TO = '## 4. ';

// Where each owner answer cited in §§1–3 is written down. The id is the one
// the rulebook's own sentence already uses ("your C5 answer").
// `where` is the file's path from docs/agent/, where the rulebook lives.
const STOP_C = '../archive/stop-c-packet-2026-11-15.md';
const PLAN = '../archive/plan-2026-11-08-meningovax-port.md';
const OPEN_Q = '../archive/decisions-2026-11-17-open-questions.md';
const G1 = '../archive/stop-g1-packet-2026-11-18.md';
const FOLD = '../archive/decisions-2026-11-19-after-the-fold.md';
const TODO_Q = '../archive/decisions-2026-11-19-t1-t2-todo-rules.md';
const REORG = '../archive/decisions-2026-11-20-rulebook-reorg.md';
const RULES = 'clinical-rules.md';
const MQ6_Q = '../archive/decisions-2026-11-21-menquadfi-from-6-weeks.md';
const MQ6_GAP = '../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md';
export const OWNER_ANSWERS = {
  'P0-1': { date: '2026-09-17', where: RULES },
  'PneumoVax-Complete': { date: '2026-11-01', where: PLAN },
  N1: { date: '2026-11-15', where: RULES },
  N5: { date: '2026-11-15', where: RULES },
  'B-2': { date: '2026-11-15', where: PLAN },
  'B-3': { date: '2026-11-15', where: PLAN },
  'B-4': { date: '2026-11-15', where: PLAN },
  'B-5': { date: '2026-11-15', where: PLAN },
  C4: { date: '2026-11-15', where: STOP_C },
  C5: { date: '2026-11-15', where: STOP_C },
  C6: { date: '2026-11-15', where: STOP_C },
  C7: { date: '2026-11-15', where: STOP_C },
  C10: { date: '2026-11-15', where: STOP_C },
  C12: { date: '2026-11-15', where: STOP_C },
  C13: { date: '2026-11-15', where: STOP_C },
  D1: { date: '2026-11-17', where: OPEN_Q },
  D3: { date: '2026-11-17', where: OPEN_Q },
  D4: { date: '2026-11-17', where: OPEN_Q },
  D6: { date: '2026-11-17', where: OPEN_Q },
  D7: { date: '2026-11-17', where: OPEN_Q },
  D9: { date: '2026-11-17', where: OPEN_Q },
  D10: { date: '2026-11-17', where: OPEN_Q },
  Q9a: { date: '2026-11-17', where: OPEN_Q },
  Q9b: { date: '2026-11-17', where: OPEN_Q },
  F2a: { date: '2026-11-18', where: OPEN_Q },
  'F-2': { date: '2026-11-18', where: OPEN_Q },
  '16y-booster': { date: '2026-11-18', where: OPEN_Q },
  'F-3': { date: '2026-11-18', where: G1 },
  W1: { date: '2026-11-19', where: FOLD },
  W3: { date: '2026-11-19', where: FOLD },
  T1: { date: '2026-11-19', where: TODO_Q },
  T2: { date: '2026-11-19', where: TODO_Q },
  M1: { date: '2026-11-20', where: REORG },
  M1b: { date: '2026-11-20', where: REORG },
  M1c: { date: '2026-11-20', where: REORG },
  M1d: { date: '2026-11-21', where: '../archive/decisions-2026-11-21-menb-repeat-dose3.md' },
  // A short or early high-risk MenB series says why on its first-booster card.
  item6: { date: '2026-11-22', where: '../archive/decisions-2026-11-22-item6-counted-menb-doses.md' },
  'Tier1-Q1': { date: '2026-11-22', where: '../archive/decisions-2026-11-22-tier1-q1-q5.md' },
  'Tier1-Q5': { date: '2026-11-22', where: '../archive/decisions-2026-11-22-tier1-q1-q5.md' },
  // MenQuadfi can be given from 6 weeks ("Can be given (Rec.)", "Yes, outbreak too").
  MQ6: { date: '2026-11-21', where: MQ6_Q },
  // After a 6-week MenQuadfi dose; the gap between a minimum and a routine date.
  'MQ6-e': { date: '2026-11-21', where: MQ6_GAP },
  'MQ6-f': { date: '2026-11-21', where: MQ6_GAP },
  'MQ6-g': { date: '2026-11-21', where: MQ6_GAP },
  'MQ6-h': { date: '2026-11-21', where: MQ6_GAP },
  // The 6-week card: the 6-week line stays folded (i), both brands (j), no card without a date of birth (k).
  'MQ6-i': { date: '2026-11-21', where: MQ6_GAP },
  'MQ6-j': { date: '2026-11-21', where: MQ6_GAP },
  'MQ6-k': { date: '2026-11-21', where: MQ6_GAP },
  // No combined shot in pregnancy ("Separate shots").
  'PREG-PENTA': { date: '2026-11-26', where: '../archive/decisions-2026-11-26-pregnancy-combined-shot.md' },
};

/** The lines a SOURCES tag's tokens stand for, without indent. */
export function sourceLines(tokens) {
  const lines = [];
  for (const t of tokens) {
    let line;
    if (t === 'explains') continue;
    if (t === 'record-keeping') {
      line = '> About how the app records a dose, not about the vaccine: no source needed.';
    } else if (t === 'todo') {
      line = '> *No sentence linked yet for this rule, or part of it: still to be read live (port Phase 7.1).*';
    } else if (t.startsWith('owner:')) {
      const id = t.slice('owner:'.length);
      const o = OWNER_ANSWERS[id];
      if (!o) throw new Error(`SOURCES names owner answer "${id}", which is not in OWNER_ANSWERS.`);
      line = `> Owner decision ${id}, ${o.date} ([${o.where.split('/').pop()}](${o.where})).`;
    } else {
      const c = CITATIONS[t];
      if (!c) throw new Error(`SOURCES names "${t}", which is not in CITATIONS.`);
      if (!c.quote) throw new Error(`SOURCES names "${t}", which has no quoted sentence.`);
      if (!c.lastVerified) throw new Error(`SOURCES names "${t}", which has no read date.`);
      line = `> "${c.quote}" — [${c.short ?? c.label}](${c.url}), read ${c.lastVerified}.`;
    }
    if (lines.length) lines.push('>');
    lines.push(line);
  }
  return lines;
}

const parseTokens = (s) => s.split(',').map((t) => t.trim()).filter(Boolean);

/** Rewrite the lines under every SOURCES tag in the document. */
export function withCardRuleSources(doc) {
  const lines = doc.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(SOURCES_START_RE);
    out.push(lines[i]);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== SOURCES_END) j++;
    if (j === lines.length) throw new Error(`A SOURCES tag has no ${SOURCES_END} after it (line ${i + 1}).`);
    for (const l of sourceLines(parseTokens(m[2]))) out.push(m[1] + l);
    out.push(lines[j]);
    i = j;
  }
  return out.join('\n');
}

/**
 * The rules of §§1–3, each with the tokens of the tag after it (null when it
 * has none). A rule is a bullet (with its wrapped lines) or a paragraph.
 */
export function cardRuleBlocks(doc) {
  const all = doc.split('\n');
  const from = all.findIndex((l) => l.startsWith(CARD_RULES_FROM));
  const to = all.findIndex((l, i) => i > from && l.startsWith(CARD_RULES_TO));
  if (from === -1 || to === -1) throw new Error('The rulebook has lost its section 1 or 4 heading.');
  const lines = all.slice(from + 1, to);
  const blocks = [];
  let cur = null;
  const close = (tokens) => { if (cur) { cur.tokens = tokens; blocks.push(cur); cur = null; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const t = l.trim();
    const m = l.match(SOURCES_START_RE);
    if (m) {
      close(parseTokens(m[2]));
      while (i < lines.length && lines[i].trim() !== SOURCES_END) i++;
      continue;
    }
    if (t === '' || t.startsWith('#') || t === '---') { close(null); continue; }
    if (/^\s*- /.test(l) || !cur) { close(null); cur = { text: t }; continue; }
    cur.text += ` ${t}`;
  }
  close(null);
  return blocks;
}
