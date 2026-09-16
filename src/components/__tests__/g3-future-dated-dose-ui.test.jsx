// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// G3 UI layer (2026-09-16): what a clinician actually sees when a dose is
// dated in the future — the most likely cause being a mistyped year.
//
// Two places have to say it, because there are two places to notice it:
// the row where the date was typed, and the recorded-dose verdict on the
// results card. The verdict must not read "Invalid", which sends the reader
// hunting for a clinical mistake instead of a typo.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { newDoseRow } from '../../logic/doseIdentity.js';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={patch => setState(s => ({ ...s, ...patch }))}
      onReset={() => {}}
    />
  );
}

function baseState(overrides = {}) {
  return {
    ageMonths: 204, // 17y
    riskIds: ['asplenia'],
    menacwyDoses: [],
    menbDoses: [],
    riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
    ...overrides,
  };
}

// Pinned clock is 2026-09-15.
const FUTURE = '2027-05-01';

describe('G3 (UI): a dose dated in the future', () => {
  it('is not counted as a dose of the series on the results card', () => {
    render(<Harness initial={baseState({ menbDoses: [newDoseRow({ date: FUTURE })] })} />);

    const row = Array.from(document.querySelectorAll('.rec-progress-dose-row'))
      .find(r => r.textContent.includes('2027'));
    expect(row, 'expected the future-dated dose to appear in the record').toBeDefined();
    expect(row.textContent).toMatch(/Date is in the future/i);
    expect(row.textContent).not.toMatch(/Dose 1 of/);
    // "Invalid" is the wrong word for a typo, and the repeat advice is for a
    // dose that was actually given.
    expect(row.textContent).not.toMatch(/\bInvalid\b/);
    expect(row.textContent).not.toMatch(/repeat this dose/i);
  });

  it('is flagged on the row where the date was typed, not only on the card', () => {
    // NOTE on how this is driven. The date input carries max={today}, and
    // happy-dom enforces `max` by refusing the value outright — so a future
    // date cannot be typed into it under test. Real browsers do NOT do that:
    // they accept a typed or pasted out-of-range date and merely mark the
    // field :invalid, which nothing was reading. That difference is the whole
    // reason this bug exists, so the state is set the way a real browser
    // hands it over — a row that already holds a future date.
    const { unmount } = render(
      <Harness initial={baseState({ menbDoses: [newDoseRow({ date: FUTURE })] })} />
    );
    fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));

    const flag = screen.getByTestId('dose-date-in-future');
    expect(flag.textContent).toMatch(/future/i);
    expect(flag.textContent).toMatch(/not counted/i);
    // It sits on the dose row itself, where the date was entered.
    expect(flag.closest('.dose-row')).not.toBeNull();

    // The same row with the year corrected carries no flag. (A fresh render
    // rather than a rerender: the harness seeds its state on mount, the same
    // as the app seeds from a fresh visit.)
    unmount();
    render(<Harness initial={baseState({ menbDoses: [newDoseRow({ date: '2025-05-01' })] })} />);
    fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));
    expect(screen.queryByTestId('dose-date-in-future')).toBeNull();
  });

  it('leaves the recommendation where an empty record leaves it', () => {
    const { unmount } = render(<Harness initial={baseState({ menbDoses: [newDoseRow({ date: FUTURE })] })} />);
    const withFuture = screen.getByTestId('results-summary-line')?.textContent
      ?? document.querySelector('.results-summary-line').textContent;
    unmount();

    render(<Harness initial={baseState()} />);
    const withNothing = screen.getByTestId('results-summary-line')?.textContent
      ?? document.querySelector('.results-summary-line').textContent;

    expect(withFuture).toBe(withNothing);
  });
});
