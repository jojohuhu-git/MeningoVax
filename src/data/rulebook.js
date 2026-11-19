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

/** Replace the generated section inside a document's text. */
export function withRulebookSection(doc) {
  const a = doc.indexOf(TABLE_START);
  const b = doc.indexOf(TABLE_END);
  if (a === -1 || b === -1 || b < a) {
    throw new Error('The rulebook has no generated section: add the RULE-TABLE:START and END markers.');
  }
  return doc.slice(0, a) + rulebookSection() + doc.slice(b + TABLE_END.length);
}
