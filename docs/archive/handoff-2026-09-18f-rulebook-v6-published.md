# MeningoVax — Handoff after the clinician rulebook was brought up to date (2026-09-18)

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor (MenACWY + MenB +
pentavalent), browser-only, no backend, live at https://jojohuhu-git.github.io/MeningoVax/.
Its core promise is **honesty**: a silently wrong answer is worse than a crash.

**This supersedes `handoff-2026-09-18e-calendar-p2-1-shipped.md`**, which now carries a
banner pointing here — and which contained one error, corrected below.

Branch: `resume/2026-09-18-p2-triage`, off `origin/main`. **No code was changed this
session**, so the branch is identical to `origin/main` apart from this handoff file.

## State, verified just now — not remembered

| | |
|---|---|
| `origin/main` | **73cedde** — PR #51 |
| Suite | **1464 passing, 119 test files, 0 failing, 0 failed test suites** (`npx vitest run`) |
| Working tree | clean |
| Open PRs | none |

> The handoff this one supersedes recorded "1464 passing, **496** test files". The test
> count was right; the file count was not. It is **119**.

## The correction that matters most

`handoff-2026-09-18e` listed **calendar P2-2** (age-at-a-past-dose up to 3.2 days out) as
still to do. **It is done** — PR #44, merged 2026-09-18, residual error re-measured at
**0.000000 days**, swept over 319,964 combinations, with
`regression-cal-p2-2-exact-age-at-dose-ui.test.jsx` green on `main`. Handoffs 18c and 18d
had the remaining-queue table right; 18e re-copied the original queue file's text instead
of carrying that table forward, and resurrected a finished item. **Do not start P2-2.**

## What's done this session

**The clinician rulebook artifact is now version 6** —
https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss — the plain-English map of every rule
the app applies, written for a clinician with a patient in front of them.

v5 was published on the evening of 17 September and said, in section 08, that there were
**no open gaps**. Ten fixes landed the next morning, so that claim had been false for a
day. v6 fixes both the staleness and the framing:

- **Section 08 is renamed "What is open, and what changed"** and now opens with what is
  still wrong, not with a clean bill of health. Two gaps are listed as open: *a product
  recorded before it existed is counted in silence* (impossible-entries P2-1) and *at a
  month end the 4-day grace is effectively 7 days* (calendar P2-3, deliberate). It closes
  by saying why "no open gaps" was the wrong sentence for this page to carry at all.
- **New rules written down**, each one driven in the running app rather than transcribed
  from a PR body: the MenACWY 2-month floor card ("Not yet age-eligible"); infant bands
  read in completed months; the adult-indication age note; the app keeping the date of
  birth so booster dates are exact and lose their "~"; ages refused at entry; "Before
  birth"; a dose dated before birth treated as a date problem, not a repeat.
- **Sources gained two entries**: the ACIP 2020 MMWR read as the **PDF** (the HTML page's
  text conversion drops the tables, which is where the `>=10 yrs` rows live) and
  **Penmenvy MMWR 2026;75(1)**.

**How it was verified.** Four patients driven at localhost:5181, and every claim added to
the page was seen on screen:

| Patient | What was confirmed |
|---|---|
| 4-week-old, asplenia + college-dorm ticked | "Not yet age-eligible" + *"The earliest any MenACWY vaccine may be given is 2 months of age"*; and the age note *"ACIP lists ... only for ages 10 years and over"* with nothing withheld |
| Born 2010-03-15, MenACWY dose dated 1926 | `age Before birth`; *"This date is before the patient was born ... No repeat dose is needed on the strength of it"*; both dates printed |
| Born 2012-03-26, dose at 11y2m | Booster due **Mar 26, 2028** — the exact birthday, no "~"; age at dose exact |
| Born 2008-01-10, **Penbraya dated 1 Jun 2018** | Counted as MenACWY "Dose 1 of 2", credited to both vaccines, **no comment at all** — this is the open gap, reproduced rather than assumed |

Design was left alone: the token system is owner-approved from v5 and only content changed.

## What's NOT done — the remaining queue

| # | ID | Source | Scope |
|---|---|---|---|
| 1 | **imp P2-1** | `fix-2026-09-17-impossible-entries.md` | A product recorded years before it existed is accepted and counted. Needs each product's licensure date **verified from FDA/CDC** (the `verify-clinical-source` skill) before any code. A licensure date would sit beside `minAgeM` in `src/data/brands.js`. Owner's steer on 2026-09-18 was that this is a **note, not a block** — the same shape as imp P1-2. |
| 2 | **cal P2-3** | `fix-2026-09-17-calendar-and-dates.md` | Month-end grace effectively 7 days. Deliberate, accept direction, ACIP silent. A comment unless the owner wants it tightened. |
| 3 | **imp P2-2** | `fix-2026-09-17-impossible-entries.md` | `NaN`/`Infinity` ages. **Not reachable through the UI** — robustness only. Deliberately left out of the rulebook for that reason. |

**The P1-class queue is still empty.**

## Owner decisions on record — apply, do NOT re-ask

1. **Impossible P1-2 is a note, never a block** — shipped (PR #46).
2. **Floors:** under 10 years for microbiologist / military / college_dorm (ACIP's own
   row, cited), under 9 years for pregnancy (uncited judgement). Do not revert to the
   drafted 16/17/16.
3. **The PneumoVax card-copy port stays deferred** ("do not touch PneumoVax").
4. **The vaxapp meningococcal ports stay on hold.** The two apps knowingly differ; never
   port piecemeal.
5. **Merging: ask each time.** No standing rule.
6. **The rulebook's design is settled** — change its content, not its tokens.

## Why this is a good stopping point

The rulebook was the one item on the queue that was actively *misleading* — it told a
clinician there was nothing wrong with the app, in a document whose whole purpose is to be
checkable against a patient. It is now accurate as of today and says what is still broken.
No code changed, so nothing is half-built and the suite is untouched at 1464.

## Resuming

1. `cd ~/Downloads/MeningoVax-main`. `main` is still checked out in a stale agent worktree
   under `.claude/worktrees/elated-thompson-4bc583`, so `git checkout main` **fails
   locally** — branch off `origin/main` instead (`git checkout -b <name> origin/main`).
2. Run `npx vitest run` and confirm **1464 passing / 119 files** before touching anything.
   Check `numFailedTestSuites`, not just failed tests.
3. **The dev-server cap (5 per folder) was hit this session.** Ports 5179, 5180 and 5181
   were already serving this directory from other chats. Browse an existing one rather
   than starting a new one — they all serve the same files, so edits reach them via HMR.
   Do not kill another chat's server.
4. **Ask which item to start with**, but do not re-open the six decisions above. The
   choices are imp P2-1, cal P2-3, or imp P2-2 — in that order of value.
5. Per item (`fix-queue` skill): reproduce → failing test first → fix → full suite green
   (quote the real number) → drive the running app → commit named by the item ID.
   imp P2-1 additionally needs `verify-clinical-source` run first, because it writes new
   clinical facts (licensure dates) into the app.
6. **If the rulebook changes again**, republish the same artifact URL with `url` — and
   never let section 08 go back to claiming there are no open gaps.
7. Push policy: branch → PR → squash merge — and **ask before merging**.
