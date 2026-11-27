// C11 (port plan, Phase 8; 2026-11-26). Each source number sits on a claim its
// quoted sentence states. Citation only (owner Q12, 2026-11-21: decide alone
// when the dose is unchanged): 0 answers moved, 0 sentences changed; only which
// sentence a number opens, or a number added where a claim carried none.
//
// Measured with `node scripts/claimMatchesQuote.mjs` over every saved patient
// (124,337 numbers before): six claims sat on a sentence that does not state them.
//
//   1. Under 10, high-risk (not complement): "the 3-dose high-risk MenB series"
//      had no number; the one after "age 10" opens ACIP 2020's "MenB vaccine
//      series", no count. Now ACIP Oct 2024's 3-dose sentences (both families:
//      no product yet), as the age-10+ dose 1 card cites them (item 7).
//   2. "A MenACWY dose at age 16 years or older completes the adolescent
//      schedule", for a patient whose first dose came at 16+, cited the 11–12 +
//      16 schedule. ACIP 2020 says it: "Adolescents who receive a first dose
//      after their 16th birthday do not need a booster dose". With a dose before
//      16 too, the schedule sentence (the two doses the patient has) stays.
//   3. High-risk MenB dose 2, "(minimum 4 weeks)": the schedule sentence states
//      0 / 1–2 / 6 months and no minimum. Now ACIP 2020's "a minimum interval of
//      4 weeks should be used between any 2 doses", the sentence the dose-2
//      rule row rests on (owner C8, 2026-11-15).
//   4. High-risk MenB dose 3, "at least 4 months after dose 2": the schedule
//      sentence has no 4 months. Now ACIP Oct 2024's "If the third dose is
//      administered <4 months after the second dose, the dose should be
//      repeated"; the schedule keeps "6 months after dose 1".
//   5. "within the 4-day grace period" cited ACIP's 6- or 4-month sentence,
//      which says nothing of a grace. Now CDC's General Best Practices, read
//      live 2026-11-26: "vaccine doses administered ≤4 days before the minimum
//      interval or age are considered valid".
//   6. Infant MenACWY, "at least 8 weeks between the early doses" cited ACIP's
//      "4 doses at 2, 4, 6, and 12 mos". CDC's notes state the 8 weeks for
//      complement, asplenia, HIV and travel; ACIP's row stays on "the series".
//      An outbreak infant keeps ACIP's row: its one 8-week sentence is about a
//      MenACWY-CRM series started at 3–6 months, and this line also serves a
//      2-month start that fell off the routine ages.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS } from '../../data/refs.js';

const TODAY = '2026-11-26';
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const keys = (c) => (c.noteCites ?? []).map((x) => x.key);
const text = (c) => [c.note?.lead, c.note?.detail].filter(Boolean).join(' ');
const marks = (c) => (text(c).match(/\[c\]/g) ?? []).length;

describe('C11: a number sits on a claim its quote states', () => {
  it('1. asplenia, 2 y: "3-dose" opens both families\' 3-dose sentences', () => {
    const c = run({ dob: '2024-06-01', riskIds: ['asplenia'] }).menb[0];
    expect(c.note.detail).toBe('This patient has a high-risk indication, so track them for the 3-dose high-risk MenB series [c][c] once they reach age 10 [c].');
    expect(keys(c)).toEqual(['menbLicensedAge1025Acip2024', 'menbHighRisk3DoseSchedule', 'menbFhbpSchedules', 'acip2020MenbRiskGroups']);
    expect(c.noteCites[1].quote).toMatch(/3-dose series/);
    expect(c.noteCites[2].quote).toMatch(/3-dose series/);
    expect(marks(c)).toBe(keys(c).length);
  });

  it('1, control: complement keeps CDC\'s "MenB vaccines need 3 doses"', () => {
    const c = run({ dob: '2024-06-01', riskIds: ['complement'] }).menb[0];
    expect(keys(c)).toEqual(['menbLicensedAge1025Acip2024', 'cdcComplementMenb3Doses', 'acip2020MenbRiskGroups']);
  });

  it.each([
    ['19 y, first dose at 17', '2007-06-01', ['2024-07-01']],
    ['26 y, first dose at 17', '2000-06-01', ['2017-07-01']],
  ])('2. %s: "completes the adolescent schedule" opens "do not need a booster dose"', (_, dob, dates) => {
    const c = run({ dob, menacwyDoses: dates.map((date) => ({ date, brand: 'MenQuadfi' })) }).menacwy[0];
    expect(c.status).toBe('complete');
    expect(c.note.lead).toMatch(/^A MenACWY dose at age 16 years or older complete(s|d) the adolescent schedule \[c\]\.$/);
    expect(keys(c)).toEqual(['acwyFirstDoseAfter16NoBooster']);
    expect(c.noteCites[0].quote).toMatch(/do not need a booster dose/);
  });

  it.each([
    ['19 y, doses at 11 and 16', '2007-06-01', ['2018-07-01', '2023-07-01']],
    ['26 y, doses at 11 and 17', '2000-06-01', ['2011-07-01', '2017-07-01']],
  ])('2, control: %s keeps the 11–12 + 16 schedule sentence', (_, dob, dates) => {
    const c = run({ dob, menacwyDoses: dates.map((date) => ({ date, brand: 'MenQuadfi' })) }).menacwy[0];
    expect(c.status).toBe('complete');
    expect(keys(c)).toEqual(['acwyRoutine1112and16']);
  });

  it('3. complement, 19 y, one Bexsero a year ago: "(minimum 4 weeks)" opens ACIP 2020\'s 4 weeks', () => {
    const c = run({ dob: '2007-06-01', riskIds: ['complement'], menbDoses: [{ date: '2025-11-22', brand: 'Bexsero' }] }).menb[0];
    expect(c.doseLabel).toBe('Dose 2 of 3 (high-risk, Bexsero)');
    expect(text(c)).toBe('Give dose 2 1–2 months after dose 1 (minimum 4 weeks [c]), with the same MenB product, and dose 3 about 6 months after dose 1 [c].');
    expect(keys(c)).toEqual(['acip2020MenbRepeat4Weeks', 'menbHighRisk3DoseSchedule']);
    expect(c.noteCites[0].quote).toMatch(/minimum interval of 4 weeks/);
  });

  // MENB-MIN-CITE (2026-11-27): this control said "no 4-week number" when the
  // minimum's own sentence carried no number at all. That sentence states the
  // 4 weeks, so ACIP 2020's 4 weeks now sits on it, and still not on the
  // schedule sentence (which states no minimum).
  it('3, control: dose 2 not yet due says the minimum in its own sentence, and the 4-week number sits there', () => {
    const c = run({ dob: '2007-06-01', riskIds: ['complement'], menbDoses: [{ date: '2026-11-08', brand: 'Bexsero' }] }).menb[0];
    expect(c.dueToday).toBe(false);
    expect(c.note.lead).toMatch(/^Earliest valid date: .* \(minimum interval 4 weeks\) \[c\]\.$/);
    expect(c.note.detail).toMatch(/^Give dose 2 1–2 months after dose 1, with the same MenB product, and dose 3 about 6 months after dose 1 \[c\]\.$/);
    expect(keys(c)).toEqual(['acip2020MenbRepeat4Weeks', 'menbHighRisk3DoseSchedule']);
  });

  it('4. asplenia, 17, Bexsero 1 Mar and 1 Apr 2026: "4 months after dose 2" opens ACIP\'s "<4 months … repeated"', () => {
    const c = run({ dob: '2009-06-01', riskIds: ['asplenia'], menbDoses: [
      { brand: 'Bexsero (MenB)', date: '2026-03-01' }, { brand: 'Bexsero (MenB)', date: '2026-04-01' }] }).menb[0];
    expect(c.doseLabel).toBe('Dose 3 of 3 (high-risk, Bexsero)');
    expect(text(c)).toContain('Dose 3 is due at least 6 months after dose 1 [c], and at least 4 months after dose 2 [c].');
    expect(keys(c)).toEqual(['menbHighRisk3DoseSchedule', 'menbHighRiskEarlyD3Unless']);
    expect(c.noteCites[0].quote).toMatch(/0, 1–2, and 6 months/);
    expect(c.noteCites[1].quote).toMatch(/<4 months after the second dose/);
  });

  it('5. the grace sentence is on file, read live 2026-11-26', () => {
    const g = CITATIONS.gbpGraceFourDays;
    expect(g.quote).toBe('vaccine doses administered ≤4 days before the minimum interval or age are considered valid');
    expect(g.url).toBe('https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html');
    expect(g.lastVerified).toBe('2026-11-26');
  });

  it('5. asplenia, dose 2 two days short of 6 months: the grace opens CDC\'s grace sentence', () => {
    const c = recommend({ dob: '2006-06-01', today: '2026-11-19', riskIds: ['asplenia'],
      menacwyDoses: ['2020-01-01', '2020-03-01', '2025-03-01'].map((date) => ({ date, brand: 'Menveo (MenACWY)' })),
      menbDoses: ['2026-01-03', '2026-07-01'].map((date) => ({ date, brand: 'Bexsero (MenB)' })) }).menb[0];
    expect(text(c)).toMatch(/^Dose 3 is not needed: dose 2 was given 6 months after dose 1 \[c\], within the 4-day grace period \[c\]\. /);
    expect(keys(c).slice(0, 2)).toEqual(['menbHighRiskD2SixMonthsNoD3Acip2024', 'gbpGraceFourDays']);
  });

  const infant = (riskIds) => run({ dob: '2026-04-26', riskIds,
    menacwyDoses: ['2026-08-01', '2026-10-01'].map((date) => ({ date, brand: 'Menveo 2-vial' })) }).menacwy[0];

  it('6. travel infant, 7 months, started at 3 months: the 8 weeks opens CDC\'s notes, the series ACIP\'s row', () => {
    const c = infant(['travel']);
    expect(text(c)).toContain('Continue the infant travel series [c], with at least 8 weeks between the early doses [c].');
    expect(keys(c)).toEqual(['acwyInfantHighRisk2to6mo', 'cdcChildAcwyInfantSeries']);
    expect(c.noteCites[1].quote).toMatch(/at least 8 weeks after previous dose/);
  });

  it('6, control: an outbreak infant keeps ACIP\'s row alone', () => {
    const c = infant(['outbreak_acwy']);
    expect(text(c)).toContain('Continue the infant outbreak series, with at least 8 weeks between the early doses [c].');
    expect(keys(c)).toEqual(['acwyInfantHighRisk2to6mo']);
  });
});
