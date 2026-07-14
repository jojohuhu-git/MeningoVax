// @vitest-environment happy-dom
// E5: the standalone ComplianceAudit table was removed in favor of embedding
// its on-time/valid-off-window/invalid/unknown language directly under each
// vaccine (matching vaxapp's compliance-audit color vocabulary). These tests
// replace the coverage that lived in the now-deleted ComplianceAudit.test.jsx —
// most importantly, that a pre-age-10 dose reads as "valid, off-window", never
// as a bare "Invalid" (it was validly administered; it just doesn't count
// toward the routine adolescent series).
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

describe('RecCard dose-validation chip (E5 vaxapp-style compliance colors)', () => {
  it('labels a plain valid dose "On time" (green)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2024-01-01', brand: '' }]}
        doseValidations={[{ status: 'valid', reasons: [] }]}
      />
    );
    const chip = screen.getByText('On time');
    expect(chip.className).toMatch(/dose-val-valid/);
  });

  it('labels a pre-age-10 dose "Valid — off-window" (amber), never "Invalid"', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2016-01-01', brand: '' }]}
        doseValidations={[{
          status: 'valid',
          notAdolescentCount: true,
          effectiveDoseNum: null,
          reasons: ['Given before age 10 (~9 years) — does not count toward the adolescent MenACWY series.'],
        }]}
      />
    );
    const chip = screen.getByText('Valid — off-window');
    expect(chip.className).toMatch(/dose-val-offwindow/);
    expect(screen.queryByText('Invalid')).toBeNull();
  });

  it('labels an invalid dose "Invalid" (red)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2024-01-01', brand: '' }]}
        doseValidations={[{ status: 'invalid', reasons: ['Given too soon after the prior dose — does not count.'] }]}
      />
    );
    const chip = screen.getByText('Invalid');
    expect(chip.className).toMatch(/dose-val-invalid/);
  });

  it('labels an unknown-date dose "Unknown" (gray)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '', brand: '' }]}
        doseValidations={[{ status: 'unknown', reasons: ['No date recorded.'] }]}
      />
    );
    const chip = screen.getByText('Unknown');
    expect(chip.className).toMatch(/dose-val-unknown/);
  });
});
