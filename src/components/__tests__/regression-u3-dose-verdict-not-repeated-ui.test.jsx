// @vitest-environment happy-dom
// UI layer for U3. Engine-layer coverage of the shortened verdict is in
// src/logic/__tests__/regression-u3-dose-verdict-not-repeated.test.js.
//
// What a clinician saw before this fix, on a four-dose infant series with the
// risk-timing question answered: the same 154-character sentence four times,
// about twelve lines of it, differing only in the age. The parts that repeated
// were already on the row -- the "Dose N of 4" chip, and the "Edit" button that
// reopens the very question the sentence kept citing.
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { TEST_TODAY } from '../../test-today.js';

const DOSES = [
  { date: '2025-09-15' }, { date: '2025-11-17' },
  { date: '2026-01-19' }, { date: '2026-08-15' },
];
const ANSWERS = { 0: 'yes', 1: 'yes', 2: 'yes', 3: 'yes' };

function showCard() {
  const r = recommend({
    today: TEST_TODAY, ageMonths: 14, riskIds: ['asplenia'],
    menacwyDoses: DOSES, menbDoses: [],
    riskAtDoseAnswers: { MenACWY: ANSWERS },
  });
  const history = r.history.MenACWY;
  return render(
    <RecCard
      rec={r.menacwy[0]}
      doses={history.sortedDoses}
      doseValidations={history.perDose}
      ageMonths={14}
      riskAtDoseAnswers={ANSWERS}
    />,
  );
}

describe('U3 · the recorded-doses block on a four-dose series', () => {
  it('no longer prints the same long sentence on every row', () => {
    const { container } = showCard();
    expect(container.textContent).not.toMatch(/in response to the risk-timing question/i); // extinct: shortened away (U3, 2026-09-17)
    expect(container.textContent).not.toMatch(/Counted toward the high-risk series/i); // extinct: shortened away (U3, 2026-09-17)
  });

  it('still says, on each row, that high risk was confirmed and when', () => {
    const { container } = showCard();
    const confirmations = container.textContent.match(/high risk confirmed at ~[^.]+/gi) || [];
    expect(confirmations).toHaveLength(4);
    // The ages are what differ between rows -- and they are all still there.
    expect(new Set(confirmations).size).toBe(4);
  });

  it('keeps the two things the deleted words were duplicating', () => {
    const { container, getAllByTestId } = showCard();
    // "counted toward the series" -- the chip says it
    expect(container.textContent).toMatch(/Dose 1 of 4/);
    expect(container.textContent).toMatch(/Dose 4 of 4/);
    // "in response to the risk-timing question" -- the Edit button is it
    expect(getAllByTestId('dose-val-edit-risk-answer')).toHaveLength(4);
  });
});
