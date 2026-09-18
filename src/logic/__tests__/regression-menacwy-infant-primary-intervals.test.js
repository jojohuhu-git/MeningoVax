// P0-1 (fix queue 2026-09-17): the MenACWY infant primary series accepted doses
// 4 weeks apart, and offered the final primary dose with no age floor at all.
//
// TWO defects, one root cause — the interval numbers were hand-typed next to
// the series-total logic instead of being derived from it.
//
// Reproduced 2026-09-17 against the real engine, before the fix:
//
//   (a) Asplenia, DOB 2025-09-15, MenACWY 2025-12-15 (age 3 months) and
//       2026-01-12 (28 days later), both risk-timing prompts answered "Yes":
//         card: "Dose 3 (infant high-risk series)", due today
//         analyzeHistory: status=valid | valid, effective.length = 2
//       A dose 2 given at +56 days produced IDENTICAL output — the app could
//       not tell a correctly spaced series from an under-spaced one.
//       The card also printed the wrong rule in its own words:
//         "Continue the infant high-risk Menveo series (>=4 weeks between
//          primary doses; booster at ~12 months)"
//
//   (b) Worse, and not in the original finding: the FINAL primary dose was
//       offered on the same 4-week clock with no age floor. Asplenia, doses at
//       2, 4 and 6 months, patient aged 6.5 months:
//         card: "Dose 4 (infant high-risk series)", minIntervalDays 28,
//               dueToday TRUE
//       CDC puts that dose at >=12 weeks after the previous dose AND after the
//       first birthday. The app was telling the clinician to give the 12-month
//       dose to a six-month-old.
//
// SOURCES, both fetched live 2026-09-17.
//
// CDC child & adolescent immunization schedule notes, "Meningococcal serogroup
// A,C,W,Y vaccination", Special situations, Menveo. Verbatim:
//
//   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and
//    12 months)"
//   "Dose 1 at age 3-6 months: 3- or 4- dose series (dose 2 [and dose 3 if
//    applicable] at least 8 weeks after previous dose until a dose is received
//    at age 7 months or older, followed by an additional dose at least 12 weeks
//    later and after age 12 months)"
//   "Dose 1 at age 7-23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"
//   "Dose 1 at age 24+ months: 2-dose series at least 8 weeks apart"
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// ACIP 2020 MMWR 69(RR-9), the footnote to Tables 4-6 (extracted verbatim from
// the primary PDF, 2026-09-17) — this is the citation the code already carried
// for this rule:
//
//   "If MenACWY-CRM is initiated at ages 3-6 months, catch-up vaccination
//    includes doses at intervals of 8 weeks until the infant is aged >=7
//    months, at which time an additional dose is administered at age >=7
//    months, followed by a dose at least 12 weeks later and after the 1st
//    birthday."
//
// https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm
//
// WHERE THE 4 WEEKS CAME FROM. The same MMWR states a 4-week floor, but for a
// different purpose and — checked in the PDF — only in its MenB section:
//   "For situations in which a MenB dose or doses must be repeated, a minimum
//    interval of 4 weeks should be used between any 2 doses."
// A repeat-dose floor borrowed from MenB had become the MenACWY primary-series
// interval.
//
// OWNER DECISIONS, 2026-09-17 (reasoned readings where CDC is silent, not
// quotes — recorded as decisions in both rule documents):
//
//  1. The 2-month band also gets 8 weeks between the early doses. CDC prints
//     the schedule ("4 doses at 2, 4, 6, and 12 mos") but states no minimum
//     interval for that band; the printed schedule is itself 8 weeks apart and
//     the adjacent 3-6-month band requires 8 weeks explicitly.
//  2. The final primary dose carries the same ">=12 months old AND >=12 weeks
//     since the previous dose" test in BOTH the 2-month and 3-6-month bands —
//     one rule for "the final infant dose", not two.
//
// Fixtures deliberately use +51 days (56 - 5) for the "too soon" case, never
// +28. P1-1 of the same queue adds CDC's "<=4 days early is still valid" grace
// rule everywhere; at +28 these tests would keep passing but would have stopped
// testing the boundary they were written for.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { menacwyInfantNextDoseGate } from '../intervals.js';
import { fmtDate } from '../format.js';
import { addCalendarMonths } from '../dateUtils.js';
import { noteText } from '../../test-note-text.js';

const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

const card = (today, ageMonths, dates) => recommend({
  today, ageMonths, riskIds: ['asplenia'],
  menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(dates.length) },
}).menacwy[0];

const walk = (today, ageMonths, dates) =>
  analyzeHistory('MenACWY', dates.map((d) => ({ date: d })), ageMonths,
    ['asplenia'], today, allYes(dates.length));

const TODAY = '2026-09-15'; // TEST_TODAY; the suite's clock is pinned to it.

// DOB 2025-09-15, so the patient is exactly 12 months old on TEST_TODAY.
const D1_AT_3MO = '2025-12-15';
const PLUS_51D = '2026-02-04'; // 51 days after D1 — 5 days short of 8 weeks
const PLUS_56D = '2026-02-09'; // 56 days after D1 — exactly 8 weeks

describe('P0-1(a): the early primary gap is 8 weeks, not 4', () => {
  it('dose 2 given 51 days after dose 1 does NOT count', () => {
    const h = walk(TODAY, 12, [D1_AT_3MO, PLUS_51D]);
    expect(h.perDose[1].status).toBe('invalid');
    expect(h.effective.length).toBe(1);
  });

  it('the card still asks for dose 2 when dose 2 was too soon', () => {
    const c = card(TODAY, 12, [D1_AT_3MO, PLUS_51D]);
    expect(c.doseNum).toBe(2);
  });

  it('dose 2 given 56 days after dose 1 DOES count, and the card moves to dose 3', () => {
    const h = walk(TODAY, 12, [D1_AT_3MO, PLUS_56D]);
    expect(h.perDose[1].status).toBe('valid');
    expect(h.effective.length).toBe(2);
    expect(card(TODAY, 12, [D1_AT_3MO, PLUS_56D]).doseNum).toBe(3);
  });

  it('the under-spaced and correctly-spaced series no longer produce the same card', () => {
    const tooSoon = card(TODAY, 12, [D1_AT_3MO, PLUS_51D]);
    const correct = card(TODAY, 12, [D1_AT_3MO, PLUS_56D]);
    expect(tooSoon.doseNum).not.toBe(correct.doseNum);
  });

  // Owner decision 1: the 2-month band gets the same 8 weeks.
  it('a 2-month start also requires 8 weeks between the early doses', () => {
    // DOB 2026-01-15 -> age 8 months on TEST_TODAY. D1 at 2 months.
    const d1 = '2026-03-15';
    expect(walk(TODAY, 8, [d1, '2026-05-05']).perDose[1].status).toBe('invalid'); // +51d
    expect(walk(TODAY, 8, [d1, '2026-05-10']).perDose[1].status).toBe('valid');   // +56d
  });
});

describe('P0-1(b): the final primary dose needs 12 weeks AND the first birthday', () => {
  // DOB 2026-02-15 -> age ~7 months on TEST_TODAY. Doses at 2, 4 and 6 months.
  const SIX_MO_PATIENT = { ageMonths: 7, dates: ['2026-04-15', '2026-06-15', '2026-08-15'] };

  it('dose 4 is NOT due today for a 7-month-old three doses in', () => {
    const c = card(TODAY, SIX_MO_PATIENT.ageMonths, SIX_MO_PATIENT.dates);
    expect(c.doseNum).toBe(4);
    expect(c.dueToday).toBe(false);
  });

  it('dose 4 is gated on 12 weeks, not 4', () => {
    const c = card(TODAY, SIX_MO_PATIENT.ageMonths, SIX_MO_PATIENT.dates);
    expect(c.minIntervalDays).toBe(84);
  });

  // Live-observed while verifying this fix: the card correctly said "not before
  // 12 months of age" and then advertised a date two months before the first
  // birthday, because earliestNextDate was the interval alone. The date has to
  // answer the same rule the sentence states.
  it('the advertised date waits for the first birthday, not just the interval', () => {
    const c = card(TODAY, SIX_MO_PATIENT.ageMonths, SIX_MO_PATIENT.dates);
    // Patient is 7 months old on TEST_TODAY (2026-09-15), so 12 months falls on
    // 2027-02-15. Twelve weeks after the last dose (2026-08-15) is 2026-11-07,
    // which is far too early.
    expect(c.earliestNextDate).toBe('2027-02-15');
  });

  it('once the child is past 12 months the interval alone decides', () => {
    // DOB 2025-09-15 (12mo today). Three doses; the last one 4 weeks ago, so
    // the 12-week interval is what is still outstanding, not the age.
    const c = card(TODAY, 12, ['2025-12-15', '2026-02-09', '2026-08-18']);
    expect(c.earliestNextDate).toBe('2026-11-10'); // 2026-08-18 + 84 days
  });

  it('a final dose given before the first birthday does not count (3-6mo band)', () => {
    // DOB 2025-09-15 (12mo today). D1 3mo, D2 5mo, D3 7mo, D4 at 11 months —
    // 12+ weeks after D3 but under a year old.
    const h = walk(TODAY, 12, ['2025-12-15', '2026-02-15', '2026-04-15', '2026-08-15']);
    expect(h.perDose[3].status).toBe('invalid');
  });

  it('a final dose given before the first birthday does not count (2mo band)', () => {
    // DOB 2025-09-15. D1 2mo, D2 4mo, D3 6mo, D4 at 11 months.
    const h = walk(TODAY, 12, ['2025-11-15', '2026-01-15', '2026-03-15', '2026-08-15']);
    expect(h.perDose[3].status).toBe('invalid');
  });

  it('a final dose at 12 months but only 8 weeks after the previous does not count', () => {
    // DOB 2025-09-15. D1 3mo, D2 5mo, D3 at 10 months, D4 at 12 months (56d later).
    const h = walk(TODAY, 12, ['2025-12-15', '2026-02-15', '2026-07-15', '2026-09-09']);
    expect(h.perDose[3].status).toBe('invalid');
  });

  it('a final dose at 12 months and 12+ weeks after the previous DOES count', () => {
    // DOB 2025-09-15. D1 3mo, D2 5mo, D3 at 7mo, D4 at 12 months.
    const h = walk(TODAY, 12, ['2025-12-15', '2026-02-15', '2026-04-15', '2026-09-15']);
    expect(h.perDose[3].status).toBe('valid');
    expect(h.effective.length).toBe(4);
  });
});

// P0-1a (2026-09-17, same day): the earliestNextDate this fix introduced was
// MALFORMED for any patient whose age in months is not a whole number.
//
// earliestGatedDate() did `addCalendarMonths(today, minAgeMonths - ageMonths)`,
// and that subtraction is fractional for almost every real patient — ageMonths
// comes from calendarMonthsBetween(dob, today), which carries a day remainder.
// addCalendarMonths() assumes a whole number of months, so the fraction
// survived into the string it builds:
//
//   ageMonths 6.5  -> "2027-2.5-17"
//   ageMonths 6.43 -> "2027-2.5700000000000003-17"
//   ageMonths 8.2  -> "2026-12.8-17"
//   ageMonths 7    -> "2027-02-17"   <- only whole ages were right
//
// fmtDate() then does months[m - 1], i.e. months[1.5] === undefined, and the
// card rendered "Next dose not yet due - eligible undefined 17, 2027".
//
// The GATING was always correct — dueToday stayed false and the note still said
// "not before 12 months of age". Only the printed date was wrong. But it shipped
// to the live site on the exact card P0-1 was written to fix, and it hit nearly
// every at-risk infant mid-series, because a whole-number age is the rare case.
//
// WHY THE ORIGINAL TESTS MISSED IT, worth keeping: the fixture above used
// ageMonths 7 and the live check used a DOB exactly seven months before today.
// Both are whole numbers — the one input shape that works. A fixture chosen for
// arithmetic convenience tested the only case that could not fail. Every test
// below uses a FRACTIONAL age on purpose.
describe('P0-1a: the advertised date is a real date for a real patient', () => {
  const doses = ['2026-05-04', '2026-07-04', '2026-09-04'];
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  it.each([6.5, 6.43, 8.2, 7, 11.97])('ageMonths %s yields a well-formed date', (am) => {
    const c = card(TODAY, am, doses);
    expect(c.earliestNextDate).toMatch(ISO);
  });

  it('the rendered date never reads "undefined"', () => {
    for (const am of [6.5, 6.43, 8.2, 11.97]) {
      expect(fmtDate(card(TODAY, am, doses).earliestNextDate)).not.toMatch(/undefined/);
    }
  });

  it('the date is never advertised before the child turns 12 months', () => {
    // A child 6.5 months old on TEST_TODAY (2026-09-15) reaches 12 months about
    // 5.5 months from now: five whole months to 2027-02-15, then half of
    // February's 28 days on top. Rounding the remainder DOWN would advertise a
    // date before the birthday and invite a dose that does not count, so it
    // rounds up.
    const c = card(TODAY, 6.5, doses);
    expect(c.earliestNextDate).toBe('2027-03-01');
    expect(c.earliestNextDate > '2027-02-15').toBe(true);
  });

  it('the gating itself was never wrong and still is not', () => {
    for (const am of [6.5, 6.43, 8.2]) {
      const c = card(TODAY, am, doses);
      expect(c.dueToday).toBe(false);
      expect(c.doseNum).toBe(4);
    }
  });

  it('a whole-number age still gives the same answer as before', () => {
    // Guards against "fixing" the fraction by changing the whole-month case too.
    // TEST_TODAY + 5 whole months. Measured from today, not from the last dose.
    expect(card(TODAY, 7, doses).earliestNextDate).toBe('2027-02-15');
  });
});

describe('P0-1a: addCalendarMonths can no longer emit a malformed date', () => {
  // The real defect was one caller passing a fraction, but the function built a
  // string out of it silently. It is a shared date primitive, so it now refuses
  // to produce something that is not a date, whatever it is handed.
  it('a fractional month count still yields a well-formed ISO date', () => {
    expect(addCalendarMonths('2026-09-17', 5.5)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('whole month counts are completely unchanged', () => {
    expect(addCalendarMonths('2026-09-17', 5)).toBe('2027-02-17');
    expect(addCalendarMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addCalendarMonths('2026-09-17', -5)).toBe('2026-04-17');
  });
});

describe('P0-1: the card states the number the validator enforces', () => {
  it('no infant card promises 4 weeks any more', () => {
    const cards = [
      card(TODAY, 3, []),                                   // start, 3mo
      card(TODAY, 12, [D1_AT_3MO, PLUS_56D]),               // mid-series
      card(TODAY, 7, ['2026-04-15', '2026-06-15', '2026-08-15']), // final dose
    ];
    for (const c of cards) {
      expect(noteText(c)).not.toMatch(/4 weeks between primary doses/);
      expect(noteText(c)).not.toMatch(/≥4 weeks/);
    }
  });

  it('the start card and the continuation card both say 8 weeks', () => {
    expect(noteText(card(TODAY, 3, []))).toMatch(/8 weeks/);
    expect(noteText(card(TODAY, 12, [D1_AT_3MO, PLUS_56D]))).toMatch(/8 weeks/);
  });

  it('the note number is interpolated from the same gate the engine uses', () => {
    const gate = menacwyInfantNextDoseGate({ d1AgeM: 3, d2AgeM: null, given: 1 });
    const c = card(TODAY, 12, [D1_AT_3MO, PLUS_56D]);
    expect(c.minIntervalDays).toBe(gate.minIntervalDays);
    expect(noteText(c)).toContain(`${gate.minIntervalDays / 7} weeks`);
  });
});

describe('P0-1: the interval gate agrees with the series total', () => {
  it('a 2-month start: early doses 8 weeks, dose 4 is the final one', () => {
    expect(menacwyInfantNextDoseGate({ d1AgeM: 2, d2AgeM: 4, given: 1 }))
      .toMatchObject({ minIntervalDays: 56, minAgeMonths: null, isFinalPrimary: false });
    expect(menacwyInfantNextDoseGate({ d1AgeM: 2, d2AgeM: 4, given: 3 }))
      .toMatchObject({ minIntervalDays: 84, minAgeMonths: 12, isFinalPrimary: true });
  });

  it('a 3-6mo start whose dose 2 came at >=7mo makes dose 3 the final one', () => {
    expect(menacwyInfantNextDoseGate({ d1AgeM: 3, d2AgeM: 8, given: 2 }))
      .toMatchObject({ minIntervalDays: 84, minAgeMonths: 12, isFinalPrimary: true });
  });

  it('a 7-23mo start makes dose 2 the final one', () => {
    expect(menacwyInfantNextDoseGate({ d1AgeM: 9, d2AgeM: null, given: 1 }))
      .toMatchObject({ minIntervalDays: 84, minAgeMonths: 12, isFinalPrimary: true });
  });

  // The edge case the owner resolved. Read hyper-literally, CDC's "8 weeks
  // apart UNTIL a dose is received at age >=7 months, followed by an additional
  // dose" would demand a FIFTH dose here: D1 at exactly 3 months with every gap
  // at the bare minimum puts D3 at ~6.7 months, still under 7. CDC caps the
  // series at "3- or 4-dose", so we stop at four and let the final dose (>=12
  // months, therefore >=7 months) satisfy the condition.
  //
  // DO NOT "FIX" THIS BACK. It never gives fewer doses than CDC intends.
  it('the bare-minimum 3-month start completes in exactly 4 doses', () => {
    // DOB 2025-09-15. D1 at 3mo (2025-12-15), D2 +56d, D3 +56d (~6.7mo),
    // D4 at 12 months.
    const dates = ['2025-12-15', '2026-02-09', '2026-04-06', '2026-09-15'];
    const h = walk(TODAY, 12, dates);
    expect(h.perDose.every((d) => d.status === 'valid')).toBe(true);
    expect(h.effective.length).toBe(4);
    // Series complete: the next MenACWY dose is a booster, not a fifth primary.
    expect(card(TODAY, 12, dates).doseLabel).toMatch(/Booster/i);
  });
});
