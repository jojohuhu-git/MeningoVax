// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Review v10, Batch 1 (owner answers 2026-11-20,
// docs/archive/decisions-2026-11-20-review-v10.md): the words on the entry
// screen, and the two app sentences that said "tick".
//
//   P1  Risk factors sub-heading: "Select all that apply. They set which doses
//       and boosters are due." (was "…these drive vaccine class and booster
//       schedule": jargon)
//   P2  Dose date label: "Date" (was "Date (optional)": a dose with no date is
//       not counted, owner C1, so "optional" misled). A row with a brand but
//       no date says so under the row: "A dose with no date is not counted."
//   P3  The "details unknown" checkbox: "Check this if a dose was given but its
//       date and brand are unknown. It stays on the record, not counted. Empty
//       rows are removed when you continue."
//   P73 Outbreak card: "uncheck the outbreak box" (was "untick")
//   P74 Implausible-risk note: "Check that the age and the checkboxes are
//       right." (was "…the tick-boxes are both right.")
//
// Owner, 2026-11-20: "Don't use 'tick'." Every sentence here comes from the
// approved wording in the decisions file; none adds a clinical claim.
// ─────────────────────────────────────────────────────────────────────────
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepRisks from '../StepRisks.jsx';
import DoseEditor from '../DoseEditor.jsx';
import { recommend } from '../../logic/recommend.js';
import { noteText } from '../../test-note-text.js';
import { MENACWY_BRANDS } from '../../data/brands.js';

const TODAY = '2026-11-20';
const MV = MENACWY_BRANDS.find((b) => b.key === 'Menveo 2-vial').key;
const editor = (doses) => render(
  <DoseEditor vaccine="MenACWY" doses={doses} onChange={() => {}} brandOptions={MENACWY_BRANDS} today={TODAY} />,
);

describe('Review v10 Batch 1: entry-screen wording, and no "tick"', () => {
  it('P1: the risk-factor sub-heading says what the boxes set, without jargon', () => {
    const { container } = render(<StepRisks riskIds={[]} onChange={() => {}} />);
    const sub = container.querySelector('.step-sub').textContent;
    // Rule 4 (no semicolons) kept, owner 2026-11-20: the approved ";" became a period.
    expect(sub).toBe('Select all that apply. They set which doses and boosters are due.');
    // extinct: the v9-era sub-heading, retired by P1.
    expect(sub).not.toMatch(/drive vaccine class/);
  });

  // P2's hint under the row already existed (STOP C C1's "With no date, this
  // dose is not counted…", data-testid dose-date-missing); the live check on
  // 2026-11-20 found a second copy would repeat it, so P2 only drops "optional".
  it('P2: the date label is "Date", and the one no-date line still shows', () => {
    const { container } = editor([{ date: '', brand: MV }]);
    const labels = [...container.querySelectorAll('.dose-field label')].map((l) => l.textContent);
    expect(labels).toContain('Date');
    // extinct: "Date (optional)", retired by P2.
    expect(labels).not.toContain('Date (optional)');
    expect(screen.getAllByTestId('dose-date-missing')).toHaveLength(1);
  });

  it('P2: a dated row carries no "not counted" line', () => {
    editor([{ date: '2026-01-15', brand: MV }]);
    expect(screen.queryByTestId('dose-date-missing')).toBeNull();
  });

  it('P3: the details-unknown checkbox says "Check this", and what happens to the dose', () => {
    const { container } = editor([{ date: '', brand: '' }]);
    const box = container.querySelector('.dose-row-unknown');
    const squash = (s) => s.replace(/\s+/g, ' ').trim();
    // The hint is its own line on screen (`display: block`), so read the two lines apart.
    const hint = squash(box.querySelector('.dose-row-unknown-hint').textContent);
    const lead = squash(box.textContent.replace(box.querySelector('.dose-row-unknown-hint').textContent, ''));
    expect(lead).toBe('Check this if a dose was given but its date and brand are unknown.');
    expect(hint).toBe('It stays on the record, not counted. Empty rows are removed when you continue.');
    const text = `${lead} ${hint}`;
    // extinct: "Tick this to keep the dose on the record", retired by P3.
    expect(text).not.toMatch(/\btick/i);
  });

  it('P73: the outbreak card says "uncheck the outbreak box"', () => {
    const r = recommend({ today: '2026-09-15', ageMonths: 72, riskIds: ['outbreak_acwy'],
      menacwyDoses: [{ date: '2023-09-14' }], menbDoses: [] }).menacwy[0];
    expect(noteText(r)).toMatch(/If the patient is no longer at risk, uncheck the outbreak box\./);
    // extinct: "untick the outbreak box", retired by P73.
    expect(noteText(r)).not.toMatch(/untick/i);
  });

  it('P74: the implausible-risk note says "checkboxes", not "tick-boxes"', () => {
    const out = recommend({ today: TODAY, dob: '2023-11-01', riskIds: ['military'], menacwyDoses: [], menbDoses: [] });
    const footer = out.riskAgeNote && out.riskAgeNote.footer;
    expect(footer).toMatch(/Check that the age and the checkboxes are right\.$/);
    // extinct: "the tick-boxes are both right", retired by P74.
    expect(footer).not.toMatch(/tick/i);
  });
});
