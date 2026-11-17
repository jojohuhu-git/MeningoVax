// D2 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// a MenACWY dose that is set aside (safe, but does not advance the routine
// series) still starts the 8-week clock. Closes CDC test patient 2013-0489.
//
// Source, read live 2026-11-17: ACIP 2020 rr6909a1: "the booster dose can be
// administered at any time, as long as a minimum interval of 8 weeks between
// doses is maintained."
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const M = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const run = (dob, dates, today) => recommend({
  dob, today, riskIds: [], menacwyDoses: dates.map(M), menbDoses: [],
});
const verdicts = (r) => r.history.MenACWY.perDose.map((p) => p.status);

describe('D2: a set-aside MenACWY dose starts the 8-week clock', () => {
  const dob = '2010-01-10';

  it('dose 5 days before 16: the booster is from Mar 2, 2026 (8 weeks after it), not the 16th birthday', () => {
    const r = run(dob, ['2021-03-01', '2026-01-05'], '2026-01-07');
    const c = r.menacwy[0];
    expect(c.earliestNextDate).toBe('2026-03-02');
    // Every surface says why: the card and the dose's own chip.
    expect(c.note.lead).toMatch(/8 weeks after the last dose given \(Jan 5, 2026\)/);
    expect(r.history.MenACWY.perDose[1].reasons.join(' ')).toMatch(/at least 8 weeks after this dose/);
  });

  it('a booster on the 16th birthday, 5 days after the set-aside dose, does not count', () => {
    const r = run(dob, ['2021-03-01', '2026-01-05', '2026-01-10'], '2026-02-01');
    expect(verdicts(r)[2]).toBe('invalid');
  });

  it('a booster 8 weeks after it counts', () => {
    const r = run(dob, ['2021-03-01', '2026-01-05', '2026-03-02'], '2026-04-01');
    expect(verdicts(r)[2]).toBe('valid');
    expect(r.menacwy[0].status).toBe('complete');
  });

  it('control: no set-aside dose — the booster is due on the 16th birthday', () => {
    const c = run(dob, ['2021-03-01'], '2026-01-07').menacwy[0];
    expect(c.earliestNextDate).toBe('2026-01-10');
  });
});
