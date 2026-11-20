# MeningoVax — Handoff after the Rulebook screen mockups (brainstorm, 2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. **Supersedes**
`handoff-2026-11-19-meningovax-rulebook-screen.md` (its "What's NOT done" list is carried below).

Branch `port/phase7-rulebook-screen`, pushed, **PR #120 still OPEN** (owner merges; MeningoVax has
no CI). Last commit `864009c` (Rulebook review 1). This session changed **no app code**: suite is
**2,247 passed, 180 files** (run 2026-11-19, unchanged). Working tree: this handoff and
`docs/archive/mockup-2026-11-19-rulebook-screen-v5.html` are new (uncommitted unless the owner said
commit).

## What this session did (brainstorm only — nothing built)

Built clickable mockups of a redesigned in-app Rulebook screen, five rounds with the owner.
- **Live mockup:** https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr (version 6 = "v5" on the page).
  Source copy: `docs/archive/mockup-2026-11-19-rulebook-screen-v5.html` (a page fragment; to view
  it locally, wrap it in `<html><body>` and drop a temporary copy in `public/`, open
  `http://localhost:<port>/MeningoVax/<name>.html`, then delete the copy).
- Owner picks so far (also in memory `rulebook-screen-mockup-direction`):
  1. Layout: **decision path on top** (7 steps in the engine's real order: stop check → read the
     record → MenACWY schedule → MenB schedule → set dates → combined shot → cards), **quick look
     below**, wording review under it.
  2. **Example-patient picker removed** (owner: disorienting; you scroll and forget why rows are lit).
  3. Quick look = **two tables (MenACWY, MenB)**, each listing only groups that change that vaccine;
     the rest named in one line under it. Boxes are **short tinted bars (1–3 words) spanning the
     ages they cover**; blank = nothing due; "Same as healthy" in light grey.
  4. **No tags** (GIVE/SCDM/WAIT/NO cluttered). **No underlined group names.** No footnote numbers.
  5. Notes live **in each row's details**: a visible **"Details" button** per row opens a panel
     under the row; a second tap closes it.
  6. Series timings (0, 1–2, 6 months) must **never sit under an age column** (read as ages).
  7. Never explain with internal codes ("step 3, row d"); say how the group **differs from healthy**.
  8. Wording: **succinct clinical tone**, ≥/< signs, no prose (memory
     `app-wording-succinct-clinical-no-top-up`).
- Checked against the real engine (node import of `src/logic/recommend.js`, `today: '2026-11-19'`):
  every group × age (1, 5, 12, 14, 17, 20, 23, 30 y) first-dose label; college/military/travel/lab
  vs healthy with prior doses; outbreak teen 16-year booster; infant 3-dose shortcut when dose 2 is
  at ≥7 months. Booster wording in the mockup was copied from today's Rulebook screen, **not**
  re-checked against the engine.
- Found by the sweep: college differs from healthy only from 16 (a dose at ≥16 covers 5 years;
  ≥22 years still 1 dose); military only at ≥22 years and boosters "on basis of assignment".

## Owner's focus for the next brainstorm (her words, 2026-11-19)

1. **Colors intentional, not busy.** Every tint must mean one thing; audit the current bars,
   detail panel, highlighted rows, chips. Fewer colors is the default answer.
2. **Clean default view; sections expand** with enough text that the reader has an **actionable
   next step** (what to give, when).
3. **Boosters need a time window.** "Boosters" / "Every 5 years" without "from when" is not
   useful. Each booster line should say the interval *from what* (last primary dose, last
   booster) and the window (e.g. due date, earliest date). Consider a worked date example.
4. **Two jobs for the rulebook:** (a) make complex meningococcal rules simple to learn;
   (b) be a resource to **validate the vaccine tool** (a reader can check a card against it).
   Job (b) suggests each expandable section keeps its engine-run worked patient (the existing
   guard `regression-2026-11-19-rulebook-screen-matches-the-engine.test.jsx` already runs 69).

## Still open (ask, don't default)

- Two tables vs one: recommended two; owner hasn't said yes in words.
- "Why is this group at higher risk?" sentences: no CDC sentence on file (`src/data/refs.js`);
  needs a live read first (verify-clinical-source skill) if she wants them.
- Known mockup rough edge: the Details panel sits inside a wide table that scrolls sideways on
  narrow screens, so part of it can be off-screen.
- Carried from the superseded handoff: **STOP H** (owner reviews the rulebook; PR #120); two wording
  questions not yet asked in the clinical-questions format — healthy MenB "wanes within about a
  year" vs ACIP "1–2 years" (card text, `doseRules.js` ~line 372) and high-risk MenB boosters
  "every 2 years" vs sources' "every 2–3 years"; §2's "P0-1 (2026-07-23)" is not `owner:P0-1`.
  Then Phase 8 (citations; ask Q12 at its start).

## Why this is a good stopping point

The mockup is a self-contained design draft; nothing in `src/` changed, so PR #120 is unaffected.
The next step is more design discussion, not code.

## Resuming

1. `git fetch && gh pr view 120`. If merged: `git checkout main && git pull --ff-only`; else stay
   on `port/phase7-rulebook-screen` and ask before stacking. Confirm `npm test` = **2,247 / 180**.
2. `preview_start {name: "MeningoVax dev server"}`; current screen at `/MeningoVax/?rules`.
3. Read the artifact (Artifact tool, `action: "read"`, the URL above) and republish to the **same
   URL** for each new mockup round. Load the design-review skill first (no icons/emoji, no pills,
   tokens only, white header).
4. Work the four focus points above as mockups (she decides from pictures, not descriptions).
   Every clinical clause in new wording needs a source quote (memory
   `proposed-wording-needs-a-source-too`); run claims through the engine before stating them
   (memory `measure-before-claiming-in-an-owner-question`).
5. Building the real screen afterwards: `src/data/rulebookPage.js` (text, numbers from constants
   only) and `src/components/Rulebook.jsx` (layout); keep the guard test green; branch → PR against
   `main` → owner merges (ship skill).
