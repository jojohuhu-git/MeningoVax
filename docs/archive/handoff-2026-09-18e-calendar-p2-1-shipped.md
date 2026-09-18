# MeningoVax — Handoff after calendar P2-1's remainder was shipped (2026-09-18)

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor (MenACWY + MenB +
pentavalent), browser-only, no backend, live at https://jojohuhu-git.github.io/MeningoVax/.
Its core promise is **honesty**: a silently wrong answer is worse than a crash.

**This supersedes `handoff-2026-09-18d-utc-dob-picker-fixed.md`**, which now carries a
banner pointing here.

## State, verified just now — not remembered

| | |
|---|---|
| `origin/main` | **8aff5b4** — PR #50 |
| Suite | **1464 passing, 496 test files, 0 failing, 0 failed test suites** |
| Working tree (this checkout) | On branch `fix/2026-09-18-calendar-p2-1-today-in-one-place`, which tracked `origin/main`, made the change, and is now merged — content is identical to `origin/main` |
| Open PRs | none |
| Deploy | not separately confirmed this session (no user-visible copy changed, only prop plumbing) — worth a spot-check next session if that matters before relying on the live site |

## What's done

**PR #50 — calendar P2-1's remainder: `today` is read from the clock once per render
(`App.jsx`), not five independent times.**

Before this: `StepAge.jsx`'s date-of-birth picker, `DoseEditor.jsx`'s dose-date picker
(used on both the MenACWY/MenB history-entry steps AND the Results record-panel editor),
`RecCard.jsx`'s age-at-dose display, and `recommend()`'s own `todayISO(input.today)`
fallback each called `todayISO()` for themselves. They agreed with each other only
because a synchronous render happens inside one JS instant — nothing in the code made
them agree. (The queue's own P1-3 already closed the actual *hazard* this could cause,
a tab left open across midnight; this item was the structural tidy-up P2-1 was filed
for, in the same "one number, one home" spirit as `intervals.js` and `seriesTotals.js`.)

Fix: `App.jsx` now computes `const today = todayISO();` once per render and passes it
down as a `today` prop through `StepAge`, `StepHistory` (which passes it to
`DoseEditor`), and `Results` (which threads it into `recommend({ ..., today })` and
passes the resolved `meta.today` back down to `RecCard`/`DoseEditor` for the
record-panel editors). Every prop falls back to the component's own `todayISO()` read
when omitted, so the ~25 existing tests that mount these components in isolation needed
no changes.

**How it was verified** — this is a structural fix that the suite's own global clock
freeze (`test-setup.js`, every test pinned to the same instant) makes impossible to
catch by waiting for time to pass. Instead: a new test
(`regression-calp2-1-today-in-one-place-ui.test.jsx`) injects a `today` value the frozen
test clock does **not** have, and asserts each component's visible output (picker `max`,
computed age, the "date is in the future" flag) follows the injected value rather than
silently falling back to its own clock read. Confirmed failing against the pre-fix
wiring first (`git stash` the six changed files, re-run, watch it fail; `git stash pop`
to restore), then green after. Also live-verified end to end in the running dev server:
entered a date of birth, confirmed the age badge, the dose-date picker's `max`, and the
record panel's "age at dose" line all agreed with the real clock — no console errors.

## What's NOT done — the remaining queue

Same two items named in the previous handoff, both from
`docs/archive/fix-2026-09-17-calendar-and-dates.md`, unchanged by this session:

| # | ID | Scope |
|---|---|---|
| 1 | **P2-2** | Age-at-a-past-dose can be up to 3.2 days out because two fractions use different month lengths (`calendarMonthsBetween` asymmetry). CDC's 4-day grace absorbs it for dose validity in every case measured; visible only in the printed "~age" text. |
| 2 | **P2-3** | Month-end grace is effectively 7 days rather than 4 (**deliberate**, not yet revisited); a product recorded before it existed; `NaN`/`Infinity` ages (**not reachable through the UI** — robustness only, no user-facing bug). |

**The P1-class queue is still empty.** What's left is P2-2, P2-3, and the rulebook v6
below (docs, not code) — same three options the previous handoff offered, minus the one
just done.

## Owner decisions on record — apply, do NOT re-ask

Unchanged from the previous handoff:

1. **Impossible P1-2 is a note, never a block** — shipped (PR #46).
2. **Floors:** under 10 years for microbiologist / military / college_dorm (ACIP's own
   row, cited), under 9 years for pregnancy (uncited judgement). Do not revert to the
   drafted 16/17/16.
3. **The PneumoVax card-copy port stays deferred** ("do not touch PneumoVax").
4. **The vaxapp meningococcal ports stay on hold.** The two apps knowingly differ; never
   port piecemeal. (Separately: this session also worked in vaxapp on its OWN parity
   queue — `.claude/prompts/fix-2026-09-15-meningo-parity-ports-from-meningovax.md` in
   `~/Downloads/vaxapp-main` — but the owner asked to leave vaxapp/PneumoVax alone for
   the rest of this session, so that work was paused, not shipped. See vaxapp's own
   memory/handoff for its state; nothing about it changed here.)
5. **Merging: ask each time.** She approved this session's merge (PR #50) when asked.
   Still no standing rule.

## Also still needs doing

The **clinician rulebook artifact** (v5,
https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss) says in section 08 that there are no
open gaps. Stale since 2026-09-17, now ten fixes behind (#38–#50, this session's PR
included). Still needs a v6.

## Why this is a good stopping point

PR #50 is a complete, independently-verified unit: its own behavioral test (proven to
fail pre-fix), full suite green, live-verified in the browser, merged. Nothing is
half-built. `origin/main` is green at 1464. The remaining queue (P2-2, P2-3, rulebook
v6) is unchanged and independent of what shipped.

## Resuming

1. `cd ~/Downloads/MeningoVax-main`. `main` is still checked out in a stale agent
   worktree under `.claude/worktrees/elated-thompson-4bc583` (7+ commits behind,
   carrying a pile of odd staged deletions — flagged to the owner this session,
   untouched, not investigated further). This makes `git checkout main` **fail
   locally** — branch off `origin/main` instead
   (`git checkout -b <name> origin/main`), same as this session did.
   `gh pr merge` printed no output after merging PR #50 — the merge still went through
   (checked via `gh pr view --json state,mergedAt`); don't assume silence means failure,
   but don't assume success either — check.
2. Run `npx vitest run` and confirm **1464 passing** before touching anything. Check
   `numFailedTestSuites`, not just failed tests.
3. Other chats may still be running dev servers on this folder (cap is 5 per folder;
   it was AT the cap this session) — check with `lsof -nP -iTCP -sTCP:LISTEN` before
   starting a new one, and browse an existing one (any port serving "MeningoVax —
   Meningococcal Vaccine Advisor") if the cap is hit; they all serve this same
   directory, so file edits reach them via HMR regardless of which chat started the
   server. Do not kill another chat's server.
4. **Ask which item to start with** — but do not re-open the five decisions above. The
   choices are: P2-2 (age-at-dose precision), P2-3 (month-end grace / robustness), or
   the rulebook v6 (docs only).
5. Per item (`fix-queue` skill): reproduce → failing test first (both layers when the
   bug has a logic-layer component; UI-only when it doesn't) → fix → full suite green
   (quote the real number) → drive the running app → commit named by the item ID.
6. A green suite is not proof by itself for anything clinical — a wide differential
   sweep and driving the browser both still apply, same as always. This session's fix
   was pure UI plumbing (no clinical rule touched), which is why a differential sweep
   wasn't run for it — the next item may need one.
7. Push policy: branch → PR → squash merge (no protection on this repo, but this is the
   established habit) — and **ask before merging**.
