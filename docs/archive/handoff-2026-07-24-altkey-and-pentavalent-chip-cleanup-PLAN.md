# MeningoVax — PLAN handoff: Alt+A removal + pentavalent-chip mislabel cleanup (2026-07-24)

**SUPERSEDED — the queue below (A1, C1, C2, C3) is now DONE.** See
`docs/archive/handoff-2026-07-24-altkey-and-pentavalent-chip-cleanup-DONE.md` for what
shipped, commit shas, and live-verification notes. This file is kept only for its design
rationale (owner decisions, the verified table titles/footnotes) — do not resume work
from this file.

**This is a PLAN, not a post-fix handoff. Zero code/tests were changed this session** — it was
investigation + owner decisions only. Nothing is half-done. The queue below (A1, C1, C2, C3) is
entirely NOT STARTED.

Repo: `~/Downloads/MeningoVax-main` (vite base `/MeningoVax/`; live on GitHub Pages).
Core promise: **honesty** — a chip labeled "Penmenvy" on a recommendation that has nothing to do
with the Penmenvy combo vaccine tells a clinician the wrong provenance. That is the bug class here.

Branch: `main`, in sync with `origin/main`. Working tree dirty with **docs only** (untracked/
modified `.docx` + handoff files from prior sessions — not code). Baseline verified live this
session: **373 passing tests, 0 failing, 29 test files** (`npx vitest run`). Confirm 373 before
starting.

## Relationship to the shipped citation wiring — READ THIS FIRST

The W1–W5 citation-wiring queue is DONE (commit `ddd72e5`; see
`handoff-2026-07-24-citation-wiring-w1-w2-w5-done.md`, `-w3-*-done.md`, `-w4-*-done.md`).
**W1 intentionally reused the `mm7501a2.htm` page — stored in `refs.js` as `pentavalentGSK2025`,
labeled "Penmenvy MMWR 2026;75(1)" — as the generic chip on many non-pentavalent recs, because
that page's ACIP-2025 indication Box restates every generic indication.** The owner has now decided
that reuse mislabels generic content. **C1 and C2 below deliberately REVISE those W1 choices.**
This is a sanctioned change of mind, not a regression. Tests that pin the old citations
(`c5-note-citations.test.js`, `recommend.test.js`) will need updating.

## Owner decisions recorded this session (do NOT re-ask)

- **Item 2 "(preferably 16–18)":** DROP the parenthetical. The generic MenB SCDM statement will be
  backed by `mm7349a3` alone (which says "16–23 based on shared clinical decision-making" but not
  "16–18 preferred").
- **Pentavalent-chip sweep scope:** FULL sweep — fix all ~12 generic recs, not just the one note.
- **Reference chips:** KEEP chips; reconcile so chips and subscripts point to consistent,
  correctly-labeled sources. Do NOT remove the chip row (chip-only sources — immunize.org, CDC
  complement-inhibitor, per-risk-factor refs — would otherwise vanish).
- **MenACWY generic source:** ACIP 2020 MMWR (`rr6909a1.htm`), deep-linked to the specific table
  **per indication**, one table per risk factor. All five table titles + the asterisk footnotes below
  were verified LIVE this session (read from the rendered CDC page). Base for every anchor:
  `https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm#T2_down:~:text=<url-encoded text>`.
- **Owner's footnote rule (2026-07-24):** do NOT truncate the anchor before a footnote unless that
  footnote does not help the recommendation's clinical logic. When a table's `*` footnote carries a
  rule the clinician acts on, the anchor must ALSO capture it — add a SECOND text directive
  (`…&text=<key footnote clause>`), don't drop it. Verdict per table:
  - **Table 2** (routine) — "TABLE 2. Recommended meningococcal vaccines and administration schedules
    for children and adults". No footnote marker → title only.
  - **Table 7** (microbiologist) — "TABLE 7. Recommended vaccination schedule and intervals for
    microbiologists routinely exposed to isolates of Neisseria meningitidis". No footnote marker →
    title only.
  - **Table 8** (outbreak) — "TABLE 8. …persons who are at risk during an outbreak". Footnote is only
    a pointer ("Detailed recommendations on outbreak management are available at [URL]") → NOT
    load-bearing → title only, stop before the `*`.
  - **Table 9** (travel) — "TABLE 9. …persons who travel to or are residents of countries where
    meningococcal disease is hyperendemic or epidemic". Footnote IS load-bearing (defines the travel
    indication): add a second directive for → "For international travelers, vaccination is recommended
    for those visiting the parts of sub-Saharan Africa known as the meningitis belt during the dry
    season (December–June)".
  - **Table 10** (college & military) — "TABLE 10. …college freshmen living in residence halls* and
    military recruits" (keep the full title through "military recruits"). Footnote IS load-bearing (it
    is the college-dorm/W4 rule): add a second directive for → "College freshmen living in residence
    halls should receive at least 1 dose of MenACWY within 5 years before college entry".

## The queue — NOT STARTED

### A1 — Remove the Alt+A "add dose" binding (UI only, no clinical logic)
- **Cause:** the Ctrl/Cmd+A shortcut works via a JS `keydown` listener (`StepHistory.jsx:12`,
  `Results.jsx:127`) — leave that alone. The EXTRA Alt+A comes from an HTML `accessKey="a"` on the
  Add-dose button (`DoseEditor.jsx:112`, fed by `addAccessKey="a"` at `StepHistory.jsx:84`). The
  underlined "A" in `<span>+ <u>A</u>dd dose</span>` (`StepHistory.jsx:90`) is the visual cue for
  that accessKey.
- **Do:** remove the `addAccessKey` prop + `accessKey`/`title` plumbing in `DoseEditor.jsx`, remove
  `addAccessKey="a"` in `StepHistory.jsx`, and drop the `<u>` around "A" (keep label "+ Add dose").
  The `title`/`shortcut-hint` already say "Ctrl/Cmd+A" — leave them.
- **Test:** `StepHistory.test.jsx` and `App.test.jsx:323/327` already assert Ctrl/Cmd+A adds a row;
  add an assertion that Alt+A does NOT (or that the button has no accessKey).

### C1 — MenB generic citations: `mm7501a2`/Penmenvy → `mm7349a3`; drop "preferably 16–18"
Five healthy-MenB recs in `menbRec` (`recommend.js`) currently default their chip to
`pentavalentGSK2025` and (in two spots) their subscript to `menbHealthySCDM1623Box` — both are the
`mm7501a2`/Penmenvy page:
- L617–625 (SCDM dose 1): note edit — delete "(preferably 16–18)"; change `noteCites` first `[c]`
  from `menbHealthySCDM1623Box` → the `mm7349a3` SCDM sentence (reuse existing `menbHealthy2Dose0and6`,
  whose quote already covers "16–23 … shared clinical decision-making … 0 and 6 months"); change chip
  `['pentavalentGSK2025']` → `['mm7349a3']`.
- L627–634 (dose 2), L636–658 (rescue), L660–662 (complete 2-dose), L675–680 (not-indicated):
  chip `pentavalentGSK2025` → `mm7349a3`. For L675–680 also delete "(preferably 16–18)" and change
  its `noteCites` from `menbHealthySCDM1623Box` → `menbHealthy2Dose0and6`.
- L664–668 (accelerated complete) already uses `mm7349a3` — leave.
- After the sweep, check whether `menbHealthySCDM1623Box` is still referenced anywhere; if orphaned,
  remove it from `refs.js` (like W1 removed the dead `menbSharedDecision1623`).

### C2 — MenACWY: `pentavalentGSK2025` → `rr6909a1` table anchors, attached to RISK FACTORS
**Key architecture note (found while planning):** each risk factor in `src/data/riskFactors.js`
already carries its own `refs` array, and `collectRefs(riskIds, extra, defaults)` pulls those into a
rec's chips automatically. So the table anchors belong on the RISK-FACTOR definitions, not blanket on
the recs. This solves the "one rec covers two indications" problem for free: the `single+boost` rec
(travel + microbiologist) and the `single` rec (military + outbreak) will each show the table
matching whichever risk the patient actually selected — no per-rec branching needed.

- **New `refs.js` entries** (chip-only: give them NO `quote`, so `cite()`/`highlightUrl` won't append a
  second `#:~:text=`; `resolveRefs` uses the entry's `url` verbatim, so the table fragment survives on
  the chip). `short` = "ACIP 2020 MMWR" for all (keeps the chip clean); put the table name in `label`
  (hover). Suggested keys: `acip2020Table2`, `acip2020Table7`, `acip2020Table8`, `acip2020Table9`,
  `acip2020Table10`, each with the anchored url built from the titles in "Owner decisions" above.
- **Edit `riskFactors.js` `refs`** (this is where the chip now comes from):
  - `microbiologist` (L56): `['acip2020']` → `['acip2020Table7']`
  - `travel` (L64): `['acip2020', 'cdcRecommendations']` → `['acip2020Table9']` (drops the CDC page,
    consistent with W1's CDC-chip removal)
  - `military` (L71): `['acip2020']` → `['acip2020Table10']`
  - `college_dorm` (L78): `['acip2020']` → `['acip2020Table10']`
  - `outbreak_acwy` (L85): `['cdcRecommendations']` → `['acip2020Table8']`
  - `outbreak_b` (L92) is a **MenB** indication — leave for the MenB cleanup (its `cdcChildMenB`
    should follow C1 → `mm7349a3`, NOT Table 8, which is a MenACWY schedule table).
- **Remove the blanket `pentavalentGSK2025` extra** from the `single`/`single+boost` recs in
  `menacwyRec` (L199, L209, L244, L259, L269, L278, L285). Watch the dedup: `collectRefs` dedupes by
  KEY, not URL, so if the generic `acip2020` default is also present the chip shows twice ("ACIP 2020
  MMWR" whole-page + the same-named Table chip). Fix per-rec, NOT by editing the shared `refsFor`
  helper — the `primary2` medical-risk recs (asplenia/complement/HIV, L132–189) still need the
  `['acip2020']` default. For just these 7 exposure recs, build refs with an empty default, e.g.
  `collectRefs(riskIds, [], [])`, so the per-risk table anchor is the only rr6909a1 chip shown.
  (L259 additionally keeps `immMenACWY` for the unknown-date college case.)
- **Routine** (`menacwyRoutine`, `refs = ['acip2020']`): upgrade the whole-page chip to the **Table 2**
  anchor (`['acip2020Table2']`). Precision upgrade, not a Penmenvy fix.
- **Reserve `pentavalentGSK2025` / `pentavalentPfizer2023` for pentavalent-specific spots only:** the
  pentavalent offer card (`recommend.js:742`). (The routine 11–12y note at L440 mentions pentavalent
  in prose but carries no pentavalent citation — leave.)

### C3 — Reconcile chips ↔ subscripts (acceptance check for C1/C2) + refs hygiene
- After C1/C2, walk every rec and confirm: no chip whose LABEL contradicts the rec's content (no
  "Penmenvy" on a generic rec), and no subscript hover-quote that names a different source than its
  chip. The concrete example the owner saw: MenB "not indicated <16" — subscript hover = a generic
  SCDM quote, chip = "Penmenvy MMWR 2026;75(1)" (same page, mislabeled). C1 fixes exactly this.
- Legitimately chip-only sources that STAY as chips (no quotable sentence — do not try to convert to
  subscripts): `immMenACWY`, `immMenB`, `cdcComplementInhibitor`, and per-risk-factor refs pulled via
  `RISK_BY_ID`. Document this so a future session doesn't "finish the job" by deleting them.

## Why this is a good stopping point
All owner decisions are made and recorded; the code is untouched (nothing half-changed); the queue is
four independent, well-scoped items. A1 is pure UI. C1/C2/C3 are citation-metadata edits (additive/
swaps — no dosing logic changes) that revise shipped W1 choices with the owner's explicit sign-off.

## Resuming
1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`
2. `npx vitest run` — confirm **373 passing** before any new work.
3. Per `verify-clinical-source` (REQUIRED before any citation edit): re-fetch `mm7349a3.htm` and
   `rr6909a1.htm` LIVE and confirm each chosen quote/anchor is an exact substring — do NOT trust this
   handoff's quotes or the owner's pasted anchors as ground truth.
4. Per-item workflow (`fix-queue`): one item at a time → failing test (logic + UI layers where visible)
   → fix → full suite green → live-verify in the running app (`preview_start` "MeningoVax dev server")
   by reading a rendered chip/subscript href → commit named by item ID (`A1`, `C1`, `C2`, `C3`).
5. Verify no `status`/`doseLabel`/dosing value changes as a side effect of the citation edits
   (citations are metadata only).
6. Ship: MeningoVax `main` is UNPROTECTED (direct push allowed per `ship`), but **ask the owner before
   pushing** — every prior session did.
