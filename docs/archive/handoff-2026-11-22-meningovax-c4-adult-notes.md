# MeningoVax — Handoff after C4 document 5: CDC Adult Notes (2026-11-22, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, short questions with a worked patient and a before/after;
ask, don't default. **Supersedes** `handoff-2026-11-22-meningovax-c4-cdc-recs-page.md`.

Two open PRs, stacked; **the owner merges, #144 first**:
- **PR #144** `phase8/c4-cdc-recs-page`: C4 document 4 (CDC recommendations page).
  https://github.com/jojohuhu-git/MeningoVax/pull/144. #143 squash-merged into `main` (`adf950e`);
  this session merged `main` into #144's branch (no force-push). All four conflicts were main's
  older text against the branch's superset, so I kept the branch's side. #144 is mergeable; its `test` check re-ran.
- **PR #145** `phase8/c4-cdc-adult-notes` (branched from #144, opened against `main`): C4 document 5.
  https://github.com/jojohuhu-git/MeningoVax/pull/145. Until #144 merges, its diff also shows #144's
  commits. After #144 squash-merges, merge `main` into this branch (no force-push).

Suite: **2,534 passing, 0 failing (214 files)** (`npx vitest run`, 2026-11-22, on
`phase8/c4-cdc-adult-notes`). Baseline at session start: 2,527 (213 files).

## What's done

1. **#144's conflicts fixed**: merge commit on `phase8/c4-cdc-recs-page`, suite 2,527 green after.
2. **C4 document 5, CDC Adult Immunization Schedule notes** (PR #145, owner chose it 2026-11-22).
   Read live 2026-11-22 (updated July 2, 2025): "Pregnancy: Delay MenB until after pregnancy due to
   lack of safety data in pregnant women. May administer if at increased risk and vaccination
   benefits outweigh potential risks." The schedule is "Recommendations for Ages 19 Years or Older";
   the child/adolescent notes say nothing about MenB in pregnancy.
   - New quoted keys `cdcAdultMenbPregnancyDelay`, `cdcAdultMenbPregnancyMayGive` (MenB in
     `SENTENCE_VACCINE`).
   - Deferred card ≥19: lead cites ACIP 2020 then the notes. High-risk + pregnancy cards: the
     pregnancy line (`menbPregnancyCaveat`) now ends `[c]` (ACIP 2020) or `[c][c]` from 19 (+ notes);
     `pregCites` appended last in each card's noteCites (4 sites).
   - `pregnancy.menbRefs: []`: the cited sentence brings its own button; off under-19, under-10 and
     a pregnant adult's card with no pregnancy line. Five unreachable healthy-path caveats removed.
   - Uncited 1,252 → 0; any uncited 2,632 → 1,380; 0 sentences, 0 answers moved. Decided alone
     (Q12); **the 19-and-up cut is flagged in the PR as my call**.

## What's NOT done — the remaining queue

1. **Owner merges #144, then #145** (merge `main` into #145's branch between). Check `origin/main`.
2. **C4, documents left**: immunize.org ACWY **888**, MenB **492** cards (landing-page buttons only;
   `refs.js` says they have no stable sentences to quote, so this probably needs an owner call on
   whether to number them at all).
3. **Grid gap (seen this session):** the saved-answers grid (`src/test-grid.js`) has 0 pregnant
   patients with a second risk, so no sweep sees a pregnant high-risk patient's cards. Widening it
   moves the saved-answer baseline; ask before doing it.
4. **Complement page content on no card** (new clinical wording; ask): incomplete protection even
   when vaccinated; consider antibiotic prophylaxis; finish vaccines ≥2 weeks before the first
   inhibitor dose. The checkbox also covers inherited deficiency, which the page does not.
5. **Card-note citations for MenB doses that COUNT** (deferred from C11): Rulebook rows "No dose 3
   is needed if dose 2 was ≥6 months after dose 1" and the two "If dose 3 was early … Counts" rows.
6. **Seen, not acted on (wording; ask first):** em dashes in card text (owner D7 bans them; the G1-a
   guard misses them): `routineBoosterStillOwedNote`'s lead; the high-risk MenB booster card's
   detail ("primary series — MenB-4C …").
7. **Seen, not acted on (citation-only, Q12):** high-risk MenB dose 1/2/3 cite the Bexsero-worded
   schedule sentence for every brand; MenB minimum-age lines cite one general sentence for every
   brand. Healthy MenB cards cite CDC's child/adolescent notes (`cdcChildMenB`) at 19–23 too, outside
   that schedule's ages (same issue as the adult-notes cut, other direction).
8. **Seen, not acted on (clinical content; ask):** the CDC recommendations page says some outbreaks
   may call for a MenB booster after 6 months, not 1 year. No card says that.
9. Rest of Phase 8 (plan table C): C5, C6, C7, C9, C10, C12, C13; age-doubt note and transplant
   stop buttons (Results.jsx) not numbered. Then Phase 9.

## Why this is a good stopping point

The last CDC document with uncited buttons is now cited, with its own PR, test and
measurements. What's left of C4 is two landing pages that likely need an owner decision.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git log --oneline origin/main -3`.
   If both merged: `git checkout main && git pull`; the suite should show **2,534 / 214 files**.
2. Dev server: this folder usually has 5 servers from other chats (the cap). If
   `preview_start {name}` refuses, use `preview_start {url: "http://localhost:5175/MeningoVax/"}`
   and confirm it runs from this folder (`lsof -a -p $(lsof -tiTCP:5175 -sTCP:LISTEN) -d cwd`).
   CDC blocks `curl`: read pages in the browser pane (`javascript_tool` on `document.body.textContent`;
   `innerText` misses collapsed sections).
3. Ask the owner which of items 2–8 comes next (ask, don't default).
4. Per document (Q12): decide alone when the dose is unchanged; escalate no-row / different doses /
   verdict moves. `node scripts/uncitedByDocument.mjs <url>` to break one down; the grid misses
   multi-risk pregnancy, so test those by hand. Failing test → fix → full suite → live check →
   commit. `npm run prose -- dump` before/after, then `-- diff`; for sentence counts strip
   `{hover: …}`, `[n]` and button short names. After touching `refs.js`: `npm run rulebook`, add
   new quoted keys to `SENTENCE_VACCINE`, bump `docs/agent/testing.md` counts for a new test file.
   E4 checklist in every PR body.
5. Ship: PR against `main`; the owner merges. No force-push.
