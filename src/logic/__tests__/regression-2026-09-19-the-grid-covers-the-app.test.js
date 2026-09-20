// regression-2026-09-19-the-grid-covers-the-app.test.js — plan item E2
// (.claude/prompts/plan-2026-09-19-test-depth-and-drift.md, §E2).
//
// Every other sweep in this suite checks whether the APP behaves — this one
// checks whether the GRID (`test-grid.js`) still describes the app. Of the
// five kinds of drift the plan names (§E1), four already have a guard
// (fact-copy, doc, fixture, source-staleness). This is the fifth —
// "coverage": the app gains a capability (a risk factor, a brand, a status)
// and no sweep widens to reach it, so it stays green while genuinely
// untested. Add a 13th risk factor today, or a 10th brand, and nothing else
// in the suite would notice; this file exists so something does.
//
// Checked, not retyped: every list this file compares against is read from
// its own source (`riskFactors.js`, `brands.js`, `recommend.js`'s own status
// strings) — never hand-copied here, since a hand-copied list is exactly the
// kind of second copy the plan's "No Second Copies" rule (§E3) is about.
//
// One sweep, run once at module load (same shape as sweep-never-events.test.js):
// every SINGLE_RISK_PROFILES × SWEEP_DOBS row and every PAIR_RISK_PROFILES ×
// SWEEP_DOBS_COARSE row, dose count 0–5, generous spacing only — this guard
// is about which capabilities get REACHED at all, not about invalid-history
// behavior (B2c's TIGHT profile), so one pass is enough.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { recommend } from '../recommend.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { ALL_BRANDS } from '../../data/brands.js';
import { TEST_TODAY } from '../../test-today.js';
import { dobToAgeMonths } from '../format.js';
import {
  SWEEP_DOBS, SWEEP_DOBS_COARSE, SINGLE_RISK_PROFILES, PAIR_RISK_PROFILES,
  MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE,
  MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, makeGenerousDoses,
} from '../../test-grid.js';

const TODAY = TEST_TODAY;

// brands.js's own words: a discontinued/legacy product "remain[s] selectable
// when RECORDING a dose given in the past, but [is] never offered for a dose
// to be given now" — so no amount of sweeping AGES will ever reach it, only
// sweeping HISTORIES that record a dose under it, which the shared grid does
// not do (it only ever records a dose under the current preferred product,
// MENACWY_SWEEP_BRAND/MENB_SWEEP_BRAND). That is a real, known gap — a
// discontinued product's own history handling (interval math, display
// formatting) has no sweep coverage — not a bug in this guard. Named here,
// per the plan's own escape hatch ("add it to test-grid.js or say in a
// comment why it is excluded"), so a FUTURE discontinuation doesn't silently
// join this list unnoticed: any new entry here needs the same justification.
const BRAND_KEYS_NEVER_OFFERED_BY_DESIGN = ['Menactra', 'Menveo'];

// Pulled from recommend.js's own `rec()` calls, not retyped — the whole
// point of this check is to notice when a NEW status string appears in the
// source that no sweep row reaches, so a hand-typed "known statuses" list
// here would defeat it exactly the way sweep-never-events.test.js's property
// 4 list (necessarily hand-typed, since it also checks for UNKNOWN statuses)
// cannot: that list asks "is this status one of the ones we expect", this
// one asks "did every status recommend.js can produce actually get hit".
function statusesRecommendCanReturn() {
  const path = fileURLToPath(new URL('../recommend.js', import.meta.url));
  const src = readFileSync(path, 'utf8');
  const found = new Set();
  for (const m of src.matchAll(/status:\s*(?:o\.status\s*\?\?\s*)?'([a-z-]+)'/g)) {
    found.add(m[1]);
  }
  return found;
}

const riskIdsSeen = new Set();
const brandsOffered = new Set();
const statusesSeen = new Set();

function sweepRow(dob, riskIds, count) {
  for (const id of riskIds) riskIdsSeen.add(id);
  const am = dobToAgeMonths(dob, TODAY);
  const menacwyDoses = makeGenerousDoses(am, count, MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE, TODAY);
  const menbDoses = makeGenerousDoses(am, count, MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, TODAY);
  let result;
  try {
    result = recommend({
      today: TODAY, ageMonths: am, dob, riskIds, menacwyDoses, menbDoses,
    });
  } catch {
    return; // a throw is sweep-never-events' property 5's job, not this file's
  }
  if (result.excluded) return; // hard-stop combos carry no dose chips to check
  for (const r of [...result.menacwy, ...result.menb]) {
    statusesSeen.add(r.status);
    for (const label of r.brands || []) brandsOffered.add(label);
  }
  // Pentavalents are deliberately NOT in recommend.js's per-vaccine `brands`
  // lists (recommend.js's own comment: "surfaced only via the dedicated
  // pentavalent card") — reached only when both antigens are due at once.
  if (result.pentavalent?.eligible) {
    for (const label of result.pentavalent.brands || []) brandsOffered.add(label);
  }
}

const GRID_BATCHES = [
  [SWEEP_DOBS, SINGLE_RISK_PROFILES],
  [SWEEP_DOBS_COARSE, PAIR_RISK_PROFILES],
];

for (const [dobs, profiles] of GRID_BATCHES) {
  for (const dob of dobs) {
    for (const riskIds of profiles) {
      for (let count = 0; count <= 5; count++) {
        sweepRow(dob, riskIds, count);
      }
    }
  }
}

describe('E2 — the shared grid covers the app', () => {
  it('every riskFactors.js id appears in at least one grid profile', () => {
    const missing = RISK_FACTORS.map((r) => r.id).filter((id) => !riskIdsSeen.has(id));
    expect(
      missing,
      missing.length
        ? `riskFactors.js defines ${missing.join(', ')} but no SINGLE_RISK_PROFILES/`
          + 'PAIR_RISK_PROFILES entry in src/test-grid.js includes it — widen the '
          + 'grid (it derives from RISK_FACTORS, so check for a new hand-typed '
          + 'exception) or say here why it is excluded.'
        : '',
    ).toEqual([]);
  });

  it('every active, currently-offered brand key in brands.js is exercised by at least one grid patient', () => {
    const checkable = ALL_BRANDS.filter(
      (b) => b.active && !BRAND_KEYS_NEVER_OFFERED_BY_DESIGN.includes(b.key),
    );
    const missing = checkable.filter((b) => !brandsOffered.has(b.label)).map((b) => b.key);
    expect(
      missing,
      missing.length
        ? `brands.js defines these active brand keys but no grid patient was ever `
          + `offered them: ${missing.join(', ')}. Add coverage to src/test-grid.js `
          + 'or, if the product is never offered by design, add it to '
          + 'BRAND_KEYS_NEVER_OFFERED_BY_DESIGN above with the same kind of '
          + 'justification the existing two entries carry.'
        : '',
    ).toEqual([]);
  });

  it('every status recommend.js can return is reached by at least one grid patient', () => {
    const expected = statusesRecommendCanReturn();
    const missing = [...expected].filter((s) => !statusesSeen.has(s));
    expect(
      missing,
      missing.length
        ? `recommend.js can return status "${missing.join('", "')}" but no grid `
          + 'patient ever reached it — widen src/test-grid.js (a dose count, an '
          + 'age, or a risk combination the grid never generates) so this status '
          + 'gets checked by the never-events and dose-counter sweeps too.'
        : '',
    ).toEqual([]);
  });
});
