// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// G6 UI layer (2026-09-16): an undated row past the series total asks the
// clinician rather than telling them something the record cannot support.
// Owner decision: "ask, don't assert", scoped to undated doses only.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import RecCard from '../RecCard.jsx';
import { newDoseRow } from '../../logic/doseIdentity.js';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return <Results state={state} onChange={p => setState(s => ({ ...s, ...p }))} onReset={() => {}} />;
}

function rowsFor(menacwyDoses) {
  render(
    <Harness
      initial={{
        ageMonths: 204, // 17y, healthy
        riskIds: [],
        menacwyDoses,
        menbDoses: [],
        riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
      }}
    />
  );
  return Array.from(document.querySelectorAll('.rec-progress-dose-row'));
}

// STOP C C1 (owner, 2026-11-15): an undated row never counts, so none is
// "past the total" any more. Each reads "No date recorded — not counted"; the
// G6 question chip ("Extra dose? — no date recorded") was retired with it.
// G6's point is kept: an undated row is never ASSERTED to be an extra dose.
describe('G6 (UI) under C1: undated rows say they are not counted, never "extra"', () => {
  it('every undated row reads "No date recorded — not counted"', () => {
    const rows = rowsFor([newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true })]);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.textContent).toMatch(/No date recorded — not counted/);
      expect(row.textContent).not.toMatch(/more than this series needs/);
      expect(row.textContent).not.toMatch(/series was complete/); // G1-a (2026-11-19): the extra-dose line now reads "series was complete"
    }
  });

  it('says why, and that adding the date changes it', () => {
    const rows = rowsFor([newDoseRow({ detailsUnknown: true })]);
    expect(rows[0].textContent).toMatch(/Only dated records count/);
    expect(rows[0].textContent).toMatch(/Add the date to check this dose/)   // P64 (review v10);
    // extinct: the undated 'counted' sentence was removed with STOP C C1, 2026-11-16.
    expect(rows[0].textContent).not.toMatch(/Dose is counted in the series/);
  });

  // The dated-extra case is pinned on the card directly: at the ages where a
  // healthy routine series is already closed, the results screen does not
  // render a recorded-dose list to read the chip out of. The mapping from
  // validator result to chip wording is the thing under test here.
  it('keeps the assertive chip for a DATED dose that genuinely exceeds the series', () => {
    render(
      <RecCard
        // status 'due', not 'complete': a neutral card renders collapsed, so its
        // recorded-dose list would not be in the DOM to read a chip out of.
        rec={{ vaccine: 'MenACWY', status: 'due', doseLabel: 'Booster', seriesTotal: 2 }}
        doses={[
          { date: '2017-09-15', brand: 'Menveo' },
          { date: '2022-09-15', brand: 'Menveo' },
          { date: '2025-09-15', brand: 'Menveo' },
        ]}
        doseValidations={[
          { status: 'valid', effectiveDoseNum: 1, reasons: [] },
          { status: 'valid', effectiveDoseNum: 2, reasons: [] },
          { status: 'valid', effectiveDoseNum: null, extraDose: true, reasons: ['Given after the 2-dose series was already complete: this dose does not extend the series.'] },
        ]}
        ageMonths={240}
      />
    );
    const rows = Array.from(document.querySelectorAll('.rec-progress-dose-row'));
    expect(rows[2].textContent).toMatch(/Not counted — Extra\. Do not repeat\./);
    // extinct: the G6 undated question was retired with STOP C C1, 2026-11-16.
    expect(rows[2].textContent).not.toMatch(/Do you mean/);
  });
});
