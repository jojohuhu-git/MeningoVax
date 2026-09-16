import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { TEST_TODAY } from './test-today.js';

// L2-1 (2026-09-16): freeze the calendar for every test file.
//
// Almost every fixture in this repo is a patient built from real dates, and the
// engine defaults to the real clock when no `today` is passed — so a fixture's
// meaning drifts as the calendar moves. On 2026-09-16 the suite went red with
// nobody having touched the code: a dose dated 2018-11-15 for a patient aged 96
// months crossed from 2.0 to 1.97 months old overnight, dropping below Menveo's
// 2-month floor.
//
// Only Date is faked — setTimeout and friends stay real, so @testing-library's
// async helpers and happy-dom are unaffected. A test that wants a different date
// still passes `today` explicitly to recommend()/analyzeHistory(), which every
// one of those functions already accepts; pinning here only changes what the
// DEFAULT is.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  // Local noon, so todayISO() (which reads local clock components) returns
  // TEST_TODAY in every timezone the suite might run in.
  vi.setSystemTime(new Date(`${TEST_TODAY}T12:00:00`));
});

afterAll(() => {
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();
});
