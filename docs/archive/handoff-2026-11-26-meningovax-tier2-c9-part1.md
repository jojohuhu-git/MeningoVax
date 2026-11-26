# MeningoVax — Handoff after building Tier 2 item C9 part 1 (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-23-meningovax-tier2-c9-measured.md`.

Branch: `tier2/c9-cdc-sections`, off `main` at `3274508` (#154 merged 2026-11-24). Pushed;
**PR #155 open** against `main` (the owner merges; squash). Baseline on `main` was **2,628 passing
(227 files)**; now **2,660 passing, 0 failing (228 files)**, run this session. This handoff and the
superseded banner are committed on the same branch, on top of the C9 commit `7ff5360`.

## What's done

1. **C9 part 1 — CDC links open the closed section** (`7ff5360`, PR #155). Port of PneumoVax #141.
   - The 14 quotes that CDC's child and adult schedule-notes pages print inside a closed section
     each have a `section` field in `src/data/refs.js` (re-measured live 2026-11-26). `highlightUrl()`
     links them to `page#accordion-panel-mening-…`, with no text link. The hover text still quotes them.
   - Not changed: the two minimum-age quotes (printed above the sections) and the whole-document grey
     buttons (`#note-mening`, `#note-mening-b`), as in PneumoVax. This was decided alone per Q12, and
     PR #155 asks the owner whether the grey button should change too.
   - Guard: `src/data/__tests__/regression-2026-11-26-c9-cdc-notes-links-open-their-section.test.js`.
     `citation-highlight-url.test.js` was updated on purpose (it pinned the old link).
   - 0 answers moved; 0 of 31,160 patients' wording changed (`npm run prose`). Live checks: a
     14-year-old's [1] opens `#accordion-panel-mening-catchup`, and CDC opened only that section. The
     adult `#accordion-panel-mening-situations` link opened only that section.
   - The port plan's C9 row (table C) now says part 1 is built and part 2 is not started.

## What's NOT done — the remaining queue

**Tier 2 (Phase 8), owner's order; plan `plan-2026-11-08-meningovax-port.md`, table C:**
- **C9 part 2 (not started):** ACIP 2020 prints 13 quoted sentences 2–6 times (in several tables),
  and a text link lands on the first copy (11,417 cards; `report-2026-11-23-c9-measured.md`,
  Finding 2). First measure which copy fits each card, then test a "prefix" text link live. If the
  first copy is another group's table, the card is citing the wrong group's sentence (C5 territory).
  Check that before asking the owner.
- **C12 (not started):** a number's hover shows the quote. It already does (`title`). Measure what is
  left against PneumoVax's pop-up (#114, #141) before building.
- **C11 (not started):** each number sits on the exact claim its document states.

**Tier 3 (not started):** em dashes in card texts (owner banned them, D7; ask first). Both age-10
MenACWY leads in `recommend.js` (~1547, ~1614) use " — ". **Seen, not checked:** the combined shot
offered to a pregnant patient with asplenia or complement (read a source live before asking).
**For the owner:** the serogroup B outbreak "Complete" card shows "Public health may advise it from
6 months" in the lead. **Last:** Phase 9 close.

**Waiting on the owner:** merge PR #155. One optional question is in it: should the grey "CDC
Child/Adolescent Notes" button also open a section? (Default kept: no, as in PneumoVax.)

## Why this is a good stopping point

C9 part 1 is complete and in its own PR, with 0 answers or wording moved. Part 2 is a separate,
larger piece that starts with measurement, and nothing in it depends on #155 being merged.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git status`.
2. If #155 is merged: `git checkout main && git pull`. Run `npx vitest run` and confirm **2,660
   passing (228 files)**, or the merged total.
3. Start `MeningoVax dev server` (`.claude/launch.json`) and check usage (`get_usage`). Extra usage
   was at $38.16 of the $50 cap on 2026-11-26.
4. Per item: failing test → fix → full suite → live check (CDC links: full page load, pane visible)
   → commit named by ID. Put `npm run sweep:update` and `npm run prose -- dump/diff` counts in the PR.
   A new test file means updating `docs/agent/testing.md` ("Measured counts").
5. Open each PR against `main` (squash merges). The owner merges.
