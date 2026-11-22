> **SUPERSEDED 2026-11-21** by `handoff-2026-11-21-meningovax-stop-h-done.md`. PRs #134 and #135 are merged, Q5 and STOP H are done; do not resume from this file.

# MeningoVax — Handoff after MQ6-i/j/k, PR #70 closed, and the MenB editor note (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after
screen; ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-mq6-gap-badge.md` (#133
is merged).

`main` is at `c1fc9bc` (#133): **2,430 passing (204 files)**, 0 failing (`npx vitest run`,
2026-11-21). Two PRs are open against `main`, both pushed, **not merged** (the owner merges; this
repo runs no CI checks). They touch different files and do not depend on each other.

| PR | Branch | Commit | Suite on that branch |
|---|---|---|---|
| https://github.com/jojohuhu-git/MeningoVax/pull/134 | `fix/mq6-both-brands-before-2-months` | `6baca84` | 2,439 passing (205 files), 0 failing |
| https://github.com/jojohuhu-git/MeningoVax/pull/135 | `fix/menb-brand-unknown-note-plain-words` | `5164056` + this handoff | 2,430 passing (204 files), 0 failing |

After both merge, expect **2,439 passing (205 files)**.

## What's done

All answers are recorded with the questions as asked in
`docs/archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md` (MQ6-i/j/k) and
`docs/archive/decisions-2026-11-21-session1-small-fixes.md` (the editor note, PR #70).

1. **MQ6-i** ("Keep folded"): the 6-week card's "MenQuadfi may be given from 6 weeks" stays behind
   "Why this". No code.
2. **MQ6-j** ("Both brands", PR #134): a high-risk/travel/outbreak baby of 6 weeks to under 2
   months with no MenACWY yet now gets Menveo 2-vial and MenQuadfi, the 2-month card's brands
   (`recommend.js`, `MENACWY_INFANT_SERIES_BRANDS`). AAP 2026 catch-up table: "2 months
   MenACWY-CRM, 6 weeks MenACWY-TT". Test `regression-2026-11-21-mq6-j-both-brands-before-2-months.test.js`;
   three older tests changed to the new answer. Docs: `clinical-rules.md`,
   `meningococcal-rules-summary.md` (SOURCES tag `owner:MQ6-i/j/k`, `npm run rulebook` re-run),
   `src/data/rulebook.js`, `testing.md`. Saved answers 0 of 18,780 moved; wording 0 of 24,600
   (no saved patient in that age window). Live-checked.
3. **MQ6-k** ("Keep as is"): an age typed without a date of birth gets no 6-week card. No code;
   its control is in the MQ6-j test.
4. **PR #70 closed** (owner: "Close it"), with a comment pointing to #130.
5. **MenB editor note** ("Reuse Q2 wording", PR #135): "Brand unknown: both MenB families remain
   open…" is now "Brand of dose 1 unknown. Enter it if known: every MenB dose must match the
   first." (`DoseEditor.jsx`; test in `Results.test.jsx`). Wording 0 of 24,600 changed (the grid
   reads cards, not the editor). Live-checked on the MenB history step.

## What's NOT done — the remaining queue

1. **Owner merges #134 and #135.** Check `origin/main` before calling either merged.
2. **Q5** (amber "Not counted — do not repeat"): waits for the owner to look at PneumoVax's
   labels. Not started.
3. **STOP H** (the owner's review of `docs/agent/meningococcal-rules-summary.md`), then **Phase 8**
   (citations), opening with **Q12**: does her "same dose, decide alone" rule carry over from
   PneumoVax? Then Phase 9 (`docs/archive/plan-2026-11-08-meningovax-port.md`). Not started.
4. A separate PneumoVax session (from earlier handoffs): "Tick this…", design parity L1–L4/L7 and
   P71, and whether PneumoVax's Rules screen follows this Rulebook layout. Draw a before/after
   first. Not started.

## Why this is a good stopping point

Every open question from the last handoff is answered, and every answer that needed code is in a
tested, live-checked PR. What's left is owner review (two PRs, STOP H) and Q5, which waits on her.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -4`.
   If both PRs are merged: `git checkout main && git pull`; the suite should show **2,439 / 205 files**.
2. `preview_start {name: "MeningoVax dev server"}`.
3. Ask the owner which next: Q5 (once she has looked at PneumoVax) or STOP H. Ask, don't default.
4. Per item: reproduce → failing test → fix → full suite → live check → commit named by ID. A moved
   answer must be explained (`npm run sweep:update`; wording with `npm run prose -- dump` /
   `diff`). Put the E4 checklist in the PR body; a new test file means updating `testing.md`'s counts.
5. Ship: branch off `main`, then a PR against `main`; the owner merges.
