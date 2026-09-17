// U3 (2026-09-17): the recorded-dose rows repeated a 154-character sentence.
//
// On a four-dose infant series where the clinician had answered the risk-timing
// question, every counted row read:
//
//   "Counted toward the high-risk series: confirmed the patient was already
//    high-risk on ~9 weeks (this dose's date), in response to the risk-timing
//    question."
//
// -- four times, about twelve lines, differing only in the age. Two thirds of
// each sentence was the same on every row, and the part that was not was the
// only part the reader needed.
//
// What the row already shows, without any prose: a chip saying "Dose 1 of 4"
// (so "counted toward the series" is the chip's own meaning), the dose's date,
// and an "Edit" button that reopens the risk-timing question (so "in response
// to the risk-timing question" is that button, spelled out).
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { TEST_TODAY } from '../../test-today.js';

const answered = { 0: 'yes', 1: 'yes', 2: 'yes', 3: 'yes' };

// A four-dose infant MenACWY series, every dose given before age 10 and every
// risk-timing question answered "yes" -- the shape that produced four copies.
const INFANT_DOSES = [
  { date: '2025-09-15' }, { date: '2025-11-17' },
  { date: '2026-01-19' }, { date: '2026-08-15' },
];
const infantRows = () =>
  analyzeHistory('MenACWY', INFANT_DOSES, 14, ['asplenia'], TEST_TODAY, answered).perDose;

// The MenB mirror of the same sentence (validate.js has two copies of it).
// MenB's own ambiguous window is 10 to 16 years (the product floor to the
// routine age), so these two doses land at ~12y6m and ~13y for a 17y6m patient.
const MENB_DOSES = [{ date: '2021-09-15' }, { date: '2022-03-15' }];
const menbRows = () =>
  analyzeHistory('MenB', MENB_DOSES, 210, ['asplenia'], TEST_TODAY, { 0: 'yes', 1: 'yes' }).perDose;

const reasonsOf = (rows) => rows.flatMap((r) => r.reasons || []);

describe('U3 · a counted dose states only what is true of THAT dose', () => {
  it('the MenACWY verdict fits on a line instead of running to three', () => {
    for (const reason of reasonsOf(infantRows())) {
      expect(reason.length, `too long to sit on one row: ${reason}`).toBeLessThanOrEqual(60);
    }
  });

  it('the MenB verdict is shortened the same way', () => {
    for (const reason of reasonsOf(menbRows())) {
      expect(reason.length, `too long to sit on one row: ${reason}`).toBeLessThanOrEqual(60);
    }
  });

  it('drops the clause the "Edit" button on the same row already says', () => {
    for (const reason of [...reasonsOf(infantRows()), ...reasonsOf(menbRows())]) {
      expect(reason).not.toMatch(/in response to the risk-timing question/i);
      expect(reason).not.toMatch(/this dose's date/i);
    }
  });

  it('keeps the one fact that differs between rows — the confirmed age', () => {
    const ages = infantRows().map((r) => (r.reasons || [])[0]);
    expect(ages).toHaveLength(4);
    expect(ages[0]).toMatch(/9 weeks/);
    expect(ages[1]).toMatch(/4 months/);
    expect(ages[2]).toMatch(/6 months/);
    expect(ages[3]).toMatch(/13 months/);
    // Still says WHY the dose counts, just not at four times the length.
    for (const a of ages) expect(a).toMatch(/high risk confirmed/i);
  });

  it('the whole recorded-doses block shrinks by more than half', () => {
    const total = reasonsOf(infantRows()).join(' ').length;
    expect(total, `four rows still total ${total} characters`).toBeLessThan(616 / 2);
  });
});
