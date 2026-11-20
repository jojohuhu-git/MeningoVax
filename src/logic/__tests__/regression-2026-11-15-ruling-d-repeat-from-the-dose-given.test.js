// Port Phase 3, family 1 — RULING D (STOP C answers C2, C9, C12; two edge
// answers 2026-11-15, E1 and E2). When a dose does not count, the repeat is
// timed from THAT dose, not from the last dose that counted.
//
// Sources, read live 2026-11-15:
//   CDC General Best Practices, Timing and Spacing of Immunobiologics:
//     "The repeat dose should be spaced after the invalid dose by the
//      recommended minimum interval (Table 3-2)."
//   ACIP 2020 meningococcal MMWR (rr6909a1), MenB:
//     "If 2 doses were administered using different MenB products, one product
//      should be selected for administration of an additional dose at an
//      appropriate interval to ensure valid completion of a MenB series; the
//      dose from the product not selected for series completion should be
//      considered invalid. For situations in which a MenB dose or doses must be
//      repeated, a minimum interval of 4 weeks should be used between any 2
//      doses."
//
// The split (copied from PneumoVax's Ruling D, PR #83): the CLOCK moves to the
// dose given; dose numbers, totals and which rule applies stay on the doses
// that counted. Record problems (a date in the future, before birth, entered
// twice) never start a clock — no dose was given.
//
// E1 (owner, 2026-11-15): a too-young FIRST dose also starts a clock, 4 weeks.
//   A deliberate difference from CDC, which repeats a too-young first dose of
//   an inactivated vaccine "on or after the date when the child reaches at
//   least the minimum age". Matches PneumoVax.
// E2 (owner, 2026-11-15): after a wrong-family MenB dose, the next dose of the
//   established family is due when it would be due from that family's doses,
//   AND at least 4 weeks after the wrong-family dose.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], ...input });
// The card that asks for a dose: due today, or with a date.
const askingCard = (recs) => recs.find((c) => c.dueToday || c.earliestNextDate);
const when = (recs) => {
  const c = askingCard(recs);
  return c ? (c.dueToday ? 'today' : c.earliestNextDate) : null;
};
const verdicts = (r, v) => r.history[v].perDose.map((p) => (p.effectiveDoseNum ? `dose ${p.effectiveDoseNum}` : p.status));

describe('C2: a MenACWY dose 2 given too soon — the repeat is 8 weeks after it', () => {
  const base = { dob: '2006-01-01', today: '2026-09-01', riskIds: ['asplenia'] };
  const d1 = { date: '2026-08-01', brand: 'Menveo' };
  const early = { date: '2026-08-22', brand: 'Menveo' };

  it('card: dose 2 from 2026-10-17 (8 weeks after 8/22), not 2026-09-26 (8 weeks after 8/1)', () => {
    const r = run({ ...base, menacwyDoses: [d1, early] });
    expect(verdicts(r, 'MenACWY')).toEqual(['dose 1', 'invalid']);
    expect(when(r.menacwy)).toBe('2026-10-17');
  });

  it('control: with only the 8/1 dose, dose 2 is still from 2026-09-26', () => {
    expect(when(run({ ...base, menacwyDoses: [d1] }).menacwy)).toBe('2026-09-26');
  });

  it('record: a dose 8 weeks after 8/1 but under 8 weeks after 8/22 does not count', () => {
    const r = run({ ...base, today: '2026-10-05', menacwyDoses: [d1, early, { date: '2026-10-01', brand: 'Menveo' }] });
    expect(verdicts(r, 'MenACWY')).toEqual(['dose 1', 'invalid', 'invalid']);
  });

  it('record: the repeat on 2026-10-17 counts as dose 2', () => {
    const r = run({ ...base, today: '2026-10-20', menacwyDoses: [d1, early, { date: '2026-10-17', brand: 'Menveo' }] });
    expect(verdicts(r, 'MenACWY')).toEqual(['dose 1', 'invalid', 'dose 2']);
  });
});

describe('C9: an early high-risk booster — the next booster is timed from it', () => {
  it('MenACWY: a booster 4 years after the series does not count; the next is 5 years after it', () => {
    const base = { dob: '2000-01-01', today: '2026-11-15', riskIds: ['asplenia'] };
    const primary = [{ date: '2020-01-01', brand: 'Menveo' }, { date: '2020-03-01', brand: 'Menveo' }];
    const r = run({ ...base, menacwyDoses: [...primary, { date: '2024-06-01', brand: 'Menveo' }] });
    expect(verdicts(r, 'MenACWY')).toEqual(['dose 1', 'dose 2', 'invalid']);
    expect(when(r.menacwy)).toBe('2029-06-01');
    // Control: no early booster — the booster is due today (5 years from 2020-03-01 has passed).
    expect(when(run({ ...base, menacwyDoses: primary }).menacwy)).toBe('today');
  });

  it('MenB: a booster 8 months after the series does not count; the next is 1 year after it', () => {
    const base = { dob: '2000-01-01', today: '2026-11-15', riskIds: ['asplenia'] };
    const primary = [
      { date: '2025-01-01', brand: 'Trumenba' }, { date: '2025-02-01', brand: 'Trumenba' }, { date: '2025-07-01', brand: 'Trumenba' },
    ];
    const r = run({ ...base, menbDoses: [...primary, { date: '2026-03-01', brand: 'Trumenba' }] });
    expect(verdicts(r, 'MenB')).toEqual(['dose 1', 'dose 2', 'dose 3', 'invalid']);
    expect(when(r.menb)).toBe('2027-03-01');
    expect(when(run({ ...base, menbDoses: primary }).menb)).toBe('today');
  });
});

describe('C12: a healthy MenB dose 2 under 4 weeks does not count', () => {
  const base = { dob: '2009-06-01', today: '2026-09-15', riskIds: [] };
  const d1 = { date: '2026-09-01', brand: 'Bexsero' };

  it('7 days after dose 1: not counted', () => {
    const r = run({ ...base, menbDoses: [d1, { date: '2026-09-08', brand: 'Bexsero' }] });
    expect(verdicts(r, 'MenB')).toEqual(['dose 1', 'invalid']);
  });

  it('a further dose under 4 weeks after the uncounted one does not count either', () => {
    const r = run({ ...base, today: '2026-10-05', menbDoses: [d1, { date: '2026-09-08', brand: 'Bexsero' }, { date: '2026-10-01', brand: 'Bexsero' }] });
    // 30 days after dose 1, but only 23 days after the uncounted 9/8 dose (under 4 weeks less 4 days).
    expect(verdicts(r, 'MenB')).toEqual(['dose 1', 'invalid', 'invalid']);
  });

  it('control: 4 weeks to 6 months still counts, with the rescue dose 3 owed', () => {
    const r = run({ ...base, today: '2026-10-05', menbDoses: [d1, { date: '2026-10-01', brand: 'Bexsero' }] });
    expect(verdicts(r, 'MenB')).toEqual(['dose 1', 'dose 2']);
    expect(when(r.menb)).toBe('2027-02-01');
  });

  it('the card still advises dose 2 at 6 months after dose 1 (later than 4 weeks after the uncounted dose)', () => {
    const r = run({ ...base, menbDoses: [d1, { date: '2026-09-08', brand: 'Bexsero' }] });
    expect(when(r.menb)).toBe('2027-03-01');
  });
});

describe('E1: a too-young first dose starts a clock (owner, 2026-11-15; MenACWY 8 weeks since D5, 2026-11-17)', () => {
  it('MenB: Bexsero at 9 y 11 m — dose 1 is due 4 weeks after it, not today', () => {
    const base = { dob: '2016-09-01', today: '2026-09-05', riskIds: ['asplenia'] };
    const r = run({ ...base, menbDoses: [{ date: '2026-08-10', brand: 'Bexsero' }] });
    expect(verdicts(r, 'MenB')).toEqual(['invalid']);
    expect(when(r.menb)).toBe('2026-09-07');
    // Control: nothing on record — due today.
    expect(when(run(base).menb)).toBe('today');
  });

  it('MenB: a dose on the 10th birthday, 23 days after the too-young one, does not count', () => {
    const r = run({
      dob: '2016-09-01', today: '2026-09-05', riskIds: ['asplenia'],
      menbDoses: [{ date: '2026-08-10', brand: 'Bexsero' }, { date: '2026-09-02', brand: 'Bexsero' }],
      // A MenB dose before 16 asks whether the patient was high-risk then; answered yes.
      riskAtDoseAnswers: { MenB: { 1: 'yes' } },
    });
    expect(verdicts(r, 'MenB')).toEqual(['invalid', 'invalid']);
  });

  // D5 (owner, 2026-11-17) revised E1 for MenACWY: 8 weeks, MenACWY's own
  // minimum (the 4 weeks was MenB's). MenB above keeps 4 weeks.
  it('MenACWY: Menveo before 2 months — dose 1 again no sooner than 8 weeks after it (D5)', () => {
    const base = { dob: '2026-06-01', today: '2026-08-05', riskIds: ['asplenia'] };
    const r = run({ ...base, menacwyDoses: [{ date: '2026-07-15', brand: 'Menveo' }] });
    expect(verdicts(r, 'MenACWY')).toEqual(['invalid']);
    expect(when(r.menacwy)).toBe('2026-09-09');
    expect(when(run(base).menacwy)).toBe('today');
  });
});

describe('E2: a wrong-family MenB dose (owner, 2026-11-15)', () => {
  const base = { dob: '2009-01-01', today: '2026-08-15', riskIds: ['asplenia'] };
  const bex = { date: '2026-06-01', brand: 'Bexsero' };
  const tru = { date: '2026-08-01', brand: 'Trumenba' };

  it('card: the next Bexsero is 4 weeks after the Trumenba (2026-08-29), not today', () => {
    const r = run({ ...base, menbDoses: [bex, tru] });
    expect(verdicts(r, 'MenB')).toEqual(['dose 1', 'invalid']);
    expect(when(r.menb)).toBe('2026-08-29');
    // Control: the Bexsero alone — due today.
    expect(when(run({ ...base, menbDoses: [bex] }).menb)).toBe('today');
  });

  it('record: a Bexsero 2 weeks after the Trumenba does not count; one 4 weeks after does', () => {
    const tooSoon = run({ ...base, today: '2026-08-20', menbDoses: [bex, tru, { date: '2026-08-15', brand: 'Bexsero' }] });
    expect(verdicts(tooSoon, 'MenB')).toEqual(['dose 1', 'invalid', 'invalid']);
    const onTime = run({ ...base, today: '2026-09-01', menbDoses: [bex, tru, { date: '2026-08-29', brand: 'Bexsero' }] });
    expect(verdicts(onTime, 'MenB')).toEqual(['dose 1', 'invalid', 'dose 2']);
  });

  it('a wrong-family dose sets only the 4-week floor, not the schedule clock', () => {
    // Bexsero dose 2 is 4 weeks after dose 1 (high-risk). A Trumenba 5 days after
    // dose 1 must not push Bexsero dose 2 to 8 weeks or similar: 4 weeks after the
    // Trumenba (2026-06-30) is later than 4 weeks after dose 1 (2026-06-29).
    // STOP F1 Q9a (owner, 2026-11-17): the card now ADVISES the routine date,
    // 1 month after dose 1 (2026-07-01), still timed from dose 1, not the
    // Trumenba. The earliest date it states is held to the Trumenba's 4-week
    // floor (2026-06-30), not dose 1's (2026-06-29).
    const r = run({ ...base, today: '2026-06-10', menbDoses: [bex, { date: '2026-06-02', brand: 'Trumenba' }] });
    expect(when(r.menb)).toBe('2026-07-01');
    expect(r.menb[0].note.lead).toContain('Earliest valid date: Jun 30, 2026 (minimum interval 4 weeks).');
  });
});

describe('What never starts a clock', () => {
  it('a dose dated in the future (a record problem) moves nothing', () => {
    const base = { dob: '2006-01-01', today: '2026-09-01', riskIds: ['asplenia'] };
    const d1 = { date: '2026-08-01', brand: 'Menveo' };
    const typo = { date: '2027-08-22', brand: 'Menveo' };
    expect(when(run({ ...base, menacwyDoses: [d1, typo] }).menacwy)).toBe('2026-09-26');
  });

  it('a patient with no dose that failed is unchanged', () => {
    const base = { dob: '2006-01-01', today: '2026-11-15', riskIds: ['asplenia'] };
    const doses = [{ date: '2026-08-01', brand: 'Menveo' }, { date: '2026-10-01', brand: 'Menveo' }];
    expect(verdicts(run({ ...base, menacwyDoses: doses }), 'MenACWY')).toEqual(['dose 1', 'dose 2']);
  });
});
