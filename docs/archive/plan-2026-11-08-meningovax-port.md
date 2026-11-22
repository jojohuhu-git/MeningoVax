# Plan — bringing PneumoVax's way of working to MeningoVax (REVIEWED DRAFT, 2026-11-08)

> **MOVED HERE FROM PNEUMOVAX, 2026-11-17 (owner decision).** This plan lived in PneumoVax under
> the 2026-10-16 rule "a plan covering both apps lives once, in PneumoVax". The port is all
> MeningoVax work, and every MeningoVax session was opening a docs-only PR in PneumoVax
> (#153–#161) just to update this status and its handoff. It is still **one copy**: PneumoVax keeps
> only a pointer, `plan-2026-11-08-meningovax-port--SEE-MENINGOVAX.md`. Handoffs up to B-1 stay in
> PneumoVax's `docs/archive/` as history; **new handoffs go in this folder.** Section names below
> that say "MeningoVax's docs/archive" now mean this folder.

**Status 2026-11-15: the owner approved the phase order (Q0, "Yes, start Phase 0"). Phase 0 is
done and changed no MeningoVax code.** Its results are in MeningoVax's `docs/archive/`:
`report-2026-11-15-phase0-measured.md` (the measured cells, eleven worked patients, the sources
read live, and twelve new findings N1–N12 listed, not fixed) and
`inventory-2026-11-15-every-place-a-dose-is-judged.md` (item 0.4). **Phase 1: 1.1–1.5 built** (1.1–1.4 merged as MeningoVax #80–#83; 1.5, CDC's CDSI test
patients, is PR #84: 65 of 104 agree, 39 differ, sorted into families in MeningoVax
`docs/archive/report-2026-11-15-cdsi-test-patients.md`). #84 merged 2026-11-16. **STOP B answered
2026-11-15** (five answers, table under Phase 1). Next: end-of-Phase-1 usage measure, make 1.5 a
required test (done: MeningoVax PR #85), then Phase 2. **2.1 merged (#86); 2.2 merged (#87); 2.3 built (MeningoVax PR #88).**
The three reads before STOP C done; **STOP C ANSWERED 2026-11-15** (18 answers, C1–C18, in MeningoVax
`docs/archive/stop-c-packet-2026-11-15.md`; MeningoVax PR #89 merged, no code changed). **Phase 3
family 1 (Ruling D) built 2026-11-16: MeningoVax PR #90**, waiting for the owner. Next: Phase 3
families 2–5. See `handoff-2026-11-16-meningovax-ruling-d-built.md`.

*Earlier status: reviewed draft, waiting on the owner. Nothing in MeningoVax has been changed.*
Revised three times on 2026-11-08: (1) the presentation-decision table; (2) the 82-commit
ledger; (3) **a review** at her request (*"Rulebook needs to have the same design philosophies.
Rules for patients need to be consistent as well as logic for when doses need to be repeated"*),
which added the section "Review of the draft", the section "How every dose is decided", and
replaced the eight steps with **nine phases, each with its sessions, its owner stop, and an
estimate**. The tables A–F and the ledger are kept as they were.

MeningoVax repo: `/Users/joannehuang/Downloads/MeningoVax-main`, `main` at `c1118c1` (2026-10-17),
working tree clean on 2026-11-08. PneumoVax's `main` has **83** commits after MeningoVax's twin
`3dc0264` (82 in the ledger plus #147, added below). This is the one real plan for the port; when
work starts, MeningoVax gets a pointer file to it, not a copy (memory `both-apps-docs-are-pointers-not-copies`).

## The goal, in the owner's words (2026-11-08)

> The goal with meningovax is the same as pneumovax. The goal apps is to use age, risk factors
> and prior vaccine history to help assess the appropriateness of prior doses given as well as
> forecast when and what subsequent doses are due. The recommendations should all be pulling
> from the rulebook. Dates or ages when next doses are due should be clearly stated under
> recommendations. Any dose that does not follow standard schedules should have some feedback as
> to if the dose is counted but unnecessary/extra or if doses are valid based on standard/catch up
> schedules, or if doses are valid based on app specific guidance. Invalid doses should also be
> flagged as to whether they should be repeated or not repeated in future doses. Explanations
> under why this or next to dose chips should be stated in simple clear clinical language and
> should not sound AI generated.

## Review of the draft (2026-11-08)

Done by reading MeningoVax's `validate.js`, `intervals.js`, `doseChipLabel.js`, its rulebook
(`docs/agent/meningococcal-rules-summary.md`) and its rule-docs test, and by reading CDC's own
forecasting rule set (CDSI v4.64, local copy at `~/Downloads/Version 4.64 - 508/XML/`, the two
meningococcal files). Each finding below changes what a phase must do.

| # | What the draft said | What is actually there | What changes in the plan |
|---|---|---|---|
| R-1 | "50 commits" in the header | 82 in the ledger, 83 with #147 | Header corrected; #147 added to the ledger |
| R-2 | Ruling D is a *recommendation* fix (step 3): the card advises 9/26, CDC gives 10/17 | **The validator also measures from the last dose that counted** (`prevKeptDated`, `validate.js` lines 597, 920, 990, 1035; the "last-kept" walk, 1074–1236). MeningoVax's own rulebook states the opposite of ACIP as a rule (§4: *"if an early dose is dropped, a later dose isn't wrongly flagged as 'too soon' relative to the dropped one"*). ACIP General Best Practices: *"The repeat dose should be spaced after the invalid dose by the recommended minimum interval."* | Ruling D moves **verdicts**, not just dates: a later dose that counts today may stop counting. It needs the safety nets first, a measured count, and a patient for the owner. Three surfaces, as in PneumoVax: validator, card, chip. |
| R-3 | Early doses: "decision per vaccine" (A16), no method | PneumoVax decided each gap with one method (below, "How every dose is decided"). Applied to CDSI: **CDC's software writes a hard floor (`minimum − 4 days`) on almost every meningococcal gap, boosters included** — the opposite of adult pneumococcal, where every one of 39 gaps had none. So most MeningoVax floors are CDC-backed, and the port is mostly **labelling who says so**, not reversing rules. | Phase 2 builds the rule table with a "who says so" column filled from live readings plus CDSI. Three rows already look different (R-4). |
| R-4 | — | Three gaps where MeningoVax and CDSI differ. **Candidates, not findings** — CDSI ranks below ACIP/CDC wording, and each needs a live read first. (a) *"At least 4 weeks between any two MenACWY doses"* voids a dose (`validate.js:722`); MeningoVax's own rulebook says that 4 weeks is stated by ACIP only for MenB, and CDSI's routine dose-2 floor is 8 weeks − 4 days. Looks like an **app rule with no source** that is labelled as if it had one. (b) High-risk MenB dose 3 under **6 months from dose 1** voids the dose (`validate.js` ~968); CDSI's floor for that gap is **0 days** in both high-risk series (the real floor is 4 months − 4 days from dose 2). (c) Healthy MenB 2-dose series: CDSI carries several interval rows per dose; not yet read against the code. | Owner decision packet 1 (Phase 2 stop), each with a meningococcal patient and a control. |
| R-5 | Labels: map MeningoVax's onto the closed list (A1, decision 5) | **Two vocabulary clashes, not one.** (a) Every invalid MeningoVax dose says *"repeat this dose only (do not restart the series)"*; PneumoVax's W1 calls a dose thrown out for timing *"do not repeat"* because the next dose is simply due once the gap has passed. Same clinical action (one more dose), opposite words. (b) MeningoVax contradicts itself: the chip on a MenACWY dose before 10 / healthy MenB before 16 says **"Off-window - repeat"** (`doseChipLabel.js`), while its rulebook §4 says *"no repeat needed, it's just not counted"*. | Two separate owner questions in Phase 4, asked with patients. |
| R-6 | Step 2: move intervals into one table | The **numbers** are already in one place (`intervals.js`, guarded by `regression-p2-1-intervals-in-one-place`). What is missing is the **rule** table: which rule, voids or advises, who says so, measured from which dose. | Phase 2 is smaller than the draft implied (~1 session). |
| R-7 | Step 7: write a rulebook | MeningoVax's rulebook says it is *"synced to vaxapp"*; vaxapp is retired (memory `vaxapp-is-retired`). Its rule-docs test checks ~30 sentences, not a table cell by cell. | Phase 7 drops the vaxapp sync and builds the generated rule table. |
| R-8 | — | No step names the cross-vaccine question. MenACWY and MenB run on separate clocks, but a **pentavalent** counts for both (`pentavalentCredit.js`). PneumoVax's ANCHOR-1: a dose that did not count never resets **another** vaccine's clock. Unasked for MeningoVax: does a pentavalent rejected for MenB (wrong family) still count, and still anchor, for MenACWY? | Added to decision packet 1. |
| R-9 | — | No step updates MeningoVax's `CLAUDE.md` rules or the `vaccine-parity` skill, so the next session in MeningoVax would not know the new rules exist. | Each phase adds its rule to MeningoVax's `CLAUDE.md`; Phase 9 checks the skill. |
| R-10 | Citations last, "the largest" | MeningoVax has **38** source entries and **21** quotes; PneumoVax has 115 and 97. | Phase 8 is about a third of PneumoVax's citation work, not the whole of it. |

**Correction to R-3, same day, after reading CDC's own words live** (CDC Timing and Spacing
page, content reviewed 2023-08-01; CDC child notes and catch-up table, updated 2025-07-01/02;
ACIP rr6909a1). R-3 rested on CDSI alone and overstated it. CDC's **wording** backs the
primary-series gaps and the minimum ages as floors (the generic rule plus Table 3-2, the
catch-up table's 8 weeks, and the notes' "at least" intervals). It does **not** back the
**booster** gaps as floors: ACIP gives 3, 5, 1 and 2–3 years as the schedule, never as a
minimum, and its only booster warning is that a MenACWY booster under 4 years is
*"not licensed … and considered off-label"*, which is about licensing, not validity. CDSI
alone treats them as floors. So the booster floors are the same kind of question PneumoVax's
adult floors were: **owner decision, packet 1**. Also found: ACIP's routine 16-year booster
needs *"a minimum interval of 8 weeks"* after dose 1, while MeningoVax's catch-all check uses
4 weeks (R-4a, to test in Phase 0); and CDC's notes still give MenQuadfi's minimum age as 2
years, where MeningoVax uses 6 weeks on AAP's word (owner decision of 2026-09-23, stands).

## How every dose is decided — the shared philosophy

This is the part that must be **the same in both apps**, whatever the vaccine. The clinical
numbers differ; the method does not.

### 1. Every rule that can affect a recorded dose is one row, with five answers

| Field | Question it answers | PneumoVax example |
|---|---|---|
| Which schedule | Child or adult rules (MeningoVax: routine, high-risk, single-dose indication) | `rulebook: 'child'` |
| Measured from | The previous dose of the **same vaccine, including one that did not count** (ACIP: the repeat is spaced from the invalid dose), or the last dose **that counted** of a **different** vaccine | Ruling D / ANCHOR-1 |
| What happens if shorter | **Floor**: does not count (4-day grace applies). **Advice**: counts, with a note stating the shortfall. **None**: never flagged, reason written down | `enforcement` |
| Who says so | **CDC/ACIP** only when their own words make it a minimum. **This app** when no source states it — an owner determination, dated, and the app says so in words | `authority` |
| The label it leads to | One label from the closed list (table A1) | §M |

**Never an age test that decides whether a rule may bite** (PneumoVax S14-RC: three adult gaps
fell in that hole and were checked by nothing). Add a row instead.

### 2. Floor, advice, or no rule? Decide in this order

1. **Read the CDC/ACIP sentence live** (`verify-clinical-source`). Words like *"minimum
   interval"*, *"should not be counted"*, *"repeat"* → floor, authority CDC. Watch the trap
   PneumoVax fell into once: *"minimum **recommended** interval"* and *"can be considered"* are
   advice, not a floor.
2. **Check CDSI** (local copy). `absMinInt` above 0 means CDC's software treats it as a floor;
   `0 days` means CDC deliberately set none. CDSI is evidence for the owner, not an authority
   above the prose.
3. **AAP breaks a tie** with CDC; **CDC beats an older immunize.org page**; cite CDC first.
4. **No source at all** → it is an **app rule**: the owner decides, with a worked patient and a
   control case, and the row says *"This app"*. Never cite CDC for it.
5. Put every judgement call in the PR body, grouped, so she audits them in one place.

### 3. Rules every patient gets, in both apps

| Rule | PneumoVax source | MeningoVax today |
|---|---|---|
| A dose given too soon is measured from **itself** when its repeat is scheduled (ACIP) | Ruling D, §L-3 | **No** — validator and card both measure from the last dose that counted (R-2) |
| A dose that did not count never resets **another** vaccine's clock | ANCHOR-1 | Question open (R-8) |
| The 4-day grace decides what the app **accepts**, never what it **advises** | 2026-10-24 ruling | **Yes**, already in its rulebook §0 |
| The grace applies to minimum **ages** too | §A-GRACE12 | Yes (§0 says so); to confirm in code |
| The card advises the **routine** date and states the **minimum** beside it | C10-2 | Minimum only (B2) |
| A dose is **extra** when the card on the day it was given did not ask for it | P1-3 | Only "beyond the series total" (A15) |
| An early dose with no source saying "repeat" **counts, with a note** | PRs #84, #90 | MenB dose 2/dose 3 already do this; the rest per row (R-4) |
| A record problem (future, before birth, twice) gets **neither** a repeat **nor** a next-dose sentence | S10-N2 | **Yes** (PneumoVax copied it from here) |
| **Complete** only when nothing more is owed | §C-COMPLETE | To measure (B3) |
| A line about a later age is the app's own answer run forward, never hand-written | §B-AT19 | To measure (B17: boosters, the 16-year dose) |

## Ground rules for every step

- **Port the rule, not the code.** The two engines are different shapes. Each step starts by
  reading MeningoVax's own `recommend.js` / `validate.js` for that behaviour (memory
  `read-the-engine-before-offering-options`).
- **Nothing pneumococcal carries over.** p2016, PCV7, the PCV15→PPSV23 pairing, the IC/non-IC
  child split, the thrown-out PPSV23 rulings: none of these exist in meningococcal vaccination.
- **Meningococcal rules are read live** from CDC/ACIP before any clinical change
  (`verify-clinical-source` skill). A PneumoVax ruling is never applied to MeningoVax as if
  it were a meningococcal one; where the same QUESTION comes up (for example "is a dose given too
  soon repeated?"), it is put to the owner with a meningococcal patient.
- **One PR per step**, `fix-queue` loop: reproduce, failing test, fix, full suite, break each new
  clause, check in the running app.
- Mirror files stay identical (`dateUtils.js`; the transplant hard stop) — already enforced by tests.

## What MeningoVax has today, against each part of the goal

Surveyed 2026-11-08 by reading the code; each line still to be measured before its step starts.

| Part of the goal | PneumoVax now | MeningoVax now |
|---|---|---|
| Every rule from the rulebook | `CLINICAL_SPEC.md` + a test comparing its rule table to the code cell by cell | `docs/agent/meningococcal-rules-summary.md` + `rule-docs-match-code.test.js` (exists — scope not yet checked) |
| One place for every interval rule | `doseIntervalRules.js`, each row marked "voids the dose" or "advice only" | The NUMBERS are in one place (`intervals.js`, guarded); the RULES that use them are spread through `validate.js` (1,346 lines) and `recommend.js` (R-6) |
| A changed answer cannot slip through | Two committed verdict lists (17,016 real + 18,264 impossible patients) and a prose diff | A shared test grid (`src/test-grid.js`) and three sweeps, but no committed verdict list and no prose diff |
| The app agrees with itself | Seven whole-app checks over 77,496 patients, four of them required tests | None |
| Dates clearly stated | "Next dose due <date>" (Remy, 2026-11-07); the routine date advised, the minimum stated beside it | "Next dose not yet due - eligible <date>" (`RecCard.jsx:472`) |
| Repeat dose measured from the dose given (Ruling D) | Yes | **No, on both sides** — measured 2026-11-01: a 20-year-old with asplenia, Menveo 8/1 then 8/22, is advised 9/26; CDC's rule gives 10/17. Read 2026-11-08: the validator measures from the last dose that counted too, and the rulebook says so as a rule (R-2) |
| Every recorded dose gets one label from a closed list | Yes (§M): counted / extra / valid by catch-up / valid by app rule / not counted–repeat / not counted–do not repeat / record problem | Partly: `doseChipLabel.js` has "Extra dose", "Dose N of M", record problems — but one plain "Invalid" with no repeat / do-not-repeat split |
| Plain clinical wording | Her §M-L3 style rules, swept by test | "Why this" lead/detail split exists; no style rules applied |
| Short card with details behind "Why this" | The fold (WORD-1) — **she chose "PneumoVax only" on 2026-11-06** | Not folded |

## Every PneumoVax presentation decision, and whether MeningoVax has it

Added and completed 2026-11-08 at the owner's request: *"I want to make sure all work on pneumovax is captured in
meningovax plan. This includes consistency with the chip recommendations used, citing sources using
the same superscript order, using the same succinct clinical language throughout etc."*

The first draft of this plan named the five goals but **did not list these decisions**. They are listed
here one by one so that none is lost, and the ledger below marks every PneumoVax commit against them. "MeningoVax now" is from reading its code on 2026-11-08, and
"to measure" means not yet checked. Each row gets measured before its step starts. The **Step**
column says which step below carries it. (Since the 2026-11-08 review, "step N" here is **Phase N** below; the numbers were kept the same on purpose.)

### A. The label and line beside a recorded dose

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| A1 | Every dose starts with exactly one label from a closed list: Dose N / Dose N of M; Counted — given early, accepted; Counted — not needed; Counted — product not recorded; Counted — date not recorded; Not counted — Extra. Do not repeat.; Not counted — repeat; Not counted — do not repeat; Check the date. | §M, 2026-11-08 | Own list in `doseChipLabel.js`: "Extra dose — more than this series needs", one plain "Invalid", "Off-window - repeat", "Booster" | 4 |
| A2 | Green for counted, blue for extra/not counting, red for not counted, grey for record problems | §M | to measure | 4 |
| A3 | A dose rejected for timing is "do not repeat"; a dose rejected for age or product is "repeat" | W1 (2026-10-11), §M | Uses "repeat this dose only (do not restart the series)" for most invalid doses | 4 |
| A4 | The line beside the label: the label plus one reason; answer first; about the patient, not the document; one idea per sentence; no semicolons, at most one dash; no arguing; never repeats the label; same situation same words; plain clinical terms and US spelling (no "~", "at birth", "about 18 months"); bold only the decision | §M-L3 style rules, 2026-11-08 | Not applied | 6 |
| A5 | Next-dose wording on a dose line: "Next dose from <date> at the earliest". The line never states the due date, because only the card knows the routine date. | 2026-10-24 ruling, §M-L3 rule 9 | to measure | 5 |
| A6 | A dose line never promises a date for a dose no card asks for | §K-NOPROMISE (2026-10-25), §C-P2-R4 (2026-11-08) | to measure | 5 |
| A7 | State the shortfall against the rule ("shorter than the 5 years ACIP advises"), not just the rule | owner, 2026-10-25 | to measure | 6 |
| A8 | Explanations sit under "Why this" beside the dose, not in the line | 2026-10-25; §M "Ok to live under why this for all explanations" | Card notes have "Why this"; dose lines to measure | 6 |
| A9 | A record problem (future date, before birth, entered twice) takes neither a repeat nor a next-dose sentence | S10-N2 | Has this; the wording was ported FROM MeningoVax and has since diverged (§M-L3 note) | 6 |
| A10 | A dose rejected for AGE names no product ("any vaccine approved for that age"); a dose rejected for the wrong PRODUCT names the one to give ("Give PCV20 instead. Do not restart the series.") | §I-AGEREMEDY (2026-10-29), §I-REMEDY (2026-10-26) | to measure | 4 |
| A11 | A thrown-out dose that was later repeated points to the repeat: "Repeated on <date>. See that dose." | §C-P2-LATER, 2026-10-31 | to measure | 4 |
| A12 | Never print a product the record does not show (an unrecorded product reads "a PCV dose", i.e. the vaccine name only) | FINDING H (2026-10-18); PR #103 | to measure | 6 |
| A13 | The 4-day grace decides what the app ACCEPTS, never what it ADVISES: a dose line never gives a date inside the grace | 2026-10-24 ruling | to measure | 5 |
| A14 | "This dose met that minimum" only for a dose that met it | §K-MET-ONLY, 2026-10-31; PR #110 | to measure | 6 |
| A15 | What "extra" means: a dose is extra (not needed, not counted, nothing repeated) when the card the patient had on the day of that dose did not ask for it | P1-3, owner rulings 2026-11-06 (Theo, Mateo, Lena, Ben) | Has an "Extra dose" label for doses past the series total; the "card on that day" test is to measure | 4 |
| A16 | An early dose where no source says to repeat it counts, with a note saying how early ("Counted — given early, accepted"). For PneumoVax adults this was ruled per vaccine (adult table 2026-10-25, PR #90; Ruling F 2026-10-24) | PRs #84, #90, #110 | MeningoVax already counts an early MenB D3 and adds a 4th dose (its CLAUDE.md); other early doses to measure | 4 (decision per vaccine) |
| A17 | A dose given too soon carries two dates that answer different questions: when THIS dose would have been valid (kept in the data) and when the NEXT dose may be given (shown). Both are in the saved-answer files | PR #86 (2026-10-25); 2026-10-24 ruling | **Closed 2026-11-18 (owner):** the next-dose date is saved (the card's `earliestNextDate`, which F-4's "Repeat from <date>" line prints); the "this dose would have counted" date is not computed and nothing shows it, so it is not added | 1 and 5 |
| A18 | The 4-day grace (ACIP General Best Practices) applies to minimum AGES as well as intervals | §A-GRACE12, PR #109 (Lily, 2026-10-31) | to measure | 2 |

### B. The recommendation card

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| B1 | Top line says "Next dose due <date>", never "eligible" | Remy, §L-2, 2026-11-07 | "Next dose not yet due - eligible <date>" (`RecCard.jsx:472`) | 5 |
| B2 | The app advises the routine date and states the minimum beside it ("it can be given today if needed, as the minimum interval of 4 weeks has already passed") | C10-2, §L-2, 2026-10-23 | States the minimum only | 5 (decision) |
| B3 | "Complete" only when nothing more is owed; "No dose now" while a later dose is still coming | §C-COMPLETE (2026-11-01), P1-2 (2026-11-06) | Uses "Complete"; to measure against the rule | 5 |
| B4 | "Routine" for an on-time patient, "Catch-up" once the routine date has passed | P2-9, §L-2, 2026-11-06 | to measure | 5 |
| B5 | A card never advises an age already passed: it says "was due … and is overdue — it can be given now" | §K-READING 1, 2026-10-24 | to measure | 5 |
| B6 | One date format on screen (`fmtDate`, e.g. "Dec 7, 2026"); the data stays ISO | §K-READING 2, 2026-10-24 | `fmtDate` used in 7 component places; to measure the rest | 5 |
| B7 | Ages in weeks, months and years as the schedules write them, never days | Rulebook review, 2026-10-31 | to measure | 6 |
| B8 | One short clinical line in view, the rest behind "Why this"; disposition in bold | owner, 2026-10-25 | Has the "Why this" lead/detail split (PneumoVax copied it from MeningoVax) | 6 |
| B9 | "Why this" follows the same style rules as the dose lines | §M-L5 / §WHY-THIS, 2026-11-08 | Not applied | 6 |
| B10 | The sentences in view and shut "Complete" cards follow the style rules too | §WORD-TIDY, 2026-11-08 | Not applied | 6 |
| B11 | The result page folds: only what must be seen stays in view (a named list, each with its reason) | §WORD-1, 2026-11-06. **Her answer then: "PneumoVax only"; 2026-11-19: "Full PneumoVax fold"** | Folded, 2026-11-19 (`noteFold.js`) | 6 |
| B12 | Option cards: "Choose ONE option" wording; each option names its own wait and its own date. Never an option due today beside one due years away under a single "due" | §D-note-8W, P0-1; FINDING A (PR #62) | to measure (pentavalent card) | 6 |
| B13 | No "now" in a sentence under a date still in the future | P2-1 (R9), 2026-11-06 | to measure | 6 |
| B14 | No interval is mentioned when nothing is on the record ("with nothing on the record, a card has nothing to measure from") | P2-10, owner question 2026-11-06 | to measure | 6 |
| B15 | A "Why this" holding only sources is titled "Sources" | PR #135, 2026-11-07 | to measure | 8 |
| B16 | The card's description of the patient matches the patient's real history, both age band and product (never "PCV13" for a PCV15, never "at or after 6" for baby doses) | FINDING G (PR #69), FINDING H (PR #71), §C-AGE6-WORDS | to measure | 6 |
| B17 | A line about a later age (PneumoVax: at 19, at 50) is the app's own answer for the same patient run forward to that age, never hand-written | §B-AT19 (2026-10-31), PRs #129, #134, #136, #139 | to measure (MeningoVax's analogues: boosters, the 16-year dose, MenB at 16–23) | 5 |
| B18 | The patient screen fits a phone: no sideways scrolling, no button past its box | PR #118, owner 2026-11-01 | to measure | 6 |

### C. Sources and superscripts

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| C1 | Hovering a raised number names the document | C1, 2026-10-17 | **Done** (`c1118c1`) | — |
| C2 | The source buttons sit under a row headed "Sources", and each carries the same number the text uses. **Numbering order is hers (2026-10-17): "The sentences dictate the order the references are listed out"** — the first document a sentence cites is [1]. Numbers and buttons come from one computation (`cardSources()`), never two lists | C2/C3, PR #66 | **Done 2026-11-21** (`cardSources()`; order: as read, owner) | 8 |
| C3 | Every number has a button on the card; no number without a button | G2 guard | **Done 2026-11-21** (guard: `regression-2026-11-21-c2-c3-numbered-sources.test.jsx`) | 8 |
| C4 | A card credits only the documents that speak for it — each (document, statement) pair is cited or taken off, never left in between | CLAUDE.md "A card credits only…", 2026-10-17 to 10-29 | Not done | 8 |
| C5 | Every quoted source names the patient group it was written about (`population`); a card never shows another group's quote except where declared | 2026-10-17 | Not done | 8 |
| C6 | Cite CDC first; use immunize.org only where CDC does not state the claim | 2026-10-23 | Not done | 8 |
| C7 | One source per claim, one number per sentence a document states; never the same sentence twice | FINDING N, 2026-10-23 | Not done | 8 |
| C8 | Sources row sits inside "Why this" | §WORD-1 decision, 2026-11-06 | **Done** by Q10 (2026-11-19) | 8 |
| C9 | A CDC link opens the closed section that holds the quoted sentence | #141, 2026-11-07 | Uses `#:~:text=` links; to measure | 8 |
| C10 | A source button comes off a card when its row does not fit the patient (all columns must fit) | §B-JOBAID-NOROW, 2026-10-18 / 11-07 | Not done | 8 |
| C11 | Each number sits on the exact claim its document states (e.g. the word "complete" cites the sentence that says "complete"; a dose TOTAL cites the row that states that total) | P2-7 (2026-11-06); C10-1 (PR #81) | Not done | 8 |
| C12 | Clicking or hovering a number shows the quoted sentence itself, in a pop-up over the number | PRs #114, #141 | Hover names the document (C1); the quote pop-up is to measure | 8 |
| C13 | A quote never says the opposite of its card (e.g. a "no dose now" card quoting "give 1 dose"), and is written about the card's own age band | FINDING C (PR #64), FINDING N (PR #75) | Not done | 8 |

### D. The Rulebook page

| # | PneumoVax decision | Where it was decided | MeningoVax now | Step |
|---|---|---|---|---|
| D1 | An in-app Rulebook tab in the app's own decision order, the app's own decisions named and numbered, one source per claim. A row's Source button shows only the sentences that row rests on, and only ones the app's own card for that patient cites; no Source on pure app decisions or on the app's own dose labels | PRs #114, #115, #117, 2026-11-01 | `meningococcal-rules-summary.md` only (no in-app page) | 7 |
| D2 | Her review notes: chronological ages; each group says WHAT changes; which risk wins; weeks/months/years; how products combine; standard schedules first; the dose-chip labels used in the spacing section; opens in its own section; works on a phone (pinned first column, closed parts) | memory `rules-page-owner-design-notes`; PRs #117–#118 | — | 7 |

### E. How PneumoVax keeps itself honest (steps 1 and 2)

| # | PneumoVax practice | Where | MeningoVax now | Step |
|---|---|---|---|---|
| E1 | Two saved-answer files (real and impossible patients), and every moved answer explained before they are rewritten | S8, 2026-10-12; PR #86 | Not present | 1 |
| E2 | A prose diff of every sentence a clinician reads, including text behind "Why this" | `scripts/proseDiff.mjs`; §K-READING | Not present | 1 |
| E3 | Seven whole-app checks over every patient: advice accepted, plan holds, complete means complete, options agree, card and chip agree, age lines clean, stable over time. Four are required tests | PRs #119, #130, #131, #133 | Not present | 1 |
| E4 | A typical-patient list (ordinary on-time histories), because the main grid cannot build them | PR #119 | Not present | 1 |
| E5 | The app advises and grades by ONE reading of each interval table ("the app had two numbers for one dose") | P0, PR #76, 2026-10-23 | to measure | 2 |
| E6 | Live audits against CDC's own sentences for ordinary patients near each age line | PR #143; PR #87 (CDC's PneumoRecs) | Not present | 1 |
| E7 | The rulebook is held to the code by a test, cell by cell | `rule-docs-match-code.test.js` | Has a test of the same name; scope to measure | 7 |

### F. Already shared by both apps (no work, guarded by test)

`dateUtils.js`; the transplant / CAR-T / B-cell hard stop; the design-review universal rules (no
decorative icons, no pill shapes, CSS custom properties only, three ways to close a pop-up).

**Not to carry over:** anything pneumococcal (p2016, PCV7, PCV15→PPSV23, the IC/non-IC child split, the
thrown-out PPSV23 rulings, the age-19 and age-50 lines).

## Ledger: every PneumoVax commit since MeningoVax last changed

All **82** commits on PneumoVax's `main` after `3dc0264` (C1, the twin of MeningoVax's last
commit `c1118c1`), oldest first, counted with `git rev-list --count 3dc0264..origin/main` on
2026-11-08. Every description was read on 2026-11-08: 7 in full, and the other 75 to the end of their
opening (the first 13–14 lines, where each states its decision and the patient it was decided on). A
row added later from a commit's deeper text is still possible; check a commit in full before
porting the item it is marked with. **Mark:** the table row(s)
above that it decided or changed; **P** = a pneumococcal clinical rule, not carried over; **Docs** =
handoffs and notes only. A commit marked P can still carry a general practice, named beside it.

| Commit | Date | Title | Mark |
|---|---|---|---|
| `a47010f` | 2026-10-17 | Immunocompromised children were being told their pneumococcal series was finished when it wasn't (#58) | P |
| `dd6731a` | 2026-10-17 | C7 document 6: read CDC's Adult Notes live — one statement, and it cites cleanly (#59) | C4 (method: read the document live) |
| `9b1bc1d` | 2026-10-17 | C7 document 4: read the catch-up job aid — one clean citation, one decision for the owner (#60) | C4 (method) |
| `070f333` | 2026-10-17 | Finding A: an immunocompromised child who already had PPSV23 waits five years, not eight weeks (#62) | B12; P |
| `af0103f` | 2026-10-17 | Handoff: Findings A and B merged, and the one half of B that is deliberately not started (#63) | Docs |
| `f61d063` | 2026-10-17 | Three citation defects: a quote that contradicts its card, a quote that excludes its patient, and a baby told nothing about age 2 (#64) | C13; C5 |
| `5bffe00` | 2026-10-17 | Every quoted source now says which patient it was written about (#65) | C5 |
| `cb7726e` | 2026-10-17 | The grey source buttons now carry the number the card's text uses (#66) | C2, C3 |
| `8a85618` | 2026-10-18 | C8, document 2: a card now credits only the documents that speak for it (#67) | C4 |
| `7c0559a` | 2026-10-18 | Four owner decisions: two documents now fully cited, and mm7401a1 goes back where it belongs (#68) | C4; P |
| `a7dc1e3` | 2026-10-18 | FINDING G: a card now names the vaccine history the patient actually has (#69) | B16 |
| `6a91beb` | 2026-10-18 | Docs: hand off the p2016 column-fit audit and four owner rulings (#70) | Docs; C10 |
| `2fdb48e` | 2026-10-18 | Four P0 citation findings: a card now names the patient it was written about (#71) | B16; C5 |
| `b6d6364` | 2026-10-23 | FINDING M: stop asking for a dose a child finished in their second year; and credit every source on both healthy 24-59m cards (#74) | B16; P |
| `770227d` | 2026-10-23 | CDC's Child/Adolescent Notes now say what they are on each card for — plus FINDING N, a 6-year-old quoted a toddler's rule (#75) | C13, C7 |
| `e4a379e` | 2026-10-23 | C9: immunize.org p2016 is credited on the cards built from its rows (2,128 cards) (#77) | C4; P (p2016) |
| `9946d93` | 2026-10-23 | The "complete because PPSV23 was given" cards now say who says so (860 cards) (#78) | C4; P |
| `47f75de` | 2026-10-23 | The healthy 5-18 "no PCV indicated" card now cites CDC, and drops immunize.org p2016 (1,584 cards) (#79) | C6 |
| `7d95620` | 2026-10-23 | P0: a PCV dose given too soon no longer counts — the app had two numbers for one dose (#76) | E5; P |
| `5534da7` | 2026-10-23 | Docs: the P0 citation measurement is done, and four owner rulings from 2026-10-23 (#80) | Docs |
| `fd35c7c` | 2026-10-23 | C10-1: the infant catch-up card now cites the row that states its own number (781 cards), and immunize.org p2016 comes off 1,633 it is silent on (#81) | C11; P |
| `9da398d` | 2026-10-23 | C10-2: the app advises the ROUTINE date and states the minimum beside it (patients D and F), and CDC's catch-up schedule appears on cards for the first time (#82) | B2 |
| `97277a7` | 2026-10-24 | Ruling D: the repeat dose is measured from the dose the patient actually got (#83) | Ruling D (step 3) |
| `1b36184` | 2026-10-24 | An invalid adult dose: families 2 and 3 reverted, Ruling F kept, and what the patient is actually owed (#84) | A16; P |
| `758f929` | 2026-10-25 | Your four decisions of 2026-10-25: the PCV13 patients, the later clock, the children's note, and the safety net (#86) | A17; E1 |
| `1c3fe52` | 2026-10-25 | A map of the rules, and 66 patients through CDC's PneumoRecs (#87) | E6 |
| `a66219a` | 2026-10-25 | A PPSV23 now anchors a child's next conjugate, an early one counts with the repeat offered, and both rulebooks become a lookup (#88) | A16; P |
| `84ffe45` | 2026-10-25 | Your adult table of 2026-10-25: no adult dose is thrown away for timing again (#90) | A16 (adults) |
| `7feb43a` | 2026-10-25 | Your ruling: a child's conjugate inside 8 weeks of a PPSV23 no longer counts (#91) | P |
| `c3503c5` | 2026-10-25 | Docs: record your three decisions of today so a fresh session starts with them (#92) | Docs |
| `0b6494a` | 2026-10-26 | Three children's items: the 8-week wait from her last PPSV23, the infant floors pinned, and a child's PCV21 naming PCV20 (#93) | A10; P |
| `ca1d6d7` | 2026-10-29 | Handoff after the three children's items, and a warning about PR #89 (#94) | Docs |
| `0bc8a7d` | 2026-10-29 | Your two decisions of today: a thrown-out dose names no vaccine, and both children with a recent PPSV23 wait eight weeks (#96) | A10 |
| `ed841e6` | 2026-10-30 | The last unexplained source chip comes off, and the card tells you to re-check at 50 (#97) | C4; P (age-50 line) |
| `6ad741b` | 2026-10-30 | P2: a child's second PPSV23 inside five years — counted if immunocompromised, an extra dose if not, never a third (#98) | A15; P |
| `abb9782` | 2026-10-31 | Noah, Ava, Maya: a repeat PPSV23 counts, an on-time extra dose, and what happens at 19 (#99) | A15; B17; P |
| `7cdb26c` | 2026-10-31 | Lily, Noah, Eli/Rosa, Sam: a third PPSV23 is extra, the 'at 19' line from the adult card, an extra PPSV23 holds the card, and a grey area named (#100) | A15; B17; P |
| `7b954b3` | 2026-10-31 | Max, Kai, Noah, Zoe: no third PPSV23 shot, and a healthy child's PPSV23 is 'not needed' (#101) | A1 (not needed); P |
| `94530ea` | 2026-10-31 | Ivy, Sam, Leo: no third PPSV23 shot after two too-young ones, and a thrown-out PPSV23 points to the later dose (#102) | A11; P |
| `d0d9461` | 2026-10-31 | Leo at 19, Ivy grown up, and a same-day PPSV23 names the PCV actually given (#103) | A11; A12; P |
| `9c45ebd` | 2026-10-31 | Adult with a PCV15 and two thrown-out baby PPSV23 shots: PCV20 or PCV21 instead of a third PPSV23 (#104) | P |
| `89de774` | 2026-10-31 | Baby doses then PCV20 at 6+: correct 'before age 6' wording; an IC child's early PCV20 gets a note; 'state the minimum' closed (#105) | B16; B2; P |
| `ac5b3c7` | 2026-10-31 | At-risk toddler who finished her baby series with a PCV20: complete, not 'give PCV20 again' (#106) | P |
| `fed7bc7` | 2026-10-31 | A toddler who started PCV at 12-23 months is finished after two doses, not three (#107) | P |
| `70aefe8` | 2026-10-31 | Adult with two PPSV23 doses: read the right one (§H-ANY65, §H-PPSVLAST) (#108) | P |
| `ed27ee5` | 2026-10-31 | A PCV dose 1–4 days before the first birthday counts as the 12-month dose (Lily) (#109) | A18 |
| `662bf44` | 2026-10-31 | Adult dose given too early: keep its note, and never say it met a minimum it missed (#110) | A14; A16 |
| `cb92649` | 2026-10-31 | Leah: a child whose only PPSV23 came too soon after a PCV gets PCV20 only (#111) | P |
| `e4ac542` | 2026-10-31 | PCV7 dose chip reads "Not counted", not "Off-window - repeat" (#112) | A1 (decision 5) |
| `2738347` | 2026-11-01 | §C-P2-FIVE: a child's PPSV23 after any earlier PPSV23 waits 5 years (#113) | P |
| `6af3c1a` | 2026-11-01 | Rules page redesign live; a PPSV23 that didn't count still sets the next PCV's date (#114) | D1; C12; P |
| `4d9af86` | 2026-11-01 | Rulebook: CDC re-check and your 2026-11-01 review (#115) | D1, D2 |
| `1de9b7e` | 2026-11-01 | Grey-zone audit: 8 wording and citation fixes (P1-1 to P2-5) (#116) | B16; C11; P |
| `96f72d5` | 2026-11-01 | Rulebook in the app's own order: one source per claim, numbered PneumoVax decisions (#117) | D1 |
| `83e095d` | 2026-11-01 | Rulebook on a phone: pinned first column, closed parts, three-line decisions (#118) | D2; B18 |
| `97b3863` | 2026-11-05 | Whole-app rule checks: seven questions asked of every patient (#119) | E3, E4 |
| `9286fc8` | 2026-11-05 | P0-1 (R1): the 2nd PPSV23 waits for the 8 weeks too, and the card says why (#120) | B12; P |
| `f5e8b23` | 2026-11-06 | P1-1 (R2): a dose falling at 19 or later gets the adult answer, shown from today (#121) | B17; P |
| `2486960` | 2026-11-06 | P1-3: Noor's PCV15 is an extra dose, and the next dose still waits for it (#122) | A15 |
| `f89f01f` | 2026-11-06 | P1-2: "No dose now", not "Complete", while a dose is still owed on this schedule (#123) | B3 |
| `e091139` | 2026-11-06 | Wording fixes: "now", "complete", "at or after age 6", "overdue" (P2-1, P2-3, P2-7, P2-8) (#124) | B13; C11; B5 |
| `9c7d820` | 2026-11-06 | P2-2 (R3): an infant's advised date holds across 7 months (#125) | B2; P |
| `2cb8931` | 2026-11-06 | P2-9, P2-10: "Routine" for an on-time baby; no interval before a first dose (#126) | B4; B14 |
| `e8c916d` | 2026-11-06 | WORD-1: fold the result page (#127) | B11; C8 |
| `b894934` | 2026-11-06 | P1-3: a child's conjugate no card asked for is an extra dose (Theo, Mateo, Lena, Ben) (#128) | A15 |
| `0ed8049` | 2026-11-07 | Four rulings of 2026-11-07: Sam, Cora, the healthy baby, the healthy 5-year-old (#129) | B17; P |
| `1c0e95b` | 2026-11-07 | Check 1 is a required test: a dose given on the advised date is never faulted (#130) | E3 |
| `e72887d` | 2026-11-07 | Check 7 is now a required test: looking at a record later does not change the answer (#131) | E3 |
| `27ec0b3` | 2026-11-07 | Check 5 is now a required test: the card and the chip under a dose name one date (#133) | E3 |
| `54a2c36` | 2026-11-07 | Owen: Option B says what PPSV23 leads to at 50, under "Why this" (#134) | B17; P |
| `bf9cd53` | 2026-11-07 | Ava: toddler age-50 line follows the baby card; "Why this" with only sources says "Sources" (#135) | B15; B17; P |
| `6679ace` | 2026-11-07 | Leo and Nina: the healthy 5–18 card drops "age 50" once a PCV20 is given (#136) | B17; P |
| `b3f2584` | 2026-11-07 | Mila: the Job Aid button comes off toddler cards it has no row for (#137) | C10 |
| `1713823` | 2026-11-07 | Theo: the Job Aid button comes off when its row says "today" and the card waits (#138) | C10 |
| `036af4c` | 2026-11-07 | Kai and Zoe: the healthy child cards drop "age 50" when 50 would read Complete (#139) | B17; P |
| `3b91535` | 2026-11-07 | Remy: the card's top line says "Next dose due", not "eligible" (#140) | B1 |
| `f2b3009` | 2026-11-07 | CDC links open the closed section that holds the quoted sentence (#141) | C9; C12 |
| `711afb2` | 2026-11-08 | Wording audit: the Rulebook's healthy row, and five-year cards name the PPSV23 that counted (P2-1, P2-2) (#142) | D1; A11; P |
| `670e888` | 2026-11-08 | Children near an age line: the app agrees with CDC for all 95 (Audit 1, second half) (#143) | E6 |
| `65d8186` | 2026-11-08 | Every recorded dose gets one label, in plain wording (dose labels, L1–L4) (#144) | A1, A2, A3, A4 |
| `d541e8f` | 2026-11-08 | Every card's "Why this" follows your style rules (wording only) (#145) | B9 |
| `6e637ce` | 2026-11-08 | Sentences in view and Complete cards follow your style rules (wording only) (#146) | B10; A4 |
| `e45bbdd` | 2026-11-08 | R4: a thrown-out PPSV23's 5-year date only where a PPSV23 can follow; Max gets PCV20 only (#147) | A6 (a dose line never promises a date no card asks for); P |
| `5ee7e03` | 2026-11-08 | MeningoVax port plan reviewed, and PneumoVax checked against CDC's CDSI (docs + one script) (#148) | Docs |
| `08a7428` | 2026-11-09 | CDSI findings 1 and 2: a newborn's first-dose date, and the 12-month booster's date (#149) | B1 (a next-dose card always carries a date); P |
| `2aec24c` | 2026-11-09 | CDSI findings 3 and 4: each PCV dose's own minimum age, and the 4-day grace at age 2 (#150) | A18 (grace on minimum ages); Ruling D taken from the rule table; P |
| `9f6e398` | 2026-11-09 | GRACE12-HELPS: the 12-month grace only where it means fewer doses owed (Ivy) (#151) | A18 (the grace applied only where it helps the patient); P |
| `6d58990` | 2026-11-09 | CDSI finding 5 is the Sofia history: keep PCV20 (owner, 2026-11-09) (#152) | P |

Rows `5ee7e03`–`6d58990` were added 2026-11-15 and marked from their titles and
`decision-2026-11-08-cdsi-findings-1-to-4.md`, not read in full; read each before porting it.

**When a new PneumoVax commit lands:** add it to this ledger and, if it is not P or Docs, to the table.

## The phases, with sessions, owner stops and estimates

Replaces the draft's eight steps (2026-11-08 review). **One PR per numbered item**, in
MeningoVax, on a branch even though its `main` is unprotected. Each item runs the `fix-queue`
loop: reproduce with a meningococcal patient, failing test, change, full suite, **break each
new clause and quote what fails**, check in the running app (`MeningoVax dev server`, port
5175), commit. A **STOP** means the session ends there with a handoff and waits for her; it
never defaults a decision. "Session" = one 5-hour window.

Estimates use the 2026-11-05 calibration (memory `usage-estimate-calibration`): a full 5-hour
window ≈ 14.5% of a week on the Pro plan; an ordinary fix PR ≈ 2.5%; a rule change with owner
questions and moved patients ≈ 2.5–5%; a whole-app audit ≈ 6.6%. **They are estimates, not
measurements**: re-measure with `get_usage` at the end of Phase 1 and correct this table.

### Phase 0 — Measure, change nothing (1 session, ≈ 6%)

0.1 Add the pointer file `docs/archive/plan-2026-11-08-meningovax-port--SEE-PNEUMOVAX.md` in
    MeningoVax (the pattern its two earlier pointer files use).
0.2 Run MeningoVax's suite and record the real count (2026-11-08 baseline: 1,636 passing, 136 files).
0.3 Fill every "to measure" cell in tables A–E from the code, with file and line.
0.4 List **every place a dose can be rejected, set aside or adjusted** — read on 2026-11-08:
    14 `invalidResult` branches in `validate.js`, plus the not-counted-before-10/16 path, the
    extra-dose path, the early-MenB-dose-2 and early-dose-3 rescue paths, and the three record
    problems. For each: the condition, the words shown, the gap it measures from.
0.5 Read live, and save the quotes: CDC child/adolescent and adult schedule notes
    (meningococcal sections; they are accordions — memory `cdc-notes-pages-are-accordions`),
    ACIP 2020 RR-9, and the 2024 pentavalent MMWR. Put each beside its CDSI row.
**Deliverable:** the measured tables and a one-page rule inventory in `docs/archive/`.
**STOP A — owner:** approve the phase order (no clinical question yet).

### Phase 1 — Safety nets (2 sessions, ≈ 10%)

1.1 Saved-answer files from `src/test-grid.js`: one for real patients, one for impossible
    entries, and the test that fails when either moves (E1). No clinical change.
1.2 The prose diff of every sentence a clinician reads, "Why this" included (E2).
1.3 A typical-patient list — ordinary on-time histories the grid cannot build (E4).
1.4 Whole-app checks, adapted to meningococcal: advice is accepted; the plan holds; complete
    means complete; options agree (pentavalent vs two shots); card and chip agree; age lines
    clean (10, 11, 16, 19, 22, 24 years; 2, 7, 12, 24 months); stable over time (E3).
    **Findings are listed, not fixed.**
1.5 **CDC's CDSI test patients** (M-CDSI-2, added 2026-11-08): run CDC's meningococcal test cases
    through the app and list where it disagrees. See `plan-2026-11-08-cdsi-checks-both-apps.md`.
**STOP B — owner:** she sees how many patients each check flags, grouped by clinical family
with one worked patient each (memory `group-blast-radius-by-clinical-family`). She merges.

**STOP B — ANSWERED 2026-11-15 (owner, five questions, one patient each).** Sources read live
that day: ACIP MMWR RR-9 (2020-09-25) Tables 8 and 10 and the college text; CDC child/adolescent
schedule notes (updated 2025-07-01). Applied in Phase 3 (each with `verify-clinical-source`
re-read before the code changes); no code changed at STOP B.

| # | Question (report) | Patient | Owner answer |
|---|---|---|---|
| B-1 | The 4-day grace at an age line that picks the schedule (1.4 E + 1.5 family 5) | Travel baby, Menveo 2 days before 7 months: today 4-dose series; on the 7-month day 2 doses. CDC 2013-0500: MenACWY 1 day before 10, app counts it (CDSI: dose at 11) | **"Only when it helps"** — the PneumoVax §A-GRACE12-HELPS ruling (2026-11-09) carried over: use the grace at an age line only where it means fewer doses owed. 7-month baby → 2-dose series; age-10 dose keeps counting (a DELIBERATE CDSI difference, family 5). Also 2 years and 7 years |
| B-2 | Outbreak box still ticked (1.4 B; 1.5 families 1, 11) | Born 2007-09-15, MenQuadfi at 11 and 16: "Complete for this outbreak", then a "top-up" 5 years on | **Keep asking for the dose 5 years on (3 if last dose <7 y) while the box is ticked, and drop "Complete".** Owner wording note: *"do not use 'top up'. Similar to pneumovax, use succinct clinical language for the app recommendations"* — e.g. "Booster Sep 15, 2028 if outbreak risk continues" (ACIP Table 8 calls it a booster dose) |
| B-3 | Military recruit, one dose (1.5 family 12) | 20 y, Penmenvy 2025-07-06: "Complete — check the service's requirement" | **Show the 5-year booster date with the assignment caveat, no "Complete"** (ACIP Table 10: "Every 5 yrs on basis of assignment"). CDSI 2025-UC-0019 should then agree |
| B-4 | Military/college box under 16 (1.4 A = Phase 0 N9) | 11 y, college-dorm ticked, MenQuadfi 2026-09-01 and today: card asks, chip refuses, for ever | **Routine only under 16**: the box adds nothing; the card follows the routine schedule and says the college/military dose is given at 16 or older. Card and chip then agree |
| B-5 | Pentavalent card before the dose questions are answered (1.5 side finding) | CDC 2020-UC-0004: MenB "Answers needed" beside "Both … are due today" | **Wait for the answers**, as the MenB card does |

**Not asked — the owner's rule already decides it:** a healthy 10–15-year-old with a routine dose
says "Complete" beside "Booster due at 16y" (1.4 B, first row). PneumoVax owner rule 2026-11-01,
*"Complete should only be used if no additional doses/boosters are needed"*, applies: the status
stops saying Complete (Phase 3, with B-2/B-3).

### Phase 2 — The rule table (1 session, ≈ 4%)

2.1 A `doseIntervalRules.js`-style table: every row from 0.4, with its five answers as the
    code **behaves today**. `validate.js` calls it once per dose. **0 answers may move** —
    the saved-answer files prove it.
    **BUILT 2026-11-15 — MeningoVax PR #86** (`src/logic/doseRules.js`, 34 rows; saved answers,
    prose diff 0 of 23,400 and CDSI "moved 0" all unchanged; `dose-rules-table.test.js`). The file
    is `doseRules.js`, not `doseIntervalRules.js`: it holds age, family and record rules too.
2.2 A "what the sources say" column beside "what the app does", filled from 0.5.
    **BUILT 2026-11-15 — MeningoVax PR #87** (`sourcesSay` on all 35 rows: verdict, quotes read
    live, note; 0 of 23,400 sentences moved). STOP C Q2 = 8 rows, Q4 = 4 rows, frozen in
    `dose-rules-table.test.js` §5. Not read: CDC's general advice on undated records (before STOP C).
2.3 **CDSI comparison test** (M-CDSI-1, added 2026-11-08): the rule table held against CDSI's two
    meningococcal files, with a named list of deliberate differences. Same plan file as 1.5.
    **BUILT 2026-11-15 — MeningoVax PR #88** (`cdsi-rule-comparison.test.js`; 442 CDSI rules read
    from the XML, all accounted for; 57 agree, 26 differ: 3 wording, 5 owner, 18 open = 9 questions;
    0 moved). Adds to STOP C Q2: N1 pentavalent at 26+, N2 Bexsero 2-dose course before 2024-10-25,
    N3 grace at the healthy MenB 6-month line, N4 upper ages, and the grace on high-risk MenB dose 3.
    N5: MenQuadfi from 6 weeks — unknown brand, and dose 1 of the infant series (owner asked
    2026-11-15 for these to be questions, not consequences of her 2026-09-23 decision).
    Report: MeningoVax `docs/archive/report-2026-11-15-cdsi-rule-comparison.md`.
**STOP C — ANSWERED 2026-11-15** (owner; packet and answers: MeningoVax
`docs/archive/stop-c-packet-2026-11-15.md`). In short: C1 an undated dose does not count (and ask PneumoVax
the same for PCV); C2 Ruling D; C3 old Bexsero courses get the current schedule (owner principle, a
deliberate difference from ACIP mm7349a3); C4 pentavalents from 26 keep counting; C5 a high-risk MenB
dose 3 ≥4 months after dose 2 counts; C6 the MMWR "unless"; C7 4-day grace on series-length gaps;
C8 keep 4 weeks; C9 keep booster minimums, repeat timed from the early booster; C10 travel boosters
checked; C11 8 weeks between MenACWY doses; C12 healthy MenB dose 2 under 4 weeks not counted; C13
unknown brand from 2 months; C14–C16, C18 no change; C17 moot.

**STOP C — DECISION PACKET 1 (the clinical one).** Each question with a meningococcal patient,
the app's answer today, the answer after, how many patients move, and a control case:
- **Q1 Ruling D** (R-2): the asplenia patient (Menveo 8/1, 8/22). Validator and card.
- **Q2 Each row where app and sources differ** (R-4 a, b, c, plus any 0.5 finds): floor,
  advice, or app rule?
- **Q3 The pentavalent** (R-8): rejected for one vaccine, does it count and set the clock for
  the other?
- **Q4 Rows with no source**: keep as "This app" rules, and in what words?

### Phase 3 — Apply packet 1 (2 sessions, ≈ 8–10%)

3.1 Ruling D on all three surfaces (validator, card, chip), copying PneumoVax's split (the
    anchor moves; dose numbers and totals stay on doses that counted). Rewrite rulebook §4.
3.2 One PR per family of rows Q2/Q4 changed. Every moved answer explained in the PR body
    before the saved-answer files are rewritten.
**STOP D — owner merges each PR.** Nothing in Phase 4 depends on the order inside Phase 3.
**BUILT 2026-11-16/17** — family 1 Ruling D (#90); family 2 C1/C17 (#91); family 3 C5–C7 (#92);
family 4 C10/C11/C13 + `fmtMinAge` fix (#93); family 5 relabels (#94); STOP B B-2–B-5 + the
Complete rule + C10's outbreak half (#95). #92–#95 merged into their stacked base branches, so
MeningoVax **#96** lands them on `main` (merged 2026-11-17). **Owner answers D1–D8 (2026-11-17)
built** in MeningoVax #97 (merged): college 5-year cover (reverses M17), set-aside dose starts the
clock, MenB 6-month grace lines, MenACWY too-young repeat 8 weeks, military booster check, outbreak
wording, MenB switch line. **D9** (college: no repeat for staying in a dorm; no code) and **D10**
(serogroup B outbreak: one MenB booster; MeningoVax #98, merged). **B-1 built 2026-11-17**
(MeningoVax #99, open): the 4-day grace at the MenACWY 3-month, 7-month, 2-year and 16-year lines,
only when it means fewer doses, from the dose day on; owner D11 (age 7: no grace, 3-year booster),
D12 (3 months: yes), D13 (16 years: Complete on the dose day). **Phase 3 is complete.** Next:
Phase 4 (ask Q5–Q8 first). **Phase 4 built 2026-11-17 (MeningoVax PR #100, open)**: STOP E1 asked
and answered as Q5–Q11 (`decisions-2026-11-17-open-questions.md`). 4.1's A1/A3/A15 done; A2 colours,
A10, A11, A16 not asked (see the handoff). Next: Phase 5. Handoff:
`handoff-2026-11-17-meningovax-phase4-built.md` (this folder).

### Phase 4 — One label per dose (1 session, ≈ 5%)

4.1 `doseDisposition()` names the verdict already reached; `doseChipLabel.js` words it;
    colours as A2. Covers A1, A3, A10, A11, A15, A16, A18.
**Decision packet 2, asked BEFORE building (STOP E1):**
- **Q5** A dose thrown out for timing: "Not counted — do not repeat" (PneumoVax W1) or
  "Not counted — repeat"? (R-5a)
- **Q6** A MenACWY dose before 10 / a healthy MenB dose before 16: what label? Today
  "Off-window - repeat", against its own rulebook's "no repeat needed". (R-5b)
- **Q7** "Booster": keep it as MeningoVax's own label?
- **Q8** "Extra" means "the card on that day did not ask for it" — apply here?
**STOP E1 ANSWERED 2026-11-17** (Q5 repeat; Q6 "given before age 10/16"; Q7 keep Booster; Q8
PneumoVax's rule, college exempt; Q9 "Dose N"; Q10 "do not repeat" when no card asks; Q11 no
first-dose exception) — `decisions-2026-11-17-open-questions.md`. Built in MeningoVax PR #100.
**STOP E2 — owner merges.**

### Phase 5 — Dates stated plainly (1 session, ≈ 5%)

5.1 B1, B3–B6, B17; A5, A6, A13, A17.
**Decision (STOP F1, before building):** **Q9** advise the routine date and state the minimum
beside it (B2)? Where: MenB dose 3, the MenACWY 16-year dose, boosters.
**STOP F1 ANSWERED 2026-11-17**: measured first, the routine date and the minimum differ only at
MenB high-risk dose 2 and infant MenACWY doses 2–3 (the three places named above already advise
the routine date). Owner: **yes at both** (Q9a, Q9b), matching PneumoVax C10-2; the floor for a
dose already given does not move — `decisions-2026-11-17-open-questions.md` ("STOP F1").
Built and merged (#101). **Its two consequences answered 2026-11-18** (F2a: the combined shot is
offered while MenB dose 2 can be given but is not yet due; F2b: the switch line says "due") —
same file, "Q9a consequences". Built and merged (#102). **Gap badge answered 2026-11-18**: on
those days the MenB card's badge says "Can be given today", not "Up to date" (same file, "Gap
badge"). Built and merged (#103). **Phase 5.1 measured 2026-11-18**
(`report-2026-11-18-phase5-measured.md`): B6, A6, A13 and B3's "Complete" clean; F-1 (travel,
lab and outbreak teens pushed past the 16-year booster) **answered and built** the same day
(decision log, "The 16-year booster…"; branch `feature/2026-11-18-phase5-16y-booster-exposure`).
Still to ask: F-2 (13–15 y "routine, 11–12y" → catch-up, B4/B5), F-4 (a too-soon dose line
names no date, A5/A17), F-3 and F-5 with Phase 6.
**F-2, F-4, F-6 answered and built 2026-11-18** (PR #105, merged). **A17 closed 2026-11-18**
(owner: the date shown is already saved; no second date added). **Phase 5 is finished.** Carried
to Phase 6 by the owner (2026-11-18): the 1,984 "Not counted — repeat" lines under a "Not yet
due" card with no date — ask with F-3 and F-5, with worked patients.
**STOP F2 — owner merges.**

### Phase 6 — Wording (2 sessions, ≈ 8%)

6.1 Show her five before/after lines and five "Why this" paragraphs (the most-seen), as in
    PneumoVax; she approves the style rules for MeningoVax (**STOP G1**).
    **STOP G1 ANSWERED 2026-11-18** (`stop-g1-packet-2026-11-18.md`): the rules, yes; a dose-line
    "Why this", yes; F-3, F-5 and the undated "repeat" lines (R-A, R-B, R-C) as recommended.
    **F-3 built 2026-11-18** (branch `port/phase6-f3-badge`; 4,632 "Up to date" badges →
    4,256 "Future booster needed" + 376 "Next dose not yet due"; badge words only; PR #107, merged).
    **F-5 built 2026-11-18** (branch `port/phase6-f5-16y-label`; "Booster due at 16y" →
    "Booster (16y)", 1,452 real patients, label the only change; PR #108, merged).
    **R-A–R-C built 2026-11-18** (branch `port/phase6-r-abc-undated-repeat`; 574 + 588 + 822
    real lines gain a "when"; no answer moved; PR #109). **R-C's chip answered and built
    2026-11-18** ("Not counted — do not repeat", 822 real patients), and its consequence (also when
    a later MenB shot followed: no "Repeated on", 1,104 real patients; PR #110, after #109 merged
    one commit early). **G1-b built 2026-11-18** (branch `port/phase6-g1b-dose-why`: each recorded
    dose has its own "Why this"; `detail` and two background sentences (`whys`) moved behind it;
    14,270 grid patients gain one (9,030 real), 0 sentences changed, 0 source numbers changed).
    **G1-a built 2026-11-19** (branch `port/phase6-g1a-style-rules`: the ten rules applied to
    every dose line, card lead and "Why this"; 21,510 of 24,600 saved patients read different
    words; 0 verdicts, dates, chips, badges or source numbers moved; longest dose line 73 → 50
    words, longest "Why this" 74 → 66; guard `regression-2026-11-19-g1a-style-rules.test.js`).
    **Its findings F1–F3 answered and built 2026-11-19** (exact gap where rounding printed the
    minimum, 561 lines; no "rescue" on the card, 1,044 patients; no "Do not restart the series"
    on a too-soon booster, 810 lines; PR #113, because #112 merged before they were pushed).
6.2 Apply §M-L3, §M-L5 and §WORD-TIDY to every dose line, card and "Why this", with the same
    sweep test (A4, A7–A9, A12, A14, B7–B10, B12–B14, B16, B18).
6.3 **Q10** fold the result page (B11)? Her 2026-11-06 answer was "PneumoVax only"; ask
    again, do not assume. Built only on a yes.
    **Q10 answered 2026-11-19: "Full PneumoVax fold"** (reverses 2026-11-06). Asked with the
    measure: card lines 16 / 44 / 65 words per page in view, disclaimer 117. What stays in view is
    put to her as judgement calls first (`report-2026-11-19-result-page-fold.md`); **answered the
    same day: the six-line stay list as proposed; Sources inside "Why this"; disclaimer
    paragraph behind "About risk history".**
    **Built 2026-11-19** (`src/logic/noteFold.js`, guard
    `regression-2026-11-19-q10-result-page-fold.test.jsx`): words in view 280/424/623 →
    201/325/523; 0 of 24,600 saved pages lost or gained a word.
**STOP G2 — owner merges.** **Done 2026-11-19** (#113, #114 merged). Then four wording answers
    after the fold, W1–W4 (`decisions-2026-11-19-after-the-fold.md`): the 16-year booster's badge
    "Booster due today" (264 real patients); "before 16 years" in its "Why this" (closes Phase 0's
    B16 sighting, 264); the 13–15 booster line "at age 16–18" citing CDC's 13–15 sentence (216;
    ACIP's 11–12 sentence off 270 pages, owner W3a); the healthy MenB "Why this" drops its repeated
    sentence (79 → 69 words, 944). Built on `port/phase6-after-fold-w1-w4`.

### Phase 7 — The rulebook (2 sessions, ≈ 9%)

7.1 A MeningoVax `CLINICAL_SPEC.md`: every rule with its quote and date, sections in the
    app's own order, the app's own decisions numbered. The rule table generated from the
    Phase 2 describers, held to the code cell by cell (E7). Drop the vaxapp sync (R-7).
    **PART BUILT 2026-11-19.** Owner: the rulebook is `docs/agent/meningococcal-rules-summary.md`
    grown, not a new `CLINICAL_SPEC.md` (MeningoVax keeps three files at the top). Its §5 is
    written from `DOSE_RULES` by `npm run rulebook` (`src/data/rulebook.js`): the 37-row table,
    22 numbered app decisions, every quoted sentence with the date read; held cell by cell by
    `rulebook-table-matches-code.test.js`. vaxapp sync line dropped. **Not yet:** quotes and dates
    for the card (forecast) rules in §§1–3, which have no row table to generate from.
    **Owner, 2026-11-19: "Link to source list".** Each rule in §§1–3 stays in plain English and
    names its `refs.js` entry (or says it is an owner decision); `npm run rulebook` copies the
    quote, link and read date in under it; a test fails if a rule names neither. Not hand-typed
    quotes, not a card-rule row table. **Mechanism BUILT 2026-11-19:** all 75 rules in §§1–3
    tagged; 55 rest on a quoted sentence or an owner answer, **20 marked "todo"** (no sentence in
    refs.js yet: these need a live read). Guard in `rulebook-table-matches-code.test.js`; the
    "todo" count may only go down.
7.2 **Q11** the in-app Rulebook tab (D1, D2)? Built only on a yes. **Owner, 2026-11-19: "Yes, like
    PneumoVax"** — a Patient | Rulebook switch in the header; built after 7.1 so it shows the quoted rulebook.
    **BUILT 2026-11-19:** `src/data/rulebookPage.js` (what it says) and `src/components/Rulebook.jsx`
    (PneumoVax's layout and CSS): transplant stop, vaccines, age and risk group, MenACWY, MenB, the
    combined shot, doses on the record, 14 named MeningoVax decisions, sources. 69 worked patients,
    each run through `recommend()`; no typed number in the page text; Source shows only sentences the
    cards cite. 0 answers moved.
7.3 MeningoVax `CLAUDE.md`: add the non-negotiables this port created (one rule table; a moved
    answer must be explained; one label list; the rulebook is held to the code).
    **BUILT 2026-11-19** (CLAUDE.md, "What the PneumoVax Port Made Permanent").
**STOP H — owner reviews the rulebook and merges.**
**DONE 2026-11-21**: walked through section by section, all approved, document fixes only
(`decisions-2026-11-21-stop-h-rulebook-review.md`).

### Phase 8 — Citations (3–4 sessions, ≈ 20–25%)

C2–C13, in PneumoVax's order: numbered buttons from one computation; `population` on every
quote; each (document, sentence) pair cited or taken off; CDC first; one number per sentence;
links open the closed section; the quote pop-up. One PR per document, each document **read
whole, tables included, before anything comes off a card** (FINDING F).
**STOP after each document** where a removal or a no-row case needs her (her three escalation
cases). Same-dose questions she has delegated (memory `owner-decides-alone-when-dose-unchanged`)
— **ask her once at the start of Phase 8 whether that delegation carries to MeningoVax**.

### Phase 9 — Close (1 session, ≈ 5%)

9.1 Re-run every whole-app check; live audit of ordinary patients near each age line against
    CDC's sentences (E6).
9.2 Check the `vaccine-parity` skill and both `CLAUDE.md` files name the shared rules.
9.3 Handoff; mark this plan finished.

### Totals

| | Sessions | Share of one week (Pro) |
|---|---|---|
| Phases 0–2 (measure, nets, table) | 4 | ≈ 20% |
| Phases 3–5 (rules, labels, dates) | 4 | ≈ 18–20% |
| Phases 6–7 (wording, rulebook) | 4 | ≈ 17% |
| Phase 8 (citations) | 3–4 | ≈ 20–25% |
| Phase 9 (close) | 1 | ≈ 5% |
| **All** | **16–17** | **≈ 80–90%, i.e. most of one week's allowance, spread over 2–3 calendar weeks** |

Items 1.5 and 2.3 (added 2026-11-08) add about 7% and half a session each to Phases 1 and 2.

**End-of-Phase-1 re-measure (2026-11-15) — could not be done honestly.** `get_usage` read
**weekly 0%, 5-hour 2%** (Pro; week resets 2026-11-19), although the Phase 0–1 sessions ran inside
this week. The weekly counter appears to have been reset, so it says nothing about Phase 1's cost,
and the table above is left as an estimate. Next try: read `get_usage` at the start and the end of
the Phase 2 session and record the difference here.

**Phase 2.1 measured (2026-11-15):** start weekly 2%, 5-hour 8%; end weekly 3%, 5-hour 23%. So
2.1 cost about **1 weekly point** (the weekly counter shows whole numbers only, so 0.5–1.5) and 15
points of one 5-hour window — inside the ≈ 4% estimate for the whole of Phase 2. One item, one
reading: not yet enough to correct the table.

The calendar time is set by her eleven questions and nine stops, not by the work. If a
findings list from Phase 1 is long (PneumoVax's first whole-app run found families that took
days), add about 2.5% per fix.

## Decisions for the owner, in the order they come up

| # | Question | Phase | Asked with |
|---|---|---|---|
| Q0 | This phase order? | 0 (STOP A) | — |
| Q1 | Ruling D for MeningoVax | 2 (STOP C) | the asplenia patient, Menveo 8/1 and 8/22 |
| Q2 | Each row where the app and the sources differ (R-4) | 2 | one patient per row |
| Q3 | A pentavalent rejected for one vaccine | 2 | a Penbraya after a Bexsero |
| Q4 | Rows with no source: keep as app rules? | 2 | one patient per row |
| Q5 | Timing rejection: "repeat" or "do not repeat"? | 4 | — |
| Q6 | The pre-10 / pre-16 dose label | 4 | a healthy 12-year-old with a MenACWY at 9 |
| Q7 | Keep "Booster"? | 4 | — |
| Q8 | "Extra" = not asked for that day? | 4 | — |
| Q9 | Routine date beside the minimum? | 5 | a high-risk MenB dose 3 |
| Q10 | Fold the result page? | 6 | — |
| Q11 | In-app Rulebook tab? **Answered 2026-11-19: yes, like PneumoVax** | 7 | — |
| Q12 | Does the "same dose, decide alone" delegation carry over? | 8 | — **Answered 2026-11-21: "Yes, same as PneumoVax"** (`report-2026-11-21-phase8-citations-measured.md`) |

## Not in this plan

- The 23 "Why this" paragraphs over 60 words in PneumoVax.
- Any meningococcal rule that has not gone through `verify-clinical-source`.
