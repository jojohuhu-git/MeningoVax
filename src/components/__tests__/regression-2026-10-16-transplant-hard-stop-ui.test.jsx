// @vitest-environment happy-dom
//
// The stop SCREEN, 2026-10-16. The engine side is covered by
// src/logic/__tests__/regression-2026-10-16-transplant-is-a-hard-stop.test.js;
// this file is what the clinician actually reads, because a green engine suite
// has twice now been compatible with wrong wording on the page.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

const TODAY = '2026-10-16';

function show(state) {
  render(
    <Results
      state={{ ageMonths: 17 * 12, riskIds: ['hct_cart_bcell_exclude'], menacwyDoses: [], menbDoses: [], ...state }}
      today={TODAY}
      onChange={() => {}}
      onReset={() => {}}
    />,
  );
}

describe('2026-10-16 — the transplant/CAR-T/B-cell stop screen', () => {
  it('the title names what the patient needs, not what the software cannot do', () => {
    show({});
    expect(screen.getByText('Individualized revaccination schedule required')).toBeDefined();
    expect(screen.queryByText(/does not apply to this patient/i)).toBeNull();
  });

  it('shows the shortened message, and nothing else — no cards, no advisory, no collapsed schedule', () => {
    show({});
    expect(screen.getByTestId('exclusion-stop')).toBeTruthy();
    expect(screen.getByText(/follows a transplant‑ or therapy‑specific protocol/)).toBeDefined();
    expect(document.querySelectorAll('[data-testid="rec-card"]')).toHaveLength(0);
    expect(document.querySelectorAll('.advisory-banner-hct')).toHaveLength(0);
    expect(document.querySelectorAll('details')).toHaveLength(0);
  });

  it('shows exactly one citation chip — the CDC one the checkbox already carried', () => {
    show({});
    const chips = [...document.querySelectorAll('.citation-chip')];
    expect(chips.map((a) => a.textContent)).toEqual(['CDC Altered Immunocompetence']);
    // Decision 6: ASCO / NCCN / IDSA are named in the sentence, never linked.
    const hrefs = chips.map((a) => a.getAttribute('href')).join(' ');
    expect(hrefs).not.toMatch(/ascopubs|academic\.oup\.com|ncbi/);
  });

  it('with doses on record, one line says they are kept but not evaluated', () => {
    show({ menacwyDoses: [{ date: '2026-01-02', brand: 'Menveo (MenACWY-CRM)' }] });
    expect(screen.getByTestId('exclusion-doses-kept').textContent.trim())
      .toBe('Recorded doses are kept but not evaluated here.');
  });

  it('a MenB dose alone also brings the line up', () => {
    show({ menbDoses: [{ date: '2026-01-02', brand: 'Bexsero (MenB-4C)' }] });
    expect(screen.getByTestId('exclusion-doses-kept')).toBeTruthy();
  });

  it('with no doses on record the line is absent — a CAR-T patient was never asked', () => {
    show({});
    expect(screen.queryByTestId('exclusion-doses-kept')).toBeNull();
  });

  it('a blank dose row is not a dose, so it does not bring the line up', () => {
    show({ menacwyDoses: [{ date: '', brand: '' }] });
    expect(screen.queryByTestId('exclusion-doses-kept')).toBeNull();
  });
});
