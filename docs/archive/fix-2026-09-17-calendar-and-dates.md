# Fix queue — MeningoVax, the calendar angle

**Written 17 September 2026 (evening). Read-only audit; nothing was changed.**

This is the first of the two remaining "looks" named in
`docs/archive/plan-2026-09-17-finishing-meningovax.md`, Part 6: **dates and the
calendar** — leap days, the end of a month, the 31st, year boundaries, time zones and
midnight. The plan called it "the biggest remaining haul". It was not: the date helpers
have been hardened twice already (P0-4/P0-5 on 15 September, P0-1a on 17 September), and
the things that usually break in a browser app — timezone-shifted display, DST, a UTC
"today" — are all correctly handled and were tested here and found clean.

What it did find is **one arithmetic flaw with three separate symptoms**, plus two
smaller things. One symptom is a real newborn the app refuses to accept.

---

## Baseline, measured not remembered

| | |
|---|---|
| Branch / sha | `main` at **5754b16** (PR #36, "every age threshold now lives in one place") |
| Test suite | **1307 passing, 0 failing, 0 failed test files** (`npx vitest run`, 17 Sep) |
| Dev server | port 5181, `/MeningoVax/` — started from `.claude/launch.json` |
| Calendar coverage today | 102 test files; **2** mention a leap year, **1** uses 29 February, **3** mention a month end or the 31st, 9 mention UTC/timezone |

## Ground rules that constrain any fix here

From `CLAUDE.md` and the plan:

- **One number, one home.** Three of the findings below are the same root cause. Fix the
  cause once; do not patch the three call sites.
- **Never write a number out in words as well** — card text interpolates.
- **Awkward test patients on purpose**: fractional ages, month ends, leap days, dates a
  day either side of a cut-off. A whole-number test patient is what let the "eligible
  undefined 17, 2027" fault ship.
- **Never adopt a reading that recommends fewer doses** than AAP/ACIP. Two findings below
  are in the *accept* direction; that is the safe direction and must stay that way.
- Per item: reproduce → failing test first → fix → full suite green (quote the real
  number) → drive the running app → commit named by the finding ID.

---

# P0 — none

Nothing found in this angle produces a silently wrong *clinical* recommendation. The
worst finding is a visible refusal, not a silent wrong answer.

---

# P1

## P1-1 · A baby born at the end of a month has a **negative age**, and the app refuses to accept them

**What happens.** `calendarMonthsBetween()` computes the fractional part as
`(endDay − startDay) / daysInEndMonth`. When the start day-of-month is larger than the
number of days in the end month, that fraction is more negative than the whole-month
count is positive, and the age comes out below zero.

`StepAge.jsx:41` then drops it (`if (am != null && am >= 0)`), `App.jsx:49` sees
`ageMonths == null`, and the clinician is told:

> **"Please enter a valid age before continuing."**

**Reproduced in the running app**, not only in the engine: with the page's clock set to
1 February 2026, entering a date of birth of **31 January 2026** — a one-day-old baby —
clears the field and prints that message. The app computes the baby's age as
**−0.0714 months**.

**Which patients.** The start day must exceed the length of the end month, so it is
February-only. In a normal year:

| Born | Refused on |
|---|---|
| 30 January | 1 February |
| 31 January | 1 February and 2 February |

Three days a year — but for those babies the app is unusable, and an at-risk newborn
(asplenia, sickle cell) is exactly the patient who needs it.

**The same flaw, one day wider.** On the days either side the age is not negative but is
**understated**, and it is **not monotonic** — a child gets younger overnight:

| Born | Date | Age the app computes |
|---|---|---|
| 31 January 2026 | 31 January 2027 | 12.0000 months |
| 31 January 2026 | **1 February 2027** | **11.9286 months** |

The final MenACWY infant dose may not be given before 12 months of age. This child
reaches 12 months, then drops back under the gate for two days. (CDC's 4-day grace
rescues *validity*, so no dose is wrongly rejected — but the grace does not apply to
which schedule a patient is on. See P1-2.)

**Expected.** An age must never be negative and must never decrease as time passes. The
app's own `addCalendarMonths()` already implements the clamping convention (31 Jan + 1
month = 28 Feb); `calendarMonthsBetween()` should agree with it. Today the two disagree
on 13 of the 40 month-end spans tested.

**Source of truth.** Internal consistency: there is no ACIP rule about what a
month-end birthday means, but the app must not hold two opinions about the same child's
birthday. CDC's 4-day grace (already in `intervals.js`) is the only tolerance ACIP
grants, and it is a rule about *doses*, not a licence for the age arithmetic to wobble.

**Suspected location.** `src/logic/dateUtils.js:52-58`, `calendarMonthsBetween()`.

**Suggested fixture.** `dateUtils` unit tests: born 2026-01-31 → age on 2026-02-01 is
≥ 0; age on 2027-01-31 is ≥ age on 2027-02-01 is not true today. Sweep every birth date
in a leap year and a normal year × 400 following days and assert the age is
non-negative and non-decreasing. Plus a `StepAge` UI test: a one-day-old born on the
31st is accepted.

---

## P1-2 · A child born on 29 February is on the infant schedule on their second birthday

**What happens.** Same root cause, seen at a threshold that has no grace.

Child born **29 February 2024**, asplenia, no doses yet:

| Today | Age the app computes | Card |
|---|---|---|
| 28 February 2026 (`addCalendarMonths(dob, 24)` — the app's own second birthday) | 23.9643 months | **"Dose 1 of 2 (high-risk 12–23mo)"** |
| 1 March 2026 | 24.0968 months | "Dose 1 of 2 (high-risk primary series)" |

So on the day the app itself calls the child's second birthday, the app puts them on the
under-2 schedule. Both schedules are two doses, but the interval differs: the infant
band asks for **12 weeks and not before 12 months of age**, the ≥2y band for **8 weeks**.
A clinician following the card on 28 February is told to come back four weeks later than
the one who comes on 1 March.

**Why it is not a grace-rule problem.** `ageMeetsMinimum()` grants CDC's 4 days when
judging whether a *recorded dose* counts. Choosing which schedule a patient is on
(`am < MENACWY_INFANT_SERIES_MAX_AGE_MONTHS`) is a plain comparison with no grace, by
design — granting grace there would put a patient on the adult schedule days early.

**Expected.** The age and the anniversary must agree. Fixing P1-1 fixes this.

**Suspected location.** Same: `dateUtils.js:52-58`. Consumers to re-check afterwards:
`recommend.js` (infant door), `seriesTotals.js`, `validate.js`.

**Suggested fixture.** Leap-day child, every threshold in `ages.js`, asserted on the day
before / the day of / the day after the app's own anniversary date.

---

## P1-3 · "Booster due at 16y" prints the wrong date 63% of the time, even when the exact date of birth was entered

**What happens.** The Age step says, in its own subtitle:

> "Date of birth is recommended: **it lets dose dates be checked precisely (e.g. against
> the 16th birthday)**"

But the date of birth is **thrown away**. `StepAge.jsx:41` converts it to a number of
months and stores only that (`App.jsx` state has no `dob` field). The 16th-birthday date
on the card is then reconstructed by multiplying months by an averaged 30.4375 days:

```js
const monthsUntil16 = MENACWY_ROUTINE_BOOSTER_AGE_MONTHS - am;
const boosterDueDate = addDays(today, DAYS.months(monthsUntil16));
```
`src/logic/recommend.js:1018` and `:1062`

**Measured** over 8,400 (date of birth × today) pairs, comparing the printed date with
the patient's actual 16th birthday:

| Error | Share |
|---|---|
| exact | 37% |
| 1 day out | 51% |
| 2 days out | 11% |
| 3 days out | <1% |

Worst case found: born 26 March 2011, viewed on 28 February 2026 — card says **29 March
2027**, the birthday is **26 March 2027**.

**Expected.** When the clinician gave a date of birth, the app should print the actual
birthday. Three days is not clinically dangerous, but the app promised precision in
return for the date of birth and did not deliver it — and this is the one date on the
card a parent will write in a diary.

**The structural fix.** Keep the date of birth in state and derive `ageMonths` at render
from it. That single change fixes this, removes the "age frozen at typing time" problem
(P2-1), and lets P1-1's fix be checked against a real birthday rather than an inferred
one. Patients entered as years/months keep today's behaviour and should keep saying
"about" — the app genuinely does not know their birthday.

**Suggested fixture.** Every day-of-month × every month of birth: with a date of birth
entered, the printed booster date equals `addCalendarYears(dob, 16)` exactly. With
years/months entered, the card must not imply a precision it does not have.

---

# P2

## P2-1 · The patient's age is frozen at the moment the date of birth was typed; "today" is not

`ageMonths` is computed once, in the Age step, against the clock at that instant.
Everything afterwards — dose validity, "due today", the future-dated-dose check — reads
`todayISO()` live, from **four independent call sites** per render
(`format.js:101`, `validate.js:1153`, `RecCard.jsx:357`, `DoseEditor.jsx:53`).

A tab left open across midnight therefore holds a patient who did not age while the
calendar did. Every recorded dose's computed age shifts by a day for each night the tab
stays open, because age-at-dose is `ageMonths − calendarMonthsBetween(dose, today)`.

Not a realistic clinic hazard for a single patient seen in one sitting, and no wrong
advice was reproduced from it. Filed because the structural fix in P1-3 removes it for
free, and because four independent clocks in one render is the same "one number, one
home" pattern the whole September queue has been about.

## P2-2 · Age-at-a-past-dose is up to 3.2 days out, because two fractions use different month lengths

`ageAtDose = ageMonths − calendarMonthsBetween(doseDate, today)`. Both terms take their
fractional part from **today's** month length, but the true age at the dose depends on
the **dose's** month length. Worst case measured: born 31 January 2010, dose 1 January
2026, viewed 28 February 2026 — the app says 190.93 months, the true age was 191.03, a
gap of **3.2 days**.

CDC's 4-day grace absorbs this for dose validity in every case measured. It is visible
in the record panel's printed age ("Given at ~15 years 11 months") and it feeds the
no-grace threshold comparisons. Fixing P1-1 should be checked against this too — a
correct `calendarMonthsBetween` makes the subtraction consistent.

## P2-3 · At a month end the 4-day grace is quietly 7 days

A dose due "2 months after 31 December" has its anniversary clamped to 28 February —
three days earlier than a strict reading — and then CDC's 4-day grace is applied on top,
so a dose given on 24 February is accepted as 2 months. This is in the *accept*
direction, which the codebase treats as the safe one (never demand an injection the
patient does not need), and ACIP gives no rule for month-end arithmetic. Filed so that
whoever fixes P1-1 knows it is a deliberate consequence of clamping and not a new bug.

---

# Checked and found clean

Recorded so that the next audit does not re-plough this ground:

- **Time zones.** `fmtDate()` is pure string arithmetic — no `Date` parsing, so no
  off-by-one in a UTC-behind timezone. Verified identical output in UTC, Los Angeles,
  Tokyo, Kiritimati (+14) and Pago Pago (−11).
- **`todayISO()`** reads local wall-clock components, so it is the clinician's date, not
  UTC's. Verified across the same five zones.
- **Daylight saving.** `addDays()` and `daysBetween()` anchor at UTC midnight. Verified
  across both 2026 US transitions and by adding 1 day 365 times from 1 January
  (lands exactly on 1 January).
- **Month-end clamping in `addCalendarMonths()`** is correct: 31 Jan + 1 = 28 Feb,
  31 Aug + 6 = 28 Feb, 29 Feb + 4y = 29 Feb.
- **Leap-day anniversaries.** 29 Feb 2024 + 1 year = 28 Feb 2025 (clamped, one day
  early — the accept direction).
- **Booster due dates** (`earliestNextDate`) use `addCalendarYears`, not averaged days.
  `DAYS.years()` survives only as the `minIntervalDays` display value.
- **The test suite's own clock** is pinned (`src/test-today.js`, applied by
  `test-setup.js`), so fixtures no longer rot overnight.
- **The dose date picker** caps at `max={today}` from `todayISO()`.
- **No URL serialisation exists in this app**, so hand-edited state cannot inject an
  impossible date. (`App.jsx:34` says so explicitly.) Garbage dates reaching the helpers
  is therefore a question for the *impossible-entries* look, not this one — noted there:
  `addDays(null)` throws, `addCalendarMonths('')` returns `"0NaN-NaN-NaN"`, and
  `addDays('2026-02-30')` silently returns 3 March.

---

# Recommended order

1. **P1-1** — the root cause. Fix `calendarMonthsBetween()` so the age agrees with
   `addCalendarMonths()`'s clamping convention, is never negative, and never decreases.
   Sweep-test it before touching anything else.
2. **P1-2** — should fall out of P1-1. Verify with the leap-day child at every threshold
   in `ages.js`; do not write a second fix.
3. **P1-3** — keep the date of birth in state. Independent of 1 and 2, and it removes
   **P2-1** as a side effect.
4. **P2-2** — re-measure after P1-1; it may close on its own.
5. **P2-3** — a comment, not a code change, unless the owner wants the grace tightened at
   month ends.

**Do the differential sweep.** P1-1 changes an arithmetic function that every schedule
decision passes through. Capture every card and verdict for a wide patient grid before
and after, and read the diff — the harness used for PR #36 (28,896 patients) is the
pattern.
