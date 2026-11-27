# MeningoVax — Handoff after merging #157 and #158 (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-tier2-c12.md`.

This file sits on branch `tier2/c11-exact-claim` (cut from `main` at `f9c6f9f`), where C11 will be
built, so it reaches `main` with C11's PR instead of needing a PR of its own.

## What's done

1. **#157 (C9 part 3) merged** into `main` as `55ac8b7` (squash), after its `test` check passed.
2. **#158 (C12) brought up to date and merged** as `f9c6f9f` (squash). `main` was merged into the
   C12 branch (no force-push); the one clash was `docs/agent/testing.md` "Measured counts", which
   both PRs had raised by one. Set to the real counts: **231 test files, 70 screen, 7 data,
   69 happy-dom** (each re-run with its command). Full suite on the merged code: **2,693 passing,
   0 failing**. GitHub's `test` check passed; the Pages deploy succeeded (run 45923474543).
3. **Live site spot check:** the deployed script contains the C12 pop-up code ("Open the
   document", `data-title`). The pop-up itself was not re-driven on the live site; it was
   live-checked on the dev server in the C12 session.
4. **Owner (2026-11-26): Claude merges the PRs now** and handles the conflicts between them (see
   memory `claude-merges-prs-and-resolves-conflicts`). Order: merge the first after its check
   passes; merge `main` into the next, fix `testing.md` counts, run the full suite, push, wait for
   its check, merge; confirm the deploy.

## What's NOT done — the remaining queue (unchanged from the C12 handoff)

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

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout tier2/c11-exact-claim`.
2. Run `npx vitest run`; expect **2,693 passing (231 files)** unless `main` moved. Re-measure.
3. Start `MeningoVax dev server` (`.claude/launch.json`); check usage (`get_usage`). Extra usage
   was $38.16 of the $50 cap on 2026-11-26.
4. Next item: C11 (measure first). Per item: failing test → fix → full suite → live check →
   commit named by ID. Put `npm run sweep:update` and `npm run prose -- dump/diff` counts in the
   PR. A new test file means updating `docs/agent/testing.md`. A new or moved control: draw a
   before/after and ask first.
5. Open the PR against `main`; Claude merges it after the check passes.
