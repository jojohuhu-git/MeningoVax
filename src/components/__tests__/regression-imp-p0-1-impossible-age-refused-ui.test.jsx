// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Impossible-entries P0-1, the clinician-visible half.
//
// Before: typing the year as 0026 showed "2000 years 7 months · Adult (19+)"
// and Next carried straight on to a complete adult recommendation. The Years
// box accepted 999 the same way, despite carrying max="120".
//
// After: the entry is refused where it is typed, with a sentence naming the
// field and the likely cause, and no age reaches the rest of the app.
//
// The logic-layer test is
// src/logic/__tests__/regression-imp-p0-1-impossible-age-refused.test.js.
// ─────────────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';

const dobBox = () => screen.getByLabelText('Date of Birth');
const nextBtn = () => screen.getByRole('button', { name: /next/i });
function switchToYearsMonths() {
  fireEvent.click(screen.getByText(/years \/ months/i));
}

describe('impossible P0-1 (UI): a mistyped year is refused, not answered', () => {
  it('a year typed as 0026 does not produce an age badge', () => {
    render(<App />);
    fireEvent.change(dobBox(), { target: { value: '0026-02-02' } });
    expect(screen.queryByText(/2000 years/)).toBeNull();
    expect(screen.queryByText(/Adult \(19\+\)/)).toBeNull();
  });

  it('it says what is probably wrong, naming the year', () => {
    render(<App />);
    fireEvent.change(dobBox(), { target: { value: '0026-02-02' } });
    expect(screen.getByText(/check the year/i)).toBeDefined();
  });

  it('Next does not carry on to a recommendation', () => {
    render(<App />);
    fireEvent.change(dobBox(), { target: { value: '0026-02-02' } });
    fireEvent.click(nextBtn());
    // Still on the Age step.
    expect(screen.getByText('Patient Age')).toBeDefined();
  });

  // NOT TESTED HERE, deliberately: a date of birth in the future.
  //
  // happy-dom's date input enforces the `max` attribute by clamping the value to
  // "" — so the component never sees the future date and there is nothing to
  // assert. A real browser does NOT do this: `max` marks the input invalid but
  // leaves the typed value alone, which is why the finding was reachable at all.
  //
  // Driven in the running browser instead, on 2026-09-17, by setting the value
  // through the native setter exactly as a typing clinician would:
  //   "That date of birth is in the future. Check the year — if it is a typo,
  //    correct it."
  // and asserted at the logic layer in the companion test. Writing a happy-dom
  // test here would assert happy-dom's behaviour, not the app's.

  it('correcting the year clears the message and gives the real age back', () => {
    render(<App />);
    fireEvent.change(dobBox(), { target: { value: '0026-02-02' } });
    expect(screen.getByText(/check the year/i)).toBeDefined();
    fireEvent.change(dobBox(), { target: { value: '2026-02-02' } });
    expect(screen.queryByText(/check the year/i)).toBeNull();
    expect(screen.getByText(/Infant \(<2y\)/)).toBeDefined();
  });

  it('the Years box refuses 999, which its own max="120" never enforced', () => {
    render(<App />);
    switchToYearsMonths();
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '999' } });
    expect(screen.queryByText(/999 years/)).toBeNull();
    expect(screen.getByText(/cannot be more than 120 years old/i)).toBeDefined();
  });

  it('the Years box still accepts a real age', () => {
    render(<App />);
    switchToYearsMonths();
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '7' } });
    expect(screen.queryByText(/cannot be more than/i)).toBeNull();
    expect(screen.getByText(/Child \(2–10y\)/)).toBeDefined();
  });

  it('switching entry mode clears a stale message', () => {
    render(<App />);
    fireEvent.change(dobBox(), { target: { value: '0026-02-02' } });
    expect(screen.getByText(/check the year/i)).toBeDefined();
    switchToYearsMonths();
    expect(screen.queryByText(/check the year/i)).toBeNull();
  });
});
