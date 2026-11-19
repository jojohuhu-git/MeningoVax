> **SUPERSEDED 2026-11-19** by `handoff-2026-11-19-meningovax-phase7-rulebook-table.md`. #115 merged;
> Phase 7.1 (dose rules) and 7.3 built as PR #116. Do not resume from this file.

# MeningoVax port — Handoff after W1–W4, the wording answers after the fold (2026-11-19)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md`. **Supersedes**
`handoff-2026-11-19-meningovax-phase6-q10-fold-built.md`.

## State (verified 2026-11-19)

- `main` at `eaff392` (#114, the fold). #113 and #114 both MERGED: **STOP G2 done**.
- Branch `port/phase6-after-fold-w1-w4`, off `main`, pushed. **PR #115** open against `main`:
  https://github.com/jojohuhu-git/MeningoVax/pull/115. Commit `89e385c`, plus this handoff's commit.
- **2,179 passed, 0 failing, 176 files** (baseline on `main` was 2,170 / 175).
- MeningoVax has no CI; the owner merges. "Merged" = PR shows MERGED and
  `git diff origin/main <branch>` is empty (squash merges change the sha).
- Dev server: leftover servers from other chats hold the 5-per-folder limit, so
  `preview_start {name}` refuses; `preview_start {url: "http://localhost:5175/MeningoVax/"}` works
  (it serves whatever is checked out in this folder).

## What's done

Owner answers and measurements: `docs/archive/decisions-2026-11-19-after-the-fold.md`. All in
`89e385c`; guard `src/components/__tests__/regression-2026-11-19-after-fold-w1-w4.test.jsx`.

1. **W1**: the routine "Booster (16y)" card's badge says "Booster due today" (was "Dose due today"
   on 264 real patients). `statusPillLabel` in `RecCard.jsx` judges booster by `primaryTotal`.
2. **W2**: its "Why this" says "The dose given before 16 years is the first dose…" (was "at 11–12
   years", wrong for 228 of 264; closes Phase 0's B16 sighting). `recommend.js`.
3. **W3**: the 13–15 catch-up booster line says "at age 16–18" (216); 11–12 keeps "at age 16".
   **W3a** (asked separately): its source is CDC's 13–15 sentence only; ACIP's 11–12 sentence leaves
   270 pages.
4. **W4**: healthy MenB "Why this" drops "A healthy 16–23-year-old may receive MenB by shared
   clinical decision-making." (79 → 69 words, 944).
5. Prose diff: 1,712 of 24,600 saved patients changed, every one W1–W4 or a renumbered source mark.
   Live-checked (16-year-old with a dose at 15; 14-year-old), no console errors.
6. Re-pointed test: M16 (`regression-m16-menb-preferred-16-18.test.js`) now checks "Past 18, the
   series may still be given up to the 24th birthday" for the MenB window. Flagged in the PR body.
7. Docs in the same commit: CLAUDE.md status, plan, clinical-rules.md, meningococcal-rules-summary.md,
   testing.md counts.

## What's NOT done

**Owner action first:** review and merge PR #115.

**Not asked, noticed this session (ask, don't default):**
- The 24-year-old recruit's "Booster (16y)" "Why this" is long and uses a dash ("The routine
  MenACWY booster at 16 is still owed — the recorded dose was given before then. The military
  recruitment requirement is already met…"). Not measured against the G1-a rules.

**Carried over (not started):**
- "Sources" toggle label on 140 cards: not re-asked (memory: MeningoVax wording should match
  PneumoVax). Raise only if she brings it up.
- `handoff-2026-11-18-meningovax-phase6-g1-answered.md` "Carried over" (MenB booster note, MenB
  "every 2–3 years", whole-app checks 5 and 7, Phase 4 A2, A10, A11, A16, CDC 2024-0069/0034/0035/0040
  in shared `dateUtils.js`).
- **Phase 7** (plan §Phase 7): 7.1 `CLINICAL_SPEC.md` (every rule with quote and date, app's order,
  app decisions numbered; rule table generated from the Phase 2 describers and held to the code
  cell by cell, E7; drop the vaxapp sync, R-7). 7.2 **Q11** in-app Rulebook tab (ask; build only on
  a yes). 7.3 CLAUDE.md non-negotiables from the port. Then STOP H. Phases 8–9 after.

## Why this is a good stopping point

Phase 6 is merged and its four follow-up answers are one PR with its own guard. Nothing else is in
flight. Phase 7 is a new piece of work that should start from `main` once #115 lands, not stacked on
an open branch (memory: stacked PRs merge into each other).

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 115`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,179 passed, 176 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server" (or the URL above).
3. Start Phase 7.1. Read the plan's §D (D1, D2) and §E7, and the existing `rule-docs-match-code`
   test, first. Ask Q11 (Rulebook tab) with a mock-up before building 7.2.
4. Per item: prototype → measure (saved answers; `npm run prose -- dump/diff` in the scratchpad)
   → failing test → change → docs in the same commit → live check → PR against `main` with the E4
   checklist in the body; the owner merges.
