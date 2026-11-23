// C5 (port Phase 8, 2026-11-22) — every quoted source says which patients its
// sentence was written about, and a card may not show a quote to anyone else.
//
// Ported from PneumoVax's `regression-2026-10-17-every-quote-names-its-patient`.
// The owner's fear, stated there: "a right-sounding quote written about a
// different patient". The field records who the sentence is ABOUT (owner,
// PneumoVax 2026-10-17; carried over by Q12, 2026-11-21).
//
// SOURCES, read live 2026-11-22 in the browser (ACIP 2020, rr6909a1.htm, every
// table's rows and footnotes; CDC Child/Adolescent Notes with the closed
// sections included, via textContent). What this guard first caught, each the
// right timing quoted from the wrong table:
//
//   asplenia   boosterBeforeAge7 / boosterAtOrAfterAge7. Their words are in
//              Tables 4 (complement), 6 (HIV) and 9 (travel). Table 5
//              (asplenia) words the same 3 and 5 years differently, so an
//              asplenia patient now quotes Table 5.
//   outbreak   the same two sentences. Table 8 (outbreak) says "Single dose if
//              >=3 yrs since vaccination" / ">=5 yrs": the same 3 and 5 years,
//              so an outbreak patient now quotes Table 8.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS, POPULATIONS, cite } from '../../data/refs.js';
import { patientGroups } from '../../data/riskFactors.js';
import { buildSavedAnswerCases } from '../../test-grid.js';

const quotedKeys = Object.keys(CITATIONS).filter((k) => CITATIONS[k].quote);

// Walk the whole engine result, not just the card lists, so a citation in a
// recorded dose's verdict, the age-doubt note or the combined-shot card is
// swept too.
function collectCites(node, found = []) {
  if (node == null || typeof node !== 'object') return found;
  if (Array.isArray(node)) { for (const v of node) collectCites(v, found); return found; }
  if (typeof node.key === 'string' && CITATIONS[node.key]) found.push(node);
  for (const v of Object.values(node)) collectCites(v, found);
  return found;
}

describe('the field itself', () => {
  it('every quoted source names the patients its sentence is about', () => {
    const missing = quotedKeys.filter((k) => !Array.isArray(CITATIONS[k].population) || CITATIONS[k].population.length === 0);
    expect(missing).toEqual([]);
  });

  it('every named group is one of the fifteen', () => {
    const bad = [];
    for (const k of quotedKeys) for (const p of CITATIONS[k].population) if (!POPULATIONS.includes(p)) bad.push(`${k} → ${p}`);
    expect(bad).toEqual([]);
  });

  it('a quote-free source names none: a document has no patient', () => {
    const wrong = Object.keys(CITATIONS).filter((k) => !CITATIONS[k].quote && CITATIONS[k].population);
    expect(wrong).toEqual([]);
  });

  it('the asplenia and outbreak twins quote their own tables', () => {
    expect(CITATIONS.boosterBeforeAge7Asplenia.quote).toBe('Aged <7 yrs: Single dose at 3 yrs after vaccination and every 5 yrs thereafter');
    expect(CITATIONS.boosterAtOrAfterAge7Asplenia.quote).toBe('Aged ≥7 yrs: Single dose at 5 yrs and every 5 yrs thereafter');
    expect(CITATIONS.boosterBeforeAge7Outbreak.quote).toBe('Aged <7 yrs: Single dose if ≥3 yrs since vaccination');
    expect(CITATIONS.boosterAtOrAfterAge7Outbreak.quote).toBe('Aged ≥7 yrs: Single dose if ≥5 yrs since vaccination');
    expect(CITATIONS.boosterBeforeAge7Asplenia.population).toEqual(['acwy-asplenia']);
    expect(CITATIONS.boosterAtOrAfterAge7Asplenia.population).toEqual(['acwy-asplenia']);
    expect(CITATIONS.boosterBeforeAge7Outbreak.population).toEqual(['acwy-outbreak']);
    expect(CITATIONS.boosterAtOrAfterAge7Outbreak.population).toEqual(['acwy-outbreak']);
    // The shared rows are NOT about asplenia or an outbreak: Table 5 and
    // Table 8 do not print them.
    for (const k of ['boosterBeforeAge7', 'boosterAtOrAfterAge7']) {
      expect(CITATIONS[k].population).not.toContain('acwy-asplenia');
      expect(CITATIONS[k].population).not.toContain('acwy-outbreak');
    }
  });
});

describe('patientGroups', () => {
  it('names the engine\'s own splits', () => {
    expect(patientGroups([])).toEqual(['acwy-routine', 'menb-healthy']);
    expect(patientGroups(['asplenia'])).toEqual(['acwy-asplenia', 'menb-asplenia']);
    expect(patientGroups(['hiv'])).toEqual(['acwy-hiv', 'menb-healthy']);
    expect(patientGroups(['travel'])).toEqual(['acwy-routine', 'acwy-travel', 'menb-healthy']);
    expect(patientGroups(['outbreak_b', 'pregnancy'])).toEqual(['acwy-routine', 'menb-outbreak', 'menb-pregnancy']);
  });
});

describe('the guard, swept over every saved-answer patient', () => {
  const cases = buildSavedAnswerCases();
  const offenders = new Map();
  const declared = new Map();
  let shown = 0;
  for (const c of cases) {
    const out = recommend(c.input);
    if (out.excluded) continue;
    const groups = patientGroups(c.input.riskIds);
    for (const cit of collectCites(out)) {
      const ref = CITATIONS[cit.key];
      if (!ref.quote) continue;
      shown++;
      if (cit.aboutAnotherGroup) {
        expect(typeof cit.aboutAnotherGroup, cit.key).toBe('string');
        expect(cit.aboutAnotherGroup.length, cit.key).toBeGreaterThan(20);
        declared.set(cit.key, (declared.get(cit.key) ?? 0) + 1);
        continue;
      }
      if (ref.population.some((p) => groups.includes(p))) continue;
      const id = `${cit.key} → ${groups.join('+')}`;
      offenders.set(id, (offenders.get(id) ?? 0) + 1);
    }
  }

  it('sweeps a real number of quotes', () => {
    expect(shown).toBeGreaterThan(50000);
  });

  it('no card shows a quote to a patient it was not written about, except the case the owner ruled impossible', () => {
    expect([...offenders.entries()].map(([k, n]) => `${k} (${n})`).sort()).toEqual(IMPOSSIBLE_PER_OWNER);
  });

  it('every cross-reference is declared, with a reason, at exactly these keys', () => {
    // A new one fails here until it is listed, so the exceptions stay countable.
    expect([...declared.keys()].sort()).toEqual(DECLARED_KEYS);
  });
});

// Each is a boundary, a negation, or a rule the owner extended past its source.
// The reason is written at the call site.
//   acip2020Acwy8WeekMinimum           ACIP's 8 weeks is for the high-risk 2-dose
//                                      series; owner C11 (2026-11-15) made it the
//                                      floor between any two MenACWY doses
//   acip2020MenbRiskGroups             a healthy child under 10: the high-risk
//                                      list says what they do not have
//   menbBoosterIfRemainOrBecomeAtRisk  a healthy completed series: "no booster
//                                      unless a high-risk indication develops"
const DECLARED_KEYS = [
  'acip2020Acwy8WeekMinimum',
  'acip2020MenbRiskGroups',
  'menbBoosterIfRemainOrBecomeAtRisk',
].sort();

// A microbiologist whose series ended before 7: ACIP Table 7 has only a
// ">=10 yrs" row, and the card follows owner E1 (2026-11-21, "Same as 10+": the
// first booster 5 years after dose 1). The recorded-dose check still uses the
// 3-year under-7 floor and quotes the under-7 row of Tables 4, 6 and 9.
// ANSWERED 2026-11-22, owner: "a microbiologist who is 7 years is impossible".
// No realistic patient reaches it, so nothing is changed; the cases stay
// listed (with their counts) so a NEW one, or a realistic one, still fails.
// Every saved patient here has MenACWY at about 4.5 years and is checked
// "microbiologist" at 10 or 11, or younger (the age-implausible banner).
// Tier 1 Q4 (2026-11-22) added the pregnancy + microbiologist pair: the same
// case, a third row.
const IMPOSSIBLE_PER_OWNER = [
  'boosterBeforeAge7 → acwy-routine+acwy-microbiologist+menb-microbiologist (67)',
  'boosterBeforeAge7 → acwy-routine+acwy-microbiologist+menb-microbiologist+menb-pregnancy (67)',
  'boosterBeforeAge7 → acwy-routine+acwy-military+acwy-microbiologist+menb-microbiologist (67)',
];

describe('the guard bites', () => {
  it('an asplenia quote relabelled as another group\'s is caught on asplenia cards', () => {
    // Proof by breaking it: pretend Table 5's row is about HIV; asplenia
    // patients' cards must then fail the population check.
    const real = CITATIONS.boosterAtOrAfterAge7Asplenia.population;
    CITATIONS.boosterAtOrAfterAge7Asplenia.population = ['acwy-hiv'];
    try {
      let caught = 0;
      for (const c of buildSavedAnswerCases()) {
        if (c.input.riskIds.join('+') !== 'asplenia') continue;
        const out = recommend(c.input);
        const groups = patientGroups(c.input.riskIds);
        for (const cit of collectCites(out)) {
          if (cit.key !== 'boosterAtOrAfterAge7Asplenia') continue;
          if (!CITATIONS[cit.key].population.some((p) => groups.includes(p))) caught++;
        }
      }
      expect(caught).toBeGreaterThan(0);
    } finally {
      CITATIONS.boosterAtOrAfterAge7Asplenia.population = real;
    }
  });
});

describe('cite() carries the declaration', () => {
  it('a plain cite has no cross-reference flag', () => {
    expect(cite('boosterBeforeAge7').aboutAnotherGroup).toBeUndefined();
  });
  it('a marked cite carries the reason it was given', () => {
    expect(cite('boosterBeforeAge7', { aboutAnotherGroup: 'explains a boundary to another patient' }).aboutAnotherGroup).toMatch(/boundary/);
  });
});
