> **SUPERSEDED 2026-11-19** by `handoff-2026-11-19-meningovax-w1-w4-after-fold.md`. #113 and #114 merged;
> its open questions were asked and built as W1–W4 (PR #115). Do not resume from this file.

# MeningoVax port — Handoff after Phase 6.3 Q10, the result-page fold (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-19-meningovax-phase6-g1a-built.md`.

## State (verified 2026-11-19)

- `main` at `9a82e8d` (PR #112, G1-a, squash-merged). **#112 was merged before its F1–F3
  commits were pushed**, so they never reached `main`.
- **PR #113** (`port/phase6-g1a-findings`, off `main`): F1–F3 replayed onto `main`, plus docs
  (handoff/plan fix, the Q10 answers and the fold report). Open.
- **PR #114** (`port/phase6-q10-fold`, off #113's branch, against `main`): the fold. Open.
  Pushed, clean, at `40f6eb5` before this handoff's commit. **2,170 passed, 0 failing, 175 files.**
- **Merge order: #113, then #114.** MeningoVax has no CI; the owner merges. "Merged" means the
  PR shows MERGED and `git diff origin/main <branch>` is empty (squash merges change the sha).
- Dev server: five leftover dev servers from other chats serve this folder (ports 5175–5179), so
  `preview_start {name}` refuses; `preview_start {url: "http://localhost:5175/MeningoVax/"}` works.

## What's done

1. **F1–F3 live-checked** (2026-11-19): "3 months 19 days" on the dose line and "D2→D3: 3 months
   19 days (minimum 4 months)." in "Why this"; no "rescue" on the page; the microbiologist's
   too-soon booster ends "Repeat from Jun 3, 2031." Now in PR #113.
2. **Q10 asked and answered** (owner, 2026-11-19): "Full PneumoVax fold" (reverses 2026-11-06).
   Then two judgement calls: the stay-in-view list "Yes, that list"; sources inside "Why this"
   plus the disclaimer paragraph behind a click "Yes, both". Report with measurements and her
   answers: `docs/archive/report-2026-11-19-result-page-fold.md`.
3. **Q10 built** (PR #114, `40f6eb5`):
   - `src/logic/noteFold.js` (new): `STAY_IN_VIEW` (4 rules: the other-MenB-product switch, the
     minimum beside a routine date, "once 8 weeks have passed", "Not before … which did not
     count"); everything else in a card's lead moves to the front of `detail` with its `[c]`.
     Cards shut by default (neutral status, no booster date) and the pentavalent note are not
     folded.
   - `recommend()` = `foldResult(recommendBeforeFold(input))`; the engine's own dose-day
     look-ahead calls `recommendBeforeFold`.
   - `RecCard.jsx` `RecNote`: source buttons inside the disclosure; "Sources" as the toggle label
     when there is no explanation (PneumoVax's 2026-11-07 ruling, applied, flagged in the PR body).
     `Results.jsx` pentavalent card passes its sources the same way. `Disclaimer.jsx`: "About risk
     history" button (PneumoVax's pattern and CSS).
   - Measured: words in view 280/424/623 → 201/325/523 (typical / wordiest 1 in 10 / worst);
     22,626 of 35,056 cards show no line under the heading; 140 cards show "Sources"; longest
     card "Why this" 66 → 79 words; 0 of 24,600 saved pages lost or gained a word.
   - Guard `src/components/__tests__/regression-2026-11-19-q10-result-page-fold.test.jsx` (13
     tests; proved: fold off → 8 fail, old disclaimer → 1 fails). 8 test files that pin how a
     sentence is written now read `recommendBeforeFold`; the M9 screen test opens "Why this".
   - Docs: CLAUDE.md status, MAP.md, architecture.md, clinical-rules.md, testing.md, plan.
   - Live-checked: worked patient (11 y, complement deficiency, MenQuadfi 2025-11-19), "Why this"
     with sources inside, pentavalent line in view, "About risk history", phone width, no
     console errors.

## What's NOT done

**Owner action first:** merge #113, then #114 (STOP G2: Phase 6 ends with her merge).

**Possible owner questions (ask, don't default):**
- The "Sources" label on 140 cards was applied from her PneumoVax ruling; she may want it asked
  on its own.
- The longest card "Why this" is now 79 words (healthy 16-year-old's MenB card), past G1-a's
  66-word cap, because the folded line now opens it. The G1-a guard checks the engine's text
  before the fold, so it does not catch this. Ask whether to shorten.
- Noticed, not asked: the 13–15 catch-up card says "then the booster at 16–18 years" behind
  "Why this", while the in-view boosters line says "1 more - at age 16".

**Carried over (not started):**
- 264 routine "Booster (16y)" cards wear "Dose due today", not "Booster due today"
  (`RecCard.jsx` `statusPillLabel`).
- See `handoff-2026-11-18-meningovax-phase6-g1-answered.md` "Carried over" (MenB booster note,
  MenB "every 2–3 years", whole-app checks 5 and 7, Phase 4 A2, A10, A11, A16, CDC
  2024-0069/0034/0035/0040 in shared `dateUtils.js`).
- Phases 7–9 of the plan (rulebook, citations, …). Phase 8 includes B15, the "Sources" label,
  which is already built here.

## Why this is a good stopping point

Phase 6 is complete in code: the fold is one change with its own guard, and nothing else is in
flight. Everything left needs either the owner's merge or her answer.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 113 && gh pr view 114`. If both are
   merged: `git checkout main && git pull --ff-only`; `npm test` should give **2,170 passed, 175
   files**. If not, ask the owner; don't build on unlanded branches.
2. `preview_start` "MeningoVax dev server" (or its URL if the leftover servers block it).
3. Ask the owner the questions above, one per box, with a worked patient. Then Phase 7.1.
4. Per item: prototype → measure (saved answers, `npm run prose -- dump/diff` in the scratchpad)
   → failing test → change → docs in the same commit → live check → PR against `main` (E4
   checklist in the body); the owner merges.
