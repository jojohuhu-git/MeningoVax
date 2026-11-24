# C6 — cite CDC first (owner answer, 2026-11-23)

Port Phase 8, Tier 2. Rule ported from PneumoVax (2026-10-23): cite CDC first; use immunize.org
only where CDC does not state the claim.

## Measured (every saved patient, 45,072 cards)

One immunize.org source was left on any card: Ask the Experts, MenACWY, "ACIP considers a dose of
MenACWY given to a 10-year-old child to be valid for the first dose in the adolescent series."
It sat on **658 cards**: a healthy child whose MenACWY dose was given at age 10 ("The dose given
at age 10 counts as the first dose of the adolescent series [c]").

## Read live, 2026-11-23

- ACIP 2020 MMWR (rr6909a1), "MenACWY Vaccines": "Children who received MenACWY at age 10 years
  do not need an additional dose at age 11–12 years" — **CDC states the claim.**
- CDC child/adolescent schedule notes and catch-up table: nothing on a dose at age 10.
- immunize.org's answer: still on the page, word for word.

## Owner answer

Asked with the worked patient (healthy 11-year-old, MenQuadfi at 10; control: a dose before 10).
Answer: **"Cite CDC only."**

## Built

New entry `acip2020Age10NoAdditionalDose` (refs.js) on both age-10 cards; the immunize.org
entries `acwyAge10CountsAsDose1` and `immMenACWY` removed (nothing used them). 0 answers moved;
the immunize.org button is off those 658 cards; now 0 cards cite immunize.org. Guard
`regression-2026-11-23-c6-cite-cdc-first.test.js`.
