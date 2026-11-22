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
| Plain-English rules summary and **rulebook** (owner-facing; source of truth; §5 generated) | [docs/agent/meningococcal-rules-summary.md](docs/agent/meningococcal-rules-summary.md) |
| Test files and coverage requirements | [docs/agent/testing.md](docs/agent/testing.md) |
| Session history (2026-06-04 through 2026-06-13) | [docs/archive/agent-session-log.md](docs/archive/agent-session-log.md) |

## Current Work — The Port From PneumoVax

PneumoVax's way of working (one rule table, a moved answer must be explained, one label per dose,
dates stated plainly, a rulebook held to the code, citations per card) is being brought here in
nine phases. **The plan and its handoffs live here** (moved from PneumoVax 2026-11-17, owner
decision; PneumoVax keeps a pointer): read
[docs/archive/plan-2026-11-08-meningovax-port.md](docs/archive/plan-2026-11-08-meningovax-port.md)
and the newest `docs/archive/handoff-*` without a SUPERSEDED banner first. **Status 2026-11-15: Phase 0 done; Phase 1 (items 1.1–1.5) built** (saved answers, prose
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
routine-only under 16, pentavalent waits, no false "Complete" (B-2–B-5). **Owner answers D1–D8
(2026-11-17) built** (`docs/archive/decisions-2026-11-17-open-questions.md`): college 5-year cover
(reverses M17), set-aside dose starts the clock, MenB 6-month grace lines, MenACWY too-young repeat
8 weeks, military booster check, outbreak wording, MenB switch line. **D9 (no college repeat; no code) and D10
(serogroup B outbreak: one MenB booster) answered 2026-11-17; D10 built.** **B-1 built 2026-11-17** (the 4-day grace at the MenACWY
3-month, 7-month, 2-year and 16-year lines, only when it means fewer doses owed, from the dose day
on; age 7 is not a grace line — owner D11–D13). **Phase 4 (one label per dose) built 2026-11-17**: STOP E1
answers Q5–Q11 in `docs/archive/decisions-2026-11-17-open-questions.md`; the closed label list is in
`docs/agent/clinical-rules.md` ("One Label Per Dose"). **Phase 5 STOP F1 answered 2026-11-17** (routine date with the minimum beside it, at MenB high-risk dose 2 and infant MenACWY doses 2–3; built, #101). **Its two consequences F2a/F2b answered and built 2026-11-18** (combined shot offered while MenB dose 2 can be given; switch line says "due"). **F-2, F-4, F-6 built (#105); A17 closed 2026-11-18: Phase 5 finished.** **STOP G1 answered 2026-11-18** (`docs/archive/stop-g1-packet-2026-11-18.md`). **Phase 6.2 F-3 built 2026-11-18** (badge says "Up to date" only when nothing is left). **F-5 built 2026-11-18** (one label, "Booster (16y)", for the routine 16-year booster). **R-A–R-C built 2026-11-18** (an undated "repeat" line says when). **G1-b built 2026-11-18** (each recorded dose has its own "Why this"). **G1-a built 2026-11-19** (every dose line, card lead and "Why this" follows the ten style rules; guard `regression-2026-11-19-g1a-style-rules.test.js`; its findings F1–F3 answered and built the same day). **Phase 6.3 Q10 built 2026-11-19** (owner: "Full PneumoVax fold"; a card line that repeats its heading moves behind "Why this", only the owner's list stays in view, `src/logic/noteFold.js`; sources inside "Why this"; disclaimer's risk-history half behind a click). **STOP G2 done 2026-11-19** (#113, #114 merged). **W1–W4 built 2026-11-19** (`docs/archive/decisions-2026-11-19-after-the-fold.md`: 16y booster badge "Booster due today"; "before 16 years"; 13–15 booster line "at age 16–18" citing CDC; healthy MenB "Why this" repeat dropped). **Phase 7.1 (dose rules) and 7.3 built 2026-11-19**: the rulebook is `docs/agent/meningococcal-rules-summary.md` (owner: grow the summary, no CLINICAL_SPEC.md); its section 5 is the rule table written from `DOSE_RULES` by `npm run rulebook`, held cell by cell; vaxapp sync dropped. **Rest of 7.1 answered and built 2026-11-19** (owner: "Link to source list"; every card rule in §§1–3 carries a SOURCES tag, `npm run rulebook` copies the quote/link/date from `refs.js`; **18 of the 20 "todo" rules read live and sourced 2026-11-19**. **T1 answered and built 2026-11-19** (`docs/archive/decisions-2026-11-19-t1-t2-todo-rules.md`: a high-risk infant whose dose 2 comes at 7 months or older finishes in 3 doses, 2-month starts included, as CDSI has it). **T2 answered and built 2026-11-19** (unknown completion age kept as a safety net; a sweep shows no patient reaches it). Every card rule in the rulebook now names its source (0 "todo"). **Q11 built 2026-11-19: the in-app Rulebook screen**, like PneumoVax's (a "Patient | Rulebook" switch in the header;
`src/data/rulebookPage.js` says it, `Rulebook.jsx` draws it; 69 worked patients held to the engine by
`regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx`). **Review v10 answered 2026-11-20 ("Approve them all"; rule 4 kept)**: Batches 1–4 built (PR #124, merged); Batch 5 built 2026-11-20 (Rulebook R wording and the D1 redesign: seven steps and Quick look in view, parts 1–8 behind "Full rulebook", owner's placement answer); **M1 built** (#126, merged: a high-risk MenB dose 3 too early is not counted and is repeated). **Rulebook reorganization built 2026-11-20** (decisions items 1–10 in `docs/archive/decisions-2026-11-20-rulebook-reorg.md`; all folds start closed; Minimum interval column grey). **STOP H done 2026-11-21** (owner walked through all five parts and approved them; document fixes only, 0 answers moved; `docs/archive/decisions-2026-11-21-stop-h-rulebook-review.md`). Q5 closed: "Not counted — do not repeat" stays red. **Phase 8 (citations) started 2026-11-21**: Q12 answered ("same as PneumoVax": decide alone when the dose is unchanged; escalate no-row, different doses, verdict moves); C2/C3 built (numbered source buttons from one computation, `cardSources()` in `RecCard.jsx`, numbered in the order the card is read); measurements in `docs/archive/report-2026-11-21-phase8-citations-measured.md`. What is left is in the newest handoff. Open owner questions are
in the newest handoff.
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

A D3 given earlier than 4 months after D2 does NOT count and is repeated ≥4 months after it —
UNLESS D3 was ≥6 months after D1 (ACIP mm7349a3's "unless", owner C6; CDSI's allowable
interval). Owner M1 (2026-11-20, "follow CDSI") reversed the old "counts, and a 4th dose is
owed"; there is no 4-dose high-risk series. The repeat counts only ≥4 months after the dose
that did not count (M1c); the 6-months-from-D1 "unless" decides only the FIRST D3, never the
repeat (owner M1d, 2026-11-21, ACIP's sentence over CDSI's allowable interval). The card advises the latest of
the three lines with the earliest valid date beside it (M1b). The 4-month line takes the
4-day grace (owner C7), as do the healthy MenB 6-month rescue line (C7) and both high-risk
6-month lines — the "unless" (D3) and "dose 2 ≥6 months, no dose 3" (D4, 2026-11-17). Both decisions live in ONE
function each in `seriesTotals.js` (`menbHighRiskDose3Early`, `menbHealthyDose2Early`); never
re-derive them. Series length comes from `menbSeriesInfo()` — never hand-type 3.

### Pentavalent — Dedicated Card Only
Penbraya/Penmenvy surface ONLY through the pentavalent card, never in the standalone MenB brand list. Eligible only when MenACWY is due today, MenB is due today or can be given today (MenB high-risk dose 2 past its 4-week minimum, owner F2a 2026-11-18), AND age ≥10y.

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

### What the PneumoVax Port Made Permanent (Phase 7.3, 2026-11-19)
- **One rule table.** Every rule that judges a recorded dose is one row of `DOSE_RULES` in
  `doseRules.js`, with its five answers and `sourcesSay` (the quoted sentences and a verdict).
  A new rule is a new row, never a branch somewhere else.
- **A moved answer must be explained.** When `sweep-saved-answers.test.js` fails on purpose, run
  `npm run sweep:update` and put the number of moved answers and the reason in the PR. If you
  cannot say why those patients should get a different answer, it is a bug. Wording changes are
  counted with `npm run prose` (`docs/agent/testing.md`).
- **One label per dose, from a closed list** (`doseChipLabel.js`; list in
  `docs/agent/clinical-rules.md`, "One Label Per Dose"). A new label is an owner question.
- **The rulebook is held to the code.** `docs/agent/meningococcal-rules-summary.md` is the
  rulebook (owner 2026-11-19). Its section 5 is written by `npm run rulebook` and never by hand;
  `rulebook-table-matches-code.test.js` fails if one cell differs from `DOSE_RULES`. After
  changing a row or a quoted sentence in `refs.js`, run it and commit the diff with the change.

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
