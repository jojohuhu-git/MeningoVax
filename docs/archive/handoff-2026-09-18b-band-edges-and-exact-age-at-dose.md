> **SUPERSEDED (2026-09-18) — do not work this queue.**
> Its remaining item 1 (impossible P1-2, the risk-factor note) shipped as PR #46 and is
> deployed. The current handoff, with the up-to-date queue, test count and owner
> decisions, is
> [`handoff-2026-09-18c-risk-age-note-shipped.md`](handoff-2026-09-18c-risk-age-note-shipped.md).
> The ACIP microbiologist-table claim this file flagged as unconfirmed **has since been
> confirmed** against the MMWR PDF — see the newer handoff.

# MeningoVax — Handoff after the two band/age items shipped (2026-09-18)

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor (MenACWY + MenB +
pentavalent), browser-only, no backend, live at https://jojohuhu-git.github.io/MeningoVax/.
Its core promise is **honesty**: a silently wrong answer is worse than a crash.

**This supersedes `handoff-2026-09-18-calendar-and-impossible-queues-six-items.md`**, whose
remaining queue this session worked. Two of its five items are now done — use the tables
below, not that file's.

## State, verified just now — not remembered

| | |
|---|---|
| `main` | **9e11f11** — PR #44 |
| Suite | **1433 passing, 115 test files, 0 failing, 0 failed test suites, 0 skipped** |
| Working tree | clean; nothing half-built, nothing uncommitted |
| Open PRs | none |
| Branch | `docs/2026-09-18-b1-and-cal-p2-2` — this handoff only |

Baseline at the start of the session was 1402 passing / 113 files, which matched the
previous handoff exactly. Both PRs below were merged **and** their GitHub Pages deploy
confirmed green and spot-checked on the live site.

> A note for whoever checks the live site next: after a deploy, the browser may serve the
> **previous** bundle from cache and show you the old behaviour. Load the URL with a
> throwaway query string (`?cachebust=1`) before concluding a deploy did not take. That
> happened this session and looked exactly like a failed deploy.

## What's done — by queue ID

| PR | ID | What changed |
|---|---|---|
| **#43** | **B1** *(new ID, coined this session for the handoff's unnamed "item 2")* | CDC writes the infant bands in COMPLETED months — "dose 1 at age 3-6 months", "at age 7-23 months" — but the code asked `am <= 6` and `am <= 11`, which only mean the same thing for a whole number of months. Since #42 started keeping the date of birth, almost every real patient has a fractional age. **Three** symptoms, not the one recorded: a card contradicting itself at 6½ months ("Dose 1 of **4** (7-11mo)" over "Start the **2**-dose series"); **an extra injection** — a dose 1 given at 6½ months was refused CDC's 3-dose shortcut and booked a fourth dose, while a start two weeks either side needed three or two; and at 11½ months a card asserting "Both fall after the first birthday … already met", five weeks early. Edges now read the shared constants, and the 3-6-month test — two hand-written copies, wrong the same way — is one exported `menacwyOn3DoseShortcut()`. Sweep: 36,582 combinations, 4,165 rows changed, **every one accounted for, zero collateral**. |
| **#44** | calendar **P2-2** | Age-at-a-past-dose was computed by subtraction, mixing the patient's month-anniversaries with the dose date's — up to **2.946 days** out (measured over 50,845 samples; >1 day out in 2.9%). The 4-day grace absorbed it for dose *validity*, but the infant band tests have **no grace**, so it landed on the dose count both ways: a baby dosed exactly on their own 7-month anniversary was read as 6.97 months and asked for four doses instead of two; another whose dose 2 fell a day short of seven was read as exactly 7.0000 and had their series closed a dose early. `patientAge.js` now owns the answer for every surface (there were three copies) and measures from the kept date of birth. Residual error re-measured: **0.000000 days**. Sweep: 319,964 combinations — every per-dose verdict that moved moved **invalid → valid** (1,898 doses that were being thrown away now count), **not one dose that counted before stopped counting**, and the years/months control group did not move at all. |

Both were reproduced first, given failing tests in **both** layers before the fix (each
confirmed failing against pre-fix code), driven in the running app, and swept.

## Two things worth knowing

- **cal P2-2 was bigger than the queue described.** The queue called it a display-accuracy
  item ("visible in the record panel's printed age"). It was a dose-count bug. Threading the
  date of birth through also exposed surfaces the first pass missed — the validator's own
  dose-1/dose-2 ages, the "Given at ~N months" risk-at-dose prompt, and the 4-day grace's own
  re-derivation. The live app was showing **"age 7 months" on a row and "Given at ~6 months"
  in the prompt directly beneath it** at the same time. All of them ask the one function now.
- **vaxapp has one of B1's three symptoms.** Its card bands are already right (`am < 7`,
  `am < 12`), but its shortcut test is `d1AgeM >= 2 && d1AgeM <= 6` — so it has the
  extra-injection symptom, and separately still uses a floor of 2 where MeningoVax uses 3
  (a divergence already recorded on 2026-09-15). **Not ported**, per owner decision 3 below.

## What's NOT done — the remaining queue

Both queue files are on `main` in `docs/archive/`: `fix-2026-09-17-calendar-and-dates.md`
and `fix-2026-09-17-impossible-entries.md`.

| # | ID | Source | Scope |
|---|---|---|---|
| 1 | **impossible P1-2** | impossible | The risk-factor note. **Owner-approved** — a quiet note on the card, **never a block**. Four tick-boxes in scope, **eight that must NOT be touched**; the full list is in the queue under P1-2. Read it before writing a line. |
| 2 | **calendar P2-1** (remainder) | calendar | `todayISO()` is still read from four independent call sites per render (`format.js`, `validate.js`, `RecCard.jsx`, `DoseEditor.jsx`) → one. The *hazard* was closed by #42; this is the tidy-up only. |
| 3 | P2s | both | Month-end grace effectively 7 days (**deliberate** — a consequence of clamping, in the accept direction); a product recorded before it existed; `NaN`/`Infinity` ages (**not reachable through the UI** — robustness only). |

### Check this before item 1

`recommend.js` and the clinician rulebook both assert **"ACIP's microbiologist table covers
ages 10 and up only"**, and that claim justifies a real behaviour (a flat 5-year booster
interval with no under-7 variation). A live fetch of the ACIP 2020 MMWR on 2026-09-17 could
**not** confirm it. Check it against the MMWR **PDF**. Still unchecked — this session did not
touch it.

## Owner decisions on record — apply, do NOT re-ask

1. **Impossible P1-2 is a note, never a block** — ACIP gives no age floor for these
   indications, so blocking would invent guidance ACIP never wrote.
2. **The PneumoVax card-copy port stays deferred** ("do not touch PneumoVax").
3. **The vaxapp meningococcal ports stay on hold.** The two apps knowingly differ. Never
   port piecemeal — that is how they came to differ, and #38-#44 have widened the gap
   further.
4. **Merging:** she merged #43 and #44 in-session when asked, as she did #38-#42. She was
   offered a standing "merge when green" rule this session and did **not** take it —
   **keep asking each time.**

## Also needs doing

The **clinician rulebook artifact** (v5, https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss)
says in section 08 that there are **no open gaps**. That has been out of date since
2026-09-17 and is now further out: seven fixes and three findings since. It needs a v6.

## Why this is a good stopping point

Nothing is half-built, `main` is green and deployed, and both shipped items are complete
units with their own tests and their own differential sweep. The calendar queue is now
closed except for one cosmetic tidy-up, and the one remaining P1-class item (the
risk-factor note) is independent of everything merged.

## Resuming

1. `cd ~/Downloads/MeningoVax-main`. Note that `main` is checked out in an agent worktree
   under `.claude/worktrees/`, which makes `git checkout main` **fail locally** — branch and
   `git reset --hard origin/main` instead. Check `gh pr view --json state` before believing
   a merge failed; the same worktree error is printed by `gh pr merge` *after* it has
   already merged successfully.
2. Run `npx vitest run` and confirm **1433 passing** before touching anything. Check
   `numFailedTestSuites`, not just failed tests: a file that crashes while *loading* runs 0
   tests, reports 0 failures, and still fails CI.
3. Start the dev server with `preview_start` and `.claude/launch.json`. Other chats have had
   servers on 5179/5180/5181 — they all serve **this same folder**, so browse one rather
   than starting another (the per-folder limit is 5). **Do not kill another chat's server.**
4. **Ask which item to start with** — but do not re-open the four decisions above.
5. Per item (`fix-queue` skill): reproduce → **failing test first, both layers, confirmed
   failing against pre-fix code** → fix → full suite green (quote the real number) → drive
   the running app → commit named by the item ID.
6. **A green suite is not proof.** Every clinical change wants a differential sweep: capture
   every card and every validator verdict over a wide patient grid before and after, and
   *read* the diff grouped by kind. Both items this session changed behaviour no existing
   test would have flagged, and both sweeps were what proved the change was confined.
7. **Use awkward test patients on purpose** — fractional ages, month ends, leap days, doses
   landing exactly on an anniversary and a day either side. Both of this session's items were
   invisible to the suite for one reason: **every test patient was a whole number of months
   old.** That is now the single most productive lens on this codebase.
8. Before changing any clinical rule, use the `verify-clinical-source` skill and fetch the
   page live. Push policy: branch → PR → squash merge, and **ask before merging**.
