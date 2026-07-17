// Regression test for fix-2026-07-13 audit queue item E1.
//
// Bug: ageAtDoseFromDate()/dobToAgeMonths() converted calendar dates to months
// using a fixed 30.4375-days/month average. For a DOB and dose date exactly 10
// calendar years apart (e.g. DOB 2006-01-01, dose 2016-01-01), that average
// computed ~119.98 months instead of 120.00 — because this particular 10-year
// span contains only 2 leap days where the 365.25-day/year average assumes 2.5 —
// which wrongly tripped the "< 120 months" (before age 10) exclusion on a dose
// given exactly ON the patient's 10th birthday.
//
// immunize.org: "ACIP considers a dose of MenACWY given to a 10-year-old child
// to be valid for the first dose in the adolescent series." Only doses given
// strictly BEFORE the 10th birthday should be excluded.

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { dobToAgeMonths } from '../format.js';

describe('E1: a MenACWY dose given exactly on the 10th birthday counts normally', () => {
  it('DOB 2006-01-01, dose 2016-01-01 (exact 10y0d), today 2026-07-13 — must NOT be excluded as "before age 10"', () => {
    const today = '2026-07-13';
    const ageMonths = dobToAgeMonths('2006-01-01', today);

    // The current-age computation itself must land on an exact whole month
    // count for an exact calendar span (not the old ~246.34 average-based drift).
    expect(ageMonths).toBeCloseTo(246.387, 2);

    const perDose = analyzeHistory(
      'MenACWY',
      [{ date: '2016-01-01' }],
      ageMonths,
      [],
      today
    ).perDose;

    expect(perDose[0].status).toBe('valid');
    expect(perDose[0].notAdolescentCount).toBeFalsy();
    expect(perDose[0].effectiveDoseNum).toBe(1);
  });

  it('a dose one day before the 10th birthday is still correctly excluded (boundary not over-corrected)', () => {
    const today = '2026-07-13';
    const ageMonths = dobToAgeMonths('2006-01-01', today);

    const perDose = analyzeHistory(
      'MenACWY',
      [{ date: '2015-12-31' }],
      ageMonths,
      [],
      today
    ).perDose;

    expect(perDose[0].notAdolescentCount).toBe(true);
    expect(perDose[0].effectiveDoseNum).toBeNull();
  });
});
