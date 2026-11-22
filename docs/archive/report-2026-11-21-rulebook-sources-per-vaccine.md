# Rulebook Sources: each vaccine cites only itself (2026-11-21)

Owner's report: "in the rulebook the sources listed under each step may not be correct. There
are MenB sources under MenACWY and vice versa."

## What was wrong

A row's **Source** on the Rulebook screen is not typed by hand. The page runs the row's worked
patients through the app and lists every sentence their results cite (`sourcesFor()` in
`src/data/rulebookPage.js`). It read **both** the MenACWY card and the MenB card for every
patient. Every worked patient gets both cards, so a MenACWY row picked up MenB's sentences, and
the reverse.

Measured before the fix: **35 of the 37** rows under "MenACWY schedule" and "MenB schedule"
showed at least one sentence from the other vaccine's card. Example: the MenACWY high-risk
boosters line showed "ACIP recommends routine use of MenB vaccine series among persons aged ≥10
years…" and the MenB 1-year booster sentence.

A second, smaller cause: the MenACWY card itself mentions MenB in passing (for an 11-year-old:
"Without a MenB risk factor, MenB is offered from 16 through 23 years by shared clinical
decision-making [c]") and cites the MenB sentence. That is right on the card, but a MenACWY
row on the Rulebook does not rest on it.

## What changed

1. A row about one vaccine reads only that vaccine's card and that vaccine's recorded-dose
   lines (and not the combined-shot card). Rows are marked with their vaccine in one place
   (`forVaccine(...)` near the end of `rulebookPage.js`, plus `vaccine:` on the one-vaccine
   rows in the shared steps: intervals, three label-key rows, one "does not count" rule, the
   "sooner counts" rule, and the "More than one condition" rows).
2. Each of the 71 quoted sentences in `refs.js` now says what it is about: MenACWY (36), MenB
   (20), combined shot (11) or general best practice (4) (`SENTENCE_VACCINE` in
   `rulebookPage.js`). A one-vaccine row shows only its own vaccine's sentences and the
   general ones. A new quoted sentence must be added to one list, or the guard fails.
   The one call that was not obvious: "microbiologists routinely exposed to isolates of
   Neisseria meningitidis" is labelled MenACWY. ACIP 2020 lists lab workers for both vaccines,
   but this sentence was quoted for the MenACWY exposure cards (C4) and no MenB card cites it.
3. Rows that cover both vaccines (the combined shot, most of the label key, "A dose that does
   not count") still read both cards, as before.

After the fix: **0** cross-vaccine sentences under either step (checked in the code and on the
drawn screen). No row lost its Source button (every row still has at least one sentence).
No patient's answer or card wording changed: only the Rulebook screen reads this.

Guard: `src/components/__tests__/regression-2026-11-21-rulebook-sources-per-vaccine.test.jsx`
(6 checks). With the card split undone, 2 fail; with the sentence labels undone, 2 fail.

## Not fixed here: rows that show a nearby sentence, not the right one

These rows now show only their own vaccine's sentences, but not the sentence the row's statement
rests on. The cause is upstream: the worked patient's **card** does not cite the right
sentence, so the Rulebook has nothing better to show. The rule table (`doseRules.js`) already
lists the right sentence for most of these in its `refs`, but the recorded-dose line on the
patient's card carries no source. Example: "Minimum interval not met (3 weeks, 8 required)"
has no [c] mark at all.

| Rulebook row | What it shows now | The sentence it rests on |
|---|---|---|
| MenACWY high risk, "Dose 1 at 2 years or older" table | The two booster sentences only | `cdcChildAcwyRisk2DoseFrom24m` ("2-dose series at least 8 weeks apart"), in `doseRules.js` refs, not cited on the card |
| Minimum intervals, "Any two MenACWY doses: 8 weeks" | The two booster sentences only | `acip2020Acwy8WeekMinimum`, in `doseRules.js` refs, not on the dose line |
| MenB high risk, "No dose 3 is needed if dose 2 was ≥6 months after dose 1" | The two booster-cadence sentences only | `cdcChildMenbHighRiskD2SixMonthsNoD3`, in `refs.js` but cited nowhere in the app |
| If dose 3 was early, "<4 months after dose 2, ≥6 months after dose 1: Counts" | The two booster-cadence sentences only | `menbHighRiskEarlyD3Unless` (ACIP's "unless"), cited only when dose 3 does NOT count |
| If dose 3 was early, "≥4 months after dose 2, <6 months after dose 1: Counts" | The two booster-cadence sentences only | A MeningoVax decision (`menbDose3FromDose2`), shown by its decision mark; no ACIP sentence says it |
| Label key, "Not counted — repeat" | MenACWY booster and MenB schedule sentences | `gbpRepeatSpacedFromInvalidDose` / the interval sentences, not on the dose line |
| A dose that does not count, "Repeat that dose only. Do not restart the series." | Booster and MenB schedule sentences | No quoted sentence in `refs.js` says "do not restart" yet |

Rows that show the right sentence **plus** an extra one from another part of the same vaccine's
schedule: "MenB products are not interchangeable" (also the healthy 6-month rescue rule), the
three MenACWY infant tables (also the under-7 booster sentence), "If dose 3 was early" row 1
(also booster cadence), the MenB pregnancy rows (also booster cadence), "Any two MenB doses"
(also the rescue rule), "High-risk MenB dose 3" (also booster cadence).

Choosing sentences by hand for these rows was not done. The page's rule is "generated, never
typed", and the real fix is the card-level citation. Once a dose line cites its own sentence,
the Rulebook row picks it up with no Rulebook change. That fix changes what patient cards show
(new [c] marks), so it belongs with Phase 8's remaining items (C5–C13). It is listed as an open
item in the handoff.
