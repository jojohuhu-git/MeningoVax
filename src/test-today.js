// The single date the whole test suite pretends it is.
//
// L2-1 (2026-09-16): every test that builds a patient from real dates used to be
// graded against the real clock, so fixtures rotted silently. On 2026-09-15 the
// P1-4 fixture's first dose computed to age 2.0 months (valid — Menveo's floor);
// on 2026-09-16 the same fixture computed to 1.97 months (invalid), and the test
// went red overnight with nobody having touched the code.
//
// Pinning happens in test-setup.js, which applies to every test file. Tests that
// need to name the date (to write a fixture a known number of months back, say)
// import it from here rather than re-typing it.
//
// Changing this date is a deliberate act: fixtures across the suite are written
// relative to it, so moving it will move ages and intervals in every dated test.
export const TEST_TODAY = '2026-09-15';
