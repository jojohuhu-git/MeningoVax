// @vitest-environment happy-dom
// Review v10 D1: the redesigned Rulebook screen (owner, 2026-11-20: "Approve
// them all", D1 included; placement "New top, then 1–8 folded"). The seven
// steps and the two Quick look tables are in view; sections 1–8 sit behind one
// "Full rulebook" tap, closed by default.
//
// The new top is held to the app the same way the parts below are
// (regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx): every
// row carries worked patients, the guard there runs all of them through
// recommend(), and no age is typed in rulebookPage.js.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import Rulebook from '../Rulebook.jsx';
import { doseChipLabel } from '../doseChipLabel.js';
import { PATH_STEPS, QUICK_LOOK, CHIP_LEGEND, WORKED_PATIENTS, sourcesFor, stepExamples, DECISIONS } from '../../data/rulebookPage.js';
import { recommend } from '../../logic/recommend.js';

const STREAM = { MenACWY: 'menacwy', MenB: 'menb' };
const quickRows = [...QUICK_LOOK.acwy.rows, ...QUICK_LOOK.menb.rows];

describe('D1 — every claim on the new top carries a worked patient', () => {
  it('every step row, label and Quick look row names at least one', () => {
    const bare = [
      ...PATH_STEPS.flatMap((s) => [...(s.rows ?? []), ...(s.labels ?? [])]),
      ...quickRows, QUICK_LOOK.acwy.note, QUICK_LOOK.menb.note,
    ].filter((r) => !r.ex?.length).map((r) => r.who ?? r.chip ?? r.group ?? r.text);
    expect(bare).toEqual([]);
    for (const s of PATH_STEPS) {
      if (s.foot) expect(s.foot.ex?.length, `${s.key} foot`).toBeGreaterThan(0);
      if (s.next && s.nextEx === undefined && s.key === 'menb') throw new Error('menb next has no patient');
    }
  });

  it('every patient they name is one the guard runs', () => {
    const all = new Set(Object.values(WORKED_PATIENTS));
    const named = [
      ...PATH_STEPS.flatMap(stepExamples),
      ...quickRows.flatMap((r) => r.ex), ...QUICK_LOOK.acwy.note.ex, ...QUICK_LOOK.menb.note.ex,
    ];
    for (const e of named) expect(all.has(e), e.who).toBe(true);
  });

  it('each label in "Read the record" is the label its patient\'s dose really shows', () => {
    const labels = PATH_STEPS.find((s) => s.key === 'record').labels;
    for (const l of labels) {
      const e = l.ex[0];
      expect(e.expect.chip?.[2], `"${l.chip}" has no chip check`).toBe(l.chip);
      const [v, i] = e.expect.chip;
      const out = recommend(e.input);
      expect(doseChipLabel(out.history[v].perDose[i], out[STREAM[v]][0]?.seriesTotal ?? null)).toBe(l.chip);
    }
    // The same closed list of labels as part 6, none missing, none new.
    expect([...new Set(labels.map((l) => l.chip))].sort()).toEqual(CHIP_LEGEND.map((c) => c.chip).sort());
    // And the same colour for each label as part 6 (Q5's amber is not built).
    for (const l of labels) expect(l.tone, l.chip).toBe(CHIP_LEGEND.find((c) => c.chip === l.chip).tone);
  });

  it('every step and every Quick look row has a quoted source sentence', () => {
    for (const s of PATH_STEPS.filter((x) => x.key !== 'stop')) {
      const q = sourcesFor(stepExamples(s));
      expect(q.length, s.key).toBeGreaterThan(0);
      for (const x of q) expect(x.quote, `${s.key} ${x.key}`).toBeTruthy();
    }
    for (const r of quickRows) expect(sourcesFor(r.ex).length, r.key).toBeGreaterThan(0);
  });

  it('a decision a row names exists', () => {
    const keys = DECISIONS.map((d) => d.key);
    const named = [...PATH_STEPS.flatMap((s) => [s.decision, s.foot?.decision, ...(s.rows ?? []).map((r) => r.decision)]), ...quickRows.map((r) => r.decision)].filter(Boolean);
    for (const k of named) expect(keys).toContain(k);
  });
});

describe('D1 — Quick look reads as one table per vaccine', () => {
  it('every row spans exactly the age columns', () => {
    for (const t of [QUICK_LOOK.acwy, QUICK_LOOK.menb]) {
      for (const r of t.rows) expect(r.cells.reduce((n, c) => n + c.span, 0), `${t.name} ${r.group}`).toBe(t.cols.length);
    }
  });
  it('the age columns are the app\'s own lines', () => {
    expect(QUICK_LOOK.acwy.cols).toEqual(['Under 2 years', '2–10 years', '11–15 years', '16–21 years', '22+ years']);
    expect(QUICK_LOOK.menb.cols).toEqual(['Under 10 years', '10–15 years', '16–23 years', '24+ years']);
  });
});

describe('D1 — what a clinician sees', () => {
  it('in view: the owner\'s opening line, seven closed steps, Quick look. Sections 1–8 are behind one tap', () => {
    render(<Rulebook />);
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent.replace(/(Show|Hide)$/, ''));
    expect(h2).toEqual(['How MeningoVax decides', 'Quick look: who gets what', 'Full rulebook']);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent).slice(0, PATH_STEPS.length))
      .toEqual(PATH_STEPS.map((s) => s.title));
    expect(PATH_STEPS).toHaveLength(7);   // the screen says "Seven steps"
    expect(screen.getByText('Seven steps, always in this order.')).toBeTruthy();
    const full = screen.getByRole('button', { name: /Full rulebook/ });
    expect(full.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('heading', { name: '1. The vaccines' })).toBeNull();
    fireEvent.click(full);
    expect(screen.getByRole('heading', { name: '1. The vaccines' })).toBeTruthy();
  });

  it('a step opens on Show and closes on Hide', () => {
    render(<Rulebook />);
    const show = screen.getAllByRole('button', { name: 'Show' })[2];   // MenACWY schedule
    fireEvent.click(show);
    expect(show.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('The routine schedule:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.queryByText('The routine schedule:')).toBeNull();
  });

  it('Details opens one row at a time; a second tap closes it', () => {
    render(<Rulebook />);
    const [first, second] = screen.getAllByRole('button', { name: 'Details' });
    fireEvent.click(first);
    expect(screen.getByText(QUICK_LOOK.acwy.rows[0].details[0])).toBeTruthy();
    fireEvent.click(second);
    expect(screen.queryByText(QUICK_LOOK.acwy.rows[0].details[0])).toBeNull();
    expect(screen.getByText(QUICK_LOOK.acwy.rows[1].details[0])).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('a Details panel shows its source sentences', () => {
    render(<Rulebook />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Details' })[0]);
    const panel = document.querySelector('.rb-q-detin');
    const src = within(panel).getByRole('button', { name: 'Source' });
    fireEvent.click(src);
    expect(panel.textContent).toMatch(/“.+”/);
  });
});
