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
// ─────────────────────────────────────────────────────────────────────────

export const REFS = {
  // CDC schedule notes ----------------------------------------------------
  cdcChildMenACWY: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    label: 'CDC Child/Adolescent Schedule — Meningococcal ACWY notes',
  },
  cdcChildMenB: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    label: 'CDC Child/Adolescent Schedule — Meningococcal B notes',
  },
  cdcAdultMening: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening',
    label: 'CDC Adult Immunization Schedule — Meningococcal notes',
  },

  // ACIP MMWR source-of-truth --------------------------------------------
  acip2020: {
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7527029/',
    label: 'Mbaeyi SA et al. Meningococcal Vaccination: ACIP Recommendations, United States, 2020 (MMWR RR-9)',
  },
  pentavalentGSK2025: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    label: 'ACIP 2025 — GSK pentavalent MenACWY-CRM/MenB-4C (Penmenvy), persons ≥10y (MMWR 2025)',
  },
  pentavalentPfizer2023: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm',
    label: 'ACIP 2023 — Pfizer pentavalent MenACWY-TT/MenB-FHbp (Penbraya), persons ≥10y (MMWR 2024;73)',
  },

  // CDC clinician guidance ------------------------------------------------
  cdcRecommendations: {
    url: 'https://www.cdc.gov/vaccines/vpd/mening/hcp/recommendations.html',
    label: 'CDC — Meningococcal Vaccine Recommendations (HCP)',
  },
  cdcComplementInhibitor: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    label: 'CDC — Managing Meningococcal Risk in Patients on Complement Inhibitor Therapy',
  },

  // immunize.org ----------------------------------------------------------
  immMenACWY: {
    url: 'https://www.immunize.org/ask-experts/topic/menacwy/',
    label: 'immunize.org — MenACWY Ask the Experts',
  },
  immMenB: {
    url: 'https://www.immunize.org/ask-experts/topic/menb/',
    label: 'immunize.org — MenB Ask the Experts',
  },
};

// Resolve an array of ref keys to {url, label} objects, dropping unknown keys.
export function resolveRefs(keys = []) {
  return keys.map((k) => REFS[k]).filter(Boolean);
}
