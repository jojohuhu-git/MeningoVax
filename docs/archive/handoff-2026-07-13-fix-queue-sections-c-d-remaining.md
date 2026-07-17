# Fix queue 2026-07-13 — Handoff after Sections A+B (MeningoVax done)

Source queue: `MeningoVax-main/.claude/prompts/fix-2026-07-13-meningovax-audit-plus-crossapp.md`
(spans three repos: MeningoVax, PneumoVax, vaxapp/PediVax).

## What's done

**MeningoVax — Sections A and B are fully complete.**

- Branch: `fix/2026-07-13-audit-queue` (off `main`), pushed to origin.
- PR open for review, NOT merged: https://github.com/jojohuhu-git/MeningoVax/pull/4
  (MeningoVax's `main` isn't branch-protected, but this PR was left for the owner to
  review before merging given its size — 8 commits, ~10 items).
- Test suite: started at 229 passing, now **257 passing (16 files)**, all green,
  working tree clean at commit `d3b97a4`.
- Every item below was live-verified in the running dev server (not just tests).

| ID | What changed | Commit |
|---|---|---|
| A1 | ≥22y patient with a valid ≥16y dose now returns "complete", not "not routinely indicated" — the age-≥22y branch never checked `hasDoseAt16` | `5cc973e` |
| A3 | MenACWY doses given before age 10 no longer count toward the routine adolescent series (immunize.org-sourced); shows as "Valid — not counted", not "invalid" | `5cc973e` |
| A2 | Date of birth is now the default/required Age-step entry; the coarse age-band chip buttons were removed (Years/Months kept as a fallback) | `91727cb` |
| B1 | New Compliance Audit table — every recorded dose, both vaccines, with age at administration and validity | `1661921` |
| B2/B3 | "Two separate injections" is the primary/first option; pentavalent is the labeled alternative, second | `02ea482` |
| B4 | Card color now shows timing only (green/amber/neutral); risk-based reason is a purple badge, not a red card fill | `7662d7a` |
| B5 | Booster interval wording states "3 years" or "5 years" specifically once known, not "3–5 years" | `9f21c9f` |
| B6 | "Primary complete, booster due at 16y" shows a prominent banner with an approximate date | `7975f83` |
| B7 | Ctrl/Cmd+A adds a dose row; Enter advances the wizard step | `d3b97a4` |

### Bugs found and fixed in passing (not in the original queue)
- `fmtAgeMonths()` rounding bug producing "4 years 12 months" instead of "5 years" —
  fixed in commit `9f21c9f`.

### Bugs found and spun off as separate follow-up tasks (NOT fixed — do not re-discover and re-fix, just pick these up)
1. **vaxapp MenACWY pre-age-10 dose silently drops the recommendation** — an 11-year-old
   whose only recorded dose was given before age 10 gets ZERO MenACWY recommendation in
   PediVax (worse than the MeningoVax bug this was found while checking parity for —
   MeningoVax at least showed a wrong label). Spawned as a background task titled
   "Fix vaxapp MenACWY pre-age-10 dose silently dropping recs" — check if that task chip
   is still pending in the session UI, or re-derive from `src/logic/recommendations.js`
   lines ~541-680 in `vaxapp-main` (the `men` raw dose count is shared between the
   high-risk-infant branches and the routine 11y+ branches, which need separate counts).
2. **MeningoVax's booster-cadence check wrongly invalidates infant primary-series doses**
   — `validate.js`'s `validateOneMenACWY()` applies the 3–5 year booster-cadence check to
   ANY dose at `effectiveIdx >= 2` for a `primary2`-risk-class patient, but the infant
   high-risk pathway is a 4-dose primary series (doses 3 and 4 are only ~2 months apart,
   not real boosters). This can wrongly flag a legitimate 12-month infant dose as
   "invalid — booster too soon." Spawned as a background task titled "Fix MeningoVax
   booster-cadence check wrongly invalidating infant primary-series doses" — check if
   still pending, or re-derive from `src/logic/validate.js` lines ~250-282 in
   `MeningoVax-main`.

Both of these are genuine, separate clinical-logic bugs — treat them as their own
fix-queue items (reproduce → failing test → fix → full suite → live-verify → commit),
not as "already handled" by this session.

## What's NOT done — the remaining queue

**Section C — PneumoVax (not started at all):**
- **C1**: add a compliance-audit table to PneumoVax (`~/Downloads/PneumoVax`) — same
  shape as MeningoVax's B1 (dose number, date, age at administration, validity + reason),
  reusing whatever PneumoVax's existing dose-validity logic already computes (don't
  recompute validity). Confirm PneumoVax's actual push/PR policy with the `ship` skill
  before pushing (memory says PneumoVax's `main` IS branch-protected, requiring PR +
  squash-merge, unlike MeningoVax).
- This session had NOT yet looked at PneumoVax's actual file structure when it stopped —
  the last action was `cd ~/Downloads/PneumoVax && git status` etc., which the user
  interrupted before it ran. **Nothing in PneumoVax has been touched.**

**Section D — vaxapp/PediVax (not started):**
- **D1**: sweep vaxapp for any interval/age string rendered in raw days (e.g. the
  reported bad example `"D2 only -728 days after D1 — minimum 5 years."`) and convert to
  `fmtAgeClinical`/`humanDays` from `src/logic/ageFormat.js` — do not hand-roll new
  formatting. Also fix the negative/too-early phrasing to read in plain English (e.g.
  "given ~2 years before the 5-year minimum"). Must be applied across vaxapp's five
  surfaces (see `docs/agent/five-surface-verification.md` in vaxapp-main).
- Separately, the vaxapp-main pre-age-10 bug (item 1 above) is also unaddressed.

## Why this is a good stopping point

MeningoVax's Sections A and B are a complete, independently-shippable unit — 257 tests
green, PR open, nothing left dangling. Sections C and D are in different repos with no
code dependency on the MeningoVax work, so picking them up doesn't require re-deriving
anything from this session beyond what's written here.

## Resuming

1. **Do not re-open or re-fix anything under "What's done" above** — it's finished,
   tested, and live-verified. The two spawned follow-up bugs are separate items with
   their own scope (see above); don't fold them back into this queue's language.
2. Decide whether to merge MeningoVax PR #4 now or wait for owner review — the owner
   said they would "click through current work" themselves, so don't merge without
   being asked.
3. For C1 (PneumoVax): `cd ~/Downloads/PneumoVax`, run `git status` and the test suite
   first to get a real baseline (don't assume one), then look at how PneumoVax's dose
   validity is computed (likely a `validate.js` or `compliance.js`-equivalent) before
   building the audit table — mirror MeningoVax's B1 approach
   (`MeningoVax-main/src/components/ComplianceAudit.jsx` +
   `MeningoVax-main/src/logic/validate.js`'s `analyzeHistory`/`ageAtDoseFromDate` export)
   rather than redesigning from scratch.
4. For D1 (vaxapp): grep vaxapp-main's `src/logic/` and UI components for raw day-count
   interval strings, cross-reference against `docs/agent/five-surface-verification.md`.
5. Follow this repo's per-item discipline throughout: reproduce → failing test → fix →
   full suite green → live-verify in the dev server → commit named by item ID
   (`fix-queue` skill). One item at a time; don't batch unverified fixes.
6. Push/merge policy per repo (`ship` skill): MeningoVax `main` is NOT protected (direct
   push allowed, but this session used branch+PR for review); PneumoVax and vaxapp `main`
   ARE protected — branch → PR → `gh pr merge --squash`, never commit to main directly.
   Re-verify with `gh api repos/{owner}/{repo}/branches/main/protection` if unsure.

## Session housekeeping note

`vaxapp-main/.claude/launch.json` has an uncommitted addition — a "MeningoVax dev server"
entry (port 5179) added this session so the MeningoVax dev server could be previewed from
this session's working directory. It's harmless local config, not part of the fix-queue
scope; leave it or commit it separately, owner's call.
