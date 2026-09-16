// P0-2 (fix queue 2026-09-15): a single-dose MenACWY indication must not throw
// away a later dose the patient really received, and then recommend that same
// dose again today.
//
// Three reproductions, all with every dose confirmed at the risk-at-dose prompt:
//
//   18y, college_dorm, doses at 14y AND 17y
//     was: D2 chipped "Extra dose - beyond the indicated series total", while
//          the card still said "1 dose (booster at >=16y)", due today.
//     is:  the 17y dose satisfies the college requirement; nothing is due.
//
//   13y, outbreak_acwy, dose at 5y AND a top-up at 12y
//     was: the top-up chipped "Extra dose", card still offering
//          "Outbreak top-up (dose 2)", due today.
//     is:  the top-up counts; no further dose.
//
//   22y, military, two doses four years apart
//     was: D2 "Extra dose", though the card's own note says ACIP boosters run
//          every 5 years by assignment.
//     is:  the dose counts.
//
// Why this is a P0 rather than a labelling nit: the discarded dose is dropped
// from `kept`, so the engine re-plans against a history missing a dose the
// patient actually had, and offers an injection they do not need. A randomised
// sweep of 4,000 patients hit this pattern 115 times, all in these three
// classes.
//
// Cause. seriesTotals.js returned `hasBoosterPhase: false` for riskClass
// 'single', and validate.js's runWalk() treats that as licence to cap the
// series and discard anything past the total. But all three "single"
// indications legitimately accept a later dose:
//
//   college   ACIP 2020 MMWR 69(RR-9) Table 10 footnote - a dose after the
//             16th birthday needs no booster, i.e. it counts (owner decision
//             M17: a >=16y dose satisfies the requirement permanently).
//   outbreak  Table 8 - a top-up "if previously vaccinated and identified as
//             being at increased risk" (owner decision M12: re-exposure
//             driven, not a standing countdown).
//   military  Table 10 - the DoD booster every 5 years by assignment
//             (owner decision M18).
//
// Only "one dose and nothing ever again" deserves the cap, and none of the
// three is that. Routine MenACWY and healthy MenB genuinely are, and keep it.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { menacwySeriesInfo } from '../seriesTotals.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function both(ageMonths, riskIds, dates) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  return {
    rec: recommend({
      today: TODAY, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [],
      riskAtDoseAnswers: { MenACWY: answers },
    }).menacwy[0],
    perDose: analyzeHistory('MenACWY', doses, ageMonths, riskIds, TODAY, answers).perDose,
  };
}

describe('P0-2: a college dorm dose given at 17 satisfies the requirement', () => {
  const { rec, perDose } = both(216, ['college_dorm'], ['2022-09-15', '2025-09-15']);

  it('the 17-year dose is not discarded as an extra dose', () => {
    expect(perDose[1].extraDose).toBeFalsy();
    expect(perDose[1].effectiveDoseNum).toBe(2);
  });

  it('no dose is offered today', () => {
    expect(rec.dueToday).toBeFalsy();
  });

  it('the card says the requirement is met', () => {
    expect(rec.status).toBe('complete');
  });
});

describe('P0-2: an outbreak top-up counts', () => {
  const { rec, perDose } = both(156, ['outbreak_acwy'], ['2018-09-15', '2025-09-15']);

  it('the top-up is not discarded', () => {
    expect(perDose[1].extraDose).toBeFalsy();
    expect(perDose[1].effectiveDoseNum).toBe(2);
  });

  it('a second top-up is not offered today', () => {
    expect(rec.dueToday).toBeFalsy();
  });
});

describe('P0-2: a military booster counts', () => {
  const { perDose } = both(264, ['military'], ['2021-09-15', '2025-09-15']);

  it('the second dose is not discarded', () => {
    expect(perDose[1].extraDose).toBeFalsy();
    expect(perDose[1].effectiveDoseNum).toBe(2);
  });
});

describe('P0-2: the schedules that genuinely close still cap', () => {
  it('a third ROUTINE MenACWY dose is still an extra dose', () => {
    // The originally reported F2/F3 bug ("Dose 3 of 1"). Routine is 11-12y plus
    // the 16y booster and nothing after it.
    const { perDose } = both(264, [], ['2017-09-15', '2022-09-15', '2025-09-15']);
    expect(perDose[2].extraDose).toBe(true);
  });

  it('a third HEALTHY MenB dose is still an extra dose', () => {
    const doses = [{ date: '2024-09-15' }, { date: '2025-09-15' }, { date: '2026-03-15' }];
    const perDose = analyzeHistory('MenB', doses, 240, [], TODAY, allYes(3)).perDose;
    expect(perDose[2].extraDose).toBe(true);
  });
});

describe('P0-2: seriesTotals says these three schedules accept a later dose', () => {
  it.each([
    ['college_dorm'],
    ['outbreak_acwy'],
    ['military'],
  ])('%s', (id) => {
    expect(menacwySeriesInfo({
      riskClass: 'single', am: 240, doses: [{ date: '2025-09-15' }], today: TODAY,
      infantSeries: id === 'outbreak_acwy',
    }).hasBoosterPhase).toBe(true);
  });

  it('routine MenACWY still closes', () => {
    expect(menacwySeriesInfo({ riskClass: null, am: 240, doses: [], today: TODAY }).hasBoosterPhase).toBe(false);
  });
});

describe('P0-2: the sweep that found it', () => {
  // The audit found this by sweeping 4,000 randomised patients and counting how
  // often the app discarded a recorded dose AND offered a dose today. It hit
  // 115 times, every one of them in the outbreak/college/military classes.
  // This is that sweep, made deterministic: every age from 11 to 40 in
  // six-month steps, each of the three indications, and dose histories of one
  // to three doses spaced one to six years apart.
  it('never discards a dose and offers one the same day', () => {
    const offenders = [];
    for (const riskId of ['college_dorm', 'outbreak_acwy', 'military']) {
      for (let ageY = 11; ageY <= 40; ageY += 0.5) {
        const ageMonths = Math.round(ageY * 12);
        for (let n = 1; n <= 3; n += 1) {
          for (const gapY of [1, 3, 5, 6]) {
            const dates = [];
            for (let i = n - 1; i >= 0; i -= 1) {
              const d = new Date(TODAY);
              d.setFullYear(d.getFullYear() - (i * gapY) - 1);
              dates.push(d.toISOString().slice(0, 10));
            }
            const { rec, perDose } = both(ageMonths, [riskId], dates);
            const discarded = perDose.some((p) => p.extraDose);
            if (discarded && rec?.dueToday) {
              offenders.push(`${riskId} age ${ageY}y ${n} dose(s) ${gapY}y apart`);
            }
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
