# P2-2 · The roadmap for vaxapp's meningococcal overhaul

Written 2026-09-17. This is the last item of
`.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`, and it is a plan, not a
code change. Nothing in vaxapp was touched to produce it — the inventory below was read
only.

## What this document is for

MeningoVax spent 2026-09-16 and 2026-09-17 having its rules put on a proper footing: the
gaps found (G1–G8), the tripwires added, the clinical bugs fixed (P0-1, P1-1 to P1-4),
the copy rewritten (U1–U5), and finally the duplicated numbers collapsed into one module
(P2-1). vaxapp's meningococcal half needs the same treatment.

The point of writing this down is the **order**. The order was not obvious, we got it
right here partly by luck, and doing it in a different order on vaxapp would be
materially more dangerous. What follows is the order and the reason for each step.

## The order that worked, and why

### 1. Inventory the rules in plain English first

Before changing anything, write out every rule the app actually applies, in clinician
language, each one with the file and line it lives at and the source it claims to be
following.

This is the step people skip because it produces no code. It is also the step that found
the most, because it is the only one that compares *what the code does* against *what the
citation next to it says*. A test cannot do that: a test compares the code against
another developer's idea of the code. R3.2 was found this way and no test would ever have
caught it.

It is also what produced the clinician-facing rulebook the owner now reads.

### 2. Make the build fail when the documents and the code disagree

Only after the inventory exists is there something to test *against*. This is where the
doc-vs-code tests, the citation-freshness sweep, the orphan-citation sweep and the pinned
fake "today" go in.

Do it second, not first. Built before the inventory, these tests pin down whatever the
code happens to do today, including the bugs — they make wrong behaviour permanent and
give it a green check mark.

### 3. Feed it a messy chart on purpose

The rules being right and the app *hearing the patient's record correctly* are two
different properties, and the second one is where G1–G8 lived. Every one of those was the
app mis-reading a real-world record — doses out of order, a risk factor that started
after dose 2, a brand switch mid-series — rather than applying a wrong rule.

Test this by writing down records a real clinic would produce, not records that are
convenient to type. The lesson that cost us a live bug: P0-1's own tests used a patient
aged exactly 7 months with a birthday exactly 7 months back. Both whole numbers, the one
input shape that could not fail. The very next fix (PR #29) had to repair a fractional-age
crash those tests were structurally incapable of seeing. **Use awkward numbers on
purpose.**

### 4. Collapse the duplicated numbers last

`intervals.js` — one module owning every minimum interval, with the card sentences
interpolating from it rather than restating it — comes last, because it is surgery on
working clinical logic and it wants the tripwires from step 2 already in place.

When we did it here, the proof of safety was not the test suite. It was running the old
code and the new code over 2,784 synthetic patients and diffing every card and every
per-dose verdict byte for byte. Budget for that; it is what makes a refactor of clinical
logic honest rather than hopeful.

## What is different about vaxapp

MeningoVax has one engine and one validator. vaxapp has **five output surfaces plus the
compliance tab plus a validator**, and they do not share a code path:

| Where the rules are | File | Lines mentioning MenACWY/MenB |
|---|---|---|
| Recommendations tab (`genRecs`) **and** the catch-up table | `src/logic/recommendations.js` | 212 |
| Optimal schedule (its own `seriesDoses()`, not `genRecs`) | `src/logic/buildOptimalSchedule.js` | 89 |
| Validator | `src/logic/validation.js` | 69 |
| Compliance audit tab | `src/logic/compliance.js` | 60 |
| Full forecast | `src/logic/forecastLogic.js` | 18 |
| Interval/min-age table | `src/data/scheduleRules.js` | 18 |
| Regimen optimizer | `src/logic/regimens.js` + `comboAnalyzer.js` | 3 + 1 |

So step 1's inventory is roughly seven times the size of MeningoVax's, and — this is the
part that matters — **the same rule appears in several of those columns**, which means
the inventory's real job on vaxapp is not just "what does this rule say" but "do all
seven copies of it say the same thing today".

Two known traps, both already paid for:

- **Surface 5 is the usual leak.** `buildOptimalSchedule.js` computes its own series
  lengths and never calls `genRecs`. vaxapp's own CLAUDE.md names it as the most common
  place a fix fails to reach.
- **The validator drifts separately from the engine.** A previous cross-app audit read
  only the recommendation engines and missed that the validators had drifted, to the
  point of rejecting doses their own engine recommends. The inventory must cover
  `validation.js` and `scheduleRules.js` as first-class surfaces, not as an appendix.

## The state vaxapp is actually in today (verified 2026-09-17)

Anyone starting step 1 needs to know this, because the repo is not in a clean state and
the handoffs describe it slightly wrong.

**Committed on `main`, and therefore live on the deployed app:** the P0-1 infant-interval
bug. `recommendations.js` recommends the infant MenACWY primary series with `minInt: 28`
and prints the sentence "Min 4 weeks between the first three doses". ACIP requires 8.

**And the committed state contains the drift this whole exercise is about:** the same
committed tree's `scheduleRules.js` already carries `i:[null,56,...]` — 56 days, 8 weeks
— for MenACWY. So vaxapp's *validator* has been enforcing 8 weeks while its *engine*
recommended 4 and its card text said 4. One rule, two committed copies, disagreeing, on
the live site. That is exactly the failure P2-1 was built to end, and it is a better
argument for this roadmap than anything written above.

**Uncommitted in the working tree:** a finished, green port of the 8-week fix — 9 files,
+158/−24, including `buildOptimalSchedule.js` (surface 5) and `compliance.js`, plus a
`MENACWY_INFANT_EARLY_GAP = 56` constant explicitly ported from this repo's
`intervals.js`. It was deliberately left uncommitted and **is not to be committed,
rebased or stashed without asking the owner first.**

Practical consequence: expect a dirty tree, and do the inventory against **`HEAD`**, not
against the working tree, or the numbers you write down will be the ones that are not
shipped.

## The first concrete task

Step 1, scoped to one thing so it can actually be finished: **inventory the MenACWY and
MenB rules across all seven files listed above, in plain English, each with file:line and
the citation the code claims.** Mark every row where two surfaces disagree. Do not fix
anything while doing it — the disagreements are the deliverable.

The infant-interval row above is already filled in and can serve as the worked example of
the format.

## What not to do

- Do not start at step 4. `intervals.js` is tempting to port straight across because it
  already exists and is already tested. Ported into vaxapp before the inventory, it would
  quietly standardise on whichever of the disagreeing copies it happened to be given.
- Do not treat MeningoVax's module as a finished inventory. Its own header says which
  group is still outstanding (age thresholds), and it is meant as a home to move things
  into, one group at a time, with the suite green in between.
- Do not port clinical fixes from this repo into vaxapp without an explicit go-ahead.
  The two apps knowingly disagree right now; that is a standing owner decision, not an
  oversight.
