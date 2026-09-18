# MeningoVax — Handoff after U1 merged and P2-1 built (2026-09-17)

Repo: `~/Downloads/MeningoVax-main`. Live: https://jojohuhu-git.github.io/MeningoVax/
A standalone client-side meningococcal advisor (MenACWY + MenB + pentavalent). No
backend. Sibling of vaxapp/PediVax and PneumoVax.

Branch: `refactor/p2-1-intervals-one-place`, off `main`, **pushed**, in sync with its
remote at **`129eef2`**, working tree clean. Open as **PR #33**, Tests check **green**,
NOT merged — left for the owner's review.

`main` is at **`91d7136`** (PR #32, squash-merged this session, branch deleted; Tests and
"Deploy to GitHub Pages" both green, and the deployed bundle was re-checked by `curl`,
not a browser tab).

Baseline at the start of this session was **951 passing (97 files)**. On this branch:
**1229 passing (99 files), 0 failing, 0 failed suites.**

Source queue: `.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`.
This handoff **supersedes** `handoff-2026-09-17b-copy-block-u2-u3-u4-merged.md`.

## What's done (by item ID)

1. **U1 — MERGED, PR #32, squash `91d7136`, deployed.** A card's note is authored once as
   `{ lead, detail }`: the card always shows the lead (what to do for THIS patient) and
   puts the detail behind a **"Why this"** disclosure. All 32 note sites converted — the
   32nd being the pentavalent panel, which now renders through the exported `RecNote`, so
   the family-lock sentence is written once instead of twice. Median lead **76**
   characters, none over 140, enforced by a 61-note sweep. `noteCites` stays ONE ordered
   list across both halves (lead's `[c]` markers first, then detail's).
   No clinical rule changed. Two deliberate wording changes: the internal marker "D6:" no
   longer prints on a clinical card, and the 7–11-month card names what its 12-week
   interval runs from. On the healthy-MenB card the two cited claims swapped halves, so
   their sources swapped order; a test pins it.
   New test-only helpers: `src/test-note-text.js` (`noteText()`, deliberately NOT exported
   from recommend.js) and `src/test-why-this.js` (`openWhyThis()`).

2. **P2-1 — BUILT, PR #33 OPEN, CI green, three commits.** `intervals.js` now owns every
   interval, and no file outside it hand-types one.
   - `f1dc56c` group 1 — the ≥2y high-risk 8-week primary gap (was written 4x in code,
     2x in English).
   - `1bebbb7` group 2 — the booster cadences. Four branches each had their own
     "3 or 5?" test; five more places spelled the answer out on the card. The outbreak
     top-up keeps its OWN named constants with a comment saying why (ACIP Table 8, keyed
     off age NOW, not completion age), and MenB's "2–3 years" label sits beside its
     2-year floor so nobody shortens the prose to the floor.
   - `129eef2` group 3 — the six MenB month floors, the infant 12-week gap two cards were
     still typing out, and `MENACWY_REPEAT_DOSE_FLOOR` — the 4-week repeat rule that
     became the infant primary interval and caused P0-1. It now carries a name and a
     comment saying what it is *not*.
   **Proof of no behaviour change:** a worktree at `origin/main` and this branch were each
   run over **2,784 cases** (12 risk sets × 29 ages × 8 histories), dumping every card in
   full plus every per-dose verdict from both validators. Byte-identical except ONE
   sentence — the deliberate rewording in group 1 so the number interpolates.

## What's NOT done — the remaining queue

- **P2-2** — the written roadmap for reusing `intervals.js` in vaxapp. Not a code change.
  This is the last item in `fix-2026-09-17-rule-foundation-and-copy.md`.
- **Owed to PneumoVax** — U4's copy-style changes, under the cross-app parity rule the
  queue file states. Not started.
- **vaxapp ports remain on HOLD.** vaxapp still has the P0-1 infant-interval bug at
  `recommendations.js:631,:633` and `scheduleRules.js:48,:50`, and the MenB dose-3 defect.
  The two apps knowingly disagree until a separately authorised port.
- **Found live, reported not fixed (a task chip was filed):** editing the age in place on
  the results page can leave a card showing only its header. `RecCard` does
  `useState(!collapsible)` and never re-syncs, so a card that mounted collapsible (MenB
  "Not yet age-eligible" at 2 months) stays collapsed once an age change makes it a due
  card — header, no chevron, no body. That line dates from PR #4; a reload renders it
  correctly. Reproduction is in the chip and in PR #32's body.
- **Still true from the previous handoff:** `sweep-dose-counter.test.js` (~lines 75–77)
  carries its own copy of the chip-label rules.

## Why this is a good stopping point

U1 is merged and live; P2-1 is complete as a unit with all three interval groups migrated
and a scan proving no file outside `intervals.js` hand-types a clinical interval. Nothing
in the remaining queue depends on either: P2-2 is a document, and the PneumoVax copy port
is a different repo. The only thing outstanding on this branch is the owner's read of
PR #33.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout refactor/p2-1-intervals-one-place`
   (or `main`, if PR #33 has been merged by then — check first).
2. Run `npx vitest run` and confirm **1229 passing, 0 failed suites** before any new work.
   Check `numFailedTestSuites`, not just failed tests: a file that crashes while LOADING
   reports 0 failed tests and still fails CI. That happened this session — the first push
   of PR #32 was reported green locally and failed in CI for exactly that reason.
3. **Ask, don't default:** whether to merge PR #33, and which is next — P2-2 (the vaxapp
   roadmap), the PneumoVax copy port, or the RecCard collapse bug. The vaxapp clinical
   ports stay on HOLD until the owner authorises them.
4. Per item: reproduce → failing test first → fix → full suite green (quote the real
   number) → live-verify in the running app → commit named by the item ID.
5. Push policy: `main` is not protected here, but the habit is branch → PR → squash merge,
   and outward-facing copy changes are left for the owner to read first.

## The dev-server trick worth keeping

`preview_start` refuses with "Maximum 5 dev servers per folder" because other chats hold
all five slots, and killing the process does not release the count. But those chats' vite
servers are usually still RUNNING on this same working tree — check **ports 5179–5181,
path `/MeningoVax/`** — and can be driven read-only for live verification. That is how
both PRs in this session were checked on screen. Do not give up on live verification
because a slot is unavailable.
