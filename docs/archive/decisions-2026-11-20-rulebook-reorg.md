# Rulebook reorganization: owner decisions (2026-11-20)

Owner review of the live Rulebook screen after PR #125, in chat, with before/after drawings.
Not built yet. Reverses two earlier choices on purpose: D1's "New top, then 1–8 folded"
(review v10) and Quick look as its own section with age bars (2026-11-19 mockup picks).

## What the owner said was wrong

- "How MeningoVax decides" should fold as a whole, not one row at a time.
- Quick look scrolls sideways; the Details button gets missed; it does not fit a phone
  (measured: 820px table in a 349px box at phone width).
- Vaccines table: the "Counts as" column is unclear.
- Age lines and the Risk groups table repeat Quick look; Age lines reads as random facts;
  Risk groups is long paragraphs.
- MenACWY chips show an age in one row and a dose number in another; the high-risk chips
  repeat the sentence under them.
- MenB has too many bullets; "A dose that does not count" mixes general rules and special cases.
- Sources: a random list; the "N sentences quoted · read <date>" line is not needed.
- Quick look should go if it only repeats other content.

## Approved

1. **Say each thing once.** Quick look, Age lines and the Risk groups table are removed.
2. **"How MeningoVax decides" is one fold.** Inside, seven one-sentence steps; each links to
   its section. The per-step Show panels are removed (they repeated the sections).
3. **Each section is its own fold**: Stop check, The vaccines, MenACWY, MenB, More than one
   condition, The combined shot, Doses on the record, MeningoVax decisions, Sources.
4. **Group table at the top of MenACWY and of MenB**: three columns, Group | Doses | Boosters.
   No age columns, no chips (plain words). Details sits under the group name. Only blue
   (shared decision) and amber (wait) cells stay tinted. Details opens the same panel as today.
5. **Vaccines table**: "Counts as" removed. "Finish with the first MenB product. The card also
   offers finishing with the other." moves under "MenB products are not interchangeable".
6. **Every schedule is a table: Dose | Routine | Minimum interval.** (Owner rejected arrows,
   a dose ladder and a timeline: dose-1-to-dose-3 intervals were hard to follow and timeline
   labels misaligned.) "Minimum interval" holds the TRUE minimum, the shortest gap at which a
   dose still counts. Where the routine gap is longer and a sooner dose still counts (healthy
   MenB dose 2, high-risk MenB dose 3), the two-dose timing goes in Routine and one line under
   the table says what happens in between.
7. **MenB high risk, "If dose 3 was early"**: one three-row table (Dose 3 was given | Result)
   replaces the bullets.
8. **"A dose that does not count"** splits into General rules and Special cases.
9. **Part 6's minimum-interval table**: the two "Sooner still counts" rows move to a short
   "Sooner counts, but a dose is added" list, so the heading "a dose given sooner does not
   count" is true.
10. **Sources grouped**: ACIP recommendations; CDC schedule notes; Other CDC and ACIP guidance;
    immunize.org; Other. No count or read date on screen (both stay in `refs.js` and the
    rulebook document).

## Checked before building (engine, 2026-11-20)

- Military row ("under 22 years: same as healthy; 22 years or older: one dose") matches the
  engine: a 17-year-old recruit with no doses gets "1 dose", with a dose at 12 gets
  "Booster (16y)"; a 23-year-old gets "1 dose".
- Healthy MenB dose 2 at 5 weeks counts (dose 3 added); dose 3 one week after dose 2 is
  "Not counted — repeat". The 4-week minimum holds there.
- **Finding, not fixed:** a HIGH-RISK MenB dose 3 given 1 day or 1 week after dose 2 counts
  ("Dose 3 of 4"; or "Dose 3 of 3", series complete, when it is also ≥6 months after dose 1).
  The 4-week minimum between any two MenB doses is not applied to high-risk dose 3. The
  rulebook's own intervals table says it is. Raised with the owner before the build.

## M1: the floor for a high-risk MenB dose 3 (asked 2026-11-20)

Sources read live 2026-11-20 (quotes verbatim, split where the fetch tool capped length):

- **ACIP 2024, mm7349a3** (Dec 12, 2024), Dosing Interval and Schedule: "If the third dose is
  administered <4 months after the second dose, the dose should be repeated ≥4 months after the
  last dose," … "unless the third dose was administered ≥6 months after the first dose". Gives no
  lower floor. Interchangeability: "The next dose of the selected manufacturer should be
  administered no sooner than the recommended interval" … "and ≥4 weeks after the most recent
  dose (from either manufacturer) was administered".
- **ACIP 2020, rr6909a1** (Sep 25, 2020), Persons at Increased Risk > MenB: "For situations in
  which a dose or doses must be repeated," … "a minimum interval of 4 weeks should be used between
  any 2 doses."
- **ACIP General Best Practice, Table 3-2** (page dated July 24, 2024; before the Oct 2024 Bexsero
  change): MenB-2, persons at increased risk, minimum interval to next dose "Trumenba: 4 months".
  Body: "Doses of any vaccine administered ≥5 days earlier than the minimum interval or age should
  not be counted as valid doses".
- **CDC child/adolescent notes** (dated July 2, 2025): "Doses of any vaccine administered ≥5 days
  earlier than the minimum age or minimum interval should not be counted as valid". (MenB section
  read only as a summary: "if dose 3 is administered earlier than 4 months after dose 2, a 4th dose
  should be administered at least 4 months after dose 3".)
- **CDSI 4.65** (local file `AntigenSupportingData-Meningococcal-B-4.65.xml`), both increased-risk
  series, dose 3 from dose 2: absolute minimum "4 months - 4 days". CDSI does not count a dose 3
  under 4 months after dose 2.

Already decided and NOT reopened: owner STOP C C5/C6 (a dose 3 under 4 months after dose 2
counts, a dose 4 is owed, unless dose 3 was ≥6 months after dose 1). The question is only the
floor below which dose 3 does not count at all.

Engine today (run 2026-11-20): asplenia, Bexsero 2026-01-01, 2026-06-25, 2026-07-02 (dose 3 one
week after dose 2) → dose 3 "Dose 3 of 3", series complete, first booster 2027-07-02. Control,
dose 3 on 2026-07-30 (5 weeks after dose 2) → the same. High-risk dose 2 one week after dose 1 →
"Not counted — repeat" (row MENB-HIGHRISK-DOSE-2-GAP, owner C8).

**Owner answer (2026-11-20):** "Explain why the CDSI rule isn't followed? It should be 4 month a
floor. A meningovax decision could be made for if the 4 month minimum isn't met but dose 3 is
given at least 6 months after dose 1."

Why the app differs from CDSI today: the "counts, and a 4th dose is owed" behaviour was built
2026-09-17 from CDC's notes wording ("a 4th dose should be administered at least 4 months after
dose 3"). STOP C C6 (2026-11-15) only added ACIP's "unless"; "count vs not counted" was never asked.
ACIP 2024 says the dose "should be repeated", which is CDSI's reading.

CDSI 4.65 already holds the owner's proposed exception: both increased-risk series, dose 3 carry an
`allowableInterval` from dose 1 of "6 months - 4 days". In CDSI a dose 3 is valid if it meets the
4-month interval from dose 2 OR the allowable 6 months from dose 1. So the exception is CDSI's (and
ACIP's "unless"), not a new MeningoVax decision.

What moves (engine today vs the 4-month floor), asplenia, Bexsero:
- A. 2026-01-01, 02-01, 04-01 (dose 3 two months after dose 2, three months after dose 1): today
  "Dose 3 of 4", then "Dose 4 of 4" due. After: "Not counted — repeat", then "Dose 3 of 3" due on
  the same date (≥4 months after the invalid dose). Same number of shots; label changes.
- B. 2025-10-01, 2026-03-01, 04-15 (six weeks after dose 2, 6½ months after dose 1): counts, series
  complete, both before and after (allowable interval).
- C. 2026-01-01, 06-25, 07-02 (one week after dose 2, six months after dose 1): counts, series
  complete, both before and after. CDSI sets no floor here. Follow-up asked: M1a.

Reverses the CLAUDE.md rule "A D3 given earlier than 4 months after D2 still counts, and a 4th dose
is owed" (C6's labelling). C5 (≥4 months after dose 2 counts whatever the gap from dose 1) and
C7 (4-day grace on the 4-month line) are unchanged and match CDSI.

**M1a (owner, 2026-11-20):** "the way I interpret this is that dose 2 becomes invalid and dose 3
becomes dose 2 using the following rule: If dose #2 is administered at least 6 months after dose
#1, dose #3 not needed. push back if this is wrong"

Reply given: the outcome is right (complete, booster July 2027), the label reasoning is not. The
Jun 25 dose is valid (≥4 weeks after dose 1; CDSI dose 2 floor "4 weeks - 4 days"), and at 6 days
short of 6 months it does not skip dose 3. So it stays "Dose 2 of 3", and the Jul 2 dose counts as
dose 3 through ACIP's "unless" / CDSI's allowable 6 months from dose 1. Either reading leaves doses
at 0 and 6 months, so no 4-week floor is needed in the exception. Recommendation withdrawn: follow
CDSI exactly (awaiting the owner's yes).

**Owner (2026-11-20):** "also make sure this rule is also followed from MMWR menB: If the third
dose is administered <4 months after the second dose, the dose should be repeated ≥4 months after
the last dose, unless the third dose was administered ≥6 months after the first dose" (mm7349a3,
the sentence read live above). Build notes: the repeat is timed ≥4 months after the not-counted
dose 3 (the "last dose"); a repeat given ≥6 months after dose 1 also counts (same "unless", CDSI's
allowable interval); both lines keep the 4-day grace period (C7, D4).

## M1 consequences (asked and answered 2026-11-20, resumed session)

Engine today (run 2026-11-20, asplenia, Bexsero, age 20): Jan 1, Feb 1, Feb 15 2026 → Feb 15
counts as "Dose 3 of 4", "Dose 4 of 4" due Jun 15, 2026. Jan 1, Jan 29, Mar 1 → "Dose 4 of 4"
due Jul 1, 2026. Jan 1, Feb 1, Apr 1 → "Dose 4 of 4" due Aug 1, 2026.

**M1b — the routine date of the repeat. Owner: "Jul 1 (Recommended)".** The routine date is the
latest of: 4 months after the not-counted dose 3, 4 months after dose 2, 6 months after dose 1.
The earliest date at which the repeat would count shows beside it when sooner ("It can be given
from <date> if needed", the STOP F1 pattern). Jan 1, Feb 1, Feb 15 → "Dose 3 of 3" due Jul 1,
2026, "It can be given from Jun 15, 2026 if needed". Control Jan 1, Feb 1, Apr 1 → Aug 1, no
"from" line.

**M1c — is "≥4 months after the last dose" a floor? Owner: "Not counted (Recommended)".** A
repeat counts only if it is ≥4 months after the not-counted dose 3, or ≥6 months after dose 1
(both with the 4-day grace; and ≥4 weeks after any dose that did not count, MENB-REPEAT-GAP).
Sources: ACIP mm7349a3 "the dose should be repeated ≥4 months after the last dose"; ACIP Best
Practice "The repeat dose should be spaced after the invalid dose by the recommended minimum
interval"; CDSI 4.65 dose 3 "4 months - 4 days" from the previous dose. Jan 1, Jan 29, Mar 1,
Jun 1 → Jun 1 "Not counted — repeat" again. Control: repeat Jul 1 → counts, series complete,
booster Jul 1, 2027.

Scope note (build): the 4-month line is measured from a dose 3 that was not counted by THIS rule
(the early dose 3). A dose not counted for another reason (the other MenB product, too soon after
dose 1) keeps its 4-week repeat gap (ACIP mm7349a3 interchangeability: "≥4 weeks after the most
recent dose (from either manufacturer)"; owner C2, E1/E2).

**M1d — does the FIRST dose-3 card (no early dose 3 given) show an earliest valid date? Owner
(2026-11-20): "keep as is".** The card shows only the routine date (the later of 6 months after
dose 1 and 4 months after dose 2). Only the repeat after a not-counted dose 3 shows "Earliest valid
date" (M1b). Why asked: a dose 3 ≥4 months after dose 2 counts (C5), or ≥6 months after dose 1
(ACIP "unless", M1a), so the true minimum can fall days after dose 2 (Jan 1, Jun 25 → Jul 1), and
no source advises giving it then. Engine 2026-11-20: Jan 1, Feb 1 → due Jul 1; Jan 1, Apr 1 → due
Aug 1; Jan 1, Jun 25 → due Oct 25; no earlier date on any. Pinned by the control in
`regression-2026-11-20-m1-menb-highrisk-dose3-follows-cdsi.test.js`.
