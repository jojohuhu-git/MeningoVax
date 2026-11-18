# Owner answers, 2026-11-17 — the open questions after Phase 3 (D1–D8)

**What this is.** The six open questions in the 2026-11-17 handoff (PneumoVax
`docs/archive/handoff-2026-11-17-meningovax-phase3-built.md`), asked one patient at a time, plus
two follow-ups. Every example was run through the real engine on 2026-11-17. Every quote was
read live on 2026-11-17:

- ACIP 2020 MMWR rr6909a1 — https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm
- ACIP 2024 MMWR mm7349a3 — https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm
- CDC Timing and Spacing of Immunobiologics —
  https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html
- immunize.org Item #P2018 (10/19/2026) — https://www.immunize.org/catg.d/p2018.pdf

**Nothing was changed when these were asked.** Each is built in its own commit, named by its ID.

| # | Question | Owner answer | Sources |
|---|---|---|---|
| D1 | College dorm: a MenACWY dose at ≥16, given more than 5 years before college entry | **Add the 5-year limit.** Within 5 years → Complete; more than 5 years → 1 dose due. **Reverses M17 (2026-09-15).** M17 rested on the sentence *"Adolescents who receive a first dose after their 16th birthday do not need a booster dose unless they become at increased risk"*, which is in ACIP's **routine** section; the code comment presented it as the college footnote | ACIP 2020 Table 10 footnote: *"Adolescents who received a first dose after their 16th birthday do not need another dose before college entry unless it has been more than 5 years since the dose."* Body text: *"…unless >5 years have elapsed since the dose."* P2018 college row: *"1 prior dose since 16th birthday, but more than 5 years previously — Give 1 dose of MenACWY"* |
| D2 | A MenACWY dose 5 days before 16 (set aside: too early for the 16-year dose, outside the 4-day grace) | **It starts the 8-week clock.** Patient born 2010-01-10, doses 2021-03-01 and 2026-01-05: booster from 2026-03-02, not on the 16th birthday (2026-01-10). Closes CDC test patient 2013-0489 | ACIP 2020: *"the booster dose can be administered at any time, as long as a minimum interval of 8 weeks between doses is maintained"* |
| D3 | High-risk MenB dose 3 within 4 days short of 6 months after dose 1 (and under 4 months after dose 2) | **Use the 4-day grace** on mm7349a3's "unless" line: no 4th dose | mm7349a3: *"If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was administered ≥6 months after the first dose."* CDC: *"vaccine doses administered ≤4 days before the minimum interval or age are considered valid"* |
| D4 | High-risk MenB dose 2 within 4 days short of 6 months after dose 1 | **Use the 4-day grace:** no dose 3 | mm7349a3: *"a third dose is not needed if the second dose was administered ≥6 months after the first dose"* |
| D5 | Repeat of a too-young FIRST MenACWY dose | **8 weeks after it (MenACWY); MenB stays 4 weeks.** Revises E1 (2026-11-15) for MenACWY. The owner caught the error: the 4 weeks is MenB's number (and PCV's), carried over when E1 was asked for both families at once; no MenACWY source gives 4 weeks. Infant born 2026-06-01, Menveo 2026-07-10: repeat from 2026-09-04, not 2026-08-07. PneumoVax unchanged (PCV's minimum is 4 weeks) | CDC Timing and Spacing: *"The repeat dose should be spaced after the invalid dose by the recommended minimum interval"* (MenACWY: 8 weeks, ACIP 2020). MenB 4 weeks: ACIP 2020 *"For situations in which a MenB dose or doses must be repeated, a minimum interval of 4 weeks should be used between any 2 doses"* |
| D6 | Military booster given too soon (e.g. 10 weeks after dose 1) | **Check it like travel** (C10): under 5 years (less 4 days) it does not count; the next date is timed from it (C9), so the date usually stays and the dose label changes | ACIP 2020 Table 10: *"Every 5 yrs on basis of assignment"* |
| D7 | Outbreak: later boosters in young children | **Keep 3 years then every 5** (unchanged). Owner checked the example's dose 2 against P2018 (valid: 12 weeks 6 days after dose 1, after age 12 months) and asked that **every outbreak card, MenACWY and MenB, say "if outbreak risk continues"** — the young-child MenACWY card did not | P2018: *"If primary vaccination is completed before the 7th birthday: give one booster dose 3 years after primary series, then every 5 years thereafter, as long as risk remains."* |
| D8 | Mixed MenB products: offer the switch (E2's unbuilt option) | **Add one line** to the card: the date to finish with the other product instead, and that the first product's dose then does not count | ACIP 2020: *"If 2 doses were administered using different MenB products, one product should be selected for administration of an additional dose at an appropriate interval to ensure valid completion of a MenB series; the dose from the product not selected for series completion should be considered invalid"* |

## Asked later the same day (D9, D10)

| # | Question | Owner answer | Sources |
|---|---|---|---|
| D9 | College card after D1: keep "Complete (dose given at ≥16y)", or "Covered for college until <dose + 5 y>" with "if still in a residence hall then, give 1 dose"? | **Neither change; the proposal was wrong.** Owner: *"I do not see a reference where a repeat dose is needed in 5 years if remaining in residence hall."* Correct: the 5 years is checked once, at college entry (the box is "First-year college student"). No repeat for staying in a dorm. "Complete" stays; no code changed. Wording in `meningococcal-rules-summary.md` clarified | ACIP 2020 Table 10 footnote (D1 above): *"…do not need another dose before college entry unless it has been more than 5 years since the dose"* — about entry, not residence |
| D10 | Serogroup B outbreak (no other MenB risk): after one booster, the app asked for more every 2–3 years. Patient 21y, Bexsero 1/1/24, 3/1/24, 7/1/24, booster 8/1/25: dose 5 asked for 8/1/27 | **One booster.** Then "Complete (outbreak booster given)". Asplenia/complement/microbiologist keep every 2–3 years; with one of them also ticked, theirs win | ACIP 2020 Table 8 (read live 2026-11-17): *"Single dose if ≥1 yr after MenB primary series completion (≥6 mos interval might also be considered by public health professionals)"*. Tables 4, 5, 7: *"Single dose at 1 yr after completion of primary vaccination and every 2–3 yrs thereafter."* mm7349a3: booster recommendations *"are unchanged"* |

## Asked while building B-1 (D11, D12, D13)

B-1 (STOP B, 2026-11-15): use the 4-day grace at an age line that picks the MenACWY schedule "only when it helps" (fewer doses owed). Two lines the ruling did not settle on its own terms:

| # | Question | Owner answer | Sources |
|---|---|---|---|
| D11 | Age 7: the grace never changes the doses owed, only whether the first booster comes at 3 or 5 years. Patient born 3/10/2019, travel, MenQuadfi 3/8/2026 (2 days before 7): booster 3/8/2029; control on the birthday: 3/10/2031 | **3 years** — age 7 is not a grace line; a primary finished 1–4 days before 7 keeps the 3-year booster | ACIP 2020 Table 9 (read live 2026-11-17): *"Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter"* / *"Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination…"*. CDC General Best Practices: *"vaccine doses administered ≤4 days before the minimum interval or age are considered valid"* |
| D12 | 3 months (not named in B-1): asplenia, born 1/10/2026, Menveo 4/8/2026 (2 days before 3 months) and 8/10/2026: "Dose 3 of 4"; control dose 1 on 4/10: "Dose 3 of 3" | **Yes, grace helps** — the 3-month line joins 7 months and 2 years | CDC child & adolescent notes (read live 2026-11-17): *"Dose 1 at age 2 months: 4-dose series"* / *"Dose 1 at age 3–6 months: 3- or 4- dose series …"* |

| D13 | 16 years (filed under B-1 by the D10 session; CDC 2013-0488, 2013-0511): healthy, born 8/9/2010, Menveo at 11 and 8/5/2026 (4 days before 16). Seen that day: "Booster due at 16y, waits 8 weeks (9/30/2026)"; seen after the birthday: "Complete" | **Yes, Complete** on the dose day too | CDC General Best Practices (above); ACIP 2020 Table 2 (booster at 16). CDSI: "Not recommended: series complete" |

B-1, D11, D12 and D13 built 2026-11-17 (`regression-2026-11-17-b1-grace-only-when-it-helps.test.js`).

Still open (not asked this session): MenB of
unknown product at 16+ (CDC 2024-0069); healthy MenB rescue dose 3 waiting for 6 months from
dose 1 (CDC 2024-0034/0035); the 1-day calendar difference (2024-0040, shared with PneumoVax).

## STOP E1 — Phase 4, one label per dose (Q5–Q9), answered 2026-11-17

Asked one patient at a time; every patient was run through the real engine on 2026-11-17 (`main`
at `3cb256c`). Quotes read live 2026-11-17: CDC Timing and Spacing of Immunobiologics; ACIP 2020
MMWR rr6909a1. The PneumoVax wording each was set against is its `src/components/doseChipLabel.js`
(origin/main, 2026-11-17).

| # | Question | Owner answer | Sources |
|---|---|---|---|
| Q5 | A dose given too soon. Asplenia, 20 y, Menveo 1/10/26 and 2/1/26 (3 weeks; 8 is the minimum). Today: "Invalid … repeat this dose only". PneumoVax (W1) says "Not counted — do not repeat" | **"Repeat", not "do not repeat".** Owner: *"pneumovax's context for do not repeat is different… For Menveo saying do not repeat and then giving the next due date is confusing."* Label: **"Not counted — repeat"** for a dose too soon and a dose too young alike. PneumoVax not changed | CDC Timing and Spacing: *"Doses of any vaccine administered ≥5 days earlier than the minimum interval or age should not be counted as valid doses and should be repeated as age appropriate."* |
| Q6 | A dose set aside for age. Healthy 12 y, Menveo at 9. Today: "Off-window - repeat", while the rulebook says "no repeat needed" | **"Not counted — given before age 10"** (MenACWY); **"Not counted — given before age 16"** (healthy MenB; a routine 2nd MenACWY before 16). Owner's limit: *"if menB for a high risk or exposure patient is given a dose earlier than 16 years this is correct since the minimum age for this group is 10 years not 16 years"*: a high-risk patient's MenB from 10 counts (as it already does) | ACIP 2020: *"Children who received MenACWY before age 10 years and with no ongoing risk for meningococcal disease … should still receive MenACWY according to the recommended adolescent schedule"*. PneumoVax analogue: "Not counted — PCV7" (owner 2026-10-31: "do not repeat" would read as "no more") |
| Q7 | "Booster" (asplenia, 22 y, a counted booster 4/10/26). PneumoVax's list has no booster label | **Keep "Booster"** | ACIP 2020: *"ACIP recommends MenACWY booster doses for previously vaccinated persons who become or remain at increased risk."* |
| Q8 | What "Extra" means. **First asked with a wrong example** (healthy 30 y, first Menveo at 25: PneumoVax's first-dose limit keeps that one counted); corrected and re-asked: healthy 25 y, Menveo at 12 and 23 — the card at 23 said "Not routinely indicated" | **PneumoVax's rule:** a dose is Extra when every card for that vaccine on the day of the dose asked for nothing (complete / not indicated) and the patient already had a dose of it. A healthy patient's first dose stays counted (PneumoVax's Priya ruling). Label **"Not counted — Extra. Do not repeat."** The 23 y dose → Extra; today's card → "Not routinely indicated". No dose owed either way | PneumoVax §C-P1-3 (owner rulings 2026-11-06) |
| Q9 | A counted dose for a patient with no series now. Healthy 25 y, Menveo at 12: today "Given — not part of a series this patient needs" | **"Dose 1"** — the dose number, no total, as PneumoVax | PneumoVax `doseChipLabel.js` (`Dose ${n}` when no series is running) |

### Asked while building Q8 (same day)

| # | Question | Owner answer | Sources |
|---|---|---|---|
| Q8 follow-up | College: Menveo at 16 and 18, seen at 22 as a first-year student. Under the Extra rule the 18 y dose (card that day: Complete) would not count, and the card would ask for a dose (6 years since the 16 y dose) | **Leave college alone**: a dose given while the college cover runs still counts ("Booster"; card Complete) | ACIP 2020 Table 10 footnote: *"…do not need another dose before college entry unless it has been more than 5 years since the dose"* |
| Q10 | A dose that did not count where no card asks for that vaccine. Healthy 1 y, Bexsero at 9 months; card "MenB: Not routinely indicated"; label "Not counted — repeat" | **"Not counted — do not repeat"** when every card for that vaccine is Complete or Not indicated; "repeat" when a card asks (pregnancy's deferral asks) | PneumoVax `doseDisposition.js`: a dose the patient never needed is `no-repeat` |
| Q11 | The first-dose limit that came with Q8 (PneumoVax's Priya ruling). Asked after the owner asked *"why was dose one counted"* for a healthy 30 y with Bexsero 3/1/26 and 3/15/26. Healthy 30 y, Bexsero 3/1/26 and 9/15/26: with the limit "Dose 1" then "Extra"; without it, both Extra | **Drop the limit** in MeningoVax: a first dose no card asked for is Extra too | — (an app rule; differs from PneumoVax on purpose) |

**Two corrections, said plainly.**
1. Q8 was first asked with a wrong example (healthy 30 y, first Menveo at 25). PneumoVax's
   first-dose limit would have kept that dose counted. The owner was told and Q8 was re-asked with a
   correct one. After Q11 dropped the limit, the first example's answer (Extra) became true after all.
2. Q11 was asked saying "no card changes either way". **That was not true for two cases**, found
   while measuring. (a) A healthy child's MenACWY at 10: the card that day says "Not yet due", so the
   dose became Extra, and the card at 12 asked for it again, though ACIP *"counts a dose given at
   age 10 as dose 1 of the routine adolescent series"*. (b) A MenB dose 1–4 days before 16, which
   CDC's 4-day grace counts, on a day the card said "Not routinely indicated". Fixed, keeping the
   app's earlier (sourced) answer: a card that asks for a dose *later* ("Not yet due", "Not yet
   age-eligible", "Dose 1 given; next dose not yet due", MenB "Not routinely indicated" under 16)
   is not "asked for nothing". The same test is used for Q10, so a high-risk 8-year-old's too-young
   Bexsero reads "repeat" (its card says to start the series at 10). After the fix no saved patient's
   card asks for more doses than before (checked on 18,780 + 5,820 patients).

Not asked, and not changed by these answers: the record-problem labels ("No date recorded — not
counted", etc.), colours (plan item A2), and the wording of the line under each label (Phase 6).

## STOP F1 — Phase 5, dates stated plainly (Q9 of the plan), answered 2026-11-17

The plan's Q9 asked whether a card should advise the routine date and state the minimum beside it
(PneumoVax C10-2), naming MenB dose 3, the MenACWY 16-year dose and boosters. **Measured first
(`main` at `36b24e0`)**: in those three places the app's date is already the routine date (MenB
dose 3 = 6 months from dose 1 and 4 from dose 2; the 16-year dose = the 16th birthday and 8 weeks;
MenACWY boosters = 3 or 5 years). The routine date and the minimum differ in only two places, so
Q9 was asked there. Counted by replaying the saved-answer grid and the typical patients over time
(every screen whose card date is earlier than the routine date); not yet built.

Quotes read live 2026-11-17:
- CDC, Timing and Spacing of Immunobiologics (page dated July 24, 2024): *"Administration at
  recommended ages and in accordance with recommended intervals between doses of multidose
  antigens provides optimal protection."* Shorter intervals *"might be necessary in certain
  circumstances, such as impending international travel or when a person is behind schedule on
  vaccinations but needs rapid protection."*
- CDC child/adolescent schedule Notes (July 2025), Menveo dose 1 at 2 months: *"4-dose series
  (additional 3 doses at age 4, 6, and 12 months)"*; MenB at increased risk: *"3-dose series at 0,
  1–2, 6 months"*.
- CDC catch-up table (July 2025), MenACWY-CRM dose 1 to dose 2: *"8 weeks"*; the table gives
  *"minimum intervals between doses for children whose vaccinations have been delayed"*.
- The MenB high-risk dose 2 minimum of 4 weeks is owner STOP C C8 (2026-11-15), on ACIP 2020's
  *"a minimum interval of 4 weeks should be used between any 2 doses"*.

| # | Question | Owner answer | Measured |
|---|---|---|---|
| Q9a | MenB high-risk dose 2. Asplenia, 20 y, Bexsero dose 1 on 11/3/26. Card today: "eligible Dec 1, 2026" (4 weeks); its note says "1–2 months after dose 1" | **Routine date + minimum beside it**: "Next dose due Dec 3, 2026. It can be given from Dec 1, 2026 if needed (minimum 4 weeks)." Behind schedule (routine date passed): due today, unchanged. The 4-week floor for judging a dose given stays (PneumoVax Ruling C) | 1,547 grid / 940 typical patients: the card's date moves 1–3 days later |
| Q9b | Infant MenACWY doses 2 and 3. Asplenia, born 1/1/26, Menveo 3/1/26. Card today: dose 2 eligible Apr 26 (8 weeks) | **Match PneumoVax** (owner first asked *"does pneumovax do the recommended suggestion"*: yes, its patient F, PCV at 2 and 3 months, is due at 6 months with "it can be given from <date> if needed"). "Next dose due May 1, 2026 (age 4 months). It can be given from Apr 26 if needed (minimum 8 weeks)." Dose 3 at 6 months the same way. Started late (routine age under 8 weeks away): the minimum wins, unchanged | 12 grid patients: the card's date moves 5–10 days later |

Not asked here: the MenB booster after the first is "every 2–3 years" and the card gives 2 years
(a range, not a routine date and a minimum). Listed for the owner.

## Q9a consequences (F2a, F2b), answered 2026-11-18

Q9a moved MenB high-risk dose 2 from "eligible at 4 weeks" to "due at 1 month, can be given from
4 weeks". Two things followed from it; asked, not assumed (memory: consequences of a decision are
questions). Both measured on `main` (`9034332`) and on the commit before Phase 5 (`36b24e0`).

Quotes read live 2026-11-18:
- ACIP Penmenvy MMWR (mm7501a2, Jan 8 2026): *"may be used when both MenACWY and MenB are
  indicated at the same visit"*.
- CDC adult schedule notes (updated July 2, 2025): *"Adults may receive a single dose of Penbraya
  (MenACWY–TT/MenB–FHbp) as an alternative to separate administration of MenACWY and MenB when
  both vaccines would be given on the same clinic day."*

| # | Question | Owner answer | Measured |
|---|---|---|---|
| F2a | Combined shot in the gap. Asplenia, 20 y, Bexsero 11/3/26, no MenACWY. Dec 1–2: MenACWY dose 1 due; MenB dose 2 "can be given today if needed". Before Q9a Penmenvy was offered on those days; after Q9a it was not | **Offer it.** The panel says *"MenACWY is due today; MenB dose 2 can be given today (its 4-week minimum has passed). One pentavalent (MenABCWY) dose may replace both."* The summary line never says MenB is due on those days. Dec 3 on, and before Dec 1: unchanged | Only MenB high-risk dose 2 has a gap (STOP F1's measurement); 0 of 5,820 saved answers, 0 of 24,600 prose screens moved (the grid has no patient on a gap day) |
| F2b | The switch line. Asplenia, 20 y, Bexsero 9/1/26 then Trumenba 11/3/26, seen Dec 1. The line read *"Or finish with Trumenba instead: dose 2 from Dec 3, 2026"*: the routine date, worded as the earliest | **"due"**: *"…dose 2 due Dec 3, 2026 (the Bexsero dose then does not count)"*, matching "Next dose due <date>". "today" once due, unchanged. A healthy patient's line reads "due May 3, 2027" (there the routine date and the minimum are the same) | 0 saved answers, 0 prose screens moved; tests only |

## Gap badge, answered 2026-11-18

Found while building F2a (listed in the F2 handoff, not changed alone). Asplenia, 20 y, Bexsero
10/20/26, no MenACWY, seen 11/18. MenB dose 2 is due 11/20 and can be given from 11/17. The MenB
card sat under "Option 1: Two separate injections (MenACWY + MenB)" with the badge **"Up to
date"**, because the badge knew only "due" or "not due"; its note said *"It can be given today if
needed, as the minimum interval of 4 weeks has passed."*

The owner asked what PneumoVax does, and why an existing badge would not do. PneumoVax: its badge
names the card's type (Routine / Catch-up / Risk-Based) and adds a "Today" tag only when the dose
is **due** today; on a gap day (Remy, HIV, PCV20 11/6 + 12/4, seen 1/5) it shows "Catch-up" with
no tag (checked in its engine and `RecCard.jsx`, `origin/main` `985f834`). It has no
combined-shot panel, so the clash does not arise there. MeningoVax's existing badges each say
something else: "Dose due today" contradicts "Next dose due Nov 20"; "Up to date" contradicts the
Option 1 heading; "Optional today - shared decision" is the healthy 16–23 MenB category.
"Today" (due, give it) vs "can be given today" (not due yet; allowed, and it counts) was
explained.

| # | Question | Owner answer | Measured |
|---|---|---|---|
| Gap badge | The MenB badge on 11/17–19 | **"Can be given today"**, only on those days (with or without MenACWY due). 11/16 "Up to date" and 11/20 "Dose due today, future boosters needed" unchanged. Card colour unchanged (grey) | Only high-risk MenB dose 2 has a gap. 0 of 18,780 saved patients' cards carry it; prose 0 of 24,600 screens moved. Tests: `regression-2026-11-18-phase5-gap-badge.test.jsx`; `sweep-never-events.test.js` property 14 (16 gap visits; 16 violations with the fix removed) |

Not asked here: about 6,300 saved-grid cards read "Up to date" while a dated dose or booster is
still to come (PneumoVax never says "Up to date" mid-series). That is the PneumoVax badge style,
for Phase 6 (wording), measured then.

## The 16-year booster for travel, lab and outbreak, answered 2026-11-18

Found while measuring Phase 5 (`report-2026-11-18-phase5-measured.md`, F-1): 830 saved patients
were told a LATER next MenACWY date because a risk box was ticked. Asked as one patient: Maya, 15,
one MenQuadfi at 14 for travel. No box: next dose at 16 (Jan 2027). Travel ticked: 2030, because
the card used the travel rule ("every 5 years") instead of the routine 16-year dose. The owner
asked for a re-explanation of the first, longer version of the question.

Quotes read live 2026-11-18:
- ACIP 2020 (RR-9) Table 2: *"Booster: 1 dose at age 16 yrs if first dose administered before
  16th birthday"*; footnote *"If only 1 dose of vaccine was administered before the 16th
  birthday, a booster dose should be administered"*.
- ACIP 2020 Tables 7–9 (microbiologist, outbreak, travel), aged ≥7: *"Single dose at 5 yrs after
  primary vaccination and every 5 yrs thereafter"* (outbreak: *"Single dose if ≥5 yrs since
  vaccination"*). Silent on the 16-year dose.
- CDC child/adolescent notes (updated July 1, 2025): children with an ongoing increased risk
  (complement, HIV, asplenia) follow the increased-risk booster schedule; *"a healthy child who
  received a single dose for travel"* follows the adolescent schedule (11–12 and 16).
- ACIP 2020 text: *"a child with HIV infection who received MenACWY at age 9 years should receive
  the next dose at age 14 years"*.

| # | Question | Owner answer | Measured |
|---|---|---|---|
| 16y booster | Travel / lab / outbreak teen with a dose before 16 | **Yes**: the 16-year dose (and it counts), then boosters while at risk. Owner's note: every 5 years only if the primary vaccination was completed at 7 or older; before the 7th birthday, one booster 3 years after the primary series, then every 5 years. Asplenia / complement / HIV unchanged | Saved answers: 846 of 18,780 real moved (702 earlier, 144 already due and relabelled "routine booster at ≥16y still owed"; none later); 63 of 5,820 impossible. Prose 909 of 24,600 screens. CDSI: NEW 0, 0 moved. Whole-app: check 6 +3 typical (a 4-day near-tie, explained in the PR), every other check identical to `main` |

Built rules beyond the question, chosen to keep the app consistent and listed for the owner:
- Under 16 it applies only after a dose given at 10 or older (the age from which ACIP counts a
  dose toward the adolescent series); a travel dose before 10 keeps the travel schedule.
- For travel and lab, only through 21: a healthy 22-year-old is owed no routine dose, so the
  label would be false. The outbreak card already said "routine booster at ≥16y still owed" at
  every age from 16 on `main`; that is unchanged and listed as a finding (a 24-year-old outbreak
  contact with only a dose at 11 sees it).

## A 13–15-year-old's first MenACWY is catch-up (F-2), answered 2026-11-18

Found while measuring Phase 5 (`report-2026-11-18-phase5-measured.md`, F-2). Asked as one patient:
Ava, healthy, 14 y 8 m, no MenACWY, read "Dose 1 (routine, 11–12y)" and *"The routine adolescent
dose, given at 11–12 years."* Control: Ben, 12 y 6 m, unchanged.

Quote read live 2026-11-18, CDC child/adolescent schedule notes (updated July 1, 2025), MenACWY
"Catch-up vaccination": *"Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum
interval: 8 weeks)"*.

| # | Question | Owner answer | Measured |
|---|---|---|---|
| F-2 | Should a first MenACWY at 13–15 read catch-up? | **Yes, wording only**: "Dose 1 (catch-up, 13–15y)", lead *"A catch-up dose now; the booster follows at 16–18 years."* The badge stays "Dose due today, future boosters needed" (badge style is Phase 6). Offered and not chosen: the amber "Catch-up dose due today" badge (216 cards would change status, no date) | Saved answers 0 of 18,780 real and 0 of 5,820 impossible moved (no dates, no status). Prose 270 of 24,600 screens (216 real, 54 impossible; all at 15 y 11 m, the grid's only age in 13–15). CDSI: in the suite, green. Whole-app: every fault count identical except check 7 typical 234 → 228 (see below) |

Whole-app, explained: the checker takes its birthdays from `ages.js`, so the new 13-year constant
became a checkpoint. Check 6 lists the new 13th-birthday wording change (+56 typical, info). Check 1
regroups the same patients under the new label (same totals). Check 7's −6 is NOT a fix: 6 typical
12-year-olds with a MenB outbreak card whose label changes a year later ("if outbreak risk
continues" → "for this outbreak", an existing check-7 finding still flagged on 96 grid patients)
now cross the 13th birthday in that year, and the checker does not judge a card change across a
birthday.

## A "Not counted — repeat" line gives its date (F-4a, F-4b), answered 2026-11-18

Found while measuring Phase 5 (`report-2026-11-18-phase5-measured.md`, F-4). Measured before
asking, over the 18,780 saved patients: 12,148 "not counted" dose lines in 7,218 patients: 4,936
with a later dose of that vaccine on the record, 3,135 whose card asks today, 854 whose card gives
a future date, 1,984 whose card asks later with no date ("Not yet due"), 281 deferred in
pregnancy, 958 already "do not repeat" (Q10). Quote read live 2026-11-18, CDC Timing and Spacing
(dated July 24, 2024): *"The repeat dose should be spaced after the invalid dose by the recommended
minimum interval (Table 3-2)."*

| # | Patient | Owner answer |
|---|---|---|
| F-4a | Leo, 13, asplenia, MenQuadfi Oct 1 and Oct 22, 2026 (3 weeks apart). Line had no date; card said Dec 17, 2026 | **Yes**: the line ends "Repeat from <date>." with the card's own date (read from the card, never computed twice). Lines whose card gives no date are unchanged |
| F-4b | Same, MenQuadfi Jun 1, Jun 22 (too soon), Aug 20, 2026 (counts). Jun 22 line still said "repeat this dose only" | **Yes, as PneumoVax** (its ruling 2026-10-31): the forward-looking sentence becomes "Repeated on <date>. See that dose." whenever a later dose of that vaccine is on the record, counted or not. The first sentence and the chip "Not counted — repeat" stay |
