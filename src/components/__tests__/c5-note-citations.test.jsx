// @vitest-environment happy-dom
// C5 (2026-07-23 handoff): note.noteCites markers ([N]) must render as
// clickable links to the ACIP MMWR text-fragment, and a note with no
// noteCites must render as plain text (most notes have none).
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

describe('RecCard note-citation links (C5)', () => {
  it('renders a [1] marker as a link to the cited URL', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'Routine adolescent dose at 11–12 years. A booster follows at 16 years [1].',
      noteCites: [{ marker: '[1]', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/#:~:text=example', label: 'ACIP 2020 MMWR' }],
    }} />);
    const link = screen.getByText('[1]');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/#:~:text=example');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.className).toContain('note-cite');
  });

  it('renders two distinct markers as two distinct links', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'Booster in 3 years if before age 7 [1] (otherwise 5 years [2]).',
      noteCites: [
        { marker: '[1]', url: 'https://example.com/a', label: 'A' },
        { marker: '[2]', url: 'https://example.com/b', label: 'B' },
      ],
    }} />);
    expect(screen.getByText('[1]').getAttribute('href')).toBe('https://example.com/a');
    expect(screen.getByText('[2]').getAttribute('href')).toBe('https://example.com/b');
  });

  it('a note with no noteCites renders as plain text, no stray links', () => {
    render(<RecCard rec={{ ...baseRec, note: 'A plain note with no citations.', noteCites: [] }} />);
    expect(screen.getByText('A plain note with no citations.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /\[1\]/ })).toBeNull();
  });
});
