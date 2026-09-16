// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// G7 UI layer (2026-09-16): what a clinician sees when one shot has been
// recorded on two rows. The old card said "Invalid — Given only 0 days
// after the previous dose… repeat this dose only", which reads as an
// instruction to give a dose the patient has already had.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { newDoseRow } from '../../logic/doseIdentity.js';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return <Results state={state} onChange={p => setState(s => ({ ...s, ...p }))} onReset={() => {}} />;
}

const DAY = '2024-01-10';

function renderTwice() {
  render(
    <Harness
      initial={{
        ageMonths: 204, // 17y
        riskIds: [],
        menacwyDoses: [newDoseRow({ date: DAY, brand: 'Menveo' }), newDoseRow({ date: DAY, brand: 'Menveo' })],
        menbDoses: [],
        riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
      }}
    />
  );
  return Array.from(document.querySelectorAll('.rec-progress-dose-row'));
}

describe('G7 (UI): one shot recorded on two rows', () => {
  it('labels the second row as a repeated entry, not an invalid dose', () => {
    const rows = renderTwice();
    expect(rows).toHaveLength(2);
    expect(rows[1].textContent).toMatch(/Entered twice/i);
    expect(rows[1].textContent).not.toMatch(/\bInvalid\b/);
  });

  it('never tells the clinician to repeat a dose the patient has had', () => {
    const rows = renderTwice();
    expect(rows[1].textContent).not.toMatch(/repeat this dose/i);
    expect(rows[1].textContent).not.toMatch(/minimum interval/i);
    expect(rows[1].textContent).toMatch(/remove this row|correct its date/i);
  });

  it('still counts the shot once, on the first row', () => {
    const rows = renderTwice();
    expect(rows[0].textContent).toMatch(/Dose 1 of/);
  });
});
