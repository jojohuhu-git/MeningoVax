// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StepRisks from '../StepRisks.jsx';
import { RISK_FACTORS } from '../../data/riskFactors.js';

describe('StepRisks — "None of these risk factors apply" control (parked UX #5)', () => {
  it('renders as a real button, not a label wrapping a checkbox', () => {
    render(<StepRisks riskIds={[]} onChange={() => {}} />);
    const control = screen.getByRole('button', { name: /none of these risk factors apply/i });
    expect(control.tagName).toBe('BUTTON');
    // No nested checkbox input — a single interactive control, not two.
    expect(control.querySelector('input')).toBeNull();
  });

  it('reflects "all clear" state via aria-pressed, not a checked checkbox', () => {
    const { rerender } = render(<StepRisks riskIds={['military']} onChange={() => {}} />);
    let control = screen.getByRole('button', { name: /none of these risk factors apply/i });
    expect(control).toHaveAttribute('aria-pressed', 'false');

    rerender(<StepRisks riskIds={[]} onChange={() => {}} />);
    control = screen.getByRole('button', { name: /none of these risk factors apply/i });
    expect(control).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking it clears all selected risk factors', () => {
    const onChange = vi.fn();
    render(<StepRisks riskIds={[RISK_FACTORS[0].id, RISK_FACTORS[1].id]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /none of these risk factors apply/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('is keyboard-activatable like a normal button (native Enter/Space, no custom handler needed)', () => {
    const onChange = vi.fn();
    render(<StepRisks riskIds={['military']} onChange={onChange} />);
    const control = screen.getByRole('button', { name: /none of these risk factors apply/i });
    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
