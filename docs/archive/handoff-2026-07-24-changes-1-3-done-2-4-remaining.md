# MeningoVax — Handoff after Changes 1 & 3 shipped; 2 & 4 remaining (2026-07-24)

> Supersedes `docs/archive/handoff-2026-07-24-four-build-changes-spec.md` — that file
> listed four changes as brainstormed-but-not-started. Two are now done (this file);
> resume from here, not that one.

Branch: `main`, off `main` (this repo has no branch protection). **NOT pushed** — 2 commits
ahead of `origin/main`. MeningoVax lives at `~/Downloads/MeningoVax-main` (vite base
`/MeningoVax/`; folder is **cloud-synced** — commit early, watch for silent reversion).
Live site: https://jojohuhu-git.github.io/MeningoVax/

Baseline was 358 passing tests (27 files). Now **365 passing tests**, all green, working
tree clean of code changes at commit `3172a0a`. (The tree shows modified/untracked files
under `docs/archive/` — these are pre-existing in-flight doc threads from other sessions,
not touched this session; same note the prior handoff carried.)

## What's done

- **Change 1** — moved the "No previous doses" shortcut from Alt/Cmd+N to Ctrl/Cmd+E
  (Cmd+N/Ctrl+N are claimed by the browser for "new window" before the page ever sees
  them). `src/components/StepHistory.jsx`, dropped the old alias entirely, updated the
  on-screen hint text. New test file `src/components/__tests__/StepHistory.test.jsx` (4
  tests). Live-verified: Ctrl+E selects "No previous doses" in the running app.
  Commit `f089625`.

- **Change 3** — chips never show a dose number greater than the series total. A healthy
  (non-high-risk) 2nd MenACWY dose given after the primary adolescent dose already
  counted, but before the patient turns 16, was wrongly advancing the count (e.g. the
  owner's example rendered "Dose 2 of 1"). Fixed in `src/logic/validate.js`
  (`validateOneMenACWY`): such a dose now routes into the existing amber
  "Off-window - repeat" bucket (`notAdolescentCount`) instead of incrementing
  `effectiveDoseNum` past `seriesTotal`. High-risk patients (legitimate 2+-dose primary
  series before 16) are unaffected — new regression test confirms this. 3 new tests in
  `src/logic/__tests__/validate-new-rules.test.js`. Live-verified against the owner's
  exact example (D1 May 8 2020 @ 10y6m MenQuadfi, D2 Jul 16 2021 @ 11y8m unknown brand):
  D1 now shows green "Dose 1 of 1", D2 shows amber "Off-window - repeat" with an
  explanation, header still correctly says "Booster due today". No UI code changes were
  needed — `RecCard.jsx`'s `notAdolescentCount` chip mechanism already existed.
  Re-verified clinical source live: ACIP 2020 MMWR (RR-9),
  https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm — "Adolescents who receive their
  first dose at age 13–15 years should receive a booster dose at age 16–18 years...
  Adolescents who receive a first dose after their 16th birthday do not need a booster
  dose" (the booster is an age window, not just an interval from dose 1).
  Commit `3172a0a`.

## What's NOT done — the remaining queue

Both from the original four-change brainstorm (`handoff-2026-07-24-four-build-changes-spec.md`),
owner-decided, not started:

- **Change 2** — footnote: a MenACWY dose given at age 10 counts as adolescent dose 1
  (prevents an unnecessary repeat dose at 11). Per-dose message lives in `validate.js`'s
  `reasons` array, not `RecCard`'s `note` block, so the existing C5 subscript-citation
  mechanism (`ACIP_ANCHORS` in `refs.js`, `noteCites`, `renderNoteWithCites()`) doesn't
  reach it yet — extending that marker mechanism into `validate.js` reasons is part of
  the scope. **Owner also wants a full verified edge-case list** of other late/early
  scenarios deserving the same footnote treatment, brought to her *before* wording is
  written. Candidates to confirm against ACIP live (don't assert from memory): first
  dose at 13–15y → booster still due at 16–18 (confirmed this session, see Change 3
  quote above); first dose at ≥16y → no booster needed (also confirmed above); the
  D2-before-16 case (now shipped as Change 3, so it may already satisfy part of this
  ask — check with the owner whether Change 2 still needs a separate edge-case list or
  whether Change 3's fix covers it).

- **Change 4** — references: dedupe + number by order of first mention per
  recommendation. Currently `recommend.js` hardcodes `cite(1, key)`/`cite(2, key)` per
  note, so the same source can render under different numbers depending on which note
  cites it. Fix: move numbering out of per-note calls into a central render-time
  registry that walks notes in render order and assigns/reuses numbers (dedupe by
  source key). Touches `recommend.js` (emit source keys, not hardcoded numbers),
  `RecCard.jsx`'s `renderNoteWithCites()` (assign from the registry), and the
  bottom-of-card reference list. Independent of Change 2 — could be done first if
  preferred.

## Why this is a good stopping point

Changes 1 and 3 are complete, independently committed, and live-verified — nothing is
mid-edit. Change 2 has a built-in owner-review checkpoint (the edge-case list must be
shown to the owner before any wording is written), so it's a natural pause point rather
than a partial implementation. Change 4 is a self-contained refactor with no dependency
on 2.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main` (already on it, nothing to
   pull — this branch is 2 commits *ahead* of origin, not behind).
2. `npx vitest run` — confirm **365 passing (29 files)** before any new work.
3. Start the dev server for live-verification: `preview_start` name
   **"MeningoVax dev server"**.
4. **Ask the owner, don't default:**
   - Push these 2 commits now (branch → PR → squash, or direct push — repo is
     unprotected but owner prefers PR review) vs. keep batching locally through
     Changes 2 and 4?
   - For Change 2: does Change 3's fix already satisfy part of the "no unnecessary
     repeat" ask, or does she still want the separate footnote + edge-case list as
     originally scoped?
   - Order: Change 2 then 4 (as the original handoff suggested), or 4 first since it's
     self-contained and has no owner-review checkpoint blocking it?
5. Per-item workflow: for Change 2 (clinical), run `verify-clinical-source` and
   re-fetch ACIP/immunize.org live before writing anything — quote it, don't recall it.
   Then: reproduce → failing test (logic + UI layers for anything visible) → fix → full
   suite green → live-verify in the running app → **one commit per change**.
6. **Do NOT touch vaxapp/PneumoVax** — owner is doing the batched cross-app port
   herself after MeningoVax is finalized (standing 2026-07-23 decision). Changes 2 and
   3 are meningococcal-logic parity candidates for that later batch.
7. Ship: MeningoVax `main` is UNPROTECTED but owner prefers branch → PR → squash-merge
   — **ask before pushing/merging**, per the `ship` skill, as every prior session has.
