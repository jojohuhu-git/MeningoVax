// G1-a (OWNER DECISION, STOP G1, 2026-11-18): every line beside a recorded
// dose, every card lead and every "Why this" follows PneumoVax's ten style
// rules (stop-g1-packet-2026-11-18.md §1). She chose "Yes, the rules", not
// sentence by sentence; every before/after went into the pull request.
//
// This sweeps every test patient — the saved-answer grid, the impossible
// entries and the typical patients — and checks the parts of those rules a
// machine can see, as PneumoVax's two guards do
// (regression-why-this-2026-11-08-card-paragraphs-follow-the-style-rules and
// regression-dose-labels-2026-11-08-every-dose-has-one-label):
//   rule 4  one idea per sentence: no semicolon, at most one dash
//   rule 5  no arguing: no "either way", no "does not change"
//   rule 6  the line does not repeat its label ("Not counted — repeat" is the
//           chip's, so "This dose does not count …: repeat this dose only" went)
//   rule 8  plain terms: "about", never "~"
//   rule 3  (behind "Why this" and on cards) talk about the patient, not the
//           document: no "worded", "footnote", "prints"
// and holds each surface to its longest on 2026-11-19, so a rise needs a
// reason. Rules 1, 2, 7, 9 and 10 need a reader.
//
// "row" is allowed on a dose line: there it means the patient's record row
// ("Same date as an earlier row"), PneumoVax's own words for the same entry.
import { describe, it, expect } from 'vitest';
// Q10 fold (2026-11-19): this file pins how a sentence is WRITTEN, so it reads the
// note before the fold; where it shows is regression-2026-11-19-q10-result-page-fold.
import { recommendBeforeFold as recommend } from '../recommend.js';
import { buildSavedAnswerCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';

// Longest on 2026-11-19, after the rewrite (before: 73, 74).
// Dose line: a duplicate entry naming two brands (four short sentences).
const MAX_LINE_WORDS = 50;
// "Why this" on a card: the healthy 16–23-year-old's MenB card.
const MAX_WHY_WORDS = 66;

const words = (s) => (s ?? '').replace(/\[c\]/g, '').split(/\s+/).filter(Boolean).length;
const sentencesOf = (t) => (t ?? '').replace(/\s+/g, ' ').trim()
  .split(/(?<=[.?!])\s+(?=[A-Z"(*])|(?<=\[c\])\s+(?=[A-Z])/).filter(Boolean);

const EVERYWHERE = [
  ['rule 4: semicolon', /;/],
  ['rule 5: arguing', /either way|does not change/i],
  ['rule 8: "~"', /~/],
];
const REPEATS_THE_LABEL = /This dose does not count|repeat this dose only|does not count toward the series|too soon and does not count|^Counted —|\*\*Counted|Dose is accepted/i;
const TALKS_ABOUT_THE_DOCUMENT = /\bworded\b|\bfootnote\b|\bprints?\b/i;

export function styleProblems(cases) {
  const problems = [];
  let lines = 0;
  let whys = 0;
  for (const c of cases) {
    const r = recommend(c.input);
    const say = (where, why, text) => problems.push(`${c.key}: ${where}: ${why} — ${String(text).slice(0, 160)}`);
    const check = (where, text, { doc = false } = {}) => {
      for (const s of sentencesOf(text)) {
        for (const [why, re] of EVERYWHERE) if (re.test(s)) say(where, why, s);
        if ((s.match(/—/g) ?? []).length > 1) say(where, 'rule 4: more than one dash', s);
        if (doc && TALKS_ABOUT_THE_DOCUMENT.test(s)) say(where, 'rule 3: talks about the document', s);
      }
    };
    for (const [family, h] of Object.entries(r.history ?? {})) {
      for (const d of h?.perDose ?? []) {
        const line = (d.reasons ?? []).join(' ');
        lines += 1;
        check(`${family} dose line`, line);
        if (REPEATS_THE_LABEL.test(line)) say(`${family} dose line`, 'rule 6: repeats the label', line);
        if (words(line) > MAX_LINE_WORDS) say(`${family} dose line`, `longer than ${MAX_LINE_WORDS} words`, line);
        check(`${family} dose "Why this"`, [...(d.whys ?? []), d.detail].filter(Boolean).join(' '), { doc: true });
      }
    }
    for (const card of [...(r.menacwy ?? []), ...(r.menb ?? []), ...[].concat(r.pentavalent ?? [])]) {
      if (!card) continue;
      const note = card.note && typeof card.note === 'object' ? card.note : { lead: card.note, detail: null };
      check(`${card.vaccine} card lead`, [note.lead, card.boosterSummary, card.repeatLater?.line].filter(Boolean).join(' '), { doc: true });
      if (!note.detail) continue;
      whys += 1;
      check(`${card.vaccine} card "Why this"`, note.detail, { doc: true });
      if (words(note.detail) > MAX_WHY_WORDS) say(`${card.vaccine} card "Why this"`, `longer than ${MAX_WHY_WORDS} words`, note.detail);
    }
    const ra = r.riskAgeNote;
    if (ra) check('risk-age note', typeof ra === 'string' ? ra : [ra.lead, ra.detail].filter(Boolean).join(' '), { doc: true });
  }
  return { problems, lines, whys };
}

describe('G1-a — every sentence beside a dose and on a card follows the style rules a machine can check', () => {
  it('the saved-answer grid', () => {
    const { problems, lines, whys } = styleProblems(buildSavedAnswerCases());
    expect(problems.slice(0, 10)).toEqual([]);
    expect(lines).toBeGreaterThan(10_000);
    expect(whys).toBeGreaterThan(10_000);
  }, 300_000);

  it('the impossible entries', () => {
    const { problems, lines } = styleProblems(buildRecordProblemCases());
    expect(problems.slice(0, 10)).toEqual([]);
    expect(lines).toBeGreaterThan(1_000);
  }, 300_000);

  it('the typical patients', () => {
    const { problems, whys } = styleProblems(buildTypicalCases());
    expect(problems.slice(0, 10)).toEqual([]);
    expect(whys).toBeGreaterThan(1_000);
  }, 300_000);

  // Three of the five samples she was shown, on patients built by hand, so
  // their words are read here and not only swept above (packet L3, L4, L5).
  it('L3: complement deficiency, Bexsero at 9 — the too-young line, as PneumoVax words it', () => {
    const r = recommend({ today: '2026-09-15', dob: '2016-03-01', riskIds: ['complement'], menacwyDoses: [], menbDoses: [{ date: '2025-03-15', brand: 'Bexsero (MenB)' }] });
    expect(r.history.MenB.perDose[0].reasons[0]).toBe('Minimum age not met (10 years for Bexsero). [c]')   // P61 (review v10);
  });

  it('L4: healthy baby, MenQuadfi at 5 months — the adolescent series still starts at 11–12', () => {
    const r = recommend({ today: '2026-09-15', dob: '2026-02-01', riskIds: [], menacwyDoses: [{ date: '2026-07-01', brand: 'MenQuadfi (MenACWY)' }], menbDoses: [] });
    expect(r.history.MenACWY.perDose[0].reasons[0]).toBe('Given at about 5 months. The adolescent series still starts at 11–12 years. [c]');
  });

  it('L5: healthy 19-year-old, Trumenba 4 months apart — no "rescue", the label is not repeated', () => {
    const r = recommend({ today: '2026-09-15', dob: '2007-03-01', riskIds: [], menacwyDoses: [], menbDoses: [{ date: '2026-01-10', brand: 'Trumenba (MenB)' }, { date: '2026-05-10', brand: 'Trumenba (MenB)' }] });
    expect(r.history.MenB.perDose[1].reasons).toEqual(['Given about 4 months after dose 1 (6 recommended). It counts. Dose 3 is due ≥4 months later.'])   // P58 (review v10)
  });
});
