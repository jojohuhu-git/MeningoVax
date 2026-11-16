// ── The rule table held against CDC's CDSI rules (port Phase 2.3, M-CDSI-1, 2026-11-15) ──
//
// For each row of the app's rule table (src/logic/doseRules.js) this file
// says which of CDSI's rules it corresponds to, and the comparison is made by
// READING BOTH: the app's number from its own constants, CDSI's from CDC's XML
// file (cdsiRules.mjs). No CDSI number is typed in here.
//
// Each comparison looks at up to four things:
//   number   the same age or gap (8 weeks = 56 days; 2 years = 24 months)
//   grace    both use CDC's 4-day grace, or neither does
//   floor    both refuse to count a dose below the line, or neither does
//            (CDSI's absolute minimum "0 days" means no floor: advice only)
//   absent   the app has no rule here at all, and CDSI has a floor
// and DECLARES which of them differ. The test (cdsi-rule-comparison.test.js)
// recomputes them and fails when the declaration is no longer true, so a
// changed constant, a changed row, or a new CDSI release cannot slip through.
//
// Every difference gets one of three statuses — never a silent one:
//   'wording'  the app follows a sentence CDC/ACIP state in words; CDSI runs
//              behind the wording, and the owner's rules say wording wins
//              (2026-08-10, 2026-10-17). Needs `refs` (keys in refs.js).
//   'owner'    the owner has ruled (date and where it is recorded in `decided`).
//   'open'     a question for the owner at STOP C (`stopC` names which one).
//              NOT a decision: the app keeps doing what it does today.
//
// CDSI is a cross-check, never the authority (scripts/cdsi/README.md).
// ─────────────────────────────────────────────────────────────────────────

import { DOSE_RULES } from '../../src/logic/doseRules.js';
import {
  MENACWY_INFANT_EARLY_GAP, MENACWY_INFANT_FINAL_GAP, MENACWY_HIGHRISK_PRIMARY_GAP,
  MENACWY_ROUTINE_BOOSTER_MIN_GAP, MENACWY_FIRST_BOOSTER_YEARS_UNDER_7, MENACWY_BOOSTER_CADENCE_YEARS,
  MENACWY_REPEAT_DOSE_FLOOR, MENB_HIGHRISK_D2_GAP, MENB_HIGHRISK_D3_MONTHS_FROM_D1,
  MENB_HIGHRISK_D3_MONTHS_FROM_D2, MENB_HIGHRISK_FIRST_BOOSTER_YEARS, MENB_HIGHRISK_BOOSTER_CADENCE_YEARS,
  MENB_HEALTHY_D2_MONTHS, MENB_HEALTHY_RESCUE_MONTHS,
} from '../../src/logic/intervals.js';
import {
  MENACWY_SCHEDULE_MIN_AGE_MONTHS, MENACWY_INFANT_SERIES_MAX_AGE_MONTHS, MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS,
  MENACWY_INFANT_FINAL_MIN_AGE_MONTHS, MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS, MENACWY_ROUTINE_DOSE1_AGE_MONTHS,
  MENACWY_ROUTINE_BOOSTER_AGE_MONTHS, MENACWY_CATCHUP_MIN_AGE_MONTHS, MENACWY_CATCHUP_MAX_AGE_MONTHS,
  MENACWY_BOOSTER_AGE_SPLIT_MONTHS, MENB_HEALTHY_MIN_AGE_MONTHS, MENB_HEALTHY_MAX_AGE_MONTHS,
} from '../../src/logic/ages.js';
import { duration } from './cdsiRules.mjs';
import { ALL_BRANDS, MENACWY_LICENCE_MIN_AGE_DAYS, MENB_MIN_AGE_MONTHS, menbFamily } from '../../src/data/brands.js';

const ROW = new Map(DOSE_RULES.map((r) => [r.id, r]));

// ── CDSI's series, by short name ─────────────────────────────────────────
const S = {
  ROUTINE: 'ACWY · Meningococcal ACWY 2-dose series',
  INFANT: 'ACWY · Meningococcal ACWY risk 2-23 month',
  RISK2: 'ACWY · Meningococcal ACWY risk 2-dose series',
  RISK1: 'ACWY · Meningococcal ACWY risk 1-dose series',
  H2_4C: 'B · Meningococcal B 2-dose series MenB-4C Shared Clinical Decision Making',
  H2_FH: 'B · Meningococcal B 2-dose series MenB-FHbp Shared Clinical Decision Making',
  H3_4C: 'B · Meningococcal B 3-dose series MenB-4C Shared Clinical Decision Making',
  H3_FH: 'B · Meningococcal B 3-dose series MenB-FHbp Shared Clinical Decision Making',
  R_4C: 'B · Meningococcal B risk 3-dose series MenB-4C increased risk',
  R_FH: 'B · Meningococcal B risk 3-dose series MenB-FHbp Increased Risk',
};
const f = (series, dose, what) => `${S[series]} · Dose ${dose} · ${what}`;
const SINCE_2017 = ' [doses given from 20170519]';

// ── The app's side of a comparison ───────────────────────────────────────
// Gaps in intervals.js are in DAYS; ages in ages.js in MONTHS; brand floors
// in months (or days, MenQuadfi). Each helper says which.
const days = (n) => ({ n, unit: 'days' });
const months = (n) => ({ n, unit: 'months' });
const yrs = (n) => ({ n, unit: 'years' });
/** The app's rule as the row states it: grace and floor from the row itself. */
const fromRow = (id, amount) => {
  const r = ROW.get(id);
  return { ...amount, grace: r.grace === true, floor: ['floor', 'set-aside'].includes(r.enforcement) };
};
const brand = (key) => ALL_BRANDS.find((b) => b.key === key);
const brandFloor = (key) => {
  const b = brand(key);
  return b.minAgeDays != null ? days(b.minAgeDays) : months(b.minAgeM);
};

// CDC's vaccine codes → the app's product (as in cdsiCore.mjs).
export const CVX_TO_APP = {
  136: 'Menveo 2-vial', 114: 'Menactra', 203: 'MenQuadfi', 163: 'Bexsero', 162: 'Trumenba',
  316: 'Penbraya', 328: 'Penmenvy',
  // "unspecified": the app's own "Unknown brand"
  147: '', 108: '', 164: '',
};

// ─────────────────────────────────────────────────────────────────────────
// ROW_MAP — every row of doseRules.js. Either `none` (CDSI has no rule of this
// kind, with the reason) or `compare` (a list), and optionally `covers`: the
// other CDSI facts this row accounts for (patterns), so the test can prove
// every CDSI rule is accounted for by something.
// ─────────────────────────────────────────────────────────────────────────
const NO_DATES = 'CDSI judges only doses with a date; its rule files have no rule for a dose without one.';
const NO_RISK_START = 'CDSI\'s conditions carry no start date, so CDSI never asks whether the risk had begun when a dose was given: it puts the whole record on the risk series. The app\'s question has no CDSI counterpart.';
const RECORD = 'About the typed entry, not the vaccine. CDSI\'s rule files hold no rule for it.';

export const ROW_MAP = {
  'RECORD-FUTURE-DATE': { none: RECORD },
  'RECORD-BEFORE-BIRTH': { none: RECORD },
  'RECORD-ENTERED-TWICE': { none: RECORD },
  'ACWY-UNDATED-BELOW-MIN-AGE': { none: NO_DATES },
  'ACWY-UNDATED-COUNTS': { none: NO_DATES },

  'ACWY-BELOW-MIN-AGE': {
    compare: [
      { what: 'Menveo (2-vial) minimum age', app: fromRow('ACWY-BELOW-MIN-AGE', brandFloor('Menveo 2-vial')), cdsi: f('INFANT', 1, 'allowable CVX 136'), field: 'begin' },
      { what: 'Menactra minimum age', app: fromRow('ACWY-BELOW-MIN-AGE', brandFloor('Menactra')), cdsi: f('INFANT', 2, 'allowable CVX 114'), field: 'begin' },
      { what: 'MenQuadfi minimum age (the product)', app: fromRow('ACWY-BELOW-MIN-AGE', brandFloor('MenQuadfi')), cdsi: f('INFANT', 1, 'allowable CVX 203'), field: 'begin' },
      { what: 'Penbraya minimum age', app: fromRow('ACWY-BELOW-MIN-AGE', brandFloor('Penbraya')), cdsi: f('ROUTINE', 1, 'allowable CVX 316'), field: 'begin' },
      { what: 'Penmenvy minimum age', app: fromRow('ACWY-BELOW-MIN-AGE', brandFloor('Penmenvy')), cdsi: f('ROUTINE', 1, 'allowable CVX 328'), field: 'begin' },
      {
        what: 'Menveo one-vial (liquid) minimum age', app: fromRow('ACWY-BELOW-MIN-AGE', brandFloor('Menveo 1-vial')),
        cdsi: f('INFANT', 1, 'allowable CVX 136'), field: 'begin', differs: ['number'], status: 'wording', refs: ['cdcChildMenveoLiquid10y'],
        why: 'CDSI has one code for Menveo (CVX 136) and cannot tell the vials apart, so it allows any Menveo from 2 months. CDC\'s notes say the liquid one-vial form is not for use before 10 years; the app follows the notes.',
      },
      {
        what: 'Unknown-brand MenACWY minimum age', app: fromRow('ACWY-BELOW-MIN-AGE', days(MENACWY_LICENCE_MIN_AGE_DAYS)),
        cdsi: f('INFANT', 1, 'allowable CVX 147'), field: 'begin', differs: ['number'], status: 'owner',
        decided: '2026-09-23, MenQuadfi from 6 weeks (brands.js header; CLAUDE.md AAP tiebreak)',
        why: 'An unknown product might have been MenQuadfi, which the owner allows from 6 weeks, so the app counts an unknown-brand dose from 6 weeks. CDSI\'s "unspecified" codes start at 2 months less 4 days.',
      },
      {
        what: 'Youngest age a first MenACWY dose counts (any product)', app: fromRow('ACWY-BELOW-MIN-AGE', days(MENACWY_LICENCE_MIN_AGE_DAYS)),
        cdsi: f('INFANT', 1, 'absolute minimum age'), field: 'value', differs: ['number'], status: 'owner',
        decided: '2026-09-23, MenQuadfi from 6 weeks (brands.js header; CLAUDE.md AAP tiebreak)',
        why: 'CDSI 4.65 lists MenQuadfi from 6 weeks less 4 days, but its infant series still starts at 2 months less 4 days, so CDSI would NOT count a MenQuadfi given at 6–7 weeks as dose 1. The app counts it (owner, following AAP). The README said CDSI "now agrees" with the 6-week rule: true for the product, not for the series.',
      },
    ],
    // Every allowable MenACWY product line, in every series and dose. The test
    // checks each product reads the same in all of them, so comparing one
    // representative per product is honest.
    covers: [/^ACWY · .* · allowable CVX (108|114|136|147|203|316|328)$/],
  },

  'ACWY-ROUTINE-BEFORE-10': {
    compare: [{
      what: 'Routine dose 1: youngest age it counts', app: fromRow('ACWY-ROUTINE-BEFORE-10', months(MENACWY_ROUTINE_COUNTS_MIN_AGE_MONTHS)),
      cdsi: f('ROUTINE', 1, 'absolute minimum age'), field: 'value', differs: ['grace'], status: 'owner',
      decided: '2026-11-15, STOP B answer B-1 ("only when it helps"; port plan, PneumoVax)',
      why: 'CDSI gives the age-10 line no 4-day grace (a dose 1 day before 10 does not count for the adolescent series); the app gives it. The owner ruled this a deliberate CDSI difference (CDC test-patient family 5).',
    }],
  },
  'ACWY-HIGHRISK-BEFORE-10-ASK': { none: NO_RISK_START },
  'ACWY-HIGHRISK-BEFORE-10-NO': { none: NO_RISK_START },
  'ACWY-HIGHRISK-BEFORE-10-YES': { none: NO_RISK_START },

  'ACWY-INFANT-SERIES-GAP': {
    compare: [
      ...[2, 3, 4].map((d) => ({ what: `Infant series dose ${d}: gap from previous`, app: fromRow('ACWY-INFANT-SERIES-GAP', days(MENACWY_INFANT_EARLY_GAP)), cdsi: f('INFANT', d, 'gap from previous dose') })),
      { what: 'Infant series final dose: gap from previous', app: fromRow('ACWY-INFANT-SERIES-GAP', days(MENACWY_INFANT_FINAL_GAP)), cdsi: f('INFANT', 5, 'gap from previous dose') },
      { what: 'Infant series final dose: youngest age', app: fromRow('ACWY-INFANT-SERIES-GAP', months(MENACWY_INFANT_FINAL_MIN_AGE_MONTHS)), cdsi: f('INFANT', 5, 'absolute minimum age'), field: 'value' },
    ],
  },
  'ACWY-HIGHRISK-PRIMARY-GAP': {
    compare: [
      { what: 'High-risk series from 2 years, dose 2: gap from dose 1', app: fromRow('ACWY-HIGHRISK-PRIMARY-GAP', days(MENACWY_HIGHRISK_PRIMARY_GAP)), cdsi: f('RISK2', 2, 'gap from previous dose') },
      {
        what: 'High-risk series from 2 years, dose 2: gap from a pentavalent', app: fromRow('ACWY-HIGHRISK-PRIMARY-GAP', days(MENACWY_HIGHRISK_PRIMARY_GAP)), cdsi: f('RISK2', 2, 'gap from most recent CVX 316;328'),
        note: 'CDSI\'s floor after a pentavalent is the same 8 weeks less 4 days; its "minimum" of 6 months only widens the grace window, it does not raise the floor.',
      },
    ],
  },
  'ACWY-HIGHRISK-BOOSTER-GAP': {
    compare: [
      { what: 'High-risk first booster (primary before 7)', app: fromRow('ACWY-HIGHRISK-BOOSTER-GAP', yrs(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)), cdsi: f('INFANT', 6, 'gap from previous dose') },
      { what: 'High-risk booster every 5 years', app: fromRow('ACWY-HIGHRISK-BOOSTER-GAP', yrs(MENACWY_BOOSTER_CADENCE_YEARS)), cdsi: f('INFANT', 7, 'gap from previous dose') },
      { what: 'High-risk first booster (series from 2 years, primary before 7)', app: fromRow('ACWY-HIGHRISK-BOOSTER-GAP', yrs(MENACWY_FIRST_BOOSTER_YEARS_UNDER_7)), cdsi: f('RISK2', 3, 'gap from previous dose') },
      { what: 'High-risk booster every 5 years (series from 2 years)', app: fromRow('ACWY-HIGHRISK-BOOSTER-GAP', yrs(MENACWY_BOOSTER_CADENCE_YEARS)), cdsi: f('RISK2', 4, 'gap from previous dose') },
    ],
    covers: [/^ACWY · Meningococcal ACWY risk 2-(23 month · Dose 7|dose series · Dose 4) · repeats$/],
  },
  'ACWY-TRAVEL-BOOSTER-GAP': {
    compare: [
      {
        what: 'Travel / microbiologist / outbreak first booster', app: { absent: true }, cdsi: f('RISK1', 2, 'gap from previous dose'),
        differs: ['absent'], status: 'open', stopC: 'Q2',
        why: 'CDSI\'s one-dose risk series (travel 164, microbiologist 050, outbreak 070, and from 19 years college 046 and military 064) sets a 3-year floor before the first booster; the record checks no booster gap here at all (only the 4-week rule). Already on the STOP C Q2 list from 2.2.',
      },
      {
        what: 'Travel / microbiologist / outbreak booster every 5 years', app: { absent: true }, cdsi: f('RISK1', 3, 'gap from previous dose'),
        differs: ['absent'], status: 'open', stopC: 'Q2', why: 'As above: CDSI floors the 5-year booster; the record does not.',
      },
    ],
    covers: [/^ACWY · Meningococcal ACWY risk 1-dose series · Dose 3 · repeats$/],
  },
  'ACWY-ROUTINE-BOOSTER-GAP': {
    compare: [
      { what: 'Routine booster: gap from dose 1', app: fromRow('ACWY-ROUTINE-BOOSTER-GAP', days(MENACWY_ROUTINE_BOOSTER_MIN_GAP)), cdsi: f('ROUTINE', 2, 'gap from previous dose') },
      {
        what: 'Routine booster: gap from a pentavalent', app: fromRow('ACWY-ROUTINE-BOOSTER-GAP', days(MENACWY_ROUTINE_BOOSTER_MIN_GAP)), cdsi: f('ROUTINE', 2, 'gap from most recent CVX 316;328'),
        note: 'Same floor (8 weeks less 4 days); CDSI\'s 6-month "minimum" after a pentavalent only widens the grace window.',
      },
    ],
  },
  'ACWY-ANY-TWO-DOSES-GAP': {
    compare: [{
      what: 'Smallest gap CDSI allows between any two MenACWY doses', app: fromRow('ACWY-ANY-TWO-DOSES-GAP', days(MENACWY_REPEAT_DOSE_FLOOR)),
      pick: 'smallest live MenACWY gap floor', differs: ['number'], status: 'open', stopC: 'Q2',
      why: 'CDSI has no 4-week MenACWY rule: no gap between any two MenACWY doses in any series is below 8 weeks less 4 days. The app voids any MenACWY dose under 4 weeks (finding R-4a). Already on the STOP C Q2 list from 2.2.',
    }],
  },
  'ACWY-ROUTINE-DOSE-2-BEFORE-16': {
    compare: [{ what: 'Routine booster: youngest age it counts', app: fromRow('ACWY-ROUTINE-DOSE-2-BEFORE-16', months(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS)), cdsi: f('ROUTINE', 2, 'absolute minimum age'), field: 'value' }],
  },

  'MENB-UNDATED-BELOW-10': { none: NO_DATES },
  'MENB-UNDATED-HEALTHY-UNDER-16': { none: NO_DATES },
  'MENB-UNDATED-COUNTS': { none: NO_DATES },

  'MENB-BELOW-MIN-AGE': {
    compare: [
      { what: 'High-risk MenB series (4C): youngest age', app: fromRow('MENB-BELOW-MIN-AGE', months(MENB_MIN_AGE_MONTHS)), cdsi: f('R_4C', 1, 'absolute minimum age'), field: 'value' },
      { what: 'High-risk MenB series (FHbp): youngest age', app: fromRow('MENB-BELOW-MIN-AGE', months(MENB_MIN_AGE_MONTHS)), cdsi: f('R_FH', 1, 'absolute minimum age'), field: 'value' },
      ...[['Bexsero', 163, 'R_4C'], ['Trumenba', 162, 'R_FH'], ['Penmenvy', 328, 'R_4C'], ['Penbraya', 316, 'R_FH']].map(([b, cvx, s]) => ({
        what: `${b} minimum age (dose 1)`, app: fromRow('MENB-BELOW-MIN-AGE', brandFloor(b)), cdsi: f(s, 1, `allowable CVX ${cvx}`), field: 'begin',
      })),
    ],
    covers: [/^B · .* · Dose 1 · allowable CVX (162|163|316|328)$/],
  },
  'MENB-HEALTHY-BEFORE-16': {
    compare: ['H2_4C', 'H2_FH', 'H3_4C', 'H3_FH'].map((s) => ({
      what: `Healthy MenB (${s}) dose 1: youngest age it counts`, app: fromRow('MENB-HEALTHY-BEFORE-16', months(MENB_HEALTHY_MIN_AGE_MONTHS)),
      cdsi: f(s, 1, 'absolute minimum age'), field: 'value', differs: ['number'], status: 'owner',
      decided: '2026-07-23, Option 1 (ages.js; clinical-rules.md)',
      why: 'CDSI counts a healthy patient\'s MenB dose from 10 years less 4 days (16 is only its recommended age); the app sets aside a dose before 16, because MenB protection fades within about a year.',
    })),
    covers: [/^B · Meningococcal B [23]-dose series .* · Dose [23] · absolute minimum age$/],
  },
  'MENB-HIGHRISK-BEFORE-16-ASK': { none: NO_RISK_START },
  'MENB-HIGHRISK-BEFORE-16-NO': { none: NO_RISK_START },
  'MENB-HIGHRISK-BEFORE-16-YES': { none: NO_RISK_START },

  'MENB-WRONG-FAMILY': {
    compare: [{
      what: 'Every MenB-4C series allows only 4C products, every MenB-FHbp series only FHbp products',
      app: fromRow('MENB-WRONG-FAMILY', {}), pick: 'MenB family of every product in every series',
    }],
    // Every MenB product line. (The begin ages of later doses are not compared:
    // a later dose follows a dose 1 that already cleared 10 years less 4 days.)
    covers: [/^B · .* · (preferred|allowable) CVX \d+$/],
  },
  'MENB-HIGHRISK-DOSE-2-UNVERIFIABLE': { none: NO_DATES },
  'MENB-HIGHRISK-DOSE-2-GAP': {
    compare: ['R_4C', 'R_FH'].map((s) => ({
      what: `High-risk MenB (${s}) dose 2: gap from dose 1`, app: fromRow('MENB-HIGHRISK-DOSE-2-GAP', days(MENB_HIGHRISK_D2_GAP)), cdsi: f(s, 2, `gap from previous dose${SINCE_2017}`),
    })),
  },
  'MENB-HIGHRISK-EARLY-DOSE-3': {
    compare: [
      ...[['R_4C', ''], ['R_FH', SINCE_2017]].map(([s, w]) => ({
        what: `High-risk MenB (${s}) dose 3: gap from dose 2`, app: fromRow('MENB-HIGHRISK-EARLY-DOSE-3', months(MENB_HIGHRISK_D3_MONTHS_FROM_D2)),
        cdsi: f(s, 3, `gap from previous dose${w}`), differs: ['grace', 'floor'], status: 'open', stopC: 'Q2',
        why: 'Under 4 months after dose 2, CDSI does not count dose 3 (with the 4-day grace) unless the allowable gap below rescues it; the app counts it with no grace and asks a 4th dose (CDC\'s notes). Already on the STOP C Q2 list from 2.2. New in 2.3: the 4-day grace — under the owner\'s B-1 "only when it helps", a dose 3 given 1–4 days early would mean one dose fewer.',
      })),
      ...['R_4C', 'R_FH'].map((s) => ({
        what: `High-risk MenB (${s}) dose 3: counts anyway if at least 6 months after dose 1`, app: { absent: true },
        cdsi: f(s, 3, 'allowable gap from dose 1'), differs: ['absent'], status: 'open', stopC: 'Q2',
        why: 'CDSI\'s second chance: a dose 3 under 4 months after dose 2 still counts, with no extra dose, if it is at least 6 months less 4 days after dose 1. This is ACIP 2024\'s "unless the third dose was administered ≥6 months after the first dose"; the app has no "unless" and asks a 4th dose. Already on the STOP C Q2 list from 2.2.',
      })),
    ],
  },
  'MENB-HIGHRISK-DOSE-3-FROM-DOSE-1': {
    compare: ['R_4C', 'R_FH'].map((s) => ({
      what: `High-risk MenB (${s}) dose 3: gap from dose 1`, app: fromRow('MENB-HIGHRISK-DOSE-3-FROM-DOSE-1', months(MENB_HIGHRISK_D3_MONTHS_FROM_D1)),
      cdsi: f(s, 3, 'gap from dose 1'), differs: ['floor'], status: 'open', stopC: 'Q2',
      why: 'CDSI\'s 6 months from dose 1 has an absolute minimum of 0 days: timing advice, never a reason not to count. The app voids the dose (finding R-4b). Already on the STOP C Q2 list from 2.2.',
    })),
  },
  'MENB-HIGHRISK-DOSE-4-AFTER-EARLY-DOSE-3': {
    none: 'CDSI\'s high-risk series has no extra dose after an early dose 3: it counts such a dose 3 only when it is at least 6 months less 4 days after dose 1, and otherwise does not count it. The difference is recorded on MENB-HIGHRISK-EARLY-DOSE-3 (STOP C Q2).',
  },
  'MENB-HIGHRISK-BOOSTER-GAP': {
    compare: ['R_4C', 'R_FH'].flatMap((s) => [
      { what: `High-risk MenB (${s}) first booster`, app: fromRow('MENB-HIGHRISK-BOOSTER-GAP', yrs(MENB_HIGHRISK_FIRST_BOOSTER_YEARS)), cdsi: f(s, 4, 'gap from previous dose') },
      { what: `High-risk MenB (${s}) later boosters`, app: fromRow('MENB-HIGHRISK-BOOSTER-GAP', yrs(MENB_HIGHRISK_BOOSTER_CADENCE_YEARS)), cdsi: f(s, 5, 'gap from previous dose') },
    ]),
    covers: [/^B · Meningococcal B risk .* · Dose 5 · repeats$/],
  },
  'MENB-HEALTHY-EARLY-DOSE-2': {
    compare: [
      ...[['H2_4C', ' [doses given from 20241025]'], ['H2_FH', '']].map(([s, w]) => ({
        what: `Healthy MenB (${s}): the 6-month line between a 2-dose and a 3-dose series`, aspects: ['number', 'grace'],
        app: fromRow('MENB-HEALTHY-EARLY-DOSE-2', months(MENB_HEALTHY_D2_MONTHS)), cdsi: f(s, 2, `gap from dose 1${w}`),
        differs: ['grace'], status: 'open', stopC: 'Q2 (new in 2.3)',
        why: 'CDSI gives the 6-month line the 4-day grace: a dose 2 given 1–4 days before 6 months completes the 2-dose series. The app gives it none (the row says grace must never decide how many doses a series has), so it asks a dose 3. Under the owner\'s B-1 "only when it helps", the grace here would mean one dose fewer.',
      })),
      ...['H3_4C', 'H3_FH'].map((s) => ({
        what: `Healthy MenB (${s}) dose 2: lowest gap from dose 1`, app: { absent: true },
        cdsi: f(s, 2, `gap from previous dose${SINCE_2017}`), differs: ['absent'], status: 'open', stopC: 'Q2',
        why: 'CDSI\'s 3-dose healthy series needs dose 2 at least 4 weeks less 4 days after dose 1, for BOTH families. The app has no lower limit (finding R-4c, already on the STOP C Q2 list from 2.2; the 2.2 note said Trumenba 4 months, which is CDSI\'s 2-dose series only).',
      })),
    ],
    // In the 2-dose series the previous dose IS dose 1, so the 4-month "gap
    // from previous" can never decide anything the 6-month line has not.
    covers: [/^B · Meningococcal B 2-dose series MenB-(4C|FHbp) .* · Dose 2 · gap from previous dose( \[doses given from 20241025\])?$/],
  },
  'MENB-HEALTHY-RESCUE-DOSE-3-GAP': {
    compare: [
      ...[['H3_4C', ''], ['H3_FH', SINCE_2017]].map(([s, w]) => ({
        what: `Healthy MenB rescue (${s}) dose 3: gap from dose 2`, app: fromRow('MENB-HEALTHY-RESCUE-DOSE-3-GAP', months(MENB_HEALTHY_RESCUE_MONTHS)), cdsi: f(s, 3, `gap from previous dose${w}`),
      })),
      ...['H3_4C', 'H3_FH'].map((s) => ({
        what: `Healthy MenB rescue (${s}) dose 3: 6 months from dose 1`, app: { absent: true }, cdsi: f(s, 3, 'gap from dose 1'),
        note: 'Advice in CDSI too (absolute minimum 0 days), and the app has no such rule: nothing to differ on.',
      })),
      ...['H3_4C', 'H3_FH'].map((s) => ({
        what: `Healthy MenB rescue (${s}) dose 3: counts anyway if at least 6 months after dose 1`, app: { absent: true },
        cdsi: f(s, 3, 'allowable gap from dose 1'), differs: ['absent'], status: 'wording', refs: ['menbRescueDoseRule'],
        why: 'CDSI also counts a rescue dose 3 given under 4 months after dose 2 if it is at least 6 months less 4 days after dose 1. ACIP states the rescue dose "≥4 months after the second dose" with no such exception; the app follows the wording.',
      })),
    ],
  },
  'SERIES-CAP-EXTRA-DOSE': {
    none: 'CDSI calls a dose past the end of a series "Extraneous" in its evaluation logic; there is no row for it in these files. CDC\'s test patients compare it (cdsi-test-patients-gate.test.js).',
  },
};

// ─────────────────────────────────────────────────────────────────────────
// CDSI_ONLY — CDSI rules with no row in the app's table. Each is a
// difference (the app has no such rule), so each has a status.
// ─────────────────────────────────────────────────────────────────────────
export const CDSI_ONLY = [
  {
    id: 'PENTAVALENT-UPPER-AGE', status: 'open', stopC: 'Q2 (new in 2.3)',
    what: 'Penbraya and Penmenvy: no dose counts at 26 or older',
    pick: 'pentavalent upper age', app: { n: Math.min(brand('Penbraya').maxAgeM, brand('Penmenvy').maxAgeM), unit: 'months' },
    covers: [],
    why: 'In every MenACWY and MenB series CDSI allows the pentavalents only up to 26 years. The app has no upper age for any product (maxAgeM 999), so it counts a pentavalent given at 26 or older. Not read live yet: what CDC\'s notes and ACIP say about pentavalent use from 26.',
  },
  {
    id: 'ROUTINE-UPPER-AGES', status: 'open', stopC: 'Q2 (new in 2.3)',
    what: 'Routine MenACWY and healthy MenB: an upper age for counting a dose',
    covers: [/^(ACWY · Meningococcal ACWY 2-dose series|B · Meningococcal B [23]-dose series .*) · Dose [12] · maximum age$/],
    why: 'CDSI gives routine MenACWY dose 1 a maximum age of 19 years and dose 2 of 22, and healthy MenB dose 1 of 24. The app uses the same numbers (ages.js) only to decide when to stop RECOMMENDING; it never refuses to count a recorded dose for being given too old. Low stakes (no more doses are owed either way), but it is a difference.',
  },
  {
    id: 'MENB-4C-OLD-2-DOSE-COURSE', status: 'open', stopC: 'Q2 (new in 2.3)',
    what: 'High-risk Bexsero: two doses given before 25 Oct 2024 complete the primary series',
    covers: [/^B · Meningococcal B risk 3-dose series MenB-4C increased risk · Dose 3 · skip \(Both\) set 1 condition 1$/],
    why: 'CDSI skips high-risk Bexsero dose 3 when two valid Bexsero doses were given before 25 Oct 2024 (the old 2-dose high-risk course). The app asks a dose 3 (checked 2026-11-15: asplenia, Bexsero 2023-01-01 and 2023-02-15 → "Dose 3 of 3 (high-risk, 4C)"). Not read live yet: whether ACIP\'s October 2024 statement (mm7349a3) says a completed 2-dose course stands. Not a dose row: series size lives in seriesTotals.js menbSeriesInfo().',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// OTHER_NUMBERS — app constants that are not dose rows (they decide what to
// recommend or how big a series is) but that CDSI states too. Number only.
// ─────────────────────────────────────────────────────────────────────────
const skipAge = (re = /beginAge=([^;|]+?)\s*(?:;|\|)/) => (fact) => re.exec(fact.value)?.[1];
export const OTHER_NUMBERS = [
  { constant: 'MENACWY_SCHEDULE_MIN_AGE_MONTHS', app: months(MENACWY_SCHEDULE_MIN_AGE_MONTHS), cdsi: f('INFANT', 1, 'minimum age'), field: 'value' },
  { constant: 'MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS', app: months(MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS), cdsi: f('INFANT', 1, 'skip (Both) set 1 condition 1'), field: skipAge() },
  { constant: 'MENACWY_INFANT_SERIES_MAX_AGE_MONTHS', app: months(MENACWY_INFANT_SERIES_MAX_AGE_MONTHS), cdsi: f('RISK2', 1, 'absolute minimum age'), field: 'value' },
  { constant: 'MENACWY_INFANT_SERIES_MAX_AGE_MONTHS', app: months(MENACWY_INFANT_SERIES_MAX_AGE_MONTHS), cdsi: f('RISK1', 1, 'absolute minimum age'), field: 'value' },
  { constant: 'MENACWY_BOOSTER_AGE_SPLIT_MONTHS', app: months(MENACWY_BOOSTER_AGE_SPLIT_MONTHS), cdsi: f('INFANT', 6, 'skip (Both) set 1 condition 1'), field: skipAge() },
  { constant: 'MENACWY_BOOSTER_AGE_SPLIT_MONTHS', app: months(MENACWY_BOOSTER_AGE_SPLIT_MONTHS), cdsi: f('RISK2', 3, 'skip (Both) set 1 condition 1'), field: skipAge() },
  { constant: 'MENACWY_BOOSTER_AGE_SPLIT_MONTHS', app: months(MENACWY_BOOSTER_AGE_SPLIT_MONTHS), cdsi: f('RISK1', 2, 'skip (Both) set 1 condition 1'), field: skipAge() },
  { constant: 'MENACWY_ROUTINE_DOSE1_AGE_MONTHS', app: months(MENACWY_ROUTINE_DOSE1_AGE_MONTHS), cdsi: f('ROUTINE', 1, 'minimum age'), field: 'value' },
  { constant: 'MENACWY_ROUTINE_BOOSTER_AGE_MONTHS', app: months(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS), cdsi: f('ROUTINE', 2, 'minimum age'), field: 'value' },
  { constant: 'MENACWY_ROUTINE_BOOSTER_AGE_MONTHS', app: months(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS), cdsi: f('ROUTINE', 1, 'skip (Evaluation) set 1 condition 1'), field: skipAge(/beginAge=([^;|]+?)\s*(?:;|\||$)/) },
  { constant: 'MENACWY_ROUTINE_BOOSTER_AGE_MONTHS', app: months(MENACWY_ROUTINE_BOOSTER_AGE_MONTHS), cdsi: f('ROUTINE', 1, 'skip (Forecast) set 1 condition 1'), field: skipAge(/beginAge=([^;|]+?)\s*(?:;|\||$)/) },
  { constant: 'MENACWY_CATCHUP_MIN_AGE_MONTHS', app: months(MENACWY_CATCHUP_MIN_AGE_MONTHS), cdsi: f('ROUTINE', 1, 'maximum age'), field: 'value' },
  { constant: 'MENACWY_CATCHUP_MAX_AGE_MONTHS', app: months(MENACWY_CATCHUP_MAX_AGE_MONTHS), cdsi: f('ROUTINE', 2, 'maximum age'), field: 'value' },
  ...['H2_4C', 'H2_FH', 'H3_4C', 'H3_FH'].flatMap((s) => [
    { constant: 'MENB_HEALTHY_MIN_AGE_MONTHS', app: months(MENB_HEALTHY_MIN_AGE_MONTHS), cdsi: f(s, 1, 'minimum age'), field: 'value' },
    { constant: 'MENB_HEALTHY_MAX_AGE_MONTHS', app: months(MENB_HEALTHY_MAX_AGE_MONTHS), cdsi: f(s, 1, 'maximum age'), field: 'value' },
  ]),
];

// ─────────────────────────────────────────────────────────────────────────
// NOT_COMPARED — CDSI facts nothing above uses, each pattern with its reason.
// The test fails on a CDSI fact that is neither compared, covered, nor here,
// and on a pattern here that no longer matches anything.
// ─────────────────────────────────────────────────────────────────────────
export const NOT_COMPARED = [
  { match: /Hib-MenCY-TT 4-dose series/, why: 'Used only with MenHibrix (Hib-MenCY, CVX 148, discontinued 2016), which the app has no entry for.' },
  { match: / · allowable CVX (148|32)$/, why: 'Products the app has no entry for: MenHibrix (148, discontinued 2016) and Menomune (MPSV4, 32, discontinued 2017).' },
  { match: / · preferred CVX \d+$/, why: 'Which product CDC prefers for a dose: advice, not whether a dose counts. The app\'s brand lists are in brands.js and its own sweeps.' },
  { match: / · (series type|conditions that put a patient on it)$/, why: 'Which series a patient is put on. That is the engine\'s risk logic, compared patient by patient by CDC\'s test patients (cdsi-test-patients-gate.test.js), not a dose rule.' },
  { match: / · (earliest|latest) recommended age$/, why: 'When to give a dose, not whether it counts.' },
  { match: / · minimum age$/, why: 'The minimum age without the 4-day grace; the absolute minimum age (with the grace) is what decides whether a dose counts, and is compared. (Where the app has its own "recommend from" age, OTHER_NUMBERS compares it.)' },
  { match: /until \d{8}\]$/, why: 'A rule for doses given before CDC changed it (2017, 2024). The app judges every dose by today\'s rule; dated windows are not modelled. CDC\'s test patients would show a case where this matters.' },
  { match: /^B · .* · Dose 1 · gap from previous dose$/, why: 'CDSI\'s advice to give MenB dose 1 at least 4 weeks after an earlier dose; absolute minimum 0 days, so it never decides whether a dose counts.' },
  { match: / · skip \(/, why: 'Decides how many doses a series has (seriesTotals.js), not whether a dose counts. The ages these skips hinge on are compared in OTHER_NUMBERS; the series sizes are compared patient by patient by CDC\'s test patients.' },
];

// ── The comparing ────────────────────────────────────────────────────────
const toCommon = (d) => {
  if (!d || d.complex) return null;
  if (d.unit === 'days') return { n: d.n, unit: 'days' };
  if (d.unit === 'weeks') return { n: d.n * 7, unit: 'days' };
  if (d.unit === 'months') return { n: d.n, unit: 'months' };
  if (d.unit === 'years') return { n: d.n * 12, unit: 'months' };
  return null;
};
const sameAmount = (a, b) => { const x = toCommon(a); const y = toCommon(b); return !!x && !!y && x.unit === y.unit && x.n === y.n; };
const show = (d) => (d ? (d.text ?? `${d.n} ${d.unit}`) : '(none)');

/** CDSI's side of a comparison: the duration that decides, and whether it is a floor. */
function cdsiSide(item, facts) {
  if (item.pick === 'smallest live MenACWY gap floor') {
    // Every MenACWY gap in force today that is a real floor (not advice), in
    // every series the app can reach; the smallest one, measured in days.
    const approxDays = (d) => { const c = toCommon(d); return c.unit === 'days' ? c.n : c.n * 30.4375; };
    const live = [...facts.values()].filter((x) => x.key.startsWith('ACWY · ') && x.abs && !x.abs.complex && x.abs.n > 0
      && x.live !== false && !/Hib-MenCY/.test(x.key) && !/ · allowable /.test(x.key));
    const best = live.reduce((m, x) => (!m || approxDays(x.abs) < approxDays(m.abs) ? x : m), null);
    return { fact: best, d: best.abs, floor: true, grace: best.abs.graceDays === 4 };
  }
  const fact = facts.get(item.cdsi);
  if (!fact) return { missing: item.cdsi };
  if (item.field === 'begin') return { fact, d: fact.begin, floor: true, grace: fact.begin?.graceDays === 4 };
  if (item.field) {
    // An age: the fact's value (or a piece of it) is a duration like "10 years - 4 days".
    const d = duration(typeof item.field === 'function' ? item.field(fact) : fact.value);
    return { fact, d, floor: true, grace: d?.graceDays === 4 };
  }
  // A gap (interval or allowable interval): the absolute minimum decides.
  // "0 days" means CDSI has no floor; its "minimum" is then the advised gap.
  const abs = fact.abs;
  if (abs && !abs.complex && abs.n === 0) return { fact, d: fact.min, floor: false, grace: false };
  return { fact, d: abs, floor: true, grace: abs?.graceDays === 4 };
}

/** The aspects of one comparison that differ, recomputed from both sides. */
export function compareItem(item, facts) {
  if (item.pick === 'MenB family of every product in every series') {
    const wrong = [];
    for (const x of facts.values()) {
      if (!x.key.startsWith('B · ') || !x.cvx) continue;
      const fam = /MenB-4C/.test(x.series) ? '4C' : /MenB-FHbp/.test(x.series) ? 'FHbp' : null;
      const app = CVX_TO_APP[x.cvx];
      if (app === undefined) { wrong.push(`${x.key}: CVX ${x.cvx} is not in CVX_TO_APP`); continue; }
      if (app === '') continue; // "unspecified" product: allowed in either family
      if (menbFamily(app) !== fam) wrong.push(`${x.key}: app family ${menbFamily(app)}, CDSI series ${fam}`);
    }
    return { differs: wrong.length ? ['family'] : [], detail: wrong, cdsiText: 'each product only in its own family\'s series', appText: 'menbFamily() in brands.js' };
  }
  if (item.pick === 'pentavalent upper age') {
    const ends = [...facts.values()].filter((x) => ['316', '328'].includes(x.cvx)).map((x) => x.end);
    const distinct = [...new Set(ends.map(show))];
    const differs = distinct.length === 1 && sameAmount(ends[0], item.app) ? [] : ['number'];
    return { differs, cdsiText: `allowed up to ${distinct.join(' / ')}`, appText: item.app.n >= 999 ? 'no upper age (999 months)' : show(item.app) };
  }
  const c = cdsiSide(item, facts);
  if (c.missing) return { missing: c.missing };
  const a = item.app;
  const aspects = item.aspects ?? (a.absent ? ['absent'] : ['number', 'grace', 'floor']);
  const differs = [];
  if (a.absent) {
    if (c.floor) differs.push('absent');
  } else {
    if (aspects.includes('number') && !sameAmount(a, c.d)) differs.push('number');
    // The grace only matters where CDSI draws a line (a floor).
    if (aspects.includes('grace') && c.floor && a.grace !== c.grace) differs.push('grace');
    if (aspects.includes('floor') && a.floor !== c.floor) differs.push('floor');
  }
  return {
    differs, fact: c.fact,
    cdsiText: `${c.fact?.value ?? show(c.d)}${c.floor ? '' : ' (no floor: advice only)'}`,
    appText: a.absent ? 'no such rule' : `${show(a)}${'grace' in a ? `, grace ${a.grace ? 'yes' : 'no'}, ${a.floor ? 'does not count below it' : 'counts anyway'}` : ''}`,
  };
}

/** Everything compared, in one list, for the test and the printed report. */
export function allComparisons() {
  const out = [];
  for (const [id, m] of Object.entries(ROW_MAP)) for (const item of m.compare ?? []) out.push({ source: id, ...item });
  for (const o of CDSI_ONLY) if (o.pick) out.push({ source: `CDSI only: ${o.id}`, ...o, differs: ['number'] });
  for (const o of OTHER_NUMBERS) out.push({ source: `constant ${o.constant}`, what: o.constant, aspects: ['number'], ...o });
  return out;
}

/** Which facts each claimant accounts for (exact keys and patterns). */
export function claimsOf(facts) {
  const claimed = new Map(); // key -> [who]
  const claim = (key, who) => { if (!claimed.has(key)) claimed.set(key, []); claimed.get(key).push(who); };
  for (const c of allComparisons()) {
    if (c.cdsi) claim(c.cdsi, c.source);
    if (c.pick === 'smallest live MenACWY gap floor') { const r = compareItem(c, facts); if (r.fact) claim(r.fact.key, c.source); }
    if (c.pick === 'pentavalent upper age') for (const x of facts.values()) if (['316', '328'].includes(x.cvx)) claim(x.key, c.source);
  }
  const patterns = [
    ...Object.entries(ROW_MAP).flatMap(([id, m]) => (m.covers ?? []).map((re) => [re, id])),
    ...CDSI_ONLY.flatMap((o) => o.covers.map((re) => [re, `CDSI only: ${o.id}`])),
    ...NOT_COMPARED.map((n) => [n.match, 'not compared']),
  ];
  const patternHits = new Map(patterns.map(([re]) => [re, 0]));
  for (const key of facts.keys()) for (const [re, who] of patterns) if (re.test(key)) { claim(key, who); patternHits.set(re, patternHits.get(re) + 1); }
  return { claimed, patternHits };
}
