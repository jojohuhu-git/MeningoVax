> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-07-23-menb-healthy-age-gate.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# Fix queue — MeningoVax MenB healthy-age gate + audit (2026-07-23)

**Status:** audit complete, nothing implemented. Read-only pass by Opus 4.8.
**Baseline:** branch `main` @ `10a1cbb`, **275 tests passing (18 files)**, working tree clean.
**Gating rules (from CLAUDE.md / global standards):**
- Clinical logic change → run `verify-clinical-source` first (already done for P0-1 below; the
  source finding is quoted). ACIP/CDC/AAP/immunize.org > FDA > CDSI.
- Both test layers for any visible change: logic (node) + UI (happy-dom).
- MeningoVax folder is **cloud-synced** — re-verify files persist after writes (reversion gotcha).
- Ship via the `ship` skill (MeningoVax rules: branch → PR → squash-merge; `main` protected).
- Parity: shared meningococcal rules also live in vaxapp + PneumoVax. Run `vaccine-parity`
  before shipping P0-1 — vaxapp very likely has the same MenB healthy-age question.

---

## P0-1 — Healthy MenB doses given before the 16-year window count toward the series → silent under-vaccination

**One-liner:** For a patient with **no current MenB risk factor**, the validator counts a MenB
dose given before the healthy shared-decision window (16y) as a valid "effective dose 1." When
that patient later reaches 16, the engine recommends only "Dose 2 of 2" instead of a fresh
2-dose series — a silent under-count.

**Reproduction (engine, verified 2026-07-23):**

| Input (healthy, no risk) | Recorded panel says | Recommendation says |
|---|---|---|
| Age 11y, one MenB dose at age 10 (Bexsero) | `valid`, **effective dose 1** | "Not routinely indicated" |
| **Age 16y, one MenB dose at age 10 (Bexsero)** | `valid`, **effective dose 1** | **"Dose 2 of 2"** ← under-vaccination |
| Age 16y, one MenB dose at age 15.5 | `valid`, effective dose 1 | "Dose 2 of 2" |
| Age 20y, one MenB dose at **16** (control) | `valid`, effective dose 1 | "Dose 2 of 2" ← correct |

Two harms from one root cause:
- **(a) Display contradiction** (the originally-reported bug): at age 11 the Recorded panel
  shows the age-10 dose as a valid, on-time "effective dose 1" while the recommendation card
  says MenB is "not routinely indicated" at this age. The two surfaces disagree.
- **(b) Under-vaccination** (worse): at age 16+, the age-10 dose is counted, so the healthy
  patient is told they need only one more dose. Clinically the age-10 dose has no protective
  value at 16 (see source) and they should start a fresh 2-dose series.

**Actual vs expected:**
- Actual: `validateOneMenB` (`src/logic/validate.js:369`) checks a MenB dose **only** against
  the product minimum age of 120 months (10y), which every product shares. A dose at ≥10 passes
  for everyone, regardless of current risk status. There is no healthy-recommendation-age gate.
- Expected: for a **currently-healthy** patient (`!hasMenbRisk(riskIds)`), a MenB dose given
  before the healthy series is recommended should be marked **valid but "does not count toward
  the healthy MenB series"** — exactly the pattern MenACWY already uses.

**The proven precedent (MenACWY does this correctly):** `validateOneMenACWY`
(`src/logic/validate.js:233-249`, rule "A3") returns `{ status: 'valid', notAdolescentCount:
true }` for a dose given before age 10 when the patient has no current high-risk indication —
valid age, but does not advance the adolescent series. Verified working: a healthy 12yo with a
MenACWY dose at age 9 is correctly told "Dose 1 (routine, 11–12y) [DUE]," not "booster." MenB
needs the analogous gate.

**Source of truth (verified live 2026-07-23, ACIP 2020 consolidated MMWR RR-9,
https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/):**
- MenB minimum age = 10 years (product licensure floor — applies to everyone).
- Healthy adolescents: 2-dose series at **16–23 years, preferred 16–18**, shared clinical
  decision-making.
- *"antibody titers wane substantially by 1 year postvaccination and then remain stable for up
  to 4 years"* — i.e. a dose at age 10 provides no meaningful protection at 16.

**⚠️ OWNER DECISION REQUIRED before coding (this determines the fix; do not guess):**
ACIP has no explicit rule for this off-guideline scenario (a healthy child dosed at 10), so the
exact threshold is a clinical call:
1. **Recommended — tie to the healthy window:** for a currently-healthy patient, MenB doses
   given **before age 16** do not count toward the healthy 2-dose series (mark `valid` +
   `notCountsHealthyMenB: true` or similar; recommendation restarts at 16 as Dose 1 of 2).
   Fixes both (a) and (b) cleanly.
2. Tie to a waning cutoff (e.g. dose >N years before 16) — messier, no clean ACIP number.
3. Leave counting as-is; only fix the display contradiction (does NOT fix under-vaccination).
- **Edge case to confirm with owner:** a patient who was high-risk at 10–15, completed a
  legitimate high-risk MenB series, and is **now healthy** 16–23. The validator keys off
  *current* risk only, so under option 1 those doses would stop counting and the app would
  recommend 2 more. Decide whether that is desired or needs a carve-out.

**Suspected fix site:** `src/logic/validate.js` `validateOneMenB` (~line 369), add a
healthy-age gate mirroring the A3 block at lines 233-249; ensure `analyzeHistory` drops the
dose from `effective` for healthy patients so `menbRec` restarts correctly.

**Suggested regression fixtures:**
- Healthy, age 16y (192mo), one dated MenB dose at age 10 → recommendation is "Dose 1 of 2",
  effective count 0.
- Healthy, age 11y, one MenB dose at age 10 → Recorded panel does NOT show "effective dose 1";
  recommendation "not routinely indicated" (surfaces agree).
- Control (must stay green): asplenia 16y, MenB dose at 10 → still counts, "Dose 2 of 3".
- Control: healthy 20y, MenB dose at **16** → still "Dose 2 of 2".

---

## Verified CLEAN (probed 2026-07-23, no defect found — recorded so the next audit doesn't re-derive)

- **MenACWY routine/catch-up:** dose at 11 → booster due at 16; dose at 16 → complete; dose at
  13 → booster due at 16; pre-age-10 dose correctly excluded (A3). All correct.
- **MenACWY high-risk / infant / college / boosters:** primary2 intervals, 3-vs-5-year first
  booster cadence, infant 3-dose shortcut, college ≥16y rule — all produced correct output.
- **MenB high-risk:** 3-dose series, early D2 (<4wk) correctly rejected, booster cadence, family
  lock (Bexsero→Trumenba mismatch correctly dropped) — all correct.
- **Pentavalent co-due gate:** offered only when both antigens due; SCDM MenB still eligible
  (owner decision 2026-07-23, intentional).
- **Pregnancy deferral:** `shouldDeferMenB` defers healthy MenB in pregnancy but a high-risk
  factor correctly overrides the deferral. Intentional, matches the note.

---

## P2-1 — Pentavalent offered when MenB is a booster + MenACWY is primary dose 1 (low priority)

**Observed:** asplenia 25yo with a completed MenB 3-dose series (MenB now = "Booster dose 4")
plus MenACWY primary dose 1 due → pentavalent (Penmenvy) offered. Clinically the combined shot
still delivers both needed antigens, so this is defensible, but confirm with owner whether the
pentavalent should be offered when the MenB component is a *booster* rather than a primary dose.
Not a wrong answer; flagged for a copy/appropriateness review only.

---

## Standard per-item workflow (fix-queue skill)

reproduce → failing test (both layers) → fix → `npm test` green (quote real count) →
live-verify in the running app (`preview_start` "MeningoVax dev server") → one commit per ID
(`P0-1: …`). Apply P0-1 parity to vaxapp + PneumoVax in the same pass (`vaccine-parity`).

**Recommended order:** get the owner decision on P0-1's threshold → implement P0-1 → parity
check across the three apps → then (optional) P2-1 copy review.

---

## UPDATE 2026-07-23 — MeningoVax P0-1 DONE; parity status

**MeningoVax:** FIXED. Owner chose **Option 1** (a MenB dose given before age 16 to a
currently-healthy patient does not count). Implemented in `src/logic/validate.js`
(`validateOneMenB`, both the dated and no-date branches, mirroring MenACWY's A3
`notAdolescentCount`). Tests: `regression-p0-1-menb-healthy-age16-gate.test.js` (engine,
5 cases) + `regression-p0-1-menb-healthy-ui.test.jsx` (RecCard renders "Valid (off-window)",
not "On time"). One pre-existing test updated (a healthy-16y interval case whose D1 landed at
15y9m — now uses 16y3m so D1 counts). **Full suite: 281 passing (20 files)**, up from 275.
Was-high-risk-now-healthy edge case: DEFERRED per owner (separate follow-up).

**PneumoVax:** N/A — pneumococcal-only app, no MenB logic. Proven (no `menb`/serogroup-B
matches in `src/`).

**vaxapp:** ⚠️ **SAME BUG CONFIRMED — five-surface parity fix still owed.** `dc(hist,"MenB")`
(`src/logic/stateHelpers.js:7`) counts every given MenB dose with no age filter; the MenB
block in `recommendations.js` (~line 752, `menb === 1 && am >= 192 → "Dose 2"`) has no pre-16
healthy gate. Probe (healthy am=192, one MenB dose given at age 10) →
`due | Dose 2 (same antigen family as dose 1)` — under-vaccination, identical to the
pre-fix MeningoVax behavior. Because vaxapp renders MenB across FIVE surfaces
(`genRecs`/recommendations.js, `regimens.js`+`comboAnalyzer.js`, `forecastLogic.js`, catch-up
branches, `buildOptimalSchedule.js`) plus `compliance.js`, the fix must reach all of them and
the `cross-app-meningococcal-agreement.test.js` must be extended. Recommend a dedicated
five-surface fix-queue session (`vaccine-parity` + five-surface-verification docs).
`recommendations.js` uses literal `\uXXXX` escapes — edit with Python, not the Edit tool.
