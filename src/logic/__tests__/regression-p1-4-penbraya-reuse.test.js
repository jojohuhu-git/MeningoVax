// P1-4 (fix queue 2026-09-17): Penbraya's re-use rules.
//
// The queue flagged this as "needs confirmation before coding" — the evidence
// was a grep, not a wrong card, and it said to reproduce first and downgrade to
// a copy fix if the antigen-family lock already produced the right answer.
// Reproduced 2026-09-17. It splits into two halves with OPPOSITE verdicts.
//
// SOURCE, fetched live 2026-09-17. CDC child & adolescent immunization schedule
// notes, MenB, Special situations. Verbatim:
//
//   "For age-eligible children not at increased risk, if Penbraya is used for
//    dose 1 MenB, MenB-FHbp (Trumenba) should be administered for dose 2 MenB."
//
//   "For age-eligible children at increased risk..., Penbraya may be used for
//    additional MenACWY and MenB doses (including booster doses) if both would
//    be given on the same clinic day and at least 6 months have elapsed since
//    most recent Penbraya dose."
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// HALF A — "use Trumenba for dose 2" — ALREADY CORRECT. No code changed.
//
// The antigen-family lock already answers this: a Penbraya dose sets the family
// to FHbp, and the MenB card then offers Trumenba and nothing else. Reproduced:
// healthy patient, Penbraya as MenB dose 1, card reads "Dose 2 of 2 (FHbp)"
// with brands ["Trumenba (MenB)"] — exactly what CDC asks for.
//
// The pentavalent card cannot reintroduce Penbraya for such a patient either,
// and for a reason worth recording: G1 credits a pentavalent to BOTH families,
// so the Penbraya dose also satisfies the routine MenACWY series. MenACWY is
// then never due again, and the pentavalent card only appears when MenACWY and
// MenB are both due. The tests below pin that chain, because it is the thing
// that makes half A safe — if G1's crediting were ever narrowed, this half
// would silently become a real defect.
//
// HALF B — the 6-month re-use interval — A REAL DEFECT, now fixed.
//
// Reproduced: asplenia, age 196 months, Penbraya on 2026-07-15 (two months
// before TEST_TODAY). The pentavalent card came back eligible and offered
// Penbraya again:
//
//   pentavalent: eligible true, brands ["Penbraya (MenABCWY)"]
//
// CDC requires at least 6 months since the most recent Penbraya dose.
//
// SCOPED TO PENBRAYA ON PURPOSE. The CDC page states this for Penbraya
// (Pfizer) and says nothing of the kind about Penmenvy — it does not mention
// Penmenvy anywhere. Verified by fetching the page and asking directly. The
// asymmetry is sourced, not an oversight; do not mirror the rule onto Penmenvy
// without a source.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-09-15'; // TEST_TODAY
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

const run = ({ ageMonths, riskIds = [], menbDoses = [], menacwyDoses = [] }) => recommend({
  today: TODAY, ageMonths, riskIds, menacwyDoses, menbDoses,
  riskAtDoseAnswers: { MenB: allYes(4), MenACWY: allYes(4) },
});

describe('P1-4 half A: Penbraya dose 1 leads to Trumenba, via the family lock', () => {
  // DOB 2008-05-15 -> 220 months. Penbraya well after the 16th birthday.
  const healthyWithPenbraya = {
    ageMonths: 220,
    menbDoses: [{ date: '2025-01-15', brand: 'Penbraya (MenABCWY)' }],
  };

  it('the MenB card offers Trumenba and nothing else', () => {
    const c = run(healthyWithPenbraya).menb[0];
    expect(c.brands).toEqual(['Trumenba (MenB)']);
  });

  it('it never offers Bexsero or Penmenvy (the other antigen family)', () => {
    const c = run(healthyWithPenbraya).menb[0];
    expect(c.brands.join(' ')).not.toMatch(/bexsero|penmenvy/i);
  });

  // This is the chain that makes half A safe rather than lucky.
  it('the Penbraya dose also completes MenACWY, so no pentavalent card returns', () => {
    const r = run(healthyWithPenbraya);
    expect(r.menacwy[0].status).toBe('complete');
    expect(r.pentavalent.eligible).toBe(false);
  });
});

describe('P1-4 half B: Penbraya may not be repeated within 6 months', () => {
  // Asplenia, 196 months. A Penbraya two months ago.
  const recent = {
    ageMonths: 196, riskIds: ['asplenia'],
    menbDoses: [{ date: '2026-07-15', brand: 'Penbraya (MenABCWY)' }],
  };

  it('the pentavalent option is withheld two months after a Penbraya dose', () => {
    expect(run(recent).pentavalent.eligible).toBe(false);
  });

  it('and the card says why, instead of dropping the option silently', () => {
    expect(run(recent).pentavalent.unavailableReason).toMatch(/6 months/);
  });

  it('the separate MenB card is unaffected — Trumenba is still offered', () => {
    // Withholding the COMBINED shot must not withhold the vaccine itself.
    const c = run(recent).menb[0];
    expect(c.dueToday).toBe(true);
    expect(c.brands).toEqual(['Trumenba (MenB)']);
  });

  it('at exactly 6 months the pentavalent is available again', () => {
    const r = run({
      ageMonths: 196, riskIds: ['asplenia'],
      menbDoses: [{ date: '2026-03-15', brand: 'Penbraya (MenABCWY)' }],
    });
    expect(r.pentavalent.eligible).toBe(true);
    expect(r.pentavalent.brands).toEqual(['Penbraya (MenABCWY)']);
  });

  it('a Penbraya recorded on the MenACWY step counts too (G1)', () => {
    // The injection is the same one whichever list it was typed on, so the
    // 6-month clock must read the credited history, not one raw list.
    const r = run({
      ageMonths: 196, riskIds: ['asplenia'],
      menacwyDoses: [{ date: '2026-07-15', brand: 'Penbraya (MenABCWY)' }],
    });
    expect(r.pentavalent.eligible).toBe(false);
  });
});

describe('P1-4: Penmenvy is deliberately untouched', () => {
  it('a recent Penmenvy dose does not withhold the pentavalent option', () => {
    // CDC states the 6-month rule for Penbraya and does not mention Penmenvy at
    // all. Inventing a matching rule would be guessing at a clinical interval.
    const r = run({
      ageMonths: 196, riskIds: ['asplenia'],
      menbDoses: [{ date: '2026-07-15', brand: 'Penmenvy (MenABCWY)' }],
    });
    expect(r.pentavalent.eligible).toBe(true);
    expect(r.pentavalent.brands).toEqual(['Penmenvy (MenABCWY)']);
  });
});
