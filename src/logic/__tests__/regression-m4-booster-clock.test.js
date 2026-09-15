// M4 (2026-09-15): the booster clock has to start at the END of the primary
// series. This validator assumed every high-risk MenACWY primary series was two
// doses, so it called dose 3 a booster no matter who the patient was — and then
// demanded three years of spacing before it.
//
// For an infant that is catastrophically wrong. A baby with asplenia who starts
// MenACWY at 2 months has a FOUR-dose primary series, and doses 3 and 4 are due
// weeks apart, not years. Before this fix, a baby given the textbook series at
// 2, 4, 6 and 12 months had doses 3 and 4 both rejected:
//   "Booster given only ~2 months after the previous dose. High-risk MenACWY
//    boosters must be spaced ≥3 years. This dose is too soon and does not count."
// Two correctly given doses were voided and the parents told to repeat them.
//
// CDC child & adolescent schedule notes, "Meningococcal serogroup A,C,W,Y
// vaccination", special situations — asplenia (including sickle cell disease),
// HIV, persistent complement component deficiency, complement inhibitor use —
// Menveo (fetched live 2026-09-15):
//
//   "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and
//    12 months)"
//   "Dose 1 at age 3–6 months: 3- or 4- dose series (dose 2 [and dose 3 if
//    applicable] at least 8 weeks after previous dose until a dose is received
//    at age 7 months or older, followed by an additional dose at least 12 weeks
//    later and after age 12 months)"
//   "Dose 1 at age 7–23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"
//   "Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart"
//
// Every infant branch ends the same way: with a dose on or after the first
// birthday. That is what makes the primary series complete, and only after it
// does the booster cadence start counting.

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';

const TODAY = '2026-06-03';
// Risk confirmed at every dose, so the separate risk-at-dose prompt (a deferred
// queue item) cannot mask what is being tested here.
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

function analyze(doses, ageMonths, riskIds = ['asplenia']) {
  return analyzeHistory('MenACWY', doses, ageMonths, riskIds, TODAY, allYes(doses.length));
}

const statuses = (res) => res.perDose.map(d => d.status);
const msg = (res, i) => (res.perDose[i].reasons || []).join(' ');

describe('M4: an infant high-risk primary series is not mistaken for boosters', () => {
  // DOB ≈ 2025-01-01; patient is ~17 months old today.
  const infant4 = [
    { date: '2025-03-05' }, // ~2 months
    { date: '2025-05-05' }, // ~4 months
    { date: '2025-07-05' }, // ~6 months
    { date: '2026-01-05' }, // ~12 months
  ];

  it('all four doses of the 2/4/6/12-month series count', () => {
    const res = analyze(infant4, 17);
    expect(statuses(res)).toEqual(['valid', 'valid', 'valid', 'valid']);
    expect(res.effective).toHaveLength(4);
  });

  it('dose 3 is not called a booster', () => {
    expect(msg(analyze(infant4, 17), 2)).not.toMatch(/booster/i);
  });

  it('dose 4 is not called a booster', () => {
    expect(msg(analyze(infant4, 17), 3)).not.toMatch(/booster/i);
  });

  it('a 7–23-month start is a 2-dose primary — dose 2 after the 1st birthday counts', () => {
    // Dose 1 at ~9 months, dose 2 at ~13 months (≥12 weeks later, past age 1).
    const res = analyze([{ date: '2025-10-05' }, { date: '2026-02-05' }], 17);
    expect(statuses(res)).toEqual(['valid', 'valid']);
  });
});

describe('M4: the booster clock runs from the LAST primary dose', () => {
  // Infant series finished at ~12 months (2026-01-05). The first booster is due
  // 3 years after THAT dose — not 3 years after dose 2, and not 3 years after
  // dose 1. Patient is ~53 months (4y5m) at the 2029 dose.
  const infant4 = [
    { date: '2025-03-05' }, { date: '2025-05-05' },
    { date: '2025-07-05' }, { date: '2026-01-05' },
  ];

  it('a 5th dose 3 years after the last primary dose is a valid first booster', () => {
    const res = analyzeHistory('MenACWY',
      [...infant4, { date: '2029-01-10' }], 53, ['asplenia'], '2029-06-03', allYes(5));
    expect(res.perDose[4].status).toBe('valid');
  });

  it('a 5th dose only 1 year after the last primary dose is still too soon', () => {
    const res = analyzeHistory('MenACWY',
      [...infant4, { date: '2027-01-10' }], 29, ['asplenia'], '2027-06-03', allYes(5));
    expect(res.perDose[4].status).toBe('invalid');
    expect((res.perDose[4].reasons || []).join(' ')).toMatch(/booster/i);
  });
});

describe('M4: what must not change', () => {
  it('a ≥2y high-risk start is still a 2-dose primary, so dose 3 IS a booster', () => {
    // Dose 1 at ~5y, dose 2 eight weeks later, dose 3 only months after → booster,
    // too soon. Patient ~66 months.
    const res = analyze([{ date: '2025-09-05' }, { date: '2025-11-05' }, { date: '2026-02-05' }], 66);
    expect(res.perDose[2].status).toBe('invalid');
    expect(msg(res, 2)).toMatch(/booster/i);
  });

  it('a ≥2y high-risk dose 3 a full 5 years later is a valid booster', () => {
    const res = analyzeHistory('MenACWY',
      [{ date: '2025-09-05' }, { date: '2025-11-05' }, { date: '2030-12-05' }],
      126, ['asplenia'], '2031-06-03', allYes(3));
    expect(res.perDose[2].status).toBe('valid');
  });

  it('the 4-week floor between any two doses still applies inside the infant series', () => {
    const res = analyze([{ date: '2025-03-05' }, { date: '2025-03-19' }], 17); // 14 days
    expect(res.perDose[1].status).toBe('invalid');
  });
});
