# MeningoVax — Handoff after W4 (college-dorm >5y dose fix) (2026-07-24)

**Supersedes** `docs/archive/handoff-2026-07-24-w3-exposure-outbreak-status-done.md` for
the "what's next" pointer — that file's W3 remains done and accurate; W4 (its one open
item) is now also done. Do not resume W4 from that file or from
`handoff-2026-07-24-citation-wiring-w1-w2-w5-done.md` (W1/W2/W3/W5 all done, W4 now done
too — nothing left from that queue).

Branch: `main`, pushed to `origin/main` at commit `aa0e4b0`. MeningoVax lives at
`~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`). GitHub Pages deploy confirmed
green after push (`gh run list` shows `completed success`). Baseline this session was
**356 passing**; now **358 passing (8 files)**, all green, confirmed by `npx vitest run`
just before writing this handoff. Working tree has only pre-existing doc-only
diffs/untracked files under `docs/archive/` (same ones noted in prior handoffs, not
touched this session) — no code changes outstanding.

Core promise of this app: **honesty** — a recommendation that marks a stale dose as
satisfying a requirement it no longer satisfies gives a clinician false reassurance.

## What's done this session

- **W4 — college-dorm "1 prior dose since 16th birthday, but more than 5 years
  previously" sub-case.** Verified live against immunize.org p2018.pdf (Item #P2018,
  10/14/2025): the college-dorm row lists 3 vaccination-history sub-cases, all needing
  "Give 1 dose of MenACWY" — none, a dose before age 16, **and** a dose since the 16th
  birthday but more than 5 years previously. `recommend.js`'s `menacwyRec()` `isCollege`
  branch (~line 218) previously checked only whether *any* dose existed at age ≥16y
  (`confirmedAt16`), with no recency check — so the third sub-case fell through and was
  wrongly marked `status: 'complete'`, telling a clinician no further dose was needed when
  one was actually due.
  - Fix: replaced `confirmedAt16` with `dosesAt16Plus` (all doses at age ≥16y) and
    `recentAt16` (true only if at least one of those is ≤5 years old, i.e.
    `am - a <= 60` months). `recentAt16` → `complete` (unchanged behavior for the common
    case). `dosesAt16Plus.length > 0` but not recent → new branch: `status: 'exposure'`,
    `doseLabel: '1 dose (prior dose >5y ago)'`, note explains the stale dose no longer
    counts, cites `pentavalentGSK2025` (same ACIP 2020 MMWR citation as the other
    college-dorm branches). The pre-existing "dose before 16y or unknown date" branch is
    unaffected — it only ever saw doses that weren't ≥16y in the first place, so the new
    `dosesAt16Plus` filter doesn't change what reaches it.
  - **Tests (test-first):** 2 new cases in `src/logic/__tests__/recommend.test.js`
    (`describe('MenACWY single-dose indications')`): a dose at 16y now 6 years stale →
    `exposure`/due-today/note matches `/more than 5 years/i` (failed before the fix,
    passed after); and a boundary case at exactly 5 years (60 months) → still `complete`
    (passed both before and after — confirms the fix doesn't overcorrect the common case).
    All 3 pre-existing college-dorm tests unaffected (their doses are either <5y post-16
    or pre-16 or date-unknown).
  - **Live-verified** in the running app (`preview_start` "MeningoVax dev server", actual
    port 5182 this session — Vite auto-incremented past 5179–5181): a 22-year-old
    college-dorm patient with a dose recorded exactly on their 16th birthday 6 years ago
    now shows "Booster due today" / "1 dose (prior dose >5y ago)" with the new note, and
    `document.querySelector('.status-badge').className` reads `"status-badge exposure"`
    (was `"status-badge complete"` before the fix) — confirmed via `javascript_tool`, not
    just a screenshot.

Commit `aa0e4b0`. Pushed directly to `main` (unprotected; owner confirmed via prompt
before the push, same pattern as every prior session).

## What's NOT done — the remaining queue

The citation-audit queue (W1–W5) that started 2026-07-24 is now **fully done** — nothing
left from `handoff-2026-07-24-citation-audit-complete-wiring-queue.md`.

Still open from the separate MeningoVax-only followups plan
(`.claude/prompts/plan-2026-07-16-meningovax-followups.md`, not touched this session):
- **M1** — high-risk booster-cadence check may wrongly invalidate a legitimate infant
  primary-series dose (`validate.js`, `validateOneMenACWY()`). Re-confirm it still
  reproduces before fixing — the plan is over a week old and `validate.js` has had
  substantial changes since (risk-at-dose prompts, `fmtDays` routing, citation rewiring).
- **M2** — MeningoVax CLAUDE.md cleanup (stale session-history date range, etc.).
- **M3** — local branch cleanup (check if still applicable).

Also still open, separately: the cross-app parity port referenced in
[[project_pneumovax_ux_parity_reminder]] and [[project_menb_healthy_age16_gate]] memory —
vaxapp (PediVax) still owes a five-surface parity fix for the MenB healthy pre-16 age gate
that MeningoVax already shipped, and there's a broader batched UX-parity review the owner
wants done later, not piecemeal. Not evaluated this session.

## Why this is a good stopping point

W4 is a self-contained, test-first, live-verified clinical-logic fix: 358/358 tests green,
shipped to `main`, GitHub Pages deploy confirmed green. The citation-audit queue this
handoff traces back to (W1–W5) is now entirely closed out. M1–M3 are a separate, older
plan that needs re-verification before resuming — not a continuation of this queue.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. `npx vitest run` — confirm **358 passing** before any new work.
3. Ask the owner which queue to pick up next — M1 (a real suspected clinical bug in
   `validate.js`, needs re-confirmation first), M2/M3 (minor cleanup), or the vaxapp
   MenB-age16 parity port (different repo) are all independent. Don't default to any.
4. Per-item workflow: reproduce/verify (re-verify clinical source live if the rule may
   have changed) → failing test (both logic + UI layers if UI-observable) → minimal fix →
   full suite green → live-verify in the running app → commit named by item ID.
5. Ship: MeningoVax `main` is UNPROTECTED but ask before pushing — confirmed again this
   session (matches every prior session's pattern).
6. Dev server: `preview_start` name "MeningoVax dev server" — Vite auto-increments the
   port when others are in use; check `preview_logs` for the actual port rather than
   assuming the configured one in `.claude/launch.json`.
