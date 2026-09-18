// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Calendar P1-1 UI layer (fix queue 2026-09-17): the clinician-visible half of
// the month-end age flaw.
//
// Reproduced on the dev server with the page clock set to 1 February 2026: a
// date of birth of 31 January 2026 — a real one-day-old — was answered with
// "Please enter a valid age before continuing." and the field was cleared. The
// engine had computed the baby's age as -0.0714 months, StepAge dropped it for
// being below zero, and App saw no age at all.
//
// This is the patient who most needs the app: an at-risk newborn (asplenia,
// sickle cell) born on the 30th or 31st of January. Three days a year, the app
// was unusable for them.
//
// The logic-layer test lives in
// src/logic/__tests__/regression-cal-p1-1-month-end-ages.test.js.
// ─────────────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../../App.jsx';
import { TEST_TODAY } from '../../test-today.js';

// The suite's pinned clock is 2026-09-15; this finding only shows itself in
// February, so these two tests move the clock and put it back.
function setClock(iso) {
  vi.setSystemTime(new Date(`${iso}T12:00:00`));
}

describe('calendar P1-1 (UI): a newborn born at the end of a month is accepted', () => {
  afterEach(() => setClock(TEST_TODAY));

  it('a one-day-old born 31 January is not refused on 1 February', () => {
    setClock('2026-02-01');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2026-01-31' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.queryByText(/please enter a valid age/i)).toBeNull();
    // We should be past the Age step, on Risks.
    expect(screen.queryByText('Patient Age')).toBeNull();
  });

  it('the same baby seen on 2 February is accepted too', () => {
    setClock('2026-02-02');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2026-01-31' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.queryByText(/please enter a valid age/i)).toBeNull();
  });

  it('a date of birth in the future is still refused', () => {
    setClock('2026-02-01');
    render(<App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2026-03-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/please enter a valid age/i)).toBeDefined();
  });
});
