// @vitest-environment happy-dom
// impossible P1-2 · UI layer. The engine-layer twin, with the verbatim ACIP
// table quotes and the full "must never be questioned" list, is
// src/logic/__tests__/regression-imp-p1-2-implausible-risk-age.test.js.
//
// What a clinician saw: a NEWBORN ticked as a "First-year college student
// living in a residence hall" got a card reading "1 dose", due today, with no
// product listed at all — and nothing anywhere on the screen suggesting the
// tick might be wrong.
//
// Owner decision 2026-09-17, reconfirmed 2026-09-18: a quiet note, NEVER a
// block. So these tests assert BOTH halves — that the note appears, and that
// the recommendation underneath it is completely untouched.
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

const TODAY = '2026-09-18';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={patch => setState(s => ({ ...s, ...patch }))}
      onReset={() => {}}
    />
  );
}

const show = (riskIds, dob) => {
  render(<Harness initial={{ dob, today: TODAY, riskIds, menacwyDoses: [], menbDoses: [] }} />);
};

const note = () => screen.queryByTestId('risk-age-note');

const DOB_NEWBORN = '2026-09-18';
const DOB_3_YEARS = '2023-09-18';
const DOB_16_YEARS = '2010-09-18';

describe('imp P1-2 UI: the note a clinician actually sees', () => {
  it('shows the note for a newborn ticked as a first-year college student', () => {
    show(['college_dorm'], DOB_NEWBORN);
    const n = note();
    expect(n).toBeTruthy();
    expect(n.textContent).toContain('First-year college student living in a residence hall');
    expect(n.textContent).toContain('10 years and over');
    // The age reads as a sentence, not jammed onto the rule: the first live
    // run of this printed "and this patient is Birth."
    expect(n.textContent).toContain("This patient's age is recorded as Birth.");
    expect(n.textContent).not.toContain('is Birth,');
  });

  it('still shows the recommendation — nothing is blocked or withheld', () => {
    show(['college_dorm'], DOB_NEWBORN);
    expect(note()).toBeTruthy();
    // The card that provoked the queue item is still there, still saying the
    // same thing. This assertion is the owner's decision in test form.
    expect(
      screen.getByText(/A single MenACWY dose for a first-year college student/i),
    ).toBeTruthy();
  });

  it('says plainly that nothing has changed', () => {
    show(['military'], DOB_3_YEARS);
    expect(note().textContent).toContain('Nothing has been withheld and no recommendation has changed');
    expect(note().textContent).toContain('Check that the age and the tick-boxes are both right');
  });

  it('links the ACIP table the note rests on', () => {
    show(['microbiologist'], DOB_3_YEARS);
    const link = note().querySelector('a.note-cite');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('rr6909a1');
    expect(link.getAttribute('title')).toContain('Table 7');
  });

  it('shows pregnancy\'s note with no citation, because none exists', () => {
    show(['pregnancy'], DOB_3_YEARS);
    const n = note();
    expect(n.textContent).toContain('Pregnancy');
    expect(n.querySelector('a.note-cite')).toBeNull();
  });

  it('shows no note at a plausible age', () => {
    show(['college_dorm'], DOB_16_YEARS);
    expect(note()).toBeNull();
  });

  it('shows no note for an infant with asplenia, who genuinely has it', () => {
    show(['asplenia'], DOB_NEWBORN);
    expect(note()).toBeNull();
  });

  it('shows no note for an infant travelling to the meningitis belt', () => {
    show(['travel'], DOB_NEWBORN);
    expect(note()).toBeNull();
  });

  it('is not a "Why this" disclosure — the doubt is readable without a click', () => {
    show(['military'], DOB_NEWBORN);
    expect(note().querySelector('[data-testid="rec-note-toggle"]')).toBeNull();
  });

  it('stays out of the way of the hard stop', () => {
    show(['hct_cart_bcell_exclude', 'military'], DOB_NEWBORN);
    expect(screen.getByTestId('exclusion-stop')).toBeTruthy();
    expect(note()).toBeNull();
  });
});
