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

  it('MenQuadfi for a 1-month-old (no date) → invalid (min 6 weeks, M2 2026-09-22)', () => {
    // M2 dropped MenQuadfi's floor from 24 months to 6 weeks, so a
    // 12-month-old dateless dose (the old fixture) is comfortably valid now
    // — a 1-month-old is the case that still clears "below minimum".
    const res = validate('MenACWY', [{ brand: 'MenQuadfi (MenACWY)' }], 1);
    expect(res[0].status).toBe('invalid');
    expect(res[0].reasons[0]).toMatch(/minimum age of 6 weeks/);
  });
});

// ── Current age clears the minimum: STOP C C1 (owner, 2026-11-15) ─────────
// Before C1 these counted ("unknown"). Now an undated dose never counts: it is
// a record problem, "No date recorded — not counted". The min-age rows above
// still win where the brand rules the dose out, because they say more.
describe('Dateless dose where current age clears the minimum → not counted (C1)', () => {
  it('Penbraya for a 30-year-old (no date) → not counted', () => {
    const { perDose, effective } = analyze('MenB', [{ brand: 'Penbraya (MenABCWY)' }], 360);
    expect(perDose[0].recordProblem).toBe('undated');
    expect(effective).toHaveLength(0);
  });

  it('MenQuadfi for a 20-year-old (no date) → not counted', () => {
    const res = validate('MenACWY', [{ brand: 'MenQuadfi (MenACWY)' }], 240);
    expect(res[0].recordProblem).toBe('undated');
  });
});

// K1 (2026-09-24): `detailsUnknown` is the clinician's "a dose was given,
// but I have no date or brand for it" tick. A row with nothing in it at all
// is now an untouched row, not a dose, so these fixtures say which they mean.
const undatedDose = () => ({ detailsUnknown: true });

// ── Unknown brand → no brand-specific flag (ACIP: any brand acceptable) ─────
describe('Dateless dose with unknown brand', () => {
  it('MenACWY unknown brand for a 2-year-old (no date) → not counted (C1), no brand flag', () => {
    const res = validate('MenACWY', [undatedDose()], 24);
    expect(res[0].recordProblem).toBe('undated');
  });

  it('MenACWY unknown brand for a 6-month-old (no date) → not counted (C1)', () => {
    const res = validate('MenACWY', [undatedDose()], 6);
    expect(res[0].recordProblem).toBe('undated');
  });

  it('MenB unknown brand for a 2-year-old (no date) → invalid (≥10y category floor)', () => {
    // Every MenB product is ≥10y — a vaccine-category floor, not a brand penalty.
    const res = validate('MenB', [undatedDose()], 24);
    expect(res[0].status).toBe('invalid');
  });

  it('MenB unknown brand for a 30-year-old (no date) → not counted (C1)', () => {
    const res = validate('MenB', [undatedDose()], 360);
    expect(res[0].recordProblem).toBe('undated');
  });
});
