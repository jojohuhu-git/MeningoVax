// @vitest-environment happy-dom
// PREG-PENTA (owner, 2026-11-26, "Separate shots"): a pregnant patient at
// increased risk (asplenia, complement, microbiologist, serogroup B outbreak)
// was offered the combined MenABCWY shot with no word about pregnancy, while
// her own MenB card said "Discuss the benefit and potential risk".
//
// Both pentavalent MMWRs, "Pregnancy and breastfeeding" (read live 2026-11-26):
//   Penmenvy (mm7501a2): "No high-quality data have been published on use of
//     MenACWY-CRM/MenB-4C during pregnancy or while breastfeeding." ... "When
//     MenACWY is indicated while pregnant or breastfeeding, MenACWY-CRM or
//     MenACWY-TT may be administered."
//   Penbraya (mm7315a4): "No data exist on use of MenACWY-TT/MenB-FHbp during
//     pregnancy or while breastfeeding." ... "When MenACWY is indicated, persons
//     who are pregnant or breastfeeding should receive MenACWY-CRM or MenACWY-TT
//     (MenQuadfi, Sanofi Pasteur)."
//
// So in pregnancy the combined shot is not offered; the "two separate
// vaccines" banner says why, with each claim's own source numbers. The MenACWY
// and MenB cards themselves do not change.

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-09-15';
const engine = (riskIds, ageMonths = 228) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: [], menbDoses: [] });

function show(riskIds) {
  return render(
    <Results
      state={{
        step: 4, ageMonths: 228, ageGroup: 'adult', riskIds,
        menacwyDoses: [], menbDoses: [],
        riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
      }}
      onReset={() => {}} onChange={() => {}} onBack={() => {}}
    />,
  ).container;
}

describe('PREG-PENTA (engine): no combined shot in pregnancy', () => {
  for (const risk of ['asplenia', 'complement', 'microbiologist', 'outbreak_b']) {
    it(`pregnant + ${risk}: the combined shot is not offered, and the reason is given`, () => {
      const p = engine(['pregnancy', risk]).pentavalent;
      expect(p.eligible).toBe(false);
      expect(p.unavailableReason).toBe(
        'Not an option today: no high-quality data on the combined shot in pregnancy [c][c]. Give MenACWY and MenB separately [c][c].',
      );
      expect(p.unavailableCites.map((c) => c.key)).toEqual([
        'pentavalentGskNoPregnancyData', 'pentavalentPfizerNoPregnancyData',
        'pentavalentGskPregnancySeparateAcwy', 'pentavalentPfizerPregnancySeparateAcwy',
      ]);
    });

    it(`control: the same patient, not pregnant, is still offered the combined shot (${risk})`, () => {
      expect(engine([risk]).pentavalent.eligible).toBe(true);
    });
  }

  it('the MenACWY and MenB cards are the same with or without the pentavalent change', () => {
    // Pregnancy still changes the MenB card's own caveat (M11); this only
    // checks the cards are still offered, as separate shots.
    const r = engine(['pregnancy', 'asplenia']);
    expect(r.menacwy.some((c) => c.dueToday)).toBe(true);
    expect(r.menb.some((c) => c.dueToday)).toBe(true);
  });

  it('pregnancy outranks the 6-month Penbraya rule when both apply', () => {
    const p = recommend({
      today: TODAY, ageMonths: 228, riskIds: ['pregnancy', 'asplenia'],
      menacwyDoses: [], menbDoses: [{ date: '2026-07-15', brand: 'Penbraya' }],
    }).pentavalent;
    expect(p.unavailableReason).toMatch(/pregnancy/);
  });
});

describe('PREG-PENTA (UI): the banner says why, with source numbers', () => {
  it('no "Option 1 / Option 2" choice for a pregnant patient with asplenia', () => {
    expect(show(['pregnancy', 'asplenia']).querySelector('[data-testid="option-separate-label"]')).toBeNull();
  });

  it('the reason line reads the words and carries four source numbers', () => {
    const reason = show(['pregnancy', 'asplenia']).querySelector('[data-testid="pentavalent-unavailable-reason"]');
    expect(reason, 'a reason should be shown').toBeTruthy();
    expect(reason.textContent).toMatch(/^Not an option today: no high-quality data on the combined shot in pregnancy/);
    expect(reason.textContent).toMatch(/Give MenACWY and MenB separately/);
    expect(reason.textContent).not.toMatch(/\[c\]/);
    const marks = [...reason.querySelectorAll('a.note-cite')];
    expect(marks.length).toBe(4);
    // Each number's pop-up quotes its own sentence.
    expect(marks[0].getAttribute('data-title')).toMatch(/No high-quality data have been published/);
    expect(marks[1].getAttribute('data-title')).toMatch(/No data exist on use of MenACWY-TT\/MenB-FHbp/);
    expect(marks[3].getAttribute('data-title')).toMatch(/should receive MenACWY-CRM or MenACWY-TT/);
  });

  it('control: not pregnant, the two options are offered', () => {
    expect(show(['asplenia']).querySelector('[data-testid="option-separate-label"]')).toBeTruthy();
  });
});
