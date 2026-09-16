// P1-2 (fix queue 2026-09-15) — the originally reported bug.
//
// DOB 2018-09-15 (8 years old), asplenia, MenACWY on 2018-11-15, 2019-01-15,
// 2019-03-15, 2019-09-15 and 2022-09-15, all five confirmed high-risk at the
// prompt. The recorded-dose list read:
//
//   PRIMARY SERIES
//     D1 · Nov 15, 2018 · age 9 weeks     Dose 1 of 2
//     D2 · Jan 15, 2019 · age 4 months    Dose 2 of 2
//   BOOSTERS
//     D3 · Mar 15, 2019 · age 6 months    Booster
//     D4 · Sep 15, 2019 · age 12 months   Booster
//     D5 · Sep 15, 2022 · age 4 years     Booster
//
// D1-D4 ARE the primary series: dose 1 at 2 months means four doses, at 2, 4, 6
// and 12 months. Only D5 is a booster — and it is the first one, given exactly
// three years after the series completed, which is exactly when it was due.
//
// Cause. RecCard's doseRowsWithGroups() groups on `rec.primaryTotal`, and every
// >=2y high-risk rec carried primaryTotal = seriesTotal = 2, while validate.js
// computed 4 for the same patient. The engine and the validator disagreed about
// one question, which is the precise failure mode seriesTotals.js exists to
// prevent. P0-1 fixed the number; this file pins the agreement down directly so
// the two cannot drift apart again silently.
//
// Source (fetched live 2026-09-15). CDC child & adolescent immunization
// schedule notes, "Meningococcal serogroup A,C,W,Y vaccination", special
// situations, Menveo: "Dose 1 at age 2 months: 4-dose series (additional 3
// doses at age 4, 6, and 12 months)".

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { menacwySeriesInfo, menacwyPrimaryTotal } from '../seriesTotals.js';
import { doseRowsWithGroups } from '../../components/RecCard.jsx';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

const REPORTED = {
  ageMonths: 96,
  riskIds: ['asplenia'],
  dates: ['2018-11-15', '2019-01-15', '2019-03-15', '2019-09-15', '2022-09-15'],
};

function both({ ageMonths, riskIds, dates }) {
  const doses = dates.map((d) => ({ date: d }));
  const answers = allYes(doses.length);
  const rec = recommend({
    today: TODAY, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [],
    riskAtDoseAnswers: { MenACWY: answers },
  }).menacwy[0];
  const perDose = analyzeHistory('MenACWY', doses, ageMonths, riskIds, TODAY, answers).perDose;
  return { doses, rec, perDose };
}

describe('P1-2: the reported patient', () => {
  const { doses, rec, perDose } = both(REPORTED);

  it('the engine says the primary series is 4 doses long', () => {
    expect(rec.primaryTotal).toBe(4);
  });

  it('all five doses count, numbered 1 to 5', () => {
    expect(perDose.map((d) => d.status)).toEqual(['valid', 'valid', 'valid', 'valid', 'valid']);
    expect(perDose.map((d) => d.effectiveDoseNum)).toEqual([1, 2, 3, 4, 5]);
  });

  it('none of the five is flagged as an extra dose', () => {
    expect(perDose.some((d) => d.extraDose)).toBe(false);
  });

  it('the headings split after D4, not after D2', () => {
    const rows = doseRowsWithGroups(doses, perDose, rec.primaryTotal);
    const shape = rows.map((r) => (r.kind === 'group' ? r.label : `D${r.index + 1}`));
    expect(shape).toEqual([
      'Primary series', 'D1', 'D2', 'D3', 'D4',
      'Boosters', 'D5',
    ]);
  });

  it('the dose given at age 4 was the first booster, given on time', () => {
    // Series completed 2019-09-15; first booster due three years later.
    expect(rec.doseLabel).toMatch(/every 5 years/i);
    expect(rec.earliestNextDate).toBe('2027-09-15');
  });
});

describe('P1-2: the engine and the validator agree on the primary total', () => {
  // One table, both modules, several shapes of patient. If a future change
  // makes either side answer differently, this fails before anyone sees a
  // mislabelled dose list.
  const patients = [
    ['infant start, mid-series, now 2', { ageMonths: 24, riskIds: ['asplenia'], dates: ['2024-11-15', '2025-01-15'] }, 4],
    ['infant start, complete, now 8', REPORTED, 4],
    ['7-23-month start, now 4', { ageMonths: 48, riskIds: ['asplenia'], dates: ['2023-09-15', '2023-12-15'] }, 2],
    ['started at 2 years, now 5', { ageMonths: 60, riskIds: ['asplenia'], dates: ['2023-09-15', '2023-11-30'] }, 2],
    ['infant travel start, now 3', { ageMonths: 36, riskIds: ['travel'], dates: ['2023-11-15', '2024-01-15'] }, 4],
    ['infant outbreak start, now 3', { ageMonths: 36, riskIds: ['outbreak_acwy'], dates: ['2023-11-15', '2024-01-15'] }, 4],
  ];

  it.each(patients)('%s', (_name, patient, expected) => {
    const { rec, doses } = both(patient);
    const d1AgeM = patient.ageMonths - Math.round(
      (new Date(TODAY) - new Date(patient.dates[0])) / (1000 * 60 * 60 * 24 * 30.4375),
    );
    const info = menacwySeriesInfo({
      riskClass: patient.riskIds.includes('asplenia') ? 'primary2'
        : patient.riskIds.includes('travel') ? 'single+boost' : 'single',
      am: patient.ageMonths, doses, today: TODAY, infantSeries: true,
    });
    expect(rec.primaryTotal).toBe(expected);
    expect(info.primaryTotal).toBe(expected);
    expect(menacwyPrimaryTotal({
      riskClass: patient.riskIds.includes('asplenia') ? 'primary2'
        : patient.riskIds.includes('travel') ? 'single+boost' : 'single',
      d1AgeM, infantSeries: true,
    })).toBe(expected);
  });
});
