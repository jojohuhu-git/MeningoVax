> **SUPERSEDED 2026-11-26** by `handoff-2026-11-26-meningovax-after-merges.md`. #157 and #158 are merged; resume from that file.

# MeningoVax — Handoff after building Tier 2 item C12 (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-tier2-c9-part3.md` (that file is on the #157 branch
and carries a SUPERSEDED banner there).

Two PRs are **open** against `main`; the owner merges them (squash):
- **#157** `tier2/c9-part3-range-links` (C9 part 3, built the session before this one).
- **#158** `tier2/c12-quote-popup` (C12, this session). Commit `fd18199`, plus this handoff.
  Branched from `main` at `5d878db`, so it does **not** contain #157.

Baseline on `main` at `5d878db`: **2,675 passing (229 files)**. On `tier2/c12-quote-popup`:
**2,682 passing, 0 failing (230 files)**, run this session after the last code and
`testing.md` change (only this handoff and the plan's C12 row were edited after it).

## What's done

1. **C12** (`fd18199`, #158). Owner answer 2026-11-26, **"Build as shown"**, after a before/after
   drawing (the 11-year-old's "Booster: at age 16 years [1]").
   - `RecCard.jsx`: `CiteMark`, copied from PneumoVax's `src/components/citations.jsx` (its #114).
     Hover, keyboard focus or a first tap opens the document's name, the quoted sentence and
     "Open the document"; moving or tapping away, Escape and scrolling close it; a mouse click
     still opens the page at the sentence. Words moved from `title` to `data-title`.
     One difference from PneumoVax: `useClientLayoutEffect` (plain effect with no browser) so
     the prose tool and tests print no React warnings.
   - `scripts/proseDiff.mjs` reads `data-title` explicitly. 6 older tests read `data-title`.
   - Measured: 123,597 of 124,337 numbers carry a quote; 740 (serogroup B outbreak cards,
     `acip2020Table8`, a whole-table link with no quote) show the document's name only, as in
     PneumoVax. 0 answers moved; 0 of 31,160 patients read different wording; hover texts
     294,368 before and after.
   - Live-checked: desktop hover (pop-up under [1], link opens the sentence) and 375 px phone
     width (first tap opens without leaving; box inside the screen; tap away closes). No
     console errors. Guard: `regression-2026-11-26-c12-number-opens-the-quote.test.jsx`.

## What's NOT done — the remaining queue

- **Merge chore:** #157 and #158 each add one test file. Whichever merges second needs the three
  counts in `docs/agent/testing.md` ("Measured counts") raised by one (231 / 71 / 70) and a
  rebase; `regression-testing-md-counts-match-reality` will fail until then.
- **C11 (not started, plan table C):** each number sits on the exact claim its document states
  (e.g. "complete" cites the sentence that says "complete"; a dose total cites the row that
  states it). Measure first.
- **Seen during C12, not an item yet:** the 740 serogroup B outbreak numbers (`acip2020Table8`)
  have no quoted sentence, so their pop-up shows the document name only. A quote would need a
  live read of ACIP Table 8 (citation-only under Q12 if the dose is unchanged).
- **Tier 3 (not started):** em dashes in card texts (owner banned them, D7; ask first). Both
  age-10 MenACWY leads in `recommend.js` use " — ". **Seen, not checked:** the combined shot
  offered to a pregnant patient with asplenia or complement. **For the owner:** the serogroup B
  outbreak "Complete" card's lead says "Public health may advise it from 6 months". **Last:**
  Phase 9 close.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)

## Why this is a good stopping point

C12 is complete in one PR with 0 answers or wording moved, and Phase 8's C1–C10, C12 and C13 are
now built. C11 is independent of both open PRs. Nothing waits except the owner's merges.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git status`.
2. After the owner merges #157 and #158: `git checkout main && git pull`, fix the
   `testing.md` counts if the second merge left them stale, run `npx vitest run`, and confirm
   **2,675 + 11 (C9 part 3) + 7 (C12) = 2,693 passing (231 files)**. Re-measure; never trust this
   sum over the actual output.
3. Start `MeningoVax dev server` (`.claude/launch.json`) and check usage (`get_usage`). Extra usage
   was at $38.16 of the $50 cap on 2026-11-26.
4. Next item: C11 (measure first). Per item: failing test → fix → full suite → live check →
   commit named by ID. Put `npm run sweep:update` and `npm run prose -- dump/diff` counts in the
   PR. A new test file means updating `docs/agent/testing.md` ("Measured counts" and the list).
   A new or moved control: draw a before/after and ask first (owner rule).
5. Open each PR against `main`. The owner merges.
