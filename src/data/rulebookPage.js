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
//   • In the order the app decides: the stop check, the vaccines, MenACWY,
//     MenB, more than one condition, the combined shot, doses on the record,
//     then the app's own decisions and the sources. Each part is one fold,
//     all closed when the screen opens (Rulebook reorganization, owner
//     2026-11-20, docs/archive/decisions-2026-11-20-rulebook-reorg.md).
//   • Each thing is said once. Every schedule is a table: Dose | Routine |
//     Minimum interval, the minimum being the shortest gap at which a dose
//     still counts.
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
  MENB_HEALTHY_D2_MONTHS, MENB_HEALTHY_RESCUE_MONTHS,
  GRACE_DAYS, MENACWY_GRACE_LINES_M, PENTAVALENT_REPEAT_MONTHS, weeksLabel, monthsLabel, yearsLabel,
} from '../logic/intervals.js';
import {
  MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS, MENACWY_LICENCE_MIN_AGE_DAYS,
  MENACWY_UNKNOWN_BRAND_MIN_AGE_MONTHS, MENB_MIN_AGE_MONTHS, PENTAVALENT_MIN_AGE_MONTHS,
} from './brands.js';
import { RISK_BY_ID } from './riskFactors.js';
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
  // The routine booster's minimum is 16 years as well as 8 weeks (engine, 2026-11-20).
  boosterAt15: ex('Healthy 16-year-old, MenACWY at 11 and again at 15', { dob: '2010-06-01', menacwyDoses: doses(MV, '2021-07-01', '2026-01-01') },
    { acwy: [/^Booster \(16y\)$/], chip: ['MenACWY', 1, 'Not counted — given before age 16'] }),

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
    // M1 (owner, 2026-11-20): not counted, repeated (was "Dose 3 of 4", then "Dose 4 of 4").
    { menb: [/^Dose 3 of 3 \(high-risk, Bexsero\)$/], chip: ['MenB', 2, 'Not counted — repeat'] }),
  menbD3unless: ex('20-year-old with asplenia, dose 3 2 months after dose 2 and 6 months after dose 1', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2026-01-01', '2026-05-01', '2026-07-05') },
    { menb: [/^First booster \(dose 4\), 1 year after the series$/], chip: ['MenB', 2, 'Dose 3 of 3'] }),
  menbD3fromD2: ex('20-year-old with asplenia, dose 3 4 months after dose 2 but 5 months after dose 1', { dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: doses(MV, '2020-01-01', '2020-03-01', '2025-03-01'), menbDoses: doses(BX, '2026-01-01', '2026-01-29', '2026-05-30') },
    { menb: [/^First booster \(dose 4\), 1 year after the series$/], chip: ['MenB', 2, 'Dose 3 of 3'] }),
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

  // D1 (2026-11-20): the seven steps and the group tables
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

/**
 * The folds of the page. The six steps of "How MeningoVax decides", in the
 * order the app decides, each holding its own section; then the Reference
 * folds. Every fold is closed when the screen opens; "Show all" opens them all
 * (owner, 2026-11-21, "Steps hold their sections", replacing the nine
 * separate parts of 2026-11-20). PATH_STEPS takes its titles from here.
 */
export const HEADINGS = {
  stop: 'Stop check',
  record: 'Read the record',
  acwy: 'MenACWY schedule',
  menb: 'MenB schedule',
  dates: 'Set the dates',
  penta: 'Combined shot (MenABCWY)',
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

// ── The stop check ───────────────────────────────────────────────────────
export const TRANSPLANT_STOP = {
  title: RISK_BY_ID.hct_cart_bcell_exclude.label,
  text: 'Individualized revaccination schedule required. No recommendation is shown.',
  decision: 'transplant',
  ex: [P.transplant],
};

// ── The vaccines ─────────────────────────────────────────────────────────
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
// Reorganization item 5 (owner, 2026-11-20): no "Counts as" column.
const vaccineRow = (type) => (b) => ({ key: b.key, name: b.key, type, minAge: brandMinAge(b), use: USE[b.key],
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
  // Item 5: moved here from "A dose that does not count".
  finish: 'Finish with the first MenB product. The card also offers finishing with the other.',
  ex: [P.wrongFamily],
};

// The infant series runs from the fewest doses (dose 1 at 7 months or older)
// to the most (dose 1 at 2 months), as the engine counts them.
const INFANT_FEWEST = menacwyInfantHighRiskTotal({ d1AgeM: MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS });
const INFANT_MOST = menacwyInfantHighRiskTotal({ d1AgeM: MENACWY_SCHEDULE_MIN_AGE_MONTHS });
/** R48, R87: the final infant dose, saying what each number is. */
const INFANT_FINAL_STEP = `≥${W12} after the last dose, at age ≥${AT12M}`;

// ── Group tables: Group | Doses | Boosters (item 4) ──────────────────────
// Plain words, no age columns and no chips. Only a shared decision (blue) and
// a wait (amber) are tinted. Details opens the same short panel as before.
// `ids`: the conditions a row (or the note) covers, so a test can hold the two
// tables to the app's own list of conditions (the risk-group table is gone).
const ACWY_BOOSTER_PAIR = `${MENACWY_FIRST_BOOSTER_YEARS_UNDER_7} or ${B5}`;
const ONE = cap(word(MENACWY_SINGLE_TOTAL));
const INFANT_THEN = (n) => `Infant series under ${AT2Y}. ${cap(word(n))} dose${n === 1 ? '' : 's'} at ${AT2Y} or older.`;

export const ACWY_GROUPS = {
  rows: [
    { key: 'healthy', ids: [], group: 'Healthy', doses: `${ONE} dose at ${ROUTINE_D1}`,
      boosters: `At ${AT16}, if the first dose was before ${AT16}`,
      details: [
        `The first dose is given at ${ROUTINE_D1}, or at ${CATCHUP_TEEN} as catch-up.`,
        `A booster is given at ${AT16}, at least ${wk(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} after the first dose.`,
        `A patient with no dose at ${AT16} or older gets one dose by age ${yearBefore(MENACWY_CATCHUP_MAX_AGE_MONTHS)}. No booster follows it.`,
        `From ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)}, MenACWY is not routine for a healthy adult.`,
      ],
      ex: [P.healthy9, P.healthy11, P.healthy14, P.healthy16, P.healthy17, P.healthy20, P.healthy25] },
    { key: 'hr', ids: ['asplenia', 'complement', 'hiv'], group: 'Asplenia, complement deficiency, HIV', doses: INFANT_THEN(MENACWY_HIGHRISK_PRIMARY_TOTAL),
      boosters: `${ACWY_BOOSTER_PAIR} after the series, then every ${EVERY5}`,
      details: [
        `Under ${AT2Y}, the infant series has ${word(INFANT_FEWEST)} to ${word(INFANT_MOST)} doses. The age at the first dose determines how many are needed.`,
        `From ${AT2Y}, the series is ${word(MENACWY_HIGHRISK_PRIMARY_TOTAL)} doses, at least ${wk(MENACWY_HIGHRISK_PRIMARY_GAP)} apart.`,
        `The first booster is due ${B3} after the last series dose if that dose was given before age ${AT7}, and ${B5} after it otherwise.`,
        `Further boosters follow every ${EVERY5}, each timed from the one before, while the risk lasts.`,
      ],
      ex: [P.asp2m, P.asp9m, P.asp3y, P.hiv14, P.aspDoneBefore7, P.aspDoneFrom7] },
    { key: 'travel', ids: ['travel'], group: 'Travel', doses: INFANT_THEN(MENACWY_SINGLE_TOTAL),
      boosters: `${ACWY_BOOSTER_PAIR} after the dose, then every ${EVERY5}`,
      details: [
        `Under ${AT2Y}, the infant series is given. From ${AT2Y}, ${word(MENACWY_SINGLE_TOTAL)} dose.`,
        `The first booster is due ${B3} after that dose if it was given before age ${AT7}, and ${B5} after it otherwise.`,
        `Further boosters follow every ${EVERY5} while travel continues.`,
        `A patient under ${AT16} still gets the routine ${YEAR16} booster first. Later boosters are timed from it.`,
      ],
      ex: [P.travelInfant, P.travel5, P.travel5had, P.travel15] },
    { key: 'acwyout', ids: ['outbreak_acwy'], group: 'A/C/W/Y outbreak', doses: INFANT_THEN(MENACWY_SINGLE_TOTAL),
      boosters: `${ACWY_BOOSTER_PAIR} after the dose, if the outbreak continues`,
      details: [
        `Under ${AT2Y}, the infant series is given. From ${AT2Y}, ${word(MENACWY_SINGLE_TOTAL)} dose.`,
        `A booster is given only if the outbreak is still going on: ${B3} after the last dose if it was given before age ${AT7}, and ${B5} after it otherwise.`,
        'When the outbreak ends, uncheck the outbreak box.',
      ],
      ex: [P.outbreakInfant, P.outbreakA20, P.outbreakA20had] },
    { key: 'lab', ids: ['microbiologist'], group: 'Lab work', doses: `${ONE} dose`,
      boosters: `${EVERY5} after the dose, then every ${EVERY5}`,
      details: [
        `${ONE} dose is given, at any age.`,
        `A booster is due every ${EVERY5} while the exposure continues, each timed from the dose before.`,
        'MenB is also given. See the MenB table.',
      ],
      ex: [P.micro30, P.microInfant] },
    { key: 'military', ids: ['military'], group: 'Military recruit',
      doses: `Under ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)}: same as healthy. ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)} or older: ${word(MENACWY_SINGLE_TOTAL)} dose.`,
      boosters: `${EVERY5} after the dose, if the assignment requires`,
      // "Same as healthy" is true of the doses but not the booster: a 19-year-old
      // recruit with doses at 11 and 16 owes one "if required by assignment" (military19b).
      details: [
        `Under ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)}, the doses follow the routine schedule. From ${age(MENACWY_CATCHUP_MAX_AGE_MONTHS)}, ${word(MENACWY_SINGLE_TOTAL)} dose is given.`,
        `A booster is due ${EVERY5} after the last dose, but only if the assignment requires it.`,
        'The app cannot see the assignment, so the card never says "Complete."',
      ],
      decision: 'militaryAssignment',
      ex: [P.military14, P.military18, P.military19b, P.military25] },
    { key: 'college', ids: ['college_dorm'], group: 'College residence hall',
      doses: `${ONE} dose at ${AT16} or older, unless one was given in the last ${yr(MENACWY_COLLEGE_COVER_YEARS)}`,
      boosters: 'None',
      details: [
        `Under ${AT16}, the routine schedule applies.`,
        `From ${AT16}, ${word(MENACWY_SINGLE_TOTAL)} dose is given before college entry, unless one was given at ${AT16} or older within the last ${yr(MENACWY_COLLEGE_COVER_YEARS)}.`,
        'No booster follows.',
      ],
      decision: 'collegeCover',
      ex: [P.college14, P.college18, P.college18had16, P.college22] },
  ],
  note: { ids: ['outbreak_b', 'pregnancy'], text: 'Serogroup B outbreak and pregnancy: same as healthy.', ex: [P.outbreakB12, P.pregnant15] },
};

export const MENB_GROUPS = {
  rows: [
    { key: 'bhealthy', ids: [], group: `Healthy, ${MENB_WINDOW}`, doses: `${cap(word(MENB_HEALTHY_TOTAL))} doses, by shared clinical decision-making`, tone: 'shared',
      boosters: 'None',
      details: [
        `MenB is offered after discussion with the patient: ${word(MENB_HEALTHY_TOTAL)} doses, ${mo(MENB_HEALTHY_D2_MONTHS)} apart. The preferred age is ${MENB_PREFERRED}.`,
        `If the second dose came less than ${mo(MENB_HEALTHY_D2_MONTHS)} after the first, a third dose is given at least ${mo(MENB_HEALTHY_RESCUE_MONTHS)} after the second.`,
        `A dose before ${AT16} does not count. No booster follows the series.`,
      ],
      ex: [P.menbHealthy12, P.menbHealthy17, P.menbHealthyEarly, P.menbPre16, P.healthy25] },
    { key: 'bhr', ids: ['asplenia', 'complement', 'microbiologist'], group: 'Asplenia, complement deficiency, lab work', doses: `${cap(word(MENB_HIGHRISK_TOTAL))} doses, from ${AT10}`,
      boosters: `${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL}`,
      details: [
        `From ${AT10}, with no upper age limit, the series is ${word(MENB_HIGHRISK_TOTAL)} doses: the second ${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} after the first (ACIP allows ${MENB_D2_ACIP_RANGE}), the third ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after the first.`,
        `If the second dose came ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} or more after the first, a third dose is not needed.`,
        `The first booster is due ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the last series dose. Further boosters follow every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL} while the risk lasts. The app dates each one ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)} after the last.`,
      ],
      ex: [P.menbAsp9, P.menbAsp12, P.micro30, P.menbD2at6, P.menbBoosterDue, P.menbOutbreakAsp] },
    { key: 'bout', ids: ['outbreak_b'], group: 'Serogroup B outbreak', doses: `${cap(word(MENB_HIGHRISK_TOTAL))} doses, from ${AT10}`,
      boosters: `One, ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series`,
      details: [
        `The series is ${word(MENB_HIGHRISK_TOTAL)} doses: the second ${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} after the first (ACIP allows ${MENB_D2_ACIP_RANGE}), the third ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after the first.`,
        `One booster is given ${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the last series dose, if the outbreak is still going on. No further boosters follow.`,
      ],
      ex: [P.outbreakB12, P.menbOutbreakDone] },
    { key: 'preg', ids: ['pregnancy'], group: 'Pregnancy', doses: 'Wait until after pregnancy', tone: 'wait',
      boosters: null,
      details: [
        'MenB waits until after pregnancy.',
        `A patient with asplenia, complement deficiency, lab exposure or a serogroup B outbreak gets the ${word(MENB_HIGHRISK_TOTAL)}-dose series now.`,
      ],
      ex: [P.pregnant20, P.pregnantAsp] },
  ],
  note: { ids: ['hiv', 'travel', 'military', 'college_dorm', 'outbreak_acwy'], text: 'HIV, travel, military, college and an A/C/W/Y outbreak: same as healthy.', ex: [P.hiv14] },
};

// ── Schedules: Dose | Routine | Minimum interval (item 6) ────────────────
// "Minimum interval" holds the TRUE minimum: the shortest gap at which a dose
// still counts. A first dose has no interval, so its cell gives the minimum
// age, or a dash where The vaccines table gives it by product.
const NONE = '—';
const row = (dose, routine, min, extra = {}) => ({ dose, routine, min, ...extra });
const W8E = wk(MENACWY_INFANT_EARLY_GAP);
const INFANT_FINAL = (after) => `${W12} after ${after}, at ${AT12M} or older`;

export const ACWY_ROUTINE = {
  title: 'Routine, no risk factor',
  rows: [
    row('Dose 1', ROUTINE_D1, `Minimum age ${age(MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS)}`),
    row('Booster', AT16, `${wk(MENACWY_ROUTINE_BOOSTER_MIN_GAP)} after dose 1, at ${AT16} or older`),
  ],
  ex: [P.healthy11, P.healthy16, P.healthy13pre10, P.boosterAt15],
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
];

/** The high-risk series, one table per age at dose 1. */
export const ACWY_HIGHRISK_TABLES = [
  {
    start: age(MENACWY_SCHEDULE_MIN_AGE_MONTHS),
    rows: [
      row('Dose 1', age(INFANT_AGES[0]), NONE),
      row('Dose 2', age(INFANT_AGES[1]), `${W8E} after dose 1`),
      row('Dose 3', age(INFANT_AGES[2]), `${W8E} after dose 2`),
      row('Dose 4', age(INFANT_AGES[3]), INFANT_FINAL('dose 3')),
    ],
    note: `If dose 2 comes at ${AT7M} or older: ${INFANT_AGES.length - 1} doses in all.`,
    decision: 'infantFellBehind',
    ex: [P.asp2m, P.fellBehind, P.earliestInfant],
  },
  {
    start: moBand(MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS),
    rows: [
      row('Dose 1', moBand(MENACWY_INFANT_EARLY_START_MIN_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS), NONE),
      row('Dose 2', `${W8E} after dose 1`, `${W8E} after dose 1`),
      row(`Dose 3, if dose 2 was before ${AT7M}`, `${W8E} after dose 2`, `${W8E} after dose 2`),
      row('Final dose', INFANT_FINAL('the last dose'), INFANT_FINAL('the last dose')),
    ],
    ex: [P.asp4m],
  },
  {
    start: moBand(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS, MENACWY_INFANT_SERIES_MAX_AGE_MONTHS),
    rows: [
      row('Dose 1', moBand(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS, MENACWY_INFANT_SERIES_MAX_AGE_MONTHS), NONE),
      row('Dose 2', INFANT_FINAL('dose 1'), INFANT_FINAL('dose 1')),
    ],
    ex: [P.asp9m],
  },
  {
    start: `${AT2Y} or older`,
    rows: [
      row('Dose 1', `${AT2Y} or older`, NONE),
      row('Dose 2', `${wk(MENACWY_HIGHRISK_PRIMARY_GAP)} after dose 1`, `${wk(MENACWY_HIGHRISK_PRIMARY_GAP)} after dose 1`),
    ],
    ex: [P.asp3y, P.acwyTooSoon],
  },
];
export const ACWY_HIGHRISK_NOTES = {
  lead: 'The age at dose 1 sets the series. Travel and an A/C/W/Y outbreak use the same infant series.',
  boosters: `The first booster is ${B3} after the series if it ended before ${AT7}, otherwise ${B5}. Each later booster is ${EVERY5} after the last, while at risk.`,
  boostersEx: [P.aspDoneBefore7, P.aspDoneFrom7],
};

export const MENB_HEALTHY = {
  title: 'Healthy: shared clinical decision-making',
  rows: [
    row('Dose 1', `${MENB_WINDOW}, preferably ${MENB_PREFERRED}`, `Minimum age ${AT16}`, { decision: 'healthyMenbBefore16' }),
    row('Dose 2', `${mo(MENB_HEALTHY_D2_MONTHS)} after dose 1`, `${W4} after dose 1`),
  ],
  // Item 6: a sooner dose 2 still counts, so one line under the table says what
  // happens in between.
  note: { text: `Dose 2 given <${mo(MENB_HEALTHY_D2_MONTHS)} after dose 1 counts. Give dose 3 ≥${mo(MENB_HEALTHY_RESCUE_MONTHS)} after dose 2.`, ex: [P.menbHealthyEarly] },
  ex: [P.menbHealthy17, P.menbHealthy12, P.healthy25, P.menbPre16, P.menbHealthyEarly, P.menbHealthy3wk],
};
export const MENB_HIGHRISK = {
  title: 'High risk',
  rows: [
    row('Dose 1', `From ${AT10}`, `Minimum age ${AT10}`),
    row('Dose 2', `${mo(MENB_HIGHRISK_D2_ROUTINE_MONTHS)} after dose 1`, `${wk(MENB_HIGHRISK_D2_GAP)} after dose 1`),
    row('Dose 3', `${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1 and ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2, whichever is later`,
      `${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2, or ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1`),
    row('Booster', `${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then every ${MENB_HIGHRISK_BOOSTER_CADENCE_LABEL}`,
      `${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)} after the last booster`),
  ],
  note: { text: `No dose 3 is needed if dose 2 was ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1.`, ex: [P.menbD2at6] },
  ex: [P.menbAsp12, P.menbAsp9, P.earliestMenb, P.menbD3early, P.menbD3unless, P.menbD3fromD2, P.menbBoosterDue, P.menbBoosterEarly],
};
/** Item 7: "If dose 3 was early", one table (M1, owner 2026-11-20, follow CDSI). */
export const MENB_DOSE3_EARLY = {
  title: 'If dose 3 was early',
  rows: [
    { given: `<${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2 and <${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1`, result: `Not counted. Repeat it ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after that dose.`, ex: [P.menbD3early] },
    { given: `<${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2, ≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1`, result: 'Counts. Series complete.', ex: [P.menbD3unless] },
    { given: `≥${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2, <${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1`, result: 'Counts. Series complete.', decision: 'menbDose3FromDose2', ex: [P.menbD3fromD2] },
  ],
};
export const MENB_OTHER = [
  { text: 'Serogroup B outbreak alone: one booster, then complete.', ex: [P.menbOutbreakDone] },
  { text: 'HIV alone does not change MenB. Follow the healthy schedule.', ex: [P.hiv14] },
];
export const MENB_PREGNANCY = { text: 'Wait until after pregnancy, unless a MenB high-risk condition is present.', ex: [P.pregnant20, P.pregnantAsp] };

// ── More than one condition ──────────────────────────────────────────────
// (Owner, 2026-11-19: "one dose over the routine schedule" was confusing.)
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

/**
 * "More than one condition", split by vaccine (owner, 2026-11-21): the MenACWY
 * rows sit under the MenACWY step and the MenB rows under the MenB step. The
 * row's label drops its "MenACWY: " or "MenB: " prefix, since the step names
 * the vaccine.
 */
export function riskRankingFor(vaccine) {
  const prefix = `${vaccine}: `;
  return RISK_RANKING.steps.filter((s) => s.name.startsWith(prefix)).map((s) => {
    const rest = s.name.slice(prefix.length);
    return { ...s, name: rest.charAt(0).toUpperCase() + rest.slice(1) };
  });
}

// ── The combined shot ────────────────────────────────────────────────────
export const PENTA_ROWS = [
  { text: `Offered when MenACWY is due today, MenB is due or can be given today, and the patient is ${age(PENTAVALENT_MIN_AGE_MONTHS)} or older.`, ex: [P.healthy16, P.menbAsp9] },
  { text: `The product must match the earlier MenB doses: ${PENMENVY} after ${BEXSERO}, ${PENBRAYA} after ${TRUMENBA}.`, ex: [P.pentaFamily] },
  { text: `Not within ${mo(PENTAVALENT_REPEAT_MONTHS)} of the last dose of the same product: give the two vaccines separately.`, ex: [P.pentaRecent] },
  { text: 'Not offered while a dose on the record reads Needs input.', ex: [P.pentaWaits] },
  { text: 'A combined shot on the record counts as a MenACWY dose and a MenB dose, whichever list it is entered in.', ex: [P.pentaInRecord] },
];

// ── Doses on the record ──────────────────────────────────────────────────
/** Every dose label, each paired with a patient whose dose really reads so. */
export const CHIP_LEGEND = [
  { chip: 'Dose 2 of 2', tone: 'valid', text: 'Valid dose, with its place in the series. Just "Dose 1" when nothing more is owed.', ex: [P.healthy17done] },
  { chip: 'Booster', tone: 'valid', text: 'Valid booster after a completed series.', ex: [P.boosterChip] },
  { chip: 'Not counted — repeat', tone: 'invalid', text: 'Minimum age or minimum interval not met, or the MenB product is not interchangeable with the first. The line below gives the repeat date.', ex: [P.acwyTooSoon] },
  { chip: 'Not counted — do not repeat', tone: 'invalid', text: 'Invalid dose, but no further dose is owed.', ex: [P.doNotRepeat] },
  { chip: `Not counted — given before age ${y(MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS)}`, tone: 'extra', text: `Routine MenACWY before ${AT10}. The teen series starts at ${ROUTINE_D1}.`, ex: [P.healthy13pre10] },
  // Owner 2026-11-21 ("Keep two, fix key"): the same label also marks a routine
  // MenACWY booster before 16, so each vaccine has its own row.
  { chip: `Not counted — given before age ${y(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS)}`, tone: 'extra', text: `Routine MenACWY booster before ${AT16}. The booster is given at ${AT16} or older.`, ex: [P.boosterAt15] },
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

/** Minimum intervals: a dose given sooner does not count (item 9: every row). */
export const INTERVALS = [
  { doses: 'Any two MenACWY doses', gap: W8, ex: [P.acwyTooSoon] },
  { doses: 'MenACWY infant series, final dose', gap: INFANT_FINAL_STEP, ex: [P.asp9m] },
  { doses: 'MenACWY booster', gap: `${B3} after a series ending before ${AT7}, otherwise ${MENACWY_FIRST_BOOSTER_YEARS_FROM_7}, then ${EVERY5} after the last booster`, decision: 'boosterMinimum', ex: [P.aspBoosterEarly, P.military19] },
  { doses: 'Any two MenB doses', gap: W4, ex: [P.menbHealthy3wk] },
  // M1 (owner, 2026-11-20): sooner no longer counts with a dose 4 added.
  { doses: 'High-risk MenB dose 3', gap: `${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D2)} after dose 2, or ${mo(MENB_HIGHRISK_D3_MONTHS_FROM_D1)} after dose 1`, ex: [P.menbD3early] },
  { doses: 'High-risk MenB booster', gap: `${yr(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)} after the series, then ${yr(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)} after the last booster`, decision: 'boosterMinimum', ex: [P.menbBoosterEarly] },
];
/** Item 9: where a sooner dose still counts, but a dose is added. */
export const SOONER_ADDS = {
  title: 'Sooner counts, but a dose is added',
  rows: [
    { text: `Healthy MenB dose 2 <${mo(MENB_HEALTHY_D2_MONTHS)} after dose 1 counts. Dose 3 is added.`, ex: [P.menbHealthyEarly] },
  ],
};

/** Item 8: "A dose that does not count", general rules then special cases. */
export const NOT_COUNTED = {
  general: [
    { text: 'Repeat that dose only. Do not restart the series.', ex: [P.acwyTooSoon] },
    // R91 (owner, 2026-11-20): "at least". menbHealthy3wk's repeat is due 6 months after dose 1.
    { text: 'The repeat is given at least the minimum interval after the invalid dose.', ex: [P.acwyTooSoon, P.menbHealthy3wk] },
  ],
  special: [
    { text: `A too-young first dose: the repeat waits ${W8} (MenACWY) or ${W4} (MenB) after it.`, decision: 'repeatAfterTooYoung', ex: [P.unknown6wk] },
    { text: `A routine MenACWY dose before ${AT10} does not count, but the next dose still waits ${W8} after it.`, decision: 'setAsideClock', ex: [P.setAside] },
  ],
};

/** Which steps of the page name each decision (for "Applies in"). */
export const DECISION_USES = Object.fromEntries(DECISIONS.map((d) => [d.key, [
  [TRANSPLANT_STOP, HEADINGS.stop],
  ...VACCINE_ROWS.flatMap((g) => g.rows).map((r) => [r, HEADINGS.record]),
  ...CHIP_LEGEND.map((r) => [r, HEADINGS.record]),
  ...NOT_COUNTED.general.map((r) => [r, HEADINGS.record]), ...NOT_COUNTED.special.map((r) => [r, HEADINGS.record]),
  ...ACWY_GROUPS.rows.map((r) => [r, HEADINGS.acwy]), ...ACWY_HIGHRISK_TABLES.map((r) => [r, HEADINGS.acwy]),
  ...riskRankingFor('MenACWY').map((r) => [r, HEADINGS.acwy]),
  ...MENB_GROUPS.rows.map((r) => [r, HEADINGS.menb]), ...MENB_HEALTHY.rows.map((r) => [r, HEADINGS.menb]),
  ...MENB_HIGHRISK.rows.map((r) => [r, HEADINGS.menb]), ...MENB_DOSE3_EARLY.rows.map((r) => [r, HEADINGS.menb]),
  ...riskRankingFor('MenB').map((r) => [r, HEADINGS.menb]),
  [GRACE, HEADINGS.dates], ...INTERVALS.map((r) => [r, HEADINGS.dates]),
].filter(([r]) => decisionsOf(r).includes(d.key)).map(([, where]) => where).filter((w, i, a) => a.indexOf(w) === i)]));

// ── Sources (item 10: grouped, no count or read date on screen) ──────────
// One entry per document (its page, without the #fragment). The count of
// quoted sentences and the latest read date stay here and in refs.js; the
// screen shows neither.
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

/** The five groups, in the owner's order; a document goes in the first that fits. */
const SOURCE_GROUP_RULES = [
  ['ACIP recommendations', (u) => /cdc\.gov\/mmwr\//.test(u)],
  ['CDC schedule notes', (u) => /cdc\.gov\/vaccines\/hcp\/imz-schedules\//.test(u)],
  ['Other CDC and ACIP guidance', (u) => /cdc\.gov\//.test(u)],
  ['immunize.org', (u) => /immunize\.org\//.test(u)],
  ['Other', () => true],
];
export const SOURCE_GROUPS = SOURCE_GROUP_RULES.map(([name]) => ({ name, docs: [] }));
for (const d of SOURCE_DOCS) {
  SOURCE_GROUPS[SOURCE_GROUP_RULES.findIndex(([, fits]) => fits(d.url))].docs.push(d);
}

// ── How MeningoVax decides: one fold, six one-sentence steps ─────────────
// Each step is its own fold and holds its section of the page (owner,
// 2026-11-21). Step 7, "The cards", was dropped: it had no section of its own.
// Every step still carries worked patients the guard runs.
export const PATH_STEPS = [
  { key: 'stop', title: HEADINGS.stop,
    sum: 'A transplant, CAR-T therapy or B-cell therapy stops the app.',
    ex: [P.transplant, P.healthy11] },
  { key: 'record', title: HEADINGS.record,
    sum: 'Each recorded dose is checked and given one label.',
    ex: [P.undated, P.future, P.duplicate, P.unknown6wk, P.acwyTooSoon, P.wrongFamily, P.doNotRepeat, P.healthy13pre10, P.menbPre16, P.extraAcwy, P.riskAsk, P.healthy17done, P.boosterChip] },
  { key: 'acwy', title: HEADINGS.acwy,
    sum: 'The patient\'s risk group determines the doses and the boosters.',
    ex: [P.asp2m, P.asp9m, P.asp3y, P.travel5, P.micro30, P.military25, P.outbreakA20, P.college18, P.healthy11, P.healthy16] },
  { key: 'menb', title: HEADINGS.menb,
    sum: `High-risk patients start MenB at ${AT10}, and healthy patients aged ${MENB_WINDOW} may choose it.`,
    ex: [P.menbAsp9, P.menbAsp12, P.menbHealthy17, P.menbHealthy12, P.healthy25] },
  { key: 'dates', title: HEADINGS.dates,
    sum: 'The card shows the routine date, and the earliest valid date when it is sooner.',
    ex: [P.earliestInfant, P.earliestMenb, P.acwyTooSoon] },
  { key: 'penta', title: HEADINGS.penta,
    sum: `${PENMENVY} or ${PENBRAYA} replaces two injections when both vaccines are due.`,
    ex: [P.healthy16, P.pentaFamily, P.menbAsp9, P.pentaRecent, P.pentaWaits] },
];
