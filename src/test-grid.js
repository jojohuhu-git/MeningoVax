// The shared patient grid — one module every sweep imports from, instead of
// each sweep typing its own list of risk ids and brands. Plan item B
// (`.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`): add a risk
// factor to `riskFactors.js` or a brand to `brands.js` and every sweep that
// imports from here widens on the next run, with no test edit.
//
// This replaces `sweep-dose-counter.test.js`'s old hand-typed 7-profile
// `RISK_COMBOS` list, which is exactly the kind of second copy the plan is
// about: it did not widen when a risk factor was added, and it hardcoded its
// own `TODAY` one day off the suite's pinned `TEST_TODAY`.
//
// B2 (grid realism — fractional ages, dates of birth instead of ageMonths,
// deliberately invalid doses) and C1 (widening from one profile per risk
// CLASS to one profile per risk ID — 12 singles + 66 pairs) are the next two
// items in the plan and are deliberately NOT done here.
import { RISK_FACTORS } from './data/riskFactors.js';
import {
  MENB_BRANDS, menacwyBrandLabelsForAge, MENACWY_MIN_AGE_MONTHS,
} from './data/brands.js';
import { addDays } from './logic/dateUtils.js';
import { TEST_TODAY } from './test-today.js';

// StepAge.jsx's own input range (`max="120"`, years) — read here, not retyped.
export const MAX_AGE_MONTHS = 120 * 12;

// Risk factors the engine can actually be asked about. `hct_cart_bcell_exclude`
// hard-stops the whole engine (recommend() returns `excluded: true` before it
// reads anything else) and carries no dose recommendations for a sweep to check.
export const SWEEPABLE_RISK_FACTORS = RISK_FACTORS.filter((r) => !r.exclude);

// One risk id per distinct (menacwyClass, menbClass) pairing — first catalog
// entry per pairing wins — plus the no-risk baseline. DERIVED, so a risk
// factor whose pairing doesn't exist yet widens this on its own.
//
// KNOWN LIMITATION, left for plan item C1 on purpose: recommend.js branches on
// several risk ids INDIVIDUALLY, beyond their class — travel, microbiologist,
// college_dorm, outbreak_acwy and pregnancy each carry their own age-band or
// infant-series logic despite sharing a class with another id (grep
// `riskIds.includes(` / `riskIds.some(` in recommend.js and validate.js).
// Collapsing by class means this grid, like the hand-typed list it replaces,
// exercises only whichever id happens to win its pairing — e.g. today
// 'military' wins the single/undefined pairing over 'college_dorm' and
// 'outbreak_acwy'. C1 sweeps every id individually (12 singles) and closes
// this gap. Until then, a clean result here means "no counting-logic
// regression", not "no id-specific regression" — do not read it as the latter.
export const SINGLE_RISK_PROFILES = (() => {
  const seenPairing = new Map();
  for (const r of SWEEPABLE_RISK_FACTORS) {
    const key = `${r.menacwyClass ?? 'none'}|${r.menbClass ?? 'none'}`;
    if (!seenPairing.has(key)) seenPairing.set(key, r.id);
  }
  return [[], ...[...seenPairing.values()].map((id) => [id])];
})();

// The brand each sweep dose is recorded under — the youngest-licensed ACTIVE
// product per vaccine, so the generous spacing profile below can place a dose
// at any swept age without also tripping a brand age floor.
export const MENACWY_SWEEP_BRAND = menacwyBrandLabelsForAge(MENACWY_MIN_AGE_MONTHS)[0];
export const MENACWY_SWEEP_BRAND_MIN_AGE = MENACWY_MIN_AGE_MONTHS;
export const MENB_SWEEP_BRAND = MENB_BRANDS[0].label;
export const MENB_SWEEP_BRAND_MIN_AGE = MENB_BRANDS[0].minAgeM;

// ── Dose generation: the GENEROUS profile ─────────────────────────────────
// Spacing wide enough to clear every interval rule in validate.js (the widest
// is MenB healthy dose 2's 6 months), so every generated dose validates as
// clinically VALID. This isolates counting/never-event logic from interval-
// validity logic. B2c (deferred, plan item B2) adds a TIGHT profile that
// deliberately violates intervals, for the properties that need it.
export const GENEROUS_STEP_MONTHS = 8;
const RECENT_OFFSET_MONTHS = 1;

// Only generate as many doses as fit above the brand's own minimum age — an
// infeasible combo (e.g. 5 doses 8mo apart for a 3-month-old) is capped down,
// not skipped, so every swept age still gets SOME dose-count coverage.
export function feasibleDoseCount(ageMonths, minAgeM, maxCount, stepMonths = GENEROUS_STEP_MONTHS) {
  if (ageMonths < minAgeM) return 0;
  return Math.max(0, Math.min(maxCount, Math.floor((ageMonths - minAgeM) / stepMonths) + 1));
}

export function makeGenerousDoses(ageMonths, count, brand, minAgeM, today = TEST_TODAY) {
  const k = feasibleDoseCount(ageMonths, minAgeM, count);
  const doses = [];
  for (let i = k - 1; i >= 0; i--) {
    const monthsBack = RECENT_OFFSET_MONTHS + i * GENEROUS_STEP_MONTHS;
    doses.push({ date: addDays(today, -Math.round(monthsBack * 30.4375)), brand });
  }
  return doses;
}
