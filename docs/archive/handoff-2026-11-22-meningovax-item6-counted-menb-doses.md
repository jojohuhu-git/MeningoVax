> **SUPERSEDED 2026-11-22** by `handoff-2026-11-22-meningovax-c5-quote-population.md` (C5 built, PR #150). Do not resume from this file.

# MeningoVax — Handoff after item 6, a short or early high-risk MenB series says why (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-under10-licensure-cite.md`.

#148 (under-10 licensure citation) was merged into `main` (`251808d`) during this session. One open PR:
- **PR #149** `phase8/item6-counted-menb-doses` (against `main`), pushed, head `42d52bd` (plus this
  handoff commit). https://github.com/jojohuhu-git/MeningoVax/pull/149. `origin/main` is merged
  into it (no conflicts); its `test` check had not reported when this was written.

Suite: **2,566 passing, 0 failing (218 files)** (`npx vitest run`, 2026-11-22, on the PR branch with
#148 merged in). `docs/agent/testing.md` counts set to 218 / 146 because #148 and #149 each added a file.

## What's done

1. **Item 6, a counted MenB dose says why** (owner picked it 2026-11-22), PR #149, commit `5bc38a2`.
   Four owner answers (`docs/archive/decisions-2026-11-22-item6-counted-menb-doses.md`): for all
   three cases, add a line and cite ACIP; name the 4-day grace when it was needed.
   - The high-risk MenB **first-booster** card's "Why this" opens with: A "Dose 3 is not needed: dose 2
     was given at least 6 months after dose 1 [c]." (new `refs.js` key
     `menbHighRiskD2SixMonthsNoD3Acip2024`, ACIP mm7349a3, read live); B "Dose 3 counts: it was given
     at least 6 months after dose 1 [c]." and C "… at least 4 months after dose 2 [c]." (both
     `menbHighRiskEarlyD3Unless`). "within the 4-day grace period" replaces "at least" when needed.
   - `menbHighRiskSeriesShortcut()` in `seriesTotals.js` says which line was met (no verdict);
     `recommend.js` booster branch uses it. Rulebook §2 updated (`owner:item6` in `rulebook.js`).
   - 0 answers moved; 392 of 24,600 saved patients gain exactly one sentence (nothing else after
     stripping hovers/numbers/button labels); 1,792 cards over 42,301 test patients; uncited 0.
     Guard: `regression-2026-11-22-counted-menb-doses-say-why.test.js` (9 of 11 failed before).
     Live-checked (Bexsero Jan 3 / Jul 1, 2026: grace line, [1] hover = ACIP's sentence; the Rulebook's
     three rows list the sentences).
   - Note: the owner was first told 1,440 / 280 patients; that estimate missed combined shots. The
     real counts are in the decision record and the PR body.

Seen, no change: the Rulebook's High-risk table and its "No dose 3" line share ONE source list
(`TableFoot`, by design), so ACIP's new sentence is listed last there.

## What's NOT done — the remaining queue (numbers kept from the previous handoffs)

1. **Owner merges #149.** Check `origin/main`.
3. **Clinical (ask):** immunize.org's MenB page answers the early-dose-2 question two ways
   (`decisions-2026-11-22-c4-immunize-org.md`). No change made.
4. **Grid gap (ask):** `src/test-grid.js` has 0 pregnant patients with a second risk. Widening it
   moves the saved-answer baseline.
5. **Complement page content on no card (clinical wording; ask):** incomplete protection even when
   vaccinated; antibiotic prophylaxis; vaccines ≥2 weeks before the first inhibitor dose.
7. **Wording (ask first):** em dashes in card text (owner D7 bans them; the G1-a guard misses them):
   `routineBoosterStillOwedNote`'s lead; the high-risk MenB booster card's detail ("Stay in the same
   antigen family as the primary series — …", the same card item 6 touched); the 19–21 MenACWY
   catch-up card's detail.
8. **Clinical content (ask):** CDC's recommendations page (and immunize.org's MenB page) say some
   outbreaks may call for a MenB booster after 6 months, not 1 year. No card says that.
9. **Rest of Phase 8** (plan table C): C5, C6, C7, C9, C10, C12, C13; the age-doubt note and
   transplant stop buttons (`Results.jsx`) are not numbered. Then Phase 9.

Item 2 and item 6 are done (#148, #149).

## Why this is a good stopping point

Item 6 is complete in its own PR with owner answers, a guard, a decisions record and measurements.
Everything left is independent; most needs an owner answer.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #149 is merged: `git checkout main && git pull`; the suite should show **2,566 / 218 files**.
2. Dev server: `preview_start {name: "MeningoVax dev server"}` (port 5178 this session; path
   `/MeningoVax/`). Read CDC pages in the browser pane (CDC blocks `curl`; Adult Notes needs
   `document.body.textContent`, its `innerText` is collapsed).
3. Ask the owner which of items 3–9 comes next (ask, don't default).
4. Per item: failing test → fix → full suite → live check → commit. Wording proof: `npm run -s
   prose -- dump <file>` before (via `git stash`) and after, then `-- diff`. Count cases from the
   real cards (`recommend()` output), not from `input.menbDoses`: combined shots on the MenACWY list
   are MenB doses too (`creditPentavalents`), and `history.MenB.perDose` follows date order.
   After touching `refs.js`: `npm run rulebook`, add new quoted keys to `SENTENCE_VACCINE`
   (`rulebookPage.js`), bump `docs/agent/testing.md` counts for a new test file (check against
   `origin/main` if another PR is open); `node scripts/uncitedByDocument.mjs` must say
   `cardsWithUncited: 0`. E4 checklist in every PR body.
5. Ship: PR against `main`; the owner merges. No force-push.
