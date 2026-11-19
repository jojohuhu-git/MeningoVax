# MeningoVax port — Handoff after Phase 6.2 G1-b was built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase6-r-abc-built.md`.

## State (verified 2026-11-18)

- `main` at `843a519` (PR #110 merged, head `e3c30d3` included): **2,140 passed, 171 files**.
  #110 carried the R-C later-shot change that PR #109 missed (#109 merged one commit early).
- Branch `port/phase6-g1b-dose-why`, off `main`, pushed, clean, **PR #111** open against `main`
  (one commit, `3be3c6d`): **2,144 passed, 0 failing, 172 files**. MeningoVax has no CI checks;
  the owner merges. Before saying "merged", check the PR's head commit is on `origin/main`.

## What's done

1. **G1-b** (owner, STOP G1, "Yes, as PneumoVax"): each recorded dose has its own "Why this".
   - `RecCard.jsx` `DoseWhy` (ported from PneumoVax's `DoseValidation`; classes
     `.rec-note-toggle .dose-val-toggle`, `.dose-val-why` in `App.css`). Shut in the app; open
     under `OpenAllDisclosures` (the prose tool). "Needs input" view unchanged.
   - Behind it: every dose's `detail`, plus a new `whys` list. Two sentences moved to `whys` in
     `doseRules.js` (`MENB_LICENSED_FROM_10_WHY`, `MENB_WANES_BEFORE_16_WHY`, the packet's L3
     and L1). The source marker moved onto the sentence before it. `whys` carry no `[c]`.
   - `validate.js`: Extra doses clear `whys` (their line is the reason only).
   - Measured: 14,270 grid patients gain one (9,030 real); 0 patients' sentence set changed;
     0 source numbers changed; saved answers unchanged.
   - Live-checked: the L3 patient (complement, DOB Mar 1 2016, Bexsero Mar 15 2025) shut/open.
     Phone width: no sideways scroll. No console errors.
   - Test: `regression-2026-11-18-g1b-dose-line-why-this.test.jsx` (3 fail on main, control
     passes on both); `validate.test.js` updated. Docs: architecture.md, testing.md, plan,
     CLAUDE.md.

## What's NOT done

**Owner action first:** review and merge PR #111.

**Not started, Phase 6.2, then 6.3:**
1. **G1-a**: rewrite every dose line, card lead and "Why this" to PneumoVax's 10 style rules
   (`stop-g1-packet-2026-11-18.md` §1), with a machine guard like PneumoVax's
   `regression-why-this-2026-11-08-card-paragraphs-follow-the-style-rules.test.js` (no "~",
   no semicolon, ≤1 dash per sentence, word ceiling). Every before/after in the PR body. Start
   from `main` after #111 lands. Items G1-b left on purpose for G1-a:
   - Rule sentences that state the missed minimum ("MenACWY doses must be at least 8 weeks
     apart [c]", "MenACWY boosters for travel … must be spaced ≥5 years", "High-risk schedule
     requires ≥8 weeks between D1 and D2", etc.): fold the minimum into the reason, then the
     rule sentence can go behind "Why this".
   - L1's "recommended at 16–23 years" does not match its own quote (shared clinical
     decision-making). Correct it.
   - Inventory: 189 kinds of dose line, 103 distinct sentences (scratch measurer, not
     committed; rebuild by running `recommend` over `buildSavedAnswerCases` +
     `buildRecordProblemCases` and grouping `history.<family>.perDose` reasons).
2. **6.3 Q10**: fold the result page? Her 2026-11-06 answer was "PneumoVax only". Ask again;
   build only on a yes.

**Open finding (not fixed, ask):** 264 routine "Booster (16y)" cards due today wear "Dose due
today", not "Booster due today" (`RecCard.jsx` `statusPillLabel`; switching to `primaryTotal`
would mislabel 36 catch-up cards).

**Carried over (not fixed):** see `handoff-2026-11-18-meningovax-phase6-g1-answered.md`
"Carried over" (MenB booster note, MenB "every 2–3 years", whole-app checks 5 and 7, Phase 4 A2,
A10, A11, A16, CDC 2024-0069/0034/0035/0040 in shared `dateUtils.js`). Then Phases 7–9.

## Why this is a good stopping point

G1-b is a complete, isolated unit in one PR: placement only, no sentence changed. G1-a rewrites
the same lines and touches `testing.md` counts, so it must start from `main` once #111 lands.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 111`. If merged (head `3be3c6d` on
   `origin/main`): `git checkout main && git pull --ff-only`; `npm test` should give
   **2,144 passed, 172 files**. If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Prose measuring: `npm run prose -- dump <file>` before and after, then
   `npm run prose -- diff <before> <after>` (dumps in the scratchpad). For a placement-only
   change, also compare each patient's sorted sentence set with "{hover: …}", "[N]" and
   "Why this" stripped: it must be 0. Saved answers: `npx vite-node scripts/updateSavedAnswers.mjs`.
4. Per item: prototype → measure → failing test → change → docs in the same commit → live check
   → PR against `main` (E4 checklist in the body); the owner merges.
