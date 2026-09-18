# MeningoVax — Handoff after six queue items shipped (2026-09-18)

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor (MenACWY + MenB +
pentavalent), browser-only, no backend, live at https://jojohuhu-git.github.io/MeningoVax/.
Its core promise is **honesty**: a silently wrong answer is worse than a crash.

**This supersedes `handoff-2026-09-17g-what-needs-doing-next.md`**, whose queue this session
worked. That file's table of eight items is now partly done — use the tables below, not it.

## State, verified just now — not remembered

| | |
|---|---|
| `main` | **ebf54de** — PR #42, "Keep the date of birth…" |
| Suite | **1402 passing, 469 files, 0 failing, 0 failed test files, 0 skipped** |
| Working tree | clean; nothing half-built, nothing uncommitted |
| Branch | `docs/2026-09-17-audit-queues` (PR **#37**) — documents only, now also carrying this handoff |

Baseline at the start of the session was 1307 passing. Every PR below was merged **and** its
GitHub Pages deploy confirmed green.

## What's done — by queue ID

| PR | IDs | What changed |
|---|---|---|
| **#38** | calendar **P1-1**, **P1-2** | `calendarMonthsBetween()` took the month fraction from the END month's length, so a baby born 31 Jan was **−0.07 months old** on 1 Feb and the app refused a correct date of birth. Also made age non-monotonic (younger overnight, back under the 12-month infant gate) and put a leap-day child on the infant schedule on the app's own reckoning of their 2nd birthday. Now anchored on `addCalendarMonths()`, so the two halves of the calendar hold one opinion. **P1-2 needed no second fix.** Sweep: 149,184 patients, 1,281 regimen changes (0.86%), all on the four February dates predicted. |
| **#39** | *(new finding)* | At any age **below 2 months, including 0**, an at-risk infant was told MenACWY was **due today**, with a Menveo chip to pick. Menveo's floor is 2 months (CDC schedule notes, fetched live). The minimum age was tested only on the branch that STARTS the series; a patient failing it fell through to the CONTINUE branch, which printed "Dose 1". Guard moved ahead of all card-building. Sweep: 52,065 combinations, 1,200 rows changed, **all below 2 months**. |
| **#40** | impossible **P0-1** | Year typed `0026` gave "2000 years 7 months · Adult (19+)" **and a complete adult card** — swapping a 7-month-old's "12 weeks and after the first birthday" for "8 weeks, no age floor". Years box took `999` despite `max="120"`. New leaf module `src/logic/ageEntry.js` refuses at entry in **both** modes, naming the field and the likely cause. |
| **#41** | impossible **P1-3** | Every negative age printed "Birth · Infant (<2y)" — identical to a newborn. Now "Before birth", and `ageGroup()` returns null so the caller decides. Fixed in **both** formatters: `validate.js`'s `fmtAgeMClinical` had its own `m < 0.5 → 'birth'` guard that would have swallowed it. |
| **#42** | calendar **P1-3**, calendar **P2-1** (partly), impossible **P1-1** | The **date of birth is now kept** (`state.dob`) and the age derived from it at render, by new leaf module `src/logic/patientAge.js` (the dob beats a stored `ageMonths`, which is only a snapshot). The 16th-birthday date is now exact and the card drops its "~"; "Adjust age" in Results clears the dob. A dose dated before birth is now a **date** problem — "Dated before birth — not counted" — instead of "below the minimum age … **repeat this dose only**". Sweeps: 118,998 years/months patients **0 changed** by the dob work; 10,824 changed by the before-birth work, **every one** having a dose predating birth. |

Every one was reproduced first, given a failing test in **both** layers before the fix, and
driven in the running app afterwards — not merely left green.

## Careful — two things are NOT as closed as they look

- **calendar P2-1 — half done.** The *hazard* is gone: the patient no longer stops ageing
  while a tab is open. The tidy-up the item also named is **not** done — `todayISO()` is
  still read from four independent call sites per render (`format.js`, `validate.js`,
  `RecCard.jsx`, `DoseEditor.jsx`).
- **calendar P2-2 — measured, still open.** Age-at-dose is still computed by SUBTRACTION
  (`ageMonths − calendarMonthsBetween(dose, today)`), so the two fractions are scaled by
  different anniversary spans. **Worst case over 7,151 samples after #42: 2.95 days.**
  A single spot-check of the audit's own example looked clean (0.11 days) and a wider sweep
  did not — do not record this as fixed. Now that the date of birth is kept, the exact fix
  is cheap: compute it as `calendarMonthsBetween(dob, dose.date)` when a dob is known, and
  keep the subtraction only for years/months patients.

## What's NOT done — the remaining queue

Both queue files are in `docs/archive/` **on this branch**: `fix-2026-09-17-calendar-and-dates.md`
and `fix-2026-09-17-impossible-entries.md`. They are **not on main** until PR #37 merges.

| # | ID | Source | Scope |
|---|---|---|---|
| 1 | **calendar P2-2** | calendar | Exact age-at-dose from the kept date of birth (see above). Small, and #42 is what makes it possible. |
| 2 | *(new finding)* | this session | **A MenACWY card contradicts itself between 6 and 7 months**: heading "Dose 1 of **4** (infant high-risk 7–11mo)" over a note saying "Start the **2**-dose Menveo series". The label branch splits at `am <= 6` (`recommend.js` ~line 719), the dose-count helper at `MENACWY_INFANT_LATE_START_MIN_AGE_MONTHS = 7` (`ages.js`). Pre-existing — verified byte-identical against pre-#38 code. `recommend.js`'s own comments say this class of bug was already fixed twice (F1, M5), so **fix the shared constant, not the literal**. |
| 3 | **impossible P1-2** | impossible | The risk-factor note. **Owner-approved** — a quiet note on the card, **never a block**. Four tick-boxes in scope, **eight that must NOT be touched**; the full list is in the queue under P1-2. Read it before writing a line. |
| 4 | **calendar P2-1** (remainder) | calendar | Four independent clock reads per render → one. |
| 5 | P2s | both | Month-end grace effectively 7 days (**deliberate** — a consequence of clamping, in the accept direction); a product recorded before it existed; `NaN`/`Infinity` ages (**not reachable through the UI** — robustness only). |

### Check this before item 3

`recommend.js` and the clinician rulebook both assert **"ACIP's microbiologist table covers
ages 10 and up only"**, and that claim justifies a real behaviour (a flat 5-year booster
interval with no under-7 variation). A live fetch of the ACIP 2020 MMWR on 2026-09-17 could
**not** confirm it. Check it against the MMWR **PDF**. If the table does say 10 and up, the
note for microbiologists can cite it instead of resting on plausibility.

## Owner decisions on record — apply, do NOT re-ask

1. **Impossible P1-2 is a note, never a block** — ACIP gives no age floor for these
   indications, so blocking would invent guidance ACIP never wrote.
2. **The PneumoVax card-copy port stays deferred** ("do not touch PneumoVax").
3. **The vaxapp meningococcal ports stay on hold.** The two apps knowingly differ. Never
   port piecemeal — that is how they came to differ, and #38–#42 have widened the gap.
4. **Merging:** she merged #38–#42 in-session when asked, each time. She has still not made
   that a standing rule — **ask each time.**

## Also needs doing

The **clinician rulebook artifact** (v5, https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss)
says in section 08 that there are **no open gaps**. That is now out of date: this session
shipped five fixes and found two faults. It needs a v6 recording them.

## Why this is a good stopping point

Nothing is half-built. `main` is green and deployed, every shipped item is a complete unit
with its own tests and its own differential sweep, and the two remaining P1-class items
(the 6–7 month card, the risk-factor note) are independent of each other and of everything
merged. PR #37 is documents only and blocks nothing.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`. **Check first**
   whether PR #37 is still open — if it is, the queue documents are only on its branch.
   Note that `main` may be checked out in an agent worktree under `.claude/worktrees/`,
   which makes `git checkout main` fail locally; branch with `git reset --hard origin/main`
   instead, and check `gh pr view --json state` before believing a merge failed.
2. Run `npx vitest run` and confirm **1402 passing** before touching anything. Check
   `numFailedTestSuites`, not just failed tests: a file that crashes while *loading* runs 0
   tests, reports 0 failures, and still fails CI.
3. Start the dev server with `preview_start` and `.claude/launch.json`. Other chats have had
   servers on 5179/5180/5181 — they all serve **this same folder**, so browse one rather
   than starting a sixth (the per-folder limit is 5). **Do not kill another chat's server.**
4. **Ask which item to start with** — but do not re-open the four decisions above.
5. Per item (`fix-queue` skill): reproduce → **failing test first, both layers** → fix →
   full suite green (quote the real number) → drive the running app → commit named by the
   item ID.
6. **A green suite is not proof.** Every clinical change wants a differential sweep: capture
   every card and every validator verdict over a wide patient grid before and after, and
   *read* the diff grouped by kind. The harnesses used this session are the pattern —
   they caught both new findings, neither of which any test would have flagged.
7. **Use awkward test patients on purpose** — fractional ages, month ends, leap days, dates
   a day either side of a cut-off. A whole-number test patient is what let "eligible
   undefined 17, 2027" reach the live site.
8. Before changing any clinical rule, use the `verify-clinical-source` skill and fetch the
   page live. Push policy: branch → PR → squash merge, and **ask before merging**.
