// P0-5 (fix queue 2026-09-15): a MenACWY booster given on its exact three-year
// anniversary was voided as "too soon", and the card re-offered it the same day.
//
// Reproduced: age 10, asplenia. D1 2020-11-15, D2 2021-01-15 (both confirmed
// high-risk), first booster 2024-01-15 — exactly three calendar years after D2.
//   was: D3 invalid — "Booster given only ~3 years after the previous dose.
//        High-risk MenACWY boosters must be spaced >=3 years. This dose is too
//        soon and does not count... repeat this dose only" — the dose dropped
//        from the count, and the card offering the first booster again TODAY.
//   is:  D3 valid, the next dose not due until 2029.
// Dated one day later (2024-01-16) the same dose already counted.
//
// The three-year span 2021-01-15 -> 2024-01-15 is 1095 days, because no 29
// February falls inside it. The code required DAYS.years(3) = 1096. Of 84
// monthly anniversaries sampled between 2018 and 2024, 22 are 1095 days.
//
// Same root cause as P0-4: an averaged constant used as a minimum. The fix
// reuses the same calendarIntervalElapsed() helper introduced there.
// DAYS.years(5) = 1826 happened to be safe (five-year spans are 1826-1827
// days), but it is moved to the calendar helper too so it cannot drift.
//
// Expected / source. CDC, "Meningococcal Vaccine Recommendations", fetched live
// 2026-09-15: "administering a booster dose 3 years after completion of the
// primary series and every 5 years thereafter". A dose given ON the three-year
// anniversary is given three years after. It is on time.
//
// CROSS-REPO: vaxapp carries the identical constant
// (src/logic/stateHelpers.js MENACWY_BOOSTER_3Y = 1096) and voids the same
// dose. That port is NOT in this commit — see the handoff. The vaccine-parity
// skill applies.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { addCalendarYears, addDays, daysBetween } from '../dateUtils.js';

const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

describe('P0-5: a booster on its exact three-year anniversary counts', () => {
  // Age 10 today (2026-09-15 would make them older; use the audit's own dates).
  const TODAY = '2026-09-15';
  const doses = [{ date: '2020-11-15' }, { date: '2021-01-15' }, { date: '2024-01-15' }];

  it('the span really is 1095 days (no 29 February inside it)', () => {
    expect(daysBetween('2021-01-15', '2024-01-15')).toBe(1095);
  });

  it('the booster is valid, not voided', () => {
    const perDose = analyzeHistory('MenACWY', doses, 120, ['asplenia'], TODAY, allYes(3)).perDose;
    expect(perDose[2].status).toBe('valid');
    expect(perDose[2].effectiveDoseNum).toBe(3);
  });

  it('the card does not re-offer the booster today', () => {
    const r = recommend({
      today: TODAY, ageMonths: 120, riskIds: ['asplenia'],
      menacwyDoses: doses, menbDoses: [], riskAtDoseAnswers: { MenACWY: allYes(3) },
    }).menacwy[0];
    expect(r.dueToday).toBeFalsy();
    expect(r.earliestNextDate).toBe('2029-01-15');
  });

  it('control: a booster genuinely too soon is still voided', () => {
    // One day short of three years.
    const early = [{ date: '2020-11-15' }, { date: '2021-01-15' }, { date: '2024-01-14' }];
    const perDose = analyzeHistory('MenACWY', early, 120, ['asplenia'], TODAY, allYes(3)).perDose;
    expect(perDose[2].status).toBe('invalid');
  });
});

describe('P0-5: no three-year anniversary is rejected, whatever the start date', () => {
  // The 3-year first-booster cadence applies when the primary series completed
  // BEFORE age 7 (ACIP 2020 MMWR 69(RR-9) Table 4, "Aged <7 yrs"). So every
  // patient below is a child: dose 1 at age 4, dose 2 at age 5, first booster
  // at age 8, read at age 9. An adult's first booster is 5 years out, and that
  // cadence is exercised by its own case at the end.
  const childCase = (d2) => {
    const d1 = addCalendarYears(d2, -1);          // age 4
    const booster = addCalendarYears(d2, 3);      // age 8, exactly on time
    const today = addCalendarYears(booster, 1);   // age 9
    return { history: [{ date: d1 }, { date: d2 }, { date: booster }], today, ageMonths: 108, booster };
  };

  it('every monthly anniversary from 2018 to 2024 counts', () => {
    // The audit sampled 84 monthly anniversaries in this range and found 22
    // that are 1095 days — one day short of the 1096 the code demanded.
    const offenders = [];
    for (let y = 2018; y <= 2024; y += 1) {
      for (let m = 1; m <= 12; m += 1) {
        const d2 = `${y}-${String(m).padStart(2, '0')}-15`;
        const { history, today, ageMonths } = childCase(d2);
        const perDose = analyzeHistory('MenACWY', history, ageMonths, ['asplenia'], today, allYes(3)).perDose;
        if (perDose[2].status !== 'valid') {
          offenders.push(`${d2} -> ${history[2].date} (${daysBetween(d2, history[2].date)} d)`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('at least a fifth of those spans really are 1095 days', () => {
    // Confirms the sweep above is exercising the bug, not stepping around it.
    let short = 0;
    let total = 0;
    for (let y = 2018; y <= 2024; y += 1) {
      for (let m = 1; m <= 12; m += 1) {
        const d2 = `${y}-${String(m).padStart(2, '0')}-15`;
        total += 1;
        if (daysBetween(d2, addCalendarYears(d2, 3)) === 1095) short += 1;
      }
    }
    expect(total).toBe(84);
    expect(short).toBeGreaterThanOrEqual(17);
  });

  it('control: one day short of the anniversary is still too soon, every time', () => {
    const accepted = [];
    for (let y = 2018; y <= 2024; y += 1) {
      for (let m = 1; m <= 12; m += 1) {
        const d2 = `${y}-${String(m).padStart(2, '0')}-15`;
        const { history, today, ageMonths } = childCase(d2);
        history[2] = { date: addDays(history[2].date, -1) };
        const perDose = analyzeHistory('MenACWY', history, ageMonths, ['asplenia'], today, allYes(3)).perDose;
        if (perDose[2].status === 'valid') accepted.push(`${d2} -> ${history[2].date}`);
      }
    }
    expect(accepted).toEqual([]);
  });

  it('control: an adult whose series completed after age 7 still waits 5 years', () => {
    // Dose 1 at 20, dose 2 at 21, a "booster" at 24 — three years, but this
    // patient's first booster is due at five. Still too soon.
    const history = [{ date: '2018-01-15' }, { date: '2019-01-15' }, { date: '2022-01-15' }];
    const perDose = analyzeHistory('MenACWY', history, 300, ['asplenia'], '2026-09-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('invalid');
  });

  it('and that adult\u2019s booster at five years counts', () => {
    const history = [{ date: '2018-01-15' }, { date: '2019-01-15' }, { date: '2024-01-15' }];
    const perDose = analyzeHistory('MenACWY', history, 300, ['asplenia'], '2026-09-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('valid');
  });
});
