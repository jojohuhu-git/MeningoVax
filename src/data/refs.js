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
  // cites this same document at one specific sentence. 2026-07-24: switched
  // from the PMC mirror (pmc.ncbi.nlm.nih.gov/articles/PMC7527029/) to CDC's
  // own static hosting of the identical report. Same document, same author,
  // same text — only the URL changed. Reason: PMC's 2024 site rebuild
  // ("cloudpmc-viewer") re-renders the page client-side after load, which
  // breaks the browser's #:~:text= scroll-to-highlight (the match target
  // gets swapped out from under it); CDC's plain server-rendered page does
  // not have this problem. All 11 quotes below were re-confirmed live
  // 2026-07-24 as exact verbatim substrings (after HTML-entity decoding) of
  // https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm — none are stale.
  acip2020: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    label: 'Mbaeyi SA et al. Meningococcal Vaccination: ACIP Recommendations, United States, 2020 (MMWR RR-9)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },

  // C2 (2026-07-24 plan): chip-only, per-risk-factor table anchors within
  // the same acip2020 document (rr6909a1.htm) — deep-linked to the specific
  // schedule table for each risk factor rather than the generic Penmenvy
  // (mm7501a2) page or the whole-document acip2020 chip. No `quote` field:
  // resolveRefs() uses `url` verbatim, so the #:~:text= fragment (built
  // here, not by highlightUrl) survives on the chip. All five table titles
  // and the two load-bearing footnotes below were read from the live
  // rendered CDC page 2026-07-24 (table <caption> elements + the footnote
  // list immediately following each table).
  acip2020Table2: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('TABLE 2. Recommended meningococcal vaccines and administration schedules for children and adults')}`,
    label: 'ACIP 2020 MMWR: Table 2 — recommended vaccines and administration schedules for children and adults',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  acip2020Table7: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('TABLE 7. Recommended vaccination schedule and intervals for microbiologists routinely exposed to isolates of Neisseria meningitidis')}`,
    label: 'ACIP 2020 MMWR: Table 7 — schedule for microbiologists routinely exposed to N. meningitidis isolates',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  // Table 8's `*` footnote is only a pointer to a separate outbreak-guidance
  // PDF, not a rule the recommendation acts on -- title only, per the
  // owner's footnote rule (do not add a second text= directive for a
  // non-load-bearing footnote).
  acip2020Table8: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('TABLE 8. Recommended vaccination schedule and intervals for persons who are at risk during an outbreak')}`,
    label: 'ACIP 2020 MMWR: Table 8 — schedule for persons at risk during an outbreak',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  // Table 9's `*` footnote defines the travel indication itself (meningitis
  // belt / dry season) -- load-bearing, so it gets a second text= directive.
  acip2020Table9: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('TABLE 9. Recommended vaccination schedule and intervals for persons who travel to or are residents of countries where meningococcal disease is hyperendemic or epidemic')}&text=${encodeURIComponent('For international travelers, vaccination is recommended for those visiting the parts of sub-Saharan Africa known as the meningitis belt during the dry season (December–June)')}`,
    label: 'ACIP 2020 MMWR: Table 9 — schedule for travelers to hyperendemic/epidemic countries',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  // Table 10 covers TWO groups with opposite booster rules, and this ref is
  // shared by both cards, so it anchors to the table caption only -- the same
  // pattern as Tables 7 and 8.
  //
  // It used to carry a second text= directive highlighting "College freshmen
  // ... at least 1 dose of MenACWY within 5 years before college entry", added
  // by W4 for the college 5-year expiry. M17 (2026-09-15) removed that rule, so
  // the directive pointed at guidance the app no longer implements -- and on
  // the MILITARY card it highlighted the college sentence, which is precisely
  // the mix-up M18 exists to undo. Dropped rather than re-pointed, because one
  // shared ref cannot highlight both halves of the Boosters row at once.
  acip2020Table10: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('TABLE 10. Recommended vaccination schedule and intervals for college freshmen living in residence halls* and military recruits')}`,
    label: 'ACIP 2020 MMWR: Table 10 — schedule for college freshmen in residence halls and military recruits',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-09-15',
  },

  acwyRoutine1112and16: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years',
    label: 'ACIP 2020 MMWR: routine 11–12y dose, 16y booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // N5 (2026-11-15): the 8 weeks between dose 1 and the 16-year booster.
  acwyBooster8WeeksAfterDose1: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'the booster dose can be administered at any time, as long as a minimum interval of 8 weeks between doses is maintained',
    label: 'ACIP 2020 MMWR: at least 8 weeks between dose 1 and the 16-year booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acwyBeforeAge10: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years',
    label: 'ACIP 2020 MMWR: doses before age 10 do not count toward the adolescent series',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  boosterBeforeAge7: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter',
    label: 'ACIP 2020 MMWR: booster cadence, primary completed before age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  boosterAtOrAfterAge7: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter',
    label: 'ACIP 2020 MMWR: booster cadence, primary completed at/after age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acwyInfantHighRisk2to6mo: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: '4 doses at 2, 4, 6, and 12 mos',
    label: 'ACIP 2020 MMWR: high-risk infant MenACWY-CRM series starting at age 2 months — 4 doses at 2, 4, 6, and 12 months',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  acwyInfantHighRisk7to23mo: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: '2 doses (second dose ≥12 wks after the first dose and after the 1st birthday)',
    label: 'ACIP 2020 MMWR: high-risk infant/toddler MenACWY-CRM series starting at age 7–23 months — 2-dose primary, dose 2 ≥12 weeks after dose 1 and after the 1st birthday',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // M4 (2026-09-23, MenQuadfi 6-week floor queue). The ONE source for a
  // LICENSED-age claim, not a schedule claim — the authority rule ranks FDA
  // package inserts below ACIP/CDC for SCHEDULE questions (dose counts,
  // intervals, preferred ages), but the schedule doesn't state a product's
  // licensed minimum age at all; only the insert does. So this is not a
  // hierarchy violation, just the right document for a different question.
  // Fetched live via DailyMed, which republishes the FDA-approved label
  // verbatim (structured product labeling) — this IS the package insert, not
  // a paraphrase of it. DailyMed's own page shows "Revised: 4/2026", with
  // "Recent Major Changes" to Indications and Usage / Dosage and
  // Administration dated 5/2025 — the 6-week floor is already in the current
  // label, not a pending change.
  menQuadfiPackageInsert: {
    url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ab1c3318-578e-4d0c-a21e-fc6df07e9fb7',
    quote: 'MenQuadfi is approved for use in individuals 6 weeks of age and older.',
    label: 'MenQuadfi (MenACWY-TT) FDA prescribing information: approved for use from 6 weeks of age',
    short: 'MenQuadfi Package Insert',
    lastVerified: '2026-09-23',
  },
  // The "why" for the MenQuadfi floor drop (2 years -> 6 weeks): an AAP
  // alignment, per WA state DOH. This is the app's first non-CDC/ACIP
  // clinical citation (checked 2026-09-22: every other entry in this file is
  // CDC/ACIP/MMWR/immunize.org) -- MeningoVax's own authority rule already
  // covers a state DOH resource as tiebreak/context when it explains an
  // AAP-driven change; see docs/agent/meningococcal-rules-summary.md's
  // authority section. Quote fetched live 2026-09-22 (see the fix-queue file
  // fix-2026-09-22-menquadfi-6-week-licence-floor.md for the full context).
  waDohMenQuadfiAapAlignment: {
    url: 'https://doh.wa.gov/you-and-your-family/immunizations-and-vaccines',
    quote: 'Updated MenACWY recommendations to align with the American Academy of Pediatrics. The minimum age for the first MenQuadfi dose is now 6 weeks, instead of 2 years for children who meet the recommendation.',
    label: 'Washington State DOH: MenQuadfi’s 6-week minimum age aligns with AAP',
    short: 'WA DOH',
    lastVerified: '2026-09-22',
  },
  // M16 (2026-09-15): the "preferred age 16-18 yrs" claim, restored with the
  // citation it should always have carried. C1/2026-07-24 dropped it after
  // correctly finding it absent from mm7349a3 (the Oct 2024 Bexsero dosing
  // paper) -- it was mis-cited, not unsupported. It is verbatim in ACIP 2020
  // Table 2, and still printed in the current CDC child & adolescent schedule
  // notes ("preferred age 16-18 years"), so mm7349a3's silence did not retire it.
  menbHealthyPreferredAge1618: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('MenB series at age 16\u201323 yrs on basis of shared clinical decision-making (preferred age 16\u201318 yrs)')}`,
    quote: 'MenB series at age 16\u201323 yrs on basis of shared clinical decision-making (preferred age 16\u201318 yrs)',
    label: 'ACIP 2020 MMWR Table 2: healthy MenB shared clinical decision-making, preferred age 16\u201318 years',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  menbPregnancyDeferral: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'vaccination with MenB should be deferred unless the woman is at increased risk and, after consultation with her health care provider, the benefits of vaccination are considered to outweigh the potential risks',
    label: 'ACIP 2020 MMWR: MenB deferred during pregnancy absent an increased-risk indication',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  menbLicensedAge1025: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'MenB vaccines are licensed in the United States only for persons aged 10–25 years',
    label: 'ACIP 2020 MMWR: MenB licensure (age 10–25 years)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acwyCatchup1921: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Persons aged 19–21 years who have not received a dose after their 16th birthday can receive a single MenACWY dose as part of catch-up vaccination',
    label: 'ACIP 2020 MMWR: 19–21y catch-up dose (no dose after the 16th birthday)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  acwyFirstDoseAfter16NoBooster: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Adolescents who receive a first dose after their 16th birthday do not need a booster dose unless they become at increased risk for meningococcal disease',
    label: 'ACIP 2020 MMWR: a first dose given at ≥16y needs no booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  // Change 2 (2026-07-24): a dose given at exactly age 10 is valid for the
  // adolescent series — no repeat is needed at 11–12. Verified live.
  acwyAge10CountsAsDose1: {
    url: 'https://www.immunize.org/ask-experts/topic/menacwy/',
    quote: 'ACIP considers a dose of MenACWY given to a 10-year-old child to be valid for the first dose in the adolescent series.',
    label: 'immunize.org Ask the Experts: a MenACWY dose at age 10 counts as adolescent dose 1',
    short: 'Ask the Experts: MenACWY',
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
  // Read live 2026-11-15 in a real browser (STOP C read N2): the sentence
  // under "Dosing Interval and Schedule". It names no risk group, so it
  // covers high-risk patients (old course 0 and >=1 month) and healthy ones.
  // Not yet cited on any card — held for STOP C.
  menbBexseroOldCourseStands: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'There is no recommendation to administer additional doses to persons vaccinated with MenB-4C before October 24, 2024, using a 0- and 1-month dosing schedule.',
    label: 'ACIP Oct 2024 MMWR: no extra doses for people who had Bexsero at 0 and 1 month before October 24, 2024',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  menbHighRisk3DoseSchedule: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease',
    label: 'ACIP Oct 2024 MMWR: MenB-4C high-risk 3-dose series, 0/1–2/6 months',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  menbHealthy2Dose0and6: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'ACIP recommends that MenB-4C be administered to healthy adolescents and young adults aged 16–23 years as a 2-dose series at 0 and 6 months for the prevention of serogroup B meningococcal disease, based on shared clinical decision-making',
    label: 'ACIP Oct 2024 MMWR: MenB-4C healthy 2-dose series, 0/6 months',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  // MenB dose-3 rescue (2026-09-17). The one sentence that says an early dose 3
  // is credited rather than repeated. It lives in the CDC schedule notes, not in
  // mm7349a3, so it needs its own anchor — the adult notes carry the identical
  // sentence for people at increased risk.
  menbHighRiskEarlyD3ExtraDose: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    quote: 'if dose 3 is administered earlier than 4 months after dose 2, a 4th dose should be administered at least 4 months after dose 3',
    label: 'CDC Child/Adolescent Schedule, MenB special situations: an early dose 3 counts and adds a 4th dose',
    short: 'CDC MenB Notes',
    lastVerified: '2026-11-15',
  },
  menbRescueDoseRule: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'the 2 doses should be separated by 6 months. If the second dose is administered <6 months after the first dose, a third dose should be administered ≥4 months after the second dose',
    label: 'ACIP Oct 2024 MMWR: healthy 2-dose interval and the early-dose-2 rescue-dose rule',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  menbAcceleratedRapidProtection: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'Persons receiving a MenB vaccine based on shared clinical decision-making who desire more rapid protection against serogroup B (e.g., students initiating vaccination <6 months before college entry) may receive the 3-dose series (0, 1–2, and 6 months) to optimize rapid protection. This guidance applies to both MenB-4C and MenB-FHbp.',
    label: 'ACIP Oct 2024 MMWR: healthy accelerated 3-dose series for rapid protection',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-07-24',
  },

  // MMWR 75(1);7–14 — the SAME document as pentavalentGSK2025 below (its PMC
  // mirror is PMC12782235); its Box cleanly restates every current
  // MenACWY/MenB indication and the MenB high-risk booster cadence. Quotes
  // confirmed live 2026-07-24, and again 2026-10-17, as exact substrings of
  // https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm.
  menbHighRiskBoosterCadenceBox: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'the first booster dose should be given 1 year after the primary series, with additional boosters every 2–3 years if the risk remains',
    label: 'ACIP 2025 MMWR Box: MenB high-risk booster cadence',
    // C1 (2026-10-17): was 'ACIP 2025 MMWR'. This key and `pentavalentGSK2025`
    // store the IDENTICAL url with no anchor, so they are one document, and
    // the numbering already gives them one shared [N] — but they printed two
    // different names, so C1's new hover line could not tell a reader which
    // chip its number came from. C1's uniqueness guard caught it.
    //
    // `short` here was UNREACHABLE before C1: this key is only ever a
    // noteCites entry, never in a resolveRefs chip list, and resolveRefs was
    // the only reader of `short`. So this rename changes no pre-existing
    // visible text — it only decides what C1's new hover line says, and makes
    // it agree with the chip pentavalentGSK2025 already prints.
    //
    // Read live 2026-10-17: mm7501a2 is "Use of the GSK MenACWY-CRM/MenB-4C
    // Pentavalent Meningococcal Vaccine Among Persons Aged >=10 Years:
    // Recommendations of the Advisory Committee on Immunization Practices —
    // United States, 2025", MMWR Weekly / January 8, 2026 / 75(1);7-14. The
    // quote above was confirmed present verbatim on that page the same day
    // (45,924 chars via textContent, positive control "Penmenvy" present), so
    // the citation was correctly attributed all along — only its name differed
    // from the other key's. Named for the paper, not for a year the two keys
    // disagreed about.
    short: 'Penmenvy MMWR 2026;75(1)',
    // Re-read live 2026-10-17 while checking this key's document identity:
    // the URL resolved and the quote above was present verbatim. That is the
    // full depth this field attests to for a quoted key, so the date moves.
    lastVerified: '2026-10-17',
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
  // Read live 2026-11-15 in a real browser (STOP C read N1). Both ACIP
  // statements set a lower age for the increased-risk group and no upper
  // age; both MMWRs state the licence as 10–25 years. CDSI's "to 26 years"
  // matches the licence, not this sentence. Not yet cited on any card.
  pentavalentHighRiskNoUpperAge: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'persons aged ≥10 years who are at increased risk for meningococcal disease (e.g., because of persistent complement deficiencies, complement inhibitor use, or functional or anatomic asplenia)',
    label: 'ACIP 2025 (Penmenvy): may be used when both are due, for persons aged ≥10 years at increased risk',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-15',
  },
  pentavalentLicensed10to25: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'licensed for use in persons aged 10–25 years',
    label: 'ACIP 2025 (Penmenvy) MMWR: licensed for persons aged 10–25 years',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-15',
  },
  cdcAdultPenbrayaSameDay: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening',
    quote: 'Adults may receive a single dose of Penbraya (MenACWY–TT/MenB–FHbp) as an alternative to separate administration of MenACWY and MenB when both vaccines would be given on the same clinic day.',
    label: 'CDC Adult Schedule notes (updated July 2, 2025): adults may receive Penbraya when both are given the same day',
    short: 'CDC Adult Notes',
    lastVerified: '2026-11-15',
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

  // CAR-T / B-cell malignancy / B-cell-depleting therapy hard stop --------
  cdcAlteredImmunocompetence: {
    url: 'https://www.cdc.gov/vaccines/hcp/acip-recs/general-recs/immunocompetence.html',
    label: 'CDC ACIP General Best Practice Guidelines — Altered Immunocompetence',
    short: 'CDC Altered Immunocompetence',
    lastVerified: '2026-09-12',
  },
  // ACIP General Best Practice Guidelines — Timing and Spacing, section
  // "Unknown or uncertain vaccination status" (page "Updated: July 24, 2024").
  // Read live 2026-11-15 in a real browser (STOP C read: undated records).
  // The same words are in the guideline PDF (general-recs.pdf) and, as
  // "In most cases…", in the Pink Book chapter 6. Not yet cited on any card.
  gbpWrittenDatedRecords: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html',
    quote: 'With the exception of influenza vaccine and PPSV23, providers should only accept written, dated records as evidence of vaccination',
    label: 'ACIP General Best Practice Guidelines: only written, dated records are evidence of vaccination (except influenza and PPSV23)',
    short: 'ACIP Best Practice',
    lastVerified: '2026-11-15',
  },
  // RULING D (owner, STOP C C2, 2026-11-15). Read live 2026-11-15.
  gbpRepeatSpacedFromInvalidDose: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html',
    quote: 'The repeat dose should be spaced after the invalid dose by the recommended minimum interval',
    label: 'ACIP General Best Practice Guidelines: a repeat dose is spaced from the invalid dose',
    short: 'ACIP Best Practice',
    lastVerified: '2026-11-15',
  },
  // The sentence the owner's E1 answer deliberately differs from (2026-11-15):
  // for an inactivated vaccine CDC sets no wait after a too-young first dose.
  gbpTooYoungFirstDoseRepeat: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html',
    quote: 'If the first dose in a series is given ≥5 days before the recommended minimum age, the dose should be repeated on or after the date when the child reaches at least the minimum age',
    label: 'ACIP General Best Practice Guidelines: a too-young first dose is repeated once the minimum age is reached',
    short: 'ACIP Best Practice',
    lastVerified: '2026-11-15',
  },
  gbpRecordsNotFoundSusceptible: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html',
    quote: 'If records cannot be located within a reasonable time, these persons should be considered susceptible and started on the age-appropriate vaccination schedule.',
    label: 'ACIP General Best Practice Guidelines: without records, treat as unvaccinated and start the age-appropriate schedule',
    short: 'ACIP Best Practice',
    lastVerified: '2026-11-15',
  },

  // ── What the sources say beside each dose rule (port Phase 2.2, 2026-11-15) ──
  // These entries are read by the rule table (`sourcesSay.refs` in
  // src/logic/doseRules.js), not shown on a card. Each quote was confirmed
  // live on 2026-11-15 as an exact piece of the page's text, in a real
  // browser (CDC refuses scripted downloads). They are the sentences the
  // rulebook rests on, so STOP C (decision packet 1) can be argued from the
  // words, not from memory. Several sit beside an existing entry that quotes
  // the same page for a card; a separate key keeps a card's [N] highlight
  // from changing when a rulebook quote is added.
  cdcChildAcwyMinAge: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]',
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY minimum ages',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildMenveoLiquid10y: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'The liquid formulation should not be used before age 10 years.',
    label: 'CDC Child/Adolescent Schedule Notes: Menveo one-vial (liquid) not before age 10',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildAcwyInfantSeries: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months',
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY infant series minimum gaps',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildAcwyRisk2DoseFrom24m: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart',
    label: 'CDC Child/Adolescent Schedule Notes: high-risk MenACWY 2-dose series from 24 months',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildAcwyBefore10OngoingRisk: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Children for whom boosters are recommended because of an ongoing increased risk of meningococcal disease (e.g., those with complement component deficiency, HIV, or asplenia): Follow the booster schedule for persons at increased risk.',
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY before age 10 with an ongoing risk',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcCatchupAcwyBooster8Weeks: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8 weeks)',
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY catch-up, booster at least 8 weeks after dose 1',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildMenbMinAge: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    quote: 'minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]',
    label: 'CDC Child/Adolescent Schedule Notes: MenB minimum age',
    short: 'CDC MenB Notes',
    lastVerified: '2026-11-15',
  },
  acip2020Acwy8WeekMinimum: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'a second dose should be administered as soon as possible, provided that an 8-week minimum interval between doses is maintained',
    label: 'ACIP 2020 MMWR: 8-week minimum between the two MenACWY primary doses',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // In the MenB section of the MMWR (after the paragraph on mismatched MenB
  // products). The only "4 weeks between any 2 doses" sentence the page has.
  acip2020MenbRepeat4Weeks: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'For situations in which a dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses',
    label: 'ACIP 2020 MMWR (MenB section): 4 weeks between doses when a MenB dose is repeated',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // E2 (owner, 2026-11-15). Read live 2026-11-15.
  acip2020MenbMixedProductsSelectOne: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'If 2 doses were administered using different MenB products, one product should be selected for administration of an additional dose at an appropriate interval to ensure valid completion of a MenB series; the dose from the product not selected for series completion should be considered invalid',
    label: 'ACIP 2020 MMWR: after two different MenB products, pick one to finish the series',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acip2020MenbNotInterchangeable: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'MenB vaccines are not interchangeable, and the same vaccine product must be used for all doses',
    label: 'ACIP 2020 MMWR: MenB products are not interchangeable',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acip2020MenbBoosterCadence: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'a MenB booster dose 1 year after primary series completion, then every 2–3 years thereafter',
    label: 'ACIP 2020 MMWR: high-risk MenB booster schedule',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  menbHighRiskEarlyD3Unless: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose',
    label: 'ACIP Oct 2024 MMWR: an early high-risk MenB dose 3 is repeated unless it was 6 months after dose 1',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
};

// Build a scroll-to-highlight URL (#:~:text=) from a citation's quote.
// Falls back to the plain page URL for entries with no quote.
//
// 2026-09-17: the quote fragment is appended to the url with any EXISTING
// fragment stripped first. Every quoted citation used to point at a bare MMWR
// page, so this never came up; the first one that pointed at a CDC schedule-
// notes section (".../child-adolescent-notes.html#note-mening-b") produced
// "...#note-mening-b#:~:text=..." — two fragments in one URL, which no browser
// honours, so the link silently stopped scrolling to the sentence. The section
// anchor is kept on the citation itself, because the bottom-of-card chips use
// it and it lands the reader in the right section.
function highlightUrl(key) {
  const c = CITATIONS[key];
  if (!c) return undefined;
  if (!c.quote) return c.url;
  const page = c.url.split('#')[0];
  return `${page}#:~:text=${encodeURIComponent(c.quote)}`;
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

// C5/Change 4 (2026-07-24): a note-citation source, keyed but NOT numbered.
// Each occurrence corresponds to one literal "[c]" placeholder in the note
// text, in order. RecCard's renderNoteWithCites() assigns the visible [N]
// number at render time (by order of first mention, deduping repeats of the
// same underlying PAGE — see `page` below) — recommend.js no longer
// hardcodes numbers, so the same source can no longer drift to a different
// number just because it was typed wrong.
// `url` deep-links to the exact quoted sentence via `quote`, and `label` is
// that same quoted text shown as the hover tooltip (2026-07-23 owner
// decision: quote shows on hover, for browsers/environments where
// #:~:text= doesn't visibly scroll). `page` is the plain page URL with no
// fragment — two citation keys that quote different sentences on the SAME
// page share one visible [N] (owner decision, 2026-07-24: the number
// identifies the source document; the link and hover text still point at
// the specific sentence).
// C1 (2026-10-17) adds two fields, both read by citeTitle() below:
//   `doc`   — the document's short name ("ACIP 2020 MMWR"), the SAME text the
//             grey chip prints. Taken from `short` rather than re-typed, so
//             the hover text and the chip can never disagree.
//   `quote` — present only when this key cites one sentence. Whether it is set
//             is what citeTitle() keys on, instead of comparing `label`
//             against CITATIONS[key].label to guess.
// `label` keeps its existing meaning (the sentence, else the full title).
export function cite(key) {
  const c = CITATIONS[key];
  return {
    key,
    page: c?.url,
    url: highlightUrl(key),
    label: c?.quote ?? c?.label,
    doc: c?.short,
    quote: c?.quote,
  };
}

// ââ C1 (2026-10-17): the hover text names the document, then quotes it âââ
//
// Owner-reported: "I always see a '1' where you can hover over to see the
// language cited verbatim, but there are multiple source chips under it and I
// do not know where it came from." The hover text showed the sentence and never
// said which document the sentence came from, so knowing the words still did
// not tell you which grey chip to click.
//
// The first line is cite()'s `doc`, which is the ref's `short` â the SAME
// string the chip prints, so the two can only ever agree. The sentence follows
// on its own line.
//
// Why a line break and not "Document â sentence": em dashes are banned from
// user-visible strings in both apps (owner decision 2026-07-16, D7 â the most
// recognisable "written by an AI" tell; code comments keep them). A `title`
// attribute honours "\n" in current browsers and degrades to a space where it
// does not, which still reads correctly.
//
// A quote-free ref is a whole-document reference with no sentence to show. Its
// `label` is already the full title, which names the document, so it is left
// exactly as it was: composing a blank quote onto it would present a source
// that appears to say nothing.
//
// PneumoVax carries this function under the same name in the same file
// (src/data/refs.js). Change it in both or neither.
export function citeTitle(c) {
  if (!c) return undefined;
  if (c.quote && c.doc) return `${c.doc}\n\u201c${c.quote}\u201d`;
  return c.label;
}
