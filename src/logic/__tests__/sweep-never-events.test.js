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
// REPORT-ONLY. This file asserts NOTHING about clinical correctness. It
// prints a violation count and up to 20 examples per property and leaves it
// there, on purpose (plan item B, "The discipline that makes this safe").
// Several of these properties have legitimate exceptions — the four-day
// grace rule, pentavalent age floors, shared-decision citations — and a
// naive assertion would fail on those, not on a real bug. The owner reviews
// this output; only then does a property get turned into a real assertion,
// one property per commit, with the exception written down in a comment
// citing her decision and the date.
//
// The one real (non-report-only) assertion in each `it()` below just checks
// that the sweep actually ran a nonzero number of rows — a structural
// safety net against an empty grid silently reporting "0 violations"
// because nothing executed, not a clinical claim.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';
import { ALL_BRANDS } from '../../data/brands.js';
import { TEST_TODAY } from '../../test-today.js';
import {
  MAX_AGE_MONTHS, SINGLE_RISK_PROFILES, MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE,
  MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, makeGenerousDoses,
} from '../../test-grid.js';

const TODAY = TEST_TODAY;

// The known set, as recommend.js's own `rec()` comments it (property 4).
const KNOWN_STATUSES = [
  'due', 'catchup', 'risk-based', 'exposure', 'shared-decision', 'complete', 'not-indicated', 'deferred',
];
// Property 3's scope, per the plan: shared-decision and deferred may
// legitimately differ in how they cite, so they are excluded here.
const ACTIONABLE_STATUSES = ['due', 'catchup', 'risk-based', 'exposure'];

const BRAND_MIN_AGE = new Map(ALL_BRANDS.map((b) => [b.label, b.minAgeM]));

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

for (let am = 0; am <= MAX_AGE_MONTHS; am += 3) {
  for (const riskIds of SINGLE_RISK_PROFILES) {
    for (let count = 0; count <= 5; count++) {
      const menacwyDoses = makeGenerousDoses(am, count, MENACWY_SWEEP_BRAND, MENACWY_SWEEP_BRAND_MIN_AGE, TODAY);
      const menbDoses = makeGenerousDoses(am, count, MENB_SWEEP_BRAND, MENB_SWEEP_BRAND_MIN_AGE, TODAY);
      const where = `am=${am} risk=${JSON.stringify(riskIds)} count=${count}`;

      let result;
      try {
        result = recommend({ today: TODAY, ageMonths: am, riskIds, menacwyDoses, menbDoses });
      } catch (e) {
        p5.push(`${where}: recommend() threw — ${e.message}`);
        continue;
      }
      rows.total += 1;
      if (result.excluded) continue; // hard-stop combos carry no dose chips (none in SINGLE_RISK_PROFILES today, kept as a guard)

      const allRecs = [
        ...result.menacwy.map((r) => ({ ...r, vaccine: 'MenACWY', doses: menacwyDoses })),
        ...result.menb.map((r) => ({ ...r, vaccine: 'MenB', doses: menbDoses })),
      ];

      for (const r of allRecs) {
        // ── Property 1: no brand below its own licensed minimum age ──────
        if (r.dueToday) {
          for (const brandLabel of r.brands) {
            const minAgeM = BRAND_MIN_AGE.get(brandLabel);
            if (minAgeM == null) {
              p1.push(`${where} ${r.vaccine}: offered unrecognised brand "${brandLabel}"`);
            } else if (am + GRACE_MONTHS < minAgeM) {
              p1.push(`${where} ${r.vaccine}: offered "${brandLabel}" (floor ${minAgeM}mo) at age ${am}mo`);
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

      // ── Property 6 (HEURISTIC — for the owner's judgement, not a fixed
      // rule): a vaccine whose most recently counted dose already completes
      // the series (effectiveDoseNum === seriesTotal) but which still has a
      // "due"/dueToday rec that does not read as a booster. This is a rough
      // proxy for "asks to repeat a dose ACIP would already count" — the
      // plan names the four-day grace rule and the MenB dose-3 rescue as the
      // two places this has actually gone wrong, and both are narrower than
      // this heuristic catches. Treat every hit here as a candidate to look
      // at by hand, not as a confirmed bug.
      for (const [vaccine, doses] of [['MenACWY', menacwyDoses], ['MenB', menbDoses]]) {
        if (doses.length === 0) continue;
        const analysis = analyzeHistory(vaccine, doses, am, riskIds, TODAY);
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

      // ── Property 7 (existing, F4): no chip implies N > M ────────────────
      // Already a real, enforced assertion in sweep-dose-counter.test.js on
      // this same grid; reported here too so all seven properties show up
      // in one place, per the plan.
      for (const [vaccine, doses] of [['MenACWY', menacwyDoses], ['MenB', menbDoses]]) {
        if (doses.length === 0) continue;
        const analysis = analyzeHistory(vaccine, doses, am, riskIds, TODAY);
        const total = allRecs.find((r) => r.vaccine === vaccine)?.seriesTotal ?? null;
        for (const entry of analysis.perDose) {
          const label = doseChipLabel(entry, total);
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

function report(name, violations) {
  // eslint-disable-next-line no-console
  console.log(
    `[sweep-never-events] ${name}: ${violations.length} violation(s) across ${rows.total} rows.`
    + (violations.length ? ` First ${Math.min(20, violations.length)}:\n  ${violations.slice(0, 20).join('\n  ')}` : ''),
  );
}

describe('B · never-events sweep (report-only — see file header before asserting anything from this)', () => {
  // Owner decision 2026-09-19: enforce as a real never-event. Known exception
  // (CDC's 4-day grace) is already built into the check above (GRACE_MONTHS),
  // not carved out here — a brand offered more than 4 days early is still a
  // real violation.
  it('property 1 — no brand offered below its own licensed minimum age', () => {
    report('Property 1 (brand below its licensed minimum age)', p1);
    expect(p1.slice(0, 20)).toEqual([]);
    expect(p1.length).toBe(0);
  });

  it('property 2 — earliestNextDate is a real, forward-looking date', () => {
    report('Property 2 (earliestNextDate sanity)', p2);
    expect(rows.total).toBeGreaterThan(0);
  });

  it('property 3 — every actionable rec (due/catchup/risk-based/exposure) carries a citation', () => {
    report('Property 3 (actionable rec with no citation)', p3);
    expect(rows.total).toBeGreaterThan(0);
  });

  it('property 4 — status is always one of the known eight', () => {
    report('Property 4 (unrecognised status)', p4);
    expect(rows.total).toBeGreaterThan(0);
  });

  it('property 5 — recommend() never throws, for any patient on the grid', () => {
    report('Property 5 (recommend() threw)', p5);
    expect(rows.total).toBeGreaterThan(0);
  });

  it('property 6 (HEURISTIC) — a completed series should not still read as due today', () => {
    report('Property 6 (heuristic: repeat of an already-counted dose)', p6);
    expect(rows.total).toBeGreaterThan(0);
  });

  it('property 7 (existing, F4) — no dose chip implies N > M', () => {
    report('Property 7 (chip N>M, already enforced in sweep-dose-counter.test.js)', p7);
    expect(rows.total).toBeGreaterThan(0);
  });
});
