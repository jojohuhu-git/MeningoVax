> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-07-13-meningovax-audit-plus-crossapp.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

# Fix queue — MeningoVax UX + clinical, plus cross-app items (2026-07-13)

> **STATUS (2026-07-13):** Sections A and B are DONE — see
> `docs/archive/handoff-2026-07-13-fix-queue-sections-c-d-remaining.md` for commits, test
> counts, PR link, and two spawned follow-up bugs found along the way. **Sections C
> (PneumoVax) and D (vaxapp) are NOT started.** Read that handoff before resuming — do not
> redo Section A/B work.

**For:** a Sonnet agent working across three repos.
**Primary focus:** MeningoVax (`~/Downloads/MeningoVax-main`). Do Section A and B fully before touching C or D.
**Also touches:** PneumoVax (`~/Downloads/PneumoVax*`) and vaxapp/PediVax (`~/Downloads/vaxapp-main`).

These items come from clinician review of real patient cases. Some are UX, some are clinical-logic
bugs. Treat each lettered/numbered item as one unit of work.

---

## Ground rules (do not skip)

1. **Clinical authority order:** ACIP/CDC/AAP/immunize.org over FDA package inserts. Before changing
   any clinical logic, fetch the authoritative page live and quote it in the commit/PR — do not
   transcribe a rule from memory. Enforce CDSI absolute min/max only; prefer ACIP for age windows.
2. **Test-first, one item at a time:** reproduce → write a failing test (synthetic fixture, never
   real patient data) → confirm it fails → fix minimally → run the FULL suite (`npm test`) → live-verify
   anything UI-observable in the running app → commit named by the item ID. Do not batch unverified fixes.
3. **Live-verify:** start the dev server and drive the actual app for anything visible. A green test
   suite alone is not proof.
4. **All surfaces:** MeningoVax renders results in `Results.jsx` + `RecCard.jsx` and validates in
   `validate.js` while `recommend.js` generates recs. A logic fix is not done until the recommendation,
   the validity/audit display, and any booster-date text all agree. State which surfaces you touched.
5. **Shipping:** MeningoVax `main` is protected — branch → PR → `gh pr merge --squash`. Never commit
   on `main`. Same for vaxapp. (Confirm PneumoVax's rule with the `ship` skill before pushing.)
6. **Plain English:** the owner is a clinician who codes, not a software engineer. Write UI copy,
   commit messages, and the PR body in jargon-free English.

---

## Section A — MeningoVax clinical-logic bugs (do first)

Each case below is a real patient the clinician entered. Reproduce each as a test fixture using the
same DOB and dose dates, with `today = 2026-07-13`.

### A1 — ≥22y patient with a valid ≥16y dose is wrongly told "Not routinely indicated"  *(CONFIRMED BUG)*
- **Case:** DOB 3/28/2003; MenACWY given 10/26/2017 (age ~14y7m) and 7/8/2019 (age ~16y3m). No risk factor.
- **Current behavior:** app returns *"Not routinely indicated — healthy adults ≥22 years..."*.
- **Root cause:** `menacwyRoutine()` in `src/logic/recommend.js` — the final `≥22y` return
  (around line 366) never checks `hasDoseAt16`. The `<22y` branch does; the `≥22y` branch does not.
- **Fix:** in the `≥22y`, no-risk branch, if a MenACWY dose was given at age ≥16y, return
  **`status: 'complete'`** ("A MenACWY dose given at ≥16 years completed the adolescent schedule; no
  further routine doses are needed."). Only fall through to "Not routinely indicated" when there is NO
  qualifying ≥16y dose. Verify against ACIP adolescent MenACWY schedule.

### A2 — DOB required; auto-select age band from DOB  *(NOT a logic bug — a UX gap)*
- **Case:** DOB 10/7/2005; MenACWY given 3/13/2017 and 2/8/2022 (age 16y4m). **With** DOB entered the
  app correctly marks MenACWY complete. **Without** DOB it recommends a catch-up dose ("No MenACWY dose
  confirmed on or after the 16th birthday...").
- **Why the discrepancy happens (confirm, then fix):** age-at-dose is computed from DOB; with no DOB
  the app cannot know the 2/8/2022 dose was given at ≥16y, so it conservatively recommends catch-up.
  This is unavoidable arithmetic, not a logic error.
- **Resolution (owner's decision):** make **DOB a required field**. When DOB is entered, auto-select
  the patient's age band instead of asking for it separately. Removing the age-band question when DOB is
  present also prevents the two from contradicting each other.
- **Verify:** re-run the A2 case with DOB required — result must be "complete," and no separate age-band
  prompt should appear.

### A3 — MenACWY dose given before age 10 must not count toward the adolescent series  *(RULE CONFIRMED)*
- **Case:** DOB 12/13/2003; MenACWY given 3/14/2005 (age ~1y3m) and 4/10/2018 (age ~14y4m). No risk factor.
- **The rule (verified live, 2026-07-13 — do not re-derive from memory):** ACIP/CDC/immunize.org:
  **a MenACWY dose given before the 10th birthday does NOT count toward the routine adolescent series.**
  A dose given on/after the 10th birthday counts as the first adolescent dose. So the 3/14/2005 dose
  (age ~15 months) does not count; the 4/10/2018 dose (age 14y4m) is effective dose 1. Sources:
  - https://www.immunize.org/ask-experts/topic/menacwy/vaccine-recommendations-menacwy/ —
    *"Doses given before age 10 years should not be counted"* toward the adolescent series; a child who
    got a dose before age 10 still needs the 11–12y dose and the 16y booster.
  - The agent must re-open both pages live and quote them in the PR before shipping.
- **Important framing — this is NOT a min-age "invalid" flag.** The vaccine at 15 months was given above
  its licensed minimum age (Menveo is licensed from 2 months), so it is not "invalid / below minimum age."
  It is a *valid dose that does not count toward the adolescent schedule.* Wording must say so honestly:
  **"Given before age 10 — does not count toward the adolescent MenACWY series."** Do NOT label it
  "invalid — below minimum age," which would wrongly imply the product was given below its licensed age.
- **Root cause:** `validate.js` checks only the most-permissive absolute brand min age (Menveo, 2 months)
  via `menacwyMinAge`, so a 15-month dose passes as valid. There is no "does-not-count-toward-adolescent-
  series" concept for a pre-age-10 routine dose.
- **Task:**
  1. In the **routine (no current high-risk) evaluation**, treat a MenACWY dose given before age 10
     (`M.y10` = 120 months) as **not counting toward the adolescent series** — a distinct status from
     the min-age "invalid" reason. Re-anchor the effective adolescent dose count on the first dose given
     at ≥10y. (Do not apply this inside the high-risk infant pathway, where infant doses are appropriate.)
  2. Ensure `recommend.js` consumes the **effective/kept** dose count, not the raw `doses.length`, so the
     4/10/2018 dose becomes effective D1 for the schedule branches (`given`, `hasDoseAt16`, etc.).
  3. **Re-evaluate the outcome honestly.** After re-anchoring, this patient has one effective dose at
     14y4m, no dose at ≥16y, is now 22y7m, healthy, no risk. Per ACIP the routine catch-up window ends at
     21y (the engine's `<M.y22` branch), so the correct result is **"Not routinely indicated at ≥22y
     without a risk factor."** The clinician's "consider one more dose" is a reasonable bedside judgment
     but is **NOT an ACIP recommendation** — do NOT encode it as a firm recommendation. You MAY add a
     neutral informational line ("the adolescent series was never completed with a dose at ≥16y") but must
     not fabricate a recommendation ACIP does not make.
  4. Check parity with vaxapp using the `vaccine-parity` skill — vaxapp has the same MenACWY adolescent
     logic and the "before age 10 doesn't count" rule must match in both repos, or the mismatch must be
     documented.

---

## Section B — MeningoVax UX / display

### B1 — Compliance audit table (shared ask; see also C1 for PneumoVax)
Add a compliance-audit view like vaxapp's, listing each recorded dose with:
**dose number · date administered · age at administration · validity (valid / invalid + reason).**
Reuse the existing `validate.js` / `analyzeHistory` output — don't recompute validity. Mirror vaxapp's
compliance-audit structure (`docs/agent/compliance-audit.md` in vaxapp).

### B2 — Reorder the two dosing options: separate injections FIRST, pentavalent combo SECOND
Currently the pentavalent (combo) option renders first (`Results.jsx` ~line 196, before the two-vaccine
block). Flip the order so **MenACWY + MenB as two separate injections is the primary/first option** and
the **single pentavalent injection is the second/alternative option.**

### B3 — Revise the two-option header so it's clear when a combo qualifies
When a patient qualifies for both, make the choice explicit. Brainstorm wording with the owner; a
starting point:
- Option 1 (primary): **"MenACWY + MenB — two separate injections"**
- Option 2 (alternative): **"Single pentavalent injection (MenABCWY)"** with a one-line note on when it
  applies (both antigens due the same day, age-eligible product available).
Make it obvious the pentavalent is an *alternative that replaces both*, not an extra shot.

### B4 — Fix result colors (red is misleading)
When both MenACWY and MenB are due, the current UI shows a blue box with a **red** box inside, because
`risk-based` status is styled red — which reads like an error was made.
- **Reserve red strictly for errors/invalid doses.**
- Recolor `risk-based` to **purple.**
- When both antigens are due, use **two shades of the same blue** (consistent family, different shading)
  rather than blue-plus-red. Update the status→color mapping in the CSS/`RecCard.jsx` and check every
  status still has a distinct, non-alarming color.

### B5 — Booster cadence: state the specific 3-year vs 5-year interval, not "3–5 years"
Mimic vaxapp: where the data determines it, say **either** "first booster in 3 years" **or** "in 5 years"
rather than always printing "3–5 years." The rule already exists in `recommend.js`
(`boostDays` / first-booster comment block ~lines 90–142): D2 completed at <7y → 3-year first booster;
D2 at ≥7y → 5-year; all subsequent boosters → 5-year. Audit every note string that currently says
"3–5 years" and replace it with the specific interval whenever D2 age (or the relevant anchor) is known;
keep "3–5 years" only in the genuinely-unknown-anchor fallback.

### B6 — Make "primary series complete but booster still due" prominent, with an approximate date
When the MenACWY primary series is complete and only a booster remains, this currently reads like a quiet
"complete" state. Make it visually prominent (its own emphasized line) and show an **approximate booster
due date** computed from the last dose + the applicable interval (see B5).
- If a DOB / dose date exists, compute and show the date.
- If only an age band was entered with no dates, state plainly that an exact date can't be given and say
  what's needed. (Once A2 makes DOB required, most cases will have a date.)

### B7 — Keyboard shortcuts
- **Ctrl+A** (or Cmd+A on Mac) triggers **+ Add Dose**. Underline the "A" in the "Add" button label via
  `accessKey` if the platform renders it.
- **Enter** advances the stepper to the next page/step (without submitting a partial form or triggering
  a destructive action). Guard against Enter firing while focus is in a text input where the user is
  still typing.
Verify both live in the running app.

---

## Section C — PneumoVax

### C1 — Compliance audit table
Same as B1: add a compliance-audit view showing **dose number · date administered · age · validity** for
pneumococcal doses. Match the MeningoVax/vaxapp structure so all three apps read consistently. Confirm
PneumoVax's ship rule with the `ship` skill before pushing.

---

## Section D — vaxapp / PediVax

### D1 — Never describe ages or intervals in days when weeks or years are clearer
Example of the current bad output: **"D2 only -728 days after D1 — minimum 5 years."** 728 days should
read as "~2 years," and the phrasing is confusing.
- Use the existing helpers `fmtAgeClinical` / `humanDays` in `src/logic/ageFormat.js` (do not hand-roll).
- Sweep the codebase for interval/age strings rendered in raw days and convert to weeks/months/years as
  appropriate (days only for very young infants where clinically standard).
- Also fix the "-728 days" wording so a negative/too-early interval reads as plain English
  (e.g. "given ~2 years before the 5-year minimum").
- Apply across all five vaxapp surfaces where the string can appear.

---

## Definition of done
- Every item: failing test written first, full `npm test` green after, live-verified if UI-observable.
- Report real numbers: quote the actual test count and `git status`, not "should pass."
- One PR per repo (or per logical group), each item committed under its ID (A1, B4, …).
- For A2 and B3, confirm the exact wording/UX with the owner before finalizing if anything is ambiguous.
