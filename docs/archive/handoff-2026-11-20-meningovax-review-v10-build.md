# MeningoVax — Handoff after the review v10 answers and Batches 1–2a (2026-11-20, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-20-meningovax-rulebook-q2-q4.md`.

Branch: `port/review-v10-wording`, off `origin/main` `8b51c38` (PR #123 merged). **Pushed; PR #124
open against `main`** (https://github.com/jojohuhu-git/MeningoVax/pull/124), waiting for the owner.
Suite **2,302 passed / 190 files**, all green (run 2026-11-20 after Batch 2c; baseline was 2,267 / 186).
Working tree clean.

## The source of truth for this queue

- **`docs/archive/decisions-2026-11-20-review-v10.md`**: every item (R1–R110 Rulebook wording,
  P1–P75 Patient screen wording, L1–L7 placement, D1 the redesign) with its approved wording. Owner:
  **"Approve them all"** (2026-11-20), D1 included. Built items say "Built".
- Same file, last section: **semicolons. Owner kept style rule 4**, so every ";" in an approved
  sentence becomes a period or a comma, with the words otherwise as approved. The G1-a test
  (`regression-2026-11-19-g1a-style-rules.test.js`) enforces it on card and dose-line text.
- The review form: https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr (version 14), source
  `docs/archive/mockup-2026-11-20-rulebook-review-v10.html`. Answers live in its db: `ArtifactData
  list`, collection `verdicts`. Notes now save as the owner types.

## What's done

1. **Review form v10** (`ec7f61b`, `3f9c5de`, `8ad65f3`): v9 mockup → numbered review form. Owner
   notes applied: shorter proposals, no "tick" (memory `app-wording-succinct-clinical-no-top-up`),
   R10 corrected (a MenQuadfi dose from 6 weeks counts; the app recommends from 2 months),
   P73–P75 added, Quick look bars wrap.
2. **Batch 1, P1 P2 P3 P73 P74** (`3bde20d`, P1 re-punctuated in `68fc893`): `StepRisks.jsx`,
   `DoseEditor.jsx`, `recommend.js`. P2's hint already existed (C1's no-date line), so only the label
   changed. Prose: 3,113 changed (1,594 real); 0 answers moved. Test
   `regression-2026-11-20-review-v10-batch1-entry-wording.test.jsx`.
3. **Batch 2a, P5–P11 and P24–P30** (`68fc893`): `Results.jsx` summary lines, `RecCard.jsx`
   headers and "Booster due [date].", `recommend.js` booster lines. Same edit given to siblings,
   listed in the PR. Prose: 17,879 changed (14,272 real); 0 answers moved. Test
   `regression-2026-11-20-review-v10-batch2a-summary-headers-boosters.test.jsx`. Live-checked.

## What's NOT done — the remaining queue (all approved; build in this order)

- **2d**: combined shot and disclaimer, **P67–P72**. P72 pairs with L7.
- **3**: dose labels **P12–P21**. These are chip labels on the closed list (`doseChipLabel.js`,
  `docs/agent/clinical-rules.md` "One Label Per Dose", sweep property 13). Update the list and the
  doc in the same commit.
- **4**: placement **L1–L7** (`RecCard.jsx`, `Results.jsx`, the dose history).
- **5**: the Rulebook redesign **D1** plus the Rulebook wording **R items** (`rulebookPage.js`,
  `Rulebook.jsx`). **Ask first:** does the redesigned top (seven steps, two Quick look tables)
  replace today's numbered sections 1–8, or sit above them with the reworded R items? The
  approval covers both the design and the wording but not how they fit together.
- **R1**: waits for the owner's text on the review form (re-read `verdicts/R1`).
- **Q5** (amber "Not counted — do not repeat"): **remind the owner to check PneumoVax first.**
- Follow-ups outside this repo: PneumoVax `DoseEditor.jsx` still says "Tick this to keep the dose on
  the record" (owner: never "tick"). Whether to offer MenQuadfi before 2 months is a separate
  clinical question (read AAP live before asking).

4. **Batch 2b, P31–P52 (not P40) and P75**: card leads and "Why this" (`recommend.js`,
   `intervals.js`; `noteFold.js` stay-in-view patterns follow P34–P36's new wording). Owner rulings:
   one-sentence notes allowed when they fold whole (P43, P49, P50; U1 test relaxed for exactly
   that). Siblings: the two other "16 or older complete(s/d)" leads, the exposure under-2-months
   lead ("MenACWY starts at 2 months"), the two other combined-shot leads. Prose: 14,948 changed
   (12,533 real), 26 groups, all these edits; 0 answers moved. Test
   `regression-2026-11-20-review-v10-batch2b-card-notes.test.js`. Live-checked.
   Suite then **2,289 / 189 files**. Not changed on purpose: the exposure first-booster notes
   ("…after the primary dose", "ACIP puts the first booster…"), which P38/P39 did not name.

5. **Batch 2c, P53–P66**: the line under each recorded dose (`doseRules.js` templates; the
   repeat line in `recommend.js` names the first product for a wrong-product dose). Label-first
   lines ("Minimum interval not met (3 weeks, 8 required).", "Minimum age not met (…)"), "Do not
   restart.", "Interval: … Required: …", whole years with G1-a-F1's exact gap at a minimum. The
   pieces still render as separate lines: joining them is L2 (Batch 4). Siblings got the same
   pattern (every too-soon and too-young template). `npm run rulebook`: no change. Prose: 12,862
   changed (10,758 real); 0 answers moved. Suite **2,302 / 190**. Live-checked P54.
   Left: the DoseEditor's "Family locked: MenB-4C" line (not in the review; ask with Q2's card
   follow-up), and the pre-existing "Minimum: 10 years (120 months)" in dose "Why this" text.

## Why this is a good stopping point

Batches 1 and 2a are complete and pushed: test first, fix, full suite, wording count, live check.
What's left is independent, and Batch 5 needs one owner answer before it starts.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout port/review-v10-wording && git pull`
   (or branch from `origin/main` if #124 is merged).
2. `npm test`: confirm **2,302 passed / 190 files**. `preview_start {name: "MeningoVax dev server"}`.
3. Per batch (fix-queue skill): `npm run prose -- dump <scratch>/before.txt` → failing test quoting
   the approved wording → fix (no semicolons) → update old tests that pin the old wording (a
   `not.toMatch` on retired text needs an `// extinct:` comment) → `npm test` → prose dump after
   and `npm run prose -- diff` → live check → commit named by item IDs. New test files change
   `docs/agent/testing.md` "Measured counts". A proposal that adds a clinical clause needs its
   source quote (memory `proposed-wording-needs-a-source-too`).
4. Ship skill: push the branch; add each batch to #124 or open a new PR against `main`. Owner merges.
   PR body: wording table, siblings given the same edit, prose counts, "0 answers moved", the E4
   four questions.
