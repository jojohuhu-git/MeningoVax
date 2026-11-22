> **SUPERSEDED 2026-11-21** by `handoff-2026-11-21-meningovax-c4-acip2020-done.md`. PR #138 is merged and part 2 (MenACWY exposure cards, owner E1/E2) is built in PR #139; do not resume from this file.

# MeningoVax — Handoff after C4 document 1, part 1: ACIP 2020 on MenB cards (2026-11-21, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-21-meningovax-phase8-c2-c3.md` (#137 is merged).

Branch `phase8/c4-uncited-sources`, off `main` at `6b82535` (#137). Pushed; PR against `main`
(the number is in the PR list; **the owner merges**). GitHub runs a `test` check on every PR.
Baseline was 2,443 passing (206 files); now **2,457 passing (207 files)**, 0 failing
(`npx vitest run`, 2026-11-21).

## What's done

1. **#137's conflict resolved** (before this branch): its branch still held #136's unsquashed
   commits; main was merged in (no files changed). #137 then merged.
2. **C4, ACIP 2020 (rr6909a1), MenB cards** (`257a181`). Read live in the browser pane, all 11
   tables (CDC blocks `curl`; use the built-in browser and `javascript_tool` on `innerText`).
   - Travel, college_dorm, military, hiv and outbreak_acwy set `menbRefs: []` in
     `src/data/riskFactors.js`; `collectRefs()` in `recommend.js` takes a `family` argument and the
     MenB card uses `menbRefs` when present. Reason, quoted: Tables 6, 9, 10 say "No
     recommendations for use of MenB vaccines…"; Table 8's MenB column is for a serogroup B
     outbreak (outbreak_b), not A/C/W/Y.
   - The high-risk MenB booster lines now end in `[c]` citing `acip2020MenbBoosterCadence`; the
     B-outbreak-only line cites `acip2020Table8MenbOutbreakBooster`; the under-10 high-risk MenB
     note ("track them … once they reach age 10 [c]") cites `acip2020MenbRiskGroups`. All three
     quotes re-checked live 2026-11-21 as exact substrings; `lastVerified` updated; rulebook
     regenerated.
   - Guard (Q12's required test): `regression-2026-11-21-c4-acip2020-only-where-it-speaks.test.js`.
     Its last check fails if a new risk factor with no MenB class does not declare `menbRefs`
     (pregnancy is the one named exception, left to the CDC Adult Notes reading).
   - Counts: 0 answers moved (sweep green). Wording: 17,826 of 24,600 saved patients read
     differently (`npm run prose -- diff`), all source numbers and buttons. ACIP 2020 uncited:
     **10,777 → 3,576 cards**; any uncited button: **21,180 → 19,786 cards**.
   - New `scripts/uncitedByDocument.mjs` (in MAP.md): per-document uncited counts; pass a
     document's URL for a per-button breakdown.
   - Checked live: 12-year-old, asplenia + travel: MenB booster line shows [2] = ACIP 2020; no
     Table 9 button on the MenB card; MenACWY card keeps it.

## What's NOT done — the remaining queue

1. **Owner merges this PR.** Check `origin/main` before calling it merged.
2. **C4 ACIP 2020 part 2: MenACWY exposure cards (3,576 cards).** Every microbiologist, travel,
   outbreak_acwy, college and military MenACWY card cites **nothing**: Tables 7/8/9/10 sit
   unnumbered. Each card's sentences need a quote (about 16 call sites in `menacwyRec`, lines
   ~470–990). Body-text sentences found live: college "should receive at least 1 dose of MenACWY
   within 5 years before college entry"; travel footnote "should receive a booster dose of MenACWY
   if the last dose was administered 3–5 or more years previously…"; microbiologist and outbreak
   MenACWY rules live only in table cells (Table 7: "Single dose at 5 yrs after primary vaccination
   and every 5 yrs thereafter", which also appears in Tables 4, 5 and 9, so a `#:~:text=` link
   lands on Table 4 first; decide how to anchor it).
   **Escalate (Q12 case a), don't decide:** microbiologist, military and college cards for patients
   under 10. Tables 7 and 10 have only a "≥10 yrs" row (the app already shows its age-doubt note,
   `minPlausibleAgeMonths`). Ask the owner with worked patients what those cards should cite.
   Measured, not a finding: a traveler vaccinated under 7 already gets a 3-year first booster.
3. **Seen in passing (another document's C4/C10):** an asplenia patient's high-risk MenB dose-1
   card shows "CDC Complement-Inhibitor Guidance" (`refs(['cdcComplementInhibitor', 'mm7349a3'])`
   near `recommend.js` line 1782). Handle it in the complement-inhibitor page's reading (6,224 cards).
4. Next documents by size (`node scripts/uncitedByDocument.mjs`): mm7349a3 7,550; CDC
   complement-inhibitor 6,224; CDC vaccine-recommendations 3,194; CDC Adult Notes 1,252 (owns the
   pregnancy `menbRefs` question); immunize.org ACWY 888, MenB 492. outbreak_b's documents still
   reach MenACWY cards (a `menacwyRefs` mirror of `menbRefs`, decided in those documents' PRs).
5. Rest of Phase 8 (plan table C): C5, C6, C7, C9–C13; age-doubt note and transplant stop buttons
   (Results.jsx) not numbered. Then Phase 9. PneumoVax session items from earlier handoffs unchanged.

## Why this is a good stopping point

Every MenB card is finished for ACIP 2020 and guarded by a test; the MenACWY exposure cards are a
separate set of sentences, with an owner question attached, and fit one reviewable PR of their own.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If merged: `git checkout main && git pull`; the suite should show **2,457 / 207 files**.
2. `preview_start {name: "MeningoVax dev server"}`; open the ACIP 2020 page in the browser pane.
3. Part 2 above: draft the owner question for the under-10 cards first (worked patients,
   before/after), then cite the ≥10 cards. Per item: failing test → fix → full suite → live check →
   commit. Moved answers: `npm run sweep:update` and explain; wording: `npm run prose -- dump/diff`;
   after touching `refs.js`: `npm run rulebook`. E4 checklist and every judgement call in the PR body.
4. Ship: branch off `main`, PR against `main`; the owner merges. No force-push.
