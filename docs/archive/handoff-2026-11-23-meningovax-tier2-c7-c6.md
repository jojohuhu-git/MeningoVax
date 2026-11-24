> **SUPERSEDED 2026-11-23** by `handoff-2026-11-23-meningovax-tier2-c9-measured.md`. C9 has been measured since; resume from that file.

# MeningoVax — Handoff after Tier 2 items C7 and C6 (2026-11-23)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-23-meningovax-tier2-c13-c10.md`.

**Why this session stopped:** the owner's weekly plan limit is at 100% and the session ran on
extra usage ($33.47 of the $50 monthly cap when C6 shipped). The owner asked to stop before
credits run low. Check usage (`get_usage`) before starting C9; it is a bigger item.

Branch: `tier2/c6-cdc-first`, off `main` at `361ef1e` (#153 merged, holding C13 part 2, C10 and
C7). Pushed; **PR #154** against `main` (https://github.com/jojohuhu-git/MeningoVax/pull/154),
mergeable; the owner merges. Now **2,628 passing, 0 failing (227 files)** at `b419b27`, run after
rebasing onto `main`. Working tree clean.

## What's done

1. **C7, never the same sentence twice — merged in #153 (`5516431` before squash).** Measured
   over 45,072 saved cards: 0 show the same quoted words under two entries, and 0 sentences carry
   two markers for one quote. One true duplicate in `refs.js` (the ACIP Table 2 "Although routine
   vaccination is only recommended…" sentence, stored twice by C13) was merged into
   `acip2020Table2CatchupOnly1921`. The booster cell "Single dose at 5 yrs after primary
   vaccination…" in Tables 4/5, 7 and 9 was kept as three entries on purpose (three tables, three
   groups). 0 answers, 0 wording moved. Guard `regression-2026-11-23-c7-never-the-same-sentence-twice`;
   `report-2026-11-23-c7-same-sentence-twice.md` (it also lists for the owner the 16 kinds of
   two-marker sentences, all from earlier decisions).
2. **C6, cite CDC first — PR #154 (`b419b27`).** The only immunize.org source left (the age-10
   MenACWY answer, 658 cards) now quotes ACIP 2020, read live: "Children who received MenACWY at
   age 10 years do not need an additional dose at age 11–12 years". **Owner 2026-11-23: "Cite CDC
   only."** New `acip2020Age10NoAdditionalDose`; `acwyAge10CountsAsDose1` and `immMenACWY` removed;
   the Rulebook screen's Sources list no longer draws an empty "immunize.org" heading. 0 answers
   moved; wording 721 of 31,160 patients (658 real, 63 impossible entries), hover text only. Now 0
   cards cite immunize.org. Checked in the app. Guard `regression-2026-11-23-c6-cite-cdc-first`;
   `decisions-2026-11-23-c6-cite-cdc-first.md`.

## What's NOT done — the remaining queue

**Tier 2 (Phase 8), owner's order; rows in `plan-2026-11-08-meningovax-port.md`, table C:**
- **C9**: a CDC link opens the closed section holding the quote. Known from the last handoff:
  (a) a card's whole-table link REPLACES its sentence link (`cardSources()` in `RecCard.jsx`), so
  the ACIP button opens the table caption, not the quoted sentence; (b) words printed in several
  rows highlight the first copy (e.g. the Tables 4/5, 7, 9 booster cell C7 kept, and "Not routinely
  recommended See Table 3…" first appears in Table 2's 2 mos–10 yrs row). Measure first. A link
  change that takes a button off a card is an owner stop.
- **C12**: hovering a number shows the quote. C1 already names the document, and the hover title
  already holds the quote (seen live this session: `title` = "ACIP 2020 MMWR\n“…”"). Measure what
  is left against PneumoVax's pop-up (PRs #114, #141) before building.
- **C11** (not in the owner's Tier 2 list, still "Not done" in the plan): each number sits on the
  exact claim its document states.

**Tier 3:** em dashes in card texts (owner banned them, D7; ask before changing). Seen this
session: both age-10 MenACWY card leads in `recommend.js` (~lines 1547 and 1614) use " — ".
**Seen, not checked:** combined shot (Penbraya/Penmenvy) offered to a pregnant patient with
asplenia or complement; read a source on pentavalents in pregnancy live before asking.
**Observation for the owner (no change made):** serogroup B outbreak "Complete" card shows "Public
health may advise it from 6 months" in the lead, not behind "Why this".
**Last:** Phase 9 close.

## Why this is a good stopping point

C7 is merged; C6 is complete, tested, live-checked and in its own mergeable PR. Nothing waits on
an owner answer except the merge. C9 and C12 are independent of #154.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`
   (if #154 is merged; else `git checkout tier2/c6-cdc-first`).
2. Run the suite; confirm **2,628 passing (227 files)** or the merged total. A full run takes about
   3 minutes here. If the file count is one short (iCloud), run the missing file alone.
3. Start `MeningoVax dev server` (`.claude/launch.json`); close stale servers first.
4. Check usage. Next item: **C9**. Measure first with a scratch sweep of saved answers. Decide alone
   when the dose is unchanged (Q12); ask when a button would come off a card.
5. Per item: failing test → fix → full suite → live check → commit named by ID → `npm run
   sweep:update` / `npm run prose` counts in the PR. A new test file means updating the counts in
   `docs/agent/testing.md` ("Measured counts"), or its guard fails. Open each PR against `main`
   (`main` squash-merges: replay onto `main` rather than merging main into an old branch).
