// @vitest-environment happy-dom
// UI-layer regression for a high-risk MenB dose 3 given early. Engine-layer
// coverage and the live-read quotes are in
// src/logic/__tests__/regression-menb-hr-early-dose3-counts.test.js.
//
// 2026-09-17 (superseded): the card read "Dose 4 of 4" and dose 3 counted.
// M1 (owner, 2026-11-20, "follow CDSI"): ACIP mm7349a3 says the dose "should be
// repeated ≥4 months after the last dose", so dose 3 shows "Not counted —
// repeat" and the card asks for "Dose 3 of 3" again.
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

describe('M1 (UI): the card asks for dose 3 again and the early dose 3 is not counted', () => {
  it('renders "Dose 3 of 3", a "Not counted — repeat" chip, and no "Dose 4 of 4"', () => {
    const rec = recommend({
      today: TODAY, ageMonths: AGE_M, riskIds: RISK,
      menacwyDoses: [], menbDoses: DOSES, riskAtDoseAnswers: ANSWERS,
    }).menb[0];
    const doseValidations = validateHistory('MenB', DOSES, AGE_M, RISK, TODAY, ANSWERS);

    render(<RecCard rec={rec} doses={DOSES} doseValidations={doseValidations} />);

    expect(screen.getAllByText(/Dose 3 of 3/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Dose 4 of 4/)).toBeNull();
    expect(screen.getByText('Not counted — repeat')).toBeTruthy();
  });
});
