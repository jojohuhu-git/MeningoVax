// M18 (2026-09-15), cross-repo parity with vaxapp.
//
// Both apps told a military recruit who already had a MenACWY dose that nothing
// further was owed. MeningoVax's wording: "Re-dose only if a separate
// ongoing-risk indication applies." That is the COLLEGE rule wearing the
// military's name.
//
// ACIP 2020 MMWR 69(RR-9) TABLE 10, Boosters row, fetched live from cdc.gov
// 2026-09-15, verbatim:
//
//   "Boosters: - College freshmen living in residence halls: Not routinely
//    recommended unless person becomes at increased risk due to another
//    indication - Military recruits: Every 5 yrs on basis of assignment ††"
//
// Military recruits are the one group in that table with a standing booster
// interval, and both apps denied it.
//
// Footnote ††, same fetch:
//
//   "Vaccination recommendations for military personnel are made by the U.S.
//    Department of Defense on the basis of high-risk travel requirements."
//
// M18 is wording only, in both repos, and that is deliberate: the interval
// turns on an assignment neither app can see, so the card states the rule and
// names DoD as the body that owns the timing, rather than starting a 5-year
// countdown the app has no basis to compute.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';
const acwy = (riskIds, doses = []) =>
  recommend({ today: TODAY, ageMonths: 240, riskIds, menacwyDoses: doses, menbDoses: [] }).menacwy[0];

const MILITARY_WITH_DOSE = () => acwy(['military'], [{ date: '2023-09-15' }]);

describe('M18 — the military card stops denying the DoD booster', () => {
  it('no longer says a re-dose applies only for a separate indication', () => {
    expect(noteText(MILITARY_WITH_DOSE())).not.toMatch(/only if a separate ongoing-risk indication/i); // extinct: old denial wording removed (M18, 2026-09-15)
  });

  it('states the every-5-years interval from ACIP Table 10', () => {
    expect(noteText(MILITARY_WITH_DOSE())).toMatch(/5 years/);
  });

  it('names the Department of Defense as the body that sets the timing', () => {
    expect(noteText(MILITARY_WITH_DOSE())).toMatch(/Department of Defense|DoD/);
  });

  it('adds no booster scheduling — the card is not made due today', () => {
    // M18 is wording only. The app cannot know the recruit's assignment, so it
    // must not invent a due date.
    const r = MILITARY_WITH_DOSE();
    expect(r.dueToday).not.toBe(true);
    expect(r.earliestNextDate == null || r.earliestNextDate === undefined).toBe(true);
  });

  it('control: a college resident keeps the no-booster wording (M17)', () => {
    // Same ACIP row, opposite halves. College must not inherit the 5-year line.
    const r = acwy(['college_dorm'], [{ date: '2023-09-15' }]);
    expect(noteText(r) || '').not.toMatch(/5 years/);
  });
});
