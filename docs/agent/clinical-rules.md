# MeningoVax — Clinical Rules Reference

**Last verified against code:** 2026-09-16.

The load-bearing numbers here are asserted against the code by
`src/logic/__tests__/rule-docs-match-code.test.js`. Change a rule without changing this
file and the suite fails, naming the sentence. The plain-English, owner-facing version of
the same rules is [meningococcal-rules-summary.md](meningococcal-rules-summary.md), which
is the source of truth synced to vaxapp.

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
  series (≥12wk after D2 AND ≥12mo age; enforced in `validate.js`, P1-3). Unknown D2 age
  falls back to 4.
- D1 at 7–23m: 2-dose primary, D2 ≥12 weeks after D1 AND at ≥12 months of age (M5 — this
  band was 3 doses before 2026-09-15).
- ≥2y: 2-dose primary (D2 ≥8 weeks after D1)

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

## History Entry — Doses Without Dates

Dose counting works by array length without dates. Dates are only used for:
1. Interval timing (`dueToday` / `earliestNextDate`)
2. `ageAtDose` rules (e.g. "MenACWY dose at ≥16y completes the college/adolescent schedule")

When a date is missing, `ageAtDose` returns null and age-at-dose rules conservatively do not fire (engine recommends rather than assuming coverage). The college-dorm branch explicitly explains this in its note.

## Complement — Single Merged Risk Factor

`complement` covers both persistent complement deficiency AND complement-inhibitor therapy (eculizumab/ravulizumab) — they share the identical schedule class (`primary2` + high-risk MenB). Tests use id `'complement'`. Do not re-split without reason.
