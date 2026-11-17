// D1 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// a college-residence student whose MenACWY dose at 16 or older was given more
// than 5 years ago needs one dose; within 5 years they are covered. Reverses M17
// (2026-09-15), which rested on ACIP's ROUTINE sentence ("do not need a booster
// dose unless they become at increased risk") read as if it were the college one.
//
// Sources, read live 2026-11-17:
//   ACIP 2020 rr6909a1, Table 10 footnote: "Adolescents who received a first dose
//     after their 16th birthday do not need another dose before college entry
//     unless it has been more than 5 years since the dose."
//   immunize.org P2018 (10/19/2026), college row: "1 prior dose since 16th
//     birthday, but more than 5 years previously — Give 1 dose of MenACWY"
//
// History: this file replaces regression-m17-college-no-booster.test.js. M17
// had weighed ACIP against P2018 believing they disagreed; read live again on
// 2026-11-17 they agree (both: 5 years). M17's two controls are kept below.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const M = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const card = (dob, doses, today = '2026-11-17') => recommend({
  dob, today, riskIds: ['college_dorm'], menacwyDoses: doses.map(M), menbDoses: [],
}).menacwy[0];

describe('D1: a dose at 16+ covers college residence for 5 years', () => {
  it('22 y, doses at 11 and 16, the 16-year dose 6 years ago: one dose is due today', () => {
    const c = card('2004-06-01', ['2015-09-01', '2020-07-01']);
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toMatch(/more than 5 years/);
  });

  it('control: the 16-year dose 3 years ago — Complete', () => {
    const c = card('2007-06-01', ['2018-09-01', '2023-07-01']);
    expect(c.status).toBe('complete');
  });

  it('exactly 5 years to the day is still covered ("more than 5 years")', () => {
    expect(card('2004-06-01', ['2021-11-17']).status).toBe('complete');
  });

  it('5 years and 1 day: one dose is due', () => {
    const c = card('2004-06-01', ['2021-11-16']);
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(true);
  });

  it('a recent dose at 16+ covers, even when an older one at 16+ is past 5 years', () => {
    expect(card('2000-01-01', ['2017-01-01', '2024-01-01']).status).toBe('complete');
  });

  it('control (from M17): no doses at all still needs one', () => {
    const c = card('2004-06-01', []);
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(true);
  });

  it('control (from M17): a dose given before the 16th birthday still needs one', () => {
    const c = card('2004-06-01', ['2014-09-15']);
    expect(c.status).not.toBe('complete');
    expect(c.dueToday).toBe(true);
  });
});
