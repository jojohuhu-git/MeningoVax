> **SUPERSEDED (2026-07-24)** by
> `docs/archive/handoff-2026-07-24-citation-audit-complete-wiring-queue.md`. All 5 claims
> below (plus the other open rows) were independently re-verified this session, the two
> owner-supplied sources were added, and every open question was resolved or decided. Do not
> resume this file — use the newer handoff's W1–W5 wiring queue.

# MeningoVax — Handoff after sourcing citation-coverage references (2026-07-24)

Supersedes `docs/archive/handoff-2026-07-24-citation-coverage-complete-recs-table-request.md`
(that file's "not done" item — building the recs-coverage table — is done: the owner
generated `docs/archive/MeningoVax-citation-coverage-2026-07-24.docx`, a 37-row table
covering every distinct recommendation branch in `src/logic/recommend.js`. This session
picked up from that table.)

Branch: `main`, clean at commit `5c88f21` (matches `origin/main`) **except** pre-existing
unrelated dirty/untracked files already present before this session started (a modified
2026-07-23 handoff and several untracked handoff/docx files — not touched, not from this
session). **This session made zero code or test changes.** It was pure reference-sourcing
research: reading the owner's citation-coverage docx, tracing each flagged row to its exact
branch in `recommend.js`, and live-fetching/quoting candidate sources. Nothing has been
written into `src/data/refs.js` or `src/logic/recommend.js` yet.

## What's done — verified quotes, ready for Opus to double-check before wiring in

The owner wants a **new conversation, using Opus**, to independently double-check every
claim-to-source match below before anything is implemented. This table is that handoff:
each row states the exact recommendation claim and the source I found for it, with the
verbatim quote already fetched live (not from memory). Opus's job: re-verify each
claim↔quote pairing independently, flag any mismatch, then implement.

| # | Claim (from `recommend.js`) | Code location | Proposed source | Verbatim quote (live-fetched) |
|---|---|---|---|---|
| 1 | MenB "Not yet age-eligible" — high-risk, age <10 | `recommend.js` ~line 467 | ACIP 2020 MMWR (PMC7527029) **Table 2** | "2 mos–10 yrs ... No recommendations for use of MenB vaccines in this population" + footnote "MenB vaccines are licensed in the United States only for persons aged 10–25 years." |
| 2 | MenB "Not indicated" — age <10, no risk | `recommend.js` ~line 470 | Same Table 2 quote as #1 | (same row covers both risk and no-risk under-10) |
| 3 | MenB "Not routinely indicated" — healthy, outside 16–23y | `recommend.js` ~line 590 | Table 2 + p2035.pdf (immunize.org Item #P2035, 8/25/2025) | Table 2: "11–23 yrs ... Primary vaccination: MenB series at age 16–23 yrs on basis of shared clinical decision-making (preferred age 16–18 yrs)" — p2035.pdf confirms same window plus full dosing schedule |
| 4 | MenACWY "Not yet due" — age <11 | `recommend.js` ~line 380 | immunize.org Ask the Experts Q&A (age-10-dose question) | "ACIP considers a dose of MenACWY given to a 10-year-old child to be valid for the first dose in the adolescent series." / "Doses given before age 10 years should not be counted." |
| 5 | MenACWY "Not routinely indicated" — ≥22y, no risk | `recommend.js` ~line 447 (`M.y22` = 264mo) | Table 2 — **built from two pieces, not one direct quote** | Footnote †: "College freshmen... Catch-up vaccination... may be administered to persons aged 19–21 yrs who have not received a dose after their 16th birthday" + separate row "≥24 yrs: Not routinely recommended" |

**Row 5 needs Opus's judgment, not just verification.** Table 2 has no row literally
labeled "≥22y" — the code's 22y cutoff sits in the gap between the 19–21y catch-up cutoff
and the explicit ≥24y "not routinely recommended" row. Citing it means combining two
quotes and stating the 22–23y gap is inferred, not asserting a direct quote. The owner
was asked whether that's acceptable or whether the 22–23y gap should instead be flagged as
its own separate follow-up item — **she has not yet answered this**. Opus should either
get that answer or make the call explicit in whatever gets written to `refs.js`.

## Other rows verified this session (not part of the original "not-indicated" 5, but flagged mid-session)

- **College-dorm branch** (`recommend.js` ~line 226, `MenACWY risk-based — 1 dose (booster
  at ≥16y)`): p2018.pdf (immunize.org Item #P2018, 10/14/2025) confirmed verbatim: "First
  year college students living in residence halls | None, or 1 prior dose when younger
  than 16 years, or 1 prior dose since 16th birthday, but more than 5 years previously |
  Give 1 dose of MenACWY." **Open finding, not resolved**: this PDF row covers three
  vaccination-history sub-cases; the code currently splits them across separate branches,
  and the third sub-case ("1 prior dose since 16th birthday, but more than 5 years
  previously") was not located in `recommend.js` during this session — it may fall through
  to a generic 5-year-booster branch, or may be missing. Needs tracing before any citation
  is added to that branch.
- **≥24y college students, no prior MenACWY record** (edge case, not a distinct code
  branch found yet): immunize.org Ask the Experts Q&A confirmed: "One dose of MenACWY
  vaccine is recommended for all first-year college students who are or will be living in
  a residence hall if they are previously unvaccinated, have not received a dose since
  turning 16, or if their most recent dose... was not given within the past 5 years."
- **Outbreak/military single-dose branch** (`recommend.js` ~line 254): the owner originally
  flagged this row as clinically "wrong" (conflating it with the 2-dose high-risk-medical
  rule), then said to disregard that comment and confirmed she'd "review 2 in the
  meantime." **This is still open — no resolution recorded.** p2018.pdf's Exposure column
  (age-dependent primary series, "Age 24 months or older (Exposure): only 1 dose needed
  for primary vaccination") supports the current single-dose behavior for the typical adult
  case, but the owner's review of whether the `risk-based` status label conflates two
  clinically distinct categories (transient exposure vs. ongoing medical risk) was not
  concluded.

## What's NOT done

- No citations have been written into `src/data/refs.js` or `src/logic/recommend.js` —
  this entire session was research/verification only.
- Row 5's 22–23y inferred-gap citation approach — owner has not confirmed.
- The college-dorm ">5 years since 16th birthday" sub-case — not traced in code.
- The outbreak/military single-dose row — owner's review still open ("item 2").
- The other ~32 rows in the docx (already-cited rows, or rows the owner didn't flag) —
  not re-audited this session; treat as out of scope unless the owner raises them.

## Why this is a good stopping point

Every claim the owner asked about this session now has a live-fetched, verbatim source
attached (or an explicit note that it's inference-based, for row 5) — nothing here is
recalled from memory or transcribed from a prompt file. No code was touched, so there is
no half-finished implementation to protect. The owner explicitly wants a fresh
conversation, using Opus, to independently re-verify these claim↔source pairings before
anything is wired in — that's a clean, well-defined next step with no ambiguity about
scope.

## Resuming (for the next — Opus — session)

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm still clean at `5c88f21`
   (aside from the pre-existing unrelated dirty files noted above) before starting.
2. Re-verify each of the 5 numbered claim↔source pairs above independently — fetch the
   source live again, don't trust this handoff's quotes as ground truth without checking.
   Per the project's `verify-clinical-source` skill: fetch live, quote exactly, never
   transcribe from a prompt file as fact.
3. Get the owner's answer on row 5's 22–23y inference-citation approach before writing it
   into `refs.js`.
4. Trace the college-dorm ">5 years since 16th birthday" sub-case in `recommend.js` before
   touching that branch.
5. Ask the owner for her conclusion on the outbreak/military "item 2" review before
   changing that row's status label or citation.
6. Once each row is confirmed, wire citations into `src/data/refs.js` (new `CITATIONS`
   entries with `url`, `quote`, `label`, `short`, `lastVerified`) and `noteCites`/`refs` in
   `recommend.js`, following the existing pattern (see `acwyRoutine1112and16` etc. in
   `refs.js` for the shape). Add/extend tests in
   `src/logic/__tests__/recommend.test.js` covering the new citations.
7. Full five-surface check does not strictly apply here (citations are additive metadata,
   not dosing-logic changes) — but confirm no dosing/status/doseLabel values changed as a
   side effect.
8. MeningoVax's `main` is unprotected — direct push is allowed per the `ship` skill, but
   confirm with the owner before pushing, as has been done in prior sessions.
