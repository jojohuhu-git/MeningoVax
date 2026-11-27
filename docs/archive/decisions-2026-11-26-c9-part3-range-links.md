# C9 part 3 — an ACIP sentence no prefix can reach opens the patient's own table (owner answer, 2026-11-26)

Port Phase 8, Tier 2, item C9. Follows `report-2026-11-26-c9-part2-acip-copies.md` ("Not built").

## The problem

ACIP 2020 (rr6909a1.htm) prints "Aged ≥7 yrs: Single dose at 5 yrs after primary vaccination
and every 5 yrs thereafter" (and its "<7" twin) in Tables 4, 6 and 9, and the infant rows ("4
doses at 2, 4, 6, and 12 mos"; "2 doses (second dose ≥12 wks after the first dose and after the
1st birthday)") in Tables 4, 5, 6, 8 and 9. A card's link opened the first copy, in Table 4
(complement deficiency). C9 part 2's fix, a prefix, could not reach these: the words that tell
the tables apart are on the line above, and Chrome stops a prefix at a line break.

## Tested live before asking (2026-11-26, full page load)

A third kind of link, a **range** (`#:~:text=start,sentence`), is allowed to cross line breaks.
Starting at Table 6's booster heading ("Boosters (if person remains at increased risk)¶¶:") and
ending at the sentence, the page scrolled into Table 6 and highlighted the heading and both age
lines. Table 9's heading and Table 5's title worked the same way.

## Owner answer

Asked with the worked patient (30-year-old with HIV, 2 MenACWY doses finished at 25, booster
due; control: a complement patient, unchanged), offering: C, a range highlight in the patient's
own table (recommended); A, the table's title with no highlight; B, keep Table 4.
Answer: **"C: highlight in own table."**

Known and accepted with the answer: for a patient 7 or older, the highlight also covers the
"Aged <7 yrs" line, which sits between the heading and the sentence. The infant rows highlight
from the table title down to the row.

## Built

See `report-2026-11-26-c9-part3-range-links.md`.
