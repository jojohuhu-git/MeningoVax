// L2-3 (2026-09-16): the citation integrity tripwire.
//
// Two failure modes this repo has actually produced:
//
//   Dangling — a rec cites a key that no longer exists in refs.js. resolveRefs()
//   drops unknown keys silently and cite() returns an entry with no url, so the
//   card renders a citation superscript that links nowhere. Nothing fails.
//
//   Orphaned — an entry left in refs.js pointing at guidance the app no longer
//   implements. In July a text-fragment kept highlighting the college 5-year
//   expiry after M17 removed that rule, and on the military card it highlighted
//   the college sentence, which is the exact mix-up M18 existed to undo.
//
// The dangling check is a SWEEP, not a text scan: it drives the real engine
// across a wide spread of patients and inspects the citations it actually emits,
// so a key passed through a variable or built at runtime is covered too.
import { describe, it, expect } from 'vitest';
import { CITATIONS } from '../refs.js';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';
import { TEST_TODAY } from '../../test-today.js';
import { readFileSync } from 'node:fs';
import { noteText } from '../../test-note-text.js';

// Entries deliberately kept in refs.js although nothing cites them today.
// Anything NOT on this list that goes unreferenced is drift — either a rule lost
// its citation, or a retired rule left its source behind.
const KNOWN_UNCITED = {
  cdcChildMenACWY:
    'Kept as the CDC schedule-note landing page. Dropped from the MenACWY recs '
    + '2026-07-24 because it just restates the ACIP 2020 MMWR rule (owner decision '
    + '2026-07-23: do not cite two sources for one rule).',
};

const SOURCE_FILES = [
  'src/logic/recommend.js',
  'src/logic/validate.js',
  'src/data/riskFactors.js',
  'src/components/RecCard.jsx',
  'src/components/Results.jsx',
];

const AGES = [1, 2, 4, 7, 12, 23, 24, 60, 84, 119, 120, 132, 180, 192, 200, 216, 264, 276, 288, 600];
const RISKS = [
  [], ['asplenia'], ['complement'], ['hiv'], ['microbiologist'], ['travel'],
  ['military'], ['college_dorm'], ['outbreak_acwy'], ['outbreak_b'], ['pregnancy'],
  ['hct'], ['asplenia', 'hct'], ['travel', 'asplenia'], ['pregnancy', 'complement'],
  ['hct_cart_bcell_exclude'],
];

// Dose histories built backwards from the pinned test date, so they are stable.
function monthsBack(n) {
  const [y, m, d] = TEST_TODAY.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 - n, d));
  return dt.toISOString().slice(0, 10);
}
const HISTORIES = [
  [],
  [{ date: monthsBack(60), brand: 'Menveo 2-vial (MenACWY)' }],
  [{ date: monthsBack(60) }, { date: monthsBack(57) }],
  [{ date: monthsBack(120) }, { date: monthsBack(117) }, { date: monthsBack(60) }, { date: monthsBack(6) }],
];

function everyCitation(result) {
  const out = [];
  const push = (recs) => recs.forEach((r) => {
    (r.citations || []).forEach((c) => out.push({ where: `${r.vaccine} ${r.doseLabel} chip`, c }));
    (r.noteCites || []).forEach((c) => out.push({ where: `${r.vaccine} ${r.doseLabel} note`, c }));
  });
  push(result.menacwy || []);
  push(result.menb || []);
  (result.pentavalent?.citations || []).forEach((c) => out.push({ where: 'pentavalent', c }));
  (result.hct?.lines || []).forEach((l) => (l.citations || []).forEach((c) => out.push({ where: `HCT ${l.label}`, c })));
  (result.exclusionCitations || []).forEach((c) => out.push({ where: 'exclusion', c }));
  return out;
}

describe('L2-3: every citation the app can show actually resolves', () => {
  const broken = [];
  const markerMismatches = [];

  for (const ageMonths of AGES) {
    for (const riskIds of RISKS) {
      for (const doses of HISTORIES) {
        const result = recommend({
          ageMonths, riskIds, today: TEST_TODAY,
          menacwyDoses: doses,
          menbDoses: ageMonths >= 120 ? doses : [],
          riskAtDoseAnswers: { MenACWY: { 0: 'yes', 1: 'yes', 2: 'yes', 3: 'yes' }, MenB: { 0: 'yes', 1: 'yes', 2: 'yes', 3: 'yes' } },
        });

        for (const { where, c } of everyCitation(result)) {
          if (!c || typeof c.url !== 'string' || c.url.length === 0 || !c.label) {
            broken.push(`age ${ageMonths}m, risks [${riskIds.join('+') || 'none'}], ${doses.length} doses — ${where}: ${JSON.stringify(c)}`);
          }
        }

        for (const rec of [...(result.menacwy || []), ...(result.menb || [])]) {
          // U1 (2026-09-17): a note is { lead, detail }, and the [c] markers in
          // the two halves share ONE ordered noteCites list -- so the count has
          // to span both halves, exactly as RecCard's slicing does.
          const markers = noteText(rec).split('[c]').length - 1;
          const cites = (rec.noteCites || []).length;
          if (markers !== cites) {
            markerMismatches.push(`age ${ageMonths}m, risks [${riskIds.join('+') || 'none'}], ${doses.length} doses — "${rec.doseLabel}": ${markers} [c] marker(s) but ${cites} citation(s)`);
          }
        }
      }
    }
  }

  it('no recommendation cites a source that cannot be resolved', () => {
    expect(
      broken.slice(0, 10),
      'These recommendations carry a citation with no working link — the card would show a '
      + 'superscript that goes nowhere. Usually a citation key renamed in refs.js but not at '
      + `the place that cites it.\n${broken.slice(0, 10).join('\n')}`
    ).toEqual([]);
  });

  it('every [c] marker in a note has exactly one citation behind it', () => {
    expect(
      markerMismatches.slice(0, 10),
      'A note\'s [c] markers and its citation list have drifted apart. RecCard numbers the '
      + 'markers in order, so a spare marker renders an empty superscript and a spare citation '
      + `never appears at all.\n${markerMismatches.slice(0, 10).join('\n')}`
    ).toEqual([]);
  });
});

describe('L2-3: no source sits in refs.js unused', () => {
  it('every citation is either cited somewhere or documented as deliberately uncited', () => {
    const src = SOURCE_FILES.map((f) => readFileSync(new URL(`../../../${f}`, import.meta.url), 'utf8')).join('\n');
    // Match the quoted key, so acip2020 is not counted as a hit for acip2020Table2.
    const isCited = (key) => src.includes(`'${key}'`) || src.includes(`"${key}"`);
    const unexplained = Object.keys(CITATIONS)
      .filter((key) => !isCited(key) && !(key in KNOWN_UNCITED));

    expect(
      unexplained,
      'These sources sit in refs.js but nothing cites them: ' + unexplained.join(', ')
      + '.\nEither a rule lost its citation, or a retired rule left its source behind — a stale '
      + 'entry is how a text-fragment ended up highlighting the college 5-year rule months after '
      + 'it was removed. Cite it, delete it, or add it to KNOWN_UNCITED in this test with the '
      + 'reason it stays.'
    ).toEqual([]);
  });

  it('the deliberately-uncited list has not gone stale itself', () => {
    const src = SOURCE_FILES.map((f) => readFileSync(new URL(`../../../${f}`, import.meta.url), 'utf8')).join('\n');
    const nowCited = Object.keys(KNOWN_UNCITED)
      .filter((key) => src.includes(`'${key}'`) || src.includes(`"${key}"`));
    expect(
      nowCited,
      `These are now cited by the app, so remove them from KNOWN_UNCITED: ${nowCited.join(', ')}.`
    ).toEqual([]);
    const gone = Object.keys(KNOWN_UNCITED).filter((key) => !(key in CITATIONS));
    expect(
      gone,
      `These were deleted from refs.js, so remove them from KNOWN_UNCITED: ${gone.join(', ')}.`
    ).toEqual([]);
  });
});


// G4 (2026-09-16): the record panel's dose verdicts are a SECOND channel that
// can carry citations (`reasonCites`), with the same two failure modes as a
// rec card's note — a marker with no citation behind it renders an empty
// superscript, a citation with no marker never appears at all. Same sweep,
// same invariants, over the validator instead of the engine.
describe('L2-3: the record panel\'s dose verdicts cite resolvably too', () => {
  const broken = [];
  const markerMismatches = [];

  for (const ageMonths of AGES) {
    for (const riskIds of RISKS) {
      for (const doses of HISTORIES) {
        for (const answer of ['yes', 'no', 'unsure', undefined]) {
          const answers = { 0: answer, 1: answer, 2: answer, 3: answer };
          for (const vaccine of ['MenACWY', 'MenB']) {
            const { perDose } = analyzeHistory(vaccine, doses, ageMonths, riskIds, TEST_TODAY, answers);
            perDose.forEach((d, i) => {
              const where = `${vaccine} dose ${i + 1}, age ${ageMonths}m, risks [${riskIds.join('+') || 'none'}], risk-at-dose ${answer ?? 'unanswered'}`;
              const markers = (d.reasons || []).join(' ').split('[c]').length - 1;
              const cites = (d.reasonCites || []).length;
              if (markers !== cites) markerMismatches.push(`${where}: ${markers} [c] marker(s) but ${cites} citation(s)`);
              for (const c of d.reasonCites || []) {
                if (!c || typeof c.url !== 'string' || !c.url.length || !c.label || !CITATIONS[c.key]) {
                  broken.push(`${where}: ${JSON.stringify(c)}`);
                }
              }
            });
          }
        }
      }
    }
  }

  it('no dose verdict cites a source that cannot be resolved', () => {
    expect(
      broken.slice(0, 10),
      'A dose verdict in the record panel carries a citation with no working link.\n'
      + broken.slice(0, 10).join('\n')
    ).toEqual([]);
  });

  it('every [c] marker in a dose verdict has exactly one citation behind it', () => {
    expect(
      markerMismatches.slice(0, 10),
      'A dose verdict\'s [c] markers and its citation list have drifted apart. A spare '
      + 'marker renders an empty superscript; a spare citation never appears.\n'
      + markerMismatches.slice(0, 10).join('\n')
    ).toEqual([]);
  });
});
