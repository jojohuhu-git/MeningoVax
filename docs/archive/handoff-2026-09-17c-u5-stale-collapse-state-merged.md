# MeningoVax — Handoff after U5, the blank-card bug (2026-09-17)

Repo: `~/Downloads/MeningoVax-main`. Live: https://jojohuhu-git.github.io/MeningoVax/
Standalone client-side meningococcal advisor (MenACWY + MenB + pentavalent). No
backend. Sibling of vaxapp/PediVax and PneumoVax.

Branch: `main`, clean, in sync with `origin/main` at **`9c04ae5`**.
**MERGED 2026-09-17** — PR #34, squashed, branch deleted. Both the `Tests` and
`Deploy to GitHub Pages` runs on `main` are green.

Baseline at the start of this session was **1198 passing (98 files)**; `main` is
now **1201 passing (99 files), 0 failing** — the three new tests are the whole
difference.

This handoff **supersedes** `handoff-2026-09-17b-copy-block-u2-u3-u4-merged.md`.

## A baseline number to correct

The task that opened this session quoted "1192 passing as of PR #32". That
figure matches nothing in the history and should not be carried forward. Verified
by running the suite at each commit:

- `b57915e` (before PR #32) — **951 passing, 97 files**
- `91d7136` (PR #32 merged) — **1198 passing, 98 files**

PR #32 added `regression-u1-note-lead-and-detail.test.js`, which is parameterized
over every rec the engine can produce and contributes **245** tests on its own.
That is where the jump came from. Use 1201 as the current number.

## What's done (by item ID)

1. **U5** — a rec card that stopped being collapsible *while already on screen*
   rendered its header and nothing else. Reproduction: a 2-month-old with
   asplenia; the MenB card correctly reads "Not yet age-eligible" and sits
   collapsed (D5 folds up cards with nothing to do). Press **"Adjust age"**, set
   the age to 16, and the MenB card turns due — and goes blank. Title and status
   pill only: no dose label, no brands, no booster line, no note, and no chevron
   to open it with. Reloading the same patient rendered it correctly.

   Cause, in `src/components/RecCard.jsx`: `useState(!collapsible)` decided once,
   at mount, whether the card was open, and never re-checked. A quiet card mounts
   collapsible, so `expanded` starts `false`. When the props made that same
   mounted card due, `collapsible` flipped `true → false`, the header swapped its
   toggle **button** for a plain unclickable row, and `expanded` was stranded at
   `false` with nothing left that could set it true. The body is gated on
   `expanded`, so it never drew. The line dates from **PR #4** — this is not a
   recent regression, and it is only reachable by changing age or risks from the
   results page, which is exactly what "Adjust age" invites.

   Fix: derive what is SHOWN from `collapsible`, which is recomputed from current
   props every render — `const showBody = !collapsible || expanded;` — so a card
   with no toggle is always shown and the broken "not collapsible but not
   expanded" state is unreachable. `expanded` still holds the clinician's own
   choice and is read only while the toggle exists, so this is deliberately NOT a
   reset-on-every-prop-change: a quiet card somebody folded up stays folded
   through unrelated re-renders. The old `collapsible && !expanded` collapsed-class
   condition is exactly `!showBody`, so the compact row is byte-for-byte unchanged.

   Files: `src/components/RecCard.jsx`,
   `src/components/__tests__/regression-u5-card-body-follows-collapsible-ui.test.jsx`.
   Commit `9c04ae5` (PR #34).

### The three regression tests

They re-render **one mounted card** across a props change, which is the only way
to catch this class of bug — a fresh `render()` per case would pass on the broken
code:

1. quiet → due shows the body. **Fails on the pre-fix code** (`.rec-card-inner`
   is null); this is the repro.
2. due → quiet stays readable and can still be folded by its chevron. Passed
   before the fix too — it pins the direction that was never broken.
3. a deliberate expand survives an unrelated re-render. Also passed before — it
   is the guard against "fixing" this by resetting state on every prop change.

Tests 2 and 3 are deliberately not repros. They exist so a future rewrite cannot
trade one direction of the bug for the other.

### Verified in the running app, not just in tests

Walked the full reproduction twice — once against a dev server on this branch and
once against the **deployed** site after the merge, with the console open:

- 2 months + asplenia → MenB is the collapsed "Not yet age-eligible" row.
- "Adjust age" → 16 → MenB shows "Dose 1 of 3 (high-risk series)", Bexsero and
  Trumenba, the booster line, the note and its three citations.
- Age back to 0 → MenB folds back down, and its chevron still opens and closes it.
- No console errors.

### One related check, so this isn't a single-surface fix

`grep` for every `useState(` in `src/components` and `src/App.jsx` turns up only
two states seeded from props: the one fixed here, and `StepHistory.jsx:6`
(`useState(doses.length > 0 ? true : null)`). **StepHistory is not affected** —
its MenACWY and MenB instances live in two *different* conditional slots in
`App.jsx` (`step === 2` vs `step === 3`), so React unmounts one and mounts the
other and the state is re-seeded per vaccine. RecCard was the only occurrence.

No clinical rule changed. This was purely whether the card draws what the engine
had already decided.

## What's NOT done — the remaining queue

**None from this session.** U5 arrived as a single standalone item, not from an
audit queue file, and it is finished and merged.

Note for whoever picks up next: the primary checkout at
`~/Downloads/MeningoVax-main` is sitting on branch
`refactor/p2-1-intervals-one-place` at `6498b29` — that is **another session's**
in-flight work, untouched here and not part of U5.

## Why this is a good stopping point

One self-contained bug, reproduced, covered by a test that fails when the fix is
reverted, fixed, merged, deployed, and confirmed on the live site. Nothing is
half-done and nothing is blocked on an owner decision.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. Run `npx vitest run` — confirm **1201 passing (99 files)** before any new work.
3. No open owner decisions from this session.
4. Per-item workflow (`fix-queue` skill): reproduce → failing test first → fix →
   full suite green → drive the running app if the change is UI-observable →
   commit named by item ID.
5. Push policy: `main` is **not** protected here, but the habit is branch → PR →
   squash merge, and the owner confirmed that again this session.
