# C9 part 2: ACIP sentences printed in several tables (2026-11-26)

Port Phase 8, item C9, part 2. Follows `report-2026-11-23-c9-measured.md`, Finding 2.

## The problem

ACIP 2020 (`rr6909a1.htm`) has one schedule table per patient group: Table 2 routine, Table 4
complement, Table 5 asplenia, Table 6 HIV, Table 7 microbiologists, Table 8 outbreak, Table 9
travel, Table 10 college and military. Many rows use the same words in several tables. A card's
numbered link (`#:~:text=` plus the sentence) highlights the **first** copy on the page, which is
usually in Table 4. So a microbiologist's booster link opened Table 4, which is about complement
deficiency.

## What was measured (live, 2026-11-26, full page load, pane visible)

Every copy of each repeated quote was found on the live page, and the table around it recorded.
All 22,536 saved patients (45,072 cards) were then run through the engine (throwaway script,
not committed), and each cited copy was checked against the patient's own table.

- **14,860 cards** cite a sentence printed more than once.
- **10,956 cards** landed on another group's table, or on Table 2's footnote for a college student.

A text link may also name the words just before the sentence (its "prefix"). Tested live:

| Link | Landed in |
|---|---|
| sentence alone | Table 4 (the first copy) |
| prefix `risk)**:` | Table 7 (microbiologists) |
| prefix `risk)***:` | Table 5 (asplenia), ≥10 row |
| prefix `risk)†††:` | Table 4 (complement), ≥10 row |
| prefix `*` (college paragraph) | Table 10 footnote |
| prefix `††` (infant 3–6 months) | Table 8 footnote (outbreak) |
| prefix that crosses a line break (Table 9, Table 6, footnote `vaccine. *`) | **nothing: the page stayed at the top** |

So a prefix works only on the sentence's own line. Chrome treats a line break inside a table cell
as a boundary.

## Built (PR, this branch)

Six entries carry a `prefix` (tested above). `boosterFrom10` was split in two: Table 4's copy
stays `boosterFrom10` (complement) and Table 5's copy is new, `boosterFrom10Asplenia` (asplenia).
A patient with both gets Table 4. Two entries were narrowed to the only group shown them
(`acip2020Table7MicrobiologistBooster` to microbiologists, `acip2020InfantSeriesStart3to6mo` to
outbreak), so the guard holds each link's table to its patient.

**8,245 cards** now land in the patient's own table, on the sentence:

| Entry | Cards |
|---|---|
| `acip2020Table7MicrobiologistBooster` (Table 7) | 3,756 |
| `boosterFrom10Asplenia` (Table 5) | 3,414 |
| `acip2020College5Years` (Table 10 footnote) | 840 |
| `acip2020College1DoseBeforeEntry` (Table 10 footnote) | 216 |
| `acip2020InfantSeriesStart3to6mo` (Table 8 footnote) | 19 |

Complement patients' ≥10 link moves from Table 4's 2–9 row to its ≥10 row (same table).
0 answers moved; 0 of 31,160 patients read different wording.

## Not built: 2,886 cards no prefix can reach (owner question)

| Entry | Patient's table | Cards |
|---|---|---|
| `boosterAtOrAfterAge7` | Table 6 (HIV), Table 9 (travel) | 1,942 |
| `acip2020Table9TravelBooster` | Table 9 (travel) | 1,182 |
| `boosterBeforeAge7` | Table 6, Table 9 | 487 |
| `acwyInfantHighRisk7to23mo` | Tables 5, 6, 8, 9 | 204 |
| `acwyInfantHighRisk2to6mo` | Tables 5, 6, 8, 9 | 14 |

(175 cards appear in both lists; they are counted in each.) These sentences sit on bulleted lines
("• Aged ≥7 yrs: …"). The words that tell the tables apart are on the heading line above, behind a
line break. The two choices are to open the patient's own table at its title with no highlight
(as C9 part 1 and the grey ACIP button already do), or to keep highlighting the words in Table 4.

## Seen, not checked

201 of the `boosterBeforeAge7` cards are microbiologists under 7 years old. That entry's sentence
is not about microbiologists (Table 7 has no row under 10). No real patient is a microbiologist
under 7, so this is probably a grid artefact. The C5 guard did not flag it.
