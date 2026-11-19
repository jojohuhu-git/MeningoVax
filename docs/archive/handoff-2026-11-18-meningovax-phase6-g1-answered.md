# MeningoVax port — Handoff after STOP G1 (Phase 6.1) was answered (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 6"). **Supersedes**
`handoff-2026-11-18-meningovax-phase5-closed.md` (same session, same PR).

## State (verified 2026-11-18)

- `main` at `9331624` (PR #105 merged): **2,117 passed, 0 failing (168 files)**.
- Branch `docs/2026-11-18-phase5-closed`, **PR #106** open against `main`, docs only. It holds:
  Phase 5 close-out (A17), the STOP G1 packet with the owner's answers, the decision log, the plan
  and the `CLAUDE.md` status line. No code, test or saved answer changed. Owner merges.

## What's done

1. **Phase 5 closed** (A17, owner 2026-11-18). See the plan's A17 row.
2. **STOP G1 asked and answered** (`docs/archive/stop-g1-packet-2026-11-18.md`, "Answers"; short
   form in `decisions-2026-11-17-open-questions.md`, last section). All seven as recommended:
   - **G1-a**: PneumoVax's 10 style rules (§M-L3) for every dose line, card lead and "Why this".
   - **G1-b**: a "Why this" fold-out under each recorded dose, as PneumoVax's `DoseValidation`
     (`dose-val-toggle`; `whys` + `detail` behind it).
   - **F-3**: badge: dated booster → "Future booster needed"; dated non-booster dose → "Next dose
     not yet due"; "Up to date" only when nothing is left (`statusPillLabel` in `RecCard.jsx`).
   - **F-5**: "Booster (16y)" replaces "Booster due at 16y" (Phase 4 label list in
     `docs/agent/clinical-rules.md` must change too).
   - **R-A / R-B / R-C**: undated "Not counted — repeat" lines gain an ending (sentences in the
     packet, each matched to a quote read live 2026-11-18). R-C (healthy child, too-young MenB)
     drops "repeat this dose".
3. Measured on `main` before asking (the packet's tables): 108 / 64 / 72 kinds of dose line / lead /
   "Why this"; "~" in 26,586 dose-line showings; 6,536 "Up to date" badges (4,158 dated booster,
   474 dated dose, 1,904 nothing left); 1,452 + 306 for F-5; 574 / 588 / 822 / 281 repeat lines.
   One correction made before asking: the too-young MenB family is 17 variants, 3,990 patients
   (first draft said 5 / 4,508, a sum that double-counted).

## What's NOT done

**Owner action first:** review and merge PR #106.

**Not started: building Phase 6.2.** Suggested order, one PR per item, each measured:
1. F-3 badge (component only; smallest).
2. F-5 label (engine label + label list doc + tests asserting the old string).
3. R-A / R-B / R-C endings (`recommend.js`, beside `datedRepeatLines`; needs to know which group
   a card is: A = MenB `Not yet age-eligible` with a risk; B = MenACWY `Not yet due`; C = MenB
   `Not routinely indicated`, healthy). Then **ask R-C's chip** ("Not counted — repeat" vs "— do not
   repeat"), measured first.
4. G1-b dose-line fold-out (port PneumoVax's `DoseValidation` disclosure; `proseDiff`
   still opens every disclosure through `OpenAllDisclosures`).
5. G1-a rewrite of every line and paragraph, with a machine guard like PneumoVax's
   `regression-why-this-2026-11-08-card-paragraphs-follow-the-style-rules.test.js`
   (no "~", no semicolon, ≤1 dash per sentence, word ceiling). Every before/after in the PR body.
   L1 also fixes "recommended at 16–23" (its own quote says shared clinical decision-making).

**Then 6.3:** Q10, fold the result page; ask again (her 2026-11-06 answer was "PneumoVax only").

**Carried over (not fixed):** MenB booster note "1 year after the primary series" on later
boosters; MenB "every 2–3 years" advises 2; whole-app check 5's remaining 2,437 / 20 (partly a
checker gap, `asksOn` doesn't know Q11); whole-app check 7 typical 234 → 228 hidden by F-2's
13-year checkpoint; Phase 4 A2 colours, A10, A11, A16; CDC 2024-0069, 2024-0034/0035, 2024-0040
(shared `dateUtils.js`, change both repos).

**Design parity:** G1-b and the style rules bring MeningoVax to PneumoVax, so no PneumoVax change
is expected. Check this with the `design-review` skill once built.

## Why this is a good stopping point

Every Phase 6.1 decision is answered and recorded, nothing is half-built, and each Phase 6.2 item
above can land as its own PR.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 106`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,117 passed, 168 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Re-create the scratch measurers if needed (render `Results` per grid case with
   `renderScreen` from `scripts/proseDiff.mjs`, parse with `happy-dom`; import with `VITEST=1`
   set, or the script's command line runs).
4. Per item: prototype → measure (`npm run sweep:update`, `npm run prose -- dump/diff`, whole-app
   checks, card-change count) → failing test → change → docs in the same commit → live check
   (screenshot) → PR against `main`; the owner merges. E4 checklist in each PR body.
