// @vitest-environment happy-dom
// UI-layer regression for M10 (see
// src/logic/__tests__/regression-m10-infant-exposure.test.js for the engine
// coverage, the verbatim ACIP quotes and the full reproduction).
//
// An infant vaccinated because of travel or an A/C/W/Y outbreak must SEE the
// infant series. Before M10 the card read "1 dose (ongoing-risk indication)" for
// the traveler and "1 dose" for the outbreak contact — an adult-shaped answer
// for a 4-month-old, who ACIP puts on a 4-dose Menveo series at 2, 4, 6 and 12
// months (MMWR 69(RR-9) Table 9 and Table 8, "2–23 mos" row).
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-09-15';
const acwyRec = (ageMonths, riskIds, dates) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [] }).menacwy[0];
const show = (rec) => render(<RecCard rec={rec} doses={[]} doseValidations={[]} />);

describe('M10 (UI): an infant exposure indication shows the infant series', () => {
  it('a 4-month-old traveler sees the 4-dose infant series', () => {
    show(acwyRec(4, ['travel'], []));
    expect(screen.getByText(/Dose 1 of 4/)).toBeTruthy();
    expect(screen.getByText(/travelling to or living in a country where meningococcal disease/i)).toBeTruthy();
  });

  it('a 4-month-old outbreak contact sees the same series, named as an outbreak', () => {
    show(acwyRec(4, ['outbreak_acwy'], []));
    expect(screen.getByText(/Dose 1 of 4/)).toBeTruthy();
    expect(screen.getByText(/increased risk during a serogroup A, C, W or Y outbreak/i)).toBeTruthy();
  });

  it('neither card blames a medical condition the infant does not have', () => {
    const { container } = show(acwyRec(4, ['travel'], []));
    expect(container.textContent).not.toMatch(/asplenia|complement deficiency|HIV/i);
  });

  it('the outbreak card does not promise a standing booster schedule', () => {
    // ACIP Table 8 gives outbreak contacts a one-off top-up on re-exposure, not
    // the recurring 3-then-5-year countdown travel and medical risk get
    // (owner-confirmed 2026-09-15).
    const { container } = show(acwyRec(4, ['outbreak_acwy'], []));
    expect(container.textContent).not.toMatch(/Boosters: first in 3 years/);
  });

  it('the outbreak card does not claim "future boosters needed"', () => {
    // RecCard derives that pill from boosterSummary being non-empty. Filling it
    // with a sentence that says there IS no schedule made the card contradict
    // itself: "Dose due today, future boosters needed" above "No standing
    // booster schedule". The top-up rule lives in the note instead.
    const { container } = show(acwyRec(4, ['outbreak_acwy'], []));
    expect(container.textContent).not.toMatch(/future boosters needed/i);
    expect(container.textContent).toMatch(/no standing booster schedule/i);
  });

  it('a completed outbreak infant series is complete, not on a 3-year countdown', () => {
    const rec = acwyRec(14, ['outbreak_acwy'], ['2026-03-15', '2026-04-12', '2026-05-15', '2026-06-15']);
    const { container } = show(rec);
    expect(rec.status).toBe('complete');
    // A "complete" card with no future booster collapses by default (the D5
    // design decision: neutral cards stay out of the way). Open it the way a
    // clinician would to read the reasoning underneath.
    fireEvent.click(container.querySelector('.rec-card-head-toggle'));
    expect(container.textContent).not.toMatch(/first booster, 3 years after primary/i);
    expect(container.textContent).toMatch(/identified at risk in a NEW outbreak/i);
  });

  it('control: a travel infant DOES keep its standing booster schedule', () => {
    const { container } = show(acwyRec(4, ['travel'], []));
    expect(container.textContent).toMatch(/Boosters: first in 3 years/);
  });

  it('control: a 4-month-old with asplenia still sees the high-risk wording', () => {
    const { container } = show(acwyRec(4, ['asplenia'], []));
    expect(screen.getByText(/Dose 1 of 4/)).toBeTruthy();
    expect(container.textContent).toMatch(/High-risk infants 2–6 months/);
  });
});
