# MeningoVax — Handoff after full citation coverage + new recs-table request (2026-07-24)

Supersedes `docs/archive/handoff-2026-07-24-citation-superscript-implemented.md`
(that file's "not done" queue — MenB/infant quote coverage — is now implemented;
don't re-derive it or re-run it).

Branch: `main`, pushed to `origin/main` at commit `2bd48b9`
(`4cabf95..2bd48b9`). Baseline was 334 passing tests; now **340 passing (all
green)**, working tree clean at this commit except pre-existing unrelated doc
diffs from earlier sessions (see `git status` — not from this session).

## What's done (remaining items from the 2026-07-24 "not done" queue)

1. **Live-verified and added 3 new `CITATIONS` entries** in `src/data/refs.js`:
   `acwyInfantHighRisk2to6mo`, `acwyInfantHighRisk7to23mo` (both quoted verbatim
   from the ACIP 2020 MMWR, PMC7527029), and `menbPregnancyDeferral` (same
   source). All confirmed as exact substrings of the live-fetched page text,
   not transcribed from memory.
2. **Added `[N]` highlight-superscripts** to the ~7 previously-uncited notes in
   `src/logic/recommend.js`: infant high-risk MenACWY at 2–6mo (dose 1), 7–11mo
   (dose 1), 12–23mo (dose 1), the 3-dose-shortcut completing dose, the
   infant-to-booster transition note, both continuation-dose branches, and the
   MenB pregnancy-deferral note.
3. **Investigated a suspected bug, found none**: while verifying, the app's
   uniform 3-dose (0/1–2/6mo) high-risk MenB schedule for *both* antigen
   families looked like it might contradict the 2020 MMWR's brand-split table
   (3-dose FHbp **or** 2-dose 4C). Fetched the CDC's current
   `meningococcal/hcp/vaccine-recommendations/index.html` page live (dated Mar
   30, 2026, per owner-supplied URL) — it states a single brand-agnostic
   3-dose schedule + 1yr/2–3yr booster cadence for all high-risk patients,
   which supersedes the older MMWR table. **The app's existing behavior is
   correct, not a bug.** Added `cdcRecommendations` as a citation chip
   (whole-page, not `[N]` — the source is a bulleted list, not a clean
   quotable sentence, same reasoning as the existing immunize.org convention)
   to the 4 high-risk MenB dosing/booster call sites in `recommend.js`.
4. **Tests**: added a `describe('Citation coverage — MenB high-risk, pregnancy,
   infant MenACWY (2026-07-24)')` block to
   `src/logic/__tests__/recommend.test.js` (6 new tests) covering the new
   citations and superscripts. Full suite 334 → 340.
5. **Live-verified** in the running dev server (own instance, port 5181, base
   `/MeningoVax/` — a different chat's server was already running and
   unreachable from this session's browser tool): infant 4-month asplenia case
   shows the `[1]` superscript with the correct hover-quote and `#:~:text=`
   fragment; pregnant 20y case shows the `[1]` pregnancy-deferral superscript;
   asplenia 25y adult case shows the new "CDC Meningococcal Recommendations"
   chip alongside the existing "ACIP 2020 MMWR" and "CDC Complement-Inhibitor
   Guidance" chips on the MenB card.
6. **Shipped**: committed `2bd48b9`, pushed directly to `main` (unprotected
   repo, per the `ship` skill) with owner confirmation.

## What's NOT done — the remaining queue

- **`acwyBeforeAge10` wiring** — still not started. The owner was asked
  whether to extend `DoseValidation`'s reasons rendering to support `[N]`
  links, or use a simpler plain-text citation instead. **Owner's answer:
  neither for now — see the new request below instead.**
- **Owner's new request (not yet started)**: build a **summary table of all
  recommendations**, showing which ones already have an associated citation
  and which don't, so the owner can herself add the missing references. This
  is a reporting/audit task, not a code-logic change — likely a script or a
  test-suite walk that enumerates every `rec()` call site in `recommend.js`
  (or every reachable rec across a representative age/risk sweep) and reports
  `refs`/`noteCites` presence per site. No format has been decided — ask the
  owner what output form she wants (markdown table, spreadsheet, in-app view)
  before building.
- Out of scope, per the original 2026-07-23 audit handoff (still true): no
  port of any of this to vaxapp/PediVax or PneumoVax. The owner said she'll
  write those change requests herself.

## Why this is a good stopping point

Every item from the prior "not done" queue is closed out and shipped. The one
still-open item (`acwyBeforeAge10`) was explicitly deferred by the owner in
favor of a new, differently-scoped request (the recs-coverage table), so
there's no half-finished citation work sitting around — the next session
starts a genuinely new task, not a resumed one.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull`.
2. Run `npx vitest run` — confirm **340 passing** before starting anything new.
3. **Ask the owner what form she wants the recommendations-coverage table
   in** (markdown doc, spreadsheet export, in-app debug view) before building
   anything — this was requested but not scoped.
4. Enumerate every `rec()`/citation call site across `recommend.js` (both
   `menacwyRec`/`menacwyRoutine`/`menacwyInfantHighRisk` and `menbRec`), note
   which already carry `refs`/`noteCites` and which don't, and present that
   list — the owner intends to fill in missing references herself, so this
   session's job is the inventory, not adding more citations.
5. `acwyBeforeAge10` wiring remains parked — do not start it without the
   owner picking one of the two options (DoseValidation `[N]`-link support vs.
   plain-text citation) first.
6. MeningoVax's `main` is unprotected — direct push is allowed per the `ship`
   skill, but confirm with the owner before pushing anything clinically
   significant, as was done this session.
