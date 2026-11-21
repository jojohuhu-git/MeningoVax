// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Review v10, Batch 4 (owner 2026-11-20, shown first as a before/after
// drawing, then "Build as shown"; L5 option A): where explanations sit on the
// Patient screen. docs/archive/decisions-2026-11-20-review-v10.md.
//
//   L1, L2  every dose label at the right of its row; the reason one line under
//   L3      a dose's "Why this" only when it adds numbers (wrong product: none)
//   L4      the card's "Why this" right under its title, then the
//           other-product line, then brands
//   L5      a repeat due today reads "Repeat today."
//   L6      a traveller's "Why this" explains only this patient
//   L7      the risk-history sentence under the "Needs input" question; no
//           "About risk history" link in the disclaimer
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-11-20';
function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return <Results state={state} onChange={(p) => setState((s) => ({ ...s, ...p }))} onReset={() => {}} />;
}
const draw = (input) => render(<Harness initial={{ today: TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input }} />).container;
const MV = (date) => ({ brand: 'Menveo 2-vial', date });
const WRONG = { dob: '2009-06-01', menacwyDoses: [MV('2020-07-01'), MV('2025-07-01')], menbDoses: [{ brand: 'Bexsero', date: '2026-01-05' }, { brand: 'Trumenba', date: '2026-08-01' }] };
const menbCard = (c) => [...c.querySelectorAll('.rec-card')].find((x) => /MenB/.test(x.querySelector('.rec-card-head, .rec-card-header, h3, div')?.textContent ?? x.textContent.slice(0, 20)));

describe('Review v10 Batch 4: placement', () => {
  it('L1 and L2: the label and the dose are one row; the reason is one line of sentences', () => {
    const c = draw(WRONG);
    const row = [...c.querySelectorAll('.rec-progress-dose-row')].find((r) => /Trumenba/.test(r.textContent));
    const chip = row.querySelector('.dose-val-chip');
    const reasons = row.querySelector('.dose-val-reasons');
    expect(chip.textContent).toBe('Not counted — repeat');
    expect(reasons.textContent.replace(/\s+/g, ' ').trim()).toMatch(/^Not interchangeable with the first MenB dose \(Bexsero\)\. Repeat with Bexsero (today|from [A-Z][a-z]{2} \d{1,2}, \d{4})\. Do not restart\.$/);
    // The chip comes before the reason in the row, so it sits on the row's first line.
    expect(chip.compareDocumentPosition(reasons) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('L3: the wrong-product dose has no "Why this" of its own', () => {
    const c = draw(WRONG);
    const row = [...c.querySelectorAll('.rec-progress-dose-row')].find((r) => /Trumenba/.test(r.textContent));
    expect(row.querySelector('[data-testid="dose-val-toggle"]')).toBeNull();
    // extinct: the antigen-family background sentence, retired by L3 (2026-11-20).
    expect(row.textContent).not.toMatch(/MenB-4C|MenB-FHbp|Established family/);
  });

  it('L4: "Why this" sits under the card title, before the other-product line and the brands', () => {
    const c = draw(WRONG);
    const card = [...c.querySelectorAll('.rec-card-inner')].find((x) => /Or complete the series with Trumenba/.test(x.textContent));
    const label = card.querySelector('.rec-dose-label');
    const toggle = card.querySelector('[data-testid="rec-note-toggle"]');
    const alt = [...card.querySelectorAll('.rec-note-lead')].find((x) => /Or complete the series/.test(x.textContent));
    const brands = card.querySelector('.rec-brands');
    const after = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(after(label, toggle)).toBe(true);
    expect(after(toggle, alt)).toBe(true);
    expect(after(alt, brands)).toBe(true);
  });

  it('L5: a repeat due today says "Repeat today."', () => {
    const r = recommend({ today: TODAY, ...WRONG });
    expect(r.menb[0].dueToday).toBe(true);
    expect(r.history.MenB.perDose[1].reasons).toContain('Repeat with Bexsero today.');
  });

  it('L6: a traveller\'s first-booster "Why this" explains only this patient', () => {
    const r = recommend({ today: TODAY, dob: '2000-06-01', riskIds: ['travel'], menacwyDoses: [MV('2018-01-01')], menbDoses: [] }).menacwy[0];
    expect(noteText(r).replace(/\s*\[c\]/g, '')).toBe('The first booster is due 5 years after dose 1. This is because dose 1 was given at 7 years or older.');
    // extinct: the other-branch sentence, retired by L6 (2026-11-20).
    expect(noteText(r)).not.toMatch(/brings the first booster forward/);
  });

  it('L7: the risk-history sentence sits under the "Needs input" question, and the disclaimer has no link for it', () => {
    const c = draw({ dob: '2014-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2023-07-01')] });
    const prompt = c.querySelector('[data-testid="risk-at-dose-prompt"]');
    expect(prompt.querySelector('[data-testid="risk-at-dose-note"]').textContent.trim())
      .toBe('The app records current risk only. When an earlier dose depends on the risk on its date, this question asks.');
    expect(c.querySelector('[data-testid="disclaimer-toggle"]')).toBeNull();
    // A page with no question shows no risk-history sentence at all.
    const quiet = draw({ dob: '2009-06-01' });
    expect(quiet.querySelector('[data-testid="risk-at-dose-note"]')).toBeNull();
  });
});
