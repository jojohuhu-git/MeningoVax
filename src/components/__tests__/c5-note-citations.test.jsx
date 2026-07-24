// @vitest-environment happy-dom
// C5 (2026-07-23 handoff) + Change 4 (2026-07-24): note.noteCites is an
// ordered list of {key, page, url, label}, one per literal "[c]" placeholder
// in the note text, in order. RecCard numbers them at render time (by order
// of first mention, deduping repeats of the same `page` — the source
// document, owner decision 2026-07-24) and renders each as a clickable [N]
// link to the ACIP MMWR text-fragment; the href/hover title stay specific
// to that occurrence's own quoted sentence even when the number is shared.
// A note with no noteCites must render as plain text (most notes have none).
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';

const baseRec = {
  vaccine: 'MenACWY',
  status: 'due',
  doseLabel: 'Dose 1',
  dueToday: true,
};

describe('RecCard note-citation links (C5/Change 4)', () => {
  it('renders a [c] placeholder as a numbered [1] link to the cited URL', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'Routine adolescent dose at 11–12 years. A booster follows at 16 years [c].',
      noteCites: [{ key: 'acwyRoutine1112and16', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/#:~:text=example', label: 'ACIP 2020 MMWR' }],
    }} />);
    const link = screen.getByText('[1]');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/#:~:text=example');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.className).toContain('note-cite');
  });

  it('renders two placeholders from different pages as two distinct numbered links, in order of first mention', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'Booster in 3 years if before age 7 [c] (otherwise 5 years [c]).',
      noteCites: [
        { key: 'boosterBeforeAge7', page: 'https://example.com/page-a', url: 'https://example.com/page-a#a', label: 'A' },
        { key: 'someOtherRule', page: 'https://example.com/page-b', url: 'https://example.com/page-b#b', label: 'B' },
      ],
    }} />);
    expect(screen.getByText('[1]').getAttribute('href')).toBe('https://example.com/page-a#a');
    expect(screen.getByText('[2]').getAttribute('href')).toBe('https://example.com/page-b#b');
  });

  it('reuses the same number when the same source key repeats in one note', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'Cited here [c] and cited again here [c].',
      noteCites: [
        { key: 'sameSource', url: 'https://example.com/a', label: 'A' },
        { key: 'sameSource', url: 'https://example.com/a', label: 'A' },
      ],
    }} />);
    const links = screen.getAllByText('[1]');
    expect(links).toHaveLength(2);
    expect(screen.queryByText('[2]')).toBeNull();
  });

  it('same-page, different-sentence citations share one number but keep distinct hrefs and hover text', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'Booster in 3 years if before age 7 [c] (otherwise 5 years [c]).',
      noteCites: [
        { key: 'boosterBeforeAge7', page: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm', url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=before', label: 'Aged <7 yrs: 3 years after primary' },
        { key: 'boosterAtOrAfterAge7', page: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm', url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=after', label: 'Aged ≥7 yrs: 5 years after primary' },
      ],
    }} />);
    const links = screen.getAllByText('[1]');
    expect(links).toHaveLength(2);
    expect(screen.queryByText('[2]')).toBeNull();
    expect(links[0].getAttribute('href')).toBe('https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=before');
    expect(links[1].getAttribute('href')).toBe('https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=after');
    expect(links[0].getAttribute('title')).toBe('Aged <7 yrs: 3 years after primary');
    expect(links[1].getAttribute('title')).toBe('Aged ≥7 yrs: 5 years after primary');
  });

  it('a note with no noteCites renders as plain text, no stray links', () => {
    render(<RecCard rec={{ ...baseRec, note: 'A plain note with no citations.', noteCites: [] }} />);
    expect(screen.getByText('A plain note with no citations.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /\[1\]/ })).toBeNull();
  });
});
