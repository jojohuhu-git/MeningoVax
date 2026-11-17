// N5 (port Phase 0 finding, owner ruling 2026-11-15): the 16-year MenACWY
// booster waits at least 8 weeks after dose 1, and a booster given sooner does
// not count.
//
// SOURCE, read live 2026-11-15. ACIP 2020 (MMWR RR-9, rr6909a1):
//
//   "Adolescents who receive their first dose at age 13–15 years should receive
//    a booster dose at age 16–18 years; the booster dose can be administered at
//    any time, as long as a minimum interval of 8 weeks between doses is
//    maintained."
//
// Also CDC child notes (July 2025): "Age 13–15 years: 1 dose now and booster at
// age 16–18 years (minimum interval: 8 weeks)"; CDC Table 3-2: MenACWY dose 1
// to the next dose, minimum 8 weeks; CDSI 4.65: 8 weeks - 4 days.
//
// Reproduced before the fix: born 8/15/2010, MenACWY 7/20/2026 (15y 11m), seen
// 8/25/2026 -> "Booster (16y)", due today, 5 weeks after dose 1; and a booster
// given that day counted, so the card read Complete.
//
// Where a not-counted booster's REPEAT is measured from was the separate
// Ruling D question. The owner decided it at STOP C (C2, 2026-11-15): from the
// dose that did not count. CDC Timing and Spacing (read live 2026-11-15): "The
// repeat dose should be spaced after the invalid dose by the recommended
// minimum interval." So the repeat below is 8 weeks after the 8/25 booster
// (10/20), no longer 8 weeks after dose 1 (9/14).

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const DOB = '2010-08-15';
const M = 'Menveo 2-vial (MenACWY)';
const run = ({ dob = DOB, riskIds = [], doses, today }) =>
  recommend({ dob, riskIds, menacwyDoses: doses, menbDoses: [], today });

describe('N5: the card waits 8 weeks after dose 1', () => {
  const doses = [{ date: '2026-07-20', brand: M }];

  it('just after the 16th birthday, 5 weeks after dose 1: not due yet, eligible Sep 14', () => {
    const c = run({ doses, today: '2026-08-25' }).menacwy[0];
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-09-14');
  });

  it('so the combined pentavalent is not offered that day either', () => {
    expect(run({ doses, today: '2026-08-25' }).pentavalent.eligible).toBe(false);
  });

  it('on Sep 14, 8 weeks after dose 1, it is due', () => {
    const c = run({ doses, today: '2026-09-14' }).menacwy[0];
    expect(c.dueToday).toBe(true);
    expect(c.earliestNextDate).toBe(null);
  });

  it('before the 16th birthday the booster date is the later of the birthday and 8 weeks', () => {
    const c = run({ doses, today: '2026-07-25' }).menacwy[0];
    expect(c.boosterDueDate).toBe('2026-09-14');
  });

  it('control: dose 1 sixteen weeks earlier, the booster is due on the 16th birthday as before', () => {
    const c = run({ doses: [{ date: '2026-05-01', brand: M }], today: '2026-08-25' }).menacwy[0];
    expect(c.dueToday).toBe(true);
  });

  it('control: before the 16th birthday with an early dose 1, the 16th birthday still wins', () => {
    const c = run({ doses: [{ date: '2026-05-01', brand: M }], today: '2026-07-25' }).menacwy[0];
    expect(c.boosterDueDate).toBe('2026-08-15');
  });
});

describe('N5: a booster given sooner than 8 weeks does not count', () => {
  const booster = (date) => [{ date: '2026-07-20', brand: M }, { date, brand: M }];

  it('a booster 5 weeks after dose 1 is not counted, and the card asks again 8 weeks after it (Ruling D)', () => {
    const r = run({ doses: booster('2026-08-25'), today: '2026-09-01' });
    const p = r.history.MenACWY.perDose[1];
    expect(p.status).toBe('invalid');
    expect(p.reasons[0]).toMatch(/at least 8 weeks after dose 1/);
    expect(r.menacwy[0].status).not.toBe('complete');
    expect(r.menacwy[0].earliestNextDate).toBe('2026-10-20');
  });

  it('4-day grace: 52 days after dose 1 counts', () => {
    const r = run({ doses: booster('2026-09-10'), today: '2026-09-20' });
    expect(r.history.MenACWY.perDose[1].status).toBe('valid');
    expect(r.menacwy[0].status).toBe('complete');
  });

  it('4-day grace: 51 days after dose 1 does not count', () => {
    const r = run({ doses: booster('2026-09-09'), today: '2026-09-20' });
    expect(r.history.MenACWY.perDose[1].status).toBe('invalid');
  });

  it('control: a dose 1 given at 16 or older is unaffected (a second dose is "extra", not invalid)', () => {
    // C11 (2026-11-15): 8 weeks now separate ANY two MenACWY doses, so the
    // second dose moved from 5 weeks (2026-04-05) to 9 weeks after the first.
    const r = run({ dob: '2008-01-01', doses: [{ date: '2026-03-01', brand: M }, { date: '2026-05-03', brand: M }], today: '2026-09-01' });
    const p = r.history.MenACWY.perDose[1];
    expect(p.status).not.toBe('invalid');
    expect(p.extraDose).toBe(true);
  });

  it('control: high-risk (asplenia) dose 2 still follows its own 8-week rule, unchanged', () => {
    const r = run({ riskIds: ['asplenia'], doses: booster('2026-08-25'), today: '2026-09-01' });
    expect(r.history.MenACWY.perDose[1].reasons[0]).toMatch(/high-risk primary series/);
  });
});

describe('N5: every card that asks for this same booster waits too', () => {
  const doses = [{ date: '2026-07-20', brand: M }];

  it('college residence card', () => {
    const c = run({ riskIds: ['college_dorm'], doses, today: '2026-08-25' }).menacwy[0];
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-09-14');
  });

  it('military recruit card ("routine booster still owed")', () => {
    const c = run({ riskIds: ['military'], doses, today: '2026-08-25' }).menacwy[0];
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-09-14');
  });

  it('outbreak card ("routine booster still owed")', () => {
    const c = run({ riskIds: ['outbreak_acwy'], doses, today: '2026-08-25' }).menacwy[0];
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-09-14');
  });
});
