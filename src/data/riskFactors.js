// ─────────────────────────────────────────────────────────────────────────
// RISK FACTORS — meningococcal indication catalog.
//
// Each entry declares which vaccine(s) it indicates and the schedule class.
// This is the single source of truth the engine reads; do not hardcode risk
// strings in the engine.
//
// CRITICAL distinctions (verified against ACIP 2020 MMWR + CDC adult notes):
//   • HIV indicates MenACWY (routine, ≥2mo) but is NOT a MenB indication.
//   • Complement-inhibitor use (eculizumab/ravulizumab) indicates BOTH
//     MenACWY and MenB — a top-tier risk group, distinct from asplenia.
//   • Microbiologists routinely exposed to N. meningitidis isolates are
//     indicated for BOTH MenACWY and MenB.
//   • Travel, military, college-dorm indicate MenACWY only.
//   • Outbreak indication is serogroup-specific (ACWY vs B).
// ─────────────────────────────────────────────────────────────────────────

// menacwyClass:
//   'primary2' — 2-dose primary series + boosters every 3–5y while at risk
//   'single'   — 1 dose; 'single+boost' adds q5y boosters while risk persists
// menbClass:
//   'highrisk' — 3-dose 0/1–2/6mo primary + boosters; undefined = no MenB indication
//
// `group` is DISPLAY ONLY (which StepRisks.jsx section a checkbox renders
// under) — mirrors PneumoVax's grouping (owner decision, 2026-09-13):
//   'IC'       — immunocompromising/medical risk conditions
//   'exposure' — behavioral/occupational/environmental exposure
//   'other'    — doesn't fit either (pregnancy)
// It's separate from menacwyClass/menbClass, which the clinical engine reads.

export const RISK_FACTORS = [
  // ── Immunocompromising / medical risk conditions ─────────────────────
  {
    id: 'complement',
    label: 'Persistent complement deficiency or complement-inhibitor therapy',
    sublabel: 'e.g. C5–C9, properdin, factor H/D; or eculizumab (Soliris), ravulizumab (Ultomiris)',
    menacwyClass: 'primary2',
    menbClass: 'highrisk',
    group: 'IC',
    // cdcAdultMening dropped 2026-07-24: it just restates the acip2020 rule
    // (2026-07-23 owner decision). cdcComplementInhibitor stays — it has
    // unique content (newer complement inhibitors, incomplete-protection
    // finding, prophylaxis guidance) that the MMWR doesn't cover.
    refs: ['cdcComplementInhibitor', 'acip2020'],
  },
  {
    id: 'asplenia',
    label: 'Anatomic or functional asplenia/sickle cell disease',
    menacwyClass: 'primary2',
    menbClass: 'highrisk',
    group: 'IC',
    refs: ['acip2020'],
  },
  {
    id: 'hiv',
    label: 'HIV infection',
    menacwyClass: 'primary2',
    menbClass: undefined,
    group: 'IC',
    refs: ['acip2020'],
  },
  {
    id: 'hct',
    label: 'Hematopoietic cell transplant (HCT)',
    sublabel: 'full re-vaccination; advisory, coordinate with the transplant/ID team',
    menacwyClass: undefined,
    menbClass: undefined,
    group: 'IC',
    refs: ['cdcAlteredImmunocompetence', 'idsa2013MenacwyHct', 'kambojShah2019MenbHct'],
  },
  {
    id: 'hct_cart_bcell_exclude',
    label: 'CAR-T therapy, B-cell malignancy, or B-cell-depleting therapy',
    sublabel: 'this tool does not apply — needs an individualized, specialist-guided schedule',
    menacwyClass: undefined,
    menbClass: undefined,
    group: 'IC',
    exclude: true,
    refs: ['cdcAlteredImmunocompetence'],
  },

  // ── Exposure-based risks ──────────────────────────────────────────────
  {
    id: 'microbiologist',
    label: 'Microbiologist routinely exposed to N. meningitidis',
    menacwyClass: 'single+boost',
    menbClass: 'highrisk',
    group: 'exposure',
    // C2/2026-07-24: table anchor within acip2020 (Table 7), not the
    // generic whole-document chip.
    refs: ['acip2020Table7'],
  },
  {
    id: 'travel',
    label: 'Travel to / residence in hyperendemic or epidemic area',
    sublabel: 'including Hajj pilgrims, sub-Saharan "meningitis belt"',
    menacwyClass: 'single+boost',
    menbClass: undefined,
    group: 'exposure',
    // C2/2026-07-24: table anchor (Table 9) replaces both the generic
    // acip2020 chip and the separate cdcRecommendations page (W1 already
    // dropped the CDC-page duplication elsewhere for the same reason).
    refs: ['acip2020Table9'],
  },
  {
    id: 'military',
    label: 'Military recruit',
    menacwyClass: 'single',
    menbClass: undefined,
    group: 'exposure',
    refs: ['acip2020Table10'],
  },
  {
    id: 'college_dorm',
    label: 'First-year college student living in a residence hall',
    menacwyClass: 'single',
    menbClass: undefined,
    group: 'exposure',
    refs: ['acip2020Table10'],
  },
  {
    id: 'outbreak_acwy',
    label: 'Increased risk from a serogroup A/C/W/Y outbreak',
    menacwyClass: 'single',
    menbClass: undefined,
    group: 'exposure',
    refs: ['acip2020Table8'],
  },
  {
    id: 'outbreak_b',
    label: 'Increased risk from a serogroup B outbreak',
    menacwyClass: undefined,
    menbClass: 'highrisk',
    group: 'exposure',
    // C1/2026-07-24 note (flagged in the C2 plan, applied here): a MenB
    // indication, not MenACWY, so it gets the C1 mm7349a3 swap, not a
    // Table 8 (MenACWY) anchor.
    refs: ['mm7349a3', 'cdcRecommendations'],
  },

  // ── Other ──────────────────────────────────────────────────────────────
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    menacwyClass: undefined,
    menbClass: undefined,
    group: 'other',
    deferMenB: true,
    refs: ['cdcAdultMening'],
  },
];

export const RISK_BY_ID = Object.fromEntries(RISK_FACTORS.map((r) => [r.id, r]));

// Highest-priority MenACWY class among the patient's selected risks.
// primary2 > single+boost > single. Returns null if no MenACWY risk.
export function menacwyRiskClass(riskIds = []) {
  const classes = riskIds.map((id) => RISK_BY_ID[id]?.menacwyClass).filter(Boolean);
  if (classes.includes('primary2')) return 'primary2';
  if (classes.includes('single+boost')) return 'single+boost';
  if (classes.includes('single')) return 'single';
  return null;
}

// M10: does this patient need the MenACWY INFANT series (under 2 years)?
//
// The infant series is keyed to the age at dose 1, NOT to why the infant is
// being vaccinated. ACIP 2020 MMWR 69(RR-9) prints the identical "2-23 mos" row
// in Table 9 (travel), Table 8 (outbreak) and Tables 4-6 (medical high risk),
// fetched live from cdc.gov 2026-09-15:
//   "MenACWY-CRM: If first dose at age
//      - 2 mos: 4 doses at 2, 4, 6, and 12 mos
//      - 3-6 mos: See catch-up schedule
//      - 7-23 mos: 2 doses (second dose >=12 wks after the first dose and after
//        the 1st birthday)"
//
// Before M10 the infant series was reached only through riskClass 'primary2',
// so an infant traveler fell to the single+boost branch ("1 dose") and an infant
// outbreak contact to the single branch ("1 dose").
//
// Microbiologists and military recruits are deliberately excluded: ACIP gives
// them no infant row at all (Table 7 covers ages ">=10 yrs", Table 10 is
// recruits), so they keep their single-dose answer.
export function menacwyInfantSeriesIndicated(riskIds = []) {
  if (menacwyRiskClass(riskIds) === 'primary2') return true;
  return riskIds.some((id) => ['travel', 'outbreak_acwy'].includes(id));
}

// Whether any selected risk indicates high-risk MenB.
export function hasMenbRisk(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.menbClass === 'highrisk');
}

// Whether MenB should be deferred (pregnancy without an overriding risk).
export function shouldDeferMenB(riskIds = []) {
  const defer = riskIds.some((id) => RISK_BY_ID[id]?.deferMenB);
  return defer && !hasMenbRisk(riskIds);
}

// CAR-T therapy / B-cell malignancy / B-cell-depleting therapy selected?
// This hard-stops the whole engine — too heterogeneous for one safe recipe.
export function hasExclusion(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.exclude);
}

// Any HCT (hematopoietic cell transplant) selected?
export function hasHCT(riskIds = []) {
  return riskIds.includes('hct');
}
