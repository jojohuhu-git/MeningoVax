# MeningoVax port — Handoff after the two Q9a consequences (F2a, F2b) were built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 5"). **Supersedes**
`handoff-2026-11-17-meningovax-phase5-q9-built.md`.

## State (verified 2026-11-18)

- Phase 5 STOP F1 PR #101 is merged (`main` at `9034332`, 2,034 passed / 161 files, re-run today).
- Branch `feature/2026-11-18-phase5-q9a-consequences` off `main`. Pushed, PR open against `main`,
  waiting for the owner (owner merges; MeningoVax `main` has no required check).
- Now **2,047 passed, 0 failing (163 files)**.

## What's done

1. **F2a and F2b asked and answered** (owner, 2026-11-18). Recorded in
   `decisions-2026-11-17-open-questions.md` ("Q9a consequences"), with the quotes read live today.
2. `3f2c5d9` **Built.**
   - F2a: the combined shot is offered while high-risk MenB dose 2 is past its 4-week minimum
     but before its 1-month date, if MenACWY is due. The card carries `canGiveToday`
     (`recommend.js`, `rec()` and the dose-2 branch). The pentavalent gate reads "due or can be
     given today". The panel says *"MenACWY is due today; MenB dose 2 can be given today (its
     4-week minimum has passed)…"*. The summary line in `Results.jsx` never calls MenB due on
     those days.
   - F2b: the switch line (`withMenbSwitchLine`) says "dose 2 due <date>", never "from".
   - Tests: `regression-2026-11-18-phase5-q9a-consequences.test.js`,
     `regression-2026-11-18-phase5-pentavalent-in-gap-ui.test.jsx`. The D8 test was updated to
     "due". New `sweep-never-events.test.js` **property 14** (352 visits, 16 in the gap). It finds
     8 violations, and 3 F2a tests fail, when the old gate is put back (checked).
   - Measured vs `main`: saved answers 0 of 5,820 moved. Prose 0 of 24,600: the saved grid has
     **no** gap-day or mixed-product patient, so only the tests and property 14 cover these changes.
     CDSI: NEW 0, OPEN 4, 0 moved. Whole-app checks: identical.
   - Live-checked both (Bexsero 10/20/26 seen 11/18: Option 2 Penmenvy plus the new summary line;
     Bexsero 8/1 + Trumenba 10/20: "dose 2 due Nov 20, 2026"). No console errors.
   - Docs in the same commit: `CLAUDE.md` (pentavalent rule), `clinical-rules.md`,
     `meningococcal-rules-summary.md`, `testing.md` counts, and the plan.

## What's NOT done

**Owner action first:** review and merge this PR.

**New finding (listed, not fixed; ask):** in the gap, the MenB card sits under "Option 1: Two
separate injections (MenACWY + MenB)" with the badge **"Up to date"**. The badge was already there
on those days after Q9a. It is now more jarring beside an option that gives MenB. This is a wording
question (Phase 4 one label per dose / 5.1 B4), so ask; don't change it alone.

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
  (`scripts/wholeApp/checks.mjs`, `asksOn`) doesn't know Q11's rule yet. That's a checker fix,
  not a clinical one.
- From Phase 4: A2 colours, A10, A11, A16; a healthy 12 y too-young Bexsero reads "repeat";
  Phase 6 wording items. Older: CDC 2024-0069 (unknown MenB product at 16+), healthy MenB rescue
  dose 3 (2024-0034/0035), the 1-day calendar difference (2024-0040, shared with PneumoVax
  `dateUtils.js`).

## Why this is a good stopping point

Both owner questions left by Q9a are answered, built, measured against `main`, documented in the
same commit and live-checked. Nothing else in Phase 5 waits on them.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr list --state all --head feature/2026-11-18-phase5-q9a-consequences`.
   If merged: `git checkout main && git pull --ff-only`; `npm test` should give **2,047 passed,
   163 files**. If it's not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Ask about the "Up to date" badge in the gap: one patient, the screen, and the proposal
   (memory `clinical-questions-issue-sources-recommendation-examples`; measure first).
4. Then measure B3–B6, B17, A5, A6, A13 and A17, one at a time. For any rule change: failing test →
   change → `npm run sweep:update`, then a prose diff against a `main` worktree, CDSI
   `--save-answers`, and whole-app on both → docs in the same commit → live check.
5. Branch + PR against `main`; the owner merges. Put the handoff in this folder, in the same PR.
