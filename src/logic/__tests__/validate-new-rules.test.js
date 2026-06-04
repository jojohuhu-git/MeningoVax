// ─────────────────────────────────────────────────────────────────────────
// validate-new-rules.test.js
//
// Tests for Tasks 1–6 of the 2026-06-04 validation extension:
//   Task 1: min-age from brands.js (Penbraya/Penmenvy → 10y not 2mo)
//   Task 2: booster cadence (too-soon MenACWY and MenB boosters → invalid)
//   Task 3: baseline ≥4wk interval between any two MenACWY doses
//   Task 4: MenB family lock anchors on first KEPT dose with known brand
//   Task 5: dueToday false for future earliestNextDate (engine test)
//   Task 6: fmtAgeMonths clinical units (72 → "6 years", not "72 months")
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { validateHistory, analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { fmtAgeMonths } from '../format.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-06-03';

// ── date helpers ──────────────────────────────────────────────────────────
function monthsAgo(m) { return addDays(TODAY, -Math.round(m * 30.4375)); }
function weeksAgo(w)  { return addDays(TODAY, -(w * 7)); }
function daysAgo(d)   { return addDays(TODAY, -d); }
function yearsAgo(y)  { return addDays(TODAY, -Math.round(y * 365.25)); }

function validate(vaccine, doses, ageMonths, riskIds = []) {
  return validateHistory(vaccine, doses, ageMonths, riskIds, TODAY);
}

function analyze(vaccine, doses, ageMonths, riskIds = []) {
  return analyzeHistory(vaccine, doses, ageMonths, riskIds, TODAY);
}

function run(input) {
  return recommend({ today: TODAY, ...input });
}

// ── Task 1: min-age from brands.js ────────────────────────────────────────

describe('Task 1 — Penbraya at 6 months → invalid, references 10 years / 120 months', () => {
  it('6-month-old with Penbraya (MenABCWY) → invalid, message says 10 years', () => {
    // Patient is now 20y (240 mo). Penbraya given 234 months ago → ageAtDose = 6 months.
    const results = validate('MenB', [{ date: monthsAgo(234), brand: 'Penbraya (MenABCWY)' }], 240);
    expect(results[0].status).toBe('invalid');
    // Must reference "10 years" (not "2 months" — the old hardcoded MenACWY fallback)
    expect(results[0].reasons[0]).toMatch(/10 years/i);
    expect(results[0].reasons[0]).toMatch(/120 months/i);
    // Must reference the brand name
    expect(results[0].reasons[0]).toMatch(/Penbraya/i);
  });

  it('6-month-old with Penmenvy (MenABCWY) → invalid, message says 10 years / 120 months', () => {
    const results = validate('MenB', [{ date: monthsAgo(234), brand: 'Penmenvy (MenABCWY)' }], 240);
    expect(results[0].status).toBe('invalid');
    expect(results[0].reasons[0]).toMatch(/10 years/i);
    expect(results[0].reasons[0]).toMatch(/120 months/i);
  });

  it('Penbraya at age 10y 2mo → valid (above 120-month minimum)', () => {
    // Patient is now 30y (360 mo). Penbraya given 238 months ago → ageAtDose ≈ 122 months.
    const results = validate('MenB', [{ date: monthsAgo(238), brand: 'Penbraya (MenABCWY)' }], 360);
    expect(results[0].status).toBe('valid');
  });

  it('MenACWY: Penbraya recorded in MenB history at 6mo → invalid with 10y message (NOT 2-month MenACWY fallback)', () => {
    // Safeguard: a pentavalent brand with MenABCWY suffix in MenB history must use
    // ALL_BRANDS lookup (minAgeM=120), not the old 2-month MenACWY fallback.
    const results = validate('MenB', [{ date: monthsAgo(234), brand: 'Penbraya (MenABCWY)' }], 240);
    expect(results[0].status).toBe('invalid');
    // Critically: must NOT say "2 months" as the minimum
    expect(results[0].reasons[0]).not.toMatch(/2 months/i);
    expect(results[0].reasons[0]).toMatch(/10 years/i);
  });

  it('Unknown MenB brand at 6 months → still invalid (permissive fallback is 120 months for MenB)', () => {
    // Even without a brand, all MenB products require ≥10y. The permissive fallback
    // for MenB is 120 months, not 2 months.
    const results = validate('MenB', [{ date: monthsAgo(234) }], 240);
    expect(results[0].status).toBe('invalid');
    expect(results[0].reasons[0]).toMatch(/10 years/i);
  });

  it('Unknown MenACWY brand at 6 months → valid (permissive fallback is 2 months, which 6mo satisfies)', () => {
    const results = validate('MenACWY', [{ date: monthsAgo(234), brand: '' }], 240);
    expect(results[0].status).toBe('valid');
  });
});

// ── Task 2: MenACWY high-risk booster cadence ────────────────────────────

describe('Task 2a — MenACWY high-risk booster given too soon → invalid', () => {
  it('High-risk adult: booster given 2 years after D2 (cadence is 5y) → invalid', () => {
    // D1 and D2 given ~10 and ~8 months ago (primary series). D3 (first booster)
    // given 2 years after D2 — needs 5 years (neither dose was given before age 7).
    const d1 = yearsAgo(10);  // 10 years ago
    const d2 = yearsAgo(8);   // 8 years ago (D2, ≥8 weeks after D1)
    const d3 = yearsAgo(6);   // 6 years ago — only 2y after D2, needs 5y for 5-year cadence
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
      { date: d3, brand: 'Menveo (MenACWY)' },
    ], 360, ['asplenia']);

    expect(results[0].status).toBe('valid');   // D1 valid
    expect(results[1].status).toBe('valid');   // D2 valid (≥8 weeks after D1)
    expect(results[2].status).toBe('invalid'); // D3 too soon (only 2y, needs 5y)
    expect(results[2].reasons[0]).toMatch(/5 years/i);
    expect(results[2].reasons[0]).toMatch(/too soon/i);
  });

  it('High-risk adult: booster given 6 years after D2 → valid', () => {
    const d1 = yearsAgo(12);
    const d2 = yearsAgo(10);
    const d3 = yearsAgo(4); // 6 years after D2 (≥5 years) → valid
    const results = validate('MenACWY', [
      { date: d1 },
      { date: d2 },
      { date: d3 },
    ], 360, ['asplenia']);
    expect(results[2].status).toBe('valid');
  });

  it('High-risk child (doses given before age 7): 3-year cadence — booster at 2 years → invalid', () => {
    // Patient is now 10y (120 mo). D1 at age 2 (monthsAgo(96)), D2 at age 3 (monthsAgo(84)).
    // The last kept dose was given at ~age 3 (< 7y) → cadence is 3 years.
    // D3 (booster) only 2 years after D2 → invalid.
    const d1 = monthsAgo(96); // ageAtDose ≈ 2y
    const d2 = monthsAgo(84); // ageAtDose ≈ 3y (≥8wk after D1)
    const d3 = monthsAgo(60); // 2y after D2 → below 3-year cadence
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
      { date: d3, brand: 'Menveo (MenACWY)' },
    ], 120, ['asplenia']);
    expect(results[2].status).toBe('invalid');
    expect(results[2].reasons[0]).toMatch(/3 years/i);
  });
});

// ── Task 2: MenB high-risk booster cadence ───────────────────────────────

describe('Task 2b — MenB high-risk booster given too soon → invalid', () => {
  it('First MenB booster given 3 months after primary D3 (needs ≥1 year) → invalid', () => {
    const d1 = monthsAgo(15);
    const d2 = monthsAgo(13); // ≥4wk after D1
    const d3 = monthsAgo(9);  // ≥6mo after D1 and ≥4mo after D2 → valid D3
    const d4 = monthsAgo(6);  // only 3 months after D3 — first booster needs ≥1 year
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
      { date: d3, brand: 'Bexsero (MenB)' },
      { date: d4, brand: 'Bexsero (MenB)' },
    ], 360, ['asplenia']);

    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('valid');
    expect(results[2].status).toBe('valid');
    expect(results[3].status).toBe('invalid');
    expect(results[3].reasons[0]).toMatch(/1 year/i);
    expect(results[3].reasons[0]).toMatch(/does not count/i);
  });

  it('First MenB booster given 14 months after D3 → valid', () => {
    const d1 = monthsAgo(30);
    const d2 = monthsAgo(28);
    const d3 = monthsAgo(22); // ≥6mo from D1, ≥4mo from D2
    const d4 = monthsAgo(8);  // 14 months after D3 (≥12 months) → valid
    const results = validate('MenB', [
      { date: d1, brand: 'Trumenba (MenB)' },
      { date: d2, brand: 'Trumenba (MenB)' },
      { date: d3, brand: 'Trumenba (MenB)' },
      { date: d4, brand: 'Trumenba (MenB)' },
    ], 360, ['asplenia']);
    expect(results[3].status).toBe('valid');
  });

  it('Subsequent MenB booster (D5) given only 1 year after D4 (needs ≥2 years) → invalid', () => {
    const d1 = monthsAgo(60);
    const d2 = monthsAgo(58);
    const d3 = monthsAgo(52); // ≥6mo from D1
    const d4 = monthsAgo(38); // 14 months after D3 (≥12 months, first booster) → valid
    const d5 = monthsAgo(26); // only 12 months after D4 → needs ≥2 years for subsequent boosters
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
      { date: d3, brand: 'Bexsero (MenB)' },
      { date: d4, brand: 'Bexsero (MenB)' },
      { date: d5, brand: 'Bexsero (MenB)' },
    ], 360, ['asplenia']);
    expect(results[4].status).toBe('invalid');
    expect(results[4].reasons[0]).toMatch(/2 years/i);
  });

  it('Late/overdue MenB booster (3 years after D3) → valid (late is acceptable catch-up)', () => {
    const d1 = monthsAgo(50);
    const d2 = monthsAgo(48);
    const d3 = monthsAgo(42);
    const d4 = monthsAgo(6); // 3 years after D3 — overdue but acceptable
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
      { date: d3, brand: 'Bexsero (MenB)' },
      { date: d4, brand: 'Bexsero (MenB)' },
    ], 360, ['asplenia']);
    expect(results[3].status).toBe('valid');
  });
});

// ── Task 3: baseline ≥4wk MenACWY interval ───────────────────────────────

describe('Task 3 — Baseline ≥4wk minimum interval between any two MenACWY doses', () => {
  it('Two healthy-teen MenACWY doses 10 days apart → second invalid (≥4 weeks required)', () => {
    const d1 = daysAgo(30);
    const d2 = daysAgo(20); // only 10 days after D1
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
    ], 192, []); // 16-year-old, no risk factors
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons[0]).toMatch(/4 weeks/i);
    expect(results[1].reasons[0]).toMatch(/28 days/i);
  });

  it('Two MenACWY doses 3 days apart (obvious duplicate) → second invalid', () => {
    const d1 = daysAgo(10);
    const d2 = daysAgo(7); // 3 days after D1
    const results = validate('MenACWY', [{ date: d1 }, { date: d2 }], 168, []);
    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons[0]).toMatch(/minimum interval/i);
  });

  it('Two MenACWY doses exactly 28 days apart → second valid (meets minimum)', () => {
    const d1 = daysAgo(35);
    const d2 = daysAgo(7); // 28 days after D1
    const results = validate('MenACWY', [{ date: d1 }, { date: d2 }], 168, []);
    expect(results[1].status).toBe('valid');
  });

  it('High-risk D2 at 5 weeks (35 days) → valid (≥4wk baseline AND ≥4wk infant rule both met)', () => {
    // This checks that the baseline 28d doesn't interfere with the high-risk 8wk rule
    // — high-risk D2 at 35d is still invalid (needs 56d), not "valid because ≥28d".
    const d1 = weeksAgo(10);
    const d2 = weeksAgo(5); // 5 weeks — passes 4wk baseline but fails 8wk high-risk rule
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
    ], 360, ['asplenia']);
    // High-risk D2 still requires 8 weeks — the stricter rule wins.
    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons[0]).toMatch(/8 weeks/i);
  });

  it('Healthy adult: two doses 6 weeks apart → both valid (no high-risk rule applies)', () => {
    const d1 = weeksAgo(12);
    const d2 = weeksAgo(6);
    const results = validate('MenACWY', [{ date: d1 }, { date: d2 }], 360, []);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('valid');
  });
});

// ── Task 4: MenB family-lock anchors on first kept dose with known brand ──

describe('Task 4 — MenB family lock: anchor on first KEPT dose with known brand', () => {
  it('[unknown] → Bexsero → Trumenba: Trumenba is invalid (Bexsero established the 4C lock)', () => {
    // D1 has no brand (unknown). D2 is Bexsero (4C). D3 is Trumenba (FHbp).
    // Family lock is established by D2 (first kept dose with known brand = Bexsero = 4C).
    // D3 Trumenba (FHbp) must be flagged as family mismatch.
    const d1 = monthsAgo(13);  // no brand
    const d2 = monthsAgo(7);   // Bexsero (4C)
    const d3 = monthsAgo(1);   // Trumenba (FHbp) — mismatch against D2
    const results = validate('MenB', [
      { date: d1 },                             // unknown brand
      { date: d2, brand: 'Bexsero (MenB)' },   // 4C — sets the lock
      { date: d3, brand: 'Trumenba (MenB)' },  // FHbp — should be invalid
    ], 240);

    expect(results[0].status).toBe('valid');     // D1: no brand, but has date + age ≥10y → valid
    expect(results[1].status).toBe('valid');     // D2: Bexsero, fine
    expect(results[2].status).toBe('invalid');  // D3: family mismatch
    expect(results[2].reasons[0]).toMatch(/not interchangeable/i);
    expect(results[2].reasons[0]).toMatch(/4C/);
    expect(results[2].reasons[0]).toMatch(/FHbp/);
  });

  it('[unknown] → Trumenba → Bexsero: Bexsero is invalid (Trumenba established the FHbp lock)', () => {
    const d1 = monthsAgo(13);
    const d2 = monthsAgo(7);
    const d3 = monthsAgo(1);
    const results = validate('MenB', [
      { date: d1 },
      { date: d2, brand: 'Trumenba (MenB)' },
      { date: d3, brand: 'Bexsero (MenB)' },
    ], 240);
    expect(results[2].status).toBe('invalid');
    expect(results[2].reasons[0]).toMatch(/FHbp/);
  });

  it('[known] → [unknown] → mismatch: known D1 sets lock, D3 mismatch is still caught', () => {
    // D1 Bexsero (known, 4C). D2 unknown brand. D3 Trumenba (FHbp).
    // Lock is set by D1 (Bexsero). D2 is kept (unknown brand, no mismatch check).
    // D3 Trumenba must be caught as mismatch against the 4C lock.
    const d1 = monthsAgo(13);
    const d2 = monthsAgo(7);
    const d3 = monthsAgo(1);
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2 },                            // unknown brand — no mismatch check
      { date: d3, brand: 'Trumenba (MenB)' }, // FHbp — mismatch against D1 Bexsero
    ], 240);
    expect(results[1].status).not.toBe('invalid'); // D2 unknown brand is fine
    expect(results[2].status).toBe('invalid');     // D3 mismatch caught
    expect(results[2].reasons[0]).toMatch(/4C/);
  });

  it('All three doses unknown brand → no family-mismatch error (cannot infer family)', () => {
    const d1 = monthsAgo(13);
    const d2 = monthsAgo(7);
    const d3 = monthsAgo(1);
    const results = validate('MenB', [{ date: d1 }, { date: d2 }, { date: d3 }], 240);
    const hasMismatch = results.some(r => r.reasons.some(msg => /interchangeable|mismatch/i.test(msg)));
    expect(hasMismatch).toBe(false);
  });
});

// ── Task 5: dueToday false when earliestNextDate is in the future ─────────

describe('Task 5 — dueToday is false when dose is not yet due', () => {
  it('High-risk MenACWY: D1 given 3 weeks ago → D2 not due today (needs 8 weeks)', () => {
    const r = run({
      ageMonths: 360,
      riskIds: ['asplenia'],
      menacwyDoses: [{ date: weeksAgo(3) }],
    });
    const rec = r.menacwy[0];
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBeTruthy();
    // earliestNextDate must be in the future
    expect(rec.earliestNextDate > TODAY).toBe(true);
  });

  it('MenB high-risk: D1 given 2 weeks ago → D2 not due today (needs 4 weeks)', () => {
    const r = run({
      ageMonths: 360,
      riskIds: ['asplenia'],
      menbDoses: [{ date: weeksAgo(2), brand: 'Bexsero (MenB)' }],
    });
    const rec = r.menb[0];
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate).toBeTruthy();
    expect(rec.earliestNextDate > TODAY).toBe(true);
  });

  it('MenB healthy: D1 given 3 months ago → D2 not due today (needs 6 months)', () => {
    const r = run({
      ageMonths: 192, // 16y
      riskIds: [],
      menbDoses: [{ date: monthsAgo(3), brand: 'Bexsero (MenB)' }],
    });
    const rec = r.menb[0];
    expect(rec.dueToday).toBe(false);
    expect(rec.earliestNextDate > TODAY).toBe(true);
  });

  it('MenACWY no doses → dose 1 due today (baseline case still works)', () => {
    const r = run({ ageMonths: 132, riskIds: [], menacwyDoses: [] });
    expect(r.menacwy[0].dueToday).toBe(true);
  });

  it('MenACWY high-risk: D1 given 9 weeks ago → D2 is due today (interval elapsed)', () => {
    const r = run({
      ageMonths: 360,
      riskIds: ['asplenia'],
      menacwyDoses: [{ date: weeksAgo(9) }],
    });
    expect(r.menacwy[0].dueToday).toBe(true);
    expect(r.menacwy[0].earliestNextDate).toBeNull();
  });
});

// ── Task 6: fmtAgeMonths clinical units ──────────────────────────────────

describe('Task 6 — fmtAgeMonths uses clinical units (never raw "N months" for ≥24 months)', () => {
  it('fmtAgeMonths(72) → "6 years" (not "72 months")', () => {
    expect(fmtAgeMonths(72)).toBe('6 years');
  });

  it('fmtAgeMonths(0) → "Birth"', () => {
    expect(fmtAgeMonths(0)).toBe('Birth');
  });

  it('fmtAgeMonths(0.1) → "Birth" (very newborn, < 0.25)', () => {
    // Less than ~1 week → Birth
    expect(fmtAgeMonths(0.1)).toBe('Birth');
  });

  it('fmtAgeMonths(1.5) → weeks (e.g. "6 weeks") for young infants', () => {
    // 1.5 months ≈ 6.5 weeks
    const result = fmtAgeMonths(1.5);
    expect(result).toMatch(/week/i);
    expect(result).not.toMatch(/month/i);
  });

  it('fmtAgeMonths(2) → weeks or month boundary, NOT "2 months" in display if ≤2mo threshold used', () => {
    // At exactly 2 months (the threshold), format should be weeks (≤2 → weeks branch)
    const result = fmtAgeMonths(2);
    expect(result).toMatch(/week/i);
  });

  it('fmtAgeMonths(4) → "4 months"', () => {
    expect(fmtAgeMonths(4)).toBe('4 months');
  });

  it('fmtAgeMonths(15) → "15 months"', () => {
    expect(fmtAgeMonths(15)).toBe('15 months');
  });

  it('fmtAgeMonths(24) → "2 years" (not "24 months")', () => {
    expect(fmtAgeMonths(24)).toBe('2 years');
  });

  it('fmtAgeMonths(30) → "2 years 6 months"', () => {
    expect(fmtAgeMonths(30)).toBe('2 years 6 months');
  });

  it('fmtAgeMonths(132) → "11 years" (routine MenACWY age)', () => {
    expect(fmtAgeMonths(132)).toBe('11 years');
  });

  it('fmtAgeMonths(192) → "16 years"', () => {
    expect(fmtAgeMonths(192)).toBe('16 years');
  });

  it('fmtAgeMonths(360) → "30 years"', () => {
    expect(fmtAgeMonths(360)).toBe('30 years');
  });

  it('Does not output raw "N months" for any age ≥24 months', () => {
    // Spot-check a range of ages ≥24 months
    [24, 30, 36, 48, 60, 72, 84, 120, 132, 192, 240, 360].forEach(am => {
      const result = fmtAgeMonths(am);
      // Must contain "year" not end in just "months"
      expect(result).toMatch(/year/i);
    });
  });
});

// ── Regression: all-valid baseline still works ───────────────────────────

describe('Regression — existing valid behaviors unchanged', () => {
  it('MenACWY Menveo at 3 months → still valid', () => {
    const results = validate('MenACWY', [{ date: monthsAgo(237), brand: 'Menveo (MenACWY)' }], 240);
    expect(results[0].status).toBe('valid');
  });

  it('MenACWY MenQuadfi at 12 months → still invalid (min 24 months)', () => {
    const results = validate('MenACWY', [{ date: monthsAgo(228), brand: 'MenQuadfi (MenACWY)' }], 240);
    expect(results[0].status).toBe('invalid');
    expect(results[0].reasons[0]).toMatch(/2 years/i);
  });

  it('MenB Bexsero at age 10y 3mo → still valid', () => {
    const results = validate('MenB', [{ date: monthsAgo(117), brand: 'Bexsero (MenB)' }], 240);
    expect(results[0].status).toBe('valid');
  });

  it('MenB healthy D2 at 3 months (early) → still valid, rescue note present', () => {
    const d1 = monthsAgo(5);
    const d2 = monthsAgo(2);
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
    ], 240, []);
    expect(results[1].status).toBe('valid');
    expect(results[1].reasons[0]).toMatch(/rescue/i);
  });

  it('MenB D1 Bexsero, D2 Trumenba → still invalid (family mismatch)', () => {
    const results = validate('MenB', [
      { date: monthsAgo(7), brand: 'Bexsero (MenB)' },
      { date: monthsAgo(1), brand: 'Trumenba (MenB)' },
    ], 240);
    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons[0]).toMatch(/not interchangeable/i);
  });

  it('analyzeHistory effective count is still correct with renumbering', () => {
    // D1 invalid (MenQuadfi at 12mo), D2 valid → D2 is effective D1
    const d1 = monthsAgo(228); // ageAtDose = 12 → invalid
    const d2 = monthsAgo(24);  // valid
    const { perDose, effective } = analyze('MenACWY', [
      { date: d1, brand: 'MenQuadfi (MenACWY)' },
      { date: d2, brand: 'MenQuadfi (MenACWY)' },
    ], 240, ['asplenia']);
    expect(perDose[0].status).toBe('invalid');
    expect(perDose[1].status).toBe('valid');
    expect(perDose[1].effectiveDoseNum).toBe(1);
    expect(effective).toHaveLength(1);
  });
});

// ── MenACWY high-risk booster cadence regression (first vs subsequent) ────
//
// Rule (ACIP 2020 MMWR / immunize.org p2035):
//   First booster (effectiveIdx === 2):
//     D2 at <7y → 3-year cadence (MENACWY_BOOSTER_3Y)
//     D2 at ≥7y or unknown → 5-year cadence (MENACWY_BOOSTER_5Y)
//   Subsequent boosters (effectiveIdx >= 3): ALWAYS 5-year cadence.

describe('MenACWY high-risk booster cadence — first vs subsequent regression', () => {
  it('Case A: primary <7y — first booster (D3) at 2 years after D2 → invalid (needs 3y)', () => {
    // Patient now 10y (120mo). D1 at age 4y, D2 at age 5y (both <7y).
    // D3 given only 2 years after D2 → needs 3 years → invalid.
    const d1 = monthsAgo(72); // ageAtDose ≈ 4y
    const d2 = monthsAgo(60); // ageAtDose ≈ 5y
    const d3 = monthsAgo(36); // 2y after D2 → too soon for 3y cadence
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
      { date: d3, brand: 'Menveo (MenACWY)' },
    ], 120, ['asplenia']);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('valid');
    expect(results[2].status).toBe('invalid');
    expect(results[2].reasons[0]).toMatch(/3 years/i);
  });

  it('Case A-ok: primary <7y — first booster (D3) at 4 years after D2 → valid', () => {
    // D3 given 4 years after D2 — satisfies the 3-year cadence for primary <7y.
    const d1 = monthsAgo(96);  // ageAtDose ≈ 4y
    const d2 = monthsAgo(84);  // ageAtDose ≈ 5y
    const d3 = monthsAgo(36);  // 4y after D2 → satisfies 3y cadence
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
      { date: d3, brand: 'Menveo (MenACWY)' },
    ], 120, ['asplenia']);
    expect(results[2].status).toBe('valid');
  });

  it('Case A-subsequent: primary <7y — second booster (D4) at 3 years after D3 → invalid (needs 5y)', () => {
    // Even though primary was <7y, ALL subsequent boosters (D4+) need 5 years.
    // D4 given only 3 years after D3 → invalid.
    const d1 = monthsAgo(180); // ageAtDose ≈ 4y  (patient now 19y = 228mo)
    const d2 = monthsAgo(168); // ageAtDose ≈ 5y
    const d3 = monthsAgo(120); // first booster (4y after D2, ≥3y) → valid
    const d4 = monthsAgo(84);  // 3y after D3 → needs 5y for subsequent → invalid
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
      { date: d3, brand: 'Menveo (MenACWY)' },
      { date: d4, brand: 'Menveo (MenACWY)' },
    ], 228, ['asplenia']);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('valid');
    expect(results[2].status).toBe('valid'); // first booster: 4y ≥ 3y → valid
    expect(results[3].status).toBe('invalid'); // subsequent: 3y < 5y → invalid
    expect(results[3].reasons[0]).toMatch(/5 years/i);
  });

  it('Case B: primary ≥7y — first booster (D3) at 3 years after D2 → invalid (needs 5y)', () => {
    // D2 at age 10y (120mo) → ≥7y → first booster cadence is 5y.
    // D3 given only 3 years after D2 → invalid.
    const d1 = monthsAgo(120); // ageAtDose ≈ 10y (patient now 20y = 240mo)
    const d2 = monthsAgo(108); // ageAtDose ≈ 11y
    const d3 = monthsAgo(72);  // 3y after D2 → needs 5y → invalid
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
      { date: d3, brand: 'Menveo (MenACWY)' },
    ], 240, ['asplenia']);
    expect(results[2].status).toBe('invalid');
    expect(results[2].reasons[0]).toMatch(/5 years/i);
  });

  it('Case B-subsequent: primary ≥7y — second booster (D4) at 3 years after D3 → invalid (needs 5y)', () => {
    // Subsequent booster needs 5y regardless.
    const d1 = monthsAgo(240); // ageAtDose ≈ 10y (patient now 30y = 360mo)
    const d2 = monthsAgo(228); // ageAtDose ≈ 11y
    const d3 = monthsAgo(168); // first booster (5y after D2) → valid
    const d4 = monthsAgo(132); // 3y after D3 → needs 5y → invalid
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
      { date: d3, brand: 'Menveo (MenACWY)' },
      { date: d4, brand: 'Menveo (MenACWY)' },
    ], 360, ['asplenia']);
    expect(results[2].status).toBe('valid'); // first booster: 5y ≥ 5y → valid
    expect(results[3].status).toBe('invalid'); // subsequent: 3y < 5y → invalid
    expect(results[3].reasons[0]).toMatch(/5 years/i);
  });
});
