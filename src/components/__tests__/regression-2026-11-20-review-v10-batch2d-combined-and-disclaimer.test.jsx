// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Review v10, Batch 2d (owner answers 2026-11-20, "Approve them all";
// docs/archive/decisions-2026-11-20-review-v10.md): the combined-shot panel,
// the single-brand line, and the disclaimer, P67–P72. Style rule 4 kept: the
// approved ";" in P68 became a period. Where "About risk history" sits is L7
// (Batch 4); this batch changes its words only.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-11-20';
function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return <Results state={state} onChange={(p) => setState((s) => ({ ...s, ...p }))} onReset={() => {}} />;
}
const draw = (input) => render(<Harness initial={{ today: TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input }} />).container;
const flat = (el) => el.textContent.replace(/\s+/g, ' ');

describe('Review v10 Batch 2d: combined shot, brand line, disclaimer', () => {
  it('P67 and P68: the combined-shot panel', () => {
    const t = flat(draw({ dob: '2009-06-01' }));
    expect(t).toContain('Option 2: One combined injection (MenABCWY)');
    expect(t).toContain('Replaces both injections above. Give one option, not both.');
    // extinct: the old panel wording, retired by P67/P68.
    expect(t).not.toMatch(/pentavalent, MenABCWY|do not give both/);
  });

  it('P69: why the combined shot is not offered', () => {
    const out = recommend({ today: TODAY, dob: '2014-06-01', riskIds: ['asplenia'], menacwyDoses: [{ brand: 'Penmenvy', date: '2026-09-15' }], menbDoses: [], riskAtDoseAnswers: { MenACWY: { 0: 'yes' }, MenB: { 0: 'yes' } } });
    expect(out.pentavalent.unavailableReason).toBe('Not an option today: Penmenvy cannot be repeated within 6 months of the last Penmenvy dose.');
  });

  it('P70: one brand reads "Brand: Bexsero", several keep the list', () => {
    const one = flat(draw({ dob: '2012-06-01', riskIds: ['asplenia'], menbDoses: [{ brand: 'Bexsero', date: '2026-09-01' }], riskAtDoseAnswers: { MenB: { 0: 'yes' } } }));
    expect(one).toContain('Brand: Bexsero');
    const many = flat(draw({ dob: '2009-06-01' }));
    expect(many).toContain('Brand options: choose one');
  });

  it('P71 and P72: the disclaimer', () => {
    const c = draw({ dob: '2009-06-01' });
    const d = c.querySelector('.disclaimer');
    expect(flat(d)).toContain('Clinical decision support, not a substitute for clinical judgment. Check recommendations against current ACIP/CDC schedules. '
      + 'Each recommendation cites its source. Ages and intervals follow ACIP, which can differ from FDA labeling.');
    // P72's sentence moved under the "Needs input" question in Batch 4 (L7); see the placement test.
    expect(screen.queryByTestId('disclaimer-toggle')).toBeNull();
  });
});
