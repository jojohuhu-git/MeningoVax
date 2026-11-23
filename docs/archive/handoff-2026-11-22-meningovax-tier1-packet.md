> **SUPERSEDED 2026-11-23** by `handoff-2026-11-23-meningovax-tier1-built.md` (Q1–Q5 answered and built, PR #151). Do not resume from this file.

# MeningoVax — Handoff after the Tier 1 question packet (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-22-meningovax-c5-quote-population.md`.

## State

- **#149 merged** (squash, `92b00b0`). **PR #150** (C5) had conflicts after that squash. Fixed by
  merging `origin/main` (`9a9c0ad`): each conflict kept #150's side, and the merged tree equals
  #150's tree. Suite **2,579 passing, 0 failing (219 files)**; `test` check passed. Owner merges.
- This handoff and the packet are docs-only commits on the same branch.
- Plan usage when written: weekly 96% (resets 2026-11-26), so more work this week is paid extra
  usage. Ask before starting large work.

## Done this session

1. **Microbiologist under 7 (C5 open item): owner answered "a microbiologist who is 7 years is
   impossible."** I checked it by measurement: every saved patient's future card dates, with doses
   given on the date and 30 days to 2 years early. Only implausible patients (`ageImplausibleRisks`)
   show it. Not built yet: stop pinning it in `OPEN_FOR_THE_OWNER` (C5 guard), e.g. by skipping
   implausible patients there. No answer moves.
2. **Found by the same measurement (realistic):** a high-risk MenB booster given as the 3rd dose,
   after a 2-dose series that is complete (dose 2 ≥6 months after dose 1), is counted at any
   interval. `MENB-HIGHRISK-BOOSTER-GAP` (`doseRules.js:1697`) returns early when
   `ctx.effectiveIdx < 3`. Q1 in the packet.
3. **Tier 1 packet written:** `docs/archive/questions-2026-11-22-tier1-packet.md` (Q1–Q5, one
   patient each, sources quoted, engine output, my answer). New live reads: CDC complement page
   (updated Mar 6, 2026) and ACIP 2020 Table 8's "≥6 mos" clause, both quoted in the packet.

## Next

1. Owner merges #150.
2. Ask Q1–Q5 one box at a time (AskUserQuestion, scenario inside the box). Record the answers in a
   `decisions-` file.
3. Build each answer as its own item (fix-queue): failing test, fix, full suite, live check, PR.
   Q1 and Q5 change verdicts (sweep:update, count moved answers). Q2 is new card wording plus
   placement: show a before/after picture first. Q4 only adds saved patients (measure that 0
   existing lines move).
4. Then the rest of the earlier queue, unchanged: em dashes in three card texts (ask), the rest of
   Phase 8 (C13, C10, C7, C6, C9, C12), then Phase 9. The plan's table C still lists C11 as "Not
   done"; item 7 built part of it. Update the table when Phase 8 closes.

Scratch scripts (not committed, in the session scratchpad): `forecast-vs-check2.mjs` (the
card-date vs check measurement) and `worked.mjs` (the packet's patients). Worth turning the first
into a report-only sweep later.
