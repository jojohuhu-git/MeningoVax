> **SUPERSEDED 2026-11-27** by `handoff-2026-11-27-meningovax-table8-quote-menb-min-cite.md`. PR #164 merged; the Table 8 quote (#165) and the MenB minimum line (#166) are built; vaxapp is retired. Do not resume from this file.

# MeningoVax — Handoff after Q5c and the pregnant F2a case (2026-11-27)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-pregnancy-combined-shot.md`.

Branch `tier3/preg-f2a-no-line`, off `main` at `199aa03`, pushed with this handoff; its PR is
opened right after (check `gh pr list --head tier3/preg-f2a-no-line`). Claude squash-merges
MeningoVax PRs after the `test` check passes (owner, 2026-11-26); ask before merging a PneumoVax
or vaxapp PR. Baseline was **2,736 passing (235 files)**; now **2,739 passing, 0 failing (235
files)** (measured with `vitest run --reporter=json`).

**Dev server:** 5 Vite servers from other chats already serve this folder (ports 5175–5179). This
session opened `http://localhost:5178/MeningoVax/` with `preview_start {url}`.

## What's done

1. **PREG-PENTA, PR #162:** already merged on arrival (`e3337a1`). Nothing to do.
2. **Q5c, PR #163 (merged, `199aa03`):** owner "Keep in view". On a serogroup B outbreak's
   "Complete (outbreak booster given)" card, "Public health may advise it from 6 months after the
   series" stays in view once the card is opened (Q5a's "behind Why this" covered only the
   booster-due card). No app change. The Q5 test now checks placement on both cards; it fails if
   the "Complete" card folds. 0 saved patients reach that card; checked live (22-year-old,
   Bexsero Jan 6 and Jul 15, 2025, booster Mar 1, 2026). Recorded in
   `decisions-2026-11-22-tier1-q1-q5.md`.
3. **Pregnant F2a gap (this branch):** owner "No change". A pregnant at-risk patient whose MenACWY
   is due and whose MenB dose 2 can be given but is not due gets no combined shot and no reason
   line (the box shows only when both are due). Checked live. 3 tests added to the PREG-PENTA
   guard; recorded in `decisions-2026-11-26-pregnancy-combined-shot.md`; `testing.md` counts
   updated. 0 answers or sentences moved.
4. **vaxapp parity check:** asked; owner "Not now". Still on the list below.

## What's NOT done: the remaining queue

- **vaxapp parity (owner "Not now", 2026-11-27):** does vaxapp
  (`/Users/joannehuang/Downloads/vaxapp-main`, `buildOptimalSchedule.js` M11) offer
  Penbraya/Penmenvy in pregnancy? Read-only measure, then ask. Don't start it unless the owner
  raises it again.
- **PneumoVax card sentences:** the design-review skill says MeningoVax copy-style rules apply to
  PneumoVax too. Em dashes there are not measured. Measure first (`npm run prose` there), then ask.
- **Serogroup B outbreak numbers have no quote:** the 740 `acip2020Table8` numbers have none. A
  quote needs a live read of ACIP Table 8. Citation only, so decide alone under Q12 if no dose
  changes.
- **Seen, not checked:** MenB dose 2's "Earliest valid date: … (minimum interval 4 weeks)" and the
  complement infant's "Early doses are ≥8 weeks apart" carry no source number (Q12 territory).
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)
- **Last:** Phase 9 close.

## Why this is a good stopping point

Both open owner questions from the last handoff are answered and locked by tests. Nothing in the
queue waits on this branch except its own merge. The remaining items are independent.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`.
2. If the `tier3/preg-f2a-no-line` PR is still open and `test` passed, squash-merge it. Run
   `npx vitest run`; expect **2,739 passing (235 files)** unless `main` moved.
3. Open the app: `preview_start` name `MeningoVax dev server`, or an already-running one by URL
   (`lsof -iTCP -sTCP:LISTEN`).
4. Next: the Table 8 outbreak quote (Q12: decide alone if no dose changes), or the uncited
   minimum-interval lines. Per item: failing test → fix → full suite → live check → commit named
   by ID; `npm run sweep:update` and `npm run prose -- dump/diff` counts in the PR; a new test file
   updates `docs/agent/testing.md`.
5. Open the PR against `main`; Claude merges it after the check passes.
