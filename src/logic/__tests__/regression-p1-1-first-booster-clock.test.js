// P1-1 (fix queue 2026-09-15): the first MenACWY booster is due three years
// after the PRIMARY SERIES is complete — not three years after dose 2 in every
// schedule, and not five years because the app lost count.
//
// Reproduced before the fix: a 3-year-old with asplenia, MenACWY at 2, 4, 6 and
// 12 months, no booster yet. The app said "Booster (dose 5, every 5 years)" and
// dated the next dose five years out. It should be the FIRST booster, three
// years after the 12-month dose that completed the series.
//
// Two causes, fixed in two commits:
//   P0-1  the patient was routed to the >=2-year branch at all (their series
//         total collapsed from 4 to 2, so four doses looked like a completed
//         2-dose series plus two boosters already taken).
//   P1-1  that branch computed `isFirstBooster = given === 2` and read the
//         completion age off `doses[1]` — a hand-typed "the primary series is
//         always 2 doses". It now derives the boundary from seriesTotals.js,
//         the same module the validator reads (validate.js starts the booster
//         phase at effectiveIdx === primaryTotal).
//
// Source, fetched live 2026-09-15 — CDC, "Meningococcal Vaccine
// Recommendations": "a booster dose 3 years after completion of the primary
// series and every 5 years thereafter" (children under 7).
// ACIP 2020 MMWR 69(RR-9) Table 4, MenACWY: "Aged <7 yrs: Single dose at 3 yrs
// after primary vaccination and every 5 yrs thereafter".

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DAYS } from '../dateUtils.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const run = (ageMonths, dates, riskIds = ['asplenia']) => recommend({
  today: TODAY, ageMonths, riskIds,
  menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(dates.length) },
}).menacwy[0];

describe('P1-1: the first booster after an infant series is 3 years out, not 5', () => {
  // DOB 2023-09-15; doses at 2, 4, 6 and 12 months. Child is 3 today.
  const infantSeries = ['2023-11-15', '2024-01-15', '2024-03-15', '2024-09-15'];

  it('the card names it the FIRST booster', () => {
    expect(run(36, infantSeries).doseLabel).toMatch(/first booster/i);
  });

  it('it is due 3 years after the dose that completed the series, not 5', () => {
    const r = run(36, infantSeries);
    expect(r.minIntervalDays).toBe(DAYS.years(3));
    expect(r.earliestNextDate.slice(0, 4)).toBe('2027');
  });
});

describe('P1-1: the boundary comes from the shared primary total, not a literal 2', () => {
  it('a series begun at 2 years still has its first booster after dose 2', () => {
    // Dose 1 at 24 months, dose 2 ten weeks later. Child is 5 today.
    const r = run(60, ['2023-09-15', '2023-11-30']);
    expect(r.doseLabel).toMatch(/first booster/i);
    expect(r.minIntervalDays).toBe(DAYS.years(3)); // completed well before age 7
  });

  it('a second booster is on the 5-year cadence, not the 3-year one', () => {
    // Same start, plus a first booster three years later. Child is 8 today.
    // The booster is dated 2023-12-15, a fortnight past the three-year mark,
    // deliberately: dated exactly three years out (2023-11-30) the validator
    // voids it, because MENACWY_BOOSTER_3Y is 1096 days and that real calendar
    // span is 1095. That is queue item P0-5 and is fixed there, not here — this
    // test is about the first/subsequent boundary, so it steers clear of it.
    const r = run(96, ['2020-09-15', '2020-11-30', '2023-12-15']);
    expect(r.doseLabel).not.toMatch(/first booster/i);
    expect(r.minIntervalDays).toBe(DAYS.years(5));
  });

  it('a primary series completed at or after age 7 waits 5 years for the first booster', () => {
    // Dose 1 at age 8, dose 2 ten weeks later. Patient is 12 today.
    const r = run(144, ['2022-09-15', '2022-11-30']);
    expect(r.doseLabel).toMatch(/first booster/i);
    expect(r.minIntervalDays).toBe(DAYS.years(5));
  });

  it('an infant series completed before age 7 gets 3 years even though 4 doses are on record', () => {
    // The pre-fix failure mode: 4 doses looked like "well past dose 2", so the
    // app skipped the first-booster rule entirely and used the 5-year cadence.
    expect(run(36, ['2023-11-15', '2024-01-15', '2024-03-15', '2024-09-15']).minIntervalDays)
      .toBe(DAYS.years(3));
  });
});
