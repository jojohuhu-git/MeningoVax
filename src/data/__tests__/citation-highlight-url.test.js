// 2026-09-17: a quoted citation whose page URL already carries a section anchor
// used to build a link with TWO "#" fragments —
// ".../child-adolescent-notes.html#note-mening-b#:~:text=..." — which no browser
// honours, so the [c] superscript quietly stopped jumping to the sentence it
// cites. Found while adding the MenB early-dose-3 citation, the first quoted
// citation to point at a section rather than a whole page.
import { describe, it, expect } from 'vitest';
import { CITATIONS, cite } from '../refs.js';

describe('citation highlight links carry exactly one URL fragment', () => {
  it('every quoted citation builds a single-fragment #:~:text= link', () => {
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
    const c = cite('menbHighRiskEarlyD3ExtraDose');
    expect(c.page).toMatch(/#note-mening-b$/);
    expect(c.url).toMatch(/child-adolescent-notes\.html#:~:text=/);
    expect(c.url).not.toMatch(/note-mening-b/);
  });
});
