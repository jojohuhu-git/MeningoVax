# Item 7: each MenB brand cites its own sentence (2026-11-22)

Citation only. Owner Q12 (2026-11-21, "same as PneumoVax"): decide alone when every candidate
sentence gives the same dose. No dose, date or verdict moved. Page read live 2026-11-22, whole,
tables and box included: ACIP's October 2024 MenB report, https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm.

## Judgement calls (for the owner to audit in one place)

| # | Card or line | Was citing | Now cites | Why it is the same dose |
|---|---|---|---|---|
| 1 | High-risk MenB dose 1, 2 and 3 cards, Trumenba or Penbraya series | ACIP Oct 2024's MenB-4C (Bexsero) sentence: "ACIP recommends that MenB-4C be administered as a 3-dose series at 0, 1–2, and 6 months to persons aged ≥10 years who are at increased risk …" | The same report's Trumenba sentence: "ACIP recommends MenB-FHbp vaccine as a 2-dose series (at intervals of 0 and 6 months) for adolescents and young adults and a 3-dose series (at 0, 1–2, and 6 months) for those at increased risk" (new `menbFhbpSchedules`) | Both say 3 doses at 0, 1–2 and 6 months. |
| 2 | Same cards, no product recorded yet (the card offers Bexsero or Trumenba) | the MenB-4C sentence | both sentences, "[c][c]" | Same as 1. |
| 3 | Same cards, Bexsero or Penmenvy series | the MenB-4C sentence | unchanged | — |
| 4 | Healthy MenB dose 1 card (no product yet) | ACIP Oct 2024's MenB-4C 2-dose sentence | it and the Trumenba sentence above, "[c][c]" | Both say 2 doses at 0 and 6 months. Not in the handoff's list; same defect, so fixed with it. |
| 5 | MenB "Minimum age not met" line, Penbraya (dated and undated) | ACIP 2020's "MenB vaccines are licensed in the United States only for persons aged 10–25 years", written before Penbraya existed | CDC's MenB minimum-age line, which names Penbraya at 10 years (`cdcChildMenbMinAge`) | Both 10 years. Same sentence choice the owner made for Penbraya's MenACWY line (C11, 2026-11-21). |
| 6 | Same line, Penmenvy | ACIP 2020's licensure sentence | ACIP's Penmenvy "Persons aged ≥10 years for whom MenACWY and MenB are both indicated" (`penmenvyAged10BothIndicated`) | Both 10 years. The owner chose this sentence for Penmenvy's MenACWY line (C11). |
| 7 | Same line, Bexsero, Trumenba, unknown brand | ACIP 2020's licensure sentence | unchanged | — |

The repeat of an early high-risk dose 3 keeps `menbHighRiskEarlyD3Unless`: its paragraph begins
"When administering the 3-dose series … of MenB-4C (Bexsero) or MenB-FHbp (Trumenba)", so it
covers both.

## Handoff item 7c: already true

"Healthy MenB cards cite CDC's child/adolescent notes at 19–23." Measured 2026-11-22 over all
17,528 grid patients: **0 MenB cards** carry a CDC child/adolescent-notes button or cite, at any
age. Every MenB card passes its own base list, so the `cdcChildMenB` default is never reached.
Nothing to change.

## Measured

- Wording (`npm run prose`): 7,786 of 24,600 saved patients read differently (6,618 real, 1,168
  impossible entries); 0 added, 0 removed. With source numbers and hover quotes stripped, 812
  still differ, and every one of those differences is a source-button name only. 0 sentences
  changed. 7,156 patients show the new Trumenba sentence; 812 have a pentavalent MenB minimum-age
  line; 182 both; 0 neither.
- Answers: `sweep-saved-answers.test.js` passed unchanged: 0 answers moved.
- Uncited buttons (`scripts/uncitedByDocument.mjs`): 0 of 35,056 cards.
- Live check, 2026-11-22: 17-year-old, asplenia, Trumenba 1 Oct 2026: dose 2 card's [1] quotes
  the Trumenba sentence. 9-year-old, asplenia, Penmenvy 1 Sep 2026: "Minimum age not met … 10
  years for Penmenvy [2]", [2] quotes ACIP's Penmenvy sentence.

## Seen, not acted on

- The healthy under-10 "Not indicated" card says "MenB vaccines (Bexsero, Trumenba, Penmenvy,
  Penbraya) are FDA-licensed from age 10 years [c]" and cites ACIP 2020's licensure sentence,
  which predates both pentavalents. A citation-only fix would need a licensure sentence that names
  Penmenvy; not looked for yet.
