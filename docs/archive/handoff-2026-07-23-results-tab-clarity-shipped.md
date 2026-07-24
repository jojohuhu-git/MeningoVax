# MeningoVax — Handoff after implementing the Results-tab clarity redesign (2026-07-23)

> **SUPERSEDED (2026-07-24)** by
> `docs/archive/handoff-2026-07-24-c5-subscript-links-merged.md`. C5's subscript
> deep-link piece (this file's one open item) is now DONE and PR #6 (this whole redesign)
> is merged to `main` and deployed. Do not resume from this file; read the newer one.

**Supersedes `handoff-2026-07-23-results-tab-clarity-design.md`** (the design doc this
session implemented from) — that file's queue (C1–C5 + small copy items) is DONE except
one piece noted below. Do not resume from the design doc; resume from this file.

Branch: `design/results-tab-clarity`, off `main` at `9c758b8`. **NOT pushed** — MeningoVax
`main` is unprotected but the owner prefers branch → PR → squash-merge; ask before pushing
(per the design doc's own instruction). MeningoVax lives at `~/Downloads/MeningoVax-main`
(vite base `/MeningoVax/`, folder is **cloud-synced** — commit early, watch for silent
reversion). Live site: https://jojohuhu-git.github.io/MeningoVax/

Baseline was 303 passing tests (22 files); now **317 passing (22 files)**, all green,
working tree clean of code changes (only pre-existing doc diffs, same as session start) at
commit `9eec723`.

Core promise of this app: **honesty** — a badge/label that implies something is done or
safe when it isn't is the worst kind of bug.

## What's done (5 commits, one per item)

1. **C1** (`20e8a27`) — Removed the Results-tab color-key legend (button + panel) from
   `Results.jsx`. Every pill/chip now states its own meaning in words, so no key is needed.
2. **C2 + C4** (`5f87ef4`) — `recommend.js` now attaches `seriesTotal` (M, primary-series
   size only, boosters excluded) and `boosterSummary` (a short future-boosters
   count/cadence string) to every rec. `RecCard.jsx`'s recorded-dose chip merges the old
   two-chip "Counts" + "Effective dose N" into one green "Dose N of M" chip; a new
   "Boosters:" line renders `boosterSummary` in the card body. Also fixed
   "Off-window — repeat" → "Off-window - repeat" (hyphen, not em dash).
3. **C3** (`5399273`) — Replaced the terse `STATUS_LABELS` map (Due, Catch-up, Risk-Based,
   ...) with `statusPillLabel()` in `RecCard.jsx`, which states WHEN and WHAT (e.g. "Dose
   due today, future boosters needed", "Catch-up dose due today", "Future booster needed",
   "Optional today - shared decision"). Derived from `status`/`dueToday`/`boosterDueDate`/
   `boosterSummary` plus a `doseNum > seriesTotal` comparison — no new engine field needed.
4. **C5, partial** (`fd35eee`) — Reordered MenACWY's default citations so ACIP 2020 MMWR
   leads the CDC schedule-note summary (was CDC-first). Re-added `immMenACWY`/`immMenB`
   (immunize.org Ask the Experts) to `refs.js` — URLs verified live 2026-07-23 — and wired
   them as the leading citation on two "messy practical" recs: an unconfirmed-date prior
   MenACWY dose (college-dorm) and an interrupted/early MenB dose 2 (rescue-dose branch).
5. **Small copy items** (`9eec723`) — Deduped the redundant "Select one brand for this
   dose." helper (title already says "choose one"). Differentiated the two "not yet due"
   banners: `booster-due-banner` now reads "Booster not yet due - ~{date}",
   `next-date` reads "Next dose not yet due - eligible {date}" (both hyphen, not em dash).

Every item above was live-verified in the running app (dev server, not just tests) — see
this session's transcript for screenshots at each step.

## What's NOT done — the remaining queue

- **C5, subscript deep-links** (from `handoff-2026-07-23-results-tab-clarity-design.md`
  §C5): per-sentence `[1]`/`[2]` markers on specific rule sentences, deep-linking via
  `#:~:text=<phrase>` to the exact ACIP 2020 MMWR paragraph. **Still blocked** on running
  the `verify-clinical-source` skill against the live MMWR
  (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7527029/) to confirm each anchor phrase —
  do not guess phrases; a wrong `#:~:text=` fragment silently fails to highlight, which
  reads as "verified" when it isn't.
- **Items 2 and 3** from `handoff-2026-07-23-legend-wording-undo-agedesc-ontrack-design.md`
  (carried over, NOT part of this session's scope, still valid per that file):
  - Item 2: edit/undo for the "Needs input" risk-at-dose prompt.
  - Item 3: drop redundant raw-day precision in interval explanations via `fmtDays()`.
- **Cross-app port**: none of this session's changes were ported to PneumoVax or vaxapp —
  per standing owner decision (2026-07-23), that's a batched cross-app review later, not
  piecemeal. Flag for that review: the em-dash → hyphen copy-style rule applied broadly
  this session (chips, banners) should propagate per the design-review skill's cross-app
  parity rule ("copy-style rules like em-dash removal" apply to PneumoVax too).

## Why this is a good stopping point

The whole Results-tab clarity redesign (C1–C5's reorder/immunize.org piece, plus the small
copy items) is implemented, tested (14 new/updated tests), and live-verified. The suite is
green, nothing is mid-edit, and the branch is a clean 5-commit stack ready for review. Only
the subscript deep-link sub-piece remains, and it's independently blocked on a live source
check — it doesn't block shipping the rest.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout design/results-tab-clarity`
2. `npx vitest run` — confirm **317 passing** before any new work.
3. Ask the owner: push this branch and open a PR now, or continue adding the subscript
   piece to the same branch first? (Design doc says ask before pushing; don't default.)
4. If continuing C5's subscripts: run the `verify-clinical-source` skill against the live
   ACIP 2020 MMWR to confirm each anchor phrase before wiring `#:~:text=` fragments.
5. Ship: MeningoVax `main` is UNPROTECTED but the owner prefers branch → PR → squash-merge
   — **ask before pushing**, per this file and the design doc it supersedes.
