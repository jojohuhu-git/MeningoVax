# Fix queue — MeningoVax, the impossible-entries angle

**Written 17 September 2026 (evening). Read-only audit; nothing was changed.**

The second and last of the "looks" named in
`docs/archive/plan-2026-09-17-finishing-meningovax.md`, Part 6: **impossible or mistyped
entries** — a birth date in the future, a dose dated before birth, a year typed wrong.
The plan said this angle was "not covered at all" and predicted "a real haul, and easy
findings to fix". Both halves of that turned out to be right.

The pattern running through every finding: **the app already knows how to do this well
in one place, and does not do it anywhere else.** A dose dated in the future gets a
model answer —

> "This date is in the future — today is 17 September 2026. A dose cannot have been given
> yet, so it is not counted. **Check the date: if the year is a typo, correct it**; if
> this is an appointment the patient has not attended yet, take it out of the record."

— which names the real problem, explains the likely cause, and refuses to advise an
injection. Every finding below is a case where the same class of mistake gets no such
treatment, and the app answers confidently instead.

---

## Baseline, measured not remembered

| | |
|---|---|
| Branch / sha | `main` at **5754b16** |
| Test suite | **1307 passing, 0 failing, 0 failed test files** (17 Sep) |
| Dev server | port 5181, `/MeningoVax/` |
| Existing coverage of this angle | the future-dated dose (`g3-future-dated-dose-ui.test.jsx`) and the duplicate-date dose (`g7`). Nothing else. |

## Ground rules that constrain any fix here

- **Honesty over helpfulness.** The product promise is that a wrong answer is worse than
  no answer. Where the input cannot be true, the app should say which field is wrong —
  not answer as if it were.
- **Say what is wrong with the DATE, not with the patient.** The future-dose message is
  the house style; match it.
- **Never advise an injection on the strength of a typo.**
- **Plain English, no jargon** (CLAUDE.md): the reader is a clinician, not an engineer.
- Per item: reproduce → failing test first → fix → full suite green (quote the real
  number) → drive the running app → commit named by the finding ID.

---

# P0

## P0-1 · A mistyped year in the date of birth silently changes the clinical advice

**Reproduced in the running app.** In the date-of-birth field, type the year as `0026`
instead of `2026` — one keystroke short, and the commonest mistake there is in a
four-digit year box. The app shows:

> **2000 years 7 months · Adult (19+)**

and lets you carry straight on to the next step. No warning, no query.

**Why it matters.** It does not fail loudly — it answers, and the answer is wrong for the
patient in the room. Same baby, same risk factor, one digit apart:

| Date of birth entered | What the card says |
|---|---|
| 2026-02-02 (the 7-month-old actually in front of you) | **"Dose 1 of 2 (infant high-risk 7–11mo)"** — dose 2 at least **12 weeks** later **and after the first birthday** |
| 0026-02-02 (the typo) | **"Dose 1 of 2 (high-risk primary series)"** — dose 2 at least **8 weeks** later, no age floor |

Both look like ordinary, plausible cards. A clinician who does not notice the age chip
gives the second dose a month too early and before the first birthday, which ACIP does
not count.

**The same door is open in the other entry mode.** The Years / Months boxes carry
`max="120"`, but the app reads the typed value directly, so the attribute never bites:
typing **999** years is accepted and displays "999 years · Adult (19+)". (Confirmed live.
A negative number of years *is* caught, at the Next button.)

**Expected.** An age outside the range a human being can be should be refused at the
point of entry, in both modes, with a message that names the field — the future-dated-dose
message is the model. A date of birth in the future is already refused, but only with the
generic *"Please enter a valid age before continuing"*; it should say the date of birth is
in the future.

**Suspected location.** `src/components/StepAge.jsx:31-49` (both `handleDobChange` and the
years/months handler), `src/logic/format.js:99` `dobToAgeMonths()`, `src/App.jsx:49`.

**Suggested fixture.** A DOB whose year is 0026, 0226 and 1826; years typed as 999, 121,
and 120; a DOB one day in the future. Each must be refused with a message naming the
field, and no recommendation may be produced.

---

# P1

## P1-1 · A dose dated before the patient was born is blamed on the patient's age, and you are told to repeat it

**What happens.** A 16-year-old with a MenACWY dose whose year was typed as **1926**
instead of 2026:

> **"Given at ~birth, below the minimum age of 2 months for this brand. This dose does not
> count toward the series: repeat this dose only (do not restart the series)."**

Two things are wrong with that sentence. The dose was not given at birth — it was given
a hundred years before the patient existed. And the advice is to **give another
injection**, on the strength of a typo, for a dose the patient has already had.

Contrast the future-dated dose, which says the date is the problem and explicitly
suggests the year may be a typo. This is the same mistake in the other direction, and it
gets the opposite treatment.

**Reproduced** in the engine for both a plain before-birth date (patient 24 months old,
dose dated 2020) and the 1926 year-typo case. Every before-birth date behaves the same
way, because the computed age at the dose is negative and therefore always below every
product's minimum age.

**A structural note.** The app cannot presently detect "before birth" at all, because it
does not keep the date of birth — only an age in months (see the calendar queue, P1-3).
Keeping the date of birth is what makes this check possible, and is a shared fix. Without
it, the best available test is "the computed age at this dose is negative", which catches
the same cases.

**Expected.** A dose that predates the patient's birth should be reported as a *date*
problem, in the house style: the date cannot be right, here is the likely cause (a year
typo), correct it — and no injection should be advised on the strength of it.

**Suspected location.** `src/logic/validate.js` — the age check that produces "below the
minimum age" (around the `recordProblemResult` family that already handles `future` and
`duplicate`; add a sibling).

**Suggested fixture.** Patient 24 months, dose dated four years ago. Patient 16 years,
dose dated 1926. Both: the verdict names the date, not the age, and the advice does not
contain "repeat this dose".

---

## P1-2 · Risk factors that cannot apply at that age are accepted, and acted on

**What happens.** A newborn can be ticked as a **first-year college student living in a
residence hall**, and the app answers:

> **"1 dose"** · due today · *"A single MenACWY dose for a first-year college student
> living in a residence hall."*

Same for **military recruit** and **microbiologist** at any age:

| Patient | Ticked | Card |
|---|---|---|
| newborn | college dorm | "1 dose", due today, **no brand offered at all** |
| 1 month | college dorm | "1 dose", due today, **no brand offered at all** |
| 2 months | military recruit | "1 dose", due today, Menveo 2-vial |
| 3 months | microbiologist | "1 dose (ongoing-risk indication)", due today, Menveo 2-vial |
| 5 years | college dorm | "1 dose", due today, MenQuadfi or Menveo |

Below 2 months the card is the strangest of all: **a dose is due today and there is no
product to give it with**, because no MenACWY vaccine is licensed that young. (That empty
list is correct and new as of PR #36 — before it, the card offered Menveo, which is not
licensed until 2 months. The empty list makes the underlying oddity visible rather than
causing it.)

**The app already knows these are adult indications.** `menacwyInfantSeriesIndicated()`
deliberately excludes microbiologists and military recruits from the infant series,
because — as the rulebook puts it — "those tables have no infant row at all", and ACIP's
microbiologist table covers ages 10 and up only. That knowledge is used to pick a
schedule and not used to question the tick-box.

### OWNER DECISION, 2026-09-17 (evening): build it, as a quiet note. Never a block.

Asked directly, the owner ruled: **"Yes a risk factor can be questioned if it doesn't
apply at that age - such as an infant microbiologist."** Shown the full set of examples,
she chose **option 2 — a note on the card, nothing blocked.**

**Why never a block.** The ACIP 2020 MMWR was fetched live on 2026-09-17 to find the age
floor for these three indications. **There isn't one.** The recommendations read, verbatim:

> "microbiologists routinely exposed to isolates of *Neisseria meningitidis*"
> "unvaccinated or incompletely vaccinated first-year college students living in
> residence halls"
> "military recruits"

No age wording at all. So any floor the app applies is a **plausibility judgement, not a
clinical rule** — which makes blocking, or refusing to answer, the app inventing guidance
ACIP did not write. It must ask, and then get out of the way. This also rules out the
third option originally sketched (a "Needs input" prompt that gates the recommendation):
the owner wants it softer than that unless someone is actually seen mis-ticking one.

### The four tick-boxes in scope, and the eight that must NOT be touched

Measured against the engine on 2026-09-17. **Getting the second list wrong would be a
clinical error, so it is written out in full.**

| In scope | What the app does today at a young age | Note it from below |
|---|---|---|
| `microbiologist` | **"Dose due today — 1 dose (ongoing-risk indication)"** at newborn, 6 months, 3 years, 8 years | ~16 years |
| `military` | **"Dose due today — 1 dose"** at every age tested | 17 years |
| `college_dorm` | **"Dose due today — 1 dose"** at every age tested | ~16 years |
| `pregnancy` | *Nothing visible* — but it is tickable for a 3-year-old and silently sets `deferMenB` | ~9 years |

Only the first three currently instruct anyone to vaccinate. Pregnancy is latent: at those
ages MenB is not due anyway, so nothing shows. Fix it at the same time; do not rank it
higher than it is.

**The thresholds above are deliberately conservative** — early-entrance college students
at 16 and high-school lab interns are real, and the note must not cry wolf on them. They
are plausibility floors for a *question*, not eligibility floors for a *dose*.

| Must NOT be questioned | Why |
|---|---|
| `asplenia`, `complement`, `hiv` | Infants genuinely have all three. The app correctly puts them on the infant series. A note here would be a clinical error. |
| `travel`, `outbreak_acwy` | ACIP prints an infant row for both. A 4-month-old going to the meningitis belt is exactly who that row is for. |
| `outbreak_b` | Already handled by the MenB product floor — the card reads "Not yet age-eligible". |
| `hct` | A baby can have a transplant. Advisory only; correct as it stands. |
| `hct_cart_bcell_exclude` | Hard stop at every age; correct. |

### The spec

- A **minimum plausible age per indication**, stored beside the tick-box definitions in
  `src/data/riskFactors.js` — the file that already owns what each indication means.
  Four entries only; every other risk factor has none, and absence means "never question".
- Below that age, the card carries one extra line. Draft copy, in the house style of the
  future-dated-dose message (name the doubt, explain it, do not overrule):

  > "This indication is usually an adolescent or adult one. Check the age is right."

  Word the final version against `design-review`; it is clinician-facing copy.
- **Nothing is blocked, nothing is withheld, no recommendation changes.** The dose still
  shows as due. This is a note, not a gate.
- Surface it wherever the note lands — `recommend.js` builds the card note, so the line
  belongs in the note's `detail`, not in a component.

### One thing to verify first

`src/logic/recommend.js` (the microbiologist booster branch) and the clinician rulebook
both assert that **"ACIP's microbiologist table covers ages 10 and up only"**, and that is
what justifies the flat 5-year booster interval with no under-7 variation. The live fetch
on 2026-09-17 **could not confirm it** — the summariser found no such table. That is not
proof it is wrong (the tables may not have survived the page-to-text conversion), but it
is an unsourced-looking claim currently justifying real behaviour. **Check it against the
MMWR PDF before writing the 16-year floor for microbiologists**, since if the table does
say 10 and up, that is a sourced floor and the note for that one indication can cite it.

**Suspected location.** `src/data/riskFactors.js` (the four minimum ages), read in
`src/logic/recommend.js` where the card note is built.

**Suggested fixture.** Each of the four indications at an age below its floor: the note
appears, the recommendation is unchanged, and the dose still shows as due. Each of the
eight others at newborn and 6 months: **no note appears** — that assertion is the one that
stops a future tidy-up from generalising this to every risk factor.

---

## P1-3 · An impossible age is displayed as a normal one

`fmtAgeMonths()` renders **every** negative age as `"Birth"`, and `ageGroup()` labels it
`"Infant (<2y)"`:

| Value | Displayed as |
|---|---|
| −0.5 months | Birth · Infant (<2y) |
| −52 months | Birth · Infant (<2y) |

So a value that cannot exist is shown as the most ordinary value there is. This is how
the before-birth dose in P1-1 comes to read "Given at ~birth", and it is why the
month-end negative age in the calendar queue (P1-1 there) is invisible until it hits the
`>= 0` guard.

**Expected.** A negative age is a bug or a typo, never a patient. It should render as
something that cannot be mistaken for a real age, and the caller should be the one to
decide what to say about it.

**Suspected location.** `src/logic/format.js:39` (`fmtAgeMonths`) and `:88` (`ageGroup`).

**Suggested fixture.** `fmtAgeMonths(-0.5)` and `fmtAgeMonths(-52)` must not equal
`fmtAgeMonths(0)`.

---

# P2

## P2-1 · A product recorded years before it existed is accepted without comment

| Recorded | Verdict |
|---|---|
| Penbraya dated 2015 (the pentavalent MMWR the app cites is **2023**) | **valid**, no comment |
| Bexsero dated 2000 | **valid**, "Counted — high risk confirmed at ~13 years 8 months" |
| MenQuadfi dated 2005 | **valid**, no comment |
| Menveo dated 1995 | **valid**, no comment |

The app checks a dose against the patient's age and against the interval before it, but
has no notion of when a product came into existence — so a transcription error of this
shape passes silently and is counted toward the series.

A licensure date per product would sit naturally beside `minAgeM` in
`src/data/brands.js`, which already owns the product facts. **The dates themselves must be
verified from FDA/CDC before being written down** — the repo's own refs date the
pentavalents (Pfizer 2023, GSK 2025) but the others are not recorded anywhere in the app,
and this queue deliberately does not assert them.

Low priority: it produces a wrong "counts" verdict, but only for a record that is already
badly wrong in a way a clinician reading the row would likely notice.

## P2-2 · The engine answers for ages that are not numbers

Passed `NaN` or `Infinity` as an age, `recommend()` returns "Not routinely indicated"
rather than refusing, and the age renders as "NaN years NaN months" / "Infinity years NaN
months".

**Not reachable through the UI today** — checked live: the browser's number input rejects
`1e400` and clears the field, and text cannot be typed into it. Filed as a robustness
note only, and worth a guard if `ageMonths` ever arrives from anywhere but those two
inputs.

---

# Checked and found already handled

Recorded so the next audit does not re-plough this ground. These are all genuinely good,
and several are the model the findings above should copy:

- **A dose dated in the future** — names the date as the problem, suggests a year typo,
  distinguishes an appointment from a dose, does not count it, does not advise repeating
  it. The house style.
- **The same date entered twice** — read as one shot typed twice rather than as two doses
  nought days apart, counted once, and the duplicate row queried.
- **A date of birth in the future** — refused (though with a generic message: see P0-1).
- **A negative number of years** in the Years/Months boxes — blocked at the Next button.
- **The date picker** caps at today.
- **Twelve MenACWY doses on one record** — every row gets its own honest verdict ("Given
  before age 10 … does not count", "Given at ~11 years 5 months, before the age-16 booster
  window"), the counting is correct, and nothing crashes.
- **An undated dose beyond the series total** — the app asks whether an extra dose was
  meant rather than guessing.
- **A dose below the product's minimum age** — invalid, repeat that dose only, never
  restart the series.

---

# Recommended order

1. **P0-1** — the only finding that silently changes clinical advice. Self-contained;
   needs no other work first.
2. **P1-3** — two-line change, and it makes P1-1 visible while you work on it.
3. **P1-1** — best done alongside the calendar queue's P1-3 (keep the date of birth),
   which is what lets the app know what "before birth" means. If that is not being done
   yet, the negative-age test catches the same cases.
4. **P1-2** — **ask the owner first.** Three options are written up; do not pick one.
5. **P2-1** — needs the licensure dates verified from FDA/CDC before any code is written.
6. **P2-2** — a guard, or nothing.

**A note on sequencing with the calendar queue.** The calendar queue's P1-1 (the age
function returning a negative age at month ends) and this queue's P1-3 and P1-1 all meet
at the same place: what the app does with an age that cannot be true. Doing the calendar
P1-1 first means the only remaining negative ages are genuine typos, which makes the
message here easy to word.
