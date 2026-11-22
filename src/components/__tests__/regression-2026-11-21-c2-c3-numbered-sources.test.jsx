// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// Port Phase 8, C2 and C3 (2026-11-21): the grey source buttons carry the
// numbers the sentences use, and every number has a button.
//
// Before: a card had two lists that never compared notes. The raised numbers
// were handed out at render time; the grey buttons were a separate engine
// list, printed with no numbers. Measured over the saved-answers grid
// (`node scripts/citationMapping.mjs`): 2,730 cards showed a number for a
// document with no button, and 2,245 gave ONE document two numbers (a link
// to a sentence, `…htm#:~:text=…`, was counted as a different document from
// the plain `…htm`). Seen live on a healthy 11-year-old: [2], [3], [1] from
// top to bottom, and the Penmenvy MMWR's [3] had no button.
//
// Owner decisions this holds:
//   • PneumoVax C2/C3 (2026-10-17): numbers and buttons come from ONE
//     computation, `cardSources()`; buttons sit under "Sources" in number
//     order; a button no sentence cites stays, numbered and last.
//   • 2026-07-24: the number names the DOCUMENT, not the sentence.
//   • 2026-11-21 (this port, "Order you read"): numbers follow the order the
//     reader meets them down the card. Since L4, "Why this" sits above the
//     booster line and the recorded doses, so it is numbered first.
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard, { cardSources } from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

const documentOf = (u) => String(u ?? '').split('#')[0];

function renderMenB(input) {
  const r = recommend(input);
  const h = r.history.MenB;
  render(<RecCard rec={r.menb[0]} doses={h.sortedDoses} doseValidations={h.perDose} today={input.today} />);
}
function renderMenACWY(input) {
  const r = recommend(input);
  const h = r.history.MenACWY;
  render(<RecCard rec={r.menacwy[0]} doses={h.sortedDoses} doseValidations={h.perDose} today={input.today} />);
}
const openWhyThis = () => fireEvent.click(screen.getByTestId('rec-note-toggle'));
const buttonTexts = () => [...document.querySelectorAll('.citation-chip')].map((a) => a.textContent);

// The owner's worked patient (2026-11-21): 10 years old, complement
// deficiency, one Bexsero at 9 years.
const COMPLEMENT_10Y = {
  ageMonths: 120, dob: '2016-09-15', riskIds: ['complement'],
  menacwyDoses: [], menbDoses: [{ date: '2025-09-15', brand: 'Bexsero' }],
  riskAtDoseAnswers: { MenACWY: {}, MenB: {} }, today: '2026-09-15',
};
// Healthy 11-year-old, no doses.
const HEALTHY_11Y = {
  ageMonths: 132, dob: '2015-09-15', riskIds: [],
  menacwyDoses: [], menbDoses: [],
  riskAtDoseAnswers: { MenACWY: {}, MenB: {} }, today: '2026-09-15',
};

describe('C2: the buttons carry the numbers, in the order the reader meets them', () => {
  it('the owner\'s worked patient reads [1] in "Why this", [2] on the recorded dose', () => {
    renderMenB(COMPLEMENT_10Y);
    openWhyThis();
    const detail = screen.getByTestId('rec-note-detail');
    const first = detail.querySelector('.note-cite');
    expect(first.textContent).toBe('[1]');
    expect(first.getAttribute('href')).toContain('mm7349a3'); // ACIP Oct 2024 MMWR
    expect(within(detail).getByText('Sources')).toBeTruthy();
    expect(buttonTexts()).toEqual([
      '[1]ACIP Oct 2024 MMWR',
      '[2]ACIP 2020 MMWR',
      '[3]CDC Complement-Inhibitor Guidance',
    ]);
    const verdict = document.querySelector('.dose-val-reasons');
    expect(within(verdict).getByText('[2]').getAttribute('href')).toContain('rr6909a1');
  });

  it('one document never carries two numbers (healthy 11-year-old: ACIP 2020 is [1] everywhere)', () => {
    renderMenACWY(HEALTHY_11Y);
    openWhyThis();
    const numbersForAcip2020 = new Set(
      [...document.querySelectorAll('.note-cite')]
        .filter((a) => a.getAttribute('href').includes('rr6909a1'))
        .map((a) => a.textContent),
    );
    expect([...numbersForAcip2020]).toEqual(['[1]']);
    // Reading order: "Why this" is above the booster line, so it holds [1] and [2].
    expect([...document.querySelectorAll('.note-cite')].map((a) => a.textContent)).toEqual(['[1]', '[2]', '[1]']);
  });
});

describe('C3: every number has a button', () => {
  it('the healthy 11-year-old\'s Penmenvy MMWR [2] now has its own button', () => {
    renderMenACWY(HEALTHY_11Y);
    openWhyThis();
    const texts = buttonTexts();
    expect(texts[0]).toBe('[1]ACIP 2020 MMWR');
    expect(texts[1]).toMatch(/^\[2\]Penmenvy MMWR/);
  });

  // The machine guard: over the saved-answers grid (every 7th patient, so the
  // test stays quick but still crosses every age, risk and history family),
  // each document a sentence cites has a button carrying that same number,
  // and every button carries a number.
  it('over the grid: no number without a button, no button without a number, one number per document', () => {
    const cases = buildSavedAnswerCases().filter((_, i) => i % 7 === 0);
    const failures = [];
    for (const c of cases) {
      const r = recommend(c.input);
      if (r.excluded) continue;
      for (const [family, cards] of [['MenACWY', r.menacwy ?? []], ['MenB', r.menb ?? []]]) {
        const perDose = r.history?.[family]?.perDose ?? [];
        for (const card of cards) {
          for (const whyFirst of [true, false]) {
            const { numberFor, sources } = cardSources({
              doseValidations: perDose, note: card.note, noteCites: card.noteCites,
              citations: card.citations, boosterCites: card.boosterCites, whyFirst,
            });
            const marks = [...(card.boosterCites ?? []), ...perDose.flatMap((v) => v?.reasonCites ?? []), ...(card.noteCites ?? [])];
            for (const m of marks) {
              const n = numberFor(m.page ?? m.key);
              if (!sources.some((s) => s.n === n && documentOf(s.url) === documentOf(m.page ?? m.key))) {
                failures.push(`${c.key} ${family}: [${n}] ${documentOf(m.page)} has no button`);
              }
            }
            for (const s of sources) {
              if (!Number.isInteger(s.n)) failures.push(`${c.key} ${family}: button ${s.short} has no number`);
            }
            const byDoc = new Map();
            for (const s of sources) {
              const d = documentOf(s.url);
              if (byDoc.has(d) && byDoc.get(d) !== s.n) failures.push(`${c.key} ${family}: ${d} numbered twice`);
              byDoc.set(d, s.n);
            }
            const ns = sources.map((s) => s.n);
            if (ns.some((n, i) => i > 0 && n < ns[i - 1])) failures.push(`${c.key} ${family}: buttons out of order ${ns}`);
          }
        }
      }
    }
    expect(failures.slice(0, 10)).toEqual([]);
  }, 120000);
});
