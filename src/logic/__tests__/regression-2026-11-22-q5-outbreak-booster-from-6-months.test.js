// A serogroup B outbreak's MenB booster counts from 6 months after the series
// (owner, Tier 1 Q5, 2026-11-22: "Count from 6 months").
//
// ACIP 2020 Table 8 (read live 2026-11-22), persons at risk during an outbreak,
// MenB booster: "Single dose if ≥1 yr after MenB primary series completion
// (≥6 mos interval might also be considered by public health professionals)".
// The 6-month option is in the outbreak table only: Tables 4, 5 and 7
// (complement, asplenia, microbiologists) give "Single dose at 1 yr after
// completion of primary vaccination". The card's due date stays 1 year, and
// it adds "Public health may advise it from 6 months after the series."
//
// Was: an outbreak booster at 8 months was "Not counted — repeat".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { CITATIONS } from '../../data/refs.js';

const T = (date) => ({ date, brand: 'Trumenba (MenB)' });
const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const run = (riskIds, menbDoses, today) => recommend({
  dob: '2006-05-01', today, riskIds, menacwyDoses: [], menbDoses,
});
const statuses = (r) => r.history.MenB.perDose.map((p) => p.status);
const card = (r) => r.menb[0];
const series = [T('2025-07-15'), T('2025-08-15'), T('2026-01-15')];
const SIX = 'Public health may advise it from 6 months after the series';

describe('serogroup B outbreak, 20y, Trumenba series ended Jan 15, 2026', () => {
  // The line sits behind "Why this" with the booster sentence (the fold,
  // noteFold.js; only the owner's list stays in view).
  it('before the booster: due Jan 15, 2027, and the card says public health may advise it from 6 months', () => {
    const r = run(['outbreak_b'], series, '2026-09-01');
    expect(card(r).doseLabel).toMatch(/^First booster/);
    expect(card(r).earliestNextDate).toBe('2027-01-15');
    expect(`${card(r).note.lead} ${card(r).note.detail}`).toContain(SIX);
    expect(card(r).noteCites.map((c) => c.key)).toContain('acip2020Table8MenbOutbreakBoosterSixMonths');
  });

  it('a booster on Sep 15, 2026 (8 months) counts; the card is "Complete" and says why it counted', () => {
    const r = run(['outbreak_b'], [...series, T('2026-09-15')], '2026-09-20');
    expect(statuses(r)).toEqual(['valid', 'valid', 'valid', 'valid']);
    expect(card(r).status).toBe('complete');
    expect(`${card(r).note.lead} ${card(r).note.detail}`).toContain(SIX);
  });

  it('the 6-month line takes the 4-day grace: Jul 11 counts, Jul 10 does not', () => {
    expect(statuses(run(['outbreak_b'], [...series, T('2026-07-11')], '2026-07-20'))[3]).toBe('valid');
    expect(statuses(run(['outbreak_b'], [...series, T('2026-07-10')], '2026-07-20'))[3]).toBe('invalid');
  });

  it('a booster under 6 months is "Not counted", citing Table 8\'s 6-month sentence', () => {
    const r = run(['outbreak_b'], [...series, T('2026-05-15')], '2026-05-20');
    expect(statuses(r)[3]).toBe('invalid');
    expect(r.history.MenB.perDose[3].reasons.join(' ')).toMatch(/after the series, 6 required/);
  });

  it('a booster at 1 year: "Complete", without the 6-month line', () => {
    const r = run(['outbreak_b'], [...series, T('2027-01-15')], '2027-01-20');
    expect(card(r).status).toBe('complete');
    expect(`${card(r).note.lead} ${card(r).note.detail}`).not.toContain(SIX);
  });

  it('the same for a 2-dose Bexsero series (Q1: the booster is the 3rd dose)', () => {
    const r = run(['outbreak_b'], [B('2025-07-15'), B('2026-01-15'), B('2026-09-15')], '2026-09-20');
    expect(statuses(r)).toEqual(['valid', 'valid', 'valid']);
    expect(card(r).status).toBe('complete');
  });
});

describe('controls: the 6 months is for an outbreak only', () => {
  it('asplenia, same doses, booster at 8 months: still "Not counted — repeat from Sep 15, 2027"', () => {
    const r = run(['asplenia'], [...series, T('2026-09-15')], '2026-09-20');
    expect(statuses(r)[3]).toBe('invalid');
    expect(r.history.MenB.perDose[3].reasons.join(' ')).toMatch(/1 year required/);
    expect(card(r).earliestNextDate).toBe('2027-09-15');
  });

  it('outbreak plus asplenia: asplenia\'s boosters win, so 8 months is not counted', () => {
    const r = run(['outbreak_b', 'asplenia'], [...series, T('2026-09-15')], '2026-09-20');
    expect(statuses(r)[3]).toBe('invalid');
  });

  it('an asplenia card does not carry the public-health line', () => {
    const r = run(['asplenia'], series, '2026-09-01');
    expect(`${card(r).note.lead} ${card(r).note.detail}`).not.toContain(SIX);
  });

  it('the new source quotes Table 8\'s cell whole and names outbreak patients', () => {
    const ref = CITATIONS.acip2020Table8MenbOutbreakBoosterSixMonths;
    expect(ref.quote).toBe('Single dose if ≥1 yr after MenB primary series completion (≥6 mos interval might also be considered by public health professionals)');
    expect(ref.population).toEqual(['menb-outbreak']);
  });
});
