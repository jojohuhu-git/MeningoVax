# Item 6: a high-risk MenB card says why a short or early series still counts (2026-11-22)

Owner picked item 6 from the handoff queue on 2026-11-22 ("Item 6: cite counted MenB doses").

## The problem

A high-risk MenB patient whose series ends in an unusual way gets a "First booster" card that says
only "A MenB booster, 1 year after the primary series was completed". Nothing on the card says why
the series is finished, so nothing cites the sentence it rests on. The Rulebook's three rows for
these cases ("No dose 3 is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was
early … Counts" rows) take their sources from their worked patients' cards, so they showed only
booster sentences. (Deferred from C11, `report-2026-11-21-c11-dose-line-citations.md`.)

Cases (the counts are the built cards over 42,301 test patients: saved answers, record problems,
typical patients; the first estimate put to the owner, 1,440 and 280, missed combined shots):
- **Case A**, dose 2 ≥6 months after dose 1, no dose 3: **1,764** cards, of which **252** reach
  6 months only through the 4-day grace.
- **Case B**, dose 3 under 4 months after dose 2 but ≥6 months after dose 1 (ACIP's "unless"):
  **28** cards, all within the grace and all with a combined shot in the record.
- **Case C**, dose 3 ≥4 months after dose 2 but under 6 months after dose 1 (owner C5): 0.

## Sources (read live 2026-11-22 in a browser)

- ACIP Oct 2024, mm7349a3: "a third dose is not needed if the second dose was administered ≥6
  months after the first dose" (the sentence covers the 3-dose series "for persons aged ≥10 years
  at increased risk", both MenB-4C and MenB-FHbp). New `refs.js` key
  `menbHighRiskD2SixMonthsNoD3Acip2024`.
- ACIP Oct 2024, mm7349a3 (already on file, `menbHighRiskEarlyD3Unless`): "If the third dose is
  administered <4 months after the second dose, the dose should be repeated ≥4 months after the
  last dose, unless the third dose was administered ≥6 months after the first dose".
- CDC Adult Notes (checked, not cited): "if dose 2 was administered at least 6 months after dose 1,
  dose 3 not needed" (the same words as the child notes' `cdcChildMenbHighRiskD2SixMonthsNoD3`).

## Owner answers

1. **Case A: "Add line, cite ACIP"** (over citing CDC's child and adult notes by age, or no line).
   The card's "Why this" opens with "Dose 3 is not needed: dose 2 was given at least 6 months after
   dose 1 [n]." citing ACIP Oct 2024's sentence.
2. **Case B: "Add line, cite ACIP"**. "Dose 3 counts: it was given at least 6 months after dose 1
   [n]." citing `menbHighRiskEarlyD3Unless`.
3. **Case C: "Add line, cite ACIP"** (my recommendation was to leave it, since no sentence states
   it directly). "Dose 3 counts: it was given at least 4 months after dose 2 [n]." citing
   `menbHighRiskEarlyD3Unless`, which says a dose 3 under 4 months is repeated; that a dose at 4
   months counts is read from it, not quoted. The rule's basis stays owner C5.
4. **Grace days: "Name the grace"**. When the dose reached its line only through the 4-day grace
   (C7, D3, D4), the line says "6 months after dose 1, within the 4-day grace period" (or "4 months
   after dose 2, …") instead of "at least".

No dose label, date, verdict or booster changes. The line is on the first-booster card only.

## Built 2026-11-22

- `menbHighRiskSeriesShortcut()` in `seriesTotals.js` (beside `menbSeriesInfo`) says which line a
  finished series met and whether the grace was needed. It decides no verdict.
- `recommend.js`, the high-risk first-booster card: the line comes before "A MenB booster, 1 year
  after the primary series was completed", so it opens "Why this", and its source number is first.
- **0 answers moved** (saved-answers sweep unchanged). Wording: 392 of 24,600 saved patients, each
  exactly one new sentence and nothing else once hovers, source numbers and button labels are
  stripped (112 case A "at least", 252 case A within the grace, 28 case B within the grace). Uncited buttons: 0 of 35,056 cards.
- Guard: `regression-2026-11-22-counted-menb-doses-say-why.test.js` (11 checks; 9 failed before
  the change, the two "no line" controls passed).
- Rulebook: the three rules in §2 name the card line and `owner:item6`; the dose-2-at-6-months rule
  also cites ACIP's sentence.
