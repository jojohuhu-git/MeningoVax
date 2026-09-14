# MeningoVax — Handoff: compliance-chip + risk-timing design agreed, not yet built (2026-07-23)

**SUPERSEDED by
`docs/archive/handoff-2026-07-23-chip-rename-shipped-prompt-not-started.md`** — §1 (the chip
rename) from this file is now DONE and committed; §2–§5 (the "Needs input" prompt) are
designed here but building was interrupted mid-edit. Do not resume this file's queue as a
whole; read the newer file for exact status and the concrete implementation plan.

Supersedes: `docs/archive/handoff-2026-07-23-dose-chip-mislabeled-found.md`. **This session
wrote NO code** — it was a design brainstorm that produced the spec below. Crucially, it
**reversed** the earlier "merge amber into red Invalid and delete amber" plan: we keep a
distinct amber chip and add a risk-at-dose prompt. Read this file, not the old plan.

Branch: `main`, **2 commits ahead of `origin/main` — NOT pushed** (leftover from the prior
session: rules doc + header cleanup; owner not yet asked to push). MeningoVax lives at
`~/Downloads/MeningoVax-main` (folder is **cloud-synced** — commit early, watch for silent
reversion). Live site: https://jojohuhu-git.github.io/MeningoVax/

Core promise of this app: **honesty** — a screen that quietly implies something is fine when
it isn't is the worst kind of bug.

**281 passing tests (20 files), all green, working tree has only doc changes** at `ca1cb2f`.

## What's done this session

Design only — all decisions below are **owner-confirmed** and ready to implement. No code,
no tests changed.

## The agreed design (build this)

### 1. Chip vocabulary (replaces today's "Valid (off-window)")
- **Counts** (green) — a valid dose that advances *this* patient's series. (Today: "On time".)
- **Off-window — repeat** (amber) — safely given, but doesn't advance this patient's series.
  Keep the label short; put the clinical rationale (given before 16, antigen family, titer
  waning, etc.) in the reasons text beside the chip. This is the RENAME of today's
  self-contradicting "Valid (off-window)".
- **Invalid** (red) — a true error only: below the age-10 product floor, incompatible MenB
  antigen family, or spacing violation. Disregard the dose.
- **Unknown** (gray) — no date; can't verify.
- **Needs input** (gray, interactive) — a *pending* state on ambiguous doses that resolves
  live to one of the above once the provider answers the prompt (see §2). This is a NEW state.

Reversal note: an earlier plan wanted amber folded into red. Owner decided the opposite —
"appropriately given but doesn't advance this series" (amber) is clinically different from
"this was a mistake" (red), and the chips must say which.

### 2. Risk-at-dose "Needs input" prompt
The app judges each dose against the patient's *current* risk checkboxes, but whether an old
dose counted depends on the patient's risk *on the date it was given* — which the data model
does not capture. So on ambiguous doses, ask the provider inline:
- Question: *"Was this patient at high risk for meningococcal disease when this dose was
  given (DATE)?"*
- Answers: **Yes** → resolves toward Counts; **No** → Off-window — repeat; **Not sure** →
  app picks the **most conservative** result (assume it doesn't count → complete the series).
- One prompt covers **both** directions (risk resolved since the dose; risk acquired after
  the dose).
- Recommendations update **live** as the provider answers — the provider works through it
  chairside instead of doing the reasoning in their head.

### 3. When the prompt fires (verified against a scenario stress-test)
Fire **only** when risk-status-on-that-date is both *unknown* and *decisive*:
- Only for **high-risk-now patients** (permanent or temporary risk). Healthy-now patients are
  decided by age windows alone — **no prompt** for them.
- Never for doses below the age-10 floor (those are Invalid).
- **Do NOT exempt "permanent" risks.** Stress-test finding: asplenia from a splenectomy at
  13, or complement-inhibitor therapy started at 13, is permanent *going forward* but was NOT
  present at an age-12 dose. Permanence ≠ always-been-present, so a high-risk-now patient with
  an ambiguous older dose still gets the prompt even for asplenia/complement deficiency. (A
  congenital/lifelong marker to skip the prompt was considered and **deferred** — owner
  accepted the extra clicking for now.)

### 4. Session / persistence model
One-time-use session. Dose history, risk toggles, and prompt answers all stay live and
editable while the app is open. Prompt answers are **memory-only** — never written to the
`?s=` URL, gone on close. (Existing dose/risk state still serializes to `?s=`; the prompt
answers deliberately do not, so a shared link never carries a clinical judgment.)

### 5. Disclaimer
Add a short persistent note in the audit: it reads *current* risk status and does not record
when a risk started/ended, so past temporary-risk doses may need provider input.

## What's NOT done — the remaining queue

- **All of §1–§5 above** — designed, owner-confirmed, **not implemented**. This is round one.
- **Booster-schedule capture (owner requirement, verify FIRST).** §1 decision is that "Counts"
  means "a valid dose that counted" — the chip does NOT claim current protection; booster
  currency is the booster engine's job. Owner explicitly wants to confirm the app actually
  captures meningococcal ongoing-risk boosters (MenACWY and MenB). Use `verify-clinical-source`
  before asserting any booster interval. If the booster logic is missing/incomplete, that is
  its own item.
- **Cross-app port (AFTER MeningoVax is clean — owner's sequencing).** Once MeningoVax ships,
  port the compliance-audit chip vocabulary AND the relevant UX (the "Needs input" prompt,
  disclaimer) to **PneumoVax** and **vaxapp**. Notes:
  - The **chip-label cleanup** is a `vaccine-parity` / five-surface job in each app. PneumoVax
    has no MenB-style adolescent window, so the amber chip only cleans up wherever a
    "valid-but-doesn't-count" case already exists there.
  - The **risk-at-dose prompt** is meningococcal-specific; vaxapp has meningococcal logic too,
    so parity there is a real follow-on. Confirm scope per app before building.
- **Prior parked UX #4, #5** (from the superseded handoff): #4 (status words on cards, not
  reliant on the color key), #5 (rebuild "None of these risk factors apply" as a real button).
  Neither started. (#3 needs no change — owner chose "leave as-is".)

## Why this is a good stopping point

The design is fully specified and every open question was resolved with the owner, including
the two that broke the naive model (permanence ≠ past presence; "what they need now" quietly
pulls in booster/waning logic). Nothing is half-built — the next session starts clean from a
green suite. The cross-app port is deliberately gated behind MeningoVax shipping.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git status` — confirm `main` @ `ca1cb2f` (2 ahead of
   `origin/main`, not pushed, only doc changes). `npx vitest run` — confirm **281 passing**.
2. Start the dev server (`preview_start` "MeningoVax dev server") before any work.
3. Build §1–§5 in order. Key code sites (from the superseded handoff, re-verify before
   editing — cloud-sync may have shifted lines):
   - `src/logic/validate.js` — the three `status: 'valid', notAdolescentCount: true` spots
     (MenACWY <10 ~L250; MenB <16 undated ~L362; MenB <16 dated ~L402) become the amber
     "Off-window — repeat" path; add the high-risk-now "Needs input" branch here.
   - `src/components/RecCard.jsx` (~L36-50) — chip label/color; rename amber, add the pending
     "Needs input" chip + inline prompt UI.
   - `src/components/Results.jsx` (~L248) + `src/App.css` (~L936) — the color-key legend row
     currently DESCRIBES THE AMBER CHIP WRONG ("counted, but outside routine timing"). Fix the
     legend to match the new meaning.
   - Tests to update: `regression-a1-a3`, `regression-p0-1-menb-healthy-age16-gate`,
     `validate`, `validate-new-rules`, `RecCard`, `Results`, `regression-p0-1-menb-healthy-ui`.
4. Each scenario in §3 becomes a test case — both layers (logic in node env + UI in happy-dom)
   per `docs/agent/testing.md`. Reproduce → failing test → fix → full suite green → live-verify
   in the running app → one commit per item.
5. Ship: MeningoVax `main` is UNPROTECTED but owner prefers branch → PR → squash-merge. Ask
   before pushing — and note the 2 unpushed commits already on `main` from the prior session.
