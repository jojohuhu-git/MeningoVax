# MeningoVax — Handoff after M1 was built (high-risk MenB dose 3 follows CDSI) (2026-11-20, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-20-meningovax-m1-and-rulebook-reorg.md`.

Branch: `port/m1-menb-dose3-cdsi`, off `main` `357fd5a`. **Pushed**; PR
https://github.com/jojohuhu-git/MeningoVax/pull/126 is open against `main`, **not merged** (the
owner merges). Baseline was 2,359 passing (195 files); now **2,368 passing (196 files)**, all green
(`npm test`, 2026-11-20), working tree clean.

## What's done

- **M1b / M1c asked and answered** (owner, 2026-11-20, both as recommended). Recorded in
  `docs/archive/decisions-2026-11-20-rulebook-reorg.md` ("M1 consequences"). Commit `2462d39`.
- **M1 built** (commit `4c70c43`, PR #126). A high-risk MenB dose 3 under 4 months after dose 2
  AND under 6 months after dose 1 is "Not counted — repeat" (was: counted, "Dose 4 of 4" owed).
  The repeat counts ≥4 months after the dose that did not count, or ≥6 months after dose 1 (4-day
  grace on both, M1c). The card's date is the latest of the three lines, with "Earliest valid
  date" beside it (M1b). No 4-dose high-risk series any more.
  - Code: `seriesTotals.js` (`menbHighRiskDose3Early(d1, prev, d3)`, measured from the last dose
    GIVEN, the Ruling D anchor; `MENB_HIGHRISK_RESCUE_TOTAL` removed), `doseRules.js` (row
    `MENB-HIGHRISK-EARLY-DOSE-3` is now a floor; row `MENB-HIGHRISK-DOSE-4-AFTER-EARLY-DOSE-3`
    retired), `recommend.js` (dose-3 card times the repeat; "Dose 4 of 4" card removed),
    `intervals.js`, `rulebookPage.js`, `refs.js` (mm7349a3 and Best Practice quotes re-read live
    2026-11-20), `rulebook.js` (owner answers M1, M1b, M1c), `scripts/cdsi/cdsiRuleMap.mjs`
    (app and CDSI now agree on dose 3; no open CDSI differences left).
  - Docs in the same commit: CLAUDE.md "MenB D3", `clinical-rules.md`,
    `meningococcal-rules-summary.md` (§5 regenerated), `testing.md` counts.
  - Moved answers: 336 of 18,780 saved patients, all high-risk MenB on the old 4-dose series
    (308 now "Not counted — repeat" + "Dose 3 of 3"; 28 now complete because a later dose that
    was a too-soon "dose 4" counts as the repeat). `npm run prose`: same 336, no others.
  - Live check (dev server): asplenia, Bexsero Aug 1, Sep 1, Sep 15 2026 → dose 3 "Not counted —
    repeat", "Dose 3 of 3 (high-risk, Bexsero)", "Next dose due Feb 1, 2027", "Earliest valid
    date: Jan 15, 2027 (minimum interval 4 months after the invalid dose)". Rulebook screen shows
    the new sentences and no "Dose 4". Production build succeeds.

## Tell the owner (not yet raised as questions)

1. **Correction to the M1b question's control.** The preview said Jan 1, Feb 1, Apr 1 would show
   no earliest-valid line. Because of her M1c answer (a repeat ≥6 months after dose 1 counts), it
   does show one: due Aug 1, earliest valid Jul 1. Pinned in the M1 test.
2. **Wording:** the earliest-date line uses the app's existing review-v10 wording ("Earliest valid
   date: …"), not the preview's "It can be given from … if needed".
3. **Possible owner question (consequence of M1b, not asked):** an ordinary first dose-3 card
   (no early dose 3) still shows no earliest-valid date, though a dose at 4 months after dose 2
   counts (C5). Only the repeat card shows it. Ask whether the first dose-3 card should too.
4. The dose line under the not-counted dose says "Repeat from <the card's due date>" (e.g. Feb 1),
   while the card shows an earlier valid date (Jan 15). Same pattern as other repeat lines.

## What's NOT done — the remaining queue

1. **Owner merges PR #126.** Check `origin/main` before calling it merged (memory: stacked PRs).
2. **Rulebook reorganization** (not started): decisions file items 1–10. New branch off `main`
   **after #126 merges**. Show before/after drawings first for anything not already drawn (the
   nine folds, the full MenB section after M1): owner memories `show-layout-changes-before-building`
   and `rulebook-screen-mockup-direction`. Ask (offered, unanswered): all nine folds closed by
   default, or MenACWY/MenB open; light grey shading on the Minimum interval column. The tests
   that will change on purpose are listed in the superseded handoff, section 2. Note: M1 already
   changed the Part 6 intervals row for high-risk dose 3 ("Sooner does not count. Repeat it."), so
   "Sooner counts, but a dose is added" holds only healthy MenB dose 2, as planned.
3. **Carried over:** Q5 (amber "Not counted — do not repeat"; approved; check PneumoVax's labels
   first). STOP H (owner reviews `docs/agent/meningococcal-rules-summary.md`). Not yet asked:
   PneumoVax `DoseEditor.jsx` "Tick this…"; MenQuadfi before 2 months (read AAP live first);
   PneumoVax design parity (L1–L4/L7, P71); DoseEditor "Family locked: MenB-4C" (brand names, Q2).

## Why this is a good stopping point

M1 is complete as one clinical change, in one PR, with its docs, moved answers explained and a
live check. The Rulebook reorganization must not start until #126 is on `main`, and it needs owner
answers and drawings first.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`:
   is #126 merged? If yes, `git checkout main && git pull` and branch for the Rulebook work.
2. `npm test`: confirm **2,368 passed / 196 files**. `preview_start {name: "MeningoVax dev server"}`.
3. Raise the four "Tell the owner" points. Ask the two Rulebook layout questions; draw before/after.
4. Per item: failing test → change → `npm test` → `npm run sweep:update` if answers move (explain
   the count) → `npm run rulebook` → live check → commit named by ID. E4 checklist in the PR body.
5. Ship: branch → PR against `main`; the owner merges.
