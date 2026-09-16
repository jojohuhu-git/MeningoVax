// @vitest-environment happy-dom
// UI half of G1 — see src/logic/__tests__/g1-pentavalent-credits-both-families.test.js
// for the engine coverage and the ACIP sentences.
//
// What was on screen before this fix, driven through the real wizard: a
// 17-year-old whose only vaccine was a Penbraya six months ago, recorded on the
// MenACWY step (the step a clinician reaches first, and where Penbraya is
// offered). The MenB card read "Dose 1 of 2 ... optional today" — offering a
// shot the patient already had — with an empty MenB record and no antigen
// family established, so Bexsero and Penmenvy were still on the table.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';
import Results from '../Results.jsx';
import StepHistory from '../StepHistory.jsx';

const SIX_MONTHS_AGO = '2026-03-15';   // TEST_TODAY is 2026-09-15

function stateWith({ menacwyDoses = [], menbDoses = [] }) {
  return {
    step: 4, ageMonths: 204, ageGroup: 'adolescent', riskIds: [],
    menacwyDoses, menbDoses,
    riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
  };
}

function menbCard(container) {
  const card = [...container.querySelectorAll('.rec-card')]
    .find((el) => /MenB/.test(el.textContent));
  expect(card, 'MenB card should be on screen').toBeTruthy();
  return card;
}

describe('G1 (UI): a Penbraya recorded under MenACWY shows up in the MenB card', () => {
  function show() {
    return render(
      <Results
        state={stateWith({ menacwyDoses: [{ date: SIX_MONTHS_AGO, brand: 'Penbraya' }] })}
        onReset={() => {}} onChange={() => {}} onBack={() => {}}
      />,
    );
  }

  it('the MenB card lists the shared dose and says where it was recorded', () => {
    const card = menbCard(show().container);
    expect(card.textContent).toMatch(/Penbraya/);
    expect(card.textContent).toMatch(/one shot covering both — recorded under MenACWY/);
  });

  it('the shared dose is graded as MenB dose 1 of 2, not ignored', () => {
    expect(menbCard(show().container).textContent).toMatch(/Dose 1 of 2/);
  });

  it('only the Pfizer (FHbp) products are offered for the next dose — the family is locked', () => {
    const brands = menbCard(show().container).querySelector('.rec-brands');
    expect(brands, 'the MenB card should offer brands for the next dose').toBeTruthy();
    expect(brands.textContent).toMatch(/Trumenba|Penbraya/);
    expect(brands.textContent).not.toMatch(/Bexsero|Penmenvy/);
  });
});

describe('G1 (UI): the MenB history step says the dose is already counted', () => {
  it('shows the credit note before the clinician answers yes or no', () => {
    render(
      <StepHistory
        vaccine="MenB" doses={[]} onChange={() => {}} brandOptions={[]}
        creditedDoses={[{ date: SIX_MONTHS_AGO, brand: 'Penbraya', creditedFrom: 'MenACWY' }]}
      />,
    );
    const note = screen.getByTestId('pentavalent-credited-here');
    expect(note.textContent).toMatch(/recorded on the MenACWY step counts as a MenB dose too/);
  });

  it('keeps showing it after "No previous doses" is chosen — the double-entry case', () => {
    render(
      <StepHistory
        vaccine="MenB" doses={[]} onChange={() => {}} brandOptions={[]}
        creditedDoses={[{ date: SIX_MONTHS_AGO, brand: 'Penbraya', creditedFrom: 'MenACWY' }]}
      />,
    );
    fireEvent.click(screen.getByText(/no previous doses/i));
    expect(screen.getByTestId('pentavalent-credited-here')).toBeTruthy();
  });

  it('says nothing when there is no pentavalent on the other step', () => {
    render(<StepHistory vaccine="MenB" doses={[]} onChange={() => {}} brandOptions={[]} />);
    expect(screen.queryByTestId('pentavalent-credited-here')).toBeNull();
  });
});

describe('G1 (UI): the whole wizard, a 17-year-old with one Penbraya', () => {
  function driveToMenbStep() {
    render(<App />);
    fireEvent.click(screen.getByText(/years \/ months/i));
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '17' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));   // → Risks
    fireEvent.click(screen.getByRole('button', { name: /next/i }));   // → MenACWY
    fireEvent.click(screen.getByText(/yes, record doses/i));
    fireEvent.click(screen.getByRole('button', { name: /add dose/i }));
    // The row's labels aren't wired to their controls (no htmlFor), so reach the
    // two fields directly rather than by label text.
    const row = document.querySelector('.dose-row');
    fireEvent.change(row.querySelector('input[type="date"]'), { target: { value: SIX_MONTHS_AGO } });
    fireEvent.change(row.querySelector('select'), { target: { value: 'Penbraya' } });
    return row;
  }

  it('warns on the MenACWY step that this one entry covers both vaccines', () => {
    driveToMenbStep();
    expect(screen.getByTestId('pentavalent-covers-both').textContent)
      .toMatch(/do not record it\s+again on the MenB step/);
  });

  it('carries the credit to the MenB step and on to the results', () => {
    driveToMenbStep();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));   // → MenB
    expect(screen.getByTestId('pentavalent-credited-here')).toBeTruthy();

    fireEvent.click(screen.getByText(/no previous doses/i));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    const card = menbCard(document.body);
    expect(card.textContent).toMatch(/one shot covering both — recorded under MenACWY/);
    expect(card.textContent).toMatch(/Dose 1 of 2/);
  });
});
