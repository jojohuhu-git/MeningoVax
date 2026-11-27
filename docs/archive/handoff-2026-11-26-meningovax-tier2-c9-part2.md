# MeningoVax — Handoff after building Tier 2 item C9 parts 1 and 2 (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-tier2-c9-part1.md`.

- **#155** (C9 part 1) was **merged** into `main` on 2026-11-26 (`208eccd`).
- **#156** `tier2/c9-acip-copies` (C9 part 2) is **open** against `main`; the owner merges (squash).
  `main` was merged into it after #155 landed (a force-push was refused), so its diff holds only
  part 2 and this handoff.

Baseline on `main` before #155 was **2,628 passing (227 files)**. On `tier2/c9-acip-copies`: **2,675 passing,
0 failing (229 files)**, run this session.

## What's done

1. **C9 part 1** (`7ff5360`, #155): 14 CDC schedule-notes quotes open their closed section
   (`section` in `refs.js`). 0 answers or wording moved. Guard
   `regression-2026-11-26-c9-cdc-notes-links-open-their-section`.
2. **C9 part 2, the fixable part** (`d55f9b0`, #156): six ACIP 2020 entries carry a `prefix`
   (`#:~:text=prefix-,sentence`), each tested live, so the link lands in the patient's own table.
   `boosterFrom10` was split into Table 4's copy and a new `boosterFrom10Asplenia` (Table 5;
   `BOOSTER_FROM_10_KEYS` in `refs.js`, used by `recommend.js`). 8,245 cards fixed; 0 answers or
   wording moved. Guard `regression-2026-11-26-c9-acip-link-lands-in-the-patients-table`. Report:
   `report-2026-11-26-c9-part2-acip-copies.md`.
   - Live finding: a prefix cannot cross a line break in a table cell or footnote. The page then
     stays at the top. Use only same-line prefixes, and test each one live.

## What's NOT done — the remaining queue

- **Owner question (open, asked 2026-11-26): 2,886 cards no prefix can reach.** These are HIV and
  travel booster lines (Tables 6 and 9 bulleted rows) and the infant rows. Options: (A) the number
  opens the patient's own table at its title, with no highlight, like part 1 and the grey ACIP
  button; (B) keep highlighting the words in Table 4. Recommended A. Ask, don't default. If A, the
  table-title link text already exists as the C10 whole-table citations (`acip2020Table9…` etc.).
- **C12 (not started):** a number's hover shows the quote. It already does (`title`). Measure what
  is left against PneumoVax's pop-up (#114, #141) before building.
- **C11 (not started):** each number sits on the exact claim its document states.
- **Tier 3 (not started):** em dashes in card texts (owner banned them, D7; ask first). Both age-10
  MenACWY leads in `recommend.js` use " — ". **Seen, not checked:** the combined shot offered to a
  pregnant patient with asplenia or complement; 201 grid cards for microbiologists under 7 citing
  `boosterBeforeAge7` (probably a grid artefact). **For the owner:** the serogroup B outbreak
  "Complete" card's lead says "Public health may advise it from 6 months". **Last:** Phase 9 close.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)

## Why this is a good stopping point

Both C9 parts are in PRs with 0 answers moved. The remainder is one owner question, and nothing
else depends on it.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git status`.
2. If #156 is merged: `git checkout main && git pull`, run `npx vitest run`, and confirm
   **2,675 passing (229 files)**.
3. Start `MeningoVax dev server` (`.claude/launch.json`) and check usage (`get_usage`). Extra usage
   was at $38.16 of the $50 cap at the start of 2026-11-26.
4. Per item: failing test → fix → full suite → live check (CDC/ACIP links: full page load, pane
   visible, read `scrollY` against each copy's position) → commit named by ID. Put
   `npm run sweep:update` and `npm run prose -- dump/diff` counts in the PR. A new test file means
   updating `docs/agent/testing.md` ("Measured counts" and the tripwire list).
5. Open each PR against `main`. The owner merges.
