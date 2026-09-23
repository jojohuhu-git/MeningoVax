// P2-3 (the last item of the 2026-09-17 "finishing MeningoVax" plan): AGE
// thresholds get the same treatment dose totals and intervals already got.
//
// seriesTotals.js owns how many doses a series has. intervals.js owns the gap
// between two of them. ages.js — new here — owns the age at which a dose
// becomes due, counts, or stops being offered. It was the last group of
// numbers in the app still written down more than once:
//
//   16 years  — four copies (two in validate.js under different names, one in
//               seriesTotals.js, one in recommend.js's `M` map)
//   7 years   — three copies, one of them inside intervals.js itself
//   2 years   — seven copies across four files
//   10 years  — three copies, two of which restated brands.js's product table
//
// Like its P2-1 sibling this file tests two different things:
//
//   1. STRUCTURAL — the number is written down once. A source scan, because
//      the failure mode is a second copy that happens to agree today.
//   2. BEHAVIOURAL — the engine and the validator BOTH flip at the module's
//      number, expressed as arithmetic on the constant rather than as a date
//      or an age typed into the test. A test with its own copy of the number
//      does not merely miss a drift, it certifies it (see the dose-chip
//      wording, which disagreed with the app on 21% of 95,928 rows while
//      claiming to mirror it exactly).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { addDays } from '../dateUtils.js';
import {
  MENACWY_INFANT_SERIES_MAX_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS,
  MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS, MENACWY_ROUTINE_DOSE1_AGE_MONTHS,
  MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, MENACWY_CATCHUP_MIN_AGE_MONTHS,
  MENACWY_CATCHUP_MAX_AGE_MONTHS, MENACWY_BOOSTER_AGE_SPLIT_MONTHS,
  MENB_HEALTHY_MIN_AGE_MONTHS, MENB_HEALTHY_MAX_AGE_MONTHS, ageYears,
} from '../ages.js';
import {
  MENACWY_OUTBREAK_TOPUP_YEARS_UNDER_7, MENACWY_OUTBREAK_TOPUP_YEARS_FROM_7,
} from '../intervals.js';
import {
  MENB_MIN_AGE_MONTHS, PENTAVALENT_MIN_AGE_MONTHS,
  MENACWY_INFANT_SERIES_BRANDS, menacwyBrandLabelsForAge, MENACWY_BRANDS,
} from '../../data/brands.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';
const allYes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

const card = (ageMonths, riskIds = [], dates = []) => recommend({
  today: TODAY, ageMonths, riskIds,
  menacwyDoses: dates.map((d) => ({ date: d })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: allYes(dates.length) },
}).menacwy[0];

const menbCard = (ageMonths, riskIds = [], dates = []) => recommend({
  today: TODAY, ageMonths, riskIds,
  menacwyDoses: [], menbDoses: dates.map((d) => ({ date: d })),
  riskAtDoseAnswers: { MenB: allYes(dates.length) },
}).menb[0];

// ── 1 · structural ───────────────────────────────────────────────────────

const readSrc = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

// Comments are stripped before scanning: the comments in these files QUOTE the
// old hand-typed numbers on purpose, explaining what drifted and why it moved.
// That history is worth keeping and is not a second copy.
function code(name) {
  return readSrc(name)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

// Only the thresholds big enough to be unambiguous are scanned for. A bare 2,
// 7 or 12 is also a dose count, an array index and a month number, so scanning
// for those would cry wolf; they are covered behaviourally below instead.
const SCANNED = {
  24: 'MENACWY_INFANT_SERIES_MAX_AGE_MONTHS (ages.js)',
  84: 'MENACWY_BOOSTER_AGE_SPLIT_MONTHS (ages.js)',
  120: 'MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS (ages.js) / MENB_MIN_AGE_MONTHS (brands.js)',
  132: 'MENACWY_ROUTINE_DOSE1_AGE_MONTHS (ages.js)',
  192: 'MENACWY_ROUTINE_BOOSTER_AGE_MONTHS or MENB_HEALTHY_MIN_AGE_MONTHS (ages.js)',
  228: 'MENACWY_CATCHUP_MIN_AGE_MONTHS (ages.js)',
  264: 'MENACWY_CATCHUP_MAX_AGE_MONTHS (ages.js)',
  288: 'MENB_HEALTHY_MAX_AGE_MONTHS (ages.js)',
};

describe('P2-3 · a migrated age threshold is written down once', () => {
  for (const file of ['recommend.js', 'validate.js', 'seriesTotals.js', 'intervals.js']) {
    for (const [literal, owner] of Object.entries(SCANNED)) {
      it(`${file} does not hand-type ${literal} months (${owner} owns it)`, () => {
        const src = code(file);
        const compared = src.match(
          new RegExp(`(?:<|>|<=|>=|===|!==|==|!=|=)\\s*${literal}\\b`, 'g'),
        ) || [];
        const mirrored = src.match(new RegExp(`\\b${literal}\\s*(?:<|>|<=|>=)`, 'g')) || [];
        expect(
          [...compared, ...mirrored],
          `${file} compares against or assigns ${literal} directly. Import it from `
          + `${owner} instead — a second copy is how the 4-weeks-should-be-8 fault happened.`,
        ).toEqual([]);
      });
    }
  }

  it('ages.js imports nothing, so it can never be part of an import cycle', () => {
    // The reason these live in their own module rather than in intervals.js:
    // intervals.js imports seriesTotals.js, and seriesTotals.js needs the ages.
    // A cycle between two modules that both compute constants at load time
    // fails depending on which file loads first.
    expect(readSrc('ages.js')).not.toMatch(/^\s*import\s/m);
  });
});

// ── 2 · behavioural · MenACWY ────────────────────────────────────────────

describe('P2-3 · the infant series door is the module\'s second birthday', () => {
  const dayBefore = MENACWY_INFANT_SERIES_MAX_AGE_MONTHS - 0.1;
  const onIt = MENACWY_INFANT_SERIES_MAX_AGE_MONTHS;

  it('just under it, an at-risk child is on the early-childhood series', () => {
    // The card names the band it is on: "high-risk 12-23mo".
    expect(card(dayBefore, ['asplenia']).doseLabel)
      .toContain(`${MENACWY_INFANT_SERIES_MAX_AGE_MONTHS - 1}mo`);
  });

  it('on it, the same child is on the ≥2y primary series instead', () => {
    expect(card(onIt, ['asplenia']).doseLabel)
      .not.toContain(`${MENACWY_INFANT_SERIES_MAX_AGE_MONTHS - 1}mo`);
  });

  it('a series BEGUN below the door keeps its infant length years later', () => {
    // P0-1 of the 2026-09-15 queue: the engine tested today's age while the
    // validator tested the age at dose 1, so on the second birthday the two
    // gave the same child different series lengths. Both now read one door.
    const ageNow = 36;
    const startedAt = (ageAtD1) => card(
      ageNow, ['asplenia'], [addDays(TODAY, -Math.round((ageNow - ageAtD1) * 30.4375))],
    ).seriesTotal;
    expect(startedAt(4)).toBeGreaterThan(2);   // begun as an infant
    expect(startedAt(MENACWY_INFANT_SERIES_MAX_AGE_MONTHS + 1)).toBe(2); // begun after
  });
});

describe('P2-3 · the late-infant band starts at the module\'s age', () => {
  // CDC: "Dose 1 at age 7-23 months: 2-dose series". Below that band the
  // series is longer.
  const inBand = MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS + 1;
  const belowBand = MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS - 1;
  const ageNow = 36;
  const seriesTotalFor = (d1AgeM) => card(
    ageNow, ['asplenia'], [addDays(TODAY, -Math.round((ageNow - d1AgeM) * 30.4375))],
  ).seriesTotal;

  it('a start inside the band is the short (2-dose) infant series', () => {
    expect(seriesTotalFor(inBand)).toBe(2);
  });

  it('a start below the band is longer', () => {
    expect(seriesTotalFor(belowBand)).toBeGreaterThan(2);
  });
});

describe('P2-3 · the routine adolescent ages', () => {
  it('dose 1 is not offered the day before the module\'s age, and is on it', () => {
    expect(card(MENACWY_ROUTINE_DOSE1_AGE_MONTHS - 0.1).status).toBe('not-indicated');
    expect(card(MENACWY_ROUTINE_DOSE1_AGE_MONTHS).status).toBe('due');
  });

  it('the booster-due card names the module\'s booster age, interpolated', () => {
    const c = card(MENACWY_ROUTINE_DOSE1_AGE_MONTHS + 12, [], [TODAY]);
    expect(c.doseLabel).toContain(String(ageYears(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS)));
  });

  it('a dose at the module\'s booster age closes the series; one before it still owes a booster', () => {
    const at16 = card(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS + 1, [], [TODAY]);
    const before16 = card(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS - 6, [], [TODAY]);
    expect(at16.doseLabel).not.toContain('Booster due');
    expect(before16.doseLabel).toContain('Booster due');
  });

  it('the validator NUMBERS a dose from the counts-from age, and refuses to before it', () => {
    // "Does not count" is not the same as "invalid": the dose was validly
    // given, it just does not number toward the adolescent series.
    const numbered = (ageMonths) => analyzeHistory(
      'MenACWY', [{ date: TODAY }], ageMonths, [], TODAY, allYes(1),
    ).perDose[0];

    const early = numbered(MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS - 1);
    expect(early.notAdolescentCount).toBe(true);
    expect(early.effectiveDoseNum).toBeNull();

    const onTime = numbered(MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS);
    expect(onTime.notAdolescentCount).toBeFalsy();
    expect(onTime.effectiveDoseNum).toBe(1);
  });

  it('the catch-up band runs from the module\'s lower age to its upper one', () => {
    const inBand = card(MENACWY_CATCHUP_MIN_AGE_MONTHS);
    const pastIt = card(MENACWY_CATCHUP_MAX_AGE_MONTHS);
    expect(inBand.status).toBe('catchup');
    expect(pastIt.status).toBe('not-indicated');
  });
});

describe('P2-3 · the booster-interval age split', () => {
  // The outbreak top-up sentence states the split age. It must interpolate it,
  // not spell it out: "under age seven" is the form no search for 84 finds.
  const outbreakCard = (am, yearsAgo) => card(
    am, ['outbreak_acwy'], [addDays(TODAY, -365 * yearsAgo)],
  );

  it('a patient under the split age tops up on the short interval, and the card says so', () => {
    const c = outbreakCard(MENACWY_BOOSTER_AGE_SPLIT_MONTHS - 6, 4);
    expect(c.status).toBe('exposure');
    expect(noteText(c)).toContain(`age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)}`);
    expect(noteText(c)).toContain(`${MENACWY_OUTBREAK_TOPUP_YEARS_UNDER_7} years`);
  });

  it('a patient at or over it needs the long one before a top-up', () => {
    // Four years on is enough below the split age and not enough above it —
    // the same record, judged by the one age this module owns.
    const younger = outbreakCard(MENACWY_BOOSTER_AGE_SPLIT_MONTHS - 6, 4);
    const older = outbreakCard(MENACWY_BOOSTER_AGE_SPLIT_MONTHS + 6, 4);
    expect(younger.status).toBe('exposure');
    expect(older.status).not.toBe('exposure');
    expect(noteText(older)).toContain(`age ${ageYears(MENACWY_BOOSTER_AGE_SPLIT_MONTHS)}`);
    expect(noteText(older)).toContain(`${MENACWY_OUTBREAK_TOPUP_YEARS_FROM_7} years`);
  });
});

// ── 3 · behavioural · MenB ───────────────────────────────────────────────

describe('P2-3 · the MenB ages', () => {
  it('below the product floor nothing is due, and the card states the floor', () => {
    const c = menbCard(MENB_MIN_AGE_MONTHS - 1, ['asplenia']);
    expect(c.status).toBe('not-indicated');
    expect(`${c.note.lead} ${c.note.detail}`)
      .toContain(`age ${ageYears(MENB_MIN_AGE_MONTHS)}`);
  });

  it('on the product floor an at-risk patient starts the series', () => {
    expect(menbCard(MENB_MIN_AGE_MONTHS, ['asplenia']).status).toBe('risk-based');
  });

  it('the healthy shared-decision band is exactly the module\'s two ages', () => {
    expect(menbCard(MENB_HEALTHY_MIN_AGE_MONTHS - 0.1).status).toBe('not-indicated');
    expect(menbCard(MENB_HEALTHY_MIN_AGE_MONTHS).status).toBe('shared-decision');
    expect(menbCard(MENB_HEALTHY_MAX_AGE_MONTHS - 0.1).status).toBe('shared-decision');
    expect(menbCard(MENB_HEALTHY_MAX_AGE_MONTHS).status).toBe('not-indicated');
  });

  it('the validator counts a healthy dose from the same age the engine offers it', () => {
    const at = (ageMonths) => analyzeHistory(
      'MenB', [{ date: TODAY }], ageMonths, [], TODAY, allYes(1),
    ).perDose[0];

    // Validly given — it clears the product floor — but not counted, and the
    // reason says so in the same words the card uses.
    const early = at(MENB_HEALTHY_MIN_AGE_MONTHS - 1);
    expect(early.effectiveDoseNum).toBeNull();
    expect(early.reasons.join(' '))
      .toContain(`before age ${ageYears(MENB_HEALTHY_MIN_AGE_MONTHS)}`);

    const onTime = at(MENB_HEALTHY_MIN_AGE_MONTHS);
    expect(onTime.effectiveDoseNum).toBe(1);
    expect(onTime.reasons).toEqual([]);
  });
});

// ── 4 · product floors belong to the product table ───────────────────────

describe('P2-3 · brand availability is derived from the product table', () => {
  it('every offered brand is licensed at the age it is offered at', () => {
    // M2 (2026-09-22): MenQuadfi's floor is minAgeDays, not minAgeM — compare
    // in whichever unit the brand states its own floor, same as the
    // production code does (menacwyBrandLabelsForAge itself).
    const byLabel = Object.fromEntries(MENACWY_BRANDS.map((b) => [b.label, b]));
    for (let am = 0; am <= 1200; am += 1) {
      for (const label of menacwyBrandLabelsForAge(am)) {
        const b = byLabel[label];
        if (b.minAgeDays != null) {
          expect(am * 30.4375, `${label} offered at ${am} months`)
            .toBeGreaterThanOrEqual(b.minAgeDays);
        } else {
          expect(am, `${label} offered at ${am} months`)
            .toBeGreaterThanOrEqual(b.minAgeM);
        }
      }
    }
  });

  it('the oldest patients are still offered every brand', () => {
    // `maxAgeM: 999` is the table's "no upper limit" sentinel, not a cap at 83
    // years. Read as a real bound it silently empties the brand list for the
    // oldest patients — which is what the first draft of this helper did.
    const oldest = menacwyBrandLabelsForAge(100 * 12);
    const adult = menacwyBrandLabelsForAge(30 * 12);
    expect(oldest).toEqual(adult);
    expect(oldest.length).toBeGreaterThan(0);
  });

  it('discontinued products are never offered for a dose to be given now', () => {
    const discontinued = MENACWY_BRANDS.filter((b) => !b.active).map((b) => b.label);
    for (const am of [12, 60, 144, 300]) {
      for (const label of menacwyBrandLabelsForAge(am)) {
        expect(discontinued).not.toContain(label);
      }
    }
  });

  it('the infant series offers every brand licensed anywhere in the infant band', () => {
    // M2 (2026-09-22): this used to assert MENACWY_INFANT_SERIES_BRANDS
    // equalled "whatever is licensed at the single youngest floor" — which
    // silently drops Menveo the moment a second product (MenQuadfi, 6 weeks)
    // has a younger floor than Menveo's 2 months. Both are now genuinely
    // licensed within the infant band, so both must be offered.
    expect(MENACWY_INFANT_SERIES_BRANDS).toEqual([
      'Menveo 2-vial (MenACWY)', 'MenQuadfi (MenACWY)',
    ]);
  });

  it('the pentavalent offer starts at the pentavalent product floor', () => {
    const at = (am) => recommend({
      today: TODAY, ageMonths: am, riskIds: ['asplenia'],
      menacwyDoses: [], menbDoses: [], riskAtDoseAnswers: {},
    }).pentavalent;
    expect(at(PENTAVALENT_MIN_AGE_MONTHS - 1).eligible).toBe(false);
    expect(at(PENTAVALENT_MIN_AGE_MONTHS).eligible).toBe(true);
  });
});
