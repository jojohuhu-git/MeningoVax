> **SUPERSEDED 2026-11-19** by `handoff-2026-11-19-meningovax-errors-e1-e2.md` (E1 and E2 fixed; E3 and the other open items carried there). Do not resume from this file.

# MeningoVax — Handoff after Rulebook mockups v6–v9 and the Patient screen wording review (2026-11-19, latest)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early, re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). The
owner is a clinician: plain English, worked patients, ask, don't default. **Supersedes**
`handoff-2026-11-19-meningovax-rulebook-mockups.md`.

**PR #120 is MERGED** (squash, `443bef9` on `main`). Branch `port/phase7-rulebook-screen` is 1 commit
ahead of its remote (`848a79f`, the previous handoff + mockup v5; not pushed). Its only difference
from `origin/main` is docs in `docs/archive/` (checked with `git diff --stat origin/main HEAD`).
This session changed **no app code**: suite **2,247 passed, 180 files** (run 2026-11-19; nothing in
`src/` changed after it). New, uncommitted: this handoff,
`docs/archive/mockup-2026-11-19-rulebook-screen-v9.html`,
`docs/archive/decisions-2026-11-19-rulebook-mockup-q1-q5.md`, and the SUPERSEDED banner on the
previous handoff. (v6–v8 survive only as artifact versions 8–10.)

## What's done

**Live mockup:** https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr (artifact version 11 = "version 9"
on the page). Source: `docs/archive/mockup-2026-11-19-rulebook-screen-v9.html` (a page fragment; to
view it locally, wrap it in `<html><body>`, put a temporary copy in `public/`, open
`http://localhost:<port>/MeningoVax/<name>.html`, then delete the copy).

Three rounds with the owner (all direction recorded in memory `rulebook-screen-mockup-direction`):
- **v6:** a colour key (one meaning per colour, copied from App.css), steps closed by default,
  booster windows checked with `recommend()`, a full wording review of today's Rulebook screen.
- **v7** (owner: Details panels "too long"; wording "sounds like someone taking notes"): panels
  became a few full sentences; dropped "Next step", "Differs from healthy", the booster label list
  and the examples; everything rewritten in full sentences.
- **v8** (owner notes, then 4 clarifying answers): removed "Words used here" and "Check the app".
  "Read the record" became chip + one-line reason rows, using clinical terms (minimum age, minimum
  interval, invalid dose, not interchangeable). "Pregnant without risk factors". The birthday grace
  rule now reads "the app applies the schedule that needs fewer doses". The infant series now reads
  "the age at dose 1 determines how many are needed".
- **Patient screen review (v8, proposals only; nothing changed in the app).** Owner answers: scope
  is the Rulebook plus the Patient screen; propose first; chip-then-reason rows; placement means (1)
  next to what it explains, (2) long text behind a tap, (3) say it once. Method: rendered `Results`
  for the rulebook's 69 worked patients with every disclosure open (a temporary vite-node script,
  since deleted), then viewed one patient in the browser. On the page: 72 wording items in 10 groups
  (Now / Proposed / Why) and 7 placement items.
- **v9** (owner's last edits): units on every age; dose counts as words next to ages; Quick look
  legend removed; "Not counted — do not repeat" amber; "Bexsero"/"Trumenba" for 4C/FHbp (no "type");
  MenB dose 2 "at 1 month" with "ACIP allows 1–2 months" in Details. **Q1–Q5 answered**:
  `docs/archive/decisions-2026-11-19-rulebook-mockup-q1-q5.md`.
- **Errors found (engine-checked, not fixed):**
  1. Healthy patients aged 11–15: the MenACWY "Why this" offers a pentavalent "if MenB is also being
     started under shared clinical decision-making", which never applies under 16 (patient: healthy,
     born 2012-06-01).
  2. Healthy 9-year-old, MenB "Why this": the 10–15 indication list leaves out a serogroup B
     outbreak, yet the app gives a 12-year-old in a B outbreak "Dose 1 of 3 (high-risk series)".
  3. A later MenB booster's note says "1 year after the primary series" under the label "every 2–3
     years" (patient: asplenia, born 2006-06-01, Bexsero series ended 2024-07-01, booster 2025-07-01).
  Wording slips: the A/C/W/Y outbreak note says 5 years twice; "Boosters: 1 more - at age 16".
- **Live source read 2026-11-19:** CDC SCDM page (no longer used on the page after v8; not added to
  `refs.js`).

## What's NOT done — ask, don't default

1. The owner reviews v8: the Rulebook screen, the Rulebook wording review, the Patient screen
   wording (72 items) and placement (7 items). She approves, edits or rejects each.
2. Q1–Q5 are answered (decisions file above). **Remind the owner to check PneumoVax** for the Q5
   amber rule (her request) before any label colour is built; a design change here is mirrored there
   (design-review skill).
3. Errors 1–3 above: fix-queue skill, one at a time (failing test → fix → suite → `npm run prose`
   diff → live check → commit by ID). Ask before starting; they are card text the owner hasn't seen.
4. Carried: "why higher risk" sentences (needs a live read); §2's "P0-1 (2026-07-23)" is not
   `owner:P0-1`; **STOP H**; then Phase 8 (ask Q12 at its start).

## Why this is a good stopping point

Nothing in `src/` changed. v8 is one complete round for the owner to review, covering both screens.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch`. The rulebook PR is merged; put
   these docs on a fresh branch from `main` (ask first; for example cherry-pick `848a79f` plus a docs
   commit). Confirm `npm test` = **2,247 passed / 180 files**.
2. `preview_start {name: "MeningoVax dev server"}`. Load design-review. Republish to the **same
   artifact URL** each round.
3. Apply the owner's answers. Any new clinical clause needs a source quote; run claims through
   `recommend()` first.
4. When building: the Rulebook text goes in `src/data/rulebookPage.js` (no typed numbers; each claim
   keeps a worked patient `ex` for the guard test, even though the screen no longer shows it), and the
   layout in `src/components/Rulebook.jsx`. Patient screen wording changes are engine/component text:
   count them with `npm run prose -- dump` before and after, and put the number in the PR (CLAUDE.md
   "A moved answer must be explained"). Chip labels are a closed owner list (`doseChipLabel.js`).
5. Ship skill: branch → PR against `main` → owner merges.
