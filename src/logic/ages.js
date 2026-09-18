// Age thresholds, in one place.
//
// The last group of numbers in this app that was still written down twice.
//
// `seriesTotals.js` gave dose TOTALS a single home. `intervals.js` did the same
// for the gap BETWEEN two doses. This module is the third sibling, and it owns
// the other kind of number a meningococcal schedule is made of: the AGE at
// which a dose becomes due, counts, or stops being offered.
//
// The two-copies problem was already visible when this was written, in exactly
// the shape that produced P0-1 (an infant interval hand-typed as 4 weeks in
// four places when the rule says 8):
//
//   - 16 years was written out FOUR times — twice in validate.js under two
//     different names, once in seriesTotals.js, once in recommend.js's age map.
//   - 7 years was written out three times, including one copy inside
//     intervals.js itself.
//   - 2 years was written out seven times across four files.
//
// Nothing made any of them agree. They happened to.
//
// WHY THIS IS ITS OWN FILE AND NOT PART OF intervals.js
//
// The 2026-09-17 plan said to put these in intervals.js. They are here instead
// for one mechanical reason: `intervals.js` imports `seriesTotals.js` (it
// derives an infant gate from the series total), and `seriesTotals.js` needs
// these ages. Putting them in intervals.js makes those two modules import each
// other, and a circular import between modules that both compute constants at
// load time fails in a way that depends on which file the browser happens to
// load first. This module imports NOTHING, so nothing can cycle through it.
//
// TWO NUMBERS THAT ARE EQUAL ARE NOT NECESSARILY THE SAME NUMBER
//
// 192 months appears below twice, under two names: the age the routine MenACWY
// booster is due, and the age the healthy MenB series may start. They are both
// 16 years today and they are different rules from different ACIP votes. They
// keep separate names so that a future tidy-up cannot merge them on the
// strength of both reading 192 — the same reasoning intervals.js already
// applies to the booster cadence and the outbreak top-up sharing a 3 and a 5.
//
// WHAT IS DELIBERATELY NOT HERE
//
//   - PRODUCT licence floors ("Menveo 2-vial is licensed from 2 months",
//     "every MenB product is 10 years and up"). Those belong to the product,
//     not the schedule, and they already have a single home in
//     `src/data/brands.js`. Ask that file, via MENACWY_MIN_AGE_MONTHS /
//     MENB_MIN_AGE_MONTHS / menacwyBrandLabelsForAge().
//   - The demographic band labels in `format.js` ("Infant (<2y)", "Child
//     (2-10y)"). Those describe a patient, not a rule. If ACIP moved the
//     routine dose to 12 years, a 11-year-old would still be an adolescent.
//
// The rule for callers, unchanged from intervals.js: ask this module for the
// number and INTERPOLATE it into whatever you print. Never restate it in
// English beside the value — that is the half of P0-1 that would have kept
// misleading a clinician even after the constant was corrected.

const MONTHS_PER_YEAR = 12;
const years = (y) => y * MONTHS_PER_YEAR;

/**
 * The whole-year form of a threshold, for interpolating into card text.
 *
 * Card sentences that name an age must call this rather than typing the year
 * out — including spelling it as a word ("under age seven"), which is the
 * form that drifts most quietly because no search for "7" will find it.
 */
export function ageYears(months) {
  return months / MONTHS_PER_YEAR;
}

// ── MenACWY · the infant / early-childhood series ────────────────────────
//
// CDC child & adolescent immunization schedule notes, "Meningococcal serogroup
// A,C,W,Y vaccination", Special situations, Menveo (fetched live 2026-09-17,
// and quoted at greater length in intervals.js, which owns the gaps between
// these doses):
//
//   "Dose 1 at age 7-23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"

/**
 * The second birthday: the door into the infant/early-childhood schedule.
 *
 * A series BEGUN below this age keeps its infant length for life, which is why
 * most callers test the age at DOSE 1 rather than the age today. (P0-1 of the
 * 2026-09-15 queue: one caller tested today's age alone, so on a patient's
 * second birthday the engine answered one series length and the validator
 * answered another for the same child.)
 */
export const MENACWY_INFANT_SERIES_MAX_AGE_MONTHS = years(2);

/**
 * The floor of CDC's "dose 1 at age 3-6 months" band — the start that can
 * finish in three doses instead of four, if a dose lands at 7 months or later.
 *
 * Below this age the row above governs and is unconditional: "Dose 1 at age 2
 * months: 4-dose series (additional 3 doses at age 4, 6, and 12 months)".
 */
export const MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS = 3;

/**
 * The start of CDC's "dose 1 at age 7-23 months" band — the late-infant start
 * that completes in two doses rather than three or four.
 *
 * B1 (2026-09-17): CDC states these bands in COMPLETED months, so the test
 * against this number must be `< 7`, never `<= 6`. Three call sites asked
 * `<= 6` instead, and every patient whose age fell between the two — which,
 * since the app began keeping the date of birth, is most of them — was answered
 * from the wrong band. See regression-b1-infant-band-edges.test.js.
 */
export const MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS = 7;

/** The final dose of an infant primary series may not be given before this age. */
export const MENACWY_INFANT_FINAL_MIN_AGE_MONTHS = 12;

// ── MenACWY · the routine adolescent schedule ────────────────────────────
//
// CDC child & adolescent immunization schedule notes, "Meningococcal serogroup
// A,C,W,Y vaccination", Routine vaccination (fetched live 2026-09-17):
//
//   "2-dose series at age 11-12 years; 16 years"
//
// and, for the catch-up band:
//
//   "Age 13-15 years: 1 dose now and booster at age 16-18 years (minimum
//    interval: 8 weeks)"
//   "Age 16-18 years: 1 dose"

/**
 * The earliest age at which a MenACWY dose COUNTS toward the routine
 * adolescent series. ACIP counts a dose given at age 10 as dose 1; a dose
 * given younger than this, with no risk indication, does not count and the
 * adolescent series still starts from scratch.
 *
 * This is the age a recorded dose is judged against. The age at which the app
 * OFFERS dose 1 is MENACWY_ROUTINE_DOSE1_AGE_MONTHS, a year later — the two
 * are different questions and are deliberately different constants.
 */
export const MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS = years(10);

/** Routine dose 1 is offered from the 11th birthday ("age 11-12 years"). */
export const MENACWY_ROUTINE_DOSE1_AGE_MONTHS = years(11);

/** The routine booster is due at, and counts from, the 16th birthday. */
export const MENACWY_ROUTINE_BOOSTER_AGE_MONTHS = years(16);

/**
 * Where the "16-18 years" band ends and the college-age catch-up band begins.
 * A 19-year-old with no dose on or after their 16th birthday is a catch-up
 * patient, not a routine one.
 */
export const MENACWY_CATCHUP_MIN_AGE_MONTHS = years(19);

/**
 * The top of the catch-up band: "through 21 years" is inclusive of the whole
 * of the 21st year, so it ends at the 22nd birthday.
 */
export const MENACWY_CATCHUP_MAX_AGE_MONTHS = years(22);

/**
 * The age that decides how long until the FIRST booster (3 years below it,
 * 5 years from it), and — as its own separate rule — how long before an
 * outbreak contact may be topped up again.
 *
 * ACIP 2020 MMWR 69(RR-9), Tables 4-10, through the `boosterBeforeAge7` and
 * `boosterAtOrAfterAge7` citations the cards already carry. intervals.js owns
 * the two intervals themselves; this is only the age they hinge on.
 */
export const MENACWY_BOOSTER_AGE_SPLIT_MONTHS = years(7);

// ── MenB · the healthy shared-clinical-decision-making series ────────────
//
// CDC child & adolescent immunization schedule notes, "Meningococcal serogroup
// B vaccination" (fetched live 2026-09-17):
//
//   "Adolescents not at increased risk age 16-23 years (preferred age 16-18
//    years) based on shared clinical decision-making."
//
// Owner decision 2026-07-23 (Option 1): a MenB dose given to a patient with no
// risk factor BEFORE this age is validly administered — it clears the 10-year
// product floor — but does not COUNT toward the healthy series, because MenB
// antibody wanes within about a year and an early dose is not protective at 16.
// This mirrors MenACWY's pre-age-10 exclusion above.

/** The healthy MenB series starts at 16 years, and counts from there. */
export const MENB_HEALTHY_MIN_AGE_MONTHS = years(16);

/** "16-23 years" is inclusive of the whole 23rd year, so it ends at 24. */
export const MENB_HEALTHY_MAX_AGE_MONTHS = years(24);
