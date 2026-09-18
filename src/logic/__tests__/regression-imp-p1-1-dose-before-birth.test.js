// Impossible-entries P1-1: a dose dated before the patient was born was blamed
// on the patient's age, and you were told to give another injection.
//
// A 16-year-old with a MenACWY dose whose year was typed 1926 instead of 2026:
//
//   "Given at ~birth, below the minimum age of 2 months for this brand. This
//    dose does not count toward the series: repeat this dose only (do not
//    restart the series)."
//
// Two things are wrong with that. The dose was not given at birth — it was
// given a hundred years before the patient existed. And the advice is to put a
// needle in a child's arm on the strength of a typo, for a dose they have
// already had.
//
// The future-dated dose gets the opposite treatment: it says the DATE is the
// problem and names a mistyped year as the likely cause. This is the same
// mistake in the other direction and deserves the same answer.
//
// Every before-birth date behaved this way, because the computed age at the
// dose is negative and therefore below every product's minimum age.
//
// Detection. With a date of birth (kept since calendar P1-3) the test is exact:
// the dose is dated before it. With years/months, where the app does not know
// the birthday, the test is that the computed age at the dose is negative —
// which catches the same cases, and is the best the app can honestly do.
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';

const said = (perDose) => (perDose[0].reasons || []).join(' ');

describe('impossible P1-1: a dose dated before birth is a date problem', () => {
  it('the 1926 year-typo case names the date, not the age', () => {
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '1926-06-15' }], 192, [], '2026-09-15', null, '2010-06-15',
    );
    expect(perDose[0].recordProblem).toBe('before-birth');
    expect(said(perDose)).not.toMatch(/below the minimum age/i);
    expect(said(perDose)).not.toMatch(/~birth/i);
  });

  it('it does not advise another injection', () => {
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '1926-06-15' }], 192, [], '2026-09-15', null, '2010-06-15',
    );
    expect(said(perDose)).not.toMatch(/repeat this dose/i);
    expect(said(perDose)).not.toMatch(/restart the series/i);
  });

  it('it says what is probably wrong, like the future-dated dose does', () => {
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '1926-06-15' }], 192, [], '2026-09-15', null, '2010-06-15',
    );
    expect(said(perDose)).toMatch(/before .*(was )?born|before the patient was born/i);
    expect(said(perDose)).toMatch(/year/i);
  });

  it('a plain before-birth date is caught too, not just a wild year', () => {
    // Patient 24 months old, dose dated four years ago.
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '2022-09-15' }], 24, ['asplenia'], '2026-09-15', null, '2024-09-15',
    );
    expect(perDose[0].recordProblem).toBe('before-birth');
  });

  it('without a date of birth, a negative age at the dose is caught the same way', () => {
    // Years/months entry: no dob. The dose is dated before the patient can have
    // existed, so the computed age at it is negative.
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '2022-09-15' }], 24, ['asplenia'], '2026-09-15',
    );
    expect(perDose[0].recordProblem).toBe('before-birth');
  });

  it('MenB is covered as well — this is not vaccine-specific', () => {
    const { perDose } = analyzeHistory(
      'MenB', [{ date: '1926-06-15' }], 192, [], '2026-09-15', null, '2010-06-15',
    );
    expect(perDose[0].recordProblem).toBe('before-birth');
  });

  it('a dose given ON the day of birth still counts as a real record', () => {
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '2010-06-15' }], 192, [], '2026-09-15', null, '2010-06-15',
    );
    expect(perDose[0].recordProblem).not.toBe('before-birth');
  });

  it('an ordinary valid dose is untouched', () => {
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '2023-06-15' }], 192, [], '2026-09-15', null, '2010-06-15',
    );
    expect(perDose[0].status).toBe('valid');
  });

  it('a future-dated dose still reports as future, not as before-birth', () => {
    const { perDose } = analyzeHistory(
      'MenACWY', [{ date: '2027-06-15' }], 192, [], '2026-09-15', null, '2010-06-15',
    );
    expect(perDose[0].recordProblem).toBe('future');
  });

  it('the engine agrees: the before-birth dose does not count toward the series', () => {
    const out = recommend({
      dob: '2010-06-15', menacwyDoses: [{ date: '1926-06-15' }], menbDoses: [],
      riskIds: [], today: '2026-09-15',
    });
    const walked = out.history.MenACWY.perDose[0];
    expect(walked.recordProblem).toBe('before-birth');
    expect(out.history.MenACWY.effective).toHaveLength(0);
  });
});

describe('impossible P1-1: the chip says it too', () => {
  it('has a chip of its own, and does not fall back to "Invalid"', async () => {
    const { RECORD_PROBLEM_LABELS } = await import('../../components/doseChipLabel.js');
    expect(RECORD_PROBLEM_LABELS['before-birth']).toBeDefined();
    expect(RECORD_PROBLEM_LABELS['before-birth']).toMatch(/before birth/i);
    expect(RECORD_PROBLEM_LABELS['before-birth']).not.toMatch(/invalid/i);
  });

  it('every record problem the validator can emit has a chip', async () => {
    const { RECORD_PROBLEM_LABELS } = await import('../../components/doseChipLabel.js');
    for (const kind of ['future', 'duplicate', 'before-birth']) {
      expect(RECORD_PROBLEM_LABELS[kind], kind).toBeTruthy();
    }
  });
});
