// @vitest-environment happy-dom
// P1-4 (fix queue 2026-09-15) — owner decision, 2026-09-15.
//
// Reproduced live: the P1-2 patient (DOB 2018-09-15, asplenia, five MenACWY
// doses on record) BEFORE answering any of the five risk-timing prompts.
//   headline     "Due today: MenACWY."
//   status pill  "Dose due today, future boosters needed"
//   card         "Dose 1 of 2 (high-risk primary series)"
// — for a child with five doses on record. The five "Needs input" prompts sat
// further down the page. A clinician acting on the headline vaccinates an
// already fully vaccinated child.
//
// The conservative MATHS is right and is untouched: a dose whose risk-timing
// answer is unknown does not count (2026-07-23 decision). What was wrong is
// presenting that provisional figure as a confident recommendation. This
// narrows the presentation only.
//
// The questions live INSIDE the recommendation card, in the recorded-dose
// list, so the card is not hidden — only the parts that assert an answer: the
// status pill, the dose label and the brand list. Hiding the card would hide
// the very questions the clinician is being asked to answer, which is why
// these tests check that the prompts are still there.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard, { hasPendingDoses } from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';

const TODAY = '2026-09-15';
const DATES = ['2018-11-15', '2019-01-15', '2019-03-15', '2019-09-15', '2022-09-15'];

// No riskAtDoseAnswers at all — every dose is pending.
function showUnanswered() {
  const doses = DATES.map((d) => ({ date: d }));
  const rec = recommend({
    today: TODAY, ageMonths: 96, riskIds: ['asplenia'],
    menacwyDoses: doses, menbDoses: [],
  }).menacwy[0];
  const perDose = analyzeHistory('MenACWY', doses, 96, ['asplenia'], TODAY).perDose;
  return { rec, perDose, ...render(
    <RecCard rec={rec} doses={doses} doseValidations={perDose} ageMonths={96} today={TODAY} />,
  ) };
}

describe('P1-4: the fixture really is pending', () => {
  it('all five doses are waiting on an answer', () => {
    const { perDose } = showUnanswered();
    expect(perDose.filter((d) => d.status === 'pending')).toHaveLength(5);
    expect(hasPendingDoses(perDose)).toBe(true);
  });

  it('the engine still computes its conservative answer underneath', () => {
    // The maths is unchanged — this is a presentation fix, not a logic one.
    expect(showUnanswered().rec.dueToday).toBe(true);
  });
});

describe('P1-4: the card makes no recommendation while answers are outstanding', () => {
  it('it does not claim a dose is due today', () => {
    const { container } = showUnanswered();
    expect(container.textContent).not.toMatch(/Dose due today/);
    expect(container.textContent).not.toMatch(/due today, future boosters needed/i);
  });

  it('it does not print a dose label like "Dose 1 of 2"', () => {
    expect(showUnanswered().container.textContent).not.toMatch(/Dose 1 of 2 \(high-risk/);
  });

  it('it asks for the answers instead', () => {
    const { container } = showUnanswered();
    expect(screen.getByTestId('rec-awaiting-input')).toBeTruthy();
    expect(container.textContent).toMatch(/Answer the question on each recorded dose below/i);
  });

  it('the status pill says answers are needed', () => {
    expect(showUnanswered().container.querySelector('.status-badge').textContent)
      .toBe('Answers needed');
  });

  it('it does not offer brands to give today', () => {
    expect(showUnanswered().container.querySelector('.rec-brands')).toBeNull();
  });

  it('the card is not painted as an act-now card', () => {
    const card = showUnanswered().container.querySelector('.rec-card');
    expect(card.className).not.toMatch(/due/);
  });
});

describe('P1-4: but the questions themselves are still right there', () => {
  it('all five prompts render', () => {
    showUnanswered();
    expect(screen.getAllByTestId('risk-at-dose-prompt')).toHaveLength(5);
  });

  it('every recorded dose is still listed', () => {
    const { container } = showUnanswered();
    expect(container.querySelectorAll('.rec-progress-dose-row')).toHaveLength(5);
  });

  it('the card cannot be collapsed shut over the questions', () => {
    const { container } = showUnanswered();
    expect(container.querySelector('.rec-card-collapsed')).toBeNull();
  });
});

describe('P1-4: once answered, the real recommendation appears', () => {
  it('the card recommends again with all five answers in', () => {
    const doses = DATES.map((d) => ({ date: d }));
    const answers = Object.fromEntries(DATES.map((_, i) => [i, 'yes']));
    const rec = recommend({
      today: TODAY, ageMonths: 96, riskIds: ['asplenia'],
      menacwyDoses: doses, menbDoses: [], riskAtDoseAnswers: { MenACWY: answers },
    }).menacwy[0];
    const perDose = analyzeHistory('MenACWY', doses, 96, ['asplenia'], TODAY, answers).perDose;
    const { container } = render(
      <RecCard rec={rec} doses={doses} doseValidations={perDose} ageMonths={96} today={TODAY} />,
    );
    expect(hasPendingDoses(perDose)).toBe(false);
    expect(container.querySelector('[data-testid="rec-awaiting-input"]')).toBeNull();
    expect(container.textContent).toMatch(/Dose 1 of 4/);
  });
});
