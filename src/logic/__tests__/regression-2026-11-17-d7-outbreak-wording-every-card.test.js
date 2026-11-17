// D7 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// every outbreak card — MenACWY and MenB — says the booster depends on the
// outbreak risk continuing, as the teen MenACWY outbreak card already did (B-2:
// "Booster Sep 15, 2028 if outbreak risk continues"). Dates are unchanged.
//
// Source, read live 2026-11-17: immunize.org P2018 (10/19/2026): "give one
// booster dose 3 years after primary series, then every 5 years thereafter, as
// long as risk remains."
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const M = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const yes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));
const run = ({ riskIds, dob, a = [], b = [] }) => recommend({
  dob, today: '2026-11-17', riskIds, menacwyDoses: a, menbDoses: b,
  riskAtDoseAnswers: { MenACWY: yes(a.length), MenB: yes(b.length) },
});
const text = (c) => JSON.stringify([c.doseLabel, c.boosterSummary, c.note]);

describe('D7: MenACWY outbreak cards for young children', () => {
  it('booster after a toddler series: "if outbreak risk continues", date unchanged (Apr 1, 2027)', () => {
    const c = run({ riskIds: ['outbreak_acwy'], dob: '2018-01-01', a: [M('2019-01-01'), M('2019-04-01'), M('2022-04-01')] }).menacwy[0];
    expect(c.earliestNextDate).toBe('2027-04-01');
    expect(c.doseLabel).toBe('Booster (dose 4, every 5 years) if outbreak risk continues');
    expect(c.boosterSummary).toMatch(/while outbreak risk continues/);
  });

  it('first booster after an infant series: the same wording', () => {
    const c = run({ riskIds: ['outbreak_acwy'], dob: '2024-01-01', a: [M('2024-03-01'), M('2024-05-01'), M('2024-07-01'), M('2025-01-15')] }).menacwy[0];
    expect(c.earliestNextDate).toBe('2028-01-15');
    expect(c.doseLabel).toBe('Booster (dose 5, first booster, 3 years after primary) if outbreak risk continues');
  });

  it('infant series in progress: the booster line says "while outbreak risk continues"', () => {
    const c = run({ riskIds: ['outbreak_acwy'], dob: '2026-01-01', a: [M('2026-03-01'), M('2026-05-01')] }).menacwy[0];
    expect(c.boosterSummary).toMatch(/while outbreak risk continues/);
    expect(c.boosterSummary).not.toMatch(/while at risk/);
  });

  it('control: asplenia (lifelong risk) keeps its wording', () => {
    const c = run({ riskIds: ['asplenia', 'outbreak_acwy'], dob: '2018-01-01', a: [M('2019-01-01'), M('2019-04-01'), M('2022-04-01')] }).menacwy[0];
    expect(text(c)).not.toMatch(/outbreak risk continues/);
  });
});

describe('D7: MenB outbreak cards', () => {
  it('booster not yet due: "if outbreak risk continues"', () => {
    const c = run({ riskIds: ['outbreak_b'], dob: '2006-01-01', b: [B('2025-10-01'), B('2026-01-01'), B('2026-08-01')] }).menb[0];
    expect(c.earliestNextDate).toBe('2027-08-01');
    expect(c.doseLabel).toBe('Booster (dose 4, 1 year after primary) if outbreak risk continues');
    expect(c.boosterSummary).toMatch(/while outbreak risk continues/);
  });

  it('booster due today: "for this outbreak"', () => {
    const c = run({ riskIds: ['outbreak_b'], dob: '2006-01-01', b: [B('2024-01-01'), B('2024-03-01'), B('2024-07-01')] }).menb[0];
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toBe('Booster (dose 4, 1 year after primary) for this outbreak');
  });

  it('primary series: the booster line says "while outbreak risk continues"', () => {
    const c = run({ riskIds: ['outbreak_b'], dob: '2006-01-01' }).menb[0];
    expect(c.doseLabel).toMatch(/^Dose 1 of 3/);
    expect(c.boosterSummary).toMatch(/while outbreak risk continues/);
  });

  it('control: asplenia keeps its wording', () => {
    const c = run({ riskIds: ['asplenia', 'outbreak_b'], dob: '2006-01-01', b: [B('2025-10-01'), B('2026-01-01'), B('2026-08-01')] }).menb[0];
    expect(text(c)).not.toMatch(/outbreak risk continues/);
  });
});
