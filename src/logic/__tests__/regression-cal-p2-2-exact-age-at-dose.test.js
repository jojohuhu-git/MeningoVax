// Calendar P2-2 — how old the patient was at a past dose, worked out exactly.
//
// The queue item is in docs/archive/fix-2026-09-17-calendar-and-dates.md. The
// app computed the age at a past dose by SUBTRACTION:
//
//   ageAtDose = ageMonths - calendarMonthsBetween(doseDate, today)
//
// Both of those terms are exact, but they are measured between DIFFERENT pairs
// of month-anniversaries — the patient's, and the dose's. Subtracting one from
// the other mixes two rulers. Measured over 50,845 (date of birth x dose date x
// today) samples the answer is out by up to 2.946 days, and more than a day out
// in 2.9% of them.
//
// A grace absorbs this where dose VALIDITY is concerned: ageMeetsMinimum()
// allows CDC's 4 days, which is wider than the error. The infant band tests are
// not validity checks and have no grace — they are plain comparisons that decide
// HOW MANY DOSES a child needs — so the error lands directly on the dose count,
// in both directions:
//
//   Too many. A baby born 29 July 2024 given dose 1 on 28 February 2025 — the
//   date the app's own addCalendarMonths() calls their seven-month anniversary,
//   clamped because February has no 29th — was read as 6.97 months old. That put
//   them below the 7-month band, so the app asked for a FOUR-dose series where
//   CDC asks for two. Two extra injections, for a dose given on time.
//
//   Too few. A baby born 31 January 2024 whose dose 2 fell on 30 August 2024 was
//   truly 6.97 months old — a day short of seven — but the subtraction read
//   exactly 7.0000, so the app granted CDC's "3- or 4- dose" shortcut and closed
//   the series a dose early.
//
// Now that the date of birth is kept (calendar P1-3, PR #42) the exact answer is
// available directly: calendarMonthsBetween(dob, doseDate), measured between the
// patient's own anniversaries, the same ruler the rest of the app uses. A
// patient entered as years/months has no birthday to measure from, so the
// subtraction stays for them — unchanged, and no more precise than it can be.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { ageAtDoseMonths } from '../patientAge.js';
import { calendarMonthsBetween, addCalendarMonths } from '../dateUtils.js';

const card = ({ today, dob, ageMonths, dates }) => recommend({
  today, dob, ageMonths, riskIds: ['asplenia'],
  menacwyDoses: dates.map((date) => ({ date })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: Object.fromEntries(dates.map((_, i) => [i, 'yes'])) },
}).menacwy[0];

describe('the number itself', () => {
  it('reads a dose given on a month-anniversary as that whole number of months', () => {
    // 29 July has no 29 February to land on, so the app clamps the anniversary
    // to the 28th. Whatever date addCalendarMonths() calls the anniversary, the
    // age at that date must read back as exactly that many months.
    expect(addCalendarMonths('2024-07-29', 7)).toBe('2025-02-28');
    expect(ageAtDoseMonths({ date: '2025-02-28' }, { dob: '2024-07-29' }, '2026-09-15')).toBe(7);
  });

  it('does not drift with the date the clinician happens to be looking', () => {
    const at = (today) => ageAtDoseMonths({ date: '2025-02-28' }, { dob: '2024-07-29' }, today);
    expect(at('2026-09-15')).toBe(at('2026-02-28'));
    expect(at('2026-09-15')).toBe(at('2027-12-31'));
  });

  it('matches the queue\'s worst measured case exactly', () => {
    // Born 31 January 2010, dose on 28 February 2013, viewed 31 January 2026.
    // The subtraction said 36.903 months — 2.9 days short of the truth.
    expect(ageAtDoseMonths({ date: '2013-02-28' }, { dob: '2010-01-31' }, '2026-01-31')).toBe(37);
  });

  it('stays negative for a dose dated before birth, which is how it is detected', () => {
    expect(ageAtDoseMonths({ date: '2024-01-01' }, { dob: '2024-06-01' }, '2026-09-15'))
      .toBeLessThan(0);
  });

  it('falls back to the subtraction when there is no date of birth', () => {
    const noDob = ageAtDoseMonths({ date: '2025-02-28' }, { ageMonths: 25.5 }, '2026-09-15');
    const bySubtraction = Math.round((25.5 - calendarMonthsBetween('2025-02-28', '2026-09-15')) * 1e6) / 1e6;
    expect(noDob).toBe(bySubtraction);
  });
});

describe('too many doses · a dose given exactly on the 7-month anniversary', () => {
  const patient = { today: '2026-09-15', dob: '2024-07-29', dates: ['2025-02-28'] };

  it('puts the child in CDC\'s 7-23-month band, which is a 2-dose series', () => {
    expect(card(patient).seriesTotal).toBe(2);
  });

  it('does not ask for the four doses a younger infant needs', () => {
    const c = card(patient);
    expect(c.seriesTotal).not.toBe(4);
    expect(c.doseLabel).not.toMatch(/of 4/);
  });
});

describe('too few doses · a dose 2 a day short of seven months', () => {
  const patient = { today: '2026-02-28', dob: '2024-01-31', dates: ['2024-04-30', '2024-08-30'] };

  it('is truly under 7 months, whatever the subtraction said', () => {
    expect(calendarMonthsBetween('2024-01-31', '2024-08-30')).toBeLessThan(7);
    expect(ageAtDoseMonths({ date: '2024-08-30' }, { dob: '2024-01-31' }, '2026-02-28'))
      .toBeLessThan(7);
  });

  it('does not get the 3-dose shortcut, which that dose did not earn', () => {
    const c = card(patient);
    expect(c.seriesTotal).toBe(4);
    expect(c.doseLabel).not.toMatch(/shortcut/);
  });
});

describe('what must NOT change', () => {
  it('a years/months patient is answered exactly as before', () => {
    const c = card({ today: '2026-09-15', ageMonths: 25, dates: ['2025-02-28'] });
    expect(c.seriesTotal).toBe(4);
    expect(c.doseLabel).toMatch(/Dose 2/);
  });

  it('a dose on a plain anniversary is unaffected either way', () => {
    // 15 January is a date every month has, so both methods already agreed.
    const c = card({ today: '2026-09-15', dob: '2024-01-15', dates: ['2024-08-15'] });
    expect(c.seriesTotal).toBe(2);
  });
});
