# C9 measured — do the source links open where the quoted sentence is? (2026-11-23)

Port Phase 8, item C9 ("A CDC link opens the closed section that holds the quoted sentence";
PneumoVax #141). **Measurement only. Nothing in the app changed.**

How it was measured: CDC's pages were read live in the app's browser on 2026-11-23, and every
patient in the saved-answers grid (22,536 patients, 45,072 cards) was run through the engine
with a throwaway script (not committed).

## What a card links to today

- **A small number on the card** (the `[1]` beside a sentence) opens the quoted sentence itself,
  with a `#:~:text=` link (a web address that tells the browser to jump to those words and
  highlight them).
- **The grey source button** under the card opens the document at a section marker, for CDC's
  notes pages `#note-mening` or `#note-mening-b`.

## Finding 1: CDC's schedule notes keep the sentences in closed sections

CDC's child and adult schedule-notes pages hold the meningococcal text inside sections that start
closed ("Routine", "Catch-up", "Special situations", "Contraindications"). A browser will not
open a closed section to look for the quoted words. So **the small number leaves the reader at
the top of a page with every section closed**, and the grey button lands on the heading with
the sections still closed.

Checked live: loading
`child-adolescent-notes.html#accordion-panel-mening-b-situations` from scratch opened **only**
"Special situations" (MenB). The other six sections stayed closed. This is the same page code
PneumoVax's #141 used.

Where each of the 16 quoted sentences sits on the live pages (each found word for word):

| Section | Quotes |
|---|---|
| Child, MenACWY "Catch-up" | 13–15 booster at 16–18 (min 8 weeks); 16–18: 1 dose |
| Child, MenACWY "Special situations" | infant series; 2-dose series from 24 months; Menveo liquid not before 10; under-10 ongoing risk; travel under 24 months |
| Child, MenB "Special situations" | early dose 3 (4th dose); dose 2 at 6 months, no dose 3; Penbraya then Trumenba; Penbraya 6 months |
| Adult, meningococcal "Special situations" | Penbraya same day; pregnancy delay; pregnancy may give |
| **Not in a closed section** (printed above the sections, always visible) | MenACWY minimum ages; MenB minimum age |

Two child sentences (the infant series and the 2-dose series from 24 months) are printed twice on
the page, but both copies are in the same section, so one section link fits both.

**Cards affected: 3,387 of 45,072** carry at least one of the 14 quotes that sit in a closed
section. By quote: pregnancy "may give" 2,168, pregnancy "delay" 552, Menveo liquid 396, 13–15
booster 252, infant series 19. The other nine closed-section quotes reach no saved card. They
appear on the **Rulebook screen** (`rulebookPage.js`), and three of them also in `doseRules.js`'s
`sourcesSay`, so the Rulebook's links have the same problem.

The two minimum-age quotes (846 cards) are visible on the page and need no change.

**Would a button come off a card?** No. Only the address behind a number or button changes. No
dose, answer or wording moves. Per owner Q12 ("same as PneumoVax": citation calls are decided
alone when the dose is unchanged), this can be built without a stop. The judgement calls would
copy PneumoVax's: link to the section only, with no highlight (owner's own test in PneumoVax,
2026-11-07, showed the highlight does not fire there).

## Finding 2: ACIP 2020 has no closed sections, but 13 quotes appear more than once

The ACIP 2020 MMWR page has no closed sections around any quote. The only closed parts are menus
and the footer. Its 43 quotes were all checked: 30 appear exactly once. **13 appear 2–6 times,
because the same words are printed in several tables.** A `#:~:text=` link highlights the
**first** copy, which may be in another group's table.

**Cards affected: 11,417 of 45,072.**

| Quote (key) | Copies on page | Cards |
|---|---|---|
| "Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter" (`boosterFrom10`) | 6 | 5,690 |
| "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination…" (`boosterAtOrAfterAge7`) | 3 | 2,126 |
| "Not routinely recommended See Table 3 for persons at increased risk" | 3 | 1,040 |
| College: "…do not need another dose before college entry unless…" | 2 | 840 |
| "Aged <7 yrs: Single dose at 3 yrs after primary vaccination…" | 3 | 647 |
| "microbiologists routinely exposed to isolates of Neisseria meningitidis" | 2 | 618 |
| College: "If only 1 dose … before the 16th birthday, a booster…" | 3 | 324 |
| College: "The preferred timing of the most recent dose is on or after their 16th birthday." | 3 | 324 |
| "2 doses (second dose ≥12 wks after the first dose and after the 1st birthday)" | 5 | 244 |
| College: "College freshmen living in residence halls should receive at least 1 dose…" | 2 | 216 |
| "Aged <7 yrs: Single dose if ≥3 yrs since vaccination" (outbreak) | 2 | 104 |
| "If MenACWY-CRM is initiated at ages 3–6 months…" | 5 | 19 |
| "4 doses at 2, 4, 6, and 12 mos" | 5 | 18 |

Not yet measured: **which** copy each card should land on, and whether the first copy is the
wrong group's table for that patient. That is the next step if this is built. A text link can
name the words just before the sentence (its "prefix") to pick the right copy. Whether that
works on this page has not been tested.

## Finding 3: the ACIP button opens a table on 19,324 cards

Of 43,320 cards that quote ACIP 2020, **19,324** have a grey ACIP button that opens a whole
table (Tables 2, 7, 8, 9 or 10) instead of the first quoted sentence. This is how `cardSources()`
is built (`RecCard.jsx`): a whole-table link the card lists takes over the button. C10 (merged)
then made sure each such table has a row that fits the patient. The small numbers on those cards
still open their own sentences. **This looks intended, not broken**, and it is listed only
because the last handoff named it.

## What building C9 would mean

1. **CDC notes (Finding 1):** give each of the 14 closed-section quotes its section, and make
   its links (card number, grey button, Rulebook) open that section. This is a straight port of
   PneumoVax #141. Cards: 3,387. Answers moved: 0 expected.
2. **ACIP repeated copies (Finding 2):** a separate, larger piece. First measure which copy fits
   each card, then test a "prefix" link live. Cards: up to 11,417.
3. **Finding 3:** no change proposed.
