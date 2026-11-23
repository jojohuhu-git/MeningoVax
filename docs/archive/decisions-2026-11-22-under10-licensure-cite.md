# Under-10 MenB card: the licensure line cites a sentence for each brand (2026-11-22)

Citation only. Decided under the owner's Q12 rule (2026-11-21: decide alone when the dose is
unchanged). Owner chose this item from the handoff queue on 2026-11-22.

## What was wrong

A healthy child under 10 gets a MenB card, "Not indicated", whose "Why this" says:

> MenB vaccines (Bexsero, Trumenba, Penmenvy, Penbraya) are FDA-licensed from age 10 years [1].

Source [1] was ACIP 2020's "MenB vaccines are licensed in the United States only for persons aged
10–25 years". That report came out before either combined shot (Penbraya, Penmenvy) existed, so
it could not be the source for two of the four brands the line names.

## What it cites now

Two sentences, read live on 2026-11-22, that between them name all four brands:

1. ACIP Oct 2024 (mm7349a3), already in `refs.js` as `menbLicensedAge1025Acip2024`: Trumenba,
   Bexsero and Penbraya "are currently licensed for use in persons aged 10–25 years in the United
   States".
2. ACIP 2025 (mm7501a2), new key `penmenvyLicensedAge1025`: "On February 14, 2025, a second
   pentavalent meningococcal vaccine (MenACWY-CRM/MenB-4C [Penmenvy, GSK]) was licensed for use in
   persons aged 10–25 years". Checked as an exact match on the live page.

The line now reads "… from age 10 years [1][2]." The rest of the card (its list of who gets MenB at
10–15, citing ACIP 2020's risk-group sentence) is unchanged and is now [3].

## Judgement calls

- Kept ACIP 2020's licensure sentence where it is still the right source: a Bexsero or Trumenba
  "Minimum age not met" line (item 7's `menbMinAgeCite`). It is still cited, so it stays in
  `refs.js`.
- Did not touch the high-risk under-10 card ("MenB is licensed from age 10 years [c], so nothing is
  due yet"). It names no brand and already cites ACIP 2024's sentence.
- The recorded-dose "Why this" line `MENB_LICENSED_FROM_10_WHY` also names the four brands, but
  recorded-dose "Why this" lines carry no source numbers by design (`RecCard.jsx`, `DoseWhy`). No
  change.

## Measured

- Answers moved: 0 (`sweep-saved-answers.test.js` passed unchanged).
- Wording: 2,744 of 24,600 saved patients read differently (1,036 real, 1,708 impossible
  entries). With the source hovers, numbers and button labels removed, 0 differ: only the sources
  changed.
- Cards with an uncited source button: 0 of 35,056 (`scripts/uncitedByDocument.mjs`).
- Suite: 2,555 passing, 0 failing, 217 files.
- Live check (dev server, healthy child born 1 June 2018): the card shows "[1][2]"; [1] opens ACIP
  Oct 2024 and [2] the 2025 Penmenvy report, each at the quoted sentence; buttons "[1] ACIP Oct 2024
  MMWR", "[2] Penmenvy MMWR 2026;75(1)", "[3] ACIP 2020 MMWR".
- Guard: `src/logic/__tests__/regression-2026-11-22-under10-licensure-names-each-brand.test.js`.
