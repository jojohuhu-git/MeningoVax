> **SUPERSEDED (2026-09-17)** — see
> [`handoff-2026-09-17c-u5-stale-collapse-state-merged.md`](handoff-2026-09-17c-u5-stale-collapse-state-merged.md).
> `main` has moved on twice since this file was written: PR #32 (U1) and PR #34
> (U5). The test count quoted below (**951**) is the count at PR #31 and is no
> longer the baseline — `main` is now **1201 passing (99 files)**. Do not resume
> from this file.

# MeningoVax — Handoff after the copy block (U2, U3, U4) merged (2026-09-17)

> **SUPERSEDED — 2026-09-17.** U1 and P2-1, listed below as the remaining queue, are
> both done: **U1 merged as PR #32** (squash `91d7136`, deployed) and **P2-1 built and
> CI-green in PR #33**, awaiting the owner's review. Do not resume this file's queue.
> Current state and resuming instructions:
> `docs/archive/handoff-2026-09-17c-u1-merged-p2-1-open.md`.



Repo: `~/Downloads/MeningoVax-main`. Live: https://jojohuhu-git.github.io/MeningoVax/
The app is a standalone client-side meningococcal advisor (MenACWY + MenB +
pentavalent). No backend. Sibling of vaxapp/PediVax and PneumoVax.

Branch: `main`, clean, in sync with `origin/main` at **`eed35a6`**.
**MERGED 2026-09-17** — PR #31, squashed, branch deleted. Tests and "Deploy to
GitHub Pages" both green. Baseline at the start of this session was 906 passing;
`main` is now **951 passing (97 files), 0 failing**.

The deployed bundle was re-checked by `curl`, not a browser tab, so cache could
not fake it: `assets/index-Bv0euJvb.js` contains every new string and none of the
old ones.

Source queue: `.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`.
This handoff **supersedes** `handoff-2026-09-17-rule-foundation-p0-p1-done.md`.

## What's done (by item ID)

1. **U2** — the booster cadence was printed twice on the same card. The tail is
   deleted from 17 notes across MenACWY and MenB; where the tail WAS the whole
   note (a second or later booster) the note is now `null`, because the booster
   line already said all of it. On the **outbreak** cards it was worse than
   repetitive: the note promised "a first booster in 3 years … then every 5 years
   while at risk" two sentences before `outbreakTopUp` said no standing booster
   schedule exists. `rec()` gained **`boosterCites`** (same ordered "one entry per
   `[c]`" contract as `noteCites`), so a deleted sentence's sources moved to the
   line that now makes the claim instead of vanishing; `RecCard.jsx` renders the
   booster line through the same helper, seeded FIRST in the card's citation
   numbering because that line sits above the recorded doses.
2. **U3** — `validate.js`'s answered-yes verdict ran to 154 characters and
   repeated verbatim on every counted row. Two of its three clauses were already
   on the row: "counted toward the series" is what the `Dose N of M` chip means,
   and "in response to the risk-timing question" is the `Edit` button beside it.
   Now `Counted — high risk confirmed at ~9 weeks.` (42 chars). Both copies fixed
   (MenACWY and its MenB twin).
3. **U4** — two chips reworded (`Given — not part of a series this patient needs`,
   `Extra dose — more than this series needs`), the military-recruit note now
   leads with the action and is a sentence shorter, and **ages now round DOWN**
   (see below). `Off-window - repeat` was deliberately NOT touched: that wording
   is a settled design decision from the 2026-07-23 handoff.

### The owner decisions this session recorded — apply, don't re-litigate

- **Ages round DOWN.** `fmtAgeMonths` floors, with a 1e-6 epsilon so an age that
  is exactly five years but arrives as 59.9999999 still prints "5 years". A
  patient is not 16 until their 16th birthday. This fixed SEVEN verdict sentences
  ("Given at ~16 years, before the age-16 booster window") **and** the dose-row
  label from one place. Display only — nothing clinical reads those strings; the
  engine and validator work in months through `ageMeetsMinimum()`, untouched, and
  CDC's 4-day grace window is untouched.
- **U1 scope: ALL 32 notes**, not just the 17 over 200 characters. A mix of some
  cards with a "Why this" link and some without was rejected.

No clinical rule changed anywhere in PR #31 — no interval, age floor, series
total or eligibility gate. `rule-docs-match-code.test.js` is green with neither
rule document edited, which is the expected result for a copy-only change.

## What's NOT done — the remaining queue

From `.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`:

- **U1** — give `note` a `{ lead, detail }` shape and render `detail` behind a
  "Why this" disclosure. Do NOT write a short version alongside the long one.
  **Scope is now decided: all 32 notes.** After U2/U3 the notes measure median
  **151** characters (was 212), longest 514, **12** over 200 (was 19); target for
  a 1–2 liner at this card width is ~90–140.
- **P2-1** — finish `intervals.js`. It owns the MenACWY infant primary group and
  the grace rule. Still hand-typed elsewhere: the ≥2y high-risk primary, the 3-
  and 5-year booster cadences, and the MenB month floors. (Its "4-month rescue
  interval" bullet is already done, via PR #30.) Do one group at a time, suite
  green between groups.
- **P2-2** — the roadmap to reuse on vaxapp. Not a code change.
- **Owed to PneumoVax:** U4's copy-style changes, under the cross-app parity rule
  the queue file states. Not started.

**New finding this session, reported not fixed:** `sweep-dose-counter.test.js`
(around lines 75–77) carries its OWN copy of the chip-label rules, so it agreed
with `RecCard.jsx` only by coincidence and had to be edited in step with U4. That
is the same one-rule-two-copies shape this whole queue is about, living in a test.
It deserves its own item — the test should read the labels from the component, or
the labels should move to a module both can import.

**Still on HOLD (owner's explicit instruction, unchanged):** the cross-repo
agreement fixture, the two owed vaxapp parity ports, and porting corrected rule
text to vaxapp's copy of the summary. **vaxapp still has the P0-1 infant-interval
bug** (`recommendations.js:631,:633`; `scheduleRules.js:48,:50`) and the MenB
dose-3 defect (`stateHelpers.js:437`), both deliberately untouched — the two apps
knowingly disagree until a separately authorised port. vaxapp's working tree was
already dirty when this session started (a finished-but-uncommitted infant-interval
port); nothing in it was touched.

## Why this is a good stopping point

The copy block is finished as a unit, merged, deployed and verified on the live
bundle. What remains is one large, self-contained piece of work (U1) and one piece
of structural surgery on working clinical logic (P2-1); neither blocks the other,
and U1's only open decision is now answered. Nothing is half-built: no skipped
tests, no partial items, no uncommitted work in this repo.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout main && git pull` — `eed35a6`.
2. Run `npx vitest run` and confirm **951 passing (97 files)** before new work.
3. **Ask, don't default:** U1 or P2-1 first? They are independent. U1 is the
   bigger and more visible of the two; P2-1 is invisible to users but removes the
   drift that caused P0-1 (a 4-week interval where ACIP requires 8).
4. Per-item workflow, unchanged: reproduce first and paste the real output into
   the commit → write the failing test and watch it fail → fix → full suite green,
   quote the real count → live-verify in the running app in both directions →
   commit named by the item ID. Clinical items additionally need a live-fetched
   quote in the commit body and **both** rule documents updated in the same
   commit — `rule-docs-match-code.test.js` enforces it.
5. **Push policy:** `main` is unprotected here, but the habit (PRs #18–#31) is
   branch → PR for the owner's review. She approved the merge of #31 explicitly
   before it was merged. **Do not merge without her say-so.**

## Two practical notes

- **Dev server:** the folder's 5 preview slots are usually held by other chats,
  and killing the process does not release the count. This session could not start
  one either — it attached to an already-running MeningoVax vite server instead
  (`lsof -nP -iTCP -sTCP:LISTEN | grep node` found it on **5179**, then
  `preview_start {url: "http://localhost:5179/MeningoVax/"}`). Because vite serves
  this same working tree, edits appear live. That is the reliable workaround.
- **CDC pages** carry a court-order banner (*AAP et al. v. Kennedy*) freezing the
  schedule at 2 July 2025. Expect citation-freshness churn; that is why the pages
  will not have moved.
