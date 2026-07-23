# MeningoVax — Handoff after recorded-dose UX five-item queue (2026-07-23)

Supersedes: `docs/archive/plan-2026-07-23-recorded-dose-ux-five-items.md` (now DONE —
all five items shipped this session; that plan doc is historical record only, do not
resume work from it).

Branch: `main`, 3 commits ahead of `origin/main`. **NOT pushed** — MeningoVax's `main` is
unprotected so a direct push is allowed by the `ship` skill's table, but pushing/publishing
still requires the owner's explicit go-ahead per the session's safety rules, and that
wasn't given this session.

Baseline was 260 passing tests; now **275 passing (18 files)**, all green, working tree
clean at commit `5a0510b`.

## What's done (by item ID, from the source plan)

1. **Item 5** (unify dose editors) — extracted [`DoseEditor.jsx`](../../src/components/DoseEditor.jsx), used by both [`StepHistory.jsx`](../../src/components/StepHistory.jsx) and [`Results.jsx`](../../src/components/Results.jsx). MenB family-lock guidance now renders in both surfaces (previously Results-only editor lacked it). Commit `598be71`.
2. **Item 1** (auto-focus new dose row) — lands once in `DoseEditor.jsx`'s `useEffect` keyed on `doses.length`; focuses the last row's date input only when a row was added. Commit `598be71`.
3. **Item 3** (audit-list dose↔badge alignment) — `analyzeHistory()` in [`validate.js`](../../src/logic/validate.js) now also returns `sortedDoses`; `Results.jsx` passes that (not raw entry-order `menacwyDoses`/`menbDoses`) to `RecCard`, so a dose row's validity chip always matches that dose's own date regardless of entry order. Commit `598be71`.
4. **Item 2** (de-amber booster banner) — `.booster-due-banner` in [`App.css`](../../src/App.css) is now neutral gray (`--gy6`/`--gy2`/`--gy5`), not amber. Both the booster banner and `.next-date` in [`RecCard.jsx`](../../src/components/RecCard.jsx) lead with "Not yet due — ...". Commit `16d0d51`.
5. **Item 4** (required vs optional in "due today") — `Results.jsx` computes `acwyRequiredToday`/`bRequiredToday` (`dueToday && status !== 'shared-decision'`) and drives the summary line, pentavalent header, and dual-due banner off them. `recommend.js`'s pentavalent `note` gets the same split. `RecCard.jsx`'s `'shared-decision'` badge label is now `'Optional (shared decision)'`. Owner decision preserved: `pentavalentEligible` still fires on SCDM (not gated to required-only) — verified live that Option 2 still renders. Commit `5a0510b`.

All five items were verified live in the running app (`preview_start` + `.claude/launch.json`, port 5175/5179), not just via the test suite — see each commit message for the specific scenario driven.

**PneumoVax parity** (required per the plan's "Cross-app parity" section):
- Item 2 + Item 4 wording ported to `~/Downloads/PneumoVax` on branch `parity/item2-item4-required-optional-wording` (commit `420f3c6`, NOT pushed, NOT PR'd — PneumoVax's `main` is protected, needs branch→PR→squash per `ship` skill). 135 tests passing there (was 133).
- Item 5 (shared `DoseEditor`) explicitly **not** ported: PneumoVax's `StepHistory`/`Results` dose editors are structurally duplicated the same way MeningoVax's were, but neither renders any per-brand computed safety guidance (no antigen-family-lock equivalent) that could silently drift — verified by reading both files. No functional bug exists there to fix by unifying them, so it was left alone rather than doing a cosmetic-only refactor out of scope.

## What's NOT done

- **Push/PR for either repo.** Both branches are local-only, waiting on explicit owner go-ahead:
  - MeningoVax: `git push` (direct push allowed, main unprotected) then confirm the GitHub Pages deploy workflow.
  - PneumoVax: `gh pr create` on `parity/item2-item4-required-optional-wording`, wait for the `test` check, `gh pr merge --squash`.
- Nothing else from the five-item plan remains — all items done, no partial items.
- The plan's "Parked" list (#2 status-announced-3-4x, #3 scattered actions, #4 opt-in color key, #5 a11y label/checkbox nesting) is still **not approved** — do not start without a new go-ahead.

## Why this is a good stopping point

All five items are independently complete, tested (unit + live-verified), and committed as separable units — nothing is mid-flight. The PneumoVax parity pass is also complete and isolated on its own branch. The only remaining step is a publish decision (push/PR) that requires the owner's explicit sign-off per this session's operating rules, not more coding.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git status` — confirm clean, 3 commits ahead of `origin/main`, run `npm test` — confirm **275 passing**.
2. Ask the owner: push MeningoVax's `main` now? (Direct push is this repo's normal flow, no PR needed.)
3. `cd ~/Downloads/PneumoVax && git status` — confirm on `parity/item2-item4-required-optional-wording`, run `npm test` — confirm **135 passing**.
4. Ask the owner: open the PneumoVax PR now?
5. If the owner wants further UX work, the "Parked" list above is the next candidate queue — but it needs a fresh go-ahead, not automatic pickup.
