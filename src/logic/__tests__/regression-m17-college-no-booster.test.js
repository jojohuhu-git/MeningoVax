// M17 (2026-09-15) — a college resident's dose given at 16 or later does not
// expire. One dose, no additional boosters.
//
// OWNER DECISION 2026-09-15, made with both sources in front of her:
// "college students should only get one dose ... without additional boosters".
//
// This one had a real source conflict, so the reasoning is recorded rather than
// hidden. Both documents were fetched live from their publishers on 2026-09-15.
//
// FOR no-booster (what the app now does) -- ACIP 2020 MMWR 69(RR-9) TABLE 10,
// the "Boosters" row, verbatim:
//
//   "College freshmen living in residence halls: Not routinely recommended
//    unless person becomes at increased risk due to another indication"
//
// and that table's footnote, last sentence:
//
//   "Adolescents who received a first dose after their 16th birthday do not
//    need a booster dose unless they become at increased risk for
//    meningococcal disease."
//
// AGAINST -- immunize.org Item #P2018 (job aid, dated 10/14/2025), which lists
// among the histories needing a dose:
//
//   "First year college students living in residence halls | None, or 1 prior
//    dose when younger than 16 years, or 1 prior dose since 16th birthday, but
//    more than 5 years previously | Give 1 dose of MenACWY"
//
// MeningoVax previously implemented the P2018 reading, and that was correctly
// sourced -- this is not a bug being fixed, it is a tie being broken. The
// earlier appeal to "follow vaxapp" turned out to be no argument at all:
// vaxapp stops at 19 years and the case needs a patient of 21+, so vaxapp has
// never encountered it. Its silence is an age-cap artefact, not a verdict.
//
// The deciding reading: ACIP's footnote speaks directly to this patient ("a
// first dose after their 16th birthday") and says no booster is needed, while
// P2018's "within 5 years before college entry" is an enrolment-paperwork
// recency rule. Owner chose the clinical statement.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-09-15';
// A 22-year-old college resident whose only dose was given at 16 -- six years
// ago, so squarely inside the window that used to trigger a repeat dose.
const college = (doses) =>
  recommend({ today: TODAY, ageMonths: 264, riskIds: ['college_dorm'],
    menacwyDoses: doses, menbDoses: [] }).menacwy[0];

describe('M17 — a >=16y dose satisfies the college requirement permanently', () => {
  it('a dose given six years ago at age 16 still reads Complete', () => {
    const r = college([{ date: '2020-09-15' }]);   // patient was 16
    expect(r.status).toBe('complete');
    expect(r.doseLabel).toMatch(/Complete/);
  });

  it('no repeat dose is offered for it', () => {
    const r = college([{ date: '2020-09-15' }]);
    expect(r.dueToday).not.toBe(true);
    expect(r.doseLabel).not.toMatch(/>5y|5 years/);
  });

  it('control: no doses at all still needs one', () => {
    const r = college([]);
    expect(r.status).not.toBe('complete');
    expect(r.dueToday).toBe(true);
  });

  it('control: a dose given before the 16th birthday still needs one', () => {
    // Unchanged by M17 -- ACIP and P2018 agree on this case, and so does vaxapp.
    const r = college([{ date: '2014-09-15' }]);   // patient was 10
    expect(r.status).not.toBe('complete');
    expect(r.dueToday).toBe(true);
  });
});
