// 2026-11-26 — C9 part 3: the ACIP 2020 sentences no prefix could reach now
// open the PATIENT'S OWN table (owner, 2026-11-26: "highlight in own table").
//
// WHAT WAS WRONG. ACIP 2020 (rr6909a1.htm) prints "Aged ≥7 yrs: Single dose at
// 5 yrs after primary vaccination and every 5 yrs thereafter" (and its "<7"
// twin, and the infant rows "4 doses at 2, 4, 6, and 12 mos" / "2 doses (second
// dose ≥12 wks …)") in several tables. A text link highlights the FIRST copy,
// in Table 4 (complement deficiency). Worked patient: a 30-year-old with HIV
// whose booster is due clicked the number and landed in Table 4, not Table 6
// (HIV). C9 part 2's fix, a prefix, cannot reach these: the words that tell
// the tables apart are on the line above, and a prefix stops at a line break.
//
// WHAT FIXES IT. A RANGE link, `#:~:text=start,sentence`, may cross line
// breaks. It starts at the patient's own table's booster heading (or, for the
// infant rows, its title) and ends at the sentence. Tested live 2026-11-26,
// full page load: Table 6's booster range landed in Table 6, Table 9's in
// Table 9, Table 5's infant range in Table 5. Every start below appears once on
// the page, and the first copy of each sentence after it is in the same table.
//
// Written out, not imported, so a moved start fails here.
import { describe, it, expect } from 'vitest';
import { CITATIONS, cite } from '../refs.js';
import { recommend } from '../../logic/recommend.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

const ACIP = 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm';
const enc = (s) => encodeURIComponent(s).replace(/-/g, '%2D');
const range = (start, key) => `${ACIP}#:~:text=${enc(start)},${enc(CITATIONS[key].quote)}`;
const plain = (key) => `${ACIP}#:~:text=${encodeURIComponent(CITATIONS[key].quote)}`;

const T6_BOOSTERS = 'Boosters (if person remains at increased risk)¶¶:';
const T9_BOOSTERS = 'Boosters (if person remains at increased risk)¶¶,***';
const TITLE = {
  asplenia: 'Recommended vaccination schedule and intervals for persons with anatomic and functional asplenia',
  hiv: 'Recommended vaccination schedule and intervals for persons with human immunodeficiency virus infection',
  outbreak_acwy: 'Recommended vaccination schedule and intervals for persons who are at risk during an outbreak',
  travel: 'Recommended vaccination schedule and intervals for persons who travel to or are residents of countries where meningococcal disease is hyperendemic or epidemic',
};
const BOOSTER_KEYS = ['boosterBeforeAge7', 'boosterAtOrAfterAge7'];
const INFANT_KEYS = ['acwyInfantHighRisk2to6mo', 'acwyInfantHighRisk7to23mo'];

// The link the patient's card should carry for each entry. Table order (4, 5,
// 6, 8, 9): the first of the patient's groups that prints the sentence wins;
// Table 4 (complement) is the first copy on the page, so a plain link.
function expectedUrl(key, riskIds) {
  if (key === 'acip2020Table9TravelBooster') return range(T9_BOOSTERS, key);
  const has = (id) => riskIds.includes(id);
  if (BOOSTER_KEYS.includes(key)) {
    if (has('complement')) return plain(key);
    if (has('hiv')) return range(T6_BOOSTERS, key);
    if (has('travel')) return range(T9_BOOSTERS, key);
    return plain(key);
  }
  if (INFANT_KEYS.includes(key)) {
    if (has('complement')) return plain(key);
    for (const id of ['asplenia', 'hiv', 'outbreak_acwy', 'travel']) if (has(id)) return range(TITLE[id], key);
    return plain(key);
  }
  return undefined;
}

describe('C9 part 3 — a range link opens the patient\'s own table', () => {
  it('worked patient: HIV, booster due at 30 — Table 6, from its booster heading to the sentence', () => {
    expect(cite('boosterAtOrAfterAge7', { riskIds: ['hiv'] }).url).toBe(range(T6_BOOSTERS, 'boosterAtOrAfterAge7'));
  });

  it('control: complement keeps Table 4\'s copy (the first on the page), with or without another group', () => {
    expect(cite('boosterAtOrAfterAge7', { riskIds: ['complement'] }).url).toBe(plain('boosterAtOrAfterAge7'));
    expect(cite('boosterAtOrAfterAge7', { riskIds: ['complement', 'hiv'] }).url).toBe(plain('boosterAtOrAfterAge7'));
    expect(cite('acwyInfantHighRisk2to6mo', { riskIds: ['complement', 'asplenia'] }).url).toBe(plain('acwyInfantHighRisk2to6mo'));
  });

  it.each([
    ['boosterBeforeAge7', ['travel'], T9_BOOSTERS],
    ['boosterAtOrAfterAge7', ['hiv', 'travel'], T6_BOOSTERS],
    ['acwyInfantHighRisk2to6mo', ['asplenia'], TITLE.asplenia],
    ['acwyInfantHighRisk7to23mo', ['hiv'], TITLE.hiv],
    ['acwyInfantHighRisk2to6mo', ['outbreak_acwy'], TITLE.outbreak_acwy],
    ['acwyInfantHighRisk7to23mo', ['travel'], TITLE.travel],
  ])('%s for %j starts at its own table', (key, riskIds, start) => {
    expect(cite(key, { riskIds }).url).toBe(range(start, key));
  });

  it('the Table 9 travel booster entry always opens Table 9, and is about travelers only', () => {
    expect(cite('acip2020Table9TravelBooster').url).toBe(range(T9_BOOSTERS, 'acip2020Table9TravelBooster'));
    expect(CITATIONS.acip2020Table9TravelBooster.population).toEqual(['acwy-travel']);
  });

  it('the page identity is unchanged, so card numbering does not move', () => {
    for (const key of [...BOOSTER_KEYS, ...INFANT_KEYS, 'acip2020Table9TravelBooster']) {
      expect(cite(key, { riskIds: ['hiv'] }).page).toBe(ACIP);
    }
  });

  it('every saved patient\'s card links to its own table\'s copy', () => {
    const cites = [];
    const walk = (v) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') {
        if (typeof v.key === 'string' && 'url' in v && 'page' in v) cites.push(v);
        else Object.values(v).forEach(walk);
      }
    };
    let checked = 0;
    let ranged = 0;
    const bad = [];
    for (const c of buildSavedAnswerCases()) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      cites.length = 0;
      walk([out.menacwy, out.menb, out.pentavalent]);
      for (const ct of cites) {
        const want = expectedUrl(ct.key, c.input.riskIds);
        if (want === undefined) continue;
        checked += 1;
        if (ct.url.includes(',')) ranged += 1;
        if (ct.url !== want && bad.length < 5) bad.push(`${c.key} ${ct.key}`);
      }
    }
    expect(bad).toEqual([]);
    // Not vacuous: thousands of these links are checked, and many now use a range.
    expect(checked).toBeGreaterThan(3000);
    expect(ranged).toBeGreaterThan(2000);
  });
});
