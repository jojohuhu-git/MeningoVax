// @vitest-environment happy-dom
// Port Phase 5, gap badge (owner, 2026-11-18).
//
// High-risk MenB dose 2 is due 1 month after dose 1 but can be given from 4
// weeks (STOP F1 Q9a). On the days between, the card's note says "It can be
// given today if needed", the summary line says MenB dose 2 "can also be given
// today", and (F2a) the card sits under "Option 1: Two separate injections
// (MenACWY + MenB)" — but its badge read "Up to date", because the badge knew
// only "due" or "not due". Owner: the badge says "Can be given today" on those
// days. Not "due": the card's own date line still reads "Next dose due <date>".
//
// Owner's patient: asplenia, 20 y, Bexsero Oct 20, 2026, no MenACWY.
// 4 weeks = Nov 17; 1 month = Nov 20. Gap days: Nov 17, 18, 19.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Results from '../Results.jsx';

const state = (menacwyDoses) => ({
  step: 4, dob: '2006-01-01', riskIds: ['asplenia'],
  menacwyDoses, menbDoses: [{ date: '2026-10-20', brand: 'Bexsero (MenB)' }],
  riskAtDoseAnswers: { MenACWY: {}, MenB: {} },
});
const menbBadge = (today, menacwyDoses = []) => {
  const c = render(
    <Results state={state(menacwyDoses)} today={today}
      onReset={() => {}} onChange={() => {}} onBack={() => {}} />,
  ).container;
  const card = [...c.querySelectorAll('[data-testid="rec-card"]')]
    .find((el) => el.querySelector('.rec-vaccine-name')?.textContent === 'MenB');
  return { badge: card.querySelector('.status-badge').textContent, card };
};

describe('gap badge: high-risk MenB dose 2 between its 4-week minimum and its 1-month date', () => {
  for (const day of ['2026-11-17', '2026-11-18', '2026-11-19']) {
    it(`${day}: "Can be given today", with "Next dose due Nov 20, 2026" beside it`, () => {
      const { badge, card } = menbBadge(day);
      expect(badge).toBe('Can be given today');
      expect(card.textContent).toContain('Next dose due Nov 20, 2026');
      expect(card.textContent).toContain('It can be given today if needed');
    });
  }

  it('MenACWY not due (dose 1 given Oct 20): the MenB card stands alone and still reads "Can be given today"', () => {
    const { badge } = menbBadge('2026-11-18', [{ date: '2026-10-20', brand: 'Menveo 2-vial (MenACWY)' }]);
    expect(badge).toBe('Can be given today');
  });

  // F-3 (owner, STOP G1, 2026-11-18): this was "Up to date". A dated dose 2
  // still to come now reads "Next dose not yet due"; still never "Can be given
  // today" before the 4-week minimum.
  it('control, Nov 16 (before the 4-week minimum): "Next dose not yet due" (F-3), not "Can be given today"', () => {
    expect(menbBadge('2026-11-16').badge).toBe('Next dose not yet due');
  });

  it('control, Nov 20 (due): "Dose due today, future boosters needed", unchanged', () => {
    expect(menbBadge('2026-11-20').badge).toBe('Dose due today, future boosters needed');
  });
});
