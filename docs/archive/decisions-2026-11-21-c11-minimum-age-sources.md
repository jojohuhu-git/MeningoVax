# Owner decisions: which sentence a "Minimum age not met" line cites (2026-11-21)

Asked in PR #141 (C11 dose-line citations) and in the session of 2026-11-21. After C11, 1,036
"not counted" dose lines on the test patients carried no source number. Every one was a MenACWY
"Minimum age not met" line for Penbraya (476), Penmenvy (336), Menactra (168) or an unknown
brand (56). Pages read live 2026-11-21: CDC Child/Adolescent Schedule Notes; ACIP's Penmenvy
MMWR (mm7501a2); ACIP's Penbraya MMWR (mm7315a4); ACIP 2020 (rr6909a1).

| Brand | What the pages say | Owner's answer | Built |
|---|---|---|---|
| Penbraya | CDC's MenACWY minimum-age line: "minimum age: 2 months [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]), 10 years [MenACWY-TT/MenB-FHbp, Penbraya]" (the ")" is printed on CDC's page) | **Extend the saved CDC quote** to take in Penbraya and cite it | `cdcChildAcwyMinAge` lengthened |
| Penmenvy | No page states a minimum age; CDC's notes do not name it yet. ACIP's box: "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" | **Cite ACIP's recommended "≥10 years"** (not the "licensed for use in persons aged 10–25 years" sentence offered as the recommendation) | new `penmenvyAged10BothIndicated` |
| Menactra | No ACIP/CDC page states its minimum age (ACIP 2020's "9 months–55 years" is a trial population). Discontinued 2022 | **Leave unmarked** | stays in the guard's `NO_SENTENCE_YET` |
| Unknown brand | The 2 months is owner decision C13, not a sentence | not asked; stays unmarked | stays in `NO_SENTENCE_YET` |

Both new citations cover the dated rule (`ACWY-BELOW-MIN-AGE`) and the undated one
(`ACWY-UNDATED-BELOW-MIN-AGE`), through `acwyMinAgeCite()` in `src/logic/doseRules.js`.

Measured after building: unmarked not-counted lines **1,036 → 224** (Menactra 168, unknown brand
56) over the saved, record-problem and typical test patients. **0 answers moved.** Wording: 924 of
24,600 saved patients read differently (672 real, 252 impossible entries), all of them source
numbers, source buttons or hover text only (checked by stripping those and comparing: 0 other
differences). Of the 924: Penbraya 476, Penmenvy 336, and 112 Menveo cards whose hover now shows
the longer CDC quote.

Not changed: the MenB-side minimum-age lines (pentavalents recorded under MenB) already cite
`menbLicensedAge1025` on every line; not part of this question.
