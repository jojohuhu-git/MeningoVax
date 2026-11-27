# MeningoVax — Handoff after the Table 8 quote and the MenB minimum line (2026-11-27)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-27-meningovax-q5c-preg-f2a.md`. vaxapp is **retired** (owner,
2026-11-27): drop every vaxapp item.

Branch `tier3/menb-min-cite` (PR #166), off `main` at `9e70130`, pushed with this handoff.
Claude squash-merges MeningoVax PRs after the `test` check passes (owner, 2026-11-26). Baseline was
**2,739 passing (235 files)**; now **2,749 passing, 0 failing (237 files)**; after INFANT-MIN-CITE **2,761 passing (238 files)** (measured with
`vitest run --reporter=json`).

**Dev server:** 5 Vite servers from other chats already serve this folder (ports 5175–5179), so
`preview_start {name}` refuses a sixth. This session used `http://localhost:5178/MeningoVax/`.

## What's done

1. **PREG-F2A, PR #164:** already merged on arrival (`f166e8b`).
2. **OUTBREAK-T8-QUOTE, PR #165 (merged, `9e70130`):** the 740 unquoted source numbers were all on
   the **serogroup A/C/W/Y** outbreak booster card (earlier handoffs wrongly said serogroup B). Its
   `[c]` cited `acip2020Table8` (whole table, no quote). Now it cites Table 8's own sentence, the
   3-year or 5-year one the card states (`acwyBoosterRowKey`, the dose checker's pick), read live
   2026-11-27 ("Aged <7 yrs: Single dose if ≥3 yrs since vaccination" / "Aged ≥7 yrs: Single dose
   if ≥5 yrs since vaccination"). Unquoted numbers 740 → 0 of 130,642. 0 answers moved; hover text
   on 817 patients (740 real); 0 visible words. Guard
   `regression-2026-11-27-outbreak-acwy-booster-quotes-table-8.test.js`. Checked live.
3. **MENB-MIN-CITE, PR #166 (this branch):** the MenB "minimum beside the routine date" sentence
   gets its number: dose 2 "Earliest valid date: … (minimum interval 4 weeks) [c]" / "It can be
   given today if needed, as the minimum interval of 4 weeks has passed [c]" → ACIP 2020's 4 weeks
   (`acip2020MenbRepeat4Weeks`); a repeated dose 3's "(minimum interval 4 months after the invalid
   dose) [c]" → ACIP Oct 2024 (`menbHighRiskEarlyD3Unless`). `intervals.js minimumBesideRoutine`
   took a `mark` option. C11's control test ("no 4-week number") was written when the sentence had
   no number; it now checks the number sits on the minimum's own sentence. 0 answers moved; 0 of
   31,160 patients' wording (none is seen on these days), so the test uses hand-built patients.
   Checked live (asplenia, 20 y, Bexsero Nov 10, 2026 → "Earliest valid date: Dec 8, 2026
   (minimum interval 4 weeks) [2]").

## What's NOT done: the remaining queue

- **INFANT-MIN-CITE: ANSWERED 2026-11-27 ("CDC Notes sentence") and built the same day (PR after #166, `decisions-2026-11-27-infant-minimum-cite.md`). Kept below for the record.**
  Was: infant MenACWY sentences
  stating 8 weeks carry no number: the dose 2/3 card's "It can be given today if needed, as the
  minimum interval of 8 weeks has passed." / "Earliest valid date: … (minimum interval 8 weeks)."
  (only a series begun at 2 months), and the dose-1 card's "Early doses are ≥8 weeks apart. The
  final dose is at ≥12 months and ≥12 weeks after the one before." (any start at 2–6 months).
  Worked patient: complement deficiency, born Aug 1, 2026, Menveo 2-vial Oct 1 (2 months),
  high-risk then = yes, seen Nov 27 → "Next dose due Dec 1, 2026" and the unnumbered 8-week line.
  Sources read: CDC Child Notes `cdcChildAcwyInfantSeries` ("dose 2 [and dose 3 if applicable] at
  least 8 weeks after previous dose…") and ACIP's footnote `acip2020InfantSeriesStart3to6mo` are
  both written about a **3–6-month** start; CDC's catch-up table (read live today, "Children age 4
  months through 6 years") gives MenACWY dose 1 → 2 "8 weeks", dose 2 → 3 "See Notes". The rule
  row `ACWY-INFANT-SERIES-GAP` already rests every infant's gaps on the first two; C11 cited
  `cdcChildAcwyInfantSeries` on a line that also serves 2-month starts, and kept outbreak infants
  on ACIP's row. Options put: (a) cite CDC Notes' sentence for complement/asplenia/HIV/travel
  infants, as C11 did (recommended); (b) cite CDC's catch-up table, dose 2 only; (c) leave
  unnumbered. Ask; don't default. Outbreak infants follow whatever C11 consistency the owner picks.
- **PneumoVax card sentences:** MeningoVax copy-style rules apply there too; em dashes not
  measured. Measure first (`npm run prose` there), then ask.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)
- **Last:** Phase 9 close.

## Why this is a good stopping point

Both citation fixes the handoff listed are built, measured and checked live; every source number
in the saved grid now opens a quoted sentence. The one piece left (infant 8 weeks) needs an owner
answer because no sentence read so far is about a 2-month start.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`.
2. #166 is merged. If the INFANT-MIN-CITE PR (`tier3/infant-min-cite`) is still open and `test` passed, squash-merge it. Run `npx vitest run`; expect
   **2,761 passing (238 files)** unless `main` moved.
3. Open the app at an already-running server (`lsof -iTCP -sTCP:LISTEN`), e.g. port 5178.
4. Apply the owner's INFANT-MIN-CITE answer if given. Per item: failing test → fix → full suite →
   live check → commit named by ID; `npm run sweep:update` and `npm run prose -- dump/diff` counts
   in the PR; a new test file updates `docs/agent/testing.md`.
5. Open the PR against `main`; Claude merges it after the check passes.
