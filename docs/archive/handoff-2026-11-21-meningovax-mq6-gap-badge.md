# MeningoVax — Handoff after MQ6-e to MQ6-h: the 6-week dose and the "Can be given today" badge (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions, ask, don't default. **Supersedes**
`handoff-2026-11-21-meningovax-session1-small-fixes.md` (#130, #131 and #132 are all merged).

Branch: `fix/menquadfi-6-week-dose-next-date`, off `main` at `f61ddac` (#132). **Pushed**; PR
https://github.com/jojohuhu-git/MeningoVax/pull/133 is open against `main`, **not merged** (the
owner merges; this repo runs no CI checks). Baseline on `main` was 2,421 passing (203 files); now
**2,430 passing (204 files)**, 0 failing (`npx vitest run`, 2026-11-21).

## What's done

- **Merged PR #132's conflicts with main** (`0fadc6f`, before #132 merged): kept both sides in
  `src/data/rulebook.js` and `docs/agent/testing.md`.
- **MQ6-e** (`f88bc85`): a high-risk/travel/outbreak baby whose MenQuadfi was given at 6 weeks,
  seen before 2 months, read "Not needed" / "Dose 1 given; next dose not yet due" with no date. It
  now gets the card it gets from 2 months: dose 2 due at 4 months, earliest valid 8 weeks after
  dose 1 (AAP 2026 catch-up table: "8 weeks"). `recommend.js` `menacwyInfantSeries` lets the case
  through its under-2-months gate. Test:
  `regression-2026-11-21-menquadfi-6-week-dose-gives-dose-2-date.test.js`.
- **MQ6-f/g/h** (`c59397d`): the owner's principle, *"if the standard schedule can be followed it
  should be"*; a dose at the minimum still counts. There is no "Can be given today" badge any more
  (`RecCard.jsx`); between a minimum and a routine date the card reads "Next dose not yet due"
  (MenB dose 2, a repeated MenB dose 3, the 6-week MenQuadfi card). The summary line dropped "MenQuadfi
  can be given today." and "MenB dose 2 can be given today." (`Results.jsx`). `canGiveToday` is now
  on MenB dose 2 only, read only by the combined-shot offer (F2a kept, "Dose 2 only"); a repeated
  dose 3 no longer opens the combined shot early. Sweep `sweep-never-events.test.js` property 14
  widened. Docs: `clinical-rules.md`, `meningococcal-rules-summary.md` (SOURCES tags `owner:MQ6-e`
  to `owner:MQ6-h`), `rulebookPage.js`.
- All answers, with the questions as asked: `docs/archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md`.
- Numbers: saved answers 0 of 18,780 moved; wording 0 of 24,600 (the saved grids have no patient
  on a gap day or in the 6-week band, so they cannot see these changes; the tests and the sweep do).
  Live-checked in the app (three made-up patients, no console errors).

## What's NOT done — the remaining queue

1. **Owner merges PR #133.** Check `origin/main` before calling it merged.
2. **Open questions from #131 and #133 (ask, one at a time):**
   - The 6-week MenQuadfi card's "MenQuadfi may be given from 6 weeks" sits behind "Why this". Since
     MQ6-g it is the only place the card mentions the 6-week option. Keep it folded or in view?
   - That card names MenQuadfi only, while dose 1 is advised at 2 months, when Menveo is licensed
     too. Not asked.
   - No date of birth → no 6-week card (applied unasked in #131).
3. **Close old PR #70?** #130 rebuilt and replaced it. Ask the owner.
4. **MenB editor note** "Brand unknown: both MenB families remain open… lock the series to that
   antigen family" (`DoseEditor.jsx`): jargon by the Q2 standard ("Match the first"). Ask before
   changing.
5. **Q5** (amber "Not counted — do not repeat"): waits for the owner to look at PneumoVax's labels.
6. **STOP H** (the owner's review of `docs/agent/meningococcal-rules-summary.md`), then **Phase 8**
   (citations), opening with **Q12**: does her "same dose, decide alone" rule carry over from
   PneumoVax? Then Phase 9 (`docs/archive/plan-2026-11-08-meningovax-port.md`).
7. A separate PneumoVax session (from the earlier handoff): "Tick this…", design parity L1–L4/L7 and
   P71, and whether PneumoVax's Rules screen follows this Rulebook layout. Draw a before/after first.

## Why this is a good stopping point

MQ6-e to MQ6-h are one PR, tested, live-checked, with the owner's answers recorded. What's left is
owner questions and owner reviews; none blocks the PR.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #133 is merged: `git checkout main && git pull`; the suite should show **2,430 / 204 files**.
2. `preview_start {name: "MeningoVax dev server"}`.
3. Ask the open questions above (item 2 first). The owner wants short questions with a worked
   patient and a before/after screen; long questions get "explain, I don't understand".
4. Per item: reproduce → failing test → fix → full suite → live check → commit named by ID. A moved
   answer must be explained (`npm run sweep:update`, `npm run prose`). Put the E4 checklist in the
   PR body; a new test file means updating `docs/agent/testing.md`'s counts.
5. Ship: branch, then a PR against `main`; the owner merges.
