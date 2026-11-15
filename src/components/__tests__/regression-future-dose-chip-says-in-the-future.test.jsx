// @vitest-environment happy-dom
// The dose chip for a date in the future.
//
// PARITY with PneumoVax (owner decision, 2026-10-12). Found there, and found to
// be true here as well: `describeDose` builds `age ${fmtAgeMonths(ageAtDose)}`
// in both apps, so a dose dated in the future printed the age the patient WILL
// be. The owner chose to fix both. PneumoVax's half ships in its own PR —
// see `jojohuhu-git/PneumoVax` PR #41.
//
// Same synthetic patient as PneumoVax's copy of this test, deliberately, so a
// future divergence between the two apps is visible rather than inferred:
// born 2020-01-01, clock at 2026-10-12 (6 years 9 months), dose dated
// 2030-05-01, which used to read "age 10 years 4 months".
//
// A date BEFORE birth already reads "age Before birth" (fmtAgeMonths returns a
// phrase for a negative age). That wording is unchanged: the decision was to add
// the future case, not to restyle the one already shipped.
//
// The card does not decide what "in the future" means — `isFutureDated()` in
// validate.js uses the same `futureDatedProblem` (G3) the engine grades with.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import RecCard from '../RecCard.jsx';
import { isFutureDated } from '../../logic/validate.js';

const TODAY = '2026-10-12';
const DOB = '2020-01-01';   // 6 years 9 months on TODAY

// Assertions read the card's own text content rather than getByText: the chip
// line is split across child elements, so a regex matcher silently finds
// NOTHING there — which in PneumoVax made a `queryByText` negative assertion
// pass while the card was still printing the very string it claimed was gone.
const cardText = (container) => container.textContent.replace(/\s+/g, ' ');

function renderCard({ doses, doseValidations }) {
  return render(
    <RecCard
      rec={{ vaccine: 'MenACWY', status: 'due', doseLabel: 'Dose 1', dueToday: true, seriesTotal: 2 }}
      doses={doses}
      doseValidations={doseValidations}
      ageMonths={81}
      dob={DOB}
      today={TODAY}
    />
  );
}

describe('a dose dated in the future does not print the age the patient will be', () => {
  it('reads "In the future" where the age would go', () => {
    const { container } = renderCard({
      doses: [{ date: '2030-05-01', brand: 'Menveo' }],
      doseValidations: [{ status: 'invalid', reasons: ['This date is in the future.'], doesNotCount: true }],
    });
    expect(cardText(container)).toMatch(/D1 · May 1, 2030 · In the future · Menveo/);
  });

  it('no longer prints "age 10 years 4 months" — the age on that future date', () => {
    const { container } = renderCard({
      doses: [{ date: '2030-05-01', brand: 'Menveo' }],
      doseValidations: [{ status: 'invalid', reasons: ['This date is in the future.'], doesNotCount: true }],
    });
    expect(cardText(container)).not.toMatch(/age 10 years 4 months/);
  });

  it('an ordinary past dose still prints its age at the dose', () => {
    const { container } = renderCard({
      doses: [{ date: '2024-03-01', brand: 'Menveo' }],
      doseValidations: [{ status: 'valid', reasons: [], effectiveDoseNum: 1 }],
    });
    expect(cardText(container)).toMatch(/D1 · Mar 1, 2024 · age 4 years 2 months · Menveo/);
    expect(cardText(container)).not.toMatch(/In the future/);
  });

  it('a dose dated TODAY prints its age, not "In the future"', () => {
    // The boundary a clinician relies on: a dose given this morning counts.
    const { container } = renderCard({
      doses: [{ date: TODAY, brand: 'Menveo' }],
      doseValidations: [{ status: 'valid', reasons: [], effectiveDoseNum: 1 }],
    });
    expect(cardText(container)).not.toMatch(/In the future/);
    expect(cardText(container)).toMatch(/age 6 years 9 months/);
  });

  it('a dose dated before birth still reads "age Before birth" — unchanged', () => {
    const { container } = renderCard({
      doses: [{ date: '2019-06-01', brand: 'Menveo' }],
      doseValidations: [{ status: 'invalid', reasons: ['Before birth.'], doesNotCount: true }],
    });
    expect(cardText(container)).toMatch(/age Before birth/);
  });
});

describe('isFutureDated — the one place the question is answered', () => {
  it('is true only after today, so a dose given this morning still counts', () => {
    expect(isFutureDated({ date: '2030-05-01' }, TODAY)).toBe(true);
    expect(isFutureDated({ date: TODAY }, TODAY)).toBe(false);
    expect(isFutureDated({ date: '2024-03-01' }, TODAY)).toBe(false);
    expect(isFutureDated({ brand: 'Menveo' }, TODAY)).toBe(false);
  });
});
