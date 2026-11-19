# MeningoVax port — Handoff after Phase 6.2 F-5 was built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase6-f3-built.md`.

## State (verified 2026-11-18)

- `main` at `d6003ec` (PR #107, F-3, merged): 2,121 passed, 169 files (re-run this session).
- Branch `port/phase6-f5-16y-label` (F-5 `ce1e251`, its follow-up next), pushed, **PR #108** open against
  `main`: **2,130 passed, 0 failing (170 files)**. MeningoVax has no CI checks; the owner merges.

## What's done

1. **F-5** (owner, STOP G1) — the routine 16-year MenACWY booster has one card title,
   "Booster (16y)" (was "Booster due at 16y" before 16). `recommend.js`: one constant
   `ROUTINE_16Y_BOOSTER_LABEL` at all four card sites and in `outbreakWording` (which leaves this
   title without the outbreak caveat). Prose diff: 1,596 patients (1,452 real, 144 impossible)
   read different wording; old→new swap on the "before" dump is byte-identical to "after".
   Live-checked (healthy, DOB 2015-03-01, MenQuadfi 2025-06-01). Guard:
   `regression-2026-11-18-f5-one-label-16y-booster.test.js` (3 of 4 fail on old engine; the
   outbreak case fails if the `outbreakWording` check is dropped). Docs: `clinical-rules.md`
   (F-5 entry), rules summary, `testing.md` counts, plan, CLAUDE.md status.

## What's NOT done

**Owner action first:** review and merge PR #108, and answer its open question:
- **Answered and built (owner, 2026-11-18, "Yes, same title"):** from 16, the travel/lab/outbreak
  card (`routineSixteenBoosterCard`) reads "Booster (16y)" instead of "1 dose (routine booster at
  ≥16y still owed)" — 648 real patients (incl. military + lab worker, which takes the lab path).
  Commit 2 on PR #108.
- **Q (not decided, ask):** the question named "travel/lab/outbreak" but its count (810) also
  held **162 military-only** patients, whose card comes from the military branch of `menacwyRec`
  (`recommend.js` ~line 925). They still read "1 dose (routine booster at ≥16y still owed)".
  Also "Booster (16y)"? If yes: one line, and flip the military control in
  `regression-2026-11-18-f5-one-label-16y-booster.test.js`.

**Not started, Phase 6.2, in order, one PR each, each off `main` after the previous merges**
(`docs/agent/testing.md` counts conflict between stacked branches):
1. **R-A / R-B / R-C** endings for undated "Not counted — repeat" lines (`recommend.js`, beside
   `datedRepeatLines`); exact sentences in `stop-g1-packet-2026-11-18.md` §4 and its Answers
   table. Then **ask R-C's chip**, measured first.
2. **G1-b** dose-line "Why this" fold-out (port PneumoVax's `DoseValidation`).
3. **G1-a** style-rules rewrite with a machine guard (see `handoff-2026-11-18-meningovax-phase6-g1-answered.md` item 5).

**Open finding (not fixed, ask):** 264 routine "Booster (16y)" cards **due today** have the badge
"Dose due today", not "Booster due today" (`seriesTotal` counting in `RecCard.jsx`
`statusPillLabel`; switching to `primaryTotal` would mislabel 36 catch-up cards, so it needs its
own look).

**Carried over (not fixed):** see `handoff-2026-11-18-meningovax-phase6-g1-answered.md`
"Carried over" (MenB booster note, MenB "every 2–3 years", whole-app checks 5 and 7, Phase 4 A2,
A10, A11, A16, CDC 2024-0069/0034/0035/0040 in shared `dateUtils.js`). Then 6.3 (Q10, ask again).

## Why this is a good stopping point

F-5 is complete and isolated in one PR. The next item (R-A–R-C) touches `recommend.js` and the
same `testing.md` counts, so it should start from `main` once #108 lands.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 108`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,130 passed, 170 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Prose measuring: `npm run prose -- dump <file>` before and after, then
   `npm run prose -- diff <before> <after>` (~12 s each; write dumps to the scratchpad). For
   counts of one phrase split real/impossible:
   `awk '/phrase/ {split($0,a,":"); c[a[1]]++} END {for (k in c) print k, c[k]}' <dump>`.
4. Per item: prototype → measure → failing test → change → docs in the same commit → live check
   → PR against `main` (E4 checklist in the body); the owner merges.
