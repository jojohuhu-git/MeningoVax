// @vitest-environment happy-dom
// UI-layer regression for P1-1 (see
// src/logic/__tests__/regression-p1-1-first-booster-clock.test.js for the engine
// coverage and the CDC/ACIP quotes).
//
// What a clinician saw: a 3-year-old with asplenia who had completed the full
// 2/4/6/12-month MenACWY series was shown "Booster (dose 5, every 5 years)"
// with the next dose dated 2029. The booster they are actually owed is the
// FIRST one, due three years after the 12-month dose — 2027.
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function show(ageMonths, dates, riskIds = ['asplenia']) {
  const doses = dates.map((d) => ({ date: d }));
  const rec = recommend({
    today: TODAY, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [],
    riskAtDoseAnswers: { MenACWY: allYes(doses.length) },
  }).menacwy[0];
  const r = render(<RecCard rec={rec} doses={doses} doseValidations={[]} />);
  // A card with no dose due today collapses by default; open it the way a
  // clinician would to read the booster reasoning underneath.
  const toggle = r.container.querySelector('.rec-card-head-toggle');
  if (toggle) toggle.click();
  return r;
}

describe('P1-1 (UI): the completed infant series shows a first booster in 2027, not 2029', () => {
  const infantSeries = ['2023-11-15', '2024-01-15', '2024-03-15', '2024-09-15'];

  it('the card calls it the first booster', () => {
    expect(show(36, infantSeries).container.textContent).toMatch(/first booster/i);
  });

  it('the card does not say "every 5 years" for this dose', () => {
    expect(show(36, infantSeries).container.textContent).not.toMatch(/Booster \(dose \d+, every 5 years\)/);
  });

  it('control: a patient already past their first booster still reads "every 5 years"', () => {
    const { container } = show(96, ['2020-09-15', '2020-11-30', '2023-12-15']);
    expect(container.textContent).toMatch(/every 5 years/i);
    expect(container.textContent).not.toMatch(/first booster/i);
  });
});
