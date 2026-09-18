// @vitest-environment happy-dom
// UI-layer regression for P0-3 (see
// src/logic/__tests__/regression-p0-3-infant-outbreak-series-after-age-2.test.js
// for the engine coverage and the ACIP Table 8 reasoning).
//
// What a clinician saw: a 3-year-old who had had the full four-dose infant
// MenACWY series during an outbreak. D1 read "Dose 1 of 1" and D2, D3 and D4
// all read "Extra dose — beyond the indicated series total". Three correctly
// given, correctly spaced doses, written off as surplus.
//
// These tests open the card before reading it (a "complete" card collapses by
// default and renders no chips at all) and assert the exact chip text, so a
// card rendering nothing cannot pass by default.
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';
import { openWhyThis } from '../../test-why-this.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const FULL_INFANT_SERIES = ['2023-11-15', '2024-01-15', '2024-03-15', '2024-09-15'];

function chips(ageMonths, dates, riskIds = ['outbreak_acwy']) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  const rec = recommend({
    today: TODAY, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [],
    riskAtDoseAnswers: { MenACWY: answers },
  }).menacwy[0];
  const perDose = analyzeHistory('MenACWY', doses, ageMonths, riskIds, TODAY, answers).perDose;
  const { container } = render(
    <RecCard rec={rec} doses={doses} doseValidations={perDose} ageMonths={ageMonths} today={TODAY} />,
  );
  const toggle = container.querySelector('.rec-card-head-toggle');
  if (toggle) fireEvent.click(toggle);
  // U1 (2026-09-17): the outbreak top-up rule is the note's detail, behind
  // "Why this" -- open it, since these tests read the card's full text.
  openWhyThis();
  const rendered = [...container.querySelectorAll('.dose-val-chip')].map((e) => e.textContent);
  expect(rendered.length).toBe(dates.length); // guard against a vacuous pass
  return { rec, rendered, container };
}

describe('P0-3 (UI): the infant outbreak series reads as four doses of four', () => {
  it('every chip counts against 4', () => {
    expect(chips(36, FULL_INFANT_SERIES).rendered)
      .toEqual(['Dose 1 of 4', 'Dose 2 of 4', 'Dose 3 of 4', 'Dose 4 of 4']);
  });

  it('nothing is chipped "Extra dose"', () => {
    expect(chips(36, FULL_INFANT_SERIES).container.textContent).not.toMatch(/Extra dose/i);
  });

  it('the card still says there is no standing booster schedule (M12)', () => {
    const { container } = chips(36, FULL_INFANT_SERIES);
    expect(container.textContent).toMatch(/NEW outbreak/i);
    expect(container.textContent).not.toMatch(/future boosters needed/i);
  });

  it('a child with only the 2-month dose is asked for dose 2, not told they are done', () => {
    const { rec, rendered } = chips(36, ['2023-11-15']);
    expect(rendered).toEqual(['Dose 1 of 4']);
    expect(rec.status).not.toBe('complete');
  });
});
