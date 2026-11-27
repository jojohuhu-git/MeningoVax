// PHASE9-D (Phase 9.1 re-run of the whole-app checks, 2026-11-27) — an
// infant's next MenACWY dose date, when the age floor is the later line, is
// read off the date of birth, so it does not move with the day the patient is
// seen.
//
// FOUND (whole-app report 2026-11-15, finding D; still flagged 2026-11-27 on
// 5 typical patients): born Dec 15, 2025, asplenia, MenQuadfi Aug 15, 2026.
// Seen Sep 15, 2026 the card said "Dose 2 … Dec 15, 2026" (the first
// birthday). Seen any day from Sep 16 to Dec 14 it said "Dec 16, 2026". On Dec
// 15 itself the same card says the dose is due, so "Dec 16" was one day late.
// Same on the travel and outbreak infant series.
//
// CAUSE: `earliestGatedDate` worked the age floor out as "today plus the months
// still to go", a fraction rounded up to a whole day. With the date of birth
// known, the floor date is simply the birthday at that age, the same day the
// engine's own "due today" test turns true. No clinical rule changed: CDC's
// "after age 12 months" is unchanged; only the printed date stops drifting.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { earliestGatedDate } from '../intervals.js';
import { addDays } from '../dateUtils.js';

const acwy = (r) => r.menacwy[0];
const patient = (riskIds, today) => ({
  dob: '2025-12-15', riskIds, today,
  menacwyDoses: [{ date: '2026-08-15', brand: 'MenQuadfi' }], menbDoses: [],
  riskAtDoseAnswers: { MenACWY: { 0: 'yes' }, MenB: {} },
});

describe('PHASE9-D: the infant dose-2 date is the first birthday, whatever day the patient is seen', () => {
  for (const risk of ['asplenia', 'complement', 'hiv', 'travel', 'outbreak_acwy']) {
    it(`${risk}: Dec 15, 2026 from Sep 15 to Dec 14; due on Dec 15`, () => {
      for (const today of ['2026-09-15', '2026-09-16', '2026-10-31', '2026-12-14']) {
        const c = acwy(recommend(patient([risk], today)));
        expect(c.dueToday, `${risk} seen ${today}`).toBe(false);
        expect(c.earliestNextDate, `${risk} seen ${today}`).toBe('2026-12-15');
      }
      expect(acwy(recommend(patient([risk], '2026-12-15'))).dueToday).toBe(true);
    });
  }

  it('the floor date is the day the engine first says "due", for every birth date in a year', () => {
    const wrong = [];
    for (let i = 0; i < 366; i += 1) {
      const dob = addDays('2025-01-01', i);
      const d1 = addDays(dob, 240);                       // about 8 months: a 2-dose series
      const seenOn = addDays(d1, 20);
      const p = { dob, riskIds: ['asplenia'], today: seenOn,
        menacwyDoses: [{ date: d1, brand: 'MenQuadfi' }], menbDoses: [],
        riskAtDoseAnswers: { MenACWY: { 0: 'yes' }, MenB: {} } };
      const date = acwy(recommend(p)).earliestNextDate;
      const dueOn = acwy(recommend({ ...p, today: date })).dueToday;
      const dueBefore = acwy(recommend({ ...p, today: addDays(date, -1) })).dueToday;
      if (!dueOn || dueBefore) wrong.push(`${dob}: ${date} due=${dueOn}, day before due=${dueBefore}`);
    }
    expect(wrong).toEqual([]);
  });

  it('control: with no date of birth the estimate from today\'s age is kept (the only thing known)', () => {
    const gate = { minIntervalDays: 84, minAgeMonths: 12 };
    expect(earliestGatedDate('2026-08-15', gate, '2026-09-15', 9)).toBe('2026-12-15');
  });

  it('control: the interval still wins when it is the later line', () => {
    const gate = { minIntervalDays: 84, minAgeMonths: 12 };
    // turns 12 months on Oct 1, 2026; 12 weeks after Sep 15 is Dec 8
    expect(earliestGatedDate('2026-09-15', gate, '2026-09-20', 11.6, '2025-10-01')).toBe('2026-12-08');
  });
});
