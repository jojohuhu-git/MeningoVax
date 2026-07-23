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

import { daysBetween, calendarMonthsBetween, todayISO, DAYS } from './dateUtils.js';
import { hasMenbRisk, menacwyRiskClass } from '../data/riskFactors.js';
import { menbFamily, ALL_BRANDS } from '../data/brands.js';

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

// Most permissive MenACWY min age (Menveo, 2 months). Used when brand is
// unknown so we don't false-flag on a dose whose brand we can't identify.
const MIN_AGE_MENACWY_PERMISSIVE_MONTHS = 2;

// Most permissive MenB min age (Bexsero/Trumenba, 120 months). Used when brand
// is unknown for MenB — all products require ≥10 years, so even permissive is 120.
const MIN_AGE_MENB_PERMISSIVE_MONTHS = 120;

// P0-1: the healthy MenB 2-dose series is recommended at 16–23y. For a patient with
// NO current MenB risk factor, a MenB dose given before 16 is validly administered
// (≥ the 120-month product floor) but does NOT count toward the healthy series —
// MenB antibody wanes within ~1 year, so an early dose is not protective at 16.
// Mirrors MenACWY's pre-age-10 exclusion. Owner decision 2026-07-23 (Option 1).
const MENB_HEALTHY_MIN_AGE_MONTHS = 192;

// ── Interval constants — reuse the recommend.js patterns ─────────────────
// MenACWY: baseline minimum between ANY two doses regardless of risk class
// (duplicate-dose detection, Task 3). The high-risk rule (8wk) is stricter
// and wins when it applies. NOTE: this baseline only catches interval
// violations; routine 11-12y vs 16y *position* logic stays in the engine.
const MENACWY_BASELINE_MIN_INTERVAL    = DAYS.weeks(4);    // 28 d — minimum between any 2 doses
// MenACWY high-risk 2-dose primary (≥2y): ≥8 weeks
const MENACWY_HR_ADULT_MIN_INTERVAL    = DAYS.weeks(8);    // 56 d
// MenACWY infant high-risk series: ≥4 weeks between primary doses
const MENACWY_HR_INFANT_MIN_INTERVAL   = DAYS.weeks(4);    // 28 d
// MenACWY high-risk boosters: every 5 years (or 3 years if last dose given <7y)
const MENACWY_BOOSTER_5Y               = DAYS.years(5);    // 1826 d
const MENACWY_BOOSTER_3Y               = DAYS.years(3);    // 1096 d
// MenB high-risk: D2 ≥4 weeks after D1
const MENB_HR_D2_MIN_INTERVAL          = DAYS.weeks(4);    // 28 d
// MenB high-risk: D3 ≥6 months after D1 AND ≥4 months after D2
const MENB_HR_D3_MIN_FROM_D1           = DAYS.months(6);   // ~183 d
const MENB_HR_D3_MIN_FROM_D2           = DAYS.months(4);   // ~122 d
// MenB high-risk booster: first booster ≥1 year after D3; subsequent ≥2 years
const MENB_HR_FIRST_BOOSTER_MIN        = DAYS.years(1);    // 365 d
const MENB_HR_SUBSEQUENT_BOOSTER_MIN   = DAYS.years(2);    // 730 d
// MenB healthy 2-dose: D2 ≥6 months after D1 (early D2 triggers rescue)
const MENB_HEALTHY_D2_MIN_INTERVAL     = DAYS.months(6);   // ~183 d
// MenB healthy early-D2 rescue: D3 ≥4 months after early D2
const MENB_RESCUE_D3_MIN_FROM_D2       = DAYS.months(4);   // ~122 d

// Age band for infant-booster cadence check (7 years in months)
const AGE_7Y_MONTHS = 84;

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

// Format an age in months using clinical units (weeks for young infants,
// months for <24 months, years [+months] for ≥24 months). Never "72 months."
// Mirrors fmtAgeClinical in vaxapp's ageFormat.js.
function fmtAgeMClinical(m) {
  if (m == null) return '?';
  if (m < 0.5) return 'birth';
  // ≤2 months (roughly ≤8 weeks): express in weeks for young infants
  if (m <= 2) {
    const wks = Math.round(m * 4.348);
    return `${wks} week${wks === 1 ? '' : 's'}`;
  }
  if (m < 24) {
    const mo = Math.round(m);
    return `${mo} month${mo === 1 ? '' : 's'}`;
  }
  const years = Math.floor(m / 12);
  const remMonths = Math.round(m % 12);
  if (remMonths === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${remMonths} month${remMonths === 1 ? '' : 's'}`;
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

// Build an 'invalid' result.
function invalidResult(reasons, detail) {
  const r = { status: 'invalid', reasons };
  if (detail != null) r.detail = detail;
  return r;
}

// ── Core per-dose validators (operate on EFFECTIVE kept list) ─────────────
//
// IMPORTANT: `effectiveIdx` is the position in the kept list (0-based), and
// `kept` is the array of doses kept so far (NOT the full raw list). This is
// what enables correct re-evaluation when an earlier dose is dropped.

function validateOneMenACWY(dose, effectiveIdx, kept, ageMonths, riskIds, today, riskAnswer) {
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
    if (knownBrandMin !== null && ageMonths < knownBrandMin) {
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

  if (ageAtDose !== null && ageAtDose < minAgeM) {
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
  const AGE_10Y_MONTHS = 120;
  const isHighRiskNow = menacwyRiskClass(riskIds) === 'primary2';
  if (!isHighRiskNow && ageAtDose !== null && ageAtDose < AGE_10Y_MONTHS) {
    return {
      status: 'valid',
      reasons: [`Given before age 10 (~${fmtAgeMClinical(ageAtDose)}): does not count toward the adolescent MenACWY series.`],
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
  if (isHighRiskNow && ageAtDose !== null && ageAtDose < AGE_10Y_MONTHS) {
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
        reasons: [`Given at ~${fmtAgeMClinical(ageAtDose)}, before age 10. Marked as ${riskAnswer === 'unsure' ? 'unsure whether the patient was' : 'not'} high-risk on that date — treated conservatively as not counting toward the adolescent/high-risk series.`],
        notAdolescentCount: true,
      };
    }
    // riskAnswer === 'yes' → falls through to the high-risk interval checks
    // below as an effective primary-series dose.
    answeredYesNote = `Counted toward the high-risk series: confirmed the patient was already high-risk on ~${fmtAgeMClinical(ageAtDose)} (this dose's date), in response to the risk-timing question.`;
  }

  // ── Interval checks ───────────────────────────────────────────────────
  // M4: Use menacwyRiskClass() from riskFactors.js instead of hardcoding the risk IDs.
  // This keeps the validator in sync with the engine's riskClass computation.
  // primary2 class = strict interval checks apply.
  const riskClass = isHighRiskNow;
  const isInfant = ageAtDose !== null && ageAtDose < 24;

  if (effectiveIdx > 0) {
    // Find the last dated kept dose (walk backwards through kept)
    const prevKeptDated = [...kept].reverse().find(d => d.date);

    if (prevKeptDated) {
      const interval = daysBetween(prevKeptDated.date, dose.date);

      // ── Primary-series interval: high-risk 2-dose primary ────────────
      // Applies to effectiveIdx 1 (D2 in the primary series — positions 0 and 1).
      // For effectiveIdx ≥ 2, the dose is a booster — handled below.
      if (riskClass && effectiveIdx === 1) {
        const minInterval = isInfant ? MENACWY_HR_INFANT_MIN_INTERVAL : MENACWY_HR_ADULT_MIN_INTERVAL;
        const minLabel = isInfant ? '4 weeks (infant high-risk series)' : '8 weeks (high-risk primary series)';
        if (interval < minInterval) {
          return invalidResult(
            [`Given only ${fmtDays(interval)} after the previous dose. Minimum interval is ${minLabel}.`],
            `Actual interval: ${interval} days. Minimum: ${minInterval} days.`
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
      if (riskClass && effectiveIdx >= 2) {
        const isFirstBooster = effectiveIdx === 2;
        let cadenceDays;
        let cadenceLabel;
        if (isFirstBooster) {
          // First booster cadence keys off the patient's age at dose 2 (the 2nd kept dated dose).
          const dose2 = kept.filter(d => d.date)[1] || null;
          const dose2AgeAtDose = ageAtDoseFromDate(dose2, ageMonths, today);
          // Conservative: unknown age treated same as <7y → 3 years.
          cadenceDays = (dose2AgeAtDose == null || dose2AgeAtDose < AGE_7Y_MONTHS)
            ? MENACWY_BOOSTER_3Y
            : MENACWY_BOOSTER_5Y;
          cadenceLabel = cadenceDays === MENACWY_BOOSTER_3Y ? '3 years' : '5 years';
        } else {
          // Subsequent boosters: always 5 years
          cadenceDays = MENACWY_BOOSTER_5Y;
          cadenceLabel = '5 years';
        }

        if (interval < cadenceDays) {
          return invalidResult(
            [`Booster given only ${fmtDays(interval)} after the previous dose. High-risk MenACWY boosters must be spaced ≥${cadenceLabel} (${cadenceDays} days). This dose is too soon and does not count.`],
            `Actual interval: ${interval} days. Required cadence: ${cadenceDays} days (${cadenceLabel}).`
          );
        }
      }

      // ── Baseline minimum interval: ≥4 weeks between ANY two MenACWY doses (Task 3) ─
      // Catches duplicate doses (e.g. two doses days apart for a healthy teen).
      // The high-risk primary-series rule above already handles the D2 case with a
      // stricter threshold (8wk or 4wk infant); this baseline applies to all other pairs.
      // NOTE: position-based logic (routine 11-12y vs 16y booster) stays in the engine.
      if (interval < MENACWY_BASELINE_MIN_INTERVAL) {
        return invalidResult(
          [`Given only ${fmtDays(interval)} after the previous dose. Minimum interval between any two MenACWY doses is 4 weeks (28 days).`],
          `Actual interval: ${interval} days. Minimum: ${MENACWY_BASELINE_MIN_INTERVAL} days.`
        );
      }
    }
  }

  return validResult(answeredYesNote ? [answeredYesNote] : []);
}

function validateOneMenB(dose, effectiveIdx, kept, ageMonths, riskIds, today, riskAnswer) {
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
    if (ageMonths < minAgeM) {
      const brandLabel = brand
        ? brand.replace(/\s*\(Men(?:B|ACWY|ABCWY)\).*/, '')
        : 'MenB';
      return invalidResult(
        [`Recorded without a date, but the patient is currently only ~${fmtAgeMClinical(ageMonths)}, below the minimum age of ${fmtMinAge(minAgeM)} for ${brandLabel}. A past dose cannot have been given later than today, so it could not have been given at a valid age. MenB vaccines are licensed from age 10 years. This dose does not count.`],
        `Current age (upper bound on age at administration): ~${fmtAgeMClinical(ageMonths)}. Minimum: ${fmtMinAge(minAgeM)}.`
      );
    }
    // P0-1: if the patient has no current MenB risk factor and is CURRENTLY under 16,
    // then any past (undated) dose was necessarily given before age 16 — a dose can't
    // have been given later than today. So it does not count toward the healthy series.
    // (If the patient is currently ≥16 we can't tell when an undated dose was given, so
    // it falls through to the "counted / unknown" case below.)
    if (!hasMenbRisk(riskIds) && ageMonths < MENB_HEALTHY_MIN_AGE_MONTHS) {
      return {
        status: 'valid',
        reasons: [`Recorded without a date, but the patient is currently only ~${fmtAgeMClinical(ageMonths)} — so this dose was given before age 16. It does not count toward the healthy 2-dose MenB series (recommended at 16–23 years); MenB given before 16 is not counted for a patient without a high-risk indication.`],
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

  if (ageAtDose !== null && ageAtDose < minAgeM) {
    return invalidResult(
      [`Given at ~${fmtAgeMClinical(ageAtDose)}, below the minimum age of ${fmtMinAge(minAgeM)} for ${brandLabel}. MenB vaccines (Bexsero, Trumenba, Penbraya, Penmenvy) are licensed from age 10 years for all products.`],
      `Age at administration: ~${fmtAgeMClinical(ageAtDose)}. Minimum: ${fmtMinAge(minAgeM)}.`
    );
  }

  // ── P0-1: healthy MenB doses before age 16 don't count toward the healthy series ─
  // For a patient with NO current MenB risk factor, the healthy 2-dose series is
  // recommended at 16–23y. A dose given before 16 was validly administered (above the
  // 10-year product floor) but does NOT advance the healthy series — this is the direct
  // analog of MenACWY's pre-age-10 `notAdolescentCount` rule. High-risk patients
  // (hasMenbRisk) legitimately start at age 10 and must keep counting their doses.
  // Owner decision 2026-07-23 (Option 1). Source: ACIP 2020 MMWR RR-9.
  if (!hasMenbRisk(riskIds) && ageAtDose !== null && ageAtDose < MENB_HEALTHY_MIN_AGE_MONTHS) {
    return {
      status: 'valid',
      reasons: [`Given before age 16 (~${fmtAgeMClinical(ageAtDose)}): does not count toward the healthy 2-dose MenB series, which is recommended at 16–23 years. MenB antibody protection wanes within about a year, so a dose given before 16 is not counted for a patient without a high-risk indication.`],
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
  if (hasMenbRisk(riskIds) && ageAtDose !== null && ageAtDose < MENB_HEALTHY_MIN_AGE_MONTHS) {
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
        reasons: [`Given at ~${fmtAgeMClinical(ageAtDose)}, before age 16. Marked as ${riskAnswer === 'unsure' ? 'unsure whether the patient was' : 'not'} high-risk on that date — treated conservatively as not counting toward the high-risk series.`],
        notAdolescentCount: true,
      };
    }
    // riskAnswer === 'yes' → falls through to the family-lock and high-risk
    // interval checks below as an effective high-risk-series dose.
    answeredYesNote = `Counted toward the high-risk MenB series: confirmed the patient was already high-risk on ~${fmtAgeMClinical(ageAtDose)} (this dose's date), in response to the risk-timing question.`;
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
      if (interval < MENB_HR_D2_MIN_INTERVAL) {
        return invalidResult(
          [`Given only ${fmtDays(interval)} after dose 1. High-risk schedule requires ≥4 weeks (28 days) between D1 and D2.`],
          `Actual interval: ${interval} days. Minimum: ${MENB_HR_D2_MIN_INTERVAL} days.`
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

      if (d1Date) {
        const fromD1 = daysBetween(d1Date, dose.date);
        if (fromD1 < MENB_HR_D3_MIN_FROM_D1) {
          reasons.push(`Given only ${fmtDays(fromD1)} after dose 1. High-risk D3 requires ≥6 months (~${MENB_HR_D3_MIN_FROM_D1} days) from D1.`);
          detail += `D1→D3: ${fromD1} days (min ${MENB_HR_D3_MIN_FROM_D1}). `;
        }
      }
      if (d2Date) {
        const fromD2 = daysBetween(d2Date, dose.date);
        if (fromD2 < MENB_HR_D3_MIN_FROM_D2) {
          reasons.push(`Given only ${fmtDays(fromD2)} after dose 2. High-risk D3 requires ≥4 months (~${MENB_HR_D3_MIN_FROM_D2} days) from D2.`);
          detail += `D2→D3: ${fromD2} days (min ${MENB_HR_D3_MIN_FROM_D2}).`;
        }
      }

      if (reasons.length > 0) {
        return invalidResult(reasons, detail.trim());
      }
    }

    // ── MenB high-risk booster cadence (Task 2): effectiveIdx ≥ 3 ────────
    // First booster: ≥1 year after D3 (effectiveIdx === 3).
    // Subsequent boosters: every ≥2 years (effectiveIdx > 3).
    // Only flag too-soon; late boosters are acceptable catch-up.
    if (effectiveIdx >= 3) {
      const prevKeptDated = [...kept].reverse().find(d => d.date);
      if (prevKeptDated) {
        const interval = daysBetween(prevKeptDated.date, dose.date);
        const isFirstBooster = effectiveIdx === 3;
        const minInterval = isFirstBooster
          ? MENB_HR_FIRST_BOOSTER_MIN
          : MENB_HR_SUBSEQUENT_BOOSTER_MIN;
        const minLabel = isFirstBooster
          ? '1 year after completing the primary series'
          : '2 years (every 2–3 years for high-risk boosters)';

        if (interval < minInterval) {
          return invalidResult(
            [`MenB booster given only ${fmtDays(interval)} after the previous dose. Minimum is ${minLabel}. This dose does not count.`],
            `Actual interval: ${interval} days. Minimum: ${minInterval} days.`
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
      if (interval < MENB_HEALTHY_D2_MIN_INTERVAL) {
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
      const d1ToD2 = daysBetween(d1Date, d2Date);
      if (d1ToD2 < MENB_HEALTHY_D2_MIN_INTERVAL) {
        // This is the rescue dose — check the D2→D3 interval.
        const fromD2 = daysBetween(d2Date, dose.date);
        if (fromD2 < MENB_RESCUE_D3_MIN_FROM_D2) {
          return invalidResult(
            [`Rescue dose given only ${fmtDays(fromD2)} after dose 2. Must be ≥4 months (~${MENB_RESCUE_D3_MIN_FROM_D2} days) after the early dose 2.`],
            `D2→D3: ${fromD2} days (min ${MENB_RESCUE_D3_MIN_FROM_D2}).`
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
    const riskAnswer = riskAtDoseAnswers?.[rawIdx];

    // Validate this dose against the current kept list.
    let result;
    if (vaccine === 'MenACWY') {
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
        reasons: [
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
      // Valid or unknown → keep.
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
 * @param {Object.<number, 'yes'|'no'|'unsure'>} [riskAtDoseAnswers] — provider
 *   answers to the risk-at-dose prompt, keyed by the dose's index in the
 *   chronologically-sorted (post-sort) list — the same index used by
 *   `sortedDoses`/`perDose`.
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
  return { ...runWalk(vaccine, filtered, ageMonths, riskIds, ref, riskAtDoseAnswers), sortedDoses: filtered };
}

// Chronological, stable sort. ISO date strings compare lexicographically. Undated doses
// sort before all dated doses, preserving their relative input order.
function sortDosesChronologically(doses) {
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
