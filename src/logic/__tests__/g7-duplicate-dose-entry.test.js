// ─────────────────────────────────────────────────────────────────────────
// G7 (2026-09-16): the same dose entered twice.
//
// Recording one shot on two rows is one of the commonest data-entry slips
// when a paper record is being copied in. The app already graded the second
// row correctly — it does not count — but explained it as an interval
// problem: "Given only 0 days after the previous dose. Minimum interval
// between any two MenACWY doses is 4 weeks", followed by "repeat this dose
// only".
//
// Every word of that is aimed at the wrong problem. Nobody gave a dose 0
// days after another; somebody typed a dose twice. And "repeat this dose"
// tells a clinician to give a shot the patient has already had.
//
// Two doses of the same vaccine are never given on the same day, so a
// repeated date inside one vaccine's list means a repeated row.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';

const DAY = '2024-01-10';
const twice = (brand = '') => [
  { date: DAY, brand },
  { date: DAY, brand },
];

describe('G7: one dose recorded on two rows', () => {
  it('MenACWY: the second row is called a repeat entry, not an interval violation', () => {
    const { perDose } = analyzeHistory('MenACWY', twice('Menveo'), 204, []);
    const said = perDose[1].reasons.join(' ');
    expect(said).toMatch(/same date|twice|already recorded/i);
    expect(said).not.toMatch(/minimum interval/i);
    expect(said).not.toMatch(/repeat this dose/i);
  });

  it('MenB: same', () => {
    // Dated after this 17-year-old's 16th birthday, so the pre-16 MenB rule
    // is not what decides the row.
    const menbTwice = [{ date: '2026-01-10', brand: 'Bexsero' }, { date: '2026-01-10', brand: 'Bexsero' }];
    const { perDose } = analyzeHistory('MenB', menbTwice, 204, ['asplenia']);
    const said = perDose[1].reasons.join(' ');
    expect(said).toMatch(/same date|twice|already recorded/i);
    expect(said).not.toMatch(/repeat this dose/i);
  });

  it('counts the shot once — the first row counts, the second does not', () => {
    const { perDose, effective } = analyzeHistory('MenACWY', twice('Menveo'), 204, []);
    expect(effective).toHaveLength(1);
    expect(perDose[0].effectiveDoseNum).toBe(1);
    expect(perDose[1].doesNotCount).toBe(true);
  });

  it('says so even when the two rows name different brands — one of them is wrong', () => {
    const { perDose } = analyzeHistory(
      'MenACWY',
      [{ date: DAY, brand: 'Menveo' }, { date: DAY, brand: 'MenQuadfi' }],
      204,
      []
    );
    const said = perDose[1].reasons.join(' ');
    expect(said).toMatch(/same date|twice|already recorded/i);
    expect(said).toMatch(/brand/i);
  });

  it('a third row on the same date is caught too', () => {
    const { perDose, effective } = analyzeHistory(
      'MenACWY',
      [{ date: DAY, brand: '' }, { date: DAY, brand: '' }, { date: DAY, brand: '' }],
      204,
      []
    );
    expect(effective).toHaveLength(1);
    expect(perDose[2].reasons.join(' ')).toMatch(/same date|twice|already recorded/i);
  });

  it('does NOT reach for two doses that are merely close together', () => {
    // A day apart is a genuine interval violation: two real visits, too close.
    // That still has to read as an interval problem, with the repeat advice.
    const { perDose } = analyzeHistory(
      'MenACWY',
      [{ date: DAY, brand: '' }, { date: '2024-01-11', brand: '' }],
      204,
      []
    );
    const said = perDose[1].reasons.join(' ');
    expect(said).toMatch(/minimum interval/i);
    expect(said).toMatch(/repeat this dose/i);
    expect(said).not.toMatch(/same date|twice/i);
  });

  it('leaves undated rows alone — with no date there is nothing to match on', () => {
    // Two undated doses are G6's problem, not this one.
    const { perDose } = analyzeHistory(
      'MenACWY',
      [{ date: '', brand: '' }, { date: '', brand: '' }],
      204,
      ['asplenia']
    );
    for (const d of perDose) {
      expect(d.reasons.join(' ')).not.toMatch(/same date|entered twice/i);
    }
  });

  it('a second row matching a dose that was itself dropped is not a duplicate', () => {
    // If the row this one would duplicate was itself dropped, there is no
    // counted dose on that date, so this is not a repeated entry.
    const { perDose, effective } = analyzeHistory(
      'MenB',
      [
        { date: '2026-01-10', brand: 'Bexsero' },
        { date: '2026-01-20', brand: 'Bexsero' }, // too soon -> dropped
        { date: '2026-01-20', brand: 'Bexsero' }, // same date as a DROPPED row
      ],
      204,
      ['asplenia']
    );
    expect(effective).toHaveLength(1);
    // Row 3 is graded against row 1 (the kept one), so it is an interval
    // problem like row 2 — not a duplicate of a row that never counted.
    expect(perDose[2].reasons.join(' ')).not.toMatch(/same date|entered twice/i);
  });
});
