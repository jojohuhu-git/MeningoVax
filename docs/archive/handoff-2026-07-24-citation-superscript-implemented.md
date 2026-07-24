# MeningoVax — Handoff after citation-superscript implementation (2026-07-24)

> **SUPERSEDED (2026-07-24, later same day)** — the remaining-queue items
> below (MenB/infant quote coverage, pregnancy deferral) are now implemented.
> See `docs/archive/handoff-2026-07-24-citation-coverage-complete-recs-table-request.md`
> for what shipped and the owner's new request. Do not resume the "not done"
> queue from here.

Supersedes `docs/archive/handoff-2026-07-23-citation-superscript-audit-plan.md`
(that file's research/plan is now implemented — don't re-derive it, don't
re-run its queue).

Branch: `main`, pushed to `origin/main` at commit `a920525`
(`756dd3a..a920525`). Baseline was 327 passing tests; now **334 passing (all
green)**, working tree has only pre-existing unrelated doc diffs (see
`git status`) at this commit.

## What's done (implementation queue items 1-6 from the prior handoff)

1. **Redesigned `src/data/refs.js`**: merged `REFS` + `ACIP_ANCHORS` into one
   `CITATIONS` table (`url`/`quote`/`label`/`short`/`lastVerified` per entry).
   `cite(n, key)` now derives the `#:~:text=` deep-link and the hover tooltip
   directly from `quote` — editing one entry is the whole workflow. Fixed the
   dead `cdcRecommendations` link to its live replacement
   (`cdc.gov/meningococcal/hcp/vaccine-recommendations/index.html`). Fixed
   the pentavalent MMWR volume/year labels (Penmenvy → `MMWR 2026;75(1)`,
   Penbraya → `MMWR 2024;73(15)`).
2. **Deduped restated CDC-note citations** in `recommend.js` and
   `riskFactors.js`: dropped `cdcAdultMening`/`cdcChildMenACWY`/
   `cdcChildMenB` everywhere they were just restating the paired `acip2020`
   MMWR rule (asplenia, HIV, microbiologist, college-dorm, and the MenACWY/
   MenB high-risk and routine-schedule branches). Kept
   `cdcComplementInhibitor` (unique content) and `cdcRecommendations` (now
   fixed; also added it alongside the MMWR anchor on the two high-risk
   MenACWY booster-cadence notes it uniquely explains — the <7y/≥7y split).
3. **Extended `[N]` superscripts** to ~7 more routine-schedule notes that
   reference the already-verified 11-12y/16y-booster MMWR sentence
   (`acwyRoutine1112and16`). Did **not** add superscripts anywhere requiring
   a *new* unverified quote (several MenB high-risk dosing-interval notes
   still have no superscript) — see "not done" below.
4. **Hover-quote decision** (owner: "the quote can show when you hover over
   the reference for now") — satisfied for free by item 1: `cite()`'s
   `label` is now the exact quote, and `RecCard.jsx`'s existing
   `title={c.label}` on the `[N]` link already renders it as the native
   browser hover tooltip. No RecCard/Results.jsx code change was needed.
5. **Tests + live verification**: added `src/data/__tests__/refs.test.js`
   (resolveRefs never carries the `#:~:text=` fragment; `cite()` builds the
   fragment + quote-as-label correctly) and two RecCard tests (hover-title
   = exact quote; href carries the fragment). Live-drove the dev server at
   both a routine 11y3mo case and a high-risk asplenia-adult case — screenshot
   + `document.querySelectorAll` confirmed: dead link fixed, no duplicate
   CDC-note chips, correct MMWR volume labels, `[1]`/`[2]` links carry the
   right fragment and hover title.
6. **Shipped**: committed `a920525`, pushed directly to `main` (unprotected
   repo, per `ship` skill) with owner confirmation.

## What's NOT done — the remaining queue

- **`acwyBeforeAge10` quote is unused.** It's defined and verified in
  `refs.js`, but the "doses given before age 10 don't count" rule currently
  only appears as plain text in `validate.js`'s dose-validation `reasons`
  array (rendered by `DoseValidation` in `RecCard.jsx`, a different code
  path than `note`/`noteCites`). Wiring a superscript there would need
  `DoseValidation`'s reasons rendering extended to support `[N]` links — not
  done, scoped as a small follow-up if wanted.
- **~8 MenB/infant-series notes still have no `[N]` superscript** (high-risk
  MenB 0/1-2/6 dosing intervals, infant MenACWY intervals, MenB booster
  cadence, pregnancy deferral, etc.). These are real ACIP content but I have
  **no live-verified exact quote** for them this session — adding one
  without fetching+verifying live would violate the `verify-clinical-source`
  rule. Not started.
- **Out of scope, per the prior handoff** (still true): no port of any of
  this to vaxapp/PediVax or PneumoVax. The owner said she'll write those
  change requests herself.

## Why this is a good stopping point

Every owner decision from the prior handoff is closed out (overlap dedup,
coverage extension where verifiable, one-table editing model, hover-quote
fallback). The two "not done" items above are both new-scope additions
(a different UI code path; new unverified quotes) rather than unfinished
pieces of this queue — nothing here is half-built.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`.
2. Run `npx vitest run` — confirm **334 passing** before starting anything new.
3. If picking up the remaining superscript coverage: use the
   `verify-clinical-source` skill to live-fetch and quote each new MMWR
   sentence before adding it to `CITATIONS` — do not transcribe from memory
   or from this handoff.
4. If picking up the `acwyBeforeAge10` wiring: decide first whether it's
   worth extending `DoseValidation`'s reasons rendering to support `[N]`
   links, or simpler to just prose-cite it (ask the owner, don't default).
5. MeningoVax's `main` is unprotected — direct push is allowed per the `ship`
   skill, but confirm with the owner before pushing anything clinically
   significant, as was done this session.
