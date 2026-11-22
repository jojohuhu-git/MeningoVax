# MeningoVax — Clinical Rules Reference

**Last verified against code:** 2026-11-16 (port Phase 3: STOP B B-2–B-5 and the Complete
rule; an undated dose does not count, STOP C C1; MenB dose 3, C5–C7; MenACWY gaps, C10, C11,
C13); before that 2026-09-23 (MenQuadfi 6-week licence floor, M3-M5) and
2026-09-17 (P0-1, MenACWY infant primary intervals).

The load-bearing numbers here are asserted against the code by
`src/logic/__tests__/rule-docs-match-code.test.js`. Change a rule without changing this
file and the suite fails, naming the sentence. The plain-English, owner-facing version of
the same rules is [meningococcal-rules-summary.md](meningococcal-rules-summary.md), which
is the source of truth.

## The 4-Day Grace Rule (P1-1, 2026-09-17)

CDC general best practices, on the schedule-notes page the app already cites:

> "Vaccine doses administered ≤4 days before the minimum age or interval are considered
> valid. Doses of any vaccine administered ≥5 days earlier than the minimum age or minimum
> interval should not be counted as valid and should be repeated as age appropriate."

Applies to **every** minimum age and minimum interval, through one shared helper set in
`intervals.js` — `intervalMeetsMinimum` (day counts), `calendarIntervalMeetsMinimum`
(calendar months), `ageMeetsMinimum` (ages). Never re-implement the comparison inline.

Ages are NOT converted with an averaged days-per-month constant: 4 days is 4/28 of a month
in February and 4/31 in March, and P0-4/P0-5 are both bugs caused by that kind of
averaging. `ageMeetsMinimum` re-derives the age as if the dose were given 4 days later.

**Two places it deliberately does NOT apply:**
1. **The scheduler.** `dueToday` and `earliestNextDate` never take the grace — granting
   it there would advertise a date 4 days early and actively advise giving doses before
   the minimum interval, which the CDC sentence does not permit. The app says "Next dose
   due the 9th" and *accepts* a dose given on the 5th. Where the routine date is later than
   the minimum (MenB high-risk dose 2; infant MenACWY doses 2–3 in the 2-month band), the
   card advises the routine date and states the minimum beside it ("It can be given from
   <date> if needed (minimum 4 weeks)"), owner STOP F1 Q9a/Q9b, 2026-11-17 — see those
   sections. The minimum stated is never inside the grace, and is held to the floor after
   a dose that did not count (`minimumBesideRoutine()`, `intervals.js`).
2. **Series-length tests** (`seriesTotals.js`) — with FOUR exceptions the owner ruled
   (STOP C C7, 2026-11-15, and D3/D4, 2026-11-17: the grace applies where it means one
   dose fewer):
   - the healthy MenB 6-month line ("was dose 2 early, so a rescue dose 3 is owed?") — C7;
   - the high-risk MenB 4-month line ("was dose 3 too early to count?") — C7;
   - C6's high-risk "dose 3 ≥6 months after dose 1, so it counts" line — D3;
   - the high-risk "dose 2 ≥6 months after dose 1, so no dose 3" line — D4.
   They live in `seriesTotals.js` (`menbHealthyDose2Early`, `menbHighRiskDose3Early`,
   `menbSeriesInfo`), read by the series total, the card and the dose verdict.
   - **The MenACWY age lines that pick the schedule — 3 months, 7 months, 2 years, 16 years**
     (STOP B B-1, owner 2026-11-15; 3 months D12 and 16 years D13, 2026-11-17): see the next
     section.
   Every other series-length line keeps no grace.

Note this also applies in `recommend.js` wherever it asks "does this recorded dose count"
(e.g. `hasDoseAt16`) — not only in the validator. Those two used to disagree, so the record
panel counted a dose while the card went on asking for it.

## B-1 — The Grace at a MenACWY Age Line, Only When It Helps (owner 2026-11-15 / 2026-11-17)

PneumoVax's §A-GRACE12-HELPS ruling, carried over. Three age lines decide how many MenACWY
doses a child needs (CDC child & adolescent schedule notes, Menveo, read live 2026-11-17):
*"Dose 1 at age 2 months: 4-dose series"*; *"Dose 1 at age 3–6 months: 3- or 4- dose series
(… until a dose is received at age 7 months or older, followed by an additional dose …)"*;
*"Dose 1 at age 7–23 months: 2-dose series"*; from 2 years the ≥2-year schedule (ACIP 2020
Table 9, travel ≥2 yrs: *"1 dose"*); and at 16 the routine booster (ACIP 2020 Table 2).

**The rule:** with a date of birth on file, a MenACWY dose given 1–4 days before **3 months,
7 months, 2 years or 16 years** makes `recommend()` read the whole history twice — every such dose at
its real age, and every such dose as given on its line — and keep the reading whose MenACWY
card owes **fewer** doses (an open card with no dose number, such as "Booster (16y)",
owes 1). A tie keeps the real age. Whole readings, never a mix: the MenACWY card, chips and record
panel come from the one reading kept. **On the dose day too:** a dose read on its birthday means
the patient has reached it at any visit on or after the dose, so the card does not change a few
days later with no new dose (`menacwyAgeFloorMonths`, MenACWY only — MenB and the pentavalent keep
the real age).
Helper: `menacwyGraceLine()` in `intervals.js`; the comparison is in `recommend()`.

- Travel baby, Menveo 2 days before 7 months → 2-dose series (was 4). Travel child, Menveo
  2 days before 2 years → 1 dose, booster 3 years after it (was infant dose 2 owed).
  Asplenia, Menveo 2 days before 3 months then at 7 months → Dose 3 of 3 (was 3 of 4).
  Healthy, Menveo at 11 and 4 days before 16 → Complete on the dose day (was "Booster due at
  16y, 8 weeks later" until the birthday; CDC test patients 2013-0488, 2013-0511 now agree).
- **Tie kept:** asplenia, Menveo 2 days before 7 months, dose 2 nine weeks later — read at
  7 months, dose 2 would not count; one dose owed either way, so the real age stays.
- **Not a grace line: age 7** (owner 2026-11-17, "3 years"). The grace there never changes
  the doses owed, only whether the first booster comes at 3 or 5 years (ACIP Table 9:
  *"Aged <7 yrs: Single dose at 3 yrs after primary vaccination"*). A primary finished 1–4
  days before 7 keeps the 3-year booster.
- **Unchanged:** 5+ days early; no date of birth; the age-10 line (graced as a minimum age —
  a deliberate CDSI difference, test patient 2013-0500); what the app advises.
- Guard: `regression-2026-11-17-b1-grace-only-when-it-helps.test.js`.

## Ruling D — A Repeat Is Timed From the Dose That Did Not Count (Port 3 family 1, 2026-11-16)

Owner answers at STOP C (2026-11-15): **C2** (measure from the dose given), **C9** (an early
booster: repeat 5/3 years — MenB 1/2 years — after IT), **C12** (healthy MenB dose 2 under 4
weeks does not count), plus two follow-up answers the same day, **E1** and **E2** (below).
Recorded in `docs/archive/stop-c-packet-2026-11-15.md`. Copied from PneumoVax's Ruling D
(PneumoVax PR #83).

CDC General Best Practices, Timing and Spacing (read live 2026-11-16):

> "Doses of any vaccine administered ≥5 days earlier than the minimum interval or age should
> not be counted as valid doses and should be repeated as age appropriate. The repeat dose
> should be spaced after the invalid dose by the recommended minimum interval (Table 3-2)."

The same paragraph's hepatitis B example times the repeat from "the 2nd valid dose"; that is a
hepatitis-B exception (PneumoVax read the page the same way, 2026-10-23), not the general rule.

**The split:** the CLOCK moves to the last dose GIVEN; dose numbers, series totals and which
rule applies stay on the doses that COUNTED.
- **Validator** (`validate.js` `runWalk` keeps `anchor`, the last dated dose given — counted, or
  not counted for being too soon or too young; `doseRules.js` `prevGiven`/`prevDated` measure
  every gap row from it). A dose given on time from the last counted dose but too soon after
  the dose that did not count does **not** count.
- **Card** (`recommend.js`): `menacwyRec`/`menbRec` take `clockDate` (`history.anchorDate`,
  read, never recomputed). The healthy MenB 6-month line (2 doses or 3?) stays on the counted
  dose 1 — it decides how many doses, not when.
- **A set-aside MenACWY dose IS a clock** (owner D2, 2026-11-17): valid but not advancing
  the series (MenACWY before 10; a routine dose 2 before 16), it was still given, so the next
  MenACWY dose waits 8 weeks after it (ACIP 2020: *"as long as a minimum interval of 8 weeks
  between doses is maintained"*). `validate.js` sets `anchor`/`uncountedDate` from it; the
  "Booster (16y)" card names the wait. Closes CDC test patient 2013-0489. MenB set-aside
  doses were not asked about and start no clock.
- **Never a clock:** a record problem (date in the future, before birth, entered twice — no
  dose was given), an undated dose (which since C1 does not count either), a MenB set-aside
  dose, a pending or extra dose.
- **E1 — a too-young FIRST dose:** the repeat waits the family's minimum interval after it —
  **MenB 4 weeks** (ACIP's MenB repeat sentence), **MenACWY 8 weeks** (owner D5, 2026-11-17:
  E1 had said 4 weeks for both, but 4 weeks is MenB's number; CDC: *"The repeat dose should be
  spaced after the invalid dose by the recommended minimum interval"*). A deliberate difference
  from CDC's *"repeated on or after the date when the child reaches at least the minimum age"*
  (`gbpTooYoungFirstDoseRepeat`). PneumoVax uses PCV's 4 weeks. Validator:
  `ACWY-ANY-TWO-DOSES-GAP` and `MENB-REPEAT-GAP` read `prevGiven`.
- **E2 — a wrong-family MenB dose:** it does not count and is NOT the schedule clock; the next
  dose of the established family is due when it would be due from that family's doses, AND at
  least 4 weeks after the wrong-family dose. ACIP 2020: *"a minimum interval of 4 weeks should
  be used between any 2 doses"* (`acip2020MenbRepeat4Weeks`). Validator: `MENB-REPEAT-GAP`
  (reads `lastUncounted`); card: `applyRepeatFloor` in `recommend.js`
  (`MENB_REPEAT_MIN_INTERVAL`; MenACWY uses `MENACWY_ANY_TWO_DOSES_MIN_GAP`, 8 weeks, since D5).
  **D8 (owner, 2026-11-17) — the other product, as one line:** with exactly one dose of each
  MenB product on record, the card still finishes with the first product and its always-shown
  lead adds *"Or finish with Trumenba instead: dose 2 due … (the Bexsero dose then does not
  count)"* — "due", not "from", since the date is the advised one (owner F2b, 2026-11-18). ACIP 2020: *"one product should be selected for administration of an additional
  dose …; the dose from the product not selected for series completion should be considered
  invalid"* (`acip2020MenbMixedProductsSelectOne`). The date is `menbRec()`'s own answer for a
  record holding only the other product's dose (`withMenbSwitchLine` in `recommend.js`). The
  dose chip still says to give the established family; the card carries the alternative.

Test: `regression-2026-11-15-ruling-d-repeat-from-the-dose-given.test.js`.

## One Label Per Dose (port Phase 4, owner STOP E1 Q5–Q11, 2026-11-17)

The chip beside a recorded dose is one label from a closed list
(`doseChipLabel.js`; enforced by `sweep-never-events.test.js` property 13).
Owner answers: `docs/archive/decisions-2026-11-17-open-questions.md`.

- **Q5** `status: 'invalid'` → "Not counted — repeat" (too soon or too young
  alike; PneumoVax's "do not repeat" for a too-soon dose was NOT adopted: "For
  Menveo saying do not repeat and then giving the next due date is confusing").
- **Q10** …unless no card asks for that vaccine today: `recommend.js`
  `notRepeatedWhenNothingAsked` marks `notRepeated` when every card for it is
  `complete`/`not-indicated` without `asksLater`; the chip reads "Not counted —
  do not repeat" and the line drops the repeat sentence. `deferred`
  (pregnancy) asks.
- **Q6** a set-aside dose names its line: "Not counted — given before age
  10/16" (`setAsideBeforeAgeY`, stamped by `setAsideResult` in `doseRules.js`).
- **Q7** "Booster" kept. **Q9** a counted dose with no series running: "Dose N".
- **F-5 (owner, STOP G1, 2026-11-18)** card title, not a chip: the routine 16-year MenACWY
  booster has ONE label, "Booster (16y)", before it is due and when it is due (it read
  "Booster due at 16y" before 16). One constant, `ROUTINE_16Y_BOOSTER_LABEL` in `recommend.js`,
  also used by `outbreakWording` to leave this label without the outbreak caveat. **Follow-up
  (owner, 2026-11-18):** from 16 on the travel/lab/outbreak schedules
  (`routineSixteenBoosterCard`) the same dose reads "Booster (16y)" too, not "1 dose (routine
  booster at ≥16y still owed)" (648 real patients); its note still says the booster is still
  owed. Military alone (its own card in `menacwyRec`, 162 real patients) too (owner,
  2026-11-18, "Yes, military too"): no card reads the old title any more. Test
  `regression-2026-11-18-f5-one-label-16y-booster.test.js`.
- **F-4a / F-4b (owner, 2026-11-18)** the repeat line says when, or that it was:
  `recommend.js` `datedRepeatLines`, after Q10. A later shot of that vaccine on the
  record (no record problem, a later day, counted or not) swaps the repeat sentence
  ("Do not restart the series." since G1-a) for "Repeated on <date>. See that dose."
  (`repeatedOn`; PneumoVax §C-P2-LATER). Otherwise "Repeat from <date>." goes just
  before the repeat sentence (G1-a: answer first), with the date the
  card prints (today if it asks today, else `earliestNextDate`, else
  `boosterDueDate`), read from the card, never recomputed. No card date (not yet
  due, deferred) → nothing added. Chip unchanged. CDC Timing and Spacing: *"The
  repeat dose should be spaced after the invalid dose by the recommended minimum
  interval (Table 3-2)."* Test `regression-2026-11-18-phase5-f4-repeat-line-date.test.js`;
  `dose-rules-table.test.js` holds every floor dose on the grid to it.
- **G1-a (owner, STOP G1, 2026-11-18, "Yes, the rules"; built 2026-11-19)** every dose
  line, card lead and "Why this" follows PneumoVax's ten style rules
  (`stop-g1-packet-2026-11-18.md` §1). On a dose line: "about", never "~" (`about()` and
  `fmtDays` in `doseRules.js`; a whole number of weeks is exact, no "about"); the minimum
  folds into the reason ("Given 3 weeks after the previous dose, under the 8-week
  minimum …"); the line does not repeat its chip ("This dose does not count toward the
  series: repeat this dose only (do not restart the series)." became `DO_NOT_RESTART`,
  "Do not restart the series."; "This dose is too soon and does not count.", "The dose
  counts — do not repeat it —" and "Counted —" went); background moves behind the dose's
  "Why this" (`whys`: the infant-series CDC rule, MenB "not interchangeable", "every 2–3
  years", "safe, but not the routine booster"). The packet's samples L1–L5 and W1–W5 are
  built word for word; L1 also corrects "recommended at 16–23 years" to the cited quote's
  "shared clinical decision-making". No verdict, date, dose number, chip, badge or source
  number moved (measured 2026-11-19). Guard:
  `regression-2026-11-19-g1a-style-rules.test.js` (no "~", no semicolon, at most one
  dash a sentence, no label repeat, dose line ≤50 words, card "Why this" ≤66).
  **Its three findings, answered by the owner 2026-11-19 (all as recommended):**
  F1, where the rounded gap would print the minimum itself ("about 4 months after the
  early dose 2, under the 4-month minimum"), the line prints the exact calendar gap
  ("3 months 19 days"; `gapUnder`/`exactGap` in `doseRules.js`), and its detail says
  "minimum 4 months"; every other gap keeps "about". F2, the healthy MenB card title
  "Dose 3 of 3 (rescue: dose 2 given early)" is now "Dose 3 of 3 (dose 2 given early)"
  (a change to this closed label list) and its "Why this" says "a third dose" (ACIP Oct
  2024, `menbRescueDoseRule`: *"a third dose should be administered ≥4 months after the
  second dose"*). F3, a too-soon MenACWY or MenB booster (`tooSoonBooster`) gets no "Do
  not restart the series." (a booster has no series to restart); its line still ends
  "Repeat from <date>." or "Repeated on <date>. See that dose." Test
  `regression-2026-11-19-g1a-findings-f1-f2-f3.test.js`.
- **Q10, the result page folds (owner, 2026-11-19, "Full PneumoVax fold"; reverses
  2026-11-06's "PneumoVax only")** as PneumoVax's §WORD-1. A card line that repeats its
  heading moves behind "Why this"; only the owner's list stays in view ("Yes, that list"):
  the switch to the other MenB product, the minimum beside a routine date (STOP F1), "It can
  be given once 8 weeks have passed since that dose", and "Not before <date>: … which did not
  count." The pentavalent card's line is not folded. The card's source buttons sit inside
  "Why this" ("Sources" when there is no explanation, PneumoVax's 2026-11-07 ruling), and the
  disclaimer's risk-history paragraph sits behind "About risk history" ("Yes, both"). No
  sentence is written, dropped or re-cited: 0 of 24,600 saved pages lost or gained a word
  (measured 2026-11-19). Report: `docs/archive/report-2026-11-19-result-page-fold.md`.
  Guard: `regression-2026-11-19-q10-result-page-fold.test.jsx`.
- **R-A / R-B / R-C (owner, STOP G1, 2026-11-18)** the repeat line under a card that
  asks LATER with no date says when too. The card carries its own ending
  (`repeatLater` in `recommend.js`), read by `datedRepeatLines` only when no card asks
  now and none is deferred (F-4b still wins). R-A, high-risk MenB under 10 ("Not yet
  age-eligible"): *"Repeat at 10 years or older, when the high-risk MenB series
  starts."* R-B, healthy MenACWY under 11 ("Not yet due"): *"Repeat at 11–12 years,
  with the routine dose."* R-C, healthy MenB before 16 ("Not routinely indicated"):
  the repeat sentence is dropped (nothing is owed until an optional series at 16) and
  the line ends *"MenB is next offered at 16–23 years, by shared clinical
  decision-making."* Its chip reads "Not counted — do not repeat" (`notRepeated`;
  owner, 2026-11-18, "Yes, do not repeat": 822 real patients, chip words the only
  change). Because that patient needs no MenB, this holds even when another MenB shot
  followed the dose: R-C is applied before F-4b, so no "Repeated on" there (owner,
  2026-11-18, "did the patient need MenB or no"; 1,104 real patients, all 10–11 y with no
  risk factor or a MenACWY-only one). R-A and R-B keep "Not counted — repeat", and F-4b
  still applies to them. Pregnancy (deferred) unchanged. Sources in
  `docs/archive/stop-g1-packet-2026-11-18.md` §4. Test
  `regression-2026-11-18-r-abc-undated-repeat-line.test.js`.
- **Q8 + Q11 — Extra.** `validate.js` `notAskedFor`: a valid dose is Extra (not
  kept, not numbered, starts no clock, line = the reason only) when every card
  for that vaccine on the dose day asked for nothing. "The cards on the dose
  day" = `recommend()` run with `today` = the dose date, the doses before it,
  and today's risks (`cardsOnTheDay` in `recommendOneReading`, cached per date
  in `cardsSeen`). Limits: no first-dose exception (Q11, unlike PneumoVax's
  Priya); `college_dorm` exempt (Q8 follow-up); a card with `asksLater`
  ("Not yet due", "Not yet age-eligible", "Dose 1 given; next dose not yet due",
  MenB "Not routinely indicated" under 16) asks, so it does not make a dose
  Extra. Why `asksLater`: without it a healthy child's MenACWY at 10 (ACIP:
  counts as dose 1) and a MenB dose inside the 4-day grace before 16 became
  Extra, and the card asked for them again. The series-cap Extra (past the
  total, no booster phase) is unchanged except its line now gives only the
  reason.

## Source Priority

**ACIP/CDC/AAP/immunize.org over FDA package inserts.** Sources are listed at the top of `recommend.js` and in `refs.js`. Never revert to FDA-labeled ages without explicit instruction.

## MenACWY Schedule

### Routine Adolescent
- 11–12y: D1
- 13–15y with no counted dose: the same D1, labelled catch-up ("Dose 1 (catch-up, 13–15y)",
  owner F-2, 2026-11-18). CDC child/adolescent notes, catch-up: *"Age 13–15 years: 1 dose now and
  booster at age 16–18 years (minimum interval: 8 weeks)"*. Wording only: same status, badge
  and dates. `MENACWY_ROUTINE_CATCHUP_MIN_AGE_MONTHS` (`ages.js`). Test
  `regression-2026-11-18-phase5-f2-catchup-13-15.test.js`. Its booster line reads
  "Booster: at age 16–18 years" (wording slip fixed 2026-11-19, was "Boosters: 1 more - at age
  16–18") and cites that CDC sentence (owner W3, 2026-11-19); the
  11–12 card reads "Booster: at age 16 years" and keeps ACIP's *"…followed by a booster dose administered at age 16
  years"*. Test `regression-2026-11-19-after-fold-w1-w4.test.jsx`.
- 16y: booster (D2), **no sooner than 8 weeks after D1** (N5, owner ruling 2026-11-15). ACIP
  2020: *"the booster dose can be administered at any time, as long as a minimum interval of 8
  weeks between doses is maintained."* `MENACWY_ROUTINE_BOOSTER_MIN_GAP` in `intervals.js`.
  Card: due on the later of the 16th birthday and D1 + 8 weeks (`routineBoosterTiming`,
  `routineBoosterDueDate` in `recommend.js`; also the college, military and outbreak cards
  that ask for this booster). Validator: a second counted dose at ≥16y less than 8 weeks −
  4 days after a D1 given before 16 does not count (`validate.js`, routine population only).
  Its repeat is 8 weeks after the booster that did not count (Ruling D, above). Test:
  `regression-2026-11-15-n5-16y-booster-8-weeks.test.js`.
- 17–21y with no dose on/after 16th birthday: catch-up D1 of 1 (no booster; especially for first-year college residence-hall students)
- ≥22y healthy: not indicated

### High-Risk Primary (asplenia, SCD, complement, HIV, `primary2` class)
Series length is keyed to the age at **D1** and is fixed for life (P0-1) — a patient who
started under 2y stays on the infant pathway however old they are now. Totals come from
`seriesTotals.js` → `menacwyInfantHighRiskTotal()`; never hand-type them.
- D1 at 2m: 4-dose primary (2/4/6/12m) when D2 comes before 7m. If D2 landed at ≥7m, the
  "3-dose shortcut" applies here too and D3 completes the series (T1, owner 2026-11-19,
  following CDSI 4.65's "risk 2-23 month" series; this reverses P1-3's "no shortcut for a
  2-month start" for these patients only). A lapsed child, e.g. one dose at 2m and seen at 6y,
  is owed 2 more.
- D1 at 3–6m: 3- **or** 4-dose. "3-dose shortcut": if D2 landed at ≥7m, D3 completes the
  series. Unknown D2 age falls back to 4.
- D1 at 7–23m: 2-dose primary, D2 ≥12 weeks after D1 AND at ≥12 months of age (M5 — this
  band was 3 doses before 2026-09-15).
- ≥2y: 2-dose primary (D2 ≥8 weeks after D1)

**MenQuadfi's licence floor (M1–M4, 2026-09-22/23) is younger than the schedule floor
above, and the two are deliberately two different constants:**
`MENACWY_LICENCE_MIN_AGE_DAYS` (`brands.js`, 42 — could a dose of ANY MenACWY product
have been given at this age) vs `MENACWY_SCHEDULE_MIN_AGE_MONTHS` (`ages.js`, 2 —
unchanged, does the app ASK for one yet). MenQuadfi is AAP-aligned per WA DOH to 6
weeks; Menveo's floor stays 2 months. Dose 1 is DUE at 2 months. **Since owner MQ6
(2026-11-21; AAP 2026: "The first dose of MenQuadfi may be given as early as 6 weeks"),
a high-risk, travel or outbreak baby from day 42 to under 2 months, with a date of birth
and no MenACWY yet, gets a card listing Menveo 2-vial and MenQuadfi (owner MQ6-j,
2026-11-21: dose 1 is advised at 2 months, so the same brands as the 2-month card; AAP 2026
catch-up table, minimum age for dose 1: "2 months MenACWY-CRM, 6 weeks MenACWY-TT"), "Dose 1
of 4", next dose due at 2 months, the note "MenQuadfi may be given from 6 weeks" behind "Why
this" (owner MQ6-i, the same day: keep it folded).** Its badge reads "Next dose not
yet due", not "Can be given today", and the summary line adds nothing (owner MQ6-g,
2026-11-21: follow the standard schedule when it can be followed). Without a date of
birth there is no such card: whole months cannot confirm 6 weeks (owner MQ6-k, 2026-11-21,
"Keep as is"). A MenQuadfi dose
actually given at 6 or 7 weeks is licensed and counts, and the card is the dose-2 card
the same baby gets from 2 months: dose 2 due at 4 months, earliest valid 8 weeks after
dose 1 (owner MQ6-e, 2026-11-21; AAP 2026 catch-up table, MenACWY dose 1 to dose 2:
"8 weeks"). `menacwyInfantSeries()` lets that case through its schedule-floor gate to
the series continuation (it used to return "Not needed" / "Dose 1 given; next dose not
yet due", with no date).
`MENACWY_INFANT_SERIES_BRANDS` means "licensed anywhere in the infant band" (both
Menveo and MenQuadfi), not "licensed at the single youngest floor" — the latter would
silently drop Menveo now that MenQuadfi's floor is younger.

**Infant primary intervals (P0-1, 2026-09-17).** Two numbers, and they come from
`intervals.js` → `menacwyInfantNextDoseGate()`. Never hand-type either, and never restate
them in card text — interpolate.
- **Early doses: ≥8 weeks apart.** This was `DAYS.weeks(4)` in four places and the English
  "≥4 weeks" in the card sentence, all wrong. ACIP 2020 MMWR 69(RR-9), footnote to Tables
  4–6: *"If MenACWY-CRM is initiated at ages 3–6 months, catch-up vaccination includes
  doses at intervals of 8 weeks…"*; CDC child schedule notes, Menveo 3–6m row: *"at least
  8 weeks after previous dose"*. The 4 weeks was ACIP's floor for **repeating an invalid
  dose** — and in the MMWR that sentence appears only in the MenB section.
- **The final primary dose: ≥12 weeks after the previous dose AND at ≥12 months of age.**
  One rule for "the final infant dose" across every band, enforced in `validate.js` for
  the 2-, 3- and 4-dose series alike. Before P0-1 only the 3-dose shortcut enforced it
  (P1-3), so a 4-dose series offered its final dose 4 weeks on with no age floor at all —
  a three-dose six-month-old was told the 12-month dose was due today.
- **Owner decisions, 2026-09-17** (reasoned readings where CDC is silent, not quotes):
  the **2-month band** gets the same 8-week early gap, because CDC prints its schedule but
  states no minimum interval for it and the printed schedule is itself 8 weeks apart; and
  the final-dose rule above is **one rule for both** the 2-month and 3–6-month bands.
- **Advised at the routine ages, 2-month band only (owner STOP F1 Q9b, 2026-11-17,
  matching PneumoVax C10-2).** A series started before 3 months is advised dose 2 at **4
  months** and dose 3 at **6 months** of age (ACIP 2020: *"4 doses at 2, 4, 6, and 12 mos"*),
  with the 8-week minimum stated beside them ("It can be given from <date> if needed
  (minimum 8 weeks)"). When 8 weeks after the last dose is already later than the routine
  age (a late dose 1), the 8 weeks is the date and no minimum sentence is shown. A dose
  given at the minimum still counts. A 3–6-month start is spaced by the 8 weeks itself
  (ACIP: *"doses at intervals of 8 weeks"*), so it is unchanged. `MENACWY_INFANT_ROUTINE_AGE_MONTHS`.
- **Edge case, deliberate:** D1 at exactly 3 months with every gap at the minimum puts D3
  at ~6.7 months. Read hyper-literally CDC would want a fifth dose; CDC caps the series at
  "3- or 4-dose", so it stops at four and the final dose (≥12 months) satisfies the ≥7-month
  condition. Do not "correct" this back — it never gives fewer doses than CDC intends.

**The infant series is not high-risk-only (M10).** `menacwyInfantSeriesIndicated()` also
returns true for `travel` and `outbreak_acwy` — ACIP prints the same "2–23 mos" row in
Tables 4–6, 8 and 9, so those infants get the *same infant series*. `microbiologist` and
`military` are excluded: no infant row exists for them.

### High-Risk Booster Cadence
Keyed off the age at the **last dose of the primary series** — the dose that starts the
clock (P1-1). For a 2-month start that is D4, not D2; keying it to D2 is right only for a
series begun at ≥2y. Derived from `seriesTotals.js` → `menacwyPrimaryTotal()` in BOTH
`recommend.js` and `validate.js`, so the two cannot drift.
- Primary completed <7y (84m): **first booster 3y**, then **every 5y**
- Primary completed ≥7y: **first booster 5y**, then every 5y
- Unknown completion age: conservative 3y for the first booster only. Unreachable since C1;
  kept as a safety net (T2, owner 2026-11-19), guarded by
  `regression-2026-11-19-t2-unknown-completion-age-unreachable.test.js`
- Compared on the calendar, not in days (P0-5) — `DAYS.years(3)` = 1096 rejected a booster
  given on its exact three-year anniversary whenever no 29 February fell in the window.

### Single-Dose Indications (`single` class)
One PRIMARY dose — not "never another dose". All three keep `hasBoosterPhase: true` in
`seriesTotals.js` so a later dose is never discarded (P0-2).
- `college_dorm`: a dose at ≥16y satisfies it **for 5 years**; more than 5 years after the
  most recent ≥16y dose, one dose is due (owner D1, 2026-11-17, reversing M17's
  "permanently"). ACIP 2020 Table 10 footnote (read live 2026-11-17): *"Adolescents who
  received a first dose after their 16th birthday do not need another dose before college
  entry unless it has been more than 5 years since the dose."* Its Boosters row (*"Not
  routinely recommended"*) rules out a recurring booster, not this entry dose. immunize.org
  P2018 agrees. M17 had quoted ACIP's routine-section sentence as the college footnote.
  Measured to today (the app cannot know the entry date); exactly 5 years still covers
  (`MENACWY_COLLEGE_COVER_YEARS`). This ≥16y rule applies uniquely to this class.
- **Under 16, `college_dorm` and `military` add nothing** (owner STOP B B-4, 2026-11-15):
  the card is the routine card plus one sentence, "The college-residence (military) dose is
  given at 16 or older." The validator already treated them as routine, so card and chip
  now agree (whole-app check 1: 0 faults).
- `military`: D1 satisfies recruitment. **The card shows the 5-year booster date with the
  assignment caveat, never "Complete"** (owner STOP B B-3, 2026-11-15, reversing M18's
  "no date"): "Booster (dose N) if required by assignment"; ACIP Table 10 (read live
  2026-11-16): *"Military recruits: Every 5 yrs on basis of assignment"*; footnote ††: the
  U.S. **Department of Defense** sets it from high-risk travel, which the app cannot see.
  **A military booster given at 16 or older under 5 years (less the 4-day grace) after the
  dose before it does not count** (owner D6, 2026-11-17: checked like travel, C10); the next
  booster is timed from it (C9). The routine 16-year booster keeps its own 8 weeks. Row
  `ACWY-TRAVEL-BOOSTER-GAP` (`militaryBoosterNow` in `doseRules.js`).
- `outbreak_acwy`: **while the box is ticked, the card keeps asking for the booster** —
  3 years after the last dose if the series finished before 7, otherwise 5, then every 5 —
  and never says "Complete" or "top-up" (owner STOP B B-2, 2026-11-15, replacing M12's
  one-off-top-up reading). The years key off the age at the **last primary dose**, the same
  rule the validator checks (C10, `acwyBoosterTooSoon`). An outbreak contact's routine
  16-year booster comes first and is exempt from the outbreak floor (`acwyIsRoutineBooster`).
  Infant outbreak series: the same 3-then-5-year countdown (`hasBoosterPhase: true`).
- **Every outbreak card says the booster depends on the risk continuing** (owner D7,
  2026-11-17), MenACWY (`outbreak_acwy`) and MenB (`outbreak_b`), at every age: a booster
  label gains "if outbreak risk continues" (or "for this outbreak" when due today), and the
  booster line reads "while outbreak risk continues". One step, `outbreakWording()` at the
  end of `recommend()`, only when the outbreak is the only reason for boosters (another
  ticked risk keeps its own wording). Dates unchanged. immunize.org P2018 (10/19/2026):
  boosters *"as long as risk remains"*.
- **Serogroup B outbreak: one MenB booster** (owner D10, 2026-11-17). When `outbreak_b` is
  the only MenB risk (`outbreakIsTheOnlyBoosterReason('MenB', …)`), the booster card asks for
  one dose ≥1 year after the primary series; after it, status `complete`, "Complete (outbreak
  booster given)", no date. ACIP 2020 Table 8, read live 2026-11-17: *"Single dose if ≥1 yr
  after MenB primary series completion (≥6 mos interval might also be considered by public
  health professionals)"*; Tables 4, 5, 7: *"…and every 2–3 yrs thereafter"*. mm7349a3:
  booster recommendations *"are unchanged"*. The 6-month public-health option is not offered.
  Guarded by `regression-2026-11-17-d10-menb-outbreak-one-booster.test.js` and never-events
  property 12.
- **"Complete" only when nothing more is owed** (PneumoVax owner rule 2026-11-01, applied at
  STOP B): the routine "Booster (16y)" card is status `due`, nothing due today, its
  booster date doubling as `earliestNextDate` (pill "Future booster needed").
- **"Up to date" only when nothing is left** (owner F-3, STOP G1, 2026-11-18;
  `statusPillLabel` in `RecCard.jsx`). Not due today with an `earliestNextDate`: a dose past
  the primary series (`doseNum > primaryTotal`) reads "Future booster needed", any other
  "Next dose not yet due". `primaryTotal`, not `seriesTotal`, because the routine 16-year card
  counts its booster in `seriesTotal`. Guarded by never-events property 16 and
  `regression-2026-11-18-f3-badge-names-what-is-left.test.jsx`.
- **The pentavalent option waits for the dose questions** (owner STOP B B-5): no combined
  shot, and no "both are due today" banner, while any recorded dose is "Needs input".
- **Do not conflate these three.**

### Travel and Microbiologist (`single+boost` class)
- `travel`: D1, then first booster at **3y if the primary dose was given before age 7**,
  otherwise 5y; every later booster 5y (M9, ACIP Table 9).
- `microbiologist`: D1 + booster every 5 years, flat — ACIP Table 7 covers ages ≥10 and
  has no under-7 row, so the 3-year rule must NOT be extended to them (L2-3 corrected the
  card copy that implied it did).
- **Booster floor (owner C10, 2026-11-15):** a travel or microbiologist booster sooner than
  3/5 years (less the 4-day grace) does not count — row `ACWY-TRAVEL-BOOSTER-GAP`, sharing
  `acwyBoosterTooSoon()` with `ACWY-HIGHRISK-BOOSTER-GAP`. ACIP Tables 7 and 9 (read live
  2026-11-16). C10 also names A/C/W/Y outbreak boosters; those join the check with STOP B
  B-2, because today's outbreak card has no booster date and checking the record first
  would reject the dose the card advises (the whole-app walk found 629 dead ends).
- **The routine 16-year booster comes first (owner, Port Phase 5, 2026-11-18)** — for
  `travel`, `microbiologist` and `outbreak_acwy`. ACIP 2020 Table 2 (read live 2026-11-18):
  *"Booster: 1 dose at age 16 yrs if first dose administered before 16th birthday"*, no
  exception for these risks; CDC child notes (July 1, 2025) send *"a healthy child who received
  a single dose for travel"* to the adolescent schedule. Before this, ticking the box pushed
  that dose back about 5 years (830 saved patients; Maya, 15, dose at 14: 2030 instead of her
  16th birthday). Now: under 16, once a dose given at 10 or older is on record, the card reads
  "Booster (16y)" when that date (the 16th birthday, or 8 weeks after the last dose if
  later) is no later than the travel/lab/outbreak booster; from 16, also "Booster (16y)" (F-5
  follow-up; it read "1 dose (routine booster at ≥16y still owed)" before) whenever no dose at 16
  or older counted — through 21 for travel, lab and
  outbreak (a healthy 22-year-old is owed nothing; outbreak joined with owner F-6, 2026-11-18:
  from 22 the outbreak card offers its own booster, "Booster (dose N) for this outbreak", ACIP
  Table 8 *"Aged ≥7 yrs: single dose if ≥5 yrs since vaccination"*; a dose before 16 is always
  6+ years old by then, so it is due either way and the validator needs no change. Test
  `regression-2026-11-18-phase5-f6-outbreak-22-plus.test.js`).
  The dose counts: `ACWY-TRAVEL-BOOSTER-GAP` exempts it (`acwyIsRoutineBooster`), and the 8-week
  minimum judges it. The travel/lab/outbreak boosters then run every 5 years from it (given at
  7 or older). **Asplenia, complement and HIV are unchanged** (owner): their own schedule
  replaces the routine one (ACIP: *"a child with HIV infection who received MenACWY at age 9
  years should receive the next dose at age 14 years"*). One helper in `recommend.js`,
  `routineSixteenBoosterOwed`. Test `regression-2026-11-18-phase5-16y-booster-exposure.test.js`;
  swept by `sweep-never-events.test.js` property 15 (never a later next MenACWY date than with
  no box, 10–21 y).

### Any Two MenACWY Doses (owner C11, D5)
- **8 weeks** between any two MenACWY doses, less the 4-day grace
  (`MENACWY_ANY_TWO_DOSES_MIN_GAP`, row `ACWY-ANY-TWO-DOSES-GAP`; ACIP 2020: *"provided that
  an 8-week minimum interval between doses is maintained"*; CDSI's smallest MenACWY gap is
  the same). Was 4 weeks — ACIP's MenB repeat rule (finding R-4a).
- **After a too-young first dose too** (owner D5, 2026-11-17): with no dose counted yet, the
  repeat waits the same **8 weeks** after it. E1's earlier 4 weeks (and its constant,
  `MENACWY_REPEAT_DOSE_FLOOR`) is gone — 4 weeks is MenB's repeat interval, not MenACWY's.
- The card holds the same floors after a dose that did not count (`applyRepeatFloor`).

### Unknown Brand (owner C13)
- A MenACWY dose of unknown brand counts from **2 months** (`MENACWY_UNKNOWN_BRAND_MIN_AGE_MONTHS`
  = Menveo's floor; CDSI's unspecified-MenACWY floor), not MenQuadfi's 6 weeks.

## MenB Schedule

### Shared Decision (Healthy, 16–23y)
- 2-dose primary at **0 and 6 months for BOTH brands** — ACIP Oct 2024 (`mm7349a3`)
  changed the MenB-4C interval and superseded the old brand-split table.
- Dose 2 given **under 4 weeks** after dose 1 (less the 4-day grace) does **not** count
  (owner C12, 2026-11-15; ACIP 2020 `acip2020MenbRepeat4Weeks`; CDSI: 4 weeks less 4 days).
  Row `MENB-HEALTHY-DOSE-2-GAP`. The repeat is timed from it (Ruling D).
- Dose 2 given 4 weeks to <6 months after dose 1 is **valid, not invalid**: it counts, and a
  third **rescue** dose is then due ≥4 months after dose 2 (`menbSeriesInfo()` flips the total
  to 3). Compared on the calendar, not 183 days (P0-4), **with the 4-day grace** (owner C7,
  2026-11-15): a dose 2 given 1–4 days before 6 months completes the series
  (`menbHealthyDose2Early()`). A rescue dose that itself came too
  soon is repeated ≥4 months after IT (Ruling D).
- A planned 3-dose accelerated series (0, 1–2, 6m) is allowed where rapid protection is
  needed (e.g. college entry <6 months away).
- Age gate: 192m–276m (16th birthday through 23y11m); not below 192m. ACIP prefers 16–18y
  (M16), but being past 18 does not make the patient ineligible.

### High-Risk (asplenia, SCD, complement, microbiologist, outbreak_b)
- Note: **HIV, immunocomp, and HSCT are NOT MenB high-risk indications**
- Both 4C (Bexsero/Penmenvy) and FHbp (Trumenba/Penbraya) families: 3-dose primary
- D2: ≥4 weeks after D1 (high-risk) vs ≥6 months (healthy). **The high-risk card advises
  1 month after D1** (the start of ACIP mm7349a3's *"0, 1–2, and 6 months"*) **and states the
  4-week minimum beside it**: "Next dose due <D1 + 1 month>" over "It can be given from
  <D1 + 4 weeks> if needed (minimum 4 weeks)" — owner STOP F1 Q9a, 2026-11-17, matching
  PneumoVax C10-2. A dose given at 4 weeks still counts (the rule row is unchanged). Not
  after a dose that did not count: a repeat is spaced by the minimum (Ruling D).
  `MENB_HIGHRISK_D2_ROUTINE_MONTHS`. CDSI recommends 4 weeks: a named DELIBERATE family.
- D3 **forecast**: ≥6 months from D1 AND ≥4 months from D2 (later of the two floors).
- D3 **already given**: counts if ≥4 months after D2, whatever the gap from D1 (owner C5,
  2026-11-15: no source voids it; CDSI's floor from D1 is 0 days). Row
  `MENB-HIGHRISK-DOSE-3-FROM-DOSE-1` is kept as an `enforcement: 'none'` row saying so.
- **D3 is NOT needed when D2 already landed ≥6 months after D1** (P1-2, 2026-09-17).
  CDC MenB special situations, verbatim: *"3-dose series at 0, 1–2, 6 months (if dose 2
  was administered at least 6 months after dose 1, dose 3 not needed; …)"*. The total
  comes from `seriesTotals.js` → `menbSeriesInfo()`, compared on the calendar (P0-4).
  `recommend.js` reads that total rather than a literal 3, so a patient whose
  D2 came six months on reaches the booster phase after two doses. **With the 4-day
  grace** (owner D4, 2026-11-17): a D2 1–4 days short of 6 months also completes it.
- **An early D3 is NOT counted; it is repeated** (owner M1, 2026-11-20, "follow CDSI";
  reverses the 2026-09-17 "credited, and a 4th dose is owed" rule built from CDC's schedule
  notes). A high-risk D3 given under 4 months after D2 and under 6 months after D1 is
  "Not counted — repeat" and is repeated at least 4 months after it; D2 keeps its number. ACIP mm7349a3 (Dec 12, 2024; read live
  2026-11-20): *"If the third dose is administered <4 months after the second dose, the dose
  should be repeated ≥4 months after the last dose, unless the third dose was administered
  ≥6 months after the first dose."* CDSI 4.65, both increased-risk series, dose 3: absolute
  minimum "4 months - 4 days" from the previous dose, allowable "6 months - 4 days" from
  dose 1. There is no high-risk 4-dose series any more (`menbSeriesInfo()` never returns 4).
  One test decides it, `menbHighRiskDose3Early(d1, prev, d3)` in `seriesTotals.js`, read by
  the rule row (`MENB-HIGHRISK-EARLY-DOSE-3`) and the card:
  - **C6 (owner, 2026-11-15) — the MMWR "unless":** a D3 ≥6 months after D1 counts even if
    under 4 months after D2. **With the 4-day grace** (owner D3, 2026-11-17).
  - **C7 (owner, 2026-11-15):** the 4-month line takes the 4-day grace.
  - **M1c (owner, 2026-11-20), narrowed by M1d (owner, 2026-11-21) — the repeat:** it
    counts only ≥4 months after the dose that did not count ("the last dose"), with the grace.
    The 6-months-after-D1 "unless" decides only whether the FIRST D3 counts; it never makes
    the repeat count (`isRepeat` in `menbHighRiskDose3Early`). Jan 1, Feb 1, Apr 1 → repeat
    due Aug 1; a repeat on Jul 10 is "Not counted — repeat" too. CDSI's allowable interval
    would count it; ACIP's sentence ties the "unless" to the third dose, and ACIP wins
    (`docs/archive/decisions-2026-11-21-menb-repeat-dose3.md`). `prev` is the last dose GIVEN (Ruling D anchor). ACIP Best
    Practice (read live 2026-11-20): *"The repeat dose should be spaced after the invalid dose
    by the recommended minimum interval"*. A dose not counted for another reason (the other
    MenB product) keeps its 4-week repeat gap (`MENB-REPEAT-GAP`, E2).
  - **M1b (owner, 2026-11-20) — the repeat's date:** the card advises the latest of 4 months
    after the dose that did not count, 4 months after D2 and 6 months after D1, and states the
    earliest valid date beside it (`minimumBesideRoutine()`), never under the 4-week floor after
    a dose that did not count. Jan 1, Feb 1, Feb 15 → due Jul 1, earliest valid Jun 15.
- First booster: ≥1 year after the LAST PRIMARY dose (D3, or the repeat that counted, or D2
  when D2 was ≥6 months after D1). Read from `menbSeriesInfo()`, never a literal 3.
- Subsequent boosters: every 2 years

### Min Age ≥10y (120m)
Enforced on EVERY dose (D1 and D2/D3+), not just D1. Implemented in `validate.js` per-dose brand `minAgeM` check.

### MenB Antigen-Family Lock
Products within a family:
- **MenB-4C**: Bexsero, Penmenvy
- **MenB-FHbp**: Trumenba, Penbraya

Once D1 brand is known, subsequent doses must stay in the same family. Family anchor = first KNOWN-brand dose.
A wrong-family dose does not count; the next dose of the established family waits at least 4
weeks after it (E2, Ruling D section above). With one dose of each product, the card also
offers finishing with the other product instead (D8).

## Pentavalent (Penbraya/Penmenvy)

Eligible only when MenACWY is due today, MenB is due today **or can be given today**, AND age ≥10y. Never appear in the standalone MenB brand list.

**"Can be given today" (owner F2a, 2026-11-18):** MenB high-risk dose 2 between its 4-week minimum
and its 1-month routine date (STOP F1 Q9a) carries `canGiveToday` on its card, and that opens the
combined shot. **Dose 2 only** (owner MQ6-h, 2026-11-21): a repeated dose 3 does not carry it, so
the combined shot never puts a repeated dose 3 in before its advised date (it could have been 16
days early). ACIP mm7501a2: *"may be used when both MenACWY and MenB are indicated at the same
visit"*; CDC adult notes: *"when both vaccines would be given on the same clinic day"*. The panel
then reads *"MenACWY is due today; MenB dose 2 can be given today (its 4-week minimum has passed).
One pentavalent (MenABCWY) dose may replace both."* and the summary line never calls MenB due.
Infant MenACWY's gap (Q9b) does not carry the flag: under 10 y, the pentavalent never applies.
On those days the card's badge reads **"Next dose not yet due"** (owner MQ6-f, 2026-11-21, "Yes,
both match", reversing the 2026-11-18 "Can be given today" badge): follow the standard schedule
when it can be followed; a dose at the minimum still counts. The date line says "Next dose due
<date>" and the note "It can be given today if needed", as on the infant MenACWY card and in
PneumoVax. No badge reads "Can be given today", and the summary line no longer adds "MenB dose 2
can be given today." `statusPillLabel` in `RecCard.jsx`; test
`regression-2026-11-18-phase5-gap-badge.test.jsx`.
Test: `regression-2026-11-18-phase5-q9a-consequences.test.js` and
`regression-2026-11-18-phase5-pentavalent-in-gap-ui.test.jsx`; swept by
`sweep-never-events.test.js` property 14 (offered exactly when MenACWY is due and MenB is due
or dose 2 can be given today; no badge reads "Can be given today"; only MenB dose 2 carries the
flag; a repeated dose 3 never opens the combined shot before MenB is due).

**Penbraya may not be repeated inside 6 months** (P1-4, 2026-09-17). CDC, MenB special
situations: *"Penbraya may be used for additional MenACWY and MenB doses (including booster
doses) if both would be given on the same clinic day and **at least 6 months have elapsed
since most recent Penbraya dose**."* The clock is read off the CREDITED history, so a
Penbraya typed on either step counts (G1). When this rules out the only pentavalent the
patient's antigen family allows, `pentavalent.eligible` goes false and
`pentavalent.unavailableReason` says why — the card then shows the existing "two separate
vaccines" banner plus that line. Withholding the combined shot never withholds the vaccine:
the separate MenB card still offers Trumenba the same day.

**Penmenvy follows the same 6-month rule** (N1, owner ruling 2026-11-15). The CDC
schedule-notes page names only Penbraya (it never mentions Penmenvy, and predates its
recommendation), so this was first scoped to Penbraya. The Penmenvy MMWR states it, read live
2026-11-15 (mm7501a2, Jan 8 2026): *"Persons at increased risk for meningococcal disease who
receive a dose of MenACWY-CRM/MenB-4C and who are recommended to receive additional doses of
MenACWY and MenB <6 months after a dose of pentavalent meningococcal vaccine should receive
separate MenACWY and MenB-4C vaccines, rather than MenACWY-CRM/MenB-4C."* Each brand is timed
from its own last dose; the antigen-family lock already prevents switching brands. Test:
`regression-2026-11-15-n1-penmenvy-six-months.test.js`.

**"Use Trumenba for MenB dose 2 after a Penbraya" needs no code** (P1-4, checked not
assumed). CDC: *"if Penbraya is used for dose 1 MenB, MenB-FHbp (Trumenba) should be
administered for dose 2 MenB."* The antigen-family lock already produces exactly that, and
the pentavalent card cannot reintroduce Penbraya for such a patient because G1's crediting
also completes their routine MenACWY series, so MenACWY is never due again. That chain is
what makes this safe rather than lucky — it is pinned by tests, because narrowing G1 would
silently turn it into a real defect.

**A pentavalent in the recorded history counts for BOTH vaccines** (G1, 2026-09-16). One entry, on either history step, is credited to the MenACWY series and the MenB series: `src/logic/pentavalentCredit.js` runs before any walk, adds a copy tagged `creditedFrom` to the other list, and de-duplicates a shot recorded on both steps (matched on brand + date). Dose numbers are independent per vaccine; the MenB antigen family locks from either step; the row is edited or deleted where it was entered. Do not re-implement this in a surface — both the engine and the record panel read the one merged history off `recommend().history`.

## History Entry — Doses Dated in the Future

A dose whose date is after today is rejected by `futureDatedProblem()` in
`validate.js`, before any vaccine-specific rule runs: it does not count, it does
not advance the series, and it carries `recordProblem: true` so the walk does not
append the "repeat this dose only" advice (nothing was given to repeat). A dose
dated today is not future-dated and counts normally. The date input's `max` uses
`todayISO()`, not `new Date().toISOString()`, so it is not a day ahead of the
clinician in a UTC-behind timezone.

## History Entry — The Same Dose Recorded Twice

`duplicateEntryProblem()` in `validate.js` flags a dated row whose date already
appears on a **kept** row of the same vaccine: it carries `recordProblem:
'duplicate'`, does not count, and does not collect the "repeat this dose only"
advice. Matched against `kept` rather than every row walked, so a row matching a
dose that was itself dropped is graded normally. Brands that differ between the
two rows are named in the reason, since one of them must be wrong.
## History Entry — How an Undated Dose Gets Onto the Record (K1)

K1 (2026-09-24). A dose row has two optional fields, so an empty row used to
mean two different things at once and the app guessed the second:

1. "I clicked + Add dose and have not typed anything yet."
2. "This patient definitely had a dose. I have no card, so I do not know when
   it was given or which brand it was."

It guessed (2) — `analyzeHistory()` filtered out only `null`/`undefined` rows —
so a row nobody had touched was graded as a dose of unknown date. Measured: one
empty row moved a healthy 16-year-old's MenACWY card from catch-up to
booster-due, and the Results "Recorded doses" panel recalculates live, so the
answer on screen changed the moment "+ Add dose" was clicked.

The clinician now says which one they mean. An otherwise-empty row shows a tick,
"A dose was given, but the date and brand are unknown", which sets
`detailsUnknown: true` on the row. With the tick the row is a dose of unknown
date — since STOP C C1 shown but not counted (see "A Dose With No Date Does Not
Count"). Without it the row is one
nobody filled in, and:

- `isBlankDoseRow()` (`doseIdentity.js`) calls it blank — meaning it carries no
  information at all, not merely no date and no brand. Anything present and
  meaningful (including `ageMonths`, the age-at-dose the engine also reads)
  keeps the row, because discarding a row that holds real information would
  delete a dose the clinician recorded.
- `analyzeHistory()` ignores it, which is what stops the live Results panel
  moving the answer before anything is typed.
- Leaving a history step, or closing the "Recorded doses" panel, sweeps it out
  of state — every blank row, not just a trailing one. The sweep never fires
  while the clinician is still in the list: every new row starts blank and
  would vanish as it appeared.

## A Dose With No Date Does Not Count (STOP C C1, 2026-11-15)

Owner answer C1: an undated dose does **not** count. CDC General Best Practices, Timing and
Spacing (read live 2026-11-16): *"With the exception of influenza vaccine and PPSV23,
providers should only accept written, dated records as evidence of vaccination"*, and *"If
records cannot be located within a reasonable time, these persons should be considered
susceptible and started on the age-appropriate vaccination schedule."*

- **Validator** (`doseRules.js` rows `ACWY-UNDATED-NOT-COUNTED`, `MENB-UNDATED-NOT-COUNTED`,
  replacing the old `…-UNDATED-COUNTS`): the dose is kept on the record and shown, graded as a
  record problem (`recordProblem: 'undated'`), so it is not counted, gets no "repeat this dose
  only" advice (no dose is known to have been given at a wrong time) and never starts a clock.
  The rows above them still decide first where they say more (a brand licensed above the
  patient's age today; a healthy MenB dose that must have been given before 16).
- **Chip** (`doseChipLabel.js`): "No date recorded — not counted". **Dose editor**: a row with
  a brand or the "details unknown" tick but no date says the same under the row.
- **Card** (`recommend.js`): schedules as if the dose had not been given — it only ever sees
  counted doses. The card's old "recorded doses have no date … cannot be confirmed" caveat and
  the "≥16y dose not confirmed" catch-up label were removed, as was the high-risk MenB row
  `MENB-HIGHRISK-DOSE-2-UNVERIFIABLE` (C17: dose 1 with no date is no longer dose 1).
- **Retired with it:** the G6 question for an undated dose past the series total ("Extra
  dose? — no date recorded") and the G8 re-walk (an undated row taking a dated dose's place).
  An undated row is never counted, so it can neither close a series nor push out a dated dose,
  and it is never asserted to be an extra dose.
- **PneumoVax** still counts an undated PCV dose; the owner asked for the same question there
  (C1 follow-up). Not changed by this repo.

## Complement — Single Merged Risk Factor

`complement` covers both persistent complement deficiency AND complement-inhibitor therapy (eculizumab/ravulizumab) — they share the identical schedule class (`primary2` + high-risk MenB). Tests use id `'complement'`. Do not re-split without reason.
