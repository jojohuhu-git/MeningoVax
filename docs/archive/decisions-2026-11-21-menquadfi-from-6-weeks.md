# Owner decision MQ6 — MenQuadfi can be given from 6 weeks (2026-11-21)

## The question

A high-risk baby aged 6 weeks to under 2 months, with no MenACWY yet. Patient: born 3 Oct 2026,
seen 21 Nov 2026 (7 weeks), asplenia. The card said "Not yet due (from 2 months)" and "The infant
series starts at 2 months, so nothing is due yet."

## Sources

- **AAP 2026 schedule**, the MenACWY notes. Read 2026-11-21 from the owner's copy,
  `~/Downloads/AAP-Immunization-Schedule.pdf` ("Recommended Child and Adolescent Immunization
  Schedule for Ages 18 Years or Younger, United States, 2026"). AAP's website blocks automated
  reading (a bot check, HTTP 403).
  - "(minimum age: 6 weeks [MenACWY-TT, MenQuadfi], 2 months [MenACWY-CRM, Menveo])"
  - Under the high-risk group (asplenia, HIV, complement deficiency, complement inhibitor), and
    again under travel: "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6,
    and 12 months). The first dose of MenQuadfi may be given as early as 6 weeks."
  - For outbreaks, AAP gives no schedule of its own; it points to ACIP 2020 (rr6909a1).
- **CDC child notes** (Updated July 1, 2025, read 2026-11-21): "(minimum age: 2 months
  [MenACWY-CRM, Menveo], 2 years [MenACWY-TT, MenQuadfi]…)". AAP governs where the two disagree
  (owner's authority rule, 2026-08-10).

## Answers

| # | Question | Answer |
|---|---|---|
| MQ6 | What should the 7-week card do? | **"Can be given (Rec.)"**: badge "Can be given today", MenQuadfi only; dose 1 still due at 2 months. Lead: "The infant series starts at 2 months; MenQuadfi may be given from 6 weeks." |
| MQ6-b | AAP's 6-week line appears only under high-risk and travel. Does the offer apply to an outbreak baby too? (I recommended no: AAP points outbreaks to ACIP 2020, which has no 6-week option.) | **"Yes, outbreak too."** |
| MQ6-c | The summary line above the cards said "No MenACWY or MenB doses due today." over the "Can be given today" card. Should it also say MenQuadfi can be given today? | **"Yes, add it."** Built: "No MenACWY or MenB doses due today. MenQuadfi can be given today." |

## Built (2026-11-21)

- `recommend.js` `menacwyInfantSeries`: from day 42, with a date of birth, given === 0.
  The card reads "Dose 1 of 4 (infant high-risk / travel / outbreak)", `canGiveToday`, brands
  MenQuadfi only, next dose due at 2 months.
- `refs.js` `aap2026MenQuadfiFrom6Weeks`.
- Applied without asking, for the owner to check:
  - **No date of birth → no offer.** From whole months alone a 5-week-old and a 7-week-old look
    the same, and the app never guesses an age.
  - **The lead sentence sits behind "Why this".** The Q10 fold keeps only the owner's list in
    view, and this sentence is not on it, the same as the 2-month card's lead. Whether to add it
    is an open question.
