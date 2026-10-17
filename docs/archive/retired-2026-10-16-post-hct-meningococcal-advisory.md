# RETIRED 2026-10-16 — the post-HCT meningococcal advisory

**This is a record of deleted code, not live guidance. Do not use it to vaccinate
anyone, and do not restore it without a new owner decision.** The app no longer
gives any post-transplant meningococcal advice.

## What the app does now, and why

Ticking "hematopoietic cell transplant" is a hard stop. The transplant row merged
into the existing CAR-T / B-cell exclusion row, and the results screen says:

> **Individualized revaccination schedule required**
>
> Revaccination after hematopoietic cell transplant, CAR‑T therapy, or
> B‑cell–depleting therapy follows a transplant‑ or therapy‑specific protocol,
> not age‑based scheduling, and some live vaccines may be contraindicated. Follow
> your institutional protocol or current national guidance (ASCO, NCCN, IDSA, CDC).

No recommendation cards, no advisory banner, and no card a *different* ticked risk
factor would have produced on its own.

**Why it was retired.** The advisory was added once (`55167ff`) and then corrected
**four times in about five weeks**:

| Commit | What was wrong |
|---|---|
| `ba255ef` | the rule was wrong |
| `a0106f4` | the interval was wrong, and a booster sentence was misworded |
| `03c8387` | wrong again — it needs an additional risk factor, not an age band |
| `f32692e` | told a clinician to select a risk factor she had already selected |

Every one of those shipped a wrong clinical statement to a clinician-facing screen.
They were not documentation drift that a test could catch — **the clinical rule
itself was wrong five times.** Post-transplant vaccination is genuinely contested
between sources and it changes. The case for stopping is not that the advice was
low value: it is that it could not be reliably kept true by one maintainer, and
wrong advice on a clinical screen is worse than no advice.

Owner decision 2026-10-16. The plan is the single copy at
`PneumoVax/docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md`; this
repo carries a pointer beside this file. PneumoVax made the same change to its own
`hsct` box in the same week, and a cross-repo test now compares the two stop
screens byte for byte.

**The 2026-09-19 C2-6 decision is superseded by this one.** C2-6 existed to keep a
transplant patient's travel/outbreak recommendation visible underneath the
advisory; the stop now hides it. Its two test files
(`regression-c2-6-hct-other-risk-selected.test.js` and its `-ui` twin) were deleted
outright rather than skipped, so nothing reads as merely paused.

## The sources the advisory cited

These are recorded so a future reader can see what the advice rested on. **They are
not a current recommendation and none of them was re-verified on 2026-10-16** — the
dates below are when they were last read live.

```js
  // Post-HCT meningococcal advisory (verified live, verbatim, 2026-09-13/14) --
  ascoAdultCancer2024: {
    url: 'https://ascopubs.org/doi/10.1200/JCO.24.00032',
    label: 'ASCO Guideline: Vaccination of Adults With Cancer (J Clin Oncol 2024)',
    short: 'ASCO Vaccination of Adults With Cancer (2024)',
    quote: 'Two doses of quadrivalent meningococcal vaccine 2 months apart are recommended 6-12 months after transplant for recipients with risk factors. Meningococcal B vaccines should also be offered to HSCT recipients with high-risk conditions or young adults (16-23 years old) who are eligible to receive the vaccine.',
    lastVerified: '2026-09-14',
  },
  idsa2013MenacwyHct: {
    url: 'https://academic.oup.com/cid/article/58/3/e44/336537',
    quote: 'Two doses of MCV4 should be administered 6–12 months after HSCT to persons aged 11–18 years, with a booster dose given at age 16–18 years for those who received the initial post-HSCT dose of vaccine at age 11–15 years',
    label: '2013 IDSA Clinical Practice Guideline for Vaccination of the Immunocompromised Host (Rubin et al., Clin Infect Dis 2014) — Recommendation 80',
    short: 'IDSA 2013 Guideline (HCT MenACWY)',
    lastVerified: '2026-09-13',
  },
  kambojShah2019MenbHct: {
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6814287/',
    quote: 'Meningococcal B vaccines should additionally be administered to SCT recipients aged 10–25 years with at risk conditions (asplenia, terminal complement deficiency, laboratory worker, travel, outbreak)',
    label: 'Kamboj & Shah, "Vaccination of the Stem Cell Transplant (SCT) Recipient" (Infect Dis Clin North Am, 2019), citing IDSA/ASBMT/EBMT consensus',
    short: 'Kamboj & Shah 2019 (HCT MenB)',
    lastVerified: '2026-09-13',
  },
};
```

## The deleted risk-factor row (`src/data/riskFactors.js`)

```js
  {
    id: 'hct',
    label: 'Hematopoietic cell transplant (HCT)',
    sublabel: 'full re-vaccination; advisory, coordinate with the transplant/ID team',
    menacwyClass: undefined,
    menbClass: undefined,
    group: 'IC',
    refs: ['cdcAlteredImmunocompetence', 'idsa2013MenacwyHct', 'kambojShah2019MenbHct'],
  },
```

## The deleted advisory (`hctAdvisory()` in `src/logic/recommend.js`), verbatim

All eight advisory lines are inside this block, each with the citation it carried.
The header comment is the full reasoning trail, including every correction above.

```js
// ═══════════════════════════════════════════════════════════════════════════
//  HCT advisory block (relative-to-transplant; never asks for the transplant
//  date — see PneumoVax's hsctAdvisory() for the same design rule).
//
//  Rule settled cross-repo 2026-09-13 (see
//  docs/archive/handoff-2026-09-13-post-hsct-meningococcal-pointer.md):
//  vaxapp's and this app's HCT advisories were wrong in opposite directions.
//  The corrected rule, sourced live 2026-09-13 (see refs.js for verbatim
//  quotes):
//   • CDC Altered Immunocompetence page: meningococcal conjugate (MenACWY) is
//     revaccinated "for individuals 11 through 18 years or at high-risk",
//     MenB "for individuals 16 through 23 years or at high-risk". The
//     "or at high-risk" limb applies at ANY age (asplenia, persistent
//     complement deficiency, or eculizumab/ravulizumab), from the transplant
//     alone — it was previously missing from both bands below.
//   • ASCO (JCO 2024): confirms MenB is indicated for "young adults (16-23
//     years old)" from the transplant alone, contradicting this app's old
//     "not triggered by transplant alone" MenB wording for that band.
//   • IDSA 2013 guideline (Rubin et al., Recommendation 80) — the ONLY
//     meningococcal recommendation in that guideline for HCT patients, and
//     it predates MenB licensure (2014-15), which is why it has no MenB
//     content: 2 doses of MCV4 6-12 months post-HCT for ages 11-18, booster
//     at 16-18.
//   • Kamboj & Shah 2019 (citing IDSA/ASBMT/EBMT): MenB should additionally
//     be given to HCT recipients aged 10-25 who ALSO have another qualifying
//     risk condition (asplenia, complement deficiency, microbiologist
//     exposure, travel, or outbreak) — kept for the population this app's
//     10-25 MenB pointer band covers that falls outside CDC's 16-23
//     transplant-alone band (i.e. ages 10-15, and 24-25).
//
//  The transplant alone never creates a booster schedule (rule 4 of the
//  settled cross-repo decision) — where the high-risk limb applies, the
//  text below defers to this app's own standing high-risk MenACWY/MenB
//  guidance (already selected via the 'asplenia'/'complement' checkboxes)
//  rather than inventing a post-transplant booster interval.
//
//  Owner correction 2026-09-13: age gates WHICH population CDC/ASCO/IDSA
//  specifically source a post-transplant timing for — it does NOT gate
//  whether the vaccine can be given at all. The real gates are each
//  vaccine's minimum age (MenACWY: 2 months; MenB: 10 years, its minimum
//  licensed age). Above that floor, a line always renders for both
//  vaccines; outside the specifically-sourced population it says plainly
//  that no source states a transplant-specific timing there, rather than
//  omitting the line (which reads as "does not apply"). This also fixes a
//  real bug the same correction surfaced: the high-risk limb previously had
//  no age floor for MenB, so a patient under 10 with the complement/asplenia
//  checkbox got a MenB line despite being below MenB's licensed minimum age.
//
//  P1 correction (2026-09-14, owner decision, supersedes the IDSA-sourced
//  "11 through 18" MenACWY carve-out above): the unconditional 11-18 age
//  band was WRONG. Read the ASCO passage live (ascopubs.org, JCO 2024):
//  "Two doses of quadrivalent meningococcal vaccine 2 months apart are
//  recommended 6-12 months after transplant for recipients with risk
//  factors." No age band — ASCO requires an additional risk factor at any
//  age, same as the high-risk limb below, not a separate age-only path. The
//  same sentence's MenB clause proves this is deliberate: it explicitly
//  offers an unconditional age path ("young adults 16-23 years old") next
//  to the risk-factor path, so ASCO plainly knows how to write "age alone
//  qualifies" when it means that — it didn't write MenACWY that way.
//  Confirmed by contrast with CDC's post-HCT pneumococcal rule (MMWR RR-9
//  2023), which has NO risk-factor qualifier at all: every HSCT recipient
//  19+ gets it, transplant alone is sufficient. Meningococcal and
//  pneumococcal differ by design; MenACWY is not universal to transplant
//  recipients the way pneumococcal is. IDSA's 2013 "11-18" language is now
//  superseded for this row by ASCO's more current, more specific 2024
//  guidance — the two-sided "band OR high-risk" MenACWY branch below is
//  removed; only the high-risk limb triggers the schedule. MenB is
//  unaffected — ASCO's own text still gives it the unconditional 16-23
//  age path, so `menbTransplantAloneBand` stays as-is.
function hctAdvisory(am, riskIds = []) {
  const menbTransplantAloneBand = am >= MENB_HEALTHY_MIN_AGE_MONTHS && am < MENB_HEALTHY_MAX_AGE_MONTHS; // 16 through 23 years
  // The CDC/ASCO/IDSA sources this advisory cites for a transplant-specific
  // "at any age" carve-out name only asplenia and persistent complement
  // deficiency/complement-inhibitor therapy (see the header comment). C2
  // combo (2026-09-19, HCT + travel): a DIFFERENT risk factor — travel,
  // microbiologist exposure, military, college dorm, an ACWY/B outbreak —
  // also produces its own standing recommendation above, computed by
  // menacwyRiskClass()/hasMenbRisk() from riskFactors.js independently of
  // HCT. That recommendation is real and already on screen; it was
  // previously invisible to this function, so a patient with e.g. HCT +
  // travel was told "select a risk factor above if one applies" — even
  // though travel HAD been selected and WAS the source of the dose shown a
  // few lines above. Distinguish the two: cdcNamedHighRisk keeps the
  // specifically-sourced CDC/ASCO/IDSA text and citation unchanged;
  // otherMenacwyRiskSelected/otherMenbRiskSelected cover everything else
  // that still yields a standing recommendation, with their own (uncited,
  // since no HCT-specific source covers them) text.
  const cdcNamedHighRisk = riskIds.some((id) => id === 'asplenia' || id === 'complement');
  const otherMenacwyRiskSelected = !cdcNamedHighRisk && menacwyRiskClass(riskIds) != null;
  const otherMenbRiskSelected = !cdcNamedHighRisk && hasMenbRisk(riskIds);

  const lines = [];

  // MenACWY — floor is 2 months; no upper age limit on giving it at all.
  if (am >= 2) {
    if (cdcNamedHighRisk) {
      lines.push({
        label: 'MenACWY',
        text: 'Indicated at any age from the high-risk condition selected above (asplenia, or persistent complement deficiency/complement-inhibitor therapy), not the transplant — the standing high-risk MenACWY recommendation above already governs dosing and boosters.',
        refs: ['cdcAlteredImmunocompetence'],
      });
    } else if (otherMenacwyRiskSelected) {
      lines.push({
        label: 'MenACWY',
        text: 'Not specifically sourced as transplant-driven, but the risk factor selected above already indicates MenACWY on its own — that recommendation applies regardless of the transplant, and already governs dosing and boosters.',
        refs: [],
      });
    } else {
      lines.push({
        label: 'MenACWY',
        text: 'Not indicated from the transplant alone. ASCO\'s post-transplant schedule (2 doses, 2 months apart, 6–12 months after transplant) is sourced for recipients with an additional risk factor, not for the transplant by itself — select a risk factor above if one applies. MenACWY has no upper age limit, so it can still be given; centers may still vaccinate more broadly without a specific source.',
        refs: ['ascoAdultCancer2024'],
      });
    }
  }

  // MenB — floor is age 10 (its minimum licensed age); below that, no line
  // at all, regardless of risk factor — the vaccine truly cannot be given yet.
  if (am >= MENB_MIN_AGE_MONTHS) {
    if (menbTransplantAloneBand) {
      lines.push({
        label: 'MenB',
        text: 'Indicated at this age (16 through 23) from the transplant alone. This is the standard 2-dose series shown below, not the 3-dose high-risk one — 3 doses apply only if an additional MenB risk factor (asplenia, complement deficiency, microbiologist exposure, or a serogroup B outbreak) is also selected. No MenB booster is established.',
        refs: ['cdcAlteredImmunocompetence'],
      });
    } else if (cdcNamedHighRisk) {
      lines.push({
        label: 'MenB',
        text: 'Indicated at any age from 10 years from the high-risk condition selected above (asplenia, or persistent complement deficiency/complement-inhibitor therapy), not the transplant — the standing high-risk MenB recommendation above already governs dosing and boosters.',
        refs: ['cdcAlteredImmunocompetence'],
      });
    } else if (otherMenbRiskSelected) {
      lines.push({
        label: 'MenB',
        text: 'Not specifically sourced as transplant-driven, but the risk factor selected above (microbiologist exposure, or a serogroup B outbreak) already indicates MenB on its own — that recommendation applies regardless of the transplant, and already governs dosing and boosters.',
        refs: [],
      });
    } else {
      lines.push({
        label: 'MenB',
        text: 'Not specifically sourced as transplant-driven at this age. If another MenB risk factor applies (asplenia, complement deficiency, microbiologist exposure, or a serogroup B outbreak) — select it for its own rules. Otherwise, centers may still vaccinate more broadly; this app’s standard MenB rules below govern eligibility.',
        refs: ['kambojShah2019MenbHct'],
      });
    }
  }

  if (lines.length === 0) {
    lines.push({
      label: null,
      text: 'This patient is below the minimum age for either meningococcal vaccine (2 months for MenACWY, 10 years for MenB) — no recommendation applies yet.',
      refs: [],
    });
  }

  return {
    title: 'Post-HCT meningococcal vaccination — advisory',
    coordinateFlag: 'Coordinate with the transplant/ID team — your center may use its own post-HCT protocol. Most non-live vaccines, including meningococcal vaccines, are re-initiated no sooner than 6 months after transplant.',
    lines,
  };
}
```
