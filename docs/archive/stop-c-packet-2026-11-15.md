# STOP C — decision packet 1 (the clinical questions), 2026-11-15

**What this is.** The port plan's STOP C: every place where MeningoVax's dose rules and the sources
part ways, put to the owner one patient at a time. **Nothing is changed until she answers**;
answers are applied in Phase 3 (one PR per family, every moved answer explained).

Every patient below was run through the real engine on 2026-11-15 (today = 2026-11-15 unless
stated). Every quote was read live that day in a real browser; exact text and links are in
`src/data/refs.js`. "Patients touched" = saved test patients (17,580) with a dose this rule decides
today — **not** a count of answers that would move (that is measured when each change is built).

Order: most clinical weight first. Asked in batches of four.

---

## Batch 1

### C1 — A dose recorded with no date (rows `ACWY-UNDATED-COUNTS`, `MENB-UNDATED-COUNTS`)

- **Patient:** 20 y, asplenia. Menveo, no date; Menveo 2026-01-10.
  **App today:** counts both → primary series complete, "Booster … next 2031-01-10".
  **Control** (same, without the undated dose): "Dose 2 of 2 (high-risk primary series)", due today.
- **Sources:** ACIP General Best Practice Guidelines, Timing and Spacing (page updated 2024-07-24):
  *"With the exception of influenza vaccine and PPSV23, providers should only accept written, dated
  records as evidence of vaccination"*; *"If records cannot be located within a reasonable time,
  these persons should be considered susceptible and started on the age-appropriate vaccination
  schedule."* The Pink Book (ch. 6, 2021) says the same ("In most cases …"). AAP Red Book not read
  (not freely available).
- **Recommendation:** an undated dose does **not** count; the chip says so ("No date — not counted")
  and the card schedules as if it were not given. Push-back: clinicians often know a dose was given
  without its date, and an extra MenACWY/MenB dose is low-harm; option B keeps counting it with a
  stronger note.
- **Patients touched:** 0 saved patients have an undated dose (a known gap in the grid).
- **Knock-on:** if "not counted", Q4 row `MENB-HIGHRISK-DOSE-2-UNVERIFIABLE` (C17) disappears.

### C2 — Ruling D: where a repeat dose is measured from (Q1, R-2)

- **Patient:** 20 y, asplenia, today 2026-09-01. Menveo 2026-08-01; Menveo 2026-08-22 (3 weeks —
  does not count). **App today:** "Dose 2 of 2", next **2026-09-26** (8 weeks from 8/1, the dose
  that counted). **Control** (only the 8/1 dose): also 2026-09-26.
- **Source:** ACIP General Best Practices, Timing and Spacing (read live 2026-11-15): *"The repeat
  dose should be spaced after the invalid dose by the recommended minimum interval."* →
  **2026-10-17** (8 weeks after 8/22).
- **Recommendation:** measure the repeat from the dose actually given (8/22), as PneumoVax does
  (Ruling D, PR #83): dose numbers and totals stay on doses that counted; only the clock moves. On
  all three surfaces (validator, card, chip). MeningoVax's rulebook §4 currently states the opposite
  and would be rewritten.
- **Patients touched:** every patient with a dose that does not count for timing (not yet measured;
  measured when built).

### C3 — Bexsero at 0 and 1 month given before 24 October 2024 (N2)

- **Patient (high-risk):** 21 y, asplenia. Bexsero 2023-01-01, 2023-02-15. **App today:** "Dose 3
  of 3 (high-risk, 4C)", due today. **Patient (healthy):** 21 y. Bexsero 2022-11-01, 2022-12-01.
  **App today:** "Dose 3 of 3 (rescue: dose 2 given early)"; the dose 2 chip says a third dose "is
  now required". **Control:** the same healthy doses in 2025-11/12 → also dose 3 (correct: the new
  schedule applies).
- **Source:** ACIP October 2024 (mm7349a3): *"There is no recommendation to administer additional
  doses to persons vaccinated with MenB-4C before October 24, 2024, using a 0- and 1-month dosing
  schedule."* It names no risk group. CDSI agrees (completes both; its cutoff is 25 October, one day
  later than ACIP's wording).
- **Recommendation:** Bexsero doses 1 and 2 ≥4 weeks apart, both before 2024-10-24, complete the
  primary series. High-risk → next is the booster 1 year after dose 2 (they "remain … at increased
  risk"); healthy → Complete. Cutoff as ACIP words it (before 24 October).
- **Patients touched:** none in the saved grid (its dates are recent).

### C4 — A pentavalent given at 26 or older (N1)

- **Patient:** born 1998-01-01, asplenia. Penbraya 2025-06-01 (age 27). **App today:** counts it for
  both → "Dose 2 of 2" MenACWY and "Dose 2 of 3" MenB due today. **Control:** same dose at 25 → the
  same answer. The app also **offers** both pentavalents to a 30-year-old with asplenia.
- **Sources:** ACIP (Penbraya mm7315a4; Penmenvy mm7501a2): may be used for *"persons aged ≥10 years
  who are at increased risk for meningococcal disease"* — no upper age. CDC adult notes (updated
  2025-07-02): *"Adults may receive a single dose of Penbraya … when both vaccines would be given on
  the same clinic day."* Both MMWRs state the licence as *"10–25 years"*; CDSI stops at 26 (the
  licence).
- **Recommendation:** keep counting and keep offering (ACIP/CDC over the FDA licence, the app's
  authority rule). Push-back: CDSI calls the dose not allowable; a clinician whose registry runs on
  CDSI will see it rejected there — a one-line note on the card could say so.
- **Patients touched:** 330 saved patients have a pentavalent at 26 or older.

## Batch 2 — high-risk MenB dose 2 and dose 3

### C5 — High-risk MenB dose 3 under 6 months from dose 1 (R-4b)

- **Patient:** 20 y, asplenia. Bexsero 2026-01-10, 2026-02-10, 2026-06-15 (5 months from dose 1,
  4 months 5 days from dose 2). **App today:** dose 3 **Invalid**, "repeat this dose only"; card
  "Dose 3 of 3" due today. **Control:** dose 3 on 2026-07-10 (6 months) → series complete, booster
  2027-07-10.
- **The app is inconsistent here:** Bexsero 2025-06-01, 2025-07-05, 2025-11-02 (also 5 months from
  dose 1, but *only* 4 months less 3 days from dose 2) **counts** (with a 4th dose). The dose given
  better-spaced from dose 2 is treated worse.
- **Sources:** ACIP 2024 gives *"0, 1–2, and 6 months"* as the schedule and states the only repeat
  rule against dose 2: *"If the third dose is administered <4 months after the second dose, the dose
  should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months
  after the first dose."* No sentence read voids a dose 3 for being under 6 months from dose 1. CDSI's
  floor from dose 1 is 0 days.
- **Recommendation:** a dose 3 already given ≥4 months after dose 2 counts, whatever the gap from
  dose 1. The forecast keeps both lines (≥6 months from dose 1 and ≥4 from dose 2, as CLAUDE.md
  requires) — this is only about a dose already given.
- **Patients touched:** 0 saved patients today.

### C6 — High-risk MenB dose 3 under 4 months after dose 2, but ≥6 months after dose 1

- **Patient:** 20 y, asplenia. Bexsero 2025-10-01, 2026-03-01, 2026-04-15 (6½ months from dose 1,
  6 weeks after dose 2). **App today:** counts, then "Dose 4 of 4 (extra dose: dose 3 given early)"
  due today. **Control:** dose 3 on 2026-07-05 → complete, booster 2027-07-05.
- **Sources:** ACIP 2024 (above): repeat *"unless the third dose was administered ≥6 months after
  the first dose"*. CDC's schedule notes give the repeat rule **without** the "unless" — the two CDC
  sources differ; the notes summarise the MMWR. CDSI follows the "unless".
- **Recommendation:** follow the MMWR — no 4th dose when dose 3 is ≥6 months after dose 1.
- **Patients touched:** 280 saved patients have a dose decided by this rule (not all would move).

### C7 — The 4-day grace on a gap that decides whether one more dose is owed (N3; and high-risk MenB dose 3 at 4 months)

- **Patient:** born 2008-01-01, healthy. Trumenba 2026-01-01 and 2026-06-29 (2 days short of
  6 months). **App today:** "Dose 3 of 3 (rescue: dose 2 given early)". **Control:** dose 2 on
  2026-07-01 → "Complete (2-dose series)".
- **Sources:** ACIP: *"the 2 doses should be separated by 6 months. If the second dose is
  administered <6 months after the first dose, a third dose should be administered"*. CDSI gives the
  6-month line the 4-day grace (complete). Your B-1 ruling (2026-11-15, age lines): use the grace
  "only when it helps" — B-1 was about age lines, not gaps, so this is a new question.
- **Recommendation:** yes, the grace applies here too (it means one dose fewer), and the same answer
  to high-risk MenB dose 3 just under 4 months after dose 2.
- **Patients touched:** not separated from C9's 2,240.

### C8 — High-risk MenB dose 2 under 4 weeks after dose 1

- **Patient:** 20 y, asplenia. Bexsero 2026-01-10, 2026-02-01 (22 days). **App today:** dose 2
  Invalid, repeat; card "Dose 2 of 3". **Control:** 2026-02-10 (31 days) → counts, "Dose 3 of 3".
- **Sources:** ACIP 2024 schedule *"0, 1–2, and 6 months"*; ACIP 2020 (MenB section): *"a minimum
  interval of 4 weeks should be used between any 2 doses"* (said of repeats). CDSI: 4 weeks less
  4 days, a hard minimum.
- **Recommendation:** keep it as a floor (CDC's software and ACIP's MenB 4-week sentence agree);
  relabel the row as sourced, not "schedule only".
- **Patients touched:** 280.

## Batch 3 — boosters and MenACWY gaps

### C9 — A booster given early (medical high risk): MenACWY under 3/5 years; MenB under 1/2 years

- **Patient:** 26 y, asplenia. Menveo 2015-01-01, 2015-03-01; booster 2019-12-01 (4 years 9
  months). **App today:** booster Invalid, "repeat"; card "Booster" due today. **Control:** booster
  2020-03-01 → counts, next booster due today. MenB the same: booster 11 months after the series →
  Invalid.
- **Sources:** ACIP gives timing as a schedule (*"Single dose at 5 yrs after primary vaccination and
  every 5 yrs thereafter"*; MenB *"1 year after primary series completion, then every 2–3 years"*).
  CDSI treats 5 years (3 years; 1 and 2 years for MenB) less 4 days as a hard minimum.
- **Recommendation:** keep as floors and label them "CDC's software (CDSI)" — the PneumoVax method
  counts an early dose only where no CDC source sets a minimum, and here CDC's software does.
- **Patients touched:** 56 (MenACWY); MenB 0.

### C10 — Travel, microbiologist and outbreak boosters: no gap is checked

- **Patient:** 36 y, travel. Menveo 2022-01-01, Menveo 2022-02-12 (6 weeks later). **App today:**
  the second dose counts as the **booster** → "Booster (dose 3, every 5 years)", next 2027-02-12.
  **Control:** one Menveo 2022-01-01 → "Booster … next 2027-01-01".
- **Sources:** ACIP's travel table gives the same 3/5-year booster schedule; CDSI floors those
  boosters at 3/5 years less 4 days. The card advises 5 years; the record checks none.
- **Recommendation:** the same floor as medical high risk (C9), so a dose 6 weeks later does not
  count as the 5-year booster.
- **Patients touched:** not countable from the rule (it decides nothing today).

### C11 — "At least 4 weeks between any two MenACWY doses" (R-4a)

- **Patient:** 36 y, travel. Menveo 2022-01-01, 2022-01-15 (2 weeks). **App today:** dose 2 Invalid
  ("Minimum interval between any two MenACWY doses is 4 weeks"). At 6 weeks it counts (C10).
- **Sources:** ACIP's only "4 weeks between any 2 doses" sentence is in the **MenB** section. For
  MenACWY ACIP states 8 weeks (*"provided that an 8-week minimum interval between doses is
  maintained"*; the 16-year booster *"as long as a minimum interval of 8 weeks between doses is
  maintained"*). CDSI's smallest MenACWY gap is 8 weeks less 4 days.
- **Recommendation:** replace the 4-week rule with ACIP's 8 weeks between any two MenACWY doses.
- **Patients touched:** 352.

### C12 — Healthy MenB dose 2: no lower limit (R-4c)

- **Patient:** 17 y, healthy. Bexsero 2026-09-01, 2026-09-08 (7 days). **App today:** dose 2 counts
  ("accepted (not invalid)"), rescue dose 3 2027-01-08. **Control:** dose 2 at 5 months → also
  counts, rescue dose 3.
- **Sources:** ACIP 2020 MenB: *"a minimum interval of 4 weeks should be used between any 2 doses"*.
  CDSI: 4 weeks less 4 days for dose 2, both brand families.
- **Recommendation:** a dose 2 under 4 weeks does not count (repeat ≥4 weeks after it); 4 weeks to
  6 months counts, rescue dose 3 as today.
- **Patients touched:** 2,240 saved patients have a dose decided by this row (most are 4 weeks–6
  months and would not move).

## Batch 4 — MenQuadfi from 6 weeks, upper ages, the pentavalent split

### C13 — An unknown-brand MenACWY at 6–7 weeks (N5a)

- **Patient:** born 2026-03-01, asplenia. MenACWY brand unknown, 2026-04-15 (6 weeks 3 days),
  high-risk then. **App today:** counts as infant dose 1 ("it might have been MenQuadfi"); dose 2
  due today. **Control:** the same dose recorded as Menveo → Invalid (below 2 months).
- **Sources:** your 2026-09-23 decision: MenQuadfi from 6 weeks (AAP). CDSI's "unspecified" MenACWY
  starts at 2 months less 4 days. The decision was about MenQuadfi, not unknown brands.
- **Recommendation:** an unknown brand counts from 2 months (the age every MenACWY product shares),
  not 6 weeks: the 6 weeks is MenQuadfi's alone.

### C14 — A MenQuadfi dose 1 of the infant series at 6–7 weeks (N5b)

- **Patient:** as C13, the dose recorded as MenQuadfi. **App today:** counts as dose 1 of the infant
  series. **Sources:** CDSI 4.65 lists MenQuadfi from 6 weeks as a product, but its infant series
  still starts at 2 months less 4 days; CDC's notes say MenQuadfi from 2 years; AAP from 6 weeks.
- **Recommendation:** keep counting it (the AAP position you adopted, applied to its own product).

### C15 — Upper ages for counting a dose (N4)

- **Patient:** 22 y, healthy, first MenQuadfi at 20. **App today:** counts → Complete. **Source:**
  CDSI sets routine MenACWY dose 1 max 19 y; the app's own catch-up card runs 19–21 y. Low stakes:
  no more doses are owed either way.
- **Recommendation:** no change (never refuse a recorded dose for being given older).

### C16 — A pentavalent rejected for MenB: does it count for MenACWY? (Q3, R-8)

- **Patient:** 17 y, asplenia. Bexsero 2026-01-10, then Penbraya 2026-03-10. **App today:** MenB:
  Penbraya Invalid (wrong family; Bexsero family started). MenACWY: the same Penbraya **counts** as
  dose 1 → "Dose 2 of 2" due today.
- **Source:** ACIP (mm7315a4): *"MenACWY-TT/MenB-FHbp doses deviating from the licensed 6-month
  interval can be considered valid for MenACWY or MenB if the timing would otherwise have been valid
  for that component."* — ACIP judges each part on its own.
- **Recommendation:** keep: it counts and sets the clock for MenACWY.

## Q4 — rows with no source

### C17 — High-risk MenB dose 2 when dose 1 has no date (`MENB-HIGHRISK-DOSE-2-UNVERIFIABLE`)

Moot if C1 = "an undated dose does not count". Otherwise: keep as an app rule (counts with a note).

### C18 — "Extra": a dose past the series total (`SERIES-CAP-EXTRA-DOSE`)

- **Patient:** 20 y, healthy. MenQuadfi at 11, 16 and 18. **App today:** the third: "Given after the
  2-dose series was already complete: this dose does not extend the series." Card Complete.
- **Recommendation:** keep as an app rule; the label's words are Phase 4's Q8 ("Extra" = not asked
  for that day?), so only "keep it" is asked now.

---

## Found while building this packet (not a STOP C question)

**A wording bug on screen:** the minimum-age sentence prints a product's minimum age in **days**
when it is stated in months: *"below the minimum age of 120 days for Penbraya"* (10 years),
*"2 days for Menveo"* (2 months), *"9 days for Menactra"* (9 months). In the saved patients'
screens: 462 Penbraya, 322 Penmenvy, 294 Menveo 1-vial, 154 Menactra, 112 Menveo lines (each twice:
the sentence and its detail). Cause: `fmtMinAge()` in `doseRules.js` treats every
`{unit, value}` age as days, but `brandMinAge()` returns `{unit:'months'}` for every product
except MenQuadfi (since M2, 2026-09-22). The verdicts are right; only the words are wrong. For the
fix queue (one item, test first).

## Answers — STOP C ANSWERED 2026-11-15 (owner)

Asked in five rounds (some questions re-asked in plainer words at her request). Applied in Phase 3,
each with `verify-clinical-source` re-read before the code changes. **No code changed at STOP C.**

| # | Owner answer | What changes in Phase 3 |
|---|---|---|
| C1 | **Not counted.** Asked first what PneumoVax does: it counts an undated dose ("Counted — date not recorded", never a timing anchor) and never read CDC's rule. She chose CDC: *"Not counted; ask for PCV"* | MeningoVax: an undated dose does not count; chip says no date, not counted; the card schedules as if not given. **PneumoVax:** ask the same question for PCV (PPSV23 stays counted — CDC's own exception) |
| C2 | **Ruling D: measure from the dose given** | The repeat is spaced from the dose that did not count (validator, card, chip); rulebook §4 rewritten |
| C3 | **Current schedule for everyone** — her words: *"If guidelines have been updated, patients who received vaccines prior to guideline updates should receive updated guidance not follow prior guidelines."* Confirmed after being shown that ACIP says "no recommendation to administer additional doses" for these patients | **No change.** Old Bexsero 0 + 1 month courses before 24 Oct 2024 keep getting dose 3 (high-risk) or the rescue dose 3 (healthy). A deliberate, owner-decided difference from ACIP mm7349a3 and CDSI (`MENB-4C-OLD-2-DOSE-COURSE` → owner) |
| C4 | **Keep counting and offering** pentavalents from 26 | No change; `PENTAVALENT-UPPER-AGE` → owner-decided difference from CDSI |
| C5 | **A dose 3 ≥4 months after dose 2 counts**, whatever the gap from dose 1 | `MENB-HIGHRISK-DOSE-3-FROM-DOSE-1` no longer voids a dose already given; the forecast keeps both lines |
| C6 | **Follow the MMWR** (she pasted both mm7349a3 paragraphs: the 2-dose rescue rule; and for the 3-dose series, no dose 3 if dose 2 ≥6 months after dose 1, and the repeat "unless the third dose was administered ≥6 months after the first dose") | `MENB-HIGHRISK-EARLY-DOSE-3` gets the "unless". Checked: the app already skips dose 3 when high-risk dose 2 is ≥6 months after dose 1 |
| C7 | **Use the 4-day grace** at the healthy MenB 6-month line and at high-risk MenB dose 3's 4-month line | One dose fewer at those lines |
| C8 | **Keep the 4-week minimum** for high-risk MenB dose 2 | No answer moves; the row is relabelled as sourced (ACIP MenB 4 weeks; CDSI) |
| C9 | **Keep the booster minimums** (MenACWY 3/5 years, MenB 1/2 years, less 4 days) **and** her point, confirmed: *"I thought it should not be repeated now but 5 years after the invalid dose"* — the repeat is timed from the early booster (C2's rule; CDC: "The repeat dose should be spaced after the invalid dose by the recommended minimum interval") | Early booster: not counted, repeat 5 (or 3; MenB 1/2) years after it, not "due today" |
| C10 | **Travel / microbiologist / outbreak boosters checked like high-risk ones** (asked twice; the first example was unclear) | A booster too soon is not counted; with C9 the next date is often the same, the chip changes |
| C11 | **8 weeks between any two MenACWY doses** (replaces the 4-week rule) | `ACWY-ANY-TWO-DOSES-GAP` becomes 8 weeks less 4 days |
| C12 | **Healthy MenB dose 2 under 4 weeks is not counted**; 4 weeks–6 months counts with the rescue dose as today | New lower limit; the repeat is spaced from the uncounted dose (C2) |
| C13 | **An unknown-brand MenACWY counts only from 2 months** | Unknown brand no longer gets MenQuadfi's 6 weeks. *Correction to the question as asked:* it said 2 months is "the age every MenACWY product shares"; that is wrong (Menactra started at 9 months). The basis is CDSI's unspecified-MenACWY minimum (2 months less 4 days) and Menveo's |
| C14 | **Keep counting** a MenQuadfi infant dose 1 from 6 weeks | No change; deliberate difference from CDSI's infant series |
| C15 | **No change** (never refuse a recorded dose for being given older) | `ROUTINE-UPPER-AGES` → owner-decided difference from CDSI |
| C16 | **Keep:** a pentavalent rejected for MenB still counts and sets the clock for MenACWY | No change (ACIP mm7315a4: valid "for that component") |
| C17 | Moot (C1: an undated dose does not count) | Row `MENB-HIGHRISK-DOSE-2-UNVERIFIABLE` goes with C1 |
| C18 | **Keep the rule; words at Phase 4 Q8** — and *"eventually would like all language to match what is in pneumovax"* | No change now; Phase 4/6 wording copies PneumoVax |

**Two follow-up answers, given 2026-11-15 while building C2 (Phase 3 family 1).** Asked because
C2's patient had a dose given too soon; these two cases have no "previous dose" gap to time from.

| # | Owner answer | What changes |
|---|---|---|
| E1 | **A too-young FIRST dose starts a 4-week wait** before it is repeated | A deliberate difference from CDC Timing and Spacing (*"repeated on or after the date when the child reaches at least the minimum age"*, `gbpTooYoungFirstDoseRepeat`); matches PneumoVax. Rows `ACWY-ANY-TWO-DOSES-GAP`, `MENB-REPEAT-GAP` |
| E2 | **After a wrong-family MenB dose, the next dose waits 4 weeks after it**, and is otherwise due when it would be due from the established family's doses. Also noted with E2: a card option to switch to the other family's product (the build commit `c0ec1ff` calls it "the owner's E2 alternative"; her exact words were not saved). ACIP 2020: *"one product should be selected for administration of an additional dose"* | 4-week floor built (`MENB-REPEAT-GAP`; `applyRepeatFloor`). **The switch-product option is NOT built** — open, to be asked as its own question |

**Not asked at STOP C, found while building it:** the minimum-age wording bug (above) — a fix-queue
item, not a clinical decision.
