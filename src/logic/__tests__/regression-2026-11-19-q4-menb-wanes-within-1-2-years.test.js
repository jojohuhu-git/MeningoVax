// Q4 (owner, rulebook mockup questions, 2026-11-19: "Change it to 'within
// 1–2 years'"). A healthy patient's MenB dose given before 16 is set aside,
// and its "Why this" said protection "wanes within about a year". The sources
// say 1–2 years: ACIP Oct 2024 (mm7349a3, read live 2026-11-19), "antibody
// waning within 1–2 years after completion of the primary series"; ACIP 2020
// (refs `acip2020MenbShortProtection`), "antibody waning within 1–2 years
// postcompletion of the primary series".
import { describe, it, expect } from 'vitest';
import { validateHistory } from '../validate.js';
import { MENB_WANES_BEFORE_16_WHY } from '../doseRules.js';
import { CITATIONS as REFS } from '../../data/refs.js';

const TODAY = '2026-11-19';

describe('Q4: a healthy MenB dose before 16 says protection wanes within 1–2 years', () => {
  it('healthy, born 2015-03-01, Bexsero at 10 years: set aside, "Why this" says 1–2 years', () => {
    const [d] = validateHistory('MenB', [{ date: '2025-06-01', brand: 'Bexsero (MenB)' }], 140, [], TODAY, undefined, '2015-03-01');
    expect(d.whys).toContain('MenB antibody protection wanes within 1–2 years, so a dose before 16 does not count without a high-risk indication.');
    // extinct: the old "about a year" wording was replaced on purpose (Q4).
    expect(d.whys.join(' ')).not.toContain('about a year');
  });

  it('the number matches the quoted source', () => {
    expect(MENB_WANES_BEFORE_16_WHY).toContain('within 1–2 years');
    expect(REFS.acip2020MenbShortProtection.quote).toContain('within 1–2 years');
  });

  it('control: a high-risk 10-year-old\'s Bexsero dose counts, with no "wanes" line', () => {
    const [d] = validateHistory('MenB', [{ date: '2025-06-01', brand: 'Bexsero (MenB)' }], 140, ['asplenia'], TODAY, undefined, '2015-03-01');
    expect((d.whys ?? []).join(' ')).not.toContain('wanes');
  });
});
