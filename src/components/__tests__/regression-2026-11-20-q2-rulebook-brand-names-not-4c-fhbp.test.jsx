// @vitest-environment happy-dom
// Q2 (owner, rulebook mockup questions, 2026-11-19): say "Bexsero" and
// "Trumenba", with no "type" after them, never "4C" / "FHbp" (antigen names a
// reader has to look up). Built on today's Rulebook screen; the seven
// sentences (S1–S7) were approved as written by the owner on 2026-11-20.
// The patient cards change later, with the Patient screen review (owner, Q2).
// CDC's own quoted sentences and paper titles keep "MenB-4C": their words.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import Rulebook from '../Rulebook.jsx';

function screenTextWithoutQuotes() {
  const { container } = render(<Rulebook />);
  // D1 (2026-11-20): the numbered parts are behind "Full rulebook". Open it,
  // so the whole screen is read, not just the new top.
  fireEvent.click(screen.getByRole('button', { name: /Full rulebook/ }));
  const copy = container.cloneNode(true);
  // The Sources list gives each CDC paper's own title ("…Bexsero MenB-4C
  // Vaccine…"): their words, not the app's.
  for (const el of copy.querySelectorAll('.rb-doc')) el.remove();
  // A Source's quoted sentence is CDC's wording, shown inside “…”.
  for (const el of copy.querySelectorAll('*')) {
    if (el.children.length === 0 && /^“[\s\S]*”$/.test(el.textContent.trim())) el.remove();
  }
  return copy.textContent.replace(/“[^”]*”/g, ' ');
}

describe('Q2: the Rulebook screen names MenB products by brand, not 4C / FHbp', () => {
  it('no "4C" or "FHbp" outside a quoted source', () => {
    const text = screenTextWithoutQuotes();
    // extinct: "4C" and "FHbp" were removed from the screen on purpose (Q2).
    expect(text).not.toMatch(/\b4C\b/);
    expect(text).not.toMatch(/FHbp/);
    // extinct: the old heading was replaced (Q2, S6). ("Wrong MenB family" in
    // the dose-label key and the record notes is a separate wording-review
    // item, not Q2, so it is not checked here.)
    expect(text).not.toContain('The two MenB families');
  });

  it('the seven approved sentences are on the screen', () => {
    const text = screenTextWithoutQuotes();
    expect(text).toContain('Counts as');                                                                   // S1
    expect(text).toContain('Use for every MenB dose. Not interchangeable with Trumenba or Penbraya.');     // S2
    expect(text).toContain('Use for every MenB dose. Not interchangeable with Bexsero or Penmenvy.');      // S3
    expect(text).toContain('Gives one MenACWY dose and one Bexsero dose in a single injection.');          // S4
    expect(text).toContain('Gives one MenACWY dose and one Trumenba dose in a single injection.');         // S5
    expect(text).toContain('MenB products are not interchangeable');                                       // S6 heading
    expect(text).toContain('Every MenB dose must match the first. A dose of the other product does not count, and the matching product is given ≥4 weeks after it.'); // S6 note
    expect(text).toContain('The product must match the earlier MenB doses: Penmenvy after Bexsero, Penbraya after Trumenba.'); // S7
  });
});
