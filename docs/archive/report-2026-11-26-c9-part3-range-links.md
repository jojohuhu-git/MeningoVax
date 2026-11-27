# C9 part 3: range links for the ACIP copies no prefix can reach (2026-11-26)

Owner answer: `decisions-2026-11-26-c9-part3-range-links.md` ("highlight in own table").

## Built

- `refs.js`: six range starts, each read live (it appears once on the page, and the first copy
  of each sentence after it is in the same table). Two lists in table order,
  `ACWY_BOOSTER_COPIES` (Table 4, 6, 9) and `ACWY_INFANT_COPIES` (Tables 4, 5, 6, 8, 9), are
  attached as `copies` to `boosterBeforeAge7`, `boosterAtOrAfterAge7`, `acwyInfantHighRisk2to6mo`
  and `acwyInfantHighRisk7to23mo`. The patient's first group in the list picks the copy; Table 4
  (complement) is the first copy on the page, so a complement patient keeps a plain link.
- `acip2020Table9TravelBooster` always opens Table 9 (`rangeStart`). Only a traveler's card cites
  it, so its `population` is now `['acwy-travel']`.
- `cite(key, { riskIds })`: the engine passes the patient's groups at each place it cites these
  five entries (`recommend.js`). No new entries; the page each link points to is unchanged, so
  card numbering does not move.

## Measured (today's saved-answer grid: 23,788 patients, 67,608 cards)

**2,727 cards** now open the patient's own table:

| Entry | Cards |
|---|---|
| `boosterAtOrAfterAge7` (Tables 6, 9) | 1,942 |
| `acip2020Table9TravelBooster` (Table 9) | 1,182 |
| `boosterBeforeAge7` (Tables 6, 9) | 322 |
| `acwyInfantHighRisk7to23mo` (Tables 5, 6, 8, 9) | 204 |
| `acwyInfantHighRisk2to6mo` (Tables 5, 6, 8, 9) | 14 |

(A card can carry two of these, so the rows add up to more than 2,727.)

- 0 answers moved (`npm run sweep:update`: 0 of 7,372).
- 0 of 31,160 patients read different wording (`npm run prose -- diff`).
- 0 cards cite one of these sentences to a patient whose own table does not print it.

## Live checks (2026-11-26, full page load)

| Link | Landed in |
|---|---|
| Table 6 booster heading → "Aged ≥7 yrs…" | Table 6 (screenshot: heading and both age lines highlighted) |
| Table 9 booster heading → "Single dose at 5 yrs…" | Table 9 |
| Table 9 booster heading → "Aged <7 yrs…" | Table 9 (screenshot) |
| Table 5 title → "4 doses at 2, 4, 6, and 12 mos" | Table 5 |
| Table 6 title → "2 doses (second dose ≥12 wks…)" | Table 6 |
| Table 8 title → "4 doses at 2, 4, 6, and 12 mos" | Table 8 |
| Table 9 title → "2 doses (second dose ≥12 wks…)" | Table 9 |

In the running app, the worked patient (HIV, 30, doses at 25) shows "Booster due today"; the
card's [1] carries exactly the Table 6 link tested above.

## Seen in passing

The part 2 report saw 201 microbiologists under 7 citing `boosterBeforeAge7`. Today's saved-answer
grid has **0** such cards (this change did not alter which entry is chosen). The earlier figure
probably came from a different patient grid; not chased further.

Guard: `regression-2026-11-26-c9-part3-range-link-opens-the-patients-table.test.js`.
