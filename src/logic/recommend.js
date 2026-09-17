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
import { menbFamily } from '../data/brands.js';
import { todayISO, addDays, addCalendarMonths, addCalendarYears, calendarIntervalElapsed, daysBetween, calendarMonthsBetween, intervalElapsed, DAYS } from './dateUtils.js';
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
  MENACWY_HIGHRISK_PRIMARY_TOTAL, MENACWY_SINGLE_TOTAL,
  MENACWY_ROUTINE_PRIMARY_TOTAL,
} from './seriesTotals.js';

// Age bands (months)
const M = {
  y2: 24, y7: 84, y10: 120, y11: 132, y16: 192, y18: 216, y19: 228, y22: 264, y23: 276, y24: 288, y26: 312,
};

// ── brand option builders ─────────────────────────────────────────────────
// D7: Menveo 2-vial (≥2 months) vs Menveo 1-vial (≥10 years) — distinct formulations.
// Both are valid per ACIP at ≥10y; only the 2-vial is licensed below 10y.
// MenQuadfi is licensed ≥2 years.
const MENACWY_INFANT = ['Menveo 2-vial (MenACWY)'];   // <2y: 2-vial only
const MENACWY_CHILD  = ['Menveo 2-vial (MenACWY)', 'MenQuadfi (MenACWY)'];  // 2–9y
const MENACWY_STD    = ['Menveo 2-vial (MenACWY)', 'Menveo 1-vial (≥10y) (MenACWY)', 'MenQuadfi (MenACWY)'];  // ≥10y

function menacwyBrands(am) {
  if (am < M.y2) return MENACWY_INFANT;         // <24m: 2-vial only
  if (am < M.y10) return MENACWY_CHILD;         // 24–119m: 2-vial + MenQuadfi
  return MENACWY_STD;                           // ≥120m: 2-vial + 1-vial + MenQuadfi
}

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
    note: o.note,
    // C5: [N] markers embedded in `note` that deep-link straight to the
    // exact ACIP MMWR sentence, distinct from the general `citations` chips
    // below (which cite the whole rec, not one sentence within it).
    noteCites: o.noteCites ?? [],
    citations: resolveRefs(o.refs ?? []),
    // B6: set when a "complete" status still has a future booster coming
    // (an approximate ISO date), so the UI can show it prominently instead
    // of reading as a quiet, fully-done state.
    boosterDueDate: o.boosterDueDate ?? null,
    // C4: a short structured summary of FUTURE boosters beyond what's due
    // today (count/cadence). null when no further booster is expected.
    boosterSummary: o.boosterSummary ?? null,
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
function menacwyRec(am, riskIds, doses, today) {
  const given = doses.length;
  const last = doses[given - 1] || null;
  const lastDate = last?.date || null;
  const riskClass = menacwyRiskClass(riskIds);
  // C5/2026-07-24: ACIP 2020 MMWR (RR-9) is the source-of-truth citation for
  // these risk-based schedules. cdcAdultMening (the CDC adult schedule note)
  // is dropped from the default set — it just restates the same MMWR rule
  // (2026-07-23 owner decision: don't cite two sources for one rule).
  const refsFor = (ids) => collectRefs(riskIds, ids, ['acip2020']);
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
  const firstBoosterYears = (primaryCompletionAge == null || primaryCompletionAge < M.y7) ? 3 : 5;
  const boostYearsCount = isFirstBooster ? firstBoosterYears : 5;
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
  // P0-1 (2026-09-15): this door used to read `am < M.y2` alone — today's age.
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
  const startedAsInfant = menacwyD1AgeM != null && menacwyD1AgeM < M.y2;
  if ((am < M.y2 || startedAsInfant) && menacwyInfantSeriesIndicated(riskIds)) {
    return [menacwyInfantSeries(am, given, doses, last, today, riskIds)];
  }

  // ── Medical high risk: 2-dose primary + lifelong boosters ────────────────
  if (riskClass === 'primary2') {
    // ≥2y: 2-dose primary ≥8 weeks apart, then boosters.
    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 (high-risk primary series)',
        doseNum: 1, seriesTotal: 2, boosterSummary: 'Boosters: first booster 3–5 years after the primary series (based on completion age), then every 5 years while at risk', dueToday: true, brands: menacwyBrands(am),
        note: 'High-risk indication (asplenia, persistent complement deficiency, complement-inhibitor therapy, or HIV): 2-dose primary series ≥8 weeks apart, then a first booster 3 years after primary if completed before age 7 [c] (otherwise 5 years [c]), then every 5 years while at increased risk.',
        noteCites: [
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
      const elapsed = intervalElapsed(lastDate, DAYS.weeks(8), today);
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 2 of 2 (high-risk primary series)',
        doseNum: 2, seriesTotal: 2, boosterSummary: 'Boosters: first booster 3–5 years after the primary series (based on completion age), then every 5 years while at risk', dueToday: elapsed,
        earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.weeks(8)),
        minIntervalDays: DAYS.weeks(8), brands: menacwyBrands(am),
        note: 'Second dose of the high-risk primary series, ≥8 weeks after dose 1. After completion: first booster 3 years after primary if completed before age 7 (otherwise 5 years), then every 5 years while at increased risk.',
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
      doseNum: given + 1, seriesTotal: 2, boosterSummary: 'Boosters: every 5 years while at high risk (ongoing)', dueToday: elapsed,
      earliestNextDate: elapsed ? null : addCalendarYears(lastDate, boostYearsCount),
      minIntervalDays: boostDays, brands: menacwyBrands(am),
      note: isFirstBooster
        ? `Primary series complete. This first booster is due ${boostYears} years after the primary series${boostYears === '3' ? ' (completed before age 7) [c]' : ' (primary completed at age 7 or older) [c]'}, then every 5 years while the high-risk condition persists.`
        : 'Continue MenACWY boosters every 5 years while the high-risk condition persists.',
      noteCites: isFirstBooster ? [
        boostYears === '3'
          ? cite('boosterBeforeAge7')
          : cite('boosterAtOrAfterAge7'),
      ] : [],
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
    const boosterLine = `Boosters: every 5 years while ${exposurePhrase} continues (ongoing)`;
    const firstDoseNote = hasTravel && hasMicro
      ? 'Travel to hyperendemic/epidemic areas and routine occupational exposure (microbiologist): 1 dose now. Re-vaccinate every 5 years while either risk continues.'
      : hasMicro
        ? 'Routine occupational exposure to N. meningitidis (microbiologist): 1 dose now. Re-vaccinate every 5 years while the exposure continues.'
        : 'Travel to hyperendemic/epidemic areas: 1 dose now. Re-vaccinate every 5 years while the travel risk continues.';

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
    const exposureBoostYears = (isTravel && isFirstExposureBooster
      && (primaryDoseAge == null || primaryDoseAge < M.y7)) ? 3 : 5;
    const exposureBoostDays = DAYS.years(exposureBoostYears);
    const exposureBoostLabel = exposureBoostYears === 3
      ? 'first booster, 3 years after the primary dose'
      : isFirstExposureBooster
        ? 'first booster, 5 years after the primary dose'
        : 'every 5 years';
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
      note: exposureBoostYears === 3
        ? 'The primary dose was given before age 7, so the first booster is due 3 years after it [c], then every 5 years while the travel risk continues.'
        : isFirstExposureBooster
          ? (isTravel
            ? `The primary dose was given at age 7 or older, so the first booster is due 5 years after it [c], then every 5 years while ${exposurePhrase} continues.`
            : 'The first booster is due 5 years after the primary dose, then every 5 years while occupational exposure continues.')
          : `Re-vaccinate every 5 years while ${exposurePhrase} continues.`,
      noteCites: (isTravel && isFirstExposureBooster) ? [
        exposureBoostYears === 3
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
      const dosesAt16Plus = doses
        .map((d) => ({ a: ageAtDose(d, am, today) }))
        .filter(({ a }) => a != null && a >= M.y16);
      if (dosesAt16Plus.length > 0) {
        return [rec({
          vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete (dose given at ≥16y)', seriesTotal: 1,
          note: 'A MenACWY dose given at age ≥16 years satisfies the first-year-college-resident requirement; no additional dose is needed.',
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
            ? 'A prior MenACWY dose is recorded but was given before age 16. The college-residence requirement is met only by a dose at age ≥16 years: give one dose now.'
            : 'A prior MenACWY dose is recorded but its age cannot be confirmed. If it was given on or after the 16th birthday, no further dose is needed; otherwise give one dose now. Confirm the date in the record.',
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
        note: 'First-year college student living in a residence hall: a single MenACWY dose, unless a dose was already given at age ≥16 years.',
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
      const topUpYears = am < M.y7 ? 3 : 5;
      const topUpDays = DAYS.years(topUpYears);
      const elapsedTopUp = calendarIntervalElapsed(lastDate, topUpYears * 12, today);
      if (!elapsedTopUp) {
        return [rec({
          vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete for this outbreak', seriesTotal: 1,
          earliestNextDate: addCalendarYears(lastDate, topUpYears),
          minIntervalDays: topUpDays,
          note: `The recorded dose covers this outbreak. If the patient is identified as being at increased risk in an outbreak again, a single further dose is given once it has been ${am < M.y7 ? 'three' : 'five'} years or more since the last one (${am < M.y7 ? 'under age 7' : 'age 7 or older'}) [c].`,
          noteCites: [cite('acip2020Table8')],
          refs: refsExposure(),
        })];
      }
      return [rec({
        vaccine: 'MenACWY', status: 'exposure', doseLabel: `Outbreak top-up (dose ${given + 1})`, seriesTotal: 1,
        doseNum: given + 1, dueToday: true, brands: menacwyBrands(am),
        minIntervalDays: topUpDays,
        note: `More than ${am < M.y7 ? 'three' : 'five'} years have passed since the last MenACWY dose (${am < M.y7 ? 'under age 7' : 'age 7 or older'}), so a single further dose is given to top up protection for this outbreak [c]. It does not start a repeating schedule.`,
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
        note: 'A documented MenACWY dose satisfies the single-dose recruitment requirement. ACIP gives military recruits a booster every 5 years on the basis of assignment, and the U.S. Department of Defense sets those requirements according to high-risk travel \u2014 so check the service\'s current requirement rather than assuming nothing more is due. This app does not track that timing. A separate ongoing-risk indication would add its own schedule on top.',
        refs: refsExposure(),
      })];
    }
    return [rec({
      vaccine: 'MenACWY', status: 'exposure', doseLabel: '1 dose', seriesTotal: 1,
      doseNum: 1, dueToday: true, brands: menacwyBrands(am),
      note: isOutbreakACWY
        ? 'People identified as being at increased risk during a serogroup A/C/W/Y outbreak: a single MenACWY dose.'
        : 'Military recruits: a single MenACWY dose.',
      refs: refsExposure(),
    })];
  }

  // ── No MenACWY risk → routine adolescent schedule ────────────────────────
  return menacwyRoutine(am, given, doses, last, today);
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
    : 'Boosters: first in 3 years, then every 5 years while at risk';
  const outbreakTopUp = infantOutbreak
    ? ' There is no standing booster schedule for an outbreak indication: another dose is given only if the patient is identified at risk in a NEW outbreak, and ≥3 years have passed since the last dose (≥5 years from age 7).'
    : '';
  if (am < M.y2 && given === 0 && am >= 2) {
    // start series; Menveo only.
    // One total for BOTH the printed label and seriesTotal. They used to be
    // written out separately, so when M5 changed the helper (a 7-23-month start
    // became a 2-dose series) the labels kept F1's older numbers and each card
    // contradicted its own total. Deriving both from one call makes that
    // impossible rather than merely fixed.
    const infantStartTotal = menacwyInfantHighRiskTotal({ d1AgeM: am });
    if (am <= 6) {
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose 1 of ${infantStartTotal} (${why})`, doseNum: 1, seriesTotal: infantStartTotal, boosterSummary: boosterSummaryText, dueToday: true,
        brands: MENACWY_INFANT, minIntervalDays: DAYS.weeks(4),
        note: `${whoAged('2–6 months')}: 4-dose Menveo series at 2, 4, 6, and 12 months (≥4 weeks between primary doses) [c]. Only Menveo is licensed for infants ≥2 months.${outbreakTopUp}`,
        noteCites: [cite('acwyInfantHighRisk2to6mo')], refs });
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
        brands: MENACWY_INFANT, minIntervalDays: DAYS.weeks(12),
        note: `${whoAged('7–11 months')}: 2-dose primary with Menveo. Dose 2 must be given ≥12 weeks after dose 1 AND not before 12 months of age [c]. Then a first booster in 3 years (primary series completed before age 7) [c], then every 5 years while at risk.${outbreakTopUp}`,
        noteCites: [cite('acwyInfantHighRisk7to23mo'), cite('boosterBeforeAge7')], refs });
    }
    // 12-23m unvaccinated. D5: D2 ≥12 weeks after D1 (≥12m age floor already satisfied in this band).
    // The label used to read "Dose 1 of 4" — F1's number, kept after M5 cut a
    // 12–23-month start to a 2-dose series, so the card said 4 while its own
    // seriesTotal and the note right beneath it said 2. CDC: "Dose 1 at age
    // 7–23 months: 2-dose series (dose 2 at least 12 weeks after dose 1 and
    // after age 12 months)".
    return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose 1 of ${infantStartTotal} (${whyShort} 12–23mo)`, doseNum: 1, seriesTotal: infantStartTotal, boosterSummary: boosterSummaryText, dueToday: true,
      brands: menacwyBrands(am), minIntervalDays: DAYS.weeks(12),
      note: `${whoKidsAged('12–23 months')}, unvaccinated: 2-dose primary ≥12 weeks apart [c], then a first booster in 3 years (primary series completed before age 7) [c], then every 5 years while at risk.${outbreakTopUp}`,
      noteCites: [cite('acwyInfantHighRisk7to23mo'), cite('boosterBeforeAge7')], refs });
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
  const d1WasInfant7to11 = d1AgeM != null && d1AgeM >= 7 && d1AgeM < 24;

  // D6: if on the 3-dose shortcut path and 2 doses given, next is the completing dose (D3).
  if (on3DosePath && given === 2) {
    const elapsed = intervalElapsed(lastDate, DAYS.weeks(12), today);
    const ageFloor = am >= 12;
    return rec({ vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Dose 3 of 3 (${why}, 3-dose shortcut)`,
      doseNum: 3, seriesTotal: 3, boosterSummary: boosterSummaryText,
      dueToday: elapsed && ageFloor,
      earliestNextDate: (elapsed && ageFloor) ? null : addDays(lastDate, DAYS.weeks(12)),
      minIntervalDays: DAYS.weeks(12),
      brands: MENACWY_INFANT,
      note: 'D6: Dose 2 was given at ≥7 months, so the series can complete in 3 doses. This final dose is due ≥12 weeks after dose 2 AND not before 12 months of age [c]. After completion, a first booster in 3 years (primary series completed before age 7) [c], then every 5 years while at risk.',
      noteCites: [cite('acwyInfantHighRisk7to23mo'), cite('boosterBeforeAge7')],
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
      note: `The outbreak infant series is complete.${outbreakTopUp}`,
      brands: menacwyBrands(am), refs });
  }
  if (seriesComplete) {
    // Cadence: first booster (effectiveIdx 2) — D2 age <7y → 3y; subsequent → 5y.
    // Since these are infants, D2 age is always <7y → first booster is 3y, then 5y thereafter.
    const isFirstInfantBooster = given === infantSeriesTotal;
    const infantBoostYears = isFirstInfantBooster ? 3 : 5;
    const boostDays = DAYS.years(infantBoostYears);
    const elapsedBoost = calendarIntervalElapsed(lastDate, infantBoostYears * 12, today);
    return rec({ vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${isFirstInfantBooster ? 'first booster, 3 years after primary' : 'every 5 years'})`,
      // F1 (2026-09-14): was hardcoded 2 for the d1WasInfant7to11 bucket —
      // drifted from the `given >= 3` completion guard just above (should
      // be 3, matching the initial rec's total and menacwyInfantHighRiskTotal()).
      doseNum: given + 1, seriesTotal: menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM }), boosterSummary: 'Boosters: every 5 years while at risk (ongoing)',
      dueToday: elapsedBoost,
      earliestNextDate: elapsedBoost ? null : addCalendarYears(lastDate, infantBoostYears),
      minIntervalDays: boostDays,
      brands: menacwyBrands(am),
      note: isFirstInfantBooster
        ? `${whyTitle} primary series complete. First booster is due 3 years after the primary series (completed before age 7) [c], then every 5 years ${whilePersists}.`
        : `Continue MenACWY boosters every 5 years ${whilePersists}.`,
      noteCites: isFirstInfantBooster ? [cite('boosterBeforeAge7')] : [],
      refs });
  }

  // Standard continuation for 2–6m start series (D2/D3 primary) or 7–11m start (D2)
  const nextIntervalDays = d1WasInfant7to11 ? DAYS.weeks(12) : DAYS.weeks(4);
  const elapsed = intervalElapsed(lastDate, nextIntervalDays, today);
  // For 7–11m D1, also enforce ≥12m age floor on D2
  const ageFloorMetActual = !d1WasInfant7to11 || am >= 12;
  // F1 (2026-09-14): total keyed off d1WasInfant7to11 alone (via
  // menacwyInfantHighRiskTotal), not on3DosePath — the D6 shortcut's own
  // "Dose 3 of 3" rec above already returns before reaching here; once a
  // shortcut patient falls through to THIS fallback (a 4th dose), they're
  // being asked for it because the `given >= 4` default guard above didn't
  // consider them complete at 3, so the total shown here must be 4 too, or
  // this dose's own doseNum would exceed it.
  return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose ${given + 1} (${why} series)`, doseNum: given + 1, seriesTotal: menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM }), boosterSummary: boosterSummaryText,
    dueToday: elapsed && ageFloorMetActual,
    earliestNextDate: (elapsed && ageFloorMetActual) ? null : addDays(lastDate, nextIntervalDays),
    minIntervalDays: nextIntervalDays,
    brands: MENACWY_INFANT,
    note: d1WasInfant7to11
      ? `Dose 2 of the 2-dose ${why} series: ≥12 weeks after dose 1 AND not before 12 months of age [c]. Then a first booster in 3 years (primary series completed before age 7) [c], then every 5 years while at risk.`
      : `Continue the ${why} Menveo series (≥4 weeks between primary doses; booster at ~12 months) [c], then a first booster in 3 years (primary series completed before age 7) [c], then every 5 years while at risk.${outbreakTopUp}`,
    noteCites: d1WasInfant7to11
      ? [cite('acwyInfantHighRisk7to23mo'), cite('boosterBeforeAge7')]
      : [cite('acwyInfantHighRisk2to6mo'), cite('boosterBeforeAge7')],
    refs });
}

// A3: doses given before age 10 do not count toward the routine adolescent series
// (ACIP/immunize.org). The `doses` array passed in here is already the
// analyzeHistory()-filtered "effective" list, which excludes those doses when
// the patient has no current high-risk indication — see validate.js. This
// function only needs the ordinary routine schedule logic.
function menacwyRoutine(am, given, doses, last, today) {
  // C5/2026-07-24: ACIP 2020 MMWR is the citation. cdcChildMenACWY dropped —
  // it just restates the same MMWR rule (2026-07-23 owner decision).
  // C2/2026-07-24: upgraded from the whole-document chip to the Table 2
  // (routine schedule) anchor -- a precision upgrade, not a Penmenvy fix.
  const refs = ['acip2020Table2'];
  const routineCite = [cite('acwyRoutine1112and16')];
  const lastDate = last?.date || null;
  const hasDoseAt16 = doses.some((d) => (ageAtDose(d, am, today) ?? 0) >= M.y16);
  // F1 (2026-09-14): the routine series is 2 doses (11-12y + the 16y
  // booster) whenever an earlier <16y dose is already on record and owes
  // that booster — otherwise (a dose was given directly at ≥16y, or none
  // yet) ACIP requires only 1. seriesTotal below was hardcoded to 1 in
  // every routine branch, which is the reported bug: a patient with 2+
  // routine doses (e.g. an 82-year-old given 3 adult MenACWY doses) showed
  // "Dose 2 of 1" / "Dose 3 of 1" on the recorded-dose chips.
  const hasDoseBefore16 = doses.some((d) => (ageAtDose(d, am, today) ?? Infinity) < M.y16);
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
  const doseAtAge10 = given === 1 && doseAgesM[0] != null && doseAgesM[0] < M.y11;

  // Under 11, with a dose already on file: it can only be the age-10 dose
  // above (nothing younger survives the A3 filter) — route to the same
  // "booster due at 16y" outcome as an 11–15y patient with dose 1 recorded,
  // not "not yet due" (that contradicted the Recorded panel's "Counts" chip).
  if (am < M.y11 && given >= 1) {
    const monthsUntil16 = M.y16 - am;
    const boosterDueDate = addDays(today, DAYS.months(monthsUntil16));
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Booster due at 16y', seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      boosterSummary: 'Boosters: 1 more - at age 16',
      earliestNextDate: null,
      boosterDueDate,
      note: 'A MenACWY dose given at age 10 counts as the first dose of the routine adolescent series [c]; no repeat dose is needed now. The routine booster is due at age 16 years (see the approximate date above).',
      noteCites: [cite('acwyAge10CountsAsDose1')], refs })];
  }
  if (am < M.y11) {
    return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not yet due',
      note: 'Routine MenACWY is recommended at 11–12 years (with a booster at 16 years) [c]. No routine dose is indicated at this age without a risk factor.',
      noteCites: [cite('acwyRoutine1112and16')],
      refs })];
  }
  // 11–15y
  if (am < M.y16) {
    if (given === 0) {
      return [rec({ vaccine: 'MenACWY', status: 'due', doseLabel: 'Dose 1 (routine, 11–12y)', doseNum: 1, seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, boosterSummary: 'Boosters: 1 more - at age 16', dueToday: true,
        brands: menacwyBrands(am),
        note: 'Routine adolescent dose at 11–12 years. A booster follows at 16 years [c]. If MenB is also being started under shared clinical decision-making, a pentavalent product may be used when both are given the same day.',
        noteCites: [cite('acwyRoutine1112and16')],
        refs })];
    }
    // already has dose 1 → booster due at 16y (future)
    // B6: this isn't a quiet "done" state — a booster is still coming. Compute
    // an approximate due date (the patient's 16th birthday) so it's not just
    // "complete" with no further information.
    const monthsUntil16 = M.y16 - am;
    const boosterDueDate = addDays(today, DAYS.months(monthsUntil16));
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Booster due at 16y', seriesTotal: 2, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      boosterSummary: 'Boosters: 1 more - at age 16',
      earliestNextDate: null,
      boosterDueDate,
      note: doseAtAge10
        ? 'Routine dose 1 recorded, given at age 10 — this counts as the first dose of the adolescent series [c]; no repeat dose is needed. The routine booster is due at age 16 years (see the approximate date above).'
        : 'Routine dose 1 recorded. The routine booster is due at age 16 years [c] (see the approximate date above).',
      noteCites: doseAtAge10 ? [cite('acwyAge10CountsAsDose1')] : routineCite, refs })];
  }
  // 16–18y
  if (am < M.y19) {
    if (hasDoseAt16) {
      return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
        note: 'A MenACWY dose given at age ≥16 years completes the routine adolescent schedule [c]; no further routine doses are needed.',
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
        ? 'Unvaccinated adolescent ≥16 years: a single MenACWY dose; because it is given at ≥16y, no booster is required [c].'
        : `Routine 16-year booster (the dose given at 11–12y does not count as the booster) [c].${undatedNote}`,
      noteCites: given === 0 ? [cite('acwyFirstDoseAfter16NoBooster')] : routineCite, refs })];
  }
  // 19–21y: catch-up if no dose at ≥16y; otherwise not indicated
  // D2: Job aid rule — all patients 17–21y with no MenACWY on/after the 16th birthday
  // should receive catch-up Dose 1 of 1. No booster needed when given at ≥16y.
  // Especially important for first-year college students living in residence halls.
  if (am < M.y22) { // <22y — through 21st birthday (264m = 22y); 'through 21 years' is inclusive to 22nd birthday
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
        note: `No MenACWY dose confirmed on or after the 16th birthday. A single catch-up dose is recommended: when given at ≥16 years, no booster is needed [c]. Especially recommended for first-year college students living in residence halls.${undatedNote}`,
        noteCites: [cite('acwyCatchup1921')], refs })];
    }
    // Has a dose at ≥16y → complete
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL,
      note: 'A MenACWY dose given at age ≥16 years satisfies the adolescent schedule [c]; no further routine doses are needed.',
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
      note: 'A MenACWY dose given at age ≥16 years completed the adolescent schedule [c]; no further routine doses are needed.',
      noteCites: routineCite, refs })];
  }
  // C5/2026-07-24: immunize.org's homeless/halfway-house Q&A page states
  // catch-up runs only "through age 21 years" — so beyond 21 (≥22y), a
  // healthy person with no risk gets neither a routine nor a catch-up dose.
  // Cite immunize.org (whole-page chip) + the 2020 MMWR catch-up sentence
  // as MMWR backing (citation audit W5 finding, owner-confirmed 2026-07-24).
  return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    note: 'Healthy adults ≥22 years without a risk factor are not routinely recommended to receive MenACWY [c]. Vaccinate only if a risk indication applies (asplenia, complement deficiency, complement-inhibitor therapy, HIV, microbiologist, travel, military, or outbreak).',
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
  if (am < M.y10) {
    if (highRisk) {
      return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not yet age-eligible',
        note: 'MenB vaccines are licensed from age 10 years. This high-risk patient becomes MenB-eligible at age 10; track for the 3-dose high-risk series then.', refs: refs() })];
    }
    return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not indicated',
      note: 'MenB vaccines (Bexsero, Trumenba, Penmenvy, Penbraya) are FDA-licensed from age 10 years [c]. Without a high-risk indication, routine shared-decision-making for MenB applies from age 16 through 23 years. At 10–15 years, MenB is indicated only for patients with a qualifying risk factor (asplenia, complement deficiency, complement-inhibitor therapy, or microbiologist exposure).',
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
      note: 'MenB is generally deferred during pregnancy due to limited safety data, unless the patient is at increased risk (asplenia, complement deficiency, complement-inhibitor therapy, microbiologist, or serogroup B outbreak) [c].',
      noteCites: [cite('menbPregnancyDeferral')],
      refs: refs([], ['acip2020']) })];
  }

  // ── High-risk: 3-dose 0/1–2/6 primary + boosters ─────────────────────────
  if (highRisk) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: 'Dose 1 of 3 (high-risk series)', doseNum: 1, seriesTotal: 3, boosterSummary: 'Boosters: first in 1 year, then every 2–3 years while at risk', dueToday: true,
        family, brands: menbBrands(family),
        note: `High-risk indication: 3-dose MenB series at 0, 1–2, and 6 months [c]. Pick one antigen family and stay in it: MenB-4C (Bexsero/Penmenvy) and MenB-FHbp (Trumenba/Penbraya) are NOT interchangeable.${menbPregnancyCaveat}`,
        // C5/2026-07-24: ACIP Oct 2024 MMWR (mm7349a3) states this 3-dose
        // schedule explicitly and supersedes the 2020 MMWR's brand-split
        // table for both antigen families — cdcRecommendations dropped
        // (citation audit finding).
        noteCites: [cite('menbHighRisk3DoseSchedule')],
        refs: refs(['cdcComplementInhibitor', 'mm7349a3']) })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, DAYS.weeks(4), today);
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 2 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 2, seriesTotal: 3, boosterSummary: 'Boosters: first in 1 year, then every 2–3 years while at risk',
        dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.weeks(4)), minIntervalDays: DAYS.weeks(4),
        family, brands: menbBrands(family),
        note: `High-risk 3-dose schedule: dose 2 is given 1–2 months (≥4 weeks) after dose 1. Continue in the same antigen family as dose 1.${menbPregnancyCaveat}`,
        refs: refs(['mm7349a3']) })];
    }
    if (given === 2) {
      // C1: D3 requires BOTH ≥6 months from D1 AND ≥4 months from D2.
      // The earlier check (engine vs validator disagreement) only used D1.
      // Now gate on both; earliestNextDate = later of the two floors.
      const d1Date = doses[0]?.date ?? null;
      const d2Date = doses[1]?.date ?? null;
      // P0-4 (2026-09-15): calendar months, matching validate.js's gates for
      // the same two rules.
      const fromD1 = d1Date ? calendarIntervalElapsed(d1Date, 6, today) : true;
      const fromD2 = d2Date ? calendarIntervalElapsed(d2Date, 4, today) : true;
      const elapsed = fromD1 && fromD2;
      // Compute the later of the two earliest dates (whichever constraint binds).
      let earliestNextDate = null;
      if (!elapsed) {
        const e1 = d1Date ? addCalendarMonths(d1Date, 6) : null;
        const e2 = d2Date ? addCalendarMonths(d2Date, 4) : null;
        if (e1 && e2) earliestNextDate = e1 > e2 ? e1 : e2;
        else earliestNextDate = e1 ?? e2;
      }
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 3 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 3, seriesTotal: 3, boosterSummary: 'Boosters: first in 1 year, then every 2–3 years while at risk',
        dueToday: elapsed, earliestNextDate,
        minIntervalDays: DAYS.months(4), // min from D2 (D1 floor shown in note)
        family, brands: menbBrands(family),
        note: `High-risk 3-dose schedule: dose 3 is given ≥6 months after dose 1 AND ≥4 months after dose 2 (0/1–2/6 month schedule) [c]. After completion, boost 1 year later, then every 2–3 years while at risk.${menbPregnancyCaveat}`,
        noteCites: [cite('menbHighRisk3DoseSchedule')],
        refs: refs(['mm7349a3']) })];
    }
    // given >= 3: primary complete → boosters
    const firstBooster = given === 3;
    const boosterYears = firstBooster ? 1 : 2;
    const intervalDays = DAYS.years(boosterYears);
    const elapsed = calendarIntervalElapsed(lastDate, boosterYears * 12, today);
    return [rec({ vaccine: 'MenB', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${firstBooster ? '1 year after primary' : 'every 2–3 years'})`,
      doseNum: given + 1, seriesTotal: 3, boosterSummary: 'Boosters: every 2–3 years while at high risk (ongoing)', dueToday: elapsed,
      earliestNextDate: elapsed ? null : addCalendarYears(lastDate, boosterYears), minIntervalDays: intervalDays,
      family, brands: menbBrands(family),
      note: `High-risk MenB booster: 1 year after completing the primary series [c], then every 2–3 years while the high-risk condition persists. Stay in the same antigen family.${menbPregnancyCaveat}`,
      noteCites: [cite('menbHighRiskBoosterCadenceBox')],
      refs: refs(['mm7349a3']) })];
  }

  // ── Healthy 16–23y shared clinical decision-making: 2-dose 0/6 ───────────
  if (am >= M.y16 && am < M.y24) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: 'Dose 1 of 2 (shared clinical decision)', doseNum: 1, seriesTotal: 2, dueToday: true,
        family, brands: menbBrands(family),
        note: `Healthy adolescents/young adults 16–23 years may receive MenB based on shared clinical decision-making, and ACIP prefers giving it at 16 through 18 years [c]. Being past 18 does not make the patient ineligible — the series may still be given up to the 24th birthday. Standard schedule: 2 doses ≥6 months apart (applies to both Bexsero and Trumenba) [c]. If rapid protection is needed (e.g. starting college within 6 months), a planned 3-dose series (0, 1–2, and 6 months) may be used instead.${menbPregnancyCaveat}`,
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
        noteCites: [cite('menbHealthyPreferredAge1618'), cite('menbHealthy2Dose0and6')],
        refs: refs([], ['mm7349a3']) })];
    }
    if (given === 1) {
      // P0-4 (2026-09-15): calendar months, not an averaged 183 days -- and the
      // date shown is the real six-month anniversary, not lastDate + 183 days.
      const elapsed = calendarIntervalElapsed(lastDate, 6, today);
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: `Dose 2 of 2 (${family || 'same family'})`, doseNum: 2, seriesTotal: 2,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addCalendarMonths(lastDate, 6), minIntervalDays: DAYS.months(6),
        family, brands: menbBrands(family),
        note: `Healthy 2-dose schedule: dose 2 ≥6 months after dose 1 (applies to both Bexsero and Trumenba). Series complete after 2 doses given ≥6 months apart. If dose 2 is given earlier than 6 months, a third rescue dose will be needed ≥4 months after dose 2 [c].${menbPregnancyCaveat}`,
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
        && !calendarIntervalElapsed(dose1date, 6, dose2date);
      if (needsRescue) {
        const elapsed = calendarIntervalElapsed(dose2date, 4, today);
        return [rec({
          vaccine: 'MenB', status: 'shared-decision',
          doseLabel: 'Dose 3 of 3 (rescue: dose 2 given early)',
          doseNum: 3, seriesTotal: 3, dueToday: elapsed,
          earliestNextDate: elapsed ? null : addCalendarMonths(dose2date, 4),
          minIntervalDays: DAYS.months(4),
          family, brands: menbBrands(family),
          note: `Dose 2 was given less than 6 months after dose 1. A third rescue dose is needed ≥4 months after dose 2 to complete the series [c].${menbPregnancyCaveat}`,
          // C5: an interrupted/off-schedule series is a "does this old dose
          // count" practical judgment call -- immunize.org's Ask the
          // Experts leads here, ahead of the general schedule source.
          noteCites: [cite('menbRescueDoseRule')],
          refs: ['immMenB', ...refs([], ['mm7349a3'])],
        })];
      }
      return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete (2-dose series)', family, seriesTotal: 2,
        note: `Healthy 2-dose MenB series complete (doses ≥6 months apart). No booster recommended unless a high-risk indication develops.${menbPregnancyCaveat}`,
        refs: refs([], ['mm7349a3']) })];
    }
    if (given >= 3) {
      return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete (accelerated 3-dose series)', family, seriesTotal: 3,
        note: `Healthy 3-dose accelerated MenB series complete [c]. No booster recommended unless a high-risk indication develops.${menbPregnancyCaveat}`,
        noteCites: [cite('menbAcceleratedRapidProtection')],
        refs: refs([], ['mm7349a3']) })];
    }
  }

  // Healthy outside 16–23y → not routinely indicated
  // C1/2026-07-24: [c] points at mm7349a3 (the same source as the
  // shared-decision recs above), not the mislabeled Penmenvy page; the
  // "preferably 16-18" claim isn't in mm7349a3 so was dropped.
  return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    note: am < M.y16
      // M16: the pre-16 card names the preferred age too, so a clinician
      // planning ahead knows the conversation is best had at 16-18 rather than
      // only that it becomes possible at 16.
      ? 'MenB shared clinical decision-making applies to ages 16 through 23 years, and ACIP prefers giving it at 16 through 18 years [c]. Not routinely indicated yet at this age without a risk factor.'
      : 'MenB is not routinely recommended for healthy adults outside the 16–23-year shared-decision window (through the 24th birthday) [c]. Vaccinate only for a high-risk indication.',
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
  const menbTransplantAloneBand = am >= M.y16 && am < M.y24; // 16 through 23 years
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
  if (am >= M.y10) {
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

// ── Public API ───────────────────────────────────────────────────────────
export function recommend(input) {
  const am = input.ageMonths ?? 0;
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
  const menacwyHistory = analyzeHistory('MenACWY', rawMenacwyDoses, am, riskIds, today, acwyRiskAnswers);
  const menbHistory    = analyzeHistory('MenB',    rawMenbDoses,    am, riskIds, today, bRiskAnswers);
  const effectiveMenacwyDoses = menacwyHistory.effective;
  const effectiveMenbDoses    = menbHistory.effective;

  const menacwy = menacwyRec(am, riskIds, effectiveMenacwyDoses, today);
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
  const pentavalentEligible = am >= M.y10 && acwyDueToday && bDueToday;

  // Determine which pentavalent matches the established/needed MenB family.
  const bFamily = menb.find((r) => r.family)?.family ?? null;
  const pentavalent = pentavalentEligible
    ? {
        eligible: true,
        note: bRequiredToday
          ? 'Both MenACWY and MenB are due today. A single pentavalent (MenABCWY) dose may be given instead of two separate injections. The two pentavalents are NOT interchangeable across the rest of the MenB series: Penmenvy = MenB-4C (continue with Bexsero/Penmenvy); Penbraya = MenB-FHbp (continue with Trumenba/Penbraya).'
          : 'MenACWY is due today. MenB is optional today (shared clinical decision) -- if you choose to give it, a single pentavalent (MenABCWY) dose may be given instead of two separate injections. The two pentavalents are NOT interchangeable across the rest of the MenB series: Penmenvy = MenB-4C (continue with Bexsero/Penmenvy); Penbraya = MenB-FHbp (continue with Trumenba/Penbraya).',
        brands: bFamily === '4C'
          ? ['Penmenvy (MenABCWY)']
          : bFamily === 'FHbp'
            ? ['Penbraya (MenABCWY)']
            : ['Penmenvy (MenABCWY)', 'Penbraya (MenABCWY)'],
        citations: resolveRefs(['pentavalentGSK2025', 'pentavalentPfizer2023']),
      }
    : { eligible: false };

  return {
    menacwy, menb, pentavalent, hct,
    history: { MenACWY: menacwyHistory, MenB: menbHistory },
    meta: { ageMonths: am, today, riskIds },
  };
}
