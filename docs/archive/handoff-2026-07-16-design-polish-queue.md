# MeningoVax — Handoff after design-review planning (2026-07-16)

Branch: `fix/2026-07-13-audit-queue`, off `main`. Pushed (matches origin, working tree
clean). This branch already contains commits A1–A2, B1–B7, E1–E6 (see `git log --oneline
main..HEAD`) and has an **open, unmerged PR**: https://github.com/jojohuhu-git/MeningoVax/pull/4
— MeningoVax's `main` isn't branch-protected, but this PR was deliberately left open for
the owner to review as one unit before merging.

**No code was changed this session.** This was a planning-only session: a live design
review of the app plus a full read of `App.css` / `Results.jsx` / `RecCard.jsx` / `App.jsx`,
producing an approved, ordered fix queue (below). Test suite: **258 passing (17 files)**,
all green, working tree clean at commit `85ffd15` — this is the unchanged baseline, not a
result of new work.

The full queue with rationale, code pointers, and owner decisions lives in the approved
plan file: `/Users/joannehuang/.claude/plans/curious-sauteeing-hare.md`. **Read that file
first** — it has the "why" for every item (measured pixel values, exact CSS line numbers,
before/after copy examples). This handoff is the resume map; the plan file is the spec.

## What's done

Nothing yet. Planning and owner sign-off only:
- Live-drove the wizard (age → risks → MenACWY history → MenB history → results) and the
  dual-due/pentavalent results screen in the dev server (port 5179) with DevTools
  measurements (button gaps, chip heights, padding) to ground the plan in real pixel values,
  not guesses.
- Read `App.css` (1097 lines), `Results.jsx`, `RecCard.jsx`, `App.jsx`, `Stepper.jsx`,
  `StepAge.jsx`, `StepRisks.jsx` end to end.
- Owner reviewed two draft plans and gave three rounds of correction, now folded into the
  final plan (see "Owner decisions" below).

## What's NOT done — the remaining queue (D1–D15, ordered)

All IDs, file pointers, and full rationale are in the plan file. Do NOT re-derive from
scratch — read the plan first.

**P0 — defects, owner-required content, dead code:**
- **D2** — Drop "(primary)"/"(alternative)" from Option 1/2 labels; move the Option 2 label
  OUT of `.penta-card` (today it renders clipped against the card's rounded corner —
  `Results.jsx:284`, label has no padding, card has `overflow: hidden`); suppress redundant
  all-caps MENACWY/MENB section titles inside the grouped option. **A test-file edit for
  this item was drafted last session but rejected by the owner before it was applied — no
  trace of it exists in the repo. Start clean; do not assume any part of D2 is in progress.**
- **D3** — Add age-at-administration to every recorded-dose row (reuse `ageAtDoseFromDate()`
  in `validate.js:113`), e.g. "D1 · Jun 1, 2020 · age 11y 2m · brand unknown". Owner-required:
  lets a clinician compare recommended timing against actual administration ages. Also align
  rows into scannable columns.
- **D14** — Fix measured misalignments: `.results-actions` buttons touch with 0px gap (add
  `gap: 12px`); 21px vs 23px chip/button height mismatch in the results header row;
  asymmetric `.separate-vaccines-group` padding (`14px 14px 4px` vs 16px last-child margin).
- **D13a** — Delete ~59 orphaned `.audit-*` CSS lines (`App.css:1039-1097`, left behind when
  commit E5 deleted the standalone audit table) — verify no `audit-` className remains in
  JSX first.

**P1 — copy tells (most recognizable "written by an AI" signals):**
- **D7** — Remove em-dashes from every user-visible string (~15 static strings + reason
  strings in `validate.js`/`recommend.js`; ~115 test assertions reference these strings —
  update them in the same commit as each copy change). Code comments keep dashes.
- **D8** — Replace Unicode-glyph icons: `← Back`/`Next →`/etc. → plain text; `▾` → rotating
  SVG chevron; stepper `✓` → SVG check; `○` in risks "none" row → real unchecked-checkbox
  visual. Keep `×`, `+`, `·` (normal product typography).
- **D6** — Legend becomes colors-only "Color key" (owner: shortcuts don't belong in a
  legend box); disclosure buttons keep their label when open instead of swapping to "Done"
  (rotating chevron from D8 shows state instead); separate data chips (age/group/risk) from
  action buttons (Adjust age/Recorded doses/Color key) visually in the header.
- **D6b** — Move keyboard-shortcut hints to the controls they act on: `kbd` "Ctrl/Cmd+A"
  beside both "+ Add dose" buttons; "or press Enter" microcopy beside the bottom-nav Next
  button on wizard steps.
- **D1** — Answer-first summary line above the results cards (e.g. "Due today: MenACWY
  booster and MenB dose 1 — as two shots, or one combined shot."), composed from existing
  `dueToday`/`pentavalent` flags, no new logic.

**P2 — coloring, shapes, shading, spacing:**
- **D4** — Reorder RecCard body: dose due + brands → booster/next-date → recorded history →
  note → citations (today's action before supporting history).
- **D5** — Complete/not-indicated/deferred cards collapse to a compact single row, expandable
  on click, so due items visually dominate.
- **D9** (flagged recommended, biggest visual change) — Rec-cards go from full pale-color
  fills to white body + 4px timing-colored left edge (matches E2's existing pattern on the
  option cards); update color-key swatches to match.
- **D10** — Unify the two clashing amber families (`--penta*` is Tailwind-stock, catch-up
  amber is Material); promote stray hexes (`#f0c79a`, `#a5d6a7`, `#ef9a9a`, `#d6eef7`) to
  named vars. Do NOT touch validity-chip hues (green/amber/red/gray) — those match vaxapp's
  compliance vocabulary (commit E5) and are cross-app parity, not a style choice.
- **D11** — Shadow/radius hierarchy: pentavalent card (the alternative) currently carries
  the heaviest shadow on the page; fix so nesting reads intentional.
- **D12** — Consolidate ~18 ad-hoc font sizes into ~7 vars; one `.micro-label` rule replaces
  six separately-defined all-caps letterspaced styles.
- **D15** — 4px-base spacing scale (4/8/12/16/24), sweep `App.css`; unify line-heights
  (~1.5) and letter-spacing (0.03–0.06em → one value); eyeball every screen at 640px and
  375px for awkward positioning while sweeping.
- **D13b** — Move ~10 inline `style={{}}` blocks in `Results.jsx` into `App.css` classes.

## Why this is a good stopping point

Zero code changes exist to lose — the branch is exactly where the E-series commits left it,
tests green, nothing uncommitted. The queue is fully scoped and ordered with owner sign-off,
so the next session can start executing D2 immediately without re-deriving requirements or
re-running the design review.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout fix/2026-07-13-audit-queue`
2. Run `npx vitest run` — confirm **258 passing (17 files)** before any new work.
3. Read `/Users/joannehuang/.claude/plans/curious-sauteeing-hare.md` in full — it has the
   measured values, exact line numbers, and before/after copy for every D-item.
4. Start the dev server via `.claude/launch.json` entry "MeningoVax dev server" (port 5179)
   before touching UI code (org standard).
5. Work D2 → D3 → D14 → D13a → D7 → D8 → D6 → D6b → D1 → D4 → D5 → D9 → D10 → D11 → D12 →
   D15 → D13b, in that order (P0 → P1 → P2 as grouped above). Per item: make the change →
   run the full suite → live-verify in the dev server → commit named by ID (e.g. `git commit
   -m "D2: simplify option labels, fix pentavalent-label clipping"`).
6. Push each commit to `fix/2026-07-13-audit-queue` — it joins the existing open PR #4.
   **Do not merge.** The owner reviews PR #4 as one unit once the queue is done or she asks
   to check in early.
7. Sections C and D of the *original* 2026-07-13 cross-app queue (PneumoVax compliance
   table, vaxapp MenACWY pre-age-10 bug) are a **separate, still-pending** piece of work —
   see `docs/archive/handoff-2026-07-13-fix-queue-sections-c-d-remaining.md`. Don't conflate
   the two; this design-polish queue doesn't touch PneumoVax or vaxapp.
