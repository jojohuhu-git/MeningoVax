// @vitest-environment happy-dom
// UI-layer regression for P0-2 (see
// src/logic/__tests__/regression-p0-2-single-dose-schedules-keep-later-doses.test.js
// for the engine coverage, the ACIP quotes and the sweep).
//
// What a clinician saw: an 18-year-old heading to a dorm, MenACWY at 14 and
// again at 17. The 17-year dose — the one ACIP says satisfies the requirement —
// was chipped "Extra dose — beyond the indicated series total", and the card
// beneath it still asked for another dose today.
//
// Note on how these tests read the card: a "complete" card collapses by
// default (the D5 design decision — neutral cards stay out of the way) and
// renders NO dose chips until it is opened. Every test here opens it first and
// asserts on the chips that are actually present, so that a card which renders
// nothing at all cannot pass a "does not say Extra dose" check by default.
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function chips(ageMonths, riskIds, dates) {
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
  const rendered = [...container.querySelectorAll('.dose-val-chip')].map((e) => e.textContent);
  // Guard against a vacuous pass: every one of these patients has doses on
  // record, so a card showing no chips means the test is asserting nothing.
  expect(rendered.length).toBe(dates.length);
  return { rec, rendered };
}

describe('P0-2 (UI): a dose the patient really had is not written off as surplus', () => {
  it('the college dorm student’s 17-year dose counts as a booster, not an extra', () => {
    const { rendered } = chips(216, ['college_dorm'], ['2022-09-15', '2025-09-15']);
    expect(rendered).toEqual(['Dose 1 of 1', 'Booster']);
  });

  it('and the card says the requirement is met rather than asking for a dose', () => {
    const { rec } = chips(216, ['college_dorm'], ['2022-09-15', '2025-09-15']);
    expect(rec.status).toBe('complete');
    expect(rec.dueToday).toBeFalsy();
    expect(rec.doseLabel).toMatch(/≥16y/);
  });

  it('the outbreak top-up counts', () => {
    const { rendered, rec } = chips(156, ['outbreak_acwy'], ['2018-09-15', '2025-09-15']);
    expect(rendered).toEqual(['Dose 1 of 1', 'Booster']);
    expect(rec.dueToday).toBeFalsy();
  });

  it('the military second dose counts', () => {
    const { rendered } = chips(264, ['military'], ['2021-09-15', '2025-09-15']);
    expect(rendered).toEqual(['Dose 1 of 1', 'Booster']);
  });

  it('control: a third ROUTINE dose IS still an extra dose', () => {
    // The originally reported bug the cap was built for (F2/F3, "Dose 3 of 1").
    // Routine MenACWY is 11-12y plus the 16y booster and nothing after it, so
    // this cap must keep working.
    const { rendered } = chips(264, [], ['2017-09-15', '2022-09-15', '2025-09-15']);
    expect(rendered[2]).toMatch(/Extra dose/);
  });

  it('no chip anywhere reads a dose number higher than its total', () => {
    for (const [am, risk, dates] of [
      [216, ['college_dorm'], ['2022-09-15', '2025-09-15']],
      [156, ['outbreak_acwy'], ['2018-09-15', '2025-09-15']],
      [264, ['military'], ['2021-09-15', '2025-09-15']],
    ]) {
      for (const label of chips(am, risk, dates).rendered) {
        const m = label.match(/^Dose (\d+) of (\d+)$/);
        if (m) expect(Number(m[1])).toBeLessThanOrEqual(Number(m[2]));
      }
    }
  });
});
