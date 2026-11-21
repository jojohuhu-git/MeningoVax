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
  AGE_LINES, RISK_ROWS, RISK_RANKING, ACWY_ROUTINE, ACWY_BY_AGE, ACWY_HIGHRISK_LANES,
  ACWY_HIGHRISK_NOTES, ACWY_OTHER, MENB_HEALTHY, MENB_HIGHRISK, MENB_PREGNANCY, CHIP_LEGEND, GRACE,
  INTERVALS, NOT_COUNTED, DECISION, VACCINE_ROWS,
} from '../../data/rulebookPage.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';

const risk = (id) => RISK_ROWS.find((r) => r.id === id);
const cell = (c) => [c?.give, c?.boosters].filter(Boolean).join(' ');
const line = (age) => AGE_LINES.find((a) => a.age === age)?.text;
const chip = (c) => CHIP_LEGEND.find((x) => x.chip === c)?.text;
const interval = (d) => INTERVALS.find((x) => x.doses === d);
const vaccine = (k) => VACCINE_ROWS.flatMap((g) => g.rows).find((r) => r.key === k);

function pageText() {
  render(<Rulebook />);
  const open = screen.queryByRole('button', { name: /Full rulebook/ });
  if (open) fireEvent.click(open);
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

describe('Review v10 Batch 5a — part 2, the age lines (R10–R19)', () => {
  it('each age line says what changes, in the approved words', () => {
    expect(line('6 weeks')).toBe('MenQuadfi is licensed from 6 weeks, and a MenQuadfi dose at that age counts. The app recommends the first dose at 2 months.');
    expect(line('2 months')).toBe('The infant MenACWY series can start for asplenia, complement deficiency, HIV, travel or an A/C/W/Y outbreak.');
    expect(line('2 years')).toBe('From 2 years, there is no infant series: two doses for asplenia, complement deficiency or HIV, one for travel or an outbreak.');
    expect(line('7 years')).toBe('The first booster is 3 years after a series that ends before 7 years, otherwise 5 years.');
    expect(line('10 years')).toBe('MenB, Menveo 1-vial and the combined shot can be given. A routine MenACWY dose before this age does not count.');
    expect(line('16 years')).toBe('The MenACWY booster is due. A first dose at 16 years or older needs none. MenB may be offered to a healthy patient.');
    expect(line('19–21 years')).toBe('One catch-up dose is given if none was given at 16 years or older.');
    expect(line('22 years')).toBe('MenACWY is not routine for a healthy adult.');
    expect(line('24 years')).toBe('MenB is no longer offered to a healthy adult.');
  });
});

describe('Review v10 Batch 5a — part 2, the risk table (R20–R32)', () => {
  it('R20: the table\'s lead', () => {
    expect(pageText()).toContain('This table gives the doses and boosters for each condition.');
  });
  it('R21–R24: asplenia, complement deficiency and HIV', () => {
    expect(cell(risk('asplenia').acwy)).toBe('Under 2 years, the infant series has two to four doses, set by the age at dose 1. From 2 years, give two doses at least 8 weeks apart. The first booster is 3 years after the series if it ended before 7 years, otherwise 5 years. Each later booster is 5 years after the last.');
    expect(cell(risk('asplenia').menb)).toBe('From 10 years: three doses, dose 2 at 1 month and dose 3 at 6 months. The first booster is 1 year after the series, later ones every 2–3 years (the app dates each at 2 years).');
  });
  it('R25: "Same as healthy."', () => {
    expect(risk('hiv').menb.give).toBe('Same as healthy.');
    expect(risk('pregnancy').acwy.give).toBe('Same as healthy.');
  });
  it('R26–R32: the other conditions', () => {
    expect(cell(risk('microbiologist').acwy)).toBe('Give one dose, then a booster every 5 years from the last dose while exposed.');
    expect(risk('travel').acwy.boosters).toBe('The first booster is 3 years after the dose if given before 7 years, otherwise 5 years, then every 5 years while travel continues.');
    expect(risk('military').acwy.boosters).toBe('A booster is given 5 years after the last dose, if the assignment requires it.');
    expect(cell(risk('college_dorm').acwy)).toBe('Give one dose at 16 years or older, unless one was given at that age within 5 years. No booster follows.');
    expect(risk('outbreak_acwy').acwy.boosters).toBe('While the outbreak continues, give a booster 3 years after the dose if given before 7 years, otherwise 5 years, then every 5 years.');
    expect(risk('outbreak_b').menb.boosters).toBe('Give one booster 1 year after the series if the outbreak continues, and no more.');
    expect(risk('pregnancy').menb.give).toBe('Wait until after pregnancy. Give the series now if a MenB high-risk condition is present.');
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
    expect(ACWY_ROUTINE.note).toBe('The booster is given at 16 years, at least 8 weeks after the first dose.');
    expect(ACWY_BY_AGE.find((r) => r.age === '16–18 years').next).toBe('One dose. No booster is needed.');
  });
  it('R46: the high-risk lead', () => {
    expect(pageText()).toContain('The age at dose 1 sets the series. Travel and an A/C/W/Y outbreak use the same infant series.');
  });
  it('R48: the final infant step says what each number is', () => {
    const finals = ACWY_HIGHRISK_LANES.map((l) => l.doses.at(-1));
    expect(finals.filter((f) => f === '≥12 weeks after the last dose, at age ≥12 months')).toHaveLength(2);
  });
  it('R51–R54', () => {
    expect(ACWY_HIGHRISK_NOTES.boosters).toBe('The first booster is 3 years after the series if it ended before 7 years, otherwise 5 years. Each later booster is 5 years after the last, while at risk.');
    const other = (id) => ACWY_OTHER.find((r) => r.name === RISK_FACTORS.find((f) => f.id === id).label).boosters;
    expect(other('travel')).toMatch(/then every 5 years while travel continues\.$/);
    expect(other('microbiologist')).toBe('Give a booster every 5 years from the last dose while exposed.');
    expect(other('college_dorm')).toBe('No booster. A dose at 16 years or older covers college entry for 5 years.');
  });
});

describe('Review v10 Batch 5a — part 4, MenB (R56–R68)', () => {
  it('the healthy series', () => {
    expect(MENB_HEALTHY.lead).toBe('Healthy patients aged 16–23 years may be offered MenB by shared clinical decision-making, preferably at 16–18 years.');
    expect(MENB_HEALTHY.rows[0].text).toBe('Dose 2 given <6 months after dose 1 counts. Give dose 3 ≥4 months after dose 2.');
  });
  it('the high-risk series', () => {
    expect(MENB_HIGHRISK.lead).toBe('Asplenia (including sickle cell disease), complement deficiency or a complement inhibitor, lab work with meningococcus, or a serogroup B outbreak. From 10 years, with no upper age limit.');
    expect(MENB_HIGHRISK.doses[1]).toBe('1 month after dose 1 (at least 4 weeks)');
    const texts = MENB_HIGHRISK.rows.map((r) => r.text);
    expect(texts).toContain('No dose 3 is needed if dose 2 was ≥6 months after dose 1.');
    expect(texts).toContain('Dose 3 given <4 months after dose 2 counts. Give dose 4 ≥4 months after dose 3.');
    expect(texts).toContain('No dose 4 is needed if dose 3 was ≥6 months after dose 1.');
    expect(texts).toContain('The first booster is 1 year after the series, later ones every 2–3 years while at risk (the app dates each at 2 years). A booster given sooner does not count.');
    expect(texts).toContain('HIV alone does not change MenB. Follow the healthy schedule.');
    expect(MENB_PREGNANCY.text).toBe('Wait until after pregnancy, unless a MenB high-risk condition is present.');
  });
  it('R59 names exactly the app\'s MenB high-risk conditions', () => {
    // The lead is written in the owner's words, not built from the labels, so
    // hold it to the app's own list: a fifth MenB condition must change it.
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
  it('R90 and the dose 3 line under it: periods, not semicolons (owner, 2026-11-20)', () => {
    expect(interval('Healthy MenB dose 2').text).toBe('Sooner still counts. Dose 3 is added.');
    expect(interval('High-risk MenB dose 3').text).toBe('Sooner still counts. Dose 4 is added.');
  });
  it('R91–R93: a dose that does not count', () => {
    const texts = NOT_COUNTED.map((r) => r.text);
    // R91, owner 2026-11-20 after it was built: "yes, add 'at least'". The
    // repeat can fall later than the minimum when the schedule says so: a
    // healthy MenB dose 2 given 3 weeks early is repeated 6 months after dose 1.
    expect(texts).toContain('The repeat is given at least the minimum interval after the invalid dose.');
    expect(texts).not.toContain('The repeat is given at the minimum interval after the invalid dose.');   // extinct: R91 as first built
    const r91 = NOT_COUNTED.find((r) => r.text.startsWith('The repeat is given at least'));
    expect(r91.ex.map((e) => e.who)).toContain('Healthy 18-year-old, Bexsero 3 weeks apart');
    expect(texts).toContain('A routine MenACWY dose before 10 years does not count, but the next dose still waits 8 weeks after it.');
    expect(texts).toContain('Finish with the first MenB product. The card also offers finishing with the other.');
  });
});

describe('Style rule 4 on the whole Rulebook screen (owner, 2026-11-20: R50 and "Applies in" too)', () => {
  it('R50 uses a comma', () => {
    expect(ACWY_HIGHRISK_NOTES.spacing).toBe('Infant series: early doses ≥8 weeks apart, the final dose ≥12 weeks after the one before and at 12 months or older.');
  });
  it('no semicolon anywhere in the app\'s own words on the screen (CDC\'s quoted sentences keep theirs)', () => {
    render(<Rulebook />);
    fireEvent.click(screen.getByRole('button', { name: /Full rulebook/ }));
    for (const b of screen.getAllByRole('button', { name: /^(Show|Details|MeningoVax decision: .*)$/ })) fireEvent.click(b);
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
