# MeningoVax port — Handoff after Phase 6.2 R-A/R-B/R-C was built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase6-f5-built.md`.

## State (verified 2026-11-18)

- `main` at `8453494` (PR #109 merged: R-A–R-C + the R-C chip): **2,138 passed, 171 files**
  (re-run 2026-11-18). **#109 was merged one commit early**: its head was `b4123e5`, so item 3
  below (the later-shot follow-up, `dbeedba`) never reached `main`.
- Branch `port/phase6-r-c-later-shot`, off `main`, pushed, **PR #110** open against `main`: that
  one commit, cherry-picked unchanged, plus this handoff fix: **2,140 passed, 0 failing (171 files)**;
  the 2 new tests fail on `main`'s engine. Live-checked (healthy 10 y, Bexsero Sep 1 and Oct 6,
  2025: both doses "Not counted — do not repeat", no "Repeated on"; on `main` dose 1 still says
  "Repeated on Oct 6, 2025"). MeningoVax has no CI checks; the owner merges. The old branch
  `port/phase6-r-abc-undated-repeat` is spent; don't reuse it.

## What's done

1. **R-A / R-B / R-C** (owner, STOP G1): a "Not counted — repeat" line under a card that asks
   later but prints no date now says when. Each of the three cards carries `repeatLater`
   (`recommend.js`, constants `REPEAT_LATER_MENB_HIGH_RISK`, `REPEAT_LATER_ACWY_ROUTINE`,
   `REPEAT_LATER_MENB_HEALTHY`); `datedRepeatLines` reads it only when no card asks now and none
   is deferred; F-4b ("Repeated on …") still wins. R-C drops the repeat sentence.
   Measured: 574 / 588 / 822 real lines (match the packet); 2,443 patients' wording moved
   (1,755 real, 688 impossible); saved answers moved only in sentence counts (0 differences
   otherwise). 242 patients still have an undated repeat line: all pregnancy (group D, as decided).
   Live-checked: Maya (2 y, complement, Bexsero at 12 mo), Noah (healthy, MenQuadfi at 3 wk),
   Ava (healthy 10 y, Bexsero at 9). Guard: `regression-2026-11-18-r-abc-undated-repeat-line.test.js`
   (3 ending tests fail on the old engine; 5 controls pass on both); `dose-rules-table.test.js`
   accepts the three endings. Docs: clinical-rules.md, rules summary, testing.md, plan, CLAUDE.md.
2. **R-C chip** (owner, 2026-11-18, "Yes, do not repeat"): R-C doses carry `notRepeated`, so the
   chip reads "Not counted — do not repeat". 822 real patients, chip words the only change
   (prose diff byte-identical to the measured prototype); saved answers unchanged. R-A and R-B
   keep "repeat". Live-checked on Ava.
3. **R-C with a later shot** (owner, 2026-11-18: "It depends - did the patient need MenB or no";
   answer measured: none of the 1,104 did, all 10–11 y with no risk or a MenACWY-only one; then
   "Yes, build it"): in `datedRepeatLines` the R-C ending is applied before F-4b, so under the
   R-C card no MenB dose says "Repeated on" and every too-young one reads "do not repeat".
   1,104 real patients, 0 impossible; saved answers unchanged. R-A/R-B keep F-4b. Live-checked
   (Ava with Bexsero Sep 1 and Oct 6, 2025). Owner principle worth reusing: "repeat" only if
   the patient needed that vaccine.

## What's NOT done

**Owner action first:** review and merge PR #110 (no open question left in it). Before saying
"merged", check that the PR's head commit is on `origin/main`.

**Not started, Phase 6.2, in order, one PR each, each off `main` after the previous merges**
(`docs/agent/testing.md` counts conflict between stacked branches):
1. **G1-b** dose-line "Why this" fold-out (port PneumoVax's `DoseValidation`).
2. **G1-a** style-rules rewrite with a machine guard (see
   `handoff-2026-11-18-meningovax-phase6-g1-answered.md` item 5).

**Open finding (not fixed, ask):** 264 routine "Booster (16y)" cards due today have the badge
"Dose due today", not "Booster due today" (`RecCard.jsx` `statusPillLabel`, `seriesTotal`
counting; switching to `primaryTotal` would mislabel 36 catch-up cards).

**Carried over (not fixed):** see `handoff-2026-11-18-meningovax-phase6-g1-answered.md`
"Carried over" (MenB booster note, MenB "every 2–3 years", whole-app checks 5 and 7, Phase 4 A2,
A10, A11, A16, CDC 2024-0069/0034/0035/0040 in shared `dateUtils.js`). Then 6.3 (Q10, ask again).

## Why this is a good stopping point

R-A–R-C is complete and isolated in one PR; its chip question and the later-shot consequence are answered and built. G1-b touches the same dose-line component and `testing.md`
counts, so it should start from `main` once #110 lands.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 110`. If merged (head commit on `origin/main`):
   `git checkout main && git pull --ff-only`; `npm test` should give **2,140 passed, 171 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Prose measuring: `npm run prose -- dump <file>` before and after, then
   `npm run prose -- diff <before> <after>` (~12 s each; dumps go in the scratchpad). Saved answers:
   `npx vite-node scripts/updateSavedAnswers.mjs`, then diff old/new with
   `sed -E 's/:n[0-9]+/:n#/g'` on both to prove only sentence counts moved.
4. Per item: prototype → measure → failing test → change → docs in the same commit → live check
   → PR against `main` (E4 checklist in the body); the owner merges.
