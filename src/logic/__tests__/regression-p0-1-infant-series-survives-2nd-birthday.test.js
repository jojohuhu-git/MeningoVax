// P0-1 (fix queue 2026-09-15): the length of a MenACWY series is set by the age
// at DOSE 1, permanently. It does not change because the child had a birthday.
//
// What was wrong: `recommend.js`'s only door into menacwyInfantSeries() was
// `am < M.y2` — today's age. The day a mid-series infant turned 2 they fell
// through to the generic ≥2-year branch, which hard-codes a 2-dose series. So a
// baby with asplenia on the textbook 2/4/6/12-month schedule was told, on their
// second birthday, that the doses they still owed were "boosters" not due for
// three more years. `seriesTotals.js`'s menacwySeriesInfo() had the same
// today's-age gate, while its sibling menacwyPrimaryTotal() — used by the
// validator — already keyed off the age at dose 1 and answered 4. Engine and
// validator disagreed about the same patient.
//
// CDC child & adolescent immunization schedule notes, "Meningococcal serogroup
// A,C,W,Y vaccination", special situations, Menveo (fetched live 2026-09-15):
//
//   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and
//    12 months)"
//   "Dose 1 at age 7–23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"
//   "Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart"
//
// The age named in each row is the age at dose 1, not the age today.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { menacwySeriesInfo, menacwyPrimaryTotal } from '../seriesTotals.js';

const TODAY = '2026-06-03';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const acwy = (r) => r.menacwy[0];

const run = (ageMonths, menacwyDoses, riskIds = ['asplenia']) => acwy(recommend({
  today: TODAY, ageMonths, riskIds, menacwyDoses, menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(menacwyDoses.length) },
}));

describe('P0-1: an infant series stays an infant series after the 2nd birthday', () => {
  // Doses at 2 and 4 months. The only difference between these two patients is
  // one day of age: 23 months vs 24 months.
  const twoDosesAt23mo = [{ date: '2024-09-03' }, { date: '2024-11-03' }];
  const twoDosesAt24mo = [{ date: '2024-08-03' }, { date: '2024-10-03' }];

  it('at 23 months, dose 3 of 4 is due today (this already worked)', () => {
    const r = run(23, twoDosesAt23mo);
    expect(r.doseNum).toBe(3);
    expect(r.seriesTotal).toBe(4);
    expect(r.dueToday).toBe(true);
  });

  it('at 24 months, the same record still owes dose 3 of 4 today', () => {
    const r = run(24, twoDosesAt24mo);
    expect(r.seriesTotal).toBe(4);
    expect(r.doseNum).toBe(3);
    expect(r.dueToday).toBe(true);
    expect(r.minIntervalDays).toBe(28); // 4 weeks between primary infant doses
    expect(r.doseLabel).not.toMatch(/booster/i);
  });

  it('at 24 months with three doses on record, dose 4 of 4 is due today', () => {
    const r = run(24, [{ date: '2024-08-03' }, { date: '2024-10-03' }, { date: '2024-12-03' }]);
    expect(r.seriesTotal).toBe(4);
    expect(r.doseNum).toBe(4);
    expect(r.dueToday).toBe(true);
    expect(r.doseLabel).not.toMatch(/booster/i);
  });

  it('one dose at 2 months still owes doses 2-4 of a 4-dose series at age 3', () => {
    const r = run(36, [{ date: '2023-08-03' }]);
    expect(r.seriesTotal).toBe(4);
    expect(r.doseNum).toBe(2);
  });

  it('a series genuinely BEGUN at 24 months or later is still 2 doses', () => {
    const r = run(36, [{ date: '2024-08-03' }]); // dose 1 at 26 months
    expect(r.seriesTotal).toBe(2);
    expect(r.doseNum).toBe(2);
  });

  it('an unvaccinated 3-year-old still gets the 2-dose ≥2y series', () => {
    const r = run(36, []);
    expect(r.seriesTotal).toBe(2);
    expect(r.doseNum).toBe(1);
  });
});

describe('P0-1: menacwySeriesInfo keys off the age at dose 1, like menacwyPrimaryTotal', () => {
  it('a 24-month-old who started at 2 months has a 4-dose series', () => {
    expect(menacwySeriesInfo({
      riskClass: 'primary2', am: 24, today: TODAY,
      doses: [{ date: '2024-08-03' }, { date: '2024-10-03' }],
    })).toMatchObject({ total: 4, primaryTotal: 4 });
  });

  it('it agrees with the validator for the same patient', () => {
    // TODAY is 2026-06-03 and the patient is 96 months old, so their DOB is
    // 2018-06-03 and these four doses fall at 2, 4, 6 and 12 months — the
    // textbook series. (P1-3 note: an earlier draft of this fixture dated dose
    // 1 at 2018-12-03, which is SIX months, with dose 2 at eight months — that
    // is the 3-dose shortcut, not a 2-month start, so it stopped meaning what
    // the test says once P1-3 taught the totals to tell the two apart.)
    const doses = [{ date: '2018-08-03' }, { date: '2018-10-03' }, { date: '2018-12-03' }, { date: '2019-06-03' }];
    const info = menacwySeriesInfo({ riskClass: 'primary2', am: 96, today: TODAY, doses });
    expect(info.primaryTotal).toBe(menacwyPrimaryTotal({ riskClass: 'primary2', d1AgeM: 2, d2AgeM: 4 }));
    expect(info.primaryTotal).toBe(4);
  });

  it('a 7-23-month start is a 2-dose series after the 2nd birthday too', () => {
    expect(menacwySeriesInfo({
      riskClass: 'primary2', am: 30, today: TODAY,
      doses: [{ date: '2024-12-03' }], // dose 1 at ~12 months
    })).toMatchObject({ total: 2, primaryTotal: 2 });
  });

  it('an unvaccinated 3-year-old is unchanged at 2 doses', () => {
    expect(menacwySeriesInfo({ riskClass: 'primary2', am: 36, today: TODAY, doses: [] }))
      .toMatchObject({ total: 2, primaryTotal: 2 });
  });
});
