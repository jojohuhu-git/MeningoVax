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
