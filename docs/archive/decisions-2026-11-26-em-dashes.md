# Decisions — Tier 3, em dashes in sentences (2026-11-26)

**Background.** The owner's July rule D7 (2026-07-16,
`handoff-2026-07-17-design-polish-p1-done.md`) took em dashes out of every sentence a clinician
reads. Sentences written since put some back. The G1-a style guard allows one dash a sentence, so
it never flagged them. Measured on 2026-11-26: 7,952 of 31,160 test patients (6,463 real) saw at
least one em dash outside a chip label or a quoted source sentence.

## Questions and answers

| # | Question | Owner answer |
|---|---|---|
| E1 | 16 sentences on MeningoVax cards and entry screens still have an em dash. Change sentences only, or the chip labels too? | **"Sentences only"**. Chip labels ("Not counted — repeat", "Not counted — do not repeat", "Not counted — Extra. Do not repeat.", "Not counted — given before age N", "Date is in the future — not counted", "Dated before birth — not counted", "Entered twice — this row not counted", "No date recorded — not counted") keep their dash: she approved them after D7, and PneumoVax writes them the same way. |
| E2 | The two date-of-birth messages use the same code as PneumoVax's `ageEntry.js`. Change them in both apps? | **"Both apps"**. |

Also kept as they are: quoted source sentences (word for word), document names in hover and
pop-up text, the transplant line (frozen byte-for-byte with PneumoVax), and "—" as the
empty-cell mark in the Rulebook tables.

## What was built (branch `tier3/em-dashes`)

Each dash became a period, colon, comma or brackets. No meaning changed.

| Where | Before | After |
|---|---|---|
| `recommend.js` 16y booster owed | still owed — the recorded dose was given before then | still owed, because the recorded dose was given before then |
| `recommend.js` age not confirmed | cannot be confirmed — check its date in the record | cannot be confirmed. Check its date in the record |
| `recommend.js` infant 2-dose start | Start the 2-dose infant MenACWY series — dose 2 at least … | Start the 2-dose infant MenACWY series: dose 2 at least … |
| `recommend.js` 2-dose primary start | Start the 2-dose primary series — the two doses … | Start the 2-dose primary series: the two doses … |
| `recommend.js` infant 4-dose continue | Continue the … series — doses at 2, 4, 6 and 12 months | Continue the … series: doses at 2, 4, 6 and 12 months |
| `recommend.js` "Why this" (2 lines) | whichever comes later — the interval since … | whichever comes later: the interval since … |
| `recommend.js` infant continue (2 lines) | Continue the … series [c] — at least 8 weeks between … | Continue the … series [c], with at least 8 weeks between … |
| `recommend.js` age-10 dose (lead A) | … adolescent series [c] — no repeat is needed now. | … adolescent series [c]. No repeat is needed now. |
| `recommend.js` age-10 dose (lead B) | given at age 10 — it counts as the first dose … | given at age 10. It counts as the first dose … |
| `recommend.js` 19–21 catch-up | A single catch-up dose — no MenACWY is confirmed … | A single catch-up dose, because no MenACWY is confirmed … |
| `recommend.js` MenB booster family | … primary series — MenB-4C (Bexsero, Penmenvy) and … | … primary series. MenB-4C (Bexsero, Penmenvy) and … |
| `RecCard.jsx` combined-shot dose row | one shot covering both — recorded under MenACWY | one shot covering both (recorded under MenACWY) |
| `DoseEditor.jsx` future-dated dose | Check the date — if the patient has not had this dose yet … | Check the date. If the patient has not had this dose yet … |
| `DoseEditor.jsx` combined-shot note | counts as a MenB dose as well — do not record it again … | counts as a MenB dose as well. Do not record it again … |
| `ageEntry.js` (and PneumoVax's) | Check the year — if it is a typo, correct it. | Check the year. If it is a typo, correct it. |
| `ageEntry.js` (and PneumoVax's) | Check the year — a two-digit year such as 26 … | Check the year: a two-digit year such as 26 … |

**Measured.** `npm run prose`: 7,952 of 31,160 patients read different words; a script applying
only these swaps to the "before" text reproduced the "after" text for every patient. Saved answers:
0 moved. Guard: `regression-2026-11-26-no-em-dash-in-sentences.test.jsx`.

**Follow-up.** The design-review skill says copy-style rules made in MeningoVax apply to PneumoVax.
PneumoVax has its own em dashes in card sentences (not measured here); only the shared
`ageEntry.js` messages were changed there (E2).
