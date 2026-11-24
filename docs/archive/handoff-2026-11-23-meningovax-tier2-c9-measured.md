# MeningoVax — Handoff after measuring Tier 2 item C9 (2026-11-23)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-23-meningovax-tier2-c7-c6.md`.

**Why this session stopped:** the weekly plan limit is at 100% (resets 2026-11-26) and extra usage
was at $35.79 of the $50 cap at the start. The owner chose "measure C9 only, build after the
reset." Check usage (`get_usage`) before building.

Branch: `tier2/c6-cdc-first` (PR #154, C6, still **open**, mergeable; the owner merges). Suite
**2,628 passing, 0 failing (227 test files)**, run this session. This session's three documents
(the C9 report, this file, and the superseded banner on the old handoff) are committed on
`tier2/c6-cdc-first`, on top of #154. They could not go on a branch off `main`: the old handoff
they mark superseded exists only on #154's branch. They are documents only.

## What's done

1. **C9 measured, not built.** `docs/archive/report-2026-11-23-c9-measured.md`. CDC's pages were
   read live, and all 22,536 saved patients (45,072 cards) were run through a throwaway script.
   - **Finding 1 (the real C9):** CDC's child and adult schedule-notes pages keep 14 of our 16
     quotes inside closed sections, so the `#:~:text=` links leave the reader at a closed page.
     3,387 cards are affected, and so are the Rulebook screen's links. A full page load of
     `…child-adolescent-notes.html#accordion-panel-mening-b-situations` opens just that section.
     The report has the section for every quote. No button comes off a card and no dose moves,
     so per Q12 it is decided alone, as a port of PneumoVax #141 (section link only, no highlight).
   - **Finding 2:** ACIP 2020 has no closed sections, but 13 quotes are printed 2–6 times (in
     several tables). A sentence link lands on the first copy. 11,417 cards are affected. Which
     copy fits each card has not been measured, and a "prefix" text link has not been tested.
   - **Finding 3:** on 19,324 cards the ACIP button opens a whole table (C10's design). This looks
     intended, so no change is proposed.

## What's NOT done — the remaining queue

**Tier 2 (Phase 8), owner's order; plan `plan-2026-11-08-meningovax-port.md`, table C:**
- **C9 build, part 1:** port PneumoVax #141 to the 14 CDC-notes quotes. Add each quote's section
  to `refs.js` (the report's table). Make the card number, the grey button (now `#note-mening` /
  `#note-mening-b`) and the Rulebook link open `#accordion-panel-mening-…`. Add a guard listing
  each quote's measured section. Live-check with a full page load and the pane visible.
- **C9 build, part 2 (larger, separate PR):** ACIP repeated copies. Measure which copy fits each
  card, then test a prefix link live. If the first copy is another group's table, a card is
  citing the wrong group's sentence (C5 territory). Check before asking the owner.
- **C12:** a number's hover shows the quote. It already does (`title`). Measure what is left
  against PneumoVax's pop-up (#114, #141) before building.
- **C11:** each number sits on the exact claim its document states (still "Not done").

**Tier 3:** em dashes in card texts (owner banned them, D7; ask first). Both age-10 MenACWY leads
in `recommend.js` (~1547, ~1614) use " — ". **Seen, not checked:** combined shot offered to a
pregnant patient with asplenia or complement (read a source live before asking). **For the owner:**
serogroup B outbreak "Complete" card shows "Public health may advise it from 6 months" in the lead.
**Last:** Phase 9 close.

## Why this is a good stopping point

C9 is fully measured, and its first part is a known, mechanical port with no owner stop. Nothing
waits on the owner except merging #154.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git status`.
2. If #154 is merged: `git checkout main && git pull`. Run the suite and confirm **2,628 passing
   (227 files)**, or the merged total.
3. Start `MeningoVax dev server` (`.claude/launch.json`) and check usage.
4. Per item: failing test → fix → full suite → live check → commit named by ID → `npm run
   sweep:update` / `npm run prose` counts in the PR. A new test file means updating
   `docs/agent/testing.md` ("Measured counts"). Open each PR against `main` (squash-merges).
