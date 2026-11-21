// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// The clinician-visible half: a newborn's Results page must not be headed
// "Due today: MenACWY."
//
// Reproduced in the running app before the fix — an at-risk newborn reached a
// Results page with that heading, a "Dose due today" pill, and a Menveo brand
// chip to choose, at an age below the 2 months CDC gives as Menveo's minimum.
//
// The logic-layer test, and the live CDC citation behind the 2-month floor, are
// in src/logic/__tests__/regression-newborn-menacwy-not-due-yet.test.js.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={patch => setState(s => ({ ...s, ...patch }))}
      onReset={() => {}}
    />
  );
}

function newborn(riskIds) {
  return {
    ageMonths: 0.0357,   // a one-day-old
    riskIds,
    menacwyDoses: [],
    menbDoses: [],
    riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
  };
}

describe('a newborn\'s Results page does not say MenACWY is due today', () => {
  it('the page is not headed "Due today: MenACWY"', () => {
    render(<Harness initial={newborn(['asplenia'])} />);
    expect(screen.queryByText(/due today: menacwy/i)).toBeNull();
    expect(screen.getByText(/no menacwy or menb doses due today/i)).toBeDefined();
  });

  it('the MenACWY card reads "Not yet due (from 2 months)", collapsed, like MenB\'s', () => {
    render(<Harness initial={newborn(['asplenia'])} />);
    // Both are true for a newborn — MenACWY from 2 months, MenB from 10 years —
    // so the phrase is expected on both cards.
    // Review v10 P21: each card names its own age (MenACWY 2 months, MenB 10 years).
    expect(screen.getAllByText('Not yet due (from 2 months)')).toHaveLength(1);
    expect(screen.getAllByText('Not yet due (from 10 years)')).toHaveLength(1);
    expect(screen.getAllByText('Not needed')).toHaveLength(2);
  });

  it('no brand is offered to choose', () => {
    render(<Harness initial={newborn(['asplenia'])} />);
    expect(screen.queryByText(/brand options/i)).toBeNull();
    expect(screen.queryByText(/Menveo/)).toBeNull();
  });

  it('the same is true for an infant with a travel indication', () => {
    render(<Harness initial={newborn(['travel'])} />);
    expect(screen.queryByText(/due today: menacwy/i)).toBeNull();
    expect(screen.getAllByText('Not yet due (from 2 months)').length).toBeGreaterThanOrEqual(1);
  });

  it('a two-month-old with the same risk IS offered the dose', () => {
    render(<Harness initial={{ ...newborn(['asplenia']), ageMonths: 2 }} />);
    expect(screen.getByText(/due today: menacwy/i)).toBeDefined();
    expect(screen.getByText('Dose 1 of 4 (infant high-risk)')).toBeDefined();
  });
});
