// ─────────────────────────────────────────────────────────────────────────
// recommend.js — the MeningoVax recommendation engine.
//
// Pure function. Given a patient (age, risks, MenACWY history, MenB history),
// returns the current MenACWY and MenB recommendations with citations, plus a
// pentavalent (MenABCWY) offer when both antigens are due at the same visit.
//
// Every clinical rule here is traceable to a citation key in src/data/refs.js.
// Verified against ACIP 2020 MMWR (RR-9), CDC adult & child schedule notes, the
// 2023 Pfizer and 2025 GSK pentavalent MMWRs, and CDC complement-inhibitor
// guidance. See src/data/refs.js.
//
// Design rule (ported from vaxapp): brand validity and the MenB antigen-family
// lock are computed HERE and downstream surfaces consume the pre-filtered
// brand strings. Do not re-derive brand eligibility in the UI.
// ─────────────────────────────────────────────────────────────────────────

import { resolveRefs } from '../data/refs.js';
import {
  menacwyRiskClass,
  hasMenbRisk,
  shouldDeferMenB,
  RISK_BY_ID,
} from '../data/riskFactors.js';
import { menbFamily } from '../data/brands.js';
import { todayISO, addDays, daysBetween, intervalElapsed, DAYS } from './dateUtils.js';

// Age bands (months)
const M = {
  y2: 24, y7: 84, y10: 120, y11: 132, y16: 192, y18: 216, y19: 228, y23: 276,
};

// ── brand option builders ─────────────────────────────────────────────────
const MENACWY_STD = ['Menveo (MenACWY-CRM, ≥2mo)', 'MenQuadfi (MenACWY-TT, ≥2y)'];
const MENACWY_INFANT = ['Menveo (MenACWY-CRM, ≥2mo — only brand licensed for infants)'];

function menacwyBrands(am) {
  if (am < M.y2) return MENACWY_INFANT;
  return MENACWY_STD;
}

// MenB brand options given the established family (from dose 1) and dose number.
function menbBrands(family, includePentavalentHint) {
  if (family === '4C') {
    const list = ['Bexsero (MenB-4C)'];
    if (includePentavalentHint) list.push('Penmenvy (MenACWY/MenB-4C, ≥10y) — if MenACWY also due');
    return list;
  }
  if (family === 'FHbp') {
    const list = ['Trumenba (MenB-FHbp)'];
    if (includePentavalentHint) list.push('Penbraya (MenACWY/MenB-FHbp, ≥10y) — if MenACWY also due');
    return list;
  }
  // No family established yet — both families open
  const list = ['Bexsero (MenB-4C)', 'Trumenba (MenB-FHbp)'];
  if (includePentavalentHint) {
    list.push('Penmenvy (MenACWY/MenB-4C, ≥10y) — if MenACWY also due');
    list.push('Penbraya (MenACWY/MenB-FHbp, ≥10y) — if MenACWY also due');
  }
  return list;
}

function rec(o) {
  return {
    vaccine: o.vaccine,
    status: o.status,          // due | catchup | risk-based | shared-decision | complete | not-indicated | deferred
    doseLabel: o.doseLabel,
    doseNum: o.doseNum ?? null,
    dueToday: !!o.dueToday,
    earliestNextDate: o.earliestNextDate ?? null,
    minIntervalDays: o.minIntervalDays ?? null,
    brands: o.brands ?? [],
    family: o.family ?? null,
    note: o.note,
    citations: resolveRefs(o.refs ?? []),
  };
}

// Compute age (months) at a past dose from its date and current age.
function ageAtDose(dose, am, today) {
  if (typeof dose?.ageMonths === 'number') return dose.ageMonths;
  if (dose?.date) return am - daysBetween(dose.date, today) / 30.4375;
  return null;
}

// ── MenACWY ────────────────────────────────────────────────────────────────
function menacwyRec(am, riskIds, doses, today) {
  const given = doses.length;
  const last = doses[given - 1] || null;
  const lastDate = last?.date || null;
  const riskClass = menacwyRiskClass(riskIds);
  const refsFor = (ids) => collectRefs(riskIds, ids, ['cdcAdultMening', 'acip2020']);

  // Booster cadence: high-risk children boost every 3y if dose given <7y, else 5y.
  const lastAge = ageAtDose(last, am, today);
  const boostDays = (lastAge != null && lastAge < M.y7) || am < M.y7
    ? DAYS.years(3)
    : DAYS.years(5);

  // ── Medical high risk: 2-dose primary + lifelong boosters ────────────────
  if (riskClass === 'primary2') {
    // Infant pathways (high risk, <2y)
    if (am < M.y2) {
      return [menacwyInfantHighRisk(am, given, last, today, riskIds)];
    }
    // ≥2y: 2-dose primary ≥8 weeks apart, then boosters.
    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 (high-risk primary series)',
        doseNum: 1, dueToday: true, brands: menacwyBrands(am),
        note: 'High-risk indication (asplenia, persistent complement deficiency, complement-inhibitor therapy, or HIV): 2-dose primary series ≥8 weeks apart, then a booster 3–5 years later and every 5 years while at increased risk.',
        refs: refsFor([]),
      })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, DAYS.weeks(8), today);
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 2 of 2 (high-risk primary series)',
        doseNum: 2, dueToday: elapsed,
        earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.weeks(8)),
        minIntervalDays: DAYS.weeks(8), brands: menacwyBrands(am),
        note: 'Second dose of the high-risk primary series, ≥8 weeks after dose 1. After completion, boost every 5 years (every 3 years if doses given before age 7) while at increased risk.',
        refs: refsFor([]),
      })];
    }
    // given >= 2: primary complete → ongoing boosters
    const elapsed = intervalElapsed(lastDate, boostDays, today);
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, every ${boostDays === DAYS.years(3) ? '3' : '5'} years)`,
      doseNum: given + 1, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addDays(lastDate, boostDays),
      minIntervalDays: boostDays, brands: menacwyBrands(am),
      note: 'Primary series complete. Continue MenACWY boosters while the high-risk condition persists: every 5 years (every 3 years for children whose doses were given before age 7).',
      refs: refsFor([]),
    })];
  }

  // ── Single dose with ongoing boosters (travel, microbiologist) ───────────
  if (riskClass === 'single+boost') {
    if (given === 0) {
      return [rec({
        vaccine: 'MenACWY', status: 'risk-based', doseLabel: '1 dose (ongoing-risk indication)',
        doseNum: 1, dueToday: true, brands: menacwyBrands(am),
        note: 'Travel to hyperendemic/epidemic areas or routine occupational exposure (microbiologist): 1 dose now. Re-vaccinate every 5 years if risk continues.',
        refs: refsFor(['cdcRecommendations']),
      })];
    }
    const elapsed = intervalElapsed(lastDate, DAYS.years(5), today);
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Booster (dose ${given + 1}, every 5 years)`,
      doseNum: given + 1, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.years(5)),
      minIntervalDays: DAYS.years(5), brands: menacwyBrands(am),
      note: 'Re-vaccinate every 5 years while travel or occupational exposure continues.',
      refs: refsFor(['cdcRecommendations']),
    })];
  }

  // ── Single dose, no booster (military, college dorm, ACWY outbreak) ───────
  if (riskClass === 'single') {
    // College-dorm: only if not vaccinated at ≥16y.
    const hasDoseAt16 = doses.some((d) => (ageAtDose(d, am, today) ?? 0) >= M.y16);
    if (given >= 1 && hasDoseAt16) {
      return [rec({
        vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete',
        note: 'A MenACWY dose given at age ≥16 years satisfies this indication; no additional dose needed.',
        refs: refsFor([]),
      })];
    }
    return [rec({
      vaccine: 'MenACWY', status: 'risk-based', doseLabel: '1 dose',
      doseNum: 1, dueToday: true, brands: menacwyBrands(am),
      note: 'First-year college students in residence halls (if not vaccinated at age ≥16y), military recruits, and persons at risk during a serogroup A/C/W/Y outbreak: a single MenACWY dose.',
      refs: refsFor([]),
    })];
  }

  // ── No MenACWY risk → routine adolescent schedule ────────────────────────
  return menacwyRoutine(am, given, doses, last, today);
}

function menacwyInfantHighRisk(am, given, last, today, riskIds) {
  const refs = collectRefs(riskIds, [], ['cdcChildMenACWY', 'acip2020']);
  const lastDate = last?.date || null;
  if (am < M.y2 && given === 0 && am >= 2) {
    // start series; Menveo only
    if (am <= 6) {
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 4 (infant high-risk)', doseNum: 1, dueToday: true,
        brands: MENACWY_INFANT, minIntervalDays: DAYS.weeks(4),
        note: 'High-risk infants 2–6 months: 4-dose Menveo series at 2, 4, 6, and 12 months (≥4 weeks between primary doses). Only Menveo is licensed for infants ≥2 months.', refs });
    }
    if (am <= 11) {
      return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 + booster (infant high-risk 7–11mo)', doseNum: 1, dueToday: true,
        brands: MENACWY_INFANT, minIntervalDays: DAYS.weeks(8),
        note: 'High-risk infants 7–11 months: 2-dose primary (≥8 weeks apart) with Menveo, then a booster at 12–23 months (≥8 weeks after the primary series).', refs });
    }
    // 12-23m unvaccinated
    return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: 'Dose 1 of 2 (high-risk 12–23mo)', doseNum: 1, dueToday: true,
      brands: menacwyBrands(am), minIntervalDays: DAYS.weeks(8),
      note: 'High-risk children 12–23 months, unvaccinated: 2-dose primary ≥8 weeks apart, then boost every 3–5 years while at risk.', refs });
  }
  // continuing an infant series
  const elapsed = intervalElapsed(lastDate, DAYS.weeks(4), today);
  return rec({ vaccine: 'MenACWY', status: 'risk-based', doseLabel: `Dose ${given + 1} (infant high-risk series)`, doseNum: given + 1,
    dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.weeks(4)), minIntervalDays: DAYS.weeks(4),
    brands: MENACWY_INFANT,
    note: 'Continue the high-risk infant Menveo series (≥4 weeks between primary doses; booster at ~12 months), then boost every 3–5 years while at risk.', refs });
}

function menacwyRoutine(am, given, doses, last, today) {
  const refs = ['cdcChildMenACWY', 'acip2020'];
  const lastDate = last?.date || null;
  const hasDoseAt16 = doses.some((d) => (ageAtDose(d, am, today) ?? 0) >= M.y16);

  if (am < M.y11) {
    return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not yet due',
      note: 'Routine MenACWY is recommended at 11–12 years (with a booster at 16 years). No routine dose is indicated at this age without a risk factor.', refs })];
  }
  // 11–15y
  if (am < M.y16) {
    if (given === 0) {
      return [rec({ vaccine: 'MenACWY', status: 'due', doseLabel: 'Dose 1 (routine, 11–12y)', doseNum: 1, dueToday: true,
        brands: menacwyBrands(am),
        note: 'Routine adolescent dose at 11–12 years. A booster follows at 16 years. If MenB is also being started under shared clinical decision-making, a pentavalent product may be used when both are given the same day.', refs })];
    }
    // already has dose 1 → booster due at 16y (future)
    return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Booster due at 16y',
      earliestNextDate: null,
      note: 'Routine dose 1 recorded. The routine booster is due at age 16 years.', refs })];
  }
  // 16–18y
  if (am < M.y19) {
    if (hasDoseAt16) {
      return [rec({ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Complete',
        note: 'A MenACWY dose given at age ≥16 years completes the routine adolescent schedule; no further routine doses are needed.', refs })];
    }
    return [rec({ vaccine: 'MenACWY', status: given === 0 ? 'catchup' : 'due',
      doseLabel: given === 0 ? 'Dose 1 (catch-up, ≥16y — no booster needed)' : 'Booster (16y)',
      doseNum: given + 1, dueToday: true, brands: menacwyBrands(am),
      note: given === 0
        ? 'Unvaccinated adolescent ≥16 years: a single MenACWY dose; because it is given at ≥16y, no booster is required.'
        : 'Routine 16-year booster (the dose given at 11–12y does not count as the booster).', refs })];
  }
  // ≥19y healthy, no risk
  return [rec({ vaccine: 'MenACWY', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    note: 'Healthy adults ≥19 years without a risk factor are not routinely recommended to receive MenACWY. Vaccinate only if a risk indication applies (asplenia, complement deficiency, complement-inhibitor therapy, HIV, microbiologist, travel, military, or outbreak).', refs })];
}

// ── MenB ─────────────────────────────────────────────────────────────────
function menbRec(am, riskIds, doses, today) {
  const given = doses.length;
  const last = doses[given - 1] || null;
  const lastDate = last?.date || null;
  const firstBrand = doses[0]?.brand || '';
  const family = menbFamily(firstBrand); // null until a branded dose 1 exists
  const highRisk = hasMenbRisk(riskIds);
  const refs = (extra = []) => collectRefs(riskIds, extra, highRisk ? ['acip2020', 'cdcAdultMening'] : ['cdcChildMenB']);

  // MenB is only licensed ≥10y.
  if (am < M.y10) {
    if (highRisk) {
      return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not yet age-eligible',
        note: 'MenB vaccines are licensed from age 10 years. This high-risk patient becomes MenB-eligible at age 10; track for the 3-dose high-risk series then.', refs: refs() })];
    }
    return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not indicated',
      note: 'MenB is licensed from age 10 years and is not routinely indicated below age 16 without a risk factor.', refs: refs() })];
  }

  // Pregnancy deferral (unless an overriding high-risk indication applies).
  if (shouldDeferMenB(riskIds)) {
    return [rec({ vaccine: 'MenB', status: 'deferred', doseLabel: 'Defer during pregnancy',
      note: 'MenB is generally deferred during pregnancy due to limited safety data, unless the patient is at increased risk (asplenia, complement deficiency, complement-inhibitor therapy, microbiologist, or serogroup B outbreak).', refs: refs() })];
  }

  const pentaHint = am >= M.y10; // pentavalent products start at ≥10y

  // ── High-risk: 3-dose 0/1–2/6 primary + boosters ─────────────────────────
  if (highRisk) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: 'Dose 1 of 3 (high-risk series)', doseNum: 1, dueToday: true,
        family, brands: menbBrands(family, pentaHint),
        note: 'High-risk indication: 3-dose MenB series at 0, 1–2, and 6 months. Pick one antigen family and stay in it — MenB-4C (Bexsero/Penmenvy) and MenB-FHbp (Trumenba/Penbraya) are NOT interchangeable.',
        refs: refs(['cdcComplementInhibitor']) })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, DAYS.weeks(4), today);
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 2 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 2,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.weeks(4)), minIntervalDays: DAYS.weeks(4),
        family, brands: menbBrands(family, pentaHint),
        note: 'High-risk 3-dose schedule: dose 2 is given 1–2 months (≥4 weeks) after dose 1. Continue in the same antigen family as dose 1.',
        refs: refs() })];
    }
    if (given === 2) {
      const elapsed = intervalElapsed(doses[0]?.date, DAYS.months(6), today);
      return [rec({ vaccine: 'MenB', status: 'risk-based', doseLabel: `Dose 3 of 3 (high-risk${family ? `, ${family}` : ''})`, doseNum: 3,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(doses[0].date, DAYS.months(6)), minIntervalDays: DAYS.months(6),
        family, brands: menbBrands(family, pentaHint),
        note: 'High-risk 3-dose schedule: dose 3 is given ≥6 months after dose 1 (and ≥4 months after dose 2). After completion, boost 1 year later, then every 2–3 years while at risk.',
        refs: refs() })];
    }
    // given >= 3: primary complete → boosters
    const firstBooster = given === 3;
    const intervalDays = firstBooster ? DAYS.years(1) : DAYS.years(2);
    const elapsed = intervalElapsed(lastDate, intervalDays, today);
    return [rec({ vaccine: 'MenB', status: 'risk-based',
      doseLabel: `Booster (dose ${given + 1}, ${firstBooster ? '1 year after primary' : 'every 2–3 years'})`,
      doseNum: given + 1, dueToday: elapsed,
      earliestNextDate: elapsed ? null : addDays(lastDate, intervalDays), minIntervalDays: intervalDays,
      family, brands: menbBrands(family, pentaHint),
      note: 'High-risk MenB booster: 1 year after completing the primary series, then every 2–3 years while the high-risk condition persists. Stay in the same antigen family.',
      refs: refs() })];
  }

  // ── Healthy 16–23y shared clinical decision-making: 2-dose 0/6 ───────────
  if (am >= M.y16 && am <= M.y23) {
    if (given === 0) {
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: 'Dose 1 of 2 (shared clinical decision)', doseNum: 1, dueToday: true,
        family, brands: menbBrands(family, pentaHint),
        note: 'Healthy adolescents/young adults 16–23 years (preferably 16–18) may receive MenB based on shared clinical decision-making. Healthy schedule is 2 doses at 0 and 6 months (per 2025 ACIP, the healthy MenB-4C interval is ≥6 months — not ≥1 month). Complete the series in one antigen family.',
        refs: refs(['pentavalentGSK2025']) })];
    }
    if (given === 1) {
      const elapsed = intervalElapsed(lastDate, DAYS.months(6), today);
      return [rec({ vaccine: 'MenB', status: 'shared-decision', doseLabel: `Dose 2 of 2 (${family || 'same family'})`, doseNum: 2,
        dueToday: elapsed, earliestNextDate: elapsed ? null : addDays(lastDate, DAYS.months(6)), minIntervalDays: DAYS.months(6),
        family, brands: menbBrands(family, pentaHint),
        note: 'Healthy 2-dose schedule: dose 2 is given ≥6 months after dose 1. Continue in the same antigen family as dose 1. Series complete after 2 doses.',
        refs: refs(['pentavalentGSK2025']) })];
    }
    return [rec({ vaccine: 'MenB', status: 'complete', doseLabel: 'Complete', family,
      note: 'Healthy 2-dose MenB series complete. No booster is recommended unless the patient develops a high-risk indication.', refs: refs() })];
  }

  // Healthy outside 16–23y → not routinely indicated
  return [rec({ vaccine: 'MenB', status: 'not-indicated', doseLabel: 'Not routinely indicated',
    note: am < M.y16
      ? 'MenB shared clinical decision-making applies to ages 16–23 years (preferably 16–18). Not routinely indicated yet at this age without a risk factor.'
      : 'MenB is not routinely recommended for healthy adults outside the 16–23-year shared-decision window. Vaccinate only for a high-risk indication.',
    family, refs: refs() })];
}

// Merge risk-driven ref keys with defaults, de-duplicated, preserving order.
function collectRefs(riskIds, extra, defaults) {
  const out = [];
  for (const id of riskIds) {
    for (const k of RISK_BY_ID[id]?.refs ?? []) if (!out.includes(k)) out.push(k);
  }
  for (const k of [...extra, ...defaults]) if (!out.includes(k)) out.push(k);
  return out;
}

// ── Public API ───────────────────────────────────────────────────────────
export function recommend(input) {
  const am = input.ageMonths ?? 0;
  const riskIds = input.riskIds ?? [];
  const today = todayISO(input.today);
  const menacwyDoses = (input.menacwyDoses ?? []).filter(Boolean);
  const menbDoses = (input.menbDoses ?? []).filter(Boolean);

  const menacwy = menacwyRec(am, riskIds, menacwyDoses, today);
  const menb = menbRec(am, riskIds, menbDoses, today);

  // Pentavalent (MenABCWY) is an OPTION only when a MenACWY dose AND a MenB
  // dose are both due today at this visit (and the patient is ≥10y).
  const acwyDueToday = menacwy.some((r) => r.dueToday);
  const bDueToday = menb.some((r) => r.dueToday);
  const pentavalentEligible = am >= M.y10 && acwyDueToday && bDueToday;

  // Determine which pentavalent matches the established/needed MenB family.
  const bFamily = menb.find((r) => r.family)?.family ?? null;
  const pentavalent = pentavalentEligible
    ? {
        eligible: true,
        note: 'Both MenACWY and MenB are due today. A single pentavalent (MenABCWY) dose may be given instead of two separate injections. The two pentavalents are NOT interchangeable across the rest of the MenB series: Penmenvy = MenB-4C (continue with Bexsero/Penmenvy); Penbraya = MenB-FHbp (continue with Trumenba/Penbraya).',
        brands: bFamily === '4C'
          ? ['Penmenvy (MenACWY-CRM/MenB-4C, ≥10y)']
          : bFamily === 'FHbp'
            ? ['Penbraya (MenACWY-TT/MenB-FHbp, ≥10y)']
            : ['Penmenvy (MenACWY-CRM/MenB-4C, ≥10y)', 'Penbraya (MenACWY-TT/MenB-FHbp, ≥10y)'],
        citations: resolveRefs(['pentavalentGSK2025', 'pentavalentPfizer2023']),
      }
    : { eligible: false };

  return { menacwy, menb, pentavalent, meta: { ageMonths: am, today, riskIds } };
}
