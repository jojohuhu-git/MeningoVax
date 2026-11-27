// ─────────────────────────────────────────────────────────────────────────
// MQ6-e (owner, 2026-11-21, "Same as at 2 months"): a high-risk, travel or
// outbreak baby whose MenQuadfi dose 1 was given from 6 weeks, seen before
// 2 months, was told "Not needed" / "Dose 1 given; next dose not yet due",
// with no date. From 2 months the same baby already got the dose-2 card. The
// card before 2 months is now that same card.
//
// AAP 2026 schedule (owner's copy, read 2026-11-21): "Dose 1 at age 2 months:
// 4-dose series (additional 3 doses at age 4, 6, and 12 months). The first dose
// of MenQuadfi may be given as early as 6 weeks." AAP catch-up table, MenACWY,
// dose 1 to dose 2: "8 weeks". Routine date with the minimum beside it: owner
// STOP F1 Q9b (2026-11-17). The 8 weeks and the 4-month age come from
// src/logic/intervals.js (MENACWY_INFANT_EARLY_GAP, MENACWY_INFANT_ROUTINE_AGE_MONTHS).
//
// Screen twin: src/components/__tests__/menquadfi-6-week-floor-ui.test.jsx ("a 7-week-old with a MenQuadfi
// dose already given at 6 weeks").
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { statusPillLabel } from '../../components/RecCard.jsx';

const DOB = '2026-10-03';
const DOSE1 = [{ date: '2026-11-14', brand: 'MenQuadfi' }]; // day 42: 6 weeks
const card = (today, riskIds = ['asplenia'], extra = {}) => recommend({
  today, dob: DOB, riskIds, menacwyDoses: DOSE1, menbDoses: [],
  riskAtDoseAnswers: { MenACWY: ['yes'], MenB: [] }, ...extra,
}).menacwy[0];

// What the card says, without the parts that name today's date.
const shape = (c) => ({
  pill: statusPillLabel(c, false), doseLabel: c.doseLabel, status: c.status,
  dueToday: c.dueToday, earliestNextDate: c.earliestNextDate,
  minIntervalDays: c.minIntervalDays, seriesTotal: c.seriesTotal,
});

describe('MenQuadfi at 6 weeks, seen at 7 weeks (Nov 21, 2026)', () => {
  for (const [risk, why] of [['asplenia', 'high-risk'], ['travel', 'travel'], ['outbreak_acwy', 'outbreak']]) {
    it(`${risk}: dose 2 next, due at 4 months (Feb 3, 2027), not "Not needed"`, () => {
      const c = card('2026-11-21', [risk]);
      expect(statusPillLabel(c, false)).toBe('Next dose not yet due');
      expect(c.status).not.toBe('not-indicated');
      expect(c.doseLabel).toBe(`Dose 2 (infant ${why} series)`);
      expect(c.earliestNextDate).toBe('2027-02-03');
      expect(c.dueToday).toBe(false);
      expect(c.minIntervalDays).toBe(56);
      expect(c.seriesTotal).toBe(4);
    });
  }

  it('states the earliest valid date, 8 weeks after dose 1 (Jan 9, 2027)', () => {
    expect(card('2026-11-21').note.lead).toBe('Earliest valid date: Jan 9, 2027 (minimum interval 8 weeks) [c].');   // INFANT-MIN-CITE (owner, 2026-11-27): CDC's notes
  });

  it('reads the same as the card the same baby gets at 2 months (control)', () => {
    expect(shape(card('2026-11-21'))).toEqual(shape(card('2026-12-03')));
    expect(card('2026-11-21').note).toEqual(card('2026-12-03').note);
  });

  it('the day before 2 months (Dec 2) reads the same', () => {
    expect(shape(card('2026-12-02'))).toEqual(shape(card('2026-12-03')));
  });
});

describe('unchanged (controls)', () => {
  it('no dose yet at 7 weeks: dose 1 of 4 due at 2 months, MenQuadfi named (MQ6, MQ6-g)', () => {
    const c = recommend({ today: '2026-11-21', dob: DOB, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] }).menacwy[0];
    expect(statusPillLabel(c, false)).toBe('Next dose not yet due');
    expect(c.doseLabel).toBe('Dose 1 of 4 (infant high-risk)');
  });

  it('a healthy 7-week-old with no dose: not yet due', () => {
    const c = recommend({ today: '2026-11-21', dob: DOB, riskIds: [], menacwyDoses: [], menbDoses: [] }).menacwy[0];
    expect(c.dueToday).toBe(false);
    expect(c.canGiveToday).toBeFalsy();
  });

  it('at 4 months, dose 2 is due today', () => {
    const c = card('2027-02-03');
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toBe('Dose 2 (infant high-risk series)');
  });
});
