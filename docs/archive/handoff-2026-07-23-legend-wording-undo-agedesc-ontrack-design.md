> **PARTIALLY SUPERSEDED (2026-07-23)** by
> `handoff-2026-07-23-results-tab-clarity-design.md`. **Item 1** (legend wording) and
> **Item 4** (`On Track` badge) are SUPERSEDED — the new handoff removes the legend entirely
> (C1) and replaces terse status badges with self-describing timing+need pills (C3), which
> absorb both. **Items 2 and 3 of this file still stand** (edit/undo for the "Needs input"
> prompt; drop redundant raw-day precision) — build them from the new handoff's carried-over
> list. Do not build Items 1 or 4 as written here.

# MeningoVax — Handoff: four UX items scoped and owner-decided, no code written yet (2026-07-23)

Supersedes: `docs/archive/handoff-2026-07-23-chip-rename-shipped-prompt-not-started.md` for
anything about §2–§5 status (those are done — see its updated superseded banner). This file
is a **new, separate request** the owner opened after that work shipped.

Branch: `main`, in sync with `origin/main` (nothing ahead, nothing to push). MeningoVax lives
at `~/Downloads/MeningoVax-main` (folder is **cloud-synced** — commit early, watch for silent
reversion). Live site: https://jojohuhu-git.github.io/MeningoVax/

**303 passing tests, all green, working tree clean of code changes** — the only diffs present
are pre-existing doc-only changes from prior sessions (`docs/archive/handoff-2026-07-23-menb-
healthy-age-gate-shipped.md` modified, plus the three untracked/edited handoff docs discussed
above) — not touched this session, leave as-is.

Core promise of this app: **honesty** — a badge or label that implies something is done or
safe when it isn't is the worst kind of bug.

## What's done this session

**Nothing was coded.** This was entirely scoping + owner decisions. Every edit attempt was
interrupted by the owner mid-session (twice) to add more items before any file was touched —
so `src/logic/validate.js`, `src/logic/recommend.js`, `src/components/RecCard.jsx`, and
`src/components/Results.jsx` are all still exactly as they were at commit `9c758b8`.

**Owner explicitly narrowed scope mid-session: MeningoVax only.** Do NOT port any of this to
PneumoVax or vaxapp in the next session either — the owner said there have been "several
design and logic overhauls on meningovax" and wants a comprehensive, deliberate cross-app
review later, not a piecemeal port of whichever items happen to ship first. This overrides the
general cross-app-parity rule in `docs/agent/docs-routing.md`/the `design-review` skill for
this queue specifically — flag it as a batched follow-up, don't auto-port.

## What's NOT done — the four scoped items

### Item 1 — Legend wording (Results.jsx color key)

Owner wants the compliance-audit color-key text (already once revised in commit `472151b`)
refined further:

- `src/components/Results.jsx` line 264: `"Counts: advances this patient's series"` →
  **`"Valid - counts toward patient's series"`**
- `src/components/Results.jsx` line 265: the description part of `"Off-window — repeat:
  safely given, but doesn't advance this series"` → **`"repeat: does not count toward
  patient's series"`** (full line becomes `"Off-window — repeat: does not count toward
  patient's series"`, keeping the `"Off-window — repeat"` lead-in unchanged).

No test currently pins the removed wording besides the general legend-text assertions in
`Results.test.jsx`/`App.test.jsx` from the `472151b` rename — check those and update the
expected strings.

### Item 2 — Undo/edit for the "Needs input" prompt (owner-decided design)

Today, once a provider answers the risk-at-dose Yes/No/Not sure prompt
(`src/components/RecCard.jsx` `DoseValidation()`, ~L44-88), the answer is permanent for the
session — no way back to change it. **Owner-decided fix: a small "Edit" link on the resolved
chip** that re-opens the same Yes/No/Not sure prompt in place; picking a new answer replaces
the stored one. (Rejected alternative: an "Undo" that clears straight back to the pending gray
chip — owner wants edit-in-place instead.)

Implementation notes (from this session's code read, not yet built):
- The answer lives in `state.riskAtDoseAnswers[vaccine][sortedIndex]`, set via
  `Results.jsx` `handleRiskAtDoseAnswer()` (~L52-61) and passed to `analyzeHistory()`.
- Once answered, the validator's returned result (`src/logic/validate.js` ~L267-290 for
  MenACWY, ~L449-468 for MenB) no longer carries `needsInput`/`promptDate` — so
  `DoseValidation()` in RecCard can't tell from `result` alone that this dose was ever
  prompted. **RecCard needs a new prop** carrying the raw `riskAtDoseAnswers` map (or just
  a per-index boolean) from `Results.jsx`, passed alongside the existing
  `doseValidations`/`onRiskAtDoseAnswer` props (see call sites at `Results.jsx` ~L306-314 for
  MenACWY, ~L321-329 for MenB — both currently omit this).
- `DoseValidation()` becomes stateful (file already imports `useState`, just not used at that
  scope): add local `editing` state; render the Yes/No/Not sure prompt block when
  `status === 'pending'` **or** `editing === true`; the "Edit" link (visible only when this
  dose's index has a stored answer) sets `editing = true`; picking an answer calls the existing
  `onAnswer` callback and should close `editing` back to false so the resolved chip shows again.

### Item 3 — Drop redundant raw-day precision in interval explanations

Owner's rule: don't state the same interval in two units when a clean coarse one (years/
months) already appears — e.g. `"Required cadence: ≥5 years (1826 days)"` next to `"Actual
interval: 1826 days"` is over-precise. **Decided approach (owner-confirmed): keep the existing
`fmtDays()` helper's output (which already collapses ≥1yr intervals to e.g. `"~5 years"`,
never showing months once years are shown) and use it consistently everywhere a raw day count
is currently interpolated raw, instead of the bare `${days} days`/`${days} d` literal.**

All sites are in `src/logic/validate.js` (function `fmtDays()` at ~L135 is the tool to reuse,
not duplicate):
- ~L311-312 (MenACWY high-risk primary interval) — detail line `Actual interval: ${interval}
  days. Minimum: ${minInterval} days.` → both operands through `fmtDays()`.
- ~L345-346 (MenACWY high-risk booster cadence) — drop the raw `(${cadenceDays} days)`
  parenthetical from the reason text (cadenceLabel already says "3 years"/"5 years"); detail
  line same `fmtDays()` treatment.
- ~L358-359 (MenACWY baseline ≥4wk interval) — same treatment; "4 weeks (28 days)" in the
  reason text can drop the "(28 days)" since `fmtDays()` already renders "~4 weeks".
- ~L510-511 (MenB high-risk D1→D2) — same pattern, "4 weeks (28 days)" → "4 weeks".
- ~L528-529 and ~L535-536 (MenB high-risk D3 from D1/D2) — reason text has `(~183 days)` /
  `(~122 days)` parentheticals next to "6 months"/"4 months" — drop them; `detail +=` lines
  get the `fmtDays()` treatment.
- ~L563-564 (MenB booster cadence) — detail line only, same treatment (reason text's
  `minLabel` is already friendly, e.g. "1 year after completing the primary series").
- ~L604-605 (MenB rescue D3) — reason text `(~122 days)` parenthetical dropped; detail line
  `fmtDays()` treatment.

Verified by hand this session that `fmtDays()` applied to every constant above (28, 56, 122,
183, 365, 730, 1096, 1826 days) reproduces the exact wording already used in each reason
string (e.g. `fmtDays(1826)` → `"~5 years"`), so this is a pure duplication-removal, not a
wording change — should not require new test assertions beyond removing now-absent day-count
substrings from any test that currently greps for them (search `days\.` / `days\)` patterns in
`src/logic/__tests__/validate*.test.js` before editing).

### Item 4 — New "on track" status: don't badge a series "Complete" when a future booster is still due

**Bug found this session:** `src/logic/recommend.js` ~L349-357 — the case where a patient has
the routine MenACWY dose at 11-12y recorded and the 16y booster is still in the future (not
yet due) sets `status: 'complete'`. `RecCard.jsx` ~L140 then badges this card **"Complete"**
(`STATUS_LABELS['complete']`) at the top, directly contradicting the "Not yet due — booster
~DATE" banner rendered lower on the same card (`RecCard.jsx` ~L178-182, itself added by a
prior "B6" fix specifically because this state isn't a quiet done state). This is the **only**
place in `recommend.js` where `status: 'complete'` coexists with a set `boosterDueDate`
(confirmed by grep — every other `'complete'` case genuinely has nothing further due).

**Owner-decided fix:** new status value, badge text **`"On Track - future dose(s) remain"`**
(exact wording, hyphen not em-dash — matches the app's recent em-dash-avoidance convention
from commit `93f450e` in the sister vaxapp repo).

Implementation, not yet built:
- `src/logic/recommend.js` line 355: change `status: 'complete'` → `status: 'on-track'` for
  this one `rec({...})` call only. (Do not touch the other seven `status: 'complete'` sites —
  confirmed they never carry a pending future dose.)
- `src/components/RecCard.jsx`:
  - `STATUS_LABELS` (~L7-15): add `'on-track': "On Track - future dose(s) remain"`.
  - `isNeutral` (~L116): add `|| status === 'on-track'` (same treatment as `'complete'` — no
    brands section, same idle-state semantics).
  - `collapsible` (~L120) already reads `isNeutral && !boosterDueDate`; since this new status
    is only ever emitted alongside a `boosterDueDate`, no further change needed there — the
    card will stay expanded automatically, same as today.
  - `timingClass()` (~L107-112): unchanged — `status !== 'shared-decision'/'catchup'` and
    `dueToday` is falsy for this case, so it already falls through to `'timing-neutral'`
    (gray), which is correct per the existing B6 comment ("neutral gray, not amber").
- `src/App.css` ~L684: add `.status-badge.on-track { color: var(--gy3); }` (same neutral gray
  token as `.status-badge.complete`).
- **Test to update:** `src/logic/__tests__/regression-b6-booster-due-prominent.test.js` line
  21 — `expect(rec.status).toBe('complete')` → `expect(rec.status).toBe('on-track')`. Grep
  confirmed no other test file references `'Booster due at 16y'` or asserts on this specific
  status value.

## Why this is a good stopping point

All four items are fully scoped with exact file/line anchors and owner-approved wording —
nothing here requires another design conversation, only implementation. They're independent
of each other (can be built/committed in any order or combined) and none touch the §2-§5 code
that shipped earlier today. The suite is green and nothing is mid-edit.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm `main` clean and in sync with
   `origin/main`. `npx vitest run` — confirm **303 passing**.
2. Start the dev server (`preview_start` "MeningoVax dev server") before any work.
3. No further owner decisions needed — build in whatever order is convenient. Suggested
   order (smallest/most isolated first): Item 1 (legend text) → Item 4 (on-track status) →
   Item 3 (interval text cleanup) → Item 2 (edit button — the most code, touches state flow).
4. Per-item workflow: failing test first (both logic + UI layers per `docs/agent/testing.md`
   where the change is visible) → fix → full suite green → live-verify in the running app →
   one commit per item, named by item number/description.
5. Ship: MeningoVax `main` is UNPROTECTED but the owner prefers branch → PR → squash-merge —
   ask before pushing.
6. Do NOT start any PneumoVax/vaxapp port of these changes — owner wants a batched,
   comprehensive review across apps later, not a piecemeal port (see scope note above).
