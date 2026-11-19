# MeningoVax port — Handoff after Phase 7.1 (dose rules) and 7.3 (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md`. **Supersedes**
`handoff-2026-11-19-meningovax-w1-w4-after-fold.md`.

## State (verified 2026-11-19)

- `main` at `a6836ad` (#115, W1–W4, MERGED).
- Branch `port/phase7-rulebook`, off `main`, pushed. **PR #116** open against `main`:
  https://github.com/jojohuhu-git/MeningoVax/pull/116. Work commit `bac6518`, plus this handoff's commit.
- **2,221 passed, 0 failing, 177 files** (baseline on `main` was 2,179 / 176).
- MeningoVax has no CI; the owner merges. "Merged" = PR shows MERGED and
  `git diff origin/main <branch>` is empty (squash merges change the sha).
- Dev server: five leftover servers (ports 5175–5179) all serve this folder and hold the
  5-per-folder limit, so `preview_start {name}` refuses; `preview_start {url: "http://localhost:5175/MeningoVax/"}` works.

## What's done

1. **Owner decision (2026-11-19):** the rulebook is `docs/agent/meningococcal-rules-summary.md`
   grown, NOT a new `CLINICAL_SPEC.md` (root keeps three files). Recorded in the plan, CLAUDE.md,
   and the summary's header.
2. **7.1 (dose rules part):** the summary's new **§5** sits between `RULE-TABLE:START/END` markers and
   is written by `npm run rulebook` (`scripts/rulebook.mjs` → `src/data/rulebook.js`) from
   `DOSE_RULES` + `CITATIONS`: the 37-row table (app's check order), 22 numbered "App decision N"
   (verdict owner-decided / record-keeping / no-source), every quoted sentence with link and read date.
   Guard: `src/logic/__tests__/rulebook-table-matches-code.test.js` (cell by cell, per rule; whole
   section line by line). Tamper-checked: a hand-edited cell fails naming rule + column.
3. **R-7:** the "copied into vaxapp" line removed from `rule-docs-match-code.test.js`.
4. **7.3:** CLAUDE.md "What the PneumoVax Port Made Permanent" (one rule table; moved answer
   explained; one label list; rulebook held to the code).
5. Docs in the same commit: architecture.md (rulebook.js), MAP.md (scripts), testing.md (new test,
   counts), plan §Phase 7 (7.1 PART BUILT, 7.3 BUILT).

## What's NOT done

**Owner action first:** review and merge PR #116.

**Rest of 7.1 (not started):** quotes and dates for the card/forecast rules in summary §§1–3
(schedules, booster cadence, pentavalent eligibility, college 5-year cover, etc.). They live in
`recommend.js` with no row table, so there is nothing to generate from. Ask the owner before
building: (a) hand-written quotes in §§1–3 held by `rule-docs-match-code.test.js` statedNear checks,
or (b) a describer table for card rules like `DOSE_RULES` (bigger). Don't default.

**7.2 / Q11 (not asked):** in-app Rulebook tab (plan §D1, D2). Ask with a mock-up; build only on a yes.
Then **STOP H** (owner reviews the rulebook). Then Phase 8 (ask Q12 at its start).

**Not asked, carried from the W1–W4 handoff (ask, don't default):**
- The 24-year-old recruit's "Booster (16y)" "Why this" is long and uses a dash; not measured
  against the G1-a style rules.

**Carried over (not started):** "Sources" toggle label (raise only if she does);
`handoff-2026-11-18-meningovax-phase6-g1-answered.md` "Carried over" list (MenB booster note, MenB
"every 2–3 years", whole-app checks 5 and 7, Phase 4 A2, A10, A11, A16, CDC 2024-0069/0034/0035/0040
in shared `dateUtils.js`).

## Why this is a good stopping point

The dose-rule rulebook is one self-contained PR with its own guard and no screen change. The
remaining 7.1 work needs an owner choice of approach, and 7.2 needs her Q11 answer, so nothing
more can be built honestly without asking.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 116`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,221 passed, 177 files**.
   If not merged, ask the owner; don't stack on the unlanded branch.
2. `preview_start` (see the dev-server note above).
3. Ask the two open questions (rest of 7.1: approach a or b; Q11 with a mock-up).
4. Per item: prototype → measure → failing test → change → docs in the same commit (run
   `npm run rulebook` after any `doseRules.js` / `refs.js` change) → live check if on screen →
   PR against `main` with the E4 checklist; the owner merges.
