// P0-4 (fix queue 2026-09-15): six calendar months apart IS "at least 6 months
// apart". The app was calling it early and demanding an extra injection.
//
// Reproduced: a healthy 19-year-old, Bexsero on 2025-01-15 and 2025-07-15 —
// exactly six calendar months, and 181 days.
//   was: "Dose 3 of 3 (rescue: dose 2 given early)", due today. The series
//        total flipped from 2 to 3 and the dose's own reason line read "Dose 2
//        was given ~6 months after dose 1, less than the 6-month standard
//        interval".
//   is:  "Complete (2-dose series)".
// Moving dose 2 two days later (2025-07-17) already gave the right answer, so
// the app's verdict turned on which month the patient happened to start in.
//
// Frequency: of 36 start dates sampled across 2025, 18 produce a six-calendar-
// month gap shorter than the 183 days the code required.
//
// Two more places, same root:
//   high-risk MenB D3 "≥6 months from D1": 2019-01-15 → 2019-07-15 was invalid.
//   high-risk MenB D3 "≥4 months from D2": 2023-01-15 → 2023-05-15 was invalid.
//
// Cause. dateUtils.js's DAYS.months(m) = Math.round(m * 30.4375), so six months
// was 183 days and four months 122, while real calendar spans are 181-184 and
// 120-123 days. Any real six-month gap starting in a short-month stretch fell
// under the threshold. The same file's calendarMonthsBetween() already warns
// about exactly this drift for AGE thresholds; the interval minimums had never
// been given the same treatment.
//
// Expected / source. CDC child & adolescent schedule notes, MenB, fetched live
// 2026-09-15:
//   "2-dose series at least 6 months apart (if dose 2 is administered earlier
//    than 6 months, administer dose 3 at least 4 months after dose 2)"
// Six calendar months apart IS "at least 6 months apart". It is not "earlier
// than 6 months".
//
// Week-based minimums (4, 8, 12 weeks) are exact counts of days and are
// deliberately left alone.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { menbSeriesInfo } from '../seriesTotals.js';
import { addCalendarMonths, calendarIntervalElapsed } from '../dateUtils.js';

const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

describe('P0-4: the calendar-month helper itself', () => {
  it('adds whole calendar months', () => {
    expect(addCalendarMonths('2025-01-15', 6)).toBe('2025-07-15');
    expect(addCalendarMonths('2023-01-15', 4)).toBe('2023-05-15');
    expect(addCalendarMonths('2025-09-15', 36)).toBe('2028-09-15');
  });

  it('clamps to the last day of a shorter month', () => {
    expect(addCalendarMonths('2025-01-31', 1)).toBe('2025-02-28');
    expect(addCalendarMonths('2024-01-31', 1)).toBe('2024-02-29'); // leap year
    expect(addCalendarMonths('2025-03-31', 1)).toBe('2025-04-30');
  });

  it('treats the anniversary itself as elapsed', () => {
    expect(calendarIntervalElapsed('2025-01-15', 6, '2025-07-15')).toBe(true);
    expect(calendarIntervalElapsed('2025-01-15', 6, '2025-07-14')).toBe(false);
    expect(calendarIntervalElapsed('2020-11-30', 36, '2023-11-30')).toBe(true);
  });

  it('is not fooled by the month the patient started in', () => {
    // Every start date of 2025, six months on: all must count as elapsed,
    // whether the span is 181 days or 184.
    for (let m = 1; m <= 12; m += 1) {
      for (const d of [1, 15, 28]) {
        const start = `2025-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        expect(calendarIntervalElapsed(start, 6, addCalendarMonths(start, 6))).toBe(true);
      }
    }
  });
});

describe('P0-4: a healthy MenB series six calendar months apart is complete', () => {
  const doses = [{ date: '2025-01-15' }, { date: '2025-07-15' }]; // 181 days
  const run = () => recommend({
    today: '2026-09-15', ageMonths: 228, riskIds: [],
    menacwyDoses: [], menbDoses: doses, riskAtDoseAnswers: { MenB: allYes(2) },
  }).menb[0];

  it('the series stays a 2-dose series', () => {
    expect(menbSeriesInfo({ highRisk: false, doses })).toMatchObject({ total: 2, primaryTotal: 2 });
  });

  it('no rescue dose is demanded', () => {
    const r = run();
    expect(r.status).toBe('complete');
    expect(r.doseLabel).not.toMatch(/rescue/i);
    expect(r.dueToday).toBeFalsy();
  });

  it('dose 2 is not annotated as given early', () => {
    const perDose = analyzeHistory('MenB', doses, 228, [], '2026-09-15', allYes(2)).perDose;
    expect((perDose[1].reasons || []).join(' ')).not.toMatch(/less than the 6-month/i);
  });

  it('control: a genuinely early dose 2 still triggers the rescue dose', () => {
    // Five calendar months — really is earlier than six.
    const early = [{ date: '2025-01-15' }, { date: '2025-06-15' }];
    expect(menbSeriesInfo({ highRisk: false, doses: early })).toMatchObject({ total: 3 });
  });
});

describe('P0-4: high-risk MenB dose 3 on the calendar anniversary is valid', () => {
  it('≥6 months from D1: 2019-01-15 → 2019-07-15 counts', () => {
    const doses = [{ date: '2019-01-15' }, { date: '2019-03-15' }, { date: '2019-07-15' }];
    const perDose = analyzeHistory('MenB', doses, 300, ['asplenia'], '2026-09-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('valid');
  });

  it('≥4 months from D2: 2023-01-15 → 2023-05-15 counts', () => {
    const doses = [{ date: '2022-06-15' }, { date: '2023-01-15' }, { date: '2023-05-15' }];
    const perDose = analyzeHistory('MenB', doses, 300, ['asplenia'], '2026-09-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('valid');
  });

  it('control: a dose genuinely too soon is still invalid', () => {
    // MenB dose-3 rescue (2026-09-17): this control used to be D2 2023-03-15,
    // putting D3 only three months after dose 2 — which CDC now has us CREDIT,
    // with a 4th dose to follow, so it stopped being a control. Moved D2 a month
    // earlier: D2→D3 is a full four calendar months, and the only thing still
    // wrong is the dose-1 floor (five months, where six is required).
    const doses = [{ date: '2023-01-15' }, { date: '2023-02-15' }, { date: '2023-06-15' }];
    const perDose = analyzeHistory('MenB', doses, 300, ['asplenia'], '2026-09-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('invalid');
  });
});

describe('P0-4: week-based minimums are untouched', () => {
  it('a MenACWY high-risk dose 2 exactly 8 weeks later still counts', () => {
    const doses = [{ date: '2025-01-15' }, { date: '2025-03-12' }]; // 56 days
    const perDose = analyzeHistory('MenACWY', doses, 300, ['asplenia'], '2026-09-15', allYes(2)).perDose;
    expect(perDose.map((d) => d.status)).toEqual(['valid', 'valid']);
  });

  // P1-1 (2026-09-17): was 55 days. 8 weeks is 56, so 55 is one day early and
  // CDC counts it. 51 days (56 - 5) is the first genuinely too-soon value.
  it('a MenACWY high-risk dose 2 at 51 days is still too soon', () => {
    const doses = [{ date: '2025-01-15' }, { date: '2025-03-07' }];
    const perDose = analyzeHistory('MenACWY', doses, 300, ['asplenia'], '2026-09-15', allYes(2)).perDose;
    expect(perDose[1].status).toBe('invalid');
  });
});

describe('P0-4: the frequency the audit measured', () => {
  it('no start date in 2025 turns a 6-calendar-month series into a 3-dose one', () => {
    // The audit sampled 36 start dates across 2025 and found 18 where the
    // six-calendar-month gap was shorter than the 183 days the code required.
    // Here is every day of 2025 as a start date.
    const offenders = [];
    let d = new Date(Date.UTC(2025, 0, 1));
    while (d.getUTCFullYear() === 2025) {
      const d1 = d.toISOString().slice(0, 10);
      const d2 = addCalendarMonths(d1, 6);
      const info = menbSeriesInfo({ highRisk: false, doses: [{ date: d1 }, { date: d2 }] });
      if (info.total !== 2) offenders.push(`${d1} -> ${d2}`);
      d.setUTCDate(d.getUTCDate() + 1);
    }
    expect(offenders).toEqual([]);
  });
});
