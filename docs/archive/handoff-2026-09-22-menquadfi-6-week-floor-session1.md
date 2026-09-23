# MeningoVax — Handoff after MenQuadfi 6-week floor, Session 1 (M1+M2) (2026-09-22)

Branch: `fix/menquadfi-6-week-licence-floor`, off `main` @ `ceaa0c5`. **NOT pushed, no PR** —
main is protected (branch → PR → squash-merge, per the `ship` skill); the queue's own
Session 2 prompt does the ship step after M3-M5 and live-verify, so this session
deliberately stops short of that.

Baseline was 1,553 passing tests (130 files), clean tree. Now **1,571 passing (132
files)**, all green, working tree clean at commit `9b5ff92`.

Source queue: `.claude/prompts/fix-2026-09-22-menquadfi-6-week-licence-floor.md`
(gitignored, lives on disk only — the file itself has the full clinical background,
owner decisions, and both session prompts).

## What's done

**M1 — licence floor stored in the unit its source states it in.** MenQuadfi's minimum
age is `minAgeDays: 42` in `src/data/brands.js` (was `minAgeM: 24`), not an approximate
months figure — no whole-number-of-months value means exactly 42 days for every birth
month. `validate.js`, `intervals.js` (`ageMeetsMinimumDays`), and `fmtMinAge` now handle
a days-stated floor exactly when a date of birth is on file (with the same 4-day CDC
grace applied everywhere else in the app), and fall back to the existing months-based
approximation when there is no date of birth to be exact with.

**M2 — licence floor split from schedule floor.** `MENACWY_LICENCE_MIN_AGE_DAYS`
(`brands.js`, 42 — "could this dose have been given") and
`MENACWY_SCHEDULE_MIN_AGE_MONTHS` (`ages.js`, 2, value unchanged — "does the app ask for
one yet") replace the old single `MENACWY_MIN_AGE_MONTHS`. `MENACWY_INFANT_SERIES_BRANDS`
now means "licensed anywhere in the infant band," not "licensed at the single youngest
age" — the old definition would have silently dropped Menveo now that MenQuadfi's floor
is younger. `test-grid.js`'s `MENACWY_SWEEP_BRAND` is pinned to Menveo explicitly for the
same reason (it used to re-derive to whichever brand had the lowest floor).

**Both landed in one commit, not two.** Removing MenQuadfi's `minAgeM` immediately breaks
`menacwyBrandLabelsForAge()` for every age, not just infant ones — an `undefined`
`minAgeM` makes every `ageMonths >= b.minAgeM` comparison false, which would silently
drop MenQuadfi from adolescent, adult, and booster recommendations too. There was no safe
intermediate commit between "MenQuadfi has a days floor" and "every floor reader
understands both units," so this session made both changes together rather than
pretending a clean M1-only checkpoint existed. This deviates from the queue's literal
"either do both in one sitting or make M1 skip" instruction only in that it skips the
"skip" option — that option turned out not to be safely shippable on its own.

**8 pre-existing tests repaired** (all now assert the new, correct behavior):
- 3 asserted the old 24-month rule directly (`validate.test.js`,
  `validate-new-rules.test.js`, `regression-dateless-minage.test.js`).
- 3 borrowed "MenQuadfi at 12mo, invalid" as a convenient unrelated invalid-dose fixture
  for renumbering tests (`analyzeHistory.test.js`, `validate-new-rules.test.js`) —
  rebased onto a before-birth date instead, so they stop being hostage to a clinical rule
  they don't actually test.
- 1 asserted a card offers exactly `['Menveo 2-vial (MenACWY)']`
  (`regression-imp-p1-2-implausible-risk-age.test.js`) — correctly offers two brands now.
- 1 (`regression-p2-3-ages-in-one-place.test.js`) is P2-3's own structural check that
  every offered brand is licensed at its offered age — needed to become unit-aware itself
  once a brand's floor could be in days.
- `sweep-never-events.test.js`'s property-1 brand-floor map needed the same unit-aware fix.
- `docs/agent/testing.md`'s "Measured counts" table was updated to match (130→132 files,
  1,553→1,571 tests) — a tripwire test checks this table against the real repo.

**New tests added**, both layers per this app's testing convention:
`src/logic/__tests__/menquadfi-6-week-floor.test.js` (15 tests: exact-42-day validity
across 6 DOBs spanning short/long/leap birth months, the 4-day grace boundary at 38 days,
37-day invalid, the other 8 products' floors unchanged, and the licence-vs-schedule split
itself — a 7-week-old with asplenia is told nothing is due yet but a MenQuadfi dose
actually given at 7 weeks counts) and
`src/components/__tests__/menquadfi-6-week-floor-ui.test.jsx` (3 tests: the 7-week-old's
card renders "Not yet age-eligible", the 2-month-old's card renders both brand chips).

**One correction to the queue's own draft**, worth the owner knowing about: the queue's
M1 test list said "a MenQuadfi dose at 41 days is invalid." That contradicts this app's
own established 4-day-grace rule (CDC: "administered ≤4 days before the minimum age...
considered valid," already enforced identically for every other age/interval in this
codebase — see `regression-p1-1-four-day-grace.test.js`). 42 − 4 = 38, so 41 days is
comfortably within grace and is **valid**, not invalid. This session implemented and
tested the grace-consistent behavior (37 days invalid, 38+ valid) rather than the queue
draft's literal "41 invalid," on the reasoning that the queue's own "(38 days) ... grace
behaviour ... whichever way it goes" phrasing shows the author hadn't worked out the
grace boundary precisely at draft time. Flag this if it needs a second look.

## What's NOT done — the remaining queue

- **M3 — card copy** (`src/logic/recommend.js`, 7 sentences, all currently wrong or
  brand-specific where the card now offers two brands). Owner-approved wording already
  exists for the 6-week-start case ("6 weeks, then 4, 6 and 12 months") — no design-review
  round trip needed. Full list of the 7 lines is in the queue file.
- **M4 — citations.** The MenQuadfi package insert has **not** been fetched live. Use the
  `verify-clinical-source` skill; do not write that citation from memory or from the WA
  DOH paraphrase already in the queue file. MMWR/CDC citations for dose counts/intervals
  are unchanged and reusable.
- **M5 — docs + rulebook.** `docs/agent/meningococcal-rules-summary.md` and
  `docs/agent/clinical-rules.md` still describe a "4-dose Menveo series" (brand-specific);
  `rule-docs-match-code.test.js` will fail once M3's code changes land until these are
  updated — that's the tripwire working, not a bug. The clinician-facing rulebook artifact
  needs republishing to its existing URL as **v7** (currently v6, published 2026-09-18,
  per memory `project_meningovax_rulebook_artifact`).
- **Live verification and shipping** — not started. Queue's own "Session 2 prompt"
  section has the exact instructions (drive the dev server with a 7-week-old, a
  2-month-old, and an 8-month-old, all with asplenia; then ship via the `ship` skill).

## Why this is a good stopping point

M1+M2 is a complete, independently-correct unit: the data model and every consumer that
reads it are consistent, tested at both the exact-day and card-rendering level, and the
full suite is green. Nothing in M3-M5 requires re-opening this commit — they're pure
additions (copy, citations, docs) on top of a floor that already behaves correctly.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout fix/menquadfi-6-week-licence-floor`
2. Run `npm test` — confirm **1,571 passing (132 files)** before any new work.
3. Read the queue file's "Session 2 prompt" section verbatim and follow it — it already
   has the exact scope (M3, M4, M5, live-verify, ship) and the specific gotchas
   (don't re-litigate M3's copy, don't skip the live package-insert fetch for M4).
4. Per-item workflow (via the `fix-queue` skill): reproduce → failing test → fix → full
   suite green → commit named by item ID (M3/M4/M5).
5. Do not push or open a PR until M3-M5 are done and the app has been live-verified in the
   running dev server — main is protected, branch → PR → squash-merge via the `ship` skill.
6. **Do not touch vaxapp** (owner instruction, 2026-09-22) — it has the same MenQuadfi
   floor and is explicitly out of scope for this whole queue. The two-number pattern
   built here (licence floor in days/months as the source states it, split from a
   schedule floor) is meant to port there later, where it matters more; run the
   `vaccine-parity` skill before that port, not before this one.
