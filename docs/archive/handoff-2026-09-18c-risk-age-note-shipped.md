# MeningoVax — Handoff after the risk-factor age note shipped (2026-09-18)

> **SUPERSEDED** by
> `docs/archive/handoff-2026-09-18d-utc-dob-picker-fixed.md`. That session merged this
> handoff's own PR (#47), then fixed the "loose thread" flagged below (the UTC
> date-of-birth picker bug, PR #48). Use the newer file — its tables of what's done and
> what remains are current; this file's are not.

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor (MenACWY + MenB +
pentavalent), browser-only, no backend, live at https://jojohuhu-git.github.io/MeningoVax/.
Its core promise is **honesty**: a silently wrong answer is worse than a crash.

**This supersedes `handoff-2026-09-18b-band-edges-and-exact-age-at-dose.md`**, whose
remaining queue this session worked. One of its three items is now done — use the tables
below, not that file's.

## State, verified just now — not remembered

| | |
|---|---|
| `main` | **748458f** — PR #46 |
| Suite | **1457 passing, 117 test files, 0 failing, 0 failed test suites, 0 skipped** |
| Working tree | clean; nothing half-built, nothing uncommitted |
| Open PRs | none |
| Branch | `docs/2026-09-18-p1-2-handoff` — this handoff only |

Baseline at the start of the session was **1433 passing / 115 files**, which matched the
previous handoff exactly. PR #46 was merged **and** its GitHub Pages
deploy confirmed green and spot-checked on the live site (with `?cachebust=`, per the
previous handoff's warning — which was needed again).

One tidy-up also landed: **PR #45**, the previous session's handoff document, was still
sitting open and was merged at the start of this session.

## What's done — by queue ID

| PR | ID | What changed |
|---|---|---|
| **#46** | **impossible P1-2** | A newborn could be ticked as a "First-year college student living in a residence hall" and got **"1 dose", due today, with no product listed at all** (nothing is licensed under 2 months). Same for "Military recruit" and "Microbiologist" at any age; **pregnancy** was quieter — tickable for a three-year-old, silently deferring MenB with nothing on screen. The results header now carries a short note under the risk chips naming each doubted tick. **Nothing blocked, nothing withheld, no recommendation changed.** New: `minPlausibleAgeMonths` + `ageImplausibleRisks()` in `riskFactors.js` (the one place the floor is applied), `riskAgeCheck()` in `recommend.js` (all copy), `RiskAgeNote` in `RecCard.jsx`, `.risk-age-note` in `App.css`. Sweep: 61,560 combinations, **zero rows changed** outside the new note. |

Reproduced first, failing tests in **both** layers before the fix (13 of 14 engine and 6 of
10 UI confirmed failing against pre-fix code; the rest are "must never fire" guards that
correctly pass either way), driven in the running app at desktop and phone width, and swept.

## The source finding — worth knowing, it settles an old doubt

The previous handoff flagged an unsourced-looking claim in `recommend.js` and the rulebook:
*"ACIP's microbiologist table covers ages 10 and up only"*, which justifies a flat 5-year
booster interval with no under-7 variation. A live fetch on 2026-09-17 could not confirm it.

**It is confirmed.** The HTML page's text conversion drops the tables; the **PDF** has them
(https://www.cdc.gov/mmwr/volumes/69/rr/pdfs/rr6909a1-H.pdf). Both relevant tables carry
exactly one age-group row:

- **Table 7** (microbiologists routinely exposed to *N. meningitidis* isolates) — `>=10 yrs`
- **Table 10** (college freshmen in residence halls **and military recruits**) — `>=10 yrs`

That last one was **not** in the queue's knowledge: all three exposure indications have a
sourced floor, not just the microbiologist. For contrast **Table 4** (persistent complement
deficiency) prints three rows — `2-23 mos`, `2-9 yrs`, `>=10 yrs` — and carries the
`<7 yrs` / `>=7 yrs` booster split that Table 7 genuinely lacks. The difference between the
tables is real, not an omission.

**Whenever a table is the thing in doubt, read the PDF, not the HTML page.** This is the
second time the HTML fetch has produced a false negative on this document.

## What's NOT done — the remaining queue

Both queue files are on `main` in `docs/archive/`: `fix-2026-09-17-calendar-and-dates.md`
and `fix-2026-09-17-impossible-entries.md`.

| # | ID | Source | Scope |
|---|---|---|---|
| 1 | **calendar P2-1** (remainder) | calendar | `todayISO()` is still read from four independent call sites per render (`format.js`, `validate.js`, `RecCard.jsx`, `DoseEditor.jsx`) → one. The *hazard* was closed by #42; this is the tidy-up only. |
| 2 | P2s | both | Month-end grace effectively 7 days (**deliberate** — a consequence of clamping, in the accept direction); a product recorded before it existed; `NaN`/`Infinity` ages (**not reachable through the UI** — robustness only). |

**The P1-class queue is now empty.** Everything left is P2.

### One loose thread, noticed but not chased

On the Age step, a date of birth of **today in UTC** is rejected as *"in the future"* late in
the US evening — the date input and the engine disagree about which day it is. Seen at 23:09
PDT on 2026-09-17 while driving the app. Not investigated, not in any queue, and it may be
intended. It is the same class of thing as the UTC-fixture rot that has produced phantom red
suites before.

## Owner decisions on record — apply, do NOT re-ask

1. **Impossible P1-2 is a note, never a block** — shipped that way.
2. **Floors:** under **10 years** for microbiologist / military / college_dorm (ACIP's own
   row, cited), under **9 years** for pregnancy (an admitted judgement, deliberately
   **uncited** — no ACIP table covers it). Chosen 2026-09-18 over the queue's drafted
   16/17/16, because those were a guess and would have questioned a real 15-year-old lab
   intern.
3. **The PneumoVax card-copy port stays deferred** ("do not touch PneumoVax").
4. **The vaxapp meningococcal ports stay on hold.** The two apps knowingly differ. Never
   port piecemeal — that is how they came to differ, and #38–#46 have widened the gap.
5. **Merging:** she has merged every PR in-session when asked (#38–#46). She was offered a
   standing "merge when green" rule on 2026-09-18 and did **not** take it — **keep asking
   each time.**

## Also needs doing

The **clinician rulebook artifact** (v5, https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss)
says in section 08 that there are **no open gaps**. That has been out of date since
2026-09-17 and is now further out: eight fixes since, including this one. It needs a v6 —
which should also record the Table 7 / Table 10 confirmation above, since v5 carries the
claim that could not be sourced.

## Why this is a good stopping point

Nothing is half-built, `main` is green and deployed, and the item shipped is a complete unit
with its own tests and its own differential sweep. The **P1 queue is empty** — everything
remaining is P2 and independent of everything merged.

## Resuming

1. `cd ~/Downloads/MeningoVax-main`. Note that `main` is checked out in an agent worktree
   under `.claude/worktrees/` (still stale at `214f725`), which makes `git checkout main`
   **fail locally** — branch off `origin/main` and `git reset --hard origin/main` instead.
   Check `gh pr view --json state` before believing a merge failed; the same worktree error
   is printed by `gh pr merge` *after* it has already merged successfully. It did so twice
   this session.
2. Run `npx vitest run` and confirm **1457 passing** before touching anything. Check
   `numFailedTestSuites`, not just failed tests: a file that crashes while *loading* runs 0
   tests, reports 0 failures, and still fails CI.
3. Start the dev server with `preview_start` and `.claude/launch.json`. Other chats have had
   servers on 5179/5180/5181 — they all serve **this same folder**, so browse one rather
   than starting another (the per-folder limit is 5). **Do not kill another chat's server.**
4. **Ask which item to start with** — but do not re-open the five decisions above.
5. Per item (`fix-queue` skill): reproduce → **failing test first, both layers, confirmed
   failing against pre-fix code** → fix → full suite green (quote the real number) → drive
   the running app → commit named by the item ID.
6. **A green suite is not proof.** Every clinical change wants a differential sweep: capture
   every card and every validator verdict over a wide patient grid before and after, and
   *read* the diff grouped by kind. This session's sweep is the template — it is what turned
   "I did not change anything else" from a claim into a measurement.
7. **Driving the app is not optional either.** This session's tests were all green while the
   live app printed the ungrammatical *"and this patient is Birth."* — the tests asserted the
   age appeared, not that the sentence read like English. Only the browser caught it.
8. **Use awkward test patients on purpose** — fractional ages, month ends, leap days, doses
   landing exactly on an anniversary and a day either side.
9. Before changing any clinical rule, use the `verify-clinical-source` skill and fetch the
   page live — **and read the PDF when a table is what you need**. Push policy: branch → PR
   → squash merge, and **ask before merging**.
