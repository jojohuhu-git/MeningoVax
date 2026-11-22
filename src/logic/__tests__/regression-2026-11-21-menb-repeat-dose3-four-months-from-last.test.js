// A repeated high-risk MenB dose 3 counts only 4 months after the dose that did
// not count (owner, 2026-11-21, M1d). Narrows M1c (2026-11-20).
//
// Owner: "If dose 3 is given less than 4 months after dose 2, it is repeated at
// least 4 months after the last dose. The one exception is a dose 3 given at
// least 6 months after dose 1, which counts as valid. The '6 months after dose 1'
// rule only decides whether dose 3 itself was valid. Once dose 3 is invalid, the
// 4-month interval runs from that last dose."
//
// ACIP, MMWR mm7349a3 (Dec 12, 2024; read live 2026-11-21): "If the third dose is
// administered <4 months after the second dose, the dose should be repeated ≥4
// months after the last dose, unless the third dose was administered ≥6 months
// after the first dose." "This guidance applies to both MenB-4C and MenB-FHbp."
//
// Was (M1c): the repeat also counted from 6 months after dose 1, as CDSI 4.65's
// allowable interval does. Bexsero Jan 1, Feb 1, Apr 1, seen Jul 15: "Can be
// given today" (6 months after dose 1), a repeat on Jul 10 counted.
// The 4-day grace on the 4-month line (owner C7) is unchanged.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';
import { statusPillLabel } from '../../components/RecCard.jsx';

const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const T = (date) => ({ date, brand: 'Trumenba (MenB)' });
const run = (menbDoses, today) => recommend({
  dob: '2006-01-01', today, riskIds: ['asplenia'], menacwyDoses: [], menbDoses,
});
const statuses = (r) => r.history.MenB.perDose.map((p) => p.status);
const chips = (r) => r.history.MenB.perDose.map((p) => doseChipLabel(p, 3));
const card = (r) => r.menb[0];

describe('the owner\'s case: Bexsero Jan 1, Feb 1, Apr 1 (dose 3 under 4 months after dose 2, under 6 months after dose 1)', () => {
  const doses = [B('2026-01-01'), B('2026-02-01'), B('2026-04-01')];

  it('Apr 1 is not counted; the repeat is due Aug 1, 4 months after it', () => {
    const r = run(doses, '2026-07-15');
    expect(statuses(r)).toEqual(['valid', 'valid', 'invalid']);
    expect(chips(r)[2]).toBe('Not counted — repeat');
    expect(card(r).doseLabel).toMatch(/^Dose 3 of 3/);
    expect(card(r).earliestNextDate).toBe('2026-08-01');
  });

  it('seen Jul 15 (6 months after dose 1, before Aug 1): not "Can be given today", no earlier date offered', () => {
    const r = run(doses, '2026-07-15');
    expect(card(r).canGiveToday).toBeFalsy();
    expect(statusPillLabel(card(r), false)).not.toBe('Can be given today');
    expect(card(r).note.lead).not.toMatch(/Earliest valid date|can be given today/i);
    expect(`${card(r).note.lead} ${card(r).note.detail ?? ''}`).not.toMatch(/counts even if sooner/);
  });

  it('a repeat on Jul 10 (6 months after dose 1, 3 months after Apr 1) is not counted either; next due Nov 10', () => {
    const r = run([...doses, B('2026-07-10')], '2026-07-15');
    expect(statuses(r)).toEqual(['valid', 'valid', 'invalid', 'invalid']);
    expect(chips(r).slice(2)).toEqual(['Not counted — repeat', 'Not counted — repeat']);
    expect(card(r).doseLabel).toMatch(/^Dose 3 of 3/);
    expect(card(r).earliestNextDate).toBe('2026-11-10');
  });

  it('a repeat on Aug 1 counts; series complete, first booster Aug 1, 2027', () => {
    const r = run([...doses, B('2026-08-01')], '2026-08-05');
    expect(statuses(r)).toEqual(['valid', 'valid', 'invalid', 'valid']);
    expect(r.history.MenB.perDose[3].effectiveDoseNum).toBe(3);
    expect(card(r).doseLabel).toMatch(/^First booster/);
    expect(card(r).earliestNextDate).toBe('2027-08-01');
  });

  it('the 4-day grace on the 4-month line is unchanged: Jul 28 counts, Jul 27 does not', () => {
    expect(statuses(run([...doses, B('2026-07-28')], '2026-08-05'))[3]).toBe('valid');
    expect(statuses(run([...doses, B('2026-07-27')], '2026-08-05'))[3]).toBe('invalid');
  });

  it('the same for Trumenba ("applies to both MenB-4C and MenB-FHbp")', () => {
    const t = [T('2026-01-01'), T('2026-02-01'), T('2026-04-01')];
    expect(statuses(run([...t, T('2026-07-10')], '2026-07-15'))).toEqual(['valid', 'valid', 'invalid', 'invalid']);
    expect(statuses(run([...t, T('2026-08-01')], '2026-08-05'))).toEqual(['valid', 'valid', 'invalid', 'valid']);
  });
});

describe('the exception still decides the FIRST dose 3', () => {
  it('Jan 1, May 1, Jul 1: dose 3 two months after dose 2 but 6 months after dose 1 counts; complete', () => {
    const r = run([B('2026-01-01'), B('2026-05-01'), B('2026-07-01')], '2026-07-05');
    expect(statuses(r)).toEqual(['valid', 'valid', 'valid']);
    expect(card(r).doseLabel).toMatch(/^First booster/);
  });

  it('with the 4-day grace: Jun 27 counts, Jun 26 does not', () => {
    expect(statuses(run([B('2026-01-01'), B('2026-05-01'), B('2026-06-27')], '2026-07-05'))[2]).toBe('valid');
    expect(statuses(run([B('2026-01-01'), B('2026-05-01'), B('2026-06-26')], '2026-07-05'))[2]).toBe('invalid');
  });
});

describe('controls that do not move', () => {
  it('Jan 1, Feb 1, Feb 15: due Jul 1 (6 months after dose 1), earliest valid Jun 15 (4 months after Feb 15)', () => {
    const r = run([B('2026-01-01'), B('2026-02-01'), B('2026-02-15')], '2026-06-20');
    expect(card(r).earliestNextDate).toBe('2026-07-01');
    // MQ6-h (owner, 2026-11-21, "Dose 2 only"): no canGiveToday on a repeated
    // dose 3, so the combined shot waits for Jul 1. The note still says Jun 15.
    expect(card(r).canGiveToday).toBeUndefined();
    expect(card(r).note.lead).toMatch(/4 months after the invalid dose/);
  });

  it('Jan 1, Feb 1, Feb 15, repeat Jun 15: counts', () => {
    const r = run([B('2026-01-01'), B('2026-02-01'), B('2026-02-15'), B('2026-06-15')], '2026-06-20');
    expect(statuses(r)).toEqual(['valid', 'valid', 'invalid', 'valid']);
  });

  it('Jan 1, Feb 1, Jun 1: dose 3 four months after dose 2 counts (C5)', () => {
    const r = run([B('2026-01-01'), B('2026-02-01'), B('2026-06-01')], '2026-06-05');
    expect(statuses(r)).toEqual(['valid', 'valid', 'valid']);
  });
});
