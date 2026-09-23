// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// MenQuadfi's 6-week licence floor — UI layer. The logic-layer twin, with the
// exact-day precision tests and the licence/schedule floor split, is
// src/logic/__tests__/menquadfi-6-week-floor.test.js.
//
// M2 (2026-09-22): a 7-week-old is too young for the SCHEDULE to ask for a
// MenACWY dose (2 months), even though MenQuadfi is now LICENSED from 6
// weeks. A 2-month-old clears the schedule floor and should see both
// products that are licensed that young.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { openWhyThis } from '../../test-why-this.js';

function openAllCards(container) {
  for (const toggle of container.querySelectorAll('.rec-card-head-toggle')) {
    fireEvent.click(toggle);
  }
}

const TODAY = '2026-09-22';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      today={TODAY}
      onChange={patch => setState(s => ({ ...s, ...patch }))}
      onReset={() => {}}
    />
  );
}

const show = (dob) => {
  render(<Harness initial={{
    dob, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [],
  }} />);
};

describe('a 7-week-old with asplenia', () => {
  it('the MenACWY card reads "Not yet age-eligible" — not due, despite MenQuadfi\'s 6-week licence', () => {
    show('2026-08-04'); // 7 weeks (49 days) before TODAY
    // Both MenACWY (schedule floor 2 months) and MenB (10-year floor) read
    // this way at 7 weeks — same convention as
    // regression-newborn-menacwy-not-due-yet-ui.test.jsx.
    expect(screen.getAllByText('Not yet age-eligible')).toHaveLength(2);
  });

  it('no brand chip is offered', () => {
    show('2026-08-04');
    expect(screen.queryByText(/brand options/i)).toBeNull();
    expect(screen.queryByText('MenQuadfi')).toBeNull();
    expect(screen.queryByText('Menveo 2-vial')).toBeNull();
  });
});

describe('a 2-month-old with asplenia', () => {
  it('the card renders BOTH brand chips — Menveo 2-vial and MenQuadfi — not one naming the other missing', () => {
    show('2026-07-22'); // exactly 2 calendar months before TODAY
    expect(screen.getByText(/brand options/i)).toBeDefined();
    expect(screen.getByText('Menveo 2-vial')).toBeDefined();
    expect(screen.getByText('MenQuadfi')).toBeDefined();
  });
});

// M3 (2026-09-23): a dose already recorded at 6 weeks -- before the app's own
// 2-month schedule floor -- must not be described as if nothing had happened.
describe('a 7-week-old with a MenQuadfi dose already given at 6 weeks', () => {
  it('the card does not say "Not yet age-eligible" and states the schedule it actually started', () => {
    const { container } = render(<Harness initial={{
      dob: '2026-08-04', // 7 weeks before TODAY
      riskIds: ['asplenia'],
      menacwyDoses: [{ date: '2026-09-15', brand: 'MenQuadfi (MenACWY)' }], // given at 6 weeks
      menbDoses: [],
      riskAtDoseAnswers: { MenACWY: { 0: 'yes' }, MenB: {} },
    }} />);
    // Cards render collapsed by default (status is 'not-indicated' either
    // way); the note text only exists in the DOM once expanded.
    openAllCards(container);
    openWhyThis();
    // MenB (10-year floor) is legitimately still "Not yet age-eligible" here --
    // only the MenACWY card, which has the MenQuadfi dose, should have moved on.
    expect(screen.getAllByText('Not yet age-eligible')).toHaveLength(1);
    expect(screen.getByText(/6 weeks, then 4, 6 and 12 months/)).toBeDefined();
  });
});
