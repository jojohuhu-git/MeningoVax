// C10 (port Phase 8, 2026-11-23) — a source button that opens an ACIP 2020
// table is on a card only when that table has a row that fits the patient.
//
// Ported from PneumoVax's owner rule (2026-10-18): "If using p2016 tables, all
// columns need to fit patient criteria in order to use recommendations." Its
// guard is `regression-2026-10-18-every-p2016-card-has-a-row-that-fits`.
//
// HOW THE BUTTON GETS THE TABLE. A card's `citations` may hold a whole-table
// link (acip2020Table2/7/8/9/10, a `#:~:text=` jump to the table's title).
// `cardSources()` (RecCard.jsx) then gives the card's ACIP 2020 button that
// link and title, so the button opens the table.
//
// THE ROWS, read live 2026-11-23 (rr6909a1.htm, every row of each table). The
// columns are Age group | MenACWY | MenB; each row fills both vaccine columns,
// so a row fits when the patient's age does (the risk column is the table
// itself, which C5 already ties to the patient's group):
//   Table 2  (all persons)          2 mos–10 yrs | 11–23 yrs | ≥24 yrs
//   Table 7  (microbiologists)      ≥10 yrs only
//   Table 8  (outbreak)             2–23 mos | 2–9 yrs | ≥10 yrs
//   Table 9  (travel)               2–23 mos | ≥2 yrs
//   Table 10 (college, military)    ≥10 yrs only
//
// MEASURED 2026-11-23 (22,536 saved patients): every button fits, except
// Tables 7 and 10 on cards for children under 10 checked as a microbiologist
// or military recruit. The app flags each of those as implausible (the
// age-doubt note, `ageImplausibleRisks`), and owner E1 (2026-11-21, "Same as
// 10+") ruled that such a child's card is the 10+ card. The owner has also
// ruled a young microbiologist impossible (2026-11-22). So the exception is
// pinned: only implausible patients, and only those two tables.
//
// No card changes with this file.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS } from '../../data/refs.js';
import { ageImplausibleRisks } from '../../data/riskFactors.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

const INF = Infinity;
// [from, to) in months of age now, one entry per row.
const ROWS = {
  acip2020Table2: [[2, 132], [132, 288], [288, INF]],
  acip2020Table7: [[120, INF]],
  acip2020Table8: [[2, 24], [24, 120], [120, INF]],
  acip2020Table9: [[2, 24], [24, INF]],
  acip2020Table10: [[120, INF]],
};
const tableOf = (url) => Object.keys(ROWS).find((k) => CITATIONS[k].url === url);
const fits = (key, am) => ROWS[key].some(([lo, hi]) => am >= lo && am < hi);

describe('C10: an ACIP 2020 table button has a row that fits the patient', () => {
  let shown = 0;
  const unfit = new Map();
  const implausibleUnfit = new Map();
  for (const c of buildSavedAnswerCases()) {
    const out = recommend(c.input);
    if (out.excluded) continue;
    const implausible = ageImplausibleRisks(c.input.riskIds, c.input.ageMonths).length > 0;
    for (const card of [...(out.menacwy ?? []), ...(out.menb ?? [])]) {
      for (const b of card.citations ?? []) {
        const key = tableOf(b.url);
        if (!key) continue;
        shown++;
        if (fits(key, c.input.ageMonths)) continue;
        const into = implausible ? implausibleUnfit : unfit;
        into.set(key, (into.get(key) ?? 0) + 1);
      }
    }
  }

  it('sweeps a real number of table buttons', () => {
    expect(shown).toBeGreaterThan(20000);
  });

  it('no realistic patient gets a table with no row for their age', () => {
    expect([...unfit.entries()]).toEqual([]);
  });

  it('the only exception: Tables 7 and 10 for an implausible under-10 (owner E1)', () => {
    expect([...implausibleUnfit.keys()].sort()).toEqual(['acip2020Table10', 'acip2020Table7']);
  });

  it('the row inventory itself: a 5-year-old does not fit Table 7, a 30-year-old does', () => {
    expect(fits('acip2020Table7', 60)).toBe(false);
    expect(fits('acip2020Table7', 360)).toBe(true);
    expect(fits('acip2020Table9', 12)).toBe(true);
    expect(fits('acip2020Table10', 108)).toBe(false);
  });
});
