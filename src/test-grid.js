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
// pairing) to one profile per risk id — all 12, individually — plus added
// PAIR_RISK_PROFILES, every 2-risk combination (66 pairs, C(12,2)). Both are
// DERIVED from RISK_FACTORS, so a 13th risk factor widens both on its own.
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
// RISK_FACTORS, so a 13th risk factor widens both lists with no test edit.
export const ALL_RISK_IDS = RISK_FACTORS.map((r) => r.id);

// The no-risk baseline plus one profile per risk id — 1 + 12 = 13 profiles
// (was 8, one per class pairing, pre-C1).
export const SINGLE_RISK_PROFILES = [[], ...ALL_RISK_IDS.map((id) => [id])];

// Every 2-risk combination — C(12,2) = 66 pairs. A real patient can tick more
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
const EDGE_BAND_HALF_MONTHS = [6.5, 7.5, 11.5, 23.5];
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
