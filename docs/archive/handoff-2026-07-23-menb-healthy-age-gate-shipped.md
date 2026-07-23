# MeningoVax — Handoff after shipping the MenB healthy-age fix + cross-app audit (2026-07-23)

Supersedes: `docs/archive/handoff-2026-07-23-publish-complete.md` (its "Parked list" is still
open but now carries owner decisions — see below; do not resume that file's framing).

Branch: `main`, synced with `origin/main` at commit `764f03a`. **281 passing (20 files)**, all
green, working tree clean. MeningoVax lives at `~/Downloads/MeningoVax-main` (folder is
**cloud-synced** — commit early, watch for silent reversion). Live: https://jojohuhu-git.github.io/MeningoVax/

Core promise of these apps: **honesty** — a silent wrong clinical answer is the worst defect.

## What's done this session

1. **P0-1 — MenB healthy-age gate. FIXED + SHIPPED.** A MenB dose given before age 16 to a
   patient with **no current MenB risk factor** was wrongly counted as "effective dose 1,"
   causing under-vaccination (a healthy 16yo with an age-10 dose was told "Dose 2 of 2" instead
   of a fresh 2-dose series). Owner decision: **Option 1** — such a dose is valid-age but does
   not count (mirrors MenACWY's pre-age-10 `notAdolescentCount`). Fix in
   `src/logic/validate.js` `validateOneMenB` (dated + no-date branches). Tests:
   `regression-p0-1-menb-healthy-age16-gate.test.js` (5 engine cases),
   `regression-p0-1-menb-healthy-ui.test.jsx` (card shows "Valid (off-window)", not "On time").
   PR #5 squash-merged → `764f03a`; GH Pages deploy succeeded; live site 200.
   Source: ACIP 2020 MMWR RR-9 (https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/).
2. **Full rule re-audit (read-only).** MenACWY (routine/catch-up/high-risk/infant/college/
   boosters), MenB high-risk + boosters, family lock, pentavalent gate, pregnancy deferral all
   verified CLEAN. Only defect found was P0-1. Details + a P2-1 note in the queue doc
   `.claude/prompts/fix-2026-07-23-menb-healthy-age-gate.md` (not git-tracked; `.claude` is gitignored).

## What's NOT done — the remaining queue (all need owner go-ahead; none started)

- **vaxapp five-surface MenB parity fix — SAME BUG CONFIRMED, deferred to its own session.**
  `dc(hist,"MenB")` (`~/Downloads/vaxapp-main/src/logic/stateHelpers.js:7`) counts all given
  doses with no age filter; `recommendations.js` MenB block (~line 752) has no pre-16 healthy
  gate. Verified probe: healthy am=192 + MenB dose given at age 10 → "Dose 2 (same antigen
  family as dose 1)". Fix must reach all FIVE surfaces (genRecs/recommendations.js,
  regimens.js+comboAnalyzer.js, forecastLogic.js, catch-up, buildOptimalSchedule.js) +
  compliance.js, and extend `cross-app-meningococcal-agreement.test.js`. NOTE: recommendations.js
  uses literal `\uXXXX` escapes — edit with Python, not the Edit tool. Use `fix-queue` +
  `vaccine-parity` + five-surface-verification docs. PneumoVax = N/A (no MenB).
- **Rules-summary doc (owner requested 2026-07-23).** Plain-English single-source-of-truth for
  "when is MenACWY / MenB due" (age bands, healthy vs high-risk, counting rules, boosters,
  family lock, pentavalent). Reason: rules keep drifting as new test cases appear. Route per
  docs conventions (likely `docs/agent/`).
- **Parked UX list — owner decisions now recorded (from `plan-2026-07-23-recorded-dose-ux-five-items.md`):**
  - **#2 status-announced-3-4×:** Option **A** — delete the redundant pentavalent due-header.
    Owner wants a **before/after preview to approve BEFORE finalizing**.
  - **#3 scattered actions:** **C** — leave the two edit entry points as-is (no change).
  - **#4 opt-in color key:** **A** — put status words on the cards (do not rely on the color key).
  - **#5 a11y checkbox nesting:** **B** — rebuild the "None of these risk factors apply" control
    as a real `<button>` (not a `<label role=button>` wrapping a checkbox).
  - Parity reminder: copy/design changes (#2, #4) must also flow to PneumoVax (same design system).

## Why this is a good stopping point

The clinical-safety fix is fully shipped, deployed, and green — that was the urgent item. The
three remaining threads (vaxapp parity, rules doc, parked UX) are independent, each has a
recorded owner decision, and none blocks the others. The owner asked to hand off and start a
fresh conversation from here.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm clean on `main` @ `764f03a`;
   `npm test` — confirm **281 passing**.
2. Pick a thread with the owner (ask, don't default): vaxapp parity fix, the rules doc, or the
   parked UX items (#2 preview first — owner wants to approve before finalizing).
3. Per-item workflow: reproduce → failing test (both layers for visible bugs) → fix → full suite
   green → live-verify in the running app (`preview_start` "MeningoVax dev server") → one commit
   per item. Ship: MeningoVax `main` is UNPROTECTED but owner prefers branch → PR → squash-merge.
4. For any clinical-rule change, run `verify-clinical-source` first; for shared meningococcal
   rules, run `vaccine-parity` (vaxapp + MeningoVax carry the same rules).
