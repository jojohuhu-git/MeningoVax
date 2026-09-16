> **SUPERSEDED (2026-09-15).** Everything this file lists as open is resolved:
> PR #12 merged, and F6/P1 were overtaken by the 2026-09-15 dose-counter audit.
> The current state is
> [handoff-2026-09-15-dose-counter-audit-queue-done.md](handoff-2026-09-15-dose-counter-audit-queue-done.md).
> Do not resume the queue below.

# MeningoVax — Handoff after F1-F5 (dose-counter fix) shipped (2026-09-14)

Branch: `dose-counter-structural-fix`, off `main` at `94c7c81`. **Pushed** to
`origin/dose-counter-structural-fix`; **PR #12 open**
(https://github.com/jojohuhu-git/MeningoVax/pull/12), not yet merged — per
this queue's own handoff, `main` is protected for this work (branch → PR →
squash merge; do not push to `main`).

Baseline was 399 passing tests; now **408 passing (31 files)**, all green,
working tree clean at commit `2359260`.

This resumes and completes most of
[handoff-2026-09-14-dose-counter-structural-fix.md](handoff-2026-09-14-dose-counter-structural-fix.md)
(F1-F6 + P1) — see that file for the full original diagnosis and source
citations. **That file's F1-F5 items are DONE; F6 and P1 are still open,
tracked below.**

## What's done

- **F1** — `recommend.js`'s ~20 hand-typed `seriesTotal` literals: fixed the
  routine-MenACWY ones (now 2 when an earlier <16y dose owes the 16y
  booster, 1 when the only dose(s) on record were all given at ≥16y — was
  hardcoded 1 everywhere, the reported bug) and the MenACWY infant
  high-risk 7-11mo/12-23mo sub-buckets (had drifted from their own
  `given >= 3/4` completion guard a few lines away). Already-correct
  totals (high-risk primary=2, MenB high-risk=3/healthy=2, single-dose
  exposure=1) left untouched.
- **F2/F3** — `validate.js`'s `analyzeHistory()` now caps a valid/unknown
  dose at the schedule's total on schedules with no ongoing booster phase
  (routine MenACWY, single-dose MenACWY exposure, healthy MenB), returning
  `extraDose: true, effectiveDoseNum: null`. Schedules with an ongoing
  booster phase (high-risk MenACWY/MenB, MenACWY travel/microbiologist,
  MenACWY infant high-risk) are never capped.
- **New shared module** `src/logic/seriesTotals.js` — the single source of
  truth both `validate.js` and `recommend.js` import from (a pure leaf, no
  circular import), which is what guarantees the chip's M and the
  recommendation card's M can't drift apart again.
- **F5** — `RecCard.jsx`: replaced the dead `'Counts'` fallback with
  **"Recorded — not part of an indicated series"** (the handoff's own
  suggested wording, owner-confirmed live this session). Added two new
  labels the cap now distinguishes: **"Extra dose — beyond the indicated
  series total"** and **"Booster (dose N)"**.
- **F4** — `sweep-dose-counter.test.js`: every age 0-120y (every 3 months)
  × 7 risk combos (one per `menacwyClass`/`menbClass` value, plus `hct`
  alone matching the reported case) × dose histories 0-5, asserting no
  chip ever shows N > M or the dead `'Counts'` label. Zero violations
  found once F1-F3 landed.
- **Booster-safety-net test** `booster-not-extra.test.js` (written before
  the F2 capping code, per the original handoff's instruction): confirms a
  legitimate booster is never mislabeled extra, for all three booster-phase
  schedule types.
- **Live-verified** in the running app (not just the suite): drove the
  owner's own reported case (age 82, HCT, Menveo 2024-04-05/07-05/10-04)
  and confirmed D1 now shows "Dose 1 of 1", D2/D3 show "Extra dose — beyond
  the indicated series total" (was "Dose 2 of 1" / "Dose 3 of 1"); the
  MenB dose shows "Recorded — not part of an indicated series" (was
  "Counts"). Also drove a high-risk (asplenia) patient with a 2-dose
  primary + 2 boosters and confirmed D3/D4 show "Booster (dose 3)" /
  "Booster (dose 4)", not "Dose 3 of 2" / "Dose 4 of 2". Zero console
  errors in either case.
- The `validate-new-rules.test.js:639` test the original handoff predicted
  would need rewriting ("a dose given at ≥16y after an already-counted
  primary dose DOES advance the count") did **not** need rewriting — this
  session's design (both modules independently derive the total from the
  same shared classifier, fed by the same inputs, rather than recommend.js
  threading a total into validate.js) keeps that scenario's `effectiveDoseNum: 2`
  assertion correct by construction once F1's routine-total fix landed. A
  cleaner outcome than the original handoff anticipated, not a shortcut.

## What's NOT done — the remaining queue

- **F6 (P1 priority in the original doc)** — port the same 0-120y sweep to
  vaxapp's `src/logic/stateHelpers.js:87` (`menACWYRoutineCount`, which
  carries the identical narrow "before age 16" rule). **Owner decision
  this session: do this in a separate vaxapp session, not here.** No
  vaxapp code was touched. The original handoff is explicit that no
  visible vaxapp symptom was proven — the sweep is what would settle it.
- **P1 (clinical, blocked)** — does the post-HCT 2-dose MenACWY schedule
  apply above age 18? The owner said "it applies to ages above 18" this
  session, but per this repo's standing rule (`verify-clinical-source`
  skill; CLAUDE.md), a clinical-logic change still needs the full ASCO
  passage read live before it's coded — the original handoff flagged CDC
  and ASCO both return 403 to automated fetching, so the owner may need to
  open the page herself. **Not started.** After that: the `vaccine-parity`
  skill, since vaxapp's `hctRecipe` and PneumoVax's advisory need to move
  in step (see the original handoff's P1 section for the exact IDSA/ASCO
  source tension).
- **PR #12 merge** — open, not yet reviewed/merged. Owner reviews PRs
  herself (standing pattern across sessions).

## Why this is a good stopping point

F1-F5 is a complete, independently-shippable unit — display-only, no
vaccine recommendation changed (same doses, dates, intervals as before),
verified both by an exhaustive sweep and by hand in the running app. F6 and
P1 are explicitly separate scopes (one a port to a different repo, one
blocked on a live clinical-source read) that don't block this PR landing.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout dose-counter-structural-fix`
   (or `main` after PR #12 merges).
2. Run `npx vitest run` — confirm **408 passing (31 files)**.
3. Check whether PR #12 merged; if not, that's likely the next action (or
   ask the owner if she wants review changes first).
4. **Owner decision needed before F6**: confirm she still wants it as a
   separate vaxapp-repo session (this session's default, not re-asked).
5. **P1 stays blocked** until the ASCO source is read live — do not start
   coding it from the owner's stated answer alone; use `verify-clinical-source`
   first, then `vaccine-parity` for the cross-repo port.
6. Ship per the `ship` skill: this repo's PR is already open; squash-merge
   after review, do not push directly to `main`.
