# MeningoVax — Handoff after the dose-counter audit queue (2026-09-15)

MeningoVax is the meningococcal-only advisor at `~/Downloads/MeningoVax-main`
(github.com/jojohuhu-git/MeningoVax, GitHub Pages under `/MeningoVax/`).

Branch: `dose-counter-audit-p0`, off `main` at `8632cb2`. **Pushed**;
**PR #17 open** (https://github.com/jojohuhu-git/MeningoVax/pull/17), not yet
merged — owner reviews PRs herself, which is the standing pattern here.

Baseline was 534 passing tests; now **682 passing (64 files)**, all green,
working tree clean at commit `33758b1`. Production build clean.

Source queue: [.claude/prompts/fix-2026-09-15-dose-counter-audit.md](../../.claude/prompts/fix-2026-09-15-dose-counter-audit.md).
**12 of its 13 items are done.** Only P2-3 remains, and it is a copy decision.

## What's done (by item ID)

Each item was reproduced first, given a failing test in BOTH layers (engine +
rendered component), fixed, and committed alone. For every item I verified the
new tests fail against the pre-fix source — none is a test that would have
passed anyway. Commit messages carry the verbatim clinical quotes and URLs.

1. **P0-1** `6f1ba6d` — an infant MenACWY series stays its own length after the
   2nd birthday. Two age gates asked today's age where the question is the age
   at dose 1: `recommend.js`'s only door into `menacwyInfantSeries()`, and
   `seriesTotals.js`'s `menacwySeriesInfo()`. 16 tests.
2. **P1-1** `053ff90` — the first-booster clock derives the end of the primary
   series from `seriesTotals.js` instead of the literal `given === 2`. No
   answer changes today (P0-1 routes infant-started patients away from that
   branch); it removes the trap. 9 tests.
3. **P1-2** `16fad99` — tests only, no source change. Pins the reported bug: a
   DOM-order test on the headings, plus a table-driven test that `recommend()`,
   `menacwySeriesInfo()` and `menacwyPrimaryTotal()` agree for six shapes of
   patient. 14 tests.
4. **P0-2** `2b7ab4e` — college/outbreak/military stop discarding a later dose
   and re-offering it. `hasBoosterPhase` for riskClass `'single'` is now true;
   routine MenACWY and healthy MenB keep the cap. Deterministic sweep: **385
   offending patients before, 0 after.** 19 tests.
5. **P0-3** `189a66b` — tests only. The infant-outbreak case where P0-1 and P0-2
   compounded; also asserts M12 (no standing outbreak countdown) survives. 12 tests.
6. **P0-4** `ea63101` — six calendar months IS "at least 6 months". New shared
   `addCalendarMonths()` / `calendarIntervalElapsed()` in `dateUtils.js`; four
   MenB rules moved onto them. **183 of 365 start dates in 2025 gave a false
   "given early" verdict before; 0 now.** 19 tests.
7. **P0-5** `9390eea` — a MenACWY booster on its exact 3-year anniversary counts
   (1095 vs the 1096 demanded). Every booster due-date in the engine now lands on
   the real anniversary, which also settles **P2-4**. 13 tests.
8. **P2-1, P2-2, P2-4** `f075a77` — three unreachable hand-typed-total traps
   removed. 10 tests.
9. **P1-3** `efefb63` — the 3-dose shortcut really is 3 doses, and is restricted
   to a 3–6-month start per CDC. **Plus a safety check the queue did not ask
   for**: the shortcut's final dose must be ≥12 weeks after dose 2 AND after 12
   months — previously only a 4-week baseline applied, which would have let a
   premature third dose CLOSE the now-shorter series. 21 tests.
10. **P1-4** `33758b1` — no recommendation while risk-timing answers are
    outstanding. Presentation only; `rec.dueToday` computes exactly as before
    (asserted). The card is NOT hidden — the questions live inside it. 15 tests.

## What's NOT done

- **P2-3 (owner copy decision, not a defect).** Routine 11y + 16y: the heading
  calls the 16-year dose a booster (correct — routine primary total is 1) while
  the chip says "Dose 2 of 2" (also correct — ACIP calls it a 2-dose series).
  Both halves are right; together they read as a contradiction. **Ask which
  wording she wants; do not pick one.**

- **CROSS-REPO — two vaxapp ports. The two apps disagree until these land.**
  Use the `vaccine-parity` skill; one PR in `~/Downloads/vaxapp-main`.
  1. **The 3-year booster.** vaxapp still has
     `src/logic/stateHelpers.js:179 MENACWY_BOOSTER_3Y = 1096` and still voids a
     booster given on its exact anniversary. Port P0-5's calendar helpers.
     (A comment in this repo claimed vaxapp used 1095 — checked directly
     2026-09-15, it does not. Comment corrected in `9390eea`.)
  2. **The 2-month shortcut.** vaxapp offers the 3-dose shortcut from a 2-month
     start. **Owner decided 2026-09-15: follow CDC and fix vaxapp too.**
     CDC gives a 2-month start a flat 4-dose series.

- **Live verification: DONE 2026-09-15** (it was outstanding when this file was
  first written). `preview_start` stayed refused — the folder's 5-server limit
  was held by other chats, and killing the stale processes was denied — but a
  MeningoVax vite server from 2026-09-13 was still live on **port 5179**, and
  `navigate` to `http://localhost:5179/MeningoVax/` reaches it without
  registering a server. Vite serves from disk, so it served this branch's code.
  Verified by driving the page, zero console errors:
  - **P1-2 / the reported patient** (DOB 2018-09-15, asplenia, doses 2018-11-15,
    2019-01-15, 2019-03-15, 2019-09-15, 2022-09-15, all answered yes) — the list
    now reads `Primary series / D1 Dose 1 of 4 / D2 Dose 2 of 4 / D3 Dose 3 of 4
    / D4 Dose 4 of 4 / Boosters / D5 Booster`, headline "No MenACWY or MenB
    doses due today", next booster **Sep 15, 2027**. Exactly the audit's
    expected; was "Dose 1 of 2, Dose 2 of 2, then three Boosters".
  - **P1-4** — before any answer: headline "5 recorded doses need an answer
    below before a recommendation can be made", pill "Answers needed", card
    "Answer the question on each recorded dose below to get a recommendation",
    and all five prompts still on screen. Was "Due today: MenACWY" + "Dose 1
    of 2".
  - **P0-2** (18y, college dorm, doses at 14y and 17y) — card "Complete (dose
    given at ≥16y)", pill "Up to date", chips `Dose 1 of 1` / `Booster`, no
    "Extra dose" anywhere. Checked at 375px mobile width too; no overflow.

  If a future session needs the page again and `preview_start` is refused, port
  5179 may still be up — check `lsof -nP -iTCP -sTCP:LISTEN` and use `navigate`.

## Note on test fixtures

Three existing fixtures were corrected (not weakened): they built dates with the
same averaged month/year constants the production code used, so they agreed with
the code only because both were wrong in the same direction. Where an existing
assertion encoded the bug itself (`primary-vs-booster-boundary.test.js`'s
`hasBoosterPhase: false`, `regression-m12`'s `2027-09-16`), the commit says so
and explains why. **No expectation was relaxed to make a fix pass.**

## Why this is a good stopping point

Every silent-wrong-answer item (all five P0s) is fixed, tested twice over, and
independently shippable. The remaining work is one copy question and two ports
to a different repo — neither blocks PR #17 landing.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout dose-counter-audit-p0`
   (or `main` once PR #17 merges).
2. Run `npx vitest run` — confirm **682 passing (64 files)** before new work.
3. Start the dev server first (`preview_start`, name `"MeningoVax dev server"`,
   `.claude/launch.json`) and do the browser pass listed above. If it is refused
   again, ask the owner to stop a server in another chat — do not skip it twice.
4. **Ask, don't default**: (a) P2-3's wording; (b) whether to do the two vaxapp
   ports now and in which order.
5. Per-item workflow: reproduce → failing test in both layers → fix → full suite
   green → live-verify → commit named by the item ID.
6. Ship: branch → PR → `gh pr merge --squash`. Do not push to `main`.
