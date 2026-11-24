// C13, second half (2026-11-23) — a "no dose" card never quotes a sentence
// that gives a dose. Ported from PneumoVax FINDING C.
//
// WHAT THE CLINICIAN SAW. A healthy 30-year-old, no MenACWY:
//     "MenACWY is not routinely recommended for a healthy adult of 22 or older [1]."
// Hovering [1] showed ACIP's catch-up sentence, written about 19–21-year-olds:
//     "Persons aged 19–21 years who have not received a dose after their 16th
//      birthday can receive a single MenACWY dose as part of catch-up vaccination"
// A sentence that offers a dose, about another age band, on a card that says
// no dose. Measured: 1,184 saved patients (every healthy MenACWY card at 22+).
//
// SOURCE, read live 2026-11-23 (ACIP 2020, rr6909a1.htm, Table 2, every cell):
//   ≥24 yrs, MenACWY: "Not routinely recommended See Table 3 for persons at
//     increased risk"
//   11–23 yrs, MenACWY (22 and 23 fall here): "Although routine vaccination is
//     only recommended for adolescents aged 11–18 yrs, MenACWY may be
//     administered to persons aged 19–21 yrs who have not received a dose after
//     their 16th birthday"
//
// Citation only (owner Q12, 2026-11-21: same dose, same document, decide alone).
// The card's words, status and buttons do not change.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS } from '../../data/refs.js';

const run = (dob) => recommend({ dob, riskIds: [], menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: { MenACWY: {}, MenB: {} }, today: '2026-11-23' });

describe('C13: the healthy-adult "not routinely recommended" card quotes its own row', () => {
  it('30 years: Table 2\'s ≥24 row', () => {
    const a = run('1996-06-01').menacwy[0];
    expect(a.status).toBe('not-indicated');
    expect(a.note.lead).toBe('MenACWY is not routinely recommended for a healthy adult of 22 or older [c].');
    expect(a.noteCites.map((c) => c.key)).toEqual(['acip2020Table2NotRoutine24Plus']);
    expect(CITATIONS.acip2020Table2NotRoutine24Plus.quote).toBe('Not routinely recommended See Table 3 for persons at increased risk');
  });

  it('22 years: Table 2\'s 11–23 row, the catch-up limit', () => {
    const a = run('2004-06-01').menacwy[0];
    expect(a.status).toBe('not-indicated');
    expect(a.noteCites.map((c) => c.key)).toEqual(['acip2020Table2CatchupOnly1921']);
    expect(CITATIONS.acip2020Table2CatchupOnly1921.quote).toMatch(/^Although routine vaccination is only recommended for adolescents aged 11–18 yrs/);
  });

  it('no "not routinely recommended" card cites a sentence that offers a dose', () => {
    for (const dob of ['2004-06-01', '2002-12-01', '1996-06-01', '1950-01-01']) {
      const a = run(dob).menacwy[0];
      expect(a.noteCites.map((c) => c.key)).not.toContain('acwyCatchup1921');
    }
  });

  it('control: a 20-year-old\'s catch-up dose still cites the catch-up sentence', () => {
    const a = run('2006-06-01').menacwy[0];
    expect(a.dueToday).toBe(true);
    expect(a.noteCites.map((c) => c.key)).toEqual(['acwyCatchup1921']);
  });
});
