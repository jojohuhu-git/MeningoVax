# MeningoVax — Clinical Rules Reference

**Last verified against code:** 2026-09-17 (P0-1, MenACWY infant primary intervals).

The load-bearing numbers here are asserted against the code by
`src/logic/__tests__/rule-docs-match-code.test.js`. Change a rule without changing this
file and the suite fails, naming the sentence. The plain-English, owner-facing version of
the same rules is [meningococcal-rules-summary.md](meningococcal-rules-summary.md), which
is the source of truth synced to vaxapp.

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
1. **The scheduler.** `dueToday` and `earliestNextDate` keep the real minimum — granting
   grace there would advertise a date 4 days early and actively advise giving doses before
   the minimum interval, which the CDC sentence does not permit. The app says "eligible on
   the 9th" and *accepts* a dose given on the 5th.
2. **Series-length tests** (`seriesTotals.js`, and the MenB "was dose 2 early?" test that
   decides whether a rescue dose is owed). Those decide how many doses a series HAS, not
   whether a dose was valid; grace there would REMOVE a dose from the plan, which the
   authority rule forbids.

Note this also applies in `recommend.js` wherever it asks "does this recorded dose count"
(e.g. `hasDoseAt16`) — not only in the validator. Those two used to disagree, so the record
panel counted a dose while the card went on asking for it.

## Source Priority

**ACIP/CDC/AAP/immunize.org over FDA package inserts.** Sources are listed at the top of `recommend.js` and in `refs.js`. Never revert to FDA-labeled ages without explicit instruction.

## MenACWY Schedule

### Routine Adolescent
- 11–12y: D1
- 16y: booster (D2)
- 17–21y with no dose on/after 16th birthday: catch-up D1 of 1 (no booster; especially for first-year college residence-hall students)
- ≥22y healthy: not indicated

### High-Risk Primary (asplenia, SCD, complement, HIV, `primary2` class)
Series length is keyed to the age at **D1** and is fixed for life (P0-1) — a patient who
started under 2y stays on the infant pathway however old they are now. Totals come from
`seriesTotals.js` → `menacwyInfantHighRiskTotal()`; never hand-type them.
- D1 at 2m: 4-dose primary (2/4/6/12m). Unconditional — no shortcut (P1-3).
- D1 at 3–6m: 3- **or** 4-dose. "3-dose shortcut": if D2 landed at ≥7m, D3 completes the
  series. Unknown D2 age falls back to 4.
- D1 at 7–23m: 2-dose primary, D2 ≥12 weeks after D1 AND at ≥12 months of age (M5 — this
  band was 3 doses before 2026-09-15).
- ≥2y: 2-dose primary (D2 ≥8 weeks after D1)

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
- Unknown completion age: conservative 3y for the first booster only
- Compared on the calendar, not in days (P0-5) — `DAYS.years(3)` = 1096 rejected a booster
  given on its exact three-year anniversary whenever no 29 February fell in the window.

### Single-Dose Indications (`single` class)
One PRIMARY dose — not "never another dose". All three keep `hasBoosterPhase: true` in
`seriesTotals.js` so a later dose is never discarded (P0-2).
- `college_dorm`: D1 only; a dose at ≥16y satisfies it **permanently** — no 5-year expiry
  (M17, owner decision 2026-09-15: ACIP Table 10's footnote over immunize.org P2018's
  enrolment-recency rule). This ≥16y rule applies uniquely to this class.
- `military`: D1 satisfies recruitment. Card also states ACIP's every-5-years-by-assignment
  booster and names the **Department of Defense** as the owner of that timing (M18); the
  app computes no date, since it cannot see the assignment.
- `acwy_outbreak`: D1 covers the outbreak. A **top-up** dose follows if the patient is
  identified at increased risk again and ≥3y (age <7 today) or ≥5y (age ≥7 today) have
  passed (M12, ACIP Table 8). Re-exposure driven, not a standing countdown. Note this
  threshold keys off age **today**, unlike Tables 4–6/9 which key off completion age.
- **Do not conflate these three.**

### Travel and Microbiologist (`single+boost` class)
- `travel`: D1, then first booster at **3y if the primary dose was given before age 7**,
  otherwise 5y; every later booster 5y (M9, ACIP Table 9).
- `microbiologist`: D1 + booster every 5 years, flat — ACIP Table 7 covers ages ≥10 and
  has no under-7 row, so the 3-year rule must NOT be extended to them (L2-3 corrected the
  card copy that implied it did).

## MenB Schedule

### Shared Decision (Healthy, 16–23y)
- 2-dose primary at **0 and 6 months for BOTH brands** — ACIP Oct 2024 (`mm7349a3`)
  changed the MenB-4C interval and superseded the old brand-split table.
- Dose 2 given <6 months after dose 1 is **valid, not invalid**: it counts, and a third
  **rescue** dose is then due ≥4 months after dose 2 (`menbSeriesInfo()` flips the total
  to 3). Compared on the calendar, not 183 days (P0-4).
- A planned 3-dose accelerated series (0, 1–2, 6m) is allowed where rapid protection is
  needed (e.g. college entry <6 months away).
- Age gate: 192m–276m (16th birthday through 23y11m); not below 192m. ACIP prefers 16–18y
  (M16), but being past 18 does not make the patient ineligible.

### High-Risk (asplenia, SCD, complement, microbiologist, outbreak_b)
- Note: **HIV, immunocomp, and HSCT are NOT MenB high-risk indications**
- Both 4C (Bexsero/Penmenvy) and FHbp (Trumenba/Penbraya) families: 3-dose primary
- D2: ≥4 weeks after D1 (high-risk) vs ≥6 months (healthy)
- D3: ≥6 months from D1 AND ≥4 months from D2 (later of the two floors)
- **D3 is NOT needed when D2 already landed ≥6 months after D1** (P1-2, 2026-09-17).
  CDC MenB special situations, verbatim: *"3-dose series at 0, 1–2, 6 months (if dose 2
  was administered at least 6 months after dose 1, dose 3 not needed; …)"*. The total
  comes from `seriesTotals.js` → `menbSeriesInfo()`, compared on the calendar (P0-4), and
  this is the exact mirror of the healthy rescue rule below it — same 6-month test, other
  direction. `recommend.js` reads that total rather than a literal 3, so a patient whose
  D2 came six months on reaches the booster phase after two doses.
- First booster: ≥1 year after series
- Subsequent boosters: every 2 years

### Min Age ≥10y (120m)
Enforced on EVERY dose (D1 and D2/D3+), not just D1. Implemented in `validate.js` per-dose brand `minAgeM` check.

### MenB Antigen-Family Lock
Products within a family:
- **MenB-4C**: Bexsero, Penmenvy
- **MenB-FHbp**: Trumenba, Penbraya

Once D1 brand is known, subsequent doses must stay in the same family. Family anchor = first KNOWN-brand dose.

## Pentavalent (Penbraya/Penmenvy)

Eligible only when BOTH MenACWY and MenB are due the same visit AND age ≥10y. Never appear in the standalone MenB brand list.

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
## History Entry — An Undated Dose Past the Series Total

G6 (2026-09-16, owner decision "ask, don't assert"). In the series-total cap in
`validate.js`, a row flagged `isExtra` that has **no date** carries
`extraDoseUnverified: true` and replacement wording that asks the question
("Do you mean this was an extra dose given?") instead of asserting the series
was already complete; `RecCard` maps that flag to the chip "Extra dose? — no
date recorded". A DATED extra keeps `extraDose` alone and the assertive chip.
The reasons are replaced rather than appended for the undated case, because the
base undated sentence ends "Dose is counted in the series" and would contradict
the line below it. No answer is stored: an extra dose is excluded from `kept`,
so the engine never sees the row and the recommendation is identical either way.

## History Entry — An Undated Dose Cannot Close the Routine Series

G8 (2026-09-16). Two rules, both saying that a blank date is the weakest thing
in the record:

1. **It cannot close the series.** In `seriesTotals.js`, the routine MenACWY
   total asks whether the 16-year booster is still owed, and an undated dose
   cannot prove it was given: `boosterStillOwed` is true when a dose's age is
   `null` (no date) *or* below 16 years. It used to ask only "is any dose
   before 16?", so an undated dose closed the series at 1 dose while
   `recommend.js` — asking the opposite question, "is any dose provably at
   ≥16y?" — went on offering the booster on the same card.
2. **It cannot take the place of a dose that has a date.** Undated rows sort
   first, so under a series cap they filled the slots and a DATED dose was the
   one dropped as "extra" — the app then re-offered a booster the record
   showed the patient had. `analyzeHistory()` re-walks with the dated doses
   first if the first pass dropped a dated dose while an undated row was kept.
   Each walk stays internally consistent; the finished pass is never edited.

When no dose on record can be placed at ≥16y and at least one has no date, the
card says so ("…recorded doses have no date, so a dose given at age 16 years or
older cannot be confirmed from this record. Adding the date may remove this
recommendation.") and the 19–21y catch-up label reads "≥16y dose not confirmed"
rather than "no dose at ≥16y", which the record cannot support.

## History Entry — Doses Without Dates

Dose counting works by array length without dates. Dates are only used for:
1. Interval timing (`dueToday` / `earliestNextDate`)
2. `ageAtDose` rules (e.g. "MenACWY dose at ≥16y completes the college/adolescent schedule")

When a date is missing, `ageAtDose` returns null and age-at-dose rules conservatively do not fire (engine recommends rather than assuming coverage). The college-dorm branch explicitly explains this in its note.

## Complement — Single Merged Risk Factor

`complement` covers both persistent complement deficiency AND complement-inhibitor therapy (eculizumab/ravulizumab) — they share the identical schedule class (`primary2` + high-risk MenB). Tests use id `'complement'`. Do not re-split without reason.
