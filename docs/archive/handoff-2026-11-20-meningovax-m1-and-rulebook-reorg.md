> **SUPERSEDED 2026-11-20** by [handoff-2026-11-20-meningovax-m1-built.md](handoff-2026-11-20-meningovax-m1-built.md). M1 is built (PR #126); do not resume from this file.

# MeningoVax — Handoff: two owner-approved builds, M1 (MenB dose 3) then the Rulebook reorganization (2026-11-20, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, ask, don't default. **Supersedes**
`handoff-2026-11-20-meningovax-review-v10-rulebook.md` (its PR #125 is merged).

Branch: `port/m1-menb-dose3-cdsi`, off `main` `357fd5a` (PR #125 merged 2026-11-21). One local
commit: the decisions file and this handoff. **NOT pushed** (no code yet). Suite on `main`:
**2,359 passed (195 files)**, all green (`npm test`, 2026-11-20).

**The source of truth for both builds:** `docs/archive/decisions-2026-11-20-rulebook-reorg.md`
(owner's words, live source quotes, engine runs). Read it first.

## What's done (this session: decisions only, no app code)

- Owner reviewed the Rulebook screen; reorganization approved item by item (decisions file,
  "Approved" 1–10), with before/after drawings in chat.
- While checking a claim, found **M1**: a high-risk MenB dose 3 given even 1 day after dose 2
  counts. Sources read live 2026-11-20 (mm7349a3, rr6909a1, ACIP Best Practice Table 3-2, CDC
  child notes, CDSI 4.65 file). Owner answered: follow CDSI.

## What's NOT done — build in this order, one PR each against `main`

### 1. M1 — high-risk MenB dose 3 follows CDSI (clinical; build first, on this branch)

The rule (owner 2026-11-20; ACIP mm7349a3: "If the third dose is administered <4 months after the
second dose, the dose should be repeated ≥4 months after the last dose, unless the third dose was
administered ≥6 months after the first dose"; CDSI dose 3: absMin "4 months - 4 days" from the
previous dose, allowableInterval "6 months - 4 days" from dose 1):

- Dose 3 ≥4 months after dose 2 (4-day grace, C7) → counts. Unchanged (C5).
- Dose 3 <4 months after dose 2 but ≥6 months after dose 1 (4-day grace, D4) → counts, series
  complete. Unchanged. No 4-week floor here (owner M1a: doses at 0 and 6 months exist either way).
- Dose 3 <4 months after dose 2 AND <6 months after dose 1 → **"Not counted — repeat"** (was:
  counts as "Dose 3 of 4", "Dose 4 of 4" owed). The repeat is due ≥4 months after the not-counted
  dose ("the last dose"); a repeat given ≥6 months after dose 1 also counts.
- Dose 2 is never made invalid or renumbered by this rule (owner asked; confirmed with her).

Worked patients (asplenia, Bexsero; engine output today in the decisions file):
- Jan 1, Feb 1, Apr 1 (months 0, 1, 3) → after: dose 3 "Not counted — repeat", "Dose 3 of 3" due
  Aug 1 (month 7). Today: "Dose 3 of 4", "Dose 4 of 4" due Aug 1.
- Months 0, 3, 6 → counts, complete, before and after (control).
- Jan 1, Jun 25, Jul 2 → counts, complete, booster Jul 2, 2027, before and after (control).

Where: rows `MENB-HIGHRISK-EARLY-DOSE-3` (`src/logic/doseRules.js` ~line 1524) and
`MENB-HIGHRISK-DOSE-4-AFTER-EARLY-DOSE-3`; `menbHighRiskDose3Early()` in `src/logic/seriesTotals.js`
(~line 341) and `menbSeriesInfo()`; `recommend.js` card labels ("Dose 4 of 4 (dose 3 <4 months
after dose 2)"); `MENB-REPEAT-GAP` currently times repeats 4 weeks after an invalid dose. This case
needs 4 months. Also update: CLAUDE.md "MenB D3" section (its "still counts, and a 4th dose is
owed" sentence is reversed), `docs/agent/clinical-rules.md` (~lines 47, 529),
`docs/agent/meningococcal-rules-summary.md`, `src/data/refs.js` (mm7349a3 quote) →
`npm run rulebook`; `npm run sweep:update` and state the moved count and why in the PR.

**Ask, don't default (consequences of the decision):** the *routine* date shown for the repeat.
ACIP says ≥4 months after the not-counted dose; CLAUDE.md's forecast rule also wants ≥6 months
after dose 1 and ≥4 months after dose 2. Recommend: the latest of the three (months 0, 1, 1.5 →
month 6, not 5.5), with the earliest valid date shown beside it when sooner (F1 pattern). Show
one worked patient where they differ.

### 2. Rulebook reorganization (design; after M1 merges, new branch off `main`)

Approved list: decisions file items 1–10. In short:
- Remove Quick look, Age lines and the Risk groups table. "How MeningoVax decides" becomes one
  fold with seven one-sentence steps linking to sections (no per-step Show panels).
- Nine section folds: Stop check, The vaccines, MenACWY, MenB, More than one condition, The
  combined shot, Doses on the record, MeningoVax decisions, Sources.
- Group table (Group | Doses | Boosters; plain words, no chips; Details under the group name)
  at the top of MenACWY and MenB.
- No "Counts as" column.
- Every schedule becomes a table, **Dose | Routine | Minimum interval**, holding TRUE minimums.
  Owner wording: "at least 4 weeks" (not "1 month") dose 1→2; "repeat dose 3" (not "a 4th
  dose"). After M1, high-risk dose 3 "sooner" is not counted unless ≥6 months after dose 1.
- MenB "If dose 3 was early" table, rewritten for M1.
- "A dose that does not count" split into General rules and Special cases.
- Part 6 intervals: the "Sooner counts, but a dose is added" list will hold only healthy MenB
  dose 2.
- Sources grouped, no count or read date.

Layout drawings are in the chat only (not saved). Rebuild from the decisions file. Owner memory
rules apply (`rulebook-screen-mockup-direction`, `show-layout-changes-before-building`): **show a
before/after of anything not already drawn** (the nine folds, the full MenB section after M1).
Two points offered, not answered: all nine folds closed by default (or MenACWY/MenB open); light
grey shading on the Minimum interval column. Ask.

Tests that will change on purpose (name each in the PR): the step-panel worked patients and
Quick look in `regression-2026-11-20-review-v10-d1-rulebook-redesign.test.jsx`, `QUICK_LOOK`/
`PATH_STEPS` users in `regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx`, the
"Counts as" test in `regression-2026-11-20-q2-rulebook-brand-names-not-4c-fhbp.test.jsx`, and the
Batch 5 wording test. Every claim keeps a worked patient held to `recommend()`; no typed numbers
in `rulebookPage.js` page text.

### 3. Carried over from the superseded handoff (still open)

- **Q5**: amber "Not counted — do not repeat". Approved; check PneumoVax's labels first.
- **STOP H**: owner reviews `docs/agent/meningococcal-rules-summary.md`.
- Not yet asked: PneumoVax `DoseEditor.jsx` "Tick this…" (never "tick"); offering MenQuadfi before
  2 months (read AAP live first); PneumoVax design parity (dose rows/cards L1–L4/L7, disclaimer
  P71); DoseEditor "Family locked: MenB-4C" (brand names, Q2).

## Why this is a good stopping point

Every decision for both builds is answered and written down with sources. No code is in progress.
M1 is a separate clinical change and must land before the Rulebook describes it.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout port/m1-menb-dose3-cdsi`
2. `npm test`: confirm **2,359 passed / 195 files**. `preview_start {name: "MeningoVax dev server"}`.
3. Ask the M1 consequence question above before coding the repeat's routine date.
4. Per item (fix-queue skill): failing test quoting the rule → fix → `npm test` → `npm run sweep:update`
   with the moved count explained → `npm run rulebook` → live check in the app → commit named by ID
   (M1). End-of-session checklist (CLAUDE.md E4) in the PR body.
5. Ship skill: push the branch, open a PR against `main` with the live quotes; the owner merges.
   Then branch the Rulebook work off the new `main`.
