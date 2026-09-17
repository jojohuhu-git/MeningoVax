// P1-2 (fix queue 2026-09-17): a high-risk MenB series that was already
// complete kept asking for a third dose.
//
// CDC gives high-risk MenB a 3-dose series, but with an exception: if dose 2
// happened to land 6 months or more after dose 1, the patient has effectively
// had the 0/6-month schedule and dose 3 is not needed. That exception was
// implemented nowhere. menbSeriesInfo() returned MENB_HIGHRISK_TOTAL
// unconditionally for every high-risk patient.
//
// Reproduced 2026-09-17 against the real engine, before the fix. Asplenia,
// age 200 months (16y8m), Bexsero on 2025-01-15 and 2025-08-15 (7 months
// apart):
//
//   card:       "Dose 3 of 3 (high-risk, 4C)"
//   seriesInfo: { total: 3, primaryTotal: 3, hasBoosterPhase: true }
//
// Dose 2 at exactly 6 months and dose 2 at 5 months produced the SAME output —
// the app could not tell a finished high-risk series from an unfinished one,
// so it advised an injection the patient did not need.
//
// SOURCE, fetched live 2026-09-17. CDC child & adolescent immunization
// schedule notes, Meningococcal B, Special situations. The complete bullet,
// verbatim:
//
//   "Bexsero or Trumenba (use same brand for all doses including booster
//    doses) 3-dose series at 0, 1-2, 6 months (if dose 2 was administered at
//    least 6 months after dose 1, dose 3 not needed; if dose 3 is administered
//    earlier than 4 months after dose 2, a 4th dose should be administered at
//    least 4 months after dose 3)"
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// NOTE the bullet's SECOND clause — a dose 3 given earlier than 4 months after
// dose 2 calls for a 4th dose, rather than being discarded. That is a separate
// rule and is NOT implemented here; it is recorded as a new finding rather than
// folded into this fix.
//
// This is a MISSING BRANCH, not a misunderstood rule: the healthy mirror of the
// same 6-month test (dose 2 EARLIER than 6 months -> a rescue dose 3 is needed)
// has been correctly implemented in the same function all along. The two now
// sit next to each other, keyed off the same calendar comparison in opposite
// directions.
//
// Six months is compared on the CALENDAR, not as 183 days — P0-4 (2026-09-15)
// established that a real six-month gap is 181-184 days and that a day count
// flipped correctly-spaced series roughly half the time, decided by nothing but
// the month the patient started in.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { menbSeriesInfo } from '../seriesTotals.js';

const TODAY = '2026-09-15'; // TEST_TODAY

const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const menb = (ageMonths, dates) => recommend({
  today: TODAY, ageMonths, riskIds: ['asplenia'], menacwyDoses: [],
  menbDoses: dates.map((d) => ({ date: d, brand: 'Bexsero (MenB)' })),
  riskAtDoseAnswers: { MenB: allYes(dates.length) },
}).menb[0];

const info = (dates) =>
  menbSeriesInfo({ highRisk: true, doses: dates.map((d) => ({ date: d })) });

const D1 = '2025-01-15';
const D2_AT_7MO = '2025-08-15'; // the reported patient
const D2_AT_6MO = '2025-07-15'; // exactly six calendar months
const D2_AT_5MO = '2025-06-15';

describe('P1-2: dose 2 six months or more after dose 1 completes the series', () => {
  it('the total is 2, not 3', () => {
    expect(info([D1, D2_AT_7MO]).total).toBe(2);
    expect(info([D1, D2_AT_7MO]).primaryTotal).toBe(2);
  });

  it('exactly six calendar months is enough ("at least 6 months")', () => {
    expect(info([D1, D2_AT_6MO]).total).toBe(2);
  });

  it('the booster phase still follows', () => {
    expect(info([D1, D2_AT_7MO]).hasBoosterPhase).toBe(true);
  });

  it('the card offers a booster, not a third dose', () => {
    const c = menb(200, [D1, D2_AT_7MO]);
    expect(c.doseLabel).toMatch(/booster/i);
    expect(c.doseLabel).not.toMatch(/Dose 3 of 3/);
  });

  it('the recorded doses read "of 2"', () => {
    expect(menb(200, [D1, D2_AT_7MO]).seriesTotal).toBe(2);
  });
});

describe('P1-2: a genuinely unfinished series still asks for dose 3', () => {
  it('dose 2 five months after dose 1 keeps the 3-dose total', () => {
    expect(info([D1, D2_AT_5MO]).total).toBe(3);
  });

  it('and the card still says dose 3 of 3', () => {
    expect(menb(200, [D1, D2_AT_5MO]).doseLabel).toMatch(/Dose 3 of 3/);
  });

  it('the two cases no longer produce the same card', () => {
    expect(menb(200, [D1, D2_AT_7MO]).doseLabel)
      .not.toBe(menb(200, [D1, D2_AT_5MO]).doseLabel);
  });

  it('a patient with only one dose is still promised three', () => {
    // Dose 2 has not happened yet, so its date cannot shorten the series.
    expect(menb(200, [D1]).seriesTotal).toBe(3);
    expect(info([D1]).total).toBe(3);
  });
});

describe('P1-2: six months is a calendar comparison, not 183 days', () => {
  // P0-4's lesson, applied to the new branch. February is the short month that
  // makes a day count disagree with the calendar.
  it('a six-month gap spanning February still completes the series', () => {
    // 2025-12-15 -> 2026-06-15 is 182 days, under any 183-day threshold.
    expect(info(['2025-12-15', '2026-06-15']).total).toBe(2);
  });

  it('one day short of six calendar months does not', () => {
    expect(info(['2025-12-15', '2026-06-14']).total).toBe(3);
  });
});

describe('P1-2: the healthy mirror of this rule is untouched', () => {
  // The opposite direction of the same test, implemented all along.
  it('healthy dose 2 earlier than 6 months still triggers the rescue dose', () => {
    expect(menbSeriesInfo({
      highRisk: false,
      doses: [{ date: D1 }, { date: D2_AT_5MO }],
    }).total).toBe(3);
  });

  it('healthy dose 2 at 6 months is still a 2-dose series', () => {
    expect(menbSeriesInfo({
      highRisk: false,
      doses: [{ date: D1 }, { date: D2_AT_6MO }],
    }).total).toBe(2);
  });
});
