# MeningoVax — Architecture Reference

## What It Is

Standalone client-side React SPA giving ACIP/CDC-cited clinical decision support for **meningococcal** vaccination only — MenACWY + MenB (and pentavalent MenABCWY) across infants to adults. No backend, no auth, no DB. Sibling of PediVax (vaxapp) and PneumoVax; recommendation-engine design rules are ported from vaxapp but the codebase is independent.

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
                         brand options, citations).
    Disclaimer.jsx       Clinical disclaimer footer.
  logic/
    recommend.js         THE engine. recommend(input) → { menacwy[], menb[], pentavalent, meta }.
    validate.js          analyzeHistory(vaccine, doses, ageMonths, riskIds, today)
                         → { perDose, effective }.
    dateUtils.js         todayISO, addDays, daysBetween, intervalElapsed, DAYS helpers.
    format.js            fmtAgeMonths, fmtDate, ageGroup, dobToAgeMonths, stripAntigen.
    __tests__/           Engine + validate unit tests.
  data/
    brands.js            MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS, menbFamily(),
                         menbBrandsInFamily(). Menveo split: 2-vial (≥2m) and 1-vial (≥10y).
    riskFactors.js       RISK_FACTORS catalog + menacwyRiskClass/hasMenbRisk/shouldDeferMenB.
    refs.js              REFS citation map + resolveRefs().
  components/__tests__/App.test.jsx   Wizard render/flow tests.
```

## Recommendation Engine (`recommend.js`)

`recommend({ ageMonths, riskIds, menacwyDoses, menbDoses, today })` is a **pure function**. Returns:
- `menacwy` — array (usually length 1) of MenACWY recs
- `menb` — array of MenB recs
- `pentavalent` — `{ eligible, note, brands, citations }` — only `eligible: true` when both MenACWY AND MenB are due today AND age ≥10y
- `meta` — `{ ageMonths, today, riskIds }`

Each rec (from `rec()`): `{ vaccine, status, doseLabel, doseNum, dueToday, earliestNextDate, minIntervalDays, brands, family, note, citations }`.

**Status values:** `due | catchup | risk-based | shared-decision | complete | not-indicated | deferred`

### Design Rule: Brand Validity Computed in Engine
Brand eligibility and the MenB antigen-family lock are computed in `recommend.js`; downstream UI consumes the pre-filtered brand strings. Do NOT re-derive brand eligibility in components.

### Brand Strings Carry an Antigen Suffix — Strip at Display
Engine brand strings are `'Menveo (MenACWY)'`, `'Bexsero (MenB)'`, `'Penmenvy (MenABCWY)'`. Tests assert these exact strings — **do not remove the suffix in the engine.** Strip for display via `stripAntigen()` in `format.js` in `RecCard.jsx` and `Results.jsx` only.

## Dose Validation (`validate.js`)

`analyzeHistory(vaccine, doses, ageMonths, riskIds, today)` is the single source of truth. One chronological "last-kept" walk returns:
- `perDose` — parallel to input; each `{ status:'valid'|'invalid'|'unknown', effectiveDoseNum, reasons[], detail? }` for display.
- `effective` — the KEPT dose list fed into `recommend()`. Invalid doses are dropped BEFORE the engine counts.

**Counting policy:**
- Invalid → dropped, does NOT count.
- Unknown (no date) → COUNTS, not a timing anchor.
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
