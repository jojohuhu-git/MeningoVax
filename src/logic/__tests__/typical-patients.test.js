// Port Phase 1.3 (2026-11-15): the typical-patient list is what it says.
//
// `buildTypicalCases()` in src/test-grid.js builds ordinary, on-time records
// (MenACWY at 11 and 16, the infant high-risk series, a healthy MenB series)
// that the saved-answer grid cannot express. The whole-app checks (Phase 1.4)
// run on them. This file checks only the LIST — that it is built from real
// records and still reaches what it is for — not what the app answers. What
// the app answers is the checks' job.
import { describe, it, expect } from 'vitest';
import {
  buildTypicalCases,
  TYPICAL_AGES_MONTHS,
  TYPICAL_MENACWY_HISTORIES,
  TYPICAL_MENB_HISTORIES,
  SWEEPABLE_RISK_FACTORS,
} from '../../test-grid.js';
import { ALL_BRANDS } from '../../data/brands.js';
import { recommend } from '../recommend.js';

const cases = buildTypicalCases();

describe('typical patients: the list', () => {
  it('is built, and no two patients share a key', () => {
    expect(cases.length).toBeGreaterThan(5000);
    expect(new Set(cases.map((c) => c.key)).size).toBe(cases.length);
  });

  it('every dose falls between birth and today', () => {
    const bad = cases.filter(({ input }) => (
      [...input.menacwyDoses, ...input.menbDoses].some((d) => d.date < input.dob || d.date > input.today)
    ));
    expect(bad.map((c) => c.key)).toEqual([]);
  });

  it('has every birthday from 10 through 23', () => {
    for (let y = 10; y <= 23; y++) expect(TYPICAL_AGES_MONTHS).toContain(y * 12);
  });

  it('has every risk factor the engine can be asked about, each on its own', () => {
    const ticked = new Set(cases.flatMap((c) => c.input.riskIds));
    expect(SWEEPABLE_RISK_FACTORS.map((r) => r.id).filter((id) => !ticked.has(id))).toEqual([]);
  });

  it('records every brand in the app somewhere, and the "Unknown brand" option', () => {
    const recorded = new Set([...TYPICAL_MENACWY_HISTORIES, ...TYPICAL_MENB_HISTORIES].flat().map(([b]) => b));
    expect(ALL_BRANDS.map((b) => b.key).filter((k) => !recorded.has(k))).toEqual([]);
    expect(recorded.has('')).toBe(true);
  });

  it('a patient the app asks about also appears answered, and the answers settle every question', () => {
    const answered = cases.filter((c) => c.key.startsWith('ty'));
    expect(answered.length).toBeGreaterThan(100);
    const stillAsking = answered.filter(({ input }) => {
      const h = recommend(input).history;
      return [...h.MenACWY.perDose, ...h.MenB.perDose].some((d) => d.needsInput);
    });
    expect(stillAsking.map((c) => c.key)).toEqual([]);
    // Each answered patient is a copy of one in its first-seen form.
    const keys = new Set(cases.map((c) => c.key));
    expect(answered.filter((c) => !keys.has(c.key.replace(/^ty/, 't')))).toEqual([]);
  });

  it('includes the records the saved-answer grid cannot build', () => {
    const has = (k) => cases.some((c) => c.key === k);
    // A 17-year-old who had MenACWY at 11 and 16.
    expect(has('t204|r:|A:MenQuadfi@132m,MenQuadfi@192m|B:')).toBe(true);
    // A 5-year-old with asplenia who finished the infant series, answered.
    expect(has('ty60|r:asplenia|A:Menveo 2-vial@2m,Menveo 2-vial@4m,Menveo 2-vial@6m,Menveo 2-vial@12m|B:')).toBe(true);
    // A healthy 2-dose MenB series at 16.
    expect(has('t216|r:|A:MenQuadfi@132m,MenQuadfi@192m|B:Bexsero@192m,Bexsero@198m')).toBe(true);
  });
});
