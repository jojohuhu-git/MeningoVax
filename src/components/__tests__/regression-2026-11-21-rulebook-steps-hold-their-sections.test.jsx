// @vitest-environment happy-dom
// Rulebook: each section sits inside its step (owner, 2026-11-21, in chat,
// after a before/after drawing; recorded in
// docs/archive/decisions-2026-11-20-rulebook-reorg.md, "Steps hold their
// sections").
//
// The owner's answers:
//   1. Step 7, "The cards", is dropped (it had no section of its own; its link
//      opened "Doses on the record", as steps 2 and 5 did). Six steps.
//   2. "The vaccines" goes under step 2, Read the record.
//   3. "MeningoVax decisions" and "Sources" stay below, under "Reference".
//   4. Everything starts closed.
//   5. "Show all" opens everything; "Hide all" closes it. Each section keeps
//      its own Show/Hide.
//   6. "More than one condition" is split by vaccine: its MenACWY rows under
//      step 3, its MenB rows under step 4.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import Rulebook from '../Rulebook.jsx';
import {
  PATH_STEPS, HEADINGS, DECISIONS, DECISION_USES, RISK_RANKING, riskRankingFor, FAMILIES,
} from '../../data/rulebookPage.js';

const folds = () => [...document.querySelectorAll('button[aria-controls$="-body"]')];
const foldName = (b) => b.querySelector('.rb-fold-label').textContent;
const fold = (name) => folds().find((b) => foldName(b) === name);
const showAll = () => screen.getByRole('button', { name: /^(Show|Hide) all$/ });

describe('Everything starts closed (answer 4)', () => {
  it('shows only "How MeningoVax decides", Show all, and the Reference folds, all closed', () => {
    render(<Rulebook />);
    expect(folds().map(foldName)).toEqual(['How MeningoVax decides', 'MeningoVax decisions', 'Sources']);
    for (const b of folds()) expect(b.getAttribute('aria-expanded'), foldName(b)).toBe('false');
    expect(document.querySelectorAll('.rb-part-body')).toHaveLength(0);
    expect(showAll().textContent).toBe('Show all');
    expect(document.querySelector('.rb-ref-label').textContent).toBe('Reference');
  });
});

describe('Six steps, each its own fold (answers 1 and 5)', () => {
  it('"How MeningoVax decides" opens on six numbered steps, every one closed', () => {
    render(<Rulebook />);
    fireEvent.click(fold('How MeningoVax decides'));
    expect(screen.getByText('Six steps, always in this order.')).toBeTruthy();
    expect(PATH_STEPS.map((s) => s.title)).toEqual([
      'Stop check', 'Read the record', 'MenACWY schedule', 'MenB schedule', 'Set the dates', 'Combined shot (MenABCWY)',
    ]);
    const steps = PATH_STEPS.map((s) => fold(s.title));
    for (const b of steps) expect(b.getAttribute('aria-expanded')).toBe('false');
    expect([...document.querySelectorAll('.rb-step-num')].map((n) => n.textContent)).toEqual(['1', '2', '3', '4', '5', '6']);
    // Each step's bar carries its one-sentence summary.
    for (const s of PATH_STEPS) expect(fold(s.title).textContent).toContain(s.sum);
    // extinct: step 7, "The cards" (owner 2026-11-21: no section of its own).
    expect(PATH_STEPS.map((s) => s.key)).not.toContain('cards');
    expect(document.body.textContent).not.toContain('This is what the Patient screen shows.');   // extinct: step 7 "The cards" dropped, owner 2026-11-21
    // extinct: the step links that jumped down to a separate part.
    expect(document.querySelector('.rb-step a')).toBeNull();
  });

  it('a step opens on its own Show and closes on Hide, leaving the others closed', () => {
    render(<Rulebook />);
    fireEvent.click(fold('How MeningoVax decides'));
    const menb = fold('MenB schedule');
    fireEvent.click(menb);
    expect(menb.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('table', { name: 'MenB groups' })).toBeTruthy();
    expect(fold('MenACWY schedule').getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(menb);
    expect(screen.queryByRole('table', { name: 'MenB groups' })).toBeNull();
  });
});

describe('Each section sits under its step (answers 2 and 6)', () => {
  const openStep = (title) => {
    render(<Rulebook />);
    fireEvent.click(fold('How MeningoVax decides'));
    fireEvent.click(fold(title));
    return document.getElementById(`${fold(title).getAttribute('aria-controls')}`);
  };
  const cardTitles = (body) => within(body).getAllByRole('heading', { level: 4 }).map((h) => h.textContent);

  it('1 Stop check: the transplant stop card', () => {
    const body = openStep('Stop check');
    expect(body.querySelector('.rb-card-stop')).toBeTruthy();
  });

  it('2 Read the record: the vaccines, the label key, and a dose that does not count', () => {
    const body = openStep('Read the record');
    expect(cardTitles(body).slice(0, 4)).toEqual([
      'The vaccines', FAMILIES.title, 'What the label on a dose means', 'A dose that does not count',
    ]);
    expect(within(body).getAllByRole('columnheader').slice(0, 3).map((h) => h.textContent)).toEqual(['Vaccine', 'Minimum age', 'Use']);
    expect(body.textContent).not.toContain('Minimum intervals: a dose given sooner does not count');
  });

  it('3 MenACWY schedule: the MenACWY tables and only the MenACWY "More than one condition" rows', () => {
    const body = openStep('MenACWY schedule');
    expect(within(body).getByRole('table', { name: 'MenACWY groups' })).toBeTruthy();
    const multi = within(body).getByRole('table', { name: 'More than one condition, MenACWY' });
    const rows = within(multi).getAllByRole('row').slice(1).map((r) => r.firstElementChild.textContent);
    expect(rows).toEqual(riskRankingFor('MenACWY').map((s) => s.name));
    expect(rows).toHaveLength(4);
    expect(rows.join(' ')).not.toMatch(/MenB|^MenACWY:/);
    expect(body.textContent).not.toContain('MenB groups');
  });

  it('4 MenB schedule: the MenB tables, pregnancy, and only the MenB "More than one condition" rows', () => {
    const body = openStep('MenB schedule');
    expect(within(body).getByRole('table', { name: 'MenB groups' })).toBeTruthy();
    expect(cardTitles(body)).toContain('Pregnancy');
    const multi = within(body).getByRole('table', { name: 'More than one condition, MenB' });
    const rows = within(multi).getAllByRole('row').slice(1).map((r) => r.firstElementChild.textContent);
    expect(rows).toEqual(riskRankingFor('MenB').map((s) => s.name));
    expect(rows).toHaveLength(2);
  });

  it('every "More than one condition" row lands under exactly one vaccine, its label without the vaccine name', () => {
    const split = [...riskRankingFor('MenACWY'), ...riskRankingFor('MenB')];
    expect(split).toHaveLength(RISK_RANKING.steps.length);
    expect(split.map((s) => s.text)).toEqual(RISK_RANKING.steps.map((s) => s.text));
    expect(riskRankingFor('MenACWY')[0].name).toBe('Asplenia, complement deficiency or HIV, with any other condition');
    for (const s of split) expect(s.ex.length).toBeGreaterThan(0);
  });

  it('5 Set the dates: minimum intervals and the grace period', () => {
    const body = openStep('Set the dates');
    expect(cardTitles(body)[0]).toBe('Minimum intervals: a dose given sooner does not count');
    expect(body.querySelector('.rb-band-green')).toBeTruthy();
  });

  it('6 Combined shot: the MenABCWY rules', () => {
    const body = openStep('Combined shot (MenABCWY)');
    expect(body.querySelectorAll('.rb-bullets li').length).toBeGreaterThan(2);
  });

  it('"Applies in" names the steps and the Reference folds, never an old part', () => {
    const names = Object.values(HEADINGS);
    expect(names).toEqual([...PATH_STEPS.map((s) => s.title), 'MeningoVax decisions', 'Sources']);
    for (const d of DECISIONS) for (const w of DECISION_USES[d.key]) expect(names, `${d.key}: ${w}`).toContain(w);
    // extinct: the old part names (owner 2026-11-21: sections moved under their steps).
    const used = Object.values(DECISION_USES).flat();
    for (const old of ['The vaccines', 'MenACWY', 'MenB', 'More than one condition', 'Doses on the record']) expect(used).not.toContain(old);
  });
});

describe('Show all / Hide all (answer 5)', () => {
  it('Show all opens every fold on the page, and becomes Hide all, which closes them all', () => {
    render(<Rulebook />);
    fireEvent.click(showAll());
    expect(showAll().textContent).toBe('Hide all');
    const names = folds().map(foldName);
    expect(names).toEqual(['How MeningoVax decides', ...PATH_STEPS.map((s) => s.title), 'MeningoVax decisions', 'Sources']);
    for (const b of folds()) expect(b.getAttribute('aria-expanded'), foldName(b)).toBe('true');
    // The decisions list's own folds (a phone shows each decision closed) open too.
    const items = [...document.querySelectorAll('.rb-declist-item')];
    expect(items).toHaveLength(DECISIONS.length);
    for (const li of items) expect(li.classList.contains('rb-open'), li.id).toBe(true);

    fireEvent.click(showAll());
    expect(showAll().textContent).toBe('Show all');
    expect(folds().map(foldName)).toEqual(['How MeningoVax decides', 'MeningoVax decisions', 'Sources']);
    for (const b of folds()) expect(b.getAttribute('aria-expanded')).toBe('false');
  });

  it('closing one fold after Show all turns the button back to Show all', () => {
    render(<Rulebook />);
    fireEvent.click(showAll());
    fireEvent.click(fold('Sources'));
    expect(showAll().textContent).toBe('Show all');
    fireEvent.click(showAll());
    for (const b of folds()) expect(b.getAttribute('aria-expanded')).toBe('true');
  });
});
