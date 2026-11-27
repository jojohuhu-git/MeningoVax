# Owner decision INFANT-MIN-CITE — the infant MenACWY gaps cite CDC's notes (2026-11-27)

## What the app did

Infant MenACWY cards stated the gaps between doses with no source number:

- Dose 1 card (start at 2–6 months): "Early doses are ≥8 weeks apart. The final dose is at ≥12
  months and ≥12 weeks after the one before."
- Doses 2–3 of a series begun at 2 months: "It can be given today if needed, as the minimum
  interval of 8 weeks has passed." / "Earliest valid date: … (minimum interval 8 weeks)." and "The
  final dose of the series comes at 12 months or older, and at least 12 weeks after the one before
  it."
- The continuing card (start at 3–6 months): the same final-dose sentence.

Worked patient shown to the owner: complement deficiency, born Aug 1, 2026, Menveo 2-vial Oct 1
(2 months), high-risk then = yes, seen Nov 27, 2026 → "Next dose due Dec 1, 2026" and the
unnumbered 8-week sentence.

## The sources

- CDC Child/Adolescent Notes (`cdcChildAcwyInfantSeries`, in refs.js since 2026-11-15): "dose 2
  [and dose 3 if applicable] at least 8 weeks after previous dose until a dose is received at age 7
  months or older, followed by an additional dose at least 12 weeks later and after age 12 months".
  Printed in CDC's "Dose 1 at age 3–6 months" row.
- ACIP 2020 footnote (`acip2020InfantSeriesStart3to6mo`): the same gaps, also about a 3–6-month
  start of MenACWY-CRM.
- CDC catch-up table, read live 2026-11-27 ("Children age 4 months through 6 years", Meningococcal
  ACWY): minimum interval dose 1 → dose 2 "8 weeks"; dose 2 → dose 3 "See Notes".
- No sentence read states 8 weeks for a series begun at 2 months. The rule row
  `ACWY-INFANT-SERIES-GAP` already rests every infant's gaps on the first two; C11 (2026-11-26)
  already cites the CDC sentence on "at least 8 weeks between the early doses", a line that also
  serves 2-month starts, and kept outbreak infants on ACIP's row.

## Question and answer

Options: (a) cite CDC's Notes sentence for complement, asplenia, HIV and travel infants, as C11 did
(recommended); (b) cite CDC's catch-up table, dose 2 only; (c) leave unnumbered.
**Owner, 2026-11-27: "CDC Notes sentence."**

Applied to the groups CDC's notes speak for (complement, asplenia, HIV, travel). An outbreak-only
infant keeps C11's choice: no CDC number. The 12-week final-dose sentences take the same number
(the same sentence states them; citation only under Q12).

## Built

`recommend.js` (the infant MenACWY function: one `cdcInfantGaps` flag for its three cards). Guard
`regression-2026-11-27-infant-acwy-minimum-cites-cdc-notes.test.js`. 0 answers moved; 394 of
31,160 patients' screens differ (15 real): the new number, its pop-up, and a grey "CDC
Child/Adolescent Notes" source button under "Why this"; 0 words changed.
