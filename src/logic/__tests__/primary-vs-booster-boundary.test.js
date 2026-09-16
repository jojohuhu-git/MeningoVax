// primary-vs-booster-boundary.test.js
//
// Locks the primaryTotal added to seriesTotals.js: where the PRIMARY series
// ends and the BOOSTER phase begins, per schedule. This is what lets the
// recorded-dose list group doses under "Primary series" and "Boosters"
// (owner decision 2026-09-15, option A).
//
// Every boundary below was fetched live and quoted on 2026-09-15:
//
//   CDC, "Meningococcal Vaccine Recommendations"
//   https://www.cdc.gov/meningococcal/hcp/vaccine-recommendations/index.html
//     - routine adolescents: a dose at 11-12 years and "a MenACWY booster dose
//       at age 16 years"
//     - at increased risk: "A 2-4-dose primary series", then "booster dose 3
//       years after completion of the primary series and every 5 years
//       thereafter" (<7y) / "booster dose every 5 years" (>=7y)
//     - MenB at increased risk: "A 3-dose primary series", then boosters
//       "1 year after series completion", "Every 2 to 3 years thereafter"
//
//   CDC child & adolescent immunization schedule notes
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//     - MenB shared clinical decision-making: "2-dose series at least 6 months
//       apart (if dose 2 is administered earlier than 6 months, administer
//       dose 3 at least 4 months after dose 2)" -- "dose 3", not a booster
//
// The headline finding: routine MenACWY is the ONLY schedule whose primary
// series is shorter than its total. Everywhere else every counted dose is a
// primary dose and boosters live past the total.

import { describe, it, expect } from 'vitest';
import { menacwySeriesInfo, menbSeriesInfo } from '../seriesTotals.js';

const TODAY = '2026-09-15';

// Age in months for a patient who is `years` old today.
const ageM = (years) => years * 12;
// ISO date of a dose given `yearsAgo` before TODAY.
const doseAgo = (yearsAgo) => ({ date: `${2026 - yearsAgo}-09-15` });

describe('MenACWY — where the primary series ends', () => {
  it('routine: the 11-12y dose is primary and the 16y dose is the booster', () => {
    // 17-year-old whose only dose was given at 12 — the 16y booster is owed,
    // so the series total is 2 but only ONE of those doses is primary.
    const info = menacwySeriesInfo({
      riskClass: null,
      am: ageM(17),
      doses: [doseAgo(5)], // given at age 12
      today: TODAY,
    });
    expect(info.total).toBe(2);
    expect(info.primaryTotal).toBe(1);
    expect(info.hasBoosterPhase).toBe(false);
  });

  it('routine: a first-ever dose at >=16y is primary and closes the series', () => {
    const info = menacwySeriesInfo({
      riskClass: null,
      am: ageM(17),
      doses: [doseAgo(1)], // given at age 16
      today: TODAY,
    });
    expect(info.total).toBe(1);
    expect(info.primaryTotal).toBe(1);
    expect(info.hasBoosterPhase).toBe(false);
  });

  it('high-risk >=2y: both doses are primary, boosters follow the series', () => {
    const info = menacwySeriesInfo({
      riskClass: 'primary2',
      am: ageM(11),
      doses: [],
      today: TODAY,
    });
    expect(info.total).toBe(2);
    expect(info.primaryTotal).toBe(2);
    expect(info.hasBoosterPhase).toBe(true);
  });

  it('infant start at 2 months: all FOUR doses are primary, not 3 + a booster', () => {
    // The 12-month dose closing a 2/4/6/12-month schedule is a primary dose —
    // CDC calls the whole thing "A 2-4-dose primary series".
    const info = menacwySeriesInfo({
      riskClass: 'primary2',
      am: 13,
      doses: [{ date: '2025-11-15' }], // dose 1 at ~2 months
      today: TODAY,
    });
    expect(info.total).toBe(4);
    expect(info.primaryTotal).toBe(4);
    expect(info.hasBoosterPhase).toBe(true);
  });

  it('infant start at 7-23 months: both doses are primary', () => {
    const info = menacwySeriesInfo({
      riskClass: 'primary2',
      am: 20,
      doses: [{ date: '2025-11-15' }], // dose 1 at ~9 months
      today: TODAY,
    });
    expect(info.total).toBe(2);
    expect(info.primaryTotal).toBe(2);
    expect(info.hasBoosterPhase).toBe(true);
  });

  it('single-dose exposure indication: the one dose is primary', () => {
    const info = menacwySeriesInfo({
      riskClass: 'single',
      am: ageM(19),
      doses: [],
      today: TODAY,
    });
    expect(info.total).toBe(1);
    expect(info.primaryTotal).toBe(1);
    // P0-2 (2026-09-15): this assertion used to read `.toBe(false)`, and that
    // was the bug. hasBoosterPhase has exactly one consumer -- validate.js's
    // cap -- where `false` means "throw away any dose past the total". All
    // three 'single' indications legitimately accept a later dose (college:
    // MMWR Table 10 footnote / M17; outbreak: Table 8 top-up / M12; military:
    // the DoD 5-yearly booster / M18), so throwing one away made the engine
    // re-offer an injection the patient had already had. What this test is
    // really about -- that the single dose is a PRIMARY dose, not a booster --
    // is unchanged and is asserted by the two lines above.
    // See regression-p0-2-single-dose-schedules-keep-later-doses.test.js.
    expect(info.hasBoosterPhase).toBe(true);
  });
});

describe('MenB — where the primary series ends', () => {
  it('healthy 2-dose: both are primary, no booster phase', () => {
    const info = menbSeriesInfo({ highRisk: false, doses: [] });
    expect(info.total).toBe(2);
    expect(info.primaryTotal).toBe(2);
    expect(info.hasBoosterPhase).toBe(false);
  });

  it('healthy rescue 3rd dose is PART OF the primary series, not a booster', () => {
    // Dose 2 given 3 months after dose 1 (<6 months) triggers the rescue dose.
    const info = menbSeriesInfo({
      highRisk: false,
      doses: [{ date: '2026-01-15' }, { date: '2026-04-15' }],
    });
    expect(info.total).toBe(3);
    expect(info.primaryTotal).toBe(3);
    expect(info.hasBoosterPhase).toBe(false);
  });

  it('high-risk 3-dose: all three are primary, boosters follow', () => {
    const info = menbSeriesInfo({ highRisk: true, doses: [] });
    expect(info.total).toBe(3);
    expect(info.primaryTotal).toBe(3);
    expect(info.hasBoosterPhase).toBe(true);
  });
});

describe('the invariant that makes grouping safe', () => {
  it('primaryTotal never exceeds total, on any schedule', () => {
    const cases = [
      menacwySeriesInfo({ riskClass: null, am: ageM(17), doses: [doseAgo(5)], today: TODAY }),
      menacwySeriesInfo({ riskClass: null, am: ageM(17), doses: [doseAgo(1)], today: TODAY }),
      menacwySeriesInfo({ riskClass: 'primary2', am: ageM(11), doses: [], today: TODAY }),
      menacwySeriesInfo({ riskClass: 'single+boost', am: ageM(30), doses: [], today: TODAY }),
      menacwySeriesInfo({ riskClass: 'single', am: ageM(19), doses: [], today: TODAY }),
      menbSeriesInfo({ highRisk: false, doses: [] }),
      menbSeriesInfo({ highRisk: true, doses: [] }),
    ];
    for (const info of cases) {
      expect(info.primaryTotal).toBeLessThanOrEqual(info.total);
      expect(info.primaryTotal).toBeGreaterThanOrEqual(1);
    }
  });
});
