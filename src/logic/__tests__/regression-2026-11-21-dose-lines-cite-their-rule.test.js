// A "not counted" dose line cites the sentence its rule rests on (Phase 8,
// C11 "each number sits on the exact claim its document states"; owner,
// 2026-11-21, "Dose-line citations").
//
// WHY. Nine rules in doseRules.js printed their reason with no source mark,
// although each row's `sourcesSay.refs` names the sentence it rests on.
// Measured 2026-11-21: 6,177 not-counted dose lines on 5,470 of 42,301 test
// patients had no [c]. Example: "Minimum interval not met (3 weeks, 8 weeks
// required)." The Rulebook screen reads the same citations, so its rows showed
// a nearby sentence instead (docs/archive/report-2026-11-21-rulebook-sources-per-vaccine.md).
//
// This test holds:
//   1. Each of those rules, on a patient built to trigger it, prints one [c]
//      and cites the sentence for its own claim, a sentence its row lists.
//   2. Across every saved, record-problem and typical test patient, every
//      not-counted dose line carries a [c], except the cases named in
//      NO_SENTENCE_YET (no quoted sentence states that claim yet).
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { DOSE_RULES } from '../doseRules.js';
import { addDays, addCalendarMonths } from '../dateUtils.js';
import { buildSavedAnswerCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';

const TODAY = '2026-11-21';
const MV2 = 'Menveo 2-vial (MenACWY)';
const MV1 = 'Menveo 1-vial (≥10y) (MenACWY)';
const MQ = 'MenQuadfi (MenACWY)';
const BX = 'Bexsero (MenB)';
const TR = 'Trumenba (MenB)';

const at = (dob, months, days = 0) => addDays(addCalendarMonths(dob, months), days);
const dobAged = (months) => addCalendarMonths(TODAY, -months);
const ageOf = (dob) => {
  let m = 0;
  while (addCalendarMonths(dob, m + 1) <= TODAY) m += 1;
  return m;
};

/** The deciding rule and the line for the LAST dose given. */
function lastLine(vaccine, dob, doses, riskIds = []) {
  // "Was the patient high-risk on that date?" answered yes for every dose, so
  // an under-10 dose reaches the rule this case is about.
  const yes = Object.fromEntries(doses.map((_, i) => [i, 'yes']));
  const r = analyzeHistory(vaccine, doses, ageOf(dob), riskIds, TODAY, yes, dob);
  const i = r.perDose.length - 1;
  return { rule: r.decidedBy[i], line: r.perDose[i] };
}

const marks = (d) => (d.reasons ?? []).join(' ').split('[c]').length - 1;
const ruleRefs = (id) => DOSE_RULES.find((r) => r.id === id).sourcesSay.refs;

// [what, vaccine, dob, doses, riskIds, expected rule, expected sentence]
const Y = 12;
const d5 = dobAged(5);
const d9y = dobAged(9 * Y);
const d6m = dobAged(6);
const d4y = dobAged(4 * Y + 6);
const d20 = dobAged(20 * Y);
const d6y = dobAged(6 * Y);
const d30 = dobAged(30 * Y);
const d16 = dobAged(16 * Y);
const d19 = dobAged(19 * Y);
const CASES = [
  ['Menveo 2-vial at 4 weeks', 'MenACWY', d5, [{ date: at(d5, 0, 28), brand: MV2 }], ['asplenia'], 'ACWY-BELOW-MIN-AGE', 'cdcChildAcwyMinAge'],
  ['Menveo 1-vial at 8 years', 'MenACWY', d9y, [{ date: at(d9y, 8 * Y), brand: MV1 }], ['asplenia'], 'ACWY-BELOW-MIN-AGE', 'cdcChildMenveoLiquid10y'],
  ['MenQuadfi at 3 weeks', 'MenACWY', d5, [{ date: at(d5, 0, 21), brand: MQ }], ['asplenia'], 'ACWY-BELOW-MIN-AGE', 'waDohMenQuadfiAapAlignment'],
  ['Menveo 1-vial, no date, patient 9', 'MenACWY', d9y, [{ date: '', brand: MV1 }], ['asplenia'], 'ACWY-UNDATED-BELOW-MIN-AGE', 'cdcChildMenveoLiquid10y'],
  ['Infant series, dose 2 three weeks after dose 1', 'MenACWY', d6m, [{ date: at(d6m, 2), brand: MV2 }, { date: at(d6m, 2, 21), brand: MV2 }], ['asplenia'], 'ACWY-INFANT-SERIES-GAP', 'cdcChildAcwyInfantSeries'],
  ['High risk from 2 years, dose 2 three weeks after dose 1', 'MenACWY', d4y, [{ date: at(d4y, 4 * Y), brand: MV2 }, { date: at(d4y, 4 * Y, 21), brand: MV2 }], ['asplenia'], 'ACWY-HIGHRISK-PRIMARY-GAP', 'acip2020Acwy8WeekMinimum'],
  ['High risk, series at 15, booster 2 years later (5 required)', 'MenACWY', d20, [{ date: at(d20, 15 * Y), brand: MV2 }, { date: at(d20, 15 * Y + 3), brand: MV2 }, { date: at(d20, 17 * Y), brand: MV2 }], ['asplenia'], 'ACWY-HIGHRISK-BOOSTER-GAP', 'boosterAtOrAfterAge7'],
  ['High risk, series at 3, booster 1 year later (3 required)', 'MenACWY', d6y, [{ date: at(d6y, 3 * Y), brand: MV2 }, { date: at(d6y, 3 * Y + 3), brand: MV2 }, { date: at(d6y, 4 * Y + 3), brand: MV2 }], ['asplenia'], 'ACWY-HIGHRISK-BOOSTER-GAP', 'boosterBeforeAge7'],
  ['Travel, booster 1 year after the dose', 'MenACWY', d30, [{ date: at(d30, 28 * Y), brand: MV2 }, { date: at(d30, 29 * Y), brand: MV2 }], ['travel'], 'ACWY-TRAVEL-BOOSTER-GAP', 'acip2020Table9TravelBooster'],
  ['Lab work, booster 1 year after the dose', 'MenACWY', d30, [{ date: at(d30, 28 * Y), brand: MV2 }, { date: at(d30, 29 * Y), brand: MV2 }], ['microbiologist'], 'ACWY-TRAVEL-BOOSTER-GAP', 'acip2020Table7MicrobiologistBooster'],
  ['A/C/W/Y outbreak, booster 1 year after the dose', 'MenACWY', d30, [{ date: at(d30, 28 * Y), brand: MV2 }, { date: at(d30, 29 * Y), brand: MV2 }], ['outbreak_acwy'], 'ACWY-TRAVEL-BOOSTER-GAP', 'boosterAtOrAfterAge7'],
  ['Military recruit, booster 1 year after the 16+ dose', 'MenACWY', d19, [{ date: at(d19, 11 * Y), brand: MV2 }, { date: at(d19, 17 * Y), brand: MV2 }, { date: at(d19, 18 * Y), brand: MV2 }], ['military'], 'ACWY-TRAVEL-BOOSTER-GAP', 'acip2020MilitaryBooster5Years'],
  ['MenB, Trumenba after Bexsero', 'MenB', d16, [{ date: at(d16, 15 * Y), brand: BX }, { date: at(d16, 15 * Y + 2), brand: TR }], ['asplenia'], 'MENB-WRONG-FAMILY', 'acip2020MenbNotInterchangeable'],
  ['MenB high risk, dose 2 two weeks after dose 1', 'MenB', d16, [{ date: at(d16, 15 * Y), brand: BX }, { date: at(d16, 15 * Y, 14), brand: BX }], ['asplenia'], 'MENB-HIGHRISK-DOSE-2-GAP', 'acip2020MenbRepeat4Weeks'],
  ['MenB high risk, first booster 6 months after the series', 'MenB', d20, [{ date: at(d20, 17 * Y), brand: BX }, { date: at(d20, 17 * Y + 2), brand: BX }, { date: at(d20, 17 * Y + 6), brand: BX }, { date: at(d20, 18 * Y), brand: BX }], ['asplenia'], 'MENB-HIGHRISK-BOOSTER-GAP', 'acip2020MenbBoosterCadence'],
  ['MenB high risk, second booster 1 year after the first', 'MenB', d20, [{ date: at(d20, 16 * Y), brand: BX }, { date: at(d20, 16 * Y + 2), brand: BX }, { date: at(d20, 16 * Y + 6), brand: BX }, { date: at(d20, 17 * Y + 6), brand: BX }, { date: at(d20, 18 * Y + 6), brand: BX }], ['asplenia'], 'MENB-HIGHRISK-BOOSTER-GAP', 'acip2020MenbBoosterCadence'],
  ['Healthy MenB, rescue dose 3 two months after an early dose 2', 'MenB', d19, [{ date: at(d19, 17 * Y), brand: BX }, { date: at(d19, 17 * Y + 2), brand: BX }, { date: at(d19, 17 * Y + 4), brand: BX }], [], 'MENB-HEALTHY-RESCUE-DOSE-3-GAP', 'menbRescueDoseRule'],
];

describe('a not-counted dose line cites its own rule\'s sentence', () => {
  it.each(CASES)('%s', (what, vaccine, dob, doses, riskIds, ruleId, key) => {
    const { rule, line } = lastLine(vaccine, dob, doses, riskIds);
    expect(rule, what).toBe(ruleId);
    expect(line.status).toBe('invalid');
    expect(marks(line), line.reasons.join(' | ')).toBe(1);
    expect(line.reasonCites?.map((c) => c.key)).toEqual([key]);
    expect(ruleRefs(ruleId), `${ruleId} lists ${key}`).toContain(key);
  });
});

// Not-counted lines whose claim no quoted sentence in refs.js states yet.
// Each is named, so a new one fails the sweep instead of passing quietly.
const NO_SENTENCE_YET = [
  // Menactra (9 months) and the pentavalents (10 years) recorded under MenACWY:
  // no MenACWY minimum-age sentence for them is quoted; the unknown-brand
  // 2 months is the owner's C13 decision, not a sentence.
  /^Minimum age not met \(.*for (Menactra|Penbraya|Penmenvy|an unknown brand)\)\.$/,
];

describe('every not-counted dose line on every test patient carries a source mark', () => {
  it('none is left without one, except the claims no sentence states yet', () => {
    const cases = [...buildSavedAnswerCases(), ...buildRecordProblemCases(), ...buildTypicalCases()];
    const missing = new Map();
    let lines = 0;
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const v of ['MenACWY', 'MenB']) {
        for (const d of out.history?.[v]?.perDose ?? []) {
          if (d.status !== 'invalid' || d.recordProblem) continue;
          lines += 1;
          if (marks(d) > 0) continue;
          const first = String(d.reasons?.[0] ?? '');
          if (NO_SENTENCE_YET.some((re) => re.test(first))) continue;
          const shape = `${v}: ${first.replace(/\d+/g, 'N')}`;
          missing.set(shape, (missing.get(shape) ?? 0) + 1);
        }
      }
    }
    expect(lines).toBeGreaterThan(10000);
    expect(Object.fromEntries(missing)).toEqual({});
  });
});
