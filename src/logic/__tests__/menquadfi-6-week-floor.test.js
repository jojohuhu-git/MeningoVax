// ─────────────────────────────────────────────────────────────────────────
// MenQuadfi's 6-week licence floor (M1+M2, fix queue
// .claude/prompts/fix-2026-09-22-menquadfi-6-week-licence-floor.md).
//
// AAP alignment, per WA DOH (fetched live 2026-09-22 — see the queue file for
// the full quote and the authority-rule reasoning): MenQuadfi's minimum age
// dropped from 2 years to 6 weeks. brands.js stores this as `minAgeDays: 42`
// rather than a months figure, because no whole-number-of-months value means
// exactly 42 days for every birth month:
//
//   "6 weeks" in months:  1.367 - 1.452   (varies by birth month)
//   "2 months" in days:      59 - 61      (varies by birth month)
//
// M1 is the days-unit floor itself and the validator/fmtMinAge changes that
// let it be checked exactly. M2 is splitting "licensed from" (brands.js,
// MENACWY_LICENCE_MIN_AGE_DAYS) from "the app asks from"
// (ages.js, MENACWY_SCHEDULE_MIN_AGE_MONTHS) — two numbers that used to be
// one constant because they happened to be equal before MenQuadfi existed.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { validateHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';
import {
  MENACWY_LICENCE_MIN_AGE_DAYS, MENACWY_INFANT_SERIES_BRANDS, ALL_BRANDS,
} from '../../data/brands.js';
import { MENACWY_SCHEDULE_MIN_AGE_MONTHS } from '../ages.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-22';
const MENQUADFI = 'MenQuadfi (MenACWY)';

function validate(vaccine, doses, ageMonths, riskIds = [], dob) {
  return validateHistory(vaccine, doses, ageMonths, riskIds, TODAY, undefined, dob);
}

// ── M1 · the floor itself is exact, regardless of birth month ────────────

describe('M1 — MenQuadfi‘s 42-day floor is exact for every birth month', () => {
  // Six DOBs spanning short (Feb), long (Jan/Dec/Jul), and a leap February —
  // the exact case a months-based floor (1.367-1.452mo) cannot get right for
  // every one of these at once.
  const DOBS = [
    '2026-01-01', // 31-day January
    '2026-02-01', // 28-day February (2026 is not a leap year)
    '2024-01-20', // crosses a 29-day leap February (2024)
    '2026-04-01', // 30-day April
    '2026-07-15', // 31-day July
    '2025-12-01', // 31-day December, crossing a year boundary
  ];

  it.each(DOBS)('a dose at exactly 42 days (DOB %s) is valid', (dob) => {
    const doseDate = addDays(dob, 42);
    // Patient's current age doesn't matter for this check beyond being able
    // to compute SOME ageMonths for the (unused) months path; pass a
    // plausible one.
    const results = validate('MenACWY', [{ date: doseDate, brand: MENQUADFI }], 24, [], dob);
    expect(results[0].status).toBe('valid');
  });

  it('a dose at 37 days (5 days early — outside the grace) is invalid', () => {
    const dob = '2026-01-01';
    const results = validate('MenACWY', [{ date: addDays(dob, 37), brand: MENQUADFI }], 24, [], dob);
    expect(results[0].status).toBe('invalid');
    expect(results[0].reasons[0]).toMatch(/below the minimum age of 6 weeks/);
  });

  it('a dose at 38 days (4 days early — CDC\'s grace) is valid', () => {
    // CDC child & adolescent schedule notes: "doses administered <=4 days
    // before the minimum age ... are considered valid" — the same rule
    // GRACE_DAYS applies everywhere else in this app (intervals.js,
    // regression-p1-1-four-day-grace.test.js). 42 - 4 = 38.
    const dob = '2026-01-01';
    const results = validate('MenACWY', [{ date: addDays(dob, 38), brand: MENQUADFI }], 24, [], dob);
    expect(results[0].status).toBe('valid');
  });

  it('fmtMinAge prints "6 weeks" for the 42-day floor, never a fractional month', () => {
    const dob = '2026-01-01';
    const results = validate('MenACWY', [{ date: addDays(dob, 37), brand: MENQUADFI }], 24, [], dob);
    expect(results[0].reasons[0]).toMatch(/6 weeks/);
    expect(results[0].reasons[0]).not.toMatch(/1\.4/);
  });

  it('MENACWY_LICENCE_MIN_AGE_DAYS is MenQuadfi\'s own 42-day floor, not a hand-typed number', () => {
    const menquadfi = ALL_BRANDS.find((b) => b.key === 'MenQuadfi');
    expect(MENACWY_LICENCE_MIN_AGE_DAYS).toBe(menquadfi.minAgeDays);
    expect(MENACWY_LICENCE_MIN_AGE_DAYS).toBe(42);
  });

  it('the other eight products\' floors are unchanged', () => {
    const byKey = Object.fromEntries(ALL_BRANDS.map((b) => [b.key, b]));
    expect(byKey['Menveo 2-vial'].minAgeM).toBe(2);
    expect(byKey['Menveo 1-vial'].minAgeM).toBe(120);
    expect(byKey['Menactra'].minAgeM).toBe(9);
    expect(byKey['Menveo'].minAgeM).toBe(2); // legacy label
    expect(byKey['Bexsero'].minAgeM).toBe(120);
    expect(byKey['Trumenba'].minAgeM).toBe(120);
    expect(byKey['Penbraya'].minAgeM).toBe(120);
    expect(byKey['Penmenvy'].minAgeM).toBe(120);
    // None of the other eight carry a days floor — MenQuadfi is the only one.
    for (const key of ['Menveo 2-vial', 'Menveo 1-vial', 'Menactra', 'Menveo', 'Bexsero', 'Trumenba', 'Penbraya', 'Penmenvy']) {
      expect(byKey[key].minAgeDays).toBeUndefined();
    }
  });
});

// ── M2 · licence floor vs. schedule floor ─────────────────────────────────

describe('M2 — the licence floor and the schedule floor are allowed to differ', () => {
  it('a 7-week-old with asplenia: nothing is due yet (schedule floor is 2 months)', () => {
    const r = recommend({
      today: TODAY, dob: addDays(TODAY, -49), // 7 weeks = 49 days old
      riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: {},
    });
    expect(r.menacwy[0].dueToday).toBe(false);
    expect(r.menacwy[0].status).toBe('not-indicated');
  });

  it('...but a MenQuadfi dose actually GIVEN at 7 weeks counts (licence floor is 6 weeks)', () => {
    const dob = addDays(TODAY, -365); // an older child now, so the dose is safely in the past
    const doseDate = addDays(dob, 49); // given at 7 weeks old
    // No risk id here: the licence-floor check doesn't depend on why the
    // dose was given, and adding one would require an answered
    // riskAtDoseAnswers just to reach 'valid'/'invalid' instead of 'pending'.
    const results = validate('MenACWY', [{ date: doseDate, brand: MENQUADFI }], 12, [], dob);
    expect(results[0].status).toBe('valid');
  });

  it('at 2 months, the infant series offers both Menveo 2-vial and MenQuadfi', () => {
    const r = recommend({
      today: TODAY, dob: '2026-07-22', // exactly 2 calendar months before TODAY
      riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: {},
    });
    const card = r.menacwy[0];
    expect(card.dueToday).toBe(true);
    expect(card.brands).toEqual(expect.arrayContaining([MENQUADFI, 'Menveo 2-vial (MenACWY)']));
    expect(card.brands).toEqual(MENACWY_INFANT_SERIES_BRANDS);
  });

  it('tripwire: the two floors are independent numbers, not derived from one another', () => {
    // MENACWY_LICENCE_MIN_AGE_DAYS (42) and MENACWY_SCHEDULE_MIN_AGE_MONTHS (2)
    // used to be ONE constant (MENACWY_MIN_AGE_MONTHS) because Menveo's floor
    // happened to be the schedule floor too. They now live in different
    // files, in different units, and must never be re-merged on the strength
    // of "they're close" — 42 days is roughly 1.4 months, nowhere near 2.
    expect(MENACWY_LICENCE_MIN_AGE_DAYS).toBe(42);
    expect(MENACWY_SCHEDULE_MIN_AGE_MONTHS).toBe(2);
    // The schedule floor stays 2 months regardless of which product exists —
    // it comes from CDC's dose-1 schedule row, not from any product table.
    expect(MENACWY_SCHEDULE_MIN_AGE_MONTHS * 30.4375).toBeGreaterThan(MENACWY_LICENCE_MIN_AGE_DAYS);
  });
});

// ── M3 · card copy stops naming a single brand when two are offered ──────

describe('M3 — no card names one brand while offering two chips', () => {
  it('a 7-week-old with NO doses yet: still told to track and start at 2 months, with no false "only Menveo" claim', () => {
    const r = recommend({
      today: TODAY, dob: addDays(TODAY, -49), // 7 weeks old, given === 0
      riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: {},
    });
    const card = r.menacwy[0];
    expect(card.doseLabel).toBe('Not yet age-eligible');
    expect(noteText(card)).toMatch(/track them and start it/);
    // MenQuadfi's own floor (6 weeks) is younger than the 2-month schedule
    // floor this card is describing, so "only Menveo is licensed that young"
    // was never true — nothing should claim it.
    expect(noteText(card)).not.toMatch(/Menveo/);
  });

  it('a 7-week-old with a MenQuadfi dose already given at 6 weeks: dose 1 counts, the card says so', () => {
    const dob = addDays(TODAY, -49); // 7 weeks old today
    const doseDate = addDays(dob, 42); // dose given exactly at the 6-week licence floor
    const r = recommend({
      today: TODAY, dob, riskIds: ['asplenia'],
      menacwyDoses: [{ date: doseDate, brand: MENQUADFI }], menbDoses: [],
      riskAtDoseAnswers: { MenACWY: { 0: 'yes' } },
    });
    const card = r.menacwy[0];
    // Still not due today -- the interval to dose 2 (8 weeks) always outruns
    // the 2-month schedule floor -- but the card must stop pretending dose 1
    // never happened.
    expect(card.dueToday).toBe(false);
    expect(card.doseLabel).not.toBe('Not yet age-eligible');
    expect(noteText(card)).not.toMatch(/track them and start it/);
    expect(noteText(card)).toMatch(/6 weeks, then 4, 6 and 12 months/);
    expect(noteText(card)).not.toMatch(/Menveo/);
  });

  it('invariant: across the whole infant band, a card never names "Menveo" in prose while offering more than one brand chip', () => {
    for (let m = 2; m <= 23; m += 1) {
      const card = recommend({
        today: TODAY, ageMonths: m, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [],
      }).menacwy[0];
      if (Array.isArray(card.brands) && card.brands.length > 1) {
        expect(noteText(card), `age ${m}mo`).not.toMatch(/Menveo/);
      }
    }
  });
});
