# Owner decisions MQ6-e to MQ6-h — after a 6-week MenQuadfi dose; the gap between a minimum and a routine date (2026-11-21)

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
| MQ6-f (first ask) | Every high-risk infant: between the 8-week minimum and the routine date, the badge read "Next dose not yet due" while the note said "It can be given today if needed". MenB dose 2 in its gap reads "Can be given today". Match MenB? | **"Match MenB."** Then, shown the screens: *"This is a grey area (same for menB) where if the standard schedule can be followed it should be. Here that would mean dose 2 at 4 months, but if it was given 8 weeks after dose 1 it wouldn't be considered invalid. How should this be revised for both menACWY and menB."* Not built as first asked. |
| MQ6-f | Recommended, citing CDC Timing and Spacing (shorter intervals "might be necessary in certain circumstances, such as impending international travel or when a person is behind schedule") and PneumoVax (no "today" badge in the gap): for both vaccines, badge "Next dose not yet due", "Next dose due <routine date>", the note keeps "It can be given today if needed, as the minimum interval of … has passed." MenB changes: dose 2 in its gap, a repeated dose 3 before its advised date, and the summary line drops "MenB dose 2 can be given today." | **"Yes, both match."** Reverses the owner's 2026-11-18 gap badge and the morning's MQ6-d line. |
| MQ6-g | MQ6 this morning: a high-risk baby of 6 weeks to under 2 months with no MenACWY reads "Can be given today" (MenQuadfi only). AAP: "The first dose of MenQuadfi may be given as early as 6 weeks." Keep it, or apply the principle? Then: drop the summary line's "MenQuadfi can be given today." (MQ6-c) too? | **"Apply the principle"**: badge "Next dose not yet due", dose 1 due at 2 months, the note says MenQuadfi may be given from 6 weeks. **"Drop it too."** Brands on that card are unchanged (MenQuadfi only); not asked. |
| MQ6-h | The combined shot (Penmenvy/Penbraya) when MenACWY is due today and MenB is not yet due. Measured: MenB dose 2 at most 3 days early (Bexsero Nov 3 → offered Dec 1–2, routine Dec 3; Jul 3 → Jul 31–Aug 2; a dose 1 on Jan 31, Feb 1 or Feb 3 → 0 days). The same switch also opened it for a repeated dose 3, never asked (Bexsero Jun 1, Jul 1, Jul 15 → offered from Nov 15, advised Dec 1: 16 days early). | **"Dose 2 only."** A repeated dose 3 waits for its advised date. |

## Built

- **MQ6-e** (2026-11-21): `recommend.js` `menacwyInfantSeries`: a baby under 2 months with a counted
  dose no longer stops at the under-2-months gate; it goes on to the series continuation, the card it
  gets from 2 months. The old card's package-insert citation went with its licence sentence; the
  6-week dose's own source (WA DOH) stays with its rule in `doseRules.js`. Saved answers: 0 of 18,780
  moved. Wording: 0 of 24,600 patients (the saved grid has no baby in this window). Test:
  `regression-2026-11-21-menquadfi-6-week-dose-gives-dose-2-date.test.js`; screen:
  `menquadfi-6-week-floor-ui.test.jsx`.
- **MQ6-f, MQ6-g, MQ6-h** (2026-11-21, one commit, one flag): `RecCard.jsx` no longer has a
  "Can be given today" badge (between a minimum and a routine date the card reads "Next dose not yet
  due"). `Results.jsx` drops the two summary sentences ("MenQuadfi can be given today.", "MenB dose 2
  can be given today."). `recommend.js`: the MQ6 card and the repeated MenB dose 3 no longer carry
  `canGiveToday`; MenB dose 2 keeps it, read only by the combined-shot offer (F2a). Saved answers: 0
  of 18,780 moved; wording: 0 of 24,600 (the saved grids have no patient on a gap day). Covered by
  `sweep-never-events.test.js` property 14 (widened: no "Can be given today" badge anywhere, the flag
  on MenB dose 2 only, and a walk of repeated-dose-3 histories that fails 20 times with the old
  flag). Tests that pinned the old answers were changed to the new ones;
  `regression-2026-11-21-summary-line-names-menb-dose-2.test.jsx` became
  `regression-2026-11-21-summary-line-no-can-be-given-sentence.test.jsx`.
