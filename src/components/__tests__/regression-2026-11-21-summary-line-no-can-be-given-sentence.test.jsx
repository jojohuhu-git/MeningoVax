// @vitest-environment happy-dom
// The summary line does not add "MenB dose 2 can be given today." (owner MQ6-f,
// 2026-11-21, "Yes, both match"; was "Yes, add it" that morning, MQ6-d).
//
// A 12-year-old with asplenia, MenACWY up to date, Bexsero 29 days ago: dose 2
// is past its 4-week minimum but before its 1-month routine date. Owner: follow
// the standard schedule when it can be followed; a dose at the minimum still
// counts. So the card's badge reads "Next dose not yet due" and the line above
// the cards says only "No MenACWY or MenB doses due today." The card's note
// still says "It can be given today if needed". The MenQuadfi sentence (MQ6-c)
// went the same way (MQ6-g; menquadfi-6-week-floor-ui.test.jsx).
// Decisions: docs/archive/decisions-2026-11-21-menquadfi-6-week-dose-and-infant-gap.md.
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
  it('Bexsero 29 days ago: the line says only that nothing is due; the badge is "Next dose not yet due"', () => {
    expect(line([B('2026-10-23')])).toBe('No MenACWY or MenB doses due today.');
    expect(screen.queryByText('Can be given today')).toBeNull();
    expect(screen.getByText('Next dose not yet due')).toBeDefined();
    expect(screen.getByText(/It can be given today if needed/)).toBeDefined();
  });

  it('control: Bexsero 20 days ago (before the 4-week minimum): line unchanged', () => {
    expect(line([B('2026-11-01')])).toBe('No MenACWY or MenB doses due today.');
  });

  it('control: Bexsero 2 months ago (dose 2 due): line unchanged', () => {
    expect(line([B('2026-09-21')])).toBe('Due today: MenB.');
  });
});
