// 2026-09-17: a quoted citation whose page URL already carries a section anchor
// used to build a link with TWO "#" fragments —
// ".../child-adolescent-notes.html#note-mening-b#:~:text=..." — which no browser
// honours, so the [c] superscript quietly stopped jumping to the sentence it
// cites. Found while adding the MenB early-dose-3 citation, the first quoted
// citation to point at a section rather than a whole page.
import { describe, it, expect } from 'vitest';
import { CITATIONS, cite } from '../refs.js';

describe('citation highlight links carry exactly one URL fragment', () => {
  it('every quoted citation builds a single-fragment link (#:~:text=, or #section for a closed CDC section, C9)', () => {
    const broken = Object.keys(CITATIONS)
      .filter((k) => CITATIONS[k].quote)
      .map((k) => ({ k, url: cite(k).url }))
      .filter(({ url }) => (url.match(/#/g) || []).length !== 1);
    expect(broken, 'These citation links have the wrong number of "#" fragments, '
      + 'so the browser will not scroll to the quoted sentence: '
      + broken.map((b) => `${b.k} -> ${b.url}`).join(', '))
      .toEqual([]);
  });

  it('the section anchor survives on the chip URL even though the quote link drops it', () => {
    // C9 (2026-11-26): this quote sits in CDC's closed MenB "Special
    // situations" section, so its number now opens that section rather than
    // a text link the browser cannot reach (guard:
    // regression-2026-11-26-c9-cdc-notes-links-open-their-section).
    const c = cite('menbHighRiskEarlyD3ExtraDose');
    expect(c.page).toMatch(/#note-mening-b$/);
    expect(c.url).toBe('https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#accordion-panel-mening-b-situations');
    expect(c.url).not.toMatch(/note-mening-b$/);
  });
});
