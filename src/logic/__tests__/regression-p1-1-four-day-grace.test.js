// P1-1 (fix queue 2026-09-17): CDC's "4 days early is still valid" rule was
// implemented nowhere, so every age gate and every interval in the app was a
// hard edge and the app advised repeating doses ACIP counts.
//
//   grep -rniE "grace|4 days|GRACE_DAYS" src/logic src/data  ->  no matches
//
// Reproduced 2026-09-17 against the real validator, before the fix. Healthy
// patient, 193 months old (16y1m), dose 1 at age 11, dose 2 given three days
// before the 16th birthday. A dose 3 days early and a dose 5 days early were
// graded IDENTICALLY — both set aside:
//
//   "Given at ~16 years, before the age-16 booster window. Safe, but does not
//    count toward the routine series - the routine booster is still due at 16."
//
// SOURCE, fetched live 2026-09-17, from the same schedule-notes page the app
// already cites. Verbatim:
//
//   "Vaccine doses administered <=4 days before the minimum age or interval are
//    considered valid. Doses of any vaccine administered >=5 days earlier than
//    the minimum age or minimum interval should not be counted as valid and
//    should be repeated as age appropriate."
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// OWNER DECISION 2026-09-17: apply it everywhere, through ONE shared helper, so
// it cannot be applied inconsistently. The helpers live in intervals.js next to
// the other gates: intervalMeetsMinimum (day counts),
// calendarIntervalMeetsMinimum (calendar months) and ageMeetsMinimum (ages).
//
// TWO PLACES IT DELIBERATELY DOES NOT APPLY, both guarded at the bottom of this
// file:
//
//  1. The SCHEDULER. recommend.js's "due today" and "earliest next date" keep
//     the real minimum. Granting grace there would make the app advertise a
//     date four days early and actively advise giving doses before the minimum
//     interval — which is not what CDC's sentence permits. The app says
//     "eligible on the 9th" and ACCEPTS a dose given on the 5th.
//
//  2. The SERIES-LENGTH tests. Whether MenB dose 2 counts as "early" decides
//     whether a rescue dose 3 is owed. That is a question about how many doses
//     the series has, not about whether a dose was valid, and granting grace
//     would REMOVE a dose from the plan. The clinical authority rule is
//     explicit that we never adopt a reading giving fewer doses.
//
// Ages are not converted with an averaged days-per-month constant: 4 days is
// 4/28 of a month in February and 4/31 in March, and P0-4/P0-5 are both bugs
// caused by exactly that kind of averaging. ageMeetsMinimum re-derives the age
// as if the dose had been given 4 days later, using the same calendar
// arithmetic that produced the age.

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import {
  GRACE_DAYS, intervalMeetsMinimum, calendarIntervalMeetsMinimum, ageMeetsMinimum,
} from '../intervals.js';
import { menbSeriesInfo } from '../seriesTotals.js';

const TODAY = '2026-09-15'; // TEST_TODAY
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

const walk = (vaccine, dates, ageMonths, riskIds = []) =>
  analyzeHistory(vaccine, dates.map((d) => ({ date: d })), ageMonths, riskIds,
    TODAY, allYes(dates.length));

describe('P1-1: the helper draws CDC’s line in exactly one place', () => {
  it('is four days', () => {
    expect(GRACE_DAYS).toBe(4);
  });

  it('a day interval: 4 days early counts, 5 does not', () => {
    expect(intervalMeetsMinimum(52, 56)).toBe(true);  // 8 weeks, 4 days early
    expect(intervalMeetsMinimum(51, 56)).toBe(false); // 5 days early
    expect(intervalMeetsMinimum(56, 56)).toBe(true);
  });

  it('a calendar interval: 4 days early counts, 5 does not', () => {
    // Six calendar months from 2026-01-15 is 2026-07-15.
    expect(calendarIntervalMeetsMinimum('2026-01-15', 6, '2026-07-11')).toBe(true);
    expect(calendarIntervalMeetsMinimum('2026-01-15', 6, '2026-07-10')).toBe(false);
  });

  it('an age: 4 days before the birthday counts, 5 days does not', () => {
    // Patient is 193 months old on TEST_TODAY; the 16th birthday is 2026-08-15.
    const at = (doseDate) =>
      ageMeetsMinimum(0, 192, { doseDate, ageMonths: 193, today: TODAY });
    expect(at('2026-08-11')).toBe(true);  // 4 days early
    expect(at('2026-08-10')).toBe(false); // 5 days early
  });
});

describe('P1-1: the reported case — a dose just before the 16th birthday', () => {
  // Healthy. DOB 2010-08-15, so the 16th birthday is 2026-08-15 and the patient
  // is 193 months old today. Dose 1 at age 11.
  const D1 = '2021-08-15';
  const counts = (d2) => !walk('MenACWY', [D1, d2], 193).perDose[1].notAdolescentCount;

  it('three days before the birthday now counts', () => {
    expect(counts('2026-08-12')).toBe(true);
  });

  it('four days before the birthday counts', () => {
    expect(counts('2026-08-11')).toBe(true);
  });

  it('five days before the birthday still does not', () => {
    expect(counts('2026-08-10')).toBe(false);
  });

  it('and the patient is no longer told to repeat a dose ACIP counts', () => {
    const c = recommend({
      today: TODAY, ageMonths: 193, riskIds: [],
      menacwyDoses: [{ date: D1 }, { date: '2026-08-12' }], menbDoses: [],
    }).menacwy[0];
    expect(c.status).not.toBe('due');
    expect(c.dueToday).toBeFalsy();
  });
});

describe('P1-1: the grace reaches intervals too, not only ages', () => {
  it('a MenACWY high-risk dose 2 four days short of 8 weeks counts', () => {
    // 2025-01-15 + 56 days = 2025-03-12. Four days earlier is 2025-03-08.
    expect(walk('MenACWY', ['2025-01-15', '2025-03-08'], 300, ['asplenia'])
      .perDose[1].status).toBe('valid');
  });

  it('five days short still does not', () => {
    expect(walk('MenACWY', ['2025-01-15', '2025-03-07'], 300, ['asplenia'])
      .perDose[1].status).toBe('invalid');
  });

  it('an infant series dose 2 four days short of 8 weeks counts (P0-1 gate)', () => {
    // DOB 2025-09-15, D1 at 3 months. 8 weeks on is 2026-02-09.
    expect(walk('MenACWY', ['2025-12-15', '2026-02-05'], 12, ['asplenia'])
      .perDose[1].status).toBe('valid');
    expect(walk('MenACWY', ['2025-12-15', '2026-02-04'], 12, ['asplenia'])
      .perDose[1].status).toBe('invalid');
  });
});

describe('P1-1: the grace does NOT reach the scheduler', () => {
  // The app must still advertise the real minimum. Accepting a dose given four
  // days early is not the same as advising one.
  it('the advertised date is the true minimum, not four days sooner', () => {
    // DOB 2026-02-15 -> 7 months old. Three doses; the final one needs the
    // first birthday, which is 2027-02-15.
    const c = recommend({
      today: TODAY, ageMonths: 7, riskIds: ['asplenia'],
      menacwyDoses: [{ date: '2026-04-15' }, { date: '2026-06-15' }, { date: '2026-08-15' }],
      menbDoses: [], riskAtDoseAnswers: { MenACWY: allYes(3) },
    }).menacwy[0];
    expect(c.earliestNextDate).toBe('2027-02-15');
    expect(c.dueToday).toBe(false);
  });
});

describe('P1-1: the grace does NOT shorten a series', () => {
  // Granting grace on a series-LENGTH test would drop a dose from the plan.
  it('a healthy MenB dose 2 four days short of 6 months still owes a rescue dose', () => {
    // Six calendar months from 2026-01-15 is 2026-07-15; four days earlier is
    // 2026-07-11. That dose is valid, but the series is still three doses.
    expect(menbSeriesInfo({
      highRisk: false,
      doses: [{ date: '2026-01-15' }, { date: '2026-07-11' }],
    }).total).toBe(3);
  });

  it('a high-risk MenB dose 2 four days short of 6 months still owes dose 3', () => {
    // P1-2's exception must not be triggered by the grace rule.
    expect(menbSeriesInfo({
      highRisk: true,
      doses: [{ date: '2026-01-15' }, { date: '2026-07-11' }],
    }).total).toBe(3);
  });
});
