// @vitest-environment happy-dom
// UI layer for the infant MenACWY starting-card fix. Engine-layer coverage, the
// verbatim CDC/ACIP quotes and the full history are in
// src/logic/__tests__/regression-infant-start-card-stale-text.test.js.
//
// What a clinician saw before this fix:
//   - a 9-month-old at risk: "Dose 1 of 2 + booster", with a note promising "a
//     booster at 12-23 months" - a third dose CDC does not ask for, named wrongly
//     (dose 2 is itself given at 12-23 months; the real booster is 3 years later).
//   - a 14-month-old at risk: "Dose 1 of 4" printed directly above a note reading
//     "2-dose primary". The card contradicted itself on screen.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { openWhyThis } from '../../test-why-this.js';

const TODAY = '2026-09-15';
const startCard = (ageMonths, riskIds = ['asplenia']) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: [], menbDoses: [] }).menacwy[0];

// U1 (2026-09-17): the note's supporting half is behind "Why this", and these
// assertions are about what the card says, so open it when rendering.
const show = (rec) => {
  const r = render(<RecCard rec={rec} doses={[]} doseValidations={[]} />);
  openWhyThis();
  return r;
};

describe('the 9-month-old starting card', () => {
  it('reads "Dose 1 of 2" with no "+ booster" tacked on', () => {
    show(startCard(9));
    expect(screen.getByText(/Dose 1 of 2 \(infant high-risk 7–11mo\)/)).toBeTruthy();
    expect(screen.queryByText(/\+ booster/i)).toBeNull();
  });

  it('tells the clinician the first booster is 3 years away, not at 12-23 months', () => {
    const { container } = show(startCard(9));
    // U2 (2026-09-17): the same promise, now made once -- on the card's booster
    // line rather than a second time in the note underneath it.
    expect(container.textContent).toMatch(/Boosters: first in 3 years/);
    expect(container.textContent).not.toMatch(/booster at 12–23 months/); // extinct: duplicate note-line wording removed (U2, 2026-09-17)
  });

  it('still shows both real dose-2 floors', () => {
    const { container } = show(startCard(9));
    expect(container.textContent).toMatch(/12 weeks after dose 1/);
    expect(container.textContent).toMatch(/not before 12 months of age/);
  });
});

describe('the 14-month-old starting card', () => {
  it('no longer says "of 4" above a note that says 2-dose primary', () => {
    const { container } = show(startCard(14));
    expect(screen.getByText(/Dose 1 of 2 \(high-risk 12–23mo\)/)).toBeTruthy();
    expect(container.textContent).not.toMatch(/Dose 1 of 4/);
    expect(container.textContent).toMatch(/2-dose primary/);
  });
});

describe('what must NOT change', () => {
  it('a 3-month-old still sees the 4-dose infant series', () => {
    const { container } = show(startCard(3));
    expect(screen.getByText(/Dose 1 of 4 \(infant high-risk\)/)).toBeTruthy();
    // U1 (2026-09-17): same claim, re-worded when the note split into a lead and
    // a detail (see the logic twin for the matching change).
    // M3 (2026-09-23): brand-neutral now that MenQuadfi is also offered.
    expect(container.textContent).toMatch(/4-dose infant MenACWY series/);
    expect(container.textContent).toMatch(/2, 4, 6 and 12 months/);
  });
});
