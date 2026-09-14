# MeningoVax — Handoff: rules doc + header cleanup done; found a mislabeled dose chip (2026-07-23)

> **SUPERSEDED (2026-07-23)** by
> `docs/archive/handoff-2026-07-23-compliance-chip-risk-timing-design.md`.
> The chip plan in this file — "merge amber into red Invalid and delete the amber
> category" — was **reversed** in a later brainstorm: the amber chip is kept and renamed
> "Off-window — repeat", distinct from red "Invalid" (which stays for true errors only).
> That newer handoff also adds the risk-at-dose "Needs input" prompt design. Do NOT resume
> the chip plan below — follow the superseding file. The two shipped items (rules doc,
> header cleanup) in this file remain accurate history.

Supersedes: `docs/archive/handoff-2026-07-23-menb-healthy-age-gate-shipped.md` (its item 2
"rules-summary doc" and parked-UX item #2 "delete the header" are now DONE — see below; do
not resume that file's queue for those two items).

Branch: `main`, **2 commits ahead of `origin/main` — NOT pushed yet** (owner has not been
asked to push this session). MeningoVax lives at `~/Downloads/MeningoVax-main` (folder is
**cloud-synced** — commit early, watch for silent reversion). Live site (still on the older
commit until pushed): https://jojohuhu-git.github.io/MeningoVax/

Core promise of this app: **honesty** — a screen that quietly implies something is fine when
it isn't is the worst kind of bug, worse than a crash.

**281 passing tests (20 files), all green, working tree clean** at commit `ca1cb2f`.

## What's done this session

1. **Rules-summary doc — DONE.** Plain-English "when is MenACWY/MenB due" reference at
   [docs/agent/meningococcal-rules-summary.md](../agent/meningococcal-rules-summary.md), linked
   from `CLAUDE.md`. Commit `6f2c873`.
2. **Parked UX #2 (redundant due-header) — DONE.** Deleted the sentence that used to sit above
   "Option 1 / Option 2" on the results screen (it repeated status the top banner and each
   vaccine's own colored badge already said). Owner approved after seeing a live before/after
   screenshot in the running app. Commit `ca1cb2f`.

## What we found while double-checking #2 — NOT YET FIXED, plan agreed but not built

**In plain English: one label on the results screen is lying by omission, and needs to be
fixed before anything else in this queue.**

While showing the owner the "after" screenshot for item #2, the owner independently tried a
real example in the app: a 10-year-old with **no risk factors** who already got a Bexsero
(MenB) shot. The app showed a green-ish chip that says **"Valid (off-window)"** next to that
dose.

The problem: **"Valid" tells a doctor "this shot was fine, nothing to do."** But that's wrong
here — a healthy kid isn't supposed to get MenB before age 16. This shot doesn't count toward
anything, and the patient still needs the normal 2-shot MenB series later. A doctor skimming
the chip could easily think "valid, we're done here" and miss that the real 2-dose series
hasn't even started.

We also found the on-screen legend (the little color-key popup) actively says the wrong
thing about this chip: it says amber/"off-window" doses are **"counted, but outside the
routine timing."** That's backwards for every real case in the app today — we checked, and
the only two situations that ever produce this amber chip (MenB before 16, and the same rule
for MenACWY before 10) are BOTH cases where the shot explicitly does **not** count. So the
legend and the actual behavior contradict each other right now.

### What the owner decided (already agreed, just not built yet)

- A shot given at a technically-legal age, but at the **wrong age for this patient's risk
  level** (e.g. a healthy kid getting MenB "early," before the age it's normally offered),
  should be flagged the same way as any other mistake: the **red "Invalid" chip**, with the
  message "does not count — needs to be repeated." Today that red chip is only used for shots
  given too young for the vaccine itself, or spaced too close together. The owner wants the
  "given at the wrong age for this patient's situation" case folded into the same red bucket,
  not kept as a separate, softer-sounding amber one.
- We checked: under the hood, both the red "Invalid" shots and the amber "off-window" shots
  are **already treated identically** by the part of the app that decides what's due next —
  neither one counts. So relabeling amber shots as red "Invalid" does **not** change any
  recommendation the app gives; it only changes the color/word shown to the doctor, making it
  honestly match what's already happening behind the scenes.
- The amber "off-window, but it counts" idea doesn't actually exist anywhere in the app's
  code today — there's no situation where a late shot is separately flagged; late shots that
  still count just quietly show as normal. So there's nothing left for the amber category to
  do once the mislabeled cases move to red — it can likely be deleted outright, but that's
  worth confirming fresh rather than assuming.

### Where this lives in the code (for whoever picks this up)

- `src/logic/validate.js` — three spots currently mark a dose `status: 'valid',
  notAdolescentCount: true` instead of `status: 'invalid'`: MenACWY before age 10
  (~line 250), MenB before age 16 with no date recorded (~line 362), MenB before age 16 with
  a date recorded (~line 402). The `runWalk` function (~line 567) has a separate branch
  (~line 597) for these that skips the usual "does not count, repeat this dose only" message
  — that branch would no longer be needed if the three spots above are changed.
- `src/components/RecCard.jsx` (~line 36-50) — has special chip-coloring logic just for this
  amber case that could be deleted once nothing produces it anymore.
- `src/components/Results.jsx` (~line 248) and `src/App.css` (~line 936) — the color-key
  legend row and its CSS that currently say the wrong thing.
- Tests that check today's (soon-to-be-wrong) behavior and will need updating: `regression-a1-a3.test.js`,
  `regression-p0-1-menb-healthy-age16-gate.test.js`, `validate.test.js`,
  `validate-new-rules.test.js`, `RecCard.test.jsx`, `Results.test.jsx`,
  `regression-p0-1-menb-healthy-ui.test.jsx`.

Owner wants to open a **fresh conversation to brainstorm this before it's built**, to make
sure nothing about the plan above is being missed (e.g. edge cases, whether the amber
category is really safe to delete, whether any other screen still assumes it exists).

## What's NOT done — the remaining queue

- **This chip-relabeling item** (above) — plan agreed, **not implemented**. Pick up fresh in
  a new conversation per owner's request.
- **vaxapp five-surface MenB parity fix** — still not started. Same original bug (MenB before
  16 wrongly counted for a healthy patient) confirmed present in the sister app
  `~/Downloads/vaxapp-main`. Needs its own session; touches 5 recommendation surfaces +
  compliance tab. Full detail carried over from the superseded handoff (see its "What's NOT
  done" section, still accurate).
- **Parked UX #3, #4, #5** (from the prior handoff): #3 needs no code change (owner chose
  "leave as-is"). #4 (put status words directly on cards, don't rely on the color key) and #5
  (rebuild the "None of these risk factors apply" control as a real button) — neither started.

## Why this is a good stopping point

Two independent items are fully shipped and tested. The chip-mislabeling issue is a real,
scoped, owner-confirmed problem, but the owner specifically wants a clean conversation to
brainstorm it rather than continuing in this one, to catch anything the plan above might be
missing before code changes touch three shared vaccine-validation call sites and seven test
files.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm clean on `main` @ `ca1cb2f`
   (2 ahead of `origin/main`, not pushed); `npm test` — confirm **281 passing**.
2. Ask the owner which thread to start (don't default): the chip-relabeling fix (plan is
   above — brainstorm first per owner's request), vaxapp parity, or parked UX #4/#5.
3. Per-item workflow: reproduce → failing test (both logic + UI layers for anything visible)
   → fix → full suite green → live-verify in the running app (`preview_start` "MeningoVax dev
   server") → one commit per item.
4. For the chip-relabeling item specifically: confirm the amber "off-window, but still counts"
   category is truly unused anywhere else before deleting its CSS/legend row — don't assume.
5. Ship: MeningoVax `main` is UNPROTECTED but the owner prefers branch → PR → squash-merge;
   ask before pushing the two commits already sitting on `main` from this session.
