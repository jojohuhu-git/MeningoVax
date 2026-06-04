// Regression guard: the MenB minimum age (≥10y / 120 months) must be enforced on
// EVERY dose, including the MenB component of pentavalents (Penbraya/Penmenvy) — not
// just the first dose. This mirrors a bug that existed in the sibling PediVax/vaxapp
// engine (where the vaccine-level min-age was only checked on dose 1, so later
// pentavalent MenB doses below 10y slipped through). MeningoVax validates each dose
// against its brand's minAgeM from ALL_BRANDS, so all three doses below are flagged.
//
// Source: ACIP 2020 MMWR RR-9 — MenB licensed ≥10y for all products (Bexsero,
// Trumenba, Penbraya, Penmenvy).
import { describe, it, expect } from 'vitest';
import { validateHistory } from '../validate.js';

const TODAY = '2026-06-03';
const dose = (iso, brand) => ({ date: iso, brand });

describe('Pentavalent MenB min-age (≥10y) enforced on every dose', () => {
  // All three MenB doses given around age 5 (well below the 10y minimum).
  const doses = [
    dose('2024-06-01', 'Penmenvy (MenABCWY)'),
    dose('2024-07-15', 'Penbraya (MenABCWY)'),
    dose('2024-08-20', 'Bexsero (MenB)'),
  ];
  // Patient ~6y "today" → each dose lands at ~5y.
  const results = validateHistory('MenB', doses, 72, [], TODAY);

  it('flags ALL THREE under-age MenB doses as invalid (not just dose 1)', () => {
    expect(results.map(r => r.status)).toEqual(['invalid', 'invalid', 'invalid']);
  });

  it('the Penbraya (D2) and Penmenvy (D1) pentavalents are each flagged for the 10-year minimum', () => {
    expect(results[0].reasons.join(' ')).toMatch(/Penmenvy/);
    expect(results[0].reasons.join(' ')).toMatch(/10 years|120 months/);
    expect(results[1].reasons.join(' ')).toMatch(/Penbraya/);
    expect(results[1].reasons.join(' ')).toMatch(/10 years|120 months/);
  });

  it('a MenB dose at ≥10y is NOT flagged for min age', () => {
    // 14-year-old (168m); dose at ~13y.
    const ok = validateHistory('MenB', [dose('2024-06-01', 'Bexsero (MenB)')], 168, [], TODAY);
    expect(ok[0].status).not.toBe('invalid');
  });
});
