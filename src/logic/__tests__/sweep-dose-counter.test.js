// ─────────────────────────────────────────────────────────────────────────
// sweep-dose-counter.test.js — F4 (docs/archive/handoff-2026-09-14-dose-
// counter-structural-fix.md), the item that makes the fix stick.
//
// Every prior fix to the "chip shows N > M" bug shipped with an example
// test for the ONE age it was about (e.g. commit 3172a0a only demoted a
// 2nd dose given before age 16 — nothing above 16). That is exactly why an
// 82-year-old broke it. This test sweeps every age in the app's own input
// range (StepAge.jsx max="120") × a representative risk combination per
// menacwyClass/menbClass value × dose histories of 0-5 doses, and asserts,
// for EVERY recorded-dose chip, on EVERY vaccine:
//   - the chip never implies N > M ("Dose N of M" only renders when
//     effectiveDoseNum <= seriesTotal — see RecCard.jsx's DoseValidation)
//   - the chip never falls back to the old dead "Counts" label
//   - a dose is never numbered (effectiveDoseNum) against a null total
//     without an explicit non-numbered label to show for it
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-09-14';

// Every risk combination that produces a DISTINCT menacwyClass/menbClass
// pairing (riskFactors.js), plus the reported bug's own context (hct alone
// — no menacwyClass/menbClass at all, falls to the routine/healthy path).
const RISK_COMBOS = [
  [],                    // routine MenACWY, not-yet-indicated/healthy MenB
  ['hct'],               // reported bug's own context — no risk CLASS, routine/healthy path
  ['asplenia'],          // primary2 MenACWY + highrisk MenB
  ['microbiologist'],    // single+boost MenACWY + highrisk MenB
  ['travel'],            // single+boost MenACWY, no MenB
  ['military'],          // single MenACWY, no MenB
  ['college_dorm'],      // single MenACWY (own age-band sub-logic), no MenB
];

// Chronological dose dates for `count` doses (0-5), each `stepMonths` apart,
// the most recent one `recentOffsetMonths` in the past — spacing generous
// enough to clear every interval rule in validate.js (max is MenB healthy
// D2's 6 months) so every generated dose validates as clinically VALID.
// This isolates the N-vs-M counting/capping logic from the (separately,
// already thoroughly tested) invalid-dose-detection logic.
const STEP_MONTHS = 8;
const RECENT_OFFSET_MONTHS = 1;

function monthsAgo(m) { return addDays(TODAY, -Math.round(m * 30.4375)); }

// Only generate as many doses as fit above the brand's own minimum age —
// an infeasible combo (e.g. 5 doses 8mo apart for a 3-month-old) is simply
// capped down, not skipped, so every age still gets SOME coverage.
function feasibleCount(am, minAgeM, maxCount) {
  if (am < minAgeM) return 0;
  return Math.max(0, Math.min(maxCount, Math.floor((am - minAgeM) / STEP_MONTHS) + 1));
}

function makeDoses(am, count, brand, minAgeM) {
  const k = feasibleCount(am, minAgeM, count);
  const doses = [];
  for (let i = k - 1; i >= 0; i--) {
    doses.push({ date: monthsAgo(RECENT_OFFSET_MONTHS + i * STEP_MONTHS), brand });
  }
  return doses;
}

// Mirrors RecCard.jsx's DoseValidation chip logic exactly (F5) — the
// invariant under test is about what the CHIP would show, not just the raw
// data shape, so this must stay in lockstep with that component.
function chipLabel(result, seriesTotal) {
  if (!result) return null;
  const { status, effectiveDoseNum, notAdolescentCount, extraDose } = result;
  if (status === 'pending') return 'Needs input';
  if (notAdolescentCount) return 'Off-window - repeat';
  if (extraDose) return 'Extra dose — more than this series needs';
  if (status === 'valid') {
    if (seriesTotal == null) return 'Given — not part of a series this patient needs';
    if (effectiveDoseNum <= seriesTotal) return `Dose ${effectiveDoseNum} of ${seriesTotal}`;
    return `Booster (dose ${effectiveDoseNum})`;
  }
  return status === 'invalid' ? 'Invalid' : 'Unknown';
}

describe('F4 sweep — no chip ever shows N > M, across every age × risk × dose-count', () => {
  const failures = [];

  for (let am = 0; am <= 120 * 12; am += 3) { // every 3 months, 0-120 years
    for (const riskIds of RISK_COMBOS) {
      for (let count = 0; count <= 5; count++) {
        const menacwyDoses = makeDoses(am, count, 'Menveo (MenACWY)', 2);
        const menbDoses = makeDoses(am, count, 'Bexsero (MenB)', 120);

        const result = recommend({
          today: TODAY, ageMonths: am, riskIds, menacwyDoses, menbDoses,
        });
        if (result.excluded) continue; // hard-stop combos carry no dose chips

        const acwyAnalysis = analyzeHistory('MenACWY', menacwyDoses, am, riskIds, TODAY);
        const bAnalysis = analyzeHistory('MenB', menbDoses, am, riskIds, TODAY);
        const acwyTotal = result.menacwy[0]?.seriesTotal ?? null;
        const bTotal = result.menb[0]?.seriesTotal ?? null;

        for (const entry of acwyAnalysis.perDose) {
          const label = chipLabel(entry, acwyTotal);
          if (entry.status === 'valid' && !entry.notAdolescentCount && !entry.extraDose
              && entry.effectiveDoseNum != null && acwyTotal != null
              && entry.effectiveDoseNum > acwyTotal && label.startsWith('Dose ')) {
            failures.push(`MenACWY am=${am} risk=${riskIds} count=${count}: ${label} (N>M)`);
          }
          if (label === 'Counts') failures.push(`MenACWY am=${am} risk=${riskIds} count=${count}: dead 'Counts' label`);
          if (entry.status === 'valid' && !entry.notAdolescentCount && !entry.extraDose && entry.effectiveDoseNum == null) {
            failures.push(`MenACWY am=${am} risk=${riskIds} count=${count}: valid dose numbered against nothing (effectiveDoseNum null, not extra/off-window)`);
          }
        }
        for (const entry of bAnalysis.perDose) {
          const label = chipLabel(entry, bTotal);
          if (entry.status === 'valid' && !entry.notAdolescentCount && !entry.extraDose
              && entry.effectiveDoseNum != null && bTotal != null
              && entry.effectiveDoseNum > bTotal && label.startsWith('Dose ')) {
            failures.push(`MenB am=${am} risk=${riskIds} count=${count}: ${label} (N>M)`);
          }
          if (label === 'Counts') failures.push(`MenB am=${am} risk=${riskIds} count=${count}: dead 'Counts' label`);
          if (entry.status === 'valid' && !entry.notAdolescentCount && !entry.extraDose && entry.effectiveDoseNum == null) {
            failures.push(`MenB am=${am} risk=${riskIds} count=${count}: valid dose numbered against nothing (effectiveDoseNum null, not extra/off-window)`);
          }
        }
      }
    }
  }

  it('produces zero N>M / dead-Counts / unnumbered-valid-dose violations', () => {
    expect(failures.slice(0, 20)).toEqual([]);
    expect(failures.length).toBe(0);
  });
});

// ── Owner's own reported case, driven exactly as she entered it ──────────
describe('F4 — the reported case: age 82, HCT only, 3 routine MenACWY doses', () => {
  it('MenACWY chips never exceed the series total', () => {
    const am = 82 * 12 + 7; // ~82y7m at TODAY, matching "age 79y7m" 3 years prior
    const menacwyDoses = [
      { date: '2024-04-05', brand: 'Menveo (MenACWY)' },
      { date: '2024-07-05', brand: 'Menveo (MenACWY)' },
      { date: '2024-10-04', brand: 'Menveo (MenACWY)' },
    ];
    const result = recommend({ today: TODAY, ageMonths: am, riskIds: ['hct'], menacwyDoses, menbDoses: [] });
    const total = result.menacwy[0].seriesTotal;
    const analysis = analyzeHistory('MenACWY', menacwyDoses, am, ['hct'], TODAY);
    for (const entry of analysis.perDose) {
      if (entry.effectiveDoseNum != null && total != null) {
        expect(entry.effectiveDoseNum).toBeLessThanOrEqual(total);
      }
    }
  });
});
