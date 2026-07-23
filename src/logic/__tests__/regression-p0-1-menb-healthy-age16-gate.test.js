// Regression tests for fix-2026-07-23 audit queue item P0-1.
//
// Bug: for a patient with NO current MenB risk factor, validateOneMenB checked a
// MenB dose only against the product minimum age of 120 months (10y) — the floor
// every product shares. It had no gate for the healthy recommendation age (16y).
// So a MenB dose given to a healthy patient before 16 counted as "effective dose 1."
//
// Two harms from one gap:
//   (a) Display contradiction: a healthy 11yo with a dose at age 10 showed that dose
//       as a valid, on-time "effective dose 1" while the recommendation said MenB was
//       "not routinely indicated" — the two surfaces disagreed.
//   (b) Under-vaccination: a healthy 16yo with a dose at age 10 was told "Dose 2 of 2"
//       (only one more shot) when the age-10 dose has no protective value at 16 and a
//       fresh 2-dose series is needed.
//
// Owner decision (2026-07-23): Option 1 — a MenB dose given before age 16 to a
// currently-healthy patient is valid-age but does NOT count toward the healthy
// 2-dose series (mirrors MenACWY's pre-age-10 `notAdolescentCount` handling).
//
// Source (ACIP 2020 MMWR RR-9, https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/):
// healthy MenB is a 2-dose series at 16–23y (preferred 16–18); antibody titers
// "wane substantially by 1 year postvaccination" — a dose at 10 is not protective at 16.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';

const menb = (r) => r.menb[0];

describe('P0-1: healthy MenB dose before age 16 does not count toward the healthy series', () => {
  it('(b) healthy 16yo with a dose at age 10 → fresh Dose 1 of 2, NOT Dose 2 of 2', () => {
    const r = recommend({
      today: '2026-07-23',
      ageMonths: 192, // 16y0m
      riskIds: [],
      menbDoses: [{ date: '2020-07-23', brand: 'Bexsero (MenB)' }], // given at age 10
    });
    expect(menb(r).status).toBe('shared-decision');
    expect(menb(r).doseLabel).toMatch(/Dose 1 of 2/);
    expect(menb(r).doseLabel).not.toMatch(/Dose 2/);
  });

  it('(b) analyzeHistory: the age-10 dose is valid but does not count (healthy 16yo)', () => {
    const perDose = analyzeHistory(
      'MenB',
      [{ date: '2020-07-23', brand: 'Bexsero (MenB)' }],
      192,
      [],
      '2026-07-23'
    ).perDose;
    expect(perDose[0].status).toBe('valid');
    expect(perDose[0].notAdolescentCount).toBe(true);
    expect(perDose[0].effectiveDoseNum).toBeNull();
    expect(perDose[0].reasons.join(' ')).toMatch(/before age 16.*does not count/i);
    // Must NOT be mislabeled as an invalid / below-minimum-age dose (it was validly given).
    expect(perDose[0].reasons.join(' ')).not.toMatch(/invalid.*below.*minimum age/i);
  });

  it('(a) healthy 11yo with a dose at age 10 → surfaces agree: dose does not count, MenB not indicated', () => {
    const r = recommend({
      today: '2026-07-23',
      ageMonths: 132, // 11y0m
      riskIds: [],
      menbDoses: [{ date: '2025-07-23', brand: 'Bexsero (MenB)' }], // given at age 10
    });
    expect(menb(r).status).toBe('not-indicated');

    const perDose = analyzeHistory(
      'MenB',
      [{ date: '2025-07-23', brand: 'Bexsero (MenB)' }],
      132,
      [],
      '2026-07-23'
    ).perDose;
    expect(perDose[0].notAdolescentCount).toBe(true);
    expect(perDose[0].effectiveDoseNum).toBeNull();
  });

  // ── Guards against over-fix ────────────────────────────────────────────────
  it('guard: high-risk (asplenia) 16yo with a dose at age 10 → still counts (Dose 2 of 3)', () => {
    const r = recommend({
      today: '2026-07-23',
      ageMonths: 192,
      riskIds: ['asplenia'],
      menbDoses: [{ date: '2020-07-23', brand: 'Bexsero (MenB)' }],
    });
    expect(r.menb[0].doseLabel).toMatch(/Dose 2 of 3/);

    const perDose = analyzeHistory(
      'MenB',
      [{ date: '2020-07-23', brand: 'Bexsero (MenB)' }],
      192,
      ['asplenia'],
      '2026-07-23'
    ).perDose;
    expect(perDose[0].notAdolescentCount).toBeFalsy();
    expect(perDose[0].effectiveDoseNum).toBe(1);
  });

  it('guard: healthy 20yo with a dose given AT age 16 → still counts (Dose 2 of 2)', () => {
    const r = recommend({
      today: '2026-07-23',
      ageMonths: 240, // 20y
      riskIds: [],
      menbDoses: [{ date: '2022-07-23', brand: 'Bexsero (MenB)' }], // given at age 16
    });
    expect(menb(r).doseLabel).toMatch(/Dose 2 of 2/);
  });
});
