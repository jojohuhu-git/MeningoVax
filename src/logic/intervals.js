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
import {
  addDays, addCalendarMonths, calendarIntervalElapsed, calendarMonthsBetween,
  daysInMonthOf,
} from './dateUtils.js';

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

// ── MenACWY >=2y high-risk primary series ────────────────────────
//
// The 2-dose primary series a patient aged 2 years or older gets for a medical
// high-risk indication (asplenia, persistent complement deficiency,
// complement-inhibitor therapy, HIV): the two doses are 8 weeks apart.
//
// ACIP 2020 MMWR 69(RR-9), the high-risk schedule tables the engine already
// cites through `acip2020`. The NUMBER is unchanged by P2-1 — it was already 8
// weeks in both recommend.js and validate.js. What changed is that it is now
// written down once instead of four times (three in the engine, one in the
// validator), and the card sentence interpolates it rather than spelling "8
// weeks" out in English beside it. That second copy in the prose is the half of
// P0-1 that would have kept misleading a clinician even after the constant was
// corrected.
export const MENACWY_HIGHRISK_PRIMARY_GAP = WEEKS(8);

// ── Booster cadences ────────────────────────────────────
//
// P2-1 group 2 (2026-09-17). FOUR branches each decided how long until the next
// MenACWY booster with their own `? 3 : 5` — the >=2y high-risk branch, the
// travel/microbiologist branch, the infant branch, and the outbreak top-up —
// and five more places spelled the answer out in English on the card. The
// numbers all agreed; nothing made them agree. No number changes here.
//
// ACIP 2020 MMWR 69(RR-9), Tables 4-10, through the `boosterBeforeAge7` and
// `boosterAtOrAfterAge7` citations the cards already carry.

// Age at which the first-booster interval changes, in months.
const BOOSTER_AGE_SPLIT_MONTHS = 84; // 7 years

/** First MenACWY booster when the primary series completed before age 7. */
export const MENACWY_FIRST_BOOSTER_YEARS_UNDER_7 = 3;
/** First MenACWY booster when it completed at age 7 or older. */
export const MENACWY_FIRST_BOOSTER_YEARS_FROM_7 = 5;
/** Every booster after the first, whatever the completion age. */
export const MENACWY_BOOSTER_CADENCE_YEARS = 5;

/**
 * Years until the FIRST MenACWY booster.
 *
 * An unknown completion age falls to the SHORTER interval on purpose: bringing
 * a booster forward is the conservative error, and every branch that had its
 * own copy of this rule already made that choice.
 *
 * @param {?number} primaryCompletionAgeMonths age at the last primary dose
 */
export function menacwyFirstBoosterYears(primaryCompletionAgeMonths) {
  return (primaryCompletionAgeMonths == null || primaryCompletionAgeMonths < BOOSTER_AGE_SPLIT_MONTHS)
    ? MENACWY_FIRST_BOOSTER_YEARS_UNDER_7
    : MENACWY_FIRST_BOOSTER_YEARS_FROM_7;
}

/** Years until this patient's next MenACWY booster, first or later. */
export function menacwyBoosterYears({ isFirstBooster, primaryCompletionAgeMonths }) {
  return isFirstBooster
    ? menacwyFirstBoosterYears(primaryCompletionAgeMonths)
    : MENACWY_BOOSTER_CADENCE_YEARS;
}

// The outbreak top-up looks like the first-booster rule and is NOT the same
// rule. ACIP Table 8 gives an outbreak contact a single further dose when they
// are identified at risk AGAIN, and it keys off the patient's age NOW, not the
// age at which their series was completed. Kept as its own named export so a
// future tidy-up cannot merge the two on the strength of them sharing a 3 and
// a 5 (owner-confirmed 2026-09-15: a top-up, not a standing countdown).
export const MENACWY_OUTBREAK_TOPUP_YEARS_UNDER_7 = 3;
export const MENACWY_OUTBREAK_TOPUP_YEARS_FROM_7 = 5;

/** Years before an outbreak contact may be topped up again, by age TODAY. */
export function menacwyOutbreakTopUpYears(currentAgeMonths) {
  return currentAgeMonths < BOOSTER_AGE_SPLIT_MONTHS
    ? MENACWY_OUTBREAK_TOPUP_YEARS_UNDER_7
    : MENACWY_OUTBREAK_TOPUP_YEARS_FROM_7;
}

/** First MenB booster for a high-risk patient: 1 year after the primary series. */
export const MENB_HIGHRISK_FIRST_BOOSTER_YEARS = 1;
/**
 * Later MenB high-risk boosters. CDC says "every 2-3 years"; 2 is the FLOOR the
 * validator enforces and "2-3 years" is what the card says. The two live side
 * by side so nobody tidies the range in the prose down to the floor — they are
 * not the same claim.
 */
export const MENB_HIGHRISK_BOOSTER_CADENCE_YEARS = 2;
export const MENB_HIGHRISK_BOOSTER_CADENCE_LABEL = '2–3 years';

/** Years until this patient's next MenB high-risk booster. */
export function menbHighRiskBoosterYears(isFirstBooster) {
  return isFirstBooster
    ? MENB_HIGHRISK_FIRST_BOOSTER_YEARS
    : MENB_HIGHRISK_BOOSTER_CADENCE_YEARS;
}

/** "1 year" / "3 years" — for interpolating a cadence into card text. */
export function yearsLabel(years) {
  return `${years} year${years === 1 ? '' : 's'}`;
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

  // P0-1a (2026-09-17): `monthsToGo` is almost never a whole number — ageMonths
  // comes from calendarMonthsBetween(dob, today), which carries a day
  // remainder. Handing that straight to addCalendarMonths() put the fraction
  // into the date string ("2027-2.5-17"), and the card rendered "eligible
  // undefined 17, 2027". Whole months are added as months; what is left over is
  // added as days, scaled by the length of the month it lands in — the same
  // convention calendarMonthsBetween uses to produce the fraction, so the two
  // agree.
  //
  // The leftover rounds UP. This date is a MINIMUM: advertising it a day early
  // would invite a dose given before the child is old enough. A day late costs
  // nothing, and the 4-day grace rule (P1-1) covers the boundary anyway.
  const wholeMonths = Math.floor(monthsToGo);
  const base = addCalendarMonths(today, wholeMonths);
  const leftover = monthsToGo - wholeMonths;
  const byAge = leftover > 0
    ? addDays(base, Math.ceil(leftover * daysInMonthOf(base)))
    : base;
  return byAge > byInterval ? byAge : byInterval;
}

// ── The 4-day grace rule (P1-1, 2026-09-17) ──────────────────────────────
//
// CDC, general best practices, on the same schedule-notes page this app already
// cites (fetched live 2026-09-17):
//
//   "Vaccine doses administered <=4 days before the minimum age or interval are
//    considered valid. Doses of any vaccine administered >=5 days earlier than
//    the minimum age or minimum interval should not be counted as valid and
//    should be repeated as age appropriate."
//
// This was implemented NOWHERE. Every age gate and every interval in the app
// was a hard edge, so the app advised repeating doses ACIP counts. Reproduced:
// a healthy patient whose MenACWY dose came 3 days before their 16th birthday
// was told it "does not count toward the routine series" — an unnecessary
// injection.
//
// WHAT THIS APPLIES TO, and what it deliberately does not.
//
// The rule is about whether a dose that was ALREADY GIVEN counts. It is a
// validity rule, so it lives on the validator's thresholds. Two exclusions,
// both deliberate:
//
//  1. NOT the scheduler. recommend.js's "due today" and "earliest next date"
//     must keep using the real minimum. Granting grace there would make the app
//     advertise a date 4 days early and actively advise giving doses before the
//     minimum interval — which is not what CDC's sentence permits. The app
//     therefore still says "eligible on the 9th" and still ACCEPTS a dose given
//     on the 5th.
//
//  2. NOT the series-length tests in seriesTotals.js. Those decide how many
//     doses a series HAS (e.g. MenB high-risk "if dose 2 was at least 6 months
//     after dose 1, dose 3 not needed"). That 6 months is a condition for the
//     series being complete, not a minimum interval for a dose to be valid, and
//     granting grace there would REMOVE a dose from the plan. The clinical
//     authority rule is explicit that we never adopt a reading that recommends
//     fewer doses.

/** Days a dose may precede a minimum age or interval and still count. */
export const GRACE_DAYS = 4;

/**
 * Does an interval measured in DAYS clear its minimum, allowing the grace?
 * Use for week-based minimums (4, 8, 12 weeks), which are exact day counts.
 */
export function intervalMeetsMinimum(actualDays, minDays) {
  return actualDays >= minDays - GRACE_DAYS;
}

/**
 * Does a CALENDAR-month interval clear its minimum, allowing the grace?
 *
 * The grace is applied by moving the LATER date forward, not by subtracting an
 * averaged number of days from the minimum — the same reason P0-4/P0-5 moved
 * these comparisons onto the calendar in the first place.
 */
export function calendarIntervalMeetsMinimum(sinceISO, months, refISO) {
  if (!sinceISO || !refISO) return true;
  return calendarIntervalElapsed(sinceISO, months, addDays(refISO, GRACE_DAYS));
}

/**
 * Was the patient old enough at this dose, allowing the grace?
 *
 * Ages here are fractional months, and 4 days is not a fixed fraction of a
 * month (it is 4/28 in February and 4/31 in March). Rather than pick an average
 * and reintroduce exactly the drift P0-4 removed, this re-derives the age as if
 * the dose had been given GRACE_DAYS later, using the same calendar arithmetic
 * that produced the age in the first place.
 *
 * `when` carries the dose date and the reference point. Without it the check
 * falls back to the exact comparison — never more lenient than it can justify.
 *
 * @param {?number} ageAtDoseMonths  age in months at the dose (null = unknown)
 * @param {number}  minAgeMonths
 * @param {{doseDate?: ?string, ageMonths?: ?number, today?: ?string}} [when]
 */
export function ageMeetsMinimum(ageAtDoseMonths, minAgeMonths, when = {}) {
  if (ageAtDoseMonths == null) return false;
  if (ageAtDoseMonths >= minAgeMonths) return true;
  const { doseDate, ageMonths, today } = when;
  if (!doseDate || ageMonths == null || !today) return false;
  const asIfLater = ageMonths - calendarMonthsBetween(addDays(doseDate, GRACE_DAYS), today);
  return asIfLater >= minAgeMonths;
}
