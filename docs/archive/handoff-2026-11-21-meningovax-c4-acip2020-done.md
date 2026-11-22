> **SUPERSEDED 2026-11-21** by `handoff-2026-11-21-meningovax-rulebook-sources-per-vaccine.md`. PR #139 is merged (`88f0bc0`) and the Rulebook Sources fix is in PR #140; do not resume from this file.

# MeningoVax — Handoff after C4 document 1 finished: ACIP 2020 cited on every card (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-c4-acip2020-menb.md` (#138 is
merged as `df21480`).

Branch `phase8/c4-acip2020-menacwy-exposure`, off `main` after #138. Pushed; **PR #139** against
`main` (https://github.com/jojohuhu-git/MeningoVax/pull/139). **The owner merges.** `main` was
merged in after #138 squash-merged (no content change). Baseline was 2,457 passing (207 files);
now **2,469 passing (208 files)**, 0 failing (`npx vitest run`, 2026-11-21). The drop from 2,476
mid-session is explained: U1 (`regression-u1-note-lead-and-detail.test.js`) generates checks per
distinct note, and two under-10 lab notes now equal the 10+ ones (333 → 325).

## What's done

1. **C4 ACIP 2020 part 2, MenACWY exposure cards** (`e848c8a`). Every quote read live 2026-11-21
   in the browser pane (CDC blocks `curl`; `javascript_tool` on `document.body.innerText`) and
   checked as an exact substring. New `refs.js` keys: `acip2020Table9TravelBooster`,
   `acip2020Indication{Microbiologist,OutbreakACWY,Travel,Military}`,
   `acip2020College1DoseBeforeEntry`, `acip2020CollegeBoosterBeforeEnrollment`; reused
   `acip2020Table7MicrobiologistBooster`, `acip2020Table2Booster16`. In `recommend.js`: the
   travel/lab booster line carries `[c]` + `boosterCites` (passed through
   `routineSixteenBoosterCard`); dose-1, outbreak, military and college sentences carry `[c]`;
   `routineBoosterStillOwedNote`'s lead is cited via new `routineBoosterStillOwedCites()`.
   The L2-3 test in `c5-note-citations.test.js` was changed on purpose (it forbade a mark when the
   sentence had no source; now it holds marks = sources and no age split).
2. **Owner answers E1, E2** (`71f2a0f`, recorded in
   `docs/archive/decisions-2026-11-21-c4-acip2020-exposure.md`): E1 "Same as 10+" (a lab worker
   under 10 cites as at 10+; age-doubt note stays); E2 "Match ACIP" (college sentence now "ACIP
   prefers the most recent dose on or after the 16th birthday [c]. A single dose before 16 needs a
   booster before enrollment [c]." — semicolon became a full stop for style rule 4).
3. Measured: **0 answers moved**; wording 6,162 of 24,600 saved patients (source marks + E2);
   ACIP 2020 uncited **3,576 → 0**; any uncited button **19,786 → 16,402**. Guard:
   `regression-2026-11-21-c4-acip2020-menacwy-exposure-cards.test.js` (10 of 11 fail with the
   engine change removed). Live-checked: 30-y lab worker ([1] on both lines, button numbered);
   18-y college resident with a dose at 12 (E2 sentences, each hover quotes its footnote). The
   under-10 lab card is checked by tests only.

## What's NOT done — the remaining queue

1. **Owner merges PR #139.** Check `origin/main` before calling it merged.
2. **C4, next documents by size** (`node scripts/uncitedByDocument.mjs`; pass a URL for a
   per-button breakdown): mm7349a3 **7,550**; CDC complement-inhibitor page **6,224** (also: an
   asplenia patient's high-risk MenB dose-1 card shows "CDC Complement-Inhibitor Guidance",
   `refs(['cdcComplementInhibitor', 'mm7349a3'])` in `recommend.js`, seen in part 1); CDC
   vaccine-recommendations **3,194**; CDC Adult Notes **1,252** (owns the pregnancy `menbRefs`
   question); immunize.org ACWY **888**, MenB **492**. outbreak_b's documents still reach MenACWY
   cards (a `menacwyRefs` mirror of `menbRefs`, decide in those documents' PRs).
3. **Seen, not acted on:** `routineBoosterStillOwedNote`'s lead contains an em dash ("still owed —
   the recorded dose"); em dashes are banned from user-visible strings (owner D7, 2026-07-16) but
   the G1-a style guard does not flag it. Ask before changing wording.
4. Rest of Phase 8 (plan table C): C5, C6, C7, C9–C13; age-doubt note and transplant stop buttons
   (Results.jsx) not numbered. Then Phase 9. PneumoVax session items from earlier handoffs unchanged.

## Why this is a good stopping point

ACIP 2020, the first and most-used document, is now cited wherever it appears, with both owner
questions answered and built. The next document (mm7349a3) is a separate reading with its own PR.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If #139 merged: `git checkout main && git pull`; the suite should show **2,469 / 208 files**.
2. `preview_start {name: "MeningoVax dev server"}`; open the next document in the browser pane.
3. Per document (Q12, `docs/archive/report-2026-11-21-phase8-citations-measured.md`): decide alone
   when the dose is unchanged; escalate no-row / different doses / verdict moves, with worked
   patients and a control. Per item: failing test → fix → full suite → live check → commit.
   Moved answers: `npm run sweep:update` and explain; wording: `npm run prose -- dump/diff`;
   after touching `refs.js`: `npm run rulebook`. E4 checklist and every judgement call in the PR body.
4. Ship: branch off `main`, PR against `main`; the owner merges. No force-push. If the previous PR
   is still open, branch from it but open against `main`, and merge `main` in after it lands.
