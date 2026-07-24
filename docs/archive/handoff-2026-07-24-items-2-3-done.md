# MeningoVax — Handoff after shipping Items 2 and 3 (2026-07-24)

**Partially supersedes `docs/archive/handoff-2026-07-24-c5-subscript-links-merged.md`** —
that file's "Item 2" and "Item 3" queue entries are done as of this session; its other
remaining-queue entries (chip-relabeling, vaxapp MenB parity, parked UX #4, broader C5
coverage) are unaffected and still open. Do not resume Items 2/3 from that file.

Branch: `main`, pushed to `origin/main` at commit `627ac64`. MeningoVax lives at
`~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`, folder is **cloud-synced** —
commit early, watch for silent reversion). Live site (confirmed 200, GitHub Pages deploy
run `30103133632` green): https://jojohuhu-git.github.io/MeningoVax/

Baseline this session was 340 passing tests; now **349 passing**, all green, working tree
clean of code changes at commit `627ac64` (same pre-existing untouched doc-only diffs as
prior handoffs remain — not touched this session).

Core promise of this app: **honesty** — a permanent answer with no way back, or an
interval stated twice in two units, both erode trust in what the app is telling a
clinician.

## What's done this session (by item ID, from the 2026-07-23 "four scoped items" handoff)

1. **Item 3 — drop redundant raw-day precision, route through `fmtDays()`.** Every raw
   `${days} days` interpolation in `src/logic/validate.js`'s interval/booster-cadence
   checks (both the detail lines and the reason-text parentheticals like `"(28 days)"`)
   now goes through the existing `fmtDays()` helper, so an interval is stated once, in
   clean units. Sites: MenACWY high-risk primary interval, MenACWY high-risk booster
   cadence, MenACWY baseline ≥4wk, MenB high-risk D2, MenB high-risk D3 (from D1 and D2),
   MenB booster cadence, MenB rescue D3. One stale test assertion pinning the old
   `"28 days"` wording was removed (`validate-new-rules.test.js`). New regression test:
   `src/logic/__tests__/regression-item3-fmtDays-consistency.test.js` (3 tests). Live-
   verified: a 10-day-apart MenACWY pair now shows "Given only 10 days after the previous
   dose. Minimum interval between any two MenACWY doses is 4 weeks." and "Actual interval:
   10 days. Minimum: ~4 weeks." — no duplicate raw-day parenthetical. Commit `25dcb09`.
2. **Item 2 — edit/undo for the "Needs input" risk-at-dose prompt.** The resolved chip on
   a dose that was once "Needs input" now shows a small **"Edit"** link
   (`.dose-val-edit-link` in `src/App.css`); clicking it re-opens the same Yes/No/Not-sure
   prompt in place, and picking a new answer replaces the stored one and closes the prompt
   back to the resolved chip. Implementation: `DoseValidation()` in `RecCard.jsx` gained
   local `editing` state; `RecCard` now takes a `riskAtDoseAnswers` prop (the raw
   `{sortedIndex: answer}` map) from `Results.jsx` so it knows which dose rows have a
   stored answer; since a resolved validator result no longer carries
   `promptDate` (see `validate.js`), the re-opened prompt falls back to the dose's own
   recorded date (`doseDate` prop). New tests: `src/components/__tests__/regression-item2-
   risk-at-dose-edit.test.jsx` (5 UI tests) plus one end-to-end test appended to
   `Results.test.jsx` (Yes → Edit → No flips the dose to off-window through real state).
   Live-verified in the running app: answered "Yes" on a pre-age-10 high-risk dose,
   clicked "Edit", re-answered "No", chip flipped from "Dose 1 of 2" to
   "Off-window - repeat" and back to a fresh "Edit" link, no dangling prompt state.
   Commit `627ac64`.

Both items pushed directly to `main` (MeningoVax has no branch protection; owner confirmed
via prompt before the push). GitHub Pages deploy confirmed green after push.

## What's NOT done — the remaining queue

Unchanged from `handoff-2026-07-24-c5-subscript-links-merged.md`, not touched this session:
- **Chip-relabeling** (amber "Valid (off-window)" reads as "fine" when it should read as
  "doesn't count, repeat") — plan agreed in
  `handoff-2026-07-23-compliance-chip-risk-timing-design.md`, owner wants a fresh
  conversation to brainstorm before building.
- **vaxapp five-surface MenB parity fix** — the same healthy-MenB-before-16 non-counting
  bug MeningoVax fixed as P0-1 is still present in `~/Downloads/vaxapp-main`. Needs its
  own session; touches 5 recommendation surfaces + `compliance.js`.
- **Parked UX #4** (put status words directly on cards, don't rely on the color key) —
  not started.
- **Broader C5 coverage** (more subscript anchors, or extending the citation-marker
  mechanism to `validate.js`'s per-dose `reasons` array) — not started.
- **Cross-app port**: none of this session's changes were ported to PneumoVax or vaxapp —
  per standing owner decision (2026-07-23), that's a batched cross-app review later.

## Why this is a good stopping point

Both items were independent, fully scoped, owner-decided items from the "four scoped
items" handoff — no further design conversation needed for either. Both are tested at both
layers (logic + UI where visible), full suite green (349/349), live-verified in the
running app, and deployed. Nothing is mid-edit. The remaining queue items are unrelated to
what shipped and don't depend on it.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. `npx vitest run` — confirm **349 passing** before any new work.
3. Ask the owner which thread to start (don't default): chip-relabeling (brainstorm
   first, per owner's request), vaxapp MenB parity, parked UX #4, or broader C5 coverage.
4. Per-item workflow: reproduce → failing test (both logic + UI layers for anything
   visible) → fix → full suite green → live-verify in the running app (`preview_start`
   "MeningoVax dev server") → one commit per item.
5. Ship: MeningoVax `main` is UNPROTECTED but the owner prefers being asked before any
   push — same as this session's flow.
