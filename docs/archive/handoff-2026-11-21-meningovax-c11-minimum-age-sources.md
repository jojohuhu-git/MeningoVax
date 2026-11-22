# MeningoVax — Handoff after the C11 minimum-age sources (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-c11-dose-line-citations.md`.

Branch `phase8/c11-dose-line-citations`, pushed, in sync with its remote. **PR #141** against
`main` (https://github.com/jojohuhu-git/MeningoVax/pull/141), still **open; the owner merges**.
Baseline was 2,493 passing; now **2,497 passing (210 files)**, 0 failing (`npx vitest run`,
2026-11-21). Working tree clean after this handoff's commit. Last code commit `f91fbe1`.

## What's done

1. **C11 dose-line citations** (`37eacf5`, PR #141): see the superseded handoff and
   `docs/archive/report-2026-11-21-c11-dose-line-citations.md`.
2. **C11 follow-up: the minimum-age question, answered and built** (`f91fbe1`, same PR; owner
   answers in `docs/archive/decisions-2026-11-21-c11-minimum-age-sources.md`):
   - Penbraya cites `cdcChildAcwyMinAge`, whose quote now runs to "…10 years [MenACWY-TT/MenB-FHbp,
     Penbraya]" (CDC's stray ")" kept as printed; read live 2026-11-21).
   - Penmenvy cites new `penmenvyAged10BothIndicated` (ACIP box: "Persons aged ≥10 years for whom
     MenACWY and MenB are both indicated"); added to `SENTENCE_VACCINE` under MenABCWY.
   - Menactra and unknown brand stay unmarked (owner; guard's `NO_SENTENCE_YET`).
   - Both the dated and undated MenACWY minimum-age rules, via `acwyMinAgeCite()` in `doseRules.js`.
   - Measured: unmarked lines 1,036 → 224; 0 answers moved; wording 924 of 24,600 saved patients,
     source marks only. Guard +4 checks (failed before). Live-checked both brands. PR body updated.

## Settled design note (owner, 2026-11-21)

A card's source buttons stay inside "Why this"; a [n] with no visible button beside it while the
fold is closed is intended. Do not move the buttons out or propose it again.

## What's NOT done — the remaining queue

1. **Owner merges PR #141.** Check `origin/main` before calling it merged.
2. **Card-note citations for doses that COUNT** (deferred: card wording, its own item): the Rulebook
   rows "No dose 3 is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was early
   … Counts" rows show only booster sentences. The card note would cite
   `cdcChildMenbHighRiskD2SixMonthsNoD3` (cited nowhere yet) / `menbHighRiskEarlyD3Unless`.
3. **C4, next documents by size** (`node scripts/uncitedByDocument.mjs`; numbers predate C11, so
   re-run): mm7349a3 7,550; CDC complement-inhibitor page 6,224; CDC vaccine-recommendations 3,194;
   CDC Adult Notes 1,252; immunize.org ACWY 888, MenB 492.
4. **Seen, not acted on:** `routineBoosterStillOwedNote`'s lead has an em dash (banned in
   user-visible strings, owner D7; the G1-a guard misses it). Ask before changing wording.
5. **Seen, not acted on:** MenB-side minimum-age lines cite one general MenB sentence
   (`menbLicensedAge1025`) for every brand, Penmenvy included, though `cdcChildMenbMinAge` names
   Bexsero/Trumenba/Penbraya. Not asked; a citation-only call under Q12 if picked up.
6. Rest of Phase 8 (plan table C): C5, C6, C7, C9, C10, C12, C13; age-doubt note and transplant stop
   buttons (Results.jsx) not numbered. Then Phase 9.

## Why this is a good stopping point

The one open owner question from C11 is answered, built, guarded, live-checked and on PR #141.
What remains are separate items, none blocked by this work.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #141 merged: `git checkout main && git pull`; the suite should show **2,497 / 210 files**.
2. Dev server: this folder usually has 5 servers from other chats (the cap). If
   `preview_start {name}` refuses, use `preview_start {url: "http://localhost:5175/MeningoVax/"}`
   and confirm it serves this folder (fetch `/MeningoVax/src/data/refs.js`). The patient form is a
   5-step wizard (Age, Risks, MenACWY, MenB, Results).
3. Ask the owner which of items 2/3 comes next (ask, don't default).
4. Per item (Q12, `docs/archive/report-2026-11-21-phase8-citations-measured.md`): decide alone when
   the dose is unchanged; escalate no-row / different doses / verdict moves. Failing test → fix →
   full suite → live check → commit. Moved answers: `npm run sweep:update` and explain; wording:
   `npm run prose -- dump <file>` before and after, then `npm run prose -- diff <a> <b>`; after
   touching `refs.js` or a rule's refs: `npm run rulebook`, and add any new quoted key to
   `SENTENCE_VACCINE`. E4 checklist in every PR body.
5. Ship: branch off `main`, PR against `main`; the owner merges. No force-push.
