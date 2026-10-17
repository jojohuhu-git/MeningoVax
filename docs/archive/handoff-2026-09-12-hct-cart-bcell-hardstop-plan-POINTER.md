# Pointer: HCT/CAR-T/B-cell hard-stop plan lives in vaxapp

> **SUPERSEDED 2026-10-16 — do not act on this file.** The post-transplant
> meningococcal advisory it describes has been DELETED. Ticking the transplant
> box is now a hard stop, in both apps. What was removed, and why, is recorded in
> `docs/archive/retired-2026-10-16-post-hct-meningococcal-advisory.md`; the plan
> is `PneumoVax/docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md`.


The full plan/handoff for this cross-repo change is at:

`/Users/joannehuang/Downloads/vaxapp-main/docs/archive/handoff-2026-09-12-hct-cart-bcell-hardstop-plan.md`

and the detailed design doc at:

`/Users/joannehuang/.claude/plans/wiggly-chasing-grove.md`

MeningoVax's piece: add TWO new risk factors — `hct` (a new sourced advisory,
mirroring PneumoVax's `hsctAdvisory()` pattern; run `verify-clinical-source` first to
close a flagged under-2/adult timing gap before writing dosing copy) and a second id
for CAR-T therapy/B-cell malignancy/B-cell-depleting therapy (plain hard stop). Read
the two files above before starting; nothing has been implemented yet as of
2026-09-12.
