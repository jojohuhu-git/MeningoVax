# MeningoVax — Handoff after C4 immunize.org buttons (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-c4-adult-notes.md`.

#145 was already squash-merged into `main` (`c086f5a`) when this session started. One open PR:
- **PR #146** `phase8/c4-immunize-org` (against `main`), commit `f07ecb8`, pushed.
  https://github.com/jojohuhu-git/MeningoVax/pull/146. Its `test` check had not reported yet when
  this handoff was written.

Suite: **2,539 passing, 0 failing (215 files)** (`npx vitest run`, 2026-11-22, on
`phase8/c4-immunize-org`). Baseline at session start: 2,534 (214 files) on `main`.

## What's done

1. **C4 immunize.org (owner: "Remove the buttons", 2026-11-22)**, PR #146. The two cards that listed
   an Ask the Experts topic page uncited no longer list it: MenACWY "Not routinely indicated" at 22+
   (888 cards) and healthy MenB "Dose 3 of 3 (dose 2 given early)" (492 cards). Each already cites
   ACIP's sentence. `immMenB` deleted. `immMenACWY` kept only as the page title for the numbered
   age-10 quote (`RecCard.jsx` `documentTitle()`), listed in `KNOWN_UNCITED`. Uncited 1,380 → **0
   cards**. Prose: 1,503 patients differ, every one only by the removed button; 0 sentences, 0
   answers moved. Record: `docs/archive/decisions-2026-11-22-c4-immunize-org.md`. Both patients
   checked in the running app. **C4 is finished: no card has an uncited source button.**

## What's NOT done — the remaining queue

1. **Owner merges #146.** Check `origin/main`.
2. **New, seen this session (clinical; ask):** immunize.org's MenB page answers the early-dose-2
   question two ways. Two answers say dose 3 must also be ≥6 months after dose 1; the app (ACIP Oct
   2024) uses only ≥4 months after dose 2. Details and example are in the decision record. No change made.
3. **Grid gap:** the saved-answers grid (`src/test-grid.js`) has 0 pregnant patients with a second
   risk. Widening it moves the saved-answer baseline; ask first.
4. **Complement page content on no card** (new clinical wording; ask): incomplete protection even
   when vaccinated; consider antibiotic prophylaxis; finish vaccines ≥2 weeks before the first
   inhibitor dose. The checkbox also covers inherited deficiency, which the page does not.
5. **Card-note citations for MenB doses that COUNT** (deferred from C11): Rulebook rows "No dose 3
   is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was early … Counts" rows.
6. **Wording (ask first):** em dashes in card text (owner D7 bans them; the G1-a guard misses them):
   `routineBoosterStillOwedNote`'s lead; the high-risk MenB booster card's detail; the 19–21
   MenACWY catch-up card's detail ("A single catch-up dose — no MenACWY …").
7. **Citation-only (Q12, decide alone):** high-risk MenB dose 1/2/3 cite the Bexsero-worded sentence
   for every brand; MenB minimum-age lines cite one general sentence for every brand; healthy MenB
   cards cite CDC's child/adolescent notes at 19–23, outside that schedule's ages.
8. **Clinical content (ask):** CDC's recommendations page (and immunize.org's MenB page) say some
   outbreaks may call for a MenB booster after 6 months, not 1 year. No card says that.
9. **Rest of Phase 8** (plan table C): C5, C6, C7, C9, C10, C12, C13; the age-doubt note and
   transplant stop buttons (`Results.jsx`) are not numbered. Then Phase 9.

## Why this is a good stopping point

C4 is complete as a unit: every source button on every grid card is now pointed to by a numbered
sentence (0 uncited). It is in its own PR, with a guard test and measurements. Everything left is
independent and mostly needs an owner answer.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #146 is merged: `git checkout main && git pull`; the suite should show **2,539 / 215 files**.
2. Dev server: `preview_start {name: "MeningoVax dev server"}` (port 5175 this session). If refused
   (cap of 5), use `preview_start {url: "http://localhost:5175/MeningoVax/"}` and confirm the folder
   (`lsof -a -p $(lsof -tiTCP:5175 -sTCP:LISTEN) -d cwd`). Read CDC/immunize.org pages in the browser
   pane (`javascript_tool` on `document.body.textContent`); CDC blocks `curl`.
3. Ask the owner which of items 2–9 comes next (ask, don't default).
4. Per item: failing test → fix → full suite → live check → commit. `npm run prose -- dump <file>`
   before/after, then `-- diff`. After touching `refs.js`: `npm run rulebook`, add new quoted keys to
   `SENTENCE_VACCINE`, and bump `docs/agent/testing.md` counts for a new test file. A `refs.js` entry no
   longer cited must be deleted or listed in `KNOWN_UNCITED` (`citation-integrity.test.js`). E4
   checklist in every PR body.
5. Ship: PR against `main`; the owner merges. No force-push.
