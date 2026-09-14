# MeningoVax — Code Review Findings & Implementation Brief

**Generated:** 2026-06-11 · **For:** an implementing agent · **Scope:** this repo only.
**Status:** review/handoff document — no code has been changed.

## How to use this doc
Each finding has an ID, severity, exact `file:line`, evidence, clinical impact, a concrete fix,
and a test. Items marked **✓verified** were confirmed by hand against the source. **Read
`CLAUDE.md` first** — it documents the intended ACIP rules (the engine/validator must stay in
sync, esp. the MenB intervals and the dose-2-based booster cadence).

> **Context:** MeningoVax is well-cited and mostly correct; the product catalog (MenACWY,
> MenB 4C/FHbp, pentavalents), min-ages, and the family map are accurate. The defects cluster in
> (a) one **critical** MenB high-risk D3 timing bug, (b) a high infant-series-completion gap, and
> (c) age-boundary off-by-months in the engine/UI. **Sync note:** the meningococcal logic here is
> the reference for `vaxapp`; the *MeningoVax ↔ vaxapp* consistency pass did **not** complete in
> review (rate limit) — a dedicated pairwise comparison is an open item (see end).

---

## P0 — Critical

### C1 · MenB high-risk Dose 3 marked "due today" using only ≥6mo-from-D1, ignoring ≥4mo-from-D2 ✓verified
- **Where:** `src/logic/recommend.js:391–393`
- **What:** In the high-risk MenB branch, D3 computes `dueToday`/`earliestNextDate` solely from D1: `intervalElapsed(doses[0]?.date, DAYS.months(6), today)` and `addDays(doses[0].date, DAYS.months(6))`. The ACIP 0/1–2/6 high-risk schedule — and the rec's **own note** (`:395`) — require D3 ≥6mo after D1 **AND ≥4mo after D2**. `validate.js` (`validateOneMenB`) correctly enforces both, so the engine and validator disagree.
- **Repro:** D1=2026-01-01, D2=2026-06-20 (valid, ~5.6mo after D1), today=2026-07-05 → engine says "Dose 3 of 3," `dueToday=true`, `earliestNextDate=null`; the correct earliest D3 is ~2026-10-20 (4 months after D2).
- **Impact:** A high-risk patient (asplenia, complement deficiency/inhibitor, microbiologist, serogroup-B outbreak) whose D2 was given late is told the final MenB dose is "due today" up to ~3.5 months too early. An invalidly-early D3 won't count → patient under-protected while believed fully vaccinated.
- **Fix:** Gate D3 on **both** intervals, mirroring `validate.js`:
  ```js
  const fromD1 = intervalElapsed(doses[0]?.date, DAYS.months(6), today);
  const fromD2 = intervalElapsed(doses[1]?.date, DAYS.months(4), today);
  const elapsed = fromD1 && fromD2;
  // earliestNextDate = later of (addDays(D1, 6mo), addDays(D2, 4mo)) when not elapsed
  ```
- **Test:** the repro above → `dueToday=false`, `earliestNextDate ≈ 2026-10-20`; a case where both intervals are met → `dueToday=true`.

---

## P1 — High

### H1 · Infant high-risk MenACWY series never recognizes completion (recommends Dose 4/5) ✓verified
- **Where:** `src/logic/recommend.js:277–291` (generic continuation in `menacwyInfantHighRisk`)
- **What:** The function handles series **starts** (`given===0`) and the 3-dose shortcut only at `given===2`; the generic continuation (`:282`) unconditionally returns `Dose ${given + 1}` with `dueToday: elapsed && ageFloorMetActual` — **no completion guard**. For any high-risk infant still <24mo who finished their series, it keeps recommending the next dose. Repro: standard 4-dose path (2/4/6/12mo) complete, patient 13mo → "Dose 5 (infant high-risk series)," due today; 3-dose shortcut complete, patient 13mo → "Dose 4."
- **Impact:** A high-risk infant who completed the recommended MenACWY series is told an extra dose is due today → over-vaccination. The card should read complete and transition to the every-3–5-year booster cadence.
- **Fix:** Add completion logic: 3-dose shortcut & `given>=3` → complete; standard 4-dose path & `given>=4` → complete; 7–11mo/12–23mo 2-dose path with primary+booster done → complete. After completion, emit the booster (every 3–5y) keyed off the last dose, consistent with the ≥2y high-risk booster logic.
- **Test:** high-risk infant, 4 doses at 2/4/6/12mo, am=13mo → status complete (or a future booster), **not** "Dose 5 due today."

---

## P2 — Medium

### M4 · MenACWY high-risk class hardcoded in the validator (drift risk)
- **Where:** `src/logic/validate.js:223–225` (`riskIds.some(id => ['asplenia','complement','hiv'].includes(id))`)
- **What:** The strict 8-week-interval / booster-cadence gate uses a hardcoded literal instead of `menacwyRiskClass(riskIds) === 'primary2'` from `riskFactors.js` (the authoritative source). Today the list matches, but CLAUDE.md says rules must read class from data, never a hardcoded map. A future `primary2` risk would silently skip the validator's interval checks while the engine treats it as primary2.
- **Fix:** Replace the literal with `menacwyRiskClass(riskIds) === 'primary2'` imported from `riskFactors.js`.

### M5 · Date helpers off-by-one in positive-UTC-offset timezones
- **Where:** `src/logic/dateUtils.js:3–12` (`addDays`, `todayISO`)
- **What:** `addDays` parses `new Date(iso + 'T00:00:00')` (local midnight) then returns `toISOString().slice(0,10)` (UTC); east of UTC, local midnight is the previous UTC day → date rolls back. Repro (`TZ=Pacific/Auckland`): `addDays('2026-01-15', 0)` → `'2026-01-14'`. `todayISO()` likewise uses UTC. `daysBetween` is mostly immune (shift cancels), but `earliestNextDate` and the `today` used for `dueToday` can be off by a day.
- **Impact:** An "earliest next dose" date can be off by one day, and a "due today" boundary can flip a day early/late, for users east of UTC.
- **Fix:** Do arithmetic in UTC consistently (`'T00:00:00Z'` + `getUTCDate`/`setUTCDate`) or on Y-M-D integers; build `todayISO` from local `getFullYear/Month/Date`. *(`dateUtils.js` is byte-identical to PneumoVax — fix both / extract a shared util.)*

---

## P3 — Low / cleanup
- **agegroup-mislabels-10yo-adolescent** (`src/logic/format.js:62–68`) ✓verified: `if (am < 120) 'Child (2–10y)'; if (am < 228) 'Adolescent (11–18y)'` labels a 10-year-old (120–131mo) "Adolescent (11–18y)" — wrong, and it sits exactly on the MenB-licensure / routine-MenACWY decision boundary. The Child chip says "2–10y" (maxM 119) so the app calls 10-year-olds both Child (chip) and Adolescent (badge). Fix the label boundaries and align `StepAge.jsx` chip `maxM`. *(Same bug in PneumoVax.)*
- **age-chip-coverage-gaps** (`src/components/StepAge.jsx:4–9`): chips leave 120–131mo (10y) and 216–227mo (18y) uncovered, so no chip highlights for those ages and the "11–18y" label excludes most of age 18. Make chip ranges contiguous and consistent with `ageGroup()`.
- **menb-not-indicated-wording-below-16** (`recommend.js:364–365`): "licensed from age 10 … not routinely indicated below age 16" can read as "not licensed below 16." Tighten to clarify that a risk factor makes MenB indicated from age 10.
- **pentavalent-mmwr-url-drift-in-comments** (`validate.js:47–48`): header-comment MMWR URLs for Penmenvy/Penbraya contradict the live citation URLs in `refs.js`/README (vol 74/72 vs 75/73). Reconcile (or delete the duplicate comment) and verify the true citation.
- **unused-imm-refs** (`src/data/refs.js:66–75`): `immMenACWY`/`immMenB` are defined but never cited. Wire them into the shared-decision/family-lock notes or remove.

---

## Open item — cross-app consistency (did not complete in review)
The *MeningoVax ↔ vaxapp* meningococcal comparison was cut short by a rate limit. Known so far:
vaxapp's Optimal Schedule violates the MenB family lock (see vaxapp `REVIEW_FINDINGS.md` H4) and its
engine has a separate MenB high-risk revax bug; MeningoVax has C1/H1 above. **Recommended:** after the
fixes here, run a pairwise comparison of representative patients (high-risk MenB D3 timing; infant
high-risk completion; 16y/21y/23y boundaries; pentavalent family selection) and add cross-app
agreement fixtures so the hand-synced engines can't drift.

## Verification for this repo
- `npm install && npm test` (currently ~186 tests, 5 files). Add a regression test per fix; when changing an interval/cadence, **update both `recommend.js` and `validate.js`** (CLAUDE.md rule).
- Manual smoke (`npm run dev`): high-risk MenB with late D2 (C1), high-risk infant completed series (H1).
