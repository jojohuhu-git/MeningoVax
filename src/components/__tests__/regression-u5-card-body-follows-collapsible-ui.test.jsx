// @vitest-environment happy-dom
// U5 (2026-09-17): a card that stops being collapsible while it is on screen
// rendered its HEADER and nothing else -- no dose label, no brands, no booster
// line, no note, and no chevron to open it with.
//
// Reproduced live: a 2-month-old with asplenia gets a MenB card reading "Not yet
// age-eligible", which D5 collapses on purpose because it is neutral. Clicking
// "Adjust age" on the results page and changing the age to 16 makes that same
// MOUNTED card due today -- and it went blank apart from its status pill. A
// reload of the identical patient rendered it correctly, which is the signature
// of state that outlived the props it was derived from.
//
// The cause was `useState(!collapsible)` seeded once at mount (PR #4): when
// `collapsible` went true -> false, `expanded` stayed false from the first
// render while the header stopped rendering the toggle button, so nothing could
// ever set it true again. The card body must therefore be derived from
// `collapsible`, not from state that can contradict it.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';

// The MenB card as the 2-month-old sees it: neutral, so D5 collapses it.
const neutralRec = {
  vaccine: 'MenB',
  status: 'not-indicated',
  doseLabel: 'Not yet age-eligible',
  dueToday: false,
};

// The same card after "Adjust age" makes the patient 16: due today, with
// boosters to follow. Not neutral, so it is not collapsible.
const dueRec = {
  vaccine: 'MenB',
  status: 'due',
  doseLabel: 'Dose 1 of 3 (high-risk primary series)',
  dueToday: true,
  doseNum: 1,
  seriesTotal: 3,
  brands: ['Bexsero (MenB)'],
  boosterSummary: 'Boosters: every 5 years while at high risk (ongoing)',
};

describe('U5 (UI): a card body follows `collapsible`, never stale expand state', () => {
  it('a collapsed neutral card that becomes due renders its body', () => {
    const { container, rerender } = render(<RecCard rec={neutralRec} />);

    // Precondition: neutral and collapsed, so there is no body yet.
    expect(container.querySelector('.rec-card-collapsed')).toBeTruthy();
    expect(container.querySelector('.rec-card-inner')).toBeNull();

    // "Adjust age" -> 16: same mounted card, new props.
    rerender(<RecCard rec={dueRec} />);

    // The body, and everything in it, must be on screen.
    const body = container.querySelector('.rec-card-inner');
    expect(body).toBeTruthy();
    expect(container.querySelector('.rec-dose-label').textContent)
      .toBe('Dose 1 of 3 (high-risk primary series)');
    expect(screen.getByText('Bexsero')).toBeTruthy();
    expect(screen.getByTestId('booster-summary-line')).toBeTruthy();
    // A due card is not a collapsed card.
    expect(container.querySelector('.rec-card-collapsed')).toBeNull();
  });

  it('a due card that becomes neutral stays readable and can still be collapsed', () => {
    const { container, rerender } = render(<RecCard rec={dueRec} />);
    expect(container.querySelector('.rec-card-inner')).toBeTruthy();

    // "Adjust age" back down: the same card is now neutral, so it is collapsible.
    rerender(<RecCard rec={neutralRec} />);

    // It must not be stuck open with no way to close it: the toggle is there,
    // the body reads the NEW label, and clicking the toggle collapses it.
    const toggle = container.querySelector('.rec-card-head-toggle');
    expect(toggle).toBeTruthy();
    expect(container.querySelector('.rec-dose-label').textContent).toBe('Not yet age-eligible');

    fireEvent.click(toggle);
    expect(container.querySelector('.rec-card-inner')).toBeNull();
    expect(container.querySelector('.rec-card-collapsed')).toBeTruthy();
  });

  it('a deliberate expand survives an unrelated re-render', () => {
    // The fix must not be "reset on every prop change": a clinician who opened
    // a quiet card should not have it shut again when something else updates.
    const { container, rerender } = render(<RecCard rec={neutralRec} />);
    fireEvent.click(container.querySelector('.rec-card-head-toggle'));
    expect(container.querySelector('.rec-card-inner')).toBeTruthy();

    // Still neutral, still collapsible -- only an unrelated prop moved.
    rerender(<RecCard rec={neutralRec} ageMonths={3} />);
    expect(container.querySelector('.rec-card-inner')).toBeTruthy();
  });
});
