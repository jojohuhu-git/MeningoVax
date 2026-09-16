// P0-3 (fix queue 2026-09-15): a child who completed a four-dose infant
// MenACWY series during an A/C/W/Y outbreak had doses 2, 3 and 4 declared
// "Extra dose - beyond the indicated series total" on the day they turned two.
//
// Reproduced before the fix, age 3, outbreak_acwy, doses at 2, 4, 6 and 12
// months:
//   D1 "Dose 1 of 1"; D2, D3, D4 all "Extra dose"; card "Complete for this
//   outbreak".
// The same record read at 18 months: "Dose 1 of 4 ... Dose 4 of 4", no extras.
// And the same child with only ONE dose (at 2 months), read at age 3, was
// called "Complete for this outbreak" - an unfinished series declared done,
// which is the dangerous direction to be wrong in.
//
// Cause: P0-1 and P0-2 compounding. Past 24 months the outbreak patient stopped
// being routed to the infant series (P0-1), so their total collapsed from 4 to
// the riskClass 'single' answer of 1; and the 'single' cap (P0-2) then threw
// away every dose past the first. Both are fixed in their own commits; this
// file is the regression net for the case where they met, because neither
// item's own tests would have caught it.
//
// Expected. ACIP 2020 MMWR 69(RR-9) Table 8 prints the same "2-23 mos" infant
// rows as Tables 4-6 (finding M10, already accepted in this codebase): four
// correctly spaced infant doses are a completed primary series, not one dose
// plus three surplus.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function both(ageMonths, dates, riskIds = ['outbreak_acwy']) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  return {
    rec: recommend({
      today: TODAY, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [],
      riskAtDoseAnswers: { MenACWY: answers },
    }).menacwy[0],
    perDose: analyzeHistory('MenACWY', doses, ageMonths, riskIds, TODAY, answers).perDose,
  };
}

// DOB 2023-09-15; doses at 2, 4, 6 and 12 months. Child is 3 today.
const FULL_INFANT_SERIES = ['2023-11-15', '2024-01-15', '2024-03-15', '2024-09-15'];

describe('P0-3: a completed infant outbreak series is four counted doses', () => {
  const { rec, perDose } = both(36, FULL_INFANT_SERIES);

  it('all four doses count, numbered 1 to 4', () => {
    expect(perDose.map((d) => d.effectiveDoseNum)).toEqual([1, 2, 3, 4]);
  });

  it('none is flagged as an extra dose', () => {
    expect(perDose.some((d) => d.extraDose)).toBe(false);
  });

  it('the series total is 4, not 1', () => {
    expect(rec.seriesTotal).toBe(4);
  });

  it('the card says the outbreak series is complete', () => {
    expect(rec.status).toBe('complete');
    expect(rec.doseLabel).toMatch(/outbreak/i);
  });

  it('reading the same record at 18 months gives the same four counted doses', () => {
    // The pre-fix tell: the answer changed on the second birthday and nothing
    // else. It must not.
    const at18mo = analyzeHistory(
      'MenACWY', FULL_INFANT_SERIES.map((d) => ({ date: d })),
      18, ['outbreak_acwy'], '2025-03-15', allYes(4),
    ).perDose;
    expect(at18mo.map((d) => d.effectiveDoseNum)).toEqual([1, 2, 3, 4]);
    expect(at18mo.some((d) => d.extraDose)).toBe(false);
  });
});

describe('P0-3: an UNfinished infant outbreak series is not called complete', () => {
  // One dose, at 2 months, read at age 3. Pre-fix this said "Complete for this
  // outbreak" — a child owed three more doses, told they were done.
  const { rec } = both(36, ['2023-11-15']);

  it('the card does not claim the series is complete', () => {
    expect(rec.status).not.toBe('complete');
  });

  it('it asks for dose 2 of 4', () => {
    expect(rec.doseNum).toBe(2);
    expect(rec.seriesTotal).toBe(4);
  });
});

describe('P0-3: the outbreak schedule keeps its M12 shape', () => {
  it('a completed series still has no standing booster countdown', () => {
    // Owner decision M12: the Table 8 top-up is re-exposure driven, not a
    // countdown. Fixing the dose count must not smuggle one in.
    const { rec } = both(36, FULL_INFANT_SERIES);
    expect(rec.boosterSummary ?? null).toBeNull();
    expect(rec.earliestNextDate ?? null).toBeNull();
  });
});
