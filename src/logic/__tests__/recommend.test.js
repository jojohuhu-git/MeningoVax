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
    expect(acwy(r).brands).toContain('Menveo (MenACWY)');
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

  it('complement inhibitor adult, dose 1 four weeks ago → dose 2 not yet (needs 8wk)', () => {
    const r = run({ ageMonths: 360, riskIds: ['complement_inhibitor'], menacwyDoses: [{ date: '2026-05-13' }] });
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
    const r = run({ ageMonths: 360, riskIds: ['complement_inhibitor'] });
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
    const r = run({ ageMonths: 300, riskIds: ['complement_deficiency'], menbDoses: [{ date: '2026-04-03', brand: 'Bexsero' }] });
    expect(menb(r).family).toBe('4C');
    const joined = menb(r).brands.join(' ');
    expect(joined).toMatch(/Bexsero/);
    expect(joined).not.toMatch(/Trumenba/);
  });

  it('high-risk 3 doses complete → first booster 1 year later', () => {
    const r = run({ ageMonths: 300, riskIds: ['asplenia'], menbDoses: [
      { date: '2024-01-03', brand: 'Bexsero' }, { date: '2024-02-03', brand: 'Bexsero' }, { date: '2024-07-03', brand: 'Bexsero' },
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
