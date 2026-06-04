# MeningoVax

A standalone, client-side React SPA providing ACIP/CDC-cited clinical decision support for meningococcal vaccination — MenACWY and MenB — across the full age spectrum from infants to adults.

## What it is

MeningoVax is a 5-step guided wizard that takes a patient's age, risk factors, and vaccination history as input and returns:

- **MenACWY recommendation** — dose number, status (due / catch-up / risk-based / complete / not indicated), earliest next date, brand options (Menveo, MenQuadfi), and ACIP/CDC citation links.
- **MenB recommendation** — dose number, status (shared-decision / risk-based / complete / not indicated / deferred), antigen-family lock enforcement (4C vs FHbp), brand options (Bexsero, Trumenba), and citations.
- **Pentavalent offer** — when both MenACWY and MenB are due at the same visit and the patient is ≥10 years, a highlighted card suggests Penmenvy or Penbraya as a single-injection alternative.

All recommendations are traceable to citations: ACIP 2020 MMWR (RR-9), CDC child/adolescent and adult schedule notes, the 2023 Pfizer and 2025 GSK pentavalent MMWRs, and CDC complement-inhibitor guidance.

## 5-Step Flow

1. **Age** — Quick age-group chips (Infant / Child / Adolescent / Adult) OR precise entry (years + months) OR date of birth.
2. **Risks** — Checklist of 11 ACIP risk factors: complement deficiency, complement-inhibitor therapy, asplenia, HIV, microbiologist, travel, military, college dorm, serogroup A/C/W/Y outbreak, serogroup B outbreak, pregnancy.
3. **MenACWY History** — Optional: record past MenACWY doses (date + brand, both optional).
4. **MenB History** — Optional: record past MenB doses; brand selection establishes the antigen-family lock.
5. **Results** — Status-badged recommendation cards with due-today pills, next-dose dates, brand options, clinical notes, and clickable ACIP/CDC citation chips.

## Tech Stack

- **React 18** with hooks (no class components)
- **Vite 5** — `npm run dev` starts dev server, `npm run build` produces `dist/`
- **Vitest** + @testing-library/react — `npm test` runs all tests
- No backend, no authentication, no database — everything runs in the browser

## Setup

```bash
npm install
npm run dev       # dev server on http://localhost:5173 (or 5174 if occupied)
npm test          # run Vitest test suite
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Clinical Sources

All rules are verified against ACIP guidance, not FDA package inserts (ACIP often permits broader use than FDA labels):

- **ACIP 2020 MMWR** — Mbaeyi SA et al., *Meningococcal Vaccination: ACIP Recommendations, United States, 2020* (MMWR RR-9). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7527029/
- **CDC Child/Adolescent Schedule Notes** — MenACWY and MenB sections. https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
- **CDC Adult Immunization Schedule Notes** — Meningococcal section. https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html
- **CDC Complement-Inhibitor Guidance** — https://www.cdc.gov/meningococcal/hcp/clinical-guidance/complement-inhibitor.html
- **ACIP 2023 — Penbraya (Pfizer)** — MMWR 2024;73. https://www.cdc.gov/mmwr/volumes/73/wr/mm7315a4.htm
- **ACIP 2025 — Penmenvy (GSK)** — MMWR 2025. https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm

## PWA / Home-Screen Install

`public/manifest.webmanifest` and `<link rel="apple-touch-icon">` are included, enabling "Add to Home Screen" on iOS and Android. A service worker (offline caching) is not yet implemented — the app requires network access on first load.

## Deployment

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on every push to `main`. The workflow is inert until the repo has a GitHub remote and Pages is enabled.

### Deploying for the first time

1. **Set the base path.** `vite.config.js` currently sets `base: '/meningovax/'`. GitHub Pages serves your project site at `https://<user>.github.io/<repo-name>/`, so `base` must equal `/<repo-name>/`. If your repo name is not `meningovax`, update `vite.config.js`:
   ```js
   base: '/your-repo-name/',
   ```
2. **Push to GitHub.** Create a GitHub repo, add it as a remote, and push `main`.
3. **Enable Pages.** In the repo → Settings → Pages → Build and deployment → Source, select **GitHub Actions**.
4. The workflow will run automatically on the next push to `main` and publish `dist/` to your Pages URL.

## Not a Substitute for Clinical Judgment

MeningoVax is decision support only. Verify all recommendations against current ACIP/CDC guidance before administering vaccines. The tool does not account for contraindications, allergies, or patient-specific clinical nuances that require provider judgment.
