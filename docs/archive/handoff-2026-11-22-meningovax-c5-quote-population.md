> **SUPERSEDED 2026-11-22** by `handoff-2026-11-22-meningovax-tier1-packet.md` (#150 conflicts fixed; Tier 1 packet written). Do not resume from this file.

# MeningoVax — Handoff after C5, every quote names its patients (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-item6-counted-menb-doses.md`.

Two open PRs, both against `main`, owner merges:
- **PR #149** `phase8/item6-counted-menb-doses` (item 6). Open; `test` check pending when written.
- **PR #150** `phase8/c5-quote-population`, head `87204d4` (plus this handoff commit), **stacked on
  #149** (branched from it). Until #149 merges, #150 also shows #149's commits. Merge #149 first.
  https://github.com/jojohuhu-git/MeningoVax/pull/150. `test` check pending when written.

Suite: **2,579 passing, 0 failing (219 files)** (`npx vitest run`, 2026-11-22, on #150's branch).
`docs/agent/testing.md` counts set to 219 / 147 (#149 and #150 each added one file).

## What's done

1. **C5 (plan table C)**, PR #150, commit `87204d4`. Owner chose "Rest of Phase 8 citations"
   2026-11-22; decided under Q12 (same doses), every judgement call listed in the PR body and in
   `docs/archive/report-2026-11-22-c5-quote-population.md`.
   - `population` on all 91 quoted entries in `src/data/refs.js` (15 groups, `POPULATIONS`);
     `patientGroups()` in `riskFactors.js`; `cite(key, { aboutAnotherGroup })`.
   - Guard `regression-2026-11-22-c5-every-quote-names-its-patient.test.js` sweeps all 18,780
     saved patients' whole engine result; pins 3 declared cross-references and 1 open item.
   - Fixes: asplenia and A/C/W/Y outbreak quote their own ACIP Table 5 / Table 8 booster rows (4 new
     entries; `acwyBoosterRowKey()`); an outbreak infant begun at 3–6 months cites ACIP's footnote
     (`acip2020InfantSeriesStart3to6mo`, `acwyInfantSeriesKey()`); a serogroup B outbreak's early
     MenB booster cites Table 8; the 11–15 MenACWY card no longer tells a serogroup B outbreak
     contact "Without a MenB risk factor…" (and its 13–15 card's Table 2 button went with it).
   - 0 answers moved; 246 saved patients (207 real) read differently once hover text is removed;
     `cardsWithUncited: 0`. Live-checked (outbreak-B 13-year-old's card; asplenia 6-year-old's
     hovers show Table 5).

## What's NOT done — the remaining queue

1. **Owner merges #149, then #150.** Check `origin/main`.
2. **Owner question from C5 (ask):** microbiologist whose MenACWY series ended before 7. Card says
   the first booster is 5 years after dose 1 (owner E1); the recorded-dose check uses 3 years and
   quotes another group's row. Worked patient in the report and PR body. When answered, empty
   `OPEN_FOR_THE_OWNER` in the C5 guard.
3. **Clinical (ask):** immunize.org's MenB page answers the early-dose-2 question two ways
   (`decisions-2026-11-22-c4-immunize-org.md`). No change made.
4. **Grid gap (ask):** `src/test-grid.js` has 0 pregnant patients with a second risk. Widening it
   moves the saved-answer baseline.
5. **Complement page content on no card (clinical wording; ask):** incomplete protection even when
   vaccinated; antibiotic prophylaxis; vaccines ≥2 weeks before the first inhibitor dose.
7. **Wording (ask first):** em dashes in card text (owner D7 bans them; the G1-a guard misses them):
   `routineBoosterStillOwedNote`'s lead; the high-risk MenB booster card's detail ("Stay in the same
   antigen family as the primary series — …"); the 19–21 MenACWY catch-up card's detail.
8. **Clinical content (ask):** CDC's recommendations page, immunize.org's MenB page and ACIP Table 8
   ("≥6 mos interval might also be considered by public health professionals") allow a MenB
   outbreak booster after 6 months. No card says that.
9. **Rest of Phase 8** (plan table C): C6, C7, C9, C10, C12, C13 (C5 done). Seen during C5, for
   later: **C9**, a sentence printed in several ACIP tables highlights its first copy (usually
   Table 4) for every patient; **C13**, "Aged ≥7 yrs: …" is the 2–9 row, quoted to patients whose
   series ended at 10 or later. Age-doubt note and transplant stop buttons (`Results.jsx`) are not
   numbered. Then Phase 9.

## Why this is a good stopping point

C5 is complete in its own PR with a guard, a report and measurements. Its one open item is pinned,
not hidden. Everything left is independent; most needs an owner answer.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #149 and #150 are merged: `git checkout main && git pull`; the suite should show
   **2,579 / 219 files**.
2. Dev server: `preview_start {name: "MeningoVax dev server"}` (port 5179 this session; path
   `/MeningoVax/`). Read CDC pages in the browser pane (CDC blocks `curl`; use `textContent`, not
   `innerText`, for closed sections). ACIP 2020 tables: each `<table>`'s own text starts with its
   caption ("TABLE n."); a caption found by looking at previous siblings is the PREVIOUS table's.
3. Ask the owner which of items 2–9 comes next (ask, don't default).
4. Per item: failing test → fix → full suite → live check → commit. Wording proof: `npm run -s
   prose -- dump <file>` before (via `git stash`) and after, then `-- diff`; the dump is
   tab-separated (key, text); strip `{hover:…}` to count visible changes. After touching
   `refs.js`: give a new quote a `population`, run `npm run rulebook`, add the key to
   `SENTENCE_VACCINE` (`rulebookPage.js`); `node scripts/uncitedByDocument.mjs` must say
   `cardsWithUncited: 0`; a due card needs at least one engine `refs` button
   (`sweep-never-events` property 3). Bump `docs/agent/testing.md` for a new test file. E4
   checklist in every PR body.
5. Ship: PR against `main`; the owner merges. No force-push.
