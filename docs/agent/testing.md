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
| Test files, total | 122 | `find src -path "*__tests__*" -name "*.test.js*" \| wc -l` |
| — in `src/logic/__tests__/` (engine, `node` env) | 76 | `find src/logic/__tests__ -name "*.test.js" \| wc -l` |
| — in `src/components/__tests__/` (screen) | 42 | `find src/components/__tests__ -name "*.test.js*" \| wc -l` |
| — in `src/data/__tests__/` (data/citation tripwires) | 4 | `find src/data/__tests__ -name "*.test.js" \| wc -l` |
| — of the components ones, opted into `happy-dom` | 41 (the 42nd, `regression-chip-label-one-copy.test.js`, is a pure-logic tripwire that happens to live in that folder) | `grep -rlE "@vitest-environment[[:space:]]+happy-dom" src \| wc -l` |

**Not guarded by a test** — re-run the command if you need a current number,
rather than trusting this document:

| What | Count | Measured |
|---|---|---|
| Individual `it()` tests, total | 1,481 | `npm test`, 2026-09-19, on top of commit `e159211` (plan item B: `test-grid.js` + the never-events sweep + its drift tripwire) |
| Test suites (`describe` blocks, files counted as one if they have none), total | 503 | `npx vitest run --reporter=json`, same run |
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

Seven tests exist purely to catch a repo-wide failure mode, not to check one
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

`sweep-never-events.test.js` is **report-only**: it checks seven candidate
never-event properties (no brand below its licensed floor, no nonsense
`earliestNextDate`, every actionable rec cites something, status is always
one of the known eight, `recommend()` never throws, plus two heuristics) and
prints a violation count and examples for each, without asserting any of them
are bugs. That is deliberate — several of these properties have legitimate
exceptions (the four-day grace rule, pentavalent age floors), and turning one
into a real assertion is a one-property-per-commit decision for the owner to
make, not something a sweep should assume. See
`.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`, item B, for the
full reasoning; item B2 (grid realism: fractional ages, dates of birth
instead of `ageMonths`, deliberately invalid doses) and C1 (widening the
profile list) are the next two steps and are **not yet built**.

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
