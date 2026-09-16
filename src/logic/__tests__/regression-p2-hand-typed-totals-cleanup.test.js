// P2-1, P2-2 and P2-4 (fix queue 2026-09-15) — three traps, none of them
// reachable today, all of them the same hand-typed-total pattern that caused
// F1, P1-1 and P1-2. Each is one line; the tests exist so that a future caller
// that DOES reach them fails here rather than in a clinic.
//
// P2-1  menacwyPrimaryTotal() fell through to the high-risk answer (2) for a
//       ROUTINE patient (riskClass null). The routine primary series is one
//       dose — the 11-12y dose — with the 16y dose as the booster that closes
//       it, which is what menacwySeriesInfo() already said. Harmless only
//       because its one caller (validate.js) is gated on riskClass being
//       truthy, so the line was unreachable.
//
// P2-2  Two routine recs omitted primaryTotal, so rec() defaulted it to
//       seriesTotal (2) and RecCard's headings would have filed the 16-year
//       BOOSTER under "Primary series". Not reachable today because the doses
//       that would expose it are filtered out first.
//
// P2-4  Booster due-dates landed a day late (DAYS.years(2) = 731, so a dose on
//       2025-09-15 showed 2027-09-16). Fixed by P0-5's calendar helpers; this
//       pins the dates. The constant's own comment said "730 d" while the code
//       produced 731 — corrected too.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import {
  menacwyPrimaryTotal, menacwySeriesInfo, MENACWY_ROUTINE_PRIMARY_TOTAL,
} from '../seriesTotals.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const acwy = (ageMonths, dates, riskIds = []) => recommend({
  today: TODAY, ageMonths, riskIds,
  menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(dates.length) },
}).menacwy[0];

describe('P2-1: the routine primary series is one dose, from every entry point', () => {
  it('menacwyPrimaryTotal agrees with menacwySeriesInfo for a routine patient', () => {
    expect(menacwyPrimaryTotal({ riskClass: null, d1AgeM: 132 })).toBe(MENACWY_ROUTINE_PRIMARY_TOTAL);
    expect(menacwyPrimaryTotal({ riskClass: null, d1AgeM: 132 }))
      .toBe(menacwySeriesInfo({ riskClass: null, am: 200, doses: [], today: TODAY }).primaryTotal);
  });

  it('it is 1, not the high-risk answer of 2', () => {
    expect(menacwyPrimaryTotal({ riskClass: null, d1AgeM: null })).toBe(1);
  });

  it('the high-risk and exposure answers are unchanged', () => {
    expect(menacwyPrimaryTotal({ riskClass: 'primary2', d1AgeM: 132 })).toBe(2);
    expect(menacwyPrimaryTotal({ riskClass: 'single+boost', d1AgeM: 132 })).toBe(1);
    expect(menacwyPrimaryTotal({ riskClass: 'single', d1AgeM: 132 })).toBe(1);
  });
});

describe('P2-2: every routine rec carries a primaryTotal of 1', () => {
  // If any of these defaulted primaryTotal to seriesTotal, RecCard would file
  // the 16-year booster under "Primary series".
  it.each([
    ['unvaccinated 17-year-old', 204, []],
    ['17-year-old with an 11-year dose', 204, ['2020-09-15']],
    ['unvaccinated 20-year-old', 240, []],
    ['20-year-old with a 12-year dose', 240, ['2018-09-15']],
    ['11-year-old, routine dose 1', 132, []],
  ])('%s', (_name, ageMonths, dates) => {
    expect(acwy(ageMonths, dates).primaryTotal).toBe(MENACWY_ROUTINE_PRIMARY_TOTAL);
  });

  it('a high-risk rec still reports its own primary total, not 1', () => {
    expect(acwy(240, [], ['asplenia']).primaryTotal).toBe(2);
  });
});

describe('P2-4: booster due-dates land on the anniversary, not the day after', () => {
  it('a MenB high-risk 2-year booster is dated 2027-09-15, not 2027-09-16', () => {
    const r = recommend({
      today: TODAY, ageMonths: 300, riskIds: ['asplenia'], menacwyDoses: [],
      menbDoses: [
        { date: '2020-01-15' }, { date: '2020-03-15' }, { date: '2020-09-15' },
        { date: '2021-09-15' }, { date: '2025-09-15' },
      ],
      riskAtDoseAnswers: { MenB: allYes(5) },
    }).menb[0];
    expect(r.earliestNextDate).toBe('2027-09-15');
  });
});
