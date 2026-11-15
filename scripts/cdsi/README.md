# CDC CDSI files — MeningoVax

CDSI is CDC's machine-readable version of ACIP's schedule (CDC's software rules plus CDC's own
test patients). It is a **cross-check, never the authority**: where CDSI and CDC/ACIP wording
differ, the wording wins. Nothing here is part of the app.

**Files only so far — nothing in this folder has been run against MeningoVax yet.** The scripts
come with the MeningoVax port (plan in PneumoVax, see below): item 1.5 runs CDC's meningococcal
test patients through the app; item 2.3 holds the rule table against CDSI's rules.
PneumoVax's working versions to copy from: `~/Downloads/PneumoVax/scripts/cdsi/`
(`extractTestCases.py`, `runTestCases.mjs`, `README.md`).

| File | What it is |
|---|---|
| `cdc-files/AntigenSupportingData-Meningococcal-ACWY-4.65.xml` | CDC's MenACWY rules, CDSI **4.65** (Aug 2026), unchanged from CDC's zip |
| `cdc-files/AntigenSupportingData-Meningococcal-B-4.65.xml` | CDC's MenB rules, same release |
| `cdc-files/ScheduleSupportingData-4.65.xml` | CDC's vaccine-code list (CVX), same release |
| `cdc-files/cdsi-healthy-childhood-and-adult-test-cases-v4.46.xlsx` | CDC's test patients, healthy (27 MenACWY, 28 MenB) |
| `cdc-files/CDSi-underlying-conditions-test-cases-v4.6.xlsx` | CDC's test patients, with conditions (25 MenACWY, 24 MenB) |

Source: https://www.cdc.gov/iis/cdsi/index.html (downloaded by the owner 2026-11-08).

**What 4.65 changed for meningococcal** (its release notes, read 2026-11-08). MenACWY only; the
MenB paragraph is absent, so nothing changed for MenB:
- the dose-4 skip in the "Risk Start 2-23 months" series now counts the 4-day grace;
- MenQuadfi added for dose 1 of that series;
- *"Changed the allowable vaccine begin age for Menquadfi (CVX 203) from 2 years – 4 days to 6 weeks
  – 4 days. This was performed across all series and all doses."* **CDC's software now agrees with
  the app's MenQuadfi-from-6-weeks rule** (owner decision 2026-09-23, on AAP's word);
- MCV4 unspecified (CVX 147) allowed in every risk series.

**When CDC publishes a new release:** replace the files here (keep the version in the file name),
read the release notes' meningococcal paragraphs, and re-run whatever scripts exist by then. The
monthly scheduled task `monthly-vaccine-source-check` says when a new release is out.
