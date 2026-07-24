# MeningoVax — Handoff after all four build changes shipped (2026-07-24)

Branch: `main`, off `main` (this repo has no branch protection). **Pushed** — `main` and
`origin/main` both at commit `0ec3f22`. MeningoVax lives at `~/Downloads/MeningoVax-main`
(vite base `/MeningoVax/`; folder is **cloud-synced** — commit early, watch for silent
reversion). Live site: https://jojohuhu-git.github.io/MeningoVax/ (deploy workflow was
`[pending]` as of this write-up — confirm it finished green before telling the owner it's
live: `gh run list --limit 2`).

Baseline this session was 365 passing tests (29 files). Now **373 passing**, all green,
working tree clean of code changes at commit `0ec3f22`. (The tree shows modified/untracked
files under `docs/archive/` — these are pre-existing in-flight doc threads from other
sessions, not touched this session; same note every prior handoff in this chain has
carried.)

## What's done

All four items from the original brainstorm
(`docs/archive/handoff-2026-07-24-four-build-changes-spec.md`) are now complete:

- **Change 1** — moved "No previous doses" shortcut from Alt/Cmd+N to Ctrl/Cmd+E.
  Commit `f089625`. (Done in an earlier session this chain started from.)

- **Change 3** — chips never show a dose number greater than the series total (D2-before-16
  off-window fix). Commit `3172a0a`. (Done in an earlier session this chain started from.)

- **Change 4** — reference numbering. `recommend.js` previously hardcoded
  `cite(1, key)`/`cite(2, key)` per note, so the same source could render under a
  different number depending on which note cited it, and a future edit could silently
  mis-number a note. Fixed: `cite(key)` now carries just the source key (+ its plain page
  URL); note text uses a generic `[c]` placeholder; `RecCard.jsx`'s
  `renderNoteWithCites()` assigns the visible `[N]` number at render time, by order of
  first mention. **Scope grew mid-session per owner correction**: numbers are deduped by
  the underlying source **page**, not by citation key — two citation keys that quote
  different sentences on the same MMWR page now share one `[N]`, while each marker keeps
  its own deep-link href and hover-quote text. Touched `src/data/refs.js`,
  `src/logic/recommend.js` (~26 call sites), `src/components/RecCard.jsx`, and 4 test
  files. Live-verified: the high-risk 11-year-old MenACWY note shows two `[1]`
  superscripts (same MMWR page, different sentences) with distinct hrefs/tooltips,
  confirmed via the rendered DOM. Commit `97ec709`.

- **Change 2** — age-10 MenACWY footnote, **plus a real status bug found while scoping
  it**. Verified live (immunize.org Ask the Experts,
  https://www.immunize.org/ask-experts/topic/menacwy/): "ACIP considers a dose of
  MenACWY given to a 10-year-old child to be valid for the first dose in the adolescent
  series." / "Doses given before age 10 years should not be counted." Testing that
  scenario in the running app surfaced a genuine contradiction: a healthy patient still
  under 11, with a valid age-10 MenACWY dose on file, saw the card headline read
  "Not yet due" / "No routine dose is indicated" while the Recorded panel's own chip on
  the same card said "Counts" — because `menacwyRoutine()`'s under-11 branch in
  `recommend.js` returned that status unconditionally, never checking whether a dose had
  already been given. Fixed together with the footnote (owner decision, confirmed via
  AskUserQuestion before writing code): the under-11-with-a-dose-on-file case now routes
  to the same "Booster due at 16y" outcome an 11–15y patient with dose 1 recorded gets,
  plus a new citation (`acwyAge10CountsAsDose1`) explaining why no repeat dose is needed.
  The 11–15y "dose 1 recorded" branch gets the same footnote when its one dose was given
  at age 10 specifically (not the routine 11–12y age). Other edge cases from the original
  ask needed no new work — first dose at 13–15y (unremarkable, generic citation already
  applies), first dose at ≥16y (already has its own dedicated note+citation), D2-before-16
  (already shipped as Change 3). Live-verified: the exact 10y6m/age-10-dose scenario that
  showed the contradiction now reads "Booster due at 16y" with a working citation link.
  Commit `0ec3f22`.

## What's NOT done — nothing from this queue

The four-change brainstorm queue is fully closed. No open items remain from it.

## Other things noticed but explicitly out of scope this session

- **Do NOT touch vaxapp/PneumoVax.** Owner is doing the batched cross-app port herself
  after MeningoVax is finalized (standing 2026-07-23 decision) — see memory note
  `project_meningovax` / `project_menb_healthy_age16_gate` in the owner's cross-session
  memory if picking this up from a different repo's session. vaxapp still has a confirmed,
  separate MenB healthy-pre-16 parity bug (not this session's Change 2 — a different
  vaccine and a different bug) that has never been started there.
- The `rtk` PreToolUse output-compression hook status was not checked this session
  (no Bash output volume issue arose). If a future session hits large uncompressed Bash
  output, see memory note `project_rtk_hook`.

## Why this is a good stopping point

All four originally-scoped changes are complete, committed individually, pushed to
`origin/main`, and live-verified in the running app (not just tests) — Change 2 in
particular was tested end-to-end in the browser both before the fix (to confirm the bug)
and after (to confirm the fix), not just via the unit suite. Nothing is mid-edit. The
queue that motivated this session is empty; whatever comes next is a new piece of work,
not a continuation.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull` (should already be
   up to date — this session ended with `main` and `origin/main` both at `0ec3f22`).
2. `npx vitest run` — confirm **373 passing (33 files)** before any new work. If the count
   differs, stop and reconcile before proceeding.
3. Confirm the GitHub Pages deploy for `0ec3f22` finished green
   (`gh run list --limit 2`) before telling the owner the site reflects this session's
   work — it was still `[pending]` when this handoff was written.
4. No open owner decisions block starting new work — this queue closed cleanly. If the
   owner wants the next piece of work, ask what it is rather than assuming a queue exists;
   there isn't one recorded here.
5. Per-item workflow for any new vaccine-logic or code work: verify the clinical source
   live (`verify-clinical-source` skill) → reproduce/confirm the issue → failing test
   (synthetic fixture, never real patient data) → minimal fix → full suite green →
   live-verify in the running app (`preview_start` name `"MeningoVax dev server"`) → one
   commit per logical change.
6. Ship: MeningoVax `main` is UNPROTECTED but the owner has been asking before each push
   this session and approving each one — keep that pattern (branch → PR → squash, or
   direct push with explicit sign-off each time) rather than defaulting silently.
