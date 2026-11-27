# Owner decision 2026-11-26: the combined shot in pregnancy (PREG-PENTA)

Found in the Tier 3 queue ("seen, not checked: the combined shot offered to a pregnant patient
with asplenia or complement"). Measured before asking.

## What the app did

A pregnant 19-year-old with asplenia, no doses. The MenB card said "Pregnancy: safety data for
MenB in pregnancy are limited. Offered because of increased risk. Discuss the benefit and
potential risk before giving it" (M11). The combined-shot panel offered Penmenvy or Penbraya
("Option 2: one combined injection") with no word about pregnancy.

Measured over the saved test patients: **1,111 of 23,788** pregnant patients were offered the
combined shot (412 asplenia, 412 complement, 216 microbiologist, 71 serogroup B outbreak), plus
314 impossible entries. Without a MenB high-risk reason, pregnancy defers MenB, so the combined
shot never opened for them.

## The sources (read live 2026-11-26 in a real browser; exact substrings of the page text)

Both pentavalent MMWRs, "Contraindications and Precautions", "Pregnancy and breastfeeding":

- Penmenvy, [mm7501a2](https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm): "No high-quality
  data have been published on use of MenACWY-CRM/MenB-4C during pregnancy or while
  breastfeeding." and "When MenACWY is indicated while pregnant or breastfeeding, MenACWY-CRM or
  MenACWY-TT may be administered."
- Penbraya, [mm7315a4](https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm): "No data exist on
  use of MenACWY-TT/MenB-FHbp during pregnancy or while breastfeeding." and "When MenACWY is
  indicated, persons who are pregnant or breastfeeding should receive MenACWY-CRM or MenACWY-TT
  (MenQuadfi, Sanofi Pasteur)."
- CDC Adult Notes (meningococcal section): no sentence about the combined shot in pregnancy.

## Question and answer

"What should a pregnant patient see?" Options: separate shots (no combined shot, the existing
"Not an option today" line says why) or keep offering it with a pregnancy line.

**Answer: "Separate shots".**

## Built

- `recommend.js`: a pregnant patient is never offered the combined shot. The "two separate
  vaccines" banner reads: "Not an option today: no high-quality data on the combined shot in
  pregnancy [1][2]. Give MenACWY and MenB separately [1][2]." Each number sits on its own claim
  (C11), four quotes in `refs.js`. Pregnancy is said instead of the 6-month rule when both apply.
- **Wording, one change from the approved preview:** the preview said "no data"; built "no
  high-quality data", because Penmenvy's report says "No high-quality data", not "no data".
  Penbraya's "No data exist" is covered by the wider phrase.
- The MenACWY and MenB cards do not change.
- Moved: 1,111 of 23,788 answers and 314 of 7,372 impossible entries, the combined-shot offer
  only, every one pregnant. Wording: 1,127 real patients (the 1,111, plus 16 already blocked by
  the 6-month Penmenvy rule who now read the pregnancy reason) and 314 impossible entries.
- Guard: `regression-2026-11-26-preg-penta-separate-shots-in-pregnancy.test.jsx`.

## Follow-on, answered 2026-11-27: MenB dose 2 can be given but is not due: "No change"

A pregnant 19-year-old with asplenia, no MenACWY, Trumenba dose 1 on Oct 29, 2026, seen Nov 27:
MenACWY is due; MenB dose 2 is due Nov 29 but past its 4-week minimum ("can be given today if
needed", owner F2a). Not pregnant, the combined shot is offered. Pregnant, it is not, and the
reason line does not show: it lives in the two-vaccines box, which appears only when both are due
(`Results.jsx`). Reached only in the days between 4 weeks and 1 month after a high-risk MenB dose 1;
0 of 23,788 saved patients. Checked live. **Owner: "No change"**: the screen says "Due today:
MenACWY" and "Next dose not yet due", so nothing suggests combining. Guard: the last `describe` in
`regression-2026-11-26-preg-penta-separate-shots-in-pregnancy.test.jsx`.
