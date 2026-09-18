// @vitest-environment happy-dom
// ─────────────────────────────────────────────────────────────────────────
// The Date of Birth picker's `max` must be today in the CLINICIAN'S clock,
// not UTC.
//
// Noticed but not chased in the 2026-09-18c handoff: late in the US evening,
// typing today's date as the date of birth was rejected as "in the future."
// Reproduced here: `StepAge.jsx` set the native date input's `max` with
// `new Date().toISOString().slice(0, 10)` — UTC. In any timezone behind
// UTC (every US zone), UTC rolls over to tomorrow while the wall clock is
// still on today, so for several hours every evening the picker's own `max`
// names a day that has not happened yet locally. `ageEntryProblem()` (the
// validator that actually decides the answer) has always used `todayISO()`,
// which correctly reads local clock components — so a clinician who picks
// that UTC-tomorrow date, believing the widget that just allowed it, is told
// their patient was born "in the future."
//
// `DoseEditor.jsx` hit this exact class of bug for the dose-date picker (see
// its "G3" comment) and was fixed to use `todayISO()`. `StepAge.jsx`'s
// date-of-birth picker never got the same fix.
//
// There is no logic-layer test for this: `todayISO()` itself is correct and
// already covered (date-pinning.test.js). The defect is entirely that
// StepAge.jsx computed its own "today" instead of asking dateUtils.js for
// one, so the fix and its test both live at the UI layer only.
// ─────────────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import App from '../../App.jsx';
import { TEST_TODAY } from '../../test-today.js';

function setClock(isoDateTime) {
  vi.setSystemTime(new Date(isoDateTime));
}

describe('DOB picker max: local date, not UTC date', () => {
  afterEach(() => setClock(`${TEST_TODAY}T12:00:00`));

  it('at 11pm local (UTC already tomorrow), max is still the local date', () => {
    // This machine's test timezone is America/Los_Angeles (UTC-7 in
    // September). 2026-09-17T23:09:00 local is 2026-09-18T06:09:00Z — UTC
    // has rolled over, local has not.
    setClock('2026-09-17T23:09:00');
    render(<App />);
    const dobInput = screen.getByLabelText('Date of Birth');
    expect(dobInput.max).toBe('2026-09-17');
  });

  it('at local noon, max is simply today', () => {
    setClock(`${TEST_TODAY}T12:00:00`);
    render(<App />);
    const dobInput = screen.getByLabelText('Date of Birth');
    expect(dobInput.max).toBe(TEST_TODAY);
  });
});
