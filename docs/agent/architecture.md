# MeningoVax — Architecture Reference

## What It Is

Standalone client-side React SPA giving ACIP/CDC-cited clinical decision support for **meningococcal** vaccination only — MenACWY + MenB (and pentavalent MenABCWY) across infants to adults. No backend, no auth, no DB. Sibling of PneumoVax; the codebase is independent.

## Tech Stack

- **React 18** with hooks (no class components)
- **Vite 5** — `npm run dev` (port 5173, jumps to 5174/5175/5181 if occupied), `npm run build` → `dist/`
- **Vitest** + @testing-library/react — `npm test` (single `vitest run`)
- `vite.config.js` sets `base: '/MeningoVax/'` (GitHub Pages, case-sensitive). All public asset paths MUST use `import.meta.env.BASE_URL`.
- Deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.

## File Structure

```
src/
  App.jsx                5-step wizard shell + shared state (useState).
                         Steps: Age → Risks → MenACWY → MenB → Results.
  main.jsx               React entry.
  App.css                All styles + CSS custom properties (:root tokens).
  components/
    Stepper.jsx          Top progress indicator.
    StepAge.jsx          Age entry: group chips + precise (years/months) + DOB.
                         Chips PREFILL the editable years/months fields.
    StepRisks.jsx        Risk-factor checklist (reads RISK_FACTORS).
    StepHistory.jsx      Per-vaccine dose history entry (date + brand, both optional).
                         Used twice: MenACWY step and MenB step. Shows MenB family lock.
    Results.jsx          Recommendation output. Calls recommend(); renders RecCards,
                         pentavalent card, dual-due banner. Inline "Adjust age" + 
                         "Recorded doses ▾" editors.
    RecCard.jsx          Single recommendation card (status shading, series progress,
                         brand options; source buttons inside "Why this", Q10).
    Disclaimer.jsx       Clinical disclaimer footer; risk-history half behind
                         "About risk history" (Q10).
  logic/
    recommend.js         THE engine. recommend(input) → { menacwy[], menb[], pentavalent, meta }.
                         recommend() = foldResult(recommendBeforeFold(input)).
    noteFold.js          Q10 (owner, 2026-11-19): which card-note sentences stay in view
                         (STAY_IN_VIEW); the rest move behind "Why this". Moves only.
    validate.js          analyzeHistory(vaccine, doses, ageMonths, riskIds, today)
                         → { perDose, effective, sortedDoses, decidedBy }. The walk only.
    doseRules.js         DOSE_RULES: every rule that can judge a recorded dose, one row
                         each (schedule, measured from, enforcement, grace, authority,
                         chip label). judgeDose() walks it once per dose.
    dateUtils.js         todayISO, addDays, daysBetween, intervalElapsed, DAYS helpers.
    format.js            fmtAgeMonths, fmtDate, ageGroup, dobToAgeMonths, stripAntigen.
    __tests__/           Engine + validate unit tests.
  data/
    brands.js            MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS, menbFamily(),
                         menbBrandsInFamily(). Menveo split: 2-vial (≥2m) and 1-vial (≥10y).
    riskFactors.js       RISK_FACTORS catalog + menacwyRiskClass/hasMenbRisk/shouldDeferMenB.
    refs.js              REFS citation map + resolveRefs().
    rulebook.js          Writes the rulebook's rule table (meningococcal-rules-summary.md §5) from DOSE_RULES + CITATIONS; `npm run rulebook`. Not imported by the app.
  components/__tests__/App.test.jsx   Wizard render/flow tests.
```

## Recommendation Engine (`recommend.js`)

`recommend({ ageMonths, riskIds, menacwyDoses, menbDoses, today })` is a **pure function**. Returns:
- `menacwy` — array (usually length 1) of MenACWY recs
- `menb` — array of MenB recs
- `pentavalent` — `{ eligible, note, brands, citations }` — only `eligible: true` when both MenACWY AND MenB are due today AND age ≥10y
- `meta` — `{ ageMonths, today, riskIds }`

Each rec (from `rec()`): `{ vaccine, status, doseLabel, doseNum, dueToday, earliestNextDate, minIntervalDays, brands, family, note, citations }`.

**The fold (Q10, owner 2026-11-19, as PneumoVax §WORD-1).** `recommend()` is
`foldResult(recommendBeforeFold(input))`, the last step. `noteFold.js` keeps in a card's
`note.lead` only the sentences on `STAY_IN_VIEW` (the Trumenba/Bexsero switch, the minimum
beside a routine date, "once 8 weeks have passed", "Not before … which did not count") and
moves the rest to the front of `note.detail`, with their `[c]` entries in `noteCites`. A card
shut by default (neutral status, no booster date) and the pentavalent note are not folded.
The engine's own look-ahead (`cardsOnTheDay`) calls `recommendBeforeFold`; so does a test that
pins how a sentence is WRITTEN. Guard: `regression-2026-11-19-q10-result-page-fold.test.jsx`
(the fold only moves sentences, over every saved patient).

**Status values:** `due | catchup | risk-based | shared-decision | complete | not-indicated | deferred`

### Design Rule: Brand Validity Computed in Engine
Brand eligibility and the MenB antigen-family lock are computed in `recommend.js`; downstream UI consumes the pre-filtered brand strings. Do NOT re-derive brand eligibility in components.

### Brand Strings Carry an Antigen Suffix — Strip at Display
Engine brand strings are `'Menveo (MenACWY)'`, `'Bexsero (MenB)'`, `'Penmenvy (MenABCWY)'`. Tests assert these exact strings — **do not remove the suffix in the engine.** Strip for display via `stripAntigen()` in `format.js` in `RecCard.jsx` and `Results.jsx` only.

## Dose Validation (`validate.js`)

`analyzeHistory(vaccine, doses, ageMonths, riskIds, today)` is the single source of truth. One chronological "last-kept" walk returns:
- `perDose` — parallel to input; each `{ status:'valid'|'invalid'|'unknown', effectiveDoseNum, reasons[], whys?[], detail? }` for display. `reasons` are the line beside the dose (the label's reason, and what to do); `whys` (background) and `detail` (age, interval or dates) sit behind the dose's own "Why this" fold-out (`DoseWhy` in `RecCard.jsx`; owner G1-b, STOP G1, 2026-11-18, as PneumoVax). A `whys` entry carries no `[c]`: a source number stays on the line, on the sentence it supports. A "Not counted — repeat" line ends with `DO_NOT_RESTART` (`doseRules.js`, "Do not restart the series."), which `validate.js` adds and `recommend.js` `datedRepeatLines` finds by that one copy: its "when" goes just before it, or "Repeated on <date>. See that dose." replaces it (owner G1-a, 2026-11-18).
- `effective` — the KEPT dose list fed into `recommend()`. Invalid doses are dropped BEFORE the engine counts.
- `decidedBy` — parallel to `perDose`: the `DOSE_RULES` row id that decided each dose (null = no row spoke; it counts).

**The rules themselves are rows of `DOSE_RULES` in `doseRules.js`** (port Phase 2.1, 2026-11-15). Each row states its schedule, what it is measured from, its enforcement (`floor`, `set-aside`, `counts-with-note`, `counts`, `needs-input`, `record-problem`, `extra`, `none`), whether the 4-day grace applies, who the code says it comes from, and the chip it leads to. Beside that, `sourcesSay` (Phase 2.2) gives what the sources say, as a verdict (`stated`, `schedule-only`, `differs`, `owner-decided`, `no-source`, `record-keeping`), the quoted sentences (keys into `refs.js`, each read live) and one plain-English line. It is never shown on screen; its `differs`/`schedule-only`/`no-source` rows are the STOP C question list. Rows are walked in order and the first that returns a verdict decides; order is part of the rule. The table is the authority for what the app does today — where the summary below and a row disagree, the row is right (two bullets below were already out of date when the table was built: the infant series gap is 8 weeks, not 4, and the first high-risk booster keys off the age at the LAST primary dose, which is Dose 2 only in a 2-dose series).

**Counting policy:**
- Invalid → dropped, does NOT count.
- No date → NOT counted (STOP C C1, 2026-11-15): a record problem (`recordProblem: 'undated'`), shown, never a timing anchor.
- Each dose validated against the last KEPT valid dose (not the literal previous one).
- **Dateless dose with known brand, current age < brandMin** → INVALID (a past dose can't have been given later than today — current age is an upper bound).
- **Unknown brand MenB, current age < 10y** → INVALID (≥10y is a vaccine-category floor, not a brand penalty).

**Rules enforced (from `brands.js`, never hardcoded):**
- Min age per brand including pentavalents.
- MenACWY: high-risk primary D2 ≥8wk (≥4wk infant); baseline ≥4wk between any two MenACWY doses.
- MenACWY high-risk boosters: cadence keyed off age at Dose 2 (<7y → first booster 3y; else 5y; ALL subsequent boosters 5y). `recommend.js` booster timing mirrors this — keep in sync.
- MenB: ≥10y; high-risk D2 ≥4wk, D3 ≥6mo from D1 AND ≥4mo from D2; first booster ≥1y after series then ≥2y; family mismatch → invalid.

## MenB Antigen-Family Lock (CRITICAL)

MenB products are NOT interchangeable across families:
- **MenB-4C**: Bexsero, Penmenvy (GSK)
- **MenB-FHbp**: Trumenba, Penbraya (Pfizer)

Family established by MenB Dose 1's brand (`menbFamily()` in `brands.js`, keyed by `startsWith`). Once locked, D2/D3 options stay in that family. `recommend.js` anchors on the first KNOWN-brand dose (`doses.find(d => d.brand)?.brand`) — not raw `doses[0]?.brand` — to handle unknown D1.

## Pentavalent Rule

Penbraya/Penmenvy surface ONLY through the dedicated pentavalent card, never in the standalone MenB brand list. Eligible only when both MenACWY and MenB are due the same visit and age ≥10y.

## Age Input Model

No range/forecast — the engine computes one snapshot at `ageMonths`. Age-group chips PREFILL the editable years/months fields (`selectChip` sets mode `'precise'`). Do NOT revert to a hidden midpoint default.

## Menveo Formulation Split

`brands.js` has two Menveo entries:
- **Menveo 2-vial** — `minAgeM: 2` (months; used for infants/children)
- **Menveo 1-vial** — `minAgeM: 120` (10y; adolescents/adults)

`menacwyBrands(am)` returns `MENACWY_INFANT` (<24m), `MENACWY_CHILD` (24–119m), or `MENACWY_STD` (≥120m).

## Risk Factors

- `menacwyClass`: `primary2` (2-dose primary + boosters) > `single+boost` > `single`.
- `menbClass`: `'highrisk'` = 3-dose primary + boosters.
- **`complement`** covers both persistent complement deficiency AND complement-inhibitor therapy (eculizumab/ravulizumab) — identical schedule class. Do not re-split.
- **`asplenia`** sublabel includes sickle cell disease.
- **`college_dorm`** is `single` class. The ≥16y-dose-satisfies rule applies ONLY to college_dorm. Military/ACWY-outbreak (`single`) treat any documented dose as satisfying. Do not conflate.

## Deployment

1. Match `base: '/<repo-name>/'` in `vite.config.js` to the repo name.
2. Push to `main`.
3. Repo → Settings → Pages → Source → GitHub Actions.
