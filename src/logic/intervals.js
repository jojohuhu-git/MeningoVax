// Minimum intervals, in one place.
//
// P2-1 of the 2026-09-17 fix queue: `seriesTotals.js` fixed dose TOTALS by
// giving the engine and the validator one function to ask. Intervals never got
// the same treatment, and P0-1 is what that cost — the MenACWY infant primary
// interval was hand-typed as `DAYS.weeks(4)` in four places and, separately, as
// the English words ">=4 weeks" inside the card sentence. Every one of them was
// wrong, and fixing only the constant would have left the sentence lying to the
// clinician.
//
// This module is that sibling, started with the MenACWY infant primary group
// (the group P0-1 needed). The remaining groups named in P2-1 — the >=2y
// high-risk primary, the 3- and 5-year booster cadences, the MenB month floors
// and the 4-month rescue interval, and P1-1's 4-day grace rule — are NOT here
// yet and still live where they always did. Add them one group at a time with
// the full suite green in between.
//
// The rule for callers: ask this module for the number and INTERPOLATE it into
// whatever you print. Never restate it in English.

import { menacwyInfantHighRiskTotal } from './seriesTotals.js';
import { addDays, addCalendarMonths } from './dateUtils.js';

const DAY = 1;
const WEEKS = (n) => n * 7 * DAY;

// ── MenACWY infant primary series ────────────────────────────────────────
//
// CDC child & adolescent immunization schedule notes, "Meningococcal serogroup
// A,C,W,Y vaccination", Special situations, Menveo (fetched live 2026-09-17):
//
//   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and
//    12 months)"
//   "Dose 1 at age 3-6 months: 3- or 4- dose series (dose 2 [and dose 3 if
//    applicable] at least 8 weeks after previous dose until a dose is received
//    at age 7 months or older, followed by an additional dose at least 12 weeks
//    later and after age 12 months)"
//   "Dose 1 at age 7-23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"
//
// ACIP 2020 MMWR 69(RR-9), footnote to Tables 4-6 (verbatim from the primary
// PDF, 2026-09-17) — the citation the code already carried:
//
//   "If MenACWY-CRM is initiated at ages 3-6 months, catch-up vaccination
//    includes doses at intervals of 8 weeks until the infant is aged >=7
//    months, at which time an additional dose is administered at age >=7
//    months, followed by a dose at least 12 weeks later and after the 1st
//    birthday."
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
// https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm

/** Gap between the early doses of an infant primary series. */
export const MENACWY_INFANT_EARLY_GAP = WEEKS(8);

/** Gap before the FINAL dose of an infant primary series. */
export const MENACWY_INFANT_FINAL_GAP = WEEKS(12);

/** The final infant primary dose may not be given before this age. */
export const MENACWY_INFANT_FINAL_MIN_AGE_MONTHS = 12;

/**
 * The gate the NEXT MenACWY dose in an infant primary series must clear.
 *
 * One function for all four start bands, because the difference between them is
 * only ever "is this the final primary dose or not" — and that question is
 * already answered by the series total. Deriving the interval from the total is
 * what stops the two drifting apart again.
 *
 * OWNER DECISIONS, 2026-09-17 — reasoned readings where CDC is silent, recorded
 * as decisions (not quotes) in both rule documents:
 *
 *  1. The 2-month band gets the same 8-week early gap as the 3-6-month band.
 *     CDC prints the 2-month schedule but states no minimum interval for it;
 *     the printed schedule is itself 8 weeks apart and the adjacent band
 *     requires 8 weeks explicitly.
 *  2. The final primary dose carries the same ">=12 months old AND >=12 weeks
 *     since the previous dose" test in BOTH the 2-month and the 3-6-month
 *     bands — one rule for "the final infant dose", not two.
 *
 * @param {object}  a
 * @param {?number} a.d1AgeM  age in months at dose 1 (null when not datable)
 * @param {?number} a.d2AgeM  age in months at dose 2 (null when not datable)
 * @param {number}  a.given   how many doses already count toward the series
 * @returns {{minIntervalDays: number, minAgeMonths: ?number,
 *            isFinalPrimary: boolean, total: number}}
 */
export function menacwyInfantNextDoseGate({ d1AgeM, d2AgeM = null, given }) {
  const total = menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM });
  // `given` doses are already on record, so the dose being gated is given + 1.
  const isFinalPrimary = given + 1 >= total;

  if (isFinalPrimary) {
    return {
      minIntervalDays: MENACWY_INFANT_FINAL_GAP,
      minAgeMonths: MENACWY_INFANT_FINAL_MIN_AGE_MONTHS,
      isFinalPrimary: true,
      total,
    };
  }
  return {
    minIntervalDays: MENACWY_INFANT_EARLY_GAP,
    minAgeMonths: null,
    isFinalPrimary: false,
    total,
  };
}

/** "8 weeks" / "12 weeks" — for interpolating a gate into card text. */
export function weeksLabel(days) {
  return `${days / 7} weeks`;
}

/**
 * The earliest date a gated dose may actually be given: the LATER of the
 * interval coming due and the age floor being reached.
 *
 * P0-1 (2026-09-17): every caller used to advertise `addDays(lastDate,
 * interval)` alone, so a card that correctly said "not before 12 months of age"
 * in its text still printed a date months before the first birthday. Live-
 * observed on a 7-month-old three doses in: "Next dose not yet due — eligible
 * Nov 9, 2026", a child who does not turn one until February. The interval and
 * the floor are one rule and have to be answered together.
 *
 * @param {string}  lastDate   ISO date of the previous dose
 * @param {object}  gate       from menacwyInfantNextDoseGate()
 * @param {string}  today      ISO date
 * @param {?number} ageMonths  the patient's age in months today
 */
export function earliestGatedDate(lastDate, gate, today, ageMonths) {
  const byInterval = addDays(lastDate, gate.minIntervalDays);
  if (gate.minAgeMonths == null || ageMonths == null) return byInterval;
  const monthsToGo = gate.minAgeMonths - ageMonths;
  if (monthsToGo <= 0) return byInterval;
  const byAge = addCalendarMonths(today, monthsToGo);
  return byAge > byInterval ? byAge : byInterval;
}
