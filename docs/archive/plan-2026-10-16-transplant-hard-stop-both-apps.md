# PLAN — APPROVED, NOT YET IMPLEMENTED

**Status:** approved by the owner 2026-10-16. **No code has been written.** Both repos were
clean and untouched when this was filed (PneumoVax `main` at 836502a; MeningoVax `main` clean).
Work starts with PR 1 (MeningoVax). Supersedes nothing; see "Owner decisions" below for the
six decisions this records, and `~/.claude/skills/vaccine-parity/SKILL.md:31` +
`~/.claude/skills/design-review/SKILL.md:47` for the 2026-07 decision it reverses.

**Covers both repos.** MeningoVax's half is PR 1, PneumoVax's is PR 2. The companion copy, if
one was made, is `MeningoVax-main/docs/archive/` under the same filename.

---

# Plan — the transplant box becomes a hard stop, identically in both apps

## Context

Today, ticking the transplant box gives the clinician **more** advice, not less:

- **PneumoVax** (`hsct` box) shows an advisory banner carrying a full dose recipe ("4 doses of
  PCV20, beginning 3–6 months after HSCT…"), **and** the ordinary age/history schedule folded
  into a collapsed section below it.
- **MeningoVax** (`hct` box) shows an advisory banner with a MenACWY line and a MenB line,
  **and** the ordinary recommendation cards, fully expanded, above it.

Each app already has a second box — "CAR-T therapy, B-cell malignancy, or B-cell-depleting
therapy" — that does hard stop, and its message already names transplant recipients.

**Why change it.** The evidence is in the git history, not in anyone's opinion:

- MeningoVax's advisory was added once (`55167ff`) and then **corrected four times in about
  five weeks** — `ba255ef` (the rule was wrong), `a0106f4` (the interval was wrong and a
  booster sentence misworded), `03c8387` (wrong again: needs an additional risk factor, not an
  age band), `f32692e` (told a clinician to select a risk factor she had already selected).
  Every one shipped a wrong clinical statement to a clinician-facing screen.
- PneumoVax needed two repairs to one broken citation link (`3a59127`, `3145db2`) and then a
  whole-source replacement (`077f01d`, Fred Hutch → ASCO) that is **still only half-applied**:
  the code gives ASCO's 4-dose series while `CLAUDE.md`, `CLINICAL_SPEC.md` §F and the
  checkbox's own citation chip all still say Fred Hutch, 32 days later.
- It is the only feature in either app with its own dedicated handoff documents — four of them.

Those corrections were not documentation drift that a test could catch; the **clinical rule
itself** was wrong five times. Post-transplant vaccination is genuinely contested between
sources and it changes. The case for stopping is not that the advice is low value — it is that
it cannot be reliably kept true by one maintainer, and wrong advice on a clinical screen is
worse than no advice.

## Owner decisions (2026-10-16, settled — do not re-litigate)

1. **One box, not two.** The transplant row merges into the existing hard-stop row.
2. **The stop hides everything** — including a recommendation a *different* ticked risk factor
   would produce on its own. This deliberately retires the 2026-09-19 C2-6 fix.
3. **Recorded doses: hidden, with one short line saying so.** Typed doses stay in memory and
   are not cleared. The "age at each dose / gap between doses" summary is **out of scope**
   (see Not in scope).
4. **The written schedules are removed from the live documents and archived.**
5. **Shortened, clinical wording** (the former "Option C") replaces the current 550-character
   message, and the banner title stops describing the software.
6. **No pointer links.** The authorities are named in words. Only the existing
   `cdcAlteredImmunocompetence` chip is shown.

## The new copy — byte-identical in both apps

Banner title (replaces "Does not apply to this patient"):

```
Individualized revaccination schedule required
```

`EXCLUSION_MESSAGE` (replaces the current 550-character string; 318 characters):

```
Revaccination after hematopoietic cell transplant, CAR‑T therapy, or B‑cell–depleting therapy
follows a transplant‑ or therapy‑specific protocol, not age‑based scheduling, and some live
vaccines may be contraindicated. Follow your institutional protocol or current national
guidance (ASCO, NCCN, IDSA, CDC).
```

Recorded-doses line (new, italic, `.advisory-banner-flag`):

```
Recorded doses are kept but not evaluated here.
```

Three notes for whoever implements this:

- **Keep the non-breaking hyphens** (U+2011) in "CAR‑T", "B‑cell", "transplant‑ or
  therapy‑specific", matching the current string — they stop the words breaking mid-term on a
  phone, and the mirror test compares bytes.
- **The authorities stay as words, not links.** That is the whole point of decision 6: a
  sentence naming ASCO, NCCN, IDSA and CDC is still true in 2030; a URL to the 2024 ASCO
  guideline is not, and every `refs.js` entry is an annual re-read enforced by
  `citation-freshness.test.js`.
- **Show the recorded-doses line only when doses exist** (`pcvDoses`/`ppsv23Doses` props in
  PneumoVax, `menacwyDoses`/`menbDoses` in MeningoVax). One `&&` per app. Unconditional, it
  would tell every CAR-T patient about doses they were never asked for — these patients skip
  the history step entirely.

**This changes the screen for existing CAR-T / B-cell patients too**, not only the transplant
tick, because both share one stop screen. That is intended, and it needs saying in the PR so
it does not read as accidental scope creep.

## The merged checkbox — identical in both repos

```
id:       'hct_cart_bcell_exclude'     // MeningoVax's existing id; PneumoVax renames to match
label:    'Hematopoietic cell transplant (HCT/HSCT), CAR-T therapy, B-cell malignancy, or
           B-cell-depleting therapy'
sublabel: 'this tool does not apply — needs an individualized, specialist-guided schedule'
exclude:  true
group:    'IC'
refs:     ['cdcAlteredImmunocompetence']
```

Transplant is named **first** because it is the common tick. `exclude: true` is the single flag
driving both the engine stop and the red checkbox styling — so align `hasExclusion()` in
PneumoVax (`src/data/riskFactors.js:209`, currently tests `class === 'exclude'`) onto
MeningoVax's `r.exclude` test, leaving one flag with one meaning.

## Order of work: MeningoVax first, then PneumoVax

MeningoVax goes first so the cross-repo guard written on PneumoVax's side passes the day it is
written, instead of sitting red waiting for the sibling.

### PR 1 — MeningoVax

**Commit 1 (behaviour + copy).** Test-first: a failing test asserting
`recommend({riskIds:['hct_cart_bcell_exclude']})` returns `excluded: true` with empty
`menacwy`/`menb` for a patient who previously got cards.

- `src/data/riskFactors.js` — delete the `hct` row; relabel `hct_cart_bcell_exclude` as above;
  delete `hasHCT()`.
- `src/logic/recommend.js` — delete `hctAdvisory()` (~170 lines, lines 1705–1865) and the `hct`
  field from every return shape; delete the `if (hct) summaryLine = …` branch; replace
  `EXCLUSION_MESSAGE` with the new string.
- `src/components/Results.jsx` — delete the `hct` destructure, the `if (hct)` summary override,
  the `!hct` clause in the `pendingAnswers` guard, and the advisory banner block (lines
  ~350–360); change the banner title; add the conditional recorded-doses line.
- `src/data/refs.js` — delete `ascoAdultCancer2024`, `idsa2013MenacwyHct`,
  `kambojShah2019MenbHct` (now orphans; `citation-integrity.test.js:137` fails if left). Keep
  `cdcAlteredImmunocompetence` — both the checkbox and the stop cite it.
- `src/App.css` — remove `.advisory-banner-hct`.
- **Tests to rewrite:** `recommend.test.js` (20 mentions), `App.test.jsx` (2),
  `regression-newborn-menacwy-not-due-yet.test.js` (3), `sweep-dose-counter.test.js` (3),
  `sweep-two-run-relations.test.js` (5), `regression-c2-clinical-combos.test.js` (1),
  `regression-imp-p1-2-implausible-risk-age.test.js` (1) and its `-ui` twin,
  `regression-2026-09-19-no-vacuous-negative-assertions.test.js` (1).
- **Tests to delete, with the reason in the commit message:**
  `regression-c2-6-hct-other-risk-selected.test.js` (16 mentions) and
  `regression-c2-6-hct-other-risk-selected-ui.test.jsx` (8). They exist to prove a transplant
  patient's travel/outbreak recommendation stays visible; decision 2 reverses that. **Delete
  them outright — do not leave them `skip`ped** — and say in the commit message that the
  2026-09-19 C2-6 decision is superseded by the 2026-10-16 hard-stop decision.
- `src/test-grid.js` — `SWEEPABLE_RISK_FACTORS` and `ALL_RISK_IDS` derive from `RISK_FACTORS`,
  so removing the `hct` row shrinks both automatically: 13 single profiles → 12, 66 pairs → 55.
  Confirm `regression-2026-09-19-the-grid-covers-the-app.test.js` still passes.

**Commit 2 (archive).** `docs/agent/*` and `CLAUDE.md` mention HCT **nowhere** (verified), so
this is only the archive file:
`docs/archive/retired-2026-10-16-post-hct-meningococcal-advisory.md` — the deleted
`hctAdvisory()` header comment and all eight advisory lines, verbatim, with their
CDC/ASCO/IDSA/Kamboj-Shah citations, under a heading saying the app now stops instead and why.

### PR 2 — PneumoVax

**Commit 1 (the clinical move — one flag, measured on its own).** Make the `hsct` tick stop
*without* touching the id yet, so the corpus diff is exactly the patients whose answer changed.

- `src/data/riskFactors.js` — on the `hsct` row, `class: 'hsct'` → `exclude: true`; align
  `hasExclusion()` onto `r.exclude`; delete `hasHSCT()`.
- `src/logic/recommend.js` — delete `hsctAdvisory()` (lines 1071–1110) and the `hsct` field
  from every return shape; replace `EXCLUSION_MESSAGE` with the new string.
- `src/components/Results.jsx` — delete the `hsct` destructure, the summary override (line 96),
  the advisory banner (lines 331–352) and the `hsct ? <details> : <div>` fork at line 373
  (keep the plain `<div>` arm); change the banner title; add the conditional recorded-doses line.
- `src/components/StepRisks.jsx:37` — drop "and (for HSCT) the advisory series".
- `src/components/Disclaimer.jsx:12` — delete the two post-HSCT sentences.
- `src/data/refs.js` — delete `p3086Table5`, `fredHutchLTFU`, `ascoAdultCancer2024`
  (`citation-orphans.test.js:106` fails if left uncited). Delete the two `p3086Table5`
  assertions in `src/data/__tests__/refs.test.js`; keep the `p2016` one.
- `src/App.css` — remove `.advisory-banner-hsct`.
- `scripts/hsctCases.mjs` — delete. `scripts/__tests__/comparison-cases.test.js` asserts every
  case returns a **non-empty** `recs` array, which a stop cannot: drop the `HSCT_CASES` row
  (line 33) and its import (line 28).
- `scripts/proseDiff.mjs` + `scripts/__tests__/prose-diff-smoke.test.js` — the smoke test covers
  "HSCT (both age bands)" as two answer shapes; they collapse into the hard-stop shape, whose
  own wording also changes.
- **Tests to rewrite:** `recommend.test.js` (36 mentions),
  `regression-boundary-and-fixes.test.js` (15),
  `regression-n6-citations-follow-the-rulebook.test.js` (10),
  `regression-s6-5-interval-prose-one-home.test.js` (7), `App.test.jsx` (4),
  `regression-p6-5-one-history-walk.test.jsx`, `rule-docs-match-code.test.js` (2),
  `sweep-verdict-corpus.test.js` (2), `regression-p3-9b-adult-only-risk-not-peds.test.js` (1),
  `regression-p6-3b-note-cite-parity.test.js` (1).
- **Corpora:** run `npm run sweep:update` only after the above, and report both counts in the
  PR body per `CLAUDE.md`. Expected scale, measured from the committed files: **1,334 of
  17,342** real-patient rows and **1,471 of 19,123** record-problem rows carry `r:hsct` and
  should move from a verdict to a stop. A materially different count means something else
  moved — investigate before committing.
- Run `node scripts/proseDiff.mjs` before/after and quote the changed-line count. The corpora
  hold no prose (the S15 lesson: 843 cards read wrong with the whole suite green), and this
  commit changes the stop wording for the existing CAR-T rows as well.

**Commit 2 (merge the box — no patient's answer changes).**
- Delete the `hsct` row; rename `bcell_car_t_therapy` → `hct_cart_bcell_exclude`; apply the
  shared label and sublabel.
- `src/test-grid.js` — lines 105–106 collapse to one `['hct_cart_bcell_exclude']` profile; drop
  the `HSCT=` column from the row printer (line 304).
- Regenerate the corpora. This diff must be **only** disappearing/renamed row keys and the
  dropped column — **no row that still exists may change its verdict.** State that in the PR;
  if one does, stop and find out why.
- Keeping this separate from commit 1 is deliberate: it makes "1,334 real patients now get a
  stop" an attributable number instead of one lost among thousands of renamed keys.

**Commit 3 (docs, archive, and the guards).**
- `docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md` — §E and §F
  verbatim, the deleted `hsctAdvisory()` dose labels and notes, and the immunize.org Table 5 /
  Fred Hutch / ASCO citations, under a heading saying the app now stops and why. Record in it
  that the adult row had been ASCO since 2026-09-14 while three documents still said Fred
  Hutch — that is the point of the change.
- `CLINICAL_SPEC.md` — delete §E and §F; add one short section: the app stops for these
  patients, what the stop says, and the archive file's path.
- `CLAUDE.md` — replace the "HSCT Sources Are Fixed" non-negotiable with a "Transplant Is A
  Hard Stop" one. **Required, not optional:** `rule-docs-match-code.test.js:334` fails when any
  of its five scanned documents names an identifier `src/` no longer has, and
  `docs/agent/testing.md` names `hsctAdvisory` while `CLINICAL_SPEC.md` names `p3086Table5`
  and `fredHutchLTFU`.
- `docs/agent/clinical-rules.md`, `docs/agent/architecture.md`, `docs/agent/testing.md`,
  `MAP.md`, `README.md` — remove the HSCT advisory pathway; testing.md's `hsctCases.mjs` row
  goes with the file.
- **The cross-repo guard** (new,
  `src/logic/__tests__/regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js`),
  on the established one-sided pattern of
  `regression-s6-4-avg-days-per-month-one-home.test.js`: hardcode
  `/Users/joannehuang/Downloads/MeningoVax-main/...`, `skip` when absent, and assert the merged
  row's `id`, `label`, `sublabel` and `exclude`, the whole `EXCLUSION_MESSAGE`, the banner
  title and the recorded-doses line are byte-identical across the two repos. The stop message
  is byte-identical *today* (550 chars each, verified) only by luck; this freezes it.
- **An in-repo guard:** over `GRID_RISK_PROFILES`, assert that any profile containing the
  exclude id returns `excluded: true` with `recs: []`, at every age and with every history.
  This is the test that would have caught the two apps diverging in the first place.
- **Prove both guards by breaking the code and quote the counts** (per the repeat-escape rule):
  flip `exclude: true` off the transplant row and record how many tests and sweep rows fail;
  change one word of the shared label in PneumoVax only and confirm the mirror test catches it.
  Restore from a backup copy, never `git checkout`.

### Also update (owner-decision records outside both repos)

- `~/.claude/skills/vaccine-parity/SKILL.md:31` — "The standalone apps are advisory for HSCT
  pathways…" is the 2026-07 decision this supersedes.
- `~/.claude/skills/design-review/SKILL.md:47` — the same sentence, design-side.

One line each. Leaving them is how a future session re-adds the advisory.

## Verification

1. `npm test` in each repo — full suite, quote real pass/fail counts, never "should pass".
2. **Drive both apps live** (`preview_start`, `.claude/launch.json`); a green suite is not proof
   the screen is right. In each: tick the merged box → confirm the new title, the shortened
   message, the single CDC chip, and that **no** recommendation card, advisory banner or
   collapsed "standard schedule" section renders anywhere on the page.
3. In MeningoVax, tick the merged box **plus** "serogroup B outbreak" and confirm the stop still
   wins and the outbreak card is gone — that is decision 2, and the most likely later surprise.
4. Fill in a dose history, go back, tick the box: the recorded-doses line appears; go back again
   and the typed doses are still there. Then with no history typed, confirm the line is absent.
5. Screenshot both stop screens and read the two messages against each other.
6. Ship through the `ship` skill — separate branch and PR per repo, cross-referencing each
   other, with the corpus counts and the mutation-proof counts in PneumoVax's PR body.

## Not in scope

- **The prior-dose summary** (date, product, age at that dose, gap since the previous dose).
  It exists nowhere in either app today; `ageAtDoseFromDate()` in `src/logic/validate.js`
  computes age-at-dose internally but no screen shows it. Building it behind a stop screen would
  put a new display in the least-visited corner of two repos. Worth doing on the **normal**
  results screen, as its own item, in both apps.
- **Pointer links to ASCO / immunize.org.** Decision 6. The authorities are named in words.
