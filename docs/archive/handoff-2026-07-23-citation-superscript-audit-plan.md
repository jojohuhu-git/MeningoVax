> **SUPERSEDED (2026-07-24)** — the plan below is implemented. See
> `docs/archive/handoff-2026-07-24-citation-superscript-implemented.md` for
> what shipped and what's still open. Do not resume this queue from here.

# MeningoVax — Handoff after citation/reference audit (2026-07-23)

Branch: `main`, 0 ahead / 0 behind `origin/main`. Working tree has no code changes —
only pre-existing doc diffs from an earlier session (unrelated to this handoff; see
`git status`). **327 passing tests (0 failing)**, confirmed via `npx vitest run` at the
end of this session — nothing was touched, so this is still the baseline for the next
session too.

**No code has been written yet.** This entire session was research and scoping: a live
source audit plus a proposed implementation plan. The next session's job is to execute
the plan below, not to re-derive it.

## What this is about

Owner request: review MeningoVax's reference/citation system for overlap (ACIP vs CDC
citing the same rule twice), and — where feasible — turn citations into superscripts
that deep-link to the *exact highlighted sentence* being cited (not just the source's
landing page), maintainable long-term by editing one data table when guidance changes.

**Out of scope, explicitly**: any port of this work to vaxapp/PediVax or PneumoVax. The
owner said she will rewrite those change requests herself later — do not touch those
repos for this task.

## Current citation architecture (as of this session)

- `src/data/refs.js` — `REFS` (whole-source landing-page citations, rendered as chips at
  the bottom of each `RecCard`) + `ACIP_ANCHORS` (a handful of `#:~:text=` deep-links into
  the 2020 MMWR, used only for a few high-risk booster notes).
- `src/logic/recommend.js` — `cite(n, anchorKey, label)` builds a `[N]` marker; `noteCites`
  pairs each marker with its target URL; `refs: [...]` resolves to the bottom-of-card chips.
- `src/components/RecCard.jsx:114-131` — `renderNoteWithCites()` turns `[N]` substrings in
  `note` text into clickable superscript links (this mechanism already exists and works;
  it just isn't applied broadly).
- Prior related work: `docs/archive/handoff-2026-07-24-c5-subscript-links-merged.md`
  documents the original build of this `[N]`/`ACIP_ANCHORS` mechanism (already merged) —
  read it for background, but note this handoff supersedes its "not yet extended further"
  status with a concrete plan to extend it.

## Owner decisions already made this session (do not re-ask)

1. **Overlap** — when ACIP 2020 MMWR and a CDC schedule note just restate the same rule,
   keep ONE citation (drop the restated one). Keep both only when the second source adds
   or updates something the first doesn't.
2. **Coverage** — add highlight-superscripts to every recommendation where the source page
   supports it, not just the currently-stale-flagged ones.
3. **Editing model** — redesign into ONE commented data table per citation: `url`,
   `quote` (exact highlight phrase), `label`, `lastVerified` date. Editing one entry should
   be the entire workflow for swapping a stale link.
4. **Fallback for browsers that ignore `#:~:text=` highlighting (Firefox)** — my
   recommendation, given without explicit owner confirmation (the owner said "help me
   decide" and the conversation moved to this handoff before confirming): also store the
   exact quoted sentence in the data table and show it in-app (tooltip/expandable) next to
   the link, so the clinician can read the cited text even when the browser can't
   scroll-to-highlight. **Surface this to the owner at the start of the next session for a
   quick yes/no before building the UI for it** — don't treat it as fully locked.

## Live-verification findings (all confirmed today, 2026-07-23, via real browser fetch — not WebFetch's model-summarized fetch, which paraphrases and is unreliable for exact-quote checking)

- **Dead link, currently shipping**: `REFS.cdcRecommendations` →
  `https://www.cdc.gov/vaccines/vpd/mening/hcp/recommendations.html` silently redirects to
  a generic "Vaccines By Disease" page with no meningococcal content. Used today in refs
  for travel, military, MenACWY-outbreak, and MenB-outbreak recs
  (`src/data/riskFactors.js:60,67,74,81,88` and `src/logic/recommend.js:191,201`).
  **Fix regardless of the rest of this project** — this is a live bug, not just cleanup.
- **Verified replacement**: `https://www.cdc.gov/meningococcal/hcp/vaccine-recommendations/index.html`
  (confirmed live, dated Mar 30, 2026). Bonus: this page states the MenACWY high-risk
  booster age-split ("Age under 7 years: booster 3 years after primary... Age 7 years or
  older: booster every 5 years") **explicitly** — something the current `cdcAdultMening`
  citation does NOT say (the adult-schedule note only says "5 years," silently assuming an
  adult already past 7). Consider citing this new page for that specific rule instead of
  (or alongside) the MMWR-only anchor currently used in
  `recommend.js:140-144,172-178,337`.
- **All 5 existing `ACIP_ANCHORS` phrases are still exact verbatim substrings** of the live
  PMC page (`https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/`) — confirmed via direct
  DOM substring search, not model paraphrase. Existing superscripts are not stale.
- **`cdcComplementInhibitor` is NOT redundant** — keep it separate. It has real content the
  MMWR lacks: newer complement inhibitors (pegcetacoplan, iptacopan), the "vaccines provide
  incomplete protection" finding, antimicrobial-prophylaxis guidance. Page confirmed live,
  dated Mar 6, 2026.
- **CDC child/adolescent schedule notes page carries a legal notice**: a March 16, 2026
  court order (*AAP et al. v. Kennedy et al.*, D. Mass.) stayed later-2025 ACIP votes, so
  CDC is serving the **July 2, 2025** schedule as current. This doesn't change any rule
  checked this session, but "updated since the MMWR" should be evaluated against this
  July 2025 CDC page, not some newer schedule that may exist but isn't legally in effect.
- **immunize.org pages are fragile deep-link targets** — each "Ask the Experts" topic page
  bundles 44–56 Q&As with no versioning. Recommend keeping these as landing-page chips
  only, not per-sentence superscripts, and saying so honestly in the UI/code comment
  rather than pretending a fragile highlight-link works.
- **Could not confirm `#:~:text=` scroll-to-highlight actually fires** in the in-app
  preview browser used this session — the link loaded the page but didn't visibly scroll.
  This is most likely a limitation of that specific preview tool (real desktop
  Chrome/Edge have supported Scroll-To-Text-Fragment since 2020; Safari since 16.1;
  Firefox never has). Don't treat this as proof the feature is broken — but also don't
  claim it's confirmed working without testing in a real browser once built.
- **Minor labeling inconsistency** (not a factual error, just messy): `refs.js` comments
  label the two pentavalent MMWRs by ACIP-action-year ("Penbraya MMWR 2023", "Penmenvy MMWR
  2025") but their actual MMWR publish dates/volumes are different — Penbraya published
  Apr 18, 2024 as *73(15)*; Penmenvy published Jan 8, 2026 as *75(1)*. Pick one convention
  (recommend: cite MMWR volume/date precisely, e.g. "MMWR 2024;73(15)") and use it
  consistently in the redesigned table.

## What's NOT done — the full remaining queue

Nothing has been implemented. In order:

1. Redesign `src/data/refs.js` into the single commented table (see decision #3 above):
   per-citation `url`, `quote`, `label`, `lastVerified`, and a flag for whether it
   supersedes/extends the MMWR. Fix the dead `cdcRecommendations` link. Fix the MMWR
   volume/year label inconsistency.
2. Drop the restated CDC-note half of every `acip2020` + CDC-note pair across
   `src/logic/recommend.js` and `src/data/riskFactors.js`; keep CDC separately only for
   complement-inhibitor guidance and content the MMWR doesn't cover (e.g. the age-split
   rule from the new vaccine-recommendations page, if the owner wants it added there).
3. Add `[N]` highlight-superscripts (extend the existing `cite()`/`ACIP_ANCHORS`/`noteCites`
   mechanism) to every `note:` string in `recommend.js` where a source supports it — roughly
   15 recommendation branches currently have no superscript at all. Leave immunize.org refs
   as plain chips with an in-code comment explaining why (fragility, no versioning).
4. Update `RecCard.jsx` / `Results.jsx` to show the stored quoted snippet in-app (pending
   owner confirmation of decision #4) alongside the existing highlight link.
5. Both logic + UI-rendering tests for the new citation shape (per this repo's testing
   convention). Run the full suite. Live-drive the app (start dev server, walk through
   MenACWY/MenB across ages 2mo–adult and each risk factor, plus the pentavalent card) to
   confirm citations render and nothing regressed.
6. Commit. This repo's `ship` rules (branch protection, PR flow) apply — check the `ship`
   skill before pushing/merging.

## Why this is a good stopping point

The expensive, error-prone part — fetching and verifying every live source, catching the
dead link, and confirming which citations are truly redundant vs. load-bearing — is done
and written down here with URLs and evidence. Nothing has been coded, so there's no
half-finished state to reconcile. The next session can start straight at step 1 of the
implementation queue without re-deriving any of this research.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main` (already current branch).
2. Run `npx vitest run` — confirm **327 passing** before starting.
3. Open decision for the owner: confirm or override the quoted-snippet fallback (decision
   #4 above) before building any new UI for it.
4. Work the implementation queue above in order (1→6). Use the `verify-clinical-source`
   procedure again only if you touch a source not already verified in this handoff — don't
   re-fetch what's already confirmed live above.
5. This repo's `main` branch protection and PR/merge rules apply — consult the `ship`
   skill before any push or merge. Do not touch vaxapp or PneumoVax for this task.
