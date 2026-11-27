# MeningoVax — Handoff after building Tier 2 item C9 part 3 (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-tier2-c9-part2.md`.

- #155 (C9 part 1) and #156 (C9 part 2) are **merged** into `main` (`5d878db`).
- **#157** `tier2/c9-part3-range-links` (C9 part 3) is **open** against `main`, pushed; the owner
  merges (squash). Commit `e9badff`, plus this handoff.

Baseline on `main` at `5d878db`: **2,675 passing (229 files)**, run this session. On
`tier2/c9-part3-range-links`: **2,686 passing, 0 failing (230 files)**, run this session.

## What's done

1. **C9 part 3** (`e9badff`, #157). Owner answer 2026-11-26, **"C: highlight in own table"**
   (`decisions-2026-11-26-c9-part3-range-links.md`). The ACIP sentences no prefix could reach
   (HIV/travel booster lines, the infant rows) now link as a **range**, `#:~:text=start,sentence`,
   from the patient's own table's booster heading (or title) down to the sentence. A range may
   cross line breaks; a prefix may not.
   - `refs.js`: six live-read starts; `copies` lists (`ACWY_BOOSTER_COPIES`, `ACWY_INFANT_COPIES`)
     on `boosterBeforeAge7`, `boosterAtOrAfterAge7`, `acwyInfantHighRisk2to6mo`,
     `acwyInfantHighRisk7to23mo`; `acip2020Table9TravelBooster` gets `rangeStart` and
     `population: ['acwy-travel']`. `cite(key, { riskIds })` picks the copy.
   - `recommend.js`: passes `{ riskIds }` at every place those five entries are cited.
   - 2,727 cards now open the patient's own table; 0 answers moved (sweep 0 of 7,372); 0 of
     31,160 patients read different wording. Live-checked Tables 5, 6, 8, 9, and in the running
     app (worked HIV patient's [1]). Report: `report-2026-11-26-c9-part3-range-links.md`.
     Guard: `regression-2026-11-26-c9-part3-range-link-opens-the-patients-table`.
   - **C9 is now finished** (parts 1–3).
2. **Closed in passing:** the part 2 report's "201 microbiologists under 7 citing
   `boosterBeforeAge7`" does not reproduce: today's saved-answer grid has 0 such cards. Noted in
   the part 3 report; not chased further.

## What's NOT done — the remaining queue

- **C12 (not started):** a number's hover shows the quote. It already does (`title`). Measure what
  is left against PneumoVax's pop-up (#114, #141) before building.
- **C11 (not started):** each number sits on the exact claim its document states.
- **Tier 3 (not started):** em dashes in card texts (owner banned them, D7; ask first). Both age-10
  MenACWY leads in `recommend.js` use " — ". **Seen, not checked:** the combined shot offered to a
  pregnant patient with asplenia or complement. **For the owner:** the serogroup B outbreak
  "Complete" card's lead says "Public health may advise it from 6 months". **Last:** Phase 9 close.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)

## Why this is a good stopping point

C9 is complete as a unit and in a PR with 0 answers or wording moved. C12 and C11 are independent
of it and of each other; nothing waits on #157 except its merge.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git status`.
2. If #157 is merged: `git checkout main && git pull`, run `npx vitest run`, and confirm
   **2,686 passing (230 files)**.
3. Start `MeningoVax dev server` (`.claude/launch.json`) and check usage (`get_usage`). Extra usage
   was at $38.16 of the $50 cap on 2026-11-26.
4. Next item: C12 (measure first). Per item: failing test → fix → full suite → live check
   (ACIP/CDC links: full page load, compare `scrollY` with each table caption's position) →
   commit named by ID. Put `npm run sweep:update` and `npm run prose -- dump/diff` counts in the
   PR. A new test file means updating `docs/agent/testing.md` ("Measured counts" and the
   tripwire list).
5. Open each PR against `main`. The owner merges.
