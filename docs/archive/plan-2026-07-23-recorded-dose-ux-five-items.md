# Plan — MeningoVax recorded-dose UX, five items (2026-07-23)

**SUPERSEDED — all five items DONE.** See
`docs/archive/handoff-2026-07-23-recorded-dose-ux-five-items-done.md` for the completed
state (275 tests passing, commits, PneumoVax parity). This file is kept as historical
planning record only — do not resume work from it.

**Status:** planning complete, nothing implemented. Ready for a fresh implementation
session. Items 1–4 verified against current `main` (last commit `1043391`); item 5 added
after a usability review the same day. Owner decisions locked (see each item). Execute with
the `fix-queue` skill — one item, one commit — and the `ship` skill for the MeningoVax
merge rules.

## What this covers

Five recorded-dose/recommendation-card UX fixes the owner requested. None change the
clinical engine — items 1, 2, 4 are display/copy only; item 3 fixes a display-alignment
bug (the engine already sorts correctly); item 5 unifies two duplicate dose editors (UI
refactor, no engine change). No `verify-clinical-source` step is required.

## Cross-app parity (do not skip)

Per the `design-review` skill's 2026-07-17 parity mapping, **design-system and copy
changes made in MeningoVax must also be applied to PneumoVax** (same design system).
These cross that line and must flow to PneumoVax in the same session (or be recorded as an
explicit follow-up if the equivalent surface doesn't exist there):
- Item 2's not-yet-due wording + booster-banner de-amber (copy only — **no color token**,
  the earlier teal idea was dropped; see Item 2).
- Item 4's `'Optional (shared decision)'` badge label.
- Item 4's summary/banner wording that separates required from optional.
- Item 5's shared dose-editor component **only if** PneumoVax has the same duplicate-editor
  split; otherwise note it as not-applicable.

Check each against PneumoVax's `RecCard`/`Results` equivalents before closing the session.

---

## Item 1 — Auto-focus the date field on a newly added dose row

**Why:** adding a dose then hunting for the date input is friction; focus should land there.

**Two locations** (both append `{ date: '', brand: '' }`, so new rows are always empty —
a plain `.focus()` is enough; no `.select()` needed):
- `src/components/StepHistory.jsx` — `addDose()` (line 7) and the Ctrl/Cmd+A handler
  (lines 13–24). The `+ Add dose` button is at line 130.
- `src/components/Results.jsx` — the "Recorded doses" inline editor: `addAcwy()`/`addB()`
  (lines 71, 76) and that panel's own Ctrl/Cmd+A handler (see the `activeDoseSection`
  block starting ~line 92).

**Approach:** after the `onChange([...doses, …])` append, focus the last row's date
input. Since item 3 keeps edit panels in **entry order** (decision below), the new row is
always the last one — no identity tracking needed. Use a ref to the dose-list container
and focus the last `input[type=date]` after render (e.g. a `useEffect` keyed on
`doses.length`, or a ref callback on the last row). Do not auto-focus on initial mount or
on remove — only on add.

**Tests (both layers per CLAUDE.md):** UI rendering test (happy-dom) — click `+ Add dose`
in StepHistory, assert the new row's date input is `document.activeElement`; repeat for the
Results editor. No logic-layer test needed (no logic change).

---

## Item 2 — Make purely-future due dates read as "scheduled later," not "act now"

**Owner decision (SUPERSEDED 2026-07-23):** the earlier pick was "teal accent + legend
entry." After review, the owner reversed it — **no new color, no new legend row.** Reason:
the app deliberately keeps teal (`--c`) status-neutral (it's the pentavalent card / age
chip / button accent; `App.css:628` even notes due cards use green "NOT teal, so due cards
don't visually merge with the teal pentavalent card"). Making teal *also* mean "future,
on track" overloads the one color kept neutral and risks reading as related to the
adjacent pentavalent option. If a color needs the opt-in "Color key" to be understood, it
isn't pulling its weight. So the fix is **word-cue + de-amber, staying neutral gray.**

**Why (the real problem):** two elements mis-signal future-only dates:
- `.booster-due-banner` "Booster still due…" (`RecCard.jsx:145-149`) wears the **amber
  catch-up palette** (`--a`/`--alt`/`--amd`, `App.css:767-777`). Amber = "behind schedule,
  act now" — a false alarm for a date that isn't due yet. This is the actual bug.
- `.next-date` "Eligible {date}" (`RecCard.jsx:151-155`) is plain gray and easy to miss,
  but its neutrality is *correct* — it just needs clearer words.

**Approach (copy + de-amber, no new color):**
- `.booster-due-banner`: **remove the amber tokens** (`--a`/`--alt`/`--amd`) → neutral
  gray (e.g. `--gy6` bg / `--gy2` text / `--gy5` border) so it stops reading as "act now."
  Keep the bold weight so it's still emphasized (a booster IS coming, just later). Update
  the `App.css:764-766` comment (currently "Amber like catch-up") to explain the neutral
  choice. Reword to lead with the not-yet: e.g. "Not yet due — booster ~ {date}".
- `.next-date`: keep neutral gray; strengthen the wording so "future, on track" is explicit
  rather than implied: e.g. "Not yet due — eligible {date}" (replacing bare "Eligible
  {date}"). Optionally a hair more prominent (weight/size), no color.

**No legend change** (nothing new to decode). **No new CSS color token.**

**Parity:** apply the **copy** change (not-yet-due wording) and the booster-banner de-amber
to PneumoVax. No color token to port.

**Tests:** UI rendering test — a "complete + boosterDueDate" rec renders the banner with
**neutral** classes, NOT `--a`/`--alt`/`--amd`, and its text matches /not yet due/i; a rec
with a future `earliestNextDate` renders `.next-date` text matching /not yet due/i.
**Verify live** (`preview_start`): screenshot in light and dark; confirm the booster banner
no longer looks like the amber catch-up state and the future date reads as "later."

---

## Item 3 — Fix the dose ↔ validity-badge misalignment (audit list only)

**Owner decision:** fix the read-only audit list only; leave edit panels in entry order.

**The bug (confirmed):** commit `b689af6` made `analyzeHistory()` sort doses internally,
so its returned `perDose` is in **chronological** order (`validate.js:629`,
`sortDosesChronologically`). But `Results.jsx:306/320` passes the **raw entry-order**
`menacwyDoses`/`menbDoses` as the `doses` prop, and `RecCard.jsx:163-165` zips
`doses[i]` against `doseValidations[i]` by array index. When entry order ≠ chronological
order, a dose row's text describes one dose while its validity chip belongs to another.

**Approach (minimal, no editor reordering):** make the `doses` prop RecCard renders match
the order `perDose` is in, so index-zipping is correct again. Cleanest options:
- Export `sortDosesChronologically` from `validate.js` and sort the `doses` prop in
  `Results.jsx` with the same comparator before passing it to RecCard; **or**
- Have `analyzeHistory()` also return the sorted dose array (e.g. `sortedDoses`) alongside
  `perDose`/`effective`, and pass that to RecCard.

Prefer the second (single source of truth — the display list and its badges come from one
call and can't drift). Either way: **do not** change the editable lists in StepHistory or
the Results editor — they stay in entry order so newly added rows appear at the bottom
(this is what makes item 1's "focus the last row" safe and avoids rows jumping around).

**Tests (both layers):**
- Logic (node): assert `analyzeHistory` returns doses and `perDose` in the same
  (chronological) order for an out-of-order input (if adding `sortedDoses`, test it).
- UI (happy-dom): render RecCard with doses entered out of chronological order; assert the
  validity chip shown on each dose row matches that dose's actual date — i.e. the earliest
  dose's row shows the "Effective dose 1" / on-time chip, not a later dose's chip. This is
  the regression guard for the reported bug.

**Verify live:** enter two MenACWY doses out of date order in the app; confirm each
"Recorded:" row's badge tracks its own dose.

---

## Item 4 — Separate required from optional in the "Due today" copy

**Owner decision:** rename the badge to `'Optional (shared decision)'`; rewrite the four
strings so optional recs aren't announced as flatly "due" — including the one-line
pentavalent header above both cards, which must never say two vaccines are due when MenB
is only SCDM.

**The bug (confirmed):** the healthy 16–23y MenB rec has `status: 'shared-decision'` **and**
`dueToday: true` (`recommend.js:483`). `Results.jsx:42` computes
`bDueToday = menb.some(r => r.dueToday)`, so it's `true` for an optional rec, and the
summary says "Due today: MenACWY and MenB" even when MenB is only shared-decision.

**Approach (UI only — read `rec.status`, no engine change):** compute required-vs-optional
per vaccine by checking whether the due rec's `status === 'shared-decision'`. A vaccine is
"required/due" only if it has a due rec that is **not** shared-decision; otherwise it's
"optional." Introduce an explicit flag (e.g. `acwyRequiredToday` / `bRequiredToday` =
`dueToday && status !== 'shared-decision'`) and drive the wording off it. Then rewrite the
**four** places that currently assert MenB is "due" when it's only SCDM:
1. The summary line (`Results.jsx:46-57`) — e.g. "Due today: MenACWY. MenB is optional
   (shared clinical decision)." Cover all combinations (both required, one required one
   optional, both optional, none). Keep the pentavalent sub-clause only when MenB is a
   required due dose, not an optional one.
2. The "both due today" dual-due banner (`Results.jsx:293-296`, "…Both are due today…").
3. **The pentavalent header (`Results.jsx:277-281`, `dose-options-header`: "Both MenACWY
   and MenB are due today: two ways to give them").** This is the one-line header above
   both vaccine cards. Owner requirement (2026-07-23): **it must NOT say two vaccines are
   due when MenB is only SCDM.** Reword to something like "MenACWY is due today. MenB is
   optional (shared clinical decision) — if you choose to give it, these are the two ways
   to give both." (Wording final in-app.)
4. The pentavalent `note` (`recommend.js:575`) — first sentence currently reads "Both
   MenACWY and MenB are due today." Same required/optional rewrite.

**Owner decision (2026-07-23): keep the pentavalent option available in the SCDM case —
do NOT gate `pentavalentEligible` (`recommend.js:568`) on non-SCDM.** The combined shot is
clinically supported when MenB is started under shared decision-making (see the note at
`recommend.js:347`); only the *wording* changes. So `pentavalentEligible` stays as-is (the
Option-1/Option-2 cards still render); the header/note/summary just stop claiming MenB is
"due." Note: because `pentavalentEligible` still uses `bDueToday` (which includes SCDM),
the option keeps appearing — that's intended.

**Badge label** (`RecCard.jsx:11`): `'shared-decision': 'Optional (shared decision)'`
(parenthetical form, matching the em-dash-removal copy convention). Update the matching
legend row (`Results.jsx:260`, currently "Shared decision: optional…") so the badge and
legend agree.

**Parity:** apply the badge label + the required/optional wording split to PneumoVax.

**Tests (both layers):**
- Logic/UI (happy-dom): a patient whose only MenB rec is `shared-decision` + `dueToday`
  and who has a real MenACWY due dose renders a summary that does **not** say "Due today:
  MenACWY and MenB" and marks MenB as optional. Add a case where both sides are optional.
- **Pentavalent header regression:** in that same MenACWY-due + MenB-SCDM case, assert the
  `dose-options-header` text does **not** say both are due (does not match /both.*due/i),
  while asserting the pentavalent option cards still render (option is preserved).
- Assert the badge renders `Optional (shared decision)`.

---

## Item 5 — Unify the two duplicate dose editors (they have drifted)

**Owner decision (2026-07-23):** unify them, per the usability-review suggestion.

**The problem (confirmed):** dose history is edited in **two** near-duplicate UIs:
- `StepHistory.jsx` — the wizard steps (MenACWY step 2, MenB step 3).
- `Results.jsx:186-251` — the "Recorded doses" inline editor panel.

They render the same date+brand+remove rows but have **already diverged**, and the
divergence is clinically material: `StepHistory` shows the **MenB family-lock guidance**
("Family locked: MenB-4C — continue with Bexsero or Penmenvy", `StepHistory.jsx:44-52,
119-127`) and the "brand unknown → both families still open" note; the Results editor shows
**neither** (verified: `grep menbFamily src/components/Results.jsx` → 0 matches). So a
clinician who edits a MenB brand from the Results panel loses the guidance that prevents
mixing incompatible MenB antigen families. Because the logic is copy-pasted in two places,
it will keep drifting.

**Approach:** extract one shared presentational component — e.g. `DoseEditor` (a labelled
list of dose rows + "Add dose" control) or at minimum a shared `MenbFamilyNote` — and have
**both** `StepHistory` and the Results panel render it. Move the MenB family-lock detection
(`menbFamily`, `familyLabel`, the two family notes) into that shared component so it appears
in both surfaces automatically. Keep each surface's own `onChange` wiring; only the row/note
rendering is shared. This also removes the need to apply items 1 and 3's behaviour twice —
do them once in the shared component.

**Sequencing note:** land item 5 **before** items 1 and 3 if practical, so auto-focus
(item 1) and the entry-order rule (item 3) are implemented once in the shared editor rather
than twice. If item 5 slips, items 1/3 must be applied to both editors by hand.

**Scope guard:** this is a UI de-duplication, **not** a redesign. Do not merge the wizard
steps and the Results panel into one place, do not change the wizard flow — just share the
row/note rendering. The `Edit history` (jump to wizard) vs `Recorded doses` (inline)
navigation redundancy noted in review is **out of scope** here (parked below).

**Tests (both layers):**
- UI (happy-dom): open the Results "Recorded doses" editor, set a MenB dose-1 brand to a
  4C brand (e.g. Bexsero), assert the family-lock note now renders in the Results panel
  (regression guard for the drift). Confirm the same note still renders in the wizard step.
- Assert both editors render identical row structure (shared component) — e.g. adding a row
  behaves the same in both.

**Verify live:** in the running app, record a MenB dose in the wizard, go to Results, open
"Recorded doses", change the brand — confirm the family guidance shows in both places.

## Parked (reviewed 2026-07-23, NOT approved for this plan)

From the usability review; noted so they aren't re-derived, but the owner has **not** greenlit
them — do not implement without a new go-ahead:
- **#2 status announced 3–4×:** whether the pentavalent header is even needed given the
  summary line already states due/optional. (Item 4 keeps + rewords it for now.)
- **#3 scattered actions:** "Edit history" (bottom, jumps to wizard) vs "Recorded doses"
  (top, inline) do overlapping jobs; top/bottom action split.
- **#4 opt-in "Color key":** reliance on a manually-opened legend to decode colors.
- **#5 a11y smell:** the "None of these risk factors apply" control is a `<label
  role="button">` wrapping a checkbox (nested interactive semantics).

## Definition of done (all five)

- Each item: reproduce → failing test → fix → **full suite green** (`npm test`, quote the
  real count) → live-verify in the running app → one commit per item (`fix-queue` skill).
- Both test layers where a UI change is visible (logic + happy-dom), per CLAUDE.md.
- PneumoVax parity applied (items 2, 4, and 5-if-applicable) or recorded as explicit
  follow-up with reason.
- Merge via the `ship` skill (MeningoVax rules). Note from memory: the MeningoVax folder is
  cloud-synced — watch for the reversion gotcha (`project_meningovax`).
- Suggested order: item 5 (shared editor) first, then 1 and 3 (once, in the shared editor),
  then 2 and 4 (copy). Not a hard requirement, but avoids double work.
- Not in scope: the "Parked" list above, and the broader UX-review pass. Those need a
  separate go-ahead.
