// @vitest-environment happy-dom
// G4 (2026-09-16), UI half: the record panel renders the citation the
// validator now attaches to an age-based "does not count" verdict.
//
// Before this change the panel printed its verdicts as plain text with no
// support for citations at all (showReasonsBlock), while the recommendation
// cards above carried numbered superscript links. The clinician most likely to
// be challenged on a verdict — "this dose doesn't count" — was the one with no
// source to point at.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { cite } from '../../data/refs.js';

const baseRec = { vaccine: 'MenACWY', status: 'due', doseLabel: 'Dose 1', dueToday: true, seriesTotal: 2 };

function renderWithVerdict(result) {
  render(
    <RecCard
      rec={baseRec}
      doses={[{ date: '2019-06-01', brand: '' }]}
      doseValidations={[result]}
    />
  );
}

describe('G4: record-panel verdicts render their citation', () => {
  it('a pre-age-10 verdict shows a numbered superscript linking to the ACIP sentence', () => {
    renderWithVerdict({
      status: 'valid',
      effectiveDoseNum: null,
      notAdolescentCount: true,
      reasons: ['Given before age 10 (~4 years 9 months): does not count toward the adolescent MenACWY series. [c]'],
      reasonCites: [cite('acwyBeforeAge10')],
    });

    const link = screen.getByText('[1]');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toContain('cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm');
    // The hover text is the quoted ACIP sentence itself, same as the cards.
    expect(link.getAttribute('title')).toContain('before age 10 years');
    expect(link.className).toContain('note-cite');
  });

  it('two verdicts citing different pages get different numbers', () => {
    renderWithVerdict({
      status: 'valid',
      effectiveDoseNum: null,
      notAdolescentCount: true,
      reasons: [
        'Given before age 16: does not count toward the healthy 2-dose MenB series. [c]',
        'Second reason citing a different document. [c]',
      ],
      reasonCites: [cite('menbHealthyPreferredAge1618'), cite('menbHealthy2Dose0and6')],
    });
    expect(screen.getByText('[1]')).toBeTruthy();
    expect(screen.getByText('[2]')).toBeTruthy();
  });

  // The card note and the verdicts on its recorded doses are one numbering
  // sequence: two different documents must never both render as [1] inside the
  // same card, and the verdict above the note must not be numbered after it.
  it('a card numbers its dose verdict and its note in reading order', () => {
    render(
      <RecCard
        rec={{
          ...baseRec,
          vaccine: 'MenB',
          note: 'Healthy 2-dose series at 0 and 6 months. [c]',
          noteCites: [cite('menbHealthy2Dose0and6')],            // Oct 2024 MMWR
        }}
        doses={[{ date: '2024-06-01', brand: '' }]}
        doseValidations={[{
          status: 'valid',
          effectiveDoseNum: null,
          notAdolescentCount: true,
          reasons: ['Given before age 16: does not count toward the healthy 2-dose MenB series. [c]'],
          reasonCites: [cite('menbHealthyPreferredAge1618')],    // ACIP 2020 MMWR
        }]}
      />
    );
    const verdict = document.querySelector('.dose-val-reason a.note-cite');
    const noteLink = document.querySelector('.rec-note a.note-cite');
    expect(verdict.textContent).toBe('[1]');   // appears first on screen
    expect(noteLink.textContent).toBe('[2]');  // a different document, a different number
    expect(verdict.getAttribute('href')).toContain('rr6909a1');
    expect(noteLink.getAttribute('href')).toContain('mm7349a3');
  });

  it('a verdict with no citation renders exactly as before, no stray marker', () => {
    renderWithVerdict({
      status: 'valid',
      effectiveDoseNum: 1,
      reasons: ['After excluding the dose(s) above that do not count, this counts as effective dose 1.'],
    });
    expect(screen.queryByText(/^\[\d+\]$/)).toBeNull();
    expect(screen.getByText(/effective dose 1/)).toBeTruthy();
  });
});
