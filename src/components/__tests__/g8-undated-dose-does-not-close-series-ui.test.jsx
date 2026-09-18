// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// G8 UI layer (2026-09-16): what the clinician actually reads.
//
// Before: a healthy 17-year-old with one row left blank and one real dose
// dated at 16y6m saw "Booster (16y) — dose due today" on the card and, on
// the documented dose right below it, "Given after the 1-dose series was
// already complete". The app was recommending a shot the record showed the
// patient had received six months earlier.
//
// After: the documented dose counts, the card reads Up to date, and when
// NO dose on record can be placed at ≥16y the card says why it still wants
// the booster instead of asserting there is no such dose.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { newDoseRow } from '../../logic/doseIdentity.js';
import { openWhyThis } from '../../test-why-this.js';

const TEEN = 204;                   // 17y against the pinned test clock
const DOSE_AT_16_5 = '2026-03-15';  // age 16y6m

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return <Results state={state} onChange={p => setState(s => ({ ...s, ...p }))} onReset={() => {}} />;
}

function renderWith(menacwyDoses, ageMonths = TEEN) {
  render(
    <Harness
      initial={{
        ageMonths,
        riskIds: [],
        menacwyDoses,
        menbDoses: [],
        riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
      }}
    />
  );
  // U1 (2026-09-17): the "a recorded dose has no date" caveat is part of the
  // note's detail, behind "Why this" -- open it, since these assertions read
  // the card's full text.
  openWhyThis();
  const cards = Array.from(document.querySelectorAll('[data-testid="rec-card"]'));
  return {
    acwyCard: cards.find(c => c.textContent.startsWith('MenACWY')),
    rows: Array.from(document.querySelectorAll('.rec-progress-dose-row')),
  };
}

const dated = (date) => ({ ...newDoseRow(), date });

describe('G8 (UI): a blank date does not push out a documented dose', () => {
  it('does not ask for a booster the patient has on record', () => {
    const { acwyCard } = renderWith([newDoseRow(), dated(DOSE_AT_16_5)]);
    expect(acwyCard.textContent).toMatch(/Up to date/);
    expect(acwyCard.textContent).not.toMatch(/Booster \(16y\)/);
    expect(acwyCard.textContent).not.toMatch(/due today/i);
  });

  it('never tells the clinician the series was already complete', () => {
    const { acwyCard } = renderWith([newDoseRow(), dated(DOSE_AT_16_5)]);
    expect(acwyCard.textContent).not.toMatch(/was already complete/);
  });
});

describe('G8 (UI): when no dose can be placed at 16 years or older', () => {
  it('says the date is missing rather than claiming there is no such dose', () => {
    const { acwyCard } = renderWith([newDoseRow(), newDoseRow()]);
    expect(acwyCard.textContent).toMatch(/Booster \(16y\)/);
    expect(acwyCard.textContent).toMatch(/recorded doses have no date/);
    expect(acwyCard.textContent).toMatch(/cannot be confirmed from this record/);
    expect(acwyCard.textContent).toMatch(/Adding the date may remove this recommendation/);
  });

  it('stops calling the second undated row an extra dose', () => {
    const { rows } = renderWith([newDoseRow(), newDoseRow()]);
    expect(rows).toHaveLength(2);
    expect(rows[1].textContent).not.toMatch(/Extra dose/);
    expect(rows[1].textContent).not.toMatch(/already complete/);
  });

  it('says nothing about missing dates when every dose is dated', () => {
    const { acwyCard } = renderWith([dated('2021-09-15')]); // age 12y
    expect(acwyCard.textContent).toMatch(/Booster \(16y\)/);
    expect(acwyCard.textContent).not.toMatch(/have no date/);
    expect(acwyCard.textContent).not.toMatch(/has no date/);
  });
});
