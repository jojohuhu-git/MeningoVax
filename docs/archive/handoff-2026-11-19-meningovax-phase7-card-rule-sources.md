# MeningoVax port — Handoff after Phase 7.1 (card-rule sources) (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md`. **Supersedes**
`handoff-2026-11-19-meningovax-phase7-rulebook-table.md`.

## State (verified 2026-11-19)

- `main` at `81dadf9` (#116, Phase 7.1 dose rules + 7.3, MERGED).
- Branch `port/phase7-card-rule-sources`, off `main`, pushed, PR open against `main` (number in
  the PR list; this handoff is in it).
- **2,226 passed, 0 failing, 177 files** (baseline on `main` 2,221 / 177; +5 tests in
  `rulebook-table-matches-code.test.js`).
- MeningoVax has no CI; the owner merges. "Merged" = PR shows MERGED and
  `git diff origin/main <branch>` is empty.
- Dev server: five leftover servers (ports 5175–5179) hold the 5-per-folder limit, so
  `preview_start {name}` refuses; `preview_start {url: "http://localhost:5175/MeningoVax/"}` works.
  This PR changes no screen (`rulebook.js` is not imported by the app), so nothing was live-checked.

## Owner answers this session (2026-11-19)

1. **Rest of 7.1: "Link to source list"** (not hand-typed quotes, not a card-rule row table).
2. **Q11: "Yes, like PneumoVax"**: an in-app Rulebook screen with a Patient | Rulebook switch,
   built after 7.1 so it shows the quoted rulebook. Both are recorded in the plan (§Phase 7, Q11 row).

## What's done

- Every rule in the rulebook's §§1–3 (75 of them: each bullet, and each paragraph that states a
  rule) has a hidden tag under it, `<!-- SOURCES: refsKey, owner:C5, todo -->`. `npm run rulebook`
  writes the quote, link and read date from `src/data/refs.js` under it, or "Owner decision X,
  date (file)", from `OWNER_ANSWERS` in `src/data/rulebook.js`.
- 55 rules rest on a quoted sentence and/or an owner answer. 4 are `explains` (no rule stated) and
  3 are `record-keeping`. **20 are `todo`**, and the rulebook prints that in italics under each one.
- Guard (5 tests): every rule has a tag; every token is a quoted, dated `refs.js` entry or a
  recorded owner answer; every owner answer's file exists; the lines under each tag are exactly
  what the code writes; no more than 20 `todo`s. Tamper-checked: altering a quote, deleting a tag,
  and adding a 21st todo each fail.
- Two wrapped `### High-risk (…)` headings joined onto one line (no wording change).

## What's NOT done

**Next: the 20 `todo` rules need a sentence read live** (`verify-clinical-source`), added to
`refs.js` with `quote` + `lastVerified`, then the tag changed and `npm run rulebook` run. Lower the
test's ceiling (20) as they go. List them with:
`node -e "import('./src/data/rulebook.js').then(m=>{const d=require('fs').readFileSync('docs/agent/meningococcal-rules-summary.md','utf8');m.cardRuleBlocks(d).filter(b=>b.tokens?.includes('todo')).forEach(b=>console.log(b.text.slice(0,100)))})"`
They are: 17–21 catch-up (the 19–21 quote does not cover 17–18); ≥22 not indicated; the three
infant indications; series length fixed by age at dose 1; unknown completion age → "before 7";
travel 3/5 years; microbiologist flat 5 years; the teen 16-year dose (ACIP's "1 dose at age 16 yrs
if first dose administered before 16th birthday" is quoted in the doc but not in refs.js); MenB
before 16 not counted; high-risk MenB dose 2 ≥6 months → no dose 3; not-MenB indications (HIV);
the two MenB families (×2) and the pentavalents' families (×2); pentavalent only on its own card;
Penbraya 6 months; Penmenvy 6 months (quote half; N1 is linked); pentavalent dose numbers separate;
pentavalent sets the MenB family. **Some may have no source at all.** Those are app rules: ask the
owner (worked patient + control), don't mark them sourced.

**Found, not asked:**
- §2 says high-risk MenB boosters are "every 2 years"; both linked sentences say "every 2–3 years".
  Already on the carried list (MenB "every 2–3 years"); now visible in the rulebook itself.
- §3's "Why:" paragraph hand-types two CDC quotes (verified 2026-09-16) that are not in `refs.js`.
  Marked `explains`; move them into `refs.js` when the pentavalent todos are read.

**Then:** Q11, the Rulebook screen (plan §D1, D2; PneumoVax's `src/components/Rulebook.jsx` and
`src/data/rulebook.js` are the model). Then **STOP H** (owner reviews the rulebook). Then Phase 8
(ask Q12 at its start).

**Carried over (not started, ask, don't default):** the 24-year-old recruit's long "Booster (16y)"
"Why this"; "Sources" toggle label; the `handoff-2026-11-18-meningovax-phase6-g1-answered.md`
"Carried over" list.

## Resuming

1. `git fetch && gh pr list --state all --limit 3`. If this PR merged: `git checkout main && git pull
   --ff-only`; `npm test` should give **2,226 passed, 177 files**. If not, ask the owner; don't stack.
2. `preview_start` (see the dev-server note above).
3. Read the 20 todo rules live, a few per PR. Per item: read → quote into `refs.js` → tag →
   `npm run rulebook` → lower the ceiling → full suite → PR with the E4 checklist.
