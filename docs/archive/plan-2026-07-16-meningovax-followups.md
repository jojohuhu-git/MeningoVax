> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/plan-2026-07-16-meningovax-followups.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# Plan: MeningoVax follow-ups (one open clinical bug + CLAUDE.md cleanup)

**Written:** 2026-07-16 · **For:** a fresh agent session. **Owner:** Joanne (a clinician who
codes, not a software engineer — explain every what and why in plain English).

## Why this exists

MeningoVax's big July fix + design queue is merged into `main` (PR #4, merged 2026-07-17). Two
loose ends remain that belong to MeningoVax itself (they are **not** part of the cross-app port to
vaxapp/PneumoVax — that's a separate plan at
`vaxapp-main/.claude/prompts/plan-2026-07-16-crossapp-parity-port.md`):

1. **M1 — an open clinical bug** found while doing the July work but deliberately spun off, never
   fixed: the high-risk booster-cadence check can wrongly invalidate a legitimate infant
   primary-series dose.
2. **M2 — CLAUDE.md debloat** for MeningoVax.
3. **M3 — local branch cleanup** (the merged working branch is still checked out).

## Working discipline (non-negotiable, from ~/.claude/CLAUDE.md)

- Start the dev server first (`preview_start` + `.claude/launch.json`, name "MeningoVax dev
  server"; Vite auto-increments the port — check `preview_logs` for the real one).
- Per item: reproduce → failing test (synthetic fixture, never real patient data) → confirm it
  fails → minimal fix → FULL suite → live-verify → commit named by the item.
- Verify clinical rules against the live authoritative page (ACIP/CDC/immunize.org) and quote it;
  don't transcribe from memory.
- Report the real test count (run it) and the real `git status`.
- **Branch/PR policy:** MeningoVax's `main` is **not** branch-protected (direct push is allowed),
  but the July work used a branch + PR so the owner could review as one unit. Confirm current policy
  with the `ship` skill; default to branch + PR and **let the owner merge**, matching how PR #4 was
  handled — don't self-merge unless she says so.

## M0. Baseline first

`git checkout main && git pull && npx vitest run`. Quote the actual pass count. `git status` should
be clean. Don't build on anything but a green `main`.

## M1 (clinical bug) — booster-cadence check wrongly invalidates infant primary-series doses

**Where:** `src/logic/validate.js`, `validateOneMenACWY()` — the booster-cadence block guarded by
`if (riskClass && effectiveIdx >= 2)` (around line 286; the risk-class/interval setup starts ~line
243).

**The bug (as flagged during the July queue — re-confirm it still reproduces before fixing):** for a
high-risk (`primary2`-class) patient, the code treats **any** effective dose at index ≥ 2 as a
booster and applies the 3-year/5-year "too-soon" cadence check. But the high-risk **infant** pathway
is a **4-dose primary series** (doses at ~2, 4, 6, and 12 months); doses 3 and 4 there are only ~2
months apart, which is correct for the primary series but looks "too soon" to a booster check. So a
legitimate 12-month infant dose can be wrongly flagged "invalid — booster given too soon."

**Verify the rule live** (immunize.org / ACIP meningococcal, high-risk infant schedule) and quote
the actual primary-series spacing and the point at which "booster cadence" (3y/5y) actually begins —
that boundary is the crux of the fix.

**The fix (minimal):** the cadence check must apply only to doses that are genuinely **boosters**,
not to the tail of the infant primary series. Distinguish "still completing the primary series" from
"first booster and beyond" — likely by age at dose and/or position within the known primary-series
length for the infant pathway, rather than a blanket `effectiveIdx >= 2`. Keep `recommend.js` and
`validate.js` in sync (MeningoVax CLAUDE.md rule: booster timing is keyed off age at Dose 2 in
**both** files — a change in one without the other produces inconsistent results).

**Tests:** add a case to `validate-new-rules.test.js` (or the matching validation test) — a
high-risk infant with the standard 2/4/6/12-month MenACWY series has its 12-month dose marked
**valid**, not "booster too soon." It must fail before the fix. Also confirm no real booster case
(e.g. a genuine early booster in an older high-risk patient) stops being flagged — don't over-correct
and silence a legitimate "too soon."

**Cross-app note:** check whether vaxapp's pediatric MenACWY validation has the same infant-series-vs-
booster confusion. If it does, flag it for the cross-app plan's vaxapp session rather than fixing it
here (this plan is MeningoVax-only), so the owner sees both.

## M2 (debloat) — MeningoVax CLAUDE.md cleanup

Read `MeningoVax-main/CLAUDE.md`. It's already tight, so be **conservative** — remove only genuine
staleness/duplication and show the owner the diff:

- The **"Source of Truth Files"** table points to `docs/archive/agent-session-log.md` as
  "Session history (2026-06-04 through 2026-06-13)" — that date range is now stale given the heavy
  July work. Update the range or make it non-dated ("see docs/archive for session history").
- Check that the numbered clinical non-negotiables (booster-cadence sync, MenB D3 both-floors,
  pentavalent-card-only, college_dorm-vs-military rule) don't duplicate each other or the
  `docs/agent/clinical-rules.md` content verbatim — cross-reference rather than repeat long rules.
- **Keep every clinical/safety rule intact.** In particular, if M1 changes the booster-cadence
  logic, make sure the "Booster Cadence — Keep recommend.js and validate.js in Sync" rule still
  reads true (and update it if the sync key changes).

Commit the CLAUDE.md cleanup separately from the M1 code fix so the owner can review each alone.

## M3 (housekeeping) — local branch cleanup

The repo is currently sitting on the merged branch `fix/2026-07-13-audit-queue` (PR #4, merged).
After M0's `git checkout main`, delete the stale local branch if it's fully merged
(`git branch -d fix/2026-07-13-audit-queue`) so the working copy isn't confusingly parked on an old
branch. Confirm `git status` is clean on `main` first.

## Wrap-up

- Full suite green (quote the real count); M1 live-verified in the running app (drive the infant
  high-risk scenario and confirm the 12-month dose reads valid).
- PR for the owner to review/merge (don't self-merge unless she says so).
- If anything remains, write a handoff (`handoff` skill) to `docs/archive/`.
