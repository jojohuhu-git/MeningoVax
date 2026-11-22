> **SUPERSEDED 2026-11-21** by `handoff-2026-11-21-meningovax-c11-minimum-age-sources.md`. The minimum-age question is answered and built (`f91fbe1`, PR #141); do not resume from this file.

# MeningoVax — Handoff after C11: "not counted" dose lines cite their rule (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-rulebook-sources-per-vaccine.md`
(#140 merged as `ec60c85`).

Branch `phase8/c11-dose-line-citations`, with `origin/main` (#140) merged in. Pushed; **PR #141**
against `main` (https://github.com/jojohuhu-git/MeningoVax/pull/141), 7 files. **The owner merges.**
Baseline was 2,475 passing (209 files); now **2,493 passing (210 files)**, 0 failing
(`npx vitest run`, 2026-11-21, after the merge). Working tree clean after the handoff commit.

## What's done

1. **Rulebook Sources per vaccine** (PR #140, merged): each MenACWY/MenB row cites only its own
   vaccine; `SENTENCE_VACCINE` in `src/data/rulebookPage.js` labels all 71 quoted sentences.
   **A new quoted sentence in `refs.js` must be added there** or its guard fails.
2. **C11 dose-line citations** (`37eacf5`, PR #141; owner chose it 2026-11-21). Nine rules in
   `src/logic/doseRules.js` printed a not-counted reason with no [c]; each now cites the sentence
   for its own claim, a sentence its row's `sourcesSay.refs` lists. Helpers `acwyMinAgeCite`,
   `acwyBoosterGapCite`, `withMark`, `citesOf` (before `brandLabelOf`). ACWY-TRAVEL-BOOSTER-GAP
   and MENB-HEALTHY-RESCUE-DOSE-3-GAP gained refs; rulebook §5 regenerated. Measured: uncited
   not-counted lines **6,177 → 1,036** over 42,301 test patients; **0 answers moved**; wording
   3,449 of 24,600 saved patients. Guard `regression-2026-11-21-dose-lines-cite-their-rule.test.js`
   (18 checks, all failed before). Four older wording tests updated to expect the mark. Live-checked
   (16-y asplenia: MenACWY 3-week dose 2 and Trumenba-after-Bexsero both show [1] with ACIP's
   sentence on hover). Report: `docs/archive/report-2026-11-21-c11-dose-line-citations.md`.

## Settled design note (owner, 2026-11-21)

A card's source buttons **expand with "Why this"**, to keep the card cleaner; they stay inside the
card's "Why this" fold (as owner Q10, 2026-11-19). While it is closed, a [n] mark on a dose line
or booster line has no visible button beside it. That is intended: the mark itself links to the
exact sentence (hover shows the quote; click opens it). The owner noticed this live after C11 and
kept it. Do not move the buttons out of the fold or propose it again.

## What's NOT done — the remaining queue

1. **Owner merges PR #141.** Check `origin/main` before calling it merged.
2. **Owner question (C11, asked in PR #141; ask, don't default):** 1,036 "Minimum age not met"
   lines carry no mark: Penbraya 476, Penmenvy 336, Menactra 168, unknown brand 56. No quoted
   MenACWY minimum-age sentence states these (unknown brand's 2 months is owner C13). Q12 says
   escalate when there's no source sentence. Possible sources to offer her, each needing a live read first:
   `cdcChildMenbMinAge` already names Penbraya at 10 years (a MenB note); `pentavalentLicensed10to25`.
   They are listed in the guard's `NO_SENTENCE_YET`.
3. **Card-note citations for doses that COUNT** (deferred: card wording, its own item): the
   Rulebook rows "No dose 3 is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3
   was early … Counts" rows show only booster sentences. A counted dose has no reason line; the
   card note would cite `cdcChildMenbHighRiskD2SixMonthsNoD3` (cited nowhere in the app yet) /
   `menbHighRiskEarlyD3Unless`.
4. **C4, next documents by size** (`node scripts/uncitedByDocument.mjs`; numbers predate C11, so
   re-run): mm7349a3 7,550; CDC complement-inhibitor page 6,224; CDC vaccine-recommendations
   3,194; CDC Adult Notes 1,252; immunize.org ACWY 888, MenB 492.
5. **Seen, not acted on:** `routineBoosterStillOwedNote`'s lead has an em dash (banned in
   user-visible strings, owner D7; the G1-a guard misses it). Ask before changing wording.
6. Rest of Phase 8 (plan table C): C5, C6, C7, C9, C10, C12, C13; age-doubt note and transplant
   stop buttons (Results.jsx) not numbered. Then Phase 9.

## Why this is a good stopping point

Both owner requests of this session are built, guarded, live-checked and in PRs (#140 merged,
#141 open). What remains is one owner question and separate card-wording items.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #141 merged: `git checkout main && git pull`; the suite should show **2,493 / 210 files**.
2. Dev server: this folder often already has 5 servers from other chats (the cap). If
   `preview_start {name}` refuses, use `preview_start {url: "http://localhost:5175/MeningoVax/"}`
   (they serve this folder). The patient form is a 5-step wizard (Age, Risks, MenACWY, MenB, Results).
3. Ask the owner item 2's question first, with a worked patient (e.g. Penbraya given at 9) and
   the candidate sentences quoted live. Then ask which of items 3/4 comes next.
4. Per item (Q12, `docs/archive/report-2026-11-21-phase8-citations-measured.md`): decide alone when
   the dose is unchanged; escalate no-row / different doses / verdict moves. Failing test → fix →
   full suite → live check → commit. Moved answers: `npm run sweep:update` and explain; wording:
   `npm run prose -- dump/diff`; after touching `refs.js` or a rule's refs: `npm run rulebook`,
   and add any new quoted key to `SENTENCE_VACCINE`. E4 checklist in every PR body.
5. Ship: branch off `main`, PR against `main`; the owner merges. No force-push.
