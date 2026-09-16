// L2-1 (2026-09-16): the suite must give the same answer on every calendar day.
//
// This is the tripwire for a whole class of failure, not for one test: a red
// suite that is nobody's fault teaches the owner to ignore red, which costs her
// the value of every other test in the repo.
import { describe, it, expect } from 'vitest';
import { todayISO } from '../dateUtils.js';
import { analyzeHistory } from '../validate.js';
import { TEST_TODAY } from '../../test-today.js';

describe('L2-1: the suite runs on a pinned date', () => {
  it('todayISO() returns the pinned test date, not the real calendar date', () => {
    expect(todayISO()).toBe(TEST_TODAY);
  });

  it('a date built from the system clock is the pinned date', () => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(iso).toBe(TEST_TODAY);
  });

  it('the exact fixture that rotted overnight now grades the same every day', () => {
    // The P1-4 fixture: a child aged 96 months (8 years) with asplenia and five
    // recorded MenACWY doses, every one of them given before age 10, so every one
    // needs the risk-at-dose answer. Read against the real clock on 2026-09-16 the
    // first dose fell below Menveo's 2-month floor and dropped out, leaving four.
    const doses = ['2018-11-15', '2019-01-15', '2019-03-15', '2019-09-15', '2022-09-15']
      .map((date) => ({ date }));
    const { perDose } = analyzeHistory('MenACWY', doses, 96, ['asplenia']);
    expect(perDose.filter((d) => d.needsInput)).toHaveLength(5);
  });
});
