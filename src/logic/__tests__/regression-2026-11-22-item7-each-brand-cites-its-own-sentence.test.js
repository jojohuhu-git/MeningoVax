// Phase 8, item 7 (citation only; owner Q12, 2026-11-21: decide alone when the
// dose is unchanged). Two kinds of card cited a sentence written for a
// different product:
//
// 1. The MenB schedule lines (high-risk doses 1, 2 and 3; the healthy dose 1)
//    cited ACIP Oct 2024's MenB-4C (Bexsero) sentence for every brand. The same
//    report (mm7349a3, read live 2026-11-22) states the same schedules for
//    MenB-FHbp (Trumenba) in its Introduction: "ACIP recommends MenB-FHbp
//    vaccine as a 2-dose series (at intervals of 0 and 6 months) for
//    adolescents and young adults and a 3-dose series (at 0, 1–2, and 6 months)
//    for those at increased risk". Same doses, same intervals. Now a Bexsero
//    (or Penmenvy) series cites the MenB-4C sentence, a Trumenba (or Penbraya)
//    series the MenB-FHbp sentence, and a card with no product yet cites both.
//
// 2. A MenB "Minimum age not met" line cited ACIP 2020's "MenB vaccines are
//    licensed ... only for persons aged 10–25 years" for every brand. That
//    sentence was written before Penbraya and Penmenvy existed. The MenB lines
//    now cite, for those two, the sentences the owner chose for the same
//    brands' MenACWY lines (C11, 2026-11-21): CDC's MenB minimum-age line,
//    which names Penbraya, and ACIP's "Persons aged ≥10 years ..." for
//    Penmenvy. Bexsero and Trumenba keep ACIP 2020's.
//
// No dose, date or verdict moves; only which sentence a source number points at.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-22';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const keys = (list) => (list ?? []).map((c) => c.key);
const noteText = (c) => `${c.note.lead} ${c.note.detail}`;
const marks = (c) => (noteText(c).match(/\[c\]/g) ?? []).length;

describe('Item 7: a MenB schedule line cites the sentence for the patient\'s own product', () => {
  const asplenia17 = { dob: '2009-06-01', riskIds: ['asplenia'] };

  it('asplenia, 17, no MenB yet: dose 1 cites the MenB-4C and the MenB-FHbp sentence', () => {
    const c = run(asplenia17).menb[0];
    expect(c.doseLabel).toBe('Dose 1 of 3 (high-risk series)');
    expect(noteText(c)).toContain('A three-dose MenB series at 0, 1–2 and 6 months [c][c].');
    expect(keys(c.noteCites)).toEqual(['menbHighRisk3DoseSchedule', 'menbFhbpSchedules']);
  });

  it('asplenia, 17, Trumenba 1 Oct 2026: dose 2 cites the MenB-FHbp sentence', () => {
    const c = run({ ...asplenia17, menbDoses: [{ brand: 'Trumenba (MenB)', date: '2026-10-01' }] }).menb[0];
    expect(c.doseLabel).toBe('Dose 2 of 3 (high-risk, Trumenba)');
    // C11 (2026-11-26): "(minimum 4 weeks)" cites ACIP 2020's 4 weeks first.
    expect(keys(c.noteCites)).toEqual(['acip2020MenbRepeat4Weeks', 'menbFhbpSchedules']);
    expect(marks(c)).toBe(2);
  });

  it('asplenia, 17, Penbraya 1 Oct 2026 (a MenB-FHbp vaccine): dose 2 cites the MenB-FHbp sentence', () => {
    const c = run({ ...asplenia17, menbDoses: [{ brand: 'Penbraya', date: '2026-10-01' }] }).menb[0];
    expect(c.doseLabel).toBe('Dose 2 of 3 (high-risk, Trumenba)');
    expect(keys(c.noteCites)).toEqual(['acip2020MenbRepeat4Weeks', 'menbFhbpSchedules']);
  });

  it('asplenia, 17, Trumenba 1 Mar and 1 Apr 2026: dose 3 cites the MenB-FHbp sentence', () => {
    const c = run({ ...asplenia17, menbDoses: [
      { brand: 'Trumenba (MenB)', date: '2026-03-01' }, { brand: 'Trumenba (MenB)', date: '2026-04-01' }] }).menb[0];
    expect(c.doseLabel).toBe('Dose 3 of 3 (high-risk, Trumenba)');
    // C11 (2026-11-26): "at least 4 months after dose 2" cites ACIP Oct 2024's
    // "<4 months … repeated" sentence; the schedule keeps "6 months after dose 1".
    expect(keys(c.noteCites)).toEqual(['menbFhbpSchedules', 'menbHighRiskEarlyD3Unless']);
    expect(marks(c)).toBe(2);
  });

  it('control: asplenia, 17, Bexsero 1 Oct 2026: dose 2 still cites the MenB-4C sentence', () => {
    const c = run({ ...asplenia17, menbDoses: [{ brand: 'Bexsero (MenB)', date: '2026-10-01' }] }).menb[0];
    expect(c.doseLabel).toBe('Dose 2 of 3 (high-risk, Bexsero)');
    expect(keys(c.noteCites)).toEqual(['acip2020MenbRepeat4Weeks', 'menbHighRisk3DoseSchedule']);
  });

  it('control: asplenia, 17, Bexsero 1 Mar and 1 Apr 2026: dose 3 still cites the MenB-4C sentence', () => {
    const c = run({ ...asplenia17, menbDoses: [
      { brand: 'Bexsero (MenB)', date: '2026-03-01' }, { brand: 'Bexsero (MenB)', date: '2026-04-01' }] }).menb[0];
    expect(keys(c.noteCites)).toEqual(['menbHighRisk3DoseSchedule', 'menbHighRiskEarlyD3Unless']);
  });

  it('healthy 17, no MenB yet: dose 1 cites both 0-and-6-month sentences, then the preferred age', () => {
    const c = run({ dob: '2009-06-01' }).menb[0];
    expect(c.doseLabel).toBe('Dose 1 of 2 (shared clinical decision)');
    expect(noteText(c)).toContain('Two MenB doses 6 months apart, by shared clinical decision-making [c][c].');
    expect(keys(c.noteCites)).toEqual(['menbHealthy2Dose0and6', 'menbFhbpSchedules', 'menbHealthyPreferredAge1618']);
  });

  it('the dose recommendation itself is unchanged by the citation (Trumenba dose 2 due 1 Nov 2026)', () => {
    const c = run({ ...asplenia17, menbDoses: [{ brand: 'Trumenba (MenB)', date: '2026-10-01' }] }).menb[0];
    expect(c.dueToday).toBe(true);
    expect(c.brands).toEqual(['Trumenba (MenB)']);
  });
});

describe('Item 7: a MenB "Minimum age not met" line cites a sentence that covers the brand', () => {
  const lineCites = (r) => (r.history?.MenB?.perDose ?? []).flatMap((v) => keys(v?.reasonCites));
  const nineYearOld = { dob: '2017-06-01', riskIds: ['asplenia'] };

  it('Penmenvy at 9 years: ACIP\'s Penmenvy "Persons aged ≥10 years" sentence', () => {
    const r = run({ ...nineYearOld, menbDoses: [{ brand: 'Penmenvy', date: '2026-09-01' }] });
    expect(lineCites(r)).toEqual(['penmenvyAged10BothIndicated']);
  });

  it('Penbraya at 9 years: CDC\'s MenB minimum-age line, which names Penbraya', () => {
    const r = run({ ...nineYearOld, menbDoses: [{ brand: 'Penbraya', date: '2026-09-01' }] });
    expect(lineCites(r)).toEqual(['cdcChildMenbMinAge']);
  });

  it('Penmenvy with no date, patient 9 today: the same Penmenvy sentence', () => {
    const r = run({ ...nineYearOld, menbDoses: [{ brand: 'Penmenvy', date: '' }] });
    expect(lineCites(r)).toEqual(['penmenvyAged10BothIndicated']);
  });

  it('control: Bexsero and Trumenba at 9 years keep ACIP 2020\'s licensure sentence', () => {
    for (const brand of ['Bexsero (MenB)', 'Trumenba (MenB)']) {
      const r = run({ ...nineYearOld, menbDoses: [{ brand, date: '2026-09-01' }] });
      expect(lineCites(r)).toEqual(['menbLicensedAge1025']);
    }
  });

  it('control: the line\'s wording and verdict are unchanged', () => {
    const r = run({ ...nineYearOld, menbDoses: [{ brand: 'Penmenvy', date: '2026-09-01' }] });
    const v = r.history.MenB.perDose[0];
    expect(v.status).toBe('invalid');
    expect(v.reasons[0]).toBe('Minimum age not met (10 years for Penmenvy). [c]');
  });
});
