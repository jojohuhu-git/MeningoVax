# MeningoVax — Handoff after C4 document 4: the CDC recommendations page (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-c4-complement-page.md`.

Two open PRs, stacked; **the owner merges, #143 first**:
- **PR #143** `phase8/c4-complement-inhibitor`: C4 document 3, the CDC complement-inhibitor page.
  https://github.com/jojohuhu-git/MeningoVax/pull/143. #142 squash-merged into `main` (`8e4c6d2`);
  this session merged `main` into #143's branch (`5f75099`, no force-push). Main's tree equalled
  `bc23a04`, already on the branch, so every conflict took the branch's side and the tree was
  unchanged. #143 is now mergeable.
- **PR #144** `phase8/c4-cdc-recs-page` (branched from #143, opened against `main`): C4 document 4.
  https://github.com/jojohuhu-git/MeningoVax/pull/144. Until #143 merges, #144's diff also shows
  #143's commits. After #143 squash-merges, merge `main` into this branch (no force-push).

**CI correction:** the last handoff said MeningoVax has no CI checks. It does now: a `test` check
ran on #143 after the push (pending when last looked at). Use the app's PR status tools, don't poll.

Suite: **2,527 passing (213 files)**, 0 failing (`npx vitest run`, 2026-11-22, on
`phase8/c4-cdc-recs-page` at `4ff6900`). Baseline at session start: 2,521 (212 files).

## What's done

1. **Conflicts on #143 fixed** (`5f75099`), as above. Suite 2,521 green after the merge; a complement
   patient's booster lines were checked live and still cite the complement page.
2. **C4 document 4, CDC "Meningococcal Vaccine Recommendations" page** (`4ff6900`, PR #144). Read live
   2026-11-22 (page dated Mar. 30, 2026). New quoted key `cdcRecsMenbOutbreakBoosterYear` ("CDC
   recommends a booster dose for these individuals if a year or more has passed since the most recent
   MenB vaccine"), tagged MenB in `SENTENCE_VACCINE`.
   - 2,208 MenB outbreak cards: `OUTBREAK_B_BOOSTER_CITES()` in `recommend.js` puts it beside ACIP
     Table 8 on the booster line, the booster card and the "outbreak booster given" card (`[c][c]`).
   - 690 MenACWY cards: `outbreak_b` `refs: []` in `riskFactors.js` (the page's MenACWY outbreak
     sentence is footnoted "serogroup A, C, W, or Y").
   - 296 MenB "not yet due" cards under 10: button filtered off that card.
   - Uncited 3,194 → 0; any uncited button 5,826 → 2,632; 0 answers moved; 0 sentences changed
     (3,280 patients' screens differ in source numbers/buttons only). Decided alone (Q12).
   - Guard `regression-2026-11-22-c4-cdc-recs-page-outbreak-booster.test.js` (5 of 6 fail without
     the change). Live-checked a 19-year-old college resident in a serogroup B outbreak.

## What's NOT done — the remaining queue

1. **Owner merges #143, then #144** (merge `main` into #144's branch between). Check `origin/main`.
2. **C4, documents left** (`node scripts/uncitedByDocument.mjs`, 2026-11-22): CDC Adult Notes
   **1,252** (owns the pregnancy `menbRefs` question); immunize.org ACWY **888**, MenB **492**
   (landing-page buttons only; `refs.js` says they have no stable sentences to quote, so these may
   need an owner call on whether to number them at all).
3. **Complement page content on no card** (new clinical wording; ask): incomplete protection even
   when vaccinated; consider antibiotic prophylaxis; finish vaccines at least 2 weeks before the
   first inhibitor dose. The checkbox also covers inherited deficiency, which the page does not.
4. **Card-note citations for MenB doses that COUNT** (deferred from C11): the Rulebook rows "No dose 3
   is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was early … Counts" rows.
5. **Seen, not acted on (wording; ask first):** em dashes in card text (owner D7 bans them; the G1-a
   guard misses both): `routineBoosterStillOwedNote`'s lead; the high-risk MenB booster card's
   detail ("primary series — MenB-4C …").
6. **Seen, not acted on (citation-only, Q12):** high-risk MenB dose 1/2/3 cite the Bexsero-worded
   schedule sentence for every brand; MenB minimum-age lines cite one general sentence for every brand.
7. **Seen this session, not acted on (clinical content; ask):** the CDC page says that in some
   outbreaks public health may advise a MenB booster after 6 months, not 1 year. No card says that.
   The page's MenACWY outbreak booster ("if 5 or more years have passed") is for A/C/W/Y outbreaks
   (`outbreak_acwy`), already ACIP Table 8's.
8. Rest of Phase 8 (plan table C): C5, C6, C7, C9, C10, C12, C13; age-doubt note and transplant stop
   buttons (Results.jsx) not numbered. Then Phase 9.

## Why this is a good stopping point

A whole document is cited wherever it appears, with its own PR, guard and measurements; nothing in it
needed the owner. The remaining documents are independent of it.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If both merged: `git checkout main && git pull`; the suite should show **2,527 / 213 files**.
2. Dev server: this folder usually has 5 servers from other chats (the cap). If
   `preview_start {name}` refuses, use `preview_start {url: "http://localhost:5175/MeningoVax/"}`
   and confirm it runs from this folder (`lsof -a -p $(lsof -tiTCP:5175 -sTCP:LISTEN) -d cwd`).
   It serves the working tree, so it shows whatever branch is checked out.
   CDC blocks `curl`: read pages in the browser pane (`get_page_text`, or `javascript_tool` for footnotes).
3. Ask the owner which of items 2–7 comes next (ask, don't default).
4. Per document (Q12): decide alone when the dose is unchanged; escalate no-row / different doses /
   verdict moves, and anything an earlier owner decision settled (grep `docs/archive` for the key).
   Break it down with `node scripts/uncitedByDocument.mjs <url>`. Failing test → fix → full suite →
   live check → commit. `npm run prose -- dump <file>` before and after, then `-- diff`; the diff
   counts mark changes too, so to count sentences strip `{hover: …}`, `[n]` and each button's
   `short` name before comparing. After touching `refs.js`: `npm run rulebook`, add each new
   quoted key to `SENTENCE_VACCINE`, and bump `docs/agent/testing.md`'s counts when a test file is
   added. Older guards pin exact booster strings and cite-key lists; expect to update them.
   E4 checklist in every PR body.
5. Ship: PR against `main`; the owner merges. No force-push.
