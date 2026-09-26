// ─────────────────────────────────────────────────────────────────────────
// K1 (2026-09-24): a row nobody filled in is not an injection.
//
// Clicking "+ Add dose" creates an empty row — no date, no brand — and the
// clinician is expected to type into it. Until they do, that row said
// nothing about any injection. The engine, however, filtered out only
// null/undefined rows, so an untouched row reached the walk and was
// recorded as a real dose whose date happens to be unknown.
//
// Measured before the fix, for a 14-year-old with no history:
//   no rows        | counted: 0 | statuses: []
//   one BLANK row  | counted: 1 | statuses: ["unknown"]
//   two BLANK rows | counted: 2 | statuses: ["unknown","unknown"]
//
// The visible consequence: adding one blank row moved a healthy
// 16-year-old's MenACWY card from "catch-up" to "due" — a recommendation
// change caused by a row the clinician had not typed a single character
// into.
//
// What deliberately does NOT change: a row with a brand but no date. That
// is a real injection whose date the clinician does not have, and the
// engine already grades it correctly ("Unknown date → counts"). Only a
// completely untouched row is ignored.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { isBlankDoseRow } from '../doseIdentity.js';
import { TEST_TODAY } from '../../test-today.js';

const blank = () => ({ date: '', brand: '' });
const TEEN14 = 168;  // 14y against the pinned test clock
const TEEN16 = 192;  // 16y

const history = (vaccine, doses, ageMonths = TEEN14) =>
  analyzeHistory(vaccine, doses, ageMonths, [], TEST_TODAY);

describe('K1: the shared predicate for an untouched row', () => {
  it('does NOT call a row blank once the clinician ticks "details unknown"', () => {
    expect(isBlankDoseRow({ id: 'd7', date: '', brand: '', detailsUnknown: true })).toBe(false);
  });

  it('does NOT call a row blank when it carries an age at the dose', () => {
    // A record with no dates can still say how old the patient was; the engine
    // reads dose.ageMonths. Dropping such a row would delete a real dose.
    expect(isBlankDoseRow({ ageMonths: 132 })).toBe(false);
  });

  it('calls a row with neither a date nor a brand blank', () => {
    expect(isBlankDoseRow({ date: '', brand: '' })).toBe(true);
    expect(isBlankDoseRow({ id: 'd7', date: '', brand: '' })).toBe(true);
    expect(isBlankDoseRow(null)).toBe(true);
    expect(isBlankDoseRow(undefined)).toBe(true);
  });

  it('does NOT call a half-filled row blank — either field is enough', () => {
    expect(isBlankDoseRow({ date: '2020-01-01', brand: '' })).toBe(false);
    expect(isBlankDoseRow({ date: '', brand: 'bexsero' })).toBe(false);
  });
});

describe('K1: the engine reads a blank row as no row at all', () => {
  for (const vaccine of ['MenACWY', 'MenB']) {
    it(`${vaccine}: one blank row gives the same answer as no rows`, () => {
      expect(history(vaccine, [blank()])).toEqual(history(vaccine, []));
    });

    it(`${vaccine}: two blank rows give the same answer as no rows`, () => {
      expect(history(vaccine, [blank(), blank()])).toEqual(history(vaccine, []));
    });

    it(`${vaccine}: a blank row among real ones is dropped, the real ones stay`, () => {
      const real = [{ date: '2024-01-10', brand: '' }, { date: '2026-03-15', brand: '' }];
      const withBlankInTheMiddle = [real[0], blank(), real[1]];
      expect(history(vaccine, withBlankInTheMiddle)).toEqual(history(vaccine, real));
    });
  }

  it('counts nothing for a blank row', () => {
    expect(history('MenACWY', [blank()]).effective).toHaveLength(0);
    expect(history('MenACWY', [blank()]).perDose).toHaveLength(0);
  });
});

describe('K1: a half-filled row is still a recorded dose (must not regress)', () => {
  it('MenACWY: a brand with no date is still graded as a dose', () => {
    const r = history('MenACWY', [{ date: '', brand: 'menquadfi' }]);
    expect(r.perDose).toHaveLength(1);
    expect(r.effective).toHaveLength(1);
    expect(r.perDose[0].status).toBe('unknown');
  });

  it('MenB: a brand with no date is still graded as a dose', () => {
    // Graded, not ignored. Whether such a dose is also *counted* toward the
    // series is a separate rule (the healthy-age gate), deliberately not
    // asserted here — all K1 claims is that the row reaches the engine.
    const r = history('MenB', [{ date: '', brand: 'bexsero' }]);
    expect(r.perDose).toHaveLength(1);
    expect(r).not.toEqual(history('MenB', []));
  });

  it('a date with no brand is still a recorded dose', () => {
    const r = history('MenACWY', [{ date: '2024-01-10', brand: '' }]);
    expect(r.perDose).toHaveLength(1);
    expect(r.effective).toHaveLength(1);
  });
});

describe('K1: the recommendation does not move when a blank row is added', () => {
  const card = (menacwyDoses) =>
    recommend({ ageMonths: TEEN16, riskIds: [], menacwyDoses, menbDoses: [], today: TEST_TODAY }).menacwy[0];

  it('a healthy 16-year-old gets the same MenACWY verdict with and without a blank row', () => {
    const withoutRow = card([]);
    const withBlankRow = card([blank()]);
    expect(withBlankRow.status).toBe(withoutRow.status);
    expect(withBlankRow.title).toBe(withoutRow.title);
  });
});

describe('K1: a ticked row is a dose, and reads as one of unknown date', () => {
  const ticked = () => ({ date: '', brand: '', detailsUnknown: true });

  it('counts, and is graded as a dose whose date is unknown', () => {
    const r = history('MenACWY', [ticked()]);
    expect(r.perDose).toHaveLength(1);
    expect(r.perDose[0].status).toBe('unknown');
    expect(r.effective).toHaveLength(1);
  });

  it('reads exactly like the old blank-row fixture used to — the rules are unchanged', () => {
    // G6 and G8 (the undated-dose rules) are built on this case. All K1 changed
    // is how the clinician says it, not what the engine does with it.
    const r = history('MenACWY', [ticked(), ticked(), ticked()], 204);
    expect(r.perDose[2].extraDoseUnverified).toBe(true);
  });
});
