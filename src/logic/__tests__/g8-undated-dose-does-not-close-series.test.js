// ─────────────────────────────────────────────────────────────────────────
// G8 (2026-09-16): a dose with no date must not close the routine MenACWY
// series, and must not take the place of a dose that HAS a date.
//
// Two parts of the app answer "how long is this series?" and they used to
// read a missing date in opposite ways:
//
//   recommend.js      "nothing here PROVES a dose at ≥16y, so the 16-year
//                      booster is still owed" → series of 2.
//   seriesTotals.js   "nothing here is BEFORE 16y, so nothing is owed"
//                      → series of 1, already full.
//
// An undated dose is neither, so the same patient got both answers at once:
// a healthy 17-year-old with two undated doses saw "Booster (16y) — due
// today" on the card and "this dose is beyond the series" on the row below
// it. The series cannot be both full and owed a dose.
//
// The worse consequence was a dose being thrown away: with one undated row
// PLUS a real dose dated at 16y6m, the undated row took the only slot a
// "1-dose series" allows and the documented dose was dropped — so the app
// recommended a booster the patient had six months earlier. At 19-21y the
// card said "no dose at ≥16y" with a dose dated at 17y6m listed underneath.
//
// What does NOT change: dated records. A dose whose date proves it was given
// at ≥16y still closes the series (total 1), and a dated dose genuinely past
// the total still gets the assertive "extra dose" verdict (G6, and the
// regression tests that pin it).
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { menacwySeriesInfo } from '../seriesTotals.js';
import { TEST_TODAY } from '../../test-today.js';
import { noteText } from '../../test-note-text.js';

const undated = () => ({ date: '', brand: '' });
const TEEN = 204;      // 17y  (born 2009-09-15 against TEST_TODAY)
const ADULT19 = 228;   // 19y  (born 2007-09-15)
const DOSE_AT_16_5 = '2026-03-15'; // age 16y6m for TEEN
const DOSE_AT_17_5 = '2025-03-15'; // age 17y6m for ADULT19
const DOSE_AT_12 = '2021-09-15';   // age 12y for TEEN

const acwyCard = (ageMonths, menacwyDoses) =>
  recommend({ ageMonths, riskIds: [], menacwyDoses, menbDoses: [], today: TEST_TODAY }).menacwy[0];

describe('G8: a dose with no date does not close the routine series', () => {
  it('counts an undated dose as "booster not yet proven", not as the ≥16y dose', () => {
    const info = menacwySeriesInfo({ riskClass: null, am: TEEN, doses: [undated()], today: TEST_TODAY });
    expect(info.total).toBe(2);
  });

  it('still closes the series at 1 dose when the date PROVES it was given at ≥16y', () => {
    const info = menacwySeriesInfo({ riskClass: null, am: TEEN, doses: [{ date: DOSE_AT_16_5 }], today: TEST_TODAY });
    expect(info.total).toBe(1);
  });

  it('two undated doses both count — neither is called an extra dose', () => {
    const { perDose, effective } = analyzeHistory('MenACWY', [undated(), undated()], TEEN, [], TEST_TODAY);
    expect(effective).toHaveLength(2);
    const said = perDose.map(d => d.reasons.join(' ')).join(' ');
    expect(said).not.toMatch(/extra dose/i);
    expect(said).not.toMatch(/already complete/i);
  });
});

describe('G8: an undated row never displaces a dose that has a date', () => {
  it('keeps a documented 16y6m dose recorded alongside one undated row', () => {
    const doses = [undated(), { date: DOSE_AT_16_5, brand: '' }];
    const { perDose, effective } = analyzeHistory('MenACWY', doses, TEEN, [], TEST_TODAY);
    expect(effective.some(d => d.date === DOSE_AT_16_5)).toBe(true);
    expect(perDose.map(d => d.reasons.join(' ')).join(' ')).not.toMatch(/already complete/i);
  });

  it('does not re-offer the 16-year booster to a 17-year-old who has one on record', () => {
    const card = acwyCard(TEEN, [undated(), { date: DOSE_AT_16_5, brand: '' }]);
    expect(card.status).toBe('complete');
    expect(card.dueToday).toBe(false);
  });

  it('keeps the documented dose even when TWO undated rows would fill the series', () => {
    const doses = [undated(), undated(), { date: DOSE_AT_16_5, brand: '' }];
    const { effective } = analyzeHistory('MenACWY', doses, TEEN, [], TEST_TODAY);
    expect(effective.some(d => d.date === DOSE_AT_16_5)).toBe(true);
    expect(acwyCard(TEEN, doses).status).toBe('complete');
  });

  it('19-21y: does not claim "no dose at ≥16y" when one is on record', () => {
    const doses = [undated(), { date: DOSE_AT_17_5, brand: '' }];
    const card = acwyCard(ADULT19, doses);
    expect(card.status).not.toBe('catchup');
    expect(card.doseLabel).not.toMatch(/no dose at/i);
  });
});

describe('G8: the card says why it still wants the booster', () => {
  it('names the missing date when no dose on record can be placed at ≥16y', () => {
    const card = acwyCard(TEEN, [undated(), undated()]);
    expect(card.status).toBe('due');
    expect(noteText(card)).toMatch(/no date/i);
    expect(noteText(card)).toMatch(/16 years/);
  });

  it('19-21y catch-up says the ≥16y dose is unconfirmed, not absent', () => {
    const card = acwyCard(ADULT19, [undated()]);
    expect(card.doseLabel).not.toMatch(/no dose at ≥16y/);
    expect(card.doseLabel).toMatch(/not confirmed/i);
    expect(noteText(card)).toMatch(/no date/i);
  });

  it('says nothing about missing dates when every dose has one', () => {
    const card = acwyCard(TEEN, [{ date: DOSE_AT_12, brand: '' }]);
    expect(card.status).toBe('due');
    expect(noteText(card)).not.toMatch(/no date/i);
  });
});
