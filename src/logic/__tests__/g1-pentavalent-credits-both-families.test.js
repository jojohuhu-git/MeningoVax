// G1 (2026-09-16): one pentavalent dose is a dose of BOTH families.
//
// The gap, reproduced on the running app: Penbraya and Penmenvy appear in both
// history dropdowns, with nothing saying which one to use. Record a 17-year-old's
// Penbraya under MenACWY only and the app answers "MenB: Dose 1 of 2, optional
// today" — offering a shot the patient already had — and leaves the MenB antigen
// family open, so the family lock (R5.3) never engages. Record it under MenB only
// and the mirror-image happens: "MenACWY: Dose 1 of 1, catch-up, due today".
//
// Owner decision (2026-09-16): ONE entry in EITHER list credits BOTH families.
// The row stays where it was typed — editing or deleting it moves both halves —
// and each family numbers its own doses independently.
//
// Source, fetched live 2026-09-16:
//   CDC child/adolescent schedule notes (meningococcal):
//   "Children age 10 years or older may receive a single dose of Penbraya as an
//   alternative to separate administration of MenACWY and MenB when both vaccines
//   would be given on the same clinic day." and "if Penbraya is used for dose 1
//   MenB, MenB-FHbp (Trumenba) should be administered for dose 2 MenB."
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//   ACIP MMWR 2024;73(15) (Penbraya): a healthy adolescent given one pentavalent
//   dose "should complete the MenB series with a dose of MenB-FHbp 6 months after
//   the pentavalent vaccine dose was administered."
//   https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm
// Both sentences only make sense if the pentavalent dose IS dose 1 of the MenB
// series and a MenACWY dose at the same time.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { creditPentavalents, isPentavalentBrand } from '../pentavalentCredit.js';
import { TEST_TODAY } from '../../test-today.js';

const TODAY = TEST_TODAY;              // 2026-09-15
const SIX_MONTHS_AGO = '2026-03-15';
const AGE_17Y = 204;

const only = (arr) => { expect(arr).toHaveLength(1); return arr[0]; };

describe('creditPentavalents() — the merge itself', () => {
  it('recognises pentavalent brands by key or by full label, and nothing else', () => {
    expect(isPentavalentBrand('Penbraya')).toBe(true);
    expect(isPentavalentBrand('Penmenvy (MenABCWY)')).toBe(true);
    expect(isPentavalentBrand('Bexsero')).toBe(false);
    expect(isPentavalentBrand('Menveo 2-vial')).toBe(false);
    expect(isPentavalentBrand('')).toBe(false);
    expect(isPentavalentBrand(undefined)).toBe(false);
  });

  it('credits a MenACWY-recorded pentavalent to the MenB list, tagged with where it was typed', () => {
    const acwy = [{ date: SIX_MONTHS_AGO, brand: 'Penbraya' }];
    const { menacwy, menb } = creditPentavalents(acwy, []);
    expect(menacwy).toEqual(acwy);
    expect(menb).toEqual([{ date: SIX_MONTHS_AGO, brand: 'Penbraya', creditedFrom: 'MenACWY' }]);
  });

  it('credits a MenB-recorded pentavalent to the MenACWY list', () => {
    const { menacwy } = creditPentavalents([], [{ date: SIX_MONTHS_AGO, brand: 'Penmenvy' }]);
    expect(menacwy).toEqual([{ date: SIX_MONTHS_AGO, brand: 'Penmenvy', creditedFrom: 'MenB' }]);
  });

  it('does not double-count a pentavalent the user recorded in BOTH lists', () => {
    const d = [{ date: SIX_MONTHS_AGO, brand: 'Penbraya' }];
    const { menacwy, menb } = creditPentavalents(d, d);
    expect(menacwy).toHaveLength(1);
    expect(menb).toHaveLength(1);
    expect(menacwy[0].creditedFrom).toBeUndefined();
    expect(menb[0].creditedFrom).toBeUndefined();
  });

  it('credits the surplus when one list holds more of the same pentavalent than the other', () => {
    const acwy = [
      { date: '2025-09-15', brand: 'Penbraya' },
      { date: SIX_MONTHS_AGO, brand: 'Penbraya' },
    ];
    const menbList = [{ date: '2025-09-15', brand: 'Penbraya' }];
    const { menb } = creditPentavalents(acwy, menbList);
    expect(menb).toHaveLength(2);
    expect(menb.filter((d) => d.creditedFrom).map((d) => d.date)).toEqual([SIX_MONTHS_AGO]);
  });

  it('leaves lists without a pentavalent exactly as they were', () => {
    const acwy = [{ date: SIX_MONTHS_AGO, brand: 'Menveo 2-vial' }];
    const menbList = [{ date: SIX_MONTHS_AGO, brand: 'Bexsero' }];
    const merged = creditPentavalents(acwy, menbList);
    expect(merged.menacwy).toBe(acwy);
    expect(merged.menb).toBe(menbList);
  });
});

describe('G1: a pentavalent recorded under MenACWY alone still counts as a MenB dose', () => {
  const result = recommend({
    today: TODAY, ageMonths: AGE_17Y, riskIds: [],
    menacwyDoses: [{ date: SIX_MONTHS_AGO, brand: 'Penbraya' }],
    menbDoses: [],
  });

  it('MenB is dose 2 of 2 — not dose 1, which the patient already had', () => {
    const menb = only(result.menb);
    expect(menb.doseNum).toBe(2);
    expect(menb.seriesTotal).toBe(2);
  });

  it('the MenB antigen family is locked to FHbp by the Penbraya, so only Pfizer products are offered', () => {
    const menb = only(result.menb);
    expect(menb.family).toBe('FHbp');
    expect(menb.brands.join(' ')).toMatch(/Trumenba|Penbraya/);
    expect(menb.brands.join(' ')).not.toMatch(/Bexsero|Penmenvy/);
  });

  it('MenACWY still counts it too — the dose is not moved, it is shared', () => {
    expect(only(result.menacwy).status).toBe('complete');
  });

  it('the MenB record panel shows the shared dose, marked as recorded on the MenACWY step', () => {
    const perDose = result.history.MenB.perDose;
    expect(perDose).toHaveLength(1);
    expect(perDose[0].effectiveDoseNum).toBe(1);
    expect(result.history.MenB.sortedDoses[0].creditedFrom).toBe('MenACWY');
  });
});

describe('G1: a pentavalent recorded under MenB alone still counts as a MenACWY dose', () => {
  const result = recommend({
    today: TODAY, ageMonths: AGE_17Y, riskIds: [],
    menacwyDoses: [],
    menbDoses: [{ date: SIX_MONTHS_AGO, brand: 'Penmenvy' }],
  });

  it('MenACWY is not offered again as a catch-up dose the patient already had', () => {
    const acwy = only(result.menacwy);
    expect(acwy.status).toBe('complete');
    expect(acwy.dueToday).toBe(false);
  });

  it('the MenACWY record panel shows the shared dose, marked as recorded on the MenB step', () => {
    expect(result.history.MenACWY.sortedDoses[0].creditedFrom).toBe('MenB');
    expect(result.history.MenACWY.perDose[0].effectiveDoseNum).toBe(1);
  });
});

describe('G1: recording the same pentavalent in both lists is not two doses', () => {
  const d = [{ date: SIX_MONTHS_AGO, brand: 'Penbraya' }];
  const result = recommend({
    today: TODAY, ageMonths: AGE_17Y, riskIds: [], menacwyDoses: d, menbDoses: d,
  });

  it('MenB still reads dose 2 of 2 next — the series is not already complete', () => {
    const menb = only(result.menb);
    expect(menb.doseNum).toBe(2);
    expect(menb.seriesTotal).toBe(2);
  });

  it('each record panel lists the dose once', () => {
    expect(result.history.MenB.perDose).toHaveLength(1);
    expect(result.history.MenACWY.perDose).toHaveLength(1);
  });
});

describe('G1: the family lock spans the two lists', () => {
  // Penbraya (FHbp) recorded under MenACWY, then a Bexsero (4C) recorded under
  // MenB. Before G1 the MenB walk never saw the Penbraya, so the Bexsero looked
  // like a clean dose 1. It is a family mismatch and must be flagged.
  const result = recommend({
    today: TODAY, ageMonths: AGE_17Y, riskIds: [],
    menacwyDoses: [{ date: SIX_MONTHS_AGO, brand: 'Penbraya' }],
    menbDoses: [{ date: '2026-09-14', brand: 'Bexsero' }],
  });

  it('the Bexsero is flagged invalid for crossing antigen families', () => {
    const perDose = result.history.MenB.perDose;
    expect(perDose).toHaveLength(2);
    expect(perDose[1].status).toBe('invalid');
    expect(perDose[1].reasons.join(' ')).toMatch(/famil/i);
  });
});
