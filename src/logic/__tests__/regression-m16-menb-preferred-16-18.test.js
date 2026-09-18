// M16 (2026-09-15) — restore "preferred age 16-18 years" to the healthy MenB
// shared-decision card.
//
// A previous session (C1, 2026-07-24) removed this claim, and its reasoning was
// sound as far as it went: the citation then attached was mm7349a3 (ACIP Oct
// 2024, the Bexsero dosing-interval change), and "preferably 16-18" genuinely
// is NOT in that document. The conclusion drawn was that the claim was
// unsupported. It was only ever mis-cited.
//
// It is verbatim in ACIP 2020 MMWR 69(RR-9) TABLE 2, fetched live from cdc.gov
// on 2026-09-15:
//
//   "Primary vaccination: MenB series at age 16-23 yrs on basis of shared
//    clinical decision-making (preferred age 16-18 yrs)"
//
// And still current -- the CDC child & adolescent schedule notes, fetched the
// same day (https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html):
//
//   "Adolescents not at increased risk age 16-23 years (preferred age 16-18
//    years)* based on shared clinical decision-making."
//
// mm7349a3 did not overturn it: that paper changed MenB-4C's DOSING INTERVAL
// and is silent on the preferred age, and silence is not disagreement.
//
// Why it matters clinically: 16-23 is who MAY be vaccinated; 16-18 is when the
// conversation is best had. Dropping the second sentence left the card telling
// a clinician only the outer window, which reads as "any time before 24 is
// equivalent" -- and it is not.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';
const menbAt = (ageMonths, riskIds = []) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: [], menbDoses: [] }).menb[0];

describe('M16 — the healthy MenB card states the preferred age, not just the window', () => {
  it('a 17-year-old is told 16 through 18 is preferred', () => {
    const r = menbAt(204);                       // 17y, healthy
    expect(r.status).toBe('shared-decision');
    expect(noteText(r)).toMatch(/16 through 18|16–18|16-18/);
    expect(noteText(r)).toMatch(/prefer/i);
  });

  it('still states the full 16-23 eligibility window alongside it', () => {
    // The preference must not replace the window -- a 22-year-old is still
    // eligible, and the card has to keep saying so.
    expect(noteText(menbAt(204))).toMatch(/16\D{1,3}23/);
  });

  it('a 22-year-old is past the preferred age but still offered the series', () => {
    const r = menbAt(264);                       // 22y, healthy
    expect(r.status).toBe('shared-decision');
    expect(noteText(r)).toMatch(/prefer/i);
  });

  it('control: a high-risk patient is not given the shared-decision preference', () => {
    // High risk is a recommendation, not a shared decision, and has no
    // "preferred age" -- it is driven by the risk factor, at any age from 10.
    const r = menbAt(204, ['asplenia']);
    expect(r.status).toBe('risk-based');
    expect(noteText(r) || '').not.toMatch(/preferred age/i);
  });
});
