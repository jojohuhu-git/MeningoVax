// 2026-11-26 — C9 part 2: an ACIP 2020 sentence printed in several tables
// links to the copy in the PATIENT'S OWN table.
//
// WHAT WAS WRONG. ACIP 2020 (rr6909a1.htm) prints the same schedule words in
// several tables, one table per risk group (Table 4 complement, 5 asplenia,
// 6 HIV, 7 microbiologists, 8 outbreak, 9 travel, 10 college and military;
// Table 2 routine). A `#:~:text=` link highlights the FIRST copy on the page.
// So a microbiologist's booster link, meant for Table 7, landed in Table 4
// ("persons with complement deficiency"), and a college student's link landed
// in Table 2's footnote, not Table 10's. Measured 2026-11-26 over the saved
// answers: 10,956 of 45,072 cards (docs/archive/report-2026-11-26-c9-part2-acip-copies.md).
//
// WHAT FIXES IT, for the copies a link can reach. A text link may name the
// words just before the sentence (its "prefix", `#:~:text=prefix-,sentence`).
// Each prefix below was tested live on 2026-11-26 with a full page load and
// the pane visible: the page scrolled to the patient's own table. A prefix
// cannot reach back past a line break: Chrome treats one as a boundary
// (tested the same day; the page then stays at the top, worse than before),
// so every prefix below sits on the sentence's own line.
//
// NOT covered: the copies no prefix can reach (Tables 6 and 9's bulleted
// "Aged <7 / ≥7 yrs" lines, the infant rows). Those link as a range instead
// (owner, C9 part 3): regression-2026-11-26-c9-part3-range-link-opens-the-patients-table.
//
// The map is written out, not imported, so a moved copy fails here.
import { describe, it, expect } from 'vitest';
import { CITATIONS, cite, acwyBoosterRowKey } from '../refs.js';

const ACIP = 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm';
const enc = (s) => encodeURIComponent(s).replace(/-/g, '%2D');

// key -> [the words just before the sentence on the page, the copy it lands on,
//         the only patient group(s) that copy is about]
const COPY_OF = {
  boosterFrom10: ['risk)†††:', 'Table 4 (complement), ≥10 yrs row', ['acwy-complement']],
  boosterFrom10Asplenia: ['risk)***:', 'Table 5 (asplenia), ≥10 yrs row', ['acwy-asplenia']],
  acip2020Table7MicrobiologistBooster: ['risk)**:', 'Table 7 (microbiologists), ≥10 yrs row', ['acwy-microbiologist']],
  acip2020InfantSeriesStart3to6mo: ['††', 'Table 8 (outbreak) footnote', ['acwy-outbreak']],
  acip2020College1DoseBeforeEntry: ['*', 'Table 10 (college, military) footnote', ['acwy-college']],
  acip2020College5Years: [
    '* College freshmen living in residence halls should receive at least 1 dose of MenACWY within 5 years before college entry. The preferred timing of the most recent dose is on or after their 16th birthday. If only 1 dose of vaccine was administered before the 16th birthday, a booster dose should be administered before enrollment.',
    'Table 10 (college, military) footnote',
    ['acwy-college'],
  ],
};

describe('C9 part 2 — a repeated ACIP sentence links to the patient\'s own table', () => {
  it.each(Object.entries(COPY_OF))('%s links with its prefix (%s)', (k, [prefix]) => {
    expect(CITATIONS[k].prefix).toBe(prefix);
    const c = cite(k);
    expect(c.url).toBe(`${ACIP}#:~:text=${enc(prefix)}-,${enc(CITATIONS[k].quote)}`);
    // The document identity is unchanged, so card numbering does not move.
    expect(c.page).toBe(CITATIONS[k].url);
    expect(c.page.split('#')[0]).toBe(ACIP);
    expect(c.quote).toBe(CITATIONS[k].quote);
  });

  it.each(Object.entries(COPY_OF))('%s is about only the group its copy is printed for', (k, [, , groups]) => {
    expect(CITATIONS[k].population).toEqual(groups);
  });

  it('only these entries carry a prefix', () => {
    const withPrefix = Object.keys(CITATIONS).filter((k) => CITATIONS[k].prefix).sort();
    expect(withPrefix).toEqual(Object.keys(COPY_OF).sort());
  });

  it('a series ended at 10 or older cites the table of the patient\'s own condition', () => {
    expect(acwyBoosterRowKey(false, ['complement'], true)).toBe('boosterFrom10');
    expect(acwyBoosterRowKey(false, ['asplenia'], true)).toBe('boosterFrom10Asplenia');
    // Both: Table 4 states it for complement, and the patient has complement.
    expect(acwyBoosterRowKey(false, ['complement', 'asplenia'], true)).toBe('boosterFrom10');
  });

  it('the two ≥10 booster entries quote the same words (one sentence, two tables)', () => {
    expect(CITATIONS.boosterFrom10Asplenia.quote).toBe(CITATIONS.boosterFrom10.quote);
  });
});
