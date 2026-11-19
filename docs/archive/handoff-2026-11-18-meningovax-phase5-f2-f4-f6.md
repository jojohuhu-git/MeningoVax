> **SUPERSEDED 2026-11-18** by `handoff-2026-11-18-meningovax-phase5-closed.md`. PR #105 merged; A17 closed and Phase 5 finished. Do not resume from this file.

# MeningoVax port — Handoff after Phase 5 questions F-2, F-4 and F-6 were answered and built (2026-11-18, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md` ("Phase 5"). **Supersedes**
`handoff-2026-11-18-meningovax-phase5-16y-booster.md`.

## State (verified 2026-11-18)

- 16-year booster PR #104 is merged (`main` at `99bbc62`; 2,089 passed / 165 files, re-run today).
- Branch `feature/2026-11-18-phase5-f2-catchup-13-15` off `main`, 4 commits (`888aa3a`, `a1d93fd`,
  `c395422`, `a5cd800`) plus this handoff. Pushed; **PR #105** open against `main`, waiting for
  the owner (owner merges; no required check). F-4 and F-6 went into the same PR on purpose: they
  edit the same docs, and stacked PRs have merged into each other before.
- Now **2,117 passed, 0 failing (168 files)**.

## What's done

All three asked one patient at a time, measured on a prototype before asking, sources read live,
decisions in `docs/archive/decisions-2026-11-17-open-questions.md` (last three sections).

1. **F-2** `888aa3a`. Healthy 13–15, no MenACWY: "Dose 1 (catch-up, 13–15y)", lead *"A catch-up
   dose now; the booster follows at 16–18 years."* (CDC child/adolescent notes, catch-up). Owner
   chose wording only: the badge stays (badge style is Phase 6). `MENACWY_ROUTINE_CATCHUP_MIN_AGE_MONTHS`
   in `ages.js`. Saved answers 0 moved; prose 270 screens. Whole-app check 7 typical 234 → 228 is
   **hidden, not fixed**: the new 13-year checkpoint now covers 6 unrelated MenB outbreak-label
   changes (still flagged on 96 grid patients).
2. **F-4a / F-4b** `a1d93fd`, `c395422`. `recommend.js` `datedRepeatLines` (after Q10's
   `notRepeatedWhenNothingAsked`): a "Not counted — repeat" line ends "Repeat from <date>." with
   the date the card prints (3,989 lines; 0 differ from the card). If a later dose of that vaccine
   is on the record: "Repeated on <date>. See that dose." (4,726 lines, as PneumoVax). The chip is
   unchanged. **Correction told to the owner in the docs:** the question said 4,936; 210 already
   read "do not repeat" and are untouched. `dose-rules-table.test.js` "floor" invariant updated
   to the new rule. Saved answers: 3,690 real / 303 impossible moved, sentence count only.
   Whole-app check 5 grid 2,977 → 2,437 (those lines no longer say "repeat this dose").
3. **F-6** `a5cd800`. An A/C/W/Y outbreak contact aged 22+ with only a dose before 16: "Booster
   (dose N) for this outbreak", not "routine booster at ≥16y still owed" (through 21 unchanged,
   as travel/lab). The owner first asked whether the outbreak booster repeats only every 5 years
   while at risk; yes, and the test holds that timeline. 48 saved patients (22 and 24), still due
   today, no date moved.

Live-checked each (Ava 14 y 8 m; Leo 13 asplenia, Oct 1/Oct 22 → "Repeat from Dec 17, 2026";
Sam 22 outbreak). No console errors. Parity: meningococcal logic lives only here; `dateUtils.js`
untouched; PneumoVax unaffected.

## What's NOT done

**Owner action first:** review and merge PR #105.

**Phase 5.1:** none of the measured questions is left (F-1, F-2, F-4, F-6 answered and built).
A17 (two dates for a too-soon dose in the saved answers) was waiting on F-4: the line now
carries the card's date, so there is still no second date to store. Check whether the plan wants
anything more for A17 before calling Phase 5 closed.

**Seen while building, not asked (list for the owner):**
- Leo's card (high-risk MenACWY dose 2 not yet due) badge reads "Up to date": this is F-3, Phase 6.
- 1,984 "Not counted — repeat" lines sit under a card that says "Not yet due" with no date (for
  example, a healthy baby's too-young MenQuadfi). The line says "repeat" while the repeat is years
  away, at 11. Not covered by F-4a (no card date). Worth a question.

**For Phase 6 (wording):** F-3 ("Up to date" on cards with a dated dose still coming; PneumoVax's
type-badge style), F-5 ("Booster due at 16y" vs "Booster (16y)").

**Carried over (not fixed):** MenB booster note "1 year after the primary series" on later
boosters; MenB "every 2–3 years" advises 2; whole-app check 5's remaining 2,437 / 20 are partly a
checker gap (`asksOn` doesn't know Q11); Phase 4 A2 colours, A10, A11, A16; healthy 12 y
too-young Bexsero "repeat"; CDC 2024-0069, 2024-0034/0035, 2024-0040 (shared `dateUtils.js`).

## Why this is a good stopping point

Every measured Phase 5.1 question is answered, built test-first, measured against `main` on
every tool, documented in the same commits and checked live. What remains is Phase 6 wording and
two listed observations, independent of this PR.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 105`. If merged:
   `git checkout main && git pull --ff-only`; `npm test` should give **2,117 passed, 168 files**.
   If not merged, ask the owner; don't build on the unlanded branch.
2. `preview_start` "MeningoVax dev server".
3. Read the plan's Phase 5 close-out and Phase 6. Ask the owner whether to ask the "Not yet due
   + repeat" observation now or with Phase 6. Ask, don't default.
4. For any change: prototype → measure (`npm run sweep:update`, prose diff, whole-app on both,
   a card-change count) → ask with one patient per box → failing test → change → docs in the
   same commit → live check.
5. Branch + PR against `main`; the owner merges. Put the handoff in this folder, in the same PR.
