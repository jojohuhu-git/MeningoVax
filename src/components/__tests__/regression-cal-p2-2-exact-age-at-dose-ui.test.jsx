// @vitest-environment happy-dom
// Calendar P2-2 · UI layer. The engine-layer twin, with the measurements and
// the full reasoning, is
// src/logic/__tests__/regression-cal-p2-2-exact-age-at-dose.test.js.
//
// Two things a clinician sees:
//
//   The dose count on the card. A baby born 29 July 2024, given dose 1 on
//   28 February 2025 — the date the app itself calls their seven-month
//   anniversary — was read as 6.97 months old and shown a FOUR-dose series.
//   CDC asks for two. Two extra injections, for a dose given on time.
//
//   The age printed beside the recorded dose. The record panel prints "age 7
//   months" under the card; on the old arithmetic it printed the age it had
//   computed, which for this baby was a shade under seven.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { patientAgeMonths } from '../../logic/patientAge.js';

const TODAY = '2026-09-15';
const DOB = '2024-07-29';
const DOSE1 = '2025-02-28'; // the seven-month anniversary, clamped from the 29th

const result = (extra = {}) => recommend({
  today: TODAY, riskIds: ['asplenia'], menbDoses: [],
  menacwyDoses: [{ date: DOSE1 }], riskAtDoseAnswers: { MenACWY: { 0: 'yes' } },
  ...extra,
});

const show = (res, { dob = null } = {}) => render(
  <RecCard
    rec={res.menacwy[0]}
    doses={res.history.MenACWY.sortedDoses}
    doseValidations={res.history.MenACWY.perDose}
    ageMonths={patientAgeMonths({ dob, ageMonths: res.meta?.ageMonths }, TODAY) ?? 25}
    dob={dob}
  />,
);

describe('the card for a baby dosed on their own seven-month anniversary', () => {
  it('asks for the two doses CDC asks for, not four', () => {
    const { container } = show(result({ dob: DOB }), { dob: DOB });
    expect(screen.getByText(/of 2/)).toBeTruthy();
    expect(container.textContent).not.toMatch(/of 4/);
  });
});

describe('the age printed beside the recorded dose', () => {
  it('reads as a whole seven months, not a shade under', () => {
    const { container } = show(result({ dob: DOB }), { dob: DOB });
    expect(container.textContent).toMatch(/age 7 months/);
    expect(container.textContent).not.toMatch(/age 6 months/);
  });
});

describe('what must NOT change', () => {
  it('a years/months patient, who has no birthday to measure from, is unaffected', () => {
    const res = result({ ageMonths: 25 });
    const { container } = show(res);
    // Still the approximation, still the four-dose answer it gave before.
    expect(container.textContent).toMatch(/Dose 2/);
    expect(container.textContent).not.toMatch(/of 2\b/);
  });
});
