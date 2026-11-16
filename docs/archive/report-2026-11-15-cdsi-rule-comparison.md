# Report — the rule table held against CDC's CDSI rules (port 2.3, 2026-11-15)

**What this is.** CDSI is CDC's machine-readable version of ACIP's schedule. Port item 2.3 read
CDSI 4.65's two meningococcal rule files and held every row of the app's rule table
(`src/logic/doseRules.js`, 35 rows) against them. **Findings are listed, not fixed.** No answer,
dose verdict or sentence in the app changed (prose dump 0 of 23,400; CDC test patients "moved 0").
CDSI is a cross-check, never the authority: where it and CDC/ACIP wording differ, the wording wins.

How to re-run: `npx vite-node scripts/cdsi/runRuleComparison.mjs`. Required test:
`src/logic/__tests__/cdsi-rule-comparison.test.js`.

## The numbers

- **442** rules read from CDC's two files; **all 442 accounted for** (compared, covered by a row,
  or listed as not compared with a reason).
- **35 rows:** 18 compared with CDSI; 17 have no CDSI counterpart (typing checks, undated doses,
  the "was the patient high-risk when given?" question, the extra 4th dose, "Extra" doses). CDSI
  has no rule of those kinds, each reason written down.
- **81 comparisons**, plus 2 CDSI rules the app has no row for: 57 agree. 26 differences: 3 follow
  CDC/ACIP wording (settled), 7 owner-decided, 16 open. The 16 open ones are **8 questions**
  (several are the same question checked for both MenB brand families).

**Where the app and CDSI agree** (the bulk): every infant-series gap, the 8-week high-risk and
routine gaps, all MenACWY and MenB booster gaps (3 / 5 years; 1 / 2 years), the MenB high-risk
dose 2 gap, the healthy rescue dose 3 gap, every product's minimum age except the two below, the
MenB brand families, the 16-year booster age, and 10 app ages that are not dose rules (2 and 7
months; 2, 7, 11, 16, 19 and 22 years; MenB 16 and 24 years).

## New in 2.3 — for STOP C (Q2: floor, advice, or app rule?)

| # | What | App today | CDSI | Patient |
|---|---|---|---|---|
| N1 | **Penbraya / Penmenvy at 26 or older** | Counts (no upper age for any product) | Allowed only up to 26 years, in every series | Born 1998-01-01, asplenia, Penbraya 2025-06-01 (age 27): app counts it as dose 1 of both ("Dose 2 of 2" MenACWY, "Dose 2 of 3" MenB due today) |
| N2 | **High-risk Bexsero: 2 doses before 25 Oct 2024** | Asks dose 3 (checked: asplenia, Bexsero 2023-01-01 and 2023-02-15 → "Dose 3 of 3 (high-risk, 4C)") | The old 2-dose course is complete; no dose 3 | that patient |
| N3 | **Healthy MenB: dose 2 given 1–4 days before 6 months** | Counts as early; dose 3 owed | 4-day grace: 2-dose series complete | Born 2008-01-01, Trumenba 2026-01-01 and 2026-06-29: app "Dose 3 of 3 (rescue: dose 2 given early)". Control, 2026-07-01: "Complete (2-dose series)" |
| N4 | **Upper ages for counting a dose** (routine MenACWY dose 1 19 y, dose 2 22 y; healthy MenB dose 1 24 y) | Never refuses a recorded dose for age; uses the same numbers only to stop recommending | Sets those maximum ages | Low stakes: no more doses are owed either way |

Also new, on a row already on the Q2 list: **high-risk MenB dose 3 just under 4 months after
dose 2.** CDSI gives that line the 4-day grace; the app gives none and asks a 4th dose. N3 and
this one have the same shape as the owner's B-1 answer ("use the grace only when it helps"): here
the grace would mean one dose fewer. B-1 was asked about age lines, not gaps, so it is a question,
not a ruling.

**Read live 2026-11-15, after this report was first written** (in a real browser; quotes in
`src/data/refs.js`):

- **N1.** Both ACIP pentavalent statements recommend them, when both vaccines are due at the same
  visit, for "persons aged ≥10 years who are at increased risk for meningococcal disease" (mm7315a4,
  mm7501a2), with **no upper age**. Both MMWRs give the licence as "10–25 years". CDC's adult notes
  (updated July 2, 2025): "Adults may receive a single dose of Penbraya … when both vaccines would
  be given on the same clinic day." So CDSI's 26 matches the licence, not ACIP's wording.
- **N2.** mm7349a3: "There is no recommendation to administer additional doses to persons
  vaccinated with MenB-4C before October 24, 2024, using a 0- and 1-month dosing schedule." It
  names no risk group. **New:** it covers healthy patients too, and the app asks them a dose 3 as
  well. Born 2005-08-01, healthy, Bexsero 2022-11-01 and 2022-12-01 → "Dose 3 of 3 (rescue: dose 2
  given early)"; the dose 2 chip says a third dose "is now required". CDSI completes that course too
  (its healthy dose-2 gap is 4 weeks for doses given until 24 Oct 2024). One-day edge: ACIP says
  "before October 24"; CDSI's cutoff is 25 October.
- **Undated records** (two rows, `ACWY-UNDATED-COUNTS`, `MENB-UNDATED-COUNTS`; moved from STOP C Q4
  to Q2). ACIP's General Best Practice Guidelines, Timing and Spacing (page updated July 24, 2024):
  "With the exception of influenza vaccine and PPSV23, providers should only accept written, dated
  records as evidence of vaccination" and "If records cannot be located within a reasonable time,
  these persons should be considered susceptible and started on the age-appropriate vaccination
  schedule." The app counts an undated dose. Biggest effect found: asplenia, age 20, Menveo with no
  date plus Menveo 2026-01-10 → primary series complete, booster 2031-01-10. Without the undated
  dose: "Dose 2 of 2" due today. AAP's Red Book was not read (not freely available).

## Already on the STOP C Q2 list from 2.2 — CDSI confirms each

- **Any two MenACWY doses under 4 weeks** (R-4a): CDSI's smallest MenACWY gap anywhere is 8 weeks
  less 4 days. It has no 4-week rule.
- **Travel / microbiologist / outbreak boosters**: CDSI floors them at 3 and 5 years; the record
  checks none. (CDSI's one-dose series also gives these boosters to college students and military
  recruits from 19.)
- **High-risk MenB dose 3, 6 months from dose 1** (R-4b): CDSI's floor is 0 days (advice only);
  the app voids the dose.
- **High-risk MenB early dose 3**: CDSI still counts it, with no extra dose, if it is at least 6
  months less 4 days after dose 1 (ACIP 2024's "unless"); the app has no "unless".
- **Healthy MenB dose 2, lowest gap** (R-4c): CDSI's 3-dose series needs 4 weeks less 4 days, for
  **both** brands. *Correction:* the 2.2 note said Trumenba 4 months; that is CDSI's 2-dose series
  only. The note in `doseRules.js` is corrected.

## Labelled owner-decided — please confirm

These follow from the owner's MenQuadfi-from-6-weeks decision (2026-09-23). Labelled so; say if
either should be a question instead.

- **An unknown-brand MenACWY counts from 6 weeks** (it might have been MenQuadfi). CDSI's
  "unspecified" codes start at 2 months less 4 days.
- **A MenQuadfi dose 1 at 6–7 weeks counts.** CDSI 4.65 lists the product from 6 weeks, but its
  infant series still starts at 2 months less 4 days, so CDSI would not count it. *Correction:*
  `scripts/cdsi/README.md` said CDSI "now agrees" with the 6-week rule. True for the product,
  not the series. Fixed.

Other owner-decided differences (already ruled): the age-10 MenACWY line has the 4-day grace in
the app and not in CDSI (B-1, 2026-11-15); a healthy MenB dose before 16 is set aside (CDSI counts
from 10; 2026-07-23, Option 1).

## Follows the wording (settled)

- Menveo one-vial (liquid) not before 10 years: CDSI has one code for Menveo and allows any from
  2 months; CDC's notes say the liquid form is not for use before 10.
- Healthy MenB rescue dose 3: CDSI also counts it under 4 months after dose 2 if at least 6 months
  after dose 1; ACIP states "≥4 months after the second dose" with no such exception.

## Not compared (honest limits)

- **Which series a patient is put on**, and **how many doses a series has** (CDSI's "skip"
  rules). Those are the engine's risk logic and `seriesTotals.js`, compared patient by patient by
  CDC's test patients, not by this. The ages the skips hinge on *are* compared. N2 was found by
  reading one skip rule and checking one patient; the others were not each checked that way.
- **Rules for doses before CDC changed them** (2017, 2024). The app applies today's rule to old
  doses.
- **CDSI's preferred products**, recommended ages, and the MenHibrix-only series (the app has no
  entry for MenHibrix or Menomune).
