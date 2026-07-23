# MeningoVax + PneumoVax — Handoff after publishing the recorded-dose UX queue (2026-07-23)

Supersedes: `docs/archive/handoff-2026-07-23-recorded-dose-ux-five-items-done.md` (its two
"what's not done" publish steps are now both complete — that file is historical record
only, do not resume work from it).

## MeningoVax

Branch: `main`, matches `origin/main` at commit `a28b5ae` (confirmed with `git fetch` +
SHA compare — was already pushed before this session started). **275 passing (18 files)**,
all green, working tree clean.

Nothing pending here. The five-item recorded-dose UX queue (unify dose editors,
auto-focus new row, audit-list alignment, de-amber booster banner, required-vs-optional
"due today" wording) is fully shipped and live on `main`.

## PneumoVax

The parity port of Item 2 + Item 4 (required-vs-optional "due today" wording) was on
branch `parity/item2-item4-required-optional-wording`, PR #9. This session:

1. Confirmed the `test` check had already passed on PR #9.
2. Squash-merged PR #9 → `origin/main` (merge commit `603c4a9`).
3. Confirmed the GitHub Pages "Deploy to GitHub Pages" workflow run
   (`30027751708`) completed with `conclusion: success`.
4. Spot-checked the live site at `https://jojohuhu-git.github.io/PneumoVax/` —
   loads correctly, title and DOB/age form render as expected.

Local checkout is still on the now-merged feature branch (135 passing, 8 files) — the
squash landed on `origin/main` as `603c4a9`; a future session should `git checkout main
&& git pull` there before starting new work, and can delete the merged branch.

Item 5 (shared `DoseEditor`) was **not** ported to PneumoVax — verified last session that
PneumoVax's duplicated dose editors don't render any per-brand safety guidance that could
drift, so there was no bug to fix by unifying them. This remains correct; not revisited.

## What's NOT done

Nothing from the five-item queue or its parity pass. The only remaining item anywhere in
scope is the **Parked list** from the original plan
(`docs/archive/plan-2026-07-23-recorded-dose-ux-five-items.md`), still **not approved**:

- #2 status-announced-3-4x
- #3 scattered actions
- #4 opt-in color key
- #5 a11y label/checkbox nesting

## Why this is a good stopping point

Both apps are green, both branches are merged/pushed, and the live PneumoVax deploy was
verified in the browser — nothing is mid-flight. The next unit of work (the Parked list)
is explicitly gated on a fresh owner go-ahead, not something to pick up automatically.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm clean on `main`, matches
   `origin/main`; `npm test` — confirm **275 passing**.
2. `cd ~/Downloads/PneumoVax && git checkout main && git pull` — confirm at `603c4a9`;
   `npm test` — confirm **135 passing**. Delete the merged local branch
   `parity/item2-item4-required-optional-wording` once confirmed.
3. If the owner wants further UX work, ask about the Parked list above — do not pick an
   item without their go-ahead on priority.
