# Owner decisions MQ6-e and MQ6-f — after a 6-week MenQuadfi dose; the infant 8-week gap (2026-11-21)

Follow-ons to MQ6 (`decisions-2026-11-21-menquadfi-from-6-weeks.md`), found while checking it.

## Sources (read 2026-11-21)

AAP 2026 schedule, the owner's copy `~/Downloads/AAP-Immunization-Schedule.pdf` ("Recommended Child
and Adolescent Immunization Schedule for Ages 18 Years or Younger, United States, 2026"; AAP's
website blocks automated reading):
- MenACWY notes, high-risk and travel: "Dose 1 at age 2 months: 4-dose series (additional 3 doses at
  age 4, 6, and 12 months). The first dose of MenQuadfi may be given as early as 6 weeks."
- Table 2 (catch-up), "Children age 4 months through 6 years", Meningococcal ACWY: minimum age for
  dose 1 "2 months MenACWY-CRM, 6 weeks MenACWY-TT"; dose 1 to dose 2 "8 weeks".

Owner STOP F1 Q9b (2026-11-17, `decisions-2026-11-17-open-questions.md`): infant MenACWY doses 2–3
are advised at the routine ages with the 8-week minimum stated beside them.

## Answers

| # | Question | Answer |
|---|---|---|
| MQ6-e | Asplenia, born Oct 3, 2026, MenQuadfi Nov 14 (6 weeks), seen Nov 21 (7 weeks). The card read "Not needed" / "Dose 1 given; next dose not yet due", no date. From Dec 3 (2 months) the same baby already got "Next dose not yet due", Dose 2, "Next dose due Feb 3, 2027", earliest valid Jan 9. What should the card say from 6 weeks to 2 months? | **"Same as at 2 months."** Travel and outbreak babies the same. |
| MQ6-f | Every high-risk infant: between the 8-week minimum and the routine date (e.g. Jan 9 to Feb 2 for the baby above), the badge read "Next dose not yet due" while the note said "It can be given today if needed, as the minimum interval of 8 weeks has passed." MenB dose 2 in its gap reads "Can be given today". Match MenB? | **"Match MenB."** Badge "Can be given today"; "Next dose due Feb 3, 2027" stays. Measure the moved answers and report before building. |

## Built

- **MQ6-e** (2026-11-21): `recommend.js` `menacwyInfantSeries`: a baby under 2 months with a counted
  dose no longer stops at the under-2-months gate; it goes on to the series continuation, the card it
  gets from 2 months. The old card's package-insert citation went with its licence sentence; the
  6-week dose's own source (WA DOH) stays with its rule in `doseRules.js`. Saved answers: 0 of 18,780
  moved. Wording: 0 of 24,600 patients (the saved grid has no baby in this window). Test:
  `regression-2026-11-21-menquadfi-6-week-dose-gives-dose-2-date.test.js`; screen:
  `menquadfi-6-week-floor-ui.test.jsx`.
- **MQ6-f**: see below once built.
