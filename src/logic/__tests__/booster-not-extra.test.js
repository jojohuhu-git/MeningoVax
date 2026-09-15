// ─────────────────────────────────────────────────────────────────────────
// booster-not-extra.test.js — the safety-net test called for in the
// 2026-09-14 dose-counter handoff, written before F2's capping code: a
// legitimate booster (a valid dose past the primary-series total, on a
// schedule with an ongoing booster phase) must NEVER be relabeled "extra."
// seriesTotal deliberately excludes boosters (RecCard.jsx C2 2026-07-24),
// so a high-risk patient on their 4th lifelong booster has doseNum 4
// against total 2 — correct, not a bug. A careless F2 clamp could call
// that "extra" and wrongly tell a patient to stop boosting.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-09-14';
function yearsAgo(y) { return addDays(TODAY, -Math.round(y * 365.25)); }

describe('boosters are never mislabeled "extra"', () => {
  it('high-risk MenACWY: 2-dose primary + 2 boosters (4 total) — none flagged extraDose', () => {
    const am = 40 * 12;
    const riskIds = ['asplenia'];
    const doses = [
      { date: yearsAgo(12), brand: 'Menveo (MenACWY)' }, // primary D1
      { date: yearsAgo(11.8), brand: 'Menveo (MenACWY)' }, // primary D2, >=8wk later
      { date: yearsAgo(6), brand: 'Menveo (MenACWY)' }, // 1st booster
      { date: yearsAgo(1), brand: 'Menveo (MenACWY)' }, // 2nd booster
    ];
    const analysis = analyzeHistory('MenACWY', doses, am, riskIds, TODAY);
    expect(analysis.perDose.every((d) => !d.extraDose)).toBe(true);
    expect(analysis.effective.length).toBe(4);
    expect(analysis.perDose[3].effectiveDoseNum).toBe(4);

    const result = recommend({ today: TODAY, ageMonths: am, riskIds, menacwyDoses: doses, menbDoses: [] });
    expect(result.menacwy[0].seriesTotal).toBe(2); // primary total unchanged, boosters excluded by design
    expect(result.menacwy[0].status).toBe('risk-based'); // still in the ongoing-booster phase, not "complete"
  });

  it('high-risk MenB: 3-dose primary + 2 boosters (5 total) — none flagged extraDose', () => {
    const am = 30 * 12;
    const riskIds = ['complement'];
    const doses = [
      { date: yearsAgo(6), brand: 'Bexsero (MenB)' },
      { date: yearsAgo(5.9), brand: 'Bexsero (MenB)' },
      { date: yearsAgo(5.3), brand: 'Bexsero (MenB)' },
      { date: yearsAgo(4), brand: 'Bexsero (MenB)' }, // 1st booster, >=1y after primary
      { date: yearsAgo(1.5), brand: 'Bexsero (MenB)' }, // 2nd booster, >=2y later
    ];
    const analysis = analyzeHistory('MenB', doses, am, riskIds, TODAY);
    expect(analysis.perDose.every((d) => !d.extraDose)).toBe(true);
    expect(analysis.effective.length).toBe(5);

    const result = recommend({ today: TODAY, ageMonths: am, riskIds, menacwyDoses: [], menbDoses: doses });
    expect(result.menb[0].seriesTotal).toBe(3);
  });

  it('MenACWY travel (single+boost): 1 dose + 3 five-yearly boosters — none flagged extraDose', () => {
    const am = 50 * 12;
    const riskIds = ['travel'];
    const doses = [
      { date: yearsAgo(15), brand: 'Menveo (MenACWY)' },
      { date: yearsAgo(10), brand: 'Menveo (MenACWY)' },
      { date: yearsAgo(5), brand: 'Menveo (MenACWY)' },
      { date: yearsAgo(0.5), brand: 'Menveo (MenACWY)' },
    ];
    const analysis = analyzeHistory('MenACWY', doses, am, riskIds, TODAY);
    expect(analysis.perDose.every((d) => !d.extraDose)).toBe(true);
    expect(analysis.effective.length).toBe(4);

    const result = recommend({ today: TODAY, ageMonths: am, riskIds, menacwyDoses: doses, menbDoses: [] });
    expect(result.menacwy[0].seriesTotal).toBe(1);
  });

  it('routine (healthy) MenACWY with only 2 legitimate doses is NOT flagged extra', () => {
    const am = 20 * 12;
    const doses = [
      { date: yearsAgo(9), brand: 'Menveo (MenACWY)' }, // ~11y
      { date: yearsAgo(4), brand: 'Menveo (MenACWY)' }, // ~16y booster
    ];
    const analysis = analyzeHistory('MenACWY', doses, am, [], TODAY);
    expect(analysis.perDose.every((d) => !d.extraDose)).toBe(true);
    expect(analysis.perDose[1].effectiveDoseNum).toBe(2);
  });

  it('routine (healthy) MenACWY: a genuine 3rd dose beyond the 2-dose series IS extraDose (no booster phase)', () => {
    const am = 20 * 12;
    const doses = [
      { date: yearsAgo(9), brand: 'Menveo (MenACWY)' },  // ~11y
      { date: yearsAgo(4), brand: 'Menveo (MenACWY)' },  // ~16y booster
      { date: yearsAgo(1), brand: 'Menveo (MenACWY)' },  // extra — routine schedule has no ongoing boosters
    ];
    const analysis = analyzeHistory('MenACWY', doses, am, [], TODAY);
    expect(analysis.perDose[2].extraDose).toBe(true);
    expect(analysis.perDose[2].effectiveDoseNum).toBeNull();
    expect(analysis.effective.length).toBe(2);
  });
});
