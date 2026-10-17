// 2026-10-16 — the transplant box is a hard stop, not an advisory.
//
// Owner decision 2026-10-16 (plan:
// PneumoVax/docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md).
// Ticking "hematopoietic cell transplant" used to give the clinician MORE
// advice: an advisory banner with a MenACWY line and a MenB line, AND the
// ordinary recommendation cards above it. That advisory shipped a wrong
// clinical statement five times in five weeks (55167ff, then ba255ef,
// a0106f4, 03c8387, f32692e). The rule itself was wrong, not the wording —
// post-transplant vaccination is genuinely contested between sources and it
// changes. Wrong advice on a clinician's screen is worse than no advice, so
// the transplant row merges into the CAR-T / B-cell hard stop and the app
// says plainly that this patient needs an individualised schedule.
//
// Decision 2 of that plan, tested below: the stop hides EVERYTHING, including
// a recommendation a different ticked risk factor would produce on its own.
// That deliberately retires the 2026-09-19 C2-6 fix (its two test files are
// deleted in the same commit).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { RISK_FACTORS, RISK_BY_ID } from '../../data/riskFactors.js';

const TODAY = '2026-10-16';

describe('2026-10-16 — the transplant tick is a hard stop', () => {
  it('there is no separate transplant row any more — one box, not two', () => {
    expect(RISK_BY_ID.hct).toBeUndefined();
    expect(RISK_FACTORS.filter((r) => r.exclude)).toHaveLength(1);
  });

  it('the one exclude row names transplant first, because that is the common tick', () => {
    const row = RISK_BY_ID.hct_cart_bcell_exclude;
    expect(row.exclude).toBe(true);
    expect(row.label).toBe(
      'Hematopoietic cell transplant (HCT/HSCT), CAR-T therapy, B-cell malignancy, or B-cell-depleting therapy',
    );
    expect(row.sublabel).toBe(
      'this tool does not apply — needs an individualized, specialist-guided schedule',
    );
    // Decision 6: the authorities are named in words, not linked. Only the
    // one CDC chip the checkbox already carried stays.
    expect(row.refs).toEqual(['cdcAlteredImmunocompetence']);
  });

  it('a 17-year-old transplant recipient who used to get cards now gets a stop', () => {
    // Before this change, ['hct'] at 17y produced a full MenACWY card plus the
    // advisory banner. The same patient now gets neither.
    const r = recommend({ ageMonths: 17 * 12, riskIds: ['hct_cart_bcell_exclude'], today: TODAY });
    expect(r.excluded).toBe(true);
    expect(r.menacwy).toEqual([]);
    expect(r.menb).toEqual([]);
    expect(r.pentavalent.eligible).toBe(false);
  });

  it('the advisory is gone from the engine entirely — no hct field on any result', () => {
    const stopped = recommend({ ageMonths: 17 * 12, riskIds: ['hct_cart_bcell_exclude'], today: TODAY });
    const ordinary = recommend({ ageMonths: 17 * 12, riskIds: ['travel'], today: TODAY });
    expect(stopped).not.toHaveProperty('hct');
    expect(ordinary).not.toHaveProperty('hct');
  });

  // Decision 2 — the most likely later surprise, so it is tested head-on.
  it.each([
    ['travel'],
    ['outbreak_b'],
    ['asplenia'],
    ['college_dorm'],
    ['complement'],
  ])('the stop still wins when %s is also ticked, and that card is gone too', (other) => {
    const onItsOwn = recommend({ ageMonths: 17 * 12, riskIds: [other], today: TODAY });
    // Guard the guard: this risk really does produce a card by itself, so the
    // assertion below is not vacuously true.
    expect(onItsOwn.menacwy.length + onItsOwn.menb.length).toBeGreaterThan(0);

    const withStop = recommend({
      ageMonths: 17 * 12,
      riskIds: ['hct_cart_bcell_exclude', other],
      today: TODAY,
    });
    expect(withStop.excluded).toBe(true);
    expect(withStop.menacwy).toEqual([]);
    expect(withStop.menb).toEqual([]);
  });

  it('the stop message is the shortened clinical wording, naming the authorities in words', () => {
    const r = recommend({ ageMonths: 17 * 12, riskIds: ['hct_cart_bcell_exclude'], today: TODAY });
    expect(r.exclusionMessage).toBe(
      'Revaccination after hematopoietic cell transplant, CAR‑T therapy, or '
      + 'B‑cell–depleting therapy follows a transplant‑ or '
      + 'therapy‑specific protocol, not age‑based scheduling, and some live '
      + 'vaccines may be contraindicated. Follow your institutional protocol or '
      + 'current national guidance (ASCO, NCCN, IDSA, CDC).',
    );
    // It stops describing the software ("This tool does not apply...") and
    // never links the four authorities — a sentence naming them is still true
    // in 2030; a URL to the 2024 ASCO guideline is not.
    expect(r.exclusionMessage).not.toMatch(/this tool/i);
    expect(r.exclusionMessage).not.toMatch(/https?:/);
    expect(r.exclusionCitations.map((c) => c.short)).toEqual(['CDC Altered Immunocompetence']);
  });

  it('recorded doses are kept in the input, not cleared, even though they are not evaluated', () => {
    const menacwyDoses = [{ date: '2026-01-02', brand: 'Menveo (MenACWY-CRM)' }];
    const r = recommend({
      ageMonths: 17 * 12,
      riskIds: ['hct_cart_bcell_exclude'],
      menacwyDoses,
      today: TODAY,
    });
    expect(r.excluded).toBe(true);
    // The caller's array is untouched — Results.jsx says so on screen, and
    // going back a step still shows what was typed.
    expect(menacwyDoses).toHaveLength(1);
  });
});
