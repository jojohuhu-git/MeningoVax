// M1, M1b, M1c (owner, 2026-11-20; docs/archive/decisions-2026-11-20-rulebook-reorg.md):
// a high-risk MenB dose 3 given under 4 months after dose 2 AND under 6 months after
// dose 1 does NOT count. It is repeated. It used to count, with a 4th dose owed.
//
// Sources, read live 2026-11-20:
//   ACIP, MMWR mm7349a3 (Dec 12, 2024): "If the third dose is administered <4 months
//     after the second dose, the dose should be repeated ≥4 months after the last
//     dose, unless the third dose was administered ≥6 months after the first dose"
//   ACIP General Best Practice: "The repeat dose should be spaced after the invalid
//     dose by the recommended minimum interval"
//   CDSI 4.65 (AntigenSupportingData-Meningococcal-B-4.65.xml), both increased-risk
//     series, dose 3: absolute minimum "4 months - 4 days" from the previous dose, and
//     an allowable interval of "6 months - 4 days" from dose 1.
//
// M1b: the repeat's ROUTINE date is the latest of 4 months after the not-counted dose,
//      4 months after dose 2 and 6 months after dose 1; the earliest valid date is
//      stated beside it when sooner.
// M1c: a repeat counts only if ≥4 months after the not-counted dose, or ≥6 months
//      after dose 1 (both with the 4-day grace).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';
import { menbSeriesInfo } from '../seriesTotals.js';

const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const run = (menbDoses, today) => recommend({
  dob: '2006-01-01', today, riskIds: ['asplenia'], menacwyDoses: [], menbDoses,
});
const chips = (r) => r.history.MenB.perDose.map((p) => doseChipLabel(p, 3));
const card = (r) => r.menb[0];

describe('M1: dose 3 under 4 months after dose 2 and under 6 months after dose 1 is not counted', () => {
  it('Jan 1, Feb 1, Apr 1: dose 3 "Not counted — repeat"; "Dose 3 of 3" due Aug 1 (4 months after Apr 1)', () => {
    const r = run([B('2026-01-01'), B('2026-02-01'), B('2026-04-01')], '2026-04-15');
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'invalid']);
    expect(chips(r)[2]).toBe('Not counted — repeat');
    // Dose 2 is never made invalid or renumbered by this rule (owner, M1a).
    expect(r.history.MenB.perDose[1].effectiveDoseNum).toBe(2);
    expect(card(r).doseLabel).toMatch(/^Dose 3 of 3/);
    expect(card(r).seriesTotal).toBe(3);
    expect(card(r).earliestNextDate).toBe('2026-08-01');
    // M1c: a repeat ≥6 months after dose 1 also counts, so Jul 1 is stated beside it.
    expect(card(r).note.lead).toMatch(/Earliest valid date: Jul 1, 2026/);
  });

  it('there is no 4-dose high-risk series any more', () => {
    const doses = [B('2026-01-01'), B('2026-02-01'), B('2026-04-01')];
    expect(menbSeriesInfo({ highRisk: true, doses }).total).toBe(3);
  });

  it('the dose line says why, in both intervals', () => {
    const r = run([B('2026-01-01'), B('2026-02-01'), B('2026-04-01')], '2026-04-15');
    const line = r.history.MenB.perDose[2].reasons.join(' ');
    expect(line).toMatch(/after dose 2/);
    expect(line).toMatch(/after dose 1/);
    expect(line).not.toMatch(/It counts|Dose 4|4th dose/);
  });
});

describe('M1b: the repeat\'s routine date is the latest of the three lines', () => {
  it('Jan 1, Feb 1, Feb 15: "Dose 3 of 3" due Jul 1 (6 months after dose 1); earliest valid Jun 15', () => {
    const r = run([B('2026-01-01'), B('2026-02-01'), B('2026-02-15')], '2026-03-01');
    expect(chips(r)[2]).toBe('Not counted — repeat');
    expect(card(r).doseLabel).toMatch(/^Dose 3 of 3/);
    expect(card(r).earliestNextDate).toBe('2026-07-01');
    expect(card(r).note.lead).toMatch(/Earliest valid date: Jun 15, 2026/);
  });

  it('control, no dose 3 given: Jan 1, Feb 1 → due Jul 1 with no earliest-valid line (unchanged)', () => {
    const r = run([B('2026-01-01'), B('2026-02-01')], '2026-03-01');
    expect(card(r).earliestNextDate).toBe('2026-07-01');
    expect(card(r).note.lead).not.toMatch(/Earliest valid date/);
  });
});

describe('M1c: a repeat counts only ≥4 months after the not-counted dose, or ≥6 months after dose 1', () => {
  it('Jan 1, Jan 29, Mar 1, Jun 1: Jun 1 is not counted either; next due Oct 1, earliest valid Jul 1', () => {
    const r = run([B('2026-01-01'), B('2026-01-29'), B('2026-03-01'), B('2026-06-01')], '2026-06-05');
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'invalid', 'invalid']);
    expect(chips(r).slice(2)).toEqual(['Not counted — repeat', 'Not counted — repeat']);
    expect(card(r).doseLabel).toMatch(/^Dose 3 of 3/);
    expect(card(r).earliestNextDate).toBe('2026-10-01');
    expect(card(r).note.lead).toMatch(/Earliest valid date: Jul 1, 2026/);
  });

  it('control: the repeat on Jul 1 counts; series complete, first booster Jul 1, 2027', () => {
    const r = run([B('2026-01-01'), B('2026-01-29'), B('2026-03-01'), B('2026-07-01')], '2026-07-05');
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'invalid', 'valid']);
    expect(r.history.MenB.perDose[3].effectiveDoseNum).toBe(3);
    expect(card(r).doseLabel).toMatch(/^First booster/);
    expect(card(r).earliestNextDate).toBe('2027-07-01');
  });

  it('grace: a repeat 4 days short of 4 months after the not-counted dose counts; 5 days short does not', () => {
    // Not counted: Feb 15. 4 months after it is Jun 15 (−4 days: Jun 11).
    // 6 months after dose 1 is Jul 1 (−4 days: Jun 27), so it cannot rescue either date.
    const late = [B('2026-01-01'), B('2026-02-01'), B('2026-02-15')];
    const ok = run([...late, B('2026-06-11')], '2026-06-20');
    expect(ok.history.MenB.perDose[3].status).toBe('valid');
    const no = run([...late, B('2026-06-10')], '2026-06-20');
    expect(no.history.MenB.perDose[3].status).toBe('invalid');
  });
});

describe('controls that do not move', () => {
  it('months 0, 3, 6: counts, complete', () => {
    const r = run([B('2026-01-01'), B('2026-04-01'), B('2026-07-01')], '2026-07-05');
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'valid']);
    expect(card(r).earliestNextDate).toBe('2027-07-01');
  });

  it('Jan 1, Jun 25, Jul 2 (one week after dose 2, 6 months after dose 1): counts, booster Jul 2, 2027', () => {
    const r = run([B('2026-01-01'), B('2026-06-25'), B('2026-07-02')], '2026-07-05');
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'valid']);
    expect(chips(r)[1]).toMatch(/^Dose 2/);
    expect(card(r).earliestNextDate).toBe('2027-07-02');
  });

  it('2025-10-01, 2026-03-01, 2026-04-15 (6½ months after dose 1): counts, complete', () => {
    const r = run([B('2025-10-01'), B('2026-03-01'), B('2026-04-15')], '2026-05-01');
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'valid']);
    expect(card(r).earliestNextDate).toBe('2027-04-15');
  });

  it('dose 3 three days short of 4 months after dose 2 still counts (C7 grace)', () => {
    const r = run([B('2026-01-10'), B('2026-02-10'), B('2026-06-07')], '2026-06-10');
    expect(r.history.MenB.perDose.map((p) => p.status)).toEqual(['valid', 'valid', 'valid']);
  });
});
