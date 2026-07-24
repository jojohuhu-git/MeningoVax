# MeningoVax — Handoff after the full citation audit (2026-07-24)

**PARTIALLY SUPERSEDED by `docs/archive/handoff-2026-07-24-citation-wiring-w1-w2-w5-done.md`**
— this file's W1, W2, and W5 queue items are DONE (commit `ddd72e5`, pushed). Only W3 and
W4 below remain open; resume those from the newer file, which also records owner decisions
made on 2026-07-24 for W3. Do not redo W1/W2/W5 from this file.

Supersedes `docs/archive/handoff-2026-07-24-citation-references-verified-not-wired.md`
(its "re-verify the 5 claims, then wire in" task is done and expanded: this session
independently re-verified all 36 branches, added the two sources the owner supplied, and
resolved every open question. Do not resume that file.)

Branch: `main`, off `origin/main`. **NOT pushed — nothing to push:** this session made
**zero code and zero test changes.** It was pure citation research + a Word deliverable.
Working tree is dirty only with the new `.docx` and the same pre-existing untracked/modified
doc files that were present before this session (see `git status` — not from this session).
Suite unchanged at the **340 passing** the prior handoff verified; not re-run (no code
touched). Repo core promise: MeningoVax is a meningococcal-only advisor; MeningoVax is the
source of truth for meningococcal rules that vaxapp/PneumoVax mirror.

## The deliverable

`docs/archive/MeningoVax-citation-audit-2026-07-24.docx` — landscape Word table, one row per
recommendation branch (36 branches, in the owner's coverage-table order), each with: current
citation → recommended consolidated source + **exact verbatim quote** → a per-row note. Built
from `scratchpad/build-audit.js` (regenerate with `node build-audit.js <out.docx>`; needs a
local `npm install docx`). All 18+ quotes were fetched LIVE and confirmed as exact substrings
this session (not from memory).

## What's done (this session)

1. **Independently re-verified all 36 branches** against three MMWRs fetched live:
   - ACIP 2020 (PMC7527029), Oct 2024 Bexsero update (mm7349a3), 2025 GSK Penmenvy (PMC12782235).
2. **Key clinical finding: the app's logic is correct on every branch.** The earlier "MenB-4C
   contradictions" dissolved once `mm7349a3` was fetched — it makes MenB-4C a 3-dose 0/1–2/6
   high-risk series and a 2-dose 0/6 healthy series, and **explicitly supersedes** the 2020
   "2-dose 4C" table. It also covers the rescue dose and the accelerated 3-dose.
3. **Consolidation plan** (owner's goal = fewest total sources, prefer MMWRs): the three MMWRs
   carry ~every claim. The whole-page **"CDC Meningococcal Recommendations" chip and the three
   CDC schedule-note chips become fully droppable**, replaced by exact MMWR quotes. Keep only
   CDC complement-inhibitor guidance + immunize.org (two practical rows + the ≥22y row).
4. **Owner decisions recorded** (see below).
5. Reference memory `reference_adult_meningococcal` updated with the `mm7349a3` anchor.

## Owner decisions recorded 2026-07-24

- **Row 15 (single-dose label):** transient one-and-done indications (military recruit,
  first-year college resident, serogroup A/C/W/Y outbreak) will be shown as
  **"exposure/outbreak", not "risk-based"**. Logic + citation already correct; this is a
  label change (touches the `rec()` `status` enum + UI colour/label mapping).
- **Row 28 (≥22y healthy, not indicated):** cite the immunize.org homeless/halfway-house Q&A
  (owner-supplied) + the 2020 MMWR 19–21y catch-up sentence.
- **Rows 7/30/31, 12/34, 36 (all MenB-4C schedules):** cite `mm7349a3`; drop the CDC page chip.

## What's NOT done — the remaining queue (all for the NEXT session)

This session wrote NOTHING into `src/data/refs.js` or `src/logic/recommend.js`. The queue:

- **W1 — Wire the consolidated citations** into `refs.js` (new `CITATIONS` entries for
  `mm7349a3` + the immunize.org ≥22y page; new per-sentence quotes) and update `refs`/
  `noteCites` in `recommend.js` per the audit docx's "recommended source + quote" column.
  Drop the redundant CDC schedule-note / CDC-recommendations chips the audit marks droppable.
- **W2 — Quote-swaps (rows 27 & 33):** point each branch's `noteCite` at a NEW entry whose
  quote matches the branch — row 27 → the 19–21y catch-up sentence; row 33 → the "first dose
  after the 16th birthday needs no booster" sentence (they are DIFFERENT sentences).
- **W3 — Row 15 relabel (implementation):** add an "exposure/outbreak" status for the
  transient single-dose group; verify UI mapping across every MeningoVax surface. Open
  sub-question to raise: do travel + microbiologist (exposure-driven but boosted, the
  `single+boost` class) share the new label or stay "risk-based"? Ask, don't default.
- **W4 — Row 13 code trace (not a citation):** confirm `recommend.js` actually handles the
  college-dorm ">5 years since 16th birthday" sub-case (p2018.pdf lists it; the prior handoff
  said it was never traced — it may fall through to a generic branch).
- **W5 — Row 28 confirm:** immunize.org is a whole-page chip per the refs.js convention (no
  stable deep-link). Confirm the owner is happy citing it before wiring.

## Why this is a good stopping point

The audit is complete and self-contained: every claim now has a live-verified source, every
earlier open question is resolved or explicitly decided, and no code is half-changed (nothing
was touched). The next session starts a clean, well-scoped WIRING task driven entirely by the
audit docx — no re-derivation needed.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`.
2. `npx vitest run` — confirm **340 passing** before starting.
3. Open `docs/archive/MeningoVax-citation-audit-2026-07-24.docx` — the "Recommended source +
   exact quote" column IS the wiring spec. Follow the existing `refs.js` shape (see
   `acwyRoutine1112and16` for a quoted entry; the header comment for the field meanings).
4. Do W1–W2 first (pure citation metadata, additive). Then W3 (label change — bigger, verify
   all surfaces). W4 is an independent code check. W5 is a one-line owner confirm.
5. Per `verify-clinical-source`: re-fetch each source live and confirm the quote is an exact
   substring before pasting it — do not trust this handoff's quotes as ground truth.
6. Citations are additive metadata, not dosing logic — but confirm no `status`/`doseLabel`/
   dosing value changes as a side effect (W3 deliberately changes `status`; test that one).
7. MeningoVax `main` is unprotected — direct push allowed per the `ship` skill, but confirm
   with the owner before pushing, as prior sessions have.
