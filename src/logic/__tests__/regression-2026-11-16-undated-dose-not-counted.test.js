// Port Phase 3, family 2 — STOP C answer C1 (owner, 2026-11-15): a dose
// recorded with NO DATE does not count. The chip says so, and the card
// schedules as if the dose had not been given. C17 goes with it: the row that
// judged a high-risk MenB dose 2 after an undated dose 1 is removed, because an
// undated dose 1 is no longer dose 1.
//
// Source, read live 2026-11-16 (CDC General Best Practices, Timing and Spacing
// of Immunobiologics, "Unknown or uncertain vaccination status"):
//   "With the exception of influenza vaccine and PPSV23, providers should only
//    accept written, dated records as evidence of vaccination"
//   "If records cannot be located within a reasonable time, these persons
//    should be considered susceptible and started on the age-appropriate
//    vaccination schedule."
//
// Before this change the app counted an undated dose (never as a timing
// anchor). PneumoVax still does for PCV; the owner asked for the same question
// to be put to her there (C1 follow-up) — not changed by this file.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], ...input });
const askingCard = (recs) => recs.find((c) => c.dueToday || c.earliestNextDate);
const verdicts = (r, v) => r.history[v].perDose.map((p) => (p.effectiveDoseNum ? `dose ${p.effectiveDoseNum}` : p.status));
const chips = (r, v, total) => r.history[v].perDose.map((p) => doseChipLabel(p, total));

describe('C1: the STOP C packet patient — 20 y, asplenia, Menveo with no date, Menveo 2026-01-10', () => {
  const base = { dob: '2006-03-01', today: '2026-11-16', riskIds: ['asplenia'] };
  const undated = { date: '', brand: 'Menveo' };
  const dated = { date: '2026-01-10', brand: 'Menveo' };

  it('the undated dose does not count; the dated one is dose 1', () => {
    const r = run({ ...base, menacwyDoses: [undated, dated] });
    expect(verdicts(r, 'MenACWY')).toEqual(['invalid', 'dose 1']);
  });

  it('its chip says there is no date and it is not counted', () => {
    const r = run({ ...base, menacwyDoses: [undated, dated] });
    expect(chips(r, 'MenACWY', 2)[0]).toBe('No date recorded — not counted');
  });

  it('it does not ask to repeat a dose (no dose is known to have been given at a wrong time)', () => {
    const r = run({ ...base, menacwyDoses: [undated, dated] });
    const text = r.history.MenACWY.perDose[0].reasons.join(' ');
    expect(text).not.toMatch(/repeat this dose/i);
    expect(text).toMatch(/Only dated records count/);
  });

  it('the card: dose 2 is due today — the same answer as the control without the undated row', () => {
    const r = run({ ...base, menacwyDoses: [undated, dated] });
    const control = run({ ...base, menacwyDoses: [dated] });
    expect(askingCard(r.menacwy)?.dueToday).toBe(true);
    expect(askingCard(r.menacwy)?.title).toBe(askingCard(control.menacwy)?.title);
    expect(r.menacwy[0].status).toBe(control.menacwy[0].status);
  });
});

describe('C1: a "dose given, details unknown" tick is kept on the record but not counted', () => {
  it('healthy 17-year-old, one ticked row: the card is the same as with no doses', () => {
    const base = { dob: '2009-09-15', today: '2026-11-16', riskIds: [] };
    const r = run({ ...base, menacwyDoses: [{ date: '', brand: '', detailsUnknown: true }] });
    const control = run(base);
    expect(verdicts(r, 'MenACWY')).toEqual(['invalid']);
    expect(r.menacwy[0].status).toBe(control.menacwy[0].status);
    expect(r.menacwy[0].title).toBe(control.menacwy[0].title);
  });
});

describe('C1 + C17: MenB with no date', () => {
  const base = { dob: '2008-01-01', today: '2026-11-16', riskIds: ['asplenia'] };

  it('high-risk: undated Bexsero then Bexsero 2026-06-01 — the dated one is dose 1, the next dose is dose 2', () => {
    const r = run({ ...base, menbDoses: [{ date: '', brand: 'Bexsero' }, { date: '2026-06-01', brand: 'Bexsero' }] });
    expect(verdicts(r, 'MenB')).toEqual(['invalid', 'dose 1']);
    const control = run({ ...base, menbDoses: [{ date: '2026-06-01', brand: 'Bexsero' }] });
    expect(askingCard(r.menb)?.title).toBe(askingCard(control.menb)?.title);
  });

  it('an undated dose of the OTHER family does not lock the family: Trumenba (no date), then Bexsero counts', () => {
    const r = run({ ...base, menbDoses: [{ date: '', brand: 'Trumenba' }, { date: '2026-06-01', brand: 'Bexsero' }] });
    expect(verdicts(r, 'MenB')).toEqual(['invalid', 'dose 1']);
  });

  it('C17: the "dose 1 has no date" row is gone from the rule table', async () => {
    const { DOSE_RULES } = await import('../doseRules.js');
    // extinct: the row was removed on purpose (C17, with C1), 2026-11-16.
    expect(DOSE_RULES.map((x) => x.id)).not.toContain('MENB-HIGHRISK-DOSE-2-UNVERIFIABLE');
  });
});

describe('C1: a dated record is unchanged (control)', () => {
  it('healthy 17-year-old with MenQuadfi at 12: booster due, dose counts', () => {
    const r = run({ dob: '2009-09-15', today: '2026-11-16', riskIds: [], menacwyDoses: [{ date: '2021-09-15', brand: 'MenQuadfi' }] });
    expect(verdicts(r, 'MenACWY')).toEqual(['dose 1']);
  });
});
