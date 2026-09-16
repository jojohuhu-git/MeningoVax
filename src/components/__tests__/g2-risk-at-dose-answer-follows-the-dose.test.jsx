// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// G2 (2026-09-16): the provider's answer to "was this patient at high risk
// when this dose was given?" must stay attached to the DOSE it was given
// about — not to that dose's position in the list.
//
// The answers used to be keyed by the dose's index in the sorted list, so
// any edit that re-sorted or re-numbered the list silently moved the answer
// onto a different dose: delete the answered dose and a survivor inherits
// the "yes", and the app then reports "confirmed the patient was already
// high-risk on…" about a date nobody was asked about. That is a clinical
// assertion invented by a list index.
//
// Patient: 12y (144 months) with asplenia. Both doses fall before age 10,
// which is exactly the case that asks the risk-timing question.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { newDoseRow } from '../../logic/doseIdentity.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={patch => setState(s => ({ ...s, ...patch }))}
      onReset={() => {}}
    />
  );
}

function baseState(overrides = {}) {
  return {
    ageMonths: 144, // 12y — born 2014-09-15 against the pinned TEST_TODAY
    riskIds: ['asplenia'],
    menacwyDoses: [],
    menbDoses: [],
    riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
    ...overrides,
  };
}

const CONFIRMED = /confirmed the patient was already high-risk/i;

function acwyRows() {
  // The MenACWY card is the first card with a recorded-dose list.
  const progress = document.querySelector('.rec-progress');
  return Array.from(progress?.querySelectorAll('.rec-progress-dose-row') ?? []);
}

function rowFor(year) {
  return acwyRows().find(r => r.textContent.includes(String(year)));
}

function answerYesOn(year) {
  const row = rowFor(year);
  expect(row, `expected a recorded-dose row for ${year}`).toBeDefined();
  const yes = Array.from(row.querySelectorAll('button')).find(b => b.textContent.trim() === 'Yes');
  expect(yes, `expected a risk-timing "Yes" button on the ${year} row`).toBeDefined();
  fireEvent.click(yes);
}

describe('G2: a risk-at-dose answer stays with its own dose', () => {
  it('deleting the answered dose does not hand its "yes" to a surviving dose', () => {
    render(
      <Harness
        initial={baseState({
          menacwyDoses: [
            newDoseRow({ date: '2022-09-15' }), // given at ~8y
            newDoseRow({ date: '2023-09-15' }), // given at ~9y
          ],
        })}
      />
    );

    // The provider answers about the 2022 dose only.
    answerYesOn(2022);
    expect(rowFor(2022).textContent).toMatch(CONFIRMED);
    expect(rowFor(2023).textContent).not.toMatch(CONFIRMED);

    // Now that 2022 dose is deleted — it was recorded in error, say.
    fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove MenACWY dose 1' }));

    // The 2023 dose was never asked about. It must not claim it was.
    expect(rowFor(2022)).toBeUndefined();
    expect(rowFor(2023)).toBeDefined();
    expect(rowFor(2023).textContent).not.toMatch(CONFIRMED);
  });

  it('adding an earlier dose does not hand the answered dose\'s "yes" to the new one', () => {
    render(
      <Harness
        initial={baseState({
          menacwyDoses: [newDoseRow({ date: '2023-09-15' })], // given at ~9y
        })}
      />
    );

    answerYesOn(2023);
    expect(rowFor(2023).textContent).toMatch(CONFIRMED);

    // A second, EARLIER dose turns up in the chart and is added.
    fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));
    fireEvent.click(screen.getByRole('button', { name: '+ Add MenACWY dose' }));
    const acwyBlock = screen.getByTestId('recorded-doses-panel').querySelector('.dose-history-block');
    const dateInputs = acwyBlock.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[dateInputs.length - 1], { target: { value: '2022-09-15' } });

    // The answer belongs to the 2023 dose and must still be on it; the brand
    // new 2022 dose has never been asked about.
    expect(rowFor(2022).textContent).not.toMatch(CONFIRMED);
    expect(rowFor(2023).textContent).toMatch(CONFIRMED);
  });

  it('survives a delete when every row was added through the UI, ids and all', () => {
    // No hand-built fixtures here: the rows are created by the same button a
    // clinician clicks, so this is the path the app actually takes.
    render(<Harness initial={baseState()} />);

    fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));
    const addAcwy = () => fireEvent.click(screen.getByRole('button', { name: '+ Add MenACWY dose' }));
    const acwyDateInputs = () => screen
      .getByTestId('recorded-doses-panel')
      .querySelector('.dose-history-block')
      .querySelectorAll('input[type="date"]');

    addAcwy();
    fireEvent.change(acwyDateInputs()[0], { target: { value: '2022-09-15' } });
    addAcwy();
    fireEvent.change(acwyDateInputs()[1], { target: { value: '2023-09-15' } });

    answerYesOn(2022);
    expect(rowFor(2022).textContent).toMatch(CONFIRMED);

    fireEvent.click(screen.getByRole('button', { name: 'Remove MenACWY dose 1' }));

    expect(rowFor(2022)).toBeUndefined();
    expect(rowFor(2023).textContent).not.toMatch(CONFIRMED);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Tripwire. The fix above only holds while every dose row the app creates
// carries an id: doseAnswerKey() falls back to the row's POSITION for rows
// that don't have one, which is the exact bug G2 removed. That fallback is
// deliberate — the logic fixtures across this suite pass plain {date, brand}
// objects — but it means a new `{ date: '', brand: '' }` anywhere in the app
// would quietly reopen the hole. So the app is not allowed to write one.
// ─────────────────────────────────────────────────────────────────────────
describe('G2 tripwire: the app creates dose rows only through newDoseRow()', () => {
  it('has no bare dose-row literal in application source', () => {
    // process.cwd(), not import.meta.url: this file runs under happy-dom,
    // where import.meta.url is not a file: URL. Vitest runs from the repo root.
    const srcDir = join(process.cwd(), 'src') + '/';
    const offenders = [];

    function walk(dir) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
          walk(full);
          continue;
        }
        if (!/\.jsx?$/.test(entry.name)) continue;
        if (entry.name === 'doseIdentity.js') continue;
        const text = readFileSync(full, 'utf8');
        // A dose row is an object carrying both an empty date and an empty
        // brand — the shape every "add a dose" button used to produce.
        if (/\{\s*date:\s*''\s*,\s*brand:\s*''\s*\}/.test(text)) {
          offenders.push(full.slice(srcDir.length));
        }
      }
    }
    walk(srcDir);

    expect(
      offenders,
      `These files build a dose row by hand. A row with no id gets its `
        + `risk-at-dose answer keyed by list position again, which is the G2 bug. `
        + `Use newDoseRow() from src/logic/doseIdentity.js instead: `
        + offenders.join(', ')
    ).toEqual([]);
  });
});
