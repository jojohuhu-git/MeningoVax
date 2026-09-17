// @vitest-environment happy-dom
// UI-layer regression for P0-5 (see
// src/logic/__tests__/regression-p0-5-menacwy-booster-anniversary.test.js for
// the engine coverage and the CDC quote).
//
// What a clinician saw: a 10-year-old with asplenia whose first MenACWY booster
// was given on its exact three-year anniversary. The dose was chipped invalid —
// "too soon and does not count... repeat this dose only" — and the card
// re-offered the same booster as due today. Dated one day later it counted.
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const ON_TIME = ['2020-11-15', '2021-01-15', '2024-01-15']; // booster 1095 days after D2

function show(dates, ageMonths = 120) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  const rec = recommend({
    today: TODAY, ageMonths, riskIds: ['asplenia'], menacwyDoses: doses, menbDoses: [],
    riskAtDoseAnswers: { MenACWY: answers },
  }).menacwy[0];
  const perDose = analyzeHistory('MenACWY', doses, ageMonths, ['asplenia'], TODAY, answers).perDose;
  const { container } = render(
    <RecCard rec={rec} doses={doses} doseValidations={perDose} ageMonths={ageMonths} today={TODAY} />,
  );
  const toggle = container.querySelector('.rec-card-head-toggle');
  if (toggle) fireEvent.click(toggle);
  const chips = [...container.querySelectorAll('.dose-val-chip')].map((e) => e.textContent);
  expect(chips.length).toBe(dates.length); // guard against a vacuous pass
  return { rec, chips, container };
}

describe('P0-5 (UI): a booster on its three-year anniversary is not sent back', () => {
  it('the booster is not chipped Invalid', () => {
    expect(show(ON_TIME).chips).toEqual(['Dose 1 of 2', 'Dose 2 of 2', 'Booster']);
  });

  it('the card does not tell the clinician to repeat it today', () => {
    const { rec, container } = show(ON_TIME);
    expect(rec.dueToday).toBeFalsy();
    expect(container.textContent).not.toMatch(/too soon/i);
    expect(container.textContent).not.toMatch(/does not count/i);
  });

  it('the next dose is dated on the anniversary, not a day either side', () => {
    expect(show(ON_TIME).rec.earliestNextDate).toBe('2029-01-15');
  });

  // P1-1 (2026-09-17): one day early now COUNTS (CDC's 4-day grace), so the
  // control moved to five days — the first genuinely too-soon value.
  it('control: a booster five days early is still sent back', () => {
    const { container } = show(['2020-11-15', '2021-01-15', '2024-01-10']);
    expect(container.textContent).toMatch(/too soon/i);
  });
});
