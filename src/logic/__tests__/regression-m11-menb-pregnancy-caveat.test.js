// M11 (2026-09-15), cross-repo parity with vaxapp ("M11: MenB is deferred in
// pregnancy, and the app now says so").
//
// MeningoVax already deferred MenB in pregnancy (shouldDeferMenB + the
// 'deferred' status), which is why M11 was scoped as a vaxapp item. But the
// rule has a second half that neither app said out loud. ACIP 2020 MMWR
// 69(RR-9), "Pregnancy and Lactation", fetched live from cdc.gov 2026-09-15:
//
//   "Because limited data are available for MenB vaccination during pregnancy,
//    vaccination with MenB should be deferred unless the woman is at increased
//    risk and, after consultation with her health care provider, the benefits of
//    vaccination are considered to outweigh the potential risks."
//
// A pregnant patient WITH an increased-risk indication is not deferred — so she
// fell straight through to the ordinary high-risk cards, which never mentioned
// the pregnancy at all. ACIP still frames that dose as a benefit-versus-risk
// conversation, and now so does the card.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-09-15';
const menb = (riskIds, dates = []) =>
  recommend({ today: TODAY, ageMonths: 204, riskIds, menacwyDoses: [], menbDoses: dates.map((d) => ({ date: d })) }).menb[0];

describe('M11 — a pregnant patient at increased risk is told it is a judgement call', () => {
  it('the high-risk MenB card names the benefit-versus-risk discussion', () => {
    const r = menb(['pregnancy', 'asplenia']);
    expect(r.status).toBe('risk-based');              // still offered, not deferred
    expect(noteText(r)).toMatch(/only after discussing it with her/i);
    expect(noteText(r)).toMatch(/outweighs the potential risk/i);
  });

  it('it applies to a later dose in the series too, not just dose 1', () => {
    expect(noteText(menb(['pregnancy', 'complement'], ['2026-06-15'])))
      .toMatch(/only after discussing it with her/i);
  });

  it('control: the same patient without pregnancy sees no such text', () => {
    expect(noteText(menb(['asplenia']))).not.toMatch(/Pregnancy:/);
  });

  it('control: pregnancy with NO increased risk is still a plain deferral', () => {
    const r = menb(['pregnancy']);
    expect(r.status).toBe('deferred');
    expect(r.doseLabel).toMatch(/Defer during pregnancy/);
    expect(noteText(r)).not.toMatch(/only after discussing it with her/i);
  });
});
