import { describe, it, expect } from 'vitest';
import { validateHistory } from '../validate.js';
import { DAYS } from '../dateUtils.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-06-03';

// ── helpers ──────────────────────────────────────────────────────────────
function validate(vaccine, doses, ageMonths, riskIds = []) {
  return validateHistory(vaccine, doses, ageMonths, riskIds, TODAY);
}
// A "current age" from which we can back-compute dates.
// ageMonths = 192 → 16-year-old
const ADULT_AM = 240; // 20-year-old
const HR_AM    = 360; // 30-year-old with high-risk factor
// Date X months ago from TODAY
function monthsAgo(m) { return addDays(TODAY, -Math.round(m * 30.4375)); }
function weeksAgo(w)  { return addDays(TODAY, -(w * 7)); }
function daysAgo(d)   { return addDays(TODAY, -d); }

// ── MenACWY tests ─────────────────────────────────────────────────────────
describe('MenACWY — no date', () => {
  it('unknown result when dose has no date', () => {
    const results = validate('MenACWY', [{}], ADULT_AM);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('unknown');
    expect(results[0].reasons[0]).toMatch(/No date recorded/);
  });

  it('unknown result includes counting note', () => {
    const results = validate('MenACWY', [{}, {}], ADULT_AM);
    expect(results[0].status).toBe('unknown');
    expect(results[1].status).toBe('unknown');
  });
});

describe('MenACWY — MenQuadfi before 24 months', () => {
  it('MenQuadfi at 12 months → invalid (min age 24 mo)', () => {
    // Patient is 20y (240 mo). Dose given 228 months ago → ageAtDose = 240-228 = 12
    const results = validate('MenACWY', [{ date: monthsAgo(228), brand: 'MenQuadfi (MenACWY)' }], 240);
    expect(results[0].status).toBe('invalid');
    expect(results[0].reasons[0]).toMatch(/below the minimum age/);
    expect(results[0].reasons[0]).toMatch(/2 years/i);
  });

  it('MenQuadfi at 27 months → valid (clearly above 24-month minimum)', () => {
    // Patient is 20y (240 mo). Dose given 213 months ago → ageAtDose ≈ 27
    const results = validate('MenACWY', [{ date: monthsAgo(213), brand: 'MenQuadfi (MenACWY)' }], 240);
    expect(results[0].status).toBe('valid');
  });
});

describe('MenACWY — Menveo at 3 months', () => {
  it('Menveo at 3 months → valid (min age 2 mo)', () => {
    // Patient is now 20y (240 mo). Dose given 237 months ago → ageAtDose = 3
    const results = validate('MenACWY', [{ date: monthsAgo(237), brand: 'Menveo (MenACWY)' }], 240);
    expect(results[0].status).toBe('valid');
  });

  it('Menveo at 1 month → invalid (below 2-month minimum)', () => {
    // ageAtDose = 240 - 239 = 1 month
    const results = validate('MenACWY', [{ date: monthsAgo(239), brand: 'Menveo (MenACWY)' }], 240);
    expect(results[0].status).toBe('invalid');
  });
});

describe('MenACWY — high-risk adult D2 interval check', () => {
  it('D2 given only 4 weeks after D1 (high-risk ≥2y) → invalid (needs 8 weeks)', () => {
    const d1 = weeksAgo(20);
    const d2 = weeksAgo(16); // 4 weeks after d1
    const results = validate('MenACWY', [
      { date: d1, brand: 'Menveo (MenACWY)' },
      { date: d2, brand: 'Menveo (MenACWY)' },
    ], HR_AM, ['asplenia']);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons[0]).toMatch(/minimum interval is 8 weeks/i);
  });

  it('D2 given 9 weeks after D1 (high-risk) → valid', () => {
    const d1 = weeksAgo(20);
    const d2 = weeksAgo(11); // 9 weeks after d1
    const results = validate('MenACWY', [
      { date: d1 },
      { date: d2 },
    ], HR_AM, ['complement']);
    expect(results[1].status).toBe('valid');
  });

  it('No interval check for non-high-risk D2', () => {
    const d1 = weeksAgo(20);
    const d2 = weeksAgo(16); // 4 weeks — short, but no risk factor
    const results = validate('MenACWY', [
      { date: d1 },
      { date: d2 },
    ], ADULT_AM, []);
    // Should be valid — only high-risk patients have the D2 interval check
    expect(results[1].status).toBe('valid');
  });
});

describe('MenACWY — Menactra at 9 months', () => {
  it('Menactra at 9 months → valid', () => {
    // ageAtDose = 240 - 231 = 9
    const results = validate('MenACWY', [{ date: monthsAgo(231), brand: 'Menactra (MenACWY) — discontinued' }], 240);
    expect(results[0].status).toBe('valid');
  });

  it('Menactra at 5 months → invalid (min 9 months)', () => {
    // ageAtDose = 240 - 235 = 5
    const results = validate('MenACWY', [{ date: monthsAgo(235), brand: 'Menactra (MenACWY) — discontinued' }], 240);
    expect(results[0].status).toBe('invalid');
    expect(results[0].reasons[0]).toMatch(/below the minimum age/i);
  });
});

// ── MenB tests ────────────────────────────────────────────────────────────
describe('MenB — dose before age 10', () => {
  it('MenB dose at 9 years (108 mo) → invalid', () => {
    // Patient is now 20y (240 mo). Dose given 132 months ago → ageAtDose = 108
    const results = validate('MenB', [{ date: monthsAgo(132), brand: 'Bexsero (MenB)' }], 240);
    expect(results[0].status).toBe('invalid');
    expect(results[0].reasons[0]).toMatch(/age 10 years/);
  });

  it('MenB dose at 10y 3 months (123 mo) → valid (above minimum)', () => {
    // ageAtDose ≈ 240 - 117 = 123 months
    const results = validate('MenB', [{ date: monthsAgo(117), brand: 'Bexsero (MenB)' }], 240);
    expect(results[0].status).toBe('valid');
  });

  it('MenB dose at 7 months → invalid (applies regardless of brand)', () => {
    // ageAtDose = 240 - 233 = 7
    const results = validate('MenB', [{ date: monthsAgo(233), brand: 'Trumenba (MenB)' }], 240);
    expect(results[0].status).toBe('invalid');
  });
});

describe('MenB — antigen-family mismatch', () => {
  it('D1 Bexsero, D2 Trumenba → D2 invalid (family mismatch)', () => {
    const results = validate('MenB', [
      { date: monthsAgo(6), brand: 'Bexsero (MenB)' },
      { date: monthsAgo(1), brand: 'Trumenba (MenB)' },
    ], ADULT_AM);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons[0]).toMatch(/not interchangeable/i);
    expect(results[1].reasons[0]).toMatch(/4C/);
    expect(results[1].reasons[0]).toMatch(/FHbp/);
  });

  it('D1 Trumenba, D2 Penbraya → both valid (same FHbp family, pentavalent allowed)', () => {
    const results = validate('MenB', [
      { date: monthsAgo(7), brand: 'Trumenba (MenB)' },
      { date: monthsAgo(1), brand: 'Penbraya (MenABCWY)' },
    ], ADULT_AM);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('valid');
  });

  it('D1 unknown brand, D2 Trumenba → no family-mismatch error (cannot infer D1 family)', () => {
    const results = validate('MenB', [
      { date: monthsAgo(7) },
      { date: monthsAgo(1), brand: 'Trumenba (MenB)' },
    ], ADULT_AM);
    // D2 should not be flagged as mismatch — D1 brand unknown
    expect(results[1].status).not.toBe('invalid');
  });

  it('D1 Bexsero, D2 unknown brand → no family-mismatch error (D2 brand unknown)', () => {
    const results = validate('MenB', [
      { date: monthsAgo(7), brand: 'Bexsero (MenB)' },
      { date: monthsAgo(1) },
    ], ADULT_AM);
    expect(results[1].status).not.toBe('invalid');
  });
});

describe('MenB — healthy 2-dose: D2 early triggers rescue note (NOT invalid)', () => {
  it('D2 given 3 months after D1 (healthy, no risk) → valid + early/rescue reason', () => {
    const d1 = monthsAgo(5);
    const d2 = monthsAgo(2); // ~3 months after d1
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
    ], ADULT_AM, []);
    expect(results[1].status).toBe('valid');
    expect(results[1].reasons[0]).toMatch(/rescue dose/i);
    expect(results[1].reasons[0]).toMatch(/required/i);
  });

  it('D2 given 7 months after D1 (healthy) → valid, no rescue note', () => {
    const d1 = monthsAgo(8);
    const d2 = monthsAgo(1); // ~7 months after d1
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
    ], ADULT_AM, []);
    expect(results[1].status).toBe('valid');
    expect(results[1].reasons).toHaveLength(0);
  });
});

describe('MenB — high-risk D2 interval (<4 weeks → invalid)', () => {
  it('D2 given 3 weeks after D1 (high-risk) → invalid', () => {
    const d1 = weeksAgo(10);
    const d2 = weeksAgo(7); // 3 weeks after d1
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
    ], HR_AM, ['asplenia']);
    expect(results[1].status).toBe('invalid');
    expect(results[1].reasons[0]).toMatch(/≥4 weeks/i);
  });

  it('D2 given 5 weeks after D1 (high-risk) → valid', () => {
    const d1 = weeksAgo(10);
    const d2 = weeksAgo(5); // 5 weeks after d1
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
    ], HR_AM, ['complement']);
    expect(results[1].status).toBe('valid');
  });
});

describe('MenB — high-risk D3 interval checks', () => {
  it('D3 < 6 months after D1 (high-risk) → invalid', () => {
    const d1 = monthsAgo(5);
    const d2 = monthsAgo(3);
    const d3 = monthsAgo(1);
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
      { date: d3, brand: 'Bexsero (MenB)' },
    ], HR_AM, ['asplenia']);
    expect(results[2].status).toBe('invalid');
    expect(results[2].reasons.some(r => /6 months.*D1/i.test(r))).toBe(true);
  });

  it('D3 < 4 months after D2 (high-risk) → invalid', () => {
    const d1 = monthsAgo(9);
    const d2 = monthsAgo(5);
    const d3 = monthsAgo(3); // 2 months after d2; but ≥6 months after d1
    const results = validate('MenB', [
      { date: d1, brand: 'Trumenba (MenB)' },
      { date: d2, brand: 'Trumenba (MenB)' },
      { date: d3, brand: 'Trumenba (MenB)' },
    ], HR_AM, ['complement']);
    expect(results[2].status).toBe('invalid');
    expect(results[2].reasons.some(r => /4 months.*D2/i.test(r))).toBe(true);
  });

  it('D3 ≥6 months after D1 AND ≥4 months after D2 (high-risk) → valid', () => {
    const d1 = monthsAgo(10);
    const d2 = monthsAgo(8);
    const d3 = monthsAgo(1); // 9 months after d1, 7 months after d2
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
      { date: d3, brand: 'Bexsero (MenB)' },
    ], HR_AM, ['asplenia']);
    expect(results[2].status).toBe('valid');
  });
});

describe('MenB — no date → unknown', () => {
  it('dose with no date → unknown result', () => {
    const results = validate('MenB', [{}], ADULT_AM);
    expect(results[0].status).toBe('unknown');
    expect(results[0].reasons[0]).toMatch(/No date recorded/);
  });
});

describe('All-valid baselines', () => {
  it('MenACWY: two high-risk doses ≥8 weeks apart → both valid', () => {
    const d1 = monthsAgo(6);
    const d2 = monthsAgo(4); // ~2 months after d1 = ~8 weeks
    const results = validate('MenACWY', [{ date: d1 }, { date: d2 }], HR_AM, ['asplenia']);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('valid');
  });

  it('MenB: healthy 2-dose ≥6 months apart → both valid, no reasons', () => {
    const d1 = monthsAgo(8);
    const d2 = monthsAgo(1);
    const results = validate('MenB', [
      { date: d1, brand: 'Bexsero (MenB)' },
      { date: d2, brand: 'Bexsero (MenB)' },
    ], ADULT_AM);
    expect(results[0].status).toBe('valid');
    expect(results[1].status).toBe('valid');
    expect(results[1].reasons).toHaveLength(0);
  });

  it('empty history → empty results', () => {
    const results = validate('MenB', [], ADULT_AM);
    expect(results).toHaveLength(0);
  });
});
