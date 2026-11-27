// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Tier 3, em dashes (OWNER DECISION, 2026-11-26, "Sentences only"; and
// "Both apps" for the date-of-birth messages). The owner's July rule D7
// (2026-07-16) took em dashes out of every sentence a clinician reads, as a
// tell of machine-written copy. Sentences written since crept back in (card
// leads, "Why this", the combined-shot dose row, the dose editor). The G1-a
// guard allows one dash a sentence, so it never saw them.
//
// What stays, on purpose (owner, same answer):
//   - the closed chip labels ("Not counted — repeat" and the rest), which she
//     approved after D7 and which PneumoVax writes the same way;
//   - a source's own words, quoted exactly (inside “ ”, and the hover/pop-up
//     text naming a document);
//   - the transplant line, frozen byte-for-byte with PneumoVax (not on this
//     screen).
//
// This renders the results screen for every test patient, every disclosure
// open (the prose tool's own rendering), takes those out, and asks for no em
// dash. It fails if a sentence like "Start the 2-dose primary series — the
// two doses at least 8 weeks apart" comes back.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { proseOf } from '../../../scripts/proseDiff.mjs';
import { buildSavedAnswerCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';
import { ageEntryProblem, MAX_PLAUSIBLE_AGE_YEARS } from '../../logic/ageEntry.js';
import { newDoseRow } from '../../logic/doseIdentity.js';

// The closed chip list (doseChipLabel.js; clinical-rules.md "One Label Per Dose").
const CHIPS = [
  /No date recorded — not counted/g,
  /Date is in the future — not counted/g,
  /Entered twice — this row not counted/g,
  /Dated before birth — not counted/g,
  /Not counted — (?:given before age \d+|Extra\. Do not repeat\.|do not repeat|repeat)/g,
];

/** The words a clinician reads, minus chip labels, quotes and hover text. */
export function sentencesWithEmDash(prose) {
  let t = prose.replace(/\{hover: [^}]*\}/g, ' ').replace(/“[^”]*”/g, ' ');
  for (const c of CHIPS) t = t.replace(c, ' ');
  return [...t.matchAll(/.{0,80}—.{0,60}/g)].map((m) => m[0]);
}

function sweep(cases) {
  const found = [];
  for (const c of cases) {
    for (const s of sentencesWithEmDash(proseOf(c.input))) found.push(`${c.key}: ${s}`);
  }
  return found;
}

describe('Tier 3: no em dash in a sentence on the results screen', () => {
  it('the saved-answer grid', () => {
    const cases = buildSavedAnswerCases();
    expect(cases.length).toBeGreaterThan(20_000);
    expect(sweep(cases).slice(0, 10)).toEqual([]);
  }, 600_000);

  it('the impossible entries', () => {
    expect(sweep(buildRecordProblemCases()).slice(0, 10)).toEqual([]);
  }, 600_000);

  it('the typical patients', () => {
    expect(sweep(buildTypicalCases()).slice(0, 10)).toEqual([]);
  }, 600_000);

  it('the helper keeps a chip label and a quote, and catches a sentence', () => {
    expect(sentencesWithEmDash('Not counted — repeat Minimum age not met. “a — b”')).toEqual([]);
    expect(sentencesWithEmDash('Start the series — two doses')).toHaveLength(1);
  });
});

describe('Tier 3: no em dash in the dose editor or the age step', () => {
  function Harness({ initial }) {
    const [state, setState] = useState(initial);
    return <Results state={state} onChange={(p) => setState((s) => ({ ...s, ...p }))} onReset={() => {}} />;
  }
  const base = (o) => ({ ageMonths: 204, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: { MenACWY: {}, MenB: {} }, ...o });

  it('a dose dated in the future: "Check the date. If the patient …"', () => {
    render(<Harness initial={base({ menbDoses: [newDoseRow({ date: '2027-05-01' })] })} />);
    fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));
    const flag = screen.getByTestId('dose-date-in-future').textContent.replace(/\s+/g, ' ');
    expect(flag).not.toMatch(/—/);
    expect(flag).toMatch(/Check the date\. If the patient has not had this dose yet, leave it out\./);
  });

  it('the date-of-birth messages (same code as PneumoVax\'s ageEntry.js)', () => {
    const future = ageEntryProblem({ mode: 'dob', dob: '2030-01-01', today: '2026-09-15' });
    expect(future).toBe('That date of birth is in the future. Check the year. If it is a typo, correct it.');
    const old = ageEntryProblem({ mode: 'dob', dob: '0026-01-01', today: '2026-09-15' });
    expect(old).toBe(`That date of birth would make the patient over ${MAX_PLAUSIBLE_AGE_YEARS} years old. Check the year: a two-digit year such as 26 is read as the year 26, not 2026.`);
  });
});
