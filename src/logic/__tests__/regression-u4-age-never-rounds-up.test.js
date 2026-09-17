// U4 (2026-09-17, owner decision): an age is shown as the age the patient has
// COMPLETED. Nobody is 16 until their 16th birthday.
//
// The display formatter rounded to the NEAREST month and year, so a dose given
// in the last fortnight before a birthday was shown as if it had been given on
// it:
//
//   191.7 months (15y 11.7m)  ->  "16 years"
//   119.7 months  (9y 11.7m)  ->  "10 years"
//
// That put seven verdict sentences at war with themselves, because each one
// prints the rounded age immediately before an exact threshold claim:
//
//   "Given at ~16 years, before the age-16 booster window."
//   "Given at ~10 years, before age 10."
//   "Given at ~10 years, below the minimum age of 10 years for Bexsero."
//
// and the dose row above them printed the same rounded age with no "~" to warn
// the reader it was approximate: "D1 - Aug 7, 2026 - age 16 years".
//
// Rounding DOWN fixes all of it in one place, and matches how a clinician says
// an age out loud. It is a display rule, not a clinical one: no interval, floor
// or total reads these strings -- the engine and validator work in months.
import { describe, it, expect } from 'vitest';
import { fmtAgeMonths } from '../format.js';
import { analyzeHistory } from '../validate.js';

const TODAY = '2026-09-15'; // TEST_TODAY

describe('U4 · a displayed age never reaches a birthday early', () => {
  it('the fortnight before a birthday still belongs to the previous year', () => {
    expect(fmtAgeMonths(191.7)).toBe('15 years 11 months');
    expect(fmtAgeMonths(119.7)).toBe('9 years 11 months');
    expect(fmtAgeMonths(59.88)).toBe('4 years 11 months');
  });

  it('the same holds for months and for infant weeks', () => {
    expect(fmtAgeMonths(23.8)).toBe('23 months');
    expect(fmtAgeMonths(11.9)).toBe('11 months');
    // The weeks branch covers ages up to 2 months; 1.99 months is 8 weeks and
    // 5 days, which used to round up to "9 weeks".
    expect(fmtAgeMonths(1.99)).toBe('8 weeks');
  });

  it('a whole age still reads as that whole age', () => {
    expect(fmtAgeMonths(192)).toBe('16 years');
    expect(fmtAgeMonths(120)).toBe('10 years');
    expect(fmtAgeMonths(60)).toBe('5 years');
    expect(fmtAgeMonths(24)).toBe('2 years');
    expect(fmtAgeMonths(0)).toBe('Birth');
  });

  it('floating-point noise does not knock a whole age back a month', () => {
    // Ages are computed by subtracting two dates, so an age that IS exactly
    // five years can arrive as 59.9999999. Flooring that naively would print
    // "4 years 11 months" for a child's fifth birthday.
    for (const am of [59.9999999, 119.99999995, 191.9999999, 23.9999999]) {
      expect(fmtAgeMonths(am)).not.toMatch(/11 months|23 months/);
    }
  });

  it('never claims an age the patient has not reached', () => {
    // The whole rule, as a sweep: parse what we printed back into months and
    // check it never exceeds the real age.
    const asMonths = (s) => {
      const y = /(\d+) years?/.exec(s); const mo = /(\d+) months?/.exec(s);
      const wk = /(\d+) weeks?/.exec(s);
      if (s === 'Birth') return 0;
      if (wk) return Number(wk[1]) / 4.348;
      return (y ? Number(y[1]) * 12 : 0) + (mo ? Number(mo[1]) : 0);
    };
    for (let am = 0; am < 300; am += 0.29) {
      const printed = asMonths(fmtAgeMonths(am));
      expect(printed, `${am} months printed as "${fmtAgeMonths(am)}"`).toBeLessThanOrEqual(am + 1e-6);
    }
  });

  it('never prints "X years 12 months"', () => {
    for (let am = 24; am < 300; am += 0.37) {
      expect(fmtAgeMonths(am)).not.toMatch(/ 12 months$/);
    }
  });
});

describe('U4 · the sentences that used to contradict themselves', () => {
  // Healthy patient, 16y1m today; dose 1 at age 11, dose 2 eight days before
  // the 16th birthday (outside CDC's 4-day grace, so it genuinely does not
  // count toward the routine series).
  const reason = () => analyzeHistory(
    'MenACWY',
    [{ date: '2021-08-15' }, { date: '2026-08-07' }],
    193, [], TODAY, {},
  ).perDose[1].reasons?.[0] ?? '';

  it('no longer says a dose given before the age-16 window was given at 16', () => {
    expect(reason()).toMatch(/before the age-16 booster window/);
    expect(reason()).not.toMatch(/~16 years/);
    expect(reason()).toMatch(/~15 years 11 months/);
  });
});
