// ─────────────────────────────────────────────────────────────────────────
// G5 (2026-09-16): a card must describe the exposure the patient actually
// has.
//
// Travellers and microbiologists share one schedule branch (1 dose, then
// boosters while the exposure continues), and the shared wording named both
// indications to everybody: a microbiologist who has never left the country
// was told his boosters continue "while travel or occupational exposure
// continues", and a Hajj pilgrim was told the same about occupational
// exposure.
//
// L2-3 already fixed the first-booster sentence for microbiologists. The
// booster summary line and the other notes were left behind.
//
// Nothing here changes a date, a dose count, or an interval — only which
// indication the sentence names.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const ADULT = 360; // 30y

function acwyText(riskIds, menacwyDoses = []) {
  const { menacwy } = recommend({ ageMonths: ADULT, riskIds, menacwyDoses, menbDoses: [] });
  return menacwy.map(r => [r.doseLabel, r.boosterSummary, r.note].filter(Boolean).join(' ')).join(' ');
}

describe('G5: exposure wording names the exposure the patient has', () => {
  describe('microbiologist only', () => {
    it('says nothing about travel on the first dose', () => {
      const said = acwyText(['microbiologist']);
      expect(said).toMatch(/occupational/i);
      expect(said).not.toMatch(/travel/i);
    });

    it('says nothing about travel on the booster', () => {
      const said = acwyText(['microbiologist'], [{ date: '2015-01-10', brand: '' }]);
      expect(said).toMatch(/occupational/i);
      expect(said).not.toMatch(/travel/i);
    });

    it('says nothing about travel on a later booster', () => {
      const said = acwyText(['microbiologist'], [
        { date: '2010-01-10', brand: '' },
        { date: '2015-01-10', brand: '' },
      ]);
      expect(said).not.toMatch(/travel/i);
    });
  });

  describe('travel only', () => {
    it('says nothing about occupational exposure on the first dose', () => {
      const said = acwyText(['travel']);
      expect(said).toMatch(/travel/i);
      expect(said).not.toMatch(/occupational|microbiolog/i);
    });

    it('says nothing about occupational exposure on the booster', () => {
      const said = acwyText(['travel'], [{ date: '2015-01-10', brand: '' }]);
      expect(said).toMatch(/travel/i);
      expect(said).not.toMatch(/occupational|microbiolog/i);
    });
  });

  describe('both indications', () => {
    it('names both, because both apply', () => {
      const said = acwyText(['travel', 'microbiologist']);
      expect(said).toMatch(/travel/i);
      expect(said).toMatch(/occupational/i);
    });
  });

  it('changes no dates: the booster is still due on the same day', () => {
    const micro = recommend({ ageMonths: ADULT, riskIds: ['microbiologist'], menacwyDoses: [{ date: '2023-01-10', brand: '' }], menbDoses: [] });
    const travel = recommend({ ageMonths: ADULT, riskIds: ['travel'], menacwyDoses: [{ date: '2023-01-10', brand: '' }], menbDoses: [] });
    // Both are adults, so the under-7 first-booster split does not apply and
    // the two schedules coincide: 5 years after the primary dose.
    expect(micro.menacwy[0].earliestNextDate).toBe('2028-01-10');
    expect(travel.menacwy[0].earliestNextDate).toBe('2028-01-10');
    expect(micro.menacwy[0].dueToday).toBe(false);
  });
});
