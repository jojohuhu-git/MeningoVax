# MeningoVax Agent Guide

## What This App Is

Standalone client-side React SPA for **meningococcal** vaccine clinical decision support (MenACWY + MenB + pentavalent MenABCWY). No backend, no auth, no DB. Sibling of PediVax (vaxapp) and PneumoVax; independent codebase. Live at https://jojohuhu-git.github.io/MeningoVax/

## Start Here

```bash
npm install
npm run dev        # dev server (port 5173, jumps if occupied)
npm test           # Vitest run
npm run build      # production build to dist/
```

Dev server config: `.claude/launch.json` (name: "MeningoVax dev server").

All public asset paths MUST use `import.meta.env.BASE_URL` (Vite sets `base: '/MeningoVax/'`).

The save-time guardrail (flags stray top-level notes — see Root Directory Hygiene) turns on automatically during `npm install`. If a session finds it off (e.g. a freshly re-downloaded copy), re-run `npm install` or `npm run prepare` to switch it back on, and remind the owner.

## Source of Truth Files

| What | Where |
|---|---|
| Plain-English folder guide (owner is a non-coder) | [MAP.md](MAP.md) |
| Architecture, file map, engine API, validation model | [docs/agent/architecture.md](docs/agent/architecture.md) |
| MenACWY/MenB clinical rules, schedules, booster cadence | [docs/agent/clinical-rules.md](docs/agent/clinical-rules.md) |
| Plain-English rules summary (owner-facing; source of truth, synced to vaxapp) | [docs/agent/meningococcal-rules-summary.md](docs/agent/meningococcal-rules-summary.md) |
| Test files and coverage requirements | [docs/agent/testing.md](docs/agent/testing.md) |
| Session history (2026-06-04 through 2026-06-13) | [docs/archive/agent-session-log.md](docs/archive/agent-session-log.md) |

## Non-Negotiable Rules

### Root Directory Hygiene
Only `CLAUDE.md`, `MAP.md`, and `README.md` live at the repo root. Never create new root-level `.md` files. Session notes/handoffs/reviews go to `docs/archive/`; durable knowledge goes to the matching `docs/agent/` file. Keep `MAP.md` current when folders change.

### Cloud-Sync Gotcha
This folder is iCloud-synced — edits can silently revert. If a change "disappears," re-apply it. Commit early.

### Clinical Authority
ACIP/CDC/AAP/immunize.org over FDA package inserts. Never revert to FDA-labeled ages without explicit instruction.

### Engine Logic Stays in the Engine
Brand eligibility, the MenB antigen-family lock, booster cadence, and dose validation are computed in `recommend.js` and `validate.js`. Do NOT re-derive clinical logic in components.

### Brand Strings — Do Not Strip in Engine
Engine brand strings carry an antigen suffix (`'Menveo (MenACWY)'`, `'Bexsero (MenB)'`). Tests assert these exact strings. Strip for display only via `stripAntigen()` in `RecCard.jsx` and `Results.jsx`.

### Booster Cadence — Keep recommend.js and validate.js in Sync
MenACWY high-risk booster timing is keyed off age at Dose 2 in BOTH files. Changing one without the other will produce inconsistent results (the engine predicts one interval; the validator flags a different one as too soon).

### MenB D3 — Both Floors Required
D3 is due after BOTH ≥6 months from D1 AND ≥4 months from D2. `earliestNextDate` = the later of the two. Enforced in both `recommend.js` and `validate.js`.

### Pentavalent — Dedicated Card Only
Penbraya/Penmenvy surface ONLY through the pentavalent card, never in the standalone MenB brand list. Eligible only when both MenACWY AND MenB are due today AND age ≥10y.

### college_dorm vs military vs acwy_outbreak
The ≥16y-dose-satisfies rule applies ONLY to `college_dorm`. Do not apply it to `military` or `acwy_outbreak`.

## Testing Expectations

- When changing the engine: add/adjust a test in `recommend.test.js`.
- When changing validation rules: update `validate-new-rules.test.js` and confirm `recommend.js` mirrors the same logic.
- Regression tests must fail when the fix is reverted.
→ See [docs/agent/testing.md](docs/agent/testing.md)

## Documentation Maintenance

| Content type | Destination |
|---|---|
| Current commands, required workflow, short non-negotiable rules | Root `CLAUDE.md` (this file) |
| Architecture, engine API, file map, validation model | `docs/agent/architecture.md` |
| MenACWY/MenB clinical rules, booster cadence, risk factor details | `docs/agent/clinical-rules.md` |
| Test files, coverage requirements, key invariants | `docs/agent/testing.md` |
| Dated "session changes" / "changes shipped" history | `docs/archive/agent-session-log.md` |
| Handoffs, reviews, finished plans | `docs/archive/` |
| Plain-English folder explanations for the owner | `MAP.md` |

Do not add dated session logs, implementation narratives, or stale local paths to this file.
