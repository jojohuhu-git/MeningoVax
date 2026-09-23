// @vitest-environment happy-dom
// B1 · UI layer. The engine-layer twin, with the verbatim CDC quotes and the
// full history, is src/logic/__tests__/regression-b1-infant-band-edges.test.js.
//
// These patients are entered the way the Age step recommends — by DATE OF BIRTH
// — because that is what makes this reachable. A date of birth gives a real,
// fractional age, and an age between two whole months is exactly what fell
// through the crack. Before calendar P1-3 (PR #42, 2026-09-17) the app kept only
// a whole number of months, so most patients rounded past the problem; now
// almost every patient entered properly lands on a fraction.
//
// What a clinician saw:
//   - a baby born six and a half months ago: the heading "Dose 1 of 4 (infant
//     high-risk 7-11mo)" printed directly above "Start the 2-dose Menveo series
//     ... need two doses, not the four a younger infant needs". Four or two: the
//     card would not say.
//   - a baby born eleven and a half months ago: a card headed "12-23mo" telling
//     them "Both fall after the first birthday, so the 12-month age floor ... is
//     already met", five weeks before that birthday.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { patientAgeMonths } from '../../logic/patientAge.js';
import { openWhyThis } from '../../test-why-this.js';

const TODAY = '2026-09-15';

// Six months and two weeks old, and eleven months and two weeks old.
const DOB_SIX_AND_A_HALF = '2026-03-01';
const DOB_ELEVEN_AND_A_HALF = '2025-10-01';

const cardFor = (dob) => recommend({
  today: TODAY, dob, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [],
}).menacwy[0];

const show = (rec) => {
  const r = render(<RecCard rec={rec} doses={[]} doseValidations={[]} />);
  openWhyThis();
  return r;
};

describe('the ages these patients actually are', () => {
  it('sit between two whole months, which is the point', () => {
    const six = patientAgeMonths({ dob: DOB_SIX_AND_A_HALF }, TODAY);
    expect(six).toBeGreaterThan(6);
    expect(six).toBeLessThan(7);
    const eleven = patientAgeMonths({ dob: DOB_ELEVEN_AND_A_HALF }, TODAY);
    expect(eleven).toBeGreaterThan(11);
    expect(eleven).toBeLessThan(12);
  });
});

describe('the card for a baby born six and a half months ago', () => {
  it('never shows a heading and a note that disagree on how many doses', () => {
    const { container } = show(cardFor(DOB_SIX_AND_A_HALF));
    const text = container.textContent;
    const headingSaysFour = /Dose 1 of 4/.test(text);
    const noteSaysTwo = /2-dose infant MenACWY series/.test(text); // M3: brand-neutral
    expect(headingSaysFour && noteSaysTwo).toBe(false);
  });

  it('shows the younger band, which is the one CDC puts them in', () => {
    const { container } = show(cardFor(DOB_SIX_AND_A_HALF));
    expect(screen.getByText(/Dose 1 of 4 \(infant high-risk\)/)).toBeTruthy();
    expect(container.textContent).toMatch(/4-dose infant MenACWY series/); // M3: brand-neutral
    expect(container.textContent).not.toMatch(/7–11mo/);
  });
});

describe('the card for a baby born eleven and a half months ago', () => {
  it('does not claim the first birthday has already passed', () => {
    const { container } = show(cardFor(DOB_ELEVEN_AND_A_HALF));
    expect(container.textContent).not.toMatch(/already met/);
  });

  it('keeps the condition that dose 2 waits for 12 months of age', () => {
    const { container } = show(cardFor(DOB_ELEVEN_AND_A_HALF));
    expect(container.textContent).toMatch(/not before 12 months of age/);
  });
});

describe('what must NOT change', () => {
  it('a whole-numbered 9-month-old still sees the 7-11mo card', () => {
    const rec = recommend({
      today: TODAY, ageMonths: 9, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [],
    }).menacwy[0];
    const { container } = show(rec);
    expect(screen.getByText(/Dose 1 of 2 \(infant high-risk 7–11mo\)/)).toBeTruthy();
    expect(container.textContent).toMatch(/2-dose infant MenACWY series/); // M3: brand-neutral
  });

  it('a whole-numbered 14-month-old still sees the 12-23mo card', () => {
    const rec = recommend({
      today: TODAY, ageMonths: 14, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [],
    }).menacwy[0];
    const { container } = show(rec);
    expect(screen.getByText(/Dose 1 of 2 \(high-risk 12–23mo\)/)).toBeTruthy();
    expect(container.textContent).toMatch(/already met/);
  });
});
