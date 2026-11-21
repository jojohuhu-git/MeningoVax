// ─────────────────────────────────────────────────────────────────────────
// rulebookPage.js — what the in-app Rulebook screen says (port Phase 7.2,
// owner Q11, 2026-11-19: "Yes, like PneumoVax").
//
// TWO RULEBOOKS, ONE SET OF RULES. The owner's rulebook is
// docs/agent/meningococcal-rules-summary.md: written for her, it names her
// answers and the files. This screen is the same rules written for the
// clinician using the app, in PneumoVax's shape (her five rounds of review of
// PneumoVax's screen, memory `rules-page-owner-design-notes`):
//
//   • In the order the app decides: the transplant stop, the vaccines, age and
//     risk group, MenACWY, MenB, the combined shot, doses on the record, then
//     the app's own decisions and the sources.
//   • Ages in weeks, months and years, youngest first. Each row says WHAT
//     changes. "Minimum interval", "dose", ≥ signs.
//   • The dose labels are the ones on the dose chips.
//   • One "Source" per claim: the sentences the app's own cards cite for the
//     row's worked patient, never a sentence typed here.
//   • Where CDC and ACIP give no answer, a named "MeningoVax decision" in three
//     parts: Problem / CDC and ACIP / MeningoVax decision.
//
// HOW IT IS HELD TO THE APP (rulebook-screen-matches-the-engine.test.jsx):
//   1. NO NUMBER IS TYPED in the page text below the THE PAGE line. Every age
//      and interval is interpolated from the constant the engine reads.
//   2. EVERY CLAIM CARRIES A WORKED PATIENT (`ex`), run through recommend().
//      A sentence that stops being true of the app fails its patient.
//   3. Every chip in the label key is the chip its patient's dose really shows.
//
// This file renders and decides nothing.
// ─────────────────────────────────────────────────────────────────────────
import { recommend } from '../logic/recommend.js';
import {
  MENACWY_SCHEDULE_MIN_AGE_MONTHS, MENACWY_INFANT_SERIES_MAX_AGE_MONTHS,
  MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS,
  MENACWY_INFANT_FINAL_MIN_AGE_MONTHS, MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS,
  MENACWY_ROUTINE_DOSE1_AGE_MONTHS, MENACWY_ROUTINE_CATCHUP_MIN_AGE_MONTHS,
  MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, MENACWY_CATCHUP_MIN_AGE_MONTHS,
  MENACWY_CATCHUP_MAX_AGE_MONTHS, MENACWY_BOOSTER_AGE_SPLIT_MONTHS,
  MENB_HEALTHY_MIN_AGE_MONTHS, MENB_HEALTHY_MAX_AGE_MONTHS,
} from '../logic/ages.js';
import {
  MENACWY_INFANT_EARLY_GAP, MENACWY_INFANT_FINAL_GAP, MENACWY_INFANT_ROUTINE_AGE_MONTHS,
  MENACWY_HIGHRISK_PRIMARY_GAP, MENACWY_ROUTINE_BOOSTER_MIN_GAP, MENACWY_ANY_TWO_DOSES_MIN_GAP,
  MENACWY_FIRST_BOOSTER_YEARS_UNDER_7, MENACWY_FIRST_BOOSTER_YEARS_FROM_7,
  MENACWY_BOOSTER_CADENCE_YEARS, MENACWY_COLLEGE_COVER_YEARS,
  MENB_HIGHRISK_FIRST_BOOSTER_YEARS, MENB_HIGHRISK_BOOSTER_CADENCE_YEARS,
  MENB_HIGHRISK_BOOSTER_CADENCE_LABEL, MENB_REPEAT_MIN_INTERVAL, MENB_HIGHRISK_D2_GAP,
  MENB_HIGHRISK_D2_ROUTINE_MONTHS, MENB_HIGHRISK_D3_MONTHS_FROM_D1, MENB_HIGHRISK_D3_MONTHS_FROM_D2,
  MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS, MENB_HEALTHY_D2_MONTHS, MENB_HEALTHY_RESCUE_MONTHS,
  GRACE_DAYS, MENACWY_GRACE_LINES_M, PENTAVALENT_REPEAT_MONTHS, weeksLabel, monthsLabel, yearsLabel,
} from '../logic/intervals.js';
import {
  MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS, MENACWY_LICENCE_MIN_AGE_DAYS,
  MENACWY_UNKNOWN_BRAND_MIN_AGE_MONTHS, MENB_MIN_AGE_MONTHS, PENTAVALENT_MIN_AGE_MONTHS,
} from './brands.js';
import { RISK_FACTORS, RISK_BY_ID } from './riskFactors.js';
import {
  MENACWY_HIGHRISK_PRIMARY_TOTAL, MENACWY_SINGLE_TOTAL, MENB_HIGHRISK_TOTAL, MENB_HEALTHY_TOTAL, menacwyInfantHighRiskTotal,
} from '../logic/seriesTotals.js';
import { CITATIONS } from './refs.js';

// ── Words for a number of days, months or years ──────────────────────────
const wk = (days) => weeksLabel(days);
const mo = (months) => monthsLabel(months);
const yr = (years) => yearsLabel(years);
/** An age in months as a clinician says it: "7 months", "2 years". */
export function age(months) {
  if (months < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS) return mo(months);
  return yr(months / 12);
}
/** An age in months as a bare number of years, for a range: "11". */
const y = (months) => `${months / 12}`;
/** "11–12 years": from one age line to the year before the next. */
const yrsBand = (fromM, toM) => `${y(fromM)}–${toM / 12 - 1} years`;
const moBand = (fromM, toM) => `${fromM}–${toM - 1} months`;
/** A count as a word, where it sits beside an age (owner, 2026-11-19). */
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];
const word = (n) => COUNT_WORDS[n] ?? `${n}`;
/** "Two doses": a word that opens a bar or a sentence. */
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
/** The last whole year before an age line: "21 years" before 22. */
const yearBefore = (toM) => `${toM / 12 - 1} years`;
/** "3 months, 7 months, 2 years or 16 years". */
const orList = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`);

// Two ages the engine never reads, so they are named here with their source:
//   CDC's notes list MenQuadfi from 2 years (refs.js `cdcChildAcwyMinAge`
//   quote, "2 years [MenACWY-TT, MenQuadfi]"), a fact the MenQuadfi decision states.
//   CDC's preferred healthy MenB age, "16-18 years" (refs.js
//   `menbHealthyPreferredAge1618`), ends at the 19th birthday.
const CDC_MENQUADFI_MIN_AGE_MONTHS = 2 * 12;
const MENB_PREFERRED_END_MONTHS = 19 * 12;
//   ACIP's high-risk MenB series is "0, 1–2, and 6 months" (refs.js
//   `menbHighRisk3DoseSchedule`); the app dates dose 2 at the first of those.
const MENB_D2_ACIP_LATEST_MONTHS = 2;

// ── The worked patients ──────────────────────────────────────────────────
/** The fixed "today" every worked patient is run on. */
export const EX_TODAY = '2026-11-19';

const MV = MENACWY_BRANDS.find((b) => b.key === 'Menveo 2-vial').label;
const MQ = MENACWY_BRANDS.find((b) => b.key === 'MenQuadfi').label;
const BX = MENB_BRANDS.find((b) => b.key === 'Bexsero').label;
const TR = MENB_BRANDS.find((b) => b.key === 'Trumenba').label;
const PMV = PENTAVALENT_BRANDS.find((b) => b.key === 'Penmenvy').label;
const doses = (brand, ...dates) => dates.map((date) => ({ brand, date }));
/** Every recorded dose answered "high-risk on that date: yes". */
const yes = (n) => Object.fromEntries([...Array(n).keys()].map((i) => [i, 'yes']));

/**
 * A worked patient. `expect` lists what must be true of the app's answer:
 *   acwy / menb  — patterns; each must match that vaccine's card dose label
 *   status       — [vaccine, status]: that vaccine's card has this status
 *   note         — patterns; each must match some card's note text
 *   due          — [vaccine, 'today' | date]: when that card's dose is due
 *   penta        — true / false: the combined shot is offered
 *   pentaWhy     — pattern the "not an option today" reason must match
 *   pentaBrands  — the pentavalent brands offered, exactly
 *   chip         — [vaccine, index, label]: that recorded dose's chip, exactly
 *   booster      — [[vaccine, pattern], …]: that card's booster line matches
 *   excluded     — the transplant stop
 */
const ex = (who, input, expect) => ({
  who,
  input: { today: EX_TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input,
    riskAtDoseAnswers: { MenACWY: {}, MenB: {}, ...(input.riskAtDoseAnswers ?? {}) } },
  expect,
});

const P = {
  transplant: ex('16-year-old after CAR-T therapy', { dob: '2010-06-01', riskIds: ['hct_cart_bcell_exclude', 'asplenia'] }, { excluded: true }),

  // MenACWY, routine
  healthy9: ex('Healthy 9-year-old, no doses', { dob: '2017-06-01' }, { acwy: [/^Not yet due$/] }),
  healthy11: ex('Healthy 11-year-old, no doses', { dob: '2015-06-01' }, { acwy: [/^Dose 1 \(routine/], due: ['MenACWY', 'today'] }),
  healthy14: ex('Healthy 14-year-old, no doses', { dob: '2012-06-01' }, { acwy: [/^Dose 1 \(catch-up, 13–15y\)$/] }),
  healthy16: ex('Healthy 16-year-old, MenACWY at 11', { dob: '2010-06-01', menacwyDoses: doses(MV, '2021-07-01') }, { acwy: [/^Booster \(16y\)$/], penta: true }),
  healthy17: ex('Healthy 17-year-old, no doses', { dob: '2009-06-01' }, { acwy: [/^Dose 1 \(catch-up, ≥16y, no booster needed\)$/] }),
  healthy20: ex('Healthy 20-year-old, no doses', { dob: '2006-06-01' }, { acwy: [/^Dose 1 \(catch-up, 19–21y\)$/] }),
  healthy25: ex('Healthy 25-year-old, no doses', { dob: '2001-06-01' }, { acwy: [/^Not routinely indicated$/], menb: [/^Not routinely indicated$/] }),
  healthy17done: ex('Healthy 17-year-old, MenACWY at 11 and 16', { dob: '2009-06-01', menacwyDoses: doses(MV, '2020-07-01', '2025-07-01') },
    { status: ['MenACWY', 'complete'], chip: ['MenACWY', 1, 'Dose 2 of 2'] }),
  healthy13pre10: ex('Healthy 13-year-old, MenACWY at 9', { dob: '2013-06-01', menacwyDoses: doses(MV, '2022-08-01') },
    { acwy: [/^Dose 1 \(catch-up/], chip: ['MenACWY', 0, 'Not counted — given before age 10'] }),

  // MenACWY, high risk
  asp2m: ex('Infant with asplenia, 2 months, no doses', { dob: '2026-09-15', riskIds: ['asplenia'] }, { acwy: [/^Dose 1 of 4 \(infant high-risk\)$/] }),
  asp4m: ex('Infant with asplenia, 4 months, no doses', { dob: '2026-07-15', riskIds: ['asplenia'] }, { acwy: [/^Dose 1 of 4 \(infant high-risk\)$/] }),
  asp9m: ex('Infant with asplenia, 9 months, no doses', { dob: '2026-02-15', riskIds: ['asplenia'] }, { acwy: [/^Dose 1 of 2 \(infant high-risk 7–11mo\)$/] }),
  asp3y: ex('3-year-old with asplenia, no doses', { dob: '2023-06-01', riskIds: ['asplenia'] }, { acwy: [/^Dose 1 of 2 \(high-risk primary series\)$/] }),
  hiv14: ex('14-year-old with HIV, no doses', { dob: '2012-06-01', riskIds: ['hiv'] }, { acwy: [/^Dose 1 of 2 \(high-risk primary series\)$/], menb: [/^Not routinely indicated$/] }),
  complement12: ex('12-year-old on eculizumab, no doses', { dob: '2014-06-01', riskIds: ['complement'] },
    { acwy: [/^Dose 1 of 2 \(high-risk primary series\)$/], menb: [/^Dose 1 of 3 \(high-risk series\)$/],
      booster: [['MenACWY', /3 years after the series if it ends before 7 years.*otherwise 5.*then every 5 years/], ['MenB', /1 year after the series, then every 2–3 years/]] }),
  fellBehind: ex('6-year-old with asplenia, one Menveo at 2 months', { dob: '2020-11-19', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2021-01-19'), riskAtDoseAnswers: { MenACWY: yes(1) } },
    { acwy: [/^Dose 2 of 3 \(infant high-risk, dose 2 at ≥7 months\)$/], chip: ['MenACWY', 0, 'Dose 1 of 3'] }),
  aspDoneBefore7: ex('5-year-old with asplenia, primary series finished at 2', { dob: '2021-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2023-06-10', '2023-08-15'), riskAtDoseAnswers: { MenACWY: yes(2) } },
    { acwy: [/^First booster \(dose 3\), 3 years after the series$/] }),
  aspDoneFrom7: ex('12-year-old with asplenia, primary series finished at 10', { dob: '2014-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2024-06-10', '2024-08-15') },
    { acwy: [/^First booster \(dose 3\), 5 years after the series$/], due: ['MenACWY', '2029-08-15'] }),
  aspTravel3: ex('3-year-old with asplenia who travels, no doses', { dob: '2023-06-01', riskIds: ['asplenia', 'travel'] }, { acwy: [/^Dose 1 of 2 \(high-risk primary series\)$/] }),

  // MenACWY, other indications
  travel5: ex('5-year-old traveller, no doses', { dob: '2021-06-01', riskIds: ['travel'] },
    { acwy: [/^Dose 1 \(boosters while at risk\)$/], booster: [['MenACWY', /every 5 years while travel continues/]] }),
  travel5had: ex('5-year-old traveller, one dose at 4', { dob: '2021-06-01', riskIds: ['travel'], menacwyDoses: doses(MV, '2025-06-01') },
    { acwy: [/^First booster \(dose 2\), 3 years after dose 1$/], due: ['MenACWY', '2028-06-01'] }),
  travel15: ex('15-year-old traveller, one dose at 14', { dob: '2011-06-01', riskIds: ['travel'], menacwyDoses: doses(MV, '2025-07-01') },
    { acwy: [/^Booster \(16y\)$/], due: ['MenACWY', '2027-06-01'] }),
  travelCollege18: ex('18-year-old traveller in a residence hall, no doses', { dob: '2008-06-01', riskIds: ['travel', 'college_dorm'] }, { acwy: [/^Dose 1 \(boosters while at risk\)$/] }),
  micro30: ex('30-year-old microbiologist, no doses', { dob: '1996-06-01', riskIds: ['microbiologist'] },
    { acwy: [/^Dose 1 \(boosters while at risk\)$/], menb: [/^Dose 1 of 3 \(high-risk series\)$/],
      booster: [['MenACWY', /every 5 years while exposure continues/], ['MenB', /1 year after the series, then every 2–3 years/]] }),
  outbreakA20: ex('20-year-old in a serogroup C outbreak, no doses', { dob: '2006-06-01', riskIds: ['outbreak_acwy'] }, { acwy: [/^1 dose$/] }),
  outbreakA20had: ex('20-year-old in a serogroup C outbreak, one dose at 18', { dob: '2006-06-01', riskIds: ['outbreak_acwy'], menacwyDoses: doses(MV, '2024-07-01') },
    { acwy: [/^Booster \(dose 2\) if outbreak risk continues$/], due: ['MenACWY', '2029-07-01'] }),
  military18: ex('18-year-old military recruit, no doses', { dob: '2008-06-01', riskIds: ['military'] }, { acwy: [/^1 dose$/] }),
  military19: ex('19-year-old recruit, MenACWY at 11 and 16, then 2 years later', { dob: '2007-06-01', riskIds: ['military'], menacwyDoses: doses(MV, '2018-07-01', '2023-07-01', '2025-08-01') },
    { acwy: [/^Booster \(dose 3\) if required by assignment$/], due: ['MenACWY', '2030-08-01'], chip: ['MenACWY', 2, 'Not counted — repeat'] }),
  college18: ex('18-year-old entering a residence hall, no doses', { dob: '2008-06-01', riskIds: ['college_dorm'] }, { acwy: [/^1 dose$/] }),
  college18had16: ex('18-year-old entering a residence hall, MenACWY at 12 and 16', { dob: '2008-06-01', riskIds: ['college_dorm'], menacwyDoses: doses(MV, '2021-05-01', '2024-07-01') },
    { acwy: [/^Complete \(dose given at ≥16y\)$/] }),
  college22: ex('22-year-old entering a residence hall, last dose at 16', { dob: '2004-06-01', riskIds: ['college_dorm'], menacwyDoses: doses(MV, '2015-07-01', '2020-07-01') },
    { acwy: [/^1 dose \(last dose at ≥16y more than 5 years ago\)$/] }),
  college14: ex('14-year-old in a residence hall, no doses', { dob: '2012-06-01', riskIds: ['college_dorm'] }, { acwy: [/^Dose 1 \(catch-up, 13–15y\)$/] }),

  // MenB
  menbHealthy17: ex('Healthy 17-year-old, no MenB', { dob: '2009-06-01' }, { menb: [/^Dose 1 of 2 \(shared clinical decision\)$/], status: ['MenB', 'shared-decision'] }),
  menbHealthy12: ex('Healthy 12-year-old, no MenB', { dob: '2014-06-01' }, { menb: [/^Not routinely indicated$/] }),
  menbHealthyEarly: ex('Healthy 17-year-old, Bexsero 3 months apart', { dob: '2009-06-01', menacwyDoses: doses(MV, '2020-07-01', '2025-07-01'), menbDoses: doses(BX, '2026-03-01', '2026-06-01') },
    { menb: [/^Dose 3 of 3 \(dose 2 given early\)$/], chip: ['MenB', 1, 'Dose 2 of 3'] }),
  menbHealthy3wk: ex('Healthy 18-year-old, Bexsero 3 weeks apart', { dob: '2008-06-01', menacwyDoses: doses(MV, '2019-07-01', '2024-07-01'), menbDoses: doses(BX, '2026-09-01', '2026-09-22') },
    { chip: ['MenB', 1, 'Not counted — repeat'], due: ['MenB', '2027-03-01'] }),
  menbPre16: ex('Healthy 17-year-old, Bexsero at 14', { dob: '2009-06-01', menacwyDoses: doses(MV, '2020-07-01', '2025-07-01'), menbDoses: doses(BX, '2023-08-01') },
    { menb: [/^Dose 1 of 2 \(shared clinical decision\)$/], chip: ['MenB', 0, 'Not counted — given before age 16'] }),
  menbAsp12: ex('12-year-old with asplenia, no MenB', { dob: '2014-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2024-06-10', '2024-08-15') }, { menb: [/^Dose 1 of 3 \(high-risk series\)$/] }),
  menbAsp9: ex('9-year-old with asplenia', { dob: '2017-06-01', riskIds: ['asplenia'] }, { menb: [/^Not yet due \(from 10 years\)$/], penta: false }),
  menbD2at6: ex('20-year-old with asplenia, Bexsero 6 months apart', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2026-01-01', '2026-07-05') },
    { menb: [/^First booster \(dose 3\), 1 year after the series$/], chip: ['MenB', 1, 'Dose 2 of 2'] }),
  menbD3early: ex('20-year-old with asplenia, Bexsero dose 3 2 months after dose 2', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2026-01-01', '2026-04-01', '2026-06-15') },
    { menb: [/^Dose 4 of 4 \(dose 3 <4 months after dose 2/], chip: ['MenB', 2, 'Dose 3 of 4'] }),
  menbD3unless: ex('20-year-old with asplenia, dose 3 2 months after dose 2 and 6 months after dose 1', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2026-01-01', '2026-05-01', '2026-07-05') },
    { menb: [/^First booster \(dose 4\), 1 year after the series$/], chip: ['MenB', 2, 'Dose 3 of 3'] }),
  menbD3fromD2: ex('20-year-old with asplenia, dose 3 4 months after dose 2 but 5 months after dose 1', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2026-01-01', '2026-01-29', '2026-05-30') },
    { chip: ['MenB', 2, 'Dose 3 of 3'] }),
  menbBoosterDue: ex('20-year-old with asplenia, MenB series finished 16 months ago', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2024-01-01', '2024-02-01', '2024-07-01') },
    { menb: [/^First booster \(dose 4\), 1 year after the series$/], due: ['MenB', 'today'] }),
  menbBoosterEarly: ex('20-year-old with asplenia, MenB booster 8 months after the series', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2024-01-01', '2024-02-01', '2024-07-01', '2025-03-01') },
    { chip: ['MenB', 3, 'Not counted — repeat'] }),
  menbOutbreakDone: ex('20-year-old in a serogroup B outbreak, series and one booster given', { dob: '2006-06-01', riskIds: ['outbreak_b'], menbDoses: doses(BX, '2024-01-01', '2024-02-01', '2024-07-01', '2025-08-01') },
    { menb: [/^Complete \(outbreak booster given\)$/] }),
  menbOutbreakAsp: ex('20-year-old with asplenia in a serogroup B outbreak, series and one booster given', { dob: '2006-06-01', riskIds: ['outbreak_b', 'asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2024-01-01', '2024-02-01', '2024-07-01', '2025-08-01') },
    { menb: [/^Booster \(dose 5\), 2–3 years after the last$/] }),
  pregnant20: ex('Pregnant 20-year-old, MenACWY complete', { dob: '2006-06-01', riskIds: ['pregnancy'], menacwyDoses: doses(MV, '2017-07-01', '2022-07-01') },
    { menb: [/^Defer during pregnancy$/], status: ['MenB', 'deferred'] }),
  pregnantAsp: ex('Pregnant 20-year-old with asplenia', { dob: '2006-06-01', riskIds: ['pregnancy', 'asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01') },
    { menb: [/^Dose 1 of 3 \(high-risk series\)$/] }),
  wrongFamily: ex('Healthy 17-year-old, Bexsero then Trumenba', { dob: '2009-06-01', menacwyDoses: doses(MV, '2020-07-01', '2025-07-01'), menbDoses: doses(BX, '2026-01-05').concat(doses(TR, '2026-08-01')) },
    { menb: [/^Dose 2 of 2 \(Bexsero\)$/], chip: ['MenB', 1, 'Not counted — repeat'], note: [/Or complete the series with Trumenba:/] }),

  // The combined shot
  pentaRecent: ex('17-year-old with asplenia, Penmenvy 11 weeks ago', { dob: '2009-06-01', riskIds: ['asplenia'], menbDoses: doses(PMV, '2026-09-01') },
    { acwy: [/^Dose 2 of 2/], menb: [/^Dose 2 of 3/], penta: false, pentaWhy: /within 6 months of the last Penmenvy dose/ }),
  pentaFamily: ex('14-year-old with asplenia, Bexsero dose 1 in October, MenACWY dose 2 due', { dob: '2012-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2024-06-10'), menbDoses: doses(BX, '2026-10-01'), riskAtDoseAnswers: { MenB: yes(1) } },
    { penta: true, pentaBrands: [PMV] }),
  pentaWaits: ex('13-year-old with asplenia, one MenACWY at 8 not yet answered', { dob: '2013-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2021-07-01') },
    { chip: ['MenACWY', 0, 'Needs input'], penta: false }),
  pentaInRecord: ex('Healthy 17-year-old, Penmenvy at 16 recorded under MenACWY', { dob: '2009-06-01', menacwyDoses: doses(MV, '2020-07-01').concat(doses(PMV, '2026-05-01')) },
    { status: ['MenACWY', 'complete'], menb: [/^Dose 2 of 2 \(Bexsero\)$/], chip: ['MenB', 0, 'Dose 1 of 2'] }),

  // Doses on the record
  boosterChip: ex('20-year-old with asplenia, MenACWY series and a booster', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01') },
    { chip: ['MenACWY', 2, 'Booster'] }),
  acwyTooSoon: ex('14-year-old with asplenia, Menveo 3 weeks apart', { dob: '2012-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2026-10-01', '2026-10-22') },
    { chip: ['MenACWY', 1, 'Not counted — repeat'], due: ['MenACWY', '2026-12-17'] }),
  doNotRepeat: ex('Healthy 10-year-old, Bexsero at 9', { dob: '2016-06-01', menbDoses: doses(BX, '2026-05-01') },
    { chip: ['MenB', 0, 'Not counted — do not repeat'] }),
  extraAcwy: ex('Healthy 30-year-old, MenACWY at 11 and 16, and again at 29', { dob: '1996-06-01', menacwyDoses: doses(MV, '2007-07-01', '2012-07-01', '2026-05-01') },
    { chip: ['MenACWY', 2, 'Not counted — Extra. Do not repeat.'] }),
  extraMenb: ex('Healthy 30-year-old, one Bexsero at 29', { dob: '1996-06-01', menbDoses: doses(BX, '2026-05-01') },
    { chip: ['MenB', 0, 'Not counted — Extra. Do not repeat.'] }),
  undated: ex('Healthy 17-year-old, MenACWY with no date', { dob: '2009-06-01', menacwyDoses: [{ brand: MV }] },
    { chip: ['MenACWY', 0, 'No date recorded — not counted'], acwy: [/^Dose 1 \(catch-up/] }),
  future: ex('Healthy 17-year-old, MenACWY dated next year', { dob: '2009-06-01', menacwyDoses: doses(MV, '2027-01-01') },
    { chip: ['MenACWY', 0, 'Date is in the future — not counted'] }),
  duplicate: ex('Healthy 17-year-old, the same MenACWY entered twice', { dob: '2009-06-01', menacwyDoses: doses(MV, '2021-07-01', '2021-07-01') },
    { chip: ['MenACWY', 1, 'Entered twice — this row not counted'] }),
  riskAsk: ex('5-year-old with asplenia, two MenACWY at 2, question not answered', { dob: '2021-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2023-06-10', '2023-08-15') },
    { chip: ['MenACWY', 0, 'Needs input'] }),
  grace16: ex('Healthy 16-year-old, booster 4 days before the 16th birthday', { dob: '2010-06-01', menacwyDoses: doses(MV, '2021-07-01', '2026-05-28') },
    { status: ['MenACWY', 'complete'], chip: ['MenACWY', 1, 'Dose 2 of 2'] }),
  menquadfi6wk: ex('Infant with asplenia, MenQuadfi at 6 weeks', { dob: '2026-09-01', riskIds: ['asplenia'], menacwyDoses: doses(MQ, '2026-10-14'), riskAtDoseAnswers: { MenACWY: yes(1) } },
    { chip: ['MenACWY', 0, 'Dose 1 of 4'] }),
  unknown6wk: ex('Infant with asplenia, MenACWY of unknown brand at 6 weeks', { dob: '2026-09-01', riskIds: ['asplenia'], menacwyDoses: [{ brand: '', date: '2026-10-14' }] },
    { chip: ['MenACWY', 0, 'Not counted — repeat'], note: [/8 weeks after the invalid dose of Oct 14, 2026/], due: ['MenACWY', '2026-12-09'] }),
  setAside: ex('Healthy 10-year-old, MenACWY at 9 years 11 months and 6 weeks later', { dob: '2016-01-01', menacwyDoses: doses(MV, '2025-12-01', '2026-01-15') },
    { chip: ['MenACWY', 1, 'Not counted — repeat'] }),
  aspBoosterEarly: ex('14-year-old with asplenia, MenACWY booster 2 years after the series', { dob: '2012-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2023-06-10', '2023-08-15', '2025-08-15') },
    { chip: ['MenACWY', 2, 'Not counted — repeat'], due: ['MenACWY', '2030-08-15'] }),

  // D1, the seven steps and Quick look (2026-11-20)
  travelInfant: ex('Infant traveller, 4 months, no doses', { dob: '2026-07-15', riskIds: ['travel'] }, { acwy: [/^Dose 1 of 4 \(infant travel\)$/] }),
  outbreakInfant: ex('Infant in a serogroup C outbreak, 4 months, no doses', { dob: '2026-07-15', riskIds: ['outbreak_acwy'] }, { acwy: [/^Dose 1 of 4 \(infant outbreak\)$/] }),
  microInfant: ex('1-year-old listed as lab-exposed, no doses', { dob: '2025-11-01', riskIds: ['microbiologist'] }, { acwy: [/^Dose 1 \(boosters while at risk\)$/] }),
  military14: ex('14-year-old military recruit, no doses', { dob: '2012-06-01', riskIds: ['military'] }, { acwy: [/^Dose 1 \(catch-up, 13–15y\)$/] }),
  military25: ex('25-year-old military recruit, no doses', { dob: '2001-06-01', riskIds: ['military'] }, { acwy: [/^1 dose$/] }),
  military19b: ex('19-year-old recruit, MenACWY at 11 and 16', { dob: '2007-06-01', riskIds: ['military'], menacwyDoses: doses(MV, '2018-07-01', '2023-07-01') },
    { acwy: [/^Booster \(dose 3\) if required by assignment$/], due: ['MenACWY', '2028-07-01'] }),
  outbreakB12: ex('12-year-old in a serogroup B outbreak, no doses', { dob: '2014-06-01', riskIds: ['outbreak_b'] },
    { acwy: [/^Dose 1 \(routine, 11–12y\)$/], menb: [/^Dose 1 of 3 \(high-risk series\)$/], booster: [['MenB', /1 year after the primary series, if outbreak risk continues/]] }),
  pregnant15: ex('Pregnant 15-year-old, no doses', { dob: '2011-06-01', riskIds: ['pregnancy'] },
    { acwy: [/^Dose 1 \(catch-up, 13–15y\)$/], menb: [/^Defer during pregnancy$/] }),
  menbHealthy17today: ex('Healthy 17-year-old, MenACWY complete, no MenB', { dob: '2009-06-01', menacwyDoses: doses(MV, '2020-07-01', '2025-07-01') },
    { menb: [/^Dose 1 of 2 \(shared clinical decision\)$/], due: ['MenB', 'today'] }),
  earliestInfant: ex('Infant with asplenia, MenACWY dose 1 at 2 months', { dob: '2026-08-15', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2026-10-15'), riskAtDoseAnswers: { MenACWY: yes(1) } },
    { due: ['MenACWY', '2026-12-15'], note: [/Earliest valid date: Dec 10, 2026 \(minimum interval 8 weeks\)/] }),
  earliestMenb: ex('14-year-old with asplenia, Bexsero dose 1 two weeks ago', { dob: '2012-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2024-06-10', '2024-08-15'), menbDoses: doses(BX, '2026-11-05'), riskAtDoseAnswers: { MenB: yes(1) } },
    { due: ['MenB', '2026-12-05'], note: [/Earliest valid date: Dec 3, 2026 \(minimum interval 4 weeks\)/] }),
};
export const WORKED_PATIENTS = P;

/**
 * The sentences a row rests on: those the app's own cards (and dose lines)
 * cite for the row's worked patients, limited to `keys` when the row names
 * them. One per sentence, in order of first use. Generated, never typed.
 */
export function sourcesFor(examples = [], keys = null) {
  const seen = new Map();
  for (const e of examples) {
    const out = recommend(e.input);
    if (out.excluded) {
      for (const c of out.exclusionCitations ?? []) if (!seen.has(c.url)) seen.set(c.url, { key: c.url, quote: null, doc: c.short ?? c.label, url: c.url });
      continue;
    }
    const cites = [
      ...[...(out.menacwy ?? []), ...(out.menb ?? [])].flatMap((r) => [...(r.noteCites ?? []), ...(r.boosterCites ?? [])]),
      ...(out.pentavalent?.noteCites ?? []),
      ...['MenACWY', 'MenB'].flatMap((v) => (out.history?.[v]?.perDose ?? []).flatMap((d) => d.reasonCites ?? [])),
    ];
    for (const c of cites) {
      if (!c?.quote || (keys && !keys.includes(c.key)) || seen.has(c.key)) continue;
      seen.set(c.key, { key: c.key, quote: c.quote, doc: c.doc, url: c.url });
    }
  }
  return [...seen.values()];
}

// ═════════════════════════════════════════════════════════════════════════
// THE PAGE. No number is typed below this line in page text: every age and
// interval comes from a constant above (the guard reads this file's source).
// Worked-patient facts (dates, ages at a dose) live above, in P.
// ═════════════════════════════════════════════════════════════════════════

const ROUTINE_D1 = yrsBand(MENACWY_ROUTINE_DOSE1_AGE_MONTHS, MENACWY_ROUTINE_CATCHUP_MIN_AGE_MONTHS);
const CATCHUP_TEEN = yrsBand(MENACWY_ROUTINE_CATCHUP_MIN_AGE_MONTHS, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS);
const AT16 = age(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS);
/** "16-year", as the card says it ("the routine 16-year booster"). */
const YEAR16 = `${y(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS)}-year`;
const SIXTEEN_TO_18 = yrsBand(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, MENACWY_CATCHUP_MIN_AGE_MONTHS);
const CATCHUP_ADULT = yrsBand(MENACWY_CATCHUP_MIN_AGE_MONTHS, MENACWY_CATCHUP_MAX_AGE_MONTHS);
const MENB_WINDOW = yrsBand(MENB_HEALTHY_MIN_AGE_MONTHS, MENB_HEALTHY_MAX_AGE_MONTHS);
const MENB_PREFERRED = yrsBand(MENB_HEALTHY_MIN_AGE_MONTHS, MENB_PREFERRED_END_MONTHS);
const MENB_D2_ACIP_RANGE = `${MENB_HIGHRISK_D2_ROUTINE_MONTHS}–${mo(MENB_D2_ACIP_LATEST_MONTHS)}`;
const AT10 = age(MENB_MIN_AGE_MONTHS);
const AT7 = age(MENACWY_BOOSTER_AGE_SPLIT_MONTHS);
const AT2Y = age(MENACWY_INFANT_SERIES_MAX_AGE_MONTHS);
const AT12M = age(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS);
const AT7M = age(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS);
const W8 = wk(MENACWY_ANY_TWO_DOSES_MIN_GAP);
const W12 = wk(MENACWY_INFANT_FINAL_GAP);
const W4 = wk(MENB_REPEAT_MIN_INTERVAL);
const B3 = yr(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7);
const B5 = yr(MENACWY_FIRST_BOOSTER_YEARS_FROM_7);
const EVERY5 = yr(MENACWY_BOOSTER_CADENCE_YEARS);
const INFANT_AGES = [
  MENACWY_SCHEDULE_MIN_AGE_MONTHS,
  MENACWY_INFANT_ROUTINE_AGE_MONTHS[MENACWY_SCHEDULE_MIN_AGE_MONTHS],
  MENACWY_INFANT_ROUTINE_AGE_MONTHS[MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS],
  MENACWY_INFANT_FINAL_MIN_AGE_MONTHS,
];
const FAMILY_4C = MENB_BRANDS.find((b) => b.key === 'Bexsero').family;
const FAMILY_FHBP = MENB_BRANDS.find((b) => b.key === 'Trumenba').family;
const inFamily = (fam) => [...MENB_BRANDS, ...PENTAVALENT_BRANDS].filter((b) => b.family === fam).map((b) => b.key);
// Q2 (owner, 2026-11-19): the screen names MenB products by brand, never by
// antigen family ("4C", "FHbp"). The family codes stay as internal keys only.
const brandIn = (list, fam) => list.find((b) => b.family === fam).key;
const BEXSERO = brandIn(MENB_BRANDS, FAMILY_4C);
const TRUMENBA = brandIn(MENB_BRANDS, FAMILY_FHBP);
const PENMENVY = brandIn(PENTAVALENT_BRANDS, FAMILY_4C);
const PENBRAYA = brandIn(PENTAVALENT_BRANDS, FAMILY_FHBP);

/** The parts of the page, in the order the app decides. */
export const HEADINGS = {
  vaccines: 'The vaccines',
  who: 'Age and risk group',
  acwy: 'MenACWY',
  menb: 'MenB',
  penta: 'The combined shot (MenABCWY)',
  record: 'Doses on the record',
  decisions: 'MeningoVax decisions',
  sources: 'Sources',
};

// ── MeningoVax decisions: written once, named, opened in place ────────────
// Every place CDC and ACIP give no answer and the app chose one. Same three
// parts in the same order as PneumoVax's (owner, 2026-11-01).
export const DECISIONS = [
  {
    key: 'transplant',
    short: 'Transplant stop',
    problem: 'The patient has had a stem cell transplant, CAR-T therapy, a B-cell malignancy or B-cell-depleting therapy. Revaccination after these is individualized, so a standard schedule could be wrong.',
    cdc: 'Revaccination for these patients falls outside the routine and risk-based schedules.',
    does: 'Stops and shows no recommendation, even when another condition is also selected. Follow the institutional protocol.',
    ex: [P.transplant],
  },
  {
    key: 'riskAtDose',
    short: 'High-risk on the date of the dose?',
    problem: `A patient high-risk today has a MenACWY dose given before ${AT10}, or a MenB dose given before ${AT16}. Whether it counts depends on whether the patient was already high-risk on that date.`,
    cdc: `A MenACWY dose before ${AT10} is treated differently for a child with an ongoing risk. They do not say what to do when the risk began after the dose, for MenACWY before ${AT10} or MenB before ${AT16}.`,
    does: 'Asks beside the dose whether the patient was high-risk on that date. Yes: the dose is judged on the high-risk schedule. If the answer is no or unsure, the dose is judged as for a patient with no risk. Until answered, the dose reads Needs input and the combined shot is not offered.',
    ex: [P.riskAsk, P.aspDoneBefore7, P.pentaWaits],
  },
  {
    key: 'menquadfi6Weeks',
    short: `MenQuadfi from ${wk(MENACWY_LICENCE_MIN_AGE_DAYS)}`,
    problem: `MenQuadfi is licensed from ${wk(MENACWY_LICENCE_MIN_AGE_DAYS)}, younger than the infant schedule's first dose at ${age(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}. A record may show a dose in between, or a dose of unknown brand.`,
    cdc: `The infant series starts at ${age(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}. CDC's notes list MenQuadfi from ${age(CDC_MENQUADFI_MIN_AGE_MONTHS)}. AAP lists it from ${wk(MENACWY_LICENCE_MIN_AGE_DAYS)}.`,
    does: `Never asks for a dose before ${age(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}. A MenQuadfi dose at ${wk(MENACWY_LICENCE_MIN_AGE_DAYS)} or older counts, following AAP. A dose of unknown brand counts only from ${age(MENACWY_UNKNOWN_BRAND_MIN_AGE_MONTHS)}, since it may not have been MenQuadfi.`,
    ex: [P.menquadfi6wk, P.unknown6wk],
  },
  {
    key: 'infantFellBehind',
    short: 'Infant who fell behind',
    problem: `A high-risk infant had dose 1 at ${age(MENACWY_SCHEDULE_MIN_AGE_MONTHS)} and fell behind, so dose 2 comes at ${AT7M} or older.`,
    cdc: `Dose 1 at ${age(MENACWY_SCHEDULE_MIN_AGE_MONTHS)} gets ${INFANT_AGES.length} doses, and fewer when dose 1 is at ${moBand(MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS)} and dose 2 at ${AT7M} or older. They do not say what a child who started at ${age(MENACWY_SCHEDULE_MIN_AGE_MONTHS)} and fell behind needs.`,
    does: `The app follows CDSI, CDC's rules for immunization software: ${INFANT_AGES.length - 1} doses in all. Dose 2 now, then a final dose ≥${W12} later and at ${AT12M} or older.`,
    ex: [P.fellBehind],
  },
  {
    key: 'routine16First',
    short: `The ${YEAR16} dose comes first`,
    problem: `A teenager has a MenACWY dose before ${AT16} for travel, laboratory work or an outbreak. That indication's next booster could fall years after the ${YEAR16} dose would.`,
    cdc: `A dose is due at ${AT16} when the first dose was before ${AT16}, and these indications have their own booster schedule. They do not say which comes first.`,
    does: `Gives the routine ${YEAR16} booster first. The indication's boosters then run from it. Asplenia, complement deficiency and HIV keep their own schedule, which replaces the routine one.`,
    ex: [P.travel15],
  },
  {
    key: 'collegeCover',
    short: `College: ${yr(MENACWY_COLLEGE_COVER_YEARS)} from the dose`,
    problem: `A first-year student entering a residence hall had MenACWY at ${AT16} or older. That dose covers college residence for ${yr(MENACWY_COLLEGE_COVER_YEARS)}.`,
    cdc: `No further dose before college entry unless more than ${yr(MENACWY_COLLEGE_COVER_YEARS)} have passed since the dose. They give no repeat for staying in a residence hall.`,
    does: `The app counts the ${yr(MENACWY_COLLEGE_COVER_YEARS)} up to today, treating today as the college-entry visit. No dose for continued residence. Under ${AT16}, the college box adds nothing to the routine schedule.`,
    ex: [P.college18had16, P.college22, P.college14],
  },
  {
    key: 'militaryAssignment',
    short: 'Military booster by assignment',
    problem: 'A military recruit has had MenACWY. Further doses depend on the assignment, which the app cannot see.',
    cdc: `Recruits get a booster every ${EVERY5} on the basis of assignment.`,
    does: `Shows the booster date ${EVERY5} after the last dose, "if required by assignment", never Complete. Check the service's current requirement. A booster given <${EVERY5} after the dose before it does not count.`,
    ex: [P.military19],
  },
  {
    key: 'healthyMenbBefore16',
    short: `Healthy MenB before ${AT16}`,
    problem: `A patient with no MenB risk had MenB between ${AT10} and ${AT16}.`,
    cdc: `The healthy series is given at ${MENB_WINDOW}. They do not say whether a dose before ${AT16} counts, and CDC's scheduling software counts it.`,
    does: `Sets the dose aside ("Not counted — given before age ${y(MENB_HEALTHY_MIN_AGE_MONTHS)}"). The series is given at ${AT16} or older.`,
    ex: [P.menbPre16],
  },
  {
    key: 'menbDose3FromDose2',
    short: 'High-risk MenB dose 3 timing',
    problem: `A high-risk MenB dose 3 was given ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2 but <${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1.`,
    cdc: `Dose 3 is given at ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)}. No sentence states ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} from dose 1 as a minimum, and CDC's scheduling software sets none.`,
    does: `Counts the dose. The card still advises dose 3 ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1 and ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2.`,
    ex: [P.menbD3fromD2],
  },
  {
    key: 'boosterMinimum',
    short: 'A booster given early',
    problem: 'A booster was given before its scheduled time.',
    cdc: 'Booster timing is given as a schedule, not as a minimum interval. CDC\'s scheduling software treats the same timing as a minimum.',
    does: `A booster given more than ${GRACE_DAYS} days early does not count. The repeat is timed from it.`,
    ex: [P.aspBoosterEarly, P.menbBoosterEarly, P.military19],
  },
  {
    key: 'repeatAfterTooYoung',
    short: 'Repeat of a too-young first dose',
    problem: 'A first dose was given below the vaccine\'s minimum age, so it does not count.',
    cdc: 'The dose is repeated as age appropriate, which allows the repeat as soon as the minimum age is reached.',
    does: `The repeat is given at the minimum interval after the invalid dose: ${W8} for MenACWY, ${W4} for MenB.`,
    ex: [P.unknown6wk],
  },
  {
    key: 'setAsideClock',
    short: 'A set-aside dose starts the clock',
    problem: `A MenACWY dose was set aside (given before ${AT10} to a patient with no risk). The next dose could follow days later.`,
    cdc: `MenACWY doses are ≥${W8} apart. They do not say whether a set-aside dose starts that interval.`,
    does: `The set-aside dose starts the ${W8}: a dose <${W8} after it does not count.`,
    ex: [P.setAside],
  },
  {
    key: 'graceFewerDoses',
    short: `Up to ${GRACE_DAYS} days early at a birthday`,
    problem: `A MenACWY dose was given up to ${GRACE_DAYS} days before a birthday that changes the series. Read as given on the birthday, the patient may owe fewer doses, or more.`,
    cdc: `A dose given ≤${GRACE_DAYS} days before a minimum age counts as valid. They do not say how this applies to the ages that set a series' length.`,
    does: `A MenACWY dose up to ${GRACE_DAYS} days before age ${orList(MENACWY_GRACE_LINES_M.map(age))} gets the schedule that needs fewer doses. Not at ${AT7}: a series finished just before ${AT7} keeps the ${MENACWY_FIRST_BOOSTER_YEARS_UNDER_7}-year booster.`,
    ex: [P.grace16],
  },
  {
    key: 'extraDose',
    short: 'A dose given when none was due',
    problem: 'A dose was given when no dose was recommended: the series was complete, or the vaccine was not indicated.',
    cdc: 'Each series has a set number of doses. They do not say whether a dose beyond that counts.',
    does: 'Labels it "Not counted — Extra. Do not repeat.", including a first dose given when nothing was recommended. A dose within the college residence cover still counts.',
    ex: [P.extraAcwy, P.extraMenb],
  },
];
export const DECISION = Object.fromEntries(DECISIONS.map((d) => [d.key, d]));
/** A row's decision keys, as a list. */
export const decisionsOf = (row) => (row?.decision == null ? [] : [].concat(row.decision));

// ── 0. The stop ──────────────────────────────────────────────────────────
export const TRANSPLANT_STOP = {
  title: RISK_BY_ID.hct_cart_bcell_exclude.label,
  text: 'Individualized revaccination schedule required. No recommendation is shown.',
  decision: 'transplant',
  ex: [P.transplant],
};

// ── 1. The vaccines ──────────────────────────────────────────────────────
const USE = {
  'Menveo 2-vial': `Infant series and every later dose.`,
  'Menveo 1-vial': `Any dose from ${age(MENACWY_BRANDS.find((b) => b.key === 'Menveo 1-vial').minAgeM)}.`,
  MenQuadfi: 'Infant series and every later dose.',
  // Q2 S2–S5 (owner approved as written, 2026-11-20).
  Bexsero: `Use for every MenB dose. Not interchangeable with ${TRUMENBA} or ${PENBRAYA}.`,
  Trumenba: `Use for every MenB dose. Not interchangeable with ${BEXSERO} or ${PENMENVY}.`,
  Penmenvy: `Gives one MenACWY dose and one ${BEXSERO} dose in a single injection.`,
  Penbraya: `Gives one MenACWY dose and one ${TRUMENBA} dose in a single injection.`,
  Menactra: 'Seen on older records. It counts as a MenACWY dose.',
};
const brandMinAge = (b) => (b.minAgeDays != null ? wk(b.minAgeDays) : age(b.minAgeM));
const vaccineRow = (type) => (b) => ({ key: b.key, name: b.key, type, minAge: brandMinAge(b),
  // Q2 S1: the MenB brand a dose counts as (Penmenvy counts as Bexsero), not its family code.
  countsAs: b.family ? brandIn(MENB_BRANDS, b.family) : '', use: USE[b.key],
  decision: b.key === 'MenQuadfi' ? 'menquadfi6Weeks' : undefined });
export const VACCINE_ROWS = [
  { name: 'MenACWY', rows: MENACWY_BRANDS.filter((b) => b.active).map(vaccineRow('MenACWY')) },
  { name: 'MenB', rows: MENB_BRANDS.map(vaccineRow('MenB')) },
  { name: 'MenABCWY (MenACWY and MenB in one dose)', rows: PENTAVALENT_BRANDS.map(vaccineRow('MenABCWY')) },
  { name: 'No longer used: history only', rows: MENACWY_BRANDS.filter((b) => b.key === 'Menactra').map(vaccineRow('MenACWY')) },
];

/** The two MenB families, drawn as boxes (owner: visuals over text). Q2 S6:
 *  named by brand; the family code is the row's key only, never shown. */
export const FAMILIES = {
  title: 'MenB products are not interchangeable',
  rows: [FAMILY_4C, FAMILY_FHBP].map((fam) => ({ family: fam, brands: inFamily(fam) })),
  note: `Every MenB dose must match the first. A dose of the other product does not count, and the matching product is given ≥${W4} after it.`,
  ex: [P.wrongFamily],
};

// ── 2. Age and risk group ────────────────────────────────────────────────
/** The age lines, youngest first (owner, 2026-10-31: chronological). */
export const AGE_LINES = [
  { age: wk(MENACWY_LICENCE_MIN_AGE_DAYS), text: `MenQuadfi is licensed from ${wk(MENACWY_LICENCE_MIN_AGE_DAYS)}, and a MenQuadfi dose at that age counts. The app recommends the first dose at ${age(MENACWY_SCHEDULE_MIN_AGE_MONTHS)}.` },
  { age: age(MENACWY_SCHEDULE_MIN_AGE_MONTHS), text: 'The infant MenACWY series can start for asplenia, complement deficiency, HIV, travel or an A/C/W/Y outbreak.' },
  { age: AT2Y, text: `From ${AT2Y}, there is no infant series: ${word(MENACWY_HIGHRISK_PRIMARY_TOTAL)} doses for asplenia, complement deficiency or HIV, ${word(MENACWY_SINGLE_TOTAL)} for travel or an outbreak.` },
  { age: AT7, text: `The first booster is ${B3} after a series that ends before ${AT7}, otherwise ${B5}.` },
  { age: AT10, text: 'MenB, Menveo 1-vial and the combined shot can be given. A routine MenACWY dose before this age does not count.' },
  { age: ROUTINE_D1, text: 'Routine MenACWY dose 1.' },
  { age: AT16, text: `The MenACWY booster is due. A first dose at ${AT16} or older needs none. MenB may be offered to a healthy patient.` },
  { age: CATCHUP_ADULT, text: `One catch-up dose is given if none was given at ${AT16} or older.` },
  { age: age(MENACWY_CATCHUP_MAX_AGE_MONTHS), text: 'MenACWY is not routine for a healthy adult.' },
  { age: age(MENB_HEALTHY_MAX_AGE_MONTHS), text: 'MenB is no longer offered to a healthy adult.' },
];

// The risk table (owner, 2026-11-19: "Series by age at dose 1" was confusing;
// say the doses plainly, and say when boosters are due). Each cell is two
// lines: what to give, then the boosters.
const INFANT_FEWEST = menacwyInfantHighRiskTotal({ d1AgeM: MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS });
const INFANT_MOST = menacwyInfantHighRiskTotal({ d1AgeM: MENACWY_SCHEDULE_MIN_AGE_MONTHS });
const INFANT_DOSES = `${INFANT_FEWEST}–${INFANT_MOST} doses`;
const ACWY_MEDICAL = {
  give: `Under ${AT2Y}, the infant series has ${word(INFANT_FEWEST)} to ${word(INFANT_MOST)} doses, set by the age at dose 1. From ${AT2Y}, give ${word(MENACWY_HIGHRISK_PRIMARY_TOTAL)} doses at least ${wk(MENACWY_HIGHRISK_PRIMARY_GAP)} apart.`,
  boosters: `The first booster is ${B3} after the series if it ended before ${AT7}, otherwise ${B5}. Each later booster is ${EVERY5} after the last.`,
};
const MENB_HIGH = {
  give: `From ${AT10}: ${word(MENB_HIGHRISK_TOTAL)} doses, dose 2 at ${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} and dose 3 at ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)}.`,
  boosters: `The first booster is ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, later ones every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} (the app dates each at ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)}).`,
};
const SAME_AS_HEALTHY = { give: 'Same as healthy.', boosters: null };
/** Travel and an A/C/W/Y outbreak: the infant series, then one dose. */
const ONE_DOSE_FROM_2Y = `Under ${AT2Y}, the infant series has ${word(INFANT_FEWEST)} to ${word(INFANT_MOST)} doses, set by the age at dose 1. From ${AT2Y}, give ${word(MENACWY_SINGLE_TOTAL)} dose.`;
const RISK_CELLS = {
  complement: { acwy: ACWY_MEDICAL, menb: MENB_HIGH },
  asplenia: { acwy: ACWY_MEDICAL, menb: MENB_HIGH },
  hiv: { acwy: ACWY_MEDICAL, menb: SAME_AS_HEALTHY },
  microbiologist: {
    acwy: { give: `Give ${word(MENACWY_SINGLE_TOTAL)} dose, then a booster every ${EVERY5} from the last dose while exposed.`, boosters: null },
    menb: { ...MENB_HIGH, boosters: `The first booster is ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, later ones every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while exposed (the app dates each at ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)}).` },
  },
  travel: {
    acwy: { give: ONE_DOSE_FROM_2Y, boosters: `The first booster is ${B3} after the dose if given before ${AT7}, otherwise ${B5}, then every ${EVERY5} while travel continues.` },
    menb: SAME_AS_HEALTHY,
  },
  military: {
    acwy: { give: `Give ${word(MENACWY_SINGLE_TOTAL)} dose.`, boosters: `A booster is given ${EVERY5} after the last dose, if the assignment requires it.` },
    menb: SAME_AS_HEALTHY,
  },
  college_dorm: {
    acwy: { give: `Give ${word(MENACWY_SINGLE_TOTAL)} dose at ${AT16} or older, unless one was given at that age within ${yr(MENACWY_COLLEGE_COVER_YEARS)}. No booster follows.`, boosters: null },
    menb: SAME_AS_HEALTHY,
  },
  outbreak_acwy: {
    acwy: { give: ONE_DOSE_FROM_2Y, boosters: `While the outbreak continues, give a booster ${B3} after the dose if given before ${AT7}, otherwise ${B5}, then every ${EVERY5}.` },
    menb: SAME_AS_HEALTHY,
  },
  outbreak_b: {
    acwy: SAME_AS_HEALTHY,
    menb: { give: MENB_HIGH.give, boosters: `Give one booster ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series if the outbreak continues, and no more.` },
  },
  pregnancy: {
    acwy: SAME_AS_HEALTHY,
    menb: { give: 'Wait until after pregnancy. Give the series now if a MenB high-risk condition is present.', boosters: null },
  },
};
const RISK_EX = {
  complement: [P.complement12], asplenia: [P.asp3y, P.menbAsp12, P.aspDoneBefore7, P.aspDoneFrom7, P.menbBoosterDue], hiv: [P.hiv14],
  microbiologist: [P.micro30], travel: [P.travel5, P.travel5had], military: [P.military18, P.military19],
  college_dorm: [P.college18, P.college18had16, P.college22], outbreak_acwy: [P.outbreakA20, P.outbreakA20had],
  outbreak_b: [P.menbOutbreakDone], pregnancy: [P.pregnant20, P.pregnantAsp],
};
/** One row per condition the app asks about, in the app's order. */
export const RISK_ROWS = RISK_FACTORS.filter((r) => !r.exclude).map((r) => ({
  id: r.id,
  name: r.label,
  acwy: RISK_CELLS[r.id]?.acwy,
  menb: RISK_CELLS[r.id]?.menb,
  ex: RISK_EX[r.id],
}));

/**
 * More than one condition (owner, 2026-11-19: "one dose over the routine
 * schedule" was confusing). Each row: which conditions, then what to give.
 */
export const RISK_RANKING = {
  lead: 'Each vaccine follows the condition that needs more doses or boosters.',
  steps: [
    { name: 'MenACWY: asplenia, complement deficiency or HIV, with any other condition', text: 'The high-risk series and boosters cover the other condition too.', ex: [P.aspTravel3] },
    { name: 'MenACWY: travel or laboratory exposure, with military, college or an outbreak', text: `Give ${MENACWY_SINGLE_TOTAL} dose, then boosters while travel or exposure continues.`, ex: [P.travelCollege18] },
    { name: `MenACWY: travel, laboratory exposure or an outbreak, under ${AT16}`, text: `Still give the ${YEAR16} booster. Later boosters for that condition are timed from it.`, decision: 'routine16First', ex: [P.travel15] },
    { name: `MenACWY: college or military, under ${AT16}`, text: `Follow the routine schedule, and check again at ${AT16} or older.`, ex: [P.college14] },
    { name: 'MenB: serogroup B outbreak with asplenia, complement deficiency or laboratory exposure', text: `Give that condition's boosters (every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL}), not the single outbreak booster.`, ex: [P.menbOutbreakDone, P.menbOutbreakAsp] },
    { name: 'MenB: pregnancy with a MenB condition', text: 'Give the high-risk series. Pregnancy does not delay it.', ex: [P.pregnantAsp] },
  ],
};

// ── 3. MenACWY ───────────────────────────────────────────────────────────
export const ACWY_ROUTINE = {
  doses: [{ text: 'Dose 1', age: ROUTINE_D1 }, { text: 'Booster', age: AT16 }],
  note: `The booster is given at ${AT16}, at least ${wk(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} after the first dose.`,
  ex: [P.healthy11, P.healthy16],
};
/** A healthy patient's next MenACWY step, by age today. */
export const ACWY_BY_AGE = [
  { age: `Under ${age(MENACWY_ROUTINE_DOSE1_AGE_MONTHS)}`, next: 'Not yet due.', ex: [P.healthy9] },
  { age: ROUTINE_D1, next: `Dose 1, booster at ${AT16}.`, ex: [P.healthy11] },
  { age: CATCHUP_TEEN, next: `Dose 1 (catch-up), booster at ${SIXTEEN_TO_18}.`, ex: [P.healthy14] },
  { age: SIXTEEN_TO_18, next: 'One dose. No booster is needed.', ex: [P.healthy17] },
  { age: CATCHUP_ADULT, next: `One catch-up dose, if none at ${AT16} or older.`, ex: [P.healthy20] },
  { age: `${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)} and older`, next: 'Not routinely indicated.', ex: [P.healthy25] },
];
export const ACWY_HISTORY_NOTES = [
  { text: `A dose at ${AT16} or older completes the routine schedule.`, ex: [P.healthy17done] },
  { text: `A dose before ${AT10} does not count toward the routine series.`, ex: [P.healthy13pre10] },
];

/** R48, R87: the final infant dose, saying what each number is. */
const INFANT_FINAL_STEP = `≥${W12} after the last dose, at age ≥${AT12M}`;
/** The high-risk series, one lane per age at dose 1. */
export const ACWY_HIGHRISK_LANES = [
  {
    start: age(MENACWY_SCHEDULE_MIN_AGE_MONTHS),
    doses: INFANT_AGES.map(age),
    note: `If dose 2 comes at ${AT7M} or older: ${INFANT_AGES.length - 1} doses in all.`,
    decision: 'infantFellBehind',
    ex: [P.asp2m, P.fellBehind],
  },
  {
    start: moBand(MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS),
    doses: ['Dose 1', `≥${wk(MENACWY_INFANT_EARLY_GAP)}`, `≥${wk(MENACWY_INFANT_EARLY_GAP)}`, INFANT_FINAL_STEP],
    note: `${INFANT_AGES.length - 1} doses if dose 2 is at ${AT7M} or older, else ${INFANT_AGES.length}.`,
    ex: [P.asp4m],
  },
  {
    start: moBand(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS, MENACWY_INFANT_SERIES_MAX_AGE_MONTHS),
    doses: ['Dose 1', INFANT_FINAL_STEP],
    ex: [P.asp9m],
  },
  {
    start: `${AT2Y} or older`,
    doses: ['Dose 1', `≥${wk(MENACWY_HIGHRISK_PRIMARY_GAP)}`],
    ex: [P.asp3y],
  },
];
export const ACWY_HIGHRISK_NOTES = {
  spacing: `Infant series: early doses ≥${wk(MENACWY_INFANT_EARLY_GAP)} apart; the final dose ≥${W12} after the one before and at ${AT12M} or older.`,
  boosters: `The first booster is ${B3} after the series if it ended before ${AT7}, otherwise ${B5}. Each later booster is ${EVERY5} after the last, while at risk.`,
  boostersEx: [P.aspDoneBefore7, P.aspDoneFrom7],
};

/** The other MenACWY indications. */
export const ACWY_OTHER = [
  { name: RISK_BY_ID.travel.label, primary: `1 dose (under ${AT2Y}: infant series)`, boosters: `${B3} after a dose before ${AT7}, else ${B5}, then every ${EVERY5} while travel continues.`, ex: [P.travel5, P.travel5had] },
  { name: RISK_BY_ID.microbiologist.label, primary: '1 dose', boosters: `Give a booster every ${EVERY5} from the last dose while exposed.`, ex: [P.micro30] },
  { name: RISK_BY_ID.outbreak_acwy.label, primary: `1 dose (under ${AT2Y}: infant series)`, boosters: `${B3} after a dose before ${AT7}, else ${B5}, if outbreak risk continues.`, ex: [P.outbreakA20, P.outbreakA20had] },
  { name: RISK_BY_ID.military.label, primary: '1 dose', boosters: `Every ${EVERY5} if required by assignment.`, decision: 'militaryAssignment', ex: [P.military18, P.military19] },
  { name: RISK_BY_ID.college_dorm.label, primary: `1 dose at ${AT16} or older`, boosters: `No booster. A dose at ${AT16} or older covers college entry for ${yr(MENACWY_COLLEGE_COVER_YEARS)}.`, decision: 'collegeCover', ex: [P.college18, P.college18had16, P.college22] },
];
export const ACWY_OTHER_NOTE = {
  text: `A teenager with a dose before ${AT16} for travel, laboratory work or an outbreak still gets the ${YEAR16} booster.`,
  decision: 'routine16First',
  ex: [P.travel15],
};

// ── 4. MenB ──────────────────────────────────────────────────────────────
export const MENB_HEALTHY = {
  lead: `Healthy patients aged ${MENB_WINDOW} may be offered MenB by shared clinical decision-making, preferably at ${MENB_PREFERRED}.`,
  doses: ['Dose 1', `≥${mo(MENB_HEALTHY_D2_MONTHS)}`],
  rows: [
    { text: `Dose 2 given <${mo(MENB_HEALTHY_D2_MONTHS)} after dose 1 counts. Give dose 3 ≥${mo(MENB_HEALTHY_RESCUE_MONTHS)} after dose 2.`, ex: [P.menbHealthyEarly] },
    { text: `A dose before ${AT16} does not count.`, decision: 'healthyMenbBefore16', ex: [P.menbPre16] },
  ],
  ex: [P.menbHealthy17, P.menbHealthy12, P.healthy25],
};
export const MENB_HIGHRISK = {
  // R59 (owner, 2026-11-20): the conditions in short clinical words, held to the
  // app's own MenB high-risk list by the Batch 5 test.
  lead: `Asplenia (including sickle cell disease), complement deficiency or a complement inhibitor, lab work with meningococcus, or a serogroup B outbreak. From ${AT10}, with no upper age limit.`,
  doses: ['Dose 1', `${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} after dose 1 (at least ${wk(MENB_HIGHRISK_D2_GAP)})`, `≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1 and ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2`],
  rows: [
    { text: `No dose 3 is needed if dose 2 was ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1.`, ex: [P.menbD2at6] },
    { text: `Dose 3 given <${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2 counts. Give dose 4 ≥${mo(MENB_HIGHRISK_EARLY_D3_RESCUE_MONTHS)} after dose 3.`, ex: [P.menbD3early] },
    { text: `No dose 4 is needed if dose 3 was ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1.`, ex: [P.menbD3unless] },
    { text: `Dose 3 ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2 counts, even <${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1.`, decision: 'menbDose3FromDose2', ex: [P.menbD3fromD2] },
    { text: `The first booster is ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, later ones every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while at risk (the app dates each at ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)}). A booster given sooner does not count.`, ex: [P.menbBoosterDue] },
    { text: 'Serogroup B outbreak alone: one booster, then complete.', ex: [P.menbOutbreakDone] },
    { text: 'HIV alone does not change MenB. Follow the healthy schedule.', ex: [P.hiv14] },
  ],
  ex: [P.menbAsp12, P.menbAsp9],
};
export const MENB_PREGNANCY = { text: 'Wait until after pregnancy, unless a MenB high-risk condition is present.', ex: [P.pregnant20, P.pregnantAsp] };

// ── 5. The combined shot ─────────────────────────────────────────────────
export const PENTA_ROWS = [
  { text: `Offered when MenACWY is due today, MenB is due or can be given today, and the patient is ${age(PENTAVALENT_MIN_AGE_MONTHS)} or older.`, ex: [P.healthy16, P.menbAsp9] },
  { text: `The product must match the earlier MenB doses: ${PENMENVY} after ${BEXSERO}, ${PENBRAYA} after ${TRUMENBA}.`, ex: [P.pentaFamily] },
  { text: `Not within ${mo(PENTAVALENT_REPEAT_MONTHS)} of the last dose of the same product: give the two vaccines separately.`, ex: [P.pentaRecent] },
  { text: 'Not offered while a dose on the record reads Needs input.', ex: [P.pentaWaits] },
  { text: 'A combined shot on the record counts as a MenACWY dose and a MenB dose, whichever list it is entered in.', ex: [P.pentaInRecord] },
];

// ── 6. Doses on the record ───────────────────────────────────────────────
/** Every dose label, each paired with a patient whose dose really reads so. */
export const CHIP_LEGEND = [
  { chip: 'Dose 2 of 2', tone: 'valid', text: 'Valid dose, with its place in the series. Just "Dose 1" when nothing more is owed.', ex: [P.healthy17done] },
  { chip: 'Booster', tone: 'valid', text: 'Valid booster after a completed series.', ex: [P.boosterChip] },
  { chip: 'Not counted — repeat', tone: 'invalid', text: 'Minimum age or minimum interval not met, or the MenB product is not interchangeable with the first. The line below gives the repeat date.', ex: [P.acwyTooSoon] },
  { chip: 'Not counted — do not repeat', tone: 'invalid', text: 'Invalid dose, but no further dose is owed.', ex: [P.doNotRepeat] },
  { chip: `Not counted — given before age ${y(MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS)}`, tone: 'extra', text: `Routine MenACWY before ${AT10}. The teen series starts at ${ROUTINE_D1}.`, ex: [P.healthy13pre10] },
  { chip: `Not counted — given before age ${y(MENB_HEALTHY_MIN_AGE_MONTHS)}`, tone: 'extra', text: `Healthy MenB before ${AT16}. The series starts at ${AT16} or older.`, decision: 'healthyMenbBefore16', ex: [P.menbPre16] },
  { chip: 'Not counted — Extra. Do not repeat.', tone: 'extra', text: 'Given when no dose was recommended.', decision: 'extraDose', ex: [P.extraAcwy] },
  { chip: 'No date recorded — not counted', tone: 'unknown', text: 'Only dated records count. Add the date to have the dose checked.', ex: [P.undated] },
  { chip: 'Date is in the future — not counted', tone: 'unknown', text: 'A typing mistake or a visit not yet held. Correct the date.', ex: [P.future] },
  { chip: 'Entered twice — this row not counted', tone: 'unknown', text: 'Same date as a dose already counted. Remove the row.', ex: [P.duplicate] },
  { chip: 'Needs input', tone: 'input', text: 'Was the patient high-risk on that date? Answer beside the dose.', decision: 'riskAtDose', ex: [P.riskAsk] },
];

export const GRACE = {
  text: `A dose up to ${GRACE_DAYS} days before the minimum age or interval is valid (${GRACE_DAYS}-day grace period). The card still shows the full date.`,
  decision: 'graceFewerDoses',
  ex: [P.grace16],
};

/** Minimum intervals: a dose given sooner does not count, unless the row says otherwise. */
export const INTERVALS = [
  { doses: 'Any two MenACWY doses', gap: W8, ex: [P.acwyTooSoon] },
  { doses: 'MenACWY infant series, final dose', gap: INFANT_FINAL_STEP, ex: [P.asp9m] },
  { doses: 'MenACWY booster', gap: `${B3} after a series ending before ${AT7}, otherwise ${MENACWY_FIRST_BOOSTER_YEARS_FROM_7}, then ${EVERY5} after the last booster`, decision: 'boosterMinimum', ex: [P.aspBoosterEarly, P.military19] },
  { doses: 'Any two MenB doses', gap: W4, ex: [P.menbHealthy3wk] },
  { doses: 'Healthy MenB dose 2', gap: mo(MENB_HEALTHY_D2_MONTHS), text: `Sooner still counts; dose 3 is added.`, ex: [P.menbHealthyEarly] },
  { doses: 'High-risk MenB dose 3', gap: `${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2`, text: 'Sooner still counts; dose 4 is added.', ex: [P.menbD3early] },
  { doses: 'High-risk MenB booster', gap: `${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)} after the last booster`, decision: 'boosterMinimum', ex: [P.menbBoosterEarly] },
];

export const NOT_COUNTED = [
  { text: 'Repeat that dose only. Do not restart the series.', ex: [P.acwyTooSoon] },
  // R91 (owner, 2026-11-20): "at least". menbHealthy3wk's repeat is due 6 months after dose 1.
  { text: 'The repeat is given at least the minimum interval after the invalid dose.', ex: [P.acwyTooSoon, P.menbHealthy3wk] },
  { text: `A too-young first dose: the repeat waits ${W8} (MenACWY) or ${W4} (MenB) after it.`, decision: 'repeatAfterTooYoung', ex: [P.unknown6wk] },
  { text: `A routine MenACWY dose before ${AT10} does not count, but the next dose still waits ${W8} after it.`, decision: 'setAsideClock', ex: [P.setAside] },
  { text: 'Finish with the first MenB product. The card also offers finishing with the other.', ex: [P.wrongFamily] },
];

/** Which parts of the page name each decision (for "Applies in"). */
export const DECISION_USES = Object.fromEntries(DECISIONS.map((d) => [d.key, [
  [TRANSPLANT_STOP, 'Transplant stop'],
  ...VACCINE_ROWS.flatMap((g) => g.rows).map((r) => [r, HEADINGS.vaccines]),
  ...ACWY_HIGHRISK_LANES.map((r) => [r, HEADINGS.acwy]),
  ...ACWY_OTHER.map((r) => [r, HEADINGS.acwy]), [ACWY_OTHER_NOTE, HEADINGS.acwy],
  ...MENB_HEALTHY.rows.map((r) => [r, HEADINGS.menb]), ...MENB_HIGHRISK.rows.map((r) => [r, HEADINGS.menb]),
  ...CHIP_LEGEND.map((r) => [r, HEADINGS.record]), [GRACE, HEADINGS.record],
  ...INTERVALS.map((r) => [r, HEADINGS.record]), ...NOT_COUNTED.map((r) => [r, HEADINGS.record]),
].filter(([row]) => decisionsOf(row).includes(d.key)).map(([, where]) => where).filter((w, i, a) => a.indexOf(w) === i)]));

// ── 8. Sources ───────────────────────────────────────────────────────────
// One entry per document (its page, without the #fragment), with how many of
// its sentences the app quotes and the latest date one was read.
const pageOf = (url) => url.split('#')[0];
export const SOURCE_DOCS = Object.values(Object.values(CITATIONS).reduce((acc, c) => {
  if (!c?.url) return acc;
  const k = pageOf(c.url);
  const d = acc[k] ?? (acc[k] = { url: k, name: c.short, title: null, quotes: 0, lastVerified: null });
  // The document's own title comes from the entry that cites the whole page
  // (no #fragment, no sentence), never from one table or section of it.
  if (!c.quote && c.url === k) d.title = c.label;
  if (c.quote) d.quotes += 1;
  if (c.lastVerified && (!d.lastVerified || c.lastVerified > d.lastVerified)) d.lastVerified = c.lastVerified;
  return acc;
}, {})).sort((a, b) => b.quotes - a.quotes || a.name.localeCompare(b.name));

// ═════════════════════════════════════════════════════════════════════════
// D1 (owner, 2026-11-20: "Approve them all", D1 included; placement "New top,
// then 1–8 folded"). The top of the screen: how MeningoVax decides, in seven
// steps, then Quick look. Same rules as the parts below: no typed number, and
// every row carries worked patients that recommend() is run on.
// ═════════════════════════════════════════════════════════════════════════

/** How MeningoVax decides: seven steps, in the engine's order. */
export const PATH_STEPS = [
  {
    key: 'stop',
    title: 'Stop check',
    sum: 'A transplant, CAR-T therapy or B-cell therapy stops the app.',
    ask: 'Has the patient had a stem cell transplant, CAR-T therapy, a B-cell cancer or B-cell-depleting therapy?',
    head: ['Answer', 'What the app does'],
    rows: [
      { who: 'Yes', lead: 'The app stops.', rest: `It shows only "${TRANSPLANT_STOP.text.split('.')[0]}."`, tone: 'stop', ex: [P.transplant] },
      { who: 'No', rest: 'The app goes on to the next step.', ex: [P.healthy11] },
    ],
    next: 'If the answer is yes, follow your institution\'s revaccination protocol.',
    decision: 'transplant',
  },
  {
    key: 'record',
    title: 'Read the record',
    sum: 'Each recorded dose is checked and given one label.',
    ask: `Each dose is checked for a date, the minimum age and the minimum interval. Both minimums include the ${GRACE_DAYS}-day grace period. A combined shot counts as one MenACWY dose and one MenB dose.`,
    // The chip, then a one-line reason (owner, 2026-11-19). Each chip is the
    // one its worked patient's dose really shows (guarded like CHIP_LEGEND).
    // Colours stay the app's own: the amber "do not repeat" (Q5) is not built.
    labels: [
      { chip: 'No date recorded — not counted', tone: 'unknown', text: 'No date on the record.', ex: [P.undated] },
      { chip: 'Date is in the future — not counted', tone: 'unknown', text: 'Date is after today.', ex: [P.future] },
      { chip: 'Entered twice — this row not counted', tone: 'unknown', text: 'Same dose entered twice.', ex: [P.duplicate] },
      { chip: 'Not counted — repeat', tone: 'invalid', text: 'Minimum age not met.', ex: [P.unknown6wk] },
      { chip: 'Not counted — repeat', tone: 'invalid', text: 'Minimum interval not met.', ex: [P.acwyTooSoon] },
      { chip: 'Not counted — repeat', tone: 'invalid', text: 'MenB product not interchangeable with the first MenB dose.', ex: [P.wrongFamily] },
      { chip: 'Not counted — do not repeat', tone: 'invalid', text: 'Invalid dose, but no further dose is owed.', ex: [P.doNotRepeat] },
      { chip: `Not counted — given before age ${y(MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS)}`, tone: 'extra', text: `Routine MenACWY before ${AT10}.`, ex: [P.healthy13pre10] },
      { chip: `Not counted — given before age ${y(MENB_HEALTHY_MIN_AGE_MONTHS)}`, tone: 'extra', text: `Healthy MenB before ${AT16}.`, ex: [P.menbPre16] },
      { chip: 'Not counted — Extra. Do not repeat.', tone: 'extra', text: 'Given when no dose was due.', ex: [P.extraAcwy] },
      { chip: 'Needs input', tone: 'input', text: 'Risk status on the dose date unknown.', ex: [P.riskAsk] },
      { chip: 'Dose 2 of 2', tone: 'valid', text: 'Valid dose, with its place in the series.', ex: [P.healthy17done] },
      { chip: 'Booster', tone: 'valid', text: 'Valid booster after a completed series.', ex: [P.boosterChip] },
    ],
    next: 'Repeat only the invalid dose, on the date the card shows. Do not restart the series.',
  },
  {
    key: 'acwy',
    title: 'MenACWY schedule',
    sum: 'The patient\'s risk group determines the doses and the boosters.',
    ask: 'If the patient is in more than one group, the first matching row applies.',
    head: ['Patient', 'What to give'],
    rows: [
      { who: `Under ${AT2Y}, with asplenia, complement deficiency, HIV, travel or an A/C/W/Y outbreak`, lead: 'An infant series', rest: `of ${word(INFANT_FEWEST)} to ${word(INFANT_MOST)} doses. The age at the first dose determines how many are needed.`, ex: [P.asp2m, P.asp9m, P.travelInfant, P.outbreakInfant] },
      { who: `${AT2Y} or older, with asplenia, complement deficiency or HIV`, lead: `${cap(word(MENACWY_HIGHRISK_PRIMARY_TOTAL))} doses,`, rest: `at least ${wk(MENACWY_HIGHRISK_PRIMARY_GAP)} apart, then boosters while at risk.`, ex: [P.asp3y, P.hiv14] },
      { who: 'Travel, or lab work with meningococcus', lead: `${cap(word(MENACWY_SINGLE_TOTAL))} dose,`, rest: 'then boosters while the risk continues.', ex: [P.travel5, P.micro30] },
      { who: RISK_BY_ID.military.label, lead: `${cap(word(MENACWY_SINGLE_TOTAL))} dose.`, rest: 'Boosters are given only if the assignment requires them.', decision: 'militaryAssignment', ex: [P.military25, P.military19] },
      { who: 'A/C/W/Y outbreak', lead: `${cap(word(MENACWY_SINGLE_TOTAL))} dose.`, rest: 'A booster is given only if the outbreak continues.', ex: [P.outbreakA20, P.outbreakA20had] },
      { who: `College residence hall, ${AT16} or older`, lead: `${cap(word(MENACWY_SINGLE_TOTAL))} dose,`, rest: `unless one was given at ${AT16} or older within the last ${yr(MENACWY_COLLEGE_COVER_YEARS)}. No booster follows.`, decision: 'collegeCover', ex: [P.college18, P.college18had16, P.college22] },
      { who: 'None of these', lead: 'The routine schedule:', rest: `a first dose at ${ROUTINE_D1} and a booster at ${AT16}.`, ex: [P.healthy11, P.healthy16] },
    ],
    foot: {
      text: `Under ${AT16}, college and military follow the routine schedule. Under ${AT16}, travel, lab work and an outbreak still get the ${YEAR16} booster, and later boosters are timed from it.`,
      decision: 'routine16First',
      ex: [P.college14, P.military14, P.travel15],
    },
  },
  {
    key: 'menb',
    title: 'MenB schedule',
    sum: `MenB is not routine. High-risk patients start at ${AT10}. Healthy patients aged ${MENB_WINDOW} may choose it.`,
    ask: 'The first matching row applies.',
    head: ['Patient', 'What to give'],
    rows: [
      { who: `Under ${AT10}`, lead: 'Nothing is due yet.', rest: `A high-risk patient starts at ${AT10}.`, ex: [P.menbAsp9] },
      { who: `${AT10} or older, with asplenia, complement deficiency, lab work or a B outbreak`, lead: `${cap(word(MENB_HIGHRISK_TOTAL))} doses:`, rest: `the second ${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} after the first, the third ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after the first. Pregnancy does not delay them.`, ex: [P.menbAsp12, P.micro30, P.outbreakB12, P.pregnantAsp] },
      { who: 'Pregnant without risk factors', lead: 'Wait', rest: 'until after pregnancy.', ex: [P.pregnant20] },
      { who: `Healthy, ${MENB_WINDOW}`, lead: `Offer ${word(MENB_HEALTHY_TOTAL)} doses,`, rest: `${mo(MENB_HEALTHY_D2_MONTHS)} apart, after discussing it with the patient. The preferred age is ${MENB_PREFERRED}.`, ex: [P.menbHealthy17] },
      { who: `Healthy, ${yrsBand(MENB_MIN_AGE_MONTHS, MENB_HEALTHY_MIN_AGE_MONTHS)} or ${age(MENB_HEALTHY_MAX_AGE_MONTHS)} and older`, lead: 'Not routinely recommended.', ex: [P.menbHealthy12, P.healthy25] },
    ],
    foot: { text: 'HIV, travel, military service, college and an A/C/W/Y outbreak do not change the MenB schedule.', ex: [P.hiv14] },
    next: `If a healthy patient chooses MenB, give the first dose today and the second ${mo(MENB_HEALTHY_D2_MONTHS)} later.`,
    nextEx: [P.menbHealthy17today],
  },
  {
    key: 'dates',
    title: 'Set the dates',
    sum: 'The card shows the routine date, and the earliest valid date when it is sooner.',
    rows: [
      { who: 'After a valid dose', rest: 'The next dose is due on the routine date. If the minimum interval allows an earlier date, it is shown beside it.', ex: [P.earliestInfant, P.earliestMenb] },
      // "at least": a healthy MenB dose 2 given too soon is repeated 6 months
      // after dose 1, later than 4 weeks after the invalid dose (menbHealthy3wk).
      { who: 'After an invalid dose', rest: `Repeat only the invalid dose, at least the minimum interval after it: ${W8} for MenACWY, ${W4} for MenB.`, ex: [P.acwyTooSoon, P.unknown6wk, P.menbHealthy3wk] },
      { who: 'A booster', rest: 'Timed from the last dose of the series, or from the last booster.', ex: [P.aspDoneFrom7, P.travel5had, P.menbBoosterDue] },
      { who: `A MenACWY dose within ${GRACE_DAYS} days before age ${orList(MENACWY_GRACE_LINES_M.map(age))}`, rest: 'The app applies the schedule that needs fewer doses.', decision: 'graceFewerDoses', ex: [P.grace16] },
    ],
  },
  {
    key: 'penta',
    title: 'Combined shot (MenABCWY)',
    sum: `${PENMENVY} or ${PENBRAYA} replaces two injections when both vaccines are due.`,
    ask: 'It is offered only when every statement below is true.',
    rows: [
      { who: 'MenACWY is due today.', ex: [P.healthy16] },
      { who: 'MenB is due today, or can be given today.', ex: [P.healthy16, P.pentaFamily] },
      { who: `The patient is ${age(PENTAVALENT_MIN_AGE_MONTHS)} or older.`, ex: [P.menbAsp9] },
      { who: 'It matches the earlier MenB doses.', rest: `${PENMENVY} follows ${BEXSERO}. ${PENBRAYA} follows ${TRUMENBA}.`, ex: [P.pentaFamily] },
      { who: `The same combined shot was not given in the last ${mo(PENTAVALENT_REPEAT_MONTHS)}.`, ex: [P.pentaRecent] },
      { who: 'No dose on the record reads "Needs input."', ex: [P.pentaWaits] },
    ],
    next: 'Otherwise, MenACWY and MenB are given as two injections.',
  },
  {
    key: 'cards',
    title: 'The cards',
    sum: 'This is what the Patient screen shows.',
    rows: [
      { who: 'Each vaccine', rest: 'The card shows the dose due and its date. It says "Up to date" only when nothing is left.', ex: [P.healthy11, P.healthy17done] },
      { who: 'Each recorded dose', rest: 'Each dose has one label, from "Read the record".', ex: [P.boosterChip] },
      { who: '"Why this"', rest: 'This opens the reasons and the CDC or ACIP sentence behind them.', ex: [P.healthy16] },
    ],
  },
];
/** Every worked patient a step names, for its one "Source". */
export const stepExamples = (s) => [...(s.rows ?? []), ...(s.labels ?? [])].flatMap((r) => r.ex ?? [])
  .concat(s.foot?.ex ?? [], s.nextEx ?? []).filter((e, i, a) => a.indexOf(e) === i);

// ── Quick look: who gets what, by age today ──────────────────────────────
// Short bars of one to three words across the ages they cover; blank means
// nothing is due (owner, 2026-11-19). Each row's Details holds a few full
// sentences, and its Sources are the app's own card citations for its
// worked patients.
const bar = (text, span = 1) => ({ text, span, kind: 'give' });
const sd = (text, span = 1) => ({ text, span, kind: 'shared' });
const wait = (text, span = 1) => ({ text, span, kind: 'wait' });
const quiet = (text, span = 1) => ({ text, span, kind: 'quiet' });
const blank = (span = 1) => ({ text: '', span, kind: 'blank' });
const SAME = 'Same as healthy';
const ACWY_BOOSTER_PAIR = `${MENACWY_FIRST_BOOSTER_YEARS_UNDER_7} or ${B5}`;

export const QUICK_LOOK = {
  acwy: {
    name: 'MenACWY',
    cols: [`Under ${AT2Y}`, yrsBand(MENACWY_INFANT_SERIES_MAX_AGE_MONTHS, MENACWY_ROUTINE_DOSE1_AGE_MONTHS), yrsBand(MENACWY_ROUTINE_DOSE1_AGE_MONTHS, MENACWY_ROUTINE_BOOSTER_AGE_MONTHS), yrsBand(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, MENACWY_CATCHUP_MAX_AGE_MONTHS), `${y(MENACWY_CATCHUP_MAX_AGE_MONTHS)}+ years`],
    rows: [
      { key: 'healthy', group: 'Healthy', cells: [blank(), blank(), bar('Dose 1'), bar(`Booster at ${AT16}`), blank()],
        boosters: `At ${AT16}, if the first dose was before ${AT16}`,
        details: [
          `The first dose is given at ${ROUTINE_D1}, or at ${CATCHUP_TEEN} as catch-up.`,
          `A booster is given at ${AT16}, at least ${wk(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} after the first dose.`,
          `A patient with no dose at ${AT16} or older gets one dose by age ${yearBefore(MENACWY_CATCHUP_MAX_AGE_MONTHS)}. No booster follows it.`,
          `From ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)}, MenACWY is not routine for a healthy adult.`,
        ],
        ex: [P.healthy9, P.healthy11, P.healthy14, P.healthy16, P.healthy17, P.healthy20, P.healthy25] },
      { key: 'hr', group: 'Asplenia, complement deficiency, HIV', cells: [bar('Infant series'), bar(`${cap(word(MENACWY_HIGHRISK_PRIMARY_TOTAL))} doses`, 4)],
        boosters: `${ACWY_BOOSTER_PAIR} after the series, then every ${MENACWY_BOOSTER_CADENCE_YEARS}`,
        details: [
          `Under ${AT2Y}, the infant series has ${word(INFANT_FEWEST)} to ${word(INFANT_MOST)} doses. The age at the first dose determines how many are needed.`,
          `From ${AT2Y}, the series is ${word(MENACWY_HIGHRISK_PRIMARY_TOTAL)} doses, at least ${wk(MENACWY_HIGHRISK_PRIMARY_GAP)} apart.`,
          `The first booster is due ${B3} after the last series dose if that dose was given before age ${AT7}, and ${B5} after it otherwise.`,
          `Further boosters follow every ${EVERY5}, each timed from the one before, while the risk lasts.`,
        ],
        ex: [P.asp2m, P.asp9m, P.asp3y, P.hiv14, P.aspDoneBefore7, P.aspDoneFrom7] },
      { key: 'travel', group: 'Travel', cells: [bar('Infant series'), bar(`${cap(word(MENACWY_SINGLE_TOTAL))} dose`, 4)],
        boosters: `${ACWY_BOOSTER_PAIR} after the dose, then every ${MENACWY_BOOSTER_CADENCE_YEARS}`,
        details: [
          `Under ${AT2Y}, the infant series is given. From ${AT2Y}, ${word(MENACWY_SINGLE_TOTAL)} dose.`,
          `The first booster is due ${B3} after that dose if it was given before age ${AT7}, and ${B5} after it otherwise.`,
          `Further boosters follow every ${EVERY5} while travel continues.`,
          `A patient under ${AT16} still gets the routine ${YEAR16} booster first. Later boosters are timed from it.`,
        ],
        ex: [P.travelInfant, P.travel5, P.travel5had, P.travel15] },
      { key: 'acwyout', group: 'A/C/W/Y outbreak', cells: [bar('Infant series'), bar(`${cap(word(MENACWY_SINGLE_TOTAL))} dose`, 4)],
        boosters: `${ACWY_BOOSTER_PAIR} after the dose, if the outbreak continues`,
        details: [
          `Under ${AT2Y}, the infant series is given. From ${AT2Y}, ${word(MENACWY_SINGLE_TOTAL)} dose.`,
          `A booster is given only if the outbreak is still going on: ${B3} after the last dose if it was given before age ${AT7}, and ${B5} after it otherwise.`,
          'When the outbreak ends, uncheck the outbreak box.',
        ],
        ex: [P.outbreakInfant, P.outbreakA20, P.outbreakA20had] },
      { key: 'lab', group: 'Lab work', cells: [bar(`${cap(word(MENACWY_SINGLE_TOTAL))} dose`, 5)],
        boosters: `${EVERY5} after the dose, then every ${MENACWY_BOOSTER_CADENCE_YEARS}`,
        details: [
          `${cap(word(MENACWY_SINGLE_TOTAL))} dose is given, at any age.`,
          `A booster is due every ${EVERY5} while the exposure continues, each timed from the dose before.`,
          'MenB is also given. See the MenB table.',
        ],
        ex: [P.micro30, P.microInfant] },
      { key: 'military', group: 'Military recruit', cells: [quiet(SAME, 4), bar(`${cap(word(MENACWY_SINGLE_TOTAL))} dose`)],
        boosters: `${EVERY5} after the dose, if the assignment requires`,
        // The mockup said "Under 22 years, the routine schedule applies". That is
        // true of the doses but not the booster: a 19-year-old recruit with
        // doses at 11 and 16 owes one "if required by assignment" (military19b).
        details: [
          `Under ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)}, the doses follow the routine schedule. From ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)}, ${word(MENACWY_SINGLE_TOTAL)} dose is given.`,
          `A booster is due ${EVERY5} after the last dose, but only if the assignment requires it.`,
          'The app cannot see the assignment, so the card never says "Complete."',
        ],
        decision: 'militaryAssignment',
        ex: [P.military14, P.military18, P.military19b, P.military25] },
      { key: 'college', group: 'College residence hall', cells: [quiet(SAME, 3), bar(`${cap(word(MENACWY_SINGLE_TOTAL))} dose`, 2)],
        boosters: { quiet: 'None' },
        details: [
          `Under ${AT16}, the routine schedule applies.`,
          `From ${AT16}, ${word(MENACWY_SINGLE_TOTAL)} dose is given before college entry, unless one was given at ${AT16} or older within the last ${yr(MENACWY_COLLEGE_COVER_YEARS)}.`,
          'No booster follows.',
        ],
        decision: 'collegeCover',
        ex: [P.college14, P.college18, P.college18had16, P.college22] },
    ],
    note: { text: 'Serogroup B outbreak and pregnancy: same as healthy.', ex: [P.outbreakB12, P.pregnant15] },
  },
  menb: {
    name: 'MenB',
    cols: [`Under ${AT10}`, yrsBand(MENB_MIN_AGE_MONTHS, MENB_HEALTHY_MIN_AGE_MONTHS), MENB_WINDOW, `${y(MENB_HEALTHY_MAX_AGE_MONTHS)}+ years`],
    rows: [
      { key: 'bhealthy', group: 'Healthy', cells: [blank(), blank(), sd(`${cap(word(MENB_HEALTHY_TOTAL))} doses`), blank()],
        boosters: { quiet: 'None' },
        details: [
          `MenB is offered after discussion with the patient: ${word(MENB_HEALTHY_TOTAL)} doses, ${mo(MENB_HEALTHY_D2_MONTHS)} apart. The preferred age is ${MENB_PREFERRED}.`,
          `If the second dose came less than ${mo(MENB_HEALTHY_D2_MONTHS)} after the first, a third dose is given at least ${mo(MENB_HEALTHY_RESCUE_MONTHS)} after the second.`,
          `A dose before ${AT16} does not count. No booster follows the series.`,
        ],
        ex: [P.menbHealthy12, P.menbHealthy17, P.menbHealthyEarly, P.menbPre16, P.healthy25] },
      { key: 'bhr', group: 'Asplenia, complement deficiency, lab work', cells: [blank(), bar(`${cap(word(MENB_HIGHRISK_TOTAL))} doses`, 3)],
        boosters: `${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL.replace(/ years$/, '')}`,
        details: [
          `From ${AT10}, with no upper age limit, the series is ${word(MENB_HIGHRISK_TOTAL)} doses: the second ${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} after the first (ACIP allows ${MENB_D2_ACIP_RANGE}), the third ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after the first.`,
          `If the second dose came ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} or more after the first, a third dose is not needed.`,
          `The first booster is due ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the last series dose. Further boosters follow every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while the risk lasts. The app dates each one ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)} after the last.`,
        ],
        ex: [P.menbAsp9, P.menbAsp12, P.micro30, P.menbD2at6, P.menbBoosterDue, P.menbOutbreakAsp] },
      { key: 'bout', group: 'Serogroup B outbreak', cells: [blank(), bar(`${cap(word(MENB_HIGHRISK_TOTAL))} doses`, 3)],
        boosters: `One, ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series`,
        details: [
          `The series is ${word(MENB_HIGHRISK_TOTAL)} doses: the second ${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} after the first (ACIP allows ${MENB_D2_ACIP_RANGE}), the third ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after the first.`,
          `One booster is given ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the last series dose, if the outbreak is still going on. No further boosters follow.`,
        ],
        ex: [P.outbreakB12, P.menbOutbreakDone] },
      { key: 'preg', group: 'Pregnancy', cells: [wait('Wait until after pregnancy', 4)],
        boosters: null,
        details: [
          'MenB waits until after pregnancy.',
          `A patient with asplenia, complement deficiency, lab exposure or a serogroup B outbreak gets the ${word(MENB_HIGHRISK_TOTAL)}-dose series now.`,
        ],
        ex: [P.pregnant20, P.pregnantAsp] },
    ],
    note: { text: 'HIV, travel, military, college and an A/C/W/Y outbreak: same as healthy.', ex: [P.hiv14] },
  },
};
