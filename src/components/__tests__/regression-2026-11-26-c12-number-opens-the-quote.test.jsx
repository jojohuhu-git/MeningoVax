// @vitest-environment happy-dom
// C12 (port plan, Phase 8; owner "Build as shown", 2026-11-26) — pointing at,
// tabbing to, or tapping a card's raised number opens a pop-up over it with the
// document's name, the quoted sentence itself and an "Open the document" link.
//
// Before: the quote lived only in the browser's own `title` hover text, which
// waits about a second before showing and never shows on a phone or tablet
// (a tap went straight to CDC's page). Seen live 2026-11-26 on an 11-year-old
// with no risk factors: "Booster: at age 16 years [1]".
//
// This is PneumoVax's pop-up (its PR #114, `CiteMark` in
// src/components/citations.jsx), copied so both apps behave the same. The text
// moved from `title` to `data-title`, as there, so the browser's own hover text
// does not appear on top of the pop-up a second later.
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { cite, citeTitle } from '../../data/refs.js';

// The 11-year-old's own booster citation, read from the engine's source table
// rather than typed here, so the test follows the quote if it is re-read.
const KEY = 'acwyRoutine1112and16';

function renderCard() {
  const c = cite(KEY);
  render(<RecCard rec={{
    vaccine: 'MenACWY',
    status: 'due',
    doseLabel: 'Dose 1',
    dueToday: true,
    note: { lead: 'Booster: at age 16 years [c]', detail: '' },
    noteCites: [c],
  }} />);
  return { c, mark: screen.getByText('[1]') };
}

describe('C12 — a raised number opens its quote in a pop-up', () => {
  it('the source this test uses carries a quote (guards the fixture)', () => {
    expect(cite(KEY).quote, `${KEY} has no quote; pick a quoted source`).toBeTruthy();
  });

  it('no browser hover text on the number; the words sit in data-title', () => {
    const { c, mark } = renderCard();
    expect(mark.getAttribute('title')).toBeNull();
    expect(mark.getAttribute('data-title')).toBe(citeTitle(c));
  });

  it('closed until pointed at; pointing opens document, quote and link', () => {
    const { c, mark } = renderCard();
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.mouseEnter(mark.parentElement);
    const pop = screen.getByRole('tooltip');
    expect(pop.textContent).toContain(`[1] ${c.doc}`);
    expect(pop.textContent).toContain(c.quote);
    const link = screen.getByText('Open the document');
    expect(link.getAttribute('href')).toBe(c.url);
    expect(link.getAttribute('target')).toBe('_blank');

    fireEvent.mouseLeave(mark.parentElement);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('keyboard focus opens it; Escape closes it', () => {
    const { mark } = renderCard();
    act(() => { mark.focus(); });
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('a first tap opens the pop-up instead of leaving the page; tapping away closes it', () => {
    const { mark } = renderCard();
    fireEvent.pointerDown(mark, { pointerType: 'touch' });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => { mark.dispatchEvent(click); });
    expect(click.defaultPrevented, 'the first tap followed the link').toBe(true);
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('a mouse click still opens the document at the sentence', () => {
    const { c, mark } = renderCard();
    fireEvent.pointerDown(mark, { pointerType: 'mouse' });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => { mark.dispatchEvent(click); });
    expect(click.defaultPrevented).toBe(false);
    expect(mark.getAttribute('href')).toBe(c.url);
  });

  it('scrolling closes it (the pop-up is placed against the window)', () => {
    const { mark } = renderCard();
    fireEvent.mouseEnter(mark.parentElement);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.scroll(window);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
