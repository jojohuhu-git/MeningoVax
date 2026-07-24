# MeningoVax — Handoff after W1/W2/W5 citation wiring (2026-07-24)

**Partially supersedes `docs/archive/handoff-2026-07-24-citation-audit-complete-wiring-queue.md`**
— that file's W1, W2, and W5 queue items are done as of this session. Its remaining items
(W3, W4) are unaffected and still open — this file is their new source of truth. Do not
resume W1/W2/W5 from that file.

Branch: `main`, pushed to `origin/main` at commit `ddd72e5`. MeningoVax lives at
`~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`). GitHub Pages deploy confirmed
green after push (run `30113386322`). Baseline this session was 349 passing tests; still
**349 passing**, all green, working tree clean of code changes at commit `ddd72e5` (same
pre-existing doc-only diffs from prior sessions remain untouched — not from this session).

Core promise of this app: **honesty** — a citation that deep-links to the wrong sentence,
or a superseded source cited as current, erodes trust in what the app tells a clinician.

## Owner decisions recorded this session (2026-07-24)

- **W3 label scope**: travel + microbiologist (the "single+boost" MenACWY class) get the
  new "exposure/outbreak" label too, not "risk-based" — owner cited the ACIP definition
  distinguishing "exposure risk" (travelers, outbreak-exposed, microbiologists) from
  "medical risk" (asplenia, HIV, complement deficiency). Same ACIP passage should be cited
  for this label decision when W3 is implemented.
- **W5 immunize.org citation**: confirmed OK as a whole-page chip (no deep link) — matches
  existing refs.js convention.
- **Execution order**: W1→W2→W3→W4→W5, stopping to write a handoff after each phase (this
  file is that checkpoint after W1/W2/W5; W3 and W4 remain).

## What's done this session (by item ID, from the audit-complete-wiring-queue handoff)

1. **W1 — wired consolidated citations.** Added to `src/data/refs.js`: `mm7349a3` (ACIP
   Oct 2024 MMWR, 73(49);1124 — supersedes the 2020 MMWR's MenB-4C brand-split table) plus
   4 quote-anchored derived keys; `menbHealthySCDM1623Box` and
   `menbHighRiskBoosterCadenceBox` (same doc as the existing `pentavalentGSK2025`, whose
   PMC mirror is PMC12782235 — confirmed live, NOT a separate document); `acwyCatchup1921`,
   `acwyFirstDoseAfter16NoBooster`, `menbLicensedAge1025` (all ACIP 2020 MMWR). Removed the
   now-dead `menbSharedDecision1623` key. Rewired every MenACWY/MenB branch the audit
   docx's rows 1,4,5,7,8,9,10,12,14,15,23,29,30,31,32,34,35,36 named — dropping the
   redundant `cdcRecommendations`/`cdcChildMenB` whole-page chips in favor of the exact
   MMWR sentence, and adding `[N]` noteCite deep-links where none existed before (e.g. MenB
   high-risk dose 1/3, the healthy 2-dose schedule, the accelerated 3-dose, the booster
   cadence). All ~10 new quotes were re-verified live this session in a real browser (not
   trusted from the audit doc's cached text) — see quote-verification detail in the prior
   handoff if needed; PMC12782235 = mm7501a2.htm confirmed as the same MMWR by title/DOI
   match, not assumed.
2. **W2 — quote-swapped rows 27 & 33.** Row 27 (19–21y catch-up, `menacwyRoutine`'s
   `am < M.y22` branch) now cites `acwyCatchup1921` instead of the generic routine-schedule
   quote. Row 33 (catch-up at ≥16y, no booster needed, the `am < M.y19` given===0 branch)
   now cites `acwyFirstDoseAfter16NoBooster`. Both were previously pointing at
   `acwyRoutine1112and16`, which does not describe either claim.
3. **W5 — row 28 wired.** The ≥22y healthy/no-risk branch now cites `immMenACWY` (reused —
   it's the same immunize.org MenACWY topic page that carries the homeless/halfway-house
   Q&A, confirmed live; no new CITATIONS key needed) plus `acwyCatchup1921` as MMWR backing
   for why catch-up stops at 21.
4. Updated 2 tests in `recommend.test.js` that pinned the old `cdcRecommendations`
   citation (that pin was the exact thing this session changed) and 4 assertions in
   `c5-note-citations.test.js` that pinned the old `menbSharedDecision1623` anchor.
5. Live-verified in the running app (`preview_start` "MeningoVax dev server"): a 26y
   asplenia patient's MenB dose-1 card shows citation chips "ACIP 2020 MMWR / CDC
   Complement-Inhibitor Guidance / **ACIP Oct 2024 MMWR**" (no more CDC Meningococcal
   Recommendations chip), and the `[1]` superscript in the note deep-links via `#:~:text=`
   to the exact mm7349a3 sentence — confirmed by reading the rendered link href.

Commit `ddd72e5`. Pushed directly to `main` (unprotected, owner confirmed via prompt
before the push — same as prior sessions).

## What's NOT done — the remaining queue

From `handoff-2026-07-24-citation-audit-complete-wiring-queue.md`:

- **W3 — Row 15 relabel to "exposure/outbreak".** Add a new status (or sub-label) for the
  transient one-and-done indications (military recruit, first-year college resident,
  A/C/W/Y outbreak) AND travel/microbiologist (owner-decided this session, see above) —
  distinct from the ongoing-medical-risk "risk-based" label. Touches the `rec()` `status`
  enum (`due | catchup | risk-based | shared-decision | complete | not-indicated |
  deferred`) and downstream UI colour/label mapping. Verify across every MeningoVax
  surface (fewer than vaxapp's five — confirm which apply). Bigger change than W1/W2/W5;
  do this next with its own test-first pass.
- **W4 — Row 13 code trace.** Not a citation change. Confirm `recommend.js` actually
  handles the college-dorm "&gt;5 years since 16th birthday" sub-case (p2018.pdf lists it
  as a distinct scenario) — the prior handoff said it was never traced and may fall
  through to a generic branch. Independent of W3; can be done before or after it.

## Why this is a good stopping point

W1/W2/W5 are citation-metadata-only changes (additive, no dosing-logic touched), fully
tested (349/349), live-verified, and shipped to production. W3 is a real implementation
change (status enum + UI) that deserves its own focused session per the owner's
stop-after-each-phase request. W4 is an independent code-correctness check, unrelated to
citations or labels.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. `npx vitest run` — confirm **349 passing** before any new work.
3. Start with W3 (owner already decided the label scope — see "Owner decisions" above, do
   not re-ask). Per-item workflow: reproduce → failing test (both logic + UI layers) → fix
   → suite green → live-verify in the running app → commit named `W3`.
4. Then W4 (code trace — read `recommend.js`'s `isCollege` branch in `menacwyRec`, build a
   test case for a college-dorm patient whose only prior dose was >5 years before their
   16th birthday, confirm the app's actual behavior against p2018.pdf's expected behavior).
5. Stop and write a fresh handoff after W3 (and again after W4 if done separately) — per
   owner's explicit request this session.
6. Ship: MeningoVax `main` is UNPROTECTED but ask before pushing — confirmed again this
   session.
