// Regression: fmtAgeMonths() rounded years and months independently, so an
// age like 59.88 months (4y + round(11.88)=12mo) displayed as the nonsense
// "4 years 12 months" instead of carrying over to "5 years". Found live
// while verifying B5 (compliance audit "age at administration" column).

import { describe, it, expect } from 'vitest';
import { fmtAgeMonths } from '../format.js';

describe('fmtAgeMonths month-carry rounding', () => {
  it('never displays "X years 12 months" — carries over to the next year', () => {
    expect(fmtAgeMonths(59.88)).toBe('5 years');
  });

  it('still shows a non-carrying fractional month correctly', () => {
    expect(fmtAgeMonths(62)).toBe('5 years 2 months');
  });

  it('whole years still show cleanly', () => {
    expect(fmtAgeMonths(60)).toBe('5 years');
  });
});
