// @vitest-environment happy-dom
// UI-layer regression for P0-4 (see
// src/logic/__tests__/regression-p0-4-calendar-month-intervals.test.js for the
// engine coverage and the CDC quote).
//
// What a clinician saw: a healthy 19-year-old, Bexsero on 2025-01-15 and
// 2025-07-15 — a textbook 0/6-month series. The card said "Dose 3 of 3
// (rescue: dose 2 given early)", due today, and the dose's own reason line
// read "less than the 6-month standard interval". Dated two days later the
// same patient read "Complete". Half of all 2025 start dates hit this.
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function show(dates, riskIds = []) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  const rec = recommend({
    today: TODAY, ageMonths: 228, riskIds, menacwyDoses: [], menbDoses: doses,
    riskAtDoseAnswers: { MenB: answers },
  }).menb[0];
  const perDose = analyzeHistory('MenB', doses, 228, riskIds, TODAY, answers).perDose;
  const { container } = render(
    <RecCard rec={rec} doses={doses} doseValidations={perDose} ageMonths={228} today={TODAY} />,
  );
  const toggle = container.querySelector('.rec-card-head-toggle');
  if (toggle) fireEvent.click(toggle);
  const chips = [...container.querySelectorAll('.dose-val-chip')].map((e) => e.textContent);
  expect(chips.length).toBe(dates.length); // guard against a vacuous pass
  return { rec, chips, container };
}

describe('P0-4 (UI): a 0/6-month MenB series is complete, not short a dose', () => {
  const SIX_CALENDAR_MONTHS = ['2025-01-15', '2025-07-15']; // 181 days

  it('both doses count against a 2-dose series', () => {
    expect(show(SIX_CALENDAR_MONTHS).chips).toEqual(['Dose 1 of 2', 'Dose 2 of 2']);
  });

  it('no rescue dose is offered', () => {
    const { rec, container } = show(SIX_CALENDAR_MONTHS);
    expect(rec.dueToday).toBeFalsy();
    expect(container.textContent).not.toMatch(/rescue/i);
  });

  it('dose 2 is not described as given early', () => {
    expect(show(SIX_CALENDAR_MONTHS).container.textContent)
      .not.toMatch(/less than the 6-month standard interval/i);
  });

  it('the verdict does not depend on the month the patient started in', () => {
    // A February start (the shortest six-month span of the year) and an August
    // start (one of the longest) must read identically.
    expect(show(['2025-02-15', '2025-08-15']).chips).toEqual(['Dose 1 of 2', 'Dose 2 of 2']);
    expect(show(['2025-08-15', '2026-02-15']).chips).toEqual(['Dose 1 of 2', 'Dose 2 of 2']);
  });

  it('control: a genuinely early dose 2 still asks for the rescue dose', () => {
    const { rec, container } = show(['2025-01-15', '2025-06-15']); // five months
    expect(rec.doseLabel).toMatch(/rescue/i);
    expect(container.textContent).toMatch(/rescue/i);
  });
});
