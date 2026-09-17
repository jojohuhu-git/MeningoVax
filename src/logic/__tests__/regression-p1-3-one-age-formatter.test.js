// P1-3 (fix queue 2026-09-17): a second age formatter printed "15 years 12
// months" — the exact string format.js was fixed never to emit.
//
// `src/logic/format.js:20` fmtAgeMonths() carries an explicit fix and a comment
// saying what it is for:
//
//   "Rounding months independently of years can carry over (e.g. 59.88 -> 4y +
//    round(11.88)=12mo) - normalize so it never displays 'X years 12 months'."
//
// `src/logic/validate.js:184` fmtAgeMClinical() was a near-copy of the same
// function WITHOUT that normalisation, and it is the one the record panel uses.
// So the app went on printing the nonsense age from the copy while the original
// was correct. (regression-fmtAgeMonths-carry.test.js pins the original; it
// passed throughout, because it never tested the copy.)
//
// Reproduced 2026-09-17 against the real validator, before the fix. Healthy
// patient, 193 months old (16y1m) on TEST_TODAY, dose 1 at age 11
// (2021-08-15), dose 2 three days before the 16th birthday (2026-08-12), which
// is age 191.9 months:
//
//   "Given at ~15 years 12 months, before the age-16 booster window. Safe, but
//    does not count toward the routine series - the routine booster is still
//    due at 16."
//
// This is the same one-rule-two-copies shape as the rest of this queue, in the
// display layer. vaxapp's CLAUDE.md names clinical unit formatting as a shared
// module that must not be re-implemented; MeningoVax had re-implemented it.
//
// THE FIX: fmtAgeMClinical no longer reimplements anything. It keeps its own
// two deliberate differences from fmtAgeMonths — '?' rather than '' for a null
// age, and lowercase 'birth' because every one of its ~20 call sites is
// mid-sentence ("Given at ~birth, ...") — and delegates the rest. Those two
// differences are pinned below so a later tidy-up cannot quietly change the
// sentences.

import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { fmtAgeMonths } from '../format.js';

const TODAY = '2026-09-15'; // TEST_TODAY

const reasonFor = (doses, ageMonths, idx) =>
  analyzeHistory('MenACWY', doses.map((d) => ({ date: d })), ageMonths, [], TODAY, {})
    .perDose[idx].reasons?.[0] ?? '';

// P1-1 (2026-09-17) landed after this test was written and changed its fixture.
// The original used a dose 3 days before the 16th birthday — which CDC's 4-day
// grace rule now COUNTS, so the "does not count" sentence disappears entirely
// and there is no age string left to inspect. The dose moves to 8 days early,
// which still does not count, and still computes to an age of 191.7 months —
// the same "X years 12 months" carry-over the copy used to print.
const D2_EIGHT_DAYS_EARLY = '2026-08-07';

describe('P1-3: one age formatter, not two', () => {
  it('the record panel never prints "X years 12 months"', () => {
    const reason = reasonFor(['2021-08-15', D2_EIGHT_DAYS_EARLY], 193, 1);
    expect(reason).not.toMatch(/\d+ years 12 months/);
  });

  // U4 (2026-09-17, owner decision) changed the expected string, not the point
  // of the test. P1-3's point is that the validator prints whatever the ONE
  // canonical formatter says, rather than a private copy of it. What the
  // canonical formatter says has since changed: ages round down, because
  // "Given at ~16 years, before the age-16 booster window" -- this very
  // sentence -- read as a contradiction for a dose eight days early.
  it('it prints the age the canonical formatter gives', () => {
    const reason = reasonFor(['2021-08-15', D2_EIGHT_DAYS_EARLY], 193, 1);
    expect(fmtAgeMonths(191.9)).toBe('15 years 11 months'); // guards the test itself
    expect(reason).toContain(`~${fmtAgeMonths(191.9)}`);
  });

  it('no age the formatter can produce ever carries over to 12 months', () => {
    // Sweep the whole adolescent range at the fractional ages that trigger it.
    for (let am = 24; am < 300; am += 0.37) {
      expect(fmtAgeMonths(am)).not.toMatch(/ 12 months$/);
    }
  });
});

describe('P1-3: the two deliberate differences survive', () => {
  // These are why fmtAgeMClinical cannot simply BE fmtAgeMonths.
  it('a null age never leaves a dangling "~" in a sentence', () => {
    // fmtAgeMClinical answers '?' where fmtAgeMonths answers '' — every call
    // site writes "~${age}", so the empty string would render "Given at ~,".
    const undated = analyzeHistory('MenACWY', [{ date: '' }], null, [], TODAY, {});
    for (const d of undated.perDose) {
      for (const r of d.reasons ?? []) expect(r).not.toMatch(/~[,.\s]/);
    }
  });

  it('"birth" stays lower case, because every call site is mid-sentence', () => {
    // A MenB dose recorded at birth is below the age floor, and the sentence
    // reads "Given at ~birth, below the minimum age...".
    const h = analyzeHistory('MenB', [{ date: '2026-09-14', brand: 'Bexsero' }],
      0.1, [], TODAY, {});
    const reason = h.perDose[0].reasons?.[0] ?? '';
    expect(reason).not.toMatch(/~Birth/);
  });
});
