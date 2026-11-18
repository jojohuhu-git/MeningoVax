// Port Phase 5 — two consequences of STOP F1 Q9a, answered by the owner 2026-11-18.
//
// Q9a (2026-11-17) made MenB high-risk dose 2 DUE 1 month after dose 1, with the
// 4-week minimum stated beside it. Two things followed that were asked, not assumed
// (docs/archive/decisions-2026-11-17-open-questions.md, "Q9a consequences"):
//
// F2a — the combined shot in the gap. Asplenia, 20 y, Bexsero 11/3/26, no MenACWY.
//   On Dec 1–2 MenACWY dose 1 is due and MenB dose 2 "can be given today if needed".
//   Before Q9a the app offered Penmenvy on those days; after Q9a it did not.
//   Owner: OFFER IT. Sources read live 2026-11-18:
//     ACIP Penmenvy MMWR (mm7501a2): "may be used when both MenACWY and MenB are
//       indicated at the same visit"
//     CDC adult notes (July 2, 2025): "when both vaccines would be given on the same
//       clinic day"
//
// F2b — the switch line. Asplenia, 20 y, Bexsero 9/1/26 then Trumenba 11/3/26.
//   Its line gave the routine date worded "from" (reads as earliest).
//   Owner: say "due <date>", matching the card's "Next dose due <date>".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const run = (input) => recommend({ menacwyDoses: [], menbDoses: [], riskIds: [], ...input });
const lead = (c) => (typeof c?.note === 'string' ? c.note : c?.note?.lead ?? '');
const B = (date) => ({ date, brand: 'Bexsero (MenB)' });
const T = (date) => ({ date, brand: 'Trumenba (MenB)' });
const M = (date) => ({ date, brand: 'Menveo (MenACWY)' });
const HR = { dob: '2006-01-01', riskIds: ['asplenia'] };

describe('F2a — the combined shot is offered once MenB dose 2\'s minimum has passed', () => {
  for (const today of ['2026-12-01', '2026-12-02']) {
    it(`owner's patient on ${today}: Penmenvy offered; the panel says MenB can be given today`, () => {
      const r = run({ ...HR, today, menbDoses: [B('2026-11-03')] });
      expect(r.menb[0].dueToday).toBe(false);
      expect(r.menb[0].earliestNextDate).toBe('2026-12-03');
      expect(r.menb[0].canGiveToday).toBe(true);
      expect(r.pentavalent.eligible).toBe(true);
      expect(r.pentavalent.brands).toEqual(['Penmenvy (MenABCWY)']);
      expect(r.pentavalent.note.lead).toBe(
        'MenACWY is due today; MenB dose 2 can be given today (its 4-week minimum has passed). '
        + 'One pentavalent (MenABCWY) dose may replace both.',
      );
    });
  }

  it('Trumenba the same way: Penbraya offered on Dec 1', () => {
    const r = run({ ...HR, today: '2026-12-01', menbDoses: [T('2026-11-03')] });
    expect(r.pentavalent.eligible).toBe(true);
    expect(r.pentavalent.brands).toEqual(['Penbraya (MenABCWY)']);
  });

  it('before the minimum (Nov 30): no combined shot, unchanged', () => {
    const r = run({ ...HR, today: '2026-11-30', menbDoses: [B('2026-11-03')] });
    expect(r.menb[0].canGiveToday).toBeUndefined();
    expect(r.pentavalent.eligible).toBe(false);
  });

  it('on the routine date (Dec 3): both due, the usual "both are due" note, unchanged', () => {
    const r = run({ ...HR, today: '2026-12-03', menbDoses: [B('2026-11-03')] });
    expect(r.menb[0].dueToday).toBe(true);
    expect(r.menb[0].canGiveToday).toBeUndefined();
    expect(r.pentavalent.note.lead).toMatch(/^Both MenACWY and MenB are due today/);
  });

  it('control: the same patient who also had Menveo 11/3 — MenACWY not due, no combined shot', () => {
    const r = run({ ...HR, today: '2026-12-01', menbDoses: [B('2026-11-03')], menacwyDoses: [M('2026-11-03')] });
    expect(r.menb[0].canGiveToday).toBe(true);
    expect(r.pentavalent.eligible).toBe(false);
  });
});

describe('F2b — the switch line says "due <date>"', () => {
  it('owner\'s patient on Dec 1: "Or finish with Trumenba instead: dose 2 due Dec 3, 2026"', () => {
    const c = run({ ...HR, today: '2026-12-01', menbDoses: [B('2026-09-01'), T('2026-11-03')] }).menb[0];
    expect(lead(c)).toContain('Or finish with Trumenba instead: dose 2 due Dec 3, 2026 (the Bexsero dose then does not count)');
    // extinct: the switch line's "from <date>" wording, removed by owner F2b, 2026-11-18
    expect(lead(c)).not.toMatch(/instead: dose 2 from/);
  });

  it('on Dec 3: "today", unchanged', () => {
    const c = run({ ...HR, today: '2026-12-03', menbDoses: [B('2026-09-01'), T('2026-11-03')] }).menb[0];
    expect(lead(c)).toContain('Or finish with Trumenba instead: dose 2 today');
  });

  it('control, healthy 16 y with the same doses: "due May 3, 2027"', () => {
    const c = run({ dob: '2010-01-01', today: '2026-12-01', menbDoses: [B('2026-09-01'), T('2026-11-03')] }).menb[0];
    expect(lead(c)).toContain('Or finish with Trumenba instead: dose 2 due May 3, 2027');
  });
});
