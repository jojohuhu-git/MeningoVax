// @vitest-environment happy-dom
// The Rulebook reorganization (owner, 2026-11-20). Items 1–10 and the two
// layout answers are in docs/archive/decisions-2026-11-20-rulebook-reorg.md;
// the owner saw a before/after drawing and answered "Build as shown".
//
// This file replaces the D1 test (review v10, "New top, then 1–8 folded"),
// whose Quick look and per-step panels the owner removed on purpose. What it
// checks now:
//   - (superseded 2026-11-21, "Steps hold their sections": the nine parts now
//     sit inside the six steps; the fold checks live in
//     regression-2026-11-21-rulebook-steps-hold-their-sections.test.jsx);
//   - each thing said once: no Quick look, no age lines, no risk-group table;
//   - group tables (Group | Doses | Boosters), plain words, Details per row;
//   - every schedule is a Dose | Routine | Minimum interval table, the Minimum
//     interval column shaded light grey ("Light grey shading");
//   - MenB "If dose 3 was early" as one table; "A dose that does not count"
//     in General rules and Special cases; the intervals table holds only doses
//     that do not count when sooner; Sources grouped with no count or date.
// Every row still carries worked patients that the guard in
// regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx runs.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import Rulebook from '../Rulebook.jsx';
import {
  PATH_STEPS, HEADINGS, ACWY_GROUPS, MENB_GROUPS, ACWY_ROUTINE, ACWY_HIGHRISK_TABLES, MENB_HEALTHY,
  MENB_HIGHRISK, MENB_DOSE3_EARLY, INTERVALS, SOONER_ADDS, NOT_COUNTED, FAMILIES, VACCINE_ROWS,
  WORKED_PATIENTS,
} from '../../data/rulebookPage.js';

// Steps hold their sections (owner, 2026-11-21): a part is opened through its step.
const folds = () => [...document.querySelectorAll('button[aria-controls$="-body"]')];
const fold = (name) => folds().find((b) => b.querySelector('.rb-fold-label').textContent === name);
function openStep(title) {
  fireEvent.click(fold('How MeningoVax decides'));
  fireEvent.click(fold(title));
}
function openAll() {
  fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
}
const tableBy = (label) => screen.getByRole('table', { name: label });
const headers = (table) => within(table).getAllByRole('columnheader').map((h) => h.textContent);

describe('Reorganization items 2–3', () => {
  it('opens with the owner\'s line; the fold layout is checked in the 2026-11-21 file', () => {
    render(<Rulebook />);
    expect(document.querySelector('.rb-intro').textContent).toBe('Recommendations are based on age, risk conditions and dated vaccine history.');
    // extinct: nine separate part folds and step links (owner 2026-11-21: each part now sits inside its step).
    expect(document.querySelector('.rb-step a')).toBeNull();
    expect(PATH_STEPS.every((s) => !('to' in s))).toBe(true);
    expect(Object.keys(HEADINGS)).not.toContain('vaccines');   // extinct: own fold until 2026-11-21, now under Read the record
  });

  it('a step opens on Show and closes on Hide', () => {
    render(<Rulebook />);
    openStep('MenB schedule');
    const b = fold('MenB schedule');
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(tableBy('MenB groups')).toBeTruthy();
    fireEvent.click(b);
    expect(screen.queryByRole('table', { name: 'MenB groups' })).toBeNull();
  });

  it('each step is one sentence', () => {
    for (const s of PATH_STEPS) expect(s.sum.match(/[.!?](\s|$)/g), s.key).toHaveLength(1);
    // extinct: the per-step Show panels (they repeated the parts).
    render(<Rulebook />);
    openAll();
    expect(document.querySelector('.rb-step-more, .rb-step-rows')).toBeNull();
  });
});

describe('Item 1: each thing is said once', () => {
  it('no Quick look, no age lines, no risk-group table anywhere on the screen', () => {
    render(<Rulebook />);
    openAll();
    const text = document.body.textContent;
    // extinct: removed on purpose (owner, 2026-11-20).
    expect(text).not.toContain('Quick look');
    expect(text).not.toContain('Age lines, youngest first');   // extinct: removed by the Rulebook reorganization, owner 2026-11-20
    expect(text).not.toContain('This table gives the doses and boosters for each condition.');   // extinct: removed by the Rulebook reorganization, owner 2026-11-20
    expect(text).not.toContain('Full rulebook');   // extinct: removed by the Rulebook reorganization, owner 2026-11-20
    expect(text).not.toContain('Other indications');   // extinct: removed by the Rulebook reorganization, owner 2026-11-20
  });
});

describe('Item 4: group tables', () => {
  it('MenACWY and MenB each open on Group | Doses | Boosters, plain words, Details under the group name', () => {
    render(<Rulebook />);
    openAll();
    for (const [label, t] of [['MenACWY groups', ACWY_GROUPS], ['MenB groups', MENB_GROUPS]]) {
      const table = tableBy(label);
      expect(headers(table)).toEqual(['Group', 'Doses', 'Boosters']);
      expect(table.querySelector('.dose-val-chip, .rb-bar')).toBeNull();   // no chips, no bars
      const groupCells = within(table).getAllByRole('rowheader');
      expect(groupCells.map((c) => c.textContent.replace(/(Details|Close)$/, ''))).toEqual(t.rows.map((r) => r.group));
      for (const c of groupCells) expect(within(c).getByRole('button', { name: 'Details' })).toBeTruthy();
    }
  });

  it('only the shared decision (blue) and the wait (amber) are tinted', () => {
    expect([...ACWY_GROUPS.rows, ...MENB_GROUPS.rows].filter((r) => r.tone).map((r) => [r.key, r.tone]))
      .toEqual([['bhealthy', 'shared'], ['preg', 'wait']]);
    render(<Rulebook />);
    openStep('MenB schedule');
    const table = tableBy('MenB groups');
    expect(within(table).getByText('Two doses, by shared clinical decision-making').className).toBe('rb-tint-shared');
    expect(within(table).getByText('Wait until after pregnancy').className).toBe('rb-tint-wait');
    expect(table.querySelectorAll('.rb-tint-shared, .rb-tint-wait')).toHaveLength(2);
  });

  it('Details opens one row at a time, with its sources; a second tap closes it', () => {
    render(<Rulebook />);
    openStep('MenACWY schedule');
    const table = tableBy('MenACWY groups');
    const [first, second] = within(table).getAllByRole('button', { name: 'Details' });
    fireEvent.click(first);
    expect(screen.getByText(ACWY_GROUPS.rows[0].details[0])).toBeTruthy();
    const panel = document.querySelector('.rb-g-detin');
    fireEvent.click(within(panel).getByRole('button', { name: 'Source' }));
    expect(panel.textContent).toMatch(/“.+”/);
    fireEvent.click(second);
    expect(screen.queryByText(ACWY_GROUPS.rows[0].details[0])).toBeNull();
    expect(screen.getByText(ACWY_GROUPS.rows[1].details[0])).toBeTruthy();
    fireEvent.click(within(table).getByRole('button', { name: 'Close' }));
    expect(within(table).queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('the group rows say what the drawing showed', () => {
    const doses = (t, key) => t.rows.find((r) => r.key === key).doses;
    expect(doses(ACWY_GROUPS, 'healthy')).toBe('One dose at 11–12 years');
    expect(doses(ACWY_GROUPS, 'hr')).toBe('Infant series under 2 years. Two doses at 2 years or older.');
    expect(doses(ACWY_GROUPS, 'travel')).toBe('Infant series under 2 years. One dose at 2 years or older.');
    expect(doses(ACWY_GROUPS, 'military')).toBe('Under 22 years: same as healthy. 22 years or older: one dose.');
    expect(doses(ACWY_GROUPS, 'college')).toBe('One dose at 16 years or older, unless one was given in the last 5 years');
    expect(ACWY_GROUPS.rows.find((r) => r.key === 'hr').boosters).toBe('3 or 5 years after the series, then every 5 years');
    expect(doses(MENB_GROUPS, 'bhr')).toBe('Three doses, from 10 years');
    expect(MENB_GROUPS.rows.find((r) => r.key === 'bhr').boosters).toBe('1 year after the series, then every 2–3 years');
  });
});

describe('Item 5: the vaccines table', () => {
  it('has no "Counts as" column, and the finish line sits under "MenB products are not interchangeable"', () => {
    render(<Rulebook />);
    openStep('Read the record');
    const vaccineTable = tableBy('The vaccines');
    expect(headers(vaccineTable)).toEqual(['Vaccine', 'Minimum age', 'Use']);
    for (const r of VACCINE_ROWS.flatMap((g) => g.rows)) expect(r).not.toHaveProperty('countsAs');
    const families = screen.getByRole('region', { name: FAMILIES.title });
    expect(families.textContent).toContain('Finish with the first MenB product. The card also offers finishing with the other.');
  });
});

describe('Item 6: every schedule is a Dose | Routine | Minimum interval table', () => {
  const schedules = () => [ACWY_ROUTINE, ...ACWY_HIGHRISK_TABLES, MENB_HEALTHY, MENB_HIGHRISK];

  it('each schedule renders with the three columns, the Minimum interval column shaded grey', () => {
    render(<Rulebook />);
    openAll();
    const tables = [...document.querySelectorAll('table.rb-sched')];
    expect(tables).toHaveLength(schedules().length);
    for (const table of tables) {
      expect(headers(table)).toEqual(['Dose', 'Routine', 'Minimum interval']);
      const minCells = [...table.querySelectorAll('tbody tr')].map((tr) => tr.lastElementChild);
      for (const c of minCells) expect(c.classList.contains('rb-min'), c.textContent).toBe(true);
      expect(table.querySelectorAll('.rb-min')).toHaveLength(minCells.length + 1);   // + its heading
    }
    // extinct: the arrow series (owner rejected arrows, a dose ladder and a timeline).
    expect(document.querySelector('.rb-arrow, .rb-pattern-doses')).toBeNull();
  });

  it('the tables hold the true minimums, in the drawing\'s words', () => {
    const cells = (s) => s.rows.map((r) => [r.dose, r.routine, r.min]);
    expect(cells(ACWY_ROUTINE)).toEqual([
      ['Dose 1', '11–12 years', 'Minimum age 10 years'],
      ['Booster', '16 years', '8 weeks after dose 1, at 16 years or older'],
    ]);
    expect(cells(ACWY_HIGHRISK_TABLES[0])).toEqual([
      ['Dose 1', '2 months', '—'],
      ['Dose 2', '4 months', '8 weeks after dose 1'],
      ['Dose 3', '6 months', '8 weeks after dose 2'],
      ['Dose 4', '12 months', '12 weeks after dose 3, at 12 months or older'],
    ]);
    expect(cells(MENB_HEALTHY)).toEqual([
      ['Dose 1', '16–23 years, preferably 16–18 years', 'Minimum age 16 years'],
      ['Dose 2', '6 months after dose 1', '4 weeks after dose 1'],
    ]);
    expect(cells(MENB_HIGHRISK)).toEqual([
      ['Dose 1', 'From 10 years', 'Minimum age 10 years'],
      ['Dose 2', '1 month after dose 1', '4 weeks after dose 1'],
      ['Dose 3', '6 months after dose 1 and 4 months after dose 2, whichever is later', '4 months after dose 2, or 6 months after dose 1'],
      // Tier 1 Q5b (owner, 2026-11-23): the outbreak's 6 months in the minimum column.
      ['Booster', '1 year after the series, then every 2–3 years', '1 year after the series (6 months for a serogroup B outbreak), then 2 years after the last booster'],
    ]);
    // Where a sooner dose still counts, one line under the table says so.
    expect(MENB_HEALTHY.note.text).toBe('Dose 2 given <6 months after dose 1 counts. Give dose 3 ≥4 months after dose 2.');
    expect(MENB_HIGHRISK.note.text).toBe('No dose 3 is needed if dose 2 was ≥6 months after dose 1.');
  });

  it('the minimums are the app\'s: a healthy MenB dose 2 at 3 weeks does not count, a routine MenACWY booster at 15 does not', () => {
    expect(WORKED_PATIENTS.menbHealthy3wk.expect.chip).toEqual(['MenB', 1, 'Not counted — repeat']);
    expect(MENB_HEALTHY.ex).toContain(WORKED_PATIENTS.menbHealthy3wk);
    expect(ACWY_ROUTINE.ex).toContain(WORKED_PATIENTS.boosterAt15);
  });
});

describe('Item 7: MenB "If dose 3 was early" is one three-row table', () => {
  it('Dose 3 was given | Result', () => {
    render(<Rulebook />);
    openStep('MenB schedule');
    const table = tableBy('If dose 3 was early');
    expect(headers(table)).toEqual(['Dose 3 was given', 'Result']);
    expect(MENB_DOSE3_EARLY.rows.map((r) => [r.given, r.result])).toEqual([
      ['<4 months after dose 2 and <6 months after dose 1', 'Not counted. Repeat it ≥4 months after that dose.'],
      ['<4 months after dose 2, ≥6 months after dose 1', 'Counts. Series complete.'],
      ['≥4 months after dose 2, <6 months after dose 1', 'Counts. Series complete.'],
    ]);
    expect(MENB_DOSE3_EARLY.rows[2].decision).toBe('menbDose3FromDose2');
  });
});

describe('Items 8–9: doses on the record', () => {
  it('"A dose that does not count" has General rules and Special cases', () => {
    render(<Rulebook />);
    openStep('Read the record');
    const card = screen.getByRole('region', { name: 'A dose that does not count' });
    expect(within(card).getAllByRole('heading', { level: 5 }).map((h) => h.textContent)).toEqual(['General rules', 'Special cases']);
    expect(NOT_COUNTED.general.map((r) => r.text)).toEqual([
      'Repeat that dose only. Do not restart the series.',
      'The repeat is given at least the minimum interval after the invalid dose.',
    ]);
    expect(NOT_COUNTED.special.map((r) => r.decision)).toEqual(['repeatAfterTooYoung', 'setAsideClock']);
  });

  it('the intervals table holds only doses that do not count when sooner; healthy MenB dose 2 moved to its own list', () => {
    // extinct: the "Sooner still counts" rows (the heading says a sooner dose does not count).
    expect(INTERVALS.filter((r) => r.text)).toEqual([]);
    expect(INTERVALS.map((r) => r.doses)).not.toContain('Healthy MenB dose 2');
    expect(INTERVALS.map((r) => r.doses)).toContain('High-risk MenB dose 3');
    expect(SOONER_ADDS.title).toBe('Sooner counts, but a dose is added');
    expect(SOONER_ADDS.rows.map((r) => r.text)).toEqual(['Healthy MenB dose 2 <6 months after dose 1 counts. Dose 3 is added.']);
    render(<Rulebook />);
    openStep('Time between doses');
    expect(screen.getByRole('heading', { name: 'Sooner counts, but a dose is added' })).toBeTruthy();
  });
});

describe('Item 10: Sources grouped, with no count or read date', () => {
  it('five group headings, and no "sentences quoted" or "read <date>" line', () => {
    render(<Rulebook />);
    fireEvent.click(fold('Sources'));
    const body = document.querySelector('#rb-sources-body');
    expect(within(body).getAllByRole('heading', { level: 4 }).map((h) => h.textContent))
      .toEqual(['ACIP recommendations', 'CDC schedule notes', 'Other CDC and ACIP guidance', 'Other']);   // C6 2026-11-23: no immunize.org source left
    // extinct: the count and the read date (both stay in refs.js and the rulebook document).
    expect(body.textContent).not.toMatch(/sentences? quoted|Listed, not quoted|read \d{4}-\d{2}-\d{2}/);
  });
});
