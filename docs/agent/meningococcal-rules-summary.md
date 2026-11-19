# Meningococcal Vaccine Rules — Plain-English Summary

**Purpose:** a single place to check "when is MenACWY / MenB due" without reading
code. Written for the owner (a clinician), not for an engineer. This is the
**source of truth**.

**Last verified against code:** 2026-11-16 (STOP B B-2–B-5 and the Complete rule; MenACWY
gaps, STOP C C10, C11, C13; MenB dose 3, C5–C7; an undated dose does not count, C1);
before that 2026-09-23 (MenQuadfi 6-week licence floor, M3-M5);
before that 2026-09-17 (P0-1, MenACWY infant primary intervals), and 2026-09-16, after
the 2026-09-15 dose-counter and primary/booster-boundary fixes (M5, M9, M10, M12,
M16-M18, P0-1 to P0-5, P1-1 to P1-3).

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

## 0. A dose given a few days early still counts

CDC's general rule, added to this app on 2026-09-17:

> "Vaccine doses administered ≤4 days before the minimum age or interval are
> considered valid. Doses of any vaccine administered ≥5 days earlier than the
> minimum age or minimum interval should not be counted as valid and should be
> repeated as age appropriate."

So a MenACWY dose given three days before a patient's 16th birthday **counts** as
the 16-year booster; one given five days before does not. The same four days
apply to every interval in this document as well as every age. Until this was
added, every age and every gap was a hard edge, and the app asked for repeat
injections that ACIP counts.

Two deliberate limits:

- **It does not move the dates the app suggests.** If the next dose is due on the
  9th, the app still says the 9th — it simply accepts a dose given on the 5th.
  Accepting a dose that was given early is not the same as advising one.
- **It shortens a series only where you ruled it should** (STOP C C7,
  2026-11-15, and D3/D4, 2026-11-17: use the grace where it means one dose
  fewer): a healthy MenB dose 2 given 1–4 days before 6 months completes the
  2-dose series (no rescue dose); a high-risk MenB dose 3 given 1–4 days before
  4 months after dose 2 is not "early" (no 4th dose); a high-risk dose 3 given
  1–4 days before 6 months after dose 1 needs no 4th dose (D3); a high-risk
  dose 2 given 1–4 days before 6 months after dose 1 needs no dose 3 (D4).
- **MenACWY ages 3 months, 7 months, 2 years and 16 years** (your B-1 answer,
  2026-11-15; 3 months and 16 years added 2026-11-17): a dose given 1–4 days
  before one of these birthdays is read as given on it **only if that means
  fewer doses**. A travel baby given Menveo 2 days before 7 months needs 2
  doses, not 4; a travel child given Menveo 2 days before age 2 needs 1 dose; a
  teen given the booster 4 days before 16 is complete. This holds from the day
  the dose is given, not only after the birthday. If reading it on the birthday
  would owe the same or more (for example, it would stop a later dose
  counting), the real age stands.
- **Not age 7** (your answer, 2026-11-17): a series finished 1–4 days before the
  7th birthday keeps the 3-year booster.
  Every other line that decides how many doses a series has keeps the full
  interval.

---

## 1. MenACWY (serogroups A, C, W, Y)

### Routine schedule (no risk factor)
- **Not due before age 11.**
- **11–12 years:** Dose 1.
- **13–15 years, no dose yet:** the same dose 1, called catch-up (owner decision 2026-11-18).
  CDC: *"Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8
  weeks)"*. Only the words change; the 16-year booster and its date are the same.
- **16 years:** booster (this is the "real" booster — a dose 1 given at 11–12
  does not itself count as the 16y booster).
- **The booster waits at least 8 weeks after dose 1** (owner decision
  2026-11-15). ACIP: *"the booster dose can be administered at any time, as long
  as a minimum interval of 8 weeks between doses is maintained."* Example: dose 1
  at 15 years 11 months on July 20; the booster is due September 14, not on the
  16th birthday in August. A booster given sooner than 8 weeks (beyond the
  4-day grace) does not count and is asked for again, 8 weeks after dose 1. The
  college-residence, military and outbreak cards wait the same 8 weeks when the
  dose they ask for is this booster.
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
  - Dose 1 at 2 months: 4-dose infant MenACWY series (2, 4, 6, 12 months). No shortcut.
    Menveo and MenQuadfi are both offered — see the licensed-age note just below.
  - **MenQuadfi is licensed from 6 weeks, younger than the app's own 2-month
    schedule floor (2026-09-23, AAP-aligned per WA DOH).** The app still never
    *asks* for a dose before 2 months — CDC's earliest schedule row is 2 months
    regardless of which product a family chooses — but a MenQuadfi dose actually
    given at 6 or 7 weeks is licensed and **counts**: the card for a patient in
    that gap says so and states the schedule that follows ("6 weeks, then 4, 6
    and 12 months") instead of pretending nothing happened. Menveo's own floor
    is unchanged at 2 months. **A dose whose brand is unknown counts only from 2
    months** (your C13 answer, 2026-11-15): the 6 weeks is MenQuadfi's alone,
    and an unknown brand might not have been MenQuadfi (CDC's software also
    starts an unspecified MenACWY at 2 months). See `MENACWY_LICENCE_MIN_AGE_DAYS` (brands.js) vs
    `MENACWY_SCHEDULE_MIN_AGE_MONTHS` (ages.js) — two different questions that
    used to be one number only because every product's answer happened to
    match.
  - Dose 1 at 3–6 months: 3 **or** 4 doses. The **"3-dose shortcut"**: if dose 2 landed
    at 7 months or later, the series completes in 3 doses. If dose 2 came earlier, or
    its age is unknown, it stays a 4-dose series.
  - Dose 1 at 7–23 months: 2-dose primary.
  - The length is fixed by the age at dose 1 and never changes afterwards — a child who
    started at 4 months is still on a 4-dose series at age 6.
  - **How far apart (corrected 2026-09-17).** Two numbers cover every infant series:
    - The **early doses** are at least **8 weeks** apart. The app used to say 4 weeks,
      in the rules *and* on the card. CDC's Menveo 3–6-month row says "at least 8 weeks
      after previous dose", and ACIP's own footnote to Tables 4–6 says "doses at
      intervals of 8 weeks". The 4 weeks came from a different ACIP rule — the minimum
      gap when a dose has to be **repeated** — which in the ACIP report is stated only
      about MenB.
    - The **final dose of the series** is due when the child is **at least 12 months
      old** and **at least 12 weeks** have passed since the dose before it. This holds
      for the 2-, 3- and 4-dose versions alike. Until this was corrected only the
      3-dose shortcut checked it, so a baby three doses into a 4-dose series could be
      told the last dose was due at six months old.
    - Two of these are **owner decisions** rather than quotes, because CDC does not say:
      that the 2-month series also uses 8 weeks between its early doses, and that the
      "12 months old and 12 weeks since the last dose" test applies to the final dose of
      *both* the 2-month and the 3–6-month series.
    - **When the card advises them (your Q9b answer, 2026-11-17, as PneumoVax).** A
      baby who started at 2 months is advised dose 2 at **4 months** and dose 3 at **6
      months** of age, with the 8 weeks said beside it: "Next dose due May 1, 2026" over
      "It can be given from Apr 26, 2026 if needed (minimum 8 weeks)". If 8 weeks after
      the last dose is already past that age (a late dose 1), the 8 weeks is the date.
      A dose given at 8 weeks still counts. A baby who started at 3–6 months is spaced
      8 weeks apart as before.
    - A deliberate edge case: a baby starting at exactly 3 months with every gap at the
      bare minimum reaches dose 3 at about 6.7 months. Read absolutely literally CDC's
      sentence would ask for a fifth dose; CDC caps the series at four, so the app stops
      at four. It never gives fewer doses than CDC intends.
- **Booster cadence**, keyed off the age at the **last dose of the primary series** —
  the dose that actually starts the clock. For a baby who began at 2 months that is
  dose 4, not dose 2:
  - Primary completed before age 7: first booster in **3 years**, then every 5 years.
  - Primary completed at age 7 or older: first booster in **5 years**, then every 5 years.
  - Completion age unknown: treated conservatively as "before 7" (3-year first booster).
  - Only the *first* booster varies. Every booster after it is 5 years.

### Single-dose indications (one primary dose)
"Single" means the *primary series* is one dose — not that the patient may never
receive another.
- **Under 16, the college-residence and military boxes add nothing** (your B-4 answer,
  2026-11-15): the card follows the routine schedule and adds "The college-residence
  (military) dose is given at 16 or older."
- **Military recruits**: one documented dose satisfies the recruitment requirement. The
  card then shows **the booster date 5 years on, "if required by assignment"** — never
  "Complete" (your B-3 answer). ACIP: *"Military recruits: Every 5 yrs on basis of
  assignment"*; the Department of Defense sets it from high-risk travel, which the app
  cannot see, so the card says to check the service's current requirement. **A
  military booster given under 5 years after the dose before it does not count**
  (your D6 answer, 2026-11-17: checked like travel); the next booster is timed from
  it, so the date usually stays and only the dose label changes. The routine
  16-year booster is not affected.
- **Serogroup A/C/W/Y outbreak exposure**: one dose, then — **while the outbreak box is
  ticked — a booster 3 years later if the series finished before age 7, otherwise 5,
  and every 5 years after** (your B-2 answer). The card reads "Booster (dose N) if
  outbreak risk continues" with the date, never "Complete" or "top-up". A teenager's
  routine 16-year booster still comes first. Untick the box when the risk is over.
- **Every outbreak card — MenACWY and MenB, any age — says "if outbreak risk
  continues"** on a booster not yet due ("for this outbreak" when due today), and
  its booster line reads "while outbreak risk continues" (your D7 answer,
  2026-11-17). Before, only the teenage MenACWY outbreak card said it. If another
  risk is also ticked (asplenia, for example), that risk's wording stays.
- **"Complete" means nothing more is owed** (your PneumoVax rule, 2026-11-01): a healthy
  10–15-year-old with the 11–12 dose reads "Future booster needed", with the date — not
  complete.
- **"Up to date" only when nothing is left** (your F-3 answer, STOP G1, 2026-11-18). A card
  with a date still to come names it: a booster reads **"Future booster needed"**, any other
  dose reads **"Next dose not yet due"**. Badge words only; the dates and doses are unchanged.
- **The combined pentavalent shot waits for the dose questions** (your B-5 answer): while
  a recorded dose shows "Needs input", the app offers no pentavalent and does not say
  both vaccines are due.
- **First-year college students in dorms**: one dose satisfies the requirement *only if
  given at ≥16 years old*, and it covers them **for 5 years**; after that, one dose is
  due (your D1 answer, 2026-11-17, replacing the 2026-09-15 "permanently"). ACIP's own
  college footnote: *"do not need another dose before college entry unless it has been
  more than 5 years since the dose"*; immunize.org agrees. The app counts the 5 years to
  today's visit, read as the college-entry visit (the box says *first-year*
  student). There is **no repeat dose for staying in a residence hall** — no
  source gives one (your D9 answer, 2026-11-17). An earlier dose (before 16) does not count for this requirement; a
  fresh dose is needed at ≥16.

### Single dose + ongoing booster
- **Travellers** to hyperendemic/epidemic regions (including Hajj pilgrims, the
  sub-Saharan "meningitis belt"): 1 dose, then re-vaccinate while the risk continues.
  The first booster is at **3 years** if the primary dose was given before age 7,
  otherwise 5 years; every booster after that is 5 years.
- **Microbiologists** routinely handling *N. meningitidis*: 1 dose, then every 5 years
  while the exposure continues — a flat interval with no under-7 variation, because
  ACIP's microbiologist table covers ages ≥10 only.
- **A booster given too soon does not count, for both** (your C10 answer,
  2026-11-15): checked like a medical high-risk booster — 3 or 5 years, less
  the 4-day grace. Before, a dose 6 weeks after a travel dose was counted as
  "the booster". (C10 also names the A/C/W/Y outbreak booster; that half comes
  with the outbreak card's booster date, your STOP B answer B-2.)
- **A teenager still gets the 16-year dose** (your answer, 2026-11-18) — travel,
  lab worker, and A/C/W/Y outbreak alike. Maya, 15, had one dose at 14 for
  travel: the app used to put her next dose in 2030 (5 years on), while the same
  girl with no box ticked got it at 16. ACIP's routine rule — *"1 dose at age 16
  yrs if first dose administered before 16th birthday"* — names no exception.
  Now her card says "Booster due at 16y"; the dose counts when given; boosters
  then follow every 5 years from it while she is at risk (5 years because it is
  given at 7 or older). Asplenia, complement and HIV are unchanged: their own
  schedule replaces the routine one, as ACIP's own example shows (an HIV child
  dosed at 9 gets the next dose at 14).

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
- **Dose 2 given under 4 weeks after dose 1** does **not** count (owner,
  2026-11-15; ACIP: 4 weeks between any two MenB doses). It is repeated at
  least 6 months after dose 1 (and at least 4 weeks after the uncounted dose).
- **Dose 2 given early** (4 weeks to <6 months after dose 1) is **not
  invalid** — it's accepted, but a third "rescue" dose is then required ≥4
  months after dose 2 to complete the series. A dose 2 only 1–4 days short of
  6 months counts as on time (the 4-day grace; your C7 answer).

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
  - Dose 2: ≥4 weeks after dose 1. **The card advises 1 month after dose 1** and
    says the 4 weeks beside it: "Next dose due Dec 3, 2026" over "It can be given
    from Dec 1, 2026 if needed (minimum 4 weeks)" (your Q9a answer, 2026-11-17, as
    PneumoVax). A dose given at 4 weeks still counts.
  - Dose 3: the app **advises** it ≥6 months after dose 1 **and** ≥4 months
    after dose 2 (both must be satisfied — whichever is later wins). A dose 3
    **already given** ≥4 months after dose 2 counts, even if it came before 6
    months from dose 1 (your C5 answer, 2026-11-15: no source says not to count
    it, and CDC's software counts it).
  - **If dose 2 was already given 6 months or more after dose 1, dose 3 is not
    needed** (corrected 2026-09-17). Those two doses are the 0-and-6-month
    schedule, so the series is complete and the patient moves to boosters. CDC
    states this in the same sentence as the 3-dose series itself. The app used
    to ask every high-risk patient for a third dose regardless, which meant
    advising an injection some patients did not need. It is the same six-month
    test as the healthy rule above, read in the opposite direction, and it is
    compared on the calendar rather than as a fixed number of days, **with the
    4-day grace** (your D4 answer, 2026-11-17).
  - **If dose 3 was given earlier than 4 months after dose 2, that dose still
    counts — do not repeat it — but a 4th dose is then owed at least 4 months
    after dose 3** (corrected 2026-09-17). CDC says this in the second half of
    the same sentence as the rule above. The app used to do the opposite: mark
    the early dose 3 invalid, tell the clinician to repeat it, and then ask for
    "dose 3 of 3" again — so it threw away a dose CDC credits and never
    mentioned the extra dose the patient actually needs. The booster clock then
    starts from that 4th dose, not from the third. The four months are
    compared on the calendar, **with the 4-day grace** (your C7 answer): a dose
    3 given 1–4 days before 4 months is not early.
  - **Unless dose 3 was 6 months or more after dose 1** — then no 4th dose,
    even if dose 3 came under 4 months after dose 2 (your C6 answer: follow
    ACIP's 2024 MMWR, *"…unless the third dose was administered ≥6 months after
    the first dose"*; CDC's schedule notes leave the "unless" out). **With the
    4-day grace** (your D3 answer, 2026-11-17): 1–4 days short of 6 months
    also counts.
- **Boosters**: first booster 1 year after completing the primary series,
  then every 2 years while the risk condition persists.
  - **Serogroup B outbreak alone: one booster only** (your D10 answer,
    2026-11-17), at least 1 year after the primary series; after it the card
    reads "Complete (outbreak booster given)". ACIP 2020 Table 8: *"Single dose
    if ≥1 yr after MenB primary series completion"*. The every-2–3-years
    boosters are Tables 4, 5 and 7 (complement, asplenia, microbiologists). If
    another of those risks is also ticked, its boosters win.
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

- **Also when MenB dose 2 can be given today but isn't due yet** (your F2a
  answer, 2026-11-18). High-risk MenB dose 2 is due 1 month after dose 1 but
  can be given from 4 weeks. On the days in between, if MenACWY is due, the
  combined shot is offered: *"MenACWY is due today; MenB dose 2 can be given
  today (its 4-week minimum has passed). One pentavalent (MenABCWY) dose may
  replace both."* ACIP: "may be used when both MenACWY and MenB are indicated
  at the same visit". On those days the MenB card's badge says **"Can be
  given today"** (your answer, 2026-11-18), not "Up to date"; its date line
  still says "Next dose due <date>".

- **Penmenvy** = MenB-4C family → only offered/continued if the established
  family is 4C (or no family established yet).
- **Penbraya** = MenB-FHbp family → only offered/continued if FHbp (or none
  established yet).
- The pentavalent never appears as an option in the plain MenB dose list —
  only in its own dedicated recommendation.
- **Penbraya cannot be given again within 6 months of the last Penbraya**
  (added 2026-09-17). CDC allows Penbraya for further doses only once at least
  six months have passed since the most recent one. Before this, a patient who
  had a Penbraya two months earlier was offered the combined shot again. If
  that rules out the only pentavalent the patient's MenB family allows, the app
  simply does not offer the combined injection and says why — **the vaccine
  itself is still given**, as two separate shots the same day.
- **Penmenvy follows the same six-month rule** (owner decision 2026-11-15). The
  CDC schedule page names only Penbraya, but ACIP's Penmenvy report (January
  2026) says a patient who needs more MenACWY and MenB doses within 6 months of
  a pentavalent should get the two separate vaccines instead. Example: a
  17-year-old with asplenia who had Penmenvy on July 1 is offered Menveo or
  MenQuadfi plus Bexsero on September 1, not a second Penmenvy.
- **After a Penbraya, MenB dose 2 should be Trumenba.** The app already does
  this, through the antigen-family rule — a Penbraya sets the family to FHbp and
  only Trumenba is then offered. No change was needed.

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

- **No date recorded: not counted** (owner, STOP C C1, 2026-11-15). CDC:
  *"providers should only accept written, dated records as evidence of
  vaccination"* (influenza and PPSV23 are the only exceptions). The dose stays
  on the record and its row reads "No date recorded — not counted"; the card
  schedules as if it had not been given. Adding the date lets the app judge it.
  The app does not say to repeat it — nothing shows it was given at a wrong
  time — and with no date it never starts a clock for the next dose.
- **Given below the minimum age for the brand:** invalid — does not count.
  Repeat that dose only; do not restart the whole series. If it was the
  **first** dose, the repeat waits the vaccine's own minimum interval after
  it: **8 weeks for MenACWY** (your D5 answer, 2026-11-17), **4 weeks for
  MenB** (your E1 answer, 2026-11-15). CDC would allow it as soon as the child
  reaches the minimum age; the app waits on purpose.
- **Given too soon after the previous dose** (violates a minimum interval):
  invalid — does not count. Repeat that dose only.
- **Any two MenACWY doses must be at least 8 weeks apart** (your C11 answer,
  2026-11-15; ACIP: *"an 8-week minimum interval between doses"*; less the
  4-day grace). It was 4 weeks, which ACIP says only of MenB. The same 8 weeks
  applies after a too-young **first** dose (your D5 answer, 2026-11-17).
- **The repeat is timed from the dose that did not count** (owner, STOP C,
  2026-11-15 — "Ruling D", the same rule as PneumoVax). CDC: *"The repeat dose
  should be spaced after the invalid dose by the recommended minimum
  interval."* Example: asplenia, Menveo 1 August, Menveo again 22 August (3
  weeks — does not count). Dose 2 is now due 17 October (8 weeks after 22
  August), not 26 September (8 weeks after 1 August). A dose given in between
  — on time from 1 August but too soon after 22 August — does not count
  either. The same goes for a booster given early: the repeat booster is due 5
  years (or 3; MenB 1 or 2 years) after the early one, not today. Only the
  timing moves: dose numbers ("Dose 2 of 2") still count only doses that
  counted.
- **A MenB dose of the wrong antigen family** does not count, and the next
  dose of the right family waits at least 4 weeks after it (owner,
  2026-11-15), as well as being due by the schedule. With one dose of each
  product on record, the card also says how to finish with the other product
  instead, e.g. *"Or finish with Trumenba instead: dose 2 due Apr 1, 2027 (the
  Bexsero dose then does not count)"* (your D8 answer, 2026-11-17; ACIP: "one
  product should be selected"; "due", not "from", is your F2b answer,
  2026-11-18).
- **Given before age 10 (MenACWY) / before age 16 (MenB), no current risk
  factor:** valid, but doesn't advance the series (see sections above). The
  dose reads **"Not counted — given before age 10"** (or "… before age 16"),
  and the card says what is owed (your Q6 answer, 2026-11-17; it read
  "Off-window - repeat"). A high-risk patient's MenB from age 10 counts.

### The label beside each recorded dose (your STOP E1 answers, 2026-11-17)

Every recorded dose gets exactly one label from this list:

| Label | When |
|---|---|
| Dose N of M / Dose N | Counted. "Dose N" alone when no series is running now (Q9; it read "Given — not part of a series this patient needs"). |
| Booster | A counted dose after the primary series (Q7: kept). |
| Not counted — repeat | Too soon, too young, or the wrong MenB family, and a card still asks for that vaccine (Q5; it read "Invalid"). The line ends with the date the card gives: "Repeat from Dec 17, 2026." If a later dose of that vaccine is already on the record, the line says "Repeated on <date>. See that dose." instead (owner F-4a, F-4b, 2026-11-18). |
| Not counted — do not repeat | The same, but no card asks for that vaccine: every card is "Complete" or "Not indicated" (Q10). A card that asks for a dose *later* ("Not yet age-eligible: start the series at 10") still asks, so that dose reads "repeat". So does a pregnancy deferral. |
| Not counted — given before age 10 / 16 | Set aside for age (Q6). |
| Not counted — Extra. Do not repeat. | Given correctly, but no card asked for it on the day it was given: the series was already complete, or no dose was recommended (Q8, Q11). This includes a patient's first dose: a healthy 30-year-old's Bexsero is Extra. A card that said "Not yet due" (it asks for a dose later) does not make a dose Extra: a healthy child's MenACWY at 10 still counts, because ACIP counts it as dose 1. **College is left alone** (Q8 follow-up): a dose given while the 5-year college cover runs still counts, because ACIP times the 5 years "since the dose". |
| No date recorded / Date is in the future / Entered twice / Dated before birth — not counted | A record problem (unchanged). |
| Needs input | Waiting for "was the patient high-risk on that date?" (unchanged). |

The cards on the day of a dose are worked out with the patient's risks as
ticked today. So if a risk is ticked later, those cards ask, and the doses
count.
- **A MenACWY dose set aside like that still starts the 8-week clock** (your
  D2 answer, 2026-11-17): the next MenACWY dose waits 8 weeks after it. A dose
  given 5 days before the 16th birthday puts the booster 8 weeks after that
  dose, not on the birthday; a dose at 9 years 11 months means a dose at 10
  under 8 weeks later does not count.
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
- **An undated dose never closes a series, never pushes out a dated dose, and
  is never called an extra dose** — because it is never counted. (Before C1 the
  app counted it and needed two special rules, G6 and G8, to stop it closing the
  routine series or taking a dated dose's place; both were retired with C1.)
- Doses are numbered in order against the doses already *kept* so far (an
  early dose that does not count takes no number), but the gap to the next
  dose is measured from the last dose actually given (the bullet on repeat
  timing above). Before 2026-11-16 the gap was measured from the last kept
  dose instead.

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
update this file in the same commit/PR**. Don't let this document silently go stale; if you're not sure
it's current, re-derive the relevant section from the code rather than
trusting it.
