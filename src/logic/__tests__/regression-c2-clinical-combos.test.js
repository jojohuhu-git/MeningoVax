// C2 — hand-written clinical combinations (plan
// `.claude/prompts/plan-2026-09-19-test-depth-and-drift.md`, item C2). The
// plan names 8 real two-risk-factor patients a clinician would flag. Combo 6
// (HCT + travel) found a genuine bug and shipped separately as its own fix +
// test (regression-c2-6-hct-other-risk-selected*.test.js*, MeningoVax#58).
// This file covers the other 7 — each checked here for real, not assumed:
// does the engine correctly take the UNION of what each risk factor alone
// indicates (the more intensive MenACWY class, MenB if either risk grants
// it), without either risk's own age-plausibility floor leaking onto the
// other, and without losing per-risk citations or caveats.
//
// Verified live before writing any expectation (2026-09-19):
//   - ACIP 2020 MMWR (rr6909a1.htm) — no sentence anywhere addresses a
//     patient with more than one risk-factor indication at once. There is no
//     ACIP-authored combination rule to apply for any of these 7 pairs; the
//     correct answer is the union of each risk's own, individually-sourced
//     indication (already verified per risk-factor in riskFactors.js's own
//     citations — acip2020, acip2020Table7/8/9/10, mm7349a3, etc.).
//   - CDC Altered Immunocompetence page — confirms (in the course of
//     checking combo 6) that HIV reduces MenACWY-D immunogenicity and that
//     most US HIV-associated meningococcal disease is serogroup C/W/Y, but
//     states no MenB indication for HIV — consistent with riskFactors.js's
//     `hiv: { menbClass: undefined }` and combo 3 below.
//
// Screen-layer twin: regression-c2-clinical-combos-ui.test.jsx.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-09-19';
const run = (riskIds, ageMonths = 300) => recommend({
  today: TODAY, ageMonths, riskIds, menacwyDoses: [], menbDoses: [],
});

describe('C2-1 — asplenia + college dorm (a med student in a residence hall)', () => {
  it('takes the more intensive class: asplenia\'s primary-series MenACWY, not college_dorm\'s single dose', () => {
    const r = run(['asplenia', 'college_dorm']);
    expect(r.menacwy[0].status).toBe('risk-based');
    expect(r.menacwy[0].doseLabel).toMatch(/Dose 1 of 2 \(high-risk primary series\)/);
  });
  it('still gets high-risk MenB from asplenia, and both antigens make the pentavalent eligible', () => {
    const r = run(['asplenia', 'college_dorm']);
    expect(r.menb[0].status).toBe('risk-based');
    expect(r.menb[0].doseLabel).toMatch(/Dose 1 of 3 \(high-risk series\)/);
    expect(r.pentavalent.eligible).toBe(true);
  });
  it('at age 8, questions ONLY the college-dorm tick-box — asplenia carries no age floor', () => {
    const r = run(['asplenia', 'college_dorm'], 96);
    expect(r.riskAgeNote.lines).toHaveLength(1);
    expect(r.riskAgeNote.lines[0]).toMatch(/college student/i);
    expect(r.riskAgeNote.lines[0]).not.toMatch(/asplenia/i);
    // The recommendation itself is unaffected by the doubt (owner decision: quiet note, never a block).
    expect(r.menacwy[0].status).toBe('risk-based');
  });
});

describe('C2-2 — complement-inhibitor therapy + international travel', () => {
  it('complement\'s primary-series class wins over travel\'s single+boost', () => {
    const r = run(['complement', 'travel']);
    expect(r.menacwy[0].doseLabel).toMatch(/Dose 1 of 2 \(high-risk primary series\)/);
  });
  it('MenB is still the complement-driven high-risk series (travel grants none)', () => {
    const r = run(['complement', 'travel']);
    expect(r.menb[0].status).toBe('risk-based');
    expect(r.menb[0].doseLabel).toMatch(/Dose 1 of 3 \(high-risk series\)/);
  });
  it('neither risk carries an age floor, so a 6-month-old raises no doubt', () => {
    const r = run(['complement', 'travel'], 6);
    expect(r.riskAgeNote).toBeNull();
  });
});

describe('C2-3 — HIV infection + a serogroup A/C/W/Y outbreak', () => {
  it('MenACWY is due (HIV\'s primary-series class; the outbreak alone would only be a single dose)', () => {
    const r = run(['hiv', 'outbreak_acwy']);
    expect(r.menacwy[0].status).toBe('risk-based');
    expect(r.menacwy[0].doseLabel).toMatch(/Dose 1 of 2 \(high-risk primary series\)/);
  });
  it('MenB is NOT indicated — neither HIV nor an ACWY outbreak is a MenB indication, and no pentavalent is offered', () => {
    const r = run(['hiv', 'outbreak_acwy']);
    expect(r.menb[0].status).toBe('not-indicated');
    expect(r.pentavalent.eligible).toBe(false);
  });
});

describe('C2-4 — asplenia + a serogroup B outbreak', () => {
  it('both risks independently grant high-risk MenB; the recommendation is the ordinary 3-dose series, not doubled', () => {
    const r = run(['asplenia', 'outbreak_b']);
    expect(r.menb).toHaveLength(1);
    expect(r.menb[0].status).toBe('risk-based');
    expect(r.menb[0].doseLabel).toMatch(/Dose 1 of 3 \(high-risk series\)/);
  });
  it('MenACWY still comes from asplenia (outbreak_b grants none) and the pentavalent is offered', () => {
    const r = run(['asplenia', 'outbreak_b']);
    expect(r.menacwy[0].doseLabel).toMatch(/Dose 1 of 2 \(high-risk primary series\)/);
    expect(r.pentavalent.eligible).toBe(true);
  });
});

describe('C2-5 — a pregnant microbiologist occupationally exposed to N. meningitidis', () => {
  it('MenACWY is the ordinary microbiologist exposure dose — pregnancy does not touch it', () => {
    const r = run(['microbiologist', 'pregnancy']);
    expect(r.menacwy[0].status).toBe('exposure');
    expect(r.menacwy[0].doseLabel).toMatch(/1 dose \(ongoing-risk indication\)/);
  });
  it('MenB is offered (microbiologist overrides the pregnancy deferral), and the card says so is a benefit-vs-risk call', () => {
    const r = run(['microbiologist', 'pregnancy']);
    expect(r.menb[0].status).toBe('risk-based');
    expect(r.menb[0].note.detail).toMatch(/only after discussing it with her/i);
    expect(r.menb[0].note.detail).toMatch(/outweighs the potential risk/i);
  });
  it('at a plausible adult age, neither tick-box is questioned (microbiologist floor 10y, pregnancy floor 9y, patient is 25)', () => {
    const r = run(['microbiologist', 'pregnancy']);
    expect(r.riskAgeNote).toBeNull();
  });
});

describe('C2-7 — complement-inhibitor therapy + first-year college dorm resident', () => {
  it('complement\'s primary-series class wins; the college-dorm single dose is subsumed, not added', () => {
    const r = run(['complement', 'college_dorm']);
    expect(r.menacwy).toHaveLength(1);
    expect(r.menacwy[0].doseLabel).toMatch(/Dose 1 of 2 \(high-risk primary series\)/);
  });
  it('at age 8, only college_dorm is questioned — complement has a 2-23mo table row and carries no floor', () => {
    const r = run(['complement', 'college_dorm'], 96);
    expect(r.riskAgeNote.lines).toHaveLength(1);
    expect(r.riskAgeNote.lines[0]).toMatch(/college student/i);
  });
  it('an infant with complement deficiency (and implausibly college_dorm) is tracked for MenB, not denied it outright — MenB\'s 10y licensed-age floor applies regardless of risk', () => {
    const r = run(['complement', 'college_dorm'], 6);
    expect(r.menb[0].status).toBe('not-indicated');
    expect(r.menb[0].doseLabel).toBe('Not yet age-eligible');
    expect(r.menb[0].note.detail).toMatch(/high-risk MenB series/i);
  });
});

describe('C2-8 — a military recruit with asplenia', () => {
  it('asplenia\'s primary-series class wins over military\'s single dose', () => {
    const r = run(['military', 'asplenia']);
    expect(r.menacwy[0].doseLabel).toMatch(/Dose 1 of 2 \(high-risk primary series\)/);
  });
  it('at age 8, only the military tick-box is questioned', () => {
    const r = run(['military', 'asplenia'], 96);
    expect(r.riskAgeNote.lines).toHaveLength(1);
    expect(r.riskAgeNote.lines[0]).toMatch(/military recruit/i);
    expect(r.riskAgeNote.lines[0]).not.toMatch(/asplenia/i);
  });
});
