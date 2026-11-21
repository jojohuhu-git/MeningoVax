> **SUPERSEDED (2026-11-21):** PR #127 merged and the label-key finding was fixed (PR #128). Resume from `handoff-2026-11-21-meningovax-label-key-before-16.md`, not this file.

# MeningoVax — Handoff after the Rulebook reorganization was built (2026-11-20, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-20-meningovax-m1-built.md`.

Branch: `port/rulebook-reorg`, off `main` `a26400f` (M1, PR #126, merged). **Pushed**; PR
https://github.com/jojohuhu-git/MeningoVax/pull/127 is open against `main`, **not merged** (the
owner merges). Baseline was 2,368 passing (196 files); now **2,369 passing (196 files)**, all green
(`npm test`, 2026-11-20), working tree clean at `a167801` (plus this handoff's commit).

## What's done

- **Layout answers** (owner, 2026-11-20): all nine folds closed by default; light grey shading on
  the Minimum interval column. Recorded in `docs/archive/decisions-2026-11-20-rulebook-reorg.md`
  ("Layout points"). Commit `fb8ad94`.
- **Before/after drawing** shown in chat (inline widget, not saved); owner: "Build as shown".
- **Rulebook reorganization, items 1–10** (commit `a167801`, PR #127). `src/data/rulebookPage.js`
  (below "THE PAGE"), `src/components/Rulebook.jsx` (rewritten), `src/App.css` (Quick look / age
  line / step-panel styles removed; new fold, group-table, grey-column rules).
  - "How MeningoVax decides" = one fold, seven one-sentence steps, each a link that opens its part.
  - Nine parts (`HEADINGS`): Stop check, The vaccines, MenACWY, MenB, More than one condition, The
    combined shot, Doses on the record, MeningoVax decisions, Sources. All closed at first.
  - Removed: Quick look, age lines, risk-group table, MenACWY "Other indications" table (repeated
    the group table), per-step panels, "Counts as" column, the source count and read date.
  - New data: `ACWY_GROUPS`, `MENB_GROUPS` (rows carry `ids` of the conditions they cover),
    schedule tables (`ACWY_ROUTINE`, `ACWY_HIGHRISK_TABLES`, `MENB_HEALTHY`, `MENB_HIGHRISK`: rows of
    dose / routine / min), `MENB_DOSE3_EARLY`, `MENB_OTHER`, `SOONER_ADDS`, `NOT_COUNTED.general/
    special`, `SOURCE_GROUPS`, `FAMILIES.finish`. New worked patient `boosterAt15`.
  - Tests: D1 test renamed/rewritten as `regression-2026-11-20-rulebook-reorganization.test.jsx`;
    engine guard, Batch 5 wording and Q2 tests updated (removed text marked `// extinct:`).
  - 0 saved answers moved; `npm run rulebook` diff 0 lines; `npm run build` OK. Live check: folds
    closed, MenB tints and grey column, step link opens its part, no sideways scroll at 375px. The
    app has no dark theme.

## Tell the owner (in the PR body; not yet answered)

1. New wording not drawn as text: minimum *age* in the first row's Minimum interval cell ("Minimum
   age 10 years"; dash for infant tables); MenB step sentence "High-risk patients start MenB at 10
   years, and healthy patients aged 16–23 years may choose it."
2. **Finding, not fixed:** a routine MenACWY booster before 16 is labelled "Not counted — given
   before age 16", but the label key says that label means "Healthy MenB before 16 years". The key's
   sentence is incomplete. Ask how to word it (a label-key wording question, not a new label).

## What's NOT done — the remaining queue

1. **Owner reviews and merges PR #127.** Check `origin/main` before calling it merged.
2. **The finding above** (label-key sentence): ask first.
3. **Carried over:** Q5 (amber "Not counted — do not repeat"; approved; check PneumoVax's labels
   first). STOP H (owner reviews `docs/agent/meningococcal-rules-summary.md`). Not yet asked:
   PneumoVax `DoseEditor.jsx` "Tick this…"; MenQuadfi before 2 months (read AAP live first);
   PneumoVax design parity (L1–L4/L7, P71); DoseEditor "Family locked: MenB-4C" (brand names, Q2).
   Design parity: the Rulebook layout change is MeningoVax-only so far; whether PneumoVax's Rules
   screen should follow is an owner question (`design-review` skill: record, don't drop).

## Why this is a good stopping point

The reorganization is one complete change in one PR, built as drawn, with the suite green, the
screen checked live, and no patient answer moved. What is left needs owner answers.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`:
   is #127 merged? If yes, `git checkout main && git pull`.
2. `npm test`: confirm **2,369 passed / 196 files**. `preview_start {name: "MeningoVax dev server"}`.
3. Ask the open questions above; don't default. Layout changes: draw before/after first
   (memory `show-layout-changes-before-building`).
4. Per item: failing test → change → `npm test` → `npm run sweep:update` if answers move (explain
   the count) → `npm run rulebook` → live check → commit named by ID. E4 checklist in the PR body.
5. Ship: branch → PR against `main`; the owner merges.
