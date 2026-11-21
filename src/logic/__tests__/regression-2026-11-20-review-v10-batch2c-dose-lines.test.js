// ─────────────────────────────────────────────────────────────────────────
// Review v10, Batch 2c (owner answers 2026-11-20, "Approve them all";
// docs/archive/decisions-2026-11-20-review-v10.md): the line under each
// recorded dose, P53–P66.
//
// Style rule 4 kept (owner, same day): each approved ";" became a comma (two
// short clauses: "Booster about 2 years after the last dose, 5 required") or a
// period (before a full sentence: "It counts. Dose 3 is due …"). "8 required"
// drops the unit only when it is the gap's own unit. Gaps and ages keep the
// app's "about" where the number is rounded (G1-a). Putting the line's pieces
// on one line on screen is placement item L2 (Batch 4), not this batch.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-20';
const run = (input) => recommend({ today: TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input });
const line = (r, fam, i) => (r.history[fam].perDose[i].reasons ?? []).join(' ').replace(/\s*\[c\]/g, '');
const why = (r, fam, i) => {
  const d = r.history[fam].perDose[i];
  return [...(d.whys ?? []), d.detail].filter(Boolean).join(' ').replace(/\s*\[c\]/g, '');
};
const MV = (date) => ({ brand: 'Menveo 2-vial', date });
const BX = (date) => ({ brand: 'Bexsero', date });
const TR = (date) => ({ brand: 'Trumenba', date });
const yes = (n) => Object.fromEntries([...Array(n).keys()].map((i) => [i, 'yes']));

describe('Review v10 Batch 2c: the line under each recorded dose', () => {
  it('P53: minimum interval not met, repeat, do not restart', () => {
    const r = run({ dob: '2021-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2026-09-01'), MV('2026-09-22')], riskAtDoseAnswers: { MenACWY: yes(2) } });
    const t = line(r, 'MenACWY', 1);
    expect(t).toMatch(/^Minimum interval not met \(3 weeks, 8 required\)\. Repeat (today|from [A-Z][a-z]{2} \d{1,2}, \d{4})\. Do not restart\.$/);
    // extinct: the three-part "under the 8-week minimum … Do not restart the series." wording.
    expect(t).not.toMatch(/under the 8-week minimum|restart the series/);
  });

  it('P54: not interchangeable, repeat with the first product', () => {
    const r = run({ dob: '2009-06-01', menacwyDoses: [MV('2020-07-01'), MV('2025-07-01')], menbDoses: [BX('2026-01-05'), TR('2026-08-01')] });
    const t = line(r, 'MenB', 1);
    expect(t).toMatch(/^Not interchangeable with the first MenB dose \(Bexsero\)\. Repeat with Bexsero (today|from [A-Z][a-z]{2} \d{1,2}, \d{4})\. Do not restart\.$/);
    // extinct: antigen-family names on the dose line.
    expect(t).not.toMatch(/MenB-4C|MenB-FHbp/);
  });

  it('P55: minimum age not met, unknown brand', () => {
    const r = run({ dob: '2026-09-01', riskIds: ['asplenia'], menacwyDoses: [{ brand: '', date: '2026-10-14' }] });
    expect(line(r, 'MenACWY', 0)).toMatch(/^Minimum age not met \(about 6 weeks, 2 months for an unknown brand\)\./);
  });

  it('P56 and P66: a MenACWY booster given too soon', () => {
    const r = run({ dob: '2012-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2023-06-10'), MV('2023-08-15'), MV('2025-08-15')], riskAtDoseAnswers: { MenACWY: yes(3) } });
    expect(line(r, 'MenACWY', 2)).toMatch(/^Booster about 2 years after the last dose, 5 required\./);
    expect(why(r, 'MenACWY', 2)).toContain('Interval: about 2 years. Required: 5 years.');
    // extinct: "2.1 years" false precision and "Required cadence".
    expect(line(r, 'MenACWY', 2) + why(r, 'MenACWY', 2)).not.toMatch(/2\.\d years|cadence/);
  });

  it('P57: a MenB booster given too soon', () => {
    const r = run({ dob: '2006-06-01', riskIds: ['asplenia'], menbDoses: [BX('2023-01-01'), BX('2023-02-01'), BX('2023-07-01'), BX('2024-03-01')] });
    expect(line(r, 'MenB', 3)).toMatch(/^Booster about 8 months after the series, 1 year required\./);
  });

  it('P58: healthy MenB dose 2 early, it counts', () => {
    const r = run({ dob: '2009-06-01', menacwyDoses: [MV('2020-07-01'), MV('2025-07-01')], menbDoses: [BX('2026-01-01'), BX('2026-04-01')] });
    expect(line(r, 'MenB', 1)).toBe('Given about 3 months after dose 1 (6 recommended). It counts. Dose 3 is due ≥4 months later.');
  });

  // M1 (owner, 2026-11-20): P59's "It counts" line is gone; the dose is not counted.
  it('P59 (after M1): high-risk MenB dose 3 early is not counted', () => {
    const r = run({ dob: '2006-06-01', riskIds: ['asplenia'], menbDoses: [BX('2026-01-01'), BX('2026-02-01'), BX('2026-04-10')] });
    expect(line(r, 'MenB', 2)).toMatch(/^Minimum interval not met \(about 2 months after dose 2, 4 required\)\. Also under 6 months after dose 1 \(about 3 months\)\. Repeat today\. Do not restart\.$/);
  });

  it('P60: a dose after an invalid dose', () => {
    const r = run({ dob: '2016-01-01', menacwyDoses: [MV('2025-12-01'), MV('2026-01-15')] });
    expect(line(r, 'MenACWY', 1)).toMatch(/^Given about 6 weeks after an invalid dose, 8 weeks required\./);
  });

  it('P61: MenB below its minimum age, healthy', () => {
    const r = run({ dob: '2014-06-01', menbDoses: [BX('2024-01-10')] });
    const t = line(r, 'MenB', 0);
    expect(t).toMatch(/^Minimum age not met \(10 years for Bexsero\)\./);
    expect(t).toContain('MenB is next offered at 16–23 years (shared clinical decision-making).');
  });

  it('P62 and P63: a MenACWY dose before 10, with and without the answer', () => {
    const input = { dob: '2014-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2023-07-01')] };
    expect(line(run(input), 'MenACWY', 0)).toBe('Given before 10 years. It counts toward the high-risk series only if the patient was high-risk then.');
    const answered = run({ ...input, riskAtDoseAnswers: { MenACWY: yes(1) } });
    expect(line(answered, 'MenACWY', 0)).toMatch(/^Counted: high-risk at the time \(age \d+ years?( \d+ months?)?\)\.$/);
  });

  it('P64: an undated dose', () => {
    const r = run({ dob: '2009-06-01', menacwyDoses: [{ brand: 'Menveo 2-vial', date: '' }] });
    const d = r.history.MenACWY.perDose[0];
    const all = [...(d.reasons ?? []), ...(d.whys ?? []), d.detail ?? ''].join(' ').replace(/\s*\[c\]/g, '');
    expect(all).toContain('Only dated records count. Add the date to check this dose. Until then it is not counted.');
  });

  it('P65: the same date twice', () => {
    const r = run({ dob: '2009-06-01', menacwyDoses: [MV('2020-07-01'), MV('2020-07-01')] });
    expect(line(r, 'MenACWY', 1)).toBe('Same date as an earlier dose (Jul 1, 2020), likely entered twice. Correct the date or remove this row.');
  });
});

describe('Review v10 Batch 2c: the minimum age reads as one plain age', () => {
  it('a MenACWY-history Penmenvy below 10 years says "10 years", not "10 years (120 months)"', () => {
    const r = run({ dob: '2018-06-01', menacwyDoses: [{ brand: 'Penmenvy', date: '2026-01-10' }] });
    const t = line(r, 'MenACWY', 0);
    expect(t).toMatch(/^Minimum age not met \(about 7 years( \d+ months?)?, 10 years for Penmenvy/);
    // extinct: the doubled unit, found by the 2c wording count (2026-11-20).
    expect(t).not.toMatch(/\(120 months\)/);
  });
});
