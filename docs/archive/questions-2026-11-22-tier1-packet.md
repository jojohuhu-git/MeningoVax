# Tier 1 owner questions (prepared 2026-11-22; not yet answered)

Five clinical questions, each with one patient, what the app says today, the source, and my
recommended answer. Controls and extra quotes follow each box. **Nothing in the app has changed.**
Every "app says" line was run through the real engine on branch `phase8/c5-quote-population`
(scratch script `worked.mjs`, not committed). Quotes come from `src/data/refs.js` (read live on the
date shown) or were read live today in the browser pane.

## Already answered: the microbiologist whose series ended before age 7 (C5 open item)

**Owner, 2026-11-22: "a microbiologist who is 7 years is impossible."** I checked it by measurement.
For every saved patient, I took each future date a card gives and gave the dose on that date and
30 days to 2 years before it. Only patients the app itself flags as too young for "microbiologist"
(under 10, `ageImplausibleRisks`) show the mismatch. **Proposed follow-through (no answer moves):**
the C5 guard stops pinning this item, because no realistic patient reaches it. The same measurement
found Q1.

---

## Q1. A high-risk MenB booster given as the 3rd dose is counted, however early

**Box.** An 18-year-old with asplenia had Bexsero on Aug 1, 2025 and Feb 1, 2026. That series is
complete, because dose 2 came 6 months after dose 1. The card says the first booster is due Feb 1,
2027. A 3rd dose was given Mar 1, 2026, one month later. Today the app **counts it as the booster**
and next asks for "Booster (dose 4), 2–3 years after the last" from Mar 1, 2028. ACIP gives the
booster "1 year after primary series completion", and your C9 answer (2026-11-15) said an earlier
booster does not count. **My answer:** "Not counted — repeat", with the repeat from Mar 1, 2027,
1 year after the early dose. This is what the app already does when the series had 3 doses.

**Why the app does this.** The 1-year check (`MENB-HIGHRISK-BOOSTER-GAP`, `doseRules.js:1697`)
only looks at a 4th or later MenB dose. When a high-risk series ends in 2 doses, the first booster
is the 3rd dose, and nothing checks its date.

**Sources**
- ACIP 2020 (read 2026-11-21): "a MenB booster dose 1 year after primary series completion, then
  every 2–3 years thereafter".
- ACIP Oct 2024 (read 2026-11-22): "a third dose is not needed if the second dose was administered
  ≥6 months after the first dose".
- ACIP 2020 Table 8, serogroup B outbreak (read 2026-11-21): "Single dose if ≥1 yr after MenB
  primary series completion".

**Worked patients (engine, today = date of the last dose)**

| Patient | Doses (Bexsero) | App today | With my answer |
|---|---|---|---|
| Asplenia, 18y | Aug 1 2025, Feb 1 2026, **Mar 1 2026** | 3rd dose counted; "Booster (dose 4), 2–3 years after the last" from Mar 1, 2028 | 3rd dose "Not counted — repeat"; "First booster" from Mar 1, 2027 |
| Serogroup B outbreak, 20y | same dates | 3rd dose counted; card "**Complete** (outbreak booster given)" | 3rd dose not counted; booster from Mar 1, 2027 |
| **Control:** asplenia, 18y, 3-dose series | Jul 1 2025, Aug 1 2025, Feb 1 2026, **Mar 1 2026** | 4th dose "Booster 4 weeks after the series, 1 year required. Repeat from Mar 1, 2027." | unchanged |

**Size.** Seven high-risk MenB groups in the saved patients (asplenia, complement, microbiologist,
serogroup B outbreak, and three pairs) each have 52 patients whose card could take an early 3rd
dose this way. How many recorded answers move will be measured when this is built.

**Push-back.** The extra dose is not useless, so one could count it and restart the clock from it.
But that is what today's app does, and it gives a 2-dose patient a shorter wait to the first booster
than a 3-dose patient gets. I have not checked how CDC's CDSI test patients handle this case.

---

## Q2. What the CDC complement-inhibitor page says, on no card

**Box.** A 30-year-old starting a complement inhibitor (e.g. eculizumab) is due MenACWY dose 1 and
MenB dose 1. The cards give the doses only. CDC's page says three more things the cards never say:
the vaccines give incomplete protection, antibiotic prophylaxis can be considered, and vaccines should
ideally be finished 2 weeks before the first inhibitor dose. **My answer:** add one short note,
shown once above the cards, only for the complement checkbox, beginning "If on a complement
inhibitor". I would draw it for you before building it.

**Sources** (CDC, "Clinical Guidance for Managing Meningococcal Disease Risk in Patients Receiving
Complement Inhibitor Therapy", updated March 6, 2026, read live 2026-11-22)
- "Vaccination is also recommended but offers incomplete protection."
- "healthcare providers could consider antimicrobial prophylaxis for complement inhibitor recipients
  to potentially reduce meningococcal disease risk."
- "Ideally, complete or update meningococcal vaccination at least 2 weeks prior to administering the
  first dose of the complement inhibitor."
- The page also allows starting sooner: "patients can initiate complement inhibitor therapy before
  meningococcal vaccination has been completed if the risks for delaying completement inhibitor
  therapy outweigh the risks for developing meningococcal disease." ("completement" is CDC's typo.)

**Proposed note (each clause matches one quote above):**
"If on a complement inhibitor: vaccination gives incomplete protection [1]. Consider antibiotic
prophylaxis [1]. Ideally finish these vaccines at least 2 weeks before the first inhibitor dose [1]."

**Why "If on a complement inhibitor".** The app's one checkbox covers inherited complement
deficiency too, and this page is about inhibitor therapy only.

**Push-back.** The app is a dosing tool, and prophylaxis is a prescribing decision. The note says
"consider", as CDC does, and gives no drug or dose. The page also asks clinicians to teach symptoms
and keep a high index of suspicion. I left that out to keep the note short. Say if you want it.

---

## Q3. Healthy MenB dose 2 given early: when is dose 3?

**Box.** A healthy 17-year-old had Bexsero on May 1 and Jun 1, 2026. Dose 2 came under 6 months
after dose 1, so a dose 3 is owed. The app says dose 3 from **Oct 1, 2026** (4 months after dose 2),
as ACIP Oct 2024 says. One immunize.org answer adds "and 6 months after dose 1", which would make it
**Nov 1, 2026**. Another immunize.org answer on the same page agrees with ACIP. **My answer:** keep
ACIP's 4-month rule. No change.

**Sources**
- ACIP Oct 2024 (read 2026-11-15): "the 2 doses should be separated by 6 months. If the second dose
  is administered <6 months after the first dose, a third dose should be administered ≥4 months
  after the second dose".
- immunize.org Ask the Experts, MenB (read 2026-11-22), the answer that agrees: "If the second dose
  is given at an interval of less than 6 months, a third dose should be given at least 4 months
  after the 2nd dose."
- immunize.org, the answers that differ: "…should receive a third dose at least 6 months after dose
  1 and 4 months after dose 2".

**Control.** The high-risk series already uses both lines, 6 months from dose 1 and 4 months from
dose 2 (CLAUDE.md, "MenB D3"), because ACIP's high-risk sentences say so. The healthy rule has only
the 4-month line. CDC's schedule notes were not checked for this point.

**Push-back.** The later date is never wrong, since a dose on Nov 1 also meets the 4-month line.
Following the stricter immunize.org answer would cost one month of waiting and no doses.

---

## Q4. Pregnant patients with a second risk factor: add them to the saved answers?

**Box.** The saved answers, the stored results that catch any answer changing, have only one
pregnant patient group, pregnancy alone. A pregnant 28-year-old with complement deficiency gets
MenB dose 1 now, with a pregnancy line ("Discuss the benefit and potential risk"). That looks
right, but if a later change broke it, no saved answer would notice. **My answer:** add four groups
where pregnancy changes the MenB card: pregnancy with complement, asplenia, microbiologist, and
serogroup B outbreak. This adds new stored patients and should change no existing one. I would
measure that before committing.

**What is checked today.** The never-events sweep (checks for impossible outputs, such as
"Dose 3 of 2") already runs every pregnancy pair. What is missing is the change detector.

**Worked patients (engine, today = Sep 15, 2026, unvaccinated, 28y)**

| Risks | MenB card |
|---|---|
| Pregnancy + complement | "Dose 1 of 3 (high-risk series)", with the pregnancy line |
| Pregnancy + asplenia | same |
| **Control:** pregnancy alone | "Defer during pregnancy" |

**Push-back.** Each group adds 1,252 stored patients (measured: every group has that many), plus
388 impossible-record ones in the second file. Four groups add 6,560 lines, about a quarter more than
today's 24,600 (18,780 + 5,820).

---

## Q5. Serogroup B outbreak: a MenB booster from 6 months, if public health advises it

**Box.** A 20-year-old in a serogroup B outbreak finished Trumenba on Jul 15 and Aug 15, 2025 and
Jan 15, 2026. The card says the booster is due **Jan 15, 2027** (1 year). ACIP's outbreak table
allows 6 months "if public health officials" advise it. If public health gave the booster on Sep 15,
2026 (8 months), the app says **"Not counted — repeat from Sep 15, 2027"**. **My answer:** count a
serogroup B outbreak booster from 6 months, and add one line to the card: "Public health may advise
it from 6 months after the series."

**Sources**
- ACIP 2020 Table 8 (read live 2026-11-22): "Single dose if ≥1 yr after MenB primary series
  completion (≥6 mos interval might also be considered by public health professionals)".
- ACIP 2020 text (read live 2026-11-22): "interval of ≥6 months may be considered if recommended by
  public health officials".
- CDC recommendations page (read 2026-11-22): "CDC recommends a booster dose for these individuals
  if a year or more has passed since the most recent MenB vaccine".

**Why count it, and not keep 1 year.** The app cannot know whether public health advised it. But a
booster given 6–12 months into an outbreak was most likely given on that advice. Calling it "Not
counted" would tell the clinician to repeat a dose that ACIP allows.

**Control (engine).** Asplenia, same doses, booster at 8 months: "Booster about 8 months after the
series, 1 year required. Repeat from Sep 15, 2027." It stays that way under my answer, because the
6-month allowance is in the outbreak table only.

**Push-back.** CDC's own page gives only "a year or more". A booster at 6–12 months given without
public health advice would also be counted. Option B: keep the 1-year floor and only add the card
line.

**Depends on Q1.** If Q1 is answered "count it", an early booster after a 2-dose series is counted
anyway, and Q5 changes only 3-dose patients like this one.
