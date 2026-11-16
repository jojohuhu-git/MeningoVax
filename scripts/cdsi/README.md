# CDC CDSI files — MeningoVax

CDSI is CDC's machine-readable version of ACIP's schedule (CDC's software rules plus CDC's own
test patients). It is a **cross-check, never the authority**: where CDSI and CDC/ACIP wording
differ, the wording wins. Nothing here is part of the app.

**Item 1.5 done 2026-11-15:** CDC's 104 meningococcal test patients now run through the app
(`runTestCases.mjs`). Item 2.3 (holding the rule table against CDSI's rules) comes later.
Both scripts were copied from PneumoVax's (`~/Downloads/PneumoVax/scripts/cdsi/`) and adapted.
Results of the first run: `docs/archive/report-2026-11-15-cdsi-test-patients.md`.

| File | What it is |
|---|---|
| `cdc-files/AntigenSupportingData-Meningococcal-ACWY-4.65.xml` | CDC's MenACWY rules, CDSI **4.65** (Aug 2026), unchanged from CDC's zip |
| `cdc-files/AntigenSupportingData-Meningococcal-B-4.65.xml` | CDC's MenB rules, same release |
| `cdc-files/ScheduleSupportingData-4.65.xml` | CDC's vaccine-code list (CVX), same release |
| `cdc-files/cdsi-healthy-childhood-and-adult-test-cases-v4.46.xlsx` | CDC's test patients, healthy (27 MenACWY, 28 MenB) |
| `cdc-files/CDSi-underlying-conditions-test-cases-v4.6.xlsx` | CDC's test patients, with conditions (25 MenACWY, 24 MenB) |
| `cdc-files/meningo-test-cases.json` | The 104 meningococcal patients pulled out of the two workbooks (made by `extractTestCases.py`) |
| `cdc-files/meningo-app-answers.json` | The app's answer for each of the 104, saved, so a run can say which answers moved |
| `extractTestCases.py` | Workbooks → JSON. Python standard library only |
| `cdsiCore.mjs` | The comparing: runs the 104 patients through the app, dose by dose and next step, and holds the `KNOWN` table of families. Used by both the script below and the test |
| `runTestCases.mjs` | Prints the comparison (summary, every disagreement, what moved) |

Source: https://www.cdc.gov/iis/cdsi/index.html (downloaded by the owner 2026-11-08).

**What 4.65 changed for meningococcal** (its release notes, read 2026-11-08). MenACWY only; the
MenB paragraph is absent, so nothing changed for MenB:
- the dose-4 skip in the "Risk Start 2-23 months" series now counts the 4-day grace;
- MenQuadfi added for dose 1 of that series;
- *"Changed the allowable vaccine begin age for Menquadfi (CVX 203) from 2 years – 4 days to 6 weeks
  – 4 days. This was performed across all series and all doses."* **CDC's software now agrees with
  the app's MenQuadfi-from-6-weeks rule** (owner decision 2026-09-23, on AAP's word);
- MCV4 unspecified (CVX 147) allowed in every risk series.

## How to run

```bash
npx vite-node scripts/cdsi/runTestCases.mjs           # summary + every disagreement
npx vite-node scripts/cdsi/runTestCases.mjs --all     # every patient
```

Read the last lines. **"NEW disagreements"** and **"answers moved since saved"** must both be 0.
Every known disagreement is listed by family in the `KNOWN` table in `cdsiCore.mjs`,
each marked OPEN (a question for the owner), DELIBERATE (the app follows CDC/ACIP wording or
newer CDC data on purpose), SAME ADVICE, or NOT COMPARABLE. A moved answer is read first, then
saved with `--save-answers` only once the reason is understood.

**A required test since 2026-11-15** (after the owner saw the families at STOP B):
`src/logic/__tests__/cdsi-test-patients-gate.test.js` fails `npm test` on a NEW disagreement, a
known one that now agrees (take it off the list), or a moved answer.

## When CDC publishes a new release

Replace the files here (keep the version in the file name), read the release notes'
meningococcal paragraphs, update the two workbook names in `extractTestCases.py`, run
`python3 -I scripts/cdsi/extractTestCases.py`, then run the script above. A NEW disagreement
is a question for the owner, never a fix by itself: read the CDC/ACIP wording live first
(`verify-clinical-source` skill). The
monthly scheduled task `monthly-vaccine-source-check` says when a new release is out.
