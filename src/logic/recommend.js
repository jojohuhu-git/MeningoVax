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
  hasMenbRisk,
  shouldDeferMenB,
  RISK_BY_ID,
} from '../data/riskFactors.js';
import { menbFamily } from '../data/brands.js';
import { todayISO, addDays, daysBetween, calendarMonthsBetween, intervalElapsed, DAYS } from './dateUtils.js';
import { analyzeHistory } from './validate.js';

// Age bands (months)
const M = {
  y2: 24, y7: 84, y10: 120, y11: 132, y16: 192, y18: 216, y19: 228, y22: 264, y23: 276, y24: 288,
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
    status: o.status,          // due | catchup | risk-based | shared-decision | complete | not-indicated | deferred
    doseLabel: o.doseLabel,
    doseNum: o.doseNum ?? null,
    seriesTotal: o.seriesTotal ?? null,
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

  // Booster cadence per ACIP 2020 MMWR and immunize.org p2035:
  //   FIRST booster (given === 2 → dose 3):
  //     D2 completed at <7y → first booster in 3 years
  //     D2 completed at ≥7y → first booster in 5 years
  //     D2 age unknown → conservative 3 years (same as <7y)
  //   ALL SUBSEQUENT boosters (given >= 3): always 5 years regardless of D2 age.
  // (Only used in the booster branch where doses[1] exists.)
  const dose2Age = ageAtDose(doses[1] || null, am, today);
  const isFirstBooster = given === 2;
  // First booster: <7y or unknown → 3y conservative; ≥7y → 5y.
  const firstBoosterDays = (dose2Age == null || dose2Age < M.y7)
    ? DAYS.years(3)
    : DAYS.years(5);
  const boostDays = isFirstBooster ? firstBoosterDays : DAYS.years(5);

  // ── Medical high risk: 2-dose primary + lifelong boosters ────────────────
  if (riskClass === 'primary2') {
    // Infant pathways (high risk, <2y)
    if (am < M.y2) {
      return [menacwyInfantHighRisk(am, given, doses, last, today, riskIds)];
    }
    // ≥2y: 2-dose primary ≥8 weeks apart, then boosters.
    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 (high-risk primary series)',
        doseNum: 1, seriesTotal: 2, boosterSummary: 'Boosters: first booster 3–5 years after the primary series (based on completion age), then every 5 years while at risk', dueToday: true, brands: menacwyBrands(am),
        note: 'High-risk indication (asplenia, persistent complement deficiency, complement-inhibitor therapy, or HIV): 2-dose primary series ≥8 weeks apart, then a first booster 3 years after primary if completed before age 7 [1] (otherwise 5 years [2]), then every 5 years while at increased risk.',
        noteCites: [
          cite(1, 'boosterBeforeAge7'),
          cite(2, 'boosterAtOrAfterAge7'),
        ],
        // cdcRecommendations states the <7y/≥7y booster-cadence split
        // explicitly (2026-07-23 finding) — cited alongside the MMWR here.
        refs: refsFor(['cdcRecommendations']),
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
    const boostYears = boostDays === DAYS.years(3) ? '3' : '5';
    const boostLabel = isFirstBooster
      ? `first booster, ${boostYears} years after primary`
      : 'every 5 years';
    const elapsed = intervalElapsed(lastDate, boostDays, today);
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${boostLabel})`,
      doseNum: given + 1, seriesTotal: 2, boosterSummary: 'Boosters: every 5 years while at high risk (ongoing)', dueToday: elapsed,
      earliestNextDate: elapsed ? null : addDays(lastDate, boostDays),
      minIntervalDays: boostDays, brands: menacwyBrands(am),
      note: isFirstBooster
        ? `Primary series complete. This first booster is due ${boostYears} years after the primary series${boostYears === '3' ? ' (completed before age 7) [1]' : ' (primary completed at age 7 or older) [1]'}, then every 5 years while the high-risk condition persists.`
        : 'Continue MenACWY boosters every 5 years while the high-risk condition persists.',
      noteCites: isFirstBooster ? [
        boostYears === '3'
          ? cite(1, 'boosterBeforeAge7')
          : cite(1, 'boosterAtOrAfterAge7'),
      ] : [],
      // cdcRecommendations states the <7y/≥7y booster-cadence split
      // explicitly (2026-07-23 finding) — cited on the first-booster note.
      refs: isFirstBooster ? refsFor(['cdcRecommendations']) : refsFor([]),
    })];
  }

  // ── Single dose with ongoing boosters (travel, microbiologist) ───────────
  if (riskClass === 'single+boost') {
    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: '1 dose (ongoing-risk indication)',
        doseNum: 1, seriesTotal: 1, boosterSummary: 'Boosters: every 5 years while travel or occupational exposure continues (ongoing)', dueToday: true, brands: menacwyBrands(am),
        note: 'Travel to hyperendemic/epidemic areas or routine occupational exposure (microbiologist): 1 dose now. Re-vaccinate every 5 years if risk continues.',
        refs: refsFor(['cdcRecommendations']),
      })];
    }
    const elapsed = intervalElapsed(lastDate, DAYS.years(5), today);
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Booster (dose ${given + 1}, every 5 years)`,
      doseNum: given + 1, seriesTotal: 1, boosterSummary: 'Boosters: every 5 years while travel or occupational exposure continues (ongoing)', dueToday: elapsed,
      earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.years(5)),
      minIntervalDays: DAYS.years(5), brands: menacwyBrands(am),
      note: 'Re-vaccinate every 5 years while travel or occupational exposure continues.',
      refs: refsFor(['cdcRecommendations']),
    })];
  }

  // ── Single dose, no booster (military, college dorm, ACWY outbreak) ───────
  if (riskClass === 'single') {
    const isCollege = riskIds.includes('college_dorm');

    // College-dorm rule keys off whether a dose was given at age ≥16y.
    if (isCollege) {
      // Confirmed ≥16y dose → requirement satisfied.
      const confirmedAt16 = doses.some((d) => {
        const a = ageAtDose(d, am, today);
        return a != null && a >= M.y16;
      });
      if (confirmedAt16) {
        return [rec({
          vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete (dose given at ≥16y)', seriesTotal: 1,
          note: 'A MenACWY dose given at age ≥16 years satisfies the first-year-college-resident requirement; no additional dose is needed.',
          refs: refsFor([]),
        })];
      }
      // A prior dose exists but cannot be confirmed as ≥16y (earlier dose, or date unknown).
      if (given >= 1) {
        const datesKnown = doses.every((d) => d?.date || typeof d?.ageMonths === 'number');
        return [rec({
          vaccine: 'MenACWY', status: 'risk-based', doseLabel: '1 dose (booster at ≥16y)',
          doseNum: given + 1, seriesTotal: 1, dueToday: true, brands: menacwyBrands(am),
          note: datesKnown
            ? 'A prior MenACWY dose is recorded but was given before age 16. The college-residence requirement is met only by a dose at age ≥16 years: give one dose now.'
            : 'A prior MenACWY dose is recorded but its age cannot be confirmed. If it was given on or after the 16th birthday, no further dose is needed; otherwise give one dose now. Confirm the date in the record.',
          // C5: an unconfirmed-date dose is a "does this old dose count"
          // practical judgment call, not a rule a single MMWR table defines
          // -- immunize.org's Ask the Experts leads here.
          refs: datesKnown ? refsFor([]) : ['immMenACWY', ...refsFor([])],
        })];
      }
      // No history.
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: '1 dose', seriesTotal: 1,
        doseNum: 1, dueToday: true, brands: menacwyBrands(am),
        note: 'First-year college student living in a residence hall: a single MenACWY dose, unless a dose was already given at age ≥16 years.',
        refs: refsFor([]),
      })];
    }

    // Military recruit / serogroup A/C/W/Y outbreak: a single dose satisfies.
    if (given >= 1) {
      return [rec({
        vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: 1,
        note: 'A documented MenACWY dose satisfies this single-dose indication (military recruit or serogroup A/C/W/Y outbreak). Re-dose only if a separate ongoing-risk indication applies.',
        refs: refsFor([]),
      })];
    }
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based', doseLabel: '1 dose', seriesTotal: 1,
      doseNum: 1, dueToday: true, brands: menacwyBrands(am),
      note: 'Military recruits and persons at risk during a serogroup A/C/W/Y outbreak: a single MenACWY dose.',
      refs: refsFor([]),
    })];
  }

  // ── No MenACWY risk → routine adolescent schedule ────────────────────────
  return menacwyRoutine(am, given, doses, last, today);
}

function menacwyInfantHighRisk(am, given, doses, last, today, riskIds) {
  // C5/2026-07-24: ACIP 2020 MMWR is the citation. cdcChildMenACWY dropped —
  // it just restates the same MMWR rule (2026-07-23 owner decision).
  const refs = collectRefs(riskIds, [], ['acip2020']);
  const lastDate = last?.date || null;
  if (am < M.y2 && given === 0 && am >= 2) {
    // start series; Menveo only
    if (am <= 6) {
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 4 (infant high-risk)', doseNum: 1, seriesTotal: 4, boosterSummary: 'Boosters: first in 3 years, then every 5 years while at risk', dueToday: true,
        brands: MENACWY_INFANT, minIntervalDays: DAYS.weeks(4),
        note: 'High-risk infants 2–6 months: 4-dose Menveo series at 2, 4, 6, and 12 months (≥4 weeks between primary doses) [1]. Only Menveo is licensed for infants ≥2 months.',
        noteCites: [cite(1, 'acwyInfantHighRisk2to6mo')], refs });
    }
    if (am <= 11) {
      // D5: D2 must be ≥12 weeks after D1 AND not before 12 months of age.
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 + booster (infant high-risk 7–11mo)', doseNum: 1, seriesTotal: 2, boosterSummary: 'Boosters: first in 3 years, then every 5 years while at risk', dueToday: true,
        brands: MENACWY_INFANT, minIntervalDays: DAYS.weeks(12),
        note: 'High-risk infants 7–11 months: 2-dose primary with Menveo. Dose 2 must be given ≥12 weeks after dose 1 AND not before 12 months of age [1]. Then a booster at 12–23 months (≥12 weeks after the primary series).',
        noteCites: [cite(1, 'acwyInfantHighRisk7to23mo')], refs });
    }
    // 12-23m unvaccinated. D5: D2 ≥12 weeks after D1 (≥12m age floor already satisfied in this band).
    return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 (high-risk 12–23mo)', doseNum: 1, seriesTotal: 2, boosterSummary: 'Boosters: first in 3 years, then every 5 years while at risk', dueToday: true,
      brands: menacwyBrands(am), minIntervalDays: DAYS.weeks(12),
      note: 'High-risk children 12–23 months, unvaccinated: 2-dose primary ≥12 weeks apart [1], then a first booster in 3 years (primary series completed before age 7) [2], then every 5 years while at risk.',
      noteCites: [cite(1, 'acwyInfantHighRisk7to23mo'), cite(2, 'boosterBeforeAge7')], refs });
  }

  // ── Continuing an infant series ──────────────────────────────────────────
  // D6: "3-dose shortcut" — if D1 was 3–6m (standard 4-dose series) AND D2 was given at ≥7m,
  // the final dose given at ≥12m AND ≥12 weeks after the previous dose completes the series
  // (3 doses total, no 4th dose needed). Otherwise the standard 4-dose path applies.
  // When D1/D2 ages are unknown, fall back conservatively to the standard 4-dose series.
  const d1AgeM = given >= 1 ? ageAtDose(doses[0], am, today) : null;
  const d2AgeM = given >= 2 ? ageAtDose(doses[1], am, today) : null;
  const d1WasEarly = d1AgeM != null && d1AgeM >= 2 && d1AgeM <= 6; // started at 2–6m
  const d2WasAt7Plus = d2AgeM != null && d2AgeM >= 7;             // D2 at ≥7m
  const on3DosePath = d1WasEarly && d2WasAt7Plus;
  // D5 fix: detect whether D1 was in the 7–11m band (D2 needs ≥12-week + ≥12m floor)
  const d1WasInfant7to11 = d1AgeM != null && d1AgeM >= 7 && d1AgeM < 12;

  // D6: if on the 3-dose shortcut path and 2 doses given, next is the completing dose (D3).
  if (on3DosePath && given === 2) {
    const elapsed = intervalElapsed(lastDate, DAYS.weeks(12), today);
    const ageFloor = am >= 12;
    return rec({ vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: 'Dose 3 of 3 (infant high-risk, 3-dose shortcut)',
      doseNum: 3, seriesTotal: 3, boosterSummary: 'Boosters: first in 3 years, then every 5 years while at risk',
      dueToday: elapsed && ageFloor,
      earliestNextDate: (elapsed && ageFloor) ? null : addDays(lastDate, DAYS.weeks(12)),
      minIntervalDays: DAYS.weeks(12),
      brands: MENACWY_INFANT,
      note: 'D6: Dose 2 was given at ≥7 months, so the series can complete in 3 doses. This final dose is due ≥12 weeks after dose 2 AND not before 12 months of age [1]. After completion, a first booster in 3 years (primary series completed before age 7) [2], then every 5 years while at risk.',
      noteCites: [cite(1, 'acwyInfantHighRisk7to23mo'), cite(2, 'boosterBeforeAge7')],
      refs });
  }

  // H1: Completion guards — detect when the infant series is done and transition to boosters.
  // 7–11m start (2-dose primary + 1 booster = 3 total): complete at given >= 3.
  // 2–6m start standard path (4-dose: primary at 2/4/6m + booster at 12m): complete at given >= 4.
  // (The 3-dose shortcut path is handled above at given === 2.)
  const seriesComplete = d1WasInfant7to11 ? given >= 3 : given >= 4;
  if (seriesComplete) {
    // Cadence: first booster (effectiveIdx 2) — D2 age <7y → 3y; subsequent → 5y.
    // Since these are infants, D2 age is always <7y → first booster is 3y, then 5y thereafter.
    const isFirstInfantBooster = given === (d1WasInfant7to11 ? 3 : 4);
    const boostDays = isFirstInfantBooster ? DAYS.years(3) : DAYS.years(5);
    const elapsedBoost = intervalElapsed(lastDate, boostDays, today);
    return rec({ vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${isFirstInfantBooster ? 'first booster, 3 years after primary' : 'every 5 years'})`,
      doseNum: given + 1, seriesTotal: d1WasInfant7to11 ? 2 : 4, boosterSummary: 'Boosters: every 5 years while at risk (ongoing)',
      dueToday: elapsedBoost,
      earliestNextDate: elapsedBoost ? null : addDays(lastDate, boostDays),
      minIntervalDays: boostDays,
      brands: menacwyBrands(am),
      note: isFirstInfantBooster
        ? 'Infant high-risk primary series complete. First booster is due 3 years after the primary series (completed before age 7) [1], then every 5 years while the high-risk condition persists.'
        : 'Continue MenACWY boosters every 5 years while the high-risk condition persists.',
      noteCites: isFirstInfantBooster ? [cite(1, 'boosterBeforeAge7')] : [],
      refs });
  }

  // Standard continuation for 2–6m start series (D2/D3 primary) or 7–11m start (D2)
  const nextIntervalDays = d1WasInfant7to11 ? DAYS.weeks(12) : DAYS.weeks(4);
  const elapsed = intervalElapsed(lastDate, nextIntervalDays, today);
  // For 7–11m D1, also enforce ≥12m age floor on D2
  const ageFloorMetActual = !d1WasInfant7to11 || am >= 12;
  return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose ${given + 1} (infant high-risk series)`, doseNum: given + 1, seriesTotal: on3DosePath ? 3 : 4, boosterSummary: 'Boosters: first in 3 years, then every 5 years while at risk',
    dueToday: elapsed && ageFloorMetActual,
    earliestNextDate: (elapsed && ageFloorMetActual) ? null : addDays(lastDate, nextIntervalDays),
    minIntervalDays: nextIntervalDays,
    brands: MENACWY_INFANT,
    note: d1WasInfant7to11
      ? 'Dose 2 of 2-dose high-risk infant series: ≥12 weeks after dose 1 AND not before 12 months of age [1]. Then a first booster in 3 years (primary series completed before age 7) [2], then every 5 years while at risk.'
      : 'Continue the high-risk infant Menveo series (≥4 weeks between primary doses; booster at ~12 months) [1], then a first booster in 3 years (primary series completed before age 7) [2], then every 5 years while at risk.',
    noteCites: d1WasInfant7to11
      ? [cite(1, 'acwyInfantHighRisk7to23mo'), cite(2, 'boosterBeforeAge7')]
      : [cite(1, 'acwyInfantHighRisk2to6mo'), cite(2, 'boosterBeforeAge7')],
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
  const refs = ['acip2020'];
  const routineCite = [cite(1, 'acwyRoutine1112and16')];
  const lastDate = last?.date || null;
  const hasDoseAt16 = doses.some((d) => (ageAtDose(d, am, today) ?? 0) >= M.y16);

  if (am < M.y11) {
    return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not yet due',
      note: 'Routine MenACWY is recommended at 11–12 years (with a booster at 16 years) [1]. No routine dose is indicated at this age without a risk factor.',
      noteCites: [cite(1, 'acwyRoutine1112and16')],
      refs })];
  }
  // 11–15y
  if (am < M.y16) {
    if (given === 0) {
      return [rec({ vaccine: 'MenACWY', status: 'due', doseLabel: 'Dose 1 (routine, 11–12y)', doseNum: 1, seriesTotal: 1, boosterSummary: 'Boosters: 1 more - at age 16', dueToday: true,
        brands: menacwyBrands(am),
        note: 'Routine adolescent dose at 11–12 years. A booster follows at 16 years [1]. If MenB is also being started under shared clinical decision-making, a pentavalent product may be used when both are given the same day.',
        noteCites: [cite(1, 'acwyRoutine1112and16')],
        refs })];
    }
    // already has dose 1 → booster due at 16y (future)
    // B6: this isn't a quiet "done" state — a booster is still coming. Compute
    // an approximate due date (the patient's 16th birthday) so it's not just
    // "complete" with no further information.
    const monthsUntil16 = M.y16 - am;
    const boosterDueDate = addDays(today, DAYS.months(monthsUntil16));
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Booster due at 16y', seriesTotal: 1,
      boosterSummary: 'Boosters: 1 more - at age 16',
      earliestNextDate: null,
      boosterDueDate,
      note: 'Routine dose 1 recorded. The routine booster is due at age 16 years [1] (see the approximate date above).',
      noteCites: routineCite, refs })];
  }
  // 16–18y
  if (am < M.y19) {
    if (hasDoseAt16) {
      return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: 1,
        note: 'A MenACWY dose given at age ≥16 years completes the routine adolescent schedule [1]; no further routine doses are needed.',
        noteCites: routineCite, refs })];
    }
    return [rec({ vaccine: 'MenACWY', status: given === 0 ? 'catchup' : 'due',
      doseLabel: given === 0 ? 'Dose 1 (catch-up, ≥16y, no booster needed)' : 'Booster (16y)',
      doseNum: given + 1, seriesTotal: 1, dueToday: true, brands: menacwyBrands(am),
      note: given === 0
        ? 'Unvaccinated adolescent ≥16 years: a single MenACWY dose; because it is given at ≥16y, no booster is required [1].'
        : 'Routine 16-year booster (the dose given at 11–12y does not count as the booster) [1].',
      noteCites: routineCite, refs })];
  }
  // 19–21y: catch-up if no dose at ≥16y; otherwise not indicated
  // D2: Job aid rule — all patients 17–21y with no MenACWY on/after the 16th birthday
  // should receive catch-up Dose 1 of 1. No booster needed when given at ≥16y.
  // Especially important for first-year college students living in residence halls.
  if (am < M.y22) { // <22y — through 21st birthday (264m = 22y); 'through 21 years' is inclusive to 22nd birthday
    if (!hasDoseAt16) {
      return [rec({ vaccine: 'MenACWY', status: 'catchup',
        doseLabel: given === 0 ? 'Dose 1 of 1 (catch-up, 19–21y)' : 'Dose (catch-up, no dose at ≥16y)',
        doseNum: given + 1, seriesTotal: 1, dueToday: true, brands: menacwyBrands(am),
        note: 'No MenACWY dose confirmed on or after the 16th birthday. A single catch-up dose is recommended: when given at ≥16 years, no booster is needed [1]. Especially recommended for first-year college students living in residence halls.',
        noteCites: routineCite, refs })];
    }
    // Has a dose at ≥16y → complete
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: 1,
      note: 'A MenACWY dose given at age ≥16 years satisfies the adolescent schedule [1]; no further routine doses are needed.',
      noteCites: routineCite, refs })];
  }
  // ≥22y healthy, no risk
  // A1: a dose given at ≥16y completes the adolescent schedule regardless of
  // current age — this branch must check hasDoseAt16 like every earlier band.
  if (hasDoseAt16) {
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete', seriesTotal: 1,
      note: 'A MenACWY dose given at age ≥16 years completed the adolescent schedule [1]; no further routine doses are needed.',
      noteCites: routineCite, refs })];
  }
  return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    note: 'Healthy adults ≥22 years without a risk factor are not routinely recommended to receive MenACWY. Vaccinate only if a risk indication applies (asplenia, complement deficiency, complement-inhibitor therapy, HIV, microbiologist, travel, military, or outbreak).', refs })];
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
  const refs = (extra = []) => collectRefs(riskIds, extra, highRisk ? ['acip2020'] : ['cdcChildMenB']);

  // MenB is only licensed ≥10y.
  if (am < M.y10) {
    if (highRisk) {
      return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not yet age-eligible',
        note: 'MenB vaccines are licensed from age 10 years. This high-risk patient becomes MenB-eligible at age 10; track for the 3-dose high-risk series then.', refs: refs() })];
    }
    return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not indicated',
      note: 'MenB vaccines (Bexsero, Trumenba, Penmenvy, Penbraya) are FDA-licensed from age 10 years. Without a high-risk indication, routine shared-decision-making for MenB applies from age 16 through 23 years. At 10–15 years, MenB is indicated only for patients with a qualifying risk factor (asplenia, complement deficiency, complement-inhibitor therapy, or microbiologist exposure).', refs: refs() })];
  }

  // Pregnancy deferral (unless an overriding high-risk indication applies).
  if (shouldDeferMenB(riskIds)) {
    return [rec({ vaccine: 'MenB', status: 'deferred', doseLabel: 'Defer during pregnancy', seriesTotal: highRisk ? 3 : 2,
      note: 'MenB is generally deferred during pregnancy due to limited safety data, unless the patient is at increased risk (asplenia, complement deficiency, complement-inhibitor therapy, microbiologist, or serogroup B outbreak) [1].',
      noteCites: [cite(1, 'menbPregnancyDeferral')],
      refs: refs() })];
  }

  // ── High-risk: 3-dose 0/1–2/6 primary + boosters ─────────────────────────
  if (highRisk) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: 'Dose 1 of 3 (high-risk series)', doseNum: 1, seriesTotal: 3, boosterSummary: 'Boosters: first in 1 year, then every 2–3 years while at risk', dueToday: true,
        family, brands: menbBrands(family),
        note: 'High-risk indication: 3-dose MenB series at 0, 1–2, and 6 months. Pick one antigen family and stay in it: MenB-4C (Bexsero/Penmenvy) and MenB-FHbp (Trumenba/Penbraya) are NOT interchangeable.',
        // cdcRecommendations (2026-07-24 finding): current CDC guidance
        // states this same 3-dose schedule applies to both antigen
        // families, superseding the 2020 MMWR's brand-split table.
        refs: refs(['cdcComplementInhibitor', 'cdcRecommendations']) })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, DAYS.weeks(4), today);
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 2 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 2, seriesTotal: 3, boosterSummary: 'Boosters: first in 1 year, then every 2–3 years while at risk',
        dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.weeks(4)), minIntervalDays: DAYS.weeks(4),
        family, brands: menbBrands(family),
        note: 'High-risk 3-dose schedule: dose 2 is given 1–2 months (≥4 weeks) after dose 1. Continue in the same antigen family as dose 1.',
        refs: refs(['cdcRecommendations']) })];
    }
    if (given === 2) {
      // C1: D3 requires BOTH ≥6 months from D1 AND ≥4 months from D2.
      // The earlier check (engine vs validator disagreement) only used D1.
      // Now gate on both; earliestNextDate = later of the two floors.
      const d1Date = doses[0]?.date ?? null;
      const d2Date = doses[1]?.date ?? null;
      const fromD1 = d1Date ? intervalElapsed(d1Date, DAYS.months(6), today) : true;
      const fromD2 = d2Date ? intervalElapsed(d2Date, DAYS.months(4), today) : true;
      const elapsed = fromD1 && fromD2;
      // Compute the later of the two earliest dates (whichever constraint binds).
      let earliestNextDate = null;
      if (!elapsed) {
        const e1 = d1Date ? addDays(d1Date, DAYS.months(6)) : null;
        const e2 = d2Date ? addDays(d2Date, DAYS.months(4)) : null;
        if (e1 && e2) earliestNextDate = e1 > e2 ? e1 : e2;
        else earliestNextDate = e1 ?? e2;
      }
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 3 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 3, seriesTotal: 3, boosterSummary: 'Boosters: first in 1 year, then every 2–3 years while at risk',
        dueToday: elapsed, earliestNextDate,
        minIntervalDays: DAYS.months(4), // min from D2 (D1 floor shown in note)
        family, brands: menbBrands(family),
        note: 'High-risk 3-dose schedule: dose 3 is given ≥6 months after dose 1 AND ≥4 months after dose 2 (0/1–2/6 month schedule). After completion, boost 1 year later, then every 2–3 years while at risk.',
        refs: refs(['cdcRecommendations']) })];
    }
    // given >= 3: primary complete → boosters
    const firstBooster = given === 3;
    const intervalDays = firstBooster ? DAYS.years(1) : DAYS.years(2);
    const elapsed = intervalElapsed(lastDate, intervalDays, today);
    return [rec({ vaccine: 'MenB', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${firstBooster ? '1 year after primary' : 'every 2–3 years'})`,
      doseNum: given + 1, seriesTotal: 3, boosterSummary: 'Boosters: every 2–3 years while at high risk (ongoing)', dueToday: elapsed,
      earliestNextDate: elapsed ? null : addDays(lastDate, intervalDays), minIntervalDays: intervalDays,
      family, brands: menbBrands(family),
      note: 'High-risk MenB booster: 1 year after completing the primary series, then every 2–3 years while the high-risk condition persists. Stay in the same antigen family.',
      refs: refs(['cdcRecommendations']) })];
  }

  // ── Healthy 16–23y shared clinical decision-making: 2-dose 0/6 ───────────
  if (am >= M.y16 && am < M.y24) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: 'Dose 1 of 2 (shared clinical decision)', doseNum: 1, seriesTotal: 2, dueToday: true,
        family, brands: menbBrands(family),
        note: 'Healthy adolescents/young adults 16–23 years (preferably 16–18) may receive MenB based on shared clinical decision-making [1]. Standard schedule: 2 doses ≥6 months apart (applies to both Bexsero and Trumenba). If rapid protection is needed (e.g. starting college within 6 months), a planned 3-dose series (0, 1–2, and 6 months) may be used instead.',
        noteCites: [cite(1, 'menbSharedDecision1623')],
        refs: refs(['cdcChildMenB', 'pentavalentGSK2025']) })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, DAYS.months(6), today);
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: `Dose 2 of 2 (${family || 'same family'})`, doseNum: 2, seriesTotal: 2,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.months(6)), minIntervalDays: DAYS.months(6),
        family, brands: menbBrands(family),
        note: 'Healthy 2-dose schedule: dose 2 ≥6 months after dose 1 (applies to both Bexsero and Trumenba). Series complete after 2 doses given ≥6 months apart. If dose 2 is given earlier than 6 months, a third rescue dose will be needed ≥4 months after dose 2.',
        refs: refs(['cdcChildMenB', 'pentavalentGSK2025']) })];
    }
    if (given === 2) {
      const dose1date = doses[0]?.date;
      const dose2date = doses[1]?.date;
      const d1d2Days = (dose1date && dose2date)
        ? daysBetween(dose1date, dose2date)
        : null;
      const needsRescue = d1d2Days !== null && d1d2Days < DAYS.months(6);
      if (needsRescue) {
        const elapsed = intervalElapsed(dose2date, DAYS.months(4), today);
        return [rec({
          vaccine: 'MenB', status: 'shared-decision',
          doseLabel: 'Dose 3 of 3 (rescue: dose 2 given early)',
          doseNum: 3, seriesTotal: 3, dueToday: elapsed,
          earliestNextDate: elapsed ? null : addDays(dose2date, DAYS.months(4)),
          minIntervalDays: DAYS.months(4),
          family, brands: menbBrands(family),
          note: 'Dose 2 was given less than 6 months after dose 1. A third rescue dose is needed ≥4 months after dose 2 to complete the series.',
          // C5: an interrupted/off-schedule series is a "does this old dose
          // count" practical judgment call -- immunize.org's Ask the
          // Experts leads here, ahead of the general CDC schedule note.
          refs: ['immMenB', ...refs(['cdcChildMenB'])],
        })];
      }
      return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete (2-dose series)', family, seriesTotal: 2,
        note: 'Healthy 2-dose MenB series complete (doses ≥6 months apart). No booster recommended unless a high-risk indication develops.',
        refs: refs(['cdcChildMenB']) })];
    }
    if (given >= 3) {
      return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete (accelerated 3-dose series)', family, seriesTotal: 3,
        note: 'Healthy 3-dose accelerated MenB series complete. No booster recommended unless a high-risk indication develops.',
        refs: refs(['cdcChildMenB']) })];
    }
  }

  // Healthy outside 16–23y → not routinely indicated
  return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    note: am < M.y16
      ? 'MenB shared clinical decision-making applies to ages 16 through 23 years (preferably 16–18) [1]. Not routinely indicated yet at this age without a risk factor.'
      : 'MenB is not routinely recommended for healthy adults outside the 16–23-year shared-decision window (through the 24th birthday) [1]. Vaccinate only for a high-risk indication.',
    noteCites: [cite(1, 'menbSharedDecision1623')],
    family, refs: refs() })];
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

// ── Public API ───────────────────────────────────────────────────────────
export function recommend(input) {
  const am = input.ageMonths ?? 0;
  const riskIds = input.riskIds ?? [];
  const today = todayISO(input.today);
  const rawMenacwyDoses = (input.menacwyDoses ?? []).filter(Boolean);
  const rawMenbDoses = (input.menbDoses ?? []).filter(Boolean);
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
  const effectiveMenacwyDoses = analyzeHistory('MenACWY', rawMenacwyDoses, am, riskIds, today, acwyRiskAnswers).effective;
  const effectiveMenbDoses    = analyzeHistory('MenB',    rawMenbDoses,    am, riskIds, today, bRiskAnswers).effective;

  const menacwy = menacwyRec(am, riskIds, effectiveMenacwyDoses, today);
  const menb = menbRec(am, riskIds, effectiveMenbDoses, today);

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

  return { menacwy, menb, pentavalent, meta: { ageMonths: am, today, riskIds } };
}
