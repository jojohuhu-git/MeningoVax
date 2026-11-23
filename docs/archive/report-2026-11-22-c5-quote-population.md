# MeningoVax — C5: every quoted sentence names its patients (2026-11-22)

Port plan, Phase 8, table C, item C5: "Every quoted source names the patient group it was written
about (`population`); a card never shows another group's quote except where declared." Ported from
PneumoVax's field of the same name (its owner decision of 2026-10-17: the field records who the
sentence is **about**). Decided under Q12 (2026-11-21): no answer moved; one question goes to the
owner (below).

## What was built

- **`population` on all 91 quoted entries** in `src/data/refs.js` (86 existing, 5 new), from 15
  groups: `acwy-routine` plus one group per MenACWY indication; `menb-healthy` plus one group per
  MenB high-risk indication, and `menb-pregnancy`. The groups are the engine's own splits
  (`patientGroups()` in `riskFactors.js`).
- **A guard**, `regression-2026-11-22-c5-every-quote-names-its-patient.test.js`. It sweeps the whole
  engine result for all 18,780 saved-answer patients (every quote on every card, recorded-dose
  verdict, age-doubt note and combined-shot card) and fails if a quote reaches a patient outside its
  groups. Exceptions must be declared at the call site, `cite(key, { aboutAnotherGroup: 'why' })`,
  and the declared keys are pinned. A mutation check proves it catches a relabelled quote.

## How each quote was tagged (read live 2026-11-22)

ACIP 2020 (rr6909a1.htm) was read table by table in the browser, with every row and footnote. Its
schedule is one table per risk group (Tables 4–10). Several rows are printed word for word in more
than one table; such a sentence is about every group whose table prints it:

| Sentence | Printed in |
|---|---|
| "Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5 yrs thereafter" (and its ≥7 twin) | Tables 4, 6, 9 (complement, HIV, travel) |
| "4 doses at 2, 4, 6, and 12 mos"; "2 doses (second dose ≥12 wks after …)" | Tables 4, 5, 6, 8, 9 |
| "Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" | Tables 4, 5, 6, 7, 9 (≥10 rows) |

CDC's Child/Adolescent Notes were read with the closed sections included (`textContent`): the
3–6 month infant series sentence sits under the high-risk heading and the travel heading only.
Every other quote names its own group in its own words (healthy 16–23, at increased risk,
pregnancy, college, military and so on).

## What the guard found, and what was done (judgement calls, for the owner's audit)

All are citation choices with the same doses (Q12), except item 7.

1. **Asplenia booster timing** (2,484 showings). The card quoted the Tables 4/6/9 rows. Table 5
   (asplenia) gives the same 3 and 5 years in its own words: "Aged <7 yrs: Single dose at 3 yrs
   after vaccination and every 5 yrs thereafter" / "Aged ≥7 yrs: Single dose at 5 yrs and every 5
   yrs thereafter". New entries quote Table 5; an asplenia patient cites them. Hover text only.
2. **A/C/W/Y outbreak booster timing** (290 showings). Table 8 (outbreak) says "Aged <7 yrs: Single
   dose if ≥3 yrs since vaccination" / "Aged ≥7 yrs: Single dose if ≥5 yrs since vaccination": the
   same 3 and 5 years. New entries quote Table 8. Hover text only.
3. **Outbreak infant begun at 3–6 months** (23 showings). CDC's notes do not list an outbreak, so
   these infants now cite ACIP's footnote, printed under Tables 4, 5, 6, 8 and 9: "If MenACWY-CRM is
   initiated at ages 3–6 months, catch-up vaccination includes doses at intervals of 8 weeks until
   the infant is aged ≥7 months, …followed by a dose at least 12 weeks later and after the 1st
   birthday." Same 8 weeks, 12 weeks and 12 months as CDC's sentence. **Visible:** the CDC
   Child/Adolescent Notes button comes off these cards (22 saved patients, 19 of them real); ACIP
   2020 was already there.
4. **Serogroup B outbreak, MenB booster too soon** (16 showings). The verdict quoted ACIP's 2019
   box for medical conditions and microbiologists ("…then every 2–3 years"). It now quotes Table 8,
   "Single dose if ≥1 yr after MenB primary series completion": the same 1 year.
5. **A false sentence on the 11–15 MenACWY card** of a serogroup B outbreak contact: "Without a MenB
   risk factor, MenB is offered from 16 through 23 years by shared clinical decision-making". The
   patient has a MenB risk factor, and their MenB card gives the high-risk series. The sentence is
   now said only to a patient it is true of. **Visible:** 224 saved patients (188 real) lose that
   sentence; on the 13–15 card, the ACIP 2020 (Table 2) button it was the only citation for comes
   off, and the card's button is CDC's notes, whose catch-up row it already cites.
6. **Declared cross-references** (kept, with the reason at the call site):
   - `acip2020Acwy8WeekMinimum`: ACIP's 8 weeks is written about the high-risk 2-dose series; owner
     C11 (2026-11-15) made 8 weeks the floor between any two MenACWY doses.
   - `acip2020MenbRiskGroups`: quoted to a healthy child under 10 to name the high-risk groups they
     are not in.
   - `menbBoosterIfRemainOrBecomeAtRisk`: quoted on a healthy completed series for "no booster
     unless a high-risk indication develops".
7. **Open, for the owner (not a citation choice).** A microbiologist whose series ended before age
   7. ACIP Table 7 has only a "≥10 yrs" row. The card follows owner E1 (2026-11-21, "Same as 10+"):
   "The first booster is due 5 years after dose 1." The recorded-dose check still uses the under-7
   3-year floor and quotes the under-7 row of Tables 4/6/9. Worked patient, born 2019-09-15, seen
   2026-09-15, microbiologist, MenQuadfi at 3 years:
   - booster at 6½ years (3½ years later): **counted**; the card had said 5 years;
   - booster at 5 years (2 years later): "Booster about 2 years after the last dose, 3 required",
     "Repeat from Sep 15, 2029".
   Making the check say 5 years would move verdicts (Q12 case c). Pinned in the guard as
   `OPEN_FOR_THE_OWNER` (134 showings) until answered.

## Counts

- Answers moved: **0** (`sweep-saved-answers` green).
- Wording (`npm run prose`): 1,938 of 24,600 saved patients read differently; after removing hover
  text, **246** (207 real, 39 impossible entries), all items 3 and 5 above.
- `node scripts/uncitedByDocument.mjs`: `cardsWithUncited: 0`.
- Suite: 2,579 passing, 0 failing (219 files).
- Live-checked (dev server): a 13-year-old serogroup B outbreak contact's MenACWY card reads "A
  catch-up dose now, then the booster at 16–18 years [1]. A pentavalent dose may be used only when
  MenACWY and MenB are due at the same visit [2]", sources CDC notes and Penmenvy MMWR; an asplenia
  6-year-old's booster line hovers show Table 5's two sentences.

## Seen, not changed (later items)

- **C9 (links open the right section).** A sentence printed in several tables highlights its first
  copy, usually Table 4 (complement), whoever the patient is.
- **C13 (the card's own age band).** "Aged ≥7 yrs: …" comes from the 2–9 rows; a patient whose series
  ended at 10 or later is quoting a child's row where the ≥10 row says the same 5 years.
