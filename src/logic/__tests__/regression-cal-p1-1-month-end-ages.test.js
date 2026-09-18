// Calendar queue P1-1/P1-2 (fix queue 2026-09-17, docs/archive/fix-2026-09-17-
// calendar-and-dates.md): a baby born at the end of a month had a NEGATIVE age,
// and the app refused to accept them.
//
// Reproduced in the running app on the dev server, with the page clock set to
// 1 February 2026: entering a date of birth of 31 January 2026 — a one-day-old —
// cleared the field and printed "Please enter a valid age before continuing."
// The engine computed that baby's age as -0.0714 months.
//
// Cause. calendarMonthsBetween() took its fractional part as
//   (endDay - startDay) / daysInEndMonth
// When the birth day-of-month is larger than the whole end month (born the 30th
// or 31st, viewed in February), that fraction is more negative than the whole-
// month count is positive, so the age lands below zero. StepAge.jsx drops any
// age below zero, App.jsx sees null, and the clinician is refused.
//
// Three symptoms, one flaw:
//   1. Negative age      born 2026-01-31, on 2026-02-01 -> -0.0714 months.
//   2. Not monotonic     the same child was 12.0000 months on 2027-01-31 and
//                        11.9286 months the next day — younger overnight, and
//                        back under the 12-month MenACWY infant gate for 2 days.
//   3. Disagrees with the app's own calendar (P1-2): a child born 29 Feb 2024
//      was 23.9643 months on 2026-02-28 — the very date addCalendarMonths()
//      calls their second birthday — so on their own birthday the app still put
//      them on the infant schedule (12 weeks and not before 12 months) instead
//      of the >=2y one (8 weeks).
//
// The fix makes calendarMonthsBetween() agree with addCalendarMonths(), which
// already implements the clamping convention (31 Jan + 1 month = 28 Feb): count
// whole months by walking to the last clamped anniversary on or before the end
// date, then take the fraction across that anniversary and the next one.
//
// Source of truth: internal consistency. ACIP has no rule about what a month-end
// birthday means, but the app must not hold two opinions about one child's
// birthday. CDC's 4-day grace is a rule about doses, not a licence for the age
// arithmetic to wobble.
import { describe, it, expect } from 'vitest';
import { calendarMonthsBetween, addCalendarMonths, addDays } from '../dateUtils.js';

describe('calendar P1-1: a month-end birthday never produces a negative age', () => {
  it('a one-day-old born 31 January has a positive age on 1 February', () => {
    expect(calendarMonthsBetween('2026-01-31', '2026-02-01')).toBeGreaterThan(0);
  });

  it('the other two refused newborns are accepted too', () => {
    // Born 31 Jan seen on 2 Feb, and born 30 Jan seen on 1 Feb.
    expect(calendarMonthsBetween('2026-01-31', '2026-02-02')).toBeGreaterThan(0);
    expect(calendarMonthsBetween('2026-01-30', '2026-02-01')).toBeGreaterThan(0);
  });

  it('no birth date in a leap year or a normal year is ever negative in the following 400 days', () => {
    const negatives = [];
    for (const year of [2024, 2026]) {
      let dob = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      while (dob <= endOfYear) {
        let day = dob;
        for (let i = 0; i <= 400; i++) {
          if (calendarMonthsBetween(dob, day) < 0) negatives.push([dob, day]);
          day = addDays(day, 1);
        }
        dob = addDays(dob, 1);
      }
    }
    expect(negatives).toEqual([]);
  });
});

describe('calendar P1-1: a patient never gets younger overnight', () => {
  it('the 31 January child does not drop back under 12 months on 1 February', () => {
    const onBirthday = calendarMonthsBetween('2026-01-31', '2027-01-31');
    const dayAfter = calendarMonthsBetween('2026-01-31', '2027-02-01');
    expect(onBirthday).toBe(12);
    expect(dayAfter).toBeGreaterThanOrEqual(onBirthday);
    // The MenACWY infant series' final dose may not be given before 12 months.
    expect(dayAfter).toBeGreaterThanOrEqual(12);
  });

  it('age never decreases from one day to the next, for every birth day-of-month', () => {
    const drops = [];
    for (const dob of ['2024-01-31', '2024-02-29', '2024-03-31', '2024-04-30',
                       '2026-01-30', '2026-01-31', '2026-08-31', '2026-12-31']) {
      let day = dob;
      let prev = -Infinity;
      for (let i = 0; i <= 1500; i++) {
        const age = calendarMonthsBetween(dob, day);
        if (age < prev) drops.push([dob, day, prev, age]);
        prev = age;
        day = addDays(day, 1);
      }
    }
    expect(drops).toEqual([]);
  });
});

describe('calendar P1-2: the age agrees with the app\'s own anniversary calendar', () => {
  it('a leap-day child is 24 months on the date the app calls their second birthday', () => {
    const secondBirthday = addCalendarMonths('2024-02-29', 24); // 2026-02-28
    expect(secondBirthday).toBe('2026-02-28');
    expect(calendarMonthsBetween('2024-02-29', secondBirthday)).toBeGreaterThanOrEqual(24);
  });

  it('every whole-month anniversary reads back as exactly that whole number', () => {
    const mismatches = [];
    for (const dob of ['2024-01-31', '2024-02-29', '2024-03-31', '2024-04-30',
                       '2025-05-31', '2026-01-30', '2026-10-31']) {
      for (let n = 0; n <= 240; n++) {
        const anniversary = addCalendarMonths(dob, n);
        const read = calendarMonthsBetween(dob, anniversary);
        if (read !== n) mismatches.push([dob, n, anniversary, read]);
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe('calendar P1-1: dates before the start still read as negative', () => {
  it('a dose dated after today is still a negative span, so future-dated doses stay detectable', () => {
    expect(calendarMonthsBetween('2026-03-01', '2026-02-01')).toBe(-1);
    expect(calendarMonthsBetween('2026-03-15', '2026-03-10')).toBeLessThan(0);
  });
});
