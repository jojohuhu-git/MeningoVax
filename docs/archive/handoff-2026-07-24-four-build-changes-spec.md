# MeningoVax — Handoff: four owner-finalized build changes, brainstormed & ready to build (2026-07-24)

> **SUPERSEDED** by `docs/archive/handoff-2026-07-24-changes-1-3-done-2-4-remaining.md`.
> Changes 1 and 3 (below) are now shipped (commits `f089625`, `3172a0a`); Changes 2 and 4
> remain. Resume from the newer file, not this one.

Branch: `main`, clean of **code** changes (only untracked/modified docs in the tree, from
other in-flight doc threads — not touched here). MeningoVax lives at
`~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`; folder is **cloud-synced** — commit
early, watch for silent reversion). Live site: https://jojohuhu-git.github.io/MeningoVax/

**Baseline: 358 passing tests (27 files), all green** (`npx vitest run` → `PASS (358) FAIL (0)`)
at the tip of `main` (`git log` top = `e84864d`, the Ctrl/Cmd+Y + Alt/Cmd+N shortcut commit).

**This session made ZERO code/test changes.** It was a brainstorm that finalized four
changes with the owner. Every clinical claim below must still be re-verified live per the
`verify-clinical-source` skill before any wording is written. Core app promise: **honesty** —
a chip/label that quietly implies "fine, nothing to do" when it isn't is the worst bug.

Owner's plan: finalize these four in MeningoVax **first**, then do a **batched overhaul of
vaxapp + PneumoVax** to follow the same build changes (do NOT port piecemeal — consistent
with the standing 2026-07-23 batched-cross-app decision). #2 and #3 are meningococcal
clinical logic that vaxapp mirrors — flag them for that later batch, don't fix vaxapp now.

## The four changes (all owner-decided, not started)

### Change 1 — Move "No previous doses" shortcut off N, to **Ctrl/Cmd+E**
- **Why:** Cmd+N (Mac) / Ctrl+N (Win) are handled by the browser *before* the page (new
  window) and can't be caught. Owner wants one key that works cross-platform. Decision
  locked: **E** ("Empty"). N, T, W (and Mac Cmd+Q/M/H) are the only un-catchable letters;
  every other letter — incl. E — is catchable (the app already overrides Cmd/Ctrl+A).
- **Where:** `src/components/StepHistory.jsx:31` — `(e.altKey || e.metaKey) && key === 'n'`
  → key `'e'`, drop the `altKey` alias (no more Alt/Cmd+N). Update the comment at ~line 22–24
  and any on-screen shortcut hint text (commit `e84864d` styles a Ctrl/Cmd+A hint as text —
  check for a matching Y/N hint to update).
- **Verify:** drive the live app, confirm Cmd+E is fully suppressed (preventDefault) in the
  in-app Chromium; reason about Edge/Firefox/Safari since they can't be tested here.

### Change 2 — Footnote: a MenACWY dose given at age 10 **counts** as adolescent dose 1
- **Why:** prevents a provider giving an *unnecessary repeat at 11* when a dose was given at
  10. Owner confirmed this is instructive, not clutter. Show it only on doses in the
  10-to-just-under-11 window.
- **ACIP source is ALREADY live-fetched** (row 4 of
  `docs/archive/handoff-2026-07-24-citation-references-verified-not-wired.md`): immunize.org
  Ask the Experts — *"ACIP considers a dose of MenACWY given to a 10-year-old child to be
  valid for the first dose in the adolescent series."* / *"Doses given before age 10 years
  should not be counted."* **Re-verify live** before wiring.
- **Scope catch:** this rule's per-dose message lives in `validate.js`'s `reasons` array, NOT
  in `RecCard`'s `note` block — so the existing C5 subscript-link mechanism (`ACIP_ANCHORS`
  in `refs.js`, `noteCites`, `renderNoteWithCites()` in `RecCard.jsx`) does **not** reach it
  yet (see scope note in `handoff-2026-07-24-c5-subscript-links-merged.md`). Adding a linked
  citation here means extending the marker mechanism into `validate.js` reasons, or surfacing
  the note where `RecCard` can render it.
- **Also owed:** owner wants a **full verified edge-case list** of other late/early scenarios
  that deserve the same kind of footnote. Bring the list *before* writing wording. Candidates
  to confirm against ACIP (do NOT assert from memory): first dose at 13–15y → booster still
  due at 16–18; first dose at ≥16y → **no** booster needed; the D2-before-16 case (Change 3).

### Change 3 — Chips never show N > M; an early 2nd MenACWY dose → **"Off-window – repeat"**
- **Symptom (from owner's live example):** D1 = May 8 2020 @ 10y6m MenQuadfi shows green
  "Dose 1 of 1" (correct). D2 = Jul 16 2021 @ 11y8m (brand unknown) shows green **"Dose 2 of
  1"** — WRONG. D2 is an extra dose given too early to be the 16y booster; it doesn't advance
  the series, and the header already (correctly) says "Booster due today."
- **Rule (locked):** a chip must never show a number greater than the total. A counting dose
  = green "Dose N of M" (N ≤ M). A safe-but-non-advancing dose = amber **"Off-window –
  repeat"** — the category **already exists** (`RecCard.jsx:104-108`, class
  `dose-val-offwindow`, driven by `result.notAdolescentCount`) — plus an explanation +
  reference, and **no number**. No new chip variants (owner explicitly doesn't want more).
- **Fix:** the engine currently gives D2 `effectiveDoseNum: 2` / `status: 'valid'`. Route the
  early-second-adolescent-dose case to the amber bucket instead (set `notAdolescentCount` or
  equivalent so it stops being counted). Investigate the last-kept walk in `src/logic/
  validate.js` and `seriesTotal` in `src/logic/recommend.js`. (Note: `validate.js` already
  sets `notAdolescentCount` for MenACWY-before-10 and MenB-before-16 — mirror that path.)
- **Verify:** both logic + UI layers, test-first; confirm no dosing/`doseLabel`/booster values
  shift as a side effect. This is a clinical-logic change → re-verify the ACIP counting rule
  live first.

### Change 4 — References: dedupe + number by **order of first mention** per recommendation
- **Symptom:** the same source shows *different* numbers because each note numbers its own
  citations locally — `recommend.js` hardcodes `cite(1, key)`, `cite(2, key)` per note — so
  e.g. the MenACWY routine ref always renders as [1] inside its note regardless of order.
- **Rule (locked):** numbering is computed **per rendered recommendation, by order of first
  mention, deduped**; a re-citation of the same source **reuses its number**; hover text may
  differ across occurrences while the number stays the same. **Scope = one shared ordered
  list across the whole recommendation output** (owner: "MenACWY should not be #1 for every
  patient — only when it's mentioned first in that particular recommendation").
- **Fix:** move numbering out of per-note `cite(N, key)` into a **central render-time
  registry** that walks the notes in render order and assigns/reuses numbers. Touches
  `src/logic/recommend.js` (stop hardcoding N — emit source keys, not numbers),
  `src/components/RecCard.jsx` `renderNoteWithCites()` (assign from the registry), and
  wherever the reference list at the bottom is rendered. Mechanism context: `ACIP_ANCHORS`
  in `src/data/refs.js`, the `noteCites` field, and `renderNoteWithCites()` (all from the C5
  work in `handoff-2026-07-24-c5-subscript-links-merged.md`).

## Why this is a good stopping point
The four changes are independent of each other and of the in-flight citation-wiring queue.
All owner decisions are made (E; add the 10y footnote + edge-case list; amber "Off-window –
repeat" with no over-total numbers; global first-mention reference numbering), so the next
session can build test-first without re-deriving intent. Nothing is mid-edit.

## Resuming
1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. `npx vitest run` — confirm **358 passing (27 files)** before any new work.
3. Start the dev server for live-verification: `preview_start` name **"MeningoVax dev server"**.
4. For **#2 and #3** (clinical logic): run `verify-clinical-source` and re-fetch the ACIP /
   immunize.org rules **live** before writing — the row-4 quote above is a lead, not ground
   truth. Produce the Change-2 edge-case list for the owner **before** coding wording.
5. Per-item workflow: reproduce → failing test (logic + UI layers for anything visible) →
   fix → full suite green → live-verify in the running app → **one commit per change**.
   Suggested order: #1 (isolated) → #3 (chip logic) → #2 (footnote + edge list) → #4 (ref
   renumbering refactor).
6. **Do NOT touch vaxapp/PneumoVax** — owner is doing that as a separate batched overhaul
   after MeningoVax is finalized. Just note which changes are meningococcal-logic parity
   candidates (#2, #3).
7. Ship: MeningoVax `main` is UNPROTECTED but owner prefers branch → PR → squash-merge —
   **ask before pushing/merging** (per the `ship` skill), as every prior session has.
