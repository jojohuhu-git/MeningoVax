// Change 2 (2026-07-24): a MenACWY dose given AT age 10 is valid for the
// adolescent series and should never read as "not needed" or trigger a
// repeat. Verified live: immunize.org Ask the Experts —
// https://www.immunize.org/ask-experts/topic/menacwy/ —
// "ACIP considers a dose of MenACWY given to a 10-year-old child to be
// valid for the first dose in the adolescent series." / "Doses given
// before age 10 years should not be counted."
//
// Bug found while scoping this change: a healthy patient still under 11,
// with that age-10 dose already on file, got status 'not-indicated' /
// "Not yet due" — directly contradicting the Recorded panel's "Counts"
// chip for the same dose (validate.js already treats it as valid). Fixed
// alongside the footnote since they're the same underlying rule.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-06-03';
function run(input) {
  return recommend({ today: TODAY, ...input });
}
const acwy = (r) => r.menacwy[0];

// Exact calendar-month subtraction (not a fixed days-per-month
// approximation) — the app's own ageAtDose math uses calendarMonthsBetween,
// so the test fixtures must line up with calendar months too, or a dose
// meant to land at exactly age 120mo can drift a fraction under it and get
// wrongly excluded by the A3 pre-age-10 filter.
function monthsBack(iso, n) {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCMonth(dt.getUTCMonth() - n);
  return dt.toISOString().slice(0, 10);
}

describe('Change 2: MenACWY dose given at age 10 counts as adolescent dose 1', () => {
  it('healthy patient still under 11, with the age-10 dose on file, is NOT "not yet due"', () => {
    // Currently 10y6m; the one recorded dose was given exactly 6 calendar
    // months ago, at age 10y0m — must survive the A3 pre-age-10 filter
    // (dose age >= 120mo).
    const r = run({
      ageMonths: 126, riskIds: [],
      menacwyDoses: [{ date: monthsBack(TODAY, 6) }],
      menbDoses: [],
    });
    const rec = acwy(r);
    expect(rec.status).not.toBe('not-indicated');
    expect(rec.doseLabel).not.toBe('Not yet due');
    expect(rec.status).toBe('complete');
    expect(rec.doseLabel).toBe('Booster due at 16y');
    expect(rec.boosterDueDate).toBeTruthy();
  });

  it('that under-11 recommendation cites the age-10-counts rule', () => {
    const r = run({
      ageMonths: 126, riskIds: [],
      menacwyDoses: [{ date: monthsBack(TODAY, 6) }],
      menbDoses: [],
    });
    const rec = acwy(r);
    expect(rec.note).toContain('[c]');
    expect(rec.noteCites).toHaveLength(1);
    expect(rec.noteCites[0].key).toBe('acwyAge10CountsAsDose1');
  });

  it('11-15y patient whose only dose was given at age 10 also gets the age-10 footnote, not the generic one', () => {
    // Currently 11y0m; dose was given exactly 12 calendar months ago, at age 10y0m.
    const r = run({
      ageMonths: 132, riskIds: [],
      menacwyDoses: [{ date: monthsBack(TODAY, 12) }],
      menbDoses: [],
    });
    const rec = acwy(r);
    expect(rec.status).toBe('complete');
    expect(rec.doseLabel).toBe('Booster due at 16y');
    expect(rec.noteCites[0].key).toBe('acwyAge10CountsAsDose1');
  });

  it('11-15y patient whose only dose was given at the routine 11-12y age keeps the generic routine citation (no age-10 footnote)', () => {
    // Currently 12y0m; dose was given exactly 6 calendar months ago, at age 11y6m — routine, not age 10.
    const r = run({
      ageMonths: 144, riskIds: [],
      menacwyDoses: [{ date: monthsBack(TODAY, 6) }],
      menbDoses: [],
    });
    const rec = acwy(r);
    expect(rec.status).toBe('complete');
    expect(rec.noteCites[0].key).toBe('acwyRoutine1112and16');
  });

  it('healthy patient still under 10 with NO dose recorded still correctly reads "Not yet due"', () => {
    const r = run({ ageMonths: 108, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = acwy(r);
    expect(rec.status).toBe('not-indicated');
    expect(rec.doseLabel).toBe('Not yet due');
  });
});
