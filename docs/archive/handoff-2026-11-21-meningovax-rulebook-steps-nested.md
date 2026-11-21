# MeningoVax — Handoff after the Rulebook steps were made to hold their sections (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-21-meningovax-label-key-before-16.md`.

Branch: `port/rulebook-steps-nested`. PR #128 was squash-merged to `main` (`e3b4559`,
2026-11-21); `main` was then merged into this branch to clear the conflicts (main held nothing the
branch lacked). **Pushed**; PR https://github.com/jojohuhu-git/MeningoVax/pull/129 is open against
`main`, **not merged** (the owner merges; this repo runs no CI checks). Baseline was 2,373 passing
(197 files); now **2,386 passing (198 files)**, all green (`npm test`, 2026-11-21), working tree
clean.

## What's done

- **Steps hold their sections** (owner, 2026-11-21; answers recorded in
  `docs/archive/decisions-2026-11-20-rulebook-reorg.md`, last section). "How MeningoVax decides"
  holds six steps, each its own fold with its section inside:
  - Stop check;
  - Read the record: The vaccines, MenB products, label key, "does not count" (the R74 lead was
    dropped, owner "Drop it", 2026-11-21: it repeated the step's summary);
  - MenACWY schedule, with the MenACWY rows of "More than one condition";
  - MenB schedule, with pregnancy and the MenB rows;
  - Set the dates: minimum intervals and grace;
  - Combined shot.

  Step 7 "The cards" was dropped. MeningoVax decisions and Sources sit under "Reference".
  Everything starts closed. "Show all" (beside the bar) opens every fold, including the
  decisions list's phone folds, then reads "Hide all". `HEADINGS` are now the step names plus
  the two Reference folds; `riskRankingFor(vaccine)` splits `RISK_RANKING`. Files:
  `src/data/rulebookPage.js`, `src/components/Rulebook.jsx`, `src/App.css`.
  - Guard: `regression-2026-11-21-rulebook-steps-hold-their-sections.test.jsx`.
  - Four older Rulebook tests were re-pointed at the new folds.
  - `docs/agent/testing.md` counts updated.
  - `npm run rulebook`: nothing written. No worked patient or clinical rule moved.
  - Live-checked at desktop and 375px width. Commits `999c0ce`, `cc2cdd4`; PR #129.

## What's NOT done — the remaining queue

1. **Owner reviews and merges PR #129** (#128 is merged). Check `origin/main` before calling it
   merged.
2. **Q5** (amber "Not counted — do not repeat"). It is approved, but the owner wants to look at
   PneumoVax's labels herself first. Wait for her.
3. **STOP H**: the owner reviews `docs/agent/meningococcal-rules-summary.md`.
4. **Not yet asked:**
   - PneumoVax `DoseEditor.jsx` "Tick this…".
   - MenQuadfi before 2 months (read AAP live first).
   - PneumoVax design parity (L1–L4/L7, P71).
   - DoseEditor "Family locked: MenB-4C" (Q2).
   - Whether PneumoVax's Rules screen should follow this Rulebook layout, including the
     nested steps and Show all (`design-review` skill: record, don't drop).
5. **Seen, not raised:** `npm run build` prints two CSS minify warnings (`App.css`). They were on
   `main` before; the build still succeeds.

## Why this is a good stopping point

The layout change is one complete unit:
- answered by the owner;
- built test-first, with the suite green;
- live-checked, in one PR.

Everything left needs the owner's answers or her own review.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   Is #129 merged? If yes, `git checkout main && git pull`.
2. `npm test`: confirm **2,386 passed / 198 files**. `preview_start {name: "MeningoVax dev server"}`.
3. Ask the open questions above; don't default. For layout changes, draw a before/after first.
4. Per item:
   - failing test, then the change, then `npm test`;
   - `npm run sweep:update` if answers move (explain the count);
   - `npm run rulebook`;
   - live check, then commit named by ID.

   Put the E4 checklist in the PR body. A new test file means updating
   `docs/agent/testing.md`'s counts.
5. Ship: branch, then a PR against `main`; the owner merges.
