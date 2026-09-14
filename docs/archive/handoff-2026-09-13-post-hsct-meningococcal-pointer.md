# MeningoVax — post-HSCT meningococcal fix (pointer, 2026-09-13)

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
