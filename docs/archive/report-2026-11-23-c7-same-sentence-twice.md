# C7 — never the same sentence twice (2026-11-23)

Port Phase 8, Tier 2. PneumoVax's rule (FINDING N, 2026-10-23; its C9-2 note): one entry per
sentence a document states; two entries only where the document words them differently.

## What was measured (every saved patient, 45,072 cards)

| Check | Result |
|---|---|
| A card shows the same quoted words under two different entries | **0 cards** |
| One sentence on a card carries two markers for the same quote | **0 sentences** |
| Entries in `refs.js` that quote the same words | **2 groups** (below) |

## The two groups in `refs.js`

1. **ACIP 2020 Table 2, "Although routine vaccination is only recommended for adolescents aged
   11–18 yrs, …"** — stored twice (`acip2020Table2CatchupOnly1921`, and
   `acip2020Table2RoutineOnly11to18`, added by C13 earlier the same day). Same table, same row,
   same patients: a true duplicate. **Merged** into `acip2020Table2CatchupOnly1921`; its label now
   names the row ("Table 2 (11–23 yrs)") and its date is the live read of 2026-11-23. The healthy
   22–23-year-old's "not routinely recommended" card quotes the same words as before.
2. **"Single dose at 5 yrs after primary vaccination and every 5 yrs thereafter"** — ACIP prints
   these words in three tables: Tables 4 and 5 (complement, asplenia; 10 years or older), Table 7
   (microbiologists) and Table 9 (travelers). **Kept as three entries on purpose**: each names its
   own table and patient group (C5), and C10 ties each to its own table. No card shows two of
   them. (Citation-only call, Q12.)

## Not changed — for the owner to see

"One source per claim": 16 kinds of card sentence carry two markers, each from a different
source or a different sentence. All come from earlier decisions, so none was touched:

- CDC complement page beside ACIP on complement booster lines (owner, C4 document 3).
- CDC recommendations page beside ACIP Table 8 on the serogroup B outbreak booster (C4 document 4).
- CDC Adult Notes beside ACIP 2020 on a pregnant patient's MenB card (C4 document 5).
- Both MenB product schedules on a card with no product chosen yet (item 7). These two
  sentences come from the same report (ACIP's 2024 MenB report), so the sentence shows the same
  number twice, e.g. "[2][2]". Each number opens its own sentence. That matches the owner's
  2026-07-24 rule (the number names the document; each marker links its own sentence).
- MenB licensed from age 10: ACIP 2024 beside the Penmenvy report.

## Outcome

0 answers moved; 0 of 31,160 saved patients read different wording (`npm run prose`).
Guard: `regression-2026-11-23-c7-never-the-same-sentence-twice.test.js`. Checked in the app: a
healthy 22-year-old's MenACWY card shows "[1]" with the Table 2 sentence.
