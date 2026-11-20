// E3 (rulebook mockup review, 2026-11-19): a later high-risk MenB booster
// (dose 5 on) was labelled "every 2–3 years" but its note said "A MenB booster,
// 1 year after the primary series was completed". ACIP 2025 Box (refs
// `menbHighRiskBoosterCadenceBox`): "the first booster dose should be given 1
// year after the primary series, with additional boosters every 2–3 years if
// the risk remains". A later booster's note now gives the 2–3-year gap from the
// previous booster. It does not say "every" (U2: the booster line carries the
// cadence once).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const B = (date) => ({ date, brand: 'Bexsero' });
const run = (menbDoses) => recommend({ today: '2026-11-19', dob: '2006-06-01', riskIds: ['asplenia'], menacwyDoses: [], menbDoses }).menb[0];
const PRIMARY = [B('2023-07-01'), B('2023-08-01'), B('2024-01-01')];

describe('E3: a later MenB booster says 2–3 years after the previous booster', () => {
  it('asplenia, Bexsero series ended Jan 1, 2024, booster Jan 1, 2025: dose 5', () => {
    const c = run([...PRIMARY, B('2025-01-01')]);
    expect(c.doseLabel).toBe('Booster (dose 5, every 2–3 years)');
    expect(c.note.detail).toContain('A MenB booster, 2–3 years after the previous booster [c].');
    // extinct: a later booster no longer says "1 year after the primary series" (E3, 2026-11-19).
    expect(c.note.detail).not.toMatch(/after the primary series was completed/);
    expect(c.earliestNextDate).toBe('2027-01-01');
  });

  it('control: the first booster (dose 4) keeps "1 year after the primary series was completed"', () => {
    const c = run(PRIMARY);
    expect(c.doseLabel).toBe('Booster (dose 4, 1 year after primary)');
    expect(c.note.detail).toContain('A MenB booster, 1 year after the primary series was completed [c].');
  });
});
