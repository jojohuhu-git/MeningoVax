> **SUPERSEDED 2026-11-22** by `handoff-2026-11-22-meningovax-c4-cdc-recs-page.md`. #143's conflicts are fixed and C4 document 4 (the CDC recommendations page) is built in PR #144; do not resume from this file.

# MeningoVax — Handoff after C4 documents 2 and 3: ACIP Oct 2024 report and CDC complement page (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-c4-mm7349a3.md`.

Two open PRs, stacked; **the owner merges, #142 first**:
- **PR #142** `phase8/c4-mm7349a3` (off `main` at `2dccc5a`): C4 document 2, mm7349a3.
  https://github.com/jojohuhu-git/MeningoVax/pull/142
- **PR #143** `phase8/c4-complement-inhibitor` (branched from #142, opened against `main`): C4
  document 3, the CDC complement-inhibitor page. https://github.com/jojohuhu-git/MeningoVax/pull/143
  Until #142 merges, #143's diff also shows #142's commit. After #142 squash-merges, merge `main`
  into this branch (no force-push) so #143 shows only its own change.

MeningoVax has no CI checks. Baseline at session start was 2,497 passing (210 files); now **2,521
passing (212 files)**, 0 failing (`npx vitest run`, 2026-11-22, on `phase8/c4-complement-inhibitor`).
Code commits `5d6ca57` (#142) and `b572b9a` (#143).

## What's done

1. **C4 document 2, mm7349a3** (`5d6ca57`, PR #142). Five new quoted sentences in `refs.js`; healthy
   "not routine", high-risk dose 2, high-risk booster, healthy-complete and under-10 cards cite the
   report; button removed from serogroup-B-outbreak MenACWY cards (`outbreak_b` `menbRefs`) and the
   "outbreak booster given" card. Uncited 7,459 → 0; 0 answers moved; 0 sentences changed.
   Guard `regression-2026-11-22-c4-mm7349a3-cited-where-it-speaks.test.js`.
2. **C4 document 3, CDC complement-inhibitor page** (`b572b9a`, PR #143).
   - Off the high-risk MenB dose 1 card for non-complement patients (3,720 cards; source-only).
   - **Owner answer 2026-11-22, "Cite on booster lines"** (recorded in
     `docs/archive/decisions-2026-11-22-c4-complement-page.md`): on a complement patient's cards,
     `withComplementPageCites()` in `recommend.js` adds the page's sentence after "… while at
     risk" (MenACWY `cdcComplementMenacwyBoosterEvery5`, MenB `cdcComplementMenbBoosterEvery2to3`);
     the under-10 MenB card's "3-dose" cites `cdcComplementMenb3Doses`.
   - Uncited 6,224 → 0; any uncited button 10,810 → 5,826; 0 answers moved; 6,008 patients' wording
     differs, 0 sentences changed. Guard
     `regression-2026-11-22-c4-complement-page-only-for-complement.test.js` (6 of 9 fail with the
     engine change removed; 3 controls). Live-checked a 19-year-old complement patient.

## What's NOT done — the remaining queue

1. **Owner merges #142, then #143** (merge `main` into #143's branch between). Check `origin/main`.
2. **C4, next documents by size** (`node scripts/uncitedByDocument.mjs`, 2026-11-22): CDC
   vaccine-recommendations page **3,194** (`outbreak_b` still puts it on both vaccines' cards);
   CDC Adult Notes **1,252** (owns the pregnancy `menbRefs` question); immunize.org ACWY **888**,
   MenB **492** (landing-page buttons only; `refs.js` says they have no stable sentences to quote,
   so these may need an owner call on whether to number them at all).
3. **Complement page content on no card** (new clinical wording; ask): incomplete protection even
   when vaccinated; consider antibiotic prophylaxis; finish vaccines at least 2 weeks before the
   first inhibitor dose. The checkbox also covers inherited deficiency, which the page does not.
4. **Card-note citations for MenB doses that COUNT** (deferred from C11): the Rulebook rows "No dose 3
   is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was early … Counts" rows;
   the card would cite `cdcChildMenbHighRiskD2SixMonthsNoD3` / `menbHighRiskEarlyD3Unless`.
5. **Seen, not acted on (wording; ask first):** em dashes in card text (owner D7 bans them; the G1-a
   guard misses both): `routineBoosterStillOwedNote`'s lead, and the high-risk MenB booster card's
   detail ("primary series — MenB-4C …").
6. **Seen, not acted on (citation-only, Q12):** high-risk MenB dose 1/2/3 cite the Bexsero-worded
   schedule sentence for every brand (mm7349a3 also states Trumenba's 0/1–2/6 schedule); MenB
   minimum-age lines cite one general sentence for every brand.
7. Rest of Phase 8 (plan table C): C5, C6, C7, C9, C10, C12, C13; age-doubt note and transplant stop
   buttons (Results.jsx) not numbered. Then Phase 9.

## Why this is a good stopping point

Two whole documents are cited wherever they appear, each with its own PR, guard and measurements;
the one owner question raised (complement cards) is answered and built. The remaining documents are
independent.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If both merged: `git checkout main && git pull`; the suite should show **2,521 / 212 files**.
2. Dev server: this folder usually has 5 servers from other chats (the cap). If
   `preview_start {name}` refuses, use `preview_start {url: "http://localhost:5175/MeningoVax/"}`
   and confirm it runs from this folder (`lsof -a -p $(lsof -tiTCP:5175 -sTCP:LISTEN) -d cwd`).
   CDC blocks `curl`: read pages in the browser pane (`javascript_tool` on `document.body.innerText`).
3. Ask the owner which of items 2–6 comes next (ask, don't default).
4. Per document (Q12, `docs/archive/report-2026-11-21-phase8-citations-measured.md`): decide alone
   when the dose is unchanged; escalate no-row / different doses / verdict moves, and anything an
   earlier owner decision settled. Break a document down with `node scripts/uncitedByDocument.mjs
   <url>`; split cards by whether the patient has the risk that brings the button. Failing test →
   fix → full suite → live check → commit. `npm run prose -- dump <file>` before and after, then
   `-- diff`; after touching `refs.js`: `npm run rulebook`, add each new quoted key to
   `SENTENCE_VACCINE`, and bump `docs/agent/testing.md`'s counts when a test file is added. Note:
   `regression-u1-note-lead-and-detail.test.js` makes one check per distinct note, so new note
   variants raise the test count. E4 checklist in every PR body.
5. Ship: branch off `main`, PR against `main`; the owner merges. No force-push.
