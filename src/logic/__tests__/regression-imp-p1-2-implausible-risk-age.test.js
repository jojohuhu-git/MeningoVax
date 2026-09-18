// impossible P1-2 · engine layer. The UI twin is
// src/components/__tests__/regression-imp-p1-2-implausible-risk-age-ui.test.jsx.
//
// What a clinician saw: a NEWBORN could be ticked as a "First-year college
// student living in a residence hall", and the app answered "1 dose", due
// today — with no product listed at all, because no MenACWY vaccine is
// licensed under 2 months. Same for "Military recruit" and "Microbiologist"
// at any age. The app already knew these were adult indications (it excludes
// them from the infant series for exactly that reason) and used that knowledge
// to pick a schedule, but never to question the tick-box.
//
// OWNER DECISION 2026-09-17: a quiet note, NEVER a block. Confirmed 2026-09-18.
// Nothing is withheld, no recommendation changes — the dose still shows as due.
//
// THE FLOOR IS SOURCED, not invented. ACIP 2020 MMWR 69(RR-9) was fetched as
// the PDF on 2026-09-18 (the HTML page's text conversion drops the tables,
// which is why an earlier live fetch could not confirm this):
//
//   "TABLE 7. Recommended vaccination schedule and intervals for
//    microbiologists routinely exposed to isolates of Neisseria meningitidis"
//   — one age-group row only: ">=10 yrs"
//
//   "TABLE 10. Recommended vaccination schedule and intervals for college
//    freshmen living in residence halls* and military recruits"
//   — one age-group row only: ">=10 yrs"
//
// For contrast, Table 4 (persistent complement deficiencies) prints THREE age
// rows — "2-23 mos", "2-9 yrs", ">=10 yrs" — which is why an infant with
// complement deficiency must never be questioned. The difference between the
// tables is real, not an omission.
//
// A missing row is not a contraindication, which is why this is a note and not
// a gate: nothing in ACIP forbids vaccinating a younger microbiologist, so
// blocking would invent guidance ACIP never wrote.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { RISK_FACTORS, ageImplausibleRisks } from '../../data/riskFactors.js';

const TODAY = '2026-09-18';

const rec = (riskIds, dob) => recommend({
  today: TODAY, dob, riskIds, menacwyDoses: [], menbDoses: [],
});

// Dates of birth, not ageMonths: a date of birth is what the Age step asks for.
const DOB_NEWBORN = '2026-09-18';
const DOB_6_MONTHS = '2026-03-18';
const DOB_3_YEARS = '2023-09-18';
const DOB_8_YEARS = '2018-09-18';
const DOB_EXACTLY_10 = '2016-09-18';
const DOB_ALMOST_10 = '2016-09-19';   // one day short of the 10th birthday
const DOB_16_YEARS = '2010-09-18';

// The three exposure indications ACIP prints only in a ">=10 yrs" row.
const TABLE_FLOOR_10 = ['microbiologist', 'military', 'college_dorm'];

// The eight that must NEVER be questioned. Getting this list wrong would be a
// clinical error, so it is written out in full rather than derived.
const MUST_NOT_BE_QUESTIONED = [
  'asplenia',    // infants genuinely have all three; ACIP prints an infant row
  'complement',
  'hiv',
  'travel',      // ACIP prints a "2-23 mos" row for both (Tables 8 and 9) — a
  'outbreak_acwy', // 4-month-old going to the meningitis belt is exactly who it is for
  'outbreak_b',  // already handled by the MenB product floor
  'hct',         // a baby can have a transplant
  'hct_cart_bcell_exclude', // hard stop at every age; correct as it stands
];

describe('imp P1-2: a risk factor that cannot apply at that age is noted', () => {
  it('notes the three ACIP ">=10 yrs" indications below 10 years', () => {
    for (const id of TABLE_FLOOR_10) {
      const note = rec([id], DOB_NEWBORN).riskAgeNote;
      expect(note, `${id} at newborn`).toBeTruthy();
      expect(note.lines).toHaveLength(1);
      expect(note.lines[0]).toContain('10 years');
    }
  });

  it('names the indication the way the tick-box does, not by its id', () => {
    const note = rec(['college_dorm'], DOB_NEWBORN).riskAgeNote;
    expect(note.lines[0]).toContain('First-year college student living in a residence hall');
  });

  // The age is stated once, in the footer, not at the end of every line:
  // fmtAgeMonths returns words as well as numbers ("Birth", "3 weeks"), and no
  // "...and this patient is X" sentence can absorb those grammatically. The
  // live app printed "this patient is Birth." before this was restructured.
  it('states the patient\'s actual age once, in the footer', () => {
    expect(rec(['military'], DOB_3_YEARS).riskAgeNote.footer).toContain('recorded as 3 years');
    expect(rec(['military'], DOB_6_MONTHS).riskAgeNote.footer).toContain('recorded as 6 months');
    expect(rec(['military'], DOB_NEWBORN).riskAgeNote.footer).toContain('recorded as Birth');
    // and NOT jammed onto the end of the rule sentence
    expect(rec(['military'], DOB_NEWBORN).riskAgeNote.lines[0]).not.toContain('Birth');
  });

  it('cites the ACIP table the indication already points at', () => {
    const micro = rec(['microbiologist'], DOB_8_YEARS);
    expect(micro.riskAgeNote.lines[0]).toContain('[c]');
    expect(micro.riskAgeNoteCites).toHaveLength(1);
    expect(micro.riskAgeNoteCites[0].label).toContain('Table 7');

    const dorm = rec(['college_dorm'], DOB_8_YEARS);
    expect(dorm.riskAgeNoteCites[0].label).toContain('Table 10');
  });

  it('stops exactly at the 10th birthday, the edge ACIP\'s row names', () => {
    for (const id of TABLE_FLOOR_10) {
      expect(rec([id], DOB_ALMOST_10).riskAgeNote, `${id} one day short of 10`).toBeTruthy();
      expect(rec([id], DOB_EXACTLY_10).riskAgeNote, `${id} on the 10th birthday`).toBeNull();
      expect(rec([id], DOB_16_YEARS).riskAgeNote, `${id} at 16`).toBeNull();
    }
  });

  it('notes pregnancy under 9 years, WITHOUT claiming ACIP as the source', () => {
    const note = rec(['pregnancy'], DOB_3_YEARS).riskAgeNote;
    expect(note).toBeTruthy();
    expect(note.lines[0]).toContain('Pregnancy');
    expect(note.lines[0]).toContain('below 9 years');
    // No ACIP table covers pregnancy as a meningococcal indication, so the
    // floor is a plausibility judgement and must not be dressed up as a rule.
    expect(note.lines[0]).not.toContain('ACIP');
    expect(note.lines[0]).not.toContain('[c]');
    expect(rec(['pregnancy'], DOB_8_YEARS).riskAgeNote).toBeTruthy();
    expect(rec(['pregnancy'], '2016-09-18').riskAgeNote).toBeNull(); // 10y
  });

  it('never questions the other eight, at any age', () => {
    for (const id of MUST_NOT_BE_QUESTIONED) {
      for (const dob of [DOB_NEWBORN, DOB_6_MONTHS, DOB_3_YEARS, DOB_8_YEARS]) {
        expect(rec([id], dob).riskAgeNote, `${id} at ${dob}`).toBeNull();
      }
    }
  });

  it('every risk factor outside the four has no floor at all', () => {
    const withFloor = RISK_FACTORS
      .filter(r => r.minPlausibleAgeMonths != null)
      .map(r => r.id)
      .sort();
    expect(withFloor).toEqual(
      ['college_dorm', 'microbiologist', 'military', 'pregnancy'].sort()
    );
  });

  it('lists every doubted indication when several are ticked', () => {
    const note = rec(['military', 'college_dorm', 'asplenia'], DOB_NEWBORN).riskAgeNote;
    expect(note.lines).toHaveLength(2);
    // asplenia is correct at this age and must not appear
    expect(note.lines.join(' ')).not.toContain('asplenia');
    expect(note.lines.join(' ')).not.toContain('splen');
  });

  it('changes NOTHING about the recommendation — the dose still shows as due', () => {
    // The card a 2-month-old military recruit gets, with and without the note
    // in the build, must be identical. Compare against the values recorded
    // from the engine before this fix existed (2026-09-18 reproduction run).
    const r = rec(['military'], '2026-07-18');
    const card = r.menacwy[0];
    expect(card.status).toBe('exposure');
    expect(card.dueToday).toBe(true);
    expect(card.seriesTotal).toBe(1);
    expect(card.note.lead).toBe('A single MenACWY dose, for a military recruit.');
    expect(card.brands.map(b => b.name || b)).toEqual(['Menveo 2-vial (MenACWY)']);
    // And the note is an ADDITION, sitting outside the card.
    expect(r.riskAgeNote).toBeTruthy();
  });

  it('the hard stop still wins — an excluded patient gets no extra note', () => {
    const r = rec(['hct_cart_bcell_exclude', 'military'], DOB_NEWBORN);
    expect(r.excluded).toBe(true);
    expect(r.riskAgeNote ?? null).toBeNull();
  });
});

describe('imp P1-2: ageImplausibleRisks() is the one place the floor is applied', () => {
  it('returns the factor entries below their floor, in catalog order', () => {
    const hits = ageImplausibleRisks(['college_dorm', 'military', 'asplenia'], 0);
    expect(hits.map(r => r.id)).toEqual(['military', 'college_dorm']);
  });

  it('returns nothing when the age is unknown rather than guessing', () => {
    expect(ageImplausibleRisks(['military'], null)).toEqual([]);
    expect(ageImplausibleRisks(['military'], undefined)).toEqual([]);
  });

  it('does not fire on a negative (impossible) age, which P1-3 owns', () => {
    expect(ageImplausibleRisks(['military'], -52)).toEqual([]);
  });
});
