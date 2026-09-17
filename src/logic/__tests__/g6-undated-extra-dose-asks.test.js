// ─────────────────────────────────────────────────────────────────────────
// G6 (2026-09-16): an UNDATED dose past the series total must ask, not
// assert. Owner decision, 2026-09-16 — her sentence: "Do you mean this was
// an extra dose given?"
//
// A dose with no date cannot be placed in time, so the app cannot know
// whether it is a genuine extra dose or an ordinary series dose whose date
// is missing off a paper record — and old paper records routinely carry
// several undated doses. Today it asserts the first reading: "Given after
// the 1-dose series was already complete: this dose does not extend the
// series."
//
// On a healthy 17-year-old that assertion also contradicts the card it sits
// on, which says the age-16 booster is still due. Both cannot be true.
//
// What does NOT change: a DATED dose that genuinely exceeds the total keeps
// the assertive chip (pinned by booster-not-extra.test.js and others), and
// the undated dose still does not count. Nothing about the recommendation
// moves either way — it is identical with one, two or three undated doses.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';

const undated = (n) => Array.from({ length: n }, () => ({ date: '', brand: '' }));
const TEEN = 204; // 17y

describe('G6: an undated dose past the series total asks instead of asserting', () => {
  it('MenACWY: the second undated dose puts the question, and does not assert', () => {
    const { perDose } = analyzeHistory('MenACWY', undated(2), TEEN, []);
    const said = perDose[1].reasons.join(' ');
    expect(said).toMatch(/do you mean this was an extra dose given\?/i);
    expect(said).not.toMatch(/was already complete/i);
    expect(said).toMatch(/no date/i);
  });

  it('MenB: the third undated dose does the same', () => {
    const { perDose } = analyzeHistory('MenB', undated(3), TEEN, []);
    expect(perDose[2].reasons.join(' ')).toMatch(/do you mean this was an extra dose given\?/i);
  });

  it('marks the row as an unverified extra, so the card can label it as a question', () => {
    const { perDose } = analyzeHistory('MenACWY', undated(2), TEEN, []);
    expect(perDose[1].extraDose).toBe(true);
    expect(perDose[1].extraDoseUnverified).toBe(true);
  });

  it('still does not count the dose — asking changes the wording, not the arithmetic', () => {
    const { perDose, effective } = analyzeHistory('MenACWY', undated(2), TEEN, []);
    expect(perDose[1].effectiveDoseNum).toBeNull();
    expect(effective).toHaveLength(1);

    // And the recommendation is the same as with a single undated dose, which
    // is why no answer has to be stored: nothing downstream depends on it.
    const one = recommend({ ageMonths: TEEN, riskIds: [], menacwyDoses: undated(1), menbDoses: [] });
    const two = recommend({ ageMonths: TEEN, riskIds: [], menacwyDoses: undated(2), menbDoses: [] });
    expect(two.menacwy.map(r => r.doseLabel)).toEqual(one.menacwy.map(r => r.doseLabel));
    expect(two.menacwy.map(r => r.status)).toEqual(one.menacwy.map(r => r.status));
  });

  it('a DATED dose beyond the series still asserts — this is scoped to undated rows', () => {
    const doses = [
      { date: '2017-09-15', brand: 'Menveo' }, // ~11y
      { date: '2022-09-15', brand: 'Menveo' }, // ~16y booster
      { date: '2025-09-15', brand: 'Menveo' }, // genuine extra
    ];
    const { perDose } = analyzeHistory('MenACWY', doses, 20 * 12, []);
    expect(perDose[2].extraDose).toBe(true);
    expect(perDose[2].extraDoseUnverified).toBeUndefined();
    expect(perDose[2].reasons.join(' ')).toMatch(/was already complete/i);
    expect(perDose[2].reasons.join(' ')).not.toMatch(/do you mean/i);
  });

  it('a dated dose sitting after undated ones is still judged on its own date', () => {
    // The undated row is the one that cannot be placed; a dated row beside it
    // is not made uncertain by its neighbour.
    const { perDose } = analyzeHistory(
      'MenACWY',
      [{ date: '', brand: '' }, { date: '2025-09-15', brand: 'Menveo' }],
      20 * 12,
      []
    );
    expect(perDose.find(d => d.extraDoseUnverified)).toBeUndefined();
  });
});
