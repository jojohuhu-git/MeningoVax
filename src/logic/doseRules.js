// ─────────────────────────────────────────────────────────────────────────
// doseRules.js — every rule that can judge a recorded dose, as one table.
//
// WHY THIS FILE EXISTS (port Phase 2.1, 2026-11-15).
//
// PneumoVax keeps every gap rule as one row in `doseIntervalRules.js`, each
// row answering the same five questions in fields, so a reader (and a test)
// can see at a glance what a rule is, not only what it does. MeningoVax kept
// the same rules as two long functions in validate.js (`validateOneMenACWY`,
// `validateOneMenB`), where the answers to those questions lived in comments
// and in the order of `if` statements. This file is those two functions taken
// apart, one rule per row, with the five answers written down as fields.
//
// ⚠ AS THE CODE BEHAVES TODAY — not as it should. Phase 2.1's rule was that
// NO answer may move: the saved answers (`sweep-saved-answers.test.js`), the
// prose diff (`npm run prose`) and CDC's test patients
// (`cdsi-test-patients-gate.test.js`) all read the same before and after this
// file was made. Where the app and the sources differ, the row says what the
// app DOES; the difference is for the owner (STOP C, decision packet 1), and
// is listed in `docs/archive/inventory-2026-11-15-every-place-a-dose-is-judged.md`.
//
// ── The five answers on every row ──────────────────────────────────────────
//
//   schedule      Which schedule the rule belongs to (routine, high-risk,
//                 infant series, healthy MenB, any).
//   measuredFrom  What the gap or age is counted from: 'birth', 'last counted
//                 dose', 'dose 1', 'dose 2', 'dose 3', 'first counted branded
//                 dose', 'today' (an undated dose: today is the latest it can
//                 have been given), or 'the record' (a typing problem),
//                 'the series total', or 'the cards on the day of the dose'.
//                 Every gap here is measured from a dose that COUNTED, never
//                 from one that did not (Phase 0 finding R-2; STOP C Q1).
//   enforcement   What happens to a dose the rule catches:
//                   'floor'          not counted; chip "Not counted — repeat";
//                                    the walk adds "repeat this dose only".
//                   'set-aside'      not counted toward THIS series; chip
//                                    "Not counted — given before age 10/16";
//                                    no repeat sentence.
//                   'counts-with-note' counted, with a sentence saying why.
//                   'counts'         counted, nothing to say (an undated dose,
//                                    which counts but is never a timing anchor).
//                   'needs-input'    waits for the risk-at-dose question.
//                   'record-problem' the entry is wrong, not the vaccination.
//                   'extra'          not counted: past the series total, or
//                                    asked for by no card on its day (Q8);
//                                    chip "Not counted — Extra. Do not repeat."
//                   'none'           never checked — with the reason.
//   grace         true: CDC's 4-day grace applies. false: deliberately not
//                 (the rule decides how many doses a series HAS, and grace must
//                 never shorten a series). null: not a gap or an age.
//   authorityToday  Who the CODE says the rule comes from, today. Not a ruling
//                 on whether that is right: `sourcesSay` puts what the
//                 sources say beside it, and STOP C decides the rows that differ.
//
// ── What the sources say (port Phase 2.2, 2026-11-15) ──────────────────────
//
//   sourcesSay.verdict  How the app's rule compares with the sources:
//     'stated'         a source states this rule in so many words (a minimum
//                      "at least …", an age, a requirement). Voiding a dose
//                      under it claims no more than the source does.
//     'schedule-only'  the sources give the timing as a SCHEDULE ("at 0, 1–2,
//                      and 6 months", "every 5 yrs"), not as a minimum; the app
//                      treats it as a hard minimum. STOP C Q2: floor or advice?
//     'differs'        a source, or CDC's own software (CDSI), says something
//                      different from what the app does. STOP C Q2.
//     'owner-decided'  the sources leave it open or disagree, and the owner has
//                      ruled (date in the note). Settled: not re-asked.
//     'no-source'      no source read covers it; an app rule. STOP C Q4.
//     'record-keeping' about the entry (a typed date), not the vaccine.
//   sourcesSay.refs     keys into CITATIONS (src/data/refs.js): the exact
//                       sentences, each confirmed live on a real page.
//   sourcesSay.note     one plain-English line: what the sources say, what the
//                       app does, and where they part.
//
// `sourcesSay` is for people and tests. It is never shown on a card and
// changes no answer; the verdicts above are the plan's STOP C question list,
// held by `dose-rules-table.test.js` so a new difference cannot slip in quietly.
//
// Plus `label`, the chip the verdict leads to (doseChipLabel.js), and
// `inventory`, the row's number in the Phase 0 inventory.
//
// ── How the table is read ─────────────────────────────────────────────────
//
// `judgeDose(ctx)` walks the rows in order. The first row whose `check`
// returns a verdict decides the dose. A row may instead return
// `{ carryNote }` — a sentence the dose keeps if no later row decides it
// (today: "Counted — high risk confirmed at …"). If no row decides, the dose
// counts with whatever notes were carried. ORDER IS PART OF THE RULE, exactly
// as the order of the `if`s was: a dose below the product's minimum age is
// reported for its age, not for its gap.
//
// A row with `check: null` decides nothing: it is written down so that a gap
// in the rules is visible as a row, not as an absence (an 'none' row), or
// because the walk in validate.js applies it after the verdict (the series cap).
//
// ── Adding a row ─────────────────────────────────────────────────────────
//
// Give it every field, put it where its turn comes, and give it a patient in
// `dose-rules-table.test.js` if the saved-answer grid cannot reach it. Do not
// re-derive any of this in a component (CLAUDE.md: engine logic stays in the
// engine). Booster cadence keyed off the age at the last primary dose must
// stay in step with recommend.js (CLAUDE.md).
// ─────────────────────────────────────────────────────────────────────────

import { daysBetween, calendarIntervalElapsed, calendarMonthsBetween, addCalendarMonths, DAYS, AVG_DAYS_PER_MONTH } from './dateUtils.js';
import { hasMenbRisk, menacwyRiskClass, menacwyInfantSeriesIndicated } from '../data/riskFactors.js';
import {
  menbFamily, ALL_BRANDS, brandMinAge, MENACWY_UNKNOWN_BRAND_MIN_AGE_MONTHS, MENB_MIN_AGE_MONTHS,
} from '../data/brands.js';
import {
  menacwyPrimaryTotal, menbSeriesInfo, menbHealthyDose2Early, menbHighRiskDose3Early, MENB_HIGHRISK_TOTAL,
} from './seriesTotals.js';
import { ageAtDoseMonths } from './patientAge.js';
// P0-1 (2026-09-17): the infant primary intervals come from one module,
// shared with recommend.js, so the engine cannot recommend a dose the validator
// then rejects (or accept one the engine's own card called too soon).
import {
  menacwyInfantNextDoseGate, menacwyFirstBoosterYears, ageMeetsMinimum, ageMeetsMinimumDays, intervalMeetsMinimum,
  calendarIntervalMeetsMinimum, MENACWY_HIGHRISK_PRIMARY_GAP,
  MENACWY_BOOSTER_CADENCE_YEARS, MENACWY_FIRST_BOOSTER_YEARS_UNDER_7,
  MENB_HIGHRISK_FIRST_BOOSTER_YEARS, MENB_HIGHRISK_BOOSTER_CADENCE_YEARS,
  MENACWY_ANY_TWO_DOSES_MIN_GAP, MENB_HIGHRISK_D2_GAP, MENB_REPEAT_MIN_INTERVAL,
  MENB_HIGHRISK_D3_MONTHS_FROM_D1, MENB_HIGHRISK_D3_MONTHS_FROM_D2,
  MENB_HEALTHY_D2_MONTHS, MENB_HEALTHY_RESCUE_MONTHS, MENACWY_ROUTINE_BOOSTER_MIN_GAP,
} from './intervals.js';
// P2-3 (2026-09-17): the age thresholds, from one module.
import {
  MENACWY_INFANT_SERIES_MAX_AGE_MONTHS, MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS,
  MENACWY_ROUTINE_BOOSTER_AGE_MONTHS,
  MENB_HEALTHY_MIN_AGE_MONTHS,
} from './ages.js';
import { fmtAgeMonths, fmtDate, stripAntigen } from './format.js';
import { cite } from '../data/refs.js';

// ── Min-age lookup from brands.js (TASK 1) ───────────────────────────────
// ALL_BRANDS is the single source of truth for minAgeM per product.
// maxAgeM is 999 for all meningococcal products → no upper-age check needed.
//
// MenB only: given a brand string (e.g. 'Penbraya (MenABCWY)' or 'Bexsero
// (MenB)'), finds the matching ALL_BRANDS entry by startsWith(b.key) and
// returns minAgeM. Returns null when no match found (caller chooses the
// permissive fallback). MenACWY uses brandMinAge() from brands.js instead
// (M2, 2026-09-22) because MenQuadfi's floor is stated in DAYS, not months —
// every MenB product's floor is still a plain months number (10 years), so
// this simpler months-only lookup is still correct for that vaccine.
function brandMinAgeM(brandStr) {
  if (!brandStr) return null;
  for (const b of ALL_BRANDS) {
    if (brandStr.startsWith(b.key)) return b.minAgeM;
  }
  return null;
}

// The most permissive product floor for each vaccine, used when a recorded
// dose's brand is unknown so we don't false-flag a dose we can't identify.
// P2-3 (2026-09-17): these come from the product table itself, so adding a
// product cannot leave them behind.
//
// STOP C C13 (owner, 2026-11-15): a MenACWY dose of UNKNOWN brand counts from
// 2 months (Menveo's floor; CDC's software's "unspecified" floor), not from
// MenQuadfi's 6 weeks — the 6 weeks is MenQuadfi's alone (M2, 2026-09-22).
const MIN_AGE_MENACWY_PERMISSIVE = { unit: 'months', value: MENACWY_UNKNOWN_BRAND_MIN_AGE_MONTHS };
const MIN_AGE_MENB_PERMISSIVE_MONTHS = MENB_MIN_AGE_MONTHS;

/**
 * Does this dose/current-age clear a MenACWY product's licence floor?
 *
 * `floor` is whatever brandMinAge()/MIN_AGE_MENACWY_PERMISSIVE returns: a
 * days-stated floor (MenQuadfi) or a months-stated one (every other
 * product). `ageAtDoseDaysVal` is the exact day count when a date of birth
 * and a dose date are both on file; otherwise null, and a days floor falls
 * back to the approximate months conversion (AVG_DAYS_PER_MONTH, from
 * dateUtils.js — PneumoVax S6-4 parity). There is no way to be day-exact
 * without a date of birth.
 */
function meetsMenacwyFloor(floor, ageAtDoseMonthsVal, ageAtDoseDaysVal, whenGiven) {
  if (floor.unit === 'days') {
    if (ageAtDoseDaysVal != null) return ageMeetsMinimumDays(ageAtDoseDaysVal, floor.value);
    return ageMeetsMinimum(ageAtDoseMonthsVal, floor.value / AVG_DAYS_PER_MONTH, whenGiven);
  }
  return ageMeetsMinimum(ageAtDoseMonthsVal, floor.value, whenGiven);
}

// ── Interval constants ───────────────────────────────────────────────────
// MenACWY: the minimum between ANY two doses regardless of risk class — 8
// weeks since STOP C C11 (was 4), and since D5 (2026-11-17) after a too-young
// first dose too (E1 had said 4 weeks — MenB's number).
const MENACWY_BASELINE_MIN_INTERVAL    = MENACWY_ANY_TWO_DOSES_MIN_GAP;
// MenACWY high-risk 2-dose primary (≥2y): P2-1 (2026-09-17) moved this to
// intervals.js, so the validator and the engine ask the same function.
const MENACWY_HR_ADULT_MIN_INTERVAL    = MENACWY_HIGHRISK_PRIMARY_GAP;
// MenACWY infant series: the gaps come from menacwyInfantNextDoseGate()
// (P0-1, 2026-09-17 — 8 weeks between the early doses, 12 weeks plus the first
// birthday before the final one; the 4 weeks it once had is ACIP's MenB rule).
//
// MenACWY high-risk boosters: every 5 years (or 3 years if the primary series
// ended before 7). P0-5 (2026-09-15): YEAR counts compared on the calendar —
// DAYS.years(3) demanded 1096 days, so a booster on its exact three-year
// anniversary was voided roughly a quarter of the time. The *_DAYS twins are
// display only. P2-1 group 2: the year counts come from intervals.js, the
// module the engine reads.
const MENACWY_BOOSTER_5Y_YEARS         = MENACWY_BOOSTER_CADENCE_YEARS;
// MenB high-risk: D2 ≥4 weeks after D1
const MENB_HR_D2_MIN_INTERVAL          = MENB_HIGHRISK_D2_GAP;
// MenB: 4 weeks after a dose that did not count, and healthy D2 (Ruling D, C12)
const MENB_REPEAT_MIN                  = MENB_REPEAT_MIN_INTERVAL;
// MenB high-risk: D3 ≥6 months after D1 AND ≥4 months after D2.
// P0-4 (2026-09-15): MONTH counts compared on the calendar, not day counts
// against an averaged month (DAYS.months(6) = 183 days, while a real six-month
// span is 181-184, so an exact six-month dose was rejected about half the
// time). The *_DAYS twins keep the "(min ~6 months)" text printing the same
// approximate figure it always did.
const MENB_HR_D3_MIN_MONTHS_FROM_D2    = MENB_HIGHRISK_D3_MONTHS_FROM_D2;
// MenB high-risk booster: first booster ≥1 year after the primary; later ≥2 years
const MENB_HR_FIRST_BOOSTER_MIN        = DAYS.years(MENB_HIGHRISK_FIRST_BOOSTER_YEARS);
const MENB_HR_SUBSEQUENT_BOOSTER_MIN   = DAYS.years(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS);
// MenB healthy 2-dose: D2 ≥6 months after D1 (early D2 triggers rescue)
// MenB healthy early-D2 rescue: D3 ≥4 months after early D2
const MENB_RESCUE_D3_MIN_MONTHS_FROM_D2 = MENB_HEALTHY_RESCUE_MONTHS;
const MENB_RESCUE_D3_MIN_FROM_D2       = DAYS.months(MENB_RESCUE_D3_MIN_MONTHS_FROM_D2); // display only

// Routine MenACWY booster age floor (16 years in months)
const AGE_16Y_MONTHS = MENACWY_ROUTINE_BOOSTER_AGE_MONTHS;
// The age a routine MenACWY dose starts counting (10 years in months)
const AGE_10Y_MONTHS = MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS;

// ── Helpers ───────────────────────────────────────────────────────────────

// Age in months at a past dose, from its date + current patient age + today.
// Returns null when the date is absent (caller handles unknown-date doses).
// Re-exported by validate.js for display surfaces (e.g. the compliance audit
// table) that need "age at administration" without re-deriving the date math.
// Calendar P2-2 (2026-09-17): the arithmetic lives in patientAge.js, which
// every surface shares. With a date of birth the answer is exact.
export function ageAtDoseFromDate(dose, ageMonths, today, dob = null) {
  return ageAtDoseMonths(dose, { dob, ageMonths }, today);
}

// Human-readable rendering of a day count for error messages.
// G1-a (owner, STOP G1, 2026-11-18, style rule 8): "about", never "~". A
// whole number of weeks is exact and needs no "about".
function fmtDays(n) {
  if (n < 14) return `${n} day${n === 1 ? '' : 's'}`;
  if (n < 60) {
    const w = Math.round(n / 7);
    return `${n % 7 === 0 ? '' : 'about '}${w} week${w === 1 ? '' : 's'}`;
  }
  if (n < 365) return `about ${Math.round(n / AVG_DAYS_PER_MONTH)} month${Math.round(n / AVG_DAYS_PER_MONTH) === 1 ? '' : 's'}`;
  // Review v10 P56 (owner 2026-11-20): whole years, not "2.1 years". Where the
  // rounded gap would print a minimum, gapUnder() prints the exact gap (G1-a-F1).
  const y = Math.round(n / 365.25);
  return `about ${y} year${y === 1 ? '' : 's'}`;
}

// G1-a (style rule 8, PneumoVax's `about`): an age in a sentence reads "about
// 4 years", but "birth", "before birth" and an unknown age read as they are.
function about(age) {
  if (age === '?') return 'an unknown age';
  return age === 'birth' || age === 'before birth' ? age : `about ${age}`;
}
const aboutAgeAt = (m, exactDays) => about(fmtAgeMClinical(m, exactDays));
// P63 (review v10): "(age 8 weeks)" — the age as a noun, no "about".
const ageNoun = (m, exactDays) => { const a = fmtAgeMClinical(m, exactDays); return a === '?' ? 'unknown' : a; };
// P55 (review v10): a minimum age as one plain age ("10 years", "6 weeks").
function minAgeNoun(floor) {
  if (typeof floor === 'number') return fmtMonths(floor);
  if (floor && typeof floor === 'object' && floor.unit === 'months') return fmtMonths(floor.value);
  return fmtMinAge(floor);
}
// P54 (review v10): name the product, not the antigen family.
const MENB_BRAND_BY_FAMILY = { '4C': 'Bexsero', FHbp: 'Trumenba' };

// G1-a-F1 (owner, 2026-11-19, "Exact months and days"): "about 4 months after
// the early dose 2, under the 4-month minimum" read as if the minimum was met.
// Where the rounded gap would print the minimum itself, the line prints the
// exact calendar gap ("3 months 19 days"); every other gap keeps "about".
function exactGap(fromISO, toISO) {
  const whole = Math.floor(calendarMonthsBetween(fromISO, toISO));
  const days = daysBetween(addCalendarMonths(fromISO, whole), toISO);
  const y = Math.floor(whole / 12);
  const m = whole % 12;
  return [
    y ? `${y} year${y === 1 ? '' : 's'}` : null,
    m ? `${m} month${m === 1 ? '' : 's'}` : null,
    days ? `${days} day${days === 1 ? '' : 's'}` : null,
  ].filter(Boolean).join(' ') || '0 days';
}
const fmtMonths = (n) => (n % 12 === 0
  ? `${n / 12} year${n === 12 ? '' : 's'}`
  : `${n} month${n === 1 ? '' : 's'}`);
// Review v10 (P53, P56): "(3 weeks, 8 required)" names the minimum without
// its unit only when it is the gap's own unit, so a line never reads
// "12 days, 8 required".
const unitOf = (t) => (String(t).trim().split(/\s+/).pop() ?? '').replace(/s$/, '');
function required(gapText, minText) {
  return unitOf(gapText) === unitOf(minText) ? `${String(minText).trim().split(/\s+/)[0]} required` : `${minText} required`;
}
// The gap a "… under the N-month minimum" line prints: `exact` when rounding
// would have printed the minimum (then the detail says "minimum N months").
function gapUnder(fromISO, toISO, minMonths) {
  const rounded = fmtDays(daysBetween(fromISO, toISO));
  return rounded === `about ${fmtMonths(minMonths)}`
    ? { text: exactGap(fromISO, toISO), exact: true }
    : { text: rounded, exact: false };
}

// Format an age in months using clinical units, for the record panel's
// sentences. The units come from format.js's fmtAgeMonths(), the one
// canonical formatter (P1-3, 2026-09-17: a near-copy here once printed
// "15 years 12 months"). Two deliberate differences, kept here because they
// belong to these sentences: '?' for an unknown age (every call site writes
// "~${age}"), and lower-case 'birth' (it appears mid-sentence). A negative age
// reads 'before birth', never 'birth' (impossible-entries P1-3). Pinned by
// regression-p1-3-one-age-formatter.test.js. `exactDays` is passed through so
// the MenQuadfi 6-week messages don't misround a boundary week.
function fmtAgeMClinical(m, exactDays) {
  if (m == null) return '?';
  if (m < 0) return 'before birth';
  if (m < 0.5) return 'birth';
  return fmtAgeMonths(m, exactDays);
}

// Format a min-age threshold for human-readable messages.
// Always expresses in years when ≥12 months (e.g. 120 → "10 years").
// M2 (2026-09-22): also accepts a days-stated floor as { unit: 'days', value },
// printed in weeks when it divides evenly (42 → "6 weeks", as the source
// states it) and in days otherwise — never as a fractional month.
function fmtMinAge(minAge) {
  // Fix-queue item (found at STOP C, 2026-11-15): a {unit, value} age was
  // always read as DAYS, so brandMinAge()'s months-stated floors printed as
  // "2 days" (Menveo) or "9 days" (Menactra). Months now go through the
  // months branch below.
  if (minAge && typeof minAge === 'object' && minAge.unit === 'months') return fmtMinAge(minAge.value);
  if (minAge && typeof minAge === 'object') {
    const { value } = minAge;
    if (value % 7 === 0) {
      const w = value / 7;
      return `${w} week${w === 1 ? '' : 's'}`;
    }
    return `${value} day${value === 1 ? '' : 's'}`;
  }
  if (minAge >= 12) {
    const y = minAge / 12;
    return `${y} year${y === 1 ? '' : 's'} (${minAge} months)`;
  }
  return `${minAge} month${minAge === 1 ? '' : 's'}`;
}

// The same threshold as an adjective, for "below the 10-year minimum age for
// Bexsero" (G1-a: PneumoVax's too-young line, style rule 7 across the apps).
function fmtMinAgeAdj(minAge) {
  if (minAge && typeof minAge === 'object' && minAge.unit === 'months') return fmtMinAgeAdj(minAge.value);
  if (minAge && typeof minAge === 'object') {
    const { value } = minAge;
    return value % 7 === 0 ? `${value / 7}-week` : `${value}-day`;
  }
  if (minAge >= 12 && minAge % 12 === 0) return `${minAge / 12}-year`;
  return `${minAge}-month`;
}

// G1-a: the sentence a "Not counted — repeat" line keeps. "Repeat" is the
// label's own word (style rule 6), so the line says only how: one dose, not
// the whole series. validate.js adds it; recommend.js finds it by this copy.
export const DO_NOT_RESTART = 'Do not restart.';   // P53 (review v10)

// G1-a: a dose set aside on the answer "not high-risk then" or "unsure" (the
// label already says it was not counted).
function markedNotHighRisk(riskAnswer) {
  return riskAnswer === 'unsure'
    ? 'Marked as unsure whether the patient was high-risk on that date, so it is treated as not high-risk.'
    : 'Marked as not high-risk on that date.';
}

// ── Verdict builders ──────────────────────────────────────────────────────

export function unknownResult(reasons) {
  return { status: 'unknown', reasons };
}

// G1-b (owner, STOP G1, 2026-11-18, "Yes, as PneumoVax"): a recorded dose's
// line is the label plus one reason; background goes behind the dose's own
// "Why this" fold-out, as a `whys` entry (rendered with the dose's `detail`).
// Exported so the tests quote the one copy.
// G1-a (owner, STOP G1, 2026-11-18): the packet's L3 and L1 "Why this" words.
export const MENB_LICENSED_FROM_10_WHY =
  'MenB vaccines (Bexsero, Trumenba, Penbraya, Penmenvy) are licensed from age 10 years.';
export const MENB_WANES_BEFORE_16_WHY =
  'MenB antibody protection wanes within 1–2 years, so a dose before 16 does not count without a high-risk indication.';
const MENB_HR_BOOSTER_CADENCE_WHY = 'High-risk MenB boosters are given every 2–3 years.';
const ACWY_BEFORE_16_SAFE_WHY = 'A MenACWY dose before 16 is safe, but it is not the routine booster.';

function validResult(reasons = []) {
  return { status: 'valid', reasons };
}

// A 'record problem': the entry itself is wrong, as opposed to a real dose
// given at the wrong time. `kind` names which problem, so the card can label
// the chip (the wording stays in doseChipLabel.js). G3 (2026-09-16): graded
// like an invalid dose — not counted — but it must NOT collect the walk's
// "repeat this dose only" advice: repeating a shot nobody received is nonsense.
function recordProblemResult(kind, reasons, detail) {
  const r = { status: 'invalid', recordProblem: kind, reasons };
  if (detail != null) r.detail = detail;
  return r;
}

// An 'invalid' verdict. G4 (2026-09-16): `reasonCites` is an ORDERED list of
// citation objects, one per literal "[c]" placeholder across `reasons`, in
// order — the same contract recommend.js uses for a card's note. RecCard
// assigns the visible [N] at render time.
function invalidResult(reasons, detail, reasonCites) {
  const r = { status: 'invalid', reasons };
  if (detail != null) r.detail = detail;
  if (reasonCites && reasonCites.length) r.reasonCites = reasonCites;
  return r;
}

// G1-a-F3 (owner, 2026-11-19, "Drop it on boosters"): a booster given too
// soon has no series to restart, so validate.js does not add DO_NOT_RESTART to
// its line; recommend.js still dates its repeat ("Repeat from <date>.").
function tooSoonBooster(r) {
  return { ...r, tooSoonBooster: true };
}

// E2 (owner, 2026-11-15): marks a wrong-family MenB dose, so the walk keeps it
// off the schedule's clock and holds the next dose only to the 4-week floor.
function wrongFamily(r) {
  return { ...r, wrongFamily: true };
}

// A dose that was validly given but does not advance THIS series (A3, P0-1).
// `beforeAgeY` is the age line it fell short of (10 or 16), so the chip can
// name it: "Not counted — given before age 10" (owner, STOP E1 Q6, 2026-11-17).
function setAsideResult(reasons, reasonCites, beforeAgeY) {
  return { status: 'valid', reasons, reasonCites, notAdolescentCount: true, setAsideBeforeAgeY: beforeAgeY };
}

// STOP C C1 (owner, 2026-11-15): a dose with no date does not count. It is
// kept on the record and shown, but the card schedules as if it were not
// given (ACIP: "providers should only accept written, dated records as
// evidence of vaccination"). Graded like a record problem: no dose is known
// to have been given at a wrong time, so the walk's "repeat this dose only"
// advice would be wrong, and with no date it can never start a clock.
function undatedNotCounted() {
  const r = recordProblemResult('undated', [
    // G1-a: the label says "No date recorded — not counted" (style rule 6).
    'Only dated records count [c]. Add the date to check this dose. Until then it is not counted.',   // P64 (review v10)
  ]);
  r.reasonCites = [cite('gbpWrittenDatedRecords')];
  return r;
}

// C11 (owner, 2026-11-21, "Dose-line citations"): a not-counted dose line
// cites the sentence its claim rests on, one of its row's `sourcesSay.refs`.
//
// MenACWY minimum age, by product: Menveo's 2 months and the one-vial form's
// 10 years as CDC states them; MenQuadfi's 6 weeks as WA DOH states it (the
// owner's 2026-09-23 decision, following AAP). Menactra, the pentavalents and
// an unknown brand (owner C13) have no quoted MenACWY minimum-age sentence yet,
// so their line carries no mark rather than a sentence about another product.
function acwyMinAgeCite(brand) {
  if (!brand) return null;
  if (brand.startsWith('Menveo 1-vial')) return cite('cdcChildMenveoLiquid10y');
  if (brand.startsWith('Menveo')) return cite('cdcChildAcwyMinAge');
  if (brand.startsWith('MenQuadfi')) return cite('waDohMenQuadfiAapAlignment');
  // Owner, 2026-11-21 (C11 follow-up). Penbraya: CDC's MenACWY minimum-age line
  // names it at 10 years. Penmenvy: no page states its minimum age, so ACIP's
  // "Persons aged ≥10 years for whom MenACWY and MenB are both indicated".
  // Menactra: no sentence states its minimum age; left unmarked (owner).
  if (brand.startsWith('Penbraya')) return cite('cdcChildAcwyMinAge');
  if (brand.startsWith('Penmenvy')) return cite('penmenvyAged10BothIndicated');
  return null;
}

// A MenACWY booster too soon: the same table the patient's card cites for that
// booster. 3 years (series ended before 7): ACIP's under-7 row. 5 years: the
// travel table for travel, the microbiologist table for lab work, the military
// row for a recruit, and the medical-risk row otherwise (it also covers an
// A/C/W/Y outbreak, whose table gives the same timing).
function acwyBoosterGapCite(ctx, cadenceYears) {
  const a = acwy(ctx);
  if (a.militaryBoosterNow) return cite('acip2020MilitaryBooster5Years');
  if (cadenceYears === MENACWY_FIRST_BOOSTER_YEARS_UNDER_7) return cite('boosterBeforeAge7');
  if (!a.isHighRiskNow && ctx.riskIds.includes('travel')) return cite('acip2020Table9TravelBooster');
  if (!a.isHighRiskNow && ctx.riskIds.includes('microbiologist')) return cite('acip2020Table7MicrobiologistBooster');
  return cite('boosterAtOrAfterAge7');
}

/** Adds " [c]" before a line's final full stop when there is a sentence to cite. */
const withMark = (line, c) => (c ? line.replace(/\.$/, ' [c].') : line);
const citesOf = (c) => (c ? [c] : undefined);

const brandLabelOf = (brand, fallback) => (brand
  ? brand.replace(/\s*\(Men(?:ACWY|B|ABCWY)\).*/, '')
  : fallback);

// ── What every row is handed ─────────────────────────────────────────────

/**
 * The facts about one dose, gathered once. `effectiveIdx` is the dose's
 * position among the doses COUNTED so far (0-based) and `kept` is that list —
 * not the raw record — which is what lets a dose after a dropped one be
 * judged at its real position.
 *
 * P1-1 (2026-09-17): every age and interval allows CDC's 4-day grace unless the
 * row says otherwise; `whenGiven` carries what ageMeetsMinimum() needs to
 * re-derive the age as if the dose were 4 days later.
 */
export function doseContext({ vaccine, dose, effectiveIdx, kept, ageMonths, riskIds, today, riskAnswer, dob, anchor = null, lastUncounted = null }) {
  const dated = !!dose?.date;
  return {
    vaccine, dose, effectiveIdx, kept, ageMonths, riskIds, today, riskAnswer, dob,
    // RULING D (STOP C C2): the last dated dose given before this one, counted
    // or not (validate.js runWalk decides which doses qualify). The gap rows
    // measure from it, so a repeat is timed from the dose that failed.
    anchor,
    // E2: the last dated dose before this one that did not count, a
    // wrong-family MenB dose included; null once a later dose counted.
    lastUncounted,
    dated,
    brand: dose?.brand || '',
    whenGiven: { doseDate: dose?.date || null, ageMonths, today, dob },
    ageAtDose: dated ? ageAtDoseFromDate(dose, ageMonths, today, dob) : null,
    // Exact only with a date of birth on file — see meetsMenacwyFloor().
    ageAtDoseDays: dated && dob ? daysBetween(dob, dose.date) : null,
  };
}

// Small cached facts several rows read. Computed on first use, so a row that
// never asks never pays — and none of them can disagree with another row.
function once(ctx, key, make) {
  if (!(key in ctx)) ctx[key] = make();
  return ctx[key];
}

// The dose the gap is measured from, and the gap. RULING D (owner, STOP C C2,
// 2026-11-15; CDC Timing and Spacing: "The repeat dose should be spaced after
// the invalid dose by the recommended minimum interval"): the last DATED dose
// GIVEN — a dose that did not count for being too soon or too young included
// — not the last dose that counted. Hand-built contexts with no anchor fall
// back to the last counted dated dose, which is what the anchor is whenever
// no dose has failed. WHICH rule applies still comes from the counted doses
// (`effectiveIdx`, `kept`): only the clock moves.
const prevGiven = (ctx) => once(ctx, '_prevGiven', () => {
  if (!ctx.dated) return null;
  const d = ctx.anchor ?? [...ctx.kept].reverse().find((k) => k.date) ?? null;
  return d ? { dose: d, interval: daysBetween(d.date, ctx.dose.date) } : null;
});
// The same, for rows about the gap from a previous SERIES dose: none for the
// first counted dose. (A repeat of a dose 1 that did not count is held only to
// the any-two-doses rows, which read prevGiven — owner, E1.)
const prevDated = (ctx) => (ctx.effectiveIdx === 0 ? null : prevGiven(ctx));

const keptDated = (ctx) => once(ctx, '_keptDated', () => ctx.kept.filter((d) => d.date));

const before = (ctx, months) => ctx.ageAtDose !== null && !ageMeetsMinimum(ctx.ageAtDose, months, ctx.whenGiven);

// MenACWY: which schedule the patient is on TODAY. Today's risk boxes decide;
// the app does not record risk on the date of a past dose (hence needs-input).
const acwy = (ctx) => once(ctx, '_acwy', () => {
  const cls = menacwyRiskClass(ctx.riskIds);
  // 'primary2' is the medical high-risk series.
  const isHighRiskNow = cls === 'primary2';
  // M9 (2026-09-15): 'single+boost' (travel, microbiologist) follows a booster
  // schedule too, so their earlier doses count. ACIP: "Children who received
  // MenACWY at age <11 years and for whom booster vaccination is recommended
  // because of an ongoing increased risk should follow the booster dose
  // schedule (Tables 4, 5, 6, 7, 8, and 9), not the routine adolescent schedule."
  const ongoingRiskNow = isHighRiskNow || cls === 'single+boost';
  // M10 (2026-09-15): an infant still on the MenACWY infant series (under 2
  // today) is not on the routine adolescent series at all.
  const onInfantSeriesNow = ctx.ageMonths < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS
    && menacwyInfantSeriesIndicated(ctx.riskIds);
  // M12 (2026-09-15): an A/C/W/Y outbreak contact follows ACIP Table 8's booster
  // schedule, so earlier doses count at any age. Military recruits and college
  // residents ('single' too) keep the routine treatment: Table 10 gives them no
  // booster schedule to follow.
  const onOutbreakSchedule = ctx.riskIds.includes('outbreak_acwy');
  // D6 (owner, 2026-11-17): a military recruit's booster is checked like a
  // travel booster (Table 10: "Every 5 yrs on basis of assignment"), from 16
  // only — under 16 the military box adds nothing (owner B-4). Outbreak and
  // travel, when also ticked, already check it.
  const militaryBoosterNow = !isHighRiskNow && cls !== 'single+boost' && !onOutbreakSchedule
    && ctx.riskIds.includes('military') && ctx.ageMonths >= AGE_16Y_MONTHS;
  return {
    isHighRiskNow,
    // STOP C C10 (owner, 2026-11-15): travel, microbiologist and A/C/W/Y
    // outbreak boosters are checked like medical high-risk ones (ACIP 2020
    // Tables 7, 8 and 9: 3 years if under 7, else 5). The outbreak half landed
    // with STOP B answer B-2, which gave the outbreak card the same booster
    // date (before it, the card advised doses this check would reject).
    // Military and college residence are not on this list (Table 10).
    otherBoosterScheduleNow: !isHighRiskNow && (cls === 'single+boost' || onOutbreakSchedule || militaryBoosterNow),
    travelOrLabNow: cls === 'single+boost',
    militaryBoosterNow,
    routineOnly: !ongoingRiskNow && !onInfantSeriesNow && !onOutbreakSchedule,
  };
});

// Is this dose the routine 16-year booster? Given at 16 or older (with the
// grace), when no dose counted so far was. The card's twin is
// recommend.js routineBoosterCurrentlyUnmet().
function acwyIsRoutineBooster(ctx) {
  if (ctx.ageAtDose === null || !ageMeetsMinimum(ctx.ageAtDose, AGE_16Y_MONTHS, ctx.whenGiven)) return false;
  const { ageMonths, today, dob } = ctx;
  return !keptDated(ctx).some((d) => {
    const a = ageAtDoseFromDate(d, ageMonths, today, dob);
    return a != null && ageMeetsMinimum(a, AGE_16Y_MONTHS, { doseDate: d.date, ageMonths, today, dob });
  });
}

// A MenACWY booster too soon after the dose before it, on a schedule with
// boosters (medical high risk; since C10 also travel, microbiologist and
// A/C/W/Y outbreak). M4: a dose is a booster only once the primary series is
// behind it; the first booster's cadence keys off the age at the LAST primary
// dose. Unknown age → 3 years (conservative). P0-5: compared on the calendar.
// Only too-soon is flagged; a late booster is ordinary catch-up. `who` names
// the schedule in the sentence.
function acwyBoosterTooSoon(ctx, who) {
  const prev = prevDated(ctx);
  if (!prev) return null;
  const { primaryTotal } = acwySeries(ctx);
  if (ctx.effectiveIdx < primaryTotal) return null;
  let cadenceYears;
  let cadenceLabel;
  if (ctx.effectiveIdx === primaryTotal) {
    const kd = keptDated(ctx);
    const lastPrimary = kd[primaryTotal - 1] || kd[kd.length - 1] || null;
    const lastPrimaryAge = ageAtDoseFromDate(lastPrimary, ctx.ageMonths, ctx.today, ctx.dob);
    // T2 (owner, 2026-11-19, "Keep as safety net"): one function for the 3-vs-5
    // answer, shared with recommend.js, so its unknown-age fallback ("before 7")
    // lives in one place and one test can show no patient reaches it.
    cadenceYears = menacwyFirstBoosterYears(lastPrimaryAge);
    cadenceLabel = `${cadenceYears} years`;
  } else {
    cadenceYears = MENACWY_BOOSTER_5Y_YEARS;
    cadenceLabel = '5 years';
  }
  if (calendarIntervalMeetsMinimum(prev.dose.date, cadenceYears * 12, ctx.dose.date)) return null;
  // G1-a: the minimum folds into the reason; "does not count" is the label's.
  const cadenceAdj = cadenceLabel.replace(' years', '-year');
  const gap = gapUnder(prev.dose.date, ctx.dose.date, cadenceYears * 12);
  return tooSoonBooster(invalidResult(
    [`Booster ${gap.text} after the last dose, ${required(gap.text, cadenceLabel)} [c].`],   // P56 (review v10); C11
    `Interval: ${gap.text}. Required: ${cadenceLabel}.`,   // P66
    [acwyBoosterGapCite(ctx, cadenceYears)],
  ));
}

// MenACWY: the shape of the series so far, for the gap rows.
const acwySeries = (ctx) => once(ctx, '_acwySeries', () => {
  const kd = keptDated(ctx);
  const { ageMonths, today, dob, riskIds } = ctx;
  const d1AgeM = ageAtDoseFromDate(kd[0] || null, ageMonths, today, dob);
  // P1-3: d2AgeM decides 3-vs-4 doses for a 3-6-month start.
  const d2AgeM = ageAtDoseFromDate(kd[1] || null, ageMonths, today, dob);
  const infantSeries = menacwyInfantSeriesIndicated(riskIds);
  // menacwyPrimaryTotal()'s own condition for the infant series, matched
  // character for character, so the validator checks exactly the population
  // whose series length it reads from the infant helper.
  const onInfantPrimary = infantSeries && d1AgeM != null
    && d1AgeM < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS;
  return {
    d1AgeM, d2AgeM, onInfantPrimary,
    primaryTotal: menacwyPrimaryTotal({ riskClass: menacwyRiskClass(riskIds), d1AgeM, d2AgeM, infantSeries }),
  };
});

const acwyBefore10 = (ctx) => before(ctx, AGE_10Y_MONTHS);
const menbBefore16 = (ctx) => before(ctx, MENB_HEALTHY_MIN_AGE_MONTHS);

/**
 * Is this dose dated after today? The one test, used by the RECORD-FUTURE-DATE
 * row below and by the dose line on the card (RecCard.jsx `describeDose`), so
 * the line and the verdict under it cannot disagree about a date.
 *
 * False for an undated row, and false for a dose dated TODAY: a dose given this
 * morning counts. `today` is an ISO date; with none, nothing is in the future.
 *
 * Added 2026-11-21 (parity with PneumoVax, owner decision 2026-10-12, PneumoVax
 * PR #41): a dose dated in the future used to print the age the patient WILL be.
 */
export function isFutureDated(dose, today) {
  return Boolean(dose?.date && today && dose.date > today);
}

// ── The table ────────────────────────────────────────────────────────────

export const DOSE_RULES = [
  // ── Record problems: the entry is wrong, for both vaccines ─────────────
  // Settled before any vaccine rule runs: there is no dose to grade, the date
  // is wrong. Checked once here for both vaccines — a second copy is how
  // rules drift.
  {
    id: 'RECORD-FUTURE-DATE',
    inventory: 'R1',
    what: 'A dose dated after today',
    vaccine: 'any',
    schedule: 'any',
    measuredFrom: 'the record',
    enforcement: 'record-problem',
    grace: null,
    authorityToday: 'This app (G3, 2026-09-16)',
    sourcesSay: {
      verdict: 'record-keeping',
      refs: [],
      note: 'About the entry, not the vaccine: a record lists doses already given, so a future date is a typing mistake. No clinical source is needed.',
    },
    label: 'Date is in the future — not counted',
    // G3: the record lists doses already received, so a future date is a typo
    // or an appointment typed into the wrong place. Counting it would tell a
    // clinician the patient is covered by a shot that is not in their arm.
    check: ({ dose, today }) => {
      if (!isFutureDated(dose, today)) return null;
      return recordProblemResult(
        'future',
        // G1-a: PneumoVax's words (style rule 7); the label says "not counted".
        [`Today is ${fmtDate(today)}. Correct a mistyped year, or remove an appointment not yet attended.`],
        `Recorded date: ${fmtDate(dose.date)}. Today: ${fmtDate(today)}.`
      );
    },
  },
  {
    id: 'RECORD-BEFORE-BIRTH',
    inventory: 'R2',
    what: 'A dose dated before the patient was born',
    vaccine: 'any',
    schedule: 'any',
    measuredFrom: 'the record',
    enforcement: 'record-problem',
    grace: null,
    authorityToday: 'This app (impossible entries P1-1, 2026-09-17)',
    sourcesSay: {
      verdict: 'record-keeping',
      refs: [],
      note: 'About the entry, not the vaccine: no dose can be given before birth. No clinical source is needed.',
    },
    label: 'Dated before birth — not counted',
    // P1-1: it used to be blamed on the patient's AGE (a negative age is below
    // every minimum), so a mistyped year produced advice to repeat a dose the
    // child had already had. Two ways to know: a date of birth on file (exact),
    // or, with years/months only, a negative computed age at the dose. Ordered
    // after the future date, so a wild year that is also in the future keeps
    // reporting as future.
    check: ({ dose, dob, ageMonths, today }) => {
      if (!dose?.date) return null;
      const knownFromDob = dob && dose.date < dob;
      const knownFromAge = !dob && ageMonths != null
        && ageAtDoseFromDate(dose, ageMonths, today, dob) < 0;
      if (!knownFromDob && !knownFromAge) return null;
      const because = dob
        ? `The date of birth recorded is ${fmtDate(dob)}.`
        : 'The age entered puts this date before the patient was born.';
      return recordProblemResult(
        'before-birth',
        // G1-a: PneumoVax's words (style rule 7); the label says the rest.
        ["A mistyped year is the usual cause. Correct the date, or remove the row if it is not this patient's. It needs no repeat dose."],
        `Recorded date: ${fmtDate(dose.date)}. ${because}`
      );
    },
  },
  {
    id: 'RECORD-ENTERED-TWICE',
    inventory: 'R3',
    what: 'A dose on the same date as a dose already counted',
    vaccine: 'any',
    schedule: 'any',
    measuredFrom: 'the record',
    enforcement: 'record-problem',
    grace: null,
    authorityToday: 'This app (G7, 2026-09-16)',
    sourcesSay: {
      verdict: 'record-keeping',
      refs: [],
      note: 'About the entry, not the vaccine: two rows on one date are one dose typed twice. No clinical source is needed.',
    },
    label: 'Entered twice — this row not counted',
    // G7: two doses of the same vaccine are never given on the same day. The
    // interval rule used to get there first and say "0 days … repeat this dose
    // only". Matched against `kept`: if the twin was itself dropped, nothing
    // counted on that date and this row is the first real one.
    check: ({ dose, kept }) => {
      if (!dose?.date) return null;
      const twin = kept.find((k) => k?.date === dose.date);
      if (!twin) return null;
      const reasons = [
        // G1-a: PneumoVax's words (style rule 7); the label says "not counted".
        `Same date as an earlier dose (${fmtDate(dose.date)}), likely entered twice. Correct the date or remove this row.`,   // P65 (review v10)
      ];
      if (dose.brand && twin.brand && dose.brand !== twin.brand) {
        reasons.push(`The two rows name different brands (${stripAntigen(twin.brand)} and ${stripAntigen(dose.brand)}), so at least one is wrong.`);
      }
      return recordProblemResult('duplicate', reasons, `Same date as a dose already recorded: ${fmtDate(dose.date)}.`);
    },
  },

  // ── MenACWY, a dose with no date ───────────────────────────────────────
  {
    id: 'ACWY-UNDATED-BELOW-MIN-AGE',
    inventory: 'A1',
    what: 'MenACWY with no date, of a known brand whose minimum age is above the patient\'s age today',
    vaccine: 'MenACWY',
    dated: false,
    schedule: 'any',
    measuredFrom: 'today',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'Product minimum age (brands.js)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['cdcChildAcwyMinAge', 'cdcChildMenveoLiquid10y', 'waDohMenQuadfiAapAlignment', 'penmenvyAged10BothIndicated'],
      note: 'CDC states each product\'s minimum age (Penbraya 10 years among them; Penmenvy, not yet in CDC\'s notes, from ACIP\'s "aged ≥10 years"; Menactra\'s 9 months stated nowhere, owner 2026-11-21); the app applies it to an undated dose by reasoning that the dose was given no later than today. For MenQuadfi the app uses 6 weeks (owner decision 2026-09-23, following AAP), where CDC\'s notes still say 2 years.',
    },
    label: 'Not counted — repeat',
    // A past dose can never have been given later than today, so today's age
    // is an upper bound on the age at the dose. Unknown brand → the most
    // permissive product (MenQuadfi, 6 weeks) → not flagged, per ACIP (any
    // brand may be used when the brand is unknown).
    check: ({ brand, ageMonths, today, dob }) => {
      const knownBrandFloor = brandMinAge(brand);
      if (knownBrandFloor === null) return null;
      const currentAgeDays = dob ? daysBetween(dob, today) : null;
      if (meetsMenacwyFloor(knownBrandFloor, ageMonths, currentAgeDays, { doseDate: today, ageMonths, today, dob })) return null;
      const label = brandLabelOf(brand, '');
      const c = acwyMinAgeCite(brand);   // C11
      return invalidResult(
        [`Recorded without a date. The patient is ${aboutAgeAt(ageMonths, currentAgeDays)} today, below the ${fmtMinAgeAdj(knownBrandFloor)} minimum age for ${label}${c ? ' [c]' : ''}, so the dose was given too young.`],
        `Current age (upper bound on age at administration): ${aboutAgeAt(ageMonths, currentAgeDays)}. Minimum for ${label}: ${fmtMinAge(knownBrandFloor)}.`,
        citesOf(c),
      );
    },
  },
  {
    id: 'ACWY-UNDATED-NOT-COUNTED',
    inventory: 'A10',
    what: 'MenACWY with no date, nothing else wrong',
    vaccine: 'MenACWY',
    dated: false,
    schedule: 'any',
    measuredFrom: 'the record',
    enforcement: 'record-problem',
    grace: null,
    authorityToday: 'ACIP General Best Practice (only written, dated records count); owner, STOP C C1',
    sourcesSay: {
      verdict: 'stated',
      refs: ['gbpWrittenDatedRecords', 'gbpRecordsNotFoundSusceptible'],
      note: 'ACIP\'s general guidance (read live 2026-11-16) accepts only written, dated records, except influenza and PPSV23. Owner, STOP C C1 (2026-11-15): an undated dose does not count, and the card schedules as if it were not given.',
    },
    label: 'No date recorded — not counted',
    check: () => undatedNotCounted(),
  },

  // ── MenACWY, a dated dose ──────────────────────────────────────────────
  {
    id: 'ACWY-BELOW-MIN-AGE',
    inventory: 'A2',
    what: 'MenACWY given below the product\'s minimum age',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'any',
    measuredFrom: 'birth',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'Product minimum age (brands.js); MenQuadfi 6 weeks is the owner\'s 2026-09-23 decision on AAP\'s word',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['cdcChildAcwyMinAge', 'cdcChildMenveoLiquid10y', 'waDohMenQuadfiAapAlignment', 'penmenvyAged10BothIndicated'],
      note: 'Menveo\'s minimum ages (2 months; the liquid one-vial form from 10 years) and Penbraya\'s (10 years) are as CDC states. Penmenvy\'s 10 years cites ACIP\'s "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" (no page states its minimum age); Menactra\'s 9 months is stated on no ACIP/CDC page and its line carries no source (owner 2026-11-21). MenQuadfi\'s 6 weeks is the owner\'s decision of 2026-09-23 following AAP, where CDC\'s notes still say 2 years (CLAUDE.md: AAP governs where the two disagree).',
    },
    label: 'Not counted — repeat',
    // brandMinAge() is the single source of a product's licence floor, in
    // whichever unit it is stated. Unknown brand → the most permissive product.
    check: (ctx) => {
      const floor = brandMinAge(ctx.brand) ?? MIN_AGE_MENACWY_PERMISSIVE;
      if (ctx.ageAtDose === null || meetsMenacwyFloor(floor, ctx.ageAtDose, ctx.ageAtDoseDays, ctx.whenGiven)) return null;
      const label = brandLabelOf(ctx.brand, 'this brand');
      const c = acwyMinAgeCite(ctx.brand);   // C11
      return invalidResult(
        // P55 (review v10): the clinical term first.
        [withMark(`Minimum age not met (${aboutAgeAt(ctx.ageAtDose, ctx.ageAtDoseDays)}, ${minAgeNoun(floor)} for ${ctx.brand ? label : 'an unknown brand'}).`, c)],
        `Age at administration: ${aboutAgeAt(ctx.ageAtDose, ctx.ageAtDoseDays)}. Minimum for ${label}: ${fmtMinAge(floor)}.`,
        citesOf(c),
      );
    },
  },
  {
    id: 'ACWY-ROUTINE-BEFORE-10',
    inventory: 'A7',
    what: 'MenACWY before age 10, for a patient on the routine schedule only',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'routine (no ongoing risk, not on the infant series, not an outbreak contact)',
    measuredFrom: 'birth',
    enforcement: 'set-aside',
    grace: true,
    authorityToday: 'ACIP 2020 (acwyBeforeAge10)',
    sourcesSay: {
      verdict: 'stated',
      refs: ['acwyBeforeAge10'],
      note: 'ACIP says a child with no ongoing risk who had MenACWY before 10 still gets the adolescent series. The app sets that dose aside, as stated.',
    },
    label: 'Not counted — given before age 10',
    // A3: not a min-age "invalid" — the dose was validly given — it simply
    // doesn't advance the adolescent series. Source:
    // https://www.immunize.org/ask-experts/topic/menacwy/vaccine-recommendations-menacwy/
    check: (ctx) => {
      if (!acwy(ctx).routineOnly || !acwyBefore10(ctx)) return null;
      return setAsideResult(
        // G1-a (packet L4): the second sentence is the cited quote's own.
        [`Given at ${aboutAgeAt(ctx.ageAtDose, ctx.ageAtDoseDays)}. The adolescent series still starts at 11–12 years. [c]`],
        [cite('acwyBeforeAge10')],
        10,
      );
    },
  },
  // Risk-at-dose ambiguity: high-risk NOW, dose before 10. Whether it counted
  // toward the high-risk series depends on whether the patient was already
  // high-risk on that date — not recorded. Owner design, 2026-07-23. Three
  // rows, one per answer to the question.
  {
    id: 'ACWY-HIGHRISK-BEFORE-10-ASK',
    inventory: 'A8',
    what: 'MenACWY before 10, patient high-risk now, risk-at-dose question not answered',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'birth',
    enforcement: 'needs-input',
    grace: true,
    authorityToday: 'This app (owner design 2026-07-23)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['cdcChildAcwyBefore10OngoingRisk', 'acwyBeforeAge10'],
      note: 'CDC splits doses before 10 by whether boosters are recommended for an ongoing risk, but does not say what to do when the risk began after the dose. The owner chose to ask (2026-07-23).',
    },
    label: 'Needs input',
    check: (ctx) => {
      if (!acwy(ctx).isHighRiskNow || !acwyBefore10(ctx) || ctx.riskAnswer !== undefined) return null;
      return {
        status: 'pending',
        needsInput: true,
        // G1-a (packet L2): the question sits right below, so "not recorded" goes.
        reasons: ['Given before 10 years. It counts toward the high-risk series only if the patient was high-risk then.'],   // P62 (review v10)
        promptDate: ctx.dose.date,
      };
    },
  },
  {
    id: 'ACWY-HIGHRISK-BEFORE-10-NO',
    inventory: 'A8',
    what: 'MenACWY before 10, patient high-risk now, answered "not high-risk then" or "unsure"',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'birth',
    enforcement: 'set-aside',
    grace: true,
    authorityToday: 'This app (owner design 2026-07-23), citing ACIP 2020 (acwyBeforeAge10)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['acwyBeforeAge10'],
      note: 'Answered "not high-risk then" or "unsure": the dose is treated as ACIP treats a dose before 10 with no ongoing risk, and set aside. Treating "unsure" the same way is the owner\'s design (2026-07-23).',
    },
    label: 'Not counted — given before age 10',
    check: (ctx) => {
      if (!acwy(ctx).isHighRiskNow || !acwyBefore10(ctx)) return null;
      if (ctx.riskAnswer !== 'no' && ctx.riskAnswer !== 'unsure') return null;
      return setAsideResult(
        [`Given at ${aboutAgeAt(ctx.ageAtDose, ctx.ageAtDoseDays)}, before age 10. ${markedNotHighRisk(ctx.riskAnswer)} [c]`],
        [cite('acwyBeforeAge10')],
        10,
      );
    },
  },
  {
    id: 'ACWY-HIGHRISK-BEFORE-10-YES',
    inventory: 'A8',
    what: 'MenACWY before 10, patient high-risk now, answered "high-risk then" — judged as a high-risk series dose',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'birth',
    enforcement: 'counts-with-note',
    grace: true,
    authorityToday: 'This app (owner design 2026-07-23)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['cdcChildAcwyBefore10OngoingRisk'],
      note: 'Answered "high-risk then": the dose is judged on the high-risk schedule, as CDC says for children with an ongoing risk. Asking the question at all is the owner\'s design (2026-07-23).',
    },
    label: 'Dose N of M',
    // Any answer other than no/unsure (normally 'yes') goes on to the gap rows
    // below as a high-risk series dose, carrying this note if nothing rejects
    // it. U3 (2026-09-17): shortened to the part that varies.
    check: (ctx) => {
      if (!acwy(ctx).isHighRiskNow || !acwyBefore10(ctx) || ctx.riskAnswer === undefined) return null;
      return { carryNote: `Counted: high-risk at the time (age ${ageNoun(ctx.ageAtDose, ctx.ageAtDoseDays)}).` };   // P63 (review v10)
    },
  },
  {
    id: 'ACWY-INFANT-SERIES-GAP',
    inventory: 'A3',
    what: 'A dose of the MenACWY infant series (dose 1 under 2 years) too soon after the last, or its final dose before 12 months',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'infant series (asplenia, complement, HIV, travel, outbreak; dose 1 under 2 years)',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'CDC child schedule notes',
    sourcesSay: {
      verdict: 'stated',
      refs: ['cdcChildAcwyInfantSeries', 'acwyInfantHighRisk7to23mo'],
      note: 'CDC states the infant gaps as minimums in words ("at least 8 weeks", "at least 12 weeks later and after age 12 months"). The app voids a dose below them, which claims no more than the source.',
    },
    label: 'Not counted — repeat',
    // Only inside the primary series; a dose past the total is a booster and
    // ACWY-HIGHRISK-BOOSTER-GAP owns it.
    check: (ctx) => {
      const prev = prevDated(ctx);
      const s = acwySeries(ctx);
      if (!prev || !s.onInfantPrimary) return null;
      const gate = menacwyInfantNextDoseGate({ d1AgeM: s.d1AgeM, d2AgeM: s.d2AgeM, given: ctx.effectiveIdx });
      if (ctx.effectiveIdx >= gate.total) return null;
      const { interval } = prev;
      const tooSoon = !intervalMeetsMinimum(interval, gate.minIntervalDays);
      const tooYoung = gate.minAgeMonths != null
        && ctx.ageAtDose != null && !ageMeetsMinimum(ctx.ageAtDose, gate.minAgeMonths, ctx.whenGiven);
      if (!tooSoon && !tooYoung) return null;
      const weeks = gate.minIntervalDays / 7;
      // G1-a: the line is the reason (the minimum folded in); CDC's rule goes
      // behind "Why this"; "does not count; repeat it" is the label's.
      const ageAt = aboutAgeAt(ctx.ageAtDose, ctx.ageAtDoseDays);
      const line = tooSoon && tooYoung
        ? `Minimum interval not met (${fmtDays(interval)}, ${required(fmtDays(interval), `${weeks} weeks`)}), and given before 12 months (${ageAt}).`
        : tooSoon
          ? `Minimum interval not met (${fmtDays(interval)}, ${required(fmtDays(interval), `${weeks} weeks`)}).`
          : `Minimum age not met (${ageAt}, 12 months required).`;
      // L3 (review v10): CDC's requirement sentence repeated the line; the numbers stay in the detail.
      return {
        ...invalidResult(
          // C11: CDC's infant-series sentence states the 8 weeks, the 12 weeks and the 12 months.
          [withMark(line, cite('cdcChildAcwyInfantSeries'))],
          `Interval: ${fmtDays(interval)}. Minimum: ${fmtDays(gate.minIntervalDays)}${gate.minAgeMonths != null ? ' and after age 12 months' : ''}.`,
          [cite('cdcChildAcwyInfantSeries')],
        ),
      };
    },
  },
  {
    id: 'ACWY-HIGHRISK-PRIMARY-GAP',
    inventory: 'A4',
    what: 'Dose 2 of the MenACWY high-risk series begun at 2 years or older, under 8 weeks after dose 1',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'high-risk, series begun at 2 years or older',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020',
    sourcesSay: {
      verdict: 'stated',
      refs: ['cdcChildAcwyRisk2DoseFrom24m', 'acip2020Acwy8WeekMinimum'],
      note: 'CDC and ACIP state 8 weeks as a minimum in words ("at least 8 weeks apart"; "an 8-week minimum interval"). The app voids a dose below it, which claims no more than the source.',
    },
    label: 'Not counted — repeat',
    check: (ctx) => {
      const prev = prevDated(ctx);
      if (!prev || acwySeries(ctx).onInfantPrimary || !acwy(ctx).isHighRiskNow || ctx.effectiveIdx !== 1) return null;
      if (intervalMeetsMinimum(prev.interval, MENACWY_HR_ADULT_MIN_INTERVAL)) return null;
      return invalidResult(
        [`Minimum interval not met (${fmtDays(prev.interval)}, ${required(fmtDays(prev.interval), fmtDays(MENACWY_HR_ADULT_MIN_INTERVAL))}) [c].`],   // P53 (review v10); C11
        `Interval: ${fmtDays(prev.interval)}. Minimum: ${fmtDays(MENACWY_HR_ADULT_MIN_INTERVAL)}.`,
        // C11: ACIP's sentence, for every age (CDC's child notes stop at 18).
        [cite('acip2020Acwy8WeekMinimum')],
      );
    },
  },
  {
    id: 'ACWY-HIGHRISK-BOOSTER-GAP',
    inventory: 'A5',
    what: 'A MenACWY high-risk booster sooner than 3 years (primary finished before 7, or age unknown) or 5 years (from 7, and every later booster)',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'medical high-risk only (asplenia, complement, HIV, complement inhibitor)',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020 Tables 4–6; owner, STOP C C9 (2026-11-15)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['boosterBeforeAge7', 'boosterAtOrAfterAge7'],
      note: 'ACIP gives booster timing as a schedule ("at 3 yrs … every 5 yrs"), not as a minimum; CDC\'s software (CDSI) treats 3 or 5 years less 4 days as a hard minimum. Owner, STOP C C9 (2026-11-15): keep the minimums (an earlier booster does not count), and time the repeat from the early booster (Ruling D).',
    },
    label: 'Not counted — repeat',
    // The shared check (acwyBoosterTooSoon, above) is also the travel row's.
    check: (ctx) => (acwy(ctx).isHighRiskNow ? acwyBoosterTooSoon(ctx, 'high-risk patients') : null),
  },
  {
    id: 'ACWY-TRAVEL-BOOSTER-GAP',
    inventory: 'A5 (travel)',
    what: 'A MenACWY booster for travel, a microbiologist, an A/C/W/Y outbreak or a military recruit (16+), sooner than 3 or 5 years',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'travel, microbiologist, A/C/W/Y outbreak, military recruit from 16 (not the routine 16-year booster)',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020 Tables 7, 8, 9, 10; owner, STOP C C10 (2026-11-15) and D6 (2026-11-17)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['boosterBeforeAge7', 'boosterAtOrAfterAge7', 'acip2020Table9TravelBooster', 'acip2020Table7MicrobiologistBooster', 'acip2020MilitaryBooster5Years'],
      note: 'ACIP\'s travel, microbiologist and outbreak tables give the same 3- and 5-year booster timing as for medical risk (read live 2026-11-16), and the card advises it. Before C10 the record checked no booster gap here at all. Owner answer C10: checked like a medical high-risk booster (a floor, less the 4-day grace, as CDC\'s software does), the same as C9. Owner answer D6 (2026-11-17): military recruits the same, from 16 (Table 10: "Every 5 yrs on basis of assignment"; CDC\'s software also floors it).',
    },
    label: 'Not counted — repeat',
    check: (ctx) => {
      const a = acwy(ctx);
      if (!a.otherBoosterScheduleNow) return null;
      // The routine 16-year booster is its own ACIP rule and comes first (the
      // card asks for it before any travel, lab or outbreak booster; relation
      // 1a, 2026-09-19; travel and lab since Port Phase 5, owner 2026-11-18):
      // judged by the 8-week minimum, not by this floor. Twin of recommend.js
      // routineSixteenBoosterOwed.
      if (acwyIsRoutineBooster(ctx)) return null;
      // D6: a military booster is a dose given at 16 or older; an earlier dose
      // was a routine one (owner B-4) and the routine rows judge it.
      if (a.militaryBoosterNow && (ctx.ageAtDose === null
        || !ageMeetsMinimum(ctx.ageAtDose, AGE_16Y_MONTHS, ctx.whenGiven))) return null;
      return acwyBoosterTooSoon(ctx, a.travelOrLabNow
        ? 'travel or laboratory exposure'
        : a.militaryBoosterNow
          ? 'military recruits'
          : 'an outbreak');
    },
  },
  {
    id: 'ACWY-ROUTINE-BOOSTER-GAP',
    inventory: 'N5',
    what: 'The routine 16-year MenACWY booster under 8 weeks after dose 1',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'routine (no ongoing risk, not on the infant series, not an outbreak contact)',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020 (acwyBooster8WeeksAfterDose1); owner ruling 2026-11-15',
    sourcesSay: {
      verdict: 'stated',
      refs: ['acwyBooster8WeeksAfterDose1', 'cdcCatchupAcwyBooster8Weeks'],
      note: 'ACIP and CDC state 8 weeks as a minimum in words ("a minimum interval of 8 weeks"; "minimum interval: 8 weeks"). Owner ruling 2026-11-15.',
    },
    label: 'Not counted — repeat',
    // N5: only for the dose that would BE the booster — the second counted
    // dose, given at 16 or older, after a dose 1 given before 16. ACIP 2020:
    // "the booster dose can be administered at any time, as long as a minimum
    // interval of 8 weeks between doses is maintained." The card waits the same
    // 8 weeks (recommend.js routineBoosterTiming). Before the 4-week row below
    // so the reason names the rule that applies.
    check: (ctx) => {
      const prev = prevDated(ctx);
      if (!prev || !acwy(ctx).routineOnly || ctx.effectiveIdx !== 1) return null;
      if (ctx.ageAtDose === null || !ageMeetsMinimum(ctx.ageAtDose, AGE_16Y_MONTHS, ctx.whenGiven)) return null;
      if (intervalMeetsMinimum(prev.interval, MENACWY_ROUTINE_BOOSTER_MIN_GAP)) return null;
      const { ageMonths, today, dob } = ctx;
      // Which rule applies is read from the COUNTED dose 1; the gap is from
      // the last dose given (Ruling D), which is dose 1 unless a dose failed.
      const d1 = keptDated(ctx)[0];
      if (!d1) return null;
      const d1Age = ageAtDoseFromDate(d1, ageMonths, today, dob);
      const d1Before16 = d1Age != null && !ageMeetsMinimum(d1Age, AGE_16Y_MONTHS, { doseDate: d1.date, ageMonths, today, dob });
      if (!d1Before16) return null;
      return invalidResult(
        [prev.dose === d1
          ? `Minimum interval not met (${fmtDays(prev.interval)}, ${required(fmtDays(prev.interval), fmtDays(MENACWY_ROUTINE_BOOSTER_MIN_GAP))}) [c].`
          : `Given ${fmtDays(prev.interval)} after an invalid dose, ${fmtDays(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} required [c].`],   // P53/P60 (review v10)
        `Interval: ${fmtDays(prev.interval)}. Minimum: ${fmtDays(MENACWY_ROUTINE_BOOSTER_MIN_GAP)}.`,
        [cite('acwyBooster8WeeksAfterDose1')],
      );
    },
  },
  {
    id: 'ACWY-ANY-TWO-DOSES-GAP',
    inventory: 'A6',
    what: 'Any two MenACWY doses under 8 weeks apart (also after a too-young first dose)',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'any',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020 (8 weeks between MenACWY doses); CDC Timing and Spacing (repeat spaced from the invalid dose by the minimum interval); owner STOP C C11 (2026-11-15) and D5 (2026-11-17)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['acip2020Acwy8WeekMinimum', 'acwyBooster8WeeksAfterDose1', 'gbpRepeatSpacedFromInvalidDose', 'gbpTooYoungFirstDoseRepeat'],
      note: 'ACIP and CDC state 8 weeks between MenACWY doses; owner answer C11 (2026-11-15) made it the minimum between any two (it was 4 weeks, which ACIP says only of MenB — finding R-4a). Owner answer D5 (2026-11-17) applies the same 8 weeks to the repeat of a too-young FIRST dose (E1 had said 4 weeks — MenB\'s number, carried over when E1 was asked for both families; CDC: "The repeat dose should be spaced after the invalid dose by the recommended minimum interval"). CDC also says a too-young first dose is repeated "on or after the date when the child reaches at least the minimum age" — the app waits the 8 weeks as well: a deliberate difference.',
    },
    label: 'Not counted — repeat',
    // Catches two doses days apart (Task 3). The stricter rows above handle
    // the cases they name.
    check: (ctx) => {
      // prevGiven, not prevDated: also the repeat of a dose 1 that did not
      // count (owner, E1, 2026-11-15).
      const prev = prevGiven(ctx);
      if (!prev) return null;
      // D5 (owner, 2026-11-17): with no dose counted yet, the dose before this
      // one did not count because it was given too young — its repeat waits
      // MenACWY's own 8 weeks after it (E1's 4 weeks was MenB's number).
      const afterTooYoungDose1 = ctx.effectiveIdx === 0;
      const floor = MENACWY_BASELINE_MIN_INTERVAL;
      if (intervalMeetsMinimum(prev.interval, floor)) return null;
      if (afterTooYoungDose1) {
        return invalidResult(
          [`Given ${fmtDays(prev.interval)} after an invalid dose, ${fmtDays(floor)} required [c].`],   // P60 (review v10)
          `Interval: ${fmtDays(prev.interval)}. Minimum: ${fmtDays(floor)}.`,
          [cite('gbpRepeatSpacedFromInvalidDose')],
        );
      }
      return invalidResult(
        [`Minimum interval not met (${fmtDays(prev.interval)}, ${required(fmtDays(prev.interval), fmtDays(floor))}) [c].`],   // P53 sibling (review v10)
        `Interval: ${fmtDays(prev.interval)}. Minimum: ${fmtDays(floor)}.`,
        [cite('acip2020Acwy8WeekMinimum')],
      );
    },
  },
  {
    id: 'ACWY-ROUTINE-DOSE-2-BEFORE-16',
    inventory: 'A9',
    what: 'The second counted routine MenACWY dose given before 16',
    vaccine: 'MenACWY',
    dated: true,
    schedule: 'routine (no ongoing risk, not on the infant series, not an outbreak contact)',
    measuredFrom: 'birth',
    enforcement: 'set-aside',
    grace: true,
    authorityToday: 'ACIP 2020 (acwyRoutine1112and16)',
    sourcesSay: {
      verdict: 'stated',
      refs: ['acwyRoutine1112and16'],
      note: 'ACIP gives the booster "at age 16 years"; the app sets aside a second routine dose given before 16. CDC\'s software agrees (16 years less 4 days).',
    },
    label: 'Not counted — given before age 16',
    // Change 3 (2026-07-24): the routine booster is an AGE window, not just an
    // interval from dose 1. A dose after the primary dose counted, but before
    // 16, is safe but isn't the booster, and must not render "Dose 2 of 1".
    // https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm
    check: (ctx) => {
      if (!acwy(ctx).routineOnly || ctx.effectiveIdx !== 1 || !before(ctx, AGE_16Y_MONTHS)) return null;
      return {
        ...setAsideResult(
          [`Given at ${aboutAgeAt(ctx.ageAtDose, ctx.ageAtDoseDays)}. The routine booster is still due at 16, at least 8 weeks after this dose. [c]`],
          [cite('acwyRoutine1112and16')],
          16,
        ),
        whys: [ACWY_BEFORE_16_SAFE_WHY],
      };
    },
  },

  // ── MenB, a dose with no date ──────────────────────────────────────────
  {
    id: 'MENB-UNDATED-BELOW-10',
    inventory: 'B1',
    what: 'MenB with no date, patient under 10 today',
    vaccine: 'MenB',
    dated: false,
    schedule: 'any',
    measuredFrom: 'today',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'CDC (menbLicensedAge1025)',
    sourcesSay: {
      verdict: 'stated',
      refs: ['cdcChildMenbMinAge'],
      note: 'CDC states MenB\'s minimum age as 10 years; the app applies it to an undated dose by reasoning that the dose was given no later than today.',
    },
    label: 'Not counted — repeat',
    // Every MenB product is licensed from 10, so this applies with the brand
    // unknown too.
    check: ({ brand, ageMonths, today, dob }) => {
      const minAgeM = brandMinAgeM(brand) ?? MIN_AGE_MENB_PERMISSIVE_MONTHS;
      if (ageMeetsMinimum(ageMonths, minAgeM, { doseDate: today, ageMonths, today, dob })) return null;
      const label = brandLabelOf(brand, 'MenB');
      return {
        ...invalidResult(
          [`Recorded without a date. The patient is ${aboutAgeAt(ageMonths)} today, below the ${fmtMinAgeAdj(minAgeM)} minimum age for ${label}, so the dose was given too young. [c]`],
          `Current age (upper bound on age at administration): ${aboutAgeAt(ageMonths)}. Minimum: ${fmtMinAge(minAgeM)}.`,
          [cite('menbLicensedAge1025')]
        ),
      };
    },
  },
  {
    id: 'MENB-UNDATED-HEALTHY-UNDER-16',
    inventory: 'B2',
    what: 'MenB with no date, no MenB risk, patient under 16 today',
    vaccine: 'MenB',
    dated: false,
    schedule: 'healthy (shared decision)',
    measuredFrom: 'today',
    enforcement: 'set-aside',
    grace: true,
    authorityToday: 'CDC (menbHealthyPreferredAge1618)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['menbHealthyPreferredAge1618'],
      note: 'CDC gives 16–23 years (preferred 16–18) as when a healthy person is vaccinated; it does not say a dose at 10–15 does not count. Setting it aside is the owner\'s decision (2026-07-23, Option 1), applied here to an undated dose.',
    },
    label: 'Not counted — given before age 16',
    // P0-1: a past undated dose was necessarily given before 16. If the
    // patient is 16 or older today, the app cannot tell, and it counts.
    check: ({ riskIds, ageMonths, today, dob }) => {
      if (hasMenbRisk(riskIds) || ageMeetsMinimum(ageMonths, MENB_HEALTHY_MIN_AGE_MONTHS, { doseDate: today, ageMonths, today, dob })) return null;
      return {
        ...setAsideResult(
          [`Recorded without a date. The patient is ${aboutAgeAt(ageMonths)} today, so it was given before age 16. The healthy 2-dose MenB series is given at 16–23 years by shared clinical decision-making [c].`],
          [cite('menbHealthyPreferredAge1618')],
          16,
        ),
        whys: [MENB_WANES_BEFORE_16_WHY],
      };
    },
  },
  {
    id: 'MENB-UNDATED-NOT-COUNTED',
    inventory: 'B1–B2 (else)',
    what: 'MenB with no date, nothing else wrong',
    vaccine: 'MenB',
    dated: false,
    schedule: 'any',
    measuredFrom: 'the record',
    enforcement: 'record-problem',
    grace: null,
    authorityToday: 'ACIP General Best Practice (only written, dated records count); owner, STOP C C1',
    sourcesSay: {
      verdict: 'stated',
      refs: ['gbpWrittenDatedRecords', 'gbpRecordsNotFoundSusceptible'],
      note: 'ACIP\'s general guidance (read live 2026-11-16) accepts only written, dated records, except influenza and PPSV23. Owner, STOP C C1 (2026-11-15): an undated dose does not count, and the card schedules as if it were not given.',
    },
    label: 'No date recorded — not counted',
    check: () => undatedNotCounted(),
  },

  // ── MenB, a dated dose ─────────────────────────────────────────────────
  {
    id: 'MENB-BELOW-MIN-AGE',
    inventory: 'B3',
    what: 'MenB given below 10 years',
    vaccine: 'MenB',
    dated: true,
    schedule: 'any',
    measuredFrom: 'birth',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'CDC (menbLicensedAge1025)',
    sourcesSay: {
      verdict: 'stated',
      refs: ['cdcChildMenbMinAge', 'menbLicensedAge1025'],
      note: 'CDC states MenB\'s minimum age as 10 years. The app voids a dose below it.',
    },
    label: 'Not counted — repeat',
    // Penbraya/Penmenvy are in ALL_BRANDS with minAgeM=120 too.
    check: (ctx) => {
      const minAgeM = brandMinAgeM(ctx.brand) ?? MIN_AGE_MENB_PERMISSIVE_MONTHS;
      if (ctx.ageAtDose === null || ageMeetsMinimum(ctx.ageAtDose, minAgeM, ctx.whenGiven)) return null;
      // G1-b (owner, STOP G1, 2026-11-18): the line keeps the reason; the
      // background sentence goes behind the dose's "Why this" (`whys`). Its
      // source number stays on the line, on the sentence it supports.
      return {
        ...invalidResult(
          [`Minimum age not met (${fmtMonths(minAgeM)} for ${brandLabelOf(ctx.brand, 'MenB')}). [c]`],   // P61 (review v10)
          `Age at administration: ${aboutAgeAt(ctx.ageAtDose)}. Minimum: ${fmtMinAge(minAgeM)}.`,
          [cite('menbLicensedAge1025')]
        ),
      };
    },
  },
  {
    id: 'MENB-HEALTHY-BEFORE-16',
    inventory: 'B4',
    what: 'MenB before 16, for a patient with no MenB risk',
    vaccine: 'MenB',
    dated: true,
    schedule: 'healthy (shared decision)',
    measuredFrom: 'birth',
    enforcement: 'set-aside',
    grace: true,
    authorityToday: 'This app (owner decision 2026-07-23, Option 1), citing CDC (menbHealthyPreferredAge1618)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['menbHealthyPreferredAge1618'],
      note: 'CDC gives 16–23 years (preferred 16–18) as when a healthy person is vaccinated; it does not say a dose at 10–15 does not count, and CDC\'s software would count it (minimum age 10). Setting it aside is the owner\'s decision (2026-07-23, Option 1).',
    },
    label: 'Not counted — given before age 16',
    // The MenB twin of ACWY-ROUTINE-BEFORE-10. High-risk patients legitimately
    // start at 10 and keep counting their doses.
    check: (ctx) => {
      if (hasMenbRisk(ctx.riskIds) || !menbBefore16(ctx)) return null;
      // G1-b: the background sentence goes behind "Why this" (as above).
      return {
        ...setAsideResult(
          // G1-a (packet L1): "recommended" corrected to the cited quote's
          // own words, "on basis of shared clinical decision-making".
          [`Given at ${aboutAgeAt(ctx.ageAtDose)}. The healthy 2-dose MenB series is given at 16–23 years by shared clinical decision-making. [c]`],
          [cite('menbHealthyPreferredAge1618')],
          16,
        ),
        whys: [MENB_WANES_BEFORE_16_WHY],
      };
    },
  },
  // Risk-at-dose ambiguity for MenB: high-risk NOW, dose between 10 and 16.
  // Owner design, 2026-07-23. Three rows, one per answer.
  {
    id: 'MENB-HIGHRISK-BEFORE-16-ASK',
    inventory: 'B5',
    what: 'MenB before 16, patient high-risk now, risk-at-dose question not answered',
    vaccine: 'MenB',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'birth',
    enforcement: 'needs-input',
    grace: true,
    authorityToday: 'This app (owner design 2026-07-23)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['cdcChildMenbMinAge'],
      note: 'The high-risk MenB series starts at 10; the sources do not say what to do with a dose given at 10–15 before the risk began. The owner chose to ask (2026-07-23).',
    },
    label: 'Needs input',
    check: (ctx) => {
      if (!hasMenbRisk(ctx.riskIds) || !menbBefore16(ctx) || ctx.riskAnswer !== undefined) return null;
      return {
        status: 'pending',
        needsInput: true,
        reasons: ['Given before 16 years. It counts toward the high-risk MenB series only if the patient was high-risk then.'],   // P62 sibling (review v10)
        promptDate: ctx.dose.date,
      };
    },
  },
  {
    id: 'MENB-HIGHRISK-BEFORE-16-NO',
    inventory: 'B5',
    what: 'MenB before 16, patient high-risk now, answered "not high-risk then" or "unsure"',
    vaccine: 'MenB',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'birth',
    enforcement: 'set-aside',
    grace: true,
    authorityToday: 'This app (owner design 2026-07-23), citing CDC (menbHealthyPreferredAge1618)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['menbHealthyPreferredAge1618'],
      note: 'Answered "not high-risk then" or "unsure": the dose is treated like a healthy patient\'s dose before 16 and set aside. The owner\'s design (2026-07-23).',
    },
    label: 'Not counted — given before age 16',
    check: (ctx) => {
      if (!hasMenbRisk(ctx.riskIds) || !menbBefore16(ctx)) return null;
      if (ctx.riskAnswer !== 'no' && ctx.riskAnswer !== 'unsure') return null;
      return setAsideResult(
        [`Given at ${aboutAgeAt(ctx.ageAtDose)}, before age 16. ${markedNotHighRisk(ctx.riskAnswer)} [c]`],
        [cite('menbHealthyPreferredAge1618')],
        16,
      );
    },
  },
  {
    id: 'MENB-HIGHRISK-BEFORE-16-YES',
    inventory: 'B5',
    what: 'MenB before 16, patient high-risk now, answered "high-risk then" — judged as a high-risk series dose',
    vaccine: 'MenB',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'birth',
    enforcement: 'counts-with-note',
    grace: true,
    authorityToday: 'This app (owner design 2026-07-23)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['menbHighRisk3DoseSchedule'],
      note: 'Answered "high-risk then": the dose is judged on the high-risk schedule. Asking the question at all is the owner\'s design (2026-07-23).',
    },
    label: 'Dose N of M',
    check: (ctx) => {
      if (!hasMenbRisk(ctx.riskIds) || !menbBefore16(ctx) || ctx.riskAnswer === undefined) return null;
      return { carryNote: `Counted: high-risk at the time (age ${ageNoun(ctx.ageAtDose)}).` };   // P63 (review v10)
    },
  },
  {
    id: 'MENB-WRONG-FAMILY',
    inventory: 'B6',
    what: 'A MenB dose from the other antigen family (4C vs FHbp) than the first counted dose with a known brand',
    vaccine: 'MenB',
    dated: true,
    schedule: 'any',
    measuredFrom: 'first counted branded dose',
    enforcement: 'floor',
    grace: null,
    authorityToday: 'ACIP 2020 (RR-9); immunize.org',
    sourcesSay: {
      verdict: 'stated',
      refs: ['acip2020MenbNotInterchangeable'],
      note: 'ACIP: the MenB vaccines are not interchangeable and the same product must be used for all doses. The app voids a dose from the other family.',
    },
    label: 'Not counted — repeat',
    // Task 4: the family is set by the first KEPT dose with a KNOWN brand —
    // not the raw dose 1, which may be unbranded or dropped. Skipped when
    // either brand is unknown.
    check: (ctx) => {
      if (ctx.effectiveIdx === 0 || !ctx.brand) return null;
      const firstKeptWithBrand = ctx.kept.find((d) => d.brand);
      if (!firstKeptWithBrand) return null;
      const d1Family = menbFamily(firstKeptWithBrand.brand);
      const thisFamily = menbFamily(ctx.brand);
      if (!d1Family || !thisFamily || d1Family === thisFamily) return null;
      // G1-a: answer first; "not interchangeable" goes behind "Why this".
      return wrongFamily({
        establishedFamily: d1Family,
        ...invalidResult(
          [`Not interchangeable with the first MenB dose (${MENB_BRAND_BY_FAMILY[d1Family] ?? `MenB-${d1Family}`}) [c].`],   // P54 (review v10); C11
          undefined,
          [cite('acip2020MenbNotInterchangeable')],
        ),
        // L3 (review v10, owner 2026-11-20): no "Why this": it only repeated the line.
      });
    },
  },
  {
    id: 'MENB-HIGHRISK-DOSE-2-GAP',
    inventory: 'B7',
    what: 'High-risk MenB dose 2 under 4 weeks after dose 1',
    vaccine: 'MenB',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020 (MenB, 4 weeks between any 2 doses); MMWR mm7349a3; owner, STOP C C8 (2026-11-15)',
    sourcesSay: {
      verdict: 'stated',
      refs: ['menbHighRisk3DoseSchedule', 'acip2020MenbRepeat4Weeks'],
      note: 'ACIP gives dose 2 "at 0, 1–2 … months" as a schedule, and its MenB section states "a minimum interval of 4 weeks should be used between any 2 doses" (said of repeats); CDC\'s software has the same 4 weeks less 4 days. Owner, STOP C C8 (2026-11-15): keep the 4-week minimum, relabelled as sourced.',
    },
    label: 'Not counted — repeat',
    check: (ctx) => {
      const prev = prevDated(ctx);
      if (!hasMenbRisk(ctx.riskIds) || ctx.effectiveIdx !== 1 || !prev) return null;
      if (intervalMeetsMinimum(prev.interval, MENB_HR_D2_MIN_INTERVAL)) return null;
      return invalidResult(
        [`Minimum interval not met (${fmtDays(prev.interval)}, ${required(fmtDays(prev.interval), fmtDays(MENB_HR_D2_MIN_INTERVAL))}) [c].`],   // P53 sibling (review v10); C11
        `Interval: ${fmtDays(prev.interval)}. Minimum: ${fmtDays(MENB_HR_D2_MIN_INTERVAL)}.`,
        [cite('acip2020MenbRepeat4Weeks')],
      );
    },
  },
  {
    id: 'MENB-REPEAT-GAP',
    inventory: 'Ruling D (new 2026-11-15)',
    what: 'A MenB dose under 4 weeks after a MenB dose that did not count (too soon, too young, or the other antigen family)',
    vaccine: 'MenB',
    dated: true,
    schedule: 'any',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020 (acip2020MenbRepeat4Weeks, acip2020MenbMixedProductsSelectOne); owner STOP C C2 and E1/E2, 2026-11-15',
    sourcesSay: {
      verdict: 'stated',
      refs: ['acip2020MenbRepeat4Weeks', 'acip2020MenbMixedProductsSelectOne', 'gbpRepeatSpacedFromInvalidDose', 'gbpTooYoungFirstDoseRepeat'],
      note: 'ACIP states 4 weeks between any 2 doses when a MenB dose must be repeated, and that after a mixed-product series the other product\'s dose is invalid. The app voids a dose under 4 weeks after a dose that did not count. One owner-decided difference: CDC repeats a too-young FIRST dose "on or after the date when the child reaches at least the minimum age" (no wait for an inactivated vaccine); the owner chose 4 weeks after it (E1, 2026-11-15), matching PneumoVax.',
    },
    label: 'Not counted — repeat',
    // E2: a wrong-family dose reaches this row through `lastUncounted` (it is
    // kept off `anchor`, so the schedule rows still time the next dose from
    // the established family's doses). Before the dose-3 rows below, which
    // count their dose outright.
    check: (ctx) => {
      const failed = ctx.lastUncounted;
      if (!failed?.date) return null;
      const interval = daysBetween(failed.date, ctx.dose.date);
      if (intervalMeetsMinimum(interval, MENB_REPEAT_MIN)) return null;
      return invalidResult(
        [`Given ${fmtDays(interval)} after an invalid dose (${fmtDate(failed.date)}), ${fmtDays(MENB_REPEAT_MIN)} required [c].`],   // P60 sibling (review v10)
        `Interval: ${fmtDays(interval)}. Minimum: ${fmtDays(MENB_REPEAT_MIN)}.`,
        [cite('acip2020MenbRepeat4Weeks')],
      );
    },
  },
  {
    id: 'MENB-HIGHRISK-EARLY-DOSE-3',
    inventory: 'B9',
    what: 'High-risk MenB dose 3 under 4 months after dose 2 and under 6 months after dose 1, or a repeat under 4 months after the dose 3 that did not count — not counted, repeat',
    vaccine: 'MenB',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP mm7349a3 (with its "unless"); CDSI 4.65; owner M1, M1c (2026-11-20), M1d (2026-11-21), C7, D3',
    sourcesSay: {
      verdict: 'stated',
      refs: ['menbHighRiskEarlyD3Unless', 'gbpRepeatSpacedFromInvalidDose', 'menbHighRiskEarlyD3ExtraDose'],
      note: 'ACIP 2024: a dose 3 given <4 months after dose 2 "should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose". CDC\'s software has the same two lines (4 months less 4 days from the previous dose, or 6 months less 4 days from dose 1). Owner M1 (2026-11-20): follow CDSI, so the dose does not count; CDC\'s schedule notes instead count it and add a 4th dose. Owner M1c: the repeat\'s 4-month line is measured from the dose that did not count. Owner M1d (2026-11-21): the 6-month "unless" decides only the first dose 3; a repeat counts only 4 months after the dose that did not count (CDSI\'s allowable interval would also count it 6 months after dose 1; ACIP does not say so). Both lines take the 4-day grace (C7, D3).',
    },
    label: 'Not counted — repeat',
    // M1 (owner, 2026-11-20). The test is menbHighRiskDose3Early()
    // (seriesTotals.js), the same call the card makes. `prevDated` is the last
    // dose GIVEN (Ruling D): dose 2, or a dose 3 that did not count, so a repeat
    // is held 4 months from that dose (M1c; ACIP "≥4 months after the last dose"),
    // and the 6-month "unless" does not rescue it (M1d, 2026-11-21).
    // Only in a 3-dose series: a dose 2 ≥6 months after dose 1 ends it at two.
    check: (ctx) => {
      if (!hasMenbRisk(ctx.riskIds) || ctx.effectiveIdx !== 2) return null;
      if (menbSeriesInfo({ highRisk: true, doses: ctx.kept }).total !== MENB_HIGHRISK_TOTAL) return null;
      const prev = prevDated(ctx);
      const d1Date = keptDated(ctx)[0]?.date || null;
      if (!prev) return null;
      const isRepeat = prev.dose !== keptDated(ctx)[1];
      if (!menbHighRiskDose3Early(d1Date, prev.dose.date, ctx.dose.date, { isRepeat })) return null;
      const fromWhat = isRepeat ? `the invalid dose (${fmtDate(prev.dose.date)})` : 'dose 2';
      const gapPrev = gapUnder(prev.dose.date, ctx.dose.date, MENB_HR_D3_MIN_MONTHS_FROM_D2);
      const gapD1 = d1Date && !isRepeat ? gapUnder(d1Date, ctx.dose.date, MENB_HIGHRISK_D3_MONTHS_FROM_D1) : null;
      return invalidResult(
        [
          `Minimum interval not met (${gapPrev.text} after ${fromWhat}, ${required(gapPrev.text, fmtMonths(MENB_HR_D3_MIN_MONTHS_FROM_D2))})${gapD1 ? '' : ' [c]'}.`,
          ...(gapD1 ? [`Also under ${fmtMonths(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1 (${gapD1.text}) [c].`] : []),
        ],
        `From ${fromWhat}: ${gapPrev.text} (minimum ${fmtMonths(MENB_HR_D3_MIN_MONTHS_FROM_D2)}).${gapD1 ? ` From dose 1: ${gapD1.text} (minimum ${fmtMonths(MENB_HIGHRISK_D3_MONTHS_FROM_D1)}).` : ''}`,
        [cite('menbHighRiskEarlyD3Unless')],
      );
    },
  },
  {
    id: 'MENB-HIGHRISK-DOSE-3-FROM-DOSE-1',
    inventory: 'B10',
    what: 'High-risk MenB dose 3 under 6 months after dose 1 (but ≥4 months after dose 2)',
    vaccine: 'MenB',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'dose 1',
    enforcement: 'none',
    grace: null,
    authorityToday: 'Owner, STOP C C5 (no source voids it)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['menbHighRisk3DoseSchedule', 'menbHighRiskEarlyD3Unless'],
      note: 'ACIP gives dose 3 "at … 6 months" as a schedule; no sentence read states 6 months from dose 1 as a minimum, and CDC\'s software sets no minimum from dose 1 (0 days). Owner, STOP C C5 (2026-11-15): a dose 3 already given ≥4 months after dose 2 counts, whatever the gap from dose 1. The FORECAST keeps both lines (recommend.js: ≥6 months from dose 1 and ≥4 from dose 2).',
    },
    label: 'Dose N of M',
    // Never voids a dose since C5. Kept as a row so the rule's absence is
    // visible, with the reason, rather than silent (doseRules.js header).
    check: null,
  },
  {
    id: 'MENB-HIGHRISK-BOOSTER-GAP',
    inventory: 'B12',
    what: 'A high-risk MenB booster sooner than 1 year (first) or 2 years (later), counted in days',
    vaccine: 'MenB',
    dated: true,
    schedule: 'high-risk',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020; owner, STOP C C9 (2026-11-15)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['acip2020MenbBoosterCadence'],
      note: 'ACIP gives boosters "1 year after primary series completion, then every 2–3 years" as a schedule, not as a minimum; CDC\'s software treats 1 and 2 years less 4 days as minimums. Owner, STOP C C9 (2026-11-15): keep the minimums (an earlier booster does not count), and time the repeat from the early booster (Ruling D).',
    },
    label: 'Not counted — repeat',
    // Only too-soon is flagged; a late booster is ordinary catch-up.
    check: (ctx) => {
      const prev = prevDated(ctx);
      if (!hasMenbRisk(ctx.riskIds) || ctx.effectiveIdx < 3 || !prev) return null;
      const hrTotal = menbSeriesInfo({ highRisk: true, doses: ctx.kept }).total;
      if (ctx.effectiveIdx < hrTotal) return null;
      const isFirstBooster = ctx.effectiveIdx === hrTotal;
      const minInterval = isFirstBooster ? MENB_HR_FIRST_BOOSTER_MIN : MENB_HR_SUBSEQUENT_BOOSTER_MIN;
      const minLabel = fmtMonths((isFirstBooster ? MENB_HIGHRISK_FIRST_BOOSTER_YEARS : MENB_HIGHRISK_BOOSTER_CADENCE_YEARS) * 12);
      if (intervalMeetsMinimum(prev.interval, minInterval)) return null;
      const minYears = isFirstBooster ? MENB_HIGHRISK_FIRST_BOOSTER_YEARS : MENB_HIGHRISK_BOOSTER_CADENCE_YEARS;
      const gap = gapUnder(prev.dose.date, ctx.dose.date, minYears * 12);
      const r = invalidResult(
        [`Booster ${gap.text} after the ${isFirstBooster ? 'series' : 'last booster'}, ${required(gap.text, minLabel)} [c].`],   // P57 (review v10); C11
        `Interval: ${gap.text}. Minimum: ${gap.exact ? fmtMonths(minYears * 12) : fmtDays(minInterval)}.`,
        [cite('acip2020MenbBoosterCadence')],
      );
      return tooSoonBooster(isFirstBooster ? r : { ...r, whys: [MENB_HR_BOOSTER_CADENCE_WHY] });
    },
  },
  {
    id: 'MENB-HEALTHY-DOSE-2-GAP',
    inventory: 'R-4c (new 2026-11-15)',
    what: 'Healthy MenB dose 2 under 4 weeks after dose 1',
    vaccine: 'MenB',
    dated: true,
    schedule: 'healthy (shared decision)',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'ACIP 2020 (acip2020MenbRepeat4Weeks); CDSI; owner STOP C C12, 2026-11-15',
    sourcesSay: {
      verdict: 'stated',
      refs: ['acip2020MenbRepeat4Weeks'],
      note: 'Owner answer C12: a healthy dose 2 under 4 weeks does not count; 4 weeks to 6 months counts with the rescue dose 3. ACIP states 4 weeks between any 2 MenB doses where a dose is repeated; CDC\'s software (CDSI) sets 4 weeks less 4 days for dose 2 in both families.',
    },
    label: 'Not counted — repeat',
    // Before MENB-HEALTHY-EARLY-DOSE-2, which counts every dose 2 it sees.
    check: (ctx) => {
      const prev = prevDated(ctx);
      if (hasMenbRisk(ctx.riskIds) || ctx.effectiveIdx !== 1 || !prev) return null;
      if (intervalMeetsMinimum(prev.interval, MENB_REPEAT_MIN)) return null;
      return invalidResult(
        [`Minimum interval not met (${fmtDays(prev.interval)}, ${required(fmtDays(prev.interval), fmtDays(MENB_REPEAT_MIN))}) [c].`],   // P53 sibling (review v10)
        `Interval: ${fmtDays(prev.interval)}. Minimum: ${fmtDays(MENB_REPEAT_MIN)}.`,
        [cite('acip2020MenbRepeat4Weeks')],
      );
    },
  },
  {
    id: 'MENB-HEALTHY-EARLY-DOSE-2',
    inventory: 'B13',
    what: 'Healthy MenB dose 2 under 6 months after dose 1 — counts, and a dose 3 is owed',
    vaccine: 'MenB',
    dated: true,
    schedule: 'healthy (shared decision)',
    measuredFrom: 'dose 1',
    enforcement: 'counts-with-note',
    grace: true,
    authorityToday: 'CDC notes; immunize.org; owner, STOP C C7 (the 4-day grace)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: ['menbRescueDoseRule', 'menbBexseroOldCourseStands'],
      note: 'The rescue rule is stated and the app follows it: a dose 2 under 6 months counts and a dose 3 is owed at least 4 months later. The three differences found at port 2.3 are now owner-decided (STOP C, 2026-11-15): C12 a lower limit (dose 2 under 4 weeks does not count, row MENB-HEALTHY-DOSE-2-GAP); C7 the 4-day grace at the 6-month line, as CDC\'s software does; C3 a Bexsero 0 + 1 month course given before 24 October 2024 still gets the rescue dose 3 (current schedule for everyone), a deliberate difference from ACIP mm7349a3.',
    },
    label: 'Dose N of M',
    // STOP C C7 (owner, 2026-11-15): the 4-day grace APPLIES at this line
    // (one dose fewer). The test is menbHealthyDose2Early() (seriesTotals.js),
    // shared with the series total and the card. The lower limit is the
    // separate row MENB-HEALTHY-DOSE-2-GAP (C12, family 1).
    check: (ctx) => {
      // The 6-month line is from the COUNTED dose 1 — a series-length
      // question, not a repeat clock (Ruling D moves only the latter).
      const d1 = keptDated(ctx)[0];
      if (hasMenbRisk(ctx.riskIds) || ctx.effectiveIdx !== 1 || !d1 || !prevDated(ctx)) return null;
      if (!menbHealthyDose2Early(d1.date, ctx.dose.date)) return null;
      return validResult([
        // G1-a (packet L5): the label says it counts; "rescue" was jargon.
        `Given ${gapUnder(d1.date, ctx.dose.date, MENB_HEALTHY_D2_MONTHS).text} after dose 1 (${MENB_HEALTHY_D2_MONTHS} recommended). It counts. Dose 3 is due ≥${MENB_RESCUE_D3_MIN_MONTHS_FROM_D2} months later.`   // P58 (review v10)
      ]);
    },
  },
  {
    id: 'MENB-HEALTHY-RESCUE-DOSE-3-GAP',
    inventory: 'B14',
    what: 'The healthy MenB rescue dose 3 under 4 months after the early dose 2',
    vaccine: 'MenB',
    dated: true,
    schedule: 'healthy (shared decision)',
    measuredFrom: 'last dose given',
    enforcement: 'floor',
    grace: true,
    authorityToday: 'CDC notes',
    sourcesSay: {
      verdict: 'stated',
      refs: ['menbRescueDoseRule', 'gbpRepeatSpacedFromInvalidDose'],
      note: 'ACIP states the rescue dose 3 "≥4 months after the second dose", a minimum in words. The app voids a dose below it.',
    },
    label: 'Not counted — repeat',
    check: (ctx) => {
      if (hasMenbRisk(ctx.riskIds) || ctx.effectiveIdx !== 2) return null;
      const kd = keptDated(ctx);
      const d1Date = kd[0]?.date || null;
      const d2Date = kd[1]?.date || null;
      if (!d1Date || !d2Date) return null;
      // Only a rescue dose if dose 2 was early — the same shared test as
      // MENB-HEALTHY-EARLY-DOSE-2 (4-day grace included, STOP C C7).
      if (!menbHealthyDose2Early(d1Date, d2Date)) return null;
      // Ruling D: from the last dose given — dose 2, or a rescue dose 3 that
      // itself came too soon.
      const from = prevDated(ctx)?.dose?.date ?? d2Date;
      if (calendarIntervalMeetsMinimum(from, MENB_RESCUE_D3_MIN_MONTHS_FROM_D2, ctx.dose.date)) return null;
      const gap = gapUnder(from, ctx.dose.date, MENB_RESCUE_D3_MIN_MONTHS_FROM_D2);
      return invalidResult(
        [from === d2Date
          ? `Minimum interval not met (${gap.text}, ${required(gap.text, fmtMonths(MENB_RESCUE_D3_MIN_MONTHS_FROM_D2))}) [c].`
          : `Given ${gap.text} after an invalid dose, ${fmtMonths(MENB_RESCUE_D3_MIN_MONTHS_FROM_D2)} required [c].`],   // P53/P60 siblings (review v10); C11
        `${from === d2Date ? 'D2' : 'Previous dose'}→D3: ${gap.text} (${gap.exact ? `minimum ${fmtMonths(MENB_RESCUE_D3_MIN_MONTHS_FROM_D2)}` : `min ${fmtDays(MENB_RESCUE_D3_MIN_FROM_D2)}`}).`,
        // C11: the rescue rule from dose 2; after an invalid dose, CDC's spacing
        // sentence, as the MenACWY 8-week row does.
        [cite(from === d2Date ? 'menbRescueDoseRule' : 'gbpRepeatSpacedFromInvalidDose')],
      );
    },
  },

  // ── Applied by the walk in validate.js, after the verdict ──────────────
  {
    id: 'SERIES-CAP-EXTRA-DOSE',
    inventory: 'W3',
    what: 'A counted dose past the series total, on a schedule with no booster phase (routine MenACWY, single-dose indications, healthy MenB)',
    vaccine: 'any',
    schedule: 'routine MenACWY, single-dose MenACWY indications, healthy MenB',
    measuredFrom: 'the series total',
    enforcement: 'extra',
    grace: null,
    authorityToday: 'This app (F2/F3); owner, STOP C C18 (2026-11-15)',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: [],
      note: 'The sources give each series\' size; calling a dose past it "Extra" is the app\'s own rule. Owner, STOP C C18 (2026-11-15): keep the rule; its words are Phase 4\'s question Q8, and all wording is eventually to match PneumoVax.',
    },
    label: 'Not counted — Extra. Do not repeat.',
    // runWalk applies this after a dose has been judged to count, because it
    // needs the series total WITH this dose in it (seriesTotals.js). Written
    // here so the table lists every way a dose can be set aside.
    check: null,
  },
  {
    id: 'NOT-ASKED-FOR-EXTRA-DOSE',
    inventory: 'W3b',
    what: 'A dose given on a day when every card for that vaccine asked for nothing (complete, or not indicated), after an earlier counted dose',
    vaccine: 'any',
    schedule: 'any, except college residence (owner Q8 follow-up)',
    measuredFrom: 'the cards on the day of the dose',
    enforcement: 'extra',
    grace: null,
    authorityToday: 'Owner, STOP E1 Q8 (2026-11-17): PneumoVax §C-P1-3',
    sourcesSay: {
      verdict: 'owner-decided',
      refs: [],
      note: 'No source says when a dose nobody asked for counts. The owner chose PneumoVax\'s rule (2026-11-17): Extra when no card that day asked for it; a first dose stays counted; college is left alone, because ACIP times the 5-year cover "since the dose".',
    },
    label: 'Not counted — Extra. Do not repeat.',
    // runWalk applies this (validate.js `notAskedFor`), because it needs the
    // cards recommend() gave on the dose day. Written here so the table lists
    // every way a dose can be set aside.
    check: null,
  },
];

const RULE_BY_ID = new Map(DOSE_RULES.map((r) => [r.id, r]));
export const doseRule = (id) => RULE_BY_ID.get(id) ?? null;

/**
 * Judge one dose by walking the table. Returns the verdict and the id of the
 * row that decided it (null when no row decided and the dose simply counts —
 * the carried notes, if any, become its reasons).
 */
export function judgeDose(ctx) {
  const notes = [];
  const carriedBy = [];
  for (const rule of DOSE_RULES) {
    if (!rule.check) continue;
    if (rule.vaccine !== 'any' && rule.vaccine !== ctx.vaccine) continue;
    if (rule.dated !== undefined && rule.dated !== ctx.dated) continue;
    const out = rule.check(ctx);
    if (!out) continue;
    if (out.carryNote) {
      notes.push(out.carryNote);
      carriedBy.push(rule.id);
      continue;
    }
    return { result: out, ruleId: rule.id };
  }
  if (ctx.vaccine !== 'MenACWY' && ctx.vaccine !== 'MenB') {
    return { result: unknownResult([`Unknown vaccine: ${ctx.vaccine}`]), ruleId: null };
  }
  return { result: validResult(notes), ruleId: carriedBy[0] ?? null };
}
