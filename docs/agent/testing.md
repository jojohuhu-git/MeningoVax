# MeningoVax — Testing Reference

## Framework

- **Vitest** — `npm test` = `vitest run`, `npm run test:watch` = `vitest`
- All tests run in the default `node` environment (no happy-dom needed — no UI rendering tests yet)
- Test files live in `src/logic/__tests__/` and `src/components/__tests__/`

## Test Files

| File | What it covers |
|---|---|
| `src/logic/__tests__/recommend.test.js` | Engine unit tests — all rec paths, risk classes, booster cadence |
| `src/logic/__tests__/validate.test.js` | Dose validation — min age, intervals, family mismatch, unknown dates |
| `src/logic/__tests__/analyzeHistory.test.js` | analyzeHistory integration (effective dose counting) |
| `src/logic/__tests__/validate-new-rules.test.js` | d1Cross, booster-cadence, dateless min-age rules |
| `src/logic/__tests__/regression-pentavalent-menb-minage.test.js` | Penbraya/Penmenvy min age on every dose |
| `src/logic/__tests__/regression-d2-d5-d6-d7.test.js` | Job-aid cross-check: 16–21y catch-up, infant HR intervals, 3-dose shortcut, Menveo split |
| `src/logic/__tests__/regression-dateless-minage.test.js` | Dateless dose min-age logic (current age as upper bound) |
| `src/logic/__tests__/regression-c1-h1-m1-m2-m3-m4-m5.test.js` | Code-review fixes: D3 timing, infant series completion, age boundaries, family lock, risk class, date utils |
| `src/logic/__tests__/format-ageGroup.test.js` | ageGroup() thresholds (10y = Child, 11y = Adolescent) |
| `src/components/__tests__/App.test.jsx` | Wizard render/flow tests |

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
