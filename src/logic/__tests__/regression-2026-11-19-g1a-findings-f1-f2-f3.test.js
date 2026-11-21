// G1-a findings F1–F3 (OWNER ANSWERS 2026-11-19, all three as recommended),
// raised by the G1-a style-rules pass (PR #112). Each with the worked patient
// she was shown and a control that differs only in the point decided.
//
// F1 — exact gap. Where the rounded gap would print the minimum itself ("about
//   4 months after the early dose 2, under the 4-month minimum"), the line
//   prints the exact months and days. Other gaps keep "about".
// F2 — "rescue" dropped from the card too (the dose line dropped it at G1-a,
//   packet L5). ACIP Oct 2024 (refs `menbRescueDoseRule`): "a third dose should
//   be administered ≥4 months after the second dose".
// F3 — a too-soon booster line ends at "Repeat from <date>." A booster has no
//   series to restart, so "Do not restart the series." goes, on booster lines only.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-09-15';
const B = (date) => ({ date, brand: 'Bexsero' });
const M = (date) => ({ date, brand: 'Menveo 2-vial' });
const run = (input) => recommend({ today: TODAY, riskIds: [], menacwyDoses: [], menbDoses: [], ...input });
const HEALTHY_19 = { dob: '2007-09-15' };

describe('F1: the exact gap where rounding would print the minimum', () => {
  it('healthy 19 y, Bexsero Aug 11 + Sep 10, 2025, dose 3 Dec 29, 2025 (3 months 19 days after dose 2)', () => {
    const d = run({ ...HEALTHY_19, menbDoses: [B('2025-08-11'), B('2025-09-10'), B('2025-12-29')] }).history.MenB.perDose[2];
    expect(d.status).toBe('invalid');
    expect(d.reasons[0]).toBe('Minimum interval not met (3 months 19 days, 4 months required).')   // P53 sibling (review v10); F1's exact gap kept;
    expect(d.detail).toBe('D2→D3: 3 months 19 days (minimum 4 months).');
  });

  it('control: dose 3 on Nov 10, 2025 (2 months after dose 2) keeps "about"', () => {
    const d = run({ ...HEALTHY_19, menbDoses: [B('2025-08-11'), B('2025-09-10'), B('2025-11-10')] }).history.MenB.perDose[2];
    expect(d.reasons[0]).toBe('Minimum interval not met (about 2 months, 4 required).');
  });
});

describe('F2: no "rescue" on the card', () => {
  it('healthy 19 y, Bexsero Aug 11 + Sep 10, 2025: title "Dose 3 of 3 (dose 2 given early)"', () => {
    const c = run({ ...HEALTHY_19, menbDoses: [B('2025-08-11'), B('2025-09-10')] }).menb[0];
    expect(c.doseLabel).toBe('Dose 3 of 3 (dose 2 given early)');
  });

  it('healthy 19 y, one Bexsero: the "Why this" says "a third dose"', () => {
    const c = run({ ...HEALTHY_19, menbDoses: [B('2025-09-15')] }).menb[0];
    expect(c.note.detail).toContain('If dose 2 is given earlier than that, a third dose is needed at least 4 months after it [c].');
    // extinct: "rescue" left the card's words with owner F2, 2026-11-19.
    expect(c.note.detail).not.toMatch(/rescue/i);
  });

  it('control: Bexsero 6 months apart is "Complete (2-dose series)"', () => {
    const c = run({ ...HEALTHY_19, menbDoses: [B('2025-08-11'), B('2026-02-11')] }).menb[0];
    expect(c.doseLabel).toBe('Complete (2-dose series)');
  });
});

describe('F3: a too-soon booster line ends at the date', () => {
  it('adult microbiologist, Menveo Apr 8 then Jun 3, 2026 (8 weeks)', () => {
    const d = run({ dob: '1990-01-01', riskIds: ['microbiologist'], menacwyDoses: [M('2026-04-08'), M('2026-06-03')] }).history.MenACWY.perDose[1];
    expect(d.reasons).toEqual([
      'Booster 8 weeks after the last dose, 5 years required.',   // P56 (review v10)
      'Repeat from Jun 3, 2031.',
    ]);
  });

  it('control: asplenia adult, dose 2 three weeks after dose 1 keeps "Do not restart."', () => {
    const d = run({ dob: '1990-01-01', riskIds: ['asplenia'], menacwyDoses: [M('2026-07-01'), M('2026-07-22')] }).history.MenACWY.perDose[1];
    expect(d.reasons.at(-1)).toBe('Do not restart.');
    expect(d.reasons.at(-2)).toBe('Repeat from Sep 16, 2026.');
  });
});
