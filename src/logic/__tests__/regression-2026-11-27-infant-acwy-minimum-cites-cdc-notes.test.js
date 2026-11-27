// INFANT-MIN-CITE (owner, 2026-11-27, "CDC Notes sentence") — the infant
// MenACWY sentences that state the 8-week and 12-week gaps carry a source
// number, opening CDC's Child/Adolescent Notes.
//
// FOUND (handoff 2026-11-27): these carried no number:
//   dose 1 card (start at 2–6 months): "Early doses are ≥8 weeks apart. The
//     final dose is at ≥12 months and ≥12 weeks after the one before."
//   doses 2–3 of a series begun at 2 months: "It can be given today if needed,
//     as the minimum interval of 8 weeks has passed." / "Earliest valid date:
//     … (minimum interval 8 weeks)." and "The final dose of the series comes at
//     12 months or older, and at least 12 weeks after the one before it."
//   the continuing card (start at 3–6 months): the same final-dose sentence.
//
// SOURCE: CDC Child/Adolescent Notes, `cdcChildAcwyInfantSeries`: "dose 2 [and
// dose 3 if applicable] at least 8 weeks after previous dose until a dose is
// received at age 7 months or older, followed by an additional dose at least
// 12 weeks later and after age 12 months". Written in CDC's "Dose 1 at age 3–6
// months" row; no sentence read states 8 weeks for a 2-month start (CDC's
// catch-up table, read live 2026-11-27, gives 8 weeks for dose 1 → 2 only).
// Owner asked, 2026-11-27, with the worked patient below: "CDC Notes
// sentence". The rule row ACWY-INFANT-SERIES-GAP already rests on it, and C11
// already cites it for "at least 8 weeks between the early doses".
//
// For the groups CDC's notes speak for (complement, asplenia, HIV, travel).
// An outbreak-only baby keeps C11's choice: no CDC number.
// Citation only: no dose, date or status moves.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const MV = (date) => ({ date, brand: 'Menveo 2-vial (MenACWY)' });
const CDC = 'cdcChildAcwyInfantSeries';
const run = ({ dob, today, riskIds, doses = [] }) => recommend({
  dob, today, riskIds, menacwyDoses: doses, menbDoses: [],
  riskAtDoseAnswers: { MenACWY: Object.fromEntries(doses.map((_, i) => [i, true])) },
}).menacwy[0];

// The key behind the [c] in the sentence matching `re` (lead, then "Why this").
function keyFor(card, re) {
  const sentences = `${card.note.lead} ${card.note.detail ?? ''}`.trim().split(/(?<=\.)\s+/);
  let before = 0;
  for (const s of sentences) {
    const marks = (s.match(/\[c\]/g) ?? []).length;
    if (re.test(s)) return marks === 1 ? card.noteCites[before]?.key : `${marks} marks`;
    before += marks;
  }
  return 'no such sentence';
}

describe('INFANT-MIN-CITE: infant MenACWY gaps cite CDC\'s Notes', () => {
  it('owner\'s patient: complement, born Aug 1, Menveo Oct 1, seen Nov 27, "can be given today … 8 weeks" opens CDC', () => {
    const c = run({ dob: '2026-08-01', today: '2026-11-27', riskIds: ['complement'], doses: [MV('2026-10-01')] });
    expect(c.doseLabel).toBe('Dose 2 (infant high-risk series)');
    expect(c.earliestNextDate).toBe('2026-12-01');
    expect(c.note.lead).toBe('It can be given today if needed, as the minimum interval of 8 weeks has passed [c].');
    expect(keyFor(c, /minimum interval of 8 weeks/)).toBe(CDC);
    expect(keyFor(c, /^The final dose of the series/)).toBe(CDC);
    expect(keyFor(c, /^Continue the/)).toBe('acwyInfantHighRisk2to6mo');
  });

  it('same baby on Nov 20: "Earliest valid date: Nov 26 (minimum interval 8 weeks)" opens CDC', () => {
    const c = run({ dob: '2026-08-01', today: '2026-11-20', riskIds: ['complement'], doses: [MV('2026-10-01')] });
    expect(c.note.lead).toBe('Earliest valid date: Nov 26, 2026 (minimum interval 8 weeks) [c].');
    expect(keyFor(c, /Earliest valid date/)).toBe(CDC);
  });

  it.each([['complement'], ['asplenia'], ['hiv'], ['travel']])('%s, 2 months, no doses: both gap sentences on the dose 1 card open CDC', (risk) => {
    const c = run({ dob: '2026-09-25', today: '2026-11-27', riskIds: [risk] });
    expect(c.doseLabel).toMatch(/^Dose 1 of 4/);
    expect(keyFor(c, /^Early doses are ≥8 weeks apart/)).toBe(CDC);
    expect(keyFor(c, /^The final dose is at ≥12 months/)).toBe(CDC);
    expect(keyFor(c, /^Start the four-dose infant series/)).toBe('acwyInfantHighRisk2to6mo');
  });

  it('asplenia, Menveo at 4 months: the continuing card\'s final-dose sentence opens CDC', () => {
    const c = run({ dob: '2026-06-01', today: '2026-11-27', riskIds: ['asplenia'], doses: [MV('2026-10-01')] });
    // C11's sentence holds two marks: ACIP's row on "the series", CDC on the 8 weeks.
    expect(`${c.note.lead} ${c.note.detail}`).toContain('Continue the infant high-risk series [c], with at least 8 weeks between the early doses [c].');
    expect(keyFor(c, /^The final dose of the series/)).toBe(CDC);
    expect(c.noteCites.map((x) => x.key)).toEqual(['acwyInfantHighRisk2to6mo', CDC, CDC]);
  });

  it('control: an outbreak-only baby keeps C11\'s choice, no CDC number', () => {
    const d1 = run({ dob: '2026-09-25', today: '2026-11-27', riskIds: ['outbreak_acwy'] });
    const d2 = run({ dob: '2026-08-01', today: '2026-11-27', riskIds: ['outbreak_acwy'], doses: [MV('2026-10-01')] });
    for (const c of [d1, d2]) expect(c.noteCites.map((x) => x.key)).not.toContain(CDC);
    expect(d2.note.lead).toBe('It can be given today if needed, as the minimum interval of 8 weeks has passed.');
  });
});
