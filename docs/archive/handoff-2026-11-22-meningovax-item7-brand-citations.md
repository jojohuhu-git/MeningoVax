> **SUPERSEDED 2026-11-22** by `handoff-2026-11-22-meningovax-under10-licensure-cite.md`. #147 is merged and old item 2 is done (PR #148). Do not resume from this file.

# MeningoVax — Handoff after item 7, each MenB brand cites its own sentence (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-c4-immunize-org.md`.

#146 was squash-merged into `main` (`7a2ebb1`) during this session. One open PR:
- **PR #147** `phase8/item7-brand-citations` (against `main`), commit `6c910c1`, pushed, rebased
  onto `7a2ebb1`. https://github.com/jojohuhu-git/MeningoVax/pull/147. Its `test` check had not
  reported when this handoff was written.

Suite: **2,552 passing, 0 failing (216 files)** (`npx vitest run`, 2026-11-22, on
`phase8/item7-brand-citations`). Baseline at session start: 2,539 (215 files).

## What's done

1. **Item 7 (citation only, owner Q12: decide alone when the dose is unchanged)**, PR #147.
   - A Trumenba/Penbraya high-risk MenB dose 1/2/3 card cites ACIP Oct 2024's MenB-FHbp sentence
     (new `menbFhbpSchedules` in `refs.js`, read live). A card with no product yet cites both
     sentences ("[c][c]"); the healthy dose 1 card the same. One helper, `scheduleCites()` in
     `recommend.js`'s MenB section.
   - A Penbraya/Penmenvy MenB "Minimum age not met" line cites the sentence C11 chose for that
     brand's MenACWY line (`menbMinAgeCite()` in `doseRules.js`); Bexsero/Trumenba keep ACIP 2020.
   - 7c ("healthy MenB cards cite CDC child notes at 19–23") was already true: 0 cards. No change.
   - 0 answers moved; 7,786 of 24,600 patients differ by source numbers/buttons only, 0 sentences.
     Uncited buttons 0 of 35,056 cards. Live-checked both kinds. Guard:
     `regression-2026-11-22-item7-each-brand-cites-its-own-sentence.test.js`. Record:
     `docs/archive/decisions-2026-11-22-item7-brand-citations.md`.

## What's NOT done — the remaining queue

1. **Owner merges #147.** Check `origin/main`.
2. **New, seen this session (citation only, Q12):** the healthy under-10 "Not indicated" MenB card
   says Bexsero, Trumenba, Penmenvy, Penbraya are "FDA-licensed from age 10 years [c]" citing ACIP
   2020, which predates both pentavalents. Needs a licensure sentence that names Penmenvy (look in
   mm7501a2 first).
3. **Clinical (ask):** immunize.org's MenB page answers the early-dose-2 question two ways (details
   in `decisions-2026-11-22-c4-immunize-org.md`). No change made.
4. **Grid gap (ask):** `src/test-grid.js` has 0 pregnant patients with a second risk. Widening it
   moves the saved-answer baseline.
5. **Complement page content on no card (clinical wording; ask):** incomplete protection even when
   vaccinated; antibiotic prophylaxis; vaccines ≥2 weeks before the first inhibitor dose.
6. **Card-note citations for MenB doses that COUNT** (deferred from C11): Rulebook rows "No dose 3
   is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was early … Counts" rows.
7. **Wording (ask first):** em dashes in card text (owner D7 bans them; the G1-a guard misses them):
   `routineBoosterStillOwedNote`'s lead; the high-risk MenB booster card's detail; the 19–21 MenACWY
   catch-up card's detail.
8. **Clinical content (ask):** CDC's recommendations page (and immunize.org's MenB page) say some
   outbreaks may call for a MenB booster after 6 months, not 1 year. No card says that.
9. **Rest of Phase 8** (plan table C): C5, C6, C7, C9, C10, C12, C13; the age-doubt note and
   transplant stop buttons (`Results.jsx`) are not numbered. Then Phase 9.

## Why this is a good stopping point

Item 7 is complete as a unit, in its own PR, with a guard test, a judgement-call list and
measurements. Everything left is independent; most needs an owner answer.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #147 is merged: `git checkout main && git pull`; the suite should show **2,552 / 216 files**.
2. Dev server: `preview_start {name: "MeningoVax dev server"}` (got port 5176 this session; path
   `/MeningoVax/`). Read CDC pages in the browser pane (`get_page_text`); CDC blocks `curl`.
3. Ask the owner which of items 2–9 comes next (ask, don't default).
4. Per item: failing test → fix → full suite → live check → commit. `npm run prose -- dump <file>`
   before/after, then `-- diff`; to prove "citations only", strip `{hover: …}` and `[n]` and compare.
   After touching `refs.js`: `npm run rulebook`, add new quoted keys to `SENTENCE_VACCINE`
   (`rulebookPage.js`), bump `docs/agent/testing.md` counts for a new test file. A `refs.js` entry no
   longer cited must be deleted or listed in `KNOWN_UNCITED`. E4 checklist in every PR body.
5. Ship: PR against `main`; the owner merges. No force-push. If a PR's base merges first, rebase
   with `git rebase --onto origin/main <old-base-tip>`.
