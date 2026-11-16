// N1 (port Phase 0 finding, owner ruling 2026-11-15): Penmenvy is not offered
// again within 6 months of a Penmenvy dose — the same rule Penbraya already had.
//
// SOURCE, read live 2026-11-15. ACIP, Penmenvy MMWR (mm7501a2, Jan 8 2026):
//
//   "Persons at increased risk for meningococcal disease who receive a dose of
//    MenACWY-CRM/MenB-4C and who are recommended to receive additional doses of
//    MenACWY and MenB <6 months after a dose of pentavalent meningococcal
//    vaccine should receive separate MenACWY and MenB-4C vaccines, rather than
//    MenACWY-CRM/MenB-4C."
//
// https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm
//
// The app had the rule for Penbraya only (P1-4, 2026-09-17), because the CDC
// schedule notes page it was built from states it for Penbraya and never names
// Penmenvy. That page predates the Penmenvy recommendation; it was silent, not
// in disagreement. The owner chose to follow the MMWR (2026-11-15).
//
// Reproduced before the fix: asplenia, 17 years, Penmenvy two months ago — the
// pentavalent card offered Penmenvy again.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-09-15'; // TEST_TODAY
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

const run = ({ ageMonths = 205, riskIds = ['asplenia'], menbDoses = [], menacwyDoses = [] }) => recommend({
  today: TODAY, ageMonths, riskIds, menacwyDoses, menbDoses,
  riskAtDoseAnswers: { MenB: allYes(4), MenACWY: allYes(4) },
});

describe('N1: Penmenvy may not be repeated within 6 months', () => {
  const recent = { menbDoses: [{ date: '2026-07-15', brand: 'Penmenvy (MenABCWY)' }] };

  it('both vaccines are due today, so the question is real', () => {
    const r = run(recent);
    expect(r.menacwy[0].dueToday).toBe(true);
    expect(r.menb[0].dueToday).toBe(true);
  });

  it('the pentavalent option is withheld two months after a Penmenvy dose', () => {
    expect(run(recent).pentavalent.eligible).toBe(false);
  });

  it('and the card says why, naming Penmenvy', () => {
    expect(run(recent).pentavalent.unavailableReason).toBe(
      'A combined pentavalent shot is not an option today: Penmenvy may only be repeated once 6 months have passed since the last Penmenvy dose.',
    );
  });

  it('the separate MenB card is unaffected: Bexsero is still offered, due today', () => {
    const c = run(recent).menb[0];
    expect(c.dueToday).toBe(true);
    expect(c.brands).toEqual(['Bexsero (MenB)']);
  });

  it('a Penmenvy recorded on the MenACWY step counts too', () => {
    const r = run({ menacwyDoses: [{ date: '2026-07-15', brand: 'Penmenvy (MenABCWY)' }] });
    expect(r.pentavalent.eligible).toBe(false);
  });

  it('control: at exactly 6 months Penmenvy is offered again', () => {
    const r = run({ menbDoses: [{ date: '2026-03-15', brand: 'Penmenvy (MenABCWY)' }] });
    expect(r.pentavalent.eligible).toBe(true);
    expect(r.pentavalent.brands).toEqual(['Penmenvy (MenABCWY)']);
  });

  it('control: Penbraya keeps its own wording, unchanged', () => {
    const r = run({ menbDoses: [{ date: '2026-07-15', brand: 'Penbraya (MenABCWY)' }] });
    expect(r.pentavalent.unavailableReason).toBe(
      'A combined pentavalent shot is not an option today: Penbraya may only be repeated once 6 months have passed since the last Penbraya dose.',
    );
  });
});
