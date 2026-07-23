// @vitest-environment happy-dom
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

// Stateful wrapper: Results re-renders live from onChange, same as the
// real App does via its top-level state.
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
    ageMonths: 360, // 30y adult
    riskIds: ['asplenia'],
    menacwyDoses: [],
    menbDoses: [],
    ...overrides,
  };
}

function openRecordedDoses() {
  fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));
  return screen.getByTestId('recorded-doses-panel');
}

// Item 3: RecCard zips doses[i] against doseValidations[i] by array index.
// analyzeHistory() sorts perDose chronologically, so the doses prop shown
// in the audit list must be sorted the same way, or a dose's row shows a
// DIFFERENT dose's validity chip.
describe('Item 3: recorded-dose audit list stays aligned when entered out of order', () => {
  it('shows "Effective dose 1" on the chronologically-earliest row, not the first-entered row', () => {
    render(
      <Harness
        initial={baseState({
          // Entered out of chronological order: 2020 first, 2010 second.
          menacwyDoses: [
            { date: '2020-01-01', brand: '' },
            { date: '2010-01-01', brand: '' },
          ],
        })}
      />
    );

    const progress = document.querySelector('.rec-progress');
    expect(progress).not.toBeNull();
    const rows = Array.from(progress.querySelectorAll('.rec-progress-dose-row'));
    expect(rows.length).toBe(2);

    const row2010 = rows.find(r => r.textContent.includes('2010'));
    const row2020 = rows.find(r => r.textContent.includes('2020'));
    expect(row2010).toBeDefined();
    expect(row2020).toBeDefined();

    // The earlier (2010) dose is effective dose 1; the later (2020) dose is
    // effective dose 2 -- regardless of entry order.
    expect(row2010.textContent).toMatch(/Effective dose 1/);
    expect(row2020.textContent).toMatch(/Effective dose 2/);
  });
});

// Item 5: the Results "Recorded doses" panel and the wizard's StepHistory
// had drifted -- only StepHistory showed the MenB family-lock guidance.
// Both now render the shared DoseEditor, so both must show it.
describe('Item 5: MenB family-lock guidance appears in the Results editor too', () => {
  it('shows "Family locked: MenB-4C" after picking Bexsero as dose 1 in the Results panel', () => {
    render(<Harness initial={baseState({ menbDoses: [{ date: '', brand: '' }] })} />);
    const panel = openRecordedDoses();

    const brandSelect = panel.querySelector('select');
    fireEvent.change(brandSelect, { target: { value: 'Bexsero' } });

    expect(panel.textContent).toMatch(/Family locked: MenB-4C/i);
  });

  it('shows the "brand unknown, both families open" note for an unbranded first MenB dose', () => {
    render(<Harness initial={baseState({ menbDoses: [{ date: '', brand: '' }] })} />);
    const panel = openRecordedDoses();
    expect(panel.textContent).toMatch(/both MenB families remain open/i);
  });
});

// Item 1: adding a dose row should focus its (empty) date input immediately,
// so a clinician doesn't have to hunt for the field.
describe('Item 1: auto-focus the date field on a newly added dose row', () => {
  it('focuses the new row date input when "+ Add MenACWY dose" is clicked', () => {
    render(<Harness initial={baseState()} />);
    openRecordedDoses();

    fireEvent.click(screen.getByRole('button', { name: '+ Add MenACWY dose' }));

    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(1);
    expect(document.activeElement).toBe(dateInputs[0]);
  });

  it('renders no date inputs and does not crash when the panel opens with no doses recorded', () => {
    render(<Harness initial={baseState()} />);
    openRecordedDoses();
    expect(document.querySelectorAll('input[type="date"]').length).toBe(0);
  });
});
