# Owner decisions T1–T2: the last two "todo" rules in the rulebook (2026-11-19)

Asked while reading the rulebook's 20 "todo" rules live (port Phase 7.1). 18 got a quoted
sentence (PR #118). These two had no source that settled them.

## T1 — a high-risk baby who started MenACWY at 2 months and fell behind

**Question.** Asplenia, one Menveo at 2 months, nothing since, seen at 6 years. The app asked for
3 more doses (the "2, 4, 6 and 12 months" series, 4 in all). CDC's scheduling software, CDSI 4.65,
asks for 2 more (3 in all).

**What CDSI says** (`scripts/cdsi/cdc-files/AntigenSupportingData-Meningococcal-ACWY-4.65.xml`,
series "Meningococcal ACWY risk 2-23 month", one checklist for every infant start):
- doses 2 and 3: "Dose is not required if patient is currently 7 months of age or older";
- dose 4: "Dose is not required if more than 2 doses have been administered between 2 and 7
  months OR at least 1 dose on or after 7 months";
- dose 5: at 12 months and at least 12 weeks after the one before.

CDC's written note ("Dose 1 at age 2 months: 4-dose series (additional 3 doses at age 4, 6, and
12 months)") does not say what happens to a child who falls behind. None of CDC's 104
meningococcal test patients is such a child.

**Owner answer:** "CDSI: 2 more". Asked whether that holds for every 2-month starter whose
dose 2 came at 7 months or older, including a baby with dose 2 at 9 months, which reverses the
2026-09-15 decision ("Dose 1 at 2 months: 4-dose series", no 3-dose shortcut) for those
patients: **"All of them"**.

**Built.** `menacwyOn3DoseShortcut()` in `src/logic/seriesTotals.js`: dose 1 before 7 months (no
lower bound) and dose 2 at 7 months or older → 3 doses. On time at 2, 4, 6 months is still 4.
Test: `regression-2026-11-19-t1-two-month-start-falls-behind.test.js`.

## T2 — "Completion age unknown: treated conservatively as before 7"

**Question.** Since C1 (an undated dose does not count), the last primary dose always has a date,
so this fallback never changes a card. Keep it as a safety net, or remove it?

**Owner asked:** "this is for high risk only correct?". **Answer given:** yes. It only matters on
the 3-year/5-year MenACWY booster schedule: asplenia, complement deficiency or inhibitor, HIV,
and since C10 also travel and A/C/W/Y outbreak (microbiologists too, but always 10 or older).

**Not yet decided.** The rulebook line stays "todo" until the owner picks.
