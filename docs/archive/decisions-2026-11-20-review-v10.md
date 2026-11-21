# MeningoVax — Owner answers to the Rulebook / Patient screen review v10 (2026-11-20)

Asked on the review form https://claude.ai/artifact/CYSRYKdqNTrrKcbMeydktr (version 14; source
`docs/archive/mockup-2026-11-20-rulebook-review-v10.html`). Nothing below is built yet unless the
Answer column says "Built".

## The answers

- **Saved on the page (db `verdicts`, read 2026-11-20):** P1, P2, P3 and L1–L7 approved; R1 "Change"
  with no text (the page then saved a note only on leaving the box, so the text was probably lost;
  fixed in version 14).
- **In chat, 2026-11-20:** for the 142 items with no answer, "Approve them all", **D1 included**:
  build the redesigned Rulebook screen (seven-step path, two Quick look tables, short Details
  panels; the screen in the review form). For R1: "I'll type it on the page".
- **Owner notes earlier the same day**, applied before the answers: never "tick" (use
  check/uncheck/checkbox); shorten the phrases; R10 corrected (a MenQuadfi dose from 6 weeks counts;
  the app recommends the first dose at 2 months); P73–P75 added.

- **Later the same day, in chat (two questions):**
  - **How D1 fits with sections 1–8: "New top, then 1–8 folded".** The Rulebook screen shows the
    seven-step path and the two Quick look tables in view. Sections 1–8, with the approved R
    wording, sit below them behind one "Full rulebook" tap, closed by default.
  - **R1 (owner's own text):** "Recommendations are based on age, risk conditions and dated vaccine
    history." That sentence alone opens the screen.

  - **R91, after it was built: "yes, add 'at least'".** The approved sentence ("The repeat is given
    at the minimum interval after the invalid dose") was not true of a healthy MenB dose 2 given
    3 weeks after dose 1: the app dates the repeat 6 months after dose 1, not 4 weeks after the
    invalid dose. It now reads "The repeat is given at least the minimum interval after the invalid
    dose.", matching step 5 of the redesigned screen.

## Still gated

- **R1**: answered (above).
- **Q5 (amber "Not counted — do not repeat")**: approved 2026-11-19, but the owner asked to check
  PneumoVax's dose labels first. Not part of this approval. Remind her.
- **P12–P21** are card titles (`doseLabel`), not the closed chip list beside recorded doses
  (`src/components/doseChipLabel.js`), which they do not change. (Corrected 2026-11-20; this line
  first said otherwise.)
- **P75** fixes a false sentence only; whether the app should *offer* MenQuadfi before 2 months is a
  separate clinical question (read AAP live before asking).
- Each new clinical clause in a built sentence still needs its source quote (memory
  `proposed-wording-needs-a-source-too`).

## Every item, with the approved wording

### Rulebook screen: Opening

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R1 | Recommendations are based on age, risk conditions and dated vaccine history. The parts below follow the order the app decides in. Source shows the CDC or ACIP sentence a rule rests on. A MeningoVax decision marks a rule they do not state, and opens to show the problem, what CDC and ACIP say, and what MeningoVax does. | How MeningoVax decides, in order. "Source" shows the CDC or ACIP sentence behind a rule; "MeningoVax decision" shows how the app fills a gap they leave open. | CHANGE: owner to type the wording on the review page (her note did not save) |

### Rulebook screen: 1. The vaccines

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R2 | MenACWY and MenB are separate vaccines with separate schedules. The combined shot gives one dose of each at the same visit. | MenACWY and MenB have separate schedules. One MenABCWY injection gives a dose of each. | Approved (owner: "Approve them all", 2026-11-20) |
| R3 | Column heading "MenB family", with the values "4C" and "FHbp". | Column heading "Counts as", with the values "Bexsero" and "Trumenba". | Built (PR #123) |
| R4 | Bexsero: Every MenB dose. Stay in the 4C family. | Use for every MenB dose. Do not mix it with Trumenba or Penbraya. | Built (PR #123) |
| R5 | Trumenba: Every MenB dose. Stay in the FHbp family. | Use for every MenB dose. Do not mix it with Bexsero or Penmenvy. | Built (PR #123) |
| R6 | Penmenvy: Replaces a MenACWY and a 4C MenB dose given at the same visit. | Gives one MenACWY dose and one Bexsero dose in a single injection. | Built (PR #123) |
| R7 | Penbraya: Replaces a MenACWY and an FHbp MenB dose given at the same visit. | Gives one MenACWY dose and one Trumenba dose in a single injection. | Built (PR #123) |
| R8 | Menactra: History only. Counts as a MenACWY dose. | Seen on older records. It counts as a MenACWY dose. | Approved (owner: "Approve them all", 2026-11-20) |
| R9 | Every MenB dose stays in the family of the first. A dose from the other family does not count; the next dose of the right family waits ≥4 weeks after it. | Every MenB dose must match the first: Bexsero (or Penmenvy), or Trumenba (or Penbraya). A dose of the other product does not count, and the matching product is given at least 4 weeks after it. | Built (PR #123) |

### Rulebook screen: 2. Age and risk group: the age lines

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R10 | 6 weeks: MenQuadfi licensed. A product limit only. | MenQuadfi is licensed from 6 weeks, and a MenQuadfi dose at that age counts. The app recommends the first dose at 2 months. | Approved (owner: "Approve them all", 2026-11-20) |
| R11 | 2 months: First MenACWY dose of the infant series, for asplenia, complement deficiency, HIV, travel or an outbreak. | The infant MenACWY series can start for asplenia, complement deficiency, HIV, travel or an A/C/W/Y outbreak. | Approved (owner: "Approve them all", 2026-11-20) |
| R12 | 2 years: Dose 1 at this age or older: no infant series. Medical high risk gets a 2-dose series; other indications, 1 dose. | From 2 years, there is no infant series: two doses for asplenia, complement deficiency or HIV; one for travel or an outbreak. | Approved (owner: "Approve them all", 2026-11-20) |
| R13 | 7 years: First MenACWY booster 3 years after a series finished before this age, 5 years after one finished at it or older. | The first booster is 3 years after a series that ends before 7 years, otherwise 5 years. | Approved (owner: "Approve them all", 2026-11-20) |
| R14 | 10 years: MenB, Menveo 1-vial and the combined shot licensed. Routine MenACWY before this age does not count. | MenB, Menveo 1-vial and the combined shot can be given. A routine MenACWY dose before this age does not count. | Approved (owner: "Approve them all", 2026-11-20) |
| R15 | 11–12 years: Routine MenACWY dose 1. | No change. | No change proposed |
| R16 | 16 years: MenACWY booster. A first dose at this age or older needs no booster. Healthy MenB from this age, by shared clinical decision-making. | The MenACWY booster is due; a first dose at 16 years or older needs none. MenB may be offered to a healthy patient. | Approved (owner: "Approve them all", 2026-11-20) |
| R17 | 19–21 years: MenACWY catch-up, if no dose at 16 years or older. | One catch-up dose is given if none was given at 16 years or older. | Approved (owner: "Approve them all", 2026-11-20) |
| R18 | 22 years: Healthy MenACWY no longer indicated. | MenACWY is not routine for a healthy adult. | Approved (owner: "Approve them all", 2026-11-20) |
| R19 | 24 years: Healthy MenB no longer indicated. | MenB is no longer offered to a healthy adult. | Approved (owner: "Approve them all", 2026-11-20) |

### Rulebook screen: 2. Age and risk group: the risk table

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R20 | Each condition the app asks about: what to give, and when boosters are due. | This table gives the doses and boosters for each condition. | Approved (owner: "Approve them all", 2026-11-20) |
| R21 | Under 2 years: infant series (2–4 doses). 2 years and older: 2 doses, ≥8 weeks apart. | Under 2 years, the infant series has two to four doses, set by the age at dose 1. From 2 years, give two doses at least 8 weeks apart. | Approved (owner: "Approve them all", 2026-11-20) |
| R22 | Boosters: 3 years after the series if it ended before age 7, otherwise 5 years. Then every 5 years. | The first booster is 3 years after the series if it ended before 7 years, otherwise 5 years. Each later booster is 5 years after the last. | Approved (owner: "Approve them all", 2026-11-20) |
| R23 | MenB: From 10 years: 3 doses. Dose 2 at 1 month, dose 3 at 6 months. | From 10 years: three doses, dose 2 at 1 month and dose 3 at 6 months. | Approved (owner: "Approve them all", 2026-11-20) |
| R24 | MenB boosters: 1 year after the series, then every 2–3 years. | The first booster is 1 year after the series; later ones every 2–3 years (the app dates each at 2 years). | Approved (owner: "Approve them all", 2026-11-20) |
| R25 | As for a healthy patient. | Same as healthy. | Approved (owner: "Approve them all", 2026-11-20) |
| R26 | Microbiologist, MenACWY: 1 dose. Boosters: Every 5 years while exposed. | Give one dose, then a booster every 5 years from the last dose while exposed. | Approved (owner: "Approve them all", 2026-11-20) |
| R27 | Travel boosters: 3 years after a dose before age 7, otherwise 5 years. Then every 5 years while travel continues. | The first booster is 3 years after the dose if given before 7 years, otherwise 5 years; then every 5 years while travel continues. | Approved (owner: "Approve them all", 2026-11-20) |
| R28 | Military boosters: Every 5 years, if the assignment requires it. | A booster is given 5 years after the last dose, if the assignment requires it. | Approved (owner: "Approve them all", 2026-11-20) |
| R29 | College: 1 dose at 16 years or older. Not needed if one was given at 16 years or older in the last 5 years. Boosters: None. | Give one dose at 16 years or older, unless one was given at that age within 5 years. No booster follows. | Approved (owner: "Approve them all", 2026-11-20) |
| R30 | A/C/W/Y outbreak boosters: 3 years after a dose before age 7, otherwise 5 years, while the outbreak continues. Then every 5 years. | While the outbreak continues, give a booster 3 years after the dose if given before 7 years, otherwise 5 years, then every 5 years. | Approved (owner: "Approve them all", 2026-11-20) |
| R31 | Serogroup B outbreak, MenB boosters: One booster, ≥1 year after the series. No more after it. | Give one booster 1 year after the series if the outbreak continues, and no more. | Approved (owner: "Approve them all", 2026-11-20) |
| R32 | Pregnancy, MenB: Wait until after pregnancy, unless asplenia, complement deficiency, laboratory exposure or a serogroup B outbreak is also present. | Wait until after pregnancy. Give the series now if a MenB high-risk condition is present. | Approved (owner: "Approve them all", 2026-11-20) |

### Rulebook screen: 2. More than one condition

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R33 | Each vaccine follows the condition that needs the most. | Each vaccine follows the condition that needs more doses or boosters. | Approved (owner: "Approve them all", 2026-11-20) |
| R34 | Give the high-risk series and its boosters. They cover the other condition. | The high-risk series and boosters cover the other condition too. | Approved (owner: "Approve them all", 2026-11-20) |
| R35 | Give 1 dose, then boosters while travel or exposure continues. | No change. | No change proposed |
| R36 | Still give the 16-year dose. That condition's boosters are then counted from it. | Still give the 16-year booster. Later boosters for that condition are timed from it. | Approved (owner: "Approve them all", 2026-11-20) |
| R37 | Follow the routine teen schedule. The college or military dose is given later, if still needed. | Follow the routine schedule, and check again at 16 years or older. | Approved (owner: "Approve them all", 2026-11-20) |
| R38 | Give that condition's boosters (every 2–3 years), not the single outbreak booster. | No change. | No change proposed |
| R39 | Give the high-risk series. Pregnancy does not delay it. | No change. | No change proposed |

### Rulebook screen: 3. MenACWY

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R40 | Booster ≥8 weeks after dose 1. | The booster is given at 16 years, at least 8 weeks after the first dose. | Approved (owner: "Approve them all", 2026-11-20) |
| R41 | 13–15 years: Dose 1 (catch-up), booster at 16–18 years. | No change. | No change proposed |
| R42 | 16–18 years: One dose. No booster. | One dose. No booster is needed. | Approved (owner: "Approve them all", 2026-11-20) |
| R43 | 19–21 years: One catch-up dose, if none at 16 years or older. | No change. | No change proposed |
| R44 | A dose at 16 years or older completes the routine schedule. | No change. | No change proposed |
| R45 | A dose before 10 years does not count toward the routine series. | No change. | No change proposed |
| R46 | The series is set by the age at dose 1. Travel and an outbreak give the same infant series. | The age at dose 1 sets the series; travel and an A/C/W/Y outbreak use the same infant series. | Approved (owner: "Approve them all", 2026-11-20) |
| R47 | If dose 2 comes at 7 months or older: 3 doses in all. | No change. | No change proposed |
| R48 | Infant series step: "≥12 weeks and ≥12 months" | "≥12 weeks after the last dose, at age ≥12 months" | Approved (owner: "Approve them all", 2026-11-20) |
| R49 | 3 doses if dose 2 is at 7 months or older, else 4. | No change. | No change proposed |
| R50 | Infant series: early doses ≥8 weeks apart; the final dose ≥12 weeks after the one before and at 12 months or older. | No change. | No change proposed |
| R51 | Boosters. First booster 3 years after the last primary dose if it was before 7 years, 5 years if at 7 years or older. Then every 5 years while at risk. | The first booster is 3 years after the series if it ended before 7 years, otherwise 5 years. Each later booster is 5 years after the last, while at risk. | Approved (owner: "Approve them all", 2026-11-20) |
| R52 | Travel: …then every 5 years while at risk. | …then every 5 years while travel continues. | Approved (owner: "Approve them all", 2026-11-20) |
| R53 | Microbiologist: Every 5 years while exposure continues. | Give a booster every 5 years from the last dose while exposed. | Approved (owner: "Approve them all", 2026-11-20) |
| R54 | College: None. A dose at 16 years or older covers 5 years. | No booster. A dose at 16 years or older covers college entry for 5 years. | Approved (owner: "Approve them all", 2026-11-20) |
| R55 | A teenager with a dose before 16 years for travel, laboratory work or an outbreak still gets the 16-year booster. | No change. | No change proposed |

### Rulebook screen: 4. MenB

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R56 | Healthy patients, 16–23 years: by shared clinical decision-making. Not routinely indicated before 16 years or from 24 years. | Healthy patients aged 16–23 years may be offered MenB by shared clinical decision-making, preferably at 16–18 years. | Approved (owner: "Approve them all", 2026-11-20) |
| R57 | Dose 2 <6 months after dose 1 counts; add dose 3 ≥4 months after dose 2. | Dose 2 given <6 months after dose 1 counts; give dose 3 ≥4 months after dose 2. | Approved (owner: "Approve them all", 2026-11-20) |
| R58 | A dose before 16 years does not count. | No change. | No change proposed |
| R59 | High risk: Persistent complement deficiency or complement-inhibitor therapy; Anatomic or functional asplenia/sickle cell disease; Microbiologist routinely exposed to N. meningitidis; Increased risk from a serogroup B outbreak. From 10 years, no upper age. | High risk: asplenia (including sickle cell disease), complement deficiency or a complement inhibitor, lab work with meningococcus, or a serogroup B outbreak. From 10 years, with no upper age limit. | Approved (owner: "Approve them all", 2026-11-20) |
| R60 | Dose 2 step: "≥4 weeks (advised 1 month)" | "1 month after dose 1 (at least 4 weeks)" | Approved (owner: "Approve them all", 2026-11-20) |
| R61 | Dose 2 ≥6 months after dose 1: complete in 2 doses. | No dose 3 is needed if dose 2 was ≥6 months after dose 1. | Approved (owner: "Approve them all", 2026-11-20) |
| R62 | Dose 3 <4 months after dose 2 counts; add dose 4 ≥4 months later. | Dose 3 given <4 months after dose 2 counts; give dose 4 ≥4 months after dose 3. | Approved (owner: "Approve them all", 2026-11-20) |
| R63 | …unless dose 3 was ≥6 months after dose 1: no dose 4. | No dose 4 is needed if dose 3 was ≥6 months after dose 1. | Approved (owner: "Approve them all", 2026-11-20) |
| R64 | Dose 3 ≥4 months after dose 2 counts, even <6 months after dose 1. | No change. | No change proposed |
| R65 | Boosters: 1 year after the series, then every 2–3 years while at risk. A later booster <2 years after the one before does not count. | The first booster is 1 year after the series; later ones every 2–3 years while at risk (the app dates each at 2 years). A booster given sooner does not count. | Approved (owner: "Approve them all", 2026-11-20) |
| R66 | Serogroup B outbreak alone: one booster, then complete. | No change. | No change proposed |
| R67 | HIV alone is not a MenB indication. | HIV alone does not change MenB; follow the healthy schedule. | Approved (owner: "Approve them all", 2026-11-20) |
| R68 | Deferred during pregnancy, unless a MenB condition is also present. | Wait until after pregnancy, unless a MenB high-risk condition is present. | Approved (owner: "Approve them all", 2026-11-20) |

### Rulebook screen: 5. The combined shot

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R69 | Offered when MenACWY is due today, MenB is due or can be given today, and the patient is 10 years or older. | No change. | No change proposed |
| R70 | Only the product in the patient's MenB family: Penmenvy for 4C, Penbraya for FHbp. | The product must match the earlier MenB doses: Penmenvy after Bexsero, Penbraya after Trumenba. | Built (PR #123) |
| R71 | Not within 6 months of the last dose of the same product: give the two vaccines separately. | No change. | No change proposed |
| R72 | Not offered while a dose on the record reads Needs input. | No change. | No change proposed |
| R73 | A combined shot on the record counts as a MenACWY dose and a MenB dose, whichever list it is entered in. | No change. | No change proposed |

### Rulebook screen: 6. Doses on the record

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R74 | Each dose on the record is checked against the patient's age and the dose before it, and gets one label. The card advises the routine date, which can be later than the minimum. | Each recorded dose is checked for minimum age and minimum interval, and gets one label. The card shows the routine date; the earliest valid date may be sooner. | Approved (owner: "Approve them all", 2026-11-20) |
| R75 | Dose 2 of 2: Counts. "Dose N" alone when no series is running. | Valid dose, with its place in the series. Just "Dose 1" when nothing more is owed. | Approved (owner: "Approve them all", 2026-11-20) |
| R76 | Booster: Counts, after the primary series. | Valid booster after a completed series. | Approved (owner: "Approve them all", 2026-11-20) |
| R77 | Not counted — repeat: Too soon, too young or the wrong MenB family. The line under it gives the date. | Minimum age or minimum interval not met, or the MenB product is not interchangeable with the first. The line below gives the repeat date. | Approved (owner: "Approve them all", 2026-11-20) |
| R78 | Not counted — do not repeat: The same, when no dose of that vaccine is owed. | Invalid dose, but no further dose is owed. | Approved (owner: "Approve them all", 2026-11-20) |
| R79 | Not counted — given before age 10: Routine MenACWY given too early to count toward the series. | Routine MenACWY before 10 years. The teen series starts at 11–12 years. | Approved (owner: "Approve them all", 2026-11-20) |
| R80 | Not counted — given before age 16: Healthy MenB given too early to count toward the series. | Healthy MenB before 16 years. The series starts at 16 years or older. | Approved (owner: "Approve them all", 2026-11-20) |
| R81 | Not counted — Extra. Do not repeat.: Given when no dose was recommended. | No change. | No change proposed |
| R82 | No date recorded: Only dated records count. Add the date to have it judged. | Only dated records count. Add the date to have the dose checked. | Approved (owner: "Approve them all", 2026-11-20) |
| R83 | Date is in the future: A typing mistake or a visit not yet held. Correct the date. | No change. | No change proposed |
| R84 | Entered twice: Same date as a dose already counted. Remove the row. | No change. | No change proposed |
| R85 | Needs input: Was the patient high-risk on that date? | Was the patient high-risk on that date? Answer beside the dose. | Approved (owner: "Approve them all", 2026-11-20) |
| R86 | The 4-day grace. A dose given ≤4 days before a minimum age or interval counts. The card still advises the full date. | A dose up to 4 days before the minimum age or interval is valid (4-day grace period). The card still shows the full date. | Approved (owner: "Approve them all", 2026-11-20) |
| R87 | Minimum interval, MenACWY infant series final dose: "12 weeks and 12 months of age" | "≥12 weeks after the last dose, at age ≥12 months" | Approved (owner: "Approve them all", 2026-11-20) |
| R88 | Minimum interval, MenACWY booster: "3 years or 5 years, then 5 years" | "3 years after a series ending before 7 years, otherwise 5; then 5 years after the last booster" | Approved (owner: "Approve them all", 2026-11-20) |
| R89 | Minimum interval, high-risk MenB booster: "1 year, then 2 years" | "1 year after the series, then 2 years after the last booster" | Approved (owner: "Approve them all", 2026-11-20) |
| R90 | Healthy MenB dose 2: Sooner still counts; dose 3 is added. | No change. | No change proposed |
| R91 | The repeat is timed from the dose that did not count, by the minimum interval. | The repeat is given at the minimum interval after the invalid dose. | Approved (owner: "Approve them all", 2026-11-20) |
| R92 | A set-aside MenACWY dose starts the 8 weeks. | A routine MenACWY dose before 10 years does not count, but the next dose still waits 8 weeks after it. | Approved (owner: "Approve them all", 2026-11-20) |
| R93 | Wrong MenB family: finish in the first family, or the card offers to finish in the other. | Finish with the first MenB product; the card also offers finishing with the other. | Approved (owner: "Approve them all", 2026-11-20) |

### Rulebook screen: 7. MeningoVax decisions (all 14)

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R94 | The label "CDC and ACIP:" is followed by a command, for example "Give revaccination for these patients outside the routine…" | The label becomes "CDC and ACIP say:", followed by a statement, for example "Revaccination for these patients falls outside the routine and risk-based schedules." | Approved (owner: "Approve them all", 2026-11-20) |
| R95 | High-risk on the date: No or unsure: it is set aside, as for a patient with no risk. | If the answer is no or unsure, the dose is judged as for a patient with no risk. | Approved (owner: "Approve them all", 2026-11-20) |
| R96 | MenQuadfi: CDC's notes list MenQuadfi from an older age than AAP, which lists it from 6 weeks. | CDC's notes list MenQuadfi from 2 years; AAP lists it from 6 weeks. | Approved (owner: "Approve them all", 2026-11-20) |
| R97 | Infant who fell behind: Follows CDC's scheduling software (CDSI): 3 doses in all. | The app follows CDSI, CDC's rules for immunization software: 3 doses in all. | Approved (owner: "Approve them all", 2026-11-20) |
| R98 | College: Counts the 5 years to today's visit, read as the college-entry visit. | The app counts the 5 years up to today, treating today as the college-entry visit. | Approved (owner: "Approve them all", 2026-11-20) |
| R99 | A booster given early: …(beyond the 4-day grace) does not count. | …given more than 4 days early does not count. | Approved (owner: "Approve them all", 2026-11-20) |
| R100 | Title: "Grace at a birthday" | Title: "Up to 4 days early at a birthday" | Approved (owner: "Approve them all", 2026-11-20) |
| R101 | Title: "A dose nobody asked for" | Title: "A dose given when none was due" | Approved (owner: "Approve them all", 2026-11-20) |
| R102 | Repeat of a too-young first dose: Waits the vaccine's minimum interval after the dose that did not count: 8 weeks for MenACWY, 4 weeks for MenB. | The repeat is given at the minimum interval after the invalid dose: 8 weeks for MenACWY, 4 weeks for MenB. | Approved (owner: "Approve them all", 2026-11-20) |
| R103 | Grace at a birthday: Reads the dose as given on the birthday only when that means fewer doses, at 3 months, 7 months, 2 years, 16 years. | A MenACWY dose up to 4 days before age 3 months, 7 months, 2 years or 16 years gets the schedule that needs fewer doses. | Approved (owner: "Approve them all", 2026-11-20) |
| R104 | A dose nobody asked for: CDC and ACIP: Give each series' size. | CDC and ACIP say how many doses each series has. They do not say whether a dose beyond that counts. | Approved (owner: "Approve them all", 2026-11-20) |

### Rulebook screen: 8. Sources and footer

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R105 | Every document the app cites. A document's count is how many of its sentences the app quotes. | No change. | No change proposed |
| R106 | This page is a guide to the app's reasoning, not a clinical reference. Where it and a CDC or ACIP document disagree, the document is right and this is a bug. Please report it. | No change. | No change proposed |

### Rulebook screen: Found on the cards while checking (not the rulebook)

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| R107 | A later MenB booster's card note reads "A MenB booster, 1 year after the primary series was completed", under the label "Booster (dose 5, every 2–3 years)". | The note should match the label: "A MenB booster, 2–3 years after the last booster." | Built (PR #121) |
| R108 | The A/C/W/Y outbreak note reads "…once 5 years have passed since the last dose (3 years if the series finished before age 7, otherwise 5)." | "…3 years after the last dose if the series finished before age 7 years, otherwise 5 years." | Built (PR #122) |
| R109 | The routine teen booster line reads "Boosters: 1 more - at age 16". | "Booster: at age 16 years." | Built (PR #122) |
| R110 | The healthy MenB "Why this" text reads "MenB antibody protection wanes within about a year…" | "…wanes within 1–2 years…" | Built (PR #123) |

### Patient screen: Entering the patient

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P1 | Select all that apply: these drive vaccine class and booster schedule | Select all that apply; they set which doses and boosters are due. | Approved |
| P2 | Dose row label: "Date (optional)" | "Date", with a hint under the row: "A dose with no date is not counted." | Approved |
| P3 | A dose was given, but the date and brand are unknown. Tick this to keep the dose on the record. An empty row is removed when you continue. | Check this if a dose was given but its date and brand are unknown. It stays on the record, not counted. Empty rows are removed when you continue. | Approved |
| P4 | Transplant sublabel: "this tool does not apply — needs an individualized, specialist-guided schedule" | No change. | No change proposed |

### Patient screen: Top of the results

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P5 | MenB is optional today (shared clinical decision). No other MenACWY or MenB doses due today. | No MenACWY dose is due today. MenB may be offered today by shared clinical decision-making. | Approved (owner: "Approve them all", 2026-11-20) |
| P6 | Due today: MenACWY. MenB is optional (shared clinical decision). | Due today: MenACWY. MenB may also be offered (shared clinical decision-making). | Approved (owner: "Approve them all", 2026-11-20) |
| P7 | Due today: MenACWY and MenB, as two separate shots or one combined pentavalent shot. | Due today: MenACWY and MenB, as two injections or one MenABCWY injection. | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Card headers

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P8 | Dose due today, future boosters needed | Due today; boosters to follow | Approved (owner: "Approve them all", 2026-11-20) |
| P9 | Optional today - shared decision | Shared decision today | Approved (owner: "Approve them all", 2026-11-20) |
| P10 | Future booster needed | Booster due later | Approved (owner: "Approve them all", 2026-11-20) |
| P11 | Answers needed | Answer needed below | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Dose due on each card

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P12 | Dose 1 of 1 (catch-up, 19–21y) | Dose 1 (catch-up, 19–21y) | Approved (owner: "Approve them all", 2026-11-20) |
| P13 | 1 dose (ongoing-risk indication) | Dose 1 (boosters while at risk) | Approved (owner: "Approve them all", 2026-11-20) |
| P14 | Dose 2 of 3 (infant high-risk, 3-dose shortcut) | Dose 2 of 3 (infant high-risk, dose 2 at ≥7 months) | Approved (owner: "Approve them all", 2026-11-20) |
| P15 | Dose 2 of 2 (4C) | Dose 2 of 2 (Bexsero) | Approved (owner: "Approve them all", 2026-11-20) |
| P16 | Dose 4 of 4 (extra dose: dose 3 given early, 4C) | Dose 4 of 4 (dose 3 <4 months after dose 2) | Approved (owner: "Approve them all", 2026-11-20) |
| P17 | Booster (dose 3, first booster, 5 years after primary) | First booster (dose 3), 5 years after the series | Approved (owner: "Approve them all", 2026-11-20) |
| P18 | Booster (dose 2, first booster, 3 years after the primary dose) | First booster (dose 2), 3 years after dose 1 | Approved (owner: "Approve them all", 2026-11-20) |
| P19 | Booster (dose 4, every 5 years) | Booster (dose 4), 5 years after the last | Approved (owner: "Approve them all", 2026-11-20) |
| P20 | Booster (dose 5, every 2–3 years) | Booster (dose 5), 2–3 years after the last | Approved (owner: "Approve them all", 2026-11-20) |
| P21 | Not yet age-eligible | Not yet due (from 10 years) | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Booster line under the brands

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P22 | Boosters: 1 more - at age 16 | Booster: at age 16 years. | Built (PR #122) |
| P23 | Boosters: 1 more - at age 16–18 | Booster: at age 16–18 years. | Built (PR #122) |
| P24 | Boosters: first in 3 years, then every 5 years while at risk | Boosters: 3 years after the series, then every 5 years while at risk. | Approved (owner: "Approve them all", 2026-11-20) |
| P25 | Boosters: first booster 3 years after the primary series if it completed before age 7, otherwise 5 years. Then every 5 years while at risk | Boosters: 3 years after the series if it ends before 7 years, otherwise 5; then every 5 years while at risk. | Approved (owner: "Approve them all", 2026-11-20) |
| P26 | Boosters: every 5 years while at high risk (ongoing) | Boosters: every 5 years while at risk. | Approved (owner: "Approve them all", 2026-11-20) |
| P27 | Boosters: every 5 years while travel risk continues (ongoing) | Boosters: every 5 years while travel continues. | Approved (owner: "Approve them all", 2026-11-20) |
| P28 | Boosters: every 5 years while occupational exposure continues (ongoing) | Boosters: every 5 years while exposure continues. | Approved (owner: "Approve them all", 2026-11-20) |
| P29 | Boosters: first in 1 year, then every 2–3 years while at risk | Boosters: 1 year after the series, then every 2–3 years while at risk. | Approved (owner: "Approve them all", 2026-11-20) |
| P30 | Booster not yet due - [date] | Booster due [date]. | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Card lead sentence

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P31 | MenB is not routinely indicated yet at this age, without a risk factor. | MenB is not routine at this age. A healthy patient may choose it from 16 years. | Approved (owner: "Approve them all", 2026-11-20) |
| P32 | MenACWY is due today. MenB is optional today (shared clinical decision). One pentavalent (MenABCWY) dose may replace both. | MenACWY is due today; MenB may be offered (shared clinical decision-making). One MenABCWY injection can replace both. | Approved (owner: "Approve them all", 2026-11-20) |
| P33 | A MenACWY dose at age 16 or older satisfies the adolescent schedule. | A MenACWY dose at age 16 years or older completes the adolescent schedule. | Approved (owner: "Approve them all", 2026-11-20) |
| P34 | It can be given from [date] if needed (minimum 8 weeks). | Earliest valid date: [date] (minimum interval 8 weeks). | Approved (owner: "Approve them all", 2026-11-20) |
| P35 | Not before [date]: 8 weeks after the dose of [date], which did not count. | Not before [date]: 8 weeks after the invalid dose of [date]. | Approved (owner: "Approve them all", 2026-11-20) |
| P36 | Or finish with Trumenba instead: dose 2 due [date] (the Bexsero dose then does not count). | Or complete the series with Trumenba: dose 2 due [date], and the Bexsero dose no longer counts. | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: "Why this" on each card

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P37 | A single MenACWY dose now. Given at 16 years or older, it needs no booster. Nothing is on record for this patient. ACIP asks for no booster after a first dose given on or after the 16th birthday. | One MenACWY dose now. A first dose at 16 years or older needs no booster. | Approved (owner: "Approve them all", 2026-11-20) |
| P38 | Primary series complete. The first booster is due 5 years after it. ACIP puts the first booster 5 years out when the primary series finished at age 7 or older. A series finished before then brings the first booster forward to 3 years. | Series complete. The first booster is 5 years later because the series ended at 7 years or older. | Approved (owner: "Approve them all", 2026-11-20) |
| P39 | Primary series complete. The first booster is due 3 years after it. ACIP puts the first booster 3 years out when the primary series finished before the 7th birthday, rather than the 5 years it allows from age 7. | Series complete. The first booster is 3 years later because the series ended before 7 years. | Approved (owner: "Approve them all", 2026-11-20) |
| P40 | Booster [date] if outbreak risk continues. For someone at increased risk in a serogroup A, C, W or Y outbreak, ACIP gives a booster once 5 years have passed since the last dose (3 years if the series finished before age 7, otherwise 5). If the patient is no longer at risk, untick the outbreak box. | A booster is due [date], 5 years after the last dose, if the outbreak continues. If the patient is no longer at risk, untick the outbreak box. | Built (PR #122) |
| P41 | A 3-dose MenB series at 0, 1–2 and 6 months, for this high-risk indication. Use one antigen family for every dose. MenB-4C (Bexsero, Penmenvy) and MenB-FHbp (Trumenba, Penbraya) are not interchangeable. | A three-dose MenB series at 0, 1–2 and 6 months. Use one product for every dose: Bexsero (or Penmenvy), or Trumenba (or Penbraya). | Approved (owner: "Approve them all", 2026-11-20) |
| P42 | Two MenB doses, at least 6 months apart, under shared clinical decision-making. The preferred age is 16 through 18. Past 18, the series may still be given up to the 24th birthday. The 6-month interval applies to both Bexsero and Trumenba. If rapid protection is needed, such as starting college within 6 months, a planned 3-dose series at 0, 1–2 and 6 months may be used instead. | Two MenB doses 6 months apart, by shared clinical decision-making; preferred age 16–18 years, given until the 24th birthday. For faster protection (for example, college entry within 6 months), give three doses at 0, 1–2 and 6 months. | Approved (owner: "Approve them all", 2026-11-20) |
| P43 | Two MenACWY doses, at least 8 weeks apart, because of this patient's high-risk indication. ACIP recommends the same 2-dose primary series for all four high-risk indications: asplenia, persistent complement deficiency, complement-inhibitor therapy and HIV. | Two MenACWY doses, at least 8 weeks apart, for this high-risk condition. | Approved (owner: "Approve them all", 2026-11-20) |
| P44 | Start the 4-dose infant MenACWY series — doses at 2, 4, 6 and 12 months, the early ones at least 8 weeks apart. High-risk infants 2–6 months need four doses. The final dose comes at 12 months or older, and at least 12 weeks after the one before it. | Start the four-dose infant series at 2, 4, 6 and 12 months. Early doses are ≥8 weeks apart; the final dose is at ≥12 months and ≥12 weeks after the one before. | Approved (owner: "Approve them all", 2026-11-20) |
| P45 | The second dose of the high-risk primary series, at least 8 weeks after dose 1. The minimum is 8 weeks. A later dose 2 still counts, and the series is not restarted. Two doses complete the primary series, then boosters continue while the risk lasts. | Dose 2, at least 8 weeks after dose 1. A late dose 2 still counts; do not restart. Boosters follow while the risk lasts. | Approved (owner: "Approve them all", 2026-11-20) |
| P46 | Dose 2 is given 1–2 months after dose 1, and no sooner than 4 weeks. Continue in the same antigen family as dose 1 — MenB-4C (Bexsero, Penmenvy) and MenB-FHbp (Trumenba, Penbraya) are not interchangeable. The series then completes with a third dose about 6 months after dose 1. | Give dose 2 1–2 months after dose 1 (minimum 4 weeks), with the same MenB product, and dose 3 about 6 months after dose 1. | Approved (owner: "Approve them all", 2026-11-20) |
| P47 | Dose 3 counts. A fourth dose is needed at least 4 months after it. Dose 3 was given less than 4 months after dose 2. CDC credits that dose and completes the high-risk series with one further dose 4 months or more later. | Dose 3 was given <4 months after dose 2. It counts; dose 4 is due ≥4 months after it. | Approved (owner: "Approve them all", 2026-11-20) |
| P48 | A third dose is needed, at least 4 months after dose 2. Dose 2 was given less than 6 months after dose 1, so the 2-dose schedule is not complete. This further dose finishes the series — dose 2 itself is not repeated. | Dose 2 was given <6 months after dose 1. It counts; dose 3 is due ≥4 months after dose 2. | Approved (owner: "Approve them all", 2026-11-20) |
| P49 | A single MenACWY dose for a first-year college student living in a residence hall. A dose already given at age 16 or older would satisfy this requirement on its own. Nothing on record does, so one dose is due. | One MenACWY dose before college entry, since none is on record at 16 years or older. | Approved (owner: "Approve them all", 2026-11-20) |
| P50 | The dose given at 16 or older was more than 5 years ago, so one dose is due before college entry. A dose at 16 or older covers college residence for 5 years. ACIP asks for at least one dose within 5 years before college entry. | The dose at 16 years or older was over 5 years ago, so one dose is due before college entry. | Approved (owner: "Approve them all", 2026-11-20) |
| P51 | …give it only after discussing it with her — it is offered here because she is at increased risk, and the decision is whether the benefit outweighs the potential risk. | …Offered because of increased risk; discuss the benefit and potential risk before giving it. | Approved (owner: "Approve them all", 2026-11-20) |
| P52 | After Penmenvy, continue MenB with Bexsero or Penmenvy (both MenB-4C). After Penbraya, continue with Trumenba or Penbraya (both MenB-FHbp). | After Penmenvy, continue MenB with Bexsero or Penmenvy. After Penbraya, continue with Trumenba or Penbraya. | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Line under each recorded dose

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P53 | Given 3 weeks after the previous dose, under the 8-week minimum for the high-risk primary series. / Repeat from [date]. / Do not restart the series. | Minimum interval not met (3 weeks; 8 required). Repeat from [date]; do not restart. | Approved (owner: "Approve them all", 2026-11-20) |
| P54 | Given as MenB-FHbp, but the series so far is MenB-4C. / Repeat from [date]. / Do not restart the series. | Not interchangeable with the first MenB dose (Bexsero). Repeat with Bexsero from [date]; do not restart. | Approved (owner: "Approve them all", 2026-11-20) |
| P55 | Given at about 6 weeks — below the 2-month minimum age for this brand. / Repeat from [date]. | Minimum age not met (6 weeks; 2 months for an unknown brand). Repeat from [date]. | Approved (owner: "Approve them all", 2026-11-20) |
| P56 | Booster given about 2.1 years after the previous dose, under the 5-year minimum for military recruits. / Repeat from [date]. | Booster about 2 years after the last dose; 5 required. Repeat from [date]. | Approved (owner: "Approve them all", 2026-11-20) |
| P57 | MenB booster given about 8 months after the previous dose, under the 1-year minimum after the primary series. / Repeat from [date]. | Booster 8 months after the series; 1 year required. Repeat from [date]. | Approved (owner: "Approve them all", 2026-11-20) |
| P58 | Given about 3 months after dose 1, under the 6-month interval. A third dose is needed, at least 4 months after this one. | Given 3 months after dose 1 (6 recommended). It counts; dose 3 is due ≥4 months later. | Approved (owner: "Approve them all", 2026-11-20) |
| P59 | Given about 2 months after dose 2, under the 4-month minimum for the high-risk schedule. A 4th dose is needed, at least 4 months after this one. | Given 2 months after dose 2 (4 recommended). It counts; dose 4 is due ≥4 months later. | Approved (owner: "Approve them all", 2026-11-20) |
| P60 | Given about 6 weeks after the previous dose, which did not count, under the 8-week minimum for its repeat. / Repeat at 11–12 years, with the routine dose. | Given 6 weeks after an invalid dose; 8 weeks required. Repeat at 11–12 years with the routine dose. | Approved (owner: "Approve them all", 2026-11-20) |
| P61 | Given at about [age] — below the 10-year minimum age for Bexsero. MenB is next offered at 16–23 years, by shared clinical decision-making. | Minimum age not met (10 years for Bexsero). MenB is next offered at 16–23 years (shared clinical decision-making). | Approved (owner: "Approve them all", 2026-11-20) |
| P62 | Given at about [age], before age 10. Whether it counts toward the high-risk series depends on the patient's risk on that date. | Given before 10 years. It counts toward the high-risk series only if the patient was high-risk then. | Approved (owner: "Approve them all", 2026-11-20) |
| P63 | High risk confirmed at about 8 weeks. | Counted: high-risk at the time (age 8 weeks). | Approved (owner: "Approve them all", 2026-11-20) |
| P64 | Only written, dated records count as evidence of vaccination. The recommendation above treats this dose as not given. If a record shows the date, add it, and the dose will be judged on that date. | Only dated records count. Add the date to check this dose; until then it is not counted. | Approved (owner: "Approve them all", 2026-11-20) |
| P65 | Same date as an earlier row ([date]): most likely one dose entered twice. Two doses of the same vaccine are never given on the same day. Correct its date, or remove this row. | Same date as an earlier dose ([date]); likely entered twice. Correct the date or remove this row. | Approved (owner: "Approve them all", 2026-11-20) |
| P66 | "Why this" under a dose: Actual interval: about 2.1 years. Required cadence: 5 years. | Interval: about 2 years. Required: 5 years. | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Combined shot

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P67 | Option 2: One combined injection (pentavalent, MenABCWY) | Option 2: One combined injection (MenABCWY) | Approved (owner: "Approve them all", 2026-11-20) |
| P68 | Replaces both shots above: do not give both. | Replaces both injections above; give one option, not both. | Approved (owner: "Approve them all", 2026-11-20) |
| P69 | A combined pentavalent shot is not an option today: Penmenvy may only be repeated once 6 months have passed since the last Penmenvy dose. | Not an option today: Penmenvy cannot be repeated within 6 months of the last Penmenvy dose. | Approved (owner: "Approve them all", 2026-11-20) |
| P70 | Brand options: choose one (shown above a single brand) | Brand: Bexsero | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Disclaimer

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P71 | Clinical decision support only. MeningoVax is not a substitute for clinical judgment. Verify all recommendations against current ACIP/CDC immunization schedules before administering vaccines. Every recommendation displayed includes a citation link to its source (CDC schedule notes, ACIP MMWR, or immunize.org Ask the Experts). Age eligibility and dose intervals shown here reflect ACIP guidance, which may differ from FDA package insert labeling. | Clinical decision support, not a substitute for clinical judgment. Check recommendations against current ACIP/CDC schedules. Each recommendation cites its source. Ages and intervals follow ACIP, which can differ from FDA labeling. | Approved (owner: "Approve them all", 2026-11-20) |
| P72 | About risk history: This app tracks the patient's current risk status only — it does not record when a risk factor started or ended. For an older dose given before the risk-based age threshold, whether it counted may depend on the patient's risk status on that specific date; when that matters, a "Needs input" prompt asks for it directly. | The app records current risk only. When an earlier dose depends on the risk on its date, a "Needs input" question asks. | Approved (owner: "Approve them all", 2026-11-20) |

### Patient screen: Added 2026-11-20 (your notes)

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| P73 | The outbreak card: "If the patient is no longer at risk, untick the outbreak box." (live in the app since PR #122) | If the patient is no longer at risk, uncheck the outbreak box. | Approved (owner: "Approve them all", 2026-11-20) |
| P74 | Warning on the Patient screen: "Check that the age and the tick-boxes are both right." | Check that the age and the checkboxes are right. | Approved (owner: "Approve them all", 2026-11-20) |
| P75 | A high-risk infant under 2 months: "The earliest any MenACWY vaccine may be given is 2 months of age, so nothing is due yet." | The infant series starts at 2 months, so nothing is due yet. | Approved (owner: "Approve them all", 2026-11-20) |

### Placement: Placement

| Item | Now | Approved wording | Answer |
|---|---|---|---|
| L1 | A valid dose's label sits at the right end of its line. An invalid dose's label sits below it, on the left, with the reason beside it. | Put every label at the right end of its dose line, with the reason as one line underneath. | Approved |
| L2 | The reason under an invalid dose is three stacked lines ("Given as…", "Repeat from…", "Do not restart…"). | One line (see the wording above). | Approved |
| L3 | A dose's "Why this" repeats the line above it (for example "not interchangeable" twice). | Show a dose's "Why this" only when it adds something: the interval numbers and the source. | Approved |
| L4 | The card's "Why this" sits directly under the "Or finish with Trumenba" line, so it looks like it explains that line. It explains the dose due. | Put "Why this" right under the dose label, and the alternative line after it. | Approved |
| L5 | A repeat dose's due date appears only inside the dose history ("Repeat from Nov 19, 2026"); the card's dose label has no date. | Show the due date beside the card's dose label, as "Next dose due [date]" does on other cards. | Approved |
| L6 | "Why this" often explains the branch that does not apply to this patient (for example, the 3-year rule for a series finished at 10 years). | Explain only this patient. The general rule lives in the Rulebook. | Approved |
| L7 | "About risk history" is a tap under the disclaimer at the bottom, but it explains the "Needs input" question in the dose history. | Show it beside the "Needs input" question, only when that question appears. | Approved |

## Later the same day: semicolons (owner, in chat)

35 approved sentences (R1, R12, R16, R24, R27, R46, R57, R62, R65, R67, R74, R88, R93, R96, P1, P8,
P25, P32, P42, P44, P45, P47, P48, P51, P53–P60, P64, P65, P68) contain a semicolon, which the
owner's style rule 4 (STOP G1, 2026-11-18) forbids. Asked; answer: **"Keep rule 4"**. Each
semicolon becomes a period or a comma, and the words otherwise stay as approved (for example P25
"…otherwise 5, then every 5 years while at risk"; P53 "Repeat from [date]. Do not restart.").

## Later the same day: one-sentence notes (owner, in chat)

P43, P49 and P50 are one sentence each, with nothing left for "Why this", against the owner's
2026-09-17 rule that every card note has both halves (`regression-u1-note-lead-and-detail.test.js`).
Answer: **"Allow one-sentence notes"**: built exactly as approved, and the U1 test now allows an
empty detail only when the whole lead folds behind "Why this" (Q10), so the card still shows the
link. A lead that stays in view, or a card shut by default, still needs a detail.

Also in Batch 2b: the Q10 "stay in view" list (`noteFold.js`) matched three sentences by their old
wording (P34, P35, P36). Its patterns now match the approved wording, so those lines still show on
the card. This changes no owner decision.

## Later the same day: Batch 4 placement, shown first (owner, in chat)

The owner asked to see Batch 4 before it was built ("show me first"); a before/after drawing of
L1–L7 was shown in chat. Answers: **L5 option A**, a repeat due today reads "Repeat today." on
the dose line (no new line on the card); **L1–L4, L6, L7 "Build as shown"**. As drawn: every dose
label at the right of its row, the reason as one line beneath (L1, L2); a dose's "Why this" only
when it adds numbers (L3; the wrong-product dose has none); the card's "Why this" right under its
title, then the other-product line, then brands and the record (L4); a traveller's "Why this"
explains only this patient (L6); the risk-history sentence under the "Needs input" question,
reading "…this question asks." (L7), and no "About risk history" link in the disclaimer.
