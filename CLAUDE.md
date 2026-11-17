# MeningoVax Agent Guide

## What This App Is

Standalone client-side React SPA for **meningococcal** vaccine clinical decision support (MenACWY + MenB + pentavalent MenABCWY). No backend, no auth, no DB. Sibling of PneumoVax; independent codebase. Live at https://jojohuhu-git.github.io/MeningoVax/

## Start Here

```bash
npm install
npm run dev        # dev server (port 5173, jumps if occupied)
npm test           # Vitest run
npm run build      # production build to dist/
```

Dev server config: `.claude/launch.json` (name: "MeningoVax dev server").

All public asset paths MUST use `import.meta.env.BASE_URL` (Vite sets `base: '/MeningoVax/'`).

The save-time guardrail (flags stray top-level notes — see Root Directory Hygiene) turns on automatically during `npm install`. If a session finds it off (e.g. a freshly re-downloaded copy), re-run `npm install` or `npm run prepare` to switch it back on, and remind the owner.

## Source of Truth Files

| What | Where |
|---|---|
| Plain-English folder guide (owner is a non-coder) | [MAP.md](MAP.md) |
| Architecture, file map, engine API, validation model | [docs/agent/architecture.md](docs/agent/architecture.md) |
| MenACWY/MenB clinical rules, schedules, booster cadence | [docs/agent/clinical-rules.md](docs/agent/clinical-rules.md) |
| Plain-English rules summary (owner-facing; source of truth) | [docs/agent/meningococcal-rules-summary.md](docs/agent/meningococcal-rules-summary.md) |
| Test files and coverage requirements | [docs/agent/testing.md](docs/agent/testing.md) |
| Session history (2026-06-04 through 2026-06-13) | [docs/archive/agent-session-log.md](docs/archive/agent-session-log.md) |

## Current Work — The Port From PneumoVax

PneumoVax's way of working (one rule table, a moved answer must be explained, one label per dose,
dates stated plainly, a rulebook held to the code, citations per card) is being brought here in
nine phases. **The plan lives in PneumoVax, not here** (owner decision 2026-10-16: both-apps plans
are one file plus a pointer): read
[docs/archive/plan-2026-11-08-meningovax-port--SEE-PNEUMOVAX.md](docs/archive/plan-2026-11-08-meningovax-port--SEE-PNEUMOVAX.md)
first. **Status 2026-11-15: Phase 0 done; Phase 1 (items 1.1–1.5) built** (saved answers, prose
diff, typical patients, whole-app checks, CDC's CDSI test patients) — findings in
`docs/archive/report-2026-11-15-whole-app-checks.md` and
`docs/archive/report-2026-11-15-cdsi-test-patients.md`, listed not fixed. **STOP B answered
2026-11-15** (five owner answers, recorded in the plan; applied in Phase 3). CDC's test patients
are now a required test (`cdsi-test-patients-gate.test.js`). **Phase 2.1 built** (the rule table,
`src/logic/doseRules.js`, PR #86, merged). **Phase 2.2 built** (`sourcesSay` beside each row: the
quoted sentences, read live, and a verdict; 0 answers or sentences moved). **Phase 2.3 built** (every
row held against CDSI's rule files, `cdsi-rule-comparison.test.js`; every difference named; 0 moved;
findings in `docs/archive/report-2026-11-15-cdsi-rule-comparison.md`). **The three reads before STOP C
are done** (2026-11-15: undated records, pentavalents from 26, the old Bexsero course; quoted in
`src/data/refs.js` and the 2.3 report; 0 answers moved). **STOP C answered 2026-11-15** (18 owner
answers, C1–C18, in `docs/archive/stop-c-packet-2026-11-15.md`; no code changed). **Phase 3 family 1
built 2026-11-16** (Ruling D; PR #90, merged). **Phase 3 families 2–5 and STOP B built
2026-11-16/17** (#91–#95, approved; landed on main by #96, because stacked PRs had merged into
each other's branches): undated doses do not count (C1); MenB dose 3 (C5–C7); MenACWY gaps
(C10, C11, C13); relabels (C3, C4, C8, C9, C14, C15, C18); outbreak/military booster dates,
routine-only under 16, pentavalent waits, no false "Complete" (B-2–B-5). **Not built: B-1**
(4-day grace at age lines "only when it helps") — next, then Phase 4. Open owner questions are
in the newest handoff (in PneumoVax).
CDC's CDSI files and the test-patient script are in `scripts/cdsi/` (`README.md` there).

## Non-Negotiable Rules

### Root Directory Hygiene
Only `CLAUDE.md`, `MAP.md`, and `README.md` live at the repo root. Never create new root-level `.md` files. Session notes/handoffs/reviews go to `docs/archive/`; durable knowledge goes to the matching `docs/agent/` file. Keep `MAP.md` current when folders change.

### Cloud-Sync Gotcha
This folder is iCloud-synced — edits can silently revert. If a change "disappears," re-apply it. Commit early.

### Clinical Authority
ACIP/CDC/AAP/immunize.org over FDA package inserts. Never revert to FDA-labeled ages without explicit instruction.

Within that group, AAP is a tiebreak, not a ranking (owner decision, 2026-08-10): where ACIP/CDC and AAP agree, cite either; where they disagree, AAP governs; never adopt a CDC revision recommending fewer doses or narrower eligibility than AAP; where AAP is silent, CDC/MMWR stands.

### Engine Logic Stays in the Engine
Brand eligibility, the MenB antigen-family lock, booster cadence, and dose validation are computed in `recommend.js` and `doseRules.js` (the rule table `validate.js` walks, one row per rule). Do NOT re-derive clinical logic in components.

### Brand Strings — Do Not Strip in Engine
Engine brand strings carry an antigen suffix (`'Menveo (MenACWY)'`, `'Bexsero (MenB)'`). Tests assert these exact strings. Strip for display only via `stripAntigen()` in `RecCard.jsx` and `Results.jsx`.

### Booster Cadence — Keep recommend.js and doseRules.js in Sync
MenACWY high-risk booster timing is keyed off the age at the LAST primary dose (Dose 2 in a 2-dose series) in BOTH files (`intervals.js` primary-completion age; `ACWY-HIGHRISK-BOOSTER-GAP` row). Changing one without the other will produce inconsistent results (the engine predicts one interval; the validator flags a different one as too soon).

### MenB D3 — Both Floors for the Forecast; a Given D3 Is Judged From Dose 2
The forecast advises D3 after BOTH ≥6 months from D1 AND ≥4 months from D2 (`earliestNextDate` =
the later of the two), in `recommend.js`. A D3 ALREADY GIVEN ≥4 months after D2 counts, whatever
the gap from D1 (owner STOP C C5, 2026-11-15).

A D3 given earlier than 4 months after D2 still counts, and a 4th dose is owed ≥4 months later —
UNLESS D3 was ≥6 months after D1 (ACIP mm7349a3's "unless", owner C6). The 4-month line takes the
4-day grace (owner C7), as do the healthy MenB 6-month rescue line (C7) and both high-risk
6-month lines — the "unless" (D3) and "dose 2 ≥6 months, no dose 3" (D4, 2026-11-17). Both decisions live in ONE
function each in `seriesTotals.js` (`menbHighRiskDose3Early`, `menbHealthyDose2Early`); never
re-derive them. Series length comes from `menbSeriesInfo()` — never hand-type 3.

### Pentavalent — Dedicated Card Only
Penbraya/Penmenvy surface ONLY through the pentavalent card, never in the standalone MenB brand list. Eligible only when both MenACWY AND MenB are due today AND age ≥10y.

### Transplant Is A Hard Stop, Mirrored With PneumoVax
Ticking `hct_cart_bcell_exclude` (transplant, CAR-T, B-cell malignancy or B-cell-depleting therapy)
stops the engine: no recommendation at all, not even the age-based one (owner decision 2026-10-16).
The row's id, label, sublabel and flag and the whole message are **byte-identical to PneumoVax's**,
frozen by `regression-2026-10-16-transplant-is-a-hard-stop.test.js` here and by PneumoVax's
`regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js`. Change the wording in both
repos or neither. Never re-add a post-transplant schedule.

### dateUtils.js Is Mirror-Synced With PneumoVax
`src/logic/dateUtils.js` must stay identical in code to PneumoVax's copy (only a comment differs).
The guard lives in PneumoVax (`regression-s6-4-avg-days-per-month-one-home.test.js`), so a change
made here fails there — apply the same change to both.

### college_dorm vs military vs acwy_outbreak
The ≥16y-dose-satisfies rule applies ONLY to `college_dorm`, and only for 5 years after that dose (owner D1, 2026-11-17, reversing M17's "permanently"). Do not apply it to `military` or `acwy_outbreak`.

### End-of-Session Checklist (E4)
Four questions, at the end of any session and in any PR body. They take two minutes and catch drift a green suite alone won't:

1. Did this session add a number, date, or sentence to a test file? If yes — where does it come from, and is it already in `src/`?
2. Did this session add a capability to the app (a risk factor, a brand, a status, a schedule)? If yes — which sweep (`sweep-dose-counter.test.js`, `sweep-never-events.test.js`, etc.) got wider? "None" is a failing answer.
3. Did this session change a clinical rule? If yes — which doc (`docs/agent/clinical-rules.md` / `docs/agent/meningococcal-rules-summary.md`) was updated in the same commit?
4. Is the test count rising much faster than the file count? That can mean one file is generating many near-identical assertions — not wrong, but it inflates the sense of coverage. Flag it for the owner to see at review time rather than deciding alone.

## Testing Expectations

- When changing the engine: add/adjust a test in `recommend.test.js`.
- When changing validation rules: change the row in `doseRules.js`, update `validate-new-rules.test.js`, and confirm `recommend.js` mirrors the same logic.
- Regression tests must fail when the fix is reverted.
→ See [docs/agent/testing.md](docs/agent/testing.md)

## Documentation Maintenance

| Content type | Destination |
|---|---|
| Current commands, required workflow, short non-negotiable rules | Root `CLAUDE.md` (this file) |
| Architecture, engine API, file map, validation model | `docs/agent/architecture.md` |
| MenACWY/MenB clinical rules, booster cadence, risk factor details | `docs/agent/clinical-rules.md` |
| Test files, coverage requirements, key invariants | `docs/agent/testing.md` |
| Dated "session changes" / "changes shipped" history | `docs/archive/agent-session-log.md` |
| Handoffs, reviews, finished plans | `docs/archive/` |
| Plain-English folder explanations for the owner | `MAP.md` |

Do not add dated session logs, implementation narratives, or stale local paths to this file.
