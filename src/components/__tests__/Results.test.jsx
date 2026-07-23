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

// Item 4 (2026-07-23): a 20y patient with no MenACWY history (catch-up,
// REQUIRED) and no MenB history (healthy 16-23y shared-decision, OPTIONAL)
// is the real reachable case where "due today" must not flatten required
// and optional together -- MenB is dueToday but only via shared-decision.
function acwyRequiredMenbOptionalState(overrides = {}) {
  return baseState({ ageMonths: 240, riskIds: [], menacwyDoses: [], menbDoses: [], ...overrides });
}

describe('Item 4: required vs optional in "due today" copy', () => {
  it('summary line states MenACWY is due and MenB is optional, not "Due today: MenACWY and MenB"', () => {
    render(<Harness initial={acwyRequiredMenbOptionalState()} />);
    const summary = screen.getByTestId('results-summary-line');
    expect(summary.textContent).not.toMatch(/Due today: MenACWY and MenB/);
    expect(summary.textContent).toMatch(/Due today: MenACWY/);
    expect(summary.textContent).toMatch(/MenB is optional \(shared clinical decision\)/i);
  });

  it('pentavalent header does not claim both are due, but the pentavalent option still renders', () => {
    render(<Harness initial={acwyRequiredMenbOptionalState()} />);
    const header = screen.queryByTestId('dose-options-header');
    expect(header).not.toBeNull();
    expect(header.textContent).not.toMatch(/both.*due/i);
    expect(header.textContent).toMatch(/MenACWY is due today/i);
    expect(header.textContent).toMatch(/optional \(shared clinical decision\)/i);

    // Owner decision: pentavalentEligible is NOT gated on SCDM -- the combined
    // shot option must still be offered.
    expect(screen.getByTestId('penta-card')).not.toBeNull();
    expect(screen.getByTestId('option-penta-label')).not.toBeNull();
  });

  it('pentavalent note does not say "Both...are due today" in the SCDM case', () => {
    render(<Harness initial={acwyRequiredMenbOptionalState()} />);
    const pentaCard = screen.getByTestId('penta-card');
    expect(pentaCard.textContent).not.toMatch(/Both MenACWY and MenB are due today/);
    expect(pentaCard.textContent).toMatch(/MenB is optional today \(shared clinical decision\)/i);
  });

  it('MenB status badge reads "Optional (shared decision)"', () => {
    render(<Harness initial={acwyRequiredMenbOptionalState()} />);
    expect(screen.getByText('Optional (shared decision)')).toBeDefined();
    expect(screen.queryByText('Shared decision')).toBeNull();
  });

  it('summary line: both required (e.g. high-risk asplenia adult, both due) keeps the original wording', () => {
    // High-risk adult with no history: both MenACWY and MenB are REQUIRED
    // primary-series doses -- not shared-decision.
    render(<Harness initial={baseState({ ageMonths: 240, riskIds: ['asplenia'] })} />);
    const summary = screen.getByTestId('results-summary-line');
    expect(summary.textContent).toMatch(/Due today: MenACWY and MenB/);
    expect(summary.textContent).not.toMatch(/optional/i);
  });
});
