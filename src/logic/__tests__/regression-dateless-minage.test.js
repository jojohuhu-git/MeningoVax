// ─────────────────────────────────────────────────────────────────────────
// regression-dateless-minage.test.js
//
// A dateless dose was previously always "unknown / cannot verify" — even when
// the patient's current age made the recorded brand impossible (e.g. a 2-year-
// old recorded with Penbraya, which is ≥10y). Since a past dose can never have
// been given later than today, the CURRENT age is an upper bound on the age at
// administration. When a KNOWN brand's minimum age exceeds the current age, the
// dose could not have been valid at any point in the patient's life → invalid
// (does not count). Unknown brand → no brand-specific flag (ACIP allows any
// brand when prior history is unknown), except the MenB ≥10y vaccine-category
// floor which applies to every MenB product.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { analyzeHistory, validateHistory } from '../validate.js';

const TODAY = '2026-06-03';

function validate(vaccine, doses, ageMonths, riskIds = []) {
  return validateHistory(vaccine, doses, ageMonths, riskIds, TODAY);
}
function analyze(vaccine, doses, ageMonths, riskIds = []) {
  return analyzeHistory(vaccine, doses, ageMonths, riskIds, TODAY);
}

// ── The reported bug: 2yo + Penbraya, no date ──────────────────────────────
describe('Dateless dose below brand minimum age → invalid', () => {
  it('Penbraya recorded for a 2-year-old (no date) → invalid, does not count', () => {
    const res = validate('MenB', [{ brand: 'Penbraya (MenABCWY)' }], 24);
    expect(res[0].status).toBe('invalid');
    expect(res[0].reasons[0]).toMatch(/minimum age of 10 years/);
    expect(res[0].reasons[0]).toMatch(/does not count/i);
  });

  it('invalid dateless dose is dropped from the effective series', () => {
    const { perDose, effective } = analyze('MenB', [{ brand: 'Penbraya (MenABCWY)' }], 24);
    expect(perDose[0].status).toBe('invalid');
    expect(perDose[0].doesNotCount).toBe(true);
    expect(effective).toHaveLength(0);
  });

  it('Penmenvy for a 5-year-old (no date) → invalid', () => {
    const res = validate('MenB', [{ brand: 'Penmenvy (MenABCWY)' }], 60);
    expect(res[0].status).toBe('invalid');
  });

  it('Bexsero for an 8-year-old (no date) → invalid', () => {
    const res = validate('MenB', [{ brand: 'Bexsero (MenB)' }], 96);
    expect(res[0].status).toBe('invalid');
  });

  it('MenQuadfi for a 12-month-old (no date) → invalid (min 24 mo)', () => {
    const res = validate('MenACWY', [{ brand: 'MenQuadfi (MenACWY)' }], 12);
    expect(res[0].status).toBe('invalid');
    expect(res[0].reasons[0]).toMatch(/minimum age of 2 years/);
  });
});

// ── Counts when current age clears the minimum ─────────────────────────────
describe('Dateless dose where current age clears the minimum → counts', () => {
  it('Penbraya for a 30-year-old (no date) → unknown, counts', () => {
    const { perDose, effective } = analyze('MenB', [{ brand: 'Penbraya (MenABCWY)' }], 360);
    expect(perDose[0].status).toBe('unknown');
    expect(effective).toHaveLength(1);
    expect(perDose[0].reasons[0]).toMatch(/must have been given at ≥10 years/);
  });

  it('MenQuadfi for a 20-year-old (no date) → unknown, counts with min-age note', () => {
    const res = validate('MenACWY', [{ brand: 'MenQuadfi (MenACWY)' }], 240);
    expect(res[0].status).toBe('unknown');
    expect(res[0].reasons[0]).toMatch(/≥2 years/);
  });
});

// ── Unknown brand → no brand-specific flag (ACIP: any brand acceptable) ─────
describe('Dateless dose with unknown brand', () => {
  it('MenACWY unknown brand for a 2-year-old (no date) → unknown, not flagged', () => {
    const res = validate('MenACWY', [{}], 24);
    expect(res[0].status).toBe('unknown');
  });

  it('MenACWY unknown brand for a 6-month-old (no date) → unknown (≥2mo floor cleared)', () => {
    const res = validate('MenACWY', [{}], 6);
    expect(res[0].status).toBe('unknown');
  });

  it('MenB unknown brand for a 2-year-old (no date) → invalid (≥10y category floor)', () => {
    // Every MenB product is ≥10y — a vaccine-category floor, not a brand penalty.
    const res = validate('MenB', [{}], 24);
    expect(res[0].status).toBe('invalid');
  });

  it('MenB unknown brand for a 30-year-old (no date) → unknown, counts', () => {
    const res = validate('MenB', [{}], 360);
    expect(res[0].status).toBe('unknown');
  });
});
