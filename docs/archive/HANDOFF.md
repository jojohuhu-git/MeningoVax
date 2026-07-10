# MeningoVax — Handoff

Living handoff for the MeningoVax app. See `CLAUDE.md` for architecture/engine rules.

> ⚠️ This folder is cloud-synced (iCloud/Downloads). Watch for file reversions: if an
> edit "disappears," re-apply it. Commit early once the user authorizes.

---

## Session: 2026-06-04 (session 2) — cross-audit with vaxapp + MenACWY booster fix

Branch: `main`. Shipped. Tests: **154 passing, 6 files**.

MeningoVax served as the ACIP reference engine to audit the sibling vaxapp/PediVax app. Two changes
landed here:

1. **MenACWY high-risk booster cadence corrected** (`recommend.js` + `validate.js`). The old code applied
   one interval (3y if age-at-dose-2 <7y, else 5y) to ALL boosters. Correct ACIP rule (immunize.org
   p2035): first booster 3y after primary if completed <7y (else 5y), then **every 5 years** thereafter.
   Now split on `isFirstBooster` (`given === 2` in recommend.js; `effectiveIdx === 2` in validate.js);
   subsequent boosters always 5y. Unknown dose-2 age → conservative 3y first booster only. +11 tests.
   MenB high-risk booster (1y then q2–3y) was already correct — untouched.

2. **Pentavalent MenB min-age regression guard** (`__tests__/regression-pentavalent-menb-minage.test.js`,
   +3). Locks in that the MenB component of Penbraya/Penmenvy given <10y is flagged invalid on every
   dose. This was a real bug in vaxapp; MeningoVax was already correct (per-dose brand `minAgeM`).

> Note: the booster `isFirstBooster` logic lives in BOTH recommend.js (prediction) and validate.js
> (too-soon-booster check) and must stay in sync.

## Session: 2026-06-04 — UX polish (Phase 1)

Branch: `main`. **Not committed** (per user instruction — awaiting go-ahead).
Tests: **50 passing, 2 files**. Dev server verified in-browser (no console errors).

### Context: two logic questions the user raised
1. **"I picked 11–18y and it said 14 years — how is age determined?"**
   The group chips mapped to a hidden midpoint (`defaultM`): Infant=6mo, Child=6y,
   Adolescent=**14y**, Adult=23y. The engine computes ONE snapshot at that age — there
   is no range/forecast. The hidden midpoint was the confusion, and it also made MenB
   read "not indicated" at 14y (shared-decision only opens at 16–23y).
2. **"History but no dates?"** Dose counting works by array length without dates; dates
   only drive interval timing and age-at-dose rules, which degrade gracefully (the
   engine recommends rather than assuming coverage). See CLAUDE.md "History with no dates".

### Decisions taken (with the user)
- **Age input → Option 2** (keep chips, but surface & let edit the computed age). Option
  3 (range + forecast) deferred as possible future work — low payoff for a 2-vaccine,
  point-in-time tool.
- **Risk factors → merge complement items + clarify college.**
- **Dose validation (valid/invalid explanations) → Phase 2** (net-new, larger).

### Changes shipped this session (Phase 1)

1. **Age input no longer hides the snapshot age** (`StepAge.jsx`)
   - `selectChip` now switches to `'precise'` mode and prefills the Years/Months fields
     from the chip's `defaultM`, under the label "Age used for recommendations — refine
     if needed". Chips are a starting point, not a hidden default.
   - `Results.jsx` gained an inline **"Adjust age ▾"** editor (years/months) wired to
     `onChange={update}` from `App.jsx`; recommendations recompute live as age changes.
     Verified: 14y → 18y flips MenB from "Not indicated" to "Shared decision" and
     surfaces the pentavalent card.

2. **Antigen parens stripped from brand display** (`format.js`, `RecCard.jsx`, `Results.jsx`)
   - New `stripAntigen(label)` helper removes a trailing `(MenACWY|MenB|MenABCWY)` for
     display only. Engine strings + tests unchanged ("Menveo (MenACWY)" still asserted).
   - Applied to rec-card brand list and the pentavalent brand list.

3. **Status shading instead of left-border strip** (`App.css`)
   - `.rec-card` now uses a per-status background tint + matching border (no `border-left`
     strip). due=green tint, catch-up/deferred=amber, risk-based=red, shared-decision=blue,
     complete=grey, not-indicated=white/neutral.

4. **Shared-decision reads as optional, not an error** (`RecCard.jsx`, `App.css`)
   - Status label normalized to "Shared decision". The due pill for shared-decision shows
     **"Offer today (optional)"** with a blue `.due-pill-optional` style (vs the green
     "Due today" for mandatory recs). Visually distinct from grey "Not indicated".

5. **Series progress: done vs due** (`RecCard.jsx`, `App.css`)
   - Cards now render a **"RECORDED:"** block listing each past dose ("D1 · Jul 3, 2025 ·
     Bexsero", or "date unknown" / "brand unknown" when absent), and prefix the current
     rec with a **"Now due:"** tag. `Results.jsx` passes the dose arrays to `RecCard`.

6. **Risk factors** (`riskFactors.js`, `recommend.js`, `recommend.test.js`)
   - **Merged** `complement_deficiency` + `complement_inhibitor` → single `complement`
     item (deficiency + inhibitor in one grey sublabel; refs include
     `cdcComplementInhibitor`). Tests updated to id `'complement'`.
   - **asplenia** keeps "including sickle cell disease" grey sublabel (verified rendering).
   - **college_dorm** reworded: "First-year college student living in a residence hall" +
     sublabel "Check this regardless of history — the tool reads the record and only
     recommends a dose if none was given at age ≥16y."
   - **Engine `single` branch rewritten** to disambiguate:
     - college_dorm: dose confirmed ≥16y → complete; prior dose <16y → "1 dose (booster
       at ≥16y)" with explanatory note; prior dose of unknown age → due with a "cannot be
       confirmed" note; no history → standard single dose.
     - military / ACWY-outbreak: any documented dose → complete; else single dose.
   - Added 4 regression tests (college <16y, college unknown-age, military complete, plus
     the existing college ≥16y).

### Verification
- `npm test` → 50 passing.
- Browser walk-through of the user's exact scenario (Adolescent → 14y → college dorm →
  1 Menveo → no MenB): confirmed shading, brand-without-parens, RECORDED/Now-due,
  college "cannot be confirmed" note, and live age recompute to 18y. No console errors.

---

## Backlog

### Phase 2 — Dose validation + per-dose explanations ✅ SHIPPED 2026-06-04 (Sonnet agent; NOT committed)
- New pure layer `src/logic/validate.js`: `validateHistory(vaccine, doses, ageMonths,
  riskIds, today)` → array parallel to `doses`, each `{ status:'valid'|'invalid'|'unknown',
  reasons:string[], detail? }`.
- Rules (ACIP): MenACWY min age by brand (Menveo ≥8wk, Menactra ≥9mo, MenQuadfi ≥24mo;
  unknown→most-permissive); MenACWY high-risk D2 ≥8wk (≥4wk infant); MenB ≥10y all brands;
  MenB healthy D2 <6mo → valid + "rescue dose needed" (not invalid); MenB high-risk D2 ≥4wk,
  D3 ≥6mo from D1 & ≥4mo from D2; **MenB family mismatch (4C vs FHbp) → invalid** (skipped
  when either brand unknown); no date → 'unknown'.
- UI: `RecCard.jsx` `DoseValidation` chip (green Valid / red Invalid / grey Unknown) +
  reasons/detail in the RECORDED block; `Results.jsx` passes `doseValidations`. CSS
  `.dose-val*` in `App.css`.
- Tests: `src/logic/__tests__/validate.test.js` (+29). Suite now **79 passing, 3 files**.
- Browser-verified: 18y healthy, MenB D1 Bexsero (Valid) + D2 Trumenba (Invalid, family
  mismatch reason shown). No console errors.

### Phase 3 — Effective-dose counting ✅ SHIPPED 2026-06-04
Resolves the Phase 2 follow-up (invalid doses used to still count toward "complete").
- New `analyzeHistory(vaccine, doses, ageMonths, riskIds, today)` in `validate.js` —
  ONE chronological "last-kept" walk (ported from vaxapp `validatedHistory`) returns BOTH
  `{ perDose }` (display, with `effectiveDoseNum`/`doesNotCount`) AND `{ effective }` (the
  kept list the engine counts). `validateHistory()` kept as a thin wrapper.
- `recommend()` now feeds `menacwyRec`/`menbRec` the **effective** lists. Invalid doses are
  dropped → family-mismatch case flips MenB from "Complete" to "Dose 2 of 2 (4C) due."
- Counting policy: invalid → dropped (does not count, "repeat this dose only"); unknown
  (no date) → counts but not a timing anchor; MenB healthy early D2 → counts + rescue note.
- `RecCard.jsx` shows green "Valid / Effective dose N" or red "Invalid ✕ does not count".

### Validation hardening + clarity ✅ SHIPPED 2026-06-04
- **Min ages from `brands.js`** (single source incl. Penbraya/Penmenvy = ≥10y). Fixes the
  "Penbraya at 6mo flagged as <2 months" bug → now "<10 years (120 months)."
- **Booster cadence** (too-soon → invalid): MenACWY high-risk 3y/5y decided by **age at
  dose 2** (<7y → 3y, else 5y) — applied in BOTH `validate.js` AND `recommend.js`'s
  next-booster prediction (kept in sync). MenB high-risk first booster ≥1y after series,
  then ≥2y. Late boosters never flagged.
- **Baseline ≥4-week interval** between any two MenACWY doses (catches duplicates for all
  risk classes; high-risk 8wk D2 still stricter).
- **Family lock** anchors on the first kept *known-brand* dose (handles unknown D1).
- **"Due today" wording** only when truly due today; future → "Eligible {date}".
- **Clinical age units** (`format.js` `fmtAgeMonths`): weeks/months/years, never "72 months".
- **Short citation labels** (`refs.js` `short` field) in chips; full title on hover.
- **Card wording consolidated**: badge ("Due"/"Catch-up"/…) + pill ("Today"/"Optional
  today") + plain dose label. Removed the redundant "Now due:"/"Upcoming:" prefixes.
- Tests: suite now **140 passing, 5 files**.

### Other backlog

### Possible future
- **Age Option 3** — range + forecast across an age band (deferred; large, low payoff here).
- **Service worker / offline** (PWA manifest exists; SW not implemented).
- **Pending: branch protection / first deploy** — repo deploys via Actions on push to
  `main`; nothing committed from this session yet.

---

## Recurring maintenance
- Meningococcal ACIP guidance is relatively stable, but re-verify pentavalent (Penbraya
  2023 / Penmenvy 2025) and the MenB 2-dose 0/6 interval against current CDC notes if a
  year+ has passed. Sources are at the top of `recommend.js` and in `refs.js`.

---

## Session: 2026-06-05 — Meningococcal job-aid cross-check (shipped)

Cross-checked against the clinician "Meningococcal Vaccine Job Aid" (.docx) alongside vaxapp. Tests
**154 → 175**. See CLAUDE.md "Changes shipped (2026-06-05)" for detail.

Items landed here: D2 (extend `menacwyRoutine` 17–21y no-≥16y-dose → catch-up Dose 1 of 1, college note;
≥22y still not-indicated), D5 (7–23mo HR Dose 2 8wk→12wk + ≥12mo floor; fixed the 4wk continuing-series
note/code mismatch), D6 (3-dose shortcut for 2–6m starters with D2 ≥7m), D7 (Menveo 2-vial vs 1-vial in
`brands.js` + age-banded `menacwyBrands`). D1/D3/D9 were already correct here; D4/D8 ignored.

New test file: `src/logic/__tests__/regression-d2-d5-d6-d7.test.js`.

---

## Session: 2026-06-05 (session 2) — Dateless min-age + result-card colors (shipped)

Tests **175 → 186**. See CLAUDE.md "Changes shipped (2026-06-05, session 2)" for detail.

- **Dateless min-age fix** (`src/logic/validate.js`) — a dose with no date is now flagged
  `invalid` when the patient's CURRENT age (an upper bound on age-at-administration) is below
  the recorded KNOWN brand's `minAgeM`. Fixes the reported bug: a 2-year-old recorded with
  Penbraya was previously "cannot verify" and counted; now it's invalid and dropped. Unknown
  brand is not flagged for MenACWY (ACIP: any brand acceptable when history unknown); MenB
  unknown brand still flags <10y (vaccine-category floor). Mirrors vaxapp's existing
  `min_age_impossible` behavior. New test: `regression-dateless-minage.test.js` (11).
- **Result-card color grouping** (`Results.jsx`, `App.css`) — pentavalent card now amber/gold;
  the two separate MenACWY+MenB cards wrapped in a blue `.separate-vaccines-group` so the
  "either combo OR two separate" grouping is visually unambiguous. "Due" state border changed
  from teal to green — red is reserved for errors only. New `:root` tokens `--gmd`/`--bmd`
  plus the `--penta*` set.

---

## Session: 2026-06-07 — editable Results history + auto-add fix

Branch: `main`. Shipped. Tests: **186 passing, 8 files**.

- **StepHistory auto-add bug fixed** (same class of bug found in PneumoVax): clicking
  "Yes, record doses" no longer pre-populates a blank unknown-brand dose row that the
  engine would count. The list now starts empty with an explicit "+ Add dose" button.
- **Results: "Recorded doses ▾" panel** added — inline editing of MenACWY/MenB doses
  (date/brand/remove + Add) without restarting the wizard. One panel open at a time
  (age and doses panels are mutually exclusive).
- **Results: "← Edit history" back button** added — returns to step 3 (MenB history).
- **CSS** — advisory banner + history-edit panel styles added to `App.css`.

Files changed: `src/App.css`, `src/App.jsx`, `src/components/Results.jsx`,
`src/components/StepHistory.jsx`, plus `CLAUDE.md` / `HANDOFF.md`.

---

## Session: 2026-06-13 — code-review findings (C1/H1/M1–M5) + P3 cleanup

Branch: shipped via PR. Tests: **186 → 221 passing (10 files)**.

Implemented `REVIEW_FINDINGS.md` (PR #1). See CLAUDE.md "Changes shipped (2026-06-13)" for the full per-finding detail. Summary:

- **C1 (critical)** — MenB high-risk D3 now gates on ≥6mo-from-D1 AND ≥4mo-from-D2 (engine matched to validator).
- **H1** — infant high-risk MenACWY series gets a completion guard + booster transition.
- **M1 / M2** — MenACWY 21y and MenB 23y boundaries extended to the 22nd / 24th birthday (`M.y22`, `M.y24`).
- **M3** — MenB family lock anchors on the first known-brand dose.
- **M4** — validator reads `menacwyRiskClass()` from data, not a hardcoded list.
- **M5** — `dateUtils.js` arithmetic moved to UTC (mirror-synced with PneumoVax).
- **P3** — ageGroup 10yo "Child" fix + contiguous age chips; MenB-below-16 wording; pentavalent MMWR comment URLs reconciled (volume re-verify deferred — memory `deferred-mmwr-volume-check`); unused `immMenACWY`/`immMenB` removed.

New tests: `regression-c1-h1-m1-m2-m3-m4-m5.test.js` (28), `format-ageGroup.test.js` (7).

> Cross-app note: this review also drove the parallel meningococcal fixes in vaxapp/PediVax (vaxapp PR #49). vaxapp holds the MeningoVax↔vaxapp agreement fixtures (`cross-app-meningococcal-agreement.test.js`).
