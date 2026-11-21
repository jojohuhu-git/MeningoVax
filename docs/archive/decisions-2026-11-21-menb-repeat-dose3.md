# MeningoVax — owner decision M1d: the repeat of an early MenB dose 3 (2026-11-21)

Narrows **M1c** (2026-11-20, `decisions-2026-11-20-rulebook-reorg.md`).

## The question

Asplenia, Bexsero Jan 1, Feb 1, Apr 1, 2026. Apr 1 is under 4 months after dose 2 and under 6
months after dose 1, so it does not count (M1). The card advised the repeat on Aug 1 (4 months
after Apr 1), but also said it "can be given today" from Jul 1 (6 months after dose 1), and a
repeat on Jul 10 counted. That came from M1c as it was built: "a repeat counts if it is ≥4 months
after the not-counted dose 3, or ≥6 months after dose 1".

## Owner's answer (2026-11-21)

> "If dose 3 is given less than 4 months after dose 2, it is repeated at least 4 months after the
> last dose. The one exception is a dose 3 given at least 6 months after dose 1, which counts as
> valid. The '6 months after dose 1' rule only decides whether dose 3 itself was valid. Once dose
> 3 is invalid, the 4-month interval runs from that last dose."

## Source (read live 2026-11-21)

ACIP, MMWR mm7349a3 (Dec 12, 2024), https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm:
"If the third dose is administered <4 months after the second dose, the dose should be repeated ≥4
months after the last dose, unless the third dose was administered ≥6 months after the first
dose." And: "This guidance applies to both MenB-4C and MenB-FHbp."

CDSI 4.65 (both increased-risk series, dose 3) has an allowable interval of "6 months - 4 days"
from dose 1, which would also count a repeat 6 months after dose 1. ACIP's sentence ties the
"unless" to the third dose, and ACIP outranks CDSI. Recorded as a named difference in
`scripts/cdsi/cdsiRuleMap.mjs`.

## Built (2026-11-21)

- `seriesTotals.js` `menbHighRiskDose3Early(…, { isRepeat })`: the 6-month line applies only when
  the dose before is dose 2. The rule row `MENB-HIGHRISK-EARLY-DOSE-3` passes `isRepeat`.
- `recommend.js`: the repeat's earliest valid date is 4 months after the dose that did not count
  (never 6 months after dose 1). The "Why this" line "A repeat given at least 6 months after dose 1
  counts even if sooner than 4 months after the invalid dose" is removed.
- Unchanged: the 4-day grace on the 4-month line (C7); the repeat's advised date, the latest of
  4 months after the dose that did not count, 4 months after dose 2 and 6 months after dose 1
  (M1b); the first dose 3's 6-month exception with its grace (C6, D3).
- Saved answers: 28 of 18,780 moved, all one history (Bexsero 400, 370, 260 days ago, Penmenvy 150
  days ago; 7 high-risk profiles × 4 ages): the Penmenvy dose, 3.6 months after the not-counted
  dose and 8 months after dose 1, no longer counts; MenB dose 3 is due today (was: booster Apr 2027).
