# Map of This Project (plain English)

MeningoVax — the meningococcal-only vaccine advisor (MenACWY + MenB).
Live at https://jojohuhu-git.github.io/MeningoVax/

This file explains what every folder and file is for, in plain language.
If you only remember one rule: **new notes never go in the top level of this
folder — they go where the table at the bottom says.**

> Note: this folder is cloud-synced (iCloud/Downloads). If an edit seems to
> "disappear," it may have been reverted by sync — re-apply it.

## The app itself (the working parts)

| Folder / file | What it is |
|---|---|
| `src/` | The app's working parts. This is where the actual program lives. |
| `src/components/` | The screens, cards, and buttons you see on screen. |
| `src/logic/` | The "brain" — `recommend.js` decides what's due; `validate.js` checks recorded doses, using the rule table in `doseRules.js` (one row per rule). |
| `src/data/` | The facts the brain uses: brands, risk factors, schedules. |
| `src/test-grid.js` | A list of made-up patients (every age, risk tick and vaccination history worth testing). Used only by the tests, never shipped. |
| `public/` | Images and files shipped with the app exactly as-is. |
| `index.html` | The single web page the app loads into. |
| `scripts/` | Helper tools, not part of the app. `check-root-notes.sh` is the save-time guardrail that stops a stray note landing in the top level. `updateSavedAnswers.mjs` (run as `npm run sweep:update`) rewrites the saved answers below and prints how many patients' answers changed. `proseDiff.mjs` (run as `npm run prose -- dump <file>`, then `diff`) counts how many patients would read different wording after a wording change. `wholeApp/` (run as `npm run whole-app`) follows every made-up patient down every road the app advises, years ahead, and asks whether the app agrees with itself: is a dose it advised accepted, does "Complete" stay complete, do the pentavalent and the two separate shots end in the same place. It lists what it finds; it fixes nothing. |
| `src/logic/__tests__/__saved__/` | The saved answers: what the app tells each made-up patient in `src/test-grid.js`, one line per patient. A test fails if any answer changes, so a change that moves answers has to say how many and why. One file for real patients, one for impossible entries (a dose before birth, after today, or the same shot on two rows). |
| `scripts/cdsi/` | CDC's CDSI files for meningococcal vaccines (CDC's own rules in machine form, and CDC's test patients), version 4.65. `runTestCases.mjs` runs CDC's 104 meningococcal test patients through the app and lists where its answer differs from CDC's software, each difference sorted into a named family (the comparing lives in `cdsiCore.mjs`). It fixes nothing. Since 2026-11-15 a test fails if a new difference appears or any of the 104 answers moves without being explained. `README.md` there says what each file is and how to run it. |

## Instructions and manuals

| Folder / file | What it is |
|---|---|
| `CLAUDE.md` | The instruction sheet the AI assistant reads at the start of every session. Short on purpose. |
| `MAP.md` | This file — the building directory. |
| `README.md` | The public description of the app for anyone visiting the code online. |
| `docs/agent/` | The technical manuals (architecture, clinical rules, testing rules). |
| `docs/archive/` | Session notes, handoffs, past reviews, kept for history. **Two kinds of file here are current:** a handoff with no "SUPERSEDED" or "done" banner at its top, and a `--SEE-PNEUMOVAX.md` pointer to a plan shared with PneumoVax (today: the MeningoVax port plan). Everything else is history. |

## Machine-managed — never edit by hand

| Folder / file | What it is |
|---|---|
| `dist/` | The packaged copy of the app that gets published. Rebuilt by machine; edits here are overwritten. |
| `node_modules/` | Third-party building blocks, downloaded automatically by `npm install`. |
| `package.json` / `package-lock.json` | The app's parts list and the exact versions in use. |
| `.claude/` | Settings and saved prompts for the AI assistant. |
| `.github/` | The instructions GitHub follows to test and publish the app on every change. |
| `.githooks/` | The save-time guardrail's hook (switched on by `npm install`). |
| `vite.config.js` | Build machinery settings. |

## Where do new things go?

| If a session produces… | It goes in… |
|---|---|
| A change to how the app looks or behaves | `src/` (plus a test) |
| A new rule for how agents must work | `CLAUDE.md` (only if it applies to every future session) |
| Technical detail worth keeping (architecture, clinical sourcing) | the matching file in `docs/agent/` |
| "What we did today" notes, handoffs, reviews, finished plans | `docs/archive/` |
| **Nothing** ever goes loose in the top-level folder. | |
