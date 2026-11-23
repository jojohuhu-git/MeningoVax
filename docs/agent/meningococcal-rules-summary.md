# Meningococcal Vaccine Rules — Plain-English Summary (the Rulebook)

**Purpose:** a single place to check "when is MenACWY / MenB due" without reading
code. Written for the owner (a clinician), not for an engineer. This is the
**source of truth**, and MeningoVax's **rulebook** (owner decision 2026-11-19: this file
grows into the rulebook; there is no separate CLINICAL_SPEC.md). Section 5 lists every rule
that judges a recorded dose, written from the code, with the sentences it rests on and the
date each was read.

**Under every rule in sections 1–3** (how the cards decide) sits the sentence it rests on, with
its link and the date it was read, or the owner decision it rests on (owner 2026-11-19: "Link to
source list"). Those lines are copied from the app's own source list (`src/data/refs.js`) by
`npm run rulebook`, so they are the same sentences the cards cite. A rule with no sentence yet
says so in italics: on 2026-11-19 that was 20 of 75 rules; since later that day it is 0 (every
rule names its source).

**Last verified against code:** 2026-11-21 (the owner's STOP H walk-through: section 5
regenerated from the code with no difference, and the full suite, which holds this file's
load-bearing rules to the code, passing; rules changed since 2026-11-16 include D1–D13, M1,
M1d and MQ6); before that 2026-11-16 (STOP B B-2–B-5 and the Complete rule; MenACWY
gaps, STOP C C10, C11, C13; MenB dose 3, C5–C7; an undated dose does not count, C1);
before that 2026-09-23 (MenQuadfi 6-week licence floor, M3-M5);
before that 2026-09-17 (P0-1, MenACWY infant primary intervals), and 2026-09-16, after
the 2026-09-15 dose-counter and primary/booster-boundary fixes (M5, M9, M10, M12,
M16-M18, P0-1 to P0-5, P1-1 to P1-3).

This file is no longer kept honest by memory alone. The test
`src/logic/__tests__/rule-docs-match-code.test.js` reads each load-bearing rule out of
the code and fails if this document stops saying the same thing, naming the file and the
sentence. Section 5's table is held to the code cell by cell by
`src/logic/__tests__/rulebook-table-matches-code.test.js`. Change a rule without changing
this file and the suite goes red.

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
  4 months after dose 2 counts (C7); a high-risk dose 3 given 1–4 days before
  6 months after dose 1 counts (D3); a high-risk dose 2 given 1–4 days before
  6 months after dose 1 needs no dose 3 (D4).
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
  <!-- SOURCES: acwyRoutine1112and16 -->
  > "ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  <!-- /SOURCES -->
- **11–12 years:** Dose 1.
  <!-- SOURCES: acwyRoutine1112and16 -->
  > "ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  <!-- /SOURCES -->
- **13–15 years, no dose yet:** the same dose 1, called catch-up (owner decision 2026-11-18).
  CDC: *"Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8
  weeks)"*. Only the words change; the 16-year booster and its date are the same. The card's
  booster line says "at age 16–18", as CDC does (owner decision 2026-11-19).
  <!-- SOURCES: cdcCatchupAcwyBooster8Weeks, owner:F-2, owner:W3 -->
  > "Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8 weeks)" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-18.
  >
  > Owner decision F-2, 2026-11-18 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
  >
  > Owner decision W3, 2026-11-19 ([decisions-2026-11-19-after-the-fold.md](../archive/decisions-2026-11-19-after-the-fold.md)).
  <!-- /SOURCES -->
- **16 years:** booster (this is the "real" booster — a dose given before 16
  does not itself count as the 16y booster). The card says "Booster due today" (owner
  decision 2026-11-19).
  <!-- SOURCES: acwyRoutine1112and16, owner:W1 -->
  > "ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  >
  > Owner decision W1, 2026-11-19 ([decisions-2026-11-19-after-the-fold.md](../archive/decisions-2026-11-19-after-the-fold.md)).
  <!-- /SOURCES -->
- **The booster waits at least 8 weeks after dose 1** (owner decision
  2026-11-15). ACIP: *"the booster dose can be administered at any time, as long
  as a minimum interval of 8 weeks between doses is maintained."* Example: dose 1
  at 15 years 11 months on July 20; the booster is due September 14, not on the
  16th birthday in August. A booster given sooner than 8 weeks (beyond the
  4-day grace) does not count and is asked for again, 8 weeks after dose 1. The
  college-residence, military and outbreak cards wait the same 8 weeks when the
  dose they ask for is this booster.
  <!-- SOURCES: acwyBooster8WeeksAfterDose1, cdcCatchupAcwyBooster8Weeks, owner:N5 -->
  > "the booster dose can be administered at any time, as long as a minimum interval of 8 weeks between doses is maintained" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  >
  > "Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8 weeks)" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-18.
  >
  > Owner decision N5, 2026-11-15 ([clinical-rules.md](clinical-rules.md)).
  <!-- /SOURCES -->
- **16–21 years, no dose recorded on/after the 16th birthday:** one catch-up
  dose. Because it's given at ≥16, no further booster is needed. Especially
  called out for first-year college students in dorms.
  <!-- SOURCES: cdcCatchupAcwy1618OneDose, acwyCatchup1921, acwyFirstDoseAfter16NoBooster -->
  > "Age 16–18 years: 1 dose" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-19.
  >
  > "Persons aged 19–21 years who have not received a dose after their 16th birthday can receive a single MenACWY dose as part of catch-up vaccination" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-07-24.
  >
  > "Adolescents who receive a first dose after their 16th birthday do not need a booster dose unless they become at increased risk for meningococcal disease" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-07-24.
  <!-- /SOURCES -->
- **≥22 years, healthy, no risk factor:** not indicated.
  <!-- SOURCES: acip2020Table2CatchupOnly1921 -->
  > "Although routine vaccination is only recommended for adolescents aged 11–18 yrs, MenACWY may be administered to persons aged 19–21 yrs who have not received a dose after their 16th birthday" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-19.
  <!-- /SOURCES -->
- **Golden rule that cuts across all the bands above:** *any* dose given at
  age ≥16 satisfies the adolescent schedule — no further routine doses,
  regardless of current age.
  <!-- SOURCES: acwyFirstDoseAfter16NoBooster -->
  > "Adolescents who receive a first dose after their 16th birthday do not need a booster dose unless they become at increased risk for meningococcal disease" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-07-24.
  <!-- /SOURCES -->

### Doses given before age 10 don't count
A MenACWY dose given before the patient turned 10 is **valid** (it wasn't
given too early for the vaccine itself) but does **not** advance the routine
11-12y/16y series — it's treated as if it hadn't happened for counting
purposes. This only applies to healthy patients; a high-risk infant series
(below) is allowed to start before 10 and those doses do count.
<!-- SOURCES: acwyBeforeAge10, cdcChildAcwyBefore10OngoingRisk -->
> "Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
>
> "Children for whom boosters are recommended because of an ongoing increased risk of meningococcal disease (e.g., those with complement component deficiency, HIV, or asplenia): Follow the booster schedule for persons at increased risk." — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
<!-- /SOURCES -->

### High-risk (asplenia/sickle cell, persistent complement deficiency, complement-inhibitor therapy [eculizumab/ravulizumab], HIV)
- **2-dose primary series**, ≥8 weeks apart (≥2 years old), then boosters.
  <!-- SOURCES: cdcChildAcwyRisk2DoseFrom24m, acip2020Acwy8WeekMinimum -->
  > "Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
  >
  > "a second dose should be administered as soon as possible, provided that an 8-week minimum interval between doses is maintained" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  <!-- /SOURCES -->
- **Complement box: an alert at the top of the page** (your Q2 answers, 2026-11-22
  "Add the note" and 2026-11-23 "put alert in the same place as CAR-T hard stop"),
  covering both vaccines: "If on a complement inhibitor: vaccination gives incomplete
  protection. Consider antibiotic prophylaxis. Ideally finish these vaccines at least 2
  weeks before the first inhibitor dose." Each clause cites CDC's complement-inhibitor
  page. It begins "If on a complement inhibitor" because the page is about inhibitor
  therapy and the one checkbox also covers inherited complement deficiency.
  <!-- SOURCES: cdcComplementIncompleteProtection, cdcComplementConsiderProphylaxis, cdcComplementVaccinate2WeeksBefore -->
  > "Vaccination is also recommended but offers incomplete protection." — [CDC Complement-Inhibitor Guidance](https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html), read 2026-11-23.
  >
  > "In addition to vaccination, healthcare providers could consider antimicrobial prophylaxis for complement inhibitor recipients to potentially reduce meningococcal disease risk." — [CDC Complement-Inhibitor Guidance](https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html), read 2026-11-23.
  >
  > "Ideally, complete or update meningococcal vaccination at least 2 weeks prior to administering the first dose of the complement inhibitor." — [CDC Complement-Inhibitor Guidance](https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html), read 2026-11-23.
  <!-- /SOURCES -->
- **Infants.** MenACWY is not routinely given to healthy infants, but three
  indications put a baby on the infant series: medical high risk, **travel**, and an
  **A/C/W/Y outbreak**. A travelling or outbreak-exposed infant gets the *same infant
  series* as a high-risk one — ACIP prints the identical "2–23 months" row in Tables
  4–6, 8 and 9. Microbiologists and military recruits are excluded: ACIP gives them no
  infant row at all.
  <!-- SOURCES: acip2020AcwyRiskGroupsFrom2mo, cdcChildAcwyTravelUnder24m, acwyInfantHighRisk2to6mo -->
  > "ACIP also recommends routine vaccination with MenACWY for persons aged ≥2 months at increased risk for meningococcal disease caused by serogroups A, C, W, or Y, including persons who have persistent complement component deficiencies; persons receiving a complement inhibitor (e.g., eculizumab [Soliris] or ravulizumab [Ultomiris]); persons who have anatomic or functional asplenia; persons with human immunodeficiency virus infection; microbiologists routinely exposed to isolates of Neisseria meningitidis; persons identified to be at increased risk because of a meningococcal disease outbreak caused by serogroups A, C, W, or Y; persons who travel to or live in areas in which meningococcal disease is hyperendemic or epidemic; unvaccinated or incompletely vaccinated first-year college students living in residence halls; and military recruits" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-19.
  >
  > "Children younger than age 24 months: Menveo* (age 2–23 months)" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-19.
  >
  > "4 doses at 2, 4, 6, and 12 mos" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-07-24.
  <!-- /SOURCES -->
  - Dose 1 at 2 months: 4-dose infant MenACWY series (2, 4, 6, 12 months) when dose 2
    comes on time, before 7 months. If dose 2 came at 7 months or later, the series
    finishes in 3 doses, the same 3-dose shortcut as a 3–6-month start (your T1 answer,
    2026-11-19, as CDC's scheduling software, CDSI, has it). Menveo and MenQuadfi are
    both offered — see the licensed-age note just below.
    <!-- SOURCES: acwyInfantHighRisk2to6mo, owner:T1 -->
    > "4 doses at 2, 4, 6, and 12 mos" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-07-24.
    >
    > Owner decision T1, 2026-11-19 ([decisions-2026-11-19-t1-t2-todo-rules.md](../archive/decisions-2026-11-19-t1-t2-todo-rules.md)).
    <!-- /SOURCES -->
  - **MenQuadfi is licensed from 6 weeks, younger than the app's own 2-month
    schedule floor (2026-09-23, AAP-aligned per WA DOH).** Dose 1 is still *due*
    at 2 months. Since 2026-11-21 (your MQ6 answer, AAP 2026: "The first dose of
    MenQuadfi may be given as early as 6 weeks"), a high-risk, travelling or
    outbreak baby from 6 weeks to under 2 months with no MenACWY yet gets a card
    listing Menveo 2-vial and MenQuadfi, as at 2 months (your MQ6-j answer: dose 1
    is advised at 2 months, when both are fine), "Dose 1 of 4", next dose due at
    2 months, and "MenQuadfi may be given from 6 weeks" behind "Why this" (your
    MQ6-i answer: keep it folded). Its badge says **"Next dose not yet
    due"** (your MQ6-g answer: follow the standard schedule when it can be
    followed). This needs a date of birth: from whole months alone a 5-week-old
    and a 7-week-old look the same (your MQ6-k answer: keep it so). A MenQuadfi dose actually given at 6 or 7
    weeks is licensed and **counts**, and the card is the one the same baby gets
    from 2 months: dose 2 due at 4 months, earliest valid 8 weeks after dose 1
    (your MQ6-e answer). Menveo's own floor
    is unchanged at 2 months. **A dose whose brand is unknown counts only from 2
    months** (your C13 answer, 2026-11-15): the 6 weeks is MenQuadfi's alone,
    and an unknown brand might not have been MenQuadfi (CDC's software also
    starts an unspecified MenACWY at 2 months). See `MENACWY_LICENCE_MIN_AGE_DAYS` (brands.js) vs
    `MENACWY_SCHEDULE_MIN_AGE_MONTHS` (ages.js) — two different questions that
    used to be one number only because every product's answer happened to
    match.
    <!-- SOURCES: menQuadfiPackageInsert, waDohMenQuadfiAapAlignment, aap2026MenQuadfiFrom6Weeks, cdcChildAcwyMinAge, owner:C13, owner:MQ6, owner:MQ6-e, owner:MQ6-g, owner:MQ6-i, owner:MQ6-j, owner:MQ6-k -->
    > "MenQuadfi is approved for use in individuals 6 weeks of age and older." — [MenQuadfi Package Insert](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ab1c3318-578e-4d0c-a21e-fc6df07e9fb7), read 2026-09-23.
    >
    > "Updated MenACWY recommendations to align with the American Academy of Pediatrics. The minimum age for the first MenQuadfi dose is now 6 weeks, instead of 2 years for children who meet the recommendation." — [WA DOH](https://doh.wa.gov/you-and-your-family/immunizations-and-vaccines), read 2026-09-22.
    >
    > "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and 12 months). The first dose of MenQuadfi may be given as early as 6 weeks." — [AAP 2026 schedule](https://downloads.aap.org/AAP/PDF/AAP-Immunization-Schedule.pdf), read 2026-11-21.
    >
    > "minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]), 10 years [MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-21.
    >
    > Owner decision C13, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
    >
    > Owner decision MQ6, 2026-11-21 ([decisions-2026-11-21-menquadfi-from-6-weeks.md](../archive/decisions-2026-11-21-menquadfi-from-6-weeks.md)).
    >
    > Owner decision MQ6-e, 2026-11-21 ([decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md](../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md)).
    >
    > Owner decision MQ6-g, 2026-11-21 ([decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md](../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md)).
    >
    > Owner decision MQ6-i, 2026-11-21 ([decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md](../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md)).
    >
    > Owner decision MQ6-j, 2026-11-21 ([decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md](../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md)).
    >
    > Owner decision MQ6-k, 2026-11-21 ([decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md](../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md)).
    <!-- /SOURCES -->
  - Dose 1 at 3–6 months: 3 **or** 4 doses. The **"3-dose shortcut"**: if dose 2 landed
    at 7 months or later, the series completes in 3 doses. If dose 2 came earlier, or
    its age is unknown, it stays a 4-dose series.
    <!-- SOURCES: cdcChildAcwyInfantSeries -->
    > "dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
    <!-- /SOURCES -->
  - Dose 1 at 7–23 months: 2-dose primary.
    <!-- SOURCES: acwyInfantHighRisk7to23mo -->
    > "2 doses (second dose ≥12 wks after the first dose and after the 1st birthday)" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
    <!-- /SOURCES -->
  - The series is chosen by the age at dose 1: a child who started under 2 years stays on
    the infant series however old they are now. What age changes is which doses are still
    needed. Once a child is 7 months or older the early infant doses are no longer given, so
    a child who fell behind needs one dose now and a final dose at least 12 weeks later and
    after the first birthday (your T1 answer, 2026-11-19, as CDSI has it). Example:
    asplenia, one dose at 2 months, seen at 6 years: 2 more doses, 3 in all.
    <!-- SOURCES: cdcChildAcwyInfantSeries, owner:T1 -->
    > "dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
    >
    > Owner decision T1, 2026-11-19 ([decisions-2026-11-19-t1-t2-todo-rules.md](../archive/decisions-2026-11-19-t1-t2-todo-rules.md)).
    <!-- /SOURCES -->
  - **How far apart (corrected 2026-09-17).** Two numbers cover every infant series:
    <!-- SOURCES: explains -->
    <!-- /SOURCES -->
    - The **early doses** are at least **8 weeks** apart. The app used to say 4 weeks,
      in the rules *and* on the card. CDC's Menveo 3–6-month row says "at least 8 weeks
      after previous dose", and ACIP's own footnote to Tables 4–6 says "doses at
      intervals of 8 weeks". The 4 weeks came from a different ACIP rule — the minimum
      gap when a dose has to be **repeated** — which in the ACIP report is stated only
      about MenB.
      <!-- SOURCES: cdcChildAcwyInfantSeries -->
      > "dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
      <!-- /SOURCES -->
    - The **final dose of the series** is due when the child is **at least 12 months
      old** and **at least 12 weeks** have passed since the dose before it. This holds
      for the 2-, 3- and 4-dose versions alike. Until this was corrected only the
      3-dose shortcut checked it, so a baby three doses into a 4-dose series could be
      told the last dose was due at six months old.
      <!-- SOURCES: cdcChildAcwyInfantSeries, acwyInfantHighRisk7to23mo -->
      > "dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months" — [CDC Child/Adolescent Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
      >
      > "2 doses (second dose ≥12 wks after the first dose and after the 1st birthday)" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
      <!-- /SOURCES -->
    - Two of these are **owner decisions** rather than quotes, because CDC does not say:
      that the 2-month series also uses 8 weeks between its early doses, and that the
      "12 months old and 12 weeks since the last dose" test applies to the final dose of
      *both* the 2-month and the 3–6-month series.
      <!-- SOURCES: owner:P0-1 -->
      > Owner decision P0-1, 2026-09-17 ([clinical-rules.md](clinical-rules.md)).
      <!-- /SOURCES -->
    - **When the card advises them (your Q9b answer, 2026-11-17, as PneumoVax).** A
      baby who started at 2 months is advised dose 2 at **4 months** and dose 3 at **6
      months** of age, with the 8 weeks said beside it: "Next dose due May 1, 2026" over
      "It can be given from Apr 26, 2026 if needed (minimum 8 weeks)". If 8 weeks after
      the last dose is already past that age (a late dose 1), the 8 weeks is the date.
      A dose given at 8 weeks still counts. A baby who started at 3–6 months is spaced
      8 weeks apart as before.
      <!-- SOURCES: owner:Q9b -->
      > Owner decision Q9b, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
      <!-- /SOURCES -->
    - A deliberate edge case: a baby starting at exactly 3 months with every gap at the
      bare minimum reaches dose 3 at about 6.7 months. Read absolutely literally CDC's
      sentence would ask for a fifth dose; CDC caps the series at four, so the app stops
      at four. It never gives fewer doses than CDC intends.
      <!-- SOURCES: acwyInfantHighRisk2to6mo -->
      > "4 doses at 2, 4, 6, and 12 mos" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-07-24.
      <!-- /SOURCES -->
- **Booster cadence**, keyed off the age at the **last dose of the primary series** —
  the dose that actually starts the clock. For a baby who began at 2 months that is
  dose 4, not dose 2:
  <!-- SOURCES: boosterBeforeAge7, boosterAtOrAfterAge7 -->
  > "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  >
  > "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  <!-- /SOURCES -->
  - Primary completed before age 7: first booster in **3 years**, then every 5 years.
    <!-- SOURCES: boosterBeforeAge7 -->
    > "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
    <!-- /SOURCES -->
  - Primary completed at age 7 or older: first booster in **5 years**, then every 5 years.
    <!-- SOURCES: boosterAtOrAfterAge7 -->
    > "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
    <!-- /SOURCES -->
  - Completion age unknown: treated conservatively as "before 7" (3-year first booster).
    No patient reaches this since your C1 answer (an undated dose does not count, so the
    last primary dose always has a date); it stays as a safety net (your T2 answer,
    2026-11-19), and a test checks that no patient reaches it.
    <!-- SOURCES: owner:T2 -->
    > Owner decision T2, 2026-11-19 ([decisions-2026-11-19-t1-t2-todo-rules.md](../archive/decisions-2026-11-19-t1-t2-todo-rules.md)).
    <!-- /SOURCES -->
  - Only the *first* booster varies. Every booster after it is 5 years.
    <!-- SOURCES: boosterBeforeAge7, boosterAtOrAfterAge7 -->
    > "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
    >
    > "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
    <!-- /SOURCES -->

### Single-dose indications (one primary dose)
"Single" means the *primary series* is one dose — not that the patient may never
receive another.
<!-- SOURCES: explains -->
<!-- /SOURCES -->
- **Under 16, the college-residence and military boxes add nothing** (your B-4 answer,
  2026-11-15): the card follows the routine schedule and adds "The college-residence
  (military) dose is given at 16 or older."
  <!-- SOURCES: owner:B-4 -->
  > Owner decision B-4, 2026-11-15 ([plan-2026-11-08-meningovax-port.md](../archive/plan-2026-11-08-meningovax-port.md)).
  <!-- /SOURCES -->
- **Military recruits**: one documented dose satisfies the recruitment requirement. The
  card then shows **the booster date 5 years on, "if required by assignment"** — never
  "Complete" (your B-3 answer). ACIP: *"Military recruits: Every 5 yrs on basis of
  assignment"*; the Department of Defense sets it from high-risk travel, which the app
  cannot see, so the card says to check the service's current requirement. **A
  military booster given under 5 years after the dose before it does not count**
  (your D6 answer, 2026-11-17: checked like travel); the next booster is timed from
  it, so the date usually stays and only the dose label changes. The routine
  16-year booster is not affected.
  <!-- SOURCES: acip2020MilitaryBooster5Years, owner:B-3, owner:D6 -->
  > "Military recruits: Every 5 yrs on basis of assignment" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=Military%20recruits%3A%20Every%205%20yrs%20on%20basis%20of%20assignment), read 2026-11-16.
  >
  > Owner decision B-3, 2026-11-15 ([plan-2026-11-08-meningovax-port.md](../archive/plan-2026-11-08-meningovax-port.md)).
  >
  > Owner decision D6, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
  <!-- /SOURCES -->
- **Serogroup A/C/W/Y outbreak exposure**: one dose, then — **while the outbreak box is
  checked — a booster 3 years later if the series finished before age 7, otherwise 5,
  and every 5 years after** (your B-2 answer). The card reads "Booster (dose N) if
  outbreak risk continues" with the date, never "Complete" or "top-up". A teenager's
  routine 16-year booster still comes first. Uncheck the box when the risk is over.
  <!-- SOURCES: owner:B-2 -->
  > Owner decision B-2, 2026-11-15 ([plan-2026-11-08-meningovax-port.md](../archive/plan-2026-11-08-meningovax-port.md)).
  <!-- /SOURCES -->
- **Every outbreak card — MenACWY and MenB, any age — says "if outbreak risk
  continues"** on a booster not yet due ("for this outbreak" when due today), and
  its booster line reads "while outbreak risk continues" (your D7 answer,
  2026-11-17). Before, only the teenage MenACWY outbreak card said it. If another
  risk is also checked (asplenia, for example), that risk's wording stays.
  <!-- SOURCES: owner:D7 -->
  > Owner decision D7, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
  <!-- /SOURCES -->
- **"Complete" means nothing more is owed** (your PneumoVax rule, 2026-11-01): a healthy
  10–15-year-old with the 11–12 dose reads "Future booster needed", with the date — not
  complete.
  <!-- SOURCES: owner:PneumoVax-Complete -->
  > Owner decision PneumoVax-Complete, 2026-11-01 ([plan-2026-11-08-meningovax-port.md](../archive/plan-2026-11-08-meningovax-port.md)).
  <!-- /SOURCES -->
- **"Up to date" only when nothing is left** (your F-3 answer, STOP G1, 2026-11-18). A card
  with a date still to come names it: a booster reads **"Future booster needed"**, any other
  dose reads **"Next dose not yet due"**. Badge words only; the dates and doses are unchanged.
  <!-- SOURCES: owner:F-3 -->
  > Owner decision F-3, 2026-11-18 ([stop-g1-packet-2026-11-18.md](../archive/stop-g1-packet-2026-11-18.md)).
  <!-- /SOURCES -->
- **The combined pentavalent shot waits for the dose questions** (your B-5 answer): while
  a recorded dose shows "Needs input", the app offers no pentavalent and does not say
  both vaccines are due.
  <!-- SOURCES: owner:B-5 -->
  > Owner decision B-5, 2026-11-15 ([plan-2026-11-08-meningovax-port.md](../archive/plan-2026-11-08-meningovax-port.md)).
  <!-- /SOURCES -->
- **First-year college students in dorms**: one dose satisfies the requirement *only if
  given at ≥16 years old*, and it covers them **for 5 years**; after that, one dose is
  due (your D1 answer, 2026-11-17, replacing the 2026-09-15 "permanently"). ACIP's own
  college footnote: *"do not need another dose before college entry unless it has been
  more than 5 years since the dose"*; immunize.org agrees. The app counts the 5 years to
  today's visit, read as the college-entry visit (the box says *first-year*
  student). There is **no repeat dose for staying in a residence hall** — no
  source gives one (your D9 answer, 2026-11-17). An earlier dose (before 16) does not count for this requirement; a
  fresh dose is needed at ≥16.
  <!-- SOURCES: acip2020College5Years, owner:D1, owner:D9 -->
  > "Adolescents who received a first dose after their 16th birthday do not need another dose before college entry unless it has been more than 5 years since the dose." — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=do%20not%20need%20another%20dose%20before%20college%20entry%20unless%20it%20has%20been%20more%20than%205%20years%20since%20the%20dose), read 2026-11-17.
  >
  > Owner decision D1, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
  >
  > Owner decision D9, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
  <!-- /SOURCES -->

### Single dose + ongoing booster
- **Travellers** to hyperendemic/epidemic regions (including Hajj pilgrims, the
  sub-Saharan "meningitis belt"): 1 dose, then re-vaccinate while the risk continues.
  The first booster is at **3 years** if the primary dose was given before age 7,
  otherwise 5 years; every booster after that is 5 years.
  <!-- SOURCES: boosterBeforeAge7, boosterAtOrAfterAge7 -->
  > "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  >
  > "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  <!-- /SOURCES -->
- **Microbiologists** routinely handling *N. meningitidis*: 1 dose, then every 5 years
  while the exposure continues — a flat interval with no under-7 variation, because
  ACIP's microbiologist table covers ages ≥10 only.
  <!-- SOURCES: acip2020Table7MicrobiologistBooster -->
  > "Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  <!-- /SOURCES -->
- **A booster given too soon does not count, for both** (your C10 answer,
  2026-11-15): checked like a medical high-risk booster — 3 or 5 years, less
  the 4-day grace. Before, a dose 6 weeks after a travel dose was counted as
  "the booster". (C10 also names the A/C/W/Y outbreak booster; that half comes
  with the outbreak card's booster date, your STOP B answer B-2.)
  <!-- SOURCES: owner:C10 -->
  > Owner decision C10, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
  <!-- /SOURCES -->
- **A teenager still gets the 16-year dose** (your answer, 2026-11-18) — travel,
  lab worker, and A/C/W/Y outbreak alike. Maya, 15, had one dose at 14 for
  travel: the app used to put her next dose in 2030 (5 years on), while the same
  girl with no box checked got it at 16. ACIP's routine rule — *"1 dose at age 16
  yrs if first dose administered before 16th birthday"* — names no exception.
  Now her card says "Booster (16y)"; the dose counts when given; boosters
  then follow every 5 years from it while she is at risk (5 years because it is
  given at 7 or older). Asplenia, complement and HIV are unchanged: their own
  schedule replaces the routine one, as ACIP's own example shows (an HIV child
  dosed at 9 gets the next dose at 14).
  <!-- SOURCES: owner:16y-booster, acip2020Table2Booster16 -->
  > Owner decision 16y-booster, 2026-11-18 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
  >
  > "Booster: 1 dose at age 16 yrs if first dose administered before 16th birthday" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  <!-- /SOURCES -->

---

## 2. MenB (serogroup B)

MenB vaccines (Bexsero, Trumenba, and the pentavalents Penmenvy/Penbraya) are
**licensed from age 10 only** — never given younger, no exceptions.
<!-- SOURCES: cdcChildMenbMinAge, menbLicensedAge1025 -->
> "minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC MenB Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-15.
>
> "MenB vaccines are licensed in the United States only for persons aged 10–25 years" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
<!-- /SOURCES -->

### Healthy patients, no risk factor: shared clinical decision-making
- **Window: 16 years through 23 years 11 months** (preferably offered at
  16–18). Not indicated before 16 or at/after 24 without a risk factor.
  <!-- SOURCES: menbHealthyPreferredAge1618 -->
  > "MenB series at age 16–23 yrs on basis of shared clinical decision-making (preferred age 16–18 yrs)" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=MenB%20series%20at%20age%2016%E2%80%9323%20yrs%20on%20basis%20of%20shared%20clinical%20decision-making%20(preferred%20age%2016%E2%80%9318%20yrs)), read 2026-11-15.
  <!-- /SOURCES -->
- **2-dose schedule**, ≥6 months apart (standard). If faster protection is
  needed (e.g. starting college within 6 months), a 3-dose accelerated
  schedule (0, 1–2, 6 months) can be used instead.
  <!-- SOURCES: menbHealthy2Dose0and6, menbAcceleratedRapidProtection -->
  > "ACIP recommends that MenB-4C be administered to healthy adolescents and young adults aged 16–23 years as a 2-dose series at 0 and 6 months for the prevention of serogroup B meningococcal disease, based on shared clinical decision-making" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  >
  > "Persons receiving a MenB vaccine based on shared clinical decision-making who desire more rapid protection against serogroup B (e.g., students initiating vaccination <6 months before college entry) may receive the 3-dose series (0, 1–2, and 6 months) to optimize rapid protection. This guidance applies to both MenB-4C and MenB-FHbp." — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-07-24.
  <!-- /SOURCES -->
- **Dose 2 given under 4 weeks after dose 1** does **not** count (owner,
  2026-11-15; ACIP: 4 weeks between any two MenB doses). It is repeated at
  least 6 months after dose 1 (and at least 4 weeks after the uncounted dose).
  <!-- SOURCES: acip2020MenbRepeat4Weeks, owner:C12 -->
  > "For situations in which a dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  >
  > Owner decision C12, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
  <!-- /SOURCES -->
- **Dose 2 given early** (4 weeks to <6 months after dose 1) is **not
  invalid** — it's accepted, but a third "rescue" dose is then required ≥4
  months after dose 2 to complete the series. A dose 2 only 1–4 days short of
  6 months counts as on time (the 4-day grace; your C7 answer).
  <!-- SOURCES: menbRescueDoseRule, owner:C7 -->
  > "the 2 doses should be separated by 6 months. If the second dose is administered <6 months after the first dose, a third dose should be administered ≥4 months after the second dose" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  >
  > Owner decision C7, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
  <!-- /SOURCES -->

### Doses given before age 16 (healthy patients) don't count
Mirrors the MenACWY pre-age-10 rule above: a MenB dose given before 16 to a
patient with **no current MenB risk factor** is validly given (it met the
age-10 product floor) but does **not** count toward the healthy 2-dose
series. Reason: MenB antibody protection wanes within 1–2 years, so a dose
given at, say, 10 provides no protection by 16. (Shipped 2026-07-23, P0-1 —
previously this silently under-counted and could tell a healthy 16-year-old
with an old dose "you're done" when they weren't.)
<!-- SOURCES: menbHealthyPreferredAge1618, acip2020MenbShortProtection -->
> "MenB series at age 16–23 yrs on basis of shared clinical decision-making (preferred age 16–18 yrs)" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=MenB%20series%20at%20age%2016%E2%80%9323%20yrs%20on%20basis%20of%20shared%20clinical%20decision-making%20(preferred%20age%2016%E2%80%9318%20yrs)), read 2026-11-15.
>
> "the estimated relatively short duration of MenB protection (antibody waning within 1–2 years postcompletion of the primary series)" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-19.
<!-- /SOURCES -->

### High-risk (asplenia/sickle cell, persistent complement deficiency, complement-inhibitor therapy, microbiologist, serogroup B outbreak)
- Eligible starting at age 10 (no upper age limit).
  <!-- SOURCES: menbHighRisk3DoseSchedule -->
  > "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  <!-- /SOURCES -->
- **3-dose primary**: 0, 1–2 months, 6 months.
  <!-- SOURCES: menbHighRisk3DoseSchedule -->
  > "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  <!-- /SOURCES -->
  - Dose 2: ≥4 weeks after dose 1. **The card advises 1 month after dose 1** and
    says the 4 weeks beside it: "Next dose due Dec 3, 2026" over "It can be given
    from Dec 1, 2026 if needed (minimum 4 weeks)" (your Q9a answer, 2026-11-17, as
    PneumoVax). A dose given at 4 weeks still counts.
    <!-- SOURCES: menbHighRisk3DoseSchedule, owner:Q9a -->
    > "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
    >
    > Owner decision Q9a, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
    <!-- /SOURCES -->
  - Dose 3: the app **advises** it ≥6 months after dose 1 **and** ≥4 months
    after dose 2 (both must be satisfied — whichever is later wins). A dose 3
    **already given** ≥4 months after dose 2 counts, even if it came before 6
    months from dose 1 (your C5 answer, 2026-11-15: no source says not to count
    it, and CDC's software counts it). The first-booster card then opens "Why
    this" with "Dose 3 counts: it was given at least 4 months after dose 2",
    citing ACIP's "<4 months … repeated" sentence (your item 6 answer,
    2026-11-22).
    <!-- SOURCES: menbHighRisk3DoseSchedule, owner:C5, owner:item6 -->
    > "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
    >
    > Owner decision C5, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
    >
    > Owner decision item6, 2026-11-22 ([decisions-2026-11-22-item6-counted-menb-doses.md](../archive/decisions-2026-11-22-item6-counted-menb-doses.md)).
    <!-- /SOURCES -->
  - **If dose 2 was already given 6 months or more after dose 1, dose 3 is not
    needed** (corrected 2026-09-17). Those two doses are the 0-and-6-month
    schedule, so the series is complete and the patient moves to boosters. CDC
    states this in the same sentence as the 3-dose series itself. The app used
    to ask every high-risk patient for a third dose regardless, which meant
    advising an injection some patients did not need. It is the same six-month
    test as the healthy rule above, read in the opposite direction, and it is
    compared on the calendar rather than as a fixed number of days, **with the
    4-day grace** (your D4 answer, 2026-11-17). ACIP's 2024 MMWR says the same
    for every age from 10, and the first-booster card opens "Why this" with
    "Dose 3 is not needed: dose 2 was given at least 6 months after dose 1",
    citing it ("within the 4-day grace period" when the grace was needed; your
    item 6 answers, 2026-11-22).
    <!-- SOURCES: owner:D4, menbHighRiskD2SixMonthsNoD3Acip2024, cdcChildMenbHighRiskD2SixMonthsNoD3, owner:item6 -->
    > Owner decision D4, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
    >
    > "a third dose is not needed if the second dose was administered ≥6 months after the first dose" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-22.
    >
    > "if dose 2 was administered at least 6 months after dose 1, dose 3 not needed" — [CDC MenB Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-19.
    >
    > Owner decision item6, 2026-11-22 ([decisions-2026-11-22-item6-counted-menb-doses.md](../archive/decisions-2026-11-22-item6-counted-menb-doses.md)).
    <!-- /SOURCES -->
  - **If dose 3 was given under 4 months after dose 2 and under 6 months after
    dose 1, it is not counted: it is repeated at least 4 months after that dose**
    (your M1 answer, 2026-11-20: follow CDC's software and ACIP's 2024 MMWR).
    Dose 2 still counts and keeps its number. The four months are compared on
    the calendar, **with the 4-day grace** (your C7 answer): a dose 3 given 1–4
    days before 4 months after dose 2 counts. Until 2026-11-20 the app instead
    counted that dose and asked for a 4th one, from CDC's schedule notes ("a 4th
    dose should be administered at least 4 months after dose 3").
    <!-- SOURCES: menbHighRiskEarlyD3Unless, gbpRepeatSpacedFromInvalidDose, owner:M1, owner:C7 -->
    > "If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-20.
    >
    > "The repeat dose should be spaced after the invalid dose by the recommended minimum interval" — [ACIP Best Practice](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-20.
    >
    > Owner decision M1, 2026-11-20 ([decisions-2026-11-20-rulebook-reorg.md](../archive/decisions-2026-11-20-rulebook-reorg.md)).
    >
    > Owner decision C7, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
    <!-- /SOURCES -->
  - **Unless dose 3 was 6 months or more after dose 1** — then it counts and
    the series is complete, even if dose 3 came under 4 months after dose 2
    (your C6 answer: follow ACIP's 2024 MMWR, *"…unless the third dose was
    administered ≥6 months after the first dose"*). **With the 4-day grace**
    (your D3 answer, 2026-11-17): 1–4 days short of 6 months also counts. The
    first-booster card opens "Why this" with "Dose 3 counts: it was given at
    least 6 months after dose 1", citing ACIP's sentence (your item 6 answer,
    2026-11-22).
    <!-- SOURCES: menbHighRiskEarlyD3Unless, owner:C6, owner:D3, owner:item6 -->
    > "If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-20.
    >
    > Owner decision C6, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
    >
    > Owner decision D3, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
    >
    > Owner decision item6, 2026-11-22 ([decisions-2026-11-22-item6-counted-menb-doses.md](../archive/decisions-2026-11-22-item6-counted-menb-doses.md)).
    <!-- /SOURCES -->
  - **The repeat.** The card's date is the latest of: 4 months after the dose
    that did not count, 4 months after dose 2, and 6 months after dose 1. When
    the repeat would count sooner, the earliest valid date is shown beside it
    (your M1b answer). A repeat counts only if it is at least 4 months after the
    dose that did not count, with the 4-day grace (your M1c answer). Being 6
    months after dose 1 does not make the repeat count: that exception decides
    only the first dose 3 (your M1d answer, 2026-11-21). Examples: Bexsero
    Jan 1, Feb 1, Feb 15 → dose 3 is due Jul 1, earliest valid Jun 15. Jan 1,
    Feb 1, Apr 1 → due Aug 1; a repeat on Jul 10 is not counted either.
    <!-- SOURCES: menbHighRiskEarlyD3Unless, gbpRepeatSpacedFromInvalidDose, owner:M1b, owner:M1c, owner:M1d -->
    > "If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose" — [ACIP Oct 2024 MMWR](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-20.
    >
    > "The repeat dose should be spaced after the invalid dose by the recommended minimum interval" — [ACIP Best Practice](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-20.
    >
    > Owner decision M1b, 2026-11-20 ([decisions-2026-11-20-rulebook-reorg.md](../archive/decisions-2026-11-20-rulebook-reorg.md)).
    >
    > Owner decision M1c, 2026-11-20 ([decisions-2026-11-20-rulebook-reorg.md](../archive/decisions-2026-11-20-rulebook-reorg.md)).
    >
    > Owner decision M1d, 2026-11-21 ([decisions-2026-11-21-menb-repeat-dose3.md](../archive/decisions-2026-11-21-menb-repeat-dose3.md)).
    <!-- /SOURCES -->
- **Boosters**: first booster 1 year after completing the primary series,
  then every 2–3 years while the risk condition persists. The card says "every 2–3
  years"; its date is the 2-year mark, and a booster given sooner than 2 years
  (beyond the 4-day grace) does not count. A first booster sooner than 1 year
  does not count either, also when it is the 3rd dose after a 2-dose series
  (your Q1 answer, 2026-11-22).
  <!-- SOURCES: acip2020MenbBoosterCadence, menbHighRiskBoosterCadenceBox, owner:Tier1-Q1 -->
  > "a MenB booster dose 1 year after primary series completion, then every 2–3 years thereafter" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  >
  > "the first booster dose should be given 1 year after the primary series, with additional boosters every 2–3 years if the risk remains" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-10-17.
  >
  > Owner decision Tier1-Q1, 2026-11-22 ([decisions-2026-11-22-tier1-q1-q5.md](../archive/decisions-2026-11-22-tier1-q1-q5.md)).
  <!-- /SOURCES -->
  - **Serogroup B outbreak alone: one booster only** (your D10 answer,
    2026-11-17), at least 1 year after the primary series; after it the card
    reads "Complete (outbreak booster given)". ACIP 2020 Table 8: *"Single dose
    if ≥1 yr after MenB primary series completion"*. The every-2–3-years
    boosters are Tables 4, 5 and 7 (complement, asplenia, microbiologists). If
    another of those risks is also checked, its boosters win.
    <!-- SOURCES: acip2020Table8MenbOutbreakBooster, owner:D10 -->
    > "Single dose if ≥1 yr after MenB primary series completion" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
    >
    > Owner decision D10, 2026-11-17 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
    <!-- /SOURCES -->
  - **The outbreak booster counts from 6 months** (your Q5 answer, 2026-11-22,
    "Count from 6 months"). The card still dates it 1 year after the series and
    adds "Public health may advise it from 6 months after the series." A booster
    under 6 months (beyond the 4-day grace) does not count. ACIP 2020 Table 8, the
    whole cell: *"Single dose if ≥1 yr after MenB primary series completion (≥6
    mos interval might also be considered by public health professionals)"*. The
    6 months is in the outbreak table only; asplenia, complement and lab workers
    keep 1 year.
    <!-- SOURCES: acip2020Table8MenbOutbreakBoosterSixMonths, owner:Tier1-Q5 -->
    > "Single dose if ≥1 yr after MenB primary series completion (≥6 mos interval might also be considered by public health professionals)" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-22.
    >
    > Owner decision Tier1-Q5, 2026-11-22 ([decisions-2026-11-22-tier1-q1-q5.md](../archive/decisions-2026-11-22-tier1-q1-q5.md)).
    <!-- /SOURCES -->
- **Not** a MenB indication: HIV alone, immunocompromise generally, or HSCT
  alone — only the specific list above triggers high-risk MenB.
  <!-- SOURCES: acip2020MenbRiskGroups, acip2020AcwyRiskGroupsFrom2mo -->
  > "ACIP recommends routine use of MenB vaccine series among persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease, including persons who have persistent complement component deficiencies; persons receiving a complement inhibitor; persons who have anatomic or functional asplenia; microbiologists who are routinely exposed to isolates of N. meningitidis; and persons identified to be at increased risk because of a meningococcal disease outbreak caused by serogroup B" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  >
  > "ACIP also recommends routine vaccination with MenACWY for persons aged ≥2 months at increased risk for meningococcal disease caused by serogroups A, C, W, or Y, including persons who have persistent complement component deficiencies; persons receiving a complement inhibitor (e.g., eculizumab [Soliris] or ravulizumab [Ultomiris]); persons who have anatomic or functional asplenia; persons with human immunodeficiency virus infection; microbiologists routinely exposed to isolates of Neisseria meningitidis; persons identified to be at increased risk because of a meningococcal disease outbreak caused by serogroups A, C, W, or Y; persons who travel to or live in areas in which meningococcal disease is hyperendemic or epidemic; unvaccinated or incompletely vaccinated first-year college students living in residence halls; and military recruits" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-19.
  <!-- /SOURCES -->

### The two antigen families are NOT interchangeable
- **MenB-4C family:** Bexsero, Penmenvy.
  <!-- SOURCES: cdcChildMenbMinAge, penmenvyIsCrm4C, penmenvyMenb4COtherDoses -->
  > "minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC MenB Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-15.
  >
  > "A new pentavalent meningococcal vaccine (MenACWY-CRM/MenB-4C [Penmenvy, GSK]) protects against N. meningitidis serogroups A, B, C, W, and Y" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  >
  > "Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, when MenACWY-CRM/MenB-4C is used, MenB-4C should be used for the other MenB doses" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  <!-- /SOURCES -->
- **MenB-FHbp family:** Trumenba, Penbraya.
  <!-- SOURCES: cdcChildMenbMinAge, penbrayaMenbFhbpOtherDoses -->
  > "minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC MenB Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-15.
  >
  > "Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, persons who receive pentavalent MenACWY-TT/MenB-FHbp should have already received or should next receive MenB-FHbp for other MenB doses" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  <!-- /SOURCES -->

Whichever family the first known-brand dose belongs to, every later dose
(including a pentavalent substitution) must stay in that same family. If the
family is ever mismatched, that dose doesn't count and needs to be repeated
in the correct family.
<!-- SOURCES: acip2020MenbNotInterchangeable, acip2020MenbMixedProductsSelectOne -->
> "MenB vaccines are not interchangeable, and the same vaccine product must be used for all doses" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
>
> "If 2 doses were administered using different MenB products, one product should be selected for administration of an additional dose at an appropriate interval to ensure valid completion of a MenB series; the dose from the product not selected for series completion should be considered invalid" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
<!-- /SOURCES -->

### Pregnancy
MenB is deferred during pregnancy **unless** a high-risk indication overrides
it (asplenia, complement deficiency/inhibitor therapy, microbiologist, or an
active serogroup B outbreak) — in which case the high-risk schedule still
applies.
<!-- SOURCES: menbPregnancyDeferral -->
> "vaccination with MenB should be deferred unless the woman is at increased risk and, after consultation with her health care provider, the benefits of vaccination are considered to outweigh the potential risks" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-07-24.
<!-- /SOURCES -->

---

## 3. Pentavalent (MenABCWY: Penbraya, Penmenvy)

A single pentavalent shot can substitute for two separate injections **only**
when, at the same visit: the patient is ≥10 years old, a MenACWY dose is due
today, AND a MenB dose is due today (MenB "due" includes the 16–23y
shared-decision window — it doesn't have to be a hard requirement, just
on-the-table today). **No upper age** (your C4 answer, 2026-11-15): from 26 on, the combined shot is still offered
when both vaccines are due, and one already given still counts for both. Both brands are
licensed for ages 10–25, but ACIP's recommendation for high-risk patients sets only a lower
age, and ACIP outranks the licence. CDC's scheduling software (CDSI) stops at 26; this is a
chosen difference (`PENTAVALENT-UPPER-AGE`).
<!-- SOURCES: cdcAdultPenbrayaSameDay, pentavalentLicensed10to25, pentavalentHighRiskNoUpperAge, owner:C4 -->
> "Adults may receive a single dose of Penbraya (MenACWY–TT/MenB–FHbp) as an alternative to separate administration of MenACWY and MenB when both vaccines would be given on the same clinic day." — [CDC Adult Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening), read 2026-11-15.
>
> "licensed for use in persons aged 10–25 years" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-15.
>
> "persons aged ≥10 years who are at increased risk for meningococcal disease (e.g., because of persistent complement deficiencies, complement inhibitor use, or functional or anatomic asplenia)" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-15.
>
> Owner decision C4, 2026-11-15 ([stop-c-packet-2026-11-15.md](../archive/stop-c-packet-2026-11-15.md)).
<!-- /SOURCES -->

- **Also when MenB dose 2 can be given today but isn't due yet** (your F2a
  answer, 2026-11-18). High-risk MenB dose 2 is due 1 month after dose 1 but
  can be given from 4 weeks. On the days in between, if MenACWY is due, the
  combined shot is offered: *"MenACWY is due today; MenB dose 2 can be given
  today (its 4-week minimum has passed). One pentavalent (MenABCWY) dose may
  replace both."* ACIP: "may be used when both MenACWY and MenB are indicated
  at the same visit". **Dose 2 only** (your MQ6-h answer, 2026-11-21): a
  repeated dose 3 waits for its own date. On those days the MenB card's badge
  says **"Next dose not yet due"** (your MQ6-f answer, 2026-11-21, replacing
  "Can be given today"); its date line says "Next dose due <date>" and its note
  "It can be given today if needed".
  <!-- SOURCES: pentavalentHighRiskNoUpperAge, owner:F2a, owner:MQ6-f, owner:MQ6-h -->
  > "persons aged ≥10 years who are at increased risk for meningococcal disease (e.g., because of persistent complement deficiencies, complement inhibitor use, or functional or anatomic asplenia)" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-15.
  >
  > Owner decision F2a, 2026-11-18 ([decisions-2026-11-17-open-questions.md](../archive/decisions-2026-11-17-open-questions.md)).
  >
  > Owner decision MQ6-f, 2026-11-21 ([decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md](../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md)).
  >
  > Owner decision MQ6-h, 2026-11-21 ([decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md](../archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md)).
  <!-- /SOURCES -->

- **Penmenvy** = MenB-4C family → only offered/continued if the established
  family is 4C (or no family established yet).
  <!-- SOURCES: penmenvyIsCrm4C, penmenvyMenb4COtherDoses -->
  > "A new pentavalent meningococcal vaccine (MenACWY-CRM/MenB-4C [Penmenvy, GSK]) protects against N. meningitidis serogroups A, B, C, W, and Y" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  >
  > "Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, when MenACWY-CRM/MenB-4C is used, MenB-4C should be used for the other MenB doses" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  <!-- /SOURCES -->
- **Penbraya** = MenB-FHbp family → only offered/continued if FHbp (or none
  established yet).
  <!-- SOURCES: penbrayaMenbFhbpOtherDoses, cdcChildPenbrayaDose2Trumenba -->
  > "Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, persons who receive pentavalent MenACWY-TT/MenB-FHbp should have already received or should next receive MenB-FHbp for other MenB doses" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  >
  > "if Penbraya is used for dose 1 MenB, MenB-FHbp (Trumenba) should be administered for dose 2 MenB" — [CDC MenB Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-19.
  <!-- /SOURCES -->
- The pentavalent never appears as an option in the plain MenB dose list —
  only in its own dedicated recommendation.
  <!-- SOURCES: pentavalentWhenBothIndicated, cdcAdultPenbrayaSameDay -->
  > "ACIP recommended that MenACWY-CRM/MenB-4C may be used when both MenACWY and MenB are indicated at the same visit" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  >
  > "Adults may receive a single dose of Penbraya (MenACWY–TT/MenB–FHbp) as an alternative to separate administration of MenACWY and MenB when both vaccines would be given on the same clinic day." — [CDC Adult Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-mening), read 2026-11-15.
  <!-- /SOURCES -->
- **Penbraya cannot be given again within 6 months of the last Penbraya**
  (added 2026-09-17). CDC allows Penbraya for further doses only once at least
  six months have passed since the most recent one. Before this, a patient who
  had a Penbraya two months earlier was offered the combined shot again. If
  that rules out the only pentavalent the patient's MenB family allows, the app
  simply does not offer the combined injection and says why — **the vaccine
  itself is still given**, as two separate shots the same day.
  <!-- SOURCES: cdcChildPenbraya6Months -->
  > "Penbraya may be used for additional MenACWY and MenB doses (including booster doses) if both would be given on the same clinic day and at least 6 months have elapsed since most recent Penbraya dose" — [CDC MenB Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-19.
  <!-- /SOURCES -->
- **Penmenvy follows the same six-month rule** (owner decision 2026-11-15). The
  CDC schedule page names only Penbraya, but ACIP's Penmenvy report (January
  2026) says a patient who needs more MenACWY and MenB doses within 6 months of
  a pentavalent should get the two separate vaccines instead. Example: a
  17-year-old with asplenia who had Penmenvy on July 1 is offered Menveo or
  MenQuadfi plus Bexsero on September 1, not a second Penmenvy.
  <!-- SOURCES: owner:N1, penmenvySeparateUnder6Months -->
  > Owner decision N1, 2026-11-15 ([clinical-rules.md](clinical-rules.md)).
  >
  > "Persons at increased risk for meningococcal disease who receive a dose of MenACWY-CRM/MenB-4C and who are recommended to receive additional doses of MenACWY and MenB <6 months after a dose of pentavalent meningococcal vaccine should receive separate MenACWY and MenB-4C vaccines, rather than MenACWY-CRM/MenB-4C, following recommended intervals" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  <!-- /SOURCES -->
- **After a Penbraya, MenB dose 2 should be Trumenba.** The app already does
  this, through the antigen-family rule — a Penbraya sets the family to FHbp and
  only Trumenba is then offered. No change was needed.
  <!-- SOURCES: acip2020MenbNotInterchangeable -->
  > "MenB vaccines are not interchangeable, and the same vaccine product must be used for all doses" — [ACIP 2020 MMWR](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  <!-- /SOURCES -->

### A pentavalent already in the record counts for BOTH vaccines

The rules above are about *giving* a pentavalent. This one is about a pentavalent
the patient has **already had**. It is a single injection that counts as a MenACWY
dose **and** a MenB dose, so the app credits both families no matter which history
step it was typed into:
<!-- SOURCES: explains -->
<!-- /SOURCES -->

- **Record it once, on either step.** The other step then says the dose is already
  counted there and asks you not to enter it twice.
  <!-- SOURCES: record-keeping -->
  > About how the app records a dose, not about the vaccine: no source needed.
  <!-- /SOURCES -->
- **Dose numbers stay separate per vaccine.** The same shot can be MenACWY dose 3
  and MenB dose 1.
  <!-- SOURCES: pentavalentValidPerComponent -->
  > "MenACWY-CRM/MenB-4C doses deviating from the licensed 6-month interval can be considered valid for MenACWY or MenB if the timing would otherwise have been valid for that component" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  <!-- /SOURCES -->
- **It sets the MenB antigen family from either step** (Penbraya → FHbp,
  Penmenvy → 4C). A Bexsero recorded after a Penbraya is flagged as a family
  mismatch even when the Penbraya was entered on the MenACWY step.
  <!-- SOURCES: penbrayaMenbFhbpOtherDoses, penmenvyMenb4COtherDoses -->
  > "Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, persons who receive pentavalent MenACWY-TT/MenB-FHbp should have already received or should next receive MenB-FHbp for other MenB doses" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  >
  > "Different manufacturers’ serogroup B–targeting vaccines are not interchangeable; therefore, when MenACWY-CRM/MenB-4C is used, MenB-4C should be used for the other MenB doses" — [Penmenvy MMWR 2026;75(1)](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-19.
  <!-- /SOURCES -->
- **Editing or deleting the row moves both halves at once**, because there is only
  ever one row — the copy shown in the other vaccine's record is marked
  "one shot covering both — recorded under MenACWY/MenB" and is edited where it
  was entered.
  <!-- SOURCES: record-keeping -->
  > About how the app records a dose, not about the vaccine: no source needed.
  <!-- /SOURCES -->
- **The same shot recorded on both steps counts once**, not twice (matched on brand
  and date).
  <!-- SOURCES: record-keeping -->
  > About how the app records a dose, not about the vaccine: no source needed.
  <!-- /SOURCES -->

Why: CDC's child/adolescent schedule notes call a single Penbraya dose "an
alternative to separate administration of MenACWY and MenB", and tell you that
"if Penbraya is used for dose 1 MenB, MenB-FHbp (Trumenba) should be administered
for dose 2 MenB" — that sentence only makes sense if the pentavalent dose *is*
MenB dose 1. (Verified live 2026-09-16:
https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html and
ACIP MMWR 2024;73(15), https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm)
<!-- SOURCES: explains -->
<!-- /SOURCES -->

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

- **A MenACWY dose set aside for age still starts the 8-week clock** (given
  before 10, or more than 4 days too early to be the 16-year booster; your D2
  answer, 2026-11-17): the next MenACWY dose waits 8 weeks after it. A dose
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

### The label beside each recorded dose (your STOP E1 answers, 2026-11-17)

Every recorded dose gets exactly one label from this list:

| Label | When |
|---|---|
| Dose N of M / Dose N | Counted. "Dose N" alone when no series is running now (Q9; it read "Given — not part of a series this patient needs"). |
| Booster | A counted dose after the primary series (Q7: kept). |
| Not counted — repeat | Too soon, too young, or the wrong MenB family, and a card still asks for that vaccine (Q5; it read "Invalid"). The line gives the date the card gives, then how: "Repeat from Dec 17, 2026. Do not restart the series." ("repeat" is the chip's word, so the line no longer says "This dose does not count toward the series: repeat this dose only"; owner G1-a, 2026-11-18). A booster given too soon ends at its date, with no "Do not restart the series.", because a booster has no series to restart (owner G1-a-F3, 2026-11-19). If a later dose of that vaccine is already on the record, the line says "Repeated on <date>. See that dose." instead (owner F-4a, F-4b, 2026-11-18). When the card gives no date because the next dose is years away, the line says when instead: a high-risk child's MenB "Repeat at 10 years or older, when the high-risk MenB series starts."; a healthy child's MenACWY "Repeat at 11–12 years, with the routine dose."; a healthy child's MenB drops "repeat" and says "MenB is next offered at 16–23 years, by shared clinical decision-making." (owner R-A, R-B, R-C, 2026-11-18). |
| Not counted — do not repeat | The same, but no card asks for that vaccine: every card is "Complete" or "Not indicated" (Q10). A card that asks for a dose *later* ("Not yet age-eligible: start the series at 10") still asks, so that dose reads "repeat". So does a pregnancy deferral. One exception: a healthy child under 16 whose MenB was given too young reads "do not repeat", because no MenB dose is owed before the optional series at 16–23 (owner R-C, 2026-11-18). That holds even if another MenB shot followed it: a child who did not need MenB was not "repeated". A child who needed MenB (asplenia, complement, microbiologist, serogroup B outbreak) still reads "Repeated on <date>". |
| Not counted — given before age 10 / 16 | Set aside for age (Q6). |
| Not counted — Extra. Do not repeat. | Given correctly, but no card asked for it on the day it was given: the series was already complete, or no dose was recommended (Q8, Q11). This includes a patient's first dose: a healthy 30-year-old's Bexsero is Extra. A card that said "Not yet due" (it asks for a dose later) does not make a dose Extra: a healthy child's MenACWY at 10 still counts, because ACIP counts it as dose 1. **College is left alone** (Q8 follow-up): a dose given while the 5-year college cover runs still counts, because ACIP times the 5 years "since the dose". |
| No date recorded / Date is in the future / Entered twice / Dated before birth — not counted | A record problem (unchanged). |
| Needs input | Waiting for "was the patient high-risk on that date?" (unchanged). |

The cards on the day of a dose are worked out with the patient's risks as
checked today. So if a risk is checked later, those cards ask, and the doses
count.

---

## 5. The rule table — every rule that judges a recorded dose

Sections 1–4 say each rule in words. This section lists them as the app holds them, one
row per rule, with the sentences each rests on. It is written from the code
(`npm run rulebook`), never by hand, and a test fails if one cell differs from the code
(`rulebook-table-matches-code.test.js`).

<!-- RULE-TABLE:START — written by `npm run rulebook` from src/data/rulebook.js; do not edit by hand -->

Every rule that can stop a recorded dose counting, or count it with a note: 36 rules,
in the order the app checks them (the first rule that catches a dose decides it).
Written from the code; a test holds every cell to it.

| Vaccine | Who it applies to | What it catches | Counted from | Result | Label beside the dose | 4-day grace | What the sources say | Who decided | Rule |
|---|---|---|---|---|---|---|---|---|---|
| Both | Everyone | A dose dated after today | the record | Not counted (a record problem) | Date is in the future — not counted | — | Record-keeping | This app (G3, 2026-09-16) | `RECORD-FUTURE-DATE` |
| Both | Everyone | A dose dated before the patient was born | the record | Not counted (a record problem) | Dated before birth — not counted | — | Record-keeping | This app (impossible entries P1-1, 2026-09-17) | `RECORD-BEFORE-BIRTH` |
| Both | Everyone | A dose on the same date as a dose already counted | the record | Not counted (a record problem) | Entered twice — this row not counted | — | Record-keeping | This app (G7, 2026-09-16) | `RECORD-ENTERED-TWICE` |
| MenACWY | Everyone | MenACWY with no date, of a known brand whose minimum age is above the patient's age today | today | Not counted | Not counted — repeat | Yes | Owner decision | Product minimum age (brands.js) | `ACWY-UNDATED-BELOW-MIN-AGE` |
| MenACWY | Everyone | MenACWY with no date, nothing else wrong | the record | Not counted (a record problem) | No date recorded — not counted | — | A source states it | ACIP General Best Practice (only written, dated records count); owner, STOP C C1 | `ACWY-UNDATED-NOT-COUNTED` |
| MenACWY | Everyone | MenACWY given below the product's minimum age | birth | Not counted | Not counted — repeat | Yes | Owner decision | Product minimum age (brands.js); MenQuadfi 6 weeks is the owner's 2026-09-23 decision on AAP's word | `ACWY-BELOW-MIN-AGE` |
| MenACWY | routine (no ongoing risk, not on the infant series, not an outbreak contact) | MenACWY before age 10, for a patient on the routine schedule only | birth | Not counted toward this series | Not counted — given before age 10 | Yes | A source states it | ACIP 2020 (acwyBeforeAge10) | `ACWY-ROUTINE-BEFORE-10` |
| MenACWY | high-risk | MenACWY before 10, patient high-risk now, risk-at-dose question not answered | birth | Waits for "high-risk on that date?" | Needs input | Yes | Owner decision | This app (owner design 2026-07-23) | `ACWY-HIGHRISK-BEFORE-10-ASK` |
| MenACWY | high-risk | MenACWY before 10, patient high-risk now, answered "not high-risk then" or "unsure" | birth | Not counted toward this series | Not counted — given before age 10 | Yes | Owner decision | This app (owner design 2026-07-23), citing ACIP 2020 (acwyBeforeAge10) | `ACWY-HIGHRISK-BEFORE-10-NO` |
| MenACWY | high-risk | MenACWY before 10, patient high-risk now, answered "high-risk then" — judged as a high-risk series dose | birth | Counts, with a note | Dose N of M | Yes | Owner decision | This app (owner design 2026-07-23) | `ACWY-HIGHRISK-BEFORE-10-YES` |
| MenACWY | infant series (asplenia, complement, HIV, travel, outbreak; dose 1 under 2 years) | A dose of the MenACWY infant series (dose 1 under 2 years) too soon after the last, or its final dose before 12 months | last dose given | Not counted | Not counted — repeat | Yes | A source states it | CDC child schedule notes | `ACWY-INFANT-SERIES-GAP` |
| MenACWY | high-risk, series begun at 2 years or older | Dose 2 of the MenACWY high-risk series begun at 2 years or older, under 8 weeks after dose 1 | last dose given | Not counted | Not counted — repeat | Yes | A source states it | ACIP 2020 | `ACWY-HIGHRISK-PRIMARY-GAP` |
| MenACWY | medical high-risk only (asplenia, complement, HIV, complement inhibitor) | A MenACWY high-risk booster sooner than 3 years (primary finished before 7, or age unknown) or 5 years (from 7, and every later booster) | last dose given | Not counted | Not counted — repeat | Yes | Owner decision | ACIP 2020 Tables 4–6; owner, STOP C C9 (2026-11-15) | `ACWY-HIGHRISK-BOOSTER-GAP` |
| MenACWY | travel, microbiologist, A/C/W/Y outbreak, military recruit from 16 (not the routine 16-year booster) | A MenACWY booster for travel, a microbiologist, an A/C/W/Y outbreak or a military recruit (16+), sooner than 3 or 5 years | last dose given | Not counted | Not counted — repeat | Yes | Owner decision | ACIP 2020 Tables 7, 8, 9, 10; owner, STOP C C10 (2026-11-15) and D6 (2026-11-17) | `ACWY-TRAVEL-BOOSTER-GAP` |
| MenACWY | routine (no ongoing risk, not on the infant series, not an outbreak contact) | The routine 16-year MenACWY booster under 8 weeks after dose 1 | last dose given | Not counted | Not counted — repeat | Yes | A source states it | ACIP 2020 (acwyBooster8WeeksAfterDose1); owner ruling 2026-11-15 | `ACWY-ROUTINE-BOOSTER-GAP` |
| MenACWY | Everyone | Any two MenACWY doses under 8 weeks apart (also after a too-young first dose) | last dose given | Not counted | Not counted — repeat | Yes | Owner decision | ACIP 2020 (8 weeks between MenACWY doses); CDC Timing and Spacing (repeat spaced from the invalid dose by the minimum interval); owner STOP C C11 (2026-11-15) and D5 (2026-11-17) | `ACWY-ANY-TWO-DOSES-GAP` |
| MenACWY | routine (no ongoing risk, not on the infant series, not an outbreak contact) | The second counted routine MenACWY dose given before 16 | birth | Not counted toward this series | Not counted — given before age 16 | Yes | A source states it | ACIP 2020 (acwyRoutine1112and16) | `ACWY-ROUTINE-DOSE-2-BEFORE-16` |
| MenB | Everyone | MenB with no date, patient under 10 today | today | Not counted | Not counted — repeat | Yes | A source states it | CDC (menbLicensedAge1025) | `MENB-UNDATED-BELOW-10` |
| MenB | healthy (shared decision) | MenB with no date, no MenB risk, patient under 16 today | today | Not counted toward this series | Not counted — given before age 16 | Yes | Owner decision | CDC (menbHealthyPreferredAge1618) | `MENB-UNDATED-HEALTHY-UNDER-16` |
| MenB | Everyone | MenB with no date, nothing else wrong | the record | Not counted (a record problem) | No date recorded — not counted | — | A source states it | ACIP General Best Practice (only written, dated records count); owner, STOP C C1 | `MENB-UNDATED-NOT-COUNTED` |
| MenB | Everyone | MenB given below 10 years | birth | Not counted | Not counted — repeat | Yes | A source states it | CDC (menbLicensedAge1025) | `MENB-BELOW-MIN-AGE` |
| MenB | healthy (shared decision) | MenB before 16, for a patient with no MenB risk | birth | Not counted toward this series | Not counted — given before age 16 | Yes | Owner decision | This app (owner decision 2026-07-23, Option 1), citing CDC (menbHealthyPreferredAge1618) | `MENB-HEALTHY-BEFORE-16` |
| MenB | high-risk | MenB before 16, patient high-risk now, risk-at-dose question not answered | birth | Waits for "high-risk on that date?" | Needs input | Yes | Owner decision | This app (owner design 2026-07-23) | `MENB-HIGHRISK-BEFORE-16-ASK` |
| MenB | high-risk | MenB before 16, patient high-risk now, answered "not high-risk then" or "unsure" | birth | Not counted toward this series | Not counted — given before age 16 | Yes | Owner decision | This app (owner design 2026-07-23), citing CDC (menbHealthyPreferredAge1618) | `MENB-HIGHRISK-BEFORE-16-NO` |
| MenB | high-risk | MenB before 16, patient high-risk now, answered "high-risk then" — judged as a high-risk series dose | birth | Counts, with a note | Dose N of M | Yes | Owner decision | This app (owner design 2026-07-23) | `MENB-HIGHRISK-BEFORE-16-YES` |
| MenB | Everyone | A MenB dose from the other antigen family (4C vs FHbp) than the first counted dose with a known brand | first counted branded dose | Not counted | Not counted — repeat | — | A source states it | ACIP 2020 (RR-9); immunize.org | `MENB-WRONG-FAMILY` |
| MenB | high-risk | High-risk MenB dose 2 under 4 weeks after dose 1 | last dose given | Not counted | Not counted — repeat | Yes | A source states it | ACIP 2020 (MenB, 4 weeks between any 2 doses); MMWR mm7349a3; owner, STOP C C8 (2026-11-15) | `MENB-HIGHRISK-DOSE-2-GAP` |
| MenB | Everyone | A MenB dose under 4 weeks after a MenB dose that did not count (too soon, too young, or the other antigen family) | last dose given | Not counted | Not counted — repeat | Yes | A source states it | ACIP 2020 (acip2020MenbRepeat4Weeks, acip2020MenbMixedProductsSelectOne); owner STOP C C2 and E1/E2, 2026-11-15 | `MENB-REPEAT-GAP` |
| MenB | high-risk | High-risk MenB dose 3 under 4 months after dose 2 and under 6 months after dose 1, or a repeat under 4 months after the dose 3 that did not count — not counted, repeat | last dose given | Not counted | Not counted — repeat | Yes | A source states it | ACIP mm7349a3 (with its "unless"); CDSI 4.65; owner M1, M1c (2026-11-20), M1d (2026-11-21), C7, D3 | `MENB-HIGHRISK-EARLY-DOSE-3` |
| MenB | high-risk | High-risk MenB dose 3 under 6 months after dose 1 (but ≥4 months after dose 2) | dose 1 | Never flagged | Dose N of M | — | Owner decision | Owner, STOP C C5 (no source voids it) | `MENB-HIGHRISK-DOSE-3-FROM-DOSE-1` |
| MenB | high-risk | A high-risk MenB booster sooner than 1 year (first) or 2 years (later), counted in days; a serogroup B outbreak's one booster sooner than 6 months | last dose given | Not counted | Not counted — repeat | Yes | Owner decision | ACIP 2020; owner, STOP C C9 (2026-11-15); owner, Tier 1 Q1 and Q5 (2026-11-22) | `MENB-HIGHRISK-BOOSTER-GAP` |
| MenB | healthy (shared decision) | Healthy MenB dose 2 under 4 weeks after dose 1 | last dose given | Not counted | Not counted — repeat | Yes | A source states it | ACIP 2020 (acip2020MenbRepeat4Weeks); CDSI; owner STOP C C12, 2026-11-15 | `MENB-HEALTHY-DOSE-2-GAP` |
| MenB | healthy (shared decision) | Healthy MenB dose 2 under 6 months after dose 1 — counts, and a dose 3 is owed | dose 1 | Counts, with a note | Dose N of M | Yes | Owner decision | CDC notes; immunize.org; owner, STOP C C7 (the 4-day grace) | `MENB-HEALTHY-EARLY-DOSE-2` |
| MenB | healthy (shared decision) | The healthy MenB rescue dose 3 under 4 months after the early dose 2 | last dose given | Not counted | Not counted — repeat | Yes | A source states it | CDC notes | `MENB-HEALTHY-RESCUE-DOSE-3-GAP` |
| Both | routine MenACWY, single-dose MenACWY indications, healthy MenB | A counted dose past the series total, on a schedule with no booster phase (routine MenACWY, single-dose indications, healthy MenB) | the series total | Not counted (extra) | Not counted — Extra. Do not repeat. | — | Owner decision | This app (F2/F3); owner, STOP C C18 (2026-11-15) | `SERIES-CAP-EXTRA-DOSE` |
| Both | any, except college residence (owner Q8 follow-up) | A dose given on a day when every card for that vaccine asked for nothing (complete, or not indicated), after an earlier counted dose | the cards on the day of the dose | Not counted (extra) | Not counted — Extra. Do not repeat. | — | Owner decision | Owner, STOP E1 Q8 (2026-11-17): PneumoVax §C-P1-3 | `NOT-ASKED-FOR-EXTRA-DOSE` |

### The app's own decisions, numbered

The rules above that rest on a decision of this app or its owner rather than on a source's
own words. The note says what the sources say and where the app parts from them.

1. **App decision 1** (`RECORD-FUTURE-DATE`): A dose dated after today. About the entry, not the vaccine: a record lists doses already given, so a future date is a typing mistake. No clinical source is needed.
2. **App decision 2** (`RECORD-BEFORE-BIRTH`): A dose dated before the patient was born. About the entry, not the vaccine: no dose can be given before birth. No clinical source is needed.
3. **App decision 3** (`RECORD-ENTERED-TWICE`): A dose on the same date as a dose already counted. About the entry, not the vaccine: two rows on one date are one dose typed twice. No clinical source is needed.
4. **App decision 4** (`ACWY-UNDATED-BELOW-MIN-AGE`): MenACWY with no date, of a known brand whose minimum age is above the patient's age today. CDC states each product's minimum age (Penbraya 10 years among them; Penmenvy, not yet in CDC's notes, from ACIP's "aged ≥10 years"; Menactra's 9 months stated nowhere, owner 2026-11-21); the app applies it to an undated dose by reasoning that the dose was given no later than today. For MenQuadfi the app uses 6 weeks (owner decision 2026-09-23, following AAP), where CDC's notes still say 2 years.
5. **App decision 5** (`ACWY-BELOW-MIN-AGE`): MenACWY given below the product's minimum age. Menveo's minimum ages (2 months; the liquid one-vial form from 10 years) and Penbraya's (10 years) are as CDC states. Penmenvy's 10 years cites ACIP's "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" (no page states its minimum age); Menactra's 9 months is stated on no ACIP/CDC page and its line carries no source (owner 2026-11-21). MenQuadfi's 6 weeks is the owner's decision of 2026-09-23 following AAP, where CDC's notes still say 2 years (CLAUDE.md: AAP governs where the two disagree).
6. **App decision 6** (`ACWY-HIGHRISK-BEFORE-10-ASK`): MenACWY before 10, patient high-risk now, risk-at-dose question not answered. CDC splits doses before 10 by whether boosters are recommended for an ongoing risk, but does not say what to do when the risk began after the dose. The owner chose to ask (2026-07-23).
7. **App decision 7** (`ACWY-HIGHRISK-BEFORE-10-NO`): MenACWY before 10, patient high-risk now, answered "not high-risk then" or "unsure". Answered "not high-risk then" or "unsure": the dose is treated as ACIP treats a dose before 10 with no ongoing risk, and set aside. Treating "unsure" the same way is the owner's design (2026-07-23).
8. **App decision 8** (`ACWY-HIGHRISK-BEFORE-10-YES`): MenACWY before 10, patient high-risk now, answered "high-risk then" — judged as a high-risk series dose. Answered "high-risk then": the dose is judged on the high-risk schedule, as CDC says for children with an ongoing risk. Asking the question at all is the owner's design (2026-07-23).
9. **App decision 9** (`ACWY-HIGHRISK-BOOSTER-GAP`): A MenACWY high-risk booster sooner than 3 years (primary finished before 7, or age unknown) or 5 years (from 7, and every later booster). ACIP gives booster timing as a schedule ("at 3 yrs … every 5 yrs"), not as a minimum; CDC's software (CDSI) treats 3 or 5 years less 4 days as a hard minimum. Owner, STOP C C9 (2026-11-15): keep the minimums (an earlier booster does not count), and time the repeat from the early booster (Ruling D).
10. **App decision 10** (`ACWY-TRAVEL-BOOSTER-GAP`): A MenACWY booster for travel, a microbiologist, an A/C/W/Y outbreak or a military recruit (16+), sooner than 3 or 5 years. ACIP's travel, microbiologist and outbreak tables give the same 3- and 5-year booster timing as for medical risk (read live 2026-11-16), and the card advises it. Before C10 the record checked no booster gap here at all. Owner answer C10: checked like a medical high-risk booster (a floor, less the 4-day grace, as CDC's software does), the same as C9. Owner answer D6 (2026-11-17): military recruits the same, from 16 (Table 10: "Every 5 yrs on basis of assignment"; CDC's software also floors it).
11. **App decision 11** (`ACWY-ANY-TWO-DOSES-GAP`): Any two MenACWY doses under 8 weeks apart (also after a too-young first dose). ACIP and CDC state 8 weeks between MenACWY doses; owner answer C11 (2026-11-15) made it the minimum between any two (it was 4 weeks, which ACIP says only of MenB — finding R-4a). Owner answer D5 (2026-11-17) applies the same 8 weeks to the repeat of a too-young FIRST dose (E1 had said 4 weeks — MenB's number, carried over when E1 was asked for both families; CDC: "The repeat dose should be spaced after the invalid dose by the recommended minimum interval"). CDC also says a too-young first dose is repeated "on or after the date when the child reaches at least the minimum age" — the app waits the 8 weeks as well: a deliberate difference.
12. **App decision 12** (`MENB-UNDATED-HEALTHY-UNDER-16`): MenB with no date, no MenB risk, patient under 16 today. CDC gives 16–23 years (preferred 16–18) as when a healthy person is vaccinated; it does not say a dose at 10–15 does not count. Setting it aside is the owner's decision (2026-07-23, Option 1), applied here to an undated dose.
13. **App decision 13** (`MENB-HEALTHY-BEFORE-16`): MenB before 16, for a patient with no MenB risk. CDC gives 16–23 years (preferred 16–18) as when a healthy person is vaccinated; it does not say a dose at 10–15 does not count, and CDC's software would count it (minimum age 10). Setting it aside is the owner's decision (2026-07-23, Option 1).
14. **App decision 14** (`MENB-HIGHRISK-BEFORE-16-ASK`): MenB before 16, patient high-risk now, risk-at-dose question not answered. The high-risk MenB series starts at 10; the sources do not say what to do with a dose given at 10–15 before the risk began. The owner chose to ask (2026-07-23).
15. **App decision 15** (`MENB-HIGHRISK-BEFORE-16-NO`): MenB before 16, patient high-risk now, answered "not high-risk then" or "unsure". Answered "not high-risk then" or "unsure": the dose is treated like a healthy patient's dose before 16 and set aside. The owner's design (2026-07-23).
16. **App decision 16** (`MENB-HIGHRISK-BEFORE-16-YES`): MenB before 16, patient high-risk now, answered "high-risk then" — judged as a high-risk series dose. Answered "high-risk then": the dose is judged on the high-risk schedule. Asking the question at all is the owner's design (2026-07-23).
17. **App decision 17** (`MENB-HIGHRISK-DOSE-3-FROM-DOSE-1`): High-risk MenB dose 3 under 6 months after dose 1 (but ≥4 months after dose 2). ACIP gives dose 3 "at … 6 months" as a schedule; no sentence read states 6 months from dose 1 as a minimum, and CDC's software sets no minimum from dose 1 (0 days). Owner, STOP C C5 (2026-11-15): a dose 3 already given ≥4 months after dose 2 counts, whatever the gap from dose 1. The FORECAST keeps both lines (recommend.js: ≥6 months from dose 1 and ≥4 from dose 2).
18. **App decision 18** (`MENB-HIGHRISK-BOOSTER-GAP`): A high-risk MenB booster sooner than 1 year (first) or 2 years (later), counted in days; a serogroup B outbreak's one booster sooner than 6 months. ACIP gives boosters "1 year after primary series completion, then every 2–3 years" as a schedule, not as a minimum; CDC's software treats 1 and 2 years less 4 days as minimums. Owner, STOP C C9 (2026-11-15): keep the minimums (an earlier booster does not count), and time the repeat from the early booster (Ruling D). Owner, Tier 1 Q1 (2026-11-22): this holds when the first booster is the 3rd dose, after a 2-dose series. Owner, Tier 1 Q5 (2026-11-22): a serogroup B outbreak's one booster counts from 6 months, as ACIP 2020 Table 8 allows ("≥6 mos interval might also be considered by public health professionals"); the other groups keep 1 year.
19. **App decision 19** (`MENB-HEALTHY-EARLY-DOSE-2`): Healthy MenB dose 2 under 6 months after dose 1 — counts, and a dose 3 is owed. The rescue rule is stated and the app follows it: a dose 2 under 6 months counts and a dose 3 is owed at least 4 months later. The three differences found at port 2.3 are now owner-decided (STOP C, 2026-11-15): C12 a lower limit (dose 2 under 4 weeks does not count, row MENB-HEALTHY-DOSE-2-GAP); C7 the 4-day grace at the 6-month line, as CDC's software does; C3 a Bexsero 0 + 1 month course given before 24 October 2024 still gets the rescue dose 3 (current schedule for everyone), a deliberate difference from ACIP mm7349a3.
20. **App decision 20** (`SERIES-CAP-EXTRA-DOSE`): A counted dose past the series total, on a schedule with no booster phase (routine MenACWY, single-dose indications, healthy MenB). The sources give each series' size; calling a dose past it "Extra" is the app's own rule. Owner, STOP C C18 (2026-11-15): keep the rule; its words are Phase 4's question Q8, and all wording is eventually to match PneumoVax.
21. **App decision 21** (`NOT-ASKED-FOR-EXTRA-DOSE`): A dose given on a day when every card for that vaccine asked for nothing (complete, or not indicated), after an earlier counted dose. No source says when a dose nobody asked for counts. The owner chose PneumoVax's rule (2026-11-17): Extra when no card that day asked for it; a first dose stays counted; college is left alone, because ACIP times the 5-year cover "since the dose".

### The sentences each rule rests on

Each quoted sentence was read live on the page linked, on the date given. A rule with no
sentence is about the record, not the vaccine.

- `RECORD-FUTURE-DATE`: no sentence (about the record, not the vaccine).
- `RECORD-BEFORE-BIRTH`: no sentence (about the record, not the vaccine).
- `RECORD-ENTERED-TWICE`: no sentence (about the record, not the vaccine).
- `ACWY-UNDATED-BELOW-MIN-AGE`:
  - "minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]), 10 years [MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC Child/Adolescent Schedule Notes: MenACWY minimum ages](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-21.
  - "The liquid formulation should not be used before age 10 years." — [CDC Child/Adolescent Schedule Notes: Menveo one-vial (liquid) not before age 10](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
  - "Updated MenACWY recommendations to align with the American Academy of Pediatrics. The minimum age for the first MenQuadfi dose is now 6 weeks, instead of 2 years for children who meet the recommendation." — [Washington State DOH: MenQuadfi’s 6-week minimum age aligns with AAP](https://doh.wa.gov/you-and-your-family/immunizations-and-vaccines), read 2026-09-22.
  - "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" — [ACIP 2025 (Penmenvy) MMWR: recommended for persons aged ≥10 years for whom MenACWY and MenB are both indicated](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-21.
- `ACWY-UNDATED-NOT-COUNTED`:
  - "With the exception of influenza vaccine and PPSV23, providers should only accept written, dated records as evidence of vaccination" — [ACIP General Best Practice Guidelines: only written, dated records are evidence of vaccination (except influenza and PPSV23)](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-15.
  - "If records cannot be located within a reasonable time, these persons should be considered susceptible and started on the age-appropriate vaccination schedule." — [ACIP General Best Practice Guidelines: without records, treat as unvaccinated and start the age-appropriate schedule](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-15.
- `ACWY-BELOW-MIN-AGE`:
  - "minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]), 10 years [MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC Child/Adolescent Schedule Notes: MenACWY minimum ages](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-21.
  - "The liquid formulation should not be used before age 10 years." — [CDC Child/Adolescent Schedule Notes: Menveo one-vial (liquid) not before age 10](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
  - "Updated MenACWY recommendations to align with the American Academy of Pediatrics. The minimum age for the first MenQuadfi dose is now 6 weeks, instead of 2 years for children who meet the recommendation." — [Washington State DOH: MenQuadfi’s 6-week minimum age aligns with AAP](https://doh.wa.gov/you-and-your-family/immunizations-and-vaccines), read 2026-09-22.
  - "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" — [ACIP 2025 (Penmenvy) MMWR: recommended for persons aged ≥10 years for whom MenACWY and MenB are both indicated](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-21.
- `ACWY-ROUTINE-BEFORE-10`:
  - "Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years" — [ACIP 2020 MMWR: doses before age 10 do not count toward the adolescent series](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `ACWY-HIGHRISK-BEFORE-10-ASK`:
  - "Children for whom boosters are recommended because of an ongoing increased risk of meningococcal disease (e.g., those with complement component deficiency, HIV, or asplenia): Follow the booster schedule for persons at increased risk." — [CDC Child/Adolescent Schedule Notes: MenACWY before age 10 with an ongoing risk](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
  - "Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years" — [ACIP 2020 MMWR: doses before age 10 do not count toward the adolescent series](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `ACWY-HIGHRISK-BEFORE-10-NO`:
  - "Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease for which boosters are recommended should still receive MenACWY according to the recommended adolescent schedule, with the first dose at age 11–12 years and a booster dose at age 16 years" — [ACIP 2020 MMWR: doses before age 10 do not count toward the adolescent series](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `ACWY-HIGHRISK-BEFORE-10-YES`:
  - "Children for whom boosters are recommended because of an ongoing increased risk of meningococcal disease (e.g., those with complement component deficiency, HIV, or asplenia): Follow the booster schedule for persons at increased risk." — [CDC Child/Adolescent Schedule Notes: MenACWY before age 10 with an ongoing risk](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
- `ACWY-INFANT-SERIES-GAP`:
  - "dose 2 [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7 months or older, followed by an additional dose at least 12 weeks later and after age 12 months" — [CDC Child/Adolescent Schedule Notes: MenACWY infant series minimum gaps](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
  - "If MenACWY-CRM is initiated at ages 3–6 months, catch-up vaccination includes doses at intervals of 8 weeks until the infant is aged ≥7 months, at which time an additional dose is administered at age ≥7 months, followed by a dose at least 12 weeks later and after the 1st birthday." — [ACIP 2020 MMWR, Tables 4–9 footnote: the MenACWY-CRM infant series begun at 3–6 months](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-22.
  - "2 doses (second dose ≥12 wks after the first dose and after the 1st birthday)" — [ACIP 2020 MMWR: high-risk infant/toddler MenACWY-CRM series starting at age 7–23 months — 2-dose primary, dose 2 ≥12 weeks after dose 1 and after the 1st birthday](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `ACWY-HIGHRISK-PRIMARY-GAP`:
  - "Dose 1 at age 24 months or older: 2-dose series at least 8 weeks apart" — [CDC Child/Adolescent Schedule Notes: high-risk MenACWY 2-dose series from 24 months](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-15.
  - "a second dose should be administered as soon as possible, provided that an 8-week minimum interval between doses is maintained" — [ACIP 2020 MMWR: 8-week minimum between the two MenACWY primary doses](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `ACWY-HIGHRISK-BOOSTER-GAP`:
  - "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR: booster cadence, primary completed before age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR: booster cadence, primary completed at/after age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "Aged <7 yrs: Single dose at 3 yrs after vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR, Table 5 (asplenia): booster cadence, primary completed before age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-22.
  - "Aged ≥7 yrs: Single dose at 5 yrs and every 5 yrs thereafter" — [ACIP 2020 MMWR, Table 5 (asplenia): booster cadence, primary completed at/after age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-22.
- `ACWY-TRAVEL-BOOSTER-GAP`:
  - "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR: booster cadence, primary completed before age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR: booster cadence, primary completed at/after age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "Aged <7 yrs: Single dose if ≥3 yrs since vaccination" — [ACIP 2020 MMWR, Table 8 (outbreak): a booster if 3 years since vaccination, before age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-22.
  - "Aged ≥7 yrs: Single dose if ≥5 yrs since vaccination" — [ACIP 2020 MMWR, Table 8 (outbreak): a booster if 5 years since vaccination, from age 7](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-22.
  - "Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR, Table 9 (travelers, ≥2 yrs): MenACWY booster every 5 years while at risk](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  - "Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" — [ACIP 2020 MMWR, Table 7 (microbiologists, ≥10 yrs only): MenACWY booster every 5 years](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  - "Military recruits: Every 5 yrs on basis of assignment" — [ACIP 2020 MMWR, Table 10: military recruits, a booster every 5 years on the basis of assignment](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=Military%20recruits%3A%20Every%205%20yrs%20on%20basis%20of%20assignment), read 2026-11-16.
- `ACWY-ROUTINE-BOOSTER-GAP`:
  - "the booster dose can be administered at any time, as long as a minimum interval of 8 weeks between doses is maintained" — [ACIP 2020 MMWR: at least 8 weeks between dose 1 and the 16-year booster](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8 weeks)" — [CDC Child/Adolescent Schedule Notes: MenACWY catch-up, booster at least 8 weeks after dose 1](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening), read 2026-11-18.
- `ACWY-ANY-TWO-DOSES-GAP`:
  - "a second dose should be administered as soon as possible, provided that an 8-week minimum interval between doses is maintained" — [ACIP 2020 MMWR: 8-week minimum between the two MenACWY primary doses](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "the booster dose can be administered at any time, as long as a minimum interval of 8 weeks between doses is maintained" — [ACIP 2020 MMWR: at least 8 weeks between dose 1 and the 16-year booster](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "The repeat dose should be spaced after the invalid dose by the recommended minimum interval" — [ACIP General Best Practice Guidelines: a repeat dose is spaced from the invalid dose](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-20.
  - "If the first dose in a series is given ≥5 days before the recommended minimum age, the dose should be repeated on or after the date when the child reaches at least the minimum age" — [ACIP General Best Practice Guidelines: a too-young first dose is repeated once the minimum age is reached](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-15.
- `ACWY-ROUTINE-DOSE-2-BEFORE-16`:
  - "ACIP recommends a single dose of MenACWY at age 11 or 12 years followed by a booster dose administered at age 16 years" — [ACIP 2020 MMWR: routine 11–12y dose, 16y booster](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `MENB-UNDATED-BELOW-10`:
  - "minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC Child/Adolescent Schedule Notes: MenB minimum age](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-15.
  - "MenB vaccines are licensed in the United States only for persons aged 10–25 years" — [ACIP 2020 MMWR: MenB licensure (age 10–25 years)](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" — [ACIP 2025 (Penmenvy) MMWR: recommended for persons aged ≥10 years for whom MenACWY and MenB are both indicated](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-21.
- `MENB-UNDATED-HEALTHY-UNDER-16`:
  - "MenB series at age 16–23 yrs on basis of shared clinical decision-making (preferred age 16–18 yrs)" — [ACIP 2020 MMWR Table 2: healthy MenB shared clinical decision-making, preferred age 16–18 years](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=MenB%20series%20at%20age%2016%E2%80%9323%20yrs%20on%20basis%20of%20shared%20clinical%20decision-making%20(preferred%20age%2016%E2%80%9318%20yrs)), read 2026-11-15.
- `MENB-UNDATED-NOT-COUNTED`:
  - "With the exception of influenza vaccine and PPSV23, providers should only accept written, dated records as evidence of vaccination" — [ACIP General Best Practice Guidelines: only written, dated records are evidence of vaccination (except influenza and PPSV23)](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-15.
  - "If records cannot be located within a reasonable time, these persons should be considered susceptible and started on the age-appropriate vaccination schedule." — [ACIP General Best Practice Guidelines: without records, treat as unvaccinated and start the age-appropriate schedule](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-15.
- `MENB-BELOW-MIN-AGE`:
  - "minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC Child/Adolescent Schedule Notes: MenB minimum age](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-15.
  - "MenB vaccines are licensed in the United States only for persons aged 10–25 years" — [ACIP 2020 MMWR: MenB licensure (age 10–25 years)](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" — [ACIP 2025 (Penmenvy) MMWR: recommended for persons aged ≥10 years for whom MenACWY and MenB are both indicated](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm), read 2026-11-21.
- `MENB-HEALTHY-BEFORE-16`:
  - "MenB series at age 16–23 yrs on basis of shared clinical decision-making (preferred age 16–18 yrs)" — [ACIP 2020 MMWR Table 2: healthy MenB shared clinical decision-making, preferred age 16–18 years](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=MenB%20series%20at%20age%2016%E2%80%9323%20yrs%20on%20basis%20of%20shared%20clinical%20decision-making%20(preferred%20age%2016%E2%80%9318%20yrs)), read 2026-11-15.
- `MENB-HIGHRISK-BEFORE-16-ASK`:
  - "minimum age: 10 years [MenB-4C, Bexsero; MenB-FHbp, Trumenba; MenACWY-TT/MenB-FHbp, Penbraya]" — [CDC Child/Adolescent Schedule Notes: MenB minimum age](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-15.
- `MENB-HIGHRISK-BEFORE-16-NO`:
  - "MenB series at age 16–23 yrs on basis of shared clinical decision-making (preferred age 16–18 yrs)" — [ACIP 2020 MMWR Table 2: healthy MenB shared clinical decision-making, preferred age 16–18 years](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#:~:text=MenB%20series%20at%20age%2016%E2%80%9323%20yrs%20on%20basis%20of%20shared%20clinical%20decision-making%20(preferred%20age%2016%E2%80%9318%20yrs)), read 2026-11-15.
- `MENB-HIGHRISK-BEFORE-16-YES`:
  - "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease" — [ACIP Oct 2024 MMWR: MenB-4C high-risk 3-dose series, 0/1–2/6 months](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
- `MENB-WRONG-FAMILY`:
  - "MenB vaccines are not interchangeable, and the same vaccine product must be used for all doses" — [ACIP 2020 MMWR: MenB products are not interchangeable](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `MENB-HIGHRISK-DOSE-2-GAP`:
  - "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease" — [ACIP Oct 2024 MMWR: MenB-4C high-risk 3-dose series, 0/1–2/6 months](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  - "For situations in which a dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses" — [ACIP 2020 MMWR (MenB section): 4 weeks between doses when a MenB dose is repeated](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `MENB-REPEAT-GAP`:
  - "For situations in which a dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses" — [ACIP 2020 MMWR (MenB section): 4 weeks between doses when a MenB dose is repeated](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "If 2 doses were administered using different MenB products, one product should be selected for administration of an additional dose at an appropriate interval to ensure valid completion of a MenB series; the dose from the product not selected for series completion should be considered invalid" — [ACIP 2020 MMWR: after two different MenB products, pick one to finish the series](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
  - "The repeat dose should be spaced after the invalid dose by the recommended minimum interval" — [ACIP General Best Practice Guidelines: a repeat dose is spaced from the invalid dose](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-20.
  - "If the first dose in a series is given ≥5 days before the recommended minimum age, the dose should be repeated on or after the date when the child reaches at least the minimum age" — [ACIP General Best Practice Guidelines: a too-young first dose is repeated once the minimum age is reached](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-15.
- `MENB-HIGHRISK-EARLY-DOSE-3`:
  - "If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose" — [ACIP Oct 2024 MMWR: an early high-risk MenB dose 3 is repeated ≥4 months after it, unless it was 6 months after dose 1](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-20.
  - "The repeat dose should be spaced after the invalid dose by the recommended minimum interval" — [ACIP General Best Practice Guidelines: a repeat dose is spaced from the invalid dose](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-20.
  - "if dose 3 is administered earlier than 4 months after dose 2, a 4th dose should be administered at least 4 months after dose 3" — [CDC Child/Adolescent Schedule, MenB special situations: counts an early dose 3 and adds a 4th dose (the app follows ACIP 2024 instead)](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-mening-b), read 2026-11-15.
- `MENB-HIGHRISK-DOSE-3-FROM-DOSE-1`:
  - "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk for serogroup B meningococcal disease" — [ACIP Oct 2024 MMWR: MenB-4C high-risk 3-dose series, 0/1–2/6 months](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  - "If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose" — [ACIP Oct 2024 MMWR: an early high-risk MenB dose 3 is repeated ≥4 months after it, unless it was 6 months after dose 1](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-20.
- `MENB-HIGHRISK-BOOSTER-GAP`:
  - "a MenB booster dose 1 year after primary series completion, then every 2–3 years thereafter" — [ACIP 2020 MMWR: high-risk MenB booster schedule](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  - "Single dose if ≥1 yr after MenB primary series completion" — [ACIP 2020 MMWR Table 8: one MenB booster for a serogroup B outbreak](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-21.
  - "Single dose if ≥1 yr after MenB primary series completion (≥6 mos interval might also be considered by public health professionals)" — [ACIP 2020 MMWR Table 8: an outbreak MenB booster from 6 months, if public health advises it](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-22.
- `MENB-HEALTHY-DOSE-2-GAP`:
  - "For situations in which a dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses" — [ACIP 2020 MMWR (MenB section): 4 weeks between doses when a MenB dose is repeated](https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm), read 2026-11-15.
- `MENB-HEALTHY-EARLY-DOSE-2`:
  - "the 2 doses should be separated by 6 months. If the second dose is administered <6 months after the first dose, a third dose should be administered ≥4 months after the second dose" — [ACIP Oct 2024 MMWR: healthy 2-dose interval and the third dose after an early dose 2](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  - "There is no recommendation to administer additional doses to persons vaccinated with MenB-4C before October 24, 2024, using a 0- and 1-month dosing schedule." — [ACIP Oct 2024 MMWR: no extra doses for people who had Bexsero at 0 and 1 month before October 24, 2024](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
- `MENB-HEALTHY-RESCUE-DOSE-3-GAP`:
  - "the 2 doses should be separated by 6 months. If the second dose is administered <6 months after the first dose, a third dose should be administered ≥4 months after the second dose" — [ACIP Oct 2024 MMWR: healthy 2-dose interval and the third dose after an early dose 2](https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm), read 2026-11-15.
  - "The repeat dose should be spaced after the invalid dose by the recommended minimum interval" — [ACIP General Best Practice Guidelines: a repeat dose is spaced from the invalid dose](https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html), read 2026-11-20.
- `SERIES-CAP-EXTRA-DOSE`: no sentence (about the record, not the vaccine).
- `NOT-ASKED-FOR-EXTRA-DOSE`: no sentence (about the record, not the vaccine).

<!-- RULE-TABLE:END -->

---

## Where this is implemented

| Rule area | File |
|---|---|
| Every rule that judges a recorded dose (the rule table, one row per rule; section 5) | `src/logic/doseRules.js` |
| Walks the rule table over each dose; counting, age exclusions | `src/logic/validate.js` |
| MenB series length and the dose 2 / dose 3 timing decisions (`menbSeriesInfo`, `menbHighRiskDose3Early`, `menbHealthyDose2Early`) | `src/logic/seriesTotals.js` |
| Gaps between doses and booster intervals | `src/logic/intervals.js` |
| Ages (schedule floors, age bands) | `src/logic/ages.js` |
| What's due today / next, boosters, pentavalent gate | `src/logic/recommend.js` |
| Risk factor → schedule class mapping | `src/data/riskFactors.js` |
| Brand → antigen family, min ages | `src/data/brands.js` |
| Citations | `src/data/refs.js` |
| Section 5 and the source lines under sections 1–3 (generated by `npm run rulebook`) | `src/data/rulebook.js` |
| The in-app Rulebook screen | `src/data/rulebookPage.js`, `src/components/Rulebook.jsx` |

## Keeping this in sync

This doc exists because rules drift as new test cases surface edge cases.
**Whenever `doseRules.js`, `recommend.js`, `seriesTotals.js`, `intervals.js` or `ages.js`
changes a rule described above,
update this file in the same commit/PR**. Section 5 is not edited by hand: after any change to
a row of `src/logic/doseRules.js` or a quoted sentence in `src/data/refs.js`, run
`npm run rulebook` and read the diff (every changed line is a rule that changed). Don't let this document silently go stale; if you're not sure
it's current, re-derive the relevant section from the code rather than
trusting it.
