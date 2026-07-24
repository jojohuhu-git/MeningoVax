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
  it('shows "Dose 1 of 2" on the chronologically-earliest row, not the first-entered row', () => {
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
    expect(row2010.textContent).toMatch(/Dose 1 of 2/);
    expect(row2020.textContent).toMatch(/Dose 2 of 2/);
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

  it('does not render the redundant pentavalent header (status is already stated by the summary line and per-card badges), and the pentavalent option still renders', () => {
    // Parked UX item #2 (2026-07-23, owner-approved after a before/after
    // preview): the dose-options-header restated due/optional status that the
    // results-summary-line and each RecCard's own status badge already state
    // -- 3-4x redundancy. Deleted rather than reworded.
    render(<Harness initial={acwyRequiredMenbOptionalState()} />);
    expect(screen.queryByTestId('dose-options-header')).toBeNull();

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

  it('MenB status badge reads "Optional today - shared decision"', () => {
    render(<Harness initial={acwyRequiredMenbOptionalState()} />);
    expect(screen.getByText('Optional today - shared decision')).toBeDefined();
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

// §2-3 (2026-07-23 handoff): answering the risk-at-dose "Needs input" prompt
// updates state.riskAtDoseAnswers and the recommendation re-renders live --
// same onChange -> state -> re-render cycle as every other editable field.
describe('Risk-at-dose "Needs input" prompt updates live', () => {
  it('answering "Yes" on an ambiguous high-risk dose resolves the chip to "Dose 1 of 2" and updates the dose count', () => {
    render(
      <Harness
        initial={baseState({
          ageMonths: 120, // 10y, high-risk (asplenia)
          menacwyDoses: [{ date: '2020-01-15', brand: 'Menveo (MenACWY)' }], // given ~4y
        })}
      />
    );

    expect(screen.getByText('Needs input')).toBeTruthy();
    expect(screen.queryByText('Dose 1 of 2')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(screen.queryByText('Needs input')).toBeNull();
    expect(screen.getByText('Dose 1 of 2')).toBeTruthy();
  });

  it('answering "No" resolves the chip to "Off-window - repeat" and the dose still does not count', () => {
    render(
      <Harness
        initial={baseState({
          ageMonths: 120,
          menacwyDoses: [{ date: '2020-01-15', brand: 'Menveo (MenACWY)' }],
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'No' }));

    expect(screen.queryByText('Needs input')).toBeNull();
    expect(screen.getByText('Off-window - repeat')).toBeTruthy();
    expect(screen.queryByText('Dose 1 of 2')).toBeNull();
  });
});
