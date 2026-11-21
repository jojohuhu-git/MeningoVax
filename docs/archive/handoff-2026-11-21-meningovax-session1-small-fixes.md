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

1. **MenQuadfi from 6 weeks: answered, NOT built.**
   - Owner's answer: "Can be given today", MenQuadfi only; dose 1 still due at 2 months.
   - Lead: "The infant series starts at 2 months; MenQuadfi may be given from 6 weeks."
   - Source: AAP 2026 schedule, the owner's PDF at `~/Downloads/AAP-Immunization-Schedule.pdf`.
     AAP's site blocks automated reading, so read the PDF with macOS PDFKit (`osascript -l
     JavaScript`); there is no pdftotext here. The quotes are in the decisions file.
   - **Ask first:** the app also gives the infant series to `outbreak_acwy`
     (`menacwyInfantSeriesIndicated`), but AAP's 6-week line sits only under the high-risk group
     and travel. Does the offer apply to an outbreak baby?
   - Build:
     - add the AAP quote to `refs.js`;
     - make the change in `recommend.js` (the existing `canGiveToday` badge; brands MenQuadfi only);
     - write a failing test first;
     - run the sweep (`npm run sweep:update`, explain the count) and `npm run rulebook`;
     - update the Rulebook text that says the series starts at 2 months;
     - check the change against the `vaccine-parity` skill.
   - Seen while measuring, not raised: a 7-week-old whose MenQuadfi was given at 6 weeks shows
     "Dose 1 given; next dose not yet due" with **no date**. At 9 weeks the same baby shows
     3 Feb 2027. Measure it again after the build; it may change.
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
3. Ask the outbreak question above, then build MenQuadfi from 6 weeks test-first (`fix-queue`
   loop). Put the E4 checklist in the PR body. A new test file means updating
   `docs/agent/testing.md`'s counts.
4. Ship: branch, then a PR against `main`; the owner merges.
