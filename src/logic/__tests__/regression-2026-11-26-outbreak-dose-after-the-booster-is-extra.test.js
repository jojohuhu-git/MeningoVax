// Owner, 2026-11-26, "Extra, as Q8" (docs/archive/decisions-2026-11-26-outbreak-extra-dose.md).
//
// A serogroup B outbreak (no other MenB risk) calls for ONE booster (owner
// D10, 2026-11-17; ACIP 2020 Table 8: "Single dose if ≥1 yr after MenB
// primary series completion"). A MenB dose given after that booster was judged
// against the 2–3-year cadence of asplenia/complement/microbiologists:
// "Booster about 5 months after the last booster, 2 years required", a claim no
// source makes for an outbreak (found by C11, 2026-11-26). The same dose given
// 2+ years after the booster already read "Not counted — Extra. Do not repeat."
// / "The series was already complete on that day." (owner Q8, 2026-11-17).
// Now the 5-month dose reads the same. The card is unchanged.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const SERIES = ['2024-03-29', '2024-05-28', '2024-09-25', '2025-11-19'].map((date) => ({ date, brand: 'Bexsero' }));
const run = ({ today = '2026-11-26', riskIds = ['outbreak_b'], menacwyDoses = [], menbDoses = SERIES } = {}) =>
  recommend({ today, dob: '2007-09-15', riskIds, menacwyDoses, menbDoses });
const last = (r) => r.history.MenB.perDose.at(-1);
const chip = (r) => doseChipLabel(last(r), r.menb[0].seriesTotal);

describe('Outbreak only: a MenB dose after the one booster is Extra, as Q8', () => {
  it('19 y, Penmenvy 5 months after the booster (the saved patient)', () => {
    const r = run({ today: '2026-09-15', menacwyDoses: [{ date: '2026-04-18', brand: 'Penmenvy' }] });
    expect(r.menb[0].doseLabel).toBe('Complete (outbreak booster given)');
    expect(chip(r)).toBe('Not counted — Extra. Do not repeat.');
    expect(last(r).reasons).toEqual(['The series was already complete on that day.']);
  });

  it('19 y, Bexsero 5 months after the booster', () => {
    const r = run({ menbDoses: [...SERIES, { date: '2026-04-18', brand: 'Bexsero' }] });
    expect(r.menb[0].doseLabel).toBe('Complete (outbreak booster given)');
    expect(chip(r)).toBe('Not counted — Extra. Do not repeat.');
    expect(last(r).reasons).toEqual(['The series was already complete on that day.']);
  });

  it('control: the same dose 2+ years after the booster already read this way', () => {
    const r = run({ today: '2028-06-01', menbDoses: [...SERIES, { date: '2028-01-10', brand: 'Bexsero' }] });
    expect(chip(r)).toBe('Not counted — Extra. Do not repeat.');
    expect(last(r).reasons).toEqual(['The series was already complete on that day.']);
  });

  it.each([['complement'], ['asplenia'], ['microbiologist']])('control: outbreak + %s keeps the 2-year booster floor (D10: theirs win)', (risk) => {
    const r = run({ riskIds: ['outbreak_b', risk], menbDoses: [...SERIES, { date: '2026-04-18', brand: 'Bexsero' }] });
    expect(chip(r)).toBe('Not counted — repeat');
    expect(last(r).reasons[0]).toBe('Booster about 5 months after the last booster, 2 years required [c].');
  });

  it('control: complement alone keeps it too', () => {
    const r = run({ riskIds: ['complement'], menbDoses: [...SERIES, { date: '2026-04-18', brand: 'Bexsero' }] });
    expect(chip(r)).toBe('Not counted — repeat');
    expect(last(r).reasons[0]).toBe('Booster about 5 months after the last booster, 2 years required [c].');
  });

  it('control: the outbreak booster itself under 6 months after the series is still not counted (owner Q5)', () => {
    const r = run({ menbDoses: [...SERIES.slice(0, 3), { date: '2025-02-25', brand: 'Bexsero' }] });
    expect(chip(r)).toBe('Not counted — repeat');
    expect(last(r).reasons[0]).toMatch(/^Booster about 5 months after the series, 6 required \[c\]\./);
  });
});
