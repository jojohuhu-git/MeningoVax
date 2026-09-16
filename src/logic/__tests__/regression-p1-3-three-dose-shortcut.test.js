// P1-3 (fix queue 2026-09-15): the three-dose shortcut promised three doses and
// then asked for a fourth.
//
// Reproduced: asplenia, dose 1 at 4 months, dose 2 at 8 months.
//   at 10 months the card read "Dose 3 of 3 (infant high-risk, 3-dose shortcut)"
//   give that third dose at 12 months, and at 18 months the card read
//   "Dose 4 (infant high-risk series)", due today, total 4.
// menacwyPrimaryTotal returned 4 for these patients throughout, so the
// validator never believed the shortcut either.
//
// SOURCE, fetched live 2026-09-15 (CDC child & adolescent immunization schedule
// notes, "Meningococcal serogroup A,C,W,Y vaccination", Special situations,
// Menveo). Verbatim:
//
//   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and
//    12 months)"
//   "Dose 1 at age 3–6 months: 3- or 4- dose series (dose 2 [and dose 3 if
//    applicable] at least 8 weeks after previous dose until a dose is received
//    at age 7 months or older, followed by an additional dose at least 12 weeks
//    later and after age 12 months)"
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// Two owner decisions, 2026-09-15:
//
//  1. For a 3–6-month start, three doses completes the series. The card, the
//     follow-up card and the validator must all say 3.
//  2. The shortcut was also being offered to a 2-MONTH start, which CDC gives a
//     flat 4-dose series. It is now restricted to a 3–6-month start, following
//     CDC. vaxapp has the same 2-month behaviour and is to be brought into
//     line in its own PR (cross-repo; vaccine-parity skill) — the two apps
//     diverge until that lands, knowingly.
//
// The shortcut's own condition is now ENFORCED, not merely promised: that final
// dose must be ≥12 weeks after dose 2 AND after age 12 months. Before this, the
// validator applied only the 4-week baseline to it, so a third dose given at 10
// months would have closed a 3-dose series early — which is exactly the harm
// shortening the series could otherwise introduce.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { menacwyInfantHighRiskTotal, menacwyPrimaryTotal } from '../seriesTotals.js';

const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const acwy = (today, ageMonths, dates) => recommend({
  today, ageMonths, riskIds: ['asplenia'],
  menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(dates.length) },
}).menacwy[0];

// DOB 2025-06-15. D1 at 4 months (2025-10-15), D2 at 8 months (2026-02-15).
const D1_AT_4MO = '2025-10-15';
const D2_AT_8MO = '2026-02-15';

describe('P1-3: the series total agrees with itself from start to finish', () => {
  it('menacwyInfantHighRiskTotal returns 3 for a 3-6mo start with dose 2 at >=7mo', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 4, d2AgeM: 8 })).toBe(3);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 3, d2AgeM: 7 })).toBe(3);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 6, d2AgeM: 9 })).toBe(3);
  });

  it('a 3-6mo start whose dose 2 came before 7 months is still a 4-dose series', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 4, d2AgeM: 6 })).toBe(4);
  });

  it('a 2-MONTH start is a flat 4-dose series, shortcut or not (CDC)', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: 8 })).toBe(4);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: 4 })).toBe(4);
  });

  it('a 7-23mo start is unchanged at 2 doses', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 9, d2AgeM: 13 })).toBe(2);
  });

  it('an unknown dose-2 age falls back conservatively to 4', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 4, d2AgeM: null })).toBe(4);
  });

  it('the validator agrees with the engine for a shortcut patient', () => {
    expect(menacwyPrimaryTotal({ riskClass: 'primary2', d1AgeM: 4, d2AgeM: 8 })).toBe(3);
  });
});

describe('P1-3: the card that promises three doses is followed by a card that agrees', () => {
  it('at 10 months the card offers dose 3 of 3', () => {
    const r = acwy('2026-04-15', 10, [D1_AT_4MO, D2_AT_8MO]);
    expect(r.doseNum).toBe(3);
    expect(r.seriesTotal).toBe(3);
  });

  it('after that third dose, the series is complete — no fourth is asked for', () => {
    // D3 at 12 months (2026-06-15): >=12 weeks after D2 and after the 1st birthday.
    const r = acwy('2026-12-15', 18, [D1_AT_4MO, D2_AT_8MO, '2026-06-15']);
    expect(r.doseLabel).not.toMatch(/^Dose 4/);
    expect(r.seriesTotal).toBe(3);
  });

  it('the next thing offered is the first booster, three years on', () => {
    const r = acwy('2026-12-15', 18, [D1_AT_4MO, D2_AT_8MO, '2026-06-15']);
    expect(r.doseLabel).toMatch(/first booster/i);
    expect(r.earliestNextDate).toBe('2029-06-15');
  });

  it('all three doses count, none flagged as extra', () => {
    const doses = [D1_AT_4MO, D2_AT_8MO, '2026-06-15'].map((d) => ({ date: d }));
    const perDose = analyzeHistory('MenACWY', doses, 18, ['asplenia'], '2026-12-15', allYes(3)).perDose;
    expect(perDose.map((d) => d.effectiveDoseNum)).toEqual([1, 2, 3]);
    expect(perDose.some((d) => d.extraDose)).toBe(false);
  });
});

describe('P1-3: a 2-month start keeps its full four doses', () => {
  // DOB 2025-06-15, D1 at 2 months (2025-08-15), D2 at 8 months (2026-02-15).
  it('the card asks for dose 3 of 4, not dose 3 of 3', () => {
    const r = acwy('2026-04-15', 10, ['2025-08-15', '2026-02-15']);
    expect(r.seriesTotal).toBe(4);
    expect(r.doseLabel).not.toMatch(/shortcut/i);
  });

  it('and a fourth dose is still owed after the third', () => {
    const r = acwy('2026-12-15', 18, ['2025-08-15', '2026-02-15', '2026-06-15']);
    expect(r.seriesTotal).toBe(4);
    expect(r.doseNum).toBe(4);
  });
});

describe('P1-3: the shortcut condition is enforced, not just promised', () => {
  // CDC requires that final dose "at least 12 weeks later and after age 12
  // months". Without this check, shortening the series to 3 would let a third
  // dose given too early close it.
  it('a third dose before the first birthday does not count', () => {
    // D3 at 10.5 months (2026-05-01): >=12 weeks after D2 but BEFORE 12 months.
    const doses = [D1_AT_4MO, D2_AT_8MO, '2026-05-01'].map((d) => ({ date: d }));
    const perDose = analyzeHistory('MenACWY', doses, 18, ['asplenia'], '2026-12-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('invalid');
    expect((perDose[2].reasons || []).join(' ')).toMatch(/12 months|first birthday/i);
  });

  it('a third dose less than 12 weeks after dose 2 does not count', () => {
    // D3 at 2026-04-01: after 12 months? no — but also only ~6 weeks after D2.
    const doses = [D1_AT_4MO, D2_AT_8MO, '2026-03-29'].map((d) => ({ date: d }));
    const perDose = analyzeHistory('MenACWY', doses, 18, ['asplenia'], '2026-12-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('invalid');
  });

  it('and the card then still asks for dose 3 of 3', () => {
    const r = acwy('2026-12-15', 18, [D1_AT_4MO, D2_AT_8MO, '2026-05-01']);
    expect(r.doseNum).toBe(3);
    expect(r.seriesTotal).toBe(3);
  });

  it('control: a correctly timed third dose is valid', () => {
    const doses = [D1_AT_4MO, D2_AT_8MO, '2026-06-15'].map((d) => ({ date: d }));
    const perDose = analyzeHistory('MenACWY', doses, 18, ['asplenia'], '2026-12-15', allYes(3)).perDose;
    expect(perDose[2].status).toBe('valid');
  });
});
