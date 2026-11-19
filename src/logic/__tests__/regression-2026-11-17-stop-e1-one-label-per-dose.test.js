// Port Phase 4 — STOP E1, the owner's answers Q5–Q9 on the label beside a
// recorded dose (2026-11-17, `docs/archive/decisions-2026-11-17-open-questions.md`).
// Each patient is the one she was shown, run through the real engine.
//
//   Q5  A dose that did not count, too soon or too young: "Not counted — repeat".
//       (Not PneumoVax's "do not repeat": "For Menveo saying do not repeat and
//       then giving the next due date is confusing.")
//   Q6  A dose set aside for age: "Not counted — given before age 10" (MenACWY)
//       or "… before age 16" (healthy MenB; a routine 2nd MenACWY before 16).
//       Her limit: a high-risk patient's MenB from age 10 counts.
//   Q7  Keep "Booster".
//   Q9  A counted dose with no series running: "Dose N".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const TODAY = '2026-11-17';
const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], today: TODAY, ...input });
const chips = (r, vaccine) => {
  const card = (vaccine === 'MenACWY' ? r.menacwy : r.menb)[0];
  return r.history[vaccine].perDose.map((d) => doseChipLabel(d, card?.seriesTotal ?? null));
};

describe('Q5: a dose that did not count reads "Not counted — repeat"', () => {
  it('too soon: asplenia, 20 y, Menveo 1/10/26 and 2/1/26 (3 weeks; 8 is the minimum)', () => {
    const r = run({
      dob: '2006-03-01', riskIds: ['asplenia'],
      menacwyDoses: [{ date: '2026-01-10', brand: 'Menveo' }, { date: '2026-02-01', brand: 'Menveo' }],
    });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1 of 2', 'Not counted — repeat']);
    expect(r.menacwy[0].doseLabel).toMatch(/^Dose 2 of 2/);
  });

  it('too young: asplenia infant, Menveo at 6 weeks', () => {
    const r = run({ dob: '2026-06-01', riskIds: ['asplenia'], menacwyDoses: [{ date: '2026-07-13', brand: 'Menveo' }] });
    expect(chips(r, 'MenACWY')).toEqual(['Not counted — repeat']);
  });

  it('too soon, MenB: healthy 17 y, Bexsero 6/1/26 and 6/15/26', () => {
    const r = run({
      dob: '2009-05-01',
      menbDoses: [{ date: '2026-06-01', brand: 'Bexsero' }, { date: '2026-06-15', brand: 'Bexsero' }],
    });
    expect(chips(r, 'MenB')).toEqual(['Dose 1 of 2', 'Not counted — repeat']);
  });
});

describe('Q6: a dose set aside for age names the age line', () => {
  it('healthy 12 y, Menveo at 9: "given before age 10"; the card still asks for dose 1', () => {
    const r = run({ dob: '2014-03-01', menacwyDoses: [{ date: '2023-05-01', brand: 'Menveo' }] });
    expect(chips(r, 'MenACWY')).toEqual(['Not counted — given before age 10']);
    const control = run({ dob: '2014-03-01' });
    expect(r.menacwy[0].doseLabel).toBe(control.menacwy[0].doseLabel);
  });

  it('healthy 17 y, Bexsero at 15: "given before age 16"', () => {
    const r = run({ dob: '2009-05-01', menbDoses: [{ date: '2024-09-01', brand: 'Bexsero' }] });
    expect(chips(r, 'MenB')).toEqual(['Not counted — given before age 16']);
  });

  it('healthy 15 y, Menveo at 11 and 14: the 14 y dose is "given before age 16"', () => {
    const r = run({
      dob: '2011-01-01',
      menacwyDoses: [{ date: '2022-03-01', brand: 'Menveo' }, { date: '2025-03-01', brand: 'Menveo' }],
    });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1 of 2', 'Not counted — given before age 16']);
  });

  // The app first asks whether the patient was already high-risk that day
  // (owner design 2026-07-23); "yes" counts the dose, "no" sets it aside.
  it('her limit: asplenia, Bexsero at 12, high-risk then: counts (high-risk MenB starts at 10)', () => {
    const base = { dob: '2012-01-01', riskIds: ['asplenia'], menbDoses: [{ date: '2024-03-01', brand: 'Bexsero' }] };
    expect(chips(run({ ...base, riskAtDoseAnswers: { MenB: ['yes'] } }), 'MenB')).toEqual(['Dose 1 of 3']);
    expect(chips(run({ ...base, riskAtDoseAnswers: { MenB: ['no'] } }), 'MenB')).toEqual(['Not counted — given before age 16']);
  });
});

describe('Q7: a counted booster reads "Booster"', () => {
  it('asplenia, 22 y: Menveo twice at 14, a booster too soon in 2021, a booster 4/10/26', () => {
    const r = run({
      dob: '2004-01-01', riskIds: ['asplenia'],
      menacwyDoses: [
        { date: '2018-01-10', brand: 'Menveo' }, { date: '2018-03-10', brand: 'Menveo' },
        { date: '2021-03-10', brand: 'Menveo' }, { date: '2026-04-10', brand: 'Menveo' },
      ],
    });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1 of 2', 'Dose 2 of 2', 'Not counted — repeat', 'Booster']);
  });
});

describe('Q9: a counted dose with no series running reads "Dose N"', () => {
  it('healthy 25 y, Menveo at 12 only: "Dose 1"', () => {
    const r = run({ dob: '2001-03-01', menacwyDoses: [{ date: '2013-05-01', brand: 'Menveo' }] });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1']);
    expect(r.menacwy[0].status).toBe('not-indicated');
  });

  it('healthy 24 y, Bexsero twice at 17: "Dose 1", "Dose 2"', () => {
    const r = run({
      dob: '2002-03-01',
      menbDoses: [{ date: '2019-05-01', brand: 'Bexsero' }, { date: '2019-11-15', brand: 'Bexsero' }],
    });
    expect(chips(r, 'MenB')).toEqual(['Dose 1', 'Dose 2']);
  });
});

// ── Q8, Q11 (owner, 2026-11-17): a dose no card asked for is Extra ──────────
// "Extra" = every card for that vaccine on the day of the dose asked for
// nothing. Q11: the first dose too. College is left alone (Q8 follow-up).
describe('Q8 + Q11: a dose no card asked for that day reads "Not counted — Extra. Do not repeat."', () => {
  it('healthy 25 y, Menveo at 12 and 23: the 23 y dose is Extra; the card is "Not routinely indicated"', () => {
    const r = run({
      dob: '2001-03-01',
      menacwyDoses: [{ date: '2013-05-01', brand: 'Menveo' }, { date: '2024-05-01', brand: 'Menveo' }],
    });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1', 'Not counted — Extra. Do not repeat.']);
    expect(r.menacwy[0].doseLabel).toBe('Not routinely indicated');
    // Control: the same patient without the 23 y dose reads the same card.
    const control = run({ dob: '2001-03-01', menacwyDoses: [{ date: '2013-05-01', brand: 'Menveo' }] });
    expect(r.menacwy[0].doseLabel).toBe(control.menacwy[0].doseLabel);
  });

  it('Q11: healthy 30 y, Bexsero 3/1/26 and 9/15/26: both Extra (no first-dose limit)', () => {
    const r = run({
      dob: '1996-03-01',
      menbDoses: [{ date: '2026-03-01', brand: 'Bexsero' }, { date: '2026-09-15', brand: 'Bexsero' }],
    });
    expect(chips(r, 'MenB')).toEqual(['Not counted — Extra. Do not repeat.', 'Not counted — Extra. Do not repeat.']);
    expect(r.menb[0].status).toBe('not-indicated');
  });

  it('Q11: the same patient with asplenia ticked: both doses count (the cards on the day ask)', () => {
    const r = run({
      dob: '1996-03-01', riskIds: ['asplenia'],
      menbDoses: [{ date: '2026-03-01', brand: 'Bexsero' }, { date: '2026-09-15', brand: 'Bexsero' }],
    });
    // Dose 2 six months after dose 1 completes the high-risk series in 2
    // (ACIP 2024: "a third dose is not needed if the second dose was
    // administered ≥6 months after the first dose").
    expect(chips(r, 'MenB')).toEqual(['Dose 1 of 2', 'Dose 2 of 2']);
  });

  it('a dose past a complete series keeps the same label: healthy 18 y, Menveo at 11, 16, 17', () => {
    const r = run({
      dob: '2008-01-01',
      menacwyDoses: [{ date: '2019-02-01', brand: 'Menveo' }, { date: '2024-02-01', brand: 'Menveo' }, { date: '2025-03-01', brand: 'Menveo' }],
    });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1 of 2', 'Dose 2 of 2', 'Not counted — Extra. Do not repeat.']);
    expect(r.menacwy[0].status).toBe('complete');
  });

  it('an Extra dose gives only its reason, never a note about a dose still owed', () => {
    const r = run({
      dob: '1976-03-01',
      menbDoses: [{ date: '2025-10-01', brand: 'Bexsero' }, { date: '2025-11-01', brand: 'Bexsero' }],
    });
    for (const d of r.history.MenB.perDose) {
      expect(d.extraDose).toBe(true);
      expect(d.reasons.join(' ')).not.toMatch(/third dose is needed|repeat/i); // G1-a: the early-dose-2 line's words
    }
  });
});

describe('Q8 limits: what the Extra rule must never take away', () => {
  it('college (owner Q8 follow-up): Menveo at 16 and 18, seen at 22 — the 18 y dose still counts, card Complete', () => {
    const r = run({
      dob: '2004-09-01', riskIds: ['college_dorm'],
      menacwyDoses: [{ date: '2020-10-01', brand: 'Menveo' }, { date: '2022-10-01', brand: 'Menveo' }],
    });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1 of 1', 'Booster']);
    expect(r.menacwy[0].status).toBe('complete');
  });

  // ACIP counts a healthy child's MenACWY at 10 "as dose 1 of the routine
  // adolescent series" (refs acwyAge10CountsAsDose1), though the card that day
  // said "Not yet due". That card asks LATER (`asksLater`), so it is not Extra.
  it('healthy 12 y, Menveo at 10 y 3 m: still Dose 1 of 2 — not asked for again at 12', () => {
    const r = run({ dob: '2014-03-01', menacwyDoses: [{ date: '2024-06-01', brand: 'Menveo' }] });
    expect(chips(r, 'MenACWY')).toEqual(['Dose 1 of 2']);
    expect(r.menacwy[0].doseLabel).toBe('Booster (16y)');
  });

  // CDC's 4-day grace counts a MenB dose 1–4 days before 16; the card that
  // day ("Not routinely indicated" under 16) offers MenB from 16, so it asks.
  it('healthy 19 y, Bexsero 2 days before the 16th birthday: still counts', () => {
    const r = run({ dob: '2007-06-10', menbDoses: [{ date: '2023-06-08', brand: 'Bexsero' }] });
    expect(r.history.MenB.perDose[0].extraDose).not.toBe(true);
    expect(r.history.MenB.perDose[0].effectiveDoseNum).toBe(1);
  });
});

// ── Q10 (owner, 2026-11-17): no card asks, so a dose that did not count is
// not repeated ──────────────────────────────────────────────────────────────
describe('Q10: a dose that did not count, where no card asks for that vaccine, reads "Not counted — do not repeat"', () => {
  it('healthy 1 y, Bexsero at 9 months: "do not repeat", and no repeat sentence', () => {
    const r = run({ dob: '2025-10-01', menbDoses: [{ date: '2026-07-01', brand: 'Bexsero' }] });
    expect(chips(r, 'MenB')).toEqual(['Not counted — do not repeat']);
    expect(r.history.MenB.perDose[0].reasons.join(' ')).not.toMatch(/repeat this dose/);
  });

  it('control, a card asks: asplenia 20 y, Menveo 1/10/26 and 2/1/26 — still "repeat"', () => {
    const r = run({
      dob: '2006-03-01', riskIds: ['asplenia'],
      menacwyDoses: [{ date: '2026-01-10', brand: 'Menveo' }, { date: '2026-02-01', brand: 'Menveo' }],
    });
    expect(chips(r, 'MenACWY')[1]).toBe('Not counted — repeat');
  });

  it('a card that asks LATER still asks: asplenia 9 y, Bexsero at 8 y 11 m reads "repeat" (series starts at 10)', () => {
    const r = run({ dob: '2017-01-01', riskIds: ['asplenia'], menbDoses: [{ date: '2025-12-01', brand: 'Bexsero' }] });
    expect(r.menb[0].asksLater).toBe(true);
    expect(chips(r, 'MenB')).toEqual(['Not counted — repeat']);
  });

  it('pregnancy defers MenB, so the card still asks: "repeat"', () => {
    const r = run({
      dob: '2006-01-01', riskIds: ['pregnancy'],
      menbDoses: [{ date: '2026-01-10', brand: 'Bexsero' }, { date: '2026-01-20', brand: 'Bexsero' }],
    });
    expect(r.menb[0].status).toBe('deferred');
    expect(chips(r, 'MenB')[1]).toBe('Not counted — repeat');
  });
});
