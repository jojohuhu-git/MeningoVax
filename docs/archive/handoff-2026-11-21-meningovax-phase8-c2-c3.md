# MeningoVax — Handoff after Phase 8 opened: Q12, the citation measurement, C2/C3 (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-stop-h-done.md` (#136 is merged).

Branch `phase8/q12-and-citation-measure`, off `main` at `bf318fb` (#136). Pushed; **PR #137** open
against `main` (https://github.com/jojohuhu-git/MeningoVax/pull/137); **the owner merges** (this repo
runs no CI checks). Baseline was 2,439 passing (205 files); now **2,443 passing (206 files)**, 0
failing (`npx vitest run`, 2026-11-21), working tree clean before this handoff file.

## What's done

1. **Q12 answered: "Yes, same as PneumoVax"** (`15617d2`). Decide alone which source goes on a card
   when every candidate gives the same dose. Escalate, as worked patients: (a) no document has a row
   for the history, (b) documents give different doses, (c) the change would move a verdict. A guard
   test is required, and every judgement call goes in the PR body, grouped. Memory:
   `citation-calls-decide-alone-when-dose-unchanged`.
2. **Citations measured** (`15617d2`, `bb18c78`): `scripts/citationMapping.mjs` (new; in MAP.md) and
   `docs/archive/report-2026-11-21-phase8-citations-measured.md`, a table of where C1–C13 stand.
   C1 and C8 were already done; C5 (`population`) and C12 (quote pop-up) are not started.
3. **C2/C3 built** (`caf1fed`): `cardSources()` in `src/components/RecCard.jsx`, ported from PneumoVax,
   produces both the numbers and the buttons in one calculation. Each button shows "[n]", under a
   "Sources" heading inside "Why this". A number names the document (`#…` dropped from the link).
   A button that no sentence cites stays, numbered, after the cited ones. Owner answers: **"Order you
   read"** (top of the card down; "Why this" first on cards open by default) and **"Open reads 1, 2"**
   (108 cards show [2] alone while "Why this" is shut). Guard: `regression-2026-11-21-c2-c3-numbered-sources.test.jsx`.
   Four older tests updated to the new order. 0 answers moved. Wording: 22,960 of 24,600 saved
   patients read differently, nearly all the new heading and button numbers. Checked live on the
   owner's worked patient. Judgement call listed in the PR: 8,244 cards keep two
   "ACIP 2020 MMWR" buttons (different tables), now sharing one number. Nothing was merged away.
4. `66372f1`: CLAUDE.md "Current Work" and the plan's table C mark Q12, C2, C3 and C8 done.

## What's NOT done — the remaining queue

1. **Owner merges #137.** Check `origin/main` before calling it merged.
2. **Phase 8, the rest** (plan `docs/archive/plan-2026-11-08-meningovax-port.md`, table C, and the
   report above): C4 (21,180 cards have a button no sentence cites: cited or taken off, **one PR per
   document, each read whole, tables included**), C5 (`population` on every quote), C6 (CDC first),
   C7 (6,206 cards cite one sentence on several recorded doses; check PneumoVax's C7 before calling
   it a defect), C9 (CDC link opens the closed section), C10, C11, C12 (quote pop-up), C13. Under Q12
   the dose-unchanged calls are yours; (a)/(b)/(c) go to the owner as worked patients. **Q12's guard
   test is not written yet.** Write it with the first per-document PR, the first one that takes
   anything off a card.
3. Not numbered yet: the age-doubt note's sources and the transplant stop message's buttons (Results.jsx).
4. **Phase 9** (close), after Phase 8. Not started.
5. Separate PneumoVax session (from earlier handoffs): "Tick this…", design parity L1–L4/L7 and P71,
   and whether PneumoVax's Rules screen follows this Rulebook layout. Not started.

## Why this is a good stopping point

Q12 is answered and C2/C3 is complete and checked in the running app. The rest of Phase 8 goes one
document at a time, and each document is its own PR, so no unfinished work sits on this branch.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #137 is merged: `git checkout main && git pull`; the suite should show **2,443 / 206 files**.
2. `preview_start {name: "MeningoVax dev server"}`.
3. Pick the first document for C4. Choose it by how many cards cite it
   (`node scripts/citationMapping.mjs` lists examples). Read it whole, live (`verify-clinical-source`).
   Any removal where the dose is unchanged is yours to make; list it in the PR. Escalate (a)/(b)/(c).
4. Per item: failing test → fix → full suite → live check → commit named by ID. A moved answer must
   be explained (`npm run sweep:update`); count wording with `npm run prose -- dump` / `diff`. After
   touching a quote in `refs.js`, run `npm run rulebook`. E4 checklist in every PR body.
5. Ship: branch off `main`, PR against `main`; the owner merges.
