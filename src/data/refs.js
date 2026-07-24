// ─────────────────────────────────────────────────────────────────────────
// REFS — single source of truth for all reference URLs in MeningoVax.
//
// Every recommendation carries one or more citation keys from this map so the
// clinician can see the "why" behind each rec. All URLs verified live
// 2026-06-03. When adding a citation, prefer ACIP/CDC/immunize.org over FDA
// package inserts (FDA-labeled ages are often more restrictive than ACIP).
//
// Re-verify the annual / recently-updated entries (pentavalent MMWRs, adult
// schedule notes) each year — ACIP updated the meningococcal schedule in 2025.
//
// Each entry has:
//   url    — canonical source URL
//   label  — full descriptive title (used in hover tooltip / title= attribute)
//   short  — concise label for citation chips (rendered in the chip button text)
// ─────────────────────────────────────────────────────────────────────────

export const REFS = {
  // CDC schedule notes ----------------------------------------------------
  cdcChildMenACWY: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    label: 'CDC Child/Adolescent Schedule: Meningococcal ACWY notes',
    short: 'CDC Child/Adolescent Notes',
  },
  cdcChildMenB: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    label: 'CDC Child/Adolescent Schedule: Meningococcal B notes',
    short: 'CDC MenB Notes',
  },
  cdcAdultMening: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening',
    label: 'CDC Adult Immunization Schedule: Meningococcal notes',
    short: 'CDC Adult Notes',
  },

  // ACIP MMWR source-of-truth --------------------------------------------
  acip2020: {
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7527029/',
    label: 'Mbaeyi SA et al. Meningococcal Vaccination: ACIP Recommendations, United States, 2020 (MMWR RR-9)',
    short: 'ACIP 2020 MMWR',
  },
  pentavalentGSK2025: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    label: 'ACIP 2025: GSK pentavalent MenACWY-CRM/MenB-4C (Penmenvy), persons ≥10y (MMWR 2025)',
    short: 'Penmenvy MMWR 2025',
  },
  pentavalentPfizer2023: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm',
    label: 'ACIP 2023: Pfizer pentavalent MenACWY-TT/MenB-FHbp (Penbraya), persons ≥10y (MMWR 2024;73)',
    short: 'Penbraya MMWR 2023',
  },

  // CDC clinician guidance ------------------------------------------------
  cdcRecommendations: {
    url: 'https://www.cdc.gov/vaccines/vpd/mening/hcp/recommendations.html',
    label: 'CDC: Meningococcal Vaccine Recommendations (HCP)',
    short: 'CDC Meningococcal Recommendations',
  },
  cdcComplementInhibitor: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    label: 'CDC: Managing Meningococcal Risk in Patients on Complement Inhibitor Therapy',
    short: 'CDC Complement-Inhibitor Guidance',
  },

  // immunize.org ----------------------------------------------------------
  // C5 (2026-07-23 handoff): re-added. URLs verified live 2026-07-23. Leads
  // only on "messy practical" recs (interrupted series, "does this old dose
  // count") — CDC/ACIP still leads on recs a specific MMWR rule defines.
  immMenACWY: {
    url: 'https://www.immunize.org/ask-experts/topic/menacwy/',
    label: 'immunize.org: Ask the Experts — Meningococcal ACWY',
    short: 'Ask the Experts: MenACWY',
  },
  immMenB: {
    url: 'https://www.immunize.org/ask-experts/topic/menb/',
    label: 'immunize.org: Ask the Experts — Meningococcal B',
    short: 'Ask the Experts: MenB',
  },
};

// ─────────────────────────────────────────────────────────────────────────
// C5 subscript deep-links — per-sentence [1]/[2] markers that jump straight
// to the exact ACIP 2020 MMWR paragraph via a URL text-fragment
// (#:~:text=<phrase>). Every phrase below was verified live against
// https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/ on 2026-07-23 (loaded in
// a real browser, confirmed the fragment highlights the intended sentence —
// not just that the words appear somewhere on the page).
// ─────────────────────────────────────────────────────────────────────────
function mmwrAnchor(phrase) {
  return `${REFS.acip2020.url}#:~:text=${encodeURIComponent(phrase)}`;
}

export const ACIP_ANCHORS = {
  // MenACWY: routine dose 1 at 11-12y + booster at 16y.
  acwyRoutine1112and16: mmwrAnchor(
    'ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years'
  ),
  // MenACWY: a dose given before the patient's 10th birthday doesn't count
  // toward the routine adolescent series.
  acwyBeforeAge10: mmwrAnchor(
    'Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years'
  ),
  // MenB: healthy 16-23y shared clinical decision-making series.
  menbSharedDecision1623: mmwrAnchor('ACIP recommends a MenB series for persons aged 16–23 years'),
  // High-risk MenACWY booster cadence, split on age at primary completion.
  boosterBeforeAge7: mmwrAnchor('Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter'),
  boosterAtOrAfterAge7: mmwrAnchor('Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter'),
};

// Resolve an array of ref keys to {url, label, short} objects, dropping unknown keys.
export function resolveRefs(keys = []) {
  return keys.map((k) => REFS[k]).filter(Boolean);
}
