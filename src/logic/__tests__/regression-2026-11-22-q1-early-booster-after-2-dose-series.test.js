// A high-risk MenB first booster given earlier than 1 year is not counted, also
// when it is the 3rd dose (owner, Tier 1 Q1, 2026-11-22: "Not counted, repeat").
//
// A high-risk MenB series is 2 doses when dose 2 came ≥6 months after dose 1
// (ACIP mm7349a3: "a third dose is not needed if the second dose was
// administered ≥6 months after the first dose"). The first booster is then the
// 3rd dose. ACIP 2020: "a MenB booster dose 1 year after primary series
// completion, then every 2–3 years thereafter"; owner C9 (2026-11-15): an
// earlier booster does not count, and the repeat is timed from it (Ruling D).
//
// Was: MENB-HIGHRISK-BOOSTER-GAP looked only at a 4th or later dose, so a 3rd
// dose one month after a 2-dose series counted as the booster, and an outbreak
// patient was shown "Complete".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const T = (date) => ({ date, brand: 'Trumenba (MenB)' });
const run = (riskIds, menbDoses, today, dob = '2007-09-15') => recommend({
  dob, today, riskIds, menacwyDoses: [], menbDoses,
});
const statuses = (r) => r.history.MenB.perDose.map((p) => p.status);
const card = (r) => r.menb[0];

describe('asplenia, 18y: Bexsero Aug 1 2025, Feb 1 2026 (series complete), 3rd dose Mar 1 2026', () => {
  const doses = [B('2025-08-01'), B('2026-02-01'), B('2026-03-01')];

  it('the 3rd dose is "Not counted — repeat"; the first booster is due Mar 1, 2027', () => {
    const r = run(['asplenia'], doses, '2026-03-01');
    expect(statuses(r)).toEqual(['valid', 'valid', 'invalid']);
    expect(r.history.MenB.decidedBy[2]).toBe('MENB-HIGHRISK-BOOSTER-GAP');
    expect(doseChipLabel(r.history.MenB.perDose[2], 2)).toBe('Not counted — repeat');
    expect(r.history.MenB.perDose[2].reasons.join(' ')).toMatch(/after the series, 1 year required/);
    expect(card(r).doseLabel).toMatch(/^First booster/);
    expect(card(r).earliestNextDate).toBe('2027-03-01');
  });

  it('a booster 1 year after the series counts (Feb 1, 2027), and the 2–3 year clock starts from it', () => {
    const r = run(['asplenia'], [B('2025-08-01'), B('2026-02-01'), B('2027-02-01')], '2027-02-05');
    expect(statuses(r)).toEqual(['valid', 'valid', 'valid']);
    expect(card(r).earliestNextDate).toBe('2029-02-01');
  });

  it('the 4-day grace applies: Jan 28, 2027 counts, Jan 27 does not', () => {
    expect(statuses(run(['asplenia'], [B('2025-08-01'), B('2026-02-01'), B('2027-01-28')], '2027-02-05'))[2]).toBe('valid');
    expect(statuses(run(['asplenia'], [B('2025-08-01'), B('2026-02-01'), B('2027-01-27')], '2027-02-05'))[2]).toBe('invalid');
  });

  it('the same for Trumenba', () => {
    const r = run(['asplenia'], [T('2025-08-01'), T('2026-02-01'), T('2026-03-01')], '2026-03-01');
    expect(statuses(r)).toEqual(['valid', 'valid', 'invalid']);
  });
});

describe('serogroup B outbreak, 20y, same dates', () => {
  it('the 3rd dose is not counted and the card is not "Complete"; booster from Mar 1, 2027', () => {
    const r = run(['outbreak_b'], [B('2025-08-01'), B('2026-02-01'), B('2026-03-01')], '2026-03-01', '2005-09-15');
    expect(statuses(r)).toEqual(['valid', 'valid', 'invalid']);
    expect(card(r).status).not.toBe('complete');
    expect(card(r).earliestNextDate).toBe('2027-03-01');
  });
});

describe('controls (unchanged)', () => {
  it('a 3-dose series with an early 4th dose: still "Not counted — repeat" from Mar 1, 2027', () => {
    const r = run(['asplenia'], [B('2025-07-01'), B('2025-08-01'), B('2026-02-01'), B('2026-03-01')], '2026-03-01');
    expect(statuses(r)).toEqual(['valid', 'valid', 'valid', 'invalid']);
    expect(card(r).earliestNextDate).toBe('2027-03-01');
  });

  it('a 3-dose series: dose 3 itself is judged as dose 3, not as a booster', () => {
    const r = run(['asplenia'], [B('2025-07-01'), B('2025-08-01'), B('2026-01-01')], '2026-01-05');
    expect(statuses(r)).toEqual(['valid', 'valid', 'valid']);
    expect(card(r).doseLabel).toMatch(/^First booster/);
  });

  it('a healthy patient with 3 doses is not judged by the high-risk booster rule', () => {
    const r = run([], [B('2025-08-01'), B('2026-02-01'), B('2026-03-01')], '2026-03-01');
    expect(r.history.MenB.decidedBy[2]).toBe('SERIES-CAP-EXTRA-DOSE');
  });
});
