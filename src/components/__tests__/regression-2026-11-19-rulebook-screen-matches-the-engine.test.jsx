// @vitest-environment happy-dom
// The Rulebook screen (port Phase 7.2, owner Q11, 2026-11-19: "Yes, like
// PneumoVax") cannot quietly stop describing the app. PneumoVax's C14 guard,
// brought here.
//
// WHY. MeningoVax's rules are mostly branching code, so the screen is
// sentences somebody typed, and a typed sentence about a rule is the failure
// both apps have been bitten by (a schedule that disagreed with its own
// documentation for 32 days). So:
//   1. NO NUMBER IS TYPED in rulebookPage.js's page text: every age and
//      interval comes from a constant the engine reads.
//   2. EVERY CLAIM CARRIES A WORKED PATIENT, and every one is run through
//      recommend() here. A sentence that stops being true fails its patient.
//   3. Every chip in the label key is the chip its patient's dose shows.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import Rulebook from '../Rulebook.jsx';
import App from '../../App.jsx';
import { doseChipLabel } from '../doseChipLabel.js';
import {
  WORKED_PATIENTS, DECISIONS, DECISION_USES, TRANSPLANT_STOP, FAMILIES, RISK_ROWS, RISK_RANKING,
  ACWY_ROUTINE, ACWY_BY_AGE, ACWY_HISTORY_NOTES, ACWY_HIGHRISK_LANES, ACWY_HIGHRISK_NOTES,
  ACWY_OTHER, ACWY_OTHER_NOTE, MENB_HEALTHY, MENB_HIGHRISK, MENB_PREGNANCY, PENTA_ROWS,
  CHIP_LEGEND, GRACE, INTERVALS, NOT_COUNTED, VACCINE_ROWS, SOURCE_DOCS, HEADINGS, sourcesFor,
} from '../../data/rulebookPage.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS } from '../../data/brands.js';
import { recommend } from '../../logic/recommend.js';

const SRC = dirname(dirname(dirname(fileURLToPath(import.meta.url))));   // src/
const pageSrc = readFileSync(join(SRC, 'data', 'rulebookPage.js'), 'utf8');
const componentSrc = readFileSync(join(SRC, 'components', 'Rulebook.jsx'), 'utf8');

const STREAM = { MenACWY: 'menacwy', MenB: 'menb' };

/** What the app says for a worked patient, in the shape `expect` describes. */
function check(key, e) {
  const out = recommend(e.input);
  const x = e.expect;
  const fails = [];
  if (x.excluded) {
    if (!out.excluded) fails.push('not stopped');
    return fails.map((f) => `${key} (${e.who}): ${f}`);
  }
  const card = (v) => out[STREAM[v]]?.[0];
  const labels = (v) => (out[STREAM[v]] ?? []).map((r) => r.doseLabel ?? '');
  const notes = [...out.menacwy, ...out.menb].map((r) => `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
  for (const re of x.acwy ?? []) if (!labels('MenACWY').some((l) => re.test(l))) fails.push(`MenACWY card "${labels('MenACWY')}" is not ${re}`);
  for (const re of x.menb ?? []) if (!labels('MenB').some((l) => re.test(l))) fails.push(`MenB card "${labels('MenB')}" is not ${re}`);
  for (const re of x.note ?? []) if (!notes.some((n) => re.test(n))) fails.push(`no note ${re}`);
  if (x.status) {
    const [v, s] = x.status;
    if (card(v)?.status !== s) fails.push(`${v} status ${card(v)?.status}, page says ${s}`);
  }
  if (x.due) {
    const [v, want] = x.due;
    const c = card(v);
    const got = c?.dueToday ? 'today' : c?.earliestNextDate;
    if (got !== want) fails.push(`${v} due ${got}, page says ${want}`);
  }
  for (const [v, re] of x.booster ?? []) {
    const line = card(v)?.boosterSummary ?? '';
    if (!re.test(line)) fails.push(`${v} booster line "${line}" is not ${re}`);
  }
  if (x.penta != null && Boolean(out.pentavalent?.eligible) !== x.penta) fails.push(`combined shot offered: ${out.pentavalent?.eligible}`);
  if (x.pentaWhy && !x.pentaWhy.test(out.pentavalent?.unavailableReason ?? '')) fails.push(`no reason ${x.pentaWhy}`);
  if (x.pentaBrands && JSON.stringify(out.pentavalent?.brands) !== JSON.stringify(x.pentaBrands)) fails.push(`combined brands ${out.pentavalent?.brands}`);
  if (x.chip) {
    const [v, i, want] = x.chip;
    const got = doseChipLabel(out.history?.[v]?.perDose?.[i], card(v)?.seriesTotal ?? null);
    if (got !== want) fails.push(`${v} dose ${i + 1} chip reads "${got}", page says "${want}"`);
  }
  return fails.map((f) => `${key} (${e.who}): ${f}`);
}

describe('Rulebook screen — every claim is true of the app, patient by patient', () => {
  it('every worked patient gets the answer the page describes', () => {
    const fails = Object.entries(WORKED_PATIENTS).flatMap(([k, e]) => check(k, e));
    expect(fails).toEqual([]);
    expect(Object.keys(WORKED_PATIENTS).length).toBeGreaterThan(50);
  });

  it('every written row carries at least one worked patient', () => {
    const rows = [
      TRANSPLANT_STOP, FAMILIES, ...RISK_RANKING.steps, ACWY_ROUTINE, ...ACWY_BY_AGE, ...ACWY_HISTORY_NOTES,
      ...ACWY_HIGHRISK_LANES, { text: ACWY_HIGHRISK_NOTES.boosters, ex: ACWY_HIGHRISK_NOTES.boostersEx },
      ...ACWY_OTHER, ACWY_OTHER_NOTE, MENB_HEALTHY, ...MENB_HEALTHY.rows, MENB_HIGHRISK, ...MENB_HIGHRISK.rows,
      MENB_PREGNANCY, ...PENTA_ROWS, ...CHIP_LEGEND, GRACE, ...INTERVALS, ...NOT_COUNTED, ...DECISIONS,
      ...RISK_ROWS,
    ];
    const bare = rows.filter((r) => !r.ex?.length).map((r) => r.text ?? r.name ?? r.doses ?? r.chip ?? r.short ?? r.age ?? r.start);
    expect(bare).toEqual([]);
  });

  it('each dose label in the key is the label its worked patient\'s dose really shows', () => {
    for (const c of CHIP_LEGEND) {
      expect(c.ex[0].expect.chip?.[2], `"${c.chip}" has no chip check`).toBe(c.chip);
    }
  });

  it('every decision is named somewhere on the page, and every named decision exists', () => {
    for (const d of DECISIONS) expect(DECISION_USES[d.key], d.key).not.toEqual([]);
    const named = [...pageSrc.matchAll(/decision: '(\w+)'/g)].map((m) => m[1]);
    for (const k of named) expect(DECISIONS.map((d) => d.key)).toContain(k);
  });

  it('every Source a row shows is a sentence the app\'s own card for that patient cites', () => {
    // sourcesFor() reads only the cards' own citations; a row with a worked
    // patient whose card quotes nothing would show an empty Source.
    for (const r of [...ACWY_BY_AGE, ...ACWY_HIGHRISK_LANES, ...MENB_HIGHRISK.rows, ...PENTA_ROWS]) {
      for (const q of sourcesFor(r.ex)) expect(q.quote, q.key).toBeTruthy();
    }
    expect(sourcesFor([WORKED_PATIENTS.healthy16]).map((q) => q.key)).toContain('acwyRoutine1112and16');
  });
});

describe('Rulebook screen — no age or interval is typed by hand', () => {
  it('rulebookPage.js\'s page text holds no typed number', () => {
    const page = pageSrc.slice(pageSrc.indexOf('THE PAGE. No number'))
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const offenders = [];
    for (const m of page.matchAll(/(\w+)(?::|\s*=)\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/g)) {
      const [, field, , raw] = m;
      // A chip's words are asserted equal to doseChipLabel() above; `key` and
      // `decision` are names in the code, never shown.
      if (field === 'chip' || field === 'key' || field === 'decision') continue;
      const text = raw
        .replace(/\$\{[^}]*\}/g, ' ')                                 // interpolated: from a constant
        .replace(/\b[12]-vial\b/g, 'the product')                      // Menveo 1-vial, 2-vial
        .replace(/\bMenB-?4C\b|\b4C\b/g, 'the family')
        .replace(/\b[Dd]ose \d+( of \d+)?/g, 'a dose')                // dose numbers, not ages
        .replace(/\b\d+-dose\b/g, 'n-dose')
        .replace(/\b\d+ doses?\b/g, 'some doses');
      for (const n of text.matchAll(/\d+/g)) offenders.push(`${field}: "${raw.slice(0, 70)}" contains ${n[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('the component itself types no ages: it renders what the data gives it', () => {
    const jsx = componentSrc.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\{[^{}<>]*\}/g, ' ');   // a plain {value} is data, not typed text
    // Text between two tags is what a clinician reads. A run that is really
    // code ({i > 0 && <Arrow />}) is skipped; a dose number is not an age.
    const numbers = [...jsx.matchAll(/>([^<>{}]+)</g)]
      .map((m) => m[1])
      .filter((txt) => !/&&|=>|\?|\|\|/.test(txt))
      .map((txt) => txt.replace(/\b[Dd]ose \d+/g, 'a dose'))
      .flatMap((txt) => [...txt.matchAll(/\d+/g)].map((n) => `"${txt.trim()}" contains ${n[0]}`));
    expect(numbers).toEqual([]);
    // Not a vacuous check: it does read the component's text.
    expect([...jsx.matchAll(/>([^<>{}]+)</g)].length).toBeGreaterThan(20);
  });
});

describe('Rulebook screen — every list is the app\'s own list', () => {
  it('lists every condition the app asks about except the transplant stop, in the app\'s order', () => {
    expect(RISK_ROWS.map((r) => r.id)).toEqual(RISK_FACTORS.filter((r) => !r.exclude).map((r) => r.id));
    for (const r of RISK_ROWS) expect(r.acwy || r.menb, r.id).toBeTruthy();
  });

  it('lists every product the app offers, and Menactra as history', () => {
    const shown = VACCINE_ROWS.flatMap((g) => g.rows.map((r) => r.key));
    const offered = [...MENACWY_BRANDS.filter((b) => b.active), ...MENB_BRANDS, ...PENTAVALENT_BRANDS].map((b) => b.key);
    expect(shown).toEqual([...offered, 'Menactra']);
    for (const g of VACCINE_ROWS) for (const r of g.rows) expect(r.use, r.key).toBeTruthy();
  });

  it('the transplant stop names the condition in the app\'s own words, and the app\'s own banner title', () => {
    expect(RISK_FACTORS.find((r) => r.exclude).label).toBe(TRANSPLANT_STOP.title);
    const results = readFileSync(join(SRC, 'components', 'Results.jsx'), 'utf8');
    const bannerTitle = TRANSPLANT_STOP.text.split('.')[0];
    expect(results).toContain(`>${bannerTitle}<`);
  });

  it('lists each document the app quotes, with its count of quoted sentences', () => {
    expect(SOURCE_DOCS.length).toBeGreaterThan(3);
    expect(SOURCE_DOCS.reduce((n, d) => n + d.quotes, 0)).toBeGreaterThan(40);
  });
});

describe('Rulebook screen — what a clinician sees', () => {
  it('shows the parts in the order the app decides', () => {
    render(<Rulebook />);
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(h2).toEqual(Object.values(HEADINGS).map((h, i) => `${i + 1}. ${h}`));
  });

  it('a Source button opens the quoted sentence, and a decision opens its three parts', () => {
    render(<Rulebook />);
    const src = screen.getAllByRole('button', { name: 'Source' })[0];
    fireEvent.click(src);
    expect(src.getAttribute('aria-expanded')).toBe('true');
    expect(src.parentElement.textContent).toMatch(/“.+”/);
    const chip = screen.getAllByRole('button', { name: /^MeningoVax decision: / })[0];
    fireEvent.click(chip);
    const panel = chip.parentElement;
    expect(within(panel).getByText('Problem:')).toBeTruthy();
    expect(within(panel).getByText('CDC and ACIP:')).toBeTruthy();
    expect(within(panel).getByText('MeningoVax decision:')).toBeTruthy();
  });

  it('the header switch opens the Rulebook and comes back to the same patient', () => {
    render(<App />);
    const patient = screen.getByRole('button', { name: 'Patient' });
    const rulebook = screen.getByRole('button', { name: 'Rulebook' });
    expect(patient.getAttribute('aria-pressed')).toBe('true');
    const form = document.querySelector('form');
    const patientPart = document.querySelector('.app-patient');
    fireEvent.click(rulebook);
    expect(rulebook.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { level: 1, name: 'Rulebook' })).toBeTruthy();
    expect(patientPart.hidden).toBe(true);
    fireEvent.click(patient);
    expect(screen.queryByRole('heading', { level: 1, name: 'Rulebook' })).toBeNull();
    // The same form, not a fresh one: whatever was typed is still there.
    expect(document.querySelector('form')).toBe(form);
    expect(patientPart.hidden).toBe(false);
  });
});
