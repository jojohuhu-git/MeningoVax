// C2 combo 6 (plan `.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`,
// item C2: "HCT + travel"), 2026-09-19.
//
// Before asserting what the app should say, this combo was checked live
// against ACIP/CDC rather than assumed:
//   - The ACIP 2020 MMWR (rr6909a1.htm), fetched live 2026-09-19, contains no
//     sentence addressing patients with more than one risk-factor indication
//     at once — there is no ACIP-authored "combo rule" to apply here.
//   - The CDC Altered Immunocompetence page (immunocompetence.html), fetched
//     live 2026-09-19, gives the HSCT re-vaccination text ("meningococcal
//     conjugate vaccine ... 11 through 18 years or at high-risk", "serogroup B
//     meningococcal vaccine ... 16 through 23 years or at high-risk") but does
//     NOT enumerate which conditions qualify for "at high-risk" in the HSCT
//     section specifically. This app's own hctAdvisory() header comment
//     (2026-09-13/14) already made the reasonable call that this means
//     asplenia / persistent complement deficiency / complement-inhibitor
//     therapy — the same population CDC's general (non-HSCT) high-risk
//     meningococcal guidance names.
//
// That is a real, narrow claim: CDC's *transplant-timing* carve-out is
// specifically sourced for asplenia/complement. It says nothing about travel,
// microbiologist exposure, military, college dorm, or an outbreak — but those
// risk factors still produce their OWN standing MenACWY/MenB recommendation,
// computed by menacwyRiskClass()/hasMenbRisk() and shown as an ordinary card
// a few lines above the HCT advisory, entirely independent of the transplant.
//
// hctAdvisory() used to conflate the two: its `highRisk` flag was hardcoded to
// `id === 'asplenia' || id === 'complement'` and gated BOTH branches (the
// specifically-sourced CDC text AND the generic fallback). Any other risk
// factor fell through to "select a risk factor above if one applies" — which
// is false when one has, in fact, already been selected and is already
// driving a dose shown on screen. A clinician ticking HCT + travel was told to
// go select something she had already selected.
//
// Fixed by splitting the flag in two: `cdcNamedHighRisk` (asplenia/complement,
// unchanged text+citation) and `otherMenacwyRiskSelected`/`otherMenbRiskSelected`
// (any other risk that independently yields a class, via the same
// menacwyRiskClass()/hasMenbRisk() the rest of the engine already uses — no
// second, hand-typed list of risk ids).
//
// Screen-layer twin: src/components/__tests__/regression-c2-6-hct-other-risk-selected-ui.test.jsx.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-09-19';
const run = (riskIds) => recommend({
  today: TODAY, ageMonths: 300, riskIds, menacwyDoses: [], menbDoses: [],
});
const line = (hct, label) => hct.lines.find((l) => l.label === label);

describe('C2-6 — HCT + a risk factor CDC does not specifically name for post-transplant timing', () => {
  it('HCT + travel: the MenACWY line says the standing indication already applies, not "select a risk factor"', () => {
    const r = run(['hct', 'travel']);
    const acwy = line(r.hct, 'MenACWY');
    expect(acwy.text).not.toMatch(/select a risk factor above if one applies/i);
    expect(acwy.text).toMatch(/already indicates MenACWY on its own/i);
    // And the standing card it refers to is real, not hypothetical.
    expect(r.menacwy[0].status).toBe('exposure');
    expect(r.menacwy[0].dueToday).toBe(true);
  });

  it('HCT + travel: the MenB line is untouched — travel indicates MenACWY only, so no MenB claim is invented', () => {
    const r = run(['hct', 'travel']);
    const menb = line(r.hct, 'MenB');
    expect(menb.text).toMatch(/If another MenB risk factor applies/i);
    expect(menb.text).not.toMatch(/already indicates MenB on its own/i);
  });

  it('HCT + microbiologist: both lines say the standing indication already applies (microbiologist indicates both)', () => {
    const r = run(['hct', 'microbiologist']);
    expect(line(r.hct, 'MenACWY').text).toMatch(/already indicates MenACWY on its own/i);
    expect(line(r.hct, 'MenB').text).toMatch(/already indicates MenB on its own/i);
  });

  it('HCT + a serogroup B outbreak: only the MenB line changes — outbreak_b has no MenACWY indication', () => {
    const r = run(['hct', 'outbreak_b']);
    expect(line(r.hct, 'MenACWY').text).toMatch(/select a risk factor above if one applies/i);
    expect(line(r.hct, 'MenB').text).toMatch(/already indicates MenB on its own/i);
  });

  it('control: HCT with no other risk factor is unchanged', () => {
    const r = run(['hct']);
    expect(line(r.hct, 'MenACWY').text).toMatch(/select a risk factor above if one applies/i);
    expect(line(r.hct, 'MenB').text).toMatch(/If another MenB risk factor applies/i);
  });

  it('control: HCT + asplenia (the already-correct branch) is unchanged, including its citation', () => {
    const r = run(['hct', 'asplenia']);
    const acwy = line(r.hct, 'MenACWY');
    expect(acwy.text).toMatch(/high-risk condition selected above \(asplenia/i);
    expect(acwy.refs).toEqual(['cdcAlteredImmunocompetence']);
    const menb = line(r.hct, 'MenB');
    expect(menb.text).toMatch(/high-risk condition selected above \(asplenia/i);
    expect(menb.refs).toEqual(['cdcAlteredImmunocompetence']);
  });
});
