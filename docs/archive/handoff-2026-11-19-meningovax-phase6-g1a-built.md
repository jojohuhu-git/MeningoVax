# MeningoVax port — Handoff after Phase 6.2 G1-a was built (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase6-g1b-built.md`.

## State (verified 2026-11-19)

- `main` at `294968c` (PR #111, G1-b, squash-merged): 2,144 passed, 172 files.
- Branch `port/phase6-g1a-style-rules`, off `main`, pushed, clean, **PR #112** open against
  `main` (`e6f34af` G1-a, then this handoff): **2,150 passed, 0 failing, 173 files**.
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

**Open findings from G1-a (listed in PR #112, not fixed, ask):**
1. "about 4 months after dose 2, under the 4-month minimum" (115–119 days rounds to 4 months):
   show weeks/days there? Pre-existing.
2. "rescue" dropped from dose lines but kept in the card label "Dose 3 of 3 (rescue: dose 2
   given early)" and its "Why this" (rule 7). Label is on the Phase 4 closed list.
3. "Do not restart the series." also ends a too-soon booster line (no series to restart).

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
   `git checkout main && git pull --ff-only`; `npm test` should give **2,150 passed, 173 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Ask the owner the three G1-a findings and Q10 (one question each, worked patients). Ask,
   don't default.
4. Per item: prototype → measure (saved answers, `npm run prose -- dump/diff` in the scratchpad)
   → failing test → change → docs in the same commit → live check → PR against `main` (E4
   checklist in the body); the owner merges.
