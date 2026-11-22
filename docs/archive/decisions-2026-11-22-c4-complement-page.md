# Owner decision — C4, CDC complement-inhibitor page (2026-11-22)

Port Phase 8, C4, document 3: CDC, "Clinical Guidance for Managing Meningococcal Disease Risk in
Patients Receiving Complement Inhibitor Therapy"
(https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html, page dated
Mar. 6, 2026, read live 2026-11-22).

## Measured first

The page's button sat on 6,224 cards with no line citing it (`scripts/uncitedByDocument.mjs`):

- **3,720** were high-risk MenB dose 1 cards of patients with **no complement risk** (asplenia,
  microbiologist, serogroup B outbreak). `recommend.js` listed the page on that card for every
  high-risk patient. The page is about complement-inhibitor therapy only. Removing it there is a
  source-only call (Q12), made without asking.
- **2,504** were complement patients' cards. The button is there by the owner's 2026-07-23 decision
  ("cdcComplementInhibitor stays — it has unique content … that the MMWR doesn't cover"), so how to
  number it was asked.

## The question and the answer

Asked: how should the page get its number on complement patients' cards? Options: cite it on the
booster lines; remove it there too (reverses 2026-07-23); leave it unnumbered and separately draft a
new card line with what only the page says.

**Owner answer: "Cite on booster lines."**

Built:

| Card line (complement patient) | Sentence cited (exact, read live 2026-11-22) |
|---|---|
| MenACWY "… then every 5 years while at risk [c]" | "Administer a booster dose of MenACWY vaccine every 5 years, for the duration of complement inhibitor therapy" |
| MenB "… then every 2–3 years while at risk [c][c]" (second mark) | "Every 2 to 3 years thereafter, for the duration of complement inhibitor therapy" |
| MenB under 10: "the 3-dose high-risk MenB series [c]" | "MenB vaccines need 3 doses" |

Words unchanged; 0 answers moved.

## Noted, not changed

- The page gives MenACWY boosters "every 5 years"; ACIP 2020 (which the app follows) gives the
  first booster 3 years after a series that ended before age 7. The page's mark sits only after
  "while at risk", so it backs the repeating 5-year cadence, never the 3-year clause.
- The app's one checkbox covers inherited complement deficiency too; this page speaks of
  complement-inhibitor therapy only. The cited lines stay true for both through ACIP 2020.
- What only this page says (incomplete protection even when vaccinated; consider antibiotic
  prophylaxis; finish vaccines at least 2 weeks before the first inhibitor dose) is still not on any
  card. A new card line would be new clinical wording, its own item.
