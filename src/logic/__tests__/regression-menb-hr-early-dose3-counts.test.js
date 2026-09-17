// MenB dose-3 rescue (fix 2026-09-17, own item by owner decision): a high-risk
// MenB dose 3 given less than 4 months after dose 2 was thrown away.
//
// CDC does not throw that dose away. It counts it and adds a FOURTH dose at
// least 4 months later. The app did the opposite: marked dose 3 Invalid, told
// the clinician to repeat it, and then re-offered "Dose 3 of 3" — so the
// patient lost a dose CDC credits AND was never told about the extra dose they
// actually need.
//
// SOURCE, fetched live 2026-09-17. CDC child & adolescent immunization schedule
// notes, Meningococcal B, Special situations — the complete bullet, verbatim:
//
//   "Bexsero or Trumenba (use same brand for all doses including booster doses)
//    3-dose series at 0, 1-2, 6 months (if dose 2 was administered at least 6
//    months after dose 1, dose 3 not needed; if dose 3 is administered earlier
//    than 4 months after dose 2, a 4th dose should be administered at least 4
//    months after dose 3)"
//
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// The adult schedule notes carry the same sentence for people at increased
// risk, fetched live the same day:
// https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
//
// P1-2 (the first half of that bullet) shipped in PR #28 and its test file
// explicitly recorded this second half as NOT implemented. This is that half.
//
// REPRODUCED 2026-09-17 against the real engine on main (c37f142). Asplenia,
// age 200 months, Bexsero on 2026-02-15, 2026-04-15 and 2026-06-15 (dose 3 only
// two months after dose 2):
//
//   card:   "Dose 3 of 3 (high-risk, 4C)", dueToday: true
//   dose 3: invalid -- "Given only ~2 months after dose 2. High-risk D3
//           requires >=4 months from D2." / "This dose does not count toward
//           the series: repeat this dose only (do not restart the series)."
//
// WHY THE EARLY TEST GETS NO 4-DAY GRACE: deciding that dose 3 was early is a
// series-LENGTH question (it adds a fourth injection), not a validity one. P1-1
// settled that grace never shortens a series, and the healthy mirror of this
// rule (an early dose 2 owing a rescue dose 3) already uses the strict calendar
// comparison for exactly this reason. A dose three days early therefore still
// earns the 4th dose -- erring toward more doses, which is the direction the
// clinical authority rule requires.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { validateHistory } from '../validate.js';
import { menbSeriesInfo } from '../seriesTotals.js';

const TODAY = '2026-09-15'; // TEST_TODAY
const AGE_M = 260;          // 21y8m, so every dose below lands well after the 16th
                            // birthday and no "were you high-risk then?" prompt fires
const RISK = ['asplenia'];

const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const dosesOf = (dates) => dates.map((d) => ({ date: d, brand: 'Bexsero (MenB)' }));

const card = (dates) => recommend({
  today: TODAY, ageMonths: AGE_M, riskIds: RISK, menacwyDoses: [],
  menbDoses: dosesOf(dates), riskAtDoseAnswers: { MenB: allYes(dates.length) },
}).menb[0];

const verdicts = (dates) => validateHistory(
  'MenB', dosesOf(dates), AGE_M, RISK, TODAY, { MenB: allYes(dates.length) },
);

// Dose 1 Feb 15, dose 2 Apr 15 (2 months on, textbook), dose 3 Jun 15 — only
// two months after dose 2, where CDC's schedule wants four.
const EARLY_D3 = ['2026-02-15', '2026-04-15', '2026-06-15'];
// The same patient with dose 3 on time: four months after dose 2 (and six
// after dose 1), which is the 0/1–2/6-month schedule.
const ON_TIME_D3 = ['2026-02-15', '2026-04-15', '2026-08-15'];
// The early-dose-3 patient a year earlier, who has since had the extra 4th dose
// on time (2025-10-15 → 2026-02-15 is four calendar months).
const RESCUE_COMPLETE = ['2025-06-15', '2025-08-15', '2025-10-15', '2026-02-15'];

describe('MenB dose-3 rescue: an early high-risk dose 3 counts and adds a 4th dose', () => {
  it('the early dose 3 is kept, not discarded', () => {
    const v = verdicts(EARLY_D3);
    expect(v[2].status).toBe('valid');
    expect(v[2].reasons.join(' ')).not.toMatch(/does not count|repeat this dose/i);
  });

  it('the clinician is told why a fourth dose is now owed', () => {
    const v = verdicts(EARLY_D3);
    expect(v[2].reasons.join(' ')).toMatch(/4th dose|fourth dose/i);
    expect(v[2].reasons.join(' ')).toMatch(/4 months after (this dose|dose 3)/i);
  });

  it('the series total becomes 4, not 3', () => {
    expect(menbSeriesInfo({ highRisk: true, doses: dosesOf(EARLY_D3) }).total).toBe(4);
    expect(menbSeriesInfo({ highRisk: true, doses: dosesOf(EARLY_D3) }).primaryTotal).toBe(4);
  });

  it('the card asks for dose 4 of 4, not a repeat of dose 3', () => {
    const c = card(EARLY_D3);
    expect(c.doseNum).toBe(4);
    expect(c.seriesTotal).toBe(4);
    expect(c.doseLabel).toMatch(/Dose 4 of 4/);
    expect(c.doseLabel).not.toMatch(/Booster/);
  });

  it('dose 4 is due 4 months after dose 3 — already past on this fixture', () => {
    const c = card(EARLY_D3);
    // Dose 3 was 2026-06-15; four months on is 2026-10-15, still ahead of
    // TEST_TODAY (2026-09-15), so it is NOT due today.
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-10-15');
  });

  it('once the 4th dose is given, the booster clock starts from it', () => {
    const c = card(RESCUE_COMPLETE);
    expect(c.doseLabel).toMatch(/Booster \(dose 5, 1 year after primary\)/);
    expect(c.seriesTotal).toBe(4);
    // One year after the 4th dose, not one year after the third.
    expect(c.earliestNextDate).toBe('2027-02-15');
  });

  it('the on-time 4th dose is accepted, and a too-soon one is not', () => {
    expect(verdicts(RESCUE_COMPLETE)[3].status).toBe('valid');
    // Same patient, 4th dose only two months after dose 3.
    const tooSoon = [...RESCUE_COMPLETE.slice(0, 3), '2025-12-15'];
    expect(verdicts(tooSoon)[3].status).toBe('invalid');
    expect(verdicts(tooSoon)[3].reasons.join(' ')).toMatch(/at least 4 months after it/i);
  });

  it('an ON-TIME dose 3 is untouched: series of 3, straight to the booster', () => {
    expect(menbSeriesInfo({ highRisk: true, doses: dosesOf(ON_TIME_D3) }).total).toBe(3);
    const c = card(ON_TIME_D3);
    expect(c.doseLabel).toMatch(/Booster \(dose 4, 1 year after primary\)/);
    expect(verdicts(ON_TIME_D3)[2].status).toBe('valid');
  });

  it('the healthy 2-dose schedule is not affected — its early rescue dose still repeats', () => {
    // CDC's healthy bullet gives NO "count it and add another" remedy for an
    // early rescue dose 3, so the general repeat-the-invalid-dose rule stands.
    const healthy = validateHistory(
      'MenB', dosesOf(EARLY_D3), AGE_M, [], TODAY, { MenB: allYes(3) },
    );
    expect(healthy[2].status).toBe('invalid');
  });
});
