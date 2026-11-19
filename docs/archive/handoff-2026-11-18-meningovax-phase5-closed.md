# MeningoVax port — Handoff after Phase 5 was closed (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 5", "Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase5-f2-f4-f6.md`.

## State (verified 2026-11-18)

- PR #105 (F-2, F-4, F-6) is merged: `main` at `9331624`, **2,117 passed, 0 failing (168 files)**,
  re-run this session on `main` before any change.
- Branch `docs/2026-11-18-phase5-closed` off `main`: docs only (plan, decision log, `CLAUDE.md`
  status line, this handoff). No code, test or saved answer changed.

## What's done

1. **A17 closed (owner, 2026-11-18).** PneumoVax keeps two dates for a too-soon dose. MeningoVax's
   saved answers already hold the one the clinician sees (the card's `earliestNextDate`, which
   F-4's "Repeat from <date>" line prints; `cardAnswer` in `src/test-grid.js`). The other ("when
   this dose would have counted") is not computed and nothing shows it; owner chose not to add it.
   Recorded in the plan's A17 row and `decisions-2026-11-17-open-questions.md` ("Phase 5
   close-out").
2. **Phase 5 is finished** (plan, Phase 5 section).
3. **Owner timing decision:** the 1,984 "Not counted — repeat" lines under a "Not yet due" card
   with no date (e.g. a baby's too-young MenQuadfi says "repeat"; the repeat is at 11) are asked
   **with Phase 6**, beside F-3 and F-5, with worked patients. Not measured again this session
   (the 1,984 is from the F-4 build, same code as `main`).

## What's NOT done

**Owner action first:** review and merge this docs PR.

**Phase 6 — Wording (not started).** 6.1 is **STOP G1**: show the owner five before/after lines
and five "Why this" paragraphs (the most-seen ones), as PneumoVax did, and have her approve the
style rules for MeningoVax. Ask in the same round (one patient per box, measured first):
- F-3: "Up to date" badge on cards with a dated dose still coming (e.g. Leo, 13, asplenia,
  MenACWY dose 2 not yet due); PneumoVax's type-badge style. `report-2026-11-18-phase5-measured.md`.
- F-5: "Booster due at 16y" vs "Booster (16y)" for the same dose (same report).
- The "Not yet due" + "repeat" lines above.
6.2 applies the approved rules everywhere (plan lists the IDs); 6.3 is **Q10** (fold the result
page) — ask again, her 2026-11-06 answer was "PneumoVax only"; build only on a yes.

**Carried over (not fixed):** MenB booster note "1 year after the primary series" on later
boosters; MenB "every 2–3 years" advises 2; whole-app check 5's remaining 2,437 / 20 are partly a
checker gap (`asksOn` doesn't know Q11); whole-app check 7 typical 234 → 228 hidden by F-2's
13-year checkpoint (6 MenB outbreak-label changes, still flagged on 96 grid patients); Phase 4
A2 colours, A10, A11, A16; healthy 12 y too-young Bexsero "repeat"; CDC 2024-0069,
2024-0034/0035, 2024-0040 (shared `dateUtils.js`, change both repos).

## Why this is a good stopping point

Phase 5 is closed as a unit with every question answered by the owner and recorded. Phase 6 opens
with an owner stop (G1), so nothing should be built before she sees the before/after examples.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr list --state all --head docs/2026-11-18-phase5-closed`.
   If merged: `git checkout main && git pull --ff-only`; `npm test` should give **2,117 passed,
   168 files**. If not merged, ask the owner.
2. `preview_start` "MeningoVax dev server".
3. Phase 6.1: read the plan's Phase 6 and PneumoVax's style rules (§M-L3, §M-L5, §WORD-TIDY);
   use the `design-review` skill. Pick the five most-seen lines/paragraphs by measuring (prose
   diff / grid counts), not by guessing. Prepare before/after pairs and the F-3, F-5 and
   "Not yet due" questions (memory: issue, sources with quotes, recommendation, worked patients
   + a control). Ask, don't default.
4. For any change after her answers: prototype → measure (`npm run sweep:update`, prose diff,
   whole-app checks, card-change count) → failing test → change → docs in the same commit →
   live check.
5. Branch + PR against `main`; the owner merges. Handoff in this folder, in the same PR.
