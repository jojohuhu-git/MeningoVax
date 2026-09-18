// U4 (2026-09-17): the military-recruit note is the longest on any card (446
// characters) and it spent its first two sentences on what the app knows and
// cannot do before reaching the thing the clinician has to act on — go and
// check the service's own requirement.
//
// The clinical content is unchanged and was verified live on 2026-09-15 (M18):
// ACIP 2020 MMWR 69(RR-9) Table 10 gives military recruits "Every 5 yrs on
// basis of assignment", and footnote (double dagger) hands the timing to the
// Department of Defense "on the basis of high-risk travel requirements". What
// changes is which sentence comes first.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { TEST_TODAY } from '../../test-today.js';
import { noteText } from '../../test-note-text.js';

const note = () => noteText(recommend({
  today: TEST_TODAY, ageMonths: 240, riskIds: ['military'],
  menacwyDoses: [{ date: '2024-09-15', ageMonths: 228 }], menbDoses: [],
}).menacwy[0]);

describe('U4 · the military-recruit card leads with the action', () => {
  it('opens by telling the clinician to check the service requirement', () => {
    expect(note()).toMatch(/^Check the service's current requirement/);
  });

  it('still carries every clinical fact it had', () => {
    const n = note();
    expect(n).toMatch(/every 5 years/i);            // ACIP Table 10 cadence
    expect(n).toMatch(/basis of assignment/i);      // what the cadence turns on
    expect(n).toMatch(/Department of Defense/i);    // who owns the timing
    expect(n).toMatch(/single-dose recruitment requirement/i);
    expect(n).toMatch(/ongoing-risk indication/i);
  });

  it('is shorter than the version that buried the action', () => {
    expect(note().length).toBeLessThan(446);
  });
});
