> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-09-22-menquadfi-6-week-licence-floor.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# Fix queue — MeningoVax MenQuadfi 6-week licence floor (2026-09-22)

**Status: FULLY SHIPPED, 2026-09-23.** M1+M2 landed session 1 (commit `9b5ff92`). M3-M5
landed session 2 (PR #63, squash-merged to `main`, deployed). One follow-up (a doubled
"infant" in two of M3's new sentences, found live-verifying #63 on the deployed site) was
fixed and shipped separately (PR #64, merged, deployed). Rulebook artifact republished as
v7. Final state: `main` green, 1,579 tests (up from the 1,553 baseline below). This queue
is closed — nothing remains in it. (A genuinely separate, pre-existing display bug was
found during live-verify — 6-week-old dose ages showing "5 weeks" — and flagged as its own
follow-up task rather than folded in here; see memory or ask for `task_4fbb33f3`.)

**Baseline (session 1 start):** branch `main` @ `ceaa0c5`, **1,553 tests passing (130
files)**, working tree clean.
**Verified by running, not by reading** — every number in this document came from an actual
run on the baseline above. Where a claim is a prediction rather than a measurement, it says so.

**Gating rules (from CLAUDE.md / global standards):**
- Clinical source verification is **done** for the rule itself (quoted below), but **NOT** for
  the MenQuadfi package insert — M4 still needs a live fetch. Do not write the insert citation
  from memory.
- Both test layers for any visible change: logic (node) + UI (happy-dom).
- Ship via the `ship` skill (MeningoVax: branch → PR → squash-merge; `main` is protected).
- Parity: MenQuadfi's floor also lives in **vaxapp**. See "Cross-repo" at the bottom —
  vaxapp is explicitly **out of scope for this queue**, by owner instruction.

---

## The change, in one paragraph

MenQuadfi's minimum age dropped from 2 years to 6 weeks. In MeningoVax this changes almost no
recommendations — nothing in the meningococcal schedule asks for a dose before 2 months — but it
does two things: it makes MenQuadfi a valid infant product alongside Menveo, and it introduces
the first product whose **licensed-from** age and **schedule-asks-from** age are different
numbers. That second point is the real work.

---

## Clinical source (verified live 2026-09-22)

Washington State DOH, Immunizations and Vaccines:

> "Updated MenACWY recommendations to align with the American Academy of Pediatrics. The
> minimum age for the first MenQuadfi dose is now 6 weeks, instead of 2 years for children
> who meet the recommendation."

https://doh.wa.gov/you-and-your-family/immunizations-and-vaccines

**This is an AAP change, not a state-level call.** MeningoVax's existing authority rule already
covers it — `docs/agent/meningococcal-rules-summary.md:17-20`: *"where they disagree, AAP
governs; never adopt a CDC revision recommending fewer doses or narrower eligibility than AAP."*
No new exception is needed. This is that rule firing for the first time, and it will be the
first non-CDC clinical citation in `refs.js` (today it is 100% CDC/ACIP/MMWR — checked).

"...for children who meet the recommendation" is read as: the 6-week floor applies to infants
with a **risk indication**, not routine healthy infants. MeningoVax already only offers infant
MenACWY when a risk factor is ticked, so nothing changes there. **Owner-confirmed.**

---

## Owner decisions (2026-09-22) — apply, do not re-litigate

1. **ACIP/AAP endorsed, not FDA-label-only.** Proceed as a real schedule change.
2. **MenQuadfi and Menveo have the same infant schedule** — same dose counts, same bands.
3. **Same intervals.** Treat the two products identically.
4. **Build the two-number split properly** (licensed-from vs schedule-asks-from), cleanly enough
   that the pattern ports to vaxapp later, where 6-week products are the norm.
5. **Boosters do not change** regardless of brand.
6. **Interchangeable, including mid-series.** Start on Menveo, finish on MenQuadfi — the dose
   counts. *(No work needed: the app has no MenACWY brand-matching rule at all, so this is
   already the behaviour.)*
7. **The app recommends from 2 months, not 6 weeks.** A 6-week dose that was actually given
   **counts**; the app never **asks** for one.
8. **Card copy for a 6-week start is signed off:** *"6 weeks, then 4, 6 and 12 months."*
   No design-review round trip needed.
9. **Citation shape:** package insert (for the licensed age) + MMWR/CDC (for the schedule) +
   WA DOH (for the "why"), cited together where the "why" needs explaining.
10. **Standing authority note:** owner is comfortable with a state DOH resource as tiebreaker
    when CDC/ACIP lag. Not needed for this change (it resolves as AAP-governs), but worth
    recording separately — see "Follow-ups" below.

---

## Evidence gathered (all measured on `ceaa0c5`)

### The 6wk / 4 / 6 / 12 schedule clears every interval rule

Ran the real dates through the app's own gates. Floors: early gap 56 days (8 weeks), final gap
84 days (12 weeks), final dose not before 12 months.

```
DOB 2026-01-01   d1→d2 78d OK   d2→d3 61d OK   d3→d4 184d OK   age@d4 = 12.00mo
DOB 2026-02-01   d1→d2 78d OK   d2→d3 61d OK   d3→d4 184d OK   age@d4 = 12.00mo
DOB 2026-01-31   d1→d2 78d OK   d2→d3 61d OK   d3→d4 184d OK   age@d4 = 12.00mo
DOB 2026-07-31   d1→d2 80d OK   d2→d3 62d OK   d3→d4 181d OK   age@d4 = 12.00mo
DOB 2026-11-15   d1→d2 78d OK   d2→d3 61d OK   d3→d4 184d OK   age@d4 = 12.00mo
DOB 2027-02-28   d1→d2 78d OK   d2→d3 61d OK   d3→d4 184d OK   age@d4 = 12.00mo

failures: 0        series total: 4 (correct — a 6-week start is below the 3–6mo shortcut band)
```

A 6-week start is **looser** than the standard schedule, not tighter:

| | tightest gap | floor |
|---|---|---|
| standard 2 / 4 / 6 / 12 | 59 days | 56 |
| 6 weeks / 4 / 6 / 12 | 61 days | 56 |

The narrow gap in both is 4→6 months, identical in each. The 6-week start introduces no new
interval risk anywhere.

### Why the floor must be stored in days

```
"6 weeks" in months:  1.367 – 1.452   (varies by birth month)
"2 months" in days:      59 – 61      (varies by birth month)
"9 months" in days:     273 – 275
```

There is no month number that means 42 days: pick 1.45 and a July-born baby dosed exactly on
time is wrongly rejected; pick 1.37 and a February baby's early dose is wrongly accepted.
**Converting the other way is equally wrong** — storing Menveo as "61 days" would reject a
15-November baby who reaches 2 months in 59.

**Rule: store each floor in the unit its source states it in.** Weeks-stated → days.
Months/years-stated → months. One field each, whichever applies.

### Licence floors, all nine formulations

| Product | Type | Source states | Store as |
|---|---|---|---|
| Menveo 2-vial | MenACWY | 2 months | 2 months |
| Menveo 1-vial | MenACWY | 10 years | 120 months |
| **MenQuadfi** | MenACWY | **6 weeks** | **42 days** ← the only one |
| Menactra *(discontinued)* | MenACWY | 9 months | 9 months |
| Menveo *(legacy label)* | MenACWY | 2 months | 2 months |
| Bexsero | MenB | 10 years | 120 months |
| Trumenba | MenB | 10 years | 120 months |
| Penbraya | MenABCWY | 10 years | 120 months |
| Penmenvy | MenABCWY | 10 years | 120 months |

Only MenQuadfi has a schedule floor different from its licence floor (6 weeks licensed /
2 months scheduled). Every other product's two numbers are identical.

### What breaks if you only change the number

Flipped `minAgeM: 24` → `2` and ran the suite: **7 failures across 5 files** (down from 37 if
the naive `1.5` is used instead). Classified:

**Assert the old rule — rewrite (3):**
- `src/logic/__tests__/validate.test.js:49` — "MenQuadfi at 12 months → invalid (min age 24 mo)"
- `src/logic/__tests__/validate-new-rules.test.js:472` — same
- `src/logic/__tests__/regression-dateless-minage.test.js:55` — same, undated dose

**Borrowed "MenQuadfi at 12mo" as a generic invalid-dose fixture — re-base onto a different
invalid dose (3).** These test first-dose-invalid renumbering and have nothing to do with
MenQuadfi:
- `src/logic/__tests__/analyzeHistory.test.js:377`
- `src/logic/__tests__/validate-new-rules.test.js:509`
- `src/logic/__tests__/regression-dateless-minage.test.js:72` *(asserts the note text names the
  24-month minimum)*

**Correct behaviour change — widen the assertion (1):**
- `src/logic/__tests__/regression-imp-p1-2-implausible-risk-age.test.js:164` — asserts a card
  offers exactly `['Menveo 2-vial (MenACWY)']`; it now offers two brands.

### The card contradiction, rendered live

With the floor at 2 months, `recommend({ ageMonths: 8, riskIds: ['asplenia'] })` produced:

```
brands: ["Menveo 2-vial (MenACWY)", "MenQuadfi (MenACWY)"]
lead  : "Start the 2-dose Menveo series — dose 2 at least 12 weeks after dose 1…"
detail: "…Only Menveo is licensed for infants from 2 months."
```

The card offers MenQuadfi as a pickable chip directly below a sentence saying only Menveo is
licensed that young. **This is M3 and it is the most visible part of the change.**

---

# The queue

Work one item at a time. Test first, full suite after each, commit per item.

---

## M1 — Licence floors stored in the unit their source states (data + validator)

**One-liner:** Add a days-based licence floor so MenQuadfi's 6 weeks can be expressed exactly,
and set it. Nothing about what the app *recommends* changes in this item.

**Change:**
- `src/data/brands.js` — add an optional `minAgeDays` alongside `minAgeM`. A product carries
  **one or the other**, matching how its source states the rule. Set MenQuadfi to
  `minAgeDays: 42` and remove its `minAgeM: 24`. Leave all eight other products untouched.
- Document in the file header **why** both units exist, with the 59–61 / 1.367–1.452 numbers
  from the Evidence section. Without that, a future tidy-up will "simplify" them back into one
  unit and silently reintroduce the bug.
- `src/logic/validate.js` — the min-age check and `fmtMinAge()` must handle a days floor.
  `fmtMinAge(42 days)` should print **"6 weeks"**, never "1.4 months".
- Check the 4-day grace (`ageMeetsMinimum`, `intervals.js:406`) still behaves sensibly against
  a days floor — it should, but assert it rather than assuming.

**Tests:**
- A MenQuadfi dose at exactly 42 days is **valid**, for at least six DOBs spanning short and
  long birth months (this is the case a months-based floor gets wrong — see Evidence).
- A MenQuadfi dose at 41 days is invalid; at 38 days (42 − 4 grace) the grace behaviour is
  pinned explicitly, whichever way it goes.
- The other eight products' floors are unchanged — assert against the table above.
- Repair the 6 tests listed under "Assert the old rule" and "Borrowed fixture". For the three
  borrowed-fixture tests, pick an invalid dose that is **not** age-based if possible (e.g. a
  too-soon interval), so the fixture stops being hostage to a clinical rule.

**Gotcha:** `MENACWY_MIN_AGE_MONTHS` is `Math.min(...MENACWY_BRANDS.map(b => b.minAgeM))`. Once
MenQuadfi has no `minAgeM`, that reduce sees `undefined` and yields `NaN`. **This will fail
loudly and that is intentional** — it is the seam M2 exists to fix. Either do M1 and M2 in one
sitting, or make M1's version explicitly skip products without `minAgeM` and leave a comment
pointing at M2.

---

## M2 — Split "licensed from" and "schedule asks from" (the real work)

**One-liner:** One derived constant currently means two different things that happen to be equal.
MenQuadfi makes them different. Split them and audit every consumer for which one it meant.

**Why this is the risky item:** this is the same shape as the P2-3 problems — a number that was
correct only because two rules coincided. Every consumer has to be read and decided, not
pattern-replaced.

**Change:**
- `src/data/brands.js` keeps the **licence** floor: the youngest age any MenACWY product may be
  *given*. With MenQuadfi at 42 days this becomes 42 days, not 2 months.
- `src/logic/ages.js` gains the **schedule** floor: the youngest age the app *asks* for a
  MenACWY dose — 2 months, sourced from CDC's "Dose 1 at age 2 months" row. This belongs in
  `ages.js` by that file's own stated charter ("the AGE at which a dose becomes due"), and its
  header already says product licence floors are deliberately *not* there. Follow that split.

**Consumers to audit — decide for each which floor it wants:**

| Site | Currently reads | Almost certainly wants |
|---|---|---|
| `recommend.js:432` — high-risk single/single+boost age gate | `MENACWY_MIN_AGE_MONTHS` | **schedule** floor |
| `recommend.js:865` — infant series "not yet age-eligible" gate | `MENACWY_MIN_AGE_MONTHS` | **schedule** floor |
| `recommend.js:436, 869, 870` — the text those gates print | interpolated | **schedule** floor |
| `validate.js:106` — unknown-brand permissive fallback | `MENACWY_MIN_AGE_MONTHS` | **licence** floor (most permissive, by design) |
| `brands.js:206` — `MENACWY_INFANT_SERIES_BRANDS` | brands at the min age | see below |
| `test-grid.js:77-78` — `MENACWY_SWEEP_BRAND` | brands at the min age | see below |

**`MENACWY_INFANT_SERIES_BRANDS` needs rethinking, not re-pointing.** It currently asks "which
brands are licensed at *the single youngest age*?" That question gives the wrong answer as soon
as two products have different floors — at a 42-day floor it returns MenQuadfi **only**, silently
dropping Menveo from every infant card. Verified: with a 1.5-month floor,
`regression-d2-d5-d6-d7.test.js` fails on *"Infant rec (7m) → brands contain 2-vial"*.
Ask instead: **which brands are licensed anywhere in the infant band?** Expected result:
`["Menveo 2-vial (MenACWY)", "MenQuadfi (MenACWY)"]`.

**`MENACWY_SWEEP_BRAND` is the silent one.** It picks `menacwyBrandLabelsForAge(floor)[0]`. When
the floor moved in the experiment, the sweep brand changed and **all 278,232 sweep rows kept
passing** — Menveo would have dropped out of every property sweep with zero signal. Pin it
explicitly, and add an assertion that the sweeps cover **both** infant-licensed MenACWY brands.

**Tests:**
- A 7-week-old with asplenia: the app says **nothing due yet** (schedule floor), but a MenQuadfi
  dose *recorded* at 7 weeks **counts** (licence floor). This single test is the whole item.
- At 2 months, the infant card offers **both** Menveo 2-vial and MenQuadfi.
- An invariant test that the two floors are allowed to differ and that nothing derives one from
  the other — the tripwire against a future "simplification".
- UI layer: the 7-week-old's card renders the not-yet-due state; the 2-month-old's card renders
  both brand chips.

---

## M3 — Card copy (7 sentences, all currently wrong)

**One-liner:** Seven card strings hardcode "Menveo". With MenQuadfi offered alongside it, each
one either names the wrong product or flatly contradicts the chips beside it.

**Sites — all in `src/logic/recommend.js`:**

| Line | Current text | Problem |
|---|---|---|
| 870 | "Only Menveo is licensed that young; the other MenACWY brands start later." | False |
| 908 | "Start the 4-dose **Menveo** series — doses at 2, 4, 6 and 12 months…" | Names one of two brands |
| 909 | "Only Menveo is licensed for infants from 2 months." | False |
| 937 | "Start the 2-dose **Menveo** series…" | Names one of two brands |
| 938 | "Only Menveo is licensed for infants from 2 months." | False |
| 1122 | "This completes the … **Menveo** series." | Names one of two brands |
| 1125 | "Continue the … **Menveo** series…" | Names one of two brands |

Lines 909 and 938 also hardcode *"from 2 months"* as English **beside** an interpolated
constant — exactly the P0-1 failure mode `ages.js` warns about. The constant would update; the
sentence would not. Interpolate or delete.

**Owner-approved wording for a 6-week start (decision 8):**
> "6 weeks, then 4, 6 and 12 months"

Keep the existing "2, 4, 6 and 12 months" wording for babies who start at 2 months. Only a
first dose recorded before 2 months gets the new sentence.

**Approach:** make these brand-neutral ("the infant MenACWY series") or interpolate from
`MENACWY_INFANT_SERIES_BRANDS` so the sentence cannot drift from the chips again. Do not type
a second brand list.

**Tests:** both layers. No card may name a single brand while offering two chips — worth an
invariant test across the infant band rather than seven separate string assertions.

---

## M4 — Citations

**One-liner:** Three sources, one per kind of claim. The package insert has **not** been fetched
— do this live.

- **Package insert (MenQuadfi)** → the licensed minimum age, "6 weeks". This is the correct
  source for a *licence* fact even though the authority rule ranks FDA lowest for *schedule*
  facts — it is the only document that states a licensed minimum age. Note that distinction in
  the `refs.js` entry so it does not look like a hierarchy violation later.
- **MMWR / CDC** → dose counts and intervals. **Unchanged** — reuse the existing
  `acwyInfantHighRisk2to6mo` / `acwyInfantHighRisk7to23mo` entries.
- **WA DOH** → the "why", and the AAP-alignment explanation. Quote in the Clinical Source
  section above; URL there.

Every new entry needs `url`, exact `quote`, `label`, `short`, and `lastVerified` — the
`citation-freshness` tripwire (12-month limit) enforces the last one.

**Watch:** the `acwyInfantHighRisk2to6mo` citation is attached to the "not yet age-eligible"
card, whose claim changes in M2. Re-read it and confirm it still supports what the card says.

---

## M5 — Documents and tripwires

- `docs/agent/meningococcal-rules-summary.md` — the brand/age table and the infant series
  description. Line 84 currently says "4-dose **Menveo** series".
- `docs/agent/clinical-rules.md` — same rule, second home.
- `rule-docs-match-code.test.js` will fail until both are updated. That is the tripwire working;
  update the prose, do not weaken the test.
- **Rulebook artifact → v7.** The clinician-facing rulebook documents the brand floors in plain
  English. Republish to the **same URL**; the artifact is at v6 (published 2026-09-18) and is
  recorded in memory under `project_meningovax_rulebook_artifact`.
- Add a line to the rulebook noting that MenQuadfi is licensed from 6 weeks but the app
  recommends from 2 months, and why — a clinician reading the app will otherwise wonder.

---

# Session prompts

Copy one of these into a fresh conversation.

---

## Session 1 prompt

```
Work the MeningoVax fix queue at
.claude/prompts/fix-2026-09-22-menquadfi-6-week-licence-floor.md

Use the fix-queue skill. Do items M1 and M2 only — stop after M2 and write a handoff.

Start by reading the whole queue file, then confirm the baseline still matches its header
(main @ ceaa0c5, 1,553 tests, clean tree). If the baseline has moved, say so before starting.

M1 and M2 are closely coupled: M1 removes MenQuadfi's minAgeM, which makes the derived
MENACWY_MIN_AGE_MONTHS go NaN until M2 splits it. Either do both in one sitting or make M1
skip products without minAgeM, with a comment pointing at M2.

The clinical questions are all answered in the queue's "Owner decisions" section — apply them,
don't re-ask. The one thing still needing a live source fetch is the MenQuadfi package insert,
and that belongs to M4 in session 2, not here.

The riskiest part is M2's consumer audit: one constant currently means two different things
that happen to be equal. Read each consumer and decide which floor it wants — don't
pattern-replace. The queue lists all six sites with a recommendation for each.
```

---

## Session 2 prompt

```
Continue the MeningoVax fix queue at
.claude/prompts/fix-2026-09-22-menquadfi-6-week-licence-floor.md

Use the fix-queue skill. M1 and M2 are done (check the handoff from session 1). Do M3, M4 and
M5, then live-verify and ship.

M3 card copy is already signed off by the owner — "6 weeks, then 4, 6 and 12 months" for a
6-week start, existing wording kept for 2-month starts. Don't open a design-review round trip
for it.

M4 needs a live fetch of the MenQuadfi package insert for an exact quotable minimum-age
sentence. Use verify-clinical-source. Do not write that citation from memory or from the WA DOH
paraphrase.

Before shipping: start the dev server (preview_start, "MeningoVax dev server") and actually
drive the app — a 7-week-old with asplenia, a 2-month-old with asplenia, and an 8-month-old
with asplenia. Confirm the cards say what they should and that no card names one brand while
offering two chips. A green suite is not proof.

Then ship via the ship skill (branch → PR → squash-merge; main is protected), and republish the
clinician rulebook artifact as v7 to its existing URL.
```

---

# Cross-repo

**vaxapp has the same MenQuadfi floor and is deliberately out of scope for this queue** — owner
instruction, 2026-09-22. Do not open vaxapp while working these items.

The two-number design (M1/M2) is built to port: vaxapp is where the 6-week distinction actually
matters, because several of its vaccines genuinely start at 6 weeks and the months-only model
will misjudge all of them the same way. When vaxapp's turn comes, the pattern to carry over is
"store each floor in the unit its source states it in", plus the licence-vs-schedule split.

Run the `vaccine-parity` skill before the vaxapp port, not before this one.

---

# Follow-ups (not in this queue)

1. **Record the DOH-as-tiebreaker decision.** The owner is comfortable with a state DOH resource
   as tiebreaker when CDC/ACIP lag. This change did not need it (it resolves as AAP-governs
   under the existing rule), but the decision is worth writing into the authority section of
   `docs/agent/meningococcal-rules-summary.md` and into memory, so it is not re-litigated.
2. **`refs.js` has no AAP entry.** Checked 2026-09-22: every citation is CDC/ACIP/MMWR. The
   authority rule names AAP as the tiebreak, so the first AAP-governed rule arriving with no AAP
   citation available is a gap worth closing — probably by adding the AAP immunization schedule
   as a citable source.
3. **Tests that borrow a clinical rule as scaffolding.** Three of the seven failures came from
   tests using "MenQuadfi at 12 months" as a convenient invalid dose while testing something
   unrelated. Worth a sweep for the same pattern elsewhere — it makes every clinical rule change
   more expensive than it should be.
