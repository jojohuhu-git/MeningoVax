# MeningoVax — Handoff after review v10 Batch 5: the Rulebook redesign (2026-11-20, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-20-meningovax-review-v10-build.md`.

Branch: `port/review-v10-rulebook`, off `origin/main` `37ef2fd` (PR #124, Batches 1–4, merged).
**Pushed; PR #125 open against `main`** (https://github.com/jojohuhu-git/MeningoVax/pull/125),
waiting for the owner to merge. Baseline was 2,322 / 193; now **2,356 passed (195 files)**, all
green (`npm test`, 2026-11-20; 2,359 after the last wording commits). Commits `6c72c1a` (5a), `e061354` (D1), the R91 change and this handoff.

## The source of truth

`docs/archive/decisions-2026-11-20-review-v10.md`: every item's approved wording. Two answers added
this session (in chat): **D1 placement "New top, then 1–8 folded"**, and **R1 = the owner's own
sentence** "Recommendations are based on age, risk conditions and dated vaccine history."

## What's done

1. **Batch 5a, R1–R104** (`6c72c1a`): every approved R item on the Rulebook screen
   (`src/data/rulebookPage.js`, `src/components/Rulebook.jsx`), semicolons made periods or commas.
   The label is now "CDC and ACIP say:" + a statement in all 14 decisions (R94; the 13 without review
   wording were rewritten as statements, listed in PR #125). R104 reworded so the label doesn't
   repeat. R59's typed list is held to the app's four MenB high-risk ids by a test. Two ages the
   engine never reads are named above THE PAGE line with their refs key (CDC MenQuadfi 2 years,
   `cdcChildAcwyMinAge`; preferred MenB 16–18, `menbHealthyPreferredAge1618`). Test
   `regression-2026-11-20-review-v10-batch5-rulebook-wording.test.jsx`.
2. **D1, the redesign** (`e061354`): in view are the opening line, "How MeningoVax decides" (7 steps,
   `PATH_STEPS`) and "Quick look" (`QUICK_LOOK`, two tables, Details one row at a time); parts 1–8 sit
   behind "Full rulebook", closed by default. Eleven worked patients added; every new row is held to
   `recommend()` by the 2026-11-19 guard. Test `regression-2026-11-20-review-v10-d1-rulebook-redesign.test.jsx`.
   Old unused `.rb-steps/.rb-step` CSS removed. Live-checked desktop and phone (no page sideways
   scroll; group column pinned).
3. **R91 "at least"** (owner, after it was built): "The repeat is given at least the minimum interval
   after the invalid dose." (a healthy MenB dose 2 given 3 weeks early is repeated 6 months after
   dose 1; worked patient `menbHealthy3wk` now on that row). R102 keeps "at the minimum interval":
   it covers only a too-young first dose, where that is exact.
4. **Two "No change" lines, semicolons to periods** (owner): "Sooner still counts. Dose 3 is added." and
   "…Dose 4 is added." in part 6's intervals table. Then (owner, "Yes, both") R50 takes a comma and
   the "Applies in:" lists join with commas. A test now finds no semicolon anywhere in the screen's
   own words (CDC's quoted sentences keep theirs). Suite **2,359 / 195**.
   **D1 was changed from the mockup so it is true of the app** (in PR #125): military Details ("the doses
   follow the routine schedule"); "After an invalid dose … at least the minimum interval"; label
   colours stay the app's own (Q5 not built), and the "Red labels mean… amber…" sentence is left out.

## What's NOT done

- **Owner: review and merge PR #125.** Point out the "changed from the approved words" table there.
- **Q5** (amber "Not counted — do not repeat"): approved, but **remind the owner to check PneumoVax's
  labels first**. Building it also means adding back the step 2 colour sentence.
- **STOP H**: owner reviews the rulebook (`docs/agent/meningococcal-rules-summary.md`), per the plan.
- Follow-ups outside this repo or not yet asked: PneumoVax `DoseEditor.jsx` still says "Tick this to
  keep the dose on the record" (owner: never "tick"). Whether to *offer* MenQuadfi before 2 months
  is a separate clinical question (read AAP live before asking). Design parity: PneumoVax's dose rows
  and cards (L1–L4/L7) and disclaimer (P71) not mirrored; ask. DoseEditor "Family locked: MenB-4C"
  line (not in the review).

## Why this is a good stopping point

Every review v10 item except Q5 is built. Batch 5 is complete as a unit: test first, full suite,
live check, PR open. What's left is owner decisions, not code in progress.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`
   if #125 is merged; else `git checkout port/review-v10-rulebook`.
2. `npm test`: confirm **2,356 passed / 195 files** (more if #125 merged with later work).
   `preview_start {name: "MeningoVax dev server"}`.
3. Ask, don't default: Q5 after the PneumoVax check; the parity
   follow-ups.
4. Per item (fix-queue skill): failing test quoting the approved wording → fix (no semicolons; no
   typed numbers in `rulebookPage.js` below THE PAGE line; every row gets worked patients) → `npm test`
   → live check → commit named by item ID. Patient-screen wording: `npm run prose` before/after.
5. Ship skill: branch → PR against `main`; the owner merges.
