// A newborn was told MenACWY was DUE TODAY (found 2026-09-17, during the
// differential sweep for calendar P1-1, PR #38).
//
// At any age below 2 months — including 0 — an at-risk infant's card read
// "Dose 1 (infant high-risk series)", status risk-based, dueToday TRUE, with a
// Menveo brand chip to pick. Reproduced in the running app: an at-risk newborn
// reached a Results page headed "Due today: MenACWY."
//
// No MenACWY product is licensed below 2 months. Verified live on 2026-09-17
// against the CDC child & adolescent immunization schedule notes:
//   MenACWY-CRM (Menveo) "minimum age: 2 months"
//   MenACWY-TT (MenQuadfi) "minimum age: 2 years"
//   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6,
//    and 12 months)"
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// So this was a silently wrong clinical answer, which is the one thing this app
// promises not to produce.
//
// Cause. The "start the series" branch is gated on `am >= MENACWY_MIN_AGE_MONTHS`.
// A patient below that age failed the gate and fell all the way through to the
// CONTINUE-the-series fallback at the bottom of the same function, which is
// written for a patient who already has doses: with none recorded it printed
// "Dose ${given + 1}" — dose 1 — and called it due today. The minimum age was
// checked in one place and not re-checked on the path that ran when the check
// failed.
//
// This fault is OLDER than the calendar fix: the same probe run against the
// pre-PR-#38 code gives byte-identical output. PR #38 only widened who reaches
// it, by letting month-end newborns be entered at all.
//
// Five risk groups reached it (asplenia, complement, HIV, travel, outbreak);
// a healthy infant and an HCT patient already said "Not yet due" correctly.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { MENACWY_MIN_AGE_MONTHS } from '../../data/brands.js';

const AT_RISK = [['asplenia'], ['complement'], ['hiv'], ['travel'], ['outbreak_acwy']];
const TOO_YOUNG = [0, 0.0357, 0.5, 1, 1.9];

function card(ageMonths, riskIds) {
  return recommend({
    ageMonths, riskIds, menacwyDoses: [], menbDoses: [], today: '2026-09-15',
  }).menacwy[0];
}

describe('a newborn is never told a MenACWY dose is due today', () => {
  it('the minimum age this rests on is 2 months', () => {
    expect(MENACWY_MIN_AGE_MONTHS).toBe(2);
  });

  it.each(AT_RISK)('nothing is due below the minimum age for %s', (...riskIds) => {
    for (const am of TOO_YOUNG) {
      const c = card(am, riskIds);
      expect(c.dueToday, `age ${am} months, ${riskIds}`).toBe(false);
    }
  });

  it.each(AT_RISK)('the card does not offer a dose number below the minimum age for %s', (...riskIds) => {
    for (const am of TOO_YOUNG) {
      const c = card(am, riskIds);
      expect(c.doseNum, `age ${am} months, ${riskIds}`).toBeNull();
      expect(c.doseLabel, `age ${am} months, ${riskIds}`).toMatch(/not yet/i);
    }
  });

  it.each(AT_RISK)('no brand is offered to a patient too young for any of them: %s', (...riskIds) => {
    for (const am of TOO_YOUNG) {
      expect(card(am, riskIds).brands ?? [], `age ${am} months, ${riskIds}`).toEqual([]);
    }
  });

  it('the card says the real minimum age, and that the patient is still tracked', () => {
    const c = card(1, ['asplenia']);
    expect(`${c.note.lead} ${c.note.detail}`).toMatch(/2 months/);
    expect(c.note.detail).toMatch(/high-risk|risk/i);
  });

  it('the series still starts the moment the patient reaches 2 months', () => {
    const c = card(MENACWY_MIN_AGE_MONTHS, ['asplenia']);
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toBe('Dose 1 of 4 (infant high-risk)');
  });

  it('a healthy infant and an HCT patient are unchanged', () => {
    for (const riskIds of [[], ['hct']]) {
      const c = card(1, riskIds);
      expect(c.dueToday).toBe(false);
      expect(c.doseLabel).toBe('Not yet due');
    }
  });
});
