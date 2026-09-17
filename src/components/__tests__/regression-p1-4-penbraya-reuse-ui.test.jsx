// @vitest-environment happy-dom
// UI half of P1-4 — see src/logic/__tests__/regression-p1-4-penbraya-reuse.test.js
// for the engine coverage and the CDC sentences.
//
// The defect on screen: a patient at increased risk who had a Penbraya two
// months ago was offered the combined pentavalent shot again, as "Option 2:
// One combined injection". CDC allows Penbraya for additional doses only once
// at least 6 months have elapsed since the most recent Penbraya dose.
//
// Withholding the COMBINED shot must not withhold the vaccine — the separate
// MenB card still offers Trumenba the same day. And the card has to say why the
// combined option is missing, rather than dropping it with no explanation.

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

const TWO_MONTHS_AGO = '2026-07-15'; // TEST_TODAY is 2026-09-15
const SIX_MONTHS_AGO = '2026-03-15';

function show(penbrayaDate) {
  return render(
    <Results
      state={{
        step: 4, ageMonths: 196, ageGroup: 'adolescent', riskIds: ['asplenia'],
        menacwyDoses: [],
        menbDoses: [{ date: penbrayaDate, brand: 'Penbraya' }],
        riskAtDoseAnswers: { MenACWY: {}, MenB: { 0: 'yes' } },
      }}
      onReset={() => {}} onChange={() => {}} onBack={() => {}}
    />,
  ).container;
}

describe('P1-4 (UI): the combined shot is withheld within 6 months of a Penbraya', () => {
  it('the "one combined injection" option is not offered', () => {
    expect(show(TWO_MONTHS_AGO).querySelector('[data-testid="option-separate-label"]'))
      .toBeNull();
  });

  it('the card says why the combined option is missing', () => {
    const reason = show(TWO_MONTHS_AGO)
      .querySelector('[data-testid="pentavalent-unavailable-reason"]');
    expect(reason, 'a reason should be shown, not a silently missing option').toBeTruthy();
    expect(reason.textContent).toMatch(/6 months/);
  });

  it('the MenB vaccine itself is still offered as a separate shot', () => {
    // Withholding the convenience of one injection must never withhold the dose.
    // Match on the card's own heading: the MenACWY card also mentions "MenB"
    // in its pentavalent wording, so a bare /MenB/ search finds the wrong card.
    const card = [...show(TWO_MONTHS_AGO).querySelectorAll('.rec-card')]
      .find((el) => /^MenB/.test(el.textContent.trim()));
    expect(card, 'the MenB card should be on screen').toBeTruthy();
    expect(card.textContent).toMatch(/Trumenba/);
  });
});

describe('P1-4 (UI): at 6 months the combined shot comes back', () => {
  it('the pentavalent option is offered again', () => {
    expect(show(SIX_MONTHS_AGO).querySelector('[data-testid="option-separate-label"]'))
      .toBeTruthy();
  });

  it('and no "not an option" reason is shown', () => {
    expect(show(SIX_MONTHS_AGO)
      .querySelector('[data-testid="pentavalent-unavailable-reason"]')).toBeNull();
  });
});
