// ─────────────────────────────────────────────────────────────────────────
// Review v10, Batch 3 (owner answers 2026-11-20, "Approve them all";
// docs/archive/decisions-2026-11-20-review-v10.md): the dose title on each
// card, P12–P21. These are card titles (`doseLabel`), not the closed chip list
// beside recorded doses (`doseChipLabel.js`), which this batch does not touch.
//
// Found while building: outbreakWording() adds "if outbreak risk continues" to
// a title only when it starts with "Booster". "First booster (dose 3), …" must
// keep that caveat, so the check now takes both. Guarded below.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-20';
const run = (input) => recommend({ today: TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input });
const MV = (date) => ({ brand: 'Menveo 2-vial', date });
const BX = (date) => ({ brand: 'Bexsero', date });
const yes = (n) => Object.fromEntries([...Array(n).keys()].map((i) => [i, 'yes']));

describe('Review v10 Batch 3: card titles', () => {
  it('P12: catch-up at 19–21 years', () => {
    expect(run({ dob: '2006-06-01' }).menacwy[0].doseLabel).toBe('Dose 1 (catch-up, 19–21y)');
  });

  it('P13: travel or lab, one dose with boosters', () => {
    expect(run({ dob: '2000-06-01', riskIds: ['travel'] }).menacwy[0].doseLabel).toBe('Dose 1 (boosters while at risk)');
  });

  it('P14: infant high-risk on the three-dose path', () => {
    const r = run({ dob: '2025-10-01', riskIds: ['asplenia'], menacwyDoses: [MV('2025-12-01')], riskAtDoseAnswers: { MenACWY: yes(1) } });
    expect(r.menacwy[0].doseLabel).toBe('Dose 2 of 3 (infant high-risk, dose 2 at ≥7 months)');
  });

  it('P15 and P16: MenB titles name the product', () => {
    const d2 = run({ dob: '2009-06-01', menacwyDoses: [MV('2020-07-01'), MV('2025-07-01')], menbDoses: [BX('2026-04-01')] }).menb[0];
    expect(d2.doseLabel).toBe('Dose 2 of 2 (Bexsero)');
    const d4 = run({ dob: '2006-06-01', riskIds: ['asplenia'], menbDoses: [BX('2026-01-01'), BX('2026-02-01'), BX('2026-04-10')] }).menb[0];
    // M1 (owner, 2026-11-20): no "Dose 4 of 4" card; the early dose 3 is repeated.
    expect(d4.doseLabel).toBe('Dose 3 of 3 (high-risk, Bexsero)');
  });

  it('P17 and P19: MenACWY high-risk boosters', () => {
    const first = run({ dob: '2012-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2020-07-01'), MV('2020-09-01')], riskAtDoseAnswers: { MenACWY: yes(2) } }).menacwy[0];
    expect(first.doseLabel).toBe('First booster (dose 3), 5 years after the series');
    const later = run({ dob: '2000-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2010-07-01'), MV('2010-09-01'), MV('2015-09-01'), MV('2020-09-01')], riskAtDoseAnswers: { MenACWY: yes(4) } }).menacwy[0];
    expect(later.doseLabel).toBe('Booster (dose 5), 5 years after the last');
  });

  it('P18: the first travel booster after one dose', () => {
    const r = run({ dob: '2021-06-01', riskIds: ['travel'], menacwyDoses: [MV('2023-07-01')] }).menacwy[0];
    expect(r.doseLabel).toBe('First booster (dose 2), 3 years after dose 1');
  });

  it('P20: a later MenB booster', () => {
    const r = run({ dob: '2000-06-01', riskIds: ['asplenia'], menbDoses: [BX('2020-01-01'), BX('2020-02-01'), BX('2020-07-01'), BX('2021-07-01')] }).menb[0];
    expect(r.doseLabel).toBe('Booster (dose 5), 2–3 years after the last');
  });

  it('P21: MenB before 10 years', () => {
    expect(run({ dob: '2018-06-01', riskIds: ['asplenia'] }).menb[0].doseLabel).toBe('Not yet due (from 10 years)');
  });

  it('the A/C/W/Y outbreak caveat still reaches a first booster', () => {
    // An infant who finished the series for an A/C/W/Y outbreak (outbreak is the only booster reason).
    const r = run({ dob: '2022-01-01', riskIds: ['outbreak_acwy'], menacwyDoses: [MV('2022-03-01'), MV('2022-05-01'), MV('2022-07-01'), MV('2023-01-05')] }).menacwy[0];
    expect(r.doseLabel).toBe('First booster (dose 5), 3 years after the series for this outbreak');
  });

  it('no card title says "primary", "shortcut", "extra dose", "ongoing-risk" or an antigen family', () => {
    const titles = [];
    for (const riskIds of [['asplenia'], ['travel'], ['microbiologist'], ['outbreak_acwy'], []]) {
      for (const dob of ['2025-10-01', '2021-06-01', '2012-06-01', '2000-06-01']) {
        for (const menbDoses of [[], [BX('2026-04-01')]]) {
          const out = run({ dob, riskIds, menbDoses, menacwyDoses: [MV('2023-07-01')], riskAtDoseAnswers: { MenACWY: yes(1), MenB: yes(1) } });
          for (const c of [...out.menacwy, ...out.menb]) titles.push(c.doseLabel);
        }
      }
    }
    // extinct: the retired title words (review v10, 2026-11-20).
    for (const t of titles) expect(t).not.toMatch(/after primary|primary dose|shortcut|extra dose|ongoing-risk|\(4C\)|\(FHbp\)|, 4C\)|, FHbp\)|age-eligible/);
  });
});
