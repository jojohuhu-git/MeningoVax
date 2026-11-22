# C11: a "not counted" dose line cites its own rule's sentence (2026-11-21)

Owner, 2026-11-21: "Dose-line citations" (chosen as the next item after the Rulebook Sources fix,
PR #140). Plan item C11: "each number sits on the exact claim its document states".

## What was wrong

Nine rules in `src/logic/doseRules.js` printed a "not counted" reason with no source mark, though
each rule's row lists the sentence it rests on (`sourcesSay.refs`). Example: a high-risk MenACWY
dose 2 given 3 weeks after dose 1 read "Minimum interval not met (3 weeks, 8 required)." with
nothing to click. The Rulebook screen reads the same citations, so its rows showed a nearby
sentence instead (`report-2026-11-21-rulebook-sources-per-vaccine.md`).

Measured over 42,301 test patients (saved answers, record problems, typical patients):
**6,177** not-counted dose lines on 5,470 patients had no mark. After: **1,036**, all of one kind
(below).

## What each line cites now

| Rule | Line | Sentence (refs.js key) |
|---|---|---|
| ACWY-BELOW-MIN-AGE, ACWY-UNDATED-BELOW-MIN-AGE | Minimum age not met, by product | Menveo: `cdcChildAcwyMinAge`; Menveo 1-vial: `cdcChildMenveoLiquid10y`; MenQuadfi: `waDohMenQuadfiAapAlignment` |
| ACWY-INFANT-SERIES-GAP | Infant series too soon / final dose before 12 months | `cdcChildAcwyInfantSeries` (states the 8 weeks, the 12 weeks and the 12 months) |
| ACWY-HIGHRISK-PRIMARY-GAP | Dose 2 under 8 weeks | `acip2020Acwy8WeekMinimum` (ACIP's, for every age; CDC's child notes stop at 18) |
| ACWY-HIGHRISK-BOOSTER-GAP, ACWY-TRAVEL-BOOSTER-GAP | Booster too soon | 3 years: `boosterBeforeAge7`. 5 years: travel `acip2020Table9TravelBooster`, lab `acip2020Table7MicrobiologistBooster`, military `acip2020MilitaryBooster5Years`, medical risk and A/C/W/Y outbreak `boosterAtOrAfterAge7`. The same tables the patient's card cites |
| MENB-WRONG-FAMILY | Not interchangeable | `acip2020MenbNotInterchangeable` |
| MENB-HIGHRISK-DOSE-2-GAP | Dose 2 under 4 weeks | `acip2020MenbRepeat4Weeks` |
| MENB-HIGHRISK-BOOSTER-GAP | Booster too soon | `acip2020MenbBoosterCadence` |
| MENB-HEALTHY-RESCUE-DOSE-3-GAP | Rescue dose too soon | From dose 2: `menbRescueDoseRule`. After an invalid dose: `gbpRepeatSpacedFromInvalidDose` (as the MenACWY 8-week row does) |

Every sentence was already in `refs.js`, read live (no new reading). Two rule rows gained the
sentences they now cite, so the rulebook's section 5 was regenerated (`npm run rulebook`):
ACWY-TRAVEL-BOOSTER-GAP (+ travel, microbiologist, military rows) and
MENB-HEALTHY-RESCUE-DOSE-3-GAP (+ CDC's spacing sentence).

**0 answers moved** (the saved-answers sweep passed unchanged). Wording: 3,449 of 24,600 saved
patients read differently (3,183 real, 266 impossible entries): the new marks, and a source
button for a newly cited document (e.g. "[2] WA DOH" when MenQuadfi was given too young).

Guard: `src/logic/__tests__/regression-2026-11-21-dose-lines-cite-their-rule.test.js`. 17 patients
(one per rule and branch) each must be decided by their rule and cite the expected sentence,
which the rule's row must list. One sweep over all 42,301 patients: no not-counted line without a
mark except the named cases below. All 18 checks failed before the change.

## Not done: question for the owner

**1,036 lines** still have no mark. All are "Minimum age not met" for a product with no quoted
MenACWY minimum-age sentence: Penbraya 476, Penmenvy 336, Menactra 168, unknown brand 56. No
sentence on file states these (the unknown-brand 2 months is owner decision C13), so per Q12
("no row → escalate") they are left unmarked and named in the guard's `NO_SENTENCE_YET`.

## Rulebook rows (follow-up from PR #140's report)

Now showing the right sentence (with the card's booster sentences still beside it): "Dose 1 at
2 years or older" and "Any two MenACWY doses: 8 weeks" (`acip2020Acwy8WeekMinimum`). Unchanged:
the three MenB rows whose dose **counts** ("No dose 3 is needed if dose 2 was ≥6 months after
dose 1"; the two "If dose 3 was early … Counts" rows). A counted dose's line has no reason, so it
cites nothing; the card's own note would have to cite `cdcChildMenbHighRiskD2SixMonthsNoD3` /
`menbHighRiskEarlyD3Unless`. That is card wording, a separate item.
