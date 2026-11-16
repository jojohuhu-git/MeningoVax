# Report — CDC's CDSI test patients run through MeningoVax (port Phase 1.5), 2026-11-15

**What this is.** Phase 1.5 of the PneumoVax port (plan in PneumoVax:
`docs/archive/plan-2026-11-08-meningovax-port.md`, item M-CDSI-2). CDC publishes test
patients for its CDSI software (CDSI = CDC's machine-readable version of ACIP's schedule).
Each one is a made-up patient with dose dates and CDC's expected answer: does each dose
count, and what is next, when. This step feeds all of CDC's meningococcal ones into
MeningoVax and lists where the two answers differ. Phase 1.4 asked whether the app agrees
**with itself**; this asks whether it agrees **with CDC's software**.

**CDSI is a cross-check, not the authority.** It runs behind ACIP; where CDSI and CDC/ACIP
wording differ, the wording wins (owner rules 2026-08-10 and 2026-10-17). So a difference
below is a question, never a bug by itself. **Findings are listed, not fixed.** Nothing in
the app changed in this step.

Run: `npx vite-node scripts/cdsi/runTestCases.mjs` on branch
`feature/2026-11-15-phase1-5-cdsi-test-patients`, 2026-11-15. Under one second.
CDC files: test cases v4.46 (healthy) and v4.6 (underlying conditions); rules CDSI 4.65.
Each patient is run with "today" set to CDC's own assessment date.

## At a glance

| | MenACWY | MenB | Both |
|---|---|---|---|
| CDC test patients | 52 | 52 | **104** |
| Same answer as CDC, every dose and the next step | 32 | 33 | **65** |
| Differ | 20 | 19 | **39** |

Doses: 180 in all — **158 same verdict, 13 different, 9 the app cannot record** (old
products, below).

The 39 that differ, each by its most pressing family:

| Kind | Patients | Meaning |
|---|---|---|
| **OPEN** | 23 | A question for the owner. **11 of these are the same date with a different label** ("Complete" beside "Booster due at 16y"). |
| DELIBERATE | 8 | The app follows ACIP wording or newer CDC data on purpose |
| SAME ADVICE | 3 | Same advice in a different shape |
| NOT COMPARABLE | 5 | CDC's patient needs an input or a product the app does not have |

Where the **next date itself** differs (or CDC books a dose the app does not): 13 patients
— one is deliberate (2019-UC-0007), one is a single calendar day (2024-0040).

## Findings, by family, one worked patient each

Patient IDs are CDC's (`CDC_Test_ID`). "Engine" = run through `recommend()`; "on screen" =
entered into the running app at http://localhost:5178/MeningoVax/ on 2026-11-15.

### 1. "Complete" beside "Booster due at 16y" — 13 patients — OPEN (label; 11 same date)

A healthy 10–15-year-old with the routine dose on record. The app's card says
**Complete — "Booster due at 16y"** and shows the booster date; CDC calls the booster the
next dose owed ("Not complete"). In 11 of 13 the date is **identical to CDC's**; the other
two (2013-0489, 2013-0500) differ for the reasons in families 5 and 7.

This is the 2nd half of STOP B question B already raised by Phase 1.4 (finding B): keep
status "Complete" beside a booster that is still coming? The CDC patients add no new
question, only an outside view: CDC's software does not call it complete.

Worked (engine): 2013-0487, born 2015-08-05, MenQuadfi 2026-08-05 at 11 y 0 mo. App:
"Complete — Booster due at 16y", booster date 2031-08-05. CDC: not complete, dose 2 on
2031-08-05.

### 2. Healthy MenB at 16–23 shown as "shared clinical decision" — 14 patients — DELIBERATE (label only)

ACIP gives healthy 16–23-year-olds MenB by shared clinical decision-making; the app's
card says so. CDC's software calls the very same series "Shared Clinical Decision Making"
in its rule file (series names *"Meningococcal B 2-dose series MenB-4C Shared Clinical
Decision Making"*, CDSI 4.65) but its test patients forecast the dose like any other.
Label only: **7 of the 14 have the same date**; the other 7 are judged in families 6, 7,
8, 9 and 13 (and 2025-0015, same date, also sits in family 4).

### 3. Nothing due today; CDC names the start date, the app names the age — 2 — SAME ADVICE

2013-0502 (healthy 10-year-old, no doses): app "Not yet due… The routine schedule starts
at 11–12 years"; CDC: dose 1 on the 11th birthday. 2024-0068 (MenB, 15 y 7 mo, one MenB of
unknown product): app "Shared clinical decision-making applies from 16"; CDC: dose 1 on the
16th birthday. Nothing is due today in either.

### 4. An early MenB dose 2: CDC repeats it, the app adds a third — 2 — SAME ADVICE

2025-0015 (Penmenvy then Penmenvy 5 months 26 days later) and 2020-UC-0003 (Trumenba,
then Trumenba 4 months later, patient "seeks MenB protection"). CDC: dose 2 does not count,
give dose 2 again. App: dose 2 counts but was early, give a rescue dose 3. **Same next
date, same number of injections left** — only the label on dose 2 differs.

### 5. MenACWY at 10 years minus 1–4 days — 4 patients — OPEN

The app gives CDC's 4-day grace at the age-10 line and counts the dose as the adolescent
dose 1. CDC's rule file sets that series' **absolute minimum age at exactly "10 years"**
(no grace): CDSI 4.65 `Meningococcal ACWY 2-dose series`, dose 1, `absMinAge` "10 years",
`minAge` "11 years". In three patients a later dose (at 10 years 1 month) takes over and
the answer ends up the same; in **one it changes the answer**:

**Worked (on screen, 2026-11-15): 2013-0500**, born 08/06/2016, no risk boxes, Menveo
2-vial on 08/05/2026 (age 9 years 11 months, 10 years minus 1 day). The screen says:
**"Booster due at 16y — Booster not yet due - Aug 6, 2032"**, and under the dose:
*"D1 · Aug 5, 2026 · age 9 years 11 months · Menveo 2-vial — Dose 1 of 2. The dose given at
age 10 counts as the first dose of the adolescent series — no repeat is needed now."*
CDC: the dose is "Not Valid (Age: Too Young)"; **dose 1 is due at 11, on 2027-08-06.**
So CDC's software would give one more dose than the app.

Side note seen on screen: the chip says "age 9 years 11 months" and the sentence beside it
says "the dose given at age 10" — the screen contradicts itself on the age.

Control (engine): 2013-0499, the same dose on the 10th birthday exactly — both count it,
both give the booster at 16 on the same date.

Ties to Phase 1.4's question E (does the grace choose the schedule?) and the plan's rule
§3, *"The grace decides what is accepted, never what is advised."* Here the grace decides
whether the dose is accepted as the adolescent dose, and that in turn removes the dose at
11. To ask at STOP B.

### 6. Healthy MenB rescue dose 3: 4 months after dose 2, or also 6 after dose 1? — 2 — OPEN

2024-0034: Bexsero 2026-07-08 and 2026-08-05 (4 weeks apart, age 20). App: dose 3
"at least 4 months after dose 2" → **2026-12-05**. CDC: dose 3 earliest **2027-01-08**
(6 months after dose 1). CDC's rule file (`Meningococcal B 3-dose series MenB-4C Shared
Clinical Decision Making`, dose 3) has two gaps: 4 months from the previous dose, and
"6 months" from dose 1 **with an absolute minimum of "0 days"** — so CDC's software would
still count a dose given on the app's date; it only forecasts later. 2024-0035 is the same
shape. For high-risk patients the app already waits for both (CLAUDE.md, "MenB D3 — Both
Floors Required"); for healthy patients it waits only for the 4 months. Source to read live
before any change (`verify-clinical-source`): the CDC notes' wording on the third dose.
Packet 1, Q2.

### 7. MenB dose 2 under 4 weeks after dose 1 — 2 — OPEN

2024-0036: Bexsero 2026-07-13 and again 2026-08-05 (3 weeks 2 days later, 4 weeks minus
5 days), age 16. CDC: dose 2 "Not Valid (Interval: too Soon)" — its absolute minimum is
"4 weeks - 4 days" — and dose 2 again on 2027-01-13. App: *"Dose is accepted (not
invalid), but a third rescue dose ≥4 months after this dose is now needed"* → 2026-12-05.
2025-0014 (Bexsero then Penmenvy 3 weeks later) is the same. Packet 1, Q2.

### 8. A dose that does not count: where does the clock start? — 2 — OPEN (= Ruling D)

2013-0489: Menveo at 11, then MenQuadfi at 15 years 11 months (16 years minus 5 days,
beyond the grace). Both agree the second dose does not count. CDC spaces the repeat **8
weeks from that dose** (2026-09-30); the app gives the 16th birthday (2026-08-10).
2024-0081: Bexsero, then Trumenba 6 months later (wrong antigen family). Both agree it
does not count. CDC: next dose 4 months after the Trumenba (2026-12-05); app: Bexsero due
today. This is Ruling D (packet 1, Q1), already on the plan.

### 9. MenB of unknown product — 1 — OPEN

2024-0069: a healthy 17-year-old with one MenB dose of unrecorded product, 2026-08-05.
CDC's own description: *"the dose is not valid because the formulation must be known.
Another dose should forecast in four weeks."* The app counts it as dose 1 and gives dose 2
six months later, offering **both** Bexsero and Trumenba on a card labelled "Dose 2 of 2
(same family)" — the label promises a family the record cannot name.

### 10. High-risk MenB dose 3 under 6 months after dose 1 — 1 — OPEN

**Worked (on screen, 2026-11-15): 2020-UC-0004**, born 05/02/2008, asplenia ticked,
Trumenba on 05/02/2020, 05/30/2020 and 09/30/2020. The app first asks, for each dose,
"Was this patient at high risk for meningococcal disease when this dose was given?" —
answered Yes ×3 (CDC's condition has no start date). Then dose 3 reads **"Invalid — Given
only ~5 months after dose 1. High-risk D3 requires ≥6 months from D1. This dose does not
count toward the series: repeat this dose only"**, and the card asks for **Dose 3 of 3
today**. CDC counts all three doses and books the 1-year booster (2021-09-30): its
"6 months from dose 1" has an absolute minimum of "0 days" (CDSI 4.65,
`Meningococcal B risk 3-dose series MenB-FHbp Increased Risk`, dose 3). Dose 3 was 4
months after dose 2, so the app's other floor was met. Already listed in the CDSI plan as
an expected difference for item 2.3; packet 1, Q2.

### 11. Infant outbreak series complete — 1 — OPEN (= Phase 1.4 finding B)

2016-UC-0116: Menveo at 7 and 12 months, outbreak box. App: "Complete (infant outbreak
series)… another dose is given only if the patient is identified at risk in a NEW
outbreak". CDC: booster 3 years later (its rule file puts outbreak, code 070, in the same
infant risk series as complement deficiency, with boosters at 3 and 5 years). This is
STOP B question B, first half.

### 12. Military recruit, one dose — 1 — OPEN

2025-UC-0019: a 20-year-old recruit, Penmenvy on 2025-07-06. App: "Complete — Check the
service's current requirement — do not assume nothing more is due." CDC: booster on
2030-07-06 (5 years). New; not asked before.

### 13. One calendar day — 1 — OPEN

2024-0040: Trumenba 2026-02-05 and 2026-07-31. Rescue dose 4 months after July 31: app
**Nov 30**, CDC **Dec 1**. `dateUtils.js` is mirror-synced with PneumoVax, which lists the
same 1-day family (its 2013-0580); a change goes to both apps or neither.

### 14. Microbiologist on Bexsero — 1 — DELIBERATE

2019-UC-0007: three Bexsero doses (0, 1 month, 21 months). App: booster 1 year after
dose 3 (2021-02-20). CDC's expected answer: 2 years (2022-02-20). The test patient was
last changed in CDSI 4.2, before Bexsero's high-risk series became 3 doses; it reads dose
3 as the first booster. CDC's **current** rule file (4.65, `Meningococcal B risk 3-dose
series MenB-4C increased risk`: 3 doses, then a booster at "1 year") gives the app's date.

### 15. Not comparable — 5

Severe allergic reaction to a previous dose (2016-UC-0011, 2016-UC-0203): the app has no
contraindication input. Doses of MenCY-Hib (Menhibrix; 2023-UC-0021, 2023-UC-0023) or
MPSV4 (Menomune; 2016-UC-0129), both discontinued: the app has no entry for them, and they
were left out rather than entered as something else.

## Found on the way, not a CDC difference

**The pentavalent card speaks before the dose questions are answered.** On 2020-UC-0004,
before the three "was the patient at high risk then?" questions were answered, the screen
said **"MenB — Answers needed"** and, below it, **"Both MenACWY and MenB are due today, so
one pentavalent (MenABCWY) dose may replace the two injections."** Over the app's own saved
and typical patients (35,281): **2,909 (1,816 grid / 1,093 typical)** are offered the
pentavalent while a dose question is still unanswered. The engine treats an unanswered
dose as not counting (by design), so MenB looks due; the MenB card waits for the answer,
the pentavalent card does not. Listed, not fixed.

## Judgement calls in matching CDC's codes to the app (written in the script)

- Menveo (CDC code 136, vial unknown) → "Menveo 2-vial" (both Menveo entries start at 2
  months, so this never rejects a dose CDC's code allows).
- "Unspecified" MenACWY (147) or MenB (164) → the app's "Unknown brand".
- A pentavalent → the list of the vaccine CDC's patient is about; the app credits it to
  the other list itself.
- Sickle cell disease (259) → the asplenia box (its label names sickle cell disease).
- "At risk during an outbreak" (070) → the outbreak box for the vaccine the patient is about.
- "Patient seeks MenB protection" (177) → no box; a shared-decision card is then read as
  asking for the dose.
- "Was the patient already at high risk when this dose was given?" → answered **yes**
  (CDC's conditions carry no start date and its software applies them to the whole
  history). Needed for 20 of 104 patients.
- CDC's "Extraneous" (a dose after the series was complete) → agrees with any app verdict
  except "invalid".

## How the script was proved to work

The app was broken three ways, one at a time, and each was caught; the code was restored
after each (`git checkout`), and `git diff src` is empty.

| Break | Caught as |
|---|---|
| 16-year MenACWY booster gap 8 weeks → 4 weeks | 3 answers moved (2013-0488, 2013-0510, 2013-0511) |
| First MenACWY booster from age 7: 5 years → 4 | 2 NEW disagreements + 2 answers moved |
| High-risk MenB dose 3: 6 months from dose 1 → 4 | 2 NEW + 3 moved, and 2020-UC-0004 reported "now agreeing" |

The first break exposed a hole, now closed: the known-families list is by patient, so a
known patient whose answer **moved** went unseen. The script now also saves every
patient's answer (`cdc-files/meningo-app-answers.json`) and lists any that move. PneumoVax's
script has the same hole; worth porting back.

## What is not covered

- **Not a required test yet.** Same as PneumoVax: it becomes one (fails on a NEW
  disagreement or a moved answer) after the owner has seen the families.
- Only the vaccine CDC's patient is about is compared; the app's card for the other vaccine
  is ignored.
- CDC's "past due" date is not judged, except to report an app date after it.
- The pentavalent card is not compared (CDC's patients ask one vaccine at a time).
- CDC's rule file itself is not compared to the app here; that is item 2.3.

## Questions this adds for STOP B (ask, don't default)

1. **Family 5:** a MenACWY dose at 10 years minus 1–4 days — count it as the adolescent
   dose 1 (the app now), or give a dose at 11 (CDC's software)?
2. **Family 12:** a military recruit's single dose — keep "Complete, check the service",
   or book the 5-year booster as CDC's software does?
3. **Families 6, 7, 9, 10** go to packet 1, Q2 (rows where the app and the sources differ);
   **family 8** is packet 1, Q1 (Ruling D). Families 1 and 11 are STOP B question B, already
   asked.
4. **Side finding:** should the pentavalent card wait for the dose questions, like the
   MenB card does?
