// @vitest-environment happy-dom
//
// OWNER DECISION 2026-11-27, both apps: no entry field is labelled "(optional)".
// Her words: "remove optional from both pneumovax and meningovax - since users
// can add whatever they want and there are rules already in place for how to
// assess unknown brands and doses I don't think this comment adds much to
// either app."
//
// MeningoVax had two left: the age step's "Months (optional)" and the dose
// row's "Brand (optional)". The dose date lost its "(optional)" on 2026-11-20
// (review v10, P2). Neither box is made required, and this test does not
// assert that: a blank Months box is 0 months, and a blank brand is still
// "Unknown brand", which the existing unknown-brand rules assess.
//
// Twin: PneumoVax's regression-2026-11-27-no-optional-field-labels test (its
// "Months" label). Change the rule in both repos or neither.
//
// NOT covered, on purpose: "Optional today - shared decision" on a result
// card. That is a clinical status, not a field label.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import StepAge from '../StepAge.jsx';
import DoseEditor from '../DoseEditor.jsx';
import { MENACWY_BRANDS } from '../../data/brands.js';

const DIR = join(process.cwd(), 'src/components');
const TODAY = '2026-11-27';

describe('no entry field says "(optional)" (owner 2026-11-27)', () => {
  it('the age step labels its second box "Months"', () => {
    render(<StepAge ageMonths={null} today={TODAY} onChange={() => {}} />);
    fireEvent.click(screen.getByText(/Years \/ Months/));
    expect(screen.getByLabelText('Months').id).toBe('age-months');
    // extinct: every "(optional)" field label, removed by the owner 2026-11-27
    expect(document.body.textContent).not.toMatch(/\(optional\)/i);
  });

  it('a blank Months box still works: 5 years and no months is 60 months', () => {
    const seen = [];
    render(<StepAge ageMonths={null} today={TODAY} onChange={(p) => seen.push(p)} />);
    fireEvent.click(screen.getByText(/Years \/ Months/));
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '5' } });
    expect(seen.at(-1).ageMonths).toBe(60);
  });

  it('the dose row labels its boxes "Date" and "Brand", and a blank brand is still "Unknown brand"', () => {
    const { container } = render(
      <DoseEditor vaccine="MenACWY" doses={[{ date: '2026-01-15', brand: '' }]} onChange={() => {}} brandOptions={MENACWY_BRANDS} today={TODAY} />,
    );
    const labels = [...container.querySelectorAll('.dose-field label')].map((l) => l.textContent);
    expect(labels).toContain('Date');
    expect(labels).toContain('Brand');
    expect(labels.filter((l) => /\(optional\)/i.test(l))).toEqual([]);
    const select = container.querySelector('.dose-field select');
    expect(select.value).toBe('');
    expect(select.options[select.selectedIndex].textContent).toBe('Unknown brand');
  });

  it('no <label> in any component source ends with "(optional)"', () => {
    const hits = [];
    for (const f of readdirSync(DIR).filter((n) => n.endsWith('.jsx'))) {
      const src = readFileSync(join(DIR, f), 'utf8');
      for (const m of src.matchAll(/<label\b[^>]*>([^<]*)<\/label>/g)) {
        if (/\(optional\)/i.test(m[1])) hits.push(`${f}: ${m[1].trim()}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
