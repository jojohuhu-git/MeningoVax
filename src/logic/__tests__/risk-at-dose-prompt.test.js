// ─────────────────────────────────────────────────────────────────────────
// risk-at-dose-prompt.test.js
//
// Tests for the risk-at-dose "Needs input" prompt (2026-07-23 handoff §2-§3).
//
// The app only records CURRENT risk status, not when a risk factor started or
// ended. For a high-risk-NOW patient with a dose given before the routine
// adolescent age threshold (10y MenACWY, 16y MenB), whether that dose counted
// toward the high-risk series depends on the patient's risk status ON THAT
// DATE -- which isn't recorded. The validator now returns a 'pending' status
// (not a silent assumption) until the provider answers.
//
// Only DATED doses are prompted -- you can't ask "at risk on what date?"
// without a date.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { validateHistory, analyzeHistory } from '../validate.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-07-23';
function monthsAgo(m) { return addDays(TODAY, -Math.round(m * 30.4375)); }

describe('MenACWY risk-at-dose prompt', () => {
  it('high-risk-now + dated dose before age 10 + no answer → pending', () => {
    const results = validateHistory('MenACWY',
      [{ date: monthsAgo(96), brand: 'Menveo (MenACWY)' }], // ageAtDose ≈ 2y
      120, ['asplenia'], TODAY);
    expect(results[0].status).toBe('pending');
    expect(results[0].needsInput).toBe(true);
    expect(results[0].effectiveDoseNum).toBeNull();
    expect(results[0].promptDate).toBe(monthsAgo(96));
  });

  it('answered "yes" → counts toward the high-risk series (interval-checked normally)', () => {
    const results = validateHistory('MenACWY',
      [{ date: monthsAgo(96), brand: 'Menveo (MenACWY)' }],
      120, ['asplenia'], TODAY, { 0: 'yes' });
    expect(results[0].status).toBe('valid');
    expect(results[0].effectiveDoseNum).toBe(1);
    expect(results[0].notAdolescentCount).toBeFalsy();
  });

  it('answered "no" → off-window, does not count', () => {
    const results = validateHistory('MenACWY',
      [{ date: monthsAgo(96), brand: 'Menveo (MenACWY)' }],
      120, ['asplenia'], TODAY, { 0: 'no' });
    expect(results[0].status).toBe('valid');
    expect(results[0].notAdolescentCount).toBe(true);
    expect(results[0].effectiveDoseNum).toBeNull();
  });

  it('answered "unsure" → treated conservatively as off-window, does not count', () => {
    const results = validateHistory('MenACWY',
      [{ date: monthsAgo(96), brand: 'Menveo (MenACWY)' }],
      120, ['asplenia'], TODAY, { 0: 'unsure' });
    expect(results[0].status).toBe('valid');
    expect(results[0].notAdolescentCount).toBe(true);
    expect(results[0].effectiveDoseNum).toBeNull();
  });

  it('healthy-now patient: no prompt -- always off-window regardless of answer map', () => {
    const results = validateHistory('MenACWY',
      [{ date: monthsAgo(96), brand: 'Menveo (MenACWY)' }],
      120, [], TODAY); // no riskIds -> not high-risk-now
    expect(results[0].status).toBe('valid');
    expect(results[0].notAdolescentCount).toBe(true);
    expect(results[0].status).not.toBe('pending');
  });

  it('undated dose for a high-risk-now patient before age 10: no prompt (only dated doses ask)', () => {
    const results = validateHistory('MenACWY',
      [{ date: '', brand: '' }],
      96, ['asplenia'], TODAY); // currently 8y, undated dose
    expect(results[0].status).not.toBe('pending');
  });

  it('stress test: asplenia acquired AFTER an old ambiguous dose still gets prompted (permanence ≠ past presence)', () => {
    // Splenectomy at 13 makes the patient high-risk-NOW, but an age-8 dose
    // predates the splenectomy. Permanent-going-forward does not mean the
    // risk was present at the time of an earlier dose -- the prompt must
    // still fire so the provider can say the risk was NOT present then.
    const doseAtAge8 = monthsAgo((18 - 8) * 12); // patient now 18y (216mo)
    const results = validateHistory('MenACWY',
      [{ date: doseAtAge8, brand: 'Menveo (MenACWY)' }],
      216, ['asplenia'], TODAY);
    expect(results[0].status).toBe('pending');
  });
});

describe('MenB risk-at-dose prompt', () => {
  it('high-risk-now + dated dose before age 16 + no answer → pending', () => {
    const perDose = analyzeHistory('MenB',
      [{ date: monthsAgo(72), brand: 'Bexsero (MenB)' }], // ageAtDose ≈ 12y (patient now 18y)
      216, ['asplenia'], TODAY).perDose;
    expect(perDose[0].status).toBe('pending');
    expect(perDose[0].needsInput).toBe(true);
    expect(perDose[0].effectiveDoseNum).toBeNull();
  });

  it('answered "yes" → counts toward the high-risk MenB series', () => {
    const perDose = analyzeHistory('MenB',
      [{ date: monthsAgo(72), brand: 'Bexsero (MenB)' }],
      216, ['asplenia'], TODAY, { 0: 'yes' }).perDose;
    expect(perDose[0].status).toBe('valid');
    expect(perDose[0].effectiveDoseNum).toBe(1);
  });

  it('answered "no" → off-window, does not count toward the high-risk series', () => {
    const perDose = analyzeHistory('MenB',
      [{ date: monthsAgo(72), brand: 'Bexsero (MenB)' }],
      216, ['asplenia'], TODAY, { 0: 'no' }).perDose;
    expect(perDose[0].status).toBe('valid');
    expect(perDose[0].notAdolescentCount).toBe(true);
    expect(perDose[0].effectiveDoseNum).toBeNull();
  });

  it('healthy-now patient: no prompt -- always off-window (unchanged P0-1 behavior)', () => {
    const perDose = analyzeHistory('MenB',
      [{ date: monthsAgo(72), brand: 'Bexsero (MenB)' }],
      216, [], TODAY).perDose;
    expect(perDose[0].status).not.toBe('pending');
    expect(perDose[0].notAdolescentCount).toBe(true);
  });
});
