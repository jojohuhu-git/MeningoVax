# MeningoVax — Handoff after design-polish P0 (2026-07-16)

> **Superseded** — P1 (D7, D8, D6, D6b, D1) from this queue is now done and pushed. See
> [handoff-2026-07-17-design-polish-p1-done.md](handoff-2026-07-17-design-polish-p1-done.md)
> for current state and the remaining P2 queue.

Branch: `fix/2026-07-13-audit-queue`, off `main`. **Pushed** — matches
`origin/fix/2026-07-13-audit-queue` exactly, joins the existing **open, unmerged PR**:
https://github.com/jojohuhu-git/MeningoVax/pull/4 (MeningoVax's `main` isn't
branch-protected, but this PR is deliberately left open for the owner to review as one
unit before merging — do not merge it yourself).

Baseline (start of this session) was 258 passing tests. Now **260 passing (17 files)**,
all green, working tree clean at commit `0487da6`.

The full remaining queue with rationale, code pointers, and owner decisions lives in the
approved plan file: `/Users/joannehuang/.claude/plans/curious-sauteeing-hare.md`. **Read
that file first** for the "why" behind every remaining item (measured pixel values, exact
CSS line numbers, before/after copy examples). This handoff is the resume map; the plan
file is the spec.

## What's done — P0 (defects, owner-required content, dead code)

1. **D2** — Dropped "(primary)"/"(alternative)" from the Option 1/2 labels. Moved
   Option 2's label out of `.penta-card` (it was clipping against the card's rounded
   corner — the card has `overflow: hidden` with no padding of its own). Suppressed the
   redundant all-caps MenACWY/MenB section titles when cards are already grouped under
   an Option label. Files: `src/components/Results.jsx`,
   `src/components/__tests__/App.test.jsx` (updated one test's label assertions).
   Commit `685c934`.
2. **D3** — Recorded-dose rows now show age at administration, e.g. "D1 · Jun 1, 2020 ·
   age 10 years 11 months · brand unknown", reusing `ageAtDoseFromDate()`
   (`src/logic/validate.js:113`). Dose descriptor and its validity chip now share one
   line instead of stacking. Files: `src/components/RecCard.jsx`,
   `src/components/Results.jsx` (passes `ageMonths` down), `src/App.css`, new tests in
   `src/components/__tests__/RecCard.test.jsx`. Commit `4e9f0e0`.
3. **D14** — Fixed three measured misalignments: `.results-actions` buttons ("Edit
   history"/"Start Over") now have `gap: 12px` (were touching at 0px); results-header
   data chips and action buttons both now measure 21px tall (button vertical padding
   dropped from 3px to 2px to offset its 1px border); `.separate-vaccines-group` padding
   is now even 14px on all sides (was 14px sides / ~20px effective bottom from a
   stacked child margin). File: `src/App.css`. Commit `575b32a`.
4. **D13a** — Deleted the ~59 orphaned `.audit-*` CSS lines left behind when commit E5
   removed the standalone compliance-audit table (verified no `audit-` className
   remained in any JSX first). File: `src/App.css`. Commit `0487da6`.

Every item above was live-verified in the dev server (port 5179, launch.json "MeningoVax
dev server") before its commit, using the 23-year-old-with-asplenia dual-due/pentavalent
scenario (and a 17-year-old with one recorded MenACWY dose for D3).

## What's NOT done — the remaining queue (P1 then P2, in order)

All IDs, file pointers, and full rationale are in the plan file. Do NOT re-derive from
scratch — read the plan first.

**P1 — copy tells (most recognizable "written by an AI" signals):**
- **D7** — Remove em-dashes from every user-visible string (~15 static strings +
  reason strings in `validate.js`/`recommend.js`; ~115 test assertions reference these
  strings — update them in the same commit as each copy change). Code comments keep
  dashes.
- **D8** — Replace Unicode-glyph icons: `← Back`/`Next →`/etc. → plain text; `▾` →
  rotating SVG chevron; stepper `✓` → SVG check; `○` in risks "none" row → real
  unchecked-checkbox visual. Keep `×`, `+`, `·` (normal product typography).
- **D6** — Legend becomes colors-only "Color key" (shortcuts don't belong in a legend
  box); disclosure buttons keep their label when open instead of swapping to "Done"
  (rotating chevron from D8 shows state instead); separate data chips (age/group/risk)
  from action buttons (Adjust age/Recorded doses/Color key) visually in the header.
- **D6b** — Move keyboard-shortcut hints to the controls they act on: `kbd` "Ctrl/Cmd+A"
  beside both "+ Add dose" buttons; "or press Enter" microcopy beside the bottom-nav
  Next button on wizard steps.
- **D1** — Answer-first summary line above the results cards (e.g. "Due today: MenACWY
  booster and MenB dose 1 — as two shots, or one combined shot."), composed from
  existing `dueToday`/`pentavalent` flags, no new logic.

**P2 — coloring, shapes, shading, spacing:**
- **D4** — Reorder RecCard body: dose due + brands → booster/next-date → recorded
  history → note → citations.
- **D5** — Complete/not-indicated/deferred cards collapse to a compact single row,
  expandable on click.
- **D9** (flagged recommended, biggest visual change) — Rec-cards go from full pale-color
  fills to white body + 4px timing-colored left edge (matches the option cards' existing
  pattern); update color-key swatches to match.
- **D10** — Unify the two clashing amber families (`--penta*` is Tailwind-stock, catch-up
  amber is Material); promote stray hexes to named vars. Do NOT touch validity-chip hues
  — those match vaxapp's compliance vocabulary and are cross-app parity, not style.
- **D11** — Shadow/radius hierarchy: pentavalent card currently carries the heaviest
  shadow on the page; fix so nesting reads intentional.
- **D12** — Consolidate ~18 ad-hoc font sizes into ~7 vars; one `.micro-label` rule
  replaces six separately-defined all-caps letterspaced styles.
- **D15** — 4px-base spacing scale (4/8/12/16/24), sweep `App.css`; unify line-heights
  and letter-spacing; eyeball every screen at 640px and 375px.
- **D13b** — Move ~10 inline `style={{}}` blocks in `Results.jsx` into `App.css` classes.

## Why this is a good stopping point

P0 is a complete, self-contained unit — every defect and owner-required-content item is
fixed, tested, and live-verified; nothing in P0 blocks or depends on P1/P2. The branch is
pushed and clean, so the next session starts from a known-good, already-reviewed-by-CI
baseline. P1 and P2 are copy/style changes with no functional dependency on P0's fixes.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout fix/2026-07-13-audit-queue`
2. Run `npx vitest run` — confirm **260 passing (17 files)** before any new work.
3. Read `/Users/joannehuang/.claude/plans/curious-sauteeing-hare.md` in full for the
   measured values, exact line numbers, and before/after copy for every remaining item.
4. Start the dev server via `.claude/launch.json` entry "MeningoVax dev server" (port
   5179) before touching UI code.
5. Work D7 → D8 → D6 → D6b → D1 (P1), then D4 → D5 → D9 → D10 → D11 → D12 → D15 → D13b
   (P2), in that order. Per item: make the change → run the full suite → live-verify in
   the dev server → commit named by ID (e.g. `git commit -m "D7: remove em-dashes from
   user-visible strings"`).
6. Push each commit to `fix/2026-07-13-audit-queue` — it joins the existing open PR #4.
   **Do not merge.** The owner reviews PR #4 as one unit once the queue is done or she
   asks to check in early.
7. Sections C and D of the *original* 2026-07-13 cross-app queue (PneumoVax compliance
   table, vaxapp MenACWY pre-age-10 bug) are a **separate, still-pending** piece of work
   — see `docs/archive/handoff-2026-07-13-fix-queue-sections-c-d-remaining.md`. Don't
   conflate the two; this design-polish queue doesn't touch PneumoVax or vaxapp.
