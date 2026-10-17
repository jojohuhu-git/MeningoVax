// @vitest-environment happy-dom
// C1 (2026-10-17) — hovering a raised number names the DOCUMENT, not just the
// sentence. The MeningoVax half; PneumoVax carries the same change in
// src/components/__tests__/regression-c1-hover-names-the-document.test.jsx.
//
// Owner-reported: "I always see a '1' where you can hover over to see the
// language cited verbatim, but there are multiple source chips under it and I
// do not know where it came from."
//
// The cause (PneumoVax's
// docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md §1,
// the single shared copy for both apps): the raised number and the grey chips
// are two citation systems that do not know about each other. The chips carry
// no numbers, so there is no way to match a `[1]` to a chip. The hover text
// showed the quoted sentence and never said which document it came from, so
// knowing the words still did not tell you which chip to click.
//
// Why a line break and not "Document — sentence": em dashes are banned from
// user-visible strings (owner decision 2026-07-16, D7 — the most recognisable
// "written by an AI" tell; code comments keep them). A `title` attribute
// honours "\n" in current browsers and degrades to a space where it does not.
//
// ── A MeningoVax-specific note, recorded rather than silently assumed ──
//
// 17 of this app's 37 sources print the short name "ACIP 2020 MMWR". That is
// NOT a problem for C1: all 17 are the same document, so they already share
// one visible [N], and the name still identifies the chip unambiguously.
// Measured 2026-10-17: no two DIFFERENT documents share a short name here.
// Plan item C5 — five chips that print identical words while pointing at
// different tables of that one report — is a separate item about the chips'
// own wording, and is not addressed here.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { cite, citeTitle, CITATIONS } from '../../data/refs.js';

// A real quoted source from refs.js rather than a hand-written fixture, so
// this test fails if the shape of a citation changes under it.
const QUOTED_KEY = Object.keys(CITATIONS).find((k) => CITATIONS[k].quote);

describe('C1 — the hover text on a raised number names its document', () => {
  it('a rendered [1] carries the document name above the quoted sentence', () => {
    const c = cite(QUOTED_KEY);
    render(<RecCard rec={{
      vaccine: 'MenACWY',
      status: 'due',
      doseLabel: 'Dose 1',
      dueToday: true,
      note: { lead: 'A claim resting on one sentence [c].', detail: 'Supporting detail.' },
      noteCites: [c],
    }} />);

    const link = screen.getByText('[1]');
    const title = link.getAttribute('title') ?? '';
    const [first, ...rest] = title.split('\n');

    expect(first, 'the hover text does not lead with the document name')
      .toBe(CITATIONS[QUOTED_KEY].short);
    expect(rest.join('\n'), 'the quoted sentence was lost from the hover text')
      .toContain(CITATIONS[QUOTED_KEY].quote);
  });

  it('every quoted source puts the document first and the sentence second', () => {
    const quoted = Object.keys(CITATIONS).filter((k) => CITATIONS[k].quote);
    expect(quoted.length).toBeGreaterThan(0);

    for (const key of quoted) {
      const [first, ...rest] = citeTitle(cite(key)).split('\n');
      expect(first, `${key} does not lead with its document's short name`)
        .toBe(CITATIONS[key].short);
      expect(rest.join('\n'), `${key} does not carry its quote verbatim`)
        .toContain(CITATIONS[key].quote);
    }
  });

  it('a quote-free source keeps its full title and gains no empty quotation marks', () => {
    // Whole-document references: no sentence to show, and the label is
    // already the full title, which names the document. Composing a blank
    // quote onto one would present a source that appears to say nothing.
    const quoteFree = Object.keys(CITATIONS).filter((k) => !CITATIONS[k].quote);
    expect(quoteFree.length, 'no quote-free sources left to cover this case')
      .toBeGreaterThan(0);

    for (const key of quoteFree) {
      expect(citeTitle(cite(key)), `${key} should fall back to its full title`)
        .toBe(CITATIONS[key].label);
    }
  });

  it('no hover text anywhere gains an em dash (owner decision 2026-07-16, D7)', () => {
    for (const [key, ref] of Object.entries(CITATIONS)) {
      const added = citeTitle(cite(key))
        .replace(ref.quote ?? '', '')
        .replace(ref.label ?? '', '');
      expect(added, `citeTitle added an em dash around ${key}`).not.toMatch(/—/);
    }
  });

  // ── The property C1's promise rests on ────────────────────────────────
  //
  // C1 says the first line of the hover text tells you which chip the number
  // came from. That is only true while a short name identifies exactly one
  // document. Add a source reusing an existing `short` for a DIFFERENT page
  // and a card carrying both would print one name for two sources, putting
  // the reader back where they started — silently, because nothing else in
  // the suite compares `short` against the page it belongs to.
  it('a short name identifies exactly one document, and vice versa', () => {
    // The identity of a DOCUMENT, matching what the numbering dedupes on.
    // Keep a section anchor: this app's child/adolescent schedule page hosts
    // the MenACWY notes at #note-mening and the MenB notes at #note-mening-b,
    // which are two different chips pointing at two different places, and
    // stripping the anchor would wrongly report them as one document under
    // two names. Strip only a "#:~:text=" jump-to-sentence tag, which names a
    // sentence inside a document rather than a document (plan item C4).
    const pageOf = (r) => r.url.split('#:~:text=')[0];

    const docsPerName = new Map();
    const namesPerDoc = new Map();
    for (const ref of Object.values(CITATIONS)) {
      if (!docsPerName.has(ref.short)) docsPerName.set(ref.short, new Set());
      docsPerName.get(ref.short).add(pageOf(ref));
      if (!namesPerDoc.has(pageOf(ref))) namesPerDoc.set(pageOf(ref), new Set());
      namesPerDoc.get(pageOf(ref)).add(ref.short);
    }

    expect([...docsPerName].filter(([, d]) => d.size > 1).map(([n]) => n),
      'one chip name now covers two different documents, so the hover text '
      + 'no longer tells a reader which chip the number came from').toEqual([]);

    expect([...namesPerDoc].filter(([, n]) => n.size > 1)
      .map(([d, n]) => `${d}: ${[...n].join(' / ')}`),
    'one document is printed under two different names, so the same source '
      + 'looks like two').toEqual([]);
  });

  it('citeTitle survives a missing citation rather than printing "undefined"', () => {
    expect(citeTitle(undefined)).toBeUndefined();
    expect(citeTitle({})).toBeUndefined();
  });
});
