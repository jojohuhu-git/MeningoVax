# MeningoVax port — Handoff after the gap badge was built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 5"). **Supersedes**
`handoff-2026-11-18-meningovax-phase5-f2-built.md`.

## State (verified 2026-11-18)

- F2a/F2b PR #102 is merged (`main` at `6e1ecb0`; 2,047 passed / 163 files, re-run today).
- Branch `feature/2026-11-18-phase5-gap-badge` off `main`, commit `45db102` plus this handoff.
  Pushed, PR open against `main`, waiting for the owner (owner merges; MeningoVax `main` has no
  required check).
- Now **2,053 passed, 0 failing (164 files)**.

## What's done

1. **Gap badge asked and answered** (owner, 2026-11-18). Recorded in
   `decisions-2026-11-17-open-questions.md` ("Gap badge"). She asked twice for more before
   answering: what PneumoVax does (type badge Routine / Catch-up / Risk-Based, plus a "Today" tag
   only when DUE; no tag on a gap day), and the difference between "Today" (due: give it) and "can
   be given today" (not due; allowed, and it counts).
2. `45db102` **Built.** On the days when high-risk MenB dose 2 is past its 4-week minimum but
   before its 1-month date, the MenB badge reads **"Can be given today"** (was "Up to date"), with
   or without MenACWY due. `statusPillLabel` in `RecCard.jsx` (now exported) reads the card's
   `canGiveToday`. Day before / due day unchanged. Card colour unchanged (grey).
   - Tests: `regression-2026-11-18-phase5-gap-badge.test.jsx` (4 of 6 fail with the fix removed);
     `sweep-never-events.test.js` property 14 now checks the badge on every visit (16 violations
     with the fix removed; checked).
   - Measured vs `main`: engine untouched; prose 0 of 24,600 screens moved (no saved patient is
     on a gap day). Live-checked (asplenia, 20 y, Bexsero 10/20/26, seen 11/18). No console errors.
   - Docs in the same commit: `clinical-rules.md`, `meningococcal-rules-summary.md`, `testing.md`
     counts, the decision log, the plan.

## What's NOT done

**Owner action first:** review and merge this PR.

**Found while measuring (listed, not asked; for Phase 6):** about 6,300 saved-grid cards read
"Up to date" while a dated dose or booster is still to come (boosters, MenACWY high-risk dose 2
waiting its 8 weeks, infant series). PneumoVax never says "Up to date" mid-series. This is the
PneumoVax badge style question; measure it and ask in Phase 6.1 (owner wants wording to match
PneumoVax eventually; memory `meningovax-wording-should-match-pneumovax`).

**Phase 5.1 items not yet measured or built:** B3 (Complete only when nothing owed), B4 (Routine vs
Catch-up), B5 (a card never advises an age already passed), B6 (one date format), B17 (a line about
a later age is the app run forward), A5/A6 (dose-line next-dose wording; never promise a date no
card asks for), A13 (grace never advised: held for Q9, not swept), A17 (two dates for a too-soon
dose in the saved answers).

**Listed findings carried over (not fixed):**
- Every high-risk MenB booster after the first says "1 year after the primary series was
  completed" (`recommend.js`, MenB booster note lead). The date is correct (2 years); the
  sentence is wrong.
- MenB booster "every 2–3 years": the card advises 2 years (a range, not routine vs minimum).
- Whole-app check 5's 2,977 grid / 20 typical flags are all cards that ask LATER. The checker
  (`scripts/wholeApp/checks.mjs`, `asksOn`) doesn't know Q11's rule yet. Checker fix, not clinical.
- From Phase 4: A2 colours, A10, A11, A16; a healthy 12 y too-young Bexsero reads "repeat";
  Phase 6 wording items. Older: CDC 2024-0069 (unknown MenB product at 16+), healthy MenB rescue
  dose 3 (2024-0034/0035), the 1-day calendar difference (2024-0040, shared with PneumoVax
  `dateUtils.js`).

## Why this is a good stopping point

The one finding the F2 handoff said to ask first is answered, built, measured, documented in the
same commit and live-checked. Nothing in the rest of Phase 5 waits on it.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr list --state all --head feature/2026-11-18-phase5-gap-badge`.
   If merged: `git checkout main && git pull --ff-only`; `npm test` should give **2,053 passed,
   164 files**. If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Measure B3–B6, B17, A5, A6, A13 and A17, one at a time. Any clinical or wording choice goes to
   the owner as one patient, the screen, the source, a recommendation (memory
   `clinical-questions-issue-sources-recommendation-examples`; measure first). For any change:
   failing test → change → `npm run sweep:update`, prose diff against `main`, CDSI
   `--save-answers` and whole-app on both if the engine moved → docs in the same commit → live check.
4. Branch + PR against `main`; the owner merges. Put the handoff in this folder, in the same PR.
