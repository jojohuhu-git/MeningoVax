# STOP G1 packet — Phase 6.1 wording (prepared and ANSWERED 2026-11-18; not yet built)

Plan: `plan-2026-11-08-meningovax-port.md`, Phase 6.1: *"Show her five before/after lines and five
'Why this' paragraphs (the most-seen), as in PneumoVax; she approves the style rules for
MeningoVax."* Also asked here, by the owner's choice of 2026-11-18: F-3, F-5, and the "repeat"
line under a card with no date.

**Nothing in the app has changed.** Every count below was measured on `main` (`9331624`) over the
18,780 real patients of the saved-answer grid (today = Sep 15, 2026), from the rendered screen.
Scratch scripts, not committed: `inventory.mjs`, `phase6q.mjs`, `show.mjs`. Before building any
answer, the change will be prototyped and measured (saved answers, prose diff, card-change count).

## 1. The style rules (PneumoVax §M-L3, owner-approved there 2026-11-08)

PneumoVax's ten rules, which the owner approved there as rules rather than sentence by sentence:

1. The line is short: the label plus one reason. The rest goes under "Why this".
2. Answer first, then the reason.
3. Talk about the patient, not the document.
4. One idea per sentence. No semicolons, and at most one dash per sentence.
5. No arguing or defending ("which does not change the answer", "either way").
6. The line does not repeat the label.
7. The same situation gets the same words everywhere.
8. Plain clinical terms and US spelling ("about", not "~").
9. Next-dose wording names the earliest date. (MeningoVax's F-4 already says "Repeat from <date>.")
10. Bold only the decision.

**How far MeningoVax is from them today (measured):**

| | Kinds | Median words | Longest | "~" | Semicolon | 2+ dashes in a sentence | Over 44 words |
|---|---|---|---|---|---|---|---|
| Line next to a dose | 108 | 44 | 79 | 83 kinds, 26,586 showings | 4 / 44 | 2 / 336 | 45 / 9,889 |
| Card lead (in view) | 64 | 14 | 35 | 0 | 4 / 2,264 | 1 / 336 | 0 |
| "Why this" | 72 | 27 | 72 | 0 | 2 / 3,459 | 5 / 3,444 | 2 / 1,772 |

**One design difference (rule 1):** in PneumoVax a recorded dose has its own "Why this" fold-out
(owner request 2026-10-24, modelled on MeningoVax's card fold-out). In MeningoVax the line beside a
dose prints everything, including the "Age at administration … Minimum …" detail. Rule 1 needs that
fold-out here too.

### Five dose lines, most-seen first (before → after)

Wording only: every claim, source number, date and verdict stays. "After" assumes a dose-line
"Why this" (item 1b).

**L1. Healthy 11-year-old, Bexsero at 10** (chip "Not counted — given before age 16"; 2,429 patients)
- Before: *"Given before age 16 (~10 years): does not count toward the healthy 2-dose MenB series,
  which is recommended at 16–23 years. [1] MenB antibody protection wanes within about a year, so a
  dose given before 16 is not counted for a patient without a high-risk indication."* (51 words)
- After: *"Given at about 10 years. The healthy 2-dose MenB series is given at 16–23 years by shared
  clinical decision-making. [1]"* Why this: *"MenB antibody protection wanes within about a year,
  so a dose before 16 does not count without a high-risk indication."*
- Rules 1, 6, 8. **Also a correction:** "recommended at 16–23" does not match the line's own quote
  (ACIP 2020: *"MenB series at age 16–23 yrs on basis of shared clinical decision-making (preferred
  age 16–18 yrs)"*).

**L2. 11-year-old with complement deficiency, Bexsero at 10** (chip "Needs input"; 2,429 patients;
the MenACWY version, 1,168 patients, gets the same words by rule 7)
- Before: *"Given at ~10 years, before age 16. Whether this dose counts toward the high-risk MenB
  series depends on whether the patient was already high-risk on that date — not recorded."*
- After: *"Given at about 10 years, before age 16. Whether it counts toward the high-risk MenB series
  depends on the patient's risk on that date."* (The question with Yes / No / Not sure sits right
  below it, so "not recorded" is dropped.)
- Rules 4, 5, 8.

**L3. 10-year-old with complement deficiency, Bexsero at 9** (chip "Not counted — repeat"; this
too-young MenB line is the most common family: 17 variants, 3,990 patients)
- Before: *"Given at ~9 years, below the minimum age of 10 years (120 months) for Bexsero. MenB
  vaccines (Bexsero, Trumenba, Penbraya, Penmenvy) are licensed from age 10 years for all products.
  [1] This dose does not count toward the series: repeat this dose only (do not restart the
  series). Repeat from Sep 15, 2026. Age at administration: ~9 years. Minimum: 10 years (120
  months)."* (58 words)
- After: *"Given at about 9 years — below the 10-year minimum age for Bexsero. [1] Repeat from Sep 15,
  2026."* Why this: *"MenB vaccines (Bexsero, Trumenba, Penbraya, Penmenvy) are licensed from age 10
  years. Age at administration: about 9 years. Minimum: 10 years (120 months)."*
- Rules 1, 6, 8. Same words as PneumoVax's too-young line (*"Given at about 5 weeks — below the
  6-week minimum age for PCV15."*), rule 7 across the apps.

**L4. Healthy 7-month-old, MenQuadfi at 5 months** (chip "Not counted — given before age 10";
1,752 patients)
- Before: *"Given before age 10 (~5 months): does not count toward the adolescent MenACWY series. [1]"*
- After: *"Given at about 5 months. The adolescent series still starts at 11–12 years. [1]"*
- Rules 6, 8. The new sentence is the line's own quote (ACIP 2020: *"…should still receive MenACWY
  according to the recommended adolescent schedule, with the first dose at age 11–12 years…"*).

**L5. Healthy 19-year-old, Trumenba 4 months apart** (chip "Dose 2 of 3"; 744 patients)
- Before: *"Dose 2 was given ~4 months after dose 1, less than the 6-month standard interval. Dose is
  accepted (not invalid), but a third rescue dose ≥4 months after this dose is now required to
  complete the series."* (39 words)
- After: *"Given about 4 months after dose 1, under the 6-month interval. A third dose is needed, at
  least 4 months after this one."*
- Rules 5, 6 (the chip already says it counts), 7 (the card's lead says *"A third dose is needed,
  at least 4 months after dose 2"*), 8. "Rescue" is dropped as jargon.

### Five "Why this" paragraphs, most-seen first (before → after)

**W1. High-risk MenB card** (4,340 patients)
- Before: *"Pick one antigen family and stay in it: MenB-4C (Bexsero, Penmenvy) and MenB-FHbp
  (Trumenba, Penbraya) are not interchangeable."*
- After: *"Use one antigen family for every dose. MenB-4C (Bexsero, Penmenvy) and MenB-FHbp
  (Trumenba, Penbraya) are not interchangeable."* (Rules 2, 4. Little to change.)

**W2. Pentavalent card** (3,039 patients)
- Before: *"The two pentavalents are not interchangeable across the rest of the MenB series: Penmenvy
  is MenB-4C, so continue with Bexsero or Penmenvy; Penbraya is MenB-FHbp, so continue with
  Trumenba or Penbraya."*
- After: *"After Penmenvy, continue MenB with Bexsero or Penmenvy (both MenB-4C). After Penbraya,
  continue with Trumenba or Penbraya (both MenB-FHbp)."* (Rules 2, 4: two semicolons gone.)

**W3. High-risk MenACWY dose 2** (2,840 patients)
- Before: *"That is a minimum, not a target: a dose given later than 8 weeks still counts and the series
  is not restarted. Two doses complete the primary series, and boosters continue from there while
  the risk lasts."*
- After: *"Eight weeks is the minimum. A later dose 2 still counts, and the series is not restarted.
  Two doses complete the primary series, then boosters continue while the risk lasts."* (Rule 4.)

**W4. Healthy 11–15-year-old's MenB card** (2,484 patients)
- Before: *"Shared clinical decision-making applies from 16 through 23 years, and ACIP prefers giving
  MenB at 16 through 18 years [1]."*
- After: *"From 16 through 23 years, MenB is given by shared clinical decision-making. The preferred
  age is 16 through 18 years [1]."* (Rule 4. Little to change.)

**W5. High-risk MenACWY card** (1,848 patients)
- Before: *"The high-risk indications are asplenia, persistent complement deficiency,
  complement-inhibitor therapy and HIV. ACIP gives all four the same 2-dose primary series."*
- After: *"ACIP recommends the same 2-dose primary series for all four high-risk indications:
  asplenia, persistent complement deficiency, complement-inhibitor therapy and HIV."* (Rules 2, 3.)

The longest common one (72 words, 1,032 patients, healthy 16–23 MenB card) would be split the same
way, as PneumoVax's §WORD-TIDY did with its long paragraphs.

## 2. F-3 — "Up to date" while a dose is still to come

6,536 cards say "Up to date" (measured today; the 5,292 in `report-2026-11-18-phase5-measured.md`
was counted before PRs #104–#105 and by a different counter, not reconciled):

| What the card holds | Cards | Example |
|---|---|---|
| A booster with a date (3–5 years away) | 4,158 | Infant microbiologist, MenQuadfi Aug 6, 2026: "Booster (dose 2…)", "Next dose due Aug 6, 2031", badge **Up to date** |
| A dose that is not a booster, with a date | 474 | 11 y, complement deficiency, MenQuadfi Aug 6, 2026: "Dose 2 of 2", "Next dose due Oct 1, 2026", badge **Up to date** |
| Nothing left, no date | 1,904 | Healthy 19 y, MenQuadfi at 18: "Complete", badge **Up to date** |

The same situation reads two ways (rule 7): the routine 16-year booster card says **"Future booster
needed"** (1,452 cards, e.g. healthy 11 y, MenQuadfi at 10), but the 4,158 dated-booster cards above
say "Up to date". PneumoVax never says "Up to date" mid-series. Its badge names the kind of
recommendation instead (Routine, Catch-up, Risk-Based, Complete, No dose now).

**Recommendation:** keep MeningoVax's "when" badges, but a dated booster → "Future booster needed"
(the words the routine card already has); a dated non-booster dose → "Next dose not yet due"; "Up
to date" only when nothing is left. Badge words only; no date, dose or verdict.
**Alternative:** PneumoVax's kind-of-recommendation badges, everywhere (a larger change).

## 3. F-5 — Two labels for the routine 16-year booster

Healthy 11 y, MenQuadfi at 10: label **"Booster due at 16y"** (1,452 cards, before it is due).
Healthy 16 y, Menveo at 11: label **"Booster (16y)"** (306 cards, when due or in its 8-week wait).
Same dose, two labels. **Recommendation:** "Booster (16y)" for both, the shorter form, which matches
the app's other booster labels ("Booster (dose 2, …)"). This changes the Phase 4 closed label list
(`docs/agent/clinical-rules.md`, "One Label Per Dose").

## 4. "Not counted — repeat" under a card with no date (2,265 lines)

Since F-4, a "repeat" line says "Repeat from <date>" when the card prints a date. These cards print
none, so the line says "repeat this dose only (do not restart the series)" and never when:

| Group | Lines | Example | Card says |
|---|---|---|---|
| A. High-risk child under 10, MenB given too young | 574 | 2 y, complement deficiency, Bexsero at 12 months | MenB "Not needed / Not yet age-eligible" |
| B. Healthy baby, MenACWY given too young | 588 | 2-month-old, MenQuadfi at 3 weeks (below the 6-week minimum) | MenACWY "Not needed / Not yet due" |
| C. Healthy child under 10, MenB given too young | 822 | Healthy 10 y, Bexsero at 9 | MenB "Not needed / Not routinely indicated" |
| D. Pregnancy, MenB deferred | 281 | — | "Deferred in pregnancy" (leave as is) |

Sources, read live 2026-11-18:
- CDC Timing and Spacing of Immunobiologics (July 24, 2024): a too-young first dose *"should be
  repeated on or after the date when the child reaches at least the minimum age"*; invalid doses
  *"should be repeated as age appropriate"*.
- CDC child/adolescent notes (updated July 1, 2025): MenACWY routine *"2-dose series at age 11–12
  years; 16 years"*; MenB *"Adolescents not at increased risk age 16–23 years (preferred age 16–18
  years)"*, by shared clinical decision-making.
- ACIP 2020 (already in `refs.js`): *"MenB vaccines are licensed in the United States only for
  persons aged 10–25 years"*.

**Recommendation, one line per group (each clause matched to a quote above):**
- A: *"Repeat at 10 years or older, when the high-risk MenB series starts."*
- B: *"Repeat at 11–12 years, with the routine dose."*
- C: *"MenB is next offered at 16–23 years, by shared clinical decision-making."* The word "repeat"
  is wrong here: nothing is owed until an optional series at 16.
- D: unchanged.

## Answers (owner, 2026-11-18) — all seven as recommended, none built yet

| # | Question | Owner answer |
|---|---|---|
| G1-a | Adopt PneumoVax's 10 style rules for every dose line, card lead and "Why this"? | **Yes, the rules** (not sentence by sentence). Every before/after goes in the PR for her to check |
| G1-b | A "Why this" fold-out on each recorded dose, as PneumoVax? | **Yes, as PneumoVax**: the line keeps the label plus one reason; background and the age/minimum detail go behind it |
| F-3 | "Up to date" while a dose is still to come? | **Fix it**: dated booster → "Future booster needed"; dated dose that is not a booster → "Next dose not yet due"; "Up to date" only when nothing is left. Badge words only |
| F-5 | One label for the routine 16-year booster? | **"Booster (16y)"** for both (changes the Phase 4 label list) |
| R-A | High-risk child, MenB too young, card with no date | **Yes**: the line ends *"Repeat at 10 years or older, when the high-risk MenB series starts."* |
| R-B | Healthy baby, MenACWY too young, card with no date | **Yes**: the line ends *"Repeat at 11–12 years, with the routine dose."* |
| R-C | Healthy child under 10, MenB too young | **Yes, drop "repeat"**: the line ends *"MenB is next offered at 16–23 years, by shared clinical decision-making."* The chip ("Not counted — repeat") is NOT decided: measure and bring back as its own question |

Group D (pregnancy, 281 lines) unchanged, as proposed.
