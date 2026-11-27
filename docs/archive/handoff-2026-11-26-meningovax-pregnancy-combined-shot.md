# MeningoVax — Handoff after PREG-PENTA, the combined shot in pregnancy (2026-11-26)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-26-meningovax-tier3-em-dashes.md`.

Branch `tier3/pregnancy-combined-shot`, off `main` at `ca8b5f1`, pushed. PR
[jojohuhu-git/MeningoVax#162](https://github.com/jojohuhu-git/MeningoVax/pull/162). Claude merges it
(squash) after the `test` check passes (owner, 2026-11-26). Baseline was **2,723 passing (234 files)**;
now **2,736 passing, 0 failing (235 files)** at commit `2973275` (measured with
`vitest run --reporter=json`).

**Merging (owner, 2026-11-26): Claude merges MeningoVax PRs** (squash) and resolves the conflicts
between them. Keep a session's handoff on its work branch. This permission covers MeningoVax only:
ask before merging a PneumoVax or vaxapp PR.

**Dev server:** this folder already had 5 Vite servers from other chats (the app's per-folder limit),
all serving this same folder. This session opened `http://localhost:5178/MeningoVax/` with
`preview_start {url}` instead of starting a sixth.

## What's done

1. **PneumoVax #164** (date-of-birth messages, no em dash) was already merged on arrival. Nothing to do.
2. **PREG-PENTA** (owner "Separate shots", `decisions-2026-11-26-pregnancy-combined-shot.md`). A
   pregnant patient at increased risk (asplenia, complement, microbiologist, serogroup B outbreak)
   is no longer offered the combined MenABCWY shot. The blue two-vaccines box says: "Not an option
   today: no high-quality data on the combined shot in pregnancy [1][2]. Give MenACWY and MenB
   separately [1][2]." Four quotes, read live 2026-11-26 in a real browser, are now in `refs.js`
   (`pentavalent{Gsk,Pfizer}NoPregnancyData`, `pentavalent{Gsk,Pfizer}PregnancySeparateAcwy`).
   Pregnancy outranks the 6-month rule. The engine change is in `recommend.js`
   (`pentavalent.unavailableCites`), the display in `PentavalentUnavailableReason` (`RecCard.jsx`),
   and the Rulebook screen got a row and a worked patient (`rulebookPage.js`). The rulebook §3 and
   `clinical-rules.md` are updated.
   **Moved:** 1,111 of 23,788 answers and 314 of 7,372 impossible entries (combined-shot offer
   only, every one pregnant). **Wording:** 1,127 real patients (the 1,111, plus 16 already blocked
   by the 6-month Penmenvy rule who now read the pregnancy reason). **Wording differs from the
   approved preview:** the preview said "no data"; the app says "no high-quality data", because
   Penmenvy's report says that. Told the owner in the PR.
   Guard: `regression-2026-11-26-preg-penta-separate-shots-in-pregnancy.test.jsx` (7 of 13 fail
   with the fix taken out). Live-checked: pregnant 19-year-old with asplenia (line, four pop-ups,
   no console errors), and the same patient not pregnant (both options still offered).

## What's NOT done: the remaining queue

- **Next, for the owner:** the serogroup B outbreak "Complete" card's lead says "Public health may
  advise it from 6 months". Measure first, then ask with a worked patient.
- **Seen, not checked (parity):** vaxapp (`/Users/joannehuang/Downloads/vaxapp-main`) also offers
  Penbraya/Penmenvy and has pregnancy logic (`buildOptimalSchedule.js` M11). Whether it offers the
  combined shot in pregnancy was not checked. Measure there, then ask (consequence of PREG-PENTA,
  so it is a question, not owner-decided).
- **Seen, not checked:** a pregnant patient whose MenB dose 2 "can be given today" but is not due
  (F2a) loses the combined shot with no reason line, because the blue box only appears when both
  are due. 0 saved test patients reach it (all 1,127 changed patients see the line).
- **PneumoVax card sentences:** the design-review skill says MeningoVax copy-style rules apply to
  PneumoVax too. Its card sentences were not measured for em dashes. Measure first
  (`npm run prose` there), then ask.
- **Seen during C12:** the 740 serogroup B outbreak numbers (`acip2020Table8`) have no quote. A
  quote needs a live read of ACIP Table 8 (citation only under Q12 if the dose is unchanged).
- **Seen, not checked:** MenB dose 2's "Earliest valid date: … (minimum interval 4 weeks)" and the
  complement infant's "Early doses are ≥8 weeks apart" carry no source number.
- Optional owner question in #155: should the grey "CDC Child/Adolescent Notes" button open a
  section too? (Default kept: no, as in PneumoVax.)
- **Last:** Phase 9 close.

## Why this is a good stopping point

PREG-PENTA is complete in MeningoVax, guarded, live-checked and in an open PR. Nothing else in
the queue depends on it. The vaxapp parity check is independent.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`.
2. Confirm #162 merged (`gh pr view 162 --json state`). If it is still open and its `test` check
   passed, squash-merge it. Run `npx vitest run`; expect **2,736 passing (235 files)** unless
   `main` moved. Re-measure.
3. Open the app: `preview_start` with name `MeningoVax dev server`; if the 5-server limit
   blocks it, open an already-running one by URL (check `lsof -iTCP -sTCP:LISTEN`).
4. Next: the outbreak "from 6 months" lead (measure, then ask). Ask the owner whether to check
   vaxapp for the pregnancy combined-shot case.
   Per item: failing test → fix → full suite → live check → commit named by ID; `npm run
   sweep:update` and `npm run prose -- dump/diff` counts in the PR; a new test file updates
   `docs/agent/testing.md`.
5. Open the PR against `main`; Claude merges it after the check passes.
