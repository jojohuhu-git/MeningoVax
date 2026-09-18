# MeningoVax — Handoff after the UTC date-of-birth picker bug was fixed (2026-09-18)

**SUPERSEDED by `handoff-2026-09-18e-calendar-p2-1-shipped.md`.** Read that one instead.

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor (MenACWY + MenB +
pentavalent), browser-only, no backend, live at https://jojohuhu-git.github.io/MeningoVax/.
Its core promise is **honesty**: a silently wrong answer is worse than a crash.

**This supersedes `handoff-2026-09-18c-risk-age-note-shipped.md`**, which now carries a
banner pointing here. This session merged that handoff's own PR (#47), then fixed the one
open thread it flagged: the UTC date-of-birth picker bug.

## State, verified just now — not remembered

| | |
|---|---|
| `main` | **3d49f89** — PR #48 |
| Suite | **1459 passing, 495 test files, 0 failing, 0 failed test suites** |
| Working tree | clean; this handoff is the only uncommitted thing |
| Open PRs | none |
| Branch | `docs/2026-09-18-dob-picker-handoff` — this handoff only |
| Deploy | GitHub Actions "Deploy to GitHub Pages" run **succeeded**; spot-checked live with `?cachebust=` |

Baseline at the start of the session was **1457 passing / 493 files**, matching the
previous handoff exactly. PR #47 (that handoff document) was merged first, then PR #48.

## What's done — by item

| PR | What changed |
|---|---|
| **#47** | Merged the previous session's handoff document — no code. |
| **#48** | **The UTC date-of-birth picker bug**, the loose thread flagged (not chased) in the previous handoff: late in the US evening, a date of birth of today-in-UTC was rejected as "in the future." Cause found: `StepAge.jsx`'s Date of Birth field computed its picker's `max` with `new Date().toISOString().slice(0, 10)` — UTC — while the actual validator, `ageEntryProblem()`, has always correctly used `todayISO()` (local clock). UTC rolls to tomorrow's date hours before any US timezone does, so for that stretch every evening the picker would *let* a date be chosen that the app then refused. `DoseEditor.jsx`'s dose-date field hit this exact bug before and was fixed (its "G3" comment); `StepAge.jsx`'s field never got the same fix — now it does, same helper. **No clinical rule changed** — this only affects which dates the picker itself will offer. New test: `src/components/__tests__/regression-dob-max-local-not-utc-ui.test.jsx`, clock pinned to `2026-09-17T23:09:00` local (Pacific) to reproduce the UTC/local divergence; failed against pre-fix code (`2026-09-18` vs. wanted `2026-09-17`), passes after. No logic-layer test needed or added — `todayISO()` itself was already correct and already tested; the defect was only that this one call site didn't use it. |

Reproduced by reading the code (the divergence is deterministic, not timing-dependent —
no live UTC-evening window was needed to catch it), then a failing test with the clock
pinned to a US-evening moment, then the fix, then the full suite, then driven live in both
a local dev server (HMR-verified) and the deployed site (`max` attribute read directly via
`javascript_tool`, matched the local date in both).

## What's NOT done — the remaining queue

Both queue files are on `main` in `docs/archive/`: `fix-2026-09-17-calendar-and-dates.md`
and `fix-2026-09-17-impossible-entries.md`. Unchanged by this session.

| # | ID | Source | Scope |
|---|---|---|---|
| 1 | **calendar P2-1** (remainder) | calendar | `todayISO()` is still read from four independent call sites per render (`format.js`, `validate.js`, `RecCard.jsx`, `DoseEditor.jsx`) → one. The *hazard* was closed by #42; this is the tidy-up only. |
| 2 | P2s | both | Month-end grace effectively 7 days (**deliberate**); a product recorded before it existed; `NaN`/`Infinity` ages (**not reachable through the UI** — robustness only). |

**The P1-class queue is still empty.** Everything left is P2, plus the rulebook artifact
below (docs, not code).

### The loose thread from the previous handoff is now closed

It is no longer a loose thread — see PR #48 above. Nothing new was noticed this session
in its place.

## Owner decisions on record — apply, do NOT re-ask

Unchanged from the previous handoff:

1. **Impossible P1-2 is a note, never a block** — shipped (PR #46).
2. **Floors:** under 10 years for microbiologist / military / college_dorm (ACIP's own
   row, cited), under 9 years for pregnancy (uncited judgement). Do not revert to the
   drafted 16/17/16.
3. **The PneumoVax card-copy port stays deferred** ("do not touch PneumoVax").
4. **The vaxapp meningococcal ports stay on hold.** The two apps knowingly differ; never
   port piecemeal.
5. **Merging: ask each time.** She merged #47 and #48 in-session when asked (again,
   working around the same worktree quirk below). Still no standing rule.

## Also still needs doing

The **clinician rulebook artifact** (v5,
https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss) says in section 08 that there are no
open gaps. That has been stale since 2026-09-17 and is now further out — nine fixes since
(#38–#48), not eight. Still needs a v6.

## Why this is a good stopping point

The UTC-picker fix is a complete, independently-verified unit — its own test, its own
commit, its own PR, deployed and spot-checked live. Nothing is half-built. `main` is green.
The remaining queue (P2s + rulebook) is unchanged and independent of what shipped.

## Resuming

1. `cd ~/Downloads/MeningoVax-main`. `main` is checked out in an agent worktree under
   `.claude/worktrees/` (stale), which makes `git checkout main` **fail locally** — branch
   off `origin/main` instead (`git checkout -b <name> origin/main`), same as this session
   did twice. `gh pr merge` prints the same worktree error *after* merging successfully on
   GitHub — check `gh pr view --json state,mergedAt` before believing a merge failed. It
   did so again this session, on PR #48.
2. Run `npx vitest run` and confirm **1459 passing** before touching anything. Check
   `numFailedTestSuites`, not just failed tests.
3. Other chats may still be running dev servers on this folder (cap is 5 per folder) —
   check with `lsof -nP -iTCP -sTCP:LISTEN` before starting a new one, and browse an
   existing one if the cap is hit; they all serve this same directory, so file edits
   reach them via HMR regardless of which chat started the server. Do not kill another
   chat's server.
4. **Ask which item to start with** — but do not re-open the five decisions above. The
   choices are: calendar P2-1 remainder, the small P2s, or the rulebook v6 (docs only).
5. Per item (`fix-queue` skill): reproduce → failing test first (both layers when the bug
   has a logic-layer component; UI-only when it doesn't, as with PR #48) → fix → full
   suite green (quote the real number) → drive the running app → commit named by the item
   ID.
6. A green suite is not proof by itself for anything clinical — a wide differential sweep
   and driving the browser both still apply. PR #48 didn't need a clinical sweep (no
   recommendation logic touched), but the next clinical-rule item will.
7. Push policy: branch → PR → squash merge (no protection on this repo, but this is the
   established habit) — and **ask before merging**.
