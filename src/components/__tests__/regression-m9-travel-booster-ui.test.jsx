// @vitest-environment happy-dom
// UI-layer regression for M9 (see
// src/logic/__tests__/regression-m9-travel-boosters.test.js for the engine-layer
// coverage, the ACIP Table 9 quote, and the full rationale).
//
// A traveler vaccinated before age 7 must SEE that their first booster is due 3
// years after the primary dose, not 5. Before M9 the card read "Booster (dose 2,
// every 5 years)" for every traveler regardless of the age at their primary dose.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { openWhyThis } from '../../test-why-this.js';

const TODAY = '2026-09-15';
const acwyRec = (ageMonths, riskIds, dates) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [] }).menacwy[0];

describe('M9 (UI): the travel booster card names the real interval', () => {
  it('a traveler vaccinated at age 3 sees a 3-year first booster', () => {
    const rec = acwyRec(77, ['travel'], ['2023-09-15']);
    render(<RecCard rec={rec} doses={[{ date: '2023-09-15', brand: '' }]} doseValidations={[{ status: 'valid', reasons: [] }]} />);
    expect(screen.getByText(/Booster \(dose 2, first booster, 3 years after the primary dose\)/)).toBeTruthy();
    // U1 (2026-09-17): the lead states the interval; WHY it is 3 years and not
    // 5 is the detail, behind "Why this".
    expect(screen.getByText(/first booster is due 3 years after the primary dose/)).toBeTruthy();
    openWhyThis();
    expect(screen.getByText(/primary dose was given before the 7th birthday/)).toBeTruthy();
  });

  it('a traveler vaccinated at age 8 sees a 5-year first booster instead', () => {
    const rec = acwyRec(156, ['travel'], ['2021-09-15']);
    render(<RecCard rec={rec} doses={[{ date: '2021-09-15', brand: '' }]} doseValidations={[{ status: 'valid', reasons: [] }]} />);
    expect(screen.getByText(/first booster, 5 years after the primary dose/)).toBeTruthy();
  });
});
