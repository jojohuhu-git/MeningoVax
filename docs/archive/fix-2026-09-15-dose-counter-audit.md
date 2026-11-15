> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-09-15-dose-counter-audit.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# Fix queue — MeningoVax dose counter & primary/booster boundary audit (2026-09-15)

Read-only adversarial audit. Scope as set by the owner: **the dose counter and the
line between the primary series and the boosters** — every MenACWY schedule (routine,
medical high-risk, infant, travel, microbiologist, military, college, outbreak), every
MenB schedule (healthy, healthy-rescue, high-risk), pentavalent and post-HCT — looking
for wrong "Dose N of M", wrong primary/booster grouping, wrong booster clocks, and
places where the engine (`recommend.js`) and the validator (`validate.js`) disagree.

No engine code was changed by this audit. Everything below was reproduced by running
the app's own code; the headline case was also reproduced by driving the running app.

---

## Baseline (record before starting, re-check after every item)

| | |
|---|---|
| Branch / commit | `main` @ `8632cb2` |
| Test suite | `npx vitest run` → **534 passed, 0 failed** (verified 2026-09-15) |
| Dev server | `.claude/launch.json`, "MeningoVax dev server" (port 5179 from the vaxapp launch config) |
| Pre-existing failures | none |

## Ground rules that constrain these fixes (from CLAUDE.md)

- **Clinical authority**: ACIP/CDC/AAP/immunize.org over FDA labels. AAP is the tiebreak
  when AAP and CDC disagree. Fetch the page live and quote it (the `verify-clinical-source`
  skill) before changing any clinical rule — do not transcribe from this document.
- **Engine logic stays in the engine.** No booster cadence or series-length logic in
  components. `RecCard.jsx` must keep taking `primaryTotal` from the rec object.
- **`recommend.js` and `validate.js` must stay in sync.** Both already import
  `seriesTotals.js`; new answers belong there, not hand-typed in either caller.
- **Both test layers**: a logic test (node env) *and* a UI rendering test (happy-dom)
  for anything visible.
- **Do not revert these settled owner decisions** while fixing nearby code:
  M6 (a too-soon booster is rejected and repeated, not merely flagged), M12 (outbreak
  top-up is re-exposure driven, not a standing countdown), M17 (a ≥16y dose satisfies
  the college requirement permanently — the 5-year expiry was removed knowingly),
  M18 (military booster wording names DoD, no countdown), M5 (a 7–23-month start is a
  2-dose primary series).
- Root directory hygiene: this file lives in `.claude/prompts/`; the handoff goes to
  `docs/archive/`.

## Per-item workflow (one item, one commit)

1. Reproduce the finding exactly as written below; confirm you see the "actual".
2. Write the failing test first (both layers where the finding is visible).
3. Fix.
4. `npx vitest run` — full suite green, count ≥ 534.
5. Live-verify in the running app (drive it, don't ask the owner to check).
6. Commit naming the ID, e.g. `P0-1: an infant series stays a 4-dose series after the
   2nd birthday`.
7. Re-check the cross-repo note if the item has one.

---

# P0 — silent wrong answers

## P0-1 — The infant series ends at the 2nd birthday; the doses still owed turn into "boosters"

**Reproduce** (age 24 months, asplenia, both doses confirmed high-risk at the prompt):

| doses on record | app says | correct |
|---|---|---|
| 2 mo, 4 mo, patient 23 mo | "Dose 2 (infant high-risk series)", due today | (correct) |
| 2 mo, 4 mo, patient **24 mo** | **"Booster (dose 3, first booster, 3 years after primary)", not due until 2028-01-16** | Dose 3 of 4 now, ≥4 weeks after dose 2 |
| 2/4/6 mo, patient 24 mo | "Booster (dose 4, every 5 years)", next 2030-03-15 | Dose 4 of 4 now |
| 1 dose at 2 mo, patient 2y / 3y / 5y | "Dose 2 of 2 (high-risk primary series)" | doses 2–4 of a 4-dose series still owed |
| 2/4/6/12 mo + 4y, patient 8y (**the reported case**) | primary total 2 — see P1-2 | primary total 4 |

**Expected / source.** CDC child & adolescent immunization schedule notes, "Meningococcal
serogroup A,C,W,Y vaccination", special situations, Menveo — fetched live 2026-09-15:

> "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and 12 months)"
> "Dose 1 at age 7–23 months: 2-dose series (dose 2 at least 12 weeks after dose 1…)"
> "Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart"

The series length is set by the **age at dose 1**, permanently. It does not change because
the patient had a birthday.

**Suspected cause.** Two age gates that ask "today's age" where they should ask "age at
dose 1":
- `src/logic/recommend.js:155` — `if (am < M.y2 && menacwyInfantSeriesIndicated(riskIds))`
  is the only door into `menacwyInfantSeries()`. At 24 months a patient mid-series falls
  through to the generic ≥2y branch, which hard-codes `seriesTotal: 2` in three places
  (`recommend.js:165`, `:181`, `:198`).
- `src/logic/seriesTotals.js:99` — `if (am < 24 && …)` in `menacwySeriesInfo()`.
  Its sibling `menacwyPrimaryTotal()` (same file, line 198) already keys off `d1AgeM`
  and returns 4 — which is why the validator and the engine disagree (see P1-2).

**Fixture for the regression test.** age 24 mo, `['asplenia']`, MenACWY 2 mo + 4 mo,
both risk-at-dose answers "yes" → expect a rec whose label names dose **3 of 4**, due
today, `minIntervalDays` 28; and `menacwySeriesInfo` → `{ total: 4, primaryTotal: 4 }`.

**Cross-repo.** vaxapp already answers all of these correctly
(`src/logic/stateHelpers.js:480 menACWYPrimaryTotal` keys off `d1AgeM`;
`recommendations.js:891` has a "completing the primary series" branch). Port the shape,
don't invent one. Verified 2026-09-15 by running vaxapp's `genRecs()` on the same three
patients.

---

## P0-2 — Single-dose exposure schedules discard a later dose, then recommend that same dose again

**Reproduce** (all confirmed at the risk-at-dose prompt where one appears):

| patient | app says | correct |
|---|---|---|
| 18y, `college_dorm`, MenACWY at 14y **and 17y** | D2 chip **"Extra dose — beyond the indicated series total"**; card still says **"1 dose (booster at ≥16y)", due today** | the 17y dose satisfies the requirement — "Complete (dose given at ≥16y)" |
| 13y, `outbreak_acwy`, dose at 5y **and a top-up at 12y** | top-up chipped "Extra dose"; card still offers **"Outbreak top-up (dose 2)", due today** | top-up counted; no further dose |
| 22y, `military`, two doses 4 years apart | D2 "Extra dose", card "Complete" | the card's own note says ACIP boosters run every 5 years by assignment — the dose is not surplus |

A randomized sweep of 4,000 patients hit the "discarded a dose, still recommends one
today" pattern **115 times**, all in the outbreak/college/military classes.

**Why it is a P0.** The discarded dose is dropped from `kept`, so the engine re-plans
against a history that is missing a dose the patient really received, and recommends an
injection they do not need.

**Suspected cause.** `src/logic/seriesTotals.js:118` — `riskClass === 'single'` returns
`{ total: 1, hasBoosterPhase: false }`. `validate.js:776` (`runWalk()`) uses
`hasBoosterPhase === false` as licence to cap the series and drop the extra dose.
But all three "single" indications legitimately accept a later dose: the college rule is
satisfied *by* a ≥16y dose (M17), outbreak has the Table 8 top-up (M12), military has the
DoD 5-yearly booster (M18). Only "one dose and nothing ever again" deserves the cap, and
none of the three is that.

**Expected / source.** ACIP 2020 MMWR 69(RR-9) Table 10 footnote (college: a dose after
the 16th birthday needs no booster — i.e. it counts) and Table 8 (outbreak top-up
"if previously vaccinated and identified as being at increased risk"), both already
quoted in the code at `recommend.js:296-334`.

**Fixture.** 18y, `['college_dorm']`, doses at 14y and 17y → both doses counted
(`effectiveDoseNum` 1 and 2), card status `complete`, no dose due today.

---

## P0-3 — An infant outbreak series has doses 2–4 declared "Extra dose" the day the child turns 2

**Reproduce.** Age 3y, `['outbreak_acwy']`, MenACWY at 2, 4, 6 and 12 months.
**Actual:** D1 "Dose 1 of 1"; **D2, D3, D4 all chipped "Extra dose — beyond the indicated
series total"**; card "Complete for this outbreak".
At 18 months the same record reads "Dose 1 of 4 … Dose 4 of 4" with no extras.
Same patient with a single 2-month dose at age 3y → **"Complete for this outbreak"**
(an unfinished 4-dose series called complete).

**Expected.** ACIP 2020 MMWR 69(RR-9) Table 8 prints the same "2–23 mos" infant rows as
Tables 4–6 (this is the M10 finding, already accepted in this codebase); four correctly
spaced infant doses are a completed primary series, not one dose plus three surplus.

**Cause.** P0-1's age gate **and** P0-2's cap, compounding: past 24 months the outbreak
patient is `riskClass === 'single'`, so the series total collapses to 1 *and* the cap
throws away everything past it. Fixing P0-1 and P0-2 should fix this; keep it as its own
item so it gets its own regression test.

**Fixture.** age 36 mo, `['outbreak_acwy']`, doses 2/4/6/12 mo → four counted doses,
no `extraDose` flags, card "Complete (infant outbreak series)".

---

## P0-4 — A MenB series given exactly 6 calendar months apart is called "early" and a third dose is demanded

**Reproduce.** Healthy 19-year-old, Bexsero on **2025-01-15** and **2025-07-15**
(exactly six calendar months = 181 days).
**Actual:** card **"Dose 3 of 3 (rescue: dose 2 given early)", due today**; the series
total flips from 2 to 3; the dose's own reason line reads "Dose 2 was given ~6 months
after dose 1, less than the 6-month standard interval".
Move dose 2 two days later (2025-07-17) and the same patient reads "Complete (2-dose
series)".

**Frequency:** of 36 sampled start dates across 2025, **18** give a six-calendar-month
gap shorter than the 183 days the code requires (any gap starting Jan/Feb and several
others: 2025-01-15 → 2025-07-15 = 181 d).

**Same root, two more places:**
- High-risk MenB D3 "≥6 months from D1": D1 2019-01-15, D3 2019-07-15 → **invalid**,
  "Given only ~6 months after dose 1. High-risk D3 requires ≥6 months from D1", dose
  dropped and a repeat demanded.
- High-risk MenB D3 "≥4 months from D2": D2 2023-01-15, D3 2023-05-15 (120 days) →
  **invalid** for the same reason.

**Expected / source.** CDC child & adolescent schedule notes, MenB, fetched live
2026-09-15: *"2–dose series at least 6 months apart (if dose 2 is administered earlier
than 6 months, administer dose 3 at least 4 months after dose 2)"*. Six calendar months
apart **is** "at least 6 months apart"; it is not "earlier than 6 months".

**Cause.** `src/logic/dateUtils.js:58` — `DAYS.months(m) = Math.round(m * 30.4375)`, so
6 months = 183 days and 4 months = 122 days, while real calendar spans are 181–184 and
120–123. Consumers: `seriesTotals.js:155` (the rescue test that changes the series
total), `validate.js:102-109` (`MENB_HR_D3_MIN_FROM_D1`, `MENB_HR_D3_MIN_FROM_D2`,
`MENB_HEALTHY_D2_MIN_INTERVAL`, `MENB_RESCUE_D3_MIN_FROM_D2`), and the matching
`recommend.js` MenB branch.

**Suggested shape of the fix** (decide with the owner): compare **calendar months**
(same day-of-month N months later, clamped for short months) instead of average days,
in one shared helper in `dateUtils.js`, and have every "months"/"years" minimum use it.
Week-based minimums (4 weeks, 8 weeks, 12 weeks) are exact and must not change.

**Fixture.** healthy, age 228 mo, Bexsero 2025-01-15 + 2025-07-15 →
`menbSeriesInfo` `{ total: 2, primaryTotal: 2 }`, card `complete`, no rescue dose.

---

## P0-5 — A MenACWY booster given exactly 3 calendar years later is voided as "too soon"

**Reproduce.** Age 10y, asplenia. D1 2020-11-15, D2 2021-01-15 (both confirmed
high-risk), first booster **2024-01-15** — exactly three calendar years after D2
(1095 days, because no 29 February falls in that window).
**Actual:** D3 **invalid** — *"Booster given only ~3 years after the previous dose.
High-risk MenACWY boosters must be spaced ≥3 years. This dose is too soon and does not
count… repeat this dose only"* — the dose is dropped from the count and the card
re-offers the first booster as **due today**.
Dated one day later (2024-01-16 = 1096 days) the same dose counts and the next dose is
not due until 2029.

**Frequency:** 22 of 84 sampled monthly anniversaries between 2018 and 2024 are 1095 days.

**Expected / source.** CDC, "Meningococcal Vaccine Recommendations", fetched live
2026-09-15: *"administering a booster dose 3 years after completion of the primary series
and every 5 years thereafter"*. A dose on the three-year anniversary is on time.

**Cause.** `validate.js:98` `MENACWY_BOOSTER_3Y = DAYS.years(3)` = 1096, against a real
three-year span of 1095 or 1096 days. Same root as P0-4. (`DAYS.years(5)` = 1826 is safe;
five-year spans are always 1826–1827 days.)

**Cross-repo.** vaxapp uses the same 1096 constant
(`src/logic/stateHelpers.js:179 MENACWY_BOOSTER_3Y = 1096`). After fixing here, check
whether vaxapp voids the same dose and mirror the fix — the `vaccine-parity` skill applies.

**Fixture.** age 120 mo, `['asplenia']`, doses 2020-11-15, 2021-01-15, 2024-01-15, all
answered "yes" → third dose valid, `effectiveDoseNum` 3, next dose 2029-01-15.

---

# P1 — visibly wrong output

## P1-1 — The first booster after an infant series is scheduled five years out instead of three

**Reproduce.** Age 3y, asplenia, MenACWY at 2, 4, 6 and 12 months, no booster yet.
**Actual:** "Booster (dose 5, every 5 years)", next dose **2029-09-15**.
**Expected:** first booster three years after the series completed (completed at 12
months, well before age 7) → **2027-09-15**. vaxapp says 2027-09-15 and labels it
"first booster, 3 years (primary series completed before age 7)" — checked 2026-09-15.

**Source.** CDC, "Meningococcal Vaccine Recommendations" (live 2026-09-15):
*"a booster dose 3 years after completion of the primary series and every 5 years
thereafter"* for children under 7.

**Cause.** `src/logic/recommend.js:139` — `const isFirstBooster = given === 2;`. A
hard-coded 2 means "the first booster is always dose 3", which is only true for a series
that began at ≥2 years. With four infant doses on record the app believes the first
booster is already behind the patient. The validator has the correct form of this test
(`validate.js:379`, `effectiveIdx === primaryTotal`) — reuse it.

**Fixture.** age 36 mo, `['asplenia']`, doses at 2/4/6/12 mo → `earliestNextDate`
three years after the 12-month dose, label naming the first booster.

---

## P1-2 — "Primary series" / "Boosters" headings and the "Dose N of M" chips use a total keyed to today's age (the reported bug)

**Reproduce — live, in the running app.** DOB 2018-09-15 (8 years old today),
asplenia, MenACWY on 2018-11-15, 2019-01-15, 2019-03-15, 2019-09-15, 2022-09-15,
all five answered "Yes" at the risk-timing prompt.

**Actual** (copied from the page):

```
PRIMARY SERIES
  D1 · Nov 15, 2018 · age 9 weeks    Dose 1 of 2
  D2 · Jan 15, 2019 · age 4 months   Dose 2 of 2
BOOSTERS
  D3 · Mar 15, 2019 · age 6 months   Booster
  D4 · Sep 15, 2019 · age 12 months  Booster
  D5 · Sep 15, 2022 · age 4 years    Booster
```

**Expected:** D1–D4 are the primary series (dose 1 at 2 months → 4 doses at 2, 4, 6 and
12 months); only D5 is a booster — and it is the *first* booster, due 3 years after the
series completed, which is exactly when it was given.

**Cause.** `RecCard.jsx:81 doseRowsWithGroups()` groups on `rec.primaryTotal`, and every
≥2y high-risk rec carries `primaryTotal = seriesTotal = 2` (`rec()` at `recommend.js:77`
falls back to `seriesTotal` when `primaryTotal` is absent, and the three high-risk recs
never pass one). Meanwhile `validate.js:377` computes the same patient's primary total as
**4**. The engine and the validator disagree on the same question, which is the exact
failure mode `seriesTotals.js` was written to make impossible.

Fixing P0-1 fixes the number; this item exists so the **display** gets its own
regression test (a happy-dom test asserting the headings) and so the engine/validator
agreement is asserted directly.

**Fixture.** the patient above → headings split after D4; chips "Dose 1 of 4" … "Dose 4
of 4", then "Booster" for D5. Plus a pure-logic assertion that
`rec.primaryTotal === menacwyPrimaryTotal({…})` for a table of patients.

---

## P1-3 — The three-dose shortcut promises three doses, then asks for a fourth

**Reproduce.** Asplenia, D1 at 4 months, D2 at 8 months.
- At 10 months: card **"Dose 3 of 3 (infant high-risk, 3-dose shortcut)"**.
- Give that third dose at 12 months. At 18 months the card reads **"Dose 4 (infant
  high-risk series)", due today**, total 4.

The validator never believed the shortcut either: `menacwyPrimaryTotal` returns 4 for
these patients, so it disagrees with the "Dose 3 of 3" card as well.

**Expected / source.** CDC child & adolescent notes, fetched live 2026-09-15:
*"Dose 1 at age 3–6 months: 3- or 4-dose series (dose 2 [and dose 3 if applicable] at
least 8 weeks after previous dose until a dose is received at age 7 months or older,
followed by an additional dose at least 12 weeks later and after age 12 months)"* —
a dose 2 at ≥7 months plus one more dose ≥12 weeks later and after 12 months completes
the series at three doses. Either honour that in `seriesComplete` (`recommend.js:566`,
`given >= 4`) and in `menacwyInfantHighRiskTotal()`, or stop offering the shortcut.
Do not leave the card promising one number and the follow-up asking for another.

**Also decide (needs a live source check, do not guess):** the shortcut is currently
offered when dose 1 was at **2** months (`d1WasEarly = d1AgeM >= 2 && d1AgeM <= 6`,
`recommend.js:535`), but CDC gives a dose 1 at 2 months a flat 4-dose series and reserves
the 3-or-4-dose wording for 3–6 months. vaxapp has the same 2-month behaviour
(`stateHelpers.js:492-494`), so the two apps agree today — changing it is a cross-repo
change and needs the owner's go-ahead.

**Fixture.** asplenia, D1 4 mo, D2 8 mo, D3 12 mo, patient 18 mo → card says the series
is complete (or asks for dose 4 of 4 *and* the earlier card said "Dose 3 of 4") —
whichever way the rule lands, card, follow-up card and `menacwyPrimaryTotal` must all
say the same number.

---

## P1-4 — Before the risk-timing questions are answered, the app shows the most aggressive answer as if it were the recommendation

**Reproduce — live.** The P1-2 patient, *before* answering any of the five prompts.
**Actual:** page headline **"Due today: MenACWY."**, status pill **"Dose due today,
future boosters needed"**, card **"Dose 1 of 2 (high-risk primary series)"** — for a
child with five doses on record. The five "Needs input" prompts are further down the page.

**Why it is here.** A clinician who acts on the headline vaccinates a fully vaccinated
child. The conservative default (a pending dose does not count) is right for the *maths*;
showing it as a confident "due today" recommendation is what is wrong.

**This contradicts an earlier decision** (2026-07-23 handoff: pending doses are
excluded, conservatively, and the card is computed from what is left). It is on this
queue as a **decision for the owner**, not a silent change: options are (a) leave it,
(b) suppress the due-today headline and card while any dose is pending and say
"Answer the risk-timing questions below to get a recommendation", (c) keep the card but
change the pill to a neutral "Needs input" state. Recommend (b).

---

# P2 — traps, polish, copy

## P2-1 — `menacwyPrimaryTotal()` returns 2 for a routine patient
`seriesTotals.js:216` — with `riskClass === null` it falls through to
`MENACWY_HIGHRISK_PRIMARY_TOTAL` (2), but the routine primary series is 1 dose
(`MENACWY_ROUTINE_PRIMARY_TOTAL`). Harmless today only because its one caller
(`validate.js:378`) is gated on `riskClass` being truthy. A future caller will be wrong.

## P2-2 — Two routine recs forget to pass `primaryTotal`
`recommend.js:721` ("Booster (16y)" / "Dose 1 (catch-up, ≥16y…)") and `recommend.js:738`
(19–21y catch-up) omit it, so `rec()` defaults it to `seriesTotal` (2) and the grouping
would file a booster under "Primary series". Not reachable today (the doses that would
expose it are filtered out first), but it is the same hand-typed-total pattern that
caused F1 and P1-2.

## P2-3 — "Dose 2 of 2" chip sitting under a "BOOSTERS" heading
Routine 11y + 16y: the heading calls the 16-year dose a booster (correct — routine
primary total is 1) while the chip calls it "Dose 2 of 2" (also correct — ACIP calls the
routine schedule a 2-dose series). Both are defensible; together they read as a
contradiction. Owner copy decision.

## P2-4 — Booster due-dates land one day late
"Every 2–3 years" MenB boosters compute `DAYS.years(2) = 731`, so the earliest date shown
is the day after the two-year anniversary (e.g. last dose 2025-09-15 → shown 2027-09-16).
Same root as P0-4/P0-5; fixing the shared helper fixes this. (The constant's own comment
at `validate.js:106` says "730 d" while the code produces 731 — worth correcting too.)

---

## Recommended order

1. **P0-1** — the age gate. Everything else in the infant cluster hangs off it.
2. **P1-1** — the first-booster clock (same branch, same file, will conflict otherwise).
3. **P1-2** — the display + an engine/validator agreement test.
4. **P0-2**, then **P0-3** — the "single" cap and the infant-outbreak case it compounds.
5. **P0-4**, then **P0-5** — one shared calendar-interval helper, then its consumers.
6. **P1-3** — the shortcut (has an owner question inside it).
7. **P1-4** — owner decision before any code.
8. **P2-1 … P2-4** — cleanup, can be one commit.

## Things this audit deliberately did NOT touch

- The M6 decision that a genuinely too-soon booster is rejected and repeated. 324 of the
  4,000 swept patients had a dose voided that way; spot checks showed the rule working as
  designed. Only the calendar-boundary false rejections (P0-5) are in scope.
- MenB's "a dose before age 16 does not count for a healthy adolescent" rule (M16).
- Pentavalent (MenABCWY) and the post-HCT advisory: probed, no dose-counter or
  primary/booster defects found. The pentavalent card carries no dose numbering, and the
  HCT advisory correctly declines to schedule without an additional risk factor (P1,
  2026-09-14).
