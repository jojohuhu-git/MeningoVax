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

// ── `population` — WHO THE SENTENCE IS ABOUT (C5, 2026-11-22) ─────────────
//
// Ported from PneumoVax's field of the same name (its owner decision of
// 2026-10-17 carries over, Q12): every QUOTED entry names the patient group(s)
// its sentence was written about, and
// `regression-2026-11-22-c5-every-quote-names-its-patient.test.js` fails if a
// card shows a quote to anyone else. Quote-free entries name none: they are
// whole documents, and a document has no patient.
//
// It records who the sentence is ABOUT, not only where it was printed. ACIP
// 2020 prints its schedule as one table per risk group (Tables 4-10, read live
// 2026-11-22), and several rows are printed word for word in more than one
// table; such a sentence is about every group whose table prints it. Where a
// group's own table words the same timing differently (asplenia, Table 5; an
// outbreak, Table 8), that group gets its own entry quoting its own table.
//
// The groups are the splits the engine already makes (riskFactors.js):
//   MenACWY: 'acwy-routine' (no medical high-risk condition: the adolescent
//            schedule applies), then one group per MenACWY indication.
//   MenB:    'menb-healthy' (no MenB high-risk indication: shared clinical
//            decision-making at 16-23), one group per MenB high-risk
//            indication, and 'menb-pregnancy'.
// `patientGroups()` in riskFactors.js says which groups a patient is in.
//
// A card that cites another group's sentence ON PURPOSE (to say what the
// patient does not have, or where the owner extended a rule past its source)
// marks it at the call site: cite(key, { aboutAnotherGroup: 'why' }). The
// guard skips those and pins the exact set of keys allowed to do it.
export const POPULATIONS = [
  'acwy-routine', 'acwy-complement', 'acwy-asplenia', 'acwy-hiv', 'acwy-microbiologist',
  'acwy-travel', 'acwy-outbreak', 'acwy-college', 'acwy-military',
  'menb-healthy', 'menb-complement', 'menb-asplenia', 'menb-microbiologist', 'menb-outbreak',
  'menb-pregnancy',
];
const ACWY_ALL = POPULATIONS.filter((p) => p.startsWith('acwy-'));
const MENB_ALL = POPULATIONS.filter((p) => p.startsWith('menb-'));
const ALL_GROUPS = POPULATIONS;
const ACWY_ROUTINE = ['acwy-routine'];
const ACWY_HIGHRISK = ['acwy-complement', 'acwy-asplenia', 'acwy-hiv'];
const ACWY_AT_RISK = ACWY_ALL.filter((p) => p !== 'acwy-routine');
const MENB_HIGHRISK = ['menb-complement', 'menb-asplenia', 'menb-microbiologist', 'menb-outbreak'];
// ACIP 2020's 2-23 month rows ("4 doses at 2, 4, 6, and 12 mos"; "7-23 mos: 2
// doses ...") are printed in Tables 4, 5, 6, 8 and 9: complement, asplenia,
// HIV, outbreak, travel. Table 7 (microbiologists) has only a >=10 row.
const ACWY_INFANT_ROWS = ['acwy-complement', 'acwy-asplenia', 'acwy-hiv', 'acwy-outbreak', 'acwy-travel'];
// "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs
// thereafter" and its ">=7 yrs" twin, word for word, in Tables 4, 6 and 9 only.
const ACWY_BOOSTER_ROWS_T4_T6_T9 = ['acwy-complement', 'acwy-hiv', 'acwy-travel'];
// "Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter",
// the >=10 row, word for word in Tables 4, 5, 6, 7 and 9.
const ACWY_BOOSTER_ROWS_10_PLUS = ['acwy-complement', 'acwy-asplenia', 'acwy-hiv', 'acwy-microbiologist', 'acwy-travel'];

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
  // (A second text= directive for the college 5-year sentence was dropped in
  // M17; since D1, 2026-11-17, that sentence has its own ref,
  // acip2020College5Years, so this one stays on the caption.)
  acip2020Table10: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('TABLE 10. Recommended vaccination schedule and intervals for college freshmen living in residence halls* and military recruits')}`,
    label: 'ACIP 2020 MMWR: Table 10 — schedule for college freshmen in residence halls and military recruits',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-09-15',
  },

  // D1 (owner, 2026-11-17): the college 5-year limit. Read live 2026-11-17
  // (Table 10 footnote; the body text says the same, ">5 years have elapsed").
  acip2020College5Years: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('do not need another dose before college entry unless it has been more than 5 years since the dose')}`,
    quote: 'Adolescents who received a first dose after their 16th birthday do not need another dose before college entry unless it has been more than 5 years since the dose.',
    population: ['acwy-college'],
    label: 'ACIP 2020 MMWR, Table 10 footnote: a dose at 16 or older covers college entry for 5 years',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-17',
  },

  // STOP B B-3 (owner, 2026-11-15): the military booster date. Read live
  // 2026-11-16 (Table 10's Boosters row, and its footnote ††).
  acip2020MilitaryBooster5Years: {
    url: `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=${encodeURIComponent('Military recruits: Every 5 yrs on basis of assignment')}`,
    quote: 'Military recruits: Every 5 yrs on basis of assignment',
    population: ['acwy-military'],
    label: 'ACIP 2020 MMWR, Table 10: military recruits, a booster every 5 years on the basis of assignment',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-16',
  },

  acwyRoutine1112and16: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR: routine 11–12y dose, 16y booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // N5 (2026-11-15): the 8 weeks between dose 1 and the 16-year booster.
  acwyBooster8WeeksAfterDose1: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'the booster dose can be administered at any time, as long as a minimum interval of 8 weeks between doses is maintained',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR: at least 8 weeks between dose 1 and the 16-year booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acwyBeforeAge10: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR: doses before age 10 do not count toward the adolescent series',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  boosterBeforeAge7: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter',
    population: ACWY_BOOSTER_ROWS_T4_T6_T9,
    label: 'ACIP 2020 MMWR: booster cadence, primary completed before age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  boosterAtOrAfterAge7: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter',
    population: ACWY_BOOSTER_ROWS_T4_T6_T9,
    label: 'ACIP 2020 MMWR: booster cadence, primary completed at/after age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acwyInfantHighRisk2to6mo: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: '4 doses at 2, 4, 6, and 12 mos',
    population: ACWY_INFANT_ROWS,
    label: 'ACIP 2020 MMWR: high-risk infant MenACWY-CRM series starting at age 2 months — 4 doses at 2, 4, 6, and 12 months',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  acwyInfantHighRisk7to23mo: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: '2 doses (second dose ≥12 wks after the first dose and after the 1st birthday)',
    population: ACWY_INFANT_ROWS,
    label: 'ACIP 2020 MMWR: high-risk infant/toddler MenACWY-CRM series starting at age 7–23 months — 2-dose primary, dose 2 ≥12 weeks after dose 1 and after the 1st birthday',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // C5 (2026-11-22): each group's OWN table for the MenACWY booster timing.
  // Read live 2026-11-22 (rr6909a1.htm, every table's rows): the shared rows
  // above (`boosterBeforeAge7`, `boosterAtOrAfterAge7`) are printed word for
  // word only in Tables 4 (complement), 6 (HIV) and 9 (travel). Table 5
  // (asplenia) and Table 8 (outbreak) give the same 3 and 5 years in their own
  // words. Each of the four below appears in its own table only (Table 8's
  // "<7" sentence twice, in its 2–9 and ≥10 rows; its "≥7" sentence with a
  // capital S only in the ≥10 row).
  boosterBeforeAge7Asplenia: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged <7 yrs: Single dose at 3 yrs after vaccination and every 5 yrs thereafter',
    population: ['acwy-asplenia'],
    label: 'ACIP 2020 MMWR, Table 5 (asplenia): booster cadence, primary completed before age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-22',
  },
  boosterAtOrAfterAge7Asplenia: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged ≥7 yrs: Single dose at 5 yrs and every 5 yrs thereafter',
    population: ['acwy-asplenia'],
    label: 'ACIP 2020 MMWR, Table 5 (asplenia): booster cadence, primary completed at/after age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-22',
  },
  boosterBeforeAge7Outbreak: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged <7 yrs: Single dose if ≥3 yrs since vaccination',
    population: ['acwy-outbreak'],
    label: 'ACIP 2020 MMWR, Table 8 (outbreak): a booster if 3 years since vaccination, before age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-22',
  },
  boosterAtOrAfterAge7Outbreak: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Aged ≥7 yrs: Single dose if ≥5 yrs since vaccination',
    population: ['acwy-outbreak'],
    label: 'ACIP 2020 MMWR, Table 8 (outbreak): a booster if 5 years since vaccination, from age 7',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-22',
  },
  // C13 (2026-11-23): the "≥10 yrs" row of Tables 4 (complement) and 5
  // (asplenia). Read live 2026-11-23 (rr6909a1.htm, each table's rows): both
  // print this sentence, word for word, in their ≥10 row; their 2–9 rows hold
  // the "Aged <7 / ≥7" pair instead. Cited for a series ended at 10 or older.
  boosterFrom10: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter',
    population: ['acwy-complement', 'acwy-asplenia'],
    label: 'ACIP 2020 MMWR, Tables 4 and 5 (complement, asplenia; ≥10 yrs): booster 5 years after the series, then every 5 years',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-23',
  },
  // C5 (2026-11-22): the 3–6 month start, in ACIP's footnote. Read live
  // 2026-11-22: printed word for word under Tables 4, 5, 6, 8 and 9. CDC's
  // child notes give the same doses (`cdcChildAcwyInfantSeries`) but only under
  // the high-risk and travel headings, so an outbreak infant cites this one.
  acip2020InfantSeriesStart3to6mo: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'If MenACWY-CRM is initiated at ages 3–6 months, catch-up vaccination includes doses at intervals of 8 weeks until the infant is aged ≥7 months, at which time an additional dose is administered at age ≥7 months, followed by a dose at least 12 weeks later and after the 1st birthday.',
    population: ACWY_INFANT_ROWS,
    label: 'ACIP 2020 MMWR, Tables 4–9 footnote: the MenACWY-CRM infant series begun at 3–6 months',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-22',
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
    population: ACWY_ALL,
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
    population: ACWY_ALL,
    label: 'Washington State DOH: MenQuadfi’s 6-week minimum age aligns with AAP',
    short: 'WA DOH',
    lastVerified: '2026-09-22',
  },
  // AAP's own sentence, read 2026-11-21 from the owner's copy of the AAP 2026
  // schedule PDF (AAP's site blocks automated reading). It appears twice in the
  // MenACWY notes: under the high-risk group and under travel. The owner applied
  // it to outbreak infants too (2026-11-21, "Yes, outbreak too").
  aap2026MenQuadfiFrom6Weeks: {
    url: 'https://downloads.aap.org/AAP/PDF/AAP-Immunization-Schedule.pdf',
    quote: 'Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and 12 months). The first dose of MenQuadfi may be given as early as 6 weeks.',
    population: ['acwy-complement', 'acwy-asplenia', 'acwy-hiv', 'acwy-travel'],
    label: 'AAP 2026 schedule: the infant series starts at 2 months; MenQuadfi may be given from 6 weeks',
    short: 'AAP 2026 schedule',
    lastVerified: '2026-11-21',
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
    population: ['menb-healthy'],
    label: 'ACIP 2020 MMWR Table 2: healthy MenB shared clinical decision-making, preferred age 16\u201318 years',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  menbPregnancyDeferral: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'vaccination with MenB should be deferred unless the woman is at increased risk and, after consultation with her health care provider, the benefits of vaccination are considered to outweigh the potential risks',
    population: ['menb-pregnancy'],
    label: 'ACIP 2020 MMWR: MenB deferred during pregnancy absent an increased-risk indication',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  menbLicensedAge1025: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'MenB vaccines are licensed in the United States only for persons aged 10–25 years',
    population: MENB_ALL,
    label: 'ACIP 2020 MMWR: MenB licensure (age 10–25 years)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acwyCatchup1921: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Persons aged 19–21 years who have not received a dose after their 16th birthday can receive a single MenACWY dose as part of catch-up vaccination',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR: 19–21y catch-up dose (no dose after the 16th birthday)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  // C13 (2026-11-23): what the healthy-adult "not routinely recommended" card
  // cites, each from the patient's own row of ACIP 2020 Table 2 (read live
  // 2026-11-23, every cell). It used to cite `acwyCatchup1921`, a sentence that
  // offers a dose, written about 19-21-year-olds.
  acip2020Table2NotRoutine24Plus: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Not routinely recommended See Table 3 for persons at increased risk',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR, Table 2 (≥24 yrs): MenACWY not routinely recommended',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-23',
  },
  acip2020Table2RoutineOnly11to18: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Although routine vaccination is only recommended for adolescents aged 11–18 yrs, MenACWY may be administered to persons aged 19–21 yrs who have not received a dose after their 16th birthday',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR, Table 2 (11–23 yrs): routine MenACWY 11–18, catch-up only to 21',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-23',
  },
  acwyFirstDoseAfter16NoBooster: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Adolescents who receive a first dose after their 16th birthday do not need a booster dose unless they become at increased risk for meningococcal disease',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR: a first dose given at ≥16y needs no booster',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-07-24',
  },
  // Change 2 (2026-07-24): a dose given at exactly age 10 is valid for the
  // adolescent series — no repeat is needed at 11–12. Verified live.
  acwyAge10CountsAsDose1: {
    url: 'https://www.immunize.org/ask-experts/topic/menacwy/',
    quote: 'ACIP considers a dose of MenACWY given to a 10-year-old child to be valid for the first dose in the adolescent series.',
    population: ACWY_ROUTINE,
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
    population: MENB_ALL,
    label: 'ACIP Oct 2024 MMWR: no extra doses for people who had Bexsero at 0 and 1 month before October 24, 2024',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  menbHighRisk3DoseSchedule: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease',
    population: MENB_HIGHRISK,
    label: 'ACIP Oct 2024 MMWR: MenB-4C high-risk 3-dose series, 0/1–2/6 months',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  menbHealthy2Dose0and6: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'ACIP recommends that MenB-4C be administered to healthy adolescents and young adults aged 16–23 years as a 2-dose series at 0 and 6 months for the prevention of serogroup B meningococcal disease, based on shared clinical decision-making',
    population: ['menb-healthy'],
    label: 'ACIP Oct 2024 MMWR: MenB-4C healthy 2-dose series, 0/6 months',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  // Phase 8 item 7 (2026-11-22, citation only, owner Q12). The two sentences
  // above are written for MenB-4C (Bexsero). The same report states the same
  // two schedules for MenB-FHbp (Trumenba) in its Introduction (read live
  // 2026-11-22, exact substring), so a Trumenba or Penbraya series cites this.
  menbFhbpSchedules: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'ACIP recommends MenB-FHbp vaccine as a 2-dose series (at intervals of 0 and 6 months) for adolescents and young adults and a 3-dose series (at 0, 1–2, and 6 months) for those at increased risk',
    population: MENB_ALL,
    label: 'ACIP Oct 2024 MMWR: MenB-FHbp (Trumenba) 2-dose series 0/6 months, high-risk 3-dose series 0/1–2/6 months',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-22',
  },
  // MenB dose-3 rescue (2026-09-17). The one sentence that says an early dose 3
  // is credited rather than repeated. It lives in the CDC schedule notes, not in
  // mm7349a3, so it needs its own anchor — the adult notes carry the identical
  // sentence for people at increased risk.
  menbHighRiskEarlyD3ExtraDose: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    quote: 'if dose 3 is administered earlier than 4 months after dose 2, a 4th dose should be administered at least 4 months after dose 3',
    population: ['menb-complement', 'menb-asplenia'],
    // M1 (owner, 2026-11-20): the app no longer follows this wording. It follows
    // ACIP mm7349a3 and CDSI (the early dose 3 is repeated). Kept as the source
    // the MENB-HIGHRISK-EARLY-DOSE-3 row names as differing.
    label: 'CDC Child/Adolescent Schedule, MenB special situations: counts an early dose 3 and adds a 4th dose (the app follows ACIP 2024 instead)',
    short: 'CDC MenB Notes',
    lastVerified: '2026-11-15',
  },
  menbRescueDoseRule: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'the 2 doses should be separated by 6 months. If the second dose is administered <6 months after the first dose, a third dose should be administered ≥4 months after the second dose',
    population: ['menb-healthy'],
    label: 'ACIP Oct 2024 MMWR: healthy 2-dose interval and the third dose after an early dose 2',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-15',
  },
  menbAcceleratedRapidProtection: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'Persons receiving a MenB vaccine based on shared clinical decision-making who desire more rapid protection against serogroup B (e.g., students initiating vaccination <6 months before college entry) may receive the 3-dose series (0, 1–2, and 6 months) to optimize rapid protection. This guidance applies to both MenB-4C and MenB-FHbp.',
    population: ['menb-healthy'],
    label: 'ACIP Oct 2024 MMWR: healthy accelerated 3-dose series for rapid protection',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-07-24',
  },
  // C4, document 2 (port Phase 8, 2026-11-22): the report's button sat on
  // 7,459 cards that cited none of its sentences. Each sentence below was read
  // live 2026-11-22 in the browser pane and checked as an exact substring of
  // the page text; each backs one card line (see
  // regression-2026-11-22-c4-mm7349a3-cited-where-it-speaks.test.js).
  // The Introduction's sentence names MenB in general, not MenB-4C only, so it
  // backs "from 16 through 23 years, by shared clinical decision-making" for
  // either product.
  menbScdm1623General: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'Vaccination against serogroup B meningococcal disease is recommended by the Advisory Committee on Immunization Practices (ACIP) for adolescents and young adults aged 16–23 years, based on shared clinical decision-making',
    population: ['menb-healthy'],
    label: 'ACIP Oct 2024 MMWR: MenB for ages 16–23 years by shared clinical decision-making',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-22',
  },
  menbBoosterSameManufacturer: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'Booster doses need to be from the same manufacturer used for doses in the primary series',
    population: MENB_HIGHRISK,
    label: 'ACIP Oct 2024 MMWR: a MenB booster is the same manufacturer as the primary series',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-22',
  },
  menbHealthy2DoseSeparated6Months: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'When administering the 2-dose series (e.g., for healthy adolescents) of MenB-4C (Bexsero) or MenB-FHbp (Trumenba), the 2 doses should be separated by 6 months',
    population: ['menb-healthy'],
    label: 'ACIP Oct 2024 MMWR: the healthy 2-dose series, Bexsero or Trumenba, is 6 months apart',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-22',
  },
  menbBoosterIfRemainOrBecomeAtRisk: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'Persons who have completed a MenB vaccine primary series and who remain or become at increased risk for invasive meningococcal disease are recommended to receive booster vaccination',
    population: MENB_HIGHRISK,
    label: 'ACIP Oct 2024 MMWR: a MenB booster only for someone who remains or becomes at increased risk',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-22',
  },
  menbLicensedAge1025Acip2024: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'Two serogroup B meningococcal vaccines (MenB-FHbp [Trumenba, Pfizer, Inc.] and MenB-4C [Bexsero, GSK]) and one serogroup ABCWY pentavalent meningococcal (MenABCWY) vaccine (MenACWY-TT/MenB-FHbp [Penbraya, Pfizer Inc.]) are currently licensed for use in persons aged 10–25 years in the United States',
    population: MENB_ALL,
    label: 'ACIP Oct 2024 MMWR: MenB vaccines are licensed for ages 10–25 years',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-22',
  },

  // MMWR 75(1);7–14 — the SAME document as pentavalentGSK2025 below (its PMC
  // mirror is PMC12782235); its Box cleanly restates every current
  // MenACWY/MenB indication and the MenB high-risk booster cadence. Quotes
  // confirmed live 2026-07-24, and again 2026-10-17, as exact substrings of
  // https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm.
  menbHighRiskBoosterCadenceBox: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'the first booster dose should be given 1 year after the primary series, with additional boosters every 2–3 years if the risk remains',
    population: ['menb-complement', 'menb-asplenia', 'menb-microbiologist'],
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
    population: [...ACWY_AT_RISK, ...MENB_HIGHRISK],
    label: 'ACIP 2025 (Penmenvy): may be used when both are due, for persons aged ≥10 years at increased risk',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-15',
  },
  pentavalentLicensed10to25: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'licensed for use in persons aged 10–25 years',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: licensed for persons aged 10–25 years',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-15',
  },
  cdcAdultPenbrayaSameDay: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening',
    quote: 'Adults may receive a single dose of Penbraya (MenACWY–TT/MenB–FHbp) as an alternative to separate administration of MenACWY and MenB when both vaccines would be given on the same clinic day.',
    population: ALL_GROUPS,
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
    // [N] highlight-superscript.
    url: 'https://www.cdc.gov/meningococcal/hcp/vaccine-recommendations/index.html',
    label: 'CDC: Meningococcal Vaccine Recommendations (HCP)',
    short: 'CDC Meningococcal Recommendations',
    lastVerified: '2026-07-24',
  },
  // C4, document 4 (2026-11-22, Q12: the dose is unchanged): read live
  // 2026-11-22 (page dated Mar. 30, 2026), an exact substring of the page text,
  // under MenB "Boosting during an outbreak", whose footnote B reads
  // "Specifically outbreaks involving serogroup B meningococcal disease".
  // Cited beside ACIP 2020 Table 8 on a serogroup B outbreak's one MenB booster.
  // C4, document 5 (2026-11-22): CDC's Adult Immunization Schedule notes, read
  // live 2026-11-22 (updated July 2, 2025), "Special situations for MenB". The
  // schedule is "Recommendations for Ages 19 Years or Older", so these are
  // cited on cards for patients 19 and older only; CDC's child/adolescent notes
  // say nothing about MenB in pregnancy, and ACIP 2020's sentence
  // (`menbPregnancyDeferral`) covers every age.
  cdcAdultMenbPregnancyDelay: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening',
    quote: 'Delay MenB until after pregnancy due to lack of safety data in pregnant women.',
    population: ['menb-pregnancy'],
    label: 'CDC Adult Schedule notes: delay MenB until after pregnancy',
    short: 'CDC Adult Notes',
    lastVerified: '2026-11-22',
  },
  cdcAdultMenbPregnancyMayGive: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening',
    quote: 'May administer if at increased risk and vaccination benefits outweigh potential risks.',
    population: ['menb-pregnancy'],
    label: 'CDC Adult Schedule notes: MenB in pregnancy if at increased risk',
    short: 'CDC Adult Notes',
    lastVerified: '2026-11-22',
  },
  cdcRecsMenbOutbreakBoosterYear: {
    url: 'https://www.cdc.gov/meningococcal/hcp/vaccine-recommendations/index.html',
    quote: 'CDC recommends a booster dose for these individuals if a year or more has passed since the most recent MenB vaccine',
    population: ['menb-outbreak'],
    label: 'CDC meningococcal recommendations: in a serogroup B outbreak, a MenB booster if a year or more has passed',
    short: 'CDC Meningococcal Recommendations',
    lastVerified: '2026-11-22',
  },
  cdcComplementInhibitor: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    label: 'CDC: Managing Meningococcal Risk in Patients on Complement Inhibitor Therapy',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-07-23',
  },
  // C4, document 3 (owner, 2026-11-22, "Cite on booster lines"): read live
  // 2026-11-22 (page dated Mar. 6, 2026), exact substrings of the page text.
  // Cited only on a complement patient's cards (recommend.js
  // withComplementPageCites and the under-10 MenB card).
  cdcComplementMenacwyBoosterEvery5: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    quote: 'Administer a booster dose of MenACWY vaccine every 5 years, for the duration of complement inhibitor therapy',
    population: ['acwy-complement'],
    label: 'CDC complement-inhibitor guidance: MenACWY booster every 5 years during therapy',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-11-22',
  },
  cdcComplementMenbBoosterEvery2to3: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    quote: 'Every 2 to 3 years thereafter, for the duration of complement inhibitor therapy',
    population: ['menb-complement'],
    label: 'CDC complement-inhibitor guidance: MenB booster every 2 to 3 years during therapy',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-11-22',
  },
  // Tier 1 Q2 (owner, 2026-11-22 "Add the note"; 2026-11-23 placement). Read
  // live 2026-11-22 and 2026-11-23; page dated Mar 6, 2026. The page is about
  // complement-inhibitor recipients; the app's one checkbox also covers
  // inherited deficiency, so the alert says "If on a complement inhibitor".
  cdcComplementIncompleteProtection: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    quote: 'Vaccination is also recommended but offers incomplete protection.',
    population: ['acwy-complement', 'menb-complement'],
    label: 'CDC complement-inhibitor guidance: vaccination offers incomplete protection',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-11-23',
  },
  cdcComplementConsiderProphylaxis: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    quote: 'In addition to vaccination, healthcare providers could consider antimicrobial prophylaxis for complement inhibitor recipients to potentially reduce meningococcal disease risk.',
    population: ['acwy-complement', 'menb-complement'],
    label: 'CDC complement-inhibitor guidance: antimicrobial prophylaxis could be considered',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-11-23',
  },
  cdcComplementVaccinate2WeeksBefore: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    quote: 'Ideally, complete or update meningococcal vaccination at least 2 weeks prior to administering the first dose of the complement inhibitor.',
    population: ['acwy-complement', 'menb-complement'],
    label: 'CDC complement-inhibitor guidance: vaccinate at least 2 weeks before the first inhibitor dose',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-11-23',
  },
  cdcComplementMenb3Doses: {
    url: 'https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html',
    quote: 'MenB vaccines need 3 doses',
    population: ['menb-complement'],
    label: 'CDC complement-inhibitor guidance: MenB vaccines need 3 doses',
    short: 'CDC Complement-Inhibitor Guidance',
    lastVerified: '2026-11-22',
  },

  // immunize.org's "Ask the Experts" topic pages (immMenACWY, immMenB) were
  // whole-page buttons until 2026-11-22. Owner, 2026-11-22: "Remove the
  // buttons" -- each card that listed one already cited ACIP's own sentence
  // for the same point. Where an immunize.org answer is the source, quote it
  // (as acwyAge10CountsAsDose1 does); each answer has its own "Last reviewed"
  // date. docs/archive/decisions-2026-11-22-c4-immunize-org.md.
  //
  // immMenACWY stays only as the MenACWY page's title: RecCard.jsx's
  // documentTitle() names a numbered quote's button (acwyAge10CountsAsDose1)
  // after the page's whole-document entry. No card lists it as a button.
  immMenACWY: {
    url: 'https://www.immunize.org/ask-experts/topic/menacwy/',
    label: 'immunize.org: Ask the Experts — Meningococcal ACWY',
    short: 'Ask the Experts: MenACWY',
    lastVerified: '2026-11-22',
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
    population: ALL_GROUPS,
    label: 'ACIP General Best Practice Guidelines: only written, dated records are evidence of vaccination (except influenza and PPSV23)',
    short: 'ACIP Best Practice',
    lastVerified: '2026-11-15',
  },
  // RULING D (owner, STOP C C2, 2026-11-15). Read live 2026-11-15.
  gbpRepeatSpacedFromInvalidDose: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html',
    quote: 'The repeat dose should be spaced after the invalid dose by the recommended minimum interval',
    population: ALL_GROUPS,
    label: 'ACIP General Best Practice Guidelines: a repeat dose is spaced from the invalid dose',
    short: 'ACIP Best Practice',
    lastVerified: '2026-11-20',
  },
  // The sentence the owner's E1 answer deliberately differs from (2026-11-15):
  // for an inactivated vaccine CDC sets no wait after a too-young first dose.
  gbpTooYoungFirstDoseRepeat: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html',
    quote: 'If the first dose in a series is given ≥5 days before the recommended minimum age, the dose should be repeated on or after the date when the child reaches at least the minimum age',
    population: ALL_GROUPS,
    label: 'ACIP General Best Practice Guidelines: a too-young first dose is repeated once the minimum age is reached',
    short: 'ACIP Best Practice',
    lastVerified: '2026-11-15',
  },
  gbpRecordsNotFoundSusceptible: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html',
    quote: 'If records cannot be located within a reasonable time, these persons should be considered susceptible and started on the age-appropriate vaccination schedule.',
    population: ALL_GROUPS,
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
    // Lengthened 2026-11-21 (owner, C11 follow-up) to take in Penbraya. The
    // ")" after "MenQuadfi]" is on CDC's page as printed (read live 2026-11-21).
    quote: 'minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]), 10 years [MenACWY-TT/MenB-FHbp, Penbraya]',
    population: ACWY_ALL,
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY minimum ages',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-21',
  },
  cdcChildMenveoLiquid10y: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'The liquid formulation should not be used before age 10 years.',
    population: ACWY_ALL,
    label: 'CDC Child/Adolescent Schedule Notes: Menveo one-vial (liquid) not before age 10',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildAcwyInfantSeries: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months',
    population: ['acwy-complement', 'acwy-asplenia', 'acwy-hiv', 'acwy-travel'],
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY infant series minimum gaps',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildAcwyRisk2DoseFrom24m: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart',
    population: ACWY_HIGHRISK,
    label: 'CDC Child/Adolescent Schedule Notes: high-risk MenACWY 2-dose series from 24 months',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcChildAcwyBefore10OngoingRisk: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Children for whom boosters are recommended because of an ongoing increased risk of meningococcal disease (e.g., those with complement component deficiency, HIV, or asplenia): Follow the booster schedule for persons at increased risk.',
    population: [...ACWY_HIGHRISK, 'acwy-microbiologist', 'acwy-travel', 'acwy-outbreak', 'acwy-military'],
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY before age 10 with an ongoing risk',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-15',
  },
  cdcCatchupAcwyBooster8Weeks: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8 weeks)',
    population: ACWY_ROUTINE,
    label: 'CDC Child/Adolescent Schedule Notes: MenACWY catch-up, booster at least 8 weeks after dose 1',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-18',
  },
  cdcChildMenbMinAge: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    quote: 'minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]',
    population: MENB_ALL,
    label: 'CDC Child/Adolescent Schedule Notes: MenB minimum age',
    short: 'CDC MenB Notes',
    lastVerified: '2026-11-15',
  },
  acip2020Acwy8WeekMinimum: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'a second dose should be administered as soon as possible, provided that an 8-week minimum interval between doses is maintained',
    population: ACWY_HIGHRISK,
    label: 'ACIP 2020 MMWR: 8-week minimum between the two MenACWY primary doses',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // In the MenB section of the MMWR (after the paragraph on mismatched MenB
  // products). The only "4 weeks between any 2 doses" sentence the page has.
  acip2020MenbRepeat4Weeks: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'For situations in which a dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses',
    population: MENB_ALL,
    label: 'ACIP 2020 MMWR (MenB section): 4 weeks between doses when a MenB dose is repeated',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  // E2 (owner, 2026-11-15). Read live 2026-11-15.
  acip2020Table8MenbOutbreakBooster: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Single dose if ≥1 yr after MenB primary series completion',
    population: ['menb-outbreak'],
    label: 'ACIP 2020 MMWR Table 8: one MenB booster for a serogroup B outbreak',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  // Tier 1 Q5 (owner, 2026-11-22, "Count from 6 months"). Read live
  // 2026-11-22: Table 8's MenB booster cell, whole. The 6-month option is in
  // the outbreak table only (Tables 4, 5 and 7 give 1 year).
  acip2020Table8MenbOutbreakBoosterSixMonths: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Single dose if ≥1 yr after MenB primary series completion (≥6 mos interval might also be considered by public health professionals)',
    population: ['menb-outbreak'],
    label: 'ACIP 2020 MMWR Table 8: an outbreak MenB booster from 6 months, if public health advises it',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-22',
  },
  acip2020MenbMixedProductsSelectOne: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'If 2 doses were administered using different MenB products, one product should be selected for administration of an additional dose at an appropriate interval to ensure valid completion of a MenB series; the dose from the product not selected for series completion should be considered invalid',
    population: MENB_ALL,
    label: 'ACIP 2020 MMWR: after two different MenB products, pick one to finish the series',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acip2020MenbNotInterchangeable: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'MenB vaccines are not interchangeable, and the same vaccine product must be used for all doses',
    population: MENB_ALL,
    label: 'ACIP 2020 MMWR: MenB products are not interchangeable',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-15',
  },
  acip2020MenbBoosterCadence: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'a MenB booster dose 1 year after primary series completion, then every 2–3 years thereafter',
    population: ['menb-complement', 'menb-asplenia', 'menb-microbiologist'],
    label: 'ACIP 2020 MMWR: high-risk MenB booster schedule',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  // Item 6 (owner, 2026-11-22, "Add line, cite ACIP"): the first-booster card
  // of a high-risk series that ended at two doses says why. Read live
  // 2026-11-22; the same paragraph as the sentence below, for "persons aged
  // ≥10 years at increased risk" and both MenB-4C and MenB-FHbp.
  menbHighRiskD2SixMonthsNoD3Acip2024: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'a third dose is not needed if the second dose was administered ≥6 months after the first dose',
    population: MENB_HIGHRISK,
    label: 'ACIP Oct 2024 MMWR: no high-risk MenB dose 3 if dose 2 was 6 months after dose 1',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-22',
  },
  menbHighRiskEarlyD3Unless: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm',
    quote: 'If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose',
    population: MENB_HIGHRISK,
    label: 'ACIP Oct 2024 MMWR: an early high-risk MenB dose 3 is repeated ≥4 months after it, unless it was 6 months after dose 1',
    short: 'ACIP Oct 2024 MMWR',
    lastVerified: '2026-11-20',
  },

  // ── Port Phase 7.1, the rulebook's "todo" rules (2026-11-19) ──────────────
  // Each sentence below was read live on 2026-11-19 in a real browser and
  // checked as an exact substring of the page text. They are cited by the
  // rulebook (docs/agent/meningococcal-rules-summary.md, §§1–3) through its
  // SOURCES tags; none is shown on a card yet.

  // ACIP 2020 MMWR (rr6909a1).
  acip2020AcwyRiskGroupsFrom2mo: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'ACIP also recommends routine vaccination with MenACWY for persons aged ≥2 months at increased risk for meningococcal disease caused by serogroups A, C, W, or Y, including persons who have persistent complement component deficiencies; persons receiving a complement inhibitor (e.g., eculizumab [Soliris] or ravulizumab [Ultomiris]); persons who have anatomic or functional asplenia; persons with human immunodeficiency virus infection; microbiologists routinely exposed to isolates of Neisseria meningitidis; persons identified to be at increased risk because of a meningococcal disease outbreak caused by serogroups A, C, W, or Y; persons who travel to or live in areas in which meningococcal disease is hyperendemic or epidemic; unvaccinated or incompletely vaccinated first-year college students living in residence halls; and military recruits',
    population: ACWY_AT_RISK,
    label: 'ACIP 2020 MMWR: who gets MenACWY from 2 months of age (HIV is on this list)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-19',
  },
  acip2020MenbRiskGroups: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'ACIP recommends routine use of MenB vaccine series among persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease, including persons who have persistent complement component deficiencies; persons receiving a complement inhibitor; persons who have anatomic or functional asplenia; microbiologists who are routinely exposed to isolates of N. meningitidis; and persons identified to be at increased risk because of a meningococcal disease outbreak caused by serogroup B',
    population: MENB_HIGHRISK,
    label: 'ACIP 2020 MMWR: who gets MenB for risk (HIV is not on this list)',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  acip2020Table2CatchupOnly1921: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Although routine vaccination is only recommended for adolescents aged 11–18 yrs, MenACWY may be administered to persons aged 19–21 yrs who have not received a dose after their 16th birthday',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR, Table 2: routine MenACWY is for 11–18, catch-up for 19–21',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-19',
  },
  acip2020Table2Booster16: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Booster: 1 dose at age 16 yrs if first dose administered before 16th birthday',
    population: ACWY_ROUTINE,
    label: 'ACIP 2020 MMWR, Table 2: the 16-year MenACWY dose',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  // The same words appear in Tables 4–9; this entry cites them for Table 7
  // (microbiologists), whose only row is "≥10 yrs".
  acip2020Table7MicrobiologistBooster: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter',
    population: ACWY_BOOSTER_ROWS_10_PLUS,
    label: 'ACIP 2020 MMWR, Table 7 (microbiologists, ≥10 yrs only): MenACWY booster every 5 years',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  // C4, ACIP 2020 part 2 (2026-11-21): the MenACWY exposure cards. Each quote
  // read live 2026-11-21 in the browser pane (innerText of the rendered page).
  // The Table 9 travel booster row has the same words as Table 7's; this entry
  // names Table 9, whose row is "≥2 yrs".
  acip2020Table9TravelBooster: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter',
    population: ACWY_BOOSTER_ROWS_10_PLUS,
    label: 'ACIP 2020 MMWR, Table 9 (travelers, ≥2 yrs): MenACWY booster every 5 years while at risk',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  // The summary's list of who gets MenACWY for increased risk. One entry per
  // group, each quoting that group's own words in the one sentence.
  acip2020IndicationMicrobiologist: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'microbiologists routinely exposed to isolates of Neisseria meningitidis',
    population: ['acwy-microbiologist', 'menb-microbiologist'],
    label: 'ACIP 2020 MMWR: MenACWY for microbiologists routinely exposed to N. meningitidis',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  acip2020IndicationOutbreakACWY: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'persons identified to be at increased risk because of a meningococcal disease outbreak caused by serogroups A, C, W, or Y',
    population: ['acwy-outbreak'],
    label: 'ACIP 2020 MMWR: MenACWY for persons at increased risk in a serogroup A, C, W or Y outbreak',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  acip2020IndicationTravel: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'persons who travel to or live in areas in which meningococcal disease is hyperendemic or epidemic',
    population: ['acwy-travel'],
    label: 'ACIP 2020 MMWR: MenACWY for travel to, or residence in, hyperendemic or epidemic areas',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  acip2020IndicationMilitary: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'first-year college students living in residence halls; and military recruits',
    population: ['acwy-college', 'acwy-military'],
    label: 'ACIP 2020 MMWR: MenACWY for military recruits',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  // Table 10 footnote *: a college entrant with no dose on record.
  acip2020College1DoseBeforeEntry: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'College freshmen living in residence halls should receive at least 1 dose of MenACWY within 5 years before college entry.',
    population: ['acwy-college'],
    label: 'ACIP 2020 MMWR, Table 10 footnote: at least 1 MenACWY dose within 5 years before college entry',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  acip2020CollegePreferredAfter16: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'The preferred timing of the most recent dose is on or after their 16th birthday.',
    population: ['acwy-college'],
    label: 'ACIP 2020 MMWR, Table 10 footnote: the most recent dose preferably on or after the 16th birthday',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  // Table 10 footnote *: a college entrant whose only dose came before 16.
  acip2020CollegeBoosterBeforeEnrollment: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'If only 1 dose of vaccine was administered before the 16th birthday, a booster dose should be administered before enrollment.',
    population: ['acwy-college'],
    label: 'ACIP 2020 MMWR, Table 10 footnote: a dose before 16 needs a booster before college enrollment',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-21',
  },
  acip2020MenbShortProtection: {
    url: 'https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm',
    quote: 'the estimated relatively short duration of MenB protection (antibody waning within 1–2 years postcompletion of the primary series)',
    population: MENB_ALL,
    label: 'ACIP 2020 MMWR: MenB protection wanes within 1–2 years',
    short: 'ACIP 2020 MMWR',
    lastVerified: '2026-11-19',
  },

  // CDC child and adolescent schedule notes.
  cdcCatchupAcwy1618OneDose: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Age 16–18 years: 1 dose',
    population: ACWY_ROUTINE,
    label: 'CDC child schedule notes, MenACWY catch-up: one dose at 16–18',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-19',
  },
  cdcChildAcwyTravelUnder24m: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening',
    quote: 'Children younger than age 24 months: Menveo* (age 2–23 months)',
    population: ['acwy-travel'],
    label: 'CDC child schedule notes, travel: the infant Menveo series',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-11-19',
  },
  cdcChildMenbHighRiskD2SixMonthsNoD3: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    quote: 'if dose 2 was administered at least 6 months after dose 1, dose 3 not needed',
    population: ['menb-complement', 'menb-asplenia'],
    label: 'CDC child schedule notes, high-risk MenB: no dose 3 after a 6-month gap',
    short: 'CDC MenB Notes',
    lastVerified: '2026-11-19',
  },
  cdcChildPenbrayaDose2Trumenba: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    quote: 'if Penbraya is used for dose 1 MenB, MenB-FHbp (Trumenba) should be administered for dose 2 MenB',
    population: ALL_GROUPS,
    label: 'CDC child schedule notes: after Penbraya, MenB continues with Trumenba',
    short: 'CDC MenB Notes',
    lastVerified: '2026-11-19',
  },
  cdcChildPenbraya6Months: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b',
    quote: 'Penbraya may be used for additional MenACWY and MenB doses (including booster doses) if both would be given on the same clinic day and at least 6 months have elapsed since most recent Penbraya dose',
    population: ALL_GROUPS,
    label: 'CDC child schedule notes: another Penbraya only 6 months after the last',
    short: 'CDC MenB Notes',
    lastVerified: '2026-11-19',
  },

  // ACIP 2025 Penmenvy MMWR (mm7501a2), published January 2026.
  penmenvyIsCrm4C: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'A new pentavalent meningococcal vaccine (MenACWY-CRM/MenB-4C [Penmenvy, GSK]) protects against N. meningitidis serogroups A, B, C, W, and Y',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: Penmenvy is MenACWY-CRM/MenB-4C',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-19',
  },
  penmenvyMenb4COtherDoses: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, when MenACWY-CRM/MenB-4C is used, MenB-4C should be used for the other MenB doses',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: Penmenvy belongs with Bexsero (MenB-4C)',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-19',
  },
  penbrayaMenbFhbpOtherDoses: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, persons who receive pentavalent MenACWY-TT/MenB-FHbp should have already received or should next receive MenB-FHbp for other MenB doses',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: Penbraya belongs with Trumenba (MenB-FHbp)',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-19',
  },
  pentavalentWhenBothIndicated: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'ACIP recommended that MenACWY-CRM/MenB-4C may be used when both MenACWY and MenB are indicated at the same visit',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: a pentavalent only when both vaccines are due at the same visit',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-19',
  },
  // The age ACIP recommends Penmenvy from (its box of recommendations). No
  // ACIP/CDC page states a Penmenvy minimum age and CDC's schedule notes do not
  // name it yet (read live 2026-11-21); the owner chose this sentence for the
  // "Minimum age not met … for Penmenvy" line (2026-11-21, C11 follow-up).
  penmenvyAged10BothIndicated: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'Persons aged ≥10 years for whom MenACWY and MenB are both indicated',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: recommended for persons aged ≥10 years for whom MenACWY and MenB are both indicated',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-21',
  },
  // Under-10 "Not indicated" MenB card (2026-11-22): the licensure line names
  // Penmenvy; this is the report's own licensure sentence for it. Read live
  // 2026-11-22 as an exact substring of the page.
  penmenvyLicensedAge1025: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'On February 14, 2025, a second pentavalent meningococcal vaccine (MenACWY-CRM/MenB-4C [Penmenvy, GSK]) was licensed for use in persons aged 10–25 years',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: Penmenvy is licensed for ages 10–25 years',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-22',
  },
  penmenvySeparateUnder6Months: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'Persons at increased risk for meningococcal disease who receive a dose of MenACWY-CRM/MenB-4C and who are recommended to receive additional doses of MenACWY and MenB <6 months after a dose of pentavalent meningococcal vaccine should receive separate MenACWY and MenB-4C vaccines, rather than MenACWY-CRM/MenB-4C, following recommended intervals',
    population: [...ACWY_AT_RISK, ...MENB_HIGHRISK],
    label: 'ACIP 2025 (Penmenvy) MMWR: within 6 months of a pentavalent, give the two vaccines separately',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-19',
  },
  pentavalentValidPerComponent: {
    url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm',
    quote: 'MenACWY-CRM/MenB-4C doses deviating from the licensed 6-month interval can be considered valid for MenACWY or MenB if the timing would otherwise have been valid for that component',
    population: ALL_GROUPS,
    label: 'ACIP 2025 (Penmenvy) MMWR: each half of a pentavalent dose is judged on its own',
    short: 'Penmenvy MMWR 2026;75(1)',
    lastVerified: '2026-11-19',
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
export function cite(key, { aboutAnotherGroup } = {}) {
  const c = CITATIONS[key];
  return {
    key,
    page: c?.url,
    url: highlightUrl(key),
    label: c?.quote ?? c?.label,
    doc: c?.short,
    quote: c?.quote,
    // C5 (2026-11-22): set only where a card cites another patient group's
    // sentence on purpose; the reason is written at the call site.
    ...(aboutAnotherGroup ? { aboutAnotherGroup } : {}),
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
// C5 (2026-11-22): which ACIP 2020 row states this patient's MenACWY booster
// timing. The shared rows are Tables 4, 6 and 9 (complement, HIV, travel);
// asplenia (Table 5) and an outbreak (Table 8) word the same years in their own
// rows. A patient in two groups cites the shared row if either group is one of
// its three. Same years whichever row is cited: only the sentence differs.
//
// C13 (2026-11-23): the row is also chosen by the patient's AGE. Tables 4
// (complement) and 5 (asplenia) have a "2–9 yrs" row, holding the "Aged <7" and
// "Aged ≥7" sentences, and a separate "≥10 yrs" row. A series that ends at 10 or
// older is in the "≥10 yrs" row (`boosterFrom10`). Tables 6 (HIV) and 9
// (travel) have one "≥2 yrs" row holding both sentences, so "Aged ≥7 yrs" is
// their own row at every age. `from10`: the series ended (or will end) at 10 or
// older, per `menacwyBoosterRowFrom10()` in ages.js; false when unknown (then
// the 2–9 row, as before).
export function acwyBoosterRowKey(under7, riskIds = [], from10 = false) {
  if (!under7 && from10 && ['complement', 'asplenia'].some((id) => riskIds.includes(id))) return 'boosterFrom10';
  const shared = ['complement', 'hiv', 'travel'].some((id) => riskIds.includes(id));
  if (!shared && riskIds.includes('asplenia')) return under7 ? 'boosterBeforeAge7Asplenia' : 'boosterAtOrAfterAge7Asplenia';
  if (!shared && riskIds.includes('outbreak_acwy')) return under7 ? 'boosterBeforeAge7Outbreak' : 'boosterAtOrAfterAge7Outbreak';
  return under7 ? 'boosterBeforeAge7' : 'boosterAtOrAfterAge7';
}

// C5 (2026-11-22): the infant series begun at 3–6 months. CDC first (C6),
// where CDC's notes speak for the patient (high-risk or travel); otherwise
// ACIP's footnote, printed under the outbreak table too.
export function acwyInfantSeriesKey(riskIds = []) {
  const cdcSpeaks = ['complement', 'asplenia', 'hiv', 'travel'].some((id) => riskIds.includes(id));
  return cdcSpeaks ? 'cdcChildAcwyInfantSeries' : 'acip2020InfantSeriesStart3to6mo';
}

export function citeTitle(c) {
  if (!c) return undefined;
  if (c.quote && c.doc) return `${c.doc}\n\u201c${c.quote}\u201d`;
  return c.label;
}
