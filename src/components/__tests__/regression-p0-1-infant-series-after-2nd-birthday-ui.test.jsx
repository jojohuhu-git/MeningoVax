// @vitest-environment happy-dom
// UI-layer regression for P0-1 (see
// src/logic/__tests__/regression-p0-1-infant-series-survives-2nd-birthday.test.js
// for the engine coverage, the verbatim CDC quotes and the full reproduction).
//
// The clinician-visible symptom: a child with asplenia on the textbook 2/4/6/12-
// month MenACWY schedule was told, the day they turned 2, that the doses they
// still owed were "boosters" not due for three years — and the recorded-dose
// list filed correctly given primary doses under a "Boosters" heading. Both
// come from a series total keyed to today's age instead of the age at dose 1.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function show(ageMonths, dates, riskIds = ['asplenia']) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = { MenACWY: allYes(doses.length) };
  const rec = recommend({
    today: TODAY, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [],
    riskAtDoseAnswers: answers,
  }).menacwy[0];
  const validations = analyzeHistory('MenACWY', doses, ageMonths, riskIds, TODAY, allYes(doses.length)).perDose;
  return { rec, ...render(<RecCard rec={rec} doses={doses} doseValidations={validations} />) };
}

describe('P0-1 (UI): a 2-year-old mid-series is still asked for the dose they owe', () => {
  // Doses at 2 and 4 months, child is exactly 24 months old today.
  const twoDoses = ['2024-11-15', '2025-01-15'];

  it('the card asks for dose 3 of 4 today, not a booster in three years', () => {
    const { rec, container } = show(24, twoDoses);
    expect(rec.dueToday).toBe(true);
    expect(container.textContent).toMatch(/Dose 3/);
    expect(container.textContent).not.toMatch(/first booster, 3 years after primary/i);
  });

  it('the chip on each recorded dose counts against 4, not 2', () => {
    show(24, twoDoses);
    expect(screen.getByText('Dose 1 of 4')).toBeTruthy();
    expect(screen.getByText('Dose 2 of 4')).toBeTruthy();
  });

  it('no dose of a correctly given infant series is called an extra dose', () => {
    const { container } = show(24, [...twoDoses, '2025-03-15', '2025-11-15']);
    expect(container.textContent).not.toMatch(/Extra dose/i);
  });
});

describe('P0-1 (UI): the reported 8-year-old — headings split in the right place', () => {
  // DOB 2018-09-15; MenACWY at 2, 4, 6 and 12 months, then the first booster at
  // age 4. D1-D4 are the primary series; only D5 is a booster.
  const fiveDoses = ['2018-11-15', '2019-01-15', '2019-03-15', '2019-09-15', '2022-09-15'];

  it('all four infant doses sit under "Primary series"', () => {
    show(96, fiveDoses);
    expect(screen.getByText('Dose 1 of 4')).toBeTruthy();
    expect(screen.getByText('Dose 2 of 4')).toBeTruthy();
    expect(screen.getByText('Dose 3 of 4')).toBeTruthy();
    expect(screen.getByText('Dose 4 of 4')).toBeTruthy();
  });

  it('there is exactly one "Primary series" heading and one "Boosters" heading', () => {
    const { container } = show(96, fiveDoses);
    const headings = [...container.querySelectorAll('*')]
      .filter((el) => el.children.length === 0)
      .map((el) => el.textContent.trim())
      .filter((t) => t === 'Primary series' || t === 'Boosters');
    expect(headings).toEqual(['Primary series', 'Boosters']);
  });

  it('control: a series begun at 2 years still groups after 2 doses', () => {
    // Dose 1 at 24 months, dose 2 ten weeks later, first booster 3 years on.
    show(96, ['2020-09-15', '2020-11-30', '2023-11-30']);
    expect(screen.getByText('Dose 1 of 2')).toBeTruthy();
    expect(screen.getByText('Dose 2 of 2')).toBeTruthy();
  });
});
