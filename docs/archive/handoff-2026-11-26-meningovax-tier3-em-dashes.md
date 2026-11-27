> **SUPERSEDED 2026-11-26** by `handoff-2026-11-26-meningovax-pregnancy-combined-shot.md`. PneumoVax #164 is merged and the pregnant + asplenia/complement combined-shot item was answered and built (PR #162); resume from that file.

# MeningoVax — Handoff after Tier 3 em dashes (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-outbreak-extra.md`.

Branch `tier3/em-dashes`, off `main` at `afa8e30`; its PR is merged by Claude after the `test`
check passes (owner, 2026-11-26). Baseline was **2,717 passing (233 files)**; now **2,723 passing,
0 failing (234 files)** at commit `f18d812` (measured with `vitest run --reporter=json`).

**Merging (owner, 2026-11-26): Claude merges MeningoVax PRs** (squash) and resolves the conflicts
between them. Keep a session's handoff on its work branch. This permission is MeningoVax's only:
ask before merging a PneumoVax PR.

**Asking:** for a chip or label question, show two screenshots side by side first.

## What's done

1. **Tier 3, em dashes** (owner E1 "Sentences only", E2 "Both apps";
   `decisions-2026-11-26-em-dashes.md`). 16 sentences lost their em dash (period, colon, comma
   or brackets; same meaning): 13 in `recommend.js` (card leads and "Why this"), the combined-shot
   dose row in `RecCard.jsx`, two `DoseEditor.jsx` notes, two `ageEntry.js` date-of-birth
   messages. Chip labels ("Not counted — repeat" and the rest) keep their dash, as PneumoVax.
   **7,952 of 31,160 patients read different punctuation (checked: punctuation only); 0 answers
   moved.** Guard: `src/components/__tests__/regression-2026-11-26-no-em-dash-in-sentences.test.jsx`
   (renders every test patient's results screen; fails with the fix reverted, 5 of 6). Live-checked
   a 17-year-old with one Penbraya: dose row and editor note read the new words; no em dash on the
   page with every "Why this" open.
2. **PneumoVax PR [jojohuhu-git/PneumoVax#164](https://github.com/jojohuhu-git/PneumoVax/pull/164)**
   (branch `copy/2026-11-26-dob-messages-no-em-dash`): the same two `ageEntry.js` messages, so
   the shared code stays identical. PneumoVax suite 2,551 passing, 0 failing (231 files).
   **Not merged: ask the owner.** (Made in a separate worktree; the PneumoVax folder itself is on
   `chore/2026-11-17-remove-dead-undated-code`, untouched; that branch is not merged into its main.)

## What's NOT done — the remaining queue

- **PneumoVax card sentences:** the design-review skill says MeningoVax copy-style rules apply to
  PneumoVax too. Its own card sentences were not measured for em dashes. Measure first
  (`npm run prose` there), then ask.
- **Seen during C12:** the 740 serogroup B outbreak numbers (`acip2020Table8`) have no quote; a
  quote needs a live read of ACIP Table 8 (citation only under Q12 if the dose is unchanged).
- **Seen, not checked:** MenB dose 2's "Earliest valid date: … (minimum interval 4 weeks)" and the
  complement infant's "Early doses are ≥8 weeks apart" carry no source number.
- **Tier 3, rest:** **seen, not checked:** the combined shot offered to a pregnant patient with
  asplenia or complement. **For the owner:** the serogroup B outbreak "Complete" card's lead says
  "Public health may advise it from 6 months". **Last:** Phase 9 close.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)

## Why this is a good stopping point

The em dash item is complete in MeningoVax and guarded. The PneumoVax half waits only on the
owner's merge. Nothing else in the queue depends on it.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`.
2. Confirm the `tier3/em-dashes` PR merged; run `npx vitest run`; expect **2,723 passing (234
   files)** unless `main` moved. Re-measure.
3. Start `MeningoVax dev server` (`.claude/launch.json`).
4. Ask whether to merge PneumoVax #164 if still open. Next: the pregnant + asplenia/complement
   combined-shot check (measure first, then ask), then the outbreak "from 6 months" lead.
   Per item: failing test → fix → full suite → live check → commit named by ID; `npm run
   sweep:update` and `npm run prose -- dump/diff` counts in the PR; a new test file updates
   `docs/agent/testing.md`.
5. Open the PR against `main`; Claude merges it after the check passes.
