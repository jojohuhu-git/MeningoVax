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
import { openWhyThis } from '../../test-why-this.js';

const TODAY = '2026-09-15';
const acwyRec = (ageMonths, riskIds, dates) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [] }).menacwy[0];
// U1 (2026-09-17): every assertion below is about what the card SAYS, and half
// of a note now sits behind its "Why this" button, so the helper opens the
// disclosure as part of rendering. The disclosure's own behaviour is tested in
// RecCard.test.jsx, not here.
const show = (rec) => {
  const r = render(<RecCard rec={rec} doses={[]} doseValidations={[]} />);
  openWhyThis();
  return r;
};

describe('M10 (UI): an infant exposure indication shows the infant series', () => {
  it('a 4-month-old traveler sees the 4-dose infant series', () => {
    show(acwyRec(4, ['travel'], []));
    // P44 (review v10) dropped the who-phrase from the note; the dose label names the group.
    expect(screen.getByText(/Dose 1 of 4 \(infant travel\)/)).toBeTruthy();
  });

  it('a 4-month-old outbreak contact sees the same series, named as an outbreak', () => {
    show(acwyRec(4, ['outbreak_acwy'], []));
    // P44 (review v10): the dose label names the outbreak.
    expect(screen.getByText(/Dose 1 of 4 \(infant outbreak\)/)).toBeTruthy();
  });

  it('neither card blames a medical condition the infant does not have', () => {
    const { container } = show(acwyRec(4, ['travel'], []));
    expect(container.textContent).not.toMatch(/asplenia|complement deficiency|HIV/i);
  });

  // STOP B B-2 (owner, 2026-11-15) replaced M10/M12's one-off-top-up reading:
  // while the outbreak box is ticked, an infant outbreak series gets the same
  // booster countdown as travel and medical risk, and the card says so.
  it('the outbreak card shows the standing booster schedule (B-2)', () => {
    const { container } = show(acwyRec(4, ['outbreak_acwy'], []));
    expect(container.textContent).toMatch(/Boosters: 3 years after the series/);
    expect(container.textContent).toMatch(/boosters to follow/i);
    // extinct: the "no standing booster schedule" sentence, retired by B-2 (2026-11-16).
    expect(container.textContent).not.toMatch(/no standing booster schedule/i);
  });

  it('a completed outbreak infant series is on the 3-year countdown, not "complete" (B-2)', () => {
    // Patient is 14 months old (DOB 2025-07-15); a genuinely complete 4-dose
    // series (P0-1's rebuilt fixture).
    const rec = acwyRec(14, ['outbreak_acwy'], ['2025-10-15', '2025-12-10', '2026-02-04', '2026-07-20']);
    const { container } = show(rec);
    expect(rec.status).not.toBe('complete');
    expect(container.textContent).toMatch(/first booster, 3 years after primary/i);
  });

  it('control: a travel infant DOES keep its standing booster schedule', () => {
    const { container } = show(acwyRec(4, ['travel'], []));
    expect(container.textContent).toMatch(/Boosters: 3 years after the series/);
  });

  it('control: a 4-month-old with asplenia still sees the high-risk wording', () => {
    const { container } = show(acwyRec(4, ['asplenia'], []));
    expect(screen.getByText(/Dose 1 of 4/)).toBeTruthy();
    expect(container.textContent).toMatch(/four-dose infant series/)   // P44 (review v10) dropped the who-phrase; the label names the group;
  });
});
