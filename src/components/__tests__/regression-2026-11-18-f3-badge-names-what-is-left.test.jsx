// @vitest-environment happy-dom
// Port Phase 6.2, F-3 (owner, STOP G1, 2026-11-18).
//
// Before: a card with a dose still to come, but not due today, wore the badge
// "Up to date" — 4,158 cards with a dated booster and 474 with a dated
// non-booster dose, on the saved-answer grid (measured 2026-11-18). The routine
// 16-year booster card, same situation, already said "Future booster needed",
// so the same situation read two ways.
//
// Owner: a dated booster → "Future booster needed"; a dated dose that is not a
// booster → "Next dose not yet due"; "Up to date" only when nothing is left.
// Badge words only: no date, dose label or verdict changes.
//
// Patients are the packet's own examples (stop-g1-packet-2026-11-18.md, §2).
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Results from '../Results.jsx';

const TODAY = '2026-09-15';
const card = (s, vaccine) => {
  const c = render(
    <Results
      state={{ step: 4, riskAtDoseAnswers: { MenACWY: {}, MenB: {} }, menbDoses: [], ...s }}
      today={TODAY} onReset={() => {}} onChange={() => {}} onBack={() => {}}
    />,
  ).container;
  const el = [...c.querySelectorAll('[data-testid="rec-card"]')]
    .find((x) => x.querySelector('.rec-vaccine-name')?.textContent === vaccine);
  return { badge: el.querySelector('.status-badge').textContent, text: el.textContent };
};

describe('F-3: the badge names what is left, never "Up to date" while a dose is still to come', () => {
  it('dated booster (microbiologist, 30 y, MenQuadfi Aug 6, 2026): "Future booster needed"', () => {
    const { badge, text } = card({
      dob: '1996-01-01', riskIds: ['microbiologist'],
      menacwyDoses: [{ date: '2026-08-06', brand: 'MenQuadfi (MenACWY)' }],
    }, 'MenACWY');
    expect(badge).toBe('Future booster needed');
    // unchanged around it
    expect(text).toContain('Booster (dose 2, first booster, 5 years after the primary dose)');
    expect(text).toContain('Next dose due Aug 6, 2031');
  });

  it('dated non-booster dose (complement deficiency, 11 y, MenQuadfi Aug 6, 2026): "Next dose not yet due"', () => {
    const { badge, text } = card({
      dob: '2015-03-01', riskIds: ['complement'],
      menacwyDoses: [{ date: '2026-08-06', brand: 'MenQuadfi (MenACWY)' }],
    }, 'MenACWY');
    expect(badge).toBe('Next dose not yet due');
    expect(text).toContain('Dose 2 of 2 (high-risk primary series)');
    expect(text).toContain('Next dose due Oct 1, 2026');
  });

  it('control, nothing left (healthy 19 y, MenQuadfi at 18): "Up to date", unchanged', () => {
    const { badge } = card({
      dob: '2007-03-01', riskIds: [],
      menacwyDoses: [{ date: '2025-06-01', brand: 'MenQuadfi (MenACWY)' }],
    }, 'MenACWY');
    expect(badge).toBe('Up to date');
  });
});
