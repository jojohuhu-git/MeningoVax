// G4 (2026-09-16): the record panel's "this dose does not count" verdicts now
// carry the ACIP sentence they rest on.
//
// The gap: refs.js has held the verbatim ACIP sentence for the pre-age-10 rule
// (`acwyBeforeAge10`) since July, cited only in a code comment. The rule is
// implemented and correct; the clinician just never saw the source. The L2-3
// tripwire found it sitting unreferenced and parked it on a KNOWN_UNCITED list.
//
// Scope (owner decision 2026-09-16): only verdicts that DISCOUNT a recorded
// dose because of the patient's AGE. Those are the verdicts a clinician gets
// argued with about ("but she HAD a meningitis shot"), and each rests on one
// named ACIP sentence. Interval violations ("given too soon — repeat this
// dose") are a separate family, sourced per schedule table, and are NOT wired
// here.
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { CITATIONS } from '../../data/refs.js';

const TODAY = '2026-09-16';

// Each case: a patient whose record contains one dose the app sets aside on
// age grounds, and the citation key that verdict must carry.
const CASES = [
  {
    name: 'MenACWY given before age 10, healthy patient',
    vaccine: 'MenACWY',
    doses: [{ date: '2019-06-01' }], // ~4y9m at dose
    ageMonths: 144, riskIds: [], answers: {},
    expectKey: 'acwyBeforeAge10',
  },
  {
    name: 'MenACWY before age 10, high-risk now but not then',
    vaccine: 'MenACWY',
    doses: [{ date: '2019-06-01' }],
    ageMonths: 144, riskIds: ['asplenia'], answers: { 0: 'no' },
    expectKey: 'acwyBeforeAge10',
  },
  {
    name: 'MenACWY dose 2 given before the age-16 booster window',
    vaccine: 'MenACWY',
    doses: [{ date: '2023-06-01' }, { date: '2024-06-01' }], // ages ~11 and ~12
    ageMonths: 168, riskIds: [], answers: {},
    doseIndex: 1,
    expectKey: 'acwyRoutine1112and16',
  },
  {
    name: 'MenB given before age 16, healthy patient',
    vaccine: 'MenB',
    doses: [{ date: '2024-06-01' }], // ~13y at dose
    ageMonths: 180, riskIds: [], answers: {},
    expectKey: 'menbHealthyPreferredAge1618',
  },
  {
    name: 'MenB undated, patient still under 16 today',
    vaccine: 'MenB',
    doses: [{ detailsUnknown: true }], // K1: the "dose given, details unknown" tick
    ageMonths: 168, riskIds: [], answers: {},
    expectKey: 'menbHealthyPreferredAge1618',
  },
  {
    name: 'MenB before age 16, high-risk now but not then',
    vaccine: 'MenB',
    doses: [{ date: '2024-06-01' }],
    ageMonths: 180, riskIds: ['asplenia'], answers: { 0: 'unsure' },
    expectKey: 'menbHealthyPreferredAge1618',
  },
  {
    name: 'MenB given below the licensed minimum age',
    vaccine: 'MenB',
    doses: [{ date: '2023-06-01', brand: 'Bexsero (MenB)' }], // ~8y at dose
    ageMonths: 144, riskIds: ['asplenia'], answers: { 0: 'yes' },
    expectKey: 'menbLicensedAge1025',
  },
  {
    name: 'MenB undated, patient currently below the licensed minimum age',
    vaccine: 'MenB',
    doses: [{ brand: 'Bexsero (MenB)' }],
    ageMonths: 96, riskIds: ['asplenia'], answers: { 0: 'yes' },
    expectKey: 'menbLicensedAge1025',
  },
];

describe('G4: age-based "does not count" verdicts carry their source', () => {
  for (const c of CASES) {
    it(`${c.name} cites ${c.expectKey}`, () => {
      const { perDose } = analyzeHistory(
        c.vaccine, c.doses, c.ageMonths, c.riskIds, TODAY, c.answers,
      );
      const d = perDose[c.doseIndex ?? 0];

      // It really is a discounting verdict, not an ordinary counted dose.
      expect(d.notAdolescentCount || d.doesNotCount, `${c.name}: expected a discounting verdict, got ${JSON.stringify(d)}`).toBe(true);

      const markers = d.reasons.join(' ').split('[c]').length - 1;
      expect(markers, `${c.name}: reason text carries no [c] marker`).toBeGreaterThan(0);
      expect(d.reasonCites?.length, `${c.name}: [c] markers and citations must match 1:1`).toBe(markers);
      expect(d.reasonCites.map((x) => x.key)).toContain(c.expectKey);
      for (const cite of d.reasonCites) {
        expect(cite.url, `${c.name}: citation ${cite.key} has no link`).toBeTruthy();
        expect(CITATIONS[cite.key], `${c.name}: citation ${cite.key} is not in refs.js`).toBeTruthy();
      }
    });
  }
});

describe('G4: verdicts that are NOT age-based discounting stay uncited', () => {
  it('an ordinary counted dose carries no citation machinery', () => {
    const { perDose } = analyzeHistory('MenACWY', [{ date: '2024-06-01' }], 180, [], TODAY, {});
    const d = perDose[0];
    expect(d.reasons.join(' ')).not.toContain('[c]');
    expect(d.reasonCites ?? []).toEqual([]);
  });
});
