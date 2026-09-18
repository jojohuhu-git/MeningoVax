// Calendar P1-3 and P2-1: the app threw away the date of birth, then printed
// dates it could only guess at.
//
// The Age step promises, in its own subtitle:
//
//   "Date of birth is recommended: it lets dose dates be checked precisely
//    (e.g. against the 16th birthday)"
//
// It then converted the date of birth to a number of months and discarded it.
// The 16th-birthday date on the card was reconstructed by multiplying months by
// an averaged 30.4375 days, so over 8,400 (date of birth x today) pairs measured
// by the audit it was exact 37% of the time, one day out 51%, two days out 11%
// and three days out in the rest. Worst case found: born 26 March 2011, viewed
// 28 February 2026 — the card said 29 March 2027, the birthday is 26 March 2027.
//
// Three days is not clinically dangerous. But the app asked for the date of
// birth in exchange for precision and did not deliver it, and this is the one
// date on the card a parent writes in a diary.
//
// P2-1, same root: the patient's age was computed ONCE, in the Age step, against
// the clock at that instant, while everything afterwards read the clock live. A
// tab left open across midnight held a patient who did not age while the
// calendar did. Deriving the age from the date of birth at render removes it.
//
// Patients entered as years/months are unchanged: the app genuinely does not
// know their birthday, so it must not start printing exact dates for them.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addCalendarYears, addDays } from '../dateUtils.js';
import { patientAgeMonths } from '../patientAge.js';

function boosterDate({ dob, ageMonths, today, doses }) {
  const out = recommend({
    dob, ageMonths, riskIds: [], menacwyDoses: doses, menbDoses: [], today,
  });
  return out.menacwy.find((c) => c.boosterDueDate)?.boosterDueDate ?? null;
}

describe('calendar P1-3: with a date of birth, the 16th birthday is exact', () => {
  it('the worst case the audit found is now exact', () => {
    // Born 26 March 2011, viewed 28 February 2026, one routine dose on file.
    const dob = '2011-03-26';
    const got = boosterDate({ dob, today: '2026-02-28', doses: [{ date: '2023-06-15' }] });
    expect(got).toBe(addCalendarYears(dob, 16));
    expect(got).toBe('2027-03-26');
  });

  it('every day of the month, every month of birth, lands on the real birthday', () => {
    const wrong = [];
    for (let m = 1; m <= 12; m++) {
      for (const d of [1, 14, 15, 28, 29, 30, 31]) {
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const dob = `2011-${mm}-${dd}`;
        if (Number(dob.slice(8)) > new Date(Date.UTC(2011, m, 0)).getUTCDate()) continue;
        for (const today of ['2026-02-28', '2026-03-01', '2026-09-15', '2026-12-31']) {
          const got = boosterDate({ dob, today, doses: [{ date: '2023-06-15' }] });
          if (got && got !== addCalendarYears(dob, 16)) wrong.push([dob, today, got]);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('without a date of birth the card still works, and is still approximate', () => {
    // Years/months entry: the app does not know the birthday, so it must not
    // invent one. The date is still produced, just not claimed to be exact.
    const got = boosterDate({ ageMonths: 178, today: '2026-02-28', doses: [{ date: '2023-06-15' }] });
    expect(got).not.toBeNull();
    expect(got).toBe(addDays('2026-02-28', Math.round((192 - 178) * 30.4375)));
  });
});

describe('calendar P2-1: the age is derived from the date of birth, not frozen', () => {
  it('the same patient is older on a later day, with no re-entry', () => {
    const state = { dob: '2011-03-26', ageMonths: 178 };
    const onDay1 = patientAgeMonths(state, '2026-02-28');
    const onDay2 = patientAgeMonths(state, '2026-03-28');
    expect(onDay2).toBeGreaterThan(onDay1);
    // A month later is about a month older. Not exactly 1.000: the leftover days
    // are measured against the patient's own month-anniversaries, and February
    // and March are different lengths, so the fraction is scaled differently at
    // each end. That is the arithmetic #38 put right, not a rounding slip.
    expect(onDay2 - onDay1).toBeCloseTo(1, 1);
  });

  it('the stored ageMonths is ignored when a date of birth is known', () => {
    // A stale number must not win over the date of birth it came from.
    const stale = { dob: '2011-03-26', ageMonths: 3 };
    // Born 26 March 2011, seen 28 February 2026: 179 whole months to the
    // anniversary on 26 February, plus 2 of the 28 days to the next one.
    expect(patientAgeMonths(stale, '2026-02-28')).toBeCloseTo(179 + 2 / 28, 6);
  });

  it('without a date of birth the typed age is used as-is', () => {
    expect(patientAgeMonths({ dob: null, ageMonths: 84 }, '2026-02-28')).toBe(84);
    expect(patientAgeMonths({ ageMonths: null }, '2026-02-28')).toBeNull();
  });
});

describe('calendar P1-3: the card stops hedging only when it has earned it', () => {
  it('marks the date exact when a date of birth was given', () => {
    const out = recommend({
      dob: '2011-03-26', riskIds: [], menacwyDoses: [{ date: '2023-06-15' }],
      menbDoses: [], today: '2026-02-28',
    });
    const card = out.menacwy.find((c) => c.boosterDueDate);
    expect(card.boosterDueDateExact).toBe(true);
  });

  it('leaves it approximate when only years/months were given', () => {
    const out = recommend({
      ageMonths: 178, riskIds: [], menacwyDoses: [{ date: '2023-06-15' }],
      menbDoses: [], today: '2026-02-28',
    });
    const card = out.menacwy.find((c) => c.boosterDueDate);
    expect(card.boosterDueDateExact).toBe(false);
  });
});
