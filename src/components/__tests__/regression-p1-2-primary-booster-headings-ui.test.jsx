// @vitest-environment happy-dom
// UI-layer regression for P1-2 — the originally reported bug. See
// src/logic/__tests__/regression-p1-2-engine-validator-agree-on-primary-total.test.js
// for the engine/validator coverage and the CDC quote.
//
// What was on screen for an 8-year-old with asplenia and five MenACWY doses:
//
//   PRIMARY SERIES   D1 "Dose 1 of 2", D2 "Dose 2 of 2"
//   BOOSTERS         D3 "Booster", D4 "Booster", D5 "Booster"
//
// D1-D4 are the primary series (dose 1 at 2 months = four doses, at 2, 4, 6 and
// 12 months). Only D5 is a booster. The headings were splitting after D2
// because the card carried a primary total of 2 while the validator, grading
// the very same doses, was using 4.
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const DATES = ['2018-11-15', '2019-01-15', '2019-03-15', '2019-09-15', '2022-09-15'];

function show() {
  const doses = DATES.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  const rec = recommend({
    today: TODAY, ageMonths: 96, riskIds: ['asplenia'],
    menacwyDoses: doses, menbDoses: [], riskAtDoseAnswers: { MenACWY: answers },
  }).menacwy[0];
  const perDose = analyzeHistory('MenACWY', doses, 96, ['asplenia'], TODAY, answers).perDose;
  return render(<RecCard rec={rec} doses={doses} doseValidations={perDose} ageMonths={96} today={TODAY} />);
}

describe('P1-2 (UI): four infant doses sit under "Primary series", one booster under "Boosters"', () => {
  it('the list is: heading, four doses, heading, one dose — in that DOM order', () => {
    const { container } = show();
    const items = [...container.querySelectorAll('.rec-progress-group, .rec-progress-dose-row')]
      .map((el) => (el.classList.contains('rec-progress-group') ? el.textContent.trim() : 'dose'));
    expect(items).toEqual([
      'Primary series', 'dose', 'dose', 'dose', 'dose',
      'Boosters', 'dose',
    ]);
  });

  it('the four primary doses are numbered against 4', () => {
    const { container } = show();
    expect(container.textContent).toMatch(/Dose 1 of 4/);
    expect(container.textContent).toMatch(/Dose 4 of 4/);
    expect(container.textContent).not.toMatch(/Dose \d of 2/);
  });

  it('no dose of this correctly vaccinated child is called an extra dose', () => {
    expect(show().container.textContent).not.toMatch(/Extra dose/i);
  });
});
