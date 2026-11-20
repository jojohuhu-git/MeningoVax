// T1 (owner, 2026-11-19): a high-risk baby who started MenACWY at 2 months and
// got dose 2 at 7 months or older finishes in THREE doses, as a 3–6-month
// starter does. Babies vaccinated on time (2, 4, 6 months) still get four.
//
// Owner's words: "CDSI: 2 more" (for a 6-year-old with one dose at 2 months),
// then "All of them" when asked whether that applies to every 2-month starter
// whose dose 2 came at 7 months or older. This reverses the 2026-09-15 decision
// ("Dose 1 at 2 months: 4-dose series", no 3-dose shortcut) for those patients
// only.
//
// Why: CDC's own scheduling rules, CDSI 4.65 (AntigenSupportingData-
// Meningococcal-ACWY-4.65.xml, series "Meningococcal ACWY risk 2-23 month", in
// scripts/cdsi/cdc-files/), have one checklist for every infant start. Doses 2
// and 3 carry "Dose is not required if patient is currently 7 months of age or
// older"; dose 4 carries "Dose is not required if more than 2 doses have been
// administered between 2 and 7 months OR at least 1 dose on or after 7 months";
// dose 5 is at 12 months and 12 weeks after the one before. CDC's written note
// ("Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and
// 12 months)") does not say what happens to a child who falls behind.
//
// Before: patients A and B below were asked for a fourth dose.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { menacwyInfantHighRiskTotal } from '../seriesTotals.js';

const MENVEO = 'Menveo 2-vial (MenACWY)';
const YES = { MenACWY: { 0: 'yes', 1: 'yes', 2: 'yes', 3: 'yes' } };

function first({ today, dob, ageMonths, dates }) {
  return recommend({
    today, dob, ageMonths, riskIds: ['asplenia'], riskAtDoseAnswers: YES,
    menacwyDoses: dates.map((date) => ({ date, brand: MENVEO })),
  }).menacwy[0];
}
const cards = (p) => [first(p).doseLabel];

describe('T1: a 2-month starter whose dose 2 came at 7 months or older', () => {
  it('the series total is 3, as for a 3–6-month starter', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: 9 })).toBe(3);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: 72 })).toBe(3);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 3, d2AgeM: 9 })).toBe(3); // control: unchanged
  });

  it('on time at 2 and 4 months, or dose 2 age unknown: still 4', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: 4 })).toBe(4);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: null })).toBe(4);
  });

  // A: born 2025-11-19, dose 1 at 2 months, dose 2 at 9 months, seen at 12 months.
  it('A: dose 2 at 9 months — the next dose is the last (dose 3 of 3)', () => {
    const labels = cards({ today: '2026-11-19', dob: '2025-11-19', ageMonths: 12, dates: ['2026-01-19', '2026-08-19'] });
    expect(labels.join(' / ')).toMatch(/Dose 3 of 3/);
  });

  // B: the owner's T1 patient. Born 2020-11-19, one dose at 2 months, nothing
  // since. Seen at 6 years: dose 2 now, then one more (2 more in all).
  it('B: one dose at 2 months, seen at 6 years, given dose 2 today — one dose left', () => {
    const labels = cards({ today: '2026-11-19', dob: '2020-11-19', ageMonths: 72, dates: ['2021-01-19', '2026-11-19'] });
    expect(labels.join(' / ')).toMatch(/Dose 3 of 3/);
  });

  it('B, once the third dose is given 12 weeks later: no fourth primary dose', () => {
    const labels = cards({ today: '2027-02-19', dob: '2020-11-19', ageMonths: 75, dates: ['2021-01-19', '2026-11-19', '2027-02-19'] });
    expect(labels.join(' / ')).not.toMatch(/Dose 4/);
    expect(labels.join(' / ')).toMatch(/Booster/);
  });

  it('control: on time at 2, 4, 6 months — dose 4 is still owed at 12 months', () => {
    const labels = cards({ today: '2026-11-19', dob: '2025-11-19', ageMonths: 12, dates: ['2026-01-19', '2026-03-19', '2026-05-19'] });
    expect(labels.join(' / ')).toMatch(/Dose 4/);
  });

  // The live check found this: with one dose recorded, the card read "Dose 2
  // (infant high-risk series)", told a 6-year-old "doses at 2, 4, 6 and 12
  // months", and the recorded dose's chip read "Dose 1 of 4".
  it('B, seen at 6 years with one dose: the card is dose 2 of 3, due today', () => {
    const c = first({ today: '2026-11-19', dob: '2020-11-19', ageMonths: 72, dates: ['2021-01-19'] });
    expect(c.doseLabel).toMatch(/^Dose 2 of 3 \(.*3-dose shortcut\)$/);
    expect(c.seriesTotal).toBe(3);
    expect(c.dueToday).toBe(true);
    expect(JSON.stringify(c.note)).not.toMatch(/2, 4, 6 and 12 months/);
  });

  it('control: one dose at 2 months, seen at 5 months — still dose 2 of a 4-dose series', () => {
    const c = first({ today: '2026-06-19', dob: '2026-01-19', ageMonths: 5, dates: ['2026-03-19'] });
    expect(c.doseLabel).not.toMatch(/shortcut/);
    expect(c.seriesTotal).toBe(4);
  });
});

// The first booster keys off the age at the LAST primary dose (CLAUDE.md,
// "Booster Cadence"). The infant card read dose 2's age, harmless while every
// infant series finished before 7; a child who fell behind can now finish later.
describe('T1: the first booster after a late-finished infant series', () => {
  // Doses at 2 and 4 months, then nothing until 9 years: four doses in all
  // (2 before 7 months), the last at 9 years and 3 months. Dose 2 was under 7,
  // so reading dose 2's age gave 3 years here.
  it('finished at 9 years: first booster 5 years after the last dose', () => {
    const c = first({ today: '2026-11-19', dob: '2016-11-19', ageMonths: 120,
      dates: ['2017-01-19', '2017-03-19', '2025-11-19', '2026-02-19'] });
    expect(c.doseLabel).toMatch(/first booster, 5 years after primary/);
    expect(c.earliestNextDate).toBe('2031-02-19');
  });

  it('control: finished at 6 years: first booster 3 years after the last dose', () => {
    const c = first({ today: '2027-03-19', dob: '2020-11-19', ageMonths: 76,
      dates: ['2021-01-19', '2026-11-19', '2027-02-19'] });
    expect(c.doseLabel).toMatch(/first booster, 3 years after primary/);
    expect(c.earliestNextDate).toBe('2030-02-19');
  });
});
