// @vitest-environment happy-dom
/**
 * Owner, 2026-11-21 ("Keep two, fix key"): the label "Not counted — given
 * before age 16" marks two different doses — a healthy patient's MenB dose
 * before 16 AND a routine MenACWY booster before 16 (worked patient
 * boosterAt15: MenACWY at 11 and again at 15). The Rulebook's label key only
 * explained the MenB one. The key now has one row per vaccine, the way
 * "before age 10" has its own MenACWY row. No label and no answer changes.
 *
 * Wording is the owner-approved preview. The row's Source is the worked
 * patient's own card citation (ACIP: "a booster dose administered at age 16
 * years"); "or older" is how the engine acts (due from the 16th birthday).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import Rulebook from '../Rulebook.jsx';
import { CHIP_LEGEND, WORKED_PATIENTS, sourcesFor } from '../../data/rulebookPage.js';

const LABEL = 'Not counted — given before age 16';
const ACWY_TEXT = 'Routine MenACWY booster before 16 years. The booster is given at 16 years or older.';
const MENB_TEXT = 'Healthy MenB before 16 years. The series starts at 16 years or older.';

describe('label key: "given before age 16" is explained for both vaccines', () => {
  const rows = CHIP_LEGEND.filter((c) => c.chip === LABEL);

  it('has one row per vaccine, MenACWY first (as the preview showed)', () => {
    expect(rows.map((r) => r.text)).toEqual([ACWY_TEXT, MENB_TEXT]);
  });

  // The engine guard (regression-2026-11-19-rulebook-screen-matches-the-engine)
  // runs every worked patient and checks its `expect.chip` against the real
  // dose label, so pinning the patient and its chip check here is enough.
  it('the MenACWY row\'s patient gets the label on a MenACWY dose', () => {
    expect(rows[0].ex[0]).toBe(WORKED_PATIENTS.boosterAt15);
    expect(rows[0].ex[0].expect.chip).toEqual(['MenACWY', 1, LABEL]);
  });

  it('the MenACWY row\'s Source quotes the age-16 booster sentence', () => {
    const keys = sourcesFor(rows[0].ex).map((q) => q.key);
    expect(keys).toContain('acwyRoutine1112and16');
  });

  it('both rows show on the screen, with no duplicate-key warning', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Rulebook />);
    fireEvent.click(screen.getByText('Doses on the record'));
    expect(screen.getAllByText(LABEL)).toHaveLength(2);
    expect(screen.getByText((_, el) => el?.classList?.contains('rb-small') && el.textContent.startsWith(ACWY_TEXT))).toBeTruthy();
    expect(screen.getByText((_, el) => el?.classList?.contains('rb-small') && el.textContent.startsWith(MENB_TEXT))).toBeTruthy();
    expect(err.mock.calls.filter((c) => String(c[0]).includes('same key'))).toEqual([]);
    err.mockRestore();
  });
});
