# MeningoVax port — Phase 5.1 measured (2026-11-18)

Measured on `main` at `174c03b` (2,053 tests passing), over the 18,780 saved patients
(`buildSavedAnswerCases`) and their 24,600 rendered screens (`npm run prose -- dump`).
Nothing changed in the app. Scripts were throwaway (scratchpad); each number below is
from a run on this date.

## Clean (no work)

| Item | What was checked | Result |
|---|---|---|
| B6 one date format | ISO (2026-11-18), slash (11/18/26) and long-month dates in every screen | **0** in 24,600 screens; every date is "Nov 18, 2026" |
| A6 no date promised for a dose no card asks for | dates printed on a dose line | Dose lines print **no** next-dose date at all (dates only on record problems and one MenB repeat-spacing line), so nothing is promised |
| A13 no advised date inside the grace | same | Holds for the same reason. The card's own date: run forward 1 day before it, nothing is due, except the B17 cases below |
| B3 label "Complete" while a later dose is coming | dose label | **0** cards (STOP B already removed the false "Complete") |

## Findings

### F-1 (clinical). Ticking travel, lab worker or outbreak can push the 16-year MenACWY booster back about 5 years

**Answered and built 2026-11-18** (`decisions-2026-11-17-open-questions.md`, "The 16-year booster
 for travel, lab and outbreak"; branch `feature/2026-11-18-phase5-16y-booster-exposure`).

830 saved patients are told a later next MenACWY date than the same child with no box
ticked; 734 of them by more than 30 days (96 are 1 day, at 11 y). By risk: microbiologist
226, travel 214, outbreak 100, military+microbiologist 226, and asplenia, complement, HIV and
asplenia+travel 16 each. Ages 15 (392) and 16 (338).

Worked patient: born Jan 10, 2011, MenQuadfi Nov 1, 2025 (age 14 y 10 m), seen Nov 18, 2026.
- No box: **"Booster due at 16y", Jan 10, 2027.**
- Travel: "Booster (dose 2, first booster, 5 years after the primary dose)", **Nov 1, 2030.**
- Outbreak: "Booster (dose 2) if outbreak risk continues", **Nov 1, 2030**. On the 16th birthday
  the same outbreak card switches to "1 dose (routine booster at ≥16y still owed)", due. The app
  contradicts itself (found by the run-forward check, B17).
- A traveler who gets the 16-year dose anyway (doses at 15 y and 16 y): the 16-year dose reads
  "too soon and does not count" ("boosters for travel or laboratory exposure must be spaced
  ≥5 years"). A healthy child's same dose counts.

Sources, read live 2026-11-18:
- ACIP 2020 (RR-9) Table 2, routine: *"Booster: 1 dose at age 16 yrs if first dose administered
  before 16th birthday"*; footnote *"If only 1 dose of vaccine was administered before the 16th
  birthday, a booster dose should be administered"*. No exception for increased risk.
- ACIP 2020 Tables 7–9 (microbiologists, outbreak, travel), aged ≥7: *"Single dose at 5 yrs after
  primary vaccination and every 5 yrs thereafter"* (outbreak: *"Single dose if ≥5 yrs since
  vaccination"*). They do not say they replace the 16-year dose.
- CDC child/adolescent notes (updated July 1, 2025), MenACWY given before age 10: children
  "for whom boosters are recommended because of an ongoing increased risk" follow the
  increased-risk booster schedule (its examples: complement deficiency, HIV, asplenia); "a healthy
  child who received a single dose for travel" follows the adolescent schedule (11–12 and 16).
- ACIP 2020 text, high-risk: *"a child with HIV infection who received MenACWY at age 9 years
  should receive the next dose at age 14 years"*, so for the high-risk group the increased-risk
  schedule does replace the routine one, even when that is later.

### F-2 (wording / status, B4 + B5). A 13–15-year-old's first MenACWY is called "routine, 11–12y"

Healthy 15 y, no MenACWY: "Dose 1 (routine, 11–12y)", badge "Dose due today, future boosters
needed", lead *"The routine adolescent dose, given at 11–12 years."* (216 cards name 11–12 for a
15-year-old). CDC notes, catch-up: *"Age 13–15 years: 1 dose now and booster at age 16–18 years
(minimum interval: 8 weeks)."* PneumoVax calls a patient past the routine age "Catch-up".
MeningoVax already says "Catch-up" at 16–21 y.

### F-3 (B3 badge style; Phase 6). "Up to date" while a dated dose is still to come

5,292 cards (mostly boosters 3–5 years away; also MenACWY high-risk dose 2 waiting its 8 weeks,
42 routine 16-year boosters). PneumoVax never says "Up to date" mid-series. Ask with Phase 6.1.

### F-4 (A5 + A17). A too-soon dose line never says when to repeat it

E.g. *"Not counted — repeat. Given only ~3 weeks after the previous dose. MenACWY doses must be at
least 8 weeks apart. This dose does not count toward the series: repeat this dose only (do not
restart the series)."* No date. PneumoVax adds "Next dose from <date> at the earliest" (the card
holds the due date). The saved-answer files hold no per-dose date, so A17 (two dates for a
too-soon dose) has nothing to store until A5 is decided. Ask.

### F-5 (minor wording). Two labels for the routine 16-year booster

Before it is due: "Booster due at 16y" (no dose number); on the day: "Booster (16y)" (dose 2).
Same dose, same date (B17 run-forward: 546 + 364 + 182 cards differ in label only). Phase 6.

### F-6 (listed, not asked). An outbreak contact over 21 is told a "routine booster" is owed

On `main` before this work: an A/C/W/Y outbreak contact aged 22+ with only a dose before 16 sees
"1 dose (routine booster at ≥16y still owed)", due. A healthy 24-year-old is "Not routinely
indicated". The dose is due either way (the outbreak booster is past its 5 years), so only the
label is wrong. Travel and lab were kept out of this (through 21 only).
