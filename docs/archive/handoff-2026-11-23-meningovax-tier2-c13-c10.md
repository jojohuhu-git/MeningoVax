# MeningoVax — Handoff after Tier 2 items C13 and C10 (2026-11-23)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-23-meningovax-tier1-built.md`.

Branch: `tier2/c13b-c10`, off `main` at `6d3abcc` (#152 merged). Pushed; **PR #153** against `main`
(https://github.com/jojohuhu-git/MeningoVax/pull/153); the owner merges. Baseline was 2,601 passing (222 files); now **2,621 passing,
0 failing (225 files)**.

"Tier 2" is the citation queue the owner prioritized on 2026-11-22 (session "Meningovax work
prioritization"): C13 → C10 → C7 → C6 → C9/C12, one PR per item, a stop for the owner whenever a
button would come off a card. Item rows: `plan-2026-11-08-meningovax-port.md`, table C.

## What's done

0. **Tier 1 live check** (left over from last session): all four patients checked in the running
   app (complement alert at top and on a phone; asplenia early dose 3 "Not counted — repeat";
   serogroup B outbreak booster counts with the 6-month line; both Rulebook cells).
1. **C13, age band — PR #152, merged (`6d3abcc`).** Owner 2026-11-23: "Drop the under-7 clause"
   (from 7 the high-risk booster line is "Boosters: 5 years after the series [c], then every 5
   years while at risk") and "Say '10 years or older'" (complement/asplenia series ended at 10+).
   New quote `boosterFrom10` (ACIP Tables 4/5 "≥10 yrs" row); every MenACWY high-risk booster
   quote follows the age the series ended at. 0 answers moved; wording 6,500 of 31,160 saved
   patients (hover text included). `decisions-2026-11-23-c13-booster-quote-age-band.md`.
2. **C13, opposite-of-card half (`d69964e`, this PR).** 54 no-dose card/quote pairs read; one
   offered a dose: the healthy-adult 22+ MenACWY card quoted the 19–21 catch-up sentence (1,184
   patients). Now ACIP Table 2's own row (24+: "Not routinely recommended …"; 22–23: the 11–23
   row's "routine vaccination is only recommended for adolescents aged 11–18 yrs …"). Citation
   only (Q12). Guard `regression-2026-11-23-c13-adult-no-dose-card-quotes-its-own-row`.
3. **C10 (`1516f07`, this PR).** Guard only, 0 cards changed. A card's whole-table link becomes its
   ACIP 2020 button's link, so the table must have a row for the patient's age. Rows read live.
   Every realistic patient fits; only Tables 7/10 ("≥10 yrs" only) for implausible under-10
   microbiologists/military recruits misfit, pinned under owner E1. Guard
   `regression-2026-11-23-c10-table-link-has-a-row-that-fits`.

## What's NOT done — the remaining queue

**Tier 2 (Phase 8), in the owner's order:**
- **C7** — one source per claim, one number per sentence a document states; never the same
  sentence twice. Known instance: `acip2020Table7MicrobiologistBooster`,
  `acip2020Table9TravelBooster` and `boosterFrom10` quote the same words.
- **C6** — cite CDC first, immunize.org only where CDC is silent.
- **C9** — a CDC link opens the closed section holding the quote. Found this session, for C9:
  (a) a card's whole-table link REPLACES its sentence link (`cardSources()` in `RecCard.jsx`), so
  the ACIP button opens the table caption, not the quoted sentence; (b) words printed in several
  rows highlight the first copy (e.g. "Not routinely recommended See Table 3…" first appears in
  Table 2's 2 mos–10 yrs row, not the ≥24 row).
- **C12** — hovering a number shows the quote (C1 shows the document name); measure first.

**Tier 3:** em dashes in three card texts (owner banned them, D7; ask before changing).
**Seen, not checked:** combined shot (Penbraya/Penmenvy) offered to a pregnant patient with
asplenia or complement; read a source on pentavalents in pregnancy live before asking.
**Observation for the owner (no change made):** on a serogroup B outbreak "Complete" card the
"Public health may advise it from 6 months" line is in the lead (visible once the folded card is
opened), not behind "Why this" as Q5a's question described.
**Last:** Phase 9 close.

## Why this is a good stopping point

C13 (both halves) and C10 are complete, tested and live-checked; the PR holds only them. Nothing
on the branch waits on an owner answer. C7 onward is independent.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`
   (if this PR is merged; else `git checkout tier2/c13b-c10`).
2. Run the suite; confirm **2,621 passing** (or the merged total). The suite takes ~15 minutes
   here. Once this session a test file was skipped mid-run (iCloud): if the file count is one
   short, run the missing file alone before trusting the total.
3. Start `MeningoVax dev server` (`.claude/launch.json`). Close stale dev servers first (five were
   left running last time).
4. Next item: **C7**. Measure first (a scratch sweep of saved answers listing each card's quotes);
   decide alone when the dose is unchanged (Q12); ask when a button would come off a card.
5. Per item: failing test → fix → full suite → live check → commit named by ID → `npm run
   sweep:update` / `npm run prose` counts in the PR. Open each PR against `main` (stacked PRs have
   merged into each other before; `main` squash-merges, so replay commits onto `main` rather
   than merging main into an old branch).
