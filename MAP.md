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
| `src/logic/` | The "brain" — `recommend.js` decides what's due; `validate.js` checks recorded doses. |
| `src/data/` | The facts the brain uses: brands, risk factors, schedules. |
| `public/` | Images and files shipped with the app exactly as-is. |
| `index.html` | The single web page the app loads into. |

## Instructions and manuals

| Folder / file | What it is |
|---|---|
| `CLAUDE.md` | The instruction sheet the AI assistant reads at the start of every session. Short on purpose. |
| `MAP.md` | This file — the building directory. |
| `README.md` | The public description of the app for anyone visiting the code online. |
| `docs/agent/` | The technical manuals (architecture, clinical rules, testing rules). |
| `docs/archive/` | Old session notes, handoffs, past reviews. Nothing here is current; kept for history. Safe to ignore. |

## Machine-managed — never edit by hand

| Folder / file | What it is |
|---|---|
| `dist/` | The packaged copy of the app that gets published. Rebuilt by machine; edits here are overwritten. |
| `node_modules/` | Third-party building blocks, downloaded automatically by `npm install`. |
| `package.json` / `package-lock.json` | The app's parts list and the exact versions in use. |
| `.claude/` | Settings and saved prompts for the AI assistant. |
| `vite.config.js` | Build machinery settings. |

## Where do new things go?

| If a session produces… | It goes in… |
|---|---|
| A change to how the app looks or behaves | `src/` (plus a test) |
| A new rule for how agents must work | `CLAUDE.md` (only if it applies to every future session) |
| Technical detail worth keeping (architecture, clinical sourcing) | the matching file in `docs/agent/` |
| "What we did today" notes, handoffs, reviews, finished plans | `docs/archive/` |
| **Nothing** ever goes loose in the top-level folder. | |
