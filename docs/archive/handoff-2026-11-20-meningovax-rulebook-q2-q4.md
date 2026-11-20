> **SUPERSEDED 2026-11-20** by `handoff-2026-11-20-meningovax-review-v10-build.md` (PR #123 merged; the review v10 answers recorded; Batches 1–2a built on PR #124; the rest of the queue is listed there). Do not resume from this file.

# MeningoVax — Handoff after Rulebook answers Q2 and Q4 (2026-11-20, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. **Supersedes**
`handoff-2026-11-19-meningovax-errors-e1-e2.md` (its open items are carried below).

Branch: `port/phase7-rulebook-q1-q4`, off `origin/main` `64e8894` (PR #122, the wording slips,
**merged** 2026-11-20). **Pushed; PR #123 open against `main`, waiting for the owner to merge**
(https://github.com/jojohuhu-git/MeningoVax/pull/123). Suite **2,267 passed / 186 files**, all
green. Commits: `b04534a` Q4, `acb8437` Q2, `371f494` test-count table, `4b43452` column width,
plus handoffs. Both items live-checked in the running app 2026-11-20 (no console errors).

Q1–Q5 are the owner's answers in `docs/archive/decisions-2026-11-19-rulebook-mockup-q1-q5.md`.

**Update, later 2026-11-20 (owner chose "Mockup v9 review" as the next item):** the mockup is now a
review form, v10, at the same link (https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr, version 12;
source `docs/archive/mockup-2026-11-20-rulebook-review-v10.html`, committed locally on this branch,
not pushed). 150 numbered open items: D1 (build the redesign), R1–R110 Rulebook wording (74 open),
P1–P75 Patient wording (71 open; P73–P75 added after owner notes: two "tick" sentences, and the false "earliest any MenACWY … 2 months" lead at `recommend.js:564,1080`), L1–L7 placement. Owner notes 2026-11-20 applied: shorter proposals (an `OV` override map in the page), R10 corrected (MenQuadfi 6-week dose counts), no "tick", Quick look bars wrap. 17 items already built are tagged "Built"
(R3–R7, R9, R70, R107–R110, P22, P23, P40), checked against today's app with `npm run prose -- dump`
and a render of `Rulebook.jsx`. The owner's answers save to the page's db: read them with
`ArtifactData list`, collection `verdicts`, one doc per item id `{v: yes|no|edit|'', note, at}`.
Next: read the verdicts, then build the approved items (fix-queue; prose counts; chip labels are a
closed owner list). The collection was empty at publish.

## What's done

1. **Q4** (`b04534a`): a healthy patient's MenB dose before 16 now says, behind "Why this", "MenB
   antibody protection wanes within 1–2 years, so a dose before 16 does not count without a
   high-risk indication." (was "about a year"). Source read live 2026-11-20: ACIP Oct 2024,
   https://www.cdc.gov/mmwr/volumes/73/wr/mm7349a3.htm, "antibody waning within 1–2 years after
   completion of the primary series". (The fetch tool could not re-read the ACIP 2020 page
   rr6909a1 word for word; its quote in `refs.js` `acip2020MenbShortProtection`, read 2026-11-19,
   says the same.) Files: `MENB_WANES_BEFORE_16_WHY` in `src/logic/doseRules.js`, the rulebook's
   reason sentence in `docs/agent/meningococcal-rules-summary.md`, a comment in `src/logic/ages.js`.
   Prose: 2,618 of 24,600 patients changed (2,429 real), only this phrase; 0 answers moved. Test:
   `regression-2026-11-19-q4-menb-wanes-within-1-2-years.test.js`.
2. **Q2 on today's Rulebook screen** (`acb8437`; owner approved the seven sentences S1–S7 as
   written, 2026-11-20). "4C"/"FHbp" are gone from the screen: vaccine table column "Counts as"
   (Bexsero/Trumenba); Bexsero/Trumenba rows "Use for every MenB dose. Not interchangeable with …";
   Penmenvy/Penbraya rows "Gives one MenACWY dose and one Bexsero (Trumenba) dose in a single
   injection."; box heading "MenB products are not interchangeable", box labels dropped, new
   note; combined-shot line "The product must match the earlier MenB doses: Penmenvy after
   Bexsero, Penbraya after Trumenba." CDC's quoted sentences and paper titles keep "MenB-4C".
   Brand names come from `brands.js`. Files: `src/data/rulebookPage.js`,
   `src/components/Rulebook.jsx`. The live check at phone width found "Trumenba" overflowing the
   12% "Counts as" column; widened to 18% (`4b43452`), rechecked: no overflow, no page scroll. Patient cards unchanged (prose 0 of 24,600). Test:
   `regression-2026-11-20-q2-rulebook-brand-names-not-4c-fhbp.test.jsx`.
3. **Q3, patient-card half: already true before this session.** The high-risk MenB dose 2 "Why
   this" already reads "Dose 2 is given 1–2 months after dose 1…" (`recommend.js`, high-risk
   branch). Nothing changed.

## What's NOT done — the remaining queue

1. **Owner merges PR #123.** Done otherwise. (Dev-server tip: when all 5 slots belong to other
   chats, those servers serve this same folder, so `preview_start {url: "http://localhost:<port>/
   MeningoVax/"}` on one of them shows the current branch; `lsof -nP -iTCP -sTCP:LISTEN` lists them.)
2. **Deferred to the mockup v9 redesign (owner, 2026-11-20, "Q2 on today's screen")**: Q1 (two
   Quick look tables) and Q3's Rulebook half (the "1–2 months" in a Details panel). Both exist only
   in the unbuilt redesign (https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr).
3. **Q2 on the patient cards**: deferred by the owner to the Patient screen review (e.g. chip "Dose
   2 of 2 (4C)", the DoseEditor's "Family locked: MenB-4C" line, the card's "MenB-4C (Bexsero,
   Penmenvy) … not interchangeable" sentence). The chip label is on the closed list, so it is an
   owner question.
4. **Not Q2, still says "family" on the Rulebook screen**: the "Not counted — repeat" key ("…or
   the wrong MenB family") and the wrong-product note ("Wrong MenB family: finish in the first
   family…"). Mockup rows 485 and 501 propose new wording; part of the owner's review (item 6).
5. **Q5** (amber on "Not counted — do not repeat"): **remind the owner to check PneumoVax's dose
   labels first** (her request). Not built.
6. Owner review of mockup v8/v9: the Rulebook screen redesign, its wording review, the Patient
   screen wording (72 items) and placement (7 items).
7. Carried: citations pass (the source buttons list only the card's `citations`; owner "save this
   for then"); "why higher risk" sentences (needs a live read); §2's "P0-1 (2026-07-23)" is not
   `owner:P0-1`; **STOP H**; then Phase 8 (ask Q12 at its start).

## Why this is a good stopping point

Q4 and Q2 are each complete (failing test first, fix, full suite, wording count, commit), except
the live check, which needs a free dev-server slot. Everything left is owner-gated or depends on
the unbuilt redesign.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git checkout port/phase7-rulebook-q1-q4`
2. `npm test` — confirm **2,267 passed / 186 files**. `preview_start {name: "MeningoVax dev
   server"}`; if the 5-server limit blocks it, ask the owner to stop one from another chat.
3. Check PR #123 is merged (`gh pr view 123`); if so, branch the next work off fresh `origin/main`.
4. Ask, don't default: which of items 2–7 next. Remind about PneumoVax before any Q5 work.
5. Per item (fix-queue skill): reproduce → failing test → fix → full suite → `npm run prose --
   dump` before/after and `diff` → live check → commit by ID. New test files change the counts in
   `docs/agent/testing.md` ("Measured counts"); a `not.toMatch` on a retired sentence needs an
   `// extinct:` comment.
