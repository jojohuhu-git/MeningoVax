# Every place MeningoVax judges a recorded dose (Phase 0, item 0.4 — 2026-11-15)

Port plan item 0.4 (the plan lives in PneumoVax — see
`plan-2026-11-08-meningovax-port--SEE-PNEUMOVAX.md`). **Measured from the code on 2026-11-15,
branch `docs/2026-11-15-phase-0-measure`, nothing changed.** This is the list Phase 2's rule
table is built from: one row per rule, as the app **behaves today**, not as it should.

How to read it:
- **Verdict** is what the dose gets: *Not counted* (red "Invalid" chip, and the walk adds
  *"This dose does not count toward the series: repeat this dose only (do not restart the
  series)."* — `validate.js:1138`), *Not counted, no repeat sentence* (amber "Off-window - repeat"
  chip), *Counts with a note*, *Extra*, *Record problem*, or *Needs input*.
- **Measured from**: every gap below is measured from the **last dose that counted**
  (`prevKeptDated`, or the kept list), never from a dose that did not count. That is R-2: ACIP
  says the opposite (*"The repeat dose should be spaced after the invalid dose by the
  recommended minimum interval"*, CDC Timing and Spacing, read live today).
- **Grace**: the 4-day grace applies wherever the code calls `intervalMeetsMinimum`,
  `calendarIntervalMeetsMinimum`, `ageMeetsMinimum` or `ageMeetsMinimumDays`
  (`intervals.js:366–437`). Rows marked "no grace" use `calendarIntervalElapsed` on purpose
  (they decide how many doses a series has, and grace must never shorten a series).
- **CDSI** = CDC's 4.65 rule files in `scripts/cdsi/cdc-files/`. `absMin` above 0 means CDC's
  software treats it as a floor. CDSI is evidence, not an authority above CDC's wording.

## Checked first, for both vaccines (`validate.js:1107–1109`)

| # | Where | Condition | Verdict and chip | Source today |
|---|---|---|---|---|
| R1 | `validate.js:372` | Date after today | Record problem — "Date is in the future — not counted". **Red** chip (status is `invalid`). No repeat. | App rule (G3) |
| R2 | `validate.js:346` | Date before the date of birth (or a negative age) | Record problem — "Dated before birth — not counted". Red chip. | App rule (impossible P1-1) |
| R3 | `validate.js:398` | Same date as a dose already counted | Record problem — "Entered twice — this row not counted". Red chip. | App rule (G7) |

## MenACWY (`validateOneMenACWY`, `validate.js:432–770`)

| # | Where | Condition (grace?) | Verdict | Measured from | Source the code names | What the sources say (read live 2026-11-15) | CDSI 4.65 |
|---|---|---|---|---|---|---|---|
| A1 | `:451` | No date, and a **known** brand's minimum age is above the patient's age today | Not counted (+ repeat sentence) | — | brands.js | — | — |
| A2 | `:479` | Below the product's minimum age (Menveo 2-vial 2 months; Menveo 1-vial 10 years; MenQuadfi 6 weeks, in days). Grace yes | Not counted (+ repeat) | birth | brands.js; MenQuadfi 6 weeks is the owner's 2026-09-23 decision on AAP's word | CDC child notes: *"minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]"* | MenQuadfi 6 weeks − 4 days (4.65 release notes); infant series dose 1 absMin 2 months − 4 days |
| A3 | `:641` | Infant series (dose 1 under 2 years; asplenia, complement, HIV, travel, outbreak): an early dose < 8 weeks after the last counted dose, or the final primary dose < 12 weeks after it or before 12 months. Grace yes | Not counted (+ "This dose does not count; repeat it.") | last counted dose | CDC child notes | *"dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months"* | 2–23-month series: doses 2–4 absMin 8 weeks − 4 days; dose 5 absMin 12 weeks − 4 days and 12 months − 4 days |
| A4 | `:658` | Medical high risk, series begun at 2 years or older: dose 2 < 8 weeks after the last counted dose. Grace yes | Not counted (+ repeat) | last counted dose | ACIP 2020 | CDC child notes: *"Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart"* | risk 2-dose series dose 2 absMin 8 weeks − 4 days |
| A5 | `:714` | Medical high risk only (`primary2`): a booster sooner than 3 years (primary finished before 7, or age unknown) or 5 years (from 7; and every later booster). Grace yes, on the calendar | Not counted (+ repeat) | last counted dose | ACIP 2020 Tables 4–6 | ACIP: *"Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter"* — a **schedule**, not stated as a minimum. ACIP's only warning: boosters *"at an interval of <4 years are not licensed … and are considered off-label"* | risk 2-dose series dose 3 absMin 3 years − 4 days, dose 4 absMin 5 years − 4 days |
| A6 | `:727` | **Any** two MenACWY doses < 4 weeks apart. Grace yes | Not counted (+ repeat) | last counted dose | none for MenACWY — the code's own comment says the 4-week rule *"appears only in the MenB section"* | ACIP: *"the booster dose can be administered at any time, as long as a minimum interval of 8 weeks between doses is maintained"*; CDC catch-up: *"booster at age 16–18 years (minimum interval: 8 weeks)"*; CDC Table 3-2: MenACWY-1 → next, minimum 8 weeks | routine dose 2 absMin 8 weeks − 4 days |
| A7 | `:543` | No ongoing risk, not on the infant series, not an outbreak contact: dose before age 10. Grace yes | Not counted, amber "Off-window - repeat", no repeat sentence; reason cites ACIP | birth | `acwyBeforeAge10` | ACIP: *"Children who received MenACWY before age 10 years and with no ongoing risk … should still receive MenACWY according to the recommended adolescent schedule"* | routine dose 1 absMin 10 years |
| A8 | `:561`, `:570` | High risk now, dose before 10: unanswered → **Needs input**; answered No/Unsure → as A7 | Needs input / amber | birth | owner design 2026-07-23 | — | — |
| A9 | `:760` | Same patients as A7: the second counted dose given before 16. Grace yes | Not counted, amber "Off-window - repeat" | birth | `acwyRoutine1112and16` | ACIP: *"a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years"* | routine dose 2 absMin 16 years − 4 days |
| A10 | `:459` | No date, nothing else wrong | Counts; never a timing anchor | — | ACIP (any brand when unknown) | — | — |
| — | — | **Not checked at all:** the booster gap for travel, microbiologist and outbreak contacts (only A6's 4 weeks applies to them) | A dose 5 months after a travel dose counts as a **Booster** (measured, patient P2 in the report) | — | — | ACIP Table 9 travel: same 3/5-year booster wording as A5 | risk 1-dose series dose 2 absMin 3 years − 4 days, dose 3 absMin 5 years − 4 days |

## MenB (`validateOneMenB`, `validate.js:772–1072`)

| # | Where | Condition (grace?) | Verdict | Measured from | Source the code names | What the sources say (read live) | CDSI 4.65 |
|---|---|---|---|---|---|---|---|
| B1 | `:789` | No date and the patient is under 10 today | Not counted (+ repeat) | — | `menbLicensedAge1025` | CDC: *"minimum age: 10 years"* | absMin 10 years − 4 days |
| B2 | `:804` | No date, no MenB risk, patient under 16 today | Not counted, amber | — | `menbHealthyPreferredAge1618` | — | — |
| B3 | `:831` | Below 10 years at the dose. Grace yes | Not counted (+ repeat) | birth | `menbLicensedAge1025` | as B1 | absMin 10 years − 4 days |
| B4 | `:846` | No MenB risk: dose before 16. Grace yes | Not counted, amber "Off-window - repeat" | birth | owner decision 2026-07-23 (Option 1) | CDC: shared decision *"age 16–23 years (preferred age 16–18 years)"* | healthy series dose 1 **absMin 10 years − 4 days**, min 16 years — CDSI would count it |
| B5 | `:864`, `:873` | MenB risk now, dose before 16: unanswered → Needs input; No/Unsure → not counted | Needs input / amber | birth | owner design 2026-07-23 | — | — |
| B6 | `:903` | Antigen family differs from the first counted dose with a known brand | Not counted (+ repeat); detail: *"give the correct dose in the 4C family"* | first counted branded dose | ACIP 2020 | ACIP: *"MenB vaccines are not interchangeable, and the same vaccine product must be used for all doses"* | — |
| B7 | `:925` | High risk: dose 2 < 4 weeks after the last counted dose. Grace yes | Not counted (+ repeat) | last counted dose | mm7349a3 | mm7349a3: *"3-dose series at 0, 1–2, and 6 months"* | dose 2 rows: absMin 0 days and absMin 4 weeks − 4 days |
| B8 | `:922` | High risk dose 2, dose 1 undated | Counts, note "cannot be verified" | — | — | — | — |
| B9 | `:958` | High risk: dose 3 < 4 months after dose 2. **No grace** | **Counts**, note; a 4th dose is owed ≥ 4 months later | dose 2 | CDC child notes | CDC notes: *"if dose 3 is administered earlier than 4 months after dose 2, a 4th dose should be administered at least 4 months after dose 3"*. mm7349a3 adds: *"…the dose should be repeated ≥4 months after the last dose, **unless the third dose was administered ≥6 months after the first dose**"* — the app has no "unless" | dose 3: from dose 2 absMin 4 months − 4 days; from dose 1 absMin 0 days, **allowable** 6 months − 4 days |
| B10 | `:967` | High risk: dose 3 ≥ 4 months after dose 2 but < 6 months after dose 1. Grace yes | Not counted (+ repeat) | dose 1 | mm7349a3 schedule | no sentence read today states 6 months from dose 1 as a minimum; CDC Table 3-2 lists MenB-3 minimum age *"10 years (+ 6 months(c))"* | from dose 1: absMin **0 days** (preferable) — R-4b |
| B11 | `:999` | High risk: the extra 4th dose < 4 months after dose 3. Grace yes | Not counted (+ repeat) | dose 3 | CDC child notes | as B9 | — |
| B12 | `:1016` | High risk booster sooner than 1 year (first) or 2 years (later), counted in **days** (365 / 731), grace yes | Not counted (+ repeat) | last counted dose | ACIP 2020 | ACIP: *"a MenB booster dose 1 year after primary series completion, then every 2–3 years thereafter"* — schedule wording | dose 4 absMin 1 year − 4 days; dose 5 absMin 2 years − 4 days |
| B13 | `:1042` | Healthy: dose 2 < 6 months after dose 1. **No grace. No lower limit at all** | **Counts**, note; a rescue dose 3 is owed ≥ 4 months later | dose 1 | CDC notes; immunize.org | CDC: *"2–dose series at least 6 months apart (if dose 2 is administered earlier than 6 months, administer dose 3 at least 4 months after dose 2)"* | Bexsero 2-dose: a dose 2 row with absMin **4 weeks − 4 days**; Trumenba 2-dose: dose 2 absMin **4 months − 4 days** — R-4c |
| B14 | `:1061` | Healthy rescue dose 3 < 4 months after the early dose 2. Grace yes | Not counted (+ repeat) | dose 2 | CDC notes | as B13 | — |

## After the vaccine rules, for both (`runWalk`, `validate.js:1087–1237`)

| # | Where | Condition | Verdict |
|---|---|---|---|
| W1 | `:1127–1140` | Any Not-counted verdict that is not a record problem | Adds *"This dose does not count toward the series: repeat this dose only (do not restart the series)."* |
| W2 | `:1142` | Any "not counted toward the adolescent/healthy series" verdict (A7–A9, B2, B4, B5) | Left out of the count; no repeat sentence; amber chip "Off-window - repeat" (`doseChipLabel.js`) |
| W3 | `:1164` | A counted dose past the series total on a schedule with no booster phase (routine MenACWY, single-dose indications, healthy MenB) | **Extra**: "Extra dose — more than this series needs" (undated: "Extra dose? — no date recorded") |
| W4 | `:1298` | An undated row took a dated dose's place in a capped series | Walk is run again with dated doses first |

## Pentavalent (Penbraya, Penmenvy)

`pentavalentCredit.js` copies a pentavalent typed into one list into the other, then each list
is judged on its own by the rules above. Measured: a Penbraya rejected for MenB (wrong family
after Bexsero) **still counts as MenACWY dose 1** and starts the MenACWY clock (report patient
P7). ACIP on Penbraya (mm7315a4) and Penmenvy (mm7501a2): doses *"can be considered valid for
MenACWY or MenB if the timing would otherwise have been valid for that component"* — each part
judged on its own.
