// ─────────────────────────────────────────────────────────────────────────
// G3 (2026-09-16): a dose dated in the FUTURE must not be counted as given.
//
// The record is a list of doses the patient has already received. A date
// after today is either a typo (a mistyped year is the common one) or a
// scheduled appointment typed into the wrong place. Either way the shot is
// not in the patient's arm, and counting it makes the app tell a clinician
// the patient is protected when they are not — the most dangerous direction
// for this app to be wrong in.
//
// The date input carries a `max`, and the browser does flag the overflow,
// but nothing in the app ever read that flag and the validator never
// compared a dose date to today.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { TEST_TODAY } from '../../test-today.js';

// Pinned clock is 2026-09-15, so these are unambiguously ahead of it.
const FUTURE = '2027-05-01';
const NEXT_WEEK = '2026-09-22';
const TODAY = TEST_TODAY;

describe('G3: a dose dated in the future is not counted', () => {
  it('MenB: a future-dated dose does not count toward the series', () => {
    const { perDose, effective } = analyzeHistory('MenB', [{ date: FUTURE, brand: '' }], 204, ['asplenia']);
    expect(perDose[0].doesNotCount).toBe(true);
    expect(perDose[0].effectiveDoseNum).toBeNull();
    expect(effective).toHaveLength(0);
  });

  it('MenACWY: a future-dated dose does not count toward the series', () => {
    const { perDose, effective } = analyzeHistory('MenACWY', [{ date: FUTURE, brand: '' }], 204, []);
    expect(perDose[0].doesNotCount).toBe(true);
    expect(effective).toHaveLength(0);
  });

  it('says the date is the problem, and does not tell anyone to repeat the dose', () => {
    const { perDose } = analyzeHistory('MenB', [{ date: FUTURE, brand: '' }], 204, ['asplenia']);
    const said = perDose[0].reasons.join(' ');
    expect(said).toMatch(/future/i);
    // "repeat this dose only" is the advice for a dose given too early or too
    // close to the last one. Here nothing was given, so repeating is nonsense.
    expect(said).not.toMatch(/repeat this dose/i);
  });

  it('a dose dated today still counts — today is not the future', () => {
    const { perDose, effective } = analyzeHistory('MenACWY', [{ date: TODAY, brand: '' }], 204, []);
    expect(perDose[0].doesNotCount).toBeUndefined();
    expect(effective).toHaveLength(1);
  });

  it('catches a date only days ahead, not just an obviously wrong year', () => {
    const { perDose } = analyzeHistory('MenACWY', [{ date: NEXT_WEEK, brand: '' }], 204, []);
    expect(perDose[0].doesNotCount).toBe(true);
  });

  it('a real earlier dose still counts when a future-dated one sits beside it', () => {
    const { perDose, effective } = analyzeHistory(
      'MenACWY',
      [{ date: '2024-01-10', brand: '' }, { date: FUTURE, brand: '' }],
      204,
      []
    );
    expect(effective).toHaveLength(1);
    expect(perDose[0].effectiveDoseNum).toBe(1);
    expect(perDose[1].doesNotCount).toBe(true);
  });

  it('the engine does not call the patient protected on the strength of a future dose', () => {
    const withFuture = recommend({ ageMonths: 204, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [{ date: FUTURE, brand: '' }] });
    const withNothing = recommend({ ageMonths: 204, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] });
    // A dose that has not been given yet must leave the recommendation
    // exactly where an empty record leaves it.
    expect(withFuture.menb.map((r) => r.status)).toEqual(withNothing.menb.map((r) => r.status));
    expect(withFuture.menb.map((r) => r.doseLabel)).toEqual(withNothing.menb.map((r) => r.doseLabel));
  });
});
