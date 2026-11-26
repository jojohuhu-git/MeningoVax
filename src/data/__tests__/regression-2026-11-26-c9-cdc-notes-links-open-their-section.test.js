// 2026-11-26 — C9 part 1: a CDC schedule-notes quote links to the SECTION that holds it.
// Port of PneumoVax #141 (its guard: regression-2026-11-07-cdc-notes-links-open-their-section).
//
// WHAT WAS WRONG. CDC's child and adult schedule-notes pages keep their
// meningococcal text inside closed sections ("Routine", "Catch-up", "Special
// situations": click to open). The app linked each quoted sentence with a
// `#:~:text=` link, which asks the browser to jump to those words. A browser
// will not open a closed section to look for them, so the reader landed at
// the top of the page with every section closed
// (docs/archive/report-2026-11-23-c9-measured.md, Finding 1).
//
// WHAT FIXES IT. CDC's own page code opens the closed section named after the
// `#` in the address and scrolls to it (checked live 2026-11-23: a full page
// load of `…#accordion-panel-mening-b-situations` opened only that section).
// PneumoVax's owner tested both forms on 2026-11-07, and neither highlighted
// the sentence, so the link names the section ONLY. The quote still shows in
// the hover text over the number.
//
// THE MAP BELOW WAS MEASURED, not inferred. Each quote was searched for on the
// live pages on 2026-11-26, all 16 were found word for word, and the closed
// section around each was recorded. If CDC moves a quote to another section,
// this map AND the entry's `section` must both change. That is why the map is
// written out here and not imported.
//
// NOT covered, on purpose:
//   • The two minimum-age quotes are printed above the sections, in no closed
//     section. There is nothing to open, so they keep their text link.
//   • The whole-document grey buttons (`#note-mening`, `#note-mening-b`) are
//     unchanged, as in PneumoVax: they open the meningococcal heading.
import { describe, it, expect } from 'vitest';
import { CITATIONS, cite } from '../refs.js';

const CHILD = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html';
const ADULT = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html';
const ACWY_CATCHUP = 'accordion-panel-mening-catchup';
const ACWY_SITUATIONS = 'accordion-panel-mening-situations';
const MENB_SITUATIONS = 'accordion-panel-mening-b-situations';

// key -> the closed section CDC prints its quote in (measured live 2026-11-26).
const SECTION_OF = {
  // child notes, MenACWY "Catch-up"
  cdcCatchupAcwyBooster8Weeks: ACWY_CATCHUP,
  cdcCatchupAcwy1618OneDose: ACWY_CATCHUP,
  // child notes, MenACWY "Special situations"
  cdcChildAcwyInfantSeries: ACWY_SITUATIONS, // printed twice, both copies in this section
  cdcChildAcwyRisk2DoseFrom24m: ACWY_SITUATIONS, // printed twice, both copies in this section
  cdcChildMenveoLiquid10y: ACWY_SITUATIONS,
  cdcChildAcwyBefore10OngoingRisk: ACWY_SITUATIONS,
  cdcChildAcwyTravelUnder24m: ACWY_SITUATIONS,
  // child notes, MenB "Special situations"
  menbHighRiskEarlyD3ExtraDose: MENB_SITUATIONS,
  cdcChildMenbHighRiskD2SixMonthsNoD3: MENB_SITUATIONS,
  cdcChildPenbrayaDose2Trumenba: MENB_SITUATIONS,
  cdcChildPenbraya6Months: MENB_SITUATIONS,
  // adult notes, meningococcal "Special situations"
  cdcAdultPenbrayaSameDay: ACWY_SITUATIONS,
  cdcAdultMenbPregnancyDelay: ACWY_SITUATIONS,
  cdcAdultMenbPregnancyMayGive: ACWY_SITUATIONS,
};

// Notes-page quotes printed outside every closed section (see header).
const OUTSIDE_ANY_SECTION = ['cdcChildAcwyMinAge', 'cdcChildMenbMinAge'];

const page = (url) => url.split('#')[0];
const onNotesPage = (k) => CITATIONS[k].quote && [CHILD, ADULT].includes(page(CITATIONS[k].url));

describe('C9 part 1 — CDC notes quotes open the section that holds them', () => {
  it('the map covers every quoted notes-page entry, and only those', () => {
    const quoted = Object.keys(CITATIONS).filter(onNotesPage).sort();
    const mapped = [...Object.keys(SECTION_OF), ...OUTSIDE_ANY_SECTION].sort();
    expect(quoted).toEqual(mapped);
    // 14 measured. A new quote on these pages must be placed here by hand.
    expect(Object.keys(SECTION_OF)).toHaveLength(14);
  });

  it.each(Object.entries(SECTION_OF))('%s declares section %s', (k, section) => {
    expect(CITATIONS[k].section).toBe(section);
  });

  it.each(Object.entries(SECTION_OF))('%s links to page#section, with no text link', (k, section) => {
    const c = cite(k);
    expect(c.url).toBe(`${page(CITATIONS[k].url)}#${section}`);
    expect(c.url).not.toContain(':~:text=');
    // The document identity is unchanged, so card numbering does not move.
    expect(c.page).toBe(CITATIONS[k].url);
    // The quote still travels with the citation, for the hover text.
    expect(c.quote).toBe(CITATIONS[k].quote);
  });

  it.each(OUTSIDE_ANY_SECTION)('%s is outside every section and keeps its text link', (k) => {
    expect(CITATIONS[k].section).toBeUndefined();
    expect(cite(k).url).toBe(`${page(CITATIONS[k].url)}#:~:text=${encodeURIComponent(CITATIONS[k].quote)}`);
  });

  it('only CDC notes entries carry a section (no other document is changed)', () => {
    const withSection = Object.keys(CITATIONS).filter((k) => CITATIONS[k].section);
    expect(withSection.sort()).toEqual(Object.keys(SECTION_OF).sort());
  });
});
