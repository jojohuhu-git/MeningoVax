// @vitest-environment happy-dom
// Port Phase 6.3, Q10 (owner, 2026-11-19): the result page folds, as PneumoVax's
// does (its §WORD-1). Answers, in docs/archive/report-2026-11-19-result-page-fold.md:
//   Q10 "Full PneumoVax fold"; the stay-in-view list "Yes, that list";
//   Sources inside "Why this" and the disclaimer's risk-history paragraph behind
//   "About risk history": "Yes, both".
//
// The fold MOVES sentences; it never writes, drops or re-cites one. Every number
// and date here is the engine's own (src/logic/recommend.js), read through the
// saved-answer grid (src/test-grid.js).
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { recommend, recommendBeforeFold } from '../../logic/recommend.js';
import { STAY_IN_VIEW, sentencesOf, staysInView } from '../../logic/noteFold.js';
import { buildSavedAnswerCases, buildRecordProblemCases } from '../../test-grid.js';
import Results from '../Results.jsx';
import RecCard from '../RecCard.jsx';

const saved = buildSavedAnswerCases();
const byKey = (key) => {
  const c = saved.find((x) => x.key === key);
  if (!c) throw new Error(`no saved patient ${key}`);
  return c.input;
};
const sorted = (a) => [...a].sort();
const sentencesOfNote = (n) => (n && typeof n === 'object' ? [...sentencesOf(n.lead), ...sentencesOf(n.detail)] : []);
const citeKeys = (card) => sorted((card.noteCites ?? []).map((c) => c.key));
const NEUTRAL = new Set(['complete', 'not-indicated', 'deferred']);

describe('Q10 worked patient: a card line that repeats its heading goes behind "Why this"', () => {
  // 11 years, complement deficiency, MenQuadfi 1 year ago.
  const input = byKey('a132|r:complement|A:MenQuadfi@365|B:');
  it('before the fold the engine writes it as the in-view line', () => {
    const c = recommendBeforeFold(input).menacwy[0];
    expect(c.doseLabel).toBe('Dose 2 of 2 (high-risk primary series)');
    expect(c.note.lead).toBe('Dose 2, at least 8 weeks after dose 1.');   // P45 (review v10)
  });
  it('after the fold nothing is in view under the heading; the line opens first in "Why this"', () => {
    const c = recommend(input).menacwy[0];
    expect(c.doseLabel).toBe('Dose 2 of 2 (high-risk primary series)');
    expect(c.note.lead).toBe('');
    expect(c.note.detail.startsWith('Dose 2, at least 8 weeks after dose 1.')).toBe(true);
  });
});

describe('Q10 stay-in-view list: each line the owner kept stays in view', () => {
  it('the Trumenba switch', () => {
    const c = recommend(byKey('a228|r:complement|A:Penbraya@330|B:Bexsero@365')).menb[0];
    expect(c.note.lead).toMatch(/^Or complete the series with Trumenba: dose 2 today/);
  });
  it('the minimum beside a routine date (STOP F1)', () => {
    const c = recommend({
      dob: '2006-01-01', riskIds: ['asplenia'], today: '2026-11-17',
      menacwyDoses: [], menbDoses: [{ date: '2026-11-03', brand: 'Bexsero (MenB)' }],
    }).menb[0];
    expect(c.note.lead).toBe('Earliest valid date: Dec 1, 2026 (minimum interval 4 weeks).');
    expect(c.note.detail.startsWith('Give dose 2 1–2 months after dose 1, with the same MenB product')).toBe(true);
  });
  it('"once 8 weeks have passed since that dose"', () => {
    const c = recommend(byKey('a192|r:microbiologist|A:MenQuadfi@40|B:')).menacwy[0];
    expect(c.note.lead).toMatch(/^It can be given once 8 weeks have passed since that dose \[c\]\.$/);
  });
  it('"Not before <date> … which did not count"', () => {
    const c = recommend(byKey('a2|r:complement|A:MenQuadfi@40|B:')).menacwy[0];
    expect(c.note.lead).toMatch(/^Not before \w{3} \d{1,2}, \d{4}: 8 weeks after the invalid dose of .*\.$/);
  });
  it('the pentavalent card\'s line is never folded', () => {
    const input = saved.map((x) => x.input).find((i) => recommend(i).pentavalent?.eligible);
    expect(recommend(input).pentavalent).toEqual(recommendBeforeFold(input).pentavalent);
  });
  it('the list is the owner\'s four card rules, each with its reason', () => {
    expect(STAY_IN_VIEW).toHaveLength(4);
    for (const r of STAY_IN_VIEW) expect(r.why.length).toBeGreaterThan(10);
  });
});

describe('Q10 over every saved patient: the fold only moves sentences', () => {
  for (const [name, cases] of [['saved-answer grid', saved], ['impossible entries', buildRecordProblemCases()]]) {
    it(name, () => {
      let folded = 0;
      const problems = [];
      for (const { key, input } of cases) {
        const before = recommendBeforeFold(input);
        const after = recommend(input);
        if (before.excluded) { expect(after).toEqual(before); continue; }
        expect(after.pentavalent).toEqual(before.pentavalent);
        expect(after.history).toEqual(before.history);
        for (const fam of ['menacwy', 'menb']) {
          (before[fam] ?? []).forEach((b, i) => {
            const a = after[fam][i];
            const { note: _bn, noteCites: _bc, ...bRest } = b;
            const { note: _an, noteCites: _ac, ...aRest } = a;
            if (JSON.stringify(aRest) !== JSON.stringify(bRest)) problems.push(`${key} ${fam}[${i}]: something besides the note changed`);
            if (JSON.stringify(sorted(sentencesOfNote(a.note))) !== JSON.stringify(sorted(sentencesOfNote(b.note)))) problems.push(`${key} ${fam}[${i}]: a sentence was lost or added`);
            if (JSON.stringify(citeKeys(a)) !== JSON.stringify(citeKeys(b))) problems.push(`${key} ${fam}[${i}]: a citation was lost or added`);
            if (NEUTRAL.has(b.status) && !b.boosterDueDate && JSON.stringify(a) !== JSON.stringify(b)) problems.push(`${key} ${fam}[${i}]: a card shut by default was folded`);
            if (a.note && typeof a.note === 'object') {
              for (const s of sentencesOf(a.note.lead)) {
                if (!NEUTRAL.has(a.status) && !staysInView(s)) problems.push(`${key} ${fam}[${i}]: in view but not on the list — ${s}`);
              }
              if (a.note.lead !== b.note.lead) folded += 1;
            }
          });
        }
      }
      expect(problems.slice(0, 10)).toEqual([]);
      if (name === 'saved-answer grid') expect(folded).toBeGreaterThan(20_000);
    }, 300_000);
  }
});

describe('Q10 on the screen: sources inside "Why this", disclaimer paragraph behind a click', () => {
  const input = byKey('a132|r:complement|A:MenQuadfi@365|B:');
  const draw = () => render(
    <Results
      state={{ ageMonths: input.ageMonths, dob: input.dob, riskIds: input.riskIds, menacwyDoses: input.menacwyDoses, menbDoses: input.menbDoses, riskAtDoseAnswers: input.riskAtDoseAnswers }}
      today={input.today} onReset={() => {}} onChange={() => {}} onBack={() => {}}
    />,
  );

  it('no source button and no folded line shows until "Why this" is opened', () => {
    const { container } = draw();
    expect(container.querySelectorAll('.citation-chip')).toHaveLength(0);
    expect(screen.queryByText(/Dose 2, at least 8 weeks after dose 1/)).toBeNull();
    for (const t of screen.getAllByTestId('rec-note-toggle')) fireEvent.click(t);
    expect(container.querySelectorAll('.rec-note-detail .citation-chip').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.citation-chip').length)
      .toBe(container.querySelectorAll('.rec-note-detail .citation-chip').length);
    expect(screen.getByText(/Dose 2, at least 8 weeks after dose 1/)).toBeTruthy();
  });

  it('the disclaimer keeps its first half in view; the risk-history paragraph opens on "About risk history"', () => {
    draw();
    expect(screen.getByText(/not a substitute for clinical judgment/)).toBeTruthy();   // P71 (review v10)
    // L7 (review v10): the risk-history sentence left the disclaimer for the "Needs input" question.
    expect(screen.queryByText(/records current risk only/)).toBeNull();
    expect(screen.queryByTestId('disclaimer-toggle')).toBeNull();
  });

  it('a card with sources and no explanation titles its toggle "Sources" (PneumoVax, 2026-11-07)', () => {
    let rec = null;
    for (const { input: i } of saved) {
      rec = [...recommend(i).menacwy, ...recommend(i).menb].find((c) => (c.citations ?? []).length > 0 && !(c.note && c.note.detail));
      if (rec) break;
    }
    expect(rec).not.toBeNull();
    render(<RecCard rec={rec} doses={[]} doseValidations={[]} />);
    expect(screen.getByTestId('rec-note-toggle').textContent).toMatch(/^Sources/);
  });
});
