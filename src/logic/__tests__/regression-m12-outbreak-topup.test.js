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
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';
const acwy = (ageMonths, riskIds, dates) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [] }).menacwy[0];

// STOP B B-2 (owner, 2026-11-15) replaced M12's "one-off top-up on
// re-exposure" reading: while the outbreak box is ticked the app keeps asking
// for the booster 5 years on (3 if the series finished before 7), never says
// "Complete", and says "booster", never "top-up". The tests below were moved
// to that answer; what M12 fixed (the old dose is not discarded) still holds.
describe('M12 under B-2 — the outbreak booster', () => {
  it('under 7, a dose 3 years old earns a booster rather than a repeat of dose 1', () => {
    const r = acwy(72, ['outbreak_acwy'], ['2023-09-14']);
    expect(r.doseNum).toBe(2);                       // was: 1 — the dose was discarded
    // extinct: "top-up", retired by B-2 (owner wording 2026-11-15).
    expect(r.doseLabel).not.toMatch(/top-up/i);
    expect(r.doseLabel).toMatch(/Booster \(dose 2\)/);
    expect(r.dueToday).toBe(true);
    expect(r.minIntervalDays).toBe(DAYS.years(3));
  });

  it('under 7 and only 2 years on: the booster date, not "Complete"', () => {
    const r = acwy(72, ['outbreak_acwy'], ['2024-09-15']);
    expect(r.status).toBe('exposure');
    expect(r.doseLabel).toMatch(/if outbreak risk continues/);
    expect(r.dueToday).toBeFalsy();
    // P0-5 (2026-09-15): this expected '2027-09-16' — a day after the real
    // three-year anniversary — because DAYS.years(3) was Math.round(3 * 365.25)
    // = 1096 and the date was computed as lastDate + 1096 days. Three years
    // after 2024-09-15 is 2027-09-15. The date is now built with
    // addCalendarYears(), so it lands on the anniversary itself.
    //
    // The comment that used to sit here said vaxapp's MENACWY_BOOSTER_3Y was
    // 1095 and blamed the difference on that. That was wrong: vaxapp's constant
    // is also 1096 (src/logic/stateHelpers.js:179, checked 2026-09-15), so both
    // apps were a day late in the same way. MeningoVax is now right and vaxapp
    // is not — porting this is a cross-repo obligation recorded in the handoff,
    // and the vaccine-parity skill applies.
    expect(r.earliestNextDate).toBe('2027-09-15');
  });

  // B-2 keys the 3-or-5 years to the age at the LAST dose ("3 if last dose
  // <7 y"), as the validator does (C10), not to the age today as M12 read
  // Table 8. The patient moved to 13, so the dose 5 years ago was at 8.
  it('a dose given at 7 or older: the threshold is 5 years', () => {
    expect(acwy(156, ['outbreak_acwy'], ['2022-09-15']).dueToday).toBe(false);   // 4 years: dated, not due
    const fiveOn = acwy(156, ['outbreak_acwy'], ['2021-09-14']);
    expect(fiveOn.doseNum).toBe(2);
    expect(fiveOn.minIntervalDays).toBe(DAYS.years(5));
  });

  it('the copy names the booster interval and how to stop it (untick the box)', () => {
    const r = acwy(72, ['outbreak_acwy'], ['2023-09-14']);
    expect(noteText(r)).toMatch(/3 years/);
    expect(noteText(r)).toMatch(/untick the outbreak box/i);
  });

  it('an outbreak contact with no doses is unchanged: 1 dose', () => {
    const r = acwy(72, ['outbreak_acwy'], []);
    expect(r.doseNum).toBe(1);
    expect(r.doseLabel).toMatch(/1 dose/);
  });
});

describe('M12 — controls that must not move', () => {
  // STOP B B-3 (owner, 2026-11-15) moved this control: the military card now
  // shows the 5-year booster date with the assignment caveat, never "Complete".
  it('a military recruit with a dose gets the 5-year booster date, not "Complete"', () => {
    // Dose given at 18, so the pre-age-10 rule is not what is being tested here.
    const r = acwy(240, ['military'], ['2024-09-15']);
    expect(r.status).toBe('exposure');
    expect(r.earliestNextDate).toBe('2029-09-15');
  });

  it('a traveler keeps the standing Table 9 cadence, not the top-up', () => {
    const r = acwy(144, ['travel'], ['2021-09-14']);
    expect(r.doseLabel).toMatch(/booster/i);
    expect(r.boosterSummary).toBeTruthy();
  });
});
