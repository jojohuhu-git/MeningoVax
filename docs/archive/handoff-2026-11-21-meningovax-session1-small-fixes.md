# MeningoVax — Handoff after session 1's small fixes (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-21-meningovax-rulebook-steps-nested.md` (#129 is merged).

Branch: `fix/session1-small-fixes`, off `main` at `46cc24d`. **Pushed**; PR
https://github.com/jojohuhu-git/MeningoVax/pull/130 is open against `main`, **not merged** (the
owner merges; this repo runs no CI checks). It rebuilds and supersedes the old PR #70, which is
still open: ask the owner before closing it. Baseline was 2,386 passing (198 files); now **2,394
passing (200 files)**, all green (`npm test`, 2026-11-21).

## Owner's order (2026-11-21)

1. Session 1: the small fixes (this session).
2. Meanwhile: the owner does **STOP H** (reviews `docs/agent/meningococcal-rules-summary.md`).
3. Then Phase 8 (citations), opening with **Q12**: does her "same dose, decide alone"
   delegation carry over from PneumoVax?
4. A PneumoVax session: "Tick this…", design parity L1–L4/L7 and P71, and whether PneumoVax's
   Rules screen follows this Rulebook layout. Draw a before/after first.

## What's done

- **Fix 1** (`e74d475`): a dose dated in the future reads "In the future" instead of the age the
  patient will be. This rebuilds PR #70 on today's code. `isFutureDated()` in `doseRules.js` is
  used by the `RECORD-FUTURE-DATE` row and by `RecCard.jsx` `describeDose`. Test:
  `regression-2026-11-21-future-dose-chip-says-in-the-future.test.jsx`. Live-checked.
- **Fix 4** (`42095ec`): the two build warnings were one nameless style block (a leftover from
  #120). It made the browser drop `.rb-who`. The block is deleted. Test:
  `regression-2026-11-21-stylesheet-has-no-broken-block.test.js` (esbuild, fails on any warning).
  The build is clean, and `.rb-who` loads live.
- **Q2 follow-on** (`8b09a8b`): the MenB editor line now reads "Every MenB dose must match the
  first: Bexsero or Penmenvy." (or "Trumenba or Penbraya"). Owner: "Match the first".
  `DoseEditor.jsx`. Tests are in `Results.test.jsx` and `App.test.jsx`. Live-checked.
- **Owner answers recorded** (`8099814`): `docs/archive/decisions-2026-11-21-session1-small-fixes.md`.
- Numbers: 0 answers moved. Prose: 2,310 of 24,600 patients changed, all impossible entries (the
  future-dated ones); 0 ordinary patients. `npm run rulebook`: nothing written.

## What's NOT done — the remaining queue

1. **MenQuadfi from 6 weeks (MQ6): BUILT, PR https://github.com/jojohuhu-git/MeningoVax/pull/131,
   not merged.**
   - Owner: "Can be given (Rec.)" and "Yes, outbreak too".
   - Branch `port/menquadfi-from-6-weeks`, off `main` at `46cc24d`, 2,396 passing / 199 files.
   - Decisions: `docs/archive/decisions-2026-11-21-menquadfi-from-6-weeks.md`.
   - Two choices were applied unasked and are asked in the PR body:
     - no date of birth → no offer;
     - the AAP sentence folds behind "Why this" (not on the owner's stay-in-view list).
   - Summary line: owner "Yes, add it" (MQ6-c), built in #131: "No MenACWY or MenB doses due
     today. MenQuadfi can be given today." #131 is now 2,399 passing / 199 files.
   - **Open, not asked:** the same gap for MenB. A 12-year-old with asplenia, MenACWY up to
     date, Bexsero 29 days ago (seen 2026-11-21) gets a MenB card "Can be given today" (dose 2
     past its 4-week minimum, before its 1-month routine date) under the summary line "No
     MenACWY or MenB doses due today." (`Results.jsx`; the MenB line exists only when the
     combined shot is offered). Ask whether to add "MenB dose 2 can be given today."
   - Seen while measuring, not raised: a 7-week-old whose MenQuadfi was given at 6 weeks shows
     "Dose 1 given; next dose not yet due" with **no date** (at 9 weeks: 3 Feb 2027). Ask.
   - **Merge note:** #130 and #131 both raise the counts in `docs/agent/testing.md` (lines 24–26,
     and a new row each). Whichever merges second will conflict there. Keep both rows; the totals
     become 201 files (132 engine, 65 screen, 64 happy-dom). Then `npm test` must pass.
2. **Owner merges PR #130.** Check `origin/main` before calling it merged. Then ask whether to
   close #70 (superseded).
3. **Q5** (amber "Not counted — do not repeat"): the owner has **not yet** looked at PneumoVax's
   labels. Wait for her.
4. **STOP H** (the owner's review), then **Phase 8**, then **Phase 9**
   (`docs/archive/plan-2026-11-08-meningovax-port.md`).
5. **Not yet asked:** the editor's other note, "Brand unknown: both MenB families remain open.
   Once a brand is selected for dose 1, the engine will lock the series to that antigen family."
   (`DoseEditor.jsx`). It is jargon by Q2's standard. It is a consequence of Q2, so ask; don't
   change it unasked.

## Why this is a good stopping point

The three fixes are one PR: tested, live-checked, with no answers moved. The MenQuadfi change is a
clinical rule change with one open follow-on question, so it belongs in its own PR.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   Is #130 merged? If yes, `git checkout main && git pull`; the suite should then show **2,394 /
   200 files**.
2. `preview_start {name: "MeningoVax dev server"}`.
3. Check whether #130 and #131 are merged (see the merge note above). Ask the open questions.
   Then STOP H / Phase 8 per the owner's order. Put the E4 checklist in the PR body. A new test file means updating
   `docs/agent/testing.md`'s counts.
4. Ship: branch, then a PR against `main`; the owner merges.
