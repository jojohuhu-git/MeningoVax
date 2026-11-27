# Report: Phase 9, closing the PneumoVax port (2026-11-27)

**STATUS: DONE.** One fault found and fixed (PHASE9-D, PR #168, merged). Everything else the
checks flag follows a recorded owner decision. One gap in the shared-module notes was filled.
The plan (`plan-2026-11-08-meningovax-port.md`) is marked finished.

Phase 9 has three parts (plan, "Phase 9: Close"):

- 9.1: re-run every whole-app check, then do a live check of ordinary patients near each age
  line against CDC's own sentences.
- 9.2: check that the `vaccine-parity` skill and both `CLAUDE.md` files name the shared rules.
- 9.3: handoff, and mark the plan finished.

Baseline on arrival: `main` at `565523a`, **2,761 passing, 0 failing (238 files)**, the
handoff's own number. After #168: **2,769 passing, 0 failing (239 files)**.

## 9.1a: Every whole-app check, run again

`npm run whole-app`: 41,489 patients, 948,069 screens, 7 min 54 s. Counts are distinct
patients, saved-answer grid / typical.

| # | Check | 2026-11-15 | 2026-11-27 |
|---|---|---|---|
| 1 | A dose given as advised is accepted | 1,146 / 117 | **0 / 0** |
| 2 | The plan holds | 0 / 0 | 0 / 0 |
| 3 | "Complete" means nothing more is coming | 2,552 / 1,616 | 2,187 / 796 (all owner-decided, below) |
| 4 | Pentavalent and the two shots end in the same place | 0 / 0 | 0 / 0 |
| 5 | The dose chip and the card agree | 3,613 / 140 | **0 / 0** |
| 6 | Age lines are clean | 0 / 7 | 0 / 28 (all owner-decided or expected, below) |
| 7 | Stable over time | 260 / 113 | 920 / 233, of which **5 were a real fault, now 0** |

**The one real fault, PHASE9-D (finding D of 2026-11-15, never fixed until now).** An asplenia
baby born Dec 15, 2025 with MenQuadfi on Aug 15, 2026 was told "Next dose due Dec 15, 2026" if
seen on Sep 15, but "Dec 16, 2026" if seen any day from Sep 16 to Dec 14. On Dec 15 the same
card says the dose is due, so Dec 16 was a day late. The app worked out "turns 12 months" from
today's age in fractions of a month, rounded up. It now reads the birthday. Fixed in #168:
saved answers 0 of 7,372 moved, wording 0 of 31,160 patients, check 7's "advised date moved" 5
→ 0, and that check now sits in `whole-app-gate.test.js`. Checked live: "Next dose due Dec 15,
2026".

**What is left, and the ruling behind each:**

| Group | Patients (grid / typical) | Why it is not a fault |
|---|---|---|
| Check 3 and check 7: college card "Complete (dose given at ≥16y)" turns to "1 dose" 5 years after that dose | 2,187 / 796 and 432 / 96 | Owner D1 (2026-11-17): a dose at 16 or older covers college entry for 5 years. Owner D9: "Complete" stays, and the 5 years is checked once, at college entry. The walk keeps the box checked for years, which a real first-year student would not. The card states the 5 years in words. |
| Check 7: outbreak card "… if outbreak risk continues" becomes "… for this outbreak" on the day the booster falls due | 220+8 / 48+48 (A/C/W/Y); 156+144 / 34+1 (B); 0 / 1 | Recorded design, `clinical-rules.md` line 418: the label gains "for this outbreak" when due today (owner D7 wording, B-2). |
| Check 6: Bexsero or Trumenba 1–4 days before 24 years reads differently from one on the 24th birthday | 0 / 24 | 24 is where shared decision-making ends ("age 16–23 years"). The 4-day grace applies to minimum ages, never to an upper one. A dose at 23 counts; a dose at 24 is "Not counted: extra". |
| Check 6: MenACWY 1–4 days before 7 years (travel) | 0 / 1 | Owner D11 (2026-11-17): age 7 is not a grace line; a primary finished before 7 keeps the 3-year first booster. |
| Check 6: MenACWY 1–4 days before 11 years (outbreak, travel, microbiologist) | 0 / 3 | 11 is not a grace line (owner B-1: grace only at 3 months, 7 months, 2 years and 16 years, and only where it means fewer doses). A dose at 10 is followed by a booster 5 years after it; a dose at 11 by the routine one at 16. The two dates are days apart. |

The "(info)" rows (risk-at-dose question on advised doses; what each age line changes; a
method artefact at the grace edge) are lists, not faults, as on 2026-11-15.

**CDC's CDSI test patients** (`npx vite-node scripts/cdsi/runTestCases.mjs`): 104 patients, 72
agree in full, **0 new disagreements**. Every other one sits in a named family (deliberate,
owner-decided, or wording only). **CDSI rule comparison**: 71 agree, 3 follow CDC/ACIP wording,
9 owner-decided, 0 unaccounted for, 0 CDSI rules changed since saved.

## 9.1b: Ordinary patients near each age line, against CDC's own sentences

The plan's E6, the MeningoVax version of PneumoVax's #143. New script:
`scripts/ageLineAudit/meningoLines.mjs` (run `npx vite-node scripts/ageLineAudit/meningoLines.mjs`,
add `--rows` for every patient). It is a one-off check like PneumoVax's, not part of `npm test`.

**CDC read live, 2026-11-27**, in the browser pane with "Expand All" clicked: Child/Adolescent
Schedule Notes (61,564 characters; closed, about 9,000) and Adult Schedule Notes (42,003). Both
pages carry CDC's notice that, under the March 16, 2026 court order in *AAP et al. v. Kennedy et
al.*, **the July 2, 2025 schedule is the current one**. That is the version the app already
quotes. The sentences used are written at the top of the script.

**Patients:** 93 ordinary patients 7, 14 and 30 days either side of each line. Each states
CDC's answer by itself (due today, a later date, an option, or nothing; the series total where
CDC states one; whether Penbraya/Penmenvy is offered). The app's cards are then compared with
it.

| Line | Patients |
|---|---|
| 11 years, healthy, no doses (routine starts) | 6 |
| 16 years, healthy, no doses (13–15 "1 dose now and booster" vs 16–18 "1 dose") | 6 |
| 16 years, healthy, dose at 11 (booster at 16) | 6 |
| 19 years and 22 years, healthy, dose at 11 only (16–18 catch-up; ACIP's 19–21 option) | 12 |
| College student, the dose either side of 16 | 6 |
| 2, 3, 7 and 24 months, asplenia, no doses (the infant bands) | 22 |
| 2 and 24 months, travel, no doses | 11 |
| 12 months, asplenia, dose 1 at 8 months ("after age 12 months") | 6 |
| 10 years, asplenia (MenB minimum age; Penbraya) | 6 |
| 16 and 24 years, healthy, MenB (shared decision 16–23) | 12 |

**Result: 93 of 93 agree.** Plus: **all 16 CDC quotes the app shows** (13 from the child page, 3
from the adult page) were found word for word on the live pages.

**Proving the check can fail.** The app was broken one line at a time in a copy of `ages.js`,
then restored from a saved copy (not from git; `git diff` empty afterwards):

| Break | Patients flagged |
|---|---|
| Routine MenACWY from 11 → 12 years | 3 |
| Routine booster at 16 → 17 years | 15 |
| MenB shared decision ends at 24 → 25 years | 3 |
| MenB shared decision starts at 16 → 15 years | 9 |
| Infant band 7 → 8 months | 3 |
| Infant series ends at 24 → 25 months | 3 |
| Final infant dose 12 → 13 months | 6 |
| 19–21 catch-up ends at 22 → 23 years | 3 |
| 19–21 catch-up starts at 19 → 20 years | 3 |
| Schedule minimum age 2 → 3 months | 12 |
| **Infant band 3 → 4 months** | **0** |

**The 3-month break was not flagged, and none of the 93 patients could flag it.** Traced: since
owner T1 (2026-11-19, a dose 2 at 7 months or older finishes the series in 3 doses, 2-month
starts included, as CDSI has it), the 3-month line no longer changes any total or date. Probed
directly: dose 1 at 2 m 10 d or at 3 m 10 d gives the same card ("Dose 3 (infant high-risk
series)" of 4 after a dose 2 at 4–5 months; "Dose 3 of 3" due Jan 10, 2027 after a dose 2 at 7
months). With the break, the full suite fails only two rulebook-wording tests, which print the
number. That is a description of the rules, not a fault: CDC's "3- or 4- dose series" for a 3–6
month start allows either. Listed so the owner knows the line is now wording only.

**Things that looked wrong and are not** (each traced to a recorded ruling):

1. **A 7-week-old asplenia baby's card lists MenQuadfi**, though CDC's notes give MenQuadfi a
   minimum age of 2 years. Owner R10/R96 (2026-11-20) and MQ6 (2026-11-21): AAP 2026 lists
   MenQuadfi from 6 weeks, and where AAP and CDC disagree, AAP governs. Brands were therefore
   not graded for infants.
2. **A 4-week-old's card says "Not yet due (from 2 months)" with no date.** Owner MQ6: the dated
   card starts at day 42, when MenQuadfi could be given. Same advice, named by age. The script
   accepts it.
3. **A healthy 19–21-year-old with only an age-11 dose is offered a catch-up MenACWY**, which
   CDC's notes (child notes end at 18) do not state. ACIP 2020: "Persons aged 19–21 years who
   have not received a dose after their 16th birthday can receive a single MenACWY dose as part
   of catch-up vaccination". The card is a "catch-up" option, not "due", and ends at 22.

**What this does not cover:** boosters (CDC's notes send readers to the 2020 MMWR for them;
covered by the whole-app checks and the CDSI patients), outbreak and military, dose-counting at
a line (the 1–4-day grace was covered by B-1 and its tests), and patients without a date of
birth.

## 9.2: Shared rules named in the parity skill and both CLAUDE.md files

| Shared piece | Skill | MeningoVax CLAUDE.md | PneumoVax CLAUDE.md | Guard test | Code equal today |
|---|---|---|---|---|---|
| `dateUtils.js` | yes | yes | yes | yes (in PneumoVax) | yes (comments aside) |
| Transplant hard stop (wording byte-identical) | yes | yes | yes | yes (both repos) | yes |
| Clinical authority (ACIP/CDC/AAP over FDA; AAP the tiebreak) | yes | yes | yes | n/a | n/a |
| **`ageEntry.js`** (date-of-birth messages, owner E2 2026-11-26 "Both apps") | **added today** | **added today** | **not yet** | **none** | yes, against PneumoVax `main` |

**Gap found and partly filled.** `ageEntry.js` became shared on 2026-11-26 (E2), but nothing
named it. Today it is named in the `vaccine-parity` skill and in MeningoVax's `CLAUDE.md`. Two
pieces are left for a PneumoVax session, because they are PneumoVax changes:

- a line in PneumoVax's `CLAUDE.md`, beside "dateUtils.js Is Mirror-Synced";
- a guard test beside the `dateUtils.js` one (`regression-s6-4-…`), comparing the two copies
  comments aside.

**This machine's PneumoVax folder is on an old branch** (`chore/2026-11-17-remove-dead-undated-code`,
2 commits behind its remote) and still shows the two em dashes E2 removed. PneumoVax's `main`
on GitHub has the change (#164). A guard written today would fail on that stale folder, so the
next PneumoVax session should switch to `main` and pull first.
