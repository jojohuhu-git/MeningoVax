# MeningoVax — Handoff after building Tier 2 item C11 (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-after-merges.md`.

**Merging (owner, 2026-11-26): Claude merges the PRs** (squash) after the `test` check passes, and
resolves the conflicts between them (usually the `docs/agent/testing.md` "Measured counts"). Keep a
session's handoff on its work branch so it needs no PR of its own.

## What's done

1. **#157, #158 merged** earlier this session (`55ac8b7`, `f9c6f9f`); deploy succeeded.
2. **C11** (PR #159, branch `tier2/c11-exact-claim`, commit `82e20a2`). Citation only (Q12).
   New tool `scripts/claimMatchesQuote.mjs` measured every number's words against its quote; six
   kinds of card fixed (under-10 "3-dose"; "completes" after a first MenACWY dose at 16+; MenB dose 2
   "(minimum 4 weeks)"; dose 3 "4 months after dose 2"; the 4-day grace, new `gbpGraceFourDays`
   read live today; infant "8 weeks"). **0 answers, 0 sentences moved.** Full suite **2,706
   passing, 0 failing (232 files)**. Live-checked the grace card's pop-up. Report:
   `report-2026-11-26-c11-number-on-its-claim.md`. Guard:
   `regression-2026-11-26-c11-number-sits-on-the-claim-its-quote-states.test.js`.
   **Phase 8's C1–C13 are now all built.**

## What's NOT done — the remaining queue

- **Owner question (new, from C11):** a serogroup B outbreak patient who had the one outbreak
  booster, then another MenB dose: that dose's line says "Booster about 5 months after the last
  booster, 2 years required", citing Table 8 (one booster ≥1 year). No second booster exists for an
  outbreak. Example: 19 y, 3 Bexsero, booster a year later, Penmenvy 5 months after it (saved
  patient `a228|r:outbreak_b|A:Penmenvy@150|B:Bexsero@900,Bexsero@840,Bexsero@720,Bexsero@300`).
  Verdict wording, so ask.
- **Kept on purpose (C11):** healthy 2-dose / accelerated 3-dose MenB "is complete" cite the
  schedule sentence (no source says "complete"); a patient with MenACWY doses before and after 16
  keeps the 11–12 + 16 sentence; an outbreak infant's "8 weeks" keeps ACIP's row.
- **Seen during C12:** the 740 serogroup B outbreak numbers (`acip2020Table8`) have no quote; a
  quote needs a live read of ACIP Table 8 (citation-only under Q12 if the dose is unchanged).
- **Seen, not checked:** MenB dose 2's "Earliest valid date: … (minimum interval 4 weeks)" and the
  complement infant's "Early doses are ≥8 weeks apart" carry no number at all (uncited sentences,
  not C11's wrong-number kind).
- **Tier 3 (not started):** em dashes in card texts (owner banned them, D7; ask first). Both
  age-10 MenACWY leads in `recommend.js` use " — ". **Seen, not checked:** the combined shot
  offered to a pregnant patient with asplenia or complement. **For the owner:** the serogroup B
  outbreak "Complete" card's lead says "Public health may advise it from 6 months". **Last:**
  Phase 9 close.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`.
2. Confirm #159 merged; run `npx vitest run`; expect **2,706 passing (232 files)** unless `main`
   moved. Re-measure; never trust this number over the output.
3. Start `MeningoVax dev server` (`.claude/launch.json`); check usage (`get_usage`).
4. Ask the owner the outbreak "2 years required" question, then Tier 3 (em dashes first: ask).
   Per item: failing test → fix → full suite → live check → commit named by ID; `npm run
   sweep:update` and `npm run prose -- dump/diff` counts in the PR; a new test file updates
   `docs/agent/testing.md`. A new or moved control: draw a before/after and ask first.
5. Open the PR against `main`; Claude merges it after the check passes.
