# MeningoVax port — Handoff after Phase 6.2 G1-a was built (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase6-g1b-built.md`.

## State (verified 2026-11-19)

- `main` at `294968c` (PR #111, G1-b, squash-merged): 2,144 passed, 172 files.
- Branch `port/phase6-g1a-style-rules`, off `main`, pushed, clean, **PR #112** open against
  `main` (G1-a, its findings F1–F3, and this handoff): **2,157 passed, 0 failing, 174 files**.
  MeningoVax has no CI checks; the owner merges. #111 was squash-merged, so "merged" means the
  PR shows MERGED and `git diff origin/main <branch>` is empty, not that the head sha is on main.

## What's done

1. **G1-a** (owner, STOP G1, "Yes, the rules"): every dose line, dose "Why this", card lead and
   card "Why this" follows PneumoVax's ten style rules.
   - `doseRules.js`: `about()`/`aboutAgeAt()` and `fmtDays` say "about", never "~" (whole weeks
     exact); `fmtMinAgeAdj` ("10-year minimum age"); `DO_NOT_RESTART` ("Do not restart the
     series.") replaces "This dose does not count toward the series: repeat this dose only (do
     not restart the series)."; minimums fold into each reason; background moved to `whys`.
   - `validate.js` adds `DO_NOT_RESTART`; `recommend.js` `datedRepeatLines` puts the "when"
     BEFORE it. Card text: W1–W5, the 74-word healthy MenB paragraph split, semicolons and
     double dashes gone. `RecCard.jsx` booster banner "about <date>"; `Results.jsx` semicolon.
   - L1 also corrects "recommended at 16–23 years" to its own quote (shared clinical
     decision-making).
   - Measured: 0 verdicts/dates/chips/badges/source numbers moved (saved answers "Nothing
     changed"; prose diff 21,510 of 24,600 patients reworded, 0 citation sequences changed).
     Longest dose line 73 → 50 words, card "Why this" 74 → 66.
   - Guard `regression-2026-11-19-g1a-style-rules.test.js` (proved: "~", a semicolon and the
     old repeat sentence each caught). 84 tests in 34 files pinned old words; updated.
   - Live-checked: L3 patient + MenACWY 3 weeks apart; fresh tab, no console errors. Phone width
     not re-checked (text only got shorter).
   - Every before/after is in the PR #112 body.

## What's NOT done

**Owner action first:** review and merge PR #112.

**G1-a findings: ANSWERED by the owner 2026-11-19, all three as recommended; BUILT 2026-11-19 in PR #112** (test `regression-2026-11-19-g1a-findings-f1-f2-f3.test.js`; saved answers: 810 real + 2 impossible patients each lose one sentence on one booster line, nothing else moved):
1. **G1-a-F1, exact gap.** Where rounding would print the minimum itself ("about 4 months
   after the early dose 2, under the 4-month minimum", 561 real patients), print the exact
   months and days: "Given 3 months 19 days after the early dose 2, under the 4-month minimum
   for the third dose." "Why this": "D2→D3: 3 months 19 days (minimum 4 months)." Other gaps
   keep "about". Worked patient: healthy 19 y (DOB 2007-09-15), Bexsero 2025-08-11, 2025-09-10,
   2025-12-29. Control: dose 3 on 2025-11-10 keeps "about 2 months".
2. **G1-a-F2, drop "rescue".** Card title "Dose 3 of 3 (rescue: dose 2 given early)" → "Dose 3
   of 3 (dose 2 given early)" (492 real cards; changes the Phase 4 closed label list in
   clinical-rules.md); card "Why this" "a third rescue dose is needed" → "a third dose is
   needed" (552 cards). 1,044 real patients. ACIP Oct 2024 (refs `menbRescueDoseRule`): "a
   third dose should be administered ≥4 months after the second dose". Control: Bexsero
   2025-08-11 + 2026-02-11 stays "Complete (2-dose series)".
3. **G1-a-F3, booster lines.** A too-soon MenACWY or MenB booster line ends at "Repeat from
   <date>." without "Do not restart the series." (810 real lines). Every other repeat line
   keeps it. Worked patient: adult microbiologist, Menveo 2-vial 2026-04-08 then 2026-06-03.
   Control: asplenia adult, Menveo 2026-07-01 then 2026-07-22 keeps it.
   (`dose-rules-table.test.js` `floor` expects the repeat sentence last: update it.)

**Not started:**
- **6.3 Q10**: fold the result page? Her 2026-11-06 answer was "PneumoVax only". Ask again;
  build only on a yes. Then STOP G2.
- Open finding carried over: 264 routine "Booster (16y)" cards wear "Dose due today", not
  "Booster due today" (`RecCard.jsx` `statusPillLabel`).
- Carried over: see `handoff-2026-11-18-meningovax-phase6-g1-answered.md` "Carried over"
  (MenB booster note, MenB "every 2–3 years", whole-app checks 5 and 7, Phase 4 A2, A10, A11,
  A16, CDC 2024-0069/0034/0035/0040 in shared `dateUtils.js`). Then Phases 7–9.

## Why this is a good stopping point

G1-a is one complete wording pass in one PR, with its own guard; nothing else is in flight.
The next item (Q10) needs an owner answer before any code.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 112`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,157 passed, 174 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Ask the owner Q10 (worked patients). Ask, don't default.
4. Per item: prototype → measure (saved answers, `npm run prose -- dump/diff` in the scratchpad)
   → failing test → change → docs in the same commit → live check → PR against `main` (E4
   checklist in the body); the owner merges.
