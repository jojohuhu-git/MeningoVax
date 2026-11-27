# C11 — each number sits on the claim its sentence states (2026-11-26)

Port plan, Phase 8, item C11. **Citation only** (owner Q12, 2026-11-21: decide alone when the
dose is unchanged). **0 answers moved** (saved-answers sweep passes unchanged) and **0 sentences
changed** (see "Measured" below).

## How it was measured

`node scripts/claimMatchesQuote.mjs` (new; changes nothing) runs every saved patient through the
engine. For every raised number on a card (the note, the booster line, each recorded dose's
line) it takes the words the number sits on and the sentence the number opens, and lists:

- **complete**: the words say "complete" / "no further" / "not needed" and the sentence does not;
- **total**: the words give a dose count ("3-dose", "1 dose") the sentence does not give;
- **age** (for reading only): the words name an age or a gap the sentence does not name. The
  patient's own measured gaps ("about 3 weeks") are facts about the patient and are skipped.

Numbers side by side ("[1][2]") are judged together. This is PneumoVax's P2-7 ("complete" cites
the sentence that says complete) and C10-1 (a dose total cites the row that states it).

Before: 124,337 numbers on the saved patients' cards (the same count C12 measured).

## What was fixed (six kinds of card)

Counts are numbers before the fix, from the script.

| # | Card and words | Was | Now |
|---|---|---|---|
| 1 | High-risk child under 10 (not complement): "track them for the **3-dose** high-risk MenB series once they reach age 10" (1,332) | "3-dose" had no number; the one after "age 10" opens ACIP 2020's "MenB vaccine series", no count | ACIP Oct 2024's 3-dose sentences, both families (no product yet), as the age-10+ dose 1 card cites them (item 7). Complement keeps CDC's "MenB vaccines need 3 doses" |
| 2 | "A MenACWY dose at age 16 years or older **completes** the adolescent schedule", first dose at 16+ (808 of 832) | ACIP's "a single dose … at age 11 or 12 years followed by a booster dose … at age 16 years" | ACIP 2020's "Adolescents who receive a first dose after their 16th birthday do not need a booster dose …". A patient with a dose before 16 as well keeps the 11–12 + 16 sentence (24): it states the two doses they have |
| 3 | High-risk MenB dose 2: "(**minimum 4 weeks**)" (2,376) | ACIP Oct 2024's 0 / 1–2 / 6-month schedule, no minimum | ACIP 2020's "a minimum interval of 4 weeks should be used between any 2 doses", the sentence the dose-2 rule row rests on (owner C8, 2026-11-15). The not-yet-due card states the minimum in its own clause and is unchanged |
| 4 | High-risk MenB dose 3: "at least 6 months after dose 1, and at least **4 months after dose 2**" (1,232) | the schedule sentence, no 4 months | the schedule keeps "6 months after dose 1"; "4 months after dose 2" opens ACIP Oct 2024's "If the third dose is administered <4 months after the second dose, the dose should be repeated …" |
| 5 | High-risk MenB first booster: "… **within the 4-day grace period**" (440) | ACIP's 6- or 4-month sentence, no grace | CDC's General Best Practices, read live 2026-11-26 (page dated July 24, 2024, "Spacing of multiple doses of the same antigen"): "vaccine doses administered ≤4 days before the minimum interval or age are considered valid". New entry `gbpGraceFourDays` |
| 6 | Infant MenACWY series off the routine ages: "at least **8 weeks** between the early doses" (2) | ACIP's "4 doses at 2, 4, 6, and 12 mos" | travel (and complement, asplenia, HIV): ACIP's row on "the series", CDC's notes' "at least 8 weeks after previous dose" on the 8 weeks. Outbreak (1) keeps ACIP's row: its one 8-week sentence is about a MenACWY-CRM series started at 3–6 months, and this line also serves a 2-month start |

Guard: `src/logic/__tests__/regression-2026-11-26-c11-number-sits-on-the-claim-its-quote-states.test.js`
(13 checks; with `recommend.js` reverted, the 7 fix checks fail and the 6 controls pass).
Four older tests pinned the old source lists and were updated to the new ones.

## Left as they are, and why

- **"The healthy 2-dose MenB series is complete" (156) and "The accelerated 3-dose MenB series is
  complete" (252).** No ACIP or CDC sentence says a MenB series "is complete". The sentence each
  cites states the doses and spacing the patient has had. Kept.
- **A dose before 16 and one at 16+ (24).** Kept on the 11–12 + 16 schedule sentence, for the same
  reason.
- **The outbreak infant's 8 weeks (1).** Reason in row 6.
- **The rest of the script's list** reads correctly on inspection: "one dose is due before college
  entry" opens ACIP's "do not need another dose … unless it has been more than 5 years"; "11–12
  years" opens "at age 11 or 12 years"; the serogroup B outbreak cards' whole-table link (740,
  ACIP Table 8) has no quote at all (already listed in the C12 handoff).

## Seen, not fixed: a question for the owner

A serogroup B outbreak patient who has had the outbreak's one booster and then another MenB
dose (for example a 19-year-old: 3 Bexsero, the booster a year later, then Penmenvy 5 months
after the booster). The card correctly says "Complete (outbreak booster given)". The later dose's
line says **"Booster about 5 months after the last booster, 2 years required"** and cites ACIP
Table 8, which says one booster ≥1 year after the series. An outbreak calls for no second booster
at all, so "2 years required" is a claim no source states (12 numbers in the saved grid).
Changing it changes a recorded dose's verdict wording, so it is the owner's call, not a citation
fix.

## Measured after

- `npx vitest run`: see the PR.
- Saved answers: unchanged (sweep passes; `npm run sweep:update` not needed).
- `npm run prose -- dump/diff`: 8,244 of 31,160 patients read different text **including the hover
  quotes and numbers** (5,599 of 23,788 realistic patients). With the numbers, hover quotes and
  the Sources list set aside, **0 patients** read a different sentence.
- Hover texts on screen: 294,368 → 305,958. Numbers on the cards (script): 124,337 → 130,698.
- `node scripts/citationMapping.mjs` (its own, looser counts): "number with no button" 13,718 →
  13,798 (+80 cards; the grace number's document, CDC's Best Practices page, is not in those cards'
  fixed button list; the screen builds the button from the number, and the C3 guard, every number
  has a button, passes); "same sentence twice" 9,890 → 10,286 (+396: a Bexsero dose 2 card whose
  earlier too-soon dose's line already cited ACIP's 4 weeks; the two lines make the same claim and
  share one number).
