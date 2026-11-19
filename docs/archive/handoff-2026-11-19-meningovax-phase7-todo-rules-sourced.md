# MeningoVax port — Handoff after the rulebook's "todo" rules were read (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. Plan:
`docs/archive/plan-2026-11-08-meningovax-port.md`. **Supersedes**
`handoff-2026-11-19-meningovax-phase7-card-rule-sources.md`.

## State (verified 2026-11-19)

- `main` at `f72c546` (#117, card-rule sources, MERGED).
- Branch `port/phase7-todo-rule-sources`, off `main`, pushed, PR open against `main` (this
  handoff is in it). MeningoVax has no CI; the owner merges.
- **2,226 passed, 0 failing, 177 files** (same count as `main`: no test added, the todo ceiling
  in `rulebook-table-matches-code.test.js` went from 20 to 2).
- Dev server: `preview_start {name}` refuses (other chats hold the 5-per-folder limit);
  `preview_start {url: "http://localhost:5175/MeningoVax/"}` works. This PR changes no screen:
  none of the 17 new `refs.js` entries is cited by a card, only by the rulebook.

## What's done

- **18 of the 20 "todo" rules now name a quoted source.** Each sentence was read live on
  2026-11-19 in the built-in browser and checked as an exact substring of the page text:
  ACIP 2020 MMWR (rr6909a1), CDC child schedule notes, ACIP 2025 Penmenvy MMWR (mm7501a2).
  17 new entries at the end of `CITATIONS` in `src/data/refs.js`; tags changed in
  `docs/agent/meningococcal-rules-summary.md`; `npm run rulebook` wrote the quotes in.
- `citation-integrity.test.js` (L2-3, "no source sits unused") now counts a rulebook SOURCES tag
  as a use, since those tags are themselves held to `refs.js`. So three entries held for STOP C
  N1 (`pentavalentHighRiskNoUpperAge`, `pentavalentLicensed10to25`, `cdcAdultPenbrayaSameDay`)
  left its `KNOWN_UNCITED` list.
- Tamper-checked: putting `todo` back on a sourced rule fails 3 tests (ceiling, lines under the
  tag, unused source); altering one quote in `refs.js` fails the "lines under every tag" test.

## Owner questions (asked 2026-11-19; ask again if unanswered, don't default)

**T1 — An infant who fell behind (rulebook §1, "The length is fixed by the age at dose 1 and never
changes afterwards").** No source settles it. Measured in the engine today:
- Asplenia, born 2020-11-19, one Menveo at **2 months**, nothing since, seen at 6 years: the app
  asks for **3 more** doses (card: "Continue the infant high-risk series — doses at 2, 4, 6 and 12
  months"), 4 in all.
- CDC's own scheduling software (CDSI 4.65, "Meningococcal ACWY risk 2-23 month" series) skips
  doses 2 and 3 once the child is 7 months or older: **2 more** (one now, one ≥12 weeks later),
  3 in all.
- Control 1: the same child with dose 1 at **4 months**: app and CDSI agree, 2 more (the
  "3-dose shortcut").
- Control 2: the same child with dose 1 at **24 months**: 1 more, 2 in all.
- CDC note: "Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and 12
  months)"; ACIP's catch-up footnote covers dose 1 at 3–6 months only. Neither names a child who
  lapsed. **Recommendation:** follow CDSI (2 more for the 2-month starter, as for a 3–6-month
  starter). Cross-repo: vaxapp has the same 2-month behaviour (P1-3 note in
  `fix-2026-09-15-dose-counter-audit.md`), so a change needs the owner's go-ahead for both.

**T2 — "Completion age unknown: treated conservatively as 'before 7'" (rulebook §2).** Since C1
(an undated dose does not count), the last primary dose always has a date, so this fallback never
changes a card. Measured: asplenia, 10 years, dose 2 entered with no date → dose 2 is "invalid" and
owed again; the 3-year fallback never runs. **Recommendation:** keep the code's fallback as a
safety net, retag the rulebook line `explains` and add "no patient reaches this since C1",
with a sweep test that proves it.

## Found, not changed

- §2 says healthy MenB "antibody protection wanes within about a year"; the new ACIP quote under
  it says "within 1–2 years". The same "about a year" sentence is card text in
  `src/logic/doseRules.js:372`, so changing it is a wording question for the owner.
- That §2 paragraph says "P0-1 (2026-07-23)". The `owner:P0-1` in `OWNER_ANSWERS` is a different
  P0-1 (2026-09-17, infant intervals). Not tagged `owner:P0-1` for that reason.
- Carried from the last handoff: §2 says high-risk MenB boosters "every 2 years"; both linked
  sentences say "every 2–3 years".

## Then

Q11, the Rulebook screen (plan §D1, D2; PneumoVax's `src/components/Rulebook.jsx` and
`src/data/rulebook.js` are the model). Then **STOP H** (owner reviews the rulebook). Then Phase 8
(ask Q12 at its start). Still carried, not started: the 24-year-old recruit's long "Booster (16y)"
"Why this"; the "Sources" toggle label; the `handoff-2026-11-18-meningovax-phase6-g1-answered.md`
"Carried over" list.

## Resuming

1. `git fetch && gh pr list --state all --limit 3`. If this PR merged: `git checkout main && git pull
   --ff-only`; `npm test` should give **2,226 passed, 177 files**. If not merged, ask; don't stack.
2. Look for the owner's T1/T2 answers (chat, or a decisions file). Build each the usual way:
   failing test → fix → `npm run sweep:update` with the moved-answer count explained →
   `npm run rulebook` → full suite → live check → PR with the E4 checklist. T1 needs the
   `vaccine-parity` skill (vaxapp).
3. Then the Rulebook screen.
