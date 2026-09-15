// M9 (2026-09-15) — the travel booster cadence, cross-repo parity item with
// vaxapp (PediVax commit "M9: a traveler who stays at risk is owed boosters").
//
// ACIP 2020 MMWR 69(RR-9), TABLE 9, "persons who travel to or are residents of
// countries where meningococcal disease is hyperendemic or epidemic", fetched
// live from cdc.gov on 2026-09-15 and quoted verbatim:
//
//   "Boosters (if person remains at increased risk)
//    • Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every
//      5 yrs thereafter
//    • Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every
//      5 yrs thereafter"
//
// MeningoVax already gave travelers ongoing boosters — that half was right, and
// it is why vaxapp (which gave them none at all) was the bigger fix. Two things
// were wrong here, both reproduced by running recommend() on 2026-09-15:
//
//   1. The first booster was a flat 5 years for everyone. A child vaccinated at
//      age 3 is owed it at 3 years, per the <7 yrs row above. The 3-year/5-year
//      split already existed in this file for the medical high-risk branch; the
//      travel branch simply never used it.
//
//   2. Worse: a traveler's dose given before age 10 did not count at all.
//      validate.js's A3 rule ("doses given before age 10 years should not be
//      counted" toward the ROUTINE adolescent series) spared only patients whose
//      risk class is 'primary2'. So a 6y5m traveler vaccinated at 3 was told to
//      have "1 dose (ongoing-risk indication)" TODAY — the dose they already had
//      — and a 15-year-old with two doses was offered "dose 2".
//      ACIP is explicit that this is the wrong schedule for them: "Children who
//      received MenACWY at age <11 years and for whom booster vaccination is
//      recommended because of an ongoing increased risk should follow the booster
//      dose schedule (Tables 4, 5, 6, 7, 8, and 9), not the routine adolescent
//      schedule." Table 9 is travel; Table 7 is microbiologists.
//
// Microbiologists share this branch and are deliberately NOT changed: ACIP Table
// 7 covers ages "≥10 yrs" only and reads "Single dose at 5 yrs after primary
// vaccination and every 5 yrs thereafter" — no 3-year row exists for them.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DAYS } from '../dateUtils.js';

const TODAY = '2026-09-15';
const run = (ageMonths, riskIds, dates) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [] });
const acwy = (r) => r.menacwy[0];

describe('M9 — a travel dose given before age 10 still counts', () => {
  it('a 6y5m traveler vaccinated at 3 is offered a BOOSTER, not dose 1 again', () => {
    const r = acwy(run(77, ['travel'], ['2023-09-15']));
    expect(r.doseNum).toBe(2);                        // was: 1 — the dose was discarded
    expect(r.doseLabel).toMatch(/booster/i);
  });

  it('a 15-year-old traveler with two doses is on dose 3, not dose 2', () => {
    const r = acwy(run(180, ['travel'], ['2016-09-15', '2021-09-15']));
    expect(r.doseNum).toBe(3);                        // was: 2
  });

  it('control: a healthy child with no ongoing risk still loses the pre-10 dose', () => {
    // The A3 rule is correct for the routine adolescent schedule and must stay.
    const r = acwy(run(132, [], ['2023-09-15']));
    expect(r.doseNum).toBe(1);
  });
});

describe('M9 — the first travel booster is 3 years when the primary dose was before age 7', () => {
  it('vaccinated at age 3: the booster is due 3 years later, and is overdue now', () => {
    const r = acwy(run(77, ['travel'], ['2023-09-15']));
    expect(r.minIntervalDays).toBe(DAYS.years(3));    // was: DAYS.years(5)
    expect(r.dueToday).toBe(true);
  });

  it('vaccinated at age 8: the first booster is 5 years, not 3', () => {
    const r = acwy(run(156, ['travel'], ['2021-09-15']));
    expect(r.minIntervalDays).toBe(DAYS.years(5));
    expect(r.dueToday).toBe(true);
  });

  it('after the first booster the cadence is every 5 years', () => {
    const r = acwy(run(180, ['travel'], ['2016-09-15', '2021-09-15']));
    expect(r.minIntervalDays).toBe(DAYS.years(5));
  });

  it('a booster that is not due yet is dated from the primary dose, not from today', () => {
    // Vaccinated six months ago at age 3y6m; the 3-year booster falls in 2029.
    const r = acwy(run(48, ['travel'], ['2026-03-15']));
    expect(r.dueToday).toBe(false);
    expect(r.minIntervalDays).toBe(DAYS.years(3));
    expect(r.earliestNextDate).toBe('2029-03-15');
  });

  it('control: a microbiologist keeps the flat 5-year cadence (ACIP Table 7)', () => {
    const r = acwy(run(300, ['microbiologist'], ['2021-09-15']));
    expect(r.minIntervalDays).toBe(DAYS.years(5));
  });
});
