// T2 (owner, 2026-11-19, "Keep as safety net"): the MenACWY first-booster rule
// treats an UNKNOWN age at the last primary dose as "before 7" (3 years, not 5).
// Since C1 (owner, 2026-11-15: an undated dose does not count), every dose the
// app counts has a date, so that age is always known and the fallback never
// runs. The owner kept it as a safety net; this sweep shows no patient reaches
// it today. If it ever fails, a patient's booster is being timed from a guess:
// find out why before changing anything.
//
// Both places that time a first booster (the card, recommend.js; the dose
// checker, doseRules.js's ACWY booster rows) ask menacwyFirstBoosterYears(),
// directly or through menacwyBoosterYears(). Both are watched here.
import { describe, it, expect, vi } from 'vitest';

const seen = { first: [], viaBooster: [] };
vi.mock('../intervals.js', async (importOriginal) => {
  const m = await importOriginal();
  return {
    ...m,
    menacwyFirstBoosterYears: vi.fn((age) => { seen.first.push(age); return m.menacwyFirstBoosterYears(age); }),
    menacwyBoosterYears: vi.fn((p) => {
      if (p?.isFirstBooster) seen.viaBooster.push(p.primaryCompletionAgeMonths);
      return m.menacwyBoosterYears(p);
    }),
  };
});

const { recommend } = await import('../recommend.js');
const { analyzeHistory } = await import('../validate.js');

const TODAY = '2026-11-19';
const RISKS = [['asplenia'], ['complement'], ['hiv'], ['travel'], ['outbreak_acwy'], ['microbiologist']];
const MV = 'Menveo 2-vial (MenACWY)';
const MQ = 'MenQuadfi (MenACWY)';
// Ages in months: infants, the 2-year line, under and over 7, teens, adults.
const AGES = [4, 9, 18, 30, 60, 83, 85, 120, 180, 240];

// Histories built back from today. Each mixes in the entries that could leave an
// age unknown: a dose with no date, a "details unknown" row, a brand with no date.
function back(months) {
  const d = new Date(Date.UTC(2026, 10 - months, 19));
  return d.toISOString().slice(0, 10);
}
const HISTORIES = [
  [{ date: back(60), brand: MV }, { date: back(57), brand: MV }],
  [{ date: back(60), brand: MV }, { brand: MV }],
  [{ date: back(60), brand: MV }, { detailsUnknown: true }],
  [{ brand: MQ }, { date: back(40), brand: MQ }],
  [{ date: back(100), brand: MV }, { date: back(97), brand: MV }, { date: back(40), brand: MQ }],
  [{ date: back(100), brand: MV }, { date: back(97) }, { brand: MV }],
  [{ date: back(3), brand: MV }],
];

describe('T2: no patient reaches the unknown-completion-age fallback', () => {
  let patients = 0;
  for (const riskIds of RISKS) {
    for (const ageMonths of AGES) {
      for (const history of HISTORIES) {
        // Keep only doses given after birth, so the patients are possible ones.
        const doses = history.filter((d) => !d.date || d.date >= back(ageMonths));
        const answers = Object.fromEntries(doses.map((_, i) => [i, 'yes']));
        for (const dob of [null, back(ageMonths)]) {
          recommend({ today: TODAY, dob, ageMonths, riskIds, menacwyDoses: doses, menbDoses: [],
            riskAtDoseAnswers: { MenACWY: answers } });
          analyzeHistory('MenACWY', doses, ageMonths, riskIds, TODAY, answers, dob);
          patients++;
        }
      }
    }
  }

  it('the sweep reaches the first-booster rule (not a vacuous pass)', () => {
    expect(patients).toBeGreaterThan(800);
    expect(seen.first.length + seen.viaBooster.length).toBeGreaterThan(50);
  });

  it('every first booster is timed from a known age', () => {
    const unknown = [...seen.first, ...seen.viaBooster].filter((a) => a == null);
    expect(unknown.length).toBe(0);
  });
});
