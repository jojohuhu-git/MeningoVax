// D8 (owner, 2026-11-17; docs/archive/decisions-2026-11-17-open-questions.md):
// after one dose of each MenB product, the card keeps finishing with the first
// product and adds one line: the date to finish with the other product instead,
// and that the first product's dose then does not count. (E2's unbuilt option.)
//
// Source, read live 2026-11-17, ACIP 2020 rr6909a1: "If 2 doses were
// administered using different MenB products, one product should be selected
// for administration of an additional dose at an appropriate interval to ensure
// valid completion of a MenB series; the dose from the product not selected for
// series completion should be considered invalid"
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ menacwyDoses: [], riskIds: [], ...input });
const noteText = (c) => JSON.stringify(c.note);

describe('D8: one line offers finishing with the other MenB product', () => {
  it('healthy 17 y, Bexsero then Trumenba: Bexsero dose 2 from Sep 1; or Trumenba dose 2 due Nov 1', () => {
    const c = run({
      dob: '2009-01-01', today: '2026-06-01',
      menbDoses: [{ date: '2026-03-01', brand: 'Bexsero (MenB)' }, { date: '2026-05-01', brand: 'Trumenba (MenB)' }],
    }).menb[0];
    expect(c.earliestNextDate).toBe('2026-09-01');
    // F2b (owner, 2026-11-18): the line says "due <date>", not "from".
    expect(noteText(c)).toContain('Or complete the series with Trumenba: dose 2 due Nov 1, 2026, and the Bexsero dose no longer counts');
  });

  it('high-risk 20 y, Trumenba then Bexsero: the Bexsero alternative uses the high-risk schedule', () => {
    const c = run({
      dob: '2006-01-01', today: '2026-06-01', riskIds: ['asplenia'],
      menbDoses: [{ date: '2026-03-01', brand: 'Trumenba (MenB)' }, { date: '2026-05-01', brand: 'Bexsero (MenB)' }],
    }).menb[0];
    expect(noteText(c)).toMatch(/Or complete the series with Bexsero: dose 2 (today|due [A-Z][a-z]{2} \d{1,2}, 2026), and the Trumenba dose no longer counts/);
  });

  it('control: two doses of the same product — no such line', () => {
    const c = run({
      dob: '2009-01-01', today: '2026-06-01',
      menbDoses: [{ date: '2026-03-01', brand: 'Bexsero (MenB)' }, { date: '2026-05-01', brand: 'Bexsero (MenB)' }],
    }).menb[0];
    expect(noteText(c)).not.toMatch(/Or complete the series with/);
  });
});
