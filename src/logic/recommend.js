// ─────────────────────────────────────────────────────────────────────────
// recommend.js — the MeningoVax recommendation engine.
//
// Pure function. Given a patient (age, risks, MenACWY history, MenB history),
// returns the current MenACWY and MenB recommendations with citations, plus a
// pentavalent (MenABCWY) offer when both antigens are due at the same visit.
//
// Every clinical rule here is traceable to a citation key in src/data/refs.js.
// Verified against ACIP 2020 MMWR (RR-9), CDC adult & child schedule notes, the
// 2023 Pfizer and 2025 GSK pentavalent MMWRs, and CDC complement-inhibitor
// guidance. See src/data/refs.js.
//
// Design rule (ported from vaxapp): brand validity and the MenB antigen-family
// lock are computed HERE and downstream surfaces consume the pre-filtered
// brand strings. Do not re-derive brand eligibility in the UI.
// ─────────────────────────────────────────────────────────────────────────

import { foldResult } from './noteFold.js';
import { resolveRefs, cite } from '../data/refs.js';
import {
  menacwyRiskClass,
  menacwyInfantSeriesIndicated,
  hasMenbRisk,
  shouldDeferMenB,
  hasExclusion,
  ageImplausibleRisks,
  RISK_BY_ID,
} from '../data/riskFactors.js';
import {
  menbFamily, menacwyBrandLabelsForAge, MENACWY_INFANT_SERIES_BRANDS,
  MENACWY_LICENCE_MIN_AGE_DAYS, MENB_MIN_AGE_MONTHS, PENTAVALENT_MIN_AGE_MONTHS,
} from '../data/brands.js';
// P2-3 (2026-09-17): the age thresholds used to live in a local `M` map here,
// with validate.js and seriesTotals.js each keeping their own copies of the
// same numbers. ages.js is their single home; see its header for why 192 gets
// two names rather than one.
//
// M2 (2026-09-22): MENACWY_MIN_AGE_MONTHS used to come from brands.js and
// meant two things that happened to be equal — the youngest a product may be
// GIVEN, and the youngest age the app ASKS for a dose. MenQuadfi's 6-week
// licence floor split them; every use below wanted the second one, so they
// now import MENACWY_SCHEDULE_MIN_AGE_MONTHS from here instead. The value is
// unchanged (2 months) — CDC's earliest schedule row is still 2 months
// regardless of which product a family chooses.
import {
  MENACWY_INFANT_SERIES_MAX_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS, MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS,
  MENACWY_ROUTINE_DOSE1_AGE_MONTHS, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS,
  MENACWY_CATCHUP_MIN_AGE_MONTHS, MENACWY_CATCHUP_MAX_AGE_MONTHS,
  MENACWY_BOOSTER_AGE_SPLIT_MONTHS, MENACWY_SCHEDULE_MIN_AGE_MONTHS, MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS,
  MENB_HEALTHY_MIN_AGE_MONTHS, MENB_HEALTHY_MAX_AGE_MONTHS, ageYears,
} from './ages.js';
// impossible P1-2: the note prints the patient's age in the same words the
// results header uses, so the two cannot disagree. format.js imports only
// dateUtils, so there is no cycle back into the engine.
import { fmtAgeMonths, fmtDate } from './format.js';
import { todayISO, addDays, addCalendarMonths, addCalendarYears, calendarIntervalElapsed, daysBetween, calendarMonthsBetween, intervalElapsed, DAYS } from './dateUtils.js';
// Calendar P1-3: one rule for how old the patient is — the date of birth wins
// over a stored ageMonths, which is only ever a snapshot of it.
import { patientAgeMonths, ageAtDoseMonths } from './patientAge.js';
import { analyzeHistory } from './validate.js';
import { DO_NOT_RESTART } from './doseRules.js';
import { creditPentavalents } from './pentavalentCredit.js';

// An excluded patient (transplant / CAR-T / B-cell depletion hard stop) gets no
// history walk,
// but callers read `result.history` unconditionally — give them the empty shape.
const EMPTY_HISTORY = Object.freeze({
  MenACWY: { perDose: [], effective: [], sortedDoses: [] },
  MenB: { perDose: [], effective: [], sortedDoses: [] },
});
import {
  menacwySeriesInfo, menbSeriesInfo, menacwyInfantHighRiskTotal, menacwyOn3DoseShortcut, menacwyInfantD2AgeForSeries,
  menbHealthyDose2Early,
  MENACWY_HIGHRISK_PRIMARY_TOTAL, MENACWY_SINGLE_TOTAL, MENB_HIGHRISK_TOTAL,
  MENACWY_ROUTINE_PRIMARY_TOTAL,
} from './seriesTotals.js';
// P0-1 (2026-09-17): the infant primary intervals used to be hand-typed here as
// DAYS.weeks(4) — and again, separately, as the English "≥4 weeks" inside the
// card text. Both were wrong. They now come from one module, and the sentences
// interpolate the number rather than restating it.
import {
  menacwyInfantNextDoseGate, weeksLabel, yearsLabel, earliestGatedDate, ageMeetsMinimum,
  MENACWY_HIGHRISK_PRIMARY_GAP,
  MENACWY_FIRST_BOOSTER_YEARS_UNDER_7, MENACWY_FIRST_BOOSTER_YEARS_FROM_7,
  MENACWY_BOOSTER_CADENCE_YEARS, menacwyFirstBoosterYears, menacwyBoosterYears,
  menacwyOutbreakTopUpYears,
  MENACWY_OUTBREAK_TOPUP_YEARS_UNDER_7, MENACWY_OUTBREAK_TOPUP_YEARS_FROM_7,
  MENB_HIGHRISK_FIRST_BOOSTER_YEARS, MENB_HIGHRISK_BOOSTER_CADENCE_LABEL,
  menbHighRiskBoosterYears,
  MENB_HIGHRISK_D2_GAP, MENB_HIGHRISK_D3_MONTHS_FROM_D1,
  MENB_HIGHRISK_D3_MONTHS_FROM_D2,
  MENB_HEALTHY_D2_MONTHS, MENB_HEALTHY_RESCUE_MONTHS, monthsLabel,
  MENACWY_INFANT_FINAL_GAP, MENACWY_ROUTINE_BOOSTER_MIN_GAP,
  MENACWY_ANY_TWO_DOSES_MIN_GAP, MENB_REPEAT_MIN_INTERVAL,
  MENB_HIGHRISK_D2_ROUTINE_MONTHS, MENACWY_INFANT_ROUTINE_AGE_MONTHS, minimumBesideRoutine,
} from './intervals.js';
import { MENACWY_COLLEGE_COVER_YEARS, PENTAVALENT_REPEAT_MONTHS, menacwyGraceLine } from './intervals.js';
import { MENACWY_INFANT_FINAL_MIN_AGE_MONTHS, MENACWY_ROUTINE_CATCHUP_MIN_AGE_MONTHS } from './ages.js';

// ── brand option builders ─────────────────────────────────────────────────
// D7: Menveo 2-vial (≥2 months) vs Menveo 1-vial (≥10 years) — distinct
// formulations. Both are valid per ACIP at ≥10y; only the 2-vial is licensed
// below 10y, and MenQuadfi from 2 years.
//
// P2-3 (2026-09-17): those three ages used to be written out here as a second
// copy of `minAgeM` in brands.js — three hard-coded lists behind two hard-coded
// age tests, which agreed with the product table only because nobody had
// changed either. The lists are now derived from the table itself, so adding a
// product or correcting its licensed age cannot leave this function behind.
const menacwyBrands = (am) => menacwyBrandLabelsForAge(am);

// F-5 (owner, STOP G1, 2026-11-18): ONE label for the routine 16-year MenACWY
// booster, before it is due and when it is due. It was "Booster due at 16y"
// before (1,452 cards) and "Booster (16y)" from 16 (306 cards): same dose, two
// labels. The shorter form matches the app's other booster labels.
const ROUTINE_16Y_BOOSTER_LABEL = 'Booster (16y)';

// MenB brand options given the established family (from dose 1) and dose number.
// Pentavalents are NOT included here — they are surfaced only via the dedicated
// pentavalent card in the public recommend() API.
function menbBrands(family) {
  if (family === '4C') return ['Bexsero (MenB)'];
  if (family === 'FHbp') return ['Trumenba (MenB)'];
  // No family established yet — both families open
  return ['Bexsero (MenB)', 'Trumenba (MenB)'];
}

function rec(o) {
  return {
    vaccine: o.vaccine,
    status: o.status,          // due | catchup | risk-based | exposure | shared-decision | complete | not-indicated | deferred
    // STOP E1 Q8: a "not indicated" card that asks for a dose later ("Not yet
    // due", "Not yet age-eligible"). Only those cards carry it. validate.js
    // reads it so a dose given on such a day is not called Extra.
    ...(o.asksLater ? { asksLater: true } : {}),
    // Port Phase 6.2 R-A/R-B/R-C (owner, STOP G1, 2026-11-18): the ending a
    // "Not counted — repeat" line takes under this card, which asks later but
    // prints no date. `{ line, dropRepeat }`; read by datedRepeatLines().
    ...(o.repeatLater ? { repeatLater: o.repeatLater } : {}),
    // Owner F2a (2026-11-18): not due yet, but the minimum interval has passed,
    // so the card says "It can be given today if needed". Only MenB high-risk
    // dose 2 carries it (the one MenB place the routine date and the minimum
    // differ, STOP F1). Only the pentavalent offer reads it: the badge stays
    // "Next dose not yet due" (owner MQ6-f, 2026-11-21: follow the standard
    // schedule when it can be followed; a dose at the minimum still counts).
    ...(o.canGiveToday ? { canGiveToday: true } : {}),
    doseLabel: o.doseLabel,
    doseNum: o.doseNum ?? null,
    seriesTotal: o.seriesTotal ?? null,
    // Where the primary series ends. Defaults to the whole total because on
    // every schedule except routine MenACWY every counted dose is a primary
    // dose (CDC: at-risk MenACWY is "A 2-4-dose primary series"; MenB at-risk
    // is "A 3-dose primary series") -- so only the routine branches pass this.
    primaryTotal: o.primaryTotal ?? o.seriesTotal ?? null,
    dueToday: !!o.dueToday,
    earliestNextDate: o.earliestNextDate ?? null,
    minIntervalDays: o.minIntervalDays ?? null,
    brands: o.brands ?? [],
    family: o.family ?? null,
    // U1 (2026-09-17): a note is `{ lead, detail }`, or null when the card has
    // nothing left to say. `lead` is what the card always shows — what to do
    // for THIS patient, one or two lines. `detail` is the rule the lead is an
    // instance of (eligible ages, brand caveats, why the interval is what it
    // is), and the card puts it behind a "Why this" disclosure.
    //
    // Authored once, as one object. Do NOT write a short note alongside a long
    // one: that is the two-copies drift this whole queue exists to remove.
    // Owner decision 2026-09-17: every note carries both halves, so no card
    // has a "Why this" link its neighbour lacks.
    note: o.note ?? null,
    // C5: [N] markers embedded in `note` that deep-link straight to the
    // exact ACIP MMWR sentence, distinct from the general `citations` chips
    // below (which cite the whole rec, not one sentence within it).
    // U1: still ONE ordered list for the whole note — the `[c]` occurrences in
    // `lead` first, then those in `detail`. Splitting it into two arrays would
    // have made the "one entry per [c]" contract two contracts.
    noteCites: o.noteCites ?? [],
    citations: resolveRefs(o.refs ?? []),
    // B6: set when a "complete" status still has a future booster coming
    // (an approximate ISO date), so the UI can show it prominently instead
    // of reading as a quiet, fully-done state.
    boosterDueDate: o.boosterDueDate ?? null,
    // Calendar P1-3: true when that date is the patient's actual birthday,
    // because a date of birth was entered — as opposed to a date inferred from
    // an age in months, which is 1-3 days out roughly two thirds of the time.
    // The card drops its "~" when this is set: the Age step promised precision
    // in exchange for the date of birth, so when it has one it should stop
    // hedging, and when it does not it still should.
    boosterDueDateExact: o.boosterDueDateExact ?? false,
    // C4: a short structured summary of FUTURE boosters beyond what's due
    // today (count/cadence). null when no further booster is expected.
    boosterSummary: o.boosterSummary ?? null,
    // U2 (2026-09-17): the booster line is now the ONLY place the cadence is
    // stated, so the sources backing it moved here with it. Same ordered
    // "one entry per [c]" contract as noteCites, rendered by the same helper.
    boosterCites: o.boosterCites ?? [],
  };
}

// Age (months) at a past dose.
//
// Calendar P2-2 (2026-09-17): this was one of three hand-written copies of the
// same subtraction, which mixed the patient's month-anniversaries with the dose
// date's and came out up to 2.9 days wrong. patientAge.js now owns the answer
// for every surface, and uses the date of birth to get it exactly whenever
// there is one. See ageAtDoseMonths() there for the full reasoning.
function ageAtDose(dose, am, today, dob) {
  return ageAtDoseMonths(dose, { dob, ageMonths: am }, today);
}

// Whether the patient is CURRENTLY old enough for the routine adolescent
// MenACWY booster (16y) and it is NOT yet satisfied by any recorded dose --
// the one fact that decides whether the routine requirement is a live,
// unmet obligation right now, independent of any other indication.
//
// Both halves matter. Age alone is not enough: menacwyRoutine() itself gates
// on `am < MENACWY_ROUTINE_BOOSTER_AGE_MONTHS` before it ever asks about
// dose history, because a 6- or 12-year-old with an early dose (M12's own
// test fixtures) does not owe a "still due" booster today -- that dose
// pathway is why the first version of this fix (unconditional on age) broke
// regression-m12-outbreak-topup.test.js and regression-p2-3-ages-in-one-
// place.test.js: it told young children with a top-up-satisfied outbreak
// dose that a routine booster was due TODAY, decades early. Dose-history
// alone is not enough either -- see below.
//
// The dose-history half is the same predicate menacwyRoutine() and the
// 'single' branch's own college_dorm rule each already compute inline (not
// touched here, to keep this fix's footprint to the branches that were
// actually wrong).
function routineBoosterCurrentlyUnmet(am, doses, today, dob) {
  if (am < MENACWY_ROUTINE_BOOSTER_AGE_MONTHS) return false;
  return !doses.some((d) => {
    const a = ageAtDose(d, am, today, dob);
    return a != null && ageMeetsMinimum(a, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, {
      doseDate: d.date || null, ageMonths: am, today, dob,
    });
  });
}

// N5 (owner ruling 2026-11-15): when the routine 16-year booster may be given.
// ACIP: "as long as a minimum interval of 8 weeks between doses is maintained"
// (see MENACWY_ROUTINE_BOOSTER_MIN_GAP in intervals.js). One helper for every
// card that asks for this booster — routine, college residence, and the
// military / outbreak "routine booster still owed" cards — so none of them can
// advise a dose the validator would then set aside. `lastDate` is the last
// dose that counted (never an undated one: STOP C C1, those do not count).
function routineBoosterTiming(lastDate, today) {
  if (!lastDate) return { dueToday: true, earliestNextDate: null };
  const elapsed = intervalElapsed(lastDate, MENACWY_ROUTINE_BOOSTER_MIN_GAP, today);
  return {
    dueToday: elapsed,
    earliestNextDate: elapsed ? null : addDays(lastDate, MENACWY_ROUTINE_BOOSTER_MIN_GAP),
  };
}

// Port Phase 5 (owner, 2026-11-18): travel, lab worker and A/C/W/Y outbreak
// patients get the routine 16-year booster too, then their own boosters every
// 5 years from it. ACIP 2020 Table 2 (read live 2026-11-18): "Booster: 1 dose at
// age 16 yrs if first dose administered before 16th birthday", no exception for
// these risks; CDC child notes (July 1, 2025) send a "healthy child who received
// a single dose for travel" to the adolescent schedule. Before this, ticking the
// box pushed that dose back about 5 years (830 saved patients). Asplenia,
// complement and HIV are not routed here (owner: unchanged; ACIP's HIV child
// dosed at 9 gets the next dose at 14).
//
// When is it owed? From 16, whenever no dose at 16 or older counted
// (routineBoosterCurrentlyUnmet, unchanged). Under 16, once a dose given at 10
// or older is on record — the age from which ACIP counts a dose toward the
// adolescent series — dated as the routine card dates it (the 16th birthday,
// or 8 weeks after the last dose if later). null when not owed. The validator's
// twin is doseRules.js acwyIsRoutineBooster (the dose is exempt from the
// 5-year floor and judged by 8 weeks).
function routineSixteenBoosterOwed(am, doses, today, dob, lastDate, { throughCatchup = false } = {}) {
  // Travel, lab and outbreak: only while a healthy peer would still be owed it
  // (catch-up runs through 21; from 22 the routine schedule asks nothing). The
  // outbreak card joined the limit with owner F-6 (2026-11-18): from 22 it
  // offers its own booster ("single dose if ≥5 yrs since vaccination").
  if (throughCatchup && am >= MENACWY_CATCHUP_MAX_AGE_MONTHS) return null;
  if (am >= MENACWY_ROUTINE_BOOSTER_AGE_MONTHS) {
    return routineBoosterCurrentlyUnmet(am, doses, today, dob)
      ? { ...routineBoosterTiming(lastDate, today), boosterDueDate: null } : null;
  }
  const adolescentDose = doses.some((d) => {
    const a = ageAtDose(d, am, today, dob);
    return a != null && a >= MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS;
  });
  if (!adolescentDose) return null;
  return { dueToday: false, ...routineBoosterDueDate(dob, am, today, lastDate) };
}

// The card for that booster, on the travel / lab / outbreak schedules. From 16
// it is the "still owed" card (its note says so) that the military schedule also
// uses; at every age its title is the routine card's, "Booster (16y)" (F-5 and
// its follow-ups, owner 2026-11-18; military too).
function routineSixteenBoosterCard({ owed, am, given, lastDate, indication, boosterSummary, refs }) {
  if (am >= MENACWY_ROUTINE_BOOSTER_AGE_MONTHS) {
    return rec({
      vaccine: 'MenACWY', status: 'exposure', doseLabel: ROUTINE_16Y_BOOSTER_LABEL,
      doseNum: given + 1, seriesTotal: 1, dueToday: owed.dueToday, earliestNextDate: owed.earliestNextDate,
      boosterSummary, brands: menacwyBrands(am),
      note: routineBoosterStillOwedNote(indication, !owed.dueToday),
      noteCites: owed.dueToday ? [] : [cite('acwyBooster8WeeksAfterDose1')],
      refs,
    });
  }
  const waits = lastDate != null && owed.earliestNextDate === addDays(lastDate, MENACWY_ROUTINE_BOOSTER_MIN_GAP);
  return rec({
    vaccine: 'MenACWY', status: 'exposure', doseLabel: ROUTINE_16Y_BOOSTER_LABEL,
    doseNum: given + 1, seriesTotal: 1, dueToday: false,
    earliestNextDate: owed.earliestNextDate, boosterDueDate: owed.boosterDueDate, boosterDueDateExact: owed.boosterDueDateExact,
    boosterSummary, brands: menacwyBrands(am),
    note: {
      lead: `The routine MenACWY booster at 16 comes first [c].${waits
        ? ` It waits ${weeksLabel(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} after the last dose given (${fmtDate(lastDate)}) [c].` : ''}`,
      detail: `The recorded dose was given before 16. ACIP's routine age-16 booster applies whatever the other indications, and the ${indication} boosters then run from that dose.`,
    },
    noteCites: [cite('acwyRoutine1112and16'), ...(waits ? [cite('acwyBooster8WeeksAfterDose1')] : [])],
    refs,
  });
}

// The sentence and source a card adds while it is waiting out those 8 weeks.
const ROUTINE_BOOSTER_WAIT_SENTENCE =
  ` It can be given once ${weeksLabel(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} have passed since that dose [c].`;

// Shared wording for "your occupational/outbreak requirement is met, but the
// separate routine age-16 booster is not" -- found 2026-09-19 (plan item D,
// relation 1a): military and outbreak_acwy each declared the whole MenACWY
// picture "Complete" the moment THEIR OWN requirement was satisfied by any
// prior dose, without checking whether the patient had since turned 16 with
// only pre-16 doses on record -- so a 16-year-old still due their routine
// booster read as fully done the moment military/outbreak_acwy was ticked.
// college_dorm's own rule already got this right, by construction (its OWN
// requirement IS "a dose at >=16"), which is why it alone was never affected.
function routineBoosterStillOwedNote(indicationLabel, waiting = false) {
  return {
    lead: 'The routine MenACWY booster at 16 is still owed — the recorded dose was given before then.'
      + (waiting ? ROUTINE_BOOSTER_WAIT_SENTENCE : ''),
    detail: `The ${indicationLabel} requirement is already met by that dose, but ACIP's routine age-16 `
      + 'booster is a separate rule that applies regardless of other indications. The next dose given '
      + 'will satisfy both at once.',
  };
}

// ── MenACWY ────────────────────────────────────────────────────────────────
function menacwyRec(am, riskIds, doses, today, dob, clockDate = null, repeatFloorDate = null) {
  const given = doses.length;
  const last = doses[given - 1] || null;
  // RULING D (owner, STOP C C2/C9, 2026-11-15): the next dose is timed from
  // the last dose GIVEN — a dose that did not count included — not from the
  // last dose that counted. `clockDate` is validate.js's anchor (read, never
  // recomputed here); dose numbers and totals still come from `doses`, the
  // counted list. CDC: "The repeat dose should be spaced after the invalid
  // dose by the recommended minimum interval."
  const lastDate = clockDate || last?.date || null;
  const riskClass = menacwyRiskClass(riskIds);
  // C5/2026-07-24: ACIP 2020 MMWR (RR-9) is the source-of-truth citation for
  // these risk-based schedules. cdcAdultMening (the CDC adult schedule note)
  // is dropped from the default set — it just restates the same MMWR rule
  // (2026-07-23 owner decision: don't cite two sources for one rule).
  const refsFor = (ids) => collectRefs(riskIds, ids, ['acip2020']);

  // U2 (2026-09-17): one booster line for the whole ≥2y high-risk primary group.
  // It used to read "3-5 years ... (based on completion age)" while the note
  // underneath spelled out which of 3 and 5 applied, with both ACIP quotes
  // attached. The note's sentence is gone, so the line says the specific thing
  // and keeps the sources -- one fact, one place, still cited.
  const MENACWY_HIGHRISK_BOOSTER_LINE =
    `Boosters: ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)} after the series if it ends before 7 years [c], `
    + `otherwise ${MENACWY_FIRST_BOOSTER_YEARS_FROM_7} [c], then every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at risk`;

  // C2/2026-07-24: for the exposure recs (travel/microbiologist/military/
  // college-dorm/ACWY-outbreak), each risk factor now carries its own
  // specific ACIP 2020 MMWR table anchor (riskFactors.js). Using the
  // whole-document `acip2020` default here as well would show two
  // identically-labeled "ACIP 2020 MMWR" chips (the table anchor AND the
  // whole-page link) since collectRefs only dedupes by key, not by which
  // document the key points at -- so these recs use an empty default and
  // rely solely on the risk factor's own ref.
  const refsExposure = (extra = []) => collectRefs(riskIds, extra, []);

  // Booster cadence per ACIP 2020 MMWR and immunize.org p2035:
  //   FIRST booster (the dose after the last PRIMARY dose):
  //     primary series completed at <7y → first booster in 3 years
  //     primary series completed at ≥7y → first booster in 5 years
  //     completion age unknown → conservative 3 years (same as <7y)
  //   ALL SUBSEQUENT boosters: always 5 years regardless of completion age.
  // (Only used in the primary2 booster branch below.)
  //
  // P1-1 (2026-09-15): this was `given === 2` and `doses[1]` — a hand-typed 2,
  // i.e. "the first booster is always dose 3, and the series always ends at
  // dose 2". That is only true of a series begun at 2 years or older. A child
  // with four infant doses on record looked like someone four doses into a
  // 2-dose series, so the app believed the first booster was already behind
  // them and put the next one five years out instead of three. The validator
  // has always had the right form of this test (validate.js: the booster phase
  // begins at effectiveIdx === primaryTotal), so the two disagreed.
  //
  // Deriving the boundary from seriesTotals.js — the same module the validator
  // reads — means it cannot be wrong for a schedule whose primary series is not
  // two doses long. P0-1 routes every infant-started patient away from this
  // branch, so today's answers do not change; this removes the trap rather than
  // leaving a literal that happens to be right.
  const menacwyPrimaryDoseTotal = menacwySeriesInfo({
    riskClass, am, doses, today, dob, infantSeries: menacwyInfantSeriesIndicated(riskIds),
  }).primaryTotal;
  // Age at the LAST primary dose — the dose that completed the series and so
  // started the booster clock.
  const primaryCompletionAge = ageAtDose(doses[menacwyPrimaryDoseTotal - 1] || null, am, today, dob);
  const isFirstBooster = given === menacwyPrimaryDoseTotal;
  // First booster: <7y or unknown → 3y conservative; ≥7y → 5y.
  //
  // P0-5 (2026-09-15): the cadence is carried in YEARS and compared on the
  // calendar. boostDays survives only for minIntervalDays, which the card
  // prints as an approximate "~3 years". Comparing 1096 days rejected a booster
  // given on its exact three-year anniversary whenever no 29 February fell in
  // the window, and dated the next one a day early.
  // T2 (2026-11-19): a `firstBoosterYears` was computed here for every patient
  // and never read, so the unknown-age fallback ran for patients mid-series
  // whose booster nothing on screen depended on. Removed; boostYearsCount below
  // is the one that is used.
  const boostYearsCount = menacwyBoosterYears({
    isFirstBooster, primaryCompletionAgeMonths: primaryCompletionAge,
  });
  const boostDays = DAYS.years(boostYearsCount);

  // ── Infant pathways (<2y), whatever the indication ───────────────────────
  // M10 (2026-09-15): this used to sit INSIDE the primary2 branch below, so it
  // was reached only by medically high-risk infants. ACIP 2020 MMWR 69(RR-9)
  // gives travel (Table 9) and A/C/W/Y outbreak (Table 8) the identical "2–23
  // mos" row, so an infant traveler was wrongly answered by the single+boost
  // branch ("1 dose (ongoing-risk indication)") and an infant outbreak contact
  // by the single branch ("1 dose"). Hoisting it here routes all three to the
  // same series; menacwyInfantSeries varies only the WORDING by indication, and
  // the booster phase, which genuinely differs for outbreak (see there).
  //
  // P0-1 (2026-09-15): this door used to read today's age alone.
  // A child mid-series fell out of it on their second birthday and landed in
  // the generic >=2y branch below, which hard-codes a 2-dose series, so the
  // doses they still owed were re-labelled "boosters" three years away. The
  // series length is set by the age at DOSE 1, permanently: CDC child &
  // adolescent schedule notes, "Meningococcal serogroup A,C,W,Y vaccination",
  // special situations, Menveo (fetched live 2026-09-15) -- "Dose 1 at age 2
  // months: 4-dose series", "Dose 1 at age 7-23 months: 2-dose series",
  // "Dose 1 at age 24 months or older: 2-dose series". So a patient whose dose
  // 1 was given under 2 years stays on the infant pathway however old they are
  // now; menacwyInfantSeries() already keys every total, interval and booster
  // clock inside it off d1AgeM, so it handles the whole lifecycle correctly.
  // An UNVACCINATED >=2y patient has no dose 1 and is unaffected.
  const menacwyD1AgeM = doses[0] ? ageAtDose(doses[0], am, today, dob) : null;
  const startedAsInfant = menacwyD1AgeM != null && menacwyD1AgeM < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS;
  if ((am < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS || startedAsInfant) && menacwyInfantSeriesIndicated(riskIds)) {
    return [menacwyInfantSeries(am, given, doses, last, today, riskIds, dob, clockDate, repeatFloorDate)];
  }

  // ── Medical high risk: 2-dose primary + lifelong boosters ────────────────
  if (riskClass === 'primary2') {
    // ≥2y: 2-dose primary ≥8 weeks apart, then boosters.
    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 (high-risk primary series)',
        doseNum: 1, seriesTotal: 2, boosterSummary: MENACWY_HIGHRISK_BOOSTER_LINE, dueToday: true, brands: menacwyBrands(am),
        note: {
          // P43 (review v10): one sentence; it folds whole behind "Why this" (owner 2026-11-20).
          lead: `Two MenACWY doses, at least ${weeksLabel(MENACWY_HIGHRISK_PRIMARY_GAP)} apart, for this high-risk condition.`,
          detail: '',
        },
        // U2: the booster half of this sentence, and both of its sources, moved
        // up to the booster line, which was already saying the same thing.
        boosterCites: [
          cite('boosterBeforeAge7'),
          cite('boosterAtOrAfterAge7'),
        ],
        // C5/2026-07-24: the <7y/≥7y booster-cadence split is verbatim in
        // the 2020 MMWR tables (noteCites above) — cdcRecommendations
        // dropped as redundant (citation audit finding).
        refs: refsFor([]),
      })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, MENACWY_HIGHRISK_PRIMARY_GAP, today);
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 2 of 2 (high-risk primary series)',
        doseNum: 2, seriesTotal: 2, boosterSummary: MENACWY_HIGHRISK_BOOSTER_LINE, dueToday: elapsed,
        earliestNextDate: elapsed ? null : addDays(lastDate, MENACWY_HIGHRISK_PRIMARY_GAP),
        minIntervalDays: MENACWY_HIGHRISK_PRIMARY_GAP, brands: menacwyBrands(am),
        note: {
          lead: `Dose 2, at least ${weeksLabel(MENACWY_HIGHRISK_PRIMARY_GAP)} after dose 1.`,
          detail: 'A late dose 2 still counts. Do not restart. Boosters follow while the risk lasts.',
        },
        // U2: the booster tail moved to the booster line above. It gains the
        // sources the dose-1 card always had and this one never did.
        boosterCites: [
          cite('boosterBeforeAge7'),
          cite('boosterAtOrAfterAge7'),
        ],
        refs: refsFor([]),
      })];
    }
    // given >= 2: primary complete → ongoing boosters
    // First booster (given===2): 3y if D2 <7y, else 5y. Subsequent (given>=3): always 5y.
    const boostYears = String(boostYearsCount);
    // P17/P19 (review v10): the title reads in order and says from when.
    const boostTitle = isFirstBooster
      ? `First booster (dose ${given + 1}), ${boostYears} years after the series`
      : `Booster (dose ${given + 1}), 5 years after the last`;
    const elapsed = calendarIntervalElapsed(lastDate, boostYearsCount * 12, today);
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: boostTitle,
      doseNum: given + 1, seriesTotal: 2, boosterSummary: `Boosters: every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at risk [c]`, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addCalendarYears(lastDate, boostYearsCount),
      minIntervalDays: boostDays, brands: menacwyBrands(am),
      // U2: the "then every 5 years" tail is the booster line's own sentence.
      // The first-booster note keeps what the line cannot say -- why THIS
      // booster falls 3 years out rather than 5. A later booster has nothing
      // left to add, so it carries no note at all.
      note: isFirstBooster
        ? {
          lead: 'Series complete.',
          detail: boostYears === '3'
            ? 'The first booster is 3 years later because the series ended before 7 years [c].'
            : 'The first booster is 5 years later because the series ended at 7 years or older [c].',
        }
        : null,
      noteCites: isFirstBooster ? [
        boostYears === '3'
          ? cite('boosterBeforeAge7')
          : cite('boosterAtOrAfterAge7'),
      ] : [],
      // U2: a LATER booster now has no note at all, so without this the card
      // would state a cadence with nothing to click through to.
      boosterCites: [boostYears === '3' ? cite('boosterBeforeAge7') : cite('boosterAtOrAfterAge7')],
      // C5/2026-07-24: cdcRecommendations dropped — the <7y/≥7y split is a
      // verbatim MMWR quote already (citation audit finding).
      refs: refsFor([]),
    })];
  }

  // ── Occupational-only exposure floor (microbiologist/military/college_dorm) ──
  // Found 2026-09-19 (plan item D, relation 1b, MeningoVax-main): a 1-week-old
  // ticked "microbiologist" alone got told a MenACWY dose was due today, with
  // an empty brands list -- there is no product to actually give.
  //
  // Cause: the infant-hoist minimum-age check above (menacwyInfantSeries(),
  // reached only when menacwyInfantSeriesIndicated(riskIds) is true) covers
  // the primary2 class plus travel/outbreak_acwy -- ACIP gives those an
  // explicit "2-23 mos" table row. Microbiologist ('single+boost') and
  // military/college_dorm ('single') have no such row (Tables 7 and 10 both
  // start at ">=10 yrs"), so they were deliberately left out of that hoist --
  // but that also left the two branches below with no minimum-age floor of
  // their own. This is the exact defect regression-newborn-menacwy-not-due-
  // yet.test.js fixed for asplenia/complement/hiv/travel/outbreak_acwy in an
  // earlier session (PR #38); these three risk ids were simply never in that
  // fix's reach.
  //
  // Travel and outbreak_acwy can never reach here below this age: both are
  // in menacwyInfantSeriesIndicated(), so the hoist above already caught them
  // whenever am is under MENACWY_INFANT_SERIES_MAX_AGE_MONTHS (well above
  // MENACWY_SCHEDULE_MIN_AGE_MONTHS). So this guard only ever fires for microbiologist
  // alone, or military/college_dorm (alone or combined) -- reusing the same
  // MENACWY_SCHEDULE_MIN_AGE_MONTHS constant and citation the infant-hoist check uses,
  // not a re-derived number.
  if ((riskClass === 'single+boost' || riskClass === 'single') && am < MENACWY_SCHEDULE_MIN_AGE_MONTHS) {
    return [rec({
      vaccine: 'MenACWY', status: 'not-indicated', asksLater: true, doseLabel: `Not yet due (from ${monthsLabel(MENACWY_SCHEDULE_MIN_AGE_MONTHS)})`, dueToday: false,
      note: {
        lead: `MenACWY starts at ${monthsLabel(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}, so nothing is due yet [c].`,
        detail: 'This patient has an occupational or exposure-based indication for a single MenACWY dose, but that does not lower the vaccine\'s own minimum age. Track this patient and give the dose once they reach that age.',
      },
      noteCites: [cite('acwyInfantHighRisk2to6mo')],
      refs: refsExposure(),
    })];
  }

  // ── Single dose with ongoing boosters (travel, microbiologist) ───────────
  // G5 (2026-09-16): travellers and microbiologists share this branch, and the
  // wording used to name BOTH indications to everybody — a microbiologist who
  // has never left the country was told his boosters run "while travel or
  // occupational exposure continues". Name only what the patient actually has.
  // (L2-3 fixed the first-booster sentence this way; these lines were missed.)
  // W3 (2026-07-24 owner decision): status is 'exposure', not 'risk-based' --
  // that word is reserved for ongoing MEDICAL risk (asplenia, complement
  // deficiency, HIV, above). Travel/microbiologist re-exposure is a
  // different kind of "why," even though the schedule (1 dose + q5y
  // boosters) is structurally similar.
  if (riskClass === 'single+boost') {
    // Only 'travel' and 'microbiologist' reach this branch (riskFactors.js).
    const hasTravel = riskIds.includes('travel');
    const hasMicro = riskIds.includes('microbiologist');
    const exposurePhrase = hasTravel && hasMicro
      ? 'travel or exposure'
      : hasMicro ? 'exposure' : 'travel';
    const boosterLine = `Boosters: every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while ${exposurePhrase} continues`;
    // U2: each of these ended with a "re-vaccinate every 5 years" sentence that
    // boosterLine above already carries, naming the same exposure.
    const firstDoseNote = hasTravel && hasMicro
      ? {
        lead: 'One MenACWY dose now, for travel to hyperendemic or epidemic areas and for occupational exposure.',
        detail: 'A microbiologist routinely exposed to isolates of N. meningitidis, and a traveller to a country where meningococcal disease is hyperendemic or epidemic, each qualify on their own. One dose covers both, and boosters follow while either exposure continues.',
      }
      : hasMicro
        ? {
          lead: 'One MenACWY dose now, for routine occupational exposure to N. meningitidis.',
          detail: 'This covers microbiologists routinely exposed to isolates of N. meningitidis. Protection is not lifelong, so boosters follow while that exposure continues.',
        }
        : {
          lead: 'One MenACWY dose now, for travel to a country where meningococcal disease is hyperendemic or epidemic.',
          detail: 'This covers travel to, or residence in, such a country. Protection is not lifelong, so boosters follow while that travel risk continues.',
        };

    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'exposure', doseLabel: 'Dose 1 (boosters while at risk)',   // P13 (review v10)
        doseNum: 1, seriesTotal: 1, boosterSummary: boosterLine, dueToday: true, brands: menacwyBrands(am),
        note: firstDoseNote,
        // C2/2026-07-24: cites whichever risk factor's own table anchor
        // (Table 7 microbiologist / Table 9 travel) applies -- see refsExposure.
        refs: refsExposure(),
      })];
    }
    // M9 (2026-09-15): the FIRST booster is 3 years, not 5, when the primary dose
    // was given before the 7th birthday. ACIP 2020 MMWR 69(RR-9) Table 9, fetched
    // live 2026-09-15: "Aged <7 yrs: Single dose at 3 yrs after primary
    // vaccination and every 5 yrs thereafter / Aged >=7 yrs: Single dose at 5 yrs
    // after primary vaccination and every 5 yrs thereafter". This branch used a
    // flat 5 years for everyone, so a child vaccinated at 3 waited two years too
    // long. The same 3/5 split already existed above for the medical high-risk
    // branch; it keys off dose 2 there because that series has two primary doses,
    // and off dose 1 here because this one has a single primary dose.
    //
    // Microbiologists share this branch and are deliberately unchanged: ACIP
    // Table 7 covers ages ">=10 yrs" only and gives them a flat 5 years, with no
    // <7-year row. isTravel keeps the 3-year rule to the travel indication.
    const isTravel = hasTravel;
    const isFirstExposureBooster = given === 1;
    const primaryDoseAge = ageAtDose(doses[0] || null, am, today, dob);
    // Unknown age falls to the shorter 3-year interval, the same conservative
    // choice the high-risk branch above makes.
    const exposureBoostYears = (isTravel && isFirstExposureBooster)
      ? menacwyFirstBoosterYears(primaryDoseAge)
      : MENACWY_BOOSTER_CADENCE_YEARS;
    const exposureBoostDays = DAYS.years(exposureBoostYears);
    // P18/P19 (review v10)
    const exposureBoostTitle = isFirstExposureBooster
      ? `First booster (dose ${given + 1}), ${yearsLabel(exposureBoostYears)} after dose 1`
      : `Booster (dose ${given + 1}), ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} after the last`;
    const elapsed = calendarIntervalElapsed(lastDate, exposureBoostYears * 12, today);
    // Port Phase 5 (owner, 2026-11-18): the routine 16-year booster comes first
    // when it is owed no later than this booster (routineSixteenBoosterOwed).
    // Once it is due it always shows, as on the outbreak card, so the label does
    // not change the day this booster also falls due (whole-app check 7).
    const owed16 = routineSixteenBoosterOwed(am, doses, today, dob, lastDate, { throughCatchup: true });
    if (owed16 && (owed16.dueToday
      || (!elapsed && owed16.earliestNextDate <= addCalendarYears(lastDate, exposureBoostYears)))) {
      return [routineSixteenBoosterCard({
        owed: owed16, am, given, lastDate, boosterSummary: boosterLine, refs: refsExposure(),
        indication: hasTravel && hasMicro ? 'travel and laboratory-exposure' : hasMicro ? 'laboratory-exposure' : 'travel',
      })];
    }
    return [rec({
      vaccine: 'MenACWY', status: 'exposure', doseLabel: exposureBoostTitle,
      doseNum: given + 1, seriesTotal: 1, boosterSummary: boosterLine, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addCalendarYears(lastDate, exposureBoostYears),
      minIntervalDays: exposureBoostDays, brands: menacwyBrands(am),
      // L2-3 (2026-09-16): the two first-booster sentences carry a [c] marker, and
      // the microbiologist gets a sentence of his own. Until now both indications
      // shared one sentence while `noteCites` below was gated on isTravel, so the
      // citation-integrity sweep found the pair out of step in both directions:
      // the travel card carried a sourced claim with no marker to render it (the
      // link never appeared), and the microbiologist card would have rendered an
      // empty superscript once the marker was added.
      //
      // The shared sentence was also wrong for a microbiologist on its own terms:
      // "given at age 7 or older, so the first booster is due 5 years after it"
      // implies the <7/>=7 split applies to him. It does not — ACIP Table 7 covers
      // ages ">=10 yrs" and gives a flat 5 years with no under-7 row, which is why
      // M9 left microbiologists out of the 3-year rule in the first place. His
      // sentence now states the flat interval without implying an age split, and
      // cites Table 7 through the risk factor's own chip (refsExposure) rather
      // than an age-split quote that does not describe him.
      //
      // No date changes: exposureBoostYears is untouched.
      //
      // U2 (2026-09-17): every variant ended with the ongoing "every 5 years
      // while <exposure> continues" that boosterLine above already prints, with
      // the same exposure named. What is left is the part the line cannot say --
      // why this first booster falls where it does. A later booster had nothing
      // but the duplicate, so it now carries no note.
      note: exposureBoostYears === MENACWY_FIRST_BOOSTER_YEARS_UNDER_7
        ? {
          // L6 (review v10): explain only this patient; the general rule is in the Rulebook.
          lead: `The first booster is due ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)} after dose 1 [c].`,
          detail: 'This is because dose 1 was given before 7 years.',
        }
        : isFirstExposureBooster
          ? (isTravel
            ? {
              lead: `The first booster is due ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7)} after dose 1 [c].`,
              detail: 'This is because dose 1 was given at 7 years or older.',
            }
            : {
              lead: `The first booster is due ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7)} after dose 1.`,
              // U2: the cadence is the booster line's; L6: nothing about other patients.
              detail: '',
            })
          : null,
      noteCites: (isTravel && isFirstExposureBooster) ? [
        exposureBoostYears === MENACWY_FIRST_BOOSTER_YEARS_UNDER_7
          ? cite('boosterBeforeAge7')
          : cite('boosterAtOrAfterAge7'),
      ] : [],
      refs: refsExposure(),
    })];
  }

  // ── Single dose, no booster (military, college dorm, ACWY outbreak) ───────
  // W3 (2026-07-24 owner decision): status is 'exposure', not 'risk-based' --
  // these are transient one-and-done indications, distinct from ongoing
  // medical risk. See the single+boost branch above for the same rule.
  if (riskClass === 'single') {
    const isCollege = riskIds.includes('college_dorm');

    // STOP B B-4 (owner, 2026-11-15): under 16, the college-residence and
    // military boxes add nothing — the card follows the routine schedule and
    // says the college/military dose is given at 16 or older. The validator
    // already treats these patients as routine (doseRules.js acwy().routineOnly),
    // so card and chip now agree (whole-app check 1, Phase 0 N9). Outbreak is
    // 'single' too but has its own schedule at every age (ACIP Table 8).
    if (am < MENACWY_ROUTINE_BOOSTER_AGE_MONTHS && !riskIds.includes('outbreak_acwy')) {
      const which = isCollege && riskIds.includes('military')
        ? 'college-residence or military'
        : isCollege ? 'college-residence' : 'military';
      const line = ` The ${which} dose is given at 16 or older.`;
      return menacwyRoutine(am, given, doses, last, today, dob, clockDate).map((r) => ({
        ...r,
        note: r.note && typeof r.note === 'object'
          ? { ...r.note, detail: `${r.note.detail ?? ''}${line}`.trim() }
          : `${r.note ?? ''}${line}`.trim(),
      }));
    }

    // College-dorm rule keys off whether a dose was given at age ≥16y.
    //
    // D1 (owner, 2026-11-17) — a ≥16y dose covers college entry for 5 years.
    // ACIP 2020 MMWR 69(RR-9) Table 10, read live 2026-11-17:
    //   Boosters row: "College freshmen living in residence halls: Not
    //     routinely recommended unless person becomes at increased risk due to
    //     another indication" — no RECURRING booster.
    //   Footnote *: "College freshmen living in residence halls should receive
    //     at least 1 dose of MenACWY within 5 years before college entry. ...
    //     Adolescents who received a first dose after their 16th birthday do
    //     not need another dose before college entry unless it has been more
    //     than 5 years since the dose."
    // immunize.org P2018 (10/19/2026) says the same. M17 (2026-09-15) had made
    // the ≥16y dose permanent, quoting as the footnote a sentence that is in
    // ACIP's ROUTINE section ("do not need a booster dose unless they become at
    // increased risk"); D1 reverses it. The app measures the 5 years to today
    // (the visit), as it cannot know the entry date.
    if (isCollege) {
      // P1-1 (2026-09-17): allows CDC's 4-day grace, like every other
      // "does this dose count" test. A college entrant whose dose came three
      // days before their 16th birthday is covered.
      const dosesAt16Plus = doses
        .map((d) => ({ a: ageAtDose(d, am, today, dob), date: d.date || null }))
        .filter(({ a, date }) => a != null
          && ageMeetsMinimum(a, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, { doseDate: date, ageMonths: am, today, dob }));
      // D1 (owner, 2026-11-17): that dose covers college entry for 5 years.
      // ACIP 2020 Table 10 footnote (read live 2026-11-17): "do not need another
      // dose before college entry unless it has been more than 5 years since
      // the dose." Measured from the most recent dose at 16+; a dose with no
      // date cannot be measured and is taken as it was before D1.
      const latest16 = dosesAt16Plus.map((d) => d.date).filter(Boolean).sort().pop() ?? null;
      const past5Years = latest16 != null
        && today > addCalendarYears(latest16, MENACWY_COLLEGE_COVER_YEARS);
      if (dosesAt16Plus.length > 0 && past5Years) {
        return [rec({
          vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose (last dose at ≥16y more than 5 years ago)',
          doseNum: given + 1, seriesTotal: 1, dueToday: true, brands: menacwyBrands(am),
          noteCites: [cite('acip2020College5Years')],
          note: {
            // P50 (review v10): one sentence; it folds whole behind "Why this" (owner 2026-11-20).
            lead: `The dose at 16 years or older was over ${yearsLabel(MENACWY_COLLEGE_COVER_YEARS)} ago, so one dose is due before college entry [c].`,
            detail: '',
          },
          refs: refsExposure(),
        })];
      }
      if (dosesAt16Plus.length > 0) {
        return [rec({
          vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete (dose given at ≥16y)', seriesTotal: 1,
          noteCites: [cite('acip2020College5Years')],
          note: {
            lead: 'A MenACWY dose at age 16 or older meets the college-residence requirement. No further dose is needed.',
            detail: `This holds for ${yearsLabel(MENACWY_COLLEGE_COVER_YEARS)} after that dose: ACIP asks for another dose before college entry only if more than ${yearsLabel(MENACWY_COLLEGE_COVER_YEARS)} have passed [c].`,
          },
          // C2: college_dorm's own ref (Table 10) already carries this rule
          // -- refsFor([]) here would ALSO add the whole-document acip2020
          // default, producing two identically-labeled "ACIP 2020 MMWR"
          // chips (found while implementing C2, not in the original plan).
          refs: refsExposure(),
        })];
      }
      // A prior dose exists but cannot be confirmed as ≥16y (earlier dose, or date unknown).
      if (given >= 1) {
        const datesKnown = doses.every((d) => d?.date || typeof d?.ageMonths === 'number');
        // N5: the dose this card asks for is also the routine 16-year booster,
        // so it waits 8 weeks after the last dose like every other card that
        // asks for it. Only measurable when that dose has a date.
        const timing = datesKnown ? routineBoosterTiming(lastDate, today) : { dueToday: true, earliestNextDate: null };
        return [rec({
          vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose (booster at ≥16y)',
          doseNum: given + 1, seriesTotal: 1, ...timing, brands: menacwyBrands(am),
          noteCites: timing.dueToday ? [] : [cite('acwyBooster8WeeksAfterDose1')],
          note: datesKnown
            ? {
              lead: timing.dueToday
                ? 'The recorded dose was given before age 16, so one dose is due now.'
                : `The recorded dose was given before age 16, so one more dose is needed.${ROUTINE_BOOSTER_WAIT_SENTENCE}`,
              detail: 'The college-residence requirement is met only by a dose given on or after the 16th birthday. An earlier dose still counts as vaccination — it just does not satisfy this requirement.',
            }
            : {
              lead: 'The age at the recorded dose cannot be confirmed — check its date in the record.',
              detail: 'If that dose was given on or after the 16th birthday, no further dose is needed. If it was earlier, or the date cannot be established, give one dose now.',
            },
          // C5: an unconfirmed-date dose is a "does this old dose count"
          // practical judgment call, not a rule a single MMWR table defines
          // -- immunize.org's Ask the Experts leads here.
          refs: datesKnown ? refsExposure() : ['immMenACWY', ...refsExposure()],
        })];
      }
      // No history.
      return [rec({
        vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose', seriesTotal: 1,
        doseNum: 1, dueToday: true, brands: menacwyBrands(am),
        note: {
          // P49 (review v10): one sentence; it folds whole behind "Why this" (owner 2026-11-20).
          lead: 'One MenACWY dose before college entry, since none is on record at 16 years or older.',
          detail: '',
        },
        // C2/2026-07-24: cites college_dorm's own Table 10 anchor.
        refs: refsExposure(),
      })];
    }

    // M12 (2026-09-15), cross-repo parity with vaxapp: an A/C/W/Y outbreak
    // contact who was vaccinated long ago is NOT simply "Complete". ACIP 2020
    // MMWR 69(RR-9) Table 8, fetched live from cdc.gov 2026-09-15: "Boosters (if
    // previously vaccinated and identified as being at increased risk): • Aged
    // <7 yrs: Single dose if ≥3 yrs since vaccination • Aged ≥7 yrs: single dose
    // if ≥5 yrs since vaccination."
    //
    // This is a TOP-UP triggered by being identified at risk again, not the
    // standing countdown travel gets from Table 9 (owner-confirmed 2026-09-15) —
    // so it is offered because the patient is recorded as at risk in an outbreak
    // now, and the copy says it does not start a repeating schedule.
    //
    // Note the clock: Table 8 keys the 3-versus-5-year threshold to the
    // patient's age TODAY, inside its own age-group rows, where Tables 4-6 and 9
    // key theirs to the age at which the primary series was completed.
    //
    // Military recruits and college residents share this branch and are
    // deliberately unchanged: Table 10 really is a single dose for them.
    const isOutbreakACWY = riskIds.includes('outbreak_acwy');
    if (isOutbreakACWY && given >= 1) {
      // STOP B B-2 (owner, 2026-11-15): while the outbreak box is ticked, keep
      // asking for the booster 5 years on (3 if the series finished before 7),
      // and never say "Complete"; "booster", never "top-up". ACIP 2020 Table 8
      // (read live 2026-11-16): "Aged <7 yrs: Single dose if ≥3 yrs since
      // vaccination • Aged ≥7 yrs: single dose if ≥5 yrs since vaccination".
      // The years come from the same rule the validator checks (C10:
      // doseRules.js acwyBoosterTooSoon): the first booster by the age at the
      // last primary dose, every later one 5 years.
      const primaryTotal = 1;
      const lastAge = ageAtDose(doses[given - 1], am, today, dob);
      const boosterYears = given === primaryTotal
        ? menacwyFirstBoosterYears(lastAge)
        : MENACWY_BOOSTER_CADENCE_YEARS;
      const boosterOn = addCalendarYears(lastDate, boosterYears);
      const boosterNow = calendarIntervalElapsed(lastDate, boosterYears * 12, today);
      // The routine 16-year booster comes first, and is its own ACIP rule
      // (relation 1a, 2026-09-19); the validator exempts it from the outbreak
      // booster floor for the same reason (doseRules.js acwyIsRoutineBooster).
      // From 16 through 21 it always comes first (as before; through 21 since
      // owner F-6, 2026-11-18: a healthy 22-year-old is owed no routine dose);
      // under 16 since Port Phase 5 (owner, 2026-11-18), when it is owed no
      // later than the outbreak booster. N5: no sooner than 8 weeks after the
      // last dose.
      const owed16 = routineSixteenBoosterOwed(am, doses, today, dob, lastDate, { throughCatchup: true });
      if (owed16 && (am >= MENACWY_ROUTINE_BOOSTER_AGE_MONTHS || (!boosterNow && owed16.earliestNextDate <= boosterOn))) {
        return [routineSixteenBoosterCard({ owed: owed16, am, given, lastDate, indication: 'outbreak', refs: refsExposure() })];
      }
      return [rec({
        vaccine: 'MenACWY', status: 'exposure',
        doseLabel: boosterNow
          ? `Booster (dose ${given + 1}) for this outbreak`
          : `Booster (dose ${given + 1}) if outbreak risk continues`,
        doseNum: given + 1, seriesTotal: 1,
        dueToday: boosterNow, earliestNextDate: boosterNow ? null : boosterOn,
        minIntervalDays: DAYS.years(boosterYears),
        brands: menacwyBrands(am),
        note: {
          lead: boosterNow
            ? `A booster now: ${yearsLabel(boosterYears)} or more since the last MenACWY dose [c].`
            : `Booster ${fmtDate(boosterOn)} if outbreak risk continues [c].`,
          // Wording slip (2026-11-19): this said 5 years twice, and named the
          // 3-year case on later boosters, which always wait 5 (C10).
          detail: `For someone at increased risk in a serogroup A, C, W or Y outbreak, ${given === primaryTotal
            ? `ACIP gives a booster ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)} after the last dose if the series finished before age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)} years, otherwise ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)}.`
            : `ACIP gives each later booster ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} after the last dose.`} If the patient is no longer at risk, uncheck the outbreak box.`,
        },
        noteCites: [cite('acip2020Table8')],
        refs: refsExposure(),
      })];
    }

    // Military recruit: a single dose satisfies the recruitment requirement.
    //
    // M18 (2026-09-15): this used to end "Re-dose only if a separate
    // ongoing-risk indication applies", which is the COLLEGE half of ACIP 2020
    // MMWR 69(RR-9) Table 10 attached to the wrong group. That table's Boosters
    // row, verified live 2026-09-15: "College freshmen living in residence
    // halls: Not routinely recommended... Military recruits: Every 5 yrs on
    // basis of assignment". Military is the one group there WITH a standing
    // booster interval, and this card denied it.
    //
    // Deliberately wording only, no booster scheduling — footnote †† of the
    // same table: "Vaccination recommendations for military personnel are made
    // by the U.S. Department of Defense on the basis of high-risk travel
    // requirements." The interval turns on an assignment this app cannot see,
    // so the card names DoD as the owner of the timing rather than starting a
    // countdown it has no basis to compute. Do not add a 5-year due date here
    // without a way to capture the assignment.
    if (given >= 1) {
      // Found 2026-09-19 (plan item D, relation 1a): this used to say
      // "Complete" the moment the recruitment requirement itself was
      // satisfied by any prior dose, even when that dose was given before
      // age 16 -- so a 16-year-old still owed their routine booster read as
      // fully done the moment "military" was ticked. Recruitment and the
      // routine age-16 requirement are separate ACIP rules; only report
      // "Complete" once both are.
      if (routineBoosterCurrentlyUnmet(am, doses, today, dob)) {
        // N5: no sooner than 8 weeks after the last dose.
        const timing = routineBoosterTiming(lastDate, today);
        return [rec({
          vaccine: 'MenACWY', status: 'exposure', doseLabel: ROUTINE_16Y_BOOSTER_LABEL,
          doseNum: given + 1, seriesTotal: 1, ...timing, brands: menacwyBrands(am),
          note: routineBoosterStillOwedNote('military recruitment', !timing.dueToday),
          noteCites: timing.dueToday ? [] : [cite('acwyBooster8WeeksAfterDose1')],
          refs: refsExposure(),
        })];
      }
      // STOP B B-3 (owner, 2026-11-15): show the 5-year booster date with the
      // assignment caveat, never "Complete". ACIP 2020 Table 10 (read live
      // 2026-11-16): "Military recruits: Every 5 yrs on basis of assignment";
      // footnote ††: the U.S. Department of Defense sets it "on the basis of
      // high-risk travel requirements", which this app cannot see.
      const boosterOn = addCalendarYears(lastDate, MENACWY_BOOSTER_CADENCE_YEARS);
      const boosterNow = calendarIntervalElapsed(lastDate, MENACWY_BOOSTER_CADENCE_YEARS * 12, today);
      return [rec({
        vaccine: 'MenACWY', status: 'exposure',
        doseLabel: `Booster (dose ${given + 1}) if required by assignment`,
        doseNum: given + 1, seriesTotal: 1,
        dueToday: boosterNow, earliestNextDate: boosterNow ? null : boosterOn,
        minIntervalDays: DAYS.years(MENACWY_BOOSTER_CADENCE_YEARS),
        brands: menacwyBrands(am),
        note: {
          lead: boosterNow
            ? 'A booster now if the service\'s assignment requires it [c].'
            : `Booster ${fmtDate(boosterOn)} if the service's assignment requires it [c].`,
          detail: 'ACIP gives military recruits a booster every 5 years on the basis of assignment. The U.S. Department of Defense sets that timing from high-risk travel, which this app cannot see. Check the service\'s current requirement.',
        },
        noteCites: [cite('acip2020MilitaryBooster5Years')],
        refs: refsExposure(),
      })];
    }
    return [rec({
      vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose', seriesTotal: 1,
      doseNum: 1, dueToday: true, brands: menacwyBrands(am),
      note: isOutbreakACWY
        ? {
          lead: 'A single MenACWY dose, for someone at increased risk in a serogroup A, C, W or Y outbreak.',
          detail: 'While the outbreak risk continues, a booster follows 5 years later (3 if given before age 7).',
        }
        : {
          lead: 'A single MenACWY dose, for a military recruit.',
          detail: 'One dose satisfies the recruitment requirement. Any further doses are set by the service on the basis of assignment, which this app cannot see.',
        },
      refs: refsExposure(),
    })];
  }

  // ── No MenACWY risk → routine adolescent schedule ────────────────────────
  return menacwyRoutine(am, given, doses, last, today, dob, clockDate);
}

function menacwyInfantSeries(am, given, doses, last, today, riskIds, dob, clockDate = null, repeatFloorDate = null) {
  // C5/2026-07-24: ACIP 2020 MMWR is the citation. cdcChildMenACWY dropped —
  // it just restates the same MMWR rule (2026-07-23 owner decision).
  const refs = collectRefs(riskIds, [], ['acip2020']);
  // Ruling D: see menacwyRec.
  const lastDate = clockDate || last?.date || null;
  // M10: which indication put this infant on the series. The SCHEDULE is the
  // same for all three — ACIP prints one "2–23 mos" row in Tables 4–6, 8 and 9 —
  // so only the wording varies here, plus the booster phase for outbreak below.
  // Medical high risk outranks the exposure categories, matching
  // menacwyRiskClass's own precedence.
  const infantMedical = menacwyRiskClass(riskIds) === 'primary2';
  const infantTravel = !infantMedical && riskIds.includes('travel');
  const infantOutbreak = !infantMedical && !infantTravel && riskIds.includes('outbreak_acwy');
  // Every string below reproduces the ORIGINAL medical-high-risk text verbatim
  // when infantMedical is true, so that pathway is byte-for-byte untouched.
  // The age band sits in the MIDDLE for the exposure wordings: "High-risk
  // infants 2-6 months" reads fine, but "Infants travelling to ... hyperendemic
  // or epidemic 2-6 months" does not.
  const whoAged = (band) => (infantMedical
    ? `High-risk infants ${band}`
    : infantTravel
      ? `Infants aged ${band} travelling to or living in a country where meningococcal disease is hyperendemic or epidemic`
      : `Infants aged ${band} at increased risk during a serogroup A, C, W or Y outbreak`);
  const whoKidsAged = (band) => (infantMedical
    ? `High-risk children ${band}`
    : infantTravel
      ? `Travelling children ${band}`
      : `Children ${band} at increased risk during a serogroup A, C, W or Y outbreak`);
  const why = infantMedical ? 'infant high-risk' : infantTravel ? 'infant travel' : 'infant outbreak';
  const whyShort = infantMedical ? 'high-risk' : infantTravel ? 'travel' : 'outbreak';
  const whyTitle = infantMedical ? 'Infant high-risk' : infantTravel ? 'Infant travel' : 'Infant outbreak';
  const whilePersists = infantMedical
    ? 'while the high-risk condition persists'
    : infantTravel
      ? 'while the travel risk continues'
      : 'while the outbreak risk continues';
  // ACIP Table 8 gives outbreak contacts a one-off top-up when they are
  // identified at risk in a NEW outbreak — "Boosters (if previously vaccinated
  // and identified as being at increased risk): • Aged <7 yrs: Single dose if
  // ≥3 yrs since vaccination • Aged ≥7 yrs: single dose if ≥5 yrs since
  // vaccination" — NOT the standing countdown travel and medical risk get
  // (owner-confirmed 2026-09-15). The summary must not promise one.
  // boosterSummary must stay EMPTY for outbreak: RecCard turns any non-empty
  // value into the pill "Dose due today, future boosters needed", which would
  // contradict the very thing the text says. The top-up rule goes in the note.
  // STOP B B-2 (owner, 2026-11-15) replaced the "one-off top-up" reading: while
  // the outbreak box is ticked, an infant outbreak series gets the same booster
  // countdown as the other infant indications (3 years, then every 5), as CDC's
  // software books it (test patient 2016-UC-0116).
  const boosterSummaryText = `Boosters: ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)} after the series, then every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at risk [c]`;
  // U2: the source for that line. Empty for outbreak, where there IS no line --
  // and where the notes used to promise the countdown anyway, two sentences
  // before saying no such countdown exists.
  const infantBoosterCites = [cite('boosterBeforeAge7')];
  // Was the "no standing booster schedule … only in a NEW outbreak" sentence;
  // retired by B-2. Kept as an empty string so the notes below read unchanged.
  const outbreakTopUp = '';
  // Nothing can be due before any MenACWY product is licensed. Found 2026-09-17
  // during the calendar P1-1 sweep: an at-risk NEWBORN was told "Dose 1 (infant
  // high-risk series)", due today, with a Menveo chip to pick. The minimum age
  // was tested on the branch below and nowhere else, so a patient who failed
  // that test fell through to the CONTINUE-the-series fallback at the end of
  // this function -- which is written for someone who already has doses, and
  // with none recorded printed "Dose 1" and called it due today.
  //
  // Checking it here, before any card is built, means the answer cannot depend
  // on which branch a too-young patient happens to land in.
  //
  // CDC child & adolescent schedule notes, verified live 2026-09-17:
  // MenACWY-CRM (Menveo) "minimum age: 2 months"; "Dose 1 at age 2 months:
  // 4-dose series (additional 3 doses at age 4, 6, and 12 months)". MenACWY-TT
  // (MenQuadfi)'s minimum age is no longer 2 years — see brands.js's header:
  // AAP-aligned, WA DOH 2026-09-22, now 6 weeks (MENACWY_LICENCE_MIN_AGE_DAYS).
  // That is BELOW this schedule floor, which is why a dose given before this
  // gate can still exist in `doses` even though the app itself never asks for
  // one that young (M2, 2026-09-22) — see the `given` branch below.
  //
  // No date is promised. The app stores an age, not a date of birth (calendar
  // P1-3), so a date here would claim a precision it does not have.
  if (am < MENACWY_SCHEDULE_MIN_AGE_MONTHS) {
    // M3 (2026-09-23): `given` distinguishes two different patients this gate
    // used to answer identically. A family who hasn't started yet is told to
    // track and start at the schedule floor. A family who already got a
    // MenQuadfi dose at 6 weeks — licensed, and it counts (decision 7) — was
    // being told the same "track them and start it" sentence, as if that dose
    // had never happened, right after a clause claiming only Menveo was
    // licensed that young (false: MenQuadfi's own floor is younger still).
    // Owner, 2026-11-21 ("Can be given (Rec.)", "Yes, outbreak too"): from 6
    // weeks, MenQuadfi can be given; dose 1 is still due at 2 months. The badge
    // reads "Next dose not yet due" (MQ6-g, the same day).
    // AAP 2026: "The first dose of MenQuadfi may be given as early as 6 weeks."
    // Needs a date of birth: from whole months alone a 5-week-old and a
    // 7-week-old look the same, and the app never guesses an age.
    const ageDays = dob ? daysBetween(dob, today) : null;
    if (given === 0 && ageDays != null && ageDays >= MENACWY_LICENCE_MIN_AGE_DAYS) {
      const startTotal = menacwyInfantHighRiskTotal({ d1AgeM: MENACWY_SCHEDULE_MIN_AGE_MONTHS });
      const startGate = menacwyInfantNextDoseGate({ d1AgeM: am, d2AgeM: null, given: 1 });
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose 1 of ${startTotal} (${why})`, doseNum: 1, seriesTotal: startTotal, boosterSummary: boosterSummaryText,
        // MQ6-g (owner, 2026-11-21, "Apply the principle"): not "Can be given
        // today". Dose 1 is due at 2 months; the note says MenQuadfi may be
        // given from 6 weeks.
        dueToday: false,
        earliestNextDate: addCalendarMonths(dob, MENACWY_SCHEDULE_MIN_AGE_MONTHS),
        // MQ6-j (owner, 2026-11-21, "Both brands"): dose 1 is advised at 2
        // months, when Menveo is licensed too, so the card lists the same
        // brands as the 2-month card. AAP 2026 catch-up table, minimum age
        // for dose 1: "2 months MenACWY-CRM, 6 weeks MenACWY-TT".
        brands: MENACWY_INFANT_SERIES_BRANDS,
        minIntervalDays: startGate.minIntervalDays,
        note: {
          lead: `The infant series starts at ${monthsLabel(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}; MenQuadfi may be given from ${weeksLabel(MENACWY_LICENCE_MIN_AGE_DAYS)} [c].`,
          detail: 'Start the four-dose infant series at 2, 4, 6 and 12 months [c].',
        },
        noteCites: [cite('aap2026MenQuadfiFrom6Weeks'), cite('acwyInfantHighRisk2to6mo')],
        boosterCites: infantBoosterCites,
        refs: [...refs, 'aap2026MenQuadfiFrom6Weeks'] });
    }
    if (given === 0) {
      return rec({ vaccine: 'MenACWY', status: 'not-indicated', asksLater: true, doseLabel: `Not yet due (from ${monthsLabel(MENACWY_SCHEDULE_MIN_AGE_MONTHS)})`,
        dueToday: false,
        note: {
          // P75 (review v10): the old sentence was false; a MenQuadfi dose from 6 weeks counts.
          lead: `The infant series starts at ${monthsLabel(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}, so nothing is due yet [c].`,
          detail: `This patient has an indication that calls for the ${why} series, so track them and start it at ${monthsLabel(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}.`,
        },
        noteCites: [cite('acwyInfantHighRisk2to6mo')],
        refs });
    }
    // MQ6-e (owner, 2026-11-21, "Same as at 2 months"): a dose already given
    // before 2 months (MenQuadfi from 6 weeks) falls through to the series
    // continuation below, the card the same baby gets from 2 months: dose 2
    // due at 4 months, the 8-week minimum beside it (AAP 2026 catch-up table,
    // MenACWY dose 1 to dose 2: "8 weeks"; owner Q9b). This used to return
    // "Not needed" / "Dose 1 given; next dose not yet due", with no date.
  }
  if (am < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS && given === 0 && am >= MENACWY_SCHEDULE_MIN_AGE_MONTHS) {
    // start series; Menveo and MenQuadfi both licensed by this age (M3, 2026-09-23).
    // One total for BOTH the printed label and seriesTotal. They used to be
    // written out separately, so when M5 changed the helper (a 7-23-month start
    // became a 2-dose series) the labels kept F1's older numbers and each card
    // contradicted its own total. Deriving both from one call makes that
    // impossible rather than merely fixed.
    const infantStartTotal = menacwyInfantHighRiskTotal({ d1AgeM: am });
    // B1 (2026-09-17): was `am <= 6`. CDC's bands are stated in COMPLETED
    // months ("Dose 1 at age 3-6 months" / "at age 7-23 months"), so the door
    // into the later band opens at 7, not just above 6. A baby of six months
    // and two weeks failed `am <= 6`, fell into the 7-11-month branch below,
    // and was handed that branch's wording over THIS branch's dose total: the
    // heading read "Dose 1 of 4 (infant high-risk 7-11mo)" directly above
    // "Start the 2-dose Menveo series". The total was the right one; the card
    // around it was not.
    if (am < MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS) {
      // The gap this card promises is the one before the NEXT dose (dose 2),
      // so ask the gate what follows a single dose given at this age.
      const startGate = menacwyInfantNextDoseGate({ d1AgeM: am, d2AgeM: null, given: 1 });
      // P0-1: this sentence said "(≥4 weeks between primary doses)" and said
      // nothing at all about the final dose's own conditions, which are now
      // enforced. The interval is interpolated from the gate so the sentence
      // and the validator cannot say different things.
      //
      // NOTE for the U4 copy pass: "at 2, 4, 6, and 12 months" is the 2-MONTH
      // band's schedule, printed here to 3–6-month starts too, which CDC calls
      // a "3- or 4-dose series" on no fixed months. Left alone deliberately —
      // that is a wording inaccuracy, not this interval bug, and changing it
      // here would mean editing a clinical assertion the regression tests pin.
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose 1 of ${infantStartTotal} (${why})`, doseNum: 1, seriesTotal: infantStartTotal, boosterSummary: boosterSummaryText, dueToday: true,
        brands: MENACWY_INFANT_SERIES_BRANDS, minIntervalDays: startGate.minIntervalDays,
        note: {
          lead: 'Start the four-dose infant series at 2, 4, 6 and 12 months [c].',
          detail: `Early doses are ≥${weeksLabel(startGate.minIntervalDays)} apart. The final dose is at ≥${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} and ≥${weeksLabel(MENACWY_INFANT_FINAL_GAP)} after the one before.${outbreakTopUp}`,
        },
        noteCites: [cite('acwyInfantHighRisk2to6mo')],
        boosterCites: infantBoosterCites, refs });
    }
    // B1 (2026-09-17): was `am <= 11`, same mistake at the next band edge —
    // and here it made the card assert something untrue. CDC does not split
    // "7-23 months" at all; the 12-23-month card below exists only because,
    // once the patient is already 12 months old, dose 2's "after age 12
    // months" condition cannot bite and saying so would be noise. An
    // 11-and-a-half-month-old was given that card anyway, so the app dropped
    // the condition and told them "Both fall after the first birthday, so the
    // 12-month age floor ... is already met" — five weeks before that
    // birthday. The split belongs on the floor it is reasoning about.
    if (am < MENACWY_INFANT_FINAL_MIN_AGE_MONTHS) {
      // D5: D2 must be ≥12 weeks after D1 AND not before 12 months of age.
      // This card used to say "Dose 1 of 2 + booster" and promise "a booster at
      // 12–23 months", both left over from F1 (2026-09-14), which made this a
      // 3-dose bucket. M5 (2026-09-15) reversed that to 2 doses but did not
      // update the text, so the card asked for a third dose CDC does not want —
      // and dose 2 is ITSELF given at 12–23 months, so the "booster at 12–23
      // months" sentence also named the wrong dose. The real first booster is 3
      // years after the series: ACIP 2020 MMWR 69(RR-9) Table 4, "Aged <7 yrs:
      // Single dose at 3 yrs after primary vaccination and every 5 yrs
      // thereafter". This now matches the 12–23-month card below.
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose 1 of ${infantStartTotal} (${why} 7–11mo)`, doseNum: 1, seriesTotal: infantStartTotal, boosterSummary: boosterSummaryText, dueToday: true,
        brands: MENACWY_INFANT_SERIES_BRANDS, minIntervalDays: MENACWY_INFANT_FINAL_GAP,
        note: {
          lead: `Start the 2-dose infant MenACWY series — dose 2 at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} after dose 1, and not before ${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} of age [c].`,
          detail: `${whoAged('7–11 months')} need two doses, not the four a younger infant needs.${outbreakTopUp}`,
        },
        noteCites: [cite('acwyInfantHighRisk7to23mo')],
        boosterCites: infantBoosterCites, refs });
    }
    // 12-23m unvaccinated. D5: D2 ≥12 weeks after D1 (≥12m age floor already satisfied in this band).
    // The label used to read "Dose 1 of 4" — F1's number, kept after M5 cut a
    // 12–23-month start to a 2-dose series, so the card said 4 while its own
    // seriesTotal and the note right beneath it said 2. CDC: "Dose 1 at age
    // 7–23 months: 2-dose series (dose 2 at least 12 weeks after dose 1 and
    // after age 12 months)".
    return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose 1 of ${infantStartTotal} (${whyShort} 12–23mo)`, doseNum: 1, seriesTotal: infantStartTotal, boosterSummary: boosterSummaryText, dueToday: true,
      brands: menacwyBrands(am), minIntervalDays: MENACWY_INFANT_FINAL_GAP,
      note: {
        lead: `Start the 2-dose primary series — the two doses at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} apart [c].`,
        detail: `${whoKidsAged('12–23 months')} who are unvaccinated need two doses. Both fall after the first birthday, so the 12-month age floor that gates a younger infant's final dose is already met.${outbreakTopUp}`,
      },
      noteCites: [cite('acwyInfantHighRisk7to23mo')],
      boosterCites: infantBoosterCites, refs });
  }

  // ── Continuing an infant series ──────────────────────────────────────────
  // D6: "3-dose shortcut" — if D1 was 3–6m (standard 4-dose series) AND D2 was given at ≥7m,
  // the final dose given at ≥12m AND ≥12 weeks after the previous dose completes the series
  // (3 doses total, no 4th dose needed). Otherwise the standard 4-dose path applies.
  // When D1/D2 ages are unknown, fall back conservatively to the standard 4-dose series.
  const d1AgeM = given >= 1 ? ageAtDose(doses[0], am, today, dob) : null;
  // T1 (owner, 2026-11-19): while dose 2 is still owed, today's age stands in
  // for it, so a child already 7 months or older is on the shortcut now.
  const d2AgeM = menacwyInfantD2AgeForSeries({
    given, d2AgeM: given >= 2 ? ageAtDose(doses[1], am, today, dob) : null, ageNowM: am,
  });
  // P1-3 (2026-09-15): was `d1AgeM >= 2`. CDC gives a dose 1 at 2 months a flat
  // 4-dose series and reserves the "3- or 4- dose series" wording for 3-6
  // months, so a baby who started on time at 2 months was being offered a
  // three-dose series CDC does not describe. Owner decision 2026-09-15: follow
  // CDC. Must stay in step with seriesTotals.js's menacwyInfantHighRiskTotal().
  // B1 (2026-09-17): this was a second hand-written copy of the band test, and
  // it had the same off-by-a-fraction top edge as the one in seriesTotals.js
  // (`<= 6` where CDC's band runs to just under 7). The two now ask one
  // function, so a child cannot be offered the shortcut by one module and
  // refused it by the other.
  const on3DosePath = menacwyOn3DoseShortcut({ d1AgeM, d2AgeM });
  // D5 fix: detect whether D1 was in the 7–23m band (D2 needs ≥12-week + ≥12m floor).
  // M5 (2026-09-15): the band is 7–23 months, not 7–11, and it is a 2-dose primary
  // series. CDC: "Dose 1 at age 7–23 months: 2-dose series (dose 2 at least 12
  // weeks after dose 1 and after age 12 months)".
  const d1WasInfant7to11 = d1AgeM != null
    && d1AgeM >= MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS
    && d1AgeM < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS;

  // T1 (owner, 2026-11-19): one dose on record and the child already 7 months
  // or older. Dose 2 is given now, at 7 months or older, so one final dose
  // follows (CDSI 4.65 skips doses 2 and 3 of its infant series once the child
  // is 7 months old). This used to read "Dose 2 (infant high-risk series)" with
  // "doses at 2, 4, 6 and 12 months", even to a 6-year-old.
  if (on3DosePath && given === 1) {
    const gate = menacwyInfantNextDoseGate({ d1AgeM, d2AgeM, given });
    const elapsed = intervalElapsed(lastDate, gate.minIntervalDays, today);
    return rec({ vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Dose 2 of 3 (${why}, dose 2 at ≥${monthsLabel(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS)})`,   // P14 (review v10)
      doseNum: 2, seriesTotal: 3, boosterSummary: boosterSummaryText,
      dueToday: elapsed,
      earliestNextDate: elapsed ? null : earliestGatedDate(lastDate, gate, today, am),
      minIntervalDays: gate.minIntervalDays,
      brands: MENACWY_INFANT_SERIES_BRANDS,
      note: {
        lead: `Dose 2 is due at least ${weeksLabel(gate.minIntervalDays)} after dose 1 [c].`,
        detail: `Given at 7 months or older, it leaves one final dose, at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} later and not before ${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} of age. No fourth dose is needed.`,
      },
      noteCites: [cite('cdcChildAcwyInfantSeries')],
      boosterCites: infantBoosterCites,
      refs });
  }

  // D6: if on the 3-dose shortcut path and 2 doses given, next is the completing dose (D3).
  if (on3DosePath && given === 2) {
    // P0-1: routed through the same gate as every other infant dose. The
    // numbers are unchanged (this branch was already right); what changes is
    // that they now come from one place, and the advertised date respects the
    // age floor instead of showing the interval alone.
    const shortcutGate = menacwyInfantNextDoseGate({ d1AgeM, d2AgeM, given });
    const elapsed = intervalElapsed(lastDate, shortcutGate.minIntervalDays, today);
    const ageFloor = am >= shortcutGate.minAgeMonths;
    return rec({ vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Dose 3 of 3 (${why}, dose 2 at ≥${monthsLabel(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS)})`,
      doseNum: 3, seriesTotal: 3, boosterSummary: boosterSummaryText,
      dueToday: elapsed && ageFloor,
      earliestNextDate: (elapsed && ageFloor) ? null : earliestGatedDate(lastDate, shortcutGate, today, am),
      minIntervalDays: shortcutGate.minIntervalDays,
      brands: MENACWY_INFANT_SERIES_BRANDS,
      note: {
        lead: `This final dose is due at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} after dose 2, and not before ${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} of age [c].`,
        detail: 'Dose 2 was given at 7 months or older, so this series completes in three doses rather than four. No fourth dose is needed.',
      },
      noteCites: [cite('acwyInfantHighRisk7to23mo')],
      boosterCites: infantBoosterCites,
      refs });
  }

  // H1: Completion guards — detect when the infant series is done and transition to boosters.
  // 7–23m start (2-dose primary): complete at given >= 2, then boosters.
  // 2–6m start standard path (4-dose: primary at 2/4/6m + booster at 12m): complete at given >= 4.
  // (The 3-dose shortcut path is handled above at given === 2.)
  // M5: 2-dose primary for a 7–23-month start (was `given >= 3`, which asked for a
  // third primary dose CDC does not want and held the booster back behind it).
  // P1-3 (2026-09-15): was `d1WasInfant7to11 ? given >= 2 : given >= 4`, a
  // hand-written restatement of the series length that omitted the 3-dose
  // shortcut entirely -- so a patient handed "Dose 3 of 3" was asked for a
  // fourth dose at their next visit. Deriving it from the one function that
  // owns the answer makes card, follow-up card and validator agree by
  // construction, which is the whole point of seriesTotals.js.
  const infantSeriesTotal = menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM });
  const seriesComplete = given >= infantSeriesTotal;
  if (seriesComplete) {
    // Cadence: the first booster keys off the age at the LAST primary dose
    // (CLAUDE.md, "Booster Cadence"; the validator's ACWY-HIGHRISK-BOOSTER-GAP
    // row does the same): under 7 → 3 years, 7 or older → 5; later boosters 5.
    // T1 (2026-11-19): this read dose 2's age, which was harmless while every
    // infant series finished before 7. A child who fell behind can now finish
    // at 7 or older, and ACIP gives them the 5-year first booster.
    const isFirstInfantBooster = given === infantSeriesTotal;
    const infantCompletionAgeM = ageAtDose(doses[infantSeriesTotal - 1], am, today, dob);
    const infantBoostYears = menacwyBoosterYears({
      isFirstBooster: isFirstInfantBooster, primaryCompletionAgeMonths: infantCompletionAgeM,
    });
    const infantFirstBoost3 = menacwyFirstBoosterYears(infantCompletionAgeM) === 3;
    const infantBoosterCite = infantFirstBoost3 ? cite('boosterBeforeAge7') : cite('boosterAtOrAfterAge7');
    const boostDays = DAYS.years(infantBoostYears);
    const elapsedBoost = calendarIntervalElapsed(lastDate, infantBoostYears * 12, today);
    return rec({ vaccine: 'MenACWY', status: infantOutbreak ? 'exposure' : 'risk-based',
      doseLabel: isFirstInfantBooster ? `First booster (dose ${given + 1}), ${yearsLabel(infantBoostYears)} after the series` : `Booster (dose ${given + 1}), ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} after the last`,   // P17/P19 (review v10)
      // F1 (2026-09-14): was hardcoded 2 for the d1WasInfant7to11 bucket —
      // drifted from the `given >= 3` completion guard just above (should
      // be 3, matching the initial rec's total and menacwyInfantHighRiskTotal()).
      doseNum: given + 1, seriesTotal: menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM }), boosterSummary: `Boosters: every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at risk [c]`,
      dueToday: elapsedBoost,
      earliestNextDate: elapsedBoost ? null : addCalendarYears(lastDate, infantBoostYears),
      minIntervalDays: boostDays,
      brands: menacwyBrands(am),
      // U2: as on the ≥2y booster card, the ongoing cadence belongs to the
      // booster line and the note keeps only the 3-years-not-5 explanation.
      note: isFirstInfantBooster
        ? {
          lead: `${whyTitle} series complete.`,
          detail: infantFirstBoost3
            ? 'The first booster is 3 years later because the series ended before 7 years [c].'
            : 'The first booster is 5 years later because the series ended at 7 years or older [c].',
        }
        : null,
      noteCites: isFirstInfantBooster ? [infantBoosterCite] : [],
      // U2: see the ≥2y booster card -- a later booster's note is now null.
      boosterCites: [infantBoosterCite],
      refs });
  }

  // Standard continuation for 2–6m start series (D2/D3 primary) or 7–11m start (D2)
  //
  // P0-1 (2026-09-17): this line used to read
  //   `d1WasInfant7to11 ? DAYS.weeks(12) : DAYS.weeks(4)`
  // with the age floor keyed off the same flag, and it was wrong twice over.
  // A 2–6-month start got 4 weeks between its early doses where CDC and ACIP
  // both require 8; and its FINAL dose got the same 4 weeks with no age floor
  // at all, so a three-dose six-month-old was told the 12-month dose was due
  // today. The gate answers both questions from the series total, which is the
  // only thing that actually distinguishes the bands.
  const nextGate = menacwyInfantNextDoseGate({ d1AgeM, d2AgeM, given });
  const nextIntervalDays = nextGate.minIntervalDays;
  const elapsed = intervalElapsed(lastDate, nextIntervalDays, today);
  const ageFloorMetActual = nextGate.minAgeMonths == null || am >= nextGate.minAgeMonths;
  // STOP F1 Q9b (owner, 2026-11-17): a series started in the 2-month band is
  // advised at the ROUTINE ages, 4 and 6 months, with the 8-week minimum stated
  // beside them (PneumoVax C10-2). The floor for a dose given is unchanged. Not
  // after a dose that did not count: a repeat is spaced by the minimum (Ruling D).
  const routineAgeM = (!nextGate.isFinalPrimary && d1AgeM != null && d1AgeM < MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS
    && lastDate === last?.date) ? MENACWY_INFANT_ROUTINE_AGE_MONTHS[given + 1] ?? null : null;
  // Held to the floor after a dose that did not count, as the MenB card (A13).
  const infantMinByInterval = addDays(lastDate, nextIntervalDays);
  const infantMinDate = repeatFloorDate && repeatFloorDate > infantMinByInterval ? repeatFloorDate : infantMinByInterval;
  const infantRoutineDate = routineAgeM == null ? null
    : dob ? addCalendarMonths(dob, routineAgeM)
      : earliestGatedDate(lastDate, { minIntervalDays: 0, minAgeMonths: routineAgeM }, today, am);
  const infantAdvised = infantRoutineDate && infantRoutineDate > infantMinByInterval ? infantRoutineDate : null;
  const infantMinClause = infantAdvised
    ? minimumBesideRoutine({ minDate: infantMinDate, advisedDate: infantAdvised, today, minWords: weeksLabel(nextIntervalDays), fmt: fmtDate })
    : '';
  if (infantAdvised) {
    const due = infantAdvised <= today;
    return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose ${given + 1} (${why} series)`, doseNum: given + 1, seriesTotal: menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM }), boosterSummary: boosterSummaryText,
      dueToday: due,
      earliestNextDate: due ? null : infantAdvised,
      minIntervalDays: nextIntervalDays,
      brands: MENACWY_INFANT_SERIES_BRANDS,
      note: {
        lead: `Continue the ${why} series — doses at 2, 4, 6 and 12 months [c].${infantMinClause}`,
        detail: `The final dose of the series comes at ${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} or older, and at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} after the one before it.${outbreakTopUp}`,
      },
      noteCites: [cite('acwyInfantHighRisk2to6mo')],
      boosterCites: infantBoosterCites,
      refs });
  }
  // F1 (2026-09-14): total keyed off d1WasInfant7to11 alone (via
  // menacwyInfantHighRiskTotal), not on3DosePath — the D6 shortcut's own
  // "Dose 3 of 3" rec above already returns before reaching here; once a
  // shortcut patient falls through to THIS fallback (a 4th dose), they're
  // being asked for it because the `given >= 4` default guard above didn't
  // consider them complete at 3, so the total shown here must be 4 too, or
  // this dose's own doseNum would exceed it.
  return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose ${given + 1} (${why} series)`, doseNum: given + 1, seriesTotal: menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM }), boosterSummary: boosterSummaryText,
    dueToday: elapsed && ageFloorMetActual,
    // P0-1: the LATER of the interval and the age floor. This printed the
    // interval alone, so a card that said "not before 12 months of age" still
    // advertised a date months before the first birthday.
    earliestNextDate: (elapsed && ageFloorMetActual) ? null : earliestGatedDate(lastDate, nextGate, today, am),
    minIntervalDays: nextIntervalDays,
    brands: MENACWY_INFANT_SERIES_BRANDS,
    // P0-1: the number is interpolated from the gate the engine just used, so
    // the sentence cannot promise one interval while the validator enforces
    // another — which is exactly what "≥4 weeks between primary doses" did.
    // U2: all three variants ended with the same booster countdown the booster
    // line above already prints -- and on an outbreak card, two sentences before
    // outbreakTopUp says no such countdown exists.
    note: d1WasInfant7to11
      ? {
        lead: `Dose 2 is due at least ${weeksLabel(nextIntervalDays)} after dose 1, and not before 12 months of age [c].`,
        detail: `This is the 2-dose ${why} series. Both conditions have to be met, so the dose falls on whichever comes later — the interval since dose 1, or the first birthday.`,
      }
      : nextGate.isFinalPrimary
        ? {
          lead: `The final dose is due at least ${weeksLabel(nextIntervalDays)} after the previous dose, and not before 12 months of age [c].`,
          detail: `This completes the ${why} series. Both conditions have to be met, so the dose falls on whichever comes later — the interval since the last dose, or the first birthday.${outbreakTopUp}`,
        }
        : {
          lead: `Continue the ${why} series — at least ${weeksLabel(nextIntervalDays)} between the early doses [c].`,
          detail: `The final dose of the series comes at ${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} or older, and at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} after the one before it.${outbreakTopUp}`,
        },
    noteCites: d1WasInfant7to11
      ? [cite('acwyInfantHighRisk7to23mo')]
      : [cite('acwyInfantHighRisk2to6mo')],
    boosterCites: infantBoosterCites,
    refs });
}

// A3: doses given before age 10 do not count toward the routine adolescent series
// (ACIP/immunize.org). The `doses` array passed in here is already the
// analyzeHistory()-filtered "effective" list, which excludes those doses when
// the patient has no current high-risk indication — see validate.js. This
// function only needs the ordinary routine schedule logic.
function menacwyRoutine(am, given, doses, last, today, dob, clockDate = null) {
  // C5/2026-07-24: ACIP 2020 MMWR is the citation. cdcChildMenACWY dropped —
  // it just restates the same MMWR rule (2026-07-23 owner decision).
  // C2/2026-07-24: upgraded from the whole-document chip to the Table 2
  // (routine schedule) anchor -- a precision upgrade, not a Penmenvy fix.
  const refs = ['acip2020Table2'];
  const routineCite = [cite('acwyRoutine1112and16')];
  // Ruling D: see menacwyRec.
  const lastDate = clockDate || last?.date || null;
  // P1-1 (2026-09-17): a dose up to 4 days before the 16th birthday satisfies
  // the routine booster. Before this the validator counted such a dose while
  // this line did not, so the card went on asking for a booster the patient had.
  const hasDoseAt16 = doses.some((d) => {
    const a = ageAtDose(d, am, today, dob);
    return a != null && ageMeetsMinimum(a, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, { doseDate: d.date || null, ageMonths: am, today, dob });
  });
  // F1 (2026-09-14): the routine series is 2 doses (11-12y + the 16y
  // booster) whenever an earlier <16y dose is already on record and owes
  // that booster — otherwise (a dose was given directly at ≥16y, or none
  // yet) ACIP requires only 1. seriesTotal below was hardcoded to 1 in
  // every routine branch, which is the reported bug: a patient with 2+
  // routine doses (e.g. an 82-year-old given 3 adult MenACWY doses) showed
  // "Dose 2 of 1" / "Dose 3 of 1" on the recorded-dose chips.
  // The complement of hasDoseAt16, and it must use the same test or a dose
  // inside the grace window would count as both "at 16" and "before 16".
  const hasDoseBefore16 = doses.some((d) => {
    const a = ageAtDose(d, am, today, dob);
    return a != null && !ageMeetsMinimum(a, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, { doseDate: d.date || null, ageMonths: am, today, dob });
  });
  // Change 2 (2026-07-24): `doses` is already the effective/kept list (A3
  // filters out anything given before age 10 for a healthy patient — see
  // validate.js), so a recorded dose here whose age is <132mo (11y) was
  // necessarily given AT age 10, not before. ACIP/immunize.org: that dose
  // is valid for adolescent dose 1 — no repeat is needed. This only matters
  // for THIS one recorded dose (given === 1); once a second dose exists the
  // schedule has already moved past the single-dose-1 question.
  const doseAgesM = doses.map((d) => ageAtDose(d, am, today, dob));
  const doseAtAge10 = given === 1 && doseAgesM[0] != null && doseAgesM[0] < MENACWY_ROUTINE_DOSE1_AGE_MONTHS;

  // Under 11, with a dose already on file: it can only be the age-10 dose
  // above (nothing younger survives the A3 filter) — route to the same
  // "booster due at 16y" outcome as an 11–15y patient with dose 1 recorded,
  // not "not yet due" (that contradicted the Recorded panel's "Counts" chip).
  if (am < MENACWY_ROUTINE_DOSE1_AGE_MONTHS && given >= 1) {
    return [rec({ vaccine: 'MenACWY', status: 'due', dueToday: false, doseLabel: ROUTINE_16Y_BOOSTER_LABEL, seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, brands: menacwyBrands(am),
      boosterSummary: 'Booster: at age 16 years [c]',
      boosterCites: [cite('acwyRoutine1112and16')],
      earliestNextDate: null,
      ...routineBoosterDueDate(dob, am, today, lastDate),
      // U2: the age-16 booster was stated three times on this card -- the dated
      // banner, the booster line, and this sentence. The banner carries the
      // date, the line carries the fact; the note keeps only what is unique to
      // it, that the age-10 dose counts.
      note: {
        lead: 'The dose given at age 10 counts as the first dose of the adolescent series [c] — no repeat is needed now.',
        detail: 'ACIP counts a dose given at age 10 as dose 1 of the routine adolescent series, so it is not given again at 11–12 years.',
      },
      noteCites: [cite('acwyAge10CountsAsDose1')], refs })];
  }
  if (am < MENACWY_ROUTINE_DOSE1_AGE_MONTHS) {
    return [rec({ vaccine: 'MenACWY', status: 'not-indicated', asksLater: true, doseLabel: 'Not yet due',
      repeatLater: REPEAT_LATER_ACWY_ROUTINE,
      note: {
        lead: 'No routine MenACWY dose is due at this age without a risk factor.',
        detail: 'The routine schedule starts at 11–12 years, with a booster at 16 years [c]. A risk indication would bring vaccination forward: asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak.',
      },
      noteCites: [cite('acwyRoutine1112and16')],
      refs })];
  }
  // 11–15y
  if (am < MENACWY_ROUTINE_BOOSTER_AGE_MONTHS) {
    if (given === 0) {
      // F-2 (owner, 2026-11-18): from 13, CDC lists the first dose under
      // catch-up ("Age 13–15 years: 1 dose now and booster at age 16–18
      // years"). Wording only: same dose, status, badge and booster line.
      const catchup = am >= MENACWY_ROUTINE_CATCHUP_MIN_AGE_MONTHS;
      return [rec({ vaccine: 'MenACWY', status: 'due', doseLabel: catchup ? 'Dose 1 (catch-up, 13–15y)' : 'Dose 1 (routine, 11–12y)', doseNum: 1, seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
        // W3 (owner, 2026-11-19): the 13–15 card's booster line gives CDC's
        // ages, "booster at age 16–18 years", as its "Why this" does; its
        // source mark points at that sentence. 11–12 keeps ACIP's "age 16".
        boosterSummary: catchup ? 'Booster: at age 16–18 years [c]' : 'Booster: at age 16 years [c]', dueToday: true,
        brands: menacwyBrands(am),
        note: {
          lead: catchup
            ? 'A catch-up dose now, then the booster at 16–18 years [c].'
            : 'The routine adolescent dose, given at 11–12 years.',
          detail: 'Without a MenB risk factor, MenB is offered from 16 through 23 years by shared clinical decision-making [c]. A pentavalent dose may be used only when MenACWY and MenB are due at the same visit [c].',
        },
        // U2: "A booster follows at 16 years" was the booster line's sentence.
        boosterCites: [cite(catchup ? 'cdcCatchupAcwyBooster8Weeks' : 'acwyRoutine1112and16')],
        noteCites: catchup ? [cite('cdcCatchupAcwyBooster8Weeks'), cite('menbHealthyPreferredAge1618'), cite('pentavalentWhenBothIndicated')] : [cite('menbHealthyPreferredAge1618'), cite('pentavalentWhenBothIndicated')],
        refs })];
    }
    // already has dose 1 → booster due at 16y (future)
    // B6: this isn't a quiet "done" state — a booster is still coming. Compute
    // an approximate due date (the patient's 16th birthday) so it's not just
    // "complete" with no further information.
    const boosterTiming = routineBoosterDueDate(dob, am, today, lastDate);
    // D2 / N5: when 8 weeks after the last dose given (a set-aside dose
    // included, owner D2, 2026-11-17) is later than the 16th birthday, say so.
    const waitsAfterLastDose = lastDate != null
      && boosterTiming.earliestNextDate === addDays(lastDate, MENACWY_ROUTINE_BOOSTER_MIN_GAP);
    const waitSentence = waitsAfterLastDose
      ? ` The booster waits ${weeksLabel(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} after the last dose given (${fmtDate(lastDate)}) [c].`
      : '';
    const waitCites = waitsAfterLastDose ? [cite('acwyBooster8WeeksAfterDose1')] : [];
    return [rec({ vaccine: 'MenACWY', status: 'due', dueToday: false, doseLabel: ROUTINE_16Y_BOOSTER_LABEL, seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, brands: menacwyBrands(am),
      boosterSummary: 'Booster: at age 16 years [c]',
      boosterCites: [cite('acwyRoutine1112and16')],
      earliestNextDate: null,
      ...boosterTiming,
      // U2: same three-way repeat as the under-11 card above.
      note: doseAtAge10
        ? {
          lead: `Routine dose 1 is recorded, given at age 10 — it counts as the first dose of the series [c].${waitSentence}`,
          detail: 'ACIP counts a dose given at age 10 as dose 1 of the routine adolescent series, so it is not given again at 11–12 years.',
        }
        : {
          lead: `Routine dose 1 is recorded.${waitSentence}`,
          detail: 'Dose 1 of the routine adolescent series is on record, so only the booster remains outstanding.',
        },
      noteCites: [...(doseAtAge10 ? [cite('acwyAge10CountsAsDose1')] : []), ...waitCites], refs })];
  }
  // 16–18y
  if (am < MENACWY_CATCHUP_MIN_AGE_MONTHS) {
    if (hasDoseAt16) {
      return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
        note: {
          lead: 'A MenACWY dose at age 16 years or older completes the routine adolescent schedule [c].',
          detail: 'No further routine doses are needed. A new risk indication would start a schedule of its own: asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak.',
        },
        noteCites: routineCite, refs })];
    }
    // C5/2026-07-24: the given===0 catch-up path cites a DIFFERENT sentence
    // than routineCite — "first dose after 16th birthday needs no booster",
    // not the generic 11-12y/16y routine schedule (citation audit W2 finding).
    // F1 (2026-09-14): given===0 here means the dose about to be given now
    // (at ≥16y) is the patient's first ever — 1 dose suffices, no booster.
    // given>=1 means an earlier <16y dose already exists and this ≥16y dose
    // is the booster it was owed — 2 total.
    // N5 (2026-11-15): the booster waits 8 weeks after dose 1, whatever the age.
    const boosterTiming = given === 0 ? { dueToday: true, earliestNextDate: null } : routineBoosterTiming(lastDate, today);
    return [rec({ vaccine: 'MenACWY', status: given === 0 ? 'catchup' : 'due',
      doseLabel: given === 0 ? 'Dose 1 (catch-up, ≥16y, no booster needed)' : ROUTINE_16Y_BOOSTER_LABEL,
      // P2-2 (2026-09-15): primaryTotal was omitted, so rec() defaulted it to
      // seriesTotal (2 in the booster case) and RecCard's headings would have
      // filed the 16-year BOOSTER under "Primary series". Routine MenACWY is the
      // one schedule whose primary series is shorter than its total.
      doseNum: given + 1, seriesTotal: given === 0 ? 1 : 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, ...boosterTiming, brands: menacwyBrands(am),
      note: given === 0
        ? {
          lead: 'One MenACWY dose now.',
          detail: 'A first dose at 16 years or older needs no booster [c].',
        }
        : boosterTiming.dueToday
          ? {
            lead: 'The routine 16-year booster is due [c].',
            // W2 (owner, 2026-11-19; Phase 0 B16): "before 16 years", true whatever
            // the earlier age — 228 of 264 grid cards had the dose at 13–15.
            detail: 'The dose given before 16 years is the first dose of the series, not the booster, so a booster is due from the 16th birthday.',
          }
          : {
            lead: `The routine 16-year booster is due once ${weeksLabel(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} have passed since dose 1 [c].`,
            detail: `Dose 1 was given less than ${weeksLabel(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} ago. ACIP allows the booster at any time from the 16th birthday, as long as the doses are at least ${weeksLabel(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} apart.`,
          },
      noteCites: given === 0
        ? [cite('acwyFirstDoseAfter16NoBooster')]
        : boosterTiming.dueToday ? routineCite : [cite('acwyBooster8WeeksAfterDose1')],
      refs })];
  }
  // 19–21y: catch-up if no dose at ≥16y; otherwise not indicated
  // D2: Job aid rule — all patients 17–21y with no MenACWY on/after the 16th birthday
  // should receive catch-up Dose 1 of 1. No booster needed when given at ≥16y.
  // Especially important for first-year college students living in residence halls.
  if (am < MENACWY_CATCHUP_MAX_AGE_MONTHS) { // <22y — through 21st birthday (264m = 22y); 'through 21 years' is inclusive to 22nd birthday
    if (!hasDoseAt16) {
      // C5/2026-07-24: cites the 19-21y catch-up sentence, not the generic
      // routine 11-12y/16y schedule the [c] previously pointed to
      // (citation audit W2 finding).
      return [rec({ vaccine: 'MenACWY', status: 'catchup',
        // `doses` holds only counted doses, and since STOP C C1 an undated
        // dose never counts, so "no dose at ≥16y" is always what the
        // counted record shows (G8's "not confirmed" variant was removed).
        doseLabel: given === 0
          ? 'Dose 1 (catch-up, 19–21y)'   // P12 (review v10)
          : 'Dose (catch-up, no dose at ≥16y)',
        // F1 (2026-09-14): given===0 → this first-ever dose (at ≥19y) needs
        // no booster (1 total). given>=1 → an earlier <16y dose owes this
        // catch-up dose as its booster (2 total). Was hardcoded 1 for both.
        // P2-2 (2026-09-15): same omission as the >=16y branch above.
        doseNum: given + 1, seriesTotal: given === 0 ? 1 : 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, dueToday: true, brands: menacwyBrands(am),
        note: {
          lead: 'A single catch-up dose — no MenACWY is confirmed on or after the 16th birthday [c].',
          detail: `Given at 16 years or older it needs no booster. It is especially recommended for first-year college students living in residence halls.`,
        },
        noteCites: [cite('acwyCatchup1921')], refs })];
    }
    // Has a dose at ≥16y → complete
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      note: {
        lead: 'A MenACWY dose at age 16 years or older completes the adolescent schedule [c].',
        detail: 'No further routine doses are needed. A new risk indication would start a schedule of its own: asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak.',
      },
      noteCites: routineCite, refs })];
  }
  // ≥22y healthy, no risk
  // A1: a dose given at ≥16y completes the adolescent schedule regardless of
  // current age — this branch must check hasDoseAt16 like every earlier band.
  if (hasDoseAt16) {
    // F1 (2026-09-14): this is the exact reported-bug branch — an
    // 82-year-old with 3 routine MenACWY doses (11y, 16y, and an extra)
    // landed here with seriesTotal hardcoded to 1, showing "Dose 3 of 1"
    // on the recorded-dose chips. Total is 2 whenever a <16y dose is also
    // on record (it and the ≥16y dose ARE the 2-dose series); 1 when the
    // only dose(s) on record were all given at ≥16y (each independently
    // satisfies ACIP's "no booster needed" rule on its own).
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      note: {
        lead: 'A MenACWY dose at age 16 years or older completed the adolescent schedule [c].',
        detail: 'No further routine doses are needed. A new risk indication would start a schedule of its own: asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak.',
      },
      noteCites: routineCite, refs })];
  }
  // C5/2026-07-24: immunize.org's homeless/halfway-house Q&A page states
  // catch-up runs only "through age 21 years" — so beyond 21 (≥22y), a
  // healthy person with no risk gets neither a routine nor a catch-up dose.
  // Cite immunize.org (whole-page chip) + the 2020 MMWR catch-up sentence
  // as MMWR backing (citation audit W5 finding, owner-confirmed 2026-07-24).
  return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    note: {
      lead: 'MenACWY is not routinely recommended for a healthy adult of 22 or older [c].',
      detail: 'Vaccinate only if a risk indication applies: asplenia, complement deficiency, complement-inhibitor therapy, HIV, microbiologist exposure, travel, military service, or an outbreak.',
    },
    noteCites: [cite('acwyCatchup1921')],
    refs: [...refs, 'immMenACWY'] })];
}

// ── MenB ─────────────────────────────────────────────────────────────────
function menbRec(am, riskIds, doses, today, clockDate = null, repeatFloorDate = null) {
  const given = doses.length;
  const last = doses[given - 1] || null;
  // RULING D (owner, STOP C C2/C9, 2026-11-15): the next dose is timed from
  // the last dose GIVEN — a dose that did not count included — not from the
  // last dose that counted. `clockDate` is validate.js's anchor (read, never
  // recomputed here); dose numbers and totals still come from `doses`, the
  // counted list. CDC: "The repeat dose should be spaced after the invalid
  // dose by the recommended minimum interval."
  // NOT used for the healthy 6-month line from dose 1, a series-length line
  // (`lastCountedDate`); the 4-week floor after an uncounted dose is applied
  // to every card afterwards (applyRepeatFloor).
  const lastDate = clockDate || last?.date || null;
  const lastCountedDate = last?.date || null;
  // M3: anchor family on the first KEPT dose with a known brand (mirrors validate.js)
  // Do not use doses[0]?.brand — D1 may be unknown while a later dose establishes the family.
  const family = menbFamily((doses.find(d => d.brand)?.brand) || '');
  const highRisk = hasMenbRisk(riskIds);
  // 2026-07-24: cdcAdultMening dropped from the high-risk default — it just
  // restates the same MMWR rule (2026-07-23 owner decision).
  const refs = (extra = [], base = highRisk ? ['acip2020'] : ['cdcChildMenB']) => collectRefs(riskIds, extra, base);

  // MenB is only licensed ≥10y.
  if (am < MENB_MIN_AGE_MONTHS) {
    if (highRisk) {
      return [rec({ vaccine: 'MenB', status: 'not-indicated', asksLater: true, doseLabel: `Not yet due (from ${ageYears(MENB_MIN_AGE_MONTHS)} years)`,   // P21 (review v10)
     
        repeatLater: REPEAT_LATER_MENB_HIGH_RISK,
        note: {
          lead: `MenB is licensed from age ${ageYears(MENB_MIN_AGE_MONTHS)} years, so nothing is due yet.`,
          detail: `This patient has a high-risk indication, so track them for the ${MENB_HIGHRISK_TOTAL}-dose high-risk MenB series once they reach age ${ageYears(MENB_MIN_AGE_MONTHS)}.`,
        }, refs: refs() })];
    }
    return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not indicated',
      note: {
        lead: 'MenB is not indicated at this age without a qualifying risk factor.',
        detail: `MenB vaccines (Bexsero, Trumenba, Penmenvy, Penbraya) are FDA-licensed from age ${ageYears(MENB_MIN_AGE_MONTHS)} years [c]. From ${ageYears(MENB_HEALTHY_MIN_AGE_MONTHS)} through ${ageYears(MENB_HEALTHY_MAX_AGE_MONTHS) - 1} years MenB may be given under shared clinical decision-making. Between ${ageYears(MENB_MIN_AGE_MONTHS)} and ${ageYears(MENB_HEALTHY_MIN_AGE_MONTHS) - 1} years it is indicated only for asplenia, complement deficiency, complement-inhibitor therapy, microbiologist exposure, or a serogroup B outbreak [c].`,
      },
      // C5/2026-07-24: consolidate — replace the lone "CDC MenB Notes"
      // whole-page chip with the exact 2020 MMWR licensure sentence
      // (citation audit finding).
      // E2 (2026-11-19): the 10–15 list names all five ACIP groups, a
      // serogroup B outbreak included, and cites ACIP's sentence.
      noteCites: [cite('menbLicensedAge1025'), cite('acip2020MenbRiskGroups')],
      refs: refs([], ['acip2020']) })];
  }

  // Pregnancy deferral (unless an overriding high-risk indication applies).
  // C5/2026-07-24: base swapped from cdcChildMenB to acip2020 — the
  // deferral sentence itself is 2020 MMWR-sourced (citation audit finding).
  // M11 (2026-09-15), cross-repo parity with vaxapp: pregnancy does not only
  // defer. Where an increased-risk indication DOES apply, ACIP still frames the
  // dose as a judgement call, not a routine one -- "unless the woman is at
  // increased risk and, after consultation with her health care provider, the
  // benefits of vaccination are considered to outweigh the potential risks"
  // (ACIP 2020 MMWR 69(RR-9), "Pregnancy and Lactation", fetched live from
  // cdc.gov 2026-09-15). shouldDeferMenB() is false for those patients, so they
  // dropped through to the ordinary high-risk cards with pregnancy unmentioned.
  const menbPregnancyCaveat = (riskIds.includes('pregnancy') && !shouldDeferMenB(riskIds))
    ? ' Pregnancy: safety data for MenB in pregnancy are limited. Offered because of increased risk. Discuss the benefit and potential risk before giving it.'
    : '';
  if (shouldDeferMenB(riskIds)) {
    return [rec({ vaccine: 'MenB', status: 'deferred', doseLabel: 'Defer during pregnancy', seriesTotal: highRisk ? 3 : 2,
      note: {
        lead: 'MenB is generally deferred during pregnancy [c].',
        detail: 'Safety data in pregnancy are limited. A patient at increased risk is the exception and may be vaccinated: asplenia, complement deficiency, complement-inhibitor therapy, microbiologist exposure, or a serogroup B outbreak.',
      },
      noteCites: [cite('menbPregnancyDeferral')],
      refs: refs([], ['acip2020']) })];
  }

  // ── High-risk: 3-dose 0/1–2/6 primary + boosters ─────────────────────────
  if (highRisk) {
    // P1-2 (2026-09-17): the length of this series is not always 3. If dose 2
    // landed six months or more after dose 1, CDC says dose 3 is not needed.
    // The total comes from the one function that owns it, so the card, the
    // follow-up card and the validator agree by construction — the card used
    // to hand a finished patient "Dose 3 of 3".
    const hrSeries = menbSeriesInfo({ highRisk: true, doses });
    // D10 (owner, 2026-11-17): a serogroup B outbreak with no other MenB risk
    // gets ONE booster, at least 1 year after the primary series. ACIP 2020
    // Table 8 (read live 2026-11-17): "Single dose if ≥1 yr after MenB primary
    // series completion". The "every 2–3 years" boosters are Tables 4, 5 and 7
    // (complement, asplenia, microbiologists) and stay theirs.
    const outbreakOnly = outbreakIsTheOnlyBoosterReason('MenB', riskIds);
    const seriesBoosterLine = (afterWhat) => (outbreakOnly
      ? `Booster: 1 dose, ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the primary series, if outbreak risk continues`
      : afterWhat);
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: 'Dose 1 of 3 (high-risk series)', doseNum: 1, seriesTotal: 3, boosterSummary: seriesBoosterLine(`Boosters: ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk`), dueToday: true,
        family, brands: menbBrands(family),
        note: {
          lead: 'A three-dose MenB series at 0, 1–2 and 6 months [c].',
          detail: `Use one product for every dose: Bexsero (or Penmenvy), or Trumenba (or Penbraya).${menbPregnancyCaveat}`,
        },
        // C5/2026-07-24: ACIP Oct 2024 MMWR (mm7349a3) states this 3-dose
        // schedule explicitly and supersedes the 2020 MMWR's brand-split
        // table for both antigen families — cdcRecommendations dropped
        // (citation audit finding).
        noteCites: [cite('menbHighRisk3DoseSchedule')],
        refs: refs(['cdcComplementInhibitor', 'mm7349a3']) })];
    }
    if (given === 1) {
      // STOP F1 Q9a (owner, 2026-11-17): advise the ROUTINE date (1 month after
      // dose 1) and state the 4-week minimum beside it, as PneumoVax C10-2. The
      // floor for a dose given is the rule table's, unchanged. Not after a dose
      // that did not count: a repeat is spaced by the minimum (Ruling D).
      const minDate = addDays(lastDate, MENB_HIGHRISK_D2_GAP);
      const routineDate = lastDate === lastCountedDate ? addCalendarMonths(lastDate, MENB_HIGHRISK_D2_ROUTINE_MONTHS) : null;
      const advisedDate = routineDate && routineDate > minDate ? routineDate : minDate;
      const due = advisedDate <= today;
      // The earliest date stated is also held to the 4-week floor after a dose
      // that did not count (a wrong-family dose, E2): the grace decides what is
      // accepted, never what is advised (A13).
      const statedMin = repeatFloorDate && repeatFloorDate > minDate ? repeatFloorDate : minDate;
      const minClause = minimumBesideRoutine({ minDate: statedMin, advisedDate, today, minWords: weeksLabel(MENB_HIGHRISK_D2_GAP), fmt: fmtDate });
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 2 of 3 (high-risk${family ? `, ${MENB_PRODUCT_BY_FAMILY[family]}` : ''})`, doseNum: 2, seriesTotal: 3, boosterSummary: seriesBoosterLine(`Boosters: ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk`),
        dueToday: due, earliestNextDate: due ? null : advisedDate, minIntervalDays: MENB_HIGHRISK_D2_GAP,
        canGiveToday: !due && statedMin <= today,
        family, brands: menbBrands(family),
        note: {
          // P46 (review v10): one sentence; the earliest-date line, when there is
          // one, stays on the card (Q10 list).
          lead: minClause
            ? `Give dose 2 1–2 months after dose 1, with the same MenB product, and dose 3 about 6 months after dose 1.${minClause}`
            : `Give dose 2 1–2 months after dose 1 (minimum ${weeksLabel(MENB_HIGHRISK_D2_GAP)}), with the same MenB product, and dose 3 about 6 months after dose 1.`,
          detail: menbPregnancyCaveat.trim(),
        },
        refs: refs(['mm7349a3']) })];
    }
    // Only reachable while the series really is three doses long; a 2-dose
    // high-risk series falls straight through to the booster branch below.
    if (given === 2 && hrSeries.total === 3) {
      // C1: D3 requires BOTH ≥6 months from D1 AND ≥4 months from D2.
      // The earlier check (engine vs validator disagreement) only used D1.
      // Now gate on both; earliestNextDate = later of the two floors.
      const d1Date = doses[0]?.date ?? null;
      const d2Date = doses[1]?.date ?? null;
      // M1 / M1b (owner, 2026-11-20): after a dose 3 that did not count (the
      // clock, validate.js's anchor, is then later than dose 2), the repeat's
      // ROUTINE date is the latest of 4 months after that dose, 4 months after
      // dose 2 and 6 months after dose 1. ACIP mm7349a3: "the dose should be
      // repeated ≥4 months after the last dose, unless the third dose was
      // administered ≥6 months after the first dose".
      const invalidD3Date = clockDate && d2Date && clockDate > d2Date ? clockDate : null;
      // P0-4 (2026-09-15): calendar months, matching validate.js's gates for
      // the same two rules.
      const fromD1 = d1Date ? calendarIntervalElapsed(d1Date, MENB_HIGHRISK_D3_MONTHS_FROM_D1, today) : true;
      const fromD2 = d2Date ? calendarIntervalElapsed(d2Date, MENB_HIGHRISK_D3_MONTHS_FROM_D2, today) : true;
      const fromInvalid = invalidD3Date ? calendarIntervalElapsed(invalidD3Date, MENB_HIGHRISK_D3_MONTHS_FROM_D2, today) : true;
      const elapsed = fromD1 && fromD2 && fromInvalid;
      // Compute the latest of the earliest dates (whichever constraint binds).
      const e1 = d1Date ? addCalendarMonths(d1Date, MENB_HIGHRISK_D3_MONTHS_FROM_D1) : null;
      const e2 = d2Date ? addCalendarMonths(d2Date, MENB_HIGHRISK_D3_MONTHS_FROM_D2) : null;
      const e3 = invalidD3Date ? addCalendarMonths(invalidD3Date, MENB_HIGHRISK_D3_MONTHS_FROM_D2) : null;
      const routineDate = [e1, e2, e3].filter(Boolean).sort().pop() ?? null;
      const earliestNextDate = elapsed ? null : routineDate;
      // M1b/M1c/M1d: the earliest date the repeat would count, stated beside
      // the routine date — 4 months after the invalid dose (M1d, 2026-11-21:
      // the 6-months-after-dose-1 "unless" decides only the first dose 3, so
      // it never brings the repeat sooner), and never under the 4-week floor
      // after a dose that did not count (MENB-REPEAT-GAP). The grace decides
      // what is accepted, never what is advised (A13).
      let repeatClause = '';
      let repeatMin = null;
      if (invalidD3Date) {
        repeatMin = e3;
        let minWords = `${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after the invalid dose`;
        if (repeatFloorDate && repeatFloorDate > repeatMin) {
          repeatMin = repeatFloorDate;
          minWords = `${weeksLabel(MENB_REPEAT_MIN_INTERVAL)} after the invalid dose`;
        }
        repeatClause = minimumBesideRoutine({ minDate: repeatMin, advisedDate: routineDate, today, minWords, fmt: fmtDate });
      }
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 3 of 3 (high-risk${family ? `, ${MENB_PRODUCT_BY_FAMILY[family]}` : ''})`, doseNum: 3, seriesTotal: 3, boosterSummary: seriesBoosterLine(`Boosters: ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk`),
        dueToday: elapsed, earliestNextDate,
        minIntervalDays: DAYS.months(MENB_HIGHRISK_D3_MONTHS_FROM_D2), // min from D2 (D1 floor shown in note)
        // MQ6-h (owner, 2026-11-21, "Dose 2 only"): a repeated dose 3 does not
        // carry canGiveToday, so the combined shot never puts it in before its
        // advised date. The note still states the earliest valid date.
        family, brands: menbBrands(family),
        // U2: the "boost 1 year later, then every 2-3 years" tail is the booster
      // line's sentence, four lines above it on the same card.
      note: invalidD3Date
        ? {
          // M1 (owner, 2026-11-20): the repeat of a dose 3 that did not count.
          lead: `Repeat dose 3 at least ${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after the invalid dose of ${fmtDate(invalidD3Date)}, and at least ${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1 [c].${repeatClause}`,
          // M1d (owner, 2026-11-21): the old line here ("A repeat given at least
          // 6 months after dose 1 counts even if sooner than 4 months after the
          // invalid dose") is no longer true, and is gone.
          detail: menbPregnancyCaveat.trim(),
        }
        : {
          lead: `Dose 3 is due at least ${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1, and at least ${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2 [c].`,
          detail: `That is the 0 / 1–2 / 6-month schedule ACIP gives a high-risk MenB series. Both intervals have to be met, so the dose falls on whichever comes later.${menbPregnancyCaveat}`,
        },
        noteCites: [cite(invalidD3Date ? 'menbHighRiskEarlyD3Unless' : 'menbHighRisk3DoseSchedule')],
        refs: refs(['mm7349a3']) })];
    }
    // M1 (owner, 2026-11-20): there is no "Dose 4 of 4" card any more. An
    // early dose 3 does not count, so the patient is still at given === 2 and
    // the card above times the repeat.
    // Primary complete → boosters. P1-2: "complete" is hrSeries.total, not a
    // literal 3, so a patient whose dose 2 came six months on reaches their
    // first booster after two doses instead of being asked for a third.
    const firstBooster = given === hrSeries.total;
    // D10: the outbreak's one booster has been given — nothing more is owed.
    if (outbreakOnly && !firstBooster) {
      return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete (outbreak booster given)',
        doseNum: given, seriesTotal: hrSeries.total, dueToday: false, earliestNextDate: null,
        family, brands: [],
        note: {
          lead: 'A serogroup B outbreak calls for one MenB booster, at least 1 year after the primary series, and it has been given [c].',
          detail: 'Repeat boosters every 2–3 years are for asplenia, complement deficiency, complement-inhibitor therapy and microbiologists, not for an outbreak.',
        },
        noteCites: [cite('acip2020Table8MenbOutbreakBooster')],
        refs: refs(['mm7349a3']) })];
    }
    const boosterYears = menbHighRiskBoosterYears(firstBooster);
    const intervalDays = DAYS.years(boosterYears);
    const elapsed = calendarIntervalElapsed(lastDate, boosterYears * 12, today);
    return [rec({ vaccine: 'MenB', status: 'risk-based',
      doseLabel: firstBooster ? `First booster (dose ${given + 1}), ${yearsLabel(boosterYears)} after the series` : `Booster (dose ${given + 1}), ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} after the last`,   // P20 (review v10)
      doseNum: given + 1, seriesTotal: hrSeries.total, boosterSummary: outbreakOnly ? 'Booster: 1 dose for this outbreak, no repeat boosters' : `Boosters: every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk`, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addCalendarYears(lastDate, boosterYears), minIntervalDays: intervalDays,
      family, brands: menbBrands(family),
      // U2: "then every 2-3 years while the high-risk condition persists" is
      // the booster line's sentence.
      note: {
        // E3 (2026-11-19): a later booster counts 2–3 years from the previous
        // booster, as its label and due date do; not "every" (U2).
        lead: firstBooster
          ? `A MenB booster, ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the primary series was completed [c].`
          : `A MenB booster, ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} after the previous booster [c].`,
        detail: `Stay in the same antigen family as the primary series — MenB-4C (Bexsero, Penmenvy) and MenB-FHbp (Trumenba, Penbraya) are not interchangeable.${menbPregnancyCaveat}`,
      },
      // D10: an outbreak's one booster cites Table 8, not the "every 2–3
      // years" box, which would contradict the line above it.
      noteCites: [cite(outbreakOnly ? 'acip2020Table8MenbOutbreakBooster' : 'menbHighRiskBoosterCadenceBox')],
      refs: refs(['mm7349a3']) })];
  }

  // ── Healthy 16–23y shared clinical decision-making: 2-dose 0/6 ───────────
  if (am >= MENB_HEALTHY_MIN_AGE_MONTHS && am < MENB_HEALTHY_MAX_AGE_MONTHS) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: 'Dose 1 of 2 (shared clinical decision)', doseNum: 1, seriesTotal: 2, dueToday: true,
        family, brands: menbBrands(family),
        // W4 (owner, 2026-11-19): "A healthy 16–23-year-old may receive MenB by
        // shared clinical decision-making." dropped — it repeated the lead, which
        // the fold puts first in "Why this" (79 → 69 words). "Up to the 24th
        // birthday" still gives the age range.
        note: {
          lead: 'Two MenB doses 6 months apart, by shared clinical decision-making [c].',
          detail: `Preferred age 16–18 years [c], given until the 24th birthday. For faster protection (for example, college entry within 6 months), give three doses at 0, 1–2 and 6 months.${menbPregnancyCaveat}`,
        },
        // C1/2026-07-24: both [c] point at mm7349a3 (its SCDM sentence
        // covers the 16-23y age range and the 0/6-month schedule in one
        // quote) — the old first cite (menbHealthySCDM1623Box, the
        // Penmenvy/mm7501a2 page) mislabeled a generic MenB-4C statement as
        // Penmenvy-specific, and its "preferably 16-18" claim isn't in
        // mm7349a3 so was dropped.
        //
        // M16/2026-09-15: the preference is BACK, now correctly cited. C1 was
        // right that mm7349a3 does not contain it and wrong to conclude it was
        // unsupported — it is verbatim in ACIP 2020 Table 2 ("MenB series at
        // age 16–23 yrs on basis of shared clinical decision-making (preferred
        // age 16–18 yrs)") and still printed in the current CDC schedule notes.
        // mm7349a3 changed the DOSING INTERVAL and is silent on preferred age;
        // silence is not disagreement. The first [c] therefore now points at
        // Table 2 for the age claim, the second still at mm7349a3 for the
        // 0/6-month schedule — one source per claim, as C1 intended.
        // U1 (2026-09-17): ORDER FLIPPED with the lead/detail split. The
        // schedule claim is now the lead's sentence and the preferred-age claim
        // the detail's, and noteCites runs lead-first -- so the 0/6-month
        // source comes first here. One source per claim, as before.
        noteCites: [cite('menbHealthy2Dose0and6'), cite('menbHealthyPreferredAge1618')],
        refs: refs([], ['mm7349a3']) })];
    }
    if (given === 1) {
      // P0-4 (2026-09-15): calendar months, not an averaged 183 days -- and the
      // date shown is the real six-month anniversary, not lastDate + 183 days.
      const elapsed = calendarIntervalElapsed(lastCountedDate, MENB_HEALTHY_D2_MONTHS, today);
      return [rec({ vaccine: 'MenB', status: 'shared-decision', // P15 (review v10): the product, not the antigen family.
        doseLabel: `Dose 2 of 2 (${MENB_PRODUCT_BY_FAMILY[family] || 'same product'})`, doseNum: 2, seriesTotal: 2,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addCalendarMonths(lastCountedDate, MENB_HEALTHY_D2_MONTHS), minIntervalDays: DAYS.months(MENB_HEALTHY_D2_MONTHS),
        family, brands: menbBrands(family),
        note: {
          lead: `Dose 2 is due at least ${monthsLabel(MENB_HEALTHY_D2_MONTHS)} after dose 1.`,
          detail: `Two doses ${monthsLabel(MENB_HEALTHY_D2_MONTHS)} apart complete the series, for both Bexsero and Trumenba. If dose 2 is given earlier than that, a third dose is needed at least ${monthsLabel(MENB_HEALTHY_RESCUE_MONTHS)} after it [c].${menbPregnancyCaveat}`,
        },
        noteCites: [cite('menbRescueDoseRule')],
        refs: refs([], ['mm7349a3']) })];
    }
    if (given === 2) {
      const dose1date = doses[0]?.date;
      const dose2date = doses[1]?.date;
      const d1d2Days = (dose1date && dose2date)
        ? daysBetween(dose1date, dose2date)
        : null;
      // P0-4 (2026-09-15): was `d1d2Days < DAYS.months(6)` (183 days). A series
      // exactly six calendar months apart is 181-184 days, so a correctly given
      // 2-dose series was told it needed a third injection, decided by nothing
      // but which month the patient started in. Must stay in step with
      // seriesTotals.js's menbSeriesInfo(), which makes the same test.
      // STOP C C7: the one shared test (seriesTotals.js), 4-day grace included.
      const needsRescue = menbHealthyDose2Early(dose1date, dose2date);
      if (needsRescue) {
        // Ruling D: from the last dose given — dose 2, or a rescue dose that
        // itself came too soon (validate.js MENB-HEALTHY-RESCUE-DOSE-3-GAP).
        const rescueFrom = clockDate || dose2date;
        const elapsed = calendarIntervalElapsed(rescueFrom, MENB_HEALTHY_RESCUE_MONTHS, today);
        return [rec({
          vaccine: 'MenB', status: 'shared-decision',
          // G1-a-F2 (owner, 2026-11-19): no "rescue" (jargon; ACIP says "a third dose").
          doseLabel: 'Dose 3 of 3 (dose 2 given early)',
          doseNum: 3, seriesTotal: 3, dueToday: elapsed,
          earliestNextDate: elapsed ? null : addCalendarMonths(rescueFrom, MENB_HEALTHY_RESCUE_MONTHS),
          minIntervalDays: DAYS.months(MENB_HEALTHY_RESCUE_MONTHS),
          family, brands: menbBrands(family),
          note: {
            lead: `Dose 2 was given <${monthsLabel(MENB_HEALTHY_D2_MONTHS)} after dose 1.`,
            detail: `It counts. Dose 3 is due ≥${monthsLabel(MENB_HEALTHY_RESCUE_MONTHS)} after dose 2 [c].${menbPregnancyCaveat}`,
          },
          // C5: an interrupted/off-schedule series is a "does this old dose
          // count" practical judgment call -- immunize.org's Ask the
          // Experts leads here, ahead of the general schedule source.
          noteCites: [cite('menbRescueDoseRule')],
          refs: ['immMenB', ...refs([], ['mm7349a3'])],
        })];
      }
      return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete (2-dose series)', family, seriesTotal: 2,
        note: {
          lead: 'The healthy 2-dose MenB series is complete.',
          detail: `The two doses were at least 6 months apart. No booster is recommended unless a high-risk indication develops.${menbPregnancyCaveat}`,
        },
        refs: refs([], ['mm7349a3']) })];
    }
    if (given >= 3) {
      return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete (accelerated 3-dose series)', family, seriesTotal: 3,
        note: {
          lead: 'The accelerated 3-dose MenB series is complete [c].',
          detail: `No booster is recommended unless a high-risk indication develops.${menbPregnancyCaveat}`,
        },
        noteCites: [cite('menbAcceleratedRapidProtection')],
        refs: refs([], ['mm7349a3']) })];
    }
  }

  // Healthy outside 16–23y → not routinely indicated
  // C1/2026-07-24: [c] points at mm7349a3 (the same source as the
  // shared-decision recs above), not the mislabeled Penmenvy page; the
  // "preferably 16-18" claim isn't in mm7349a3 so was dropped.
  return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    // Under 16 the schedule offers MenB from 16, so this card asks LATER (STOP
    // E1 Q8): a dose 1–4 days before 16 counts under CDC's grace, though this
    // card is what the patient had that day.
    asksLater: am < MENB_HEALTHY_MIN_AGE_MONTHS,
    ...(am < MENB_HEALTHY_MIN_AGE_MONTHS ? { repeatLater: REPEAT_LATER_MENB_HEALTHY } : {}),
    note: am < MENB_HEALTHY_MIN_AGE_MONTHS
      // M16: the pre-16 card names the preferred age too, so a clinician
      // planning ahead knows the conversation is best had at 16-18 rather than
      // only that it becomes possible at 16.
      ? {
        lead: 'MenB is not routine at this age. A healthy patient may choose it from 16 years.',
        detail: 'From 16 through 23 years, MenB is given by shared clinical decision-making. The preferred age is 16 through 18 years [c].',
      }
      : {
        lead: 'MenB is not routinely recommended for a healthy adult of this age [c].',
        detail: 'The shared-decision window runs from 16 years through the 24th birthday. Past it, vaccinate only for a high-risk indication.',
      },
    // M16: the pre-16 branch's claim is the preferred-age one, so it cites
    // Table 2; the post-23 branch's claim is the window, which Table 2 also
    // states in the same sentence.
    noteCites: [cite('menbHealthyPreferredAge1618')],
    family, refs: refs([], ['mm7349a3']) })];
}

// Merge risk-driven ref keys with defaults, de-duplicated, preserving order.
function collectRefs(riskIds, extra, defaults) {
  const out = [];
  for (const id of riskIds) {
    for (const k of RISK_BY_ID[id]?.refs ?? []) if (!out.includes(k)) out.push(k);
  }
  for (const k of [...extra, ...defaults]) if (!out.includes(k)) out.push(k);
  return out;
}

// Hard-stop exclusion (hematopoietic cell transplant / CAR-T therapy / B-cell
// malignancy / B-cell-depleting therapy) — too heterogeneous for one safe
// recipe. Verified live against CDC's ACIP General Best Practice Guidelines,
// "Altered Immunocompetence" page, 2026-09-12.
//
// 2026-10-16: shortened, and it stops describing the software. The four
// authorities are named in WORDS, deliberately not linked (owner decision 6 of
// the hard-stop plan): a sentence naming ASCO, NCCN, IDSA and CDC is still
// true in 2030; a URL to the 2024 ASCO guideline is not, and every refs.js
// entry is an annual re-read enforced by citation-freshness.test.js.
//
// MIRRORED: PneumoVax's EXCLUSION_MESSAGE is byte-identical to this one, and
// PneumoVax's regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js
// compares the two files. The non-breaking hyphens (U+2011) are load-bearing
// twice over — they stop "CAR-T" and "B-cell" breaking mid-term on a phone,
// and the mirror test compares bytes.
const EXCLUSION_MESSAGE = 'Revaccination after hematopoietic cell transplant, '
  + 'CAR‑T therapy, or B‑cell–depleting therapy follows a '
  + 'transplant‑ or therapy‑specific protocol, not age‑based '
  + 'scheduling, and some live vaccines may be contraindicated. Follow your '
  + 'institutional protocol or current national guidance (ASCO, NCCN, IDSA, '
  + 'CDC).';

// The half of the pentavalent note that is true either way: whichever brand is
// given, the REST of the MenB series has to stay in that brand's antigen family.
// G1-a (owner, STOP G1, 2026-11-18, packet W2): answer first, no semicolons.
const PENTAVALENT_FAMILY_LOCK = 'After Penmenvy, continue MenB with Bexsero or '
  + 'Penmenvy. After Penbraya, continue with Trumenba or Penbraya.';   // P52 (review v10)

// ── impossible P1-2: questioning a tick-box the age makes unlikely ───────
//
// A newborn could be ticked as a first-year college student in a residence
// hall, and the app answered "1 dose", due today, with no product listed at
// all (no MenACWY vaccine is licensed under 2 months). The app already knew
// these were adult indications — it excludes them from the infant series for
// exactly that reason — and used that knowledge to pick a schedule but never
// to question the tick.
//
// Owner decision 2026-09-17, reconfirmed 2026-09-18: a quiet note, NEVER a
// block. ACIP prints no age floor in the recommendation text for any of these
// indications, so refusing to answer would invent guidance ACIP never wrote.
// The dose still shows as due; this note sits beside it and says nothing more
// than "check the age".
//
// The floors, and which of them may cite a source, live in riskFactors.js
// beside the tick-box definitions. This function only turns them into English.
function riskAgeCheck(riskIds, am) {
  const doubted = ageImplausibleRisks(riskIds, am);
  if (doubted.length === 0) return { note: null, cites: [] };

  const lines = [];
  const cites = [];
  for (const r of doubted) {
    // Only the ACIP-table indications carry a citation; pregnancy's floor is a
    // plausibility judgement, so its line claims no source. The cited ones
    // point at the very table the tick-box already cites, which is where the
    // ">=10 yrs" row is.
    const tableRef = r.refs?.find((k) => k.startsWith('acip2020Table'));
    const years = Math.round(r.minPlausibleAgeMonths / 12);
    if (tableRef) {
      lines.push(`ACIP lists "${r.label}" only for ages ${years} years and over [c].`);
      cites.push(cite(tableRef));
    } else {
      lines.push(`"${r.label}" is very unusual below ${years} years.`);
    }
  }
  return {
    note: {
      lines,
      // The age is stated ONCE, in the footer, rather than at the end of every
      // line: it does not change between lines, and fmtAgeMonths returns words
      // as well as numbers ("Birth", "3 weeks"), which no "...and this patient
      // is X" sentence can absorb grammatically. Driving the live app is what
      // caught that — the first version printed "this patient is Birth."
      footer: `This patient's age is recorded as ${fmtAgeMonths(am)}. `
        + 'Nothing has been withheld and no recommendation has changed. '
        + 'Check that the age and the checkboxes are right.',
    },
    cites,
  };
}

// ── Public API ───────────────────────────────────────────────────────────
// The date of the patient's 16th birthday, for the routine MenACWY booster.
//
// Calendar P1-3 (2026-09-17): this used to be today plus (16 years minus the
// patient's age) converted through an averaged 30.4375-day month. Over 8,400
// (date of birth x today) pairs that landed on the real birthday only 37% of
// the time — one day out in half of all cases, and up to three days out.
//
// When the clinician gave a date of birth, the app now prints the actual
// birthday, which is what the Age step promised in exchange for it. When they
// gave years and months instead, the app genuinely does not know the birthday,
// so the old approximation stands rather than inventing a date that looks exact.
function routineBoosterDate(dob, am, today) {
  if (dob) return addCalendarYears(dob, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS / 12);
  return addDays(today, DAYS.months(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS - am));
}

// N5 (2026-11-15): the date printed under "Booster (16y)" is the LATER of
// the 16th birthday and 8 weeks after the last dose, so a dose 1 given in the
// last weeks before the 16th birthday does not get a booster date inside 8
// weeks of it. An 8-week date is exact (it is counted from a recorded date),
// even when the birthday itself is only estimated.
// PneumoVax owner rule (2026-11-01), applied here at STOP B: "Complete should
// only be used if no additional doses/boosters are needed." The two routine
// "Booster (16y)" cards are therefore status 'due' with nothing due today,
// and the booster date doubles as their next-dose date (earliestNextDate), as
// every other card with a dose coming later has. RecCard shows it once.
function routineBoosterDueDate(dob, am, today, lastDate) {
  const birthday = routineBoosterDate(dob, am, today);
  const afterGap = lastDate ? addDays(lastDate, MENACWY_ROUTINE_BOOSTER_MIN_GAP) : null;
  if (afterGap && afterGap > birthday) return { boosterDueDate: afterGap, boosterDueDateExact: true, earliestNextDate: afterGap };
  return { boosterDueDate: birthday, boosterDueDateExact: !!dob, earliestNextDate: birthday };
}

// RULING D, the floor (owner, STOP C C2 and E1/E2, 2026-11-15). After a dose
// that did not count, no card may ask for the next dose sooner than the
// any-two-doses minimum after it. This is what times:
//   • the repeat of a dose 1 given too young (E1: 4 weeks after it — a
//     deliberate difference from CDC's "on or after the date when the child
//     reaches at least the minimum age", matching PneumoVax);
//   • the next dose after a wrong-family MenB dose (E2: when it would be due
//     from the established family's doses, AND at least 4 weeks after it;
//     ACIP 2020: "a minimum interval of 4 weeks should be used between any 2
//     doses").
// Every other repeat is already timed from the failed dose by the card's own
// clock (`clockDate`), so for those this floor is never the later date. The
// validator's twins: ACWY-ANY-TWO-DOSES-GAP and MENB-REPEAT-GAP. MenACWY's
// floor is 8 weeks since owner answer C11 (4 weeks only for E1).
function applyRepeatFloor(recs, uncountedDate, minDays, today) {
  if (!uncountedDate) return recs;
  const floor = addDays(uncountedDate, minDays);
  if (floor <= today) return recs;
  return recs.map((r) => {
    const asks = r.dueToday || r.earliestNextDate;
    if (!asks || (r.earliestNextDate && r.earliestNextDate >= floor)) return r;
    const why = ` Not before ${fmtDate(floor)}: ${weeksLabel(minDays)} after the invalid dose of ${fmtDate(uncountedDate)}.`;
    return {
      ...r,
      dueToday: false,
      earliestNextDate: floor,
      note: r.note && typeof r.note === 'object'
        ? { ...r.note, lead: `${r.note.lead}${why}` }
        : r.note,
    };
  });
}

// D7 (owner, 2026-11-17): every outbreak card says the booster depends on the
// outbreak risk continuing — MenACWY and MenB, at every age — as the teen
// MenACWY outbreak card already did (B-2). Applied here, once, after each card
// is built, so no path is missed. Only when the outbreak is the ONLY reason
// for boosters: another ticked risk (asplenia, complement, HIV, travel, a
// microbiologist) keeps its own wording. Dates are never changed here.
// immunize.org P2018 (10/19/2026, read live 2026-11-17): boosters "as long as
// risk remains".
const OUTBREAK_ID = { MenACWY: 'outbreak_acwy', MenB: 'outbreak_b' };
function outbreakIsTheOnlyBoosterReason(vaccine, riskIds) {
  if (!riskIds.includes(OUTBREAK_ID[vaccine])) return false;
  return !riskIds.some((id) => {
    if (id === OUTBREAK_ID[vaccine]) return false;
    const r = RISK_BY_ID[id];
    if (!r) return false;
    // MenACWY: medical (primary2) and travel/microbiologist (single+boost) have
    // their own boosters; military and college ('single') do not change it.
    return vaccine === 'MenACWY'
      ? (r.menacwyClass === 'primary2' || r.menacwyClass === 'single+boost')
      : r.menbClass === 'highrisk';
  });
}
const OUTBREAK_CONTINUES = 'while outbreak risk continues';
function outbreakWording(cards, applies) {
  if (!applies) return cards;
  return cards.map((c) => {
    const out = { ...c };
    if (typeof c.boosterSummary === 'string') {
      out.boosterSummary = c.boosterSummary
        .replace(/while at (?:high )?risk(?: \(ongoing\))?/, OUTBREAK_CONTINUES);
    }
    // Keep the label's own detail ("first booster, 3 years after primary")
    // and add the caveat; a label that already names the outbreak is left, and
    // so is the routine 16-year booster (its own ACIP rule, not an outbreak
    // booster; Port Phase 5, owner 2026-11-18).
    const label = c.doseLabel ?? '';
    // Review v10: "First booster (dose N), …" is a booster title too.
    if (/^(First booster|Booster)\b/.test(label) && !/outbreak/.test(label) && label !== ROUTINE_16Y_BOOSTER_LABEL) {
      out.doseLabel = `${label} ${c.dueToday ? 'for this outbreak' : 'if outbreak risk continues'}`;
    }
    return out;
  });
}

// D8 (owner, 2026-11-17; E2's unbuilt option): after one dose of each MenB
// product, the card still finishes with the first product (E2) and adds one
// line — the date to finish with the other product instead. ACIP 2020 (read
// live 2026-11-17): "If 2 doses were administered using different MenB
// products, one product should be selected for administration of an
// additional dose at an appropriate interval to ensure valid completion of a
// MenB series; the dose from the product not selected for series completion
// should be considered invalid". The other product's date is the engine's own
// answer for a record holding only that product's dose — never re-derived.
const MENB_PRODUCT_BY_FAMILY = { '4C': 'Bexsero', FHbp: 'Trumenba' };
function withMenbSwitchLine(cards, history, am, riskIds, today) {
  const sorted = history.sortedDoses ?? [];
  const per = history.perDose ?? [];
  if (sorted.length !== 2 || !per[1]?.wrongFamily) return cards;
  const [first, other] = sorted;
  const firstFam = menbFamily(first.brand);
  const otherFam = menbFamily(other.brand);
  if (!first.date || !other.date || !firstFam || !otherFam || firstFam === otherFam) return cards;
  const card = cards[0];
  if (!card || !(card.dueToday || card.earliestNextDate) || !card.note || typeof card.note !== 'object') return cards;
  const alt = menbRec(am, riskIds, [other], today, other.date)[0];
  if (!alt || !(alt.dueToday || alt.earliestNextDate) || !alt.doseNum) return cards;
  // F2b (owner, 2026-11-18): the date is the advised one (Q9a), so it says
  // "due", as the card's "Next dose due <date>" does — never "from".
  const when = alt.dueToday ? 'today' : `due ${fmtDate(alt.earliestNextDate)}`;
  const line = ` Or complete the series with ${MENB_PRODUCT_BY_FAMILY[otherFam]}: dose ${alt.doseNum} ${when}, `
    + `and the ${MENB_PRODUCT_BY_FAMILY[firstFam]} dose no longer counts [c].`;
  // In the lead (always shown, not behind "Why this"): a clinic that stocks
  // only the other product needs to see it. The lead's citations come first in
  // noteCites, so the new one goes right after them.
  const cites = [...(card.noteCites ?? [])];
  const leadCiteCount = (card.note.lead.match(/\[c\]/g) || []).length;
  cites.splice(leadCiteCount, 0, cite('acip2020MenbMixedProductsSelectOne'));
  return [{
    ...card,
    note: { ...card.note, lead: `${card.note.lead}${line}` },
    noteCites: cites,
  }, ...cards.slice(1)];
}

// STOP B B-1 (owner 2026-11-15, extended 2026-11-17): the 4-day grace at an
// age line that picks the MenACWY schedule (3 months, 7 months, 2 years and
// 16 years — see menacwyGraceLine in intervals.js) is used ONLY when it means fewer doses owed.
// PneumoVax's §A-GRACE12-HELPS ruling, carried over: read the whole history
// twice — every such dose at its real age, and every such dose as given ON its
// line — and keep the reading whose MenACWY card owes FEWER doses. A tie keeps the
// real age (what the app did before B-1).
//
// Whole readings, never a mix: the MenACWY card, its dose chips and the record
// panel all come from the one reading kept, so they cannot disagree. A dose
// read on its birthday also means the patient has reached that birthday at any
// visit on or after the dose (menacwyAgeFloorMonths, MenACWY only). Plan patient: a
// travel baby given Menveo 2 days before 7 months owed four doses, and two on
// the 7-month day; now two. A dose 5+ days early, or with no date of birth on
// file, is never read at the line.
// Port Phase 6.3, Q10 (owner, 2026-11-19, "Full PneumoVax fold"): the app's
// answer is the engine's, with each card's note folded (noteFold.js) as the
// very last step. A test pinning how a sentence is WRITTEN, or which citation
// it carries, may read `recommendBeforeFold`; the fold has its own guard
// (regression-2026-11-19-q10-result-page-fold.test.js).
export function recommend(input) {
  return foldResult(recommendBeforeFold(input));
}

export function recommendBeforeFold(input) {
  const asGiven = recommendOneReading(input);
  if (!input?.dob || asGiven.excluded) return asGiven;
  const originals = new Map();
  const today = asGiven.meta.today;
  // A dose read as given ON a birthday means the patient has reached that
  // birthday by any later visit — including the visit the dose was given at,
  // when the patient is still 1–4 days short of it. Without this the dose-day
  // card kept the younger schedule and changed a few days later with no new
  // dose (CDC 2013-0488: "Booster (16y)" on the day, "Complete" after).
  let ageFloor = 0;
  const atLines = (input.menacwyDoses ?? []).map((d) => {
    const line = menacwyGraceLine(d, input.dob);
    if (line == null) return d;
    const copy = { ...d, ageMonths: line };
    originals.set(copy, d);
    if (d.date <= today) ageFloor = Math.max(ageFloor, line);
    return copy;
  });
  if (originals.size === 0) return asGiven;
  const atLine = recommendOneReading({ ...input, menacwyDoses: atLines, menacwyAgeFloorMonths: ageFloor });
  const owedAtLine = menacwyDosesOwed(atLine);
  const owedAsGiven = menacwyDosesOwed(asGiven);
  if (owedAtLine >= owedAsGiven) return asGiven;
  // The copies read at the line carry `ageMonths`, which the record panel would
  // print as the dose's age. Hand the panel the doses as the clinician typed them.
  const restore = (d) => originals.get(d) ?? d;
  const h = atLine.history.MenACWY;
  return {
    ...atLine,
    history: {
      ...atLine.history,
      MenACWY: { ...h, sortedDoses: h.sortedDoses.map(restore), effective: h.effective.map(restore) },
    },
  };
}

// How many MenACWY doses the cards still ask for, counting the dose due next:
// "Dose 2 of 4" owes 3, a first booster after a 1-dose series ("dose 2 of 1")
// owes 0 more primary doses, "complete" owes 0. An open card with no dose
// number ("Booster (16y)") still asks for a dose: it owes 1.
function menacwyDosesOwed(result) {
  let owed = 0;
  for (const c of result.menacwy ?? []) {
    if (c.status === 'complete' || c.status === 'not-indicated') continue;
    owed += (c.doseNum == null || c.seriesTotal == null) ? 1 : Math.max(0, c.seriesTotal - c.doseNum + 1);
  }
  return owed;
}

// STOP E1 Q10 (owner, 2026-11-17): a dose that did not count (too soon, too
// young, wrong family) is repeated only if a card still asks for that vaccine.
// When every card for it today asks for nothing ("complete" or "not
// indicated"), nothing is owed, so the dose reads "Not counted — do not
// repeat" (PneumoVax's word for a dose the patient never needed) and its line
// drops "repeat this dose only". A deferred card (pregnancy) still asks: the
// dose is owed after it. A record problem is not a dose given at a wrong time,
// and keeps its own label.
// G1-a (owner, STOP G1, 2026-11-18): the line's own sentence is now only "Do
// not restart the series." ("repeat" is the label's word, style rule 6). The
// date or "when" goes BEFORE it (style rule 2, answer first).
const REPEAT_THIS_DOSE = DO_NOT_RESTART;
const CARDS_ASK_NOTHING = new Set(['complete', 'not-indicated']);
function notRepeatedWhenNothingAsked(history, cards) {
  // A card that asks for a dose later ("Not yet age-eligible: start the
  // high-risk series at 10") still asks: CDC repeats a too-young dose "on or
  // after the date when the child reaches at least the minimum age".
  if (!cards?.length || !cards.every((c) => CARDS_ASK_NOTHING.has(c.status) && !c.asksLater)) return history;
  if (!history.perDose.some((d) => d.status === 'invalid' && !d.recordProblem)) return history;
  return {
    ...history,
    perDose: history.perDose.map((d) => (d.status === 'invalid' && !d.recordProblem
      ? { ...d, notRepeated: true, reasons: (d.reasons ?? []).filter((r) => r !== REPEAT_THIS_DOSE) }
      : d)),
  };
}

// Port Phase 5 F-4a / F-4b (owner, 2026-11-18): a "Not counted — repeat" line
// says WHEN, or that it already was. CDC Timing and Spacing (July 24, 2024):
// "The repeat dose should be spaced after the invalid dose by the recommended
// minimum interval (Table 3-2)."
// - F-4b first: a later shot of the same vaccine on the record (no record
//   problem, a later day; counted or not) means the dose WAS repeated, so the
//   "repeat this dose only" sentence becomes "Repeated on <date>. See that
//   dose." (PneumoVax §C-P2-LATER, its owner ruling 2026-10-31).
// - F-4a otherwise: the line ends "Repeat from <date>." with the date the
//   CARD prints (today when it asks today; else its "Next dose due" date, or
//   its booster date). READ from the card, never recomputed, so the line and
//   card cannot disagree. A card with no date (not yet due, deferred) adds
//   nothing. Only lines that still carry REPEAT_THIS_DOSE are touched: a
//   "do not repeat" line (Q10 above) has no repeat to date.
//
// Port Phase 6.2 R-A / R-B / R-C (owner, STOP G1, 2026-11-18): a card that asks
// LATER but prints no date ("Not yet age-eligible", "Not yet due", "Not
// routinely indicated" before 16) used to leave the line with no "when". That
// card now carries its own ending (`repeatLater`), again READ from the card.
// Sources, read live 2026-11-18 (quoted in stop-g1-packet-2026-11-18.md §4):
// CDC Timing and Spacing (July 24, 2024), a too-young dose "should be repeated
// on or after the date when the child reaches at least the minimum age"; CDC
// child/adolescent notes (July 1, 2025), MenACWY "2-dose series at age 11–12
// years; 16 years" and healthy MenB at "age 16–23 years" by shared clinical
// decision-making; ACIP 2020, MenB "licensed ... only for persons aged 10–25
// years". R-C (healthy MenB before 16) drops the repeat sentence: nothing is
// owed until an optional series at 16, so "repeat" is wrong there; its chip
// reads "Not counted — do not repeat" (`notRepeated`, Q10's chip for a dose
// nobody is owed; owner, 2026-11-18). A deferred card (pregnancy, group D) is
// left as it was.
const REPEAT_LATER_MENB_HIGH_RISK = {
  line: `Repeat at ${ageYears(MENB_MIN_AGE_MONTHS)} years or older, when the high-risk MenB series starts.`,
  dropRepeat: false,
};
const REPEAT_LATER_ACWY_ROUTINE = {
  line: 'Repeat at 11–12 years, with the routine dose.',
  dropRepeat: false,
};
const REPEAT_LATER_MENB_HEALTHY = {
  line: `MenB is next offered at ${ageYears(MENB_HEALTHY_MIN_AGE_MONTHS)}–${ageYears(MENB_HEALTHY_MAX_AGE_MONTHS) - 1} years (shared clinical decision-making).`,   // P61 (review v10)
  dropRepeat: true,
};
// G1-a-F3 (owner, 2026-11-19): a too-soon booster's line has no repeat
// sentence ("Do not restart the series." means nothing for a booster) but is
// still repeated, so it is dated the same way: its "when" goes at the end.
const awaitsRepeat = (d) => d.status === 'invalid' && !d.recordProblem && !d.notRepeated
  && ((d.reasons ?? []).includes(REPEAT_THIS_DOSE) || d.tooSoonBooster === true);
const withWhen = (reasons, when) => (reasons.includes(REPEAT_THIS_DOSE)
  ? reasons.flatMap((x) => (x === REPEAT_THIS_DOSE ? [when, x] : [x]))
  : [...reasons, when]);
function datedRepeatLines(history, cards, today) {
  const per = history?.perDose ?? [];
  const doses = history?.sortedDoses ?? [];
  if (!per.some(awaitsRepeat)) return history;
  const asking = (cards ?? []).find((c) => !CARDS_ASK_NOTHING.has(c.status) && c.status !== 'deferred');
  const cardDate = !asking ? null
    : asking.dueToday ? today
      : (asking.earliestNextDate ?? asking.boosterDueDate ?? null);
  // Only when NO card asks now or is deferred: then the one asking later speaks.
  const later = (!asking && !(cards ?? []).some((c) => c.status === 'deferred'))
    ? (cards ?? []).find((c) => c.repeatLater)?.repeatLater ?? null
    : null;
  return {
    ...history,
    perDose: per.map((d, i) => {
      if (!awaitsRepeat(d)) return d;
      // R-C before F-4b (owner, 2026-11-18: "did the patient need MenB or
      // no", then "Yes, build it"): under the R-C card the patient needs no
      // MenB, so a later MenB shot was no repeat. Every too-young dose there
      // reads the same: "do not repeat" and the R-C ending.
      if (later?.dropRepeat) {
        return { ...d, notRepeated: true, reasons: [...d.reasons.filter((x) => x !== REPEAT_THIS_DOSE), later.line] };
      }
      const at = doses[i]?.date;
      const k = at ? doses.findIndex((x, j) => x?.date && x.date > at && !per[j]?.recordProblem) : -1;
      if (k >= 0) {
        const said = `Repeated on ${fmtDate(doses[k].date)}. See that dose.`;
        return {
          ...d,
          repeatedOn: doses[k].date,
          reasons: d.reasons.includes(REPEAT_THIS_DOSE)
            ? d.reasons.map((x) => (x === REPEAT_THIS_DOSE ? said : x))
            : [...d.reasons, said],
        };
      }
      // P54 (review v10): a dose of the other MenB product repeats with the first one.
      const sameProduct = d.wrongFamily && MENB_PRODUCT_BY_FAMILY[d.establishedFamily];
      // L5 (review v10, owner option A): a repeat due today says "today", as the card's heading does.
      const when = cardDate ? `Repeat ${sameProduct ? `with ${sameProduct} ` : ''}${cardDate === today ? 'today' : `from ${fmtDate(cardDate)}`}.` : later?.line;
      if (!when) return d;
      return { ...d, reasons: withWhen(d.reasons, when) };
    }),
  };
}

function recommendOneReading(input) {
  const am = patientAgeMonths(input, input.today) ?? 0;
  const riskIds = input.riskIds ?? [];
  const today = todayISO(input.today);

  // Hard-stop exclusion wins over everything — including a recommendation a
  // DIFFERENT ticked risk factor (travel, an outbreak, asplenia) would produce
  // on its own. Owner decision 2026-10-16, decision 2 of the hard-stop plan:
  // the stop hides the whole screen. That deliberately retires the 2026-09-19
  // C2-6 fix, which existed to keep those other cards visible for a transplant
  // patient; its two test files were deleted in the same commit.
  if (hasExclusion(riskIds)) {
    return {
      excluded: true,
      exclusionMessage: EXCLUSION_MESSAGE,
      exclusionCitations: resolveRefs(['cdcAlteredImmunocompetence']),
      menacwy: [],
      menb: [],
      pentavalent: { eligible: false },
      // impossible P1-2: the hard stop wins over the age-plausibility doubt
      // too. Every result carries the field so no caller has to tell "no
      // doubt" apart from "this branch forgot to say".
      riskAgeNote: null,
      riskAgeNoteCites: [],
      history: EMPTY_HISTORY,
      meta: { ageMonths: am, today, riskIds },
    };
  }
  // G1 (2026-09-16): one pentavalent injection is a dose of BOTH families, but a
  // chart entry only ever lands in one of the two history lists. Credit it to the
  // other list here, once, before anything reads either history — so the engine,
  // the validator walk and the record panel all see the same record. The row
  // itself is not moved: the credited copy is tagged `creditedFrom`.
  // See src/logic/pentavalentCredit.js for the ACIP sentences behind this.
  const { menacwy: rawMenacwyDoses, menb: rawMenbDoses } =
    creditPentavalents(input.menacwyDoses, input.menbDoses);
  // Risk-at-dose "Needs input" prompt answers (2026-07-23 handoff §2-§3),
  // keyed by vaccine then by the dose's post-sort index — same shape Results.jsx
  // threads to its own display-only analyzeHistory() calls, so a 'yes' answer
  // changes the effective dose count here too and the recommendation updates live.
  const acwyRiskAnswers = input.riskAtDoseAnswers?.MenACWY;
  const bRiskAnswers = input.riskAtDoseAnswers?.MenB;

  // Phase 3: filter doses through the last-kept validation walk so that
  // invalid doses (wrong age, interval violation, family mismatch) do NOT
  // count toward series completion. The engine sees only the effective list.
  // The full raw list (with per-dose display results) is available via
  // analyzeHistory() in Results.jsx for the RECORDED panel.
  //
  // The whole analysis (not just `.effective`) is returned to the caller as
  // `history` below: the record panel used to re-run these two calls for itself,
  // which meant two places deciding what the record says. One call, one answer.
  // B-1: only the reading that puts a dose on its birthday sets this (see
  // recommend()); MenACWY alone reads it — MenB and the pentavalent keep `am`.
  const acwyAm = Math.max(am, input.menacwyAgeFloorMonths ?? 0);
  // STOP E1 Q8 (owner, 2026-11-17): what the cards said on the day of a dose,
  // for the Extra rule in validate.js. It is recommend() itself, run on the
  // dose day with only the doses recorded before it (undated ones included:
  // they never count, so they change no card), the same risks and answers.
  // Filtering by date keeps a sorted prefix, so index-keyed answers still line
  // up. `cardsSeen` shares each day's answer across the nested runs, so a
  // record of N doses costs N extra runs, not 2^N. No date of birth, no
  // dose-day age: the rule is off.
  const cardsSeen = input.cardsSeen ?? new Map();
  const cardsOnTheDay = (key) => input.dob ? (dose) => {
    if (!cardsSeen.has(dose.date)) {
      const before = (list) => (list ?? []).filter((d) => d && (!d.date || d.date < dose.date));
      const { menacwyAgeFloorMonths: _floor, ...rest } = input;
      const then = recommendBeforeFold({
        ...rest, cardsSeen, today: dose.date,
        menacwyDoses: before(input.menacwyDoses), menbDoses: before(input.menbDoses),
      });
      cardsSeen.set(dose.date, then.excluded ? null : then);
    }
    return cardsSeen.get(dose.date)?.[key] ?? null;
  } : undefined;
  const menacwyHistory = analyzeHistory('MenACWY', rawMenacwyDoses, acwyAm, riskIds, today, acwyRiskAnswers, input.dob, { cardsOnTheDayOf: cardsOnTheDay('menacwy') });
  const menbHistory    = analyzeHistory('MenB',    rawMenbDoses,    am, riskIds, today, bRiskAnswers, input.dob, { cardsOnTheDayOf: cardsOnTheDay('menb') });
  const effectiveMenacwyDoses = menacwyHistory.effective;
  const effectiveMenbDoses    = menbHistory.effective;

  // Ruling D: each card is timed from the validator's anchor, then held to
  // a floor after any dose that did not count (owner E1/E2).
  // MenACWY: 8 weeks after any dose, including a too-young first dose (owner
  // C11, 2026-11-15; D5, 2026-11-17) — as doseRules.js ACWY-ANY-TWO-DOSES-GAP.
  const menacwy = outbreakWording(applyRepeatFloor(
    menacwyRec(acwyAm, riskIds, effectiveMenacwyDoses, today, input.dob, menacwyHistory.anchorDate,
      menacwyHistory.uncountedDate ? addDays(menacwyHistory.uncountedDate, MENACWY_ANY_TWO_DOSES_MIN_GAP) : null),
    menacwyHistory.uncountedDate,
    MENACWY_ANY_TWO_DOSES_MIN_GAP,
    today,
  ), outbreakIsTheOnlyBoosterReason('MenACWY', riskIds));
  const menb = withMenbSwitchLine(outbreakWording(applyRepeatFloor(
    menbRec(am, riskIds, effectiveMenbDoses, today, menbHistory.anchorDate,
      menbHistory.uncountedDate ? addDays(menbHistory.uncountedDate, MENB_REPEAT_MIN_INTERVAL) : null),
    menbHistory.uncountedDate, MENB_REPEAT_MIN_INTERVAL, today,
  ), outbreakIsTheOnlyBoosterReason('MenB', riskIds)), menbHistory, am, riskIds, today);

  // Pentavalent (MenABCWY) is an OPTION only when a MenACWY dose AND a MenB
  // dose are both due today at this visit (and the patient is ≥10y). MenB can
  // be "due" via a shared-decision rec (16-23y) -- that's still eligible for
  // the pentavalent (owner decision, 2026-07-23: don't gate on SCDM), but the
  // note must not claim MenB is due when it's only optional.
  const acwyDueToday = menacwy.some((r) => r.dueToday);
  const bDueRec = menb.find((r) => r.dueToday);
  const bDueToday = !!bDueRec;
  const bRequiredToday = bDueToday && bDueRec.status !== 'shared-decision';
  // F2a (owner, 2026-11-18): MenB dose 2 that is not due yet but whose minimum
  // has passed ("It can be given today if needed") also opens the combined
  // shot. ACIP mm7501a2 (read live 2026-11-18): "may be used when both MenACWY
  // and MenB are indicated at the same visit"; CDC adult notes: "when both
  // vaccines would be given on the same clinic day".
  const bGivableRec = bDueToday ? null : menb.find((r) => r.canGiveToday);
  const bAvailableToday = bDueToday || !!bGivableRec;
  // P1-4 (2026-09-17): Penbraya may be used for ADDITIONAL doses only once at
  // least 6 months have passed since the most recent Penbraya dose. Without
  // this the app offered a second Penbraya two months after the first.
  //
  // CDC child & adolescent schedule notes, MenB special situations (fetched
  // live 2026-09-17): "For age-eligible children at increased risk...,
  // Penbraya may be used for additional MenACWY and MenB doses (including
  // booster doses) if both would be given on the same clinic day and at least
  // 6 months have elapsed since most recent Penbraya dose."
  //
  // N1 (owner ruling 2026-11-15): Penmenvy follows the same rule. The CDC notes
  // page above never names Penmenvy (it predates the recommendation), but the
  // Penmenvy MMWR does, read live 2026-11-15 (mm7501a2, Jan 8 2026): "Persons at
  // increased risk ... who are recommended to receive additional doses of
  // MenACWY and MenB <6 months after a dose of pentavalent meningococcal vaccine
  // should receive separate MenACWY and MenB-4C vaccines, rather than
  // MenACWY-CRM/MenB-4C." Until then this was scoped to Penbraya alone, on the
  // notes page's silence.
  //
  // Read from the CREDITED histories, so a pentavalent recorded on either step
  // counts (G1) — the injection is the same one whichever list it was typed on.
  // Each brand is checked against its own last dose; the MenB antigen-family
  // lock below already rules out switching from one pentavalent to the other.
  const pentavalentTooRecent = (name) => [...rawMenacwyDoses, ...rawMenbDoses]
    .filter((d) => d?.date && new RegExp(name, 'i').test(d.brand || ''))
    .some((d) => !calendarIntervalElapsed(d.date, PENTAVALENT_REPEAT_MONTHS, today));
  const penbrayaTooRecent = pentavalentTooRecent('penbraya');
  const penmenvyTooRecent = pentavalentTooRecent('penmenvy');

  // Determine which pentavalent matches the established/needed MenB family.
  const bFamily = menb.find((r) => r.family)?.family ?? null;
  const pentavalentBrands = (bFamily === '4C'
    ? ['Penmenvy (MenABCWY)']
    : bFamily === 'FHbp'
      ? ['Penbraya (MenABCWY)']
      : ['Penmenvy (MenABCWY)', 'Penbraya (MenABCWY)']
  ).filter((b) => !(penbrayaTooRecent && /penbraya/i.test(b))
    && !(penmenvyTooRecent && /penmenvy/i.test(b)));

  // If the 6-month rule rules out the only pentavalent this patient's antigen
  // family allows, the combined injection is simply not an option today. The
  // card falls back to the existing "two separate vaccines" banner, which is
  // the clinically correct answer — plus a line saying why.
  // STOP B B-5 (owner, 2026-11-15): wait for the answers. While any recorded
  // dose still waits on its risk-at-dose question, the cards below withhold
  // their verdict ("Answers needed"), so the combined shot cannot be offered
  // on the strength of a "due today" that may not survive the answer.
  const answersPending = [...menacwyHistory.perDose, ...menbHistory.perDose].some((d) => d?.status === 'pending');
  const pentavalentEligible = !answersPending
    && am >= PENTAVALENT_MIN_AGE_MONTHS && acwyDueToday && bAvailableToday && pentavalentBrands.length > 0;
  const pentavalent = pentavalentEligible
    ? {
        eligible: true,
        // U1 (2026-09-17): same { lead, detail } shape as a card's note, and
        // rendered by the same component -- the panel had the longest single
        // paragraph in the app, and both halves of it were the family lock
        // repeated for each of the two openings.
        note: bGivableRec
          ? {
            lead: `MenACWY is due today, and MenB dose ${bGivableRec.doseNum} can be given today (its ${weeksLabel(bGivableRec.minIntervalDays).replace(/ weeks?$/, '-week')} minimum has passed). One MenABCWY injection can replace both.`,
            detail: PENTAVALENT_FAMILY_LOCK,
          }
          : bRequiredToday
          ? {
            lead: 'Both MenACWY and MenB are due today, so one MenABCWY injection can replace the two injections.',
            detail: PENTAVALENT_FAMILY_LOCK,
          }
          : {
            lead: 'MenACWY is due today, and MenB may be offered (shared clinical decision-making). One MenABCWY injection can replace both.',
            detail: PENTAVALENT_FAMILY_LOCK,
          },
        brands: pentavalentBrands,
        citations: resolveRefs(['pentavalentGSK2025', 'pentavalentPfizer2023']),
      }
    : {
        eligible: false,
        // Only set when the 6-month rule is what removed the option, so the
        // card can say why instead of silently dropping it.
        unavailableReason: (!answersPending && am >= PENTAVALENT_MIN_AGE_MONTHS && acwyDueToday && bAvailableToday && (penbrayaTooRecent || penmenvyTooRecent))
          ? `Not an option today: ${penbrayaTooRecent ? 'Penbraya' : 'Penmenvy'} cannot be repeated within 6 months of the last ${penbrayaTooRecent ? 'Penbraya' : 'Penmenvy'} dose.`   // P69 (review v10)
          : null,
      };

  const { note: riskAgeNote, cites: riskAgeNoteCites } = riskAgeCheck(riskIds, am);

  return {
    menacwy, menb, pentavalent,
    // impossible P1-2: a doubt about the INPUT, not about the recommendation.
    // It sits outside the cards because the cards are answers, and because the
    // one indication with no card of its own (pregnancy, which only defers
    // MenB) would otherwise have nowhere to be said.
    riskAgeNote, riskAgeNoteCites,
    history: {
      MenACWY: datedRepeatLines(notRepeatedWhenNothingAsked(menacwyHistory, menacwy), menacwy, today),
      MenB: datedRepeatLines(notRepeatedWhenNothingAsked(menbHistory, menb), menb, today),
    },
    meta: { ageMonths: am, today, riskIds },
  };
}
