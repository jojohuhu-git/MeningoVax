> **SUPERSEDED, 17 September 2026 (evening) — see
> [handoff-2026-09-17f-part2-done-and-two-audits.md](handoff-2026-09-17f-part2-done-and-two-audits.md).**
> PR #35 has since been merged (`2e136ba`), and so has the age-threshold work this file
> named as the next unit (PR #36, `5754b16`). The rulebook artifact named below has been
> refreshed and now reports no open gaps. Do not resume from this file.

# MeningoVax — Handoff after P2-2 and the chip-label dedup (2026-09-17)

Repo: `~/Downloads/MeningoVax-main`. Live: https://jojohuhu-git.github.io/MeningoVax/
Standalone client-side meningococcal advisor (MenACWY + MenB + pentavalent). No backend.
Sibling of vaxapp/PediVax and PneumoVax.

Branch: `docs/p2-2-vaxapp-reuse-roadmap`, off `main` (`9ddff5c`), **pushed and in sync**,
working tree clean at `cc76a30`. Open as **PR #35**, Tests check **green**, NOT merged —
left for the owner's review.

Baseline at session start was **1232 passing (100 files)**, verified by running it, not
recalled. Now **1253 passing, 435 files, 0 failing, 0 failed suites.**

**This file supersedes `handoff-2026-09-17d-u5-and-p2-1-both-merged.md`**, which was
correct when written.

## What's done (by item ID)

1. **P2-2 — DONE**, commit `64551bd`. The last item of
   `.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`, and always a document
   rather than code:
   `docs/archive/plan-2026-09-17-vaxapp-meningococcal-reuse-roadmap.md`. It records the
   ORDER the 16th/17th were worked in and why each step sits where it does, then does the
   part that makes it usable — a read-only inventory of where vaxapp's meningococcal rules
   actually live (seven files: 212 lines of it in `recommendations.js`, 89 in
   `buildOptimalSchedule.js`, 69 in `validation.js`, 60 in `compliance.js`).

   **It corrects what every previous handoff says about vaxapp**, verified against that
   repo on 2026-09-17. They say vaxapp "still has the P0-1 bug". The truth is worse and is
   the best argument for the roadmap: vaxapp's COMMITTED engine recommends the infant
   series at `minInt: 28` and prints "Min 4 weeks", while the same committed tree's
   `scheduleRules.js` already carries `i:[null,56,...]`. One rule, two committed copies,
   disagreeing, live on the deployed site.

2. **The sweep test's second copy of the chip rules — FIXED**, commit `cc76a30`. This was
   the "reported, not fixed" item carried by the last three handoffs.

   `sweep-dose-counter.test.js` held its own `chipLabel()` under a comment promising it
   mirrored `RecCard.jsx` "exactly". Measured before changing anything, over that sweep's
   own grid: the two disagreed on **20,167 of 95,928 rows (21%)**. The component renders a
   plain `Booster`; the copy rendered `Booster (dose 3)`. The sweep exists to prove the
   chip never implies N > M — and its copy was the thing printing N. It could not have
   caught the bug it was written for, and making the app agree with its test would have
   reintroduced that bug.

   Two branches had never been copied across at all: the record-problem labels (G3/G7) and
   the undated extra dose (G6). Both latent — that grid generates clean dated doses.

   Wording and chip colour now live in **`src/components/doseChipLabel.js`**, imported by
   both the component and the sweep. Display logic only; it computes no rule. New
   `src/components/__tests__/regression-chip-label-one-copy.test.js` guards it from both
   ends: a source scan (same shape as P2-1's) over the six owned strings, plus unit
   assertions on the branches that had drifted — including that `Booster` contains no digit.

3. **`intervals.js` header — CORRECTED**, commit `e5c722c`. It told the next reader that
   the >=2y high-risk gap, the booster cadences, the MenB month floors, the rescue interval
   and the 4-day grace rule were "NOT here yet and still live where they always did". All
   five have lived in that file since the P2-1 group commits. Nobody updated the paragraph
   when the groups arrived. It is the worst stale comment possible for that file: it points
   someone at finished work, and the obvious way to redo it is to write a second copy of a
   number. Now says what is true, and names what genuinely remains (age thresholds).

4. **Vitest worktree exclude**, commit `b1cf8f1`. `npx vitest run` from the repo root was
   collecting the suite TWICE — once from `src/`, once from the full second copy inside
   `.claude/worktrees/` — reporting 2,464 tests and **197 failures on a clean tree**. Hit on
   the first verification run this session. `vite.config.js` now excludes
   `**/.claude/worktrees/**`.

## What's NOT done — the remaining queue

- **Owed to PneumoVax: the U4 copy-style changes**, under the cross-app parity rule.
  Not started. The owner explicitly deferred it on 2026-09-17 — it is tracked, not dropped.
- **Age thresholds are the next interval group.** Named in the corrected `intervals.js`
  header. The two-copies pattern is already visible: `recommend.js` keeps a map (`M`, ~:65)
  while `validate.js` hand-types `ageMonths < 24` (~:412) instead of asking for it.
- **The rulebook artifact needs a refresh.** Its section 08 still lists the MenB dose-3
  rescue as a live gap; it was fixed and merged as PR #30. There are now no live gaps.
  Artifact: https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss
- **vaxapp ports remain on HOLD**, reaffirmed by the owner 2026-09-17. The two apps
  knowingly disagree until a separately authorised port. See item 1 for what is actually
  committed there — and note the finished 8-week port sitting UNCOMMITTED in that working
  tree, which must not be committed, rebased or stashed without asking her.

## Two things about this working copy

- **The queue file's "fully consumed" banner is local-only.** `.claude/` is gitignored
  here, so the banner added to `fix-2026-09-17-rule-foundation-and-copy.md` this session
  exists on this machine and will not travel to a fresh clone.
- **A leftover agent worktree still holds `main`** at
  `.claude/worktrees/elated-thompson-4bc583` (clean, nothing unpushed). It is why the
  primary checkout could not `git checkout main`. It was left alone rather than removed,
  since it may belong to a session that is still open. The stale
  `refactor/p2-1-intervals-one-place` local branch WAS deleted (it was merged as PR #33).

## Why this is a good stopping point

The 2026-09-17 fix queue is fully consumed — every item in it is merged or, for P2-2,
written. The one finding the last three handoffs carried as "reported, not fixed" is now
fixed. Nothing remaining depends on anything in PR #35: the PneumoVax port is a different
repo, the age-threshold group is a fresh unit of work, and the artifact refresh is a
document.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout docs/p2-2-vaxapp-reuse-roadmap`
   (or `main`, if PR #35 has been merged by then — check first).
2. Run `npx vitest run` and confirm **1253 passing, 0 failed suites** before new work.
   Check `numFailedTestSuites`, not just failed tests: a file that crashes while LOADING
   runs 0 tests, reports 0 failures, and still fails CI.
3. **Ask, don't default** on which is next: the PneumoVax U4 copy port, the age-threshold
   interval group, or the rulebook artifact refresh. **The vaxapp clinical ports stay on
   HOLD** until the owner authorises them — she reaffirmed that today.
4. Per item (`fix-queue` skill): reproduce → failing test first → fix → full suite green
   (quote the real number) → drive the running app if UI-observable → commit by item ID.
5. Push policy: `main` is not protected here, but the habit is branch → PR → squash merge,
   and the owner reads the PR before it lands.
6. Dev servers: two are already running on this working tree (**ports 5179 and 5180**,
   path `/MeningoVax/`) and belong to other chats. They serve this same tree, so they can
   be driven read-only for live verification — that is how PR #35 was verified. **Do not
   kill another chat's server without asking the owner.**
