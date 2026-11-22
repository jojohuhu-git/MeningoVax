// ─────────────────────────────────────────────────────────────────────────
// MQ6-j (owner, 2026-11-21, "Both brands"): a high-risk, travel or outbreak
// baby of 6 weeks to under 2 months with no MenACWY yet gets the card "Dose 1
// of 4", next dose due at 2 months. That card listed MenQuadfi only, while the
// same baby's card on the 2-month day lists Menveo 2-vial and MenQuadfi. The
// dose is advised at 2 months, when both are fine, so the card lists both.
//
// AAP 2026 catch-up table (owner's copy, read 2026-11-21), Meningococcal ACWY,
// minimum age for dose 1: "2 months MenACWY-CRM, 6 weeks MenACWY-TT".
// The brand list is MENACWY_INFANT_SERIES_BRANDS (src/data/brands.js), the same
// list the 2-month card uses.
//
// MQ6-i (same day, "Keep folded"): "MenQuadfi may be given from 6 weeks" stays
// behind "Why this"; the note is unchanged. MQ6-k ("Keep as is"): an age typed
// without a date of birth still gets no 6-week card.
//
// Screen twin: src/components/__tests__/menquadfi-6-week-floor-ui.test.jsx.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { MENACWY_INFANT_SERIES_BRANDS } from '../../data/brands.js';

const DOB = '2026-10-03';
const card = (today, riskIds = ['asplenia'], extra = {}) => recommend({
  today, dob: DOB, riskIds, menacwyDoses: [], menbDoses: [], ...extra,
}).menacwy[0];

describe('no MenACWY yet, seen before 2 months: both brands, as at 2 months', () => {
  for (const risk of ['asplenia', 'travel', 'outbreak_acwy']) {
    it(`${risk}, 7 weeks (Nov 21, 2026): Menveo 2-vial and MenQuadfi`, () => {
      const c = card('2026-11-21', [risk]);
      expect(c.brands).toEqual(['Menveo 2-vial (MenACWY)', 'MenQuadfi (MenACWY)']);
      expect(c.brands).toEqual(card('2026-12-03', [risk]).brands); // the 2-month card
    });
  }

  it('first day of the card (6 weeks, Nov 14) and the day before 2 months (Dec 2)', () => {
    expect(card('2026-11-14').brands).toEqual(MENACWY_INFANT_SERIES_BRANDS);
    expect(card('2026-12-02').brands).toEqual(MENACWY_INFANT_SERIES_BRANDS);
  });
});

describe('unchanged (controls)', () => {
  it('the rest of the card: Dose 1 of 4, due Dec 3, not due today', () => {
    const c = card('2026-11-21');
    expect(c.doseLabel).toBe('Dose 1 of 4 (infant high-risk)');
    expect(c.earliestNextDate).toBe('2026-12-03');
    expect(c.dueToday).toBe(false);
  });

  it('MQ6-i: the 6-week sentence is still there, behind "Why this"', () => {
    const c = card('2026-11-21');
    const text = [c.note?.lead, c.note?.detail, ...(c.note?.why ?? [])].filter(Boolean).join(' ')
      + JSON.stringify(c.note);
    expect(text).toMatch(/MenQuadfi may be given from 6 weeks/);
  });

  it('5 weeks (Nov 7): no card offering a brand', () => {
    expect(card('2026-11-07').brands).toEqual([]);
  });

  it('MQ6-k: an age typed as 1 month, no date of birth: no brand, not yet due', () => {
    const c = recommend({ today: '2026-11-21', ageMonths: 1, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] }).menacwy[0];
    expect(c.brands).toEqual([]);
    expect(c.status).toBe('not-indicated');
  });

  it('a healthy 7-week-old: no brand', () => {
    expect(card('2026-11-21', []).brands).toEqual([]);
  });
});
