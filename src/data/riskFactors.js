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

export const RISK_FACTORS = [
  {
    id: 'complement',
    label: 'Persistent complement deficiency or complement-inhibitor therapy',
    sublabel: 'e.g. C5–C9, properdin, factor H/D; or eculizumab (Soliris), ravulizumab (Ultomiris)',
    menacwyClass: 'primary2',
    menbClass: 'highrisk',
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
    refs: ['acip2020'],
  },
  {
    id: 'hiv',
    label: 'HIV infection',
    menacwyClass: 'primary2',
    menbClass: undefined,
    refs: ['acip2020'],
  },
  {
    id: 'microbiologist',
    label: 'Microbiologist routinely exposed to N. meningitidis',
    menacwyClass: 'single+boost',
    menbClass: 'highrisk',
    refs: ['acip2020'],
  },
  {
    id: 'travel',
    label: 'Travel to / residence in hyperendemic or epidemic area',
    sublabel: 'including Hajj pilgrims, sub-Saharan "meningitis belt"',
    menacwyClass: 'single+boost',
    menbClass: undefined,
    refs: ['acip2020', 'cdcRecommendations'],
  },
  {
    id: 'military',
    label: 'Military recruit',
    menacwyClass: 'single',
    menbClass: undefined,
    refs: ['acip2020'],
  },
  {
    id: 'college_dorm',
    label: 'First-year college student living in a residence hall',
    menacwyClass: 'single',
    menbClass: undefined,
    refs: ['acip2020'],
  },
  {
    id: 'outbreak_acwy',
    label: 'Increased risk from a serogroup A/C/W/Y outbreak',
    menacwyClass: 'single',
    menbClass: undefined,
    refs: ['cdcRecommendations'],
  },
  {
    id: 'outbreak_b',
    label: 'Increased risk from a serogroup B outbreak',
    menacwyClass: undefined,
    menbClass: 'highrisk',
    refs: ['cdcChildMenB', 'cdcRecommendations'],
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    menacwyClass: undefined,
    menbClass: undefined,
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

// Whether any selected risk indicates high-risk MenB.
export function hasMenbRisk(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.menbClass === 'highrisk');
}

// Whether MenB should be deferred (pregnancy without an overriding risk).
export function shouldDeferMenB(riskIds = []) {
  const defer = riskIds.some((id) => RISK_BY_ID[id]?.deferMenB);
  return defer && !hasMenbRisk(riskIds);
}
