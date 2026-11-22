# MeningoVax — Handoff after the Rulebook Sources fix: each vaccine cites only itself (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-c4-acip2020-done.md` (#139 is
merged as `88f0bc0`).

Branch `phase8/rulebook-sources-per-vaccine`, with `origin/main` merged in after #139 (one conflict,
the counts table in `docs/agent/testing.md`; kept the new counts). Pushed; **PR #140** against
`main` (https://github.com/jojohuhu-git/MeningoVax/pull/140), diff is this change only (5 files).
**The owner merges.** Baseline was 2,469 passing (208 files); now **2,475 passing (209 files)**,
0 failing (`npx vitest run`, 2026-11-21, after the merge). Working tree clean.

## What's done

1. **Rulebook Sources per vaccine** (`e6b6b2c`; owner's report: "MenB sources under MenACWY and
   vice versa"). `sourcesFor()` in `src/data/rulebookPage.js` read both cards for every worked
   patient; 35 of 37 MenACWY/MenB rows showed the other vaccine's sentences. Now:
   - a row with `vaccine` reads only that vaccine's card and dose lines (rows marked by
     `forVaccine(...)` near the end of the file, plus `vaccine:` on one-vaccine rows in the
     shared steps; `riskRankingFor()` adds it; `ACWY_HIGHRISK_NOTES.boostersRow`);
   - `SENTENCE_VACCINE` labels all 71 quoted `refs.js` sentences (MenACWY 36, MenB 20, MenABCWY 11,
     general 4); a one-vaccine row shows only its own and general ones. **A new quoted sentence
     in `refs.js` must be added to one list**, or the guard fails. Judgement call:
     `acip2020IndicationMicrobiologist` labelled MenACWY (quoted for the C4 MenACWY cards; no MenB
     card cites it);
   - `Rulebook.jsx`'s `Source` calls `rowSources(row)`.
   Measured: 0 cross-vaccine sentences after; no row lost its Source; patient cards untouched
   (no `src/logic` change). Guard `regression-2026-11-21-rulebook-sources-per-vaccine.test.jsx`
   (6 checks; 2 fail with the card split undone, 2 with the labels undone). Live-checked in the
   app (MenACWY high-risk boosters line: 2 MenACWY sentences, was +3 MenB; Healthy row 4, was 9;
   0 of 26 MenB panels mention MenACWY; no console errors).
   Report: `docs/archive/report-2026-11-21-rulebook-sources-per-vaccine.md`.

## What's NOT done — the remaining queue

1. **Owner merges PR #140.** Check `origin/main` before calling it merged.
2. **Deferred from this fix (why: it changes patient cards, so it is Phase 8 card work):** seven
   Rulebook rows show a nearby same-vaccine sentence, not the one the rule rests on, because the
   patient's dose line or card cites nothing better. Table in the report. Root cause: a recorded
   dose that fails a minimum interval or product match has **no [c] mark on its dose line**,
   though `DOSE_RULES` `refs` list the right sentence (e.g. `acip2020Acwy8WeekMinimum`,
   `cdcChildAcwyRisk2DoseFrom24m`); `cdcChildMenbHighRiskD2SixMonthsNoD3` is cited nowhere;
   `menbHighRiskEarlyD3Unless` only when dose 3 does not count. Fixing the dose lines fixes the
   Rulebook rows with no Rulebook change. No hand-picked `keys` were added (page rule:
   "generated, never typed"). Extras (right sentence plus an unrelated one) are listed too.
3. **C4, next documents by size** (unchanged from the previous handoff;
   `node scripts/uncitedByDocument.mjs`): mm7349a3 7,550; CDC complement-inhibitor page 6,224
   (asplenia MenB dose-1 card shows "CDC Complement-Inhibitor Guidance"); CDC
   vaccine-recommendations 3,194; CDC Adult Notes 1,252 (pregnancy `menbRefs` question);
   immunize.org ACWY 888, MenB 492. outbreak_b documents still reach MenACWY cards.
4. **Seen, not acted on:** `routineBoosterStillOwedNote`'s lead has an em dash ("still owed — the
   recorded dose"), banned in user-visible strings (owner D7) but not flagged by the G1-a guard.
   Ask before changing wording.
5. Rest of Phase 8 (plan table C): C5, C6, C7, C9–C13; age-doubt note and transplant stop buttons
   (Results.jsx) not numbered. Then Phase 9.

## Why this is a good stopping point

The owner's report is fixed as a unit, guarded, live-checked and in its own PR. What's left is
upstream card citations, which the Rulebook will pick up automatically.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #140 merged: `git checkout main && git pull`; the suite should show **2,475 / 209 files**.
2. Dev server: this folder often has 5 servers from other chats (the cap). If `preview_start`
   refuses, open one of them with `preview_start {url: "http://localhost:5175/MeningoVax/"}` (they
   serve this same folder).
3. Ask the owner which comes next: item 2 (dose-line citations, which also fixes the seven
   Rulebook rows) or item 3 (mm7349a3). Ask, don't default.
4. Per item (Q12, `docs/archive/report-2026-11-21-phase8-citations-measured.md`): decide alone when
   the dose is unchanged; escalate no-row / different doses / verdict moves. Failing test → fix →
   full suite → live check → commit. Moved answers: `npm run sweep:update` and explain; wording:
   `npm run prose -- dump/diff`; after touching `refs.js`: `npm run rulebook`, and add any new
   quoted key to `SENTENCE_VACCINE`. E4 checklist in every PR body.
5. Ship: branch off `main`, PR against `main`; the owner merges. No force-push.
