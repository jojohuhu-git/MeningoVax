# MeningoVax port — Handoff after Phase 6.2 F-3 was built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase6-g1-answered.md`.

## State (verified 2026-11-18)

- `main` at `578cc24` (PR #106 merged): 2,117 passed, 168 files (re-run this session).
- Branch `port/phase6-f3-badge`, pushed, **PR #107** open against `main`:
  **2,121 passed, 0 failing (169 files)**. Owner merges.

## What's done

1. **F-3** (owner, STOP G1) — `statusPillLabel` in `src/components/RecCard.jsx`: a card not due
   today with an `earliestNextDate` reads "Future booster needed" (dose past the primary series,
   `doseNum > primaryTotal`) or "Next dose not yet due"; "Up to date" only when nothing is left.
   Measured: 4,632 "Up to date" → 4,256 + 376; prose diff 4,388 real patients, badge words the
   only change. Live-checked (microbiologist 30 y; complement 11 y). Commit `ff1b882`.
   - **Flagged for the owner in the PR:** 98 cards the packet counted as "dated non-booster"
     are the 16-year booster (label "1 dose (routine booster at ≥16y still owed)"), so they read
     "Future booster needed". If she disagrees, it is one line.
   - Guards: `regression-2026-11-18-f3-badge-names-what-is-left.test.jsx`; never-events
     property 16 (404,736 cards; 372,988 violations with the old code).

## What's NOT done

**Owner action first:** review and merge PR #107 (and answer the 98-card note in it).

**Not started, Phase 6.2, in order, one PR each, each off `main` after the previous merges**
(stacked branches merge into each other; `docs/agent/testing.md` counts also conflict):
1. **F-5**: "Booster (16y)" replaces "Booster due at 16y" (engine label; the Phase 4 label list
   in `docs/agent/clinical-rules.md`; tests asserting the old string). 1,452 cards.
2. **R-A / R-B / R-C** endings for undated "Not counted — repeat" lines (`recommend.js`, beside
   `datedRepeatLines`), sentences in `stop-g1-packet-2026-11-18.md` §4. Then **ask R-C's chip**,
   measured first.
3. **G1-b** dose-line "Why this" fold-out (port PneumoVax's `DoseValidation`).
4. **G1-a** style-rules rewrite with a machine guard (see the previous handoff's item 5).

**New finding (not fixed, ask):** 264 routine "Booster (16y)" cards **due today** read "Dose due
today", not "Booster due today" (the `seriesTotal` counting; `primaryTotal` would mislabel 36
catch-up cards "Dose (catch-up, no dose at ≥16y)", so it needs its own look).

**Carried over (not fixed):** see `handoff-2026-11-18-meningovax-phase6-g1-answered.md`
"Carried over" (MenB booster note, MenB "every 2–3 years", whole-app checks 5 and 7, Phase 4 A2,
A10, A11, A16, CDC 2024-0069/0034/0035/0040 in shared `dateUtils.js`). Then 6.3 (Q10, ask again).

## Why this is a good stopping point

F-3 is complete and isolated in one PR; the next item (F-5) touches the engine and the same
`testing.md` counts, so it should start from `main` once #107 lands.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 107`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,121 passed, 169 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Measurers (scratch, re-create as needed): render `Results` per grid case with `renderScreen`
   from `scripts/proseDiff.mjs` and read `.status-badge` / labels; run with
   `VITEST=1 npx vite-node <script>`. Prose: `npm run prose -- dump/diff` (dump before with the
   old file swapped in, after with the new).
4. Per item: prototype → measure → failing test → change → docs in the same commit → live check
   → PR against `main` (E4 checklist in the body); the owner merges.
