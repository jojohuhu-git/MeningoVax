// Regression tests for MeningoVax fixes D2, D5, D6, D7.
//
// D2: 17–21y catch-up — no dose at ≥16y → catchup status, not 'not-indicated'.
// D5: 7–11m and 12–23m high-risk D2 interval corrected to ≥12 weeks (was ≥8 weeks).
//     Plus ≥12m age floor for the 7–11m D2.
// D6: 3-dose shortcut when high-risk infant D2 was given at ≥7m.
// D7: Menveo brand labels — 2-vial (≥2m) vs 1-vial (≥10y) in brands.js and recommend.js.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { MENACWY_BRANDS } from '../../data/brands.js';

const TODAY = '2026-06-05';
function run(input) {
  return recommend({ today: TODAY, ...input });
}
const acwy = (r) => r.menacwy[0];

// ── D2: 17–21y catch-up rule ─────────────────────────────────────────────────

describe('D2: 17–21y MenACWY catch-up — no dose at ≥16y → catchup (not not-indicated)', () => {
  it('19y (228m), no doses, no risk → catchup', () => {
    const r = run({ ageMonths: 228, riskIds: [] });
    expect(acwy(r).status).toBe('catchup');
    expect(acwy(r).doseNum).toBe(1);
  });

  it('20y (240m), no doses, no risk → catchup', () => {
    const r = run({ ageMonths: 240, riskIds: [] });
    expect(acwy(r).status).toBe('catchup');
  });

  it('21y (252m), no doses, no risk → catchup', () => {
    const r = run({ ageMonths: 252, riskIds: [] });
    expect(acwy(r).status).toBe('catchup');
  });

  it('catch-up rec note mentions college/residence halls', () => {
    const r = run({ ageMonths: 228, riskIds: [] });
    expect(acwy(r).note).toMatch(/college|residence/i);
  });

  it('note says no booster when given at ≥16y', () => {
    const r = run({ ageMonths: 228, riskIds: [] });
    expect(acwy(r).note).toMatch(/no booster|booster.*not|not.*booster/i);
  });

  it('≥22y (264m), no doses, no risk → not-indicated', () => {
    const r = run({ ageMonths: 264, riskIds: [] });
    expect(acwy(r).status).toBe('not-indicated');
  });

  it('19y with a ≥16y dose → complete', () => {
    const r = run({ ageMonths: 228, riskIds: [], menacwyDoses: [{ date: '2023-06-05', ageMonths: 192 }] });
    expect(acwy(r).status).toBe('complete');
  });
});

// ── D5: High-risk infant D2 interval correction ──────────────────────────────

describe('D5: 7–11m and 12–23m high-risk D2 interval ≥12 weeks (was ≥8 weeks)', () => {
  it('7–11m start: D1 rec has minIntervalDays 84 (12 weeks)', () => {
    const r = run({ ageMonths: 8, riskIds: ['asplenia'] });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).minIntervalDays).toBe(84);
  });

  it('7–11m start: note mentions ≥12 weeks AND ≥12 months', () => {
    const r = run({ ageMonths: 8, riskIds: ['asplenia'] });
    expect(acwy(r).note).toMatch(/12 weeks/i);
    expect(acwy(r).note).toMatch(/12 months|12 month/i);
  });

  it('12–23m start: D1 rec has minIntervalDays 84 (12 weeks)', () => {
    const r = run({ ageMonths: 14, riskIds: ['asplenia'] });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).minIntervalDays).toBe(84);
  });

  it('12–23m start: note mentions ≥12 weeks', () => {
    const r = run({ ageMonths: 14, riskIds: ['asplenia'] });
    expect(acwy(r).note).toMatch(/12 weeks/i);
  });

  it('2–6m start primary series remains at 4 weeks (unchanged)', () => {
    const r = run({ ageMonths: 3, riskIds: ['asplenia'] });
    expect(acwy(r).minIntervalDays).toBe(DAYS_WEEKS_4);
  });
});

const DAYS_WEEKS_4 = 4 * 7; // 28

// ── D6: 3-dose shortcut ──────────────────────────────────────────────────────

describe('D6: 3-dose shortcut when high-risk infant D2 at ≥7m', () => {
  it('D1 at 3m, D2 at 7.5m → D3 is the completing dose, labeled "3 of 3"', () => {
    // D1 at ageMonths 3, D2 at ageMonths 7.5
    const r = run({
      ageMonths: 13,
      riskIds: ['asplenia'],
      menacwyDoses: [
        { ageMonths: 3 },   // D1 at 3m (in 2–6m range)
        { ageMonths: 7.5 }, // D2 at 7.5m (≥7m → 3-dose shortcut)
      ],
    });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseLabel).toMatch(/3 of 3|3-dose/i);
    expect(acwy(r).note).toMatch(/3 doses|shortcut|D6/i);
  });

  it('D1 at 3m, D2 at 4m (NOT ≥7m) → D3 is NOT the completing dose (standard 4-dose path)', () => {
    const r = run({
      ageMonths: 13,
      riskIds: ['asplenia'],
      menacwyDoses: [
        { ageMonths: 3 },
        { ageMonths: 4 }, // D2 at 4m — NOT ≥7m
      ],
    });
    expect(acwy(r).status).toBe('risk-based');
    // Standard path — should NOT be "3 of 3"
    expect(acwy(r).doseLabel).not.toMatch(/3 of 3/i);
  });

  it('D1 unknown, D2 unknown → conservative 4-dose path', () => {
    // No ageMonths or date → ageAtDose returns null → conservative path
    const r = run({
      ageMonths: 14,
      riskIds: ['asplenia'],
      menacwyDoses: [{}, {}], // no date or ageMonths
    });
    // Should fall back to standard path (not 3-dose shortcut)
    if (acwy(r)) {
      expect(acwy(r).doseLabel).not.toMatch(/3 of 3/i);
    }
  });
});

// ── D7: Menveo brand-label 2-vial vs 1-vial ─────────────────────────────────

describe('D7: Menveo brand labels — 2-vial (≥2m) vs 1-vial (≥10y)', () => {
  it('MENACWY_BRANDS includes a 2-vial entry with minAgeM = 2', () => {
    const twoVial = MENACWY_BRANDS.find(b => b.key === 'Menveo 2-vial');
    expect(twoVial).toBeDefined();
    expect(twoVial.minAgeM).toBe(2);
  });

  it('MENACWY_BRANDS includes a 1-vial entry with minAgeM = 120', () => {
    const oneVial = MENACWY_BRANDS.find(b => b.key === 'Menveo 1-vial');
    expect(oneVial).toBeDefined();
    expect(oneVial.minAgeM).toBe(120);
  });

  it('Infant rec (7m) → brands contain "2-vial"', () => {
    const r = run({ ageMonths: 7, riskIds: ['asplenia'] });
    expect(acwy(r).brands.some(b => b.includes('2-vial'))).toBe(true);
  });

  it('Infant rec (7m) → brands do NOT contain "1-vial"', () => {
    const r = run({ ageMonths: 7, riskIds: ['asplenia'] });
    expect(acwy(r).brands.every(b => !b.includes('1-vial'))).toBe(true);
  });

  it('Adult rec (25y) → brands contain both 2-vial and 1-vial', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'] });
    expect(acwy(r).brands.some(b => b.includes('2-vial'))).toBe(true);
    expect(acwy(r).brands.some(b => b.includes('1-vial'))).toBe(true);
  });

  it('Validation: legacy "Menveo" brand is still recognized (backward compat)', async () => {
    const { analyzeHistory } = await import('../validate.js');
    // A past dose recorded as 'Menveo (MenACWY)' should still validate correctly
    const doses = [{ date: '2016-01-01', brand: 'Menveo (MenACWY)' }];
    const result = analyzeHistory('MenACWY', doses, 240, [], TODAY);
    // Should not be flagged as invalid due to brand age
    const perDose = result.perDose[0];
    expect(perDose.status).toBe('valid');
  });
});
