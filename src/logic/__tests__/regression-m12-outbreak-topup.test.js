// M12 (2026-09-15), cross-repo parity with vaxapp ("M12: vaxapp can finally
// record a serogroup A/C/W/Y outbreak").
//
// MeningoVax already HAD the outbreak_acwy risk factor — that half of M12 was a
// vaxapp gap. But it modelled the indication as one dose, ever: a patient with
// any recorded dose was told "Complete". ACIP 2020 MMWR 69(RR-9) Table 8,
// fetched live from cdc.gov 2026-09-15, quoted verbatim:
//
//   "Boosters (if previously vaccinated and identified as being at increased
//    risk): • Aged <7 yrs: Single dose if ≥3 yrs since vaccination
//           • Aged ≥7 yrs: single dose if ≥5 yrs since vaccination"
//
// Two things follow, and both differ from every other booster in this file:
//   1. It is a TOP-UP triggered by being identified at risk again, not the
//      standing "every 5 yrs thereafter" countdown Table 9 gives travelers
//      (owner-confirmed 2026-09-15) — so the copy must not promise a schedule.
//   2. The 3-versus-5-year threshold keys off the patient's age TODAY, inside
//      Table 8's own age-group rows, where Tables 4-6 and 9 key theirs to the
//      age at which the primary series was completed.
//
// Reproduced before the fix, by running recommend() on 2026-09-15: a 6-year-old
// whose only dose was three years ago, and a 12-year-old whose only dose was six
// years ago, were both answered "1 dose, due today" — the dose was discarded as
// a pre-age-10 dose AND no top-up existed, so the app asked them to start again.
//
// Military recruits share this branch and are deliberately unchanged: ACIP Table
// 10 really is a single dose for them.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DAYS } from '../dateUtils.js';

const TODAY = '2026-09-15';
const acwy = (ageMonths, riskIds, dates) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [] }).menacwy[0];

describe('M12 — the outbreak top-up', () => {
  it('under 7, a dose 3 years old earns a top-up rather than a repeat of dose 1', () => {
    const r = acwy(72, ['outbreak_acwy'], ['2023-09-14']);
    expect(r.doseNum).toBe(2);                       // was: 1 — the dose was discarded
    expect(r.doseLabel).toMatch(/top-up/i);          // was: "1 dose"
    expect(r.dueToday).toBe(true);
    expect(r.minIntervalDays).toBe(DAYS.years(3));
  });

  it('under 7 and only 2 years on, the recorded dose still covers the outbreak', () => {
    const r = acwy(72, ['outbreak_acwy'], ['2024-09-15']);
    expect(r.status).toBe('complete');
    expect(r.dueToday).toBeFalsy();
    // 2027-09-16, not -15: DAYS.years(3) here is Math.round(3 * 365.25) = 1096,
    // where vaxapp's MENACWY_BOOSTER_3Y is 1095. The two apps therefore date this
    // top-up one day apart. That is the known cross-repo divergence queued as
    // M19 ("align day-count conventions"); M12 uses each repo's own existing
    // constant rather than changing one of them behind M19's back.
    expect(r.earliestNextDate).toBe('2027-09-16');
  });

  it('at 7 or older the threshold is 5 years, keyed to the age TODAY', () => {
    expect(acwy(144, ['outbreak_acwy'], ['2022-09-15']).status).toBe('complete');   // 4 years
    const fiveOn = acwy(144, ['outbreak_acwy'], ['2021-09-14']);
    expect(fiveOn.doseNum).toBe(2);
    expect(fiveOn.minIntervalDays).toBe(DAYS.years(5));
  });

  it('the copy does not promise a repeating schedule', () => {
    const r = acwy(72, ['outbreak_acwy'], ['2023-09-14']);
    expect(r.note).toMatch(/does not start a repeating schedule/i);
    expect(r.boosterSummary).toBeFalsy();
  });

  it('an outbreak contact with no doses is unchanged: 1 dose', () => {
    const r = acwy(72, ['outbreak_acwy'], []);
    expect(r.doseNum).toBe(1);
    expect(r.doseLabel).toMatch(/1 dose/);
  });
});

describe('M12 — controls that must not move', () => {
  it('a military recruit with a dose is still simply Complete', () => {
    // Dose given at 18, so the pre-age-10 rule is not what is being tested here.
    const r = acwy(240, ['military'], ['2024-09-15']);
    expect(r.status).toBe('complete');
    expect(r.doseLabel).toBe('Complete');
  });

  it('a traveler keeps the standing Table 9 cadence, not the top-up', () => {
    const r = acwy(144, ['travel'], ['2021-09-14']);
    expect(r.doseLabel).toMatch(/booster/i);
    expect(r.boosterSummary).toBeTruthy();
  });
});
