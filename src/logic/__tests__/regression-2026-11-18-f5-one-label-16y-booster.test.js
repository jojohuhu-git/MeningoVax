// Port Phase 6.2 F-5 (owner, STOP G1, 2026-11-18): one label for the routine
// 16-year MenACWY booster.
//
// Before: the same dose had two labels. Healthy 11 y with MenQuadfi at 10 read
// "Booster due at 16y" (1,452 real patients on the grid, before it is due);
// healthy 16 y with Menveo at 11 read "Booster (16y)" (when due, or in its
// 8-week wait). Owner: "Booster (16y)" for both, the shorter form, which
// matches the app's other booster labels ("Booster (dose 2, …)").
// Packet: docs/archive/stop-g1-packet-2026-11-18.md §3.
//
// Measured (prose diff, 24,600 saved patients): 1,596 read different wording
// (1,452 real, 144 impossible entries), and the label is the only change.
//
// The outbreak schedule leaves this label alone (it is ACIP's routine rule,
// not an outbreak booster; Port Phase 5). That check matched the old string,
// so it is held here too: renaming the label must not add "if outbreak risk
// continues" to it.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const acwy = (date, brand) => [{ date, brand }];
const card = ({ dob, today, doses, riskIds = [] }) =>
  recommend({ today, dob, riskIds, menacwyDoses: doses, menbDoses: [] }).menacwy[0];

describe('the routine 16-year booster reads "Booster (16y)" before and when it is due', () => {
  it('healthy 11 y, MenQuadfi at 10: the booster is not yet due', () => {
    const c = card({ dob: '2015-03-01', today: '2026-11-18', doses: acwy('2025-06-01', 'MenQuadfi (MenACWY)') });
    expect(c.dueToday).toBe(false);
    expect(c.doseLabel).toBe('Booster (16y)');
  });

  it('healthy 13 y, Menveo at 11: the booster is not yet due', () => {
    const c = card({ dob: '2013-05-01', today: '2026-11-18', doses: acwy('2024-06-01', 'Menveo (MenACWY)') });
    expect(c.dueToday).toBe(false);
    expect(c.doseLabel).toBe('Booster (16y)');
  });

  it('healthy 16 y, Menveo at 11: the booster is due today, same label', () => {
    const c = card({ dob: '2010-05-01', today: '2026-11-18', doses: acwy('2021-06-01', 'Menveo (MenACWY)') });
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toBe('Booster (16y)');
  });
});

describe('the outbreak schedule does not add its caveat to the 16-year booster', () => {
  it('outbreak, 15 y, MenQuadfi at 14 y 10 m: plain "Booster (16y)"', () => {
    const c = card({
      dob: '2011-01-10', today: '2026-11-18', riskIds: ['outbreak_acwy'],
      doses: acwy('2025-11-01', 'MenQuadfi (MenACWY)'),
    });
    expect(c.doseLabel).toBe('Booster (16y)');
  });
});
