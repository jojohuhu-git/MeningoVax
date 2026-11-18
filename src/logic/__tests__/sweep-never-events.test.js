// ─────────────────────────────────────────────────────────────────────────
// sweep-never-events.test.js — plan item B
// (.claude/prompts/plan-2026-09-19-test-depth-and-drift.md).
//
// `sweep-dose-counter.test.js` sweeps every age × risk profile × dose count
// on the app's own grid and checks ONE property (no chip shows N > M). It
// found a real bug affecting 20,167 rows that every hand-written test had
// missed. This file runs SIX more candidate never-event properties over the
// same shared grid (`test-grid.js`) — things that should be true of every
// patient, currently checked only on the handful of patients someone wrote
// down by hand.
//
// Landed REPORT-ONLY first, then turned on one property per commit after
// owner review, per the plan's "The discipline that makes this safe" — see
// the git history for this file (2026-09-19) for each individual decision.
//
// Current state (2026-09-19):
//   - Properties 1-5 are REAL, ENFORCED assertions — the owner reviewed the
//     report-only output on PR #55 and approved all five with no exceptions
//     needed beyond what was already built into the checks (property 1's
//     4-day grace, property 3's shared-decision/deferred exclusion).
//   - Property 6 is still REPORT-ONLY, deliberately: it's a rough heuristic
//     for "don't repeat an already-counted dose", flagged as not precise
//     enough to trust as a real rule yet. Do not turn it on without first
//     tightening what it actually checks.
//   - Property 7 duplicates a real assertion that already lives in
//     `sweep-dose-counter.test.js`; it's reported here too only so all seven
//     properties show up in one place.
//
// Every `it()` still prints its violation count and up to 20 examples via
// `report()` before asserting, so a real failure here shows its evidence
// the same way the report-only version did.
//
// B2 (2026-09-19): two grid-realism fixes landed here.
//   - Swept patients are now `SWEEP_DOBS` — real dates of birth, fractional
//     ages and the known edge ages included — instead of a whole-number
//     `ageMonths` that never touched the app's own dob-derived age path.
//   - Every row is now checked TWICE: once with the existing GENEROUS dose
//     spacing (every dose valid) and once with the new TIGHT spacing
//     (`makeTightDoses` — every dose after the first is "too soon", and at
//     the youngest ages some land before minimum age or before birth). The
//     properties checked here (1-5) are about whether the RECOMMENDATION
//     stays sane, not whether the recorded history is valid, so both passes
//     use the same five checks. Property 7 (F4, a COUNTING property) is
//     deliberately NOT run against the tight profile — see
//     `sweep-dose-counter.test.js`'s own header for why.
//
// C1 (2026-09-19): the risk-profile list widened from 8 profiles (one per
// (menacwyClass, menbClass) pairing) to 13 SINGLE_RISK_PROFILES (all 12 risk
// ids, individually) plus 66 PAIR_RISK_PROFILES (every 2-risk combination) —
// see `test-grid.js` for what each now covers. Pairs run on the coarser
// SWEEP_DOBS_COARSE (6-month step, not 3) to keep the suite's runtime near
// its pre-C1 mark — see that export for the measured reasoning.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { doseChipLabel, RECORD_PROBLEM_LABELS, NEEDS_INPUT_LABEL } from '../../components/doseChipLabel.js';
import { statusPillLabel } from '../../components/RecCard.jsx';
import { ALL_BRANDS, MENB_BRANDS, brandMinAge } from '../../data/brands.js';
import { dobToAgeMonths } from '../format.js';
import { TEST_TODAY } from '../../test-today.js';
import {
  SWEEP_DOBS, SWEEP_DOBS_COARSE, SINGLE_RISK_PROFILES, PAIR_RISK_PROFILES,
  MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE,
  MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, makeGenerousDoses, makeTightDoses,
} from '../../test-grid.js';

const TODAY = TEST_TODAY;

// The known set, as recommend.js's own `rec()` comments it (property 4).
const KNOWN_STATUSES = [
  'due', 'catchup', 'risk-based', 'exposure', 'shared-decision', 'complete', 'not-indicated', 'deferred',
];
// Property 3's scope, per the plan: shared-decision and deferred may
// legitimately differ in how they cite, so they are excluded here.
const ACTIONABLE_STATUSES = ['due', 'catchup', 'risk-based', 'exposure'];

// M2 (2026-09-22): MenQuadfi's floor is minAgeDays, not minAgeM — brandMinAge()
// (brands.js) returns whichever unit the brand actually states its floor in.
const BRAND_MIN_AGE = new Map(ALL_BRANDS.map((b) => [b.label, brandMinAge(b.label)]));

// CDC's 4-day grace (property 1's known exception — regression-p1-1-four-day-
// grace.test.js enforces it elsewhere; this sweep must not flag it as new).
const GRACE_MONTHS = 4 / 30.4375;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function maxDate(dates) {
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
}

const rows = { total: 0 };
const p1 = []; // brand offered below its licensed minimum age
const p2 = []; // earliestNextDate is missing, unparseable, or before the dose it follows
const p3 = []; // actionable rec with no citation
const p4 = []; // status outside the known set
const p5 = []; // recommend() threw
const p6 = []; // HEURISTIC ONLY — see the block below
const p7 = []; // (existing, F4) a dose chip implies N > M
// Property 13 (owner STOP E1, Q5–Q9, 2026-11-17): every chip on the grid is
// one label from the closed list. Catches a label outside it ("Unknown", an
// unset age line) and any return of the wording the owner replaced.
const p13 = [];
let p13Chips = 0;
const CLOSED_LIST = [
  /^Dose \d+( of \d+)?$/,
  /^Booster$/,
  /^Not counted — (do not )?repeat$/,
  /^Not counted — given before age (10|16)$/,
  /^Not counted — Extra\. Do not repeat\.$/,
];
const inClosedList = (label) => label === NEEDS_INPUT_LABEL
  || Object.values(RECORD_PROBLEM_LABELS).includes(label)
  || CLOSED_LIST.some((re) => re.test(label));
const p8 = []; // STOP C C1: a dose with no date moved the recommendation
let p8Rows = 0;

// Property 8 (STOP C C1, owner 2026-11-15): a dose with no date does not
// count, so adding one — to either vaccine, at the start of the record where
// undated rows sort — must leave every card exactly as it was. Compared on
// what a clinician acts on: status, the dose asked for, today or the date.
const cardFacts = (r) => [...r.menacwy, ...r.menb].map((c) => [
  c.vaccine, c.status, c.doseLabel, c.doseNum ?? null, !!c.dueToday, c.earliestNextDate ?? null,
].join('|')).join(' / ');
const UNDATED_ROW = { date: '', brand: '', detailsUnknown: true };

// Property 9 (STOP C C5, C6): every high-risk MenB dose-3 timing, week by week.
// Dose 1 on 2025-01-06 (20-year-old with asplenia); dose 2 at 4–26 weeks after
// it; dose 3 at 1–40 weeks after dose 2; judged on 2026-12-31. Two never-events:
//   9a. a dose 3 given ≥4 months after dose 2 is never voided (C5);
//   9b. a dose 3 given ≥6 months after dose 1 never leads to a 4th dose (C6).
const p9 = [];
let p9Rows = 0;
// Property 10 (STOP C C11): no two COUNTED MenACWY doses are under 8 weeks less
// the 4-day grace apart (52 days), on the generous and the tight histories.
const p10 = [];
let p10Rows = 0;
const dayGap = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
function checkProperty10(where, am, dob, riskIds, doses) {
  if (doses.length < 2) return;
  const h = analyzeHistory('MenACWY', doses, am, riskIds, TODAY, undefined, dob);
  const counted = h.effective.filter((d) => d.date);
  p10Rows += 1;
  for (let i = 1; i < counted.length; i++) {
    const gap = dayGap(counted[i - 1].date, counted[i].date);
    if (gap < 52) p10.push(`${where}: counted MenACWY doses ${counted[i - 1].date} and ${counted[i].date} are ${gap} days apart`);
  }
  // 11c (owner D2 and D5, 2026-11-17): nor within 52 days of ANY earlier dose
  // actually given — one set aside or not counted included (record problems
  // and undated rows are not doses given, and start no clock).
  p11Rows.c += 1;
  h.perDose.forEach((d, i) => {
    if (d.effectiveDoseNum == null) return;
    const dose = h.sortedDoses[i];
    const prev = h.sortedDoses.slice(0, i).map((x, j) => ({ x, v: h.perDose[j] }))
      .filter(({ x, v }) => x.date && !v.recordProblem && !v.extraDose && v.status !== 'pending').pop();
    if (dose?.date && prev && dayGap(prev.x.date, dose.date) < 52) {
      p11.push(`11c ${where}: counted MenACWY ${dose.date} is ${dayGap(prev.x.date, dose.date)} days after the dose of ${prev.x.date}`);
    }
  });
}
// Property 11 (owner D1, D2, D5, D6 — 2026-11-17).
//   11a college: a dose at 16+ reads Complete exactly while it is 5 years old or less.
//   11b military: a booster at 16+ under 5 years (less 4 days) after the last dose never counts.
//   11c (in checkProperty10): no counted MenACWY dose within 52 days of any earlier dose given.
const p11 = [];
const p11Rows = { a: 0, b: 0, c: 0 };
{
  const at = (iso, days) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + days); return t.toISOString().slice(0, 10); };
  const today = '2026-12-31';
  const fiveYearsBefore = '2021-12-31';
  for (let back = 1; back <= 3650; back += 13) {
    const d = at(today, -back);
    const c = recommend({ today, dob: '2000-01-01', riskIds: ['college_dorm'], menbDoses: [],
      menacwyDoses: [{ date: d, brand: 'Menveo (MenACWY)' }] }).menacwy[0];
    p11Rows.a += 1;
    const covered = d >= fiveYearsBefore;
    if (covered !== (c.status === 'complete')) p11.push(`11a dose ${d}: status ${c.status}, expected ${covered ? 'complete' : 'a dose due'}`);
  }
  for (let w = 1; w <= 270; w += 1) {
    const d1 = '2019-01-07';
    const d2 = at(d1, w * 7);
    const r = recommend({ today, dob: '1998-01-01', riskIds: ['military'], menbDoses: [],
      menacwyDoses: [d1, d2].map((date) => ({ date, brand: 'Menveo (MenACWY)' })) });
    p11Rows.b += 1;
    const v = r.history.MenACWY.perDose[1];
    if (d2 < at('2024-01-07', -4) && v.effectiveDoseNum != null) p11.push(`11b military ${d1} → ${d2}: second dose counted`);
  }
}
// Property 12 (owner D10 — 2026-11-17). ACIP 2020 Table 8: one MenB booster
// for a serogroup B outbreak ("Single dose if ≥1 yr after MenB primary series
// completion"). Outbreak alone: once a booster is on record, no MenB dose is
// ever asked for again; with the primary series only, the card never reads
// Complete. Control: asplenia with the same doses always asks for another.
const p12 = [];
let p12Rows = 0;
{
  const at = (iso, days) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + days); return t.toISOString().slice(0, 10); };
  const today = '2030-06-30';
  const primary = ['2020-01-06', '2020-03-02', '2020-07-06'];
  const asks = (c) => c.dueToday || c.earliestNextDate != null;
  for (let w = 52; w <= 520; w += 3) {
    const boost = at(primary[2], w * 7);
    if (boost > today) break;
    const doses = [...primary, boost].map((date) => ({ date, brand: 'Bexsero (MenB)' }));
    const run = (riskIds, d) => recommend({ today, dob: '2002-01-01', riskIds, menacwyDoses: [], menbDoses: d }).menb[0];
    const ob = run(['outbreak_b'], doses);
    const ap = run(['asplenia'], doses);
    p12Rows += 1;
    if (asks(ob) || ob.status !== 'complete') p12.push(`12 outbreak, booster ${boost}: ${ob.status} ${ob.doseLabel} (asks again)`);
    if (!asks(ap)) p12.push(`12 control asplenia, booster ${boost}: ${ap.doseLabel} (asks nothing)`);
  }
  const primaryOnly = run12(['outbreak_b'], primary);
  function run12(riskIds, dates) {
    return recommend({ today, dob: '2002-01-01', riskIds, menacwyDoses: [], menbDoses: dates.map((date) => ({ date, brand: 'Bexsero (MenB)' })) }).menb[0];
  }
  if (primaryOnly.status === 'complete') p12.push('12 outbreak, primary series only: reads Complete');
}
// Property 14 (owner F2a, 2026-11-18). The combined shot is offered exactly
// when MenACWY is due today and MenB is due today or can be given today
// (MenB high-risk dose 2 past its 4-week minimum, before its 1-month date);
// a card that "can be given today" is never also due today, and its lead says
// so. Walked day by day from 3 to 6 weeks after dose 1, both MenB products,
// every MenB high-risk reason, with and without MenACWY due.
// Gap badge (owner, 2026-11-18): a card's badge reads "Can be given today"
// exactly when it can be given today — never on a due card, never "Up to date"
// or "due" on a gap day.
const p14 = [];
let p14Rows = 0;
let p14GapRows = 0;
{
  const at = (iso, days) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + days); return t.toISOString().slice(0, 10); };
  const d1 = '2026-01-30'; // a month-end start, so 4 weeks and 1 month sit 2 days apart
  const lead = (c) => (typeof c?.note === 'string' ? c.note : c?.note?.lead ?? '');
  for (const riskIds of [['asplenia'], ['complement'], ['microbiologist'], ['outbreak_b']]) {
    for (const brand of MENB_BRANDS.map((b) => b.label)) { // Bexsero, Trumenba
      for (const menacwyDoses of [[], [{ date: d1, brand: 'Menveo (MenACWY)' }]]) {
        for (let day = 21; day <= 42; day++) {
          const today = at(d1, day);
          const r = recommend({ today, dob: '2004-06-15', riskIds, menacwyDoses, menbDoses: [{ date: d1, brand }] });
          const b = r.menb[0];
          const where = `14 ${riskIds[0]} ${brand} acwy=${menacwyDoses.length} day ${day}`;
          p14Rows += 1;
          if (b.canGiveToday) {
            p14GapRows += 1;
            if (b.dueToday) p14.push(`${where}: canGiveToday and dueToday together`);
            if (!lead(b).includes('can be given today')) p14.push(`${where}: canGiveToday but the lead does not say so`);
          }
          for (const c of [...r.menacwy, ...r.menb]) {
            const badge = statusPillLabel(c, false);
            if ((badge === 'Can be given today') !== Boolean(c.canGiveToday)) {
              p14.push(`${where}: ${c.vaccine} badge "${badge}" but canGiveToday=${Boolean(c.canGiveToday)}`);
            }
          }
          const acwyDue = r.menacwy.some((c) => c.dueToday);
          const bAvailable = r.menb.some((c) => c.dueToday || c.canGiveToday);
          if (r.pentavalent.eligible !== (acwyDue && bAvailable)) {
            p14.push(`${where}: pentavalent ${r.pentavalent.eligible} but acwyDue=${acwyDue} bAvailable=${bAvailable}`);
          }
        }
      }
    }
  }
}

{
  const d1 = '2025-01-06';
  const at = (iso, days) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + days); return t.toISOString().slice(0, 10); };
  const plusMonths = (iso, m) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCMonth(t.getUTCMonth() + m); return t.toISOString().slice(0, 10); };
  for (let w2 = 4; w2 <= 26; w2++) {
    for (let w3 = 1; w3 <= 40; w3++) {
      const d2 = at(d1, w2 * 7);
      const d3 = at(d2, w3 * 7);
      const r = recommend({
        today: '2026-12-31', dob: '2005-01-01', riskIds: ['asplenia'], menacwyDoses: [],
        menbDoses: [d1, d2, d3].map((date) => ({ date, brand: 'Bexsero (MenB)' })),
      });
      p9Rows += 1;
      const dose3 = r.history.MenB.perDose[2];
      if (d3 >= plusMonths(d2, 4) && dose3?.status === 'invalid') p9.push(`9a d1=${d1} d2=${d2} d3=${d3}: dose 3 voided`);
      if (d3 >= plusMonths(d1, 6) && /Dose 4/.test(r.menb[0]?.doseLabel ?? '')) p9.push(`9b d1=${d1} d2=${d2} d3=${d3}: asks "${r.menb[0].doseLabel}"`);
    }
  }
}

// Properties 1-5 check whether the RECOMMENDATION stays sane — nothing here
// depends on the recorded history being valid, so this same check runs once
// for the generous doses and once for the deliberately-invalid tight ones
// (B2c). `dob` is threaded through to `recommend()`/`analyzeHistory()` so
// both passes exercise the app's real dob-derived age path, not a bypass.
function checkProperties1to5(where, am, dob, riskIds, menacwyDoses, menbDoses) {
  let result;
  try {
    result = recommend({ today: TODAY, ageMonths: am, dob, riskIds, menacwyDoses, menbDoses });
  } catch (e) {
    p5.push(`${where}: recommend() threw — ${e.message}`);
    return null;
  }
  rows.total += 1;
  if (result.excluded) return null; // hard-stop combos carry no dose chips (none in SINGLE_RISK_PROFILES today, kept as a guard)

  const allRecs = [
    ...result.menacwy.map((r) => ({ ...r, vaccine: 'MenACWY', doses: menacwyDoses })),
    ...result.menb.map((r) => ({ ...r, vaccine: 'MenB', doses: menbDoses })),
  ];

  for (const r of allRecs) {
    // ── Property 1: no brand below its own licensed minimum age ──────
    if (r.dueToday) {
      for (const brandLabel of r.brands) {
        const floor = BRAND_MIN_AGE.get(brandLabel);
        if (floor == null) {
          p1.push(`${where} ${r.vaccine}: offered unrecognised brand "${brandLabel}"`);
        } else {
          // A days-stated floor (MenQuadfi) is converted to the same averaged
          // months figure used everywhere else this sweep works in months —
          // this property only needs to catch a brand offered WAY below its
          // floor, not validate an exact day, so the ~1-2-day fuzz an average
          // month introduces is immaterial here.
          const floorMonths = floor.unit === 'days' ? floor.value / 30.4375 : floor.value;
          if (am + GRACE_MONTHS < floorMonths) {
            p1.push(`${where} ${r.vaccine}: offered "${brandLabel}" (floor ${floor.value}${floor.unit === 'days' ? 'd' : 'mo'}) at age ${am}mo`);
          }
        }
      }
    }

    // ── Property 2: earliestNextDate is a real date, not before the ──
    // last dose it follows (a future gate should never point backwards)
    if (r.earliestNextDate != null) {
      if (!ISO_DATE.test(r.earliestNextDate) || Number.isNaN(Date.parse(r.earliestNextDate))) {
        p2.push(`${where} ${r.vaccine}: unparseable earliestNextDate "${r.earliestNextDate}"`);
      } else {
        const last = maxDate(r.doses.map((d) => d.date));
        if (last != null && r.earliestNextDate < last) {
          p2.push(`${where} ${r.vaccine}: earliestNextDate ${r.earliestNextDate} is before the last recorded dose ${last}`);
        }
        if (r.earliestNextDate <= TODAY) {
          p2.push(`${where} ${r.vaccine}: earliestNextDate ${r.earliestNextDate} is not in the future (today is ${TODAY})`);
        }
      }
    }

    // ── Property 3: every actionable rec carries a citation ──────────
    if (ACTIONABLE_STATUSES.includes(r.status) && (!r.citations || r.citations.length === 0)) {
      p3.push(`${where} ${r.vaccine}: status "${r.status}" has zero citations`);
    }

    // ── Property 4: status is one of the known eight ─────────────────
    if (!KNOWN_STATUSES.includes(r.status)) {
      p4.push(`${where} ${r.vaccine}: unrecognised status "${r.status}"`);
    }
  }

  return allRecs;
}

// C1: singles at the full 3-month step, pairs at the coarser 6-month step
// (see test-grid.js's SWEEP_DOBS_COARSE for why) — same per-row checks either way.
const GRID_BATCHES = [
  [SWEEP_DOBS, SINGLE_RISK_PROFILES],
  [SWEEP_DOBS_COARSE, PAIR_RISK_PROFILES],
];

for (const [dobs, profiles] of GRID_BATCHES) {
  for (const dob of dobs) { // B2a/B2b: real dates of birth, fractional ages included
    const am = dobToAgeMonths(dob, TODAY);
    for (const riskIds of profiles) {
      for (let count = 0; count <= 5; count++) {
        const menacwyDoses = makeGenerousDoses(am, count, MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE, TODAY);
        const menbDoses = makeGenerousDoses(am, count, MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, TODAY);
        const where = `am=${am} risk=${JSON.stringify(riskIds)} count=${count}`;

        const allRecs = checkProperties1to5(`${where} [generous]`, am, dob, riskIds, menacwyDoses, menbDoses);

        // ── B2c: the same five checks, over the deliberately-invalid TIGHT
        // profile. Not a counting property, so no need to skip it here.
        const tightMenacwyDoses = makeTightDoses(am, count, MENACWY_SWEEP_BRAND, TODAY);
        const tightMenbDoses = makeTightDoses(am, count, MENB_SWEEP_BRAND, TODAY);
        checkProperties1to5(`${where} [tight]`, am, dob, riskIds, tightMenacwyDoses, tightMenbDoses);
        if (profiles === SINGLE_RISK_PROFILES) {
          checkProperty10(`${where} [generous]`, am, dob, riskIds, menacwyDoses);
          checkProperty10(`${where} [tight]`, am, dob, riskIds, tightMenacwyDoses);
        }

        if (allRecs == null) continue; // excluded or threw on the generous pass — nothing left to check below

        // ── Property 6 (HEURISTIC — for the owner's judgement, not a fixed
        // rule): a vaccine whose most recently counted dose already completes
        // the series (effectiveDoseNum === seriesTotal) but which still has a
        // "due"/dueToday rec that does not read as a booster. This is a rough
        // proxy for "asks to repeat a dose ACIP would already count" — the
        // plan names the four-day grace rule and the MenB dose-3 rescue as the
        // two places this has actually gone wrong, and both are narrower than
        // this heuristic catches. Treat every hit here as a candidate to look
        // at by hand, not as a confirmed bug. Generous doses only — see file
        // header.
        for (const [vaccine, doses] of [['MenACWY', menacwyDoses], ['MenB', menbDoses]]) {
          if (doses.length === 0) continue;
          const analysis = analyzeHistory(vaccine, doses, am, riskIds, TODAY, undefined, dob);
          const completedTotal = analysis.perDose
            .filter((d) => d.status === 'valid' && d.effectiveDoseNum != null)
            .reduce((max, d) => Math.max(max, d.effectiveDoseNum), 0);
          const seriesTotal = allRecs.find((r) => r.vaccine === vaccine)?.seriesTotal ?? null;
          if (seriesTotal != null && completedTotal >= seriesTotal) {
            const dueRec = allRecs.find((r) => r.vaccine === vaccine && r.dueToday);
            if (dueRec && !/boost/i.test(dueRec.doseLabel || '')) {
              p6.push(`${where} ${vaccine}: series reads complete (${completedTotal}/${seriesTotal}) but "${dueRec.doseLabel}" is still due today`);
            }
          }
        }

        // ── Property 8 (STOP C C1): an undated dose changes no card ──────────
        // Single-risk batch only (the pairs add runtime, not new shapes: the
        // rule is the same row for every risk profile).
        if (profiles === SINGLE_RISK_PROFILES) {
          const base = recommend({ today: TODAY, ageMonths: am, dob, riskIds, menacwyDoses, menbDoses });
          for (const [which, withRow] of [
            ['MenACWY', { menacwyDoses: [UNDATED_ROW, ...menacwyDoses], menbDoses }],
            ['MenB', { menacwyDoses, menbDoses: [UNDATED_ROW, ...menbDoses] }],
          ]) {
            const moved = recommend({ today: TODAY, ageMonths: am, dob, riskIds, ...withRow });
            p8Rows += 1;
            if (cardFacts(moved) !== cardFacts(base)) {
              p8.push(`${where} +undated ${which}: ${cardFacts(base)}  →  ${cardFacts(moved)}`);
            }
          }
        }

        // ── Property 7 (existing, F4): no chip implies N > M ────────────────
        // Already a real, enforced assertion in sweep-dose-counter.test.js on
        // this same (generous) grid; reported here too so all seven properties
        // show up in one place, per the plan. Not run against the tight
        // profile — see file header and sweep-dose-counter.test.js.
        for (const [vaccine, doses] of [['MenACWY', menacwyDoses], ['MenB', menbDoses]]) {
          if (doses.length === 0) continue;
          const analysis = analyzeHistory(vaccine, doses, am, riskIds, TODAY, undefined, dob);
          const total = allRecs.find((r) => r.vaccine === vaccine)?.seriesTotal ?? null;
          for (const entry of analysis.perDose) {
            const label = doseChipLabel(entry, total);
            p13Chips += 1;
            if (!inClosedList(label)) p13.push(`${where} ${vaccine}: "${label}"`);
            if (entry.status === 'valid' && !entry.notAdolescentCount && !entry.extraDose
                && entry.effectiveDoseNum != null && total != null
                && entry.effectiveDoseNum > total && label.startsWith('Dose ')) {
              p7.push(`${where} ${vaccine}: ${label} (N>M)`);
            }
          }
        }
      }
    }
  }
}

function report(name, violations) {
  // eslint-disable-next-line no-console
  console.log(
    `[sweep-never-events] ${name}: ${violations.length} violation(s) across ${rows.total} rows.`
    + (violations.length ? ` First ${Math.min(20, violations.length)}:\n  ${violations.slice(0, 20).join('\n  ')}` : ''),
  );
}

describe('B · never-events sweep (properties 1-5 enforced, 6 report-only — see file header)', () => {
  // Owner decision 2026-09-19: enforce as a real never-event. Known exception
  // (CDC's 4-day grace) is already built into the check above (GRACE_MONTHS),
  // not carved out here — a brand offered more than 4 days early is still a
  // real violation.
  it('property 1 — no brand offered below its own licensed minimum age', () => {
    report('Property 1 (brand below its licensed minimum age)', p1);
    expect(p1.slice(0, 20)).toEqual([]);
    expect(p1.length).toBe(0);
  });

  // Owner decision 2026-09-19: enforce as a real never-event, no known exception.
  it('property 2 — earliestNextDate is a real, forward-looking date', () => {
    report('Property 2 (earliestNextDate sanity)', p2);
    expect(p2.slice(0, 20)).toEqual([]);
    expect(p2.length).toBe(0);
  });

  // Owner decision 2026-09-19: enforce as a real never-event. Scope is
  // deliberately the four actionable statuses only — shared-decision and
  // deferred are excluded (built into ACTIONABLE_STATUSES above), because
  // the plan names them as legitimately citing differently.
  it('property 3 — every actionable rec (due/catchup/risk-based/exposure) carries a citation', () => {
    report('Property 3 (actionable rec with no citation)', p3);
    expect(p3.slice(0, 20)).toEqual([]);
    expect(p3.length).toBe(0);
  });

  // Owner decision 2026-09-19: enforce as a real never-event, no known exception.
  it('property 4 — status is always one of the known eight', () => {
    report('Property 4 (unrecognised status)', p4);
    expect(p4.slice(0, 20)).toEqual([]);
    expect(p4.length).toBe(0);
  });

  // Owner decision 2026-09-19: enforce as a real never-event, no known exception.
  it('property 5 — recommend() never throws, for any patient on the grid', () => {
    report('Property 5 (recommend() threw)', p5);
    expect(p5.slice(0, 20)).toEqual([]);
    expect(p5.length).toBe(0);
  });

  it('property 6 (HEURISTIC) — a completed series should not still read as due today', () => {
    report('Property 6 (heuristic: repeat of an already-counted dose)', p6);
    expect(rows.total).toBeGreaterThan(0);
  });

  it('property 8 (STOP C C1) — adding a dose with no date changes no card', () => {
    report('Property 8 (undated dose moved a card)', p8);
    expect(p8Rows).toBeGreaterThan(1000);
    expect(p8).toEqual([]);
  });

  it('property 9 (STOP C C5, C6) — high-risk MenB dose 3: never voided ≥4 months after dose 2; no 4th dose ≥6 months after dose 1', () => {
    report(`Property 9 (high-risk MenB dose 3, C5/C6; ${p9Rows} timings, not the grid rows)`, p9);
    expect(p9Rows).toBe(23 * 40);
    expect(p9).toEqual([]);
  });

  it('property 10 (STOP C C11) — no two counted MenACWY doses are under 8 weeks (less the grace) apart', () => {
    report(`Property 10 (counted MenACWY doses under 52 days apart; ${p10Rows} histories)`, p10);
    expect(p10Rows).toBeGreaterThan(1000);
    expect(p10).toEqual([]);
  });

  it('property 11 (owner D1, D2, D5, D6) — college 5-year cover; military booster floor; no counted MenACWY dose within 8 weeks of any dose given', () => {
    report(`Property 11 (college ${p11Rows.a}, military ${p11Rows.b}, any-dose clock ${p11Rows.c} histories)`, p11);
    expect(p11Rows.a).toBeGreaterThan(250);
    expect(p11Rows.b).toBe(270);
    expect(p11Rows.c).toBeGreaterThan(1000);
    expect(p11).toEqual([]);
  });

  it('property 12 (owner D10) — serogroup B outbreak: one MenB booster, then nothing more; asplenia keeps boosting', () => {
    report(`Property 12 (${p12Rows} booster dates)`, p12);
    expect(p12Rows).toBeGreaterThan(100);
    expect(p12).toEqual([]);
  });

  it('property 14 (owner F2a) — the combined shot is offered exactly when MenACWY is due and MenB is due or can be given today', () => {
    report(`Property 14 (${p14Rows} visits, ${p14GapRows} in the gap)`, p14);
    expect(p14Rows).toBeGreaterThan(300);
    expect(p14GapRows).toBeGreaterThan(10);
    expect(p14).toEqual([]);
  });

  it('property 13 (owner STOP E1, Q5–Q9) — every dose chip is one label from the closed list', () => {
    report(`Property 13 (${p13Chips} chips)`, p13);
    expect(p13Chips).toBeGreaterThan(1000);
    expect(p13).toEqual([]);
  });

  it('property 7 (existing, F4) — no dose chip implies N > M', () => {
    report('Property 7 (chip N>M, already enforced in sweep-dose-counter.test.js)', p7);
    expect(rows.total).toBeGreaterThan(0);
  });
});
