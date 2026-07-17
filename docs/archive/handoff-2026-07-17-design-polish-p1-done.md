# MeningoVax — Handoff after design-polish P1 (2026-07-17)

> **STATUS: superseded for P2.** P1 (below) is still accurate as history. For P2 progress
> (D4/D5/D9/D10 done, D11–D13b remaining) and the resume map, see
> [handoff-2026-07-16-design-polish-p2-partial.md](handoff-2026-07-16-design-polish-p2-partial.md).
> Note in particular: D9 shipped as a colored **header bar**, not the left-edge accent this
> file's linked plan originally specified — the owner rejected the left-edge design live.

Branch: `fix/2026-07-13-audit-queue`, off `main`. **Pushed** — matches
`origin/fix/2026-07-13-audit-queue` exactly, joins the existing **open, unmerged PR**:
https://github.com/jojohuhu-git/MeningoVax/pull/4 (MeningoVax's `main` isn't
branch-protected, but this PR is deliberately left open for the owner to review as one
unit before merging — do not merge it yourself).

Baseline (start of this session) was 260 passing tests (P0 already done — see
[handoff-2026-07-16-design-polish-p0-done.md](handoff-2026-07-16-design-polish-p0-done.md),
now superseded by this file). Still **260 passing (17 files)**, all green, working tree
clean at commit `81c47db`.

The full remaining queue with rationale, code pointers, and owner decisions lives in the
approved plan file: `/Users/joannehuang/.claude/plans/curious-sauteeing-hare.md`. **Read
that file first** for the "why" behind every remaining item. This handoff is the resume
map; the plan file is the spec.

## What's done — P1 (copy tells, most recognizable "written by an AI" signals)

1. **D7** — Removed em-dashes from ~30 user-visible strings (recommendation notes,
   dose-validity reasons, step copy, legend text, brand/citation labels), rewritten with
   periods, colons, or parentheses. Code comments unchanged. One change touches vaxapp/
   PneumoVax parity: `"Valid — off-window"` → `"Valid (off-window)"` (see cross-app item
   below). Commit `f80a0eb`.
2. **D8** — Replaced Unicode-glyph icons: arrow buttons (`← Back`, `Next →`, `View
   Results →`, `← Edit history`) → plain text; header disclosure `▾` → new
   `src/components/icons.jsx` `<Chevron>` (rotates 180° when open); stepper `✓` → new
   `<Check>` SVG; risks "none" row's `○` → a real `<input type="checkbox">` matching the
   other risk rows. Kept `×`, `+`, `·` (normal product typography). Commit `6c0ff12`.
3. **D6** — Legend panel dropped its keyboard-shortcuts section and is relabeled "Color
   key" (colors only). The three header disclosure buttons (Adjust age, Recorded doses,
   Color key) keep their label when open instead of swapping to "Done" — the D8 chevron
   already shows open/closed state. Header now splits into two rows: data chips (age,
   group, risk) above, action buttons below. Files: `src/components/Results.jsx`,
   `src/App.css`, one test relabeled in `src/components/__tests__/App.test.jsx`. Commit
   `bc918ee`.
4. **D6b** — Shortcut hints moved from the (now-removed) legend section to the controls
   they act on: a visible `<kbd>Ctrl/Cmd + A</kbd>` beside the "+ Add dose" button on both
   wizard history steps (`StepHistory.jsx`, shared by MenACWY/MenB) and both lists in the
   Results "Recorded doses" editor; a quiet "or press Enter" note beside the bottom-nav
   Next button (`App.jsx`). **Note:** the Results dose editor didn't have the Ctrl/Cmd+A
   shortcut wired before — only the wizard steps did. Added it there too so the new hint
   is truthful, scoped per-section (MenACWY vs MenB) via an `activeDoseSection` state
   updated on `onFocusCapture` (an earlier attempt using `document.activeElement` at
   keydown time was unreliable — focus is lost when the list re-renders after adding a
   row — caught and fixed via live verification before committing). Commit `7b8d14f`.
5. **D1** — Added a plain-English "answer-first" verdict line above the results cards
   (e.g. "Due today: MenACWY and MenB, as two separate shots or one combined pentavalent
   shot."), composed entirely from the existing `dueToday`/`pentavalent.eligible` flags —
   no new clinical logic. Handles four cases: both due (with/without pentavalent), one
   due, nothing due today ("No MenACWY or MenB doses due today."). All four verified live.
   Commit `81c47db`.

Every item above was live-verified in the dev server (`.claude/launch.json` entry
"MeningoVax dev server", served from `vaxapp-main`'s launch.json which `cd`s into this
repo — port varies per session, check `preview_logs` for the actual bound port) before its
commit, using the 23-year-old-with-asplenia dual-due/pentavalent scenario and a
25-year-old-no-risk-factors scenario (nothing due today).

## What's NOT done — the remaining queue (P2, in order)

All IDs, file pointers, and full rationale are in the plan file. Do NOT re-derive from
scratch — read the plan first.

- **D4** — Reorder RecCard body: dose due + brands → booster/next-date → recorded
  history → note → citations.
- **D5** — Complete/not-indicated/deferred cards collapse to a compact single row,
  expandable on click.
- **D9** (flagged recommended, biggest visual change) — Rec-cards go from full pale-color
  fills to white body + 4px timing-colored left edge (matches the option cards' existing
  pattern); update color-key swatches to match.
- **D10** — Unify the two clashing amber families (`--penta*` is Tailwind-stock, catch-up
  amber is Material); promote stray hexes to named vars. Do NOT touch validity-chip hues.
- **D11** — Shadow/radius hierarchy: pentavalent card currently carries the heaviest
  shadow on the page; fix so nesting reads intentional.
- **D12** — Consolidate ~18 ad-hoc font sizes into ~7 vars; one `.micro-label` rule
  replaces six separately-defined all-caps letterspaced styles.
- **D15** — 4px-base spacing scale (4/8/12/16/24), sweep `App.css`; unify line-heights
  and letter-spacing; eyeball every screen at 640px and 375px.
- **D13b** — Move ~10 inline `style={{}}` blocks in `Results.jsx` into `App.css` classes.

## Cross-app parity — owed, NOT started, capture in the NEXT handoff after P2

The owner gave a standing instruction this session (2026-07-17): **design rules and
clinical content should match across all three apps (vaxapp, MeningoVax, PneumoVax) as
applicable.** Concretely:

1. **Copy parity (from this session's D7).** `"Valid — off-window"` →
   `"Valid (off-window)"` is a punctuation-only change to vaxapp's exact
   compliance-audit vocabulary (see `RecCard.jsx:32-33` comment: "E5: labels/colors match
   vaxapp's compliance-audit language"). Check vaxapp and PneumoVax for the same string
   and apply the same punctuation fix if present. Not a clinical-parity issue, just
   consistency.
2. **Clinical-content parity (MeningoVax → vaxapp).** MeningoVax is meningococcal-only;
   vaxapp covers the full pediatric schedule including meningococcal. Any MeningoVax
   session (this one or P2) that changes MenACWY/MenB **clinical logic** (not just
   copy/UI) must have the equivalent change checked against and applied to vaxapp's
   pediatric meningococcal logic. **This session (P1) changed no clinical logic** — D7/D8/
   D6/D6b/D1 were copy and UI only. If P2 touches clinical logic, flag it explicitly.
3. **Design parity (MeningoVax → PneumoVax).** P2's remaining items (D9 white-card+left-
   edge pattern, D10 amber-family unification, D11 shadow/radius hierarchy, D12 type
   scale, D15 spacing scale) are pure design-system changes. Per the owner's standing
   rule, apply the same design tokens/patterns to PneumoVax once they're finalized here.

Do not start this cross-app work now. The next handoff (written after P2 wraps) should
carry these three items forward with specifics (exact strings, exact token values) once
P2's actual diffs exist to compare against.

## Why this is a good stopping point

P1 is a complete, self-contained unit — every "written by AI" copy/icon tell is fixed,
tested, and live-verified; nothing in P1 blocks or depends on P2 (pure visual/color/
spacing work). The branch is pushed and clean. P2 is higher-risk (touches shared color
tokens and card layout used across the whole Results screen) and was deliberately
deferred for an owner check-in before starting, per this session's plan.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout fix/2026-07-13-audit-queue`
2. Run `npx vitest run` — confirm **260 passing (17 files)** before any new work.
3. Read `/Users/joannehuang/.claude/plans/curious-sauteeing-hare.md` in full for the
   measured values, exact line numbers, and before/after specs for every P2 item.
4. Start the dev server via `.claude/launch.json` entry "MeningoVax dev server" before
   touching UI code (check `preview_logs` for the actual bound port — it auto-increments
   if 5179/5180 are already in use by a stale process).
5. Work D4 → D5 → D9 → D10 → D11 → D12 → D15 → D13b, in that order. Per item: make the
   change → run the full suite → live-verify in the dev server → commit named by ID (e.g.
   `git commit -m "D9: white-card + timing-colored left edge"`).
6. Push each commit to `fix/2026-07-13-audit-queue` — it joins the existing open PR #4.
   **Do not merge.** The owner reviews PR #4 as one unit once the queue is done or she
   asks to check in early.
7. **When P2 wraps, write the next handoff and fold in the three cross-app parity items
   above** (copy → vaxapp/PneumoVax, clinical → vaxapp, design → PneumoVax) with concrete
   specifics from the finished P2 diff. This was explicitly deferred, not forgotten.
8. Sections C and D of the *original* 2026-07-13 cross-app queue (PneumoVax compliance
   table, vaxapp MenACWY pre-age-10 bug) are a **separate, still-pending** piece of work —
   see `docs/archive/handoff-2026-07-13-fix-queue-sections-c-d-remaining.md`. Don't
   conflate the two; this design-polish queue doesn't touch PneumoVax or vaxapp directly
   (only the parity follow-up above does, once P2 is done).
