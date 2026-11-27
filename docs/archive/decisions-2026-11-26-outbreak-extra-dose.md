# Owner decisions 2026-11-26: a MenB dose after a serogroup B outbreak's one booster

Found by C11 (`report-2026-11-26-c11-number-on-its-claim.md`): a dose's line made a claim no source
makes. Asked with the patient on screen.

## Question 1 — the outbreak patient

19 y (born 15 Sep 2007), serogroup B outbreak, no other MenB risk. Bexsero 29 Mar, 28 May,
25 Sep 2024 (series); Bexsero booster 19 Nov 2025; Penmenvy 18 Apr 2026, 5 months after the booster.
The card said "Complete (outbreak booster given)" (owner D10, 2026-11-17: one booster). The
Penmenvy's MenB line said "Not counted — do not repeat · Booster about 5 months after the last
booster, 2 years required [ACIP 2020 Table 8: "Single dose if ≥1 yr after MenB primary series
completion"]". A dose 2+ years after the booster already read "Not counted — Extra. Do not
repeat. · The series was already complete on that day." (owner Q8, 2026-11-17).

**Answer: "Extra, as Q8".** The 5-month dose reads the same as the 2-year one.

Built: `MENB-HIGHRISK-BOOSTER-GAP` (`doseRules.js`) no longer judges a later booster for an
outbreak-only patient; the Q8 Extra rule (`validate.js` `notAskedFor`) judges it. With asplenia,
complement or microbiologist also ticked, their every-2–3-years boosters win (D10) and the 2-year
floor stays.

## Question 2 — the consequence for a dorm student

The same patient also checked "First-year college student living in a residence hall". The Q8
follow-up (2026-11-17) leaves college patients out of Extra, written for MenACWY's 5-year college
cover, and it also covered MenB: the Penmenvy showed a green "Booster" chip, counted. Shown side
by side with the outbreak-only screen ("A").

**Answer: "Yes, Extra like A".** The college exception is MenACWY's only.

Consequence, measured and stated before the answer: healthy dorm residents whose MenB doses no
card asked for read "Extra", as non-dorm adults already do (owner Q11).

## Measured

- Saved answers moved: **133 of 23,788** real patients (12 outbreak: alone, + pregnancy, + dorm,
  at four ages; 121 healthy 50-year-olds checked as dorm residents, with a MenB dose a year ago,
  card "Not routinely indicated") and 9 of 7,372 impossible entries (dorm). `npm run sweep:update`.
- Wording: 125 real patients (134 with impossible entries) read different words, all on the moved
  dose's chip and line (`npm run prose -- dump/diff`).
- Guard: `regression-2026-11-26-outbreak-dose-after-the-booster-is-extra.test.js`.
