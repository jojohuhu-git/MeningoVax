// B5: booster-interval wording must state the specific cadence (3 years or
// 5 years) rather than the blanket "3–5 years" whenever the data determines
// it.
//
// NOTE: the high-risk INFANT pathway's own "series complete -> recurring
// booster" branch (recommend.js menacwyInfantHighRisk) is only reached while
// the patient's CURRENT age is <2 years (the am < M.y2 gate). By the time any
// booster is actually due (>=3 years after completing the primary series
// around 12 months), the patient is necessarily >2 years old, so that branch
// is unreachable through the public recommend() API for any realistic
// patient. Its wording was still corrected for consistency/future-proofing,
// but is not (and cannot honestly be) covered by an integration test here.
//
// The reachable, testable case is the ADULT high-risk 2-dose-primary path
// (recommend.js menacwyRec, given >= 2 branch), which previously always said
// "if completed before age 7 (otherwise 5 years)" even after dose 2's age was
// already known and the cadence was already determined.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const acwy = (r) => r.menacwy[0];

describe('B5: adult high-risk MenACWY booster cadence wording', () => {
  it('states "3 years" (not "3-5 years") once dose 2 is known to have been given before age 7', () => {
    const r = recommend({
      today: '2031-01-01',
      ageMonths: 156, // 13y
      riskIds: ['asplenia'],
      menacwyDoses: [
        { date: '2023-01-01', ageMonths: 60 }, // 5y
        { date: '2023-03-01', ageMonths: 62 }, // 5y2m — primary complete <7y
      ],
    });
    expect(acwy(r).doseLabel).toMatch(/first booster, 3 years after primary/);
    expect(acwy(r).note).toMatch(/first booster is due 3 years/i);
    expect(acwy(r).doseLabel).not.toMatch(/3–5 years/);
    expect(acwy(r).note).not.toMatch(/3–5 years/);
  });

  it('states "5 years" (not "3-5 years") once dose 2 is known to have been given at/after age 7', () => {
    const r = recommend({
      today: '2031-01-01',
      ageMonths: 216, // 18y
      riskIds: ['asplenia'],
      menacwyDoses: [
        { date: '2023-01-01', ageMonths: 96 }, // 8y
        { date: '2023-03-01', ageMonths: 98 }, // 8y2m — primary complete >=7y
      ],
    });
    expect(acwy(r).doseLabel).toMatch(/first booster, 5 years after primary/);
    expect(acwy(r).note).toMatch(/first booster is due 5 years/i);
    expect(acwy(r).doseLabel).not.toMatch(/3–5 years/);
    expect(acwy(r).note).not.toMatch(/3–5 years/);
  });

  it('subsequent boosters (after the first) say "every 5 years", not "3-5 years"', () => {
    const r = recommend({
      today: '2034-01-01',
      ageMonths: 192, // 16y
      riskIds: ['asplenia'],
      menacwyDoses: [
        { date: '2023-01-01', ageMonths: 60 },
        { date: '2023-03-01', ageMonths: 62 },
        { date: '2026-03-01', ageMonths: 98 }, // first booster, 3y after D2
      ],
    });
    expect(acwy(r).doseLabel).toMatch(/every 5 years/);
    expect(acwy(r).note).toMatch(/every 5 years/);
    expect(acwy(r).doseLabel).not.toMatch(/3–5 years/);
    expect(acwy(r).note).not.toMatch(/3–5 years/);
  });
});
