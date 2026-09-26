# MeningoVax — Handoff after K1 of the keyboard queue (2026-09-25)

**SUPERSEDED 2026-09-26 — see `handoff-2026-09-26-k3-k7-keyboard-queue-done.md`.** K2-K7,
which this file described as remaining, are now all done, merged, and deployed. Do not
resume work from this file.

Repo: `~/Downloads/MeningoVax-main`. Live at https://jojohuhu-git.github.io/MeningoVax/

Branch: `main`, clean, in sync with `origin/main` at `6b37c4a`.
Baseline at the start of this work was 1,583 passing tests (133 files); now
**1,614 passing (135 files)**, all green. PR #66 squash-merged; the "Tests" and
"Deploy to GitHub Pages" workflows on `main` both finished **success**, and the tick
was confirmed rendering on the live site.

Queue this came from: `.claude/prompts/fix-2026-09-24-keyboard-tab-and-enter.md`
(local only — `.claude/` is gitignored). Its header now records K1 as done.

## What's done

1. **K1 — a row nobody filled in is not a dose.** Commit `6b37c4a` (PR #66).
   Clicking "+ Add dose" and typing nothing used to put a dose of unknown date into the
   record; measured, one empty row moved a healthy 16-year-old's MenACWY card from
   catch-up to booster-due. Shipped as four things:
   - `isBlankDoseRow()` / `dropBlankDoseRows()` in `src/logic/doseIdentity.js`, applied at
     the single engine chokepoint `src/logic/validate.js` (`analyzeHistory`).
   - A sweep of **every** blank row (not just a trailing one) when leaving a history step
     (`src/App.jsx`) and when the Results "Recorded doses" panel closes
     (`src/components/Results.jsx`). Never while the user is still in the list.
   - The "Recorded doses (N)" counter counts doses, not rows.
   - Tests both layers: `src/logic/__tests__/regression-k1-blank-row-is-not-a-dose.test.js`
     and `src/components/__tests__/regression-k1-blank-row-is-not-a-dose-ui.test.jsx`.
     Each new test was confirmed failing before the fix.

2. **An owner decision taken mid-item, and it changed K1's shape.** The plan assumed an
   empty row always means "I haven't typed yet". It does not — both fields are optional, so
   an empty row equally means *"this patient had a dose, I have no card, I don't know when
   or which"*, which is a real entry the undated-dose rules (G6, G8, dateless minimum-age,
   the risk-at-dose prompt) are built on. 28 existing tests said so. The owner chose to make
   the meaning explicit: an otherwise-empty row now shows a tick, **"A dose was given, but
   the date and brand are unknown"**, setting `detailsUnknown: true`. Ticked rows count and
   behave exactly as undated doses always did. Documented in
   `docs/agent/clinical-rules.md` → "How an Undated Dose Gets Onto the Record (K1)".
   Existing fixtures that used `{}` or `{date:'',brand:''}` to mean "an undated dose" now
   carry the tick, which is what they always meant.

3. **`docs/agent/testing.md` counts refreshed** (135 files / 1,614 tests / 552 suites,
   measured 2026-09-24), so the counts tripwire passes.

## What's NOT done — the remaining queue

From `.claude/prompts/fix-2026-09-24-keyboard-tab-and-enter.md`, untouched:

- **K2** — Enter presses the button you are on. Delete the whole-page Enter listener
  (`App.jsx:96-108`); wrap each step plus the Back/Next bar in a real `<form>` with Next as
  `type="submit"` and `type="button"` on the other eight buttons. The structural fix.
- **K3** — delete the three Ctrl/Cmd shortcuts (A/Y/E) and their on-screen hints, plus the
  now-dead `activeDoseSection` / `onFocusCapture` plumbing. Six existing tests use
  `getByTitle('Add dose (Ctrl/Cmd+A)')` and must be re-pointed, not just deleted.
- **K4** — cursor lands in the first field when a step opens (owner: always, phones too).
- **K5** — a visible `:focus-visible` ring; bring `.dose-field input:focus` up to match
  `.age-field input:focus`.
- **K6** — Enter in a filled dose row gives the next row; Enter on an empty row means done.
  **Depends on K1 (done) and K2.**
- **K7** — Escape closes the two Results panels. P2, optional, raise only if asked.

Raised by K1, deliberately out of scope (owner: MeningoVax only):
- **vaxapp and PneumoVax almost certainly have the same empty-row behaviour.** Each needs
  its own item in its own repo — do not fold into this queue.
- If PneumoVax gains the same tick, reuse this copy and the `.dose-row-unknown` treatment
  (design-parity rule: MeningoVax → PneumoVax).

## Why this is a good stopping point

K1 was the one item with a measured effect on the recommendation, it is independent of the
keyboard work proper, and it had to land before K6 anyway. Everything is merged, deployed
and green; nothing is half-applied and no branch is left open.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. Run `npm test` — confirm **1,614 passing (135 files)** before any new work.
3. **One 10-second check only the owner can do, needed for K2:** on the MenACWY step, tab
   onto "No previous doses" and press Enter. Does it answer "no", skip to the next step, or
   both? Browser automation cannot press Enter the way a finger does; the planning session
   tried and the control run failed too, so the result was inconclusive. Record the answer
   in the queue file. It does not change the plan — the behaviour is wrong either way.
4. Per item: reproduce → failing test (confirm it fails) → smallest fix → full suite green →
   drive the running app and look → commit named by item ID. One commit per item.
5. Push policy: `main` is not protected here, but the established habit is branch → PR →
   `gh pr merge --squash`, then confirm the Pages deploy. Ask before merging.
6. Environment trap seen twice now: several MeningoVax dev servers running at once from
   different chats corrupt the shared `node_modules/.vite` cache and every one of them then
   serves a blank page with "more than one copy of React". Close stale sessions or clear the
   cache before trusting a live check.
