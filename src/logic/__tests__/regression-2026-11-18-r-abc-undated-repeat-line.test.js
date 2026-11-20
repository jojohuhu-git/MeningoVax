// Port Phase 6.2 R-A / R-B / R-C (owner, STOP G1, 2026-11-18): a "Not counted —
// repeat" line under a card that prints NO date now says when.
//
// Found by the STOP G1 measurement (stop-g1-packet-2026-11-18.md §4): since
// F-4, a repeat line says "Repeat from <date>." when the card prints a date.
// Under a card that asks later with no date, the line said "repeat this dose
// only (do not restart the series)." and never when. Measured over the saved
// patients (real patients only): 574 lines in group A, 588 in B, 822 in C,
// 281 in D (pregnancy, left as it was).
//
// Sources, read live 2026-11-18 (quoted in the packet):
// - CDC Timing and Spacing (July 24, 2024): a too-young dose "should be
//   repeated on or after the date when the child reaches at least the
//   minimum age".
// - CDC child/adolescent notes (July 1, 2025): MenACWY "2-dose series at age
//   11–12 years; 16 years"; healthy MenB "age 16–23 years (preferred age
//   16–18 years)" by shared clinical decision-making.
// - ACIP 2020: "MenB vaccines are licensed in the United States only for
//   persons aged 10–25 years".
//
// Owner answers:
// - R-A (high-risk child, MenB too young): the line ends "Repeat at 10 years
//   or older, when the high-risk MenB series starts."
// - R-B (healthy baby, MenACWY too young): the line ends "Repeat at 11–12
//   years, with the routine dose."
// - R-C (healthy child, MenB too young): drop "repeat"; the line ends "MenB is
//   next offered at 16–23 years, by shared clinical decision-making."
// - R-C chip (owner, 2026-11-18, "Yes, do not repeat"): "Not counted — do not
//   repeat", the chip for a dose nobody is owed (Q10). Measured: 822 real
//   patients, chip words the only change. R-A and R-B keep "repeat".
// - R-C with a later shot (owner, 2026-11-18: "It depends — did the patient
//   need MenB or no", then "Yes, build it"): under the R-C card the patient
//   needs no MenB, so a too-young MenB dose reads the same even when another
//   MenB shot followed it: "do not repeat", the R-C ending, no "Repeated on".
//   Measured: 1,104 real patients, all 10–11 y with no risk factor or a
//   MenACWY-only one. A child who needs MenB (R-A) keeps "Repeated on".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const TODAY = '2026-11-18';
const REPEAT_THIS_DOSE = 'Do not restart.';   // P53 (review v10); // G1-a (owner, STOP G1, 2026-11-18): "repeat" is the label's word
const R_A = 'Repeat at 10 years or older, when the high-risk MenB series starts.';
const R_B = 'Repeat at 11–12 years, with the routine dose.';
const R_C = 'MenB is next offered at 16–23 years (shared clinical decision-making).';   // P61 (review v10)

const bex = (date) => ({ date, brand: 'Bexsero (MenB)' });
const quadfi = (date) => ({ date, brand: 'MenQuadfi (MenACWY)' });
const run = ({ dob, riskIds = [], acwy = [], b = [] }) =>
  recommend({ today: TODAY, dob, riskIds, menacwyDoses: acwy, menbDoses: b });
const anyWhen = (reasons) => reasons.some((x) => x === R_A || x === R_B || x === R_C || /^Repeat from /.test(x));

describe('R-A: high-risk child under 10, MenB given too young', () => {
  it('Maya, 2 y, complement deficiency, Bexsero at 12 months -> line ends with R-A', () => {
    const r = run({ dob: '2024-11-01', riskIds: ['complement'], b: [bex('2025-11-01')] });
    expect(r.menb[0].doseLabel).toBe('Not yet age-eligible');
    const d = r.history.MenB.perDose[0];
    expect(d.status).toBe('invalid');
    expect(d.reasons).toContain(REPEAT_THIS_DOSE);
    expect(d.reasons.at(-2)).toBe(R_A); // G1-a: the when comes first
    expect(doseChipLabel(d)).toBe('Not counted — repeat');
  });

  it('control: the same child at 11 has a dated card -> "Repeat from <today>", not R-A', () => {
    const r = run({ dob: '2015-11-01', riskIds: ['complement'], b: [bex('2025-01-01')] });
    const d = r.history.MenB.perDose[0];
    expect(d.status).toBe('invalid');
    expect(d.reasons.at(-2)).toBe('Repeat from Nov 18, 2026.'); // G1-a: the when comes first
    expect(d.reasons).not.toContain(R_A);
  });
});

describe('R-B: healthy baby, MenACWY given too young', () => {
  it('Noah, 2 months, MenQuadfi at 3 weeks (below the 6-week minimum) -> line ends with R-B', () => {
    const r = run({ dob: '2026-09-15', acwy: [quadfi('2026-10-06')] });
    expect(r.menacwy[0].doseLabel).toBe('Not yet due');
    const d = r.history.MenACWY.perDose[0];
    expect(d.status).toBe('invalid');
    expect(d.reasons).toContain(REPEAT_THIS_DOSE);
    expect(d.reasons.at(-2)).toBe(R_B); // G1-a: the when comes first
    expect(doseChipLabel(d)).toBe('Not counted — repeat');
  });

  it('control: an infant with asplenia (dated infant series) gets a date, not R-B', () => {
    const r = run({ dob: '2026-09-15', riskIds: ['asplenia'], acwy: [quadfi('2026-10-06')] });
    const d = r.history.MenACWY.perDose[0];
    expect(d.status).toBe('invalid');
    expect(d.reasons).not.toContain(R_B);
    expect(d.reasons.at(-2)).toMatch(/^Repeat from /); // G1-a: the when comes first
  });
});

describe('R-C: healthy child, MenB given too young', () => {
  it('Ava, healthy 10 y, Bexsero at 9 -> "repeat" sentence dropped, line ends with R-C', () => {
    const r = run({ dob: '2016-06-01', b: [bex('2025-09-01')] });
    expect(r.menb[0].doseLabel).toBe('Not routinely indicated');
    const d = r.history.MenB.perDose[0];
    expect(d.status).toBe('invalid');
    expect(d.reasons).not.toContain(REPEAT_THIS_DOSE);
    expect(d.reasons.some((x) => /\brepeat\b/i.test(x))).toBe(false);
    expect(d.reasons.at(-1)).toBe(R_C);
    // Why it did not count stays.
    expect(d.reasons[0]).toMatch(/^Minimum age not met \(10 years for/);
    // R-C chip (owner, 2026-11-18): nothing is owed, so "do not repeat".
    expect(d.notRepeated).toBe(true);
    expect(doseChipLabel(d)).toBe('Not counted — do not repeat');
  });

  it('control: healthy 17 y with Bexsero at 9 -> no R-C (the card from 16 is not the pre-16 card)', () => {
    const r = run({ dob: '2009-06-01', b: [bex('2018-09-01')] });
    const d = r.history.MenB.perDose[0];
    expect(d.status).toBe('invalid');
    expect(d.reasons).not.toContain(R_C);
  });
});

describe('R-C with a later MenB shot: the patient needs no MenB, so no dose is repeated', () => {
  it('healthy 10 y, Bexsero at 9 then Bexsero at 9 y 1 mo (both too young) -> both "do not repeat", both end with R-C', () => {
    const r = run({ dob: '2016-06-01', b: [bex('2025-09-01'), bex('2025-10-06')] });
    expect(r.menb[0].doseLabel).toBe('Not routinely indicated');
    for (const d of r.history.MenB.perDose) {
      expect(d.status).toBe('invalid');
      expect(d.notRepeated).toBe(true);
      expect(d.repeatedOn).toBeUndefined();
      expect(d.reasons.some((x) => /^Repeated on /.test(x))).toBe(false);
      expect(d.reasons).not.toContain(REPEAT_THIS_DOSE);
      expect(d.reasons.at(-1)).toBe(R_C);
      expect(doseChipLabel(d)).toBe('Not counted — do not repeat');
    }
  });

  it('healthy 11 y, Bexsero at 9 then Bexsero at 10 (set aside) -> the age-9 dose is "do not repeat", no "Repeated on"', () => {
    const r = run({ dob: '2015-06-01', b: [bex('2024-09-01'), bex('2025-09-01')] });
    const [first, second] = r.history.MenB.perDose;
    expect(first.status).toBe('invalid');
    expect(first.repeatedOn).toBeUndefined();
    expect(first.reasons.at(-1)).toBe(R_C);
    expect(doseChipLabel(first)).toBe('Not counted — do not repeat');
    // The age-10 shot keeps its own chip (set aside before 16), untouched.
    expect(doseChipLabel(second)).toBe('Not counted — given before age 16');
  });
});

describe('unchanged around R-A to R-C', () => {
  it('D: pregnancy (deferred) keeps the line as it was', () => {
    const r = run({ dob: '2014-01-01', riskIds: ['pregnancy'], b: [bex('2023-06-01')] });
    const d = r.history.MenB.perDose[0];
    expect(d.status).toBe('invalid');
    expect(d.reasons.at(-1)).toBe(REPEAT_THIS_DOSE);
    expect(anyWhen(d.reasons)).toBe(false);
  });

  it('F-4b still wins: a later shot on the record -> "Repeated on <date>. See that dose."', () => {
    const r = run({ dob: '2024-11-01', riskIds: ['complement'], b: [bex('2025-11-01'), bex('2026-01-01')] });
    const d = r.history.MenB.perDose[0];
    expect(d.reasons.at(-1)).toBe('Repeated on Jan 1, 2026. See that dose.');
    expect(d.reasons).not.toContain(R_A);
  });
});
