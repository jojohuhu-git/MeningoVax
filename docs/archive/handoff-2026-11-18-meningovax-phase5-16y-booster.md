> **SUPERSEDED 2026-11-18** by `handoff-2026-11-18-meningovax-phase5-f2-f4-f6.md`. PR #104 merged; F-2, F-4 and F-6 asked and built (PR #105). Do not resume from this file.

# MeningoVax port — Handoff after Phase 5.1 was measured and the 16-year booster built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 5"). **Supersedes**
`handoff-2026-11-18-meningovax-phase5-gap-badge.md`.

## State (verified 2026-11-18)

- Gap badge PR #103 is merged (`main` at `174c03b`; 2,053 passed / 164 files, re-run today).
- Branch `feature/2026-11-18-phase5-16y-booster-exposure` off `main`, commit `8f8ff89` plus this
  handoff. Pushed, PR open against `main`, waiting for the owner (owner merges).
- Now **2,089 passed, 0 failing (165 files)**.

## What's done

1. **Phase 5.1 measured** over the 18,780 saved patients and 24,600 screens:
   `docs/archive/report-2026-11-18-phase5-measured.md`. Clean: B6 (one date format), A6 and A13
   (dose lines print no next-dose date at all), B3's "Complete" label. Findings F-1 to F-6.
2. **F-1 asked and answered** (owner, 2026-11-18; decision log "The 16-year booster for travel,
   lab and outbreak"). The first, long version of the question was too hard to follow; the
   re-asked one (Maya, 15, one dose at 14 for travel: 2030 vs her 16th birthday) worked. Owner
   added: 5-year boosters only when the primary was completed at 7 or older (3 then 5 before 7).
3. `8f8ff89` **Built.** `routineSixteenBoosterOwed` / `routineSixteenBoosterCard` in
   `recommend.js`, used by the travel/lab and outbreak cards; `doseRules.js`
   ACWY-TRAVEL-BOOSTER-GAP exempts the travel/lab 16-year dose (as it already did for outbreak).
   Under 16 only after a dose at 10+; travel/lab only through 21. Asplenia/complement/HIV
   unchanged.
   - Measured vs `main`: saved answers 846 of 18,780 real moved (702 earlier, 144 relabelled while
     already due, none later), 63 of 5,820 impossible; prose 909 of 24,600; CDSI NEW 0, 0 moved;
     whole-app identical except check 6 +3 typical (a real 4-day near-tie, explained in the PR).
   - Tests: `regression-2026-11-18-phase5-16y-booster-exposure.test.js` (15); sweep property 15
     (714 visits; 270 violations with the fix removed). `c5-note-citations` L2-3 fixture moved
     from 17 to 23 years (a 17-year-old with a dose at 11 now gets the 16-year booster first).
   - Live-checked (Maya, travel: "Booster due at 16y", Jan 10, 2027). No console errors.
   - Parity: meningococcal logic lives only here; `dateUtils.js` untouched; PneumoVax unaffected.

## What's NOT done

**Owner action first:** review and merge this PR.

**Phase 5.1 questions still to ask (measured, in the report):**
- **F-2 (B4 + B5):** a healthy 13–15-year-old's first MenACWY is "Dose 1 (routine, 11–12y)" with
  *"The routine adolescent dose, given at 11–12 years."* (216 cards). CDC: *"Age 13–15 years: 1
  dose now and booster at age 16–18 years"*. Proposal to bring: call it catch-up, as at 16–21.
  Measure the change on a prototype first.
- **F-4 (A5 + A17):** a too-soon dose line ("Not counted — repeat") gives no date for the repeat;
  PneumoVax adds "Next dose from <date> at the earliest". A17 (two dates in the saved answers)
  waits on this answer.
- **F-6 (new, listed):** an outbreak contact aged 22+ with only a dose before 16 is told a
  "routine booster at ≥16y" is owed (on `main` before this work). Label only; the dose is due
  either way. Ask whether to limit it to through 21, like travel/lab now.

**For Phase 6 (wording):** F-3 ("Up to date" on 5,292 cards with a dated dose still coming;
PneumoVax's type-badge style), F-5 ("Booster due at 16y" vs "Booster (16y)" for one dose).

**Carried over (not fixed):** MenB booster note "1 year after the primary series" on later boosters
(date right, sentence wrong); MenB "every 2–3 years" advises 2; whole-app check 5's 2,977 / 20
are a checker gap (`asksOn` doesn't know Q11); Phase 4 A2 colours, A10, A11, A16; healthy 12 y
too-young Bexsero "repeat"; CDC 2024-0069, 2024-0034/0035, 2024-0040 (shared `dateUtils.js`).

## Why this is a good stopping point

The one clinical finding from the Phase 5 measurement is answered, built, measured against `main`
on every tool, documented in the same commit and live-checked. The remaining Phase 5 items are
questions, each independent of this change.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr list --state all --head feature/2026-11-18-phase5-16y-booster-exposure`.
   If merged: `git checkout main && git pull --ff-only`; `npm test` should give **2,089 passed,
   165 files**. If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Ask F-2, then F-4, then F-6: one patient per question box, 3–5 short sentences, the proposal
   for each group on its own line (memory `clinical-questions-issue-sources-recommendation-examples`).
   Prototype and measure before stating consequences.
4. For any change: failing test → change → `npm run sweep:update` (explain every moved answer),
   prose diff, CDSI, whole-app on both → docs in the same commit → live check.
5. Branch + PR against `main`; the owner merges. Put the handoff in this folder, in the same PR.
