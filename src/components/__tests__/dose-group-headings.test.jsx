// @vitest-environment happy-dom
// dose-group-headings.test.jsx
//
// UI layer for the "Primary series" / "Boosters" headings in the recorded-dose
// list (owner decision 2026-09-15, option A). The logic layer — where the
// primary series ends on each schedule — is locked in
// src/logic/__tests__/primary-vs-booster-boundary.test.js.
//
// The behaviour that matters to a clinician scanning the list:
//   * every dose sits under a heading naming its phase
//   * a dose that does NOT count keeps its place in DATE order rather than
//     being moved to the bottom, so the list still lines up against the chart
//   * boosters are never numbered

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecCard, { doseRowsWithGroups } from '../RecCard.jsx';

const baseRec = {
  vaccine: 'MenACWY',
  status: 'complete',
  doseLabel: 'Complete',
  seriesTotal: 2,
  primaryTotal: 1,
};

describe('doseRowsWithGroups', () => {
  it('opens a Primary series group, then a Boosters group', () => {
    const rows = doseRowsWithGroups(
      [{ date: '2020-01-01' }, { date: '2025-01-01' }],
      [{ effectiveDoseNum: 1 }, { effectiveDoseNum: 2 }],
      1,
    );
    expect(rows.map((r) => (r.kind === 'group' ? r.label : `dose${r.index}`))).toEqual([
      'Primary series', 'dose0', 'Boosters', 'dose1',
    ]);
  });

  it('keeps a non-counting dose in date order inside the open group', () => {
    // 11y counts, 14y is off-window and counts for nothing, 16y is the booster.
    // The 14y dose must stay between them, NOT be moved below the boosters.
    const rows = doseRowsWithGroups(
      [{ date: '2021-01-01' }, { date: '2024-01-01' }, { date: '2026-01-01' }],
      [{ effectiveDoseNum: 1 }, { effectiveDoseNum: null }, { effectiveDoseNum: 2 }],
      1,
    );
    expect(rows.map((r) => (r.kind === 'group' ? r.label : `dose${r.index}`))).toEqual([
      'Primary series', 'dose0', 'dose1', 'Boosters', 'dose2',
    ]);
  });

  it('puts a non-counting dose recorded before the series above the first heading', () => {
    const rows = doseRowsWithGroups(
      [{ date: '2019-01-01' }, { date: '2021-01-01' }],
      [{ effectiveDoseNum: null }, { effectiveDoseNum: 1 }],
      2,
    );
    expect(rows.map((r) => (r.kind === 'group' ? r.label : `dose${r.index}`))).toEqual([
      'dose0', 'Primary series', 'dose1',
    ]);
  });

  it('emits no headings at all when the vaccine is not an indicated series', () => {
    const rows = doseRowsWithGroups(
      [{ date: '2021-01-01' }],
      [{ effectiveDoseNum: 1 }],
      null,
    );
    expect(rows.every((r) => r.kind === 'dose')).toBe(true);
  });

  it('groups an open-ended schedule: primary doses, then unnumbered boosters', () => {
    // Asplenia, MenACWY from 2 months: all four doses are primary (CDC calls it
    // "A 2-4-dose primary series"), then lifelong boosters.
    const rows = doseRowsWithGroups(
      [{}, {}, {}, {}, {}, {}],
      [1, 2, 3, 4, 5, 6].map((n) => ({ effectiveDoseNum: n })),
      4,
    );
    const labels = rows.filter((r) => r.kind === 'group').map((r) => r.label);
    expect(labels).toEqual(['Primary series', 'Boosters']);
    // the boosters group opens at dose 5, not before
    const boosterAt = rows.findIndex((r) => r.kind === 'group' && r.label === 'Boosters');
    expect(rows[boosterAt + 1]).toMatchObject({ kind: 'dose', index: 4 });
  });
});

// A completed series renders collapsed — which is exactly when a clinician
// clicks in to check the dose count — so open the card the way they would.
function renderExpanded(ui) {
  const out = render(ui);
  fireEvent.click(screen.getByRole('button', { name: /MenACWY/ }));
  return out;
}

describe('RecCard renders the headings', () => {
  it('shows both headings for a routine patient with the 16y booster given', () => {
    renderExpanded(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2021-01-01', brand: '' }, { date: '2026-01-01', brand: '' }]}
        doseValidations={[
          { status: 'valid', effectiveDoseNum: 1, reasons: [] },
          { status: 'valid', effectiveDoseNum: 2, reasons: [] },
        ]}
      />,
    );
    expect(screen.getByTestId('dose-group-primary')).toHaveTextContent('Primary series');
    expect(screen.getByTestId('dose-group-booster')).toHaveTextContent('Boosters');
    // the 16y dose reads as a plain "Booster", never "Booster (dose 2)"
    expect(screen.getByText('Dose 1 of 2')).toBeTruthy();
    expect(screen.queryByText(/Booster \(dose/)).toBeNull();
  });

  it('shows only the Primary series heading while the booster is still owed', () => {
    renderExpanded(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2021-01-01', brand: '' }]}
        doseValidations={[{ status: 'valid', effectiveDoseNum: 1, reasons: [] }]}
      />,
    );
    expect(screen.getByTestId('dose-group-primary')).toBeTruthy();
    expect(screen.queryByTestId('dose-group-booster')).toBeNull();
  });
});
