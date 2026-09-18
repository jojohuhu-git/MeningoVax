// U2 (2026-09-17): the booster cadence was printed twice on the same card.
//
// A card has a dedicated booster line (`boosterSummary`, rendered by
// RecCard.jsx as ".booster-summary-line") whose entire job is to state how many
// future boosters there are and how often. Several notes said the same thing
// again, a few lines below, in slightly different words. One fact, two
// sentences, one card.
//
// Worse than verbose: on the infant OUTBREAK cards the note promised "a first
// booster in 3 years ... then every 5 years while at risk" and then, in the very
// next sentence, said "There is no standing booster schedule for an outbreak
// indication". The card contradicted itself, and the promise was the wrong half
// (ACIP Table 8 gives outbreak contacts a re-exposure top-up, not a countdown).
//
// These are invariants, not spot checks, so a new card cannot quietly
// reintroduce the duplication.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { TEST_TODAY } from '../../test-today.js';
import { noteText } from '../../test-note-text.js';

const yes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
function run({ ageMonths, riskIds = [], menacwyDoses = [], menbDoses = [] }) {
  return recommend({
    today: TEST_TODAY, ageMonths, riskIds, menacwyDoses, menbDoses,
    riskAtDoseAnswers: { MenACWY: yes(menacwyDoses.length), MenB: yes(menbDoses.length) },
  });
}

// Dates written back from TEST_TODAY so fixtures cannot rot (L2-1).
const monthsAgo = (m) => {
  const d = new Date(`${TEST_TODAY}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - m);
  return d.toISOString().slice(0, 10);
};
const acwyDose = (monthsBack, ageMonthsNow) => ({ date: monthsAgo(monthsBack), ageMonths: ageMonthsNow - monthsBack });

// A spread wide enough to reach every card that carries a booster line.
const PATIENTS = [
  ['infant 4mo, asplenia, no doses', { ageMonths: 4, riskIds: ['asplenia'] }],
  ['infant 4mo, asplenia, 1 dose', { ageMonths: 4, riskIds: ['asplenia'], menacwyDoses: [acwyDose(2, 4)] }],
  ['infant 8mo, asplenia, no doses', { ageMonths: 8, riskIds: ['asplenia'] }],
  ['infant 8mo, ACWY outbreak, no doses', { ageMonths: 8, riskIds: ['outbreak_acwy'] }],
  ['infant 8mo, travel, no doses', { ageMonths: 8, riskIds: ['travel'] }],
  ['child 14mo, asplenia, no doses', { ageMonths: 14, riskIds: ['asplenia'] }],
  ['child 14mo, asplenia, 2 infant doses', { ageMonths: 14, riskIds: ['asplenia'], menacwyDoses: [acwyDose(10, 14), acwyDose(1, 14)] }],
  ['child 5y, asplenia, no doses', { ageMonths: 60, riskIds: ['asplenia'] }],
  ['child 5y, asplenia, 1 dose', { ageMonths: 60, riskIds: ['asplenia'], menacwyDoses: [acwyDose(3, 60)] }],
  ['child 5y, asplenia, 2 doses (boosters now)', { ageMonths: 60, riskIds: ['asplenia'], menacwyDoses: [acwyDose(50, 60), acwyDose(47, 60)] }],
  ['adult 30y, travel, no doses', { ageMonths: 360, riskIds: ['travel'] }],
  ['adult 30y, microbiologist, 1 dose', { ageMonths: 360, riskIds: ['microbiologist'], menacwyDoses: [acwyDose(72, 360)] }],
  ['child 10y, routine, 1 dose', { ageMonths: 126, riskIds: [], menacwyDoses: [acwyDose(2, 126)] }],
  ['adolescent 11y, routine, no doses', { ageMonths: 132, riskIds: [] }],
  ['adolescent 13y, routine, 1 dose', { ageMonths: 156, riskIds: [], menacwyDoses: [acwyDose(24, 156)] }],
  ['adolescent 15y, asplenia, MenB dose 1', { ageMonths: 180, riskIds: ['asplenia'], menbDoses: [acwyDose(2, 180)] }],
  ['adolescent 15y, asplenia, MenB doses 1+2', { ageMonths: 180, riskIds: ['asplenia'], menbDoses: [acwyDose(8, 180), acwyDose(6, 180)] }],
  ['adolescent 15y, asplenia, MenB full series', { ageMonths: 180, riskIds: ['asplenia'], menbDoses: [acwyDose(24, 180), acwyDose(22, 180), acwyDose(18, 180)] }],
  ['adolescent 17y, healthy, MenB dose 1', { ageMonths: 204, riskIds: [], menbDoses: [acwyDose(2, 204)] }],
];

const allCards = (r) => [...(r.menacwy || []), ...(r.menb || [])];

// The ongoing-cadence phrase. The booster line always carries it ("every 5
// years while at risk", "every 2-3 years while at risk"); a note that carries
// it too is the duplicate this item removes.
const ONGOING_CADENCE = /every \d+(?:[–\-]\d+)? (?:years|yrs)/i;

describe('U2 · the booster cadence is stated once per card', () => {
  for (const [name, patient] of PATIENTS) {
    it(`${name}: no note repeats the ongoing cadence its booster line already gives`, () => {
      for (const card of allCards(run(patient))) {
        if (!card.boosterSummary || !noteText(card)) continue;
        expect(
          noteText(card),
          `"${card.doseLabel}" states the ongoing booster cadence twice:\n` +
          `  booster line: ${card.boosterSummary}\n  note:         ${noteText(card)}`,
        ).not.toMatch(ONGOING_CADENCE);
      }
    });
  }

  it('the routine adolescent cards name the age-16 booster once, not three times', () => {
    for (const [name, patient] of PATIENTS) {
      for (const card of allCards(run(patient))) {
        if (!/at age 16/i.test(card.boosterSummary || '') || !noteText(card)) continue;
        expect(noteText(card), `${name} — "${card.doseLabel}" repeats the age-16 booster in its note`)
          .not.toMatch(/\b(?:at|by|follows at|due at)\s+(?:age\s+)?16\b/i);
      }
    }
  });
});

describe('U2 · an outbreak card does not promise a booster schedule it then denies', () => {
  // ACIP 2020 MMWR 69(RR-9) Table 8 gives outbreak contacts a single top-up
  // only on re-identification at risk in a NEW outbreak -- not the standing
  // 3-then-5-year countdown that travel and medical risk get.
  const OUTBREAK_AGES = [4, 8, 14, 60];
  for (const ageMonths of OUTBREAK_AGES) {
    it(`${ageMonths}-month-old in an ACWY outbreak`, () => {
      for (const card of allCards(run({ ageMonths, riskIds: ['outbreak_acwy'] }))) {
        if (!noteText(card) || !/no standing booster schedule/i.test(noteText(card))) continue;
        expect(noteText(card), `"${card.doseLabel}" promises a booster countdown and then denies it exists`)
          .not.toMatch(/first booster in \d+ year|booster in \d+ years|every \d+ years while at risk/i);
      }
    });
  }
});
