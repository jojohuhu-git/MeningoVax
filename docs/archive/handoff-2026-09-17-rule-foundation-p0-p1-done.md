# MeningoVax — Handoff after the rule-foundation queue's P0/P1 block (2026-09-17)

Repo: `~/Downloads/MeningoVax-main`. Live: https://jojohuhu-git.github.io/MeningoVax/
The app is a standalone client-side meningococcal advisor (MenACWY + MenB +
pentavalent). No backend. Sibling of vaxapp/PediVax and PneumoVax.

Branch: `fix/p0-1-menacwy-infant-primary-intervals`, off `main` (`1228f01`).
**Pushed. PR #28 is OPEN with CI green** — the owner reviews PRs herself, so it is
NOT merged. Baseline was 811 passing; now **882 passing (88 files), 0 failing**,
working tree clean at `d34a94d`.

Source queue: `.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`.
Its per-item order was **P0-1 → P1-3 → P1-2 → P1-1 → P1-4 → U1/U2/U3 → P2-1**;
this session did the first five, one commit each.

## What's done (by item ID)

1. **P0-1** (`af40746`) — the MenACWY infant primary series accepted doses 4 weeks
   apart where ACIP and CDC both require 8. Three defects, one root cause: the
   number was hand-typed in four places *and* written out again in English in the
   card sentence. Also found and fixed: the **final** primary dose had no age floor
   at all (a 6.5-month-old was told the 12-month dose was due today), and the
   advertised date ignored that floor. New `src/logic/intervals.js` — the sibling
   `seriesTotals.js` never got — owns the numbers; cards interpolate them. P1-3's
   old 3-dose-shortcut check in `validate.js` is deleted, now one case of the
   general rule.
2. **P1-3** (`6475089`) — `validate.js`'s `fmtAgeMClinical` was a copy of
   `format.js`'s `fmtAgeMonths` minus its carry-over fix, so the record panel
   printed "15 years 12 months". It now delegates, keeping only its two deliberate
   differences (`?` for a null age, lower-case `birth` — every call site is
   mid-sentence). Both differences pinned by tests.
3. **P1-2** (`2517c1f`) — high-risk MenB kept asking for dose 3 even when dose 2
   had landed ≥6 months after dose 1, which CDC says completes the series. A
   missing branch, not a misunderstood rule: the healthy mirror of the same
   six-month test was already there. `menbSeriesInfo()` owns the total;
   `recommend.js` now reads it instead of hard-typing 3.
4. **P1-1** (`582bb7e`) — CDC's "≤4 days early is still valid" rule was implemented
   **nowhere**. Three helpers in `intervals.js` (day counts, calendar months,
   ages), applied to 23 sites in `validate.js` and 3 in `recommend.js`. Ages are
   not converted with an averaged days-per-month constant — the helper re-derives
   the age as if the dose were 4 days later (P0-4/P0-5 are both averaging bugs).
5. **P1-4** (`d34a94d`) — split into two halves with opposite verdicts. **Half A**
   ("use Trumenba for MenB dose 2 after a Penbraya") was **already correct** via the
   antigen-family lock; no code changed, but the chain that makes it safe is now
   pinned by tests. **Half B** was a real defect: Penbraya was offered again two
   months after a Penbraya, where CDC requires 6. Scoped to Penbraya only — CDC
   does not mention Penmenvy at all (verified live).

Every clinical change carries a live-fetched quote in its commit body, updated
**both** rule documents, and was live-verified in the running app in both
directions. Six new doc-vs-code tripwires were added to
`rule-docs-match-code.test.js`, and I confirmed they fire (reverting P0-1's
constant fails 7 tests including the documentation one; reverting P1-2's branch
fails 7 more).

## What's NOT done — the remaining queue

**From the same queue file:**
- **U1** — give `note` a `{ lead, detail }` shape and render `detail` behind a "Why
  this" disclosure. `recommend.js` holds 32 notes, median 210 chars, max 514, 17
  over 200; target for a 1–2 liner is ~90–140. Do **not** write a short version
  alongside the long one. **Blocked on an owner decision — see Resuming §3.**
- **U2** — the booster cadence is printed twice on one card (the booster summary
  line and the tail of the note). Delete the tail; let the summary line own it.
- **U3** — the per-dose verdict repeats a ~150-char sentence on every row; on a
  four-dose infant series that is the same sentence four times.
- **U4** — copy-voice pass ("Recorded — not part of an indicated series" reads as a
  database state). Note the cross-app rule: copy-style changes made here must be
  applied to **PneumoVax**.
- **P2-1** — finish `intervals.js`. It currently owns only the MenACWY infant
  primary group plus the grace rule. Still hand-typed elsewhere: the ≥2y high-risk
  primary, the 3-/5-year booster cadences, the MenB month floors and the 4-month
  rescue interval. Do one group at a time, suite green between groups.
- **P2-2** — the roadmap to reuse on vaxapp. Not a code change.

**New findings this session (not in the queue, reported not fixed):**
- **A dose 3 given earlier than 4 months after dose 2 is discarded**, where CDC's
  own sentence says a **4th dose** should follow at least 4 months later. Verified
  with asplenia and doses at 0, 2 and 4 months: the app marks dose 3 `Invalid` and
  re-offers "Dose 3 of 3". So it throws away a dose CDC counts. Same family as
  P1-1. Needs its own item.
- **"Given at ~16 years, before the age-16 booster window"** still reads as
  self-contradictory for a dose 5–15 days early, because the age rounds up in a
  sentence that turns on an exact threshold. P1-1 narrowed this (doses inside the
  grace window no longer produce it) but did not remove it. Belongs in U4.
- **`recommend.js` still hand-types 25 `seriesTotal:` literals** next to the named
  constants holding the same numbers — the shape of the bug that created
  `seriesTotals.js`. Noted in the earlier rule review; still true.

**Still on HOLD (owner's explicit instruction, unchanged):** the cross-repo
agreement fixture, the two owed vaxapp parity ports, and porting corrected rule
text to vaxapp's copy of the summary. **vaxapp has the P0-1 bug too**
(`recommendations.js:631,:633`; `scheduleRules.js:48,:50`) and was deliberately
not touched — the two apps knowingly disagree on the infant interval until a
separately authorised port.

## Why this is a good stopping point

The entire P0 and P1 block is finished as a unit and sits in one reviewed-ready PR
with CI green. Everything remaining is either copy work (U1–U4) or structural
surgery on working clinical logic (P2-1) — neither blocks the other, and U1 has an
open owner decision in front of it. Nothing is half-built: no skipped tests, no
partial items.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git checkout fix/p0-1-menacwy-infant-primary-intervals`
   (or `main` once PR #28 merges — check `gh pr view 28` first, do not assume).
2. Run `npx vitest run` and confirm **882 passing** before any new work.
3. **Ask, don't default** — two open owner decisions:
   - **U1 scope:** does the lead/detail split apply to **all 32** notes, or only the
     17 that exceed 200 characters? The queue records this as open and not blocking,
     but it changes the size of the work considerably.
   - **The new dose-3 finding above:** CDC wants a 4th dose where the app demands a
     repeat. Fix it as its own item, or fold it into the P2-1 MenB interval group?
4. Per-item workflow, unchanged: reproduce first and paste the real output into the
   commit → write the failing test and watch it fail → fix → full suite green, quote
   the real count → live-verify in the running app both directions → commit named by
   item ID. Clinical items additionally need a live-fetched quote in the commit body
   and **both** rule documents updated in the same commit —
   `rule-docs-match-code.test.js` enforces it.
5. **Push policy:** `main` is unprotected here, but the established habit (PRs
   #18–#28) is branch → PR for the owner's review. **Do not merge without her
   say-so.**

## Two practical notes

- **Dev server:** the folder's 5 preview slots are usually held by other chats;
  killing the process does not release the count — ask the owning chat to stop its
  server. Also, the assigned port can be wrong: read the real port out of
  `preview_logs` and open it with `preview_start {url}`. This session ran on
  `http://localhost:5181/MeningoVax/`.
- **CDC pages** now carry a court-order banner (*AAP et al. v. Kennedy*) freezing the
  schedule at 2 July 2025. Expect citation-freshness churn; that is the reason the
  pages will not have moved.
