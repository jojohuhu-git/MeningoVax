// The shared patient grid — one module every sweep imports from, instead of
// each sweep typing its own list of risk ids and brands. Plan item B
// (`.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`): add a risk
// factor to `riskFactors.js` or a brand to `brands.js` and every sweep that
// imports from here widens on the next run, with no test edit.
//
// This replaces `sweep-dose-counter.test.js`'s old hand-typed 7-profile
// `RISK_COMBOS` list, which is exactly the kind of second copy the plan is
// about: it did not widen when a risk factor was added, and it hardcoded its
// own `TODAY` one day off the suite's pinned `TEST_TODAY`.
//
// B2 (grid realism, this file as of the B2 commit) fixed three blind spots in
// the grid: every swept age was a whole number of months, every sweep passed
// `ageMonths` directly instead of a `dob` (bypassing the app's own primary age
// path), and no generated dose was ever invalid. See SWEEP_DOBS,
// dobForApproxAgeMonths and the TIGHT profile below.
//
// C1 (2026-09-19): widened SINGLE_RISK_PROFILES from one profile per risk
// CLASS (8 profiles, collapsing e.g. travel/microbiologist/college_dorm/
// outbreak_acwy/pregnancy onto whichever id happened to win its class
// pairing) to one profile per risk id — all 12 at the time, individually —
// plus added PAIR_RISK_PROFILES, every 2-risk combination. Both are DERIVED
// from RISK_FACTORS, so adding or removing a risk factor resizes both on its
// own: 2026-10-16 merged the transplant row into the hard stop and the lists
// went 13 → 12 profiles and 66 → 55 pairs with no edit here.
// The pair sweep runs on SWEEP_DOBS_COARSE (6-month step) instead of the
// 3-month SWEEP_DOBS — see the runtime note by that export.
import { RISK_FACTORS } from './data/riskFactors.js';
import { MENB_BRANDS } from './data/brands.js';
import { addDays, addCalendarMonths } from './logic/dateUtils.js';
import { TEST_TODAY } from './test-today.js';

// StepAge.jsx's own input range (`max="120"`, years) — read here, not retyped.
export const MAX_AGE_MONTHS = 120 * 12;

// Risk factors the engine can actually be asked about. `hct_cart_bcell_exclude`
// hard-stops the whole engine (recommend() returns `excluded: true` before it
// reads anything else) and carries no dose recommendations for a sweep to check.
// Kept for callers that generate doses to check (dose generation assumes a
// non-excluded patient); SINGLE_RISK_PROFILES/PAIR_RISK_PROFILES below sweep
// hct_cart_bcell_exclude too — both sweeps already skip `excluded: true` rows.
export const SWEEPABLE_RISK_FACTORS = RISK_FACTORS.filter((r) => !r.exclude);

// C1: every risk id gets its own profile, individually — not collapsed by
// (menacwyClass, menbClass) pairing the way the pre-C1 grid did. That old
// collapse meant travel/microbiologist/college_dorm/outbreak_acwy/pregnancy —
// each of which recommend.js and validate.js branch on BY ID, beyond their
// shared class (grep `riskIds.includes(` / `riskIds.some(`) — were exercised
// only when they happened to win their class pairing (e.g. 'military' won
// the single/undefined pairing over 'college_dorm' and 'outbreak_acwy', so
// neither of those two ids was ever swept on its own). DERIVED from
// RISK_FACTORS, so a 12th risk factor widens both lists with no test edit.
export const ALL_RISK_IDS = RISK_FACTORS.map((r) => r.id);

// The no-risk baseline plus one profile per risk id — 1 + 11 = 12 profiles
// (was 13 until 2026-10-16, when the transplant row merged into the hard
// stop; was 8, one per class pairing, pre-C1).
export const SINGLE_RISK_PROFILES = [[], ...ALL_RISK_IDS.map((id) => [id])];

// Every 2-risk combination — C(11,2) = 55 pairs. A real patient can tick more
// than one box; pre-C1 the grid never swept a combination at all (C2's
// hand-written 8 clinical combos are the only place that happened, and C2 is
// still not built). Swept on SWEEP_DOBS_COARSE, not SWEEP_DOBS — see that
// export for the runtime reasoning.
export const PAIR_RISK_PROFILES = (() => {
  const pairs = [];
  for (let i = 0; i < ALL_RISK_IDS.length; i++) {
    for (let j = i + 1; j < ALL_RISK_IDS.length; j++) {
      pairs.push([ALL_RISK_IDS[i], ALL_RISK_IDS[j]]);
    }
  }
  return pairs;
})();

// The brand each sweep dose is recorded under, so the generous spacing
// profile below can place a dose at any swept age without also tripping a
// brand age floor.
//
// M2 (2026-09-22): this used to be DERIVED — the brand licensed at the
// single lowest MenACWY floor — which silently re-points to whichever
// product currently has the smallest number. When MenQuadfi's floor (6
// weeks) became lower than Menveo's (2 months), this expression quietly
// became MenQuadfi and Menveo stopped being exercised by every sweep in this
// file. All 278,232 rows kept passing regardless: none of the swept
// properties depend on WHICH MenACWY brand a valid dose carries, so a whole
// brand silently dropping out of every sweep produced zero signal. Pinned
// explicitly instead — see sweep-covers-both-infant-menacwy-brands.test.js
// for the assertion that both infant-eligible brands still exist in the
// product table, which a derived constant cannot fail to notice on its own.
export const MENACWY_SWEEP_BRAND = 'Menveo 2-vial (MenACWY)';
export const MENACWY_SWEEP_BRAND_MIN_AGE = 2; // Menveo 2-vial's own floor, in months
export const MENB_SWEEP_BRAND = MENB_BRANDS[0].label;
export const MENB_SWEEP_BRAND_MIN_AGE = MENB_BRANDS[0].minAgeM;

// ── Dose generation: the GENEROUS profile ─────────────────────────────────
// Spacing wide enough to clear every interval rule in validate.js (the widest
// is MenB healthy dose 2's 6 months), so every generated dose validates as
// clinically VALID. This isolates counting/never-event logic from interval-
// validity logic. The TIGHT profile below (B2c) deliberately violates
// intervals instead, for the properties that need invalid doses.
export const GENEROUS_STEP_MONTHS = 8;
const RECENT_OFFSET_MONTHS = 1;

// Only generate as many doses as fit above the brand's own minimum age — an
// infeasible combo (e.g. 5 doses 8mo apart for a 3-month-old) is capped down,
// not skipped, so every swept age still gets SOME dose-count coverage.
export function feasibleDoseCount(ageMonths, minAgeM, maxCount, stepMonths = GENEROUS_STEP_MONTHS) {
  if (ageMonths < minAgeM) return 0;
  return Math.max(0, Math.min(maxCount, Math.floor((ageMonths - minAgeM) / stepMonths) + 1));
}

export function makeGenerousDoses(ageMonths, count, brand, minAgeM, today = TEST_TODAY) {
  const k = feasibleDoseCount(ageMonths, minAgeM, count);
  const doses = [];
  for (let i = k - 1; i >= 0; i--) {
    const monthsBack = RECENT_OFFSET_MONTHS + i * GENEROUS_STEP_MONTHS;
    doses.push({ date: addDays(today, -Math.round(monthsBack * 30.4375)), brand });
  }
  return doses;
}

// ── Dose generation: the TIGHT profile (B2c) ──────────────────────────────
// B2c: the generous profile above is deliberately spaced wide enough that
// every dose it generates validates — that isolated the counting logic B was
// built for, but it left the entire invalid-dose space unswept: too-soon
// intervals, below-minimum-age doses, doses dated before the patient's own
// birth. This profile does the opposite on purpose: 1-calendar-month spacing
// clears none of validate.js's real intervals (the narrowest, MenACWY's own
// baseline floor between any two doses and MenB high-risk dose 2, is 4 weeks;
// the widest, MenB healthy dose 2, is 6 months — see the interval-constants
// block atop validate.js), so every dose after the first is "too soon". No
// minAgeM floor is applied to where the oldest dose lands, so a young-enough
// patient also gets a dose recorded before their own minimum licensed age —
// and, at the youngest swept ages, one dated before birth. That is
// intentional: those are exactly what never-events properties 1 and 5 need
// invalid data to exercise.
//
// Do NOT use this profile for a counting property (F4 / property 7 in
// sweep-dose-counter.test.js) — invalid doses don't count and are never
// numbered, so they can't expose a numbering bug. Counting properties stay on
// the generous profile above; this one is for "does the app stay sane when
// the history is wrong", not "does the app count a valid history correctly".
export const TIGHT_STEP_MONTHS = 1;

export function makeTightDoses(ageMonths, count, brand, today = TEST_TODAY) {
  const doses = [];
  for (let i = count - 1; i >= 0; i--) {
    const monthsBack = RECENT_OFFSET_MONTHS + i * TIGHT_STEP_MONTHS;
    doses.push({ date: addDays(today, -Math.round(monthsBack * 30.4375)), brand });
  }
  return doses;
}

// ── B2a/B2b: the swept patients, as dates of birth ────────────────────────
// Every sweep used to iterate a plain `ageMonths` integer and pass it
// straight to recommend()/analyzeHistory() as `ageMonths` — bypassing the
// date-of-birth path entirely (patientAgeMonths() prefers `dob` and derives
// the exact-to-the-day age from it; `ageMonths` alone is the fallback for a
// patient with no known birthday). Since PR #42/#44, `dob` is what the real
// app actually keeps and passes, and the calendar-exact arithmetic those PRs
// fixed (dobToAgeMonths, ageAtDoseMonths's calendar-exact branch,
// beforeBirthProblem, the 16th-birthday date) only runs when a `dob` is
// present. A grid that never supplies one exercises none of it.
//
// SWEEP_DOBS below is what every sweep should loop over. For each `dob`, get
// the real age with `dobToAgeMonths(dob, TEST_TODAY)` from `./logic/format.js`
// — do not retype the arithmetic in a sweep file.
export const AGE_STEP_MONTHS = 3;

// A non-multiple of the ~30.4375-day averaged month. Subtracting it from
// every regular-step dob below means NO row in the main sweep lands back on a
// whole-month anniversary at TEST_TODAY — every age comes out fractional.
// Before this, all 95,928+ rows the grid ever generated were an exact integer
// number of months old (B2a) — the same blind spot the 2026-09-18 handoff
// named as "the most productive lens on this codebase" and never applied to
// the grid. B1 (infant band edges) and cal P2-2 (age-at-dose off by up to
// 2.95 days) both survived a green suite because of it.
const FRACTIONAL_OFFSET_DAYS = 11;

export function dobForApproxAgeMonths(approxAgeMonths, today = TEST_TODAY) {
  return addDays(addCalendarMonths(today, -approxAgeMonths), -FRACTIONAL_OFFSET_DAYS);
}

function dobAtAgeMonths(ageMonths, today = TEST_TODAY) {
  return addDays(today, -Math.round(ageMonths * 30.4375));
}

// Ages a defect has actually hidden behind before (B2a). The infant-band
// half-months are where B1 put an extra injection into a 6½-month-old; the
// day either side of each birthday gate is where cal P2-2 miscounted a dose
// by up to 2.95 days; 29 February is the calendar's own edge case — a real
// leap-day `dob`, chosen near the MenACWY 16-year routine-booster gate so
// `addCalendarYears`'s Feb-29 clamp gets exercised, not just guessed at.
// 1.5 (2026-11-21): a baby of about 6½ weeks, inside the MenQuadfi-from-6-weeks
// band (owner MQ6, 2026-11-21: MenQuadfi may be given before the 2-month series).
const EDGE_BAND_HALF_MONTHS = [1.5, 6.5, 7.5, 11.5, 23.5];
const BIRTHDAY_GATE_YEARS = [10, 11, 16, 19];

export const EDGE_CASE_DOBS = [
  ...EDGE_BAND_HALF_MONTHS.map((m) => dobAtAgeMonths(m)),
  ...BIRTHDAY_GATE_YEARS.flatMap((y) => [
    addDays(addCalendarMonths(TEST_TODAY, -y * 12), 1), // one day before the birthday
    addDays(addCalendarMonths(TEST_TODAY, -y * 12), -1), // one day after the birthday
  ]),
  '2010-02-29', // leap-day dob, ~16.5y at TEST_TODAY
];

export const SWEEP_DOBS = (() => {
  const dobs = [];
  for (let am = 0; am <= MAX_AGE_MONTHS; am += AGE_STEP_MONTHS) {
    dobs.push(dobForApproxAgeMonths(am));
  }
  return [...dobs, ...EDGE_CASE_DOBS];
})();

// C1: PAIR_RISK_PROFILES is 66 profiles vs. SINGLE_RISK_PROFILES' 13 — running
// it at the same 3-month AGE_STEP_MONTHS would multiply the sweep's rows by
// roughly the pair-to-single ratio and take the suite from ~14s to the
// high-20s. The plan calls for coarsening the age step for pairs instead,
// since the age *bands* matter most for single risk factors, not for
// checking that two of them combine without a counting/never-event
// violation. Six months keeps a reasonable number of samples per year of
// life while cutting the row count roughly in half. EDGE_CASE_DOBS is still
// included in full — it is 13 dobs, negligible against 66 profiles either way.
export const AGE_STEP_MONTHS_COARSE = 6;

export const SWEEP_DOBS_COARSE = (() => {
  const dobs = [];
  for (let am = 0; am <= MAX_AGE_MONTHS; am += AGE_STEP_MONTHS_COARSE) {
    dobs.push(dobForApproxAgeMonths(am));
  }
  return [...dobs, ...EDGE_CASE_DOBS];
})();

// ── D: turn a recommendation into a recorded dose ─────────────────────────
// Plan item D (two-run relational tests) needs to simulate "the clinician
// followed the card": take today's rec, record the dose it points to, and
// re-run. This is the one piece of scaffolding the plan calls out as not
// existing yet, and it warns that the helper's own assumption can end up
// being what a careless test proves right, instead of the app — so the
// assumption is stated here, once, in the open:
//
// ASSUMPTION: "giving the recommended dose" means recording it under
// `rec.brands[0]` (the first brand the card lists), dated `rec.earliestNextDate`
// if the card names a future date or `today` if it's due now — nothing more
// clinical than that. A real clinician might pick a different brand from the
// same card; this helper always picks the first.
//
// Returns a NEW doses array (does not mutate `doses`); the caller re-runs
// recommend()/analyzeHistory() on the result to see what changed.
export function recordRecommendedDose(rec, doses, today = TEST_TODAY) {
  const brand = rec.brands?.[0];
  if (!brand) return null; // nothing to record — caller should skip this rec
  const date = rec.earliestNextDate ?? today;
  return [...doses, { date, brand }];
}

// How many doses `analyzeHistory()`'s walk currently credits — the highest
// `effectiveDoseNum` among its VALID perDose entries, or 0 if none. Shared
// so "how many doses does this history count as" is asked the same way
// everywhere (sweep-never-events.test.js's property 6 has an inline copy of
// this same reduce predating this export — not touched here, since it was
// already reviewed and shipped; a later session can point it at this export).
export function completedDoseCount(analysis) {
  return analysis.perDose
    .filter((d) => d.status === 'valid' && d.effectiveDoseNum != null)
    .reduce((max, d) => Math.max(max, d.effectiveDoseNum), 0);
}

// ─────────────────────────────────────────────────────────────────────────
// THE SAVED ANSWERS (port Phase 1.1, 2026-11-15)
// ─────────────────────────────────────────────────────────────────────────
//
// Brought over from PneumoVax (its S8, 2026-10-11, and the owner's decision of
// 2026-10-12 to keep impossible entries in a second file). The rule, not the
// code: the shape of MeningoVax's engine is different, so everything below is
// written against MeningoVax's own `recommend()` result.
//
// ── Why ──────────────────────────────────────────────────────────────────
//
// The three sweeps above check PROPERTIES (no "Dose 3 of 2", a valid history
// is never told to restart, following the card does not make things worse).
// None of them notices when a patient's ANSWER changes. A change that moves
// thousands of answers — on purpose or not — leaves them all green. PneumoVax
// learned that twice in one week (P0-2 and ANCHOR-1: 19,546 answers moved and
// every check it had came out identical).
//
// So: run the engine over a fixed grid of synthetic patients, write each
// answer as one line, commit the file, and fail the suite when any line moves.
// `npm run sweep:update` rewrites the files and prints how many answers moved;
// that number goes in the pull request, and somebody says why.
//
// ── Two files ────────────────────────────────────────────────────────────
//
//   saved-answers.tsv          patients a clinician could really enter.
//   saved-answers-record-problems.tsv
//                              records they could not: a dose dated before
//                              birth, after today, or the same shot on two rows.
//
// Kept apart (PneumoVax owner decision, 2026-10-12) so that "300 answers moved"
// means 300 real patients, not 300 lost among impossible records.
//
// ── No sentences in an answer ────────────────────────────────────────────
//
// An answer records what the app DECIDES: what is due, when, which dose number,
// which brands, whether the pentavalent is offered, and for every recorded
// dose whether it counts. It records HOW MANY reasons a dose was given, never
// their words, and no card note, dose label or chip text. Wording changes
// would otherwise turn thousands of lines red, and a gate that cries wolf is a
// gate someone deletes. Wording gets its own check (Phase 1.2, the prose diff).
//
// ── What it is not ───────────────────────────────────────────────────────
//
// A CHANGE detector, not a correctness check. A wrong answer that has always
// been wrong is saved as it is. Correctness is the rulebook's, the regression
// tests' and the owner's job.
//
// ── Its clock ────────────────────────────────────────────────────────────
//
// Every date is built from TEST_TODAY, the one date the whole suite pretends
// it is, so the files are the same on any machine on any day. Moving
// TEST_TODAY moves every line: rerun `npm run sweep:update` in the same commit.

import { recommend } from './logic/recommend.js';
import { dobToAgeMonths } from './logic/format.js';

/**
 * Ages in months, ON the lines the meningococcal rules turn on (plan item 1.4
 * lists them: 2, 7, 12, 24 months; 10, 11, 16, 19, 22, 24 years). An evenly
 * spaced grid misses exactly the cells that break.
 *
 *   2         Menveo's minimum age; the infant high-risk series starts
 *   7         the infant high-risk series changes shape
 *   12, 24    the infant bands' upper edges
 *   60        a young child, booster at 3 years
 *   84        7 years: the first high-risk booster moves from 3 to 5 years
 *   119, 120  the day before and on the 10th birthday: MenB, the pentavalent
 *             and the adolescent count start
 *   132       11 years: the routine MenACWY dose
 *   191, 192  either side of the 16th birthday: the routine booster
 *   228       19 years: routine catch-up ends
 *   264       22 years
 *   288       24 years: MenB shared decision ends (16–23)
 *   600       50 years: an adult
 */
export const SAVED_ANSWER_AGES_MONTHS = [
  2, 7, 12, 24, 60, 84, 119, 120, 132, 191, 192, 228, 264, 288, 600,
];

/**
 * Risk profiles: none, every risk factor on its own (derived, so a new risk
 * factor widens the grid with no edit here), three pairs that put two
 * different pathways on one patient, and the four pairs where pregnancy
 * changes the MenB card (owner, Tier 1 Q4, 2026-11-22, "Add all four"):
 * alone, pregnancy defers MenB; with a MenB high-risk indication the series
 * is given, with the pregnancy line.
 */
export const SAVED_ANSWER_RISK_PROFILES = [
  ...SINGLE_RISK_PROFILES,
  ['asplenia', 'travel'],          // high-risk primary + travel booster rule
  ['college_dorm', 'outbreak_b'],  // the ≥16y rule + a MenB-only risk
  ['military', 'microbiologist'],  // single-dose + single-plus-booster
  ['pregnancy', 'complement'],     // Q4: pregnancy + each MenB high-risk indication
  ['pregnancy', 'asplenia'],
  ['pregnancy', 'microbiologist'],
  ['pregnancy', 'outbreak_b'],
];

/**
 * MenACWY histories, as [brand key, days before today]. Brand keys are what
 * the app's dose form stores (`DoseEditor.jsx`: `value={b.key}`); '' is its
 * "Unknown brand" option. Day gaps straddle each floor with CDC's 4-day grace:
 *
 *   56 / 52 / 51   8 weeks; 8 weeks − 4 days (counts on the grace); one day past
 *   24 / 23        the 4-week floor − 4 days; one day past
 *   ~5 years       a booster
 *   40             a single recent dose: the 16-year booster's 8-week wait (N5)
 *   150            a Penmenvy inside 6 months (N1)
 *
 * The three-dose row whose second dose does not count is the shape the
 * open Ruling D (R-2) turns on: a later dose measured from a dose that did not
 * count. Without it, that ruling would move nothing in this file.
 */
export const SAVED_ANSWER_MENACWY_HISTORIES = [
  [],
  [['MenQuadfi', 3650]],
  [['Menveo', 1825]],
  [['MenQuadfi', 365]],
  [['MenQuadfi', 40]],
  [['MenQuadfi', 400], ['MenQuadfi', 344]],
  [['MenQuadfi', 400], ['MenQuadfi', 348]],
  [['MenQuadfi', 400], ['MenQuadfi', 349]],
  [['Menveo', 400], ['Menveo', 376]],
  [['Menveo', 400], ['Menveo', 377]],
  [['Menveo', 400], ['Menveo', 377], ['Menveo', 340]],
  [['MenQuadfi', 2200], ['MenQuadfi', 375]],
  [['MenQuadfi', 2000], ['MenQuadfi', 1944], ['MenQuadfi', 100]],
  [['Menveo 2-vial', 160], ['Menveo 2-vial', 104], ['Menveo 2-vial', 48]],
  [['Menveo 1-vial', 365]],
  [['Menactra', 3650]],
  // 330, not 365: no MenB history has a dose on that day. On 365 it sat on the
  // same date as the basic MenB dose, and the app (rule G7) reads a pentavalent
  // and a MenB dose on one date as one shot typed twice — an impossible entry
  // by the app's own rule, which belongs in the other file (it is there, on
  // purpose: SAVED_ANSWER_CROSS_DUPLICATES).
  [['Penbraya', 330]],
  [['Penmenvy', 150]],
  [['', 365]],
];

/**
 * MenB histories, same convention.
 *
 *   183 / 130 / 100  healthy dose 2: 6 months; over 4 months (counts, a third
 *                    dose follows); under 4 months
 *   24 / 23          the high-risk 4-week floor − 4 days; one day past
 *   three doses      dose 3 on time; dose 3 early from both dose 1 and dose 2
 *   four doses       a primary series and one booster (D10)
 *   Bexsero then Trumenba   the antigen-family lock
 */
export const SAVED_ANSWER_MENB_HISTORIES = [
  [],
  [['Bexsero', 365]],
  [['Trumenba', 400], ['Trumenba', 217]],
  [['Trumenba', 400], ['Trumenba', 270]],
  [['Trumenba', 400], ['Trumenba', 300]],
  [['Bexsero', 400], ['Bexsero', 376]],
  [['Bexsero', 400], ['Bexsero', 377]],
  [['Bexsero', 400], ['Bexsero', 370], ['Bexsero', 217]],
  [['Bexsero', 400], ['Bexsero', 370], ['Bexsero', 260]],
  [['Bexsero', 400], ['Trumenba', 300]],
  // Primary series (0 / 2 / 6 months) and one booster 14 months later. Added
  // 2026-11-17 for D10: a serogroup B outbreak gets one booster, asplenia
  // every 2–3 years — without a booster on record, neither shows here.
  [['Bexsero', 900], ['Bexsero', 840], ['Bexsero', 720], ['Bexsero', 300]],
  [['', 365]],
];

const savedKey = (ageMonths, riskIds, acwy, menb) => [
  `a${ageMonths}`,
  `r:${riskIds.join('+')}`,
  `A:${acwy.map(([b, d]) => `${b || '?'}@${d}`).join(',')}`,
  `B:${menb.map(([b, d]) => `${b || '?'}@${d}`).join(',')}`,
].join('|');

function savedInput(ageMonths, riskIds, acwy, menb, today) {
  const dob = addCalendarMonths(today, -ageMonths);
  const toDoses = (pattern) => pattern.map(([brand, d]) => ({ date: addDays(today, -d), brand }));
  // Exactly what Results.jsx passes: ageMonths as the app derives it from the
  // date of birth, the dob itself, and no risk-at-dose answers yet.
  return {
    ageMonths: dobToAgeMonths(dob, today),
    dob,
    riskIds,
    menacwyDoses: toDoses(acwy),
    menbDoses: toDoses(menb),
    riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
    today,
  };
}

const beforeBirth = (pattern, dob, today) => pattern.some(([, d]) => addDays(today, -d) < dob);

/**
 * The two MenB histories every MenACWY history is paired with: none, and one
 * dose. Both are in SAVED_ANSWER_MENB_HISTORIES above (the test checks).
 */
export const SAVED_ANSWER_MENB_BASIC = [[], [['Bexsero', 365]]];
const sameHistory = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isBasicMenb = (menb) => SAVED_ANSWER_MENB_BASIC.some((h) => sameHistory(h, menb));

/**
 * Which [MenACWY, MenB] history pairs a patient of this age gets.
 *
 * Not the full cross. The first draft crossed all of them: 35,925 patients,
 * 10 MB, and only 3,507 different answers among them. The trimming is by what
 * can change an answer, not by size:
 *
 *   • Every MenACWY history × {no MenB, one MenB dose}. That is every MenACWY
 *     shape, and whether a MenB dose on record changes the MenACWY card.
 *   • From the MenB minimum age only (10 years; read from the brand table),
 *     every other MenB history × the MenACWY histories with at most one dose.
 *     Those are the MenACWY states the MenB side reads: nothing, recent, old,
 *     and each pentavalent (which credits MenB, and which the pentavalent card
 *     checks for both vaccines being due today). Under 10, MenB is not given,
 *     so more MenB shapes only repeat "too young" answers.
 */
export function savedAnswerHistoryPairs(ageMonths) {
  const pairs = [];
  for (const acwy of SAVED_ANSWER_MENACWY_HISTORIES) {
    for (const menb of SAVED_ANSWER_MENB_BASIC) pairs.push([acwy, menb]);
  }
  if (ageMonths >= MENB_SWEEP_BRAND_MIN_AGE) {
    for (const acwy of SAVED_ANSWER_MENACWY_HISTORIES.filter((h) => h.length <= 1)) {
      for (const menb of SAVED_ANSWER_MENB_HISTORIES.filter((h) => !isBasicMenb(h))) {
        pairs.push([acwy, menb]);
      }
    }
  }
  return pairs;
}

/**
 * Every real patient on the grid. A case is SKIPPED (not trimmed) when any
 * dose would fall before birth: trimming would collapse different histories
 * onto one key. The skipped cases are the record-problem file's part 1.
 */
export function buildSavedAnswerCases({ today = TEST_TODAY } = {}) {
  const cases = [];
  for (const ageMonths of SAVED_ANSWER_AGES_MONTHS) {
    const dob = addCalendarMonths(today, -ageMonths);
    for (const riskIds of SAVED_ANSWER_RISK_PROFILES) {
      for (const [acwy, menb] of savedAnswerHistoryPairs(ageMonths)) {
        if (beforeBirth(acwy, dob, today) || beforeBirth(menb, dob, today)) continue;
        cases.push({
          key: savedKey(ageMonths, riskIds, acwy, menb),
          input: savedInput(ageMonths, riskIds, acwy, menb, today),
        });
      }
    }
  }
  return cases;
}

const nn = (v) => (v == null ? '-' : String(v));
const flag = (v) => (v ? '1' : '0');

/**
 * A brand offered, as a short code: 'Menveo 2-vial (MenACWY)' → 'MV2'. WHICH
 * product is the decision; its spelling is display wording, and short codes
 * keep the file small (brand lists were a third of every line). A brand not
 * listed here falls back to its key, so a new brand still shows up; the test
 * checks every brand in the app has its own code.
 */
export const SAVED_ANSWER_BRAND_CODES = {
  'Menveo 2-vial': 'MV2',
  'Menveo 1-vial': 'MV1',
  Menveo: 'MV',
  MenQuadfi: 'MQ',
  Menactra: 'MA',
  Bexsero: 'BX',
  Trumenba: 'TR',
  Penbraya: 'PB',
  Penmenvy: 'PM',
};
const brandCode = (b) => {
  const k = String(typeof b === 'string' ? b : b?.key ?? b?.label ?? '?').split(' (')[0];
  return SAVED_ANSWER_BRAND_CODES[k] ?? k;
};

/** One recommendation card: decisions only, no note, label or summary text. */
function cardAnswer(rec) {
  return [
    rec.vaccine,
    rec.status,
    flag(rec.dueToday),
    nn(rec.earliestNextDate),
    nn(rec.doseNum),
    nn(rec.seriesTotal),
    nn(rec.primaryTotal),
    nn(rec.minIntervalDays),
    nn(rec.family),
    nn(rec.boosterDueDate),
    flag(rec.boosterDueDateExact),
    (rec.brands ?? []).map(brandCode).join('/'),
  ].join('/');
}

/**
 * One recorded dose: does it count, as which dose, and why not. `reasons`
 * contributes its COUNT only. `recordProblem` is a one-word kind (future,
 * before birth, duplicate), not a sentence.
 */
function doseAnswer(d) {
  return [
    d.status,
    nn(d.effectiveDoseNum),
    flag(d.doesNotCount),
    flag(d.notAdolescentCount),
    flag(d.extraDose),
    flag(d.extraDoseUnverified),
    flag(d.needsInput),
    nn(d.promptDate),
    nn(d.recordProblem),
    `n${(d.reasons ?? []).length}`,
  ].join(':');
}

/** One patient's whole answer, as one line with no sentences in it. */
export function savedAnswerOf(input) {
  const r = recommend(input);
  if (r.excluded) return 'EXCLUDED';
  const p = r.pentavalent ?? {};
  return [
    `A=${(r.menacwy ?? []).map(cardAnswer).join(';')}`,
    `B=${(r.menb ?? []).map(cardAnswer).join(';')}`,
    `P=${flag(p.eligible)}/${(p.brands ?? []).map(brandCode).join('/')}`,
    `dA=${(r.history?.MenACWY?.perDose ?? []).map(doseAnswer).join(',')}`,
    `dB=${(r.history?.MenB?.perDose ?? []).map(doseAnswer).join(',')}`,
    `ageNote=${flag(r.riskAgeNote)}`,
  ].join(' ');
}

/** The real-patient file, one `key<TAB>answer` line per case, sorted. */
export function savedAnswerLines({ today = TEST_TODAY } = {}) {
  return buildSavedAnswerCases({ today })
    .map((c) => `${c.key}\t${savedAnswerOf(c.input)}`)
    .sort();
}

export const SAVED_ANSWERS_RELATIVE_PATH = 'src/logic/__tests__/__saved__/saved-answers.tsv';

// ── The impossible entries ───────────────────────────────────────────────
//
// Part 1: every combination buildSavedAnswerCases() skips because a dose
// falls before birth — its exact complement, the same loops with the
// condition negated, so the two can never fall out of step.
// Part 2: doses dated after today (a negative offset = days AFTER today).
// −1 is one day past the line: a dose dated TODAY still counts, and only a
// case on each side stops someone "simplifying" `<=` to `<`.
// Part 3: the same shot on two rows — same brand, and named plus unnamed
// (`duplicateEntryProblem` treats a blank brand as a match).
export const SAVED_ANSWER_FUTURE_MENACWY = [
  [],
  [['MenQuadfi', -1]],
  [['MenQuadfi', -30]],
  [['MenQuadfi', 365], ['MenQuadfi', -365]],
];
export const SAVED_ANSWER_FUTURE_MENB = [
  [],
  [['Bexsero', -1]],
  [['Bexsero', 365], ['Bexsero', -30]],
];
export const SAVED_ANSWER_DUPLICATE_MENACWY = [
  [],
  [['MenQuadfi', 365], ['MenQuadfi', 365]],
  [['MenQuadfi', 365], ['', 365]],
];
export const SAVED_ANSWER_DUPLICATE_MENB = [
  [],
  [['Bexsero', 365], ['Bexsero', 365]],
];

/**
 * The same shot on two rows ACROSS the two lists: a pentavalent counts as a
 * MenB dose too, so a pentavalent and a MenB dose on one date is, by the app's
 * rule G7 (`duplicateEntryProblem`), one dose typed twice. Named MenB and
 * unnamed. Pairs, not crossed, because each half alone is an ordinary history.
 */
export const SAVED_ANSWER_CROSS_DUPLICATES = [
  [[['Penbraya', 365]], [['Bexsero', 365]]],
  [[['Penbraya', 365]], [['', 365]]],
];

export function buildRecordProblemCases({ today = TEST_TODAY } = {}) {
  const cases = [];
  for (const ageMonths of SAVED_ANSWER_AGES_MONTHS) {
    const dob = addCalendarMonths(today, -ageMonths);
    for (const riskIds of SAVED_ANSWER_RISK_PROFILES) {
      const push = (acwy, menb) => cases.push({
        key: savedKey(ageMonths, riskIds, acwy, menb),
        input: savedInput(ageMonths, riskIds, acwy, menb, today),
      });
      for (const [acwy, menb] of savedAnswerHistoryPairs(ageMonths)) {
        if (beforeBirth(acwy, dob, today) || beforeBirth(menb, dob, today)) push(acwy, menb);
      }
      for (const [acwyShapes, menbShapes] of [
        [SAVED_ANSWER_FUTURE_MENACWY, SAVED_ANSWER_FUTURE_MENB],
        [SAVED_ANSWER_DUPLICATE_MENACWY, SAVED_ANSWER_DUPLICATE_MENB],
      ]) {
        for (const acwy of acwyShapes) {
          for (const menb of menbShapes) {
            if (!acwy.length && !menb.length) continue; // nothing impossible in it
            push(acwy, menb);
          }
        }
      }
      for (const [acwy, menb] of SAVED_ANSWER_CROSS_DUPLICATES) push(acwy, menb);
    }
  }
  return cases;
}

export function recordProblemLines({ today = TEST_TODAY } = {}) {
  return buildRecordProblemCases({ today })
    .map((c) => `${c.key}\t${savedAnswerOf(c.input)}`)
    .sort();
}

export const RECORD_PROBLEM_RELATIVE_PATH =
  'src/logic/__tests__/__saved__/saved-answers-record-problems.tsv';

// ─────────────────────────────────────────────────────────────────────────
// THE TYPICAL PATIENTS (port Phase 1.3, 2026-11-15)
// ─────────────────────────────────────────────────────────────────────────
//
// Brought over from PneumoVax's typical-patient grid (2026-11-05). The saved-
// answer grid above writes every dose as "N days before today", so it cannot
// build an ordinary record: a 17-year-old who had MenACWY at 11 and 16, or a
// 5-year-old with asplenia who finished the infant series. Its doses sit on
// interval edges on purpose; nobody's real record looks like that.
//
// This is a SECOND list, not a change to the first. These patients are in
// NEITHER saved-answer file, so `npm run sweep:update` never touches them.
// They are for the whole-app checks (Phase 1.4), which ask whether the app
// agrees with itself for the patients clinicians actually see.
//
// A dose is written the way a clinician thinks of it:
//   { at: 132 }            given at 132 months (11 years) of age, by the calendar
//   { ago: 2, days: -10 }  given 2 calendar months before today, minus 10 days
//
// The schedules these follow (routine 11–12 and 16, catch-up 13–18; MenB 2
// doses at 0 and 6 months under shared decision; high-risk MenACWY 2 doses 8
// weeks apart then boosters; high-risk MenB 0, 1–2, 6 months; the infant
// high-risk series at 2, 4, 6, 12 months) are the ones in
// docs/agent/meningococcal-rules-summary.md. They are ordinary histories for
// the checks to run on, not assertions that the app's answer to them is right.

/** Children who could have had the infant high-risk series, and young children. */
export const TYPICAL_YOUNG_AGES_MONTHS = [9, 15, 24, 36, 60, 84];

/** Every birthday from 10 through 23, then 24, and adults. */
export const TYPICAL_AGES_MONTHS = [
  120, 132, 144, 156, 168, 180, 192, 204, 216, 228, 240, 252, 264, 276, 288, 360, 600,
];

/** None, and every risk factor on its own except the transplant hard stop. */
export const TYPICAL_RISK_PROFILES = [[], ...SWEEPABLE_RISK_FACTORS.map((r) => [r.id])];

const at = (brand, months) => [brand, { at: months }];

/** MenACWY records a child or teenager really arrives with. */
export const TYPICAL_MENACWY_HISTORIES = [
  [],                                                    // never vaccinated
  [at('MenQuadfi', 132)],                                // routine dose at 11
  [at('MenQuadfi', 132), at('MenQuadfi', 192)],          // routine, booster at 16: on time
  [at('Menveo', 132), at('MenQuadfi', 192)],             // brand changed at the booster
  [at('MenQuadfi', 156)],                                // catch-up at 13
  [at('MenQuadfi', 192)],                                // first dose at 16
  [at('MenQuadfi', 180), at('MenQuadfi', 192)],          // first at 15, booster at 16
  [at('', 132)],                                         // brand not recorded
  [at('Menveo 1-vial', 132), at('Menveo 1-vial', 192)],  // the 1-vial Menveo (10 and older)
  [at('Menactra', 132), at('Menveo', 192)],              // older record, discontinued brand
  [at('MenQuadfi', 132), at('MenQuadfi', 134)],          // high-risk primary, 8 weeks apart
  [at('MenQuadfi', 132), at('MenQuadfi', 134), at('MenQuadfi', 194)], // + 5-year booster
  [at('Menveo 2-vial', 2), at('Menveo 2-vial', 4), at('Menveo 2-vial', 6), at('Menveo 2-vial', 12)], // infant series
  [['Penbraya', { at: 192 }]],                           // pentavalent at 16 (FHbp MenB)
  [['Penmenvy', { at: 192 }]],                           // pentavalent at 16 (4C MenB)
  [['MenQuadfi', { ago: 1, days: 0 }]],                  // a dose last month
];

/** MenB records, for patients 10 and older. */
export const TYPICAL_MENB_HISTORIES = [
  [],
  [at('Bexsero', 192)],                                  // one dose at 16
  [at('Bexsero', 192), at('Bexsero', 198)],              // healthy 2-dose series, 6 months
  [at('Trumenba', 192), at('Trumenba', 198)],
  [at('Bexsero', 132), at('Bexsero', 134), at('Bexsero', 138)],                    // high-risk 0, 2, 6 months
  [at('Bexsero', 132), at('Bexsero', 134), at('Bexsero', 138), at('Bexsero', 150)], // + booster at 1 year
  [['Trumenba', { at: 198 }]],                            // the MenB dose after a Penbraya at 16
  [['Bexsero', { at: 198 }]],                             // the MenB dose after a Penmenvy at 16
];

const typicalDate = (w, dob, today) => (w.at != null
  ? addCalendarMonths(dob, w.at)
  : addDays(addCalendarMonths(today, -w.ago), w.days ?? 0));
const typicalWord = (w) => (w.at != null ? `${w.at}m` : `-${w.ago}m${w.days ? `${w.days > 0 ? '+' : ''}${w.days}d` : ''}`);
const typicalKey = (age, riskIds, acwy, menb) => [
  `t${age}`,
  `r:${riskIds.join('+')}`,
  `A:${acwy.map(([b, w]) => `${b || '?'}@${typicalWord(w)}`).join(',')}`,
  `B:${menb.map(([b, w]) => `${b || '?'}@${typicalWord(w)}`).join(',')}`,
].join('|');

function typicalCase(ageMonths, riskIds, acwy, menb, today) {
  const dob = addCalendarMonths(today, -ageMonths);
  const toDoses = (h) => h.map(([brand, w]) => ({ date: typicalDate(w, dob, today), brand }));
  const menacwyDoses = toDoses(acwy);
  const menbDoses = toDoses(menb);
  // A dose that would fall before birth or after today is not a typical record.
  if ([...menacwyDoses, ...menbDoses].some((d) => d.date < dob || d.date > today)) return null;
  return {
    key: typicalKey(ageMonths, riskIds, acwy, menb),
    input: {
      ageMonths: dobToAgeMonths(dob, today),
      dob,
      riskIds,
      menacwyDoses,
      menbDoses,
      riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
      today,
    },
  };
}

/**
 * The same patient after the clinician has answered every "was this patient at
 * high risk when this dose was given?" question with YES.
 *
 * ASSUMPTION, stated once: a typical patient with a risk box ticked had that
 * risk when each dose was given (asplenia, complement deficiency and HIV are
 * usually lifelong). The app asks; a first screen shows the question
 * unanswered, which is the case above. Answers are keyed by each dose's place
 * in its date-ordered list (`doseAnswerKey`); every place is answered, so an
 * answer is never missing because a pentavalent added a MenB row.
 */
function answeredYes(c) {
  const yes = (doses) => Object.fromEntries(doses.map((_, i) => [i, 'yes']));
  // A pentavalent counts on both lists, so the MenB list can be longer by
  // the number of pentavalents recorded.
  const menbRows = [...c.input.menbDoses, ...c.input.menacwyDoses];
  return {
    key: c.key.replace(/^t/, 'ty'),
    input: {
      ...c.input,
      riskAtDoseAnswers: { MenACWY: yes(c.input.menacwyDoses), MenB: yes(menbRows) },
    },
  };
}

const asksAQuestion = (input) => {
  const h = recommend(input).history ?? {};
  return [...(h.MenACWY?.perDose ?? []), ...(h.MenB?.perDose ?? [])].some((d) => d.needsInput);
};

/**
 * Every typical patient. Under 10, MenB is not given, so only the MenACWY
 * records are used (with no MenB). From 10, every MenACWY record with every
 * MenB record. A patient the app asks a risk-at-dose question about appears
 * twice: as first seen (key `t…`), and answered yes (key `ty…`).
 */
export function buildTypicalCases({ today = TEST_TODAY } = {}) {
  const cases = [];
  for (const ageMonths of [...TYPICAL_YOUNG_AGES_MONTHS, ...TYPICAL_AGES_MONTHS]) {
    const menbList = ageMonths >= MENB_SWEEP_BRAND_MIN_AGE ? TYPICAL_MENB_HISTORIES : [[]];
    for (const riskIds of TYPICAL_RISK_PROFILES) {
      for (const acwy of TYPICAL_MENACWY_HISTORIES) {
        for (const menb of menbList) {
          const c = typicalCase(ageMonths, riskIds, acwy, menb, today);
          if (!c) continue;
          cases.push(c);
          if (asksAQuestion(c.input)) cases.push(answeredYes(c));
        }
      }
    }
  }
  return cases;
}
