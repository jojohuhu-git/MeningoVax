> **SUPERSEDED, same evening — see
> [handoff-2026-09-17g-what-needs-doing-next.md](handoff-2026-09-17g-what-needs-doing-next.md).**
> This file left one owner decision open (the impossible-entries P1-2 question, whether the
> app should query a risk factor that cannot apply at that age). It has since been answered
> — yes, as a note on the card, never a block — and the newer handoff carries it along with
> the queue in the order to work it. Everything this file says about what was *done* is
> still accurate; do not resume from it.

# MeningoVax — Handoff after finishing Part 2 and running both remaining audits (2026-09-17)

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor, browser-only,
no backend. Its core promise is **honesty**: a silently wrong answer is worse than a
crash.

Branch: `docs/2026-09-17-audit-queues`, off `main`. **Pushed**, open as
**[PR #37](https://github.com/jojohuhu-git/MeningoVax/pull/37)** — documents only, no app
code. `main` is at **5754b16**.

Suite: baseline was 1253 passing; now **1307 passing, 102 files, 0 failing, 0 failed
test files** — run just now, not remembered. Working tree clean.

This session consumed `docs/archive/plan-2026-09-17-finishing-meningovax.md`. That plan's
"What you need to do" list is now **steps 1 and 2 complete**; step 3 is "stop asking for
audits and treat what comes in as maintenance".

---

## What's done

1. **PR #35 merged** (`2e136ba`) — the P2-2 roadmap plus the two rules that had grown a
   second copy. It was left open by the previous session; the owner said merge it.

2. **Part 2 item 1 — age thresholds, PR #36 merged** (`5754b16`). The last group of
   numbers written down twice. New leaf module **`src/logic/ages.js`** owns the schedule
   ages (16 years had four copies, 7 years three, 2 years seven, 10 years three). Product
   licence floors moved to **`src/data/brands.js`**, derived from the product table rather
   than retyped, with a new `menacwyBrandLabelsForAge()`. Card sentences that named one of
   these ages now interpolate it. Drift guard + boundary tests:
   `src/logic/__tests__/regression-p2-3-ages-in-one-place.test.js` (54 tests).

   **Proof no clinical rule changed:** every card and validator verdict captured for
   **28,896 made-up patients** before and after, compared word for word. Identical except
   **42 cases, all a newborn (0 months) carrying an adult-only risk factor**, whose card
   no longer offers a product that isn't licensed until 2 months. Live-checked in the app
   at the 15/16, 23/24 and 22-year boundaries.

   *Note for whoever reads `ages.js`:* the 2026-09-17 plan said to put these in
   `intervals.js`. They are a sibling module instead, because `intervals.js` imports
   `seriesTotals.js` and `seriesTotals.js` needs the ages — a cycle. `ages.js` imports
   nothing. The reasoning is in its header and a test asserts it stays import-free.

3. **Part 2 item 2 — the clinician rulebook refreshed.** Artifact
   **https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss**, now **version 5**. Section 08 was
   retitled "What changed, and when" and states there are **no open gaps**. Both former
   gaps were **re-verified live before the page was changed**, not assumed from PR numbers:
   the early MenB dose 3 now counts and adds a fourth dose; the infant final-dose date
   prints properly ("eligible Feb 2, 2027" on a baby aged 7 months 15 days — a fractional
   age on purpose, since a whole-number test patient is what let the original fault ship).

4. **Both remaining audits run, read-only** — committed as `99887d4` and `56f74b6`, in PR
   #37. Copies live in `.claude/prompts/` too, but **`.claude/` is gitignored here**, so
   the `docs/archive/` copies are the ones that travel.
   - `docs/archive/fix-2026-09-17-calendar-and-dates.md` — no P0, **3 × P1**, 3 × P2.
   - `docs/archive/fix-2026-09-17-impossible-entries.md` — **1 × P0**, 3 × P1, 2 × P2.

---

## What's NOT done — the remaining queue

**Deferred by the owner, this session:**

- **Part 2 item 3 — the card-copy wording owed to PneumoVax.** The owner instructed "do
  not touch PneumoVax" and chose to leave it deferred when asked directly. Not started,
  tracked not dropped. This is a debt to *PneumoVax*, not a gap in MeningoVax — with items
  1 and 2 landed, **MeningoVax itself is finished** by the plan's own definition.

**Not started — the two audit queues.** Neither has been worked. Recommended order is in
each file; the short version:

| ID | Where | One line |
|---|---|---|
| **P0-1** | impossible-entries | A date of birth with the year typed `0026` shows "2000 years 7 months · Adult (19+)" and silently changes the dose-2 interval advice for a real infant. Reproduced live. |
| **P1-1** | calendar | `calendarMonthsBetween()` takes the fraction from the wrong month's length: a baby born 31 Jan has a **negative age** on 1 Feb and the app refuses the date of birth. Reproduced live with the page clock set to that day. |
| **P1-2** | calendar | Falls out of P1-1: a leap-day child is still on the infant schedule on the app's own reckoning of their 2nd birthday. |
| **P1-3** | calendar | The date of birth is thrown away, so "Booster due at 16y" prints a date 1–3 days wrong in 63% of cases — while the Age step promises precision in exchange for the date of birth. |
| **P1-1** | impossible-entries | A dose dated before birth is blamed on the patient's age ("Given at ~birth") and you are told to repeat it. |
| **P1-3** | impossible-entries | Every negative age renders as "Birth · Infant (<2y)". |
| **P1-2** | impossible-entries | **Owner decision needed** — should the app question a risk factor that cannot apply at that age (a newborn "first-year college student")? Three options written up, weakest to strongest. **Ask, don't default.** |
| P2s | both | Age-at-dose 3.2 days out; four independent clock reads per render; month-end grace effectively 7 days; a product recorded before it existed; `NaN`/`Infinity` ages (not reachable through the UI). |

**Still on hold, unchanged:** the vaxapp meningococcal ports, by the owner's standing
decision. The two apps knowingly differ. Do not port piecemeal.

---

## Why this is a good stopping point

Part 2 is closed out as a unit: the one item that needed code is merged with a
28,896-patient differential proof behind it, the one that needed a document is published
and re-verified, and the third is a different repo the owner has explicitly fenced off.
The two audits are the last two named angles in the plan, they are read-only, and neither
blocks the other. `main` is green and deployed. Nothing in PR #37 touches app code, so it
can sit unmerged indefinitely without holding anything up.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull` (or the audits branch
   if PR #37 is still open — check first).
2. Run `npx vitest run` and confirm **1307 passing, 0 failed test files** before new work.
   Check `numFailedTestSuites`, not just failed tests: a file that crashes while *loading*
   runs 0 tests, reports 0 failures, and still fails CI.
3. **Ask, don't default,** on what comes next. The plan's own advice is to stop auditing
   and treat findings as maintenance — so the real choice is: work the two queues (and in
   which order), take the PneumoVax copy port, or stop here. **P1-2 of the
   impossible-entries queue additionally needs an owner ruling before any code.**
4. Per item (`fix-queue` skill): reproduce → failing test first → fix → full suite green
   (quote the real number) → drive the running app if UI-observable → commit by item ID.
   **The calendar P1-1 changes an arithmetic function every schedule decision passes
   through — run the differential sweep** (the PR #36 harness is the pattern).
5. Push policy: `main` is not protected here, but the habit is branch → PR → squash merge.
   The owner merged #35 and #36 in-session today rather than reviewing first.
6. Dev server: `preview_start` with `.claude/launch.json`. Other chats' servers were on
   5179/5180; this session's landed on **5181**. **Do not kill another chat's server
   without asking.**
