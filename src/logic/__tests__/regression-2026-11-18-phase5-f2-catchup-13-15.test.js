// Port Phase 5, F-2 (owner, 2026-11-18): a healthy 13–15-year-old's first
// MenACWY is a catch-up dose, not "routine, 11–12y".
//
// Found by the Phase 5 measurement (report-2026-11-18-phase5-measured.md, F-2):
// Ava, 14 y 8 m, no MenACWY, read "Dose 1 (routine, 11–12y)" and "The routine
// adolescent dose, given at 11–12 years." (216 saved patients' cards).
//
// Source read live 2026-11-18, CDC child/adolescent schedule notes (updated
// July 1, 2025), MenACWY "Catch-up vaccination": "Age 13–15 years: 1 dose now
// and booster at age 16–18 years (minimum interval: 8 weeks)". The app already
// says "catch-up" at 16–21.
//
// Owner: catch-up wording (label and first sentence). The badge stays "Dose due
// today, future boosters needed" (badge style is Phase 6). Nothing else moves:
// same dose, same status, same booster line (measured: 0 saved dates moved).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-18';
const card = (dob, menacwyDoses = []) =>
  recommend({ today: TODAY, dob, riskIds: [], menacwyDoses, menbDoses: [] }).menacwy[0];

const CATCHUP_LABEL = 'Dose 1 (catch-up, 13–15y)';
const ROUTINE_LABEL = 'Dose 1 (routine, 11–12y)';

describe('F-2: first MenACWY at 13–15 years reads catch-up', () => {
  it('Ava, 14 y 8 m, no MenACWY: catch-up label, CDC catch-up sentence', () => {
    const c = card('2012-03-03');
    expect(c.doseLabel).toBe(CATCHUP_LABEL);
    expect(c.note.lead).toBe('A catch-up dose now, then the booster at 16–18 years [c].');
    expect(c.noteCites.map((x) => x.key)).toEqual(['cdcCatchupAcwyBooster8Weeks']);
  });

  it('nothing but the wording moves: same status, dose, series and booster line', () => {
    const c = card('2012-03-03');
    expect(c.status).toBe('due');
    expect(c.dueToday).toBe(true);
    expect(c.doseNum).toBe(1);
    expect(c.seriesTotal).toBe(2);
    expect(c.boosterSummary).toBe('Boosters: 1 more - at age 16 [c]');
  });

  it('on the 13th birthday it is catch-up; the day before it is routine', () => {
    expect(card('2013-11-18').doseLabel).toBe(CATCHUP_LABEL);
    expect(card('2013-11-19').doseLabel).toBe(ROUTINE_LABEL);
  });

  it('15 y 11 m, no MenACWY: still catch-up (16 and over already says catch-up)', () => {
    expect(card('2010-12-20').doseLabel).toBe(CATCHUP_LABEL);
    expect(card('2010-11-18').doseLabel).toBe('Dose 1 (catch-up, ≥16y, no booster needed)');
  });

  it('a dose before age 10 does not count, so a 14-year-old with one is still catch-up', () => {
    const c = card('2012-03-03', [{ date: '2018-03-03', brand: 'Menveo (MenACWY)' }]);
    expect(c.doseLabel).toBe(CATCHUP_LABEL);
  });

  it('control: Ben, 12 y 6 m, no MenACWY, keeps the routine wording', () => {
    const c = card('2014-05-20');
    expect(c.doseLabel).toBe(ROUTINE_LABEL);
    expect(c.note.lead).toBe('The routine adolescent dose, given at 11–12 years.');
  });
});
