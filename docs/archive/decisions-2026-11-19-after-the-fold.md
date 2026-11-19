# MeningoVax — four wording answers after the fold (W1–W4), 2026-11-19

Asked after Phase 6.3 Q10 (the fold) merged (#113, #114; STOP G2 done). Each question was asked
with a worked patient, a control and a count over the saved-answer grid (18,780 real patients),
measured on `main` at `eaff392`. All built on branch `port/phase6-after-fold-w1-w4`; guard
`src/components/__tests__/regression-2026-11-19-after-fold-w1-w4.test.jsx`.

| # | Question (worked patient) | Owner answer | Built |
|---|---|---|---|
| W1 | Healthy 16-year-old, MenQuadfi at 11: heading "Booster (16y)", badge "Dose due today"; a 24-year-old recruit owed the same booster reads "Booster due today" (264 vs 740 grid patients) | **"Booster due today"** on all of them | `statusPillLabel` (`RecCard.jsx`) judges "booster" past the PRIMARY series, as its "coming next" badge already did. Badge diff over every card: exactly 264 real + 27 impossible-entry cards, "Booster (16y)" only |
| W2 | Healthy 16-year-old, MenQuadfi at 15: "Why this" says "The dose given at 11–12 years is the first dose…" (228 of 264 had the dose at 13–15 or two doses; Phase 0 B16 had found it) | **"The dose given before 16 years is the first dose of the series, not the booster, so a booster is due from the 16th birthday."** | `recommend.js` routine ≥16 card |
| W3 | Healthy 14-year-old, no MenACWY: in view "Boosters: 1 more - at age 16", behind "Why this" "then the booster at 16–18 years" (216 grid cards) | **"at age 16–18"** on the 13–15 card only; 11–12 keeps "at age 16" | `recommend.js` 11–15 card |
| W3a | Consequence of W3, asked on its own: the line's source mark pointed at ACIP's "…followed by a booster dose administered at age 16 years", which does not say 16–18. Citing CDC's *"Age 13–15 years: 1 dose now and booster at age 16–18 years (minimum interval: 8 weeks)"* (already in that card's "Why this") takes ACIP's sentence off 270 grid pages | **CDC's sentence only** | `boosterCites` on the 13–15 card. Both marks on that card now read [1] |
| W4 | Healthy 16-year-old, no MenB: "Why this" 79 words (G1-a cap 66) since the fold put the lead first; sentence 2 repeated sentence 1 | **Drop the repeat**: "A healthy 16–23-year-old may receive MenB by shared clinical decision-making." 79 → 69 words | `recommend.js` healthy MenB card |

## Measured (prose diff, every sentence a clinician reads, every disclosure open)

1,712 of 24,600 saved patients read different words (1,424 real, 288 impossible entries); 0 added,
0 removed. Every one is explained by W1–W4: W1+W2 252 real, W2 alone 12, W3 216, W4 944
(88 of them with W1+W2 too). Remaining differences are source numbers only: on the 270 W3 pages
the booster line and "Why this" now share [1]. Sources: ACIP's 11–12/16 sentence leaves those 270
pages; none gained. No dose, date, status or badge other than W1 moved (badge diff over all 45,920
cards).

## A guard re-pointed, not removed

`regression-m16-menb-preferred-16-18.test.js` (2026-09-15) required the healthy MenB card to state
the eligibility window ("16–23"), because a 22-year-old is still eligible. The sentence W4 dropped
was where that window was written. The window's far end is still stated ("Past 18, the series may
still be given up to the 24th birthday"), so the guard now checks for that sentence. The owner was
told the window stays; she was not asked about the guard separately.

## Not asked (carried, from the Q10 handoff)

- The "Sources" toggle label on 140 cards (applied from PneumoVax's 2026-11-07 ruling) — not put
  to her again: memory "MeningoVax wording should match PneumoVax" covers it.
