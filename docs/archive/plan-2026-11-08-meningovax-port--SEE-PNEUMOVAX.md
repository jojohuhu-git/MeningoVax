# POINTER — the MeningoVax port plan lives in PneumoVax

**This file is not the plan.** It is signposting so a MeningoVax session finds the real document
instead of working from a copy that has drifted.

**The plan:** `~/Downloads/PneumoVax/docs/archive/plan-2026-11-08-meningovax-port.md`
**Its latest handoff:** the newest `~/Downloads/PneumoVax/docs/archive/handoff-*meningovax*.md`
without a SUPERSEDED banner (2026-11-15: `handoff-2026-11-15-meningovax-phase2-3-cdsi-rules.md`).
**The CDC CDSI half:** `~/Downloads/PneumoVax/docs/archive/plan-2026-11-08-cdsi-checks-both-apps.md`
(this repo's CDC files are already in `scripts/cdsi/cdc-files/`).

**Why a pointer and not a copy** (owner decision 2026-10-16): a both-apps plan filed in both repos
disagreed with itself within hours, and no test compares planning documents. One document, one place.

## What this repo's work is

All of it. The plan brings PneumoVax's way of working to MeningoVax in nine phases (0–9): measure,
safety nets, one rule table, the clinical decisions, one label per dose, dates stated plainly,
wording, a rulebook held to the code, citations. **Status 2026-11-15: Phase 0 done; Phase 1 items 1.1–1.5
built** — `report-2026-11-15-phase0-measured.md`, `inventory-2026-11-15-every-place-a-dose-is-judged.md`,
`report-2026-11-15-whole-app-checks.md` and `report-2026-11-15-cdsi-test-patients.md` in this
folder. **STOP B answered 2026-11-15** (five answers, in the plan); 1.5 is a required test (PR #85, merged).
**Phase 2.1 built** — the rule table `src/logic/doseRules.js` (PR #86, merged). **Phase 2.2 built** —
`sourcesSay` beside each row (what the sources say, quoted and read live). **Phase 2.3 built** — the
rule table held against CDSI's rule files (`report-2026-11-15-cdsi-rule-comparison.md`). Next: the
undated-records read, then STOP C.

When a phase finishes, its new rule goes into this repo's `CLAUDE.md` (plan review item R-9).
