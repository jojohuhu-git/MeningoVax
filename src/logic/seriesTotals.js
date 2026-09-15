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

import { calendarMonthsBetween, daysBetween, DAYS } from './dateUtils.js';

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

const AGE_16Y_MONTHS = 192;

// MenACWY infant/early-childhood high-risk primary total — mirrors
// recommend.js's menacwyInfantHighRisk() completion threshold EXACTLY
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
export function menacwyInfantHighRiskTotal({ d1AgeM }) {
  const d1WasInfant7to11 = d1AgeM != null && d1AgeM >= 7 && d1AgeM < 12;
  return d1WasInfant7to11 ? 3 : 4;
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
export function menacwySeriesInfo({ riskClass, am, doses, today }) {
  if (riskClass === 'primary2') {
    if (am < 24) {
      const d1AgeM = doses[0] ? ageAtDose(doses[0], am, today) : null;
      return { total: menacwyInfantHighRiskTotal({ d1AgeM }), hasBoosterPhase: true };
    }
    return { total: MENACWY_HIGHRISK_PRIMARY_TOTAL, hasBoosterPhase: true };
  }
  if (riskClass === 'single+boost') return { total: MENACWY_SINGLE_TOTAL, hasBoosterPhase: true };
  if (riskClass === 'single') return { total: MENACWY_SINGLE_TOTAL, hasBoosterPhase: false };
  // Routine (no current MenACWY risk indication): 1 dose is enough when the
  // FIRST dose on record was given at ≥16y (ACIP: no booster needed);
  // otherwise the 16y booster is still owed, so the series isn't closed
  // until 2 doses.
  const hasDoseBefore16 = doses.some((d) => {
    const a = ageAtDose(d, am, today);
    return a != null && a < AGE_16Y_MONTHS;
  });
  return { total: hasDoseBefore16 ? 2 : 1, hasBoosterPhase: false };
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
  if (highRisk) return { total: MENB_HIGHRISK_TOTAL, hasBoosterPhase: true };
  // Healthy 2-dose schedule becomes a 3-dose total only once a D1→D2
  // interval <6 months is on record (rescue dose) — mirrors recommend.js's
  // own needsRescue check (daysBetween(d1,d2) < DAYS.months(6)) exactly.
  const d1 = doses[0];
  const d2 = doses[1];
  if (d1?.date && d2?.date && daysBetween(d1.date, d2.date) < DAYS.months(6)) {
    return { total: MENB_HEALTHY_RESCUE_TOTAL, hasBoosterPhase: false };
  }
  return { total: MENB_HEALTHY_TOTAL, hasBoosterPhase: false };
}
