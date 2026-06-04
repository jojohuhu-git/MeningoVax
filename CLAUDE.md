# MeningoVax — Claude Code Guidance

## What it is
MeningoVax is a standalone, client-side React SPA giving ACIP/CDC-cited clinical
decision support for **meningococcal** vaccination only — MenACWY + MenB (and the
pentavalent MenABCWY) — across infants to adults. No backend, no auth, no DB.
Everything runs in the browser. It is the meningococcal-only sibling of the larger
`vaxapp` (PediVax) project; the recommendation-engine design rules are ported from
there but the codebase is independent.

## Tech stack
- **React 18** with hooks (no class components)
- **Vite 5** — `npm run dev` (port 5173, jumps to 5174/5175/5181 if occupied), `npm run build` → `dist/`
- **Vitest** + @testing-library/react — `npm test` (single `vitest run`), `npm run test:watch`
- `vite.config.js` sets `base: '/MeningoVax/'` (GitHub Pages, case-sensitive). All
  public asset paths MUST use `import.meta.env.BASE_URL` (see `App.jsx` logo).
- Deploys to GitHub Pages via `.github/workflows/deploy.yml` on push to `main`.
  Live: https://jojohuhu-git.github.io/MeningoVax/

## Setup
```bash
npm install
npm run dev        # dev server
npm test           # vitest run (currently 140 tests, 5 files)
npm run build      # production build to dist/
```

Dev-server launch config lives at `.claude/launch.json` (name: "MeningoVax dev server").

## File structure
```
src/
  App.jsx                5-step wizard shell + shared state (useState). Steps:
                         Age → Risks → MenACWY → MenB → Results.
  main.jsx               React entry.
  App.css                All styles + CSS custom properties (:root tokens).
  components/
    Stepper.jsx          Top progress indicator.
    StepAge.jsx          Age entry: group chips + precise (years/months) + DOB.
                         Chips PREFILL the editable years/months fields (see below).
    StepRisks.jsx        Risk-factor checklist (reads RISK_FACTORS).
    StepHistory.jsx      Per-vaccine dose history entry (date + brand, both optional).
                         Used twice: MenACWY step and MenB step. Shows MenB family lock.
    Results.jsx          Recommendation output. Calls recommend(); renders RecCards,
                         pentavalent card, dual-due banner. Has inline "Adjust age" editor.
    RecCard.jsx          Single recommendation card (status shading, series progress,
                         brand options, citations).
    Disclaimer.jsx       Clinical disclaimer footer.
  logic/
    recommend.js         THE engine. recommend(input) → { menacwy[], menb[], pentavalent, meta }.
    dateUtils.js         todayISO, addDays, daysBetween, intervalElapsed, DAYS helpers.
    format.js            Display helpers: fmtAgeMonths, fmtDate, ageGroup, dobToAgeMonths,
                         stripAntigen (brand-label display).
    __tests__/recommend.test.js   Engine unit tests.
  data/
    brands.js            MENACWY_BRANDS, MENB_BRANDS, PENTAVALENT_BRANDS, menbFamily(),
                         menbBrandsInFamily(). MenB antigen-family map (4C vs FHbp).
    riskFactors.js       RISK_FACTORS catalog + menacwyRiskClass/hasMenbRisk/shouldDeferMenB.
    refs.js              REFS citation map + resolveRefs().
  components/__tests__/App.test.jsx   Wizard render/flow tests.
```

## The recommendation engine (`recommend.js`)

`recommend({ ageMonths, riskIds, menacwyDoses, menbDoses, today })` is a **pure
function**. It returns:
- `menacwy` — array (usually length 1) of MenACWY recs
- `menb` — array of MenB recs
- `pentavalent` — `{ eligible, note, brands, citations }` — only `eligible: true`
  when a MenACWY dose AND a MenB dose are BOTH due today AND age ≥10y
- `meta` — `{ ageMonths, today, riskIds }`

Each rec object (built by `rec()`): `{ vaccine, status, doseLabel, doseNum, dueToday,
earliestNextDate, minIntervalDays, brands, family, note, citations }`.

**Status values:** `due | catchup | risk-based | shared-decision | complete |
not-indicated | deferred`.

### Design rule (ported from vaxapp): brand validity computed in the engine
Brand eligibility and the MenB antigen-family lock are computed in `recommend.js`;
downstream UI consumes the pre-filtered brand strings. Do NOT re-derive brand
eligibility in components.

### Brand strings carry an antigen suffix; strip at DISPLAY
Engine brand strings are `'Menveo (MenACWY)'`, `'Bexsero (MenB)'`, `'Penmenvy
(MenABCWY)'`. Tests assert these exact strings, so **do not remove the suffix in the
engine.** The rec-card section header already names the antigen, so the suffix is
stripped for display via `stripAntigen()` (`format.js`) in `RecCard.jsx` and the
pentavalent block in `Results.jsx`. `stripAntigen` only removes the exact antigen
tags — other parentheticals (e.g. "Menactra (MenACWY) — discontinued") keep their
non-antigen text.

### MenB antigen-family lock (interchangeability) — CRITICAL
MenB products are NOT interchangeable across families:
- **MenB-4C**: Bexsero, Penmenvy (GSK)
- **MenB-FHbp**: Trumenba, Penbraya (Pfizer)
Family is established by MenB dose 1's brand (`menbFamily()` in `brands.js`, keyed by
`startsWith(brandKey)`). Once locked, dose 2/3 options stay in that family. The two
pentavalents inherit their MenB family (Penmenvy=4C, Penbraya=FHbp).

### Pentavalent rule
Penbraya/Penmenvy surface ONLY through the dedicated pentavalent card, never in the
standalone MenB brand list. Eligible only when both MenACWY and MenB are due the same
visit and age ≥10y.

## Vaccine guidance priority
**Always use ACIP/CDC/AAP/immunize.org over FDA package inserts.** ACIP often permits
broader use than FDA labels (e.g. age windows, pentavalent upper age). Never revert to
FDA-labeled ages without explicit instruction. Sources are listed at the top of
`recommend.js` and in `refs.js`.

## Age input model (read before touching StepAge)
There is **no range/forecast** — the engine computes one snapshot at `ageMonths`.
The age-group chips are a convenience: clicking a chip **prefills the editable
years/months fields** (`selectChip` sets mode `'precise'` + populates years/months from
the chip's `defaultM`) so the chosen age is always visible and refinable. Earlier the
chip silently set a hidden midpoint (Adolescent → 14y) which confused users — do NOT
revert to a hidden default. `Results.jsx` also has an inline "Adjust age" editor that
recomputes recommendations live (it gets `onChange={update}` from `App.jsx`).

## History with no dates
Doses are `{ date, brand }`, both optional. Dose **counting** is by array length and
works without dates. Dates are only used for (a) interval timing (`dueToday` /
`earliestNextDate`) and (b) `ageAtDose` rules (e.g. "MenACWY dose at ≥16y completes the
college/adolescent schedule"). When a date is missing, `ageAtDose` returns null and
age-at-dose rules conservatively don't fire (so the engine recommends rather than
assuming coverage). The college-dorm branch explicitly explains this "cannot be
confirmed" case in its note.

## Dose validation & effective-dose counting (`validate.js`) — CRITICAL
`analyzeHistory(vaccine, doses, ageMonths, riskIds, today)` is the single source of
truth. ONE chronological "last-kept" walk (ported from vaxapp `validatedHistory`) returns:
- `perDose` — parallel to input; each `{ status:'valid'|'invalid'|'unknown',
  effectiveDoseNum, reasons[], detail?, doesNotCount? }` for display (`RecCard` chips).
- `effective` — the KEPT dose list that `recommend()` feeds into `menacwyRec`/`menbRec`.
  Invalid doses are dropped BEFORE the engine counts, so status/next-dose reflect reality.

**Counting policy (ACIP):**
- Invalid → dropped, does NOT count ("repeat this dose only, do not restart").
- Unknown (no date) → COUNTS, but is not a timing anchor for the next dose.
- MenB healthy early D2 (<6mo) → VALID (counts) + rescue note; engine emits the rescue dose.
- Each dose is validated against the last KEPT valid dose (not the literal previous one),
  so a dose following a dropped one is re-evaluated at its correct effective position
  (no false "interval too short" cascade).

**Rules enforced (all read min ages from `brands.js`, never a hardcoded map):**
- Min age by brand incl. pentavalents: Menveo ≥2mo, MenQuadfi ≥24mo, Menactra ≥9mo,
  all MenB/pentavalent ≥120mo (10y). Unknown brand → most permissive for that vaccine.
- MenACWY: high-risk primary D2 ≥8wk (≥4wk infant); **baseline ≥4wk between ANY two
  MenACWY doses** (catches duplicates for all risk classes).
- MenACWY high-risk **boosters** (eff. dose ≥3): too-soon → invalid. Cadence (3y vs 5y)
  is keyed off the **age at DOSE 2** (<7y → 3y else 5y). This SAME dose-2 basis is mirrored
  in `recommend.js`'s next-booster `boostDays` — keep the two in sync if you touch either.
- MenB: ≥10y; high-risk D2 ≥4wk, D3 ≥6mo-from-D1 & ≥4mo-from-D2; high-risk first booster
  ≥1y after series then ≥2y; **family mismatch (4C vs FHbp) → invalid**, anchored on the
  first kept KNOWN-brand dose (handles unknown D1). Late boosters are never flagged.

When changing any rule, update `validate-new-rules.test.js` / `analyzeHistory.test.js`,
and keep `recommend.js` consistent (esp. the dose-2 booster cadence).

## Card wording (RecCard) — avoid repetition
Status badge (category: Due/Catch-up/Risk-Based/Shared decision/…) + a single timing pill
("Today" / "Optional today" for shared-decision) + a plain dose label. Do NOT re-add
"Now due:"/"Upcoming:" prefixes — they duplicated the badge/pill. Future-due doses show
"Eligible {date}" instead of a pill.

## Risk factors (`riskFactors.js`)
- `menacwyClass`: `primary2` (2-dose primary + boosters) > `single+boost` > `single`.
  `menacwyRiskClass()` returns the highest-priority class among selected risks.
- `menbClass`: `'highrisk'` = 3-dose primary + boosters; undefined = no MenB indication.
- **`complement`** is a SINGLE merged item covering both persistent complement
  deficiency AND complement-inhibitor therapy (eculizumab/ravulizumab) — they share the
  identical schedule class (primary2 + highrisk MenB). Refs include
  `cdcComplementInhibitor`. Do not re-split without reason; tests use id `'complement'`.
- **asplenia** sublabel includes sickle cell disease (rendered as grey sublabel text).
- **college_dorm** is `single` class. The ≥16y-dose-satisfies rule applies ONLY to
  college_dorm (handled explicitly in the `single` branch of `menacwyRec`). Military /
  ACWY-outbreak (also `single`) treat any documented dose as satisfying the single-dose
  indication. Don't conflate these again.

## Testing
- `npm test` = `vitest run`. Logic tests in `src/logic/__tests__/recommend.test.js`;
  wizard render tests in `src/components/__tests__/App.test.jsx`.
- When changing the engine, add/adjust a test in `recommend.test.js`. When changing the
  merged complement id or risk wiring, update the risk-id strings in the tests.
- Current count: **140 tests, 5 files** (`recommend.test.js`, `App.test.jsx`,
  `validate.test.js`, `analyzeHistory.test.js`, `validate-new-rules.test.js`).

## Deployment / forking
1. Match `base: '/<repo-name>/'` in `vite.config.js` to the repo name.
2. Push to `main`.
3. Repo → Settings → Pages → Source → GitHub Actions.

## Changes shipped (2026-06-04, session 2) — cross-audit with vaxapp/PediVax

MeningoVax was used as the ACIP reference to audit the sibling vaxapp engine. Two items touched here:

1. **MenACWY high-risk booster cadence corrected** (`recommend.js` + `validate.js`, kept in sync).
   Previously a single interval (3y if age-at-dose-2 <7y, else 5y) was applied to EVERY booster — so a
   patient who completed primary <7y was boosted every 3y forever. Per immunize.org p2035 / ACIP 2020:
   the FIRST booster is 3y after primary (if completed <7y; otherwise 5y), and **all subsequent boosters
   are every 5 years**. Implemented via `isFirstBooster` (`given === 2` in recommend.js; `effectiveIdx
   === 2` in validate.js). Unknown dose-2 age → conservative 3y for the first booster only. MenB
   high-risk booster (1y then q2–3y) was already correct and left unchanged.

2. **Pentavalent MenB min-age regression guard added** (`__tests__/regression-pentavalent-menb-minage.test.js`).
   Confirms MeningoVax correctly flags the MenB component of Penbraya/Penmenvy given <10y on EVERY dose
   (it validates each dose against its brand's `minAgeM` from `ALL_BRANDS`). This is the bug that DID
   exist in vaxapp — MeningoVax was already correct; the test locks it in.

Test suite: 143 → **154 passing**.

## Not a substitute for clinical judgment
Decision support only. Verify against current ACIP/CDC guidance before administering.
