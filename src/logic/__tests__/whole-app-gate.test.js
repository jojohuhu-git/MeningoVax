// ── Whole-app checks: the parts that pass today (port Phase 1.4, 2026-11-15) ──
//
// `scripts/wholeApp/` follows every saved and typical patient down every road
// the app advises and asks seven questions of the app's own answers
// (`npm run whole-app`). Some still flag known findings, listed for the owner in
// docs/archive/report-2026-11-15-whole-app-checks.md, and those stay OUT of
// this suite until they are decided and fixed. This file holds only what is at
// zero today, so a red here is always a NEW fault. Each part below was shown
// to fail by breaking the app on purpose (the report quotes each break).
//
// The forward checks follow every 20th patient: the full run is a million
// screens and takes about a minute on all cores, too slow for every test run.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { allPatients, cardsOf, readCard, walk } from '../../../scripts/wholeApp/replay.mjs';
import {
  ageLineCheck, doseLineCases, doseLineCheck, newTally, replayChecks, stableOverTime,
} from '../../../scripts/wholeApp/checks.mjs';

const patients = allPatients();
const sample = patients.filter((_, i) => i % 20 === 0);

/** Run some checks and return every (check, kind) that flagged, with one example. */
function flagged(run) {
  const tally = newTally();
  run(tally);
  return tally.rows().map((r) => `${r.check} ${r.kind} — ${r.group} — e.g. ${r.examples[0]?.key}`);
}
const only = (rows, checks, kinds = null) => rows.filter((r) => {
  const [check, kind] = r.split(' ');
  return checks.includes(check) && (!kinds || kinds.some((k) => kind.startsWith(k)));
});

describe('the walk can read the app', () => {
  it('every card on every patient\'s first screen is one the walk understands (no date is guessed)', () => {
    const unread = [];
    for (const p of patients) {
      const r = recommend(p.input);
      for (const c of cardsOf(r)) if (readCard(c, p.input.today).kind === 'unreadable') unread.push(`${p.key}: ${c.doseLabel}`);
    }
    expect(unread).toEqual([]);
  });

  it('a card that asks for a dose with no date is reported, never read as "today"', () => {
    expect(readCard({ status: 'risk-based', dueToday: false, earliestNextDate: null }, '2026-09-15')).toEqual({ kind: 'unreadable' });
  });
});

describe('following the advice forward (every 20th patient)', () => {
  const rows = flagged((tally) => {
    const visitor = replayChecks(tally, new Set([1, 2, 3, 4, 5, 7]));
    for (const p of sample) { tally.setPatient(p); walk(p, visitor); }
  });

  it('the walk never gets stuck: no unreadable card, no road past the dose cap', () => {
    expect(only(rows, ['harness'])).toEqual([]);
  });

  it('2 — the plan holds: no "final dose" followed by another, no series that grows partway', () => {
    expect(only(rows, ['2'])).toEqual([]);
  });

  it('4 — one pentavalent dose and the two separate shots lead to the same next screen', () => {
    expect(only(rows, ['4'])).toEqual([]);
  });

  it('5 — a card\'s "Dose k of N" matches the doses the chips count, and a shown booster date is the day it is asked', () => {
    expect(only(rows, ['5'], ['card-dose-number', 'booster-asked-on-another-day'])).toEqual([]);
  });

  it('7 — a dated card still says DUE on the date it named', () => {
    expect(only(rows, ['7'], ['advice-moved', 'advice-gone', 'advised-day-arrives'])).toEqual([]);
  });
});

describe('6 — age lines are clean', () => {
  it('on a birthday line the answer matches the day after, and only today\'s doses move across it', () => {
    const rows = flagged((tally) => {
      for (const p of patients) { tally.setPatient(p); ageLineCheck(tally, p); }
    });
    expect(only(rows, ['6'], ['on-the-birthday-differs', 'line-changes-a-dose-given-before-today'])).toEqual([]);
  });

  it('a dose given ON an age line reads the same as one given the day after', () => {
    const rows = flagged((tally) => {
      for (const c of doseLineCases()) {
        tally.setPatient({ key: `dose-line|${c.brand}@${c.L}m|${c.prior.name}|r:${c.riskIds.join('+')}`, group: 'typical', input: { riskIds: c.riskIds, ageMonths: c.L, dob: '2000-03-10', today: '' } });
        doseLineCheck(tally, c);
      }
    });
    expect(only(rows, ['6'], ['dose-on-the-line-differs'])).toEqual([]);
  });
});

describe('7 — stable over time (every 20th patient)', () => {
  it('looking at the same record later never changes whether a recorded dose counted', () => {
    const rows = flagged((tally) => {
      for (const p of sample) { tally.setPatient(p); stableOverTime(tally, p); }
    });
    expect(only(rows, ['7'], ['recorded-dose-verdict-changed', 'due-today-stopped-being-due', 'status-changed-with-no-age-line'])).toEqual([]);
  });
});
