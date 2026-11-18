# MeningoVax port — Handoff after Phase 4 (one label per dose) was built (2026-11-17, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default.

**Where things live now (owner, 2026-11-17):** the port plan moved here from PneumoVax:
`docs/archive/plan-2026-11-08-meningovax-port.md`. **Handoffs go in this folder** from now on.
PneumoVax keeps a pointer (`plan-2026-11-08-meningovax-port--SEE-MENINGOVAX.md`); its handoffs up to
B-1 are history. **Supersedes** PneumoVax `docs/archive/handoff-2026-11-17-meningovax-b1-built.md`
(banner added there in PneumoVax PR "plan moves to MeningoVax").

## State (verified 2026-11-17)

- Branch `feature/2026-11-17-phase4-one-label-per-dose` off `main` (`3cb256c`, B-1 #99 merged).
  **Pushed; PR #100 open against `main`, waiting for the owner** (owner merges). MeningoVax has no
  required CI check.
- Baseline on `main`: 1,996 passed (158 files). Now **2,019 passed, 0 failing (159 files)**.
- PneumoVax: one docs PR moves the plan out and leaves the pointer (owner merges). Nothing else
  there was touched.

## What's done — Phase 4 (STOP E1, Q5–Q11)

Answers: `docs/archive/decisions-2026-11-17-open-questions.md` ("STOP E1" section). Rules:
`docs/agent/clinical-rules.md` "One Label Per Dose"; owner-facing `meningococcal-rules-summary.md` §4.

1. `34ea528`: the answers to Q5–Q9 recorded (no code).
2. `d2abc51` **Q5, Q6, Q7, Q9 labels**:
   - Q5: "Not counted — repeat" (was "Invalid").
   - Q6: "Not counted — given before age 10/16" (was "Off-window - repeat"; engine stamps
     `setAsideBeforeAgeY`).
   - Q7: "Booster" kept.
   - Q9: "Dose N" when no series is running.
   - Also: `sweep-never-events` property 13 (every chip is from the closed list).
3. `ba99e24` **Q8, Q10, Q11 rules**:
   - Q8 + Q11: Extra = every card for that vaccine on the dose day asked for nothing. That card is
     `recommend()` run on that date (`cardsOnTheDay`, cached in `cardsSeen`). There is no
     first-dose exception, and college is exempt.
   - Cards with `asksLater` ("Not yet due" / "Not yet age-eligible" / MenB under 16) still ask.
   - Q10: "Not counted — do not repeat" when no card asks today.
   - An Extra dose's line gives only its reason.
4. The plan moved here (this commit, with this file).

Measured against `main`:
- Saved answers: 2,141 of 18,780 and 584 of 5,820 moved. The only card moves are 690 MenACWY
  Complete → Not routinely indicated, and 605 MenB family tags. **No card asks for more doses.**
- Prose: 13,306 of 24,600; with the labels masked, 2,725.
- CDSI: 0 moved (OPEN 4).
- Whole-app: check 5 4,753 → 2,977 grid / 182 → 20 typical; check 6 typical 1 → 21 (MenB on the
  24th birthday, an upper limit, so no grace; listed).
- Live-checked: Q8 and Q10 patients.

**Corrections the owner was told:** Q8 was first asked with a wrong example (re-asked). Q11's "no card
changes either way" was false for the age-10 MenACWY dose and the MenB grace before 16, and was
fixed with `asksLater`. Both are written up in the decisions file.

## What's NOT done

**Owner action first:** review/merge MeningoVax **#100**, and the PneumoVax pointer PR.

**Phase 4 items in the plan's 4.1 not asked or built** (ask, don't default; packet format, memory
`clinical-questions-issue-sources-recommendation-examples`):
- A2 colours (green counted / blue extra / red not counted / grey record problem). Today, "Extra"
  and "given before age" share the off-window colour; "do not repeat" is red.
- A10 (an age rejection names no product; a product rejection names the one to give).
- A11 (a thrown-out dose later repeated: "Repeated on <date>. See that dose.").
- A16 ("Counted — given early, accepted" per vaccine).

**Open from #100 (say so, don't decide):**
- A healthy 12-year-old with a too-young Bexsero reads "repeat", because the card offers MenB from 16
  (`asksLater`). The owner's example, a 1-year-old, reads "do not repeat".
- Phase 6 wording:
  - A too-soon booster's line says "does not count" twice.
  - The routine 16-year dose is "Booster due at 16y" on the card but "Dose 2 of 2" on the record.
  - Record line vs card age at a grace line (from #99).
- Whole-app check 5 still flags 2,977 grid / 20 typical. Examples: MenB "Defer during pregnancy"
  (by design the dose is owed after pregnancy), "Complete (outbreak booster given)". Look at the
  groups before Phase 5.

**Still-open owner questions (from earlier):**
- MenB of unknown product at 16+ (CDC 2024-0069).
- Healthy MenB rescue dose 3 vs 6 months from dose 1 (2024-0034/0035).
- The 1-day calendar difference (2024-0040, shared with PneumoVax: `dateUtils.js` changes go to both
  or neither).

**Next: Phase 5 — dates stated plainly** (plan "Phase 5"; Q9 there, "routine date beside the
minimum?", is now the plan's numbering, distinct from STOP E1's Q9). Ask before building.

## Why this is a good stopping point

Every STOP E1 answer is built, measured against `main`, documented in the same commit, and checked
live. The parts of 4.1 left are separate questions the owner was not asked. Nothing is half-built.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 100 --json state`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` → expect **2,019 passed, 159 files**. If
   not merged, ask the owner; do not build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Ask the open items above one patient at a time (issue, quoted live source, recommendation,
   worked patient + control, the PneumoVax equivalent). A consequence of a ruling is a new question.
4. Each item: `verify-clinical-source` if a rule moves → failing test → change → measure
   (`npm run sweep:update`; `npm run prose -- dump/diff` against a `main` worktree;
   `npx vite-node scripts/cdsi/runTestCases.mjs --save-answers`;
   `npm run whole-app -- --checks 3,5,6,7 --out x.json` on `main` and the branch) → docs in the
   same commit → live check.
5. Branch + PR against `main`; owner merges. The handoff goes in this folder, in the same PR.
