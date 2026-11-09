> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-09-17-rule-foundation-and-copy.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# MeningoVax — rule foundation + copy audit, 17 September 2026

> **FULLY CONSUMED — 2026-09-17 (latest update).** Every item in this file is done.
> P0-1, P1-1 to P1-4, U1 to U5 and P2-1 are all merged. **P2-2 was written up as
> `docs/archive/plan-2026-09-17-vaxapp-meningococcal-reuse-roadmap.md`** — it is a plan
> for a different repo, not a change to this one.
>
> **One thing this file asked for is still owed and is NOT in the roadmap:** the U4
> copy-style changes owed to PneumoVax under the cross-app parity rule. Track it
> separately; the owner deferred it on 2026-09-17.
>
> Do not re-run anything in this file. Later state:
> `docs/archive/handoff-2026-09-17d-u5-and-p2-1-both-merged.md` and whatever supersedes it.
>
> The older banners below are kept for the history of how the queue was worked.
>
> **PARTLY CONSUMED — 2026-09-17.** The whole **P0 and P1 block is DONE**: P0-1,
> P1-3, P1-2, P1-1 and P1-4 are built, tested and live-verified, and sit in
> **PR #28** (CI green, awaiting the owner's review — not merged). Tests 811 → 882.
> Do NOT re-do them.
>
> **Still open:** U1, U2, U3, U4 and P2-1 (and P2-2, which is not a code change).
> **U1 is blocked on an owner decision** (all 32 notes, or only the 17 over 200
> characters?).
>
> Two findings this session that are NOT in this file: a dose 3 given earlier than
> 4 months after dose 2 is discarded where CDC wants a 4TH dose; and P1-4's half A
> ("use Trumenba for dose 2") turned out to need **no code** — the family lock
> already handles it, which is what this file told the fix session to check.
>
> Current state and the resuming instructions:
> `docs/archive/handoff-2026-09-17-rule-foundation-p0-p1-done.md`.

Read-only audit. Nothing in this file has been fixed. Findings are grouped P0 → P1 → P2,
then a separate **U** (user-interface copy) group.

## Baseline

- Repo: `~/Downloads/MeningoVax-main`, branch `main`, commit `1228f01` (G8, PR #27).
- Test suite: **811 passed / 0 failed** (`npx vitest run`, real run, 2026-09-17).
- Live site driven for the P0: https://jojohuhu-git.github.io/MeningoVax/ (same commit).
- Dev server could NOT be started — all 5 preview slots for this folder were held by other
  chats. The P0 was reproduced against the deployed site and against the real engine
  instead. A fix session should free a slot (ask the owning chat to stop its server —
  killing the process does not release the count).

## Ground rules that constrain any fix here

- **Clinical authority**: ACIP/CDC/AAP/immunize.org over FDA inserts. AAP is the tiebreak
  only where it disagrees with CDC. Enforce CDSI absolute min/max only.
- **Every clinical change needs a live-fetched quote** (`verify-clinical-source` skill).
  The quotes in this file were fetched live on 2026-09-17 and are reproduced verbatim.
- **Cross-repo**: meningococcal rules live in MeningoVax *and* vaxapp. MeningoVax is
  edited first, then ported (`vaccine-parity` skill). P0-1 and P1-2 below both have a
  vaxapp half, already located.
- **Rule docs are tested**: `rule-docs-match-code.test.js` will fail if you change a
  load-bearing number without updating both rule documents. That is intended.
- Owner has **HOLD** on cross-repo work: the agreement fixture and the two owed vaxapp
  parity ports need an explicit go-ahead before starting.

## Where these came from

Her own rule review marked **62 of 65 rules confirmed, 3 flagged**: R3.2, R3.4, R5.6.
- **R3.2 is a real defect** — it is P0-1 below. Her instinct was right.
- **R3.4** is correct as coded; see the note under P0-1.
- **R5.6** was gap G1 and is already fixed (PR #20). The flag is stale — clear it.

---

# P0 — silent wrong answer

## P0-1 · The MenACWY infant series accepts doses 4 weeks apart; ACIP requires 8

**What the app does.** For a MenACWY series started at 3–6 months, a second dose given
28 days after the first is counted as valid, and the app moves the patient on to dose 3.

**Reproduced live** (deployed site, 2026-09-17). Patient: DOB 2025-09-17 (age 12 months),
anatomic/functional asplenia, MenACWY doses **2025-12-17** (age 3 months) and
**2026-01-14** (28 days later). Both risk-timing prompts answered "Yes".

| | |
|---|---|
| Actual | `Dose 1 of 4` ✓ counted · `Dose 2 of 4` ✓ counted · card: **"Dose 3 (infant high-risk series)", due today** |
| Expected | Dose 2 is invalid (given 28 days after dose 1, minimum 56) and must be repeated. The card should still be asking for **dose 2**. |

Identical output is produced when dose 2 is given at 56 days — i.e. the app cannot tell a
correctly spaced series from an under-spaced one. Verified by running both through
`recommend()` and `analyzeHistory()`: `status=valid`, `effectiveCount=2` in both cases.

**The card also prints the wrong rule to the clinician**, in its own words:

> "Continue the infant high-risk Menveo series (**≥4 weeks between primary doses**; booster
> at ~12 months)"

**Source of truth, fetched live 2026-09-17.** ACIP 2020 MMWR RR-9 — the footnote to
Tables 4–6, which is the exact citation the code already carries for this rule:

> "If MenACWY-CRM is initiated at ages 3–6 months, catch-up vaccination includes doses at
> **intervals of 8 weeks** until the infant is aged ≥7 months, at which time an additional
> dose is administered at age ≥7 months, followed by a dose at least 12 weeks later and
> after the 1st birthday"
> — https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm

CDC child & adolescent schedule notes, Meningococcal ACWY, Special situations, Menveo:

> "Dose 1 at age 3–6 months: 3- or 4- dose series (dose 2 [and dose 3 if applicable]
> **at least 8 weeks** after previous dose until a dose is received at age 7 months or
> older, followed by an additional dose at least 12 weeks later and after age 12 months)"
> — https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html

**Where the 4 weeks appears to have come from.** ACIP states a 4-week floor, but for a
*different* purpose — repeating an invalid dose:

> "For situations in which a dose or doses must be repeated, a minimum interval of 4 weeks
> should be used between any 2 doses"

The repeat-dose floor has been applied as the primary-series interval. Worth saying in the
commit message, because it explains why the wrong number looked defensible.

**Suspected source.** The value is hand-typed in at least six places:
- `src/logic/validate.js:94` `MENACWY_BASELINE_MIN_INTERVAL = DAYS.weeks(4)`
- `src/logic/validate.js:98` `MENACWY_HR_INFANT_MIN_INTERVAL = DAYS.weeks(4)` (used at `:454`)
- `src/logic/recommend.js:583`, `:705`, `:960`, `:962` — `DAYS.weeks(4)`
- and again as the literal English "≥4 weeks" inside the card sentence at `recommend.js`.

## The rule to build (owner-decided 2026-09-17 — do not re-derive)

R3.2 as written ("infant primary doses are at least 4 weeks apart") is not one rule with a
wrong number in it. It is **four different rules flattened into one**, which is why the
wrong value survived review. Replace it with these, keyed to the age at dose 1:

| Dose 1 given at | Gap between the early doses | The final primary dose |
|---|---|---|
| **2 months** | **8 weeks** (owner decision) | ≥12 months old **AND** ≥12 weeks since the previous dose (owner decision) |
| **3–6 months** | **8 weeks** (CDC, verbatim) | ≥12 months old **AND** ≥12 weeks since the previous dose (CDC, verbatim) |
| **7–23 months** | n/a — 2-dose series | ≥12 weeks after dose 1 **AND** after the 1st birthday |
| **24 months+** | **8 weeks** — 2 doses, done | — |

**Owner's decisions, 2026-09-17.** ACIP and CDC both print the 2-month schedule ("4 doses at
2, 4, 6, and 12 mos") but **neither states a minimum interval for that band** — verified live.
The owner decided 8 weeks for it, because the printed schedule is itself 8 weeks apart and
the adjacent 3–6-month band explicitly requires 8 weeks; and decided the final dose carries
the same "≥12 months AND ≥12 weeks" test in both bands, so there is one rule for "the final
infant dose" rather than two. Record both as owner decisions in the rule docs — they are
reasoned readings where the source is silent, not quotes.

**The 3–6-month series, as the owner stated it** (this is the wording to implement and to
put in the rule documents — it is codeable where CDC's sentence is not):

> Dose 1 at age 3–6 months (medical or exposure indication): 3- or 4-dose series. Give dose 2
> at least 8 weeks after dose 1. If the infant is younger than 7 months when dose 2 is given,
> dose 3 is due at least 8 weeks after dose 2, followed by the final primary series dose. If
> the infant is 7 months or older when dose 2 is given, the next dose due is the final primary
> series dose. The final primary series dose (the third or fourth) is due when the child is at
> least 12 months old and at least 12 weeks have passed since the previous dose.

**Known edge case — this wording resolves it correctly, do not "fix" it.** With dose 1 at
exactly 3 months and every gap at the bare minimum, dose 3 lands at ~6.7 months — still under
7. Read hyper-literally ("8 weeks apart *until a dose is received at age ≥7 months*, followed
by an additional dose") CDC would demand a fifth dose. CDC caps the series at "3- or **4**-dose",
so the rule above stops at four and lets the final dose (≥12 months, therefore ≥7 months)
satisfy the condition. Never gives fewer doses than CDC intends. Put this in a test with a
comment, or someone will "correct" it back.

**Suggested fixtures.**
- D1 at 3 months, D2 at +28d → D2 **invalid**, repeat advised, card still asks for dose 2.
- D1 at 3 months, D2 at +56d → D2 valid, card asks for dose 3. (Pins that the two cases now
  differ — today they do not.)
- D1 at 2 months, D2 at +28d → invalid; at +56d → valid (guards the owner's 2-month decision).
- D1 at 3 months, D2 at 5 months (<7mo) → 4-dose series; D2 at 8 months (≥7mo) → 3-dose series.
- The bare-minimum edge case above → exactly 4 doses, final dose at ≥12 months.
- Final dose at 12 months but only 8 weeks after the previous dose → invalid in **both** the
  2-month and 3–6-month bands.
- A card-text assertion that the note states the same number the validator enforces.

**vaxapp half — the same bug, already located. HOLD STANDS (owner, 2026-09-17):** fix
MeningoVax only. Do **not** touch vaxapp in the same session. The two apps knowingly disagree
on this rule until a separate, explicitly authorised port. Locations recorded here so the port
does not have to re-find them:
- `src/logic/recommendations.js:633` — `{ minInt: 28, … }`
- `src/logic/recommendations.js:631` — note text "Min 4 weeks between the first three doses"
  (`recommendations.js` holds literal `\uXXXX` escapes — **edit it with Python, not Edit**)
- `src/data/scheduleRules.js:48` — `minInterval:28` for dose 2 when the previous dose was
  given before ~7 months
- `src/data/scheduleRules.js:50` — note text "infant series ≥4 weeks"
Five surfaces apply.

---

# P1 — visibly wrong output or a real capability gap

## P1-1 · The "4 days early is still valid" rule is not implemented anywhere

CDC's general rule, on the same schedule-notes page the app cites, fetched live 2026-09-17:

> "Vaccine doses administered ≤4 days before the minimum age or interval are considered
> valid. Doses of any vaccine administered ≥5 days earlier than the minimum age or minimum
> interval should not be counted as valid and should be repeated as age appropriate."

`grep -rni "grace|4 days|GRACE_DAYS" src/logic src/data` returns **no implementation**.
Every age gate and every interval in the app is therefore enforced as a hard edge.

**Reproduced.** Healthy patient, age 16y1m, MenACWY dose given **3 days before** the 16th
birthday. The app sets it aside:

> "Given at ~15 years 12 months, before the age-16 booster window. Safe, but does not count
> toward the routine series — the routine booster is still due at 16."

Under the 4-day grace rule that dose counts and the patient is done. As it stands the app
recommends an unnecessary repeat injection.

**Owner decision, 2026-09-17: apply it EVERYWHERE** — every minimum age and every minimum
interval in the app — through **one shared helper**, so it cannot be applied inconsistently.
The helper belongs next to the interval module in P2-1. This is broad (it touches every
threshold), so it is its own piece of work, done after the infant-interval fix has settled.

Note the interaction with P0-1: once the grace rule exists, the P0-1 fixtures must use
**+51 days** (56 − 5) for the "too soon" case, not +28, or they will silently stop testing
what they were written to test. Write them with the grace rule in mind now.

**Fixture:** dose at birthday −3 days → counts; at birthday −5 days → does not.

## P1-2 · MenB high-risk: the "dose 3 not needed" exception is missing

CDC child & adolescent schedule notes, MenB, Special situations, fetched live 2026-09-17:

> "Bexsero or Trumenba (use same brand for all doses including booster doses) 3-dose series
> at 0, 1–2, 6 months (**if dose 2 was administered at least 6 months after dose 1, dose 3
> not needed**; if dose 3 is administered earlier than 4 months after dose 2, a 4th dose
> should be administered at least 4 months after dose 3)"

**Reproduced.** Asplenia, age 16y8m, MenB doses 2025-01-15 and 2025-08-15 (7 months apart).

| | |
|---|---|
| Actual | `MenB: Dose 3 of 3 (high-risk)` — a third dose is recommended |
| Expected | Series complete after 2 doses; move to the booster phase (1 year after completion, then every 2–3 years) |

`grep` finds no branch for this: `menbSeriesInfo()` in `src/logic/seriesTotals.js:221`
returns `MENB_HIGHRISK_TOTAL` unconditionally for `highRisk`. Note the *healthy* mirror of
this rule (early dose 2 → rescue dose 3) **is** correctly implemented at
`seriesTotals.js:236` — so this is a missing branch, not a misunderstood rule.

Fix belongs in `menbSeriesInfo()` so engine, validator and card labels all move together.

**Fixture:** HR MenB, D1→D2 exactly 6 calendar months → total 2, booster phase.
D1→D2 at 5 months → total 3. Use `calendarIntervalElapsed`, not a day count — P0-4 already
established that a real six-month gap is 181–184 days.

## P1-3 · A second age formatter prints "15 years 12 months"

`src/logic/format.js:20` `fmtAgeMonths()` carries an explicit fix and a comment saying so:

> "Rounding months independently of years can carry over (e.g. 59.88 → 4y + round(11.88)=12mo)
> — normalize so it never displays 'X years 12 months'."

`src/logic/validate.js:175` `fmtAgeMClinical()` is a near-copy of the same function
**without that normalisation** (`:187-190`). It is the one the record panel uses, so the
app still prints the exact string `format.js` was fixed to never emit — observed in P1-1
above as "Given at ~15 years 12 months".

This is the same one-rule-two-copies shape as the rest of this audit, in the display layer.
vaxapp's `CLAUDE.md` names clinical unit formatting as a shared module that must not be
re-implemented; MeningoVax has re-implemented it.

**Fix:** delete `fmtAgeMClinical`, import `fmtAgeMonths` (reconcile the two small
deliberate differences first: `'?'` vs `''` for null, `'birth'` vs `'Birth'`).
**Fixture:** 191.9 months → "16 years", never "15 years 12 months".

## P1-4 · Penbraya re-use rules are not modelled (needs confirmation before coding)

CDC, same page, fetched live 2026-09-17:

> "For age-eligible children not at increased risk, if Penbraya is used for dose 1 MenB,
> **MenB-FHbp (Trumenba) should be administered for dose 2 MenB**. For age-eligible children
> at increased risk…, Penbraya may be used for additional MenACWY and MenB doses (including
> booster doses) if both would be given on the same clinic day and **at least 6 months have
> elapsed since most recent Penbraya dose**."

`grep -rni penbraya src/logic src/data` finds the antigen-family lock (FHbp) and the
age floor, but **no 6-month re-use interval** and no rule steering a not-at-risk patient
from Penbraya dose 1 to Trumenba for dose 2. `recommend.js:1347` offers both pentavalents
as dose-2 options.

Flagged as P1 rather than P0 because I did not reproduce a wrong card for it — the grep is
the evidence. **Reproduce it first**; if the family lock already makes the practical
recommendation correct, downgrade to a copy fix.

---

# P2 — structural (this is the anti-drift roadmap)

## P2-1 · Intervals have no `seriesTotals.js`, and P0-1 is what that costs

`seriesTotals.js` fixed dose *totals* by giving both brains one function to ask. **Intervals
never got the same treatment.** P0-1 is not a typo — it is one clinical number hand-typed in
six places in this repo and four more in vaxapp, which is exactly the shape of the bug that
created `seriesTotals.js` in the first place.

Build `src/logic/intervals.js` as its sibling. It should own:
- the MenACWY primary gaps (infant, ≥2y high-risk, the 12-week 7–23-month floor)
- the 3-year / 5-year booster cadences
- the MenB month floors and the 4-month rescue interval
- the 4-day grace rule from P1-1

**And — the half that matters most for copy — the card sentences must interpolate from it,
not restate it.** The reason P0-1 misleads the clinician twice over is that the number lives
once as `DAYS.weeks(4)` and again as the English words "≥4 weeks" in the same file. Fixing
only the constant would leave the sentence lying. This is the same lesson as the M5 bug
("Dose 1 of 4" next to a 2-dose total), and the artifact already names it.

Do it one interval group at a time, full suite green between groups.

## P2-2 · The roadmap to reuse for vaxapp

> **DONE 2026-09-17.** Written up, with a real inventory of vaxapp's seven
> meningococcal rule sites and the state that repo is actually in, as
> `docs/archive/plan-2026-09-17-vaxapp-meningococcal-reuse-roadmap.md`.
> The sketch below is what that document was built from.

This is the ordering worth repeating on vaxapp's meningococcal overhaul, because it is what
actually worked here:

1. **Inventory the rules in plain English with a file:line and the citation each one
   claims** — that is what surfaced R3.2, which no test would have caught.
2. **Make the build fail on disagreement** (Layer 2, done here): doc-vs-code tests,
   citation freshness + orphan sweeps, a pinned fake "today", and CI that actually runs.
3. **Feed it a messy chart on purpose** (the G1–G8 gaps): the rules being right and the app
   hearing the record correctly are two different properties.
4. **Then collapse the duplicated numbers** (Layer 1 / P2-1) — last, because it is surgery
   on working clinical logic and wants the tripwires already in place.

Step 1 is the one to run on vaxapp next. Its meningococcal rules are spread across five
surfaces plus the compliance tab, so the inventory is bigger, but the payoff is the same.

---

# U — copy and interface

The owner's brief: tighten the language, cut busy text, write for a clinician not a coder,
and where a full statement is genuinely needed show a 1–2 line version with the rest behind
a click.

**Measured, not guessed.** `recommend.js` holds **32 note strings: median 210 characters,
mean 214, longest 514; 17 of 32 exceed 200.** A comfortable 1–2 line summary at this card
width is roughly 90–140 characters. So the typical note is about double the target and the
worst is four times it. There is currently **no summary/detail split for note text** —
`RecCard.jsx` can collapse a whole card (`D5`, `:336`), but an expanded card always renders
its note in full.

## U1 · Give `note` a lead and a detail, and make the split structural

Do **not** write a short version alongside the long one — that creates exactly the two-copies
drift this audit is about. Change the `rec()` shape so a note is authored once as
`{ lead, detail }`, render `lead` always and `detail` behind a "Why this" disclosure.

Worked example, the card from P0-1 (215 chars today, one paragraph):

> **Now:** "Continue the infant high-risk Menveo series (≥4 weeks between primary doses;
> booster at ~12 months) [1], then a first booster in 3 years (primary series completed
> before age 7) [1], then every 5 years while at risk."

> **Lead:** "Continue the infant Menveo series — doses at least 8 weeks apart. [1]"
> **Detail:** "The series completes with a dose at about 12 months. Menveo is the only brand
> licensed from 2 months. [2]"

(Lead shown with the corrected P0-1 number; it should be interpolated per P2-1, not typed.)

## U2 · The booster cadence is printed twice on the same card

Visible in the P0-1 screenshot, four lines apart:
- the booster summary line (`RecCard.jsx:425`): "Boosters: first in 3 years, then every 5
  years while at risk"
- the tail of the note: "…then a first booster in 3 years (primary series completed before
  age 7) [1], then every 5 years while at risk."

Same fact, two sentences, one card. Delete the tail from the note and let the booster line
own it — one fact, one place, which is also the P2-1 principle applied to copy.

## U3 · The per-dose verdict repeats a 150-character sentence on every row

Each counted dose renders:

> "Counted toward the high-risk series: confirmed the patient was already high-risk on
> ~3 months (this dose's date), in response to the risk-timing question."

On a four-dose infant series that is the same sentence four times, ~12 lines, differing only
in the date. The chip already says `Dose 1 of 4`. Proposal: the row shows the chip plus a
short qualifier ("counted — high risk confirmed"), with the full sentence in the same "Why
this" disclosure as U1. Keep the `Edit` affordance on the row, since that is the action.

## U4 · Copy-voice pass, clinician not coder

Worth a sweep while the notes are being restructured. Examples found:
- "Recorded — not part of an indicated series" reads as a database state, not a clinical
  one. A clinician would say "Given, but not part of a series this patient needs."
- "Extra dose — beyond the indicated series total" — "indicated series total" is the code's
  vocabulary (`seriesTotal`) surfacing in the UI.
- The military-recruit note is 446 characters and explains what the app cannot do before it
  says what to do; lead with the action.

Note the **cross-app parity rule**: design-system and copy-style changes made in MeningoVax
must be applied to PneumoVax. Record that as a follow-up before the session ends — do not
drop it silently.

## U5 · Not a defect, but worth knowing

CDC's schedule pages currently carry a banner: under a preliminary order in *AAP et al. v.
Kennedy et al.*, the **2 July 2025** schedule is the current one and ACIP's June/September/
December 2025 votes are stayed. The app's citations point at pages that are legally frozen
at that version. Nothing to change — but the 12-month citation-freshness test will keep
flagging these, and this is the reason the pages will not have moved.

---

# Per-item workflow (unchanged)

One item at a time, in this order: **P0-1 → P1-3 → P1-2 → P1-1 → P1-4 → U1/U2/U3 → P2-1.**
(P1-3 early because it is small, isolated, and removes a duplicate before P2-1 adds a module.)

For each:
1. Reproduce it first and paste the actual output into the commit message.
2. Write the failing test **before** the fix; watch it fail.
3. Fix.
4. Full suite green (`npx vitest run`) — quote the real count.
5. Live-verify in the running app, both directions (the wrong case now right, the right case
   still right). Free a preview slot first.
6. Commit named by ID.

Clinical items additionally need the live-fetched quote in the commit body, and both rule
documents updated in the same commit — `rule-docs-match-code.test.js` will enforce it.

Synthetic fixtures only. Never real patient data.
