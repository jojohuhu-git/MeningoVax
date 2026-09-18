// Impossible-entries P1-3: an impossible age was displayed as the most ordinary
// age there is.
//
// `fmtAgeMonths()` rendered EVERY negative age as "Birth", and `ageGroup()`
// labelled it "Infant (<2y)":
//
//     -52 months    ->  "Birth · Infant (<2y)"
//     -0.5 months   ->  "Birth · Infant (<2y)"
//      0 months     ->  "Birth · Infant (<2y)"
//
// A value that cannot exist looked exactly like a newborn. That is how a dose
// dated before the patient was born came to read "Given at ~birth" and be
// blamed on the patient's age (impossible-entries P1-1), and it is why the
// month-end negative age (calendar P1-1, fixed in #38) stayed invisible until it
// happened to hit a `>= 0` guard.
//
// A negative age is a bug or a typo, never a patient. It now renders as
// something that cannot be mistaken for a real age, and `ageGroup()` returns
// null so the CALLER decides what to say about it rather than being handed a
// plausible-looking band.
//
// The record panel's own formatter, fmtAgeMClinical() in validate.js, is fixed
// in the same place: it is documented there as taking its units from
// fmtAgeMonths rather than being a second implementation, and its own
// `m < 0.5 -> 'birth'` guard swallowed negatives too. Leaving it would have left
// the one sentence a clinician actually reads still saying "birth".
import { describe, it, expect } from 'vitest';
import { fmtAgeMonths, ageGroup } from '../format.js';
import { analyzeHistory } from '../validate.js';

describe('impossible P1-3: a negative age is not displayed as a real age', () => {
  it.each([-52, -0.5, -0.0357, -1e-6])('%s months does not read the same as 0', (am) => {
    expect(fmtAgeMonths(am)).not.toBe(fmtAgeMonths(0));
  });

  it.each([-52, -0.5, -0.0357])('%s months is not given an age band', (am) => {
    expect(ageGroup(am)).toBeNull();
  });

  it('it says plainly that this is before birth', () => {
    expect(fmtAgeMonths(-52)).toMatch(/before birth/i);
  });

  it('zero and newborn ages are untouched', () => {
    expect(fmtAgeMonths(0)).toBe('Birth');
    expect(fmtAgeMonths(0.1)).toBe('Birth');
    expect(fmtAgeMonths(0.5)).toBe('2 weeks');
    expect(ageGroup(0)).toBe('Infant (<2y)');
  });

  it('a real age is untouched', () => {
    expect(fmtAgeMonths(7)).toBe('7 months');
    expect(fmtAgeMonths(191.7)).toBe('15 years 11 months');
    expect(ageGroup(191.7)).toBe('Adolescent (11–18y)');
  });

  it('a dose dated before the patient was born no longer reads "~birth"', () => {
    // A 6-month-old whose recorded dose is dated a year before they were born.
    const { perDose } = analyzeHistory('MenACWY', [{ date: '2025-03-15' }], 6, ['asplenia'], '2026-09-15');
    const said = (perDose[0].reasons || []).join(' ');
    expect(said).not.toMatch(/at ~birth/i);
  });
});
