// @vitest-environment happy-dom
// C2 · UI layer. The engine-layer twin, with the live ACIP/CDC verification
// notes, is src/logic/__tests__/regression-c2-clinical-combos.test.js. Each
// case there renders correctly here too — an engine can return the right
// data while the screen that reads it still shows the wrong thing (this
// repo's own two-layer rule, docs/agent/testing.md).

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { openWhyThis } from '../../test-why-this.js';

const TODAY = '2026-09-19';

const renderResults = (riskIds, ageMonths = 300) => render(
  <Results
    state={{ ageMonths, riskIds, menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: {} }}
    today={TODAY}
    onReset={() => {}}
    onChange={() => {}}
    onBack={() => {}}
  />,
);

describe('C2-1 — asplenia + college dorm, rendered', () => {
  it('shows the high-risk primary MenACWY dose and offers the pentavalent', () => {
    renderResults(['asplenia', 'college_dorm']);
    expect(screen.getByText(/Dose 1 of 2 \(high-risk primary series\)/)).toBeTruthy();
    expect(screen.getByText(/pentavalent \(MenABCWY\) dose may replace/i)).toBeTruthy();
  });
});

describe('C2-3 — HIV + an ACWY outbreak, rendered', () => {
  it('shows MenACWY due and MenB explicitly not indicated, with no pentavalent option', () => {
    renderResults(['hiv', 'outbreak_acwy']);
    expect(screen.getByText(/Dose 1 of 2 \(high-risk primary series\)/)).toBeTruthy();
    expect(screen.getByText(/Not routinely indicated/i)).toBeTruthy();
    expect(screen.queryByText(/pentavalent \(MenABCWY\) dose may replace/i)).toBeNull();
  });
});

describe('C2-5 — a pregnant microbiologist, rendered', () => {
  it('the MenB card visibly carries the benefit-vs-risk pregnancy caveat, not just in the engine data', () => {
    renderResults(['microbiologist', 'pregnancy']);
    openWhyThis();
    expect(screen.getByText(/only after discussing it with her/i)).toBeTruthy();
  });
});

describe('C2-7 / C2-8 — an age-implausible tick-box, rendered', () => {
  it('an 8-year-old ticked as complement + college dorm sees the age-doubt note naming only college dorm', () => {
    renderResults(['complement', 'college_dorm'], 96);
    expect(screen.getByText(/ACIP lists "First-year college student living in a residence hall" only for ages 10 years and over/i)).toBeTruthy();
    expect(screen.queryByText(/persistent complement/i, { selector: '.risk-age-note, .risk-age-note *' })).toBeNull();
  });

  it('an 8-year-old ticked as military + asplenia still gets the risk-based MenACWY recommendation, doubt or not', () => {
    renderResults(['military', 'asplenia'], 96);
    expect(screen.getByText(/ACIP lists "Military recruit" only for ages 10 years and over/i)).toBeTruthy();
    expect(screen.getByText(/Dose 1 of 2 \(high-risk primary series\)/)).toBeTruthy();
  });
});
