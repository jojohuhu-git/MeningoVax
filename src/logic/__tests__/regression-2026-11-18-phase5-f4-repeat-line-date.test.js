// Port Phase 5, F-4a and F-4b (owner, 2026-11-18): a "Not counted — repeat"
// line says WHEN, or that it already was.
//
// Found by the Phase 5 measurement (report-2026-11-18-phase5-measured.md, F-4):
// a too-soon dose line ended "repeat this dose only (do not restart the
// series)." with no date; only the card had one. Measured over the saved
// patients: 12,148 such lines, 4,936 of them with the repeat already on the
// record.
//
// Source read live 2026-11-18, CDC Timing and Spacing (July 24, 2024): "The
// repeat dose should be spaced after the invalid dose by the recommended
// minimum interval (Table 3-2)."
//
// Owner:
// - F-4a: the line ends "Repeat from <date>." with the CARD's own date (read
//   from the card, never computed a second time, so the two cannot disagree).
//   A card with no date (not yet due, deferred) leaves the line as it was.
// - F-4b: when a later dose of that vaccine is on the record (counted or not),
//   "repeat this dose only …" becomes "Repeated on <date>. See that dose." as
//   in PneumoVax (its ruling 2026-10-31). The chip stays "Not counted — repeat".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const TODAY = '2026-11-18';
const DOB = '2013-05-01'; // 13
const q = (...dates) => dates.map((date) => ({ date, brand: 'MenQuadfi (MenACWY)' }));
const run = (doses, extra = {}) =>
  recommend({ today: TODAY, dob: DOB, riskIds: ['asplenia'], menacwyDoses: doses, menbDoses: [], ...extra });
const lineOf = (r, i, v = 'MenACWY') => r.history[v].perDose[i];

const REPEAT_THIS_DOSE = 'This dose does not count toward the series: repeat this dose only (do not restart the series).';

describe('F-4a: the repeat line gives the card\'s date', () => {
  it('Leo: Oct 1 and Oct 22 (3 weeks apart) -> "Repeat from Dec 17, 2026." matching the card', () => {
    const r = run(q('2026-10-01', '2026-10-22'));
    const d = lineOf(r, 1);
    expect(d.status).toBe('invalid');
    expect(r.menacwy[0].earliestNextDate).toBe('2026-12-17');
    expect(d.reasons).toContain(REPEAT_THIS_DOSE);
    expect(d.reasons.at(-1)).toBe('Repeat from Dec 17, 2026.');
  });

  it('a repeat due today reads today\'s date', () => {
    const r = run(q('2026-08-01', '2026-08-22'));
    expect(r.menacwy[0].dueToday).toBe(true);
    expect(lineOf(r, 1).reasons.at(-1)).toBe('Repeat from Nov 18, 2026.');
  });

  it('a card with no date leaves the line as it was (pregnancy: deferred)', () => {
    const r = recommend({
      today: TODAY, dob: '2014-01-01', riskIds: ['pregnancy'], menacwyDoses: [],
      menbDoses: [{ date: '2023-06-01', brand: 'Bexsero (MenB)' }],
    });
    const d = lineOf(r, 0, 'MenB');
    expect(d.status).toBe('invalid');
    expect(d.reasons.at(-1)).toBe(REPEAT_THIS_DOSE);
    expect(d.reasons.some((x) => /^Repeat from /.test(x))).toBe(false);
  });

  it('the chip is unchanged', () => {
    const r = run(q('2026-10-01', '2026-10-22'));
    expect(doseChipLabel(lineOf(r, 1))).toBe('Not counted — repeat');
  });
});

describe('F-4b: a dose already repeated says so', () => {
  it('Leo: Jun 1, Jun 22 (too soon), Aug 20 -> "Repeated on Aug 20, 2026. See that dose."', () => {
    const r = run(q('2026-06-01', '2026-06-22', '2026-08-20'));
    const d = lineOf(r, 1);
    expect(d.status).toBe('invalid');
    expect(d.reasons).not.toContain(REPEAT_THIS_DOSE);
    expect(d.reasons.at(-1)).toBe('Repeated on Aug 20, 2026. See that dose.');
    expect(d.reasons.some((x) => /^Repeat from /.test(x))).toBe(false);
    expect(d.repeatedOn).toBe('2026-08-20');
    expect(doseChipLabel(d)).toBe('Not counted — repeat');
    // The first sentence (why it did not count) stays.
    expect(d.reasons[0]).toMatch(/^Given only ~3 weeks after the previous dose\./);
  });

  it('names the NEXT shot even when that one did not count either', () => {
    const r = run(q('2026-06-01', '2026-06-22', '2026-07-06'));
    expect(lineOf(r, 1).reasons.at(-1)).toBe('Repeated on Jul 6, 2026. See that dose.');
  });

  it('control: Jun 1 and Aug 20 only, both count, no line changes', () => {
    const r = run(q('2026-06-01', '2026-08-20'));
    expect(r.history.MenACWY.perDose.every((d) => d.status === 'valid')).toBe(true);
    expect(r.history.MenACWY.perDose.every((d) => !(d.reasons ?? []).some((x) => /^Repeat(ed)? (from|on) /.test(x)))).toBe(true);
  });
});
