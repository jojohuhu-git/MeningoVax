> **SUPERSEDED 2026-11-22** by `handoff-2026-11-22-meningovax-c4-complement-page.md`. C4 document 3 (the CDC complement page) is built in PR #143; do not resume from this file.

# MeningoVax — Handoff after C4 document 2: the ACIP Oct 2024 report cited (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-c11-minimum-age-sources.md`
(PR #141 merged as `2dccc5a`).

Branch `phase8/c4-mm7349a3`, off `main` at `2dccc5a`. Pushed; **PR #142** against `main`
(https://github.com/jojohuhu-git/MeningoVax/pull/142), open; **the owner merges**. MeningoVax has no
CI checks. Baseline was 2,497 passing (210 files); now **2,508 passing (211 files)**, 0 failing
(`npx vitest run`, 2026-11-22). Code commit `5d6ca57`; working tree clean after this handoff's commit.

## What's done

1. **C4 document 2, mm7349a3 (ACIP's Oct 2024 Bexsero report)** (`5d6ca57`, PR #142). The owner
   picked it 2026-11-22. Five new `refs.js` keys, each read live 2026-11-22 in the browser pane and
   checked as an exact substring: `menbScdm1623General`, `menbBoosterSameManufacturer`,
   `menbHealthy2DoseSeparated6Months`, `menbBoosterIfRemainOrBecomeAtRisk`,
   `menbLicensedAge1025Acip2024` (all added to `SENTENCE_VACCINE` under MenB). In `recommend.js`:
   - healthy MenB "not routine" cards (under 16 / over 23): the 16–23 shared-decision line;
   - high-risk MenB dose 2: `menbHighRisk3DoseSchedule` (as dose 1 and dose 3);
   - high-risk boosters: the same-family line;
   - healthy 2-dose complete: lead and "no booster unless high risk";
   - high-risk under 10: "licensed from age 10 years [c]".
   Button removed: `outbreak_b` now has `refs: ['cdcRecommendations']` and
   `menbRefs: ['mm7349a3', 'cdcRecommendations']`, so the MenB-only report leaves its MenACWY
   cards. The MenB "Complete (outbreak booster given)" card filters `mm7349a3` out.
2. **Measured:** mm7349a3 uncited **7,459 → 0**; any uncited button 16,311 → 10,810; **0 answers
   moved**; wording 10,520 of 24,600 saved patients, **0 sentences changed** (marks, hovers and
   button lists only; 1,960 lists gained the 2024 button, 860 lost it). Guard:
   `regression-2026-11-22-c4-mm7349a3-cited-where-it-speaks.test.js` (11 of 11 failed before).
   Live-checked: a complement patient aged 19 with one Bexsero dose (dose 2 line [1] = ACIP Oct 2024,
   hover quotes the sentence), and a healthy 12-year-old's MenB card.
3. **Tests changed on purpose** (explained in the PR): four tests that pinned exact source lists;
   `regression-2026-11-21-rulebook-sources-per-vaccine.test.jsx` now matches whole quoted sentences
   (a bare substring match read the new licensure sentence as Penmenvy's shorter quote inside it).

## What's NOT done — the remaining queue

1. **Owner merges PR #142.** Check `origin/main` before calling it merged.
2. **C4, next documents by size** (`node scripts/uncitedByDocument.mjs`, measured 2026-11-22 after
   this change): CDC complement-inhibitor page **6,224** (an asplenia patient's high-risk MenB
   dose-1 card also shows it, via `refs(['cdcComplementInhibitor', 'mm7349a3'])`); CDC
   vaccine-recommendations **3,194** (`outbreak_b` still puts it on both vaccines' cards; decide
   there); CDC Adult Notes **1,252**; immunize.org ACWY **888**, MenB **492**.
3. **Card-note citations for MenB doses that COUNT** (deferred from C11; card wording): the Rulebook
   rows "No dose 3 is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was early
   … Counts" rows. The card would cite `cdcChildMenbHighRiskD2SixMonthsNoD3` /
   `menbHighRiskEarlyD3Unless`.
4. **Seen, not acted on (wording; ask first):** em dashes in user-visible strings (owner D7 bans
   them; the G1-a guard misses both): `routineBoosterStillOwedNote`'s lead ("still owed — the
   recorded dose"), and the high-risk MenB booster card's detail ("primary series — MenB-4C …").
5. **Seen, not acted on (citation-only, Q12):** the high-risk MenB dose 1/2/3 cards cite the
   Bexsero-worded schedule sentence for every brand; mm7349a3 also has "ACIP recommends MenB-FHbp
   vaccine as … a 3-dose series (at 0, 1–2, and 6 months) for those at increased risk" for
   Trumenba. MenB-side minimum-age lines likewise cite one general sentence (`menbLicensedAge1025`)
   for every brand.
6. Rest of Phase 8 (plan table C): C5, C6, C7, C9, C10, C12, C13; age-doubt note and transplant stop
   buttons (Results.jsx) not numbered. Then Phase 9.

## Why this is a good stopping point

The second-largest uncited document is now cited wherever it appears, with every call explained in
PR #142. No owner question is open from this work; the remaining items are independent.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #142 merged: `git checkout main && git pull`; the suite should show **2,508 / 211 files**.
2. Dev server: this folder usually has 5 servers from other chats (the cap). If
   `preview_start {name}` refuses, use `preview_start {url: "http://localhost:5175/MeningoVax/"}`
   and confirm the server runs from this folder
   (`lsof -a -p $(lsof -tiTCP:5175 -sTCP:LISTEN) -d cwd`). The patient form is a 5-step wizard.
   CDC blocks `curl`: read pages in the browser pane (`javascript_tool` on `document.body.innerText`).
3. Ask the owner which of items 2–5 comes next (ask, don't default).
4. Per document (Q12, `docs/archive/report-2026-11-21-phase8-citations-measured.md`): decide alone
   when the dose is unchanged; escalate no-row / different doses / verdict moves. Break a document
   down with `node scripts/uncitedByDocument.mjs <url>`. Failing test → fix → full suite → live
   check → commit. `npm run prose -- dump <file>` before and after, then `-- diff`; after touching
   `refs.js`: `npm run rulebook`, add each new quoted key to `SENTENCE_VACCINE`, and bump
   `docs/agent/testing.md`'s counts when a test file is added. E4 checklist in every PR body.
5. Ship: branch off `main`, PR against `main`; the owner merges. No force-push.
