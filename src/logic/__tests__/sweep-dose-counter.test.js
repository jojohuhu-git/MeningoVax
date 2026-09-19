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
//
// Plan item B (2026-09-19): the risk-profile list and dose-generation helpers
// now come from `test-grid.js` instead of being typed here. This file used to
// hardcode `TODAY = '2026-09-14'`, one day off the suite's pinned
// `TEST_TODAY = '2026-09-15'` (`test-today.js`) — the exact "two dates, one
// suite" drift the plan calls out. It also hand-typed 7 risk combinations
// that did not widen when a risk factor was added; the grid's derived list
// widens on its own (see `test-grid.js` for what it still does not cover).
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';
import { TEST_TODAY } from '../../test-today.js';
import {
  SINGLE_RISK_PROFILES, MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE,
  MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, makeGenerousDoses,
} from '../../test-grid.js';

const TODAY = TEST_TODAY;

// The chip label comes from the component's own module. This block used to be
// a second copy of it, under a comment promising it mirrored RecCard.jsx
// "exactly". It did not: measured over this very grid on 2026-09-17 the two
// disagreed on 20,167 of 95,928 rows -- the component renders a plain
// "Booster", the copy rendered "Booster (dose 3)". The test asserting that no
// chip implies N > M was itself the thing printing N.
const chipLabel = (result, seriesTotal) => doseChipLabel(result, seriesTotal);

describe('F4 sweep — no chip ever shows N > M, across every age × risk × dose-count', () => {
  const failures = [];

  for (let am = 0; am <= 120 * 12; am += 3) { // every 3 months, 0-120 years
    for (const riskIds of SINGLE_RISK_PROFILES) {
      for (let count = 0; count <= 5; count++) {
        const menacwyDoses = makeGenerousDoses(am, count, MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE, TODAY);
        const menbDoses = makeGenerousDoses(am, count, MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, TODAY);

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
