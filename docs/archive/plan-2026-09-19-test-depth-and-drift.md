> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# Plan — test depth and drift resistance (2026-09-19)

**Status:** NOT yet implemented. This is a specification for future implementation
sessions in `MeningoVax-main` only.

**Scope decision (owner, 2026-09-19):** do NOT port anything to `vaxapp` while this
plan is running. MeningoVax is being finalised first; cross-app alignment is a separate
job that happens once. If a session finds a meningococcal bug here, fix it here, note it
for the future vaxapp port, and do not open a vaxapp branch.

**What this plan does and does not do.** It makes the app *self-consistent* and *hard to
break by accident*. It does NOT check that the clinical rules are right — every expected
answer still comes from this project's own reading of ACIP. That gap closes only with
outside worked examples and a second clinician's blind review, which are deliberately
not in this plan. Do not let a green suite after this work be read as clinical validation.

Origin: the test-suite survey of 2026-09-19 (1,464 tests, 119 files, all green, main @
`19885fb`). This plan is items 2, 3, 4 and 6 of that survey's gap list. Item 1 (outside
answer key) and item 5 (vaxapp agreement) are deliberately out of scope.

---

## Order of work, and why

Do them in this order. Each one makes the next cheaper.

| # | Item | Why here |
|---|---|---|
| **0** | Rewrite `docs/agent/testing.md` | It is the map the next session reads. It is currently wrong. Fix it before anyone navigates by it |
| **A** | Measure what the tests never touch (survey item 6) | Cheapest, no risk, and its output tells you where B, C and D should point |
| **B** | Never-events swept across every patient (item 2) | Builds the shared grid that C then reuses for free |
| **B2** | Grid realism — fractional ages, real dates of birth, invalid doses | Fix the grid's blind spots BEFORE widening it, or C just multiplies them |
| **C** | Patients with more than one risk factor (item 4) | Mostly a one-line change to B's grid, plus hand-written clinical cases |
| **D** | Two-run relational tests (item 3) | Needs new scaffolding; independent of A–C, so it goes last |
| **E** | The standing drift defences | Built alongside B; this is what keeps the suite honest after this plan ends |

**One item per session. One commit per item.** Follow the `fix-queue` skill for each:
reproduce → failing test → fix → full suite → live-verify → commit. Follow the `ship`
skill for every branch and PR.

---

## The drift problem this plan must also solve

The owner's stated concern is that the suite drifts as more tests and code are added.
The survey found the pattern already starting:

- `sweep-dose-counter.test.js` defines its **own** hand-written list of 7 risk profiles.
  Add a 13th risk factor to `riskFactors.js` and no sweep widens. Nothing notices.
- That same file hardcodes `const TODAY = '2026-09-14'` while the suite is pinned to
  `TEST_TODAY = '2026-09-15'` in `src/test-today.js`. Two dates, one suite.
- `regression-chip-label-one-copy.test.js` exists *because* a sweep carried its own copy
  of the chip logic and the two silently disagreed on 20,167 rows.

So this is not a new problem — it is the same hand-typed-copy problem that
`seriesTotals.js`, `intervals.js` and `ages.js` were created to solve, now appearing in
the test fixtures instead of the source.

**The structural answer, to be built as part of item B and used by everything after
(referred to below as the shared grid):**

Create **`src/test-grid.js`** — one module that owns the patient grid, sitting alongside
the existing `test-today.js` / `test-why-this.js` / `test-note-text.js` helpers.

It must **derive** the grid from the app's own data, never restate it:

```
import { RISK_FACTORS } from './data/riskFactors.js';
import { ALL_BRANDS }   from './data/brands.js';
import { TEST_TODAY }   from './test-today.js';
```

- Risk profiles come from `riskFactors.js`, not a typed list. Add a risk factor to the
  app and every sweep widens on the next run, with no test edit.
- Brands come from `brands.js`, same reason.
- The date comes from `TEST_TODAY`, so there is one "today" in the repo.
- Age range comes from `StepAge.jsx`'s own `max` (the sweep already cites it in a
  comment — read it, don't retype it).

Then add **`regression-2026-09-19-sweeps-use-the-shared-grid.test.js`**, in the same
family as `regression-p2-1-intervals-in-one-place.test.js` and
`regression-p2-3-ages-in-one-place.test.js`: search the test files for a locally
declared list of risk ids or brand keys inside a sweep, and fail with the file name if
one is found. Keep the existing "in one place" tests' wording style — the failure
message must tell the next session what to import instead.

**Migrate `sweep-dose-counter.test.js` onto the shared grid as part of item B.** Its
current 7-profile list becomes the shared module's "one profile per distinct
menacwyClass/menbClass pairing" export, so nothing is lost.

---

## 0. Rewrite `docs/agent/testing.md` (first session, before anything else)

**Owner decision, 2026-09-19: do this first, not last.**

The document is the orientation file for anyone picking up test work, and it is wrong
in a way that actively misleads. Measured 2026-09-19:

| It says | Reality |
|---|---|
| "All tests run in the default `node` environment (no happy-dom needed — **no UI rendering tests yet**)" | **42 of 119 test files render React** under happy-dom, via a `// @vitest-environment happy-dom` line at the top of each |
| A table of **10** test files | **119** test files |
| Nothing about sweeps, tripwires, or the two-layer rule | The suite's three most distinctive patterns |

An agent that reads this before starting will conclude the UI is untested and rebuild
coverage that already exists — or, worse, write a logic-only fix for a visible bug
because it believes there is no screen layer to test.

**What the rewritten document must contain:**

1. The real shape, as counts, with the date they were measured and the command that
   produced them — so the next reader can tell whether the numbers have rotted.
2. The environment rule as it actually works: `node` by default, per-file opt-in to
   happy-dom with `// @vitest-environment happy-dom`.
3. The **two-layer rule** (a visible bug gets an engine test *and* a screen test, each
   naming the other in a comment) — currently a house convention with ~20 matched pairs
   and no written statement anywhere.
4. The **tripwire family** and what each one guards: `date-pinning`, `citation-freshness`,
   `citation-integrity`, `rule-docs-match-code`, `regression-p2-1-intervals-in-one-place`,
   `regression-p2-3-ages-in-one-place`, `regression-chip-label-one-copy`.
5. The **sweep pattern** — what `sweep-dose-counter.test.js` does, and (after item B)
   that `src/test-grid.js` is where the patient grid comes from.
6. The **worktree trap**: `.claude/worktrees/` holds a full second copy of `src/`, and
   `vitest.config.js` excludes it. Without that exclusion a clean tree reports ~197
   failures that mean nothing. This has already cost one session.
7. Drop the per-file table. It is 10 rows describing 119 files and it will rot again.
   Replace it with the categories and the one-line rule for finding the right file:
   a fix's tests are named for its queue ID.

**Then make it self-checking.** `rule-docs-match-code.test.js` already guards
`clinical-rules.md` and `meningococcal-rules-summary.md`. Extend it (or add a sibling) so
that the counts quoted in `testing.md` are checked against a real count of the test
files — if the document says 119 and the repo has 124, the suite goes red. A document
that cannot go stale silently is the only kind worth writing.

---

## A. Measure what the tests never touch

**What it is.** A standard tool watches the test run and reports which lines of the
source were never reached. The project has never used one, so "1,464 tests" is a number
with no denominator: an entire clinical pathway could be untested and the suite would
still be green. `recommend.js` is 121 KB and `validate.js` is 72 KB.

**Steps**

1. `npm i -D @vitest/coverage-v8` — the version must match the installed Vitest
   (`package.json` pins `vitest ^2.0.5`; the local run reports **v2.1.9**). If the
   versions disagree the tool refuses to start; it cannot corrupt anything.
2. Add to `vite.config.js` under `test:` — `coverage: { provider: 'v8', reporter:
   ['text', 'html'], include: ['src/**/*.{js,jsx}'], exclude: ['src/**/__tests__/**',
   'src/test-*.js'] }`.
3. Add `"test:coverage": "vitest run --coverage"` to `package.json` scripts.
4. Run it. Write the findings to `docs/archive/coverage-2026-09-19.md`: the headline
   percentage per file, and — the part that actually matters — **a list of the named
   functions and clinical branches in `recommend.js` and `validate.js` that were never
   entered.** Percentages are close to meaningless here; the list is the deliverable.
5. Add the coverage output directory to `.gitignore`.

**Do NOT** gate CI on a coverage threshold. CI currently runs `npm test` only, and
ESLint is deliberately ungated because of ~85 pre-existing errors. A second failing gate
would train the owner to ignore red, which is the exact failure mode `date-pinning.test.js`
was written to prevent. Revisit after the rest of this plan.

**Feed the result forward.** Any never-entered clinical branch found here becomes a
candidate case for items B, C and D, and should be listed in the handoff by name.

---

## B. Never-events, swept across every patient

**What it is.** `sweep-dose-counter.test.js` already generates 95,928 patient-rows —
every age from birth to 120 in three-month steps, crossed with 7 risk profiles and 0–5
doses — and asks each one a single question: does any dose chip read "dose 4 of 3"? It
earned its keep: it found a disagreement affecting 20,167 rows that every hand-written
test had missed.

There are at least six more properties that should be true of **every** patient, and each
is currently checked only on the handful of patients someone wrote down.

**The candidate properties.** Each needs a judgement call before it becomes an assertion:

1. No card recommends a product below its licensed minimum age.
2. No `earliestNextDate` falls before the dose it follows, and none is a nonsense date.
3. Every actionable recommendation (`due`, `catchup`, `risk-based`, `exposure`) carries
   at least one citation.
4. No recommendation returns an empty, `undefined` or unrecognised `status` — the known
   set is `due · catchup · risk-based · exposure · shared-decision · complete ·
   not-indicated · deferred`.
5. `recommend()` never throws, for any patient on the grid.
6. No card advises repeating a dose that ACIP would count (the four-day grace rule and
   the MenB dose-3 rescue are both places this has gone wrong before).
7. *(existing)* No dose chip implies N > M.

**The discipline that makes this safe — do not skip it.**

Land the sweep in **report-only mode first**: build the grid, evaluate all seven
properties, `console.log` a count and up to 20 examples per property, and **assert
nothing**. Commit that. Show the owner the output.

The reason: several of these have legitimate exceptions, and an agent that asserts
naively will get a flood of failures and may "fix" the app to satisfy a wrong assertion.
Known exceptions to expect —

- Property 1 vs. the **four-day grace rule** (`regression-p1-1-four-day-grace.test.js`):
  age gates are deliberately soft by four days. An assertion that ignores this is wrong.
- Property 1 vs. **pentavalents**: Penbraya/Penmenvy carry MenB's ≥10y floor, which
  interacts with the MenACWY floor of 2 months. Check against `brandRules`-equivalent
  logic in `brands.js`, not against a typed number.
- Property 3 vs. `shared-decision` and `deferred`, which may legitimately differ in how
  they cite.

Then, **one property per commit**: the owner decides whether each is a true never-event
or needs a written-down exception, the exception is recorded in a comment citing her
decision and the date, and only then does it become a failing assertion.

**Runtime.** Measured 2026-09-19: the existing sweep costs **2.31 s at collection time**
for 20,202 `recommend()` calls (the whole suite is 11.8 s). Seven properties on the same
grid will not change that materially — the cost is the engine calls, not the assertions.
Runtime only becomes a question in item C.

---

## B2. Grid realism — three blind spots in the current sweep

**Found in the second survey pass, 2026-09-19. Fix these while building `test-grid.js`,
before widening it in item C — a wider grid with the same blind spots just multiplies
them.**

The existing sweep generates 95,928 patient-rows and is the suite's best test. It is also
tidy in three ways that real records are not, and each one has already let a bug through.

### B2a — Every swept patient is a whole number of months old

`for (let am = 0; am <= 120 * 12; am += 3)` starting at 0 produces only integer ages. All
95,928 rows. Across the whole suite: **281 whole-number `ageMonths` literals, 3
fractional.**

This is the exact blind spot recorded in the 2026-09-18 handoff lesson — *"Every test
patient in the suite was a whole number of months old. That is why both of these bugs
survived a green suite. Fractional ages, month ends and leap days are now the most
productive lens on this codebase."* **B1** (infant band edges — which caused an extra
injection at 6½ months) and **cal P2-2** (age-at-dose out by up to 2.95 days) both
survived a green suite because of it. The lesson was written down and never applied to
the grid.

**Fix:** offset the age step so the grid lands off the integers — e.g. step by 3 months
from a fractional origin, or interleave a `+0.5` pass. Explicitly include the ages that
have caused defects: band edges ±0.5 month (6.5, 7.5, 11.5, 23.5), the day before and
after each birthday gate (10y, 11y, 16y, 19y), and 29 February.

### B2b — The sweep bypasses the app's primary age path

Since PR #42 the app **keeps the date of birth** and derives age from it.
`patientAgeMonths()` says so in its own comment: the date of birth wins, *"a stored
ageMonths is only a snapshot."*

Both sweeps pass `ageMonths:` directly and **never a `dob:`** — zero occurrences. So
`dobToAgeMonths()`, the exact-age-at-dose branch of `ageAtDoseMonths()`, and all the
calendar arithmetic fixed in #42 and #44 are exercised by hand-written examples only.
**The one exhaustive test in the repo drives the legacy path.**

**Fix:** the grid generates patients from a **date of birth**, not an age in months.
Derive the age for reporting, but pass what the real app passes. This alone will
re-exercise every calendar fix across 95,928 rows instead of a dozen examples.

### B2c — The sweep never generates an invalid dose

`STEP_MONTHS = 8`, chosen (the file says so) *"generous enough to clear every interval
rule in validate.js ... so every generated dose validates as clinically VALID."*

That was the right call for its original purpose — isolating the counting logic. But it
means the **entire invalid space is unswept**: too-soon doses, below-minimum-age doses,
wrong-family MenB, duplicates, future dates, doses before birth. All of those are tested
by named examples only, and several of them (the MenB dose-3 rescue, the four-day grace
rule) are exactly where recent bugs lived.

**Fix:** add a second spacing profile to the grid — a "tight" one that deliberately
violates intervals — and run the never-event properties over both. Keep the generous
profile for the counting properties that need valid doses; say in a comment which
properties run on which profile, so the next session does not merge them by accident.

### B2d — Fixture tidiness, lower priority

42% of the distinct dose dates in the suite fall on the 1st or the 15th of a month, and
the whole suite uses **9 distinct dates of birth**. Real records are not tidy. Worth
spreading the generated dates across the month once B2a and B2b are done; not worth a
session of its own.

---

## C. Patients with more than one risk factor

**What it is.** Real patients arrive combined. The suite does not.

Measured mentions across all 119 test files:

```
asplenia 250 · travel 46 · military 37 · outbreak_acwy 35 · college_dorm 30
microbiologist 21 · hct 20 · complement 18 · pregnancy 13
hiv 6 · hct_cart_bcell_exclude 6 · outbreak_b 2
```

Asplenia became the default stand-in for "high risk" and the rest were barely exercised.
Only **16** distinct multi-factor combinations appear anywhere, out of 66 possible pairs.
The sweep uses **7 single-factor profiles**.

### C1 — widen the grid (cheap)

Once item B's shared grid exists, change it from 7 profiles to **all 12 singles + all 66
pairs = 78 profiles** and re-run the never-events sweep. This is close to a one-line
change and it is the highest value-per-hour work in the plan.

**Runtime, measured, so the session does not have to guess:** 78 profiles is 11.1× the
current 7, so ~26 s at the present three-month age step — that would roughly triple an
11.8 s suite. **Coarsen the age step to six months for the pair sweep** and it lands
near 13 s. Keep the three-month step for the 12 single-factor profiles, where the age
bands matter most. If the session finds a cheaper split, take it, but state the measured
numbers in the commit message.

### C2 — hand-written clinical combinations (expensive, and the real value)

Pick eight combinations a clinician would actually flag, and write a proper two-layer
test (engine + screen) for each:

- asplenia + college dorm
- complement inhibitor + travel
- HIV + A/C/W/Y outbreak
- asplenia + serogroup B outbreak
- microbiologist + pregnancy
- HCT + travel
- complement inhibitor + college dorm
- military + asplenia

**Before asserting what the app *should* say for any of these, use the
`verify-clinical-source` skill** — fetch the authoritative page live and quote it. Do not
transcribe a rule from this document, from memory, or from `docs/agent/clinical-rules.md`
as fact. Where ACIP/CDC and AAP disagree, AAP governs (`CLAUDE.md`).

**Expect this half to find real gaps, not just missing tests.** HIV appears six times and
serogroup B outbreak twice in the whole suite — those are plausibly *under-implemented*,
not merely under-tested. If a combination turns out to be genuinely wrong in the engine,
it stops being a test item and becomes its own fix-queue entry with its own commit. Say
so in the handoff rather than folding a clinical fix into a test commit.

---

## D. Two-run relational tests

**What it is.** Every existing test looks at one patient and one answer. None looks at
two answers side by side and asks whether the difference between them makes sense. These
need no outside answer key — the relationship between the two runs *is* the correct
answer — which is what makes them unusually cheap for what they catch.

**The three relations to lock:**

1. **Adding a risk factor never reduces what is owed.** For every patient on the grid,
   for every risk factor not already ticked: adding it must never decrease the number of
   doses owed, and must never move an actionable status to `not-indicated`.
   *Known exception to handle explicitly:* `pregnancy` legitimately defers MenB, and
   `hct_cart_bcell_exclude` is a hard stop that hides everything. Exclude both by name,
   with a comment, not silently.

2. **Record the recommended dose, re-run, and the series advances by exactly one.** This
   is the visit-to-visit loop a clinician actually performs, and nothing tests it.
   *Known exceptions:* `shared-decision`, `deferred`, `complete` and `not-indicated`
   cards have nothing to give, so the relation applies only to `due`, `catchup`,
   `risk-based` and `exposure`.

3. **One day older never loses a credited dose.** Re-run the same patient with `today`
   advanced by one day; no dose that counted yesterday may stop counting today. (Doses
   *becoming* valid is fine — this is one-directional.)

**The scaffolding you will have to build, and its trap.** Relation 2 needs a helper that
turns a recommendation into a recorded dose: take `rec.brands[0]`, date it
`rec.earliestNextDate ?? today`, append it to the right history array, re-run. That
helper does not exist yet.

The trap: the helper encodes an assumption about what "giving the recommended dose"
means, and a careless test then proves the *helper* right rather than the app. Put the
helper in `src/test-grid.js` next to the grid, give it a comment stating the assumption
in one sentence, and make relation 2's failures print both runs' cards so a human can see
what actually changed.

**Same discipline as item B: report-only first, then one relation per commit.**

---

## E. The standing drift defences

**This is the part that outlives the plan.** Items 0–D improve the suite once. Item E is
what stops it degrading again, during this work and after it.

### E1 — Name the five kinds of drift, so they can be looked for

Every drift incident this repo has actually suffered falls into one of five kinds. Four
already have a mechanical guard. One does not.

| Kind | What it looks like | Real example from this repo | Guarded by |
|---|---|---|---|
| **Fact-copy** | The same number, rule or sentence written in two places. They agree on the day they are written and diverge later. | The MenACWY infant interval hand-typed next to the totals logic (P0-1). A sweep carrying its own copy of the chip label — the two disagreed on 20,167 rows. | `p2-1-intervals-in-one-place`, `p2-3-ages-in-one-place`, `chip-label-one-copy` ✅ |
| **Doc** | A document describes the code; the code moves; the document does not. | `clinical-rules.md` was a full guideline behind on the healthy MenB interval. `testing.md` is 109 files out of date. | `rule-docs-match-code` ✅ (and item 0 extends it) |
| **Fixture** | A test fixture is graded against the real clock and rots overnight. | On 2026-09-15 a fixture computed to 2.0 months (valid); on 2026-09-16, 1.97 months (invalid). Red suite, nobody's fault. | `date-pinning` ✅ |
| **Source staleness** | A citation still resolves but the guideline behind it has changed. | The MenB interval change of October 2024, unnoticed for months. | `citation-freshness` ✅ |
| **Coverage** | The app gains a capability and the tests do not widen. The new thing is untested and the suite stays green. | **No guard exists.** Add a 13th risk factor today and no sweep touches it. | ❌ **Build this — E2** |

### E2 — Build the missing guard: "the app grew and the tests didn't"

Add **`regression-2026-09-19-the-grid-covers-the-app.test.js`**, alongside the shared
grid from §“The drift problem”. It reads the app's own data and fails if the grid has fallen behind:

- Every id in `riskFactors.js` appears in at least one grid profile.
- Every brand key in `brands.js` is exercised by at least one grid patient.
- Every `status` value `recommend.js` can return is reached by at least one grid patient.
  (The known set as of 2026-09-19: `due · catchup · risk-based · exposure ·
  shared-decision · complete · not-indicated · deferred`. Derive it from the source,
  do not retype this list — retyping it is itself fact-copy drift.)

The failure message must say what to do, not just what is wrong: *"riskFactors.js
defines 'meningitis_belt_resident' but no grid profile includes it — add it to
`src/test-grid.js` or say in a comment why it is excluded."*

This is the single highest-leverage thing in the whole plan for future work. After it
exists, adding a capability to the app turns the suite red until the capability is
covered. The owner does not have to remember; the repo remembers.

### E3 — The standing rule in `CLAUDE.md`

Tripwires catch drift after it is written. A rule in `CLAUDE.md` loads into every future
session automatically and catches it before. Add this to MeningoVax's `CLAUDE.md` under
Non-Negotiable Rules:

> ### No Second Copies
>
> Before writing a number, an age, an interval, a dose total, a date, a brand key, a risk
> id, or a user-facing sentence into a **test**, check whether it already exists in `src/`.
> If it does, import it. A test with its own copy of a fact tests the copy.
>
> The same applies to the patient grid: sweeps import from `src/test-grid.js`. They never
> declare their own list of risk factors, brands or ages.
>
> Never write a comment claiming a block "mirrors", "matches" or "is the same as" code
> elsewhere. That sentence has been wrong every time it has been written here — most
> expensively in `sweep-dose-counter.test.js`, where the copy disagreed with the real
> thing on 20,167 rows and the test asserting correctness was itself printing the error.
> Import the real thing instead.
>
> When a session adds a capability (a risk factor, a brand, a status, a schedule), it
> says in the PR body which sweep got wider. If the answer is "none", the capability is
> untested.

### E4 — What to check at the end of every session, and in every PR

Four questions. They take two minutes and they catch all five kinds of drift:

1. **Did this PR add a number, date or sentence to a test file?** If yes — where does it
   come from, and is it already in `src/`?
2. **Did this PR add a capability to the app?** If yes — which sweep got wider? "None" is
   a failing answer.
3. **Did this PR change a clinical rule?** If yes — which document was updated in the same
   commit? (`rule-docs-match-code` should already have forced this. Ask anyway.)
4. **Is the test count rising much faster than the file count?** That means one file is
   generating many near-identical assertions. Not wrong, but it inflates the sense of
   coverage — `regression-u1-note-lead-and-detail.test.js` is 245 tests of one rule, 17%
   of the whole suite.

Put questions 1–3 in the PR template, or state them explicitly in the PR body. Question 4
is for the owner at review time.

### E4a — What a second survey pass CLEARED on 2026-09-19 (do not re-audit)

Checked and clean. Record this so nobody spends a session re-checking:

- **No disabled tests.** Zero `it.only`, `it.skip`, `it.todo`, `xit`, `xdescribe`
  anywhere. (`it.only` is the dangerous one — it silently disables every other test in
  its file while the suite reports green.)
- **No snapshot tests.** Zero `toMatchSnapshot` / `toMatchInlineSnapshot`. Good: snapshots
  rot and get blind-updated.
- **No assertion-free tests.** Every single `it()` block in all 119 files calls `expect()`.
- **CI runs the full suite** on both `pull_request` and `push` (`.github/workflows`,
  `npm test`). Deploy is a separate workflow.
- **Negative assertions are nearly all live.** Of 203 `.not.toContain` / `.not.toMatch`
  assertions carrying a literal, exactly **one** references a string that appears nowhere
  in `src/` — and that one is legitimate (`"is Birth,"`, the extinct ungrammatical
  sentence from the impossible-age fix, correctly asserted never to return).

**Minor, no action needed:** MeningoVax's `.githooks/pre-commit` runs only
`scripts/check-root-notes.sh` — it does **not** run tests (vaxapp's runs `vitest related`).
CI covers this, so it is a convenience gap, not a safety one.

### E4b — Add a guard for vacuous "never say X again" tests

203 negative assertions is a lot, and they carry a quiet failure mode: a regression test
saying *"the card must never say X again"* becomes **vacuous the moment someone rewords
X**. It keeps passing and proves nothing, forever. The suite is currently clean, but
nothing keeps it that way.

**Add to the tripwire family:** a test that collects every plain-string literal inside a
`.not.toContain` / `.not.toMatch` in the test files, checks whether it appears anywhere in
`src/`, and fails for any that does not **unless** the assertion carries an
`// extinct:` comment on the same or preceding line saying the string was deliberately
removed and when. That turns a silent rot into a one-line annotation the author has to
write consciously. Annotate the existing `"is Birth,"` case as the first example.

### E5 — One live fact-copy found on 2026-09-19, to fix in passing

`src/logic/__tests__/regression-u3-dose-verdict-not-repeated.test.js:33` carries the
comment *"the MenB mirror of the same sentence (validate.js has two copies of it)"*.

That is a duplicated user-facing sentence sitting in `validate.js` right now — one copy
on the MenACWY path, one on the MenB path — noted by a previous session and never
removed. It is exactly the pattern in E3. Fix it while working item B (extract the
sentence to one place, both paths import it) and add the literal to the
`chip-label-one-copy` family of guards so it cannot come back.

**Note for the drift audit:** this was found by searching the test comments for the words
*mirror*, *copy of*, *same as* and *in sync*. That search is worth re-running at the end
of this plan — as of 2026-09-19 it returns no other live claims, only the tripwire tests
themselves and historical accounts of already-fixed problems. That is a genuinely clean
result and worth preserving.

---

## Risk and effort, per item

Honest estimates. "Session" means one focused working session, not a calendar day.

| Item | Risk of breaking something | Risk of ballooning | Effort if nothing is found | What it will probably find |
|---|---|---|---|---|
| **0** Rewrite `testing.md` | **None.** A document, not code. | **Low**, provided the per-file table is dropped rather than completed. | ~1 hour, plus ~1 hour for the self-checking count test | Nothing — but it stops the next session starting from a false map. |
| **A** Coverage | **Very low.** Adds a dev dependency and a config block. Touches no production code and no assertions. Worst case: version mismatch, and it simply refuses to run. | **Very low** — timeboxable to one session. | ~1 hour, most of it reading the report | A list of never-entered branches. Unsettling to read, harmless in itself. |
| **B** Never-events | **Medium.** The code changes are additive, but the *decisions* are not: a naively written assertion will fail on legitimate behaviour (the four-day grace rule especially), and the danger is an agent "fixing" the app to satisfy a wrong assertion. Report-only-first is the whole mitigation. | **Medium-high.** Near-certain to surface real failures — that is the point, and it is why this cannot be confidently timeboxed. | 1 session to build the harness and report; ~½ session per property to triage and lock → **3–4 sessions** | Real bugs. Each one becomes its own fix-queue item on top of the estimate. |
| **B2** Grid realism | **Medium.** Changing the grid from integer ages to dates of birth, and adding a tight-spacing profile, will move results across many rows — expect churn and read it carefully. This is a *better* grid, so new failures are findings, not breakage. | **Medium-high.** B2a and B2b together are the most likely single source of new bugs in this plan. | ~1 session on top of B | Real defects. Fractional ages and the date-of-birth path are where B1 and cal P2-2 hid. |
| **C1** Wider grid | **Low.** One change to a module that already exists by then. The only live issue is suite runtime, and that is measured above. | **Low.** | ~1 hour | New failures from B's properties on combinations never tried. |
| **C2** Clinical combos | **Medium.** No risk to existing behaviour, but each combo needs a live source fetch before you can say what the right answer is — and getting that wrong writes a wrong rule into a test, which is the exact failure mode this whole plan cannot otherwise detect. | **High.** HIV and serogroup B outbreak are thin enough that they may be under-implemented, turning test work into rule work mid-session. | ~1 session per 3–4 combos including source verification → **2–3 sessions** | Genuine clinical gaps in the thin risk factors. Highest-value findings in the plan. |
| **D** Two-run tests | **Medium.** Needs new scaffolding that does not exist, and the helper-proves-itself trap is real. The three relations all have legitimate exceptions that must be excluded by name. | **Medium.** | 1 session to build + report, 1 to triage and lock → **2 sessions** | Self-contradictions across two visits. After C2, the most clinically interesting class. |
| **E** Drift defences | **Low.** E2 is a new test that reads existing data; E3 is a document; E4 is a habit. The one code change is E5, which removes a duplicate sentence. | **Low**, if built alongside B rather than as its own project. | ~½ session on top of B, plus the E5 cleanup | E2 will immediately name whatever the grid does not yet cover — expect a short list on day one. |

**Whole plan: roughly 10–14 sessions if nothing major is found — and something will be.**
Budget for items B, C2 and D each spawning one or two separate fix-queue entries.

**The cheapest thing on this list is also the one to do first.** Item A costs an hour,
carries no risk, and its output changes how you prioritise everything after it.

---

## Definition of done

- `src/test-grid.js` exists, derives its profiles from `riskFactors.js` and `brands.js`,
  and reads `TEST_TODAY`. No sweep declares its own risk or brand list.
- `regression-2026-09-19-sweeps-use-the-shared-grid.test.js` fails if one does.
- `sweep-dose-counter.test.js` has been migrated onto it and its stray `'2026-09-14'`
  is gone.
- Seven never-event properties assert across the full grid, each with its exceptions
  written down and attributed to an owner decision with a date.
- The grid covers 12 single risk factors and all 66 pairs; measured runtime is stated in
  the commit message.
- Eight hand-written multi-factor cases, each with a live-fetched quoted source, each
  with an engine test and a screen test.
- Three relational properties assert, with their exceptions excluded by name.
- `npm run test:coverage` runs; `docs/archive/coverage-2026-09-19.md` lists the
  never-entered branches by name.
- `docs/agent/testing.md` rewritten per §0, and its quoted counts are checked by a test
  so it cannot go stale silently again.
- `regression-2026-09-19-the-grid-covers-the-app.test.js` fails when a risk factor, brand
  or status exists in the app but not in the grid.
- The grid generates patients from a **date of birth**, includes **fractional ages** and
  the known edge ages, and carries a **tight-spacing profile** that produces invalid
  doses (§B2). None of those three was true of the old sweep.
- A guard exists for vacuous "never say X again" assertions (§E4b), and the one existing
  extinct-string case is annotated.
- The **No Second Copies** rule is in `CLAUDE.md`.
- The duplicated sentence in `validate.js` (§E5) is extracted to one place, and the
  *mirror / copy of / same as / in sync* search over the test comments still returns no
  live claims.
- Full suite green, stated as a real count from a real run.
- No vaxapp branch opened. Meningococcal findings noted for the future port only.
