# MeningoVax port — Handoff after the in-app Rulebook screen (Phase 7.2, Q11) (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md`. **Supersedes**
`handoff-2026-11-19-meningovax-phase7-todo-rules-sourced.md`.

Branch `port/phase7-rulebook-screen`, off `main` at `f9ba328` (#119, T2, merged). Pushed;
**PR #120** open against `main` (this handoff is in it). MeningoVax has no CI; the owner merges.
Baseline was 2,233 passed / 179 files; now **2,247 passed, 0 failing, 180 files**. `npm run build` OK.

## What's done

- **T2 landed** (#119, merged 2026-11-20 UTC): #118 had merged before the T2 commit reached it, so
  T2 went out as its own PR from a fresh branch. Branch `port/phase7-todo-rule-sources` is spent.
- **Q11, the Rulebook screen** (commit `b7d7be3`): a "Patient | Rulebook" switch in the header
  (`App.jsx`; the patient part stays mounted, hidden; `?rules` opens on it).
  - `src/data/rulebookPage.js`: everything the screen says, in the app's decision order: transplant
    stop, vaccines (+ MenB families), age lines + risk table (generated from `RISK_FACTORS`) + which
    risk wins, MenACWY, MenB, combined shot, doses on the record (label key, grace, minimum
    intervals, not-counted), 14 named MeningoVax decisions (Problem / CDC and ACIP / MeningoVax
    decision), sources (grouped by page from `CITATIONS`).
  - `src/components/Rulebook.jsx`: PneumoVax's layout; decides nothing. CSS: PneumoVax's rulebook
    block copied as is to the end of `App.css`, plus MeningoVax additions after it.
  - Guard `regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx` (14 tests): 69 worked
    patients run through `recommend()`; every row has one; label key = real chips; no typed number in
    page text or component; every product/risk listed; header switch keeps the patient.
    Tamper-checked three ways (typed "22", typed "16 years", first booster 5→4 years): each fails.
  - Engine: `PENTAVALENT_REPEAT_MONTHS` moved from a local in `recommend.js` to `intervals.js`,
    unchanged. 0 answers moved.
  - Live-checked: desktop, 375 px (no sideways scroll, lanes and decisions fold), Source and decision
    buttons, Patient → Rulebook → Patient keeps DOB + asplenia on the Risks step. No dark theme exists.
- Docs (commit `bf0681d`): CLAUDE.md status, MAP.md, architecture.md file map, plan 7.2 BUILT,
  testing.md counts + guard row.

## What's NOT done

- **STOP H — the owner reviews the rulebook** (plan, after 7.2): PR #120's "Things for you to look at"
  lists it: all new provider-facing wording; each decision's "CDC and ACIP" line (written from the
  rulebook document's notes, not re-read live this session).
- **Two open owner wording questions**, kept off the screen on purpose (from the previous handoff,
  still unasked in the clinical-questions format): §2 healthy MenB "wanes within about a year" vs the
  ACIP quote's "1–2 years" (same sentence is card text, `doseRules.js` ~line 372); §2 high-risk MenB
  boosters "every 2 years" vs both sources' "every 2–3 years". Also: §2's "P0-1 (2026-07-23)" is not
  the `owner:P0-1` in `OWNER_ANSWERS`.
- Not built: PneumoVax's per-row `cite` list (limits a row's Source to named sentences). Here a row
  shows every sentence its patients' cards cite (e.g. the 2-month lane also shows a booster sentence).
- Then **Phase 8** (citations; ask Q12 at its start). Still carried, not started: the 24-year-old
  recruit's long "Booster (16y)" "Why this"; the "Sources" toggle label; the
  `handoff-2026-11-18-meningovax-phase6-g1-answered.md` "Carried over" list.

## Why this is a good stopping point

The screen is complete as a unit, guarded, and in a PR. Nothing else depends on it except STOP H,
which is the owner's review.

## Resuming

1. `git fetch && gh pr view 120`. If merged: `git checkout main && git pull --ff-only`; `npm test`
   should give **2,247 passed, 180 files**. If not merged, ask; don't stack new work on it.
2. Start the dev server: `preview_start {name: "MeningoVax dev server"}` (worked this session, port
   5175); the screen is at `http://localhost:5175/MeningoVax/?rules`.
3. STOP H: apply the owner's review notes to `rulebookPage.js` (text) or `Rulebook.jsx` (layout).
   Any new or changed claim needs a worked patient in `P` that the guard runs; numbers come from
   constants only. A change to a decision's wording is fine; a change to what the app DOES is a
   clinical change (verify-clinical-source skill, a row in `doseRules.js`, `npm run sweep:update`
   with the moved count explained, `npm run rulebook`).
4. Ask the two wording questions above in the clinical-questions format; don't default.
5. Push policy: branch → PR against `main` (never stack) → owner merges.
