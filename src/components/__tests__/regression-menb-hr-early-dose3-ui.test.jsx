// @vitest-environment happy-dom
// UI-layer regression for the MenB dose-3 rescue (2026-09-17). Engine-layer
// coverage, the reproduction and the live-fetched CDC quote are in
// src/logic/__tests__/regression-menb-hr-early-dose3-counts.test.js.
//
// What the clinician used to see on the card for a high-risk patient whose dose
// 3 came early: an "Invalid" chip on dose 3 telling them to repeat it, and a
// heading reading "Dose 3 of 3". Both were wrong. CDC credits that dose and
// adds a fourth one, so the card must read "Dose 4 of 4" and the dose-3 chip
// must not say Invalid.
//
// This test feeds RecCard the REAL output of recommend() and validateHistory
// rather than hand-written props, so it cannot pass while the engine says
// something else.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { validateHistory } from '../../logic/validate.js';

const TODAY = '2026-09-15'; // TEST_TODAY
const AGE_M = 260;          // 21y8m
const RISK = ['asplenia'];
// Dose 3 only two months after dose 2, where the high-risk schedule wants four.
const DOSES = ['2026-02-15', '2026-04-15', '2026-06-15']
  .map((date) => ({ date, brand: 'Bexsero (MenB)' }));
const ANSWERS = { MenB: { 0: 'yes', 1: 'yes', 2: 'yes' } };

describe('MenB dose-3 rescue (UI): the card asks for dose 4 and keeps dose 3', () => {
  it('renders "Dose 4 of 4" and no Invalid chip on the early dose 3', () => {
    const rec = recommend({
      today: TODAY, ageMonths: AGE_M, riskIds: RISK,
      menacwyDoses: [], menbDoses: DOSES, riskAtDoseAnswers: ANSWERS,
    }).menb[0];
    const doseValidations = validateHistory('MenB', DOSES, AGE_M, RISK, TODAY, ANSWERS);

    render(<RecCard rec={rec} doses={DOSES} doseValidations={doseValidations} />);

    expect(screen.getByText(/Dose 4 of 4/)).toBeTruthy();
    expect(screen.queryByText(/Dose 3 of 3/)).toBeNull();
    expect(screen.queryByText('Invalid')).toBeNull();
  });
});
