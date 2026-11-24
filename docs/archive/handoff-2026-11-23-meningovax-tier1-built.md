> **SUPERSEDED 2026-11-23** by `handoff-2026-11-23-meningovax-tier2-c13-c10.md` (Tier 1 merged #151, live-checked; C13 merged #152; C13 part 2 and C10 built). Do not resume from this file.

# MeningoVax — Handoff after building Tier 1 Q1–Q5 (2026-11-23)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-22-meningovax-tier1-packet.md`.

Branch: `tier1/q1-q5`, off `main` at `8d04e67` (#150 merged). **Pushed; PR #151 open**
(https://github.com/jojohuhu-git/MeningoVax/pull/151), against main. The owner merges.
Baseline was 2,579 passing (219 files); now **2,601 passing, 0 failing (222 files)**. The handoff
commit follows `10fd79f`.

## What's done (owner answers in `decisions-2026-11-22-tier1-q1-q5.md`)

0. **Packet carried over:** `84dbef5` (the Tier 1 packet and the old handoff were not on main).
1. **Q1, "Not counted, repeat"** (`9410b07`): `MENB-HIGHRISK-BOOSTER-GAP` (`doseRules.js`) now also
   judges a first booster that is the 3rd dose, after a 2-dose series. Never-events 9a narrowed and
   9c added. P0-4 fixture moved. Saved answers moved: 0.
2. **Q5, "Count from 6 months"** (`35c128c`): a serogroup-B-outbreak-only first booster counts from
   6 months (`MENB_OUTBREAK_B_BOOSTER_MIN_MONTHS`, calendar, 4-day grace). The card adds "Public
   health may advise it from 6 months after the series", citing new ref
   `acip2020Table8MenbOutbreakBoosterSixMonths` (Table 8's whole cell, read live 2026-11-22). The
   "Complete" card adds the line only when the booster came before 1 year. 0 saved answers moved;
   prose 200 of 24,600 changed (184 gain the line; 16 under-6-month boosters now read "6 required").
   **Q5a** (2026-11-23): stays behind "Why this", no change. **Q5b** (2026-11-23, "Add it to both
   cells"): built in `10fd79f`.
3. **Q4, "Add all four"** (`c17cb18`): four pregnancy pairs added to `SAVED_ANSWER_RISK_PROFILES`
   (`src/test-grid.js`): +5,008 / +1,552 lines, 0 changed. Also the C5 guard's microbiologist-
   before-7 list was renamed `IMPOSSIBLE_PER_OWNER` (owner: "a microbiologist who is 7 years is
   impossible"), with a third row (pregnancy + microbiologist, 67).
4. **Q2, "Add the note"; placement "put alert in the same place as CAR-T hard stop"** (`10fd79f`):
   engine field `complementAlert` (recommend.js). `ComplementAlert` (RecCard.jsx) is drawn first in
   `Results.jsx`, styled `.advisory-banner-caution` (amber). Three new refs: `cdcComplement*`
   (CDC page dated Mar 6, 2026, read live 2026-11-22 and -23). Guard:
   `regression-2026-11-23-q2-complement-inhibitor-alert.test.jsx`.
5. **Q3, "Keep ACIP 4-month rule":** no change.
6. **Packet correction:** its "public health officials" ACIP body sentence was not found on a live
   re-read; Q5 cites Table 8 only (recorded in the decisions file).

## What's NOT done

- **Live check in the running app: not done** for Q1, Q2, Q5 and Q5b. All 5 dev-server slots were
  held by other chats, and the owner chose "Skip the live check". Do it first next session: start
  `MeningoVax dev server` and look at (a) a 30-year-old with complement checked (the amber alert at
  the top, cites [1][1][1], cards below), (b) asplenia with Bexsero Aug 1 2025, Feb 1 2026, Mar 1 2026
  ("Not counted — repeat"), (c) a serogroup B outbreak with Trumenba Jul 15 2025, Aug 15 2025,
  Jan 15 2026 and a booster Sep 15 2026 ("Complete", the line behind "Why this"), (d) the Rulebook's
  two MenB booster cells. Check mobile width for the alert.
- **Seen, not checked (possible owner question):** the saved answers show the combined shot
  (Penbraya/Penmenvy) offered to a pregnant patient who also has asplenia or complement, because
  MenB is given then. I did not read any source on pentavalents in pregnancy. Read it live before
  asking.
- **Earlier queue, unchanged:** em dashes in three card texts (ask); the rest of Phase 8 (C13, C10,
  C7, C6, C9, C12); then Phase 9. The plan's table C still lists C11 as "Not done" (item 7 built
  part of it). Update the table when Phase 8 closes. See `plan-2026-11-08-meningovax-port.md`.
- PneumoVax parity: none needed (MenB/complement only; the new banner style is a variant, not a
  design-system token change).

## Why this is a good stopping point

Every Tier 1 answer is built, tested and in one PR, with one commit per item. Nothing on the
branch depends on unanswered questions. What remains is the visual check and the older queue.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main`. If #151 is merged: `git checkout main && git pull`.
   Otherwise `git checkout tier1/q1-q5`.
2. Run the suite and confirm **2,601 passing** (or the merged total) before new work.
3. Start the dev server and do the live check above; screenshot the proof for the owner.
4. Ask the owner which queue comes next (em dashes, Phase 8 items, or the pentavalent-in-pregnancy
   read). Ask; don't default.
5. Per item: fix-queue (failing test → fix → suite → live check → commit named by ID). Run
   `npm run sweep:update` and `npm run prose` and report the counts. Open each PR against `main`
   (stacked PRs have merged into each other before).
