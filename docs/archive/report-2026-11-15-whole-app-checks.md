# Report — the whole-app checks (port Phase 1.4), 2026-11-15

**What this is.** Phase 1.4 of the PneumoVax port (plan in PneumoVax:
`docs/archive/plan-2026-11-08-meningovax-port.md`). A tool now follows every made-up
patient down every road the app advises — give the dose on the date the card names,
look again, repeat, years ahead — and asks whether the app agrees **with itself**.
It cannot tell whether the app agrees with CDC: an app that was consistently wrong
would pass. That is Phase 1.5 (CDC's own test patients).

**Findings are listed, not fixed.** Nothing in the app changed in this step.

Run: `npm run whole-app` on branch `feature/2026-11-15-phase1-4-whole-app-checks`,
2026-11-15. 35,281 patients (17,580 saved-answer "grid" patients + 17,701 typical
patients), 1,056,247 screens followed, 51 seconds on 7 cores. Every number below is
**distinct patients**, grid / typical.

## The seven checks, at a glance

| # | Check | Faults (grid / typical) | In the test suite? |
|---|---|---|---|
| 1 | A dose given as advised is accepted | **1,146 / 117** | No — finding A |
| 2 | The plan holds (no "final dose" then another) | 0 / 0 | **Yes** |
| 3 | "Complete" means nothing more is coming | **2,552 / 1,616** | No — finding B |
| 4 | Pentavalent and the two separate shots end in the same place | 0 / 0 | **Yes** |
| 5 | The dose chip and the card agree | **3,613 / 140** | Partly — finding C stays out |
| 6 | Age lines are clean | 0 / **7** | Mostly — question E stays out |
| 7 | Stable over time | **260 / 113** | Mostly — finding D and B's other face stay out |

## Findings, by clinical family, one worked patient each

### A. Military or college-dorm box on a child under 16: the app asks for a dose it then refuses to count (check 1) — 1,146 / 117

This is Phase 0's **N9**, now broken down. The card asks for a MenACWY dose today; the
clinician gives it; the dose chip says it does not count; the card asks for it again —
the same day, for ever.

| Shape | Patients (grid / typical) |
|---|---|
| College dorm, 10–15 years, a MenACWY dose already on record: card "1 dose (booster at ≥16y)" | 702 / 83 |
| Military or college dorm, under 10: card "1 dose" | 444 / 34 |
| The same 11-year-olds when MenB is also due: the pentavalent offered, and its MenACWY half not counted | 280 / 0 |

**Worked patient (checked on screen, 2026-11-15, the running app):** born 05/10/2015
(11 years 6 months), "First-year college student living in a residence hall" ticked,
MenQuadfi on 09/01/2026 and MenQuadfi again today, 11/15/2026. The card reads
**"Booster due today — 1 dose (booster at ≥16y)… one dose is due now."** Today's dose
chip reads **"Off-window – repeat. Given at ~11 years 6 months, before the age-16 booster
window. Safe, but does not count toward the routine series — the routine booster is
still due at 16."** The card asks for exactly the dose the chip just set aside.

**Control (checked in the engine):** the same patient with no risk box and only the
09/01/2026 dose: card "Booster due at 16y", nothing asked today. The fault is only on the military/college path.

Code: `recommend.js` (military/college card) against `validate.js:543` and `:784`.
Owner question for Phase 3: what should the card say for a college-dorm or military
patient under 16 — nothing until 16, or a dose that counts? Either way, card and chip
must agree. (Clinical source to be read live before any change: `verify-clinical-source`.)

### B. "Complete" while another dose is still coming (check 3) — 2,552 / 1,616

The owner's rule (PneumoVax, 2026-11-01): *"Complete should only be used if no
additional doses/boosters are needed."* Each card below says Complete, then a later
visit asks for another dose of the same vaccine. Every one of them **warns in words**
(no card is silent), so this is about the status, not hidden information.

| Shape | Patients (grid / typical) |
|---|---|
| Healthy (or pregnancy), routine MenACWY dose given at 10–15: status Complete, label "Booster due at 16y", booster date shown; at 16 the booster is asked | 1,064 / 200 |
| Outbreak (ACWY): "Complete for this outbreak", then an "Outbreak top-up" asked 3 or 5 years later while the outbreak box is still ticked — though the card says a further dose is for a **new** outbreak | most of the 1,488 / 1,416 "text warned" |
| Military, a dose at 10–15: "Complete", then at 16 "1 dose (routine booster at ≥16y still owed)" (outbreak patients of this shape: 449 / 51, inside the row above) | 384 / 83 |

**Worked patient:** born 09/15/2007, outbreak (ACWY) ticked, MenQuadfi at 11 and at 16,
seen 09/15/2026. Card: **"Complete for this outbreak. The recorded dose covers this
outbreak. If the patient is identified as being at increased risk in another outbreak,
a single further dose is given once 5 years or more have passed since the last one."**
Seen again on 09/15/2028 with nothing new recorded, the same patient is asked for
"Outbreak top-up (dose 3)", due today (checked in the engine: 09/14/2028 still Complete,
09/15/2028 the top-up). The Complete card already carries that date as its next-dose
date. **Seen on screen 2026-11-15** (same patient, today's date): the header says
"Up to date"; opened, the card reads *"Complete for this outbreak · Next dose not yet
due – eligible Sep 15, 2028"* (`RecCard.jsx:475` prints that line for any card with a
next-dose date).

**The other face of the outbreak shape** is check 7's "card changed with no age line"
(260 / 108): the same patient's card turns from Complete to "Outbreak top-up" with no
birthday in between, on the 3- or 5-year clock alone.

Owner question for Phase 3: for an outbreak box that stays ticked, should the app ask
for the top-up (and then not say Complete), or say Complete and never ask?

### C. "Repeat this dose" on a chip where no card asks for that vaccine (check 5) — 3,613 / 140

Every rejected dose says *"does not count toward the series: repeat this dose only"*
(Phase 0 **A3**), even when nothing is owed. **Worked patient:** a healthy 1-year-old
with Bexsero recorded on the day of birth. Chip: *"Given at ~birth, below the minimum
age of 10 years… This dose does not count toward the series: repeat this dose only (do
not restart the series)."* Card: **"MenB: Not indicated."** Also seen beside "Complete
(2-dose series)", "Not yet age-eligible", "Defer during pregnancy", and a MenACWY
"Complete" (a MenQuadfi given at 3 weeks, before its 6-week minimum).

Already planned: Phase 6 (wording), with N11.

### D. An infant's next-dose date moves by one day (check 7) — 0 / 5

**Worked patient (reproduced in the engine):** born 12/15/2025, asplenia, MenQuadfi on
08/15/2026 (risk-at-dose answered yes). Viewed 09/15/2026: **"Dose 2 … eligible Dec 15,
2026"** (the first birthday). Viewed any day from 09/16/2026 to 12/14/2026: **"Dec 16,
2026"**. Same on the travel and outbreak infant series. On 12/15/2026 itself the card
does say due, so the later date is one day late. Small; listed for Phase 5 (dates).

### E. CDC's 4-day grace and which schedule applies (check 6) — 0 / 7 — a question, not a fault

A dose given 4 days before an age line that decides **which** schedule a child is on
reads differently from one given on the birthday: Menveo at 7 months (4-dose vs 2-dose
infant series), MenQuadfi or Menveo at 2 years (infant series vs a first booster),
MenQuadfi at 7 years (3- vs 5-year booster). Travel and outbreak only. The plan's rule
§3 already says *"The grace decides what is accepted, never what is advised"*, which this
behaviour follows — so probably no change. Listed so the owner can confirm.

## Listed for awareness, not faults

- **The risk-at-dose question on doses the app itself advised** (3,724 / 514). For a
  patient high-risk now, the app asks "was this patient at high risk when this dose was
  given?" about any dose before 10 (MenACWY) or 16 (MenB) — including a dose it
  advised for that risk. Owner-confirmed design (2026-07-23). The walk answers yes.
- **What each age line changes** (4,165 / 1,658): the cards move at 2, 7, 12, 24 months
  and 10, 11, 16, 19, 22, 24 years, as their rules say.
- **Where the grace ends** (0 / 97): a dose 5 days early vs 4 days early. Expected.
- **A method artefact, not the app** (280 / 0): moving the date of birth a day to test a
  birthday also moves the age at an OLD dose by a day; MenB doses exactly 5 days before
  the 10th birthday then cross the grace edge. Named apart so it is not mistaken for a fault.

## How the checks were proved to work

Each check that reads zero today was made to fail by breaking the app on purpose, then
the break was undone (`git checkout`). The test file `whole-app-gate.test.js` went red
for every one:

| Break (temporary) | What went red |
|---|---|
| High-risk MenB dose 2 labelled "Dose 2 of 2" | check 2 (4,674 typical) |
| A pentavalent no longer counted as a MenB dose | check 4 (10,635 typical) |
| High-risk MenB dose 3 labelled "Dose 4 of 4" | checks 2 and 5 |
| "Booster not yet due" date shown 40 days after the 16th birthday | check 5 (200 typical) |
| Routine MenACWY not due ON the 11th birthday | check 6 (15 typical) |
| An age-minimum dose given ON the birthday rejected | checks 4 and 6 (three parts) |
| The before-10 MenACWY rule reads today's age instead of the age at the dose | checks 6 and 7 |
| Healthy MenB dose 2 due only the day after the date the card names | check 7 (5,187 typical) |

The last break first got through: the check accepted a card reading *"Next dose not yet
due – eligible [today]"* on the advised day. The check was tightened (the card must say
**due today**) and then caught it.

Mistakes in the tool caught while building it, each fixed before these numbers:
1. Walking every interleaving of two separately dated vaccines: 1.65 million screens for
   1 patient in 100. Now only the earliest-dated doses are followed (later ones reappear).
2. Counting a dose that is valid but "not counted toward the adolescent/healthy series"
   as counted: 5,055 false "dose number" flags. Now counted the way the chips are.
3. The grace-edge artefact above.
4. The "eligible today" hole above.

## What is not covered

- The walk gives the first MenACWY brand a card lists; the other brands are tried on
  the first screen only (finding A's "listed brand" rows come from that).
- Patients are followed to 25 years of age or 6 years from today, whichever is later.
- An optional (shared-decision) MenB dose, once declined, stays declined on that road.
- These checks say nothing about whether the app matches CDC. Phase 1.5 does.
