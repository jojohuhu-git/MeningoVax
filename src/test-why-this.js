// Test helper (U1, 2026-09-17).
//
// A card shows its note's `lead` and hides the supporting `detail` behind a
// "Why this" button. A UI test that asks "does this card SAY such-and-such?"
// usually means either half, so it opens every disclosure on the rendered
// screen first and then asserts as before.
//
// Use it only where the test is about the card's content. A test about the
// disclosure itself — that detail starts hidden, that the button toggles it —
// must drive the button directly instead.
import { screen, fireEvent } from '@testing-library/react';

export function openWhyThis() {
  const toggles = screen.queryAllByTestId('rec-note-toggle');
  for (const toggle of toggles) fireEvent.click(toggle);
  return toggles.length;
}
