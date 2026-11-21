// @vitest-environment happy-dom
// The summary line names MenB dose 2 when its card says "Can be given today"
// (owner, 2026-11-21, "Yes, add it").
//
// A 12-year-old with asplenia, MenACWY up to date, Bexsero 29 days ago: the
// MenB card says "Can be given today" (dose 2 is past its 4-week minimum but
// before its 1-month routine date), yet the line above the cards said only
// "No MenACWY or MenB doses due today." The same gap was closed for MenQuadfi
// the same day (MQ6-c, menquadfi-6-week-floor-ui.test.jsx).
//
// Only dose 2 was asked. A dose 3 being repeated after one given too early can
// also read "Can be given today"; whether the line names it is an open owner
// question, so it is not built here.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

const TODAY = '2026-11-21';
const MV = (date) => ({ date, brand: 'Menveo 2-vial' });
const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const yes = (n) => Object.fromEntries([...Array(n).keys()].map((i) => [i, 'yes']));

// Born 21 Nov 2014; two MenACWY doses at 9 years, so no MenACWY is due until
// the 5-year booster.
function line(menbDoses) {
  const menacwyDoses = [MV('2024-01-10'), MV('2024-03-10')];
  const state = {
    dob: '2014-11-21', riskIds: ['asplenia'], menacwyDoses, menbDoses,
    riskAtDoseAnswers: { MenACWY: yes(menacwyDoses.length), MenB: yes(menbDoses.length) },
  };
  render(<Results state={state} today={TODAY} onChange={() => {}} onReset={() => {}} />);
  return screen.getByTestId('results-summary-line').textContent;
}

describe('a 12-year-old with asplenia, MenACWY up to date', () => {
  it('Bexsero 29 days ago: the line says MenB dose 2 can be given today', () => {
    expect(line([B('2026-10-23')]))
      .toBe('No MenACWY or MenB doses due today. MenB dose 2 can be given today.');
    expect(screen.getByText('Can be given today')).toBeDefined();
  });

  it('control: Bexsero 20 days ago (before the 4-week minimum): line unchanged', () => {
    expect(line([B('2026-11-01')])).toBe('No MenACWY or MenB doses due today.');
  });

  it('control: Bexsero 2 months ago (dose 2 due): line unchanged', () => {
    expect(line([B('2026-09-21')])).toBe('Due today: MenB.');
  });
});
