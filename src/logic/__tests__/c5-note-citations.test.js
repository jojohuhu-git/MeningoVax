// C5 (2026-07-23 handoff): [N] subscript deep-links in `note` text, each
// paired with a `noteCites` entry pointing at the exact ACIP 2020 MMWR
// sentence via a URL text-fragment (#:~:text=<phrase>). Every phrase here
// was verified live in a real browser against
// https://pmc.ncbi.nlm.nih.gov/articles/PMC7527029/ before being wired in —
// these tests only check the app attaches the right anchor to the right
// sentence, not the MMWR content itself.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { cite } from '../../data/refs.js';

const ACIP_ANCHORS = {
  acwyRoutine1112and16: cite(1, 'acwyRoutine1112and16').url,
  menbHealthySCDM1623Box: cite(1, 'menbHealthySCDM1623Box').url,
  menbHealthy2Dose0and6: cite(1, 'menbHealthy2Dose0and6').url,
  boosterBeforeAge7: cite(1, 'boosterBeforeAge7').url,
  boosterAtOrAfterAge7: cite(1, 'boosterAtOrAfterAge7').url,
};

const TODAY = '2026-06-03';
function run(input) {
  return recommend({ today: TODAY, ...input });
}
const acwy = (r) => r.menacwy[0];
const menb = (r) => r.menb[0];

describe('C5 note-citation anchors', () => {
  it('routine MenACWY "not yet due" note cites the 11-12y/16y schedule', () => {
    const r = run({ ageMonths: 96, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = acwy(r);
    expect(rec.note).toContain('[1]');
    expect(rec.noteCites).toHaveLength(1);
    expect(rec.noteCites[0]).toMatchObject({ marker: '[1]', url: ACIP_ANCHORS.acwyRoutine1112and16 });
  });

  it('routine MenACWY dose-1 note cites the 11-12y/16y schedule', () => {
    const r = run({ ageMonths: 132, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = acwy(r);
    expect(rec.note).toContain('[1]');
    expect(rec.noteCites[0]).toMatchObject({ marker: '[1]', url: ACIP_ANCHORS.acwyRoutine1112and16 });
  });

  it('healthy MenB 16-23y dose-1 note cites the shared-decision-making rule and the 0/6mo schedule', () => {
    const r = run({ ageMonths: 192, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = menb(r);
    expect(rec.status).toBe('shared-decision');
    expect(rec.note).toContain('[1]');
    expect(rec.note).toContain('[2]');
    expect(rec.noteCites[0]).toMatchObject({ marker: '[1]', url: ACIP_ANCHORS.menbHealthySCDM1623Box });
    expect(rec.noteCites[1]).toMatchObject({ marker: '[2]', url: ACIP_ANCHORS.menbHealthy2Dose0and6 });
  });

  it('healthy MenB "not yet due" (before 16) note cites the shared-decision-making rule', () => {
    const r = run({ ageMonths: 120, riskIds: [], menacwyDoses: [], menbDoses: [] });
    const rec = menb(r);
    expect(rec.note).toContain('[1]');
    expect(rec.noteCites[0]).toMatchObject({ marker: '[1]', url: ACIP_ANCHORS.menbHealthySCDM1623Box });
  });

  it('high-risk MenACWY dose-1 note cites both age-7 booster-cadence branches', () => {
    const r = run({ ageMonths: 132, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] });
    const rec = acwy(r);
    expect(rec.note).toContain('[1]');
    expect(rec.note).toContain('[2]');
    const urls = rec.noteCites.map((c) => c.url);
    expect(urls).toContain(ACIP_ANCHORS.boosterBeforeAge7);
    expect(urls).toContain(ACIP_ANCHORS.boosterAtOrAfterAge7);
  });

  function addDays(iso, n) {
    const dt = new Date(`${iso}T00:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  function monthsBack(m) { return addDays(TODAY, -Math.round(m * 30.4375)); }

  it('high-risk MenACWY first booster completed before age 7 cites the <7y anchor', () => {
    // D1 at ~4y, D2 at ~5y — both before age 7 → 3-year first-booster cadence.
    const r = run({
      ageMonths: 120, riskIds: ['asplenia'],
      menacwyDoses: [
        { date: monthsBack(72) },
        { date: monthsBack(60) },
      ],
      riskAtDoseAnswers: { MenACWY: { 0: 'yes', 1: 'yes' } },
    });
    const rec = acwy(r);
    expect(rec.doseLabel).toMatch(/first booster/);
    expect(rec.note).toContain('[1]');
    expect(rec.noteCites[0]).toMatchObject({ marker: '[1]', url: ACIP_ANCHORS.boosterBeforeAge7 });
  });

  it('high-risk MenACWY first booster completed at/after age 7 cites the >=7y anchor', () => {
    // D1 at ~20y, D2 at ~21y — both at/after age 7 → 5-year first-booster cadence.
    const r = run({
      ageMonths: 300, riskIds: ['complement'],
      menacwyDoses: [
        { date: monthsBack(60) },
        { date: monthsBack(48) },
      ],
    });
    const rec = acwy(r);
    expect(rec.doseLabel).toMatch(/first booster/);
    expect(rec.note).toContain('[1]');
    expect(rec.noteCites[0]).toMatchObject({ marker: '[1]', url: ACIP_ANCHORS.boosterAtOrAfterAge7 });
  });
});
