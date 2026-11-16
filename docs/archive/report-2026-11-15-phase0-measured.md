# MeningoVax port, Phase 0 — measured, nothing changed (2026-11-15)

**Status: Phase 0 done. No app code was changed.** The plan lives in PneumoVax
(`~/Downloads/PneumoVax/docs/archive/plan-2026-11-08-meningovax-port.md`). The owner approved
the phase order (**Q0**) on 2026-11-15 ("Yes, start Phase 0"), so STOP A is already passed.
Next comes **Phase 1 (safety nets)**. The companion file is
`inventory-2026-11-15-every-place-a-dose-is-judged.md` (item 0.4).

| Item | State |
|---|---|
| 0.1 pointer file | Done earlier (PR #74, open) |
| 0.2 baseline | **1,636 passing, 0 failed, 0 skipped, 136 files** (vitest JSON reporter, `.claude/**` excluded), the same count as 2026-11-08 |
| 0.3 every "to measure" cell | Done, below |
| 0.4 every place a dose is judged | Done: 14 not-counted rules, 6 not-counted-but-no-repeat rules, 2 counts-early rules, 3 record problems, the extra-dose cap. See the inventory file |
| 0.5 sources read live | Done, 2026-11-15, in the built-in browser (CDC refuses plain downloads). Quotes are beside each rule in the inventory and below |

## How it was measured

- **Code**: `validate.js`, `intervals.js`, `recommend.js`, `RecCard.jsx`, `Results.jsx`,
  `doseChipLabel.js` and `App.css` were read in full. Line numbers are on the branch
  `docs/2026-11-15-phase-0-measure`.
- **The grid**: a read-only script (kept in the session scratchpad, not committed) ran the
  real engine over the shared test grid (`src/test-grid.js`: every 3 months of age to 120 years
  plus the edge birthdays × no risk and each of the 12 risk boxes × 13 histories: none, 1–3
  well-spaced doses, 1–3 doses a month apart, for each vaccine). That came to **70,642
  patients, 141,284 cards, 126,995 recorded-dose rows**. Limits: one MenACWY brand (Menveo
  2-vial), one MenB brand (Bexsero), no pentavalent, no mixed histories.
- **Worked patients**: eleven hand-built patients (P1–P11 below) run through the engine. P5's
  card was also checked on screen in the running app (dev server, port 5175).

## Worked patients

| # | Patient | What the app says | Why it matters |
|---|---|---|---|
| P1 | 20-year-old, asplenia; Menveo 8/1 and 8/22/2026; today 9/1 | Dose 2 marked Invalid; next dose **eligible Sep 26** (8 weeks after 8/1) | **R-2 confirmed.** ACIP: the repeat is spaced from the invalid dose, so Oct 17 (8 weeks after 8/22) |
| P2 | 21-year-old, travel; MenACWY 1/10/2025, then 6/10/2025 | The second dose is counted, chip **"Booster"**; next booster 6/10/2030 | The card would have said 5 years. The validator checks only 4 weeks for travel, microbiologist and outbreak boosters. CDSI's floor is 3 years − 4 days |
| P3 | Healthy; dose 1 at 15y 11m (7/20/2026); today 8/25, just 16 | Card: **"Booster (16y)", due today**, 5 weeks after dose 1. Given that day, it counts and the card reads Complete | ACIP: *"as long as a minimum interval of 8 weeks between doses is maintained"*. Both the card and the validator miss it (R-4a, wider than planned: the **card** advises it too) |
| P4 | 20-year-old, asplenia; Bexsero 1/10, 2/10, 6/15/2026 | Dose 3 **Invalid** (5 months from dose 1), "repeat this dose only" | R-4b confirmed. 4 months 5 days after dose 2. CDSI's preferable floor from dose 1 is 0 days |
| P5 | 5-year-old, A/C/W/Y outbreak; Menveo 12/1/2025 | **"Complete for this outbreak"** with **"Next dose not yet due - eligible Dec 1, 2028"** under it (seen on screen) | A6: a date for a dose no card asks for. It comes only if a new outbreak happens |
| P6 | Healthy 12-year-old; MenACWY at age 9 | Chip **"Off-window - repeat"**; card asks for dose 1 | R-5b confirmed: the rulebook says "no repeat needed" |
| P7 | 17-year-old, asplenia; Bexsero 1/10, then **Penbraya** 3/10/2026 | MenB: Penbraya Invalid (wrong family). MenACWY: **the same Penbraya counts as dose 1 of 2** | R-8 measured: a pentavalent rejected for one part still counts for the other |
| P8 | Healthy 15-year-old, nothing on record | **"Dose 1 (routine, 11–12y)"**, status `due` | B4/B5: CDC calls 13–15 catch-up; the label names an age already passed |
| P9 | Healthy 17-year-old; Bexsero, then Bexsero **7 days** later | Dose 2 **counts** ("accepted (not invalid)"); rescue dose 3 owed | R-4c: no lower limit at all on healthy MenB dose 2. CDSI Bexsero 2-dose has a 4 weeks − 4 days row; Trumenba 4 months − 4 days |
| P10 | 17-year-old, asplenia; **Penmenvy** 7/1/2026; today 9/1 | Both due; the pentavalent card offers **Penmenvy** again (2 months later). Same patient with Penbraya: not offered (6-month rule) | **New finding N1** below |
| P11 | 6-month-old, military or college box ticked, nothing on record | Card: "1 dose", due today. A dose given that day is **not counted** (before age 10) | E5: the card asks for a dose the validator then sets aside. All 46 such patients also show the "check the age" note |

## Things found that the plan did not list (listed, not fixed)

Phase 1.4 lists findings, it does not fix them. These need the owner, so they are written down
here so nothing is lost. Each has a patient above.

| # | Finding | Evidence | Who decides |
|---|---|---|---|
| **N1** | The app offers **Penmenvy again within 6 months** of a Penmenvy dose (P10). The code limits only Penbraya, and its comment says CDC *"says nothing of the kind about Penmenvy"* — true of the CDC notes page, which never names Penmenvy. **But the Penmenvy MMWR (mm7501a2, published Jan 8, 2026) says it:** *"Persons at increased risk for meningococcal disease who receive a dose of MenACWY-CRM/MenB-4C and who are recommended to receive additional doses of MenACWY and MenB <6 months after a dose of pentavalent meningococcal vaccine should receive separate MenACWY and MenB-4C vaccines, rather than MenACWY-CRM/MenB-4C"* | `recommend.js:1883–1904`; mm7501a2 read live | Owner. A clinical rule change. It changes the brand offered, not the dose count |
| **N2** | High-risk MenB dose 3 given < 4 months after dose 2 always adds a 4th dose. mm7349a3 (Oct 2024) adds *"unless the third dose was administered ≥6 months after the first dose"*; the CDC notes (July 2025) do not carry the "unless". Following the MMWR would mean **fewer doses** for some patients, which the authority rule only allows where AAP agrees | `validate.js:958`, `seriesTotals.js` | Owner, packet 1 (Q2). AAP not yet read for this |
| **N3** | Healthy MenB dose 2 has **no lower limit** (P9) | `validate.js:1042` | Owner, packet 1 (Q2, was R-4c "not yet read") |
| **N4** | Travel, microbiologist and outbreak **boosters have no gap check** beyond 4 weeks (P2) | `validate.js:593, 690` (`riskClass` = medical high risk only) | Owner, packet 1 (booster floors) |
| **N5** | The routine **16-year booster card has no interval at all**: it is due today 5 weeks after dose 1 (P3) | `recommend.js:1308–1324` (no `earliestNextDate`) | Owner, packet 1 (R-4a). The card advises a dose the sources call too soon |
| N6 | "Complete for this outbreak" prints a next-dose date (P5) | `recommend.js:709–712`, `RecCard.jsx:470` | Phase 5 (A6, B3) |
| N7 | The status pill reads **"Up to date"** while a dose is still owed later: **19,347** grid cards (high-risk dose 2 waiting 8 weeks, boosters, …) | `RecCard.jsx:60` | Phase 5 (B3) |
| N8 | "Dose 1 (routine, 11–12y)" for patients 13–15: **273** grid cards (P8) | `recommend.js:1257` | Phase 5 (B4/B5) |
| N9 | Card asks for a dose the validator then sets aside: **361** grid cases. The 46 with nothing on record are all the military or college box under 10 (P11); the rest were not broken down | `recommend.js:780`; `validate.js:543` | Phase 1.4 check 1 |
| N10 | Record-problem chips are **red** (they carry status `invalid`), not grey | `doseChipLabel.js:doseChipClass` | Phase 4 (A2) |
| N11 | An infant-series dose that is too soon prints two repeat sentences: *"This dose does not count; repeat it."* and the walk's *"repeat this dose only (do not restart the series)"* | `validate.js:651` + `:1138` | Phase 6 (wording) |
| N12 | MenB high-risk boosters are counted in days (365 / 731), every other gap on the calendar. With the grace no verdict differs; noted only | `validate.js:199–200` | Phase 2 (one reading per rule) |

## Table A — the label and line beside a recorded dose (measured)

| # | MeningoVax now (measured 2026-11-15) |
|---|---|
| A2 | Green = counted ("Dose N of M", "Booster"). **Amber** = extra **and** not-counted-before-10/16 (same class, `dose-val-offwindow`). Red = invalid **and record problems** (N10). Grey = undated "Unknown". Dashed grey = Needs input |
| A3 | Every invalid dose (10,139 grid rows) says "repeat this dose only (do not restart the series)". No dose says "do not repeat" |
| A5 | No dose line gives a next-dose date. The two count-early notes say "≥4 months after this dose" with no date |
| A6 | Dose lines promise nothing. **One card does** (N6) |
| A7 | Invalid reasons give both numbers ("Given only ~3 weeks after the previous dose. Minimum interval is 8 weeks") but not the shortfall itself |
| A10 | Age rejections name the product's floor ("below the minimum age of 10 years for Bexsero") and give no remedy. A family rejection names the family to use ("give the correct dose in the 4C family"), not a product |
| A11 | Not present: a thrown-out dose never points to its repeat |
| A12 | An unbranded record prints "brand unknown" on the dose row. One reason says "below the minimum age … for **this brand**" when the brand is unknown (`validate.js:482`) |
| A13 | Met: the card's dates use the real minimum, never the grace (`intervals.js:344–349`, and every `recommend.js` date uses `intervalElapsed` / `calendarIntervalElapsed`) |
| A14 | Not present: no sentence says a dose "met" a minimum |
| A15 | "Extra" only means past the series total on a schedule without boosters (`validate.js:1164`); 10,403 grid rows. Not the "card on that day" test |
| A16 | Counts early, with a note: healthy MenB dose 2 (B13) and high-risk MenB dose 3 (B9). Every other early dose: not counted, repeat |
| A17 | Not present: an invalid dose carries no dates at all |
| A18 | **Yes**: every minimum-age test uses the grace (`ageMeetsMinimum` / `ageMeetsMinimumDays`; e.g. `validate.js:479, 543, 760, 831, 846`) |

Not-measured A rows were already measured in the plan (A1, A4, A8, A9).

## Table B — the recommendation card (measured)

| # | MeningoVax now |
|---|---|
| B1 | "Next dose not yet due - eligible <date>" (`RecCard.jsx:472`) and "Booster not yet due - <date>" (`:466`) |
| B3 | Two different problems: **"Up to date"** while a dose is still owed (N7, 19,347 cards), and a **Complete** card with a next date (N6, 2,867 cards). "Booster due at 16y" cards are status `complete` but their pill says "Future booster needed" |
| B4 | "Catch-up" only for a first dose at 16–21 without a dose at 16 or older (588 grid cards). A 13–15-year-old with nothing on record is "due", "routine, 11–12y" (N8) |
| B5 | The same 273 cards name an age already passed. No card says "overdue" |
| B6 | No ISO date reaches any card or dose line on the grid (0 found). Dates go through `fmtDate` |
| B7 | No card states an interval in days. Dose lines do (`fmtDays`: "7 days", and "~3 weeks"); **26,516** dose-line rows contain "~" |
| B12 | The pentavalent card appears only when both vaccines are due **today** (`recommend.js:1910`), so no "today beside years away". It uses "Option 1 / Option 2", not "Choose ONE option" |
| B13 | 0 grid cards say "now" or "today" under a future date |
| B14 | First-dose cards describe the series' own gaps ("Two MenACWY doses, at least 8 weeks apart"). None measures from a missing dose. Whether that meets PneumoVax's P2-10 is a Phase 6 wording question |
| B15 | Not applicable yet: sources sit outside "Why this" (C8 not done) |
| B16 | One mismatch read in code: the 16–18 booster card says *"The dose given at 11–12 years is the first dose"* even when that dose was given at 10 or 13–15 (`recommend.js:1322`). Not counted on the grid |
| B17 | Every later-age line is hand-written ("Boosters: 1 more - at age 16", the booster cadence lines), except the 16th-birthday date, which is computed (`recommend.js:1799`) |
| B18 | At 375 px wide, the outbreak patient P5's page has no sideways scroll (`scrollWidth` 375). One patient only, not a sweep |

## Tables C, D, E (measured)

| # | MeningoVax now |
|---|---|
| C9 | 14 of the 37 sources link with `#:~:text=`. Whether a link opens a closed CDC section was not checked (Phase 8) |
| C12 | Hover shows the document **and the quote** where one exists (`refs.js:513` `citeTitle`); 21 sources carry a quote. No click pop-up |
| R-10 correction | **37** source entries, not 38 |
| D1 | Unchanged: `meningococcal-rules-summary.md` only |
| E1, E2 | Confirmed absent: `scripts/` holds only `cdsi/` and `check-root-notes.sh` |
| E3 | Three sweeps exist (`sweep-dose-counter`, `sweep-never-events`, `sweep-two-run-relations`); none of the seven whole-app checks |
| E5 | **Not one reading everywhere.** The numbers come from `intervals.js`, but three rules are advised one way and graded another: travel, microbiologist and outbreak boosters (card 3/5 years, validator 4 weeks: N4); the 16-year booster (card nothing, validator 4 weeks: N5); military/college under 10 (N9) |
| E7 | `rule-docs-match-code.test.js`: 27 checks, each reading a number or verdict from the code and requiring a sentence in one of the two rule documents. Not a table compared cell by cell |

## "Rules every patient gets" (plan §3), measured

| Rule | MeningoVax now |
|---|---|
| A dose given too soon is measured from itself | **No**, confirmed (P1) |
| A dose that did not count never resets another vaccine's clock | **It does**: P7's rejected Penbraya counts for MenACWY. ACIP's pentavalent MMWRs judge each part on its own (*"can be considered valid for MenACWY or MenB if the timing would otherwise have been valid for that component"*), so this may well be right. It is Q3 |
| The grace decides what is accepted, never what is advised | Yes (A13) |
| The grace applies to minimum ages | **Yes, in code** (A18) |
| Routine date advised, minimum beside it | Minimum only (B2, unchanged) |
| "Extra" = not asked for that day | No (A15) |
| An early dose with no source saying repeat counts with a note | MenB dose 2 and dose 3 only (A16) |
| A record problem gets neither a repeat nor a next-dose sentence | Yes (`validate.js:1133`) |
| Complete only when nothing more is owed | No (N6, N7) |
| A later-age line is the app's own answer run forward | No (B17) |

## Sources read live, 2026-11-15

| Source | Date on the page | Key sentences for packet 1 |
|---|---|---|
| CDC child/adolescent schedule notes, meningococcal | Updated July 1, 2025; reviewed July 2, 2025 | 13–15 catch-up *"(minimum interval: 8 weeks)"*; the infant series wording; the MenB rescue rules; Penbraya 6 months; MenQuadfi minimum age still *"2 years"* (the app's 6 weeks is the owner's 2026-09-23 AAP decision); **Penmenvy not mentioned** |
| CDC adult schedule notes, meningococcal | Updated and reviewed July 2, 2025 | Medical high risk: *"1 booster dose 5 years after primary series and every 5 years if risk remains"*; MenB booster *"one year after primary series and every 2–3 years if risk remains"* |
| ACIP 2020, MMWR RR-9 (rr6909a1) | Sep 25, 2020 | The 8-week booster minimum; *"For situations in which a MenB dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses"* (MenB only); boosters under 4 years *"not licensed … off-label"*; the Table 4–9 booster rows |
| ACIP Oct 2024 MenB (mm7349a3) | title: "October 2024" (issue date not recorded) | Bexsero moved from *"0 and ≥1 month"* to *"0 and 6 months"*; the dose-3 *"unless … ≥6 months after the first dose"* (N2) |
| ACIP Penbraya (mm7315a4) | Apr 18, 2024 | Each part judged on its own (Q3); a pentavalent used *"inadvertently … can be considered valid if it would otherwise have been a valid dose"*; 6 months between Penbraya doses |
| ACIP Penmenvy (mm7501a2) | Jan 8, 2026 | The same component rule; **the 6-month rule for Penmenvy** (N1) |
| CDC Timing and Spacing | Updated July 24, 2024; reviewed Aug 1, 2023 | *"The repeat dose should be spaced after the invalid dose by the recommended minimum interval"* (R-2); the 4-day grace; Table 3-2 MenACWY dose 1 → next minimum **8 weeks**; MenB *"Bexsero: 4 weeks"* (the pre-2024 schedule) |

Not read: AAP (Red Book) — needed before N2 and the booster floors are put to the owner, per
the authority rule.

## Next

1. **Phase 1** (safety nets), the next session: saved-answer files, the prose diff, the
   typical-patient list, the whole-app checks, and CDC's test patients (1.5). STOP B after it.
2. **Owner, when convenient**: should **N1** (Penmenvy within 6 months) or **N5** (the 16-year
   booster 5 weeks after dose 1) be fixed now, ahead of the port? Both are cards advising
   something a current CDC source advises against. The plan's default is to hold every
   clinical change for packet 1 (STOP C).
3. The monthly source check still points at the old `scripts/cdsiCompare.mjs` path (first run
   Dec 1). That needs the owner's yes.
