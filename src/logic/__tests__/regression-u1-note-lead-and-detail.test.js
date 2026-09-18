// U1 (2026-09-17): a card's note is authored as { lead, detail }, not as one
// paragraph.
//
// After U2 and U3 the notes still ran to a median of 128 characters and a
// longest of 530 — several of them a full ACIP schedule recited on a card whose
// reader only needed to know what to give today. The fix is structural, not a
// second short string written alongside the long one (that is the two-copies
// drift this whole queue is about): `rec()` now takes
// `note: { lead, detail }`, the card always shows `lead`, and `detail` sits
// behind a "Why this" disclosure.
//
// Owner decision 2026-09-17: ALL notes get the treatment, not only the long
// ones. A mix of some cards with a "Why this" link and some without was
// rejected — so a note that exists must carry both halves.
//
// These are invariants over a wide patient sweep, not spot checks, so a new
// card cannot quietly reintroduce a one-paragraph note.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { TEST_TODAY } from '../../test-today.js';

// The lead is one or two lines at card width. The audit's target was ~90-140
// characters; 140 is the ceiling enforced here, measured with the "[c]"
// citation placeholders removed since they render as a single superscript.
const LEAD_MAX = 140;

const yes = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, 'yes']));

// Dates written back from TEST_TODAY so fixtures cannot rot (L2-1).
const monthsAgo = (m) => {
  const d = new Date(`${TEST_TODAY}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - m);
  return d.toISOString().slice(0, 10);
};
const dose = (monthsBack, ageMonthsNow) => ({ date: monthsAgo(monthsBack), ageMonths: ageMonthsNow - monthsBack });

function run({ ageMonths, riskIds = [], menacwyDoses = [], menbDoses = [] }) {
  return recommend({
    today: TEST_TODAY, ageMonths, riskIds, menacwyDoses, menbDoses,
    riskAtDoseAnswers: { MenACWY: yes(menacwyDoses.length), MenB: yes(menbDoses.length) },
  });
}

// Wide enough to reach every note-carrying branch: both vaccines, every risk
// class, infant through adult, unvaccinated through fully vaccinated.
const RISK_SETS = [
  [], ['asplenia'], ['complement'], ['complement_inhibitor'], ['hiv'],
  ['travel'], ['microbiologist'], ['outbreak_acwy'], ['outbreak_menb'],
  ['college_dorm'], ['military'], ['asplenia', 'travel'],
];
const AGES = [2, 4, 6, 8, 10, 12, 14, 18, 24, 36, 60, 84, 120, 126, 132, 144, 156, 180, 192, 204, 216, 264, 360];
const HISTORIES = [
  () => ({}),
  (a) => ({ menacwyDoses: [dose(2, a)] }),
  (a) => ({ menacwyDoses: [dose(10, a), dose(2, a)] }),
  (a) => ({ menacwyDoses: [dose(30, a), dose(24, a), dose(2, a)] }),
  (a) => ({ menacwyDoses: [dose(40, a), dose(34, a), dose(28, a), dose(2, a)] }),
  (a) => ({ menbDoses: [dose(2, a)] }),
  (a) => ({ menbDoses: [dose(8, a), dose(6, a)] }),
  (a) => ({ menbDoses: [dose(24, a), dose(22, a), dose(18, a)] }),
  (a) => ({ menacwyDoses: [dose(3, a)], menbDoses: [dose(2, a)] }),
];

// Every distinct note the engine can produce, with one patient that reaches it.
function sweepNotes() {
  const found = new Map();
  for (const riskIds of RISK_SETS) {
    for (const ageMonths of AGES) {
      for (const history of HISTORIES) {
        const { menacwyDoses = [], menbDoses = [] } = history(ageMonths);
        const r = run({ ageMonths, riskIds, menacwyDoses, menbDoses });
        const cards = [...(r.menacwy || []), ...(r.menb || [])];
        for (const card of cards) {
          if (!card?.note) continue;
          const key = JSON.stringify(card.note);
          if (found.has(key)) continue;
          found.set(key, {
            note: card.note,
            noteCites: card.noteCites || [],
            where: `${card.vaccine} · ${card.doseLabel} · age ${ageMonths}m · risks [${riskIds.join(', ') || 'none'}]`,
          });
        }
      }
    }
  }
  return [...found.values()];
}

const NOTES = sweepNotes();
const countCites = (s) => (s.match(/\[c\]/g) || []).length;
const visibleLength = (s) => s.replace(/\[c\]/g, '').replace(/\s+/g, ' ').trim().length;

describe('U1 · a note is a lead plus a detail, never one paragraph', () => {
  it('the sweep actually reaches the note-carrying branches', () => {
    // Guards against the sweep silently going empty and every invariant below
    // passing vacuously.
    expect(NOTES.length).toBeGreaterThan(25);
  });

  for (const { note, noteCites, where } of NOTES) {
    describe(where, () => {
      it('is an object with both halves, each non-empty', () => {
        expect(typeof note, `note is still a bare string: ${JSON.stringify(note).slice(0, 120)}`).toBe('object');
        expect(typeof note.lead).toBe('string');
        expect(typeof note.detail).toBe('string');
        expect(note.lead.trim().length, 'lead is empty').toBeGreaterThan(0);
        // Owner decision: every card that has a note has a "Why this" link, so
        // a detail is not optional.
        expect(note.detail.trim().length, 'detail is empty — every note gets a "Why this"').toBeGreaterThan(0);
      });

      it(`lead is at most ${LEAD_MAX} characters`, () => {
        expect(
          visibleLength(note.lead),
          `lead is ${visibleLength(note.lead)} chars:\n  ${note.lead}`,
        ).toBeLessThanOrEqual(LEAD_MAX);
      });

      it('lead and detail say different things', () => {
        expect(note.detail.trim()).not.toBe(note.lead.trim());
      });

      it('noteCites still has exactly one entry per [c], counting lead then detail', () => {
        expect(countCites(note.lead) + countCites(note.detail)).toBe(noteCites.length);
      });
    });
  }
});
