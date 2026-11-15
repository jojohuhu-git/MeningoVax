> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-09-24-keyboard-tab-and-enter.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# Fix queue — MeningoVax keyboard: Tab and Enter, nothing else (2026-09-24)

**Status: K1 DONE (2026-09-24, PR #66). K2 DONE (2026-09-25, PR #67, main `49d9753`,
1,620 tests / 135 files, deployed). K3, K4, K5, K6 DONE (2026-09-26, branch
`fix/keyboard-k3-k6`, commits `4efbed1`/`d9c25ef`/`60aa8d1`/`0f13a80`, 1,629 tests /
135 files, not yet merged as of this line — see PR below). K7 (Escape closes the two
Results panels) deferred by owner decision (2026-09-26): P2, optional, skipped this
round.** Owner decisions taken in the planning session are recorded below and are
settled — apply them, do not re-open them.

**K1 as shipped differs from K1 as planned, by owner decision taken mid-item.** The plan
assumed an empty row always means "I haven't typed yet". It does not: a dose row has two
optional fields, so an empty row equally means "this patient had a dose, I have no card,
I don't know when or which" — a real entry the app supports, and the one the whole
undated-dose rule family (G6, G8, the dateless minimum-age rules, the risk-at-dose
prompt) is built on. Filtering it out silently deleted that entry: 28 existing tests said
so. The owner chose to **make the meaning explicit** rather than drop either reading. An
otherwise-empty row now shows a tick, "A dose was given, but the date and brand are
unknown", which sets `detailsUnknown: true`; that row counts, and a row without the tick
does not. Everything else in K1 shipped as written (the sweep, the engine filter, the
counter). See `docs/agent/clinical-rules.md`, "How an Undated Dose Gets Onto the Record".

**Follow-ups this raised (not in scope here):**
- vaxapp and PneumoVax: check whether an empty dose row counts as a dose there too. Both
  are out of scope for this queue by owner decision — open a separate item per repo.
- PneumoVax design parity: if it gains the same tick, use the same copy and the same
  `.dose-row-unknown` treatment.

**Baseline (measured, not remembered):** branch `main` @ `75ad6b0`, working tree clean,
**1,583 tests passing (133 files)**, `npm test` run 2026-09-24.

**Gating rules (CLAUDE.md / global standards):**
- No clinical rule changes here. K1 changes *what counts as a recorded dose*, which is a
  data-hygiene fix, not a schedule change — no `verify-clinical-source` run is needed, and
  none of the recommendation logic in `recommend.js` is touched.
- Both test layers for anything visible: logic (node) + UI (happy-dom).
- Ship via the `ship` skill (MeningoVax: branch → PR → squash-merge; `main` is protected).
- One item at a time, one commit per item ID, full suite green between items.
- **vaxapp and PneumoVax are out of scope**, by owner instruction. See "Cross-repo" at the end.

---

## The problem, in one paragraph

MeningoVax has four keyboard rules bolted on at different times: **Enter** advances the
wizard, and **Ctrl/Cmd+A**, **Ctrl/Cmd+Y** and **Ctrl/Cmd+E** add a dose row, answer "yes"
and answer "no". Three of the four need a modifier key that is spelled differently on a Mac
and a PC, which is clutter the owner does not want. But the modifier shortcuts are a symptom,
not the disease: they exist because **Enter was already taken**. The Enter rule is a listener
on the whole page that fires no matter what you have tabbed onto, so every button in the
wizard is a trap — tab to "No previous doses" and press Enter and you get sent to the next
step instead. Fixing that one thing makes all three modifier shortcuts unnecessary.

## The target behaviour

Three keys, identical on every computer, none of them invented by us:

- **Tab** — move to the next thing.
- **Enter** — press the button I am on; or, if I am in a field, continue to the next step.
- **Space** — tick a checkbox.

---

## Evidence gathered in the planning session

### The Enter listener fires regardless of focus — read from the code
`src/App.jsx:96-108`. A `keydown` listener on `document`, registered for every step below
Results. It bails out only for `TEXTAREA` and `<input type="text">` (of which this app has
none), then calls `e.preventDefault()` and `goNext()`. Nothing about the focused element is
consulted, so `goNext()` runs on **every** Enter press in steps 0–3.

**Not proven, needs a human 10-second check:** whether the focused button *also* fires. The
DOM rule says `preventDefault()` on `keydown` cancels a button's Enter activation, but this
could not be demonstrated in the running app — the browser automation cannot press Enter the
way a finger does (a control run with `preventDefault` removed *also* failed to activate the
button, so the test was inconclusive, not confirmatory). It does not change the plan: whether
Enter presses the button *and* skips the step, or just skips the step, the behaviour is wrong.
Do the check once a working dev server is up and record the answer here.

### Blank dose rows count as doses — measured
`src/logic/validate.js:1271` filters out only `null`/`undefined`, so a row the user added and
never filled in (`{date:'', brand:''}`) reaches the walk and is recorded as a dose of unknown
date (`validate.js:31` — "Unknown (no date) → COUNTS"). Real output from
`analyzeHistory('MenACWY', doses, 14*12, [], '2026-09-24')`:

```
no rows        | counted: 0 | statuses: []
one BLANK row  | counted: 1 | statuses: ["unknown"]
two BLANK rows | counted: 2 | statuses: ["unknown","unknown"]
```

Visible effect, measured via `recommend()` for a 16-year-old with no history: adding one
blank row changes the MenACWY card's status from `catchup` to `due`.

**Severity, honestly:** this is not an emergency. Two attempts to make a blank row hide a
needed dose both failed, because the G8 rule (`validate.js:1275-1290`) already refuses to let
an undated row take a dated dose's place — a 17-year-old with one dose at age 11 plus a blank
row still got their 16-year booster. But a row nobody filled in must not count as an
injection, and K6 cannot ship until it doesn't.

### Eight buttons have no explicit `type`
`App.jsx:184,189` · `StepAge.jsx:85,92` · `StepHistory.jsx:65,72` · `DoseEditor.jsx:137,176`.
Harmless today (there is no `<form>`), but a `<button>` inside a form defaults to **submit**,
so K2 must set `type="button"` on all eight or they will each advance the wizard.

### Nothing intercepts Tab
Checked: no `Tab` key handling and no `tabIndex` overrides anywhere in `src/`. Tab order
already follows the page — fields, then Back, then Next. This is the one part that is already
right, and no item below should disturb it.

### Focus is only visible on some controls
`App.css` has exactly two focus rules (`:363` age fields, `:525` dose fields) and **no
`:focus-visible` rule at all**. Buttons, checkboxes and citation links fall back to whatever
the browser draws by default, which differs between Chrome, Safari and Firefox. Tabbing is
hard to follow when you cannot reliably see where you are.

---

## Owner decisions (settled 2026-09-24 — apply, do not re-litigate)

1. **Delete all three Ctrl/Cmd shortcuts**, and take their on-screen hints off the page.
2. **The cursor lands in the first field when a step opens** — always, including on phones.
3. **Dose rhythm: a filled row plus Enter gives you a new row; an empty row plus Enter means
   you are done and moves on.**
4. **The blank-row fix is its own item, shipped first**, with its own test and its own commit.
5. **MeningoVax only.** vaxapp and PneumoVax are not touched.

---

# The queue

Work top to bottom. K1 must land before K6.

## K1 — A row nobody filled in is not a dose

**What is wrong:** see "Blank dose rows count as doses" above.

**The fix.** Add one shared predicate next to `newDoseRow()` in `src/logic/doseIdentity.js`:

```js
// A row the clinician added but never filled in. Not a dose: it records
// nothing about an injection, so it must not be counted as one.
export function isBlankDoseRow(d) {
  return !d || (!d.date && !d.brand);
}
```

Apply it at the single chokepoint every surface already shares —
`validate.js:1271`'s `.filter(Boolean)` becomes `.filter(d => !isBlankDoseRow(d))`.

**Deliberately NOT dropped:** a row with a brand and no date. That is a real injection whose
date the clinician does not have, and the engine already handles it correctly. Only a
*completely* untouched row is ignored.

**Two moments, both needed** (owner refinement, 2026-09-24 — she asked "shouldn't a blank row
just be cleared?", and the answer is yes *and* the engine must still ignore them):

**(a) Sweep blank rows when the user leaves.** Drop **every** blank row — not just a trailing
one — on leaving a history step (Next, Back or View Results), and when the Results "Recorded
doses" panel is closed. Add three rows, fill in two, and the empty one in the middle goes too.
A row nobody filled in must not follow the patient to the results.

**(b) The engine ignores blank rows regardless.** The sweep alone is NOT enough, and this is
the case that proves it: the Results "Recorded doses" panel recalculates the recommendation
live on every keystroke (`Results.jsx:196` — `addAcwy()` pushes a `newDoseRow()` straight into
state, and `recommend()` re-runs on the next render). So the instant you click "+ Add MenB
dose" in that panel, a blank row is in the record and the answer on screen changes — before
you have typed anything, and with no "leaving the step" moment to sweep at. Measured: one
blank row moves a 16-year-old's MenACWY card from `catchup` to `due`. The filter at
`validate.js:1271` is what closes that window.

**What must NOT happen:** clearing a row the moment it reads as blank. Every new row starts
blank, so the row the user just asked for would disappear as it appeared. The sweep fires on
leaving the list, never while the user is still in it.

**Also fix the counter:** `Results.jsx:263` — "Recorded doses (N)" adds the two array lengths
raw, so a blank row inflates N. Count non-blank rows.

**Verify across the surfaces that read recorded doses** (all four — state which, with
evidence, per CLAUDE.md): the wizard history steps, the Results "Recorded doses" panel, the
dose chips on each `RecCard`, and `recommend()` itself.

**Tests.**
- Logic (node): `analyzeHistory` with one blank row gives byte-identical output to no rows,
  for MenACWY and MenB. And `{brand:'bexsero', date:''}` still counts — the undated-but-real
  case must not regress.
- UI (happy-dom): add a dose row in `DoseEditor`, leave it untouched, assert the Results
  summary and the "Recorded doses" counter are unchanged from the no-rows case.
- UI (happy-dom), the sweep: add three rows, fill rows 1 and 3, leave row 2 empty, press Next
  — assert exactly two rows survive in state, in order.
- UI (happy-dom), the live-panel window: on Results, open "Recorded doses", click
  "+ Add MenACWY dose", type nothing — assert the summary line is identical to before the
  click. **This test fails today** and is the one that proves (b) is needed as well as (a).
- Sweep check: re-run `sweep-never-events` and `sweep-dose-counter`; both should be unchanged.

---

## K2 — Enter presses the button you are on

**The structural fix, not a guardrail.** Delete the whole-page Enter listener
(`App.jsx:96-108`) and let the browser do this natively:

1. Wrap each wizard step's card **and** the Back/Next bar in a single `<form>` whose
   `onSubmit` calls `goNext()` (and `preventDefault()`s the page reload).
2. Make **Next** `type="submit"`.
3. Set `type="button"` on all eight buttons listed above, plus Back.

Browsers have implemented "Enter in a form field submits the form" for thirty years. It is
identical on Mac and PC, needs no key names, and cannot fight the buttons, because a
`type="button"` button gets its own Enter press and never reaches the form.

**Why a form and not a smarter listener:** a listener that checks `document.activeElement`
and skips buttons would also work, but it is a guardrail around a problem rather than the
removal of it — and it would need a new exception every time a control is added. The form is
the version with no rules to remember.

**Watch for:** `<form>` inside `<main>` with the nav bar outside it. The Next button is
rendered in `App.jsx`'s `.app-nav`, *outside* `<main>`. Either move the `<form>` up to wrap
both, or give Next `form="<id>"` to associate it across the DOM. Wrapping is cleaner; check
`.app-nav`'s sticky-footer CSS still lays out with a `<form>` in the chain.

**Keep** the "or press Enter" hint beside Next — it is now telling the truth.

**Tests.** UI (happy-dom), one per trap, each of which fails today:
- Focus "No previous doses", press Enter → the step answers "no" and does **not** advance.
- Focus "+ Add dose", press Enter → a row appears and the step does **not** advance.
- Focus a dose row's "×", press Enter → the row goes and the step does **not** advance.
- Focus "Back", press Enter → goes back one step.
- Focus the Date-of-Birth / Years-Months toggle, press Enter → the mode switches.
- Focus the date-of-birth field, press Enter → advances to Risks (the existing behaviour,
  which must survive).

---

## K3 — Delete the three Ctrl/Cmd shortcuts

Once K2 lands these are dead weight. Remove:

- `StepHistory.jsx:12-22` — the Ctrl/Cmd+A listener.
- `StepHistory.jsx:29-43` — the Ctrl/Cmd+Y / Ctrl/Cmd+E listener.
- `StepHistory.jsx:68,75` — the two `shortcut-hint` spans reading "Ctrl/Cmd+E" and "Ctrl/Cmd+Y".
- `DoseEditor.jsx:179` — `title="Add dose (Ctrl/Cmd+A)"` → `title="Add dose"`.
- `DoseEditor.jsx:183` — the "Ctrl/Cmd+A" hint span.
- `Results.jsx:206-216` — the Ctrl/Cmd+A listener.

**Dead code that falls out with it:** `activeDoseSection` state in `Results.jsx` and the
`onFocusCapture` prop threaded into both `DoseEditor` calls (`Results.jsx:306,325`) exist
*only* to tell that shortcut which list to add to. Check nothing else reads them, then remove
the prop from `DoseEditor`'s signature too.

**Tests that must be rewritten, not just deleted** — these are the existing selectors that
will break:
- `App.test.jsx` lines ~226, 247, 297, 349, 390, 412 — six uses of
  `getByTitle('Add dose (Ctrl/Cmd+A)')`. Re-point at the new title or, better, at the button's
  accessible name.
- `App.test.jsx` ~312-354 — the Ctrl/Cmd+A describe block. Delete; K2's tests cover the ground.
- `StepHistory.test.jsx` ~19-43 — the whole Ctrl/Cmd+E describe block, including the assertion
  that the on-screen hint reads "Ctrl/Cmd+E". Replace with a Tab-and-Enter test.
- Keep `App.test.jsx:355-375` (Enter advances; Enter does nothing on Results) — still true.

**Add one guard test** so the shortcuts cannot creep back: assert no rendered text in the
wizard matches `/Ctrl|Cmd|Alt|⌘/`.

---

## K4 — The cursor lands in the first field when a step opens

**What is wrong:** after pressing Next, nothing is focused, so you must press Tab once before
you can type. That single stray keystroke is what makes people reach for the mouse.

**The fix.** One effect in `App.jsx` keyed on `state.step`: focus the first focusable control
inside `<main>`. Per step that means the date-of-birth field (Age), the first risk checkbox
(Risks), and the "No previous doses" button (both history steps).

**Owner decision: always, including on phones.** Note the trade-off in the code comment —
on a touch screen this opens the on-screen keyboard and hides part of the page. If that turns
out to be annoying in real use, the narrow-screen exception is a one-line change, but do not
pre-empt the decision.

**Do not focus anything on Results.** It is a page to read, and stealing focus would scroll it.

**Tests.** UI: advance each step and assert `document.activeElement` is the expected control.

---

## K5 — You can see where Tab has landed

**What is wrong:** no `:focus-visible` rule exists; only two `:focus` rules for fields.

**The fix.** One shared rule in `App.css`, matching the highlight the age field already uses,
applied to buttons, checkboxes, selects and citation links:

```css
:focus-visible { outline: 2px solid var(--c); outline-offset: 2px; border-radius: var(--rads); }
```

`:focus-visible` (not `:focus`) means the ring appears for keyboard users and stays out of the
way of mouse users. Use the existing tokens — **no hex literals**, per CLAUDE.md. Do not use
`border-radius: 999px`; pills are banned.

Also bring `.dose-field input:focus` (`:525`) up to match `.age-field input:focus` (`:363`) —
today the dose fields get only a border colour change while the age fields get a 3px halo,
which reads as two different apps.

**Tests.** CSS is not unit-testable here; verify by driving the running app and tabbing the
whole wizard end to end, and attach a screenshot showing the ring on a button.

---

## K6 — Enter in a filled dose row gives you the next row

**Depends on K1 and K2.** Do not start it before both have landed.

**The rule, stated the way it should be explained to a user:** *Enter finishes the row you
are in.*

- Row has something in it, and it is the last row → **add a new row**, cursor in its date box.
- Row has something in it, and there is a row after it → **move to the next row's date box.**
- Row is empty and it is the last row → **you are done; go to the next step.**

So recording three doses reads: type, Enter, type, Enter, type, Enter, Enter. The same key
throughout, and the last Enter — landing on an empty row — is what means "finished".

**The half-finished row must not become an escape hatch.** A row with a date but no brand is
"has something in it", so Enter gives you a new row as normal. Only a genuinely untouched row
advances the step.

**Implementation note:** this belongs on the dose row in `DoseEditor.jsx`, not on the form, and
it must call `preventDefault()` on the rows where it acts so the form does not submit
underneath it. `DoseEditor.jsx:70-77` already focuses the newest row's date input when the
list grows — reuse it, do not write a second copy.

**Tests.** UI (happy-dom): the full three-dose rhythm above, ending on the Results step with
exactly three recorded doses and no ghost fourth; plus Enter on a date-only row adding a row
rather than advancing.

---

## K7 — Escape closes the two Results panels (P2, optional)

"Adjust age" and "Recorded doses" (`Results.jsx:255-268`) open inline and can only be closed
by clicking their own button again. Escape should close whichever is open. Lower priority than
K1–K6 and fine to defer; raise it only if the owner asks.

---

# Environment note, not a code problem

At planning time **three** MeningoVax dev servers were running at once (ports 5179, 5180,
5181), started from other chat sessions. They share one Vite dependency cache and had
corrupted it — all three served a blank page with *"more than one copy of React"* in the
console. The repository is fine (`75ad6b0`, clean, 1,583 tests green). Before doing the
live-verification these items need, close the stale sessions or clear
`node_modules/.vite`, and confirm the app actually renders before trusting anything you see.

# Cross-repo

vaxapp (PediVax) and PneumoVax have their own keyboard behaviour and are **explicitly out of
scope**, by owner decision. K1's blank-row question is the one item likely to apply to vaxapp
as well — check it there in a separate session and open its own queue item if it does. Do not
fold it into this one.
