// Regression: fmtAgeMonths() rounded years and months independently, so an
// age like 59.88 months (4y + round(11.88)=12mo) displayed as the nonsense
// "4 years 12 months". Found live while verifying B5 (compliance audit "age at
// administration" column).
//
// U4 (2026-09-17, owner decision): ages now round DOWN, so 59.88 months is
// "4 years 11 months" -- a child four days short of five is four, not five.
// The thing this test exists to prevent, "X years 12 months" ever reaching the
// screen, is unchanged and still asserted.

import { describe, it, expect } from 'vitest';
import { fmtAgeMonths } from '../format.js';

describe('fmtAgeMonths month-carry rounding', () => {
  it('never displays "X years 12 months"', () => {
    expect(fmtAgeMonths(59.88)).toBe('4 years 11 months');
    for (let am = 24; am < 300; am += 0.37) {
      expect(fmtAgeMonths(am)).not.toMatch(/ 12 months$/);
    }
  });

  it('still shows a non-carrying fractional month correctly', () => {
    expect(fmtAgeMonths(62)).toBe('5 years 2 months');
  });

  it('whole years still show cleanly', () => {
    expect(fmtAgeMonths(60)).toBe('5 years');
  });
});
