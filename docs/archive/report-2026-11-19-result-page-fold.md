# MeningoVax — folding the result page (Q10, B11): what it would move

Owner answer, 2026-11-19, Q10: **"Full PneumoVax fold"** (reversing 2026-11-06's "PneumoVax only").
This report is the MeningoVax version of PneumoVax's
`report-2026-11-06-wordy-result-pages.md`: what is on the page, what the fold moves, and what must
stay in view. Nothing is built yet. Every number below was measured 2026-11-19 on branch
`port/phase6-g1a-findings` (the F1–F3 tree) over the 18,780 real patients on the saved-answer grid,
with every disclosure shut, hover text not counted.

## What PneumoVax's fold did (§WORD-1, 2026-11-06)

1. Each card's note shows only the sentences on a written list (`STAY_IN_VIEW` in `noteFold.js`),
   each with its reason; everything else moves behind "Why this", carrying its citation.
2. The card's Sources row goes inside "Why this".
3. The disclaimer's risk-history paragraph goes behind "About risk history".
4. The 20 most common dose lines were shortened. **Already done here** (G1-a, G1-b).

No dose, date, status or citation moves: a sentence only changes place.

## What is on a MeningoVax page today

| Words in view before any click | Typical | Wordiest 1 in 10 | Worst |
|---|---|---|---|
| Whole page | 280 | 424 | 623 |
| Card lines (`rec-note-lead`), per page | 16 | 44 | 65 |
| Disclaimer (same on every page) | 117 | 117 | 117 |

MeningoVax already split each card's note into a short in-view line and a "Why this" (U1,
2026-09-17). So the card lines are short. **But almost every one repeats its own heading:**

| Card heading | Its in-view line | Cards |
|---|---|---|
| Dose 2 of 2 (high-risk primary series) | "The second dose of the high-risk primary series, at least 8 weeks after dose 1." | 2,840 |
| Dose 1 of 3 (high-risk series) | "A 3-dose MenB series at 0, 1–2 and 6 months, for this high-risk indication." | 4,340 |
| Booster (dose 2, first booster, 5 years after the primary dose) | "The first booster is due 5 years after the primary dose." | 2,144 |
| Booster (dose 2) if outbreak risk continues | "Booster <date> if outbreak risk continues." (the same date is on the card's "Next dose due" line) | 588 |
| Dose 1 (catch-up, 13–15y) | "A catch-up dose now, then the booster at 16–18 years." ("Boosters: 1 more - at age 16" is in view above it) | 216 |
| Dose 1 (catch-up, ≥16y, no booster needed) | "A single MenACWY dose now. Given at 16 years or older, it needs no booster." | 108 |

81 distinct card lines in all (tabulated by a scratch script over the grid; not committed).

## Proposed: what stays in view

| Stays | Example | Why | Cards |
|---|---|---|---|
| The pentavalent card's line | "Both MenACWY and MenB are due today, so one pentavalent (MenABCWY) dose may replace the two injections." | It is the card's whole meaning; stops two injections being given (PneumoVax's "Choose…") | 3,039 |
| "MenB is optional today (shared clinical decision)" | on the same card | Qualifies the offer | 1,148 |
| The Trumenba switch | "Or finish with Trumenba instead: dose 2 today (the Bexsero dose then does not count)." | A second option, with its own date (owner D-switch line, 2026-11-17) | 360 |
| The minimum beside a routine date | "It can be given from Dec 1, 2026 if needed (minimum 8 weeks)." | Owner STOP F1, 2026-11-17: both numbers go on the card (PneumoVax C10-2) | 0 on today's grid |
| "It can be given once 8 weeks have passed since that dose." | Booster (16y) after an early dose | Says why the date is later than expected | 98 |
| "Not before <date>: 8 weeks after the dose of <date>, which did not count." | Infant series after a set-aside dose | A date tied to a dose that did not count | 8 |

**Everything else goes behind "Why this"**: 22,626 of 26,131 cards (87%) would show no line
under the heading at all, only heading, brands, date line, booster line and recorded doses.

## Measured, simulated over every patient

| Words in view | Typical | Wordiest 1 in 10 | Worst |
|---|---|---|---|
| Today | 280 | 424 | 623 |
| After (card lines folded as above, disclaimer paragraph folded) | 205 | 339 | 537 |

56 of the words saved are the disclaimer paragraph; the rest are card lines. The Sources row
moving inside "Why this" is not in these numbers (source names are short). What remains on the
wordiest pages is the recorded-dose lines, already shortened by G1-a.

## Judgement calls for the owner

1. The stay-in-view list above: right as it stands?
2. A card that folds its whole line (87%): acceptable that its interval ("at least 8 weeks after
   dose 1") is only behind "Why this"? The date line ("Next dose due …") still shows when the dose
   is not due today.
3. The Sources row inside "Why this", as in PneumoVax.
4. The disclaimer's risk-history paragraph behind "About risk history", as in PneumoVax.
