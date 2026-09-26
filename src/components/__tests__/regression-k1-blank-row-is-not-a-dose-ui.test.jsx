// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// K1 UI layer (2026-09-24): what the clinician actually sees when they click
// "+ Add dose" and then type nothing into the row.
//
// Two moments, both needed:
//
// (a) The sweep. A row left empty must not follow the patient out of the
//     history step. Every blank row goes, not just a trailing one — add
//     three, fill the first and third, and the empty one in the middle is
//     dropped too.
//
// (b) The engine ignores blank rows anyway. The sweep alone is not enough:
//     the Results "Recorded doses" panel recalculates the recommendation on
//     every render, so the instant "+ Add MenACWY dose" is clicked there is
//     a blank row in the record and the answer on screen has already moved —
//     with no "leaving the step" moment to sweep at.
//
// What must NOT happen: a row being cleared the moment it reads blank. Every
// new row starts blank, so the row the clinician just asked for would vanish
// as it appeared. The tests below pin that too.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';
import Results from '../Results.jsx';

const TEEN16 = 192; // 16y against the pinned test clock

// ── (a) the sweep, driven through the real wizard ────────────────────────
function enterAgeYears(years) {
  fireEvent.click(screen.getByText(/years \/ months/i));
  fireEvent.change(screen.getByLabelText('Years'), { target: { value: String(years) } });
}
const nextBtn = () => screen.getByRole('button', { name: /next/i });
const backBtn = () => screen.getByRole('button', { name: /back/i });
const dateInputs = () =>
  Array.from(document.querySelectorAll('.dose-row input[type="date"]'));

function toMenacwyHistory(years = 16) {
  render(<App />);
  enterAgeYears(years);
  fireEvent.click(nextBtn());   // Age → Risks
  fireEvent.click(nextBtn());   // Risks → MenACWY history
  fireEvent.click(screen.getByText('Yes, record doses'));
}

function addRows(n) {
  for (let i = 0; i < n; i++) {
    fireEvent.click(screen.getByRole('button', { name: /add dose/i }));
  }
}

describe('K1 (a): leaving a history step drops the rows nobody filled in', () => {
  it('keeps the filled rows, in order, and drops the empty one between them', () => {
    toMenacwyHistory();
    addRows(3);
    expect(dateInputs()).toHaveLength(3);

    fireEvent.change(dateInputs()[0], { target: { value: '2024-01-10' } });
    fireEvent.change(dateInputs()[2], { target: { value: '2026-03-15' } });

    fireEvent.click(nextBtn());          // → MenB history, sweeping on the way
    fireEvent.click(backBtn());          // ← back to MenACWY history

    const kept = dateInputs().map(i => i.value);
    expect(kept).toEqual(['2024-01-10', '2026-03-15']);
  });

  it('drops a trailing empty row too', () => {
    toMenacwyHistory();
    addRows(2);
    fireEvent.change(dateInputs()[0], { target: { value: '2024-01-10' } });

    fireEvent.click(nextBtn());
    fireEvent.click(backBtn());

    expect(dateInputs().map(i => i.value)).toEqual(['2024-01-10']);
  });

  it('sweeps on Back as well as on Next', () => {
    toMenacwyHistory();
    addRows(2);
    fireEvent.change(dateInputs()[1], { target: { value: '2024-01-10' } });

    fireEvent.click(backBtn());          // ← to Risks, sweeping on the way
    fireEvent.click(nextBtn());          // → back to MenACWY history

    expect(dateInputs().map(i => i.value)).toEqual(['2024-01-10']);
  });

  it('does NOT clear a row the instant it reads blank — the new row stays put', () => {
    toMenacwyHistory();
    addRows(1);
    expect(dateInputs()).toHaveLength(1);
    addRows(1);
    expect(dateInputs()).toHaveLength(2);
  });
});

// ── (b) the live Results panel, where there is no "leaving" moment ────────
function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return <Results state={state} onChange={p => setState(s => ({ ...s, ...p }))} onReset={() => {}} />;
}

function renderResults(menacwyDoses = [], menbDoses = []) {
  render(
    <Harness
      initial={{
        ageMonths: TEEN16,
        riskIds: [],
        menacwyDoses,
        menbDoses,
        riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
      }}
    />
  );
}

const acwyCard = () =>
  Array.from(document.querySelectorAll('[data-testid="rec-card"]'))
    .find(c => c.textContent.startsWith('MenACWY'));

const recordedDosesBtn = () =>
  screen.getByRole('button', { name: /recorded doses/i });

const addAcwyRow = () => {
  fireEvent.click(recordedDosesBtn());
  fireEvent.click(screen.getByRole('button', { name: /add menacwy dose/i }));
};

describe('K1 (b): adding an empty row in the Results panel changes nothing on screen', () => {
  // Measured before the fix, for a healthy 16-year-old with no history: the
  // card read "Catch-up dose due today / Dose 1 (catch-up, ≥16y, no booster
  // needed)" and turned into "Dose due today / Booster (16y) / Recorded: D1 ·
  // date unknown" the instant the empty row appeared.
  it('the MenACWY card says the same thing after "+ Add MenACWY dose" is clicked', () => {
    renderResults();
    const before = acwyCard().textContent;
    const beforeClass = acwyCard().className;

    addAcwyRow();

    expect(acwyCard().textContent).toBe(before);
    expect(acwyCard().className).toBe(beforeClass);
  });

  it('specifically: the empty row is not listed as a dose of unknown date', () => {
    renderResults();
    addAcwyRow();
    expect(acwyCard().textContent).not.toMatch(/date unknown/);
    expect(acwyCard().textContent).toMatch(/catch-up/i);
  });

  it('the row is still there to type into', () => {
    renderResults();
    addAcwyRow();
    expect(document.querySelectorAll('.dose-history-row input[type="date"]')).toHaveLength(1);
  });

  it('typing a date into that row DOES change the answer', () => {
    renderResults();
    const before = acwyCard().textContent;

    addAcwyRow();
    fireEvent.change(document.querySelector('.dose-history-row input[type="date"]'),
      { target: { value: '2026-03-15' } });

    expect(acwyCard().textContent).not.toBe(before);
    expect(acwyCard().textContent).toMatch(/Mar 15, 2026/);
  });
});

describe('K1: the "Recorded doses" counter counts doses, not empty rows', () => {
  it('shows no count when the only row is blank', () => {
    renderResults([{ id: 'k1a', date: '', brand: '' }]);
    expect(recordedDosesBtn().textContent).not.toMatch(/\(\d+\)/);
  });

  it('counts only the filled rows when the record is a mix', () => {
    renderResults(
      [{ id: 'k1a', date: '2024-01-10', brand: '' }, { id: 'k1b', date: '', brand: '' }],
      [{ id: 'k1c', date: '', brand: '' }]
    );
    expect(recordedDosesBtn().textContent).toMatch(/\(1\)/);
  });
});

// ── the way the clinician says "a dose was given, I have no details" ──────
const unknownTicks = () =>
  screen.getAllByRole('checkbox', { name: /a dose was given, but the date and brand are unknown/i });
const unknownTick = () => unknownTicks()[0];

describe('K1: an empty row can be kept on purpose', () => {
  it('offers the tick only while the row has neither a date nor a brand', () => {
    toMenacwyHistory();
    addRows(1);
    expect(unknownTick()).toBeTruthy();

    fireEvent.change(dateInputs()[0], { target: { value: '2024-01-10' } });
    expect(screen.queryByRole('checkbox', { name: /date and brand are unknown/i })).toBeNull();
  });

  it('starts unticked — the app never assumes a dose was given', () => {
    toMenacwyHistory();
    addRows(1);
    expect(unknownTick().checked).toBe(false);
  });

  it('a ticked row survives leaving the step, and an untouched one does not', () => {
    toMenacwyHistory();
    addRows(2);
    expect(unknownTicks()).toHaveLength(2);
    fireEvent.click(unknownTicks()[0]);   // tick the FIRST row only

    fireEvent.click(nextBtn());
    fireEvent.click(backBtn());

    expect(dateInputs()).toHaveLength(1);
    expect(unknownTick().checked).toBe(true);
  });

  it('a ticked row counts as a recorded dose on the results', () => {
    renderResults([{ id: 'k1t', date: '', brand: '', detailsUnknown: true }]);
    expect(recordedDosesBtn().textContent).toMatch(/\(1\)/);
    expect(acwyCard().textContent).toMatch(/date unknown/);
  });
});
