// Regression: fmtAgeMonths()'s weeks branch (am <= 2 months) converted an
// already-averaged calendar-months value back into weeks with a SECOND
// averaged constant (4.348 weeks/month). Two averaged conversions compound,
// so a dose given at EXACTLY 42 days (6.0 completed weeks, no rounding
// involved at all) displayed as "5 weeks" instead of "6 weeks".
//
// Live-reproduced 2026-09-23: DOB 2026-08-05, a MenQuadfi dose recorded
// 2026-09-16 (exactly 42 days later) showed "age 5 weeks" on the Results
// page's recorded-doses panel.
//
// Fix: fmtAgeMonths() now takes an optional second argument, the exact day
// count, and — only when a caller supplies it (dob and a real date are both
// on file) — computes weeks as Math.floor(exactDays / 7) instead of
// round-tripping through `am`. Callers with no exact day count (a patient
// entered as years/months, with no date of birth) are unaffected: this test
// also pins that the old averaged behaviour is untouched when the second
// argument is omitted.
import { describe, it, expect } from 'vitest';
import { fmtAgeMonths } from '../format.js';
import { calendarMonthsBetween, daysBetween } from '../dateUtils.js';

describe('fmtAgeMonths weeks band — exact day count', () => {
  it('reads "6 weeks" for a dose exactly 42 days after birth (the reported case)', () => {
    const dob = '2026-08-05';
    const doseDate = '2026-09-16'; // 42 days later
    expect(daysBetween(dob, doseDate)).toBe(42);
    const am = calendarMonthsBetween(dob, doseDate);
    const exactDays = daysBetween(dob, doseDate);
    expect(fmtAgeMonths(am, exactDays)).toBe('6 weeks');
  });

  it('is exact at every whole-week boundary from 1 to 8 weeks, regardless of which real month it falls in', () => {
    // Several different DOBs so the calendar-months denominator (28-31 days)
    // varies -- the bug was specific to which real month was used underneath.
    const dobs = ['2026-01-01', '2026-02-01', '2026-04-01', '2026-08-05', '2025-12-15'];
    for (const dob of dobs) {
      for (let n = 1; n <= 8; n++) {
        const doseDate = addDaysISO(dob, n * 7);
        const am = calendarMonthsBetween(dob, doseDate);
        const exactDays = daysBetween(dob, doseDate);
        expect(exactDays).toBe(n * 7);
        expect(fmtAgeMonths(am, exactDays)).toBe(`${n} week${n === 1 ? '' : 's'}`);
      }
    }
  });

  it('reads "Birth" for exact-day counts under a week, even right at the old averaged threshold', () => {
    const dob = '2026-08-05';
    for (const days of [0, 1, 6]) {
      const doseDate = addDaysISO(dob, days);
      const am = calendarMonthsBetween(dob, doseDate);
      expect(fmtAgeMonths(am, days)).toBe('Birth');
    }
  });

  it('falls back to the old averaged conversion when no exact day count is supplied (years/months-only entry)', () => {
    // Unchanged from before this fix -- pins that omitting the new argument
    // does not change behaviour for patients with no date of birth on file.
    expect(fmtAgeMonths(1.5)).toBe('6 weeks');
    expect(fmtAgeMonths(0.24)).toBe('Birth');
  });
});

function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
