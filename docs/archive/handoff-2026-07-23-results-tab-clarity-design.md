# MeningoVax — Handoff: Results-tab clarity redesign, fully scoped, no code written (2026-07-23)

> **SUPERSEDED** by `handoff-2026-07-23-results-tab-clarity-shipped.md` — this design doc's
> queue (C1–C5 + small copy items) is now implemented, tested, and live-verified on branch
> `design/results-tab-clarity`. Only C5's subscript deep-link piece remains (still blocked
> on live MMWR verification, see the shipped handoff). Resume from the shipped handoff, not
> this one.

Branch: `main`, in sync with `origin/main` (nothing ahead). MeningoVax lives at
`~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`, folder is **cloud-synced** — commit
early, watch for silent reversion). Live site: https://jojohuhu-git.github.io/MeningoVax/
Baseline **303 passing tests (22 files), all green**, working tree clean of code changes
(only pre-existing doc diffs) at commit `9c758b8`.

Core promise of this app: **honesty** — a badge/label that implies something is done or safe
when it isn't is the worst kind of bug.

## What's done this session

**Nothing was coded.** This was a design conversation that converged on a coherent set of
Results-tab clarity changes, previewed with the owner via mockups and owner-approved. Every
wording/behavior below is settled; the next session implements, no further design needed.

**Scope: MeningoVax only.** Do NOT port any of this to PneumoVax or vaxapp yet — the owner
wants a batched cross-app review later, not a piecemeal port (standing decision from the
prior 2026-07-23 handoffs). Record copy-style parity items (esp. em-dash→hyphen) as a batched
follow-up; do not auto-port.

**Owner decision, explicit: do NOT copy vaxapp's reference architecture.** vaxapp has a richer
system (`src/data/refs.js` typed slots + `recommendations.js` `tf()` text-fragment helper +
immunize-default) — the owner reviewed it but chose NOT to port it now. Reuse only the *ideas*
below within MeningoVax's existing flat `refs.js`.

## What's NOT done — the scoped queue (build in this order; smallest first)

### C1 — Remove the legend entirely (option b, owner-chosen)
Delete the `Color key` button and the whole `What the labels mean` panel from
`src/components/Results.jsx` (the `showLegend` state ~L30, the button ~L182-189, and the
`legend-panel` JSX ~L253-271). Every pill and chip now carries its own words, so card-fill
and chip colors only *reinforce* — nothing needs a key to decode. Update/remove the legend
assertions in `Results.test.jsx` / `App.test.jsx` (the ones added by commit `472151b`).

### C2 — Recorded-dose chip: merge "Counts" + "Effective dose N" into one green chip
`src/components/RecCard.jsx` `DoseValidation()` (~L67-88): the valid case currently renders
TWO chips — green `Counts` and a separate `Effective dose N` (~L82-84). Owner dislikes the
word "Counts." Merge into a **single green chip reading `Dose N of M`** (reuses the existing
`dose-val-valid` green). "Off-window - repeat" / "Invalid" / "Unknown" / "Needs input" chips
unchanged. Also change em-dash → hyphen in `Off-window - repeat` (~L76, and the label at ~L37
comments) per the settled copy-style rule.
- **Wrinkle (two modules):** the chip number `effectiveDoseNum` comes from `validate.js`,
  which does NOT know the series total `M`. `M` lives in `recommend.js` `doseLabel`
  (e.g. "Dose 2 of 2"). So `M` must be passed from the rec into the recorded chip — new prop
  on `RecCard` (alongside `doseValidations`), threaded from `Results.jsx` call sites (~L306-329).
  `M` = the **primary-series** total only; boosters are NOT counted in `M`.

### C3 — Self-describing pills stating TIMING + what's needed (replaces STATUS_LABELS map)
`src/components/RecCard.jsx` `STATUS_LABELS` (~L7-15) is currently terse status words that
need a legend. Replace with a computed label that states *when* and *what* in plain English.
Owner-approved vocabulary (singular/plural driven by whether it's one booster or ongoing):

| Situation | Pill reads |
|---|---|
| Primary dose due today, boosters follow | `Dose due today, future boosters needed` |
| Dose due today, no boosters | `Dose due today` |
| Behind schedule | `Catch-up dose due today` |
| Series done, booster due today | `Booster due today` |
| Series done, one booster in future | `Future booster needed` |
| Optional (MenB 16–23y) | `Optional today — shared decision` |
| Nothing left | `Up to date` |
| Not indicated for this patient | `Not needed` |
| MenB in pregnancy | `Deferred in pregnancy` |

Derive from existing rec fields (`dueToday`, `status`, `boosterDueDate`, and whether the rec
is a primary dose vs booster). Note: the compound pill wraps to 2 lines on narrow phones —
owner accepted this; if the wrap is unacceptable, fallback is a short pill (`Dose due today`)
+ the "future boosters needed" clause living only in the C4 `Boosters:` line.

### C4 — New `Boosters:` body detail line + drop the rejected "+ boosters" header flag
Owner rejected a header "+ boosters" tag. Instead: a dedicated **`Boosters:` line in the card
body**, sitting with the other details (near the existing `booster-due-banner`). It carries
the count/cadence; the `booster-due-banner` still gives the next concrete date. Examples:
- finite: `Boosters: 1 more — at age 16 (~Aug 2028)`
- lifetime: `Boosters: every 5 years while at high risk (ongoing)`
- compound (infant high-risk): `Boosters: first in 3 years, then every 5 years while at risk`
- **Engine change:** the wording already exists buried in the freeform `note` string
  (`src/logic/recommend.js` ~L323, ~L347, etc.). Pull it into ONE short structured field
  (e.g. `boosterSummary`) on the rec so `RecCard` renders it as its own scannable line.

### C5 — References: order by pertinence per rec + subscript deep-links
Within MeningoVax's existing `src/data/refs.js` (do NOT restructure to vaxapp's schema):
- **Order citations most-pertinent-first per rec**, not CDC-first-by-default. When a specific
  MMWR table/sentence defines the rule, that MMWR leads; the immunize.org "Ask the Experts"
  entry leads only on messy practical recs (interrupted series, "does this old dose count").
  (Currently most recs do `refsFor(['cdcChildMenACWY', 'acip2020'])` — CDC first.)
- **Add an immunize.org "Ask the Experts: Meningococcal" entry** as a citation option (it was
  removed from `refs.js` for lack of a caller — see the comment at its bottom).
- **Subscript markers** (`[1]`,`[2]`) on specific rule sentences that deep-link to the exact
  paragraph via a URL text-fragment (`#:~:text=<phrase>`). **BLOCKED on `verify-clinical-source`:**
  the anchor phrases MUST be verified against the live ACIP 2020 MMWR
  (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7527029/) — do not guess phrases.
- No color-coding of references (owner decision).

### Confirmed smaller copy items (fold into the commits above)
- `Effective dose N` → `Dose N of the series` wording (subsumed by C2's merged chip).
- `Deferred` badge → `Deferred in pregnancy` (subsumed by C3; it only ever fires for MenB in
  pregnancy, `recommend.js:423`).
- De-duplicate the brand block copy in `RecCard.jsx` (~L162 title "Brand options: choose one"
  AND ~L169 helper "Select one brand for this dose." say the same thing — drop or repurpose one).
- Differentiate the two "Not yet due —" banners (`RecCard.jsx` ~L180 booster vs ~L186 next-date)
  so they don't read identically.

### Still-valid items carried over from the prior handoff (NOT superseded)
- **Item 2** (edit/undo for the "Needs input" risk-at-dose prompt) — still wanted, unchanged.
- **Item 3** (drop redundant raw-day precision in interval explanations via `fmtDays()`) — still
  wanted, unchanged. See `handoff-2026-07-23-legend-wording-undo-agedesc-ontrack-design.md`.
- **Items 1 and 4 of that handoff are SUPERSEDED by this file** (C1 absorbs the legend
  rewording; C3's `Future booster needed` absorbs the `On Track` badge).

## Why this is a good stopping point

The whole Results-tab clarity redesign is settled and owner-approved with exact wording and
file/line anchors — nothing here needs another design conversation, only implementation. The
items are largely independent (C1/C3/C4/C5 can ship in any order; C2 pairs with C4 since both
touch the primary-series total). The suite is green and nothing is mid-edit. C5's subscript
piece is the only one gated on an external step (live MMWR verification).

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm `main` clean/in-sync.
   `npx vitest run` — confirm **303 passing** before any new work.
2. Start the dev server (`preview_start` "MeningoVax dev server") before any work.
3. No open owner decisions — all wording is approved above. Build C1 → C2+C4 → C3 → C5.
4. Per-item workflow: failing test first (logic + UI layers per `docs/agent/testing.md` where
   visible) → implement → full suite green → live-verify in the running app → one commit per
   item ID (C1…C5).
5. C5 subscripts: run the `verify-clinical-source` skill against the live ACIP 2020 MMWR to
   confirm each anchor phrase before wiring `#:~:text=` fragments — never guess.
6. Ship: MeningoVax `main` is UNPROTECTED but the owner prefers branch → PR → squash-merge —
   **ask before pushing.**
7. Do NOT port any of this to PneumoVax/vaxapp — batched cross-app review later (record
   em-dash→hyphen and other copy-style items as a batched follow-up).
