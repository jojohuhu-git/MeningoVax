# MeningoVax — Handoff after the under-10 licensure citation (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-item7-brand-citations.md`.

#147 (item 7) was merged into `main` (`07f0a35`) before this session. One open PR:
- **PR #148** `phase8/under10-licensure-cite` (against `main`), commit `70fba99`, pushed.
  https://github.com/jojohuhu-git/MeningoVax/pull/148. Its `test` check had not reported when this
  handoff was written.

Suite: **2,555 passing, 0 failing (217 files)** (`npx vitest run`, 2026-11-22, on
`phase8/under10-licensure-cite`). Baseline at session start: 2,552 (216 files) on `main`.

## What's done

1. **Under-10 licensure citation (old queue item 2; citation only, owner Q12)**, PR #148. Owner
   picked it from the queue on 2026-11-22.
   - The healthy under-10 "Not indicated" MenB card's line "MenB vaccines (Bexsero, Trumenba,
     Penmenvy, Penbraya) are FDA-licensed from age 10 years" cited ACIP 2020, which predates both
     pentavalents. It now cites "[c][c]": ACIP Oct 2024's `menbLicensedAge1025Acip2024` (Trumenba,
     Bexsero, Penbraya) and new `penmenvyLicensedAge1025` (mm7501a2, read live, exact substring).
   - New key added to `SENTENCE_VACCINE` (MenABCWY list) in `rulebookPage.js`; the E2 test's
     expected cites updated; `testing.md` counts bumped.
   - 0 answers moved; 2,744 of 24,600 patients differ by sources only (0 after stripping hovers,
     numbers and button labels). Uncited buttons 0 of 35,056 cards. Live-checked.
     Guard: `regression-2026-11-22-under10-licensure-names-each-brand.test.js`.
     Record: `docs/archive/decisions-2026-11-22-under10-licensure-cite.md`.

## What's NOT done — the remaining queue (numbers kept from the previous handoff)

1. **Owner merges #148.** Check `origin/main`.
3. **Clinical (ask):** immunize.org's MenB page answers the early-dose-2 question two ways (details
   in `decisions-2026-11-22-c4-immunize-org.md`). No change made.
4. **Grid gap (ask):** `src/test-grid.js` has 0 pregnant patients with a second risk. Widening it
   moves the saved-answer baseline.
5. **Complement page content on no card (clinical wording; ask):** incomplete protection even when
   vaccinated; antibiotic prophylaxis; vaccines ≥2 weeks before the first inhibitor dose.
6. **Card-note citations for MenB doses that COUNT** (deferred from C11; citation only): Rulebook
   rows "No dose 3 is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was
   early … Counts" rows.
7. **Wording (ask first):** em dashes in card text (owner D7 bans them; the G1-a guard misses them):
   `routineBoosterStillOwedNote`'s lead; the high-risk MenB booster card's detail; the 19–21 MenACWY
   catch-up card's detail.
8. **Clinical content (ask):** CDC's recommendations page (and immunize.org's MenB page) say some
   outbreaks may call for a MenB booster after 6 months, not 1 year. No card says that.
9. **Rest of Phase 8** (plan table C): C5, C6, C7, C9, C10, C12, C13; the age-doubt note and
   transplant stop buttons (`Results.jsx`) are not numbered. Then Phase 9.

Seen, no change needed: the recorded-dose "Why this" `MENB_LICENSED_FROM_10_WHY` names the four
brands, but recorded-dose "Why this" lines carry no source numbers by design (`DoseWhy`).

## Why this is a good stopping point

The citation fix is complete in its own PR with a guard test, a decisions record and measurements.
Everything left is independent; most needs an owner answer.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #148 is merged: `git checkout main && git pull`; the suite should show **2,555 / 217 files**.
2. Dev server: `preview_start {name: "MeningoVax dev server"}` (got port 5177 this session; path
   `/MeningoVax/`). Read CDC pages in the browser pane; CDC blocks `curl`.
3. Ask the owner which of items 3–9 comes next (ask, don't default).
4. Per item: failing test → fix → full suite → live check → commit. Wording proof: `npm run -s
   prose -- dump <file>` before (via `git stash`) and after, then `-- diff`. The dump is one
   `key<TAB>text` line per patient (not JSON); to prove "citations only", strip `{hover: …}`, `[n]`
   and the source-button labels and compare. After touching `refs.js`: `npm run rulebook`, add new
   quoted keys to `SENTENCE_VACCINE` (`rulebookPage.js`), bump `docs/agent/testing.md` counts for a
   new test file; `node scripts/uncitedByDocument.mjs` must say `cardsWithUncited: 0`. E4 checklist
   in every PR body.
5. Ship: PR against `main`; the owner merges. No force-push.
