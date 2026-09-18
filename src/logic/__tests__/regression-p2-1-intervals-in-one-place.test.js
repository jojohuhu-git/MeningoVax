// P2-1 (fix queue 2026-09-17): intervals get the same treatment dose TOTALS got.
//
// seriesTotals.js exists because a series length was hand-typed in several
// places and they drifted apart. Intervals never got that module, and P0-1 is
// what it cost: the MenACWY infant primary gap was written as `DAYS.weeks(4)`
// in four places AND, separately, as the English words ">=4 weeks" inside the
// card sentence. Every one of them was wrong, and fixing only the constant
// would have left the sentence lying to the clinician.
//
// intervals.js is the sibling module. This file is its drift guard, and it
// tests two different things:
//
//   1. STRUCTURAL — the number is written down once. A source scan, because
//      the whole failure mode is a second copy somewhere else that happens to
//      agree today.
//   2. BEHAVIOURAL — the engine, the validator and the CARD SENTENCE all come
//      from that one number. The sentence matters as much as the constant: a
//      card that enforces 8 weeks while its own text says 4 misleads twice.
//
// Groups are migrated one at a time, suite green in between, and each group
// adds its constants to the scan below as it lands.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import {
  MENACWY_HIGHRISK_PRIMARY_GAP, weeksLabel, yearsLabel,
  MENACWY_FIRST_BOOSTER_YEARS_UNDER_7, MENACWY_FIRST_BOOSTER_YEARS_FROM_7,
  MENACWY_BOOSTER_CADENCE_YEARS,
  MENB_HIGHRISK_FIRST_BOOSTER_YEARS, MENB_HIGHRISK_BOOSTER_CADENCE_LABEL,
  MENB_HIGHRISK_D2_GAP, MENB_HIGHRISK_D3_MONTHS_FROM_D1,
  MENB_HIGHRISK_D3_MONTHS_FROM_D2, MENB_HEALTHY_D2_MONTHS,
  MENB_HEALTHY_RESCUE_MONTHS, monthsLabel,
} from '../intervals.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const acwy = (ageMonths, dates, riskIds) => recommend({
  today: TODAY, ageMonths, riskIds,
  menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(dates.length) },
}).menacwy[0];

const readSrc = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

// Strip comments before scanning: the comments in these files QUOTE the old
// hand-typed constants on purpose, explaining what went wrong and why the
// number moved. That history is worth keeping and is not a second copy.
function code(name) {
  return readSrc(name)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

// Each entry: the literal no file outside intervals.js may contain any more,
// and the export that owns it now.
const MIGRATED = [
  ['DAYS.weeks(8)', 'MENACWY_HIGHRISK_PRIMARY_GAP'],
  // Group 2 — booster cadences. The bare year counts moved too, so the
  // validator can no longer keep a 3 and a 5 of its own.
  ['DAYS.years(3)', 'MENACWY_FIRST_BOOSTER_YEARS_UNDER_7'],
  ['DAYS.years(5)', 'MENACWY_BOOSTER_CADENCE_YEARS'],
  ['DAYS.years(1)', 'MENB_HIGHRISK_FIRST_BOOSTER_YEARS'],
  ['DAYS.years(2)', 'MENB_HIGHRISK_BOOSTER_CADENCE_YEARS'],
  // Group 3 — the MenB month floors, and the 4-week floor for REPEATING an
  // invalid MenACWY dose (which is where P0-1's wrong number came from).
  ['DAYS.weeks(4)', 'MENB_HIGHRISK_D2_GAP / MENACWY_REPEAT_DOSE_FLOOR'],
  ['DAYS.months(4)', 'MENB_HIGHRISK_D3_MONTHS_FROM_D2'],
  ['DAYS.months(6)', 'MENB_HIGHRISK_D3_MONTHS_FROM_D1'],
  // The infant final-dose gap, which intervals.js has owned since P0-1 but two
  // cards were still typing out for themselves.
  ['DAYS.weeks(12)', 'MENACWY_INFANT_FINAL_GAP'],
];

describe('P2-1 · a migrated interval is written down once', () => {
  for (const file of ['recommend.js', 'validate.js']) {
    for (const [literal, owner] of MIGRATED) {
      it(`${file} does not hand-type ${literal} (${owner} owns it)`, () => {
        const hits = code(file).split(literal).length - 1;
        expect(
          hits,
          `${file} still writes ${literal} ${hits} time(s). Import ${owner} from `
          + 'intervals.js instead — a second copy is how P0-1 happened.',
        ).toBe(0);
      });
    }
  }
});

describe('P2-1 · the MenACWY >=2y high-risk primary gap', () => {
  // Dose 1 given 8 weeks ago exactly, to a 5-year-old with asplenia.
  const DOSE_1 = '2026-07-21'; // 56 days before TODAY
  const card = () => acwy(60, [DOSE_1], ['asplenia']);

  it('the card advertises the module\'s number', () => {
    expect(card().minIntervalDays).toBe(MENACWY_HIGHRISK_PRIMARY_GAP);
  });

  it('the card SENTENCE states that same number, not a restatement of it', () => {
    // The point of P2-1: if the constant ever changes, this sentence has to
    // change with it, because it is interpolated rather than typed out.
    expect(noteText(card())).toContain(weeksLabel(MENACWY_HIGHRISK_PRIMARY_GAP));
  });

  it('the validator enforces the same number the card advertises', () => {
    // A second dose exactly at the gap counts...
    const atGap = analyzeHistory(
      'MenACWY',
      [{ date: DOSE_1 }, { date: TODAY }],
      60, ['asplenia'], TODAY, allYes(2),
    ).perDose;
    expect(atGap[1].status).toBe('valid');

    // ...and one a clear week early (well past CDC's 4-day grace) does not.
    const tooSoon = analyzeHistory(
      'MenACWY',
      [{ date: DOSE_1 }, { date: '2026-09-08' }],
      60, ['asplenia'], TODAY, allYes(2),
    ).perDose;
    expect(tooSoon[1].status).not.toBe('valid');
  });
});

// ── Group 2 · booster cadences ───────────────────────────────────────────
//
// Four places decided how long until the next MenACWY booster (the >=2y
// high-risk branch, the travel/microbiologist branch, the infant branch and the
// outbreak top-up), each with its own `? 3 : 5`, and five more places spelled
// the answer out in English on the card. The numbers agreed; nothing made them.
describe('P2-1 · the MenACWY booster cadence', () => {
  // Primary series completed at age 5 (before 7) -> first booster at 3 years.
  const completedYoung = () => acwy(
    120, ['2021-09-15', '2021-11-15'], ['asplenia'],
  );
  // Primary completed at age 12 (from 7) -> first booster at 5 years.
  const completedOlder = () => acwy(
    204, ['2021-09-15', '2021-11-15'], ['asplenia'],
  );

  it('a series completed before age 7 puts the first booster at the module\'s short interval', () => {
    const card = completedYoung();
    expect(card.doseLabel).toContain(yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7));
    expect(noteText(card)).toContain(yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7));
  });

  it('a series completed at 7 or older puts it at the long one', () => {
    const card = completedOlder();
    expect(card.doseLabel).toContain(yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7));
    expect(noteText(card)).toContain(yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7));
  });

  it('the booster LINE on a primary card states all three intervals, interpolated', () => {
    // The line is the one place the cadence is stated (U2), so it is the one
    // place that must not drift from the constants. On a PRIMARY card it has
    // to cover both first-booster branches plus the ongoing cadence, because
    // the patient's completion age is not known yet.
    const line = acwy(60, [], ['asplenia']).boosterSummary;
    expect(line).toContain(yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7));
    expect(line).toContain(yearsLabel(MENACWY_FIRST_BOOSTER_YEARS_FROM_7));
    expect(line).toContain(yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS));
  });

  it('the booster LINE on a booster card states the ongoing cadence only', () => {
    // By now the first booster is behind them or being offered, so the line
    // states one number — still the module's.
    expect(completedYoung().boosterSummary)
      .toContain(`every ${yearsLabel(MENACWY_BOOSTER_CADENCE_YEARS)}`);
  });
});

describe('P2-1 · the MenB high-risk booster cadence', () => {
  const menb = (dates) => recommend({
    today: TODAY, ageMonths: 300, riskIds: ['asplenia'],
    menacwyDoses: [], menbDoses: dates.map((d) => ({ date: d })),
    riskAtDoseAnswers: { MenB: allYes(dates.length) },
  }).menb[0];

  it('the first booster comes at the module\'s interval, and the card says so', () => {
    const card = menb(['2022-01-15', '2022-03-15', '2022-07-15']);
    expect(card.doseLabel).toContain(yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS));
    expect(noteText(card)).toContain(yearsLabel(MENB_HIGHRISK_FIRST_BOOSTER_YEARS));
  });

  it('later boosters print the cadence label the module owns', () => {
    // "2-3 years" is a RANGE whose floor (2) is what the validator enforces.
    // Label and floor live side by side in intervals.js precisely so nobody
    // "tidies" the prose into the floor.
    const card = menb(['2020-01-15', '2020-03-15', '2020-07-15', '2021-07-15']);
    expect(card.doseLabel + ' ' + card.boosterSummary)
      .toContain(MENB_HIGHRISK_BOOSTER_CADENCE_LABEL);
  });
});

// ── Group 3 · the MenB month floors ──────────────────────────────────────
//
// Six month-counts, each written in the engine as a bare number passed to a
// calendar helper, again in validate.js as a named constant, again in
// seriesTotals.js for the rescue test, and once more in English on the card.
describe('P2-1 · the MenB high-risk series intervals', () => {
  const menb = (dates, ageMonths = 180) => recommend({
    today: TODAY, ageMonths, riskIds: ['asplenia'],
    menacwyDoses: [], menbDoses: dates.map((d) => ({ date: d })),
    riskAtDoseAnswers: { MenB: allYes(dates.length) },
  }).menb[0];

  it('dose 2 advertises the module\'s gap, and says it', () => {
    const card = menb(['2026-09-01']);
    expect(card.minIntervalDays).toBe(MENB_HIGHRISK_D2_GAP);
    expect(noteText(card)).toContain(weeksLabel(MENB_HIGHRISK_D2_GAP));
  });

  it('dose 3 states BOTH floors, each interpolated', () => {
    const card = menb(['2026-01-15', '2026-03-15']);
    expect(noteText(card)).toContain(monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D1));
    expect(noteText(card)).toContain(monthsLabel(MENB_HIGHRISK_D3_MONTHS_FROM_D2));
  });
});

describe('P2-1 · the healthy 2-dose MenB intervals', () => {
  const menb = (dates) => recommend({
    today: TODAY, ageMonths: 204, riskIds: [],
    menacwyDoses: [], menbDoses: dates.map((d) => ({ date: d })),
    riskAtDoseAnswers: { MenB: allYes(dates.length) },
  }).menb[0];

  it('dose 2 states the module\'s interval', () => {
    expect(noteText(menb(['2026-08-15']))).toContain(monthsLabel(MENB_HEALTHY_D2_MONTHS));
  });

  it('the rescue dose states the module\'s interval', () => {
    // Dose 2 given one month after dose 1 -> a third dose is owed.
    const card = menb(['2026-01-15', '2026-02-15']);
    expect(card.doseLabel).toContain('rescue');
    expect(noteText(card)).toContain(monthsLabel(MENB_HEALTHY_RESCUE_MONTHS));
  });
});
