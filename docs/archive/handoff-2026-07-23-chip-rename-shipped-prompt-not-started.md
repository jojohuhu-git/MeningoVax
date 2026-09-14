# MeningoVax — Handoff: §1 chip rename shipped; §2–§5 risk-at-dose prompt designed but not built (2026-07-23)

> **SUPERSEDED (2026-07-23, later same day)** by
> `docs/archive/handoff-2026-07-23-legend-wording-undo-agedesc-ontrack-design.md`.
> §2–§3 (the "Needs input" prompt) and §5 (parked UX #5) described as "not built" below
> **were built and pushed** later this same day (commits `981682c`, `9c758b8` — 303 tests
> passing). Do not resume the §2-§5 plan in this file; it's done. The newer handoff covers
> what's next (legend wording refinement, an undo button for the prompt, age-description
> cleanup, and a new "on track" status). This file's §1 history remains accurate.

Supersedes: `docs/archive/handoff-2026-07-23-compliance-chip-risk-timing-design.md` (the
design doc — still the source of truth for WHAT to build; this file is the source of truth
for WHAT'S DONE and the concrete code plan for what's left).

Branch: `main`, **3 commits ahead of `origin/main` — NOT pushed**. MeningoVax lives at
`~/Downloads/MeningoVax-main` (folder is **cloud-synced** — commit early, watch for silent
reversion). Live site: https://jojohuhu-git.github.io/MeningoVax/

**281 passing tests (20 files), all green**, working tree clean except pre-existing doc
changes (`docs/archive/handoff-2026-07-23-menb-healthy-age-gate-shipped.md` modified,
two untracked handoff docs — not code, leave as-is) at commit `472151b`.

Core promise of this app: **honesty** — a screen that quietly implies something is fine when
it isn't is the worst kind of bug.

## What's done this session

- **Booster-schedule capture verified** against the live ACIP 2020 MMWR RR-9 (fetched and
  quoted directly, not from memory — see `verify-clinical-source` skill). Both MenACWY
  (high-risk boosters: <7y at D2 completion → 3y then 5y; ≥7y → 5y) and MenB (high-risk
  boosters: 1y after primary, then every 2–3y) in `src/logic/recommend.js` match the source
  exactly. **No gap found** — this closes the "verify FIRST" item from the design doc.
- **§1 shipped and committed** (`472151b`): chip vocabulary renamed.
  - `src/components/RecCard.jsx` — `DoseValidation()`: `'On time'` → `'Counts'`,
    `'Valid (off-window)'` → `'Off-window — repeat'`. CSS classes unchanged
    (`dose-val-valid`/`dose-val-offwindow`).
  - `src/components/Results.jsx` (~L247-248) — color-key legend text fixed to match (was
    describing amber as "counted, but outside routine timing" — it does NOT count).
  - Tests updated: `RecCard.test.jsx`, `regression-p0-1-menb-healthy-ui.test.jsx`,
    `App.test.jsx` (color-key assertion).
  - Live-verified in the browser: pre-age-10 MenACWY dose renders "Off-window — repeat"
    (amber), color-key panel shows the corrected labels.

## What's NOT done — the remaining queue

**§2–§3: risk-at-dose "Needs input" prompt.** Design is fully owner-confirmed (see the
superseded handoff's §1-§5 for the full spec — chip states, prompt wording, firing rules,
persistence, disclaimer). Implementation was scoped out but **interrupted before any code
was written** — `src/logic/validate.js` is untouched. The plan below is the result of that
scoping; verify it's still accurate (cloud-sync may have shifted lines) before coding.

### Where the ambiguity lives today (the bug this closes)

`src/logic/validate.js` has two branches that decide whether a pre-threshold dose counts,
and **both currently key off CURRENT risk status only**, never risk status at the time of
the dose:

- MenACWY, ~L250: `if (menacwyRiskClass(riskIds) !== 'primary2' && ageAtDose < 120mo)` →
  off-window. When the patient **IS** high-risk-now, this branch is skipped entirely and
  the dose silently falls through to high-risk interval-check logic — i.e. the app assumes
  the patient was already at risk when an old dose was given, with no way to know.
- MenB, ~L402: same shape, `if (!hasMenbRisk(riskIds) && ageAtDose < 192mo)`.

### The fix: thread a per-dose answer through the validator

1. **Data flow** (index-based, matching the existing `doseValidations[i]` zip pattern
   RecCard already uses — see `Results.jsx` ~L43-44, ~L292-293, ~L306-307):
   - `analyzeHistory(vaccine, doses, ageMonths, riskIds, today, riskAtDoseAnswers)` — new
     6th param, an object keyed by the **post-sort index** (same index `sortedDoses`/
     `perDose` already use), values `'yes' | 'no' | 'unsure' | undefined`.
   - `runWalk(...)` passes `riskAtDoseAnswers[rawIdx]` into `validateOneMenACWY` /
     `validateOneMenB` as a new last argument.
   - `validateOneMenACWY(dose, effectiveIdx, kept, ageMonths, riskIds, today, riskAnswer)`
     and `validateOneMenB(...)` gain that parameter.
   - Only **dated** doses get prompted — the no-date branches (top of each validator) are
     untouched; you can't ask "at risk on what date?" without a date. This matches the
     design's "risk-status-on-that-date is unknown AND decisive" firing rule for doses
     where a date does exist.

2. **New `status: 'pending'` result** (returned only when: patient is high-risk-now per
   `menacwyRiskClass(riskIds) === 'primary2'` / `hasMenbRisk(riskIds)`, dose is dated, dose
   age is in the ambiguous window, AND `riskAnswer` is `undefined`):
   ```js
   { status: 'pending', needsInput: true, reasons: [...], promptDate: dose.date }
   ```
   - `riskAnswer === 'yes'` → skip the off-window branch entirely, fall through to the
     existing high-risk interval-check code below (dose is treated as always having been
     part of the high-risk series — add one extra reasons entry noting it counts because
     of the answer, for clinician transparency).
   - `riskAnswer === 'no'` or `'unsure'` → same shape as the existing off-window return
     (`status: 'valid', notAdolescentCount: true`), reasons text should say *why* (risk
     absent/uncertain at that date), not just "given before age 10/16" — that phrasing
     would misleadingly suggest the age floor is the reason when the answer is.
   - Healthy-now patients (not high-risk currently) are **unchanged** — still resolved by
     age window alone, no prompt, per the design's explicit "no prompt for them" rule.

3. **`runWalk`**: add a branch for `result.status === 'pending'` (check before the existing
   `notAdolescentCount` branch) — do **not** add to `kept`, do **not** increment
   `effectiveCount` (conservative default while awaiting input, matching "Not sure" logic),
   `effectiveDoseNum: null`.

4. **`RecCard.jsx` `DoseValidation()`**: new gray "Needs input" chip for `status ===
   'pending'`, rendered as an interactive element — clicking (or always-expanded, owner's
   call) shows the question *"Was this patient at high risk for meningococcal disease when
   this dose was given ({fmtDate(promptDate)})?"* with Yes / No / Not sure buttons. Answer
   flows up via a new callback prop (e.g. `onRiskAtDoseAnswer(vaccine, sortedIndex, answer)`)
   that `Results.jsx` wires to new state (see §4 below) — answering must trigger a
   recompute so the chip resolves live to Counts/Off-window/Invalid.

### §4: persistence — turns out simpler than the design doc assumed

The design doc's §4 worried about keeping prompt answers out of the `?s=` URL param — **but
MeningoVax has no URL-state serialization at all** (confirmed: no `URLSearchParams`,
`searchParams`, or `?s=` anywhere in `src/`; unlike vaxapp, this is a plain in-memory wizard
— `src/App.jsx` holds everything in one `useState`). So: add `riskAtDoseAnswers` as an
ordinary key in `App.jsx`'s `INITIAL_STATE` / `state`, threaded down to `Results.jsx` exactly
like `riskIds`/`menacwyDoses` already are. Nothing extra needed to satisfy "memory-only, gone
on close" — that's just what this app already does for everything.

### §5: disclaimer + legend (small, do last)

- `src/components/Disclaimer.jsx` — add one sentence: the app reads *current* risk status
  and doesn't record when a risk started/ended, so past temporary-risk doses may need
  provider input (this is the plain-English explanation of why the prompt exists).
- Legend in `Results.jsx` (~L245-251, already touched this session for §1) needs a new row
  for the "Needs input" gray-interactive chip once it exists.

### Tests to add/update (both logic + UI layers per `docs/agent/testing.md`)

- `src/logic/__tests__/validate.js` / `validate-new-rules.test.js` — new cases: high-risk-now
  + ambiguous dated dose + no answer → pending; + 'yes' → counts, interval-checked normally;
  + 'no'/'unsure' → off-window, doesn't count. Cover both MenACWY and MenB. Include the
  stress-test scenario from the design doc: asplenia/complement-inhibitor risk that started
  **after** an old ambiguous dose still gets prompted (permanence ≠ past presence).
- `src/components/__tests__/RecCard.test.jsx` — pending chip renders, prompt UI appears,
  answering calls the callback with the right args.
- `src/components/__tests__/Results.test.jsx` (or App-level) — answering a prompt updates
  `state.riskAtDoseAnswers` and the recommendation re-renders live.

## Why this is a good stopping point

§1 is a complete, independently shippable unit — committed, tested, live-verified, and it
doesn't block or get blocked by §2-§5. The §2-§3 scoping above was done carefully (data flow,
exact line anchors, the no-date-doses-don't-get-prompted simplification, the discovery that
§4 needs no special handling) specifically so the next session can start writing code
immediately instead of re-deriving the design into an implementation plan.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm `main` @ `472151b` (3 ahead of
   `origin/main`, not pushed). `npx vitest run` — confirm **281 passing**.
2. Start the dev server (`preview_start` "MeningoVax dev server", port 5175 per
   `.claude/launch.json`) before any work.
3. Build §2–§3 first (the plan above), one implementation step at a time:
   `validate.js` signature threading → `runWalk` pending branch → `RecCard.jsx` UI →
   `App.jsx`/`Results.jsx` state wiring → tests → live-verify in browser → commit.
   Then §4 (trivial, likely folds into the same commit as the state wiring) → §5
   (disclaimer + legend row) → final full-suite + live-verify pass.
4. Test-first per item: reproduce/design the case → failing test → fix → full suite green →
   live-verify in the running app → one commit per item (§2-3, then §5).
5. **Cross-app port stays gated behind MeningoVax shipping** (owner's sequencing) — do not
   start on PneumoVax/vaxapp parity until this queue is fully done and pushed.
6. Ship: MeningoVax `main` is UNPROTECTED but owner prefers branch → PR → squash-merge. Ask
   before pushing — 3 unpushed commits are already sitting on `main` from prior sessions.
