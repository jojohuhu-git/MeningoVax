// ─────────────────────────────────────────────────────────────────────────
// dose-rules-table.test.js — the rule table (doseRules.js) holds itself to
// what it says. Port Phase 2.1, 2026-11-15.
//
// The table's fields are only worth having if they are TRUE. Four checks:
//
//   1. Every row answers the five questions, from a closed list of answers.
//   2. Every row that can decide a dose DOES decide one — on the saved-answer,
//      record-problem or typical-patient grids, or on a patient written here.
//      A row no patient reaches is a rule nobody has seen work.
//   3. What a row says happens to a dose (`enforcement`, `label`) is what
//      actually happens to every dose it decided: a 'floor' row's doses are
//      not counted and get the repeat sentence, a 'set-aside' row's doses are
//      left out with no repeat sentence, and so on.
//   4. The orderings the table's comments promise are the orderings it has,
//      and validate.js holds no rule of its own.
//
// The patients below exist because the grids cannot reach their rows. One
// thing they show, for the owner: NO saved grid has a dose recorded without a
// date, so the six undated-dose rows were checked by nothing grid-wide before
// this file (listed in the 2.1 PR body; not fixed here — 2.1 moves nothing).
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DOSE_RULES } from '../doseRules.js';
import { CITATIONS } from '../../data/refs.js';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { doseChipLabel, RECORD_PROBLEM_LABELS } from '../../components/doseChipLabel.js';
import { buildSavedAnswerCases, buildRecordProblemCases, buildTypicalCases } from '../../test-grid.js';
import { TEST_TODAY } from '../../test-today.js';

const REPEAT_SENTENCE = 'This dose does not count toward the series: repeat this dose only (do not restart the series).';

const VACCINES = ['any', 'MenACWY', 'MenB'];
const MEASURED_FROM = [
  'birth', 'last counted dose', 'last dose given', 'dose 1', 'dose 2', 'dose 3',
  'first counted branded dose', 'today', 'the record', 'the series total',
];
const ENFORCEMENT = [
  'floor', 'set-aside', 'counts-with-note', 'counts', 'needs-input', 'record-problem', 'extra', 'none',
];

// ── Patients the grids cannot reach ───────────────────────────────────────
// Today is TEST_TODAY (2026-09-15) throughout. Each patient's LAST dose is the
// one its row must decide.
const HAND_PATIENTS = [
  {
    rule: 'ACWY-UNDATED-BELOW-MIN-AGE',
    why: '5-year-old; Menveo 1-vial (licensed from 10) recorded with no date',
    vaccine: 'MenACWY', ageMonths: 60, dob: '2021-09-15', riskIds: [],
    doses: [{ brand: 'Menveo 1-vial (≥10y) (MenACWY)' }],
  },
  {
    rule: 'ACWY-UNDATED-NOT-COUNTED',
    // A row with neither date nor brand is a blank row, dropped before the
    // walk (K1, doseIdentity.js) — so this one names a brand.
    why: '13-year-old; one MenQuadfi with no date',
    vaccine: 'MenACWY', ageMonths: 156, dob: '2013-09-15', riskIds: [],
    doses: [{ brand: 'MenQuadfi (MenACWY)' }],
  },
  {
    rule: 'ACWY-HIGHRISK-BEFORE-10-NO',
    why: '14-year-old with asplenia now; MenQuadfi at 8, answered "not high-risk then"',
    vaccine: 'MenACWY', ageMonths: 168, dob: '2012-09-15', riskIds: ['asplenia'],
    doses: [{ date: '2020-10-01', brand: 'MenQuadfi (MenACWY)' }],
    answers: { 0: 'no' },
  },
  {
    rule: 'ACWY-ROUTINE-BOOSTER-GAP',
    why: 'Healthy, 16 on 2026-07-01; MenQuadfi 2026-06-15 then 2026-07-20 (35 days, at 16)',
    vaccine: 'MenACWY', ageMonths: 194, dob: '2010-07-01', riskIds: [],
    doses: [
      { date: '2026-06-15', brand: 'MenQuadfi (MenACWY)' },
      { date: '2026-07-20', brand: 'MenQuadfi (MenACWY)' },
    ],
  },
  {
    rule: 'MENB-UNDATED-BELOW-10',
    why: '8-year-old; one MenB with no date',
    vaccine: 'MenB', ageMonths: 96, dob: '2018-09-15', riskIds: [],
    doses: [{ brand: 'Bexsero (MenB)' }],
  },
  {
    rule: 'MENB-UNDATED-HEALTHY-UNDER-16',
    why: 'Healthy 13-year-old; one MenB with no date',
    vaccine: 'MenB', ageMonths: 156, dob: '2013-09-15', riskIds: [],
    doses: [{ brand: 'Bexsero (MenB)' }],
  },
  {
    rule: 'MENB-UNDATED-NOT-COUNTED',
    why: 'Healthy 18-year-old; one MenB with no date',
    vaccine: 'MenB', ageMonths: 216, dob: '2008-09-15', riskIds: [],
    doses: [{ brand: 'Bexsero (MenB)' }],
  },
  {
    rule: 'MENB-HIGHRISK-BEFORE-16-NO',
    why: '17-year-old with asplenia now; Bexsero at 14, answered "unsure"',
    vaccine: 'MenB', ageMonths: 204, dob: '2009-09-15', riskIds: ['asplenia'],
    doses: [{ date: '2023-10-01', brand: 'Bexsero (MenB)' }],
    answers: { 0: 'unsure' },
  },
  {
    // Ruling D, E2 (owner, 2026-11-15). No grid patient has a dose after a
    // MenB dose that did not count, so the row needs this one.
    rule: 'MENB-REPEAT-GAP',
    why: '17-year-old with asplenia; Bexsero 2026-06-01, Trumenba 2026-08-01 (wrong family), Bexsero 2026-08-15 (2 weeks after the Trumenba)',
    vaccine: 'MenB', ageMonths: 212, dob: '2009-01-01', riskIds: ['asplenia'],
    doses: [
      { date: '2026-06-01', brand: 'Bexsero (MenB)' },
      { date: '2026-08-01', brand: 'Trumenba (MenB)' },
      { date: '2026-08-15', brand: 'Bexsero (MenB)' },
    ],
  },
];

const judgeHand = (p) => analyzeHistory(p.vaccine, p.doses, p.ageMonths, p.riskIds, TEST_TODAY, p.answers, p.dob);

// ── Every dose every grid decides, with the row that decided it ───────────
// Collected once: three grids, both vaccines.
const DECIDED = (() => {
  const out = [];
  const cases = [...buildSavedAnswerCases(), ...buildRecordProblemCases(), ...buildTypicalCases()];
  for (const c of cases) {
    const r = recommend(c.input);
    for (const v of ['MenACWY', 'MenB']) {
      const h = r.history?.[v];
      (h?.decidedBy ?? []).forEach((ruleId, i) => {
        if (ruleId) out.push({ ruleId, verdict: h.perDose[i], where: `${c.key} ${v} dose ${i + 1}` });
      });
    }
  }
  for (const p of HAND_PATIENTS) {
    const h = judgeHand(p);
    h.decidedBy.forEach((ruleId, i) => {
      if (ruleId) out.push({ ruleId, verdict: h.perDose[i], where: `hand patient for ${p.rule}, dose ${i + 1}` });
    });
  }
  return out;
})();

describe('1 · every row answers the five questions', () => {
  it('ids are unique', () => {
    const ids = DOSE_RULES.map((r) => r.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  for (const rule of DOSE_RULES) {
    it(`${rule.id} has every field, from the closed lists`, () => {
      expect(typeof rule.what).toBe('string');
      expect(typeof rule.inventory).toBe('string');
      expect(VACCINES).toContain(rule.vaccine);
      expect(typeof rule.schedule).toBe('string');
      expect(MEASURED_FROM).toContain(rule.measuredFrom);
      expect(ENFORCEMENT).toContain(rule.enforcement);
      expect([true, false, null]).toContain(rule.grace);
      expect(rule.authorityToday).toMatch(/\S/);
      expect(rule.label).toMatch(/\S/);
      expect([true, false, undefined]).toContain(rule.dated);
      // A row that decides nothing must say why: an open gap ('none') or a
      // rule the walk applies after the verdict ('extra').
      if (rule.check === null) expect(['none', 'extra']).toContain(rule.enforcement);
      else expect(typeof rule.check).toBe('function');
    });
  }
});

describe('2 · every row that can decide a dose has been seen deciding one', () => {
  const seen = new Set(DECIDED.map((d) => d.ruleId));

  it('no row with a check goes unreached', () => {
    const unreached = DOSE_RULES.filter((r) => r.check && !seen.has(r.id)).map((r) => r.id);
    expect(
      unreached,
      'These rows decided no dose on any grid or hand patient. Add a patient to HAND_PATIENTS '
      + 'that reaches the row, or find out why the row can never fire.',
    ).toEqual([]);
  });

  it('the series cap row is reached too (the walk tags it)', () => {
    expect(seen.has('SERIES-CAP-EXTRA-DOSE')).toBe(true);
  });

  for (const p of HAND_PATIENTS) {
    it(`${p.rule}: ${p.why}`, () => {
      const h = judgeHand(p);
      expect(h.decidedBy[h.decidedBy.length - 1]).toBe(p.rule);
    });
  }
});

describe('3 · what a row says happens is what happens, to every dose it decided', () => {
  const byRule = new Map(DOSE_RULES.map((r) => [r.id, r]));

  // What each enforcement means, as a fact about the verdict the walk shows.
  const MEANS = {
    floor: (v) => v.status === 'invalid' && v.doesNotCount === true && !v.recordProblem
      && v.reasons[v.reasons.length - 1] === REPEAT_SENTENCE,
    'set-aside': (v) => v.notAdolescentCount === true && v.effectiveDoseNum === null
      && !v.reasons.includes(REPEAT_SENTENCE),
    'counts-with-note': (v) => v.status === 'valid' && v.effectiveDoseNum >= 1 && v.reasons.length >= 1,
    counts: (v) => v.status === 'unknown' && v.effectiveDoseNum >= 1,
    'needs-input': (v) => v.status === 'pending' && v.needsInput === true && v.effectiveDoseNum === null,
    'record-problem': (v) => !!v.recordProblem && v.doesNotCount === true && !v.reasons.includes(REPEAT_SENTENCE),
    extra: (v) => v.extraDose === true && v.effectiveDoseNum === null,
  };

  it('every decided dose matches its row\'s enforcement', () => {
    const wrong = DECIDED
      .filter(({ ruleId, verdict }) => !MEANS[byRule.get(ruleId).enforcement](verdict))
      .map(({ ruleId, where }) => `${ruleId} (${byRule.get(ruleId).enforcement}) at ${where}`);
    expect(wrong.slice(0, 10), `${wrong.length} doses do not match their row`).toEqual([]);
  });

  it('every decided dose shows its row\'s chip', () => {
    const wrong = [];
    for (const { ruleId, verdict, where } of DECIDED) {
      const rule = byRule.get(ruleId);
      // The total only changes the "Dose N of M" chip, which these rows check
      // by shape below; every other chip reads the same without it.
      const chip = doseChipLabel(verdict, null);
      const ok = rule.label === 'Dose N of M'
        ? verdict.status === 'valid' && verdict.effectiveDoseNum >= 1
        : rule.enforcement === 'record-problem'
          ? chip === RECORD_PROBLEM_LABELS[verdict.recordProblem] && chip === rule.label
          : rule.enforcement === 'extra'
            ? /^Extra dose/.test(chip) && rule.label.includes(chip)
            : chip === rule.label;
      if (!ok) wrong.push(`${ruleId} label "${rule.label}" but chip "${chip}" at ${where}`);
    }
    expect(wrong.slice(0, 10), `${wrong.length} chips differ from their row`).toEqual([]);
  });
});

describe('4 · the order the comments promise, and no rule outside the table', () => {
  const at = (id) => DOSE_RULES.findIndex((r) => r.id === id);
  const datedRows = (v) => DOSE_RULES.filter((r) => r.vaccine === v && r.dated === true);

  it('the three record problems come first, future before before-birth before entered-twice', () => {
    expect(DOSE_RULES.slice(0, 3).map((r) => r.id))
      .toEqual(['RECORD-FUTURE-DATE', 'RECORD-BEFORE-BIRTH', 'RECORD-ENTERED-TWICE']);
  });

  it('a dose below the product minimum age is reported for its age before any other rule', () => {
    expect(datedRows('MenACWY')[0].id).toBe('ACWY-BELOW-MIN-AGE');
    expect(datedRows('MenB')[0].id).toBe('MENB-BELOW-MIN-AGE');
  });

  it('the routine 16-year booster gap is checked before the 4-week any-two-doses gap', () => {
    expect(at('ACWY-ROUTINE-BOOSTER-GAP')).toBeLessThan(at('ACWY-ANY-TWO-DOSES-GAP'));
  });

  it('an early high-risk MenB dose 3 is rescued before the 6-months-from-dose-1 floor is checked', () => {
    expect(at('MENB-HIGHRISK-EARLY-DOSE-3')).toBeLessThan(at('MENB-HIGHRISK-DOSE-3-FROM-DOSE-1'));
  });

  it('validate.js judges no dose itself: it imports no age or interval test', () => {
    const src = readFileSync(new URL('../validate.js', import.meta.url), 'utf8');
    for (const forbidden of ['./intervals.js', './ages.js', 'ageMeetsMinimum', 'intervalMeetsMinimum', 'calendarIntervalElapsed', 'calendarIntervalMeetsMinimum']) {
      expect(src.includes(forbidden), `validate.js mentions ${forbidden}: a rule belongs in doseRules.js`).toBe(false);
    }
  });
});

// ── 5 · What the sources say (port Phase 2.2, 2026-11-15) ─────────────────
// Every row carries `sourcesSay`: a verdict from a closed list, the exact
// sentences it rests on (keys into refs.js), and one plain-English line.
// The rows whose verdict is 'differs', 'schedule-only' or 'no-source' ARE the
// plan's STOP C question list (decision packet 1, Q2 and Q4). They are written
// out below, so a new difference — a row added, or a verdict changed — turns
// this file red until the list (and the packet) says so.
const VERDICTS = ['stated', 'schedule-only', 'differs', 'owner-decided', 'no-source', 'record-keeping'];

// STOP C Q2: the app and the sources part, or the app makes a minimum out of a schedule.
// The two undated rows moved here from Q4 on 2026-11-15 (after 2.3), when
// ACIP's general guidance on records was read live: it accepts only dated
// records. They left on 2026-11-16 (Phase 3 family 2, STOP C C1): the app now
// does what the source says — an undated dose does not count.
// 2026-11-16 (family 3): MENB-HIGHRISK-EARLY-DOSE-3 (C6, C7),
// MENB-HIGHRISK-DOSE-3-FROM-DOSE-1 (C5) and MENB-HEALTHY-EARLY-DOSE-2 (C7, C12,
// C3) left: owner-decided.
const STOP_C_Q2 = [
  'ACWY-HIGHRISK-BOOSTER-GAP',
  'ACWY-TRAVEL-BOOSTER-GAP',
  'ACWY-ANY-TWO-DOSES-GAP',
  'MENB-HIGHRISK-DOSE-2-GAP',
  'MENB-HIGHRISK-BOOSTER-GAP',
];
// STOP C Q4: no source covers it — keep as an app rule, and in what words?
// MENB-HIGHRISK-DOSE-2-UNVERIFIABLE left on 2026-11-16 (C17: removed with C1).
const STOP_C_Q4 = [
  'SERIES-CAP-EXTRA-DOSE',
];
// The day the sentences beside the rows were read live (Phase 2.2).
const READ_LIVE_ON = '2026-11-15';

describe('5 · what the sources say, beside every row', () => {
  for (const rule of DOSE_RULES) {
    it(`${rule.id} says what the sources say`, () => {
      const s = rule.sourcesSay;
      expect(s, 'every row needs a sourcesSay field').toBeTruthy();
      expect(VERDICTS).toContain(s.verdict);
      expect(s.note).toMatch(/\S.{20,}/);
      expect(Array.isArray(s.refs)).toBe(true);
      for (const key of s.refs) {
        const c = CITATIONS[key];
        expect(c, `${key} is not in refs.js`).toBeTruthy();
        // A sentence, not a landing page: STOP C is argued from the words.
        expect(c.quote, `${key} has no quote`).toMatch(/\S/);
      }
      // A rule that leans on a source names it; one about the entry names none.
      if (['stated', 'schedule-only', 'differs'].includes(s.verdict)) {
        expect(s.refs.length, `${rule.id} is '${s.verdict}' but quotes no source`).toBeGreaterThan(0);
        // Those quotes are the ones held against the rule: read live in 2.2 or later.
        for (const key of s.refs) {
          expect(CITATIONS[key].lastVerified >= READ_LIVE_ON, `${key} last read ${CITATIONS[key].lastVerified}`).toBe(true);
        }
      }
      if (s.verdict === 'record-keeping') expect(s.refs).toEqual([]);
      if (s.verdict === 'record-keeping') expect(rule.enforcement).toBe('record-problem');
    });
  }

  it('the rows that differ from the sources are exactly STOP C Q2', () => {
    const q2 = DOSE_RULES.filter((r) => ['differs', 'schedule-only'].includes(r.sourcesSay.verdict)).map((r) => r.id);
    expect(q2, 'a row now differs from the sources (or stopped differing): update STOP C Q2 and this list').toEqual(STOP_C_Q2);
  });

  it('the rows with no source are exactly STOP C Q4', () => {
    const q4 = DOSE_RULES.filter((r) => r.sourcesSay.verdict === 'no-source').map((r) => r.id);
    expect(q4, 'a row now has no source (or found one): update STOP C Q4 and this list').toEqual(STOP_C_Q4);
  });

  it('a row the code says has no source is not labelled as if the sources stated it', () => {
    // authorityToday "None …" / "Nothing …" must not sit beside a 'stated' verdict.
    const mislabelled = DOSE_RULES
      .filter((r) => /^(None|Nothing)\b/.test(r.authorityToday) && r.sourcesSay.verdict === 'stated')
      .map((r) => r.id);
    expect(mislabelled).toEqual([]);
  });

  it('sourcesSay never reaches the screen: no component reads it', () => {
    for (const f of ['RecCard.jsx', 'Results.jsx', 'doseChipLabel.js']) {
      const src = readFileSync(new URL(`../../components/${f}`, import.meta.url), 'utf8');
      expect(src.includes('sourcesSay'), `${f} reads sourcesSay`).toBe(false);
    }
  });
});
