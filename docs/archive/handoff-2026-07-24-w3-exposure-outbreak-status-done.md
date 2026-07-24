# MeningoVax — Handoff after W3 (exposure/outbreak status) (2026-07-24)

**Supersedes** `docs/archive/handoff-2026-07-24-citation-wiring-w1-w2-w5-done.md` for the
"what's next" pointer — that file's W1/W2/W5 remain done and accurate; W3 (its one open
item along with W4) is now also done. Do not resume W3 from that file.

Branch: `main`, pushed to `origin/main` at commit `b43edc6`. MeningoVax lives at
`~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`). Baseline this session was
**349 passing**; now **356 passing (8 files)**, all green, confirmed by running
`npx vitest run` just before writing this handoff. Working tree has only pre-existing
doc-only diffs/untracked files under `docs/archive/` (same ones noted in the prior
handoff, not touched this session) — no code changes outstanding.

Core promise of this app: **honesty** — a status label that lumps a transient travel dose
in with lifelong medical risk misleads a clinician about how long the indication lasts.

## Owner decision recorded this session (2026-07-24)

- **Exposure/outbreak badge color**: same purple as `risk-based` (`--p`, `#6a1b9a`) — only
  the status *word*/grouping changes, not the visual color. Asked explicitly via
  AskUserQuestion (three options: reuse teal, add a new slate color, or keep purple);
  owner chose purple. Do not revisit this without a new explicit ask.

## What's done this session

- **W3 — exposure/outbreak MenACWY status, distinct from risk-based.** Per the prior
  handoff's recorded scope decision (2026-07-23: travel + microbiologist get this label
  too, not just the transient one-and-done group), `src/logic/recommend.js`'s
  `menacwyRec()` now returns `status: 'exposure'` instead of `'risk-based'` for every
  branch under `riskClass === 'single+boost'` (travel, microbiologist) and
  `riskClass === 'single'` (military, college-dorm, A/C/W/Y outbreak) — 5 call sites
  total (lines ~188, 199, 230, 243, 261). `riskClass === 'primary2'` (asplenia, complement
  deficiency, HIV — ongoing medical risk) and all MenB high-risk branches are **unchanged**
  and still report `'risk-based'`.
  - `rec()`'s status-enum comment (line 61) updated to list `exposure`.
  - `src/App.css`: added `.status-badge.exposure { color: var(--p); }` next to
    `.status-badge.risk-based` (same color, per the owner decision above).
  - `src/components/RecCard.jsx`: updated the status-list comment at line 32; no logic
    change needed — `statusPillLabel()`'s fallback branch already handles any
    due-today status generically, and `timingClass()` doesn't special-case status by name.
  - **Tests (test-first):** added a new `describe('W3: ...')` block in
    `src/logic/__tests__/recommend.test.js` (7 new cases: travel no-dose, travel booster
    due, microbiologist, military, outbreak_acwy, college-dorm no-history, and a control
    case confirming asplenia is unaffected) — all failed before the fix, pass after.
    Updated 2 pre-existing college-dorm assertions in the same file that pinned the old
    `'risk-based'` value.
  - **Live-verified** in the running app (`preview_start` "MeningoVax dev server", actual
    port 5181 — Vite auto-incremented past the configured 5179/5180 due to other running
    servers): a 25-year-old college-dorm resident's MenACWY card badge reads
    `class="status-badge exposure"`, computed color `rgb(106, 27, 154)` (`#6a1b9a` = `--p`).
    A 25-year-old with asplenia still reads `class="status-badge risk-based"`, same
    computed color. Confirmed via `javascript_tool` reading `getComputedStyle`, not just
    a screenshot.

Commit `b43edc6`. Pushed directly to `main` (unprotected; owner confirmed via prompt
before the push, same pattern as every prior session).

## What's NOT done — the remaining queue

From `handoff-2026-07-24-citation-wiring-w1-w2-w5-done.md`:

- **W4 — Row 13 code trace.** Not a citation or status change. Confirm `recommend.js`
  actually handles the college-dorm "&gt;5 years since 16th birthday" sub-case
  (p2018.pdf lists it as a distinct scenario) — an earlier handoff said this was never
  traced and may fall through to a generic branch. Independent of W3 (which is now done);
  can be picked up next with its own test-first pass.

Also still open from the separate MeningoVax-only followups plan
(`.claude/prompts/plan-2026-07-16-meningovax-followups.md`, not touched this session):
- **M1** — high-risk booster-cadence check may wrongly invalidate a legitimate infant
  primary-series dose (`validate.js`, `validateOneMenACWY()`). Re-confirm it still
  reproduces before fixing; may be stale given how much validate.js has changed since
  2026-07-16.
- **M2** — MeningoVax CLAUDE.md cleanup (stale session-history date range, etc.).
- **M3** — local branch cleanup (check if still applicable).

Not evaluated this session whether M1/M2/M3 are still accurate — the plan is 8 days old
and validate.js has had substantial changes since (risk-at-dose prompts, fmtDays routing,
citation rewiring). Re-verify against current code before resuming, don't assume the
plan's line numbers or specifics still hold.

## Why this is a good stopping point

W3 is a self-contained status-enum change: implemented test-first, all 356 tests green,
live-verified in the browser for both the changed group (exposure) and the unchanged
group (risk-based/asplenia), and shipped to `main`. Per the owner's explicit
stop-after-each-phase request (recorded in the prior handoff), this is a deliberate pause
point, not a context-limit cutoff. W4 and the M1–M3 followups are independent of W3 and
of each other.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. `npx vitest run` — confirm **356 passing** before any new work.
3. Ask the owner which queue to pick up next — W4 (code trace, same repo, same citation-
   audit source doc) or the M1–M3 followups plan (different source doc, M1 is a real
   clinical bug but needs re-confirmation first) are independent; don't default to either.
4. Per-item workflow: reproduce/verify → failing test (both logic + UI layers if
   UI-observable) → minimal fix → full suite green → live-verify in the running app →
   commit named by item ID.
5. Ship: MeningoVax `main` is UNPROTECTED but ask before pushing — confirmed again this
   session (matches every prior session's pattern).
6. Dev server: `preview_start` name "MeningoVax dev server" — Vite auto-increments the
   port when others are in use; check `preview_logs` for the actual port rather than
   assuming the configured one in `.claude/launch.json`.
