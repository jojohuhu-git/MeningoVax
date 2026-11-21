// @vitest-environment happy-dom
// Review v10, Batch 5a: the Rulebook screen's wording (R1, R2, R8, R10–R14,
// R16–R34, R36, R37, R40, R42, R46, R48, R51–R54, R56, R57, R59–R63, R65,
// R67, R68, R74–R80, R82, R85–R89, R91–R104). Owner: "Approve them all"
// (2026-11-20); R1 is the owner's own sentence, typed in chat the same day.
// Every sentence below is quoted from docs/archive/decisions-2026-11-20-review-v10.md
// with each semicolon made a period or a comma (owner kept style rule 4).
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

import Rulebook from '../Rulebook.jsx';
import {
  RISK_RANKING, ACWY_BY_AGE, ACWY_HIGHRISK_TABLES, ACWY_HIGHRISK_NOTES, ACWY_GROUPS, MENB_GROUPS,
  MENB_HEALTHY, MENB_HIGHRISK, MENB_DOSE3_EARLY, MENB_OTHER, MENB_PREGNANCY, CHIP_LEGEND, GRACE,
  INTERVALS, SOONER_ADDS, NOT_COUNTED, FAMILIES, DECISION, VACCINE_ROWS,
} from '../../data/rulebookPage.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';

const chip = (c) => CHIP_LEGEND.find((x) => x.chip === c)?.text;
const interval = (d) => INTERVALS.find((x) => x.doses === d);
const vaccine = (k) => VACCINE_ROWS.flatMap((g) => g.rows).find((r) => r.key === k);
const group = (t, key) => t.rows.find((r) => r.key === key);

/** The Rulebook reorganization (2026-11-20) put every part in a fold: open them all. */
function openAll() {
  for (const b of document.querySelectorAll('.rb-part > h2 > button[aria-expanded="false"]')) fireEvent.click(b);
}
function pageText() {
  render(<Rulebook />);
  openAll();
  return document.body.textContent;
}

describe('Review v10 Batch 5a — Rulebook opening and part 1', () => {
  it('R1: the owner\'s sentence opens the screen, alone', () => {
    render(<Rulebook />);
    expect(document.querySelector('.rb-intro').textContent.trim())
      .toBe('Recommendations are based on age, risk conditions and dated vaccine history.');
  });
  it('R2 and R8', () => {
    expect(pageText()).toContain('MenACWY and MenB have separate schedules. One MenABCWY injection gives a dose of each.');
    expect(vaccine('Menactra').use).toBe('Seen on older records. It counts as a MenACWY dose.');
  });
});

// R10–R32 (the age lines and the risk-group table) are extinct: the Rulebook
// reorganization removed both (owner, 2026-11-20, item 1: "say each thing
// once"). Their facts live in the MenACWY and MenB group tables and Details
// panels, checked in regression-2026-11-20-rulebook-reorganization.test.jsx.
describe('Review v10 Batch 5a — part 2 (R10–R32), removed by the reorganization', () => {
  it('the age lines and the risk table are gone; their Details sentences remain', () => {
    const text = pageText();
    expect(text).not.toContain('Age lines, youngest first');   // extinct: removed by the Rulebook reorganization, owner 2026-11-20
    expect(text).not.toContain('This table gives the doses and boosters for each condition.');   // extinct: removed by the Rulebook reorganization, owner 2026-11-20
    expect(group(ACWY_GROUPS, 'travel').details).toContain('Further boosters follow every 5 years while travel continues.');
    expect(group(MENB_GROUPS, 'bout').details).toContain('One booster is given 1 year after the last series dose, if the outbreak is still going on. No further boosters follow.');
  });
});

describe('Review v10 Batch 5a — part 2, more than one condition (R33–R37)', () => {
  it('the lead and the changed rows', () => {
    expect(RISK_RANKING.lead).toBe('Each vaccine follows the condition that needs more doses or boosters.');
    const texts = RISK_RANKING.steps.map((s) => s.text);
    expect(texts).toContain('The high-risk series and boosters cover the other condition too.');
    expect(texts).toContain('Still give the 16-year booster. Later boosters for that condition are timed from it.');
    expect(texts).toContain('Follow the routine schedule, and check again at 16 years or older.');
  });
});

describe('Review v10 Batch 5a — part 3, MenACWY (R40–R54)', () => {
  it('R40, R42', () => {
    // R40's sentence now lives in the healthy group's Details (the routine
    // schedule became a table: reorganization item 6).
    expect(group(ACWY_GROUPS, 'healthy').details).toContain('A booster is given at 16 years, at least 8 weeks after the first dose.');
    expect(ACWY_BY_AGE.find((r) => r.age === '16–18 years').next).toBe('One dose. No booster is needed.');
  });
  it('R46: the high-risk lead', () => {
    expect(ACWY_HIGHRISK_NOTES.lead).toBe('The age at dose 1 sets the series. Travel and an A/C/W/Y outbreak use the same infant series.');
    expect(pageText()).toContain(ACWY_HIGHRISK_NOTES.lead);
  });
  it('R48: the final infant dose says what each number is', () => {
    // Reorganization item 6: each lane is now a table; its final row's minimum.
    const finals = ACWY_HIGHRISK_TABLES.slice(0, 3).map((s) => s.rows.at(-1).min);
    expect(finals).toEqual(['12 weeks after dose 3, at 12 months or older', '12 weeks after the last dose, at 12 months or older', '12 weeks after dose 1, at 12 months or older']);
  });
  it('R51–R54', () => {
    expect(ACWY_HIGHRISK_NOTES.boosters).toBe('The first booster is 3 years after the series if it ended before 7 years, otherwise 5 years. Each later booster is 5 years after the last, while at risk.');
    // R52–R54's "Other indications" table is extinct (it repeated the group
    // table, reorganization item 1); the group rows hold the same facts.
    expect(group(ACWY_GROUPS, 'travel').boosters).toBe('3 or 5 years after the dose, then every 5 years');
    expect(group(ACWY_GROUPS, 'lab').boosters).toBe('5 years after the dose, then every 5 years');
    expect(group(ACWY_GROUPS, 'college').boosters).toBe('None');
  });
});

describe('Review v10 Batch 5a — part 4, MenB (R56–R68)', () => {
  it('the healthy series', () => {
    // The lead became the table's first row (reorganization item 6).
    expect(MENB_HEALTHY.rows[0].routine).toBe('16–23 years, preferably 16–18 years');
    expect(MENB_HEALTHY.note.text).toBe('Dose 2 given <6 months after dose 1 counts. Give dose 3 ≥4 months after dose 2.');
  });
  it('the high-risk series', () => {
    // R59's lead is extinct: the group table names the conditions
    // (reorganization item 4). R60's dose 2 is now a table row (item 6).
    expect(MENB_HIGHRISK).not.toHaveProperty('lead');
    expect(MENB_HIGHRISK.rows[1]).toMatchObject({ routine: '1 month after dose 1', min: '4 weeks after dose 1' });
    expect(MENB_HIGHRISK.note.text).toBe('No dose 3 is needed if dose 2 was ≥6 months after dose 1.');
    // M1 (owner, 2026-11-20): an early dose 3 is repeated, no dose 4. Now one table (item 7).
    expect(MENB_DOSE3_EARLY.rows[0].result).toBe('Not counted. Repeat it ≥4 months after that dose.');
    expect(MENB_OTHER.map((r) => r.text)).toContain('HIV alone does not change MenB. Follow the healthy schedule.');
    expect(MENB_PREGNANCY.text).toBe('Wait until after pregnancy, unless a MenB high-risk condition is present.');
  });
  it('R59: the MenB group table names exactly the app\'s MenB high-risk conditions', () => {
    // The group names are written in the owner's words, not built from the
    // labels, so hold them to the app's own list: a fifth MenB condition must change them.
    expect([...group(MENB_GROUPS, 'bhr').ids, ...group(MENB_GROUPS, 'bout').ids].sort())
      .toEqual(['asplenia', 'complement', 'microbiologist', 'outbreak_b']);
    expect(RISK_FACTORS.filter((r) => r.menbClass === 'highrisk').map((r) => r.id).sort())
      .toEqual(['asplenia', 'complement', 'microbiologist', 'outbreak_b']);
  });
});

describe('Review v10 Batch 5a — part 6, doses on the record (R74–R93)', () => {
  it('R74: the lead', () => {
    expect(pageText()).toContain('Each recorded dose is checked for minimum age and minimum interval, and gets one label. The card shows the routine date. The earliest valid date may be sooner.');
  });
  it('R75–R85: what each label means', () => {
    expect(chip('Dose 2 of 2')).toBe('Valid dose, with its place in the series. Just "Dose 1" when nothing more is owed.');
    expect(chip('Booster')).toBe('Valid booster after a completed series.');
    expect(chip('Not counted — repeat')).toBe('Minimum age or minimum interval not met, or the MenB product is not interchangeable with the first. The line below gives the repeat date.');
    expect(chip('Not counted — do not repeat')).toBe('Invalid dose, but no further dose is owed.');
    expect(chip('Not counted — given before age 10')).toBe('Routine MenACWY before 10 years. The teen series starts at 11–12 years.');
    expect(chip('Not counted — given before age 16')).toBe('Healthy MenB before 16 years. The series starts at 16 years or older.');
    expect(chip('No date recorded — not counted')).toBe('Only dated records count. Add the date to have the dose checked.');
    expect(chip('Needs input')).toBe('Was the patient high-risk on that date? Answer beside the dose.');
  });
  it('R86: the 4-day grace period', () => {
    expect(GRACE.text).toBe('A dose up to 4 days before the minimum age or interval is valid (4-day grace period). The card still shows the full date.');
  });
  it('R87–R89: the minimum intervals say what each number is', () => {
    expect(interval('MenACWY infant series, final dose').gap).toBe('≥12 weeks after the last dose, at age ≥12 months');
    expect(interval('MenACWY booster').gap).toBe('3 years after a series ending before 7 years, otherwise 5, then 5 years after the last booster');
    expect(interval('High-risk MenB booster').gap).toBe('1 year after the series, then 2 years after the last booster');
  });
  it('R90: periods, not semicolons; the rows moved by the reorganization (item 9)', () => {
    // extinct: the "Sooner still counts" line in the table. Healthy MenB dose 2
    // is now in its own list; high-risk dose 3 needs no line, since the table's
    // heading says a dose given sooner does not count.
    expect(interval('Healthy MenB dose 2')).toBeUndefined();
    expect(SOONER_ADDS.rows[0].text).toBe('Healthy MenB dose 2 <6 months after dose 1 counts. Dose 3 is added.');
    expect(interval('High-risk MenB dose 3').text).toBeUndefined();
  });
  it('R91–R93: a dose that does not count', () => {
    const texts = [...NOT_COUNTED.general, ...NOT_COUNTED.special].map((r) => r.text);
    // R91, owner 2026-11-20 after it was built: "yes, add 'at least'". The
    // repeat can fall later than the minimum when the schedule says so: a
    // healthy MenB dose 2 given 3 weeks early is repeated 6 months after dose 1.
    expect(texts).toContain('The repeat is given at least the minimum interval after the invalid dose.');
    expect(texts).not.toContain('The repeat is given at the minimum interval after the invalid dose.');   // extinct: R91 as first built
    const r91 = NOT_COUNTED.general.find((r) => r.text.startsWith('The repeat is given at least'));
    expect(r91.ex.map((e) => e.who)).toContain('Healthy 18-year-old, Bexsero 3 weeks apart');
    expect(texts).toContain('A routine MenACWY dose before 10 years does not count, but the next dose still waits 8 weeks after it.');
    // Item 5: moved under "MenB products are not interchangeable".
    expect(FAMILIES.finish).toBe('Finish with the first MenB product. The card also offers finishing with the other.');
  });
});

describe('Style rule 4 on the whole Rulebook screen (owner, 2026-11-20: R50 and "Applies in" too)', () => {
  it('R50: extinct, the spacing line repeated the new schedule tables (reorganization item 6)', () => {
    expect(ACWY_HIGHRISK_NOTES).not.toHaveProperty('spacing');
  });
  it('no semicolon anywhere in the app\'s own words on the screen (CDC\'s quoted sentences keep theirs)', () => {
    render(<Rulebook />);
    openAll();
    for (const b of screen.getAllByRole('button', { name: /^(Show|MeningoVax decision: .*)$/ })) fireEvent.click(b);
    const copy = document.body.cloneNode(true);
    copy.querySelectorAll('.rb-src-panel, .rb-doc').forEach((e) => e.remove());
    expect(copy.textContent).toContain('Applies in:');   // not vacuous: part 7 is open
    expect(copy.textContent.match(/[^;]{0,40};[^;]{0,40}/g) ?? []).toEqual([]);
  });
});

describe('Review v10 Batch 5a — part 7, MeningoVax decisions (R94–R104)', () => {
  it('R94: "CDC and ACIP say:" followed by a statement, never a command', () => {
    expect(DECISION.transplant.cdc).toBe('Revaccination for these patients falls outside the routine and risk-based schedules.');
    for (const d of Object.values(DECISION)) {
      expect(d.cdc, d.key).not.toMatch(/^(Give|Treat|Start|Repeat|Keep|Count)\b/);
    }
    pageText();
    fireEvent.click(screen.getAllByRole('button', { name: /^MeningoVax decision: / })[0]);
    expect(screen.getAllByText('CDC and ACIP say:').length).toBeGreaterThan(0);
    expect(screen.queryByText('CDC and ACIP:')).toBeNull();   // extinct: the R94 label
  });
  it('R95–R103', () => {
    expect(DECISION.riskAtDose.does).toContain('If the answer is no or unsure, the dose is judged as for a patient with no risk.');
    expect(DECISION.menquadfi6Weeks.cdc).toContain('CDC\'s notes list MenQuadfi from 2 years. AAP lists it from 6 weeks.');
    expect(DECISION.infantFellBehind.does).toMatch(/^The app follows CDSI, CDC's rules for immunization software: 3 doses in all\./);
    expect(DECISION.collegeCover.does).toMatch(/^The app counts the 5 years up to today, treating today as the college-entry visit\./);
    expect(DECISION.boosterMinimum.does).toMatch(/^A booster given more than 4 days early does not count\./);
    expect(DECISION.graceFewerDoses.short).toBe('Up to 4 days early at a birthday');
    expect(DECISION.extraDose.short).toBe('A dose given when none was due');
    expect(DECISION.repeatAfterTooYoung.does).toBe('The repeat is given at the minimum interval after the invalid dose: 8 weeks for MenACWY, 4 weeks for MenB.');
    expect(DECISION.graceFewerDoses.does).toMatch(/^A MenACWY dose up to 4 days before age 3 months, 7 months, 2 years or 16 years gets the schedule that needs fewer doses\./);
  });
  it('R104: says what CDC and ACIP give, and what they leave open', () => {
    expect(DECISION.extraDose.cdc).toMatch(/They do not say whether a dose beyond that counts\.$/);
  });
});
