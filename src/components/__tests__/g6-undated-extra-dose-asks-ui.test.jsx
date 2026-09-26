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

// G8 (2026-09-16) moved this fixture from two undated rows to three: the
// routine series for a healthy 17-year-old is 2 doses while the 16-year
// booster is unproven, and a row with no date cannot prove it. So the third
// row is the one past the total. The chip wording under test is unchanged.
describe('G6 (UI): an undated dose past the series total', () => {
  it('puts the question on the chip instead of asserting an extra dose', () => {
    const rows = rowsFor([newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true })]);
    expect(rows).toHaveLength(3);
    expect(rows[2].textContent).toMatch(/Extra dose\? — no date recorded/);
    expect(rows[2].textContent).not.toMatch(/more than this series needs/);
    expect(rows[2].textContent).not.toMatch(/was already complete/);
  });

  it('asks the owner\'s question in full, and says adding the date settles it', () => {
    const rows = rowsFor([newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true })]);
    expect(rows[2].textContent).toMatch(/Do you mean this was an extra dose given\?/);
    expect(rows[2].textContent).toMatch(/Adding the date settles it/);
  });

  it('does not claim the row is counted and not counted in the same breath', () => {
    const rows = rowsFor([newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true }), newDoseRow({ detailsUnknown: true })]);
    expect(rows[2].textContent).not.toMatch(/Dose is counted in the series/);
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
    expect(rows[2].textContent).toMatch(/Extra dose — more than this series needs/);
    expect(rows[2].textContent).not.toMatch(/Do you mean/);
  });

  it('shows the question chip when the same row is marked unverified', () => {
    render(
      <RecCard
        // status 'due', not 'complete': a neutral card renders collapsed, so its
        // recorded-dose list would not be in the DOM to read a chip out of.
        rec={{ vaccine: 'MenACWY', status: 'due', doseLabel: 'Booster', seriesTotal: 2 }}
        doses={[{ date: '', brand: '', detailsUnknown: true }, { date: '', brand: '', detailsUnknown: true }]}
        doseValidations={[
          { status: 'unknown', effectiveDoseNum: 1, reasons: [] },
          { status: 'unknown', effectiveDoseNum: null, extraDose: true, extraDoseUnverified: true, reasons: ['Do you mean this was an extra dose given?'] },
        ]}
        ageMonths={204}
      />
    );
    const rows = Array.from(document.querySelectorAll('.rec-progress-dose-row'));
    expect(rows[1].textContent).toMatch(/Extra dose\? — no date recorded/);
    expect(rows[1].textContent).not.toMatch(/more than this series needs/);
  });
});
