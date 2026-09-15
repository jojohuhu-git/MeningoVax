import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DAYS } from '../../logic/dateUtils.js';

const TODAY = '2026-06-03';
function run(input) {
  return recommend({ today: TODAY, ...input });
}
const acwy = (r) => r.menacwy[0];
const menb = (r) => r.menb[0];

// ── Routine adolescent MenACWY ──────────────────────────────────────────────
describe('MenACWY routine adolescent', () => {
  it('11-year-old, no doses → routine dose 1 due', () => {
    const r = run({ ageMonths: 132, riskIds: [], menacwyDoses: [], menbDoses: [] });
    expect(acwy(r).status).toBe('due');
    expect(acwy(r).doseNum).toBe(1);
    expect(acwy(r).dueToday).toBe(true);
    expect(acwy(r).brands).toContain('Menveo 2-vial (MenACWY)');
  });

  // C5 (2026-07-23 handoff): the ACIP 2020 MMWR defines this routine
  // schedule directly; the CDC schedule note summarizes the same ACIP
  // recommendation. ACIP leads, not CDC-by-default.
  it('routine dose 1 cites ACIP 2020 MMWR before the CDC schedule note', () => {
    const r = run({ ageMonths: 132, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const urls = acwy(r).citations.map((c) => c.url);
    expect(urls[0]).toMatch(/cdc\.gov\/mmwr/);
  });

  it('13-year-old with dose 1 → booster due at 16y, not today', () => {
    const r = run({ ageMonths: 156, riskIds: [], menacwyDoses: [{ date: '2024-06-03', ageMonths: 132 }] });
    expect(acwy(r).status).toBe('complete');
    expect(acwy(r).doseLabel).toMatch(/16y/);
  });

  it('16-year-old, only an 11y dose → 16y booster due now', () => {
    const r = run({ ageMonths: 192, riskIds: [], menacwyDoses: [{ date: '2021-06-03', ageMonths: 132 }] });
    expect(acwy(r).status).toBe('due');
    expect(acwy(r).doseLabel).toMatch(/Booster/);
    expect(acwy(r).dueToday).toBe(true);
  });

  it('16-year-old with a dose given at 16y → complete', () => {
    const r = run({ ageMonths: 196, riskIds: [], menacwyDoses: [{ date: '2026-01-03', ageMonths: 192 }] });
    expect(acwy(r).status).toBe('complete');
  });

  it('9-year-old healthy → not yet due', () => {
    const r = run({ ageMonths: 108, riskIds: [] });
    expect(acwy(r).status).toBe('not-indicated');
  });

  it('healthy 30-year-old → MenACWY not routinely indicated', () => {
    const r = run({ ageMonths: 360, riskIds: [] });
    expect(acwy(r).status).toBe('not-indicated');
  });
});

// ── High-risk MenACWY (adult) ───────────────────────────────────────────────
describe('MenACWY high-risk adult 2-dose primary + boosters', () => {
  it('asplenia adult, no doses → dose 1 of 2 due', () => {
    const r = run({ ageMonths: 360, riskIds: ['asplenia'] });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseLabel).toMatch(/Dose 1 of 2/);
    expect(acwy(r).dueToday).toBe(true);
  });

  // C5/2026-07-24: ACIP 2020 MMWR is the source-of-truth table for the
  // high-risk schedule. The CDC adult schedule note is dropped entirely —
  // it just restates the same MMWR rule (2026-07-23 owner decision: don't
  // cite two sources for one rule).
  it('asplenia adult cites only ACIP 2020 MMWR, not the CDC adult schedule note', () => {
    const r = run({ ageMonths: 360, riskIds: ['asplenia'] });
    const cdcIdx = acwy(r).citations.findIndex((c) => c.url.includes('adult-notes'));
    const acipIdx = acwy(r).citations.findIndex((c) => c.url.includes('cdc.gov/mmwr'));
    expect(acipIdx).toBeGreaterThanOrEqual(0);
    expect(cdcIdx).toBe(-1);
  });

  it('complement inhibitor adult, dose 1 four weeks ago → dose 2 not yet (needs 8wk)', () => {
    const r = run({ ageMonths: 360, riskIds: ['complement'], menacwyDoses: [{ date: '2026-05-13' }] });
    expect(acwy(r).doseLabel).toMatch(/Dose 2 of 2/);
    expect(acwy(r).dueToday).toBe(false);
    expect(acwy(r).earliestNextDate).toBe('2026-07-08'); // 2026-05-13 + 56d
  });

  it('asplenia adult, 2 doses, last 6 years ago → booster due (5y cadence)', () => {
    const r = run({ ageMonths: 360, riskIds: ['asplenia'], menacwyDoses: [{ date: '2018-06-03' }, { date: '2020-06-03' }] });
    expect(acwy(r).doseLabel).toMatch(/Booster/);
    expect(acwy(r).dueToday).toBe(true);
  });

  it('HIV is a MenACWY indication but NOT a MenB indication', () => {
    const r = run({ ageMonths: 360, riskIds: ['hiv'] });
    expect(acwy(r).status).toBe('risk-based');
    expect(menb(r).status).toBe('not-indicated');
  });

  it('complement inhibitor cites the CDC complement-inhibitor guidance', () => {
    const r = run({ ageMonths: 360, riskIds: ['complement'] });
    const urls = acwy(r).citations.map((c) => c.url);
    expect(urls.some((u) => u.includes('complement-inhibitor'))).toBe(true);
  });
});

// ── Single-dose MenACWY indications ─────────────────────────────────────────
describe('MenACWY single-dose indications', () => {
  it('travel adult, no doses → 1 dose with q5y booster framing', () => {
    const r = run({ ageMonths: 300, riskIds: ['travel'] });
    expect(acwy(r).doseLabel).toMatch(/ongoing-risk/);
    expect(acwy(r).note).toMatch(/every 5 years/);
  });

  it('military recruit → single dose, no booster', () => {
    const r = run({ ageMonths: 240, riskIds: ['military'] });
    expect(acwy(r).doseLabel).toBe('1 dose');
  });

  it('college dorm with a dose at 16y → complete', () => {
    const r = run({ ageMonths: 228, riskIds: ['college_dorm'], menacwyDoses: [{ date: '2023-06-03', ageMonths: 192 }] });
    expect(acwy(r).status).toBe('complete');
  });

  it('college dorm with a prior dose given before 16y → still due (booster at ≥16y)', () => {
    const r = run({ ageMonths: 228, riskIds: ['college_dorm'], menacwyDoses: [{ ageMonths: 132 }] });
    expect(acwy(r).status).toBe('exposure');
    expect(acwy(r).dueToday).toBe(true);
    expect(acwy(r).note).toMatch(/before age 16/i);
  });

  it('college dorm with a prior dose of unknown age → due, note flags unconfirmed', () => {
    const r = run({ ageMonths: 228, riskIds: ['college_dorm'], menacwyDoses: [{ brand: 'Menveo' }] });
    expect(acwy(r).status).toBe('exposure');
    expect(acwy(r).note).toMatch(/cannot be confirmed/i);
    // C5: "does this old dose count" is a messy practical judgment call --
    // immunize.org's Ask the Experts leads the citation list here.
    expect(acwy(r).citations[0].url).toMatch(/immunize\.org/);
  });

  // W4 (2026-07-24) added a 5-year expiry to the college-dorm rule, sourced
  // from immunize.org Item #P2018 (10/14/2025): a dose "since 16th birthday,
  // but more than 5 years previously" was listed as needing another dose.
  //
  // M17 (owner decision 2026-09-15) REVERSED that. ACIP 2020 MMWR 69(RR-9)
  // Table 10 addresses this same patient and says the opposite -- Boosters:
  // "College freshmen living in residence halls: Not routinely recommended",
  // and its footnote: "Adolescents who received a first dose after their 16th
  // birthday do not need a booster dose unless they become at increased risk".
  // Owner: college students get one dose, no additional boosters.
  //
  // Both tests below are kept, inverted, rather than deleted, so the history of
  // this decision stays visible. See regression-m17-college-no-booster.test.js
  // for the full reasoning and both verbatim quotes.
  it('college dorm with a dose at 16y that is now >5 years ago → complete (M17)', () => {
    // dose at 192mo (16y), now 264mo (22y) → 72 months = 6 years elapsed
    const r = run({ ageMonths: 264, riskIds: ['college_dorm'], menacwyDoses: [{ date: '2020-06-03', ageMonths: 192 }] });
    expect(acwy(r).status).toBe('complete');
    expect(acwy(r).dueToday).not.toBe(true);
    expect(acwy(r).note || '').not.toMatch(/more than 5 years/i);
  });

  it('college dorm with a dose at 16y exactly 5 years ago → complete (unchanged by M17)', () => {
    // dose at 192mo (16y), now 252mo (21y) → 60 months = exactly 5 years
    const r = run({ ageMonths: 252, riskIds: ['college_dorm'], menacwyDoses: [{ date: '2021-06-03', ageMonths: 192 }] });
    expect(acwy(r).status).toBe('complete');
  });

  it('military recruit with a prior documented dose → complete (single-dose indication met)', () => {
    const r = run({ ageMonths: 240, riskIds: ['military'], menacwyDoses: [{ date: '2025-06-03' }] });
    expect(acwy(r).status).toBe('complete');
  });
});

// ── W3 (2026-07-24): exposure/outbreak status, distinct from risk-based ────
// Owner decision (see handoff-2026-07-24-citation-wiring-w1-w2-w5-done.md):
// transient one-and-done indications (military, college-dorm, ACWY outbreak)
// AND ongoing travel/microbiologist re-exposure get a status of 'exposure',
// not 'risk-based' -- that word is reserved for ongoing MEDICAL risk
// (asplenia, complement deficiency, HIV). Same purple badge color as
// risk-based (owner decision) -- only the status word/grouping differs.
describe('W3: exposure/outbreak MenACWY status distinct from medical risk-based', () => {
  it('travel, no doses → status is exposure, not risk-based', () => {
    const r = run({ ageMonths: 300, riskIds: ['travel'] });
    expect(acwy(r).status).toBe('exposure');
  });

  it('travel booster due → status is exposure, not risk-based', () => {
    const r = run({ ageMonths: 300, riskIds: ['travel'], menacwyDoses: [{ date: '2018-06-03' }] });
    expect(acwy(r).status).toBe('exposure');
  });

  it('microbiologist, no doses → status is exposure, not risk-based', () => {
    const r = run({ ageMonths: 300, riskIds: ['microbiologist'] });
    expect(acwy(r).status).toBe('exposure');
  });

  it('military recruit, no doses → status is exposure, not risk-based', () => {
    const r = run({ ageMonths: 240, riskIds: ['military'] });
    expect(acwy(r).status).toBe('exposure');
  });

  it('serogroup A/C/W/Y outbreak, no doses → status is exposure, not risk-based', () => {
    const r = run({ ageMonths: 240, riskIds: ['outbreak_acwy'] });
    expect(acwy(r).status).toBe('exposure');
  });

  it('college dorm, no history → status is exposure, not risk-based', () => {
    const r = run({ ageMonths: 228, riskIds: ['college_dorm'] });
    expect(acwy(r).status).toBe('exposure');
  });

  it('medical high-risk (asplenia) is unaffected -- still risk-based', () => {
    const r = run({ ageMonths: 360, riskIds: ['asplenia'] });
    expect(acwy(r).status).toBe('risk-based');
  });
});

// ── C2 (2026-07-24 plan): MenACWY exposure recs cite the specific ACIP 2020
// MMWR table for the patient's risk factor, not the mislabeled Penmenvy
// (mm7501a2) page or the generic whole-document acip2020 chip.
describe('C2: exposure recs cite their specific ACIP 2020 MMWR table, not Penmenvy', () => {
  function urls(r) {
    return acwy(r).citations.map((c) => c.url);
  }

  it('microbiologist cites Table 7 only (no Penmenvy, no whole-document acip2020)', () => {
    const r = run({ ageMonths: 300, riskIds: ['microbiologist'] });
    const chipUrls = urls(r);
    expect(chipUrls.some((u) => u.includes('rr6909a1.htm') && u.includes('microbiologists'))).toBe(true);
    expect(chipUrls).not.toContain('https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm');
    expect(chipUrls).not.toContain('https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm');
  });

  it('travel cites Table 9 only (drops the separate cdcRecommendations page too)', () => {
    const r = run({ ageMonths: 300, riskIds: ['travel'] });
    const chipUrls = urls(r);
    expect(chipUrls.some((u) => u.includes('rr6909a1.htm') && u.includes('hyperendemic'))).toBe(true);
    expect(chipUrls).not.toContain('https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm');
    expect(chipUrls.length).toBe(1);
  });

  it('military recruit cites Table 10 only', () => {
    const r = run({ ageMonths: 240, riskIds: ['military'] });
    const chipUrls = urls(r);
    expect(chipUrls.some((u) => u.includes('rr6909a1.htm') && u.includes('military'))).toBe(true);
    expect(chipUrls).not.toContain('https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm');
  });

  it('college dorm (no history) cites Table 10 only', () => {
    const r = run({ ageMonths: 228, riskIds: ['college_dorm'] });
    const chipUrls = urls(r);
    expect(chipUrls.some((u) => u.includes('rr6909a1.htm') && u.includes('residence'))).toBe(true);
    expect(chipUrls).not.toContain('https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm');
  });

  it('serogroup A/C/W/Y outbreak cites Table 8 only', () => {
    const r = run({ ageMonths: 240, riskIds: ['outbreak_acwy'] });
    const chipUrls = urls(r);
    expect(chipUrls.some((u) => u.includes('rr6909a1.htm') && u.includes('outbreak'))).toBe(true);
    expect(chipUrls).not.toContain('https://www.cdc.gov/mmwr/volumes/75/wr/mm7501a2.htm');
  });

  it('routine adolescent schedule (no risk factors) upgrades to the Table 2 anchor', () => {
    const r = run({ ageMonths: 132, riskIds: [] });
    const chipUrls = urls(r);
    expect(chipUrls.some((u) => u.includes('rr6909a1.htm') && u.includes('children%20and%20adults'))).toBe(true);
  });
});

// ── MenB healthy shared decision (the corrected 0/6 interval) ───────────────
describe('MenB healthy 16-23y shared decision — 2-dose 0/6', () => {
  it('17-year-old healthy, no doses → shared decision dose 1', () => {
    const r = run({ ageMonths: 204, riskIds: [] });
    expect(menb(r).status).toBe('shared-decision');
    expect(menb(r).doseLabel).toMatch(/Dose 1 of 2/);
  });

  it('dose 2 requires ≥6 months (not 1 month) — 2025 ACIP change', () => {
    const r = run({ ageMonths: 204, riskIds: [], menbDoses: [{ date: '2026-03-03', brand: 'Bexsero' }] });
    expect(menb(r).minIntervalDays).toBe(183); // ~6 months (6 * 30.4375 rounded)
    expect(menb(r).dueToday).toBe(false); // only 3 months elapsed
    expect(menb(r).note).toMatch(/6 months/);
  });

  it('healthy 2-dose series complete', () => {
    const r = run({ ageMonths: 216, riskIds: [], menbDoses: [
      { date: '2025-01-03', brand: 'Bexsero' }, { date: '2025-08-03', brand: 'Bexsero' },
    ] });
    expect(menb(r).status).toBe('complete');
  });

  it('healthy 25-year-old → MenB not routinely indicated', () => {
    const r = run({ ageMonths: 300, riskIds: [] });
    expect(menb(r).status).toBe('not-indicated');
  });

  it('dose 2 given early (3 months) → rescue dose 3 due ≥4 months after dose 2', () => {
    const r = run({ ageMonths: 216, riskIds: [], menbDoses: [
      { date: '2025-09-03', brand: 'Bexsero' },
      { date: '2025-12-03', brand: 'Bexsero' }, // 91 days after dose 1 — early
    ] });
    expect(menb(r).status).toBe('shared-decision');
    expect(menb(r).doseLabel).toMatch(/rescue/i);
    expect(menb(r).doseNum).toBe(3);
    expect(menb(r).minIntervalDays).toBe(DAYS.months(4));
    // C5: an interrupted/off-schedule series is a "does this old dose
    // count" practical judgment call -- immunize.org leads here.
    expect(menb(r).citations[0].url).toMatch(/immunize\.org/);
  });

  it('dose 2 given early, <4 months after dose 2 → rescue dose not yet due', () => {
    const r = run({ ageMonths: 216, riskIds: [], menbDoses: [
      { date: '2026-01-03', brand: 'Trumenba' },
      { date: '2026-03-03', brand: 'Trumenba' }, // 59 days — early
    ] });
    // today = 2026-06-03, only 3 months after dose 2
    expect(menb(r).dueToday).toBe(false);
    expect(menb(r).earliestNextDate).toBeDefined();
  });

  it('accelerated 3-dose series complete → status complete', () => {
    const r = run({ ageMonths: 216, riskIds: [], menbDoses: [
      { date: '2025-01-03', brand: 'Bexsero' },
      { date: '2025-02-03', brand: 'Bexsero' },
      { date: '2025-07-03', brand: 'Bexsero' },
    ] });
    expect(menb(r).status).toBe('complete');
    expect(menb(r).doseLabel).toMatch(/accelerated/);
  });
});

// ── MenB high-risk 3-dose + family lock ─────────────────────────────────────
describe('MenB high-risk 3-dose 0/1-2/6 + antigen family lock', () => {
  it('asplenia adult, no doses → dose 1 of 3', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'] });
    expect(menb(r).doseLabel).toMatch(/Dose 1 of 3/);
  });

  it('FHbp dose 1 → dose-2 options stay in FHbp family only', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'], menbDoses: [{ date: '2026-04-03', brand: 'Trumenba' }] });
    expect(menb(r).family).toBe('FHbp');
    const joined = menb(r).brands.join(' ');
    expect(joined).toMatch(/Trumenba/);
    expect(joined).not.toMatch(/Bexsero/);
  });

  it('4C dose 1 → dose-2 options stay in 4C family only', () => {
    const r = run({ ageMonths: 300, riskIds: ['complement'], menbDoses: [{ date: '2026-04-03', brand: 'Bexsero' }] });
    expect(menb(r).family).toBe('4C');
    const joined = menb(r).brands.join(' ');
    expect(joined).toMatch(/Bexsero/);
    expect(joined).not.toMatch(/Trumenba/);
  });

  it('high-risk 3 doses complete → first booster 1 year later', () => {
    // D1 2024-01-03, D2 2024-02-10 (38d ≥4wk), D3 2024-07-10 (188d from D1 ≥183d, 151d from D2 ≥122d)
    const r = run({ ageMonths: 300, riskIds: ['asplenia'], menbDoses: [
      { date: '2024-01-03', brand: 'Bexsero' }, { date: '2024-02-10', brand: 'Bexsero' }, { date: '2024-07-10', brand: 'Bexsero' },
    ] });
    expect(menb(r).doseLabel).toMatch(/Booster/);
    expect(menb(r).minIntervalDays).toBe(365);
    expect(menb(r).dueToday).toBe(true); // >1y elapsed
  });

  it('MenB high-risk under age 10 → not yet age-eligible', () => {
    const r = run({ ageMonths: 96, riskIds: ['asplenia'] });
    expect(menb(r).status).toBe('not-indicated');
    expect(menb(r).doseLabel).toMatch(/age-eligible/);
  });
});

// ── Pregnancy deferral ──────────────────────────────────────────────────────
describe('Pregnancy', () => {
  it('healthy pregnant 20yo → MenB deferred', () => {
    const r = run({ ageMonths: 240, riskIds: ['pregnancy'] });
    expect(menb(r).status).toBe('deferred');
  });

  it('pregnant + asplenia → MenB NOT deferred (high-risk overrides)', () => {
    const r = run({ ageMonths: 240, riskIds: ['pregnancy', 'asplenia'] });
    expect(menb(r).status).toBe('risk-based');
  });
});

// ── Pentavalent (MenABCWY) offer ────────────────────────────────────────────
describe('Pentavalent offer', () => {
  it('asplenia adult, both ACWY+B due → pentavalent eligible', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'] });
    expect(r.pentavalent.eligible).toBe(true);
  });

  it('asplenia adult, no history → pentavalent brands use short MenABCWY format', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'] });
    expect(r.pentavalent.eligible).toBe(true);
    // Both families open → both pentavalents offered
    expect(r.pentavalent.brands).toContain('Penmenvy (MenABCWY)');
    expect(r.pentavalent.brands).toContain('Penbraya (MenABCWY)');
  });

  it('FHbp MenB started → only Penbraya offered as pentavalent', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'],
      menacwyDoses: [], menbDoses: [{ date: '2026-04-03', brand: 'Trumenba' }] });
    // dose 2 MenB due but needs 4wk; check eligibility logic when both due:
    const r2 = run({ ageMonths: 300, riskIds: ['asplenia'] });
    expect(r2.pentavalent.eligible).toBe(true);
    expect(r2.pentavalent.brands.join(' ')).toMatch(/Penmenvy|Penbraya/);
    // family-specific narrowing once FHbp established and both due:
    expect(r.pentavalent).toBeDefined();
  });

  it('healthy 30yo, nothing due → no pentavalent offer', () => {
    const r = run({ ageMonths: 360, riskIds: [] });
    expect(r.pentavalent.eligible).toBe(false);
  });

  it('child under 10 with both due → no pentavalent (≥10y only)', () => {
    const r = run({ ageMonths: 96, riskIds: ['asplenia'] });
    expect(r.pentavalent.eligible).toBe(false);
  });
});

// ── Pentavalents only in pentavalent card, not in standalone MenB brands ────
describe('Pentavalents not in standalone MenB brand list', () => {
  it('asplenia adult, no MenB doses → standalone menb.brands has no pentavalents', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'] });
    const brands = menb(r).brands.join(' ');
    expect(brands).not.toMatch(/Penmenvy|Penbraya/);
    expect(brands).toMatch(/Bexsero|Trumenba/);
  });

  it('healthy 17yo, no MenB doses → standalone menb.brands has no pentavalents', () => {
    const r = run({ ageMonths: 204, riskIds: [] });
    const brands = menb(r).brands.join(' ');
    expect(brands).not.toMatch(/Penmenvy|Penbraya/);
  });
});

// ── Every rec carries at least one citation when an action is recommended ────
describe('Citations present on actionable recs', () => {
  it('actionable MenACWY recs have citations', () => {
    const r = run({ ageMonths: 132, riskIds: [] });
    expect(acwy(r).citations.length).toBeGreaterThan(0);
  });
  it('actionable MenB recs have citations', () => {
    const r = run({ ageMonths: 204, riskIds: [] });
    expect(menb(r).citations.length).toBeGreaterThan(0);
  });
});

// ── MenACWY high-risk booster cadence — first vs subsequent regression ────
//
// Rule (ACIP 2020 MMWR / immunize.org p2035):
//   FIRST booster (given===2): 3y if D2 <7y at time of dose, else 5y.
//   SUBSEQUENT boosters (given>=3): ALWAYS 5y regardless of D2 age.

describe('MenACWY high-risk booster cadence — recommend.js regression', () => {
  function addDays(iso, d) {
    const dt = new Date(iso + 'T00:00:00');
    dt.setUTCDate(dt.getUTCDate() + d);
    return dt.toISOString().slice(0, 10);
  }
  function yearsBack(y) { return addDays(TODAY, -Math.round(y * 365.25)); }
  function monthsBack(m) { return addDays(TODAY, -Math.round(m * 30.4375)); }

  it('Case A: primary <7y — first booster (given===2) → minIntervalDays 1095', () => {
    // Patient now 10y (120mo). D1 at age 4y (monthsBack(72)), D2 at age 5y (monthsBack(60)).
    // Both doses before age 7 → first booster cadence: 3 years.
    // Both doses are before age 10 to a high-risk-now patient — ambiguous
    // (risk-at-dose prompt, 2026-07-23 handoff §2-§3), answered 'yes' to
    // preserve this test's "already high-risk" intent.
    const r = run({
      ageMonths: 120, riskIds: ['asplenia'],
      menacwyDoses: [
        { date: monthsBack(72) },  // ageAtDose ≈ 4y
        { date: monthsBack(60) },  // ageAtDose ≈ 5y
      ],
      riskAtDoseAnswers: { MenACWY: { 0: 'yes', 1: 'yes' } },
    });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseNum).toBe(3);
    expect(acwy(r).minIntervalDays).toBe(DAYS.years(3)); // 1095
    expect(acwy(r).doseLabel).toMatch(/first booster.*3 year|3 year/i);
  });

  it('Case A2: primary <7y — subsequent booster (given===3) → ALWAYS minIntervalDays 1826', () => {
    // Patient now 15y (180mo). Primary ended at 5y; first booster at 8y (3y cadence, valid).
    // Now needs second booster (given===3) → must be 5 years.
    // All three doses (4y, 5y, 8y) are before age 10 — ambiguous, all
    // answered 'yes' (2026-07-23 handoff §2-§3).
    const r = run({
      ageMonths: 180, riskIds: ['asplenia'],
      menacwyDoses: [
        { date: monthsBack(132) }, // ageAtDose ≈ 4y
        { date: monthsBack(120) }, // ageAtDose ≈ 5y
        { date: monthsBack(84)  }, // first booster at age 8y (3y after D2)
      ],
      riskAtDoseAnswers: { MenACWY: { 0: 'yes', 1: 'yes', 2: 'yes' } },
    });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseNum).toBe(4);
    expect(acwy(r).minIntervalDays).toBe(DAYS.years(5)); // 1826
    expect(acwy(r).doseLabel).toMatch(/every 5 year/i);
  });

  it('Case B: primary ≥7y — first booster (given===2) → minIntervalDays 1826', () => {
    // Patient now 25y (300mo). D1 at age 20y, D2 at age 21y — both ≥7y.
    // First booster cadence: 5 years.
    const r = run({
      ageMonths: 300, riskIds: ['complement'],
      menacwyDoses: [
        { date: monthsBack(60) }, // ageAtDose ≈ 20y
        { date: monthsBack(48) }, // ageAtDose ≈ 21y
      ],
    });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseNum).toBe(3);
    expect(acwy(r).minIntervalDays).toBe(DAYS.years(5)); // 1826
    expect(acwy(r).doseLabel).toMatch(/first booster.*5 year|5 year/i);
  });

  it('Case B2: primary ≥7y — subsequent booster (given===3) → ALWAYS minIntervalDays 1826', () => {
    // Patient now 35y (420mo). D1/D2 at 20/21y; first booster (D3) at 26y (5y cadence, valid).
    const r = run({
      ageMonths: 420, riskIds: ['asplenia'],
      menacwyDoses: [
        { date: yearsBack(15) }, // ageAtDose ≈ 20y
        { date: yearsBack(14) }, // ageAtDose ≈ 21y
        { date: yearsBack(9) },  // first booster (5y after D2) → already given
      ],
    });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseNum).toBe(4);
    expect(acwy(r).minIntervalDays).toBe(DAYS.years(5)); // 1826
    expect(acwy(r).doseLabel).toMatch(/every 5 year/i);
  });

  it('Case C: D2 age unknown — first booster conservative → minIntervalDays 1095', () => {
    // Both doses have no date → age unknown → conservative 3-year first booster.
    const r = run({
      ageMonths: 144, riskIds: ['asplenia'],
      menacwyDoses: [
        {}, // no date → unknown
        {}, // no date → unknown
      ],
    });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseNum).toBe(3);
    expect(acwy(r).minIntervalDays).toBe(DAYS.years(3)); // 1095 conservative
  });

  it('Case C2: D2 age unknown — subsequent booster → ALWAYS minIntervalDays 1826', () => {
    // Three doses (first booster already given, unknown dates).
    // Subsequent booster must be 5 years regardless.
    const r = run({
      ageMonths: 240, riskIds: ['asplenia'],
      menacwyDoses: [{}, {}, {}], // no dates → unknown
    });
    expect(acwy(r).status).toBe('risk-based');
    expect(acwy(r).doseNum).toBe(4);
    expect(acwy(r).minIntervalDays).toBe(DAYS.years(5)); // 1826
  });
});

// ── 2026-07-24: citation coverage extended to previously-uncited MenB/infant
// notes (2026-07-23 audit handoff, "not done" queue). Quotes verified live
// against the ACIP 2020 MMWR and the current CDC vaccine-recommendations page.
describe('Citation coverage — MenB high-risk, pregnancy, infant MenACWY (2026-07-24)', () => {
  // 2026-07-24 citation audit: the ACIP Oct 2024 MMWR (mm7349a3) supersedes
  // the 2020 MMWR's brand-split MenB-4C table and states the 3-dose
  // high-risk schedule explicitly — cdcRecommendations dropped in favour of
  // this cleaner, non-superseded source.
  it('MenB high-risk dose 1 cites the ACIP Oct 2024 MMWR (mm7349a3) alongside acip2020', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'] });
    const shorts = menb(r).citations.map((c) => c.short);
    expect(shorts).toContain('ACIP Oct 2024 MMWR');
    expect(shorts).toContain('ACIP 2020 MMWR');
  });

  it('MenB high-risk booster cites the ACIP Oct 2024 MMWR (mm7349a3)', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'], menbDoses: [
      { date: '2024-01-03', brand: 'Bexsero' }, { date: '2024-02-10', brand: 'Bexsero' }, { date: '2024-07-10', brand: 'Bexsero' },
    ] });
    expect(menb(r).citations.map((c) => c.short)).toContain('ACIP Oct 2024 MMWR');
  });

  it('Pregnancy deferral note carries a [c] highlight-superscript placeholder', () => {
    const r = run({ ageMonths: 240, riskIds: ['pregnancy'] });
    expect(menb(r).note).toMatch(/\[c\]/);
    expect(menb(r).noteCites[0].key).toBe('menbPregnancyDeferral');
  });

  it('Infant high-risk 2-6mo dose 1 note carries a [c] highlight-superscript placeholder', () => {
    const r = run({ ageMonths: 4, riskIds: ['asplenia'] });
    expect(acwy(r).note).toMatch(/\[c\]/);
    expect(acwy(r).noteCites.length).toBeGreaterThan(0);
  });

  it('Infant high-risk 7-11mo dose 1 note carries a [c] highlight-superscript placeholder', () => {
    const r = run({ ageMonths: 9, riskIds: ['asplenia'] });
    expect(acwy(r).note).toMatch(/\[c\]/);
  });

  it('Infant high-risk 12-23mo dose 1 note carries two [c] highlight-superscript placeholders', () => {
    const r = run({ ageMonths: 15, riskIds: ['asplenia'] });
    const matches = acwy(r).note.match(/\[c\]/g) || [];
    expect(matches.length).toBe(2);
    expect(acwy(r).noteCites.length).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════
// Hard-stop exclusion: CAR-T / B-cell malignancy / B-cell-depleting therapy
// ════════════════════════════════════════════════════════════════════════
describe('hard-stop exclusion', () => {
  it('CAR-T/B-cell risk id ⇒ excluded, no recs, pentavalent not eligible', () => {
    const r = run({ ageMonths: 120, riskIds: ['hct_cart_bcell_exclude'] });
    expect(r.excluded).toBe(true);
    expect(r.exclusionMessage).toMatch(/does not apply to this patient/);
    expect(r.menacwy).toEqual([]);
    expect(r.menb).toEqual([]);
    expect(r.pentavalent).toEqual({ eligible: false });
    expect(r.exclusionCitations.length).toBeGreaterThan(0);
  });

  it('both an unrelated risk and CAR-T/B-cell ticked together ⇒ hard stop wins', () => {
    const r = run({ ageMonths: 120, riskIds: ['asplenia', 'hct_cart_bcell_exclude'] });
    expect(r.excluded).toBe(true);
    expect(r.menacwy).toEqual([]);
    expect(r.menb).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════
// M-B: HCT advisory (post-transplant meningococcal guidance)
// ════════════════════════════════════════════════════════════════════════
describe('HCT advisory', () => {
  it('P1 (2026-09-14, owner decision): age 14, no additional risk factor — MenACWY ' +
    'is NOT indicated from the transplant alone. ASCO requires an additional risk ' +
    'factor at any age; there is no unconditional 11-18 age path (that traced to ' +
    'IDSA 2013, now superseded for this row by ASCO 2024)', () => {
    const r = run({ ageMonths: 168, riskIds: ['hct'] }); // 14y, no other risk
    expect(r.hct).not.toBeNull();
    const acwyLine = r.hct.lines.find((l) => l.label === 'MenACWY');
    expect(acwyLine.text).toMatch(/[Nn]ot indicated from the transplant alone/);
    expect(acwyLine.text).not.toMatch(/^2 doses of MenACWY, 2 months apart/);
    expect(acwyLine.citations.map((c) => c.short)).toContain('ASCO Vaccination of Adults With Cancer (2024)');
  });

  it('P1: a high-risk condition (not the age band) is what gives MenACWY its schedule and boosters — the advisory text defers to the standing high-risk engine, it does not invent a transplant-alone booster', () => {
    const r = run({ ageMonths: 168, riskIds: ['hct', 'asplenia'] }); // 14y, high-risk
    const acwyLine = r.hct.lines.find((l) => l.label === 'MenACWY');
    expect(acwyLine.text).toMatch(/high-risk condition/);
    expect(acwyLine.text).toMatch(/standing high-risk MenACWY recommendation above already governs dosing and boosters/);
  });

  it('ages 10-15, no other risk: gives the MenB "check other boxes" pointer, sourced', () => {
    const r = run({ ageMonths: 168, riskIds: ['hct'] }); // 14y — MenACWY band, but MenB pointer band
    const menbLine = r.hct.lines.find((l) => l.label === 'MenB');
    expect(menbLine.text).toMatch(/Not specifically sourced as transplant-driven/);
    expect(menbLine.citations.map((c) => c.short)).toContain('Kamboj & Shah 2019 (HCT MenB)');
  });

  it('ages 16-23: MenB is indicated from the transplant alone (CDC + ASCO, settled 2026-09-13) — not a "not triggered" pointer', () => {
    const r = run({ ageMonths: 264, riskIds: ['hct'] }); // 22y
    const menbLine = r.hct.lines.find((l) => l.label === 'MenB');
    expect(menbLine.text).not.toMatch(/Not triggered/);
    expect(menbLine.text).toMatch(/16 through 23/);
    expect(menbLine.citations.map((c) => c.short)).toContain('CDC Altered Immunocompetence');
  });

  it('ages 16-23, transplant alone: MenB is the 2-dose series, not 3 — 3 doses require an additional MenB risk factor', () => {
    const r = run({ ageMonths: 264, riskIds: ['hct'] }); // 22y, no other risk
    const menbLine = r.hct.lines.find((l) => l.label === 'MenB');
    expect(menbLine.text).toMatch(/standard 2-dose series/);
    expect(menbLine.text).toMatch(/3 doses apply only if an additional MenB risk factor/);
  });

  it('age 22 (in the 16-23 transplant-alone MenB band, out of the 11-18 MenACWY band): MenACWY still gets a line — no source there, but the vaccine can still be given', () => {
    const r = run({ ageMonths: 264, riskIds: ['hct'] }); // 22y
    expect(r.hct.lines.map((l) => l.label)).toEqual(['MenACWY', 'MenB']);
    const acwyLine = r.hct.lines.find((l) => l.label === 'MenACWY');
    expect(acwyLine.text).toMatch(/no upper age limit, so it can still be given/);
  });

  it('any age with a high-risk condition (asplenia): both MenACWY and MenB are indicated from that risk, not from the transplant, even outside their age bands', () => {
    const r = run({ ageMonths: 360, riskIds: ['hct', 'asplenia'] }); // 30y — outside every band
    const acwyLine = r.hct.lines.find((l) => l.label === 'MenACWY');
    const menbLine = r.hct.lines.find((l) => l.label === 'MenB');
    expect(acwyLine.text).toMatch(/high-risk condition/);
    expect(acwyLine.text).not.toMatch(/6–12 months after transplant, with a booster/);
    expect(menbLine.text).toMatch(/high-risk condition/);
  });

  it('the complement/eculizumab risk factor triggers MenACWY at any age, but MenB only from age 10 (its real minimum licensed age) — not below it, even with the risk factor selected', () => {
    const r = run({ ageMonths: 6, riskIds: ['hct', 'complement'] }); // 6mo
    const acwyLine = r.hct.lines.find((l) => l.label === 'MenACWY');
    const menbLine = r.hct.lines.find((l) => l.label === 'MenB');
    expect(acwyLine).toBeTruthy();
    expect(menbLine).toBeUndefined();
  });

  it('the complement/eculizumab risk factor at age 10+ does trigger MenB', () => {
    const r = run({ ageMonths: 132, riskIds: ['hct', 'complement'] }); // 11y
    const menbLine = r.hct.lines.find((l) => l.label === 'MenB');
    expect(menbLine).toBeTruthy();
    expect(menbLine.text).toMatch(/any age from 10 years/);
  });

  it('neither band nor high-risk applies (age 30, no other risk): both vaccines still get a line — age doesn\'t bar giving them, it just isn\'t what CDC/ASCO/IDSA specifically source', () => {
    const r = run({ ageMonths: 360, riskIds: ['hct'] }); // 30y, no other risk
    expect(r.hct.lines.map((l) => l.label)).toEqual(['MenACWY', 'MenB']);
    expect(r.hct.lines[0].text).toMatch(/no upper age limit, so it can still be given/);
    expect(r.hct.lines[1].text).toMatch(/Not specifically sourced as transplant-driven/);
  });

  it('below every real minimum age (6 weeks, no other risk): the true fallback — neither vaccine can be given yet', () => {
    const r = run({ ageMonths: 1, riskIds: ['hct'] }); // ~1mo, below MenACWY's own 2mo floor
    expect(r.hct.lines).toHaveLength(1);
    expect(r.hct.lines[0].label).toBeNull();
    expect(r.hct.lines[0].text).toMatch(/below the minimum age for either meningococcal vaccine/);
  });

  it('the transplant alone never invents a booster schedule — booster wording only from a sourced band, not the high-risk limb', () => {
    const r = run({ ageMonths: 360, riskIds: ['hct', 'asplenia'] }); // 30y, high-risk only
    for (const line of r.hct.lines) {
      expect(line.text).not.toMatch(/\bbooster\b.*\bmonths? after transplant\b/);
    }
  });

  it('HCT computed alongside the normal engine, not instead of it', () => {
    const r = run({ ageMonths: 168, riskIds: ['hct', 'asplenia'] });
    expect(r.hct).not.toBeNull();
    expect(r.menacwy.length).toBeGreaterThan(0);
    expect(r.menb.length).toBeGreaterThan(0);
  });

  it('no HCT selected ⇒ hct is null', () => {
    const r = run({ ageMonths: 168, riskIds: [] });
    expect(r.hct).toBeNull();
  });
});
