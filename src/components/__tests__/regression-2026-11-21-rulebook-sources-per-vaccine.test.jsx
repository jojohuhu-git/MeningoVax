// @vitest-environment happy-dom
// The Rulebook's Source buttons cite only their own vaccine (owner, 2026-11-21:
// "there are MenB sources under MenACWY and vice versa").
//
// WHY. A row's Source is generated: the row's worked patients are run through
// the app and every sentence their cards cite is collected. A worked patient
// gets a MenACWY card AND a MenB card, so a MenACWY row was collecting the MenB
// card's sentences too (35 of the 37 MenACWY and MenB rows, measured
// 2026-11-21). Now a row that belongs to one vaccine reads only that vaccine's
// card and that vaccine's recorded-dose lines.
//
// This test holds two things:
//   1. Every row in the MenACWY and MenB steps says which vaccine it is, and
//      so do the rows in the shared steps that are about one vaccine.
//   2. On the drawn screen, no Source under the MenACWY step quotes a sentence
//      that only a MenB card or MenB dose line ever cites, and the reverse.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import Rulebook from '../Rulebook.jsx';
import {
  WORKED_PATIENTS, FAMILIES, ACWY_GROUPS, MENB_GROUPS, ACWY_ROUTINE, ACWY_BY_AGE, ACWY_HISTORY_NOTES,
  ACWY_HIGHRISK_TABLES, ACWY_HIGHRISK_NOTES, MENB_HEALTHY, MENB_HIGHRISK, MENB_DOSE3_EARLY, MENB_OTHER,
  MENB_PREGNANCY, CHIP_LEGEND, INTERVALS, SOONER_ADDS, NOT_COUNTED, riskRankingFor, rowSources, SENTENCE_VACCINE,
} from '../../data/rulebookPage.js';
import { recommend } from '../../logic/recommend.js';
import { CITATIONS } from '../../data/refs.js';

/** Every quoted sentence each vaccine's cards and dose lines cite, over all worked patients. */
function citedBy() {
  const by = { MenACWY: new Set(), MenB: new Set() };
  for (const e of Object.values(WORKED_PATIENTS)) {
    const out = recommend(e.input);
    if (out.excluded) continue;
    for (const [v, stream] of [['MenACWY', 'menacwy'], ['MenB', 'menb']]) {
      const cites = [
        ...(out[stream] ?? []).flatMap((r) => [...(r.noteCites ?? []), ...(r.boosterCites ?? [])]),
        ...(out.history?.[v]?.perDose ?? []).flatMap((d) => d.reasonCites ?? []),
      ];
      for (const c of cites) if (c?.quote) by[v].add(c.quote);
    }
  }
  return by;
}
const BY = citedBy();
const onlyBy = (v, other) => new Set([...BY[v]].filter((q) => !BY[other].has(q)));
const ONLY_MENB = onlyBy('MenB', 'MenACWY');
const ONLY_ACWY = onlyBy('MenACWY', 'MenB');

const ACWY_ROWS = [
  ...ACWY_GROUPS.rows, ACWY_GROUPS.note, ACWY_ROUTINE, ...ACWY_BY_AGE, ...ACWY_HISTORY_NOTES,
  ...ACWY_HIGHRISK_TABLES, ACWY_HIGHRISK_NOTES.boostersRow, ...riskRankingFor('MenACWY'),
  ...INTERVALS.slice(0, 3), ...CHIP_LEGEND.slice(4, 6), NOT_COUNTED.special[1],
];
const MENB_ROWS = [
  FAMILIES, ...MENB_GROUPS.rows, MENB_GROUPS.note, MENB_HEALTHY, MENB_HEALTHY.note, MENB_HIGHRISK,
  MENB_HIGHRISK.note, ...MENB_DOSE3_EARLY.rows, ...MENB_OTHER, MENB_PREGNANCY, ...riskRankingFor('MenB'),
  ...INTERVALS.slice(3), CHIP_LEGEND[6], ...SOONER_ADDS.rows,
];

describe('Rulebook Sources cite only their own vaccine', () => {
  it('every one-vaccine row says which vaccine it is', () => {
    for (const r of ACWY_ROWS) expect(r.vaccine, r.text ?? r.group ?? r.age ?? r.doses ?? r.title).toBe('MenACWY');
    for (const r of MENB_ROWS) expect(r.vaccine, r.text ?? r.group ?? r.given ?? r.doses ?? r.title).toBe('MenB');
  });

  it('no MenACWY row lists a sentence only MenB cites, and no MenB row the reverse', () => {
    for (const r of ACWY_ROWS) for (const q of rowSources(r)) expect(ONLY_MENB.has(q.quote), q.quote).toBe(false);
    for (const r of MENB_ROWS) for (const q of rowSources(r)) expect(ONLY_ACWY.has(q.quote), q.quote).toBe(false);
  });

  it('every quoted sentence in refs.js says which vaccine it is about, once', () => {
    const quoted = Object.entries(CITATIONS).filter(([, c]) => c?.quote).map(([k]) => k).sort();
    expect(Object.keys(SENTENCE_VACCINE).sort()).toEqual(quoted);
    for (const v of Object.values(SENTENCE_VACCINE)) expect(['MenACWY', 'MenB', 'MenABCWY', 'general']).toContain(v);
  });

  it('a one-vaccine row shows only its own vaccine\'s sentences and general ones', () => {
    // The MenACWY card for an 11-year-old cites when MenB is offered; that
    // sentence is right on the card and wrong under a MenACWY row here.
    for (const [rows, v] of [[ACWY_ROWS, 'MenACWY'], [MENB_ROWS, 'MenB']]) {
      for (const r of rows) for (const q of rowSources(r)) expect([v, 'general'], `${q.key} under a ${v} row`).toContain(SENTENCE_VACCINE[q.key]);
    }
    const healthy = rowSources(ACWY_GROUPS.rows[0]).map((q) => q.key);
    expect(healthy).toContain('acwyRoutine1112and16');
    expect(healthy).not.toContain('menbHealthyPreferredAge1618');
    expect(healthy).not.toContain('pentavalentWhenBothIndicated');
  });

  it('a row with no vaccine still reads both cards (the shared steps)', () => {
    // The combined shot answers for both vaccines, so its rows keep both.
    const both = rowSources({ ex: [WORKED_PATIENTS.healthy16] }).map((q) => q.quote);
    expect(both.some((q) => BY.MenACWY.has(q))).toBe(true);
    expect(both.some((q) => BY.MenB.has(q))).toBe(true);
  });

  it('on the drawn screen, each step\'s Source panels quote only its own vaccine', () => {
    render(<Rulebook />);
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    const quotesIn = (bodyId) => {
      const body = () => document.getElementById(bodyId);
      const seen = [];
      const openSources = () => {
        for (const b of within(body()).queryAllByRole('button', { name: 'Source' })) fireEvent.click(b);
        for (const q of body().querySelectorAll('.rb-src-quote')) seen.push(q.textContent);
      };
      openSources();
      // A group row's Source is inside its Details panel, one panel open at a time.
      const details = within(body()).queryAllByRole('button', { name: 'Details' }).length;
      for (let i = 0; i < details; i += 1) {
        fireEvent.click(within(body()).queryAllByRole('button', { name: /^(Details|Close)$/ })[i]);
        openSources();
      }
      return seen;
    };
    const hits = (texts, only) => texts.filter((t) => [...only].some((q) => t.includes(q)));
    /** Every quoted sentence not about `v` and not general best practice. */
    const notAbout = (v) => new Set(Object.entries(SENTENCE_VACCINE)
      .filter(([, sv]) => ![v, 'general'].includes(sv)).map(([k]) => CITATIONS[k].quote));
    const acwy = quotesIn('rb-acwy-body');
    const menb = quotesIn('rb-menb-body');
    expect(acwy.length).toBeGreaterThan(10);
    expect(menb.length).toBeGreaterThan(10);
    expect(hits(acwy, ONLY_MENB)).toEqual([]);
    expect(hits(menb, ONLY_ACWY)).toEqual([]);
    // Stronger: not even a MenB sentence the MenACWY card quotes in passing.
    expect(hits(acwy, notAbout('MenACWY'))).toEqual([]);
    expect(hits(menb, notAbout('MenB'))).toEqual([]);
  });
});
