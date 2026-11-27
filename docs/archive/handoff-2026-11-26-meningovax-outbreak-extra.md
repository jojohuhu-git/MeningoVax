# MeningoVax — Handoff after the outbreak extra-dose answers (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-tier2-c11.md`.

**Merging (owner, 2026-11-26): Claude merges the PRs** (squash) after the `test` check passes and
resolves the conflicts between them. Keep a session's handoff on its work branch.

**Asking (learned 2026-11-26):** the owner did not follow two question dialogs about a label
consequence; what worked was two screenshots side by side (same patient, one box different) and a
one-line question. For a label/chip question, show the screens first.

## What's done this session

1. #157 (C9 part 3) and #158 (C12) merged; #159 (C11) built and merged. Phase 8 C1–C13 all built.
2. **OUTBREAK-EXTRA** (branch `fix/outbreak-extra-dose`, its PR). Owner "Extra, as Q8" and
   "Extra like A" (`decisions-2026-11-26-outbreak-extra-dose.md`): a MenB dose after a serogroup B
   outbreak's one booster reads "Not counted — Extra. Do not repeat. / The series was already
   complete on that day."; the Q8 college exception is MenACWY's only. **133 of 23,788 saved
   patients moved** (12 outbreak; 121 healthy 50-year-old dorm residents' MenB doses now Extra, as
   for non-dorm adults); 125 read different words. Full suite **2,717 passing, 0 failing (233
   files)**. Live-checked the dorm + outbreak patient.

## What's NOT done — the remaining queue

- **Seen during C12:** the 740 serogroup B outbreak numbers (`acip2020Table8`) have no quote; a
  quote needs a live read of ACIP Table 8 (citation-only under Q12 if the dose is unchanged).
- **Seen, not checked:** MenB dose 2's "Earliest valid date: … (minimum interval 4 weeks)" and the
  complement infant's "Early doses are ≥8 weeks apart" carry no source number.
- **Tier 3 (not started):** em dashes in card texts (owner banned them, D7; ask first). Both
  age-10 MenACWY leads in `recommend.js` use " — ". **Seen, not checked:** the combined shot
  offered to a pregnant patient with asplenia or complement. **For the owner:** the serogroup B
  outbreak "Complete" card's lead says "Public health may advise it from 6 months". **Last:**
  Phase 9 close.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`.
2. Run `npx vitest run`; expect **2,717 passing (233 files)** unless `main` moved. Re-measure.
3. Start `MeningoVax dev server` (`.claude/launch.json`); check usage (`get_usage`).
4. Next: Tier 3, em dashes first (ask the owner with a before/after). Per item: failing test →
   fix → full suite → live check → commit named by ID; `npm run sweep:update` and `npm run prose --
   dump/diff` counts in the PR; a new test file updates `docs/agent/testing.md`.
5. Open the PR against `main`; Claude merges it after the check passes.
