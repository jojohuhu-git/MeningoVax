// Port Phase 5, F-6 (owner, 2026-11-18): from 22, an A/C/W/Y outbreak contact
// whose only dose was before 16 is offered the OUTBREAK booster, not a
// "routine booster at ≥16y still owed".
//
// Found while building the 16-year booster for travel/lab/outbreak (#104):
// travel and lab stopped at 21; the outbreak card kept the label at every age.
// A healthy 22-year-old is owed no routine dose. ACIP 2020 (RR-9), read live
// 2026-11-18: "Persons aged 19–21 years who have not received a dose after
// their 16th birthday can receive a single MenACWY dose as part of catch-up
// vaccination"; Table 8 (outbreak): "Aged ≥7 yrs: single dose if ≥5 yrs since
// vaccination".
//
// The owner asked whether the outbreak booster is then given only every 5
// years while the risk remains: yes, and the timeline below holds it.
// Measured: 48 saved patients (ages 22 and 24), label and note only; still due
// today; no date moves.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const DOB = '2004-09-17'; // 22 on Sep 17, 2026
const q = (...dates) => dates.map((date) => ({ date, brand: 'MenQuadfi (MenACWY)' }));
const card = (today, doses, riskIds = ['outbreak_acwy'], dob = DOB) =>
  recommend({ today, dob, riskIds, menacwyDoses: q(...doses), menbDoses: [] }).menacwy[0];

describe('F-6: outbreak contact 22+, only a dose before 16', () => {
  it('Sam, 22, dose at 12: "Booster (dose 2) for this outbreak", due today', () => {
    const c = card('2026-11-18', ['2016-09-17']);
    expect(c.doseLabel).toBe('Booster (dose 2) for this outbreak');
    expect(c.dueToday).toBe(true);
    expect(c.note.lead).toBe('A booster now: 5 years or more since the last MenACWY dose [c].');
  });

  it('control: the same history at 21 still names the routine booster (catch-up runs through 21)', () => {
    const c = card('2026-11-18', ['2017-11-01'], ['outbreak_acwy'], '2005-06-01');
    expect(c.doseLabel).toBe('Booster (16y)');
    expect(c.dueToday).toBe(true);
  });

  it('then every 5 years, only while the outbreak box is ticked', () => {
    const after = card('2026-11-19', ['2016-09-17', '2026-11-18']);
    expect(after.doseLabel).toBe('Booster (dose 3) if outbreak risk continues');
    expect(after.earliestNextDate).toBe('2031-11-18');
    expect(card('2031-11-18', ['2016-09-17', '2026-11-18']).dueToday).toBe(true);
    expect(card('2031-11-18', ['2016-09-17', '2026-11-18'], []).status).toBe('not-indicated');
  });
});
