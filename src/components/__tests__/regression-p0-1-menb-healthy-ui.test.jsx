// @vitest-environment happy-dom
// UI-layer regression for fix-2026-07-23 P0-1 (see
// src/logic/__tests__/regression-p0-1-menb-healthy-age16-gate.test.js for the
// engine-layer coverage and the full rationale).
//
// A healthy patient's MenB dose given before age 16 must render as
// "Off-window — repeat" — NOT "Counts" / an effective-dose chip — so the clinician
// is not told an age-10 dose validly started the healthy 2-dose series.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';

describe('P0-1 (UI): a healthy pre-16 MenB dose renders "Off-window — repeat", not "Counts"', () => {
  it('MenB shared-decision Dose 1 of 2 with an age-10 dose flagged notAdolescentCount', () => {
    render(
      <RecCard
        rec={{
          vaccine: 'MenB',
          status: 'shared-decision',
          doseLabel: 'Dose 1 of 2 (shared clinical decision)',
          dueToday: true,
        }}
        doses={[{ date: '2020-07-23', brand: 'Bexsero (MenB)' }]}
        doseValidations={[{
          status: 'valid',
          notAdolescentCount: true,
          effectiveDoseNum: null,
          reasons: ['Given before age 16 (~10 years): does not count toward the healthy 2-dose MenB series, which is recommended at 16–23 years.'],
        }]}
      />
    );
    const chip = screen.getByText('Off-window — repeat');
    expect(chip.className).toMatch(/dose-val-offwindow/);
    // Must NOT read as an on-time counted dose, and must NOT read as invalid.
    expect(screen.queryByText('Counts')).toBeNull();
    expect(screen.queryByText('Invalid')).toBeNull();
  });
});
