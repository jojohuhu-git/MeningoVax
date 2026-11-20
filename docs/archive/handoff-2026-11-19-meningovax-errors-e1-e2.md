# MeningoVax — Handoff after card errors E1 and E2 (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. **Supersedes**
`handoff-2026-11-19-meningovax-rulebook-mockup-v6.md` (its open items are carried below).

Branch: `port/phase7-rulebook-errors`, off `origin/main` (`443bef9`, PR #120). **NOT pushed**:
the owner has not asked for a push or a PR yet. Baseline was 2,247 passing (180 files); now
**2,252 passing (182 files)**, all green, after the E2 commit `e0748c8`; this handoff and the
superseded banner on the v6 handoff are committed on top of it.

The "errors" are the three card errors listed in the v6 handoff, found during the Patient-screen
wording review. Here they are E1–E3.

## What's done

0. **Docs moved to a fresh branch** (owner yes): the v5 handoff and mockup cherry-picked from
   `port/phase7-rulebook-screen` (`a2527e2`), plus mockup v9, the Q1–Q5 decisions and the v6 handoff
   (`849d1fc`). The old branch `port/phase7-rulebook-screen` still exists locally; it holds nothing
   that isn't on this branch.
1. **E1** (`46d9217`; owner approved the wording 2026-11-19): the 11–15-year MenACWY "Why this" said a
   pentavalent may be used "if MenB is also being started under shared clinical decision-making",
   which is never true under 16. It now reads: "Without a MenB risk factor, MenB is offered from 16
   through 23 years by shared clinical decision-making [c]. A pentavalent dose may be used only when
   MenACWY and MenB are due at the same visit [c]." Sources: `menbHealthyPreferredAge1618`,
   `pentavalentWhenBothIndicated` (`src/logic/recommend.js`, 11–15 branch). The sentence couldn't
   just be dropped: U1 (`regression-u1-note-lead-and-detail.test.js`) requires both halves of a
   note. "from 16 through 23" rather than "at 16–23" so the U2 age-16-booster check stays strict.
   Prose: 672 of 24,600 patients changed (564 real), all this sentence; 0 answers moved. Test:
   `regression-2026-11-19-e1-no-shared-decision-pentavalent-under-16.test.js`.
2. **E2** (`e0748c8`): the MenB "Why this" for a healthy child under 10 listed four of ACIP's five
   10–15 indications; it now adds "or a serogroup B outbreak [c]", citing `acip2020MenbRiskGroups`.
   Only surface (grep: the Rulebook page has no copy; the pregnancy line already had it). Prose:
   2,744 of 24,600 changed (1,036 real), all this sentence; 0 answers moved. Test:
   `regression-2026-11-19-e2-menb-under-10-list-names-b-outbreak.test.js`.
   Both were checked in the running app (patients born 2012-06-01 and 2017-06-01), no console errors.

## What's NOT done — the remaining queue

1. **E3 (not started)**: a later MenB booster's "Why this" says "A MenB booster, 1 year after the
   primary series was completed [c]" under the label "Booster (dose 5, every 2–3 years)". Reproduce:
   asplenia, born 2006-06-01, Bexsero 2023-07-01, 2023-08-01, 2024-01-01, 2025-01-01, today
   2026-11-19. Sentence at `src/logic/recommend.js` (search "after the primary series was
   completed"). The cited quote (`menbHighRiskBoosterCadenceBox`) already covers "additional
   boosters every 2–3 years if the risk remains". New card wording, so put the sentence to the owner first,
   as was done for E1.
2. **Citations, later (owner: "save this for then")**: the source buttons under "Why this" list only
   the card's `citations` (e.g. "ACIP 2020 MMWR"), while the numbered marks can point at other papers
   (CDC catch-up page, Penmenvy MMWR) that appear only on hover. True before E1. Take it up in a
   future citations pass; ask the owner.
3. Wording slips from the v6 handoff (not started): the A/C/W/Y outbreak note says 5 years twice;
   "Boosters: 1 more - at age 16".
4. Owner review of mockup v8/v9 (https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr): the Rulebook
   screen, its wording review, the Patient screen wording (72 items) and placement (7 items).
5. Build Q1–Q5 (`docs/archive/decisions-2026-11-19-rulebook-mockup-q1-q5.md`). **Remind the owner
   to check PneumoVax's dose labels for the Q5 amber rule** before any label colour is built.
6. Carried: "why higher risk" sentences (needs a live read); §2's "P0-1 (2026-07-23)" is not
   `owner:P0-1`; **STOP H**; then Phase 8 (ask Q12 at its start).

## Why this is a good stopping point

E1 and E2 are each complete (test, fix, full suite, wording count, live check, commit). E3 is
independent and needs the owner to approve a new sentence before it is built.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout port/phase7-rulebook-errors`
2. `npm test` — confirm **2,252 passed / 182 files**. `preview_start {name: "MeningoVax dev server"}`.
3. Ask, don't default: E3's sentence; whether to push and open a PR for E1–E2 now or after E3.
4. Per item (fix-queue skill): reproduce → failing test → fix → full suite → `npm run prose -- dump`
   before/after and `diff` (number in the commit) → live check → commit by ID. New test files
   change the counts in `docs/agent/testing.md` ("Measured counts"); a `not.toMatch` on a retired
   sentence needs an `// extinct:` comment (E4b guard).
5. Ship skill: MeningoVax `main` is unprotected, but the habit is branch → PR against `main` → owner
   merges. PR body: the E4 four questions, the prose counts, and "0 answers moved".
