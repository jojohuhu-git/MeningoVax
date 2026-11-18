// @vitest-environment happy-dom
// U4 (2026-09-17): copy-voice pass — write for a clinician, not for the code.
//
// Two chips described the RECORD rather than the patient:
//   "Recorded — not part of an indicated series"  reads as a database state.
//   "Extra dose — beyond the indicated series total"  is `seriesTotal`, the
//      code's own variable name, surfacing in the interface.
//
// Not changed here, deliberately: "Off-window - repeat". That chip's wording is
// an owner-agreed design decision (2026-07-23 handoff, C2 revision) and this
// pass does not reopen settled decisions — only the two labels the audit named.
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';

const DOSE = { date: '2025-09-15', brand: 'Menveo 2-vial' };
// A 'due' card, not a 'complete' one: complete/not-indicated cards collapse to
// a single row (D5), and a collapsed card does not render its dose rows at all.
const baseRec = { vaccine: 'MenACWY', status: 'due', doseLabel: 'Dose due', dueToday: true };

const showRow = (result, seriesTotal) => render(
  <RecCard
    rec={{ ...baseRec, seriesTotal }}
    doses={[DOSE]}
    doseValidations={[result]}
  />,
);

describe('U4 · the recorded-dose chips say what happened to the patient', () => {
  it('a dose recorded when nothing is indicated is described as given, not as a record', () => {
    // seriesTotal null = this vaccine is not currently indicated at all.
    const { container } = showRow({ status: 'valid', effectiveDoseNum: 1 }, null);
    expect(container.textContent).toMatch(/Dose 1/); // owner STOP E1 Q9 (2026-11-17): the dose number, as PneumoVax
    expect(container.textContent).not.toMatch(/Given — not part of a series this patient needs/); // extinct: STOP E1 Q9 (2026-11-17)
    expect(container.textContent).not.toMatch(/Recorded — not part of an indicated series/); // extinct: reworded to "Given —…" (U4, 2026-09-17)
  });

  it('an extra dose is measured against the series, not against a "series total"', () => {
    const { container } = showRow({ status: 'valid', effectiveDoseNum: 3, extraDose: true }, 2);
    expect(container.textContent).toMatch(/Not counted — Extra\. Do not repeat\./); // owner STOP E1 Q8 (2026-11-17)
    expect(container.textContent).not.toMatch(/indicated series total/i); // extinct: U4 (2026-09-17) wording, gone from every label since STOP E1 (2026-11-17)
  });

  it('no chip anywhere still uses the code\'s vocabulary for the series total', () => {
    for (const [result, total] of [
      [{ status: 'valid', effectiveDoseNum: 1 }, 4],
      [{ status: 'valid', effectiveDoseNum: 1 }, null],
      [{ status: 'valid', effectiveDoseNum: 3, extraDose: true }, 2],
      [{ status: 'valid', effectiveDoseNum: 3, extraDoseUnverified: true }, 2],
      [{ status: 'invalid', effectiveDoseNum: 2 }, 4],
    ]) {
      const { container } = showRow(result, total);
      // extinct: U4 (2026-09-17) wording, gone from every label since STOP E1 (2026-11-17)
      expect(container.textContent).not.toMatch(/indicated series/i);
    }
  });
});
