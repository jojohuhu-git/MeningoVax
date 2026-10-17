# POINTER — the transplant hard-stop plan lives in PneumoVax

**This file is not the plan.** It is four lines of signposting so a MeningoVax session
can find the real document instead of working from a second copy that has drifted.

**The plan:** `~/Downloads/PneumoVax/docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md`

**Why a pointer and not a copy** (owner decision 2026-10-16): the full text was filed in
both repos on 2026-10-16, and the two copies disagreed within hours — PneumoVax's gained a
supersession note that this repo's copy never got. No test compares planning documents, so
nothing would have caught it. One document, one place.

## What this repo's half is

- **MeningoVax is PR 1 — it goes first**, so that the cross-repo guard written on
  PneumoVax's side passes the day it is written rather than sitting red.
- Approved by the owner 2026-10-16. Six settled decisions, listed in the plan under
  "Owner decisions" — **do not re-litigate them.**
- In short: ticking the transplant box (`hct`) stops giving advice. It merges into the
  existing `hct_cart_bcell_exclude` hard-stop row, the `hctAdvisory()` function and its
  banner are deleted, and the retired schedules are archived verbatim to
  `docs/archive/retired-2026-10-16-post-hct-meningococcal-advisory.md`.
- The new banner title, exclusion message and recorded-doses line are **byte-identical
  across both apps** — including non-breaking hyphens (U+2011). Copy them from the plan,
  do not retype them.
- Two tests get **deleted outright, not skipped**:
  `regression-c2-6-hct-other-risk-selected.test.js` and its `-ui` twin.

## Order

This plan comes **before** the citations plan (see the companion pointer in this folder).
The two are open on the same files and must not be built in parallel.
