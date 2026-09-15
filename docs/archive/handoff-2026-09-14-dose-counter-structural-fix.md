# MeningoVax — Dose-counter structural fix (F1–F6): plan only, nothing built (2026-09-14)

Branch: `main`, clean, in sync with `origin/main` at `94c7c81`. **Nothing was implemented
this session** — this is a diagnosis + plan handoff. Suite verified at the time of writing:
**399 passing (29 files)**, all green. Confirm that number before starting.

Repo: `~/Downloads/MeningoVax-main`. Live: https://jojohuhu-git.github.io/MeningoVax/
Dev server: `preview_start` name `"MeningoVax dev server"` (this repo's `.claude/launch.json`,
port 5175; a server already running on **5179** from another session also works).

**`main` is protected — branch, PR, squash merge. Do not push to `main`.**

---

## The bug, reproduced live (not remembered)

Owner's case: **age 82**, HCT checkbox only, Menveo 2024-04-05 / 2024-07-05 / 2024-10-04,
Bexsero 2025-02-05. Driven in the running app 2026-09-14:

```
MenACWY — "Complete" / "Up to date"
  D1 · Apr 5, 2024 · age 79y7m · Menveo    [Dose 1 of 1]
  D2 · Jul 5, 2024 · age 79y10m · Menveo   [Dose 2 of 1]   <- N > M
  D3 · Oct 4, 2024 · age 80y1m · Menveo    [Dose 3 of 1]   <- N > M
MenB — "Not routinely indicated" / "Not needed"
  D1 · Feb 5, 2025 · age 80y5m · Bexsero   [Counts]        <- meaningless word
```

### Root cause (three layers)

1. **Two numbers, two modules, no comparison.** The left number (`effectiveDoseNum`) is
   counted by `validate.js`, which has no ceiling because it does not know the series size.
   The right number is the *current recommendation's* `seriesTotal`, passed as a prop at
   `src/components/RecCard.jsx:281` and concatenated at `src/components/RecCard.jsx:107`.
   They meet for the first time **in the UI**, where nothing checks them.
2. **A wrong denominator.** This patient's rec is the healthy-adult "Complete" branch,
   `src/logic/recommend.js:516`, carrying `seriesTotal: 1`. Routine adolescent MenACWY is
   **2** doses (11–12y + the 16y booster) — vaxapp has this right at
   `src/logic/compliance.js:173`. `seriesTotal` is hand-typed into ~20 separate `rec()`
   calls, which is how one drifted.
3. **Every existing guard is keyed to a young age.** `< 10y`, `< 16y`. Above 16 there is
   no guard at all. The app was written for adolescents and degrades silently for adults.

### Why the previous fix did not hold

Commit `3172a0a` ("Change 3: chips never show N > M") wrote the rule as a locked invariant
but implemented it as **one narrow special case** — `src/logic/validate.js:381` only demotes
a *second* dose given *before age 16*. These doses were given at 79–80, so it never fires.

**The suite currently asserts the bug.** `src/logic/__tests__/validate-new-rules.test.js:639`
("a dose given at ≥16y after an already-counted primary dose DOES advance the count")
expects `effectiveDoseNum: 2` for a 21-year-old whose rec carries `seriesTotal: 1`. That test
passing *is* "Dose 2 of 1". **F2 cannot land until this test is rewritten** — expect it to go
red and do not "fix" it by reverting the code.

---

## The queue

All of **F1–F6 is display-only** — no vaccine recommendation changes. P1 below is clinical
and is deliberately **not** in this queue.

### F1 — One table of series totals (P0)
Replace ~20 hand-typed `seriesTotal` literals in `recommend.js` with a single table keyed by
**schedule**, not vaccine (the total legitimately varies): MenACWY routine 2 · MenACWY
high-risk primary 2 · MenACWY infant 4 (3 on the D6 shortcut) · MenB healthy 2 · MenB
high-risk 3. Corrects routine MenACWY from 1 → 2 as part of the move.
Ports vaxapp's `STANDARD_SERIES_TOTAL` (`src/logic/compliance.js:159`).

### F2 — Number doses against the total, so `N > M` is unrepresentable (P0, core)
Compute the schedule (hence the total) **before** numbering doses; pass it into
`analyzeHistory`; any valid dose past the total returns `extraDose: true,
effectiveDoseNum: null`. Ports vaxapp's `VALID_EXTRA` *decision*
(`src/logic/compliance.js:398`) — **do not port `extraDoseIndices()`**, it is built for
combination vaccines (Pentacel/Vaxelis intermediate doses) and MeningoVax has no combo
schedules.

**Known design wrinkle — this is why the last three attempts were special cases.** Today
`recommend()` calls `analyzeHistory()` *first* and builds the rec from its output, so the
total is not known when numbering happens. Doing this properly means extracting a small pure
"which schedule does this patient have?" function that runs before both. That is a refactor
of the engine entry point, not a patch. Budget for it.

### F3 — Make the existing guard age-independent (P0)
Replace *"a second dose before 16 doesn't count"* with *"a valid dose beyond the series total
is an extra dose"* — true at 14, 22 and 82. The `<16` rule **stays** as a real clinical
special case (a pre-16 second dose isn't the booster even though the total is 2); it simply
stops being the only thing preventing `N > M`.

### F4 — The sweep test (P0 — the item that makes this stick)
Every age **0–120 years** (the app's own input range, `StepAge.jsx` `max="120"`) × risk-factor
combinations × dose histories 0–5, asserting on every result:
- no chip ever shows `N > M`
- no chip ever reads "Counts"
- no dose is ever numbered against a null total

Every prior fix here shipped with an example test for the one age it was about. That is
precisely why 82 broke. **If only one item gets done, do this one** — it proves the bug at
every age rather than at the owner's.

### F5 — Delete the "Counts" fallback (P0)
`src/components/RecCard.jsx:107` ends in `: 'Counts'` — a catch-all for states nobody
enumerated. Replace with an explicit engine-named state: `counted` / `extra` / `off-window` /
`invalid` / `unknown` / `no-series-indicated`. The UI renders a label it was **given**; it
never invents one when numbers are missing. "Counts" was also the word the owner had already
asked to remove in the July Results-tab redesign (C2) — it survived as a dead fallback.
**Owner picks the replacement wording** for the no-series case (suggestion, not a decision:
"Recorded — not part of an indicated series"). Ask.

### F6 — Run the same sweep against vaxapp (P1, short)
vaxapp carries the identical narrow rule at `src/logic/stateHelpers.js:87`
(`menACWYRoutineCount` — also only drops doses given *before* 16). **I did not prove a visible
vaxapp symptom; do not repeat it as one.** The sweep settles it. vaxapp already has the totals
table, so any fix should be small.

---

## Additional test cases (owner-requested gap review)

### Is the fix actually right?
- **Denominators are clinically correct, not merely consistent.** The sweep proves the app
  never says "3 of 2"; it does *not* prove "2" is right. Spot-check each total in F1 against
  source.
- **Exact birthdays** to the day: 10, 11, 16, 19, 22, 24, 26 years. A month-step sweep steps
  over off-by-ones. (`regression-e1-age10-exact-birthday.test.js` is the existing pattern.)

### Does the fix break what currently works?
- **Legitimate boosters must not be relabelled "extra." This is the main risk of F2, and it
  wants a failing test written BEFORE any F2 code.** By design `seriesTotal` excludes
  boosters, so a high-risk patient on their 4th lifelong booster has doseNum 4 against total
  2 — correct today. A careless clamp would call that an extra dose and tell a patient to
  stop boosting.
- **A patient with many doses.** An 82-year-old with asplenia may legitimately have 10+
  MenACWY doses from 40 years of q5y boosters. Stresses the booster-vs-extra line at exactly
  the ages that keep breaking.
- **The pentavalent card** turns on when MenACWY *and* MenB are both due today. If F2 shifts
  what counts as due, that card moves without anyone looking at it.
- **All five output surfaces**: advisory banner · MenACWY card · MenB card · pentavalent card
  · recorded-doses panel. The recorded-doses panel is the one that leaked here.

### Older-patient gaps
- **Banner and card must not contradict each other.** This case showed the advisory saying
  "2 doses" while the card said "Complete" — on one screen. Nothing tests that today, and it
  is the part that would actually mislead at the bedside.
- **Doses entered out of chronological order** (the owner entered this patient's as 10/4,
  7/5, 4/5). `analyzeHistory` sorts; nothing asserts the answer is identical either way.
- **A risk factor ticked after doses are entered** — must re-grade the whole history.
- **Undated / unknown-brand doses in an adult** — the unknown path is well tested in children,
  barely above 20.
- **Extremes:** 120 years (app maximum) and under 2 months (below the MenACWY floor), each
  with and without recorded doses.

---

## P1 — clinical, NOT in this queue, blocked

**Should the post-HCT 2-dose MenACWY schedule apply above age 18?**

Current coded rule, identical in both apps (this is parity, not a bug):
> 2 doses, 2 months apart, 6–12 months after transplant, **for ages 11 through 18 or any age
> with a high-risk condition** (asplenia, persistent complement deficiency, or
> eculizumab/ravulizumab). No booster from the transplant alone.
> (`recommend.js:759` / vaxapp `src/logic/hctRecipe.js:133`)

Two prior commits are often misremembered as having fixed this:
- `ba255ef` (PR #9) removed the **visibility** ceiling — outside the bands *no line rendered
  at all*; now a line always renders above each vaccine's minimum age. The band survived one
  level down, choosing *which of three texts* the line gets.
- `a0106f4` (PR #10) changed the **wording and interval** to "2 doses, 2 months apart" —
  inside the 11–18 branch only.

Neither gave `hct` a MenACWY schedule: `src/data/riskFactors.js:66` still has
`menacwyClass: undefined`, so the advisory is **text only** and never reaches the engine.
Even an in-band 14-year-old sees "2 doses, 2 months apart" in the banner while the card below
computes a separate routine answer.

**The open question.** The stored ASCO quote (`src/data/refs.js:336`, live-verified
2026-09-14) is from a guideline for **adults** with cancer and carries no upper age:
> "Two doses of quadrivalent meningococcal vaccine 2 months apart are recommended 6-12 months
> after transplant for recipients with risk factors."

The 11–18 ceiling traces to **IDSA 2013** (`refs.js:341`), explicitly "persons aged 11–18
years", predating MenB licensure. Whether ASCO's "recipients with risk factors" means the
transplant itself, or an *additional* condition, decides whether an 82-year-old gets the
schedule. **Do not infer it from the stored fragment** — read the full ASCO passage live via
the `verify-clinical-source` skill. Note: CDC and ASCO have both returned 403 to automated
fetching; the owner may need to open the pages.

Then: `vaccine-parity` skill, because vaxapp's `hctRecipe` and PneumoVax's advisory must move
in step. F1–F6 make this *easier* — once the engine owns "which schedule does this patient
have," giving `hct` a real MenACWY schedule becomes a table entry instead of new branching.

---

## Why this is a good stopping point

Nothing is half-built — the tree is clean and green at 399. The diagnosis is verified against
the running app and the git history rather than recalled, so the next session starts from
evidence. F1–F6 are display-only and independent of the clinical P1, and F4 alone has standalone
value even if the rest is deferred.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout -b <branch>` off `main`.
2. Run `npx vitest run` — confirm **399 passing (29 files)** before any new work.
3. Start the dev server (`preview_start`, name `"MeningoVax dev server"`) at the start of the
   session, per the owner's standing rule.
4. **Owner decisions needed before coding — ask, do not default:**
   - F5: the replacement wording for the no-series chip.
   - Whether F6 (vaxapp sweep) runs in the same session or its own.
   - P1 is blocked on the ASCO read; do not start it without an explicit go-ahead.
5. Per-item workflow (`fix-queue` skill): reproduce → **failing test first** → fix → full
   suite green → verify in the running app → commit named by item ID. One item at a time.
   Synthetic fixtures only, never PHI.
   Suggested order: **F4 (sweep, goes red) → boosters-aren't-extra test (also red) → F1 → F2
   → F3 → F5 → F6.** The two red tests define the boundary the fix must respect before a line
   of fix code is written.
6. Ship per the `ship` skill: branch → PR → `gh pr merge --squash`. **Never push to `main`.**
