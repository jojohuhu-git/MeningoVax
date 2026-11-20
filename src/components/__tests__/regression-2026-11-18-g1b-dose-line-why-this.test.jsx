// @vitest-environment happy-dom
// Port Phase 6.2, G1-b (owner, STOP G1, 2026-11-18: "Yes, as PneumoVax").
//
// Before: the line beside a recorded dose printed everything at once — the
// reason, the background behind the rule, and the "Age at administration …
// Minimum …" detail (median 44 words, longest 79, measured for the packet).
// PneumoVax gives each recorded dose its own "Why this" fold-out
// (owner request there, 2026-10-24); MeningoVax did not.
//
// Owner: the line keeps the label plus its reason; the background and the
// age/minimum detail go behind the dose's "Why this". The source number stays
// on the line, on the sentence it supports (the packet's L3 "after").
//
// Measured (prose diff, every disclosure open, 24,600 grid patients): 14,270
// patients gain a dose-line "Why this" (9,030 real); 0 patients' set of
// sentences changed; 0 source numbers changed; saved answers unchanged.
//
// Patients are the packet's L3 and L1 (stop-g1-packet-2026-11-18.md, §1).
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, within } from '@testing-library/react';
import Results from '../Results.jsx';
import { MENB_LICENSED_FROM_10_WHY, MENB_WANES_BEFORE_16_WHY } from '../../logic/doseRules.js';

const TODAY = '2026-09-15';
const screenFor = (s) => render(
  <Results
    state={{ step: 4, riskAtDoseAnswers: { MenACWY: {}, MenB: {} }, riskIds: [], menacwyDoses: [], menbDoses: [], ...s }}
    today={TODAY} onReset={() => {}} onChange={() => {}} onBack={() => {}}
  />,
).container;
const menbCard = (c) => [...c.querySelectorAll('[data-testid="rec-card"]')]
  .find((x) => x.querySelector('.rec-vaccine-name')?.textContent === 'MenB');
// The recorded-dose lines of the MenB card, opening the card first if it is a
// quiet (collapsed) one.
const doseLines = (c) => {
  let card = menbCard(c);
  if (!card.querySelector('.dose-val')) {
    fireEvent.click(card.querySelector('[aria-expanded="false"]'));
    card = menbCard(c);
  }
  return [...card.querySelectorAll('.dose-val')];
};

describe('G1-b: a recorded dose has its own "Why this"; the line keeps the reason', () => {
  it('L3: complement deficiency, 10 y, Bexsero at 9: background and age detail behind "Why this", [1] stays on the line', () => {
    const c = screenFor({
      dob: '2016-03-01', riskIds: ['complement'],
      menbDoses: [{ date: '2025-03-15', brand: 'Bexsero (MenB)' }],
    });
    const [line] = doseLines(c);
    // Shut (the app's default).
    // G1-a (owner, STOP G1, packet L3): the line's words.
    expect(line.textContent).toContain('Minimum age not met (10 years for Bexsero).')   // P61 (review v10);
    expect(line.textContent).not.toContain(MENB_LICENSED_FROM_10_WHY);
    expect(line.textContent).not.toContain('Age at administration');
    const number = line.querySelector('.note-cite').textContent;
    expect(number).toBe('[1]');
    const toggle = within(line).getByTestId('dose-val-toggle');
    expect(toggle.textContent).toBe('Why this');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // Open.
    fireEvent.click(toggle);
    const why = within(line).getByTestId('dose-val-why');
    expect(why.textContent).toContain(MENB_LICENSED_FROM_10_WHY);
    expect(why.textContent).toContain('Age at administration: about 9 years');
    expect(why.textContent).toContain('Minimum: 10 years (120 months).');
    // Opening it does not renumber the source.
    expect(line.querySelector('.note-cite').textContent).toBe(number);
  });

  it('L1: healthy 11 y, Bexsero at 10: the "wanes" background goes behind "Why this"', () => {
    const c = screenFor({
      dob: '2015-03-01',
      menbDoses: [{ date: '2025-06-01', brand: 'Bexsero (MenB)' }],
    });
    const [line] = doseLines(c);
    expect(line.textContent).toContain('The healthy 2-dose MenB series is given at 16–23 years by shared clinical decision-making.');
    expect(line.textContent).not.toContain(MENB_WANES_BEFORE_16_WHY);
    fireEvent.click(within(line).getByTestId('dose-val-toggle'));
    expect(within(line).getByTestId('dose-val-why').textContent).toContain(MENB_WANES_BEFORE_16_WHY);
  });

  it('a record problem (date in the future): the recorded/today dates go behind "Why this"', () => {
    const c = screenFor({
      dob: '2014-03-01', riskIds: ['complement'],
      menbDoses: [{ date: '2026-10-15', brand: 'Bexsero (MenB)' }],
    });
    const [line] = doseLines(c);
    expect(line.textContent).toContain('Today is Sep 15, 2026. Correct a mistyped year');
    expect(line.textContent).not.toContain('Recorded date:');
    fireEvent.click(within(line).getByTestId('dose-val-toggle'));
    expect(within(line).getByTestId('dose-val-why').textContent).toContain('Recorded date: Oct 15, 2026. Today: Sep 15, 2026.');
  });

  it('control: a dose that counts and has nothing to explain gets no "Why this"', () => {
    const c = screenFor({
      dob: '2014-03-01', riskIds: ['complement'],
      menbDoses: [{ date: '2026-08-01', brand: 'Bexsero (MenB)' }],
    });
    const [line] = doseLines(c);
    expect(within(line).queryByTestId('dose-val-toggle')).toBeNull();
  });
});
