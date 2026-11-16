# MeningoVax — Testing Reference

## Framework

- **Vitest** — `npm test` = `vitest run`, `npm run test:watch` = `vitest`
- **Environment rule:** tests run in `node` by default. A file opts into
  `happy-dom` (a lightweight browser DOM implementation, needed to render a
  React component and read its output) individually, with
  `// @vitest-environment happy-dom` as its first line.
- Test files live in `src/logic/__tests__/`, `src/components/__tests__/`, and
  `src/data/__tests__/`.
- Global setup: `src/test-setup.js`. Shared test-only helpers: `src/test-today.js`
  (the one pinned "today" — see below), `src/test-why-this.js`, `src/test-note-text.js`.

## Measured counts

The table below is what a fresh checkout actually contains. It is re-derivable
with the command in the third column, and every row is checked on every
`npm test` run by `regression-testing-md-counts-match-reality.test.js` — if
the repo and this table disagree, that test fails and names the mismatch.

| What | Count | Re-derive with |
|---|---|---|
| Test files, total | 142 | `find src -path "*__tests__*" -name "*.test.js*" \| wc -l` |
| — in `src/logic/__tests__/` (engine, `node` env) | 91 | `find src/logic/__tests__ -name "*.test.js" \| wc -l` |
| — in `src/components/__tests__/` (screen) | 47 | `find src/components/__tests__ -name "*.test.js*" \| wc -l` |
| — in `src/data/__tests__/` (data/citation tripwires) | 4 | `find src/data/__tests__ -name "*.test.js" \| wc -l` |
| — of the components ones, opted into `happy-dom` | 46 (the 47th, `regression-chip-label-one-copy.test.js`, is a pure-logic tripwire that happens to live in that folder) | `grep -rlE "@vitest-environment[[:space:]]+happy-dom" src \| wc -l` |

**Not guarded by a test** — re-run the command if you need a current number,
rather than trusting this document:

| What | Count | Measured |
|---|---|---|
| Individual `it()` tests, total | 1,692 | `npx vitest run --reporter=json`, 2026-11-15, port Phase 1.4 whole-app checks |
| Test suites (`describe` blocks, files counted as one if they have none), total | 552 (not re-derived since K1 — only `it()` count re-measured; re-run the command above if this row matters to you) | `npx vitest run --reporter=json`, 2026-09-24, K1 blank dose rows |
| Failing | 0 | same run |

These two rows are a snapshot, not a tripwire: verifying them exactly would mean
re-running the whole suite from inside a test, which is expensive and was
judged not worth it for this document (see the plan this rewrite came out of,
`.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`). The file counts
above are the load-bearing numbers for navigating the suite, so those are the
ones that are guarded.

## The two-layer rule

A fix for anything visible on screen gets **two** tests, not one:

1. An **engine test** in `src/logic/__tests__/`, asserting on what `recommend()`
   or `analyzeHistory()` returns.
2. A **screen test** in `src/components/__tests__/` (`happy-dom`), asserting on
   what actually renders — because an engine can be correct while the component
   reading its output still shows the wrong thing.

Each names the other in a header comment. Example —
[`regression-b1-infant-band-edges-ui.test.jsx`](../../src/components/__tests__/regression-b1-infant-band-edges-ui.test.jsx):

> `// B1 · UI layer. The engine-layer twin, with the verbatim CDC quotes and the`
> `// full history, is src/logic/__tests__/regression-b1-infant-band-edges.test.js.`

Measured 2026-09-19 by stripping the `-ui` suffix from every
`components/__tests__` file name and intersecting with `logic/__tests__` file
names: **19** pairs match by name alone. That undercounts the real total — some
pairs use different stems on each side and only declare the link in the header
comment (grep for "engine-layer twin" / "screen-layer twin" if a same-name
match doesn't turn one up) — but 19 is enough to show the convention is real
and in active use, not aspirational.

## The tripwire family

Eight tests exist purely to catch a repo-wide failure mode, not to check one
clinical rule. Each is described in its own header comment; this is the map
for finding the right one:

| Test | Guards against |
|---|---|
| [`date-pinning.test.js`](../../src/logic/__tests__/date-pinning.test.js) | The suite giving a different answer depending on what day it's run — a red suite that is nobody's fault, which teaches you to ignore red. |
| [`citation-freshness.test.js`](../../src/data/__tests__/citation-freshness.test.js) | A source's `lastVerified` date in `refs.js` going stale (>12 months old by default) with nothing noticing. |
| [`citation-integrity.test.js`](../../src/data/__tests__/citation-integrity.test.js) | A citation that's broken, orphaned, or attached to a recommendation it doesn't actually support. |
| [`rule-docs-match-code.test.js`](../../src/logic/__tests__/rule-docs-match-code.test.js) | `clinical-rules.md` / `meningococcal-rules-summary.md` describing a rule the code no longer implements — reads the real value out of the code and requires the doc to state it. |
| [`regression-p2-1-intervals-in-one-place.test.js`](../../src/logic/__tests__/regression-p2-1-intervals-in-one-place.test.js) | An interval (dose spacing) value hand-typed a second time somewhere instead of imported from `intervals.js`. |
| [`regression-p2-3-ages-in-one-place.test.js`](../../src/logic/__tests__/regression-p2-3-ages-in-one-place.test.js) | Same, for age thresholds — imported from the age-threshold source instead of retyped. |
| [`regression-chip-label-one-copy.test.js`](../../src/components/__tests__/regression-chip-label-one-copy.test.js) | A second, hand-written copy of the dose-chip wording drifting from `doseChipLabel.js`'s real logic — this happened once already, on 20,167 swept rows. |
| [`regression-2026-09-19-no-vacuous-negative-assertions.test.js`](../../src/logic/__tests__/regression-2026-09-19-no-vacuous-negative-assertions.test.js) | E4b — a "the app must never say X again" assertion going silently vacuous once nobody produces X for an unrelated reason (a reword, a refactor). Requires every un-annotated negative-assertion literal to still exist somewhere in `src/`; an `// extinct:` comment is the conscious opt-out for a fact that really was removed on purpose. |

## The sweep pattern

[`sweep-dose-counter.test.js`](../../src/logic/__tests__/sweep-dose-counter.test.js)
and
[`sweep-never-events.test.js`](../../src/logic/__tests__/sweep-never-events.test.js)
do not test one patient each — they generate every age in the app's own input
range (`StepAge.jsx`'s `max="120"`, stepped every few months) crossed with a
representative risk profile per `menacwyClass`/`menbClass` pairing and dose
histories of 0–5 doses, then assert (or, for the never-events sweep, report —
see below) a handful of properties across every one of those generated
patients at once. `sweep-dose-counter.test.js` exists because every earlier
fix to the "dose N of M with N > M" bug shipped as a test for the one age it
was written about, and an 82-year-old broke it anyway.

Both sweeps get their risk profiles, brands and dose-generation helpers from
[`src/test-grid.js`](../../src/test-grid.js) — **derived** from
`riskFactors.js` and `brands.js`, not hand-typed, so a new risk factor or
brand widens both sweeps on the next run with no test edit. `test-grid.js`
also documents, in its own comments, exactly what its class-based profile
list does **not** yet cover (several risk ids branch individually, beyond
their class) — that widening is plan item C1, not done yet.

Every swept patient is generated from a **date of birth** (`SWEEP_DOBS` in
`test-grid.js`), not a plain `ageMonths` integer — plan item B2 (2026-09-19).
The grid's dob step lands off whole-month anniversaries on purpose, so no row
is an exact integer number of months old, and it injects the specific ages
that have hidden a defect before: infant-band half-months (6.5/7.5/11.5/23.5),
the day either side of each birthday gate (10y/11y/16y/19y), and a real
29 February dob. `sweep-never-events.test.js` also runs its five enforced
properties against a second, deliberately invalid **tight**-spacing dose
profile (`makeTightDoses`) alongside the original **generous** one, so the
never-taken invalid-dose space (too-soon intervals, below-minimum-age doses,
doses before birth) is swept too. `sweep-dose-counter.test.js`'s counting
property stays on the generous profile only — an invalid dose is never
numbered, so it can't expose a numbering bug.

`sweep-never-events.test.js` checks seven candidate never-event properties
(no brand below its licensed floor, no nonsense `earliestNextDate`, every
actionable rec cites something, status is always one of the known eight,
`recommend()` never throws, plus two duplicate/heuristic properties). It
landed **report-only** first — printing a violation count and examples for
each without asserting any of them were bugs — because several of these
properties have legitimate exceptions (the four-day grace rule, shared-
decision citations), and a naive assertion would fail on the exception
rather than on a real bug. After the owner reviewed that output, five of the
seven (1-5) were turned into real, enforced assertions, one property per
commit (2026-09-19). Property 6 stays report-only — it's a rough heuristic,
not yet precise enough to trust as a rule. Property 7 duplicates a real
assertion already enforced in `sweep-dose-counter.test.js`. See
`.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`, items B and B2,
for the full reasoning. **Update:** item C1 (widening the profile list from
one-per-class to every individual risk id, plus every 2-risk pair) is done —
both sweeps now loop over `SINGLE_RISK_PROFILES` (13) and, on the coarser
`SWEEP_DOBS_COARSE`, `PAIR_RISK_PROFILES` (66).

[`sweep-two-run-relations.test.js`](../../src/logic/__tests__/sweep-two-run-relations.test.js)
is a third kind of sweep — plan item D. The two sweeps above each look at ONE
patient and ONE answer; this one looks at TWO runs of the same patient and
checks whether the difference between them makes sense (adding a risk factor
never reduces what's owed; recording the recommended dose advances the
credited count by exactly one; a day passing never uncounts a dose). It
landed **report-only**, same discipline as item B, and as of this writing
**none of its three relations are enforced yet** — the report-only output
needs the owner's review first. See the plan document, item D, and the
file's own header for what each relation checks and why the grid it samples
is deliberately smaller than the other two sweeps'.

## The saved answers (port Phase 1.1, 2026-11-15)

The sweeps above check **properties**. None of them notices when a patient's
**answer** changes. [`sweep-saved-answers.test.js`](../../src/logic/__tests__/sweep-saved-answers.test.js)
does: it runs the engine over a fixed grid of synthetic patients and requires
the same answer, line for line, as the two files saved in
`src/logic/__tests__/__saved__/`:

| File | Patients | What they are |
|---|---|---|
| `saved-answers.tsv` | 17,580 | patients a clinician could really enter |
| `saved-answers-record-problems.tsv` | 5,820 | records they could not: a dose before birth, after today, or one shot on two rows |

An answer is what the app **decides**: each card's status, due today or not,
next date, dose number and totals, brands offered (as short codes), whether the
pentavalent is offered, and for every recorded dose whether it counts and why
not (as a kind, never a sentence). No wording is saved, so a copy edit never
turns it red.

**When it fails:** that is not automatically a bug. If the change was meant,
run `npm run sweep:update`. It rewrites both files and prints how many answers
moved, with examples. Put that number in the PR with the reason. If you cannot
say why those patients should get a different answer, it is a bug.

The grid (`src/test-grid.js`, "THE SAVED ANSWERS") sits on the meningococcal
age lines and straddles each interval's edge with CDC's 4-day grace. It
pairs MenACWY and MenB histories by what can change an answer rather than
crossing all of them. The full cross was 35,925 patients and 10 MB with no
more MenACWY or pentavalent answers. Its only extra MenB answers were under-10s
with several rejected MenB doses. Every file it reads is dated by `TEST_TODAY`:
moving that date moves every line, so rerun `npm run sweep:update` in the same commit.

## The prose diff (port Phase 1.2, 2026-11-15)

The saved answers hold no wording, so a wording change can break hundreds of
cards with every test green. `scripts/proseDiff.mjs` is how a wording change
gets **counted**:

```bash
npm run prose -- dump /tmp/prose-before.tsv
# ... make the wording change ...
npm run prose -- dump /tmp/prose-after.tsv
npm run prose -- diff /tmp/prose-before.tsv /tmp/prose-after.tsv
```

It draws the real results screen (`Results.jsx`) for every saved patient
(23,400, about 10 seconds) and keeps every word on it, plus the hover text on
each source number. It reads the screen, not the engine, because some lines are
put together in the card itself ("Next dose not yet due - eligible …").
Every "Why this" and every collapsed quiet card is drawn **open**, through the
switch in `src/components/openAllDisclosures.js`. The switch is off unless the
tool turns it on, so the app is unchanged. Put the "N of 23,400 patients read
different wording" line in the PR. Dumps are about 80 MB: keep them out of the repo.

It is a tool, not a gate. [`prose-diff-tool.test.js`](../../src/logic/__tests__/prose-diff-tool.test.js)
only checks the tool still opens "Why this" and collapsed cards, still reads
hover text, and that the app's own screen still starts closed.

## The typical patients (port Phase 1.3, 2026-11-15)

The saved-answer grid writes every dose as "N days before today", so it
cannot build an ordinary record: a 17-year-old with MenACWY at 11 and 16, or
a 5-year-old with asplenia who finished the infant series.
`buildTypicalCases()` in `src/test-grid.js` is a second list of those, with
doses written "at 132 months" or "1 month ago". It has about 14,000 patients:
every birthday from 10 through 23, young children and adults, every risk
factor, ordinary MenACWY, MenB and pentavalent records.

A patient the app asks "was this patient at high risk when this dose was
given?" appears twice: as first seen, and with every answer "yes" (key `ty…`).
"Yes" is an assumption, stated in the code: a typical patient with a risk box
ticked had that risk when the dose was given.

These patients are in **neither** saved-answer file. The whole-app checks
(Phase 1.4) run on them. [`typical-patients.test.js`](../../src/logic/__tests__/typical-patients.test.js)
checks only the list itself (real dates, every risk factor and brand, the answered copies),
not what the app answers.

## The whole-app checks (port Phase 1.4, 2026-11-15)

`scripts/wholeApp/` follows every saved and typical patient (35,281) down every
road the app advises — give the dose on the date the card names, look again,
repeat, years ahead — and asks seven questions of the app's own answers.
About a million screens; `npm run whole-app` takes about a minute on all cores
and prints distinct patients per check and per kind (`--out file.json` keeps
every group with examples).

| # | Check | Asks |
|---|---|---|
| 1 | Advice is accepted | a dose given when and how the card said is never rejected, discounted or called extra, and not asked for again that day |
| 2 | The plan holds | no "final dose" followed by another; no series total that grows partway |
| 3 | Complete means complete | no later visit asks for more of a vaccine whose card said Complete |
| 4 | Options agree | a pentavalent and the two separate shots it replaces lead to the same next screen |
| 5 | Card and chip agree | a "repeat this dose" chip has a card asking; "Dose k of N" matches the chips; a shown booster date is the day it is asked |
| 6 | Age lines are clean | on a birthday reads like the day after; a dose on a line reads like one a day later; inside the 4-day grace like on the line |
| 7 | Stable over time | a later look never changes whether a recorded dose counted; a dated card says DUE on its date |

How the walk chooses (in `replay.mjs`): the first MenACWY brand a card lists,
the first brand of each MenB family, every pentavalent; only the doses on the
earliest date a screen names; an optional (shared-decision) dose, once
declined, stays declined while it stays optional; the walk stops at 25 years
of age or 6 years from today, whichever is later. A card it cannot read is
reported, never guessed at.

**Findings are listed, not fixed** (plan Phase 1.4):
`docs/archive/report-2026-11-15-whole-app-checks.md`. Only the parts at zero
today are in the suite: [`whole-app-gate.test.js`](../../src/logic/__tests__/whole-app-gate.test.js)
(forward checks on every 20th patient, age lines on all). Each part was shown
to go red by breaking the app on purpose; the report lists the eight breaks.
When a finding is fixed, move its kind into the gate test.

## The worktree trap

`.claude/worktrees/` holds full second copies of `src/` — one per agent
worktree in progress. `vitest.config.js` excludes that directory explicitly:

```js
exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/worktrees/**'],
```

Without that line, `npx vitest run` from the repo root collects both copies:
the count roughly doubles, and the copy that isn't the real project root fails
on setup paths — so a perfectly clean tree reports about 197 meaningless
failures. If you ever see a sudden wall of failures with no code change to
explain them, check for a worktree under `.claude/worktrees/` and check that
this exclude line is still there before you go looking for a regression.

## Finding a fix's tests

There is no per-file index — with 120 files it would be the first thing to go
stale, so this document does not keep one. Instead: **a fix's tests are named
for the fix-queue ID that produced them.** `regression-b1-...`,
`regression-p0-4-...`, `regression-imp-p1-2-...`, `g6-...`, `m9-...`,
`u3-...`, `cal-p2-2-...` are all queue IDs from `docs/archive/` handoffs and
audit queues. To find every test touching a given fix, grep its ID across
`src/**/__tests__/` — both the engine and screen layers, if it has both, will
turn up.

## Coverage Requirements

- When changing the engine: add/adjust a test in `recommend.test.js`.
- When changing the merged `complement` id or risk wiring: update all risk-id strings in tests.
- When changing `validate.js` booster cadence: update `validate-new-rules.test.js` AND confirm `recommend.js` booster timing mirrors the same dose-2 age basis.
- Regression tests must fail when the fix is reverted (verify this).

## Key Invariants to Test

1. **MenACWY high-risk booster cadence:** first booster 3y if D2 <7y else 5y; ALL subsequent boosters 5y. `recommend.js` and `validate.js` must agree.
2. **MenB D3 timing:** gate on BOTH ≥6m from D1 AND ≥4m from D2; `earliestNextDate` = later of the two.
3. **Pentavalent eligibility:** only when both MenACWY and MenB due today AND age ≥10y.
4. **Family lock anchor:** first KNOWN-brand MenB dose (not raw D1), to handle unknown D1.
5. **Dateless dose min-age:** current age as upper bound (a dose can't have been given later than today).
6. **`college_dorm` vs `military` vs `acwy_outbreak`:** ≥16y-dose-satisfies applies ONLY to college_dorm.
