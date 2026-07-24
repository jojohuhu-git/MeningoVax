// @vitest-environment happy-dom
// E5: the standalone ComplianceAudit table was removed in favor of embedding
// its on-time/valid-off-window/invalid/unknown language directly under each
// vaccine (matching vaxapp's compliance-audit color vocabulary). These tests
// replace the coverage that lived in the now-deleted ComplianceAudit.test.jsx —
// most importantly, that a pre-age-10 dose reads as "valid, off-window", never
// as a bare "Invalid" (it was validly administered; it just doesn't count
// toward the routine adolescent series).
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecCard from '../RecCard.jsx';

const baseRec = {
  vaccine: 'MenACWY',
  status: 'due',
  doseLabel: 'Dose 1',
  dueToday: true,
};

describe('RecCard dose-validation chip (E5 vaxapp-style compliance colors)', () => {
  it('labels a plain valid dose "Counts" (green)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2024-01-01', brand: '' }]}
        doseValidations={[{ status: 'valid', reasons: [] }]}
      />
    );
    const chip = screen.getByText('Counts');
    expect(chip.className).toMatch(/dose-val-valid/);
  });

  // C2 (2026-07-23 handoff): when the rec carries a seriesTotal (M) and the
  // result carries an effectiveDoseNum (N), the chip merges into a single
  // "Dose N of M" label instead of two separate chips ("Counts" +
  // "Effective dose N").
  it('labels a valid dose with a known series total "Dose N of M" (green), not two chips', () => {
    render(
      <RecCard
        rec={{ ...baseRec, seriesTotal: 2 }}
        doses={[{ date: '2024-01-01', brand: '' }]}
        doseValidations={[{ status: 'valid', effectiveDoseNum: 1, reasons: [] }]}
      />
    );
    const chip = screen.getByText('Dose 1 of 2');
    expect(chip.className).toMatch(/dose-val-valid/);
    expect(screen.queryByText('Counts')).toBeNull();
    expect(screen.queryByText(/Effective dose/)).toBeNull();
  });

  it('labels a pre-age-10 dose "Off-window - repeat" (amber), never "Invalid"', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2016-01-01', brand: '' }]}
        doseValidations={[{
          status: 'valid',
          notAdolescentCount: true,
          effectiveDoseNum: null,
          reasons: ['Given before age 10 (~9 years): does not count toward the adolescent MenACWY series.'],
        }]}
      />
    );
    const chip = screen.getByText('Off-window - repeat');
    expect(chip.className).toMatch(/dose-val-offwindow/);
    expect(screen.queryByText('Invalid')).toBeNull();
  });

  it('labels an invalid dose "Invalid" (red)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2024-01-01', brand: '' }]}
        doseValidations={[{ status: 'invalid', reasons: ['Given too soon after the prior dose: does not count.'] }]}
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

// §2-3 (2026-07-23 handoff): the "Needs input" prompt on a pending dose.
describe('RecCard "Needs input" chip and risk-at-dose prompt (§2-3)', () => {
  it('renders the "Needs input" chip and the prompt question with the dose date', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }]}
        doseValidations={[{
          status: 'pending',
          needsInput: true,
          promptDate: '2020-01-15',
          reasons: ['Given at ~6 years, before age 10.'],
        }]}
      />
    );
    const chip = screen.getByText('Needs input');
    expect(chip.className).toMatch(/dose-val-needs-input/);
    expect(screen.getByTestId('risk-at-dose-prompt').textContent).toMatch(/Jan 15, 2020/);
    expect(screen.getByRole('button', { name: 'Yes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'No' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not sure' })).toBeTruthy();
  });

  it('clicking "Yes" calls onRiskAtDoseAnswer with the vaccine, dose index, and answer', () => {
    const onRiskAtDoseAnswer = vi.fn();
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }]}
        doseValidations={[{ status: 'pending', needsInput: true, promptDate: '2020-01-15', reasons: [] }]}
        onRiskAtDoseAnswer={onRiskAtDoseAnswer}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onRiskAtDoseAnswer).toHaveBeenCalledWith('MenACWY', 0, 'yes');
  });

  it('clicking "No" and "Not sure" pass the right answer', () => {
    const onRiskAtDoseAnswer = vi.fn();
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }, { date: '2021-01-15', brand: '' }]}
        doseValidations={[
          { status: 'pending', needsInput: true, promptDate: '2020-01-15', reasons: [] },
          { status: 'pending', needsInput: true, promptDate: '2021-01-15', reasons: [] },
        ]}
        onRiskAtDoseAnswer={onRiskAtDoseAnswer}
      />
    );
    const noButtons = screen.getAllByRole('button', { name: 'No' });
    const unsureButtons = screen.getAllByRole('button', { name: 'Not sure' });
    fireEvent.click(noButtons[0]);
    fireEvent.click(unsureButtons[1]);
    expect(onRiskAtDoseAnswer).toHaveBeenCalledWith('MenACWY', 0, 'no');
    expect(onRiskAtDoseAnswer).toHaveBeenCalledWith('MenACWY', 1, 'unsure');
  });
});

// C4 (2026-07-23 handoff): a "Boosters:" body line states the count/cadence
// of FUTURE boosters beyond what's due today. The concrete next date stays
// in the separate booster-due-banner.
describe('RecCard "Boosters:" summary line (C4)', () => {
  it('renders the boosterSummary line when the rec carries one', () => {
    render(
      <RecCard
        rec={{ ...baseRec, boosterSummary: 'Boosters: every 5 years while at high risk (ongoing)' }}
      />
    );
    const line = screen.getByTestId('booster-summary-line');
    expect(line.textContent).toBe('Boosters: every 5 years while at high risk (ongoing)');
  });

  it('renders nothing when the rec has no boosterSummary', () => {
    render(<RecCard rec={baseRec} />);
    expect(screen.queryByTestId('booster-summary-line')).toBeNull();
  });
});

// D3: recorded doses show the age at which each was given, so a clinician
// can compare recommended timing against actual administration age.
describe('RecCard recorded-dose age at administration (D3)', () => {
  it('shows age at administration for a dated dose', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-06-01', brand: '' }]}
        doseValidations={[{ status: 'valid', reasons: [] }]}
        ageMonths={132}
      />
    );
    expect(screen.getByText(/age \d+ years?( \d+ months?)?/)).toBeTruthy();
  });

  it('shows "age unknown" for a dose with no date', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '', brand: '' }]}
        doseValidations={[{ status: 'unknown', reasons: ['No date recorded.'] }]}
        ageMonths={132}
      />
    );
    expect(screen.getByText(/age unknown/)).toBeTruthy();
  });
});
