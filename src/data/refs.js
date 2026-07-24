// ─────────────────────────────────────────────────────────────────────────
// CITATIONS — single source of truth for every reference cited in MeningoVax.
//
// One table, one shape (2026-07-24 redesign, per the 2026-07-23 citation
// audit handoff). To swap a stale link, re-quote a source, or update a
// label: edit ONE entry below — nothing else needs touching.
//
// Each entry:
//   url          — canonical source page (no #fragment — the fragment for a
//                  per-sentence deep-link is built automatically from `quote`)
//   quote        — optional. The EXACT verbatim sentence being cited, used to
//                  (a) build the browser's scroll-to-highlight fragment
//                  (#:~:text=) for a [N] superscript link, and (b) show as a
//                  hover tooltip on that superscript so the clinician can
//                  read the cited text even when the browser ignores the
//                  fragment (Firefox never supports Scroll-To-Text-Fragment;
//                  some in-app preview browsers don't either). Omit for
//                  whole-page landing citations (footer chips) that aren't
//                  citing one exact sentence.
//   label        — full descriptive title: hover tooltip for chips (entries
//                  with no quote) and fallback tooltip text if a quote is
//                  ever missing.
//   short        — concise label for the citation chip button text.
//   lastVerified — ISO date this url/quote was last confirmed live in a real
//                  browser fetch (not a model-summarized fetch — those
//                  paraphrase and are unreliable for exact-quote checking).
//
// Prefer ACIP/CDC/immunize.org over FDA package inserts (FDA-labeled ages
// are often more restrictive than current ACIP guidance). Re-verify annual /
// recently-updated entries (pentavalent MMWRs, adult schedule notes) yearly.
//
// Overlap rule (2026-07-23 owner decision): when the ACIP 2020 MMWR
// (`acip2020`) and a CDC schedule note just restate the same rule, cite only
// the MMWR — the schedule-note entries below (cdcChildMenACWY, cdcChildMenB,
// cdcAdultMening) exist for the handful of call sites where the CDC page is
// cited on its own, not paired with a redundant acip2020 mention.
// ─────────────────────────────────────────────────────────────────────────

export const CITATIONS = {
  // CDC schedule notes — summaries of the ACIP 2020 MMWR.
  cdcChildMenACWY: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    label: 'CDC Child/Adolescent Schedule: Meningococcal ACWY notes',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-06-03',
  },
  cdcChildMenB: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    label: 'CDC Child/Adolescent Schedule: Meningococcal B notes',
    short: 'CDC MenB Notes',
    lastVerified: '2026-06-03',
  },
  cdcAdultMening: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening',
    label: 'CDC Adult Immunization Schedule: Meningococcal notes',
    short: 'CDC Adult Notes',
    lastVerified: '2026-06-03',
  },

  // ACIP MMWR — source of truth. Every acwy*/booster*/menb* anchor below
  // cites this same document at one specific sentence. All 5 quotes below
  // were confirmed live 2026-07-23 as exact verbatim substrings of
  // https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/ (direct DOM substring
  // search, not model paraphrase) — none are stale.
  acip2020: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    label: 'Mbaeyi SA et al. Meningococcal Vaccination: ACIP Recommendations, United States, 2020 (MMWR RR-9)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-23',
  },
  acwyRoutine1112and16: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years',
    label: 'ACIP 2020 MMWR: routine 11–12y dose, 16y booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-23',
  },
  acwyBeforeAge10: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years',
    label: 'ACIP 2020 MMWR: doses before age 10 do not count toward the adolescent series',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-23',
  },
  boosterBeforeAge7: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter',
    label: 'ACIP 2020 MMWR: booster cadence, primary completed before age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-23',
  },
  boosterAtOrAfterAge7: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter',
    label: 'ACIP 2020 MMWR: booster cadence, primary completed at/after age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-23',
  },
  acwyInfantHighRisk2to6mo: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: '4 doses at 2, 4, 6, and 12 mos',
    label: 'ACIP 2020 MMWR: high-risk infant MenACWY-CRM series starting at age 2 months — 4 doses at 2, 4, 6, and 12 months',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  acwyInfantHighRisk7to23mo: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: '2 doses (second dose ≥12 wks after the first dose and after the 1st birthday)',
    label: 'ACIP 2020 MMWR: high-risk infant/toddler MenACWY-CRM series starting at age 7–23 months — 2-dose primary, dose 2 ≥12 weeks after dose 1 and after the 1st birthday',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  menbPregnancyDeferral: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'vaccination with MenB should be deferred unless the woman is at increased risk and, after consultation with her health care provider, the benefits of vaccination are considered to outweigh the potential risks',
    label: 'ACIP 2020 MMWR: MenB deferred during pregnancy absent an increased-risk indication',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  menbLicensedAge1025: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'MenB vaccines are licensed in the United States only for persons aged 10–25 years',
    label: 'ACIP 2020 MMWR: MenB licensure (age 10–25 years)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  acwyCatchup1921: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'Persons aged 19–21 years who have not received a dose after their 16th birthday can receive a single MenACWY dose as part of catch-up vaccination',
    label: 'ACIP 2020 MMWR: 19–21y catch-up dose (no dose after the 16th birthday)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  acwyFirstDoseAfter16NoBooster: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/',
    quote: 'Adolescents who receive a first dose after their 16th birthday do not need a booster dose unless they become at increased risk for meningococcal disease',
    label: 'ACIP 2020 MMWR: a first dose given at ≥16y needs no booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },

  // ACIP Oct 2024 MMWR (73(49);1124) — supersedes the 2020 MMWR's MenB-4C
  // 2-dose table. THE authoritative source for every MenB-4C schedule.
  // Quotes confirmed live 2026-07-24 as exact substrings of
  // https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm.
  mm7349a3: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    label: 'New Dosing Interval and Schedule for the Bexsero MenB-4C Vaccine: ACIP, October 2024 (MMWR 73(49);1124)',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-07-24',
  },
  menbHighRisk3DoseSchedule: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease',
    label: 'ACIP Oct 2024 MMWR: MenB-4C high-risk 3-dose series, 0/1–2/6 months',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-07-24',
  },
  menbHealthy2Dose0and6: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'ACIP recommends that MenB-4C be administered to healthy adolescents and young adults aged 16–23 years as a 2-dose series at 0 and 6 months for the prevention of serogroup B meningococcal disease, based on shared clinical decision-making',
    label: 'ACIP Oct 2024 MMWR: MenB-4C healthy 2-dose series, 0/6 months',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-07-24',
  },
  menbRescueDoseRule: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'the 2 doses should be separated by 6 months. If the second dose is administered <6 months after the first dose, a third dose should be administered ≥4 months after the second dose',
    label: 'ACIP Oct 2024 MMWR: healthy 2-dose interval and the early-dose-2 rescue-dose rule',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-07-24',
  },
  menbAcceleratedRapidProtection: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'Persons receiving a MenB vaccine based on shared clinical decision-making who desire more rapid protection against serogroup B (e.g., students initiating vaccination <6 months before college entry) may receive the 3-dose series (0, 1–2, and 6 months) to optimize rapid protection. This guidance applies to both MenB-4C and MenB-FHbp.',
    label: 'ACIP Oct 2024 MMWR: healthy accelerated 3-dose series for rapid protection',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-07-24',
  },

  // ACIP 2025 MMWR (75(1);7–14) — same document as pentavalentGSK2025 below
  // (its PMC mirror is PMC12782235); its Box cleanly restates every current
  // MenACWY/MenB indication and the MenB high-risk booster cadence. Quotes
  // confirmed live 2026-07-24 as exact substrings of
  // https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm.
  menbHealthySCDM1623Box: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'Healthy persons aged 16–23 years: Vaccination with a 2-dose MenB series on the basis of shared clinical decision-making, with 16–18 years the preferred age for MenB vaccination',
    label: 'ACIP 2025 MMWR Box: MenB healthy shared clinical decision-making, 16–23y (16–18y preferred)',
    short: 'ACIP 2025 MMWR',
    lastVerified: '2026-07-24',
  },
  menbHighRiskBoosterCadenceBox: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'the first booster dose should be given 1 year after the primary series, with additional boosters every 2–3 years if the risk remains',
    label: 'ACIP 2025 MMWR Box: MenB high-risk booster cadence',
    short: 'ACIP 2025 MMWR',
    lastVerified: '2026-07-24',
  },

  // Pentavalent MMWRs. Label uses "MMWR <publish year>;<volume>(<issue>)" —
  // the precise publish citation, not the ACIP-action year (2026-07-23 fix:
  // both were previously labeled by ACIP-action year, which didn't match
  // their actual MMWR volume/issue).
  pentavalentGSK2025: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    label: 'ACIP: GSK pentavalent MenACWY-CRM/MenB-4C (Penmenvy), persons ≥10y (MMWR 2026;75(1), published Jan 8, 2026)',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-06-03',
  },
  pentavalentPfizer2023: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm',
    label: 'ACIP: Pfizer pentavalent MenACWY-TT/MenB-FHbp (Penbraya), persons ≥10y (MMWR 2024;73(15), published Apr 18, 2024)',
    short: 'Penbraya MMWR 2024;73(15)',
    lastVerified: '2026-06-03',
  },

  // CDC clinician guidance.
  cdcRecommendations: {
    // 2026-07-23: the old /vaccines/vpd/mening/hcp/recommendations.html URL
    // silently redirects to a generic "Vaccines By Disease" page with no
    // meningococcal content — fixed to the live replacement below. Bonus:
    // this page states the MenACWY high-risk booster age-split (<7y vs
    // ≥7y at primary completion) explicitly, which cdcAdultMening's
    // adult-schedule note does not (it only says "5 years").
    // 2026-07-24 (re-verified live): this page also states a single
    // brand-agnostic high-risk MenB schedule -- 3-dose primary (doses at
    // 0, 1-2, 6 months) for BOTH MenB-4C and MenB-FHbp, with boosters 1yr
    // after completion then every 2-3yrs -- which supersedes the 2020
    // MMWR's brand-split table (3-dose FHbp OR 2-dose 4C). The app's
    // uniform 3-dose schedule for both brands matches this current page,
    // not the older MMWR table. Bulleted list content, not a clean
    // quotable sentence, so cited here as a whole-page chip rather than a
    // [N] highlight-superscript (same reasoning as immunize.org below).
    url: 'https://www.cdc.gov/meningococcal/hcp/vaccine-recommendations/index.html',
    label: 'CDC: Meningococcal Vaccine Recommendations (HCP)',
    short: 'CDC Meningococcal Recommendations',
    lastVerified: '2026-07-24',
  },
  cdcComplementInhibitor: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    label: 'CDC: Managing Meningococcal Risk in Patients on Complement Inhibitor Therapy',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-07-23',
  },

  // immunize.org — landing-page chips ONLY, never per-sentence superscripts.
  // Each "Ask the Experts" topic page bundles 44–56 Q&As with no versioning,
  // so there's no stable sentence to deep-link or quote (2026-07-23
  // finding). Leads only on "messy practical" recs (interrupted series,
  // "does this old dose count") — CDC/ACIP still leads where a specific
  // MMWR rule defines the recommendation.
  immMenACWY: {
    url: 'https://www.immunize.org/ask-experts/topic/menacwy/',
    label: 'immunize.org: Ask the Experts — Meningococcal ACWY',
    short: 'Ask the Experts: MenACWY',
    lastVerified: '2026-07-23',
  },
  immMenB: {
    url: 'https://www.immunize.org/ask-experts/topic/menb/',
    label: 'immunize.org: Ask the Experts — Meningococcal B',
    short: 'Ask the Experts: MenB',
    lastVerified: '2026-07-23',
  },
};

// Build a scroll-to-highlight URL (#:~:text=) from a citation's quote.
// Falls back to the plain page URL for entries with no quote.
function highlightUrl(key) {
  const c = CITATIONS[key];
  if (!c) return undefined;
  return c.quote ? `${c.url}#:~:text=${encodeURIComponent(c.quote)}` : c.url;
}

// Resolve an array of citation keys to {url, label, short} chip objects for
// the bottom-of-card citation chips. Always the whole-page URL (never the
// #:~:text= fragment — chips cite the whole rec, not one sentence within
// it). Unknown keys are dropped.
export function resolveRefs(keys = []) {
  return keys
    .map((k) => CITATIONS[k])
    .filter(Boolean)
    .map(({ url, label, short }) => ({ url, label, short }));
}

// C5: build a [N] note-citation marker. `n` must match the literal "[N]"
// substring placed in the note text at the point the cited sentence ends.
// The link deep-links to the exact sentence via `quote`, and its tooltip
// shows that same quoted text (2026-07-23 owner decision: quote shows on
// hover, for browsers/environments where #:~:text= doesn't visibly scroll).
export function cite(n, key) {
  const c = CITATIONS[key];
  return { marker: `[${n}]`, url: highlightUrl(key), label: c?.quote ?? c?.label };
}
