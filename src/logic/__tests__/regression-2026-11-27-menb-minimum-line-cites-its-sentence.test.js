// MENB-MIN-CITE (2026-11-27) — the MenB "minimum beside the routine date"
// sentence carries a source number.
//
// FOUND (handoff 2026-11-27, "seen, not checked"): MenB dose 2's "Earliest valid
// date: Dec 1, 2026 (minimum interval 4 weeks)." had no source number, and
// neither did its other form, "It can be given today if needed, as the minimum
// interval of 4 weeks has passed." The same sentence on a repeated dose 3,
// "(minimum interval 4 months after the invalid dose)", had none either.
// All three come from one helper (intervals.js minimumBesideRoutine).
//
// The sentences cited are already in refs.js, and already cite the same claim
// elsewhere on these cards:
//   dose 2, 4 weeks: acip2020MenbRepeat4Weeks (ACIP 2020), the sentence the
//     card's own "(minimum 4 weeks [c])" form has cited since C11 (owner C8),
//     and the MENB-REPEAT-GAP row's first source.
//   dose 3 repeat, 4 months after the invalid dose: menbHighRiskEarlyD3Unless
//     (ACIP Oct 2024, mm7349a3), cited by the same card's lead sentence.
//   dose 3 repeat held to 4 weeks after a dose that did not count:
//     acip2020MenbRepeat4Weeks.
//
// Citation only (owner Q12, 2026-11-21): no dose, date or status moves.
// Not here: the infant MenACWY form of this sentence ("(minimum interval 8
// weeks)"), shown only to a series begun at 2 months. No sentence read so far
// states 8 weeks for a 2-month start (the CDC and ACIP 8-week sentences are
// about a 3–6-month start); that is an owner question.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const run = (menbDoses, today, riskIds = ['asplenia']) => recommend({
  dob: '2006-01-01', today, riskIds, menacwyDoses: [], menbDoses,
});

// The key cited by the [c] inside the sentence that matches `re`, read in the
// order the card shows them (lead, then "Why this").
function keyFor(card, re) {
  const text = `${card.note.lead} ${card.note.detail ?? ''}`;
  const sentences = text.split(/(?<=\.)\s+/);
  let before = 0;
  for (const s of sentences) {
    const marks = (s.match(/\[c\]/g) ?? []).length;
    if (re.test(s)) {
      expect(marks, s).toBe(1);
      return card.noteCites[before]?.key;
    }
    before += marks;
  }
  throw new Error(`no sentence matches ${re}`);
}

describe('MENB-MIN-CITE: the MenB minimum beside the routine date cites its sentence', () => {
  it('dose 2, before the minimum: "Earliest valid date … (minimum interval 4 weeks)" cites ACIP\'s 4 weeks', () => {
    const card = run([B('2026-11-03')], '2026-11-20').menb[0];
    expect(card.note.lead).toMatch(/^Earliest valid date: Dec 1, 2026 \(minimum interval 4 weeks\) \[c\]\.$/);
    expect(keyFor(card, /Earliest valid date/)).toBe('acip2020MenbRepeat4Weeks');
  });

  it('dose 2, past the minimum: "It can be given today if needed …" cites ACIP\'s 4 weeks', () => {
    const card = run([B('2026-11-03')], '2026-12-02').menb[0];
    expect(card.note.lead).toMatch(/minimum interval of 4 weeks has passed \[c\]\.$/);
    expect(keyFor(card, /can be given today/)).toBe('acip2020MenbRepeat4Weeks');
  });

  it('dose 2 in pregnancy: the pregnancy marks keep their own sentences', () => {
    const card = run([B('2026-11-03')], '2026-11-20', ['asplenia', 'pregnancy']).menb[0];
    expect(keyFor(card, /Earliest valid date/)).toBe('acip2020MenbRepeat4Weeks');
    expect(card.noteCites.map((c) => c.key).slice(-2)).toEqual(['menbPregnancyDeferral', 'cdcAdultMenbPregnancyMayGive']);
  });

  it('the schedule sentence keeps its own source (control)', () => {
    const card = run([B('2026-11-03')], '2026-11-20').menb[0];
    expect(keyFor(card, /^Give dose 2/)).toBe('menbHighRisk3DoseSchedule');
  });

  it('a repeated dose 3: "(minimum interval 4 months after the invalid dose)" cites ACIP Oct 2024', () => {
    const card = run([B('2026-01-01'), B('2026-02-01'), B('2026-02-20')], '2026-03-01').menb[0];
    expect(card.note.lead).toMatch(/^Earliest valid date: Jun 20, 2026 \(minimum interval 4 months after the invalid dose\) \[c\]\.$/);
    expect(keyFor(card, /Earliest valid date/)).toBe('menbHighRiskEarlyD3Unless');
  });

  it('no date or status moved (the dates are the ones the minimum gives)', () => {
    const d2 = run([B('2026-11-03')], '2026-11-20').menb[0];
    expect(d2.earliestNextDate).toBe('2026-12-03');
    expect(d2.dueToday).toBe(false);
    const d3 = run([B('2026-01-01'), B('2026-02-01'), B('2026-02-20')], '2026-03-01').menb[0];
    expect(d3.earliestNextDate).toBe('2026-07-01');
  });
});
