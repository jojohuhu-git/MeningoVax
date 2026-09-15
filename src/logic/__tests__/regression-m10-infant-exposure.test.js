// M10 (2026-09-15) — an infant who needs MenACWY because of TRAVEL or an A/C/W/Y
// OUTBREAK gets the infant series, not a single adult-shaped dose.
// Cross-repo parity item with vaxapp (PediVax commit "M10: an infant who travels
// needs the infant series, and was offered nothing").
//
// ACIP 2020 MMWR 69(RR-9), fetched live from cdc.gov on 2026-09-15. TABLE 9
// (travel) and TABLE 8 (outbreak) carry an IDENTICAL "2–23 mos" row, which is
// also the row Tables 4–6 give medically high-risk infants — quoted verbatim:
//
//   "2–23 mos
//    Primary vaccination: MenACWY-D (aged ≥9 mos): 2 doses ≥12 wks apart
//    or MenACWY-CRM: If first dose at age
//    • 2 mos: 4 doses at 2, 4, 6, and 12 mos
//    • 3–6 mos: See catch-up schedule
//    • 7–23 mos: 2 doses (second dose ≥12 wks after the first dose and after the
//      1st birthday)"
//
// The series depends on the age at dose 1, NOT on why the infant is being
// vaccinated. MeningoVax routed the infant series off `riskClass === 'primary2'`
// (medical high risk) alone, so travel fell to the single+boost branch and
// outbreak to the single branch. Reproduced by running recommend() on
// 2026-09-15, before the fix:
//
//   • 4-month-old traveler, no doses     → "1 dose (ongoing-risk indication)", due today
//   • 4-month-old outbreak contact       → "1 dose", due today
//   • 14-month-old traveler, 1 dose at 9 mos
//                                        → "Booster (dose 2, first booster, 3 years
//                                           after the primary dose)", dated 2029 —
//                                           dose 2 of the infant series is due NOW
//   • 8-month-old traveler, 2 doses from 2 mos
//                                        → "Booster (dose 3, every 5 years)", dated
//                                           2031, with doses 3 and 4 still owed
//
// Microbiologists are deliberately untouched: ACIP Table 7 covers ages "≥10 yrs"
// only and has no infant row at all. Military recruits (Table 10) likewise.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DAYS } from '../dateUtils.js';

const TODAY = '2026-09-15';
const run = (ageMonths, riskIds, dates) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [] });
const acwy = (r) => r.menacwy[0];

describe('M10 — an infant traveler is put on the infant series', () => {
  it('a 4-month-old traveler with no doses starts the 4-dose infant series', () => {
    const r = acwy(run(4, ['travel'], []));
    expect(r.seriesTotal).toBe(4);                   // was: 1
    expect(r.doseLabel).toMatch(/Dose 1 of 4/);      // was: "1 dose (ongoing-risk indication)"
    expect(r.minIntervalDays).toBe(DAYS.weeks(4));
  });

  it('a 14-month-old traveler whose only dose was at 9 months owes dose 2 now', () => {
    // Table 9, 7–23 mos: dose 2 is ≥12 wks after dose 1 AND after the 1st
    // birthday. Both floors are already cleared, so it is due today.
    const r = acwy(run(14, ['travel'], ['2026-04-15']));
    expect(r.doseNum).toBe(2);
    expect(r.dueToday).toBe(true);                   // was: false, dated 2029
    expect(r.doseLabel).not.toMatch(/booster/i);     // was: "Booster (dose 2, ...)"
  });

  it('an 8-month-old traveler with 2 infant doses still owes the rest of the series', () => {
    const r = acwy(run(8, ['travel'], ['2026-03-15', '2026-05-15']));
    expect(r.doseNum).toBe(3);
    expect(r.seriesTotal).toBe(4);                   // was: 1, called a 5-yearly booster
    expect(r.doseLabel).not.toMatch(/every 5 years/i);
  });

  it('the copy names travel, not a medical condition the infant does not have', () => {
    const r = acwy(run(4, ['travel'], []));
    expect(r.note).not.toMatch(/asplenia|complement deficiency|HIV/i);
  });
});

describe('M10 — an infant at risk in an A/C/W/Y outbreak gets the same series', () => {
  it('a 4-month-old outbreak contact starts the 4-dose infant series', () => {
    const r = acwy(run(4, ['outbreak_acwy'], []));
    expect(r.seriesTotal).toBe(4);                   // was: 1
    expect(r.doseLabel).toMatch(/Dose 1 of 4/);      // was: "1 dose"
  });

  it('the copy names the outbreak, not travel and not a medical condition', () => {
    const r = acwy(run(4, ['outbreak_acwy'], []));
    expect(r.note).not.toMatch(/asplenia|complement deficiency|HIV/i);
    expect(r.note).toMatch(/outbreak/i);
  });
});

describe('M10 — the validator must not eat the infant series it now prescribes', () => {
  // Found while verifying M10. The "doses given before age 10 do not count
  // toward the adolescent series" rule (validate.js) deliberately did NOT spare
  // riskClass 'single', because military / college / outbreak used to mean a
  // single dose at any age. Once M10 puts an outbreak INFANT on the 4-dose
  // series, every dose of that series is given before age 10 — so all of them
  // were discarded and the baby was told to start again at dose 1.
  it('an outbreak infant who has had 2 doses is offered dose 3, not dose 1', () => {
    const r = acwy(run(8, ['outbreak_acwy'], ['2026-03-15', '2026-04-12']));
    expect(r.doseNum).toBe(3);                       // was: 1 — both doses discarded
    expect(r.seriesTotal).toBe(4);
  });

  it('a travel infant who has had 2 doses is likewise offered dose 3', () => {
    const r = acwy(run(8, ['travel'], ['2026-03-15', '2026-04-12']));
    expect(r.doseNum).toBe(3);
    expect(r.seriesTotal).toBe(4);
  });

  it('an ADOLESCENT outbreak contact keeps their dose too — superseded by M12', () => {
    // SUPERSEDED, deliberately flipped rather than deleted (the M8 precedent in
    // this queue). M10 asserted `expect(r.doseNum).toBe(1)` here: outside the
    // infant window, an outbreak contact's pre-age-10 dose was still discarded,
    // because outbreak was a one-dose-ever indication with no booster schedule
    // to follow.
    //
    // M12 (2026-09-15) refuted that. ACIP 2020 MMWR 69(RR-9) Table 8 gives a
    // previously-vaccinated outbreak contact a top-up dose, so they DO follow a
    // booster schedule and their earlier doses count at any age — the same ACIP
    // sentence names Table 8 among the schedules that displace the routine
    // adolescent one.
    //
    // This 12-year-old was vaccinated about 3.5 years ago. At 7 or older the
    // top-up threshold is 5 years, so nothing is due yet and the recorded dose
    // stands: 'complete', no dose number. Before M12 they were told to start
    // again at dose 1.
    const r = acwy(run(144, ['outbreak_acwy'], ['2023-03-15']));
    expect(r.status).toBe('complete');
    expect(r.doseNum).toBeNull();
  });

  it('control: a healthy adolescent still loses a pre-age-10 dose', () => {
    // The pre-age-10 rule is correct for the routine adolescent series and must
    // stay for anyone without a risk-based schedule to follow.
    const r = acwy(run(144, [], ['2023-03-15']));
    expect(r.doseNum).toBe(1);
  });
});

describe('M10 — controls that must not move', () => {
  it('a medically high-risk infant is unchanged', () => {
    const r = acwy(run(4, ['asplenia'], []));
    expect(r.doseLabel).toMatch(/Dose 1 of 4 \(infant high-risk\)/);
    expect(r.seriesTotal).toBe(4);
  });

  it('a traveler aged 2 years or more still has a ONE-dose primary series (M9)', () => {
    const r = acwy(run(30, ['travel'], []));
    expect(r.seriesTotal).toBe(1);
    expect(r.doseLabel).toMatch(/1 dose/);
  });

  it('a microbiologist infant is NOT put on the infant series (ACIP Table 7 is ≥10y)', () => {
    const r = acwy(run(4, ['microbiologist'], []));
    expect(r.seriesTotal).toBe(1);
  });

  it('a healthy infant is still told MenACWY is not indicated', () => {
    const r = acwy(run(4, [], []));
    expect(r.doseLabel).not.toMatch(/Dose 1 of 4/);
  });
});
