# MeningoVax port — Handoff after Phase 6.2 R-A/R-B/R-C was built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase6-f5-built.md`.

## State (verified 2026-11-18)

- `main` at `f4b055f` (PR #108, F-5 + both follow-ups, merged): 2,130 passed, 170 files (re-run
  this session).
- Branch `port/phase6-r-abc-undated-repeat`, off `main`, pushed, **PR #109** open against `main`
  (commit `cf87aa8` + this handoff): **2,138 passed, 0 failing (171 files)**. MeningoVax has no CI
  checks; the owner merges.

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

## What's NOT done

**Owner action first:** review and merge PR #109, and answer its one question:
- **R-C chip (ask, don't default):** Ava's line no longer says "repeat" but her chip still reads
  "Not counted — repeat". Recommended: "Not counted — do not repeat" (Q10's chip for a dose
  nobody is owed). Measured by prototype (thrown away): 822 real patients, chip words the only
  change. Build = in `datedRepeatLines`, add `notRepeated: true` when `later.dropRepeat`; update
  the R-C test's chip expectation, saved answers unchanged (chip isn't in them; re-check), docs.
  Control: R-A keeps "repeat".

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

R-A–R-C is complete and isolated in one PR; its only loose end (the chip) is an owner question,
measured and written into the PR. G1-b touches the same dose-line component and `testing.md`
counts, so it should start from `main` once #109 lands.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 109`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,138 passed, 171 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Prose measuring: `npm run prose -- dump <file>` before and after, then
   `npm run prose -- diff <before> <after>` (~12 s each; dumps go in the scratchpad). Saved answers:
   `npx vite-node scripts/updateSavedAnswers.mjs`, then diff old/new with
   `sed -E 's/:n[0-9]+/:n#/g'` on both to prove only sentence counts moved.
4. Per item: prototype → measure → failing test → change → docs in the same commit → live check
   → PR against `main` (E4 checklist in the body); the owner merges.
