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

const TODAY = '2026-09-15';
const startCard = (ageMonths, riskIds = ['asplenia']) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: [], menbDoses: [] }).menacwy[0];

const show = (rec) => render(<RecCard rec={rec} doses={[]} doseValidations={[]} />);

describe('the 9-month-old starting card', () => {
  it('reads "Dose 1 of 2" with no "+ booster" tacked on', () => {
    show(startCard(9));
    expect(screen.getByText(/Dose 1 of 2 \(infant high-risk 7–11mo\)/)).toBeTruthy();
    expect(screen.queryByText(/\+ booster/i)).toBeNull();
  });

  it('tells the clinician the first booster is 3 years away, not at 12-23 months', () => {
    const { container } = show(startCard(9));
    expect(container.textContent).toMatch(/first booster in 3 years/);
    expect(container.textContent).not.toMatch(/booster at 12–23 months/);
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
    expect(container.textContent).toMatch(/4-dose Menveo series at 2, 4, 6, and 12 months/);
  });
});
