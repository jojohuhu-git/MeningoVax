// REVERSED by M1 (owner, 2026-11-20, "follow CDSI"; decisions in
// docs/archive/decisions-2026-11-20-rulebook-reorg.md). The file name is kept so
// the history reads in one place.
//
// 2026-09-17 (superseded): a high-risk MenB dose 3 given under 4 months after
// dose 2 counted and added a 4th dose, from CDC's schedule-notes wording: "if
// dose 3 is administered earlier than 4 months after dose 2, a 4th dose should
// be administered at least 4 months after dose 3".
//
// NOW (M1, M1b, M1c). Sources read live 2026-11-20:
//   ACIP mm7349a3: "If the third dose is administered <4 months after the second
//     dose, the dose should be repeated ≥4 months after the last dose, unless
//     the third dose was administered ≥6 months after the first dose"
//   CDSI 4.65, increased-risk dose 3: "4 months - 4 days" from the previous dose,
//     allowable "6 months - 4 days" from dose 1.
// So that dose 3 does NOT count and is repeated; the series stays 3 doses. The
// repeat counts ≥4 months after the not-counted dose (M1d, 2026-11-21: the 6-months-
// after-dose-1 "unless" decides only the first dose 3, not the repeat).

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
// The early-dose-3 patient a year earlier, who has since had the repeat
// (2025-10-15 → 2026-02-15 is four calendar months after the dose that did not count).
const RESCUE_COMPLETE = ['2025-06-15', '2025-08-15', '2025-10-15', '2026-02-15'];

describe('M1: an early high-risk dose 3 does not count and is repeated', () => {
  it('the early dose 3 is not counted', () => {
    const v = verdicts(EARLY_D3);
    expect(v[2].status).toBe('invalid');
    expect(v[2].reasons.join(' ')).not.toMatch(/Dose 4|4th dose|It counts/i);
  });

  it('the dose line names both intervals it missed', () => {
    const line = verdicts(EARLY_D3)[2].reasons.join(' ');
    expect(line).toMatch(/^Minimum interval not met \(about 2 months after dose 2, 4 required\)\./);
    expect(line).toMatch(/Also under 6 months after dose 1 \(about 4 months\)/);
  });

  it('the series total stays 3', () => {
    expect(menbSeriesInfo({ highRisk: true, doses: dosesOf(EARLY_D3) }).total).toBe(3);
  });

  it('the card asks for dose 3 of 3 again, routine date 4 months after the dose that did not count', () => {
    const c = card(EARLY_D3);
    expect(c.doseNum).toBe(3);
    expect(c.seriesTotal).toBe(3);
    expect(c.doseLabel).toMatch(/^Dose 3 of 3/);
    // Latest of Oct 15 (4 months after Jun 15), Aug 15 (dose 2 + 4) and Aug 15 (dose 1 + 6).
    expect(c.dueToday).toBe(false);
    expect(c.earliestNextDate).toBe('2026-10-15');
  });

  // M1d (owner, 2026-11-21): was "a repeat 6 months after dose 1 would count, so
  // the card says it can be given today". The 6-month "unless" decides only the
  // first dose 3, so the repeat waits for Oct 15.
  it('seen Sep 15 (7 months after dose 1, 3 months after the dose that did not count): not yet', () => {
    const c = card(EARLY_D3);
    expect(c.canGiveToday).toBeFalsy();
    expect(c.note.lead).not.toMatch(/It can be given today if needed/);
  });

  it('once the repeat is given, the booster clock starts from it', () => {
    const c = card(RESCUE_COMPLETE);
    expect(verdicts(RESCUE_COMPLETE).map((v) => v.status)).toEqual(['valid', 'valid', 'invalid', 'valid']);
    expect(c.doseLabel).toMatch(/First booster \(dose 4\), 1 year after the series/);
    expect(c.seriesTotal).toBe(3);
    expect(c.earliestNextDate).toBe('2027-02-15');
  });

  it('a repeat 6 months after dose 1 but 2 months after the dose that did not count is not counted (M1d)', () => {
    // 2025-12-15: 2 months after the dose that did not count, 6 months after dose 1.
    // Was "valid" under M1c; owner M1d (2026-11-21): the 4 months run from the last dose.
    const sixFromD1 = [...RESCUE_COMPLETE.slice(0, 3), '2025-12-15'];
    expect(verdicts(sixFromD1)[3].status).toBe('invalid');
    expect(verdicts(sixFromD1)[3].reasons.join(' ')).not.toMatch(/after dose 1/);
    // 2025-11-20: 5 weeks after it and 5 months after dose 1.
    const tooSoon = [...RESCUE_COMPLETE.slice(0, 3), '2025-11-20'];
    expect(verdicts(tooSoon)[3].status).toBe('invalid');
    expect(verdicts(tooSoon)[3].reasons.join(' ')).toMatch(/^Minimum interval not met \(.* after the invalid dose \(Oct 15, 2025\), 4 months required\)/);
  });

  it('an ON-TIME dose 3 is untouched: series of 3, straight to the booster', () => {
    expect(menbSeriesInfo({ highRisk: true, doses: dosesOf(ON_TIME_D3) }).total).toBe(3);
    const c = card(ON_TIME_D3);
    expect(c.doseLabel).toMatch(/First booster \(dose 4\), 1 year after the series/);
    expect(verdicts(ON_TIME_D3)[2].status).toBe('valid');
  });

  it('the healthy 2-dose schedule is not affected — its early rescue dose still repeats', () => {
    const healthy = validateHistory(
      'MenB', dosesOf(EARLY_D3), AGE_M, [], TODAY, { MenB: allYes(3) },
    );
    expect(healthy[2].status).toBe('invalid');
  });
});
