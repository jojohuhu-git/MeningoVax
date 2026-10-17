# MeningoVax — post-HSCT meningococcal fix (pointer, 2026-09-13)

> **SUPERSEDED 2026-10-16 — do not act on this file.** The post-transplant
> meningococcal advisory it describes has been DELETED. Ticking the transplant
> box is now a hard stop, in both apps. What was removed, and why, is recorded in
> `docs/archive/retired-2026-10-16-post-hct-meningococcal-advisory.md`; the plan
> is `PneumoVax/docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md`.


> **Partly under review (2026-09-14).** Every item in this file shipped (`ba255ef`, `a0106f4`)
> and the record below is accurate. **One line is no longer settled:** "The 11–18 and 16–23
> bands themselves were correct — keep them." That assumption is now an open clinical question
> (does the post-HCT 2-dose MenACWY schedule apply above 18?), raised by an owner-reported
> age-82 case. Do not treat "keep them" as a decision. See
> [handoff-2026-09-14-dose-counter-structural-fix.md](handoff-2026-09-14-dose-counter-structural-fix.md) (section "P1").

The full handoff for this work lives in the vaxapp repo, because the fix spans three
apps and has to stay consistent across them:

**`~/Downloads/vaxapp-main/docs/archive/handoff-2026-09-13-post-hsct-meningococcal-crossrepo.md`**

Read that file before touching `hctAdvisory()` in `src/logic/recommend.js`.

## The short version

`hctAdvisory()` (added in M-B, commit `55167ff`) has two real gaps:

1. It drops CDC's **"or at high-risk"** limb. CDC indicates MenACWY post-HSCT for
   "individuals 11 through 18 years **or at high-risk**", and MenB for "16 through 23
   years **or at high-risk**". MeningoVax encodes only the age bands, so a 6-year-old
   post-HSCT with asplenia gets nothing.
2. Its MenB line says "Not triggered by transplant alone" at **every** age, including
   16–23 — where CDC and ASCO both say MenB should be offered post-transplant without a
   second condition.

The 11–18 and 16–23 bands themselves were **correct** — keep them.

Also move `coordinateFlag` to the top of the advisory block; the owner wants the
"check your institution's protocol" line to come before any timing, in all three apps.

Baseline when this was written: **392 passing, 29 files**, clean `main` at `55167ff`
(apart from pre-existing uncommitted edits under `docs/archive/` that are not ours).
