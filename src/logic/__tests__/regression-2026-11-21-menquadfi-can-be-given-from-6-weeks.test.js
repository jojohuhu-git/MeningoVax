// MenQuadfi can be given from 6 weeks (owner, 2026-11-21).
//
// A high-risk, travelling or outbreak baby aged 6 weeks to under 2 months, with
// no MenACWY yet, was told "Not yet due (from 2 months)". AAP 2026 schedule,
// MenACWY notes (owner's copy, read 2026-11-21): "(minimum age: 6 weeks
// [MenACWY-TT, MenQuadfi], 2 months [MenACWY-CRM, Menveo])" and "Dose 1 at age
// 2 months: 4-dose series (additional 3 doses at age 4, 6, and 12 months). The
// first dose of MenQuadfi may be given as early as 6 weeks."
//
// Owner's answers: "Can be given (Rec.)" — badge "Can be given today",
// MenQuadfi only, dose 1 still due at 2 months; and "Yes, outbreak too".
// Decisions file: docs/archive/decisions-2026-11-21-menquadfi-from-6-weeks.md.
//
// Without a date of birth the app knows only whole months, so it cannot tell a
// 5-week-old from a 7-week-old: the offer needs a date of birth.
import { describe, it, expect } from 'vitest';
import { recommend, recommendBeforeFold } from '../recommend.js';
import { statusPillLabel } from '../../components/RecCard.jsx';
import { MENACWY_LICENCE_MIN_AGE_DAYS } from '../../data/brands.js';

const TODAY = '2026-11-21';
const card = (input) => recommend({ today: TODAY, menacwyDoses: [], menbDoses: [], ...input }).menacwy[0];
const LEAD = 'The infant series starts at 2 months; MenQuadfi may be given from 6 weeks [c].';

describe('a high-risk baby of 7 weeks (born 3 Oct 2026, seen 21 Nov 2026)', () => {
  const c = card({ dob: '2026-10-03', riskIds: ['asplenia'] });

  it('can be given MenQuadfi today, and only MenQuadfi', () => {
    expect(c.canGiveToday).toBe(true);
    expect(c.dueToday).toBe(false);
    expect(statusPillLabel(c, false)).toBe('Can be given today');
    expect(c.brands).toEqual(['MenQuadfi (MenACWY)']);
  });

  it('still has dose 1 due at 2 months, of the four-dose series', () => {
    expect(c.doseLabel).toBe('Dose 1 of 4 (infant high-risk)');
    expect(c.earliestNextDate).toBe('2026-12-03');
    // The Q10 fold (owner's stay-in-view list, 2026-11-19) puts it first
    // behind "Why this", as it does the 2-month card's lead. Whether it should
    // stay in view is an open owner question (not on her list).
    const beforeFold = recommendBeforeFold({ today: TODAY, dob: '2026-10-03', riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] }).menacwy[0];
    expect(beforeFold.note.lead).toBe(LEAD);
    expect(c.note.detail.startsWith(LEAD)).toBe(true);
  });
});

describe('travel and outbreak babies get the same offer (owner: "Yes, outbreak too")', () => {
  it('travel', () => {
    const c = card({ dob: '2026-10-03', riskIds: ['travel'] });
    expect(statusPillLabel(c, false)).toBe('Can be given today');
    expect(c.brands).toEqual(['MenQuadfi (MenACWY)']);
    expect(c.doseLabel).toBe('Dose 1 of 4 (infant travel)');
  });
  it('outbreak', () => {
    const c = card({ dob: '2026-10-03', riskIds: ['outbreak_acwy'] });
    expect(statusPillLabel(c, false)).toBe('Can be given today');
    expect(c.brands).toEqual(['MenQuadfi (MenACWY)']);
    expect(c.doseLabel).toBe('Dose 1 of 4 (infant outbreak)');
  });
});

describe('the 6-week line', () => {
  it('is the licence floor the dose rules already use', () => {
    expect(MENACWY_LICENCE_MIN_AGE_DAYS).toBe(42);
  });
  it('day 42 (born 10 Oct 2026): offered', () => {
    expect(card({ dob: '2026-10-10', riskIds: ['asplenia'] }).canGiveToday).toBe(true);
  });
  it('day 41 (born 11 Oct 2026): not yet — the card is unchanged', () => {
    const c = card({ dob: '2026-10-11', riskIds: ['asplenia'] });
    expect(c.canGiveToday).toBeUndefined();
    expect(c.doseLabel).toBe('Not yet due (from 2 months)');
    expect(c.brands).toEqual([]);
  });
});

describe('controls: unchanged', () => {
  it('a healthy 7-week-old: not yet due, nothing offered', () => {
    const c = card({ dob: '2026-10-03', riskIds: [] });
    expect(c.canGiveToday).toBeUndefined();
    expect(c.doseLabel).toBe('Not yet due');
  });
  it('the same high-risk baby at 2 months: dose 1 due today, Menveo or MenQuadfi', () => {
    const c = recommend({ today: '2026-12-03', dob: '2026-10-03', riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] }).menacwy[0];
    expect(c.dueToday).toBe(true);
    expect(c.doseLabel).toBe('Dose 1 of 4 (infant high-risk)');
    expect(c.brands).toContain('MenQuadfi (MenACWY)');
    expect(c.brands.some((b) => b.startsWith('Menveo'))).toBe(true);
  });
  it('age entered as 1 month with no date of birth: not offered (6 weeks cannot be confirmed)', () => {
    const c = recommend({ today: TODAY, ageMonths: 1, riskIds: ['asplenia'], menacwyDoses: [], menbDoses: [] }).menacwy[0];
    expect(c.canGiveToday).toBeUndefined();
    expect(c.doseLabel).toBe('Not yet due (from 2 months)');
  });
});
