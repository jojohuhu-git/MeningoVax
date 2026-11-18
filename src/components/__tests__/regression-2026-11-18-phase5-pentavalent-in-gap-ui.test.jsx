// @vitest-environment happy-dom
// Port Phase 5 F2a (owner, 2026-11-18): on the days between MenB dose 2's
// 4-week minimum and its 1-month date, the combined shot is offered when
// MenACWY is due. The screen must not call MenB "due" on those days — it says
// MenB "can be given today", the card's own Q9a sentence.
//
// Owner's patient: asplenia, 20 y, Bexsero 11/3/26, no MenACWY, seen Dec 1, 2026.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Results from '../Results.jsx';

const state = (menbDoses) => ({
  step: 4, dob: '2006-01-01', riskIds: ['asplenia'],
  menacwyDoses: [], menbDoses,
  riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
});
const show = (today) => render(
  <Results state={state([{ date: '2026-11-03', brand: 'Bexsero (MenB)' }])} today={today}
    onReset={() => {}} onChange={() => {}} onBack={() => {}} />,
).container;

describe('F2a (screen): combined shot in the gap', () => {
  it('Dec 1: both options shown; the summary says MenB can be given today, not that it is due', () => {
    const c = show('2026-12-01');
    expect(c.querySelector('[data-testid="option-separate-label"]')).toBeTruthy();
    expect(c.textContent).toContain('One pentavalent (MenABCWY) dose may replace both.');
    expect(c.textContent).toContain('Due today: MenACWY. MenB dose 2 can also be given today (its minimum interval has passed), as two separate shots or one combined pentavalent shot.');
    expect(c.textContent).not.toContain('Due today: MenACWY and MenB');
  });

  it('Nov 30: no combined shot, unchanged', () => {
    const c = show('2026-11-30');
    expect(c.querySelector('[data-testid="option-separate-label"]')).toBeNull();
    expect(c.textContent).toContain('Due today: MenACWY.');
  });

  it('Dec 3: both due, unchanged', () => {
    const c = show('2026-12-03');
    expect(c.textContent).toContain('Due today: MenACWY and MenB, as two separate shots or one combined pentavalent shot.');
  });
});
