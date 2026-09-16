# Meningococcal Vaccine Rules — Plain-English Summary

**Purpose:** a single place to check "when is MenACWY / MenB due" without reading
code. Written for the owner (a clinician), not for an engineer. This is the
**source of truth** — MeningoVax is edited first; any change here must be
carried over to vaxapp's copy at `docs/agent/meningococcal-rules-summary.md`.

**Last verified against code:** 2026-09-16, after the 2026-09-15 dose-counter and
primary/booster-boundary fixes (M5, M9, M10, M12, M16-M18, P0-1 to P0-5, P1-1 to P1-3).

This file is no longer kept honest by memory alone. The test
`src/logic/__tests__/rule-docs-match-code.test.js` reads each load-bearing rule out of
the code and fails if this document stops saying the same thing, naming the file and the
sentence. Change a rule without changing this file and the suite goes red.

**Authority rule (2026-08-10):** ACIP/CDC/AAP/immunize.org over FDA package inserts.
Within that group, AAP is a tiebreak, not a ranking: where ACIP/CDC and AAP agree, cite
either; where they disagree, AAP governs; never adopt a CDC revision recommending fewer
doses or narrower eligibility than AAP; where AAP is silent, CDC/MMWR stands.
CDSI "preferable" windows are ignored — only CDSI absolute min/max ages are
enforced. Full citations live in `src/data/refs.js`.

---

## 1. MenACWY (serogroups A, C, W, Y)

### Routine schedule (no risk factor)
- **Not due before age 11.**
- **11–12 years:** Dose 1.
- **16 years:** booster (this is the "real" booster — a dose 1 given at 11–12
  does not itself count as the 16y booster).
- **17–21 years, no dose recorded on/after the 16th birthday:** one catch-up
  dose. Because it's given at ≥16, no further booster is needed. Especially
  called out for first-year college students in dorms.
- **≥22 years, healthy, no risk factor:** not indicated.
- **Golden rule that cuts across all the bands above:** *any* dose given at
  age ≥16 satisfies the adolescent schedule — no further routine doses,
  regardless of current age.

### Doses given before age 10 don't count
A MenACWY dose given before the patient turned 10 is **valid** (it wasn't
given too early for the vaccine itself) but does **not** advance the routine
11-12y/16y series — it's treated as if it hadn't happened for counting
purposes. This only applies to healthy patients; a high-risk infant series
(below) is allowed to start before 10 and those doses do count.

### High-risk (asplenia/sickle cell, persistent complement deficiency,
complement-inhibitor therapy [eculizumab/ravulizumab], HIV)
- **2-dose primary series**, ≥8 weeks apart (≥2 years old), then boosters.
- **Infants.** MenACWY is not routinely given to healthy infants, but three
  indications put a baby on the infant series: medical high risk, **travel**, and an
  **A/C/W/Y outbreak**. A travelling or outbreak-exposed infant gets the *same infant
  series* as a high-risk one — ACIP prints the identical "2–23 months" row in Tables
  4–6, 8 and 9. Microbiologists and military recruits are excluded: ACIP gives them no
  infant row at all.
  - Dose 1 at 2 months: 4-dose Menveo series (2, 4, 6, 12 months). No shortcut.
  - Dose 1 at 3–6 months: 3 **or** 4 doses. The **"3-dose shortcut"**: if dose 2 landed
    at 7 months or later, the series completes in 3 doses — the last one ≥12 weeks
    after dose 2 **and** after the first birthday. If dose 2 came earlier, or its age
    is unknown, it stays a 4-dose series.
  - Dose 1 at 7–23 months: 2-dose primary. Dose 2 must be both ≥12 weeks after dose 1
    **and** not before 12 months old.
  - The length is fixed by the age at dose 1 and never changes afterwards — a child who
    started at 4 months is still on a 4-dose series at age 6.
- **Booster cadence**, keyed off the age at the **last dose of the primary series** —
  the dose that actually starts the clock. For a baby who began at 2 months that is
  dose 4, not dose 2:
  - Primary completed before age 7: first booster in **3 years**, then every 5 years.
  - Primary completed at age 7 or older: first booster in **5 years**, then every 5 years.
  - Completion age unknown: treated conservatively as "before 7" (3-year first booster).
  - Only the *first* booster varies. Every booster after it is 5 years.

### Single-dose indications (one primary dose, no standing countdown)
"Single" means the *primary series* is one dose — not that the patient may never
receive another.
- **Military recruits**: one documented dose satisfies the recruitment requirement.
  ACIP also gives recruits a booster every 5 years *on the basis of assignment*, and the
  **Department of Defense** sets that requirement according to high-risk travel. The app
  cannot see the assignment, so it computes no date; the card says to check the service's
  current requirement rather than assume nothing further is due.
- **Serogroup A/C/W/Y outbreak exposure**: one dose covers the outbreak. If the patient
  is identified as being at increased risk in an outbreak *again*, a single **top-up**
  dose is given once ≥3 years (under age 7 today) or ≥5 years (age 7 or older today)
  have passed since the last dose. It is driven by re-exposure, not by a repeating
  schedule. Note the clock: this threshold keys off the patient's age **today**, where
  every other 3-vs-5-year rule keys off the age at the primary dose.
- **First-year college students in dorms**: one dose satisfies the requirement *only if
  given at ≥16 years old* — and then permanently. There is no 5-year expiry (owner
  decision, 2026-09-15: ACIP's footnote governs, not immunize.org's enrolment-recency
  job aid). An earlier dose does not count for this requirement; a fresh dose is needed
  at ≥16.

### Single dose + ongoing booster
- **Travellers** to hyperendemic/epidemic regions (including Hajj pilgrims, the
  sub-Saharan "meningitis belt"): 1 dose, then re-vaccinate while the risk continues.
  The first booster is at **3 years** if the primary dose was given before age 7,
  otherwise 5 years; every booster after that is 5 years.
- **Microbiologists** routinely handling *N. meningitidis*: 1 dose, then every 5 years
  while the exposure continues — a flat interval with no under-7 variation, because
  ACIP's microbiologist table covers ages ≥10 only.

---

## 2. MenB (serogroup B)

MenB vaccines (Bexsero, Trumenba, and the pentavalents Penmenvy/Penbraya) are
**licensed from age 10 only** — never given younger, no exceptions.

### Healthy patients, no risk factor: shared clinical decision-making
- **Window: 16 years through 23 years 11 months** (preferably offered at
  16–18). Not indicated before 16 or at/after 24 without a risk factor.
- **2-dose schedule**, ≥6 months apart (standard). If faster protection is
  needed (e.g. starting college within 6 months), a 3-dose accelerated
  schedule (0, 1–2, 6 months) can be used instead.
- **Dose 2 given early** (<6 months after dose 1) is **not invalid** — it's
  accepted, but a third "rescue" dose is then required ≥4 months after dose 2
  to complete the series.

### Doses given before age 16 (healthy patients) don't count
Mirrors the MenACWY pre-age-10 rule above: a MenB dose given before 16 to a
patient with **no current MenB risk factor** is validly given (it met the
age-10 product floor) but does **not** count toward the healthy 2-dose
series. Reason: MenB antibody protection wanes within about a year, so a dose
given at, say, 10 provides no protection by 16. (Shipped 2026-07-23, P0-1 —
previously this silently under-counted and could tell a healthy 16-year-old
with an old dose "you're done" when they weren't.)

### High-risk (asplenia/sickle cell, persistent complement deficiency,
complement-inhibitor therapy, microbiologist, serogroup B outbreak)
- Eligible starting at age 10 (no upper age limit).
- **3-dose primary**: 0, 1–2 months, 6 months.
  - Dose 2: ≥4 weeks after dose 1.
  - Dose 3: ≥6 months after dose 1 **and** ≥4 months after dose 2 (both must
    be satisfied — whichever is later wins).
- **Boosters**: first booster 1 year after completing the primary series,
  then every 2 years while the risk condition persists.
- **Not** a MenB indication: HIV alone, immunocompromise generally, or HSCT
  alone — only the specific list above triggers high-risk MenB.

### The two antigen families are NOT interchangeable
- **MenB-4C family:** Bexsero, Penmenvy.
- **MenB-FHbp family:** Trumenba, Penbraya.

Whichever family the first known-brand dose belongs to, every later dose
(including a pentavalent substitution) must stay in that same family. If the
family is ever mismatched, that dose doesn't count and needs to be repeated
in the correct family.

### Pregnancy
MenB is deferred during pregnancy **unless** a high-risk indication overrides
it (asplenia, complement deficiency/inhibitor therapy, microbiologist, or an
active serogroup B outbreak) — in which case the high-risk schedule still
applies.

---

## 3. Pentavalent (MenABCWY: Penbraya, Penmenvy)

A single pentavalent shot can substitute for two separate injections **only**
when, at the same visit: the patient is ≥10 years old, a MenACWY dose is due
today, AND a MenB dose is due today (MenB "due" includes the 16–23y
shared-decision window — it doesn't have to be a hard requirement, just
on-the-table today).

- **Penmenvy** = MenB-4C family → only offered/continued if the established
  family is 4C (or no family established yet).
- **Penbraya** = MenB-FHbp family → only offered/continued if FHbp (or none
  established yet).
- The pentavalent never appears as an option in the plain MenB dose list —
  only in its own dedicated recommendation.

### A pentavalent already in the record counts for BOTH vaccines

The rules above are about *giving* a pentavalent. This one is about a pentavalent
the patient has **already had**. It is a single injection that counts as a MenACWY
dose **and** a MenB dose, so the app credits both families no matter which history
step it was typed into:

- **Record it once, on either step.** The other step then says the dose is already
  counted there and asks you not to enter it twice.
- **Dose numbers stay separate per vaccine.** The same shot can be MenACWY dose 3
  and MenB dose 1.
- **It sets the MenB antigen family from either step** (Penbraya → FHbp,
  Penmenvy → 4C). A Bexsero recorded after a Penbraya is flagged as a family
  mismatch even when the Penbraya was entered on the MenACWY step.
- **Editing or deleting the row moves both halves at once**, because there is only
  ever one row — the copy shown in the other vaccine's record is marked
  "one shot covering both — recorded under MenACWY/MenB" and is edited where it
  was entered.
- **The same shot recorded on both steps counts once**, not twice (matched on brand
  and date).

Why: CDC's child/adolescent schedule notes call a single Penbraya dose "an
alternative to separate administration of MenACWY and MenB", and tell you that
"if Penbraya is used for dose 1 MenB, MenB-FHbp (Trumenba) should be administered
for dose 2 MenB" — that sentence only makes sense if the pentavalent dose *is*
MenB dose 1. (Verified live 2026-09-16:
https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html and
ACIP MMWR 2024;73(15), https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm)

---

## 4. Dose-counting mechanics (applies to both vaccines)

- **No date recorded:** the dose still counts toward the series (assuming it
  was given at a valid age), but it can't anchor interval math for later
  doses, and can't be used for age-at-dose rules (like "was this the ≥16y
  booster dose?").
- **Given below the minimum age for the brand:** invalid — does not count.
  Repeat that dose only; do not restart the whole series.
- **Given too soon after the previous dose** (violates a minimum interval):
  invalid — does not count. Repeat that dose only.
- **Given before age 10 (MenACWY) / before age 16 (MenB), no current risk
  factor:** valid, but doesn't advance the series (see sections above) —
  different from "invalid," no repeat needed, it's just not counted.
- **Dated in the future:** not counted. The record lists doses the patient has
  already received, so a date after today is a typo (usually a mistyped year)
  or an appointment that has not happened yet. The app says the date is the
  problem and asks for it to be corrected — it does **not** say to repeat the
  dose, because no dose was given. A dose dated *today* counts normally.
- **The same date recorded twice:** the second row is treated as the same dose
  entered twice, not as a dose given 0 days after the previous one. It does not
  count (the shot counts once, on the first row), and the app asks for the
  duplicate row to be corrected or removed rather than telling anyone to repeat
  a dose the patient has had. Two doses of the same vaccine are never given on
  the same day. If the row it would duplicate was itself dropped, this rule does
  not apply — nothing counted on that date.
- Doses are re-evaluated in order against the doses already *kept* so far —
  so if an early dose is dropped, a later dose isn't wrongly flagged as "too
  soon" relative to the dropped one.

---

## Where this is implemented

| Rule area | File |
|---|---|
| Per-dose validity, counting, age exclusions | `src/logic/validate.js` |
| What's due today / next, boosters, pentavalent gate | `src/logic/recommend.js` |
| Risk factor → schedule class mapping | `src/data/riskFactors.js` |
| Brand → antigen family, min ages | `src/data/brands.js` |
| Citations | `src/data/refs.js` |

## Keeping this in sync

This doc exists because rules drift as new test cases surface edge cases.
**Whenever `validate.js` or `recommend.js` changes a rule described above,
update this file in the same commit/PR** — and then port the change to
vaxapp's copy. Don't let this document silently go stale; if you're not sure
it's current, re-derive the relevant section from the code rather than
trusting it.
