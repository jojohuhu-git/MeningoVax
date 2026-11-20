// STOP B, B-1 (owner, 2026-11-15; extended 2026-11-17): the 4-day grace at an
// age line that picks the MenACWY schedule — used ONLY when it means fewer
// doses owed. PneumoVax's §A-GRACE12-HELPS ruling, carried over.
//
// CDC, General Best Practices, timing and spacing (read live 2026-11-17):
//   "vaccine doses administered ≤4 days before the minimum interval or age are
//    considered valid"
// CDC child & adolescent schedule notes, MenACWY special situations, Menveo
// (read live 2026-11-17):
//   "Dose 1 at age 2 months: 4-dose series"
//   "Dose 1 at age 3–6 months: 3- or 4- dose series (… until a dose is received
//    at age 7 months or older, followed by an additional dose at least 12 weeks
//    later and after age 12 months)"
//   "Dose 1 at age 7–23 months: 2-dose series"
// ACIP 2020 MMWR 69(RR-9) Table 9 (travel, read live 2026-11-17), ≥2 yrs:
//   "Primary vaccination: MenACWY-D** or MenACWY-CRM or MenACWY-TT: 1 dose"
//
// The lines: 3 months, 7 months, 2 years and 16 years (owner D13, 2026-11-17). A MenACWY dose given 1–4 days
// before one of them is read both ways — at its real age, and as given ON the
// line — and the app keeps the reading whose MenACWY card owes FEWER doses. A
// tie keeps the real age (what the app did before).
//
// NOT a grace line (owner 2026-11-17): age 7. The grace there never changes how
// many doses are owed, only whether the first booster comes at 3 or 5 years, and
// the owner kept the 3-year booster. The age-10 line keeps its grace (a
// deliberate CDSI difference, CDC test patient 2013-0500).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const MV = 'Menveo 2-vial (MenACWY)';
const MQ = 'MenQuadfi (MenACWY)';
const yes = (n) => Object.fromEntries([...Array(n)].map((_, i) => [i, 'yes']));
const run = ({ dob = null, ageMonths, riskIds, doses, today }) => recommend({
  dob, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [], today,
  riskAtDoseAnswers: { MenACWY: yes(doses.length) },
});
const card = (r) => r.menacwy[0];

describe('B-1: 7 months — the plan\'s travel baby', () => {
  // Born 2026-01-10; 7 months = 2026-08-10.
  const base = { dob: '2026-01-10', riskIds: ['travel'], today: '2026-11-17' };

  it('Menveo 2 days before 7 months: a 2-dose series, as on the 7-month day', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-08-08', brand: MV }] }));
    expect(c.doseNum).toBe(2);
    expect(c.seriesTotal).toBe(2);
    expect(c.earliestNextDate).toBe('2027-01-10');
  });

  it('control: on the 7-month day — 2 doses', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-08-10', brand: MV }] }));
    expect([c.doseNum, c.seriesTotal]).toEqual([2, 2]);
  });

  // T1 (owner, 2026-11-19): a child already 7 months or older with one dose gets dose 2 at 7 months or older, so three doses in all (CDSI 4.65). Was 4.
  it('control: 5 days before 7 months — outside the grace, the 3-or-4-dose series (3, since dose 2 is now at 7 months or older)', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-08-05', brand: MV }] }));
    expect([c.doseNum, c.seriesTotal]).toEqual([2, 3]);
  });

  it('the record line still prints the real age (the copy read at 7 months never reaches the screen)', () => {
    const r = run({ ...base, doses: [{ date: '2026-08-08', brand: MV }] });
    expect(r.history.MenACWY.sortedDoses[0]).toEqual({ date: '2026-08-08', brand: MV });
    expect(r.history.MenACWY.effective[0]).toEqual({ date: '2026-08-08', brand: MV });
  });

  it('no date of birth: the grace is not applied (the dose cannot be placed to the day)', () => {
    // Same baby entered as 10 months old, no birthday.
    // Read at its real age: the 3-or-4-dose series, 3 since T1 (2026-11-19);
    // the graced reading would have given 2.
    const c = card(run({ ageMonths: 10, riskIds: ['travel'], today: '2026-11-17',
      doses: [{ date: '2026-08-08', brand: MV }] }));
    expect(c.seriesTotal).toBe(3);
  });
});

describe('B-1: 2 years — travel', () => {
  // Born 2024-11-20; 2nd birthday = 2026-11-20.
  const base = { dob: '2024-11-20', riskIds: ['travel'], today: '2026-11-25' };

  it('Menveo 2 days before the 2nd birthday: one dose (≥2 yrs), booster 3 years after it', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-11-18', brand: MV }] }));
    expect(c.seriesTotal).toBe(1);
    expect(c.earliestNextDate).toBe('2029-11-18');
    expect(c.dueToday).toBe(false);
  });

  it('control: on the 2nd birthday — the same one-dose answer', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-11-20', brand: MV }] }));
    expect(c.seriesTotal).toBe(1);
    expect(c.earliestNextDate).toBe('2029-11-20');
  });

  it('control: 5 days before the 2nd birthday — still the infant series, dose 2 owed', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-11-15', brand: MV }] }));
    expect([c.doseNum, c.seriesTotal]).toEqual([2, 2]);
  });
});

describe('B-1: on the visit the dose was given (the patient still 1–4 days short of the birthday)', () => {
  it('2 years, travel: the dose-day card already says one dose — it does not change two days later', () => {
    const doses = [{ date: '2026-11-18', brand: MV }];
    for (const today of ['2026-11-18', '2026-11-20', '2026-12-18']) {
      const c = card(run({ dob: '2024-11-20', riskIds: ['travel'], today, doses }));
      expect([today, c.seriesTotal, c.earliestNextDate]).toEqual([today, 1, '2029-11-18']);
    }
  });

  it('control: the same child seen 1 day BEFORE the dose is not affected (no dose yet to read)', () => {
    const c = card(run({ dob: '2024-11-20', riskIds: ['travel'], today: '2026-11-17', doses: [] }));
    expect(c.seriesTotal).not.toBe(1);
  });
});

describe('B-1: 16 years (owner D13, 2026-11-17) — CDC test patients 2013-0488, 2013-0511', () => {
  // Born 2010-08-09; 16th birthday 2026-08-09; dose 2026-08-05 (16 years − 4 days).
  const base = { dob: '2010-08-09', riskIds: [] };

  it('2013-0488: Menveo at 11, then 4 days before 16 — Complete on the dose day', () => {
    const doses = [{ date: '2021-08-09', brand: MV }, { date: '2026-08-05', brand: MV }];
    for (const today of ['2026-08-05', '2026-08-08', '2026-09-30']) {
      const c = card(run({ ...base, today, doses }));
      expect([today, c.status, c.seriesTotal]).toEqual([today, 'complete', 2]);
    }
  });

  it('2013-0511: a first dose 4 days before 16 — Complete, one dose', () => {
    const doses = [{ date: '2026-08-05', brand: MV }];
    for (const today of ['2026-08-05', '2026-09-30']) {
      const c = card(run({ ...base, today, doses }));
      expect([today, c.status, c.seriesTotal]).toEqual([today, 'complete', 1]);
    }
  });

  it('control: 5 days before 16 — the booster is still owed', () => {
    const c = card(run({ ...base, today: '2026-08-04',
      doses: [{ date: '2021-08-09', brand: MV }, { date: '2026-08-04', brand: MV }] }));
    expect(c.status).not.toBe('complete');
  });

  it('the MenB card is untouched: a healthy 15-year-old seen on the dose day is not moved into the 16+ MenB band', () => {
    const doses = [{ date: '2021-08-09', brand: MV }, { date: '2026-08-05', brand: MV }];
    const graced = run({ ...base, today: '2026-08-05', doses });
    const noAcwy = run({ ...base, today: '2026-08-05', doses: [] });
    expect(graced.menb).toEqual(noAcwy.menb);
  });
});

describe('B-1: 3 months (owner 2026-11-17: "Yes, grace helps")', () => {
  // Asplenia, born 2026-01-10; 3 months = 2026-04-10, 7 months = 2026-08-10.
  const base = { dob: '2026-01-10', riskIds: ['asplenia'], today: '2026-11-17' };

  it('Menveo 2 days before 3 months, then at 7 months: Dose 3 of 3, as for a 3-month start', () => {
    const r = run({ ...base, doses: [{ date: '2026-04-08', brand: MV }, { date: '2026-08-10', brand: MV }] });
    const c = card(r);
    expect([c.doseNum, c.seriesTotal]).toEqual([3, 3]);
    expect(c.earliestNextDate).toBe('2027-01-10');
    expect(r.history.MenACWY.perDose.map((d) => d.status)).toEqual(['valid', 'valid']);
  });

  it('control: dose 1 on the 3-month day — the same Dose 3 of 3', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-04-10', brand: MV }, { date: '2026-08-10', brand: MV }] }));
    expect([c.doseNum, c.seriesTotal]).toEqual([3, 3]);
  });

  // T1 (owner, 2026-11-19): a 2-month start whose dose 2 came at 7 months or
  // older finishes in three as well, so this patient no longer needs the grace
  // to reach the shortcut. Until T1 this was the control that stayed at 4.
  it('5 days before 3 months (a 2-month start), dose 2 at 7 months: Dose 3 of 3 since T1', () => {
    const c = card(run({ ...base, doses: [{ date: '2026-04-05', brand: MV }, { date: '2026-08-10', brand: MV }] }));
    expect([c.doseNum, c.seriesTotal]).toEqual([3, 3]);
  });

  it('control: 5 days before 3 months, dose 2 on time at 5 months — the 4-dose series stays', () => {
    const c = card(run({ ...base, today: '2026-06-10', doses: [{ date: '2026-04-05', brand: MV }, { date: '2026-06-05', brand: MV }] }));
    expect([c.doseNum, c.seriesTotal]).toEqual([3, 4]);
  });
});

describe('B-1: a tie keeps the real age', () => {
  it('asplenia, Menveo 2 days before 7 months then 9 weeks later: both readings owe one dose, so nothing moves', () => {
    // At its real age (6 months) dose 1 starts the 3-or-4-dose series and dose 2,
    // at 9 months, earns the 3-dose shortcut. Read at 7 months, dose 2 would be
    // under 12 weeks and under 12 months — not counted. One dose owed either way:
    // the real-age reading stays, and dose 2 still counts.
    const r = run({ dob: '2026-01-10', riskIds: ['asplenia'], today: '2026-11-17',
      doses: [{ date: '2026-08-08', brand: MV }, { date: '2026-10-10', brand: MV }] });
    const c = card(r);
    expect([c.doseNum, c.seriesTotal]).toEqual([3, 3]);
    expect(r.history.MenACWY.perDose.map((d) => d.status)).toEqual(['valid', 'valid']);
  });
});

describe('Not a grace line: age 7 (owner 2026-11-17, "3 years")', () => {
  it('travel, MenQuadfi 2 days before the 7th birthday: first booster 3 years after it', () => {
    const c = card(run({ dob: '2019-03-10', riskIds: ['travel'], today: '2026-11-17',
      doses: [{ date: '2026-03-08', brand: MQ }] }));
    expect(c.earliestNextDate).toBe('2029-03-08');
  });

  it('control: on the 7th birthday — 5 years', () => {
    const c = card(run({ dob: '2019-03-10', riskIds: ['travel'], today: '2026-11-17',
      doses: [{ date: '2026-03-10', brand: MQ }] }));
    expect(c.earliestNextDate).toBe('2031-03-10');
  });
});
