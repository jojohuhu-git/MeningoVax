// L2-4 (2026-09-16): the document-versus-code tripwire.
//
// docs/agent/clinical-rules.md and docs/agent/meningococcal-rules-summary.md
// describe the rules this app implements, and both carry an honour-system line
// asking whoever changes a rule to update them in the same PR. That is exactly
// what failed on 2026-09-15: six rules changed, both documents stayed behind,
// and the owner-facing summary — labelled the source of truth, and copied into
// vaxapp — went on describing the superseded behaviour.
//
// So the numbers stop being a promise and become an assertion. Each check below
// reads the value out of the CODE and then requires the document to say it. If
// someone changes a rule and not the prose, this fails and names the file and
// the sentence.
//
// What this does NOT do: judge whether the rule is clinically right. That is the
// owner's review (see the rule-review artifact) and verify-clinical-source. This
// only guarantees the documents and the code tell the same story.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  menacwyInfantHighRiskTotal, menbSeriesInfo, menacwySeriesInfo,
  MENACWY_HIGHRISK_PRIMARY_TOTAL, MENB_HIGHRISK_TOTAL, MENB_HEALTHY_TOTAL,
} from '../seriesTotals.js';
import { menacwyInfantSeriesIndicated } from '../../data/riskFactors.js';
import { menacwyInfantNextDoseGate, GRACE_DAYS, intervalMeetsMinimum } from '../intervals.js';
import { creditPentavalents } from '../pentavalentCredit.js';
import { analyzeHistory } from '../validate.js';
import { TEST_TODAY } from '../../test-today.js';

const read = (rel) => readFileSync(new URL(`../../../${rel}`, import.meta.url), 'utf8')
  // Normalise so a line wrap or an en-dash never decides whether a rule is documented.
  .replace(/[‐-―]/g, '-')
  .replace(/\s+/g, ' ');

const SUMMARY_PATH = 'docs/agent/meningococcal-rules-summary.md';
const CLINICAL_PATH = 'docs/agent/clinical-rules.md';
const summary = read(SUMMARY_PATH);
const clinical = read(CLINICAL_PATH);

// A failure should tell a clinician what to do, not just what did not match.
// True when `needle` appears within `window` characters of ANY occurrence of
// `anchor`. Used instead of a single regex so a check tests that two facts are
// stated together, not the order someone happened to write them in — a document
// rule that fails on a rewording rather than on a changed number is a rule people
// learn to delete.
const statedNear = (doc, anchor, needle, window = 260) => {
  const hay = doc.toLowerCase();
  const a = anchor.toLowerCase();
  const n = needle.toLowerCase();
  for (let i = hay.indexOf(a); i !== -1; i = hay.indexOf(a, i + 1)) {
    const from = Math.max(0, i - window);
    if (hay.slice(from, i + a.length + window).includes(n)) return true;
  }
  return false;
};

const why = (path, what) =>
  `${path} no longer matches the code: ${what}\n\n`
  + 'The code is the behaviour patients see, so the document is what needs fixing — '
  + 'unless the code change itself was wrong, in which case fix that instead. '
  + 'This file is also copied into vaxapp; port the correction there too.';

describe('L2-4: the rule documents state the dose counts the code uses', () => {
  it('a series begun at 7-23 months is documented as the 2-dose series the code builds', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 8 })).toBe(2);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 18 })).toBe(2);
    expect(summary, why(SUMMARY_PATH, 'the code gives a dose 1 at 7-23 months a 2-dose primary series.'))
      .toMatch(/7-23 months[^.]{0,80}2-dose/i);
  });

  it('a series begun at 2 months is documented as 4 doses', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2 })).toBe(4);
    expect(summary, why(SUMMARY_PATH, 'the code gives a dose 1 at 2 months a flat 4-dose series.'))
      .toMatch(/4-dose/);
  });

  it('the 3-dose shortcut band is documented as 3-6 months, not 2-6', () => {
    // The code's actual band: a 2-month start never shortcuts, a 3-month one can.
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2, d2AgeM: 8 })).toBe(4);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 3, d2AgeM: 8 })).toBe(3);
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 6, d2AgeM: 8 })).toBe(3);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'P1-3 moved the 3-dose shortcut to a dose 1 given at 3-6 months. A dose 1 at 2 months gets the flat 4-dose series.'))
        .not.toMatch(/shortcut[^.]{0,120}2-6 ?m/i);
      expect(
        // The agent-facing doc abbreviates ("3-6m"), the owner-facing one spells it out.
        statedNear(doc, 'shortcut', '3-6 month') || statedNear(doc, 'shortcut', '3-6m'),
        why(path, 'the 3-dose shortcut needs dose 1 at 3-6 months and dose 2 at 7 months or later. The document must state that band alongside the shortcut.')
      ).toBe(true);
    }
  });

  it('the high-risk primary series from age 2 is documented as 2 doses', () => {
    expect(MENACWY_HIGHRISK_PRIMARY_TOTAL).toBe(2);
    expect(summary, why(SUMMARY_PATH, 'the high-risk MenACWY primary series from age 2 is 2 doses, >=8 weeks apart.'))
      .toMatch(/2-dose primary series[^.]{0,60}8 weeks/i);
  });
});

describe('L2-4: the rule documents state the 4-day grace rule the code uses', () => {
  // P1-1 (2026-09-17). The number is read out of intervals.js, so moving the
  // grace without updating the documents fails here.
  it('both documents state the grace CDC allows, and the code agrees', () => {
    expect(GRACE_DAYS).toBe(4);
    expect(intervalMeetsMinimum(56 - GRACE_DAYS, 56)).toBe(true);
    expect(intervalMeetsMinimum(56 - GRACE_DAYS - 1, 56)).toBe(false);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(statedNear(doc, `${GRACE_DAYS} days`, 'valid', 320), why(path,
        'P1-1: CDC counts a dose given up to 4 days before a minimum age or interval. It is applied through one shared helper in intervals.js, to every age and every interval.'))
        .toBe(true);
    }
  });

  it('both documents record that the grace does not move the suggested dates', () => {
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(/scheduler|dates the app suggests|advertis/i.test(doc), why(path,
        'P1-1: the grace applies to grading a dose already given, NOT to dueToday/earliestNextDate. Leaving that out of the documents invites someone to "finish the job" and make the app advise early doses.'))
        .toBe(true);
    }
  });
});

describe('L2-4: the rule documents state the MenACWY infant intervals the code uses', () => {
  // P0-1 (2026-09-17). The existing L2-4 checks covered dose COUNTS and booster
  // timing; the infant primary INTERVAL was documented nowhere, which is part of
  // why a wrong number survived a 65-rule review. These two checks read the real
  // numbers out of intervals.js so the documents cannot drift from them.
  it('both documents state the early-dose gap the gate actually enforces', () => {
    const early = menacwyInfantNextDoseGate({ d1AgeM: 3, d2AgeM: null, given: 1 });
    expect(early.minIntervalDays).toBe(56); // guards the test itself
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(statedNear(doc, 'infant', '8 weeks'), why(path,
        'P0-1 corrected the gap between the early doses of a MenACWY infant series from 4 weeks to 8. ACIP RR-9 Tables 4-6 footnote: "doses at intervals of 8 weeks"; CDC child schedule notes, Menveo 3-6 month row: "at least 8 weeks after previous dose". The 4 weeks was ACIP\'s floor for REPEATING an invalid dose.'))
        .toBe(true);
    }
  });

  // A negative check ("no document still says 4 weeks") was written here and
  // removed: 4 weeks is the CORRECT minimum for MenB high-risk dose 2, which
  // both documents also state, and the explanation of where the wrong MenACWY
  // number came from mentions it too. Any text rule loose enough to catch a
  // revert also caught those. The positive checks above and below are the real
  // guard — each asserts the live value out of intervals.js first, so putting
  // the 4 weeks back fails them at that line, before any prose is read.

  it('both documents state the final infant dose needs 12 weeks AND 12 months', () => {
    const final = menacwyInfantNextDoseGate({ d1AgeM: 3, d2AgeM: 5, given: 3 });
    expect(final.minIntervalDays).toBe(84);
    expect(final.minAgeMonths).toBe(12);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(statedNear(doc, '12 weeks', '12 months', 400), why(path,
        'P0-1 made the final dose of EVERY infant series (2-, 3- and 4-dose alike) due at >=12 weeks after the previous dose AND at >=12 months of age. Before it, only the 3-dose shortcut enforced that, so a 4-dose series offered its last dose 4 weeks on with no age floor.'))
        .toBe(true);
    }
  });
});

describe('L2-4: the rule documents state the booster timing the code uses', () => {
  it('the booster clock is documented as running from the last primary dose, not dose 2', () => {
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'P1-1 moved the first-booster clock to the age at the LAST dose of the primary series. Keying it to dose 2 is only right for a series begun at 2 years or older; a baby with four infant doses was given a 5-year wait instead of 3.'))
        .not.toMatch(/(keyed off|based on|at)[^.]{0,40}age (at|when) dose 2/i);
      expect(doc, why(path, 'the first booster is timed from the last dose of the primary series.'))
        .toMatch(/last dose of the primary series/i);
    }
  });

  it('an A/C/W/Y outbreak is documented as a re-exposure top-up, not one-and-done', () => {
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'M12 gave an outbreak contact identified at risk again a single top-up dose once 3 years (under 7) or 5 years (7 and over) have passed. "One documented dose satisfies the indication" is the superseded rule.'))
        .toMatch(/top-up/i);
    }
  });

  it('military recruits are documented as the Department of Defense rule the card states', () => {
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'M18 changed the military card: ACIP gives recruits a booster every 5 years on the basis of assignment, and the Department of Defense sets that requirement. The app does not compute a date, and the document must not say nothing further is due.'))
        .toMatch(/Department of Defense/i);
    }
  });

  it('travel is documented as getting the 3-year first booster under age 7', () => {
    expect(
      statedNear(summary, 'traveller', '3 years') || statedNear(summary, 'travel', '3 years'),
      why(SUMMARY_PATH, 'M9 gave travel the same under-7/over-7 split as medical high risk: first booster at 3 years if the primary dose was given before age 7. Microbiologists keep a flat 5 years - ACIP Table 7 has no under-7 row.')
    ).toBe(true);
    expect(
      statedNear(summary, 'microbiologist', 'flat'),
      why(SUMMARY_PATH, 'microbiologists get a FLAT 5-year booster interval, with no under-7 variation. The document must not describe them and travellers as having one shared rule.')
    ).toBe(true);
  });
});

describe('L2-4: the rule documents state the indications the code acts on', () => {
  it('the infant series is documented as covering travel and outbreak babies too', () => {
    expect(menacwyInfantSeriesIndicated(['travel'])).toBe(true);
    expect(menacwyInfantSeriesIndicated(['outbreak_acwy'])).toBe(true);
    expect(menacwyInfantSeriesIndicated(['microbiologist'])).toBe(false);
    expect(menacwyInfantSeriesIndicated(['military'])).toBe(false);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'M10 put infants on the MenACWY infant series for travel and A/C/W/Y outbreak as well as medical high risk - ACIP prints the same "2-23 mos" row in Tables 4-6, 8 and 9. Microbiologists and recruits are excluded: they have no infant row at all.'))
        .toMatch(/same infant series/i);
    }
  });
});

describe('L2-4: the rule documents state the MenB schedules the code uses', () => {
  it('the healthy series is documented as 2 doses 6 months apart for BOTH brands', () => {
    expect(menbSeriesInfo({ highRisk: false, doses: [] }).total).toBe(MENB_HEALTHY_TOTAL);
    expect(MENB_HEALTHY_TOTAL).toBe(2);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'ACIP\'s October 2024 statement made the healthy schedule 0 and 6 months for both Bexsero and Trumenba. The old brand-split interval (Bexsero 0 + >=1 month) is superseded.'))
        .not.toMatch(/Bexsero: 0\s*\+\s*>?=?\s*1\s*m/i);
      expect(doc, why(path, 'the healthy MenB series is 2 doses at least 6 months apart, the same for both brands.'))
        .toMatch(/2-dose[^.]{0,80}6 months|2 doses[^.]{0,80}6 months/i);
    }
  });

  it('the high-risk series is documented as 3 doses with both dose-3 floors', () => {
    expect(MENB_HIGHRISK_TOTAL).toBe(3);
    expect(summary, why(SUMMARY_PATH, 'the high-risk MenB series is 3 doses at 0, 1-2 and 6 months.'))
      .toMatch(/3-dose primary[^.]{0,60}0, 1-2/i);
    expect(summary, why(SUMMARY_PATH, 'dose 3 needs BOTH >=6 months from dose 1 AND >=4 months from dose 2 - whichever is later.'))
      .toMatch(/6 months after dose 1[^.]{0,80}4 months after dose 2/i);
  });

  // P1-2 (2026-09-17). Neither document mentioned that a high-risk MenB series
  // can finish in TWO doses, which is part of why the branch was missing from
  // the code at all. Derived from the function, not asserted as prose.
  it('the high-risk "dose 3 not needed" exception is documented', () => {
    const shortened = menbSeriesInfo({
      highRisk: true,
      doses: [{ date: '2025-01-15' }, { date: '2025-08-15' }], // 7 months apart
    });
    expect(shortened.total).toBe(2);
    const stillThree = menbSeriesInfo({
      highRisk: true,
      doses: [{ date: '2025-01-15' }, { date: '2025-06-15' }], // 5 months apart
    });
    expect(stillThree.total).toBe(3);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(statedNear(doc, 'dose 3', 'not needed', 400), why(path,
        'P1-2: CDC says "if dose 2 was administered at least 6 months after dose 1, dose 3 not needed". menbSeriesInfo() returns a total of 2 for those patients and the card offers a booster instead of a third dose.'))
        .toBe(true);
    }
  });

  // MenB dose-3 rescue (2026-09-17): the other half of the same CDC bullet. The
  // documents said an early dose 3 was invalid and had to be repeated, which is
  // what the code used to do and what CDC does not say.
  it('the high-risk "early dose 3 earns a 4th dose" rule is documented', () => {
    const rescued = menbSeriesInfo({
      highRisk: true,
      doses: [{ date: '2026-02-15' }, { date: '2026-04-15' }, { date: '2026-06-15' }], // D2->D3 = 2 months
    });
    expect(rescued.total).toBe(4);
    const stillThree = menbSeriesInfo({
      highRisk: true,
      doses: [{ date: '2026-02-15' }, { date: '2026-04-15' }, { date: '2026-08-15' }], // D2->D3 = 4 months
    });
    expect(stillThree.total).toBe(3);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(statedNear(doc, 'earlier than 4 months after dose 2', '4th dose', 400), why(path,
        'CDC says "if dose 3 is administered earlier than 4 months after dose 2, a 4th dose should be administered at least 4 months after dose 3". menbSeriesInfo() returns a total of 4 for those patients and the card asks for dose 4 instead of repeating dose 3.'))
        .toBe(true);
    }
  });

  it('the rescue dose after an early dose 2 is documented', () => {
    const early = menbSeriesInfo({
      highRisk: false,
      doses: [{ date: '2026-01-15' }, { date: '2026-04-15' }],
    });
    expect(early.total).toBe(3);
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'a dose 2 given under 6 months after dose 1 still counts, and a third dose is then needed >=4 months after dose 2.'))
        .toMatch(/rescue/i);
    }
  });
});

describe('L2-4: the rule documents describe how a recorded pentavalent is counted', () => {
  // G1 (2026-09-16). Derived from the code, not asserted as prose: credit a
  // Penbraya recorded on the MenACWY step and check the MenB list really does
  // receive it, then require both documents to say so.
  it('a pentavalent recorded on one step is documented as counting for both vaccines', () => {
    const { menb } = creditPentavalents([{ date: '2026-03-15', brand: 'Penbraya' }], []);
    expect(menb).toHaveLength(1);
    expect(menb[0].creditedFrom).toBe('MenACWY');

    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'a Penbraya/Penmenvy already in the record counts as a MenACWY dose AND a MenB dose, whichever history step it was entered on.'))
        .toMatch(/pentavalent[^.]{0,200}both (vaccines|families)/i);
    }
  });

  it('the de-duplication of a shot recorded on both steps is documented', () => {
    const one = [{ date: '2026-03-15', brand: 'Penbraya' }];
    const { menacwy, menb } = creditPentavalents(one, one);
    expect(menacwy).toHaveLength(1);
    expect(menb).toHaveLength(1);

    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'the same pentavalent recorded on BOTH history steps is counted once, matched on brand and date.'))
        .toMatch(/counts? once|de-duplicates/i);
    }
  });
});

describe('L2-4: the rule documents describe what happens to a future-dated dose', () => {
  // G3 (2026-09-16). Derived from the code first: grade a dose dated after the
  // pinned today and confirm the walk drops it without repeat advice, then
  // require both documents to say so.
  it('a dose dated in the future is documented as not counting', () => {
    const { perDose, effective } = analyzeHistory('MenACWY', [{ date: '2027-05-01', brand: '' }], 204, []);
    expect(effective).toHaveLength(0);
    expect(perDose[0].doesNotCount).toBe(true);
    expect(perDose[0].reasons.join(' ')).not.toMatch(/repeat this dose/i);

    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'a dose dated after today is not counted — the record lists doses already given, so a future date is a typo or an appointment.'))
        .toMatch(/dated in the future|date(d)? (is )?(in the )?future/i);
    }
  });

  it('the "today still counts" boundary is documented, not just the rejection', () => {
    const { effective } = analyzeHistory('MenACWY', [{ date: TEST_TODAY, brand: '' }], 204, []);
    expect(effective).toHaveLength(1);

    expect(summary, why(SUMMARY_PATH, 'a dose dated TODAY counts normally — the cut-off is strictly after today, and a reader has to be told which side of the line today sits on.'))
      .toMatch(/dated \*?today\*? counts|today (is not|counts)/i);
  });
});

describe('L2-4: the rule documents describe the same dose recorded twice', () => {
  // G7 (2026-09-16). Read out of the code first, then required of the prose.
  it('a repeated date is documented as one entry counted once', () => {
    const day = '2024-01-10';
    const { perDose, effective } = analyzeHistory(
      'MenACWY',
      [{ date: day, brand: 'Menveo' }, { date: day, brand: 'Menveo' }],
      204,
      []
    );
    expect(effective).toHaveLength(1);
    expect(perDose[1].doesNotCount).toBe(true);
    expect(perDose[1].reasons.join(' ')).not.toMatch(/repeat this dose/i);

    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'the same date recorded twice is one dose entered twice — counted once, with no instruction to repeat a dose the patient has already had.'))
        .toMatch(/twice|duplicate/i);
    }
  });
});

describe('L2-4: the rule documents describe an undated dose past the series total', () => {
  // G6 (2026-09-16). Behaviour read out of the code, then required of the prose.
  it('the undated case is documented as a question, and the dated case as a statement', () => {
    // G8 (2026-09-16): three undated rows, not two — a healthy 17-year-old's
    // routine series is 2 doses while the 16-year booster is unproven, and an
    // undated dose cannot prove it. The third row is the one past the total.
    const undated = analyzeHistory('MenACWY', [{ date: '', brand: '' }, { date: '', brand: '' }, { date: '', brand: '' }], 204, []);
    expect(undated.perDose[2].extraDoseUnverified).toBe(true);
    expect(undated.perDose[2].reasons.join(' ')).toMatch(/do you mean this was an extra dose given\?/i);

    const dated = analyzeHistory('MenACWY', [
      { date: '2017-09-15', brand: 'Menveo' },
      { date: '2022-09-15', brand: 'Menveo' },
      { date: '2025-09-15', brand: 'Menveo' },
    ], 240, []);
    expect(dated.perDose[2].extraDose).toBe(true);
    expect(dated.perDose[2].extraDoseUnverified).toBeUndefined();

    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'an UNDATED dose past the series total asks "Do you mean this was an extra dose given?" rather than asserting the series was complete — while a DATED extra still states it plainly.'))
        .toMatch(/undated[^.]{0,400}(ask|question|do you mean)/i);
    }
  });
});

describe('L2-4: the rule documents describe what a missing date cannot do', () => {
  // G8 (2026-09-16). Behaviour read out of the code, then required of the prose.
  it('an undated dose neither closes the routine series nor displaces a dated dose', () => {
    // 1. It cannot close the series: the 16-year booster stays owed.
    const undatedOnly = menacwySeriesInfo({
      riskClass: null, am: 204, doses: [{ date: '', brand: '' }], today: TEST_TODAY,
    });
    expect(undatedOnly.total).toBe(2);
    // A DATE proving a dose at >=16y still closes it at one dose.
    const datedAt16 = menacwySeriesInfo({
      riskClass: null, am: 204, doses: [{ date: '2026-03-15', brand: '' }], today: TEST_TODAY,
    });
    expect(datedAt16.total).toBe(1);

    // 2. It cannot take the place of a dose that has a date.
    const mixed = analyzeHistory('MenACWY', [
      { date: '', brand: '' },
      { date: '2026-03-15', brand: '' },
    ], 204, [], TEST_TODAY);
    expect(mixed.effective.some((d) => d.date === '2026-03-15')).toBe(true);

    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'a dose with no date cannot close a series (the 16-year MenACWY booster stays owed until a date proves it was given) and cannot take the place of a dose that has a date.'))
        .toMatch(/undated[^.]{0,400}(close|displace|place of a dose|pushes out)/i);
    }
  });
});

describe('L2-4: both documents say when they were last checked against the code', () => {
  it('each carries a verification stamp in YYYY-MM-DD form', () => {
    for (const [path, doc] of [[SUMMARY_PATH, summary], [CLINICAL_PATH, clinical]]) {
      expect(doc, why(path, 'it needs a dated "last verified against code" stamp so a reader can tell how much to trust it.'))
        .toMatch(/verified against code:?\*{0,2}\s*\d{4}-\d{2}-\d{2}/i);
    }
  });
});
