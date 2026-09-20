// @vitest-environment happy-dom
// C2-6 · UI layer. The engine-layer twin, with the ACIP/CDC live-fetch notes
// and the full set of controls, is
// src/logic/__tests__/regression-c2-6-hct-other-risk-selected.test.js.
//
// The bug was in text a clinician actually reads on the results screen: the
// HCT advisory card told her to "select a risk factor above if one applies"
// while a dose driven by exactly that risk factor (travel) sat in a card a
// few lines above it. This confirms the corrected sentence — not just the
// underlying data — reaches the rendered banner.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

const TODAY = '2026-09-19';

const renderResults = (riskIds) => render(
  <Results
    state={{ ageMonths: 300, riskIds, menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: {} }}
    today={TODAY}
    onReset={() => {}}
    onChange={() => {}}
    onBack={() => {}}
  />,
);

describe('C2-6 — the HCT advisory banner, rendered', () => {
  it('HCT + travel: the banner does not tell her to select a risk factor she already selected', () => {
    renderResults(['hct', 'travel']);
    const card = screen.getByTestId('hct-card');
    expect(card.textContent).not.toMatch(/select a risk factor above if one applies/i);
    expect(card.textContent).toMatch(/already indicates MenACWY on its own/i);
  });

  it('control: HCT alone still shows the original prompt to select a risk factor', () => {
    renderResults(['hct']);
    const card = screen.getByTestId('hct-card');
    expect(card.textContent).toMatch(/select a risk factor above if one applies/i);
  });

  it('control: HCT + asplenia still shows the specifically-sourced high-risk text', () => {
    renderResults(['hct', 'asplenia']);
    const card = screen.getByTestId('hct-card');
    expect(card.textContent).toMatch(/high-risk condition selected above \(asplenia/i);
  });
});
