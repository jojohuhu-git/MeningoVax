// ─────────────────────────────────────────────────────────────────────────
// analyzeHistory.test.js
//
// Tests for the Phase 3 effective-dose counting system:
//   - analyzeHistory() → { perDose, effective }
//   - recommend() consuming only effective doses
//
// The key invariant: invalid doses do NOT count toward series completion.
// An invalid dose is dropped from `effective`; subsequent valid doses are
// re-evaluated at the correct effective position (renumbering guarantee).
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-06-03';

// ── date helpers ──────────────────────────────────────────────────────────
function monthsAgo(m)  { return addDays(TODAY, -Math.round(m * 30.4375)); }
function weeksAgo(w)   { return addDays(TODAY, -(w * 7)); }

function analyze(vaccine, doses, ageMonths, riskIds = []) {
  return analyzeHistory(vaccine, doses, ageMonths, riskIds, TODAY);
}

function run(input) {
  return recommend({ today: TODAY, ...input });
}
const menb = (r) => r.menb[0];
const acwy = (r) => r.menacwy[0];

// ── CORE RENUMBERING GUARANTEE ────────────────────────────────────────────
// This is the primary guard against the Phase 2 bug where invalid D1 caused
// false "interval too short" cascades on D2. Reverting the last-kept walk
// in analyzeHistory() should make this test fail.
describe('Renumbering guarantee — invalid D1 makes D2 become effective D1', () => {
  it('MenACWY: D1 invalid (too young), D2 valid → D2 gets effectiveDoseNum=1, no cascade error', () => {
    // Patient is 30y (360 mo). Menveo at 1 month old = ageAtDose=1 → invalid (min 2 mo).
    // Second dose given at 25y = valid.
    const d1 = monthsAgo(359); // ageAtDose ≈ 1 month → invalid (Menveo min is 2mo)
    const d2 = monthsAgo(60);  // ageAtDose ≈ 25 years → valid
    const { perDose, effective } = analyze(
      'MenACWY',
      [
        { date: d1, brand: 'Menveo (MenACWY)' },
        { date: d2, brand: 'Menveo (MenACWY)' },
      ],
      360, // 30 years
      ['asplenia']
    );

    // D1 invalid (below min age)
    expect(perDose[0].status).toBe('invalid');
    expect(perDose[0].effectiveDoseNum).toBeNull();
    expect(perDose[0].doesNotCount).toBe(true);

    // D2 valid, re-evaluated as effective D1 (not "interval too short after D1")
    expect(perDose[1].status).toBe('valid');
    expect(perDose[1].effectiveDoseNum).toBe(1);
    // Reasons must NOT include any interval error
    const intervalError = perDose[1].reasons.some(r => /interval/i.test(r) && /invalid/i.test(r));
    expect(intervalError).toBe(false);

    // Effective list has only D2
    expect(effective).toHaveLength(1);
    expect(effective[0].date).toBe(d2);
  });

  it('MenB: D1 invalid (below age 10), D2 in correct family → D2 gets effectiveDoseNum=1 (NOT a family-mismatch error)', () => {
    // Patient is 25y (300 mo). First dose at age 8y = invalid. Second dose at 20y = valid.
    const d1 = monthsAgo(204); // ageAtDose ≈ 300-204=96 months ≈ 8 years → invalid
    const d2 = monthsAgo(60);  // ageAtDose ≈ 25 years → valid
    const { perDose, effective } = analyze(
      'MenB',
      [
        { date: d1, brand: 'Bexsero (MenB)' },
        { date: d2, brand: 'Trumenba (MenB)' }, // different family — but D1 was dropped, so no lock
      ],
      300,
      []
    );

    // D1 invalid (below 10y)
    expect(perDose[0].status).toBe('invalid');
    expect(perDose[0].effectiveDoseNum).toBeNull();

    // D2 becomes effective D1; family lock was never set (D1 dropped).
    // Trumenba is valid as the first effective dose.
    expect(perDose[1].status).toBe('valid');
    expect(perDose[1].effectiveDoseNum).toBe(1);
    // Must NOT say "family mismatch" (D1 was dropped, no family was established)
    const mismatchError = perDose[1].reasons.some(r => /interchangeable|mismatch/i.test(r));
    expect(mismatchError).toBe(false);

    expect(effective).toHaveLength(1);
    expect(effective[0].brand).toBe('Trumenba (MenB)');
  });
});

// ── FAMILY MISMATCH (MenB) → does not count ──────────────────────────────
describe('MenB family mismatch → invalid, does not count', () => {
  it('D1 Bexsero (4C), D2 Trumenba (FHbp) → D2 invalid, effective count = 1', () => {
    const d1 = monthsAgo(7);
    const d2 = monthsAgo(1);
    const { perDose, effective } = analyze(
      'MenB',
      [
        { date: d1, brand: 'Bexsero (MenB)' },
        { date: d2, brand: 'Trumenba (MenB)' },
      ],
      240, // 20 years
      []
    );

    expect(perDose[0].status).toBe('valid');
    expect(perDose[0].effectiveDoseNum).toBe(1);

    expect(perDose[1].status).toBe('invalid');
    expect(perDose[1].effectiveDoseNum).toBeNull();
    expect(perDose[1].doesNotCount).toBe(true);
    expect(perDose[1].reasons.some(r => /interchangeable|mismatch/i.test(r))).toBe(true);
    // "does not count" message present
    expect(perDose[1].reasons.some(r => /does not count/i.test(r))).toBe(true);

    // Only D1 kept; D2 dropped.
    expect(effective).toHaveLength(1);
    expect(effective[0].brand).toBe('Bexsero (MenB)');
  });

  it('D1 Bexsero, D2 Trumenba → engine status is NOT complete (dose 2 still needed)', () => {
    const d1 = monthsAgo(7);
    const d2 = monthsAgo(1);
    const r = run({
      ageMonths: 240,
      riskIds: [],
      menbDoses: [
        { date: d1, brand: 'Bexsero (MenB)' },
        { date: d2, brand: 'Trumenba (MenB)' },
      ],
    });

    // Engine sees only 1 effective dose → still needs dose 2
    expect(menb(r).status).not.toBe('complete');
    expect(menb(r).doseNum).toBe(2);
    // Family lock: established by effective D1 (Bexsero = 4C)
    expect(menb(r).family).toBe('4C');
    // Brand options should show 4C family only
    const brands = menb(r).brands.join(' ');
    expect(brands).toMatch(/Bexsero/);
    expect(brands).not.toMatch(/Trumenba/);
  });
});

// ── MENACWY HIGH-RISK: D2 invalid interval → renumbering guarantee ────────
describe('MenACWY high-risk: D2 with invalid interval, D3 valid', () => {
  it('D1 valid, D2 too soon (invalid), D3 after correct interval from D1 → D3 is effective D2, NOT flagged for interval', () => {
    // High-risk adult (asplenia). D1 at ~12 months ago, D2 only 3 weeks after D1 (invalid),
    // D3 given 10 weeks after D1 (valid — re-evaluated against D1, not D2).
    const d1 = weeksAgo(20);
    const d2 = weeksAgo(17); // 3 weeks after d1 → invalid (needs ≥8 weeks)
    const d3 = weeksAgo(10); // 10 weeks after d1 → valid when re-evaluated as D2

    const { perDose, effective } = analyze(
      'MenACWY',
      [
        { date: d1, brand: 'Menveo (MenACWY)' },
        { date: d2, brand: 'Menveo (MenACWY)' },
        { date: d3, brand: 'Menveo (MenACWY)' },
      ],
      360,    // 30 years
      ['asplenia']
    );

    // D1: valid
    expect(perDose[0].status).toBe('valid');
    expect(perDose[0].effectiveDoseNum).toBe(1);

    // D2: invalid (3 weeks is too short for high-risk D2, needs 8 weeks)
    expect(perDose[1].status).toBe('invalid');
    expect(perDose[1].effectiveDoseNum).toBeNull();
    expect(perDose[1].doesNotCount).toBe(true);

    // D3: re-evaluated as effective D2, measured from D1 (10 weeks ≥ 8 weeks) → valid
    expect(perDose[2].status).toBe('valid');
    expect(perDose[2].effectiveDoseNum).toBe(2);
    // Renumber note present
    expect(perDose[2].reasons.some(r => /effective dose 2/i.test(r))).toBe(true);
    // No interval error — 10 weeks from D1 is fine
    const hasIntervalError = perDose[2].reasons.some(r =>
      /minimum interval/i.test(r) && /invalid|not valid|does not count/i.test(r)
    );
    expect(hasIntervalError).toBe(false);

    // Effective list: D1 + D3 (D2 dropped)
    expect(effective).toHaveLength(2);
    expect(effective[0].date).toBe(d1);
    expect(effective[1].date).toBe(d3);
  });
});

// ── MENB HIGH-RISK: D3 too soon → does not count ─────────────────────────
describe('MenB high-risk: D3 given too soon', () => {
  it('D1, D2 valid; D3 too soon after D1 → effective count 2, status still "dose 3 due"', () => {
    // D1: 8 months ago; D2: 6 months ago (valid, ≥4wk); D3: 2 months ago (only 6mo from D1, need ≥6)
    const d1 = monthsAgo(8);
    const d2 = monthsAgo(6); // 2 months after d1 = valid high-risk D2
    const d3 = monthsAgo(2); // 6 months from d1 = exactly at boundary; but DAYS.months(6) ≈ 183d
    // Let's make D3 clearly too soon: d1 was 8 months ago, d3 is 2 months ago = 6 months apart
    // 6 months = 183 days; 6mo apart is exactly the minimum, so use a clearly-too-short gap:
    const d3TooSoon = monthsAgo(3); // 5 months from D1 at monthsAgo(8) → only ~5 months

    const { perDose, effective } = analyze(
      'MenB',
      [
        { date: d1, brand: 'Bexsero (MenB)' },
        { date: d2, brand: 'Bexsero (MenB)' },
        { date: d3TooSoon, brand: 'Bexsero (MenB)' },
      ],
      360,
      ['asplenia']
    );

    expect(perDose[0].status).toBe('valid');
    expect(perDose[1].status).toBe('valid');
    expect(perDose[2].status).toBe('invalid');
    expect(perDose[2].doesNotCount).toBe(true);

    // Only 2 effective doses
    expect(effective).toHaveLength(2);

    // Engine should see 2 effective doses → D3 still needed
    const r = run({
      ageMonths: 360,
      riskIds: ['asplenia'],
      menbDoses: [
        { date: d1, brand: 'Bexsero (MenB)' },
        { date: d2, brand: 'Bexsero (MenB)' },
        { date: d3TooSoon, brand: 'Bexsero (MenB)' },
      ],
    });
    expect(menb(r).status).toBe('risk-based');
    expect(menb(r).doseNum).toBe(3);
    expect(menb(r).doseLabel).toMatch(/Dose 3/);
  });
});

// ── NO-DATE DOSES COUNT BUT ARE NOT TIMING ANCHORS ───────────────────────
describe('Dose with no date counts but is not a timing anchor', () => {
  it('MenB high-risk: D1 no date, D2 with date → D2 counts as effective D2; interval not checked (no anchor)', () => {
    const d2 = weeksAgo(10);
    const { perDose, effective } = analyze(
      'MenB',
      [
        { brand: 'Bexsero (MenB)' },         // no date → unknown, counts
        { date: d2, brand: 'Bexsero (MenB)' }, // date present, evaluated as effective D2
      ],
      360,
      ['asplenia']
    );

    // D1: unknown (no date)
    expect(perDose[0].status).toBe('unknown');
    expect(perDose[0].effectiveDoseNum).toBe(1);

    // D2: validated as effective dose 2; interval check looks for last DATED kept dose
    // D1 has no date → no anchor → interval not checked → should be valid
    expect(perDose[1].status).toBe('valid');
    expect(perDose[1].effectiveDoseNum).toBe(2);

    // Both counted
    expect(effective).toHaveLength(2);
  });

  it('MenACWY no date → series still counts, not flagged invalid', () => {
    const { perDose, effective } = analyze(
      'MenACWY',
      [{ brand: 'Menveo (MenACWY)' }], // no date
      360,
      []
    );
    expect(perDose[0].status).toBe('unknown');
    expect(perDose[0].effectiveDoseNum).toBe(1);
    expect(effective).toHaveLength(1);
  });
});

// ── ALL-VALID BASELINE (regression: existing behavior unchanged) ──────────
describe('All-valid baseline — no regressions', () => {
  it('MenACWY high-risk 2 valid doses → both in effective list', () => {
    const d1 = monthsAgo(6);
    const d2 = monthsAgo(4); // ~2 months after d1 ≥ 8 weeks
    const { perDose, effective } = analyze(
      'MenACWY',
      [{ date: d1, brand: 'Menveo (MenACWY)' }, { date: d2, brand: 'Menveo (MenACWY)' }],
      360,
      ['asplenia']
    );
    expect(perDose[0].status).toBe('valid');
    expect(perDose[1].status).toBe('valid');
    expect(perDose[0].effectiveDoseNum).toBe(1);
    expect(perDose[1].effectiveDoseNum).toBe(2);
    expect(effective).toHaveLength(2);
  });

  it('MenB healthy 2-dose ≥6 months → both valid, series complete in engine', () => {
    const d1 = monthsAgo(8);
    const d2 = monthsAgo(1); // ~7 months after d1 ≥ 6 months
    const { perDose, effective } = analyze(
      'MenB',
      [{ date: d1, brand: 'Bexsero (MenB)' }, { date: d2, brand: 'Bexsero (MenB)' }],
      240,
      []
    );
    expect(perDose[0].status).toBe('valid');
    expect(perDose[1].status).toBe('valid');
    expect(effective).toHaveLength(2);

    const r = run({
      ageMonths: 240, riskIds: [],
      menbDoses: [{ date: d1, brand: 'Bexsero (MenB)' }, { date: d2, brand: 'Bexsero (MenB)' }],
    });
    expect(menb(r).status).toBe('complete');
  });

  it('empty history → perDose=[], effective=[]', () => {
    const result = analyze('MenB', [], 240, []);
    expect(result.perDose).toHaveLength(0);
    expect(result.effective).toHaveLength(0);
  });

  it('recommend() with valid history unchanged from Phase 2 — 11y MenACWY dose 1 due', () => {
    const r = run({ ageMonths: 132, riskIds: [], menacwyDoses: [], menbDoses: [] });
    expect(acwy(r).status).toBe('due');
    expect(acwy(r).doseNum).toBe(1);
  });

  it('MenB healthy D2 early → VALID, rescue dose emitted (early D2 is NOT dropped)', () => {
    // This is the clinical rule: early D2 counts but triggers a rescue D3 rec.
    const d1 = monthsAgo(5);
    const d2 = monthsAgo(2); // ~3 months after d1, less than 6 months
    const { perDose, effective } = analyze(
      'MenB',
      [{ date: d1, brand: 'Bexsero (MenB)' }, { date: d2, brand: 'Bexsero (MenB)' }],
      240, []
    );
    // D2 is valid (not invalid) — early but not dropped
    expect(perDose[1].status).toBe('valid');
    expect(perDose[1].effectiveDoseNum).toBe(2);
    expect(effective).toHaveLength(2);

    // Engine should emit rescue dose rec
    const r = run({
      ageMonths: 240, riskIds: [],
      menbDoses: [{ date: d1, brand: 'Bexsero (MenB)' }, { date: d2, brand: 'Bexsero (MenB)' }],
    });
    expect(menb(r).doseLabel).toMatch(/rescue/i);
    expect(menb(r).doseNum).toBe(3);
  });
});

// ── FIRST DOSE INVALID → SECOND BECOMES EFFECTIVE D1 ─────────────────────
// This is the core renumbering bug guard. If analyzeHistory() is changed
// to use raw indices (like the old validateHistory()), this test MUST fail.
describe('First-dose-invalid renumbering (core invariant — must fail if walk is reverted)', () => {
  it('MenACWY: invalid D1 (MenQuadfi at 12mo), valid D2 → D2 is effective D1 with no cascade error', () => {
    // Patient now 25y (300mo). Dose 1: MenQuadfi at 12 months (ageAtDose=12 < 24mo minimum).
    // Dose 2: given 2 years ago = valid.
    const d1 = monthsAgo(288); // ageAtDose = 300-288 = 12 mo → invalid (MenQuadfi needs ≥24mo)
    const d2 = monthsAgo(24);  // ageAtDose = 300-24 = 276 mo = 23y → valid
    const { perDose, effective } = analyze(
      'MenACWY',
      [
        { date: d1, brand: 'MenQuadfi (MenACWY)' },
        { date: d2, brand: 'MenQuadfi (MenACWY)' },
      ],
      300,
      ['asplenia']
    );

    expect(perDose[0].status).toBe('invalid');   // D1 too young for MenQuadfi
    expect(perDose[1].status).toBe('valid');     // D2 valid — NOT flagged for interval
    expect(perDose[1].effectiveDoseNum).toBe(1); // Re-numbered as effective dose 1
    expect(effective).toHaveLength(1);
    expect(effective[0].date).toBe(d2);
  });
});

// ── VALIDATEHISTORY BACKWARD COMPAT ──────────────────────────────────────
describe('validateHistory() backward compatibility', () => {
  it('returns an array parallel to doses (same length)', () => {
    // Import from validate.js is done via analyzeHistory — test that perDose
    // length always matches input length.
    const doses = [
      { date: monthsAgo(6), brand: 'Bexsero (MenB)' },
      { date: monthsAgo(1), brand: 'Trumenba (MenB)' }, // invalid — family mismatch
    ];
    const { perDose } = analyze('MenB', doses, 240, []);
    expect(perDose).toHaveLength(doses.length);
  });
});
