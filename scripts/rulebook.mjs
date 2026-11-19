// npm run rulebook — rewrite the rulebook's generated rule table from the code.
//
// The rulebook is docs/agent/meningococcal-rules-summary.md. Its section between
// the RULE-TABLE markers is written from src/data/rulebook.js; run this after any
// change to src/logic/doseRules.js or to a quoted sentence in src/data/refs.js,
// then read the diff: every changed line is a rule that changed.
import { readFileSync, writeFileSync } from 'node:fs';
import { withRulebookSection } from '../src/data/rulebook.js';

const PATH = new URL('../docs/agent/meningococcal-rules-summary.md', import.meta.url);
const before = readFileSync(PATH, 'utf8');
const after = withRulebookSection(before);
if (after === before) {
  console.log('The rulebook\'s rule table already matches the code. Nothing written.');
} else {
  writeFileSync(PATH, after);
  console.log('Rewrote the rule table in docs/agent/meningococcal-rules-summary.md. Read the diff.');
}
