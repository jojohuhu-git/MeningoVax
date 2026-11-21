# MeningoVax — Handoff after the "given before age 16" label key was fixed (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-20-meningovax-rulebook-reorg-built.md`.

Branch: `port/label-key-before-16`, off `main` `9969525` (PR #127, Rulebook reorganization,
merged 2026-11-21). **Pushed**; PR https://github.com/jojohuhu-git/MeningoVax/pull/128 is open
against `main`, **not merged** (the owner merges; no CI checks run on this repo). Baseline was
2,369 passing (196 files); now **2,373 passing (197 files)**, all green (`npm test`, 2026-11-21),
working tree clean at `6ca0692` (plus this handoff's commit).

## What's done

- **Label-key finding (from the 2026-11-20 handoff).** The label "Not counted — given before age
  16" marks a healthy MenB dose before 16 AND a routine MenACWY booster before 16; the Rulebook's
  key explained only MenB. Owner asked why not one chip "given before the minimum age"; answered
  ("minimum age" already means too young for the vaccine, the "repeat" label; merging reverses Q6).
  **Owner: "Keep two, fix key".** `CHIP_LEGEND` in `src/data/rulebookPage.js` has a new MenACWY row
  (first): "Routine MenACWY booster before 16 years. The booster is given at 16 years or older."
  (worked patient `boosterAt15`; its Source quotes ACIP "at age 16 years"; "or older" checked
  against the engine). `Rulebook.jsx` key is now chip + text (two rows share a chip). Guard
  `regression-2026-11-21-label-key-before-16-both-vaccines.test.jsx`; Batch 5 wording test updated;
  `docs/agent/testing.md` counts updated. Decision recorded in
  `docs/archive/decisions-2026-11-20-rulebook-reorg.md`. 0 of 24,600 patients' wording moved;
  `npm run rulebook` diff 0; build OK. Live-checked. Commit `6ca0692`, PR #128.

## What's NOT done — the remaining queue

1. **Owner reviews and merges PR #128.** Check `origin/main` before calling it merged.
2. **Q5** (amber "Not counted — do not repeat"): approved, but the owner asked to look at
   PneumoVax's dose labels herself first. Reminded 2026-11-21; not built. Wait for her.
3. **STOP H**: owner reviews `docs/agent/meningococcal-rules-summary.md`.
4. **Not yet asked:** PneumoVax `DoseEditor.jsx` "Tick this…"; MenQuadfi before 2 months (read AAP
   live first); PneumoVax design parity (L1–L4/L7, P71); DoseEditor "Family locked: MenB-4C"
   (brand names, Q2); whether PneumoVax's Rules screen should follow the Rulebook layout
   (`design-review` skill: record, don't drop).
5. **Seen, not raised:** `npm run build` prints two CSS minify warnings (`App.css` ~line 1646,
   "Expected identifier but found whitespace"). Present on `main` before this session; the build
   still succeeds. Worth a look in a design pass.

## Why this is a good stopping point

The label-key fix is one complete change in one PR, answered by the owner, test-first, suite green,
checked live, no patient answer moved. Everything left needs owner answers or her own check.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`:
   is #128 merged? If yes, `git checkout main && git pull`.
2. `npm test`: confirm **2,373 passed / 197 files**. `preview_start {name: "MeningoVax dev server"}`.
3. Ask the open questions above; don't default. Layout changes: draw before/after first.
4. Per item: failing test → change → `npm test` → `npm run sweep:update` if answers move (explain
   the count) → `npm run rulebook` → live check → commit named by ID. E4 checklist in the PR body.
   A new test file means updating the counts table in `docs/agent/testing.md`.
5. Ship: branch → PR against `main`; the owner merges.
