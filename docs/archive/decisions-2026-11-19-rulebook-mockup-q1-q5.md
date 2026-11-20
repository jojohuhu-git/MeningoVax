# MeningoVax — Owner answers to the Rulebook mockup questions Q1–Q5 (2026-11-19)

Asked on the Rulebook screen mockup (https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr, source
`docs/archive/mockup-2026-11-19-rulebook-screen-v9.html`). Answered in chat on 2026-11-19. Nothing
is built yet.

| # | Question | Owner answer |
|---|---|---|
| Q1 | Quick look: one table, or two (MenACWY, MenB)? | Two tables. |
| Q2 | Say "4C / FHbp family", or brand names? | "Bexsero" and "Trumenba", with no "type" after them. Applies to the Rulebook and to the card text in the Patient screen review. |
| Q3 | High-risk MenB dose 2: "at 1 month" or "1–2 months"? | "Dose 2 at 1 month" stays. Give the full ACIP range (1–2 months) in the "why" text (Details panel, "Why this"). |
| Q4 | Healthy MenB "wanes within about a year" (`src/logic/doseRules.js:369`) vs the source's "1–2 years" | Change it to "within 1–2 years". |
| Q5 | Amber on dose labels | Red means repeat; amber on a dose label means not counted, with nothing to give now. "Not counted — do not repeat" moves from red (`invalid` tone) to amber. **Owner: "make sure to remind me to check PneumoVax"**: check PneumoVax's dose labels for the same rule before building (shared design system; design-review skill). |

Other owner direction from the same session (v6–v9 notes) is in memory
`rulebook-screen-mockup-direction`. Every age carries its unit; where an age sits next to a dose
count, the count is a word. "Words used here", "Check the app" and the Quick look legend are removed.
"Read the record" is label + one-line reason. Use clinical terms (minimum age, minimum interval,
invalid dose, not interchangeable).

Still to review: the Patient screen wording (72 items) and placement (7 items) proposals on the mockup,
and the 3 errors found (listed in `handoff-2026-11-19-meningovax-rulebook-mockup-v6.md`).
