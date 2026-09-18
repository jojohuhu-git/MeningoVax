> **STATUS, 17 September 2026 (evening): Part 2 items 1 and 2 are DONE and merged —
> the age thresholds (PR #36) and the rulebook refresh (artifact version 5). Item 3, the
> card wording owed to PneumoVax, is still deferred by the owner's instruction. Both of
> the "looks" this document asks for in Part 6 have been run, read-only:
> `fix-2026-09-17-calendar-and-dates.md` and `fix-2026-09-17-impossible-entries.md`, both
> in this folder. Neither queue has been worked yet.**
>
> **The reasoning in Parts 1, 3 and 5 stands and is still worth reading. It is the to-do
> list at the end of Part 6 that has been consumed.** See
> [handoff-2026-09-17f-part2-done-and-two-audits.md](handoff-2026-09-17f-part2-done-and-two-audits.md).

# Finishing MeningoVax — the plan, and why the bugs kept coming

Written 17 September 2026.

Two questions, answered in that order: **why did it feel as if the faults would never stop
coming**, and **what is actually left before MeningoVax is finished**. vaxapp comes after
that, and only after — it is deliberately left alone until MeningoVax is settled.

Nothing was changed to write this. Everything below was read, counted or re-run.

---

# Part 1 — Why it felt neverending

## Two different things were happening at once

**Old faults being uncovered.** Most of what September found had been in the app since it
was built. Uncovering it feels like the problem is growing, but a drawer being emptied is
not a leak. It has a bottom.

**Copies drifting apart.** The same rule written down in more than one place, with nothing
checking that the copies still say the same thing. This one does renew itself, and it is
the smaller of the two.

They feel identical from the outside. Told apart, they need opposite responses: the first
needs patience, the second needs structural work.

## What the record shows

For six of September's repairs, I traced the faulty lines back to the day they were
written:

| The repair | When the faulty line was actually written |
|---|---|
| The infant interval and the P1 group | 24 July, 24 July, 3 June |
| One pentavalent shot counting for both vaccines | 4 June, 4 June, 4 June |
| A risk answer staying with the right dose | 23 July, 23 July, 23 July |
| A future-dated dose counting as given | 4 June, 4 June, 14 September |
| The dose counter reading "dose 3 of 2" | 13 June, 13 June, 23 July |

The app's first line of code was written on **3 June**. Fourteen of the fifteen lines
sampled were written in June or July, several in the app's first two days. September was
spent emptying the drawer, not chasing new breakage.

Your own review of the rules says the same thing from the other side. Reading all 65 rules
one at a time against their sources, **62 were confirmed correct** and 3 were flagged. Of
those 3, one was a genuine fault, one turned out to be correct as written, and one had
already been fixed. That is not the profile of an app coming apart.

## Why the flow of findings never slowed down

Because each batch came from a **new way of looking**, used for the first time:

| The inspection | First used | What it turned up |
|---|---|---|
| Compare the two apps against each other | 15 Sept | 19 differences |
| Sweep every dose count and every chip | 14–15 Sept | 5, then 13 more |
| Feed it deliberately messy charts | 16 Sept | 8 gaps |
| Check every citation for age and for orphans | 16 Sept | 2 real faults, 2 dead sources |
| Check the written rules against the code | 16 Sept | 6 stale passages at once |
| Read every rule in plain English against its source | 17 Sept | the 4-weeks-should-be-8 fault |
| Search the code for second copies of a rule | 17 Sept | the dose-chip wording |

Roughly 63 findings in six days, because six new inspections were pointed at
three-month-old code. Every one had a large first haul and has been quiet since.

**What is running out is untried ways of looking, not faults.** That is the whole answer to
"it feels neverending".

## Every genuine drift had the same single cause

Not one of them was caused by the clinical rule being difficult. Every one was caused by
**the same number being written down in more than one place, with nothing checking that
the copies still agreed**.

How many copies exist predicts the trouble. How hard the rule is does not.

Two kinds of copy did more damage than the rest, because both are invisible:

**A copy living inside a test.** One of the automated checks kept its own private version
of the dose-chip wording, under a note promising it matched the app exactly. Measured
before anything was touched, the two disagreed on **21% of the 95,928 cases the check
runs**. That check exists specifically to prove the app never says "dose 3 of 2" — and its
private copy was the thing saying it. It could not have caught the fault it was written
for, and had we made the app match it, it would have stamped the fault as correct.

**A copy written in plain English.** The two rule documents carried a line asking whoever
changed a rule to update them at the same time. That honour system **failed six times in
one month**. Separately, the explanatory note at the top of the new intervals file went out
of date within a day of the work it describes, and told the next reader that finished work
was still outstanding — the most dangerous kind of stale note, because the obvious response
to it is to write yet another copy of a number that already has a home.

Words that restate a number drift faster than the number does, and nothing fails when they
do.

## The one fault we caused ourselves

In the whole September record there is exactly one, and its cause is worth remembering
because it is not a coding mistake.

After the infant-interval fix, a card printed "eligible undefined 17, 2027" instead of a
date. It reached the live site, on the very card the fix had just corrected.

It survived both the automated checks and the by-hand check because **the test patient was
aged exactly 7 months, with a birthday exactly 7 months earlier**. Whole numbers — the one
shape of input that could not fail. Real children almost never have a whole-number age.

Test patients chosen because the arithmetic is easy will test the case that works and skip
the case that does not.

## How to tell whether this is getting better

One cheap habit makes it measurable: on every new finding, record **two** dates — the day
it was found, and the day the faulty line was written. The second takes seconds to look up.

- If the "written" dates stay in June and July, the drawer is still being emptied and the
  bottom is in sight.
- If they start reading "last week", the balance has changed, and structural work should
  come before the next inspection.

---

# Part 2 — What is left before MeningoVax is finished

Three things. None of them depends on the other two.

### 1. The age thresholds — the last group of numbers still written twice

The work of giving each number a single home is done for dose totals and for the gaps
between doses. One group remains: the **ages** at which a dose becomes due, or at which a
child ages out of a series.

The two-copies problem is already visible in it. The part of the app that makes
recommendations keeps a list of these ages; the part that checks a record against them
types the number "under 24 months" out by hand instead of asking for it. Nothing makes them
agree. This is the same setup that produced the 4-weeks-should-be-8 fault.

Do it one group at a time, with every automated check passing in between.

### 2. Refresh the clinician rulebook

The plain-English rulebook you read still lists the MenB third-dose gap as an open problem.
It was fixed and shipped. There are now **no open clinical gaps** in MeningoVax, and the
rulebook should say so.

### 3. The wording changes owed to PneumoVax

The plain-English rewrite of the card text was done here and never carried across to
PneumoVax. You deferred it on purpose; it is tracked, not dropped.

**When those three are done, MeningoVax is finished** — every number has one home, every
rule matches its source, the written rules and the code are checked against each other
automatically, and the rulebook is accurate.

---

# Part 3 — The order that worked, and why to keep it

The order these were done in was not obvious, and getting it right mattered more than any
individual fix.

**First, write down every rule in plain English** — each one with the source it claims to
follow. This is the step that gets skipped because it produces nothing visible. It is also
the step that found the most, because it is the only one that compares *what the app does*
against *what its stated source says*. An automated check cannot do that: it only compares
the app against somebody's idea of the app. The 4-weeks-should-be-8 fault was found this
way, and no test would ever have caught it.

**Second, make the build fail when the words and the code disagree.** Only once the rules
are written down is there anything to check against. Done in the other order, these checks
simply freeze whatever the app happens to do today — faults included — and put a green tick
next to them.

**Third, feed it messy charts on purpose.** The rules being right and the app *reading the
patient's record correctly* are two different things, and the second is where eight of the
September gaps lived — doses out of order, a risk factor that began after dose 2, a brand
changed mid-series. Use records a real clinic would produce, and awkward numbers on purpose
(see the fault we caused ourselves, above).

**Fourth, and last, give each number a single home.** This is surgery on working clinical
logic, and it wants the checks from step two already in place. When it was done here, the
proof it was safe was not the test suite — it was running the old and the new versions side
by side over 2,784 made-up patients and comparing every card and every verdict, word for
word. Budget for that. It is what makes this kind of change honest rather than hopeful.

---

# Part 4 — Then, and only then, vaxapp

vaxapp's meningococcal half is **deliberately on hold**, by your standing decision. The two
apps knowingly differ right now; that is a choice, not an oversight.

The plan is to finish MeningoVax first, and then bring vaxapp up to it in one authorised
piece of work using the same four-step order above. Two things to hold to when that time
comes:

- **Do not port fixes across one at a time in the meantime.** Piecemeal porting is how the
  two apps came to differ in the first place.
- **Do not start at step four.** The single-home work is the tempting one to copy across
  first because it already exists and is already tested. Moved across before the rules are
  written down, it would simply pick whichever copy it happened to be handed — and there is
  no way to know in advance whether that copy is the right one.

---

# Part 5 — The habits that keep the drift from coming back

These are working rules for whoever does the work, not tasks for you. They are here so
the reasoning is on the record.

1. **One number, one home.** Every time a number gets a second home, expect it to drift.
2. **Never write a number out in words as well.** Card text should pull the number from
   wherever it lives, so the sentence cannot contradict the rule. The 4-weeks fault misled
   twice over because the number lived once as a value and once as the words "4 weeks".
3. **No private copies inside tests.** A copy in a test does not merely miss the fault —
   it certifies it. Where a check needs the app's wording, it must ask the app for it.
4. **Awkward test patients on purpose** — fractional ages, dates a day either side of a
   cut-off, doses entered out of order.
5. **Stop hand-maintaining prose that restates a number.** Either something checks the
   sentence against the code, or the sentence should not carry the number.
6. **Record when the faulty line was written, not just when it was found.**

---

---

# Part 6 — How many more looks before the findings stop?

## There is no number that reaches zero

Two of the sources never close, and neither is a fault in the app:

- **The guidance itself moves.** ACIP changes something roughly once a year. That is not
  drift, that is the world updating, and the app has to follow it.
- **Any change can introduce something.** Last month that ran at about one in sixty-three
  findings. Low, but it will never be nil.

So the goal is not zero findings. The goal is the point where a fresh look turns up **one
small thing instead of thirteen**.

## Why every new look has found something so far

Of the app's 101 automated check files, **77 are named after a fault that had already
happened**. The checks are a record of what has gone wrong, not a map of what ought to be
true.

That is the real reason each new angle keeps finding things. The ground was never covered
in the first place — only the scars were marked.

## What is left to look at

| The angle | Covered today? | What to expect |
|---|---|---|
| **Dates and the calendar** — leap days, the end of a month, the 31st, midnight in another time zone | Barely. 2 of 101 check files mention a leap year; none mention month-ends or time zones | **The biggest remaining haul.** This class has already caused two faults |
| **Impossible or mistyped entries** — a birth date in the future, a dose dated before birth, a year typed wrong | Not at all | A real haul, and easy findings to fix |
| **Several risk conditions at once**, where the rules interact | Partly — the citation sweep already covers 20 ages against 16 combinations | Smaller |
| **The app rather than the rules** — printing, a phone screen, the back button, editing a record halfway through | Not at all | Real findings, but not the kind that gives wrong clinical advice |

**Honest estimate: two angles with a meaningful haul left — the calendar one and the
bad-data one — and then it flattens.** That is an estimate drawn from where the gaps are,
not a promise.

## What you need to do

1. **Ask for the three items in Part 2 to be finished.** They do not depend on each other,
   so any order is fine — say "any order" and it will be taken care of.
2. **Then ask for two more looks, one at a time, in this order:** first the calendar one,
   then the impossible-entries one. One at a time matters — two at once produces a long
   list and the feeling of never-ending.
3. **Then stop asking for audits** and treat what comes in as maintenance.
4. **Watch one signal.** Whenever something new is found, ask: *when was that line
   written?* It takes seconds to look up, and the answer tells you which situation you are
   in:
   - **June or July** → still emptying the drawer. Keep going, nothing is wrong.
   - **Last week** → something we just did caused it. That is the signal to slow down and
     fix the structure before adding anything more.
5. **When ACIP changes its guidance, expect it.** That is not the app drifting; it is the
   app needing to follow a real change, and it is normal.

**The one thing not to do:** do not ask for a general "audit the app". A general audit is
what produces a thirteen-item list and the feeling that it will never end. Ask for **one
named angle at a time**, from the table above.

## Where things stood when this was written

| | |
|---|---|
| MeningoVax automated checks | **1253 passing, 0 failing** — run on 17 September, not remembered |
| Open clinical gaps in MeningoVax | none |
| Left to finish | the three items in Part 2 |
| vaxapp | on hold by your decision, until MeningoVax is finished |

---

## Appendix — for whoever does the work

Kept separate so the document above stays readable.

- **Age-threshold group:** `recommend.js` holds the map (around line 65); `validate.js`
  hand-types `ageMonths < 24` (around line 412) and `d1AgeM < 24` (around line 511) rather
  than asking for it. Move them into `src/logic/intervals.js`, one group at a time, suite
  green in between. The source scan in
  `__tests__/regression-p2-1-intervals-in-one-place.test.js` is the pattern to extend.
- **Already has a single home:** dose totals (`seriesTotals.js`), every minimum interval
  and the 4-day grace rule (`intervals.js`), dose-chip wording and colour
  (`components/doseChipLabel.js`).
- **Rulebook artifact:** https://claude.ai/artifact/JVP6gjQ1qEpWGjZGFHJbss — section 08
  still lists the MenB dose-3 rescue as open; it shipped.
- **Deferred, needs a decision first:** the automated check that the two apps agree. It
  needs a ruling on how to treat ages above 18, which vaxapp does not cover.
- **Counts quoted above** were measured on 17 September against the committed code, not
  the working copy.
