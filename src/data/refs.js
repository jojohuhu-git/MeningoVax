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

// Resolve an array of ref keys to {url, label, short} objects, dropping unknown keys.
export function resolveRefs(keys = []) {
  return keys.map((k) => REFS[k]).filter(Boolean);
}
