# MeningoVax — Handoff after A1/C1/C2/C3 shipped (2026-07-24)

**Supersedes** `docs/archive/handoff-2026-07-24-altkey-and-pentavalent-chip-cleanup-PLAN.md`
— that file's queue (A1, C1, C2, C3) is now entirely **DONE**. Do not resume from the PLAN
file; it's kept only for the design rationale (owner decisions, table titles/footnotes).

Repo: `~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`; live on GitHub Pages).
Branch: `main`, off `main` (repo has no branch protection). **Pushed** — owner confirmed
this in chat; `main` and `origin/main` both at commit `2141272`. GitHub Pages deploy
confirmed green (`gh run watch 30138444670 --exit-status`: build + deploy jobs both
✓) and the live site (https://jojohuhu-git.github.io/MeningoVax/) spot-checked loading
correctly after deploy.

Baseline this session was 373 passing tests (confirmed live via `npx vitest run` before
starting). Now **380 passing**, all green, working tree clean of code changes at commit
`2141272` (includes this handoff + the superseded-banner edit, both committed). Working
tree still shows the same pre-existing doc-only modified/untracked files under
`docs/archive/` that every prior handoff in this chain has noted — not touched this
session.

## What's done (by item ID, from the PLAN queue)

- **A1** — removed the Alt+A `accessKey` binding on the Add-dose button
  (`DoseEditor.jsx`, `StepHistory.jsx`). It duplicated the JS-driven Ctrl/Cmd+A shortcut
  via a second, less-discoverable browser-native trigger; dropped the `accessKey`, the
  conditional `title`, and the `<u>A</u>dd dose` underline (label is now the DoseEditor
  default `+ Add dose`; title stays `Add dose (Ctrl/Cmd+A)` unconditionally so it also
  now correctly appears on the Results.jsx inline panel's Add-dose button). New test in
  `App.test.jsx` asserts no accessKey / no `<u>`. Live-verified via
  `button.accessKey === ''`. Commit `0d807f4`.

- **C1** — MenB healthy-series citations (5 spots in `menbRec()`) swapped from
  `pentavalentGSK2025` (the Penmenvy/mm7501a2 page — mislabeled, since none of these
  recs are Penmenvy-specific) to `mm7349a3`, and dropped the "(preferably 16–18)" note
  text (not present in mm7349a3, only in the separate mm7501a2 Box). Removed the now-
  orphaned `menbHealthySCDM1623Box` ref entry. Verified live against
  `https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm`: the ACIP SCDM/0-6mo sentence
  is an exact match to the existing `menbHealthy2Dose0and6` citation. 2 tests in
  `c5-note-citations.test.js` updated (test-first). Commit `0db1037`.

- **C2** — MenACWY exposure recs (travel, microbiologist, military, college-dorm,
  A/C/W/Y-outbreak — 7 sites in `menacwyRec()`) swapped from the same mislabeled
  `pentavalentGSK2025` default to per-risk-factor ACIP 2020 MMWR table anchors, added
  to `riskFactors.js`: microbiologist → Table 7, travel → Table 9, military/college-dorm
  → Table 10, outbreak_acwy → Table 8. Routine adolescent scheduling upgraded from the
  whole-document `acip2020` chip to the Table 2 anchor. `outbreak_b` (MenB, not
  MenACWY) got the C1 `mm7349a3` swap instead of a table anchor, per the plan's own
  note. All 5 table titles and the 2 load-bearing footnotes (Table 9 meningitis-belt/
  dry-season, Table 10 college-dorm 5-year recency) were read live from
  `rr6909a1.htm`'s rendered `<table><caption>` + footnote list this session — not
  transcribed from the plan doc. Table 8's footnote is a non-load-bearing pointer to a
  separate PDF, so it's title-only. New `refsExposure()` helper (empty default) added
  because the existing `acip2020`-default helper would otherwise show two identically-
  labeled "ACIP 2020 MMWR" chips per card. 6 new tests in `recommend.test.js`
  (test-first). Commit `e70a97c`.

- **C3** — reconciliation audit: confirmed no chip still carries a "Penmenvy" label on
  non-Penmenvy content (only remaining `pentavalentGSK2025`/`pentavalentPfizer2023`
  usage is the pentavalent offer card, which is genuinely about those combo vaccines),
  and confirmed chip-only sources (`immMenACWY`, `immMenB`, `cdcComplementInhibitor`,
  per-risk-factor refs) are intact. Fixed 2 stale code comments left over from before
  C2. Live-verified the college-dorm "complete (dose given at ≥16y)" card — the
  duplicate-chip case found and fixed while implementing C2 — now shows exactly one
  chip (Table 10 anchor), not two. Commit `26699f1`.

## What's NOT done — nothing from this queue

The A1/C1/C2/C3 queue from the PLAN doc is fully closed. No open items remain from it.

## Why this is a good stopping point

All four items are independently committed, each with its own test-first change and a
live-app verification (not just unit tests) — 380/380 passing. Nothing is mid-edit. The
working tree's only diffs are the pre-existing doc drift several prior sessions have
already flagged as out of scope.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull` (should already be
   up to date — session ended with `main` and `origin/main` both at `2141272`).
2. `npx vitest run` — confirm **380 passing** before any new work. If it differs, stop
   and reconcile.
3. No open owner decisions block starting new work — this queue closed cleanly AND is
   live. If the owner wants the next piece of work, ask what it is; possible candidates
   noted in other memory/handoffs: M1 (a suspected `validate.js` booster-cadence bug,
   needs re-confirmation before fixing — see
   `.claude/prompts/plan-2026-07-16-meningovax-followups.md`), M2/M3 (minor cleanup),
   or the vaxapp (PediVax) MenB-healthy-pre-16 parity port (separate repo,
   `~/Downloads/vaxapp-main` — see memory note `project_menb_healthy_age16_gate`).
   Don't default to any of these without asking.
4. Per-item workflow for any new vaccine-logic or citation work: verify the clinical
   source live (`verify-clinical-source` skill) → reproduce/confirm → failing test
   (synthetic fixture) → minimal fix → full suite green → live-verify in the running
   app (`preview_start` name `"MeningoVax dev server"` — Vite auto-increments the port;
   check `preview_logs` for the actual one) → one commit per item ID.
5. Ship: MeningoVax `main` is UNPROTECTED but ask before pushing — keep asking each
   time even though this session's push went cleanly; that's the established pattern.
