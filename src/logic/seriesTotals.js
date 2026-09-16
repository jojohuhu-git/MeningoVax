// ─────────────────────────────────────────────────────────────────────────
// seriesTotals.js — single source of truth for each MenACWY/MenB schedule's
// PRIMARY series total (F1, docs/archive/handoff-2026-09-14-dose-counter-
// structural-fix.md).
//
// "Total" here is the denominator shown in the "Dose N of M" chip
// (RecCard.jsx) and the ceiling analyzeHistory() (validate.js) uses to tell
// a genuine primary-series dose from a later booster or an unindicated
// extra dose (F2/F3). Both recommend.js and validate.js call these SAME
// functions, fed by the SAME inputs (risk class, current age, the patient's
// own dose dates) — this is what guarantees the chip's M always matches the
// recommendation card's M; they can no longer drift apart the way the
// ~20 hand-typed seriesTotal literals in recommend.js did (the reported
// bug: an 82-year-old's routine MenACWY doses showed "Dose 2 of 1" /
// "Dose 3 of 1").
//
// `hasBoosterPhase: true` means doses past the primary total are expected,
// ongoing, periodic BOOSTERS (high-risk MenACWY/MenB, MenACWY travel/
// microbiologist) — analyzeHistory must NOT cap or flag these as "extra."
// `hasBoosterPhase: false` means the schedule is genuinely closed once the
// total is reached (routine MenACWY, single-dose MenACWY exposure
// indications, healthy MenB) — ACIP does not define a purpose for a dose
// past that point, so it IS an extra dose (F2).
//
// This module imports only from dateUtils.js (a leaf) and is itself a leaf
// — both validate.js and recommend.js import FROM here, so this file must
// never import from either of them.
// ─────────────────────────────────────────────────────────────────────────

import { calendarMonthsBetween, calendarIntervalElapsed, daysBetween, DAYS } from './dateUtils.js';

// Duplicated arithmetic from validate.js's ageAtDoseFromDate / recommend.js's
// ageAtDose on purpose (avoids a circular import — see header). It's the
// same 2-line age-at-a-past-dose formula both of those already duplicate.
function ageAtDose(dose, ageMonths, today) {
  if (!dose?.date) return null;
  return Math.round((ageMonths - calendarMonthsBetween(dose.date, today)) * 1e6) / 1e6;
}

export const MENACWY_HIGHRISK_PRIMARY_TOTAL = 2; // ≥2y primary2 primary series
export const MENACWY_SINGLE_TOTAL = 1;           // military / college-dorm / outbreak / travel / microbiologist first dose
export const MENB_HIGHRISK_TOTAL = 3;
export const MENB_HEALTHY_TOTAL = 2;
export const MENB_HEALTHY_RESCUE_TOTAL = 3;
// Routine MenACWY is the only schedule whose PRIMARY series is shorter than
// its total: the 11-12y dose is primary, the 16y dose is the booster that
// closes it. Exported so recommend.js's routine branches never hand-type it.
export const MENACWY_ROUTINE_PRIMARY_TOTAL = 1;

const AGE_16Y_MONTHS = 192;

// MenACWY infant/early-childhood high-risk primary total — mirrors
// recommend.js's menacwyInfantSeries() completion threshold EXACTLY
// (`seriesComplete = d1WasInfant7to11 ? given >= 3 : given >= 4`). This must
// stay a pure function of d1AgeM only, matching that threshold, not a
// separate clinical judgment call — the D6 3-dose-shortcut path (on3DosePath)
// has its OWN dedicated, already-correct seriesTotal:3 at the one rec() call
// that names it (the "Dose 3 of 3" shortcut offer); everywhere else
// (continuation, the eventual booster-phase rec, and this module's use by
// validate.js) on3DosePath patients fall through recommend.js's own
// `given >= 4` default same as a standard start, so this function must
// return 4 for them too, or the chip/headline total would stop matching
// what recommend.js is actually still asking for.
export function menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM = null }) {
  // M5 (2026-09-15): a series STARTED at 7–23 months is a 2-dose primary series.
  // This used to return 3 for a 7–11-month start and 4 for a 12–23-month one, so
  // the app asked for a third primary dose that CDC does not want and delayed the
  // first booster behind it.
  // CDC child & adolescent schedule notes, "Meningococcal serogroup A,C,W,Y
  // vaccination", special situations, Menveo (fetched live 2026-09-15):
  //   "Dose 1 at age 7–23 months: 2-dose series (dose 2 at least 12 weeks after
  //    dose 1 and after age 12 months)"
  // This reverses part of F1 (2026-09-14), which moved this from 2 to 3 to match
  // recommend.js's `given >= 3` completion guard. F1 was right that the two had
  // drifted apart; it aligned them on the wrong number. That guard moves to 2 as
  // well, so the two stay in step.
  const d1WasInfant7to23 = d1AgeM != null && d1AgeM >= 7 && d1AgeM < 24;
  if (d1WasInfant7to23) return 2;

  // P1-3 (2026-09-15): the CDC "3- or 4-dose series" row. A series begun at
  // 3-6 months whose dose 2 landed at 7 months or later completes in THREE
  // doses -- recommend.js has offered exactly that as the "3-dose shortcut"
  // for a long time, but this function kept answering 4, so the card promised
  // "Dose 3 of 3" and the follow-up card then asked for a fourth. The
  // validator, which reads this function, never believed the shortcut either.
  //
  // CDC child & adolescent schedule notes, MenACWY special situations, Menveo
  // (fetched live 2026-09-15):
  //   "Dose 1 at age 3-6 months: 3- or 4- dose series (dose 2 [and dose 3 if
  //    applicable] at least 8 weeks after previous dose until a dose is
  //    received at age 7 months or older, followed by an additional dose at
  //    least 12 weeks later and after age 12 months)"
  //
  // The band is 3-6 months, NOT 2-6. The row above it is unconditional:
  //   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6,
  //    and 12 months)"
  // recommend.js used to open the shortcut at d1AgeM >= 2, so a baby who
  // started on time at 2 months was offered a three-dose series CDC does not
  // describe. Owner decision 2026-09-15: follow CDC. vaxapp has the same
  // 2-month behaviour and is to be brought into line in its own PR.
  //
  // An unknown dose-2 age falls back to 4, the conservative answer: the
  // shortcut has to be earned by a dose actually given at >=7 months.
  const d1WasEarly = d1AgeM != null && d1AgeM >= 3 && d1AgeM <= 6;
  const d2WasAt7Plus = d2AgeM != null && d2AgeM >= 7;
  if (d1WasEarly && d2WasAt7Plus) return 3;

  return 4;
}

/**
 * menacwySeriesInfo — the total + booster-phase flag for a MenACWY
 * patient's CURRENT schedule.
 *
 * @param {'primary2'|'single+boost'|'single'|null} riskClass
 * @param {number} am — current age in months
 * @param {Array<{date?: string}>} doses — the chronological KEPT
 *   (valid/unknown) MenACWY doses so far, in the order they were kept.
 * @param {string} today — ISO date
 * @returns {{ total: number, hasBoosterPhase: boolean }}
 */
export function menacwySeriesInfo({ riskClass, am, doses, today, infantSeries = false }) {
  // M10 (2026-09-15): an infant series is an infant series whatever the
  // indication. ACIP 2020 MMWR 69(RR-9) prints the same "2-23 mos" row in
  // Table 9 (travel), Table 8 (outbreak) and Tables 4-6 (medical high risk).
  // infantSeries is menacwyInfantSeriesIndicated(riskIds) — riskClass alone
  // cannot tell travel from microbiologist, or outbreak from military, and ACIP
  // gives the latter of each pair no infant row at all.
  //
  // P0-1 (2026-09-15): the gate used to be `am < 24` alone -- today's age. Its
  // sibling menacwyPrimaryTotal() below already keys off the age at DOSE 1, so
  // on a patient's second birthday this function answered 2 while the validator
  // answered 4 for the same child: the exact engine/validator disagreement this
  // module exists to make impossible. A series BEGUN under 2 years old keeps its
  // infant length for life (CDC: "Dose 1 at age 2 months: 4-dose series").
  const d1AgeM = doses[0] ? ageAtDose(doses[0], am, today) : null;
  const d2AgeM = doses[1] ? ageAtDose(doses[1], am, today) : null;
  const startedAsInfant = d1AgeM != null && d1AgeM < 24;
  if ((am < 24 || startedAsInfant) && (riskClass === 'primary2' || infantSeries)) {
    // P1-3: d2AgeM decides the 3-vs-4-dose answer for a 3-6-month start.
    const infantTotal = menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM });
    return {
      total: infantTotal,
      // Every dose of an at-risk infant schedule is a PRIMARY dose. CDC,
      // "Meningococcal Vaccine Recommendations" (fetched live 2026-09-15):
      // "A 2-4-dose primary series", with boosters beginning only after it
      // ("booster dose 3 years after completion of the primary series and
      // every 5 years thereafter" for children under 7). So primaryTotal
      // equals the whole total here — the 12-month dose is NOT a booster.
      primaryTotal: infantTotal,
      // Outbreak has no standing booster cadence (ACIP Table 8 gives a one-off
      // top-up on re-exposure instead), but every other infant indication does.
      hasBoosterPhase: riskClass !== 'single',
    };
  }
  if (riskClass === 'primary2') return { total: MENACWY_HIGHRISK_PRIMARY_TOTAL, primaryTotal: MENACWY_HIGHRISK_PRIMARY_TOTAL, hasBoosterPhase: true };
  if (riskClass === 'single+boost') return { total: MENACWY_SINGLE_TOTAL, primaryTotal: MENACWY_SINGLE_TOTAL, hasBoosterPhase: true };
  // P0-2 (2026-09-15): this used to return hasBoosterPhase: false, which
  // validate.js treats as licence to cap the series and DISCARD any dose past
  // the total. The engine then re-planned against a history missing a dose the
  // patient had actually received, and offered that same injection again today
  // (a 4,000-patient sweep hit the pattern 115 times, all in this class).
  //
  // All three "single" indications legitimately accept a later dose:
  //   college   ACIP 2020 MMWR 69(RR-9) Table 10 footnote -- a dose after the
  //             16th birthday needs no booster, i.e. it is the dose that
  //             SATISFIES the requirement (owner decision M17).
  //   outbreak  Table 8 -- a top-up "if previously vaccinated and identified as
  //             being at increased risk" (owner decision M12).
  //   military  Table 10 -- the DoD booster every 5 years by assignment
  //             (owner decision M18).
  //
  // "single" means the PRIMARY series is one dose, not that the patient may
  // never receive another. Only "one dose and nothing ever again" earns the
  // cap: routine MenACWY and healthy MenB, both below, which keep it.
  //
  // What the three do NOT share with 'single+boost' is a standing booster
  // COUNTDOWN -- outbreak's top-up is re-exposure driven, and the military's is
  // driven by assignment. That distinction lives in recommend.js's own
  // branches, which decide what to offer; it was never this flag's job. This
  // flag answers one question, for one caller: may a dose past the total be
  // thrown away? For these three, no.
  if (riskClass === 'single') return { total: MENACWY_SINGLE_TOTAL, primaryTotal: MENACWY_SINGLE_TOTAL, hasBoosterPhase: true };
  // Routine (no current MenACWY risk indication): 1 dose is enough when the
  // FIRST dose on record was given at ≥16y (ACIP: no booster needed);
  // otherwise the 16y booster is still owed, so the series isn't closed
  // until 2 doses.
  const hasDoseBefore16 = doses.some((d) => {
    const a = ageAtDose(d, am, today);
    return a != null && a < AGE_16Y_MONTHS;
  });
  // The routine schedule is the ONE place where the primary series is shorter
  // than the total: the 11-12y dose is primary, the 16y dose is a booster that
  // closes the series. CDC, "Meningococcal Vaccine Recommendations" (fetched
  // live 2026-09-15): adolescents get a dose at 11-12 years and "a MenACWY
  // booster dose at age 16 years". A first-ever dose at >=16y needs no booster,
  // so there total is 1 and that single dose is primary.
  return { total: hasDoseBefore16 ? 2 : 1, primaryTotal: MENACWY_ROUTINE_PRIMARY_TOTAL, hasBoosterPhase: false };
}

/**
 * menbSeriesInfo — the total + booster-phase flag for a MenB patient's
 * current schedule.
 *
 * @param {boolean} highRisk
 * @param {Array<{date?: string}>} doses — chronological KEPT MenB doses
 * @returns {{ total: number, hasBoosterPhase: boolean }}
 */
export function menbSeriesInfo({ highRisk, doses }) {
  // CDC, "Meningococcal Vaccine Recommendations" (fetched live 2026-09-15):
  // people at increased risk get "A 3-dose primary series", then boosters
  // "1 year after series completion" and "Every 2 to 3 years thereafter".
  // All three doses are primary.
  if (highRisk) return { total: MENB_HIGHRISK_TOTAL, primaryTotal: MENB_HIGHRISK_TOTAL, hasBoosterPhase: true };
  // Healthy 2-dose schedule becomes a 3-dose total only once a D1→D2
  // interval <6 months is on record (rescue dose) — mirrors recommend.js's
  // own needsRescue check (daysBetween(d1,d2) < DAYS.months(6)) exactly.
  const d1 = doses[0];
  const d2 = doses[1];
  // P0-4 (2026-09-15): was `daysBetween(d1,d2) < DAYS.months(6)`, i.e. 183 days.
  // A real six-calendar-month gap is 181-184 days, so a correctly spaced 2-dose
  // series flipped to a 3-dose "rescue" series roughly half the time, decided by
  // nothing but the month the patient started in.
  if (d1?.date && d2?.date && !calendarIntervalElapsed(d1.date, 6, d2.date)) {
    // The rescue dose is part of the primary series, not a booster. CDC child
    // & adolescent schedule notes, MenB shared clinical decision-making
    // (fetched live 2026-09-15): "2-dose series at least 6 months apart (if
    // dose 2 is administered earlier than 6 months, administer dose 3 at least
    // 4 months after dose 2)" -- plainly "dose 3", never a booster.
    return { total: MENB_HEALTHY_RESCUE_TOTAL, primaryTotal: MENB_HEALTHY_RESCUE_TOTAL, hasBoosterPhase: false };
  }
  return { total: MENB_HEALTHY_TOTAL, primaryTotal: MENB_HEALTHY_TOTAL, hasBoosterPhase: false };
}

/**
 * M4: how many PRIMARY doses this patient's MenACWY series has, keyed to the
 * age at DOSE 1 — which is what decides it clinically.
 *
 * The validator needs this to answer a question it previously guessed at: is
 * the dose in front of me still part of the primary series, or is it a booster?
 * It used to assume the primary series was always two doses, so it called dose
 * 3 a booster for everyone and demanded three years of spacing. A baby with
 * asplenia on the textbook 2/4/6/12-month series had doses 3 and 4 voided.
 *
 * Note this keys off the age at dose 1, NOT the patient's current age, unlike
 * menacwySeriesInfo() above — a five-year-old who started as an infant still
 * had an infant primary series, and their old doses must be graded as such.
 *
 * CDC child & adolescent schedule notes, "Meningococcal serogroup A,C,W,Y
 * vaccination", special situations, Menveo (fetched live 2026-09-15):
 *   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6,
 *    and 12 months)"
 *   "Dose 1 at age 3–6 months: 3- or 4- dose series ..."
 *   "Dose 1 at age 7–23 months: 2-dose series ..."
 *   "Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart"
 *
 * The infant totals come from menacwyInfantHighRiskTotal() rather than being
 * restated here, so this cannot drift from what the engine asks for. That
 * function's 7–23-month answer is itself a known divergence from the CDC text
 * above — it is queue item M5, deliberately left for M5 rather than changed
 * here, so that M4 is only about WHERE the booster clock starts.
 *
 * @param {'primary2'|'single+boost'|'single'|null} riskClass
 * @param {number|null} d1AgeM — age in months at dose 1 (null if unknown)
 * @returns {number} number of primary doses before the booster phase begins
 */
export function menacwyPrimaryTotal({ riskClass, d1AgeM, d2AgeM = null, infantSeries = false }) {
  // M10 (2026-09-15): a series BEGUN under 2 years old is an infant series
  // whatever the indication, so its length comes from the age at dose 1 — not
  // from "1 dose" just because the reason was travel or an outbreak. Leaving
  // this at 1 made the validator treat dose 2 of an infant series as a booster
  // given decades too early and void it, so a baby with two correctly-spaced
  // doses was sent back to dose 1.
  //
  // infantSeries is menacwyInfantSeriesIndicated(riskIds): riskClass alone
  // cannot separate travel from microbiologist ('single+boost') or outbreak
  // from military ('single'), and ACIP gives microbiologists (Table 7, ">=10
  // yrs") and recruits (Table 10) no infant row at all.
  if (d1AgeM != null && d1AgeM < 24 && (riskClass === 'primary2' || infantSeries)) {
    return menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM });
  }
  if (riskClass === 'primary2') return MENACWY_HIGHRISK_PRIMARY_TOTAL;
  // Exposure-risk classes take a single primary dose from 2 years old.
  if (riskClass === 'single+boost' || riskClass === 'single') return MENACWY_SINGLE_TOTAL;
  // P2-1 (2026-09-15): riskClass === null is the ROUTINE patient, and this used
  // to fall through to MENACWY_HIGHRISK_PRIMARY_TOTAL (2). The routine primary
  // series is one dose — the 11-12y dose — with the 16y dose as the booster
  // that closes it; menacwySeriesInfo() above already answers 1 here. It was
  // harmless only because the single caller (validate.js) is gated on riskClass
  // being truthy, so this line was unreachable. A second caller would have got
  // the wrong answer with nothing to catch it.
  return MENACWY_ROUTINE_PRIMARY_TOTAL;
}
