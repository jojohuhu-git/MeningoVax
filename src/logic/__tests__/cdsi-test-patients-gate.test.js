// ── CDC's CDSI test patients, as a required test (port Phase 1.5 → gate, 2026-11-15) ──
//
// CDC publishes 104 meningococcal test patients (52 MenACWY, 52 MenB) with the
// answer its own software gives. `npx vite-node scripts/cdsi/runTestCases.mjs`
// runs them through this app and prints where the two differ. Every difference
// found so far is sorted into a named family (the KNOWN table in
// scripts/cdsi/cdsiCore.mjs) and written up in
// docs/archive/report-2026-11-15-cdsi-test-patients.md.
//
// This file turns that report into a test, made required after the owner saw
// it (STOP B, 2026-11-15). It does NOT require the app to agree with CDC's
// software: CDSI runs behind ACIP's wording, and where they differ the wording
// wins (owner rules 2026-08-10, 2026-10-17). It fails when something CHANGES
// without being explained:
//   1. a NEW difference — a patient that disagrees and is in no known family;
//   2. a HEALED one — a patient listed as different that now agrees (prune the
//      list so it stays true, and say why in the PR);
//   3. a MOVED answer — any patient's app answer differs from the saved file
//      scripts/cdsi/cdc-files/meningo-app-answers.json. After reading what
//      moved and why, rewrite it with
//      `npx vite-node scripts/cdsi/runTestCases.mjs --save-answers`.
import { describe, it, expect } from 'vitest';
import { CASES, evaluate } from '../../../scripts/cdsi/cdsiCore.mjs';

const ev = evaluate();

describe("CDC's CDSI test patients", () => {
  it('all 104 CDC patients are read (52 MenACWY, 52 MenB)', () => {
    expect(CASES.length).toBe(104);
    expect(ev.results.filter((x) => x.group === 'MenACWY').length).toBe(52);
    expect(ev.results.filter((x) => x.group === 'MenB').length).toBe(52);
  });

  it('the saved answers file exists and has every patient', () => {
    expect(ev.saved, 'run once with --save-answers').not.toBeNull();
    expect(Object.keys(ev.saved).sort()).toEqual(ev.results.map((x) => x.id).sort());
  });

  it('no NEW difference from CDC (every disagreement is in a known family)', () => {
    expect(ev.fresh.map((x) => `${x.id}: ${x.dosesAgree ? '' : 'a dose verdict differs; '}next step ${x.forecast}`)).toEqual([]);
  });

  it('no known difference has quietly healed (the known list stays true)', () => {
    expect(ev.healed).toEqual([]);
  });

  it("no patient's answer has moved since it was saved", () => {
    const moved = ev.moved.map((x) => `${x.id}\n  was: ${ev.saved[x.id] ?? '(not saved)'}\n  now: ${ev.nowAnswers[x.id]}`);
    expect(moved).toEqual([]);
  });
});
