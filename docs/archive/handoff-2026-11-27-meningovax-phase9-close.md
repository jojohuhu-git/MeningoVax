# MeningoVax — Handoff after Phase 9: the PneumoVax port is finished (2026-11-27)

Repo: `/Users/joannehuang/Downloads/MeningoVax-main` (iCloud-synced: commit early; re-apply an edit
that "disappears"). Live at https://jojohuhu-git.github.io/MeningoVax/ (deploys from `main`). Owner
is a clinician: plain English, short questions with a worked patient; ask, don't default.
**Supersedes** `handoff-2026-11-27-meningovax-table8-quote-menb-min-cite.md`. vaxapp is retired.

Branch `phase9/close`, off `main` at `0011dde` (#168 merged), pushed with this handoff; its PR
holds the report, the age-line script and the doc updates. Claude squash-merges MeningoVax PRs
after the `test` check passes (owner, 2026-11-26). Baseline was **2,761 passing (238 files)**;
now **2,769 passing, 0 failing (239 files)** (measured with `vitest run --reporter=json`).

**Dev server:** 5 Vite servers from other chats already serve this folder (ports 5175–5179), so
`preview_start {name}` refuses a sixth. This session used `http://localhost:5178/MeningoVax/`.

## What's done

Full detail: `docs/archive/report-2026-11-27-phase9-close.md`.

1. **9.1a, every whole-app check re-run.** Checks 1 and 5 are at 0 (were 1,146/117 and 3,613/140
   on 2026-11-15). Everything still flagged follows an owner ruling (college 5-year cover D1/D9;
   outbreak "for this outbreak" on the due day; grace only at named lines B-1/D11), except one.
2. **PHASE9-D, PR #168 (merged, `0011dde`):** an infant's next MenACWY date, when the first
   birthday is the later line, printed a day late on most visits ("Dec 16" for a Dec 15
   birthday). `earliestGatedDate` (`intervals.js`) now reads the birthday when the date of birth
   is known. 0 saved answers and 0 words moved; check 7 "advised date moved" 5 → 0 and now in
   `whole-app-gate.test.js`. Guard `regression-2026-11-27-phase9-infant-date-from-birthday.test.js`.
   Checked live.
3. **CDSI:** 104 CDC test patients, 72 agree, 0 new disagreements; rule comparison 0 unaccounted.
4. **9.1b, E6 age-line audit (new):** `scripts/ageLineAudit/meningoLines.mjs`. 93 ordinary patients
   7/14/30 days either side of each line, graded against CDC's Child and Adult Notes read live
   today (the July 2, 2025 schedule, current under the March 16, 2026 court order): **93 of 93
   agree.** All 16 CDC quotes the app shows were found word for word on the live pages. 10 of 11
   deliberate breaks were caught. The 3-month infant line changes no answer since T1, so no
   patient can catch its break (wording only; listed for the owner, not a fault).
5. **9.2:** `ageEntry.js` has been shared since E2 (2026-11-26) but nothing named it. Now named in
   the `vaccine-parity` skill (`~/.claude/skills/vaccine-parity/SKILL.md`, outside the repo) and
   in MeningoVax `CLAUDE.md`. Code equal to PneumoVax `main`, comments aside.
6. **9.3:** plan banner "FINISHED 2026-11-27"; CLAUDE.md status line; MAP.md row for the new folder.

## What's NOT done: the remaining queue

All of it is PneumoVax work or optional. **The owner asked for the em-dash item last**, and will
propose other PneumoVax work in a new conversation first.

- **DONE 2026-11-27, PneumoVax #168.** **PNEUMO-AGEENTRY-GUARD (PneumoVax, from 9.2):** add a line to PneumoVax's `CLAUDE.md` beside
  "dateUtils.js Is Mirror-Synced", plus a guard test beside `regression-s6-4-…` comparing the two
  `ageEntry.js` copies, comments aside. **First switch the PneumoVax folder to `main` and pull:**
  it is on `chore/2026-11-17-remove-dead-undated-code`, 2 behind, and its `ageEntry.js` still shows
  the em dashes `main` removed (#164). A guard written on that folder would fail.
- **DONE 2026-11-27, PneumoVax #168** (owner: sentences like MeningoVax, headers in brackets, dose labels keep their dash). **PNEUMO-EM-DASH (last, owner):** MeningoVax's copy-style rules apply to PneumoVax too; em
  dashes in PneumoVax card sentences have not been measured. Measure first (`npm run prose` there,
  on `main`), then ask with screens. Chip labels keep their dash in MeningoVax (E1); ask whether
  the same holds there. See `decisions-2026-11-26-em-dashes.md`.
- **Optional owner question (#155):** should the grey "CDC Child/Adolescent Notes" source button
  open a section too? Default kept: no, as in PneumoVax.

## Why this is a good stopping point

The port plan's nine phases are all done and measured. The checks that remain flagged are listed
with the ruling behind each. Nothing left here blocks the PneumoVax work, and the PneumoVax items
need that folder brought up to date first.

## Resuming

1. `cd /Users/joannehuang/Downloads/MeningoVax-main && git fetch && git checkout main && git pull`.
   If the `phase9/close` PR is still open and `test` passed, squash-merge it.
2. Run `npx vitest run`; expect **2,769 passing (239 files)** unless `main` moved.
3. For PneumoVax items: work in `/Users/joannehuang/Downloads/PneumoVax` on a branch off a pulled
   `main`, with its own CLAUDE.md and handoffs. Ask, don't default, on the em-dash scope.
4. Per item: failing test → fix → full suite → live check → commit named by ID; moved answers
   and wording counts in the PR (`npm run sweep:update`, `npm run prose`).
