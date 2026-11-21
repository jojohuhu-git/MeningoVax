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

// Owner, 2026-11-21 ("Can be given (Rec.)"): from 6 weeks the MenACWY card
// says MenQuadfi can be given today; dose 1 is still due at 2 months. Was:
// "Not yet due (from 2 months)" with no brand offered.
describe('a 7-week-old with asplenia', () => {
  it('the MenACWY card reads "Can be given today", dose 1 of 4, next dose due at 2 months', () => {
    show('2026-08-04'); // 7 weeks (49 days) before TODAY
    expect(screen.getByText('Can be given today')).toBeDefined();
    expect(screen.getByText('Dose 1 of 4 (infant high-risk)')).toBeDefined();
    expect(screen.getByText('Next dose due Oct 4, 2026')).toBeDefined();
    // MenB is unchanged: its 10-year floor.
    expect(screen.getAllByText('Not yet due (from 10 years)')).toHaveLength(1);
  });

  // Owner, 2026-11-21 ("Yes, add it"): the summary line above the cards names
  // the offer too, so a clinician skimming it does not miss the card.
  it('the summary line says nothing is due, and that MenQuadfi can be given today', () => {
    show('2026-08-04');
    expect(screen.getByTestId('results-summary-line').textContent)
      .toBe('No MenACWY or MenB doses due today. MenQuadfi can be given today.');
  });

  it('offers MenQuadfi only ("Brand: MenQuadfi") — Menveo is licensed from 2 months', () => {
    show('2026-08-04');
    expect(screen.getByText('Brand: MenQuadfi')).toBeDefined();
    expect(screen.queryByText('Menveo 2-vial')).toBeNull();
  });
});

describe('controls for the summary line', () => {
  it('a 5-week-old with asplenia (under 6 weeks): no offer, summary unchanged', () => {
    show('2026-08-18'); // 35 days before TODAY
    expect(screen.getByTestId('results-summary-line').textContent).toBe('No MenACWY or MenB doses due today.');
  });
  it('a 2-month-old with asplenia: dose 1 is due, summary unchanged', () => {
    show('2026-07-22');
    expect(screen.getByTestId('results-summary-line').textContent).toBe('Due today: MenACWY.');
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
  it('the card does not say "Not yet due (from 2 months)" and states the schedule it actually started', () => {
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
    // MenB (10-year floor) is legitimately still "Not yet due (from 10 years)" here --
    // only the MenACWY card, which has the MenQuadfi dose, should have moved on.
    expect(screen.getAllByText('Not yet due (from 10 years)')).toHaveLength(1);
    expect(screen.queryByText('Not yet due (from 2 months)')).toBeNull();
    // MQ6-e (owner, 2026-11-21, "Same as at 2 months"): dose 2, due at 4 months.
    expect(screen.getByText('Dose 2 (infant high-risk series)')).toBeDefined();
    expect(screen.getByText('Next dose due Dec 4, 2026')).toBeDefined();
    // Only the MenB card (10-year floor) still reads "Not needed".
    expect(screen.getAllByText('Not needed')).toHaveLength(1);
  });
});
