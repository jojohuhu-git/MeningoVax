// The dose chip's wording is written down once.
//
// sweep-dose-counter.test.js (F4) carried its OWN copy of RecCard.jsx's chip
// logic, with a comment promising it "mirrors RecCard.jsx's DoseValidation chip
// logic exactly". It did not. Measured over the sweep's own grid on 2026-09-17,
// the two disagreed on 20,167 of 95,928 rows: the component shows a plain
// "Booster", the test's copy showed "Booster (dose 3)".
//
// That is worse than a cosmetic mismatch. The sweep exists to prove the chip
// never implies N > M, and its copy printed the raw dose number against a
// smaller total -- the exact thing F2/F5 removed from the component. Anyone
// making the app agree with its test would have put the bug back.
//
// Two copies agree on the day the second one is written. This file is the guard
// that stops a third from appearing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { doseChipLabel, RECORD_PROBLEM_LABELS, NEEDS_INPUT_LABEL } from '../doseChipLabel.js';

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');

describe('the chip label lives in one module', () => {
  // The literals no file outside doseChipLabel.js may spell out for itself.
  const OWNED = [
    'Off-window - repeat',
    'Extra dose? — no date recorded',
    'Extra dose — more than this series needs',
    'Given — not part of a series this patient needs',
    'Date is in the future — not counted',
    'Entered twice — this row not counted',
  ];

  const CONSUMERS = [
    ['RecCard.jsx', '../RecCard.jsx'],
    ['sweep-dose-counter.test.js', '../../logic/__tests__/sweep-dose-counter.test.js'],
  ];

  for (const [name, rel] of CONSUMERS) {
    for (const literal of OWNED) {
      it(`${name} does not hand-type "${literal}"`, () => {
        // Strip comments: they quote the old wording on purpose, explaining
        // what changed and why. That history is not a second copy.
        const code = read(rel)
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .split('\n')
          .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
          .join('\n');
        expect(code).not.toContain(literal);
      });
    }
  }
});

describe('the branches the two copies disagreed on', () => {
  const valid = (n, extra = {}) => ({ status: 'valid', effectiveDoseNum: n, ...extra });

  it('a dose past the total says "Booster" and does NOT print its number', () => {
    const label = doseChipLabel(valid(3), 2);
    expect(label).toBe('Booster');
    // The whole point of the sweep: no number greater than the total, anywhere
    // in the string a clinician reads.
    expect(label).not.toMatch(/\d/);
  });

  it('a dose within the total is numbered', () => {
    expect(doseChipLabel(valid(2), 3)).toBe('Dose 2 of 3');
  });

  it('a record problem names the entry problem, not a clinical one', () => {
    expect(doseChipLabel(valid(1, { recordProblem: 'future' }), 3))
      .toBe(RECORD_PROBLEM_LABELS.future);
    expect(doseChipLabel(valid(1, { recordProblem: 'duplicate' }), 3))
      .toBe(RECORD_PROBLEM_LABELS.duplicate);
  });

  it('a record problem outranks every other state', () => {
    // It is checked first in the component. A copy that checked it last would
    // label a duplicated off-window dose "Off-window - repeat" instead.
    expect(doseChipLabel(valid(9, { recordProblem: 'duplicate', notAdolescentCount: true, extraDose: true }), 2))
      .toBe(RECORD_PROBLEM_LABELS.duplicate);
  });

  it('an undated row past the total asks rather than asserts', () => {
    expect(doseChipLabel(valid(4, { extraDoseUnverified: true, extraDose: true }), 2))
      .toBe('Extra dose? — no date recorded');
  });

  it('a dated row past a no-booster total asserts', () => {
    expect(doseChipLabel(valid(4, { extraDose: true }), 2))
      .toBe('Extra dose — more than this series needs');
  });

  it('a dose recorded against no indicated series', () => {
    expect(doseChipLabel(valid(1), null))
      .toBe('Given — not part of a series this patient needs');
  });

  it('off-window keeps its owner-agreed wording', () => {
    expect(doseChipLabel(valid(2, { notAdolescentCount: true }), 2)).toBe('Off-window - repeat');
  });

  it('pending, invalid and unknown', () => {
    expect(doseChipLabel({ status: 'pending' }, 2)).toBe(NEEDS_INPUT_LABEL);
    expect(doseChipLabel({ status: 'invalid' }, 2)).toBe('Invalid');
    expect(doseChipLabel({ status: 'whatever' }, 2)).toBe('Unknown');
    expect(doseChipLabel(null, 2)).toBeNull();
  });
});
