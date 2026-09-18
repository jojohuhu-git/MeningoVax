// Impossible-entries P0-1 (queue docs/archive/fix-2026-09-17-impossible-entries.md):
// a mistyped year in the date of birth silently changed the clinical advice.
//
// Reproduced in the running app. Typing the year as `0026` instead of `2026` —
// one keystroke short, in a four-digit year box — showed
//
//     "2000 years 7 months · Adult (19+)"
//
// and let the clinician carry straight on. No warning. The same baby, one digit
// apart, got two ordinary-looking cards:
//
//   2026-02-02 (the 7-month-old actually in the room)
//     "Dose 1 of 2 (infant high-risk 7-11mo)" — dose 2 at least 12 WEEKS later
//     AND after the first birthday
//   0026-02-02 (the typo)
//     "Dose 1 of 2 (high-risk primary series)" — dose 2 at least 8 WEEKS later,
//     no age floor
//
// Neither card looks wrong on its face. A clinician who does not notice the age
// chip gives dose 2 a month early and before the first birthday, which ACIP does
// not count. That is the app's core promise broken: a silently wrong answer.
//
// The Years/Months boxes carry the same door. They have max="120", but the app
// reads the typed value directly so the attribute never bites: 999 was accepted
// and displayed "999 years · Adult (19+)". Confirmed live.
//
// The fix refuses an impossible age at the point of ENTRY, in both modes, with a
// message that names the field — modelled on the future-dated-dose message in
// validate.js, which tells the reader the likely cause ("if the year is a typo,
// correct it") rather than just saying no.
//
// 120 years is a plausibility bound, not a clinical rule: no ACIP guidance turns
// on it, and it is the bound the Years box already claimed with max="120".
import { describe, it, expect } from 'vitest';
import { ageEntryProblem, MAX_PLAUSIBLE_AGE_YEARS } from '../ageEntry.js';
import { TEST_TODAY } from '../../test-today.js';

describe('impossible P0-1: an impossible age is refused at entry', () => {
  it('the bound is the 120 years the Years box already claimed', () => {
    expect(MAX_PLAUSIBLE_AGE_YEARS).toBe(120);
  });

  describe('date of birth', () => {
    it.each(['0026-02-02', '0226-02-02', '1826-02-02'])('refuses a mistyped year: %s', (dob) => {
      const p = ageEntryProblem({ mode: 'dob', dob, today: TEST_TODAY });
      expect(p).not.toBeNull();
      expect(p).toMatch(/date of birth/i);
    });

    it('the message points at the year, because that is the likely typo', () => {
      const p = ageEntryProblem({ mode: 'dob', dob: '0026-02-02', today: TEST_TODAY });
      expect(p).toMatch(/year/i);
    });

    it('a date of birth in the future says so, rather than "enter a valid age"', () => {
      const p = ageEntryProblem({ mode: 'dob', dob: '2027-01-01', today: TEST_TODAY });
      expect(p).toMatch(/future/i);
      expect(p).not.toMatch(/enter a valid age/i);
    });

    it.each(['2026-02-02', '1930-06-15', TEST_TODAY])('accepts a real date of birth: %s', (dob) => {
      expect(ageEntryProblem({ mode: 'dob', dob, today: TEST_TODAY })).toBeNull();
    });

    it('accepts someone exactly at the bound, and refuses one year past it', () => {
      const atBound = `${Number(TEST_TODAY.slice(0, 4)) - MAX_PLAUSIBLE_AGE_YEARS}${TEST_TODAY.slice(4)}`;
      expect(ageEntryProblem({ mode: 'dob', dob: atBound, today: TEST_TODAY })).toBeNull();
      const pastBound = `${Number(TEST_TODAY.slice(0, 4)) - MAX_PLAUSIBLE_AGE_YEARS - 1}${TEST_TODAY.slice(4)}`;
      expect(ageEntryProblem({ mode: 'dob', dob: pastBound, today: TEST_TODAY })).not.toBeNull();
    });

    it('an empty field is not an error — it is just unanswered', () => {
      expect(ageEntryProblem({ mode: 'dob', dob: '', today: TEST_TODAY })).toBeNull();
    });
  });

  describe('years and months', () => {
    it.each(['999', '121', '1000'])('refuses an impossible number of years: %s', (years) => {
      const p = ageEntryProblem({ mode: 'precise', years, months: '' });
      expect(p).not.toBeNull();
      expect(p).toMatch(/120 years/);
    });

    it.each(['0', '7', '120'])('accepts a real number of years: %s', (years) => {
      expect(ageEntryProblem({ mode: 'precise', years, months: '' })).toBeNull();
    });

    it('refuses more than 11 months, which is a year in disguise', () => {
      const p = ageEntryProblem({ mode: 'precise', years: '', months: '15' });
      expect(p).not.toBeNull();
      expect(p).toMatch(/months/i);
    });

    it('accepts 11 months, and 0 months', () => {
      expect(ageEntryProblem({ mode: 'precise', years: '1', months: '11' })).toBeNull();
      expect(ageEntryProblem({ mode: 'precise', years: '1', months: '0' })).toBeNull();
    });

    it('refuses a negative age, naming the field', () => {
      expect(ageEntryProblem({ mode: 'precise', years: '-5', months: '' })).toMatch(/years/i);
      expect(ageEntryProblem({ mode: 'precise', years: '', months: '-3' })).toMatch(/months/i);
    });

    it('empty boxes are not an error', () => {
      expect(ageEntryProblem({ mode: 'precise', years: '', months: '' })).toBeNull();
    });

    it('the combination is checked, not just each box', () => {
      // 120 years and 11 months is still within the bound; 120 years exactly is
      // the ceiling, so anything past it must be refused however it is spelled.
      expect(ageEntryProblem({ mode: 'precise', years: '120', months: '11' })).toBeNull();
      expect(ageEntryProblem({ mode: 'precise', years: '121', months: '0' })).not.toBeNull();
    });
  });
});
