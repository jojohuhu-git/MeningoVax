// ─────────────────────────────────────────────────────────────────────────
// Review v10, Batch 2b (owner answers 2026-11-20, "Approve them all";
// docs/archive/decisions-2026-11-20-review-v10.md): card lead sentences and
// "Why this" text, P31–P52 (P40 was built in #122) and P75.
//
// Owner rulings the same day: style rule 4 kept (each approved ";" became a
// period or comma); one-sentence notes allowed when they fold whole behind
// "Why this" (P43, P49, P50). The Q10 stay-in-view list follows the new
// wording of P34, P35, P36, so those lines still show on the card.
//
// The checks read the card as the clinician does: the note's lead and detail
// together, with the [c] markers removed.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-20';
const run = (input) => recommend({ today: TODAY, menacwyDoses: [], menbDoses: [], riskIds: [], ...input });
const say = (card) => {
  const n = card?.note;
  const t = typeof n === 'object' && n ? `${n.lead ?? ''} ${n.detail ?? ''}` : (n ?? '');
  return t.replace(/\s*\[c\]/g, '').replace(/\s+/g, ' ').trim();
};
const lead = (card) => (card?.note?.lead ?? '').replace(/\s*\[c\]/g, '').trim();
const MV = (date) => ({ brand: 'Menveo 2-vial', date });
const YES = { riskAtDoseAnswers: { MenACWY: { 0: 'yes' }, MenB: { 0: 'yes' } } };

describe('Review v10 Batch 2b: card leads and "Why this"', () => {
  it('P31: healthy 12-year-old, MenB', () => {
    expect(say(run({ dob: '2014-06-01' }).menb[0])).toContain('MenB is not routine at this age. A healthy patient may choose it from 16 years.');
  });

  it('P32 and P52: the combined-shot note', () => {
    const p = run({ dob: '2009-06-01' }).pentavalent;
    const t = say(p);
    expect(t).toContain('MenACWY is due today, and MenB may be offered (shared clinical decision-making). One MenABCWY injection can replace both.');
    expect(t).toContain('After Penmenvy, continue MenB with Bexsero or Penmenvy. After Penbraya, continue with Trumenba or Penbraya.');
    // extinct: the antigen names and "optional today", retired by P32/P52.
    expect(t).not.toMatch(/MenB-4C|MenB-FHbp|optional today/);
  });

  it('P33: a dose at 16 or older completes the schedule', () => {
    const t = say(run({ dob: '2008-06-01', menacwyDoses: [MV('2019-07-01'), MV('2024-07-01')] }).menacwy[0]);
    // This patient reaches P33's sibling ("…completes the routine adolescent
    // schedule"), which took the same unit fix.
    expect(t).toMatch(/^A MenACWY dose at age 16 years or older completes the (routine )?adolescent schedule\./);
  });

  it('P35: the repeat after an invalid dose says "invalid dose"', () => {
    const t = say(run({ dob: '2026-09-01', riskIds: ['asplenia'], menacwyDoses: [{ brand: '', date: '2026-10-14' }] }).menacwy[0]);
    expect(t).toContain('Not before Dec 9, 2026: 8 weeks after the invalid dose of Oct 14, 2026.');
    // extinct: "which did not count" on the card, retired by P35.
    expect(t).not.toContain('which did not count');
  });

  it('P36: the other-product line, and it stays on the card (Q10 list)', () => {
    const b = run({ dob: '2009-06-01', menacwyDoses: [MV('2020-07-01'), MV('2025-07-01')],
      menbDoses: [{ brand: 'Bexsero', date: '2026-01-05' }, { brand: 'Trumenba', date: '2026-08-01' }] }).menb[0];
    expect(lead(b)).toMatch(/Or complete the series with Trumenba: dose 2 (today|due [A-Z][a-z]{2} \d{1,2}, \d{4}), and the Bexsero dose no longer counts\./);
  });

  it('P37: healthy 17-year-old, no doses', () => {
    expect(say(run({ dob: '2009-06-01' }).menacwy[0])).toBe('One MenACWY dose now. A first dose at 16 years or older needs no booster.');
  });

  it('P38: series ended at 7 or older', () => {
    const t = say(run({ dob: '2012-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2024-01-10'), MV('2024-03-10')] }).menacwy[0]);
    expect(t).toBe('Series complete. The first booster is 5 years later because the series ended at 7 years or older.');
  });

  it('P41 and P46: the high-risk MenB series names products, not antigen families', () => {
    const d1 = say(run({ dob: '2014-06-01', riskIds: ['asplenia'] }).menb[0]);
    expect(d1).toBe('A three-dose MenB series at 0, 1–2 and 6 months. Use one product for every dose: Bexsero (or Penmenvy), or Trumenba (or Penbraya).');
    const d2 = say(run({ dob: '2014-06-01', riskIds: ['asplenia'], menbDoses: [{ brand: 'Bexsero', date: '2026-09-01' }], ...YES }).menb[0]);
    expect(d2).toContain('Give dose 2 1–2 months after dose 1');
    expect(d2).toContain('with the same MenB product, and dose 3 about 6 months after dose 1.');
    // extinct: the antigen-family wording, retired by P41/P46.
    expect(d1 + d2).not.toMatch(/antigen family|MenB-4C|MenB-FHbp/);
  });

  it('P42: healthy 17-year-old, MenB by shared decision', () => {
    expect(say(run({ dob: '2009-06-01' }).menb[0])).toBe('Two MenB doses 6 months apart, by shared clinical decision-making. '
      + 'Preferred age 16–18 years, given until the 24th birthday. For faster protection (for example, college entry within 6 months), give three doses at 0, 1–2 and 6 months.');
  });

  it('P43: high-risk 5-year-old, one sentence', () => {
    expect(say(run({ dob: '2021-06-01', riskIds: ['asplenia'] }).menacwy[0])).toBe('Two MenACWY doses, at least 8 weeks apart, for this high-risk condition.');
  });

  it('P44: high-risk infant at 3 months', () => {
    expect(say(run({ dob: '2026-08-15', riskIds: ['asplenia'] }).menacwy[0])).toBe('Start the four-dose infant series at 2, 4, 6 and 12 months. '
      + 'Early doses are ≥8 weeks apart. The final dose is at ≥12 months and ≥12 weeks after the one before.');
  });

  it('P45: high-risk dose 2', () => {
    expect(say(run({ dob: '2021-06-01', riskIds: ['asplenia'], menacwyDoses: [MV('2026-09-01')], ...YES }).menacwy[0]))
      .toBe('Dose 2, at least 8 weeks after dose 1. A late dose 2 still counts. Do not restart. Boosters follow while the risk lasts.');
  });

  it('P49: college, no dose at 16 or older', () => {
    expect(say(run({ dob: '2008-06-01', riskIds: ['college_dorm'] }).menacwy[0])).toBe('One MenACWY dose before college entry, since none is on record at 16 years or older.');
  });

  it('P75: high-risk infant under 2 months', () => {
    const t = say(run({ dob: '2026-10-15', riskIds: ['asplenia'] }).menacwy[0]);
    expect(t).toContain('The infant series starts at 2 months, so nothing is due yet.');
    // extinct: the false "earliest any MenACWY vaccine" sentence (a MenQuadfi dose from 6 weeks counts).
    expect(t).not.toContain('The earliest any MenACWY vaccine may be given');
  });
});
