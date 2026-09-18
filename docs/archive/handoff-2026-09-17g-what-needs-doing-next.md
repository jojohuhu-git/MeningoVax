# MeningoVax — Handoff: what needs doing next (2026-09-17, evening)

**This is the current file. It supersedes `handoff-2026-09-17f-part2-done-and-two-audits.md`,
which was written twenty minutes earlier and left one owner decision open. That decision has
since been made and is recorded below.**

Repo: `~/Downloads/MeningoVax-main`. Meningococcal-only clinical advisor (MenACWY + MenB +
pentavalent), browser-only, no backend, live at https://jojohuhu-git.github.io/MeningoVax/.
Its core promise is **honesty**: a silently wrong answer is worse than a crash.

## State, verified just now — not remembered

| | |
|---|---|
| `main` | **5754b16** — "P2-3: every age threshold now lives in one place (#36)" |
| Suite | **1307 passing, 102 files, 0 failing, 0 failed test files** |
| Branch | `docs/2026-09-17-audit-queues`, clean, pushed, **PR #37 open, `test` check SUCCESS** |
| Work in progress | **none** — nothing is half-built, no code is uncommitted |

PR #37 contains documents only. It can be merged or left sitting; it blocks nothing.

---

## What is finished (do not redo)

- **MeningoVax itself is finished** by the definition in
  `plan-2026-09-17-finishing-meningovax.md`. Its Part 2 item 1 (age thresholds → one home)
  merged as PR #36 with a 28,896-patient differential sweep behind it; item 2 (the
  clinician rulebook) is refreshed and published at version 5 and now says there are no
  open gaps, both former gaps having been re-verified in the running app first.
- Both of the "looks" that plan asked for have been **run, read-only**. Their queues are
  `docs/archive/fix-2026-09-17-calendar-and-dates.md` and
  `docs/archive/fix-2026-09-17-impossible-entries.md`. (Copies sit in `.claude/prompts/`,
  which is **gitignored here** — the `docs/archive/` ones are the copies that travel.)

---

## Owner decisions already on record — apply them, do not re-ask

1. **Impossible-entries P1-2 — build it, as a quiet note, never a block.** Asked whether a
   risk factor should be questioned when it cannot apply at that age, the owner said yes
   ("such as an infant microbiologist"), and shown the full set of examples chose the
   **note-on-the-card** option over a blocking prompt. The full spec, the four tick-boxes
   in scope, and — importantly — **the eight that must NOT be touched** are written into
   the impossible-entries queue under P1-2. Read that section before writing a line.
2. **Part 2 item 3, the card wording owed to PneumoVax, stays deferred.** The owner said
   "do not touch PneumoVax" and confirmed it when asked directly. Tracked, not dropped;
   it is a debt to the other repo, not a gap in this one.
3. **The vaxapp meningococcal ports remain on hold.** Standing decision. The two apps
   knowingly differ. Do not port piecemeal — that is how they came to differ.

---

## The queue — nothing below has been started

Work one item at a time, in this order. Both queues meet at the same question (what to do
with an age that cannot be true), so the calendar one first makes the second easier to word.

| # | ID | Queue | What |
|---|---|---|---|
| 1 | **P1-1** | calendar | `calendarMonthsBetween()` takes the fraction of a month from the wrong month's length. A baby born 31 Jan has a **negative age** on 1 Feb and the app answers a correct date of birth with "Please enter a valid age before continuing" — reproduced in the browser with the page clock set to that day. **Fix this first: every schedule decision passes through this function.** |
| 2 | **P1-2** | calendar | Should fall out of #1 — a leap-day child is still on the infant schedule on the app's own reckoning of their second birthday. Verify; do not write a second fix. |
| 3 | **P0-1** | impossible-entries | A date of birth with the year typed `0026` shows "2000 years 7 months · Adult (19+)" and carries on, silently changing an infant's dose-2 advice from "12 weeks and after the first birthday" to "8 weeks". The Years/Months boxes accept 999 years — `max="120"` is never enforced. Self-contained; could equally go first. |
| 4 | **P1-3** | impossible-entries | Every negative age renders as "Birth · Infant (<2y)". Two lines, and it makes #5 visible while you work on it. |
| 5 | **P1-1** | impossible-entries | A dose dated before birth is blamed on the patient's age ("Given at ~birth") and you are told to repeat it. Best done with #6, which is what lets the app know what "before birth" means. |
| 6 | **P1-3** | calendar | The date of birth is thrown away, so "Booster due at 16y" prints a date 1–3 days wrong in 63% of cases — while the Age step promises precision in exchange for that date of birth. Structural: keeping the date of birth also removes calendar P2-1. |
| 7 | **P1-2** | impossible-entries | The risk-factor note. Owner-approved (see above). |
| 8 | P2s | both | Age-at-dose 3.2 days out; four independent clock reads per render; month-end grace effectively 7 days; a product recorded before it existed; `NaN`/`Infinity` ages (**not reachable through the UI** — robustness only). |

### One thing to check before item 7

`recommend.js` and the clinician rulebook both assert **"ACIP's microbiologist table covers
ages 10 and up only"**, and that claim currently justifies a real behaviour (a flat 5-year
booster interval with no under-7 variation). A live fetch of the ACIP 2020 MMWR on
2026-09-17 **could not confirm it** — the page-to-text conversion found no such table. That
is not proof it is wrong, but it is an unsourced-looking claim doing real work. Check it
against the MMWR PDF. If the table does say 10 and up, that is a sourced floor and the note
for microbiologists can cite it instead of resting on plausibility.

---

## Why this is a good stopping point

Nothing is half-done. `main` is green and deployed, the two queues are complete documents
written to be executed by a session with no other context, and the one question that was
blocking them has been answered. PR #37 is documents only, so it holds nothing up whether
it lands or not.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull` — or the
   `docs/2026-09-17-audit-queues` branch if PR #37 is still open. **Check first.**
2. Run `npx vitest run` and confirm **1307 passing** before touching anything. Check
   `numFailedTestSuites`, not just failed tests: a file that crashes while *loading* runs 0
   tests, reports 0 failures, and still fails CI.
3. Start the dev server with `preview_start` and `.claude/launch.json`. Other chats have had
   servers on 5179/5180 and this session's landed on **5181** — **do not kill another
   chat's server without asking.**
4. **Ask which item to start with** if it is not obvious from the table above — but do not
   re-open the three decisions already recorded.
5. Per item (`fix-queue` skill): reproduce → **failing test first** → fix → full suite green
   (quote the real number) → drive the running app if it is UI-observable → commit named by
   the item ID.
6. **Calendar P1-1 needs a differential sweep**, not just a green suite. Capture every card
   and every validator verdict over a wide patient grid before and after and read the diff;
   the harness used for PR #36 (28,896 patients, ages 0–100 × 12 risk combinations × two
   dose spacings × seven dose histories) is the pattern. A green suite proves the app still
   does what the tests expect, not that it still does what it did.
7. **Use awkward test patients on purpose** — fractional ages, month ends, leap days, dates
   a day either side of a cut-off. A whole-number test patient is exactly what let "eligible
   undefined 17, 2027" reach the live site.
8. Push policy: `main` is not protected here, but the habit is branch → PR → squash merge.
   The owner merged #35 and #36 in-session on 17 September rather than reviewing first; she
   has not said that is the standing rule, so **ask before merging**.
