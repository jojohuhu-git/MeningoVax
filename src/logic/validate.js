// ─────────────────────────────────────────────────────────────────────────
// validate.js — dose-history validation layer for MeningoVax.
//
// Pure functions. Given a vaccine's recorded dose history, age, risk IDs, and
// a reference date, provides:
//
//   analyzeHistory(vaccine, doses, ageMonths, riskIds, today)
//     → { perDose: [...], effective: [...] }
//
//   perDose — parallel to input doses. Each entry:
//     { status: 'valid'|'invalid'|'unknown', effectiveDoseNum: number|null,
//       reasons: string[], detail?: string, doesNotCount?: true }
//
//   effective — the kept (valid + unknown) doses in chronological order.
//     These are what the recommendation engine should count.
//
//   validateHistory(vaccine, doses, ageMonths, riskIds, today)
//     → Array<{status, reasons, detail?}>   (backward-compat — same as perDose
//       but without effectiveDoseNum/doesNotCount; callers that only need the
//       display-only result can still use this.)
//
// Design: mirrors vaxapp's validatedHistory() last-kept walk. Each dose is
// validated against the KEPT list so far, not the raw list. This prevents
// false "interval too short" cascades when an earlier dose is dropped (e.g.
// if D1 is invalid, D2 is re-evaluated as effective D1 — not flagged as
// "too soon after D1").
//
// Counting policy (ACIP):
//   - Invalid dose → dropped; does NOT count. Message: "does not count —
//     repeat this dose only, do not restart the series."
//   - Unknown (no date) → COUNTS; is not a timing anchor for later doses.
//   - MenB family mismatch (4C vs FHbp) → invalid → does not count. Only
//     checked when BOTH brands are known.
//   - MenB healthy D2 given <6 months after D1 → VALID (counts); rescue
//     dose path fires in the engine. NOT dropped.
//
// Sources:
//   • ACIP 2020 MMWR (RR-9): meningococcal schedule — doi:10.15585/mmwr.rr6909a1
//   • CDC adult meningococcal schedule notes:
//       https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
//   • CDC child/adolescent meningococcal notes:
//       https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening
//   • CDC MenB child notes:
//       https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b
//   • immunize.org Ask the Experts:
//       https://www.immunize.org/ask-experts/meningococcal-vaccines/
//   • Penmenvy MMWR 2025: https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm
//   • Penbraya MMWR 2023: https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm
// ─────────────────────────────────────────────────────────────────────────

import { daysBetween, calendarMonthsBetween, calendarIntervalElapsed, todayISO, DAYS } from './dateUtils.js';
import { hasMenbRisk, menacwyRiskClass, menacwyInfantSeriesIndicated } from '../data/riskFactors.js';
import {
  menbFamily, ALL_BRANDS, MENACWY_MIN_AGE_MONTHS, MENB_MIN_AGE_MONTHS,
} from '../data/brands.js';
import { menacwySeriesInfo, menbSeriesInfo, menacwyPrimaryTotal } from './seriesTotals.js';
// P0-1 (2026-09-17): the infant primary intervals now come from one module,
// shared with recommend.js, so the engine cannot recommend a dose the validator
// then rejects (or, as here, accept one the engine's own card called too soon).
import {
  menacwyInfantNextDoseGate, ageMeetsMinimum, intervalMeetsMinimum,
  calendarIntervalMeetsMinimum, MENACWY_HIGHRISK_PRIMARY_GAP,
  MENACWY_FIRST_BOOSTER_YEARS_UNDER_7, MENACWY_BOOSTER_CADENCE_YEARS,
  MENB_HIGHRISK_FIRST_BOOSTER_YEARS, MENB_HIGHRISK_BOOSTER_CADENCE_YEARS,
  MENACWY_REPEAT_DOSE_FLOOR, MENB_HIGHRISK_D2_GAP,
  MENB_HIGHRISK_D3_MONTHS_FROM_D1, MENB_HIGHRISK_D3_MONTHS_FROM_D2,
  MENB_HEALTHY_D2_MONTHS, MENB_HEALTHY_RESCUE_MONTHS,
} from './intervals.js';
// P2-3 (2026-09-17): the age thresholds. This file used to keep FIVE private
// copies -- AGE_7Y_MONTHS, AGE_16Y_MONTHS, a function-local AGE_10Y_MONTHS,
// MENB_HEALTHY_MIN_AGE_MONTHS, and two "most permissive product floor"
// constants that restated brands.js -- plus a hand-typed second birthday in
// two more places. The engine kept its own copies of the same numbers, and
// nothing compared them.
import {
  MENACWY_INFANT_SERIES_MAX_AGE_MONTHS, MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS,
  MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, MENACWY_BOOSTER_AGE_SPLIT_MONTHS,
  MENB_HEALTHY_MIN_AGE_MONTHS,
} from './ages.js';
import { fmtAgeMonths } from './format.js';
import { cite } from '../data/refs.js';
import { doseAnswerKey } from './doseIdentity.js';
import { fmtDate, stripAntigen } from './format.js';

// ── Min-age lookup from brands.js (TASK 1) ───────────────────────────────
// ALL_BRANDS is the single source of truth for minAgeM per product.
// maxAgeM is 999 for all meningococcal products → no upper-age check needed.
//
// Given a brand string (e.g. 'Penbraya (MenABCWY)' or 'Bexsero (MenB)'),
// finds the matching ALL_BRANDS entry by startsWith(b.key) and returns minAgeM.
// Returns null when no match found (caller chooses the permissive fallback).
function brandMinAgeM(brandStr) {
  if (!brandStr) return null;
  for (const b of ALL_BRANDS) {
    if (brandStr.startsWith(b.key)) return b.minAgeM;
  }
  return null;
}

// The most permissive product floor for each vaccine, used when a recorded
// dose's brand is unknown so we don't false-flag a dose we can't identify.
// P2-3 (2026-09-17): these used to be typed out here as 2 and 120, under a
// comment explaining which products they came from. They now come from the
// product table itself, so adding a product cannot leave them behind.
const MIN_AGE_MENACWY_PERMISSIVE_MONTHS = MENACWY_MIN_AGE_MONTHS;
const MIN_AGE_MENB_PERMISSIVE_MONTHS = MENB_MIN_AGE_MONTHS;

// ── Interval constants — reuse the recommend.js patterns ─────────────────
// MenACWY: baseline minimum between ANY two doses regardless of risk class
// (duplicate-dose detection, Task 3). The high-risk rule (8wk) is stricter
// and wins when it applies. NOTE: this baseline only catches interval
// violations; routine 11-12y vs 16y *position* logic stays in the engine.
const MENACWY_BASELINE_MIN_INTERVAL    = MENACWY_REPEAT_DOSE_FLOOR;
// MenACWY high-risk 2-dose primary (≥2y): P2-1 (2026-09-17) moved this to
// intervals.js, so the validator and the engine ask the same function instead
// of each keeping their own 56.
const MENACWY_HR_ADULT_MIN_INTERVAL    = MENACWY_HIGHRISK_PRIMARY_GAP;
// MenACWY infant high-risk series: the gaps are no longer a constant here.
// P0-1 (2026-09-17): this was `DAYS.weeks(4)` and it was wrong — ACIP RR-9's
// Tables 4-6 footnote and the CDC child schedule both require 8 weeks between
// the early doses, and 12 weeks plus the first birthday before the final one.
// The 4-week floor it had been given is ACIP's rule for REPEATING an invalid
// dose, and in the MMWR it appears only in the MenB section. Both numbers now
// come from menacwyInfantNextDoseGate() in intervals.js, which derives them
// from the series total so they cannot drift from it again.
// MenACWY high-risk boosters: every 5 years (or 3 years if last dose given <7y)
// P0-5 (2026-09-15): these are now YEAR counts compared on the calendar. A
// real three-year span is 1095 or 1096 days depending on whether a 29 February
// falls inside it, and DAYS.years(3) demanded 1096 — so a booster given on its
// exact three-year anniversary was voided as "too soon" roughly a quarter of
// the time, and the card re-offered it the same day. DAYS.years(5) = 1826
// happened to be safe (five-year spans are 1826-1827 days), but it moves to the
// calendar helper too so it cannot drift. The *_DAYS twins are display only.
// P1-3 (2026-09-15): the dose that completes a 3-dose infant series must be
// >=12 weeks after dose 2 AND after age 12 months (CDC, MenACWY special
// situations, the 3-6-month row).
// P2-1 group 2 (2026-09-17): the two year counts now come from intervals.js,
// the same module the engine reads, so the validator cannot keep a 3 and a 5
// that quietly disagree with the cadence the card advertises.
const MENACWY_BOOSTER_5Y_YEARS         = MENACWY_BOOSTER_CADENCE_YEARS;
const MENACWY_BOOSTER_3Y_YEARS         = MENACWY_FIRST_BOOSTER_YEARS_UNDER_7;
const MENACWY_BOOSTER_5Y               = DAYS.years(MENACWY_BOOSTER_5Y_YEARS);  // display only
const MENACWY_BOOSTER_3Y               = DAYS.years(MENACWY_BOOSTER_3Y_YEARS);  // display only
// MenB high-risk: D2 ≥4 weeks after D1
const MENB_HR_D2_MIN_INTERVAL          = MENB_HIGHRISK_D2_GAP;
// MenB high-risk: D3 ≥6 months after D1 AND ≥4 months after D2
// P0-4 (2026-09-15): these four are now MONTH counts compared on the calendar,
// not day counts compared against an averaged 30.4375-day month. DAYS.months(6)
// is 183 days while a real six-month span is 181-184, so a dose given exactly
// six calendar months later was rejected roughly half the time, depending only
// on which month the patient started in. The *_DAYS twins below are kept
// purely so the human-readable "(min ~6 months)" text keeps printing the same
// approximate figure it always did.
const MENB_HR_D3_MIN_MONTHS_FROM_D1    = MENB_HIGHRISK_D3_MONTHS_FROM_D1;
const MENB_HR_D3_MIN_FROM_D1           = DAYS.months(MENB_HR_D3_MIN_MONTHS_FROM_D1); // display only
const MENB_HR_D3_MIN_MONTHS_FROM_D2    = MENB_HIGHRISK_D3_MONTHS_FROM_D2;
const MENB_HR_D3_MIN_FROM_D2           = DAYS.months(MENB_HR_D3_MIN_MONTHS_FROM_D2); // display only
// MenB high-risk booster: first booster ≥1 year after D3; subsequent ≥2 years
const MENB_HR_FIRST_BOOSTER_MIN        = DAYS.years(MENB_HIGHRISK_FIRST_BOOSTER_YEARS);
const MENB_HR_SUBSEQUENT_BOOSTER_MIN   = DAYS.years(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS); // display only
// MenB healthy 2-dose: D2 ≥6 months after D1 (early D2 triggers rescue)
const MENB_HEALTHY_D2_MIN_MONTHS       = MENB_HEALTHY_D2_MONTHS;
const MENB_HEALTHY_D2_MIN_INTERVAL     = DAYS.months(MENB_HEALTHY_D2_MIN_MONTHS); // display only
// MenB healthy early-D2 rescue: D3 ≥4 months after early D2
const MENB_RESCUE_D3_MIN_MONTHS_FROM_D2 = MENB_HEALTHY_RESCUE_MONTHS;
const MENB_RESCUE_D3_MIN_FROM_D2       = DAYS.months(MENB_RESCUE_D3_MIN_MONTHS_FROM_D2); // display only

// Age band for infant-booster cadence check (7 years in months)
const AGE_7Y_MONTHS = MENACWY_BOOSTER_AGE_SPLIT_MONTHS;
// Routine (non-high-risk) MenACWY booster age floor (16 years in months)
const AGE_16Y_MONTHS = MENACWY_ROUTINE_BOOSTER_AGE_MONTHS;

// ── Helpers ───────────────────────────────────────────────────────────────

// Age in months at a past dose, from its date + current patient age + today.
// Returns null when the date is absent (caller handles unknown-date doses).
// Exported for display surfaces (e.g. the compliance audit table) that need
// to show "age at administration" without re-deriving the date math.
export function ageAtDoseFromDate(dose, ageMonths, today) {
  if (!dose?.date) return null;
  // calendarMonthsBetween(dose.date, today), not daysBetween(...)/30.4375 — the
  // averaged divisor drifts off whole months depending on how many leap days a
  // span happens to contain, which can wrongly place a dose given exactly on a
  // birthday on the wrong side of a whole-year threshold (e.g. the age-10 cutoff
  // below). See calendarMonthsBetween's own comment for the concrete example.
  // Rounded to 6 decimal places: subtracting two large nearly-equal floats
  // (both ~months since a distant birthday) leaves binary floating-point noise
  // (e.g. 119.99999999999999 instead of 120) that would otherwise still trip a
  // "< 120" threshold check by less than a microsecond's worth of "age".
  return Math.round((ageMonths - calendarMonthsBetween(dose.date, today)) * 1e6) / 1e6;
}

// Human-readable rendering of a day count for error messages.
function fmtDays(n) {
  if (n < 14) return `${n} day${n === 1 ? '' : 's'}`;
  if (n < 60) return `~${Math.round(n / 7)} week${Math.round(n / 7) === 1 ? '' : 's'}`;
  if (n < 365) return `~${Math.round(n / 30.4375)} month${Math.round(n / 30.4375) === 1 ? '' : 's'}`;
  return `~${+(n / 365.25).toFixed(1)} year${+(n / 365.25).toFixed(1) === 1 ? '' : 's'}`;
}

// Format an age in months using clinical units, for the record panel's
// sentences. This is NOT a second implementation: the units themselves come
// from format.js's fmtAgeMonths(), the one canonical formatter.
//
// P1-3 (2026-09-17): it used to be a near-copy of fmtAgeMonths MINUS the
// carry-over normalisation that function carries an explicit comment about, so
// the app went on printing "15 years 12 months" — the exact string format.js
// had been fixed never to emit — while the original stayed correct and its
// regression test stayed green. Same one-rule-two-copies shape as the rest of
// this queue, in the display layer.
//
// Two differences are deliberate and are kept here rather than pushed into
// format.js, because they belong to THIS caller's sentences:
//   - '?' rather than '' for an unknown age: every call site writes "~${age}",
//     so an empty string would render "Given at ~, before age 10".
//   - lower-case 'birth', for the same reason — it appears mid-sentence.
// Both are pinned by regression-p1-3-one-age-formatter.test.js.
function fmtAgeMClinical(m) {
  if (m == null) return '?';
  // P1-3 (impossible-entries, 2026-09-17): this guard used to read `m < 0.5`,
  // which swallowed every negative age into the word "birth" -- so a dose dated
  // before the patient was born was reported as "Given at ~birth" and blamed on
  // the patient's age. Negatives are separated out first; lower case, like
  // 'birth' below, because these strings appear mid-sentence after "~".
  if (m < 0) return 'before birth';
  if (m < 0.5) return 'birth';
  return fmtAgeMonths(m);
}

// Format a min-age threshold for human-readable messages.
// Always expresses in years when ≥12 months (e.g. 120 → "10 years").
function fmtMinAge(minAgeM) {
  if (minAgeM >= 12) {
    const y = minAgeM / 12;
    return `${y} year${y === 1 ? '' : 's'} (${minAgeM} months)`;
  }
  return `${minAgeM} month${minAgeM === 1 ? '' : 's'}`;
}

// Build an 'unknown' result for a dose whose date is missing.
function unknownResult(reasons) {
  return { status: 'unknown', reasons };
}

// Build a 'valid' result.
function validResult(reasons = []) {
  return { status: 'valid', reasons };
}

// Build a 'record problem' result: the entry itself is wrong, as opposed to a
// real dose given at the wrong time. `kind` names which problem it is, so the
// card can label the chip — the wording itself stays in RecCard with the rest
// of the vocabulary, not down here in the rules.
//
// G3 (2026-09-16): these are graded like an invalid dose — not counted — but
// they must NOT collect the walk's "repeat this dose only" advice. That advice
// is for a dose that WAS given, too early or too close to the last one. When
// the problem is the typing, repeating a shot nobody received is nonsense; the
// fix is to correct the record.
function recordProblemResult(kind, reasons, detail) {
  const r = { status: 'invalid', recordProblem: kind, reasons };
  if (detail != null) r.detail = detail;
  return r;
}

/**
 * G3: a dose dated after today. The record lists doses the patient has already
 * received, so a future date is either a typo (a mistyped year, most often) or
 * a scheduled appointment typed into the wrong place. Counting it would tell a
 * clinician the patient is covered by a shot that is not in their arm.
 *
 * Checked once here for both vaccines rather than inside each validator —
 * nothing about it is vaccine-specific, and a second copy is how rules drift.
 * Returns null when the date is absent or is today or earlier.
 */
function futureDatedProblem(dose, today) {
  if (!dose?.date || !today || dose.date <= today) return null;
  return recordProblemResult(
    'future',
    [`This date is in the future — today is ${fmtDate(today)}. A dose cannot have been given yet, so it is not counted. Check the date: if the year is a typo, correct it; if this is an appointment the patient has not attended yet, take it out of the record, which lists doses already given.`],
    `Recorded date: ${fmtDate(dose.date)}. Today: ${fmtDate(today)}.`
  );
}

/**
 * G7 (2026-09-16): the same shot recorded on two rows.
 *
 * Two doses of the same vaccine are never given on the same day, so a date
 * that already appears on a COUNTED row means the row was typed twice — the
 * commonest slip when a paper record is being copied in.
 *
 * The grading was already right (it does not count). What was wrong was the
 * explanation: the interval rule got there first and said "Given only 0 days
 * after the previous dose. Minimum interval … is 4 weeks", then the walk added
 * "repeat this dose only" — telling a clinician to give a shot the patient has
 * already had, to fix a problem that only exists in the typing.
 *
 * Matched against `kept`, not against every row walked so far: if the row this
 * one would duplicate was itself dropped, nothing counted on that date and this
 * row is the first real one.
 */
function duplicateEntryProblem(dose, kept) {
  if (!dose?.date) return null;
  const twin = kept.find((k) => k?.date === dose.date);
  if (!twin) return null;

  const reasons = [
    `The same date is already recorded on an earlier row (${fmtDate(dose.date)}), so this looks like one dose entered twice. It is not counted. Two doses of the same vaccine are never given on the same day — if the patient really did receive another dose, correct its date; otherwise remove this row.`,
  ];
  if (dose.brand && twin.brand && dose.brand !== twin.brand) {
    reasons.push(`The two rows name different brands (${stripAntigen(twin.brand)} and ${stripAntigen(dose.brand)}), so at least one of them is wrong.`);
  }
  return recordProblemResult('duplicate', reasons, `Same date as a dose already recorded: ${fmtDate(dose.date)}.`);
}

// Build an 'invalid' result.
//
// G4 (2026-09-16): `reasonCites` is an ORDERED list of citation objects, one
// per literal "[c]" placeholder across `reasons`, in order — the same contract
// recommend.js uses for a rec card's note. RecCard assigns the visible [N] at
// render time. Only the age-based "this dose does not count" verdicts carry
// one; see g4-discounting-verdicts-cite-source.test.js for the scope rule.
function invalidResult(reasons, detail, reasonCites) {
  const r = { status: 'invalid', reasons };
  if (detail != null) r.detail = detail;
  if (reasonCites && reasonCites.length) r.reasonCites = reasonCites;
  return r;
}

// ── Core per-dose validators (operate on EFFECTIVE kept list) ─────────────
//
// IMPORTANT: `effectiveIdx` is the position in the kept list (0-based), and
// `kept` is the array of doses kept so far (NOT the full raw list). This is
// what enables correct re-evaluation when an earlier dose is dropped.

function validateOneMenACWY(dose, effectiveIdx, kept, ageMonths, riskIds, today, riskAnswer) {
  // P1-1 (2026-09-17): every age and interval below allows CDC's 4-day grace —
  // "doses administered <=4 days before the minimum age or interval are
  // considered valid". `whenGiven` carries what ageMeetsMinimum() needs to
  // re-derive the age as if the dose were 4 days later. See intervals.js for
  // the quote and for the two places the grace deliberately does NOT apply.
  const whenGiven = { doseDate: dose.date || null, ageMonths, today };
  // No date → interval cannot be checked, but a min-age conflict may still be
  // decidable: a past dose can never have been given later than today, so the
  // patient's CURRENT age is an upper bound on the age at administration.
  // If a KNOWN brand's minimum age exceeds the current age, the dose could not
  // have been valid at any point in the patient's life → invalid (does not count).
  // Unknown brand → permissive fallback (Menveo 2-vial, 2 months) → does not
  // flag, per ACIP (any brand may be used when prior history/brand is unknown).
  if (!dose.date) {
    const brand = dose.brand || '';
    const knownBrandMin = brandMinAgeM(brand); // null when brand unknown
    if (knownBrandMin !== null && !ageMeetsMinimum(ageMonths, knownBrandMin, { doseDate: today, ageMonths, today })) {
      const brandLabel = brand.replace(/\s*\(Men(?:ACWY|B|ABCWY)\).*/, '');
      return invalidResult(
        [`Recorded without a date, but the patient is currently only ~${fmtAgeMClinical(ageMonths)}, below the minimum age of ${fmtMinAge(knownBrandMin)} for ${brandLabel}. A past dose cannot have been given later than today, so it could not have been given at a valid age. This dose does not count.`],
        `Current age (upper bound on age at administration): ~${fmtAgeMClinical(ageMonths)}. Minimum for ${brandLabel}: ${fmtMinAge(knownBrandMin)}.`
      );
    }
    const minAgeM = knownBrandMin ?? MIN_AGE_MENACWY_PERMISSIVE_MONTHS;
    return unknownResult([
      `No date recorded: cannot verify age at administration or interval from prior dose. Dose is counted in the series (must have been given at ≥${fmtMinAge(minAgeM)} to be valid).`
    ]);
  }

  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today);

  // ── Min-age check (Task 1) ────────────────────────────────────────────
  // Use ALL_BRANDS as the single source of truth for minAgeM.
  // Unknown brand → fall back to the most permissive (Menveo, 2 months) so
  // we don't false-flag a dose recorded without a brand.
  // Note: maxAgeM is 999 for all MenACWY products — no upper-age check needed.
  const brand = dose.brand || '';
  const minAgeM = brandMinAgeM(brand) ?? MIN_AGE_MENACWY_PERMISSIVE_MONTHS;

  if (ageAtDose !== null && !ageMeetsMinimum(ageAtDose, minAgeM, whenGiven)) {
    const brandLabel = brand
      ? brand.replace(/\s*\(Men(?:ACWY|B|ABCWY)\).*/, '')
      : 'this brand';
    return invalidResult(
      [`Given at ~${fmtAgeMClinical(ageAtDose)}, below the minimum age of ${fmtMinAge(minAgeM)} for ${brandLabel}.`],
      `Age at administration: ~${fmtAgeMClinical(ageAtDose)}. Minimum for ${brandLabel}: ${fmtMinAge(minAgeM)}.`
    );
  }

  // ── A3: pre-age-10 doses don't count toward the routine adolescent series ─
  // ACIP/immunize.org: "doses given before age 10 years should not be counted"
  // toward the routine 11-12y + 16y adolescent schedule. This is NOT a min-age
  // "invalid" flag — the dose was validly given (above its product's licensed
  // minimum age) — it simply doesn't advance the adolescent series. Only
  // applies when the patient has no CURRENT high-risk indication; the
  // high-risk infant series (given at riskClass === 'primary2') appropriately
  // starts before age 10 and must keep counting those doses.
  // Source: https://www.immunize.org/ask-experts/topic/menacwy/vaccine-recommendations-menacwy/
  // M9 (2026-09-15): 'single+boost' (travel, microbiologist) is spared too, not
  // just 'primary2'. ACIP: "Children who received MenACWY at age <11 years and
  // for whom booster vaccination is recommended because of an ongoing increased
  // risk should follow the booster dose schedule (Tables 4, 5, 6, 7, 8, and 9),
  // not the routine adolescent schedule" — Table 9 is travel, Table 7 is
  // microbiologists. Discarding a traveler's dose at age 3 made the engine ask
  // for "1 dose (ongoing-risk indication)" today: the dose they already had.
  // 'single' (military, college dorm, ACWY outbreak) is NOT spared — those are
  // one-and-done indications with no booster schedule to follow.
  const AGE_10Y_MONTHS = MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS;
  const isHighRiskNow = menacwyRiskClass(riskIds) === 'primary2';
  // 'single+boost' is travel and microbiologist: one primary dose, then boosters
  // for as long as the risk lasts. They follow a booster schedule, so their
  // earlier doses count. 'primary2' is the medical high-risk series.
  const ongoingRiskNow = isHighRiskNow || menacwyRiskClass(riskIds) === 'single+boost';
  // M10 (2026-09-15): an infant on the MenACWY INFANT series is not on the
  // routine adolescent series at all, so this rule must not eat their doses.
  // It matters for the A/C/W/Y OUTBREAK indication specifically: outbreak is
  // riskClass 'single', deliberately not spared above because it used to mean
  // one dose at any age. M10 put outbreak infants (and travel infants) on the
  // 4-dose infant series — ACIP 2020 MMWR 69(RR-9) Table 8's "2–23 mos" row —
  // and every dose of that series is by definition given before age 10, so all
  // of them were discarded: a baby who had already had two doses was told to
  // start again at dose 1.
  //
  // The guard is deliberately narrow — the patient must be under 2 TODAY, still
  // on the infant series. Whether those infant doses should also count toward
  // the adolescent series years later is the separate risk-at-dose question the
  // owner has parked (queue item 21), and this does not answer it.
  const onInfantSeriesNow = ageMonths < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS
    && menacwyInfantSeriesIndicated(riskIds);
  // M12 (2026-09-15): an A/C/W/Y outbreak contact follows a booster schedule too,
  // so their earlier doses count at ANY age, not only under 2. ACIP 2020 MMWR
  // 69(RR-9) Table 8 gives a previously-vaccinated patient identified at risk
  // again "a single dose if >=3 yrs since vaccination" (under 7) or ">=5 yrs" (7
  // or older) — and the ACIP sentence this whole rule turns on names that very
  // table: "Children who received MenACWY at age <11 years and for whom booster
  // vaccination is recommended because of an ongoing increased risk should follow
  // the booster dose schedule (Tables 4, 5, 6, 7, 8, and 9), not the routine
  // adolescent schedule." Discarding the dose made the app offer dose 1 again
  // instead of the top-up.
  //
  // Military recruits and college residents keep the old treatment: they are
  // 'single' too, but Table 10 gives them no booster schedule to follow.
  const onOutbreakSchedule = riskIds.includes('outbreak_acwy');
  if (!ongoingRiskNow && !onInfantSeriesNow && !onOutbreakSchedule && ageAtDose !== null && !ageMeetsMinimum(ageAtDose, AGE_10Y_MONTHS, whenGiven)) {
    return {
      status: 'valid',
      reasons: [`Given before age 10 (~${fmtAgeMClinical(ageAtDose)}): does not count toward the adolescent MenACWY series. [c]`],
      reasonCites: [cite('acwyBeforeAge10')],
      notAdolescentCount: true,
    };
  }

  // ── Risk-at-dose ambiguity: high-risk-NOW patient, dose given before age 10 ─
  // Whether this dose counted toward the high-risk primary series depends on
  // whether the patient was ALREADY high-risk on the date it was given — a
  // fact this app's data model doesn't capture (only CURRENT risk checkboxes
  // are recorded). Permanence ≠ always-been-present (e.g. asplenia acquired
  // at 13 doesn't retroactively cover an age-8 dose), so this fires for every
  // high-risk-now patient with an ambiguous dated dose, not just "temporary"
  // risk types. Owner-confirmed design, 2026-07-23 handoff.
  let answeredYesNote = null;
  if (isHighRiskNow && ageAtDose !== null && !ageMeetsMinimum(ageAtDose, AGE_10Y_MONTHS, whenGiven)) {
    if (riskAnswer === undefined) {
      return {
        status: 'pending',
        needsInput: true,
        reasons: [`Given at ~${fmtAgeMClinical(ageAtDose)}, before age 10. Whether this dose counts toward the high-risk series depends on whether the patient was already high-risk on that date — not recorded.`],
        promptDate: dose.date,
      };
    }
    if (riskAnswer === 'no' || riskAnswer === 'unsure') {
      return {
        status: 'valid',
        reasons: [`Given at ~${fmtAgeMClinical(ageAtDose)}, before age 10. Marked as ${riskAnswer === 'unsure' ? 'unsure whether the patient was' : 'not'} high-risk on that date — treated conservatively as not counting toward the adolescent/high-risk series. [c]`],
        reasonCites: [cite('acwyBeforeAge10')],
        notAdolescentCount: true,
      };
    }
    // riskAnswer === 'yes' → falls through to the high-risk interval checks
    // below as an effective primary-series dose.
    // U3 (2026-09-17): this ran to 154 characters and was repeated verbatim on
    // every counted row of the series, differing only in the age. Two of its
    // three clauses were already on the row: "counted toward the series" is
    // what the "Dose N of M" chip means, and "in response to the risk-timing
    // question" is the "Edit" button sitting beside it. What is left is the
    // part that actually varies.
    answeredYesNote = `Counted — high risk confirmed at ~${fmtAgeMClinical(ageAtDose)}.`;
  }

  // ── Interval checks ───────────────────────────────────────────────────
  // M4: Use menacwyRiskClass() from riskFactors.js instead of hardcoding the risk IDs.
  // This keeps the validator in sync with the engine's riskClass computation.
  // primary2 class = strict interval checks apply.
  const riskClass = isHighRiskNow;

  if (effectiveIdx > 0) {
    // Find the last dated kept dose (walk backwards through kept)
    const prevKeptDated = [...kept].reverse().find(d => d.date);

    if (prevKeptDated) {
      const interval = daysBetween(prevKeptDated.date, dose.date);

      // P0-1 (2026-09-17): the infant series' ages have to be read BEFORE the
      // primary-interval check, not after it. They used to be computed further
      // down, for the booster-cadence block alone, so the interval check had
      // nothing to go on but "is this dose 2" and applied a single flat number
      // to every position in the series.
      const keptDated = kept.filter(d => d.date);
      const d1AgeM = ageAtDoseFromDate(keptDated[0] || null, ageMonths, today);
      // P1-3: d2AgeM decides 3-vs-4 doses for a 3-6-month start, so the
      // validator must read it too or it will disagree with the card again.
      const d2AgeM = ageAtDoseFromDate(keptDated[1] || null, ageMonths, today);

      // ── Primary-series interval ──────────────────────────────────────
      // Two shapes. A series begun at 2 years or older is a flat 2-dose primary
      // 8 weeks apart, and only dose 2 is a primary dose. An infant series runs
      // to 2, 3 or 4 doses depending on when it started and when dose 2 landed,
      // and the last of those doses has its own, stricter gate — so every
      // position up to the total has to be checked, not just position 1.
      // This is menacwyPrimaryTotal()'s own condition for routing a patient to
      // the infant series, deliberately matched character for character: the
      // validator must check the interval for exactly the population whose
      // series length it reads from the infant helper — and whose card the
      // engine drives down the infant path. menacwyInfantSeriesIndicated()
      // already returns true for every 'primary2' patient, so it covers both
      // medical risk and the M10 travel/outbreak infants.
      const infantSeries = menacwyInfantSeriesIndicated(riskIds);
      const onInfantPrimary = infantSeries && d1AgeM != null
        && d1AgeM < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS;

      if (onInfantPrimary) {
        const gate = menacwyInfantNextDoseGate({
          d1AgeM: d1AgeM, d2AgeM: d2AgeM, given: effectiveIdx,
        });
        // effectiveIdx is 0-based, so this dose is number effectiveIdx + 1.
        // Only grade it here while it is still inside the primary series;
        // anything past the total is a booster and the cadence block owns it.
        if (effectiveIdx < gate.total) {
          const tooSoon = !intervalMeetsMinimum(interval, gate.minIntervalDays);
          const tooYoung = gate.minAgeMonths != null
            && ageAtDose != null && !ageMeetsMinimum(ageAtDose, gate.minAgeMonths, whenGiven);
          if (tooSoon || tooYoung) {
            const weeks = gate.minIntervalDays / 7;
            const why = [
              tooSoon ? `only ${fmtDays(interval)} after the previous dose (minimum ${weeks} weeks)` : null,
              tooYoung ? `before the first birthday (given at ~${fmtAgeMClinical(ageAtDose)})` : null,
            ].filter(Boolean).join(', and ');
            const requirement = gate.isFinalPrimary
              ? `CDC requires the dose completing an infant series at least ${weeks} weeks after the previous dose AND after age 12 months.`
              : `CDC requires at least ${weeks} weeks between the early doses of an infant series.`;
            return invalidResult(
              [`This dose was given ${why}. ${requirement} This dose does not count; repeat it.`],
              `Actual interval: ${fmtDays(interval)}. Minimum: ${fmtDays(gate.minIntervalDays)}${gate.minAgeMonths != null ? ' and after age 12 months' : ''}.`
            );
          }
        }
      } else if (riskClass && effectiveIdx === 1) {
        // ≥2y high-risk primary: 2 doses, ≥8 weeks apart.
        if (!intervalMeetsMinimum(interval, MENACWY_HR_ADULT_MIN_INTERVAL)) {
          return invalidResult(
            [`Given only ${fmtDays(interval)} after the previous dose. Minimum interval is 8 weeks (high-risk primary series).`],
            `Actual interval: ${fmtDays(interval)}. Minimum: ${fmtDays(MENACWY_HR_ADULT_MIN_INTERVAL)}.`
          );
        }
      }

      // ── Booster cadence check: high-risk boosters (effective dose ≥3) (Task 2) ─
      // High-risk patients complete a 2-dose primary, then receive lifelong boosters.
      // FIRST booster (effectiveIdx === 2, i.e. dose 3):
      //   D2 age <7y or unknown → 3 years (conservative); D2 age ≥7y → 5 years.
      // ALL SUBSEQUENT boosters (effectiveIdx >= 3): always 5 years regardless of D2 age.
      // A booster given TOO SOON does not count.
      // Only too-soon is flagged; late/overdue boosters are acceptable catch-up.
      // M4: a dose is a booster only once the PRIMARY series is behind it, and
      // how long that series is depends on the age at dose 1. This used to be
      // hardcoded as "dose 3 onwards", which is right only for a series begun at
      // 2 years or older. A baby with asplenia on the textbook 2/4/6/12-month
      // series had doses 3 and 4 graded as boosters given "~2 months after the
      // previous dose" against a 3-year cadence, and both were voided.
      const primaryTotal = menacwyPrimaryTotal({ riskClass: menacwyRiskClass(riskIds), d1AgeM, d2AgeM, infantSeries: menacwyInfantSeriesIndicated(riskIds) });
      // P1-3 (2026-09-15) added a dedicated check here for the 3-dose
      // shortcut's final dose (≥12 weeks after dose 2 AND after age 12 months).
      // P0-1 (2026-09-17) generalised it: EVERY infant series has a final dose
      // with that same gate, not just the 3-dose one, and the 4-dose series was
      // missing it entirely — a three-dose six-month-old was told dose 4 was
      // due today. The check now lives above, driven by
      // menacwyInfantNextDoseGate(), and covers the 3-dose shortcut as one case
      // of the general rule rather than as a special one. The P1-3 regression
      // tests still pass against it unchanged.

      if (riskClass && effectiveIdx >= primaryTotal) {
        const isFirstBooster = effectiveIdx === primaryTotal;
        let cadenceDays;
        let cadenceYears;
        let cadenceLabel;
        if (isFirstBooster) {
          // M4: the first booster's cadence keys off the age at the LAST dose of
          // the primary series — the dose the clock actually starts from — not
          // off dose 2, which is only the same dose in a 2-dose series.
          const lastPrimary = keptDated[primaryTotal - 1] || keptDated[keptDated.length - 1] || null;
          const lastPrimaryAge = ageAtDoseFromDate(lastPrimary, ageMonths, today);
          // Conservative: unknown age treated same as <7y → 3 years.
          const threeYears = (lastPrimaryAge == null || lastPrimaryAge < AGE_7Y_MONTHS);
          cadenceYears = threeYears ? MENACWY_BOOSTER_3Y_YEARS : MENACWY_BOOSTER_5Y_YEARS;
          cadenceDays = threeYears ? MENACWY_BOOSTER_3Y : MENACWY_BOOSTER_5Y;
          cadenceLabel = threeYears ? '3 years' : '5 years';
        } else {
          // Subsequent boosters: always 5 years
          cadenceYears = MENACWY_BOOSTER_5Y_YEARS;
          cadenceDays = MENACWY_BOOSTER_5Y;
          cadenceLabel = '5 years';
        }

        // P0-5: compare real calendar years, not `interval < 1096`.
        if (!calendarIntervalMeetsMinimum(prevKeptDated.date, cadenceYears * 12, dose.date)) {
          return invalidResult(
            [`Booster given only ${fmtDays(interval)} after the previous dose. High-risk MenACWY boosters must be spaced ≥${cadenceLabel}. This dose is too soon and does not count.`],
            `Actual interval: ${fmtDays(interval)}. Required cadence: ${cadenceLabel}.`
          );
        }
      }

      // ── Baseline minimum interval: ≥4 weeks between ANY two MenACWY doses (Task 3) ─
      // Catches duplicate doses (e.g. two doses days apart for a healthy teen).
      // The high-risk primary-series rule above already handles the D2 case with a
      // stricter threshold (8wk or 4wk infant); this baseline applies to all other pairs.
      // NOTE: position-based logic (routine 11-12y vs 16y booster) stays in the engine.
      if (!intervalMeetsMinimum(interval, MENACWY_BASELINE_MIN_INTERVAL)) {
        return invalidResult(
          [`Given only ${fmtDays(interval)} after the previous dose. Minimum interval between any two MenACWY doses is 4 weeks.`],
          `Actual interval: ${fmtDays(interval)}. Minimum: ${fmtDays(MENACWY_BASELINE_MIN_INTERVAL)}.`
        );
      }
    }
  }

  // ── Change 3 (2026-07-24 handoff): a healthy 2nd ACWY dose given before ──
  // the 16y booster window doesn't count. Routine (non-high-risk) MenACWY is
  // exactly 2 doses: the adolescent primary dose (11-12y, or credited at 10y
  // per the age-10 rule above) + a booster tied to age 16 (16-18y catch-up if
  // the primary dose was given at 13-15y). ACIP: "Adolescents who receive
  // their first dose at age 13–15 years should receive a booster dose at age
  // 16–18 years... Adolescents who receive a first dose after their 16th
  // birthday do not need a booster dose" — the booster is an AGE window, not
  // just an interval from dose 1. A dose given after the primary dose already
  // counted, but before the patient turns 16, is safe but isn't the booster
  // and must not chip-render as "Dose 2 of 1" (a chip must never show a
  // number greater than the series total). High-risk patients are unaffected
  // — their primary series legitimately has 2+ doses before age 16.
  // Source: https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm
  // M9: travelers and microbiologists are excluded here as well. This is the
  // ROUTINE adolescent booster window; their 2nd dose is a Table 9 / Table 7
  // booster measured as an interval from the last dose, not an age window.
  // M10: an infant on the MenACWY infant series is likewise excluded. This is
  // the ROUTINE adolescent booster window, and dose 2 of a 4-dose infant series
  // is a primary dose measured in weeks from dose 1 — not the age-16 booster.
  // It bites the A/C/W/Y OUTBREAK indication ('single', so not covered by
  // ongoingRiskNow): a baby with two correctly-spaced infant doses had the
  // second one set aside and was offered dose 1 again. onInfantSeriesNow is
  // scoped to patients still under 2 today — see its definition above.
  if (!ongoingRiskNow && !onInfantSeriesNow && !onOutbreakSchedule && effectiveIdx === 1 && ageAtDose !== null && !ageMeetsMinimum(ageAtDose, AGE_16Y_MONTHS, whenGiven)) {
    return {
      status: 'valid',
      reasons: [`Given at ~${fmtAgeMClinical(ageAtDose)}, before the age-16 booster window. Safe, but does not count toward the routine series — the routine booster is still due at 16. [c]`],
      reasonCites: [cite('acwyRoutine1112and16')],
      notAdolescentCount: true,
    };
  }

  return validResult(answeredYesNote ? [answeredYesNote] : []);
}

function validateOneMenB(dose, effectiveIdx, kept, ageMonths, riskIds, today, riskAnswer) {
  // P1-1 (2026-09-17): every age and interval below allows CDC's 4-day grace —
  // "doses administered <=4 days before the minimum age or interval are
  // considered valid". `whenGiven` carries what ageMeetsMinimum() needs to
  // re-derive the age as if the dose were 4 days later. See intervals.js for
  // the quote and for the two places the grace deliberately does NOT apply.
  const whenGiven = { doseDate: dose.date || null, ageMonths, today };
  // No date → interval cannot be checked, but a min-age conflict may still be
  // decidable using current age as an upper bound on age-at-administration
  // (see validateOneMenACWY). For MenB the permissive fallback is 120 months
  // because EVERY MenB product (Bexsero, Trumenba, Penbraya, Penmenvy) is
  // licensed only from age 10 — this is a vaccine-category floor, not a
  // brand-specific restriction, so it applies even when the brand is unknown.
  if (!dose.date) {
    const brand = dose.brand || '';
    const knownBrandMin = brandMinAgeM(brand); // null when brand unknown
    const minAgeM = knownBrandMin ?? MIN_AGE_MENB_PERMISSIVE_MONTHS;
    if (!ageMeetsMinimum(ageMonths, minAgeM, { doseDate: today, ageMonths, today })) {
      const brandLabel = brand
        ? brand.replace(/\s*\(Men(?:B|ACWY|ABCWY)\).*/, '')
        : 'MenB';
      return invalidResult(
        [`Recorded without a date, but the patient is currently only ~${fmtAgeMClinical(ageMonths)}, below the minimum age of ${fmtMinAge(minAgeM)} for ${brandLabel}. A past dose cannot have been given later than today, so it could not have been given at a valid age. MenB vaccines are licensed from age 10 years. [c] This dose does not count.`],
        `Current age (upper bound on age at administration): ~${fmtAgeMClinical(ageMonths)}. Minimum: ${fmtMinAge(minAgeM)}.`,
        [cite('menbLicensedAge1025')]
      );
    }
    // P0-1: if the patient has no current MenB risk factor and is CURRENTLY under 16,
    // then any past (undated) dose was necessarily given before age 16 — a dose can't
    // have been given later than today. So it does not count toward the healthy series.
    // (If the patient is currently ≥16 we can't tell when an undated dose was given, so
    // it falls through to the "counted / unknown" case below.)
    if (!hasMenbRisk(riskIds) && !ageMeetsMinimum(ageMonths, MENB_HEALTHY_MIN_AGE_MONTHS, { doseDate: today, ageMonths, today })) {
      return {
        status: 'valid',
        reasons: [`Recorded without a date, but the patient is currently only ~${fmtAgeMClinical(ageMonths)} — so this dose was given before age 16. It does not count toward the healthy 2-dose MenB series (recommended at 16–23 years) [c]; MenB given before 16 is not counted for a patient without a high-risk indication.`],
        reasonCites: [cite('menbHealthyPreferredAge1618')],
        notAdolescentCount: true,
      };
    }
    return unknownResult([
      `No date recorded: cannot verify age at administration or interval from prior dose. Dose is counted in the series (must have been given at ≥${fmtMinAge(minAgeM)} to be valid).`
    ]);
  }

  const ageAtDose = ageAtDoseFromDate(dose, ageMonths, today);

  // ── MenB min age (Task 1) ─────────────────────────────────────────────
  // Use ALL_BRANDS as the single source of truth for minAgeM per brand.
  // Penbraya/Penmenvy (pentavalents) are in ALL_BRANDS with minAgeM=120, so
  // a 6-month-old recorded with Penbraya is correctly flagged as "10 years minimum."
  // Unknown brand → permissive fallback is still 120 months (all MenB products ≥10y).
  // maxAgeM is 999 for all products — no upper-age check.
  const brand = dose.brand || '';
  const brandLabel = brand
    ? brand.replace(/\s*\(Men(?:B|ACWY|ABCWY)\).*/, '')
    : 'MenB';
  const minAgeM = brandMinAgeM(brand) ?? MIN_AGE_MENB_PERMISSIVE_MONTHS;

  if (ageAtDose !== null && !ageMeetsMinimum(ageAtDose, minAgeM, whenGiven)) {
    return invalidResult(
      [`Given at ~${fmtAgeMClinical(ageAtDose)}, below the minimum age of ${fmtMinAge(minAgeM)} for ${brandLabel}. MenB vaccines (Bexsero, Trumenba, Penbraya, Penmenvy) are licensed from age 10 years for all products. [c]`],
      `Age at administration: ~${fmtAgeMClinical(ageAtDose)}. Minimum: ${fmtMinAge(minAgeM)}.`,
      [cite('menbLicensedAge1025')]
    );
  }

  // ── P0-1: healthy MenB doses before age 16 don't count toward the healthy series ─
  // For a patient with NO current MenB risk factor, the healthy 2-dose series is
  // recommended at 16–23y. A dose given before 16 was validly administered (above the
  // 10-year product floor) but does NOT advance the healthy series — this is the direct
  // analog of MenACWY's pre-age-10 `notAdolescentCount` rule. High-risk patients
  // (hasMenbRisk) legitimately start at age 10 and must keep counting their doses.
  // Owner decision 2026-07-23 (Option 1). Source: ACIP 2020 MMWR RR-9.
  if (!hasMenbRisk(riskIds) && ageAtDose !== null && !ageMeetsMinimum(ageAtDose, MENB_HEALTHY_MIN_AGE_MONTHS, whenGiven)) {
    return {
      status: 'valid',
      reasons: [`Given before age 16 (~${fmtAgeMClinical(ageAtDose)}): does not count toward the healthy 2-dose MenB series, which is recommended at 16–23 years. [c] MenB antibody protection wanes within about a year, so a dose given before 16 is not counted for a patient without a high-risk indication.`],
      reasonCites: [cite('menbHealthyPreferredAge1618')],
      notAdolescentCount: true,
    };
  }

  // ── Risk-at-dose ambiguity: high-risk-NOW patient, dose given before age 16 ─
  // A high-risk patient's MenB series legitimately starts at age 10, but whether
  // THIS dose (given between the 10y product floor and 16y) counted toward the
  // high-risk series depends on whether the patient was already high-risk on
  // that date — not recorded. Permanence ≠ always-been-present (e.g. asplenia
  // acquired at 13 doesn't retroactively cover an age-12 dose), so this fires
  // for every high-risk-now patient with an ambiguous dated dose. Owner-
  // confirmed design, 2026-07-23 handoff.
  let answeredYesNote = null;
  if (hasMenbRisk(riskIds) && ageAtDose !== null && !ageMeetsMinimum(ageAtDose, MENB_HEALTHY_MIN_AGE_MONTHS, whenGiven)) {
    if (riskAnswer === undefined) {
      return {
        status: 'pending',
        needsInput: true,
        reasons: [`Given at ~${fmtAgeMClinical(ageAtDose)}, before age 16. Whether this dose counts toward the high-risk MenB series depends on whether the patient was already high-risk on that date — not recorded.`],
        promptDate: dose.date,
      };
    }
    if (riskAnswer === 'no' || riskAnswer === 'unsure') {
      return {
        status: 'valid',
        reasons: [`Given at ~${fmtAgeMClinical(ageAtDose)}, before age 16. Marked as ${riskAnswer === 'unsure' ? 'unsure whether the patient was' : 'not'} high-risk on that date — treated conservatively as not counting toward the high-risk series. [c]`],
        reasonCites: [cite('menbHealthyPreferredAge1618')],
        notAdolescentCount: true,
      };
    }
    // riskAnswer === 'yes' → falls through to the family-lock and high-risk
    // interval checks below as an effective high-risk-series dose.
    // U3: the MenB copy of the same sentence. Same reasoning as the MenACWY
    // one above; the card this row sits on is already the MenB card.
    answeredYesNote = `Counted — high risk confirmed at ~${fmtAgeMClinical(ageAtDose)}.`;
  }

  // ── MenB antigen-family mismatch (Task 4 — family lock anchor fix) ────
  // MenB-4C (Bexsero/Penmenvy) and MenB-FHbp (Trumenba/Penbraya) are NOT
  // interchangeable. Family is established by the FIRST KEPT DOSE WITH A KNOWN
  // BRAND — not necessarily the raw D1 (which might be unknown or dropped).
  // E.g.: [unknown] → Bexsero → Trumenba: the Trumenba dose must be flagged
  // because Bexsero (D2, the first kept with a known brand) is 4C.
  // Skip mismatch check when either brand is unknown.
  // Source: ACIP 2020 MMWR (RR-9); immunize.org Ask the Experts.
  if (effectiveIdx > 0 && brand) {
    // The family anchor is the first KEPT dose with a KNOWN brand.
    // Walk forward through kept (not reverse) to get the chronologically first.
    const firstKeptWithBrand = kept.find(d => d.brand);
    if (firstKeptWithBrand) {
      const d1Family = menbFamily(firstKeptWithBrand.brand);
      const thisFamily = menbFamily(brand);
      if (d1Family && thisFamily && d1Family !== thisFamily) {
        return invalidResult(
          [
            `MenB-4C (Bexsero/Penmenvy) and MenB-FHbp (Trumenba/Penbraya) are not interchangeable: this dose must match the established antigen family (${d1Family}), but was given as ${thisFamily}.`,
          ],
          `Established family: ${d1Family} (from ${firstKeptWithBrand.brand}). This dose: ${brand} (family: ${thisFamily}). Does not count: give the correct dose in the ${d1Family} family.`
        );
      }
    }
  }

  // ── High-risk interval checks ───────────────────────────────────────────
  const highRisk = hasMenbRisk(riskIds);

  if (highRisk) {
    if (effectiveIdx === 1) {
      // D2: ≥4 weeks after effective D1
      const prevKeptDated = [...kept].reverse().find(d => d.date);
      if (!prevKeptDated) {
        return validResult(['Interval from D1 cannot be verified (D1 has no date).']);
      }
      const interval = daysBetween(prevKeptDated.date, dose.date);
      if (!intervalMeetsMinimum(interval, MENB_HR_D2_MIN_INTERVAL)) {
        return invalidResult(
          [`Given only ${fmtDays(interval)} after dose 1. High-risk schedule requires ≥4 weeks between D1 and D2.`],
          `Actual interval: ${fmtDays(interval)}. Minimum: ${fmtDays(MENB_HR_D2_MIN_INTERVAL)}.`
        );
      }
    }

    if (effectiveIdx === 2) {
      // D3: ≥6 months after effective D1 AND ≥4 months after effective D2
      // Find the first and second kept dated doses.
      const keptDated = kept.filter(d => d.date);
      const d1Date = keptDated[0]?.date || null;
      const d2Date = keptDated[1]?.date || null;
      const reasons = [];
      let detail = '';

      // MenB dose-3 rescue (2026-09-17): an early dose 3 is NOT thrown away.
      // CDC child & adolescent schedule notes, MenB special situations, fetched
      // live 2026-09-17 — the second half of the same bullet P1-2 implemented:
      //   "...if dose 3 is administered earlier than 4 months after dose 2, a
      //    4th dose should be administered at least 4 months after dose 3"
      // The app used to mark this dose Invalid, tell the clinician to repeat it,
      // and then re-offer "Dose 3 of 3" — discarding a dose CDC counts and
      // hiding the extra dose the patient actually needs. This branch comes
      // FIRST because it is CDC's explicit remedy for exactly this dose, and it
      // replaces the old ≥4-months-from-D2 invalidity check entirely.
      //
      // P1-1: no 4-day grace here, on purpose — the same reasoning as the
      // healthy early-dose-2 branch further down. Whether dose 3 was early
      // decides how many doses the series HAS, and grace must never shorten a
      // series. seriesTotals.js's menbSeriesInfo() makes the identical
      // comparison so the card and this verdict cannot drift apart.
      if (d2Date && !calendarIntervalElapsed(d2Date, MENB_HR_D3_MIN_MONTHS_FROM_D2, dose.date)) {
        const fromD2 = daysBetween(d2Date, dose.date);
        return validResult([
          `Dose 3 was given ${fmtDays(fromD2)} after dose 2, less than the 4-month minimum for the high-risk schedule. The dose counts — do not repeat it — but a 4th dose is now required at least 4 months after this dose.`
        ]);
      }

      if (d1Date) {
        const fromD1 = daysBetween(d1Date, dose.date);
        if (!calendarIntervalMeetsMinimum(d1Date, MENB_HR_D3_MIN_MONTHS_FROM_D1, dose.date)) {
          reasons.push(`Given only ${fmtDays(fromD1)} after dose 1. High-risk D3 requires ≥6 months from D1.`);
          detail += `D1→D3: ${fmtDays(fromD1)} (min ${fmtDays(MENB_HR_D3_MIN_FROM_D1)}).`;
        }
      }

      if (reasons.length > 0) {
        return invalidResult(reasons, detail.trim());
      }
    }

    // ── MenB high-risk booster cadence (Task 2): effectiveIdx ≥ 3 ────────
    // First booster: ≥1 year after the LAST PRIMARY dose.
    // Subsequent boosters: every ≥2 years.
    // Only flag too-soon; late boosters are acceptable catch-up.
    //
    // MenB dose-3 rescue (2026-09-17): where the primary series ends is no
    // longer always dose 3. When dose 3 came earlier than 4 months after dose 2,
    // CDC adds a FOURTH primary dose ≥4 months later, so for those patients
    // effectiveIdx 3 is still a primary dose and the booster clock starts one
    // dose later. The length comes from menbSeriesInfo() — the same function the
    // card reads — so a dose the engine asks for cannot be rejected here.
    if (effectiveIdx >= 3) {
      const prevKeptDated = [...kept].reverse().find(d => d.date);
      if (prevKeptDated) {
        const interval = daysBetween(prevKeptDated.date, dose.date);
        const hrTotal = menbSeriesInfo({ highRisk: true, doses: kept }).total;

        if (effectiveIdx < hrTotal) {
          // The rescue 4th dose: ≥4 months after the early dose 3. Grace DOES
          // apply here — this is a "does this dose count" question, not a
          // series-length one (P1-1).
          if (!calendarIntervalMeetsMinimum(prevKeptDated.date, MENB_HR_D3_MIN_MONTHS_FROM_D2, dose.date)) {
            return invalidResult(
              [`Given only ${fmtDays(interval)} after dose 3. The extra dose owed after an early dose 3 must be given at least 4 months after it.`],
              `D3→D4: ${fmtDays(interval)} (min ${fmtDays(MENB_HR_D3_MIN_FROM_D2)}).`
            );
          }
          return validResult(answeredYesNote ? [answeredYesNote] : []);
        }

        const isFirstBooster = effectiveIdx === hrTotal;
        const minInterval = isFirstBooster
          ? MENB_HR_FIRST_BOOSTER_MIN
          : MENB_HR_SUBSEQUENT_BOOSTER_MIN;
        const minLabel = isFirstBooster
          ? '1 year after completing the primary series'
          : '2 years (every 2–3 years for high-risk boosters)';

        if (!intervalMeetsMinimum(interval, minInterval)) {
          return invalidResult(
            [`MenB booster given only ${fmtDays(interval)} after the previous dose. Minimum is ${minLabel}. This dose does not count.`],
            `Actual interval: ${fmtDays(interval)}. Minimum: ${fmtDays(minInterval)}.`
          );
        }
      }
    }

    return validResult(answeredYesNote ? [answeredYesNote] : []);
  }

  // ── Healthy 2-dose: D2 given early is VALID (not invalid) but triggers rescue ─
  // ACIP guidance: if D2 is given <6 months after D1 for the healthy 2-dose schedule,
  // the dose is NOT invalid — it is given early. A third "rescue" dose ≥4 months after
  // D2 is then required to complete the series. The engine's recommend() already emits
  // the rescue rec; here we annotate D2 as valid with an explanatory note.
  // Source: CDC MenB child notes; immunize.org Ask the Experts MenB.
  if (effectiveIdx === 1) {
    const prevKeptDated = [...kept].reverse().find(d => d.date);
    if (prevKeptDated) {
      const interval = daysBetween(prevKeptDated.date, dose.date);
      // P1-1: NO grace here on purpose. This decides whether dose 2 counts as
      // EARLY and so whether a rescue dose 3 is owed — a series-length question,
      // not a validity one. Granting grace would drop a dose from the plan, and
      // the clinical authority rule forbids a reading that gives fewer doses.
      if (!calendarIntervalElapsed(prevKeptDated.date, MENB_HEALTHY_D2_MIN_MONTHS, dose.date)) {
        return validResult([
          `Dose 2 was given ${fmtDays(interval)} after dose 1, less than the 6-month standard interval. Dose is accepted (not invalid), but a third rescue dose ≥4 months after this dose is now required to complete the series.`
        ]);
      }
    }
  }

  // ── Healthy series rescue: D3 ≥4 months after early D2 ─────────────────
  if (effectiveIdx === 2) {
    const keptDated = kept.filter(d => d.date);
    const d1Date = keptDated[0]?.date || null;
    const d2Date = keptDated[1]?.date || null;
    // Only applies if effective D2 was early (i.e. d1→d2 < 6 months)
    if (d1Date && d2Date) {
      // P1-1: NO grace — the same series-length question as above.
      if (!calendarIntervalElapsed(d1Date, MENB_HEALTHY_D2_MIN_MONTHS, d2Date)) {
        // This is the rescue dose — check the D2→D3 interval.
        const fromD2 = daysBetween(d2Date, dose.date);
        if (!calendarIntervalMeetsMinimum(d2Date, MENB_RESCUE_D3_MIN_MONTHS_FROM_D2, dose.date)) {
          return invalidResult(
            [`Rescue dose given only ${fmtDays(fromD2)} after dose 2. Must be ≥4 months after the early dose 2.`],
            `D2→D3: ${fmtDays(fromD2)} (min ${fmtDays(MENB_RESCUE_D3_MIN_FROM_D2)}).`
          );
        }
      }
    }
  }

  return validResult();
}

// ── Core walk: last-kept algorithm ───────────────────────────────────────
//
// This is the single source of truth for BOTH display results AND the
// effective dose list that the engine consumes.
//
// Walk order: chronological (input order assumed already sorted).
// For each dose:
//   1. Validate against the KEPT list so far (not the full raw list).
//   2. If valid or unknown → keep (counts toward series).
//   3. If invalid → drop (does not count; mark as doesNotCount=true in perDose).
// The effective count advances ONLY on kept doses, so a dose that follows a
// dropped one is re-evaluated at the correct effective position.
//
function runWalk(vaccine, rawDoses, ageMonths, riskIds, today, riskAtDoseAnswers) {
  const kept = [];           // doses kept so far (the "effective" list being built)
  const perDose = [];        // one entry per raw dose (display results)
  let effectiveCount = 0;    // number of kept doses so far (including unknown)

  for (let rawIdx = 0; rawIdx < rawDoses.length; rawIdx++) {
    const dose = rawDoses[rawIdx];
    // G2: keyed by the dose's own id when it has one, falling back to its
    // position for hand-built fixtures. See doseIdentity.js.
    const riskAnswer = riskAtDoseAnswers?.[doseAnswerKey(dose, rawIdx)];

    // Validate this dose against the current kept list.
    // G3: a date in the future is settled before any vaccine-specific rule
    // runs — there is no dose to grade yet, whatever the schedule says.
    // G7: and a date already sitting on a counted row is a row typed twice,
    // which the interval rule would otherwise explain as a 0-day interval.
    let result = futureDatedProblem(dose, today) || duplicateEntryProblem(dose, kept);
    if (result) {
      // fall through to the invalid branch below
    } else if (vaccine === 'MenACWY') {
      result = validateOneMenACWY(dose, effectiveCount, kept, ageMonths, riskIds, today, riskAnswer);
    } else if (vaccine === 'MenB') {
      result = validateOneMenB(dose, effectiveCount, kept, ageMonths, riskIds, today, riskAnswer);
    } else {
      result = unknownResult([`Unknown vaccine: ${vaccine}`]);
    }

    if (result.status === 'pending') {
      // Awaiting a risk-at-dose answer from the provider. Conservative default
      // while pending: not added to kept, does not advance the effective count.
      perDose.push({
        ...result,
        effectiveDoseNum: null,
      });
    } else if (result.status === 'invalid') {
      // Dropped. Record as doesNotCount with advice to repeat only this dose.
      perDose.push({
        ...result,
        effectiveDoseNum: null,
        doesNotCount: true,
        reasons: result.recordProblem
          // G3: the entry is wrong, not the vaccination — see recordProblemResult.
          ? result.reasons
          : [
            ...result.reasons,
            'This dose does not count toward the series: repeat this dose only (do not restart the series).',
          ],
      });
      // Do NOT add to kept; do NOT increment effectiveCount.
    } else if (result.notAdolescentCount) {
      // A3: a valid dose given before age 10 — does not advance the
      // adolescent series count, but it is NOT invalid and does NOT need to
      // be repeated. Excluded from `kept` (like invalid) but display-distinct.
      perDose.push({
        ...result,
        effectiveDoseNum: null,
      });
      // Do NOT add to kept; do NOT increment effectiveCount.
    } else {
      // Valid or unknown → tentatively keep, then apply the F2/F3 series-total
      // cap: a dose past the schedule's primary total, on a schedule with no
      // ongoing booster phase (routine MenACWY, single-dose MenACWY exposure
      // indications, healthy MenB), is an extra dose — safely given, but it
      // doesn't extend the series and must not be numbered against it (the
      // reported bug: "Dose 3 of 1"). Schedules WITH an ongoing booster phase
      // (high-risk MenACWY/MenB, MenACWY travel/microbiologist, MenACWY
      // infant high-risk) are never capped here — see seriesTotals.js.
      const candidateKept = [...kept, dose];
      const seriesInfo = vaccine === 'MenACWY'
        ? menacwySeriesInfo({ riskClass: menacwyRiskClass(riskIds), am: ageMonths, doses: candidateKept, today, infantSeries: menacwyInfantSeriesIndicated(riskIds) })
        : menbSeriesInfo({ highRisk: hasMenbRisk(riskIds), doses: candidateKept });
      const isExtra = !seriesInfo.hasBoosterPhase
        && seriesInfo.total != null
        && candidateKept.length > seriesInfo.total;

      if (isExtra) {
        // G6 (2026-09-16, owner decision): ASK, don't assert — but only for an
        // UNDATED row. A dose with no date cannot be placed in time, so the app
        // cannot tell a genuine extra dose from an ordinary series dose whose
        // date is missing, and old paper records routinely carry several
        // undated doses. On a healthy 17-year-old the assertion also
        // contradicts the card it sits on, which says the age-16 booster is
        // still due: the series cannot be both complete and owed a dose.
        //
        // A DATED dose that genuinely exceeds the total keeps the assertion —
        // there the app really does know (several regression tests pin it).
        //
        // The question needs no answer stored: an extra dose is excluded from
        // `kept`, so the engine never sees this row and the recommendation is
        // identical with or without it. Nothing downstream depends on which
        // reading is true, which is why this is wording rather than state.
        //
        // The undated reasons are REPLACED, not appended to: the base sentence
        // for an undated dose ends "Dose is counted in the series", which would
        // sit directly above a line saying it is not counted.
        const undatedExtra = !dose.date;
        perDose.push({
          ...result,
          effectiveDoseNum: null,
          extraDose: true,
          ...(undatedExtra ? { extraDoseUnverified: true } : {}),
          reasons: undatedExtra
            ? [
              'No date recorded, so this dose cannot be placed in time.',
              // Deliberately says nothing about the series being COMPLETE.
              // The cap that lands a row here is a counting rule, not a verdict
              // on the patient: a healthy 17-year-old with two undated MenACWY
              // doses is capped at a 1-dose total while the card above still
              // says the age-16 booster is due. Claiming completeness here
              // would contradict the card the row sits in. (Live-observed
              // 2026-09-16; raised separately — the cap itself is not G6's.)
              'Do you mean this was an extra dose given? With no date recorded, the app cannot tell whether this is a dose beyond the series or a series dose whose date is missing, so it is not counted. Whichever it is, the recommendation above is the same with or without this row. Adding the date settles it.',
            ]
            : [
              ...result.reasons,
              `Given after the ${seriesInfo.total}-dose series was already complete: this dose does not extend the series.`,
            ],
        });
        // Do NOT add to kept; do NOT increment effectiveCount.
      } else {
        effectiveCount++;
        const effectiveDoseNum = effectiveCount;

        // If raw index > effective index, this dose was renumbered upward.
        const wasRenumbered = rawIdx > effectiveCount - 1;
        const renumberNote = wasRenumbered
          ? `After excluding the dose(s) above that don't count, this counts as effective dose ${effectiveDoseNum}.`
          : null;

        const augmentedReasons = renumberNote
          ? [...result.reasons, renumberNote]
          : result.reasons;

        perDose.push({
          ...result,
          reasons: augmentedReasons,
          effectiveDoseNum,
        });
        kept.push(dose);
      }
    }
  }

  return { perDose, effective: kept };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * analyzeHistory(vaccine, doses, ageMonths, riskIds, today)
 *
 * Single-walk validator. Returns BOTH a display result array and the
 * effective (kept) dose list for the engine to consume.
 *
 * @param {'MenACWY' | 'MenB'} vaccine
 * @param {Array<{date?: string, brand?: string}>} doses
 * @param {number} ageMonths  — current patient age in months
 * @param {string[]} riskIds  — selected risk-factor IDs
 * @param {string} [today]    — ISO date string; defaults to today's date
 * @param {Object.<string|number, 'yes'|'no'|'unsure'>} [riskAtDoseAnswers] —
 *   provider answers to the risk-at-dose prompt, keyed by each dose's own
 *   `id` (G2). Doses built without an id fall back to their index in the
 *   chronologically-sorted list — the index used by `sortedDoses`/`perDose`.
 *
 * @returns {{
 *   perDose: Array<{status, effectiveDoseNum, reasons, detail?, doesNotCount?, needsInput?, promptDate?}>,
 *   effective: Array<{date?, brand?}>,
 *   sortedDoses: Array<{date?, brand?}>
 * }}
 */
export function analyzeHistory(vaccine, doses, ageMonths, riskIds = [], today, riskAtDoseAnswers) {
  // todayISO(), not new Date().toISOString() — the latter is UTC and can be a
  // day ahead of the caller's local date (e.g. any evening in a UTC-behind
  // timezone), which breaks the exact cancellation ageAtDoseFromDate relies on
  // when the caller's ageMonths was itself derived from a local "today".
  const ref = today || todayISO();
  // Sort chronologically before the last-kept walk. The walk and the engine both assume
  // ascending order (dose numbering, interval anchoring, MenB family lock on the first
  // kept dose), so doses entered out of order must be re-sorted. Dated doses ascending;
  // undated doses sort FIRST (they count but are never a timing anchor, and an undated
  // historical dose is assumed to be the earlier dose — matching existing convention).
  const filtered = sortDosesChronologically((doses ?? []).filter(Boolean));
  if (filtered.length === 0) return { perDose: [], effective: [], sortedDoses: [] };
  const firstPass = runWalk(vaccine, filtered, ageMonths, riskIds, ref, riskAtDoseAnswers);

  // G8 (2026-09-16): a row with NO date must never take the place of a dose
  // that has one. Undated rows sort first (above), so on a schedule with a
  // series cap they fill the slots first and a DATED dose arriving later is
  // the one thrown out as "extra" — the app then recommended a booster the
  // patient demonstrably had, because a blank date field somewhere else in
  // the record had claimed its place.
  //
  // The cap can only be judged once the walk has run, so this is decided by
  // re-walking rather than by guessing an order up front: if the first pass
  // dropped a DATED dose as an extra while an undated row was kept, walk
  // again with the dated doses first. Each pass stays internally consistent
  // (the alternative — reaching back into the finished pass to evict a row —
  // would leave the earlier doses graded at positions they no longer hold).
  const datedDoseDropped = firstPass.perDose.some((p, i) => p.extraDose && filtered[i]?.date);
  const undatedRowKept = firstPass.effective.some((d) => !d.date);
  if (datedDoseDropped && undatedRowKept) {
    const datedFirst = [
      ...filtered.filter((d) => d.date),
      ...filtered.filter((d) => !d.date),
    ];
    return { ...runWalk(vaccine, datedFirst, ageMonths, riskIds, ref, riskAtDoseAnswers), sortedDoses: datedFirst };
  }
  return { ...firstPass, sortedDoses: filtered };
}

// Chronological, stable sort. ISO date strings compare lexicographically. Undated doses
// sort before all dated doses, preserving their relative input order.
// Exported because the MenB family-lock note in DoseEditor has to pick the same
// "first dose in the series" this walk does — two copies of the ordering rule is
// how the note and the engine would end up naming different families.
export function sortDosesChronologically(doses) {
  return doses
    .map((d, i) => ({ d, i }))
    .sort((a, b) => {
      const da = a.d?.date || '';
      const db = b.d?.date || '';
      if (da && db) return da < db ? -1 : da > db ? 1 : a.i - b.i;
      if (!da && db) return -1; // undated sorts before dated
      if (da && !db) return 1;
      return a.i - b.i;         // both undated → stable input order
    })
    .map((x) => x.d);
}

/**
 * validateHistory(vaccine, doses, ageMonths, riskIds, today)
 *
 * Backward-compatible wrapper. Returns the perDose array from analyzeHistory.
 * Callers that only need the display results (e.g. RecCard) can continue
 * using this signature unchanged.
 *
 * @param {'MenACWY' | 'MenB'} vaccine
 * @param {Array<{date?: string, brand?: string}>} doses
 * @param {number} ageMonths
 * @param {string[]} riskIds
 * @param {string} [today]
 *
 * @returns {Array<{status: 'valid'|'invalid'|'unknown', reasons: string[], detail?: string}>}
 */
export function validateHistory(vaccine, doses, ageMonths, riskIds = [], today, riskAtDoseAnswers) {
  return analyzeHistory(vaccine, doses, ageMonths, riskIds, today, riskAtDoseAnswers).perDose;
}
