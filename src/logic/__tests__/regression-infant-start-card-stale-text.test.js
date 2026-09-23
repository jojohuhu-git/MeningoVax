// The two "starting the infant MenACWY series" cards still carried text from
// before fix M5, so each one contradicted its own dose total.
//
// Background: F1 (2026-09-14) set menacwyInfantHighRiskTotal() to 3 for a
// 7-11-month start and 4 for a 12-23-month start. M5 (2026-09-15) reversed that
// to 2 for any start at 7-23 months, citing CDC. The totals moved; the labels,
// one note, and the explanatory comments did not.
//
// CDC child & adolescent schedule notes, "Meningococcal serogroup A,C,W,Y
// vaccination", special situations, Menveo (fetched live 2026-09-15 from
// https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html):
//
//   "Dose 1 at age 7-23 months: 2-dose series (dose 2 at least 12 weeks after
//    dose 1 and after age 12 months)"
//
// ACIP 2020 MMWR 69(RR-9) Table 4, MenACWY column (fetched live the same day
// from https://www.cdc.gov/mmwr/volumes/69/rr/rr6909a1.htm):
//
//   "Boosters (if person remains at increased risk):
//    - Aged <7 yrs: Single dose at 3 yrs after primary vaccination and every 5
//      yrs thereafter"
//
// So: two doses, and the first booster is 3 years after the second one - NOT a
// third dose at 12-23 months.
//
// Bug A, the 7-11-month card:
//   label "Dose 1 of 2 + booster (infant high-risk 7-11mo)" and the note ended
//   "Then a booster at 12-23 months (>=12 weeks after the primary series)".
//   Dose 2 is itself given at 12-23 months, so that sentence promised a THIRD
//   dose, at the wrong time, under the wrong name.
//
// Bug B, the 12-23-month card:
//   label "Dose 1 of 4 (high-risk 12-23mo)" while seriesTotal was 2 and the
//   note directly beneath it said "2-dose primary". The card contradicted
//   itself on screen.
//
// Sibling repo: vaxapp fixed the same family in PR #155 (12-23-month dose is
// primary, not a booster) and PR #156 (first booster is 3 years, not 12 months).

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { menacwyInfantHighRiskTotal } from '../seriesTotals.js';
import { noteText } from '../../test-note-text.js';

const TODAY = '2026-07-05';
const acwy = (ageMonths, riskIds = ['asplenia']) =>
  recommend({ today: TODAY, ageMonths, riskIds, menacwyDoses: [], menbDoses: [] }).menacwy[0];

describe('the helper is the source of truth: a 7-23-month start is 2 doses', () => {
  it.each([7, 9, 11, 12, 18, 23])('a start at %i months is a 2-dose series', (m) => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: m })).toBe(2);
  });
  it('a 2-6-month start is still 4 doses', () => {
    expect(menacwyInfantHighRiskTotal({ d1AgeM: 2 })).toBe(4);
  });
});

describe('Bug A - the 7-11-month starting card', () => {
  const r = () => acwy(9);

  it('its total is 2', () => {
    expect(r().seriesTotal).toBe(2);
  });

  it('its label does not promise an extra dose beyond the 2-dose series', () => {
    // Was: "Dose 1 of 2 + booster (infant high-risk 7-11mo)".
    expect(r().doseLabel).not.toMatch(/\+\s*booster/i);
  });

  it('its label still says dose 1 of 2', () => {
    expect(r().doseLabel).toMatch(/Dose 1 of 2/);
  });

  it('the note does not promise a booster at 12-23 months', () => {
    // Was: "Then a booster at 12-23 months (>=12 weeks after the primary series)."
    expect(noteText(r())).not.toMatch(/booster at 12.23 months/i);
  });

  it('the card puts the first booster 3 years after the series', () => {
    // U2 (2026-09-17): stated on the booster line, which owns the cadence; the
    // note used to repeat it a few lines below.
    expect(r().boosterSummary).toMatch(/first in 3 years/);
    expect(noteText(r())).not.toMatch(/3 years/);
  });

  it('the note keeps both real dose-2 floors', () => {
    expect(noteText(r())).toMatch(/12 weeks/);
    expect(noteText(r())).toMatch(/12 months of age|first birthday/i);
  });
});

describe('Bug B - the 12-23-month starting card', () => {
  const r = () => acwy(14);

  it('its total is 2', () => {
    expect(r().seriesTotal).toBe(2);
  });

  it('its label agrees with that total', () => {
    // Was: "Dose 1 of 4 (high-risk 12-23mo)" while seriesTotal was 2.
    expect(r().doseLabel).toMatch(/Dose 1 of 2/);
    expect(r().doseLabel).not.toMatch(/of 4/);
  });

  it('label and note agree with each other', () => {
    const c = r();
    expect(noteText(c)).toMatch(/2-dose primary/);
    expect(c.doseLabel).toMatch(new RegExp(`of ${c.seriesTotal}\\b`));
  });
});

describe('every infant starting card: label total == seriesTotal', () => {
  it.each([2, 4, 6, 7, 9, 11, 12, 18, 23])('age %i months', (m) => {
    const c = acwy(m);
    const shown = c.doseLabel.match(/of (\d+)/);
    expect(shown).not.toBeNull();
    expect(Number(shown[1])).toBe(c.seriesTotal);
  });
});

describe('what must NOT change', () => {
  it('a 2-6-month start is still a 4-dose series at 2, 4, 6 and 12 months', () => {
    const c = acwy(3);
    expect(c.seriesTotal).toBe(4);
    expect(c.doseLabel).toMatch(/Dose 1 of 4/);
    // U1 (2026-09-17): same claim, re-worded when the note split into a lead and
    // a detail. Matched in two parts rather than as one exact sentence, so a
    // future copy pass can move the comma without failing a clinical test.
    // M3 (2026-09-23): brand-neutral since MenQuadfi is also licensed for the
    // infant series (see the menquadfi-6-week-floor tests) — this card must
    // not name a single brand while the chips beside it offer two.
    expect(noteText(c)).toMatch(/4-dose infant MenACWY series/);
    expect(noteText(c)).toMatch(/2, 4, 6 and 12 months/);
  });

  it('the booster summary still says first in 3 years, then every 5', () => {
    expect(acwy(9).boosterSummary).toMatch(/first in 3 years, then every 5 years/i);
  });

  it('an outbreak infant still gets no standing booster countdown', () => {
    expect(acwy(9, ['outbreak_acwy']).boosterSummary).toBeNull();
  });
});
