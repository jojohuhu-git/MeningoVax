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
//
// STOP C C1 (owner, 2026-11-15) SUPERSEDES the wording: an undated dose now
// never counts, so no undated row is ever "past the total" — every undated row
// reads "No date recorded — not counted". G6's point survives: the app still
// never ASSERTS that an undated dose was an extra dose, and never says the
// series was complete beside it. The tests below hold that.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';

// K1 (2026-09-24): detailsUnknown is how the clinician says "a dose was
// given, I have no date or brand for it". Without the tick the row is one
// nobody filled in, and no longer counts as a dose.
const undated = (n) => Array.from({ length: n }, () => ({ date: '', brand: '', detailsUnknown: true }));
const TEEN = 204; // 17y

describe('G6 under C1: an undated row never asserts an extra dose', () => {
  it('MenACWY: none of three undated rows counts, and none is called extra or "already complete"', () => {
    const { perDose, effective } = analyzeHistory('MenACWY', undated(3), TEEN, []);
    expect(effective).toHaveLength(0);
    for (const d of perDose) {
      expect(d.recordProblem).toBe('undated');
      expect(d.extraDose).toBeUndefined();
      const said = d.reasons.join(' ');
      expect(said).toMatch(/no date/i);
      expect(said).not.toMatch(/was already complete/i);
    }
  });

  it('MenB: the same', () => {
    const { perDose, effective } = analyzeHistory('MenB', undated(3), TEEN, []);
    expect(effective).toHaveLength(0);
    expect(perDose.every((d) => d.recordProblem === 'undated' && !d.extraDose)).toBe(true);
  });

  it('the recommendation is the same with one, two or three undated rows — and with none', () => {
    const card = (doses) => recommend({ ageMonths: TEEN, riskIds: [], menacwyDoses: doses, menbDoses: [] }).menacwy;
    const none = card([]);
    for (const n of [1, 2, 3]) {
      expect(card(undated(n)).map((r) => r.doseLabel)).toEqual(none.map((r) => r.doseLabel));
      expect(card(undated(n)).map((r) => r.status)).toEqual(none.map((r) => r.status));
    }
  });

  it('a DATED dose beyond the series still asserts it', () => {
    const doses = [
      { date: '2017-09-15', brand: 'Menveo' }, // ~11y
      { date: '2022-09-15', brand: 'Menveo' }, // ~16y booster
      { date: '2025-09-15', brand: 'Menveo' }, // genuine extra
    ];
    const { perDose } = analyzeHistory('MenACWY', doses, 20 * 12, []);
    expect(perDose[2].extraDose).toBe(true);
    expect(perDose[2].reasons.join(' ')).toMatch(/was already complete/i);
  });

  it('a dated dose sitting after an undated one is still judged on its own date', () => {
    const { perDose } = analyzeHistory(
      'MenACWY',
      [{ date: '', brand: '', detailsUnknown: true }, { date: '2025-09-15', brand: 'Menveo' }],
      20 * 12,
      []
    );
    expect(perDose[1].effectiveDoseNum).toBe(1);
  });
});
