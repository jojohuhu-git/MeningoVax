# STOP H — the owner's review of the rulebook (2026-11-21)

The owner asked to be walked through `docs/agent/meningococcal-rules-summary.md` section by
section. Each part was summarized in plain words, with every error found listed and checked
against the running engine first. **All five parts approved.** Every fix is to the document
only: **no app code changed, 0 answers moved**, 2,439 tests passing (205 files) after each part.

| Part | Sections | Owner's answer | What was fixed (and the evidence) |
|---|---|---|---|
| 1 | Opening, 0 (4-day grace), 1 (MenACWY) | **"Approve, fix all 3"** | (a) Opening said "20 of 75 rules still to be read" and "last verified 2026-11-16": now 0 and 2026-11-21. (b) A healthy 16-year-old with no MenACWY fell between "16 years: booster" and "17–21 years: catch-up". The engine gives "Dose 1 (catch-up, ≥16y, no booster needed)" (run 2026-11-21); CDC: "Age 16–18 years: 1 dose". Band now "16–21". The in-app Rulebook already had a 16–18 row. (c) "ticked"/"Untick" (7 times, sections 1, 2, 4) → "checked"/"Uncheck" (owner wording rule). |
| 2 | 2 (MenB) | **"Approve, fix it"** | High-risk MenB boosters after the first said "every 2 years". ACIP: "every 2–3 years"; the card says "2–3 years"; the date shown and the not-counted floor are 2 years with the 4-day grace (`intervals.js` `MENB_HIGHRISK_BOOSTER_CADENCE_*`; row `MENB-HIGHRISK-BOOSTER-GAP`). Fixed in the rulebook **and** `docs/agent/clinical-rules.md`. The in-app Rulebook already said "2–3 years". |
| 3 | 3 (combined MenABCWY shot) | **"Approve, add it"** | Section 3 said only "≥10 years". The app offers and counts the combined shot from 26 on too (owner C4, 2026-11-15; a 30-year-old with asplenia is offered Penmenvy and Penbraya, run 2026-11-21). Now written in, with why: licence 10–25 ("licensed for use in persons aged 10–25 years"), ACIP's high-risk recommendation sets only a lower age ("persons aged ≥10 years who are at increased risk…", Penmenvy MMWR), CDSI stops at 26 (`PENTAVALENT-UPPER-AGE`, a chosen difference). `owner:C4` added to `src/data/rulebook.js`. |
| 4–5 | 4 (counting), 5 (rule table), closing | **"Approve, fix all 4"** | (a) "A MenACWY dose set aside like that" named no dose: now "set aside for age (given before 10, or more than 4 days too early to be the 16-year booster)" (D2). (b) The label table moved to the end of section 4, so five counting rules rejoin the others (no words changed). (c) A missing full stop. (d) "Where this is implemented" / "Keeping this in sync" now name `doseRules.js`, `seriesTotals.js`, `intervals.js`, `ages.js` and the rulebook files. Section 5 (36 rules, 21 numbered app decisions) is generated from the code and held cell by cell by a test; nothing in it needed a fix. |

Also answered this session, before STOP H: **Q5 closed, "Keep red"** (see
`decisions-2026-11-21-session1-small-fixes.md`).

**Next:** Phase 8 (citations), opening with **Q12** — does the owner's PneumoVax rule "same
dose, decide alone" carry over? (`plan-2026-11-08-meningovax-port.md`, Phase 8.)
