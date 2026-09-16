# Fix queue — Layer 2 drift tripwires (2026-09-16)

**Status: IN PROGRESS.** Owner asked for this while she reviews the 63-rule
foundation review (artifact `https://claude.ai/artifact/JkphAX5EUErNbdGt3smGh1`,
section 09 = the three-layer prevention plan this queue implements).

**Why this queue exists.** One clinical rule lives in up to six places: `recommend.js`,
`validate.js`, `seriesTotals.js`, the wording printed on the card, the two prose rule
documents, and vaxapp's copy. A revision touches one of them. Nothing notices when they
stop agreeing. Six such gaps are open right now, all from the 2026-09-15 fixes.

Layer 2 does not remove the duplication (that is Layer 1, owner reviewing first). It makes
any future disagreement **fail the test suite the same day**. Every item here is additive
— no item may change what the app recommends for any patient.

## Baseline (recorded 2026-09-16, before any change)

| | |
|---|---|
| Repo | `~/Downloads/MeningoVax-main` |
| Branch | `layer2-drift-tripwires` off `main` @ `6c4bfd0`, clean tree |
| Test suite | `npx vitest run` → **681 passed, 1 failed (682 total)** |
| The 1 failure | `Results.test.jsx` "P1-4 > it says how many answers are outstanding" — a fixture that aged out overnight, not a regression. Item L2-1 is its fix. |

## Ground rules

- Additive only: no change to `recommend.js` / `validate.js` / `seriesTotals.js` clinical logic.
- No new dependencies.
- Plain-English failure messages — the owner is a clinician, not an engineer. A tripwire
  that fails with a cryptic diff teaches nothing.
- Where a tripwire finds a real stale statement, fix the statement in the same item.
- `main` is unprotected but the owner prefers branch → PR → squash merge.

## Items

### L2-1 — Pin a fake "today" for the whole suite
Every test that builds a patient from real dates is currently graded against the real
clock, so fixtures silently rot. Today's failure: a dose dated 2018-11-15 for a patient
aged 96 months computed to age 2.0 months on 2026-09-15 (valid, 5 doses pending) and
1.97 months on 2026-09-16 (below Menveo's 2-month floor → invalid, 4 pending).
Fix in `src/test-setup.js` so it covers all 64 files at once, not per-file.
**Done when:** the suite gives the same result on any calendar day, and the P1-4 test passes
for the right reason.

### L2-2 — Citation freshness tripwire
`refs.js` records `lastVerified` per source. Nothing reads it. A source can silently go a
year stale (the Oct 2024 MenB interval change is exactly this failure).
**Done when:** a test fails when any citation passes 12 months unverified, naming the keys
and their dates in plain English.

### L2-3 — Citation integrity tripwire
Two failure modes seen in this repo: a `cite()` key that no longer exists in `refs.js`
(renders a blank superscript), and a `CITATIONS` entry left pointing at guidance the app no
longer implements (the July college 5-year expiry, removed by M17).
**Done when:** a test fails on a dangling key, and fails on an orphaned entry.

### L2-4 — Document-versus-code tripwire, and fix the six stale passages
`docs/agent/clinical-rules.md` and `docs/agent/meningococcal-rules-summary.md` carry an
honour-system "update this in the same PR" line. That is what failed six times in
September. Assert the load-bearing numbers against the code instead.
Known stale passages to fix as part of this item:
1. Booster clock keyed off "dose 2" → it is the last dose of the primary series (P1-1).
2. 3-dose infant shortcut "dose 1 at 2-6 months" → 3-6 months (P1-3).
3. "Military / outbreak: one documented dose satisfies" → outbreak top-up (M12) and the
   DoD-by-assignment wording (M18).
4. Infant series described as high-risk only → also travel and A/C/W/Y outbreak (M10).
5. `clinical-rules.md` healthy MenB "Bexsero 0+>=1m; Trumenba 0+>=6m" → 0/6 for both (mm7349a3).
6. Both files' "last verified" stamps predate every September change.
**Done when:** the tripwire fails against the stale text, the text is corrected, and it passes.

## Deferred out of this queue

- **Cross-repo agreement fixture** (the fourth Layer 2 item). Needs one decision from the
  owner first: vaxapp stops at 18 years, so shared cases above that age must be marked
  out-of-scope rather than counted as failures. Not started.
- **Porting the corrected rule text to vaxapp's copy** of the summary. Owner decides
  whether that rides with the two already-owed meningococcal parity ports.
