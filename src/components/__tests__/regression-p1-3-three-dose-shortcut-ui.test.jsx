// @vitest-environment happy-dom
// UI-layer regression for P1-3 (see
// src/logic/__tests__/regression-p1-3-three-dose-shortcut.test.js for the
// engine coverage and the verbatim CDC quotes).
//
// What a clinician saw: a baby with asplenia, dose 1 at 4 months and dose 2 at
// 8 months. At 10 months the card said "Dose 3 of 3 (infant high-risk, 3-dose
// shortcut)". They gave that dose. At 18 months the card said "Dose 4 (infant
// high-risk series)", due today. The app promised one number and then asked for
// another.
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';

const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function show(today, ageMonths, dates) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  const rec = recommend({
    today, ageMonths, riskIds: ['asplenia'], menacwyDoses: doses, menbDoses: [],
    riskAtDoseAnswers: { MenACWY: answers },
  }).menacwy[0];
  const perDose = analyzeHistory('MenACWY', doses, ageMonths, ['asplenia'], today, answers).perDose;
  const { container } = render(
    <RecCard rec={rec} doses={doses} doseValidations={perDose} ageMonths={ageMonths} today={today} />,
  );
  const toggle = container.querySelector('.rec-card-head-toggle');
  if (toggle) fireEvent.click(toggle);
  const chips = [...container.querySelectorAll('.dose-val-chip')].map((e) => e.textContent);
  expect(chips.length).toBe(dates.length); // guard against a vacuous pass
  return { rec, chips, container };
}

const D1_4MO = '2025-10-15';
const D2_8MO = '2026-02-15';
const D3_12MO = '2026-06-15';

describe('P1-3 (UI): a shortcut series that says 3 finishes at 3', () => {
  it('at 10 months the card offers dose 3 of 3', () => {
    expect(show('2026-04-15', 10, [D1_4MO, D2_8MO]).container.textContent)
      .toMatch(/Dose 3 of 3/);
  });

  it('after the third dose the card no longer asks for a fourth', () => {
    const { container } = show('2026-12-15', 18, [D1_4MO, D2_8MO, D3_12MO]);
    expect(container.textContent).not.toMatch(/Dose 4/);
    expect(container.textContent).toMatch(/first booster/i);
  });

  it('all three recorded doses count against 3', () => {
    expect(show('2026-12-15', 18, [D1_4MO, D2_8MO, D3_12MO]).chips)
      .toEqual(['Dose 1 of 3', 'Dose 2 of 3', 'Dose 3 of 3']);
  });
});

describe('P1-3 (UI): a 2-month start keeps all four doses', () => {
  it('the card says 4, and the shortcut is not offered', () => {
    const { container } = show('2026-04-15', 10, ['2025-08-15', '2026-02-15']);
    expect(container.textContent).not.toMatch(/shortcut/i);
    expect(container.textContent).toMatch(/Dose 1 of 4/);
  });
});

describe('P1-3 (UI): a third dose given too early is sent back', () => {
  it('it is chipped Invalid and the card still asks for dose 3', () => {
    // Given at ~10.5 months — before the first birthday.
    const { container } = show('2026-12-15', 18, [D1_4MO, D2_8MO, '2026-05-01']);
    expect(container.textContent).toMatch(/after age 12 months/i);
    expect(container.textContent).toMatch(/Dose 3 of 3/);
  });
});
