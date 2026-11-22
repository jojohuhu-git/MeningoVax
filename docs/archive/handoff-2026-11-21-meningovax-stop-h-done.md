> **SUPERSEDED 2026-11-21** by `handoff-2026-11-21-meningovax-phase8-c2-c3.md`. PR #136 is merged and Q12 is answered; do not resume from this file.

# MeningoVax — Handoff after Q5 and STOP H (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-21-meningovax-mq6-brands-and-editor-note.md` (#134 and #135 are
merged).

Branch `docs/q5-keep-red-stop-h`, off `main` at `811e215` (#135). Six commits, **documents only — no
app code changed, 0 answers moved**. **2,439 passing (205 files)**, 0 failing (`npx vitest run`,
2026-11-21), the same as `main`. Pushed and opened as a PR against `main` (see the PR link in the
session's last message, or `gh pr list`); **the owner merges** (this repo runs no CI checks).

## What's done

1. **Q5 closed: "Keep red"** (`9610e51`). Checked PneumoVax first, as the owner asked: PneumoVax has
   no amber dose label; its "Not counted — do not repeat" is red (`dose-val-invalid`), and blue
   (`dose-val-offwindow`) means "set aside, nothing went wrong". The owner chose to keep red in
   both apps. Recorded in `decisions-2026-11-21-session1-small-fixes.md`; the 2026-11-19 amber
   approval and the 2026-11-20 reminder are marked reversed/closed. No code.
2. **STOP H done** — the owner's walk-through of `docs/agent/meningococcal-rules-summary.md`, five
   parts, all approved. Every answer and every fix, with evidence, is in
   `docs/archive/decisions-2026-11-21-stop-h-rulebook-review.md`. In short:
   - Part 1 (`e475748`): stale opening; a healthy 16-year-old with no MenACWY fell between bands
     ("17–21" → "16–21"); "ticked" → "checked".
   - Part 2 (`8d1e781`): MenB boosters "every 2 years" → "every 2–3 years" (the card's wording; the
     date and floor are 2 years). Also fixed in `docs/agent/clinical-rules.md`.
   - Part 3 (`da01812`): the combined shot has no upper age (owner C4) — now written in;
     `owner:C4` added to `src/data/rulebook.js` (the generator's owner-answer list).
   - Parts 4–5 (`deef647`): "set aside like that" names the dose (D2); label table moved to the
     end of section 4; a missing full stop; the "Where this is implemented" list now names
     `doseRules.js`, `seriesTotals.js`, `intervals.js`, `ages.js` and the rulebook files.
   - `8b27c0d`: CLAUDE.md "Current Work" and the port plan mark STOP H done.
   The in-app Rulebook screen was checked for each fix and needed none (it already had the 16–18
   row, "every 2–3 years", and "10 years or older").

## What's NOT done — the remaining queue

1. **Owner merges this PR.** Check `origin/main` before calling it merged.
2. **Phase 8 — citations** (`docs/archive/plan-2026-11-08-meningovax-port.md`, "Phase 8"), not
   started. It opens with **Q12**: does the owner's PneumoVax delegation "same dose, decide alone"
   (memory `owner-decides-alone-when-dose-unchanged`, PneumoVax's) carry over to MeningoVax? Ask it
   first, alone, before any Phase 8 work. Then C2–C13 in PneumoVax's order, one PR per document,
   each document read whole (tables included) before anything comes off a card; STOP after each
   document where a removal or a no-row case needs her.
3. **Phase 9** (close), after Phase 8. Not started.
4. Separate PneumoVax session (from earlier handoffs): "Tick this…", design parity L1–L4/L7 and
   P71, and whether PneumoVax's Rules screen follows this Rulebook layout. Draw a before/after
   first. Not started.

## Why this is a good stopping point

Every open owner question is answered and STOP H, a whole gate of the port plan, is closed. The
PR holds only document changes, all approved part by part. Phase 8 starts with a question (Q12),
so nothing can be built until she answers it.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If the PR is merged: `git checkout main && git pull`; the suite should show **2,439 / 205 files**.
2. `preview_start {name: "MeningoVax dev server"}`.
3. Ask Q12 (above). Ask, don't default.
4. Per item: read the source live (`verify-clinical-source`) → failing test → fix → full suite →
   live check → commit named by ID. A moved answer must be explained (`npm run sweep:update`;
   wording with `npm run prose -- dump` / `diff`). After touching a rule or a quote, run
   `npm run rulebook` — and keep each rule paragraph in sections 1–3 directly above its
   `<!-- SOURCES -->` tag (a blank line between them fails `rulebook-table-matches-code.test.js`).
   E4 checklist in every PR body.
5. Ship: branch off `main`, PR against `main`; the owner merges.
