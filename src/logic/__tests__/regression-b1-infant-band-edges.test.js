// B1 — the infant MenACWY age bands now split where CDC splits them.
//
// Found 2026-09-17 while working the queue in
// docs/archive/handoff-2026-09-18-calendar-and-impossible-queues-six-items.md,
// which recorded the first of the three symptoms below. Pre-existing: verified
// byte-identical against the code before PR #38.
//
// CDC child & adolescent schedule notes, "Meningococcal serogroup A,C,W,Y
// vaccination", Special situations, Menveo (fetched live 2026-09-17 from
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html):
//
//   "Dose 1 at age 3-6 months: 3- or 4- dose series (dose 2 [and dose 3 if
//    applicable] at least 8 weeks after previous dose until a dose is received
//    at age 7 months or older, followed by an additional dose at least 12 weeks
//    later and after age 12 months)"
//   "Dose 1 at age 7-23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"
//
// CDC states those bands in COMPLETED months, and it does not split 7-23
// anywhere. So a baby of 6 months and 2 weeks is in the 3-6 band, and one of 11
// months and 2 weeks is in the 7-23 band.
//
// The code asked `am <= 6` and `am <= 11` instead, which are only the same
// question for a whole number of months. Every patient with a fractional age
// between two bands fell through a crack:
//
//   Symptom 1 (a card contradicting itself). At 6.5 months the heading read
//   "Dose 1 of 4 (infant high-risk 7-11mo)" directly above a note reading
//   "Start the 2-dose Menveo series ... need two doses, not the four a younger
//   infant needs". The total came from the helper (which splits at 7 and was
//   right); the wording came from the `am <= 6` branch (which was wrong).
//
//   Symptom 2 (an extra injection). A baby whose dose 1 was at 6.5 months and
//   dose 2 at 8 months was told the series needs FOUR doses. Starting two weeks
//   earlier needs three, two weeks later needs two. This is the CDC "3- or
//   4-dose" shortcut, and the shortcut was being withheld from the very babies
//   the band covers.
//
//   Symptom 3 (a claim that is not true). An 11.5-month-old was given the
//   12-23-month card, which drops the "after age 12 months" condition on dose 2
//   and says instead "Both fall after the first birthday, so the 12-month age
//   floor ... is already met." Dose 1 is due today, five weeks before that
//   birthday.
//
// The fix is the one recommend.js's own comments ask for after F1 and M5: the
// band edges come from the shared constants in ages.js, not from a literal
// typed at each site.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { menacwyInfantHighRiskTotal } from '../seriesTotals.js';
import {
  MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS,
  MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS,
  MENACWY_INFANT_FINAL_MIN_AGE_MONTHS,
} from '../ages.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';

const card = (ageMonths, doses = []) => recommend({
  today: TODAY, ageMonths, riskIds: ['asplenia'],
  menacwyDoses: doses.map((date) => ({ date })), menbDoses: [],
  riskAtDoseAnswers: { MenACWY: Object.fromEntries(doses.map((_, i) => [i, 'yes'])) },
}).menacwy[0];

// The ages the bands actually turn on, read from the constants so a future
// change to a band moves these tests with it.
const JUST_UNDER_LATE = MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS - 0.5;   // 6.5
const JUST_UNDER_FINAL = MENACWY_INFANT_FINAL_MIN_AGE_MONTHS - 0.5;       // 11.5

describe('symptom 1 · the card at 6 months and 2 weeks', () => {
  it('does not print one dose total in the heading and a different one in the note', () => {
    const c = card(JUST_UNDER_LATE);
    const total = c.seriesTotal;
    expect(c.doseLabel).toContain(`of ${total}`);
    // The note must not sell a different-length series than the heading.
    const wrongTotal = total === 2 ? 4 : 2;
    expect(noteText(c)).not.toMatch(new RegExp(`${wrongTotal}-dose`));
  });

  it('is the younger band\'s card — CDC puts 6 months and 2 weeks in "3-6 months"', () => {
    const c = card(JUST_UNDER_LATE);
    expect(c.seriesTotal).toBe(4);
    expect(c.doseLabel).not.toMatch(/7–11mo/);
    expect(noteText(c)).toMatch(/4-dose Menveo series/);
  });

  it('still hands the 7-month-old the later band, unchanged', () => {
    const c = card(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS);
    expect(c.seriesTotal).toBe(2);
    expect(c.doseLabel).toMatch(/7–11mo/);
  });
});

describe('symptom 2 · the 3-or-4-dose shortcut at the top of its band', () => {
  const D2_AGE = MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS + 1; // dose 2 at 8m

  it('gives a dose 1 at 6 months and 2 weeks the three-dose answer', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: JUST_UNDER_LATE, d2AgeM: D2_AGE })).toBe(3);
  });

  it('answers the same for every age inside CDC\'s 3-6 month band', () => {
    const inBand = [
      MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS,
      MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS + 0.5,
      JUST_UNDER_LATE,
      MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS - 0.01,
    ];
    for (const d1AgeM of inBand) {
      expect(menacwyInfantHighRiskTotal({ d1AgeM, d2AgeM: D2_AGE })).toBe(3);
    }
  });

  it('leaves the bands either side of it alone', () => {
    // Below the band: a 2-month start is a flat 4-dose series (P1-3, 2026-09-15).
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: D2_AGE })).toBe(4);
    // At and above 7 months: a 2-dose series (M5, 2026-09-15).
    expect(menacwyInfantHighRiskTotal({
      d1AgeM: MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS, d2AgeM: D2_AGE,
    })).toBe(2);
  });
});

describe('symptom 3 · the card at 11 months and 2 weeks', () => {
  it('does not tell a baby five weeks short of one that both doses fall after the birthday', () => {
    expect(noteText(card(JUST_UNDER_FINAL))).not.toMatch(/already met/);
  });

  it('keeps the "after age 12 months" condition on dose 2, which still applies', () => {
    expect(noteText(card(JUST_UNDER_FINAL)))
      .toMatch(/not before 12 months of age/);
  });

  it('still gives a 12-month-old the 12-23mo card, unchanged', () => {
    const c = card(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS);
    expect(c.doseLabel).toMatch(/12–23mo/);
    expect(noteText(c)).toMatch(/already met/);
  });
});

describe('no band edge anywhere in the infant range contradicts itself', () => {
  it('heading total and note total agree at every half-month from 2 to 24', () => {
    const offenders = [];
    for (let am = 2; am < 24; am += 0.25) {
      const c = card(am);
      if (!c?.seriesTotal || !c.doseLabel) continue;
      const stated = /of (\d+)/.exec(c.doseLabel)?.[1];
      if (stated && Number(stated) !== c.seriesTotal) {
        offenders.push(`${am}m: label "${c.doseLabel}" vs seriesTotal ${c.seriesTotal}`);
      }
      const note = noteText(c);
      const promised = /(\d+)-dose (?:Menveo )?(?:primary )?series/.exec(note)?.[1];
      if (promised && Number(promised) !== c.seriesTotal) {
        offenders.push(`${am}m: note "${promised}-dose" vs seriesTotal ${c.seriesTotal}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
