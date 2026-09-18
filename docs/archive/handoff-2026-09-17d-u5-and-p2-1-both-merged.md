# MeningoVax — Handoff after U5 and P2-1 both merged (2026-09-17)

Repo: `~/Downloads/MeningoVax-main`. Live: https://jojohuhu-git.github.io/MeningoVax/
Standalone client-side meningococcal advisor (MenACWY + MenB + pentavalent). No
backend. Sibling of vaxapp/PediVax and PneumoVax.

Branch: `main`, clean, in sync with `origin/main` at **`962d4e3`**.
`main` is **1232 passing (100 files), 0 failing** — verified by running the suite
on the merged tree, not by adding the two branches' numbers together.

**This file is the current one.** It supersedes BOTH
`handoff-2026-09-17c-u1-merged-p2-1-open.md` and
`handoff-2026-09-17c-u5-stale-collapse-state-merged.md`, which were written by
two sessions running in parallel and each describe a `main` that no longer
exists. Read this one.

## Why there were two "17c" handoffs

Two sessions worked this afternoon without knowing about each other, and both
followed the handoff rules correctly in isolation:

- one fixed **U5** (PR #34) and wrote `handoff-2026-09-17c-u5-...`
- one built **P2-1** (PR #33) and wrote `handoff-2026-09-17c-u1-merged-p2-1-open`

Both also added a "superseded" banner to the top of the *same* 17b handoff. Git
merged both banners without a textual conflict, so `handoff-2026-09-17b` briefly
carried two of them pointing at two different "current" files. That is cleaned up
below. If you are ever reconciling parallel sessions again: the merge being CLEAN
is not the same as the result being COHERENT.

## What's done (by item ID)

1. **U5 — MERGED, PR #34, squash `9c04ae5`.** A rec card that stopped being
   collapsible while already on screen rendered its header and nothing else.
   Repro: 2-month-old with asplenia → the MenB card correctly reads "Not yet
   age-eligible" and folds up (D5); press **"Adjust age"**, set 16, and the card
   turns due and goes blank — title and status pill over nothing, and no chevron
   to open it with. A reload rendered it correctly.

   `RecCard.jsx` did `useState(!collapsible)`, seeded once at mount and never
   re-checked. A quiet card mounts collapsible so `expanded` starts `false`; when
   the props made it due, `collapsible` flipped `true → false`, the header swapped
   its toggle **button** for a plain row, and `expanded` was stranded at `false`
   with nothing left able to set it true. From **PR #4** — not a recent regression.

   Fix: what is SHOWN is derived from `collapsible`, recomputed from current props
   every render — `const showBody = !collapsible || expanded;`. A card with no
   toggle is always shown, so the broken state is unreachable. `expanded` still
   holds the clinician's own choice and is read only while the toggle exists, so a
   card somebody deliberately folded stays folded. The old `collapsible &&
   !expanded` collapsed-class condition is exactly `!showBody`; the compact row is
   unchanged.

   **This closes the item the P2-1 handoff had filed as "found live, reported not
   fixed."** The task chip it mentions can be dismissed.

2. **P2-1 — MERGED, PR #33, squash `962d4e3`.** Vaccine intervals now live in one
   module, `src/logic/intervals.js`, instead of being hand-typed in the engine, the
   validator and the card prose separately. Reviewed before merge (see below).

### Why P2-1 was safe to merge — the evidence, not a vibe

Its CI ran on a base two commits behind, so U5 + P2-1 had never been tested
together. Before merging, the two were merged locally and the full suite run:
**1232 passing, 100 files, 0 failing**, matching exactly what `main` reports now.

- It **modifies or deletes no existing test** — the only test file it touches is
  the new `regression-p2-1-intervals-in-one-place.test.js`. All 1201 pre-existing
  tests, including every P0/P1/M clinical regression, still pass untouched. That
  is the repo's clinical contract, and it held.
- Every removed line is a hand-typed duplicate (`? 3 : 5`, `DAYS.weeks(8)`,
  `DAYS.weeks(12)`, `DAYS.weeks(4)`) or English prose restating a number, and each
  value matches the constant that replaced it.
- The module carries live-fetched CDC/ACIP quotes for the numbers it owns.

**`intervals.js` is deliberately PARTIAL.** Its own header lists the groups not
yet migrated. Treat it as a home to move things into, one group at a time with the
suite green in between — not as a finished inventory.

## What's NOT done — the remaining queue

- **P2-2** — the written roadmap for reusing `intervals.js` in vaxapp. Not a code
  change. Last item in `.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`.
- **The rest of the interval groups** — see the `intervals.js` header for the list.
- **Owed to PneumoVax** — U4's copy-style changes, under the cross-app parity rule.
  Not started.
- **vaxapp ports remain on HOLD.** vaxapp still has the P0-1 infant-interval bug at
  `recommendations.js:631,:633` and `scheduleRules.js:48,:50`, and the MenB dose-3
  defect. The two apps knowingly disagree until a separately authorised port.
- **`sweep-dose-counter.test.js`** (~lines 75–77) still carries its own copy of the
  chip-label rules.

## A baseline number to stop repeating

A task this session quoted "1192 passing as of PR #32". That matches nothing.
Verified by running the suite at each commit: `b57915e` (pre-#32) = **951 (97
files)**; `91d7136` (#32) = **1198 (98 files)**. The jump is PR #32's new
`regression-u1-note-lead-and-detail.test.js`, parameterized over every rec, worth
**245** tests alone. Current number is **1232**.

## Why this is a good stopping point

Two independent items are merged, deployed, and verified against a suite that was
actually run on the combined tree. The remaining queue is all deferred-by-choice
work, none of it blocking. No owner decision is outstanding.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. Run `npx vitest run` — confirm **1232 passing (100 files)** before new work.
3. No open owner decisions.
4. Per-item workflow (`fix-queue` skill): reproduce → failing test first → fix →
   full suite green → drive the running app if UI-observable → commit by item ID.
5. Push policy: `main` is **not** protected, but the habit is branch → PR → squash
   merge. Note that the automation in this session blocked `gh pr merge` as "merge
   without review" until the diff had actually been reviewed — reviewing first is
   both the rule and the path of least resistance.

## One housekeeping note

The primary checkout at `~/Downloads/MeningoVax-main` is still sitting on the now-
merged branch `refactor/p2-1-intervals-one-place`. The remote branch is deleted;
the local one could not be (it was checked out) and was deliberately left alone
rather than yanked out from under a possibly-live session. Whoever gets there
next: `git checkout main` there, then the stale local branch can go.
