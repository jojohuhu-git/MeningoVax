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

import { resolveRefs, cite } from '../data/refs.js';
import {
  menacwyRiskClass,
  menacwyInfantSeriesIndicated,
  hasMenbRisk,
  shouldDeferMenB,
  hasExclusion,
  hasHCT,
  RISK_BY_ID,
} from '../data/riskFactors.js';
import {
  menbFamily, menacwyBrandLabelsForAge, MENACWY_INFANT_SERIES_BRANDS,
  MENACWY_MIN_AGE_MONTHS, MENB_MIN_AGE_MONTHS, PENTAVALENT_MIN_AGE_MONTHS,
} from '../data/brands.js';
// P2-3 (2026-09-17): the age thresholds used to live in a local `M` map here,
// with validate.js and seriesTotals.js each keeping their own copies of the
// same numbers. ages.js is their single home; see its header for why 192 gets
// two names rather than one.
import {
  MENACWY_INFANT_SERIES_MAX_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS,
  MENACWY_ROUTINE_DOSE1_AGE_MONTHS, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS,
  MENACWY_CATCHUP_MIN_AGE_MONTHS, MENACWY_CATCHUP_MAX_AGE_MONTHS,
  MENACWY_BOOSTER_AGE_SPLIT_MONTHS,
  MENB_HEALTHY_MIN_AGE_MONTHS, MENB_HEALTHY_MAX_AGE_MONTHS, ageYears,
} from './ages.js';
import { todayISO, addDays, addCalendarMonths, addCalendarYears, calendarIntervalElapsed, daysBetween, calendarMonthsBetween, intervalElapsed, DAYS } from './dateUtils.js';
// Calendar P1-3: one rule for how old the patient is — the date of birth wins
// over a stored ageMonths, which is only ever a snapshot of it.
import { patientAgeMonths } from './patientAge.js';
import { analyzeHistory } from './validate.js';
import { creditPentavalents } from './pentavalentCredit.js';

// An excluded patient (CAR-T / B-cell depletion hard stop) gets no history walk,
// but callers read `result.history` unconditionally — give them the empty shape.
const EMPTY_HISTORY = Object.freeze({
  MenACWY: { perDose: [], effective: [], sortedDoses: [] },
  MenB: { perDose: [], effective: [], sortedDoses: [] },
});
import {
  menacwySeriesInfo, menbSeriesInfo, menacwyInfantHighRiskTotal,
  MENB_HIGHRISK_RESCUE_TOTAL,
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
  MENB_HIGHRISK_D3_MONTHS_FROM_D2, MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS,
  MENB_HEALTHY_D2_MONTHS, MENB_HEALTHY_RESCUE_MONTHS, monthsLabel,
  MENACWY_INFANT_FINAL_GAP,
} from './intervals.js';
import { MENACWY_INFANT_FINAL_MIN_AGE_MONTHS } from './ages.js';

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

// Compute age (months) at a past dose from its date and current age.
function ageAtDose(dose, am, today) {
  if (typeof dose?.ageMonths === 'number') return dose.ageMonths;
  // calendarMonthsBetween, not an averaged days/month divisor — see the
  // matching ageAtDoseFromDate in validate.js for why. Rounded to 6 decimal
  // places to avoid floating-point noise from subtracting two large
  // nearly-equal values (see ageAtDoseFromDate's comment).
  if (dose?.date) return Math.round((am - calendarMonthsBetween(dose.date, today)) * 1e6) / 1e6;
  return null;
}

// ── MenACWY ────────────────────────────────────────────────────────────────
function menacwyRec(am, riskIds, doses, today, dob) {
  const given = doses.length;
  const last = doses[given - 1] || null;
  const lastDate = last?.date || null;
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
    `Boosters: first booster ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)} after the primary series if it completed before age 7 [c], `
    + `otherwise ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7)} [c]; then every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at risk`;

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
    riskClass, am, doses, today, infantSeries: menacwyInfantSeriesIndicated(riskIds),
  }).primaryTotal;
  // Age at the LAST primary dose — the dose that completed the series and so
  // started the booster clock.
  const primaryCompletionAge = ageAtDose(doses[menacwyPrimaryDoseTotal - 1] || null, am, today);
  const isFirstBooster = given === menacwyPrimaryDoseTotal;
  // First booster: <7y or unknown → 3y conservative; ≥7y → 5y.
  //
  // P0-5 (2026-09-15): the cadence is carried in YEARS and compared on the
  // calendar. boostDays survives only for minIntervalDays, which the card
  // prints as an approximate "~3 years". Comparing 1096 days rejected a booster
  // given on its exact three-year anniversary whenever no 29 February fell in
  // the window, and dated the next one a day early.
  const firstBoosterYears = menacwyFirstBoosterYears(primaryCompletionAge);
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
  const menacwyD1AgeM = doses[0] ? ageAtDose(doses[0], am, today) : null;
  const startedAsInfant = menacwyD1AgeM != null && menacwyD1AgeM < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS;
  if ((am < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS || startedAsInfant) && menacwyInfantSeriesIndicated(riskIds)) {
    return [menacwyInfantSeries(am, given, doses, last, today, riskIds)];
  }

  // ── Medical high risk: 2-dose primary + lifelong boosters ────────────────
  if (riskClass === 'primary2') {
    // ≥2y: 2-dose primary ≥8 weeks apart, then boosters.
    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 (high-risk primary series)',
        doseNum: 1, seriesTotal: 2, boosterSummary: MENACWY_HIGHRISK_BOOSTER_LINE, dueToday: true, brands: menacwyBrands(am),
        note: {
          lead: `Two MenACWY doses, at least ${weeksLabel(MENACWY_HIGHRISK_PRIMARY_GAP)} apart, because of this patient's high-risk indication.`,
          detail: 'The high-risk indications are asplenia, persistent complement deficiency, complement-inhibitor therapy and HIV. ACIP gives all four the same 2-dose primary series.',
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
          lead: `The second dose of the high-risk primary series, at least ${weeksLabel(MENACWY_HIGHRISK_PRIMARY_GAP)} after dose 1.`,
          detail: `That is a minimum, not a target: a dose given later than ${weeksLabel(MENACWY_HIGHRISK_PRIMARY_GAP)} still counts and the series is not restarted. Two doses complete the primary series, and boosters continue from there while the risk lasts.`,
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
    const boostLabel = isFirstBooster
      ? `first booster, ${boostYears} years after primary`
      : 'every 5 years';
    const elapsed = calendarIntervalElapsed(lastDate, boostYearsCount * 12, today);
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${boostLabel})`,
      doseNum: given + 1, seriesTotal: 2, boosterSummary: `Boosters: every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at high risk (ongoing) [c]`, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addCalendarYears(lastDate, boostYearsCount),
      minIntervalDays: boostDays, brands: menacwyBrands(am),
      // U2: the "then every 5 years" tail is the booster line's own sentence.
      // The first-booster note keeps what the line cannot say -- why THIS
      // booster falls 3 years out rather than 5. A later booster has nothing
      // left to add, so it carries no note at all.
      note: isFirstBooster
        ? {
          lead: `Primary series complete. The first booster is due ${boostYears} years after it [c].`,
          detail: boostYears === '3'
            ? 'ACIP puts the first booster 3 years out when the primary series finished before the 7th birthday, rather than the 5 years it allows from age 7.'
            : 'ACIP puts the first booster 5 years out when the primary series finished at age 7 or older. A series finished before then brings the first booster forward to 3 years.',
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
      ? 'travel or occupational exposure'
      : hasMicro ? 'occupational exposure' : 'travel risk';
    const boosterLine = `Boosters: every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while ${exposurePhrase} continues (ongoing)`;
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
        vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose (ongoing-risk indication)',
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
    const primaryDoseAge = ageAtDose(doses[0] || null, am, today);
    // Unknown age falls to the shorter 3-year interval, the same conservative
    // choice the high-risk branch above makes.
    const exposureBoostYears = (isTravel && isFirstExposureBooster)
      ? menacwyFirstBoosterYears(primaryDoseAge)
      : MENACWY_BOOSTER_CADENCE_YEARS;
    const exposureBoostDays = DAYS.years(exposureBoostYears);
    const exposureBoostLabel = isFirstExposureBooster
      ? `first booster, ${yearsLabel(exposureBoostYears)} after the primary dose`
      : `every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)}`;
    const elapsed = calendarIntervalElapsed(lastDate, exposureBoostYears * 12, today);
    return [rec({
      vaccine: 'MenACWY', status: 'exposure', doseLabel: `Booster (dose ${given + 1}, ${exposureBoostLabel})`,
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
          lead: `The first booster is due ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)} after the primary dose [c].`,
          detail: 'ACIP puts the first booster 3 years out when the primary dose was given before the 7th birthday, rather than the 5 years it allows from age 7.',
        }
        : isFirstExposureBooster
          ? (isTravel
            ? {
              lead: `The first booster is due ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7)} after the primary dose [c].`,
              detail: 'ACIP puts the first booster 5 years out when the primary dose was given at age 7 or older. A dose given before then brings the first booster forward to 3 years.',
            }
            : {
              lead: `The first booster is due ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7)} after the primary dose.`,
              detail: 'ACIP gives microbiologists a flat 5-year booster interval with no shorter interval for young children — its table for this indication covers ages 10 years and older.',
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

    // College-dorm rule keys off whether a dose was given at age ≥16y.
    //
    // M17 (owner decision 2026-09-15): a ≥16y dose satisfies the requirement
    // PERMANENTLY. One dose, no additional boosters. This overturned a
    // correctly-sourced earlier reading, so both sides are recorded here.
    //
    // The rule used to expire after 5 years, from immunize.org Item #P2018
    // (job aid, 10/14/2025), which lists among the histories needing a dose:
    // "First year college students living in residence halls | None, or 1
    // prior dose when younger than 16 years, or 1 prior dose since 16th
    // birthday, but more than 5 years previously | Give 1 dose of MenACWY".
    //
    // ACIP 2020 MMWR 69(RR-9) Table 10 speaks to this patient directly and
    // says the opposite. Its Boosters row: "College freshmen living in
    // residence halls: Not routinely recommended unless person becomes at
    // increased risk due to another indication". Its footnote, last sentence:
    // "Adolescents who received a first dose after their 16th birthday do not
    // need a booster dose unless they become at increased risk for
    // meningococcal disease."
    //
    // Owner broke the tie for ACIP: P2018's "within 5 years before college
    // entry" is an enrolment-paperwork recency rule, while ACIP's footnote is
    // a clinical statement about this exact history. Note the tie could NOT be
    // broken by deferring to vaxapp, as the queue originally proposed: vaxapp
    // stops at 19 years and this case needs a patient aged 21+, so it has
    // never encountered it. Do not "restore" the 5-year expiry from P2018
    // without asking — it was removed knowingly, not overlooked.
    if (isCollege) {
      // P1-1 (2026-09-17): allows CDC's 4-day grace, like every other
      // "does this dose count" test. A college entrant whose dose came three
      // days before their 16th birthday is covered.
      const dosesAt16Plus = doses
        .map((d) => ({ a: ageAtDose(d, am, today), date: d.date || null }))
        .filter(({ a, date }) => a != null
          && ageMeetsMinimum(a, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, { doseDate: date, ageMonths: am, today }));
      if (dosesAt16Plus.length > 0) {
        return [rec({
          vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete (dose given at ≥16y)', seriesTotal: 1,
          note: {
            lead: 'A MenACWY dose at age 16 or older meets the college-residence requirement; no further dose is needed.',
            detail: 'ACIP states that adolescents who received a first dose after their 16th birthday do not need a booster dose unless they become at increased risk for meningococcal disease for another reason.',
          },
          // C2: college_dorm's own ref (Table 10) already carries this rule
          // -- refsFor([]) here would ALSO add the whole-document acip2020
          // default, producing two identically-labeled "ACIP 2020 MMWR"
          // chips (found while implementing C2, not in the original plan).
          refs: refsExposure(),
        })];
      }
      // M17: the ">=16y dose but more than 5 years ago" branch that used to sit
      // here is gone — see the block comment above for both sources and why.
      // A prior dose exists but cannot be confirmed as ≥16y (earlier dose, or date unknown).
      if (given >= 1) {
        const datesKnown = doses.every((d) => d?.date || typeof d?.ageMonths === 'number');
        return [rec({
          vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose (booster at ≥16y)',
          doseNum: given + 1, seriesTotal: 1, dueToday: true, brands: menacwyBrands(am),
          note: datesKnown
            ? {
              lead: 'The recorded dose was given before age 16, so one dose is due now.',
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
          lead: 'A single MenACWY dose for a first-year college student living in a residence hall.',
          detail: 'A dose already given at age 16 or older would satisfy this requirement on its own. Nothing on record does, so one dose is due.',
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
      const topUpYears = menacwyOutbreakTopUpYears(am);
      const topUpDays = DAYS.years(topUpYears);
      const elapsedTopUp = calendarIntervalElapsed(lastDate, topUpYears * 12, today);
      if (!elapsedTopUp) {
        return [rec({
          vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete for this outbreak', seriesTotal: 1,
          earliestNextDate: addCalendarYears(lastDate, topUpYears),
          minIntervalDays: topUpDays,
          note: {
            lead: 'The recorded dose covers this outbreak.',
            detail: `If the patient is identified as being at increased risk in another outbreak, a single further dose is given once ${menacwyOutbreakTopUpYears(am)} years or more have passed since the last one (${am < MENACWY_BOOSTER_AGE_SPLIT_MONTHS ? `under age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)}` : `age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)} or older`}) [c].`,
          },
          noteCites: [cite('acip2020Table8')],
          refs: refsExposure(),
        })];
      }
      return [rec({
        vaccine: 'MenACWY', status: 'exposure', doseLabel: `Outbreak top-up (dose ${given + 1})`, seriesTotal: 1,
        doseNum: given + 1, dueToday: true, brands: menacwyBrands(am),
        minIntervalDays: topUpDays,
        note: {
          lead: 'A single dose now, to top up protection for this outbreak [c].',
          detail: `More than ${menacwyOutbreakTopUpYears(am)} years have passed since the last MenACWY dose (${am < MENACWY_BOOSTER_AGE_SPLIT_MONTHS ? `under age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)}` : `age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)} or older`}), which is the interval at which ACIP gives a further dose to someone identified at increased risk in an outbreak. It does not start a repeating schedule.`,
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
      return [rec({
        vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: 1,
        // U4 (2026-09-17): the longest note on any card, and it spent its first
        // two sentences on what the app knows and cannot do before reaching the
        // thing the clinician has to go and do. Same facts, action first.
        // Clinical content unchanged (M18's live-verified Table 10 + footnote).
        note: {
          lead: 'Check the service\'s current requirement \u2014 do not assume nothing more is due.',
          detail: 'The dose on record satisfies the single-dose recruitment requirement. ACIP gives military recruits a booster every 5 years on the basis of assignment, and the U.S. Department of Defense sets that timing from high-risk travel, which this app cannot see. A separate ongoing-risk indication would add its own schedule on top.',
        },
        refs: refsExposure(),
      })];
    }
    return [rec({
      vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose', seriesTotal: 1,
      doseNum: 1, dueToday: true, brands: menacwyBrands(am),
      note: isOutbreakACWY
        ? {
          lead: 'A single MenACWY dose, for someone at increased risk in a serogroup A, C, W or Y outbreak.',
          detail: 'One dose covers this outbreak. It does not start a booster schedule — a further dose comes only if the patient is identified at risk in a new outbreak, after the interval ACIP sets for their age.',
        }
        : {
          lead: 'A single MenACWY dose, for a military recruit.',
          detail: 'One dose satisfies the recruitment requirement. Any further doses are set by the service on the basis of assignment, which this app cannot see.',
        },
      refs: refsExposure(),
    })];
  }

  // ── No MenACWY risk → routine adolescent schedule ────────────────────────
  return menacwyRoutine(am, given, doses, last, today, dob);
}

function menacwyInfantSeries(am, given, doses, last, today, riskIds) {
  // C5/2026-07-24: ACIP 2020 MMWR is the citation. cdcChildMenACWY dropped —
  // it just restates the same MMWR rule (2026-07-23 owner decision).
  const refs = collectRefs(riskIds, [], ['acip2020']);
  const lastDate = last?.date || null;
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
  const boosterSummaryText = infantOutbreak
    ? null
    : `Boosters: first in ${yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)}, then every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at risk [c]`;
  // U2: the source for that line. Empty for outbreak, where there IS no line --
  // and where the notes used to promise the countdown anyway, two sentences
  // before saying no such countdown exists.
  const infantBoosterCites = infantOutbreak ? [] : [cite('boosterBeforeAge7')];
  const outbreakTopUp = infantOutbreak
    ? ` There is no standing booster schedule for an outbreak indication: another dose is given only if the patient is identified at risk in a NEW outbreak, and ≥${MENACWY_OUTBREAK_TOPUP_YEARS_UNDER_7} years have passed since the last dose (≥${MENACWY_OUTBREAK_TOPUP_YEARS_FROM_7} years from age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)}).`
    : '';
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
  // MenACWY-CRM (Menveo) "minimum age: 2 months"; MenACWY-TT (MenQuadfi)
  // "minimum age: 2 years"; "Dose 1 at age 2 months: 4-dose series (additional
  // 3 doses at age 4, 6, and 12 months)".
  //
  // No date is promised. The app stores an age, not a date of birth (calendar
  // P1-3), so a date here would claim a precision it does not have.
  if (am < MENACWY_MIN_AGE_MONTHS) {
    return rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not yet age-eligible',
      dueToday: false,
      note: {
        lead: `The earliest any MenACWY vaccine may be given is ${monthsLabel(MENACWY_MIN_AGE_MONTHS)} of age, so nothing is due yet [c].`,
        detail: `This patient has an indication that calls for the infant ${why} series, so track them and start it at ${monthsLabel(MENACWY_MIN_AGE_MONTHS)}. Only Menveo is licensed that young; the other MenACWY brands start later.`,
      },
      noteCites: [cite('acwyInfantHighRisk2to6mo')],
      refs });
  }
  if (am < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS && given === 0 && am >= MENACWY_MIN_AGE_MONTHS) {
    // start series; Menveo only.
    // One total for BOTH the printed label and seriesTotal. They used to be
    // written out separately, so when M5 changed the helper (a 7-23-month start
    // became a 2-dose series) the labels kept F1's older numbers and each card
    // contradicted its own total. Deriving both from one call makes that
    // impossible rather than merely fixed.
    const infantStartTotal = menacwyInfantHighRiskTotal({ d1AgeM: am });
    if (am <= 6) {
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
          lead: `Start the 4-dose Menveo series — doses at 2, 4, 6 and 12 months, the early ones at least ${weeksLabel(startGate.minIntervalDays)} apart [c].`,
          detail: `${whoAged('2–6 months')} need four doses. The final dose comes at ${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} or older, and at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} after the one before it. Only Menveo is licensed for infants from 2 months.${outbreakTopUp}`,
        },
        noteCites: [cite('acwyInfantHighRisk2to6mo')],
        boosterCites: infantBoosterCites, refs });
    }
    if (am <= 11) {
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
          lead: `Start the 2-dose Menveo series — dose 2 at least ${weeksLabel(MENACWY_INFANT_FINAL_GAP)} after dose 1, and not before ${monthsLabel(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)} of age [c].`,
          detail: `${whoAged('7–11 months')} need two doses, not the four a younger infant needs. Only Menveo is licensed for infants from 2 months.${outbreakTopUp}`,
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
  const d1AgeM = given >= 1 ? ageAtDose(doses[0], am, today) : null;
  const d2AgeM = given >= 2 ? ageAtDose(doses[1], am, today) : null;
  // P1-3 (2026-09-15): was `d1AgeM >= 2`. CDC gives a dose 1 at 2 months a flat
  // 4-dose series and reserves the "3- or 4- dose series" wording for 3-6
  // months, so a baby who started on time at 2 months was being offered a
  // three-dose series CDC does not describe. Owner decision 2026-09-15: follow
  // CDC. Must stay in step with seriesTotals.js's menacwyInfantHighRiskTotal().
  const d1WasEarly = d1AgeM != null && d1AgeM >= 3 && d1AgeM <= 6; // started at 3–6m
  const d2WasAt7Plus = d2AgeM != null && d2AgeM >= 7;             // D2 at ≥7m
  const on3DosePath = d1WasEarly && d2WasAt7Plus;
  // D5 fix: detect whether D1 was in the 7–23m band (D2 needs ≥12-week + ≥12m floor).
  // M5 (2026-09-15): the band is 7–23 months, not 7–11, and it is a 2-dose primary
  // series. CDC: "Dose 1 at age 7–23 months: 2-dose series (dose 2 at least 12
  // weeks after dose 1 and after age 12 months)".
  const d1WasInfant7to11 = d1AgeM != null
    && d1AgeM >= MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS
    && d1AgeM < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS;

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
      doseLabel: `Dose 3 of 3 (${why}, 3-dose shortcut)`,
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
  if (seriesComplete && infantOutbreak) {
    // M10: ACIP Table 8 gives an outbreak contact a one-off top-up when they are
    // identified at risk in a NEW outbreak — "Boosters (if previously vaccinated
    // and identified as being at increased risk): • Aged <7 yrs: Single dose if
    // ≥3 yrs since vaccination • Aged ≥7 yrs: single dose if ≥5 yrs since
    // vaccination". That is re-exposure driven, not a standing countdown
    // (owner-confirmed 2026-09-15), so this must NOT fall through to the
    // 3-then-5-year booster cadence below, which travel and medical risk use.
    return rec({ vaccine: 'MenACWY', status: 'complete',
      doseLabel: 'Complete (infant outbreak series)',
      seriesTotal: menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM }),
      note: {
        lead: 'The outbreak infant series is complete.',
        // This branch is reached only when infantOutbreak is true, so the
        // top-up sentence is always present -- it is the whole detail here.
        detail: outbreakTopUp.trim(),
      },
      brands: menacwyBrands(am), refs });
  }
  if (seriesComplete) {
    // Cadence: first booster (effectiveIdx 2) — D2 age <7y → 3y; subsequent → 5y.
    // Since these are infants, D2 age is always <7y → first booster is 3y, then 5y thereafter.
    const isFirstInfantBooster = given === infantSeriesTotal;
    // An infant series always completes before age 7, so the first-booster
    // branch is the under-7 one by construction; pass the age anyway rather
    // than assert it, so this reads the same as every other booster site.
    const infantBoostYears = menacwyBoosterYears({
      isFirstBooster: isFirstInfantBooster, primaryCompletionAgeMonths: d2AgeM,
    });
    const boostDays = DAYS.years(infantBoostYears);
    const elapsedBoost = calendarIntervalElapsed(lastDate, infantBoostYears * 12, today);
    return rec({ vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${isFirstInfantBooster ? `first booster, ${yearsLabel(infantBoostYears)} after primary` : `every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)}`})`,
      // F1 (2026-09-14): was hardcoded 2 for the d1WasInfant7to11 bucket —
      // drifted from the `given >= 3` completion guard just above (should
      // be 3, matching the initial rec's total and menacwyInfantHighRiskTotal()).
      doseNum: given + 1, seriesTotal: menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM }), boosterSummary: `Boosters: every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)} while at risk (ongoing) [c]`,
      dueToday: elapsedBoost,
      earliestNextDate: elapsedBoost ? null : addCalendarYears(lastDate, infantBoostYears),
      minIntervalDays: boostDays,
      brands: menacwyBrands(am),
      // U2: as on the ≥2y booster card, the ongoing cadence belongs to the
      // booster line and the note keeps only the 3-years-not-5 explanation.
      note: isFirstInfantBooster
        ? {
          lead: `${whyTitle} primary series complete. The first booster is due ${yearsLabel(infantBoostYears)} after it [c].`,
          detail: 'ACIP puts the first booster 3 years out when the primary series finished before the 7th birthday, rather than the 5 years it allows from age 7.',
        }
        : null,
      noteCites: isFirstInfantBooster ? [cite('boosterBeforeAge7')] : [],
      // U2: see the ≥2y booster card -- a later booster's note is now null.
      boosterCites: [cite('boosterBeforeAge7')],
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
          detail: `This completes the ${why} Menveo series. Both conditions have to be met, so the dose falls on whichever comes later — the interval since the last dose, or the first birthday.${outbreakTopUp}`,
        }
        : {
          lead: `Continue the ${why} Menveo series — at least ${weeksLabel(nextIntervalDays)} between the early doses [c].`,
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
function menacwyRoutine(am, given, doses, last, today, dob) {
  // C5/2026-07-24: ACIP 2020 MMWR is the citation. cdcChildMenACWY dropped —
  // it just restates the same MMWR rule (2026-07-23 owner decision).
  // C2/2026-07-24: upgraded from the whole-document chip to the Table 2
  // (routine schedule) anchor -- a precision upgrade, not a Penmenvy fix.
  const refs = ['acip2020Table2'];
  const routineCite = [cite('acwyRoutine1112and16')];
  const lastDate = last?.date || null;
  // P1-1 (2026-09-17): a dose up to 4 days before the 16th birthday satisfies
  // the routine booster. Before this the validator counted such a dose while
  // this line did not, so the card went on asking for a booster the patient had.
  const hasDoseAt16 = doses.some((d) => {
    const a = ageAtDose(d, am, today);
    return a != null && ageMeetsMinimum(a, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, { doseDate: d.date || null, ageMonths: am, today });
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
    const a = ageAtDose(d, am, today);
    return a != null && !ageMeetsMinimum(a, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, { doseDate: d.date || null, ageMonths: am, today });
  });
  // Change 2 (2026-07-24): `doses` is already the effective/kept list (A3
  // filters out anything given before age 10 for a healthy patient — see
  // validate.js), so a recorded dose here whose age is <132mo (11y) was
  // necessarily given AT age 10, not before. ACIP/immunize.org: that dose
  // is valid for adolescent dose 1 — no repeat is needed. This only matters
  // for THIS one recorded dose (given === 1); once a second dose exists the
  // schedule has already moved past the single-dose-1 question.
  // G8 (2026-09-16): a dose with no date cannot be placed on or after the
  // 16th birthday, so the booster keeps being recommended -- correctly, since
  // nothing here proves it was given. What the card must NOT do is state as
  // fact that there is no such dose when the record simply cannot say. The
  // sentence names the missing date and what filling it in would change.
  const undatedCount = doses.filter((d) => !d.date).length;
  const sixteenUnconfirmed = undatedCount > 0 && !hasDoseAt16;
  const undatedNote = sixteenUnconfirmed
    ? ` ${undatedCount === 1 ? 'One recorded dose has no date' : `${undatedCount} recorded doses have no date`}, so a dose given at age 16 years or older cannot be confirmed from this record. Adding the date may remove this recommendation.`
    : '';
  const doseAgesM = doses.map((d) => ageAtDose(d, am, today));
  const doseAtAge10 = given === 1 && doseAgesM[0] != null && doseAgesM[0] < MENACWY_ROUTINE_DOSE1_AGE_MONTHS;

  // Under 11, with a dose already on file: it can only be the age-10 dose
  // above (nothing younger survives the A3 filter) — route to the same
  // "booster due at 16y" outcome as an 11–15y patient with dose 1 recorded,
  // not "not yet due" (that contradicted the Recorded panel's "Counts" chip).
  if (am < MENACWY_ROUTINE_DOSE1_AGE_MONTHS && given >= 1) {
    const boosterDueDate = routineBoosterDate(dob, am, today);
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Booster due at 16y', seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      boosterSummary: 'Boosters: 1 more - at age 16 [c]',
      boosterCites: [cite('acwyRoutine1112and16')],
      earliestNextDate: null,
      boosterDueDate,
      boosterDueDateExact: !!dob,
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
    return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not yet due',
      note: {
        lead: 'No routine MenACWY dose is due at this age without a risk factor.',
        detail: 'The routine schedule starts at 11–12 years, with a booster at 16 years [c]. A risk indication — asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak — would bring vaccination forward.',
      },
      noteCites: [cite('acwyRoutine1112and16')],
      refs })];
  }
  // 11–15y
  if (am < MENACWY_ROUTINE_BOOSTER_AGE_MONTHS) {
    if (given === 0) {
      return [rec({ vaccine: 'MenACWY', status: 'due', doseLabel: 'Dose 1 (routine, 11–12y)', doseNum: 1, seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, boosterSummary: 'Boosters: 1 more - at age 16 [c]', dueToday: true,
        brands: menacwyBrands(am),
        note: {
          lead: 'The routine adolescent dose, given at 11–12 years.',
          detail: 'If MenB is also being started under shared clinical decision-making, a pentavalent product may be used when both are given on the same day.',
        },
        // U2: "A booster follows at 16 years" was the booster line's sentence.
        boosterCites: [cite('acwyRoutine1112and16')],
        noteCites: [],
        refs })];
    }
    // already has dose 1 → booster due at 16y (future)
    // B6: this isn't a quiet "done" state — a booster is still coming. Compute
    // an approximate due date (the patient's 16th birthday) so it's not just
    // "complete" with no further information.
    const boosterDueDate = routineBoosterDate(dob, am, today);
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Booster due at 16y', seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      boosterSummary: 'Boosters: 1 more - at age 16 [c]',
      boosterCites: [cite('acwyRoutine1112and16')],
      earliestNextDate: null,
      boosterDueDate,
      boosterDueDateExact: !!dob,
      // U2: same three-way repeat as the under-11 card above.
      note: doseAtAge10
        ? {
          lead: 'Routine dose 1 is recorded, given at age 10 — it counts as the first dose of the series [c].',
          detail: 'ACIP counts a dose given at age 10 as dose 1 of the routine adolescent series, so it is not given again at 11–12 years.',
        }
        : {
          lead: 'Routine dose 1 is recorded.',
          detail: 'Dose 1 of the routine adolescent series is on record, so only the booster remains outstanding.',
        },
      noteCites: doseAtAge10 ? [cite('acwyAge10CountsAsDose1')] : [], refs })];
  }
  // 16–18y
  if (am < MENACWY_CATCHUP_MIN_AGE_MONTHS) {
    if (hasDoseAt16) {
      return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
        note: {
          lead: 'A MenACWY dose at age 16 or older completes the routine adolescent schedule [c].',
          detail: 'No further routine doses are needed. A new risk indication — asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak — would start a schedule of its own.',
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
    return [rec({ vaccine: 'MenACWY', status: given === 0 ? 'catchup' : 'due',
      doseLabel: given === 0 ? 'Dose 1 (catch-up, ≥16y, no booster needed)' : 'Booster (16y)',
      // P2-2 (2026-09-15): primaryTotal was omitted, so rec() defaulted it to
      // seriesTotal (2 in the booster case) and RecCard's headings would have
      // filed the 16-year BOOSTER under "Primary series". Routine MenACWY is the
      // one schedule whose primary series is shorter than its total.
      doseNum: given + 1, seriesTotal: given === 0 ? 1 : 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, dueToday: true, brands: menacwyBrands(am),
      note: given === 0
        ? {
          lead: 'A single MenACWY dose now; given at 16 years or older, it needs no booster [c].',
          detail: 'Nothing is on record for this patient. ACIP asks for no booster after a first dose given on or after the 16th birthday.',
        }
        : {
          lead: 'The routine 16-year booster is due [c].',
          detail: `The dose given at 11–12 years is the first dose of the series, not the booster, so a second dose is due from the 16th birthday.${undatedNote}`,
        },
      noteCites: given === 0 ? [cite('acwyFirstDoseAfter16NoBooster')] : routineCite, refs })];
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
        // G8: "no dose at ≥16y" is a claim the record cannot support when a
        // recorded dose has no date — it may well BE that dose. Say what is
        // true instead: the app cannot confirm one.
        doseLabel: given === 0
          ? 'Dose 1 of 1 (catch-up, 19–21y)'
          : sixteenUnconfirmed ? 'Dose (catch-up, ≥16y dose not confirmed)' : 'Dose (catch-up, no dose at ≥16y)',
        // F1 (2026-09-14): given===0 → this first-ever dose (at ≥19y) needs
        // no booster (1 total). given>=1 → an earlier <16y dose owes this
        // catch-up dose as its booster (2 total). Was hardcoded 1 for both.
        // P2-2 (2026-09-15): same omission as the >=16y branch above.
        doseNum: given + 1, seriesTotal: given === 0 ? 1 : 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, dueToday: true, brands: menacwyBrands(am),
        note: {
          lead: 'A single catch-up dose — no MenACWY is confirmed on or after the 16th birthday [c].',
          detail: `Given at 16 years or older it needs no booster. It is especially recommended for first-year college students living in residence halls.${undatedNote}`,
        },
        noteCites: [cite('acwyCatchup1921')], refs })];
    }
    // Has a dose at ≥16y → complete
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      note: {
        lead: 'A MenACWY dose at age 16 or older satisfies the adolescent schedule [c].',
        detail: 'No further routine doses are needed. A new risk indication — asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak — would start a schedule of its own.',
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
        lead: 'A MenACWY dose at age 16 or older completed the adolescent schedule [c].',
        detail: 'No further routine doses are needed. A new risk indication — asplenia, complement deficiency, complement-inhibitor therapy, HIV, travel, or an outbreak — would start a schedule of its own.',
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
function menbRec(am, riskIds, doses, today) {
  const given = doses.length;
  const last = doses[given - 1] || null;
  const lastDate = last?.date || null;
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
      return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not yet age-eligible',
        note: {
          lead: `MenB is licensed from age ${ageYears(MENB_MIN_AGE_MONTHS)} years, so nothing is due yet.`,
          detail: `This patient has a high-risk indication, so track them for the ${MENB_HIGHRISK_TOTAL}-dose high-risk MenB series once they reach age ${ageYears(MENB_MIN_AGE_MONTHS)}.`,
        }, refs: refs() })];
    }
    return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not indicated',
      note: {
        lead: 'MenB is not indicated at this age without a qualifying risk factor.',
        detail: `MenB vaccines (Bexsero, Trumenba, Penmenvy, Penbraya) are FDA-licensed from age ${ageYears(MENB_MIN_AGE_MONTHS)} years [c]. From ${ageYears(MENB_HEALTHY_MIN_AGE_MONTHS)} through ${ageYears(MENB_HEALTHY_MAX_AGE_MONTHS) - 1} years MenB may be given under shared clinical decision-making. Between ${ageYears(MENB_MIN_AGE_MONTHS)} and ${ageYears(MENB_HEALTHY_MIN_AGE_MONTHS) - 1} years it is indicated only for asplenia, complement deficiency, complement-inhibitor therapy, or microbiologist exposure.`,
      },
      // C5/2026-07-24: consolidate — replace the lone "CDC MenB Notes"
      // whole-page chip with the exact 2020 MMWR licensure sentence
      // (citation audit finding).
      noteCites: [cite('menbLicensedAge1025')],
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
    ? ' Pregnancy: safety data for MenB in pregnancy are limited, so give it only after discussing it with her — it is offered here because she is at increased risk, and the decision is whether the benefit outweighs the potential risk.'
    : '';
  if (shouldDeferMenB(riskIds)) {
    return [rec({ vaccine: 'MenB', status: 'deferred', doseLabel: 'Defer during pregnancy', seriesTotal: highRisk ? 3 : 2,
      note: {
        lead: 'MenB is generally deferred during pregnancy [c].',
        detail: 'Safety data in pregnancy are limited. A patient at increased risk — asplenia, complement deficiency, complement-inhibitor therapy, microbiologist exposure, or a serogroup B outbreak — is the exception, and may be vaccinated.',
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
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: 'Dose 1 of 3 (high-risk series)', doseNum: 1, seriesTotal: 3, boosterSummary: `Boosters: first in ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)}, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk`, dueToday: true,
        family, brands: menbBrands(family),
        note: {
          lead: 'A 3-dose MenB series at 0, 1–2 and 6 months, for this high-risk indication [c].',
          detail: `Pick one antigen family and stay in it: MenB-4C (Bexsero, Penmenvy) and MenB-FHbp (Trumenba, Penbraya) are not interchangeable.${menbPregnancyCaveat}`,
        },
        // C5/2026-07-24: ACIP Oct 2024 MMWR (mm7349a3) states this 3-dose
        // schedule explicitly and supersedes the 2020 MMWR's brand-split
        // table for both antigen families — cdcRecommendations dropped
        // (citation audit finding).
        noteCites: [cite('menbHighRisk3DoseSchedule')],
        refs: refs(['cdcComplementInhibitor', 'mm7349a3']) })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, MENB_HIGHRISK_D2_GAP, today);
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 2 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 2, seriesTotal: 3, boosterSummary: `Boosters: first in ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)}, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk`,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(lastDate, MENB_HIGHRISK_D2_GAP), minIntervalDays: MENB_HIGHRISK_D2_GAP,
        family, brands: menbBrands(family),
        note: {
          lead: `Dose 2 is given 1–2 months after dose 1, and no sooner than ${weeksLabel(MENB_HIGHRISK_D2_GAP)}.`,
          detail: `Continue in the same antigen family as dose 1 — MenB-4C (Bexsero, Penmenvy) and MenB-FHbp (Trumenba, Penbraya) are not interchangeable. The series then completes with a third dose about 6 months after dose 1.${menbPregnancyCaveat}`,
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
      // P0-4 (2026-09-15): calendar months, matching validate.js's gates for
      // the same two rules.
      const fromD1 = d1Date ? calendarIntervalElapsed(d1Date, MENB_HIGHRISK_D3_MONTHS_FROM_D1, today) : true;
      const fromD2 = d2Date ? calendarIntervalElapsed(d2Date, MENB_HIGHRISK_D3_MONTHS_FROM_D2, today) : true;
      const elapsed = fromD1 && fromD2;
      // Compute the later of the two earliest dates (whichever constraint binds).
      let earliestNextDate = null;
      if (!elapsed) {
        const e1 = d1Date ? addCalendarMonths(d1Date, MENB_HIGHRISK_D3_MONTHS_FROM_D1) : null;
        const e2 = d2Date ? addCalendarMonths(d2Date, MENB_HIGHRISK_D3_MONTHS_FROM_D2) : null;
        if (e1 && e2) earliestNextDate = e1 > e2 ? e1 : e2;
        else earliestNextDate = e1 ?? e2;
      }
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 3 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 3, seriesTotal: 3, boosterSummary: `Boosters: first in ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)}, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk`,
        dueToday: elapsed, earliestNextDate,
        minIntervalDays: DAYS.months(MENB_HIGHRISK_D3_MONTHS_FROM_D2), // min from D2 (D1 floor shown in note)
        family, brands: menbBrands(family),
        // U2: the "boost 1 year later, then every 2-3 years" tail is the booster
      // line's sentence, four lines above it on the same card.
      note: {
          lead: `Dose 3 is due at least ${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1, and at least ${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2 [c].`,
          detail: `That is the 0 / 1–2 / 6-month schedule ACIP gives a high-risk MenB series. Both intervals have to be met, so the dose falls on whichever comes later.${menbPregnancyCaveat}`,
        },
        noteCites: [cite('menbHighRisk3DoseSchedule')],
        refs: refs(['mm7349a3']) })];
    }
    // MenB dose-3 rescue (2026-09-17): dose 3 came earlier than 4 months after
    // dose 2, so CDC credits it and owes the patient a FOURTH dose at least 4
    // months after it. The app used to discard dose 3 and re-offer "Dose 3 of
    // 3", which lost a dose CDC counts and never mentioned the extra one.
    // CDC child & adolescent schedule notes, MenB special situations (fetched
    // live 2026-09-17):
    //   "...if dose 3 is administered earlier than 4 months after dose 2, a 4th
    //    dose should be administered at least 4 months after dose 3"
    // The total comes from menbSeriesInfo(), never a literal 4, so this card,
    // the validator and the booster clock move together.
    if (given === 3 && hrSeries.total === MENB_HIGHRISK_RESCUE_TOTAL) {
      const d3Date = doses[2]?.date ?? null;
      // P0-4: calendar months, not 122 days.
      const elapsed = d3Date ? calendarIntervalElapsed(d3Date, MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS, today) : true;
      return [rec({ vaccine: 'MenB', status: 'risk-based',
        doseLabel: `Dose 4 of 4 (extra dose: dose 3 given early${family ? `, ${family}` : ''})`,
        doseNum: 4, seriesTotal: MENB_HIGHRISK_RESCUE_TOTAL,
        boosterSummary: 'Boosters: first 1 year after the fourth dose, then every 2–3 years while at risk',
        dueToday: elapsed,
        earliestNextDate: elapsed || !d3Date ? null : addCalendarMonths(d3Date, MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS),
        minIntervalDays: DAYS.months(MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS),
        family, brands: menbBrands(family),
        // U2: "Boosters then start 1 year after this fourth dose" said the same
        // thing as the booster line. The line was the vaguer of the two, so it
        // takes on the precise version -- which dose the clock runs from -- and
        // the note drops the sentence.
        note: {
          lead: `Dose 3 counts — do not repeat it — but a fourth dose is needed at least ${monthsLabel(MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS)} after it [c].`,
          detail: `Dose 3 was given less than ${monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2. CDC credits that dose and completes the high-risk series with one further dose ${monthsLabel(MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS)} or more later.${menbPregnancyCaveat}`,
        },
        noteCites: [cite('menbHighRiskEarlyD3ExtraDose')],
        refs: refs(['mm7349a3']) })];
    }
    // Primary complete → boosters. P1-2: "complete" is hrSeries.total, not a
    // literal 3, so a patient whose dose 2 came six months on reaches their
    // first booster after two doses instead of being asked for a third.
    const firstBooster = given === hrSeries.total;
    const boosterYears = menbHighRiskBoosterYears(firstBooster);
    const intervalDays = DAYS.years(boosterYears);
    const elapsed = calendarIntervalElapsed(lastDate, boosterYears * 12, today);
    return [rec({ vaccine: 'MenB', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${firstBooster ? `${yearsLabel(boosterYears)} after primary` : `every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL}`})`,
      doseNum: given + 1, seriesTotal: hrSeries.total, boosterSummary: `Boosters: every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at high risk (ongoing)`, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addCalendarYears(lastDate, boosterYears), minIntervalDays: intervalDays,
      family, brands: menbBrands(family),
      // U2: "then every 2-3 years while the high-risk condition persists" is
      // the booster line's sentence.
      note: {
        lead: `A MenB booster, ${yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the primary series was completed [c].`,
        detail: `Stay in the same antigen family as the primary series — MenB-4C (Bexsero, Penmenvy) and MenB-FHbp (Trumenba, Penbraya) are not interchangeable.${menbPregnancyCaveat}`,
      },
      noteCites: [cite('menbHighRiskBoosterCadenceBox')],
      refs: refs(['mm7349a3']) })];
  }

  // ── Healthy 16–23y shared clinical decision-making: 2-dose 0/6 ───────────
  if (am >= MENB_HEALTHY_MIN_AGE_MONTHS && am < MENB_HEALTHY_MAX_AGE_MONTHS) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: 'Dose 1 of 2 (shared clinical decision)', doseNum: 1, seriesTotal: 2, dueToday: true,
        family, brands: menbBrands(family),
        note: {
          lead: 'Two MenB doses, at least 6 months apart, under shared clinical decision-making [c].',
          detail: `A healthy 16–23-year-old may receive MenB by shared clinical decision-making, and ACIP prefers age 16 through 18 [c]. Being past 18 does not make the patient ineligible — the series may still be given up to the 24th birthday. The 6-month interval applies to both Bexsero and Trumenba. If rapid protection is needed, starting college within 6 months for instance, a planned 3-dose series at 0, 1–2 and 6 months may be used instead.${menbPregnancyCaveat}`,
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
      const elapsed = calendarIntervalElapsed(lastDate, MENB_HEALTHY_D2_MONTHS, today);
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: `Dose 2 of 2 (${family || 'same family'})`, doseNum: 2, seriesTotal: 2,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addCalendarMonths(lastDate, MENB_HEALTHY_D2_MONTHS), minIntervalDays: DAYS.months(MENB_HEALTHY_D2_MONTHS),
        family, brands: menbBrands(family),
        note: {
          lead: `Dose 2 is due at least ${monthsLabel(MENB_HEALTHY_D2_MONTHS)} after dose 1.`,
          detail: `Two doses ${monthsLabel(MENB_HEALTHY_D2_MONTHS)} apart complete the series, for both Bexsero and Trumenba. If dose 2 is given earlier than that, a third rescue dose is needed at least ${monthsLabel(MENB_HEALTHY_RESCUE_MONTHS)} after it [c].${menbPregnancyCaveat}`,
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
      const needsRescue = dose1date != null && dose2date != null
        && !calendarIntervalElapsed(dose1date, MENB_HEALTHY_D2_MONTHS, dose2date);
      if (needsRescue) {
        const elapsed = calendarIntervalElapsed(dose2date, MENB_HEALTHY_RESCUE_MONTHS, today);
        return [rec({
          vaccine: 'MenB', status: 'shared-decision',
          doseLabel: 'Dose 3 of 3 (rescue: dose 2 given early)',
          doseNum: 3, seriesTotal: 3, dueToday: elapsed,
          earliestNextDate: elapsed ? null : addCalendarMonths(dose2date, MENB_HEALTHY_RESCUE_MONTHS),
          minIntervalDays: DAYS.months(MENB_HEALTHY_RESCUE_MONTHS),
          family, brands: menbBrands(family),
          note: {
            lead: `A third dose is needed, at least ${monthsLabel(MENB_HEALTHY_RESCUE_MONTHS)} after dose 2 [c].`,
            detail: `Dose 2 was given less than ${monthsLabel(MENB_HEALTHY_D2_MONTHS)} after dose 1, so the 2-dose schedule is not complete. This further dose finishes the series — dose 2 itself is not repeated.${menbPregnancyCaveat}`,
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
    note: am < MENB_HEALTHY_MIN_AGE_MONTHS
      // M16: the pre-16 card names the preferred age too, so a clinician
      // planning ahead knows the conversation is best had at 16-18 rather than
      // only that it becomes possible at 16.
      ? {
        lead: 'MenB is not routinely indicated yet at this age, without a risk factor.',
        detail: 'Shared clinical decision-making applies from 16 through 23 years, and ACIP prefers giving MenB at 16 through 18 years [c].',
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

// ═══════════════════════════════════════════════════════════════════════════
//  HCT advisory block (relative-to-transplant; never asks for the transplant
//  date — see PneumoVax's hsctAdvisory() for the same design rule).
//
//  Rule settled cross-repo 2026-09-13 (see
//  docs/archive/handoff-2026-09-13-post-hsct-meningococcal-pointer.md):
//  vaxapp's and this app's HCT advisories were wrong in opposite directions.
//  The corrected rule, sourced live 2026-09-13 (see refs.js for verbatim
//  quotes):
//   • CDC Altered Immunocompetence page: meningococcal conjugate (MenACWY) is
//     revaccinated "for individuals 11 through 18 years or at high-risk",
//     MenB "for individuals 16 through 23 years or at high-risk". The
//     "or at high-risk" limb applies at ANY age (asplenia, persistent
//     complement deficiency, or eculizumab/ravulizumab), from the transplant
//     alone — it was previously missing from both bands below.
//   • ASCO (JCO 2024): confirms MenB is indicated for "young adults (16-23
//     years old)" from the transplant alone, contradicting this app's old
//     "not triggered by transplant alone" MenB wording for that band.
//   • IDSA 2013 guideline (Rubin et al., Recommendation 80) — the ONLY
//     meningococcal recommendation in that guideline for HCT patients, and
//     it predates MenB licensure (2014-15), which is why it has no MenB
//     content: 2 doses of MCV4 6-12 months post-HCT for ages 11-18, booster
//     at 16-18.
//   • Kamboj & Shah 2019 (citing IDSA/ASBMT/EBMT): MenB should additionally
//     be given to HCT recipients aged 10-25 who ALSO have another qualifying
//     risk condition (asplenia, complement deficiency, microbiologist
//     exposure, travel, or outbreak) — kept for the population this app's
//     10-25 MenB pointer band covers that falls outside CDC's 16-23
//     transplant-alone band (i.e. ages 10-15, and 24-25).
//
//  The transplant alone never creates a booster schedule (rule 4 of the
//  settled cross-repo decision) — where the high-risk limb applies, the
//  text below defers to this app's own standing high-risk MenACWY/MenB
//  guidance (already selected via the 'asplenia'/'complement' checkboxes)
//  rather than inventing a post-transplant booster interval.
//
//  Owner correction 2026-09-13: age gates WHICH population CDC/ASCO/IDSA
//  specifically source a post-transplant timing for — it does NOT gate
//  whether the vaccine can be given at all. The real gates are each
//  vaccine's minimum age (MenACWY: 2 months; MenB: 10 years, its minimum
//  licensed age). Above that floor, a line always renders for both
//  vaccines; outside the specifically-sourced population it says plainly
//  that no source states a transplant-specific timing there, rather than
//  omitting the line (which reads as "does not apply"). This also fixes a
//  real bug the same correction surfaced: the high-risk limb previously had
//  no age floor for MenB, so a patient under 10 with the complement/asplenia
//  checkbox got a MenB line despite being below MenB's licensed minimum age.
//
//  P1 correction (2026-09-14, owner decision, supersedes the IDSA-sourced
//  "11 through 18" MenACWY carve-out above): the unconditional 11-18 age
//  band was WRONG. Read the ASCO passage live (ascopubs.org, JCO 2024):
//  "Two doses of quadrivalent meningococcal vaccine 2 months apart are
//  recommended 6-12 months after transplant for recipients with risk
//  factors." No age band — ASCO requires an additional risk factor at any
//  age, same as the high-risk limb below, not a separate age-only path. The
//  same sentence's MenB clause proves this is deliberate: it explicitly
//  offers an unconditional age path ("young adults 16-23 years old") next
//  to the risk-factor path, so ASCO plainly knows how to write "age alone
//  qualifies" when it means that — it didn't write MenACWY that way.
//  Confirmed by contrast with CDC's post-HCT pneumococcal rule (MMWR RR-9
//  2023), which has NO risk-factor qualifier at all: every HSCT recipient
//  19+ gets it, transplant alone is sufficient. Meningococcal and
//  pneumococcal differ by design; MenACWY is not universal to transplant
//  recipients the way pneumococcal is. IDSA's 2013 "11-18" language is now
//  superseded for this row by ASCO's more current, more specific 2024
//  guidance — the two-sided "band OR high-risk" MenACWY branch below is
//  removed; only the high-risk limb triggers the schedule. MenB is
//  unaffected — ASCO's own text still gives it the unconditional 16-23
//  age path, so `menbTransplantAloneBand` stays as-is.
function hctAdvisory(am, riskIds = []) {
  const menbTransplantAloneBand = am >= MENB_HEALTHY_MIN_AGE_MONTHS && am < MENB_HEALTHY_MAX_AGE_MONTHS; // 16 through 23 years
  const highRisk = riskIds.some((id) => id === 'asplenia' || id === 'complement');

  const lines = [];

  // MenACWY — floor is 2 months; no upper age limit on giving it at all.
  if (am >= 2) {
    if (highRisk) {
      lines.push({
        label: 'MenACWY',
        text: 'Indicated at any age from the high-risk condition selected above (asplenia, or persistent complement deficiency/complement-inhibitor therapy), not the transplant — the standing high-risk MenACWY recommendation above already governs dosing and boosters.',
        refs: ['cdcAlteredImmunocompetence'],
      });
    } else {
      lines.push({
        label: 'MenACWY',
        text: 'Not indicated from the transplant alone. ASCO\'s post-transplant schedule (2 doses, 2 months apart, 6–12 months after transplant) is sourced for recipients with an additional risk factor, not for the transplant by itself — select a risk factor above if one applies. MenACWY has no upper age limit, so it can still be given; centers may still vaccinate more broadly without a specific source.',
        refs: ['ascoAdultCancer2024'],
      });
    }
  }

  // MenB — floor is age 10 (its minimum licensed age); below that, no line
  // at all, regardless of risk factor — the vaccine truly cannot be given yet.
  if (am >= MENB_MIN_AGE_MONTHS) {
    if (menbTransplantAloneBand) {
      lines.push({
        label: 'MenB',
        text: 'Indicated at this age (16 through 23) from the transplant alone. This is the standard 2-dose series shown below, not the 3-dose high-risk one — 3 doses apply only if an additional MenB risk factor (asplenia, complement deficiency, microbiologist exposure, or a serogroup B outbreak) is also selected. No MenB booster is established.',
        refs: ['cdcAlteredImmunocompetence'],
      });
    } else if (highRisk) {
      lines.push({
        label: 'MenB',
        text: 'Indicated at any age from 10 years from the high-risk condition selected above (asplenia, or persistent complement deficiency/complement-inhibitor therapy), not the transplant — the standing high-risk MenB recommendation above already governs dosing and boosters.',
        refs: ['cdcAlteredImmunocompetence'],
      });
    } else {
      lines.push({
        label: 'MenB',
        text: 'Not specifically sourced as transplant-driven at this age. If another MenB risk factor applies (asplenia, complement deficiency, microbiologist exposure, travel/outbreak) — select it for its own rules. Otherwise, centers may still vaccinate more broadly; this app’s standard MenB rules below govern eligibility.',
        refs: ['kambojShah2019MenbHct'],
      });
    }
  }

  if (lines.length === 0) {
    lines.push({
      label: null,
      text: 'This patient is below the minimum age for either meningococcal vaccine (2 months for MenACWY, 10 years for MenB) — no recommendation applies yet.',
      refs: [],
    });
  }

  return {
    title: 'Post-HCT meningococcal vaccination — advisory',
    coordinateFlag: 'Coordinate with the transplant/ID team — your center may use its own post-HCT protocol. Most non-live vaccines, including meningococcal vaccines, are re-initiated no sooner than 6 months after transplant.',
    lines,
  };
}

// Hard-stop exclusion (CAR-T therapy / B-cell malignancy / B-cell-depleting
// therapy) — too heterogeneous for one safe recipe. Verified live against
// CDC's ACIP General Best Practice Guidelines, "Altered Immunocompetence"
// page, 2026-09-12.
const EXCLUSION_MESSAGE = 'This tool does not apply to this patient. Standard '
  + 'age-based immunization logic is not valid for recipients of hematopoietic '
  + 'cell transplant (HCT) or CAR‑T therapy, or for patients with a '
  + 'B‑cell malignancy or recent B‑cell–depleting therapy. These '
  + 'patients need an individualized, transplant/therapy‑specific '
  + 'revaccination schedule, and certain live vaccines may be contraindicated. '
  + 'Follow institutional protocols or current national guidance (e.g., ASCO, '
  + 'NCCN, IDSA, CDC).';

// The half of the pentavalent note that is true either way: whichever brand is
// given, the REST of the MenB series has to stay in that brand's antigen family.
const PENTAVALENT_FAMILY_LOCK = 'The two pentavalents are not interchangeable '
  + 'across the rest of the MenB series: Penmenvy is MenB-4C, so continue with '
  + 'Bexsero or Penmenvy; Penbraya is MenB-FHbp, so continue with Trumenba or '
  + 'Penbraya.';

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

export function recommend(input) {
  const am = patientAgeMonths(input, input.today) ?? 0;
  const riskIds = input.riskIds ?? [];
  const today = todayISO(input.today);

  // Hard-stop exclusion wins over everything, including the HCT advisory
  // (both boxes can be ticked; owner decision 2026-09-12: the stop wins, the
  // transplant advice is hidden rather than shown underneath a "does not
  // apply" notice).
  if (hasExclusion(riskIds)) {
    return {
      excluded: true,
      exclusionMessage: EXCLUSION_MESSAGE,
      exclusionCitations: resolveRefs(['cdcAlteredImmunocompetence']),
      menacwy: [],
      menb: [],
      pentavalent: { eligible: false },
      hct: null,
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
  const menacwyHistory = analyzeHistory('MenACWY', rawMenacwyDoses, am, riskIds, today, acwyRiskAnswers, input.dob);
  const menbHistory    = analyzeHistory('MenB',    rawMenbDoses,    am, riskIds, today, bRiskAnswers, input.dob);
  const effectiveMenacwyDoses = menacwyHistory.effective;
  const effectiveMenbDoses    = menbHistory.effective;

  const menacwy = menacwyRec(am, riskIds, effectiveMenacwyDoses, today, input.dob);
  const menb = menbRec(am, riskIds, effectiveMenbDoses, today);

  // ── HCT advisory block (prominent at top; standard recs still shown) ──
  const rawHct = hasHCT(riskIds) ? hctAdvisory(am, riskIds) : null;
  const hct = rawHct
    ? {
        title: rawHct.title,
        coordinateFlag: rawHct.coordinateFlag,
        lines: rawHct.lines.map((l) => ({ ...l, citations: resolveRefs(l.refs) })),
      }
    : null;

  // Pentavalent (MenABCWY) is an OPTION only when a MenACWY dose AND a MenB
  // dose are both due today at this visit (and the patient is ≥10y). MenB can
  // be "due" via a shared-decision rec (16-23y) -- that's still eligible for
  // the pentavalent (owner decision, 2026-07-23: don't gate on SCDM), but the
  // note must not claim MenB is due when it's only optional.
  const acwyDueToday = menacwy.some((r) => r.dueToday);
  const bDueRec = menb.find((r) => r.dueToday);
  const bDueToday = !!bDueRec;
  const bRequiredToday = bDueToday && bDueRec.status !== 'shared-decision';
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
  // Scoped to Penbraya alone, deliberately: the CDC page states this for
  // Penbraya (Pfizer) and says nothing of the kind about Penmenvy — it does not
  // mention Penmenvy at all. Verified by fetching the page and asking. Do not
  // mirror it onto Penmenvy without a source.
  //
  // Read from the CREDITED histories, so a Penbraya recorded on either step
  // counts (G1) — the injection is the same one whichever list it was typed on.
  const penbrayaOnRecord = [...rawMenacwyDoses, ...rawMenbDoses]
    .filter((d) => d?.date && /penbraya/i.test(d.brand || ''))
    .map((d) => d.date);
  const penbrayaTooRecent = penbrayaOnRecord.some(
    (d) => !calendarIntervalElapsed(d, 6, today),
  );

  // Determine which pentavalent matches the established/needed MenB family.
  const bFamily = menb.find((r) => r.family)?.family ?? null;
  const pentavalentBrands = (bFamily === '4C'
    ? ['Penmenvy (MenABCWY)']
    : bFamily === 'FHbp'
      ? ['Penbraya (MenABCWY)']
      : ['Penmenvy (MenABCWY)', 'Penbraya (MenABCWY)']
  ).filter((b) => !(penbrayaTooRecent && /penbraya/i.test(b)));

  // If the 6-month rule rules out the only pentavalent this patient's antigen
  // family allows, the combined injection is simply not an option today. The
  // card falls back to the existing "two separate vaccines" banner, which is
  // the clinically correct answer — plus a line saying why.
  const pentavalentEligible =
    am >= PENTAVALENT_MIN_AGE_MONTHS && acwyDueToday && bDueToday && pentavalentBrands.length > 0;
  const pentavalent = pentavalentEligible
    ? {
        eligible: true,
        // U1 (2026-09-17): same { lead, detail } shape as a card's note, and
        // rendered by the same component -- the panel had the longest single
        // paragraph in the app, and both halves of it were the family lock
        // repeated for each of the two openings.
        note: bRequiredToday
          ? {
            lead: 'Both MenACWY and MenB are due today, so one pentavalent (MenABCWY) dose may replace the two injections.',
            detail: PENTAVALENT_FAMILY_LOCK,
          }
          : {
            lead: 'MenACWY is due today; MenB is optional today (shared clinical decision). One pentavalent (MenABCWY) dose may replace both.',
            detail: PENTAVALENT_FAMILY_LOCK,
          },
        brands: pentavalentBrands,
        citations: resolveRefs(['pentavalentGSK2025', 'pentavalentPfizer2023']),
      }
    : {
        eligible: false,
        // Only set when the 6-month rule is what removed the option, so the
        // card can say why instead of silently dropping it.
        unavailableReason: (am >= PENTAVALENT_MIN_AGE_MONTHS && acwyDueToday && bDueToday && penbrayaTooRecent)
          ? 'A combined pentavalent shot is not an option today: Penbraya may only be repeated once 6 months have passed since the last Penbraya dose.'
          : null,
      };

  return {
    menacwy, menb, pentavalent, hct,
    history: { MenACWY: menacwyHistory, MenB: menbHistory },
    meta: { ageMonths: am, today, riskIds },
  };
}
