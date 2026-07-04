# MeningoVax — Clinical Rules Reference

## Source Priority

**ACIP/CDC/AAP/immunize.org over FDA package inserts.** Sources are listed at the top of `recommend.js` and in `refs.js`. Never revert to FDA-labeled ages without explicit instruction.

## MenACWY Schedule

### Routine Adolescent
- 11–12y: D1
- 16y: booster (D2)
- 17–21y with no dose on/after 16th birthday: catch-up D1 of 1 (no booster; especially for first-year college residence-hall students)
- ≥22y healthy: not indicated

### High-Risk Primary (asplenia, SCD, complement, HIV, `primary2` class)
- Infant 2–6m: 4-dose primary (D1–D3 at 2/4/6m, D4 at 12m)
- Infant 7–11m: D1, then D2 ≥12 weeks after D1 AND at ≥12 months of age
- 12–23m: same 12-week AND ≥12mo-age dual gate for D2
  - "3-dose shortcut": if primary D1 at 2–6m AND D2 at ≥7m, series completes in 3 doses (D3 ≥12wk after D2 AND ≥12mo; no 4th dose needed)
- ≥2y: 2-dose primary (D2 ≥8 weeks after D1)

### High-Risk Booster Cadence
Keyed off the **age at Dose 2** (same basis used in both `recommend.js` and `validate.js` — keep in sync):
- D2 completed <7y (84m): **first booster 3y (1095d)**, then **every 5y (1826d)**
- D2 completed ≥7y: **first booster 5y**, then every 5y
- Unknown D2 age: conservative 3y for first booster only

### Single-Dose Indications (`single` class)
- `college_dorm`: D1 only; the ≥16y-dose-satisfies rule applies uniquely to this class
- `military`: D1 only; any documented dose satisfies
- `acwy_outbreak`: D1 only; any documented dose satisfies
- **Do not conflate these three.** The college_dorm ≥16y rule must not apply to military or outbreak.

### Microbiologist (`single+boost` class)
- D1 + booster every 5 years

## MenB Schedule

### Shared Decision (Healthy, 16–23y)
- 2-dose primary (Bexsero: 0+≥1m; Trumenba: 0+≥6m)
- Age gate: 192m–276m (16th birthday through 23y11m); not below 192m

### High-Risk (asplenia, SCD, complement, microbiologist, outbreak_b)
- Note: **HIV, immunocomp, and HSCT are NOT MenB high-risk indications**
- Both 4C (Bexsero/Penmenvy) and FHbp (Trumenba/Penbraya) families: 3-dose primary
- D2: ≥4 weeks after D1 (high-risk) vs ≥6 months (healthy)
- D3: ≥6 months from D1 AND ≥4 months from D2 (later of the two floors)
- First booster: ≥1 year after series
- Subsequent boosters: every 2 years

### Min Age ≥10y (120m)
Enforced on EVERY dose (D1 and D2/D3+), not just D1. Implemented in `validate.js` per-dose brand `minAgeM` check.

### MenB Antigen-Family Lock
Products within a family:
- **MenB-4C**: Bexsero, Penmenvy
- **MenB-FHbp**: Trumenba, Penbraya

Once D1 brand is known, subsequent doses must stay in the same family. Family anchor = first KNOWN-brand dose.

## Pentavalent (Penbraya/Penmenvy)

Eligible only when BOTH MenACWY and MenB are due the same visit AND age ≥10y. Never appear in the standalone MenB brand list.

## History Entry — Doses Without Dates

Dose counting works by array length without dates. Dates are only used for:
1. Interval timing (`dueToday` / `earliestNextDate`)
2. `ageAtDose` rules (e.g. "MenACWY dose at ≥16y completes the college/adolescent schedule")

When a date is missing, `ageAtDose` returns null and age-at-dose rules conservatively do not fire (engine recommends rather than assuming coverage). The college-dorm branch explicitly explains this in its note.

## Complement — Single Merged Risk Factor

`complement` covers both persistent complement deficiency AND complement-inhibitor therapy (eculizumab/ravulizumab) — they share the identical schedule class (`primary2` + high-risk MenB). Tests use id `'complement'`. Do not re-split without reason.
