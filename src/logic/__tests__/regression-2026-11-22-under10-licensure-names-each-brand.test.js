// Phase 8, handoff item 2 after item 7 (citation only; owner Q12, 2026-11-21:
// decide alone when the dose is unchanged). A healthy child under 10 gets a
// "Not indicated" MenB card that says "MenB vaccines (Bexsero, Trumenba,
// Penmenvy, Penbraya) are FDA-licensed from age 10 years [c]". That [c] cited
// ACIP 2020's "MenB vaccines are licensed in the United States only for persons
// aged 10–25 years", written before either pentavalent vaccine existed.
//
// Now the line cites two sentences that between them name all four brands:
// - ACIP Oct 2024 (mm7349a3, already in refs.js, read live 2026-11-22):
//   Trumenba, Bexsero and Penbraya "are currently licensed for use in persons
//   aged 10–25 years in the United States".
// - ACIP 2025 (mm7501a2, read live 2026-11-22): "On February 14, 2025, a
//   second pentavalent meningococcal vaccine (MenACWY-CRM/MenB-4C [Penmenvy,
//   GSK]) was licensed for use in persons aged 10–25 years".
//
// No dose, date, verdict or sentence moves; only which sentence a source
// number points at.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS as REFS } from '../../data/refs.js';

const TODAY = '2026-11-22';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const keys = (list) => (list ?? []).map((c) => c.key);

describe('Under-10 "Not indicated" MenB card: the licensure line cites a sentence for every brand it names', () => {
  it('healthy 8-year-old: the licensure line cites ACIP 2024 and the 2025 Penmenvy report', () => {
    const c = run({ dob: '2018-06-01' }).menb[0];
    expect(c.doseLabel).toBe('Not indicated');
    expect(c.note.detail).toContain('MenB vaccines (Bexsero, Trumenba, Penmenvy, Penbraya) are FDA-licensed from age 10 years [c][c].');
    expect(keys(c.noteCites)).toEqual(['menbLicensedAge1025Acip2024', 'penmenvyLicensedAge1025', 'acip2020MenbRiskGroups']);
  });

  it('the two sentences between them name all four brands the line lists', () => {
    const quoted = `${REFS.menbLicensedAge1025Acip2024.quote} ${REFS.penmenvyLicensedAge1025.quote}`;
    for (const brand of ['Bexsero', 'Trumenba', 'Penbraya', 'Penmenvy']) expect(quoted).toContain(brand);
    expect(REFS.penmenvyLicensedAge1025.url).toBe('https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm');
  });

  it('control: a Bexsero "Minimum age not met" line still cites ACIP 2020\'s licensure sentence', () => {
    const r = run({ dob: '2018-06-01', menbDoses: [{ brand: 'Bexsero (MenB)', date: '2026-10-01' }] });
    const v = r.history.MenB.perDose[0];
    expect(keys(v.reasonCites)).toContain('menbLicensedAge1025');
  });
});
