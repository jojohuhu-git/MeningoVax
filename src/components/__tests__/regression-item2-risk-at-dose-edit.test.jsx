// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Item 2 (2026-07-23 handoff): once a provider answers the risk-at-dose
// "Needs input" prompt, the resolved chip gains an "Edit" link that
// re-opens the same Yes/No/Not sure prompt in place; picking a new answer
// replaces the stored one and closes the prompt back to the resolved chip.
// ─────────────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecCard from '../RecCard.jsx';

const baseRec = {
  vaccine: 'MenACWY',
  status: 'due',
  doseLabel: 'Dose 1',
  dueToday: true,
  seriesTotal: 1,
};

describe('RecCard risk-at-dose prompt edit link (Item 2)', () => {
  it('an answered dose (no stored answer) shows the resolved chip and no Edit link', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }]}
        doseValidations={[{ status: 'valid', effectiveDoseNum: 1, reasons: [] }]}
        riskAtDoseAnswers={{}}
      />
    );
    expect(screen.getByText('Dose 1 of 1')).toBeTruthy();
    expect(screen.queryByTestId('dose-val-edit-risk-answer')).toBeNull();
  });

  it('a dose with a stored risk-at-dose answer shows an Edit link on the resolved chip', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }]}
        doseValidations={[{ status: 'valid', effectiveDoseNum: 1, reasons: [] }]}
        riskAtDoseAnswers={{ 0: 'yes' }}
      />
    );
    expect(screen.getByText('Dose 1 of 1')).toBeTruthy();
    expect(screen.getByTestId('dose-val-edit-risk-answer')).toBeTruthy();
  });

  it('clicking Edit re-opens the Yes/No/Not sure prompt using the dose\'s own date', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }]}
        doseValidations={[{ status: 'valid', effectiveDoseNum: 1, reasons: [] }]}
        riskAtDoseAnswers={{ 0: 'yes' }}
      />
    );
    fireEvent.click(screen.getByTestId('dose-val-edit-risk-answer'));
    expect(screen.getByTestId('risk-at-dose-prompt').textContent).toMatch(/Jan 15, 2020/);
    expect(screen.getByRole('button', { name: 'Yes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'No' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Not sure' })).toBeTruthy();
  });

  it('picking a new answer from the re-opened prompt calls onRiskAtDoseAnswer and closes the prompt', () => {
    const onRiskAtDoseAnswer = vi.fn();
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }]}
        doseValidations={[{ status: 'valid', effectiveDoseNum: 1, reasons: [] }]}
        riskAtDoseAnswers={{ 0: 'yes' }}
        onRiskAtDoseAnswer={onRiskAtDoseAnswer}
      />
    );
    fireEvent.click(screen.getByTestId('dose-val-edit-risk-answer'));
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onRiskAtDoseAnswer).toHaveBeenCalledWith('MenACWY', 0, 'no');
    expect(screen.queryByTestId('risk-at-dose-prompt')).toBeNull();
  });

  it('a still-pending dose (never answered) has no Edit link since there is no chip yet', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-01-15', brand: '' }]}
        doseValidations={[{ status: 'pending', needsInput: true, promptDate: '2020-01-15', reasons: [] }]}
        riskAtDoseAnswers={{}}
      />
    );
    expect(screen.getByTestId('dose-val-pending')).toBeTruthy();
    expect(screen.queryByTestId('dose-val-edit-risk-answer')).toBeNull();
  });
});
