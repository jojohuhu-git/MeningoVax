// @vitest-environment happy-dom
// calendar P2-1 (fix queue 2026-09-17, remainder): "now" used to be read by
// four independent call sites per render — format.js, validate.js,
// RecCard.jsx, DoseEditor.jsx — joined since by a fifth, StepAge.jsx's date
// picker (#48). They agreed only because a synchronous render happens inside
// one instant; nothing made them agree. The whole suite also freezes the
// clock to one value for every test (test-setup.js), which is exactly why a
// same-instant divergence can't be reproduced by waiting for the clock to
// move — the test below proves the wiring a different way: give App.jsx's
// single `today` a value the real (frozen) clock does NOT have, and check
// that every consumer's visible output follows the passed-in value rather
// than quietly falling back to its own clock read.
//
// vaxapp is a separate app and untouched by this change — see the ported
// item's own CLAUDE.md ("the two apps knowingly differ; never port
// piecemeal") and the fix-2026-09-15 parity queue there, which is unrelated
// to this file.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StepAge from '../StepAge.jsx';
import DoseEditor from '../DoseEditor.jsx';
import RecCard from '../RecCard.jsx';
import { TEST_TODAY } from '../../test-today.js';

// An arbitrary date the frozen system clock is NOT set to (test-setup.js
// pins Date at TEST_TODAY). Any assertion that reads INJECTED rather than
// TEST_TODAY is proof the component used the prop, not todayISO().
const INJECTED = '2020-06-15';

describe('calendar P2-1 remainder · today flows in as a prop, not a fresh clock read', () => {
  it('StepAge\'s date-of-birth picker caps at the injected today, not the real clock', () => {
    render(<StepAge ageMonths={null} error="" onChange={() => {}} today={INJECTED} />);
    const dobInput = document.getElementById('dob-input');
    expect(dobInput.getAttribute('max')).toBe(INJECTED);
    expect(dobInput.getAttribute('max')).not.toBe(TEST_TODAY);
  });

  it('StepAge computes age from the date of birth against the injected today, not the real clock', () => {
    let last = null;
    render(
      <StepAge ageMonths={null} error="" onChange={(v) => { last = v; }} today={INJECTED} />,
    );
    const dobInput = document.getElementById('dob-input');
    // Born exactly 5 years before INJECTED (2020-06-15) -> 60 months old on
    // that date. Against the real frozen clock (TEST_TODAY, 2026-09-15) the
    // same birthday would compute to a different age entirely.
    fireEvent.change(dobInput, { target: { value: '2015-06-15' } });
    expect(last.ageMonths).toBe(60);
  });

  it('DoseEditor\'s dose-date picker caps at the injected today, not the real clock', () => {
    render(
      <DoseEditor
        vaccine="MenACWY"
        doses={[{ date: '', brand: '' }]}
        onChange={() => {}}
        brandOptions={[{ key: 'menveo', label: 'Menveo' }]}
        today={INJECTED}
      />,
    );
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput.getAttribute('max')).toBe(INJECTED);
    expect(dateInput.getAttribute('max')).not.toBe(TEST_TODAY);
  });

  it('DoseEditor flags a dose dated after the injected today as in the future, even though it is before the real clock', () => {
    // 2020-06-20 is after INJECTED (2020-06-15) but long before the real
    // frozen clock (TEST_TODAY, 2026-09-15) — only the injected value can
    // explain this dose being flagged.
    render(
      <DoseEditor
        vaccine="MenACWY"
        doses={[{ date: '2020-06-20', brand: '' }]}
        onChange={() => {}}
        brandOptions={[{ key: 'menveo', label: 'Menveo' }]}
        today={INJECTED}
      />,
    );
    expect(screen.getByTestId('dose-date-in-future')).toBeTruthy();
  });

  it('RecCard\'s recorded-dose age reads the injected today, not the real clock (no date of birth on file)', () => {
    // No dob: age-at-dose falls back to ageMonths - calendarMonthsBetween(doseDate, today).
    // ageMonths = 72 (6y) as of INJECTED. Dose given exactly 12 months before
    // INJECTED -> age at dose should read 5 years 0 months. Against the real
    // frozen clock (over 6 years later) the same subtraction would read
    // wildly differently.
    render(
      <RecCard
        rec={{ vaccine: 'MenACWY', status: 'complete', doseLabel: 'Dose 1', dueToday: false }}
        doses={[{ date: '2019-06-15', brand: 'menveo' }]}
        doseValidations={[{ status: 'valid', effectiveDoseNum: 1 }]}
        ageMonths={72}
        dob={null}
        today={INJECTED}
      />,
    );
    // A "complete, nothing due" card is collapsible by default; expand it to
    // see the recorded-dose line this test is checking.
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText(/age 5 years/)).toBeTruthy();
  });
});
