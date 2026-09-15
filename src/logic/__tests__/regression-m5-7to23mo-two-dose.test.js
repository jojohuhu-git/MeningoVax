// M5 (2026-09-15): a high-risk series STARTED between 7 and 23 months of age is
// a TWO-dose primary series. This repo asked for three doses, and vaxapp asked
// for four — the same child got a different answer from each app, and neither
// matched CDC.
//
// CDC child & adolescent schedule notes, "Meningococcal serogroup A,C,W,Y
// vaccination", special situations, Menveo (fetched live 2026-09-15):
//
//   "Dose 1 at age 7–23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"
//
// Owner-confirmed table (meningococcal parity queue, 2026-09-15), medical high
// risk, first dose at 7–23 months: "2 doses — second ≥12 wks after first AND
// after the 1st birthday". Then, because that series completes before the 7th
// birthday, the first booster is due 3 years later and every 5 years after.
//
// What was wrong here: menacwyInfantHighRiskTotal() returned 3 for a 7–11-month
// start (and 4 for a 12–23-month one), and recommend.js's completion guard was
// `given >= 3`. So after two correctly given doses the app asked for a THIRD
// primary dose 12 weeks later, and only then started the booster clock. That is
// one needless injection, and it pushed the first booster out by three months.
// The engine's own note text already said "Dose 2 of 2-dose high-risk infant
// series" while the dose chip beside it said "of 3".
//
// This reverses part of F1 (2026-09-14), which had changed that total from 2 to
// 3 to match the `given >= 3` guard. F1 was right that the two had drifted; it
// aligned them on the wrong number. The guard moves to 2 here as well, so they
// stay aligned.

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { menacwyInfantHighRiskTotal } from '../seriesTotals.js';

const TODAY = '2026-06-03';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const acwy = (r) => r.menacwy[0];

describe('M5: the 7–23-month high-risk primary series is 2 doses', () => {
  it('a 7–11-month start needs 2 doses, not 3', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 9 })).toBe(2);
  });

  it('a 12–23-month start needs 2 doses, not 4', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 15 })).toBe(2);
  });

  it('a 2–6-month start is unchanged at 4 doses', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2 })).toBe(4);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 6 })).toBe(4);
  });

  it('an unknown dose-1 age still falls back to the 4-dose series', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: null })).toBe(4);
  });
});

describe('M5: after two doses the engine moves to the booster, not a third dose', () => {
  // Dose 1 at ~9 months, dose 2 at ~13 months (≥12 weeks later, past the 1st
  // birthday). Child is ~17 months old today.
  const doses = [{ date: '2025-10-05' }, { date: '2026-02-05' }];
  const run = () => recommend({
    today: TODAY, ageMonths: 17, riskIds: ['asplenia'],
    menacwyDoses: doses, menbDoses: [], riskAtDoseAnswers: { MenACWY: allYes(2) },
  });

  it('the next MenACWY dose offered is a booster', () => {
    expect(acwy(run()).doseLabel).toMatch(/booster/i);
  });

  it('the booster is due 3 years out, not 12 weeks', () => {
    expect(acwy(run()).minIntervalDays).toBe(1096); // DAYS.years(3)
  });

  it('the series total shown is 2', () => {
    expect(acwy(run()).seriesTotal).toBe(2);
  });
});

describe('M5: the validator agrees — dose 3 is a booster and must wait', () => {
  const twoDoses = [{ date: '2025-10-05' }, { date: '2026-02-05' }];

  it('a third dose 12 weeks after dose 2 is now too soon (it is a booster)', () => {
    const res = analyzeHistory('MenACWY',
      [...twoDoses, { date: '2026-05-05' }], 20, ['asplenia'], TODAY, allYes(3));
    expect(res.perDose[2].status).toBe('invalid');
    expect((res.perDose[2].reasons || []).join(' ')).toMatch(/booster/i);
  });

  it('a third dose 3 years after dose 2 is a valid first booster', () => {
    const res = analyzeHistory('MenACWY',
      [...twoDoses, { date: '2029-02-10' }], 53, ['asplenia'], '2029-06-03', allYes(3));
    expect(res.perDose[2].status).toBe('valid');
  });

  it('both doses of the 2-dose primary still count', () => {
    const res = analyzeHistory('MenACWY', twoDoses, 17, ['asplenia'], TODAY, allYes(2));
    expect(res.perDose.map(d => d.status)).toEqual(['valid', 'valid']);
  });
});

describe('M5: the 2–6-month infant series is untouched', () => {
  it('all four doses of a 2/4/6/12-month series still count as primary', () => {
    const res = analyzeHistory('MenACWY',
      [{ date: '2025-03-05' }, { date: '2025-05-05' }, { date: '2025-07-05' }, { date: '2026-01-05' }],
      17, ['asplenia'], TODAY, allYes(4));
    expect(res.perDose.map(d => d.status)).toEqual(['valid', 'valid', 'valid', 'valid']);
  });
});
