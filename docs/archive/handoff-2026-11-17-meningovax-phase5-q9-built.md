# MeningoVax port — Handoff after Phase 5 STOP F1 (Q9a, Q9b) and B1 were built (2026-11-17, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 5"). **Supersedes**
`handoff-2026-11-17-meningovax-phase4-built.md`.

## State (verified 2026-11-17)

- Branch `feature/2026-11-17-phase5-stop-f1` off `main` (`36b24e0`, Phase 4 #100 merged).
  Pushed, PR open against `main`, waiting for the owner (owner merges; no required CI check).
- Baseline on `main`: 2,019 passed (159 files). Now **2,034 passed, 0 failing (161 files)**.

## What's done

1. `976b7b9` **STOP F1 answers recorded** (no code): `decisions-2026-11-17-open-questions.md`
   ("STOP F1"), plan, CLAUDE.md. Measured first: routine date ≠ minimum ONLY at MenB high-risk
   dose 2 and infant MenACWY doses 2–3 (2-month band). The plan's named places (MenB dose 3, the
   16-year dose, boosters) already advise the routine date.
2. `dac189e` **Q9a, Q9b, B1 built.**
   - Q9a: MenB high-risk dose 2 advised 1 month after dose 1; "It can be given from <date> if
     needed (minimum 4 weeks)" / "today … has passed". `MENB_HIGHRISK_D2_ROUTINE_MONTHS`.
   - Q9b: 2-month-band infant MenACWY dose 2 at 4 months, dose 3 at 6 months, 8-week minimum
     beside it. `MENACWY_INFANT_ROUTINE_AGE_MONTHS`.
   - One sentence helper `minimumBesideRoutine()` (`intervals.js`); the minimum stated is held
     to the floor after a dose that did not count (`repeatFloorDate` passed into `menbRec` /
     `menacwyRec`); a repeat after an uncounted dose gets no routine date (Ruling D).
   - B1: `RecCard.jsx` top line "Next dose due <date>" (was "Next dose not yet due - eligible").
   - The rule table (floor for a dose given) is untouched; tests assert 4 / 8 weeks still count.
   - Tests: `regression-2026-11-17-phase5-q9-routine-date-and-minimum.test.js`,
     `regression-2026-11-17-phase5-next-dose-due-ui.test.jsx`; E2 wrong-family test updated.
   - CDSI: new DELIBERATE family (5 MenB patients 2–3 days after CDSI's recommended 4 weeks);
     2 infant patients now give CDSI's recommended date. OPEN 4, NEW 0.
   - Measured vs `main`: saved answers 0 moved; prose 5,511 of 24,600 (B1 line only, 0 when
     masked); whole-app checks 1–7 identical fault counts. Live-checked the Q9a patient
     (screenshot: "Next dose due Dec 3, 2026" / "…from Dec 1, 2026 if needed (minimum 4 weeks)").
     The infant card was NOT live-checked (tests and CDSI only).

## What's NOT done

**Owner action first:** review/merge this PR.

**Open from this PR (ask, don't decide — consequences of Q9a):**
- **Pentavalent in the gap.** On the 2–3 days between MenB dose 2's 4-week minimum and the
  1-month date, MenB is not "due today", so the pentavalent option is not offered (on `main` it
  was). Asplenia 20 y, Bexsero 11/3/26: Dec 1–2 no pentavalent, Dec 3 offered.
- **The MenB switch line** ("Or finish with Trumenba instead: dose 2 from <date>") now gives the
  routine date (1 month after the other product), still worded "from".

**Phase 5 items in 5.1 not yet measured or built:** B3 (Complete only when nothing owed), B4
(Routine vs Catch-up), B5 (a card never advises an age already passed), B6 (one date format),
B17 (a line about a later age is the app run forward), A5/A6 (dose-line next-dose wording; never
promise a date no card asks for), A13 (grace never advised — held for Q9 here, not swept), A17
(two dates for a too-soon dose in the saved answers).

**Listed findings (not fixed):**
- Every high-risk MenB booster after the first says "1 year after the primary series was
  completed" (`recommend.js`, MenB booster note lead). Date correct (2 years); sentence wrong.
- MenB booster "every 2–3 years": the card advises 2 years (a range, not routine vs minimum).
- Whole-app check 5's 2,977 grid / 20 typical flags are all cards that ask LATER (`asksLater`,
  pregnancy deferral). The checker (`scripts/wholeApp/checks.mjs`, `asksOn`) does not know Q11's
  rule yet; a checker fix, not clinical.

**Still open from Phase 4:** A2 colours, A10, A11, A16; healthy 12 y too-young Bexsero reads
"repeat"; Phase 6 wording items. **Older:** CDC 2024-0069 (unknown MenB product at 16+), healthy
MenB rescue dose 3 (2024-0034/0035), the 1-day calendar difference (2024-0040, shared with
PneumoVax `dateUtils.js`).

## Why this is a good stopping point

The one owner decision in Phase 5 (STOP F1) is built, measured against `main`, documented in the
same commit and live-checked. The rest of 5.1 is wording/measurement work with no owner question
pending except the two consequences above.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr list --state all --head feature/2026-11-17-phase5-stop-f1`.
   If merged: `git checkout main && git pull --ff-only`; `npm test` → expect **2,034 passed, 161
   files**. If not, ask the owner; do not build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Ask the two consequences above, one patient each (memory
   `clinical-questions-issue-sources-recommendation-examples`).
4. Then measure B3–B6, B17, A5, A6, A13, A17 one at a time; any rule change: failing test →
   change → `npm run sweep:update`, prose diff against a `main` worktree, CDSI
   `--save-answers`, whole-app on both → docs in the same commit → live check.
5. Branch + PR against `main`; owner merges. Handoff in this folder, in the same PR.
